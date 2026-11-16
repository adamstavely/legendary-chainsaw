<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Diff Timeline

**Agents** · New

What a coding agent changed in a pull request, edit by edit – lines added and removed so far as two overlaid lines, a row per file in the order it was reached with its edits on one time axis and its own diff bar, an edit's diff on hover, and a scrubber with Play to replay the run

- **Element:** `<tc-diff-timeline>`
- **Size:** 9.4 KB gzip · 29.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/diff-timeline";` |
| React / Next.js | `import { DiffTimeline } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/diff-timeline";` · tags starting with tc- are custom elements |
| Angular | `import { DiffTimeline } from "@adamstavely/trenchcoat/angular/diff-timeline";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/diff-timeline";` |

## Example

The live example is in the gallery at `#/diff-timeline`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a coding agent changed in a pull request, edit by edit over time. On top, the lines added and removed so far, as two lines over each other. Under it, a row per file in the order the agent reached it, each with its edits as marks on the same time axis and a small bar of its own lines added and removed. Pointing at or focusing an edit shows its diff below the rows; a click or Enter keeps it there. A scrubber and Play replay the run, and a file's row appears when the agent first reaches it.

### When to use

- Showing what a coding agent did to a pull request – live while it works, or as a replay afterwards.
- Review screens where people want to see when the big changes happened and which files they touched.

### When not to use

- The final changes, file by file with full line diffs – use [Diff Viewer](diff-viewer.md).
- A list of pull requests or proposed changes – use [Change List](change-list.md).
- Hundreds of edits or files: the rows get too thin. Group them by folder first.
- Comparing more than one run – use [Run Compare](run-compare.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Totals** `.ui-dtl__totals` – lines added and removed so far, and how many files, in the header
2. **Chart** `.ui-dtl__plot` – a `.ui-dtl__series` for lines added and one for lines removed, and `.ui-dtl__cursor` while replaying
3. **Controls** `.ui-dtl__controls` – `.ui-dtl__play` and the `.ui-dtl__scrub` scrubber
4. **Rows** `.ui-dtl__rows` – a `.ui-dtl__row` per file: `.ui-dtl__path`, a `.ui-dtl__track` of `.ui-dtl__mark` edits, and `.ui-dtl__bar`
5. **Detail** `.ui-dtl__detail` – the edit's summary and its `.ui-dtl__diff`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-dtl-chart` (the chart's height), `--tc-dtl-path` and `--tc-dtl-bar` (the column widths), `--tc-dtl-mark` (an edit's dot), and `--tc-dtl-added` and `--tc-dtl-removed` (the two colours). The removed line is dashed, so the two don't rely on colour alone.

## Usage

### HTML

```html
<tc-diff-timeline id="pr" heading="Fix parsing in the skipped hour"></tc-diff-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/diff-timeline";
  import "@adamstavely/trenchcoat/tokens.css";

  const pr = document.querySelector("#pr");
  const start = Date.now() - 600000;
  pr.files = [
    {
      path: "src/parse/local.ts",
      edits: [
        { id: "a", at: start + 60000, added: 14, removed: 6, summary: "Detect a skipped hour", diff: "-  const offset = zone.offsetAt(naive);\n+  if (zone.isGap(naive)) return shiftForward(naive, zone);" },
        { id: "b", at: start + 300000, added: 9, removed: 2, summary: "Shift forward by the gap" },
      ],
    },
    { path: "test/parse-dst.test.ts", edits: [{ id: "c", at: start + 420000, added: 42, removed: 0, summary: "Tests for both changes" }] },
  ];
  pr.addEventListener("tc-time-change", (e) => console.log(e.detail.time));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DiffTimeline, type DiffTimelineFile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PullRequestReplay({ files }: { files: DiffTimelineFile[] }) {
  const [time, setTime] = useState<number | null>(null);
  return <DiffTimeline title="Fix parsing in the skipped hour" files={files} time={time} onTimeChange={setTime} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/diff-timeline";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";

defineProps<{ files: TcDiffTimeline["files"]; labels: TcDiffTimeline["labels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-diff-timeline :files="files" :labels="labels" @tc-selected-change="onSelectedChange"></tc-diff-timeline>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DiffTimeline } from "@adamstavely/trenchcoat/angular/diff-timeline";
import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";

@Component({
  selector: "app-diff-timeline-example",
  imports: [DiffTimeline],
  template: `<tc-diff-timeline [files]="files()" [labels]="labels()" (tc-selected-change)="onSelectedChange($event)"></tc-diff-timeline>`,
})
export class DiffTimelineExample {
  readonly files = input.required<TcDiffTimeline["files"]>();
  readonly labels = input.required<TcDiffTimeline["labels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/diff-timeline";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";

  let { files, labels }: { files: TcDiffTimeline["files"]; labels: TcDiffTimeline["labels"] } = $props();
  let el: TcDiffTimeline;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-diff-timeline bind:this={el} {files} {labels}></tc-diff-timeline>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Changes over time"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `files` | – | `DiffTimelineFile[]` | `[]` | The files and their edits |
| `start` | `start` | `number \| undefined` | `undefined` | When the run started, epoch ms; by default the first edit |
| `end` | `end` | `number \| undefined` | `undefined` | When it ended, epoch ms; by default the last edit, or now while live |
| `live` | `live` | `boolean` | `false` | The run is still going: the axis runs to now and new edits land as they come |
| `now` | `now` | `number \| undefined` | `undefined` | "Now", epoch ms, while live; unset, the element keeps its own clock |
| `time` | `time` | `number \| null` | `null` | The replay position, epoch ms, or null for everything. Changed by the user unless a tc-time-change listener calls preventDefault() |
| `selected` | `selected` | `string \| null` | `null` | The picked edit's id, or null. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `labels` | – | `Partial<DiffTimelineLabels>` | `{}` | Rename any of the words |
| `ticking` | – | `` | – | Whether the live clock is ticking, for the page and for tests |
| `range` | – | `[number, number]` | – | The axis: start to end, never zero wide |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | An edit was picked or closed ({ selected, edit, path }: DiffTimelineSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-time-change` | – | Yes | The replay position moved ({ time }: DiffTimelineTimeChange); cancelable – prevented, `time` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dtl-chart` | `calc(var(--tc-space-10) * 2)` | both |
| `--tc-dtl-path` | `9em` | both |
| `--tc-dtl-bar` | `5em` | both |
| `--tc-dtl-mark` | `var(--tc-space-2-5)` | both |
| `--tc-dtl-added` | `var(--tc-status-success-fg)` | both |
| `--tc-dtl-removed` | `var(--tc-status-danger-fg)` | both |

#### Design tokens it reads (37)

`--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `diffTimelineOffset(ms: number): void` | m:ss from the start, or h:mm:ss past an hour |
| `diffTimelineSeries(files: DiffTimelineFile[], until: unknown): void` | Running totals of lines added and removed, one point per edit in time order, up to `until` |

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
| `files` | `el.files = …;` | `<… files={…} />` | `<tc-diff-timeline :files="…">` | `<tc-diff-timeline [files]="…">` | `<tc-diff-timeline {files}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-diff-timeline :labels="…">` | `<tc-diff-timeline [labels]="…">` | `<tc-diff-timeline {labels}>` |

*Also attributes: `heading`, `description`, `start`, `end`, `live`, `now`, `time`, `selected` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-time-change` | Yes | `el.addEventListener("tc-time-change", (e) => …)` | `ref.current.addEventListener("tc-time-change", …)` | `@tc-time-change="…"` | `(tc-time-change)="…($event)"` | `el.addEventListener("tc-time-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `time` and `selected` itself unless a listener calls `preventDefault()` on `tc-time-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-diff-timeline id="diff-timeline"></tc-diff-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/diff-timeline";

  const el = document.querySelector("#diff-timeline");
  el.addEventListener("tc-time-change", (e) => {
    e.preventDefault(); // the element keeps its time…
    if (allowed(e.detail.time)) el.time = e.detail.time; // …until the app sets it
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
import "@adamstavely/trenchcoat/diff-timeline";
import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";

const props = defineProps<{ initial: TcDiffTimeline["time"] }>();
const time = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTimeChange = (e: CustomEvent<{ time: TcDiffTimeline["time"] }>) => {
  e.preventDefault();
  time.value = e.detail.time;
};
</script>

<template>
  <tc-diff-timeline :time="time" @tc-time-change="onTimeChange"></tc-diff-timeline>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DiffTimeline } from "@adamstavely/trenchcoat/angular/diff-timeline";
import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";

@Component({
  selector: "app-controlled-diff-timeline",
  imports: [DiffTimeline],
  template: `<tc-diff-timeline [time]="time()" (tc-time-change)="onTimeChange($event)"></tc-diff-timeline>`,
})
export class ControlledDiffTimeline {
  readonly initial = input.required<TcDiffTimeline["time"]>();
  readonly time = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTimeChange(e: CustomEvent<{ time: TcDiffTimeline["time"] }>) {
    e.preventDefault();
    this.time.set(e.detail.time);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/diff-timeline";
  import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";

  let { initial }: { initial: TcDiffTimeline["time"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let time = $derived(initial);
  let el: TcDiffTimeline;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      time = (e as CustomEvent<{ time: TcDiffTimeline["time"] }>).detail.time;
    };
    el.addEventListener("tc-time-change", on);
    return () => el.removeEventListener("tc-time-change", on);
  });
</script>

<tc-diff-timeline bind:this={el} {time}></tc-diff-timeline>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-diff-timeline")` returns a `TcDiffTimeline` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";`
- **React / Next.js:** Props: `import type { DiffTimelineProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DiffTimeline>`. The element class, for refs: `import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDiffTimeline["files"]` with `import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";`
- **Angular:** The directive types the template: `[files]` takes `TcDiffTimeline["files"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDiffTimeline } from "@adamstavely/trenchcoat/diff-timeline";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string \| null` | The picked edit's id – controlled when given |
| `defaultSelected` | `string \| null` | The picked edit on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, edit: DiffTimelineEdit \| null, path: string \| null) => void` | An edit was picked or closed |
| `time` | `number \| null` | The replay position, epoch ms, or null for everything – controlled when given |
| `defaultTime` | `number \| null` | The replay position on mount when `time` isn't controlled |
| `onTimeChange` | `(time: number \| null) => void` | The replay position moved |

*Renamed or hidden on the wrapper: `heading`, `selected`, `time`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| ← → | Move to the previous or next edit in the file |
| ↑ ↓ | Move to the nearest edit in the file above or below |
| Home / End | Go to the file's first or last edit |
| Enter / Space | Keep the edit's diff open, or let it go |
| Escape | Close the diff, and go back to the edit |
| ← → on the scrubber | Move the replay a second at a time |

### Screen readers

The chart is an image whose name gives the totals. The rows are a grid with one tab stop: each row's header is the file's path, and each edit's name says when it happened, the lines added and removed, and its summary. In the diff, added and removed lines start with the words "Added" and "Removed", not just + and −. The scrubber reads its position as time from the start.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.8 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **29.7 KB** | **9.4 KB** |
| With Lit – the first component on a page | 50.4 KB | 16.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.3 ms** | the gallery demo's data, 143 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of files replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | files: first render, 1,739 nodes; update 5.9 ms |
| 1,000 items | 401 ms | files: first render, 16,859 nodes; update 326 ms |

1,000 items of files: 401 ms. It renders every item, so a first render passes 50 ms (a long task) at about 120 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `summary` says what the edit did in a few words: "Shift forward by the gap's length".
- `diff` is a few lines only, each starting with "+", "-" or a space – it's a taste of the edit, not the whole file.
- Times are epoch ms; `start` and `end` default to the first and last edit.

## Do and don't

### Do

- Set `live` while the agent works, and add edits to `files` as they come.
- Own `time` when the replay position should survive a reload or be shared in a link.

### Don't

- Don't pass every line of every edit in `diff` – link to the full diff instead.
- Don't use it for edits by several agents at once.

## Related

- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
- [Pull Request](pull-request.md) – one pull request at a glance: branches, review, checks, whether it can merge, and the button its state calls for.
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
