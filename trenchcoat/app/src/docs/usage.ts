// Usage snippets and the Frameworks section of a docs page, per framework (remediation 6.5). HTML and React quick
// starts come from the guidance file's Example when it has them (hand-written; the React one type-checked by
// check:docs); everything else is generated here from the page's API and its framework facts
// (scripts/docs-data.mjs), in the binding syntax the examples/ apps use. scripts/check-snippets.mjs compiles the
// generated snippets of a sample of pages in each framework's examples/ app, so they can't rot.

export type ApiProperty = { name: string; attribute: string | null; type: string; default: string | null; description: string; readonly: boolean };
export type ApiEvent = { name: string; detail: string; description: string; cancelable: boolean };
export type ApiElement = {
  tag: string;
  className: string;
  description: string;
  ui: string;
  properties: ApiProperty[];
  events: ApiEvent[];
  slots: { name: string; description: string }[];
  methods: { name: string; params: string; returns: string; description: string }[];
  /** fallback: read only through var(--tc-x, fallback), never declared – the value is the fallback */
  cssProperties: { name: string; value: string; looks: string[]; fallback?: boolean }[];
  tokens: string[];
};
export type ApiReact = {
  component: string;
  exported: boolean;
  props: { name: string; type: string; optional: boolean; description: string }[];
  hides: string[];
  /** Each event's prop on the wrapper – null when the wrapper doesn't offer it */
  events?: Record<string, string | null>;
};
export type ApiFunction = { name: string; signature: string; description: string };
export type FrameworkFacts = {
  tag: string;
  className: string;
  module: string;
  data: string[];
  attributes: { name: string; attribute: string }[];
  events: { name: string; cancelable: boolean }[];
  controlled: { property: string; event: string }[];
  form: { property: string; event: string; formAssociated: boolean } | null;
  slots: string[];
};
export type Browser = "chrome" | "edge" | "firefox" | "safari" | "safari_ios";
export type BrowserFeature = { id: string; name: string; bcd: string; versions: Record<Browser, string | null>; progressive: boolean; without?: string; why?: string; note?: string; via: string[] };
export type BrowserSupport = { floor: Record<Browser, string | null>; setBy: Record<Browser, string[]>; features: BrowserFeature[] };
export type Runtime = {
  timers: string[];
  frames: string[];
  animations: number;
  observers: string[];
  clock: string[];
  listeners: string[];
  pauses: { offscreen: string[]; hidden: string[]; reducedMotion: string[] };
  windowed: boolean;
};
export type ApiPage = {
  elements: ApiElement[];
  functions?: ApiFunction[];
  react: ApiReact[];
  changelog: string[];
  size?: { min: number; gzip: number };
  frameworks?: FrameworkFacts[];
  browser?: BrowserSupport;
  runtime?: Runtime;
};

export type Framework = "html" | "react" | "vue" | "angular" | "svelte";

/** The element's Angular directive in trenchcoat/angular: its class name without "Tc" (TcCombobox → Combobox) */
export const angularName = (f: { className: string }) => f.className.replace(/^Tc/, "");
/** [key, tab label, long label, code language] – HTML first: it's the one every other framework builds on */
export const FRAMEWORKS: [Framework, string, string, string][] = [
  ["html", "HTML", "HTML", "html"],
  ["react", "React", "React / Next.js", "tsx"],
  ["vue", "Vue", "Vue / Nuxt", "vue"],
  ["angular", "Angular", "Angular", "ts"],
  ["svelte", "Svelte", "Svelte", "svelte"],
];

const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const pascal = (s: string) => camel(s).replace(/^\w/, (c) => c.toUpperCase());
/** tc-value-change → onValueChange, the handler's name in generated code */
const handler = (event: string) => camel(`on-${event.replace(/^tc-/, "")}`);
const typeOf = (f: FrameworkFacts, prop: string) => `${f.className}["${prop}"]`;

/** The data properties a quick start passes: the first two an app passes in from script */
const featured = (f: FrameworkFacts) => f.data.filter((p) => !/^on[A-Z]/.test(p)).slice(0, 2);

/** The React prop a wrapper listens to an event with: its own callback (onChange, onOpenChange) or the raw onTc… prop,
 *  from gen-docs' reading of the wrapper; null when the wrapper doesn't offer it (listen on a ref instead) */
export function reactEvent(event: string, react?: ApiReact): { prop: string; alias: boolean } | null {
  const prop = react?.events?.[event];
  return prop ? { prop, alias: !prop.startsWith("onTc") } : null;
}

/** The props a React quick start passes: the wrapper's required props, and the featured data it takes */
function reactProps(f: FrameworkFacts, react?: ApiReact) {
  const own = new Set(react?.props.map((p) => p.name) ?? []);
  const required = react?.props.filter((p) => !p.optional).map((p) => p.name) ?? [];
  return [...new Set([...required, ...featured(f).filter((p) => !react?.hides.includes(p) || own.has(p))])];
}

export type Snippets = Record<Framework, string>;

/** The quick start for each framework – the Usage tabs */
export function snippets(slug: string, el: ApiElement, examples: { html?: string; tsx?: string }, react?: ApiReact, facts?: FrameworkFacts): Snippets {
  const f = facts ?? factsOf(slug, el);
  const g = generated(slug, f, react, el);
  return { ...g, html: examples.html ?? g.html, react: examples.tsx ?? g.react };
}

/** Facts for pages generated before 6.5 (no frameworks key) – the same rules as docs-data.mjs, minus the source */
function factsOf(slug: string, el: ApiElement): FrameworkFacts {
  return {
    tag: el.tag,
    className: el.className,
    module: `trenchcoat/${slug}`,
    data: el.properties.filter((p) => !p.attribute && !p.readonly && p.name !== "look").map((p) => p.name),
    attributes: el.properties.filter((p) => p.attribute && p.name !== "look").map((p) => ({ name: p.name, attribute: p.attribute! })),
    events: el.events.map((e) => ({ name: e.name, cancelable: e.cancelable })),
    controlled: [],
    form: null,
    slots: el.slots.map((s) => s.name),
  };
}

/** Generated quick starts – every one compiles (check:snippets) */
export function generated(slug: string, f: FrameworkFacts, react?: ApiReact, el?: ApiElement): Snippets {
  const typeText = (p: string) => el?.properties.find((x) => x.name === p)?.type ?? typeOf(f, p);
  const data = featured(f);
  const event = f.events[0]?.name;
  const typeImport = `import type { ${f.className} } from "${f.module}";`;
  const name = pascal(slug);

  const html = `<${f.tag} id="${slug}"></${f.tag}>

<script type="module">
  import "${f.module}";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#${slug}");
${data.map((p) => `  el.${p} = ${p}; // ${typeText(p)}, from your app\n`).join("")}${event ? `  el.addEventListener("${event}", (e) => console.log(e.detail));\n` : ""}</script>`;

  const component = react?.component ?? name;
  const ev = f.events.map((e) => reactEvent(e.name, react)).find(Boolean) ?? null;
  const rp = reactProps(f, react);
  const tsx = `import type { ComponentProps } from "react";
import { ${component} } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ${name}Example(${rp.length ? `{ ${rp.join(", ")} }: Pick<ComponentProps<typeof ${component}>, ${rp.map((p) => `"${p}"`).join(" | ")}>` : ""}) {
  return <${component}${rp.map((p) => ` ${p}={${p}}`).join("")}${ev ? ` ${ev.prop}={(${ev.alias ? "...args" : "e"}) => console.log(${ev.alias ? "args" : "e.detail"})}` : ""} />;
}`;

  const props = data.length ? `defineProps<{ ${data.map((p) => `${p}: ${typeOf(f, p)}`).join("; ")} }>();\n` : "";
  const vue = `<script setup lang="ts">
import "${f.module}";
import "trenchcoat/tokens.css";
${data.length ? `${typeImport}\n\n${props}` : "\n"}${event ? `const ${handler(event)} = (e: CustomEvent) => console.log(e.detail);\n` : ""}</script>

<template>
  <${f.tag}${data.map((p) => ` :${p}="${p}"`).join("")}${event ? ` @${event}="${handler(event)}"` : ""}></${f.tag}>
</template>`;

  const directive = angularName(f);
  const angular = `import { Component${data.length ? ", input" : ""} } from "@angular/core";
import { ${directive} } from "trenchcoat/angular";
${data.length ? `${typeImport}\n` : ""}
@Component({
  selector: "app-${slug}-example",
  imports: [${directive}],
  template: \`<${f.tag}${data.map((p) => ` [${p}]="${p}()"`).join("")}${event ? ` (${event})="${handler(event)}($event)"` : ""}></${f.tag}>\`,
})
export class ${name}Example {
${data.map((p) => `  readonly ${p} = input.required<${typeOf(f, p)}>();\n`).join("")}${event ? `  ${handler(event)}(e: CustomEvent) {\n    console.log(e.detail);\n  }\n` : ""}}`;

  const svelte = `<script lang="ts">
  import "${f.module}";
  import "trenchcoat/tokens.css";
  ${typeImport}

${data.length ? `  let { ${data.join(", ")} }: { ${data.map((p) => `${p}: ${typeOf(f, p)}`).join("; ")} } = $props();\n` : ""}  let el: ${f.className};
${event ? `  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("${event}", on);
    return () => el.removeEventListener("${event}", on);
  });\n` : ""}</script>

<${f.tag} bind:this={el}${data.map((p) => ` {${p}}`).join("")}></${f.tag}>`;

  return { html, react: tsx, vue, angular, svelte };
}

/** The controlled pattern – the app decides every change – for the page's first controlled property, per framework.
 *  Every one compiles (check:snippets). */
export function controlledSnippets(slug: string, f: FrameworkFacts, react?: ApiReact): (Omit<Snippets, "react"> & { react: string | null }) | null {
  const pair = f.controlled.find((c) => c.property === "value") ?? f.controlled[0];
  if (!pair) return null;
  const { property: p, event } = pair;
  const name = pascal(slug);
  const t = typeOf(f, p);
  const detail = `CustomEvent<{ ${p}: ${t} }>`;
  const on = handler(event);
  const typeImport = `import type { ${f.className} } from "${f.module}";`;

  const html = `<${f.tag} id="${slug}"></${f.tag}>

<script type="module">
  import "${f.module}";

  const el = document.querySelector("#${slug}");
  el.addEventListener("${event}", (e) => {
    e.preventDefault(); // the element keeps its ${p}…
    if (allowed(e.detail.${p})) el.${p} = e.detail.${p}; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>`;

  const component = react?.component ?? name;
  const ev = reactEvent(event, react);
  // Only where the wrapper offers both the property and its change, and a callback of its own hands over the new value
  // first (onChange?: (value: string[], …) – compared with the property's own type on the wrapper)
  const own = new Map(react?.props.map((x) => [x.name, x.type.replace(/\s*\|\s*undefined$/, "")]) ?? []);
  const firstParam = ev?.alias ? own.get(ev.prop)?.match(/^\(\s*\w+\??\s*:\s*([^,)]+?)\s*[,)]/)?.[1] : null;
  const offered = ev && (ev.alias ? own.has(p) && firstParam === own.get(p) : !react?.hides.includes(p) || own.has(p));
  const tsx = offered
    ? `import { useState, type ComponentProps } from "react";
import { ${component} } from "trenchcoat/react";

type Own = ComponentProps<typeof ${component}>;
type Props = Omit<Own, "${p}" | "${ev.prop}"> & { initial: NonNullable<Own["${p}"]> };

// Controlled: passing ${p} makes the wrapper prevent the element's own change; the app sets it
export function Controlled${name}({ initial, ...props }: Props) {
  const [${p}, set${pascal(p)}] = useState<Own["${p}"]>(initial);
  return <${component} {...props} ${p}={${p}} ${ev.prop}={${ev.alias ? `(next) => set${pascal(p)}(next)` : `(e) => {\n    e.preventDefault();\n    set${pascal(p)}(e.detail.${p});\n  }`}} />;
}`
    : null;

  const vue = `<script setup lang="ts">
import { shallowRef } from "vue";
import "${f.module}";
${typeImport}

const props = defineProps<{ initial: ${t} }>();
const ${p} = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const ${on} = (e: ${detail}) => {
  e.preventDefault();
  ${p}.value = e.detail.${p};
};
</script>

<template>
  <${f.tag} :${p}="${p}" @${event}="${on}"></${f.tag}>
</template>`;

  const angular = `import { Component, input, linkedSignal } from "@angular/core";
import { ${angularName(f)} } from "trenchcoat/angular";
${typeImport}

@Component({
  selector: "app-controlled-${slug}",
  imports: [${angularName(f)}],
  template: \`<${f.tag} [${p}]="${p}()" (${event})="${on}($event)"></${f.tag}>\`,
})
export class Controlled${name} {
  readonly initial = input.required<${t}>();
  readonly ${p} = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  ${on}(e: ${detail}) {
    e.preventDefault();
    this.${p}.set(e.detail.${p});
  }
}`;

  const svelte = `<script lang="ts">
  import "${f.module}";
  ${typeImport}

  let { initial }: { initial: ${t} } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let ${p} = $derived(initial);
  let el: ${f.className};
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      ${p} = (e as ${detail}).detail.${p};
    };
    el.addEventListener("${event}", on);
    return () => el.removeEventListener("${event}", on);
  });
</script>

<${f.tag} bind:this={el} {${p}}></${f.tag}>`;

  return { html, react: tsx, vue, angular, svelte };
}

/** One line per binding, in a framework's syntax: a data property */
export function bindProperty(fw: Framework, f: FrameworkFacts, prop: string) {
  switch (fw) {
    case "html":
      return `el.${prop} = …;`;
    case "react":
      return `<… ${prop}={…} />`;
    case "vue":
      return `<${f.tag} :${prop}="…">`;
    case "angular":
      return `<${f.tag} [${prop}]="…">`;
    case "svelte":
      return `<${f.tag} {${prop}}>`;
  }
}

/** One line per binding, in a framework's syntax: an event */
export function bindEvent(fw: Framework, f: FrameworkFacts, event: string, react?: ApiReact) {
  switch (fw) {
    case "html":
      return `el.addEventListener("${event}", (e) => …)`;
    case "react": {
      const ev = reactEvent(event, react);
      return ev ? `${ev.prop}={…}` : `ref.current.addEventListener("${event}", …)`;
    }
    case "vue":
      return `@${event}="…"`;
    case "angular":
      return `(${event})="…($event)"`;
    case "svelte":
      return `el.addEventListener("${event}", …)`;
  }
}

/** Two-way binding of a form component's value, as each framework writes it */
export function twoWay(fw: Framework, f: FrameworkFacts, react?: ApiReact) {
  if (!f.form) return null;
  const v = f.form.property;
  const e = f.form.event;
  switch (fw) {
    case "html":
      return `el.addEventListener("${e}", (e) => (state.${v} = e.detail.${v}));\nel.${v} = state.${v};`;
    case "react": {
      const ev = reactEvent(e, react);
      return ev ? `const [${v}, set${pascal(v)}] = useState(…);\n<… ${v}={${v}} ${ev.prop}={${ev.alias ? `set${pascal(v)}` : `(e) => set${pascal(v)}(e.detail.${v})`}} />` : null;
    }
    case "vue":
      return `<${f.tag} :${v}="${v}" @${e}="${v} = $event.detail.${v}"></${f.tag}>`;
    case "angular":
      return `<${f.tag} [${v}]="${v}()" (${e})="${v}.set($any($event).detail.${v})"></${f.tag}>`;
    case "svelte":
      return `$effect(() => {\n  const on = (e) => (${v} = e.detail.${v});\n  el.addEventListener("${e}", on);\n  return () => el.removeEventListener("${e}", on);\n});\n<${f.tag} bind:this={el} {${v}}></${f.tag}>`;
  }
}
