<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Switch

**Inputs & controls**

An accessible on/off setting

- **Element:** `<tc-switch>`
- **Size:** 6.7 KB gzip · 23.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/switch";` |
| React / Next.js | `import { Switch } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/switch";` · tags starting with tc- are custom elements |
| Angular | `import { Switch } from "@adamstavely/trenchcoat/angular/switch";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/switch";` |

## Example

The live example is in the gallery at `#/switch`, at 320 px, 480 px or full width.

## Overview

An accessible on/off setting.

### When to use

Use this component to an accessible on/off setting in an AI product's settings or setup workflow.

### When not to use

Use existing read-only run and output components when users only need to inspect results. Application callbacks are required for external operations.

## Usage

### HTML

```html
<tc-switch id="switch"></tc-switch>

<script type="module">
  import "@adamstavely/trenchcoat/switch";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#switch");
  el.value = value; // boolean, from your app
  el.addEventListener("tc-value-change", (e) => console.log(e.detail));
</script>
```

*Generated from the element's API and compiled in `examples/html` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### React / Next.js

```tsx
import { Switch } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
export function Example() { return <Switch label="Enable caching" defaultValue />; }
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/switch";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSwitch } from "@adamstavely/trenchcoat/switch";

defineProps<{ value: TcSwitch["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-switch :value="value" @tc-value-change="onValueChange"></tc-switch>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Switch } from "@adamstavely/trenchcoat/angular/switch";
import type { TcSwitch } from "@adamstavely/trenchcoat/switch";

@Component({
  selector: "app-switch-example",
  imports: [Switch],
  template: `<tc-switch [value]="value()" (tc-value-change)="onValueChange($event)"></tc-switch>`,
})
export class SwitchExample {
  readonly value = input.required<TcSwitch["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/switch";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSwitch } from "@adamstavely/trenchcoat/switch";

  let { value }: { value: TcSwitch["value"] } = $props();
  let el: TcSwitch;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-switch bind:this={el} {value}></tc-switch>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `"Switch"` | Visible heading or field label. |
| `value` | – | `boolean` | `false` | Current value; prevent tc-value-change to control it from the application. |
| `description` | `description` | `string` | `""` | Supporting explanation under the label. |
| `name` | `name` | `string` | `""` | Form field name; objects and arrays are serialized as JSON. |
| `disabled` | `disabled` | `boolean` | `false` | Disable editing and omit the control from form submission. |
| `required` | `required` | `boolean` | `false` | Require a nonempty value. |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | Proposed value (detail: { value }); cancelable to keep application control. |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `checkValidity()` | `void` | Check the current form validity. |
| `reportValidity()` | `void` | Show the current validation message and focus the first control. |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-switch :value="…">` | `<tc-switch [value]="…">` | `<tc-switch {value}>` |

*Also attributes: `label`, `description`, `name`, `disabled`, `required` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-switch id="switch"></tc-switch>

<script type="module">
  import "@adamstavely/trenchcoat/switch";

  const el = document.querySelector("#switch");
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
import { Switch } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Switch>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledSwitch({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <Switch {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/switch";
import type { TcSwitch } from "@adamstavely/trenchcoat/switch";

const props = defineProps<{ initial: TcSwitch["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcSwitch["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-switch :value="value" @tc-value-change="onValueChange"></tc-switch>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Switch } from "@adamstavely/trenchcoat/angular/switch";
import type { TcSwitch } from "@adamstavely/trenchcoat/switch";

@Component({
  selector: "app-controlled-switch",
  imports: [Switch],
  template: `<tc-switch [value]="value()" (tc-value-change)="onValueChange($event)"></tc-switch>`,
})
export class ControlledSwitch {
  readonly initial = input.required<TcSwitch["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcSwitch["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/switch";
  import type { TcSwitch } from "@adamstavely/trenchcoat/switch";

  let { initial }: { initial: TcSwitch["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcSwitch;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcSwitch["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-switch bind:this={el} {value}></tc-switch>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

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

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-switch :value="value" @tc-value-change="value = $event.detail.value"></tc-switch>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-switch [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-switch>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-switch bind:this={el} {value}></tc-switch>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-switch")` returns a `TcSwitch` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSwitch } from "@adamstavely/trenchcoat/switch";`
- **React / Next.js:** Props: `import type { SwitchProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Switch>`. The element class, for refs: `import type { TcSwitch } from "@adamstavely/trenchcoat/switch";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSwitch["value"]` with `import type { TcSwitch } from "@adamstavely/trenchcoat/switch";`
- **Angular:** The directive types the template: `[value]` takes `TcSwitch["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSwitch } from "@adamstavely/trenchcoat/switch";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSwitch } from "@adamstavely/trenchcoat/switch";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `boolean` | Current value when controlled by the application. |
| `defaultValue` | `boolean` | Initial value when the element owns its state. |
| `onChange` | `(value: boolean) => void` | Called with proposed edits; controlled values remain application-owned. |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `onChange`*

## Accessibility

### Keyboard

Tab and Shift+Tab move through fields and actions. Native inputs, selects and buttons keep their standard keyboard behavior. Multiline editors preserve Enter for new lines.

### Screen readers

Visible labels name native controls. Form panels group their controls under a heading and announce action results through a status region. Standard and Clean use the same semantics.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | internal/settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, internal/settings | Focus rings for keyboard users. |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | internal/settings | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 0.9 KB | 0.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **23.9 KB** | **6.7 KB** |
| With Lit – the first component on a page | 44.6 KB | 13.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 5 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |

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

Give the control a visible label and a short description where the meaning needs explanation. Use name for form submission. A secret field masks display, but its value remains available to the host application.

## Do and don't

### Do

Keep values application-owned with value/onChange, or use defaultValue for local editing. Use disabled while settings cannot be changed. For long operations, honor the provided AbortSignal and reject failed operations so the component offers a retry.

### Don't

Don't treat client-side validation or policy previews as backend enforcement. Don't store credentials in exported configuration; reference application-managed credentials instead.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price

## Changelog

- **Profile Menu:** an item with `checked` is an on/off switch – a button with `role="switch"` and `aria-checked`, with a small switch (the switch tokens, as on `tc-switch`) at the end of its row. Picking it by click, Enter or Space fires `tc-item-select` with `{ id, checked }`, `checked` being its new state; the page sets the item's `checked` (controlled). The detail type is exported as `ProfileMenuItemSelect`.
- **`examples/angular`:** uses the directives with no schema, and checks two things in Chromium: a handler runs once per event, and `[(ngModel)]` drives `tc-switch`.
