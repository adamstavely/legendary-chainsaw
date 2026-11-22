<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Export Dialog

**Data & charts** · New

Export a list in one modal – CSV, Excel or PDF; the selected rows, the ones the filters show or all, each with its count; which columns, with required ones kept; "Email me when it's ready" for big exports – then progress, a download link with the file's size, the emailed note, or what failed with Retry

- **Element:** `<tc-export-dialog>`
- **Size:** 9.1 KB gzip · 30.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/export-dialog";` |
| React / Next.js | `import { ExportDialog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/export-dialog";` · tags starting with tc- are custom elements |
| Angular | `import { ExportDialog } from "@adamstavely/trenchcoat/angular/export-dialog";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/export-dialog";` |

## Example

The live example is in the gallery at `#/export-dialog`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Exporting a list, in one modal. People pick the format – CSV, Excel or PDF – and which rows: the ones they've selected, the ones the filters show, or all of them, each with its count. A choice with nothing in it is disabled, with the reason beside it ("Nothing is selected"). They pick the columns – Select all and Select none, with required columns always included – and, when the page knows their address, "Email me at … when it's ready", which starts ticked when the rows go past `email-threshold` (5,000 by default).

Export fires `tc-export` with those choices, and the page does the work and drives `status`. "preparing" shows a progress bar (`progress` from 0 to 1, or a moving bar when it isn't known) and Cancel. "ready" shows the file's name and size with Download and Done. "emailed" says the file will be emailed. "failed" says what went wrong (`error`) with Retry, which sends the same request again. Each change is announced, and focus moves to the new state's main button.

It's a native modal: the page behind is inert, Escape, Close or a click outside close it, and focus goes back to the button that opened it.

### When to use

- Letting people take a list, table or record out of the app as a file.
- Exports big enough to take a while, where emailing the file beats waiting.

### When not to use

- Bringing a file in – use [File Import](file-import.md).
- A history of who exported what – use [Audit Trail](../blocks/audit-trail.md).
- A one-click action on the selected rows – put it in [Bulk Action Bar](bulk-action-bar.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Panel** `.ui-exd__dialog` – the modal, with `.ui-exd__title` and `.ui-exd__close`
2. **Format** `.ui-exd__formats` – one `.ui-exd__format` per format, with its `.ui-exd__hint`
3. **Rows** `.ui-exd__rows` – one `.ui-exd__row` per choice, with its `.ui-exd__count`, or the reason it's disabled
4. **Columns** `.ui-exd__columns` – a `.ui-exd__column` checkbox each, under Select all and Select none (`.ui-exd__link`)
5. **Email me** `.ui-exd__email` – when `email` is set
6. **Progress** `.ui-exd__bar` – while preparing
7. **File** `.ui-exd__file` – when ready, above Download
8. **Footer** `.ui-exd__footer` – Cancel and Export, or the status's buttons, the main one `.ui-exd__primary`

## Looks

The panel is a card in both Standard and Clean, on a dimmed page. `--tc-exd-w` sets the panel's widest; it never goes past 94% of the window, and the formats and columns rewrap to fit.

## Usage

### HTML

```html
<button id="export-open" type="button">Export…</button>
<tc-export-dialog id="export" email="noor.haddad@ledgerline.example"></tc-export-dialog>

<script type="module">
  import "@adamstavely/trenchcoat/export-dialog";
  import "@adamstavely/trenchcoat/tokens.css";

  const dialog = document.querySelector("#export");
  dialog.counts = { selected: 12, filtered: 340, all: 12480 };
  dialog.columns = [
    { id: "case", label: "Case", required: true },
    { id: "reviewer", label: "Reviewer" },
    { id: "risk", label: "Risk score" },
  ];
  document.querySelector("#export-open").addEventListener("click", () => (dialog.open = true));
  dialog.addEventListener("tc-export", async (e) => {
    dialog.status = "preparing";
    const res = await fetch("/api/exports", { method: "POST", body: JSON.stringify(e.detail) });
    const job = await res.json();
    if (e.detail.emailMe) dialog.status = "emailed";
    else Object.assign(dialog, { status: "ready", downloadUrl: job.url, fileName: job.name, fileSize: job.size });
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ExportDialog, type ExportRequest, type ExportStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ExportCases({ startExport }: { startExport: (r: ExportRequest) => Promise<{ url: string; name: string; size: number }> }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [file, setFile] = useState<{ url: string; name: string; size: number }>();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Export…
      </button>
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        counts={{ selected: 12, filtered: 340, all: 12480 }}
        columns={[
          { id: "case", label: "Case", required: true },
          { id: "reviewer", label: "Reviewer" },
        ]}
        status={status}
        downloadUrl={file?.url}
        fileName={file?.name}
        fileSize={file?.size}
        onExport={async (request) => {
          setStatus("preparing");
          setFile(await startExport(request));
          setStatus("ready");
        }}
      />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/export-dialog";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";

defineProps<{ formats: TcExportDialog["formats"]; counts: TcExportDialog["counts"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-export-dialog :formats="formats" :counts="counts" @tc-open-change="onOpenChange"></tc-export-dialog>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ExportDialog } from "@adamstavely/trenchcoat/angular/export-dialog";
import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";

@Component({
  selector: "app-export-dialog-example",
  imports: [ExportDialog],
  template: `<tc-export-dialog [formats]="formats()" [counts]="counts()" (tc-open-change)="onOpenChange($event)"></tc-export-dialog>`,
})
export class ExportDialogExample {
  readonly formats = input.required<TcExportDialog["formats"]>();
  readonly counts = input.required<TcExportDialog["counts"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/export-dialog";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";

  let { formats, counts }: { formats: TcExportDialog["formats"]; counts: TcExportDialog["counts"] } = $props();
  let el: TcExportDialog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-export-dialog bind:this={el} {formats} {counts}></tc-export-dialog>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the dialog is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Export"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading: what's being exported |
| `formats` | – | `ExportFormat[]` | `["csv", "xlsx", "pdf"]` | The formats on offer, in order |
| `format` | `format` | `ExportFormat` | `"csv"` | The format picked. Changed by the user unless a tc-format-change listener calls preventDefault() |
| `counts` | – | `ExportCounts` | `{ all: 0 }` | How many rows each choice holds: the selected ones, the ones the filters show (unset: no filters) and all |
| `rows` | `rows` | `ExportRows` | `"all"` | Which rows to export. Changed by the user unless a tc-rows-change listener calls preventDefault() |
| `columns` | – | `ExportColumn[]` | `[]` | The columns on offer, in order; required ones can't be left out |
| `selectedColumns` | – | `string[] \| undefined` | `undefined` | The ids of the columns to export; unset, all of them. Changed by the user unless a tc-selected-columns-change listener calls preventDefault() |
| `email` | `email` | `string \| undefined` | `undefined` | The person's email address; set, "Email me when it's ready" is offered |
| `emailMe` | `email-me` | `boolean \| undefined` | `undefined` | Whether to email the file instead of waiting; unset, ticked when the rows exceed `email-threshold`. Changed by the user unless a tc-email-me-change listener calls preventDefault() |
| `emailThreshold` | `email-threshold` | `number` | `5000` | Above this many rows "Email me" starts ticked (default 5000) |
| `status` | `status` | `ExportStatus` | `"idle"` | Where the export is: "idle" (the form), "preparing", "ready", "emailed" or "failed" – the page's to set after tc-export |
| `progress` | `progress` | `number \| undefined` | `undefined` | How far preparing has got, 0–1; unset, the bar moves without a number |
| `downloadUrl` | `download-url` | `string \| undefined` | `undefined` | The file to download, when ready |
| `fileName` | `file-name` | `string \| undefined` | `undefined` | The file's name, when ready |
| `fileSize` | `file-size` | `number \| undefined` | `undefined` | The file's size in bytes, when ready |
| `error` | `error` | `string \| undefined` | `undefined` | What went wrong, when it failed |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers |
| `labels` | – | `Partial<ExportDialogLabels>` | `{}` | Rename any of the words |
| `exportColumns` | – | `string[]` | – | The columns that will be exported: the picked ones plus every required one, in the columns' order |
| `emailing` | – | `boolean` | – | Whether "Email me" is ticked: as set, or by default when the rows exceed the threshold |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The dialog was opened or closed ({ open }: ExportDialogOpenChange); cancelable – prevented, `open` stays as it was |
| `tc-format-change` | – | Yes | A format was picked ({ format }: ExportFormatChange); cancelable – prevented, `format` stays as it was |
| `tc-rows-change` | – | Yes | Which rows was picked ({ rows }: ExportRowsChange); cancelable – prevented, `rows` stays as it was |
| `tc-selected-columns-change` | – | Yes | The columns changed ({ selectedColumns }: ExportSelectedColumnsChange); cancelable – prevented, `selectedColumns` stays as it was |
| `tc-email-me-change` | – | Yes | "Email me" was ticked or unticked ({ emailMe }: ExportEmailMeChange); cancelable – prevented, `emailMe` stays as it was |
| `tc-export` | – | No | Export or Retry was pressed ({ format, rows, columns, emailMe }: ExportRequest); the page starts the export and sets `status` |
| `tc-export-cancel` | – | No | Cancel was pressed while preparing (detail: null); the page stops the export |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-exd-w` | `calc(var(--tc-space-16) * 8)` | both |
| `--tc-exd-progress` | `0%` | both |

#### Design tokens it reads (42)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `exportFileSize(bytes: number, locale?: string): void` | "12 KB", "3.4 MB" – a file's size for people |

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
| `formats` | `el.formats = …;` | `<… formats={…} />` | `<tc-export-dialog :formats="…">` | `<tc-export-dialog [formats]="…">` | `<tc-export-dialog {formats}>` |
| `counts` | `el.counts = …;` | `<… counts={…} />` | `<tc-export-dialog :counts="…">` | `<tc-export-dialog [counts]="…">` | `<tc-export-dialog {counts}>` |
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-export-dialog :columns="…">` | `<tc-export-dialog [columns]="…">` | `<tc-export-dialog {columns}>` |
| `selectedColumns` | `el.selectedColumns = …;` | `<… selectedColumns={…} />` | `<tc-export-dialog :selectedColumns="…">` | `<tc-export-dialog [selectedColumns]="…">` | `<tc-export-dialog {selectedColumns}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-export-dialog :labels="…">` | `<tc-export-dialog [labels]="…">` | `<tc-export-dialog {labels}>` |

*Also attributes: `open`, `heading`, `description`, `format`, `rows`, `email`, `email-me`, `email-threshold` and 7 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-format-change` | Yes | `el.addEventListener("tc-format-change", (e) => …)` | `ref.current.addEventListener("tc-format-change", …)` | `@tc-format-change="…"` | `(tc-format-change)="…($event)"` | `el.addEventListener("tc-format-change", …)` |
| `tc-rows-change` | Yes | `el.addEventListener("tc-rows-change", (e) => …)` | `ref.current.addEventListener("tc-rows-change", …)` | `@tc-rows-change="…"` | `(tc-rows-change)="…($event)"` | `el.addEventListener("tc-rows-change", …)` |
| `tc-selected-columns-change` | Yes | `el.addEventListener("tc-selected-columns-change", (e) => …)` | `ref.current.addEventListener("tc-selected-columns-change", …)` | `@tc-selected-columns-change="…"` | `(tc-selected-columns-change)="…($event)"` | `el.addEventListener("tc-selected-columns-change", …)` |
| `tc-email-me-change` | Yes | `el.addEventListener("tc-email-me-change", (e) => …)` | `ref.current.addEventListener("tc-email-me-change", …)` | `@tc-email-me-change="…"` | `(tc-email-me-change)="…($event)"` | `el.addEventListener("tc-email-me-change", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |
| `tc-export-cancel` | No | `el.addEventListener("tc-export-cancel", (e) => …)` | `onExportCancel={…}` | `@tc-export-cancel="…"` | `(tc-export-cancel)="…($event)"` | `el.addEventListener("tc-export-cancel", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open`, `format`, `rows`, `selectedColumns` and `emailMe` itself unless a listener calls `preventDefault()` on `tc-open-change`, `tc-format-change`, `tc-rows-change`, `tc-selected-columns-change` or `tc-email-me-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-export-dialog id="export-dialog"></tc-export-dialog>

<script type="module">
  import "@adamstavely/trenchcoat/export-dialog";

  const el = document.querySelector("#export-dialog");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/export-dialog";
import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";

const props = defineProps<{ initial: TcExportDialog["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcExportDialog["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-export-dialog :open="open" @tc-open-change="onOpenChange"></tc-export-dialog>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ExportDialog } from "@adamstavely/trenchcoat/angular/export-dialog";
import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";

@Component({
  selector: "app-controlled-export-dialog",
  imports: [ExportDialog],
  template: `<tc-export-dialog [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-export-dialog>`,
})
export class ControlledExportDialog {
  readonly initial = input.required<TcExportDialog["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcExportDialog["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/export-dialog";
  import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";

  let { initial }: { initial: TcExportDialog["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcExportDialog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcExportDialog["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-export-dialog bind:this={el} {open}></tc-export-dialog>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-export-dialog")` returns a `TcExportDialog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";`
- **React / Next.js:** Props: `import type { ExportDialogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ExportDialog>`. The element class, for refs: `import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcExportDialog["formats"]` with `import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";`
- **Angular:** The directive types the template: `[formats]` takes `TcExportDialog["formats"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcExportDialog } from "@adamstavely/trenchcoat/export-dialog";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Export" |
| `open` | `boolean` | Whether the dialog is open – controlled when given |
| `defaultOpen` | `boolean` | Open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The dialog was opened or closed |
| `format` | `ExportFormat` | The format – controlled when given |
| `defaultFormat` | `ExportFormat` | The format on mount when `format` isn't controlled (default "csv") |
| `onFormatChange` | `(format: ExportFormat) => void` | A format was picked |
| `rows` | `ExportRows` | Which rows – controlled when given |
| `defaultRows` | `ExportRows` | Which rows on mount when `rows` isn't controlled (default "all") |
| `onRowsChange` | `(rows: ExportRows) => void` | Which rows was picked |
| `selectedColumns` | `string[]` | The ids of the columns to export – controlled when given |
| `defaultSelectedColumns` | `string[]` | The columns on mount when `selectedColumns` isn't controlled (default all) |
| `onSelectedColumnsChange` | `(selectedColumns: string[]) => void` | The columns changed |
| `emailMe` | `boolean` | Whether to email the file – controlled when given |
| `onEmailMeChange` | `(emailMe: boolean) => void` | "Email me" was ticked or unticked |
| `onExport` | `(request: ExportRequest) => void` | Export or Retry was pressed: start the export and set `status` |
| `onExportCancel` | `() => void` | Cancel was pressed while preparing: stop the export |

*Renamed or hidden on the wrapper: `heading`, `open`, `format`, `rows`, `selectedColumns`, `emailMe`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the format, rows, columns, Email me and the buttons – focus stays in the dialog |
| Arrow keys | Move between formats, or between row choices |
| Space | Ticks or unticks a column or Email me |
| Escape | Closes the dialog; focus goes back to what opened it |

### Screen readers

The dialog is named by its heading and described by `description`. Format, Rows and Columns are fieldsets with legends; formats and rows are radio buttons, so their number and place are read. A disabled row choice is described by its reason. The progress bar is a `progressbar` with its percentage, or none while it's unknown. A polite status line says "Preparing your export…", "Your export is ready: <file>", that it'll be emailed, or why it failed. Download names the file.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.6 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.8 KB** | **9.2 KB** |
| With Lit – the first component on a page | 51.5 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of columns replaced |
| First on the page | 5.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.4 ms | columns: first render, 2 nodes; update 0.1 ms |
| 1,000 items | 0.3 ms | columns: first render, 2 nodes; update 0.1 ms |

What it renders doesn't grow with columns (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name columns as they're named on screen.
- Mark only what an export can't be read without as `required` – usually the record's id.
- Keep `error` to what happened and whether anything was sent: "The export service took too long to answer. Nothing was sent."
- Give `fileName` with its extension, and `fileSize` in bytes.

## Do and don't

### Do

- Pass the real counts, so a disabled choice says why.
- Send the export to the server and keep the dialog's `status` in step with it.
- Log `tc-export` if exports need auditing.

### Don't

- Don't offer Email me without knowing the address – leave `email` unset instead.
- Don't keep people waiting on a huge export with the dialog open – lower `email-threshold` instead.

## Related

- [File Import](file-import.md) – Drop a spreadsheet and see what was read – the rows and columns found, the delimiter and encoding, a "First row is headers" switch, the first rows with each column's type in words, problems in words (rows of the wrong length, empty columns, a header named twice), and Continue; CSV and TSV read in the browser, Excel through the page
- [Audit Trail](../blocks/audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
- [Bulk Action Bar](bulk-action-bar.md) – What can be done to everything selected – how many, the page's actions, Select all and Clear, a question before danger, and Undo for a few seconds afterwards
- [Dialog](dialog.md) – A native modal with interactive content and restored focus
