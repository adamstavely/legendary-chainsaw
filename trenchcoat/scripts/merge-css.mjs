// Merges a component's Standard and Clean stylesheets into one, with exact parity for each look:
//   · dictionary-token fallbacks are stripped (the build adds them back per look)
//   · rules identical in both looks are emitted once
//   · rules that differ are emitted for each look, scoped with a zero-specificity
//     :where([data-look="…"], [data-look="…"] *) on their first .ui- compound, in an order that keeps each
//     look's original cascade
//   · keyframes / @property that differ between the looks are renamed for Clean (name-clean)
//   node scripts/merge-css.mjs <slug>              prints the merged CSS for components/<slug>(-clean).tsx as of
//                                                  the pre-merge commit, Clean's class prefix mapped to Standard's
//   node scripts/merge-css.mjs <slug> --scaffold   writes src/components/<slug>.tsx: the pre-merge Standard file
//                                                  with the merged CSS, fallbacks stripped and the Look
//                                                  declarations added – the JSX/logic merge is then done by hand
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fallbacks } from "./tokens.mjs";

/** The commit before any component was merged – the forks are read from here */
export const PRE_MERGE = "500482c";
const DICTIONARY = new Set(Object.keys(fallbacks().standard));

/** The /* css *\/ template's contents */
export function cssOf(source) {
  const m = source.match(/\/\*\s*css\s*\*\/\s*`/);
  if (!m) return null;
  let i = m.index + m[0].length;
  const start = i;
  while (i < source.length && source[i] !== "`") {
    if (source[i] === "$" && source[i + 1] === "{") {
      let depth = 1;
      i += 2;
      while (depth) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
      }
    } else i++;
  }
  return source.slice(start, i);
}

/** var(--tc-x, fallback) → var(--tc-x) for dictionary tokens, balancing nested parentheses */
export function stripFallbacks(css) {
  let out = "";
  let i = 0;
  const re = /var\(\s*(--tc-[\w-]+)\s*,/g;
  for (let m; (m = re.exec(css)); ) {
    if (!DICTIONARY.has(m[1])) continue;
    let depth = 1;
    let j = m.index + m[0].length;
    while (j < css.length && depth) {
      if (css[j] === "(") depth++;
      else if (css[j] === ")") depth--;
      j++;
    }
    out += css.slice(i, m.index) + `var(${m[1]})`;
    i = j;
    re.lastIndex = j;
  }
  return out + css.slice(i);
}

/** Top-level items: { kind: "rule" | "at" | "text", head, body, text } – comments travel with the next item */
export function parse(css) {
  const items = [];
  let i = 0;
  let pending = "";
  while (i < css.length) {
    const rest = css.slice(i);
    const ws = rest.match(/^\s+/);
    if (ws) {
      pending += ws[0];
      i += ws[0].length;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = css.indexOf("*/", i) + 2;
      pending += css.slice(i, end);
      i = end;
      continue;
    }
    // A statement at-rule without a block (@import, @charset)
    const semi = rest.match(/^@[a-z-]+[^{};]*;/);
    if (semi) {
      items.push({ kind: "text", lead: pending, text: semi[0] });
      pending = "";
      i += semi[0].length;
      continue;
    }
    const open = css.indexOf("{", i);
    if (open < 0) {
      pending += rest;
      break;
    }
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth) {
      if (css[j] === "$" && css[j + 1] === "{") {
        // ${…} interpolation inside the CSS: skip it whole
        let d = 1;
        j += 2;
        while (d) {
          if (css[j] === "{") d++;
          else if (css[j] === "}") d--;
          j++;
        }
        continue;
      }
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const head = css.slice(i, open).trim();
    const body = css.slice(open + 1, j - 1);
    items.push({ kind: head.startsWith("@") ? "at" : "rule", lead: pending, head, body });
    pending = "";
    i = j;
  }
  if (pending.trim()) items.push({ kind: "text", lead: "", text: pending.trim() });
  return items;
}

const norm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
const keyOf = (item) => (item.kind === "text" ? `text:${norm(item.text)}` : `${item.kind}:${norm(item.head)}{${norm(item.body)}}`);

/** Split a selector list on top-level commas */
function splitTop(list, sep = ",") {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of list) {
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === sep && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** Add the look scope to the first compound selector that names a .ui- class */
function scopeSelector(selector, look) {
  const scope = `:where([data-look="${look}"], [data-look="${look}"] *)`;
  // Walk compounds separated by top-level whitespace/combinators
  let depth = 0;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0 && selector.startsWith(".ui-", i)) {
      // start of the compound containing this class; a leading element name (a.ui-x) must stay first
      let s = i;
      while (s > 0 && !/[\s>+~]/.test(selector[s - 1])) s--;
      const tag = selector.slice(s).match(/^[a-z][a-z0-9-]*/i);
      if (tag) s += tag[0].length;
      return selector.slice(0, s) + scope + selector.slice(s);
    }
  }
  // No top-level .ui- class (e.g. ":where(.ui-x) button"): scope the first compound that mentions one, attached
  // directly so a data-look on that element itself matches (a space would only match an ancestor's)
  const at = selector.indexOf(".ui-");
  if (at >= 0) {
    let s = at;
    depth = 0;
    for (let k = at; k >= 0; k--) {
      const ch = selector[k];
      if (ch === ")" || ch === "]") depth++;
      else if (ch === "(" || ch === "[") depth--;
      if (depth <= 0 && k > 0 && /[\s>+~]/.test(selector[k - 1]) && depth === 0) {
        s = k;
        break;
      }
      if (k === 0) s = 0;
    }
    return selector.slice(0, s) + scope + selector.slice(s);
  }
  return `${scope} ${selector}`;
}

function scopeItem(item, look) {
  if (item.kind === "rule") return { ...item, head: splitTop(item.head).map((s) => scopeSelector(s, look)).join(",\n") };
  if (item.kind === "at" && /^@(media|container|supports|layer)\b/.test(item.head)) {
    const inner = parse(item.body).map((x) => render(scopeItem(x, look))).join("\n");
    return { ...item, body: `\n${inner}\n` };
  }
  return item; // keyframes/property/font-face: handled by renaming
}

const render = (item) => {
  const lead = item.lead.replace(/^\s*\n/, "").replace(/\s+$/, "");
  const body = item.kind === "text" ? "" : item.body.replace(/\s+$/, "");
  const text = item.kind === "text" ? item.text : body.includes("\n") ? `${item.head} {${body}\n}` : `${item.head} {${body} }`;
  return (lead ? `${lead}\n` : "") + text;
};

/** Longest common subsequence of item keys */
function lcs(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const pairs = [];
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) pairs.push([i++, j++]);
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/** The color-scheme rules each forked file carried – the build adds them to every output */
const SCHEME = /\/\* Theme: the --tc- fallbacks use light-dark\(\), which follows color-scheme \*\/\s*:where\(\.dark, \[data-theme="dark"\]\) \{ color-scheme: dark; \}\s*:where\(\[data-theme="light"\]\) \{ color-scheme: light; \}\s*/g;

export function mergeCss(standardCss, cleanCss) {
  const std = parse(stripFallbacks(standardCss).replace(SCHEME, ""));
  let cleanText = stripFallbacks(cleanCss).replace(SCHEME, "");
  // Keyframes / @property with the same name but different contents: rename Clean's
  const named = (items, kw) => new Map(items.filter((x) => x.kind === "at" && x.head.startsWith(kw)).map((x) => [x.head.slice(kw.length).trim(), norm(x.body)]));
  const renamed = [];
  for (const kw of ["@keyframes", "@property"]) {
    const a = named(std, kw);
    const b = named(parse(cleanText), kw);
    for (const [name, body] of b) {
      if (a.has(name) && a.get(name) !== body) {
        const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        cleanText = cleanText.replace(new RegExp(`(?<![\\w-])${esc}(?![\\w-])`, "g"), `${name}-clean`);
        renamed.push(name);
      }
    }
  }
  const clean = parse(cleanText);
  const ka = std.map(keyOf);
  const kb = clean.map(keyOf);
  const pairs = lcs(ka, kb);
  const out = [];
  let i = 0;
  let j = 0;
  for (const [pi, pj] of [...pairs, [std.length, clean.length]]) {
    // Differing stretch: Standard's rules then Clean's, each scoped – both keep their own relative order,
    // and neither can affect the other look, so each look's cascade is unchanged
    for (; i < pi; i++) out.push(render(scopeItem(std[i], "standard")));
    for (; j < pj; j++) out.push(render(scopeItem(clean[j], "clean")));
    if (pi < std.length) {
      out.push(render(std[pi]));
      i = pi + 1;
      j = pj + 1;
    }
  }
  return { css: `\n${out.join("\n")}\n`, shared: pairs.length, standardOnly: std.length - pairs.length, cleanOnly: clean.length - pairs.length, renamed };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: node scripts/merge-css.mjs <slug>");
    process.exit(1);
  }
  const show = (file) => execFileSync("git", ["show", `${PRE_MERGE}:components/${file}`], { encoding: "utf8" });
  const stdSource = show(`${slug}.tsx`);
  const cleanSource = show(`${slug}-clean.tsx`);
  // Map Clean's class prefix onto Standard's (e.g. ui-buttonc → ui-button)
  // The root class: the first .ui-… class in the CSS, whole (ui-chat-composer), never a __part or --modifier
  const rootOf = (css) => css.match(/\.(ui-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w-])/)[1];
  const stdRoot = rootOf(cssOf(stdSource));
  const cleanRoot = rootOf(cssOf(cleanSource));
  const cleanCss = cssOf(cleanSource).replace(new RegExp(`(?<![\\w-])${cleanRoot}(?![a-z0-9])`, "g"), stdRoot);
  const result = mergeCss(cssOf(stdSource), cleanCss);
  if (process.argv.includes("--scaffold")) {
    const target = fileURLToPath(new URL(`../src/components/${slug}.tsx`, import.meta.url));
    if (existsSync(target)) {
      console.error(`${target} exists – not overwriting`);
      process.exit(1);
    }
    let source = stdSource.replace(cssOf(stdSource), result.css.replace(/\$/g, "$$$$"));
    source = stripFallbacks(source);
    // The look declarations go after the header comment that follows the imports
    const lastImport = [...source.matchAll(/^import [\s\S]*?;\n/gm)].at(-1);
    let at = lastImport ? lastImport.index + lastImport[0].length : 0;
    const header = source.slice(at).match(/^\s*\/\*[\s\S]*?\*\/\n/);
    if (header) at += header[0].length;
    const decl = `
// TODO(merge): add \`look?: Look\` to the props, render data-look={look ?? DEFAULT_LOOK} on the root (and on any
// portal, with the class \`\${ROOT_CLASS}__portal\`), merge Clean-only JSX/logic from ${slug}-clean.tsx, then
// simplify the look-scoped CSS where the two looks can share rules. Remove this comment when done.
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "${stdRoot}";
`;
    source = source.slice(0, at) + decl + source.slice(at);
    writeFileSync(target, source);
    console.error(`wrote ${target.slice(target.indexOf("src/"))}`);
  } else process.stdout.write(result.css);
  console.error(`/* ${slug}: ${result.shared} shared, ${result.standardOnly} standard-only, ${result.cleanOnly} clean-only rules${result.renamed.length ? `; renamed for clean: ${result.renamed.join(", ")}` : ""} (prefix ${cleanRoot} → ${stdRoot}) */`);
}
