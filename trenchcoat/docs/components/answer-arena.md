<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Answer Arena

**AI & chat** · New

Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason

- **Element:** `<tc-answer-arena>`
- **Size:** 9.4 KB gzip · 32.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/answer-arena";` |
| React / Next.js | `import { AnswerArena } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/answer-arena";` · tags starting with tc- are custom elements |
| Angular | `import { AnswerArena } from "@adamstavely/trenchcoat/angular/answer-arena";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/answer-arena";` |

## Example

The live example is in the gallery at `#/answer-arena`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Two models answer the same prompt side by side, streaming together. Once both are done, people vote – A is better,
B is better, or a tie – and then pick a reason. In blind mode the model names stay hidden as “Model A” and “Model B”
until the vote, so people judge the answers, not the brands. It collects preferences for evaluating models, prompts
or settings without leaving the product.

### When to use

- Collecting people's preferences between two models, two prompts or two settings on real tasks.
- Blind comparisons, where knowing the model would bias the vote.
- Showing two answers to the same question when the difference is the point.

### When not to use

- Comparing two whole runs – steps, cost and time, not only the final text – use [Run Compare](run-compare.md).
- A single answer with its sources – use [Cited Answer](cited-answer.md).
- Letting people choose which model to use from now on – use [Model Picker](model-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Answer** `.ui-arena__pane` – one side's answer, streaming with a caret, and a meta line once done
3. **Model** `.ui-arena__head` – the side's glyph and name – “Model A” in blind mode until the vote
4. **Vote** `.ui-arena__votes` – A is better, Tie, B is better
5. **Reasons** `.ui-arena__reasons` – why, offered once there's a vote

## Looks

Standard sets the prompt, then the two answers as white cards, then the vote, all on a gray tray. Clean is one white
card split by hairlines: the prompt as the header row on top, the answers side by side, the vote as the
last row. Both stack the answers in containers narrower than 560 px.

## Usage

### HTML

```html
<tc-answer-arena id="arena" prompt="Explain RAG to a product manager in under 80 words." blind></tc-answer-arena>

<script type="module">
  import "@adamstavely/trenchcoat/answer-arena";
  import "@adamstavely/trenchcoat/tokens.css";

  const arena = document.querySelector("#arena");
  arena.answers = [
    { model: "Atlas", answer: "**RAG** lets the model look things up before it answers.", meta: "1.8s · 212 tokens" },
    { model: "Nova", answer: "Think of it as an open-book exam.", meta: "2.1s · 188 tokens" },
  ];
  arena.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AnswerArena, type ArenaVote } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Compare({ a, b, streaming }: { a: string; b: string; streaming: boolean }) {
  const [vote, setVote] = useState<ArenaVote | null>(null);
  return (
    <AnswerArena
      prompt="Explain RAG to a product manager in under 80 words."
      blind
      answers={[
        { model: "Atlas", answer: a, streaming },
        { model: "Nova", answer: b, streaming },
      ]}
      value={vote}
      onChange={setVote}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/answer-arena";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";

defineProps<{ answers: TcAnswerArena["answers"]; value: TcAnswerArena["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-answer-arena :answers="answers" :value="value" @tc-value-change="onValueChange"></tc-answer-arena>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AnswerArena } from "@adamstavely/trenchcoat/angular/answer-arena";
import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";

@Component({
  selector: "app-answer-arena-example",
  imports: [AnswerArena],
  template: `<tc-answer-arena [answers]="answers()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-answer-arena>`,
})
export class AnswerArenaExample {
  readonly answers = input.required<TcAnswerArena["answers"]>();
  readonly value = input.required<TcAnswerArena["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/answer-arena";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";

  let { answers, value }: { answers: TcAnswerArena["answers"]; value: TcAnswerArena["value"] } = $props();
  let el: TcAnswerArena;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-answer-arena bind:this={el} {answers} {value}></tc-answer-arena>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `prompt` | `prompt` | `string` | `""` | The prompt both models answered |
| `answers` | – | `ArenaAnswer[]` | `[]` | The two answers: A first, then B |
| `value` | – | `ArenaVote \| null` | `null` | The vote (null: none yet). Changed by the element unless a tc-value-change listener calls preventDefault() |
| `blind` | `blind` | `boolean` | `false` | Hide the model names until there's a vote |
| `question` | `question` | `string` | `"Which answer is better?"` | The question over the vote |
| `reasons` | – | `array` | `["More accurate", "Easier to follow", "More complete", "Better tone"]` | Reasons offered after A or B wins |
| `tieReasons` | – | `array` | `["Both good", "Both wrong", "Too close to call"]` | Reasons offered after a tie |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The vote changed (`{ value: ArenaVote \| null }`); cancelable – prevent it to keep `value` (controlled use) |

#### Design tokens it reads (82)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-weight`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `answers` | `el.answers = …;` | `<… answers={…} />` | `<tc-answer-arena :answers="…">` | `<tc-answer-arena [answers]="…">` | `<tc-answer-arena {answers}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-answer-arena :value="…">` | `<tc-answer-arena [value]="…">` | `<tc-answer-arena {value}>` |
| `reasons` | `el.reasons = …;` | `<… reasons={…} />` | `<tc-answer-arena :reasons="…">` | `<tc-answer-arena [reasons]="…">` | `<tc-answer-arena {reasons}>` |
| `tieReasons` | `el.tieReasons = …;` | `<… tieReasons={…} />` | `<tc-answer-arena :tieReasons="…">` | `<tc-answer-arena [tieReasons]="…">` | `<tc-answer-arena {tieReasons}>` |

*Also attributes: `prompt`, `blind`, `question` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-answer-arena id="answer-arena"></tc-answer-arena>

<script type="module">
  import "@adamstavely/trenchcoat/answer-arena";

  const el = document.querySelector("#answer-arena");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AnswerArena } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AnswerArena>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledAnswerArena({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <AnswerArena {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/answer-arena";
import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";

const props = defineProps<{ initial: TcAnswerArena["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcAnswerArena["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-answer-arena :value="value" @tc-value-change="onValueChange"></tc-answer-arena>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AnswerArena } from "@adamstavely/trenchcoat/angular/answer-arena";
import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";

@Component({
  selector: "app-controlled-answer-arena",
  imports: [AnswerArena],
  template: `<tc-answer-arena [value]="value()" (tc-value-change)="onValueChange($event)"></tc-answer-arena>`,
})
export class ControlledAnswerArena {
  readonly initial = input.required<TcAnswerArena["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcAnswerArena["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/answer-arena";
  import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";

  let { initial }: { initial: TcAnswerArena["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcAnswerArena;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcAnswerArena["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-answer-arena bind:this={el} {value}></tc-answer-arena>
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

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-answer-arena :value="value" @tc-value-change="value = $event.detail.value"></tc-answer-arena>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-answer-arena [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-answer-arena>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-answer-arena bind:this={el} {value}></tc-answer-arena>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-answer-arena")` returns a `TcAnswerArena` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";`
- **React / Next.js:** Props: `import type { AnswerArenaProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AnswerArena>`. The element class, for refs: `import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAnswerArena["answers"]` with `import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";`
- **Angular:** The directive types the template: `[answers]` takes `TcAnswerArena["answers"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAnswerArena } from "@adamstavely/trenchcoat/answer-arena";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `answers` | `ArenaAnswer[]` | The two answers: A first, then B |
| `value` | `ArenaVote \| null` | The vote – controlled when defined (null: none yet) |
| `defaultValue` | `ArenaVote \| null` | The vote at first when uncontrolled – null by default |
| `onChange` | `(vote: ArenaVote \| null) => void` | Every change of the vote: a side or a tie, then a reason |

*Renamed or hidden on the wrapper: `answers`, `value`, `defaultValue`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the vote once – to the chosen button, else A is better – and on to the reasons |
| ← / → | Moves between A is better, Tie and B is better, wrapping at the ends |
| Home / End | Moves to the first or last vote button |
| Enter / Space | Votes; on a reason, picks it or takes it back |

The vote buttons stay `aria-disabled` until both answers are done.

### Screen readers

Each answer is a section named “Answer A” or “Answer B”, `aria-busy` while it streams – the words aren't read out as
they arrive. A status region says “Both answers are in.” once streaming ends, then the vote: “You voted: A is
better.” – in blind mode followed by the names (“A was Atlas, B was Nova.”) – and “Reason: More accurate.” The vote
buttons are a toolbar named by the question, each `aria-pressed`; the reasons are a group named “Why?” of
`aria-pressed` buttons. The winning side is marked “Preferred”.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.2 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **32.0 KB** | **9.4 KB** |
| With Lit – the first component on a page | 52.2 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 37 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of reasons replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.1 ms | reasons: first render, 37 nodes; update 0.2 ms |
| 1,000 items | 1.8 ms | reasons: first render, 37 nodes; update 0.1 ms |

What it renders doesn't grow with reasons (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Show the prompt as people wrote it; don't summarise it.
- Keep `question` neutral – “Which answer is better?” – rather than leading.
- Offer three to five `reasons`, each a short quality: “More accurate”, “Easier to follow”. Ties get their own `tieReasons`.
- Use `meta` for facts people may weigh, e.g. “1.8s · 212 tokens” – leave it out in blind tests where it would give a model away.

## Do and don't

### Do

- Use `blind` whenever the vote feeds an evaluation.
- Stream both answers at once, so neither side gets a head start.
- Store the reason with the vote – it says more than the winner alone.

### Don't

- Don't compare more than two answers here.
- Don't let people vote before both answers are complete – the component holds the vote until then.
- Don't format answers with HTML – they're plain text with paragraphs, `- ` lists and `**bold**`.

## Related

- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price

## Changelog

- `tc-answer-arena` – two models' answers streamed side by side, then A / B / tie with a reason; blind mode reveals the names after the vote. `tc-value-change` (cancelable).
