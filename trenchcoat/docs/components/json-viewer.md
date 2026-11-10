<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# JSON Viewer

**AI & chat** · New

A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog

- **Element:** `<tc-json-viewer>`
- **Size:** 17.3 KB gzip · 59.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/json-viewer";` |
| React / Next.js | `import { JsonViewer } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/json-viewer";` · tags starting with tc- are custom elements |
| Angular | `import { JsonViewer } from "@adamstavely/trenchcoat/angular/json-viewer";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/json-viewer";` |

## Example

The live example is in the gallery at `#/json-viewer`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A JSON document laid out for someone to review: an API response, the fields an agent extracted from a PDF, a config,
a record export. It has two views. **Document** reads like a form: fields are labelled rows with keys in plain words,
so `invoice_date` reads "Invoice date". Nested objects become sections, lists of like objects become tables and lists
of values become chips. Links, emails, dates, yes/no and null are drawn as what they are. **Raw** is the JSON itself,
pretty-printed with line numbers and syntax colours.

`layout` picks how they're shown. **`tabs`** (the default) shows one at a time, chosen with the Document / Raw tabs.
**`split`** puts Document beside Raw, each scrolling on its own, and drops the tabs – both are showing. Point at or
focus a field and its lines are marked in the raw JSON and scrolled into view; click a raw line and its field is found
in Document. The toolbar's **Side by side** button switches between the two (`layout-toggle` to hide it), and below
640 px the raw JSON goes under Document.

A search box marks matching keys and values in both views and counts them, and Enter moves to the next. Reviewers can
flag a field with a note beside its row. Flags are listed at the foot and reported in `tc-flags-change`, so the page
can keep them. Copy JSON and Download hand over the document. Give it `value` (parsed) or `source` (text). Text that
isn't valid JSON shows the error at its line and column, with the lines around it. With `modal`, the viewer is a
dialog that `open` shows.

### When to use

- Someone has to check structured data before it's used: an extraction before it's paid, a response before it's
  trusted, a config before it ships.
- A "View JSON" action beside a record, a run or a tool call, opened as a dialog.
- Showing a payload whose shape you don't know in advance.

### When not to use

- JSON that's still streaming in from a model, checked against a schema as it arrives – use
  [Structured Output](structured-output.md).
- Code in general, with Apply and a diff – use [Code Block](code-block.md).
- Rows people sort, edit and select – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Views** `.ui-jsv__tabs` – Document and Raw, in the header (one at a time; not shown side by side)
2. **Toolbar** `.ui-jsv__toolbar` – the search with its count, Side by side, Copy JSON and Download
3. **Fields** `.ui-jsv__row` – a key in plain words and its value, with the flag button at the end
4. **Section** `.ui-jsv__section` – a nested object or list, with its name and size
5. **Table** `.ui-jsv__table` – a list of like objects, one row each
6. **Raw** `.ui-jsv__raw` – the JSON with line numbers and syntax colours
7. **Side by side** `.ui-jsv__split` – with `layout="split"`, Document and Raw in two panes
8. **Flags** `.ui-jsv__flags` – how many fields are flagged, each a button that goes to it

## Looks

Standard sets the header and view tabs on a gray tray above a white card; Clean is one white card with the header as
its first row. As a dialog the tray (Standard) or the card (Clean) is the dialog. Side by side, the raw pane sits on
the sunken surface, and the lines of the field you're pointing at are marked with an accent edge. Flagged fields have
an amber wash and their note under the value. Syntax colours come from the theme's `--tc-syntax-*` tokens.

A page can set `--tc-jsv-body-h` (how tall the body, or each pane, grows before it scrolls, 520px) and
`--tc-jsv-key-w` (the key column in Document, 34%).

## Usage

### HTML

```html
<button id="view">View JSON</button>
<tc-json-viewer modal heading="Invoice INV-2207" filename="inv-2207.json"></tc-json-viewer>
<script type="module">
  const viewer = document.querySelector("tc-json-viewer");
  viewer.value = { invoice_number: "INV-2207", total: 713.9, paid: false };
  document.querySelector("#view").addEventListener("click", () => (viewer.open = true));
  viewer.addEventListener("tc-open-change", (e) => (viewer.open = e.detail.open));
  viewer.addEventListener("tc-flags-change", (e) => console.log("save flags", e.detail.flags));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { JsonViewer, type JsonFlag } from "@adamstavely/trenchcoat/react";

export function InvoiceReview({ extraction }: { extraction: Record<string, unknown> }) {
  const [flags, setFlags] = useState<JsonFlag[]>([]);
  return <JsonViewer title="Invoice INV-2207" description="Extracted from the supplier's PDF" value={extraction as never} flags={flags} onFlagsChange={setFlags} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/json-viewer";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";

defineProps<{ value: TcJsonViewer["value"]; flags: TcJsonViewer["flags"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-json-viewer :value="value" :flags="flags" @tc-view-change="onViewChange"></tc-json-viewer>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { JsonViewer } from "@adamstavely/trenchcoat/angular/json-viewer";
import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";

@Component({
  selector: "app-json-viewer-example",
  imports: [JsonViewer],
  template: `<tc-json-viewer [value]="value()" [flags]="flags()" (tc-view-change)="onViewChange($event)"></tc-json-viewer>`,
})
export class JsonViewerExample {
  readonly value = input.required<TcJsonViewer["value"]>();
  readonly flags = input.required<TcJsonViewer["flags"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/json-viewer";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";

  let { value, flags }: { value: TcJsonViewer["value"]; flags: TcJsonViewer["flags"] } = $props();
  let el: TcJsonViewer;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-json-viewer bind:this={el} {value} {flags}></tc-json-viewer>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"JSON"` | The heading, and the viewer's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading; by default the document's size and how many values it holds |
| `value` | – | `JsonValue \| undefined` | `undefined` | The document, already parsed. `source` is used when this is undefined |
| `source` | `source` | `string \| undefined` | `undefined` | The document as JSON text, parsed when `value` isn't given; a syntax error is shown where it is |
| `view` | `view` | `JsonViewerView` | `"document"` | The view shown. Changed by the user unless a tc-view-change listener calls preventDefault() |
| `layout` | `layout` | `JsonViewerLayout` | `"tabs"` | "tabs" shows one view at a time; "split" shows the rendered view beside the raw JSON. Switched by the user unless tc-layout-change is prevented |
| `layoutToggle` | `layout-toggle` | `boolean` | `true` | Whether the toolbar offers the switch between tabs and side by side |
| `filter` | `filter` | `string` | `""` | What the search box holds. Changed by the user unless tc-filter-change is prevented |
| `flags` | – | `JsonFlag[]` | `[]` | The reviewer's flags. Changed by the user unless tc-flags-change is prevented |
| `flaggable` | `flaggable` | `boolean` | `true` | Whether reviewers can flag fields |
| `keyStyle` | `key-style` | `JsonKeyStyle` | `"words"` | How Document names fields: "words" ("Invoice date") or "raw" (the key as written) |
| `filename` | `filename` | `string` | `"document.json"` | The name Download saves the file under |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `modal` | `modal` | `boolean` | `false` | Show it as a dialog, opened by `open` |
| `open` | `open` | `boolean` | `false` | With `modal`: whether the dialog is showing. Escape and Close ask to close (tc-open-change) |
| `document` | – | `JsonValue \| undefined` | – | The document shown |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The view changed ({ view }: JsonViewerViewChange); cancelable – prevented, `view` stays as it was |
| `tc-layout-change` | – | Yes | Tabs or side by side was switched ({ layout }: JsonViewerLayoutChange); cancelable – prevented, `layout` stays as it was |
| `tc-filter-change` | – | Yes | The search changed ({ filter }: JsonViewerFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-flags-change` | – | Yes | A flag was added, edited or removed ({ flags, path, note }: JsonViewerFlagsChange); cancelable – prevented, `flags` stays as it was |
| `tc-open-change` | – | Yes | With `modal`: asks to open or close ({ open }: JsonViewerOpenChange), from Escape or Close; cancelable – prevented, `open` stays |
| `tc-copy` | – | Yes | The JSON was copied ({ text }: JsonViewerCopy); cancelable – prevented, nothing is copied |
| `tc-download` | – | Yes | Download was pressed ({ filename, text }: JsonViewerDownload); cancelable – prevented, the page saves it its own way |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-jsv-body-h` | `520px` | clean |
| `--tc-jsv-key-w` | `34%` | clean |
| `--tc-jsv-count-w` | `6.5rem` | clean |

#### Design tokens it reads (91)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-h-lg`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-scrim`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-overlay`, `--tc-shadow-sunken`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-syntax-keyword`, `--tc-syntax-number`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-text`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-border`, `--tc-tone-amber-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `jsonPointer(parent: string, key: string): void` | The path of `key` under `parent` |
| `valueAt(doc: unknown, path: string): unknown` | The value at a JSON Pointer, or undefined |
| `keyWords(key: string): void` | A key in plain words: "invoice_date", "invoiceDate" and "invoice-date" all read "Invoice date"; "vendor_id" reads "Vendor ID" |
| `firstJsonError(text: string): number` | Where JSON text first goes wrong, as an offset – a small scanner, for browsers whose messages don't say; -1 when it's valid |
| `errorPosition(text: string, message: string): { line: number; column: number } \| null` | A JSON syntax error's position in the text: 1-based line and column, from the browser's message or found by scanning |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-json-viewer :value="…">` | `<tc-json-viewer [value]="…">` | `<tc-json-viewer {value}>` |
| `flags` | `el.flags = …;` | `<… flags={…} />` | `<tc-json-viewer :flags="…">` | `<tc-json-viewer [flags]="…">` | `<tc-json-viewer {flags}>` |

*Also attributes: `heading`, `description`, `source`, `view`, `layout`, `layout-toggle`, `filter`, `flaggable` and 5 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-layout-change` | Yes | `el.addEventListener("tc-layout-change", (e) => …)` | `ref.current.addEventListener("tc-layout-change", …)` | `@tc-layout-change="…"` | `(tc-layout-change)="…($event)"` | `el.addEventListener("tc-layout-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-flags-change` | Yes | `el.addEventListener("tc-flags-change", (e) => …)` | `onFlagsChange={…}` | `@tc-flags-change="…"` | `(tc-flags-change)="…($event)"` | `el.addEventListener("tc-flags-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyJson={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-download` | Yes | `el.addEventListener("tc-download", (e) => …)` | `onDownload={…}` | `@tc-download="…"` | `(tc-download)="…($event)"` | `el.addEventListener("tc-download", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view`, `layout`, `filter`, `flags` and `open` itself unless a listener calls `preventDefault()` on `tc-view-change`, `tc-layout-change`, `tc-filter-change`, `tc-flags-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-json-viewer id="json-viewer"></tc-json-viewer>

<script type="module">
  import "@adamstavely/trenchcoat/json-viewer";

  const el = document.querySelector("#json-viewer");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/json-viewer";
import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";

const props = defineProps<{ initial: TcJsonViewer["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcJsonViewer["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-json-viewer :view="view" @tc-view-change="onViewChange"></tc-json-viewer>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { JsonViewer } from "@adamstavely/trenchcoat/angular/json-viewer";
import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";

@Component({
  selector: "app-controlled-json-viewer",
  imports: [JsonViewer],
  template: `<tc-json-viewer [view]="view()" (tc-view-change)="onViewChange($event)"></tc-json-viewer>`,
})
export class ControlledJsonViewer {
  readonly initial = input.required<TcJsonViewer["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcJsonViewer["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/json-viewer";
  import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";

  let { initial }: { initial: TcJsonViewer["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcJsonViewer;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcJsonViewer["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-json-viewer bind:this={el} {view}></tc-json-viewer>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-json-viewer")` returns a `TcJsonViewer` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";`
- **React / Next.js:** Props: `import type { JsonViewerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof JsonViewer>`. The element class, for refs: `import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcJsonViewer["value"]` with `import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";`
- **Angular:** The directive types the template: `[value]` takes `TcJsonViewer["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcJsonViewer } from "@adamstavely/trenchcoat/json-viewer";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the viewer's name |
| `view` | `JsonViewerView` | The view shown – controlled when given |
| `defaultView` | `JsonViewerView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: JsonViewerView) => void` | The view changed |
| `layout` | `JsonViewerLayout` | One view at a time ("tabs") or the rendered view beside the raw JSON ("split") – controlled when given |
| `defaultLayout` | `JsonViewerLayout` | The layout on mount when `layout` isn't controlled |
| `onLayoutChange` | `(layout: JsonViewerLayout) => void` | The layout was switched with the toolbar button |
| `filter` | `string` | The search – controlled when given |
| `defaultFilter` | `string` | The search on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: string) => void` | The search changed |
| `flags` | `JsonFlag[]` | The reviewer's flags – controlled when given: adding, editing and removing report the next list |
| `defaultFlags` | `JsonFlag[]` | The flags on mount when `flags` isn't controlled |
| `onFlagsChange` | `(next: JsonFlag[], change: { path: string; note: string \| null }) => void` | A flag was added, edited or removed; `next` is the list as it will be |
| `open` | `boolean` | With `modal`: whether the dialog is showing – controlled when given; pair it with onOpenChange |
| `defaultOpen` | `boolean` | With `modal`: whether an uncontrolled dialog starts open |
| `onOpenChange` | `(open: boolean) => void` | With `modal`: the dialog asks to open or close (Escape, Close) |
| `onCopyJson` | `(detail: JsonViewerCopy, event: CustomEvent<JsonViewerCopy>) => void` | The JSON was copied; `event.preventDefault()` stops the copy |
| `onDownload` | `(detail: JsonViewerDownload, event: CustomEvent<JsonViewerDownload>) => void` | Download was pressed; `event.preventDefault()` to save it your own way |

*Renamed or hidden on the wrapper: `heading`, `view`, `layout`, `filter`, `flags`, `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | Does |
| --- | --- |
| ← / → on the views | Switch between Document and Raw |
| Enter / Shift + Enter in the search | Next / previous match |
| Escape in the search | Clears it |
| Tab into a field (side by side) | Marks its lines in the raw JSON |
| ⌘ / Ctrl + Enter in a note | Saves the flag |
| Escape in a note | Cancels it |
| Escape (dialog) | Asks to close |

### Screen readers

- The views are a `tablist`; the body is their `tabpanel`. Side by side, Document and the raw JSON are two named
  regions ("Invoice, document" and "Raw JSON"), and Side by side is a toggle button that says whether it's on.
- Document fields are a description list (`dl`), sections have headings below the card's own, and tables have
  column headers.
- Yes/no values say "true" or "false" as well as the word and mark shown.
- The search's count is the field's description. Matches, copies and flags are announced in a polite status line.
- The flag buttons name their field ("Flag Unit price"); the note box is labelled the same way.
- As a dialog, it's a native modal named by its heading, and focus returns to the opener on close.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 50.1 KB | 14.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **59.6 KB** | **17.4 KB** |
| With Lit – the first component on a page | 80.3 KB | 24.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.1 ms** | the gallery demo's data, 461 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of flags replaced |
| First on the page | 9.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | flags: first render, 560 nodes; update 1.0 ms |
| 1,000 items | 9.4 ms | flags: first render, 1,460 nodes; update 2.8 ms |

1,000 items of flags: 9.4 ms, 1,460 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the document after what it is ("Invoice INV-2207"), and say where it came from in `description`.
- Use keys that read well in words: `invoice_date`, `vatId` and `unit-price` all do. With keys that don't, set
  `key-style="raw"`.
- Flags are for people: write the note as what to check ("Last order was €19.90 – check the price list").
- Large documents work. Document shows 50 entries of a list before Show all, and Raw shows 4,000 lines before Show
  the whole document.

## Do and don't

### Do

- Open it as a dialog from a "View JSON" button where the JSON is a detail.
- Go side by side where people check a rendering against the exact JSON – an extraction, a migration, an API change.
- Keep the flags with the record (`onFlagsChange`), so the next reviewer sees them.
- Pass `source` when you have text, so a broken payload says where it breaks.

### Don't

- Use it to edit JSON – it's for reading and flagging.
- Hide Raw: reviewers check the exact JSON when Document's reading of it surprises them.
- Turn keys into words when they're identifiers people search for (`SKU-1190`), or they'll be harder to match.

## Related

- [Structured Output](structured-output.md) – Streaming JSON as a typed tree, checked against its schema as it arrives – missing and invalid fields flagged, copy as JSON or code
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Dialog](dialog.md) – A native modal with interactive content and restored focus

## Changelog

- **JSON Viewer** (`tc-json-viewer`) – a JSON document laid out for someone to check: Document reads it like a form (keys in plain words, nested objects as sections, lists of like objects as tables, links, dates and yes/no drawn as what they are) and Raw is the pretty-printed JSON with line numbers; `layout="split"` shows them side by side, each field linked to its lines. Search marks and counts matches in every view; reviewers flag fields with notes (`tc-flags-change`); Copy and Download hand over the JSON – `source` as written, so integers too big to hold exactly (which are marked) keep their digits. `source` text that isn't valid JSON shows where it breaks. With `modal`, it's a dialog opened by `open`.
