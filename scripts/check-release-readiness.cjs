const fs = require("node:fs");
const path = require("node:path");

function readJson(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCatalog(rootDir) {
  const catalogPath = path.join(rootDir, "config", "software-catalog.json");
  const catalog = readJson(catalogPath);
  ensure(Array.isArray(catalog) && catalog.length > 0, "catalog must be a non-empty array");

  const seenIds = new Set();
  for (const item of catalog) {
    ensure(nonEmptyString(item.id), "catalog item id must be non-empty");
    ensure(!seenIds.has(item.id), `duplicate catalog id: ${item.id}`);
    seenIds.add(item.id);

    ensure(nonEmptyString(item.name?.zh), `catalog ${item.id} missing zh name`);
    ensure(nonEmptyString(item.name?.en), `catalog ${item.id} missing en name`);
    ensure(nonEmptyString(item.summary?.zh), `catalog ${item.id} missing zh summary`);
    ensure(nonEmptyString(item.summary?.en), `catalog ${item.id} missing en summary`);
    ensure(item.summary.zh.trim() !== item.summary.en.trim(), `catalog ${item.id} summary zh/en should differ`);

    const installType = item.installType ?? "winget";
    if (installType === "manual") {
      ensure(nonEmptyString(item.manualUrl), `catalog ${item.id} missing manualUrl`);
      ensure(/^https?:\/\//i.test(item.manualUrl), `catalog ${item.id} manualUrl must be http/https`);
    } else {
      ensure(nonEmptyString(item.wingetId), `catalog ${item.id} missing wingetId`);
    }
  }

  return { catalog, catalogIds: seenIds };
}

function validatePresets(rootDir, catalogIds) {
  const presetsPath = path.join(rootDir, "config", "presets.json");
  const presets = readJson(presetsPath);
  ensure(Array.isArray(presets) && presets.length > 0, "presets must be a non-empty array");

  const requiredIndustryPresets = [
    "industry-office-admin",
    "industry-education-campus",
    "industry-healthcare-clinic",
    "industry-finance-operations",
    "industry-ecommerce-growth",
    "industry-manufacturing-engineering",
    "industry-architecture-design",
    "industry-media-studio",
    "industry-software-delivery",
    "industry-cross-discipline-lab",
    "industry-legal-compliance",
    "industry-government-public-service",
    "industry-it-ops-sre",
    "industry-cybersecurity",
    "industry-game-development",
    "industry-data-platform",
    "industry-audio-podcast",
    "industry-design-print",
    "industry-logistics-supply-chain",
    "industry-construction-project",
    "industry-hotel-retail-service",
    "industry-energy-utilities",
    "industry-pharma-biotech",
    "industry-agriculture-food",
    "industry-insurance-service",
    "industry-human-resources",
    "industry-aerospace-defense",
    "industry-semiconductor-hardware"
  ];

  const byId = new Map(presets.map((item) => [item.id, item]));
  for (const presetId of requiredIndustryPresets) {
    const preset = byId.get(presetId);
    ensure(Boolean(preset), `missing required industry preset: ${presetId}`);
  }

  const industryPresetCount = presets.filter((item) => String(item.id).startsWith("industry-")).length;
  ensure(industryPresetCount >= 28, "industry presets count is below launch baseline (28)");

  for (const preset of presets) {
    ensure(nonEmptyString(preset.id), "preset id must be non-empty");
    ensure(nonEmptyString(preset.name?.zh), `preset ${preset.id} missing zh name`);
    ensure(nonEmptyString(preset.name?.en), `preset ${preset.id} missing en name`);
    ensure(nonEmptyString(preset.description?.zh), `preset ${preset.id} missing zh description`);
    ensure(nonEmptyString(preset.description?.en), `preset ${preset.id} missing en description`);
    ensure(Array.isArray(preset.packageIds) && preset.packageIds.length > 0, `preset ${preset.id} packageIds must be non-empty`);
    for (const packageId of preset.packageIds) {
      ensure(catalogIds.has(packageId), `preset ${preset.id} references unknown package: ${packageId}`);
    }
  }

  return { presets, industryPresetCount };
}

function validateI18n(rootDir) {
  const zhPath = path.join(rootDir, "i18n", "zh-CN.json");
  const enPath = path.join(rootDir, "i18n", "en-US.json");
  const zh = readJson(zhPath);
  const en = readJson(enPath);

  const requiredKeys = [
    "app.title",
    "top.language",
    "top.preflight",
    "top.proxy",
    "top.runtimeRepair",
    "top.preset",
    "top.applyPreset",
    "top.complianceOk",
    "top.compliancePending",
    "btn.install",
    "btn.retryFailed",
    "btn.acceptCompliance",
    "category.research",
    "summary.selected",
    "summary.failed",
    "preflight.result",
    "compliance.title"
  ];

  for (const key of requiredKeys) {
    ensure(nonEmptyString(zh[key]), `zh-CN missing key: ${key}`);
    ensure(nonEmptyString(en[key]), `en-US missing key: ${key}`);
  }
}

function validateComplianceAssets(rootDir) {
  const compliancePath = path.join(rootDir, "config", "compliance.json");
  const compliance = readJson(compliancePath);
  ensure(nonEmptyString(compliance.consentVersion), "compliance consentVersion must be non-empty");

  const legalDocs = compliance.legalDocs ?? {};
  for (const key of ["terms", "privacy", "thirdParty", "disclaimer"]) {
    const relative = legalDocs[key];
    ensure(nonEmptyString(relative), `compliance legalDocs.${key} must be non-empty`);
    const absolute = path.join(rootDir, relative);
    ensure(fs.existsSync(absolute), `missing legal doc file: ${relative}`);
  }
}

function main() {
  const rootDir = process.cwd();
  const { catalog, catalogIds } = validateCatalog(rootDir);
  const { presets, industryPresetCount } = validatePresets(rootDir, catalogIds);
  validateI18n(rootDir);
  validateComplianceAssets(rootDir);

  console.log(`release-readiness: catalog=${catalog.length} presets=${presets.length} industryPresets=${industryPresetCount} status=ok`);
}

main();
