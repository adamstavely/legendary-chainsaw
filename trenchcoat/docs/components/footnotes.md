<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Footnotes

**Data & charts** · New

A quiet card of caveats and notes under a page's charts – numbered or bulleted, each with an optional link an app's router can take, and nothing at all when there are none

- **Element:** `<tc-footnotes>`
- **Size:** 5.3 KB gzip · 14.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/footnotes";` |
| React / Next.js | `import { Footnotes } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/footnotes";` · tags starting with tc- are custom elements |
| Angular | `import { Footnotes } from "@adamstavely/trenchcoat/angular/footnotes";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/footnotes";` |

## Example

The live example is in the gallery at `#/footnotes`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A quiet card of caveats and notes that sits under a page's charts: where the numbers come from, what they count and
what they leave out, how fresh they are. The notes are a numbered list in small, muted text, or a bulleted one with
`numbered="false"`. A note can end in a link – its `linkLabel`, or “More” – that an app's router can take over.

With no notes the element renders nothing at all: no card with only a heading, and no region. A page can always
render it and let the notes decide.

### When to use

- Under a dashboard's or report's charts, for the method, the source and the caveats people need to read them right.
- Wherever a few short notes belong together but shouldn't compete with the content above them.

### When not to use

- A warning someone must act on – use [Guardrail Notice](guardrail-notice.md).
- The sources behind an AI answer – use [Citation Sections](citation-sections.md).
- One caveat on one chart – put it in that chart's own description.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the heading (“Notes”) and an optional description, with a muted info icon
2. **Card** `.ui-fnt__card` – the white card holding the list
3. **List** `.ui-fnt__list` – an ordered list, or an unordered one with `numbered="false"`
4. **Note** `.ui-fnt__note` – one note's text `.ui-fnt__text`
5. **Link** `.ui-fnt__link` – the note's link, at its end

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. In both the icon is muted and the notes are small secondary text, so the card reads below the charts it
explains.

## Usage

### HTML

```html
<tc-footnotes id="notes" description="About the charts above"></tc-footnotes>

<script type="module">
  import "@adamstavely/trenchcoat/footnotes";
  import "@adamstavely/trenchcoat/tokens.css";

  const notes = document.querySelector("#notes");
  notes.notes = [
    { id: "count", text: "Papers are counted once, by the first author's centre.", href: "/method", linkLabel: "Method" },
    { id: "lag", text: "The last month is provisional." },
  ];
  notes.addEventListener("tc-navigate", (e) => {
    e.preventDefault();
    history.pushState(null, "", e.detail.href);
  });
</script>
```

### React / Next.js

```tsx
import { Footnotes, type FootnoteNote } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const notes: FootnoteNote[] = [
  { id: "count", text: "Papers are counted once, by the first author's centre.", href: "/method", linkLabel: "Method" },
  { id: "lag", text: "The last month is provisional." },
];

export function ChartNotes() {
  return (
    <Footnotes
      description="About the charts above"
      notes={notes}
      onNavigate={(href, _id, event) => {
        event.preventDefault();
        history.pushState(null, "", href);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/footnotes";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";

defineProps<{ notes: TcFootnotes["notes"] }>();
const onNavigate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-footnotes :notes="notes" @tc-navigate="onNavigate"></tc-footnotes>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Footnotes } from "@adamstavely/trenchcoat/angular/footnotes";
import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";

@Component({
  selector: "app-footnotes-example",
  imports: [Footnotes],
  template: `<tc-footnotes [notes]="notes()" (tc-navigate)="onNavigate($event)"></tc-footnotes>`,
})
export class FootnotesExample {
  readonly notes = input.required<TcFootnotes["notes"]>();
  onNavigate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/footnotes";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";

  let { notes }: { notes: TcFootnotes["notes"] } = $props();
  let el: TcFootnotes;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-footnotes bind:this={el} {notes}></tc-footnotes>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Notes"` | The heading, and the region's name |
| `description` | `description` | `string \| undefined` | `undefined` | A quiet line under the heading |
| `notes` | – | `FootnoteNote[]` | `[]` | The notes, in order |
| `numbered` | `numbered` | `boolean` | `true` | Numbers the notes (default true); numbered="false" gives a plain bulleted list |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-navigate` | – | Yes | A note's link was clicked ({ href, id }: FootnotesNavigate); cancelable – prevented, the link isn't followed |

#### Design tokens it reads (23)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-2xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `notes` | `el.notes = …;` | `<… notes={…} />` | `<tc-footnotes :notes="…">` | `<tc-footnotes [notes]="…">` | `<tc-footnotes {notes}>` |

*Also attributes: `heading`, `description`, `numbered` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-navigate` | Yes | `el.addEventListener("tc-navigate", (e) => …)` | `onNavigate={…}` | `@tc-navigate="…"` | `(tc-navigate)="…($event)"` | `el.addEventListener("tc-navigate", …)` |

### Controlled

`tc-navigate` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-footnotes")` returns a `TcFootnotes` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";`
- **React / Next.js:** Props: `import type { FootnotesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Footnotes>`. The element class, for refs: `import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFootnotes["notes"]` with `import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";`
- **Angular:** The directive types the template: `[notes]` takes `TcFootnotes["notes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFootnotes } from "@adamstavely/trenchcoat/footnotes";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading ("Notes" by default), and the region's name |
| `onNavigate` | `(href: string, id: string, event: CustomEvent<FootnotesNavigate>) => void` | A note's link was clicked; call `event.preventDefault()` to route it yourself instead of following the link |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the notes' links |
| Enter | Follows the focused link (or fires `tc-navigate` for the app to route) |

### Screen readers

The host is a region named by its heading. The notes are a real list – ordered when numbered – so screen readers say
how many there are and which one is being read. Each link is named by its own words, after its note's text. With no
notes there's no region to land on.

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
| **This component alone** | 6.5 KB | 2.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.2 KB** | **5.3 KB** |
| With Lit – the first component on a page | 36.0 KB | 12.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 22 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of notes replaced |
| First on the page | 3.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.7 ms | notes: first render, 262 nodes; update 0.5 ms |
| 1,000 items | 29 ms | notes: first render, 2,512 nodes; update 1.8 ms |

1,000 items of notes: 29 ms, 2,512 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Keep each note to a sentence or two, in plain words: “Papers are counted once, by the first author's centre.”
- Put the source and its refresh time last.
- Give links words that say where they go – “Method”, “Register” – rather than relying on “More”.

## Do and don't

### Do

- Handle `tc-navigate` and call `preventDefault()` to route a link inside the app.
- Pass an empty list rather than hiding the element: it renders nothing until there are notes.

### Don't

- Don't put warnings here that people must act on.
- Don't pass `javascript:` or other unsafe links; they're dropped and the note shows without one.

## Related

- [Guardrail Notice](guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review
- [Metrics Dashboard](../blocks/metrics-dashboard.md) – Sales overview – KPI cards pick the metric, one chart switches between dotted line and bars, with top products and channels (uses `button`, `segmented-control`)
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Citation Sections](citation-sections.md) – Where a work is cited – a donut of citing sections (Intro, Methods, Results, Discussion, Other) shaded darkest first, a legend with letter chips and counts, and the section under the pointer or focus with its share

## Changelog

- **Footnotes:** `tc-footnotes` (`@adamstavely/trenchcoat/footnotes`, React `Footnotes`, Angular `Footnotes` from `@adamstavely/trenchcoat/angular/footnotes`), a quiet card of caveats and notes under a page's charts. - `heading` (“Notes”), `description`, `notes` (`FootnoteNote[]`: `id`, `text`, `href?`, `linkLabel?`, exported), `numbered` (true by default; `numbered="false"` gives a bulleted list) and `look`. The notes are small secondary text in the standard card shell, with a muted icon so the card sits below the charts it explains. - A note's link (its `linkLabel`, or “More”; `href` through `safeUrl`, an unsafe one dropped) fires a cancelable `tc-navigate` (`{ href, id }`: `FootnotesNavigate`) – prevented, the link isn't followed, so an app's router can take it. Modifier clicks are left to the browser. - The host is a region named by the heading. With no notes it renders nothing at all – no heading-only card, no region.
