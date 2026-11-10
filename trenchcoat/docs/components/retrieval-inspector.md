<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Retrieval Inspector

**AI & chat** · New

What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it

- **Element:** `<tc-retrieval-inspector>`
- **Size:** 17.0 KB gzip · 60.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/retrieval-inspector";` |
| React / Next.js | `import { RetrievalInspector } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/retrieval-inspector";` · tags starting with tc- are custom elements |
| Angular | `import { RetrievalInspector } from "@adamstavely/trenchcoat/angular/retrieval-inspector";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/retrieval-inspector";` |

## Example

The live example is in the gallery at `#/retrieval-inspector`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What the model was given to answer with, for one query. Every chunk retrieval returned is listed in rank order with
its score (a bar, with the cutoff marked), its source document and place in it, how fresh the source is, and whether
the answer used it – with the citation marker the answer gave it. Pick a chunk to read it in full, the query's words
marked, with Open source. Below the list sit the misses the app reports: passages that should have come back and
didn't. It is for the people debugging retrieval – why an answer missed a fact, leaned on an outdated page, or ignored
the best match – and it stays fast with 10,000 chunks.

### When to use

- Debugging an answer: what was retrieved, what was used, and what was missing.
- Tuning retrieval – the cutoff, the chunk size, the index – against real queries.
- Reviewing evals where relevant passages are labelled, so misses can be shown.

### When not to use

- Showing people the sources behind an answer as they read it – use [Cited Answer](cited-answer.md).
- Where a whole agent run spent its time and money – use [Trace Waterfall](trace-waterfall.md).
- One source's freshness on its own – use [Validity Badge](validity-badge.md).
- Pass and fail across many test cases – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Numbers** `.ui-rti__stats` – how many were retrieved, used, below the cutoff and missed
2. **Filter** `.ui-rti__filters` – All, Used or Not used, and the cutoff's key
3. **Chunks** `.ui-rti__list` – rank, source and place, score bar, freshness and use, one row each
4. **Open chunk** `.ui-rti__detail` – the score against the cutoff, its use, its place and freshness, the text, Open source
5. **Misses** `.ui-rti__misses` – what the app says should have been retrieved, and why

## Looks

Standard puts the heading and the query on a gray tray and the inspector on a white card inside it. Clean is one
white card with hairline dividers and uppercase captions on the numbers and the open chunk's facts. Wide (from
860 px), the open chunk sits beside the list; narrow (520 px and under), it opens below, the numbers wrap in two
columns and the place in the source gives way in the rows.

## Usage

### HTML

```html
<tc-retrieval-inspector id="retrieval" cutoff="0.5" open-handled></tc-retrieval-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/retrieval-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const inspector = document.querySelector("#retrieval");
  inspector.query = "How long do customers have to return a damaged item?";
  inspector.chunks = [
    { id: "c1", source: "Returns policy", location: "§2.1", score: 0.91, observed: "2026-08-14", used: true, citation: 1, text: "Items that arrive damaged can be reported within 30 days." },
    { id: "c2", source: "Holiday returns 2024", score: 0.81, observed: "2024-11-20", superseded: true, text: "Purchases made in December can be returned until January 31." },
  ];
  inspector.addEventListener("tc-open-source", (e) => console.log(e.detail.chunk.id));
</script>
```

### React / Next.js

```tsx
import { RetrievalInspector, type RetrievalChunk, type RetrievalMiss } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RetrievalDebug({ query, chunks, misses }: { query: string; chunks: RetrievalChunk[]; misses: RetrievalMiss[] }) {
  return <RetrievalInspector query={query} chunks={chunks} misses={misses} cutoff={0.5} defaultShow="used" onOpenSource={(chunk) => console.log(chunk.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/retrieval-inspector";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";

defineProps<{ chunks: TcRetrievalInspector["chunks"]; misses: TcRetrievalInspector["misses"] }>();
const onShowChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-retrieval-inspector :chunks="chunks" :misses="misses" @tc-show-change="onShowChange"></tc-retrieval-inspector>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RetrievalInspector } from "@adamstavely/trenchcoat/angular/retrieval-inspector";
import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";

@Component({
  selector: "app-retrieval-inspector-example",
  imports: [RetrievalInspector],
  template: `<tc-retrieval-inspector [chunks]="chunks()" [misses]="misses()" (tc-show-change)="onShowChange($event)"></tc-retrieval-inspector>`,
})
export class RetrievalInspectorExample {
  readonly chunks = input.required<TcRetrievalInspector["chunks"]>();
  readonly misses = input.required<TcRetrievalInspector["misses"]>();
  onShowChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/retrieval-inspector";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";

  let { chunks, misses }: { chunks: TcRetrievalInspector["chunks"]; misses: TcRetrievalInspector["misses"] } = $props();
  let el: TcRetrievalInspector;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-show-change", on);
    return () => el.removeEventListener("tc-show-change", on);
  });
</script>

<tc-retrieval-inspector bind:this={el} {chunks} {misses}></tc-retrieval-inspector>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Retrieval"` | The heading |
| `query` | `query` | `string` | `""` | The query the chunks were retrieved for |
| `chunks` | – | `RetrievalChunk[]` | `[]` | The chunks, in rank order – the first is the best match |
| `misses` | – | `RetrievalMiss[]` | `[]` | Chunks the app reports should have been retrieved and weren't |
| `cutoff` | `cutoff` | `number \| undefined` | `undefined` | The score below which chunks are left out of the prompt – marked on every score bar; unset marks none |
| `maxScore` | `max-score` | `number \| undefined` | `undefined` | The top of the score scale – defaults to 1, or the highest score when that is higher |
| `show` | `show` | `RetrievalShow` | `"all"` | Which chunks show: "all", "used" (by the answer) or "unused" |
| `selected` | `selected` | `string \| null` | `null` | The id of the open chunk, or null |
| `profile` | – | `ValidityProfileName \| ValidityProfile` | `"standard"` | How fast sources go stale, for chunks without their own `profile` – see tc-validity-badge |
| `now` | `now` | `number \| undefined` | `undefined` | The moment freshness is counted to, in epoch ms – defaults to when each badge connected |
| `openHandled` | `open-handled` | `boolean` | `false` | Open source fires tc-open-source and the link doesn't navigate on its own; chunks without a url get the button |
| `maxHeight` | `max-height` | `number` | `392` | The list's height before it scrolls, in px |
| `formatScore` | – | `(score: number) => string` | `twoPlaces` | Formats a score – defaults to two decimals, e.g. "0.82" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-show-change` | – | Yes | All, Used or Not used was picked ({ show }: RetrievalShowChange); cancelable |
| `tc-selected-change` | – | Yes | A chunk was picked or the open one closed ({ selected, chunk }: RetrievalSelectedChange); cancelable |
| `tc-open-source` | – | No | Open source was pressed, or Enter on a chunk with a source to open ({ chunk }: RetrievalOpenSource) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-retrieval-inspector-row` | `54px` | both, clean |
| `--tc-retrieval-inspector-bar` | `56px` | both |
| `--tc-retrieval-inspector-fill` | `var(--tc-accent)` | both |
| `--tc-retrieval-inspector-cut` | `var(--tc-status-warning-solid)` | both |
| `--tc-retrieval-inspector-side` | `380px` | both |

#### Design tokens it reads (89)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `chunks` | `el.chunks = …;` | `<… chunks={…} />` | `<tc-retrieval-inspector :chunks="…">` | `<tc-retrieval-inspector [chunks]="…">` | `<tc-retrieval-inspector {chunks}>` |
| `misses` | `el.misses = …;` | `<… misses={…} />` | `<tc-retrieval-inspector :misses="…">` | `<tc-retrieval-inspector [misses]="…">` | `<tc-retrieval-inspector {misses}>` |
| `profile` | `el.profile = …;` | `<… profile={…} />` | `<tc-retrieval-inspector :profile="…">` | `<tc-retrieval-inspector [profile]="…">` | `<tc-retrieval-inspector {profile}>` |
| `formatScore` | `el.formatScore = …;` | `<… formatScore={…} />` | `<tc-retrieval-inspector :formatScore="…">` | `<tc-retrieval-inspector [formatScore]="…">` | `<tc-retrieval-inspector {formatScore}>` |

*Also attributes: `heading`, `query`, `cutoff`, `max-score`, `show`, `selected`, `now`, `open-handled` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-show-change` | Yes | `el.addEventListener("tc-show-change", (e) => …)` | `ref.current.addEventListener("tc-show-change", …)` | `@tc-show-change="…"` | `(tc-show-change)="…($event)"` | `el.addEventListener("tc-show-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-open-source` | No | `el.addEventListener("tc-open-source", (e) => …)` | `onOpenSource={…}` | `@tc-open-source="…"` | `(tc-open-source)="…($event)"` | `el.addEventListener("tc-open-source", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `show` and `selected` itself unless a listener calls `preventDefault()` on `tc-show-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-retrieval-inspector id="retrieval-inspector"></tc-retrieval-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/retrieval-inspector";

  const el = document.querySelector("#retrieval-inspector");
  el.addEventListener("tc-show-change", (e) => {
    e.preventDefault(); // the element keeps its show…
    if (allowed(e.detail.show)) el.show = e.detail.show; // …until the app sets it
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
import "@adamstavely/trenchcoat/retrieval-inspector";
import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";

const props = defineProps<{ initial: TcRetrievalInspector["show"] }>();
const show = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onShowChange = (e: CustomEvent<{ show: TcRetrievalInspector["show"] }>) => {
  e.preventDefault();
  show.value = e.detail.show;
};
</script>

<template>
  <tc-retrieval-inspector :show="show" @tc-show-change="onShowChange"></tc-retrieval-inspector>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RetrievalInspector } from "@adamstavely/trenchcoat/angular/retrieval-inspector";
import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";

@Component({
  selector: "app-controlled-retrieval-inspector",
  imports: [RetrievalInspector],
  template: `<tc-retrieval-inspector [show]="show()" (tc-show-change)="onShowChange($event)"></tc-retrieval-inspector>`,
})
export class ControlledRetrievalInspector {
  readonly initial = input.required<TcRetrievalInspector["show"]>();
  readonly show = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onShowChange(e: CustomEvent<{ show: TcRetrievalInspector["show"] }>) {
    e.preventDefault();
    this.show.set(e.detail.show);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/retrieval-inspector";
  import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";

  let { initial }: { initial: TcRetrievalInspector["show"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let show = $derived(initial);
  let el: TcRetrievalInspector;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      show = (e as CustomEvent<{ show: TcRetrievalInspector["show"] }>).detail.show;
    };
    el.addEventListener("tc-show-change", on);
    return () => el.removeEventListener("tc-show-change", on);
  });
</script>

<tc-retrieval-inspector bind:this={el} {show}></tc-retrieval-inspector>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-retrieval-inspector")` returns a `TcRetrievalInspector` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";`
- **React / Next.js:** Props: `import type { RetrievalInspectorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RetrievalInspector>`. The element class, for refs: `import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRetrievalInspector["chunks"]` with `import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";`
- **Angular:** The directive types the template: `[chunks]` takes `TcRetrievalInspector["chunks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRetrievalInspector } from "@adamstavely/trenchcoat/retrieval-inspector";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Retrieval" |
| `show` | `RetrievalShow` | Which chunks show – "all", "used" or "unused". Controlled when defined; otherwise the component keeps it |
| `defaultShow` | `RetrievalShow` | Which chunks show at first when `show` isn't controlled |
| `onShowChange` | `(show: RetrievalShow) => void` | Called with the filter the user picked, controlled or not |
| `selected` | `string \| null` | The id of the open chunk, or null. Controlled when defined |
| `defaultSelected` | `string \| null` | The chunk open at first when `selected` isn't controlled |
| `onSelectedChange` | `(id: string \| null, chunk?: RetrievalChunk) => void` | Called with the chunk picked (or null when it closes), controlled or not |
| `onOpenSource` | `(chunk: RetrievalChunk) => void` | Called by Open source. With it the link doesn't navigate on its own – open the document yourself |

*Renamed or hidden on the wrapper: `heading`, `show`, `selected`, `openHandled`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the filter, the list, then the open chunk's Close and Open source |
| ← / → / ↑ / ↓ | In the filter, picks the previous or next option, wrapping round |
| ↓ / ↑ | In the list, moves to the next or previous chunk and opens it |
| Home / End | In the list, moves to the first or last chunk and opens it |
| Page Up / Page Down | In the list, moves eight chunks and opens the one it lands on |
| Enter | In the list, opens the active chunk's source, when it has one (or `open-handled` is set) |
| Escape | Closes the open chunk; from inside it, focus goes back to the list |

### Screen readers

The list is a `listbox` named by the heading; focus stays on it and `aria-activedescendant` points at the active
chunk. Each chunk is an `option` with `aria-selected`, `aria-posinset` and `aria-setsize` (so “5 of 1,200” is right
while only the nearby rows are rendered), read as “Rank 1: Returns policy, §2.1, score 0.91. Items that arrive
damaged… Used as 1”, with “below the cutoff” when it is. Freshness comes from `tc-validity-badge`: “High source,
observed 10 days ago”. The filter is a `radiogroup` named “Show”, each option with its count (“Used, 2 chunks”); after
it changes, a status region says what is left (“Used: 2 chunks”). The open chunk is a region named by its rank and
source; the query's words in its text are `<mark>` elements. The misses are a region named “Missed, 1”.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, validity-badge, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, validity-badge, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | validity-badge | – |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | validity-badge | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | validity-badge, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.1 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [validity-badge](validity-badge.md) · Element it renders | 17.8 KB | – |
| **Added to a page that already has Lit** | **60.4 KB** | **17.1 KB** |
| With Lit – the first component on a page | 82.7 KB | 24.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **8.8 ms** | the gallery demo's data, 1,336 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of chunks replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 9.7 ms | chunks: first render, 1,336 nodes; update 1.6 ms |

Windowed: 10,000 items of chunks render 1,336 nodes in 9.7 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (validity-badge), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (validity-badge), `MutationObserver` (validity-badge), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `Date.now()` (validity-badge), `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pass the query exactly as retrieval saw it – after any rewriting – so the marked words make sense.
- Write `location` the way a person would find the place: “§2.1 Damaged on arrival”, “p. 12”.
- Give misses a `reason` that says how you know: “Marked relevant in the eval set”.
- Set `profile` for how fast your sources go stale; a price list and a policy manual age differently.

## Do and don't

### Do

- Set `cutoff` when the app drops chunks below a score – the bars and the numbers show what fell under it.
- Pass the answer's citation markers as `citation`, so a row can be matched to the answer.
- Set `now` to look at freshness as of the day the answer was given.

### Don't

- Don't re-sort the chunks before passing them – the rank is what retrieval returned.
- Don't mark a chunk `used` because it was in the prompt; mark it when the answer relied on it.
- Don't put the whole document in a chunk's `text` – show what the model was given.

## Related

- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Validity Badge](validity-badge.md) – How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
