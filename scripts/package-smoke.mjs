import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "reviewbundle-package-"));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    ...options
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}`);
  }
  return result.stdout.trim();
}

function collectEntrypoints(packageJson) {
  const entrypoints = new Set([packageJson.main, packageJson.types]);
  for (const target of Object.values(packageJson.bin ?? {})) entrypoints.add(target);

  function visit(value) {
    if (typeof value === "string") entrypoints.add(value);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  }
  visit(packageJson.exports);

  return [...entrypoints]
    .filter(Boolean)
    .map((entrypoint) => entrypoint.replace(/^\.\//, ""));
}

try {
  const packageJson = JSON.parse(await readFile(join(projectRoot, "package.json"), "utf8"));
  const packResult = JSON.parse(
    run("npm", ["pack", "--json", "--pack-destination", temporaryDirectory])
  )[0];
  const packedFiles = new Set(packResult.files.map(({ path }) => path));
  const missingEntrypoints = collectEntrypoints(packageJson).filter(
    (entrypoint) => !packedFiles.has(entrypoint)
  );

  if (missingEntrypoints.length > 0) {
    throw new Error(`Packed artifact is missing entrypoints: ${missingEntrypoints.join(", ")}`);
  }

  const consumerDirectory = join(temporaryDirectory, "consumer");
  run("npm", ["init", "--yes"], { cwd: temporaryDirectory });
  run("npm", ["install", "--ignore-scripts", join(temporaryDirectory, packResult.filename)], {
    cwd: temporaryDirectory
  });
  run(process.execPath, ["--input-type=module", "--eval", 'await import("reviewbundle")'], {
    cwd: temporaryDirectory
  });

  const cliPath = join(
    temporaryDirectory,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "reviewbundle.cmd" : "reviewbundle"
  );
  const version = run(cliPath, ["--version"], { cwd: temporaryDirectory });
  if (version !== packageJson.version) {
    throw new Error(`Packed CLI reported version ${version}; expected ${packageJson.version}`);
  }

  process.stdout.write(
    `Verified ${packResult.filename}: ${packResult.entryCount} files, import and CLI ${version}\n`
  );
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
