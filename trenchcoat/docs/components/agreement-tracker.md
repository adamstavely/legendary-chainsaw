<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agreement Tracker

**Trust & calibration** · New

How often the AI agreed with you versus pushed back this session – it turns amber on a run of agreement and points to the counter-argument

- **Element:** `<tc-agreement-tracker>`
- **Size:** 8.7 KB gzip · 29.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agreement-tracker";` |
| React / Next.js | `import { AgreementTracker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agreement-tracker";` · tags starting with tc- are custom elements |
| Angular | `import { AgreementTracker } from "@adamstavely/trenchcoat/angular/agreement-tracker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agreement-tracker";` |

## Example

The live example is in the gallery at `#/agreement-tracker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Shows how often the AI went along with the person's framing this session and how often it pushed back. Each answer is
a mark in a running record – agreed, pushed back or neutral, as the app classifies it – beside the agreement rate and
the current run. When the AI agrees several times in a row (two by default) the tracker turns amber, underlines the run
and offers “Show the other side”, so a run of easy agreement becomes a prompt to hear the strongest case against. It
works as a small card beside a conversation or as one compact strip inside it.

### When to use

- In a chat or analysis session where people lead with their own view and the model tends to agree.
- Beside work that ends in a decision, where agreeing too readily has a cost.
- Under the latest answer as `layout="inline"`, when there's no room for a card.

### When not to use

- Today's answer contradicts an earlier one – use [Disagreement Banner](disagreement-banner.md).
- Whether people's trust matches how well the AI performs over weeks – use [Reliance Gauge](reliance-gauge.md).
- Asking someone to stop and think before acting on a high-stakes answer – use [Reflection Gate](reflection-gate.md).
- Marking up the claims inside one answer – use [Claim Answer](claim-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Rate** `.ui-agr__big` – the share of answers that took a side and agreed
2. **Current run** `.ui-agr__stat[data-kind="run"]` – how many answers in a row agreed or pushed back
3. **Record** `.ui-agr__record` – one mark per answer, oldest first; the run of agreements underlined in amber
4. **Key** `.ui-agr__key` – what the three marks mean
5. **Warning** `.ui-agr__warn` – at the threshold: why it turned amber, and Show the other side

## Looks

Standard puts the header and the warning on the gray tray around a white card; when the tracker is warned the tray
itself turns amber. Clean is one white card with lighter figures and thinner icons: the warning is its last row on an
amber tint, with a thin amber rule down the left edge. Inline, Standard is a tinted strip and Clean a white one.

## Usage

### HTML

```html
<tc-agreement-tracker id="agreement" scope="Sign-up drop-off · this session"></tc-agreement-tracker>

<script type="module">
  import "@adamstavely/trenchcoat/agreement-tracker";
  import "@adamstavely/trenchcoat/tokens.css";

  const tracker = document.querySelector("#agreement");
  tracker.threshold = 2;
  tracker.turns = [
    { id: "t1", stance: "pushed-back", label: "Cutting the form" },
    { id: "t2", stance: "agreed", label: "Long forms" },
    { id: "t3", stance: "agreed", label: "Removing the phone field" },
  ];
  tracker.addEventListener("tc-counter-request", (e) => console.log("show the other side of", e.detail.run, "answers"));
</script>
```

### React / Next.js

```tsx
import { AgreementTracker, type AgreementTurn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SessionAgreement({ turns, showCounter }: { turns: AgreementTurn[]; showCounter: (turnId?: string) => void }) {
  return (
    <AgreementTracker
      layout="inline"
      turns={turns}
      threshold={2}
      onRequestCounter={(detail) => showCounter(detail.turnId)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agreement-tracker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";

defineProps<{ turns: TcAgreementTracker["turns"]; stanceLabels: TcAgreementTracker["stanceLabels"] }>();
const onCounterRequest = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agreement-tracker :turns="turns" :stanceLabels="stanceLabels" @tc-counter-request="onCounterRequest"></tc-agreement-tracker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgreementTracker } from "@adamstavely/trenchcoat/angular/agreement-tracker";
import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";

@Component({
  selector: "app-agreement-tracker-example",
  imports: [AgreementTracker],
  template: `<tc-agreement-tracker [turns]="turns()" [stanceLabels]="stanceLabels()" (tc-counter-request)="onCounterRequest($event)"></tc-agreement-tracker>`,
})
export class AgreementTrackerExample {
  readonly turns = input.required<TcAgreementTracker["turns"]>();
  readonly stanceLabels = input.required<TcAgreementTracker["stanceLabels"]>();
  onCounterRequest(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agreement-tracker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";

  let { turns, stanceLabels }: { turns: TcAgreementTracker["turns"]; stanceLabels: TcAgreementTracker["stanceLabels"] } = $props();
  let el: TcAgreementTracker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-counter-request", on);
    return () => el.removeEventListener("tc-counter-request", on);
  });
</script>

<tc-agreement-tracker bind:this={el} {turns} {stanceLabels}></tc-agreement-tracker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `turns` | – | `AgreementTurn[]` | `[]` | The session's answers in order, oldest first, each classified by the app |
| `threshold` | `threshold` | `number` | `2` | How many agreements in a row turn the tracker amber |
| `layout` | `layout` | `AgreementLayout` | `"card"` | "card" – a small card; "inline" – one compact strip for a chat |
| `heading` | `heading` | `string` | `"Agreement"` | The heading, and the tracker's accessible name |
| `scope` | `scope` | `string` | `"This session"` | A quiet line under the heading (card only) |
| `stanceLabels` | – | `Partial<Record<AgreementStance, string>>` | `{}` | Names of the three stances – "Agreed", "Pushed back" and "Neutral" by default |
| `max` | `max` | `number \| undefined` | `undefined` | How many of the latest turns the record shows – 24 in a card and 8 inline by default; earlier ones are counted |
| `counterLabel` | `counter-label` | `string` | `"Show the other side"` | The label of the button that asks for the counter-argument |
| `warningText` | `warning-text` | `string` | `"The last {n} answers agreed with you. The strongest case against may show what agreement hides."` | The warning at the threshold; {n} is replaced by the length of the run |
| `stats` | – | `AgreementStats` | – | The counts, the rate and the current run |
| `warned` | – | `` | – | Whether the run of agreements has reached the threshold |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-counter-request` | – | No | "Show the other side" was pressed; detail `{ run, turnId }`: AgreementCounterRequest – the run's length and its last turn. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agreement-tracker-agreed-bg` | `var(--tc-fill-strong)` | both |
| `--tc-agreement-tracker-agreed-fg` | `var(--tc-text-secondary)` | both |
| `--tc-agreement-tracker-pushed-bg` | `var(--tc-tone-teal-bg)` | both |
| `--tc-agreement-tracker-pushed-fg` | `var(--tc-tone-teal-fg)` | both |
| `--tc-agreement-tracker-turn` | `18px` | both |

#### Design tokens it reads (83)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `agreementStats(turns: AgreementTurn[]): AgreementStats` | Counts and the current run of a list of turns – neutral turns neither extend nor break a run |

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
| `turns` | `el.turns = …;` | `<… turns={…} />` | `<tc-agreement-tracker :turns="…">` | `<tc-agreement-tracker [turns]="…">` | `<tc-agreement-tracker {turns}>` |
| `stanceLabels` | `el.stanceLabels = …;` | `<… stanceLabels={…} />` | `<tc-agreement-tracker :stanceLabels="…">` | `<tc-agreement-tracker [stanceLabels]="…">` | `<tc-agreement-tracker {stanceLabels}>` |

*Also attributes: `threshold`, `layout`, `heading`, `scope`, `max`, `counter-label`, `warning-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-counter-request` | No | `el.addEventListener("tc-counter-request", (e) => …)` | `onRequestCounter={…}` | `@tc-counter-request="…"` | `(tc-counter-request)="…($event)"` | `el.addEventListener("tc-counter-request", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agreement-tracker")` returns a `TcAgreementTracker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";`
- **React / Next.js:** Props: `import type { AgreementTrackerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgreementTracker>`. The element class, for refs: `import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgreementTracker["turns"]` with `import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";`
- **Angular:** The directive types the template: `[turns]` takes `TcAgreementTracker["turns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgreementTracker } from "@adamstavely/trenchcoat/agreement-tracker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the tracker's accessible name – "Agreement" by default |
| `onRequestCounter` | `(detail: AgreementCounterRequest) => void` | "Show the other side" was pressed: the length of the run of agreements and its last turn – show the counter-argument |

*Renamed or hidden on the wrapper: `heading`, `Agreement`, `Show the other side`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Reaches Show the other side, the only control – it appears once the tracker is warned |
| Enter / Space | On Show the other side: fires `tc-counter-request` |

The record and the figures are read, not operated.

### Screen readers

As a card the tracker is a `region` named by its heading (“Agreement”); inline it is a `group` with the heading as its
`aria-label`. The record is a list named “Turns, oldest first”, and each mark is read as “Turn 4: Agreed – Long forms”;
turns beyond the window are read as “+6 earlier turns”. When the run of agreements reaches the threshold, a polite
status region says “2 agreements in a row. Show the other side is available.” once – not again on every agreement
after – and clears when a push-back ends the run.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.2 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.5 KB** | **8.7 KB** |
| With Lit – the first component on a page | 51.3 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 20 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of turns replaced |
| First on the page | 9.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.1 ms | turns: first render, 43 nodes; update 0.1 ms |
| 1,000 items | 0.9 ms | turns: first render, 43 nodes; update 0.1 ms |

1,000 items of turns: 0.9 ms, 43 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Classify each answer against the person's framing, not against the facts: an answer that confirms a wrong premise
  is still “agreed”.
- Give each turn a `label` of a few words – what was asked – so the record means something on hover and to a screen
  reader.
- Rename the stances with `stanceLabels` to match your product (“Aligned”, “Challenged”) and keep them short.
- Keep `warningText` about the pattern, not the person: “The last 3 answers agreed with you”, not “You're leading the
  AI”.

## Do and don't

### Do

- Answer `tc-counter-request` with the strongest case against the run's conclusion, and add it as a turn.
- Keep the threshold low – two or three – so the prompt comes while it can still change a decision.
- Put the inline strip under the latest answer, where the person is reading.

### Don't

- Don't treat a high rate as an error; a person who is right should hear agreement.
- Don't count neutral answers as agreement – they neither extend nor break a run.
- Don't hide the button behind a menu; the point is that the other side is one press away.

## Related

- [Disagreement Banner](disagreement-banner.md) – When today's answer contradicts an earlier one on the same question – both side by side, the difference marked
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught
- [Reflection Gate](reflection-gate.md) – A moment to think before relying on AI – state the task and what's at stake, say what you believe, restate the answer, or name what you'll verify
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
