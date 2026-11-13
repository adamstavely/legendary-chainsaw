<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Cited Answer

**AI & chat**

An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked

- **Element:** `<tc-cited-answer>`
- **Size:** 16.7 KB gzip · 71.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/cited-answer";` |
| React / Next.js | `import { CitedAnswer } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/cited-answer";` · tags starting with tc- are custom elements |
| Angular | `import { CitedAnswer } from "@adamstavely/trenchcoat/angular/cited-answer";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/cited-answer";` |

## Example

The live example is in the gallery at `#/cited-answer`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An AI answer wired to the sources it relies on. Each cited sentence ends in small numbered markers, and the sources
wait below as chips. Point at a marker and its source lights up with the sentence; point at a chip and every
sentence that cites it lights up while the rest fades back. Click either to unfold the quoted passage in place, with
the words that back the answer marked, Open source and Copy quote – so people can check a claim without leaving the
answer. When the page has the full text of a source, View in document opens it in a side sheet, scrolled to the
cited passage, with Previous and Next through every passage the answer cites from that document.

### When to use

- Answers built from search or retrieval, where people need to check what a sentence rests on.
- Research and support tools where a claim without a source shouldn't be trusted.
- Showing how much of an answer is backed – the line under it counts the cited sentences.
- Checking a quote in context: give `documents` (or `loadDocument`) and people read the passage where it sits.

### When not to use

- A streamed chat answer with source cards, copy, regenerate, feedback and follow-ups – use [AI Answer](ai-answer.md).
- Comparing two models' answers to the same prompt – use [Answer Arena](answer-arena.md).
- Showing the raw call to a search or retrieval tool and what it returned – use [Tool Call Card](tool-call-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Head** `.ui-ca__head` – the first sources' marks, how many sources and how many pages were read
2. **Answer** `.ui-ca__text` – the text, in paragraphs
3. **Marker** `.ui-ca__marker` – the number of a source, at the end of a sentence that cites it
4. **Source chip** `.ui-ca__chip` – a source's mark, short name and number
5. **Preview** `.ui-ca__fold` – the quoted passage with Open source and Copy quote, unfolded in place
6. **Caption** `.ui-ca__caption` – what you're pointing at, or how many sentences are backed
7. **Action** `.ui-ca__action` – an optional button, e.g. “Follow up”
8. **View in document** `.ui-ca__view` – in the preview, when the source's document is available
9. **Source viewer** `.ui-ca__viewer` – the side sheet: the source's title and site, Previous / Next passage

## Looks

Standard sets the answer in a white card on a gray tray, with the chips, the caption and the action on the tray
below it. Clean is one white card: the chips sit inside it as outlined pills that fold into a “+N” button when they
don't fit on one line, and the caption and action form the card's last row under a hairline.

The source viewer follows the look: Standard puts the document in a white card on a gray sheet, Clean is one sheet
with hairlines. It's 560px wide, or the whole screen when that's narrower – set `--tc-cited-answer-viewer-w` on the
element to change it. The current passage has the highlight and an accent underline; the answer's other passages from
the same document get a quiet fill.

## Usage

### HTML

```html
<tc-cited-answer id="answer" pages-read="14" action-label="Follow up"></tc-cited-answer>

<script type="module">
  import "@adamstavely/trenchcoat/cited-answer";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.sources = [
    {
      id: "edge",
      title: "Why edge caching cut our p95 latency in half",
      url: "https://engineering.example.com/edge-caching",
      site: "Example Eng",
      quote: "After moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms.",
      highlight: ["p95 latency dropped from 410 ms to 190 ms"],
    },
  ];
  answer.segments = [{ text: "The edge cache roughly halved p95 latency.", cite: ["edge"] }];
  // View in document: the full text, by document id (a source's `document`, else its id)
  answer.loadDocument = (sourceId, signal) => fetch(`/documents/${sourceId}.txt`, { signal }).then((r) => r.text());
  answer.addEventListener("tc-preview-change", (e) => console.log(e.detail.preview));
  answer.addEventListener("tc-source-open", (e) => console.log("viewing", e.detail.sourceId));
</script>
```

### React / Next.js

```tsx
import { CitedAnswer, type CitedSegment, type CitedSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: CitedSource[] = [
  {
    id: "edge",
    title: "Why edge caching cut our p95 latency in half",
    url: "https://engineering.example.com/edge-caching",
    site: "Example Eng",
    quote: "After moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms.",
    highlight: ["p95 latency dropped from 410 ms to 190 ms"],
  },
];
const segments: CitedSegment[] = [{ text: "The edge cache roughly halved p95 latency.", cite: ["edge"] }];

const documents = {
  edge: "Why edge caching cut our p95 latency in half\n\nAfter moving product pages behind the edge cache, p95 latency dropped from 410 ms to 190 ms.",
};

export function Answer({ open }: { open: (url?: string) => void }) {
  return <CitedAnswer segments={segments} sources={sources} pagesRead={14} documents={documents} onOpenSource={(s) => open(s.url)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/cited-answer";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";

defineProps<{ segments: TcCitedAnswer["segments"]; sources: TcCitedAnswer["sources"] }>();
const onPreviewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-cited-answer :segments="segments" :sources="sources" @tc-preview-change="onPreviewChange"></tc-cited-answer>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CitedAnswer } from "@adamstavely/trenchcoat/angular/cited-answer";
import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";

@Component({
  selector: "app-cited-answer-example",
  imports: [CitedAnswer],
  template: `<tc-cited-answer [segments]="segments()" [sources]="sources()" (tc-preview-change)="onPreviewChange($event)"></tc-cited-answer>`,
})
export class CitedAnswerExample {
  readonly segments = input.required<TcCitedAnswer["segments"]>();
  readonly sources = input.required<TcCitedAnswer["sources"]>();
  onPreviewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cited-answer";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";

  let { segments, sources }: { segments: TcCitedAnswer["segments"]; sources: TcCitedAnswer["sources"] } = $props();
  let el: TcCitedAnswer;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-preview-change", on);
    return () => el.removeEventListener("tc-preview-change", on);
  });
</script>

<tc-cited-answer bind:this={el} {segments} {sources}></tc-cited-answer>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `segments` | – | `CitedSegment[]` | `[]` | The answer as text segments, each naming the sources it relies on – a numbered marker ends each cited one |
| `sources` | – | `CitedSource[]` | `[]` | The sources, numbered in this order – chips under the answer and the passages their previews quote |
| `pagesRead` | `pages-read` | `number \| undefined` | `undefined` | Pages the model read while searching – shown in the head next to the source count |
| `preview` | – | `string \| null` | `null` | Id of the source whose preview is open (null: closed) |
| `openHandled` | `open-handled` | `boolean` | `false` | The app opens sources itself (it listens to tc-open-source): links don't navigate, and sources without a url get Open source too |
| `actionLabel` | `action-label` | `string` | `""` | A button on the tray that fires tc-action, e.g. "Follow up" |
| `documents` | – | `Record<string, string>` | `{}` | Full text of the sources' documents, by document id (a source's `document`, else its id) – turns on View in document |
| `loadDocument` | – | `CitedDocumentLoader \| undefined` | `undefined` | Loads a document's full text when `documents` doesn't have it – turns on View in document for every source |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-preview-change` | – | Yes | The open preview changes; detail `{ preview: string \| null }` (null: closed). Cancelable. |
| `tc-open-source` | – | No | Open source was pressed; detail `{ source: CitedSource }` |
| `tc-action` | – | No | The action button (`actionLabel`) was pressed; detail: null |
| `tc-source-open` | – | Yes | View in document was pressed; detail `{ sourceId }` (CitedSourceOpen). Cancelable – prevented, the viewer doesn't open (the page shows the document its own way) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cited-answer-well` | `light-dark(#f4f4f5, #222225)` | standard |
| `--tc-cited-answer-viewer-w` | `560px` | standard, clean |

#### Design tokens it reads (85)

`--tc-accent`, `--tc-accent-highlight`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-cited-answer-glyph-bg`, `--tc-cited-answer-glyph-fg`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-cited-answer :segments="…">` | `<tc-cited-answer [segments]="…">` | `<tc-cited-answer {segments}>` |
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-cited-answer :sources="…">` | `<tc-cited-answer [sources]="…">` | `<tc-cited-answer {sources}>` |
| `preview` | `el.preview = …;` | `<… preview={…} />` | `<tc-cited-answer :preview="…">` | `<tc-cited-answer [preview]="…">` | `<tc-cited-answer {preview}>` |
| `documents` | `el.documents = …;` | `<… documents={…} />` | `<tc-cited-answer :documents="…">` | `<tc-cited-answer [documents]="…">` | `<tc-cited-answer {documents}>` |
| `loadDocument` | `el.loadDocument = …;` | `<… loadDocument={…} />` | `<tc-cited-answer :loadDocument="…">` | `<tc-cited-answer [loadDocument]="…">` | `<tc-cited-answer {loadDocument}>` |

*Also attributes: `pages-read`, `open-handled`, `action-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-preview-change` | Yes | `el.addEventListener("tc-preview-change", (e) => …)` | `ref.current.addEventListener("tc-preview-change", …)` | `@tc-preview-change="…"` | `(tc-preview-change)="…($event)"` | `el.addEventListener("tc-preview-change", …)` |
| `tc-open-source` | No | `el.addEventListener("tc-open-source", (e) => …)` | `onOpenSource={…}` | `@tc-open-source="…"` | `(tc-open-source)="…($event)"` | `el.addEventListener("tc-open-source", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onClick={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-source-open` | Yes | `el.addEventListener("tc-source-open", (e) => …)` | `onSourceOpen={…}` | `@tc-source-open="…"` | `(tc-source-open)="…($event)"` | `el.addEventListener("tc-source-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `preview` itself unless a listener calls `preventDefault()` on `tc-preview-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-cited-answer id="cited-answer"></tc-cited-answer>

<script type="module">
  import "@adamstavely/trenchcoat/cited-answer";

  const el = document.querySelector("#cited-answer");
  el.addEventListener("tc-preview-change", (e) => {
    e.preventDefault(); // the element keeps its preview…
    if (allowed(e.detail.preview)) el.preview = e.detail.preview; // …until the app sets it
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
import "@adamstavely/trenchcoat/cited-answer";
import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";

const props = defineProps<{ initial: TcCitedAnswer["preview"] }>();
const preview = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPreviewChange = (e: CustomEvent<{ preview: TcCitedAnswer["preview"] }>) => {
  e.preventDefault();
  preview.value = e.detail.preview;
};
</script>

<template>
  <tc-cited-answer :preview="preview" @tc-preview-change="onPreviewChange"></tc-cited-answer>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CitedAnswer } from "@adamstavely/trenchcoat/angular/cited-answer";
import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";

@Component({
  selector: "app-controlled-cited-answer",
  imports: [CitedAnswer],
  template: `<tc-cited-answer [preview]="preview()" (tc-preview-change)="onPreviewChange($event)"></tc-cited-answer>`,
})
export class ControlledCitedAnswer {
  readonly initial = input.required<TcCitedAnswer["preview"]>();
  readonly preview = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPreviewChange(e: CustomEvent<{ preview: TcCitedAnswer["preview"] }>) {
    e.preventDefault();
    this.preview.set(e.detail.preview);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cited-answer";
  import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";

  let { initial }: { initial: TcCitedAnswer["preview"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let preview = $derived(initial);
  let el: TcCitedAnswer;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      preview = (e as CustomEvent<{ preview: TcCitedAnswer["preview"] }>).detail.preview;
    };
    el.addEventListener("tc-preview-change", on);
    return () => el.removeEventListener("tc-preview-change", on);
  });
</script>

<tc-cited-answer bind:this={el} {preview}></tc-cited-answer>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-cited-answer")` returns a `TcCitedAnswer` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";`
- **React / Next.js:** Props: `import type { CitedAnswerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CitedAnswer>`. The element class, for refs: `import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCitedAnswer["segments"]` with `import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";`
- **Angular:** The directive types the template: `[segments]` takes `TcCitedAnswer["segments"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCitedAnswer } from "@adamstavely/trenchcoat/cited-answer";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `sources` | `CitedSource[]` | The sources, numbered in this order – chips under the answer and the passages their previews quote |
| `preview` | `string \| null` | Id of the source whose preview is open – controlled when defined (null: closed) |
| `defaultPreview` | `string \| null` | Id of the source whose preview is open at first (uncontrolled) |
| `defaultOpen` | `string` | The old name of `defaultPreview`, still read when that's unset |
| `onOpenSource` | `(source: CitedSource) => void` | Called by Open source. With it the link doesn't navigate on its own – open the page yourself |
| `onPreviewChange` | `(id: string \| null) => void` | Called when the open preview changes (null = closed) |
| `action` | `{ label: string; onClick: () => void }` | A button on the tray, e.g. { label: "Follow up", onClick } |
| `onSourceOpen` | `(sourceId: string, event: CustomEvent<CitedSourceOpen>) => void` | Called by View in document before the source viewer opens; call `event.preventDefault()` to show the document your own way |

*Renamed or hidden on the wrapper: `sources`, `preview`, `openHandled`, `actionLabel`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the markers, then the chips, then the open preview's buttons and the action |
| Enter / Space | On a marker or chip: opens its preview, or closes it if it's open |
| ← / → | On a chip: moves to the previous or next chip (and “+N”) |
| Home / End | On a chip: moves to the first or last chip |
| Escape | Closes the preview and returns focus to the marker or chip that opened it |
| Enter / Space on View in document | Opens the source viewer; focus goes to the document text |
| Tab / Shift+Tab in the viewer | Moves through Close, Previous, Next, Open source and the text – focus stays in the viewer |
| ↑ / ↓ / Page Up / Page Down on the text | Scrolls the document |
| Escape in the viewer | Closes it and returns focus to View in document (the preview stays open) |

Focusing a marker or chip lights it up the same way pointing does.

### Screen readers

The component is a group named “Answer with sources” unless the page names it. Each marker is a button named by its
number and source (“1, source: Example Eng – Why edge caching cut our p95 latency in half”); the chips are a list,
“Sources”, of buttons named the same way. Markers and chips have `aria-expanded` and `aria-controls` pointing at the
preview, a region named “Source 1: Example Eng” that's inert while closed. Its buttons are “Close source”, “Open
source” and “Copy quote” (then “Copied”); a status region says “Quote copied” or “Couldn't copy the quote”. Clean's
overflow button is “+2 more sources”.

The source viewer is a modal dialog named by the source's title; the rest of the page is inert while it's open. The
document text is a focusable region (“… text”, busy while it loads), and the current passage starts with hidden
“Cited passage:” text. A status line says “Passage 2 of 3 in …” on opening and on each step, “Loading the document”
and “Couldn't load the document”. Previous and Next are named “Previous passage” and “Next passage”.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
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
| **This component alone** | 62.2 KB | 13.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **71.8 KB** | **16.7 KB** |
| With Lit – the first component on a page | 92.0 KB | 23.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 68 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of segments replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.5 ms | segments: first render, 562 nodes; update 0.7 ms |
| 1,000 items | 52 ms | segments: first render, 5,242 nodes; update 4.5 ms |

1,000 items of segments: 52 ms. It renders every item, so a first render passes 50 ms (a long task) at about 970 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Cite at the sentence: end each claim with the sources that back it, not a list at the end of the paragraph.
- Give each source a short `site` for its chip (“Latency Notes”) and the page's real `title`.
- Quote the passage the answer relies on, a sentence or two, and `highlight` the phrase that backs it.
- Format `date` the way the rest of the product does – the component shows it as given.
- For the viewer, `quote` must appear in the document text as written (case and line breaks don't matter). Sources
  quoting the same document share a `document` id, so the viewer can step between their passages.

## Do and don't

### Do

- Pass `pagesRead` when the model read more than it cited, so people see the search was wider.
- Give sources their favicon as `icon`; without one they get a letter on a soft colour.
- Handle Open source yourself (`onOpenSource`) when sources open in a side panel or need checking first.
- Use `loadDocument` for documents that are large or fetched on demand; it gets an AbortSignal for when the viewer
  closes first.

### Don't

- Don't cite a source the answer doesn't use – a chip nobody cites says “read, not cited”.
- Don't put the whole page in `quote` – the preview is for the passage, not the article.
- Don't number sources in the text yourself; the markers follow the order of `sources`.
- Don't pass HTML as a document's text – it's shown as plain text, with blank lines starting paragraphs.

## Related

- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up

## Changelog

- cited-answer `defaultOpen` → `defaultPreview`
