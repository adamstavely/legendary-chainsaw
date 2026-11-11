<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Diff Table

**AI & chat** · New

An AI's proposed edits to a table, reviewed in place – old values struck and new ones marked, added and removed rows, accept or reject per edit, per row or all, undo, a popover with the reason, and edits that sweep in while streaming

- **Element:** `<tc-diff-table>`
- **Size:** 12.2 KB gzip · 39.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/diff-table";` |
| React / Next.js | `import { DiffTable } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/diff-table";` · tags starting with tc- are custom elements |
| Angular | `import { DiffTable } from "@adamstavely/trenchcoat/angular/diff-table";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/diff-table";` |

## Example

The live example is in the gallery at `#/diff-table`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An AI's proposed edits to a table, reviewed where they sit. Each changed cell shows the old value struck on a red tint
and the new one on a green tint; rows the AI wants to add or remove are tinted and marked with a plus or a minus. People
accept or reject a single edit, everything in a row, or everything at once, and Undo steps back. A count in the header
says how many are left. While the edits are still arriving, `streaming` sweeps them in a row at a time.

### When to use

- An assistant proposing a cleanup of records – a register, a price list, a set of findings.
- Bulk changes someone must sign off before they're applied.
- Showing the proposal as it streams in, so people can start reading early.

### When not to use

- Edits to prose, accepted word by word – use [Inline Diff](inline-diff.md).
- Editing a table freely, without a proposal to review – use [Data Table](data-table.md).
- Changes to code or files – use [Diff Viewer](diff-viewer.md).
- Checking values the AI pulled out of documents against their sources – use [Extraction Review](extraction-review.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Toolbar** `.ui-dftb__bar` – Accept all, Reject all and Undo
2. **Count** `.ui-dftb__count` – how many edits are pending, or All reviewed
3. **Table** `.ui-dftb__table` – the rows, with the first column `.ui-dftb__cell--head` held still while the rest scrolls
4. **Edited cell** `.ui-dftb__chg` – the old value `.ui-dftb__del` and the new one `.ui-dftb__ins`
5. **Row mark** `.ui-dftb__rowmark` – a plus for a new row, a minus for a removed one
6. **Row review** `.ui-dftb__cell--review` – the row's Accept and Reject, or its verdict
7. **Popover** `.ui-dftb__pop` – the old and new values, the reason and both choices

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Pending edits are tinted, accepted ones show the new value with a check, and rejected ones keep the old value with a
cross – each also says so to screen readers, so colour is never the only cue. `--tc-diff-table-bg` sets the cells' and
sticky column's background.

## Usage

### HTML

```html
<tc-diff-table id="cleanup" heading="Proposed register cleanup"></tc-diff-table>

<script type="module">
  import "@adamstavely/trenchcoat/diff-table";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#cleanup");
  el.columns = [
    { key: "vendor", label: "Vendor" },
    { key: "review", label: "Next review" },
  ];
  el.rows = [{ id: "v2", cells: { vendor: "Clearwater Analytics", review: "Jan 2026" } }];
  el.edits = [{ id: "e1", row: "v2", column: "review", from: "Jan 2026", to: "Jan 2027", reason: "Renewed in December." }];
  el.addEventListener("tc-decisions-change", (e) => console.log(e.detail.decisions));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DiffTable, type DiffTableDecisions } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Cleanup() {
  const [decisions, setDecisions] = useState<DiffTableDecisions>({});
  return (
    <DiffTable
      title="Proposed register cleanup"
      columns={[{ key: "vendor", label: "Vendor" }, { key: "review", label: "Next review" }]}
      rows={[{ id: "v2", cells: { vendor: "Clearwater Analytics", review: "Jan 2026" } }]}
      edits={[{ id: "e1", row: "v2", column: "review", from: "Jan 2026", to: "Jan 2027" }]}
      decisions={decisions}
      onDecisionsChange={setDecisions}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/diff-table";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";

defineProps<{ columns: TcDiffTable["columns"]; rows: TcDiffTable["rows"] }>();
const onEditChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-diff-table :columns="columns" :rows="rows" @tc-edit-change="onEditChange"></tc-diff-table>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DiffTable } from "@adamstavely/trenchcoat/angular/diff-table";
import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";

@Component({
  selector: "app-diff-table-example",
  imports: [DiffTable],
  template: `<tc-diff-table [columns]="columns()" [rows]="rows()" (tc-edit-change)="onEditChange($event)"></tc-diff-table>`,
})
export class DiffTableExample {
  readonly columns = input.required<TcDiffTable["columns"]>();
  readonly rows = input.required<TcDiffTable["rows"]>();
  onEditChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/diff-table";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";

  let { columns, rows }: { columns: TcDiffTable["columns"]; rows: TcDiffTable["rows"] } = $props();
  let el: TcDiffTable;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-edit-change", on);
    return () => el.removeEventListener("tc-edit-change", on);
  });
</script>

<tc-diff-table bind:this={el} {columns} {rows}></tc-diff-table>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Proposed changes"` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `columns` | – | `DiffTableColumn[]` | `[]` | The columns, in order; the first one names each row |
| `rows` | – | `DiffTableRow[]` | `[]` | The rows, in order |
| `edits` | – | `DiffTableEdit[]` | `[]` | The proposed edits to single cells |
| `decisions` | – | `DiffTableDecisions` | `{}` | The verdicts so far. Changed by the buttons and keys unless a tc-decisions-change listener calls preventDefault() |
| `streaming` | `streaming` | `boolean` | `false` | The edits are still arriving: they sweep in a row at a time, and Accept all waits until they're all in |
| `labels` | – | `Partial<DiffTableLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-edit-change` | – | Yes | One edit was accepted or rejected ({ edit, decision }: DiffTableEditChange); cancelable – prevented, nothing changes |
| `tc-decisions-change` | – | Yes | Any decision, row, all or undo, with every verdict ({ decisions }: DiffTableDecisionsChange); cancelable – prevented, `decisions` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `decide(key: string, decision: DiffTableVerdict)` | `void` | One edit, or a row's own add or remove |
| `decideRow(id: string, decision: DiffTableVerdict)` | `void` | Everything still pending in a row |
| `decideAll(decision: DiffTableVerdict)` | `void` | Everything still pending – once every edit has arrived |
| `undo()` | `void` | Restores the verdicts before the last change |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-diff-table-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (49)

`--tc-accent-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-slower`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultDiffTableLabels: DiffTableLabels` | The words used when the page gives none |

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
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-diff-table :columns="…">` | `<tc-diff-table [columns]="…">` | `<tc-diff-table {columns}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-diff-table :rows="…">` | `<tc-diff-table [rows]="…">` | `<tc-diff-table {rows}>` |
| `edits` | `el.edits = …;` | `<… edits={…} />` | `<tc-diff-table :edits="…">` | `<tc-diff-table [edits]="…">` | `<tc-diff-table {edits}>` |
| `decisions` | `el.decisions = …;` | `<… decisions={…} />` | `<tc-diff-table :decisions="…">` | `<tc-diff-table [decisions]="…">` | `<tc-diff-table {decisions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-diff-table :labels="…">` | `<tc-diff-table [labels]="…">` | `<tc-diff-table {labels}>` |

*Also attributes: `heading`, `description`, `streaming` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-edit-change` | Yes | `el.addEventListener("tc-edit-change", (e) => …)` | `onTcEditChange={…}` | `@tc-edit-change="…"` | `(tc-edit-change)="…($event)"` | `el.addEventListener("tc-edit-change", …)` |
| `tc-decisions-change` | Yes | `el.addEventListener("tc-decisions-change", (e) => …)` | `onDecisionsChange={…}` | `@tc-decisions-change="…"` | `(tc-decisions-change)="…($event)"` | `el.addEventListener("tc-decisions-change", …)` |

### Controlled

The element changes `decisions` itself unless a listener calls `preventDefault()` on `tc-decisions-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-diff-table id="diff-table"></tc-diff-table>

<script type="module">
  import "@adamstavely/trenchcoat/diff-table";

  const el = document.querySelector("#diff-table");
  el.addEventListener("tc-decisions-change", (e) => {
    e.preventDefault(); // the element keeps its decisions…
    if (allowed(e.detail.decisions)) el.decisions = e.detail.decisions; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { DiffTable } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DiffTable>;
type Props = Omit<Own, "decisions" | "onDecisionsChange"> & { initial: NonNullable<Own["decisions"]> };

// Controlled: passing decisions makes the wrapper prevent the element's own change; the app sets it
export function ControlledDiffTable({ initial, ...props }: Props) {
  const [decisions, setDecisions] = useState<Own["decisions"]>(initial);
  return <DiffTable {...props} decisions={decisions} onDecisionsChange={(next) => setDecisions(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/diff-table";
import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";

const props = defineProps<{ initial: TcDiffTable["decisions"] }>();
const decisions = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDecisionsChange = (e: CustomEvent<{ decisions: TcDiffTable["decisions"] }>) => {
  e.preventDefault();
  decisions.value = e.detail.decisions;
};
</script>

<template>
  <tc-diff-table :decisions="decisions" @tc-decisions-change="onDecisionsChange"></tc-diff-table>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DiffTable } from "@adamstavely/trenchcoat/angular/diff-table";
import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";

@Component({
  selector: "app-controlled-diff-table",
  imports: [DiffTable],
  template: `<tc-diff-table [decisions]="decisions()" (tc-decisions-change)="onDecisionsChange($event)"></tc-diff-table>`,
})
export class ControlledDiffTable {
  readonly initial = input.required<TcDiffTable["decisions"]>();
  readonly decisions = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDecisionsChange(e: CustomEvent<{ decisions: TcDiffTable["decisions"] }>) {
    e.preventDefault();
    this.decisions.set(e.detail.decisions);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/diff-table";
  import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";

  let { initial }: { initial: TcDiffTable["decisions"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let decisions = $derived(initial);
  let el: TcDiffTable;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      decisions = (e as CustomEvent<{ decisions: TcDiffTable["decisions"] }>).detail.decisions;
    };
    el.addEventListener("tc-decisions-change", on);
    return () => el.removeEventListener("tc-decisions-change", on);
  });
</script>

<tc-diff-table bind:this={el} {decisions}></tc-diff-table>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-diff-table")` returns a `TcDiffTable` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";`
- **React / Next.js:** Props: `import type { DiffTableProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DiffTable>`. The element class, for refs: `import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDiffTable["columns"]` with `import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";`
- **Angular:** The directive types the template: `[columns]` takes `TcDiffTable["columns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDiffTable } from "@adamstavely/trenchcoat/diff-table";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; an empty one draws no header |
| `decisions` | `DiffTableDecisions` | The verdicts so far – controlled when given |
| `defaultDecisions` | `DiffTableDecisions` | The verdicts to start with when uncontrolled |
| `onDecisionsChange` | `(decisions: DiffTableDecisions) => void` | Every decision, row, all or undo, with all verdicts so far |

*Renamed or hidden on the wrapper: `heading`, `decisions`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The cells are a grid with one tab stop; a row's Accept and Reject buttons are the last two stops in it.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Move between cells |
| Home / End | Go to the start or end of the row |
| Ctrl+Home / Ctrl+End | Go to the first or last cell |
| A | Accept the focused edit |
| R | Reject the focused edit |
| Enter / Space | Open the focused edit's popover, or press a button |
| Escape | Close the popover and return to its cell |

### Screen readers

The table is a grid named by the heading, with row headers from the first column and a hidden description of the
keys. An edited cell reads “Was Jan 2026, now Jan 2027, pending”, then “Jan 2027, Accepted” once decided. New and
removed rows start with “New row” or “Removed row”. A row's buttons are named with the row (“Accept Clearwater
Analytics”). A hidden status line announces how many edits are left after each decision. The popover is a dialog
named after the row and column.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.4 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **39.4 KB** | **12.2 KB** |
| With Lit – the first component on a page | 59.0 KB | 18.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.2 ms** | the gallery demo's data, 241 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of rows replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | rows: first render, 1,724 nodes; update 2.2 ms |
| 1,000 items | 72 ms | rows: first render, 16,237 nodes; update 6.9 ms |

1,000 items of rows: 72 ms. It renders every item, so a first render passes 50 ms (a long task) at about 700 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setInterval, cleared`, `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep `reason` to a sentence that says what the AI saw – people decide faster with it.
- Give every row a first column that names it; it labels the row's buttons and the popover.
- Put the current values in `rows` and the proposed ones in `edits`; for a new row, `cells` are the proposed values.

## Do and don't

### Do

- Apply nothing until people have decided; read the verdicts from `tc-decisions-change`.
- Use `defaultDecisions` or `decisions` to restore a review that was left half done.
- Turn `streaming` off when the proposal is complete.

### Don't

- Don't propose more edits than someone can check – split a big cleanup into batches.
- Don't hide the reason for an edit that changes who owns something or whether it's active.
- Don't colour a value without the struck or new marking; it's what makes the change readable.

## Related

- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
- [Extraction Review](extraction-review.md) – Fields pulled from a document, each linked to its place on the page – confidence per field, accept, correct or reject, field by field from the keyboard
- [Pixel Loader](pixel-loader.md) – A small working row – a 5 × 5 grid of dots lit in a wave, a snake, a twinkle or an orbit, a shimmering label and the time since the work started, settling into a check or a cross when it ends
