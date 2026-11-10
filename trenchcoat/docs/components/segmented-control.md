<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Segmented Control

**Inputs & controls** · Also in React

Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

- **Element:** `<tc-segmented-control>`
- **Size:** 9.7 KB gzip · 39.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/segmented-control";` |
| React / Next.js | `import { SegmentedControl } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/segmented-control";` · tags starting with tc- are custom elements |
| Angular | `import { SegmentedControl } from "@adamstavely/trenchcoat/angular/segmented-control";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/segmented-control";` |

## Example

The live example is in the gallery at `#/segmented-control`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A row of two to six options where exactly one is picked – a view (List, Grid, Board), a period (Monthly, Yearly), a
filter (All, Unread, Mentions). The picked option sits on a raised pill or an underline that glides to the next
pick, stretching a little on the way, and people can drag the pill across the options to pick as they go. Options
can carry an icon, a count or a badge. With `kind="tabs"` the same control becomes a set of tabs that switch panels.

### When to use

- Switching how one set of content is shown – view modes, chart ranges, sort orders.
- A small choice that takes effect at once and should stay visible: billing period, units, a filter.
- A few tabs over one panel, with `kind="tabs"` and `variant="underline"`.

### When not to use

- More than six options, or options that don't fit in one row – use [Combobox](combobox.md).
- Several choices at once, or filters across more than one facet – use [Filter Menu](filter-menu.md).
- Turning one setting on and off – use a checkbox or a switch.
- Actions (“Export”, “Share”) rather than a choice – use a [Button](button.md) for each.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Indicator** `.ui-seg__pill` – the raised pill (or underline) under the picked option
2. **Option** `.ui-seg__opt:nth-of-type(3)` – one choice: a label, an icon or both
3. **Count** `.ui-seg__count` – a small number after the label, such as unread items
4. **Badge** `.ui-seg__badge` – a small tinted tag, such as “Save 20%”

## Looks

Standard is a gray tray with a white raised pill that glides and stretches to the picked option, and the picked
label turns bold without shifting the layout. Clean defaults to separate quiet chips with the picked one filled, and
glides faster. Both offer the underline variant for tabs; `variant="buttons"` only exists in Clean – Standard shows
it as the tray.

## Usage

### HTML

```html
<tc-segmented-control id="view" aria-label="View"></tc-segmented-control>

<script type="module">
  import "@adamstavely/trenchcoat/segmented-control";
  import "@adamstavely/trenchcoat/tokens.css";

  const view = document.querySelector("#view");
  view.options = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
    { value: "board", label: "Board", count: 3 },
  ];
  view.value = "list";
  view.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SegmentedControl } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function BillingPeriod() {
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  return (
    <SegmentedControl
      aria-label="Billing period"
      fullWidth
      value={period}
      onChange={setPeriod}
      options={[
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly", badge: "Save 20%" },
      ]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/segmented-control";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";

defineProps<{ options: TcSegmentedControl["options"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-segmented-control :options="options" @tc-value-change="onValueChange"></tc-segmented-control>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SegmentedControl } from "@adamstavely/trenchcoat/angular/segmented-control";
import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";

@Component({
  selector: "app-segmented-control-example",
  imports: [SegmentedControl],
  template: `<tc-segmented-control [options]="options()" (tc-value-change)="onValueChange($event)"></tc-segmented-control>`,
})
export class SegmentedControlExample {
  readonly options = input.required<TcSegmentedControl["options"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/segmented-control";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";

  let { options }: { options: TcSegmentedControl["options"] } = $props();
  let el: TcSegmentedControl;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-segmented-control bind:this={el} {options}></tc-segmented-control>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | – | `SegmentOption[]` | `[]` | The options to switch between, in order – two to six read best |
| `value` | `value` | `string \| undefined` | `undefined` | The picked value; unset picks the first enabled option. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `size` | `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height and text size of the control: "sm", "md" or "lg" |
| `variant` | `variant` | `"buttons" \| "tray" \| "underline" \| undefined` | `undefined` | "tray", "underline" or "buttons" (Clean only – Standard shows it as "tray"). Unset: "tray" in Standard, "buttons" in Clean |
| `fullWidth` | `full-width` | `boolean` | `false` | Fill the container with equal segments |
| `kind` | `kind` | `"radio" \| "tabs"` | `"radio"` | "radio" (a radiogroup, the default) or "tabs" (a tablist that switches panels) |
| `disabled` | `disabled` | `boolean` | `false` | Turns every option off; the hidden form input is disabled too |
| `name` | `name` | `string \| undefined` | `undefined` | Submits the picked value with a native form, through a hidden input |
| `form` | `form` | `string \| undefined` | `undefined` | The id of the form the hidden input belongs to, when the control sits outside it |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The user picked an option ({ value }: SegmentValueChange); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-segmented-control-h` | `var(--tc-control-h-md)` | standard, clean |
| `--tc-segmented-control-px` | `var(--tc-control-px-md)` | standard, clean |
| `--tc-segmented-control-fs` | `var(--tc-font-size-md)` | standard, clean |
| `--tc-segmented-control-radius` | `var(--tc-seg-track-radius)` | standard |
| `--tc-segmented-control-pad` | `var(--tc-seg-pad)` | standard, clean |
| `--tc-segmented-control-icon` | `16px` | standard, clean |
| `--tc-segmented-control-gap` | `8px` | standard, clean |
| `--tc-segmented-control-lh` | `var(--tc-line-height-normal)` | clean |
| `--tc-segmented-control-ring` | `3px` | clean |

#### Design tokens it reads (56)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-default`, `--tc-border-selected`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-lg`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-segmented-control-fade-l`, `--tc-segmented-control-fade-r`, `--tc-segmented-control-min`, `--tc-space-1`, `--tc-space-1-5`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-segmented-control :options="…">` | `<tc-segmented-control [options]="…">` | `<tc-segmented-control {options}>` |

*Also attributes: `value`, `size`, `variant`, `full-width`, `kind`, `disabled`, `name`, `form` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-segmented-control id="segmented-control"></tc-segmented-control>

<script type="module">
  import "@adamstavely/trenchcoat/segmented-control";

  const el = document.querySelector("#segmented-control");
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
import "@adamstavely/trenchcoat/segmented-control";
import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";

const props = defineProps<{ initial: TcSegmentedControl["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcSegmentedControl["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-segmented-control :value="value" @tc-value-change="onValueChange"></tc-segmented-control>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SegmentedControl } from "@adamstavely/trenchcoat/angular/segmented-control";
import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";

@Component({
  selector: "app-controlled-segmented-control",
  imports: [SegmentedControl],
  template: `<tc-segmented-control [value]="value()" (tc-value-change)="onValueChange($event)"></tc-segmented-control>`,
})
export class ControlledSegmentedControl {
  readonly initial = input.required<TcSegmentedControl["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcSegmentedControl["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/segmented-control";
  import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";

  let { initial }: { initial: TcSegmentedControl["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcSegmentedControl;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcSegmentedControl["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-segmented-control bind:this={el} {value}></tc-segmented-control>
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
<tc-segmented-control :value="value" @tc-value-change="value = $event.detail.value"></tc-segmented-control>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-segmented-control [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-segmented-control>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-segmented-control bind:this={el} {value}></tc-segmented-control>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-segmented-control")` returns a `TcSegmentedControl` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";`
- **React / Next.js:** Props: `import type { SegmentedControlProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SegmentedControl>`. The element class, for refs: `import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSegmentedControl["options"]` with `import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";`
- **Angular:** The directive types the template: `[options]` takes `TcSegmentedControl["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSegmentedControl } from "@adamstavely/trenchcoat/segmented-control";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `options` | `SegmentOption<T>[]` | The options to switch between, in order – two to six read best |
| `value` | `T` | Controlled value |
| `defaultValue` | `T` | Starting value when uncontrolled – defaults to the first enabled option |
| `onChange` | `(value: T) => void` | Called with the picked value each time the user picks an option |

*Renamed or hidden on the wrapper: `value`, `options`, `onChange`, `defaultValue`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the control, onto the picked option; the next Tab leaves it |
| → / ↓ | Picks the next option, wrapping to the first (with `kind="tabs"`, → only) |
| ← / ↑ | Picks the previous option, wrapping to the last (with `kind="tabs"`, ← only) |
| Home / End | Picks the first or the last option |
| Enter / Space | Picks the focused option |

Arrow keys, Home and End skip disabled options, and the pick follows the focus.

### Screen readers

The options sit in a `radiogroup`, each a `radio` with `aria-checked`; with `kind="tabs"` they're a horizontal
`tablist` of `tab`s with `aria-selected` and `aria-controls` pointing at each option's `controls` panel. The
`aria-label` or `aria-labelledby` you set on the element names the group. A count is part of the option's name
(“Unread 8”); an icon-only option is named by its `ariaLabel`. A disabled control sets `aria-disabled` on the group.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | itself | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.1 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **39.4 KB** | **9.7 KB** |
| With Lit – the first component on a page | 61.3 KB | 16.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 25 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of options replaced |
| First on the page | 4.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.8 ms | options: first render, 553 nodes; update 0.4 ms |
| 1,000 items | 63 ms | options: first render, 5,503 nodes; update 4.4 ms |

1,000 items of options: 63 ms. It renders every item, so a first render passes 50 ms (a long task) at about 790 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label the group with what's being chosen: “View”, “Billing period” – it's what screen readers announce first.
- Keep option labels to one or two words, in the same form: “List, Grid, Board”, not “List, Show as grid”.
- Give every icon-only option an `ariaLabel`, and use icons alone only where they're well known.
- Use `badge` for one short tag (“Save 20%”), not for a sentence.

## Do and don't

### Do

- Show the result of the pick right away – the control implies an immediate change.
- Use `fullWidth` for two or three options that should fill a card or a form row.
- Set `name` to submit the pick with a form, through the hidden input.

### Don't

- Don't use it as a step indicator or for navigation between pages.
- Don't mix icon-only and labelled options in one control.
- Don't disable an option without saying why nearby – a gray option with no reason reads as broken.

## Related

- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- segmented-control selects on pointer release, not press.
