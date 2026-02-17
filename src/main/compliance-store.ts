import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { z } from "zod";
import type { ComplianceConfig } from "../shared/types";

const complianceSchema = z.object({
  consentVersion: z.string().min(1),
  sourcePolicy: z.string().min(1),
  externalHostAllowlist: z.array(z.string().min(1)),
  legalDocs: z.object({
    terms: z.string().min(1),
    privacy: z.string().min(1),
    thirdParty: z.string().min(1),
    disclaimer: z.string().min(1)
  })
});

export function resolveAppResource(relativePath: string): string | null {
  const candidates = [
    path.join(process.resourcesPath, relativePath),
    path.join(app.getAppPath(), relativePath),
    path.join(process.cwd(), relativePath),
    path.join(path.dirname(app.getAppPath()), relativePath)
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function loadComplianceConfig(): ComplianceConfig {
  const configPath = resolveAppResource(path.join("config", "compliance.json"));
  if (!configPath) {
    throw new Error("Cannot locate config/compliance.json");
  }
  const content = readFileSync(configPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  return complianceSchema.parse(parsed);
}
