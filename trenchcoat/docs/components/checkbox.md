<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Checkbox

**Inputs & controls**

A form-associated boolean choice

- **Element:** `<tc-checkbox>`
- **Size:** 7.6 KB gzip · 28.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/checkbox";` |
| React / Next.js | `import { Checkbox } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/checkbox";` · tags starting with tc- are custom elements |
| Angular | `import { Checkbox } from "@adamstavely/trenchcoat/angular/checkbox";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/checkbox";` |

## Example

The live example is in the gallery at `#/checkbox`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A yes / no choice that's saved with a form: a box, its label and an optional second line. Three extras cover the cases
a bare checkbox doesn't:

- **Partly checked.** `indeterminate` shows a dash – a Select all over a list where only some items are picked.
  Clicking it checks it.
- **Card.** `variant="card"` draws the choice as a bordered row you can click anywhere on, tinted once it's checked –
  for a short list of options with a line of explanation each.
- **Error.** `error-message`, or a required box left empty when the form checks it, shows an error under the choice.

The check draws itself when it's ticked.

### When to use

- Yes or no choices that are saved with a form: agreeing to terms, opting in, picking several items of a list.
- Select all over a list, with the partly checked state while only some of it is picked.
- A handful of options with a sentence each, as card rows.

### When not to use

- A setting that applies the moment it's flipped – use the Switch.
- One choice out of several – use the Radio Group, the Segmented Control or the Select.
- A long list to filter and pick from – use the Combobox or the Filter Menu.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-checkbox__row` – the label element: the box and the words, clickable as one; a bordered card with
2. **Box** `.ui-checkbox__box` – the native checkbox, drawn with tokens.
3. **Tick** `.ui-checkbox__tick` – the check (drawn in when ticked) and the dash for partly checked.
4. **Label** `.ui-checkbox__label` – names the checkbox.
5. **Second line** `.ui-checkbox__description` – describes it.
6. **Error** `.ui-checkbox__error` – what's wrong, under the row.

## Looks

Standard fills a ticked box with the inverse surface; Clean fills it with the accent. Both draw the card row the same
way: a hairline edge that turns into the selected border and an accent tint once checked. `--tc-checkbox-tick` sets the
size of the check and the dash.

## Usage

### HTML

```html
<tc-checkbox id="all" label="Select all" description="12 of 30 vendors picked" indeterminate></tc-checkbox>
<tc-checkbox id="digest" variant="card" label="Weekly digest" description="Every Monday at 8:00"></tc-checkbox>

<script type="module">
  import "@adamstavely/trenchcoat/checkbox";
  import "@adamstavely/trenchcoat/tokens.css";

  const all = document.querySelector("#all");
  all.addEventListener("tc-value-change", (e) => console.log("select all", e.detail.value));
  document.querySelector("#digest").addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Checkbox } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Example() {
  const [picked, setPicked] = useState(12);
  const all = picked === 30;
  return (
    <>
      <Checkbox label="Select all" description={`${picked} of 30 vendors picked`} value={all} indeterminate={picked > 0 && !all} onChange={(v) => setPicked(v ? 30 : 0)} />
      <Checkbox variant="card" label="Weekly digest" description="Every Monday at 8:00" defaultValue />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/checkbox";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";

defineProps<{ value: TcCheckbox["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-checkbox :value="value" @tc-value-change="onValueChange"></tc-checkbox>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Checkbox } from "@adamstavely/trenchcoat/angular/checkbox";
import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";

@Component({
  selector: "app-checkbox-example",
  imports: [Checkbox],
  template: `<tc-checkbox [value]="value()" (tc-value-change)="onValueChange($event)"></tc-checkbox>`,
})
export class CheckboxExample {
  readonly value = input.required<TcCheckbox["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/checkbox";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";

  let { value }: { value: TcCheckbox["value"] } = $props();
  let el: TcCheckbox;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-checkbox bind:this={el} {value}></tc-checkbox>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `indeterminate` | `indeterminate` | `boolean` | `false` | Partly checked: a dash for a Select all over a list that's only partly picked; clicking it checks it |
| `variant` | `variant` | `CheckboxVariant` | `"default"` | "default" (a box and its label) or "card" (a bordered row, clickable anywhere) |
| `errorMessage` | `error-message` | `string` | `""` | An error shown under the checkbox, e.g. "Accept the terms to go on"; empty shows none |
| `label` | `label` | `string` | `"Checkbox"` | Visible heading or field label. |
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

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-checkbox-tick` | `12px` | both |

#### Design tokens it reads (28)

`--tc-accent`, `--tc-accent-subtle`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-line-height-snug`, `--tc-radius-lg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-surface-inverse`, `--tc-surface-raised`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-checkbox :value="…">` | `<tc-checkbox [value]="…">` | `<tc-checkbox {value}>` |

*Also attributes: `indeterminate`, `variant`, `error-message`, `label`, `description`, `name`, `disabled`, `required` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-checkbox id="checkbox"></tc-checkbox>

<script type="module">
  import "@adamstavely/trenchcoat/checkbox";

  const el = document.querySelector("#checkbox");
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
import { Checkbox } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Checkbox>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledCheckbox({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <Checkbox {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/checkbox";
import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";

const props = defineProps<{ initial: TcCheckbox["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcCheckbox["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-checkbox :value="value" @tc-value-change="onValueChange"></tc-checkbox>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Checkbox } from "@adamstavely/trenchcoat/angular/checkbox";
import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";

@Component({
  selector: "app-controlled-checkbox",
  imports: [Checkbox],
  template: `<tc-checkbox [value]="value()" (tc-value-change)="onValueChange($event)"></tc-checkbox>`,
})
export class ControlledCheckbox {
  readonly initial = input.required<TcCheckbox["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcCheckbox["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/checkbox";
  import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";

  let { initial }: { initial: TcCheckbox["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcCheckbox;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcCheckbox["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-checkbox bind:this={el} {value}></tc-checkbox>
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
<tc-checkbox :value="value" @tc-value-change="value = $event.detail.value"></tc-checkbox>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-checkbox [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-checkbox>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-checkbox bind:this={el} {value}></tc-checkbox>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-checkbox")` returns a `TcCheckbox` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";`
- **React / Next.js:** Props: `import type { CheckboxProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Checkbox>`. The element class, for refs: `import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCheckbox["value"]` with `import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";`
- **Angular:** The directive types the template: `[value]` takes `TcCheckbox["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCheckbox } from "@adamstavely/trenchcoat/checkbox";`

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

| Key | Does |
| --- | --- |
| Tab / Shift+Tab | Moves to and from the checkbox |
| Space | Checks or unchecks it; a partly checked box becomes checked |

### Screen readers

A native checkbox named by its label (`aria-labelledby`) and described by its second line and its error
(`aria-describedby`). A partly checked box reads as "mixed". With an error it's `aria-invalid`. The tick is decorative.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | internal/settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, internal/settings | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | internal/settings | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 7.8 KB | 2.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.9 KB** | **7.6 KB** |
| With Lit – the first component on a page | 49.6 KB | 14.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 9 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |

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

- Write the label as the thing that becomes true: "Include citations", "Email me the weekly digest".
- Keep the second line to what the person needs to decide – what it costs, when it happens.
- Say how to fix an error: "Accept the terms to go on", not "Invalid".

## Do and don't

### Do

- Use the partly checked state only for a parent over a list, and set it from the list's own state.
- Use card rows for two to six options with a line each.
- Keep `value` application-owned with `value` and `onChange`, or start it with `defaultValue`.

### Don't

- Don't use a checkbox for something that takes effect at once – that's a Switch.
- Don't leave `indeterminate` on once every item or none is picked.
- Don't treat a checked box as consent the server can trust; check it there too.

## Related

- [Switch](switch.md) – An accessible on/off setting
- [Radio Group](radio-group.md) – A native keyboard-operated single choice
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Terms Dialog](terms-dialog.md) – Agreeing to terms in a modal designed for reading – version and date, a jump list, what changed since you last agreed, required and optional consents, and Accept that says why it waits
