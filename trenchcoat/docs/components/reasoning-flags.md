<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Reasoning Flags

**Trust & calibration** · New

Inline markers for weak reasoning in an answer – circular, hedged then certain, self-contradicting or overconfident – each with an explanation

- **Element:** `<tc-reasoning-flags>`
- **Size:** 10.8 KB gzip · 32.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/reasoning-flags";` |
| React / Next.js | `import { ReasoningFlags } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/reasoning-flags";` · tags starting with tc- are custom elements |
| Angular | `import { ReasoningFlags } from "@adamstavely/trenchcoat/angular/reasoning-flags";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/reasoning-flags";` |

## Example

The live example is in the gallery at `#/reasoning-flags`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A model's answer with its weak reasoning pointed out where it happens. The app runs its own check and passes the
spans it found; each gets a subtle dotted underline and a small flag after it. Hover the passage or focus the flag
and a card names the pattern – circular reasoning, a hedge followed by a confident conclusion, a self-contradiction,
more certainty than the evidence supports, or a kind of your own – and explains in plain words why this passage was
flagged. A summary chip says how many there are and leads to the first. Flags are advisory: the card says they were
detected automatically, and can offer "Ask the model to reconsider".

### When to use

- Showing an answer that a reasoning check has looked at, so readers know which sentences to read twice.
- Reviewing model output before it's shared, where a reviewer can send a flagged passage back to the model.
- Any check that finds spans in text and needs to explain each one briefly in place.

### When not to use

- Saying where each claim in an answer came from – use [Claim Answer](claim-answer.md).
- A warning that a whole request is outside what the system has been proven on – use [Capability Notice](capability-notice.md).
- Summarising how far to trust an answer overall – use [Confidence Brief](confidence-brief.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-rfl__chip` – how many flags there are; leads to the first
2. **Flagged span** `.ui-rfl__span` – the passage, with a dotted underline
3. **Marker** `.ui-rfl__marker` – the small flag after the passage; focus or hover it to explain
4. **Card** `.ui-rfl__pop` – the pattern's name, the explanation, the advisory note and Reconsider

## Looks

Both looks keep the flags quiet: a dotted amber underline that fills in only while its card is open. Standard
gives each marker a small filled badge and the summary chip a tinted fill; Clean draws the marker as a thin
outlined flag, the chip with a hairline, and the answer's text a step quieter. It's inline, so neither look adds a
header or tray.

## Usage

### HTML

```html
<tc-reasoning-flags id="answer" reconsider></tc-reasoning-flags>

<script type="module">
  import "@adamstavely/trenchcoat/reasoning-flags";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.text = "It's hard to say how much time it saves, but it will certainly finish before 6 a.m.";
  answer.flags = [{ id: "f1", start: 41, end: 83, kind: "hedge-then-certain", explanation: "It admits the saving is unknown, then promises a finish time anyway." }];
  answer.addEventListener("tc-reconsider", (e) => console.log("send back", e.detail.flag));
</script>
```

### React / Next.js

```tsx
import { ReasoningFlags, type ReasoningFlag } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const text = "It's hard to say how much time it saves, but it will certainly finish before 6 a.m.";
const flags: ReasoningFlag[] = [{ id: "f1", start: 41, end: 83, kind: "hedge-then-certain", explanation: "It admits the saving is unknown, then promises a finish time anyway." }];

export function Answer() {
  return <ReasoningFlags text={text} flags={flags} onReconsider={(flag) => console.log("send back", flag.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/reasoning-flags";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";

defineProps<{ flags: TcReasoningFlags["flags"]; kinds: TcReasoningFlags["kinds"] }>();
const onReconsider = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-reasoning-flags :flags="flags" :kinds="kinds" @tc-reconsider="onReconsider"></tc-reasoning-flags>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ReasoningFlags } from "@adamstavely/trenchcoat/angular/reasoning-flags";
import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";

@Component({
  selector: "app-reasoning-flags-example",
  imports: [ReasoningFlags],
  template: `<tc-reasoning-flags [flags]="flags()" [kinds]="kinds()" (tc-reconsider)="onReconsider($event)"></tc-reasoning-flags>`,
})
export class ReasoningFlagsExample {
  readonly flags = input.required<TcReasoningFlags["flags"]>();
  readonly kinds = input.required<TcReasoningFlags["kinds"]>();
  onReconsider(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/reasoning-flags";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";

  let { flags, kinds }: { flags: TcReasoningFlags["flags"]; kinds: TcReasoningFlags["kinds"] } = $props();
  let el: TcReasoningFlags;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-reconsider", on);
    return () => el.removeEventListener("tc-reconsider", on);
  });
</script>

<tc-reasoning-flags bind:this={el} {flags} {kinds}></tc-reasoning-flags>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The answer's text: plain text, shown as written (line breaks kept). Flags' offsets index into it |
| `flags` | – | `ReasoningFlag[]` | `[]` | The flagged spans, from the app: `{ id?, start, end, kind, explanation }[]` |
| `kinds` | – | `Record<string, ReasoningFlagKind>` | `{}` | Names and descriptions by kind, merged over the built-in ones |
| `reconsider` | `reconsider` | `boolean` | `false` | Offer "Ask the model to reconsider" in each card (fires tc-reconsider) |
| `reconsiderLabel` | `reconsider-label` | `string` | `"Ask the model to reconsider"` | The reconsider button's text |
| `noSummary` | `no-summary` | `boolean` | `false` | Hide the summary chip ("2 reasoning flags") |
| `note` | `note` | `string` | `"Detected automatically – it may be wrong."` | The line at the foot of each card – that the flags are automatic and advisory |
| `hoverDelay` | `hover-delay` | `number` | `300` | How long the pointer rests on a span or marker before its card opens, ms |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-reconsider` | – | No | "Ask the model to reconsider" was pressed on a flag ({ flag, index }: ReasoningReconsiderDetail) |
| `tc-open-change` | – | No | A flag's card opened or closed ({ flag, index }: ReasoningOpenChange; flag null when closed) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `openCard(index: unknown)` | `void` | Opens the card for the flag at `index` in reading order (sorted by start), pinned open; focus stays where it is |
| `closeCard()` | `void` | Closes the open card, if any |

#### Design tokens it reads (46)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `REASONING_KINDS: Record<string, ReasoningFlagKind>` | The built-in kinds |

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
| `flags` | `el.flags = …;` | `<… flags={…} />` | `<tc-reasoning-flags :flags="…">` | `<tc-reasoning-flags [flags]="…">` | `<tc-reasoning-flags {flags}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-reasoning-flags :kinds="…">` | `<tc-reasoning-flags [kinds]="…">` | `<tc-reasoning-flags {kinds}>` |

*Also attributes: `text`, `reconsider`, `reconsider-label`, `no-summary`, `note`, `hover-delay` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-reconsider` | No | `el.addEventListener("tc-reconsider", (e) => …)` | `onReconsider={…}` | `@tc-reconsider="…"` | `(tc-reconsider)="…($event)"` | `el.addEventListener("tc-reconsider", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-reasoning-flags")` returns a `TcReasoningFlags` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";`
- **React / Next.js:** Props: `import type { ReasoningFlagsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ReasoningFlags>`. The element class, for refs: `import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcReasoningFlags["flags"]` with `import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";`
- **Angular:** The directive types the template: `[flags]` takes `TcReasoningFlags["flags"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcReasoningFlags } from "@adamstavely/trenchcoat/reasoning-flags";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onReconsider` | `(flag: ReasoningFlag, index: number) => void` | Shows "Ask the model to reconsider" in each card; called with the flag and its index in `flags` when pressed |
| `summary` | `boolean` | Show the summary chip ("2 reasoning flags") above the text (default true) |
| `onOpenChange` | `(flag: ReasoningFlag \| null, index: number) => void` | Called with the flag whose card opened, or null when it closed |

*Renamed or hidden on the wrapper: `reconsider`, `noSummary`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the summary chip, then to each marker in reading order; focusing a marker opens its card. With "Ask the model to reconsider" on and a card open, Tab moves into the card, and from its button on to the next marker |
| Shift + Tab | From the card's button, back to its marker |
| Enter / Space | On the chip: focuses the first marker and opens its card. On a marker: opens its card (and moves into it when it has a button) |
| Escape | Closes the card; focus goes back to its marker |

### Screen readers

The summary chip is a button named by its text ("4 reasoning flags"). Each marker is a button named "Reasoning
flag: Circular reasoning" (the kind's label), with `aria-expanded`; while its card is open it's described by the
explanation. Without a reconsider button the card is a `tooltip`; with it, a non-modal `dialog` (and the marker has
`aria-haspopup="dialog"`). Either is named by the kind's label. Asking to reconsider is announced politely – "Asked
the model to reconsider: hedged, then certain" – and the button then reads "Asked to reconsider".

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.1 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/selection` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.8 KB** | **10.8 KB** |
| With Lit – the first component on a page | 52.3 KB | 17.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.0 ms** | re-render with the same data |
| First on the page | 1.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `explanation` is about this passage: what it says and why that's weak ("It admits the saving is unknown, then
  promises a finish time anyway"). The card adds the general description of the pattern below it.
- Rename the built-in kinds, or add your own, with `kinds` – `{ "unsourced-figure": { label: "Unsourced figure",
  description: "…" } }`. A kind with no label is shown with its key in words.
- Flag the clause that carries the weak step, not the whole paragraph – short spans keep the answer readable.
- Keep `note` honest about how the flags were found; the default is "Detected automatically – it may be wrong."

## Do and don't

### Do

- Pass `onReconsider` (or set `reconsider` and listen for `tc-reconsider`) when the app can send the passage back
  to the model, and replace the text and flags when the revision arrives.
- Give flags stable `id`s, so an open card and an "asked" state follow them when the list changes.
- Use the same words for a kind everywhere in the product.

### Don't

- Don't use it as a verdict on the answer – it marks places to check, not errors.
- Don't flag every sentence; when most of an answer is flagged, say so once with `capability-notice` instead.
- Don't use domain jargon in the labels – people reading the answer may not know it.

## Related

- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Capability Notice](capability-notice.md) – When a request falls where the AI is only partly proven or not proven – a capped confidence, who was notified, and how far the request is from the usual
- [Confidence Brief](confidence-brief.md) – An answer explained for someone who wasn't there – what we conclude, the kind of uncertainty, what would change it, assumptions, signs to watch and the track record
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
