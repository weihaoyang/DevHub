import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import type { PostConfigOptions, PostConfigResult, PostConfigStepResult } from "../shared/types";
import type { LoggerLike } from "./logger";

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
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

export async function runPostConfiguration(options: PostConfigOptions, logger: LoggerLike): Promise<PostConfigResult> {
  const steps: PostConfigStepResult[] = [];

  if (options.gitName) {
    const result = await runCommand("git", ["config", "--global", "user.name", options.gitName]);
    const success = result.code === 0;
    logger.log(`PostConfig git user.name: ${success ? "ok" : "failed"} (${result.code})`);
    steps.push({
      name: "git.user.name",
      success,
      message: success ? "Configured git user.name." : (result.stderr || result.stdout || "Failed to configure.")
    });
  }

  if (options.gitEmail) {
    const result = await runCommand("git", ["config", "--global", "user.email", options.gitEmail]);
    const success = result.code === 0;
    logger.log(`PostConfig git user.email: ${success ? "ok" : "failed"} (${result.code})`);
    steps.push({
      name: "git.user.email",
      success,
      message: success ? "Configured git user.email." : (result.stderr || result.stdout || "Failed to configure.")
    });
  }

  const sshDir = path.join(process.env.USERPROFILE ?? "", ".ssh");
  try {
    if (!existsSync(sshDir)) {
      mkdirSync(sshDir, { recursive: true });
    }
    steps.push({
      name: "ssh.directory",
      success: true,
      message: `SSH directory ensured at ${sshDir}`
    });
    logger.log(`PostConfig ssh directory ensured: ${sshDir}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    steps.push({
      name: "ssh.directory",
      success: false,
      message
    });
    logger.log(`PostConfig ssh directory failed: ${message}`);
  }

  const toolChecks = ["git", "node", "python"];
  for (const tool of toolChecks) {
    const result = await runCommand("where", [tool]);
    const success = result.code === 0;
    steps.push({
      name: `path.check.${tool}`,
      success,
      message: success ? result.stdout.trim() : `${tool} not found in PATH`
    });
    logger.log(`PostConfig PATH check ${tool}: ${success ? "ok" : "missing"}`);
  }

  return {
    success: steps.every((step) => step.success),
    steps
  };
}
