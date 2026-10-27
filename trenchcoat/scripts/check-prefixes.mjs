// Fails when two library files render elements with the same CSS root class (e.g. both use `ui-cm__…`),
// because each file injects its own global stylesheet and they would restyle each other on one page.
// Styling another component's classes (a Screen adjusting an embedded Button) is fine and not checked.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// src/elements: the Lit ports – their CSS sits in the same /* css */ template strings
const LIBRARIES = ["src/components", "src/elements", "blocks", "screens", "illustrations", "motion"];

// Prefixes deliberately rendered by several files
const SHARED = {
  "ui-as": "App Shell layout classes, reused by every Screen that sits in the shell",
};

// Collisions that exist today. Each must be fixed by renaming one side; remove it here when it is.
const KNOWN = {};

const owners = new Map();
for (const lib of LIBRARIES) {
  for (const name of readdirSync(lib).filter((f) => /\.tsx?$/.test(f) && f !== "index.ts" && f !== "react.ts")) {
    const file = join(lib, name);
    const source = readFileSync(file, "utf8");
    const classAttrs = [...source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`|\{\[([^\]]*)\])/g)].map((m) => m.slice(1).join(" "));
    const prefixes = new Set(classAttrs.flatMap((attr) => [...attr.matchAll(/\b(ui-[a-z0-9]+)(?=__|[\s"`$'-]|$)/g)].map((m) => m[1])));
    // A component's two looks (<slug>.tsx and <slug>-clean.tsx) are one source, so they count as one owner
    const owner = file.replace(/-clean\.tsx$/, ".tsx");
    for (const p of prefixes) if (!(owners.get(p) ?? []).includes(owner)) owners.set(p, [...(owners.get(p) ?? []), owner]);
  }
}

const problems = [];
// Elements: each one's root name (static ui → [data-ui="…"]) must be unique, or two elements' sheets restyle each other
const roots = new Map();
for (const name of readdirSync("src/elements").filter((f) => f.endsWith(".ts"))) {
  for (const [, ui] of readFileSync(join("src/elements", name), "utf8").matchAll(/static override ui = "([^"]+)"/g)) roots.set(ui, [...(roots.get(ui) ?? []), name]);
}
for (const [ui, files] of roots) if (files.length > 1) problems.push(`element root data-ui="${ui}" is used by ${files.join(", ")} – pick a unique ui name`);
const collisions = [...owners].filter(([p, files]) => files.length > 1 && !(p in SHARED));
for (const [prefix, files] of collisions) {
  if (!(prefix in KNOWN)) problems.push(`new collision: .${prefix} is rendered by ${files.join(", ")} – pick a unique prefix`);
}
for (const prefix of Object.keys(KNOWN)) {
  if (!collisions.some(([p]) => p === prefix)) problems.push(`fixed: .${prefix} no longer collides – remove it from KNOWN in scripts/check-prefixes.mjs`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`prefixes ok: ${owners.size} prefixes, ${collisions.length} known collisions left to fix`);
