<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Step Inspector

**AI configuration** · New

One workflow step's settings – its title and each input with where it comes from, typed in or mapped from an earlier step's output as a chip ("Extract fields › amount"), what's missing in words, Test with sample, and the last run's input and output as JSON

- **Element:** `<tc-step-inspector>`
- **Size:** 19.4 KB gzip · 73.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/step-inspector";` |
| React / Next.js | `import { StepInspector } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/step-inspector";` · tags starting with tc- are custom elements |
| Angular | `import { StepInspector } from "@adamstavely/trenchcoat/angular/step-inspector";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/step-inspector";` |

## Example

The live example is in the gallery at `#/step-inspector`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One workflow step's settings. It shows the step's title and each of its inputs with where the value comes from:
either typed in, or mapped from an earlier step's output. A mapping shows as a chip, such as
"Extract fields › amount", with its reference (`extract.amount`) beside it. A required input with nothing behind it
says so in words, and the header counts how many are missing. "Test with sample" asks the page to run the step, and
the last run's input and output show as JSON.

### When to use

- The side panel beside a `workflow-canvas`, for the selected step.
- Any step-by-step automation where inputs are wired from what came before.

### When not to use

- Defining a tool's parameters and schema – use [Tool Configuration](tool-configuration.md).
- Reading a large JSON result on its own – use [JSON Viewer](json-viewer.md).
- Choosing which step to add – use [Step Picker](step-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Title** `.ui-sti__section` – the step's title, editable
2. **Input** `.ui-sti__input` – an input's name, Required, its description and where it comes from
3. **Source** `.ui-sti__source` – Value or From a step
4. **Field** `.ui-sti__field` – a typed value: text, a number, several lines or a choice
5. **Mapping** `.ui-sti__chip` – the step and output it comes from, opening the list `.ui-sti__list`
6. **Missing** `.ui-sti__error` – what a required input needs
7. **Test** `.ui-sti__test` – Test with sample
8. **Last run** `.ui-sti__run` – how it went, and its Input and Output in `.ui-sti__json`

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Inputs sit on a sunken panel each; a missing one has a warning outline as well as its
message. Set the JSON block's height with `--tc-sti-json-h`.

## Usage

### HTML

```html
<tc-step-inspector id="inspector"></tc-step-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/step-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const inspector = document.querySelector("#inspector");
  inspector.upstream = [{ id: "extract", title: "Extract fields", kind: "llm", outputs: [{ name: "amount", type: "number", sample: "12,480.00" }] }];
  inspector.step = {
    id: "post",
    kind: "output",
    title: "Post to ledger",
    inputs: [
      { id: "amount", label: "Amount", required: true, source: { kind: "ref", ref: "extract.amount" } },
      { id: "cost-centre", label: "Cost centre", required: true, placeholder: "CC-000" },
    ],
  };
  inspector.addEventListener("tc-step-change", (e) => console.log(e.detail.step));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { StepInspector, type InspectorStep, type StepRun, type UpstreamStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PostToLedger({ upstream, start, run }: { upstream: UpstreamStep[]; start: InspectorStep; run: (step: InspectorStep) => Promise<StepRun> }) {
  const [step, setStep] = useState(start);
  const [testing, setTesting] = useState(false);
  const [lastRun, setLastRun] = useState<StepRun | null>(null);
  return (
    <StepInspector
      step={step}
      upstream={upstream}
      testing={testing}
      lastRun={lastRun}
      onStepChange={setStep}
      onTest={async (s) => {
        setTesting(true);
        setLastRun(await run(s));
        setTesting(false);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/step-inspector";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";

defineProps<{ step: TcStepInspector["step"]; upstream: TcStepInspector["upstream"] }>();
const onStepChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-step-inspector :step="step" :upstream="upstream" @tc-step-change="onStepChange"></tc-step-inspector>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StepInspector } from "@adamstavely/trenchcoat/angular/step-inspector";
import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";

@Component({
  selector: "app-step-inspector-example",
  imports: [StepInspector],
  template: `<tc-step-inspector [step]="step()" [upstream]="upstream()" (tc-step-change)="onStepChange($event)"></tc-step-inspector>`,
})
export class StepInspectorExample {
  readonly step = input.required<TcStepInspector["step"]>();
  readonly upstream = input.required<TcStepInspector["upstream"]>();
  onStepChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/step-inspector";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";

  let { step, upstream }: { step: TcStepInspector["step"]; upstream: TcStepInspector["upstream"] } = $props();
  let el: TcStepInspector;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-step-change", on);
    return () => el.removeEventListener("tc-step-change", on);
  });
</script>

<tc-step-inspector bind:this={el} {step} {upstream}></tc-step-inspector>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Step"` | The heading, over the step's title when no step is selected |
| `step` | – | `InspectorStep \| null` | `null` | The step being edited, or null for none |
| `upstream` | – | `UpstreamStep[]` | `[]` | The steps before this one, whose outputs its inputs can be mapped from |
| `lastRun` | – | `StepRun \| null` | `null` | The last test run, if any |
| `testing` | `testing` | `boolean` | `false` | A test run is in flight |
| `readonly` | `readonly` | `boolean` | `false` | Viewing only: nothing can be changed or tested |
| `kinds` | – | `Record<string, Partial<WorkflowKindInfo>>` | `{}` | Labels and icons for kinds the page adds, merged over the workflow defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-step-change` | – | Yes | The title or an input changed ({ step, field, input }: StepChange); cancelable – prevented, `step` stays as it was |
| `tc-test` | – | No | "Test with sample" was pressed ({ step }: StepTest) – the page runs it and sets `lastRun` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sti-json-h` | `220px` | both |

#### Design tokens it reads (94)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-syntax-text`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `stepInputMissing(input: StepInput, upstream: UpstreamStep[]): void` | Whether a required input has nothing behind it: no value typed, or a mapping to an output that doesn't exist |
| `resolveRef(ref: string, upstream: UpstreamStep[]): void` | "extract.amount" → the step and output it names, or null |

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
| `step` | `el.step = …;` | `<… step={…} />` | `<tc-step-inspector :step="…">` | `<tc-step-inspector [step]="…">` | `<tc-step-inspector {step}>` |
| `upstream` | `el.upstream = …;` | `<… upstream={…} />` | `<tc-step-inspector :upstream="…">` | `<tc-step-inspector [upstream]="…">` | `<tc-step-inspector {upstream}>` |
| `lastRun` | `el.lastRun = …;` | `<… lastRun={…} />` | `<tc-step-inspector :lastRun="…">` | `<tc-step-inspector [lastRun]="…">` | `<tc-step-inspector {lastRun}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-step-inspector :kinds="…">` | `<tc-step-inspector [kinds]="…">` | `<tc-step-inspector {kinds}>` |

*Also attributes: `heading`, `testing`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-step-change` | Yes | `el.addEventListener("tc-step-change", (e) => …)` | `ref.current.addEventListener("tc-step-change", …)` | `@tc-step-change="…"` | `(tc-step-change)="…($event)"` | `el.addEventListener("tc-step-change", …)` |
| `tc-test` | No | `el.addEventListener("tc-test", (e) => …)` | `onTest={…}` | `@tc-test="…"` | `(tc-test)="…($event)"` | `el.addEventListener("tc-test", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `step` itself unless a listener calls `preventDefault()` on `tc-step-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-step-inspector id="step-inspector"></tc-step-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/step-inspector";

  const el = document.querySelector("#step-inspector");
  el.addEventListener("tc-step-change", (e) => {
    e.preventDefault(); // the element keeps its step…
    if (allowed(e.detail.step)) el.step = e.detail.step; // …until the app sets it
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
import "@adamstavely/trenchcoat/step-inspector";
import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";

const props = defineProps<{ initial: TcStepInspector["step"] }>();
const step = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStepChange = (e: CustomEvent<{ step: TcStepInspector["step"] }>) => {
  e.preventDefault();
  step.value = e.detail.step;
};
</script>

<template>
  <tc-step-inspector :step="step" @tc-step-change="onStepChange"></tc-step-inspector>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { StepInspector } from "@adamstavely/trenchcoat/angular/step-inspector";
import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";

@Component({
  selector: "app-controlled-step-inspector",
  imports: [StepInspector],
  template: `<tc-step-inspector [step]="step()" (tc-step-change)="onStepChange($event)"></tc-step-inspector>`,
})
export class ControlledStepInspector {
  readonly initial = input.required<TcStepInspector["step"]>();
  readonly step = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStepChange(e: CustomEvent<{ step: TcStepInspector["step"] }>) {
    e.preventDefault();
    this.step.set(e.detail.step);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/step-inspector";
  import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";

  let { initial }: { initial: TcStepInspector["step"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let step = $derived(initial);
  let el: TcStepInspector;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      step = (e as CustomEvent<{ step: TcStepInspector["step"] }>).detail.step;
    };
    el.addEventListener("tc-step-change", on);
    return () => el.removeEventListener("tc-step-change", on);
  });
</script>

<tc-step-inspector bind:this={el} {step}></tc-step-inspector>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-step-inspector")` returns a `TcStepInspector` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";`
- **React / Next.js:** Props: `import type { StepInspectorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof StepInspector>`. The element class, for refs: `import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStepInspector["step"]` with `import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";`
- **Angular:** The directive types the template: `[step]` takes `TcStepInspector["step"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStepInspector } from "@adamstavely/trenchcoat/step-inspector";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading when no step is selected |
| `step` | `InspectorStep \| null` | The step being edited – controlled when given (null for none) |
| `defaultStep` | `InspectorStep \| null` | The step on mount when `step` isn't controlled |
| `onStepChange` | `(step: InspectorStep, detail: StepChange) => void` | The title or an input changed; `input` is the changed input's id |
| `onTest` | `(step: InspectorStep) => void` | "Test with sample" was pressed – run the step and set `lastRun` |

*Renamed or hidden on the wrapper: `heading`, `step`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the title, each input's source, field or mapping, Test, and the last run |
| ← / → | In a source, switches between Value and From a step; in the last run, between Input and Output |
| Enter / Space | On a mapping, opens the list of outputs |
| ↑ / ↓ | In the list of outputs, moves between them |
| Home / End | In the list of outputs, moves to the first or last |
| Enter / Space | In the list, maps the input to that output |
| Escape | Closes the list and returns to the mapping |

### Screen readers

Each input is a fieldset named by its label, with Required in the name. Its source is a pair of radio buttons in a
named group. A typed value's field is labelled by the input and described by its description and, when it's missing,
by the message; it's marked invalid while missing. A mapping is a button that opens a listbox of earlier steps'
outputs, grouped by step, and reads the step and output it's mapped to. Mapping an input is confirmed in a polite
status message ("Amount comes from Extract fields amount"), and so is a finished test. Test with sample is
aria-disabled while inputs are missing, and described by why. The last run's Input and Output are tabs over a
focusable block.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, workflow-canvas | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, workflow-canvas | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself, workflow-canvas | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, workflow-canvas | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, workflow-canvas, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | workflow-canvas | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, workflow-canvas, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.4 KB | 7.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [workflow-canvas](workflow-canvas.md) · Element it renders | 39.0 KB | – |
| **Added to a page that already has Lit** | **73.0 KB** | **19.4 KB** |
| With Lit – the first component on a page | 95.2 KB | 26.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 112 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of upstream replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.4 ms | upstream: first render, 112 nodes; update 0.2 ms |
| 1,000 items | 1.7 ms | upstream: first render, 112 nodes; update 0.5 ms |

What it renders doesn't grow with upstream (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (workflow-canvas).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label inputs as nouns the person knows: "Amount", "Cost centre", not field ids.
- Use `description` for the format or an example: "The team the spend is charged to, e.g. CC-210".
- Name outputs as they'll be referenced, short and lowercase: `amount`, `po_number`.
- Give outputs a `sample` so people can tell similar ones apart.

## Do and don't

### Do

- Pass only the steps that run before this one as `upstream`.
- Set `testing` while a test runs, then `lastRun` with its input and output.
- Save on `tc-step-change`, or keep the change until the page's own Save.

### Don't

- Don't make every input required – only the ones the step can't run without.
- Don't put secrets in a typed value; map them from a secrets store instead.

## Related

- [Workflow Canvas](workflow-canvas.md) – An agent workflow as a node graph – step cards with their kind, status in a mark and a word, and curved labelled connectors; pan and zoom, drag steps and connect them from their ports or the keyboard (M moves, C connects, A adds), a flowing connector into the running step, and the same graph as a list
- [Step Picker](step-picker.md) – What to add next to a workflow – a search over step kinds and tools grouped as Triggers, AI, Tools, Logic, People and Output, led by suggested steps with why and recent ones, inline or as a popover by the button that opened it
- [Tool Configuration](tool-configuration.md) – A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
