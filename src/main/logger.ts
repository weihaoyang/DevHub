import { mkdirSync, appendFileSync } from "node:fs";
import path from "node:path";

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface LoggerLike {
  getLogPath: () => string;
  log: (line: string) => void;
  logCommand: (command: string, args: string[], result: CommandResult) => void;
}

function timeStamp(): string {
  return new Date().toISOString();
}

function fileStamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  const hh = now.getHours().toString().padStart(2, "0");
  const mi = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

export class FileLogger implements LoggerLike {
  private readonly filePath: string;

  constructor(baseDir: string) {
    const logDir = path.join(baseDir, "logs");
    mkdirSync(logDir, { recursive: true });
    this.filePath = path.join(logDir, `devhub-${fileStamp()}.log`);
    this.log("Logger initialized.");
  }

  getLogPath(): string {
    return this.filePath;
  }

  log(line: string): void {
    appendFileSync(this.filePath, `[${timeStamp()}] ${line}\n`, "utf8");
  }

  logCommand(command: string, args: string[], result: CommandResult): void {
    const output = `${result.stdout}\n${result.stderr}`.trim();
    const summary = output.length > 2000 ? `${output.slice(0, 2000)} ...` : output;
    this.log(`$ ${command} ${args.join(" ")}`);
    this.log(`ExitCode: ${result.code}`);
    if (summary) {
      this.log(`Output: ${summary}`);
    }
  }
}

export const NullLogger: LoggerLike = {
  getLogPath: () => "",
  log: () => undefined,
  logCommand: () => undefined
};
