// Fails when the element, with everything it needs, grows past the budget in PLAN.md
import { gzipSync } from "node:zlib";
import { build } from "vite";

const BUDGET_BYTES = 15 * 1024;
const result = await build({
  logLevel: "silent",
  configFile: false,
  build: { write: false, minify: true, lib: { entry: "src/element/index.ts", formats: ["es"], fileName: "agent-face" } },
});
const code = (Array.isArray(result) ? result[0] : result).output[0].code;
const gzipped = gzipSync(code).length;
console.log(`${(code.length / 1024).toFixed(1)} KB minified, ${(gzipped / 1024).toFixed(1)} KB gzipped, budget ${BUDGET_BYTES / 1024} KB`);
if (gzipped > BUDGET_BYTES) process.exit(1);
