import { useEffect, useMemo, useState } from "react";
import type {
  ComplianceConfig,
  DevHubSettings,
  InstallEvent,
  InstallPreset,
  InstallSummary,
  Language,
  MonetizationConfig,
  PostConfigOptions,
  PostConfigResult,
  PreflightResult,
  RuntimeDllRepairResult,
  SoftwareItem
} from "../shared/types";
import { translate } from "./i18n";
import { LogPanel } from "./components/LogPanel";
import { PostConfigPanel } from "./components/PostConfigPanel";
import { ProgressPanel } from "./components/ProgressPanel";
import { ProxyDialog } from "./components/ProxyDialog";
import { SoftwareTree } from "./components/SoftwareTree";

export default function App() {
  const [catalog, setCatalog] = useState<SoftwareItem[]>([]);
  const [presets, setPresets] = useState<InstallPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [settings, setSettings] = useState<DevHubSettings | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<InstallEvent[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [showProxy, setShowProxy] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [logPath, setLogPath] = useState("");
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [complianceConfig, setComplianceConfig] = useState<ComplianceConfig | null>(null);
  const [sessionComplianceAccepted, setSessionComplianceAccepted] = useState(false);

  const language: Language = settings?.language ?? "zh-CN";
  const t = (key: string, vars?: Record<string, string | number>) => translate(language, key, vars);

  useEffect(() => {
    const initialize = async () => {
      const [catalogData, presetsData, settingsData, complianceData] = await Promise.all([
        window.devhub.getCatalog(),
        window.devhub.getPresets(),
        window.devhub.getSettings(),
        window.devhub.getComplianceConfig()
      ]);
      const monetizationData = await window.devhub.getMonetization();
      setCatalog(catalogData);
      setPresets(presetsData);
      setSettings(settingsData);
      setMonetization(monetizationData);
      setComplianceConfig(complianceData);
      const defaultSelected = new Set(catalogData.filter((item) => item.enabledByDefault).map((item) => item.id));
      setSelected(defaultSelected);
      const defaultPreset = presetsData.find((preset) => preset.id === "dev-standard") ?? presetsData[0];
      if (defaultPreset) {
        setSelectedPresetId(defaultPreset.id);
      }
    };

    initialize().catch((error) => {
      setLogs((prev) => [...prev, `Initialize failed: ${String(error)}`]);
    });
  }, []);

  useEffect(() => {
    const off = window.devhub.onInstallEvent((event) => {
      setEvents((prev) => [...prev, event]);
      setLogs((prev) => [...prev, `[${event.timestamp}] ${event.status} ${event.itemId} ${event.message}`]);

      if (event.itemId === "system" && event.message.startsWith("Log file:")) {
        setLogPath(event.message.replace("Log file:", "").trim());
      }
      if (event.status === "failed") {
        setFailedIds((prev) => (prev.includes(event.itemId) ? prev : [...prev, event.itemId]));
      }
      if (event.status === "completed") {
        setRunning(false);
      }
    });
    return off;
  }, []);

  useEffect(() => {
    if (!settings) {
      return;
    }
    window.devhub
      .preflightCheck()
      .then((result) => setPreflight(result))
      .catch((error) => setLogs((prev) => [...prev, `Preflight failed: ${String(error)}`]));
  }, [settings]);

  const failedCount = failedIds.length;
  const complianceAccepted =
    sessionComplianceAccepted &&
    Boolean(settings?.compliance.accepted) &&
    Boolean(complianceConfig) &&
    settings?.compliance.consentVersion === complianceConfig?.consentVersion;

  const startInstall = async () => {
    if (!settings) return;
    if (!complianceAccepted) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] blocked: compliance consent required`]);
      return;
    }
    const selectedItems = catalog.filter((item) => selected.has(item.id));
    const hasManual = selectedItems.some((item) => item.installType === "manual");
    if (hasManual && !window.confirm(t("install.manualConfirm"))) {
      return;
    }
    setRunning(true);
    setEvents([]);
    setFailedIds([]);
    try {
      const selectedIds = Array.from(selected);
      const summary = await window.devhub.startInstall(selectedIds);
      applySummary(summary);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] start install failed: ${String(error)}`]);
    } finally {
      setRunning(false);
    }
  };

  const retryFailed = async () => {
    if (!settings) return;
    if (!complianceAccepted) {
      return;
    }
    setRunning(true);
    try {
      const summary = await window.devhub.retryFailed();
      applySummary(summary);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] retry failed items failed: ${String(error)}`]);
    } finally {
      setRunning(false);
    }
  };

  const applySummary = (summary: InstallSummary) => {
    setFailedIds(summary.failedIds);
  };

  const cancelInstall = async () => {
    await window.devhub.cancelInstall();
  };

  const changeLanguage = async (nextLanguage: Language) => {
    if (!settings) return;
    const nextSettings: DevHubSettings = { ...settings, language: nextLanguage };
    const saved = await window.devhub.saveSettings(nextSettings);
    setSettings(saved);
  };

  const saveProxy = async (proxy: DevHubSettings["proxy"]) => {
    if (!settings) return;
    const nextSettings: DevHubSettings = { ...settings, proxy };
    const saved = await window.devhub.saveSettings(nextSettings);
    setSettings(saved);
    setShowProxy(false);
  };

  const runPreflight = async () => {
    try {
      const result = await window.devhub.preflightCheck();
      setPreflight(result);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] preflight failed: ${String(error)}`]);
    }
  };

  const runPostConfig = async (payload: PostConfigOptions): Promise<PostConfigResult> => {
    return window.devhub.runPostConfig(payload);
  };

  const runRuntimeDllRepair = async () => {
    if (!complianceAccepted) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] blocked runtime repair: compliance consent required`]);
      return;
    }
    if (!window.confirm(t("runtime.confirm"))) {
      return;
    }
    setRunning(true);
    setEvents([]);
    setFailedIds([]);
    try {
      const result: RuntimeDllRepairResult = await window.devhub.runRuntimeDllRepair();
      setFailedIds(result.installSummary.failedIds);
      setLogs((prev) => [
        ...prev,
        `[${new Date().toISOString()}] runtime-dll-repair: success=${result.success}`,
        ...result.steps.map(
          (step) =>
            `[${new Date().toISOString()}] runtime-step ${step.name} ${step.success ? "success" : "failed"} (${step.exitCode}) ${step.message}`
        )
      ]);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] runtime-dll-repair failed: ${String(error)}`]);
    } finally {
      setRunning(false);
    }
  };

  const acceptCompliance = async () => {
    if (!complianceConfig) return;
    try {
      const next = await window.devhub.acceptCompliance(complianceConfig.consentVersion);
      setSettings(next);
      setSessionComplianceAccepted(true);
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] compliance accepted (${complianceConfig.consentVersion})`]);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] compliance accept failed: ${String(error)}`]);
    }
  };

  const openLegalDoc = async (docKey: "terms" | "privacy" | "thirdParty" | "disclaimer") => {
    try {
      await window.devhub.openLegalDoc(docKey);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] open legal doc failed: ${String(error)}`]);
    }
  };

  const openBuyMeACoffee = async () => {
    if (!monetization?.enableBuyMeACoffee || !monetization.buyMeACoffeeUrl) {
      return;
    }
    try {
      await window.devhub.openExternal(monetization.buyMeACoffeeUrl);
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] open external: ${monetization.buyMeACoffeeUrl}`]);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] open external failed: ${String(error)}`]);
    }
  };

  const applyPreset = () => {
    const preset = presets.find((item) => item.id === selectedPresetId);
    if (!preset) {
      return;
    }
    const availableIds = new Set(catalog.map((item) => item.id));
    const nextSelected = new Set(preset.packageIds.filter((itemId) => availableIds.has(itemId)));
    setSelected(nextSelected);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toISOString()}] preset ${preset.id} applied, selected=${nextSelected.size}`
    ]);
  };

  const failedNames = useMemo(() => {
    const nameMap = new Map(catalog.map((item) => [item.id, language === "zh-CN" ? item.name.zh : item.name.en]));
    return failedIds.map((id) => nameMap.get(id) ?? id);
  }, [catalog, failedIds, language]);

  if (!settings) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="title">{t("app.title")}</div>
        <div className="top-actions">
          <label className="field-inline">
            <span>{t("top.preset")}</span>
            <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)}>
              <option value="">-</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {language === "zh-CN" ? preset.name.zh : preset.name.en}
                </option>
              ))}
            </select>
          </label>
          <button onClick={applyPreset} disabled={!selectedPresetId || running}>
            {t("top.applyPreset")}
          </button>
          <label className="field-inline">
            <span>{t("top.language")}</span>
            <select value={language} onChange={(e) => changeLanguage(e.target.value as Language)}>
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <button onClick={runPreflight}>{t("top.preflight")}</button>
          <button onClick={runRuntimeDllRepair} disabled={running || !complianceAccepted}>
            {t("top.runtimeRepair")}
          </button>
          {monetization?.enableBuyMeACoffee && (
            <button className="secondary" onClick={openBuyMeACoffee}>
              {t("top.buyCoffee")}
            </button>
          )}
          <button onClick={() => setShowProxy(true)}>{t("top.proxy")}</button>
          <span className="compliance-chip">{complianceAccepted ? t("top.complianceOk") : t("top.compliancePending")}</span>
        </div>
      </header>

      <main className="main-grid">
        <div className="left-col">
          <SoftwareTree language={language} catalog={catalog} selected={selected} onSelectedChange={setSelected} />
          <PostConfigPanel language={language} onRun={runPostConfig} />
        </div>

        <div className="right-col">
          {preflight && (
            <section className="card preflight-box">
              <h2>{t("preflight.result")}</h2>
              <div className="preflight-items">
                <div>
                  {t("preflight.winget")}: {preflight.wingetAvailable ? t("preflight.ok") : t("preflight.fail")}
                </div>
                <div>
                  {t("preflight.source")}: {preflight.sourceHealthy ? t("preflight.ok") : t("preflight.fail")}
                </div>
                <div>
                  {t("preflight.network")}: {preflight.networkHealthy ? t("preflight.ok") : t("preflight.fail")}
                </div>
              </div>
              <ul className="detail-list">
                {preflight.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </section>
          )}

          <ProgressPanel language={language} catalog={catalog} events={events} />
          <LogPanel language={language} logs={logs} logPath={logPath} />
        </div>
      </main>

      <footer className="bottom-bar">
        <span className={running ? "status running" : "status idle"}>{running ? t("status.running") : t("status.idle")}</span>
        <span>{t("summary.failed", { count: failedCount })}</span>
        <button onClick={startInstall} disabled={running || selected.size === 0 || !complianceAccepted}>
          {t("btn.install")}
        </button>
        <button onClick={cancelInstall} disabled={!running}>
          {t("btn.cancel")}
        </button>
        <button onClick={retryFailed} disabled={running || failedCount === 0 || !complianceAccepted}>
          {t("btn.retryFailed")}
        </button>
      </footer>

      {failedNames.length > 0 && (
        <div className="failed-summary">
          <strong>{t("summary.failed", { count: failedNames.length })}</strong>: {failedNames.join(", ")}
        </div>
      )}

      {showProxy && <ProxyDialog language={language} value={settings.proxy} onSave={saveProxy} onClose={() => setShowProxy(false)} />}
      {!complianceAccepted && complianceConfig && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{t("compliance.title")}</h3>
            <p>{t("compliance.body")}</p>
            <p className="muted">{t("compliance.sourcePolicy", { policy: complianceConfig.sourcePolicy })}</p>
            <p className="muted">{t("compliance.required")}</p>
            <div className="actions">
              <button className="secondary" onClick={() => openLegalDoc("terms")}>
                {t("btn.openTerms")}
              </button>
              <button className="secondary" onClick={() => openLegalDoc("privacy")}>
                {t("btn.openPrivacy")}
              </button>
              <button className="secondary" onClick={() => openLegalDoc("thirdParty")}>
                {t("btn.openThirdParty")}
              </button>
              <button className="secondary" onClick={() => openLegalDoc("disclaimer")}>
                {t("btn.openDisclaimer")}
              </button>
            </div>
            <div className="actions">
              <button onClick={acceptCompliance}>{t("btn.acceptCompliance")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
