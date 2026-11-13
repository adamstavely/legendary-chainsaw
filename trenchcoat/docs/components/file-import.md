<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# File Import

**Data & charts** · New

Drop a spreadsheet and see what was read – the rows and columns found, the delimiter and encoding, a "First row is headers" switch, the first rows with each column's type in words, problems in words (rows of the wrong length, empty columns, a header named twice), and Continue; CSV and TSV read in the browser, Excel through the page

- **Element:** `<tc-file-import>`
- **Size:** 11.2 KB gzip · 34.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/file-import";` |
| React / Next.js | `import { FileImport } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/file-import";` · tags starting with tc- are custom elements |
| Angular | `import { FileImport } from "@adamstavely/trenchcoat/angular/file-import";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/file-import";` |

## Example

The live example is in the gallery at `#/file-import`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The first step of importing a spreadsheet: drop the file, and see what was read before anything is imported. CSV and
TSV files are read in the browser – quoted fields, doubled quotes, line breaks inside quotes and Windows line endings
all handled, the delimiter worked out from the first lines. An Excel workbook is the page's to read, through `parse`.
Once read, the card says what it found: the file, its size, how many rows and columns, the delimiter and how the text
was decoded. A preview shows the first rows with each column's type guessed in words – Text, Number, Date, Email or
Empty – and problems are listed in words: rows with a different number of cells, empty columns, a header named twice.
"First row is headers" switches whether the first line holds the names.

### When to use

- Bringing a list kept in a spreadsheet – vendors, contacts, assets – into an app as records.
- Before a column mapping step, so people know the file was read the way they expect.
- When files come from many places and their delimiters, encodings and headers vary.

### When not to use

- Uploading files to keep, not to read – use [Dropzone](dropzone.md).
- Matching the file's columns to your fields – that's the next step, [Column Mapper](column-mapper.md).
- Checking and fixing the rows themselves – use [Import Review](import-review.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Drop area** `.ui-fim__drop` – drop a file or press it to choose one; it says when a file is over it
2. **File** `.ui-fim__file` – the file's name with its size, rows, columns, delimiter and encoding, and Choose another file
3. **Header row** `.ui-fim__check` – “First row is headers”
4. **Problems** `.ui-fim__problems` – each problem in words, or “No problems found”
5. **Preview** `.ui-fim__table` – the first rows, each column with its guessed type under its name
6. **Continue** `.ui-fim__continue` – with how many rows are ready; held while there are none

## Looks

Standard puts the header on the gray tray above a white card, and the summary and Continue on the tray below. Clean is
one white card with hairline dividers and thinner icons; the summary is its last row. `--tc-file-import-preview-h`
sets how tall the preview can grow before it scrolls (320px by default).

## Usage

### HTML

```html
<tc-file-import id="vendors" heading="Import vendors" description="Rows become vendor records"></tc-file-import>

<script type="module">
  import "@adamstavely/trenchcoat/file-import";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#vendors");
  const csv = "Vendor name,Contact email,Country\nKestrel Lab Supplies,orders@kestrel-lab.example,United Kingdom\nHarbour Analytics,accounts@harbour-analytics.example,Netherlands";
  el.file = new File([csv], "vendors.csv", { type: "text/csv" });
  el.addEventListener("tc-parsed", (e) => console.log(e.detail.rows.length, "rows", e.detail.problems));
  el.addEventListener("tc-continue", (e) => console.log("map", e.detail.columns));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FileImport, type FileImportResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function VendorUpload({ next }: { next: (result: FileImportResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return <FileImport title="Import vendors" description="Rows become vendor records" file={file} onFileChange={setFile} onContinue={next} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/file-import";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";

defineProps<{ file: TcFileImport["file"]; parse: TcFileImport["parse"] }>();
const onFileChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-file-import :file="file" :parse="parse" @tc-file-change="onFileChange"></tc-file-import>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FileImport } from "@adamstavely/trenchcoat/angular/file-import";
import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";

@Component({
  selector: "app-file-import-example",
  imports: [FileImport],
  template: `<tc-file-import [file]="file()" [parse]="parse()" (tc-file-change)="onFileChange($event)"></tc-file-import>`,
})
export class FileImportExample {
  readonly file = input.required<TcFileImport["file"]>();
  readonly parse = input.required<TcFileImport["parse"]>();
  onFileChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-import";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";

  let { file, parse }: { file: TcFileImport["file"]; parse: TcFileImport["parse"] } = $props();
  let el: TcFileImport;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-file-change", on);
    return () => el.removeEventListener("tc-file-change", on);
  });
</script>

<tc-file-import bind:this={el} {file} {parse}></tc-file-import>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Import a spreadsheet"` | The heading |
| `description` | `description` | `string` | `""` | A quiet line under the heading – what the rows will become |
| `file` | – | `File \| null` | `null` | The file being read – the value. Choosing or dropping one changes it unless a tc-file-change listener calls preventDefault() |
| `headerRow` | `header-row` | `boolean` | `true` | Whether the first row holds the column names. Changed by its checkbox unless a tc-header-row-change listener calls preventDefault() |
| `accept` | `accept` | `string` | `".csv,.tsv,.txt,.xlsx,.xls,text/csv,text/tab-separated-values"` | The file types the picker offers, as for an input's accept |
| `parse` | – | `FileImportParser \| undefined` | `undefined` | The page's reader for files the element can't read itself (Excel): resolves to the rows as arrays of strings |
| `previewRows` | `preview-rows` | `number` | `10` | How many rows the preview shows |
| `labels` | – | `Partial<FileImportLabels>` | `{}` | Words the page can rename, merged over defaultFileImportLabels |
| `parsed` | – | `FileImportResult \| null` | – | What was read: the columns, the data rows and the problems – null until a file is read |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-file-change` | – | Yes | A file was chosen or dropped, or removed ({ file }: FileImportFileChange); cancelable – prevented, `file` stays as it was |
| `tc-header-row-change` | – | Yes | "First row is headers" was switched ({ headerRow }: FileImportHeaderRowChange); cancelable – prevented, `headerRow` stays as it was |
| `tc-parsed` | – | No | The file was read ({ columns, rows, problems, delimiter }: FileImportResult) |
| `tc-continue` | – | No | Continue was pressed with rows to import ({ columns, rows, problems, delimiter }: FileImportResult) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-file-import-preview-h` | `320px` | not set – this fallback applies |

#### Design tokens it reads (61)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseDelimited(text: string, delimiter: string): string[][]` | Splits delimited text into rows of fields (RFC 4180): quoted fields, "" inside quotes, line breaks in quotes, CRLF |
| `sniffDelimiter(text: string): FileImportDelimiter` | The delimiter that splits the first lines into the most columns, most consistently; comma when nothing does |
| `guessColumnType(values: string[]): FileImportColumnType` | What a column's values look like: empty when all are blank, else the one type every filled value fits, else text |
| `readGrid(grid: string[][], headerRow: boolean): Omit<FileImportResult, "delimiter">` | Reads the grid into columns, data rows and problems, given whether its first row is the header |
| `formatFileSize(bytes: number): string` | "18.4 KB" |

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
| `file` | `el.file = …;` | `<… file={…} />` | `<tc-file-import :file="…">` | `<tc-file-import [file]="…">` | `<tc-file-import {file}>` |
| `parse` | `el.parse = …;` | `<… parse={…} />` | `<tc-file-import :parse="…">` | `<tc-file-import [parse]="…">` | `<tc-file-import {parse}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-file-import :labels="…">` | `<tc-file-import [labels]="…">` | `<tc-file-import {labels}>` |

*Also attributes: `heading`, `description`, `header-row`, `accept`, `preview-rows` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-file-change` | Yes | `el.addEventListener("tc-file-change", (e) => …)` | `onFileChange={…}` | `@tc-file-change="…"` | `(tc-file-change)="…($event)"` | `el.addEventListener("tc-file-change", …)` |
| `tc-header-row-change` | Yes | `el.addEventListener("tc-header-row-change", (e) => …)` | `onHeaderRowChange={…}` | `@tc-header-row-change="…"` | `(tc-header-row-change)="…($event)"` | `el.addEventListener("tc-header-row-change", …)` |
| `tc-parsed` | No | `el.addEventListener("tc-parsed", (e) => …)` | `onParsed={…}` | `@tc-parsed="…"` | `(tc-parsed)="…($event)"` | `el.addEventListener("tc-parsed", …)` |
| `tc-continue` | No | `el.addEventListener("tc-continue", (e) => …)` | `onContinue={…}` | `@tc-continue="…"` | `(tc-continue)="…($event)"` | `el.addEventListener("tc-continue", …)` |

### Controlled

The element changes `file` and `headerRow` itself unless a listener calls `preventDefault()` on `tc-file-change` or `tc-header-row-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-file-import id="file-import"></tc-file-import>

<script type="module">
  import "@adamstavely/trenchcoat/file-import";

  const el = document.querySelector("#file-import");
  el.addEventListener("tc-file-change", (e) => {
    e.preventDefault(); // the element keeps its file…
    if (allowed(e.detail.file)) el.file = e.detail.file; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { FileImport } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof FileImport>;
type Props = Omit<Own, "file" | "onFileChange"> & { initial: NonNullable<Own["file"]> };

// Controlled: passing file makes the wrapper prevent the element's own change; the app sets it
export function ControlledFileImport({ initial, ...props }: Props) {
  const [file, setFile] = useState<Own["file"]>(initial);
  return <FileImport {...props} file={file} onFileChange={(next) => setFile(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/file-import";
import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";

const props = defineProps<{ initial: TcFileImport["file"] }>();
const file = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFileChange = (e: CustomEvent<{ file: TcFileImport["file"] }>) => {
  e.preventDefault();
  file.value = e.detail.file;
};
</script>

<template>
  <tc-file-import :file="file" @tc-file-change="onFileChange"></tc-file-import>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FileImport } from "@adamstavely/trenchcoat/angular/file-import";
import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";

@Component({
  selector: "app-controlled-file-import",
  imports: [FileImport],
  template: `<tc-file-import [file]="file()" (tc-file-change)="onFileChange($event)"></tc-file-import>`,
})
export class ControlledFileImport {
  readonly initial = input.required<TcFileImport["file"]>();
  readonly file = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFileChange(e: CustomEvent<{ file: TcFileImport["file"] }>) {
    e.preventDefault();
    this.file.set(e.detail.file);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-import";
  import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";

  let { initial }: { initial: TcFileImport["file"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let file = $derived(initial);
  let el: TcFileImport;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      file = (e as CustomEvent<{ file: TcFileImport["file"] }>).detail.file;
    };
    el.addEventListener("tc-file-change", on);
    return () => el.removeEventListener("tc-file-change", on);
  });
</script>

<tc-file-import bind:this={el} {file}></tc-file-import>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-file-import")` returns a `TcFileImport` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";`
- **React / Next.js:** Props: `import type { FileImportProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FileImport>`. The element class, for refs: `import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFileImport["file"]` with `import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";`
- **Angular:** The directive types the template: `[file]` takes `TcFileImport["file"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFileImport } from "@adamstavely/trenchcoat/file-import";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `file` | `File \| null` | The file being read. Controlled when defined (null for none) – pass back what onFileChange reports |
| `defaultFile` | `File \| null` | The starting file when uncontrolled |
| `onFileChange` | `(file: File \| null) => void` | A file was chosen or dropped, or removed |
| `headerRow` | `boolean` | Whether the first row is the header row. Controlled when defined |
| `defaultHeaderRow` | `boolean` | The starting header-row choice when uncontrolled |
| `onHeaderRowChange` | `(headerRow: boolean) => void` | "First row is headers" was switched |
| `onParsed` | `(result: FileImportResult) => void` | The file was read: the columns, the data rows and the problems |
| `onContinue` | `(result: FileImportResult) => void` | Continue was pressed with rows to import |

*Renamed or hidden on the wrapper: `heading`, `First row is headers`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the drop area (or Choose another file), the header-row checkbox, the preview and Continue |
| Enter or Space (on the drop area) | Opens the file picker |
| Space (on the checkbox) | Switches “First row is headers” |
| Arrow keys (on the preview) | Scroll the preview |

### Screen readers

The drop area is a button described by the accepted types (“CSV, TSV or Excel”). A status region says what happened:
“Reading vendors.csv”, then “vendors.csv read: 12 rows, 6 columns, 2 problems”. The problems are a list named by how
many there are. The preview is a scrollable region named by its caption (“First 10 of 412 rows”) holding a real
table: column headers read their name and type (“Contact email, Email”), and each row starts with its line number,
with “different number of cells” added to rows that don't fit. A file that can't be read is announced as an alert.
Continue is `aria-disabled` and described by “No rows to import” until there are rows.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 27.0 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.4 KB** | **11.2 KB** |
| With Lit – the first component on a page | 55.1 KB | 17.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 26 DOM nodes – to layout, median of 7 |
| Typical update | **1.5 ms** | re-render with the same data |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |

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

- Set `heading` and `description` to what the rows will become: “Import vendors” · “Rows become vendor records”.
- Say in your own page copy where the file goes and who sees it; the element only reads it in the browser.
- Keep `preview-rows` small – ten rows is enough to recognise a file.
- Rename the words through `labels` for your product's tone; the defaults are plain.

## Do and don't

### Do

- Read Excel through `parse` with the library you already use, and pass back rows of strings.
- Keep the problems visible – a short row is usually a stray comma, and people can fix it at the source.
- Hand `tc-continue`'s columns and rows straight to `column-mapper`.

### Don't

- Don't import on drop; let people see what was read and press Continue.
- Don't hide the header-row switch – exports without headers are common.
- Don't guess types for people silently; show them, as the preview does, so a column read as Text is noticed.

## Related

- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Column Mapper](column-mapper.md) – A model matches a file's columns to your fields – a select per column prefilled from its suggestion, "Suggested" with the confidence in a word, Use suggestion once changed, Accept all suggestions, and required fields left out or fields matched twice said in words before Continue
- [Import Review](import-review.md) – Rows of an import, checked before they land – cell problems in words (missing, not an email, not a date, not a number, or the page's own), duplicates by a key with Keep this and Merge, All / With problems / Duplicates tabs with counts, cells edited in place, skip and restore, and Import held with the reason until nothing's left to fix or problem rows are skipped
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
