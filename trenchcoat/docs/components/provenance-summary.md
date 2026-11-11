<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Provenance Summary

**Trust & calibration** · New

What a document is made of – how much came from sources, from AI and from its authors, section by section

- **Element:** `<tc-provenance-summary>`
- **Size:** 8.5 KB gzip · 26.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/provenance-summary";` |
| React / Next.js | `import { ProvenanceSummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/provenance-summary";` · tags starting with tc- are custom elements |
| Angular | `import { ProvenanceSummary } from "@adamstavely/trenchcoat/angular/provenance-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/provenance-summary";` |

## Example

The live example is in the gallery at `#/provenance-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a document is made of: how much of it came from sources, how much the AI synthesised, and how much its authors
wrote themselves – for the whole document and section by section. Each row is a stacked bar, and every segment is a
button that asks the app to open the lineage behind it, so a reader can go from “this section is mostly AI
synthesis” to the passages and sources it came from. Pointing at or focusing a segment lights that kind in every row
and in the legend, and the footer names the section that leans least on sources – where a reviewer looks first. The
app supplies the amounts; the kinds' names are properties.

### When to use

- At the top of a report, brief or memo drafted with AI, so readers know how much of it rests on sources.
- In a review step, to find the sections that need checking before a document goes out.
- Beside an export, as a summary of how the document was produced.

### When not to use

- One total split into parts, with no sections – use [Compact Breakdown](compact-breakdown.md).
- Comparing amounts across many categories and series – use [Breakdown Chart](breakdown-chart.md).
- Following one output back through every step to its sources – use [Lineage Graph](lineage-graph.md).
- Marking up the claims of one answer – use [Claim Answer](claim-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Legend** `.ui-pvs__legend` – each kind's share of the whole document
2. **Whole document** `.ui-pvs__row[data-total]` – the total as a taller stacked bar
3. **Section** `.ui-pvs__row:not([data-total])` – one row per section: its name, its size and its bar
4. **Segment** `.ui-pvs__cell` – one kind's share of a row; pressing it opens the lineage
5. **Footer** `.ui-pvs__foot` – the section with the smallest share from sources

## Looks

Standard sets a white card in the gray tray, with the footer on the tray below. Clean is one white card with a
shadow, the footer as its last row under a hairline, and slightly smaller legend figures. Both use the source-type
colours: green for sources, violet for AI synthesis, gray for original writing.

## Usage

### HTML

```html
<tc-provenance-summary id="made-of" scope="EV charging market brief · 3,100 words"></tc-provenance-summary>

<script type="module">
  import "@adamstavely/trenchcoat/provenance-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const summary = document.querySelector("#made-of");
  summary.sections = [
    { id: "summary", title: "Executive summary", sourced: 40, synthesis: 240, original: 260 },
    { id: "market", title: "Market size and growth", sourced: 540, synthesis: 200, original: 140 },
  ];
  summary.addEventListener("tc-lineage-open", (e) => console.log("open lineage", e.detail.section, e.detail.kind));
</script>
```

### React / Next.js

```tsx
import { ProvenanceSummary, type ProvenanceSection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sections: ProvenanceSection[] = [
  { id: "summary", title: "Executive summary", sourced: 40, synthesis: 240, original: 260 },
  { id: "market", title: "Market size and growth", sourced: 540, synthesis: 200, original: 140 },
];

export function BriefProvenance({ openLineage }: { openLineage: (section: string | null, kind: string) => void }) {
  return (
    <ProvenanceSummary
      title="What this brief is made of"
      scope="EV charging market brief · 3,100 words"
      sections={sections}
      onOpenLineage={(section, kind) => openLineage(section, kind)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/provenance-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";

defineProps<{ sections: TcProvenanceSummary["sections"]; kindLabels: TcProvenanceSummary["kindLabels"] }>();
const onLineageOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-provenance-summary :sections="sections" :kindLabels="kindLabels" @tc-lineage-open="onLineageOpen"></tc-provenance-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProvenanceSummary } from "@adamstavely/trenchcoat/angular/provenance-summary";
import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";

@Component({
  selector: "app-provenance-summary-example",
  imports: [ProvenanceSummary],
  template: `<tc-provenance-summary [sections]="sections()" [kindLabels]="kindLabels()" (tc-lineage-open)="onLineageOpen($event)"></tc-provenance-summary>`,
})
export class ProvenanceSummaryExample {
  readonly sections = input.required<TcProvenanceSummary["sections"]>();
  readonly kindLabels = input.required<TcProvenanceSummary["kindLabels"]>();
  onLineageOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/provenance-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";

  let { sections, kindLabels }: { sections: TcProvenanceSummary["sections"]; kindLabels: TcProvenanceSummary["kindLabels"] } = $props();
  let el: TcProvenanceSummary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-lineage-open", on);
    return () => el.removeEventListener("tc-lineage-open", on);
  });
</script>

<tc-provenance-summary bind:this={el} {sections} {kindLabels}></tc-provenance-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Provenance"` | The heading, and the region's name |
| `scope` | `scope` | `string` | `""` | What the summary covers, a quiet line under the heading – e.g. the document's name |
| `sections` | – | `ProvenanceSection[]` | `[]` | The document's sections, in order, with how much of each came from where |
| `kindLabels` | – | `Partial<Record<ProvenanceKind, string>>` | `{}` | Names of the three kinds |
| `unit` | `unit` | `string` | `"words"` | The unit of the amounts, plural – "words", "characters", "sentences" |
| `totalLabel` | `total-label` | `string` | `"Whole document"` | The name of the whole-document row |
| `totalOnly` | `total-only` | `boolean` | `false` | Hide the per-section rows and show the total only |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-lineage-open` | – | No | A segment was pressed (detail: { section: string \| null, kind: "sourced" \| "synthesis" \| "original", amount: number, share: number }) – section is null for the whole document |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-provenance-summary-sourced` | `var(--tc-source-grounded-fg)` | standard, clean |
| `--tc-provenance-summary-synthesis` | `var(--tc-source-model-fg)` | standard, clean |
| `--tc-provenance-summary-original` | `var(--tc-text-muted)` | standard, clean |

#### Design tokens it reads (47)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-source-grounded-fg`, `--tc-source-model-fg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-provenance-summary :sections="…">` | `<tc-provenance-summary [sections]="…">` | `<tc-provenance-summary {sections}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-provenance-summary :kindLabels="…">` | `<tc-provenance-summary [kindLabels]="…">` | `<tc-provenance-summary {kindLabels}>` |

*Also attributes: `heading`, `scope`, `unit`, `total-label`, `total-only`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-lineage-open` | No | `el.addEventListener("tc-lineage-open", (e) => …)` | `onOpenLineage={…}` | `@tc-lineage-open="…"` | `(tc-lineage-open)="…($event)"` | `el.addEventListener("tc-lineage-open", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-provenance-summary")` returns a `TcProvenanceSummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";`
- **React / Next.js:** Props: `import type { ProvenanceSummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProvenanceSummary>`. The element class, for refs: `import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProvenanceSummary["sections"]` with `import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";`
- **Angular:** The directive types the template: `[sections]` takes `TcProvenanceSummary["sections"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProvenanceSummary } from "@adamstavely/trenchcoat/provenance-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `onOpenLineage` | `(section: string \| null, kind: ProvenanceKind, detail: ProvenanceLineageOpen) => void` | A segment was pressed: the section's id (null for the whole document), the kind, its amount and share |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the bars once, onto the segment last used |
| ← / → | Moves to the previous or next segment in the row |
| ↑ / ↓ | Moves to the row above or below – the same kind, or the nearest one that row has |
| Home / End | Moves to the first or last segment in the row |
| Ctrl + Home / Ctrl + End | Moves to the first segment of the whole document, or the last of the last section |
| Enter / Space | Opens the lineage of the focused segment |
| Escape | Clears the highlight |

Segments with nothing in them are skipped.

### Screen readers

The card is a `region`, named by its heading. The bars are a `grid` named “Provenance by section – arrow keys move
between segments, Enter opens the lineage”: each row's header gives the section's name and size (“Market size and
growth 880 words”), and each segment is a button in a `gridcell` named with its kind, share and amount (“AI synthesis:
44%, 240 words – open lineage”). Empty segments are disabled buttons (“Original writing: 0%, 0 words”). The legend is
a list named “In total”.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.1 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.6 KB** | **8.5 KB** |
| With Lit – the first component on a page | 49.1 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 73 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of sections replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | sections: first render, 1,140 nodes; update 2.7 ms |
| 1,000 items | 69 ms | sections: first render, 11,040 nodes; update 12 ms |

1,000 items of sections: 69 ms. It renders every item, so a first render passes 50 ms (a long task) at about 730 items – page or filter longer lists.

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

- Use section titles as they appear in the document, so readers can find them.
- Pick a unit people understand – words for prose, sentences or paragraphs for short documents – and set `unit`.
- Rename the kinds with `kindLabels` to match your product, and keep them to two words.
- Count each part of the text once: a quoted passage the AI rephrased is either sourced or synthesis, not both.

## Do and don't

### Do

- Open the lineage on `tc-lineage-open` – the detail carries the section, the kind, the amount and the share.
- Keep the amounts in step with the document while it's being written; the bars glide to their new widths.
- Put it where the document's readers see it, not only its authors.

### Don't

- Don't present it as a quality score – a sourced section can still be wrong, and original writing can be right.
- Don't round small amounts away; a section with 2% from sources should still say so.
- Don't use it for fewer than two sections – `total-only` or `compact-breakdown` says the same with less.

## Related

- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
