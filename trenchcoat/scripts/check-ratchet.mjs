// A ratchet on risky patterns in the library files: counts per file may go down, never up.
// `node scripts/check-ratchet.mjs --update` records the current counts after an intended improvement.
// The "literal …" and "dark-scoped colour rule" counts are the token guard rails (CONTRIBUTING.md, rule 11):
// existing drift is in the baseline, new drift fails, and a file that improves must lock it in with --update.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TOKEN_RULES } from "./css-literals.mjs";

const LIBRARIES = ["components", "blocks", "screens", "illustrations", "motion"];
const BASELINE = "scripts/ratchet-baseline.json";

const PATTERNS = {
  // A suppression must say why: `// eslint-disable-line react-hooks/exhaustive-deps -- runs once per id`
  "unexplained eslint-disable": /eslint-disable(?:-next)?-line(?![^\n]*--)[^\n]*/g,
  // Fixed ids collide when a component appears twice on a page – use useId()
  "hard-coded id": /\b(?:id|htmlFor|aria-labelledby|aria-controls|aria-describedby)="[^"{}]+"/g,
  // Clock and environment reads; at render time they break SSR hydration and StrictMode
  "clock/environment read": /\bDate\.now\(|\bnew Date\(\)|\bperformance\.now\(|\bnavigator\.platform\b/g,
  "any": /:\s*any(?=\s*[;,)\]>|=])|\bas any\b/g,
  "dangerouslySetInnerHTML": /dangerouslySetInnerHTML/g,
  // Token guard rails – see css-literals.mjs for exactly what each one counts
  ...TOKEN_RULES,
};

const counts = {};
for (const lib of LIBRARIES) {
  for (const name of readdirSync(lib).filter((f) => f.endsWith(".tsx"))) {
    const file = join(lib, name);
    const source = readFileSync(file, "utf8");
    for (const [label, re] of Object.entries(PATTERNS)) {
      const n = typeof re === "function" ? re(source) : (source.match(re)?.length ?? 0);
      if (n) (counts[file] ??= {})[label] = n;
    }
  }
}

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + "\n");
  console.log(`ratchet baseline written to ${BASELINE}`);
  process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : {};
const worse = [];
const better = [];
for (const file of new Set([...Object.keys(counts), ...Object.keys(baseline)])) {
  for (const label of Object.keys(PATTERNS)) {
    const now = counts[file]?.[label] ?? 0;
    const before = baseline[file]?.[label] ?? 0;
    if (now > before) worse.push(`${file}: ${label} ${before} → ${now}`);
    if (now < before) better.push(`${file}: ${label} ${before} → ${now}`);
  }
}

if (worse.length) {
  console.error(`ratchet: these got worse – fix them rather than updating the baseline:\n${worse.join("\n")}`);
  process.exit(1);
}
if (better.length) {
  console.error(`ratchet: these improved – run \`node scripts/check-ratchet.mjs --update\` to lock it in:\n${better.join("\n")}`);
  process.exit(1);
}
const total = (label) => Object.values(counts).reduce((n, c) => n + (c[label] ?? 0), 0);
console.log(`ratchet ok: ${Object.keys(PATTERNS).map((l) => `${total(l)} ${l}`).join(", ")}`);
