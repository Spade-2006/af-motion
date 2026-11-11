#!/usr/bin/env node

/**
 * AF Motion CLI — Executable Binary Entrypoint
 *
 * Dispatches terminal commands to the AF Motion developer tooling engine.
 */

import { runCLI } from "../dist/cli.js";

runCLI(process.argv.slice(2)).then((code) => {
  process.exit(code ?? 0);
}).catch((err) => {
  console.error("Fatal CLI Error:", err);
  process.exit(1);
});
