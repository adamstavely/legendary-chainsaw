<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Column Mapper

**Data & charts** · New

A model matches a file's columns to your fields – a select per column prefilled from its suggestion, "Suggested" with the confidence in a word, Use suggestion once changed, Accept all suggestions, and required fields left out or fields matched twice said in words before Continue

- **Element:** `<tc-column-mapper>`
- **Size:** 8.2 KB gzip · 25.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/column-mapper";` |
| React / Next.js | `import { ColumnMapper } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/column-mapper";` · tags starting with tc- are custom elements |
| Angular | `import { ColumnMapper } from "@adamstavely/trenchcoat/angular/column-mapper";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/column-mapper";` |

## Example

The live example is in the gallery at `#/column-mapper`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The step of an import where a model matches the file's columns to your fields and a person checks it. Each column of
the file is a row: its name and a few sample values on the left, and a select of your fields – or Don't import – on the
right, prefilled with the model's suggestion. A suggestion in use is marked "Suggested" with how sure the model was in
a word: High, Medium or Low. Changed away from, the suggestion stays visible with Use suggestion. Under the rows, what
still stands in the way is said in words – required fields nothing goes to, two columns going to the same field – and
Continue waits until the mapping is complete. Accept all suggestions puts every suggestion back at once.

### When to use

- Importing a spreadsheet whose headers don't match your field names ("Ctry", "E-mail address").
- When a model suggests the matches but a person should confirm them before rows are written.
- After `file-import`, before `import-review`.

### When not to use

- Reading or previewing the file – use [File Import](file-import.md).
- Fixing values in the rows – use [Import Review](import-review.md).
- A single suggestion to accept or switch – use [Smart Recommendation](smart-recommendation.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Column** `.ui-cmap__source` – the column's name in the file and up to three sample values
2. **Field** `.ui-cmap__field` – a select of your fields, required ones marked, and Don't import
3. **Suggestion** `.ui-cmap__note` – “Suggested · High confidence”, or the suggestion with Use suggestion once changed
4. **Duplicate** `.ui-cmap__dup` – shown under a field another column also goes to
5. **Problems** `.ui-cmap__problems` – required fields not matched, and fields matched twice, in words
6. **Accept all suggestions** `.ui-cmap__accept` – in the header; held when every suggestion is in use
7. **Continue** `.ui-cmap__continue` – with “5 of 7 columns matched · 2 not imported”

## Looks

Standard puts the header on the gray tray above a white card and the summary below it; Clean is one white card with the
summary as its last row. `--tc-column-mapper-source` and `--tc-column-mapper-target` set the two columns' widths.

## Usage

### HTML

```html
<tc-column-mapper id="mapper" description="vendors.csv → Purchasing ledger"></tc-column-mapper>

<script type="module">
  import "@adamstavely/trenchcoat/column-mapper";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#mapper");
  el.columns = [
    { id: "supplier", name: "Supplier", samples: ["Kestrel Lab Supplies", "Harbour Analytics"] },
    { id: "mail", name: "E-mail address", samples: ["orders@kestrel-lab.example"] },
    { id: "ctry", name: "Ctry", samples: ["UK", "NL"] },
  ];
  el.fields = [
    { id: "name", label: "Vendor name", required: true },
    { id: "email", label: "Contact email", required: true },
    { id: "country", label: "Country" },
  ];
  el.suggestions = [
    { column: "supplier", field: "name", confidence: 0.96 },
    { column: "mail", field: "email", confidence: 0.99 },
    { column: "ctry", field: "country", confidence: 0.64 },
  ];
  el.addEventListener("tc-continue", (e) => console.log(e.detail.mapping));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ColumnMapper, type ColumnMapperColumn, type ColumnMapperField, type ColumnMapperSuggestion, type ColumnMapping } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function MapVendors({ columns, fields, suggestions, next }: { columns: ColumnMapperColumn[]; fields: ColumnMapperField[]; suggestions: ColumnMapperSuggestion[]; next: (mapping: ColumnMapping) => void }) {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  return <ColumnMapper columns={columns} fields={fields} suggestions={suggestions} mapping={mapping} onMappingChange={setMapping} onContinue={next} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/column-mapper";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";

defineProps<{ columns: TcColumnMapper["columns"]; fields: TcColumnMapper["fields"] }>();
const onMappingChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-column-mapper :columns="columns" :fields="fields" @tc-mapping-change="onMappingChange"></tc-column-mapper>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ColumnMapper } from "@adamstavely/trenchcoat/angular/column-mapper";
import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";

@Component({
  selector: "app-column-mapper-example",
  imports: [ColumnMapper],
  template: `<tc-column-mapper [columns]="columns()" [fields]="fields()" (tc-mapping-change)="onMappingChange($event)"></tc-column-mapper>`,
})
export class ColumnMapperExample {
  readonly columns = input.required<TcColumnMapper["columns"]>();
  readonly fields = input.required<TcColumnMapper["fields"]>();
  onMappingChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/column-mapper";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";

  let { columns, fields }: { columns: TcColumnMapper["columns"]; fields: TcColumnMapper["fields"] } = $props();
  let el: TcColumnMapper;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-mapping-change", on);
    return () => el.removeEventListener("tc-mapping-change", on);
  });
</script>

<tc-column-mapper bind:this={el} {columns} {fields}></tc-column-mapper>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Match columns"` | The heading |
| `description` | `description` | `string` | `""` | A quiet line under the heading – the file, or what the rows become |
| `columns` | – | `ColumnMapperColumn[]` | `[]` | The file's columns, in order |
| `fields` | – | `ColumnMapperField[]` | `[]` | The fields the rows are imported into |
| `suggestions` | – | `ColumnMapperSuggestion[]` | `[]` | The model's suggestion per column, with how sure it is |
| `mapping` | – | `ColumnMapping` | `{}` | The value: column id → field id, null for "Don't import". Columns left out use their suggestion. Changed unless a tc-mapping-change listener calls preventDefault() |
| `hideContinue` | `hide-continue` | `boolean` | `false` | Hides Continue, for a page with its own next step |
| `labels` | – | `Partial<ColumnMapperLabels>` | `{}` | Words the page can rename, merged over defaultColumnMapperLabels |
| `resolved` | – | `ColumnMapping` | – | Every column's field, suggestions filled in |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-mapping-change` | – | Yes | A column's field was changed, or every suggestion accepted ({ mapping, column, field }: ColumnMappingChange); cancelable – prevented, `mapping` stays as it was |
| `tc-continue` | – | No | Continue was pressed with every required field matched and no field matched twice ({ mapping }: ColumnMapperContinue) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-column-mapper-source` | `minmax(0, 1fr)` | standard, clean |
| `--tc-column-mapper-target` | `minmax(0, 1.1fr)` | standard, clean |

#### Design tokens it reads (56)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `confidenceLevel(c: number): "high" \| "medium" \| "low"` | High at 0.85 and above, Medium at 0.6 and above, Low below |
| `resolveMapping(columns: ColumnMapperColumn[], mapping: ColumnMapping, suggestions: ColumnMapperSuggestion[]): ColumnMapping` | Every column's field: the mapping's, else its suggestion's, else null |
| `mappingProblems(columns: ColumnMapperColumn[], fields: ColumnMapperField[], mapping: ColumnMapping): void` | What's wrong with a mapping: required fields nothing goes to, and fields more than one column goes to |

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
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-column-mapper :columns="…">` | `<tc-column-mapper [columns]="…">` | `<tc-column-mapper {columns}>` |
| `fields` | `el.fields = …;` | `<… fields={…} />` | `<tc-column-mapper :fields="…">` | `<tc-column-mapper [fields]="…">` | `<tc-column-mapper {fields}>` |
| `suggestions` | `el.suggestions = …;` | `<… suggestions={…} />` | `<tc-column-mapper :suggestions="…">` | `<tc-column-mapper [suggestions]="…">` | `<tc-column-mapper {suggestions}>` |
| `mapping` | `el.mapping = …;` | `<… mapping={…} />` | `<tc-column-mapper :mapping="…">` | `<tc-column-mapper [mapping]="…">` | `<tc-column-mapper {mapping}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-column-mapper :labels="…">` | `<tc-column-mapper [labels]="…">` | `<tc-column-mapper {labels}>` |

*Also attributes: `heading`, `description`, `hide-continue` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-mapping-change` | Yes | `el.addEventListener("tc-mapping-change", (e) => …)` | `ref.current.addEventListener("tc-mapping-change", …)` | `@tc-mapping-change="…"` | `(tc-mapping-change)="…($event)"` | `el.addEventListener("tc-mapping-change", …)` |
| `tc-continue` | No | `el.addEventListener("tc-continue", (e) => …)` | `onContinue={…}` | `@tc-continue="…"` | `(tc-continue)="…($event)"` | `el.addEventListener("tc-continue", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `mapping` itself unless a listener calls `preventDefault()` on `tc-mapping-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-column-mapper id="column-mapper"></tc-column-mapper>

<script type="module">
  import "@adamstavely/trenchcoat/column-mapper";

  const el = document.querySelector("#column-mapper");
  el.addEventListener("tc-mapping-change", (e) => {
    e.preventDefault(); // the element keeps its mapping…
    if (allowed(e.detail.mapping)) el.mapping = e.detail.mapping; // …until the app sets it
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
import "@adamstavely/trenchcoat/column-mapper";
import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";

const props = defineProps<{ initial: TcColumnMapper["mapping"] }>();
const mapping = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMappingChange = (e: CustomEvent<{ mapping: TcColumnMapper["mapping"] }>) => {
  e.preventDefault();
  mapping.value = e.detail.mapping;
};
</script>

<template>
  <tc-column-mapper :mapping="mapping" @tc-mapping-change="onMappingChange"></tc-column-mapper>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ColumnMapper } from "@adamstavely/trenchcoat/angular/column-mapper";
import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";

@Component({
  selector: "app-controlled-column-mapper",
  imports: [ColumnMapper],
  template: `<tc-column-mapper [mapping]="mapping()" (tc-mapping-change)="onMappingChange($event)"></tc-column-mapper>`,
})
export class ControlledColumnMapper {
  readonly initial = input.required<TcColumnMapper["mapping"]>();
  readonly mapping = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMappingChange(e: CustomEvent<{ mapping: TcColumnMapper["mapping"] }>) {
    e.preventDefault();
    this.mapping.set(e.detail.mapping);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/column-mapper";
  import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";

  let { initial }: { initial: TcColumnMapper["mapping"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let mapping = $derived(initial);
  let el: TcColumnMapper;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      mapping = (e as CustomEvent<{ mapping: TcColumnMapper["mapping"] }>).detail.mapping;
    };
    el.addEventListener("tc-mapping-change", on);
    return () => el.removeEventListener("tc-mapping-change", on);
  });
</script>

<tc-column-mapper bind:this={el} {mapping}></tc-column-mapper>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-column-mapper")` returns a `TcColumnMapper` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";`
- **React / Next.js:** Props: `import type { ColumnMapperProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ColumnMapper>`. The element class, for refs: `import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcColumnMapper["columns"]` with `import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";`
- **Angular:** The directive types the template: `[columns]` takes `TcColumnMapper["columns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcColumnMapper } from "@adamstavely/trenchcoat/column-mapper";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `mapping` | `ColumnMapping` | Column id → field id, null for "Don't import". Controlled when defined – pass back what onMappingChange reports |
| `defaultMapping` | `ColumnMapping` | The starting mapping when uncontrolled; columns left out use their suggestion |
| `onMappingChange` | `(mapping: ColumnMapping, column: string \| null, field: string \| null) => void` | A column's field changed, or every suggestion was accepted: the whole mapping, the column (null for all) and its field |
| `onContinue` | `(mapping: ColumnMapping) => void` | Continue was pressed with every required field matched |

*Renamed or hidden on the wrapper: `heading`, `Don't import`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves from field to field, through Use suggestion where shown, and on to Continue |
| Arrow keys, Enter (on a field) | The browser's own select: choose the field |
| Enter or Space (on a button) | Presses it |

### Screen readers

Each select is labelled by its column's name and described by its suggestion (“Suggested · Medium confidence”) or, when
two columns go to one field, by “Another column also goes to Contact email”, with `aria-invalid` set. Sample values
are read as “Sample values: …”. Use suggestion names its column (“Use suggestion for Ctry”). A status region says
each change (“Ctry goes to Country”, “3 suggestions accepted”). Continue and Accept all suggestions are
`aria-disabled` with the reason as their description.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.5 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.9 KB** | **8.2 KB** |
| With Lit – the first component on a page | 48.2 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 199 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of columns replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | columns: first render, 2,152 nodes; update 1.3 ms |
| 1,000 items | 148 ms | columns: first render, 21,052 nodes; update 9.3 ms |

1,000 items of columns: 148 ms. It renders every item, so a first render passes 50 ms (a long task) at about 340 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give fields the names people use in your app – the selects show them, not ids.
- Mark a field `required` only when a row truly can't be imported without it.
- Pass a few real sample values per column; they're what people recognise a column by.
- Send confidence as the model's own 0–1 score; the element puts it in words.

## Do and don't

### Do

- Suggest Don't import (`field: null`) for columns you won't keep, such as free-text notes.
- Keep `mapping` with the import job, so going back a step keeps people's choices.
- Use `resolveMapping` to get every column's field, suggestions filled in.

### Don't

- Don't hide low-confidence suggestions; show them as Low so they get checked.
- Don't allow two columns into one field silently – the element flags it and holds Continue.
- Don't use it to rename fields; it only matches columns to the fields you have.

## Related

- [File Import](file-import.md) – Drop a spreadsheet and see what was read – the rows and columns found, the delimiter and encoding, a "First row is headers" switch, the first rows with each column's type in words, problems in words (rows of the wrong length, empty columns, a header named twice), and Continue; CSV and TSV read in the browser, Excel through the page
- [Import Review](import-review.md) – Rows of an import, checked before they land – cell problems in words (missing, not an email, not a date, not a number, or the page's own), duplicates by a key with Keep this and Merge, All / With problems / Duplicates tabs with counts, cells edited in place, skip and restore, and Import held with the reason until nothing's left to fix or problem rows are skipped
- [Smart Recommendation](smart-recommendation.md) – Suggestion card with a confidence signal, alternatives to switch to and accept with undo
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
