// One-time codemod (remediation plan 1.2): padding, margin and gap onto the --tc-space-* scale.
//   node scripts/apply-spacing.mjs [--dry] [file…]   (default: src/components, illustrations, motion)
//
// In each padding / margin / gap declaration (kebab-case CSS and camelCase inline styles), every positive px
// length becomes var(--tc-space-*):
//   · a value on the scale (2, 4, 6 … 20, 24, 28, 32, 40, 48, 56, 64) is replaced as is – nothing moves;
//   · a value 1 px off the scale snaps to it: odd values up to 20 go to the nearest multiple of 4 (3 → 4, 5 → 4,
//     7 → 8 …), larger odd values to the one neighbour on the scale (23 → 24, 31 → 32);
//   · everything else stays literal and is counted by the ratchet ("literal spacing"): 1 px, fractions, negative
//     values, values 2 px or more off the scale (22, 30, 36 …), and anything inside calc(), var() or ${}.
// Hand-written libraries (illustrations, motion) get the dictionary fallback, var(--tc-space-1, 4px), as
// check-tokens requires; src/ files get none – build-lib adds them.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SCALE = { 2: "0-5", 4: "1", 6: "1-5", 8: "2", 10: "2-5", 12: "3", 14: "3-5", 16: "4", 18: "4-5", 20: "5", 24: "6", 28: "7", 32: "8", 40: "10", 48: "12", 56: "14", 64: "16" };
const DRY = process.argv.includes("--dry");
const named = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DIRS = ["src/components", "illustrations", "motion"];
const files = named.length ? named : DIRS.flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".tsx")).map((f) => join(d, f)));

const SIDES = "(?:-(?:top|right|bottom|left|inline(?:-start|-end)?|block(?:-start|-end)?))?";
const KEBAB = `(?:padding${SIDES}|margin${SIDES}|gap|row-gap|column-gap)`;
const CAMEL = "(?:padding|margin)(?:Top|Right|Bottom|Left|Inline(?:Start|End)?|Block(?:Start|End)?)?|gap|rowGap|columnGap";
const DECL = new RegExp(`((?:^|[\\s;{"'\`])(?:${KEBAB}|${CAMEL})\\s*:\\s*)([^;{}\\n]*)`, "g");

/** The scale step for a px value, or null to keep it literal */
function step(n) {
  if (!Number.isInteger(n) || n < 2) return null;
  if (SCALE[n]) return n;
  if (n % 2 === 0) return null; // even and off the scale: 2 px or more from a step
  if (n <= 20) return Math.round(n / 4) * 4 || null;
  const near = [n - 1, n + 1].filter((v) => SCALE[v]);
  return near.length === 1 ? near[0] : null;
}

const totals = { exact: 0, snapped: 0, kept: 0, files: 0 };
for (const file of files) {
  const fallback = !file.startsWith("src/");
  const source = readFileSync(file, "utf8");
  let exact = 0;
  let snapped = 0;
  let kept = 0;
  const out = source.replace(DECL, (all, head, value) => {
    if (/[(`]|\$\{/.test(value)) {
      kept += (value.match(/\d+(?:\.\d+)?px/g) ?? []).length;
      return all;
    }
    const next = value.replace(/(?<![\w.#-])(-?\d+(?:\.\d+)?)px\b/g, (lit, num) => {
      const n = +num;
      const to = n < 0 ? null : step(n);
      if (to === null) {
        if (n !== 0) kept++;
        return lit;
      }
      if (to === n) exact++;
      else snapped++;
      return `var(--tc-space-${SCALE[to]}${fallback ? `, ${to}px` : ""})`;
    });
    return head + next;
  });
  totals.exact += exact;
  totals.snapped += snapped;
  totals.kept += kept;
  if (out !== source) {
    totals.files++;
    if (!DRY) writeFileSync(file, out);
    if (DRY) console.log(`${file}: ${exact} exact, ${snapped} snapped, ${kept} kept`);
  }
}
console.log(`apply-spacing${DRY ? " (dry)" : ""}: ${totals.files} files, ${totals.exact} on the scale, ${totals.snapped} snapped by 1px, ${totals.kept} kept literal`);
