#!/usr/bin/env node
// Registers new components in the gallery: a line in src/components/README.md, in alphabetical order, and the slug in
// its category in app/src/registry.ts – a new category is added before "Trust & calibration". Run from trenchcoat/.
//
//   node .claude/skills/new-component/scripts/add-to-gallery.mjs \
//     --slug status-tracker --name "Status Tracker" --category "Research & portfolio" \
//     --line "Where work stands in a fixed sequence of steps – …"
//
// Repeat the four flags for several components in one run. A component already listed is left as it is.
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
if (!args.length || args.includes("--help")) {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
  process.exit(0);
}
const entries = [];
for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, "");
  if (key === "slug") entries.push({});
  if (!entries.length) throw new Error("start each component with --slug");
  entries[entries.length - 1][key] = args[i + 1];
}
for (const e of entries) for (const k of ["slug", "name", "category", "line"]) if (!e[k]) throw new Error(`${e.slug ?? "?"}: missing --${k}`);

// The README: "- **Name** (`slug.tsx`) – line", sorted by name
const readme = "src/components/README.md";
const rows = readFileSync(readme, "utf8").split("\n");
const nameOf = (l) => /^- \*\*(.+?)\*\*/.exec(l)?.[1].toLowerCase();
for (const e of entries) {
  if (rows.some((l) => l.includes(`(\`${e.slug}.tsx\`)`))) {
    console.log(`README: ${e.slug} already listed`);
    continue;
  }
  const items = rows.map((l, i) => [l, i]).filter(([l]) => l.startsWith("- **"));
  const at = items.find(([l]) => nameOf(l) > e.name.toLowerCase())?.[1] ?? items[items.length - 1][1] + 1;
  rows.splice(at, 0, `- **${e.name}** (\`${e.slug}.tsx\`) – ${e.line}`);
  console.log(`README: added ${e.name}`);
}
writeFileSync(readme, rows.join("\n"));

// The registry: the slug in its category, sorted; a new category before Trust & calibration
const registry = "app/src/registry.ts";
let src = readFileSync(registry, "utf8");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\&]/g, "\\$&");
for (const e of entries) {
  const re = new RegExp(`\\["${esc(e.category)}", \\[([^\\]]*)\\]\\]`);
  const m = re.exec(src);
  if (m) {
    const items = m[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (items.includes(e.slug)) {
      console.log(`registry: ${e.slug} already in ${e.category}`);
      continue;
    }
    const next = [...items, e.slug].sort();
    src = src.slice(0, m.index) + `["${e.category}", [${next.map((s) => `"${s}"`).join(", ")}]]` + src.slice(m.index + m[0].length);
  } else {
    const anchor = '      ["Trust & calibration",';
    if (!src.includes(anchor)) throw new Error(`no category "${e.category}", and no Trust & calibration to add it before`);
    src = src.replace(anchor, `      ["${e.category}", ["${e.slug}"]],\n${anchor}`);
    console.log(`registry: new category ${e.category}`);
  }
  console.log(`registry: ${e.slug} → ${e.category}`);
}
writeFileSync(registry, src);
