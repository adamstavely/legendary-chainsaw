<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Uncertainty Mix

**Blocks** · New

Where an answer's uncertainty comes from – the overall mix with what each kind means and a short reading of what to do, and the same mix per part in a breakdown chart (uses `@adamstavely/trenchcoat/react`: `breakdown-chart`)

- **Element:** `<tc-uncertainty-mix>`
- **Size:** 15.2 KB gzip · 57.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/uncertainty-mix";` |
| React / Next.js | `import { UncertaintyMix } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/uncertainty-mix";` · tags starting with tc- are custom elements |
| Angular | `import { UncertaintyMix } from "@adamstavely/trenchcoat/angular/uncertainty-mix";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/uncertainty-mix";` |

## Example

The live example is in the gallery at `#/blocks/uncertainty-mix`, in both looks; Replay restarts its animations.

## Overview

Where an answer's uncertainty comes from. Not all uncertainty is the same: some would shrink with more information,
some can't be known yet, and some is past what the model knows – and each asks for something different. A reading card
shows the whole answer's mix as one bar, each kind with its share and what it means, and a short reading of what to
do, led by the kind that weighs most and the part of the answer that carries the most. Beside it, the library's
Breakdown Chart shows the same mix per part of the answer, with its linked table. Hiding a kind in the chart's legend
hides it from the reading too.

### When to use

- Explaining why an AI answer is uncertain, not just how much.
- Pointing a reviewer at the part of an answer to check first.
- Comparing the kinds of uncertainty across the sections or claims of a report.

### When not to use

- One confidence figure for an answer – use [Confidence Brief](../components/confidence-brief.md).
- Flags on specific steps of the reasoning – use [Reasoning Flags](../components/reasoning-flags.md).
- A general breakdown of work or cost – use [Breakdown Chart](../components/breakdown-chart.md) on its own.

## Anatomy

1. **Card** `.ui-umix__card` – the reading card, with the shared header
2. **Bar** `.ui-umix__bar` – the whole answer's mix, one segment per kind
3. **Kinds** `.ui-umix__kinds` – each kind's share, name and meaning
4. **Reading** `.ui-umix__reading` – what to do, led by the largest kind and the heaviest part
5. **Chart** `.ui-umix__chart` – the same mix per part of the answer, with its table and legend

## Looks

Standard puts the card's header on a gray tray above a white card, beside the chart's own tray. Clean is one white card
with the header as its first row, and lighter weights for the shares. The kinds' colours are tokens by default:
violet for missing information, blue for inherent uncertainty and amber for model limits.

## Usage

### HTML

```html
<tc-uncertainty-mix id="mix" subtitle="Will the new checkout lift conversion next quarter?"></tc-uncertainty-mix>

<script type="module">
  import "@adamstavely/trenchcoat/uncertainty-mix";
  import "@adamstavely/trenchcoat/tokens.css";

  const mix = document.querySelector("#mix");
  mix.sources = [
    { part: "Baseline", kind: "gap", amount: 6 },
    { part: "Forecast", kind: "chance", amount: 11 },
    { part: "Forecast", kind: "model", amount: 20, claim: "Seasonality beyond two years of data" },
  ];
  mix.addEventListener("tc-hidden-change", (e) => console.log(e.detail.hiddenKinds));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { UncertaintyMix, type UncertaintySource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: UncertaintySource[] = [
  { part: "Baseline", kind: "gap", amount: 6 },
  { part: "Forecast", kind: "chance", amount: 11 },
  { part: "Forecast", kind: "model", amount: 20, claim: "Seasonality beyond two years of data" },
];

export function AnswerUncertainty() {
  const [hidden, setHidden] = useState<string[]>([]);
  return <UncertaintyMix sources={sources} subtitle="Will the new checkout lift conversion next quarter?" hidden={hidden} onHiddenChange={setHidden} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/uncertainty-mix";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";

defineProps<{ sources: TcUncertaintyMix["sources"]; kinds: TcUncertaintyMix["kinds"] }>();
const onHiddenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-uncertainty-mix :sources="sources" :kinds="kinds" @tc-hidden-change="onHiddenChange"></tc-uncertainty-mix>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { UncertaintyMix } from "@adamstavely/trenchcoat/angular/uncertainty-mix";
import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";

@Component({
  selector: "app-uncertainty-mix-example",
  imports: [UncertaintyMix],
  template: `<tc-uncertainty-mix [sources]="sources()" [kinds]="kinds()" (tc-hidden-change)="onHiddenChange($event)"></tc-uncertainty-mix>`,
})
export class UncertaintyMixExample {
  readonly sources = input.required<TcUncertaintyMix["sources"]>();
  readonly kinds = input.required<TcUncertaintyMix["kinds"]>();
  onHiddenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/uncertainty-mix";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";

  let { sources, kinds }: { sources: TcUncertaintyMix["sources"]; kinds: TcUncertaintyMix["kinds"] } = $props();
  let el: TcUncertaintyMix;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-hidden-change", on);
    return () => el.removeEventListener("tc-hidden-change", on);
  });
</script>

<tc-uncertainty-mix bind:this={el} {sources} {kinds}></tc-uncertainty-mix>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `sources` | – | `UncertaintySource[]` | `[]` | Where the uncertainty comes from: a part, a kind's key and an amount each |
| `kinds` | – | `UncertaintyKind[]` | `[ { key: "gap", label: "Missing information", meaning: "More information would narrow it", advice: "Find or request what's missing before relying on it.", color: "var(--tc-tone-violet-solid)", }, { key: "chance", label: "Inherent uncertainty", meaning: "The outcome isn't decided yet", advice: "Watch for early signs and revisit as things change.", color: "var(--tc-status-info-solid)", }, { key: "model", label: "Model limits", meaning: "At the edge of what the model knows", advice: "Check it with a person who knows the area, or a primary source.", color: "var(--tc-tone-amber-solid)", }, ]` | The kinds, in display order – defaultUncertaintyKinds by default |
| `parts` | – | `string[] \| undefined` | `undefined` | The parts in display order – by first appearance in `sources` by default |
| `partLabel` | `part-label` | `string` | `"Part of the answer"` | What a part is called, e.g. "Section" or "Claim" |
| `hiddenKinds` | – | `string[]` | `[]` | Keys of the kinds hidden from the chart and the reading |
| `heading` | `heading` | `string` | `"Uncertainty mix"` | The reading card's heading |
| `subtitle` | `subtitle` | `string \| undefined` | `undefined` | The line under the heading, e.g. the question the answer is to |
| `chartTitle` | `chart-title` | `string` | `"By part of the answer"` | The chart's heading |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-hidden-change` | – | Yes | Kinds were hidden or shown in the chart's legend ({ hidden, hiddenKinds }: UncertaintyHiddenChange – both the kinds' keys); cancelable – prevented, `hiddenKinds` stays |

#### Design tokens it reads (38)

`--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-slow`, `--tc-ease-out`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultUncertaintyKinds: UncertaintyKind[]` | Missing information, inherent uncertainty and model limits |

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
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-uncertainty-mix :sources="…">` | `<tc-uncertainty-mix [sources]="…">` | `<tc-uncertainty-mix {sources}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-uncertainty-mix :kinds="…">` | `<tc-uncertainty-mix [kinds]="…">` | `<tc-uncertainty-mix {kinds}>` |
| `parts` | `el.parts = …;` | `<… parts={…} />` | `<tc-uncertainty-mix :parts="…">` | `<tc-uncertainty-mix [parts]="…">` | `<tc-uncertainty-mix {parts}>` |
| `hiddenKinds` | `el.hiddenKinds = …;` | `<… hiddenKinds={…} />` | `<tc-uncertainty-mix :hiddenKinds="…">` | `<tc-uncertainty-mix [hiddenKinds]="…">` | `<tc-uncertainty-mix {hiddenKinds}>` |

*Also attributes: `part-label`, `heading`, `subtitle`, `chart-title` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-hidden-change` | Yes | `el.addEventListener("tc-hidden-change", (e) => …)` | `onHiddenChange={…}` | `@tc-hidden-change="…"` | `(tc-hidden-change)="…($event)"` | `el.addEventListener("tc-hidden-change", …)` |

### Controlled

`tc-hidden-change` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-uncertainty-mix")` returns a `TcUncertaintyMix` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";`
- **React / Next.js:** Props: `import type { UncertaintyMixProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof UncertaintyMix>`. The element class, for refs: `import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcUncertaintyMix["sources"]` with `import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";`
- **Angular:** The directive types the template: `[sources]` takes `TcUncertaintyMix["sources"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcUncertaintyMix } from "@adamstavely/trenchcoat/uncertainty-mix";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The reading card's heading – "Uncertainty mix" by default |
| `hidden` | `string[]` | Keys of the kinds hidden from the chart and the reading (controlled) |
| `defaultHidden` | `string[]` | Hidden at first when uncontrolled |
| `onHiddenChange` | `(keys: string[]) => void` | Called when the chart's legend hides or shows kinds |

*Renamed or hidden on the wrapper: `heading`, `hidden`, `hiddenKinds`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the chart's pickers, legend and table |
| Enter / Space | On a legend chip, hides or shows that kind – the reading follows |

The reading card itself has nothing to operate.

### Screen readers

The card is a region named by its heading. The bar is an image named by the mix – “Missing information 45%, Inherent
uncertainty 30%, Model limits 25%” – and the kinds repeat it as a list. The reading is a polite live region, so hiding
a kind announces the new reading. The chart reads as it does on its own.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, breakdown-chart | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | breakdown-chart, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | breakdown-chart | – |
| :is() and :where() | 88 | 78 | 14 | 14 | breakdown-chart, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | breakdown-chart, internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | breakdown-chart | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 11.5 KB | 4.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [breakdown-chart](../components/breakdown-chart.md) · Element it renders | 37.5 KB | – |
| **Added to a page that already has Lit** | **57.1 KB** | **15.2 KB** |
| With Lit – the first component on a page | 79.5 KB | 22.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | default properties, 87 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 30 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (breakdown-chart), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Listens on the page: `document keydown` (breakdown-chart), `window pointerdown` (breakdown-chart).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name each kind for what it is, not how bad it is: “Missing information”, not “High risk”.
- Keep `meaning` to a few words and `advice` to one sentence that says what to do.
- Use the parts a reader would recognise – the answer's sections, or its claims – and set `part-label` to match.
- Amounts are relative: any unit works, as long as it's the same throughout.

## Do and don't

### Do

- Order the kinds the same way in every answer, so the colours keep their meaning.
- Keep custom colours at 3:1 against the card in both themes.
- Listen for `tc-hidden-change` if the page keeps what the person hid.

### Don't

- Don't use it for a single number – a bar of one kind says nothing.
- Don't mix units between sources.
- Don't add more than four or five kinds; the reading stops being readable.

## Related

- [Breakdown Chart](../components/breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Confidence Brief](../components/confidence-brief.md) – An answer explained for someone who wasn't there – what we conclude, the kind of uncertainty, what would change it, assumptions, signs to watch and the track record
- [Reasoning Flags](../components/reasoning-flags.md) – Inline markers for weak reasoning in an answer – circular, hedged then certain, self-contradicting or overconfident – each with an explanation
- [Claim Answer](../components/claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
