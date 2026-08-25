import { spawn } from "node:child_process";

import { ReviewBundleError } from "./errors.js";

export interface ExecResult {
  stdout: string;
  stderr: string;
}

export async function execFile(command: string, args: string[], cwd: string, acceptedExitCodes: readonly number[] = [0]): Promise<ExecResult> {
  const result = await execFileBuffer(command, args, cwd, acceptedExitCodes);
  return {
    stdout: result.stdout.toString("utf8"),
    stderr: result.stderr.toString("utf8")
  };
}

export interface ExecBufferResult {
  stdout: Buffer;
  stderr: Buffer;
}

export async function execFileBuffer(
  command: string,
  args: string[],
  cwd: string,
  acceptedExitCodes: readonly number[] = [0]
): Promise<ExecBufferResult> {
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
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr)
      };

      if (code !== null && acceptedExitCodes.includes(code)) {
        resolve(result);
        return;
      }

      const message = result.stderr.toString("utf8").trim() || "exit " + String(code);
      reject(new ReviewBundleError(command + " " + args.join(" ") + " failed: " + message));
    });
  });
}
