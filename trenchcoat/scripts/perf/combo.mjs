import { fileURLToPath } from "node:url";
// What a consumer pays for N components together, as-is and under each proposed build change.
import { createRequire } from "node:module";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";

const ROOT = process.argv[2] ? (await import("node:path")).resolve(process.argv[2]) : fileURLToPath(new URL("../..", import.meta.url));
const HERE = new URL(".", import.meta.url).pathname;
const require = createRequire(join(ROOT, "package.json"));
const esbuild = require("esbuild");
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;
const br = (s) => brotliCompressSync(Buffer.from(s), { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const LIBS = ["components", "blocks", "screens", "illustrations", "motion"];

const FB_RE = /\/\* Fallbacks so this file works without tokens\.css[^\n]*\n[\s\S]*?:where\(\[data-theme="light"\]\) \{ color-scheme: light; \}\n/;
const INT_RE = /\/\* ---------- Shared helpers \(inlined from src\/internal\) ---------- \*\/\n([\s\S]*?)(?=\n\/\* ---------- Styles ---------- \*\/|$)/;

function cssRanges(src) {
  const out = []; const re = /\/\*\s*css\s*\*\/\s*`/g; let m;
  while ((m = re.exec(src))) { let i = m.index + m[0].length, d = 0; const s = i;
    for (; i < src.length; i++) { const c = src[i]; if (c === "\\") { i++; continue; } if (!d && c === "`") break; if (c === "$" && src[i + 1] === "{") { d++; i++; continue; } if (d && c === "}") d--; }
    out.push([s, i]); re.lastIndex = i + 1; }
  return out;
}
const mapCss = (src, fn) => { let r = "", l = 0; for (const [a, b] of cssRanges(src)) { r += src.slice(l, a) + fn(src.slice(a, b)); l = b; } return r + src.slice(l); };
const protect = (body, fn) => { const subs = []; const p = body.replace(/\$\{[^}]*\}/g, (s) => { subs.push(s); return `__TCSUB${subs.length - 1}__`; }); return fn(p).replace(/__TCSUB(\d+)__/g, (_, i) => subs[+i]); };
const minCss = (b) => { try { return protect(b, (p) => esbuild.transformSync(p, { loader: "css", minify: true, logLevel: "silent" }).code.trim()).replace(/`/g, "\\`"); } catch { return b; } };

const resolveUi = (name) => { for (const d of LIBS) { const f = join(ROOT, d, `${name}.tsx`); if (existsSync(f)) return f; } };
const sharedInternals = join(HERE, "tc-internal.ts");
writeFileSync(sharedInternals, readdirSync(join(ROOT, "src/internal")).map((f) => `export * from "${join(ROOT, "src/internal", f)}";`).join("\n"));

function plugin(mode) {
  return {
    name: "tc", setup(b) {
      b.onResolve({ filter: /^@\/components\/ui\// }, (a) => ({ path: resolveUi(a.path.slice("@/components/ui/".length)) }));
      b.onResolve({ filter: /^tc-internal$/ }, () => ({ path: sharedInternals }));
      b.onLoad({ filter: /trenchcoat\/(components|blocks|screens|illustrations|motion)\/[^/]+\.tsx$/ }, (a) => {
        let src = readFileSync(a.path, "utf8");
        if (mode.shared) { const m = src.match(INT_RE); if (m) { const names = [...m[1].matchAll(/^(?:const|function|class|let)\s+([A-Za-z_$][\w$]*)/gm)].map((x) => x[1]); src = src.replace(INT_RE, `import { ${names.join(", ")} } from "tc-internal";\n`); } }
        if (mode.tokens) src = src.replace(FB_RE, "").replace(/var\((--tc-[\w-]+), var\(--_tc-[\w-]+\)\)/g, "var($1)");
        if (mode.cssmin) src = mapCss(src, minCss);
        if (mode.extract) src = mapCss(src, () => "");
        return { contents: src, loader: "tsx" };
      });
    },
  };
}
async function size(entries, mode) {
  const code = entries.map((e, i) => `export * as m${i} from "@/components/ui/${e}";`).join("\n");
  const r = await esbuild.build({ stdin: { contents: code, loader: "ts", resolveDir: HERE }, bundle: true, write: false, minify: true, format: "esm", target: "es2020", jsx: "automatic",
    external: ["react", "react-dom", "react/jsx-runtime", "lucide-react"], plugins: [plugin(mode)], logLevel: "silent", define: { "process.env.NODE_ENV": '"production"' } });
  const js = r.outputFiles[0].text; return { min: js.length, gz: gz(js), br: br(js) };
}
const k = (n) => (n / 1024).toFixed(1);
const SETS = {
  one: ["button"],
  five: ["button", "segmented-control", "combobox", "data-table", "toaster"],
  ten: ["button", "segmented-control", "combobox", "data-table", "toaster", "command-menu", "filter-menu", "date-range-picker", "chat-composer", "tool-call-card"],
  all64: readdirSync(join(ROOT, "components")).filter((f) => f.endsWith(".tsx") && !f.endsWith("-clean.tsx")).map((f) => f.slice(0, -4)),
};
const MODES = { asIs: {}, shared: { shared: true }, tokens: { tokens: true }, cssmin: { cssmin: true }, tokensCssmin: { tokens: true, cssmin: true }, all3: { shared: true, tokens: true, cssmin: true }, extract: { extract: true }, extractShared: { extract: true, shared: true, tokens: true } };
console.log("| set | " + Object.keys(MODES).join(" | ") + " | sum of singles (asIs) |");
for (const [name, set] of Object.entries(SETS)) {
  const cells = [];
  for (const m of Object.values(MODES)) { const s = await size(set, m); cells.push(`${k(s.min)} / ${k(s.gz)} / ${k(s.br)}`); }
  let sum = { min: 0, gz: 0, br: 0 }; for (const e of set) { const s = await size([e], {}); sum.min += s.min; sum.gz += s.gz; sum.br += s.br; }
  console.log(`| ${name} (${set.length}) | ${cells.join(" | ")} | ${k(sum.min)} / ${k(sum.gz)} / ${k(sum.br)} |`);
}
// Closures of blocks/screens (their own file + @/components/ui deps)
console.log("\nclosures");
for (const lib of ["blocks", "screens"]) for (const f of readdirSync(join(ROOT, lib)).filter((f) => f.endsWith(".tsx"))) {
  const src = readFileSync(join(ROOT, lib, f), "utf8"); const deps = [...src.matchAll(/from "@\/components\/ui\/([^"]+)"/g)].map((m) => m[1]);
  if (!deps.length) continue;
  const s = await size([f.slice(0, -4)], {}); console.log(`${lib}/${f}: closure ${k(s.min)} / ${k(s.gz)} / ${k(s.br)} deps ${deps.join(",")}`);
}
// tokens.css
const tc = readFileSync(join(ROOT, "tokens/tokens.css"), "utf8");
const tcm = esbuild.transformSync(tc, { loader: "css", minify: true }).code;
console.log(`\ntokens.css raw ${k(tc.length)} min ${k(tcm.length)} gz ${k(gz(tcm))} br ${k(br(tcm))}`);
// shared internals module alone
const si = await esbuild.build({ entryPoints: [sharedInternals], bundle: true, write: false, minify: true, format: "esm", external: ["react"], logLevel: "silent" });
console.log(`all src/internal min ${k(si.outputFiles[0].text.length)} gz ${k(gz(si.outputFiles[0].text))}`);
