// Attribute bytes of a built chunk to its source files via the sourcemap
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const [, , repo, js] = process.argv;
const require = createRequire(repo + "/package.json");
const { SourceMapConsumer } = require("source-map-js");
const code = readFileSync(js, "utf8");
const map = new SourceMapConsumer(JSON.parse(readFileSync(js + ".map", "utf8")));
const lines = code.split("\n");
const bytes = {};
let prev = null;
map.eachMapping((m) => {
  if (prev && prev.generatedLine === m.generatedLine) {
    bytes[prev.source] = (bytes[prev.source] || 0) + (m.generatedColumn - prev.generatedColumn);
  } else if (prev) {
    bytes[prev.source] = (bytes[prev.source] || 0) + (lines[prev.generatedLine - 1].length - prev.generatedColumn);
  }
  prev = m;
});
const group = {};
for (const [s, n] of Object.entries(bytes)) {
  let g = String(s).replace(/.*node_modules\/((@[^/]+\/)?[^/]+).*/, "nm:$1").replace(/.*\/trenchcoat\//, "");
  if (g.startsWith("app/src/demos/")) g = "app/src/demos/*" + (g.split("/").length > 4 ? "/" + g.split("/")[3] : "");
  else if (/^(components|blocks|screens|illustrations|motion)\//.test(g)) g = g.split("/")[0] + "/*";
  group[g] = (group[g] || 0) + n;
}
const tot = code.length;
console.log("total", (tot / 1024).toFixed(0), "KB");
for (const [g, n] of Object.entries(group).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log((n / 1024).toFixed(1).padStart(8), "KB", ((100 * n) / tot).toFixed(1).padStart(5) + "%", g);
console.log("\ntop individual sources");
for (const [s, n] of Object.entries(bytes).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log((n / 1024).toFixed(1).padStart(8), String(s).replace(/.*\/trenchcoat\//, ""));
