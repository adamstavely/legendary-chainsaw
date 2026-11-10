<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Correction Propagation

**Trust & calibration** · New

How far a correction reaches – every artifact and released package that cites the corrected claim, each sent for review, nothing rewritten behind your back

- **Element:** `<tc-correction-propagation>`
- **Size:** 9.3 KB gzip · 32.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/correction-propagation";` |
| React / Next.js | `import { CorrectionPropagation } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/correction-propagation";` · tags starting with tc- are custom elements |
| Angular | `import { CorrectionPropagation } from "@adamstavely/trenchcoat/angular/correction-propagation";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/correction-propagation";` |

## Example

The live example is in the gallery at `#/correction-propagation`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How far a correction reaches. When a claim is corrected, the documents built on it don't change by themselves: this
lists every artifact and released package that cites the corrected claim and puts each one in front of a person – to
review it, mark it superseded, or dismiss it when it doesn't rely on the claim after all. Nothing is rewritten
automatically; the component records the decision and tells the app, which does the work. A meter shows how much of
the correction's reach has been handled.

### When to use

- After a reviewer corrects a claim that other documents may have quoted or built on.
- When work has been released to others and can only be superseded, not quietly edited.
- Tracking a correction to done – every citing item reviewed, superseded or dismissed.

### When not to use

- Undoing changes an agent made in your systems – use [Agent Ledger](agent-ledger.md).
- Asking a person to approve one action before it happens – use [Approval Card](approval-card.md).
- Tracing where a single output came from – use [Lineage Graph](lineage-graph.md).
- Verifying claims in a session before an export – use [Verification Queue](verification-queue.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the heading, how many items cite the claim and how many are released
2. **Correction** `.ui-cpr__fix` – the old wording struck through, the new one, why and who
3. **Progress** `.ui-cpr__progress` – how many are handled, as a meter split by state
4. **Group** `.ui-cpr__group` – released packages, then artifacts
5. **Item** `.ui-cpr__row` – what cites the claim, where, the citing passage, and its actions or state
6. **Note** `.ui-cpr__note` – what the component won't do

## Looks

Standard sets the card on a gray tray with the header above it, and the actions are raised secondary buttons. Clean is
one white card with the header as its first row: captions in small capitals, thinner icons and hairline-outlined actions. Both strike
the old wording through in red and mark released packages with a violet tag.

## Usage

### HTML

```html
<tc-correction-propagation
  id="reach"
  claim="Service credits are capped at 15% of monthly fees."
  correction="Service credits are capped at 10% of monthly fees."
  reason="Master agreement §7.2 says ten percent"
></tc-correction-propagation>

<script type="module">
  import "@adamstavely/trenchcoat/correction-propagation";
  import "@adamstavely/trenchcoat/tokens.css";

  const reach = document.querySelector("#reach");
  reach.candidates = [
    { id: "p1", kind: "package", title: "Q3 vendor risk report", version: "v2.1", detail: "Sent to the board" },
    { id: "a1", title: "Risk memo §2", detail: "Draft", quote: "Credits are capped at 15%…" },
  ];
  reach.addEventListener("tc-review", (e) => console.log("Review", e.detail.candidate.title));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CorrectionPropagation, type CorrectionCandidate, type CorrectionState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const candidates: CorrectionCandidate[] = [
  { id: "p1", kind: "package", title: "Q3 vendor risk report", version: "v2.1", detail: "Sent to the board" },
  { id: "a1", title: "Risk memo §2", detail: "Draft" },
];

export function Reach({ open }: { open: (id: string) => void }) {
  const [states, setStates] = useState<Record<string, CorrectionState>>({});
  return (
    <CorrectionPropagation
      claim="Service credits are capped at 15% of monthly fees."
      correction="Service credits are capped at 10% of monthly fees."
      candidates={candidates}
      states={states}
      onStatesChange={setStates}
      onReview={(id) => open(id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/correction-propagation";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";

defineProps<{ candidates: TcCorrectionPropagation["candidates"]; states: TcCorrectionPropagation["states"] }>();
const onStatesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-correction-propagation :candidates="candidates" :states="states" @tc-states-change="onStatesChange"></tc-correction-propagation>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CorrectionPropagation } from "@adamstavely/trenchcoat/angular/correction-propagation";
import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";

@Component({
  selector: "app-correction-propagation-example",
  imports: [CorrectionPropagation],
  template: `<tc-correction-propagation [candidates]="candidates()" [states]="states()" (tc-states-change)="onStatesChange($event)"></tc-correction-propagation>`,
})
export class CorrectionPropagationExample {
  readonly candidates = input.required<TcCorrectionPropagation["candidates"]>();
  readonly states = input.required<TcCorrectionPropagation["states"]>();
  onStatesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/correction-propagation";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";

  let { candidates, states }: { candidates: TcCorrectionPropagation["candidates"]; states: TcCorrectionPropagation["states"] } = $props();
  let el: TcCorrectionPropagation;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-states-change", on);
    return () => el.removeEventListener("tc-states-change", on);
  });
</script>

<tc-correction-propagation bind:this={el} {candidates} {states}></tc-correction-propagation>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Correction reach"` | The heading, and the component's name |
| `claim` | `claim` | `string` | `""` | The claim as it was, before the correction |
| `correction` | `correction` | `string` | `""` | The claim as corrected |
| `reason` | `reason` | `string` | `""` | Why it was corrected |
| `meta` | `meta` | `string` | `""` | Who corrected it and when, as one line – e.g. "Dana Okafor · today, 10:42" |
| `candidates` | – | `CorrectionCandidate[]` | `[]` | The artifacts and released packages that cite the corrected claim |
| `states` | – | `Record<string, CorrectionState>` | `{}` | Each item's state by id; an item not named here uses its own `state`, else "pending". Changed by the user unless a tc-states-change listener calls preventDefault() |
| `note` | `note` | `string` | `"Nothing is changed automatically – each item waits for a person."` | The line under the list – what the component won't do |
| `emptyText` | `empty-text` | `string` | `"Nothing else cites this claim."` | Shown when nothing cites the claim |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-states-change` | – | Yes | An item's state changed ({ states, id, state, candidate }: CorrectionStatesChange – states is the whole new map); cancelable – prevent it to keep `states` as it is (controlled use) |
| `tc-review` | – | No | Review was pressed on an item ({ id, candidate }: CorrectionAction) – open it for a person to check |
| `tc-supersede` | – | No | Mark superseded was pressed on an item ({ id, candidate }: CorrectionAction) |
| `tc-dismiss` | – | No | Dismiss was pressed on an item – it doesn't rely on the claim ({ id, candidate }: CorrectionAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-correction-propagation-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-correction-propagation-panel-bg` | `var(--tc-surface-raised)` | standard, clean |
| `--tc-correction-propagation-tile-bg` | `var(--tc-surface-control)` | standard, clean |

#### Design tokens it reads (89)

`--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-14`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `candidates` | `el.candidates = …;` | `<… candidates={…} />` | `<tc-correction-propagation :candidates="…">` | `<tc-correction-propagation [candidates]="…">` | `<tc-correction-propagation {candidates}>` |
| `states` | `el.states = …;` | `<… states={…} />` | `<tc-correction-propagation :states="…">` | `<tc-correction-propagation [states]="…">` | `<tc-correction-propagation {states}>` |

*Also attributes: `heading`, `claim`, `correction`, `reason`, `meta`, `note`, `empty-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-states-change` | Yes | `el.addEventListener("tc-states-change", (e) => …)` | `ref.current.addEventListener("tc-states-change", …)` | `@tc-states-change="…"` | `(tc-states-change)="…($event)"` | `el.addEventListener("tc-states-change", …)` |
| `tc-review` | No | `el.addEventListener("tc-review", (e) => …)` | `onReview={…}` | `@tc-review="…"` | `(tc-review)="…($event)"` | `el.addEventListener("tc-review", …)` |
| `tc-supersede` | No | `el.addEventListener("tc-supersede", (e) => …)` | `onSupersede={…}` | `@tc-supersede="…"` | `(tc-supersede)="…($event)"` | `el.addEventListener("tc-supersede", …)` |
| `tc-dismiss` | No | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `states` itself unless a listener calls `preventDefault()` on `tc-states-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-correction-propagation id="correction-propagation"></tc-correction-propagation>

<script type="module">
  import "@adamstavely/trenchcoat/correction-propagation";

  const el = document.querySelector("#correction-propagation");
  el.addEventListener("tc-states-change", (e) => {
    e.preventDefault(); // the element keeps its states…
    if (allowed(e.detail.states)) el.states = e.detail.states; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/correction-propagation";
import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";

const props = defineProps<{ initial: TcCorrectionPropagation["states"] }>();
const states = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStatesChange = (e: CustomEvent<{ states: TcCorrectionPropagation["states"] }>) => {
  e.preventDefault();
  states.value = e.detail.states;
};
</script>

<template>
  <tc-correction-propagation :states="states" @tc-states-change="onStatesChange"></tc-correction-propagation>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CorrectionPropagation } from "@adamstavely/trenchcoat/angular/correction-propagation";
import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";

@Component({
  selector: "app-controlled-correction-propagation",
  imports: [CorrectionPropagation],
  template: `<tc-correction-propagation [states]="states()" (tc-states-change)="onStatesChange($event)"></tc-correction-propagation>`,
})
export class ControlledCorrectionPropagation {
  readonly initial = input.required<TcCorrectionPropagation["states"]>();
  readonly states = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStatesChange(e: CustomEvent<{ states: TcCorrectionPropagation["states"] }>) {
    e.preventDefault();
    this.states.set(e.detail.states);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/correction-propagation";
  import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";

  let { initial }: { initial: TcCorrectionPropagation["states"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let states = $derived(initial);
  let el: TcCorrectionPropagation;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      states = (e as CustomEvent<{ states: TcCorrectionPropagation["states"] }>).detail.states;
    };
    el.addEventListener("tc-states-change", on);
    return () => el.removeEventListener("tc-states-change", on);
  });
</script>

<tc-correction-propagation bind:this={el} {states}></tc-correction-propagation>
```

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-correction-propagation")` returns a `TcCorrectionPropagation` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";`
- **React / Next.js:** Props: `import type { CorrectionPropagationProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CorrectionPropagation>`. The element class, for refs: `import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCorrectionPropagation["candidates"]` with `import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";`
- **Angular:** The directive types the template: `[candidates]` takes `TcCorrectionPropagation["candidates"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCorrectionPropagation } from "@adamstavely/trenchcoat/correction-propagation";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the component's name |
| `states` | `Record<string, CorrectionState>` | Each item's state by id. Controlled when defined; otherwise the component keeps it, starting at `defaultStates` |
| `defaultStates` | `Record<string, CorrectionState>` | The states when uncontrolled |
| `onStatesChange` | `(states: Record<string, CorrectionState>, id: string, state: CorrectionState) => void` | Called with the whole new map, the item that changed and its new state |
| `onReview` | `(id: string, candidate: CorrectionCandidate) => void` | Review was pressed – open the item for a person to check |
| `onSupersede` | `(id: string, candidate: CorrectionCandidate) => void` | Mark superseded was pressed |
| `onDismiss` | `(id: string, candidate: CorrectionCandidate) => void` | Dismiss was pressed – the item doesn't rely on the claim |

*Renamed or hidden on the wrapper: `heading`, `states`*

## Accessibility

### Keyboard

Every control is a native button, in reading order.

| Key | What it does |
|---|---|
| Tab / Shift + Tab | Moves through each item's Review, Mark superseded and Dismiss buttons (or Undo, once handled) |
| Enter / Space | Presses the focused button; focus then lands on the same item's next control – Undo after an action, Review after Undo |

### Screen readers

The component is a region named by its heading. The correction reads “Was: …” then “Now: …”. The progress is a
progressbar named “Handled”, with a value text like “2 of 6 handled”. The groups are sections headed “Released
packages · 2” and “Artifacts · 4”. Review and Mark superseded are described by the item's title; Dismiss is named
“Dismiss: Risk memo §2 – it doesn't rely on the claim”, and Undo “Undo: superseded – Risk memo §2”. A polite status
says what happened: “Marked superseded: Q3 vendor risk report. 3 still pending.”, “Back to pending: Risk memo §2.”

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.6 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **32.9 KB** | **9.4 KB** |
| With Lit – the first component on a page | 55.5 KB | 16.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 93 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of candidates replaced |
| First on the page | 8.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | candidates: first render, 2,592 nodes; update 1.0 ms |
| 1,000 items | 229 ms | candidates: first render, 25,542 nodes; update 8.2 ms |

1,000 items of candidates: 229 ms. It renders every item, so a first render passes 50 ms (a long task) at about 220 items – page or filter longer lists.

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

- Write `claim` and `correction` as full sentences, so the difference reads at a glance.
- Use `detail` for where the item cites the claim and who owns it: “Sent to the board · cites it in §4”.
- Put the citing passage in `quote` – people decide faster when they see the sentence in context.
- Keep `note` to what the component won't do; the default is “Nothing is changed automatically – each item waits for a person.”

## Do and don't

### Do

- Mark anything already released as `kind: "package"` with its `version` – it can only be superseded.
- Open the item for review in `tc-review` (`onReview`), and issue a superseding notice in `tc-supersede`.
- Keep `states` with the correction, so the next person sees what's already handled.

### Don't

- Don't rewrite citing documents in the background and use this as a log – the point is that a person decides.
- Don't list items that only mention the topic; list those that cite the corrected claim.
- Don't hide dismissed items – they show why nothing was done.

## Related

- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Agent Ledger](agent-ledger.md) – Everything an agent changed in your systems, each change with an undo – before and after per row, and pointing at Undo shows what builds on it: what would be undone too, and what can't be taken back
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
