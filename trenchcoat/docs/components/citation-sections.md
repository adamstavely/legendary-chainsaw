<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Citation Sections

**Research & portfolio** · New

Where a work is cited – a donut of citing sections (Intro, Methods, Results, Discussion, Other) shaded darkest first, a legend with letter chips and counts, and the section under the pointer or focus with its share

- **Element:** `<tc-citation-sections>`
- **Size:** 6.8 KB gzip · 19.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/citation-sections";` |
| React / Next.js | `import { CitationSections } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/citation-sections";` · tags starting with tc- are custom elements |
| Angular | `import { CitationSections } from "@adamstavely/trenchcoat/angular/citation-sections";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/citation-sections";` |

## Example

The live example is in the gallery at `#/citation-sections`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where in citing papers a work is cited. A donut shows the counts by section – by default Intro, Methods, Results,
Discussion and Other – beside a legend of each section's letter chip, name and count. The sections are shaded from
one ink, darkest first, so the order reads without a palette. Pointing at a segment or a legend row highlights both,
and the readout under the donut names it with its count and share: “Methods · 13 · 4%”. The page may put its own
source name or logo on top, and a "See more details" link under the caption.

### When to use

- Beside a paper, to show whether it's cited for its methods, its results or as background.
- Next to `citation-badge`, which counts citations by kind.

### When not to use

- Counts by kind of citation – use [Citation Badge](citation-badge.md).
- A paper's whole impact – use [Publication Impact](publication-impact.md).
- A share of a whole that people slice and filter – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Source** `.ui-cts__source` – the page's index name or logo, when given
2. **Donut** `.ui-cts__donut` – a segment per section with any citations
3. **Caption** `.ui-cts__caption` – “Sections”, and the legend's name
4. **Readout** `.ui-cts__readout` – the section under the pointer or focus, or the total
5. **Legend** `.ui-cts__legend` – each section's chip, name and count
6. **Details** `.ui-cts__more` – the optional link or button

## Looks

Standard is a white card with a soft shadow. Clean is a hairline card. The shades mix `--tc-cts-ink` (by default
`--tc-chart-1`) into `--tc-cts-track`; set either on the element to change them.

## Usage

### HTML

```html
<tc-citation-sections id="sections" href="/papers/42/citations"></tc-citation-sections>

<script type="module">
  import "@adamstavely/trenchcoat/citation-sections";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#sections").counts = { intro: 107, methods: 13, results: 11, discussion: 114, other: 120 };
</script>
```

### React / Next.js

```tsx
import { CitationSections } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Sections() {
  return <CitationSections href="/papers/42/citations" counts={{ intro: 107, methods: 13, results: 11, discussion: 114, other: 120 }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/citation-sections";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";

defineProps<{ counts: TcCitationSections["counts"]; sections: TcCitationSections["sections"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-citation-sections :counts="counts" :sections="sections" @tc-open="onOpen"></tc-citation-sections>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CitationSections } from "@adamstavely/trenchcoat/angular/citation-sections";
import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";

@Component({
  selector: "app-citation-sections-example",
  imports: [CitationSections],
  template: `<tc-citation-sections [counts]="counts()" [sections]="sections()" (tc-open)="onOpen($event)"></tc-citation-sections>`,
})
export class CitationSectionsExample {
  readonly counts = input.required<TcCitationSections["counts"]>();
  readonly sections = input.required<TcCitationSections["sections"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/citation-sections";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";

  let { counts, sections }: { counts: TcCitationSections["counts"]; sections: TcCitationSections["sections"] } = $props();
  let el: TcCitationSections;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-citation-sections bind:this={el} {counts} {sections}></tc-citation-sections>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `counts` | – | `Record<string, number>` | `{}` | Each section's count by id: { intro: 107, methods: 13 … }; a section without one shows 0 |
| `sections` | – | `CitationSection[]` | `[ { id: "intro", label: "Intro", letter: "I" }, { id: "methods", label: "Methods", letter: "M" }, { id: "results", label: "Results", letter: "R" }, { id: "discussion", label: "Discussion", letter: "D" }, { id: "other", label: "Other", letter: "O" }, ]` | The sections, in order – darkest first; by default Intro, Methods, Results, Discussion and Other |
| `source` | `source` | `string \| undefined` | `undefined` | A source's name shown on top; none by default |
| `logo` | – | `Element \| undefined` | `undefined` | A logo shown on top instead of `source` (cloned) |
| `caption` | `caption` | `string` | `"Sections"` | The caption under the donut, and the legend's name |
| `href` | `href` | `string \| undefined` | `undefined` | Where the details are – adds a link under the caption |
| `openable` | `openable` | `boolean` | `false` | Without `href`, adds a button that fires tc-open |
| `detailsLabel` | `details-label` | `string` | `"See more details"` | The link's or button's text |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | "See more details" was used ({ href }: CitationSectionsOpen); cancelable – prevented, a link isn't followed |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cts-ink` | `var(--tc-chart-1)` | both |
| `--tc-cts-track` | `var(--tc-surface-raised)` | both |

#### Design tokens it reads (39)

`--tc-accent-text`, `--tc-border-default`, `--tc-chart-1`, `--tc-cts-mix`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-tracking-tight`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCitationSections: CitationSection[]` | The sections shown when the page gives none |

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
| `counts` | `el.counts = …;` | `<… counts={…} />` | `<tc-citation-sections :counts="…">` | `<tc-citation-sections [counts]="…">` | `<tc-citation-sections {counts}>` |
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-citation-sections :sections="…">` | `<tc-citation-sections [sections]="…">` | `<tc-citation-sections {sections}>` |
| `logo` | `el.logo = …;` | `<… logo={…} />` | `<tc-citation-sections :logo="…">` | `<tc-citation-sections [logo]="…">` | `<tc-citation-sections {logo}>` |

*Also attributes: `source`, `caption`, `href`, `openable`, `details-label`, `locale` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-citation-sections")` returns a `TcCitationSections` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";`
- **React / Next.js:** Props: `import type { CitationSectionsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CitationSections>`. The element class, for refs: `import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCitationSections["counts"]` with `import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";`
- **Angular:** The directive types the template: `[counts]` takes `TcCitationSections["counts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCitationSections } from "@adamstavely/trenchcoat/citation-sections";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onOpen` | `(href?: string) => boolean \| void` | "See more details" was used; return false to stop a link being followed |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

The legend rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ (or ← / →) | Moves to the previous or next section and highlights it |
| Home / End | Moves to the first or last section |
| Tab | Leaves the legend; with a details link, it's the next stop |

### Screen readers

The legend is a list named by the caption, “Sections”. Each row reads the section, its count and share: “Methods, 13
citations, 4%”. The donut, the letter chips and the readout repeat what the rows say, so they're hidden from screen
readers. The details link reads its text, “See more details”.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
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
| **This component alone** | 12.4 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **19.4 KB** | **6.8 KB** |
| With Lit – the first component on a page | 39.0 KB | 13.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 44 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of sections replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | sections: first render, 614 nodes; update 3.8 ms |
| 1,000 items | 66 ms | sections: first render, 6,014 nodes; update 35 ms |

1,000 items of sections: 66 ms. It renders every item, so a first render passes 50 ms (a long task) at about 760 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name sections as they appear in papers: “Methods”, not “Materials & methods (2)”.
- Give each section one letter that's easy to tell apart, in `letter`.
- Use your own index's name in `source`, never another provider's brand.

## Do and don't

### Do

- Keep to about five sections; fold the rest into "Other".
- Order sections the way papers are read, so the shades follow the paper.

### Don't

- Don't rely on the shades alone – the legend's names and counts are what people read.
- Don't use it for fewer than about twenty citations; the shares won't mean much.

## Related

- [Citation Badge](citation-badge.md) – A small badge of how a work is cited – publications, supporting, mentioning and contrasting counts with their marks, labelled or compact, a tooltip saying what each means and an optional link to the details
- [Publication Impact](publication-impact.md) – One paper's impact on one card – venue, topic, grade and authors, downloads, views, citations and attention with a reads sparkline, mentions, who is reading, and peer, reader and sponsor feedback with a sentiment each
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- **`tc-citation-sections`:** where a work is cited. - **Donut:** citing sections – Intro, Methods, Results, Discussion, Other – with letter chips and a legend.
