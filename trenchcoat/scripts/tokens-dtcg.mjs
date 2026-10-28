// Exports tokens/tokens.css in the Design Tokens Community Group format (DTCG Format Module 2025.10), so design tools
// (Style Dictionary, Penpot, Tokens Studio …) can read the same dictionary the components use (remediation Phase 2).
//
//   tokens/dtcg/primitives.json       the look- and theme-independent primitives (--tc-gray-*, --tc-space-* …)
//   tokens/dtcg/<look>-<theme>.json   every semantic and pattern token for one look and theme: standard-light,
//                                     standard-dark, clean-light, clean-dark. A token that's another token in the CSS
//                                     (var(--tc-gray-900)) is an alias ({gray.900}), and so is a shadow layer's or a
//                                     border's colour and width; anything else is its value, resolved for that look and
//                                     theme – color-mix() and calc() have no DTCG form, so those are baked
//   tokens/dtcg/tokens-studio/        the same sets with string values ("#0b0d10", "4px"), Tokens Studio's types
//                                     (boxShadow, fontWeights …) and DEFAULT for $root – Tokens Studio's DTCG mode
//                                     doesn't read 2025.10 colour and dimension objects yet – with $themes.json and
//                                     $metadata.json pairing each mode with the primitives
//
// Names follow the CSS: --tc-text-primary is text.primary, --tc-gray-900 gray.900, and a name that's also a group
// (--tc-accent beside --tc-accent-subtle) is the group's $root. Types are the format's: color (sRGB components and
// hex), dimension (px), duration (ms), cubicBezier, fontFamily, fontWeight, number, shadow and border. A few CSS values
// have no DTCG type – keywords like `uppercase`, lengths in em, a padding shorthand – and are listed, with their CSS,
// under $extensions["com.trenchcoat"].cssOnly in each file instead.
//
//   node scripts/tokens-dtcg.mjs            write tokens/dtcg/
//   node scripts/tokens-dtcg.mjs --check    fail when a file is out of date, an alias doesn't resolve, or a token,
//                                           resolved through the export, isn't what a browser computes from
//                                           tokens.css for that look and theme (Chromium via Playwright)
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  if (/(^|-)font-weight(-|$)/.test(bare) && /^\d+$/.test(v)) return { $type: "fontWeight", $value: Number(v) };
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

const VAR = /^var\((--tc-[\w-]+)\)$/;

/** A token as { $type, $value } resolved for one theme. A plain alias is typed by what it points at, so a weight that's
 *  var(--tc-font-weight-medium) stays a fontWeight */
function typeToken(name, decls, theme, resolve) {
  const alias = VAR.exec(pickTheme(decls[name], theme));
  return (alias && alias[1] in decls && typed(alias[1], resolve(name))) || typed(name, resolve(name));
}

/** A shadow or border read from its CSS with references kept where the format allows one – a layer's colour and
 *  lengths, a border's colour and width. A layer that's a whole shadow token is expanded. null when a part can't be
 *  read that way (calc(), color-mix() inline …), and the caller keeps the resolved value */
function compositeWithRefs(raw, $type, decls, theme, resolve) {
  const inline = (s) => s.replace(/var\((--tc-[\w-]+)\)/g, (_, n) => resolve(n));
  const part = (s, want) => {
    const m = VAR.exec(s);
    if (m && m[1] in decls && typeToken(m[1], decls, theme, resolve)?.$type === want) return ref(pathOf(m[1], ALL));
    const v = inline(s);
    if (want === "color") return color(v) ? colorValue(color(v)) : null;
    const l = px(v);
    return l === null ? null : { value: l, unit: "px" };
  };
  if ($type === "border") {
    const p = split(raw, " ");
    if (p.length !== 3) return null;
    const width = part(p[0], "dimension");
    const col = part(p[2], "color");
    return width && col ? { color: col, width, style: p[1] } : null;
  }
  const layers = (r, depth) =>
    split(r).flatMap((layer) => {
      const m = VAR.exec(layer);
      return m && m[1] in decls && depth < 8 ? layers(pickTheme(decls[m[1]], theme), depth + 1) : [layer];
    });
  const out = layers(raw, 0).map((layer) => {
    const t = split(layer, " ");
    const inset = t[0] === "inset";
    if (inset) t.shift();
    if (t.length < 3 || t.length > 5) return null;
    const col = part(t[t.length - 1], "color");
    const lens = t.slice(0, -1).map((x) => part(x, "dimension"));
    if (!col || lens.some((l) => l === null)) return null;
    const none = { value: 0, unit: "px" };
    return { color: col, offsetX: lens[0], offsetY: lens[1], blur: lens[2] ?? none, spread: lens[3] ?? none, ...(inset ? { inset: true } : {}) };
  });
  if (out.some((l) => !l)) return null;
  return out.length === 1 ? out[0] : out;
}

/** One set: the given tokens, as aliases where the CSS points at a token, else as values */
function buildSet(names, decls, theme, description) {
  const resolve = resolver(decls, theme);
  const tree = { $description: description };
  const cssOnly = {};
  for (const name of names) {
    const raw = pickTheme(decls[name], theme);
    const alias = VAR.exec(raw);
    const t = typeToken(name, decls, theme, resolve);
    if (!t) {
      cssOnly[name] = resolve(name);
      continue;
    }
    let token = t;
    if (alias && alias[1] in decls && typeToken(alias[1], decls, theme, resolve)?.$type === t.$type) token = { $type: t.$type, $value: ref(pathOf(alias[1], ALL)) };
    else if (t.$type === "shadow" || t.$type === "border") {
      const kept = compositeWithRefs(raw, t.$type, decls, theme, resolve);
      if (kept) token = { $type: t.$type, $value: kept };
    }
    setPath(tree, pathOf(name, ALL), { ...token, $extensions: { "com.trenchcoat": { css: name } } });
  }
  if (Object.keys(cssOnly).length) tree.$extensions = { "com.trenchcoat": { cssOnly } };
  return { tree, cssOnly };
}

/* ---------- Tokens Studio ---------- */

// Tokens Studio's DTCG mode reads $value/$type but still wants its own value strings and type names, and blocks "$" in
// token names – so $root becomes DEFAULT there
const STUDIO_TYPES = { color: "color", dimension: "dimension", number: "number", fontWeight: "fontWeights", fontFamily: "fontFamilies", shadow: "boxShadow", border: "border", duration: "other", cubicBezier: "other" };
function studioValue($type, v) {
  if (typeof v === "string") return v.replace(/\.\$root\}/g, ".DEFAULT}");
  switch ($type) {
    case "color":
      return v.alpha === undefined ? v.hex : `${v.hex}${hex2(v.alpha)}`;
    case "dimension":
    case "duration":
      return `${v.value}${v.unit}`;
    case "cubicBezier":
      return `cubic-bezier(${v.join(", ")})`;
    case "fontFamily":
      return v.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(", ");
    case "shadow": {
      const layer = (l) => ({ x: studioValue("dimension", l.offsetX), y: studioValue("dimension", l.offsetY), blur: studioValue("dimension", l.blur), spread: studioValue("dimension", l.spread), color: studioValue("color", l.color), type: l.inset ? "innerShadow" : "dropShadow" });
      return Array.isArray(v) ? v.map(layer) : layer(v);
    }
    case "border":
      return { color: studioValue("color", v.color), width: studioValue("dimension", v.width), style: v.style };
    default:
      return v;
  }
}
function studioTree(node) {
  if (node && typeof node === "object" && "$value" in node) return { ...node, $type: STUDIO_TYPES[node.$type] ?? node.$type, $value: studioValue(node.$type, node.$value) };
  return Object.fromEntries(Object.entries(node).map(([k, v]) => [k === "$root" ? "DEFAULT" : k, k.startsWith("$") && k !== "$root" ? v : studioTree(v)]));
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
for (const [file, tree] of [...files]) files.set(`tokens-studio/${file}`, studioTree(tree));
files.set("tokens-studio/$metadata.json", { tokenSetOrder: ["primitives", ...modes.map((m) => m.set)] });
files.set(
  "tokens-studio/$themes.json",
  modes.map((m) => ({
    id: m.set,
    name: `${m.look[0].toUpperCase()}${m.look.slice(1)} · ${m.theme[0].toUpperCase()}${m.theme.slice(1)}`,
    group: "Trenchcoat",
    selectedTokenSets: { primitives: "source", [m.set]: "enabled" },
  })),
);

/* ---------- Checking the export ---------- */

const problems = [];
/** A token's value through the export: aliases followed to the end, references inside composites too */
function viaExport(set, path, seen = new Set()) {
  const key = path.join(".");
  if (seen.has(key)) throw new Error(`alias loop at ${key}`);
  let at = set;
  for (const p of path) at = at?.[p];
  if (!at && set !== prim.tree) return viaExport(prim.tree, path, seen);
  if (!at || !("$value" in at)) return undefined;
  const deep = (v) => {
    if (typeof v === "string" && /^\{.+\}$/.test(v)) return viaExport(set, v.slice(1, -1).split("."), new Set([...seen, key]))?.$value;
    if (Array.isArray(v)) return v.map(deep);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deep(x)]));
    return v;
  };
  return { $type: at.$type, $value: deep(at.$value) };
}
/** Every exported token in a tree: [css name, path] */
function tokensOf(tree, path = []) {
  if (tree && typeof tree === "object" && "$value" in tree) return [[tree.$extensions["com.trenchcoat"].css, path]];
  return Object.entries(tree).filter(([k]) => !k.startsWith("$") || k === "$root").flatMap(([k, v]) => tokensOf(v, [...path, k]));
}

// 1. Every alias resolves, and the export says what this script read from the CSS (catches a broken alias or path)
for (const m of [{ set: "primitives", look: null, theme: "light" }, ...modes]) {
  const set = files.get(`${m.set}.json`);
  const decls = m.look ? { ...primitives, ...LOOKS[m.look] } : primitives;
  const resolve = resolver(decls, m.theme);
  for (const name of Object.keys(m.look ? LOOKS[m.look] : primitives)) {
    const want = typeToken(name, decls, m.theme, resolve);
    if (!want) continue;
    const got = viaExport(set, pathOf(name, ALL));
    if (!got) problems.push(`${m.set}: ${name} doesn't resolve through the export`);
    else if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${m.set}: ${name} is ${JSON.stringify(got.$value)} through the export, ${JSON.stringify(want.$value)} as read from the CSS`);
  }
}

// 2. Independently of how this script reads CSS: a browser computes every token from tokens.css, per look and theme,
// and each must match the export resolved through its aliases
async function browserCheck() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    problems.push("the browser check needs Playwright – npm ci");
    return;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    problems.push(`the browser check needs Chromium – npx playwright install chromium (${String(e.message).split("\n")[0]})`);
    return;
  }
  const page = await browser.newPage();
  const cssText = readFileSync(DICTIONARY, "utf8");
  const sets = [{ set: "primitives", look: "standard", theme: "light" }, ...modes];
  for (const m of sets) {
    await page.setContent(`<!doctype html><html data-tc-look="${m.look}" data-tc-theme="${m.theme}"><head><style>${cssText}</style></head><body><div id="p"></div></body></html>`);
    const set = files.get(`${m.set}.json`);
    const items = tokensOf(set).map(([name, path]) => ({ name, path, ...viaExport(set, path) }));
    const computed = await page.evaluate((list) => {
      const reg = (name, syntax, initialValue) => {
        try {
          CSS.registerProperty({ name, syntax, inherits: false, initialValue });
        } catch {
          /* already registered */
        }
      };
      reg("--probe-length", "<length>", "0px");
      reg("--probe-time", "<time>", "0s");
      reg("--probe-number", "<number>", "0");
      const p = document.getElementById("p");
      return list.map(({ name, type }) => {
        p.removeAttribute("style");
        const v = `var(${name})`;
        const cs = getComputedStyle(p);
        const custom = (prop) => (p.style.setProperty(prop, v), cs.getPropertyValue(prop));
        if (type === "color") return (p.style.color = v), cs.color;
        if (type === "dimension") return custom("--probe-length");
        if (type === "duration") return custom("--probe-time");
        if (type === "number" || type === "fontWeight") return custom("--probe-number");
        if (type === "cubicBezier") return (p.style.transitionTimingFunction = v), cs.transitionTimingFunction;
        if (type === "fontFamily") return (p.style.fontFamily = v), cs.fontFamily;
        if (type === "shadow") return (p.style.boxShadow = v), cs.boxShadow;
        if (type === "border") return (p.style.borderTop = v), [cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor].join("|");
        return null;
      });
    }, items.map((t) => ({ name: t.name, type: t.$type })));
    items.forEach((t, i) => {
      const why = differs(t.$type, t.$value, computed[i]);
      if (why) problems.push(`${m.set}: ${t.name} is ${JSON.stringify(t.$value)} in the export, ${computed[i]} in the browser${why === true ? "" : ` (${why})`}`);
    });
  }
  await browser.close();
}

/** rgb()/rgba()/color(srgb …) as [r, g, b, a] (0–1) */
function browserColor(s) {
  s = s.trim();
  let m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return [p[0] / 255, p[1] / 255, p[2] / 255, p[3] ?? 1];
  }
  m = /^color\(srgb\s+([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number);
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  return null;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const sameColor = (exp, got) => {
  const c = browserColor(got ?? "");
  return !!c && exp.components.every((v, i) => near(v, c[i], 0.004)) && near(exp.alpha ?? 1, c[3], 0.004);
};
const len = (s) => (/^-?[\d.]+px$/.test(s.trim()) ? Number(s.trim().slice(0, -2)) : NaN);
/** Why an exported value differs from the browser's, or false when they agree */
function differs(type, exp, got) {
  if (got == null || got === "") return "no computed value";
  switch (type) {
    case "color":
      return !sameColor(exp, got);
    case "dimension":
      return !near(exp.value, len(got), 0.01);
    case "duration": {
      const ms = got.endsWith("ms") ? Number(got.slice(0, -2)) : Number(got.slice(0, -1)) * 1000;
      return !near(exp.value, ms, 0.01);
    }
    case "number":
    case "fontWeight":
      return !near(exp, Number(got), 0.0001);
    case "cubicBezier": {
      const cb = /^cubic-bezier\(([^)]+)\)$/.exec(got);
      const pts = cb ? cb[1].split(",").map(Number) : EASES[got];
      return !pts || !exp.every((v, i) => near(v, pts[i], 0.001));
    }
    case "fontFamily":
      return JSON.stringify(split(got).map((f) => f.replace(/^["']|["']$/g, ""))) !== JSON.stringify(exp);
    case "border": {
      const [w, style, col] = got.split("|");
      const wpx = len(w);
      // Browsers draw a border under 1px as one device pixel
      const widthOk = near(exp.width.value, wpx, 0.01) || (exp.width.value > 0 && exp.width.value < 1 && wpx === 1);
      return !widthOk || style !== exp.style || !sameColor(exp.color, col);
    }
    case "shadow": {
      const want = Array.isArray(exp) ? exp : [exp];
      const layers = split(got);
      if (layers.length !== want.length) return `${layers.length} layers, not ${want.length}`;
      return want.some((l, i) => {
        const t = split(layers[i], " ");
        const inset = t[t.length - 1] === "inset";
        if (inset) t.pop();
        const [col, ...lens] = t;
        const [x, y, blur, spread] = lens.map(len);
        return inset !== !!l.inset || !sameColor(l.color, col) || !near(l.offsetX.value, x, 0.01) || !near(l.offsetY.value, y, 0.01) || !near(l.blur.value, blur ?? 0, 0.01) || !near(l.spread.value, spread ?? 0, 0.01);
      });
    }
    default:
      return `no browser check for ${type}`;
  }
}
if (check) await browserCheck();

let stale = 0;
if (!check) {
  mkdirSync(`${OUT}tokens-studio`, { recursive: true });
  // Before the Tokens Studio sets had their own folder, $themes and $metadata sat beside the DTCG files
  for (const old of ["$themes.json", "$metadata.json"]) rmSync(`${OUT}${old}`, { force: true });
}
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
const exported = [...files.entries()].filter(([f]) => !f.includes("/")).map(([f, t]) => `${f.replace(".json", "")} ${count(t)}`);
const cssOnlyOf = [...files.entries()].filter(([f]) => !f.includes("/")).map(([f, t]) => [f.replace(".json", ""), Object.keys(t.$extensions?.["com.trenchcoat"]?.cssOnly ?? {})]).filter(([, n]) => n.length);
if (problems.length) console.error(`dtcg: ${problems.length} problem${problems.length === 1 ? "" : "s"}\n  ${problems.slice(0, 20).join("\n  ")}`);
else if (!stale)
  console.log(`dtcg ok${check ? " (checked in Chromium)" : ""}: ${exported.join(", ")} tokens\n  css-only: ${cssOnlyOf.map(([f, n]) => `${f} ${n.length} (${n.join(", ")})`).join("; ")}`);
process.exit(stale || problems.length ? 1 : 0);
