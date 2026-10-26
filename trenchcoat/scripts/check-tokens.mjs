// Token hygiene for the library files:
//   · no legacy custom properties (--ui-…) and no bare ones outside the --tc- namespace, except short
//     per-element values set from JS (--i, --x, --w …), which aren't design tokens
//   · every reference to a dictionary token carries a fallback, and that fallback is exactly the
//     dictionary's value for the file's look – so a lone copied file renders like it does with tokens.css
//   node scripts/check-tokens.mjs [file…]
//   node scripts/check-tokens.mjs --fix [file…]   rewrite fallbacks to the dictionary's current values
//                                                 (after editing tokens/tokens.css)
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fallbacks } from "./tokens.mjs";

const LIBRARIES = ["components", "blocks", "screens", "illustrations", "motion"];
const FB = fallbacks();
const FIX = process.argv.includes("--fix");
const named = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const files = named.length ? named : LIBRARIES.flatMap((lib) => readdirSync(lib).filter((f) => f.endsWith(".tsx")).map((f) => join(lib, f)));

/** var(--tc-x, …) with its fallback, balancing nested parentheses */
function* references(source) {
  for (const m of source.matchAll(/var\(\s*(--tc-[\w-]+)\s*(,)?/g)) {
    if (!m[2]) {
      yield { name: m[1], fallback: null, at: m.index };
      continue;
    }
    let depth = 1;
    let i = m.index + m[0].length;
    const start = i;
    while (i < source.length && depth) {
      if (source[i] === "(") depth++;
      else if (source[i] === ")") depth--;
      i++;
    }
    yield { name: m[1], fallback: source.slice(start, i - 1).trim(), at: m.index };
  }
}

const problems = [];
const lineOf = (source, at) => source.slice(0, at).split("\n").length;
let fixed = 0;
for (const file of files) {
  let source = readFileSync(file, "utf8");
  const look = file.endsWith("-clean.tsx") ? "clean" : "standard";
  if (FIX) {
    // Rewrite from the end so earlier offsets stay valid
    const refs = source.includes("by scripts/build-lib.mjs – edit the source") ? [] : [...references(source)].filter((r) => r.fallback !== null && FB[look][r.name] !== undefined).reverse();
    for (const ref of refs) {
      const open = source.indexOf(",", ref.at) + 1;
      const end = open + source.slice(open).indexOf(ref.fallback) + ref.fallback.length;
      const next = ` ${FB[look][ref.name]}`;
      if (source.slice(open, end) !== next) {
        source = source.slice(0, open) + next + source.slice(end);
        fixed++;
      }
    }
    writeFileSync(file, source);
  }
  for (const m of source.matchAll(/--ui-[\w-]+/g)) problems.push(`${file}:${lineOf(source, m.index)} legacy token ${m[0]}`);
  // Deprecated half-step sizes (decision B) – only blocks and screens may still use them, until they move
  if (!/^(blocks|screens)\//.test(file))
    for (const m of source.matchAll(/--tc-font-size-(?:xs|sm|md)-plus\b/g))
      problems.push(`${file}:${lineOf(source, m.index)} deprecated ${m[0]} – use ${m[0].replace("-plus", "")}`);
  // Files built from src/ carry their fallbacks as private variables on the root (both looks, see
  // scripts/build-lib.mjs), so each reference falls back to var(--_tc-…); build-lib --check keeps them current
  const built = source.includes("by scripts/build-lib.mjs – edit the source");
  for (const ref of references(source)) {
    const expected = built && FB[look][ref.name] !== undefined ? `var(--_${ref.name.slice(2)})` : FB[look][ref.name];
    if (expected === undefined) continue; // a component token (--tc-<component>-…), defined in the file
    const norm = (s) => s?.replace(/\s+/g, " ");
    if (norm(ref.fallback) !== norm(expected))
      problems.push(`${file}:${lineOf(source, ref.at)} ${ref.name} fallback ${ref.fallback === null ? "missing" : `"${ref.fallback}"`} – expected "${expected}"`);
  }
}

if (FIX) console.log(`check-tokens --fix: ${fixed} fallbacks rewritten`);
if (problems.length) {
  console.error(problems.slice(0, 200).join("\n"));
  if (problems.length > 200) console.error(`… and ${problems.length - 200} more`);
  console.error(`check-tokens: ${problems.length} problems`);
  process.exit(1);
}
console.log(`check-tokens ok: ${files.length} files`);
