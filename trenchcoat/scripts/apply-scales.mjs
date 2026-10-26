// One-time codemod (remediation plan 1.3): the remaining literal line-heights and radii onto the type and radius
// scales, like apply-spacing.mjs does for spacing.
//   node scripts/apply-scales.mjs [--dry] [file…]   (default: src/components, illustrations, motion)
//
//   · line-height: a px value on the scale (16, 18, 20, 22, 24, 28, 32) becomes var(--tc-line-height-*); a value
//     1 px off snaps to it, down when it sits between two steps (17 → 16, 19 → 18, 15 → 16). Unitless ratios
//     (1.4 …) follow the font size and stay.
//   · border-radius: each px part on the scale (2, 4, 6, 8, 10, 12, 16, 20) becomes var(--tc-radius-*); a part 1 px
//     off snaps the same way (5 → 4, 7 → 6, 9 → 8). In a Clean-only rule 5 px is Clean's badge radius and becomes
//     var(--tc-radius-badge).
//   · Everything else stays literal and is counted by the ratchet: 1 px, fractions, %, values 2 px or more off the
//     scale, and anything inside calc(), var() or ${}.
// Hand-written libraries (illustrations, motion) get the dictionary fallback; src/ files get none (tokens.css).
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE = { 16: "tight", 18: "snug", 20: "normal", 22: "relaxed", 24: "loose", 28: "display-sm", 32: "display" };
const RADIUS = { 2: "2xs", 4: "xs", 6: "sm", 8: "md", 10: "lg", 12: "xl", 16: "2xl", 20: "3xl" };
const DRY = process.argv.includes("--dry");
const named = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DIRS = ["src/components", "illustrations", "motion"];
const files = named.length ? named : DIRS.flatMap((d) => readdirSync(d).filter((f) => f.endsWith(".tsx")).map((f) => join(d, f)));

/** The scale value for n px: on it, or 1 px off (down between two steps); null to keep it literal */
function snap(n, scale) {
  if (!Number.isInteger(n) || n < 2) return null;
  if (scale[n]) return n;
  if (scale[n - 1]) return n - 1;
  if (scale[n + 1]) return n + 1;
  return null;
}

/** The selector of the rule a declaration at `at` belongs to */
function selectorAt(source, at) {
  const open = source.lastIndexOf("{", at);
  const close = source.lastIndexOf("}", open);
  return source.slice(close + 1, open);
}

const DECL = /((?:^|[\s;{"'`])(line-height|lineHeight|border-radius|borderRadius|border-(?:top|bottom)-(?:left|right)-radius)\s*:\s*)([^;{}\n]*)/g;
const totals = { exact: 0, snapped: 0, files: 0 };
for (const file of files) {
  const fallback = !file.startsWith("src/");
  const source = readFileSync(file, "utf8");
  let exact = 0;
  let snapped = 0;
  const out = source.replace(DECL, (all, head, prop, value, at) => {
    if (/[(`]|\$\{/.test(value)) return all;
    const line = /^line/i.test(prop);
    const scale = line ? LINE : RADIUS;
    const cleanOnly = !line && /data-look="clean"/.test(selectorAt(source, at)) && !/data-look="standard"/.test(selectorAt(source, at));
    const next = value.replace(/(?<![\w.#-])(\d+(?:\.\d+)?)px\b/g, (lit, num) => {
      const n = +num;
      if (cleanOnly && n === 5) {
        exact++;
        return `var(--tc-radius-badge${fallback ? ", 5px" : ""})`;
      }
      const to = snap(n, scale);
      if (to === null) return lit;
      if (to === n) exact++;
      else snapped++;
      return `var(--tc-${line ? "line-height" : "radius"}-${scale[to]}${fallback ? `, ${to}px` : ""})`;
    });
    return head + next;
  });
  totals.exact += exact;
  totals.snapped += snapped;
  if (out !== source) {
    totals.files++;
    if (!DRY) writeFileSync(file, out);
    else console.log(`${file}: ${exact} exact, ${snapped} snapped`);
  }
}
console.log(`apply-scales${DRY ? " (dry)" : ""}: ${totals.files} files, ${totals.exact} on the scale, ${totals.snapped} snapped by 1px`);
