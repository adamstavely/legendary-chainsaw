import { fileURLToPath } from "node:url";
// Per-file bundle size measurement for Trenchcoat published files.
// node bundle.mjs <repoRoot> <outJson>
import { createRequire } from "node:module";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";

const ROOT = process.argv[2] ? (await import("node:path")).resolve(process.argv[2]) : fileURLToPath(new URL("../..", import.meta.url));
const OUT = process.argv[3];
const require = createRequire(join(ROOT, "package.json"));
const esbuild = require("esbuild");

const LIBS = ["components", "blocks", "screens", "illustrations", "motion"];
const gz = (s) => gzipSync(Buffer.from(s), { level: 9 }).length;
const br = (s) => brotliCompressSync(Buffer.from(s), { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;

// Find template-literal bodies tagged /* css */ – returns [start,end) of body
export function cssRanges(src) {
  const out = [];
  const re = /\/\*\s*css\s*\*\/\s*`/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length, depth = 0;
    const start = i;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "\\") { i++; continue; }
      if (depth === 0 && c === "`") break;
      if (c === "$" && src[i + 1] === "{") { depth++; i++; continue; }
      if (depth > 0 && c === "}") depth--;
    }
    out.push([start, i]);
    re.lastIndex = i + 1;
  }
  return out;
}
const mapCss = (src, fn) => {
  const r = cssRanges(src);
  let res = "", last = 0;
  for (const [a, b] of r) { res += src.slice(last, a) + fn(src.slice(a, b)); last = b; }
  return res + src.slice(last);
};

const FB_RE = /\/\* Fallbacks so this file works without tokens\.css[^\n]*\n[\s\S]*?:where\(\[data-theme="light"\]\) \{ color-scheme: light; \}\n/;
const stripFallbacks = (src) => src.replace(FB_RE, "").replace(/var\((--tc-[\w-]+), var\(--_tc-[\w-]+\)\)/g, "var($1)");
const stripFallbackBlockOnly = (src) => src.replace(FB_RE, "");

const INT_RE = /\/\* ---------- Shared helpers \(inlined from src\/internal\) ---------- \*\/\n([\s\S]*?)(?=\n\/\* ---------- Styles ---------- \*\/|$)/;
function externaliseInternals(src) {
  const m = src.match(INT_RE);
  if (!m) return null;
  const names = [...m[1].matchAll(/^(?:const|function|class|let)\s+([A-Za-z_$][\w$]*)/gm)].map((x) => x[1]);
  return src.replace(INT_RE, `import { ${names.join(", ")} } from "tc-internal";\n`);
}

// CSS-only transforms (interpolations protected by placeholders)
function protect(body, fn) {
  const subs = [];
  const p = body.replace(/\$\{[^}]*\}/g, (s) => { subs.push(s); return `__TCSUB${subs.length - 1}__`; });
  let r = fn(p);
  return r.replace(/__TCSUB(\d+)__/g, (_, i) => subs[+i]);
}
const minCss = (body) => {
  try { return protect(body, (p) => esbuild.transformSync(p, { loader: "css", minify: true, logLevel: "silent" }).code.trim()).replace(/`/g, "\\`"); }
  catch { return body; }
};
// Drop rules whose selectors only target the other look
function dropLook(body, other) {
  const tag = `data-look="${other}"`;
  const walk = (css) => {
    let out = "", i = 0;
    while (i < css.length) {
      const open = css.indexOf("{", i);
      if (open < 0) { out += css.slice(i); break; }
      // find matching close
      let d = 0, j = open;
      for (; j < css.length; j++) { if (css[j] === "{") d++; else if (css[j] === "}") { d--; if (d === 0) break; } }
      const prelude = css.slice(i, open);
      const inner = css.slice(open + 1, j);
      const sel = prelude.replace(/\/\*[\s\S]*?\*\//g, "").trim();
      if (sel.startsWith("@media") || sel.startsWith("@supports") || sel.startsWith("@container")) {
        const w = walk(inner);
        if (w.trim()) out += prelude + "{" + w + "}";
      } else if (sel.startsWith("@")) {
        out += prelude + "{" + inner + "}";
      } else {
        const parts = sel.split(/,(?![^(]*\))/).map((s) => s.trim());
        const keep = parts.filter((s) => !s.includes(tag));
        if (keep.length) out += "\n" + keep.join(",\n") + " {" + inner + "}";
      }
      i = j + 1;
    }
    return out;
  };
  return protect(body, walk);
}

const uiDeps = new Set();
async function bundle(code, file) {
  const r = await esbuild.build({
    stdin: { contents: code, loader: "tsx", resolveDir: join(ROOT, "components"), sourcefile: file },
    bundle: true, write: false, minify: true, format: "esm", target: "es2020", jsx: "automatic",
    external: ["react", "react-dom", "react/jsx-runtime", "lucide-react", "@/components/ui/*", "tc-internal"],
    define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent", treeShaking: true,
  });
  const js = r.outputFiles[0].text;
  return { min: js.length, gz: gz(js), br: br(js), js };
}

const rows = [];
for (const lib of LIBS) {
  for (const f of readdirSync(join(ROOT, lib)).filter((f) => f.endsWith(".tsx")).sort()) {
    const path = join(ROOT, lib, f);
    const src = readFileSync(path, "utf8");
    const full = await bundle(src, f);
    const noFbBlock = await bundle(stripFallbackBlockOnly(src), f);
    const noFb = await bundle(stripFallbacks(src), f);
    const noCss = await bundle(mapCss(src, () => ""), f);
    const ext = externaliseInternals(src);
    const noInt = ext ? await bundle(ext, f) : full;
    const cssMin = await bundle(mapCss(src, minCss), f);
    const look = f.endsWith("-clean.tsx") ? "clean" : "standard";
    const other = look === "clean" ? "standard" : "clean";
    const oneLook = await bundle(mapCss(src, (b) => dropLook(b, other)), f);
    // everything: tokens.css shipped (no fallbacks) + minified + one look
    const lean = await bundle(mapCss(stripFallbacks(src), (b) => minCss(dropLook(b, other))), f);
    const deps = [...src.matchAll(/from "@\/components\/ui\/([^"]+)"/g)].map((m) => m[1]);
    const lucide = [...src.matchAll(/import\s*\{([^}]*)\}\s*from "lucide-react"/g)].flatMap((m) => m[1].split(",").map((s) => s.trim()).filter((s) => s && !s.startsWith("type ")));
    const cssRaw = cssRanges(src).reduce((n, [a, b]) => n + (b - a), 0);
    const devWarn = (full.js.match(/console\.(warn|error)/g) || []).length;
    rows.push({
      lib, file: f, src: src.length, cssRaw,
      full: { min: full.min, gz: full.gz, br: full.br },
      fbBlock: { min: full.min - noFbBlock.min, gz: full.gz - noFbBlock.gz, br: full.br - noFbBlock.br },
      fbAll: { min: full.min - noFb.min, gz: full.gz - noFb.gz, br: full.br - noFb.br },
      css: { min: full.min - noCss.min, gz: full.gz - noCss.gz, br: full.br - noCss.br },
      internals: { min: full.min - noInt.min, gz: full.gz - noInt.gz, br: full.br - noInt.br },
      cssMinSave: { min: full.min - cssMin.min, gz: full.gz - cssMin.gz, br: full.br - cssMin.br },
      oneLookSave: { min: full.min - oneLook.min, gz: full.gz - oneLook.gz, br: full.br - oneLook.br },
      lean: { min: lean.min, gz: lean.gz, br: lean.br },
      deps, lucide, devWarn,
    });
    process.stderr.write(".");
  }
}
writeFileSync(OUT, JSON.stringify(rows, null, 1));
console.log("\nrows", rows.length);
