#!/usr/bin/env node
// The Trenchcoat CLI: find components, see how to use them, and copy React blocks and screens into a project.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
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

Components, illustrations and motion are imported from the package, so there's nothing to copy.
Blocks and screens are also copyable as React files you can edit.`;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--") && !["--type", "--dir"].includes(a)));
function option(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const positional = args.filter((a, i) => !a.startsWith("--") && !["--type", "--dir"].includes(args[i - 1]));
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
    for (const dep of entry.npmDependencies) if (dep !== "trenchcoat") npm.add(dep);
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
  console.log('\nAdd once, at your app\'s entry: import "trenchcoat/tokens.css";');
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
  console.log(`Detected: ${framework ?? "no framework"}\n\n1. At your app's entry: import "trenchcoat/tokens.css";`);
  if (framework === "next" || framework === "react") console.log('2. Use components from "trenchcoat/react", in a client component with Next.js.');
  else if (framework === "@angular/core") console.log('2. Use the standalone directives from "trenchcoat/angular".');
  else console.log('2. Import each element once, such as import "trenchcoat/share-panel"; then use its tag.');
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

if (!command || flags.has("--help")) console.log(HELP);
else {
  const commands = { list, info, add, init, lint };
  if (!Object.hasOwn(commands, command)) fail(`unknown command "${command}"\n\n${HELP}`);
  commands[command](loadRegistry());
}
