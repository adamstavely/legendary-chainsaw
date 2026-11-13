<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Judge Sampling

**AI configuration** · New

How much of an agent's traffic an LLM judge reads, and what it costs – a stepped rate per segment, rules that always include a chat, the judge model, and live estimates of chats judged a day, the monthly cost and what the sample can see, with a budget cap that warns

- **Element:** `<tc-judge-sampling>`
- **Size:** 8.6 KB gzip · 28.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/judge-sampling";` |
| React / Next.js | `import { JudgeSampling } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/judge-sampling";` · tags starting with tc- are custom elements |
| Angular | `import { JudgeSampling } from "@adamstavely/trenchcoat/angular/judge-sampling";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/judge-sampling";` |

## Example

The live example is in the gallery at `#/judge-sampling`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How much of an agent's live traffic an LLM judge reads, and what that costs. Each traffic segment – a website widget,
team chat, email – has a sampling rate on a stepped slider from 0.1% to 100%, with how many chats a day that judges.
Rules that always include a chat whatever the rate – a thumbs-down, an escalation, a new prompt version – are
switches. The judge model is a select showing its price per chat. Under them sit live estimates: chats judged a day,
the monthly cost, and what the sample can see, in words – "Enough to see a 0.2 drop within a day". A monthly budget
cap turns the cost amber and warns in words when the estimate goes over it.

The estimates come from `judgeEstimate()`, exported for the page: always-included chats are counted only where the
sample didn't already catch them, and the drop a sample can see is about 2.8 × the scores' spread ÷ √chats judged
(80% power at 5% significance, against a well-known baseline).

### When to use

- Setting how much production traffic an LLM judge scores.
- Trading cost against how quickly a quality drop shows up.
- Reviewing judge spend against a budget.

### When not to use

- A hard spend limit on one agent run – use [Budget Guard](budget-guard.md).
- The judge model's own parameters – use [Model Settings](model-settings.md).
- What to do when scores drop – use [Quality Alerts](quality-alerts.md).
- Scores across test cases and versions – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Segment** `.ui-jsm__seg` – a traffic segment: its name, rate and chats judged a day
2. **Range** `.ui-jsm__range` – the stepped rate slider, 0.1% to 100%
3. **Rule** `.ui-jsm__rule` – an always-include rule with its switch
4. **Select** `.ui-jsm__select` – the judge model, with its price per chat
5. **Number** `.ui-jsm__number` – the monthly budget cap
6. **Estimates** `.ui-jsm__estimates` – judged a day, a month's cost, and what it can see
7. **Warning** `.ui-jsm__warning` – over the budget, by how much, and what to change

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. A page can resize the slider with `--tc-jsm-thumb` and `--tc-jsm-track-h`.

## Usage

### HTML

```html
<tc-judge-sampling id="sampling" heading="Judge sampling" currency="USD"></tc-judge-sampling>

<script type="module">
  import "@adamstavely/trenchcoat/judge-sampling";
  import "@adamstavely/trenchcoat/tokens.css";

  const sampling = document.querySelector("#sampling");
  sampling.segments = [{ id: "intranet", label: "Intranet widget", chatsPerDay: 8400 }];
  sampling.includeRules = [{ id: "thumbs", label: "Thumbs-down", description: "Every chat someone rated badly", chatsPerDay: 120 }];
  sampling.models = [{ id: "small", label: "Small judge", costPerChat: 0.0015 }];
  sampling.value = { rates: { intranet: 0.05 }, include: { thumbs: true }, model: "small", budget: 100 };
  sampling.addEventListener("tc-value-change", (e) => console.log(e.detail.field, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { JudgeSampling, type JudgeSamplingValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const segments = [{ id: "intranet", label: "Intranet widget", chatsPerDay: 8400 }];
const models = [{ id: "small", label: "Small judge", costPerChat: 0.0015 }];

export function Sampling() {
  const [value, setValue] = useState<JudgeSamplingValue>({ rates: { intranet: 0.05 }, include: {}, model: "small", budget: 100 });
  return <JudgeSampling title="Judge sampling" segments={segments} models={models} value={value} onValueChange={(next) => setValue(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/judge-sampling";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";

defineProps<{ segments: TcJudgeSampling["segments"]; includeRules: TcJudgeSampling["includeRules"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-judge-sampling :segments="segments" :includeRules="includeRules" @tc-value-change="onValueChange"></tc-judge-sampling>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { JudgeSampling } from "@adamstavely/trenchcoat/angular/judge-sampling";
import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";

@Component({
  selector: "app-judge-sampling-example",
  imports: [JudgeSampling],
  template: `<tc-judge-sampling [segments]="segments()" [includeRules]="includeRules()" (tc-value-change)="onValueChange($event)"></tc-judge-sampling>`,
})
export class JudgeSamplingExample {
  readonly segments = input.required<TcJudgeSampling["segments"]>();
  readonly includeRules = input.required<TcJudgeSampling["includeRules"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/judge-sampling";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";

  let { segments, includeRules }: { segments: TcJudgeSampling["segments"]; includeRules: TcJudgeSampling["includeRules"] } = $props();
  let el: TcJudgeSampling;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-judge-sampling bind:this={el} {segments} {includeRules}></tc-judge-sampling>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Judge sampling"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `segments` | – | `JudgeSegment[]` | `[]` | The traffic segments, each with its chats a day |
| `includeRules` | – | `JudgeIncludeRule[]` | `[]` | Rules that always include a chat, whatever the rate |
| `models` | – | `JudgeModel[]` | `[]` | The judge models to choose from, with a price per chat |
| `value` | – | `JudgeSamplingValue` | `{ rates: {}, include: {}, model: "" }` | The settings. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `currency` | `currency` | `string` | `"USD"` | The currency for prices and the budget, e.g. "USD" |
| `scoreSd` | `score-sd` | `number` | `1` | How spread out the judge's scores are (their standard deviation), for what the sample can see |
| `detect` | `detect` | `number` | `0.2` | The drop in the average score worth seeing, e.g. 0.2 on a 1–5 scale |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A rate, rule, model or the budget changed ({ value, field }: JudgeSamplingChange); cancelable – prevented, `value` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-jsm-number-w` | `12ch` | both |
| `--tc-jsm-thumb` | `16px` | both |
| `--tc-jsm-track-h` | `4px` | both |

#### Design tokens it reads (61)

`--tc-accent-solid`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `JUDGE_RATES: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1]` | The slider's stops, from 0.1% to 100% – roughly even steps on a log scale |
| `judgeRateStop(rate: number): void` | The stop nearest a rate |
| `judgeEstimate(value: JudgeSamplingValue, options: { segments: JudgeSegment[]; includeRules?: JudgeIncludeRule[]; models: JudgeModel[]; scoreSd?: number; detect?: number }): JudgeEstimate` | The estimates for a value. The sample's power to see a drop: with judge scores spread by `scoreSd`, n judged chats see a drop in the average of about 2.8 × sd / √n (80% power, 5% significance, against a well-known baseline). |

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
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-judge-sampling :segments="…">` | `<tc-judge-sampling [segments]="…">` | `<tc-judge-sampling {segments}>` |
| `includeRules` | `el.includeRules = …;` | `<… includeRules={…} />` | `<tc-judge-sampling :includeRules="…">` | `<tc-judge-sampling [includeRules]="…">` | `<tc-judge-sampling {includeRules}>` |
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-judge-sampling :models="…">` | `<tc-judge-sampling [models]="…">` | `<tc-judge-sampling {models}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-judge-sampling :value="…">` | `<tc-judge-sampling [value]="…">` | `<tc-judge-sampling {value}>` |

*Also attributes: `heading`, `description`, `currency`, `score-sd`, `detect`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-judge-sampling id="judge-sampling"></tc-judge-sampling>

<script type="module">
  import "@adamstavely/trenchcoat/judge-sampling";

  const el = document.querySelector("#judge-sampling");
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
import { JudgeSampling } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof JudgeSampling>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledJudgeSampling({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <JudgeSampling {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/judge-sampling";
import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";

const props = defineProps<{ initial: TcJudgeSampling["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcJudgeSampling["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-judge-sampling :value="value" @tc-value-change="onValueChange"></tc-judge-sampling>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { JudgeSampling } from "@adamstavely/trenchcoat/angular/judge-sampling";
import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";

@Component({
  selector: "app-controlled-judge-sampling",
  imports: [JudgeSampling],
  template: `<tc-judge-sampling [value]="value()" (tc-value-change)="onValueChange($event)"></tc-judge-sampling>`,
})
export class ControlledJudgeSampling {
  readonly initial = input.required<TcJudgeSampling["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcJudgeSampling["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/judge-sampling";
  import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";

  let { initial }: { initial: TcJudgeSampling["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcJudgeSampling;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcJudgeSampling["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-judge-sampling bind:this={el} {value}></tc-judge-sampling>
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
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-judge-sampling :value="value" @tc-value-change="value = $event.detail.value"></tc-judge-sampling>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-judge-sampling [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-judge-sampling>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-judge-sampling bind:this={el} {value}></tc-judge-sampling>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-judge-sampling")` returns a `TcJudgeSampling` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";`
- **React / Next.js:** Props: `import type { JudgeSamplingProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof JudgeSampling>`. The element class, for refs: `import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcJudgeSampling["segments"]` with `import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";`
- **Angular:** The directive types the template: `[segments]` takes `TcJudgeSampling["segments"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcJudgeSampling } from "@adamstavely/trenchcoat/judge-sampling";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `value` | `JudgeSamplingValue` | The settings – controlled when given |
| `defaultValue` | `JudgeSamplingValue` | The settings on mount when `value` isn't controlled |
| `onValueChange` | `(value: JudgeSamplingValue, field: string) => void` | A rate, rule, model or the budget changed – with the whole value and the field, e.g. "rates.web" |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `children`*

## Accessibility

### Keyboard

Every control is native, in reading order.

| Key | What it does |
|---|---|
| ← / → on a slider | Moves to the previous or next rate |
| Home / End on a slider | 0.1% or 100% |
| Space on a switch | Turns the rule on or off |
| ↑ / ↓ in the model select | Changes the judge |

### Screen readers

Each slider is labelled by its segment and says its value in words, "5%, about 420 chats a day", and is described by
the segment's traffic. Each rule is a switch labelled by its name and described by what it catches. The estimates are
a description list. Going over the budget, or back under it, is announced once in a polite status message, and the
warning is text, not only colour.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.7 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.1 KB** | **8.6 KB** |
| With Lit – the first component on a page | 48.9 KB | 15.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 79 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of segments replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.1 ms | segments: first render, 661 nodes; update 4.5 ms |
| 1,000 items | 86 ms | segments: first render, 6,061 nodes; update 42 ms |

1,000 items of segments: 86 ms. It renders every item, so a first render passes 50 ms (a long task) at about 580 items – page or filter longer lists.

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

- Name segments the way the team knows them: "Intranet widget", "Team chat".
- Describe each rule by what it catches: "Every chat someone rated badly".
- Set `scoreSd` and `detect` to the judge's own scale – a 0.2 drop matters on 1–5, not on 0–100.
- Give models' prices in the page's `currency`.

## Do and don't

### Do

- Always include the chats people complained about; they're the cheapest signal there is.
- Raise the rate for a while after a prompt change, then lower it.
- Set a budget, so the cost of a high rate is visible before it's spent.

### Don't

- Don't sample every chat by default; most of the signal comes from a few percent.
- Don't treat the estimates as exact – traffic varies by day.
- Don't hide the confidence line; a cheap sample that can't see a drop isn't saving anything.

## Related

- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
- [Quality Alerts](quality-alerts.md) – Alert rules that read as sentences – "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats", each slot a labelled field, with an on/off switch, when it last fired, how often it would have fired in the last 30 days, and problems in words
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
