// The generated half of every component's docs page (remediation Part 4): writes app/src/docs/api/<slug>.json from
//   · custom-elements.json – properties, attributes, events, slots, methods (built from the elements' JSDoc)
//   · each element's CSS – the component tokens it defines on its root (--tc-<slug>-*) and the design tokens it reads
//   · the React wrappers' TypeScript – each wrapper's own props and the element properties it renames or hides
//   · CHANGELOG.md – the lines that name the element
//   · esbuild – its size on its own, minified and gzipped, Lit external (an app loads Lit once)
// The hand-written half – when to use, keyboard, content, do and don't – is app/src/docs/<slug>.md.
//   node scripts/gen-docs.mjs            regenerate (runs the manifest analyzer first)
//   node scripts/gen-docs.mjs --check    fail when a page's file is out of date (CI)
//   node scripts/gen-docs.mjs <slug>…    regenerate only those pages (several people can work at once)
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const esbuild = require("esbuild");
const { gzipSync } = require("node:zlib");
const OUT = "app/src/docs/api";
const check = process.argv.includes("--check");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

execSync("npx cem analyze --config custom-elements-manifest.config.mjs", { stdio: "ignore" });
const manifest = JSON.parse(readFileSync("custom-elements.json", "utf8"));
// Whole entries: a bullet and its indented continuation lines
const changelog = readFileSync("CHANGELOG.md", "utf8")
  .split("\n")
  .reduce((out, line) => {
    if (/^- /.test(line)) out.push(line);
    else if (/^\s{2,}\S/.test(line) && out.length) out[out.length - 1] += " " + line.trim();
    else out.push("");
    return out;
  }, [])
  .filter(Boolean);

// Lifecycle and framework hooks aren't part of an element's API
const HOOKS = /Callback$|^(render|update|updated|willUpdate|firstUpdated|createRenderRoot|requestUpdate|performUpdate|shouldUpdate|getUpdateComplete|scheduleUpdate)$/;
const text = (t) => t?.text?.replace(/\s+/g, " ").trim();

/** The element's public API from its manifest declaration */
function api(decl) {
  const fields = (decl.members ?? []).filter(
    (m) => m.kind === "field" && !m.static && !m.privacy && (!m.inheritedFrom || m.name === "look" || m.inheritedFrom.name === "TcSettingsElement") && !/^_/.test(m.name),
  );
  const attrOf = new Map((decl.attributes ?? []).filter((a) => a.fieldName).map((a) => [a.fieldName, a.name]));
  return {
    tag: decl.tagName,
    className: decl.name,
    description: decl.description ?? "",
    properties: fields.map((f) => ({
      name: f.name,
      attribute: attrOf.get(f.name) ?? null,
      type: text(f.type) ?? "",
      default: f.default ?? null,
      description: f.description ?? "",
      readonly: !!f.readonly,
    })),
    events: (decl.events ?? []).filter((e) => e.name && e.name !== "name").map((e) => ({ name: e.name, detail: text(e.type) ?? "", description: e.description ?? "", cancelable: /cancelable/i.test(e.description ?? "") })),
    slots: (decl.slots ?? []).map((s) => ({ name: s.name || "(default)", description: s.description ?? "" })),
    methods: (decl.members ?? [])
      .filter((m) => m.kind === "method" && !m.privacy && !m.static && (!m.inheritedFrom || m.inheritedFrom.name === "TcSettingsElement") && !HOOKS.test(m.name))
      .map((m) => ({ name: m.name, params: (m.parameters ?? []).map((p) => `${p.name}${p.optional ? "?" : ""}: ${text(p.type) ?? "unknown"}`).join(", "), returns: text(m.return?.type) ?? "void", description: m.description ?? "" })),
  };
}

/** Component tokens declared on the element's root rules, and the design tokens its CSS reads */
function cssOf(source, ui) {
  const blocks = [...source.matchAll(/\/\* css \*\/ `([\s\S]*?)`/g)].map((m) => m[1]).join("\n");
  const css = blocks.replace(/\/\*[\s\S]*?\*\//g, "");
  const root = `[data-ui="${ui}"]`;
  const defined = new Map();
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    // Root rules only: the selector ends at the root (optionally behind a look's :where(…))
    if (!selector.split(",").some((s) => s.trim().endsWith(root))) continue;
    const look = /data-look="clean"/.test(selector) ? "clean" : /data-look="standard"/.test(selector) ? "standard" : "both";
    for (const [, name, value] of body.matchAll(/(--tc-[\w-]+)\s*:\s*([^;]+);/g)) {
      const prev = defined.get(name);
      defined.set(name, { name, value: value.trim(), looks: prev ? [...new Set([...prev.looks, look])] : [look] });
    }
  }
  const reads = [...new Set([...css.matchAll(/var\((--tc-[\w-]+)/g)].map((m) => m[1]))].filter((n) => !defined.has(n)).sort();
  return { cssProperties: [...defined.values()], tokens: reads };
}

/** A React wrapper's own props: the type literal in `export type <X>Props = Omit<Raw, …> & { … }` */
function reactOf(file) {
  if (!existsSync(file)) return [];
  const src = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const out = [];
  const docOf = (node) => (node.jsDoc ?? []).map((d) => (typeof d.comment === "string" ? d.comment : (d.comment ?? []).map((c) => c.text).join(""))).join(" ").trim();
  const exported = new Set();
  src.forEachChild((n) => {
    if (ts.isFunctionDeclaration(n) && n.name && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) exported.add(n.name.text);
  });
  src.forEachChild((n) => {
    if (!ts.isTypeAliasDeclaration(n) || !/Props$/.test(n.name.text) || !n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return;
    const component = n.name.text.replace(/Props$/, "");
    // Local aliases (`type OwnProps = { … }`) are followed, so props declared apart from the exported type count too
    const aliases = new Map();
    // (a statement body: forEachChild stops at the first callback that returns something truthy)
    src.forEachChild((x) => {
      if (ts.isTypeAliasDeclaration(x)) aliases.set(x.name.text, x.type);
    });
    const flatten = (t, seen = new Set()) => {
      if (ts.isIntersectionTypeNode(t)) return t.types.flatMap((x) => flatten(x, seen));
      if (ts.isTypeReferenceNode(t) && aliases.has(t.typeName.getText(src)) && !seen.has(t.typeName.getText(src))) {
        seen.add(t.typeName.getText(src));
        return flatten(aliases.get(t.typeName.getText(src)), seen);
      }
      return [t];
    };
    const parts = flatten(n.type);
    const props = [];
    const hides = [];
    for (const part of parts) {
      if (ts.isTypeLiteralNode(part)) {
        for (const m of part.members) {
          if (!ts.isPropertySignature(m) || !m.name) continue;
          props.push({ name: m.name.getText(src), type: m.type ? m.type.getText(src).replace(/\s+/g, " ") : "unknown", optional: !!m.questionToken, description: docOf(m) });
        }
      } else if (ts.isTypeReferenceNode(part) && part.typeName.getText(src) === "Omit" && part.typeArguments?.[1]) {
        hides.push(...[...part.typeArguments[1].getText(src).matchAll(/"([^"]+)"/g)].map((m) => m[1]).filter((h) => !/^onTc/.test(h)));
      }
    }
    out.push({ component, exported: exported.has(component), props, hides });
  });
  return out;
}

const pieces = {};
for (const mod of manifest.modules) {
  // The look provider lives in internal/ and gets a page of its own
  const slug = mod.path === "src/elements/internal/look.ts" ? "look-provider" : mod.path.match(/^src\/elements\/([^/]+)\.ts$/)?.[1];
  if (!slug) continue;
  const decls = (mod.declarations ?? []).filter((d) => d.tagName);
  if (!decls.length) continue;
  const source = readFileSync(mod.path, "utf8");
  const elements = decls.map((d) => {
    const ui = source.match(new RegExp(`class ${d.name}[\\s\\S]*?static override ui = "([^"]+)"`))?.[1] ?? "";
    return { ...api(d), ui, ...cssOf(source, ui) };
  });
  const names = new Set([slug, ...elements.map((e) => e.tag)]);
  // Module-level functions and objects (toaster's toast(), resetToasts()): exported, documented, not classes
  const exported = new Set((mod.exports ?? []).filter((e) => e.kind === "js").map((e) => e.name));
  const functions = (mod.declarations ?? [])
    .filter((d) => (d.kind === "function" || d.kind === "variable") && exported.has(d.name) && d.description)
    .map((d) => ({
      name: d.name,
      signature: d.kind === "function" ? `${d.name}(${(d.parameters ?? []).map((p) => `${p.name}${p.optional ? "?" : ""}: ${text(p.type) ?? "unknown"}`).join(", ")}): ${text(d.return?.type) ?? "void"}` : `${d.name}: ${text(d.type) ?? "object"}`,
      description: d.description,
    }));
  pieces[slug] = {
    elements,
    functions,
    react: reactOf(join("src/elements/react", `${slug}.ts`)),
    // Entries that name the element by tag, or start with its name ("- data-table sorts only when …")
    changelog: changelog.filter((l) => /^- /.test(l) && [...names].some((n) => l.includes(`\`${n}\``) || new RegExp(`^- \\**${n}\\b`).test(l))).map((l) => l.slice(2)),
  };
}
// Size: the element's module bundled on its own (its share of the shared internals included, as an app importing only
// it would get)
for (const [slug, piece] of Object.entries(pieces)) {
  if (only.length && !only.includes(slug)) continue;
  const entry = slug === "look-provider" ? "src/elements/internal/look.ts" : `src/elements/${slug}.ts`;
  const out = await esbuild.build({ entryPoints: [entry], bundle: true, minify: true, write: false, format: "esm", target: "es2022", external: ["lit", "lit/*", "@lit/*"], logLevel: "silent" });
  const code = out.outputFiles[0].contents;
  piece.size = { min: code.length, gzip: gzipSync(code).length };
}

const files = Object.fromEntries(Object.entries(pieces).map(([slug, piece]) => [`${slug}.json`, JSON.stringify(piece, null, 1) + "\n"]));

if (check) {
  // Only page files: a sync service's conflict copies ("name 2.json", gitignored) aren't ours
  const have = existsSync(OUT) ? readdirSync(OUT).filter((f) => /^[a-z0-9-]+\.json$/.test(f)) : [];
  // Sizes vary by a few bytes with the environment esbuild runs in (npm run vs node): compared without them
  const bare = (json) => JSON.stringify({ ...JSON.parse(json), size: undefined });
  const stale = [...Object.keys(files).filter((f) => !existsSync(join(OUT, f)) || bare(readFileSync(join(OUT, f), "utf8")) !== bare(files[f])), ...have.filter((f) => !(f in files))];
  if (stale.length) {
    console.error(`docs api out of date (${stale.slice(0, 5).join(", ")}${stale.length > 5 ? " …" : ""}) – run node scripts/gen-docs.mjs`);
    process.exit(1);
  }
  console.log(`docs api ok: ${Object.keys(files).length} pages`);
} else if (only.length) {
  mkdirSync(OUT, { recursive: true });
  for (const slug of only) {
    if (!files[`${slug}.json`]) throw new Error(`no element module for ${slug}`);
    writeFileSync(join(OUT, `${slug}.json`), files[`${slug}.json`]);
  }
  console.log(`${OUT}/: ${only.join(", ")}`);
} else {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const [f, body] of Object.entries(files)) writeFileSync(join(OUT, f), body);
  const count = Object.values(pieces).reduce((n, p) => n + p.elements.length, 0);
  console.log(`${OUT}/: ${Object.keys(files).length} pages, ${count} elements`);
}
