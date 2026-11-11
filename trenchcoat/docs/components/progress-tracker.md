<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Progress Tracker

**Feedback & onboarding**

Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play

- **Element:** `<tc-progress-tracker>`
- **Size:** 9.1 KB gzip · 31.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/progress-tracker";` |
| React / Next.js | `import { ProgressTracker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/progress-tracker";` · tags starting with tc- are custom elements |
| Angular | `import { ProgressTracker } from "@adamstavely/trenchcoat/angular/progress-tracker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/progress-tracker";` |

## Example

The live example is in the gallery at `#/progress-tracker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An onboarding checklist with a progress bar above it. People see how far they've got (“2/6”), tick steps off as
they go, and get a little satisfaction from each one: the tick draws itself, the bar grows and a shine runs across
it. With `auto-play` it ticks the open steps one after another on its own – useful on a landing page or an empty
state – and stops as soon as someone interacts. Set `readonly` and it becomes a status list for work the product
does itself: steps can be done, `failed` or `pending`, and say so in words.

### When to use

- A short list of set-up tasks for a new account or workspace, where order doesn't matter much.
- Showing what's left to do on a home or empty screen, with people ticking steps off themselves.
- A product tour or landing page that shows the checklist filling up (`auto-play`).
- The stages of a job the product runs – an import, a publish – shown read only, with a stage that failed or is under
  way (`readonly`, `state`).

### When not to use

- Set-up tasks that each need instructions, a button and their own content – use [Setup Guide](setup-guide.md).
- Steps that must be done in order, each with a form – use [Stepper Form](stepper-form.md).
- Usage against a limit or a quota – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a checklist icon and the heading, what the checklist is for; it also names the bar
2. **Count** `.ui-progress__count` – done out of total, the number rolling when it changes
3. **Bar** `.ui-progress__bar` – the progress, with a shine each time it grows
4. **Step** `.ui-progress__step` – a check (a cross when failed, a turning ring when pending), the label, the state
5. **Pause / Play** `.ui-progress__play` – only with `auto-play`; stops and restarts it

## Looks

Standard puts the header on a gray tray above a white card with a thick dark bar and dark checks, with roomier
padding. Clean is a narrower white card with the header as its first row, hairline shadows and quieter gray type; the
bar is thin and blue and the checks blue. Both lines through done steps unless `done-style="plain"`; both are up to
360 px (Clean 340 px) wide, 560 px with `fit="wide"`, or as wide as their container with `fit="fill"`.

## Usage

### HTML

```html
<tc-progress-tracker id="setup" heading="Getting started"></tc-progress-tracker>

<script type="module">
  import "@adamstavely/trenchcoat/progress-tracker";
  import "@adamstavely/trenchcoat/tokens.css";

  const tracker = document.querySelector("#setup");
  tracker.steps = [
    { id: "account", label: "Create your account", done: true },
    { id: "slack", label: "Connect Slack" },
    { id: "invite", label: "Invite two teammates" },
  ];
  tracker.addEventListener("tc-done-change", (e) => console.log(e.detail.done));

  // A status list for a job the product runs
  const job = document.createElement("tc-progress-tracker");
  Object.assign(job, { heading: "Import", readonly: true, doneStyle: "plain", fit: "fill" });
  job.steps = [
    { id: "upload", label: "Upload the files", done: true },
    { id: "scan", label: "Scan for secrets", state: "failed" },
    { id: "index", label: "Build the index", state: "pending" },
  ];
  document.body.append(job);
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ProgressTracker, type ProgressStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const steps: ProgressStep[] = [
  { id: "account", label: "Create your account" },
  { id: "slack", label: "Connect Slack" },
  { id: "invite", label: "Invite two teammates" },
];

export function Onboarding() {
  const [done, setDone] = useState(["account"]);
  return <ProgressTracker title="Getting started" steps={steps} done={done} onDoneChange={setDone} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/progress-tracker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";

defineProps<{ steps: TcProgressTracker["steps"]; done: TcProgressTracker["done"] }>();
const onDoneChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-progress-tracker :steps="steps" :done="done" @tc-done-change="onDoneChange"></tc-progress-tracker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProgressTracker } from "@adamstavely/trenchcoat/angular/progress-tracker";
import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";

@Component({
  selector: "app-progress-tracker-example",
  imports: [ProgressTracker],
  template: `<tc-progress-tracker [steps]="steps()" [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-progress-tracker>`,
})
export class ProgressTrackerExample {
  readonly steps = input.required<TcProgressTracker["steps"]>();
  readonly done = input.required<TcProgressTracker["done"]>();
  onDoneChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/progress-tracker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";

  let { steps, done }: { steps: TcProgressTracker["steps"]; done: TcProgressTracker["done"] } = $props();
  let el: TcProgressTracker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-progress-tracker bind:this={el} {steps} {done}></tc-progress-tracker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Getting started"` | The heading, and the progress bar's name |
| `steps` | – | `ProgressStep[]` | `[]` | The checklist. Each step's `done` flag is where it starts; when the flags change, the tracker follows them |
| `done` | – | `string[] \| undefined` | `undefined` | Ids of the ticked steps; unset, the tracker keeps its own |
| `defaultDone` | – | `string[] \| undefined` | `undefined` | Ids ticked at first when `done` is unset – defaults to the steps marked `done` |
| `autoPlay` | `auto-play` | `boolean` | `false` | Ticks the open steps one after another, then starts over |
| `interval` | `interval` | `number` | `2200` | Pause between two automatic steps, in ms |
| `readonly` | `readonly` | `boolean` | `false` | A status list: every step shows its state as text, nothing can be ticked and auto play stays off |
| `doneStyle` | `done-style` | `ProgressDoneStyle` | `"strike"` | How done steps look: "strike" draws a line through them, "plain" only grays them |
| `fit` | `fit` | `ProgressFit` | `"compact"` | The card's width: "compact" (up to 360 px), "wide" (up to 560 px) or "fill" (no maximum) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-done-change` | – | Yes | A step was ticked or cleared (by a click or auto play); detail `{ done: string[], steps }` – the ticked ids and every step with its new `done` flag. Cancelable: preventDefault() leaves the ticks as they are (controlled use) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-progress-tracker-shine` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | standard, clean |

#### Design tokens it reads (63)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-control`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-in`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-progress-tracker :steps="…">` | `<tc-progress-tracker [steps]="…">` | `<tc-progress-tracker {steps}>` |
| `done` | `el.done = …;` | `<… done={…} />` | `<tc-progress-tracker :done="…">` | `<tc-progress-tracker [done]="…">` | `<tc-progress-tracker {done}>` |
| `defaultDone` | `el.defaultDone = …;` | `<… defaultDone={…} />` | `<tc-progress-tracker :defaultDone="…">` | `<tc-progress-tracker [defaultDone]="…">` | `<tc-progress-tracker {defaultDone}>` |

*Also attributes: `heading`, `auto-play`, `interval`, `readonly`, `done-style`, `fit` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-done-change` | Yes | `el.addEventListener("tc-done-change", (e) => …)` | `onDoneChange={…}` | `@tc-done-change="…"` | `(tc-done-change)="…($event)"` | `el.addEventListener("tc-done-change", …)` |

### Controlled

The element changes `done` itself unless a listener calls `preventDefault()` on `tc-done-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-progress-tracker id="progress-tracker"></tc-progress-tracker>

<script type="module">
  import "@adamstavely/trenchcoat/progress-tracker";

  const el = document.querySelector("#progress-tracker");
  el.addEventListener("tc-done-change", (e) => {
    e.preventDefault(); // the element keeps its done…
    if (allowed(e.detail.done)) el.done = e.detail.done; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ProgressTracker } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ProgressTracker>;
type Props = Omit<Own, "done" | "onDoneChange"> & { initial: NonNullable<Own["done"]> };

// Controlled: passing done makes the wrapper prevent the element's own change; the app sets it
export function ControlledProgressTracker({ initial, ...props }: Props) {
  const [done, setDone] = useState<Own["done"]>(initial);
  return <ProgressTracker {...props} done={done} onDoneChange={(next) => setDone(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/progress-tracker";
import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";

const props = defineProps<{ initial: TcProgressTracker["done"] }>();
const done = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDoneChange = (e: CustomEvent<{ done: TcProgressTracker["done"] }>) => {
  e.preventDefault();
  done.value = e.detail.done;
};
</script>

<template>
  <tc-progress-tracker :done="done" @tc-done-change="onDoneChange"></tc-progress-tracker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ProgressTracker } from "@adamstavely/trenchcoat/angular/progress-tracker";
import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";

@Component({
  selector: "app-controlled-progress-tracker",
  imports: [ProgressTracker],
  template: `<tc-progress-tracker [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-progress-tracker>`,
})
export class ControlledProgressTracker {
  readonly initial = input.required<TcProgressTracker["done"]>();
  readonly done = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDoneChange(e: CustomEvent<{ done: TcProgressTracker["done"] }>) {
    e.preventDefault();
    this.done.set(e.detail.done);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/progress-tracker";
  import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";

  let { initial }: { initial: TcProgressTracker["done"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let done = $derived(initial);
  let el: TcProgressTracker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      done = (e as CustomEvent<{ done: TcProgressTracker["done"] }>).detail.done;
    };
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-progress-tracker bind:this={el} {done}></tc-progress-tracker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-progress-tracker")` returns a `TcProgressTracker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";`
- **React / Next.js:** Props: `import type { ProgressTrackerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProgressTracker>`. The element class, for refs: `import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProgressTracker["steps"]` with `import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";`
- **Angular:** The directive types the template: `[steps]` takes `TcProgressTracker["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProgressTracker } from "@adamstavely/trenchcoat/progress-tracker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the progress bar's name |
| `steps` | `ProgressStep[]` | The checklist. Each step's `done` flag is where it starts; when the flags change, the tracker follows them |
| `done` | `string[]` | Ids of the ticked steps. Controlled when defined – pair it with `onDoneChange` |
| `defaultDone` | `string[]` | Ids ticked on mount when `done` isn't controlled – defaults to the steps marked `done` |
| `onDoneChange` | `(done: string[]) => void` | Called with the ticked ids whenever a step is ticked or cleared |
| `onChange` | `(steps: ProgressStep[]) => void` | Called with every step and its new `done` flag whenever a step is ticked or cleared |

*Renamed or hidden on the wrapper: `heading`, `steps`, `done`, `defaultDone`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Pause / Play (with `auto-play`), then each step |
| Space / Enter | On a step, ticks or clears it (not a `disabled` one); on Pause / Play, stops or restarts auto play |

Failed, pending and read-only steps aren't controls, so Tab passes them; a `disabled` step stays in the tab order.

Any key press or pointer press inside the tracker, other than on Pause / Play, stops auto play.

### Screen readers

The bar is a `progressbar` named by the heading, with `aria-valuetext` like “2 of 6 done”. Each step is a button
with `role="checkbox"` and `aria-checked`, named by its label; a `disabled` step has `aria-disabled="true"`. A failed or pending step, and every step of a
`readonly` tracker, is plain text in the list: its label, then its state – “Scan for secrets, Failed”, “Build the
index, In progress”, “Upload the files, done” (the last two words for screen readers only). Step icons are hidden. With auto play, the button is
named “Pause auto-play” while it runs and “Play auto-play” when stopped. The visible count is hidden, since the bar
says the same.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **31.2 KB** | **9.1 KB** |
| With Lit – the first component on a page | 52.2 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.1 ms** | the gallery demo's data, 77 DOM nodes – to layout, median of 7 |
| Typical update | **1.1 ms** | one item of steps replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | steps: first render, 923 nodes; update 2.3 ms |
| 1,000 items | 61 ms | steps: first render, 9,023 nodes; update 14 ms |

1,000 items of steps: 61 ms. It renders every item, so a first render passes 50 ms (a long task) at about 820 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (clean), 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Make the heading the goal: “Getting started”, “Set up your workspace”.
- Write each step as an action with an object: “Connect Slack”, “Invite two teammates”.
- Keep the list short – four to seven steps; a list that never ends doesn't motivate.
- Use the icon for the app a step belongs to, not for decoration.

## Do and don't

### Do

- Mark steps the product already knows are done with `done: true`, so people don't start from zero.
- Listen for `tc-done-change` and save the ticks, or control them with `done` and call `preventDefault()`.
- Keep `auto-play` for showcase screens; in a working product let people tick their own steps.
- Use `readonly` with `state` for progress the product makes: mark the stage under way `pending` and a stage that
  went wrong `failed`, and say what to do about it elsewhere on the screen.
- Use `done-style="plain"` when done steps are still worth reading, and `fit="fill"` in a wide column.

### Don't

- Don't tick steps people haven't done to make progress look better.
- Don't put links or buttons in step labels – the whole row is the checkbox.
- Don't mark a step `disabled` without saying, nearby, why it can't be ticked yet.
- Don't use it for a single task; a list of one is a button.

## Related

- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
