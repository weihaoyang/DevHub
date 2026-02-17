import { spawn } from "node:child_process";
import type { InstallEvent, RuntimeRepairStepResult } from "../shared/types";
import type { LoggerLike } from "./logger";

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

interface RepairStep {
  name: string;
  itemId: string;
  command: string;
  args: string[];
}

async function runCommand(command: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
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

export async function runRuntimeDllRepairSteps(
  logger: LoggerLike,
  emit: (status: InstallEvent["status"], itemId: string, message: string, exitCode?: number) => void
): Promise<RuntimeRepairStepResult[]> {
  const steps: RepairStep[] = [
    {
      name: "sfc.scannow",
      itemId: "dll-sfc-scan",
      command: "sfc",
      args: ["/scannow"]
    },
    {
      name: "dism.restorehealth",
      itemId: "dll-dism-restorehealth",
      command: "DISM",
      args: ["/Online", "/Cleanup-Image", "/RestoreHealth"]
    }
  ];

  const results: RuntimeRepairStepResult[] = [];

  for (const step of steps) {
    emit("running", step.itemId, `Running ${step.command} ${step.args.join(" ")}`);
    logger.log(`Runtime DLL repair step start: ${step.name}`);

    const result = await runCommand(step.command, step.args);
    logger.logCommand(step.command, step.args, result);

    const success = result.code === 0;
    const message = success
      ? `${step.name} completed.`
      : result.stderr.trim() || result.stdout.trim() || `${step.name} failed.`;

    emit(success ? "success" : "failed", step.itemId, message, result.code);
    results.push({
      name: step.name,
      success,
      message,
      exitCode: result.code
    });
  }

  return results;
}
