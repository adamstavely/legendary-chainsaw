// What the docs pages say about each element beyond its API (remediation 6.5), worked out from the source:
//   · reach(slug)        the code that reaches an element: its own module, the other elements it imports (whole), and
//                        only the parts of internal/* it uses (the classes, functions and constants it names, followed
//                        through their own references) – so a controller's ResizeObserver counts only where the
//                        controller is used
//   · runtime(slug)      timers, animation frames, observers, clock reads and global listeners, and what stops them
//   · frameworks(page)   the facts the Frameworks section is built from: data properties, events, the controlled
//                        pairs (property + cancelable change event), form value, slots, type names
//   · bundle(slug)       min and gzip of the element alone, the shared code it pulls in, with and without Lit
// Used by gen-docs.mjs (runtime, frameworks, browser), measure-perf.mjs (bundle) and check-docs.mjs (staleness).
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const require = createRequire(import.meta.url);
const ts = require("typescript");
// The repository root (under vitest's jsdom, import.meta.url isn't a file: URL – tests run from the root)
export const ROOT = import.meta.url.startsWith("file:") ? resolve(dirname(new URL(import.meta.url).pathname), "..") : process.cwd();
const ELEMENTS = join(ROOT, "src/elements");

/** The module that defines a page's element(s) */
export const entryOf = (slug) => join(ELEMENTS, slug === "look-provider" ? "internal/look.ts" : `${slug}.ts`);
/** "internal/controllers", "code-block" – a module's name as the pages show it */
export const labelOf = (file) => (file.startsWith(`${ELEMENTS}/`) ? relative(ELEMENTS, file) : relative(ROOT, file)).replace(/\.ts$/, "");

/** Source without comments – so prose ("every colour is a light-dark() pair") isn't taken for a use. Strings stay. */
export function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");
}

const modules = new Map();
function moduleInfo(file) {
  if (modules.has(file)) return modules.get(file);
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const imports = new Map(); // local name → { file, name }
  const sideEffects = [];
  const decls = new Map(); // name → statement text
  const loose = []; // top-level statements that run on import (customElements.define, …)
  const local = (spec) => {
    if (!spec.startsWith(".")) return null;
    const base = resolve(dirname(file), spec).replace(/\.js$/, "");
    return [`${base}.ts`, join(base, "index.ts")].find(existsSync) ?? null;
  };
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      const target = local(st.moduleSpecifier.text);
      if (!target) continue;
      const clause = st.importClause;
      if (!clause) sideEffects.push(target);
      else if (!clause.isTypeOnly) {
        if (clause.name) imports.set(clause.name.text, { file: target, name: "default" });
        const nb = clause.namedBindings;
        if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) if (!el.isTypeOnly) imports.set(el.name.text, { file: target, name: (el.propertyName ?? el.name).text });
        if (nb && ts.isNamespaceImport(nb)) imports.set(nb.name.text, { file: target, name: "*" });
      }
    } else if (ts.isClassDeclaration(st) || ts.isFunctionDeclaration(st)) {
      if (st.name) decls.set(st.name.text, st.getText(sf));
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) decls.set(d.name.text, st.getText(sf));
    } else if (ts.isExportDeclaration(st)) {
      const target = st.moduleSpecifier && local(st.moduleSpecifier.text);
      if (target && !st.isTypeOnly) sideEffects.push(target);
    } else if (!ts.isTypeAliasDeclaration(st) && !ts.isInterfaceDeclaration(st) && !ts.isModuleDeclaration(st) && !ts.isEnumDeclaration(st)) {
      loose.push(st.getText(sf));
    }
  }
  const info = { file, text, imports, sideEffects, decls, loose: loose.join("\n") };
  modules.set(file, info);
  return info;
}
/** Shared code (internal/*, src/internal/*) – everything but the element modules in src/elements/ itself */
const isInternal = (file) => dirname(file) !== ELEMENTS;
const names = (text) => new Set(text.match(/[A-Za-z_$][\w$]*/g) ?? []);

/**
 * The code that reaches an element, as chunks: { file, label, text }. Element modules count whole (importing one
 * registers its element); internal modules count only the declarations reached.
 */
export function reach(slug) {
  const chunks = [];
  const seen = new Set();
  const wholes = new Set();
  const add = (file, label, text) => {
    const key = `${file}#${label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    chunks.push({ file, label, text });
    return true;
  };
  const follow = (info, text) => {
    for (const n of names(text)) {
      if (info.imports.has(n)) {
        const { file, name } = info.imports.get(n);
        if (isInternal(file) && name !== "*") decl(file, name);
        else whole(file);
      } else if (info.decls.has(n)) decl(info.file, n);
    }
  };
  const decl = (file, name) => {
    if (wholes.has(file)) return;
    const info = moduleInfo(file);
    // The module's own top-level statements run whenever any of it is imported
    if (info.loose.trim() && add(file, labelOf(file), info.loose)) follow(info, info.loose);
    const text = info.decls.get(name);
    if (text === undefined) return;
    if (add(file, `${labelOf(file)} › ${name}`, text)) follow(info, text);
  };
  const whole = (file) => {
    if (wholes.has(file)) return;
    wholes.add(file);
    const info = moduleInfo(file);
    chunks.splice(0, chunks.length, ...chunks.filter((c) => c.file !== file));
    add(file, labelOf(file), info.text);
    for (const s of info.sideEffects) whole(s);
    follow(info, info.text);
  };
  whole(entryOf(slug));
  return chunks;
}

/** The element modules an element imports (and so registers and can render), not counting itself */
export const elementsReached = (slug) => [...new Set(reach(slug).map((c) => c.file))].filter((f) => !isInternal(f) && f !== entryOf(slug)).map(labelOf);

// ── Runtime notes ────────────────────────────────────────────────────────────────────────────────────────────────
const RUNTIME = {
  interval: /\bsetInterval\(/,
  intervalCleared: /\bclearInterval\(/,
  timeout: /\bsetTimeout\(/,
  frame: /\brequestAnimationFrame\(/,
  frameCancelled: /\bcancelAnimationFrame\(/,
  offscreen: /\b(OffScreenController|OnScreenController)\b|new IntersectionObserver\(/,
  hidden: /visibilitychange|document\.hidden|visibilityState/,
  reducedJs: /matchMedia\([^)]*prefers-reduced-motion/,
  reducedCss: /@media[^{]*prefers-reduced-motion/,
  infinite: /animation(?:-iteration-count)?\s*:[^;`]*\binfinite\b/g,
};
const OBSERVERS = ["ResizeObserver", "IntersectionObserver", "MutationObserver", "PerformanceObserver"];
const CLOCKS = [
  ["Date.now()", /\bDate\.now\(\)/],
  ["new Date()", /\bnew Date\(\)/],
  ["performance.now()", /\bperformance\.now\(\)/],
];

/** What runs on its own once the element is on the page, and what stops it – detected statically */
export function runtime(slug) {
  const out = { timers: [], frames: [], animations: 0, observers: [], clock: [], listeners: [], pauses: { offscreen: [], hidden: [], reducedMotion: [] } };
  const push = (list, value) => list.includes(value) || list.push(value);
  for (const c of reach(slug)) {
    const code = stripComments(c.text);
    const via = c.file === entryOf(slug) ? "" : c.label;
    const tag = (s) => (via ? `${s} (${via})` : s);
    if (RUNTIME.interval.test(code)) push(out.timers, tag(`setInterval${RUNTIME.intervalCleared.test(code) ? ", cleared" : ", never cleared"}`));
    if (RUNTIME.timeout.test(code)) push(out.timers, tag("setTimeout"));
    if (RUNTIME.frame.test(code)) push(out.frames, tag(`requestAnimationFrame${RUNTIME.frameCancelled.test(code) ? ", cancelled" : ""}`));
    out.animations += (code.match(RUNTIME.infinite) ?? []).length;
    for (const o of OBSERVERS) if (new RegExp(`new ${o}\\(`).test(code)) push(out.observers, tag(o));
    for (const [name, re] of CLOCKS) if (re.test(code)) push(out.clock, tag(name));
    // Listeners on the window or document (a bare addEventListener( in a module is the window's)
    for (const m of code.matchAll(/(?:\b(window|document)\.|(?:^|[^.\w$]))addEventListener\(\s*["'`]([\w-]+)/g)) push(out.listeners, tag(`${m[1] ?? "window"} ${m[2]}`));
    if (RUNTIME.offscreen.test(code)) push(out.pauses.offscreen, via || "itself");
    if (RUNTIME.hidden.test(code)) push(out.pauses.hidden, via || "itself");
    if (RUNTIME.reducedJs.test(code)) push(out.pauses.reducedMotion, tag("script"));
    if (RUNTIME.reducedCss.test(code)) push(out.pauses.reducedMotion, tag("CSS"));
  }
  return out;
}

// ── Framework facts ──────────────────────────────────────────────────────────────────────────────────────────────
const camel = (s) => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

/** The facts each framework tab is written from, for one element of a page */
export function frameworkFacts(el, slug, source = "") {
  const events = el.events.map((e) => ({ name: e.name, cancelable: e.cancelable }));
  // Controlled: a property the user changes unless a listener prevents its cancelable change event
  const controlled = [];
  for (const p of el.properties) {
    const said = p.description.match(/unless a (tc-[\w-]+) listener calls preventDefault/)?.[1];
    const named = `tc-${p.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}-change`;
    const event = said ?? (el.events.some((e) => e.name === named && e.cancelable) ? named : null);
    if (event && el.events.some((e) => e.name === event)) controlled.push({ property: p.name, event });
  }
  const value = controlled.find((c) => c.property === "value" && c.event === "tc-value-change");
  return {
    tag: el.tag,
    className: el.className,
    module: `trenchcoat/${slug}`,
    data: el.properties.filter((p) => !p.attribute && !p.readonly && p.name !== "look").map((p) => p.name),
    attributes: el.properties.filter((p) => p.attribute && p.name !== "look").map((p) => ({ name: p.name, attribute: p.attribute })),
    events,
    controlled,
    // Form components: their value is two-way – pass it in, take it back from tc-value-change
    form: value ? { property: "value", event: "tc-value-change", formAssociated: /static\s+(?:override\s+)?formAssociated\s*=\s*true/.test(source) || /extends TcSettingsElement/.test(source) } : null,
    slots: el.slots.map((s) => s.name),
  };
}

// ── Bundle cost ──────────────────────────────────────────────────────────────────────────────────────────────────
// Loaded when first used: the browser-support test imports this module under jsdom, where esbuild can't load
let esbuildModule;
const esbuild = { build: (o) => (esbuildModule ??= require("esbuild")).build(o) };
const LIT = /(^|\/)node_modules\/(lit|lit-html|lit-element|@lit\/[^/]+)\//;
// Fixed, so the output (and its hash) doesn't depend on the environment esbuild runs in
const BASE = { bundle: true, minify: true, write: false, format: "esm", target: "es2022", logLevel: "silent", define: { "process.env.NODE_ENV": '"production"' }, absWorkingDir: ROOT };
const sizes = (bytes) => ({ min: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length });

/**
 * The package's "sideEffects" list names dist/, so from src/ esbuild would drop an element's `import "./code-block"`,
 * which the published build keeps: relative imports are marked as having side effects
 */
const keepImports = {
  name: "keep-imports",
  setup(b) {
    b.onResolve({ filter: /^\./ }, async (args) => {
      if (args.pluginData === "inner") return undefined;
      const r = await b.resolve(args.path, { kind: args.kind, importer: args.importer, resolveDir: args.resolveDir, pluginData: "inner" });
      return r.errors.length ? undefined : { path: r.path, namespace: r.namespace, sideEffects: true };
    });
  },
};

/** Every import but the entry itself is external: the module's own code */
const onlyEntry = (entry) => ({
  name: "only-entry",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (args) => (args.kind === "entry-point" ? undefined : { path: args.path, external: true }));
  },
});

/** The element's bundle without Lit – what an app that already loads Lit adds – and its hash, which marks
 *  measurements stale */
export async function withoutLit(slug) {
  const out = await esbuild.build({ ...BASE, entryPoints: [entryOf(slug)], external: ["lit", "lit/*", "@lit/*"], plugins: [keepImports] });
  const code = out.outputFiles[0].contents;
  return { ...sizes(code), hash: createHash("sha256").update(code).digest("hex").slice(0, 16) };
}

export async function bundle(slug) {
  const entry = entryOf(slug);
  const own = await esbuild.build({ ...BASE, entryPoints: [entry], plugins: [onlyEntry(entry)] });
  const noLit = await esbuild.build({ ...BASE, entryPoints: [entry], external: ["lit", "lit/*", "@lit/*"], plugins: [keepImports] });
  const all = await esbuild.build({ ...BASE, entryPoints: [entry], metafile: true, plugins: [keepImports] });
  // What each shared module contributes to the full bundle (minified bytes; gzip only exists for whole files)
  const inputs = Object.values(all.metafile.outputs)[0].inputs;
  const shared = new Map();
  for (const [path, { bytesInOutput }] of Object.entries(inputs)) {
    if (!bytesInOutput) continue;
    const abs = resolve(ROOT, path);
    if (abs === entry) continue;
    const key = LIT.test(path) ? "Lit" : path.startsWith("src/elements/") ? labelOf(abs) : path.replace(/^node_modules\//, "");
    const kind = key === "Lit" ? "lit" : key.startsWith("internal/") ? "internal" : path.startsWith("src/elements/") ? "element" : "other";
    const prev = shared.get(key) ?? { name: key, kind, min: 0 };
    prev.min += bytesInOutput;
    shared.set(key, prev);
  }
  const order = { lit: 0, internal: 1, element: 2, other: 3 };
  return {
    own: sizes(own.outputFiles[0].contents),
    shared: [...shared.values()].sort((a, b) => order[a.kind] - order[b.kind] || b.min - a.min),
    withoutLit: sizes(noLit.outputFiles[0].contents),
    withLit: sizes(all.outputFiles[0].contents),
    hash: createHash("sha256").update(noLit.outputFiles[0].contents).digest("hex").slice(0, 16),
  };
}

/** Elements that window long lists (RowWindowController) – their pages say how many rows were tested */
export const windowed = (slug) => reach(slug).some((c) => c.file === entryOf(slug) && /new RowWindowController\(/.test(c.text));
