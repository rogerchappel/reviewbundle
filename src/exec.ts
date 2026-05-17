import { spawn } from "node:child_process";

import { ReviewBundleError } from "./errors.js";

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export async function execFile(command: string, args: string[], cwd: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" }
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const result = {
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8")
      };

      if (code === 0) {
        resolve(result);
        return;
      }

      const message = result.stderr.trim() || "exit " + String(code);
      reject(new ReviewBundleError(command + " " + args.join(" ") + " failed: " + message));
    });
  });
}
