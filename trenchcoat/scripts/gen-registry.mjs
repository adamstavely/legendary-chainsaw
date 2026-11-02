// What the install CLI and the MCP server read: dist/registry.json lists every entry in the libraries, and dist/docs and
// dist/registry-files hold its docs, API and copyable sources. Runs at the end of build:package, which empties dist first.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const LIBS = [
  ["component", "src/components"],
  ["block", "blocks"],
  ["screen", "screens"],
  ["illustration", "illustrations"],
  ["motion", "motion"],
];
const LINE = /^- \*\*(.+?)\*\* \(`(.+?)\.tsx`\) – (.*)$/;

const sourcesOf = new Map();
for (const [, dir] of LIBS) {
  for (const f of readdirSync(join(ROOT, dir))) {
    if (f.endsWith(".tsx") && !/ \d+\.tsx$/.test(f)) sourcesOf.set(f.slice(0, -4), join(dir, f));
  }
}

function imports(file) {
  const text = readFileSync(join(ROOT, file), "utf8");
  const local = [...text.matchAll(/@\/components\/ui\/([a-z0-9-]+)/g)].map((m) => m[1]);
  const npm = [...text.matchAll(/from "((?:@[\w-]+\/)?\w[\w.-]*)(?:\/[^"]*)?"/g)].map((m) => m[1]).filter((n) => n !== "react");
  return { local: [...new Set(local)], npm: [...new Set(npm)] };
}

mkdirSync(join(DIST, "docs/api"), { recursive: true });
mkdirSync(join(DIST, "registry-files"), { recursive: true });

const entries = [];
for (const [type, dir] of LIBS) {
  for (const line of readFileSync(join(ROOT, dir, "README.md"), "utf8").split("\n")) {
    const m = line.match(LINE);
    if (!m) continue;
    const [, name, slug, description] = m;
    const api = join(ROOT, "app/src/docs/api", `${slug}.json`);
    const doc = join(ROOT, "app/src/docs", `${slug}.md`);
    const element = existsSync(api) ? JSON.parse(readFileSync(api, "utf8")).elements?.[0] : undefined;
    if (existsSync(api)) copyFileSync(api, join(DIST, "docs/api", `${slug}.json`));
    if (existsSync(doc)) copyFileSync(doc, join(DIST, "docs", `${slug}.md`));
    const source = sourcesOf.get(slug);
    const found = source ? imports(source) : { local: [], npm: [] };
    if (source) copyFileSync(join(ROOT, source), join(DIST, "registry-files", `${slug}.tsx`));
    entries.push({
      name,
      slug,
      type,
      description,
      tag: element?.tag ?? null,
      className: element?.className ?? null,
      copyable: !!source,
      localDependencies: found.local,
      npmDependencies: found.npm,
    });
  }
}
// A source copied only as another file's dependency still has to be there to copy
for (const entry of entries) {
  for (const dep of entry.localDependencies) {
    const source = sourcesOf.get(dep);
    if (source) copyFileSync(join(ROOT, source), join(DIST, "registry-files", `${dep}.tsx`));
  }
}
const extras = [...new Set(entries.flatMap((e) => e.localDependencies))].filter((d) => !entries.some((e) => e.slug === d && e.copyable) && sourcesOf.has(d));
for (const slug of extras) {
  const found = imports(sourcesOf.get(slug));
  const existing = entries.find((e) => e.slug === slug);
  if (existing) Object.assign(existing, { copyable: true, localDependencies: found.local, npmDependencies: found.npm });
  else entries.push({ name: slug, slug, type: "support", description: "Shared by other files", tag: null, className: null, copyable: true, localDependencies: found.local, npmDependencies: found.npm });
}
entries.sort((a, b) => a.slug.localeCompare(b.slug));
// Every custom property Trenchcoat defines or reads, for the linter. A name ending in "-" is built by an expression
const variables = new Set();
const elementFiles = readdirSync(join(ROOT, "src/elements"), { recursive: true }).filter((f) => f.endsWith(".ts")).map((f) => join("src/elements", f));
for (const file of ["tokens/tokens.css", ...elementFiles, ...sourcesOf.values()]) {
  for (const m of readFileSync(join(ROOT, file), "utf8").matchAll(/--tc-[a-z0-9-]*[a-z0-9]-?/g)) if (!m[0].endsWith("-")) variables.add(m[0]);
}
const { version } = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
writeFileSync(join(DIST, "registry.json"), `${JSON.stringify({ version, cssVariables: [...variables].sort(), entries }, null, 1)}\n`);
console.log(`registry: ${entries.length} entries, ${entries.filter((e) => e.copyable).length} copyable`);
