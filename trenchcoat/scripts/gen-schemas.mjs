// Writes what a model needs to place Trenchcoat components in an answer (remediation Phase 3), from the elements'
// TypeScript types and JSDoc:
//   · src/generative/schemas/<tag>.json – a JSON Schema per generatable element: the properties a model may set, as
//     the element types them (ts-json-schema-generator), with their descriptions
//   · src/generative/catalog.json – one line per generatable element (tag, name, what it's for, its events), short
//     enough to put in a prompt; a model asks for a schema when it wants to use one
//   · src/generative/registry.ts – each tag's module, loaded when an answer first uses it
// Generatable: every public property the model can write as JSON. Properties that take functions, DOM nodes or files
// are left out, and so are elements that only make sense under the app's control (dialogs, the composer, global
// shortcuts, page decoration – DENY below). `--check` fails when a file is out of date (CI).
//   node scripts/gen-schemas.mjs [--check]
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createGenerator } from "ts-json-schema-generator";
import ts from "typescript";

const OUT = "src/generative";
const TMP = "node_modules/.cache/gen-schemas";
const check = process.argv.includes("--check");

/** Elements a model shouldn't place: they're app-controlled (modals, inputs that own the page's state, global
 *  shortcuts), wrap other content, or decorate the page */
const DENY = new Set([
  "tc-look-provider", "tc-dialog", "tc-terms-dialog", "tc-stories", "tc-toaster", "tc-tooltip", "tc-chat-composer", "tc-multimodal-input",
  "tc-voice-mode", "tc-voice-orb", "tc-dropzone", "tc-command-menu", "tc-selection-translate", "tc-ai-search", "tc-mention-picker",
  "tc-generated-ui", "tc-grid-background", "tc-gradient-floor", "tc-gradient-text", "tc-glow-keyboard", "tc-shimmer-loader", "tc-skeleton",
  "tc-shimmer-text", "tc-text-reveal", "tc-blur-crossfade", "tc-tilt-card", "tc-glass-folder", "tc-side-folder", "tc-layer-stack",
  "tc-integration-beam", "tc-logo-cluster", "tc-number-ticker", "tc-agent-cursors", "tc-live-view", "tc-otp-input", "tc-secret-field",
  "tc-stepper-field", "tc-stepper-input", "tc-stepper-tags", "tc-stepper-choices", "tc-stepper-review", "tc-stepper-success",
  "tc-message-text", "tc-profile-menu", "tc-app-picker", "tc-notifications", "tc-background-tasks", "tc-thinking-loader",
]);
/** Property types a model can't write as JSON */
const NOT_JSON = /\b(Element|HTMLElement|Node|DocumentFragment|File|FileList|Blob|AbortSignal|Promise|Function|TemplateResult|Map|Set|WeakMap|Look)\b|=>/;
/** Properties every element has that a model shouldn't set: the look is the page's */
const SKIP_PROPS = new Set(["look"]);

execSync("npx cem analyze --config custom-elements-manifest.config.mjs", { stdio: "ignore" });
const manifest = JSON.parse(readFileSync("custom-elements.json", "utf8"));

const elements = [];
for (const mod of manifest.modules) {
  if (!mod.path.startsWith("src/elements/") || mod.path.includes("/internal/") || mod.path.includes("/react/")) continue;
  for (const decl of mod.declarations ?? []) {
    if (!decl.tagName || !decl.customElement || DENY.has(decl.tagName)) continue;
    const slug = mod.path.slice("src/elements/".length, -3);
    const seen = new Set();
    const props = (decl.members ?? []).filter(
      (f) => f.kind === "field" && !f.static && !f.privacy && !f.readonly && /^[a-z]\w*$/i.test(f.name) && !SKIP_PROPS.has(f.name) && !NOT_JSON.test(f.type?.text ?? "") && !seen.has(f.name) && seen.add(f.name),
    );
    if (!props.length) continue;
    elements.push({ slug, tag: decl.tagName, cls: decl.name, name: decl.name.replace(/^Tc/, ""), description: (decl.description ?? "").trim(), props, events: (decl.events ?? []).map((e) => e.name).filter(Boolean) });
  }
}
elements.sort((a, b) => a.tag.localeCompare(b.tag));

// One file of Props types, one per element, so one compiler program serves them all
mkdirSync(TMP, { recursive: true });
const DOM_STUBS = ["Element", "HTMLElement", "SVGElement", "Node", "ChildNode", "DocumentFragment", "EventTarget", "File", "FileList", "Blob", "AbortSignal", "Event", "CustomEvent", "Window", "Document", "ShadowRoot", "CSSStyleSheet", "ElementInternals", "HTMLFormElement", "DOMRect"];
const typeName = (el) => `${el.name}Props`;
const doc = (text) => (text ? `  /** ${text.replace(/\*\//g, "*\\/").replace(/\s*\n\s*/g, " ")} */\n` : "");
/** import("…/x").Name in a written type becomes a namespace import, which the generator reads */
const namespaces = new Map();
const qualify = (text) =>
  text.replace(/import\("([^"]+)"\)\./g, (_, path) => {
    if (!namespaces.has(path)) namespaces.set(path, `m${namespaces.size}`);
    return `${namespaces.get(path)}.`;
  });
const writeProps = () =>
  writeFileSync(
    join(TMP, "props.ts"),
    (() => {
      const body = elements
      .filter((el) => el.props.length)
      .map(
        (el) =>
          `import type { ${el.cls} } from "../../../src/elements/${el.slug}";\nexport type ${typeName(el)} = {\n${el.props.map((p) => `${doc(p.description)}  ${p.name}?: ${p.tsType ?? `${el.cls}["${p.name}"]`};`).join("\n")}\n};\n` +
          // Each property alone too, for when the generator can't take the whole set
          el.props.map((p) => `export type ${typeName(el)}__${p.name} = ${p.tsType ?? `${el.cls}["${p.name}"]`};`).join("\n"),
      )
      .join("\n");
      return `/// <reference path="./dom-stubs.d.ts" />\n${[...namespaces].map(([path, ns]) => `import type * as ${ns} from "${path}";`).join("\n")}\n${body}`;
    })(),
  );
writeProps();

// Which properties are JSON: a property whose own type is a function, a DOM node, a file or a promise is left out.
// Fields deeper down that aren't JSON (an icon Element in a list item) are dropped from the schema, not the property.
{
  const config = ts.getParsedCommandLineOfConfigFile("tsconfig.json", {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  const program = ts.createProgram([join(TMP, "props.ts")], { ...config.options, noEmit: true });
  const checker = program.getTypeChecker();
  const file = program.getSourceFile(join(TMP, "props.ts"));
  const BAD = /^(Element|HTMLElement|SVGElement|Node|ChildNode|DocumentFragment|EventTarget|File|FileList|Blob|AbortSignal|Promise|PromiseLike|Map|Set|WeakMap|WeakSet|Date|RegExp|Window|Document|TemplateResult|Function)$/;
  for (const el of elements) {
    const alias = file.statements.find((st) => ts.isTypeAliasDeclaration(st) && st.name.text === typeName(el));
    if (!alias) continue;
    const props = checker.getPropertiesOfType(checker.getTypeAtLocation(alias));
    // A property is out when its own type isn't JSON; a field deep inside that isn't is dropped from the schema below
    const top = (type) => {
      const name = (type.aliasSymbol ?? type.getSymbol())?.getName();
      if (name && BAD.test(name)) return false;
      if (type.getCallSignatures().length || type.getConstructSignatures().length) return false;
      if (type.isUnion()) return type.types.some(top);
      return true;
    };
    const kept = new Map(props.filter((p) => top(checker.getNonNullableType(checker.getTypeOfSymbol(p)))).map((p) => [p.getName(), p]));
    el.props = el.props.filter((p) => kept.has(p.name));
    // Each property's type, resolved and written with fully qualified imports, so the generator reads plain types and
    // never parses the element's class
    for (const p of el.props) {
      const flags = ts.TypeFormatFlags.UseFullyQualifiedType | ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias;
      p.tsType = qualify(checker.typeToString(checker.getNonNullableType(checker.getTypeOfSymbol(kept.get(p.name))), alias, flags));
    }
  }
  writeProps();
}
// The generator runs without lib.dom: DOM types are small stubs, so it never expands Element or Promise whole, and a
// field typed with one is easy to find and drop
writeFileSync(join(TMP, "dom-stubs.d.ts"), `${DOM_STUBS.map((n) => `interface ${n} { readonly __dom_${n}: never }`).join("\n")}\n`);
writeFileSync(
  join(TMP, "tsconfig.json"),
  JSON.stringify({ compilerOptions: { target: "ES2022", module: "ESNext", moduleResolution: "Bundler", lib: ["ES2022"], types: [], strict: true, skipLibCheck: true, noEmit: true }, files: ["props.ts", "dom-stubs.d.ts"] }),
);
const generator = createGenerator({ path: join(TMP, "props.ts"), tsconfig: join(TMP, "tsconfig.json"), skipTypeCheck: true, expose: "export", topRef: false, jsDoc: "extended", functions: "hide", additionalProperties: false });

/** DOM and runtime types that show up nested in a property – a property that reaches one isn't JSON */
const DOMISH = /^(Element|HTMLElement|Node|EventTarget|File|Blob|AbortSignal|Promise|Map|Set|CSSStyleDeclaration|Document|Window)(<|$)/;
const schemas = new Map();
const dropped = [];
for (const el of elements.filter((e) => e.props.length)) {
  let schema;
  try {
    schema = generator.createSchema(typeName(el));
  } catch {
    // The generator fails on a few type shapes: build the schema a property at a time, keeping the ones it can read
    schema = { type: "object", properties: {}, additionalProperties: false, definitions: {} };
    for (const p of el.props) {
      try {
        const one = generator.createSchema(`${typeName(el)}__${p.name}`);
        const { definitions, $schema: _, ...rest } = one;
        schema.properties[p.name] = { ...rest, ...(p.description ? { description: p.description } : {}) };
        Object.assign(schema.definitions, definitions);
      } catch {
        dropped.push(`${el.tag}.${p.name}`);
      }
    }
  }
  // Drop properties that lead to DOM types, however deep
  const defs = schema.definitions ?? {};
  const reaches = (node, seen = new Set()) => {
    if (!node || typeof node !== "object") return false;
    if (node.$ref) {
      const name = decodeURIComponent(node.$ref.replace("#/definitions/", ""));
      if (DOMISH.test(name)) return true;
      if (seen.has(name)) return false;
      return reaches(defs[name], new Set([...seen, name]));
    }
    return Object.values(node).some((v) => reaches(v, seen));
  };
  // Drop each field – at any depth – whose schema leads to a DOM type, and the property itself only when it does
  const prune = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.properties) {
      for (const [k, v] of Object.entries(node.properties)) {
        if (reaches(v)) {
          delete node.properties[k];
          if (Array.isArray(node.required)) node.required = node.required.filter((r) => r !== k);
        }
      }
      if (Array.isArray(node.required) && !node.required.length) delete node.required;
    }
    for (const v of Object.values(node)) if (v && typeof v === "object") prune(v);
  };
  for (const def of Object.values(defs)) prune(def);
  prune(schema);
  // Keep only the definitions still in use
  const used = new Set();
  const collect = (node) => {
    if (!node || typeof node !== "object") return;
    if (node.$ref) {
      const name = decodeURIComponent(node.$ref.replace("#/definitions/", ""));
      if (!used.has(name)) {
        used.add(name);
        collect(defs[name]);
      }
    }
    Object.values(node).forEach(collect);
  };
  collect(schema.properties);
  schema.definitions = Object.fromEntries(Object.entries(defs).filter(([k]) => used.has(k)));
  if (!Object.keys(schema.definitions).length) delete schema.definitions;
  if (!Object.keys(schema.properties ?? {}).length) continue;
  delete schema.$schema;
  schemas.set(el.tag, {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: `trenchcoat/generative/schemas/${el.tag}.json`,
    title: el.tag,
    description: el.description,
    ...schema,
  });
}

const generatable = elements.filter((el) => schemas.has(el.tag));
const files = new Map();
for (const [tag, schema] of schemas) files.set(`schemas/${tag}.json`, `${JSON.stringify(schema, null, 2)}\n`);
const oneLine = (d) => d.split("\n")[0].replace(/\s+/g, " ").trim();
files.set(
  "catalog.json",
  `${JSON.stringify(
    generatable.map((el) => ({ tag: el.tag, name: el.name, description: oneLine(el.description), events: el.events })),
    null,
    2,
  )}\n`,
);
files.set(
  "registry.ts",
  `// Generated by scripts/gen-schemas.mjs – each generatable tag's events, and its module and schema, loaded when an\n// answer first uses it.
export const registry: Record<string, { events: string[]; load: () => Promise<unknown>; schema: () => Promise<{ default: object }> }> = {
${generatable.map((el) => `  "${el.tag}": { events: ${JSON.stringify(el.events)}, load: () => import("../elements/${el.slug}"), schema: () => import("./schemas/${el.tag}.json") },`).join("\n")}
};
`,
);

let stale = 0;
for (const [file, text] of files) {
  const path = join(OUT, file);
  if (existsSync(path) && readFileSync(path, "utf8") === text) continue;
  if (check) {
    console.error(`${path} is out of date – run node scripts/gen-schemas.mjs`);
    stale++;
  } else {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, text);
  }
}
const dir = join(OUT, "schemas");
for (const file of existsSync(dir) ? readdirSync(dir) : []) {
  if (files.has(`schemas/${file}`)) continue;
  if (check) {
    console.error(`${join(dir, file)} has no generatable element – run node scripts/gen-schemas.mjs`);
    stale++;
  } else rmSync(join(dir, file));
}
if (!check) {
  const size = [...files.values()].reduce((n, t) => n + t.length, 0);
  console.log(`schemas: ${generatable.length} generatable elements (${DENY.size} kept app-controlled), ${Math.round(size / 1024)} KB${dropped.length ? `; skipped: ${dropped.join("; ")}` : ""}`);
}
process.exit(stale ? 1 : 0);
