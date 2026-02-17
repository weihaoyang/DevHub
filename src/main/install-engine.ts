import { spawn } from "node:child_process";
import type {
  DevHubSettings,
  InstallEvent,
  InstallSummary,
  PreflightResult,
  SoftwareItem,
  StartInstallOptions
} from "../shared/types";
import { buildRetryQueue } from "./install-queue";
import { NullLogger, type CommandResult, type LoggerLike } from "./logger";
import { applyProxyEnv } from "./network";

export interface CommandRunner {
  run: (command: string, args: string[], env?: NodeJS.ProcessEnv) => Promise<CommandResult>;
}

const defaultRunner: CommandRunner = {
  run(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<CommandResult> {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        env: env ?? process.env,
        windowsHide: true,
        shell: false
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        resolve({ code: -1, stdout, stderr: error.message });
      });
      child.on("close", (code) => {
        resolve({ code: code ?? -1, stdout, stderr });
      });
    });
  }
};

export class InstallEngine {
  private readonly catalogById: Map<string, SoftwareItem>;
  private readonly runner: CommandRunner;
  private readonly logger: LoggerLike;
  private readonly emit: (event: InstallEvent) => void;
  private readonly onManualRequired?: (item: SoftwareItem) => void;

  private isRunning = false;
  private cancelRequested = false;
  private failedIds: string[] = [];

  constructor(
    catalog: SoftwareItem[],
    emit: (event: InstallEvent) => void,
    runner: CommandRunner = defaultRunner,
    logger: LoggerLike = NullLogger,
    onManualRequired?: (item: SoftwareItem) => void
  ) {
    this.catalogById = new Map(catalog.map((item) => [item.id, item]));
    this.runner = runner;
    this.logger = logger;
    this.emit = emit;
    this.onManualRequired = onManualRequired;
  }

  getFailedIds(): string[] {
    return [...this.failedIds];
  }

  getLogPath(): string {
    return this.logger.getLogPath();
  }

  cancelInstall(): void {
    this.cancelRequested = true;
    this.logger.log("Cancel requested by user.");
  }

  async preflightCheck(settings: DevHubSettings): Promise<PreflightResult> {
    const env = applyProxyEnv(settings);
    const details: string[] = [];

    const wingetVersion = await this.runner.run("winget", ["--version"], env);
    const wingetAvailable = wingetVersion.code === 0;
    details.push(
      wingetAvailable
        ? `winget available: ${wingetVersion.stdout.trim()}`
        : `winget unavailable: ${wingetVersion.stderr || wingetVersion.stdout}`
    );

    const sourceResult = await this.runner.run("winget", ["source", "list"], env);
    const sourceHealthy = sourceResult.code === 0;
    details.push(sourceHealthy ? "winget source check passed." : "winget source check failed.");

    const networkProbeArgs = ["search", "--id", "Microsoft.PowerToys", "--exact", "--source", "winget"];
    const networkProbe = await this.runner.run("winget", networkProbeArgs, env);
    const networkHealthy = networkProbe.code === 0;
    details.push(
      networkHealthy
        ? "winget network probe passed."
        : `winget network probe failed: ${
            networkProbe.stderr.trim() || networkProbe.stdout.trim() || `exit code ${networkProbe.code}`
          }`
    );

    return {
      wingetAvailable,
      sourceHealthy,
      networkHealthy,
      details
    };
  }

  async startInstall(
    selectedIds: string[],
    options: StartInstallOptions | undefined,
    settings: DevHubSettings
  ): Promise<InstallSummary> {
    if (this.isRunning) {
      throw new Error("Install task already running.");
    }

    const queue = selectedIds
      .map((id) => this.catalogById.get(id))
      .filter((item): item is SoftwareItem => Boolean(item));

    const env = applyProxyEnv(settings);
    this.isRunning = true;
    this.cancelRequested = false;
    this.failedIds = [];

    this.logger.log(`Start install. total=${queue.length}, dryRun=${options?.dryRun ? "true" : "false"}`);

    for (const item of queue) {
      const target = item.installType === "manual" ? (item.manualUrl ?? item.id) : (item.wingetId ?? item.id);
      this.emitEvent("queued", item.id, `Queued ${target}`);
    }

    let processed = 0;

    for (const item of queue) {
      if (this.cancelRequested) {
        this.logger.log("Install loop stopped due to cancel flag.");
        break;
      }

      if (item.installType === "manual") {
        processed += 1;
        if (item.manualUrl && this.onManualRequired) {
          this.onManualRequired(item);
        }
        this.emitEvent(
          "manual_required",
          item.id,
          item.manualUrl ? `Manual install required: ${item.manualUrl}` : "Manual install required"
        );
        continue;
      }

      const wingetId = item.wingetId;
      if (!wingetId) {
        processed += 1;
        this.failedIds.push(item.id);
        this.emitEvent("failed", item.id, "Missing winget package id.");
        continue;
      }

      this.emitEvent("running", item.id, `Installing ${wingetId}`);
      this.logger.log(`Installing ${wingetId}`);

      const installed = await this.isAlreadyInstalled(item, env);
      if (installed) {
        processed += 1;
        this.emitEvent("skipped_installed", item.id, `Already installed: ${wingetId}`);
        continue;
      }

      if (options?.dryRun) {
        processed += 1;
        this.emitEvent("success", item.id, `Dry run success: ${wingetId}`);
        continue;
      }

      const args = [
        "install",
        "--id",
        wingetId,
        ...(item.exact ? ["--exact"] : []),
        "--silent",
        "--accept-source-agreements",
        "--accept-package-agreements"
      ];

      const result = await this.runner.run("winget", args, env);
      this.logger.logCommand("winget", args, result);

      processed += 1;

      if (result.code === 0) {
        this.emitEvent("success", item.id, `Installed ${wingetId}`, result.code);
      } else {
        this.failedIds.push(item.id);
        this.emitEvent(
          "failed",
          item.id,
          result.stderr.trim() || result.stdout.trim() || `Install failed for ${wingetId}`,
          result.code
        );
      }
    }

    this.isRunning = false;

    const summary: InstallSummary = {
      failedIds: [...this.failedIds],
      cancelled: this.cancelRequested,
      total: queue.length,
      processed
    };

    if (!options?.suppressCompletedEvent) {
      this.emitEvent(
        "completed",
        "system",
        `Completed. processed=${summary.processed}, failed=${summary.failedIds.length}, cancelled=${summary.cancelled}`
      );
    }
    this.logger.log(`Install completed. ${JSON.stringify(summary)}`);
    return summary;
  }

  async retryFailed(settings: DevHubSettings): Promise<InstallSummary> {
    const retryQueue = buildRetryQueue(this.failedIds, Array.from(this.catalogById.values())).map((item) => item.id);
    if (retryQueue.length === 0) {
      const summary: InstallSummary = { failedIds: [], cancelled: false, total: 0, processed: 0 };
      this.emitEvent("completed", "system", "No failed items to retry.");
      return summary;
    }
    return this.startInstall(retryQueue, undefined, settings);
  }

  private emitEvent(status: InstallEvent["status"], itemId: string, message: string, exitCode?: number): void {
    this.emit({
      status,
      itemId,
      message,
      exitCode,
      timestamp: new Date().toISOString()
    });
  }

  private async isAlreadyInstalled(item: SoftwareItem, env: NodeJS.ProcessEnv): Promise<boolean> {
    if (item.installType === "manual") {
      return false;
    }
    if (!item.wingetId) {
      return false;
    }
    const args = ["list", "--id", item.wingetId, ...(item.exact ? ["--exact"] : [])];
    const result = await this.runner.run("winget", args, env);
    this.logger.logCommand("winget", args, result);

    if (result.code !== 0) {
      return false;
    }

    const text = `${result.stdout}\n${result.stderr}`.toLowerCase();
    return text.includes(item.wingetId.toLowerCase());
  }
}
