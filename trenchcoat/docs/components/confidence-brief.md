<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Confidence Brief

**Trust & calibration** · New

An answer explained for someone who wasn't there – what we conclude, the kind of uncertainty, what would change it, assumptions, signs to watch and the track record

- **Element:** `<tc-confidence-brief>`
- **Size:** 9.0 KB gzip · 28.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/confidence-brief";` |
| React / Next.js | `import { ConfidenceBrief } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/confidence-brief";` · tags starting with tc- are custom elements |
| Angular | `import { ConfidenceBrief } from "@adamstavely/trenchcoat/angular/confidence-brief";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/confidence-brief";` |

## Example

The live example is in the gallery at `#/confidence-brief`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An answer explained for someone who wasn't in the session – a manager, a client, the next person on the case. It reads
like a short printed brief: the conclusion and how confident it is, the kind of uncertainty behind it (data, model,
disagreement or time), what would change it, the assumptions it depends on, the signs to watch, and the track record
on similar questions, drawn as one dot per question. A reference at the foot opens the provenance record, and “Copy as
text” puts the whole brief on the clipboard, ready to paste into an email or a decision log.

### When to use

- Handing a conclusion to someone who will act on it without reading the conversation behind it.
- Attaching a summary to a decision, a ticket or a report.
- Ending an analysis session with something that can be shared, printed or archived.

### When not to use

- What a document is made of, section by section – use [Provenance Summary](provenance-summary.md).
- Marking each claim in an answer with its source and confidence – use [Claim Answer](claim-answer.md).
- Whether trust in the AI matches how well it performs – use [Reliance Gauge](reliance-gauge.md).
- Working notes gathered while the analysis is still going on – use [Synthesis Notes](synthesis-notes.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Conclusion** `.ui-cfb__lead` – what was asked, what we conclude and how confident it is
2. **Kind of uncertainty** `[data-sec="kind"]` – data, model, disagreement or time, as labels, with a sentence on why
3. **Lists** `.ui-cfb__grid` – what would change it, key assumptions and signs to watch
4. **Track record** `[data-sec="record"]` – right so many of so many on similar questions, one dot each
5. **Provenance record** `.ui-cfb__ref` – the record's reference, which opens it
6. **Copy as text** `.ui-cfb__copy` – the whole brief as plain text

## Looks

Standard sets a white page in the gray tray: the header and Copy as text above it, the provenance reference on the
tray below. Clean is one white card with the header as its first row and the reference as its last, a quieter
conclusion and thinner icons. Both print without the tray, the shadows or the copy button. The lists sit in two
columns on a wide card and stack below 460 px.

## Usage

### HTML

```html
<tc-confidence-brief id="brief" heading="Annual pricing and churn" meta="27 Oct · for the leadership meeting"></tc-confidence-brief>

<script type="module">
  import "@adamstavely/trenchcoat/confidence-brief";
  import "@adamstavely/trenchcoat/tokens.css";

  const brief = document.querySelector("#brief");
  brief.question = "Will annual-only pricing reduce churn?";
  brief.conclusion = "Probably, by 2–4 points over a year.";
  brief.confidence = "moderate";
  brief.uncertainty = ["data", "model"];
  brief.changers = ["Small teams cancelling at the annual renewal instead"];
  brief.record = { right: 17, total: 20, note: "Pricing questions since 2024" };
  brief.provenanceId = "PR-2026-0441";
  brief.addEventListener("tc-provenance-open", (e) => console.log("open record", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { ConfidenceBrief } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PricingBrief({ openRecord }: { openRecord: (id: string) => void }) {
  return (
    <ConfidenceBrief
      title="Annual pricing and churn"
      question="Will annual-only pricing reduce churn?"
      conclusion="Probably, by 2–4 points over a year."
      confidence="moderate"
      uncertainty={["data", "model"]}
      assumptions={["Sign-ups don't fall by more than 10%"]}
      signals={["Trial-to-paid conversion in the first two weeks"]}
      record={{ right: 17, total: 20 }}
      provenanceId="PR-2026-0441"
      onOpenProvenance={openRecord}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/confidence-brief";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";

defineProps<{ confidenceLabels: TcConfidenceBrief["confidenceLabels"]; uncertainty: TcConfidenceBrief["uncertainty"] }>();
const onProvenanceOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-confidence-brief :confidenceLabels="confidenceLabels" :uncertainty="uncertainty" @tc-provenance-open="onProvenanceOpen"></tc-confidence-brief>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ConfidenceBrief } from "@adamstavely/trenchcoat/angular/confidence-brief";
import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";

@Component({
  selector: "app-confidence-brief-example",
  imports: [ConfidenceBrief],
  template: `<tc-confidence-brief [confidenceLabels]="confidenceLabels()" [uncertainty]="uncertainty()" (tc-provenance-open)="onProvenanceOpen($event)"></tc-confidence-brief>`,
})
export class ConfidenceBriefExample {
  readonly confidenceLabels = input.required<TcConfidenceBrief["confidenceLabels"]>();
  readonly uncertainty = input.required<TcConfidenceBrief["uncertainty"]>();
  onProvenanceOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/confidence-brief";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";

  let { confidenceLabels, uncertainty }: { confidenceLabels: TcConfidenceBrief["confidenceLabels"]; uncertainty: TcConfidenceBrief["uncertainty"] } = $props();
  let el: TcConfidenceBrief;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-provenance-open", on);
    return () => el.removeEventListener("tc-provenance-open", on);
  });
</script>

<tc-confidence-brief bind:this={el} {confidenceLabels} {uncertainty}></tc-confidence-brief>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Confidence brief"` | The heading – what the brief is about, often the question as it was asked |
| `meta` | `meta` | `string` | `""` | A quiet line under the heading: when it was prepared, for whom |
| `question` | `question` | `string` | `""` | The question as it was asked, quoted above the conclusion |
| `conclusion` | `conclusion` | `string` | `""` | What we conclude, in a sentence or two |
| `confidence` | `confidence` | `ConfidenceLevel \| undefined` | `undefined` | How confident the conclusion is – shown beside it; unset shows no level |
| `confidenceLabels` | – | `Partial<Record<ConfidenceLevel, string>>` | `{}` | Names of the three levels – "High confidence", "Moderate confidence" and "Low confidence" by default |
| `uncertainty` | – | `ConfidenceUncertaintyKind[]` | `[]` | The kinds of uncertainty behind the conclusion: "data", "model", "disagreement", "time" |
| `uncertaintyLabels` | – | `Partial<Record<ConfidenceUncertaintyKind, string>>` | `{}` | Names of the four kinds – "Data", "Model", "Disagreement" and "Time" by default |
| `uncertaintyNote` | `uncertainty-note` | `string` | `""` | A sentence on why it's uncertain, under the labels |
| `basis` | `basis` | `string` | `""` | What the conclusion rests on, in plain words – the kinds of source and how recent, not their names |
| `changers` | – | `string[]` | `[]` | What would change the conclusion |
| `assumptions` | – | `string[]` | `[]` | The assumptions the conclusion depends on |
| `signals` | – | `string[]` | `[]` | Things to watch for that would call the conclusion into question |
| `record` | – | `ConfidenceRecord \| undefined` | `undefined` | How often similar conclusions turned out right |
| `provenanceId` | `provenance-id` | `string` | `""` | The provenance record's reference; set, the brief shows it and fires tc-provenance-open when it's pressed |
| `provenanceLabel` | `provenance-label` | `string` | `"Provenance record"` | What the provenance reference is called |
| `copyLabel` | `copy-label` | `string` | `"Copy as text"` | The label of the copy button |
| `noCopy` | `no-copy` | `boolean` | `false` | Hides the copy button |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-provenance-open` | – | No | The provenance reference was pressed; detail `{ id }`: ConfidenceProvenanceOpen. |
| `tc-copy` | – | Yes | "Copy as text" was pressed; detail `{ text }`: ConfidenceCopy. Cancelable: preventDefault() stops the element copying, to copy or export it yourself. |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `toText()` | `void` | The brief as plain text – what "Copy as text" copies |

#### Design tokens it reads (75)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `confidenceLabels` | `el.confidenceLabels = …;` | `<… confidenceLabels={…} />` | `<tc-confidence-brief :confidenceLabels="…">` | `<tc-confidence-brief [confidenceLabels]="…">` | `<tc-confidence-brief {confidenceLabels}>` |
| `uncertainty` | `el.uncertainty = …;` | `<… uncertainty={…} />` | `<tc-confidence-brief :uncertainty="…">` | `<tc-confidence-brief [uncertainty]="…">` | `<tc-confidence-brief {uncertainty}>` |
| `uncertaintyLabels` | `el.uncertaintyLabels = …;` | `<… uncertaintyLabels={…} />` | `<tc-confidence-brief :uncertaintyLabels="…">` | `<tc-confidence-brief [uncertaintyLabels]="…">` | `<tc-confidence-brief {uncertaintyLabels}>` |
| `changers` | `el.changers = …;` | `<… changers={…} />` | `<tc-confidence-brief :changers="…">` | `<tc-confidence-brief [changers]="…">` | `<tc-confidence-brief {changers}>` |
| `assumptions` | `el.assumptions = …;` | `<… assumptions={…} />` | `<tc-confidence-brief :assumptions="…">` | `<tc-confidence-brief [assumptions]="…">` | `<tc-confidence-brief {assumptions}>` |
| `signals` | `el.signals = …;` | `<… signals={…} />` | `<tc-confidence-brief :signals="…">` | `<tc-confidence-brief [signals]="…">` | `<tc-confidence-brief {signals}>` |
| `record` | `el.record = …;` | `<… record={…} />` | `<tc-confidence-brief :record="…">` | `<tc-confidence-brief [record]="…">` | `<tc-confidence-brief {record}>` |

*Also attributes: `heading`, `meta`, `question`, `conclusion`, `confidence`, `uncertainty-note`, `basis`, `provenance-id` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-provenance-open` | No | `el.addEventListener("tc-provenance-open", (e) => …)` | `onOpenProvenance={…}` | `@tc-provenance-open="…"` | `(tc-provenance-open)="…($event)"` | `el.addEventListener("tc-provenance-open", …)` |
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-confidence-brief")` returns a `TcConfidenceBrief` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";`
- **React / Next.js:** Props: `import type { ConfidenceBriefProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ConfidenceBrief>`. The element class, for refs: `import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConfidenceBrief["confidenceLabels"]` with `import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";`
- **Angular:** The directive types the template: `[confidenceLabels]` takes `TcConfidenceBrief["confidenceLabels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConfidenceBrief } from "@adamstavely/trenchcoat/confidence-brief";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – what the brief is about, often the question as it was asked |
| `onOpenProvenance` | `(id: string) => void` | The provenance reference was pressed – open the record with this id |
| `onCopy` | `(text: string, event: Event) => void` | "Copy as text" was pressed, with the brief as plain text; call event.preventDefault() to copy or export it yourself |

*Renamed or hidden on the wrapper: `heading`, `Copy as text`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between Copy as text and the provenance reference – both native buttons |
| Enter / Space | On Copy as text: copies the brief, or fires `tc-copy` for the app to handle |
| Enter / Space | On the provenance reference: fires `tc-provenance-open` |

### Screen readers

The brief is an `article` named by its heading. Each part is a `section` named by its label (“Kind of uncertainty”,
“Signs to watch”), so it can be reached by landmark or heading. The uncertainty labels are read with their meaning:
“Data – the evidence is thin or incomplete”. The track record is read as “17 of 20 Right 17 of 20 on similar
questions”; the dots are hidden. The provenance reference is a button named “Provenance record PR-2026-0441”. After a
copy, a status region says “Brief copied as text”, or “Couldn't copy the brief”.

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
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.2 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.8 KB** | **9.0 KB** |
| With Lit – the first component on a page | 48.4 KB | 15.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 98 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of uncertainty replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.7 ms | uncertainty: first render, 686 nodes; update 0.3 ms |
| 1,000 items | 19 ms | uncertainty: first render, 6,086 nodes; update 2.0 ms |

1,000 items of uncertainty: 19 ms, 6,086 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Write the conclusion as an answer to the question, in a sentence or two, with its range: “Probably, by 2–4 points”.
- Use `basis` for the kinds of source and how recent they are – not their names.
- Make “What would change it” and “Signs to watch” observable: events someone could notice, not states of mind.
- Say what counts as similar in the track record's `note`, and use a real count; leave `record` out when there is none.
- Keep `heading` short – a topic – and put the full question in `question`.

## Do and don't

### Do

- Give the provenance reference the id people quote when they ask for the record.
- Let the brief copy itself, or prevent `tc-copy` and export the `detail.text` your own way.
- Show a low confidence plainly – the brief is for people deciding what weight to give the answer.

### Don't

- Don't paste the conversation in; the brief is for people who weren't there.
- Don't list every assumption – the two or three the conclusion depends on.
- Don't show a track record built from a handful of unrelated questions.

## Related

- [Provenance Summary](provenance-summary.md) – What a document is made of – how much came from sources, from AI and from its authors, section by section
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught
- [Synthesis Notes](synthesis-notes.md) – Your own conclusions, assumptions and open questions, kept apart from the model's output and exported with where they came from

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
