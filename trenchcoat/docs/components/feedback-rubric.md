<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Feedback Rubric

**AI & chat** · New

Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals

- **Element:** `<tc-feedback-rubric>`
- **Size:** 19.3 KB gzip · 76.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/feedback-rubric";` |
| React / Next.js | `import { FeedbackRubric } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/feedback-rubric";` · tags starting with tc- are custom elements |
| Angular | `import { FeedbackRubric } from "@adamstavely/trenchcoat/angular/feedback-rubric";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/feedback-rubric";` |

## Example

The live example is in the gallery at `#/feedback-rubric`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A structured rating of one answer, for the people who review a model's work. Each rubric criterion – accuracy,
completeness, tone by default – gets a score on its own scale, the reviewer marks what kind of failure it was
(hallucination, missing context, wrong tone…), and can write the answer it should have been, starting from the
answer itself. “What gets sent” shows the payload as JSON, and Send fires it as one event once every required
criterion has a score. The result is data a team can train and evaluate on – which a thumbs-down isn't.

### When to use

- Review queues where people grade answers against a rubric.
- Turning a bad answer into an eval case: the scores, the failure type and the ideal answer in one go.
- Collecting corrections from experts, where the fixed answer matters more than the score.

### When not to use

- Quick feedback under every chat message – use [Message Actions](message-actions.md) and its thumbs.
- Picking one of a few options outside a rating – use [Segmented Control](segmented-control.md).
- Reading the results of many rated cases – use [Eval Scorecard](eval-scorecard.md).
- Suggesting edits to a draft for someone else to accept – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Answer** `.ui-fbr__answer` – the answer being rated, folded to three lines when long
2. **Criteria** `.ui-fbr__crits` – each criterion's name and question, and its scale
3. **Scale** `.ui-fbr__scale` – the levels as a segmented radio group, the picked word beside it
4. **Failure types** `.ui-fbr__chips` – toggles for what went wrong, any number of them
5. **Correction** `.ui-fbr__fix` – the ideal answer: a button that starts it from the answer, then the editor
6. **Foot** `.ui-fbr__foot` – “What gets sent” and Send; once sent, “Rating sent” and “Edit rating”

## Looks

Standard puts the heading and the scored count on a gray tray and the rubric on a white card inside it; the failure
types are gray chips. Clean is one white card with hairline dividers, uppercase section captions and outlined chips.
Narrow (under 480 px), each scale goes under its criterion and fills the width.

## Usage

### HTML

```html
<tc-feedback-rubric id="rubric"></tc-feedback-rubric>

<script type="module">
  import "@adamstavely/trenchcoat/feedback-rubric";
  import "@adamstavely/trenchcoat/tokens.css";

  const rubric = document.querySelector("#rubric");
  rubric.answer = "You can return it to any store for a full refund and a $15 voucher.";
  rubric.meta = { messageId: "msg_8812_3", model: "claude-sonnet" };
  rubric.addEventListener("tc-submit", (e) => fetch("/ratings", { method: "POST", body: JSON.stringify(e.detail) }));
</script>
```

### React / Next.js

```tsx
import { FeedbackRubric, type FeedbackRubricSubmit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReviewItem({ answer, onSave }: { answer: string; onSave: (rating: FeedbackRubricSubmit) => void }) {
  return (
    <FeedbackRubric
      answer={answer}
      criteria={[
        { id: "accuracy", label: "Accuracy", description: "Is everything it says true?" },
        { id: "grounded", label: "Grounded", description: "Does it stick to the sources?", optional: true },
      ]}
      onSubmit={onSave}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/feedback-rubric";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";

defineProps<{ criteria: TcFeedbackRubric["criteria"]; levels: TcFeedbackRubric["levels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-feedback-rubric :criteria="criteria" :levels="levels" @tc-value-change="onValueChange"></tc-feedback-rubric>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FeedbackRubric } from "@adamstavely/trenchcoat/angular/feedback-rubric";
import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";

@Component({
  selector: "app-feedback-rubric-example",
  imports: [FeedbackRubric],
  template: `<tc-feedback-rubric [criteria]="criteria()" [levels]="levels()" (tc-value-change)="onValueChange($event)"></tc-feedback-rubric>`,
})
export class FeedbackRubricExample {
  readonly criteria = input.required<TcFeedbackRubric["criteria"]>();
  readonly levels = input.required<TcFeedbackRubric["levels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/feedback-rubric";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";

  let { criteria, levels }: { criteria: TcFeedbackRubric["criteria"]; levels: TcFeedbackRubric["levels"] } = $props();
  let el: TcFeedbackRubric;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-feedback-rubric bind:this={el} {criteria} {levels}></tc-feedback-rubric>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Rate this answer"` | The heading |
| `answer` | `answer` | `string` | `""` | The answer being rated – quoted at the top, and where the correction starts from |
| `criteria` | – | `RubricCriterion[]` | `[ { id: "accuracy", label: "Accuracy", description: "Is everything it says true?" }, { id: "completeness", label: "Completeness", description: "Does it cover what was asked?" }, { id: "tone", label: "Tone", description: "Does it sound right for the reader?" }, ]` | The criteria, each scored on its own scale |
| `levels` | – | `RubricLevel[]` | `[ { value: 1, label: "Poor" }, { value: 2, label: "Weak" }, { value: 3, label: "Fair" }, { value: 4, label: "Good" }, { value: 5, label: "Excellent" }, ]` | The default scale for criteria without their own `levels` |
| `failureTypes` | – | `FeedbackFailureType[]` | `[ { value: "hallucination", label: "Hallucination", description: "States something that isn't true or isn't in the sources" }, { value: "missing-context", label: "Missing context", description: "Didn't use something it was given or should have known" }, { value: "wrong-tone", label: "Wrong tone", description: "Too formal, too casual, or wrong for the reader" }, { value: "incomplete", label: "Incomplete", description: "Left part of the question unanswered" }, { value: "outdated", label: "Out of date", description: "Relies on something that is no longer true" }, { value: "formatting", label: "Formatting", description: "Hard to read: structure, length or layout" }, { value: "unsafe", label: "Unsafe", description: "Breaks a policy or could cause harm" }, ]` | The kinds of failure a person can pick, any number of them |
| `value` | – | `FeedbackRating` | `{ scores: {}, failures: [], correction: null }` | The rating. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `meta` | – | `Record<string, unknown> \| undefined` | `undefined` | Sent along with the rating in tc-submit – ids and versions that tie it to the answer |
| `sent` | `sent` | `boolean` | `false` | The rating was sent: the controls lock and "Edit rating" unlocks them. Set by Send; the app may set it too |
| `sending` | `sending` | `boolean` | `false` | Shows Send as busy while the app saves the rating |
| `submitLabel` | `submit-label` | `string` | `"Send rating"` | The label on the send button |
| `payload` | – | `FeedbackRubricSubmit` | – | The payload Send fires with tc-submit – the rating, the answer and `meta` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A score, a failure type or the correction changed ({ value }: FeedbackRubricValueChange); cancelable |
| `tc-submit` | – | Yes | Send was pressed with every required criterion scored (FeedbackRubricSubmit); cancelable – prevent it to stay editable |
| `tc-edit` | – | No | "Edit rating" unlocked a sent rating; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-feedback-rubric-scale-w` | `196px` | both |

#### Design tokens it reads (80)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `criteria` | `el.criteria = …;` | `<… criteria={…} />` | `<tc-feedback-rubric :criteria="…">` | `<tc-feedback-rubric [criteria]="…">` | `<tc-feedback-rubric {criteria}>` |
| `levels` | `el.levels = …;` | `<… levels={…} />` | `<tc-feedback-rubric :levels="…">` | `<tc-feedback-rubric [levels]="…">` | `<tc-feedback-rubric {levels}>` |
| `failureTypes` | `el.failureTypes = …;` | `<… failureTypes={…} />` | `<tc-feedback-rubric :failureTypes="…">` | `<tc-feedback-rubric [failureTypes]="…">` | `<tc-feedback-rubric {failureTypes}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-feedback-rubric :value="…">` | `<tc-feedback-rubric [value]="…">` | `<tc-feedback-rubric {value}>` |
| `meta` | `el.meta = …;` | `<… meta={…} />` | `<tc-feedback-rubric :meta="…">` | `<tc-feedback-rubric [meta]="…">` | `<tc-feedback-rubric {meta}>` |

*Also attributes: `heading`, `answer`, `sent`, `sending`, `submit-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-submit` | Yes | `el.addEventListener("tc-submit", (e) => …)` | `onSubmit={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |
| `tc-edit` | No | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-feedback-rubric id="feedback-rubric"></tc-feedback-rubric>

<script type="module">
  import "@adamstavely/trenchcoat/feedback-rubric";

  const el = document.querySelector("#feedback-rubric");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
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
import "@adamstavely/trenchcoat/feedback-rubric";
import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";

const props = defineProps<{ initial: TcFeedbackRubric["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcFeedbackRubric["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-feedback-rubric :value="value" @tc-value-change="onValueChange"></tc-feedback-rubric>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FeedbackRubric } from "@adamstavely/trenchcoat/angular/feedback-rubric";
import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";

@Component({
  selector: "app-controlled-feedback-rubric",
  imports: [FeedbackRubric],
  template: `<tc-feedback-rubric [value]="value()" (tc-value-change)="onValueChange($event)"></tc-feedback-rubric>`,
})
export class ControlledFeedbackRubric {
  readonly initial = input.required<TcFeedbackRubric["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcFeedbackRubric["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/feedback-rubric";
  import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";

  let { initial }: { initial: TcFeedbackRubric["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcFeedbackRubric;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcFeedbackRubric["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-feedback-rubric bind:this={el} {value}></tc-feedback-rubric>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-feedback-rubric :value="value" @tc-value-change="value = $event.detail.value"></tc-feedback-rubric>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-feedback-rubric [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-feedback-rubric>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-feedback-rubric bind:this={el} {value}></tc-feedback-rubric>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-feedback-rubric")` returns a `TcFeedbackRubric` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";`
- **React / Next.js:** Props: `import type { FeedbackRubricProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FeedbackRubric>`. The element class, for refs: `import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFeedbackRubric["criteria"]` with `import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";`
- **Angular:** The directive types the template: `[criteria]` takes `TcFeedbackRubric["criteria"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFeedbackRubric } from "@adamstavely/trenchcoat/feedback-rubric";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Rate this answer" |
| `value` | `FeedbackRating` | The rating. Controlled when defined; otherwise the component keeps it, starting from `defaultValue` |
| `defaultValue` | `FeedbackRating` | The rating at first when `value` isn't controlled |
| `onChange` | `(value: FeedbackRating) => void` | Called with the new rating after every score, failure type or correction edit, controlled or not |
| `onSubmit` | `(rating: FeedbackRubricSubmit) => void \| boolean` | Called when Send is pressed with every required criterion scored – the rating, the answer and `meta`. Return false to keep the rubric editable |
| `onEdit` | `() => void` | Called when "Edit rating" unlocks a sent rating – set `sent` back to false if you control it |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `onChange`, `onSubmit`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Show all (when the answer folds), each scale (one stop each), the failure types, the correction, “What gets sent” and Send |
| → / ↓ | In a scale, picks the next level, wrapping round; with nothing picked, picks the first |
| ← / ↑ | In a scale, picks the previous level, wrapping round; with nothing picked, picks the last |
| Home / End | In a scale, picks the first or last level |
| Enter / Space | Picks a level, toggles a failure type, or presses the focused button |

### Screen readers

The card is a `group` named by the heading. Each scale is a `radiogroup` named by its criterion and described by its
question, with `aria-required` unless the criterion is optional; each level is a `radio` named with its number and
word (“4, Good”) and `aria-checked`. When Send finds a criterion without a score, its group gets `aria-invalid` and is
described by “Pick a score”, focus moves to it, and a status region says “Score 2 more criteria before sending”. The
failure types are a `group` named “What went wrong” of toggle buttons with `aria-pressed`. The correction is a
textarea labelled “The ideal answer” and described by its change count (“3 changes to the answer”). “What gets sent”
is a disclosure button with `aria-expanded`; the JSON it shows is focusable and named “What gets sent, as JSON”. Send
has `aria-busy` while the app saves, and the status region says “Rating sent” when it's done.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, inline-diff | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.2 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **76.9 KB** | **19.4 KB** |
| With Lit – the first component on a page | 97.4 KB | 26.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 92 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of failureTypes replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.8 ms | failureTypes: first render, 185 nodes; update 0.2 ms |
| 1,000 items | 7.0 ms | failureTypes: first render, 1,085 nodes; update 1.0 ms |

1,000 items of failureTypes: 7.0 ms, 1,085 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (inline-diff).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Phrase each criterion's `description` as the question a reviewer answers: “Is everything it says true?”.
- Give every level a word, so a score reads the same to everyone – “4, Good”, not a bare 4.
- Keep failure types to the kinds your team acts on differently; put the explanation in `description`, which shows as
  the tooltip.
- Use `meta` for what ties the rating to its answer – the message id, the model, the prompt version – not for text
  people should read.

## Do and don't

### Do

- Mark criteria that don't always apply `optional`, so reviewers aren't forced to guess.
- Set `sending` while you save, and prevent `tc-submit` (or return false from `onSubmit`) if the save can fail.
- Keep the rubric the same across reviewers and over time – changing the scale breaks comparisons.

### Don't

- Don't ask for more than four or five criteria at once – reviewers start scoring by feel.
- Don't seed the correction with an ideal answer of your own; it starts from the answer being rated.
- Don't hide “What gets sent” – reviewers trust a rating more when they can see what leaves the page.

## Related

- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
