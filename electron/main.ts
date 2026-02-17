import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import {
  assertAcceptedCurrentCompliance,
  assertConsentVersionMatches,
  buildAcceptedCompliance
} from "../src/main/compliance-guard";
import { loadCatalog } from "../src/main/catalog-store";
import { loadComplianceConfig, resolveAppResource } from "../src/main/compliance-store";
import { InstallEngine } from "../src/main/install-engine";
import { FileLogger } from "../src/main/logger";
import { loadMonetizationConfig } from "../src/main/monetization-store";
import { runPostConfiguration } from "../src/main/post-config";
import { loadPresets } from "../src/main/preset-store";
import { SettingsStore } from "../src/main/settings-store";
import { runRuntimeDllRepairSteps } from "../src/main/system-repair";
import type { ComplianceConfig, DevHubSettings, RuntimeDllRepairResult, StartInstallOptions } from "../src/shared/types";

let mainWindow: BrowserWindow | null = null;

function isAdminWindows(): boolean {
  if (process.platform !== "win32") {
    return true;
  }
  const cmd = "[bool](([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))";
  const result = spawnSync("powershell", ["-NoProfile", "-Command", cmd], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim().toLowerCase() === "true";
}

function relaunchAsAdmin(): void {
  if (process.platform !== "win32") {
    return;
  }

  const exePath = process.execPath;
  const args = app.isPackaged ? [] : process.argv.slice(1);
  const escapedArgs = args.map((arg) => `'${arg.replace(/'/g, "''")}'`).join(", ");
  const argumentListPart = escapedArgs.length > 0 ? ` -ArgumentList ${escapedArgs}` : "";
  const psScript = `
    $ErrorActionPreference = 'Stop'
    try {
      Start-Process -Verb RunAs -FilePath '${exePath.replace(/'/g, "''")}'${argumentListPart}
      exit 0
    } catch {
      Write-Output $_.Exception.Message
      exit 1
    }
  `;
  const result = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript], {
    encoding: "utf8",
    windowsHide: true,
    shell: false
  });
  if (result.status !== 0) {
    const message = (result.stdout || result.stderr || "Failed to request administrator permission.").trim();
    throw new Error(message);
  }
}

function createMainWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, "preload.js");
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#f2f4f8",
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    const indexPath = path.join(app.getAppPath(), "dist", "index.html");
    win.loadFile(indexPath);
  }

  return win;
}

async function ensureAdminGate(): Promise<boolean> {
  if (process.platform !== "win32") {
    return true;
  }
  if (isAdminWindows()) {
    return true;
  }

  try {
    relaunchAsAdmin();
  } catch (error) {
    await dialog.showMessageBox({
      type: "warning",
      title: "DevHub",
      message: "Administrator permission is required to continue.",
      detail: error instanceof Error ? error.message : String(error),
      buttons: ["Exit"],
      cancelId: 0,
      defaultId: 0
    });
  }
  return false;
}

async function bootstrap(): Promise<void> {
  await app.whenReady();

  const pass = await ensureAdminGate();
  if (!pass) {
    app.quit();
    return;
  }

  const settingsStore = new SettingsStore();
  const logBaseDir = app.isPackaged ? app.getPath("userData") : process.cwd();
  const logger = new FileLogger(logBaseDir);
  const catalog = loadCatalog();
  const presets = loadPresets();
  const monetization = loadMonetizationConfig();
  const compliance = loadComplianceConfig();
  const allowedHosts = new Set<string>(
    compliance.externalHostAllowlist.map((host) => host.toLowerCase().trim()).filter((host) => host.length > 0)
  );
  for (const item of catalog) {
    if (!item.manualUrl) continue;
    try {
      const host = new URL(item.manualUrl).hostname.toLowerCase();
      allowedHosts.add(host);
    } catch {
      logger.log(`Invalid manualUrl in catalog: ${item.id} -> ${item.manualUrl}`);
    }
  }
  if (monetization.enableBuyMeACoffee) {
    try {
      const host = new URL(monetization.buyMeACoffeeUrl).hostname.toLowerCase();
      allowedHosts.add(host);
    } catch {
      logger.log(`Invalid buyMeACoffeeUrl: ${monetization.buyMeACoffeeUrl}`);
    }
  }
  const isExternalUrlAllowed = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      if (!/^https?:$/i.test(parsed.protocol)) {
        return false;
      }
      return allowedHosts.has(parsed.hostname.toLowerCase());
    } catch {
      return false;
    }
  };
  const safeOpenExternal = async (url: string): Promise<void> => {
    if (!isExternalUrlAllowed(url)) {
      logger.log(`Blocked external URL by compliance policy: ${url}`);
      throw new Error("External URL blocked by compliance policy.");
    }
    await shell.openExternal(url);
  };
  const emitInstallEvent = (event: {
    status: "queued" | "running" | "manual_required" | "success" | "skipped_installed" | "failed" | "completed";
    itemId: string;
    timestamp: string;
    message: string;
    exitCode?: number;
  }) => {
    if (mainWindow) {
      mainWindow.webContents.send("devhub:install-event", event);
    }
  };
  const emitSimpleEvent = (
    status: "queued" | "running" | "manual_required" | "success" | "skipped_installed" | "failed" | "completed",
    itemId: string,
    message: string,
    exitCode?: number
  ) => {
    emitInstallEvent({
      status,
      itemId,
      message,
      exitCode,
      timestamp: new Date().toISOString()
    });
  };
  const catalogIds = new Set(catalog.map((item) => item.id));
  for (const preset of presets) {
    const missing = preset.packageIds.filter((id) => !catalogIds.has(id));
    if (missing.length > 0) {
      logger.log(`Preset ${preset.id} has unknown package ids: ${missing.join(", ")}`);
    }
  }
  const engine = new InstallEngine(
    catalog,
    (event) => emitInstallEvent(event),
    undefined,
    logger,
    (item) => {
      if (item.manualUrl) {
        void safeOpenExternal(item.manualUrl).catch((error) => {
          logger.log(`Failed to open manual URL for ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
    }
  );

  ipcMain.handle("devhub:get-catalog", () => catalog);
  ipcMain.handle("devhub:get-presets", () => presets);
  ipcMain.handle("devhub:get-monetization", () => monetization);
  ipcMain.handle("devhub:get-compliance-config", (): ComplianceConfig => compliance);
  ipcMain.handle("devhub:get-settings", () => settingsStore.get());
  ipcMain.handle("devhub:save-settings", (_event, settings: DevHubSettings) => settingsStore.save(settings));
  ipcMain.handle("devhub:accept-compliance", (_event, consentVersion: string) => {
    assertConsentVersionMatches(consentVersion, compliance);
    const current = settingsStore.get();
    const next: DevHubSettings = {
      ...current,
      compliance: buildAcceptedCompliance(compliance)
    };
    return settingsStore.save(next);
  });
  ipcMain.handle("devhub:preflight", () => engine.preflightCheck(settingsStore.get()));
  ipcMain.handle("devhub:start-install", (_event, selectedIds: string[], options: StartInstallOptions | undefined) => {
    const currentSettings = settingsStore.get();
    assertAcceptedCurrentCompliance(currentSettings, compliance, "installation");
    return engine.startInstall(selectedIds, options, currentSettings);
  });
  ipcMain.handle("devhub:retry-failed", () => {
    const currentSettings = settingsStore.get();
    assertAcceptedCurrentCompliance(currentSettings, compliance, "retry");
    return engine.retryFailed(currentSettings);
  });
  ipcMain.handle("devhub:cancel-install", () => {
    engine.cancelInstall();
  });
  ipcMain.handle("devhub:run-post-config", (_event, options) => runPostConfiguration(options, logger));
  ipcMain.handle("devhub:open-external", (_event, url: string) => {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("Invalid external URL");
    }
    return safeOpenExternal(url);
  });
  ipcMain.handle("devhub:open-legal-doc", async (_event, docKey: "terms" | "privacy" | "thirdParty" | "disclaimer") => {
    const relativePath = compliance.legalDocs[docKey];
    const resolvedPath = resolveAppResource(relativePath);
    if (!resolvedPath) {
      throw new Error(`Legal document not found: ${docKey}`);
    }

    let openPath = resolvedPath;
    if (resolvedPath.includes(".asar")) {
      const cacheDir = path.join(app.getPath("userData"), "legal-docs");
      mkdirSync(cacheDir, { recursive: true });
      const cachedPath = path.join(cacheDir, path.basename(relativePath));
      const content = readFileSync(resolvedPath, "utf8");
      writeFileSync(cachedPath, content, "utf8");
      openPath = cachedPath;
    }

    const error = await shell.openPath(openPath);
    if (error) {
      if (process.platform === "win32") {
        spawn("notepad.exe", [openPath], {
          detached: true,
          windowsHide: true,
          stdio: "ignore"
        }).unref();
        return;
      }
      throw new Error(error);
    }
  });
  ipcMain.handle("devhub:run-runtime-dll-repair", async (): Promise<RuntimeDllRepairResult> => {
    const currentSettings = settingsStore.get();
    assertAcceptedCurrentCompliance(currentSettings, compliance, "runtime repair");

    const settings = settingsStore.get();
    const runtimePreset = presets.find((preset) => preset.id === "runtime-dll-repair");
    if (!runtimePreset) {
      throw new Error("Runtime preset not found: runtime-dll-repair");
    }

    emitSimpleEvent("running", "runtime-dll-repair", "Runtime/DLL repair started.");
    const installSummary = await engine.startInstall(runtimePreset.packageIds, { suppressCompletedEvent: true }, settings);

    const stepResults = await runRuntimeDllRepairSteps(logger, (status, itemId, message, exitCode) => {
      emitSimpleEvent(status, itemId, message, exitCode);
    });

    const success = installSummary.failedIds.length === 0 && stepResults.every((step) => step.success);
    emitSimpleEvent(
      "completed",
      "runtime-dll-repair",
      `Runtime/DLL repair completed. success=${success}, failedPackages=${installSummary.failedIds.length}`
    );
    return {
      success,
      installSummary,
      steps: stepResults
    };
  });

  mainWindow = createMainWindow();
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.once("did-finish-load", () => {
    mainWindow?.webContents.send("devhub:install-event", {
      status: "completed",
      itemId: "system",
      timestamp: new Date().toISOString(),
      message: `Log file: ${engine.getLogPath()}`
    });
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

bootstrap().catch((error) => {
  dialog.showErrorBox("DevHub startup error", error instanceof Error ? error.message : String(error));
  app.quit();
});
