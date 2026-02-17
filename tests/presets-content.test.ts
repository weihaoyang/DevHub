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
});
