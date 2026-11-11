<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Status Tracker

**Research & portfolio** · New

Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click

- **Element:** `<tc-status-tracker>`
- **Size:** 10.1 KB gzip · 33.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/status-tracker";` |
| React / Next.js | `import { StatusTracker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/status-tracker";` · tags starting with tc- are custom elements |
| Angular | `import { StatusTracker } from "@adamstavely/trenchcoat/angular/status-tracker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/status-tracker";` |

## Example

The live example is in the gallery at `#/status-tracker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a piece of work stands in a fixed sequence of steps – gates to clear, stages to pass, reviews to sign off. The
steps sit on one line, each a ringed marker: a tick when cleared, its number when pending (with a "!" when it needs
attention), a cross when blocked, its number greyed when not reached. Beneath each marker are the step's number,
its name, its status in words and the date it got there. The line between two steps fills once the first is
cleared, and the current step – the first one not cleared – wears a soft halo. The heading counts what's cleared, a
legend names the statuses in use, and opening a step shows its record below: what happened, who owns it and the
evidence.

### When to use

- Approval or authorization pipelines: gates a programme, model or release must pass in order.
- Compliance and certification stages, procurement steps, a case moving through review.
- Any fixed sequence where people need to see what's done, what's stuck and what's next at a glance.

### When not to use

- A checklist people tick off themselves – use [Progress Tracker](progress-tracker.md).
- A form split over several steps – use [Stepper Form](stepper-form.md).
- An agent run's restore points – use [Run Checkpoints](run-checkpoints.md).
- Configuring when a run pauses for a person – use [Gate Config](gate-config.md).
- Many items against many checks – use [Coverage Matrix](coverage-matrix.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Legend** `.ui-stk__legend` – the statuses in use, beside the heading
2. **Marker** `.ui-stk__marker` – the step's ring and mark: ✓, ×, or its number
3. **Badge** `.ui-stk__bang` – the "!" on a step that needs attention
4. **Line** `.ui-stk__line` – the connector to the next step, filled once this step is cleared
5. **Step** `.ui-stk__step` – the marker, "GATE 5", the name, the status in words and the date
6. **Record** `.ui-stk__detail` – the open step: its status, date and owner, the summary and the evidence

## Looks

Standard is a white card on a gray tray, with the header and legend on the tray above it. Clean is one white card
with the header as its first row. The markers, line and record are the same in both. Each tone's ring, wash and
words come from the status tokens; `--tc-stk-marker` sets the marker's size and `--tc-stk-step` the narrowest a
step may be before the line scrolls sideways.

## Usage

### HTML

```html
<tc-status-tracker id="gates" heading="Programme authorization pipeline" noun="Gate"></tc-status-tracker>

<script type="module">
  import "@adamstavely/trenchcoat/status-tracker";
  import "@adamstavely/trenchcoat/tokens.css";

  const gates = document.querySelector("#gates");
  gates.hint = "click any gate for its evidence record";
  gates.steps = [
    { id: "scope", label: "Pre-registration & scope", status: "cleared", date: Date.parse("2025-10-12T12:00") },
    { id: "red-team", label: "Red-team clearance", status: "pending", attention: "One finding awaiting re-test" },
    { id: "pilot", label: "Operational pilot", status: "not-reached" },
  ];
  gates.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { StatusTracker, type StatusTrackerStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const steps: StatusTrackerStep[] = [
  { id: "scope", label: "Pre-registration & scope", status: "cleared", date: Date.parse("2025-10-12T12:00") },
  { id: "red-team", label: "Red-team clearance", status: "pending", attention: "One finding awaiting re-test" },
  { id: "pilot", label: "Operational pilot", status: "not-reached" },
];

export function Gates() {
  const [selected, setSelected] = useState<string | null>(null);
  return <StatusTracker title="Programme authorization pipeline" noun="Gate" steps={steps} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/status-tracker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";

defineProps<{ steps: TcStatusTracker["steps"]; statuses: TcStatusTracker["statuses"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-status-tracker :steps="steps" :statuses="statuses" @tc-selected-change="onSelectedChange"></tc-status-tracker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StatusTracker } from "@adamstavely/trenchcoat/angular/status-tracker";
import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";

@Component({
  selector: "app-status-tracker-example",
  imports: [StatusTracker],
  template: `<tc-status-tracker [steps]="steps()" [statuses]="statuses()" (tc-selected-change)="onSelectedChange($event)"></tc-status-tracker>`,
})
export class StatusTrackerExample {
  readonly steps = input.required<TcStatusTracker["steps"]>();
  readonly statuses = input.required<TcStatusTracker["statuses"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/status-tracker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";

  let { steps, statuses }: { steps: TcStatusTracker["steps"]; statuses: TcStatusTracker["statuses"] } = $props();
  let el: TcStatusTracker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-status-tracker bind:this={el} {steps} {statuses}></tc-status-tracker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Status"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | The line under the heading; by default the count cleared, e.g. "4 of 9 gates cleared" |
| `hint` | `hint` | `string \| undefined` | `undefined` | Added after the default description, e.g. "click any gate for its evidence record" |
| `steps` | – | `StatusTrackerStep[]` | `[]` | The steps, in order |
| `statuses` | – | `Record<string, StatusTrackerStatus>` | `{}` | Statuses by key, merged over the defaults (cleared, pending, blocked, not-reached) |
| `noun` | `noun` | `string` | `"Step"` | What a step is called: "Gate" shows "GATE 3" over each name; empty hides it |
| `nounPlural` | `noun-plural` | `string \| undefined` | `undefined` | The noun's plural, for the count; by default the noun with an "s" |
| `orientation` | `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | "horizontal" (the default; stacks below 480 px) or "vertical" |
| `legend` | `legend` | `boolean` | `true` | Shows the statuses in use beside the heading |
| `selected` | – | `string \| null` | `null` | The step whose record is open. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A step's record opened or closed ({ selected, step }: StatusTrackerSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-stk-marker` | `36px` | both |
| `--tc-stk-step` | `132px` | both |

#### Design tokens it reads (76)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-control`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-stk-count`, `--tc-stk-fg`, `--tc-stk-ink`, `--tc-stk-wash`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultTrackerStatuses: Record<string, StatusTrackerStatus>` | The statuses used when the page gives none; `statuses` is merged over them |

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-status-tracker :steps="…">` | `<tc-status-tracker [steps]="…">` | `<tc-status-tracker {steps}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-status-tracker :statuses="…">` | `<tc-status-tracker [statuses]="…">` | `<tc-status-tracker {statuses}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-status-tracker :selected="…">` | `<tc-status-tracker [selected]="…">` | `<tc-status-tracker {selected}>` |

*Also attributes: `heading`, `description`, `hint`, `noun`, `noun-plural`, `orientation`, `legend`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-status-tracker id="status-tracker"></tc-status-tracker>

<script type="module">
  import "@adamstavely/trenchcoat/status-tracker";

  const el = document.querySelector("#status-tracker");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/status-tracker";
import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";

const props = defineProps<{ initial: TcStatusTracker["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcStatusTracker["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-status-tracker :selected="selected" @tc-selected-change="onSelectedChange"></tc-status-tracker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { StatusTracker } from "@adamstavely/trenchcoat/angular/status-tracker";
import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";

@Component({
  selector: "app-controlled-status-tracker",
  imports: [StatusTracker],
  template: `<tc-status-tracker [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-status-tracker>`,
})
export class ControlledStatusTracker {
  readonly initial = input.required<TcStatusTracker["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcStatusTracker["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/status-tracker";
  import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";

  let { initial }: { initial: TcStatusTracker["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcStatusTracker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcStatusTracker["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-status-tracker bind:this={el} {selected}></tc-status-tracker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-status-tracker")` returns a `TcStatusTracker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";`
- **React / Next.js:** Props: `import type { StatusTrackerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof StatusTracker>`. The element class, for refs: `import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStatusTracker["steps"]` with `import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";`
- **Angular:** The directive types the template: `[steps]` takes `TcStatusTracker["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStatusTracker } from "@adamstavely/trenchcoat/status-tracker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The step whose record is open – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The step open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, step?: StatusTrackerStep) => void` | A step's record opened or closed; `step` is the opened step |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

### Keyboard

The steps are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next step (↑ / ↓ when the steps stack) |
| Home / End | Moves to the first or last step |
| Enter / Space | Opens the step's record, or closes it if it's open |
| Escape | Closes the open record |
| Tab | Leaves the steps; with a record open, the next stops are its links and its Close button |

Close returns focus to the step. A step moved to off the edge of the scrolling area scrolls into view.

### Screen readers

The steps are an ordered list named by the heading. Each step is a button that reads its place, name, status, date
and any reason for attention: “Gate 5 of 9, Adversarial resilience, Pending, needs attention: One high finding
awaiting re-test”. The current step is `aria-current="step"`, and a step says whether its record is expanded.
Opening a record is confirmed in a polite status message, “Gate 5, Adversarial resilience: Pending. Record shown”,
and closing it with “Record closed”. The record is a section headed by the step; its Close button is labelled “Close
record”. The markers, badge and line are hidden – the words say the same.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.8 KB | 7.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **33.7 KB** | **10.1 KB** |
| With Lit – the first component on a page | 55.5 KB | 17.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | the gallery demo's data, 162 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of steps replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | steps: first render, 1,558 nodes; update 2.8 ms |
| 1,000 items | 92 ms | steps: first render, 15,358 nodes; update 15 ms |

1,000 items of steps: 92 ms. It renders every item, so a first render passes 50 ms (a long task) at about 540 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name steps for what passing them proves: “Red-team clearance”, “Calibration baseline”, not form numbers.
- Set `noun` to what the steps are called – “Gate”, “Stage”, “Review” – or leave it empty for plain numbers.
- Give a pending step `attention` with a reason when someone has to act: “One high finding awaiting re-test”.
- Add your own statuses with `statuses` – `{ waived: { label: "Waived", tone: "info", mark: "check", done: true } }`.

## Do and don't

### Do

- Give every cleared step its date and a record with the evidence, so the pipeline can be audited from the page.
- Use `hint` to say the steps open: “click any gate for its evidence record”.
- Keep to the order the work really follows – the line reads left to right.

### Don't

- Don't use it for steps that can happen in any order – it implies a sequence.
- Don't colour-code statuses yourself – the marks and words carry them, and the tones come from the status tokens.
- Don't put long text in a step's name – it wraps under a narrow marker; put detail in its record.

## Related

- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Run Checkpoints](run-checkpoints.md) – A run's restore points on a timeline – what each one captured, what going back discards, and “go back to step 4 and try again”, with earlier attempts kept as branches
- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail

## Changelog

- **`tc-status-tracker`** (Research & portfolio): a fixed sequence of gates or stages on a line. - **Status:** each cleared, pending, blocked or not reached, in words and marks. - **Progress:** the line fills as they clear, and the current step is marked. - **Records:** a legend, and a step's evidence record on click; vertical when narrow.
