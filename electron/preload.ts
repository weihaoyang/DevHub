import { contextBridge, ipcRenderer } from "electron";
import type { DevHubApi, DevHubSettings, InstallEvent, PostConfigOptions, StartInstallOptions } from "../src/shared/types";

const api: DevHubApi = {
  getCatalog: () => ipcRenderer.invoke("devhub:get-catalog"),
  getPresets: () => ipcRenderer.invoke("devhub:get-presets"),
  getMonetization: () => ipcRenderer.invoke("devhub:get-monetization"),
  getComplianceConfig: () => ipcRenderer.invoke("devhub:get-compliance-config"),
  getSettings: () => ipcRenderer.invoke("devhub:get-settings"),
  saveSettings: (settings: DevHubSettings) => ipcRenderer.invoke("devhub:save-settings", settings),
  acceptCompliance: (consentVersion: string) => ipcRenderer.invoke("devhub:accept-compliance", consentVersion),
  preflightCheck: () => ipcRenderer.invoke("devhub:preflight"),
  startInstall: (selectedIds: string[], options?: StartInstallOptions) =>
    ipcRenderer.invoke("devhub:start-install", selectedIds, options),
  retryFailed: () => ipcRenderer.invoke("devhub:retry-failed"),
  cancelInstall: () => ipcRenderer.invoke("devhub:cancel-install"),
  runPostConfig: (options: PostConfigOptions) => ipcRenderer.invoke("devhub:run-post-config", options),
  runRuntimeDllRepair: () => ipcRenderer.invoke("devhub:run-runtime-dll-repair"),
  openExternal: (url: string) => ipcRenderer.invoke("devhub:open-external", url),
  openLegalDoc: (docKey: "terms" | "privacy" | "thirdParty" | "disclaimer") =>
    ipcRenderer.invoke("devhub:open-legal-doc", docKey),
  onInstallEvent: (callback: (event: InstallEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, data: InstallEvent) => callback(data);
    ipcRenderer.on("devhub:install-event", listener);
    return () => {
      ipcRenderer.removeListener("devhub:install-event", listener);
    };
  }
};

contextBridge.exposeInMainWorld("devhub", api);
