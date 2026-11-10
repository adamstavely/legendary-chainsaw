<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Fact Sheet

**People & profiles** · New

What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly

- **Element:** `<tc-fact-sheet>`
- **Size:** 8.2 KB gzip · 25.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/fact-sheet";` |
| React / Next.js | `import { FactSheet } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/fact-sheet";` · tags starting with tc- are custom elements |
| Angular | `import { FactSheet } from "@adamstavely/trenchcoat/angular/fact-sheet";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/fact-sheet";` |

## Example

The live example is in the gallery at `#/fact-sheet`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What's known about a person, an organisation or a record, and how far each fact can be trusted. Facts sit in labelled
sections, and every value carries a small tag naming its source and grade, e.g. “Registry · A1”. Grades use the
Admiralty (NATO) scale:
- **The letter** says how reliable the source is: A completely reliable through E unreliable, and F can't be judged.
- **The digit** says how credible the information is: 1 confirmed through 5 improbable, and 6 can't be judged.

Each grade falls into a confidence band: high, medium, low or unknown. The band tints the tag and fills a three-bar
mark. When two sources disagree, both readings show under a “Conflicting” pill. A fact nobody has a value for says so
plainly.

### When to use

- A customer, supplier or counterparty profile in due diligence (KYC) or onboarding, where every fact needs its source.
- Research or case notes where readers must weigh sources against each other.
- Any record assembled from several systems that don't always agree.

### When not to use

- Where an answer's claims came from – use [Provenance Summary](provenance-summary.md).
- How confident an AI is in one answer – use [Confidence Brief](confidence-brief.md).
- Which claims have evidence behind them – use [Evidence Coverage](evidence-coverage.md).
- Many records with the same fields, to sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **How grades work** `.ui-fsh__legend-btn` – opens the scale under the header
2. **Scale** `.ui-fsh__legend` – the letters, the digits and which band each falls in
3. **Section** `.ui-fsh__section` – a titled group of facts; two columns of sections when the element is wide
4. **Label** `.ui-fsh__label` – what the fact is, with a “Conflicting” pill when sources disagree
5. **Value** `.ui-fsh__value` – the value or values, or “Not known”
6. **Source tag** `.ui-fsh__tag` – the source and grade, tinted by band with a three-bar mark
7. **Copy** `.ui-fsh__copy` – copies the value, when `copyable`

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight values. Clean is one
white card with the header as its first row and regular-weight values. The tags, bands and scale are the same in both.

## Usage

### HTML

```html
<tc-fact-sheet id="facts" heading="Customer profile"></tc-fact-sheet>

<script type="module">
  import "@adamstavely/trenchcoat/fact-sheet";
  import "@adamstavely/trenchcoat/tokens.css";

  const facts = document.querySelector("#facts");
  facts.sections = [
    {
      id: "identity",
      title: "Identity",
      facts: [
        { id: "name", label: "Full name", value: "Elena María Ruiz", source: { label: "Passport", grade: "A1" }, copyable: true },
        {
          id: "address",
          label: "Address",
          value: "Calle de la Loza 14, Valencia",
          source: { label: "Registry", grade: "A2" },
          alternatives: [{ value: "Avenida del Puerto 210, Valencia", source: { label: "Customer", grade: "C3" } }],
        },
      ],
    },
  ];
  facts.addEventListener("tc-copy", (e) => console.log(e.detail.fact, e.detail.text));
</script>
```

### React / Next.js

```tsx
import { FactSheet, type FactSection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sections: FactSection[] = [
  {
    id: "identity",
    title: "Identity",
    facts: [
      { id: "name", label: "Full name", value: "Elena María Ruiz", source: { label: "Passport", grade: "A1" }, copyable: true },
      { id: "tax", label: "Tax residence", source: { label: "Customer", grade: "C3" } },
    ],
  },
];

export function Profile() {
  return <FactSheet title="Customer profile" sections={sections} onCopy={(fact, text) => console.log(fact, text)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/fact-sheet";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";

defineProps<{ sections: TcFactSheet["sections"] }>();
const onCopy = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-fact-sheet :sections="sections" @tc-copy="onCopy"></tc-fact-sheet>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FactSheet } from "@adamstavely/trenchcoat/angular/fact-sheet";
import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";

@Component({
  selector: "app-fact-sheet-example",
  imports: [FactSheet],
  template: `<tc-fact-sheet [sections]="sections()" (tc-copy)="onCopy($event)"></tc-fact-sheet>`,
})
export class FactSheetExample {
  readonly sections = input.required<TcFactSheet["sections"]>();
  onCopy(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fact-sheet";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";

  let { sections }: { sections: TcFactSheet["sections"] } = $props();
  let el: TcFactSheet;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-copy", on);
    return () => el.removeEventListener("tc-copy", on);
  });
</script>

<tc-fact-sheet bind:this={el} {sections}></tc-fact-sheet>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Facts"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `sections` | – | `FactSection[]` | `[]` | The sections and their facts, in order |
| `columns` | `columns` | `1 \| 2` | `2` | 2 puts sections side by side when there's room (from about 720 px); 1 keeps them stacked |
| `copyable` | `copyable` | `boolean` | `false` | Adds a Copy button to every value |
| `missingLabel` | `missing-label` | `string` | `"Not known"` | What a fact with no value reads |
| `noLegend` | `no-legend` | `boolean` | `false` | Hides "How grades work", for a page that explains the scale elsewhere |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-copy` | – | Yes | A value's Copy was pressed ({ fact, text }: FactCopy); cancelable – prevented, the element doesn't copy, so the page can copy its own way |

#### Design tokens it reads (66)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `factBand(grade: string \| undefined): FactBand` | The band a grade falls in: A–B with 1–2 is high, D–E or 4–5 is low, F or 6 (or no grade) unknown, else medium |
| `gradeWords(grade: string \| undefined): void` | A grade in words: "A1" → "completely reliable source, confirmed" |

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
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-fact-sheet :sections="…">` | `<tc-fact-sheet [sections]="…">` | `<tc-fact-sheet {sections}>` |

*Also attributes: `heading`, `description`, `columns`, `copyable`, `missing-label`, `no-legend` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

### Controlled

`tc-copy` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-fact-sheet")` returns a `TcFactSheet` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";`
- **React / Next.js:** Props: `import type { FactSheetProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FactSheet>`. The element class, for refs: `import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFactSheet["sections"]` with `import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";`
- **Angular:** The directive types the template: `[sections]` takes `TcFactSheet["sections"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFactSheet } from "@adamstavely/trenchcoat/fact-sheet";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `onCopy` | `(fact: string, text: string) => void \| boolean` | A value's Copy was pressed. Return false to stop the element copying, to copy your own way |

*Renamed or hidden on the wrapper: `heading`, `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

There's nothing to move between: Tab reaches “How grades work” and each Copy button in reading order.

| Key | What it does |
|---|---|
| Tab | Moves to “How grades work”, then each Copy button |
| Enter / Space | Opens or closes the scale; copies a value |

Copy buttons fade in on hover and show whenever they have focus, or always on touch screens.

### Screen readers

Each section is a region named by its title, holding a description list of labels and values. A source tag reads in
full, “Source: Registry, grade A1 (completely reliable source, confirmed). High confidence”, followed by its note if
it has one. The short tag and the bars are hidden. A conflicting fact's other readings start with “Another source
says”. “How grades work” is a disclosure button (`aria-expanded`) that controls the scale, a region labelled “How
grades work”. Copying is confirmed in a polite status message, “Full name copied”, or “Couldn't copy”.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.4 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.9 KB** | **8.3 KB** |
| With Lit – the first component on a page | 47.7 KB | 15.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 180 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of sections replaced |
| First on the page | 8.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 34 ms | sections: first render, 8,167 nodes; update 4.5 ms |
| 1,000 items | 313 ms | sections: first render, 81,517 nodes; update 30 ms |

1,000 items of sections: 313 ms. It renders every item, so a first render passes 50 ms (a long task) at about 160 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name sources the way your team does, short: “Registry”, “Passport”, “Customer”, “Screening”.
- Grade both parts honestly: a reliable registry can still hold old information (A3).
- Put dates and links in the source's `note`: “Checked against three sanctions lists, 2 Oct 2026”.
- Leave `value` out when nobody knows, rather than writing “Unknown” – the element says it the same way everywhere.
- Set `band` on a source only when your own rules differ from the scale.

## Do and don't

### Do

- Keep conflicting readings until someone resolves them – the disagreement is the finding.
- Group facts the way reviewers check them: identity, business, ownership.
- Turn on `copyable` for values people paste elsewhere: names, company numbers.

### Don't

- Don't use the tag colours for anything but confidence – the band is all they mean.
- Don't drop the grade to save space; a tag with no grade reads as unknown confidence.
- Don't hide “How grades work” unless the page explains the scale nearby.

## Related

- [Provenance Summary](provenance-summary.md) – What a document is made of – how much came from sources, from AI and from its authors, section by section
- [Confidence Brief](confidence-brief.md) – An answer explained for someone who wasn't there – what we conclude, the kind of uncertainty, what would change it, assumptions, signs to watch and the track record
- [Evidence Coverage](evidence-coverage.md) – What an answer could and couldn't see – each source category current, stale or missing, with a request for coverage
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **`tc-fact-sheet`:** facts in sections, each value tagged with its source and an Admiralty grade (A1–F6). - **Confidence:** the tag is tinted and marked by confidence band. - **Uncertainty:** conflicting readings appear side by side, unknowns are stated, and a "How grades work" scale is one click away.
