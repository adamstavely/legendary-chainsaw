<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Color Picker

**Inputs & controls** · New

Pick a colour – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields that convert as you type, an eyedropper where the browser has one, swatches, Copy, and the previous colour one press away

- **Element:** `<tc-color-picker>`
- **Size:** 18.0 KB gzip · 66.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/color-picker";` |
| React / Next.js | `import { ColorPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/color-picker";` · tags starting with tc- are custom elements |
| Angular | `import { ColorPicker } from "@adamstavely/trenchcoat/angular/color-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/color-picker";` |

## Example

The live example is in the gallery at `#/color-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A colour form control. A square sets saturation and brightness, a slider sets the hue and, with `alpha`, a second
slider sets the opacity. Below them the colour shows as HEX, RGB or CMYK fields – one set at a time, picked with a
segmented control – with Copy beside them. Where the browser has an eyedropper (Chromium), a button picks a colour
from anywhere on screen. A round chip shows the new colour beside the previous one, and pressing the previous half puts
it back. A row of swatches picks a colour from your palette in one press.

The value is a hex string: `#rrggbb`, or `#rrggbbaa` with `alpha`. CMYK is a plain, device-independent conversion from
sRGB – useful for talking about a colour, not a print-profiled (ICC) separation. Send real print work through your
print tool's colour management.

### When to use

- Brand, theme and chart colours in a settings or design-tool page.
- Anywhere people paste colours from other tools in hex, RGB or CMYK and need them in one form.
- Picking a colour from a screenshot or another window with the eyedropper.

### When not to use

- A choice between a few named options that happen to be colours (red / amber / green status) – use
  [Segmented Control](segmented-control.md) or a radio group, with words.
- A single number such as opacity on its own – use [Slider Field](slider-field.md) or [Number Field](number-field.md).
- Colour management for print – the CMYK here isn't profiled.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the palette icon, the heading and an optional description
2. **Square** `.ui-clp__area` – saturation left to right, brightness bottom to top, with its thumb `.ui-clp__thumb`
3. **Eyedropper** `.ui-clp__eyedropper` – shown only where the browser has one
4. **Preview** `.ui-clp__preview` – the previous colour `.ui-clp__chip--previous` beside the new one `.ui-clp__chip--new`
5. **Hue** `.ui-clp__hue` and **Opacity** `.ui-clp__alpha` – the sliders, in `.ui-clp__tracks`
6. **Format** `.ui-clp__formats` – HEX, RGB or CMYK
7. **Fields** `.ui-clp__fields` – one field per channel `.ui-clp__field`, and Copy `.ui-clp__copy`
8. **Error** `.ui-clp__error` – what's wrong with what was typed
9. **Swatches** `.ui-clp__swatches` – one `.ui-clp__swatch` per colour, the picked one ticked

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The picker is at most `--tc-clp-max-w` (360 px) wide; below 300 px the square gets shorter and the
fields wrap two to a row. Component tokens: `--tc-clp-area-h` (the square's height), `--tc-clp-thumb`,
`--tc-clp-track-h`, `--tc-clp-chip` and `--tc-clp-check` (the checkerboard behind see-through colours).

## Usage

### HTML

```html
<tc-color-picker id="brand" heading="Primary colour" value="#3a6df0" alpha></tc-color-picker>

<script type="module">
  import "@adamstavely/trenchcoat/color-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#brand");
  picker.swatches = [{ value: "#3a6df0", name: "Primary" }, { value: "#f97316", name: "Accent" }];
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.rgb, e.detail.cmyk));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ColorPicker } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function BrandColour({ saved }: { saved: string }) {
  const [value, setValue] = useState(saved);
  return (
    <ColorPicker
      title="Primary colour"
      value={value}
      onValueChange={setValue}
      previous={saved}
      swatches={[{ value: "#3a6df0", name: "Primary" }, { value: "#f97316", name: "Accent" }]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/color-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";

defineProps<{ swatches: TcColorPicker["swatches"]; labels: TcColorPicker["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-color-picker :swatches="swatches" :labels="labels" @tc-value-change="onValueChange"></tc-color-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ColorPicker } from "@adamstavely/trenchcoat/angular/color-picker";
import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";

@Component({
  selector: "app-color-picker-example",
  imports: [ColorPicker],
  template: `<tc-color-picker [swatches]="swatches()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-color-picker>`,
})
export class ColorPickerExample {
  readonly swatches = input.required<TcColorPicker["swatches"]>();
  readonly labels = input.required<TcColorPicker["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/color-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";

  let { swatches, labels }: { swatches: TcColorPicker["swatches"]; labels: TcColorPicker["labels"] } = $props();
  let el: TcColorPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-color-picker bind:this={el} {swatches} {labels}></tc-color-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default the labels' heading, "Colour" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `value` | `value` | `string` | `"#000000"` | The colour, "#rrggbb" – "#rrggbbaa" with `alpha`. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `previous` | `previous` | `string \| undefined` | `undefined` | The colour shown beside the new one, which the chip puts back; by default the value when the element first rendered |
| `format` | `format` | `ColorPickerFormat` | `"hex"` | Which fields show: "hex", "rgb" or "cmyk". Changed by the user unless a tc-format-change listener calls preventDefault() |
| `alpha` | `alpha` | `boolean` | `false` | Adds an opacity slider and field; the value then carries alpha ("#rrggbbaa") |
| `eyedropper` | `eyedropper` | `boolean` | `true` | Shows the eyedropper where the browser has one (Chromium); set false to hide it everywhere |
| `swatches` | – | `ColorPickerSwatch[]` | `[]` | Colours to pick from in one press: hex strings, or { value, name } |
| `disabled` | `disabled` | `boolean` | `false` | Nothing can be changed or focused except Copy |
| `readonly` | `readonly` | `boolean` | `false` | The colour shows and can be copied, but not changed |
| `labels` | – | `Partial<ColorPickerLabels>` | `{}` | The picker's words, merged over defaultColorPickerLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The colour changed ({ value, rgb, cmyk }: ColorPickerValueChange); cancelable – prevented, `value` stays as it was |
| `tc-format-change` | – | Yes | Another format was picked ({ format }: ColorPickerFormatChange); cancelable – prevented, `format` stays as it was |
| `tc-copy` | – | Yes | Copy was pressed ({ text, format }: ColorPickerCopy); cancelable – prevented, nothing is written to the clipboard |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-clp-max-w` | `360px` | both |
| `--tc-clp-area-h` | `176px` | both |
| `--tc-clp-thumb` | `16px` | both |
| `--tc-clp-track-h` | `12px` | both |
| `--tc-clp-chip` | `40px` | both |
| `--tc-clp-check` | `8px` | both |
| `--tc-clp-ring` | `2px` | both |

#### Design tokens it reads (53)

`--tc-action-ghost-bg-hover`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-quick`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-color-strong`, `--tc-shadow-control`, `--tc-space-1`, `--tc-space-12`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseColorHex(text: string \| null \| undefined): ColorPickerRgb \| null` | "#3a6df0", "3a6df0", "#36f", "#3a6df080" → rgb with alpha 0–1, or null when it isn't a hex colour |
| `colorToHex({ r, g, b, a }: ColorPickerRgb, withAlpha: unknown): void` | rgb → "#rrggbb", or "#rrggbbaa" when `withAlpha` |
| `colorRgbToCmyk({ r, g, b }: Pick<ColorPickerRgb, "r" \| "g" \| "b">): ColorPickerCmyk` | sRGB → CMYK percentages – a plain conversion, not a print profile |
| `colorCmykToRgb({ c, m, y, k }: ColorPickerCmyk): ColorPickerRgb` | CMYK percentages → sRGB, alpha 1 |

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
| `swatches` | `el.swatches = …;` | `<… swatches={…} />` | `<tc-color-picker :swatches="…">` | `<tc-color-picker [swatches]="…">` | `<tc-color-picker {swatches}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-color-picker :labels="…">` | `<tc-color-picker [labels]="…">` | `<tc-color-picker {labels}>` |

*Also attributes: `heading`, `description`, `value`, `previous`, `format`, `alpha`, `eyedropper`, `disabled` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-format-change` | Yes | `el.addEventListener("tc-format-change", (e) => …)` | `ref.current.addEventListener("tc-format-change", …)` | `@tc-format-change="…"` | `(tc-format-change)="…($event)"` | `el.addEventListener("tc-format-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyColor={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `format` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-format-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-color-picker id="color-picker"></tc-color-picker>

<script type="module">
  import "@adamstavely/trenchcoat/color-picker";

  const el = document.querySelector("#color-picker");
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
import "@adamstavely/trenchcoat/color-picker";
import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";

const props = defineProps<{ initial: TcColorPicker["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcColorPicker["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-color-picker :value="value" @tc-value-change="onValueChange"></tc-color-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ColorPicker } from "@adamstavely/trenchcoat/angular/color-picker";
import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";

@Component({
  selector: "app-controlled-color-picker",
  imports: [ColorPicker],
  template: `<tc-color-picker [value]="value()" (tc-value-change)="onValueChange($event)"></tc-color-picker>`,
})
export class ControlledColorPicker {
  readonly initial = input.required<TcColorPicker["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcColorPicker["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/color-picker";
  import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";

  let { initial }: { initial: TcColorPicker["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcColorPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcColorPicker["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-color-picker bind:this={el} {value}></tc-color-picker>
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
<tc-color-picker :value="value" @tc-value-change="value = $event.detail.value"></tc-color-picker>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-color-picker [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-color-picker>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-color-picker bind:this={el} {value}></tc-color-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-color-picker")` returns a `TcColorPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";`
- **React / Next.js:** Props: `import type { ColorPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ColorPicker>`. The element class, for refs: `import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcColorPicker["swatches"]` with `import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";`
- **Angular:** The directive types the template: `[swatches]` takes `TcColorPicker["swatches"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcColorPicker } from "@adamstavely/trenchcoat/color-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Colour" |
| `value` | `string` | The colour, "#rrggbb" ("#rrggbbaa" with `alpha`) – controlled when given |
| `defaultValue` | `string` | The colour on mount when `value` isn't controlled; by default black |
| `onValueChange` | `(value: string, detail: ColorPickerValueChange) => void` | The colour changed; `detail` has it as rgb and CMYK too |
| `format` | `ColorPickerFormat` | Which fields show – controlled when given |
| `defaultFormat` | `ColorPickerFormat` | The fields on mount when `format` isn't controlled; by default "hex" |
| `onFormatChange` | `(format: ColorPickerFormat) => void` | Another format was picked |
| `onCopyColor` | `(text: string, format: ColorPickerFormat) => void \| false` | Copy was pressed with the colour as text; return false to copy it yourself |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `format`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the square, eyedropper, previous colour, hue, opacity, format, fields, Copy and the swatches |
| ← / → on the square | Less or more saturation |
| ↑ / ↓ on the square | More or less brightness; Page Up / Page Down by 10 |
| ← / → or ↑ / ↓ on a slider | Moves the hue by a degree, or the opacity by 1 %; Page Up / Page Down by 10 |
| Shift with an arrow | Steps of 10 |
| Home / End | The start or end of a slider; no or full saturation on the square |
| ↑ / ↓ in a number field | Steps the number by 1 (10 with Shift) and applies it |
| Enter in a field | Applies what's typed |
| Escape in a field | Puts back what the field showed |
| Arrow keys in the swatches | Moves to the next swatch and picks it |

### Screen readers

The picker is a group named by its heading. The square, hue and opacity are sliders: the square says its saturation,
brightness and a colour word (“saturation 60%, brightness 40%, blue”) and is described by its keys; the hue says its
degrees and colour word. Each field is named in full (“Red”, “Cyan”, “Opacity”) though it shows a letter. A field that
can't be read is marked invalid and described by the error, which is also announced. The swatches are a radio group,
each named by its name and hex. The previous half of the chip is a button (“Previous colour #3a6df0, put it back”) and
the new half an image with the colour's hex. Copy announces what it copied.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| conic-gradient() | 69 (Edge 79) | 83 | 12.1 | 12.1 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.7 KB | 9.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **66.9 KB** | **18.0 KB** |
| With Lit – the first component on a page | 89.3 KB | 25.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of swatches replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.9 ms | swatches: first render, 69 nodes; update 0.2 ms |
| 1,000 items | 2.0 ms | swatches: first render, 69 nodes; update 0.5 ms |

What it renders doesn't grow with swatches (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout`, `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name swatches for their role – “Primary”, “Accent”, “Danger” – not their hue, so the names survive a rebrand.
- Set `previous` to the saved colour when editing one, so the chip compares against what's live.
- Pick the format your people paste most as the starting `format`.

## Do and don't

### Do

- Keep `value` in your form state and save it on submit; preventDefault() on tc-value-change to hold a colour while
  you check it (contrast against a background, say).
- Turn on `alpha` only when the colour may be see-through – it changes the value to eight hex digits.
- Pair the picker with a contrast check when the colour is for text.

### Don't

- Don't use the CMYK fields for print separations – they ignore paper and ink profiles.
- Don't rely on the eyedropper: it's missing in Firefox and Safari, so the fields and swatches must be enough.
- Don't use colour alone to carry meaning in what people pick; give the colour a name or role too.

## Related

- [Slider Field](slider-field.md) – A synchronized slider and numeric input
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Number Field](number-field.md) – A bounded numeric input with native validation
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar

## Changelog

- `tc-color-picker` – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields, an eyedropper where the browser has one (`EyeDropper`), swatches and Copy. A form control, so Angular gets a ValueAccessor. CMYK is a plain device-independent conversion, not an ICC print profile.
