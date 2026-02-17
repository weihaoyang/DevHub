import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { SoftwareItem } from "../shared/types";
import { validateCatalog } from "./catalog-schema";

function resolveCatalogPath(): string {
  const candidates = [
    path.join(app.getAppPath(), "config", "software-catalog.json"),
    path.join(process.cwd(), "config", "software-catalog.json"),
    path.join(path.dirname(app.getAppPath()), "config", "software-catalog.json")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error("Cannot locate config/software-catalog.json");
}

export function loadCatalog(): SoftwareItem[] {
  const catalogPath = resolveCatalogPath();
  const content = readFileSync(catalogPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  return validateCatalog(parsed);
}
