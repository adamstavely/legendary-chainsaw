<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Review Queue

**Agents** · New

Grade real outputs one at a time from the keyboard – the input, output and reference, pass or fail and 1–5 grades per criterion, a note and a suggested verdict, P / F / 1–5 / Enter / J / K / S / U shortcuts with a list on ?, progress with skipped ones counted, and Undo

- **Element:** `<tc-review-queue>`
- **Size:** 12.2 KB gzip · 41.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/review-queue";` |
| React / Next.js | `import { ReviewQueue } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/review-queue";` · tags starting with tc- are custom elements |
| Angular | `import { ReviewQueue } from "@adamstavely/trenchcoat/angular/review-queue";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/review-queue";` |

## Example

The live example is in the gallery at `#/review-queue`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A queue for grading real outputs one at a time, fast, from the keyboard. Each item shows what the model was asked,
what it answered and – when there is one – the answer it should have given. Under it are quick grades: pass or fail
for some criteria, a number on a scale for others. There's a note, and an overall verdict that's suggested from the
grades and can be changed. Submit, and the next ungraded item comes up.

Progress reads "12 of 40 · 3 skipped" with a bar. Skipped items wait at the end, Undo takes back the last submit, and
when everything is done a summary offers to go back to the skipped ones.

### When to use

- Grading samples of live traffic against a fixed set of criteria.
- Building or checking an eval set by hand, where reviewers get through hundreds of items.
- Calibrating reviewers, when everyone grades the same queue.

### When not to use

- Rating one answer in depth, with failure types and a corrected answer – use [Feedback Rubric](feedback-rubric.md).
- Checking the claims inside one document – use [Verification Queue](verification-queue.md).
- Reading pass rates across versions – use [Eval Scorecard](eval-scorecard.md).
- Defining what a judge model asks – use [Eval Criteria Editor](eval-criteria-editor.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Progress** `.ui-rvq__progress` – how many are graded and skipped, with a bar, in the header
2. **Item bar** `.ui-rvq__nav` – Previous, "Item 4 of 40", where the item came from, and Next
3. **Blocks** `.ui-rvq__blocks` – the input, the output and the reference side by side, stacked when narrow
4. **Criteria** `.ui-rvq__crits` – each criterion's name and question, and its grades as a segmented radio group
5. **Note and verdict** `.ui-rvq__bottom` – an optional note, and Pass or Fail, marked "suggested" until changed
6. **Foot** `.ui-rvq__foot` – Keys, Undo last, Skip and Submit
7. **Done** `.ui-rvq__done` – the summary when every item is graded or skipped
8. **Keys dialog** `.ui-rvq__dialog` – every shortcut, in a table

## Looks

Standard puts the heading and progress on a gray tray with the queue on a white card. Clean is one white card with
hairline dividers and uppercase captions. A picked Pass is green and a picked Fail red, each with a mark and the word.
Below 560 px wide, the blocks stack and each criterion's grades go under its name. Long inputs and outputs scroll
within `--tc-rvq-text-h` (180 px).

## Usage

### HTML

```html
<tc-review-queue id="queue"></tc-review-queue>

<script type="module">
  import "@adamstavely/trenchcoat/review-queue";
  import "@adamstavely/trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.items = [
    { id: "r1", input: "Do I need an itemised receipt for a €30 dinner?", output: "Yes – anything over €25 needs one.", reference: "Itemised above €25 (6.2)." },
    { id: "r2", input: "What's the hotel cap in Geneva?", output: "CHF 180 a night.", reference: "CHF 240 a night (table B)." },
  ];
  queue.addEventListener("tc-grade", (e) => console.log("Graded", e.detail.id, e.detail.verdict, e.detail.grades));
</script>
```

### React / Next.js

```tsx
import { ReviewQueue, type ReviewQueueGrade, type ReviewQueueItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function GradeSample({ items, save }: { items: ReviewQueueItem[]; save: (grade: ReviewQueueGrade) => void }) {
  return (
    <ReviewQueue
      items={items}
      criteria={[
        { id: "correct", label: "Correct", description: "Is everything it says true?" },
        { id: "helpful", label: "Helpful", description: "How well does it answer?", kind: "scale", min: 1, max: 5 },
      ]}
      onGrade={save}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/review-queue";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";

defineProps<{ items: TcReviewQueue["items"]; criteria: TcReviewQueue["criteria"] }>();
const onGrade = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-review-queue :items="items" :criteria="criteria" @tc-grade="onGrade"></tc-review-queue>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ReviewQueue } from "@adamstavely/trenchcoat/angular/review-queue";
import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";

@Component({
  selector: "app-review-queue-example",
  imports: [ReviewQueue],
  template: `<tc-review-queue [items]="items()" [criteria]="criteria()" (tc-grade)="onGrade($event)"></tc-review-queue>`,
})
export class ReviewQueueExample {
  readonly items = input.required<TcReviewQueue["items"]>();
  readonly criteria = input.required<TcReviewQueue["criteria"]>();
  onGrade(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/review-queue";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";

  let { items, criteria }: { items: TcReviewQueue["items"]; criteria: TcReviewQueue["criteria"] } = $props();
  let el: TcReviewQueue;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-grade", on);
    return () => el.removeEventListener("tc-grade", on);
  });
</script>

<tc-review-queue bind:this={el} {items} {criteria}></tc-review-queue>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Review queue"` | The heading |
| `items` | – | `ReviewQueueItem[]` | `[]` | The outputs to grade, in order |
| `criteria` | – | `ReviewQueueCriterion[]` | `[ { id: "correct", label: "Correct", description: "Is everything it says true?" }, { id: "grounded", label: "Grounded", description: "Does it stick to the policy text?" }, { id: "helpful", label: "Helpful", description: "How well does it answer what was asked?", kind: "scale", min: 1, max: 5 }, ]` | What each output is graded on |
| `index` | `index` | `number` | `0` | The item showing. Changed by the user unless a tc-index-change listener prevents it |
| `results` | – | `Record<string, ReviewQueueResult>` | `{}` | Where each item stands, by id. Changed by submits, skips and undo unless a tc-results-change listener prevents it |
| `noShortcuts` | `no-shortcuts` | `boolean` | `false` | Turns the single-key shortcuts off (buttons still work) |
| `current` | – | `ReviewQueueItem \| undefined` | – | The item showing |
| `counts` | – | `` | – | How many are graded and skipped |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-grade` | – | Yes | An item was submitted ({ id, grades, verdict, note }: ReviewQueueGrade); cancelable – prevented, it stays open |
| `tc-skip` | – | Yes | An item was skipped ({ id }); cancelable |
| `tc-undo` | – | Yes | The last submit was undone ({ id }); cancelable |
| `tc-index-change` | – | Yes | Another item came up ({ index, item }: ReviewQueueIndexChange); cancelable |
| `tc-results-change` | – | Yes | An item was graded, skipped or undone ({ results, id }: ReviewQueueResultsChange); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rvq-text-h` | `180px` | both |

#### Design tokens it reads (77)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-scrim`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `suggestVerdict(criteria: ReviewQueueCriterion[], grades: Record<string, ReviewQueueGradeValue>): ReviewQueueVerdict \| null` | The verdict the grades suggest: fail when any pass/fail criterion failed or a scale sits in its lower half |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-review-queue :items="…">` | `<tc-review-queue [items]="…">` | `<tc-review-queue {items}>` |
| `criteria` | `el.criteria = …;` | `<… criteria={…} />` | `<tc-review-queue :criteria="…">` | `<tc-review-queue [criteria]="…">` | `<tc-review-queue {criteria}>` |
| `results` | `el.results = …;` | `<… results={…} />` | `<tc-review-queue :results="…">` | `<tc-review-queue [results]="…">` | `<tc-review-queue {results}>` |

*Also attributes: `heading`, `index`, `no-shortcuts` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-grade` | Yes | `el.addEventListener("tc-grade", (e) => …)` | `onGrade={…}` | `@tc-grade="…"` | `(tc-grade)="…($event)"` | `el.addEventListener("tc-grade", …)` |
| `tc-skip` | Yes | `el.addEventListener("tc-skip", (e) => …)` | `onSkip={…}` | `@tc-skip="…"` | `(tc-skip)="…($event)"` | `el.addEventListener("tc-skip", …)` |
| `tc-undo` | Yes | `el.addEventListener("tc-undo", (e) => …)` | `onUndo={…}` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |
| `tc-index-change` | Yes | `el.addEventListener("tc-index-change", (e) => …)` | `onIndexChange={…}` | `@tc-index-change="…"` | `(tc-index-change)="…($event)"` | `el.addEventListener("tc-index-change", …)` |
| `tc-results-change` | Yes | `el.addEventListener("tc-results-change", (e) => …)` | `ref.current.addEventListener("tc-results-change", …)` | `@tc-results-change="…"` | `(tc-results-change)="…($event)"` | `el.addEventListener("tc-results-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `index` and `results` itself unless a listener calls `preventDefault()` on `tc-index-change` or `tc-results-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-review-queue id="review-queue"></tc-review-queue>

<script type="module">
  import "@adamstavely/trenchcoat/review-queue";

  const el = document.querySelector("#review-queue");
  el.addEventListener("tc-index-change", (e) => {
    e.preventDefault(); // the element keeps its index…
    if (allowed(e.detail.index)) el.index = e.detail.index; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ReviewQueue } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ReviewQueue>;
type Props = Omit<Own, "index" | "onIndexChange"> & { initial: NonNullable<Own["index"]> };

// Controlled: passing index makes the wrapper prevent the element's own change; the app sets it
export function ControlledReviewQueue({ initial, ...props }: Props) {
  const [index, setIndex] = useState<Own["index"]>(initial);
  return <ReviewQueue {...props} index={index} onIndexChange={(next) => setIndex(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/review-queue";
import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";

const props = defineProps<{ initial: TcReviewQueue["index"] }>();
const index = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onIndexChange = (e: CustomEvent<{ index: TcReviewQueue["index"] }>) => {
  e.preventDefault();
  index.value = e.detail.index;
};
</script>

<template>
  <tc-review-queue :index="index" @tc-index-change="onIndexChange"></tc-review-queue>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ReviewQueue } from "@adamstavely/trenchcoat/angular/review-queue";
import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";

@Component({
  selector: "app-controlled-review-queue",
  imports: [ReviewQueue],
  template: `<tc-review-queue [index]="index()" (tc-index-change)="onIndexChange($event)"></tc-review-queue>`,
})
export class ControlledReviewQueue {
  readonly initial = input.required<TcReviewQueue["index"]>();
  readonly index = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onIndexChange(e: CustomEvent<{ index: TcReviewQueue["index"] }>) {
    e.preventDefault();
    this.index.set(e.detail.index);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/review-queue";
  import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";

  let { initial }: { initial: TcReviewQueue["index"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let index = $derived(initial);
  let el: TcReviewQueue;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      index = (e as CustomEvent<{ index: TcReviewQueue["index"] }>).detail.index;
    };
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-review-queue bind:this={el} {index}></tc-review-queue>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-review-queue")` returns a `TcReviewQueue` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";`
- **React / Next.js:** Props: `import type { ReviewQueueProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ReviewQueue>`. The element class, for refs: `import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcReviewQueue["items"]` with `import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";`
- **Angular:** The directive types the template: `[items]` takes `TcReviewQueue["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcReviewQueue } from "@adamstavely/trenchcoat/review-queue";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Review queue" |
| `index` | `number` | The item showing. Controlled when defined |
| `defaultIndex` | `number` | On mount, when `index` isn't controlled |
| `onIndexChange` | `(index: number, item: ReviewQueueItem \| undefined) => void` | Called with the next `index` |
| `results` | `Record<string, ReviewQueueResult>` | Where each item stands, by id. Controlled when defined |
| `defaultResults` | `Record<string, ReviewQueueResult>` | On mount, when `results` isn't controlled |
| `onResultsChange` | `(results: Record<string, ReviewQueueResult>) => void` | Called with the next `results` |
| `onGrade` | `(grade: ReviewQueueGrade) => void \| boolean` | Called when an item is submitted. Return false to keep it open |
| `onSkip` | `(id: string) => void \| boolean` | Called when an item is skipped. Return false to stay on it |
| `onUndo` | `(id: string) => void \| boolean` | Called when the last submit is undone. Return false to keep it |

*Renamed or hidden on the wrapper: `heading`, `index`, `results`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

Single-key shortcuts work anywhere in the queue except while typing in the note, and never with Ctrl, ⌘ or Alt held.

| Key | What it does |
|---|---|
| P / F | Pass or fail the current criterion – the focused one, else the first without a grade – then move to the next |
| 1 – 5 | Score the current criterion when it's a scale |
| V, then P / F | Set the overall verdict |
| Enter | Submit and go to the next ungraded item (on a button other than a grade, presses that button) |
| J / K | Next or previous item |
| S | Skip the item |
| U | Undo the last submit and go back to it, grades and note restored |
| N | Go to the note; Escape leaves it, Ctrl/⌘ + Enter submits from it |
| ? | Show the keys |
| ← → ↑ ↓ / Home / End | In a criterion's grades, move and pick, wrapping round |

### Screen readers

The queue is a `group` named by the heading and described by a short list of the shortcuts. Progress is a
`progressbar` whose value text reads "12 of 40 · 3 skipped". The input, output and reference are regions named by
their labels. Each criterion is a `radiogroup` named by the criterion and described by its question, with
`aria-required`; when Submit finds it ungraded it gets `aria-invalid`, the description "Pick a grade", and focus. A
status region says each grade as it's set ("Correct: Pass"), "Submitted, failed. 13 of 40 graded", skips, undo and
moves between items. The keys open in a modal `dialog` named "Keyboard shortcuts" that returns focus when closed.

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
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 31.3 KB | 9.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **41.2 KB** | **12.2 KB** |
| With Lit – the first component on a page | 61.9 KB | 18.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 147 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.1 ms | items: first render, 147 nodes; update 0.1 ms |
| 1,000 items | 1.4 ms | items: first render, 147 nodes; update 0.2 ms |

What it renders doesn't grow with items (tested to 1,000 items).

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

- Phrase each criterion's `description` as the question a reviewer answers: "Does it stick to the policy text?".
- Use pass or fail where the answer is yes or no; keep scales for things with degrees, and to 1–5.
- Give items a `source` – the channel and date – so reviewers can spot patterns.
- Keep notes optional; ask for one in your guidelines when the verdict is Fail.

## Do and don't

### Do

- Save each grade when `tc-grade` fires, and prevent it if the save fails so the item stays open.
- Show the reference answer when you have one – it makes grading faster and more consistent.
- Keep the criteria the same for the whole queue.

### Don't

- Don't use more than four or five criteria – speed is the point.
- Don't hide the shortcuts; the Keys button and `?` are how people find them.
- Don't reorder items while someone is working through the queue.

## Related

- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Eval Criteria Editor](eval-criteria-editor.md) – What an LLM judge asks about each answer – criteria as questions answered pass or fail, on a scale with words at its ends, or with a label, weights shown as each one's share of the score, worked examples, problems in words beside the field, reorder from the keyboard, the assembled judge prompt to copy, and Try on sample
