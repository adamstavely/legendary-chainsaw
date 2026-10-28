#!/usr/bin/env node
// The integration pass for new components, in the order that works, stopping at the first failure. Run from
// trenchcoat/ once the components' files exist and they're in the README and registry (add-to-gallery.mjs).
//   1. delete iCloud duplicates ("name 2.ts", "name 3.json") – identical ones, and copies of generated files
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

// 1. iCloud duplicates: a copy is "<name> <n>.<ext>" beside "<name>.<ext>". Identical copies go; so does any copy in a
// generated folder, which the generators rewrite anyway. Anything else is reported for you to look at.
step("iCloud duplicates");
const GENERATED = ["src/angular", "src/generative", "app/src/docs/api", "app/src/thumbs"];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    if (d.isDirectory()) return d.name === "node_modules" || d.name.startsWith(".") ? [] : walk(p);
    return [p];
  });
let removed = 0;
for (const root of ["src", "app", "tests", "scripts", "tokens", "blocks", "screens"].filter(existsSync)) {
  for (const file of walk(root)) {
    const m = /^(.*) \d+(\.[^.\/]+)$/.exec(file);
    if (!m) continue;
    const original = m[1] + m[2];
    const same = existsSync(original) && statSync(original).size === statSync(file).size && readFileSync(original).equals(readFileSync(file));
    if (same || GENERATED.some((g) => file.startsWith(g))) {
      rmSync(file);
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
