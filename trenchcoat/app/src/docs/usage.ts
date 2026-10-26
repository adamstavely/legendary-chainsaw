// Usage snippets for a docs page, per framework. HTML and React come from the guidance file's Example (hand-written,
// the React one type-checked); Vue, Angular and Svelte are generated from the element's API, in the binding syntax the
// examples/ apps use and test.

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
  cssProperties: { name: string; value: string; looks: string[] }[];
  tokens: string[];
};
export type ApiReact = { component: string; exported: boolean; props: { name: string; type: string; optional: boolean; description: string }[]; hides: string[] };
export type ApiFunction = { name: string; signature: string; description: string };
export type ApiPage = { elements: ApiElement[]; functions?: ApiFunction[]; react: ApiReact[]; changelog: string[]; size?: { min: number; gzip: number } };

export type Framework = "html" | "react" | "vue" | "angular" | "svelte";

const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
const handler = (event: string) => camel(`on-${event.replace(/^tc-/, "")}`);

/** The properties worth showing in a generated snippet: data an app passes in (no attribute), then the rest */
function featured(el: ApiElement) {
  const data = el.properties.filter((p) => !p.attribute && !/^on[A-Z]/.test(p.name) && p.name !== "look").slice(0, 2);
  return data;
}

export function snippets(slug: string, el: ApiElement, examples: { html?: string; tsx?: string }, react?: ApiReact): Record<Framework, string> {
  const data = featured(el);
  const event = el.events[0];
  const imports = `import "trenchcoat/${slug}";\nimport "trenchcoat/tokens.css";`;
  const html =
    examples.html ??
    `<${el.tag} id="${slug}"></${el.tag}>\n\n<script type="module">\n  ${imports.replace(/\n/g, "\n  ")}\n\n  const el = document.querySelector("#${slug}");\n${data.map((p) => `  el.${p.name} = /* ${p.type} */;\n`).join("")}${event ? `  el.addEventListener("${event.name}", (e) => console.log(e.detail));\n` : ""}</script>`;
  const reactName = react?.component ?? el.className.replace(/^Tc/, "");
  const tsx =
    examples.tsx ??
    `import { ${reactName} } from "trenchcoat/react";\nimport "trenchcoat/tokens.css";\n\nexport function Example() {\n  return <${reactName}${data.map((p) => ` ${p.name}={/* ${p.type} */}`).join("")} />;\n}`;
  const vue = `<script setup lang="ts">\n${imports}\n${data.map((p) => `const ${p.name} = /* ${p.type} */;\n`).join("")}${event ? `const ${handler(event.name)} = (e: CustomEvent) => {\n  // ${event.description || event.name}\n};\n` : ""}</script>\n\n<template>\n  <${el.tag}${data.map((p) => ` :${p.name}="${p.name}"`).join("")}${event ? ` @${event.name}="${handler(event.name)}"` : ""}></${el.tag}>\n</template>`;
  const angular = `import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";\n${imports}\n\n@Component({\n  selector: "app-example",\n  schemas: [CUSTOM_ELEMENTS_SCHEMA],\n  template: \`<${el.tag}${data.map((p) => ` [${p.name}]="${p.name}"`).join("")}${event ? ` (${event.name})="${handler(event.name)}($event)"` : ""}></${el.tag}>\`,\n})\nexport class Example {\n${data.map((p) => `  ${p.name} = /* ${p.type} */;\n`).join("")}${event ? `  ${handler(event.name)}(e: Event) {\n    // ${event.description || event.name}\n  }\n` : ""}}`;
  const svelte = `<script lang="ts">\n  ${imports.replace(/\n/g, "\n  ")}\n${data.map((p) => `  const ${p.name} = /* ${p.type} */;\n`).join("")}${event ? `  let el: HTMLElement;\n  $effect(() => {\n    const on = (e: Event) => { /* ${event.description || event.name} */ };\n    el.addEventListener("${event.name}", on);\n    return () => el.removeEventListener("${event.name}", on);\n  });\n` : ""}</script>\n\n<${el.tag}${event ? " bind:this={el}" : ""}${data.map((p) => ` {${p.name}}`).join("")}></${el.tag}>`;
  return { html, react: tsx, vue, angular, svelte };
}
