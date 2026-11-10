<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Knowledge Promotion

**Trust & calibration** · New

Promote a verified fact into shared team knowledge against a checklist, with disputed facts side by side

- **Element:** `<tc-knowledge-promotion>`
- **Size:** 9.7 KB gzip · 34.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/knowledge-promotion";` |
| React / Next.js | `import { KnowledgePromotion } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/knowledge-promotion";` · tags starting with tc- are custom elements |
| Angular | `import { KnowledgePromotion } from "@adamstavely/trenchcoat/angular/knowledge-promotion";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/knowledge-promotion";` |

## Example

The live example is in the gallery at `#/knowledge-promotion`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Promote a verified fact from one piece of work into the knowledge a whole team relies on, against a checklist. The
fact leads, quoted, with who proposed it, where it came from and its confidence. Below it, the conditions: required
ones – a reviewer's sign-off, no open dispute, confidence at or above the threshold – and recommended ones, such as a
second reviewer, each met or not, with who met it and when. Promote stays unavailable until every required condition
is met; a recommended one that isn't met shows a warning but doesn't block. When the fact is disputed, every version
stays visible side by side, so a disagreement is seen rather than settled silently.

### When to use

- Moving a finding from a session or a case into shared team knowledge that other work, or an AI, will cite.
- Anywhere a fact needs a sign-off trail before it becomes an accepted reference.
- Showing a disputed fact during review, with both versions in view.

### When not to use

- Approving a single action an agent wants to take – use [Approval Card](approval-card.md).
- Two reviewers who gave opposing verdicts on an item – use [Review Conflict](review-conflict.md).
- Browsing or editing what an assistant remembers – use [Memory Panel](memory-panel.md).
- Checking individual claims against their sources – use [Verification Queue](verification-queue.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, what the knowledge covers, and the state's pill
2. **Fact** `.ui-kpro__fact` – the fact quoted, who proposed it, when and where, and its confidence
3. **Versions** `.ui-kpro__versions` – when disputed, this version and each disputed one side by side
4. **Checklist** `.ui-kpro__checks` – each condition met or not, required or recommended, with who and when
5. **Warning** `.ui-kpro__warning` – the recommended conditions not met, once the required ones are
6. **Actions** `.ui-kpro__foot` – what Promote waits on, Dispute and Promote

## Looks

Standard sets the header on the gray tray, the fact and checklist on a white card, and the status and actions on
the tray below. Clean is one white card with a shadow: the actions become its last row under a hairline, the
version labels are small captions, and the check marks are thinner.

## Usage

### HTML

```html
<tc-knowledge-promotion id="promote" scope="Acme lease review" threshold="0.8"></tc-knowledge-promotion>

<script type="module">
  import "@adamstavely/trenchcoat/knowledge-promotion";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#promote");
  card.fact = { text: "The notice period is 90 days.", by: "Ana Ruiz", at: "12 Oct", confidence: 0.88 };
  card.conditions = [
    { id: "signoff", label: "Reviewer sign-off", met: true, by: "Priya Shah", at: "13 Oct" },
    { id: "dispute", label: "No open dispute", met: true },
    { id: "second", label: "Second reviewer", required: false, met: false },
  ];
  card.addEventListener("tc-promote", async (e) => {
    e.preventDefault();
    card.status = "promoting";
    await saveFact(e.detail.fact); // your own API
    card.status = "promoted";
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { KnowledgePromotion, type KnowledgeStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PromoteFact() {
  const [status, setStatus] = useState<KnowledgeStatus>("candidate");
  return (
    <KnowledgePromotion
      scope="Acme lease review"
      fact={{ text: "The notice period is 90 days.", by: "Ana Ruiz", at: "12 Oct", confidence: 0.88 }}
      conditions={[
        { id: "signoff", label: "Reviewer sign-off", met: true, by: "Priya Shah", at: "13 Oct" },
        { id: "dispute", label: "No open dispute", met: true },
        { id: "second", label: "Second reviewer", required: false, met: false },
      ]}
      status={status}
      onPromote={() => setStatus("promoted")}
      onDispute={(reason, version) => console.log("disputed", reason, version)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/knowledge-promotion";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";

defineProps<{ fact: TcKnowledgePromotion["fact"]; conditions: TcKnowledgePromotion["conditions"] }>();
const onPromote = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-knowledge-promotion :fact="fact" :conditions="conditions" @tc-promote="onPromote"></tc-knowledge-promotion>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { KnowledgePromotion } from "@adamstavely/trenchcoat/angular/knowledge-promotion";
import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";

@Component({
  selector: "app-knowledge-promotion-example",
  imports: [KnowledgePromotion],
  template: `<tc-knowledge-promotion [fact]="fact()" [conditions]="conditions()" (tc-promote)="onPromote($event)"></tc-knowledge-promotion>`,
})
export class KnowledgePromotionExample {
  readonly fact = input.required<TcKnowledgePromotion["fact"]>();
  readonly conditions = input.required<TcKnowledgePromotion["conditions"]>();
  onPromote(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/knowledge-promotion";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";

  let { fact, conditions }: { fact: TcKnowledgePromotion["fact"]; conditions: TcKnowledgePromotion["conditions"] } = $props();
  let el: TcKnowledgePromotion;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-promote", on);
    return () => el.removeEventListener("tc-promote", on);
  });
</script>

<tc-knowledge-promotion bind:this={el} {fact} {conditions}></tc-knowledge-promotion>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Promote to team knowledge"` | The heading, and the region's name |
| `scope` | `scope` | `string` | `""` | Where the knowledge goes or what it covers, a quiet line under the heading – e.g. "Acme lease review" |
| `fact` | – | `KnowledgeFact` | `{ text: "" }` | The fact to promote |
| `conditions` | – | `KnowledgeCondition[]` | `[]` | The checklist, in order – required conditions block Promote, recommended ones only warn |
| `versions` | – | `KnowledgeVersion[]` | `[]` | Disputed versions of the fact, shown side by side with it |
| `threshold` | `threshold` | `number` | `0.8` | Confidence the fact needs, 0–1 – checked when `fact.confidence` is set |
| `thresholdOptional` | `threshold-optional` | `boolean` | `false` | Makes the confidence condition recommended instead of required |
| `status` | `status` | `KnowledgeStatus` | `"candidate"` | "candidate" (default), "promoting" while the app saves, or "promoted" |
| `error` | `error` | `string` | `""` | Why the last promotion failed – shown above the actions; Promote tries again |
| `disputing` | `disputing` | `boolean` | `false` | The dispute form is open – set false to close it after a prevented tc-dispute |
| `noDispute` | `no-dispute` | `boolean` | `false` | Hides Dispute, for people who can promote but not dispute |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers |
| `ready` | – | `` | – | Every required condition is met |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-promote` | – | Yes | Promote was pressed with every required condition met (detail: { fact, unmetRecommended: ids of recommended conditions not met }); cancelable – prevent it to save first and set `status` yourself |
| `tc-dispute` | – | Yes | The dispute form was sent (KnowledgeDispute – detail: { reason, version: the corrected wording, or "" }); cancelable – prevent it to keep the form open, e.g. while saving |

#### Design tokens it reads (89)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `fact` | `el.fact = …;` | `<… fact={…} />` | `<tc-knowledge-promotion :fact="…">` | `<tc-knowledge-promotion [fact]="…">` | `<tc-knowledge-promotion {fact}>` |
| `conditions` | `el.conditions = …;` | `<… conditions={…} />` | `<tc-knowledge-promotion :conditions="…">` | `<tc-knowledge-promotion [conditions]="…">` | `<tc-knowledge-promotion {conditions}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-knowledge-promotion :versions="…">` | `<tc-knowledge-promotion [versions]="…">` | `<tc-knowledge-promotion {versions}>` |

*Also attributes: `heading`, `scope`, `threshold`, `threshold-optional`, `status`, `error`, `disputing`, `no-dispute` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-promote` | Yes | `el.addEventListener("tc-promote", (e) => …)` | `onPromote={…}` | `@tc-promote="…"` | `(tc-promote)="…($event)"` | `el.addEventListener("tc-promote", …)` |
| `tc-dispute` | Yes | `el.addEventListener("tc-dispute", (e) => …)` | `onDispute={…}` | `@tc-dispute="…"` | `(tc-dispute)="…($event)"` | `el.addEventListener("tc-dispute", …)` |

### Controlled

`tc-promote`, `tc-dispute` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-knowledge-promotion")` returns a `TcKnowledgePromotion` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";`
- **React / Next.js:** Props: `import type { KnowledgePromotionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof KnowledgePromotion>`. The element class, for refs: `import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcKnowledgePromotion["fact"]` with `import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";`
- **Angular:** The directive types the template: `[fact]` takes `TcKnowledgePromotion["fact"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcKnowledgePromotion } from "@adamstavely/trenchcoat/knowledge-promotion";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `status` | `KnowledgeStatus` | "candidate", "promoting" or "promoted". Controlled when defined: Promote only reports through onPromote, and you pass the new status back. Otherwise the component marks the fact promoted itself |
| `defaultStatus` | `KnowledgeStatus` | The status at first, when uncontrolled |
| `onPromote` | `(fact: KnowledgeFact, unmetRecommended: string[]) => void` | Promote was pressed with every required condition met: the fact and the ids of recommended conditions not met |
| `onDispute` | `(reason: string, version: string) => void` | Shows Dispute; called with the reason and the corrected wording ("" when none) when the form is sent |

*Renamed or hidden on the wrapper: `heading`, `status`, `noDispute`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Dispute, Promote and, in the dispute form, its two fields and buttons |
| Enter / Space | Presses the focused button; Promote does nothing while it is unavailable |
| Escape | In the dispute form: cancels it and returns focus to Dispute |
| Ctrl / ⌘ + Enter | In the dispute form: raises the dispute |

### Screen readers

The card is a `region`, named by its heading. The checklist is a list named “Before it's promoted”; each condition
says whether it is met (“Reviewer sign-off: Not met”, “Second reviewer: Not met – recommended”). Disputed versions
are a list named by the line above them (“Disputed – both versions stay visible until it's resolved”). Promote stays
focusable while unavailable, with `aria-disabled="true"`, and is described by the status (“Waiting on: reviewer
sign-off”) and, when ready, by the warning. Dispute reports `aria-expanded`; the form is named “Dispute this fact”,
and a missing reason marks the field invalid with “Say what's wrong with it, so the reviewer can check.”. A polite
live region says “Promoted to team knowledge.” and “Dispute raised.”; an `error` is an alert.

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

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.9 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.2 KB** | **9.7 KB** |
| With Lit – the first component on a page | 56.0 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 62 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of conditions replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.2 ms | conditions: first render, 773 nodes; update 0.4 ms |
| 1,000 items | 35 ms | conditions: first render, 7,373 nodes; update 3.3 ms |

1,000 items of conditions: 35 ms, 7,373 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Write the fact as it should read in the team's knowledge – one or two plain sentences, no hedging.
- Label conditions as states that are true when met: “No open dispute”, not “Check disputes”.
- Use `detail` for what an unmet condition waits on (“Requested from Priya Shah”) or what was checked.
- Give `at` as the app formats dates elsewhere; the card shows it as given.
- Keep `error` short and say what happened: “The knowledge base didn't respond.”

## Do and don't

### Do

- Mark only what must block as required, and leave good practice as recommended.
- Add a dispute to `versions` and open the “No open dispute” condition again when one is raised.
- Set `threshold` from your own policy, and `threshold-optional` where confidence is advice, not a gate.

### Don't

- Don't remove a disputed version from view until a person has resolved it.
- Don't promote automatically when the conditions are met – a person presses Promote.
- Don't hide Dispute after promotion; a promoted fact can still be wrong.

## Related

- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Review Conflict](review-conflict.md) – Two reviewers disagree – both verdicts with who gave them, resolved by a third person with a reason, or kept blind
- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
