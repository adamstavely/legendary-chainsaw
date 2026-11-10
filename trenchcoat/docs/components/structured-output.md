<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Structured Output

**AI & chat** · New

Streaming JSON as a typed tree, checked against its schema as it arrives – missing and invalid fields flagged, copy as JSON or code

- **Element:** `<tc-structured-output>`
- **Size:** 13.9 KB gzip · 43.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/structured-output";` |
| React / Next.js | `import { StructuredOutput } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/structured-output";` · tags starting with tc- are custom elements |
| Angular | `import { StructuredOutput } from "@adamstavely/trenchcoat/angular/structured-output";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/structured-output";` |

## Example

The live example is in the gallery at `#/structured-output`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

JSON a model writes, shown as a tree people can read while it streams in. The text can grow every frame and stop
anywhere – an open string, a half-written number, a field name still waiting for its value – and the tree shows what
has arrived so far, with a caret on the value being written. Give it a JSON Schema and it checks the value as it
arrives: a field that breaks the schema is tinted and says why on its row, and a required field that never came
shows as a ghost row once its object closes. The head sums it up – “Writing”, “Matches schema”, “3 issues”, “Not
valid JSON” – and copies the value as JSON or as a TypeScript literal.

### When to use

- Structured answers from a model – extraction, classification, tool arguments – that people should check before
  the app uses them.
- Showing why an answer failed validation, field by field, instead of a single “invalid response” error.
- Debugging and reviewing structured output in developer tools and evaluation screens.

### When not to use

- JSON as code people will read line by line or apply to a file – use [Code Block](code-block.md) with `language="json"`.
- A model's answer that should become real UI – tables, charts, forms – use [Generated UI](generated-ui.md).
- A tool call with its arguments, status and result in an agent's run – use [Tool Call Card](tool-call-card.md).
- Rows of records to sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Head** `.ui-so__head` – the heading, the status and the copy actions
2. **Status** `.ui-so__status` – Writing, Matches schema, Valid JSON, N issues, Incomplete or Not valid JSON
3. **Copy** `.ui-so__tools` – copy as JSON, copy as a TypeScript literal
4. **Field** `.ui-so__row` – one key and its value, coloured by type and indented by depth
5. **Issue** `.ui-so__issue` – why a field breaks the schema, under its row

## Looks

Standard sets the head on the gray tray and the tree on a white card below it. Clean is one white card with a
hairline under the head, thinner icons and thinner tree guides. Both use the same syntax colours (`--tc-syntax-*`),
so they match `code-block` in both themes. In both, objects and lists show their size in place of brackets
(“{ 3 fields }”, “[ 2 items ]”), a folded one that hides problems says “2 issues inside”, and where there is room
each row ends with its type – string, integer, object.

## Usage

### HTML

```html
<tc-structured-output id="triage" heading="Ticket triage" variable-name="triage"></tc-structured-output>

<script type="module">
  import "@adamstavely/trenchcoat/structured-output";
  import "@adamstavely/trenchcoat/tokens.css";

  const out = document.querySelector("#triage");
  out.schema = {
    type: "object",
    required: ["priority", "summary"],
    properties: {
      priority: { type: "string", enum: ["low", "normal", "high"] },
      summary: { type: "string", maxLength: 140 },
    },
  };
  out.streaming = true;
  for await (const chunk of stream) out.text += chunk;
  out.streaming = false;
  out.addEventListener("tc-validate", (e) => {
    if (e.detail.valid) fileTicket(e.detail.value);
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { StructuredOutput, type StructuredOutputSchema } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const schema: StructuredOutputSchema = {
  type: "object",
  required: ["priority", "summary"],
  properties: {
    priority: { type: "string", enum: ["low", "normal", "high"] },
    summary: { type: "string", maxLength: 140 },
  },
};

export function Triage({ text, streaming }: { text: string; streaming: boolean }) {
  const [ready, setReady] = useState(false);
  return (
    <>
      <StructuredOutput title="Ticket triage" text={text} schema={schema} streaming={streaming} onValidate={(r) => setReady(r.valid)} />
      <button type="button" disabled={!ready}>File ticket</button>
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/structured-output";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";

defineProps<{ schema: TcStructuredOutput["schema"]; collapsed: TcStructuredOutput["collapsed"] }>();
const onCollapsedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-structured-output :schema="schema" :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-structured-output>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StructuredOutput } from "@adamstavely/trenchcoat/angular/structured-output";
import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";

@Component({
  selector: "app-structured-output-example",
  imports: [StructuredOutput],
  template: `<tc-structured-output [schema]="schema()" [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-structured-output>`,
})
export class StructuredOutputExample {
  readonly schema = input.required<TcStructuredOutput["schema"]>();
  readonly collapsed = input.required<TcStructuredOutput["collapsed"]>();
  onCollapsedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/structured-output";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";

  let { schema, collapsed }: { schema: TcStructuredOutput["schema"]; collapsed: TcStructuredOutput["collapsed"] } = $props();
  let el: TcStructuredOutput;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-structured-output bind:this={el} {schema} {collapsed}></tc-structured-output>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The JSON as it arrives – it may grow every frame and stop mid-value. A ```json fence around it is ignored |
| `schema` | – | `StructuredOutputSchema \| undefined` | `undefined` | A JSON Schema to check the value against as it arrives (the common keywords – see the docs); unset checks syntax only |
| `streaming` | `streaming` | `boolean` | `false` | The text is still coming in: a caret blinks at the end, and what hasn't arrived isn't flagged yet |
| `heading` | `heading` | `string` | `"Output"` | The heading, and the tree's accessible name |
| `collapsed` | – | `string[]` | `[]` | JSON Pointer paths of folded branches ("/items/0"). Changed by the user unless tc-collapsed-change is prevented |
| `variableName` | `variable-name` | `string` | `"output"` | The variable name in "Copy as TypeScript": `const output = { … };` |
| `maxHeight` | `max-height` | `number` | `0` | Cap the tree's height in px (0: grow with the value); a capped tree scrolls and follows the end while streaming |
| `value` | – | `unknown` | – | The value parsed so far (fields still arriving are left out); undefined before anything has arrived |
| `issues` | – | `StructuredOutputIssue[]` | – | Everything the schema check found so far, in document order |
| `syntaxError` | – | `StructuredOutputSyntaxError \| null` | – | Where the text stopped being JSON, if it did |
| `complete` | – | `boolean` | – | The value has arrived in full: its outermost bracket closed |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-collapsed-change` | – | Yes | A branch was folded or opened ({ collapsed: string[] } – JSON Pointer paths); cancelable |
| `tc-copy` | – | No | The value was copied ({ format: "json" \| "ts", text: string }) |
| `tc-validate` | – | No | The text settled (not streaming) and its result changed ({ valid, value, issues, error, complete }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-structured-output-key` | `var(--tc-syntax-property)` | both |
| `--tc-structured-output-string` | `var(--tc-syntax-string)` | both |
| `--tc-structured-output-number` | `var(--tc-syntax-number)` | both |
| `--tc-structured-output-literal` | `var(--tc-syntax-keyword)` | both |
| `--tc-structured-output-punctuation` | `var(--tc-syntax-punctuation)` | both |
| `--tc-structured-output-text` | `var(--tc-syntax-text)` | both |
| `--tc-structured-output-indent` | `var(--tc-space-4)` | both |
| `--tc-structured-output-guide` | `var(--tc-border-default)` | both |

#### Design tokens it reads (75)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-syntax-keyword`, `--tc-syntax-number`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-text`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `structuredOutputParse(text: string, final: unknown): StructuredOutputParse` | Parses JSON that may still be arriving, tolerantly, as tc-structured-output does – for elements that render structured answers as they stream (tc-generated-ui). `final` says no more text is coming |

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Lists, objects and functions are properties, not attributes – bind them as properties:*

| Property | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- |
| `schema` | `el.schema = …;` | `<… schema={…} />` | `<tc-structured-output :schema="…">` | `<tc-structured-output [schema]="…">` | `<tc-structured-output {schema}>` |
| `collapsed` | `el.collapsed = …;` | `<… collapsed={…} />` | `<tc-structured-output :collapsed="…">` | `<tc-structured-output [collapsed]="…">` | `<tc-structured-output {collapsed}>` |

*Also attributes: `text`, `streaming`, `heading`, `variable-name`, `max-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `onCollapsedChange={…}` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-validate` | No | `el.addEventListener("tc-validate", (e) => …)` | `onValidate={…}` | `@tc-validate="…"` | `(tc-validate)="…($event)"` | `el.addEventListener("tc-validate", …)` |

### Controlled

The element changes `collapsed` itself unless a listener calls `preventDefault()` on `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-structured-output id="structured-output"></tc-structured-output>

<script type="module">
  import "@adamstavely/trenchcoat/structured-output";

  const el = document.querySelector("#structured-output");
  el.addEventListener("tc-collapsed-change", (e) => {
    e.preventDefault(); // the element keeps its collapsed…
    if (allowed(e.detail.collapsed)) el.collapsed = e.detail.collapsed; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { StructuredOutput } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof StructuredOutput>;
type Props = Omit<Own, "collapsed" | "onCollapsedChange"> & { initial: NonNullable<Own["collapsed"]> };

// Controlled: passing collapsed makes the wrapper prevent the element's own change; the app sets it
export function ControlledStructuredOutput({ initial, ...props }: Props) {
  const [collapsed, setCollapsed] = useState<Own["collapsed"]>(initial);
  return <StructuredOutput {...props} collapsed={collapsed} onCollapsedChange={(next) => setCollapsed(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/structured-output";
import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";

const props = defineProps<{ initial: TcStructuredOutput["collapsed"] }>();
const collapsed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCollapsedChange = (e: CustomEvent<{ collapsed: TcStructuredOutput["collapsed"] }>) => {
  e.preventDefault();
  collapsed.value = e.detail.collapsed;
};
</script>

<template>
  <tc-structured-output :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-structured-output>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { StructuredOutput } from "@adamstavely/trenchcoat/angular/structured-output";
import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";

@Component({
  selector: "app-controlled-structured-output",
  imports: [StructuredOutput],
  template: `<tc-structured-output [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-structured-output>`,
})
export class ControlledStructuredOutput {
  readonly initial = input.required<TcStructuredOutput["collapsed"]>();
  readonly collapsed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCollapsedChange(e: CustomEvent<{ collapsed: TcStructuredOutput["collapsed"] }>) {
    e.preventDefault();
    this.collapsed.set(e.detail.collapsed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/structured-output";
  import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";

  let { initial }: { initial: TcStructuredOutput["collapsed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let collapsed = $derived(initial);
  let el: TcStructuredOutput;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      collapsed = (e as CustomEvent<{ collapsed: TcStructuredOutput["collapsed"] }>).detail.collapsed;
    };
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-structured-output bind:this={el} {collapsed}></tc-structured-output>
```

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-structured-output")` returns a `TcStructuredOutput` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";`
- **React / Next.js:** Props: `import type { StructuredOutputProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof StructuredOutput>`. The element class, for refs: `import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStructuredOutput["schema"]` with `import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";`
- **Angular:** The directive types the template: `[schema]` takes `TcStructuredOutput["schema"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStructuredOutput } from "@adamstavely/trenchcoat/structured-output";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the tree's accessible name |
| `collapsed` | `string[]` | JSON Pointer paths of folded branches, e.g. "/items/0" (controlled) |
| `defaultCollapsed` | `string[]` | Folded branches to start with when uncontrolled |
| `onCollapsedChange` | `(collapsed: string[]) => void` | Called with the folded paths each time a branch is folded or opened |
| `onCopy` | `(format: "json" \| "ts", text: string) => void` | Called after a copy, with the format ("json" or "ts") and the text that went to the clipboard |
| `onValidate` | `(result: StructuredOutputValidate) => void` | Called once the text settles (not streaming) with the check's result: valid, value, issues, syntax error |

*Renamed or hidden on the wrapper: `heading`, `collapsed`, `onCopy`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The tree is one tab stop, on the row last used; the copy actions are another.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous row |
| → | Opens a folded object or list; on an open one, moves to its first field |
| ← | Folds an open object or list; otherwise moves to the parent |
| Home / End | Moves to the first or last row |
| Enter / Space | Folds or opens the object or list on the row |
| * | Opens every folded sibling of the row |
| ← / → in the copy actions | Moves between Copy as JSON and Copy as TypeScript |

Clicking a row with fields folds or opens it. If the focused row goes away – the text was replaced – focus moves to
the nearest row that's still there.

### Screen readers

The tree is a `tree` named by the heading; each row is a `treeitem` with `aria-level`, `aria-posinset` and
`aria-setsize`, and objects and lists have `aria-expanded`. A row's name is what it shows: the key, the value, the
type, and its issue – “priority: “urgent” string Expected one of "low", "normal", "high"”. A missing field reads
“email: Missing – required”. While streaming the tree is `aria-busy`. A polite status says “Done – matches the
schema”, “Done – 3 issues” or “Not valid JSON: …” when streaming ends, and “Copied as JSON” or “Copied as
TypeScript” after a copy. The copy buttons are named “Copy as JSON” and “Copy as TypeScript”.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **120** | light-dark() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.5 KB | 11.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **43.6 KB** | **14.0 KB** |
| With Lit – the first component on a page | 66.2 KB | 21.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 46 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 9.1 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the heading after what the value is – “Ticket triage”, “Invoice fields” – not “JSON” or “Response”.
- Put a `description` (or `title`) on schema fields people may not recognise: it becomes the key's tooltip.
- The element writes the issue messages from the schema (“Must be 1 or less”, “Expected one of …”); keep `enum`
  values and `pattern`s readable, since they appear in them.
- Set `variableName` to what the value is in your code, so the copied TypeScript drops in as it is.

## Do and don't

### Do

- Pass `streaming` while the text is arriving and turn it off when the model is done – missing fields and the
  final result are only reported then.
- Use `tc-validate` (`onValidate`) to gate what happens next: file the ticket only when `valid` is true.
- Fold branches people rarely need (`collapsed`), such as raw metadata, and leave the fields they check open.

### Don't

- Don't repair or reformat the model's text before passing it in – the tree and the syntax error point at what
  it actually wrote.
- Don't rely on schema features beyond the common keywords (no `$ref`, `oneOf`, `allOf`) – they're ignored.
- Don't use it for very large documents (thousands of rows) – it renders every open row.

## Related

- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Generated UI](generated-ui.md) – A model's answer drawn as real components – tables, charts, metrics, forms and callouts from a spec, checked as it arrives, with plain text for anything unknown
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
