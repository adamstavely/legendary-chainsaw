import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync } from "node:fs"; import { join } from "node:path";
const ROOT = process.argv[2] ? (await import("node:path")).resolve(process.argv[2]) : fileURLToPath(new URL("../..", import.meta.url));
const cssRanges = (src) => { const out = []; const re = /\/\*\s*css\s*\*\/\s*`/g; let m; while ((m = re.exec(src))) { let i = m.index + m[0].length, d = 0; const s = i; for (; i < src.length; i++) { const c = src[i]; if (c === "\\") { i++; continue; } if (!d && c === "`") break; if (c === "$" && src[i + 1] === "{") { d++; i++; continue; } if (d && c === "}") d--; } out.push([s, i]); re.lastIndex = i + 1; } return out; };
const res = [];
for (const lib of ["components", "blocks", "screens", "illustrations", "motion"]) for (const f of readdirSync(join(ROOT, lib)).filter((f) => f.endsWith(".tsx") && !f.endsWith("-clean.tsx"))) {
  const src = readFileSync(join(ROOT, lib, f), "utf8");
  const r = cssRanges(src); let css = "", js = ""; let l = 0; for (const [a, b] of r) { js += src.slice(l, a); css += src.slice(a, b); l = b; } js += src.slice(l);
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const classes = [...new Set([...css.matchAll(/\.(ui-[\w-]+|[a-z][\w-]*__[\w-]+)/g)].map((m) => m[1]))];
  const dead = classes.filter((c) => {
    if (js.includes(c)) return false;
    // BEM suffix used via template: `${ROOT}__x` or "__x"
    const suf = c.match(/__([\w-]+)$/)?.[1];
    if (suf && (js.includes(`__${suf}"`) || js.includes(`__${suf}\``) || js.includes(`__${suf} `) || js.includes(`__${suf}'`) || js.includes(`__${suf}$`) || js.includes(`__${suf}}`))) return false;
    // modifier-ish via template prefix: ui-x__tone-${t}
    const pre = c.replace(/-[\w]+$/, "-");
    if (js.includes(pre + "${")) return false;
    return true;
  });
  // estimate bytes of rules whose selector mentions only dead classes
  let deadBytes = 0;
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) { const sels = m[1].split(","); if (sels.every((s) => dead.some((d) => new RegExp(`\\.${d}(?![\\w-])`).test(s)))) deadBytes += m[0].length; }
  res.push({ file: `${lib}/${f}`, classes: classes.length, dead: dead.length, deadBytes, sample: dead.slice(0, 6) });
}
res.sort((a, b) => b.deadBytes - a.deadBytes);
for (const r of res.slice(0, 20)) console.log(r.file.padEnd(40), r.classes, r.dead, r.deadBytes, r.sample.join(" "));
console.log("total dead bytes (standard files):", res.reduce((a, r) => a + r.deadBytes, 0), "files with dead:", res.filter((r) => r.dead).length);
