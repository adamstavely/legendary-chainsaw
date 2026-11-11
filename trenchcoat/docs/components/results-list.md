<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Results List

**Search** · New

Search results to read and open – kind, title, a snippet with the query's words marked, source and date, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more

- **Element:** `<tc-results-list>`
- **Size:** 9.3 KB gzip · 28.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/results-list";` |
| React / Next.js | `import { ResultsList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/results-list";` · tags starting with tc- are custom elements |
| Angular | `import { ResultsList } from "@adamstavely/trenchcoat/angular/results-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/results-list";` |

## Example

The live example is in the gallery at `#/results-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a search found, laid out to read and open. Each result shows an icon and a pill for its kind (a document, a
person, an email – any word), its title, a snippet with every word of the query picked out, and one quiet line with
its source, date and whatever else the page adds. Results are grouped under their kind with a count
("Documents 12"), or listed as they come. Relevance / Date reorders them. "Did you mean" offers a corrected query,
Show more adds the next lot, and placeholder rows stand in while a search runs.

### When to use

- The results page under a search box – [AI Search](ai-search.md), a query from [Query Builder](query-builder.md) or a
  saved search.
- Mixed results – files, people, messages – that read better grouped by kind.

### When not to use

- Rows people sort by column, select and edit – use [Data Table](data-table.md).
- Suggestions while typing – [AI Search](ai-search.md) has its own.
- A list of documents with owners and status – use [Document List](document-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Sort** `.ui-rsl__sort` – Relevance and Date, in the header
2. **Did you mean** `.ui-rsl__suggest` – a corrected query to search for instead
3. **Group** `.ui-rsl__group` – results of one kind under their heading and count
4. **Result** `.ui-rsl__item` – the kind's icon, the title, the snippet and the quiet line
5. **Mark** `.ui-rsl__mark` – a word of the query in a title or snippet
6. **Show more** `.ui-rsl__more` – the next `page-size` results

## Looks

Standard puts the header and sort on a gray tray above a white card; Clean is one white card with the header as its
first row. The query's words are marked with a soft amber wash. Snippets clamp to three lines, and to two in a narrow
column, where the kind icons also step aside.

A page can set `--tc-rsl-snippet-lines`.

## Usage

### HTML

```html
<tc-results-list query="coral bleaching"></tc-results-list>
<script type="module">
  const list = document.querySelector("tc-results-list");
  list.results = [{ id: "r1", kind: "Document", title: "Coral bleaching survey", snippet: "Bleaching affected 38% of colonies…", source: "Grant reports" }];
  list.addEventListener("tc-open", (e) => console.log("open", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { ResultsList, type SearchResult } from "@adamstavely/trenchcoat/react";

export function Results({ query, results }: { query: string; results: SearchResult[] }) {
  return <ResultsList query={query} results={results} total={`About ${results.length} results`} onOpenResult={(r) => console.log(r.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/results-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";

defineProps<{ results: TcResultsList["results"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-results-list :results="results" @tc-open="onOpen"></tc-results-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ResultsList } from "@adamstavely/trenchcoat/angular/results-list";
import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";

@Component({
  selector: "app-results-list-example",
  imports: [ResultsList],
  template: `<tc-results-list [results]="results()" (tc-open)="onOpen($event)"></tc-results-list>`,
})
export class ResultsListExample {
  readonly results = input.required<TcResultsList["results"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/results-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";

  let { results }: { results: TcResultsList["results"] } = $props();
  let el: TcResultsList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-results-list bind:this={el} {results}></tc-results-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Results"` | The heading, and the list's name |
| `query` | `query` | `string` | `""` | What was searched for; its words are picked out in titles and snippets |
| `results` | – | `SearchResult[]` | `[]` | The results, in order of relevance |
| `group` | `group` | `ResultsGroup` | `"kind"` | Group results under their kind, or list them as they come |
| `pluralKinds` | `plural-kinds` | `boolean` | `true` | Group headings put the kind in the plural ("Document" → "Documents"); `plural-kinds="false"` shows each kind exactly as given, for proper names ("NREL", "Sandia National Laboratories") |
| `suggestion` | `suggestion` | `string \| undefined` | `undefined` | "Did you mean …" – a corrected query to offer |
| `total` | `total` | `string \| undefined` | `undefined` | How many there are in all, in words ("About 1,240 results"); by default the count of `results` |
| `sort` | `sort` | `ResultsSort` | `"relevance"` | The order. Changed by the user unless a tc-sort-change listener calls preventDefault() |
| `loading` | `loading` | `boolean` | `false` | Waiting for results: placeholder rows |
| `selected` | `selected` | `string \| null` | `null` | The result in focus. Changed by the user unless tc-selected-change is prevented |
| `pageSize` | `page-size` | `number` | `10` | How many show at first, and how many Show more adds |
| `hasMore` | `has-more` | `boolean` | `false` | There are more than `results` holds: Show more stays, for the page to load them (tc-more) |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | A result was opened ({ id, result }: ResultsOpen); cancelable – prevented, a link doesn't follow |
| `tc-selected-change` | – | Yes | The result in focus changed ({ selected, result }: ResultsSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-sort-change` | – | Yes | Relevance or Date was picked ({ sort }: ResultsSortChange); cancelable – prevented, `sort` stays as it was |
| `tc-suggestion` | – | No | "Did you mean" was pressed ({ suggestion }: ResultsSuggestion) – search for it |
| `tc-more` | – | Yes | Show more was pressed ({ shown, total }: ResultsMore); cancelable – prevented, the page adds the next results itself |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rsl-snippet-lines` | `3` | clean |

#### Design tokens it reads (65)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-8`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `pluralKind(kind: string): void` | A kind's group heading: "Document" → "Documents", "Person" → "People", "Inbox" → "Inboxes" |
| `queryTerms(query: string): void` | The query's words worth picking out: two letters or more, longest first so a longer word wins an overlap |

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
| `results` | `el.results = …;` | `<… results={…} />` | `<tc-results-list :results="…">` | `<tc-results-list [results]="…">` | `<tc-results-list {results}>` |

*Also attributes: `heading`, `query`, `group`, `plural-kinds`, `suggestion`, `total`, `sort`, `loading` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpenResult={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `ref.current.addEventListener("tc-sort-change", …)` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |
| `tc-suggestion` | No | `el.addEventListener("tc-suggestion", (e) => …)` | `onSuggestion={…}` | `@tc-suggestion="…"` | `(tc-suggestion)="…($event)"` | `el.addEventListener("tc-suggestion", …)` |
| `tc-more` | Yes | `el.addEventListener("tc-more", (e) => …)` | `onMore={…}` | `@tc-more="…"` | `(tc-more)="…($event)"` | `el.addEventListener("tc-more", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sort` and `selected` itself unless a listener calls `preventDefault()` on `tc-sort-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-results-list id="results-list"></tc-results-list>

<script type="module">
  import "@adamstavely/trenchcoat/results-list";

  const el = document.querySelector("#results-list");
  el.addEventListener("tc-sort-change", (e) => {
    e.preventDefault(); // the element keeps its sort…
    if (allowed(e.detail.sort)) el.sort = e.detail.sort; // …until the app sets it
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
import "@adamstavely/trenchcoat/results-list";
import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";

const props = defineProps<{ initial: TcResultsList["sort"] }>();
const sort = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSortChange = (e: CustomEvent<{ sort: TcResultsList["sort"] }>) => {
  e.preventDefault();
  sort.value = e.detail.sort;
};
</script>

<template>
  <tc-results-list :sort="sort" @tc-sort-change="onSortChange"></tc-results-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ResultsList } from "@adamstavely/trenchcoat/angular/results-list";
import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";

@Component({
  selector: "app-controlled-results-list",
  imports: [ResultsList],
  template: `<tc-results-list [sort]="sort()" (tc-sort-change)="onSortChange($event)"></tc-results-list>`,
})
export class ControlledResultsList {
  readonly initial = input.required<TcResultsList["sort"]>();
  readonly sort = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSortChange(e: CustomEvent<{ sort: TcResultsList["sort"] }>) {
    e.preventDefault();
    this.sort.set(e.detail.sort);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/results-list";
  import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";

  let { initial }: { initial: TcResultsList["sort"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sort = $derived(initial);
  let el: TcResultsList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sort = (e as CustomEvent<{ sort: TcResultsList["sort"] }>).detail.sort;
    };
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-results-list bind:this={el} {sort}></tc-results-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-results-list")` returns a `TcResultsList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";`
- **React / Next.js:** Props: `import type { ResultsListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ResultsList>`. The element class, for refs: `import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcResultsList["results"]` with `import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";`
- **Angular:** The directive types the template: `[results]` takes `TcResultsList["results"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcResultsList } from "@adamstavely/trenchcoat/results-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `sort` | `ResultsSort` | The order – controlled when given |
| `defaultSort` | `ResultsSort` | The order on mount when `sort` isn't controlled |
| `onSortChange` | `(sort: ResultsSort) => void` | The order changed |
| `selected` | `string \| null` | The result in focus – controlled when given |
| `defaultSelected` | `string \| null` | The result in focus on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, result?: SearchResult) => void` | The result in focus changed |
| `onOpenResult` | `(result: SearchResult, event: CustomEvent<ResultsOpen>) => void` | A result was opened; `event.preventDefault()` stops a link from following |
| `onSuggestion` | `(suggestion: string) => void` | "Did you mean" was pressed |
| `onMore` | `(detail: ResultsMore, event: CustomEvent<ResultsMore>) => void` | Show more was pressed; `event.preventDefault()` when you add the next results yourself |

*Renamed or hidden on the wrapper: `heading`, `sort`, `selected`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | To the results (one stop), and on to Show more |
| ↑ / ↓ | Previous / next result |
| Home / End | First / last result |
| Enter | Opens the result |

### Screen readers

- Each group is a section named by its heading; each title is a link (or a button) named by its words.
- Sort is a group of pressed buttons. The order, and how many Show more added, are announced in a polite status line.
- While loading, the card is `aria-busy` and the placeholder rows are hidden.

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

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.2 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.3 KB** | **9.3 KB** |
| With Lit – the first component on a page | 47.8 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 107 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of results replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.2 ms | results: first render, 107 nodes; update 0.5 ms |
| 1,000 items | 1.8 ms | results: first render, 107 nodes; update 0.5 ms |

What it renders doesn't grow with results (tested to 1,000 items).

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

- Write snippets as the passage that matched, not the document's first line.
- Use a handful of kinds people recognise – "Document", "Person", "Email" – so the groups stay few.
- Put the total in words when you have it from the server ("About 1,240 results").

## Do and don't

### Do

- Offer "Did you mean" only when the corrected query finds more.
- Keep sources short – a folder or a site, not a path.

### Don't

- Mark every word: one-letter words are ignored for a reason.
- Show more than a couple of meta items; the line should stay one line.

## Related

- [AI Search](ai-search.md) – One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K
- [Facet Sidebar](facet-sidebar.md) – Filters beside search results, with counts – checkbox, radio, range and date facets that fold, the filters in use as removable chips with Clear all, Show more and a search box in long facets
- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each
- [Saved Search Alerts](saved-search-alerts.md) – Saved searches that tell you about new matches – “12 new since Tue”, how often and where each one checks, pause, Run now, remove with Undo, and Add alert from the current search

## Changelog

- **Search** - **Results List** (`tc-results-list`) – results with the query's words marked in their snippets, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more. - **Facet Sidebar** (`tc-facet-sidebar`) – checkbox, radio, range and date filters with counts, active filters as chips with Clear all. - **Saved Search Alerts** (`tc-saved-search-alerts`) – saved searches that report new matches, with frequency, channels, pause, Run now and remove with Undo.
