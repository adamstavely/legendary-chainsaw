import { fileURLToPath } from "node:url";
import { createRequire } from "node:module"; import { readdirSync, writeFileSync, existsSync } from "node:fs"; import { join } from "node:path";
const ROOT = process.argv[2] ? (await import("node:path")).resolve(process.argv[2]) : fileURLToPath(new URL("../../..", import.meta.url)); const HERE = new URL(".", import.meta.url).pathname;
const require = createRequire(join(ROOT, "package.json")); const esbuild = require("esbuild");
// Components live in src/components (2.2); anything ported to Lit (src/elements/<slug>.ts) is measured through its
// React wrapper – what a React app gets from the package – and the rest (blocks, screens, the kept React files)
// through its React module
const LIBS = ["components", "blocks", "screens", "illustrations", "motion"];
const dirOf = (lib) => (lib === "components" ? "src/components" : lib);
const WRAPPERS = join(ROOT, "src/elements/react.ts");
// BENCH_REACT=1 measures the React module wherever one is left (the kept components), for a same-machine comparison
const ported = (slug) => existsSync(join(ROOT, "src/elements", `${slug}.ts`)) && !(process.env.BENCH_REACT && existsSync(join(ROOT, "src/components", `${slug}.tsx`)));
let imports = `import * as LIT from "${WRAPPERS}";\n`, entries = [];
let i = 0;
for (const lib of LIBS) {
  const demoDir = lib === "components" ? join(ROOT, "app/src/demos") : join(ROOT, "app/src/demos", lib);
  for (const f of readdirSync(demoDir).filter((f) => f.endsWith(".tsx")).sort()) {
    const slug = f.slice(0, -4);
    const lit = lib !== "blocks" && lib !== "screens" && ported(slug);
    const source = join(ROOT, dirOf(lib), f);
    if (!lit && !existsSync(source)) continue;
    imports += `${lit ? "" : `import * as U${i} from "${source}";\n`}import D${i} from "${join(demoDir, f)}";\n`;
    entries.push(`{ id: "${lib === "components" ? slug : lib + "/" + slug}", ui: ${lit ? "LIT" : `U${i}`}, Demo: D${i}, lit: ${lit} }`);
    i++;
  }
}
writeFileSync(join(HERE, "entries.gen.ts"), imports + `export const ENTRIES: { id: string; ui: any; Demo: any; lit: boolean }[] = [\n${entries.join(",\n")}\n];\n`);
const resolveUi = (n) => { for (const d of LIBS) { const f = join(ROOT, dirOf(d), `${n}.tsx`); if (existsSync(f)) return f; } };
const alias = { name: "alias", setup(b) {
  b.onResolve({ filter: /^@\/components\/ui\// }, (a) => ({ path: resolveUi(a.path.slice(16)) }));
  b.onResolve({ filter: /^@(components|blocks|screens|illustrations|motion)\// }, (a) => { const [l, n] = a.path.slice(1).split("/"); return { path: join(ROOT, dirOf(l), n + ".tsx") }; });
  b.onResolve({ filter: /^react-dom\/client$/ }, () => ({ path: join(ROOT, "node_modules/react-dom/profiling.js") }));
} };
await esbuild.build({ entryPoints: [join(HERE, "harness.tsx")], bundle: true, outfile: join(HERE, "out.js"), format: "iife", minify: false, jsx: "automatic", nodePaths: [join(ROOT, "node_modules")],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env.DEV": "false" }, plugins: [alias], logLevel: "warning", target: "es2022" });
writeFileSync(join(HERE, "index.html"), `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="file://${ROOT}/tokens/tokens.css"><style>body{margin:0;font-family:system-ui}#host{width:1100px;padding:16px}</style></head><body><div id="spacer"></div><div id="host"></div><script src="out.js"></script></body></html>`);
console.log("entries", entries.length);
