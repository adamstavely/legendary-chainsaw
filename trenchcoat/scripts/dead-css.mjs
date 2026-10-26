// Dead CSS in the elements (remediation step 2.7): rules whose selectors name a class the element never renders.
//   node scripts/dead-css.mjs            lists them per file
//   node scripts/dead-css.mjs --fix      deletes those rules (a rule with several selectors loses only the dead ones)
// A class counts as rendered when it appears in the file outside its CSS string – in a template, a classMap or a
// string the code builds – or in the element's React wrapper (which renders some structure around children).
// Classes built from pieces (`ui-x__${part}`) are matched by their prefix. Rules for states a demo doesn't reach
// still count as live: this only finds classes nothing can produce.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = "src/elements";
const fix = process.argv.includes("--fix");
let total = 0;

for (const name of readdirSync(DIR).filter((f) => f.endsWith(".ts") && f !== "index.ts" && f !== "react.ts")) {
  const file = join(DIR, name);
  const source = readFileSync(file, "utf8");
  // Every /* css */ template string in the file is CSS; the rest is code
  const cssBlocks = [...source.matchAll(/\/\* css \*\/ `([\s\S]*?)`/g)];
  if (!cssBlocks.length) continue;
  let code = source;
  for (const m of cssBlocks) code = code.replace(m[0], "");
  const wrapper = join(DIR, "react", name);
  if (existsSync(wrapper)) code += readFileSync(wrapper, "utf8");
  const used = new Set(code.match(/\bui-[a-z0-9-]+(?:__[a-z0-9-]+)?/g) ?? []);
  // Pieces like `ui-x__${…}` or "ui-x__" + … make every class with that prefix possible
  const prefixes = [...code.matchAll(/\b(ui-[a-z0-9-]+__[a-z0-9-]*)\$\{|\b(ui-[a-z0-9-]+__[a-z0-9-]*)["'`]\s*\+/g)].map((m) => m[1] ?? m[2]);
  const live = (cls) => used.has(cls) || prefixes.some((p) => cls.startsWith(p));
  const dead = (selector) => (selector.match(/\.(ui-[a-z0-9-]+(?:__[a-z0-9-]+)?)/g) ?? []).some((c) => !live(c.slice(1)));

  let out = source;
  const found = [];
  for (const m of cssBlocks) {
    const css = m[1];
    // Walk the rules: a selector list followed by a { … } block without nested braces (at-rule bodies are walked
    // because their inner rules match the same pattern)
    const next = css.replace(/(^|[;{}]\s*)([^{}@;]+?)\s*\{([^{}]*)\}/g, (whole, lead, selectors, body) => {
      const list = selectors.split(/,(?![^(]*\))/).map((s) => s.trim());
      const keep = list.filter((s) => !dead(s));
      if (keep.length === list.length) return whole;
      for (const s of list.filter((x) => dead(x))) found.push(s.replace(/\s+/g, " "));
      return keep.length ? `${lead}${keep.join(",\n")} {${body}}` : lead;
    });
    // At-rules left empty by the deletions go too
    const tidy = next.replace(/@(media|container|supports)[^{]*\{\s*\}/g, "");
    out = out.replace(m[0], `/* css */ \`${tidy}\``);
  }
  if (!found.length) continue;
  total += found.length;
  console.log(`${file}: ${found.length}`);
  for (const s of found) console.log(`  ${s}`);
  if (fix) writeFileSync(file, out);
}
console.log(total ? `${total} dead selector${total === 1 ? "" : "s"}${fix ? " removed" : ""}` : "no dead selectors");
