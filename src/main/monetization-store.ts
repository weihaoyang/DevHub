import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { z } from "zod";
import type { MonetizationConfig } from "../shared/types";

const monetizationSchema = z.object({
  buyMeACoffeeUrl: z.string().url(),
  enableBuyMeACoffee: z.boolean()
});

function resolveMonetizationPath(): string | null {
  const candidates = [
    path.join(app.getAppPath(), "config", "monetization.json"),
    path.join(process.cwd(), "config", "monetization.json"),
    path.join(path.dirname(app.getAppPath()), "config", "monetization.json")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function loadMonetizationConfig(): MonetizationConfig {
  const defaultConfig: MonetizationConfig = {
    buyMeACoffeeUrl: "https://buymeacoffee.com/devhub",
    enableBuyMeACoffee: true
  };

  const configPath = resolveMonetizationPath();
  if (!configPath) {
    return defaultConfig;
  }

  try {
    const content = readFileSync(configPath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return monetizationSchema.parse(parsed);
  } catch {
    return defaultConfig;
  }
}
