<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Import Review

**Data & charts** · New

Rows of an import, checked before they land – cell problems in words (missing, not an email, not a date, not a number, or the page's own), duplicates by a key with Keep this and Merge, All / With problems / Duplicates tabs with counts, cells edited in place, skip and restore, and Import held with the reason until nothing's left to fix or problem rows are skipped

- **Element:** `<tc-import-review>`
- **Size:** 11.5 KB gzip · 36.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/import-review";` |
| React / Next.js | `import { ImportReview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/import-review";` · tags starting with tc- are custom elements |
| Angular | `import { ImportReview } from "@adamstavely/trenchcoat/angular/import-review";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/import-review";` |

## Example

The live example is in the gallery at `#/import-review`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The last step of an import: the rows, checked before they land. Every cell is checked against its column – a required
cell left empty, an email that isn't one, a date or a number that can't be read, or the page's own `validate` – and a
cell with a problem is marked and says what's wrong in words. Rows that share a `duplicate-key` value are grouped as
duplicates, each with Keep this (skip the others) and Merge (fill this row's blanks from the others, then skip them).
Tabs filter All, With problems and Duplicates, each with its count. Any cell can be edited in place, any row skipped
or restored. The summary says “412 rows ready, 9 to fix, 3 duplicates”, and Import waits, saying why, until nothing's
left to fix – or until “Skip rows with problems” is ticked.

### When to use

- After `column-mapper`, before rows are written – a vendor list, contacts, assets.
- When some rows will be wrong and people should fix or skip them rather than lose the whole file.
- When the same record may appear twice and people should choose which to keep.

### When not to use

- A table of records already saved, edited like a spreadsheet – use [Data Table](data-table.md).
- Fields read from a document image – use [Extraction Review](extraction-review.md).
- Reading the file or matching its columns – use [File Import](file-import.md) and [Column Mapper](column-mapper.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-imr__tab` – All, With problems and Duplicates, with counts
2. **Grid** `.ui-imr__grid` – one row per record, the row number first and stuck in place when scrolling
3. **Cell** `.ui-imr__cell` – the value; a cell with a problem is tinted and says what's wrong under the value
4. **Status** `.ui-imr__status` – Ready, “2 to fix”, “Duplicate of row 2” or Skipped, with a mark
5. **Actions** `.ui-imr__act` – Keep this and Merge for duplicates, and Skip or Restore
6. **Skip rows with problems** `.ui-imr__check` – lets Import go ahead, leaving those rows and extra duplicates out
7. **Import** `.ui-imr__import` – with how many rows are ready; held, with the reason, while rows need fixing

## Looks

Standard puts the header on the gray tray above a white card and the summary and Import on the tray below. Clean is one
white card with the summary as its last row. `--tc-import-review-height` sets how tall the grid grows before it
scrolls (420px), and `--tc-import-review-cell-w` the widest a column gets (170px).

## Usage

### HTML

```html
<tc-import-review id="review" heading="Review vendors" duplicate-key="email"></tc-import-review>

<script type="module">
  import "@adamstavely/trenchcoat/import-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#review");
  el.columns = [
    { id: "name", label: "Vendor name", required: true },
    { id: "email", label: "Contact email", type: "email", required: true },
    { id: "start", label: "Contract start", type: "date" },
  ];
  el.rows = [
    { id: "r1", cells: { name: "Kestrel Lab Supplies", email: "orders@kestrel-lab.example", start: "2024-03-01" } },
    { id: "r2", cells: { name: "Northfield Survey Co.", email: "hello@northfield", start: "2025-01-06" } },
    { id: "r3", cells: { name: "Kestrel Lab Supplies Ltd", email: "orders@kestrel-lab.example", start: "" } },
  ];
  el.addEventListener("tc-import", (e) => console.log("import", e.detail.rows, "left out", e.detail.skipped));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ImportReview, type ImportReviewColumn, type ImportReviewRow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReviewVendors({ columns, initial, save }: { columns: ImportReviewColumn[]; initial: ImportReviewRow[]; save: (rows: ImportReviewRow[]) => void }) {
  const [rows, setRows] = useState(initial);
  return <ImportReview title="Review vendors" columns={columns} duplicateKey="email" rows={rows} onRowsChange={setRows} onImport={(ok) => save(ok)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/import-review";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";

defineProps<{ columns: TcImportReview["columns"]; rows: TcImportReview["rows"] }>();
const onRowsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-import-review :columns="columns" :rows="rows" @tc-rows-change="onRowsChange"></tc-import-review>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ImportReview } from "@adamstavely/trenchcoat/angular/import-review";
import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";

@Component({
  selector: "app-import-review-example",
  imports: [ImportReview],
  template: `<tc-import-review [columns]="columns()" [rows]="rows()" (tc-rows-change)="onRowsChange($event)"></tc-import-review>`,
})
export class ImportReviewExample {
  readonly columns = input.required<TcImportReview["columns"]>();
  readonly rows = input.required<TcImportReview["rows"]>();
  onRowsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/import-review";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";

  let { columns, rows }: { columns: TcImportReview["columns"]; rows: TcImportReview["rows"] } = $props();
  let el: TcImportReview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-rows-change", on);
    return () => el.removeEventListener("tc-rows-change", on);
  });
</script>

<tc-import-review bind:this={el} {columns} {rows}></tc-import-review>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Review rows"` | The heading |
| `description` | `description` | `string` | `""` | A quiet line under the heading – the file, or where the rows go |
| `columns` | – | `ImportReviewColumn[]` | `[]` | The columns, in order, with their type and whether they're required |
| `rows` | – | `ImportReviewRow[]` | `[]` | The rows – the value. Changed by editing, skipping, keeping and merging unless a tc-rows-change listener calls preventDefault() |
| `duplicateKey` | `duplicate-key` | `string \| undefined` | `undefined` | The column whose value makes rows duplicates – an email, an id. None: no duplicate check |
| `validate` | – | `ImportReviewValidator \| undefined` | `undefined` | The page's own check per cell, after the built-in ones: the problem in words, or null |
| `filter` | `filter` | `ImportReviewFilter` | `"all"` | Which rows the table shows. Changed by the tabs unless a tc-filter-change listener calls preventDefault() |
| `skipProblems` | `skip-problems` | `boolean` | `false` | Import leaves out rows with problems and extra duplicates instead of waiting for them. Changed by its checkbox unless a tc-skip-problems-change listener calls preventDefault() |
| `pageSize` | `page-size` | `number` | `50` | Rows shown at first, and added by Show more rows |
| `labels` | – | `Partial<ImportReviewLabels>` | `{}` | Words the page can rename, merged over defaultImportReviewLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-rows-change` | – | Yes | A cell was edited, or a row skipped, restored, kept or merged ({ rows, change, id }: ImportReviewRowsChange); cancelable – prevented, `rows` stays as it was |
| `tc-filter-change` | – | Yes | A filter tab was chosen ({ filter }: ImportReviewFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-skip-problems-change` | – | Yes | "Skip rows with problems" was switched ({ skipProblems }: ImportReviewSkipProblemsChange); cancelable – prevented, `skipProblems` stays as it was |
| `tc-import` | – | Yes | Import was pressed with nothing left to fix, or with rows with problems skipped ({ rows, skipped }: ImportReviewImport); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-import-review-height` | `420px` | standard, clean |
| `--tc-import-review-cell-w` | `170px` | standard, clean |

#### Design tokens it reads (62)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-imr-cols`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `cellProblem(value: string, column: ImportReviewColumn, row: ImportReviewRow, validate?: ImportReviewValidator, labels: Partial<ImportReviewLabels>): string \| null` | A cell's problem in words, or null: required and empty, then the column's type, then the page's own check |
| `duplicateGroups(rows: ImportReviewRow[], key: string \| undefined): ImportReviewRow[][]` | Groups of rows (not skipped) that share a key value, in the order they first appear; groups of one are left out |

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
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-import-review :columns="…">` | `<tc-import-review [columns]="…">` | `<tc-import-review {columns}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-import-review :rows="…">` | `<tc-import-review [rows]="…">` | `<tc-import-review {rows}>` |
| `validate` | `el.validate = …;` | `<… validate={…} />` | `<tc-import-review :validate="…">` | `<tc-import-review [validate]="…">` | `<tc-import-review {validate}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-import-review :labels="…">` | `<tc-import-review [labels]="…">` | `<tc-import-review {labels}>` |

*Also attributes: `heading`, `description`, `duplicate-key`, `filter`, `skip-problems`, `page-size` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-rows-change` | Yes | `el.addEventListener("tc-rows-change", (e) => …)` | `ref.current.addEventListener("tc-rows-change", …)` | `@tc-rows-change="…"` | `(tc-rows-change)="…($event)"` | `el.addEventListener("tc-rows-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-skip-problems-change` | Yes | `el.addEventListener("tc-skip-problems-change", (e) => …)` | `onSkipProblemsChange={…}` | `@tc-skip-problems-change="…"` | `(tc-skip-problems-change)="…($event)"` | `el.addEventListener("tc-skip-problems-change", …)` |
| `tc-import` | Yes | `el.addEventListener("tc-import", (e) => …)` | `onImport={…}` | `@tc-import="…"` | `(tc-import)="…($event)"` | `el.addEventListener("tc-import", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `rows`, `filter` and `skipProblems` itself unless a listener calls `preventDefault()` on `tc-rows-change`, `tc-filter-change` or `tc-skip-problems-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-import-review id="import-review"></tc-import-review>

<script type="module">
  import "@adamstavely/trenchcoat/import-review";

  const el = document.querySelector("#import-review");
  el.addEventListener("tc-rows-change", (e) => {
    e.preventDefault(); // the element keeps its rows…
    if (allowed(e.detail.rows)) el.rows = e.detail.rows; // …until the app sets it
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
import "@adamstavely/trenchcoat/import-review";
import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";

const props = defineProps<{ initial: TcImportReview["rows"] }>();
const rows = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRowsChange = (e: CustomEvent<{ rows: TcImportReview["rows"] }>) => {
  e.preventDefault();
  rows.value = e.detail.rows;
};
</script>

<template>
  <tc-import-review :rows="rows" @tc-rows-change="onRowsChange"></tc-import-review>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ImportReview } from "@adamstavely/trenchcoat/angular/import-review";
import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";

@Component({
  selector: "app-controlled-import-review",
  imports: [ImportReview],
  template: `<tc-import-review [rows]="rows()" (tc-rows-change)="onRowsChange($event)"></tc-import-review>`,
})
export class ControlledImportReview {
  readonly initial = input.required<TcImportReview["rows"]>();
  readonly rows = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRowsChange(e: CustomEvent<{ rows: TcImportReview["rows"] }>) {
    e.preventDefault();
    this.rows.set(e.detail.rows);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/import-review";
  import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";

  let { initial }: { initial: TcImportReview["rows"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let rows = $derived(initial);
  let el: TcImportReview;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      rows = (e as CustomEvent<{ rows: TcImportReview["rows"] }>).detail.rows;
    };
    el.addEventListener("tc-rows-change", on);
    return () => el.removeEventListener("tc-rows-change", on);
  });
</script>

<tc-import-review bind:this={el} {rows}></tc-import-review>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-import-review")` returns a `TcImportReview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";`
- **React / Next.js:** Props: `import type { ImportReviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ImportReview>`. The element class, for refs: `import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcImportReview["columns"]` with `import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";`
- **Angular:** The directive types the template: `[columns]` takes `TcImportReview["columns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcImportReview } from "@adamstavely/trenchcoat/import-review";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `rows` | `ImportReviewRow[]` | The rows. Controlled when defined – pass back what onRowsChange reports |
| `defaultRows` | `ImportReviewRow[]` | The starting rows when uncontrolled |
| `onRowsChange` | `(rows: ImportReviewRow[], change: ImportReviewChangeKind, id: string) => void` | A cell was edited, or a row skipped, restored, kept or merged: every row, what was done and to which row |
| `filter` | `ImportReviewFilter` | Which rows the table shows. Controlled when defined |
| `defaultFilter` | `ImportReviewFilter` | The starting tab when uncontrolled |
| `onFilterChange` | `(filter: ImportReviewFilter) => void` | A filter tab was chosen |
| `skipProblems` | `boolean` | Whether Import leaves out rows with problems and extra duplicates. Controlled when defined |
| `defaultSkipProblems` | `boolean` | The starting choice when uncontrolled |
| `onSkipProblemsChange` | `(skipProblems: boolean) => void` | "Skip rows with problems" was switched |
| `onImport` | `(rows: ImportReviewRow[], skipped: ImportReviewRow[]) => boolean \| void` | Import was pressed: the rows to import and the rows left out. Return false to say it didn't happen |

*Renamed or hidden on the wrapper: `heading`, `Skip rows with problems`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| ← / → | Moves along the row: the row number, each cell, the status, the actions |
| ↑ / ↓ | Moves to the row above or below |
| Home / End | First or last cell of the row |
| Ctrl Home / Ctrl End | First or last row |
| Page Up / Page Down | Ten rows up or down |
| Enter or F2 (on a cell) | Edits it; Enter saves, Escape cancels |
| Enter or Space (on an action) | Presses it |
| ← / → (on the tabs) | Moves between All, With problems and Duplicates |

### Screen readers

The tabs are a `tablist` controlling the grid's `tabpanel`; each tab reads its count (“With problems, 3”). The grid is
named by the heading, with column headers (required ones say so) and a `rowheader` per row (“Row 4”). A cell with a
problem reads its value and the problem (“hello@northfield, Not an email address”); an empty one reads “empty”. The
status cell reads every problem in the row in words. Actions name their row (“Keep this, row 2”). The edit field is
labelled by its column and row and described by “Enter saves, Escape cancels”. A status region says what happened
(“Row 4 skipped”, “Merged 2 rows into row 2”, “Contact email in row 3 changed”). Import is `aria-disabled` and
described by why (“To import, fix 3 rows and resolve 1 duplicate, or skip rows with problems”).

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
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 29.3 KB | 9.4 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.8 KB** | **11.5 KB** |
| With Lit – the first component on a page | 59.9 KB | 19.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.6 ms** | the gallery demo's data, 283 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of rows replaced |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |
| 100 items | 15 ms | rows: first render, 1,365 nodes; update 1.6 ms |
| 1,000 items | 12 ms | rows: first render, 1,365 nodes; update 2.0 ms |

1,000 items of rows: 12 ms, 1,365 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name columns as in your app, and mark `required` only what a record can't be saved without.
- Write `validate` messages as the problem, in a few words: “Not a known country”, “Before the contract start”.
- Pick a `duplicate-key` that really identifies a record – an email or an external id, not a name.

## Do and don't

### Do

- Keep `rows` with the import job, so fixes survive going back a step.
- Let people skip what they can't fix now; they can import the rest and come back.
- Show the left-out rows afterwards – `tc-import` hands them over as `skipped`.

### Don't

- Don't fix values for people silently; mark them, and let people edit or skip.
- Don't import duplicates without asking – Keep this and Merge are one press each.
- Don't use it for thousands of rows at once without `page-size`; Show more rows adds a page at a time.

## Related

- [File Import](file-import.md) – Drop a spreadsheet and see what was read – the rows and columns found, the delimiter and encoding, a "First row is headers" switch, the first rows with each column's type in words, problems in words (rows of the wrong length, empty columns, a header named twice), and Continue; CSV and TSV read in the browser, Excel through the page
- [Column Mapper](column-mapper.md) – A model matches a file's columns to your fields – a select per column prefilled from its suggestion, "Suggested" with the confidence in a word, Use suggestion once changed, Accept all suggestions, and required fields left out or fields matched twice said in words before Continue
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Extraction Review](extraction-review.md) – Fields pulled from a document, each linked to its place on the page – confidence per field, accept, correct or reject, field by field from the keyboard
