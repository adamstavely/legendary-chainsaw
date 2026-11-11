<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Citation Badge

**Research & portfolio** · New

A small badge of how a work is cited – publications, supporting, mentioning and contrasting counts with their marks, labelled or compact, a tooltip saying what each means and an optional link to the details

- **Element:** `<tc-citation-badge>`
- **Size:** 6.8 KB gzip · 19.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/citation-badge";` |
| React / Next.js | `import { CitationBadge } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/citation-badge";` · tags starting with tc- are custom elements |
| Angular | `import { CitationBadge } from "@adamstavely/trenchcoat/angular/citation-badge";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/citation-badge";` |

## Example

The live example is in the gallery at `#/citation-badge`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small badge of how a work is cited, to embed beside a paper, a profile or a search result. It shows a count per
kind of citation – by default Publications, Supporting, Mentioning and Contrasting – each with its own mark. On hover
or focus a tooltip lists each kind in words with its count and what it means. The page may put its own source name or
logo on top; there is no brand line otherwise. The whole badge is one control: a link with `href`, a button with
`openable`, else simply focusable so the tooltip can be reached.

### When to use

- Beside a paper, a dataset or a researcher, where a glance at how it's cited helps.
- In lists of results, using the compact layout.
- With your own citation index, its name in `source`.

### When not to use

- Where in citing papers a work is cited – use [Citation Sections](citation-sections.md).
- A paper's whole impact – use [Publication Impact](publication-impact.md).
- The sources behind an AI answer – use [Cited Answer](cited-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Badge** `.ui-ctb__badge` – the control: the source line and the counts
2. **Source** `.ui-ctb__source` – the page's index name or logo, when given
3. **Mark** `.ui-ctb__mark` – each kind's icon, tinted by its tone
4. **Count** `.ui-ctb__count` – each kind's count, in tabular numbers
5. **Tooltip** `.ui-ctb__tip` – each kind in words, its count and what it means

## Looks

Standard is a white badge with a soft shadow. Clean is a hairline badge with thinner marks. `layout="labelled"` shows
each kind's name, mark and count; `layout="compact"` only the mark and the count, the numbers right-aligned.

## Usage

### HTML

```html
<tc-citation-badge id="badge" source="Larkfield Index" href="/papers/42/citations"></tc-citation-badge>

<script type="module">
  import "@adamstavely/trenchcoat/citation-badge";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#badge").counts = { publications: 522, supporting: 29, mentioning: 348, contrasting: 7 };
</script>
```

### React / Next.js

```tsx
import { CitationBadge } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Badge() {
  return <CitationBadge source="Larkfield Index" href="/papers/42/citations" counts={{ publications: 522, supporting: 29, mentioning: 348, contrasting: 7 }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/citation-badge";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";

defineProps<{ counts: TcCitationBadge["counts"]; rows: TcCitationBadge["rows"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-citation-badge :counts="counts" :rows="rows" @tc-open="onOpen"></tc-citation-badge>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CitationBadge } from "@adamstavely/trenchcoat/angular/citation-badge";
import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";

@Component({
  selector: "app-citation-badge-example",
  imports: [CitationBadge],
  template: `<tc-citation-badge [counts]="counts()" [rows]="rows()" (tc-open)="onOpen($event)"></tc-citation-badge>`,
})
export class CitationBadgeExample {
  readonly counts = input.required<TcCitationBadge["counts"]>();
  readonly rows = input.required<TcCitationBadge["rows"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/citation-badge";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";

  let { counts, rows }: { counts: TcCitationBadge["counts"]; rows: TcCitationBadge["rows"] } = $props();
  let el: TcCitationBadge;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-citation-badge bind:this={el} {counts} {rows}></tc-citation-badge>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `counts` | – | `Record<string, number>` | `{}` | Each kind's count by id: { publications: 522, supporting: 29 … }; a kind without one shows 0 |
| `rows` | – | `CitationRow[]` | `[ { id: "publications", label: "Publications", icon: "document", tone: "neutral", meaning: "publications that cite this work" }, { id: "supporting", label: "Supporting", icon: "supporting", tone: "success", meaning: "cites this work as evidence for its claim" }, { id: "mentioning", label: "Mentioning", icon: "mentioning", tone: "neutral", meaning: "refers to this work without taking a side" }, { id: "contrasting", label: "Contrasting", icon: "contrasting", tone: "info", meaning: "reports findings that question or disagree with it" }, ]` | The kinds, in order; by default Publications, Supporting, Mentioning and Contrasting |
| `layout` | `layout` | `"labelled" \| "compact"` | `"labelled"` | "labelled": name, mark and count; "compact": the mark and the count |
| `source` | `source` | `string \| undefined` | `undefined` | A source's name shown on top, e.g. your index's name; none by default |
| `logo` | – | `Element \| undefined` | `undefined` | A logo shown on top instead of `source` (cloned); give it an accessible name, or set `source` too |
| `label` | `label` | `string` | `"Citations"` | What the counts are, for the badge's name when there's no `source` |
| `href` | `href` | `string \| undefined` | `undefined` | Where the details are – the badge becomes a link |
| `openable` | `openable` | `boolean` | `false` | Without `href`, makes the badge a button that fires tc-open |
| `detailsLabel` | `details-label` | `string` | `"See more details"` | The link's hint in the tooltip |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | The badge was opened (clicked, or Enter on it) with `href` or `openable` ({ href }: CitationOpen); cancelable – prevented, a link isn't followed |

#### Design tokens it reads (39)

`--tc-border-default`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-shadow-raised-hover`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tracking-tight`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCitationRows: CitationRow[]` | The kinds shown when the page gives none |

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
| `counts` | `el.counts = …;` | `<… counts={…} />` | `<tc-citation-badge :counts="…">` | `<tc-citation-badge [counts]="…">` | `<tc-citation-badge {counts}>` |
| `rows` | `el.rows = …;` | `<… rows={…} />` | `<tc-citation-badge :rows="…">` | `<tc-citation-badge [rows]="…">` | `<tc-citation-badge {rows}>` |
| `logo` | `el.logo = …;` | `<… logo={…} />` | `<tc-citation-badge :logo="…">` | `<tc-citation-badge [logo]="…">` | `<tc-citation-badge {logo}>` |

*Also attributes: `layout`, `source`, `label`, `href`, `openable`, `details-label`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

### Controlled

`tc-open` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-citation-badge")` returns a `TcCitationBadge` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";`
- **React / Next.js:** Props: `import type { CitationBadgeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CitationBadge>`. The element class, for refs: `import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCitationBadge["counts"]` with `import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";`
- **Angular:** The directive types the template: `[counts]` takes `TcCitationBadge["counts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCitationBadge } from "@adamstavely/trenchcoat/citation-badge";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onOpen` | `(href?: string) => boolean \| void` | The badge was opened (with `href` or `openable`); return false to stop a link being followed |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Focuses the badge and shows its tooltip |
| Enter | Follows the link (`href`) or fires tc-open (`openable`) |
| Space | Fires tc-open when the badge is a button |
| Escape | Hides the tooltip |

### Screen readers

The badge's name sums the counts up: “Citations: 522 publications, 29 supporting, 348 mentioning and 7 contrasting”,
starting with `source` when it's set. It's described by the tooltip, which says what each kind means. Without a link
or `openable` it's an image, focusable so the description can be read. The marks are hidden; the words read.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
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
| **This component alone** | 12.7 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **19.7 KB** | **6.8 KB** |
| With Lit – the first component on a page | 39.3 KB | 13.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of rows replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | rows: first render, 1,605 nodes; update 3.9 ms |
| 1,000 items | 59 ms | rows: first render, 16,005 nodes; update 22 ms |

1,000 items of rows: 59 ms. It renders every item, so a first render passes 50 ms (a long task) at about 850 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document keydown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep the kinds' names to one word, and say what each means in `meaning`: “cites this work as evidence for its claim”.
- Use your own index's name in `source`, never another provider's brand.

## Do and don't

### Do

- Use the compact layout in dense lists, and the labelled one on a paper's page.
- Link the badge to where the citing statements can be read.

### Don't

- Don't use the tones for anything but the kind of citation.
- Don't put more than about five kinds in one badge.

## Related

- [Citation Sections](citation-sections.md) – Where a work is cited – a donut of citing sections (Intro, Methods, Results, Discussion, Other) shaded darkest first, a legend with letter chips and counts, and the section under the pointer or focus with its share
- [Publication Impact](publication-impact.md) – One paper's impact on one card – venue, topic, grade and authors, downloads, views, citations and attention with a reads sparkline, mentions, who is reading, and peer, reader and sponsor feedback with a sentiment each
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked

## Changelog

- **`tc-citation-badge`:** an embeddable badge of citation tallies – publications, supporting, mentioning and contrasting. - **Layouts:** labelled or compact. - **Details:** a tooltip says what each type means, and an optional link goes to more. No third-party branding.
