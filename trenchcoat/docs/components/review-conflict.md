<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Review Conflict

**Trust & calibration** · New

Two reviewers disagree – both verdicts with who gave them, resolved by a third person with a reason, or kept blind

- **Element:** `<tc-review-conflict>`
- **Size:** 9.6 KB gzip · 33.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/review-conflict";` |
| React / Next.js | `import { ReviewConflict } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/review-conflict";` · tags starting with tc- are custom elements |
| Angular | `import { ReviewConflict } from "@adamstavely/trenchcoat/angular/review-conflict";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/review-conflict";` |

## Example

The live example is in the gallery at `#/review-conflict`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Two reviewers looked at the same item and reached opposite verdicts. The card leads with the conflict: both verdicts
side by side, each with who gave it, when and why, and the difference in one sentence beneath them. A third person
resolves it – they uphold one verdict or override both with their own, give a required reason, and confirm – and
the card then shows the outcome with that reason. Blind mode is the reviewers' own view: they learn that a conflict
exists, but not who disagreed or how, so the other verdict can't anchor their thinking.

### When to use

- Any review step with two independent reviewers: fact checks, labelling, content moderation, code or design review.
- When a disagreement must be settled by someone else, with a record of why.
- Showing reviewers that their work is in conflict without revealing the other review.

### When not to use

- An AI and a person, or two models, disagreeing in a conversation – use [Disagreement Banner](disagreement-banner.md).
- Working through a queue of claims to verify – use [Verification Queue](verification-queue.md).
- A dashboard of reviews across many items – use [Review Center](review-center.md).
- Comparing two model answers to pick the better one – use [Answer Arena](answer-arena.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Item** `.ui-rcf__item` – what was reviewed, quoted
2. **Verdict** `.ui-rcf__verdict` – one reviewer's verdict, who, when and their reason
3. **Difference** `.ui-rcf__diff` – the disagreement in one sentence
4. **Override** `.ui-rcf__override` – the resolver's own verdict instead of either
5. **Confirm** `.ui-rcf__foot` – what's still missing, and Confirm resolution

## Looks

Standard puts the header on the gray tray, the verdicts and controls on a white card, and the confirm row back on
the tray. Clean is one white card with the confirm row as its last row under a hairline. In both, the verdicts sit
side by side with ≠ between them, and stack when the card is narrower than 400 px.

## Usage

### HTML

```html
<tc-review-conflict id="conflict" item="Northwind's revenue grew 18% in 2025." resolver="Dana Lee"></tc-review-conflict>

<script type="module">
  import "@adamstavely/trenchcoat/review-conflict";
  import "@adamstavely/trenchcoat/tokens.css";

  const conflict = document.querySelector("#conflict");
  conflict.reviews = [
    { id: "ana", reviewer: { name: "Ana Ruiz" }, verdict: "Supported", tone: "positive", reason: "Matches the annual report." },
    { id: "ben", reviewer: { name: "Ben Okafor" }, verdict: "Not supported", tone: "negative", reason: "The report was restated." },
  ];
  conflict.addEventListener("tc-resolve", (e) => console.log("resolved", e.detail.choice, e.detail.reason));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ReviewConflict, type ReviewResolution, type ReviewVerdict } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ClaimConflict({ reviews, blindFor }: { reviews: ReviewVerdict[]; blindFor?: string }) {
  const [resolution, setResolution] = useState<ReviewResolution | null>(null);
  return (
    <ReviewConflict
      item="Northwind's revenue grew 18% in 2025."
      reviews={reviews}
      blind={!!blindFor}
      viewer={blindFor}
      resolver="Dana Lee"
      resolution={resolution}
      onResolve={setResolution}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/review-conflict";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";

defineProps<{ reviews: TcReviewConflict["reviews"]; resolution: TcReviewConflict["resolution"] }>();
const onResolve = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-review-conflict :reviews="reviews" :resolution="resolution" @tc-resolve="onResolve"></tc-review-conflict>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ReviewConflict } from "@adamstavely/trenchcoat/angular/review-conflict";
import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";

@Component({
  selector: "app-review-conflict-example",
  imports: [ReviewConflict],
  template: `<tc-review-conflict [reviews]="reviews()" [resolution]="resolution()" (tc-resolve)="onResolve($event)"></tc-review-conflict>`,
})
export class ReviewConflictExample {
  readonly reviews = input.required<TcReviewConflict["reviews"]>();
  readonly resolution = input.required<TcReviewConflict["resolution"]>();
  onResolve(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/review-conflict";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";

  let { reviews, resolution }: { reviews: TcReviewConflict["reviews"]; resolution: TcReviewConflict["resolution"] } = $props();
  let el: TcReviewConflict;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-resolve", on);
    return () => el.removeEventListener("tc-resolve", on);
  });
</script>

<tc-review-conflict bind:this={el} {reviews} {resolution}></tc-review-conflict>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Review conflict"` | The heading, and the group's name |
| `scope` | `scope` | `string` | `""` | A quiet line under the heading, e.g. the document or queue the item is from |
| `item` | `item` | `string` | `""` | What was reviewed, quoted at the top – a claim, a finding, a row |
| `reviews` | – | `ReviewVerdict[]` | `[]` | The two reviews, in the order to show them |
| `difference` | `difference` | `string` | `""` | The difference in one sentence; unset, it's written from the verdicts |
| `blind` | `blind` | `boolean` | `false` | The reviewers' view: identities and verdicts are hidden, only that a conflict exists is shown |
| `viewer` | `viewer` | `string \| undefined` | `undefined` | In blind mode, the id of the review that belongs to the person looking – they see their own verdict |
| `resolvable` | `resolvable` | `boolean` | `true` | The person looking may resolve it. Default true; false shows the conflict read-only |
| `resolution` | – | `ReviewResolution \| null` | `null` | The outcome, once resolved |
| `resolver` | `resolver` | `string` | `""` | The resolver's name, recorded with the resolution when the element sets it |
| `confirmLabel` | `confirm-label` | `string` | `"Confirm resolution"` | The confirm button's text |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-resolve` | – | Yes | The resolver confirmed ({ choice, verdict, reason }: ReviewResolveDetail) – choice is the upheld review's id or "override"; cancelable – not prevented, `resolution` is set |

#### Design tokens it reads (82)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-avatar-font-weight`, `--tc-border-control`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `reviews` | `el.reviews = …;` | `<… reviews={…} />` | `<tc-review-conflict :reviews="…">` | `<tc-review-conflict [reviews]="…">` | `<tc-review-conflict {reviews}>` |
| `resolution` | `el.resolution = …;` | `<… resolution={…} />` | `<tc-review-conflict :resolution="…">` | `<tc-review-conflict [resolution]="…">` | `<tc-review-conflict {resolution}>` |

*Also attributes: `heading`, `scope`, `item`, `difference`, `blind`, `viewer`, `resolvable`, `resolver` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-resolve` | Yes | `el.addEventListener("tc-resolve", (e) => …)` | `ref.current.addEventListener("tc-resolve", …)` | `@tc-resolve="…"` | `(tc-resolve)="…($event)"` | `el.addEventListener("tc-resolve", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-resolve` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-review-conflict")` returns a `TcReviewConflict` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";`
- **React / Next.js:** Props: `import type { ReviewConflictProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ReviewConflict>`. The element class, for refs: `import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcReviewConflict["reviews"]` with `import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";`
- **Angular:** The directive types the template: `[reviews]` takes `TcReviewConflict["reviews"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcReviewConflict } from "@adamstavely/trenchcoat/review-conflict";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the group's name |
| `resolution` | `ReviewResolution \| null` | The outcome – controlled when given (null while open) |
| `defaultResolution` | `ReviewResolution \| null` | The outcome at first, when `resolution` isn't set |
| `onResolve` | `(resolution: ReviewResolution) => void` | Called when the resolver confirms, with the choice (a review's id or "override"), the verdict and the reason |

*Renamed or hidden on the wrapper: `heading`, `resolution`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the verdicts once, then to the verdict field (when overriding), the reason and Confirm |
| ↑ / ↓ / ← / → | Moves between the two verdicts and Override, picking each (the browser's radio group) |
| Ctrl + Enter / ⌘ + Enter | In the reason, confirms the resolution when everything is filled in |
| Enter / Space | On Confirm resolution, confirms |

Once resolved, focus moves to the outcome.

### Screen readers

The card is a `group` named by its heading. The verdicts and Override are radios in a fieldset named “Uphold a
verdict”; each verdict's radio is named “Uphold Ana Ruiz: Supported”. The reason field is required and described by
the hint beside Confirm, which says what's missing (“Pick a verdict to uphold, or override.”, “Give your verdict.”,
“Give a reason – it's kept with the resolution.”). Resolving announces “Conflict resolved: Not supported.” In blind
mode, the note “A conflict exists. …” is a `note`, and the other reviewer's card says only “Another reviewer” and
“Verdict hidden”.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
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
| **This component alone** | 25.1 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **33.6 KB** | **9.6 KB** |
| With Lit – the first component on a page | 54.2 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 75 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of reviews replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.0 ms | reviews: first render, 75 nodes; update 0.5 ms |
| 1,000 items | 2.2 ms | reviews: first render, 75 nodes; update 0.3 ms |

What it renders doesn't grow with reviews (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep verdicts to a word or two – “Supported”, “Not supported”, “Needs more evidence” – and set `tone`.
- Reasons are the reviewers' own words; don't rewrite them.
- Write `difference` as what each person did differently, not who is right.
- Give `at` as people read times in your product: “Today 09:14”.

## Do and don't

### Do

- Use `blind` with `viewer` for the reviewers, and the full view only for the resolver.
- Store `reason` with the resolution; it's the most useful part of the record.
- Prevent `tc-resolve` and set `resolution` yourself when saving can fail.

### Don't

- Don't show reviewers each other's verdicts before the conflict is resolved.
- Don't let the resolver be one of the two reviewers.
- Don't use it for more than two reviews – it shows the first two.

## Related

- [Disagreement Banner](disagreement-banner.md) – When today's answer contradicts an earlier one on the same question – both side by side, the difference marked
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
