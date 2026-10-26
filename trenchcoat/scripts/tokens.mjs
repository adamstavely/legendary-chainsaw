// Reads the dictionary (tokens/tokens.css) and resolves every token to literal values per look, so a
// component file can carry its own fallbacks: var(--tc-text-muted, light-dark(#646464, #9a9aa1)).
//   node scripts/tokens.mjs            writes tokens/fallbacks.json and regenerates section 4 of tokens.css
//                                      (the @supports fallback for browsers without light-dark())
//   node scripts/tokens.mjs --check    fail if either is out of date
//   import { fallbacks, THEME_RULES } from "./tokens.mjs"
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const DICTIONARY = fileURLToPath(new URL("../tokens/tokens.css", import.meta.url));
const FALLBACKS = fileURLToPath(new URL("../tokens/fallbacks.json", import.meta.url));

/** The theme selector list, shared by tokens.css (section 3) and every published file (scripts/build-lib.mjs) */
export const DARK = '.dark, [data-theme="dark"], [data-tc-theme="dark"]';
export const LIGHT = '[data-theme="light"], [data-tc-theme="light"]';
export const SYSTEM = '[data-tc-theme="system"]';
/** What a published file inlines: the explicit attributes and classes. A lone file never sets the page's own
 *  color-scheme; an app follows the OS with :root { color-scheme: light dark } (tokens.css does this). */
export const THEME_RULES = `:where(${SYSTEM}) { color-scheme: light dark; }
:where(${LIGHT}) { color-scheme: light; }
:where(${DARK}) { color-scheme: dark; }`;

const CLEAN = ':where([data-tc-look="clean"], [data-look="clean"])';

/** Declarations of the first top-level block whose selector starts with `selectorStart` */
function block(css, selectorStart) {
  const at = css.indexOf(selectorStart);
  if (at < 0) throw new Error(`no block ${selectorStart} in tokens.css`);
  const open = css.indexOf("{", at);
  const close = css.indexOf("}", open);
  const decls = {};
  for (const m of css.slice(open + 1, close).matchAll(/(--tc-[\w-]+)\s*:\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
  return decls;
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const lookBlocks = (css) => ({
  standard: block(css, ':where(:root, [data-tc-look="standard"]'),
  clean: block(css, ':where([data-tc-look="clean"]'),
});

export function fallbacks(dictionary = DICTIONARY) {
  const css = stripComments(readFileSync(dictionary, "utf8"));
  const primitives = block(css, ":where(:root) {");
  const blocks = lookBlocks(css);
  const looks = { standard: { ...primitives, ...blocks.standard }, clean: { ...primitives, ...blocks.clean } };
  const out = {};
  for (const [look, tokens] of Object.entries(looks)) {
    const resolve = (value, seen = new Set()) =>
      value.replace(/var\((--tc-[\w-]+)\)/g, (_, name) => {
        if (seen.has(name) || !(name in tokens)) throw new Error(`${look}: cannot resolve ${name}`);
        return resolve(tokens[name], new Set([...seen, name]));
      });
    out[look] = Object.fromEntries(Object.keys(tokens).map((name) => [name, resolve(tokens[name])]));
  }
  return out;
}

/** light-dark(A, B) → [A, B] when the whole value is one light-dark() call, else null */
function splitLightDark(value) {
  if (!value.startsWith("light-dark(") || !value.endsWith(")")) return null;
  const body = value.slice("light-dark(".length, -1);
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "(") depth++;
    else if (body[i] === ")") depth--;
    else if (body[i] === "," && depth === 0) return [body.slice(0, i).trim(), body.slice(i + 1).trim()];
  }
  return null;
}

/** Section 4 of tokens.css: every light-dark() token of each look, per theme, for browsers without light-dark()
 *  (Chrome < 123, Firefox < 120, Safari < 17.5). Tokens that only reference others (var(), calc(), color-mix()
 *  of a token) follow automatically. Covers the common nestings: theme on an ancestor of the look, or both on
 *  the same element; no attribute and [data-tc-theme="system"] follow the OS. */
export function fallbackCss(dictionary = DICTIONARY) {
  const decls = lookBlocks(stripComments(readFileSync(dictionary, "utf8")));
  const lines = (look, theme) =>
    Object.entries(decls[look])
      .map(([name, value]) => {
        const pair = splitLightDark(value);
        if (!pair && value.includes("light-dark(")) throw new Error(`${name}: make light-dark() the whole value, so the fallback can split it`);
        return pair ? `    ${name}: ${pair[theme === "light" ? 0 : 1]};` : null;
      })
      .filter(Boolean)
      .join("\n");
  const std = (sel) => `:where(${sel}),\n  :where(${sel}) :where([data-tc-look="standard"], [data-look="standard"])`;
  const clean = (sel) => `:where(${sel}) ${CLEAN},\n  ${CLEAN}:where(${sel}),\n  :where([data-tc-look="clean"]) :where(${sel})`;
  const os = `:root:not(${LIGHT}), ${SYSTEM}`;
  return `@supports not (color: light-dark(#000, #fff)) {
  :where(:root, [data-tc-look="standard"], [data-look="standard"]) {
${lines("standard", "light")}
  }
  ${CLEAN} {
${lines("clean", "light")}
  }
  @media (prefers-color-scheme: dark) {
  ${std(os)} {
${lines("standard", "dark")}
  }
  ${clean(os)} {
${lines("clean", "dark")}
  }
  }
  ${std(LIGHT)} {
${lines("standard", "light")}
  }
  ${clean(LIGHT)} {
${lines("clean", "light")}
  }
  ${std(DARK)} {
${lines("standard", "dark")}
  }
  ${clean(DARK)} {
${lines("clean", "dark")}
  }
}
`;
}

const MARK = "GENERATED by `node scripts/tokens.mjs` from sections 2a/2b – do not edit by hand.\n */\n";

function regenerate(source) {
  const at = source.indexOf(MARK);
  if (at < 0) throw new Error("tokens.css: section 4 marker not found");
  return source.slice(0, at + MARK.length) + fallbackCss();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");
  const source = readFileSync(DICTIONARY, "utf8");
  const css = regenerate(source);
  const json = JSON.stringify(fallbacks(), null, 1) + "\n";
  if (check) {
    let current = "";
    try {
      current = readFileSync(FALLBACKS, "utf8");
    } catch {}
    const stale = [source !== css && "tokens/tokens.css section 4", current !== json && "tokens/fallbacks.json"].filter(Boolean);
    if (stale.length) {
      console.error(`out of date: ${stale.join(", ")} – run node scripts/tokens.mjs`);
      process.exit(1);
    }
    console.log("tokens ok: fallback section and fallbacks.json are current");
  } else {
    writeFileSync(DICTIONARY, css);
    writeFileSync(FALLBACKS, json);
    const result = JSON.parse(json);
    console.log(`tokens/fallbacks.json: ${Object.keys(result.standard).length} standard, ${Object.keys(result.clean).length} clean; tokens.css section 4 regenerated`);
  }
}
