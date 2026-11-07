#!/usr/bin/env node
// The Trenchcoat CLI: find components, see how to use them, and copy React blocks and screens into a project.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { charts, limitedFetch, rowsFrom, tokensCss } from "./lib/charts.mjs";
import { RULES, lintSources, loadLintData, readSources } from "./lib/lint.mjs";
import { DIST, findEntry, loadRegistry, searchEntries, usageFor } from "./lib/registry.mjs";

const HELP = `trenchcoat <command>

  list [words] [--type component|block|screen|illustration|motion] [--json]
  info <name> [--json]        what it is and how to import it in each framework
  add <name...> [--dir components/ui] [--overwrite] [--dry-run]
                              copy React blocks and screens, with the files they need
  init                        how to set up this project
  lint [paths] [--json] [--strict] [--rules]
                              check how this project uses Trenchcoat: exits 1 on errors, or on warnings with --strict
  chart types [--json]        the chart types a spec can draw
  chart validate <spec.json>  check a chart spec: exits 1 on errors
  chart render <spec.json> [--out chart.svg] [--width 720] [--height N] [--theme light|dark] [--look standard|clean]
                              draw a spec as a standalone SVG; { url } data is fetched (10 s, 5 MB at most)
  chart suggest <data.json|data.csv> [--limit 5] [--json]
                              charts that suit some data, each with a spec to draw it

Components, illustrations and motion are imported from the package, so there's nothing to copy.
Blocks and screens are also copyable as React files you can edit.`;

const args = process.argv.slice(2);
const VALUED = ["--type", "--dir", "--out", "--width", "--height", "--theme", "--look", "--limit"];
const flags = new Set(args.filter((a) => a.startsWith("--") && !VALUED.includes(a)));
function option(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const positional = args.filter((a, i) => !a.startsWith("--") && !VALUED.includes(args[i - 1]));
const [command, ...rest] = positional;

function fail(message) {
  console.error(`trenchcoat: ${message}`);
  process.exit(1);
}

/** An entry and every copyable file it needs, each once, in the order found */
function collect(registry, entry, seen = new Map()) {
  if (seen.has(entry.slug)) return seen;
  seen.set(entry.slug, entry);
  for (const dep of entry.localDependencies) {
    const found = registry.entries.find((e) => e.slug === dep);
    if (found) collect(registry, found, seen);
  }
  return seen;
}

function list(registry) {
  const type = option("--type");
  const found = searchEntries(registry, rest.join(" "), type);
  if (flags.has("--json")) return console.log(JSON.stringify(found, null, 1));
  for (const e of found) console.log(`${e.slug.padEnd(30)} ${e.type.padEnd(13)} ${e.description.slice(0, 90)}`);
  console.log(`\n${found.length} of ${registry.entries.filter((e) => e.type !== "support").length}`);
}

function info(registry) {
  if (!rest[0]) fail("which one? trenchcoat info <name>");
  const entry = findEntry(registry, rest[0]);
  if (!entry) fail(`no entry called "${rest[0]}". Try: trenchcoat list ${rest[0]}`);
  const usage = usageFor(entry);
  if (flags.has("--json")) return console.log(JSON.stringify({ ...entry, usage }, null, 1));
  console.log(`${entry.name} (${entry.type})\n${entry.description}\n`);
  if (entry.tag) console.log(`Element: <${entry.tag}>\n`);
  for (const [framework, code] of Object.entries(usage)) console.log(`${framework}:\n${code}\n`);
  if (entry.copyable) console.log(`Copy the React file with: trenchcoat add ${entry.slug}`);
}

function add(registry) {
  if (!rest.length) fail("which? trenchcoat add <name...>");
  const dir = option("--dir", "components/ui");
  const target = resolve(process.cwd(), dir);
  const inside = relative(process.cwd(), target);
  if (inside.startsWith("..") || isAbsolute(inside)) fail(`--dir must be inside this project: ${dir}`);
  const files = new Map();
  for (const name of rest) {
    const entry = findEntry(registry, name);
    if (!entry) fail(`no entry called "${name}". Try: trenchcoat list ${name}`);
    if (!entry.copyable) {
      console.log(`${entry.slug}: nothing to copy, import it from the package (trenchcoat info ${entry.slug})`);
      continue;
    }
    for (const [slug, found] of collect(registry, entry)) if (found.copyable) files.set(slug, found);
  }
  const clashes = [...files.keys()].filter((slug) => existsSync(join(target, `${slug}.tsx`)));
  if (clashes.length && !flags.has("--overwrite")) fail(`already there, nothing copied: ${clashes.join(", ")}. Use --overwrite to replace them`);
  const npm = new Set();
  for (const [slug, entry] of files) {
    for (const dep of entry.npmDependencies) if (dep !== "@adamstavely/trenchcoat") npm.add(dep);
    const to = join(dir, `${slug}.tsx`);
    if (flags.has("--dry-run")) {
      console.log(`would copy ${to}`);
      continue;
    }
    mkdirSync(dirname(join(process.cwd(), to)), { recursive: true });
    copyFileSync(join(DIST, "registry-files", `${slug}.tsx`), join(process.cwd(), to));
    console.log(`copied ${to}`);
  }
  if (!files.size) return;
  if (npm.size) console.log(`\nThese need: npm install ${[...npm].join(" ")}`);
  if (dir !== "components/ui") console.log(`\nThey import each other as @/components/ui/<name>: point that alias at ${dir}`);
  console.log('\nAdd once, at your app\'s entry: import "@adamstavely/trenchcoat/tokens.css";');
}

function init() {
  let deps = {};
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
    deps = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    // Not a package: the plain instructions still apply
  }
  const framework = ["next", "nuxt", "@angular/core", "svelte", "vue", "react"].find((d) => d in deps);
  console.log(`Detected: ${framework ?? "no framework"}\n\n1. At your app's entry: import "@adamstavely/trenchcoat/tokens.css";`);
  if (framework === "next" || framework === "react") console.log('2. Use components from "@adamstavely/trenchcoat/react", in a client component with Next.js.');
  else if (framework === "@angular/core") console.log('2. Use the standalone directives from "@adamstavely/trenchcoat/angular".');
  else console.log('2. Import each element once, such as import "@adamstavely/trenchcoat/share-panel"; then use its tag.');
  console.log("3. Find components: trenchcoat list <words>");
  console.log("\nFor AI coding tools, add the MCP server: trenchcoat-mcp");
}

function lint(registry) {
  if (flags.has("--rules")) {
    for (const [rule, severity] of Object.entries(RULES)) console.log(`${rule.padEnd(24)} ${severity}`);
    return;
  }
  let sources;
  try {
    sources = readSources(rest.length ? rest : ["."], process.cwd());
  } catch (error) {
    fail(error.code === "ENOENT" ? `no such path: ${error.path}` : error.message);
  }
  const found = sources.length ? lintSources(sources, loadLintData(registry)) : [];
  const errors = found.filter((f) => f.severity === "error").length;
  const warnings = found.length - errors;
  if (flags.has("--json")) console.log(JSON.stringify(found, null, 1));
  else {
    for (const f of found) console.log(`${f.file}:${f.line}:${f.column}  ${f.severity}  ${f.message}  [${f.rule}]`);
    console.log(`${found.length ? "\n" : ""}${sources.length} checked: ${errors} errors, ${warnings} warnings`);
  }
  if (errors || (warnings && flags.has("--strict"))) process.exitCode = 1;
}

/** A JSON file's contents, or a failure that names the file */
function readJson(file, what) {
  if (!file) fail(`which ${what}? trenchcoat chart ${rest[0]} <file>`);
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8"));
  } catch (error) {
    fail(error.code === "ENOENT" ? `no such file: ${file}` : `${file} isn't JSON: ${error.message}`);
  }
}

async function chart() {
  const [sub, file] = rest;
  const c = await charts();
  if (sub === "types") {
    if (flags.has("--json")) return console.log(JSON.stringify(c.chartTypes, null, 1));
    for (const t of c.chartTypes) console.log(`${t.type.padEnd(12)} ${t.tag.padEnd(22)} ${t.summary}`);
    return console.log(`\n${c.chartTypes.length} chart types. Channels and examples: trenchcoat chart types --json`);
  }
  if (sub === "validate") {
    const spec = readJson(file, "spec");
    const check = c.validateSpec(spec);
    if (flags.has("--json")) console.log(JSON.stringify(check, null, 1));
    else {
      for (const e of check.errors) console.log(`error    ${e.path || "spec"}  ${e.message}`);
      for (const w of check.warnings) console.log(`warning  ${w.path || "spec"}  ${w.message}`);
      console.log(check.valid ? `${file}: valid` : `${file}: ${check.errors.length} errors`);
    }
    if (!check.valid) process.exitCode = 1;
    return;
  }
  if (sub === "render") {
    let spec = readJson(file, "spec");
    try {
      spec = await c.resolveSpecData(spec, limitedFetch);
      const theme = option("--theme", "light");
      const look = option("--look", "standard");
      if (!["light", "dark"].includes(theme)) fail("--theme is light or dark");
      if (!["standard", "clean"].includes(look)) fail("--look is standard or clean");
      const svg = await c.renderChartToSVG(spec, { width: Number(option("--width", 720)), height: option("--height") ? Number(option("--height")) : undefined, theme, look, tokensCss: tokensCss() });
      const out = option("--out");
      if (!out) return process.stdout.write(`${svg}\n`);
      writeFileSync(resolve(process.cwd(), out), svg);
      return console.log(`wrote ${out}`);
    } catch (error) {
      fail(error.message);
    }
  }
  if (sub === "suggest") {
    if (!file) fail("which data? trenchcoat chart suggest <data.json|data.csv>");
    let rows;
    try {
      rows = await rowsFrom(readFileSync(resolve(process.cwd(), file), "utf8"));
    } catch (error) {
      fail(error.code === "ENOENT" ? `no such file: ${file}` : error.message);
    }
    const { profile, suggestions } = c.suggestCharts(rows, { limit: Number(option("--limit", 5)) });
    if (flags.has("--json")) return console.log(JSON.stringify({ profile, suggestions }, null, 1));
    console.log(`${profile.rows} rows: ${profile.columns.map((col) => `${col.name} (${col.kind})`).join(", ")}\n`);
    for (const s of suggestions) console.log(`${s.type.padEnd(12)} ${String(s.score).padEnd(5)} ${s.reason}\n${" ".repeat(18)}encoding: ${JSON.stringify(s.spec.encoding)}`);
    return console.log(suggestions.length ? "\nThe spec of each: trenchcoat chart suggest <file> --json" : "No chart suits this data.");
  }
  fail(`chart what? types, validate, render or suggest\n\n${HELP}`);
}

if (!command || flags.has("--help")) console.log(HELP);
else if (command === "chart") await chart();
else {
  const commands = { list, info, add, init, lint };
  if (!Object.hasOwn(commands, command)) fail(`unknown command "${command}"\n\n${HELP}`);
  commands[command](loadRegistry());
}
