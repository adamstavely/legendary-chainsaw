<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Enrichment Grid

**Data & charts** · New

A table a model fills in, cell by cell – source columns and sparkle-marked AI columns with their prompt on the header, each cell queued, filling, done with its confidence and source, failed with Retry, or to review; the run counted in words with the time left, Pause / Resume and Retry failed, and only the rows in view drawn

- **Element:** `<tc-enrichment-grid>`
- **Size:** 10.3 KB gzip · 31.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/enrichment-grid";` |
| React / Next.js | `import { EnrichmentGrid } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/enrichment-grid";` · tags starting with tc- are custom elements |
| Angular | `import { EnrichmentGrid } from "@adamstavely/trenchcoat/angular/enrichment-grid";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/enrichment-grid";` |

## Example

The live example is in the gallery at `#/enrichment-grid`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A table a model fills in, cell by cell. The source columns are what you already have – a vendor, a website, a country.
The AI columns, marked with a sparkle, are filled by a prompt run on every row; the prompt shows when you point at or
focus the column's header. Each AI cell says where it stands: queued, filling, done (with how sure the model was and a
link to its source), failed (with Retry), or Review when a person should look. The header counts the run in words –
"1,204 of 2,000 cells · 3 failed · ~4 min left" – and the bar under it has Pause / Resume and Retry failed. Only the rows
in view are drawn, so a table of thousands of rows scrolls smoothly.

### When to use

- Enriching a list – vendors, papers, accounts – with columns a model fills from the web or documents.
- A long-running bulk run people watch, pause and fix as it goes.
- Beside a cell inspector, where picking a cell shows why it says what it says.

### When not to use

- A spreadsheet people edit by hand – use [Data Table](data-table.md).
- One job fanned out to workers, where each task is a single square – use [Fan-out Grid](fan-out-grid.md).
- Setting up the AI column itself – use [AI Column Create](ai-column-create.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-eng__bar` – a thin meter of the cells filled and failed, with the run's actions
2. **Pause / Resume** `.ui-eng__run` – holds the run or carries it on
3. **Retry failed** `.ui-eng__retry-all` – sends every failed cell again
4. **Grid** `.ui-eng__grid` – the rows, scrolled in `.ui-eng__scroll`, drawn only in view
5. **Column header** `.ui-eng__colhead` – an AI column's has a sparkle `.ui-eng__spark`
6. **Prompt** `.ui-eng__tip` – the AI column's prompt, on hover or focus
7. **Cell** `.ui-eng__cell` – source text, or an AI cell's state and value
8. **Confidence** `.ui-eng__conf` – how sure the model was, "Low" under the threshold
9. **Review** `.ui-eng__review` – a value a person should look at
10. **Source** `.ui-eng__source` – where the value came from
11. **Shimmer** `.ui-eng__shim` – a cell being filled

## Looks

Standard puts the header on the gray tray above a white card holding the bar and the grid. Clean is one white card with
the header its first row. The grid scrolls inside the card, up to `--tc-eng-h` (420 px) tall; a page can change it, the
row height (`--tc-eng-row-h`, 36 px) and the column widths (`--tc-eng-col-w`, `--tc-eng-ai-w`). Narrow, the bar wraps
and the grid scrolls sideways.

## Usage

### HTML

```html
<tc-enrichment-grid id="vendors" heading="Vendor list" running></tc-enrichment-grid>

<script type="module">
  import "@adamstavely/trenchcoat/enrichment-grid";
  import "@adamstavely/trenchcoat/tokens.css";

  const grid = document.querySelector("#vendors");
  grid.columns = [
    { id: "vendor", label: "Vendor" },
    { id: "website", label: "Website" },
    { id: "industry", label: "Industry", ai: true, prompt: "What industry is {{vendor}} in?" },
  ];
  grid.rows = [
    { id: "v1", cells: { vendor: "Northwind Labs", website: "northwind.example", industry: { state: "done", value: "Software", confidence: 0.92 } } },
    { id: "v2", cells: { vendor: "Cedarfield Supply", website: "cedarfield.example", industry: { state: "running" } } },
    { id: "v3", cells: { vendor: "Harborstone Print", website: "harborstone.example", industry: { state: "failed", note: "The website didn't load" } } },
  ];
  grid.remaining = 240000;
  grid.addEventListener("tc-retry", (e) => console.log("Retry", e.detail.cells));
  grid.addEventListener("tc-cell-select", (e) => console.log("Picked", e.detail.row, e.detail.column));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EnrichmentGrid, type EnrichmentColumn, type EnrichmentRow, type EnrichmentSelection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Vendors({ columns, rows, onRetry }: { columns: EnrichmentColumn[]; rows: EnrichmentRow[]; onRetry: (cells: EnrichmentSelection[]) => void }) {
  const [running, setRunning] = useState(true);
  const [picked, setPicked] = useState<EnrichmentSelection | null>(null);
  return (
    <EnrichmentGrid
      title="Vendor list"
      columns={columns}
      rows={rows}
      running={running}
      onRunChange={setRunning}
      selected={picked}
      onCellSelect={(selected) => setPicked(selected)}
      onRetry={onRetry}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/enrichment-grid";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";

defineProps<{ columns: TcEnrichmentGrid["columns"]; rows: TcEnrichmentGrid["rows"] }>();
const onRunChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-enrichment-grid :columns="columns" :rows="rows" @tc-run-change="onRunChange"></tc-enrichment-grid>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EnrichmentGrid } from "@adamstavely/trenchcoat/angular/enrichment-grid";
import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";

@Component({
  selector: "app-enrichment-grid-example",
  imports: [EnrichmentGrid],
  template: `<tc-enrichment-grid [columns]="columns()" [rows]="rows()" (tc-run-change)="onRunChange($event)"></tc-enrichment-grid>`,
})
export class EnrichmentGridExample {
  readonly columns = input.required<TcEnrichmentGrid["columns"]>();
  readonly rows = input.required<TcEnrichmentGrid["rows"]>();
  onRunChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/enrichment-grid";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";

  let { columns, rows }: { columns: TcEnrichmentGrid["columns"]; rows: TcEnrichmentGrid["rows"] } = $props();
  let el: TcEnrichmentGrid;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-run-change", on);
    return () => el.removeEventListener("tc-run-change", on);
  });
</script>

<tc-enrichment-grid bind:this={el} {columns} {rows}></tc-enrichment-grid>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Enrichment"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading – what's being enriched |
| `columns` | – | `EnrichmentColumn[]` | `[]` | The columns, in order – source columns and AI columns |
| `rows` | – | `EnrichmentRow[]` | `[]` | The rows – source text and AI cells by column id |
| `running` | `running` | `boolean` | `false` | Whether the run is going. Changed by Pause and Resume unless a tc-run-change listener calls preventDefault() |
| `remaining` | `remaining` | `number \| undefined` | `undefined` | Time left in the run, in ms – the header says "~4 min left" |
| `selected` | – | `EnrichmentSelection \| null` | `null` | The picked cell (null: none). Changed by picking a cell unless a tc-cell-select listener calls preventDefault() |
| `threshold` | `threshold` | `number` | `0.6` | Confidence below this (0–1) is called low |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for the counts and percentages |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-run-change` | – | Yes | Pause or Resume was pressed ({ running }: EnrichmentRunChange); cancelable – prevented, `running` stays as it was |
| `tc-retry` | – | Yes | Retry failed, or R on a failed cell ({ cells }: EnrichmentRetry); cancelable – prevented, nothing is announced |
| `tc-cell-select` | – | Yes | A cell was picked with a click, Enter or Space ({ row, column, cell, selected }: EnrichmentCellSelect); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-eng-row-h` | `36px` | standard, clean |
| `--tc-eng-h` | `420px` | standard, clean |
| `--tc-eng-col-w` | `140px` | standard, clean |
| `--tc-eng-ai-w` | `180px` | standard, clean |
| `--tc-eng-meter-h` | `4px` | standard, clean |
| `--tc-eng-tip-w` | `280px` | standard, clean |
| `--tc-eng-pick-w` | `2px` | standard, clean |

#### Design tokens it reads (71)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eng-cols`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `enrichmentCell(row: EnrichmentRow, column: string): EnrichmentCell` | The AI cell at a row and column – a missing one is queued |
| `enrichmentProgress(columns: readonly EnrichmentColumn[], rows: readonly EnrichmentRow[]): EnrichmentProgress` | Counts every AI cell by state |
| `enrichmentTimeLeft(ms: number): string` | Time left in words – "~4 min left", "under a minute left" |

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
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-enrichment-grid :columns="…">` | `<tc-enrichment-grid [columns]="…">` | `<tc-enrichment-grid {columns}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-enrichment-grid :rows="…">` | `<tc-enrichment-grid [rows]="…">` | `<tc-enrichment-grid {rows}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-enrichment-grid :selected="…">` | `<tc-enrichment-grid [selected]="…">` | `<tc-enrichment-grid {selected}>` |

*Also attributes: `heading`, `description`, `running`, `remaining`, `threshold`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-run-change` | Yes | `el.addEventListener("tc-run-change", (e) => …)` | `onRunChange={…}` | `@tc-run-change="…"` | `(tc-run-change)="…($event)"` | `el.addEventListener("tc-run-change", …)` |
| `tc-retry` | Yes | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-cell-select` | Yes | `el.addEventListener("tc-cell-select", (e) => …)` | `ref.current.addEventListener("tc-cell-select", …)` | `@tc-cell-select="…"` | `(tc-cell-select)="…($event)"` | `el.addEventListener("tc-cell-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `running` and `selected` itself unless a listener calls `preventDefault()` on `tc-run-change` or `tc-cell-select` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-enrichment-grid id="enrichment-grid"></tc-enrichment-grid>

<script type="module">
  import "@adamstavely/trenchcoat/enrichment-grid";

  const el = document.querySelector("#enrichment-grid");
  el.addEventListener("tc-run-change", (e) => {
    e.preventDefault(); // the element keeps its running…
    if (allowed(e.detail.running)) el.running = e.detail.running; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { EnrichmentGrid } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof EnrichmentGrid>;
type Props = Omit<Own, "running" | "onRunChange"> & { initial: NonNullable<Own["running"]> };

// Controlled: passing running makes the wrapper prevent the element's own change; the app sets it
export function ControlledEnrichmentGrid({ initial, ...props }: Props) {
  const [running, setRunning] = useState<Own["running"]>(initial);
  return <EnrichmentGrid {...props} running={running} onRunChange={(next) => setRunning(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/enrichment-grid";
import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";

const props = defineProps<{ initial: TcEnrichmentGrid["running"] }>();
const running = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRunChange = (e: CustomEvent<{ running: TcEnrichmentGrid["running"] }>) => {
  e.preventDefault();
  running.value = e.detail.running;
};
</script>

<template>
  <tc-enrichment-grid :running="running" @tc-run-change="onRunChange"></tc-enrichment-grid>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EnrichmentGrid } from "@adamstavely/trenchcoat/angular/enrichment-grid";
import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";

@Component({
  selector: "app-controlled-enrichment-grid",
  imports: [EnrichmentGrid],
  template: `<tc-enrichment-grid [running]="running()" (tc-run-change)="onRunChange($event)"></tc-enrichment-grid>`,
})
export class ControlledEnrichmentGrid {
  readonly initial = input.required<TcEnrichmentGrid["running"]>();
  readonly running = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRunChange(e: CustomEvent<{ running: TcEnrichmentGrid["running"] }>) {
    e.preventDefault();
    this.running.set(e.detail.running);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/enrichment-grid";
  import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";

  let { initial }: { initial: TcEnrichmentGrid["running"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let running = $derived(initial);
  let el: TcEnrichmentGrid;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      running = (e as CustomEvent<{ running: TcEnrichmentGrid["running"] }>).detail.running;
    };
    el.addEventListener("tc-run-change", on);
    return () => el.removeEventListener("tc-run-change", on);
  });
</script>

<tc-enrichment-grid bind:this={el} {running}></tc-enrichment-grid>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-enrichment-grid")` returns a `TcEnrichmentGrid` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";`
- **React / Next.js:** Props: `import type { EnrichmentGridProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EnrichmentGrid>`. The element class, for refs: `import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEnrichmentGrid["columns"]` with `import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";`
- **Angular:** The directive types the template: `[columns]` takes `TcEnrichmentGrid["columns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEnrichmentGrid } from "@adamstavely/trenchcoat/enrichment-grid";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `running` | `boolean` | Whether the run is going. Controlled when defined – pass back what onRunChange reports |
| `defaultRunning` | `boolean` | Whether the run starts going, when uncontrolled |
| `onRunChange` | `(running: boolean) => void` | Pause or Resume was pressed |
| `selected` | `EnrichmentSelection \| null` | The picked cell. Controlled when defined |
| `defaultSelected` | `EnrichmentSelection \| null` | The cell picked at first, when uncontrolled |
| `onCellSelect` | `(selected: EnrichmentSelection, cell: EnrichmentCell \| string \| null) => void` | A cell was picked: where it is and what's in it |
| `onRetry` | `(cells: EnrichmentSelection[]) => void \| boolean` | Retry failed, or R on a failed cell: the cells to run again. Return false to stop it being announced |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The grid is one tab stop.

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move cell by cell; up from the first row reaches the column headers |
| Home / End | The row's first or last cell |
| Ctrl + Home / Ctrl + End | The first or last row |
| Page Up / Page Down | A screenful up or down |
| Enter / Space | Pick the cell |
| R | Retry a failed cell |
| Escape (on a header) | Hide the prompt |

### Screen readers

The table is a `grid` named by the heading, with `aria-rowcount` for every row, so the rows not drawn still count; each
row has its `aria-rowindex`. The first column's cells are row headers. AI column headers say "(AI column)" and carry the
prompt as their description. Each AI cell reads its value, "Filling", "Queued", "Failed" or "Review", and the
confidence as a percentage; the cell's keys are in a hidden description. While cells are being filled the grid is
`aria-busy`. Pausing, resuming, retrying, picking a cell and the end of the run are announced through `role="status"`.

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This component alone** | 24.2 KB | 8.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.9 KB** | **10.3 KB** |
| With Lit – the first component on a page | 52.6 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **5.6 ms** | the gallery demo's data, 610 DOM nodes – to layout, median of 7 |
| Typical update | **1.6 ms** | one item of rows replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.3 ms | rows: first render, 607 nodes; update 1.3 ms |
| 1,000 items | 4.0 ms | rows: first render, 610 nodes; update 1.4 ms |

1,000 items of rows: 4.0 ms, 610 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name AI columns for what they hold: "Headquarters city", not "Prompt 3".
- Write prompts that answer in a few words – the cell shows one line.
- Pass `confidence` when the model gives one; a low one is called out.
- Use `note` on a failed cell for what went wrong, and on a review cell for why to look.

## Do and don't

### Do

- Keep `rows` in the page and update cells as they finish; the element only draws them.
- Set `remaining` from the run's pace so the header can say the time left.
- Put a cell inspector beside the grid and fill it from `tc-cell-select`.

### Don't

- Don't render tens of thousands of rows without paging on the server – the grid draws only what's in view, but the
  page still holds every row.
- Don't hide failed cells – Retry failed needs them in the table.

## Related

- [AI Column Create](ai-column-create.md) – One prompt filled in for every row of a table – the column's name and what it holds (text, number, yes or no, choices, link or JSON), the prompt with the table's columns as {{variables}} inserted from chips and unknown ones called out, the model and web search, Try on 3 rows with the answers shown, and Create column beside the run's estimate
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
