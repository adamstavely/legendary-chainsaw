<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Data Table

**Data & charts** · Also in React

Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

- **Element:** `<tc-data-table>`
- **Size:** 16.7 KB gzip · 63.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/data-table";` |
| React / Next.js | `import { DataTable } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/data-table";` · tags starting with tc- are custom elements |
| Angular | `import { DataTable } from "@adamstavely/trenchcoat/angular/data-table";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/data-table";` |

## Example

The live example is in the gallery at `#/data-table`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A database-style table that works like a small spreadsheet. People select a cell or drag across a range, edit in
place by typing or double-clicking, copy and paste blocks to and from Excel or Google Sheets, undo and redo, sort by
any column, and check rows to delete them together. Columns can hold a title with a logo, coloured tags with a picker,
links, numbers or text, and a range of numbers shows its sum in the footer. Above 60 rows only the rows near the
viewport render, so it stays quick with thousands of rows.

### When to use

- Records people edit in bulk – accounts, contacts, inventory, line items – where a form per row would be slow.
- Data people move between the product and a spreadsheet by copy and paste.
- Lists long enough to sort, from a handful of rows to tens of thousands.

### When not to use

- Narrowing a table by several facets – pair it with [Filter Menu](filter-menu.md); the table itself doesn't filter.
- Showing how a total splits up, where the shape matters more than the numbers – use [Breakdown Chart](breakdown-chart.md).
- One metric over time – use [KPI Chart](kpi-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon (a table unless you give one), the name, and Undo and Redo
2. **Column header** `.ui-dt__th` – the column's icon and label; click to sort
3. **Checkbox** `.ui-dt__check` – checks a row; the one in the header checks them all
4. **Title cell** `.ui-dt__name` – the row's logo and name
5. **Tag** `.ui-dt__tag` – a value from a set list, picked from a menu when edited
6. **Footer** `.ui-dt__foot` – Add row or the bulk actions, and the range's count and sum

## Looks

Standard sets the title and the footer on a gray tray with the table on a white card between them; rows are 44px high
with square checkbox cells, and tags are coloured pills. Clean has no tray: one white card with hairline shadows, 40px rows divided by hairlines
only, 12px gray header labels, a soft blue fill for selected cells, and the footer as the card's last row.

## Usage

### HTML

```html
<tc-data-table id="accounts" heading="Accounts"></tc-data-table>

<script type="module">
  import "@adamstavely/trenchcoat/data-table";
  import "@adamstavely/trenchcoat/tokens.css";

  const table = document.querySelector("#accounts");
  table.columns = [
    { key: "name", label: "Company", type: "title", width: "170px" },
    { key: "stage", label: "Stage", type: "tag", options: ["Lead", "Qualified", "Customer"] },
    { key: "arr", label: "ARR ($)", type: "number" },
    { key: "owner", label: "Owner", editable: false },
  ];
  table.rows = [
    { id: "r1", name: "Linear", stage: "Customer", arr: 48000, owner: "Maya" },
    { id: "r2", name: "Vercel", stage: "Qualified", arr: 38000, owner: "Leo" },
  ];
  table.tagTones = { Lead: "gray", Qualified: "violet", Customer: "green" };
  table.addEventListener("tc-rows-change", (e) => console.log(e.detail.rows));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DataTable, type DataColumn, type DataRow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const columns: DataColumn[] = [
  { key: "name", label: "Company", type: "title", width: "170px" },
  { key: "stage", label: "Stage", type: "tag", options: ["Lead", "Qualified", "Customer"] },
  { key: "arr", label: "ARR ($)", type: "number" },
  { key: "owner", label: "Owner", editable: false },
];

export function Accounts({ initial }: { initial: DataRow[] }) {
  const [rows, setRows] = useState(initial);
  return <DataTable title="Accounts" columns={columns} rows={rows} onRowsChange={setRows} tagTones={{ Customer: "green" }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/data-table";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";

defineProps<{ icon: TcDataTable["icon"]; columns: TcDataTable["columns"] }>();
const onRowsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-data-table :icon="icon" :columns="columns" @tc-rows-change="onRowsChange"></tc-data-table>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DataTable } from "@adamstavely/trenchcoat/angular/data-table";
import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";

@Component({
  selector: "app-data-table-example",
  imports: [DataTable],
  template: `<tc-data-table [icon]="icon()" [columns]="columns()" (tc-rows-change)="onRowsChange($event)"></tc-data-table>`,
})
export class DataTableExample {
  readonly icon = input.required<TcDataTable["icon"]>();
  readonly columns = input.required<TcDataTable["columns"]>();
  onRowsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-table";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";

  let { icon, columns }: { icon: TcDataTable["icon"]; columns: TcDataTable["columns"] } = $props();
  let el: TcDataTable;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-rows-change", on);
    return () => el.removeEventListener("tc-rows-change", on);
  });
</script>

<tc-data-table bind:this={el} {icon} {columns}></tc-data-table>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The table's name: its heading and the grid's label |
| `icon` | – | `Element \| undefined` | `undefined` | An icon element in front of the heading (cloned) |
| `columns` | – | `DataColumn[]` | `[]` | The columns, left to right: each one's key, label, type, width and whether it can be edited |
| `rows` | – | `DataRow[]` | `[]` | The rows. Edits change them unless a tc-rows-change listener calls preventDefault() |
| `selection` | – | `string[]` | `[]` | Ids of the checked rows |
| `sort` | – | `DataSort` | `null` | Sort; null shows the rows in their own order |
| `tagTones` | – | `Record<string, TagTone>` | `{}` | Tag colors by tag text – falls back to blue |
| `readonly` | `readonly` | `boolean` | `false` | Read only: no editing, adding or deleting; cell selection and copy still work, and the row checkboxes hide unless `selectable` is set |
| `selectable` | `selectable` | `boolean \| undefined` | `undefined` | Whether rows have selection checkboxes; unset, they show unless the table is `readonly` |
| `renderCell` | – | `((row: DataRow, column: DataColumn) => Node \| string \| undefined) \| undefined` | `undefined` | Draw a cell yourself: return a Node or a string, or undefined for the default |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-rows-change` | `RowsChange` | Yes | Rows were edited, pasted, cleared, added, deleted, undone or redone ({ rows }); cancelable |
| `tc-selection-change` | `SelectionChange` | Yes | Rows were checked or unchecked ({ selection }); cancelable |
| `tc-sort-change` | `SortChange` | Yes | The sort changed ({ sort }); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-data-table-header-bg-active` | `light-dark(#fafbff, rgba(47, 107, 255, 0.08))` | standard |
| `--tc-data-table-cell-border-inactive` | `light-dark(rgba(0, 96, 226, 0.35), rgba(77, 141, 255, 0.5))` | standard, clean |

#### Design tokens it reads (99)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-data-table-tag-bg`, `--tc-data-table-tag-fg`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-quick`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-inverse`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-data-table :icon="…">` | `<tc-data-table [icon]="…">` | `<tc-data-table {icon}>` |
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-data-table :columns="…">` | `<tc-data-table [columns]="…">` | `<tc-data-table {columns}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-data-table :rows="…">` | `<tc-data-table [rows]="…">` | `<tc-data-table {rows}>` |
| `selection` | `el.selection = …;` | `<… selection={…} />` | `<tc-data-table :selection="…">` | `<tc-data-table [selection]="…">` | `<tc-data-table {selection}>` |
| `sort` | `el.sort = …;` | `<… sort={…} />` | `<tc-data-table :sort="…">` | `<tc-data-table [sort]="…">` | `<tc-data-table {sort}>` |
| `tagTones` | `el.tagTones = …;` | `<… tagTones={…} />` | `<tc-data-table :tagTones="…">` | `<tc-data-table [tagTones]="…">` | `<tc-data-table {tagTones}>` |
| `renderCell` | `el.renderCell = …;` | `<… renderCell={…} />` | `<tc-data-table :renderCell="…">` | `<tc-data-table [renderCell]="…">` | `<tc-data-table {renderCell}>` |

*Also attributes: `heading`, `readonly`, `selectable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-rows-change` | Yes | `el.addEventListener("tc-rows-change", (e) => …)` | `onRowsChange={…}` | `@tc-rows-change="…"` | `(tc-rows-change)="…($event)"` | `el.addEventListener("tc-rows-change", …)` |
| `tc-selection-change` | Yes | `el.addEventListener("tc-selection-change", (e) => …)` | `onSelectionChange={…}` | `@tc-selection-change="…"` | `(tc-selection-change)="…($event)"` | `el.addEventListener("tc-selection-change", …)` |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `onSortChange={…}` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |

### Controlled

The element changes `rows`, `selection` and `sort` itself unless a listener calls `preventDefault()` on `tc-rows-change`, `tc-selection-change` or `tc-sort-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-data-table id="data-table"></tc-data-table>

<script type="module">
  import "@adamstavely/trenchcoat/data-table";

  const el = document.querySelector("#data-table");
  el.addEventListener("tc-rows-change", (e) => {
    e.preventDefault(); // the element keeps its rows…
    if (allowed(e.detail.rows)) el.rows = e.detail.rows; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { DataTable } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DataTable>;
type Props = Omit<Own, "rows" | "onRowsChange"> & { initial: NonNullable<Own["rows"]> };

// Controlled: passing rows makes the wrapper prevent the element's own change; the app sets it
export function ControlledDataTable({ initial, ...props }: Props) {
  const [rows, setRows] = useState<Own["rows"]>(initial);
  return <DataTable {...props} rows={rows} onRowsChange={(next) => setRows(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/data-table";
import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";

const props = defineProps<{ initial: TcDataTable["rows"] }>();
const rows = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRowsChange = (e: CustomEvent<{ rows: TcDataTable["rows"] }>) => {
  e.preventDefault();
  rows.value = e.detail.rows;
};
</script>

<template>
  <tc-data-table :rows="rows" @tc-rows-change="onRowsChange"></tc-data-table>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DataTable } from "@adamstavely/trenchcoat/angular/data-table";
import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";

@Component({
  selector: "app-controlled-data-table",
  imports: [DataTable],
  template: `<tc-data-table [rows]="rows()" (tc-rows-change)="onRowsChange($event)"></tc-data-table>`,
})
export class ControlledDataTable {
  readonly initial = input.required<TcDataTable["rows"]>();
  readonly rows = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRowsChange(e: CustomEvent<{ rows: TcDataTable["rows"] }>) {
    e.preventDefault();
    this.rows.set(e.detail.rows);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-table";
  import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";

  let { initial }: { initial: TcDataTable["rows"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let rows = $derived(initial);
  let el: TcDataTable;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      rows = (e as CustomEvent<{ rows: TcDataTable["rows"] }>).detail.rows;
    };
    el.addEventListener("tc-rows-change", on);
    return () => el.removeEventListener("tc-rows-change", on);
  });
</script>

<tc-data-table bind:this={el} {rows}></tc-data-table>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-data-table")` returns a `TcDataTable` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";`
- **React / Next.js:** Props: `import type { DataTableProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DataTable>`. The element class, for refs: `import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDataTable["icon"]` with `import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";`
- **Angular:** The directive types the template: `[icon]` takes `TcDataTable["icon"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDataTable } from "@adamstavely/trenchcoat/data-table";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `renderCell` | `(row: DataRow, column: DataColumn) => Node \| string \| undefined` | Draws a cell itself: a DOM node or a string; undefined leaves the cell to the table. Gets the row as the app gave it |
| `title` | `string` | The table's heading and the grid's name |
| `icon` | `React.ReactNode` | Icon in front of the title |
| `columns` | `DataColumn[]` | The columns, left to right: each one's key, label, type, width and whether it can be edited |
| `rows` | `DataRow[]` | The rows (controlled) – pair it with `onRowsChange` |
| `defaultRows` | `DataRow[]` | The rows to start with when `rows` isn't controlled |
| `onRowsChange` | `(rows: DataRow[]) => void` | Called with every row after an edit, paste, clear, add, delete, undo or redo |
| `selection` | `string[]` | Ids of the checked rows (controlled) – pair it with `onSelectionChange` |
| `defaultSelection` | `string[]` | The checked rows to start with when `selection` isn't controlled |
| `onSelectionChange` | `(ids: string[]) => void` | Called with the ids of the checked rows whenever a row is checked or unchecked |
| `sort` | `DataSort` | The sorted column and direction, or null for the rows' own order (controlled) |
| `defaultSort` | `DataSort` | The sort to start with when `sort` isn't controlled |
| `onSortChange` | `(sort: DataSort) => void` | Called when a column header changes the sort |
| `editable` | `boolean` | false turns the table read only – it also hides the row checkboxes unless `selectable` is true |
| `selectable` | `boolean` | Whether rows have selection checkboxes; unset, they show unless `editable` is false |

*Renamed or hidden on the wrapper: `rows`, `selection`, `sort`, `heading`, `readonly`, `columns`, `icon`, `renderCell`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves focus into and out of the grid – one tab stop for all the cells |
| ← / → / ↑ / ↓ | Moves the active cell; with Shift, extends the range |
| ⌘/Ctrl + arrow | Jumps to the first or last row or column |
| Home / End | Jumps to the first or last column; with ⌘/Ctrl, to the first or last cell |
| ⌘/Ctrl+A | Selects every cell |
| Enter / F2 | Edits the active cell; in a tag column, opens its picker |
| ⌘/Ctrl+Enter | On a link, opens it; Enter alone does too in a read-only column |
| Any character | Starts editing the active cell with that character (not in tag columns) |
| Delete / Backspace | Clears the selected cells |
| Escape | Collapses the range to the active cell |
| ⌘/Ctrl+C, X, V | Copies, cuts or pastes the range as tab-separated text; one value pasted into a range fills it |
| ⌘/Ctrl+Z, ⌘/Ctrl+Shift+Z or ⌘/Ctrl+Y | Undoes or redoes |

While editing: Enter saves and moves down, Tab saves and moves right, Escape cancels; leaving the field saves. In the tag
picker, ↑ / ↓ / Home / End move between choices, Enter or Space picks one, and Escape or Tab closes it unchanged.

### Screen readers

The table is a `grid` named by the heading, with `aria-rowcount` and `aria-multiselectable`; rows carry
`aria-rowindex`, so the count is right even when only part of a long table is rendered. Focus stays on the grid and
`aria-activedescendant` points at the active cell; cells in the range are `aria-selected`, and read-only cells
`aria-readonly`. Column headers carry `aria-sort`. When rows are selectable, checkboxes are named “Select all rows” and “Select Linear” (the row's
title) with `aria-checked`, the header's is “mixed” when some rows are checked. Undo and Redo are named with their keys (“Undo (⌘ Z)”).
A status region says how many rows are checked and, for a range, its summary: “2 rows selected. 6 values · Sum
1,200”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 52.9 KB | 13.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **63.9 KB** | **16.7 KB** |
| With Lit – the first component on a page | 86.5 KB | 24.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.3 ms** | the gallery demo's data, 247 DOM nodes – to layout, median of 7 |
| Typical update | **1.5 ms** | one item of rows replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 10 ms | rows: first render, 809 nodes; update 3.8 ms |

Windowed: 10,000 items of rows render 809 nodes in 10 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`, `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Listens on the page: `window pointerup`, `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label columns with short nouns – “Company”, “Stage”, “ARR ($)” – and put the unit in the label, not in every cell.
- Give tag columns their `options` in a meaningful order, and `tagTones` so each value keeps its colour.
- Use `editable: false` for columns the product owns (an owner, an id) so edits, pastes and clears skip them.
- The empty table says “No rows yet”; an untitled row reads “Untitled”.

## Do and don't

### Do

- Save with `tc-rows-change` – it fires for every edit, paste, clear, add, delete, undo and redo, with all the rows.
- Pass new `rows` from the server when they change elsewhere; the table takes them and starts a fresh undo history.
- Set `readonly` (or `editable={false}` in React) for tables people should only read and copy from. A read-only
  table drops its row checkboxes; set `selectable` when people still need to pick rows from it, or
  `selectable={false}` to drop them from an editable table.

### Don't

- Don't rely on Tab to move between cells – it leaves the grid, as the grid pattern expects; arrows move inside it.
- Don't put buttons or other controls in cells through `renderCell`; the grid handles the keys, not your controls.
- Don't give two rows the same `id` – checking, logos and edits find rows by it.

## Related

- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer

## Changelog

- data-table and agent-lanes: a look selector left in front of a comment turned two rules into descendant selectors, so Clean lost data-table's coloured tag pills and agent-lanes' Reject / Approve button styles.
- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen, ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
- data-table renders only the rows in view above 60 rows (was 200); combobox windows options above 300 matches; command-menu shows at most `maxRows` (default 200) results.
- data-table renders only the rows in view above 200 rows (spacer rows keep the scroll height; `aria-rowcount` and `aria-rowindex` are set on every row).
