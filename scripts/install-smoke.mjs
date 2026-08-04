import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const temporaryPrefix = await mkdtemp(join(tmpdir(), "reviewbundle-install-"));

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
  }
  return result.stdout.trim();
}

try {
  const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  const packResult = JSON.parse(
    run("npm", ["pack", "--json", "--pack-destination", temporaryPrefix])
  )[0];
  run("npm", [
    "install",
    "--global",
    "--prefix",
    temporaryPrefix,
    join(temporaryPrefix, packResult.filename)
  ]);

  const cliPath = join(
    temporaryPrefix,
    process.platform === "win32" ? "reviewbundle.cmd" : "bin/reviewbundle"
  );
  const version = run(cliPath, ["--version"]);
  if (version !== packageJson.version) {
    throw new Error(`Source-installed CLI reported version ${version}; expected ${packageJson.version}`);
  }

  process.stdout.write(`Verified source install and global CLI ${version}\n`);
} finally {
  await rm(temporaryPrefix, { recursive: true, force: true });
}
