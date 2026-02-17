import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateCatalog } from "../src/main/catalog-schema";

function loadCatalogJson() {
  const catalogPath = path.resolve(process.cwd(), "config", "software-catalog.json");
  return JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;
}

describe("catalog content quality", () => {
  it("parses and validates catalog schema", () => {
    const raw = loadCatalogJson();
    const catalog = validateCatalog(raw);
    expect(catalog.length).toBeGreaterThan(0);
  });

  it("ensures each software has bilingual summary and non-identical text", () => {
    const catalog = validateCatalog(loadCatalogJson());
    for (const item of catalog) {
      expect(item.summary?.zh?.trim().length ?? 0).toBeGreaterThan(0);
      expect(item.summary?.en?.trim().length ?? 0).toBeGreaterThan(0);
      expect(item.summary?.zh.trim()).not.toBe(item.summary?.en.trim());
    }
  });

  it("contains expected open-source utility entries and manual fallback for freefilesync", () => {
    const catalog = validateCatalog(loadCatalogJson());
    const byId = new Map(catalog.map((item) => [item.id, item]));
    const newIds = [
      "czkawka",
      "dupeguru",
      "winmerge",
      "flow-launcher",
      "localsend",
      "keepassxc",
      "bulk-crap-uninstaller",
      "double-commander",
      "syncthing",
      "synctrayzor",
      "grepwin",
      "rclone",
      "ripgrep",
      "fd-find",
      "freefilesync"
    ];
    for (const id of newIds) {
      expect(byId.has(id)).toBe(true);
    }

    const freeFileSync = byId.get("freefilesync");
    expect(freeFileSync?.installType).toBe("manual");
    expect(freeFileSync?.manualUrl).toBe("https://freefilesync.org/download.php");
    expect(() => new URL(String(freeFileSync?.manualUrl))).not.toThrow();
  });
});
