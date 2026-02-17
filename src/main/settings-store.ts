import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import type { DevHubSettings } from "../shared/types";

function loadDefaultSettings(): DevHubSettings {
  const candidates = [
    path.join(app.getAppPath(), "config", "default-settings.json"),
    path.join(process.cwd(), "config", "default-settings.json"),
    path.join(path.dirname(app.getAppPath()), "config", "default-settings.json")
  ];
  const defaultPath = candidates.find((candidate) => existsSync(candidate));
  if (!defaultPath) {
    throw new Error("Cannot locate config/default-settings.json");
  }
  const content = readFileSync(defaultPath, "utf8");
  return JSON.parse(content) as DevHubSettings;
}

export class SettingsStore {
  private readonly settingsPath: string;
  private readonly defaults: DevHubSettings;

  constructor() {
    this.defaults = loadDefaultSettings();
    const baseDir = app.getPath("userData");
    mkdirSync(baseDir, { recursive: true });
    this.settingsPath = path.join(baseDir, "settings.json");
  }

  get(): DevHubSettings {
    if (!existsSync(this.settingsPath)) {
      return this.defaults;
    }

    try {
      const stored = JSON.parse(readFileSync(this.settingsPath, "utf8")) as Partial<DevHubSettings>;
      return {
        ...this.defaults,
        ...stored,
        proxy: {
          ...this.defaults.proxy,
          ...(stored.proxy ?? {})
        },
        compliance: {
          ...this.defaults.compliance,
          ...(stored.compliance ?? {})
        }
      };
    } catch {
      return this.defaults;
    }
  }

  save(nextSettings: DevHubSettings): DevHubSettings {
    const merged: DevHubSettings = {
      ...this.defaults,
      ...nextSettings,
      proxy: {
        ...this.defaults.proxy,
        ...(nextSettings.proxy ?? {})
      },
      compliance: {
        ...this.defaults.compliance,
        ...(nextSettings.compliance ?? {})
      }
    };
    writeFileSync(this.settingsPath, JSON.stringify(merged, null, 2), "utf8");
    return merged;
  }
}
