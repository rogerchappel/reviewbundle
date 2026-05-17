#!/usr/bin/env node
import { createBundle } from "./bundle.js";
import { ReviewBundleError } from "./errors.js";
import { stableJson } from "./json.js";
import { parseArgs } from "./args.js";

export async function main(argv = process.argv.slice(2)): Promise<number> {
  let json = false;
  try {
    const options = parseArgs(argv);
    json = options.json;
    const result = await createBundle(options);
    if (json) {
      process.stdout.write(stableJson(result));
    } else if (options.check) {
      process.stdout.write(result.blocked.length === 0 ? "reviewbundle check passed\n" : "reviewbundle check failed\n");
    } else {
      process.stdout.write("reviewbundle wrote " + result.outputDir + "\n");
    }
    return result.blocked.length > 0 ? 2 : 0;
  } catch (error) {
    const exitCode = error instanceof ReviewBundleError ? error.exitCode : 1;
    const message = error instanceof Error ? error.message : String(error);
    if (json) {
      process.stdout.write(stableJson({ error: message, exitCode }));
    } else {
      process.stderr.write(message + "\n");
    }
    return exitCode;
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  process.exitCode = await main();
}
