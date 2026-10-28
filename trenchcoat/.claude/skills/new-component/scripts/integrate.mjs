#!/usr/bin/env node
// The integration pass for new components, in the order that works, stopping at the first failure. Run from
// trenchcoat/ once the components' files exist and they're in the README and registry (add-to-gallery.mjs).
//   1. delete iCloud duplicates ("name 2.ts", "name 3.json", "schemas 2/") – identical ones, and copies of generated
//      files whose original exists
//   2. regenerate: the element index, the docs, the Angular wrappers, the generative-UI schemas
//   3. measure performance and capture thumbnails for whatever has none
//   4. run every check – the same ones as CI's check job
//   5. run the new components' tests in Chromium, Firefox and WebKit, then the React suite
//
//   node .claude/skills/new-component/scripts/integrate.mjs --slugs status-tracker,coverage-ring
//   node .claude/skills/new-component/scripts/integrate.mjs --slugs … --skip-tests      steps 1–4 only
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const slugs = (args[args.indexOf("--slugs") + 1] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (!args.includes("--slugs") || !slugs.length) {
  console.error("usage: integrate.mjs --slugs a,b,c [--skip-tests]");
  process.exit(2);
}
for (const s of slugs) if (!existsSync(`src/elements/${s}.ts`)) throw new Error(`no src/elements/${s}.ts – run from trenchcoat/`);

const step = (title) => console.log(`\n── ${title}`);
const run = (cmd, { quiet = false } = {}) => {
  try {
    const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 256 << 20 });
    if (!quiet) {
      const last = out.trim().split("\n").filter(Boolean).slice(-2).join("\n");
      if (last) console.log(`   ${last.replace(/\n/g, "\n   ")}`);
    }
    return out;
  } catch (e) {
    console.error(`\n✗ ${cmd}\n${`${e.stdout ?? ""}${e.stderr ?? ""}`.trim().split("\n").slice(-40).join("\n")}`);
    process.exit(1);
  }
};

// 1. iCloud duplicates: a copy is "<name> <n>.<ext>" beside "<name>.<ext>", or a folder "<name> <n>/" beside "<name>/".
// A copy goes when it's identical to its original, or when it sits in a generated file or folder and its original
// exists – the generators rewrite those anyway. Anything else (a copy that differs, or has no original) is reported
// for you to look at: iCloud's copy can be the newer one.
step("iCloud duplicates");
const GENERATED = ["src/angular/", "src/generative/schemas/", "src/generative/catalog.json", "src/generative/registry.ts", "app/src/docs/api/", "app/src/thumbs/"];
const generated = (p) => GENERATED.some((g) => p === g || p.startsWith(g));
const COPY = / \d+(\.[^./]+)?$/;
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name.startsWith(".") ? [] : [[p, true], ...walk(p)];
    return [[p, false]];
  });
const same = (a, b) => statSync(a).size === statSync(b).size && readFileSync(a).equals(readFileSync(b));
const sameTree = (a, b) => {
  const list = (d) => walk(d).map(([p, dir]) => [p.slice(d.length), dir]).sort(([x], [y]) => (x < y ? -1 : 1));
  const la = list(a);
  const lb = list(b);
  return la.length === lb.length && la.every(([p, dir], i) => p === lb[i][0] && dir === lb[i][1] && (dir || same(a + p, b + p)));
};
let removed = 0;
for (const root of ["src", "app", "tests", "scripts", "tokens", "blocks", "screens"].filter(existsSync)) {
  for (const [file, dir] of walk(root)) {
    if (!existsSync(file)) continue; // inside a copied folder that's already gone
    const name = file.slice(file.lastIndexOf("/") + 1);
    const m = COPY.exec(name);
    if (!m || (!dir && !m[1])) continue;
    const original = file.slice(0, file.length - m[0].length) + (m[1] ?? "");
    if (!existsSync(original)) {
      console.log(`   kept ${file} – there's no ${original}; rename it or delete it`);
      continue;
    }
    if (dir ? sameTree(file, original) || generated(`${original}/`) : same(file, original) || generated(original)) {
      rmSync(file, { recursive: true });
      removed++;
    } else console.log(`   kept ${file} – it differs from ${original}; check it`);
  }
}
console.log(`   removed ${removed}`);

step("regenerate");
run("node scripts/gen-elements.mjs");
run("node scripts/gen-docs.mjs");
run("node scripts/gen-angular.mjs");
run("node scripts/gen-schemas.mjs");

step("performance and thumbnails");
run("npm run -s measure:perf -- --missing");
run("npm run -s capture:thumbs -- --missing");

step("checks");
for (const c of ["typecheck", "lint", "check:prefixes", "check:ratchet", "check:tokens", "check:contrast", "check:dead-css", "check:docs", "check:lit", "check:angular", "check:generative", "check:snippets"]) {
  process.stdout.write(`   ${c} … `);
  run(`npm run -s ${c}`, { quiet: true });
  console.log("ok");
}
run("node scripts/gen-elements.mjs --check", { quiet: true });

if (!args.includes("--skip-tests")) {
  step("tests");
  rmSync("node_modules/.vitest-cache", { recursive: true, force: true });
  const files = slugs.map((s) => `tests/elements/${s}.test.ts`).filter(existsSync).join(" ");
  // With no files vitest would run every element's tests, three times over
  if (!files) {
    console.error(`\n✗ no tests/elements/<slug>.test.ts for ${slugs.join(", ")} – every component needs one`);
    process.exit(1);
  }
  for (const browser of ["chromium", "firefox", "webkit"]) {
    process.stdout.write(`   ${browser} … `);
    const out = run(`npx vitest run --project elements --browser.name=${browser} ${files}`, { quiet: true });
    console.log(/Tests\s+(\d+ passed[^\n]*)/.exec(out)?.[1] ?? "ok");
  }
  process.stdout.write("   react … ");
  const out = run("npx vitest run --project react", { quiet: true });
  console.log(/Tests\s+(\d+ passed[^\n]*)/.exec(out)?.[1] ?? "ok");
}
console.log("\n✓ integrated – now look at each component in the gallery, then commit trenchcoat/ only");
