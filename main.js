"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_node_path8 = __toESM(require("path"));
var import_node_child_process4 = require("child_process");
var import_node_fs8 = require("fs");
var import_electron6 = require("electron");

// src/main/catalog-store.ts
var import_node_fs = require("fs");
var import_node_path = __toESM(require("path"));
var import_electron = require("electron");

// src/main/catalog-schema.ts
var import_zod = require("zod");
var softwareCategorySchema = import_zod.z.enum(["browser", "dev", "runtime", "collab", "utility", "database", "creative", "music"]);
var softwareItemBaseSchema = import_zod.z.object({
  id: import_zod.z.string().min(1),
  name: import_zod.z.object({
    zh: import_zod.z.string().min(1),
    en: import_zod.z.string().min(1)
  }),
  category: softwareCategorySchema,
  exact: import_zod.z.boolean(),
  requiresAdmin: import_zod.z.boolean(),
  enabledByDefault: import_zod.z.boolean()
});
var wingetSoftwareItemSchema = softwareItemBaseSchema.extend({
  installType: import_zod.z.literal("winget").optional().default("winget"),
  wingetId: import_zod.z.string().min(1),
  manualUrl: import_zod.z.string().url().optional()
});
var manualSoftwareItemSchema = softwareItemBaseSchema.extend({
  installType: import_zod.z.literal("manual"),
  wingetId: import_zod.z.string().optional(),
  manualUrl: import_zod.z.string().url()
});
var softwareItemSchema = import_zod.z.union([wingetSoftwareItemSchema, manualSoftwareItemSchema]);
var catalogSchema = import_zod.z.array(softwareItemSchema).min(1).refine((items) => new Set(items.map((item) => item.id)).size === items.length, "Duplicate software id");
function validateCatalog(input) {
  return catalogSchema.parse(input);
}

// src/main/catalog-store.ts
function resolveCatalogPath() {
  const candidates = [
    import_node_path.default.join(import_electron.app.getAppPath(), "config", "software-catalog.json"),
    import_node_path.default.join(process.cwd(), "config", "software-catalog.json"),
    import_node_path.default.join(import_node_path.default.dirname(import_electron.app.getAppPath()), "config", "software-catalog.json")
  ];
  for (const candidate of candidates) {
    if ((0, import_node_fs.existsSync)(candidate)) {
      return candidate;
    }
  }
  throw new Error("Cannot locate config/software-catalog.json");
}
function loadCatalog() {
  const catalogPath = resolveCatalogPath();
  const content = (0, import_node_fs.readFileSync)(catalogPath, "utf8");
  const parsed = JSON.parse(content);
  return validateCatalog(parsed);
}

// src/main/compliance-store.ts
var import_node_fs2 = require("fs");
var import_node_path2 = __toESM(require("path"));
var import_electron2 = require("electron");
var import_zod2 = require("zod");
var complianceSchema = import_zod2.z.object({
  consentVersion: import_zod2.z.string().min(1),
  sourcePolicy: import_zod2.z.string().min(1),
  externalHostAllowlist: import_zod2.z.array(import_zod2.z.string().min(1)),
  legalDocs: import_zod2.z.object({
    terms: import_zod2.z.string().min(1),
    privacy: import_zod2.z.string().min(1),
    thirdParty: import_zod2.z.string().min(1),
    disclaimer: import_zod2.z.string().min(1)
  })
});
function resolveAppResource(relativePath) {
  const candidates = [
    import_node_path2.default.join(process.resourcesPath, relativePath),
    import_node_path2.default.join(import_electron2.app.getAppPath(), relativePath),
    import_node_path2.default.join(process.cwd(), relativePath),
    import_node_path2.default.join(import_node_path2.default.dirname(import_electron2.app.getAppPath()), relativePath)
  ];
  for (const candidate of candidates) {
    if ((0, import_node_fs2.existsSync)(candidate)) {
      return candidate;
    }
  }
  return null;
}
function loadComplianceConfig() {
  const configPath = resolveAppResource(import_node_path2.default.join("config", "compliance.json"));
  if (!configPath) {
    throw new Error("Cannot locate config/compliance.json");
  }
  const content = (0, import_node_fs2.readFileSync)(configPath, "utf8");
  const parsed = JSON.parse(content);
  return complianceSchema.parse(parsed);
}

// src/main/install-engine.ts
var import_node_child_process = require("child_process");

// src/main/install-queue.ts
function buildRetryQueue(failedIds, catalog) {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const visited = /* @__PURE__ */ new Set();
  const queue = [];
  for (const id of failedIds) {
    if (visited.has(id)) {
      continue;
    }
    visited.add(id);
    const item = byId.get(id);
    if (item) {
      queue.push(item);
    }
  }
  return queue;
}

// src/main/logger.ts
var import_node_fs3 = require("fs");
var import_node_path3 = __toESM(require("path"));
function timeStamp() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function fileStamp() {
  const now = /* @__PURE__ */ new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const hh = now.getHours().toString().padStart(2, "0");
  const mi = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}
var FileLogger = class {
  constructor(baseDir) {
    const logDir = import_node_path3.default.join(baseDir, "logs");
    (0, import_node_fs3.mkdirSync)(logDir, { recursive: true });
    this.filePath = import_node_path3.default.join(logDir, `devhub-${fileStamp()}.log`);
    this.log("Logger initialized.");
  }
  getLogPath() {
    return this.filePath;
  }
  log(line) {
    (0, import_node_fs3.appendFileSync)(this.filePath, `[${timeStamp()}] ${line}
`, "utf8");
  }
  logCommand(command, args, result) {
    const output = `${result.stdout}
${result.stderr}`.trim();
    const summary = output.length > 2e3 ? `${output.slice(0, 2e3)} ...` : output;
    this.log(`$ ${command} ${args.join(" ")}`);
    this.log(`ExitCode: ${result.code}`);
    if (summary) {
      this.log(`Output: ${summary}`);
    }
  }
};
var NullLogger = {
  getLogPath: () => "",
  log: () => void 0,
  logCommand: () => void 0
};

// src/main/network.ts
var import_promises = __toESM(require("dns/promises"));
function applyProxyEnv(settings, baseEnv = process.env) {
  const env = { ...baseEnv };
  if (!settings.proxy.enabled) {
    return env;
  }
  if (settings.proxy.http) {
    env.HTTP_PROXY = settings.proxy.http;
    env.http_proxy = settings.proxy.http;
  }
  if (settings.proxy.https) {
    env.HTTPS_PROXY = settings.proxy.https;
    env.https_proxy = settings.proxy.https;
  }
  return env;
}
async function checkNetworkHealth() {
  try {
    await import_promises.default.lookup("www.microsoft.com");
    return { healthy: true, detail: "DNS lookup for www.microsoft.com succeeded." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error.";
    return { healthy: false, detail: `DNS lookup failed: ${message}` };
  }
}

// src/main/install-engine.ts
var defaultRunner = {
  run(command, args, env) {
    return new Promise((resolve) => {
      const child = (0, import_node_child_process.spawn)(command, args, {
        env: env ?? process.env,
        windowsHide: true,
        shell: false
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        resolve({ code: -1, stdout, stderr: error.message });
      });
      child.on("close", (code) => {
        resolve({ code: code ?? -1, stdout, stderr });
      });
    });
  }
};
var InstallEngine = class {
  constructor(catalog, emit, runner = defaultRunner, logger = NullLogger, onManualRequired) {
    this.isRunning = false;
    this.cancelRequested = false;
    this.failedIds = [];
    this.catalogById = new Map(catalog.map((item) => [item.id, item]));
    this.runner = runner;
    this.logger = logger;
    this.emit = emit;
    this.onManualRequired = onManualRequired;
  }
  getFailedIds() {
    return [...this.failedIds];
  }
  getLogPath() {
    return this.logger.getLogPath();
  }
  cancelInstall() {
    this.cancelRequested = true;
    this.logger.log("Cancel requested by user.");
  }
  async preflightCheck(settings) {
    const env = applyProxyEnv(settings);
    const details = [];
    const wingetVersion = await this.runner.run("winget", ["--version"], env);
    const wingetAvailable = wingetVersion.code === 0;
    details.push(
      wingetAvailable ? `winget available: ${wingetVersion.stdout.trim()}` : `winget unavailable: ${wingetVersion.stderr || wingetVersion.stdout}`
    );
    const sourceResult = await this.runner.run("winget", ["source", "list"], env);
    const sourceHealthy = sourceResult.code === 0 && sourceResult.stdout.toLowerCase().includes("winget");
    details.push(sourceHealthy ? "winget source check passed." : "winget source check failed.");
    const network = await checkNetworkHealth();
    details.push(network.detail);
    return {
      wingetAvailable,
      sourceHealthy,
      networkHealthy: network.healthy,
      details
    };
  }
  async startInstall(selectedIds, options, settings) {
    if (this.isRunning) {
      throw new Error("Install task already running.");
    }
    const queue = selectedIds.map((id) => this.catalogById.get(id)).filter((item) => Boolean(item));
    const env = applyProxyEnv(settings);
    this.isRunning = true;
    this.cancelRequested = false;
    this.failedIds = [];
    this.logger.log(`Start install. total=${queue.length}, dryRun=${options?.dryRun ? "true" : "false"}`);
    for (const item of queue) {
      const target = item.installType === "manual" ? item.manualUrl ?? item.id : item.wingetId ?? item.id;
      this.emitEvent("queued", item.id, `Queued ${target}`);
    }
    let processed = 0;
    for (const item of queue) {
      if (this.cancelRequested) {
        this.logger.log("Install loop stopped due to cancel flag.");
        break;
      }
      if (item.installType === "manual") {
        processed += 1;
        if (item.manualUrl && this.onManualRequired) {
          this.onManualRequired(item);
        }
        this.emitEvent(
          "manual_required",
          item.id,
          item.manualUrl ? `Manual install required: ${item.manualUrl}` : "Manual install required"
        );
        continue;
      }
      const wingetId = item.wingetId;
      if (!wingetId) {
        processed += 1;
        this.failedIds.push(item.id);
        this.emitEvent("failed", item.id, "Missing winget package id.");
        continue;
      }
      this.emitEvent("running", item.id, `Installing ${wingetId}`);
      this.logger.log(`Installing ${wingetId}`);
      const installed = await this.isAlreadyInstalled(item, env);
      if (installed) {
        processed += 1;
        this.emitEvent("skipped_installed", item.id, `Already installed: ${wingetId}`);
        continue;
      }
      if (options?.dryRun) {
        processed += 1;
        this.emitEvent("success", item.id, `Dry run success: ${wingetId}`);
        continue;
      }
      const args = [
        "install",
        "--id",
        wingetId,
        ...item.exact ? ["--exact"] : [],
        "--silent",
        "--accept-source-agreements",
        "--accept-package-agreements"
      ];
      const result = await this.runner.run("winget", args, env);
      this.logger.logCommand("winget", args, result);
      processed += 1;
      if (result.code === 0) {
        this.emitEvent("success", item.id, `Installed ${wingetId}`, result.code);
      } else {
        this.failedIds.push(item.id);
        this.emitEvent(
          "failed",
          item.id,
          result.stderr.trim() || result.stdout.trim() || `Install failed for ${wingetId}`,
          result.code
        );
      }
    }
    this.isRunning = false;
    const summary = {
      failedIds: [...this.failedIds],
      cancelled: this.cancelRequested,
      total: queue.length,
      processed
    };
    if (!options?.suppressCompletedEvent) {
      this.emitEvent(
        "completed",
        "system",
        `Completed. processed=${summary.processed}, failed=${summary.failedIds.length}, cancelled=${summary.cancelled}`
      );
    }
    this.logger.log(`Install completed. ${JSON.stringify(summary)}`);
    return summary;
  }
  async retryFailed(settings) {
    const retryQueue = buildRetryQueue(this.failedIds, Array.from(this.catalogById.values())).map((item) => item.id);
    if (retryQueue.length === 0) {
      const summary = { failedIds: [], cancelled: false, total: 0, processed: 0 };
      this.emitEvent("completed", "system", "No failed items to retry.");
      return summary;
    }
    return this.startInstall(retryQueue, void 0, settings);
  }
  emitEvent(status, itemId, message, exitCode) {
    this.emit({
      status,
      itemId,
      message,
      exitCode,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  async isAlreadyInstalled(item, env) {
    if (item.installType === "manual") {
      return false;
    }
    if (!item.wingetId) {
      return false;
    }
    const args = ["list", "--id", item.wingetId, ...item.exact ? ["--exact"] : []];
    const result = await this.runner.run("winget", args, env);
    this.logger.logCommand("winget", args, result);
    if (result.code !== 0) {
      return false;
    }
    const text = `${result.stdout}
${result.stderr}`.toLowerCase();
    return text.includes(item.wingetId.toLowerCase());
  }
};

// src/main/monetization-store.ts
var import_node_fs4 = require("fs");
var import_node_path4 = __toESM(require("path"));
var import_electron3 = require("electron");
var import_zod3 = require("zod");
var monetizationSchema = import_zod3.z.object({
  buyMeACoffeeUrl: import_zod3.z.string().url(),
  enableBuyMeACoffee: import_zod3.z.boolean()
});
function resolveMonetizationPath() {
  const candidates = [
    import_node_path4.default.join(import_electron3.app.getAppPath(), "config", "monetization.json"),
    import_node_path4.default.join(process.cwd(), "config", "monetization.json"),
    import_node_path4.default.join(import_node_path4.default.dirname(import_electron3.app.getAppPath()), "config", "monetization.json")
  ];
  for (const candidate of candidates) {
    if ((0, import_node_fs4.existsSync)(candidate)) {
      return candidate;
    }
  }
  return null;
}
function loadMonetizationConfig() {
  const defaultConfig = {
    buyMeACoffeeUrl: "https://buymeacoffee.com/devhub",
    enableBuyMeACoffee: true
  };
  const configPath = resolveMonetizationPath();
  if (!configPath) {
    return defaultConfig;
  }
  try {
    const content = (0, import_node_fs4.readFileSync)(configPath, "utf8");
    const parsed = JSON.parse(content);
    return monetizationSchema.parse(parsed);
  } catch {
    return defaultConfig;
  }
}

// src/main/post-config.ts
var import_node_fs5 = require("fs");
var import_node_path5 = __toESM(require("path"));
var import_node_child_process2 = require("child_process");
async function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = (0, import_node_child_process2.spawn)(command, args, {
      windowsHide: true,
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ code: -1, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}
async function runPostConfiguration(options, logger) {
  const steps = [];
  if (options.gitName) {
    const result = await runCommand("git", ["config", "--global", "user.name", options.gitName]);
    const success = result.code === 0;
    logger.log(`PostConfig git user.name: ${success ? "ok" : "failed"} (${result.code})`);
    steps.push({
      name: "git.user.name",
      success,
      message: success ? "Configured git user.name." : result.stderr || result.stdout || "Failed to configure."
    });
  }
  if (options.gitEmail) {
    const result = await runCommand("git", ["config", "--global", "user.email", options.gitEmail]);
    const success = result.code === 0;
    logger.log(`PostConfig git user.email: ${success ? "ok" : "failed"} (${result.code})`);
    steps.push({
      name: "git.user.email",
      success,
      message: success ? "Configured git user.email." : result.stderr || result.stdout || "Failed to configure."
    });
  }
  const sshDir = import_node_path5.default.join(process.env.USERPROFILE ?? "", ".ssh");
  try {
    if (!(0, import_node_fs5.existsSync)(sshDir)) {
      (0, import_node_fs5.mkdirSync)(sshDir, { recursive: true });
    }
    steps.push({
      name: "ssh.directory",
      success: true,
      message: `SSH directory ensured at ${sshDir}`
    });
    logger.log(`PostConfig ssh directory ensured: ${sshDir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    steps.push({
      name: "ssh.directory",
      success: false,
      message
    });
    logger.log(`PostConfig ssh directory failed: ${message}`);
  }
  const toolChecks = ["git", "node", "python"];
  for (const tool of toolChecks) {
    const result = await runCommand("where", [tool]);
    const success = result.code === 0;
    steps.push({
      name: `path.check.${tool}`,
      success,
      message: success ? result.stdout.trim() : `${tool} not found in PATH`
    });
    logger.log(`PostConfig PATH check ${tool}: ${success ? "ok" : "missing"}`);
  }
  return {
    success: steps.every((step) => step.success),
    steps
  };
}

// src/main/preset-store.ts
var import_node_fs6 = require("fs");
var import_node_path6 = __toESM(require("path"));
var import_electron4 = require("electron");
var import_zod4 = require("zod");
var presetSchema = import_zod4.z.object({
  id: import_zod4.z.string().min(1),
  name: import_zod4.z.object({
    zh: import_zod4.z.string().min(1),
    en: import_zod4.z.string().min(1)
  }),
  description: import_zod4.z.object({
    zh: import_zod4.z.string().min(1),
    en: import_zod4.z.string().min(1)
  }).optional(),
  packageIds: import_zod4.z.array(import_zod4.z.string().min(1)).min(1)
});
var presetsSchema = import_zod4.z.array(presetSchema).min(1).refine((items) => new Set(items.map((item) => item.id)).size === items.length, "Duplicate preset id");
function resolvePresetsPath() {
  const candidates = [
    import_node_path6.default.join(import_electron4.app.getAppPath(), "config", "presets.json"),
    import_node_path6.default.join(process.cwd(), "config", "presets.json"),
    import_node_path6.default.join(import_node_path6.default.dirname(import_electron4.app.getAppPath()), "config", "presets.json")
  ];
  for (const candidate of candidates) {
    if ((0, import_node_fs6.existsSync)(candidate)) {
      return candidate;
    }
  }
  throw new Error("Cannot locate config/presets.json");
}
function loadPresets() {
  const presetsPath = resolvePresetsPath();
  const content = (0, import_node_fs6.readFileSync)(presetsPath, "utf8");
  const parsed = JSON.parse(content);
  return presetsSchema.parse(parsed);
}

// src/main/settings-store.ts
var import_node_fs7 = require("fs");
var import_node_path7 = __toESM(require("path"));
var import_electron5 = require("electron");
function loadDefaultSettings() {
  const candidates = [
    import_node_path7.default.join(import_electron5.app.getAppPath(), "config", "default-settings.json"),
    import_node_path7.default.join(process.cwd(), "config", "default-settings.json"),
    import_node_path7.default.join(import_node_path7.default.dirname(import_electron5.app.getAppPath()), "config", "default-settings.json")
  ];
  const defaultPath = candidates.find((candidate) => (0, import_node_fs7.existsSync)(candidate));
  if (!defaultPath) {
    throw new Error("Cannot locate config/default-settings.json");
  }
  const content = (0, import_node_fs7.readFileSync)(defaultPath, "utf8");
  return JSON.parse(content);
}
var SettingsStore = class {
  constructor() {
    this.defaults = loadDefaultSettings();
    const baseDir = import_electron5.app.getPath("userData");
    (0, import_node_fs7.mkdirSync)(baseDir, { recursive: true });
    this.settingsPath = import_node_path7.default.join(baseDir, "settings.json");
  }
  get() {
    if (!(0, import_node_fs7.existsSync)(this.settingsPath)) {
      return this.defaults;
    }
    try {
      const stored = JSON.parse((0, import_node_fs7.readFileSync)(this.settingsPath, "utf8"));
      return {
        ...this.defaults,
        ...stored,
        proxy: {
          ...this.defaults.proxy,
          ...stored.proxy ?? {}
        },
        compliance: {
          ...this.defaults.compliance,
          ...stored.compliance ?? {}
        }
      };
    } catch {
      return this.defaults;
    }
  }
  save(nextSettings) {
    const merged = {
      ...this.defaults,
      ...nextSettings,
      proxy: {
        ...this.defaults.proxy,
        ...nextSettings.proxy ?? {}
      },
      compliance: {
        ...this.defaults.compliance,
        ...nextSettings.compliance ?? {}
      }
    };
    (0, import_node_fs7.writeFileSync)(this.settingsPath, JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
};

// src/main/system-repair.ts
var import_node_child_process3 = require("child_process");
async function runCommand2(command, args) {
  return new Promise((resolve) => {
    const child = (0, import_node_child_process3.spawn)(command, args, {
      windowsHide: true,
      shell: false
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ code: -1, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? -1, stdout, stderr });
    });
  });
}
async function runRuntimeDllRepairSteps(logger, emit) {
  const steps = [
    {
      name: "sfc.scannow",
      itemId: "dll-sfc-scan",
      command: "sfc",
      args: ["/scannow"]
    },
    {
      name: "dism.restorehealth",
      itemId: "dll-dism-restorehealth",
      command: "DISM",
      args: ["/Online", "/Cleanup-Image", "/RestoreHealth"]
    }
  ];
  const results = [];
  for (const step of steps) {
    emit("running", step.itemId, `Running ${step.command} ${step.args.join(" ")}`);
    logger.log(`Runtime DLL repair step start: ${step.name}`);
    const result = await runCommand2(step.command, step.args);
    logger.logCommand(step.command, step.args, result);
    const success = result.code === 0;
    const message = success ? `${step.name} completed.` : result.stderr.trim() || result.stdout.trim() || `${step.name} failed.`;
    emit(success ? "success" : "failed", step.itemId, message, result.code);
    results.push({
      name: step.name,
      success,
      message,
      exitCode: result.code
    });
  }
  return results;
}

// electron/main.ts
var mainWindow = null;
function isAdminWindows() {
  if (process.platform !== "win32") {
    return true;
  }
  const cmd = "[bool](([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))";
  const result = (0, import_node_child_process4.spawnSync)("powershell", ["-NoProfile", "-Command", cmd], { encoding: "utf8" });
  return result.status === 0 && result.stdout.trim().toLowerCase() === "true";
}
function relaunchAsAdmin() {
  if (process.platform !== "win32") {
    return;
  }
  const exePath = process.execPath;
  const args = import_electron6.app.isPackaged ? [] : process.argv.slice(1);
  const escapedArgs = args.map((arg) => `'${arg.replace(/'/g, "''")}'`).join(", ");
  const argumentListPart = escapedArgs.length > 0 ? ` -ArgumentList ${escapedArgs}` : "";
  const psScript = `Start-Process -Verb RunAs -FilePath '${exePath.replace(/'/g, "''")}'${argumentListPart}`;
  (0, import_node_child_process4.spawn)("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript], {
    detached: true,
    windowsHide: true,
    stdio: "ignore"
  }).unref();
}
function createMainWindow() {
  const preloadPath = import_node_path8.default.join(__dirname, "preload.js");
  const win = new import_electron6.BrowserWindow({
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
    const indexPath = import_node_path8.default.join(import_electron6.app.getAppPath(), "dist", "index.html");
    win.loadFile(indexPath);
  }
  return win;
}
async function ensureAdminGate() {
  if (process.platform !== "win32") {
    return true;
  }
  if (isAdminWindows()) {
    return true;
  }
  relaunchAsAdmin();
  return false;
}
async function bootstrap() {
  await import_electron6.app.whenReady();
  const pass = await ensureAdminGate();
  if (!pass) {
    import_electron6.app.quit();
    return;
  }
  const settingsStore = new SettingsStore();
  const logBaseDir = import_electron6.app.isPackaged ? import_electron6.app.getPath("userData") : process.cwd();
  const logger = new FileLogger(logBaseDir);
  const catalog = loadCatalog();
  const presets = loadPresets();
  const monetization = loadMonetizationConfig();
  const compliance = loadComplianceConfig();
  const allowedHosts = new Set(
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
  const isExternalUrlAllowed = (url) => {
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
  const safeOpenExternal = async (url) => {
    if (!isExternalUrlAllowed(url)) {
      logger.log(`Blocked external URL by compliance policy: ${url}`);
      throw new Error("External URL blocked by compliance policy.");
    }
    await import_electron6.shell.openExternal(url);
  };
  const emitInstallEvent = (event) => {
    if (mainWindow) {
      mainWindow.webContents.send("devhub:install-event", event);
    }
  };
  const emitSimpleEvent = (status, itemId, message, exitCode) => {
    emitInstallEvent({
      status,
      itemId,
      message,
      exitCode,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
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
    void 0,
    logger,
    (item) => {
      if (item.manualUrl) {
        void safeOpenExternal(item.manualUrl).catch((error) => {
          logger.log(`Failed to open manual URL for ${item.id}: ${error instanceof Error ? error.message : String(error)}`);
        });
      }
    }
  );
  import_electron6.ipcMain.handle("devhub:get-catalog", () => catalog);
  import_electron6.ipcMain.handle("devhub:get-presets", () => presets);
  import_electron6.ipcMain.handle("devhub:get-monetization", () => monetization);
  import_electron6.ipcMain.handle("devhub:get-compliance-config", () => compliance);
  import_electron6.ipcMain.handle("devhub:get-settings", () => settingsStore.get());
  import_electron6.ipcMain.handle("devhub:save-settings", (_event, settings) => settingsStore.save(settings));
  import_electron6.ipcMain.handle("devhub:accept-compliance", (_event, consentVersion) => {
    const current = settingsStore.get();
    const next = {
      ...current,
      compliance: {
        accepted: true,
        acceptedAt: (/* @__PURE__ */ new Date()).toISOString(),
        consentVersion
      }
    };
    return settingsStore.save(next);
  });
  import_electron6.ipcMain.handle("devhub:preflight", () => engine.preflightCheck(settingsStore.get()));
  import_electron6.ipcMain.handle(
    "devhub:start-install",
    (_event, selectedIds, options) => engine.startInstall(selectedIds, options, settingsStore.get())
  );
  import_electron6.ipcMain.handle("devhub:retry-failed", () => engine.retryFailed(settingsStore.get()));
  import_electron6.ipcMain.handle("devhub:cancel-install", () => {
    engine.cancelInstall();
  });
  import_electron6.ipcMain.handle("devhub:run-post-config", (_event, options) => runPostConfiguration(options, logger));
  import_electron6.ipcMain.handle("devhub:open-external", (_event, url) => {
    if (typeof url !== "string" || !url.trim()) {
      throw new Error("Invalid external URL");
    }
    return safeOpenExternal(url);
  });
  import_electron6.ipcMain.handle("devhub:open-legal-doc", async (_event, docKey) => {
    const relativePath = compliance.legalDocs[docKey];
    const resolvedPath = resolveAppResource(relativePath);
    if (!resolvedPath) {
      throw new Error(`Legal document not found: ${docKey}`);
    }
    let openPath = resolvedPath;
    if (resolvedPath.includes(".asar")) {
      const cacheDir = import_node_path8.default.join(import_electron6.app.getPath("userData"), "legal-docs");
      (0, import_node_fs8.mkdirSync)(cacheDir, { recursive: true });
      const cachedPath = import_node_path8.default.join(cacheDir, import_node_path8.default.basename(relativePath));
      const content = (0, import_node_fs8.readFileSync)(resolvedPath, "utf8");
      (0, import_node_fs8.writeFileSync)(cachedPath, content, "utf8");
      openPath = cachedPath;
    }
    const error = await import_electron6.shell.openPath(openPath);
    if (error) {
      if (process.platform === "win32") {
        (0, import_node_child_process4.spawn)("notepad.exe", [openPath], {
          detached: true,
          windowsHide: true,
          stdio: "ignore"
        }).unref();
        return;
      }
      throw new Error(error);
    }
  });
  import_electron6.ipcMain.handle("devhub:run-runtime-dll-repair", async () => {
    const currentSettings = settingsStore.get();
    if (!currentSettings.compliance.accepted || currentSettings.compliance.consentVersion !== compliance.consentVersion) {
      throw new Error("Compliance consent required before runtime repair.");
    }
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: `Log file: ${engine.getLogPath()}`
    });
  });
  import_electron6.app.on("activate", () => {
    if (import_electron6.BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
}
import_electron6.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron6.app.quit();
  }
});
bootstrap().catch((error) => {
  import_electron6.dialog.showErrorBox("DevHub startup error", error instanceof Error ? error.message : String(error));
  import_electron6.app.quit();
});
//# sourceMappingURL=main.js.map