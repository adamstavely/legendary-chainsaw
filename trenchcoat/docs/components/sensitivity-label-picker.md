<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Sensitivity Label Picker

**Inputs & controls** · New

Sets a file's classification – a mark and word on a small button, a list of labels with what each means, and a reason asked before lowering it

- **Element:** `<tc-sensitivity-label-picker>`
- **Size:** 9.5 KB gzip · 28.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sensitivity-label-picker";` |
| React / Next.js | `import { SensitivityLabelPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sensitivity-label-picker";` · tags starting with tc- are custom elements |
| Angular | `import { SensitivityLabelPicker } from "@adamstavely/trenchcoat/angular/sensitivity-label-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sensitivity-label-picker";` |

## Example

The live example is in the gallery at `#/sensitivity-label-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Sets a file's classification. A small button shows the label's mark and word, and opens a list with what each label means.
Raising it happens at once, and lowering it first asks why, because it may let more people see the file.

### When to use

- Classifying files or records as Public, Internal, Confidential or Restricted, or your own levels.
- A row in a file list, or a file's details.

### When not to use

- A team's own markers, with no order to them – use [Team Flag Picker](team-flag-picker.md).
- Choosing who can see a file – use [Share Panel](share-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Button** `.ui-slp__trigger` – `.ui-slp__mark` and `.ui-slp__label`
2. **List** `.ui-slp__list` – the labels, least sensitive first
3. **Option** `.ui-slp__option` – `.ui-slp__name` and `.ui-slp__about`
4. **Reason** `.ui-slp__ask` – asked before lowering, with a required `.ui-slp__reason`

## Looks

The same control in Standard and Clean, drawn from the shared button and menu tokens. A page can set
`--tc-slp-list-width` and `--tc-slp-mark`. A label's `color` overrides the mark's colour.

## Usage

### HTML

```html
<tc-sensitivity-label-picker id="label" file-name="Q3 audit.pdf" value="internal"></tc-sensitivity-label-picker>

<script type="module">
  import "@adamstavely/trenchcoat/sensitivity-label-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#label").addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.reason));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SensitivityLabelPicker } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FileLabel() {
  const [value, setValue] = useState<string | null>("internal");
  return <SensitivityLabelPicker fileName="Q3 audit.pdf" value={value} onValueChange={(next) => setValue(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sensitivity-label-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";

defineProps<{ options: TcSensitivityLabelPicker["options"]; labels: TcSensitivityLabelPicker["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-sensitivity-label-picker :options="options" :labels="labels" @tc-value-change="onValueChange"></tc-sensitivity-label-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SensitivityLabelPicker } from "@adamstavely/trenchcoat/angular/sensitivity-label-picker";
import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";

@Component({
  selector: "app-sensitivity-label-picker-example",
  imports: [SensitivityLabelPicker],
  template: `<tc-sensitivity-label-picker [options]="options()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-sensitivity-label-picker>`,
})
export class SensitivityLabelPickerExample {
  readonly options = input.required<TcSensitivityLabelPicker["options"]>();
  readonly labels = input.required<TcSensitivityLabelPicker["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sensitivity-label-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";

  let { options, labels }: { options: TcSensitivityLabelPicker["options"]; labels: TcSensitivityLabelPicker["labels"] } = $props();
  let el: TcSensitivityLabelPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-sensitivity-label-picker bind:this={el} {options} {labels}></tc-sensitivity-label-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | – | `SensitivityLabel[]` | `[ { id: "public", label: "Public", description: "Anyone can see this.", level: 1 }, { id: "internal", label: "Internal", description: "For people in the organization.", level: 2 }, { id: "confidential", label: "Confidential", description: "For the teams that need it.", level: 3 }, { id: "restricted", label: "Restricted", description: "For named people only.", level: 4 }, ]` | The labels to choose from |
| `value` | `value` | `string \| null` | `null` | The id of the file's label, or null for none. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `fileName` | `file-name` | `string` | `""` | The file's name, so the control says which file it's for |
| `disabled` | `disabled` | `boolean` | `false` | Show the label without letting it change |
| `labels` | – | `Partial<SensitivityLabelPickerWords>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The label changed ({ value, label, reason, direction }: SensitivityValueChange); cancelable – prevented, `value` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-slp-list-width` | `300px` | both |
| `--tc-slp-mark` | `var(--tc-text-primary)` | both |
| `--tc-icon-size-md` | `16px` | not set – this fallback applies |

#### Design tokens it reads (34)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSensitivityLabels: SensitivityLabel[]` | The labels when `options` isn't set, least sensitive first |

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-sensitivity-label-picker :options="…">` | `<tc-sensitivity-label-picker [options]="…">` | `<tc-sensitivity-label-picker {options}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-sensitivity-label-picker :labels="…">` | `<tc-sensitivity-label-picker [labels]="…">` | `<tc-sensitivity-label-picker {labels}>` |

*Also attributes: `value`, `file-name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-sensitivity-label-picker id="sensitivity-label-picker"></tc-sensitivity-label-picker>

<script type="module">
  import "@adamstavely/trenchcoat/sensitivity-label-picker";

  const el = document.querySelector("#sensitivity-label-picker");
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
import "@adamstavely/trenchcoat/sensitivity-label-picker";
import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";

const props = defineProps<{ initial: TcSensitivityLabelPicker["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcSensitivityLabelPicker["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-sensitivity-label-picker :value="value" @tc-value-change="onValueChange"></tc-sensitivity-label-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SensitivityLabelPicker } from "@adamstavely/trenchcoat/angular/sensitivity-label-picker";
import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";

@Component({
  selector: "app-controlled-sensitivity-label-picker",
  imports: [SensitivityLabelPicker],
  template: `<tc-sensitivity-label-picker [value]="value()" (tc-value-change)="onValueChange($event)"></tc-sensitivity-label-picker>`,
})
export class ControlledSensitivityLabelPicker {
  readonly initial = input.required<TcSensitivityLabelPicker["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcSensitivityLabelPicker["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sensitivity-label-picker";
  import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";

  let { initial }: { initial: TcSensitivityLabelPicker["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcSensitivityLabelPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcSensitivityLabelPicker["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-sensitivity-label-picker bind:this={el} {value}></tc-sensitivity-label-picker>
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
<tc-sensitivity-label-picker :value="value" @tc-value-change="value = $event.detail.value"></tc-sensitivity-label-picker>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-sensitivity-label-picker [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-sensitivity-label-picker>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-sensitivity-label-picker bind:this={el} {value}></tc-sensitivity-label-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sensitivity-label-picker")` returns a `TcSensitivityLabelPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";`
- **React / Next.js:** Props: `import type { SensitivityLabelPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SensitivityLabelPicker>`. The element class, for refs: `import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSensitivityLabelPicker["options"]` with `import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";`
- **Angular:** The directive types the template: `[options]` takes `TcSensitivityLabelPicker["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSensitivityLabelPicker } from "@adamstavely/trenchcoat/sensitivity-label-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string \| null` | The id of the file's label, or null for none – controlled when given |
| `defaultValue` | `string \| null` | The label on mount when `value` isn't controlled |
| `onValueChange` | `(value: string, detail: SensitivityValueChange) => void` | The label changed; `detail` has the reason when it was lowered |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the button | Opens the list, on the current label |
| ↑ ↓ / Home End | Move through the list |
| Enter / Space on a label | Picks it, or asks why if that lowers it |
| Escape | Closes the list and returns to the button |

### Screen readers

The button names the label and the file. The list is a `listbox` with `aria-selected`. The level is shown as filled bars and
the label's word, so colour is never the only cue. The reason is `aria-required`, and `role="status"` announces changes.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-01 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 13.2 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.1 KB** | **9.5 KB** |
| With Lit – the first component on a page | 49.5 KB | 16.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 9 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of options replaced |
| First on the page | 7.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.1 ms | options: first render, 105 nodes; update 0.1 ms |
| 1,000 items | 4.8 ms | options: first render, 1,005 nodes; update 0.9 ms |

1,000 items of options: 4.8 ms, 1,005 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Use `description` to say who a label is for. Set `level` so higher means more sensitive: it decides what counts as lowering.

## Do and don't

### Do

- Store `reason` and `direction` from `tc-value-change` for your audit trail.
- Apply what a label means on the server, and use it in `share-panel`'s entitlement check.

### Don't

- Don't treat the label as enforcement. It records the choice.

## Related

- [Team Flag Picker](team-flag-picker.md) – Picks one of a team's flags for a file – a small button with the flag's colour and name, opening a list of flags with what each one means.
- [Share Panel](share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [File Details](../blocks/file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
- [Access Review](../blocks/access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
