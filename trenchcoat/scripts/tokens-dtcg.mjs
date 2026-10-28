// Exports tokens/tokens.css in the Design Tokens Community Group format (DTCG Format Module 2025.10), so design tools
// (Tokens Studio, Style Dictionary, Penpot …) can read the same dictionary the components use (remediation Phase 2).
//
//   tokens/dtcg/primitives.json       the look- and theme-independent primitives (--tc-gray-*, --tc-space-* …)
//   tokens/dtcg/<look>-<theme>.json   every semantic and pattern token for one look and theme: standard-light,
//                                     standard-dark, clean-light, clean-dark. A token that's another token in the CSS
//                                     (var(--tc-gray-900)) is an alias ({gray.900}); anything else is its value,
//                                     resolved for that look and theme
//   tokens/dtcg/$themes.json, $metadata.json   the four modes as Tokens Studio themes over those sets
//
// Names follow the CSS: --tc-text-primary is text.primary, --tc-gray-900 gray.900, and a name that's also a group
// (--tc-accent beside --tc-accent-subtle) is the group's $root. Types are the format's: color (sRGB components and
// hex), dimension (px), duration (ms), cubicBezier, fontFamily, fontWeight, number, shadow and border. A few CSS values
// have no DTCG type – keywords like `uppercase`, lengths in em, a padding shorthand – and are listed, with their CSS,
// under $extensions["com.trenchcoat"].cssOnly in each file instead.
//
//   node scripts/tokens-dtcg.mjs            write tokens/dtcg/
//   node scripts/tokens-dtcg.mjs --check    fail when a file is out of date, or when the export doesn't say what the
//                                           CSS says: every alias must resolve, and every token, resolved through the
//                                           export, must match the CSS's own value for that look and theme
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DICTIONARY = fileURLToPath(new URL("../tokens/tokens.css", import.meta.url));
const OUT = fileURLToPath(new URL("../tokens/dtcg/", import.meta.url));
const check = process.argv.includes("--check");

/* ---------- Reading tokens.css ---------- */

const css = readFileSync(DICTIONARY, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
function block(selectorStart) {
  const at = css.indexOf(selectorStart);
  if (at < 0) throw new Error(`no block ${selectorStart} in tokens.css`);
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  return Object.fromEntries([...css.slice(open + 1, close).matchAll(/(--tc-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const primitives = block(":where(:root) {");
const LOOKS = { standard: block(':where(:root, [data-tc-look="standard"]'), clean: block(':where([data-tc-look="clean"]') };
const THEMES = ["light", "dark"];

/** Splits a list at its top-level commas (or spaces) */
function split(value, sep = ",") {
  const out = [];
  let depth = 0;
  let buf = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && (sep === " " ? /\s/.test(ch) : ch === sep)) {
      if (buf.trim()) out.push(buf.trim());
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
/** A value with light-dark() picked for the theme, at any depth */
function pickTheme(value, theme) {
  const at = value.indexOf("light-dark(");
  if (at < 0) return value;
  let depth = 0;
  let end = at + "light-dark(".length;
  for (; end < value.length; end++) {
    if (value[end] === "(") depth++;
    else if (value[end] === ")") {
      if (depth === 0) break;
      depth--;
    }
  }
  const [light, dark] = split(value.slice(at + "light-dark(".length, end));
  return pickTheme(value.slice(0, at) + (theme === "light" ? light : dark) + value.slice(end + 1), theme);
}

/* ---------- Names ---------- */

/** Prefixes that are one group though they hold a hyphen */
const COMPOUND = ["line-height", "font-size", "font-weight", "font-family", "focus-ring", "focus"];
function pathOf(name, all) {
  const bare = name.replace(/^--tc-/, "");
  const prefix = COMPOUND.find((p) => bare === p || bare.startsWith(`${p}-`)) ?? bare.split("-")[0];
  const key = bare.slice(prefix.length).replace(/^-/, "");
  // The group's own token is $root when the group holds others too
  const siblings = all.some((n) => n !== name && n.replace(/^--tc-/, "").startsWith(`${prefix}-`));
  if (!key) return siblings ? [prefix, "$root"] : [prefix];
  return [prefix, key];
}
const ref = (path) => `{${path.join(".")}}`;

/* ---------- Values ---------- */

const NAMED = { transparent: [0, 0, 0, 0], white: [1, 1, 1, 1], black: [0, 0, 0, 1] };
/** A CSS colour as [r, g, b, a] (0–1), or null */
function color(v) {
  v = v.trim();
  if (v in NAMED) return NAMED[v];
  let m = /^#([0-9a-f]{3,8})$/i.exec(v);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return [n(0), n(2), n(4), h.length === 8 ? n(6) : 1];
  }
  m = /^rgba?\(([^)]+)\)$/i.exec(v);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] ?? 1];
  }
  m = /^color-mix\(in srgb,\s*(.+)\)$/i.exec(v);
  if (m) {
    const [a, b] = split(m[1]);
    const part = (s) => {
      const pm = /^(.*?)\s+(\d*\.?\d+)%$/.exec(s);
      return pm ? [pm[1], Number(pm[2]) / 100] : [s, null];
    };
    const [ca, pa] = part(a);
    const [cb, pb] = part(b);
    const A = color(ca);
    const B = color(cb);
    if (!A || !B) return null;
    const wa = pa ?? (pb === null ? 0.5 : 1 - pb);
    const wb = pb ?? 1 - wa;
    // Premultiplied, as CSS mixes
    const alpha = A[3] * wa + B[3] * wb;
    const ch = (i) => (alpha ? (A[i] * A[3] * wa + B[i] * B[3] * wb) / alpha : 0);
    return [ch(0), ch(1), ch(2), alpha];
  }
  return null;
}
const round = (n, d = 4) => Math.round(n * 10 ** d) / 10 ** d;
const hex2 = (n) => Math.round(n * 255).toString(16).padStart(2, "0");
const colorValue = ([r, g, b, a]) => ({ colorSpace: "srgb", components: [round(r), round(g), round(b)], ...(a < 1 ? { alpha: round(a) } : {}), hex: `#${hex2(r)}${hex2(g)}${hex2(b)}` });

/** A length in px, or null: 4px, 0, calc(16px + 4px) */
function px(v) {
  v = v.trim();
  if (v === "0") return 0;
  let m = /^(-?\d*\.?\d+)px$/.exec(v);
  if (m) return Number(m[1]);
  m = /^calc\((.+)\)$/.exec(v);
  if (m) {
    const terms = m[1].split(/\s+([+-])\s+/);
    let total = px(terms[0]);
    for (let i = 1; i < terms.length && total !== null; i += 2) {
      const t = px(terms[i + 1]);
      total = t === null ? null : terms[i] === "+" ? total + t : total - t;
    }
    return total;
  }
  return null;
}
const EASES = { ease: [0.25, 0.1, 0.25, 1], linear: [0, 0, 1, 1], "ease-in": [0.42, 0, 1, 1], "ease-out": [0, 0, 0.58, 1], "ease-in-out": [0.42, 0, 0.58, 1] };

/** A resolved CSS value as a DTCG { $type, $value }, or null when the format has no type for it */
function typed(name, v) {
  const bare = name.replace(/^--tc-/, "");
  const c = color(v);
  if (c) return { $type: "color", $value: colorValue(c) };
  if (/^-?\d*\.?\d+ms$/.test(v)) return { $type: "duration", $value: { value: Number(v.slice(0, -2)), unit: "ms" } };
  if (/^-?\d*\.?\d+s$/.test(v)) return { $type: "duration", $value: { value: Number(v.slice(0, -1)) * 1000, unit: "ms" } };
  const cb = /^cubic-bezier\(([^)]+)\)$/.exec(v);
  if (cb) return { $type: "cubicBezier", $value: cb[1].split(",").map((n) => Number(n)) };
  if (v in EASES) return { $type: "cubicBezier", $value: EASES[v] };
  if (/^font-weight/.test(bare) && /^\d+$/.test(v)) return { $type: "fontWeight", $value: Number(v) };
  if (/^(font-sans|font-mono|font-serif)$/.test(bare)) return { $type: "fontFamily", $value: split(v).map((f) => f.replace(/^["']|["']$/g, "")) };
  const len = px(v);
  if (len !== null && (v !== "0" || /(radius|space|size|width|h$|h-|px|py|inset|gap|offset|hairline|blur|tracking)/.test(bare))) return { $type: "dimension", $value: { value: len, unit: "px" } };
  if (/^-?\d*\.?\d+$/.test(v)) return { $type: "number", $value: Number(v) };
  // A border: width style colour
  const parts = split(v, " ");
  if (parts.length === 3 && px(parts[0]) !== null && /^(solid|dashed|dotted|double)$/.test(parts[1]) && color(parts[2]))
    return { $type: "border", $value: { color: colorValue(color(parts[2])), width: { value: px(parts[0]), unit: "px" }, style: parts[1] } };
  // A shadow: one or more layers of [inset] x y [blur [spread]] colour
  const layers = split(v);
  const shadow = layers.map((layer) => {
    const t = split(layer, " ");
    const inset = t[0] === "inset";
    if (inset) t.shift();
    const col = t.length ? color(t[t.length - 1]) : null;
    const lens = t.slice(0, -1).map(px);
    if (!col || lens.length < 2 || lens.length > 4 || lens.some((l) => l === null)) return null;
    const d = (n) => ({ value: n ?? 0, unit: "px" });
    return { color: colorValue(col), offsetX: d(lens[0]), offsetY: d(lens[1]), blur: d(lens[2]), spread: d(lens[3]), ...(inset ? { inset: true } : {}) };
  });
  if (shadow.every(Boolean)) return { $type: "shadow", $value: shadow.length === 1 ? shadow[0] : shadow };
  return null;
}

/* ---------- Building the sets ---------- */

/** Every token of one look and theme, resolved to its CSS value */
function resolver(decls, theme) {
  const memo = new Map();
  const resolve = (name, seen = new Set()) => {
    if (memo.has(name)) return memo.get(name);
    if (!(name in decls) || seen.has(name)) throw new Error(`cannot resolve ${name}`);
    const out = pickTheme(decls[name], theme).replace(/var\((--tc-[\w-]+)\)/g, (_, n) => resolve(n, new Set([...seen, name])));
    memo.set(name, out);
    return out;
  };
  return resolve;
}

const ALL = [...new Set([...Object.keys(primitives), ...Object.keys(LOOKS.standard), ...Object.keys(LOOKS.clean)])];
const setPath = (tree, path, token) => {
  let at = tree;
  for (const p of path.slice(0, -1)) at = at[p] ??= {};
  at[path[path.length - 1]] = token;
};

/** One set: the given tokens, as aliases where the CSS points at a token, else as values */
function buildSet(names, decls, theme, description) {
  const resolve = resolver(decls, theme);
  const tree = { $description: description };
  const cssOnly = {};
  const types = new Map();
  for (const name of names) {
    const raw = pickTheme(decls[name], theme);
    const alias = /^var\((--tc-[\w-]+)\)$/.exec(raw);
    const value = resolve(name);
    const t = typed(name, value);
    if (!t) {
      cssOnly[name] = value;
      continue;
    }
    types.set(name, t.$type);
    const token = alias && typed(alias[1], resolve(alias[1]))?.$type === t.$type ? { $type: t.$type, $value: ref(pathOf(alias[1], ALL)) } : t;
    setPath(tree, pathOf(name, ALL), { ...token, $extensions: { "com.trenchcoat": { css: name } } });
  }
  if (Object.keys(cssOnly).length) tree.$extensions = { "com.trenchcoat": { cssOnly } };
  return { tree, cssOnly };
}

const files = new Map();
const prim = buildSet(Object.keys(primitives), primitives, "light", "Trenchcoat primitives: raw values, the same in every look and theme. Components use the semantic and pattern tokens in the look and theme sets, which point here.");
files.set("primitives.json", prim.tree);
const modes = [];
for (const look of Object.keys(LOOKS)) {
  for (const theme of THEMES) {
    const decls = { ...primitives, ...LOOKS[look] };
    const set = buildSet(Object.keys(LOOKS[look]), decls, theme, `Trenchcoat's ${look[0].toUpperCase()}${look.slice(1)} look in the ${theme} theme: every semantic and pattern token. Aliases point at primitives.json.`);
    files.set(`${look}-${theme}.json`, set.tree);
    modes.push({ look, theme, set: `${look}-${theme}` });
  }
}
files.set("$metadata.json", { tokenSetOrder: ["primitives", ...modes.map((m) => m.set)] });
files.set(
  "$themes.json",
  modes.map((m) => ({
    id: m.set,
    name: `${m.look[0].toUpperCase()}${m.look.slice(1)} · ${m.theme[0].toUpperCase()}${m.theme.slice(1)}`,
    group: "Trenchcoat",
    selectedTokenSets: { primitives: "source", [m.set]: "enabled" },
  })),
);

/* ---------- Checking the export against the CSS ---------- */

const problems = [];
/** A token's value through the export: follow aliases to the end */
function viaExport(set, path, seen = new Set()) {
  const key = path.join(".");
  if (seen.has(key)) throw new Error(`alias loop at ${key}`);
  let at = set;
  for (const p of path) at = at?.[p];
  if (!at && set !== prim.tree) return viaExport(prim.tree, path, seen);
  if (!at || !("$value" in at)) return undefined;
  const v = at.$value;
  if (typeof v === "string" && /^\{.+\}$/.test(v)) return viaExport(set, v.slice(1, -1).split("."), new Set([...seen, key]));
  return { $type: at.$type, $value: v };
}
for (const m of modes) {
  const set = files.get(`${m.set}.json`);
  const decls = { ...primitives, ...LOOKS[m.look] };
  const resolve = resolver(decls, m.theme);
  for (const name of Object.keys(LOOKS[m.look])) {
    const want = typed(name, resolve(name));
    if (!want) continue;
    const got = viaExport(set, pathOf(name, ALL));
    if (!got) problems.push(`${m.set}: ${name} doesn't resolve through the export`);
    else if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${m.set}: ${name} is ${JSON.stringify(got.$value)} through the export, ${JSON.stringify(want.$value)} in the CSS`);
  }
}

let stale = 0;
if (!check) mkdirSync(OUT, { recursive: true });
for (const [file, data] of files) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  const path = `${OUT}${file}`;
  if (existsSync(path) && readFileSync(path, "utf8") === text) continue;
  if (check) {
    console.error(`tokens/dtcg/${file} is out of date – run node scripts/tokens-dtcg.mjs`);
    stale++;
  } else writeFileSync(path, text);
}
const count = (tree) => JSON.stringify(tree).split('"$value"').length - 1;
const exported = [...files.entries()].filter(([f]) => !f.startsWith("$")).map(([f, t]) => `${f.replace(".json", "")} ${count(t)}`);
const cssOnly = Object.keys(files.get("standard-light.json").$extensions?.["com.trenchcoat"]?.cssOnly ?? {});
if (problems.length) console.error(`dtcg: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n  ${problems.slice(0, 20).join("\n  ")}`);
else if (!stale) console.log(`dtcg ok: ${exported.join(", ")} tokens; css-only in each look: ${cssOnly.length} (${cssOnly.join(", ")})`);
process.exit(stale || problems.length ? 1 : 0);
