// One-time codemod: move the library files onto the --tc- token dictionary using
// audit/design-tokens/mapping.json. Conservative by design – anything it can't do safely is left for
// manual review and listed in audit/design-tokens/manual-review.json.
//   node scripts/apply-tokens.mjs [--dry]
//
// Per file (look = standard for <slug>.tsx and single-look files, clean for <slug>-clean.tsx):
//   · semantic/primitive tokens (high/medium): var(--old) → var(--tc-new, <fallback for this look>) and the
//     local declarations (base + dark) are deleted – light-dark() in the fallback now carries the theme.
//     Skipped (manual) when the token is also declared in a variant rule ([data-tone], :hover, …) or is set
//     from JS, because replacing it would lose the variant.
//   · component tokens: renamed --ui-<abbr>-x → --tc-<component>-x, values untouched.
//   · hard-coded radius / font-size / font-family / easing: replaced only where the literal equals the
//     token's own value, so nothing moves. Durations are left alone (JS timers are often synced to them).
//   · a color-scheme rule so the fallbacks' light-dark() follows .dark / [data-theme] without tokens.css.
import { readFileSync, writeFileSync } from "node:fs";
import { fallbacks } from "./tokens.mjs";

const DRY = process.argv.includes("--dry");
const mapping = JSON.parse(readFileSync("audit/design-tokens/mapping.json", "utf8"));
const inventory = JSON.parse(readFileSync("audit/design-tokens/inventory.json", "utf8"));
const FB = fallbacks();
const SCHEME = `/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }
`;

const jsSet = new Set(inventory.js_set_custom_properties.map((r) => `${r.file}|${r.token}`));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tokenRe = (name) => new RegExp(`${esc(name)}(?![\\w-])`, "g");

/** The CSS template literals in a file – every one carries a "css" comment tag – as [start, end) offsets of their
 *  contents. Steps over ${…} interpolations so a } or ` inside one can't end the range early. */
function cssRanges(source) {
  const ranges = [];
  for (const m of source.matchAll(/\/\*\s*css\s*\*\/\s*`/g)) {
    const start = m.index + m[0].length;
    let i = start;
    while (i < source.length && source[i] !== "`") {
      if (source[i] === "\\") i += 2;
      else if (source[i] === "$" && source[i + 1] === "{") {
        let depth = 1;
        i += 2;
        while (i < source.length && depth) {
          if (source[i] === "{") depth++;
          else if (source[i] === "}") depth--;
          i++;
        }
      } else i++;
    }
    ranges.push([start, i]);
  }
  return ranges;
}

/** Selector chain (outermost first) of the block enclosing offset `pos` in css */
function selectorsAt(css, pos) {
  const chain = [];
  let depth = 0;
  for (let i = pos - 1; i >= 0; i--) {
    const c = css[i];
    if (c === "}") depth++;
    else if (c === "{") {
      if (depth > 0) depth--;
      else {
        let j = i - 1;
        while (j >= 0 && !"{};".includes(css[j])) j--;
        chain.unshift(css.slice(j + 1, i).replace(/\/\*[\s\S]*?\*\//g, "").trim());
      }
    }
  }
  return chain;
}

/** A declaration is "base" if its rule is the component root (optionally wrapped in the dark theme
 *  selector or a reduced-motion/container query) – anything with attributes, pseudo-classes or
 *  descendants is a variant */
function isBaseRule(chain) {
  const rule = chain[chain.length - 1] ?? "";
  if (chain.slice(0, -1).some((c) => !c.startsWith("@"))) return false;
  // Split on top-level commas only – the dark selector has one inside :where(…)
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of rule) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += ch;
  }
  parts.push(current.trim());
  const DARK = /^:where\(\s*\.dark\s*,\s*\[data-theme="dark"\]\s*\)\s+/;
  return parts.every((p) => /^\.ui-[\w-]+$/.test(p.replace(DARK, "")));
}

const byFile = new Map();
for (const row of mapping.tokens) (byFile.get(row.file) ?? byFile.set(row.file, []).get(row.file)).push(row);
const hardByFile = new Map();
for (const row of mapping.hard_coded) (hardByFile.get(row.file) ?? hardByFile.set(row.file, []).get(row.file)).push(row);

const manual = [];
const stats = { files: 0, replaced: 0, renamed: 0, declarationsRemoved: 0, literals: 0, skippedVariant: 0, skippedJs: 0, skippedLow: 0 };

for (const file of new Set([...byFile.keys(), ...hardByFile.keys()])) {
  const look = file.endsWith("-clean.tsx") ? "clean" : "standard";
  const fb = FB[look];
  let source = readFileSync(file, "utf8");
  const before = source;

  for (const row of byFile.get(file) ?? []) {
    const { old: oldName, new: newName, kind, confidence } = row;
    if (confidence === "low") {
      manual.push({ ...row, reason: "low confidence" });
      stats.skippedLow++;
      continue;
    }
    if (jsSet.has(`${file}|${oldName}`)) {
      manual.push({ ...row, reason: "set from JS" });
      stats.skippedJs++;
      continue;
    }
    if (kind === "component") {
      source = source.replace(tokenRe(oldName), newName);
      stats.renamed++;
      continue;
    }
    // semantic / primitive: every declaration must sit in a base rule
    const declarations = [];
    for (const [start, end] of cssRanges(source)) {
      const css = source.slice(start, end);
      for (const m of css.matchAll(new RegExp(`(?:\\n[ \\t]*)?${esc(oldName)}\\s*:[^;{}]*;[ \\t]*`, "g"))) declarations.push({ at: start + m.index, len: m[0].length, chain: selectorsAt(css, m.index) });
    }
    if (declarations.some((d) => !isBaseRule(d.chain))) {
      manual.push({ ...row, reason: "declared in a variant rule", rules: [...new Set(declarations.filter((d) => !isBaseRule(d.chain)).map((d) => d.chain.at(-1)))] });
      stats.skippedVariant++;
      continue;
    }
    if (!(newName in fb)) {
      manual.push({ ...row, reason: `${newName} is not in the dictionary` });
      continue;
    }
    for (const d of declarations.sort((a, b) => b.at - a.at)) source = source.slice(0, d.at) + source.slice(d.at + d.len);
    stats.declarationsRemoved += declarations.length;
    // var(--old) or var(--old, anything) → var(--tc-new, fallback)
    source = source.replace(new RegExp(`var\\(\\s*${esc(oldName)}(?![\\w-])\\s*(?:,[^()]*(?:\\([^()]*\\)[^()]*)*)?\\)`, "g"), () => {
      stats.replaced++;
      return `var(${newName}, ${fb[newName]})`;
    });
  }

  // Hard-coded literals that already equal a token's value. Each declaration is rewritten once; literals
  // already inside a var(…) are left alone, and matches need clean boundaries (6px never matches in 16px).
  const swaps = { radius: new Map(), "font-size": new Map(), font: new Map(), easing: new Map() };
  for (const row of hardByFile.get(file) ?? []) {
    if (!(row.kind in swaps) || !["high", "medium"].includes(row.confidence)) continue;
    const value = fb[row.new];
    if (value && value.replace(/\s+/g, "") === row.value.replace(/\s+/g, "")) swaps[row.kind].set(row.value.trim(), `var(${row.new}, ${value})`);
  }
  const PROPS = { radius: /^border(-[a-z]+)*-radius$/, "font-size": /^font-size$/, font: /^font-family$/, easing: /./ };
  const swapValue = (prop, value) => {
    // Split off var(…) segments so their contents are never touched
    const parts = [];
    let i = 0;
    let last = 0;
    while (i < value.length) {
      if (value.startsWith("var(", i)) {
        parts.push({ text: value.slice(last, i), plain: true });
        let depth = 0;
        let j = i;
        do {
          if (value[j] === "(") depth++;
          else if (value[j] === ")") depth--;
          j++;
        } while (j < value.length && depth);
        parts.push({ text: value.slice(i, j), plain: false });
        last = i = j;
      } else i++;
    }
    parts.push({ text: value.slice(last), plain: true });
    return parts
      .map((part) => {
        if (!part.plain) return part.text;
        let text = part.text;
        for (const [kind, map] of Object.entries(swaps)) {
          if (!PROPS[kind].test(prop)) continue;
          for (const [literal, replacement] of map) {
            if (kind === "font") {
              if (text.trim() === literal) text = text.replace(literal, () => (stats.literals++, replacement));
              continue;
            }
            text = text.replace(new RegExp(`(?<![\\w.#-])${esc(literal)}(?![\\w.%-])`, "g"), () => (stats.literals++, replacement));
          }
        }
        return text;
      })
      .join("");
  };
  for (const [start, end] of cssRanges(source).reverse()) {
    const css = source.slice(start, end).replace(/(^|[{;\s])([a-z-]+)(\s*:\s*)([^;{}]+)/g, (whole, lead, prop, colon, value) =>
      prop.startsWith("--") ? whole : lead + prop + colon + swapValue(prop, value),
    );
    source = source.slice(0, start) + css + source.slice(end);
  }

  // color-scheme so light-dark() fallbacks follow the theme class
  if (source !== before && !source.includes(":where(.dark, [data-theme=\"dark\"]) { color-scheme: dark; }")) {
    const [first] = cssRanges(source);
    if (first) source = source.slice(0, first[0]) + "\n" + SCHEME + source.slice(first[0]);
  }

  // Rules left empty by removed declarations – only inside the CSS
  for (const [start, end] of cssRanges(source).reverse()) {
    const css = source.slice(start, end).replace(/\n[^\n{}@$]*\{\s*\}[ \t]*(?=\n)/g, "");
    source = source.slice(0, start) + css + source.slice(end);
  }

  if (source !== before) {
    stats.files++;
    if (!DRY) writeFileSync(file, source);
  }
}

if (!DRY) writeFileSync("audit/design-tokens/manual-review.json", JSON.stringify(manual, null, 1) + "\n");
console.log(stats);
console.log(`manual review: ${manual.length} tokens (${Object.entries(Object.groupBy(manual, (m) => m.reason)).map(([k, v]) => `${v.length} ${k}`).join(", ")})`);
