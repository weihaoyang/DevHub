import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { z } from "zod";
import type { InstallPreset } from "../shared/types";

const presetSchema = z.object({
  id: z.string().min(1),
  name: z.object({
    zh: z.string().min(1),
    en: z.string().min(1)
  }),
  description: z
    .object({
      zh: z.string().min(1),
      en: z.string().min(1)
    })
    .optional(),
  packageIds: z.array(z.string().min(1)).min(1)
});

const presetsSchema = z
  .array(presetSchema)
  .min(1)
  .refine((items) => new Set(items.map((item) => item.id)).size === items.length, "Duplicate preset id");

function resolvePresetsPath(): string {
  const candidates = [
    path.join(app.getAppPath(), "config", "presets.json"),
    path.join(process.cwd(), "config", "presets.json"),
    path.join(path.dirname(app.getAppPath()), "config", "presets.json")
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error("Cannot locate config/presets.json");
}

export function loadPresets(): InstallPreset[] {
  const presetsPath = resolvePresetsPath();
  const content = readFileSync(presetsPath, "utf8");
  const parsed = JSON.parse(content) as unknown;
  return presetsSchema.parse(parsed);
}
