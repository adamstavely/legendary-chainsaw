import { fileURLToPath } from "node:url";
import { createRequire } from "node:module"; import { readdirSync, writeFileSync, existsSync } from "node:fs"; import { join } from "node:path";
const ROOT = process.argv[2] ? (await import("node:path")).resolve(process.argv[2]) : fileURLToPath(new URL("../../..", import.meta.url)); const HERE = new URL(".", import.meta.url).pathname;
const require = createRequire(join(ROOT, "package.json")); const esbuild = require("esbuild");
const LIBS = ["components", "blocks", "screens", "illustrations", "motion"];
let imports = "", entries = [];
let i = 0;
for (const lib of LIBS) for (const f of readdirSync(join(ROOT, lib)).filter((f) => f.endsWith(".tsx") && !(f.endsWith("-clean.tsx") && existsSync(join(ROOT, lib, f.replace("-clean.tsx", ".tsx"))))).sort()) {
  const slug = f.slice(0, -4).replace(/-clean$/, "");
  const demo = lib === "components" ? join(ROOT, "app/src/demos", slug + ".tsx") : join(ROOT, "app/src/demos", lib, f);
  if (!existsSync(demo)) continue;
  imports += `import * as U${i} from "${join(ROOT, lib, f)}";\nimport D${i} from "${demo}";\n`;
  entries.push(`{ id: "${lib === "components" ? slug : lib + "/" + slug}", ui: U${i}, Demo: D${i} }`); i++;
}
writeFileSync(join(HERE, "entries.gen.ts"), imports + `export const ENTRIES: { id: string; ui: any; Demo: any }[] = [\n${entries.join(",\n")}\n];\n`);
const resolveUi = (n) => { for (const d of LIBS) { const f = join(ROOT, d, `${n}.tsx`); if (existsSync(f)) return f; } };
const alias = { name: "alias", setup(b) {
  b.onResolve({ filter: /^@\/components\/ui\// }, (a) => ({ path: resolveUi(a.path.slice(16)) }));
  b.onResolve({ filter: /^@(components|blocks|screens|illustrations|motion)\// }, (a) => { const [l, n] = a.path.slice(1).split("/"); return { path: join(ROOT, l, n + ".tsx") }; });
  b.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: join(ROOT, "node_modules/react-dom/profiling.js") }));
} };
await esbuild.build({ entryPoints: [join(HERE, "harness.tsx")], bundle: true, outfile: join(HERE, "out.js"), format: "iife", minify: false, jsx: "automatic", nodePaths: [join(ROOT, "node_modules")],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env.DEV": "false" }, plugins: [alias], logLevel: "warning", target: "es2022" });
writeFileSync(join(HERE, "index.html"), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${ROOT}/tokens/tokens.css"><style>body{margin:0;font-family:system-ui}#host{width:1100px;padding:16px}</style></head><body><div id="spacer"></div><div id="host"></div><script src="out.js"></script></body></html>`);
console.log("entries", entries.length);
