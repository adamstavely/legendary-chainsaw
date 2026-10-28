// Keeps every docs page complete and true to the code (remediation Part 4.1). Fails on:
//   · a public property, event or slot of an element without a description (JSDoc → custom-elements.json)
//   · a React wrapper prop without a description
//   · a component, illustration or motion piece without a guidance file (app/src/docs/<slug>.md), or one missing a
//     required section
//   · an anatomy part whose selector names a class the element (or its wrapper) never renders
//   · a related component that doesn't exist
//   · a React example (```tsx in the guidance) that doesn't type-check against trenchcoat/react
//   · a page without its browser, framework or runtime data (gen-docs writes them; gen-docs --check finds them stale)
//   · a page without performance measurements, or with measurements of older code (app/src/docs/perf.json, from
//     npm run measure:perf) – a warning by default, so an element added or changed since the last run doesn't fail;
//     with PERF_STRICT=1 (run after npm run measure:perf -- --missing), a failure
//   · a browser feature table row without versions for every browser
// Run node scripts/gen-docs.mjs first (npm run check:docs does both).
//   node scripts/check-docs.mjs [slug…]
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withoutLit } from "./docs-data.mjs";

const only = process.argv.slice(2);
const API = "app/src/docs/api";
const DOCS = "app/src/docs";
const problems = [];
const add = (slug, what) => problems.push(`${slug}: ${what}`);

// Which slugs are documented elements: README entries of components, illustrations and motion that have an element
const readme = (lib) => [...readFileSync(lib, "utf8").matchAll(/^- \*\*.+?\*\* \(`(.+?)\.tsx`\)/gm)].map((m) => m[1].replace(/-clean$/, ""));
const library = new Map([
  ...readme("src/components/README.md").map((s) => [s, "components"]),
  ...readme("illustrations/README.md").map((s) => [s, "illustrations"]),
  ...readme("motion/README.md").map((s) => [s, "motion"]),
  // Blocks are elements too (tc-<slug>), held to the components' sections
  ...readme("blocks/README.md").map((s) => [s, "components"]),
]);
const slugs = [...library.keys()].filter((s) => existsSync(join(API, `${s}.json`))).filter((s) => !only.length || only.includes(s));

const REQUIRED = {
  components: ["Overview", "When to use", "When not to use", "Keyboard", "Screen readers", "Content", "Do", "Don't", "Example"],
  illustrations: ["Overview", "When to use", "When not to use", "Example"],
  motion: ["Overview", "When to use", "When not to use", "Example"],
  utilities: ["Overview", "When to use", "When not to use", "Example"],
};
// Pieces that aren't components to operate, though the README lists them with the components
const UTILITIES = new Set(["look-provider"]);

const examples = [];
const PERF = "app/src/docs/perf.json";
const perf = existsSync(PERF) ? JSON.parse(readFileSync(PERF, "utf8")).pieces : {};
const strict = process.env.PERF_STRICT === "1";
const notMeasured = [];
const staleMeasured = [];
for (const f of JSON.parse(readFileSync("scripts/browser-features.json", "utf8")).features)
  for (const b of ["chrome", "edge", "firefox", "safari", "safari_ios"]) if (!(b in f.versions)) add("browser-features.json", `${f.id} has no ${b} version`);
for (const slug of slugs) {
  const page = JSON.parse(readFileSync(join(API, `${slug}.json`), "utf8"));
  // The 6.5 data: generated with the page, so missing means the page predates it
  if (!page.browser?.floor || !Array.isArray(page.browser.features)) add(slug, "no browser support data – run node scripts/gen-docs.mjs " + slug);
  if (!Array.isArray(page.frameworks) || page.frameworks.length !== page.elements.length) add(slug, "no framework data – run node scripts/gen-docs.mjs " + slug);
  if (!page.runtime) add(slug, "no runtime data – run node scripts/gen-docs.mjs " + slug);
  const measured = perf[slug];
  if (!measured || !measured.render) notMeasured.push(slug);
  else if (measured.hash !== (await withoutLit(slug)).hash) staleMeasured.push(slug);
  for (const el of page.elements) {
    for (const p of el.properties) if (!p.description.trim()) add(slug, `<${el.tag}> property ${p.name} has no description`);
    for (const e of el.events) if (!e.description.trim()) add(slug, `<${el.tag}> event ${e.name} has no description`);
    for (const s of el.slots) if (!s.description.trim()) add(slug, `<${el.tag}> slot ${s.name} has no description`);
  }
  for (const r of page.react.filter((x) => x.exported)) for (const p of r.props) if (!p.description.trim()) add(slug, `React ${r.component} prop ${p.name} has no description`);

  const file = join(DOCS, `${slug}.md`);
  if (!existsSync(file)) {
    add(slug, `no guidance file (${file})`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  const sections = new Set([...source.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim()));
  for (const s of REQUIRED[UTILITIES.has(slug) ? "utilities" : library.get(slug)]) if (!sections.has(s)) add(slug, `guidance has no "## ${s}"`);
  const meta = Object.fromEntries([...(source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "").matchAll(/^(\w[\w-]*):\s*(.*)$/gm)].map((m) => [m[1], m[2].trim()]));
  for (const r of (meta.related ?? "").split(",").map((x) => x.trim()).filter(Boolean)) if (!library.has(r)) add(slug, `related "${r}" isn't a component`);

  // Anatomy selectors: every class they name must appear in the element's or the wrapper's source (or be the shared
  // card header's, .tc-head*, which internal/card-head.ts renders)
  const code = [`src/elements/${slug}.ts`, `src/elements/react/${slug}.ts`].filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
  for (const m of source.matchAll(/^\d+\.\s+\*\*.+?\*\*\s+`([^`]+)`/gm))
    for (const cls of m[1].match(/\.([\w-]+)/g) ?? []) if (!cls.startsWith(".tc-head") && !code.includes(cls.slice(1))) add(slug, `anatomy selector ${m[1]} names ${cls}, which the element never renders`);

  const tsx = source.match(/## Example[\s\S]*?```tsx\n([\s\S]*?)```/)?.[1];
  if (library.get(slug) === "components" && !UTILITIES.has(slug) && !tsx) add(slug, "the Example has no ```tsx block");
  if (tsx) examples.push([slug, tsx]);
}

// Type-check the React examples against the package's own sources
if (examples.length) {
  // Its own folder per run, so parallel checks don't collide
  const dir = `.docs-check-${process.pid}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
  for (const [slug, tsx] of examples) writeFileSync(join(dir, `${slug}.tsx`), `// From app/src/docs/${slug}.md\n${tsx}`);
  writeFileSync(join(dir, "css.d.ts"), 'declare module "*.css";\n');
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      extends: "../tsconfig.json",
      compilerOptions: { noEmit: true, noUnusedLocals: false, baseUrl: "..", paths: { "trenchcoat/react": ["src/elements/react.ts"], "trenchcoat/tokens.css": ["tokens/tokens.css"], "trenchcoat": ["src/elements/index.ts"], "trenchcoat/*": ["src/elements/*"] } },
      include: ["*.tsx", "css.d.ts"],
    }),
  );
  try {
    execSync(`npx tsc -p ${dir}/tsconfig.json`, { stdio: "pipe", encoding: "utf8" });
  } catch (e) {
    for (const line of String(e.stdout).split("\n").filter((l) => l.startsWith(`${dir}/`))) {
      const slug = line.slice(dir.length + 1).split(".tsx")[0];
      add(slug, `React example: ${line.split(": ").slice(1).join(": ").trim()}`);
    }
  }
  rmSync(dir, { recursive: true, force: true });
}

// Performance: measured in a browser, so not regenerated by gen-docs. A page that isn't measured yet (or whose code
// changed since) is reported; PERF_STRICT=1 makes it fail, for a pipeline that measures first
if (notMeasured.length || staleMeasured.length) {
  const say = (list, what) => list.length && `${list.length} ${what} (${list.slice(0, 6).join(", ")}${list.length > 6 ? " …" : ""})`;
  const msg = `performance: ${[say(notMeasured, "not measured yet"), say(staleMeasured, "measured before their code changed")].filter(Boolean).join(", ")} – npm run measure:perf -- --missing`;
  if (strict) {
    for (const s of notMeasured) add(s, "no performance measurements – npm run measure:perf -- " + s);
    for (const s of staleMeasured) add(s, "performance measured before the code changed – npm run measure:perf -- " + s);
  } else console.warn(`warning: ${msg}`);
}

const missingGuides = problems.filter((p) => p.includes("no guidance file")).length;
if (problems.length) {
  console.error(`docs: ${problems.length} problems in ${new Set(problems.map((p) => p.split(":")[0])).size} pages (${missingGuides} without a guidance file)`);
  for (const p of problems.slice(0, process.env.DOCS_ALL ? Infinity : 60)) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`docs ok: ${slugs.length} pages`);
void readdirSync;
