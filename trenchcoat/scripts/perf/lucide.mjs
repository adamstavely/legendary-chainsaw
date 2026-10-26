import { fileURLToPath } from "node:url";
import { createRequire } from "node:module"; import { readFileSync } from "node:fs"; import { gzipSync } from "node:zlib";
const ROOT = process.argv[2] ? (await import("node:path")).resolve(process.argv[2]) : fileURLToPath(new URL("../..", import.meta.url)); const require = createRequire(ROOT + "/package.json"); const esbuild = require("esbuild");
const rows = JSON.parse(readFileSync("sizes.json", "utf8")).filter((r) => r.lucide.length);
const all = new Set();
const b = async (names) => { const r = await esbuild.build({ stdin: { contents: `export { ${names.join(",")} } from "lucide-react";`, resolveDir: ROOT, loader: "js" }, bundle: true, write: false, minify: true, format: "esm", external: ["react"], logLevel: "silent" }); const t = r.outputFiles[0].text; return [t.length, gzipSync(t).length]; };
const base = await b(["createLucideIcon"]);
console.log("runtime (createLucideIcon) min/gz", base);
for (const r of rows) { const n = r.lucide.filter((x) => x !== "createLucideIcon"); n.forEach((x) => all.add(x)); const [m, g] = await b(n); console.log(r.file, n.length, "icons", m, g, "per icon min", Math.round((m - base[0]) / n.length)); }
const [m, g] = await b([...all]); console.log("union", all.size, m, g);
// sideEffects check
console.log("lucide sideEffects:", JSON.parse(readFileSync(ROOT + "/node_modules/lucide-react/package.json", "utf8")).sideEffects);
