<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Reflection Gate

**Trust & calibration** · New

A moment to think before relying on AI – state the task and what's at stake, say what you believe, restate the answer, or name what you'll verify

- **Element:** `<tc-reflection-gate>`
- **Size:** 12.5 KB gzip · 44.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/reflection-gate";` |
| React / Next.js | `import { ReflectionGate } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/reflection-gate";` · tags starting with tc- are custom elements |
| Angular | `import { ReflectionGate } from "@adamstavely/trenchcoat/angular/reflection-gate";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/reflection-gate";` |

## Example

The live example is in the gallery at `#/reflection-gate`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A short pause that makes a person think before relying on an AI answer. It asks one of four things, set by `mode`:
**intent** – the task, the decision it supports and what it costs if the answer is wrong, said before asking;
**prior** – what the person expects and what would change their mind, noted while the answer is still hidden;
**reformulate** – the answer restated in their own words, then compared with it, the answer's key terms missing from
theirs marked; **checkpoint** – one claim they'll verify, and how. What they write is submitted through a cancelable
event, so the product can keep it, check it, or hold the gate open. Skip appears only where the product allows it.

Under a deadline, `brief` gives the short version: each mode asks one combined question in a single line (“What's
this for, and what if it's wrong?”), marked “Short version” beside the heading and in the line under it. It is still
a pause – the field is required – and what's written is still submitted, with `brief: true`, so the record shows
which version was used. Reformulate skips its comparison step; prior still hides the answer until the line is in.

### When to use

- Before an answer feeds a decision that is costly to get wrong – a contract, a diagnosis, a payment.
- Where people tend to accept answers without reading them closely, and you want a record that they did.
- Collecting someone's expectation before showing the answer, so you can see later whether it changed their mind.
- Asking for one concrete check before an answer is exported or shared.
- Under real time pressure – a filing, a hearing, a release tonight – with `brief`, where a short pause that people
  complete beats a full one they skip.

### When not to use

- Asking the person for details before the agent starts – use [Clarifying Questions](clarifying-questions.md).
- Reviewing every claim of an answer one by one – use [Verification Queue](verification-queue.md).
- The person's own running notes on what they've concluded – use [Synthesis Notes](synthesis-notes.md).
- A long multi-step form – use [Stepper Form](stepper-form.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-rg__bar` – the heading and what the pause is for
2. **Card** `.ui-rg__card` – the prompt: the fields, or what was noted once submitted
3. **Field** `.ui-rg__field` – a label, the text field and the message after a Submit that didn't pass
4. **Choices** `.ui-rg__choices` – a radio group: cards with a hint, a segmented row, or the claims to pick from
5. **Buttons** `.ui-rg__foot` – Skip (when allowed) or “Edit mine”, and Continue or Compare

## Looks

Standard puts the heading on a gray tray and the prompt on a white card inside it, with Skip as a quiet text
button. Clean is one white card: the buttons sit under a hairline, Skip is a secondary button, and the choice cards
use hairline shadows instead of borders. The short version's tag is the same warning-toned pill in both. Both stack the choice cards and the comparison when the gate is narrow.

## Usage

### HTML

```html
<tc-reflection-gate id="gate" mode="prior" allow-skip></tc-reflection-gate>

<script type="module">
  import "@adamstavely/trenchcoat/reflection-gate";
  import "@adamstavely/trenchcoat/tokens.css";

  const gate = document.querySelector("#gate");
  gate.answer = "Either side can end the agreement with 30 days' written notice.";
  gate.addEventListener("tc-submit", (e) => saveReflection(e.detail.mode, e.detail.value, e.detail.brief === true));

  // Under a deadline: the short, single-field version
  gate.brief = true;
</script>
```

### React / Next.js

```tsx
import { ReflectionGate, type ReflectionGateSubmission } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const claims = [
  { id: "notice", text: "Either side can end the agreement with 30 days' notice" },
  { id: "refund", text: "Prepaid months are refunded" },
];

export function VerifyFirst({ answer, deadline, onNoted }: { answer: string; deadline: boolean; onNoted: (s: ReflectionGateSubmission) => void }) {
  return <ReflectionGate mode="checkpoint" brief={deadline} answer={answer} claims={claims} onSubmit={onNoted} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/reflection-gate";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";

defineProps<{ value: TcReflectionGate["value"]; claims: TcReflectionGate["claims"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-reflection-gate :value="value" :claims="claims" @tc-value-change="onValueChange"></tc-reflection-gate>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ReflectionGate } from "@adamstavely/trenchcoat/angular/reflection-gate";
import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";

@Component({
  selector: "app-reflection-gate-example",
  imports: [ReflectionGate],
  template: `<tc-reflection-gate [value]="value()" [claims]="claims()" (tc-value-change)="onValueChange($event)"></tc-reflection-gate>`,
})
export class ReflectionGateExample {
  readonly value = input.required<TcReflectionGate["value"]>();
  readonly claims = input.required<TcReflectionGate["claims"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/reflection-gate";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";

  let { value, claims }: { value: TcReflectionGate["value"]; claims: TcReflectionGate["claims"] } = $props();
  let el: TcReflectionGate;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-reflection-gate bind:this={el} {value} {claims}></tc-reflection-gate>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `mode` | `mode` | `ReflectionMode` | `"intent"` | Which prompt to show: intent, prior, reformulate or checkpoint |
| `phase` | `phase` | `ReflectionPhase` | `"open"` | Where the gate is: open, compare (reformulate's second step), done or skipped – set it to restore one |
| `value` | – | `ReflectionGateValue` | `{}` | What the person wrote or picked, by field |
| `answer` | `answer` | `string` | `""` | The answer – hidden in prior mode until the prior is in, shown to restate in reformulate mode |
| `claims` | – | `ReflectionClaim[]` | `[]` | The claims to pick from in checkpoint mode; without them the person types the claim |
| `allowSkip` | `allow-skip` | `boolean` | `false` | Shows Skip – only where your product lets people go on without reflecting |
| `minWords` | `min-words` | `number` | `5` | The fewest words a restatement may have |
| `heading` | `heading` | `string` | `""` | The heading – defaults to the mode's |
| `description` | `description` | `string` | `""` | The line under the heading – defaults to the mode's |
| `brief` | `brief` | `boolean` | `false` | The short version for deadline situations: one combined field per mode, marked as the short version, still recorded |
| `labels` | – | `Partial<ReflectionGateLabels>` | `{}` | Any of the gate's texts, to change the wording or the language |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The person edited a field; detail `{ value }`: ReflectionGateValueChange. Cancelable. |
| `tc-submit` | – | Yes | The mode's fields passed their checks; detail `{ mode, value }`: ReflectionGateSubmission. Cancelable: preventDefault() keeps the gate open. |
| `tc-skip` | – | Yes | Skip was pressed (only with `allow-skip`); detail `{ mode }`: ReflectionGateSkip. Cancelable. |
| `tc-phase-change` | – | Yes | The gate moves on – to compare, done, skipped, or back to open; detail `{ phase }`: ReflectionGatePhaseChange. Cancelable. |

#### Design tokens it reads (123)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `missingTerms(answer: string, restatement: string): string[]` | The answer's key terms that a restatement doesn't mention: numbers, amounts and dates, and longer words that aren't filler – lower-cased, once each, in the answer's order. |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-reflection-gate :value="…">` | `<tc-reflection-gate [value]="…">` | `<tc-reflection-gate {value}>` |
| `claims` | `el.claims = …;` | `<… claims={…} />` | `<tc-reflection-gate :claims="…">` | `<tc-reflection-gate [claims]="…">` | `<tc-reflection-gate {claims}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-reflection-gate :labels="…">` | `<tc-reflection-gate [labels]="…">` | `<tc-reflection-gate {labels}>` |

*Also attributes: `mode`, `phase`, `answer`, `allow-skip`, `min-words`, `heading`, `description`, `brief` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-submit` | Yes | `el.addEventListener("tc-submit", (e) => …)` | `onSubmit={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |
| `tc-skip` | Yes | `el.addEventListener("tc-skip", (e) => …)` | `onSkip={…}` | `@tc-skip="…"` | `(tc-skip)="…($event)"` | `el.addEventListener("tc-skip", …)` |
| `tc-phase-change` | Yes | `el.addEventListener("tc-phase-change", (e) => …)` | `onPhaseChange={…}` | `@tc-phase-change="…"` | `(tc-phase-change)="…($event)"` | `el.addEventListener("tc-phase-change", …)` |

### Controlled

The element changes `phase` and `value` itself unless a listener calls `preventDefault()` on `tc-phase-change` or `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-reflection-gate id="reflection-gate"></tc-reflection-gate>

<script type="module">
  import "@adamstavely/trenchcoat/reflection-gate";

  const el = document.querySelector("#reflection-gate");
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
import { ReflectionGate } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ReflectionGate>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledReflectionGate({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ReflectionGate {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/reflection-gate";
import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";

const props = defineProps<{ initial: TcReflectionGate["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcReflectionGate["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-reflection-gate :value="value" @tc-value-change="onValueChange"></tc-reflection-gate>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ReflectionGate } from "@adamstavely/trenchcoat/angular/reflection-gate";
import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";

@Component({
  selector: "app-controlled-reflection-gate",
  imports: [ReflectionGate],
  template: `<tc-reflection-gate [value]="value()" (tc-value-change)="onValueChange($event)"></tc-reflection-gate>`,
})
export class ControlledReflectionGate {
  readonly initial = input.required<TcReflectionGate["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcReflectionGate["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/reflection-gate";
  import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";

  let { initial }: { initial: TcReflectionGate["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcReflectionGate;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcReflectionGate["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-reflection-gate bind:this={el} {value}></tc-reflection-gate>
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
<tc-reflection-gate :value="value" @tc-value-change="value = $event.detail.value"></tc-reflection-gate>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-reflection-gate [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-reflection-gate>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-reflection-gate bind:this={el} {value}></tc-reflection-gate>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-reflection-gate")` returns a `TcReflectionGate` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";`
- **React / Next.js:** Props: `import type { ReflectionGateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ReflectionGate>`. The element class, for refs: `import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcReflectionGate["value"]` with `import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";`
- **Angular:** The directive types the template: `[value]` takes `TcReflectionGate["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcReflectionGate } from "@adamstavely/trenchcoat/reflection-gate";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `mode` | `ReflectionMode` | Which prompt to show: intent, prior, reformulate or checkpoint |
| `value` | `ReflectionGateValue` | What the person wrote or picked (controlled). Leave it undefined to let the gate keep it, starting at `defaultValue` |
| `defaultValue` | `ReflectionGateValue` | What the fields hold at first when uncontrolled |
| `onChange` | `(value: ReflectionGateValue) => void` | Called with every edit, controlled or not |
| `phase` | `ReflectionPhase` | Where the gate is (controlled): open, compare, done or skipped. Leave it undefined to let the gate move on its own |
| `defaultPhase` | `ReflectionPhase` | The phase at first when uncontrolled – e.g. "done" for a reflection already on record |
| `onPhaseChange` | `(phase: ReflectionPhase) => void` | Called whenever the gate moves on, controlled or not |
| `onSubmit` | `(submission: ReflectionGateSubmission) => boolean \| void` | Called with the mode's fields once they pass their checks; return false to keep the gate open |
| `onSkip` | `(mode: ReflectionMode) => boolean \| void` | Shows Skip and is called when it's pressed; return false to keep the gate open. Leave it out where skipping isn't allowed |
| `title` | `string` | The heading – defaults to the mode's |

*Renamed or hidden on the wrapper: `mode`, `value`, `defaultValue`, `phase`, `heading`, `allowSkip`, `onChange`, `onSubmit`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the fields, each radio group (one stop, on the picked option) and the buttons |
| → / ↓ | In a radio group, picks the next option, wrapping round |
| ← / ↑ | In a radio group, picks the previous option, wrapping round |
| Home / End | In a radio group, picks the first or last option |
| Space | On a radio group with nothing picked, picks the first option; on an option, picks it |
| Enter | In a one-line field (including the short version's), submits; on a button, presses it |
| ⌘ Enter / Ctrl Enter | In a text area, submits (Enter alone starts a new line) |

### Screen readers

The prompt is a `form` named by the heading and described by the line under it. Every text field has its label;
required ones are `aria-required`, and after a Submit that didn't pass they are `aria-invalid` and described by their
message (“Fill this in to continue”, “Pick one to continue”, “Write at least 5 words”). Choices are `radiogroup`s
named by their label, with `aria-checked` options. A polite `status` region says the first problem, the comparison
(“4 terms from the answer aren't in yours”), “Noted” (“Noted. The answer is shown.” in prior mode) or “Skipped –
nothing noted”. In prior mode the answer isn't in the page at all until the prior is in, so nothing reads it out
early. After Submit or Skip, focus moves to the result line; after Edit, to the first field. Terms the restatement
missed are `<mark>` elements.

In the short version the form's name includes “Short version”, the one field is labelled with its question and is
`aria-required`, and the status region says “Noted – short version”.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.5 KB | 10.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **44.1 KB** | **12.5 KB** |
| With Lit – the first component on a page | 64.7 KB | 19.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 40 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of claims replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.8 ms | claims: first render, 40 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | claims: first render, 40 nodes; update 0.0 ms |

What it renders doesn't grow with claims (tested to 1,000 items).

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

- Keep the defaults' voice: questions the person can answer in a line (“What decision will it support?”), not
  instructions about thinking.
- Pass claims for checkpoint mode in the answer's own words, short enough to read at a glance.
- Change any text through `labels` – for another language, or your product's words for “decision” or “claim”.
- Keep the short version's questions to one line each; change them through `labels` (`briefIntent`,
  `briefPrior`, `briefReformulate`, `briefCheckpoint`) and keep `briefTag` plain – “Short version”.
- Say what happens with the answers somewhere near the gate (“Kept with this session”) – people write more
  honestly when they know who sees it.

## Do and don't

### Do

- Match the mode to the moment: intent before asking, prior before showing, reformulate or checkpoint after.
- Keep what's submitted with the session, so the reflection is part of the record.
- Use `allow-skip` (or `onSkip`) for low-stakes uses, and leave it off where the check is policy.
- Turn on `brief` from the session's own deadline setting, and store `brief: true` with the submission so later
  review can tell the short version apart.

### Don't

- Don't show the gate on every answer – people learn to click through a pause they always see.
- Don't grade the restatement automatically; the marked terms are a prompt to reread, not a score.
- Don't put the answer next to a prior-mode gate yourself – it defeats the point of noting the prior first.
- Don't use `brief` to make the pause go away – it's for deadlines, not for people who find the full one slow.

## Related

- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Synthesis Notes](synthesis-notes.md) – Your own conclusions, assumptions and open questions, kept apart from the model's output and exported with where they came from
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
