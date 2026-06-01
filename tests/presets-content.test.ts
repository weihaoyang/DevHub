import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateCatalog } from "../src/main/catalog-schema";

function loadJsonFile<T>(fileName: string): T {
  const filePath = path.resolve(process.cwd(), "config", fileName);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

interface PresetItem {
  id: string;
  name: { zh: string; en: string };
  description?: { zh: string; en: string };
  packageIds: string[];
}

describe("preset content quality", () => {
  it("ensures every preset description is bilingual and non-identical", () => {
    const presets = loadJsonFile<PresetItem[]>("presets.json");
    expect(presets.length).toBeGreaterThan(0);
    for (const preset of presets) {
      expect(preset.description?.zh?.trim().length ?? 0).toBeGreaterThan(0);
      expect(preset.description?.en?.trim().length ?? 0).toBeGreaterThan(0);
      expect(preset.description?.zh.trim()).not.toBe(preset.description?.en.trim());
    }
  });

  it("includes new utility presets and keeps package references valid", () => {
    const catalog = validateCatalog(loadJsonFile("software-catalog.json"));
    const catalogIds = new Set(catalog.map((item) => item.id));
    const presets = loadJsonFile<PresetItem[]>("presets.json");
    const presetById = new Map(presets.map((preset) => [preset.id, preset]));

    const toolkit = presetById.get("utility-open-source-toolkit");
    const dedup = presetById.get("utility-file-dedup-sync");

    expect(toolkit).toBeTruthy();
    expect(dedup).toBeTruthy();
    expect(toolkit?.packageIds.length).toBe(16);
    expect(dedup?.packageIds.length).toBe(7);

    for (const preset of [toolkit, dedup]) {
      for (const packageId of preset?.packageIds ?? []) {
        expect(catalogIds.has(packageId)).toBe(true);
      }
    }
  });

  it("includes launch-ready industry presets with valid package references", () => {
    const catalog = validateCatalog(loadJsonFile("software-catalog.json"));
    const catalogIds = new Set(catalog.map((item) => item.id));
    const presets = loadJsonFile<PresetItem[]>("presets.json");
    const presetById = new Map(presets.map((preset) => [preset.id, preset]));
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

    for (const presetId of requiredIndustryPresets) {
      const preset = presetById.get(presetId);
      expect(preset).toBeTruthy();
      expect(preset?.description?.zh?.trim().length ?? 0).toBeGreaterThan(0);
      expect(preset?.description?.en?.trim().length ?? 0).toBeGreaterThan(0);
      expect(preset?.packageIds.length ?? 0).toBeGreaterThanOrEqual(8);
      for (const packageId of preset?.packageIds ?? []) {
        expect(catalogIds.has(packageId)).toBe(true);
      }
    }

    const industryPresets = presets.filter((preset) => preset.id.startsWith("industry-"));
    expect(industryPresets.length).toBeGreaterThanOrEqual(28);
  });
});
