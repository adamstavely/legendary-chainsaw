// WCAG contrast of the token dictionary, per look and theme, with translucent colours alpha-blended over the
// real surfaces they sit on (tokens/tokens.css → scripts/tokens.mjs).
//   node scripts/contrast.mjs            fail if any required pair is below its minimum
//   node scripts/contrast.mjs --table    also print the full markdown table (audit/design-tokens/contrast.md)
//   node scripts/contrast.mjs --write    write that table to audit/design-tokens/contrast.md
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fallbacks } from "./tokens.mjs";

// --dictionary <file> measures another copy of tokens.css (e.g. the previous version); missing tokens show as –
const at = process.argv.indexOf("--dictionary");
const OTHER = at > 0 ? process.argv[at + 1] : null;
const FB = OTHER ? fallbacks(OTHER) : fallbacks();
const LOOKS = ["standard", "clean"];
const THEMES = ["light", "dark"];

/* ---------- parsing ---------- */
/** Split on top-level commas */
function args(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}
const inner = (s, fn) => s.slice(fn.length + 1, s.lastIndexOf(")"));
/** The value of a resolved token for one theme: light-dark(A, B) picks A or B (recursively) */
function pick(value, theme) {
  return value.replace(/light-dark\(/g, "\u0000").includes("\u0000") ? pickLD(value, theme) : value;
}
function pickLD(value, theme) {
  let out = "";
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf("light-dark(", i);
    if (at < 0) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    let depth = 0;
    let j = at + "light-dark".length;
    for (; j < value.length; j++) {
      if (value[j] === "(") depth++;
      if (value[j] === ")" && --depth === 0) break;
    }
    const [a, b] = args(value.slice(at + "light-dark(".length, j));
    out += pickLD(theme === "light" ? a : b, theme);
    i = j + 1;
  }
  return out;
}
/** → [r, g, b, a] (0–255, alpha 0–1) */
function parse(c) {
  c = c.trim();
  if (c === "transparent") return [0, 0, 0, 0];
  if (c === "white") return [255, 255, 255, 1];
  if (c === "black") return [0, 0, 0, 1];
  if (c.startsWith("#")) {
    let h = c.slice(1);
    if (h.length === 3) h = [...h].map((x) => x + x).join("");
    const n = (k) => parseInt(h.slice(k, k + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  if (c.startsWith("rgb")) {
    const p = args(c.slice(c.indexOf("(") + 1, c.lastIndexOf(")"))).flatMap((x) => x.split(/\s+/)).filter((x) => x && x !== "/");
    return [+p[0], +p[1], +p[2], p[3] === undefined ? 1 : parseFloat(p[3]) / (p[3].endsWith("%") ? 100 : 1)];
  }
  if (c.startsWith("color-mix(")) {
    // color-mix(in srgb, X p%, transparent) – the only form the dictionary uses
    const [, x, y] = args(inner(c, "color-mix"));
    const m = x.match(/^(.*?)\s+([\d.]+)%$/);
    if (!m || y !== "transparent") throw new Error(`unsupported ${c}`);
    const [r, g, b, a] = parse(m[1]);
    return [r, g, b, (a * +m[2]) / 100];
  }
  throw new Error(`cannot parse colour ${c}`);
}
/** Paint layers bottom-up: blend(surface, fill, …) → opaque [r, g, b] */
function blend(...layers) {
  let [r, g, b] = parse(layers[0]);
  for (const l of layers.slice(1)) {
    const [R, G, B, A] = parse(l);
    r = R * A + r * (1 - A);
    g = G * A + g * (1 - A);
    b = B * A + b * (1 - A);
  }
  return [r, g, b];
}
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/* ---------- the checks ---------- */
const SURFACES = ["surface-base", "surface-raised", "surface-overlay", "surface-sunken", "surface-tray", "surface-on-tray", "surface-control"];
const short = (s) => s.replace("surface-", "");
const TONES = ["status-success", "status-warning", "status-danger", "status-info", "tone-violet", "tone-pink", "tone-amber", "tone-rose"];

/** Each check: label, minimum, fg token (or token stack), bg stack (bottom-up token names) */
const checks = [];
const text = ["text-strong", "text-primary", "text-secondary", "text-muted", "text-placeholder", "accent-text"];
for (const t of text) for (const s of SURFACES) checks.push({ group: "Text on surfaces (4.5)", fg: t, bg: [s], min: 4.5 });
for (const t of ["text-primary", "text-muted"])
  for (const f of ["fill-hover", "fill-default", "fill-selected"]) checks.push({ group: "Text on fills over raised (4.5)", fg: t, bg: ["surface-raised", f], min: 4.5 });
for (const t of ["text-muted", "text-placeholder"]) checks.push({ group: "Text on fills over raised (4.5)", fg: t, bg: ["surface-sunken", "fill-default"], min: 4.5, label: `${t} on sunken + fill-default (sunken search)` });
for (const tone of TONES) {
  for (const s of ["surface-raised", "surface-overlay", "surface-sunken", "surface-tray"]) checks.push({ group: "Chip text on its tint (4.5)", fg: `${tone}-fg`, bg: [s, `${tone}-bg`], min: 4.5 });
  for (const s of ["surface-raised", "surface-sunken"]) checks.push({ group: "Status/tone text on surfaces (4.5)", fg: `${tone}-fg`, bg: [s], min: 4.5 });
}
checks.push({ group: "Labels on solid fills (4.5)", fg: "text-on-accent", bg: ["accent"], min: 4.5 });
checks.push({ group: "Labels on solid fills (4.5)", fg: "text-on-accent", bg: ["accent-hover"], min: 4.5 });
for (const s of ["action-primary-bg", "action-primary-bg-hover", "action-primary-bg-active"])
  checks.push({ group: "Labels on solid fills (4.5)", fg: "action-primary-fg", bg: ["surface-base", s], min: 4.5, label: `primary button label on ${s}` });
checks.push({ group: "Labels on solid fills (4.5)", fg: "tooltip-fg", bg: ["surface-base", "tooltip-bg"], min: 4.5, label: "tooltip text on tooltip-bg" });
for (const s of SURFACES) {
  for (const t of ["border-control", "border-selected", "focus-ring", "icon-muted", "accent", "switch-off"])
    checks.push({ group: "Non-text: boundaries, indicators, icons (3.0)", fg: t, bg: [s], min: 3 });
  for (const st of ["status-success", "status-warning", "status-danger", "status-info"])
    checks.push({ group: "Status solids on surfaces (3.0)", fg: `${st}-solid`, bg: [s], min: 3 });
}
checks.push({ group: "Non-text: boundaries, indicators, icons (3.0)", fg: "focus-ring", bg: ["surface-raised", "fill-selected"], min: 3, label: "focus-ring on raised + fill-selected" });
checks.push({ group: "Non-text: boundaries, indicators, icons (3.0)", fg: "border-selected", bg: ["surface-raised", "fill-selected"], min: 3, label: "border-selected on raised + fill-selected" });
checks.push({ group: "Non-text: boundaries, indicators, icons (3.0)", fg: "switch-knob-bg", bg: ["surface-raised", "switch-off"], min: 1, label: "switch knob on off track (info)" });
// Gallery stages (the visual/a11y harness paints #fafaf9 / #0e0e10 behind transparent roots)
checks.push({ group: "Focus ring on the gallery stage (3.0)", fg: "focus-ring", bg: [{ light: "#fafaf9", dark: "#0e0e10" }], min: 3, label: "focus-ring on stage" });
checks.push({ group: "Focus ring on the gallery stage (3.0)", fg: "text-muted", bg: [{ light: "#fafaf9", dark: "#0e0e10" }], min: 4.5, label: "text-muted on stage" });

/** Decorative tokens reported for information (no minimum) */
const info = [];
for (const t of ["text-disabled", "border-default", "border-strong", "border-subtle"]) for (const s of ["surface-raised", "surface-sunken"]) info.push({ fg: t, bg: [s] });

function value(look, theme, token) {
  if (typeof token === "object") return token[theme];
  const v = FB[look][`--tc-${token}`];
  if (v === undefined) {
    if (OTHER) return null;
    throw new Error(`${look}: no token --tc-${token}`);
  }
  return pick(v, theme).trim();
}
function measure(c, look, theme) {
  if ([c.fg, ...c.bg].some((t) => value(look, theme, t) === null)) return NaN;
  const bg = blend(...c.bg.map((t) => value(look, theme, t)));
  const fg = blend(...c.bg.map((t) => value(look, theme, t)), value(look, theme, c.fg));
  return ratio(fg, bg);
}
const labelOf = (c) => c.label ?? `${c.fg} on ${c.bg.map((b) => (typeof b === "object" ? "stage" : short(b))).join(" + ")}`;

const rows = [];
const failures = [];
for (const c of checks) {
  const r = {};
  for (const look of LOOKS)
    for (const theme of THEMES) {
      const v = measure(c, look, theme);
      r[`${look}/${theme}`] = v;
      if (v < c.min) failures.push(`${look}/${theme}: ${labelOf(c)} = ${v.toFixed(2)} (needs ${c.min})`);
    }
  rows.push({ group: c.group, label: labelOf(c), min: c.min, r });
}

function table() {
  const cols = LOOKS.flatMap((l) => THEMES.map((t) => `${l}/${t}`));
  const head = `| Pair | ${cols.map((c) => c.replace("standard", "Std").replace("clean", "Clean")).join(" | ")} |\n|---|${cols.map(() => "---:").join("|")}|`;
  let md = "";
  for (const group of [...new Set(rows.map((r) => r.group))]) {
    md += `\n### ${group}\n\n${head}\n`;
    for (const row of rows.filter((r) => r.group === group))
      md += `| ${row.label} | ${cols.map((c) => (Number.isNaN(row.r[c]) ? "–" : row.r[c] < row.min ? `**${row.r[c].toFixed(2)}** ✗` : row.r[c].toFixed(2))).join(" | ")} |\n`;
  }
  md += `\n### Decorative tokens (no minimum – never the only cue, never meaningful text)\n\n${head}\n`;
  for (const c of info) md += `| ${labelOf(c)} | ${cols.map((col) => measure(c, ...col.split("/")).toFixed(2)).join(" | ")} |\n`;
  return md;
}

if (process.argv.includes("--table") || process.argv.includes("--write")) {
  const md = `# Token contrast

Generated by \`node scripts/contrast.mjs --write\` from \`tokens/tokens.css\` – do not edit by hand. Ratios are WCAG 2.x
contrast ratios; translucent tokens are alpha-blended over the surface(s) listed, bottom-up. Minimums: 4.5 for text,
3.0 for non-text (control boundaries, selected indicators, focus ring, icons, status solids). \`npm run ci\` fails if
any required pair drops below its minimum.
${table()}`;
  if (process.argv.includes("--write")) writeFileSync(fileURLToPath(new URL("../audit/design-tokens/contrast.md", import.meta.url)), md);
  else console.log(md);
}
if (failures.length) {
  console.error(`contrast: ${failures.length} pairs below the minimum\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`contrast ok: ${rows.length} pairs × 4 look/theme combinations`);
