// Writes the Angular wrappers in src/angular/ from custom-elements.json, so Angular apps use the elements with typed
// bindings and no CUSTOM_ELEMENTS_SCHEMA (remediation Phase 2):
//   · src/angular/<slug>.ts – a standalone directive per element, selected by its tag. Each public property is an
//     @Input that sets the element's property; each event is an @Output, named after the event, that types $event.
//     The outputs never emit: the element dispatches the DOM event and Angular listens to it as usual – an output
//     that re-emitted would run the handler twice, since Angular also attaches the DOM listener on elements
//   · src/angular/index.ts – every directive, and TRENCHCOAT, the whole set for an imports array
//   · src/angular/forms.ts – a ControlValueAccessor per element with a `value` and tc-value-change, for ngModel,
//     formControl and formControlName (a separate entry, so @angular/forms stays optional)
// Built by ngc in partial compilation mode (tsconfig.angular.json) into dist/angular. `--check` fails when a file is
// out of date (CI).
//   node scripts/gen-angular.mjs [--check]
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "src/angular";
const check = process.argv.includes("--check");

execSync("npx cem analyze --config custom-elements-manifest.config.mjs", { stdio: "ignore" });
const manifest = JSON.parse(readFileSync("custom-elements.json", "utf8"));

const camel = (s) => s.replace(/-([a-z\d])/g, (_, c) => c.toUpperCase());
/** An event's output name: tc-value-change → tcValueChange. Only lower-case words joined by single hyphens map to a
 *  name Angular can bind both ways; anything else stops the script rather than writing a wrapper that can't work */
const outputName = (tag, event) => {
  if (!/^[a-z][a-z\d]*(-[a-z\d]+)*$/.test(event)) throw new Error(`${tag}: event "${event}" isn't lower-case words joined by hyphens – Angular can't bind it as an output; rename the event`);
  return camel(event);
};
/** A property name that's a valid identifier as it stands */
const ident = (s) => /^[A-Za-z_$][\w$]*$/.test(s);

/** The names a module exports as types – event detail types are imported when the module exports them */
const exportedTypes = (path) => {
  const src = readFileSync(path, "utf8");
  return new Set([...src.matchAll(/^export (?:type|interface|class) (\w+)/gm)].map((m) => m[1]));
};

const BUILTIN = new Set(["string", "number", "boolean", "null", "undefined", "unknown", "Date", "File", "Blob", "AbortSignal", "Element", "HTMLElement", "Record", "Promise"]);
const fieldOf = (decl, name) => decl.members?.find((f) => f.kind === "field" && f.name === name && !f.static && !f.privacy);

/** A type written in a description, when every name in it is known: a builtin, a string literal or an exported type */
function knownType(text, types) {
  const t = text.trim();
  if (!t || !/^[\w\s|&<>[\]"'.,:{}()-]+$/.test(t)) return null;
  const names = [...t.replace(/"[^"]*"|'[^']*'/g, "").matchAll(/[A-Za-z_]\w*/g)].map((m) => m[0]);
  return names.every((n) => BUILTIN.has(n) || types.has(n)) ? { type: t, imports: names.filter((n) => types.has(n)) } : null;
}

/** The first { … } in a description as a type: each key typed as written, else as the element's property of that
 *  name, else unknown */
function inlineObject(desc, decl, types, cls) {
  const start = desc.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < desc.length; i++) {
    if (desc[i] === "{") depth++;
    else if (desc[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const body = desc.slice(start + 1, end).trim();
  if (!body) return { type: "Record<string, never>", imports: [] };
  const parts = [];
  let buf = "";
  depth = 0;
  for (const ch of body) {
    if ("{[<(".includes(ch)) depth++;
    if ("}]>)".includes(ch)) depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else buf += ch;
  }
  parts.push(buf);
  const imports = [];
  const keys = [];
  for (const part of parts) {
    const m = /^\s*(\w+)(\??)\s*(?::\s*(.+))?$/s.exec(part);
    if (!m) return null;
    const [, key, opt, written] = m;
    const known = written ? knownType(written, types) : null;
    if (known) {
      imports.push(...known.imports);
      keys.push(`${key}${opt}: ${known.type}`);
    } else if (fieldOf(decl, key)) keys.push(`${key}${opt}: ${cls}["${key}"]`);
    else keys.push(`${key}${opt}: unknown`);
  }
  return { type: `{ ${keys.join("; ")} }`, imports };
}

/** An event's detail type, from its description: a type the module exports, named anywhere in it ("({ open }:
 *  OpenChange)", "detail is the DocComment"); else the first inline { … }; "detail null" is null; else, for
 *  tc-x-change, { x } typed as the element's property x; else unknown */
function detailType(event, decl, types, cls) {
  const desc = event.description ?? "";
  // A type named outside any { … } is the detail's own; one inside is a field's ("{ steps: AgentPlanStep[] }")
  const outside = desc.replace(/\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, " ");
  const named = [...outside.matchAll(/\b([A-Z]\w+)\b/g)].map((m) => m[1]).find((t) => types.has(t) && t !== cls);
  if (named) return { type: named, imports: [named] };
  const empty = /detail[`\s:]+(null|undefined)\b/i.exec(desc);
  if (empty) return { type: empty[1], imports: [] };
  const inline = inlineObject(desc, decl, types, cls);
  if (inline) return inline;
  const m = /^tc-(.+)-change$/.exec(event.name);
  const field = m && camel(m[1]);
  if (field && fieldOf(decl, field)) return { type: `{ ${field}: ${cls}["${field}"] }`, imports: [] };
  return { type: "unknown", imports: [] };
}

const elements = [];
for (const mod of manifest.modules) {
  // The look provider is the one public element that lives in internal/; it's published as trenchcoat/look-provider
  const provider = mod.path === "src/elements/internal/look.ts";
  // iCloud copies ("generated-ui 2.ts") aren't elements of their own
  if (/ \d+\.ts$/.test(mod.path)) continue;
  if (!mod.path.startsWith("src/elements/") || (mod.path.includes("/internal/") && !provider) || mod.path.includes("/react/")) continue;
  for (const decl of mod.declarations ?? []) {
    if (!decl.tagName || !decl.customElement) continue;
    const slug = provider ? "look-provider" : mod.path.slice("src/elements/".length, -3);
    const cls = decl.name;
    const name = cls.replace(/^Tc/, "");
    const types = exportedTypes(mod.path);
    const seen = new Set();
    const inputs = (decl.members ?? [])
      .filter((f) => f.kind === "field" && !f.static && !f.privacy && !f.readonly && ident(f.name) && !f.name.startsWith("_"))
      .filter((f) => !seen.has(f.name) && seen.add(f.name));
    const imports = new Set([cls]);
    const outputs = (decl.events ?? [])
      .filter((e) => e.name)
      .map((e) => {
        const d = detailType(e, decl, types, cls);
        d.imports.forEach((t) => imports.add(t));
        return { event: e.name, prop: outputName(decl.tagName, e.name), type: d.type, description: e.description };
      });
    const clash = outputs.find((o, i) => outputs.findIndex((p) => p.prop === o.prop) !== i || inputs.some((f) => f.name === o.prop));
    if (clash) throw new Error(`${decl.tagName}: output ${clash.prop} (${clash.event}) clashes with another output or an input`);
    const value = inputs.some((f) => f.name === "value") && outputs.some((o) => o.event === "tc-value-change");
    const disabled = inputs.some((f) => f.name === "disabled");
    elements.push({ slug, tag: decl.tagName, cls, name, description: decl.description ?? decl.summary ?? "", inputs, outputs, imports: [...imports], value, disabled });
  }
}
elements.sort((a, b) => a.slug.localeCompare(b.slug));

const doc = (text, indent = "  ") => {
  const t = (text ?? "").replace(/\*\//g, "*\\/").trim();
  if (!t) return "";
  const lines = t.split("\n").map((l) => l.trim());
  return lines.length === 1 ? `${indent}/** ${lines[0]} */\n` : `${indent}/**\n${lines.map((l) => `${indent} * ${l}`).join("\n")}\n${indent} */\n`;
};

/** The parts of a property's type, when it's a plain union */
const parts = (text) => (text ?? "").split("|").map((p) => p.trim());
const only = (text, allowed) => !!text && parts(text).every((p) => allowed.includes(p));

/** An input. Plain attributes reach an input as strings – <tc-checkbox required>, <tc-ring value="0.6"> – so a
 *  boolean also takes "" / "true" / "false", and a number a numeric string; both are converted before they're set */
function input(el, f) {
  const t = `${el.cls}["${f.name}"]`;
  if (only(f.type?.text, ["boolean", "undefined"]))
    return `  @Input() set ${f.name}(v: ${t} | "" | "true" | "false") {\n    this.#el.${f.name} = typeof v === "string" ? v !== "false" : v;\n  }\n`;
  if (only(f.type?.text, ["number", "undefined", "null"]) && parts(f.type.text).includes("number"))
    return `  @Input() set ${f.name}(v: ${t} | \`\${number}\`) {\n    this.#el.${f.name} = typeof v === "string" ? Number(v) : v;\n  }\n`;
  return `  @Input() set ${f.name}(v: ${t}) {\n    this.#el.${f.name} = v;\n  }\n`;
}

const header = "// Generated by scripts/gen-angular.mjs from the elements' JSDoc – edit the element, then run the script.\n";
const files = new Map();
const bySlug = new Map();
for (const el of elements) bySlug.set(el.slug, [...(bySlug.get(el.slug) ?? []), el]);
const directive = (el) => {
  const ins = el.inputs.map((f) => `${doc(f.description)}${input(el, f)}`).join("");
  const outs = el.outputs
    .map((o) => `${doc(`${o.description ?? o.event}\nTypes $event; the element dispatches the event itself.`)}  @Output("${o.event}") readonly ${o.prop} = new EventEmitter<CustomEvent<${o.type}>>();\n`)
    .join("");
  return `${doc(`<${el.tag}> for Angular: ${el.description.split("\n")[0]}\n\nimports: [${el.name}] in a standalone component – no CUSTOM_ELEMENTS_SCHEMA, and bindings are type-checked.`, "")}@Directive({ selector: "${el.tag}", standalone: true, exportAs: "${camel(el.tag)}" })
export class ${el.name} {
  readonly #el: ${el.cls} = inject(ElementRef).nativeElement;
  /** The element itself, for its methods */
  get element(): ${el.cls} {
    return this.#el;
  }
${ins}${outs}}
`;
};
for (const [slug, els] of bySlug) {
  const any = (k) => els.some((el) => el[k].length);
  const imports = [...new Set(els.flatMap((el) => el.imports))];
  files.set(
    `${slug}.ts`,
    `${header}import { Directive, ElementRef, ${any("outputs") ? "EventEmitter, " : ""}${any("inputs") ? "Input, " : ""}${any("outputs") ? "Output, " : ""}inject } from "@angular/core";
import type { ${imports.join(", ")} } from "trenchcoat/${slug}";
import "trenchcoat/${slug}";

${els.map(directive).join("\n")}`,
  );
}

files.set(
  "index.ts",
  `${header}// Every element's directive: import { Button, Combobox } from "trenchcoat/angular", or TRENCHCOAT for all of them.
${[...bySlug].map(([slug, els]) => `import { ${els.map((el) => el.name).join(", ")} } from "./${slug}.js";`).join("\n")}

export { ${elements.map((el) => el.name).join(", ")} };

/** Every directive, for a standalone component's imports */
export const TRENCHCOAT = [${elements.map((el) => el.name).join(", ")}] as const;
`,
);

const forms = elements.filter((el) => el.value);
files.set(
  "forms.ts",
  `${header}// ngModel, formControl and formControlName for the elements that hold a value: import { CheckboxValueAccessor } from
// "trenchcoat/angular/forms", or TRENCHCOAT_FORMS for all of them, next to FormsModule or ReactiveFormsModule.
// The element keeps its own state; the accessor writes the form's value into it and reports tc-value-change back –
// once the event has finished, so a change the page cancels (preventDefault) never reaches the form.
import { Directive, ElementRef, forwardRef, inject, isDevMode } from "@angular/core";
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from "@angular/forms";
${forms.map((el) => `import type { ${el.cls} } from "trenchcoat/${el.slug}";`).join("\n")}

/** What every accessor shares: the element's value in, tc-value-change and focus-out back */
abstract class ValueAccessor<E extends HTMLElement & { value: unknown }> implements ControlValueAccessor {
  protected readonly el: E = inject(ElementRef).nativeElement;
  #change: (value: E["value"]) => void = () => {};
  #touched: () => void = () => {};
  constructor() {
    // This listener runs before the template's (tc-value-change) handler, so wait for the dispatch to finish before
    // reading defaultPrevented – a microtask runs after it, and before the next event
    this.el.addEventListener("tc-value-change", (e) => {
      queueMicrotask(() => {
        if (!e.defaultPrevented) this.#change((e as CustomEvent<{ value: E["value"] }>).detail.value);
      });
    });
    this.el.addEventListener("focusout", () => this.#touched());
  }
  /** null and undefined – a new or reset control – become the element's own empty value ("", [], false …), read from a
   *  fresh element of the same tag, since many elements expect an array or a string */
  writeValue(value: E["value"] | null | undefined) {
    this.el.value = value ?? (document.createElement(this.el.localName) as E).value;
  }
  registerOnChange(fn: (value: E["value"]) => void) {
    this.#change = fn;
  }
  registerOnTouched(fn: () => void) {
    this.#touched = fn;
  }
  setDisabledState(disabled: boolean) {
    if ("disabled" in this.el) (this.el as { disabled: boolean }).disabled = disabled;
    else if (disabled && isDevMode()) console.warn("<" + this.el.localName + "> has no disabled state – the control is disabled, but the element stays editable");
  }
}

${forms
  .map(
    (el) => `/** ngModel, formControl and formControlName on <${el.tag}> */
@Directive({
  selector: "${el.tag}[ngModel], ${el.tag}[formControl], ${el.tag}[formControlName]",
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ${el.name}ValueAccessor), multi: true }],
})
export class ${el.name}ValueAccessor extends ValueAccessor<${el.cls}> {}
`,
  )
  .join("\n")}
/** Every value accessor, for a standalone component's imports */
export const TRENCHCOAT_FORMS = [${forms.map((el) => `${el.name}ValueAccessor`).join(", ")}] as const;
`,
);

let stale = 0;
if (!check) mkdirSync(OUT, { recursive: true });
for (const [file, text] of files) {
  const path = join(OUT, file);
  if (existsSync(path) && readFileSync(path, "utf8") === text) continue;
  if (check) {
    console.error(`${path} is out of date – run node scripts/gen-angular.mjs`);
    stale++;
  } else writeFileSync(path, text);
}
// Wrappers for elements that went away
for (const file of existsSync(OUT) ? readdirSync(OUT) : []) {
  if (files.has(file)) continue;
  if (check) {
    console.error(`${join(OUT, file)} has no element – run node scripts/gen-angular.mjs`);
    stale++;
  } else rmSync(join(OUT, file));
}
// An unknown detail types $event as CustomEvent<unknown> – strict templates then need casts. Name the type in the
// event's @fires line: "(detail: MyChange)", "{ value, item }", or "detail: null"
const untyped = elements.flatMap((el) => el.outputs.filter((o) => o.type === "unknown").map((o) => `${el.tag} ${o.event}`));
for (const u of untyped) console.error(`${u}: no detail type in its @fires line – name the type, write { … }, or "detail: null"`);
if (!check) console.log(`angular: ${elements.length} directives, ${forms.length} value accessors`);
process.exit(stale || untyped.length ? 1 : 0);
