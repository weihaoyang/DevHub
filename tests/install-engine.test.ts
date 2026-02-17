import { describe, expect, it } from "vitest";
import { InstallEngine, type CommandRunner } from "../src/main/install-engine";
import type { DevHubSettings, InstallEvent, SoftwareItem } from "../src/shared/types";
import { NullLogger } from "../src/main/logger";

const settings: DevHubSettings = {
  language: "zh-CN",
  proxy: { enabled: false },
  compliance: {
    accepted: true,
    consentVersion: "2026-02-15"
  },
  installedPolicy: "skip",
  failurePolicy: "continue"
};

const catalog: SoftwareItem[] = [
  {
    id: "git",
    name: { zh: "Git", en: "Git" },
    category: "dev",
    wingetId: "Git.Git",
    exact: true,
    requiresAdmin: true,
    enabledByDefault: true
  },
  {
    id: "node",
    name: { zh: "Node", en: "Node" },
    category: "dev",
    wingetId: "OpenJS.NodeJS.LTS",
    exact: true,
    requiresAdmin: true,
    enabledByDefault: true
  }
];

describe("install engine", () => {
  it("skips already installed software", async () => {
    const events: InstallEvent[] = [];
    const runner: CommandRunner = {
      run: async (_command, args) => {
        if (args[0] === "list" && args.includes("Git.Git")) {
          return { code: 0, stdout: "Git.Git", stderr: "" };
        }
        if (args[0] === "list") {
          return { code: 0, stdout: "", stderr: "" };
        }
        return { code: 0, stdout: "ok", stderr: "" };
      }
    };

    const engine = new InstallEngine(catalog, (event) => events.push(event), runner, NullLogger);
    const summary = await engine.startInstall(["git"], undefined, settings);

    expect(summary.failedIds).toEqual([]);
    expect(events.some((event) => event.status === "skipped_installed")).toBe(true);
  });

  it("continues when one package fails", async () => {
    const events: InstallEvent[] = [];
    const runner: CommandRunner = {
      run: async (_command, args) => {
        if (args[0] === "list") {
          return { code: 0, stdout: "", stderr: "" };
        }
        if (args[0] === "install" && args.includes("Git.Git")) {
          return { code: 1, stdout: "", stderr: "failed" };
        }
        return { code: 0, stdout: "ok", stderr: "" };
      }
    };

    const engine = new InstallEngine(catalog, (event) => events.push(event), runner, NullLogger);
    const summary = await engine.startInstall(["git", "node"], undefined, settings);

    expect(summary.failedIds).toEqual(["git"]);
    expect(events.some((event) => event.status === "success" && event.itemId === "node")).toBe(true);
  });

  it("supports soft cancel", async () => {
    const events: InstallEvent[] = [];
    let installCalls = 0;
    const runner: CommandRunner = {
      run: async (_command, args) => {
        if (args[0] === "list") {
          return { code: 0, stdout: "", stderr: "" };
        }
        if (args[0] === "install") {
          installCalls += 1;
          return { code: 0, stdout: "ok", stderr: "" };
        }
        return { code: 0, stdout: "", stderr: "" };
      }
    };

    const engine = new InstallEngine(
      catalog,
      (event) => {
        events.push(event);
        if (event.status === "success" && event.itemId === "git") {
          engine.cancelInstall();
        }
      },
      runner,
      NullLogger
    );

    const summary = await engine.startInstall(["git", "node"], undefined, settings);
    expect(summary.cancelled).toBe(true);
    expect(installCalls).toBe(1);
    expect(events.some((event) => event.itemId === "node" && event.status === "running")).toBe(false);
  });

  it("marks manual packages as manual_required without failing summary", async () => {
    const events: InstallEvent[] = [];
    const manualCatalog: SoftwareItem[] = [
      {
        id: "davinci",
        name: { zh: "DaVinci", en: "DaVinci" },
        category: "creative",
        installType: "manual",
        manualUrl: "https://www.blackmagicdesign.com/products/davinciresolve",
        exact: true,
        requiresAdmin: true,
        enabledByDefault: false
      }
    ];

    let opened = "";
    const runner: CommandRunner = {
      run: async () => ({ code: 0, stdout: "", stderr: "" })
    };

    const engine = new InstallEngine(
      manualCatalog,
      (event) => events.push(event),
      runner,
      NullLogger,
      (item) => {
        opened = item.manualUrl ?? "";
      }
    );

    const summary = await engine.startInstall(["davinci"], undefined, settings);
    expect(summary.failedIds).toEqual([]);
    expect(opened).toContain("blackmagicdesign.com");
    expect(events.some((event) => event.status === "manual_required")).toBe(true);
  });
});
