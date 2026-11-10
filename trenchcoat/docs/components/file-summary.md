<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# File Summary

**AI & chat** · New

What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file

- **Element:** `<tc-file-summary>`
- **Size:** 11.1 KB gzip · 35.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/file-summary";` |
| React / Next.js | `import { FileSummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/file-summary";` · tags starting with tc- are custom elements |
| Angular | `import { FileSummary } from "@adamstavely/trenchcoat/angular/file-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/file-summary";` |

## Example

The live example is in the gallery at `#/file-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What's in a file, without opening it. The header names the file, with an icon for its type and its size and length.
Below it, an AI summary streams in, followed by the key points – each citing the pages or times it comes from – and
the people, organisations, dates and amounts the file mentions, with how often. A line says how much of the file the
summary covers, and the footer says when it was summarised and by which model, with Copy, Regenerate and Open file.
Short and Detailed switch the summary's length.

The page drives it with `status`: "idle" offers Summarise, "summarising" shows a shimmer until the first words arrive
and a caret while the text grows, "done" shows everything, and "error" shows what went wrong with Retry. Stream by
setting `summary`, `points` and `entities` as they arrive.

### When to use

- A file someone uploaded or attached – a contract, a report, a recording – before they decide to read it all.
- A file list or inbox where each file can be summarised on request.
- Reviewing documents, where every claim should lead back to its page.

### When not to use

- An answer to a question, with its sources – use [Cited Answer](cited-answer.md) or [AI Answer](ai-answer.md).
- Files an agent produced, with versions to compare – use [Artifact Panel](artifact-panel.md).
- Choosing files to upload – use [Dropzone](dropzone.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **File** `.tc-head` – the type's icon, the name, and the type, size and pages or duration
2. **Length** `.ui-fsum__len` – Short or Detailed
3. **Summary** `.ui-fsum__summary` – the paragraphs, with a caret while they stream in; a shimmer `.ui-fsum__skeleton` before the first words
4. **Key points** `.ui-fsum__points` – each point with its citation chips `.ui-fsum__cite`
5. **Mentions** `.ui-fsum__entities` – people & organisations, and dates & amounts, as chips with counts
6. **Coverage** `.ui-fsum__coverage` – how much of the file the summary covers
7. **Footer** `.ui-fsum__foot` – when and by which model, then Copy, Regenerate and Open file
8. **Error** `.ui-fsum__error` – what went wrong, with Retry

## Looks

Standard is a white card on a gray tray, with the file's header on the tray above it and a stronger selected length.
Clean is one white card with the header as its first row, roomier summary lines and thinner icons. The header icon
takes the file type's colour in both: red for PDF, green for spreadsheets, amber for slides, pink for images and
violet for audio and video.

## Usage

### HTML

```html
<tc-file-summary id="sum" status="idle" model="Claude Sonnet" href="/files/q3-report.pdf"></tc-file-summary>

<script type="module">
  import "@adamstavely/trenchcoat/file-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const sum = document.querySelector("#sum");
  sum.file = { name: "Q3 report.pdf", kind: "pdf", size: 2516582, pages: 48 };
  sum.addEventListener("tc-summarise", async () => {
    sum.status = "summarising";
    const result = await fetch("/api/summarise?file=q3-report.pdf").then((r) => r.json());
    sum.summary = result.summary;
    sum.points = [{ id: "rev", text: "Revenue up 18% to $42.6M.", refs: [{ page: 4 }] }];
    sum.entities = [{ id: "nw", label: "Northwind Ltd", kind: "organization", count: 63 }];
    sum.summarisedAt = Date.now();
    sum.status = "done";
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FileSummary, type FileSummaryStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReportSummary() {
  const [status, setStatus] = useState<FileSummaryStatus>("idle");
  const [summary, setSummary] = useState("");
  const summarise = async () => {
    setStatus("summarising");
    const result = await fetch("/api/summarise?file=q3-report.pdf").then((r) => r.json());
    setSummary(result.summary);
    setStatus("done");
  };
  return (
    <FileSummary
      file={{ name: "Q3 report.pdf", kind: "pdf", size: 2516582, pages: 48 }}
      href="/files/q3-report.pdf"
      model="Claude Sonnet"
      status={status}
      summary={summary}
      points={[{ id: "rev", text: "Revenue up 18% to $42.6M.", refs: [{ page: 4 }] }]}
      onSummarise={summarise}
      onRetry={summarise}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/file-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";

defineProps<{ file: TcFileSummary["file"]; points: TcFileSummary["points"] }>();
const onSummarise = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-file-summary :file="file" :points="points" @tc-summarise="onSummarise"></tc-file-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FileSummary } from "@adamstavely/trenchcoat/angular/file-summary";
import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";

@Component({
  selector: "app-file-summary-example",
  imports: [FileSummary],
  template: `<tc-file-summary [file]="file()" [points]="points()" (tc-summarise)="onSummarise($event)"></tc-file-summary>`,
})
export class FileSummaryExample {
  readonly file = input.required<TcFileSummary["file"]>();
  readonly points = input.required<TcFileSummary["points"]>();
  onSummarise(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";

  let { file, points }: { file: TcFileSummary["file"]; points: TcFileSummary["points"] } = $props();
  let el: TcFileSummary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-summarise", on);
    return () => el.removeEventListener("tc-summarise", on);
  });
</script>

<tc-file-summary bind:this={el} {file} {points}></tc-file-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `file` | – | `FileSummaryFile` | `{ name: "Untitled" }` | The file summarised |
| `href` | `href` | `string \| undefined` | `undefined` | Where the file opens; makes Open file and the citation chips links |
| `openable` | `openable` | `boolean` | `false` | Show Open file without `href` – it then only fires tc-open |
| `status` | `status` | `FileSummaryStatus` | `"idle"` | Where the summary is: "idle", "summarising", "done" or "error" |
| `summary` | `summary` | `string` | `""` | The summary; may grow while "summarising". Blank lines split paragraphs |
| `points` | – | `FileSummaryPoint[]` | `[]` | The key points, each with the pages or times it comes from |
| `entities` | – | `FileSummaryEntity[]` | `[]` | People, organisations, dates and amounts the file mentions |
| `coverage` | `coverage` | `string \| undefined` | `undefined` | How much of the file the summary covers, e.g. "Covers 42 of 48 pages · 3 pages unreadable" |
| `summarisedAt` | `summarised-at` | `number \| undefined` | `undefined` | When it was summarised, as epoch ms |
| `model` | `model` | `string \| undefined` | `undefined` | The model that wrote it, e.g. "Claude Sonnet" |
| `length` | `length` | `FileSummaryLength` | `"short"` | Short or detailed. Changed by the user unless a tc-length-change listener calls preventDefault() |
| `error` | `error` | `string \| undefined` | `undefined` | What went wrong, shown with "error" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-summarise` | – | No | Summarise was pressed while `status` is "idle" – start summarising; detail: null |
| `tc-retry` | – | No | Regenerate, or Retry after an error ({ reason: "regenerate" \| "error" }: FileSummaryRetry) |
| `tc-length-change` | – | Yes | Short or Detailed was picked ({ length }: FileSummaryLengthChange); cancelable – prevented, `length` stays as it was |
| `tc-cite-open` | – | Yes | A citation chip was used ({ pointId, page, time }: FileSummaryCiteOpen); cancelable – prevented, a link to the file doesn't open |
| `tc-entity-select` | – | No | A person, organisation, date or amount was picked ({ entity }: { entity: FileSummaryEntity }) |
| `tc-copy` | – | No | The summary is on the clipboard ({ text }) |
| `tc-open` | – | Yes | Open file was used; cancelable – prevented, a link to the file doesn't open; detail: null |

#### Design tokens it reads (81)

`--tc-accent`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-fg`, `--tc-tone-pink-fg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `fileSummaryKind(file: Pick<FileSummaryFile, "name" \| "kind">): FileSummaryKind` | The kind of a file: given, else from its extension |

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
| `file` | `el.file = …;` | `<… file={…} />` | `<tc-file-summary :file="…">` | `<tc-file-summary [file]="…">` | `<tc-file-summary {file}>` |
| `points` | `el.points = …;` | `<… points={…} />` | `<tc-file-summary :points="…">` | `<tc-file-summary [points]="…">` | `<tc-file-summary {points}>` |
| `entities` | `el.entities = …;` | `<… entities={…} />` | `<tc-file-summary :entities="…">` | `<tc-file-summary [entities]="…">` | `<tc-file-summary {entities}>` |

*Also attributes: `href`, `openable`, `status`, `summary`, `coverage`, `summarised-at`, `model`, `length` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-summarise` | No | `el.addEventListener("tc-summarise", (e) => …)` | `onSummarise={…}` | `@tc-summarise="…"` | `(tc-summarise)="…($event)"` | `el.addEventListener("tc-summarise", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-length-change` | Yes | `el.addEventListener("tc-length-change", (e) => …)` | `ref.current.addEventListener("tc-length-change", …)` | `@tc-length-change="…"` | `(tc-length-change)="…($event)"` | `el.addEventListener("tc-length-change", …)` |
| `tc-cite-open` | Yes | `el.addEventListener("tc-cite-open", (e) => …)` | `onCiteOpen={…}` | `@tc-cite-open="…"` | `(tc-cite-open)="…($event)"` | `el.addEventListener("tc-cite-open", …)` |
| `tc-entity-select` | No | `el.addEventListener("tc-entity-select", (e) => …)` | `onEntitySelect={…}` | `@tc-entity-select="…"` | `(tc-entity-select)="…($event)"` | `el.addEventListener("tc-entity-select", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `length` itself unless a listener calls `preventDefault()` on `tc-length-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-file-summary id="file-summary"></tc-file-summary>

<script type="module">
  import "@adamstavely/trenchcoat/file-summary";

  const el = document.querySelector("#file-summary");
  el.addEventListener("tc-length-change", (e) => {
    e.preventDefault(); // the element keeps its length…
    if (allowed(e.detail.length)) el.length = e.detail.length; // …until the app sets it
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
import "@adamstavely/trenchcoat/file-summary";
import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";

const props = defineProps<{ initial: TcFileSummary["length"] }>();
const length = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLengthChange = (e: CustomEvent<{ length: TcFileSummary["length"] }>) => {
  e.preventDefault();
  length.value = e.detail.length;
};
</script>

<template>
  <tc-file-summary :length="length" @tc-length-change="onLengthChange"></tc-file-summary>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FileSummary } from "@adamstavely/trenchcoat/angular/file-summary";
import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";

@Component({
  selector: "app-controlled-file-summary",
  imports: [FileSummary],
  template: `<tc-file-summary [length]="length()" (tc-length-change)="onLengthChange($event)"></tc-file-summary>`,
})
export class ControlledFileSummary {
  readonly initial = input.required<TcFileSummary["length"]>();
  readonly length = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLengthChange(e: CustomEvent<{ length: TcFileSummary["length"] }>) {
    e.preventDefault();
    this.length.set(e.detail.length);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-summary";
  import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";

  let { initial }: { initial: TcFileSummary["length"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let length = $derived(initial);
  let el: TcFileSummary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      length = (e as CustomEvent<{ length: TcFileSummary["length"] }>).detail.length;
    };
    el.addEventListener("tc-length-change", on);
    return () => el.removeEventListener("tc-length-change", on);
  });
</script>

<tc-file-summary bind:this={el} {length}></tc-file-summary>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-file-summary")` returns a `TcFileSummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";`
- **React / Next.js:** Props: `import type { FileSummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FileSummary>`. The element class, for refs: `import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFileSummary["file"]` with `import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";`
- **Angular:** The directive types the template: `[file]` takes `TcFileSummary["file"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFileSummary } from "@adamstavely/trenchcoat/file-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `length` | `FileSummaryLength` | Short or detailed – controlled when given |
| `defaultLength` | `FileSummaryLength` | The length on mount when `length` isn't controlled |
| `onLengthChange` | `(length: FileSummaryLength) => void` | Short or Detailed was picked – summarise again |
| `onSummarise` | `() => void` | Summarise was pressed – start summarising |
| `onRetry` | `(reason: FileSummaryRetry["reason"]) => void` | Regenerate, or Retry after an error |
| `onCiteOpen` | `(cite: FileSummaryCiteOpen) => boolean \| void` | A citation chip was used; return false to keep a link to the file from opening (jump inside your own viewer) |
| `onEntitySelect` | `(entity: FileSummaryEntity) => void` | A person, organisation, date or amount was picked |
| `onCopy` | `(text: string) => void` | Called with the copied text once the summary is on the clipboard |
| `onOpen` | `() => boolean \| void` | Open file was used; return false to keep the link from opening |

*Renamed or hidden on the wrapper: `length`, `onCopy`, `children`*

## Accessibility

### Keyboard

Every control is a stop in reading order: Short / Detailed (one stop), Summarise or Retry, each citation chip, each
mention, then Copy, Regenerate and Open file.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls |
| ← / → / ↑ / ↓ | In Short / Detailed, picks the other length |
| Home / End | In Short / Detailed, picks Short or Detailed |
| Enter / Space | Uses the focused control: opens a citation, picks a mention, copies, regenerates |

While summarising, Copy and Regenerate are disabled; if focus was on a control that goes away or is disabled, it
moves to Short / Detailed. Picking a length while summarising fires tc-length-change, so the page can start again.

### Screen readers

The file's name is the card's heading. Short / Detailed is a `radiogroup` labelled “Summary length”. While the summary
streams, it is `aria-busy`; the status is announced politely: “Summarising Q3 report.pdf”, “Summary of Q3 report.pdf
ready”, or “Couldn't summarise Q3 report.pdf: …”. An error is also an `alert`. Key points and mentions are lists
headed “Key points”, “People & organisations” and “Dates & amounts”. A citation chip shows “p. 12” or “4:32” and reads “Open page
12” or “Open at 4 minutes 32 seconds”; a mention reads “Amara Diallo, mentioned 9 times”. Copy confirms with “Summary copied”.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.5 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **35.9 KB** | **11.2 KB** |
| With Lit – the first component on a page | 57.6 KB | 18.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 24 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |

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

- Keep the short summary to two or three sentences, and the detailed one to two short paragraphs.
- Write key points as findings, not topics: “Revenue up 18% to $42.6M”, not “Revenue”.
- Cite every key point; a point without a page or time can't be checked.
- Say what the summary missed in `coverage`: “Covers 46 of 48 pages · 2 pages of scanned charts unreadable”.
- Write `error` as what happened and what to do: “The model timed out. Large scanned files can take longer – try again.”

## Do and don't

### Do

- Set `href` so Open file and the citation chips open the file at the right page or time; prevent `tc-cite-open` to
  jump inside your own viewer instead.
- Name the model and the time, so people can judge how fresh and how trustworthy the summary is.
- Summarise again on `tc-length-change` and `tc-retry`, setting `status` back to "summarising".

### Don't

- Don't summarise automatically on every file in a long list – offer Summarise and let people choose.
- Don't fill `points` with sentences from the summary – they should add the evidence the summary leaves out.
- Don't leave `status` at "summarising" after a failure – set "error" so Retry appears.

## Related

- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Artifact Panel](artifact-panel.md) – Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download
- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry

## Changelog

- **`tc-file-summary`:** an AI summary of a file that streams in. - **Content:** key points citing their pages or times, plus the people, organisations, dates and amounts mentioned. - **Controls:** Short / Detailed, coverage, and Copy, Regenerate and Open file.
