import { useEffect, useMemo, useState } from "react";
import type {
  ComplianceConfig,
  DevHubSettings,
  InstallEvent,
  InstallPreset,
  InstallSummary,
  LegalDocContent,
  LegalDocKey,
  Language,
  MonetizationConfig,
  MonetizationSponsorCard,
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
  const [complianceConfig, setComplianceConfig] = useState<ComplianceConfig | null>(null);
  const [monetization, setMonetization] = useState<MonetizationConfig | null>(null);
  const [sessionComplianceAccepted, setSessionComplianceAccepted] = useState(false);
  const [showAllIndustryPresets, setShowAllIndustryPresets] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocContent | null>(null);
  const [dismissedAdSlots, setDismissedAdSlots] = useState<Set<string>>(new Set());

  const language: Language = settings?.language ?? "zh-CN";
  const t = (key: string, vars?: Record<string, string | number>) => translate(language, key, vars);

  useEffect(() => {
    const initialize = async () => {
      const [catalogData, presetsData, settingsData, complianceData, monetizationData] = await Promise.all([
        window.devhub.getCatalog(),
        window.devhub.getPresets(),
        window.devhub.getSettings(),
        window.devhub.getComplianceConfig(),
        window.devhub.getMonetization()
      ]);
      setCatalog(catalogData);
      setPresets(presetsData);
      setSettings(settingsData);
      setComplianceConfig(complianceData);
      setMonetization(monetizationData);
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
  const selectedCount = selected.size;
  const totalCount = catalog.length;
  const industryPresets = useMemo(() => presets.filter((preset) => preset.id.startsWith("industry-")), [presets]);
  const visibleIndustryPresets = showAllIndustryPresets ? industryPresets : industryPresets.slice(0, 6);
  const industryCoverageText =
    language === "zh-CN" ? `浅色毛玻璃界面 · 覆盖 ${industryPresets.length} 个行业方案` : `Light Glass UI · ${industryPresets.length} industry-ready scenarios`;

  const complianceAccepted =
    sessionComplianceAccepted &&
    Boolean(settings?.compliance.accepted) &&
    Boolean(complianceConfig) &&
    settings?.compliance.consentVersion === complianceConfig?.consentVersion;
  const adsEnabled = Boolean(monetization?.resolvedPlan.adsEnabled);
  const tierLabel = monetization?.resolvedPlan.name ? (language === "zh-CN" ? monetization.resolvedPlan.name.zh : monetization.resolvedPlan.name.en) : "";
  const mainSidebarCards = useMemo(() => {
    if (!monetization || !adsEnabled || dismissedAdSlots.has("main-right-column-bottom")) {
      return [];
    }
    return monetization.sponsorCards.filter((card) => card.placement === "main-right-column-bottom").slice(0, 1);
  }, [adsEnabled, dismissedAdSlots, monetization]);
  const postInstallCards = useMemo(() => {
    if (!monetization || !adsEnabled || dismissedAdSlots.has("post-install-footer")) {
      return [];
    }
    return monetization.sponsorCards.filter((card) => card.placement === "post-install-footer").slice(0, 2);
  }, [adsEnabled, dismissedAdSlots, monetization]);

  const applySummary = (summary: InstallSummary) => {
    setFailedIds(summary.failedIds);
  };

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

  const openLegalDoc = async (docKey: LegalDocKey) => {
    try {
      const doc = await window.devhub.getLegalDoc(docKey);
      setLegalDoc(doc);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] open legal doc failed: ${String(error)}`]);
    }
  };

  const openSponsorCard = async (card: MonetizationSponsorCard) => {
    try {
      await window.devhub.openExternal(card.url);
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] sponsor-click ${card.id} ${card.url}`]);
    } catch (error) {
      setLogs((prev) => [...prev, `[${new Date().toISOString()}] sponsor-open failed ${card.id}: ${String(error)}`]);
    }
  };

  const dismissAdSlot = (placement: "main-right-column-bottom" | "post-install-footer") => {
    setDismissedAdSlots((prev) => new Set([...prev, placement]));
  };

  const applyPresetById = (presetId: string) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    const availableIds = new Set(catalog.map((item) => item.id));
    const nextSelected = new Set(preset.packageIds.filter((itemId) => availableIds.has(itemId)));
    setSelected(nextSelected);
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] preset ${preset.id} applied, selected=${nextSelected.size}`]);
  };

  const applyPreset = () => {
    if (!selectedPresetId) {
      return;
    }
    applyPresetById(selectedPresetId);
  };

  const failedNames = useMemo(() => {
    const nameMap = new Map(catalog.map((item) => [item.id, language === "zh-CN" ? item.name.zh : item.name.en]));
    return failedIds.map((id) => nameMap.get(id) ?? id);
  }, [catalog, failedIds, language]);
  const failedPreview =
    failedNames.length <= 2
      ? failedNames.join(", ")
      : `${failedNames.slice(0, 2).join(", ")} +${failedNames.length - 2}`;

  if (!settings) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="title-wrap">
          <div className="title">{t("app.title")}</div>
          <div className="title-sub">{industryCoverageText}</div>
        </div>
        <div className="top-actions">
          <label className="field-inline compact">
            <span>{t("top.language")}</span>
            <select value={language} onChange={(e) => changeLanguage(e.target.value as Language)}>
              <option value="zh-CN">中文</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <button className="secondary" onClick={runPreflight}>
            {t("top.preflight")}
          </button>
          <button className="secondary" onClick={runRuntimeDllRepair} disabled={running || !complianceAccepted}>
            {t("top.runtimeRepair")}
          </button>
          <button className="secondary" onClick={() => setShowProxy(true)}>
            {t("top.proxy")}
          </button>
          <span className="compliance-chip">{complianceAccepted ? t("top.complianceOk") : t("top.compliancePending")}</span>
          {tierLabel && <span className="tier-chip">{tierLabel}</span>}
        </div>
      </header>

      <main className="main-grid">
        <div className="left-col">
          <section className="card scene-panel">
            <div className="card-title-row">
              <h2>{language === "zh-CN" ? "安装场景" : "Install Scenarios"}</h2>
              <span className="muted">{selectedCount}/{totalCount}</span>
            </div>
            <div className="scene-controls">
              <label className="field">
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
              <button className="primary-action" onClick={applyPreset} disabled={!selectedPresetId || running}>
                {t("top.applyPreset")}
              </button>
            </div>
            <div className="industry-preset-head">
              <span className="muted">
                {language === "zh-CN" ? `行业方案快捷选择（${industryPresets.length}）` : `Industry quick presets (${industryPresets.length})`}
              </span>
              {industryPresets.length > 6 && (
                <button className="secondary industry-toggle" onClick={() => setShowAllIndustryPresets((prev) => !prev)} disabled={running}>
                  {showAllIndustryPresets
                    ? language === "zh-CN"
                      ? "收起"
                      : "Collapse"
                    : language === "zh-CN"
                      ? "展开全部"
                      : "Expand all"}
                </button>
              )}
            </div>
            <div className={`industry-preset-wrap ${showAllIndustryPresets ? "expanded" : "collapsed"}`}>
              <div className="industry-preset-list">
                {visibleIndustryPresets.map((preset) => (
                  <button
                    key={preset.id}
                    className={preset.id === selectedPresetId ? "secondary active" : "secondary"}
                    disabled={running}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      applyPresetById(preset.id);
                    }}
                  >
                    {language === "zh-CN" ? preset.name.zh : preset.name.en}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <SoftwareTree language={language} catalog={catalog} selected={selected} onSelectedChange={setSelected} />
        </div>

        <div className="right-col">
          {preflight && (
            <section className="card preflight-box">
              <div className="card-title-row">
                <h2>{t("preflight.result")}</h2>
              </div>
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
          <PostConfigPanel language={language} onRun={runPostConfig} />
          {mainSidebarCards.length > 0 && (
            <section className="card sponsor-slot">
              <div className="card-title-row">
                <h2>{language === "zh-CN" ? "赞助推荐" : "Sponsored"}</h2>
                <button className="secondary sponsor-dismiss" onClick={() => dismissAdSlot("main-right-column-bottom")}>
                  {language === "zh-CN" ? "本次关闭" : "Hide this session"}
                </button>
              </div>
              <div className="sponsor-list">
                {mainSidebarCards.map((card) => (
                  <button key={card.id} className="sponsor-card" onClick={() => openSponsorCard(card)}>
                    <span className="sponsor-disclosure">{language === "zh-CN" ? card.disclosure.zh : card.disclosure.en}</span>
                    <span className="sponsor-title">{language === "zh-CN" ? card.title.zh : card.title.en}</span>
                    <span className="sponsor-desc">{language === "zh-CN" ? card.description.zh : card.description.en}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          <LogPanel language={language} logs={logs} logPath={logPath} />
        </div>
      </main>

      <footer className="bottom-bar">
        <span className={running ? "status running" : "status idle"}>{running ? t("status.running") : t("status.idle")}</span>
        <span>{t("summary.failed", { count: failedCount })}</span>
        {failedCount > 0 && (
          <span className="failed-inline" title={failedNames.join(", ")}>
            {failedPreview}
          </span>
        )}
        <button className="primary-action" onClick={startInstall} disabled={running || selected.size === 0 || !complianceAccepted}>
          {t("btn.install")}
        </button>
        <button className="secondary" onClick={cancelInstall} disabled={!running}>
          {t("btn.cancel")}
        </button>
        <button className="secondary" onClick={retryFailed} disabled={running || failedCount === 0 || !complianceAccepted}>
          {t("btn.retryFailed")}
        </button>
        {postInstallCards.length > 0 && (
          <div className="sponsor-inline-wrap">
            <button className="secondary sponsor-dismiss" onClick={() => dismissAdSlot("post-install-footer")}>
              {language === "zh-CN" ? "关闭推荐" : "Hide recommendations"}
            </button>
            <div className="sponsor-inline-list">
              {postInstallCards.map((card) => (
                <button key={card.id} className="sponsor-inline-card" onClick={() => openSponsorCard(card)}>
                  <span className="sponsor-inline-disclosure">{language === "zh-CN" ? card.disclosure.zh : card.disclosure.en}</span>
                  <span>{language === "zh-CN" ? card.title.zh : card.title.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </footer>

      {showProxy && <ProxyDialog language={language} value={settings.proxy} onSave={saveProxy} onClose={() => setShowProxy(false)} />}
      {!complianceAccepted && complianceConfig && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{t("compliance.title")}</h3>
            <p>{t("compliance.body")}</p>
            <p className="muted">{t("compliance.sourcePolicy", { policy: complianceConfig.sourcePolicy })}</p>
            <p className="muted">{t("compliance.required")}</p>
            <div className="modal-doc-actions">
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
            <div className="modal-primary-action">
              <button onClick={acceptCompliance}>{t("btn.acceptCompliance")}</button>
            </div>
          </div>
        </div>
      )}
      {legalDoc && (
        <div className="modal-backdrop">
          <div className="modal legal-modal">
            <h3>{language === "zh-CN" ? `查看文档：${legalDoc.title}` : legalDoc.title}</h3>
            <pre className="legal-content">{legalDoc.content}</pre>
            <div className="modal-primary-action">
              <button className="secondary" onClick={() => setLegalDoc(null)}>
                {t("btn.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
