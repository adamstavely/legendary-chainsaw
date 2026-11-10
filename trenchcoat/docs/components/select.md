<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Select

**Inputs & controls** · New

A plain single-choice dropdown – a secondary-button trigger with the chosen option opens a list with a check on it, optional descriptions and disabled options, arrow keys and type-ahead

- **Element:** `<tc-select>`
- **Size:** 7.7 KB gzip · 24.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/select";` |
| React / Next.js | `import { Select } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/select";` · tags starting with tc- are custom elements |
| Angular | `import { Select } from "@adamstavely/trenchcoat/angular/select";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/select";` |

## Example

The live example is in the gallery at `#/select`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A plain single-choice dropdown. The trigger is a secondary button showing the chosen option and a chevron, so it sits
in a page header beside other buttons; it opens a list of options under it, with a check on the chosen one and an
optional description line under each. Options can be disabled: they show, but can't be picked and the keys skip them.

### When to use

- Picking one value from a short, fixed list that doesn't all fit on screen: a reporting period, a sort order, a team.
- A filter or view setting in a page or card header, next to `button`s.
- Inside a form, with `label-visible` and `name`.

### When not to use

- Two to five options that fit side by side – use [Segmented Control](segmented-control.md).
- A long list people search by typing, or several values at once – use [Combobox](combobox.md).
- Options nested in a hierarchy – use [Tree Select](tree-select.md).
- Choosing an AI model with its settings – use [Model Picker](model-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-select__label` – shown above the trigger with `label-visible`, or before it on the same line with
2. **Trigger** `.ui-select__trigger` – the chosen option's label, or the placeholder, and a chevron
3. **List** `.ui-select__list` – the options, in a popover under the trigger
4. **Option** `.ui-select__option` – label, optional description, and a check on the chosen one

## Looks

Both looks use the same trigger, list and keys. The trigger takes the secondary button's tokens and the list the menu
pattern's, so Standard's is a white button with a ring and a 32 px height, Clean's a 28 px button with a hairline
shadow; the visible label follows the fields' labels in each look.

## Usage

### HTML

```html
<tc-select id="period" label="Reporting period" value="this-month" align="end"></tc-select>

<script type="module">
  import "@adamstavely/trenchcoat/select";
  import "@adamstavely/trenchcoat/tokens.css";

  const select = document.querySelector("#period");
  select.options = [
    { value: "this-month", label: "This month" },
    { value: "last-month", label: "Last month" },
    { value: "this-quarter", label: "This quarter" },
  ];
  select.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Select, type SelectOption } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const periods: SelectOption[] = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "this-quarter", label: "This quarter" },
];

export function ReportingPeriod() {
  const [period, setPeriod] = useState("this-month");
  return <Select label="Reporting period" options={periods} value={period} onChange={setPeriod} align="end" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/select";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSelect } from "@adamstavely/trenchcoat/select";

defineProps<{ options: TcSelect["options"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-select :options="options" @tc-value-change="onValueChange"></tc-select>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Select } from "@adamstavely/trenchcoat/angular/select";
import type { TcSelect } from "@adamstavely/trenchcoat/select";

@Component({
  selector: "app-select-example",
  imports: [Select],
  template: `<tc-select [options]="options()" (tc-value-change)="onValueChange($event)"></tc-select>`,
})
export class SelectExample {
  readonly options = input.required<TcSelect["options"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/select";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSelect } from "@adamstavely/trenchcoat/select";

  let { options }: { options: TcSelect["options"] } = $props();
  let el: TcSelect;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-select bind:this={el} {options}></tc-select>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | – | `SelectOption[]` | `[]` | The options, in list order |
| `value` | `value` | `string` | `""` | The chosen option's value – unset or unknown shows the placeholder |
| `label` | `label` | `string` | `""` | The control's accessible name; shown above the trigger with `label-visible` |
| `labelVisible` | `label-visible` | `boolean` | `false` | Show `label` above the trigger instead of only to screen readers |
| `labelPlacement` | `label-placement` | `"top" \| "start"` | `"top"` | Where the visible label sits, with `label-visible` only: "top", above the trigger (default), or "start", before it on the same line in the caption style. Without `label-visible` it changes nothing |
| `placeholder` | `placeholder` | `string` | `"Choose…"` | What the trigger says while no option is chosen |
| `open` | `open` | `boolean` | `false` | Whether the list is open |
| `align` | `align` | `"start" \| "end"` | `"start"` | Which edge of the trigger the list lines up with |
| `disabled` | `disabled` | `boolean` | `false` | Turns the control off; the hidden form input is disabled too |
| `name` | `name` | `string \| undefined` | `undefined` | Submits the chosen value with a native form, through a hidden input |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An option was picked (`{ value: string }`: SelectValueChange); cancelable – prevent it to keep `value` (controlled use) |
| `tc-open-change` | – | Yes | The list opens or closes (`{ open: boolean }`: SelectOpenChange); cancelable |

#### Design tokens it reads (56)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`, `--tc-z-dropdown`

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-select :options="…">` | `<tc-select [options]="…">` | `<tc-select {options}>` |

*Also attributes: `value`, `label`, `label-visible`, `label-placement`, `placeholder`, `open`, `align`, `disabled` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `value` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-select id="select"></tc-select>

<script type="module">
  import "@adamstavely/trenchcoat/select";

  const el = document.querySelector("#select");
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
import { Select } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Select>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledSelect({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <Select {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/select";
import type { TcSelect } from "@adamstavely/trenchcoat/select";

const props = defineProps<{ initial: TcSelect["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcSelect["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-select :value="value" @tc-value-change="onValueChange"></tc-select>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Select } from "@adamstavely/trenchcoat/angular/select";
import type { TcSelect } from "@adamstavely/trenchcoat/select";

@Component({
  selector: "app-controlled-select",
  imports: [Select],
  template: `<tc-select [value]="value()" (tc-value-change)="onValueChange($event)"></tc-select>`,
})
export class ControlledSelect {
  readonly initial = input.required<TcSelect["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcSelect["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/select";
  import type { TcSelect } from "@adamstavely/trenchcoat/select";

  let { initial }: { initial: TcSelect["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcSelect;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcSelect["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-select bind:this={el} {value}></tc-select>
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
<tc-select :value="value" @tc-value-change="value = $event.detail.value"></tc-select>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-select [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-select>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-select bind:this={el} {value}></tc-select>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-select")` returns a `TcSelect` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSelect } from "@adamstavely/trenchcoat/select";`
- **React / Next.js:** Props: `import type { SelectProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Select>`. The element class, for refs: `import type { TcSelect } from "@adamstavely/trenchcoat/select";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSelect["options"]` with `import type { TcSelect } from "@adamstavely/trenchcoat/select";`
- **Angular:** The directive types the template: `[options]` takes `TcSelect["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSelect } from "@adamstavely/trenchcoat/select";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSelect } from "@adamstavely/trenchcoat/select";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `options` | `SelectOption[]` | The options, in list order |
| `value` | `string` | The chosen option's value (controlled when defined) |
| `defaultValue` | `string` | The value chosen at first when uncontrolled – none (the placeholder) by default |
| `onChange` | `(value: string) => void` | Called with the value of the option that was picked |
| `open` | `boolean` | Controlled open state of the list |
| `defaultOpen` | `boolean` | Whether the list starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | Called when the list opens or closes |

*Renamed or hidden on the wrapper: `options`, `value`, `defaultValue`, `onChange`, `open`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger: opens the list with focus on it, or closes it. In the list: picks the active option and closes |
| ↓ / ↑ | On the trigger: opens the list. In the list: moves to the next or previous option, skipping disabled ones, wrapping round |
| Home / End | In the list: first or last option that can be picked |
| Letters | In the list: jumps to the next option starting with them; letters typed quickly search together |
| Escape | Closes the list and returns focus to the trigger |
| Tab | Closes the list and moves on |

### Screen readers

The trigger is a button with `aria-haspopup="listbox"` and `aria-expanded`. Its name is the label and the chosen
option: “Reporting period: This quarter” (the label in screen-reader-only text, or the visible label through
`aria-labelledby`), so the visible words are part of the name. The list is a `listbox` named by the label; it keeps
focus and `aria-activedescendant` points at the active option. Options are `option`s with `aria-selected`, and
disabled ones carry `aria-disabled`. Option ids come from their position, never from their values.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.7 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.3 KB** | **7.7 KB** |
| With Lit – the first component on a page | 45.0 KB | 14.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 35 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of options replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.6 ms | options: first render, 441 nodes; update 0.7 ms |
| 1,000 items | 33 ms | options: first render, 4,341 nodes; update 2.4 ms |

1,000 items of options: 33 ms, 4,341 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`, `window resize`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write option labels short and parallel: “This month”, “Last month”, “This quarter”.
- Use `description` for what isn't obvious from the label – a date range, why an option is disabled.
- Give every select a `label`, even when it isn't shown.
- Keep the placeholder a prompt (“Choose…”, “Any team”), not an option.

## Do and don't

### Do

- Use `align="end"` when the select sits at the right edge of a header.
- Show the label (`label-visible`) inside forms, where the trigger alone doesn't say what it sets.
- In a toolbar or a page header, put the label on the trigger's line with `label-visible label-placement="start"`: a
  small caption (the `--tc-caption-*` tokens), vertically centred, with the list still opening under the trigger. The
  visible label stays optional – `label-placement` does nothing without `label-visible` (false by default), so removing
  `label-visible` turns it off and the label is the accessible name only, with the trigger unchanged.
- Control `value` and prevent `tc-value-change` when the page decides whether a pick applies.

### Don't

- Don't use it for actions – a menu of commands belongs in a button's menu, not a select.
- Don't list more than about fifteen options; offer a `combobox` to search instead.
- Don't disable an option without saying why in its description.

## Related

- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Tree Select](tree-select.md) – Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price

## Changelog

- **Select:** `tc-select` (`@adamstavely/trenchcoat/select`, React `Select`, Angular `Select` from `@adamstavely/trenchcoat/angular/select`), a plain single-choice dropdown for a page or card header, or a form. - The trigger is a secondary button (the `--tc-action-secondary-*` and `--tc-control-*-md` tokens, so it lines up with the buttons beside it) showing the chosen option's label, or `placeholder` (“Choose…”) while `value` is unset or unknown, and a chevron. The list under it is the menu pattern: a `listbox` of `option`s with `aria-selected`, a check on the chosen one and an optional `description` line; `disabled` options show but can't be picked. - `options: SelectOption[]` (`{ value, label, description?, disabled? }`), `value`, `label` (the accessible name – shown above the trigger with `label-visible`, else read by screen readers only), `placeholder`, `open`, `align="start" | "end"`, `disabled`, `name` (a hidden input for native forms) and `look`. - `tc-value-change` (`{ value }`) and `tc-open-change` (`{ open }`) are cancelable: prevented, `value` or `open` stays (controlled use). Angular gets a value accessor for `ngModel` and reactive forms. - ↓ / ↑ on the trigger open the list; in it the arrows, Home and End move past disabled options, Enter or Space picks, letters jump to the next option starting with them, Esc closes and returns focus to the trigger, Tab or a click outside closes. Near the edge of the screen the list slides in to stay whole. Option ids come from their position, never from their values.
