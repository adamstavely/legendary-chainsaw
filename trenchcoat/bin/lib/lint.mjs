// Checks a project's use of Trenchcoat against the package's own API: the mistakes a type checker can't see in HTML, Vue,
// Svelte, Angular templates, Lit templates and CSS. It reads text and doesn't run anything, so it only judges what's written
// out; a value in an expression is left alone. React props are left to TypeScript, which already knows them.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import { DIST } from "./registry.mjs";

export const RULES = {
  "unknown-element": "error",
  "unknown-attribute": "error",
  "property-as-attribute": "error",
  "boolean-attribute": "error",
  "invalid-value": "error",
  "unknown-event": "error",
  "unknown-import": "error",
  "unknown-token": "error",
  "missing-import": "warning",
  "missing-tokens": "warning",
  "hard-coded-color": "warning",
};

const SOURCE = new Set([".html", ".htm", ".vue", ".svelte", ".jsx", ".tsx", ".js", ".ts", ".mjs", ".cjs", ".mts", ".cts", ".css", ".scss"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "build", "out", "coverage", "vendor", ".git", ".next", ".nuxt", ".output", ".svelte-kit", ".angular"]);
const GLOBAL_ATTRS = new Set(
  "id class classname style slot hidden title lang dir tabindex role part exportparts is key ref inert draggable contenteditable spellcheck translate accesskey autofocus nonce popover enterkeyhint inputmode suppresshydrationwarning".split(" "),
);
const OTHER_NAMESPACE = /^(aria-|data-|on[a-zA-Z]|v-(?!bind:|on:)|x-|hx-|ng|formcontrol|formgroup|attr\.|class\.|style\.|bind:|use:|transition:|in:|out:|animate:|let:|client:|\*|#|\{)/i;
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/i;
const COLOR_PROP = /^(?:color|background|background-color|border|border-(?:top|right|bottom|left)|border(?:-(?:top|right|bottom|left))?-color|outline|outline-color|fill|stroke|box-shadow)$/i;

const normal = (name) => name.toLowerCase().replace(/-/g, "");

function distance(a, b) {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}

function suggest(name, options) {
  let best;
  let score = Math.max(2, Math.floor(name.length / 3)) + 1;
  for (const option of options) {
    const d = distance(name, option);
    if (d < score) [best, score] = [option, d];
  }
  return best ? ` Did you mean ${best}?` : "";
}

/** The closed list of values a property's type allows, or undefined when its type leaves it open */
function literalValues(type = "") {
  const parts = type.split("|").map((p) => p.trim()).filter((p) => p && p !== "undefined" && p !== "null");
  if (!parts.length || !parts.every((p) => /^"[^"]*"$/.test(p))) return undefined;
  return parts.map((p) => p.slice(1, -1));
}

/** Everything the rules need from the package, read once */
export function loadLintData(registry) {
  const elements = new Map();
  const dir = join(DIST, "docs/api");
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    const slug = file.slice(0, -5);
    for (const element of JSON.parse(readFileSync(join(dir, file), "utf8")).elements ?? []) {
      if (element.tag) elements.set(element.tag, { ...element, slug });
    }
  }
  const events = new Set([...elements.values()].flatMap((e) => (e.events ?? []).map((ev) => ev.name)));
  return { elements, events, tokens: new Set(registry.cssVariables ?? []), slugs: new Set(registry.entries.map((e) => e.slug)) };
}

/** Comments become spaces, so positions still point at the right place and a commented-out example isn't judged */
function blankComments(text, ext) {
  const blank = (s) => s.replace(/[^\n]/g, " ");
  if ([".html", ".htm", ".vue", ".svelte"].includes(ext)) text = text.replace(/<!--[\s\S]*?-->/g, blank);
  let out = "";
  let i = 0;
  let quote = "";
  while (i < text.length) {
    const c = text[i];
    if (quote) {
      if (c === "\\") {
        out += text.slice(i, i + 2);
        i += 2;
        continue;
      }
      // Apostrophes in JSX text and HTML never close, so a string ends with its line
      if (c === quote || c === "\n") quote = "";
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += blank(text.slice(i, stop));
      i = stop;
      continue;
    } else if (c === "/" && text[i + 1] === "/" && ![".html", ".htm", ".css"].includes(ext) && text[i - 1] !== ":") {
      const end = text.indexOf("\n", i);
      const stop = end < 0 ? text.length : end;
      out += blank(text.slice(i, stop));
      i = stop;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

/** The attributes of an opening tag, reading quotes and {…} properly. `from` is just after the tag's name */
function readAttributes(text, from) {
  const attrs = [];
  let i = from;
  const space = /\s/;
  while (i < text.length) {
    while (i < text.length && space.test(text[i])) i++;
    if (text[i] === ">" || (text[i] === "/" && text[i + 1] === ">") || i >= text.length) break;
    if (text[i] === "<") break;
    const start = i;
    if (text[i] === "{" || (text[i] === "$" && text[i + 1] === "{")) {
      i = skipBraces(text, text.indexOf("{", i));
      continue;
    }
    while (i < text.length && !/[\s=>]/.test(text[i]) && !(text[i] === "/" && text[i + 1] === ">")) i++;
    const name = text.slice(start, i);
    let j = i;
    while (j < text.length && space.test(text[j])) j++;
    let value = null;
    let dynamic = false;
    if (text[j] === "=") {
      j++;
      while (j < text.length && space.test(text[j])) j++;
      const open = text[j];
      if (open === '"' || open === "'") {
        const end = text.indexOf(open, j + 1);
        const stop = end < 0 ? text.length : end;
        value = text.slice(j + 1, stop);
        i = stop + 1;
      } else if (open === "{") {
        i = skipBraces(text, j);
        value = text.slice(j, i);
        dynamic = true;
      } else if (open === "$" && text[j + 1] === "{") {
        i = skipBraces(text, j + 1);
        value = text.slice(j, i);
        dynamic = true;
      } else {
        i = j;
        while (i < text.length && !/[\s>]/.test(text[i])) i++;
        value = text.slice(j, i);
      }
      if (value !== null && /\$\{|\{\{|\{/.test(value)) dynamic = true;
    } else i = Math.max(i, start + 1);
    if (name) attrs.push({ name, value, dynamic, offset: start });
  }
  return attrs;
}

function skipBraces(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i + 1;
  }
  return text.length;
}

/** The framework's binding syntax taken off an attribute's name */
function readBinding(name) {
  let m;
  if ((m = name.match(/^(?:@|v-on:|on:)([^.]+)/))) return { kind: "event", name: m[1] };
  if ((m = name.match(/^\(([^)]+)\)$/))) return { kind: "event", name: m[1] };
  if ((m = name.match(/^\[\(([^)]+)\)\]$/))) return { kind: "bound", name: m[1] };
  if ((m = name.match(/^\[([^\]]+)\]$/))) return { kind: "bound", name: m[1] };
  if ((m = name.match(/^(?::|v-bind:|\.)([^.]+)/))) return { kind: "bound", name: m[1] };
  if ((m = name.match(/^\?(.+)/))) return { kind: "bound", name: m[1] };
  return { kind: "plain", name };
}

function styleBlocks(text, ext) {
  if (ext === ".css" || ext === ".scss") return [{ css: text, offset: 0 }];
  return [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => ({ css: m[1], offset: m.index + m[0].indexOf(m[1]) }));
}

function disabledLines(text) {
  const off = new Map();
  text.split("\n").forEach((line, i) => {
    const m = line.match(/trenchcoat-lint-disable-next-line(?:\s+([a-z-]+(?:\s*,\s*[a-z-]+)*))?/);
    if (m) off.set(i + 2, m[1] ? m[1].split(",").map((r) => r.trim()) : null);
  });
  return off;
}

function lintOne(source, data, facts) {
  const ext = extname(source.file).toLowerCase();
  const raw = source.text;
  const text = blankComments(raw, ext);
  const off = disabledLines(raw);
  const found = [];
  const report = (rule, offset, message) => {
    const before = raw.slice(0, offset);
    const line = before.split("\n").length;
    const silenced = off.has(line) && (off.get(line) === null || off.get(line).includes(rule));
    if (!silenced) found.push({ file: source.file, line, column: offset - before.lastIndexOf("\n"), rule, severity: RULES[rule], message });
  };

  for (const m of text.matchAll(/customElements\.define\(\s*["'`](tc-[a-z0-9-]+)/g)) facts.ownTags.add(m[1]);
  for (const m of text.matchAll(/\bfrom\s+["']trenchcoat(?:\/([^"']+))?["']|\bimport\s+["']trenchcoat(?:\/([^"']+))?["']|\bimport\(\s*["']trenchcoat(?:\/([^"']+))?["']|@import\s+(?:url\()?["']trenchcoat(?:\/([^"']+))?["']|(?:src|href)=["'][^"']*trenchcoat\/?([^"']*)["']/g)) {
    const path = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? "";
    facts.imports.add(path);
    if (m[0].startsWith("src") || m[0].startsWith("href")) continue;
    if (path && !isPackagePath(path, data)) report("unknown-import", m.index, `"trenchcoat/${path}" isn't in the package.${suggest(path, data.slugs)}`);
  }
  for (const m of text.matchAll(/--tc-[a-z0-9-]*[a-z0-9]/g)) {
    const at = m.index;
    const after = text.slice(at + m[0].length).trimStart();
    // The start of a name built with an expression isn't a whole name
    if (text[at + m[0].length] === "-" || text.startsWith("${", at + m[0].length)) continue;
    const isSet = after[0] === ":" || /["']\s*,/.test(text.slice(at + m[0].length, at + m[0].length + 4));
    (isSet ? facts.tokensSet : facts.tokensUsed).push({ name: m[0], offset: at, report });
    if (isSet) facts.tokensDefined.add(m[0]);
  }

  for (const m of text.matchAll(/<(tc-[a-z0-9-]+)(?=[\s/>])/g)) {
    const tag = m[1];
    facts.usedAny = true;
    facts.tagsUsed.push({ tag, offset: m.index, report });
    const element = data.elements.get(tag);
    if (!element) {
      facts.unknownTags.push({ tag, offset: m.index, report });
      continue;
    }
    const props = element.properties ?? [];
    const known = new Map();
    for (const p of props) {
      known.set(normal(p.name), p);
      if (p.attribute) known.set(normal(p.attribute), p);
    }
    const events = (element.events ?? []).map((e) => e.name);
    for (const attr of readAttributes(text, m.index + m[0].length)) {
      const binding = readBinding(attr.name);
      if (binding.kind === "event") {
        if (binding.name.startsWith("tc-") && !events.includes(binding.name)) {
          report("unknown-event", attr.offset, `<${tag}> doesn't send ${binding.name}.${suggest(binding.name, events)}`);
        }
        continue;
      }
      if (attr.name === "style" && attr.value && !attr.dynamic) checkDeclarations(attr.value, attr.offset, report);
      if (binding.kind === "plain" && OTHER_NAMESPACE.test(attr.name)) continue;
      const lower = binding.name.toLowerCase();
      if (GLOBAL_ATTRS.has(lower) || OTHER_NAMESPACE.test(binding.name)) continue;
      const prop = known.get(normal(binding.name));
      if (!prop) {
        const names = props.flatMap((p) => [p.attribute ?? p.name]);
        report("unknown-attribute", attr.offset, `<${tag}> has no ${binding.name}.${suggest(binding.name, names)}`);
        continue;
      }
      if (binding.kind !== "plain" || attr.dynamic || attr.value === null) continue;
      const jsx = ext === ".jsx" || ext === ".tsx";
      if (!prop.attribute) {
        if (!(jsx && /\bstring\b/.test(prop.type ?? ""))) {
          report("property-as-attribute", attr.offset, `${prop.name} on <${tag}> is a property with no attribute, so this text never reaches it. Set it from code.`);
        }
        continue;
      }
      if ((ext === ".html" || ext === ".htm") && attr.name.toLowerCase() !== prop.attribute) {
        report("property-as-attribute", attr.offset, `HTML reads this as "${attr.name.toLowerCase()}", so it never reaches ${prop.name}. Write ${prop.attribute}.`);
        continue;
      }
      if (/^boolean\b/.test(prop.type ?? "") && attr.value === "false") {
        report("boolean-attribute", attr.offset, `${prop.attribute}="false" on <${tag}> turns it on: any value does. Leave the attribute off.`);
        continue;
      }
      const allowed = literalValues(prop.type);
      if (allowed && !allowed.includes(attr.value)) {
        report("invalid-value", attr.offset, `"${attr.value}" isn't a ${prop.attribute} of <${tag}>. It takes ${allowed.map((v) => `"${v}"`).join(", ")}.${suggest(attr.value, allowed)}`);
      }
    }
  }

  // A component from trenchcoat/react, under whatever name this file gave it
  const wrappers = new Map();
  for (const m of text.matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']trenchcoat\/react["']/g)) {
    for (const part of m[1].split(",")) {
      const [name, alias] = part.trim().split(/\s+as\s+/);
      if (!name) continue;
      facts.usedAny = true;
      wrappers.set(alias ?? name, name);
    }
  }
  for (const [local, name] of wrappers) {
    const element = [...data.elements.values()].find((e) => e.className === `Tc${name}`);
    if (!element) continue;
    const events = (element.events ?? []).map((e) => e.name);
    for (const m of text.matchAll(new RegExp(`<${local}(?=[\\s/>])`, "g"))) {
      for (const attr of readAttributes(text, m.index + m[0].length)) {
        const event = attr.name.match(/^onTc([A-Z]\w*)$/);
        if (!event) continue;
        const kebab = `tc-${event[1].replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
        if (!events.includes(kebab)) report("unknown-event", attr.offset, `<${local}> doesn't send ${kebab}.${suggest(kebab, events)}`);
      }
    }
  }

  for (const m of text.matchAll(/addEventListener\(\s*["'`](tc-[a-z0-9-]+)["'`]/g)) {
    if (!data.events.has(m[1])) facts.listeners.push({ name: m[1], offset: m.index, report });
  }
  for (const m of text.matchAll(/(?:new\s+CustomEvent|dispatchEvent\(\s*new\s+\w+)\(\s*["'`](tc-[a-z0-9-]+)/g)) facts.ownEvents.add(m[1]);

  for (const { css, offset } of styleBlocks(text, ext)) {
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/(^|[\s,>+~])tc-[a-z0-9-]+/.test(rule[1])) checkDeclarations(rule[2], offset + rule.index + rule[1].length + 1, report);
    }
  }
  return found;
}

function checkDeclarations(css, offset, report) {
  for (const m of css.matchAll(/([a-z-]+)\s*:\s*([^;]+)/gi)) {
    if (!COLOR_PROP.test(m[1])) continue;
    const value = m[2].replace(/var\((?:[^()]|\([^()]*\))*\)/g, "");
    if (COLOR.test(value)) report("hard-coded-color", offset + m.index, `${m[1].toLowerCase()} is a fixed colour, so it won't follow the look or dark mode. Use a --tc- token.`);
  }
}

function isPackagePath(path, data) {
  if (/^(react|angular|angular\/forms|generative|headless|testing|registry\.json|vue|svelte|tokens\.css|look-provider|custom-elements\.json|package\.json)$/.test(path)) return true;
  if (/^(internal|elements|generative|angular|types|tokens\/dtcg)\//.test(path)) return true;
  return data.slugs.has(path) || existsSync(join(DIST, `${path}.js`));
}

/** Lints files together, because whether something is imported or defined can be answered anywhere in the project */
export function lintSources(sources, data, { project = true } = {}) {
  const facts = { imports: new Set(), ownTags: new Set(), ownEvents: new Set(), tokensSet: [], tokensUsed: [], tokensDefined: new Set(), tagsUsed: [], unknownTags: [], listeners: [], usedAny: false };
  const results = [];
  for (const source of sources) results.push(lintOne(source, data, facts));

  const tags = [...data.elements.keys()];
  for (const { tag, offset, report } of facts.unknownTags) {
    if (!facts.ownTags.has(tag)) report("unknown-element", offset, `<${tag}> isn't a Trenchcoat element.${suggest(tag, tags)}`);
  }
  for (const { name, offset, report } of facts.listeners) {
    if (!facts.ownEvents.has(name)) report("unknown-event", offset, `No Trenchcoat element sends ${name}.${suggest(name, data.events)}`);
  }
  for (const { name, offset, report } of facts.tokensUsed) {
    if (!data.tokens.has(name) && !facts.tokensDefined.has(name)) report("unknown-token", offset, `${name} isn't a Trenchcoat token and nothing here defines it.${suggest(name, data.tokens)}`);
  }
  const used = new Set(facts.tokensUsed.map((t) => t.name));
  for (const { name, offset, report } of facts.tokensSet) {
    if (!data.tokens.has(name) && !used.has(name)) report("unknown-token", offset, `Setting ${name} does nothing: no Trenchcoat element reads it.${suggest(name, data.tokens)}`);
  }
  if (project) {
    const everything = [...facts.imports].some((p) => p === "" || /standalone|\.js$/.test(p));
    if (!everything) {
      const warned = new Set();
      for (const { tag, offset, report } of facts.tagsUsed) {
        const element = data.elements.get(tag);
        if (!element || warned.has(tag)) continue;
        const paths = [element.slug, `elements/${element.slug}`, `angular/${element.slug}`];
        if (paths.some((p) => facts.imports.has(p)) || facts.imports.has("angular") || facts.imports.has("vue") || facts.imports.has("svelte")) continue;
        warned.add(tag);
        report("missing-import", offset, `Nothing here imports <${tag}>, so it stays an empty tag. Add: import "trenchcoat/${element.slug}";`);
      }
    }
    if (facts.usedAny && !facts.imports.has("tokens.css")) {
      const first = sources[0];
      results.push([{ file: first.file, line: 1, column: 1, rule: "missing-tokens", severity: RULES["missing-tokens"], message: 'Nothing here imports the tokens, so elements draw without colours or spacing. Add once, at the entry: import "trenchcoat/tokens.css";' }]);
    }
  }
  return results.flat().sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);
}

function walk(path, out) {
  const stat = statSync(path);
  if (stat.isFile()) {
    out.push(path);
    return;
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
    } else if (SOURCE.has(extname(entry.name).toLowerCase()) && !/\.(d\.[cm]?ts|min\.js)$/.test(basename(entry.name))) out.push(full);
  }
}

/** The sources under some paths, named relative to `cwd`. Throws when a path doesn't exist */
export function readSources(paths, cwd) {
  const files = [];
  for (const path of paths) walk(resolve(cwd, path), files);
  return [...new Set(files)].map((file) => ({ file: relative(cwd, file) || file, text: readFileSync(file, "utf8") }));
}
