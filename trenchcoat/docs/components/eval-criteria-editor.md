<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Eval Criteria Editor

**Agents** · New

What an LLM judge asks about each answer – criteria as questions answered pass or fail, on a scale with words at its ends, or with a label, weights shown as each one's share of the score, worked examples, problems in words beside the field, reorder from the keyboard, the assembled judge prompt to copy, and Try on sample

- **Element:** `<tc-eval-criteria-editor>`
- **Size:** 11.6 KB gzip · 39.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/eval-criteria-editor";` |
| React / Next.js | `import { EvalCriteriaEditor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/eval-criteria-editor";` · tags starting with tc- are custom elements |
| Angular | `import { EvalCriteriaEditor } from "@adamstavely/trenchcoat/angular/eval-criteria-editor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/eval-criteria-editor";` |

## Example

The live example is in the gallery at `#/eval-criteria-editor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a team writes down what an LLM judge should ask about each answer. Each criterion is a question with its kind
of answer – pass or fail, a whole number on a scale with words at its ends, or one of a few labels – a weight, and
optionally worked examples the judge can learn from. Weights show as each criterion's share of the overall score, so
"3" reads as "50%".

Criteria fold to one row each – number, name, kind and share – and open to edit in place. Problems are said in words
beside the field: no name, no question, two criteria with one name, a scale the wrong way round, a label kind with
fewer than two labels. "Judge prompt" shows the prompt the criteria assemble into, read-only with Copy, and "Try on
sample" hands the criteria to the page once nothing is wrong.

### When to use

- Setting up an automated judge for an agent's evals.
- Reviewing and changing a judge's rubric with the team, where the prompt itself should stay visible.
- Keeping human review and the judge on the same criteria.

### When not to use

- Rating one answer against a rubric – use [Feedback Rubric](feedback-rubric.md).
- Reading how versions scored – use [Eval Scorecard](eval-scorecard.md).
- Writing the agent's own instructions – use [Instruction Editor](instruction-editor.md).
- Grading outputs by hand, one after another – use [Review Queue](review-queue.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-ece__row` – the disclosure with the number, name, kind and any problems, the share, and Move up, Move down and Remove
2. **Share** `.ui-ece__share` – the criterion's share of the score as a bar and a percentage
3. **Body** `.ui-ece__body` – the open criterion's name, weight, question, answer kind and examples
4. **Kind fields** `.ui-ece__scale` – a scale's ends and their words; a label kind has a comma-separated field instead
5. **Examples** `.ui-ece__examples` – worked examples: an answer, its verdict and why
6. **Bar** `.ui-ece__bar` – Add criterion, the Judge prompt disclosure, and Try on sample
7. **Prompt** `.ui-ece__prompt` – the assembled judge prompt with Copy

## Looks

Standard puts the heading and the count on a gray tray with the criteria on a white card. Clean is one white card with
hairline dividers and uppercase captions. A criterion with problems after Try gets a red edge, and its problems are
said in words. Below 520 px the kind and the share bar leave the row, and the fields stack.

## Usage

### HTML

```html
<tc-eval-criteria-editor id="judge"></tc-eval-criteria-editor>

<script type="module">
  import "@adamstavely/trenchcoat/eval-criteria-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const judge = document.querySelector("#judge");
  judge.criteria = [
    { id: "correct", name: "Correct", question: "Is the policy stated correctly?", type: "pass-fail", weight: 3 },
    { id: "helpful", name: "Helpful", question: "How well does it answer?", type: "scale", scale: { min: 1, max: 5, anchors: { 1: "Not at all", 5: "Fully" } }, weight: 2 },
  ];
  judge.addEventListener("tc-try", (e) => console.log(e.detail.prompt));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EvalCriteriaEditor, type JudgeCriterion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function JudgeSetup({ initial, run }: { initial: JudgeCriterion[]; run: (prompt: string) => void }) {
  const [criteria, setCriteria] = useState(initial);
  return <EvalCriteriaEditor criteria={criteria} onCriteriaChange={setCriteria} onTry={(_, prompt) => run(prompt)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/eval-criteria-editor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";

defineProps<{ criteria: TcEvalCriteriaEditor["criteria"]; open: TcEvalCriteriaEditor["open"] }>();
const onCriteriaChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-eval-criteria-editor :criteria="criteria" :open="open" @tc-criteria-change="onCriteriaChange"></tc-eval-criteria-editor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EvalCriteriaEditor } from "@adamstavely/trenchcoat/angular/eval-criteria-editor";
import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";

@Component({
  selector: "app-eval-criteria-editor-example",
  imports: [EvalCriteriaEditor],
  template: `<tc-eval-criteria-editor [criteria]="criteria()" [open]="open()" (tc-criteria-change)="onCriteriaChange($event)"></tc-eval-criteria-editor>`,
})
export class EvalCriteriaEditorExample {
  readonly criteria = input.required<TcEvalCriteriaEditor["criteria"]>();
  readonly open = input.required<TcEvalCriteriaEditor["open"]>();
  onCriteriaChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/eval-criteria-editor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";

  let { criteria, open }: { criteria: TcEvalCriteriaEditor["criteria"]; open: TcEvalCriteriaEditor["open"] } = $props();
  let el: TcEvalCriteriaEditor;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-criteria-change", on);
    return () => el.removeEventListener("tc-criteria-change", on);
  });
</script>

<tc-eval-criteria-editor bind:this={el} {criteria} {open}></tc-eval-criteria-editor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Judge criteria"` | The heading |
| `criteria` | – | `JudgeCriterion[]` | `[]` | The criteria, in the order the judge asks them. Changed by the user unless a tc-criteria-change listener prevents it |
| `open` | – | `string[] \| undefined` | `undefined` | Ids of the criteria shown open; unset, the first is open |
| `hideTry` | `hide-try` | `boolean` | `false` | Hides "Try on sample" |
| `trying` | `trying` | `boolean` | `false` | Shows Try as busy while the page runs the judge |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-criteria-change` | – | Yes | A criterion was added, edited, moved or removed ({ criteria }: EvalCriteriaChange); cancelable |
| `tc-try` | – | No | "Try on sample" with nothing wrong ({ criteria, prompt }: EvalCriteriaTry) |
| `tc-prompt-copy` | – | Yes | The judge prompt was copied ({ prompt }); cancelable – prevented, nothing is copied |

#### Design tokens it reads (65)

`--tc-accent`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `criteriaProblems(criteria: JudgeCriterion[]): EvalCriteriaProblem[]` | Every problem in a set of criteria, in order, as words |
| `weightShares(criteria: JudgeCriterion[]): Record<string, number>` | Each criterion's share of the total weight, 0–100, rounded |
| `judgePrompt(criteria: JudgeCriterion[]): string` | The prompt the criteria assemble into – what the judge reads before each answer |

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
| `criteria` | `el.criteria = …;` | `<… criteria={…} />` | `<tc-eval-criteria-editor :criteria="…">` | `<tc-eval-criteria-editor [criteria]="…">` | `<tc-eval-criteria-editor {criteria}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-eval-criteria-editor :open="…">` | `<tc-eval-criteria-editor [open]="…">` | `<tc-eval-criteria-editor {open}>` |

*Also attributes: `heading`, `hide-try`, `trying` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-criteria-change` | Yes | `el.addEventListener("tc-criteria-change", (e) => …)` | `ref.current.addEventListener("tc-criteria-change", …)` | `@tc-criteria-change="…"` | `(tc-criteria-change)="…($event)"` | `el.addEventListener("tc-criteria-change", …)` |
| `tc-try` | No | `el.addEventListener("tc-try", (e) => …)` | `onTry={…}` | `@tc-try="…"` | `(tc-try)="…($event)"` | `el.addEventListener("tc-try", …)` |
| `tc-prompt-copy` | Yes | `el.addEventListener("tc-prompt-copy", (e) => …)` | `onPromptCopy={…}` | `@tc-prompt-copy="…"` | `(tc-prompt-copy)="…($event)"` | `el.addEventListener("tc-prompt-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `criteria` itself unless a listener calls `preventDefault()` on `tc-criteria-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-eval-criteria-editor id="eval-criteria-editor"></tc-eval-criteria-editor>

<script type="module">
  import "@adamstavely/trenchcoat/eval-criteria-editor";

  const el = document.querySelector("#eval-criteria-editor");
  el.addEventListener("tc-criteria-change", (e) => {
    e.preventDefault(); // the element keeps its criteria…
    if (allowed(e.detail.criteria)) el.criteria = e.detail.criteria; // …until the app sets it
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
import "@adamstavely/trenchcoat/eval-criteria-editor";
import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";

const props = defineProps<{ initial: TcEvalCriteriaEditor["criteria"] }>();
const criteria = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCriteriaChange = (e: CustomEvent<{ criteria: TcEvalCriteriaEditor["criteria"] }>) => {
  e.preventDefault();
  criteria.value = e.detail.criteria;
};
</script>

<template>
  <tc-eval-criteria-editor :criteria="criteria" @tc-criteria-change="onCriteriaChange"></tc-eval-criteria-editor>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EvalCriteriaEditor } from "@adamstavely/trenchcoat/angular/eval-criteria-editor";
import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";

@Component({
  selector: "app-controlled-eval-criteria-editor",
  imports: [EvalCriteriaEditor],
  template: `<tc-eval-criteria-editor [criteria]="criteria()" (tc-criteria-change)="onCriteriaChange($event)"></tc-eval-criteria-editor>`,
})
export class ControlledEvalCriteriaEditor {
  readonly initial = input.required<TcEvalCriteriaEditor["criteria"]>();
  readonly criteria = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCriteriaChange(e: CustomEvent<{ criteria: TcEvalCriteriaEditor["criteria"] }>) {
    e.preventDefault();
    this.criteria.set(e.detail.criteria);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/eval-criteria-editor";
  import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";

  let { initial }: { initial: TcEvalCriteriaEditor["criteria"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let criteria = $derived(initial);
  let el: TcEvalCriteriaEditor;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      criteria = (e as CustomEvent<{ criteria: TcEvalCriteriaEditor["criteria"] }>).detail.criteria;
    };
    el.addEventListener("tc-criteria-change", on);
    return () => el.removeEventListener("tc-criteria-change", on);
  });
</script>

<tc-eval-criteria-editor bind:this={el} {criteria}></tc-eval-criteria-editor>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-eval-criteria-editor")` returns a `TcEvalCriteriaEditor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";`
- **React / Next.js:** Props: `import type { EvalCriteriaEditorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EvalCriteriaEditor>`. The element class, for refs: `import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEvalCriteriaEditor["criteria"]` with `import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";`
- **Angular:** The directive types the template: `[criteria]` takes `TcEvalCriteriaEditor["criteria"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEvalCriteriaEditor } from "@adamstavely/trenchcoat/eval-criteria-editor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Judge criteria" |
| `criteria` | `JudgeCriterion[]` | The criteria. Controlled when defined; otherwise kept by the component from `defaultCriteria` |
| `defaultCriteria` | `JudgeCriterion[]` | On mount, when `criteria` isn't controlled |
| `onCriteriaChange` | `(criteria: JudgeCriterion[]) => void` | Called with the next `criteria` |
| `onTry` | `(criteria: JudgeCriterion[], prompt: string) => void` | Called by "Try on sample" when nothing is wrong, with the assembled prompt |
| `onPromptCopy` | `(prompt: string) => void \| boolean` | Called when the judge prompt is copied. Return false to stop the copy |

*Renamed or hidden on the wrapper: `heading`, `criteria`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each row, its Move and Remove buttons, the open criterion's fields, Add criterion, Judge prompt and Try |
| Enter / Space | On a row, opens or closes it; on a button, presses it |
| Alt + ↑ / Alt + ↓ | On a row, moves the criterion up or down; focus stays on it |
| ← → | In the answer kinds, picks the next or previous one |

### Screen readers

Each row is a disclosure button with `aria-expanded`, described by "Alt plus up or down arrow moves it"; the open body
is a `group` named by the row. Every field has a visible label; a problem sets `aria-invalid` and is linked with
`aria-describedby`. The answer kind is a group of native radios with the legend "Answer". The share reads "50% of the
score". The Move and Remove buttons name the criterion they act on. A status region says what changed: "Moved Tone to
position 1 of 3", "Removed Helpful", "Criterion 4 added", "2 problems to fix before trying". The prompt is a focusable,
labelled block that scrolls.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 30.7 KB | 8.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **39.3 KB** | **11.6 KB** |
| With Lit – the first component on a page | 61.7 KB | 18.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 235 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of criteria replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 19 ms | criteria: first render, 6,642 nodes; update 3.6 ms |
| 1,000 items | 183 ms | criteria: first render, 66,042 nodes; update 33 ms |

1,000 items of criteria: 183 ms. It renders every item, so a first render passes 50 ms (a long task) at about 270 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each question as the judge should read it: "Does the answer state the policy correctly, with the right figures?".
- Name criteria with one word where you can – the name becomes the key in the judge's JSON reply.
- Put words on a scale's ends ("Not at all", "Fully") so the judge and people read the numbers the same way.
- Add an example for the cases the judge gets wrong, with why in a short clause.

## Do and don't

### Do

- Show the judge prompt to reviewers – they should know exactly what the judge is asked.
- Keep the criteria in the order people think about them; the judge asks them in that order.
- Re-run the judge on a sample after every change, with "Try on sample".

### Don't

- Don't use weights to hide a criterion – remove it instead.
- Don't ask two questions in one criterion; split them.
- Don't change criteria in the middle of a comparison between versions.

## Related

- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Instruction Editor](instruction-editor.md) – System and developer instructions with variable chips, missing and unused warnings, an app-supplied token count, versions and a word diff
- [Review Queue](review-queue.md) – Grade real outputs one at a time from the keyboard – the input, output and reference, pass or fail and 1–5 grades per criterion, a note and a suggested verdict, P / F / 1–5 / Enter / J / K / S / U shortcuts with a list on ?, progress with skipped ones counted, and Undo
