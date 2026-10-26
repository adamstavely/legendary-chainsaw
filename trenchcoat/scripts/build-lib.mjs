// Builds the published single-file components from src/:
//   src/components/<slug>.tsx  →  components/<slug>.tsx        (default look "standard")
//                              →  components/<slug>-clean.tsx  (default look "clean")
// Each output is self-contained – React is the only import – so it can still be copied on its own:
//   · modules imported from src/internal/ are inlined (their exports become local declarations)
//   · every var(--tc-token) in the CSS gets a fallback through a private variable,
//     var(--tc-token, var(--_tc-token)), and the root rule defines those privates for both looks from the
//     dictionary – so without tokens.css a lone file still renders either look, in light and dark
//   · the theme rules are tokens.css's selector list (scripts/tokens.mjs THEME_RULES): .dark, [data-theme="dark"]
//     and [data-tc-theme="dark"] force dark, [data-theme|data-tc-theme="light"] force light, [data-tc-theme="system"]
//     follows the OS
//   · `const DEFAULT_LOOK = …` is set per output; the component renders data-look={look ?? DEFAULT_LOOK} on its
//     root (and on any portal container, which also carries the class <root>__portal)
//   node scripts/build-lib.mjs [slug…]          build (all when no slug)
//   node scripts/build-lib.mjs --check [slug…]  fail if the published files are out of date
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { THEME_RULES, fallbacks } from "./tokens.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src/components");
const OUT = join(ROOT, "components");
const FB = fallbacks();
const LOOKS = ["standard", "clean"];

const args = process.argv.slice(2);
const check = args.includes("--check");
const only = args.filter((a) => !a.startsWith("--"));
const slugs = (only.length ? only : existsSync(SRC) ? readdirSync(SRC).filter((f) => f.endsWith(".tsx")).map((f) => f.slice(0, -4)) : []).sort();

/** Inline src/internal imports (recursively, each module once) and merge React imports */
function inline(file) {
  const seen = new Set();
  const react = { named: new Set(), types: new Set() };
  const bodies = [];
  const visit = (path, isEntry) => {
    if (seen.has(path)) return "";
    seen.add(path);
    let source = readFileSync(path, "utf8");
    source = source.replace(/^import\s+([^;]+?)\s+from\s+"([^"]+)";\n/gm, (whole, what, from) => {
      if (from === "react") {
        for (const part of what.replace(/^type\s+/, "").replace(/[{}]/g, "").split(",").map((p) => p.trim()).filter(Boolean)) {
          if (what.startsWith("type ") || part.startsWith("type ")) react.types.add(part.replace(/^type\s+/, ""));
          else react.named.add(part);
        }
        return "";
      }
      if (from.startsWith(".")) {
        const target = resolve(dirname(path), from.endsWith(".ts") || from.endsWith(".tsx") ? from : existsSync(resolve(dirname(path), `${from}.ts`)) ? `${from}.ts` : `${from}.tsx`);
        if (!target.startsWith(join(ROOT, "src/internal"))) throw new Error(`${path}: only src/internal/ may be imported, not ${from}`);
        const body = visit(target, false);
        if (body) bodies.push(body);
        return "";
      }
      return whole; // other packages (none expected) stay as imports
    });
    // Internal modules: exports become plain declarations, and their own header comment goes
    if (!isEntry) source = source.replace(/^\/\*[\s\S]*?\*\/\n/, "").replace(/^export\s+(?=(?:const|function|type|interface|class)\b)/gm, "").trim();
    return source;
  };
  const entry = visit(file, true);
  const names = [...react.named].sort();
  const types = [...react.types].sort().map((t) => `type ${t}`);
  const reactImport = names.length + types.length ? `import { ${[...names, ...types].join(", ")} } from "react";\n` : "";
  return { entry, reactImport, internals: bodies };
}

/** Code state at the start of each line: true when the line starts outside any bracket, string, template or comment */
function topLevelLines(text) {
  const lines = text.split("\n");
  const starts = [];
  const stack = []; // open brackets and template literals: "(" "[" "{" "`" and "${" (inside a template)
  let mode = null; // null | "'" | '"' | "/*" | "//"
  for (const line of lines) {
    starts.push(!mode && !stack.length);
    if (mode === "//") mode = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const top = stack[stack.length - 1];
      if (mode === "/*") {
        if (c === "*" && line[i + 1] === "/") (mode = null), i++;
      } else if (mode === "'" || mode === '"') {
        if (c === "\\") i++;
        else if (c === mode) mode = null;
      } else if (top === "`") {
        if (c === "\\") i++;
        else if (c === "`") stack.pop();
        else if (c === "$" && line[i + 1] === "{") stack.push("${"), i++;
      } else if (c === "/" && line[i + 1] === "/") break;
      else if (c === "/" && line[i + 1] === "*") (mode = "/*"), i++;
      else if (c === "'" || c === '"') mode = c;
      else if (c === "`") stack.push("`");
      else if (c === "(" || c === "[" || c === "{") stack.push(c);
      else if (c === ")" || c === "]" || c === "}") stack.pop();
    }
  }
  return { lines, starts };
}

/**
 * Drops top-level declarations of inlined helper modules that the component never uses (repeatedly, so a helper
 * only used by a dropped one goes too) – an unused inlined function would fail tsc's noUnusedLocals and eslint.
 */
function pruneInternals(internals, entry) {
  const DECL = /^(?:declare\s+)?(?:async\s+)?(?:const|let|function\*?|type|interface|class)\s+([A-Za-z_$][\w$]*)/;
  const chunks = [];
  for (const body of internals) {
    const { lines, starts } = topLevelLines(body);
    let pendingComment = [];
    let current = null;
    lines.forEach((line, i) => {
      const atTop = starts[i];
      if (atTop && /^\s*(\/\/|\/\*)/.test(line) && (!current || current.closed)) {
        pendingComment.push(line);
        return;
      }
      const decl = atTop ? line.match(DECL) : null;
      if (decl) {
        current = { name: decl[1], lines: [...pendingComment, line], closed: false };
        pendingComment = [];
        chunks.push(current);
      } else if (atTop && !line.trim()) {
        if (pendingComment.length) pendingComment.push(line);
        else if (current) current.lines.push(line), (current.closed = true);
        else chunks.push({ name: null, lines: [line] });
      } else if (current) current.lines.push(...pendingComment.splice(0), line);
      else chunks.push({ name: null, lines: [...pendingComment.splice(0), line] });
    });
    if (pendingComment.length) chunks.push({ name: null, lines: pendingComment });
    chunks.push({ name: null, lines: [""], separator: true });
  }
  const text = (c) => c.lines.join("\n");
  // A name mentioned only in a comment doesn't count as a use
  const code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/[^\n]*/g, "$1");
  const entryCode = code(entry);
  const kept = new Set(chunks);
  for (let changed = true; changed; ) {
    changed = false;
    for (const c of kept) {
      if (!c.name) continue;
      const word = new RegExp(`\\b${c.name.replace(/\$/g, "\\$")}\\b`);
      const used = word.test(entryCode) || [...kept].some((o) => o !== c && word.test(code(text(o))));
      if (!used) kept.delete(c), (changed = true);
    }
  }
  return chunks
    .filter((c) => kept.has(c))
    .map(text)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** var(--tc-x) → var(--tc-x, var(--_tc-x)) inside CSS templates, plus the per-look fallback block */
function addFallbacks(source, slug) {
  const used = new Set();
  // Everywhere in the file – the CSS template and inline styles alike; private fallbacks inherit from the root
  const out = source.replace(/var\(\s*(--tc-[\w-]+)\s*\)/g, (whole, name) => {
    if (!(name in FB.standard)) return whole; // a component token, defined in this file
    used.add(name);
    return `var(${name}, var(--_${name.slice(2)}))`;
  });
  if (!used.size) return { source: out, block: "" };
  const root = rootClass(source, slug);
  // Elements that carry the fallbacks: the root, portals, and any other exported component's own root
  // (declared in the source as const EXTRA_ROOT_CLASSES = ["ui-…"])
  const extra = JSON.parse(source.match(/const EXTRA_ROOT_CLASSES = (\[[^\]]*\]);/)?.[1] ?? "[]");
  const roots = [root, `${root}__portal`, ...extra];
  const lines = (look) => [...used].sort().map((name) => `  --_${name.slice(2)}: ${FB[look][name]};`).join("\n");
  const block = `/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
${LOOKS.map((look) => `${roots.map((r) => `.${r}:where([data-look="${look}"])`).join(",\n")} {\n${lines(look)}\n}`).join("\n")}
${THEME_RULES}
`;
  return { source: out, block };
}

function rootClass(source, slug) {
  const m = source.match(/const ROOT_CLASS = "([\w-]+)";/);
  if (!m) throw new Error(`src/components/${slug}.tsx: declare const ROOT_CLASS = "ui-…" (the component's root class)`);
  return m[1];
}

function build(slug) {
  const file = join(SRC, `${slug}.tsx`);
  const { entry, reactImport: reactImportAll, internals } = inline(file);
  if (!/const DEFAULT_LOOK(?::\s*Look)?\s*=\s*"standard";/.test(entry)) throw new Error(`${file}: declare const DEFAULT_LOOK: Look = "standard";`);
  let { source, block } = addFallbacks(entry, slug);
  // EXTRA_ROOT_CLASSES is build metadata – it shapes the fallback block and isn't needed at runtime
  source = source.replace(/(?:\/\*\*[^\n]*\*\/\n)?const EXTRA_ROOT_CLASSES = \[[^\]]*\];\n/, "");
  // The fallback block goes at the top of the first CSS template
  if (block) source = source.replace(/(\/\*\s*css\s*\*\/\s*`)/, `$1\n${block}`);
  // "use client" and the header comment stay first; the generated notice, React import and internals follow
  source = source.replace(/\n{3,}/g, "\n\n");
  const useClient = /^"use client";/.test(source) ? '"use client";\n\n' : "";
  source = source.replace(/^"use client";\s*/, "");
  const comment = source.match(/^\/\*[\s\S]*?\*\/\n/)?.[0] ?? "";
  const rest = source.slice(comment.length).replace(/^\n+/, "");
  const notice = `// Generated from src/components/${slug}.tsx by scripts/build-lib.mjs – edit the source, not this file.\n`;
  const helpers = internals.length ? pruneInternals(internals, rest) : "";
  const internalsBlock = helpers ? `\n/* ---------- Shared helpers (inlined from src/internal) ---------- */\n\n${helpers}\n` : "";
  // React imports only for what's still used once unused helpers are gone
  const used = `${rest}\n${helpers}`;
  const reactImport = reactImportAll.replace(/\{ ([^}]*) \}/, (_, list) => {
    const keep = list.split(", ").filter((p) => new RegExp(`\\b${p.replace(/^type /, "").split(" as ").pop()}\\b`).test(used));
    return `{ ${keep.join(", ")} }`;
  }).replace(/^import \{  \} from "react";\n/, "");
  // Helpers go before the Styles section when the source has one, otherwise at the end – never dropped
  const STYLES = /\n\/\* ---------- Styles ---------- \*\//;
  const withInternals = (text) => (!internalsBlock ? text : STYLES.test(text) ? text.replace(STYLES, `${internalsBlock}\n/* ---------- Styles ---------- */`) : `${text.replace(/\n*$/, "\n")}${internalsBlock}`);
  const body = (look) =>
    withInternals(`${useClient}${comment}${notice}\n${reactImport}${reactImport ? "\n" : ""}${rest}`)
      .replace(/const DEFAULT_LOOK(: Look)?\s*=\s*"standard";/, `const DEFAULT_LOOK$1 = "${look}";`)
      .replace(/\n*$/, "\n");
  return { standard: body("standard"), clean: body("clean") };
}

let stale = 0;
for (const slug of slugs) {
  const out = build(slug);
  for (const [look, text] of Object.entries(out)) {
    const target = join(OUT, look === "standard" ? `${slug}.tsx` : `${slug}-clean.tsx`);
    if (check) {
      if (!existsSync(target) || readFileSync(target, "utf8") !== text) {
        console.error(`out of date: ${target.slice(ROOT.length)} – run node scripts/build-lib.mjs ${slug}`);
        stale++;
      }
    } else writeFileSync(target, text);
  }
}
if (check && stale) process.exit(1);
console.log(`${check ? "checked" : "built"} ${slugs.length} component${slugs.length === 1 ? "" : "s"}`);
