export type SoftwareCategory =
  | "browser"
  | "dev"
  | "runtime"
  | "collab"
  | "utility"
  | "database"
  | "creative"
  | "music"
  | "research";
export type Language = "zh-CN" | "en-US";
export type InstallType = "winget" | "manual";

export interface LocalizedName {
  zh: string;
  en: string;
}

export interface SoftwareItem {
  id: string;
  name: LocalizedName;
  summary?: LocalizedName;
  category: SoftwareCategory;
  installType?: InstallType;
  wingetId?: string;
  manualUrl?: string;
  exact: boolean;
  requiresAdmin: boolean;
  enabledByDefault: boolean;
}

export interface InstallPreset {
  id: string;
  name: LocalizedName;
  description?: LocalizedName;
  packageIds: string[];
}

export interface ProxySettings {
  enabled: boolean;
  http?: string;
  https?: string;
}

export interface DevHubSettings {
  language: Language;
  proxy: ProxySettings;
  compliance: ComplianceAcceptance;
  installedPolicy: "skip";
  failurePolicy: "continue";
}

export interface ComplianceAcceptance {
  accepted: boolean;
  acceptedAt?: string;
  consentVersion: string;
}

export type InstallStatus =
  | "queued"
  | "running"
  | "manual_required"
  | "success"
  | "skipped_installed"
  | "failed"
  | "completed";

export interface InstallEvent {
  status: InstallStatus;
  itemId: string;
  timestamp: string;
  message: string;
  exitCode?: number;
}

export interface InstallSummary {
  failedIds: string[];
  cancelled: boolean;
  total: number;
  processed: number;
}

export interface PreflightResult {
  wingetAvailable: boolean;
  sourceHealthy: boolean;
  networkHealthy: boolean;
  details: string[];
}

export interface StartInstallOptions {
  dryRun?: boolean;
  suppressCompletedEvent?: boolean;
}

export interface PostConfigOptions {
  gitName?: string;
  gitEmail?: string;
}

export interface PostConfigStepResult {
  name: string;
  success: boolean;
  message: string;
}

export interface PostConfigResult {
  success: boolean;
  steps: PostConfigStepResult[];
}

export interface RuntimeRepairStepResult {
  name: string;
  success: boolean;
  message: string;
  exitCode: number;
}

export interface RuntimeDllRepairResult {
  success: boolean;
  installSummary: InstallSummary;
  steps: RuntimeRepairStepResult[];
}

export interface MonetizationConfig {
  buyMeACoffeeUrl: string;
  enableBuyMeACoffee: boolean;
}

export interface ComplianceConfig {
  consentVersion: string;
  sourcePolicy: string;
  externalHostAllowlist: string[];
  legalDocs: {
    terms: string;
    privacy: string;
    thirdParty: string;
    disclaimer: string;
  };
}

export interface DevHubApi {
  getCatalog: () => Promise<SoftwareItem[]>;
  getPresets: () => Promise<InstallPreset[]>;
  getMonetization: () => Promise<MonetizationConfig>;
  getComplianceConfig: () => Promise<ComplianceConfig>;
  getSettings: () => Promise<DevHubSettings>;
  saveSettings: (settings: DevHubSettings) => Promise<DevHubSettings>;
  acceptCompliance: (consentVersion: string) => Promise<DevHubSettings>;
  preflightCheck: () => Promise<PreflightResult>;
  startInstall: (selectedIds: string[], options?: StartInstallOptions) => Promise<InstallSummary>;
  retryFailed: () => Promise<InstallSummary>;
  cancelInstall: () => Promise<void>;
  runPostConfig: (options: PostConfigOptions) => Promise<PostConfigResult>;
  runRuntimeDllRepair: () => Promise<RuntimeDllRepairResult>;
  openExternal: (url: string) => Promise<void>;
  openLegalDoc: (docKey: "terms" | "privacy" | "thirdParty" | "disclaimer") => Promise<void>;
  onInstallEvent: (callback: (event: InstallEvent) => void) => () => void;
}
