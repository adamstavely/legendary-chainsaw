<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Gauge

**Data & charts** · New

One value against its range as a 270° dial, a half dial or a bar – the value in big type with the band it's in, bands and ticks round it, a target line and the change since last time; optionally a slider you drag or move with the keys

- **Element:** `<tc-gauge>`
- **Size:** 8.8 KB gzip · 28.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/gauge";` |
| React / Next.js | `import { Gauge } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/gauge";` · tags starting with tc- are custom elements |
| Angular | `import { Gauge } from "@adamstavely/trenchcoat/angular/gauge";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/gauge";` |

## Example

The live example is in the gallery at `#/gauge`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One value against its range: a 270° dial, a half dial, a straight bar, or a 270° ring of tick marks lit up to the
value (`variant="ticks"`). The value is in big type in the middle, with
the band it falls in under it – “Warning”, in the band's colour with a mark. The bands themselves (normal, warning,
critical …) run round the outside with a tick between each, a target is a line across the dial, and `previous` adds
the change under it, coloured by whether it went the good way. A new value sweeps to its place; on the ticks ring the
marks light (or go out) one after another from the old value to the new. With `editable` it's a slider the user can
drag or move with the arrow keys – on every shape, the ticks ring included.

### When to use

- A reading against limits: a temperature, a pressure, a load, a fill level.
- A single figure on a dashboard where the band it's in matters more than the exact number.
- Setting a threshold by feel, with `editable`, where the bands give context.
- A progress-like reading on a dashboard tile, where the ticks ring reads at a glance and looks quieter than a solid
  arc.

### When not to use

- A share of a whole, with a breakdown beneath – use [Coverage Ring](coverage-ring.md).
- Whether trust in a model matches how it performs – use [Reliance Gauge](reliance-gauge.md).
- Usage against a quota or plan, with what's left – use [Usage Meter](usage-meter.md).
- Entering an exact number in a form – use [Slider Field](slider-field.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-gau__label` – what it measures, naming the meter
2. **Dial** `.ui-gau__svg` – the track and the fill to the value, for `arc` and `semicircle`
3. **Bands** `.ui-gau__band` – the bands round the outside, with `.ui-gau__tick` between them
4. **Target** `.ui-gau__target` – a line across the dial at `target`
5. **Value** `.ui-gau__value` – the value in big type
6. **Band** `.ui-gau__band-label` – the band the value is in, with a mark in its colour
7. **Ticks** `.ui-gau__ticks` – for `ticks`, the ring of `.ui-gau__mark`s, those up to the value lit (`data-on`)
8. **Bar** `.ui-gau__rail` – the track, fill, bands and target for `bar`
9. **Change** `.ui-gau__change` – the change since `previous`
10. **Target text** `.ui-gau__target-text` – the target's name and value

## Looks

Standard is a white card on a gray tray; Clean is one white card. The dial is the same in both. The fill takes the
current band's solid status colour (`--tc-gau-ink` without bands, from `tone`), and `size` sets the dial to 112, 168 or
216 px through `--tc-gau-dial`, which a page can also set directly. On the ticks ring the lit marks take the same
colour and the unlit ones the meter's track; `ticks` sets how many marks there are (2–120), and by default the count
fits `size` – about one per 8 px of ring, 25 at `sm`, 38 at `md` and 48 at `lg`. With reduced motion the marks change
at once.

## Usage

### HTML

```html
<tc-gauge id="freezer" label="Freezer B-3" unit="°C" min="-90" max="-60" value="-78" previous-label="the last reading" good="down"></tc-gauge>

<script type="module">
  import "@adamstavely/trenchcoat/gauge";
  import "@adamstavely/trenchcoat/tokens.css";

  const gauge = document.querySelector("#freezer");
  gauge.bands = [
    { to: -75, tone: "success", label: "In range" },
    { to: -68, tone: "warning", label: "Warming" },
    { to: -60, tone: "danger", label: "Too warm" },
  ];
  gauge.previous = -80;
  gauge.target = -70;
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Gauge } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AlarmLevel() {
  const [value, setValue] = useState(-70);
  return <Gauge label="Alarm level" variant="bar" unit="°C" min={-90} max={-60} step={0.5} editable value={value} onValueChange={setValue} />;
}

export function SequencerRun() {
  return <Gauge label="Sequencer run" description="Flow cell 2" variant="ticks" unit="%" value={64} target={80} targetLabel="Today's goal" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/gauge";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGauge } from "@adamstavely/trenchcoat/gauge";

defineProps<{ bands: TcGauge["bands"]; format: TcGauge["format"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-gauge :bands="bands" :format="format" @tc-value-change="onValueChange"></tc-gauge>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Gauge } from "@adamstavely/trenchcoat/angular/gauge";
import type { TcGauge } from "@adamstavely/trenchcoat/gauge";

@Component({
  selector: "app-gauge-example",
  imports: [Gauge],
  template: `<tc-gauge [bands]="bands()" [format]="format()" (tc-value-change)="onValueChange($event)"></tc-gauge>`,
})
export class GaugeExample {
  readonly bands = input.required<TcGauge["bands"]>();
  readonly format = input.required<TcGauge["format"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gauge";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGauge } from "@adamstavely/trenchcoat/gauge";

  let { bands, format }: { bands: TcGauge["bands"]; format: TcGauge["format"] } = $props();
  let el: TcGauge;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-gauge bind:this={el} {bands} {format}></tc-gauge>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `"Gauge"` | What it measures, named above the dial – the meter's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the label |
| `value` | `value` | `number` | `0` | The value. Changed by the user when editable, unless a tc-value-change listener calls preventDefault() |
| `min` | `min` | `number` | `0` | The start of the range |
| `max` | `max` | `number` | `100` | The end of the range |
| `bands` | – | `GaugeBand[]` | `[]` | The bands from `min` up – each runs to its `to`, the last to `max`; none draws the dial in one colour |
| `target` | `target` | `number \| undefined` | `undefined` | A value to mark across the dial, e.g. a set point |
| `targetLabel` | `target-label` | `string` | `"Target"` | What the target is called |
| `previous` | `previous` | `number \| undefined` | `undefined` | The value before, for the change under the dial |
| `previousLabel` | `previous-label` | `string` | `"last time"` | When the previous value was, after "from": "the last reading" |
| `good` | `good` | `"up" \| "down" \| undefined` | `undefined` | Which way is good, to colour the change: "up" or "down"; unset leaves it neutral |
| `variant` | `variant` | `GaugeVariant` | `"arc"` | The shape: a 270° dial, a half dial, a straight bar, or a 270° ring of tick marks lit up to the value ("ticks") |
| `size` | `size` | `"sm" \| "md" \| "lg"` | `"md"` | The size of the dial |
| `ticks` | `ticks` | `number \| undefined` | `undefined` | How many tick marks the ticks ring has (2–120); by default as many as fit the size |
| `tone` | `tone` | `GaugeTone` | `"info"` | The colour without bands |
| `unit` | `unit` | `string \| undefined` | `undefined` | The unit after the number: "%", "°C", "GB" |
| `format` | – | `((value: number) => string) \| undefined` | `undefined` | Writes a value, e.g. (v) => `${v} of 40 racks`; replaces the number and `unit` |
| `editable` | `editable` | `boolean` | `false` | Makes it a slider the user can move |
| `step` | `step` | `number` | `1` | How far an arrow key moves it, when editable |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The value was moved, when editable ({ value }: GaugeValueChange); cancelable – prevented, `value` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-gau-dial` | `168px` | both |
| `--tc-gau-ink` | `var(--tc-status-info-solid)` | both |
| `--tc-gau-band` | `var(--tc-text-muted)` | both |
| `--tc-gau-tick-w` | `2` | both |
| `--tc-gau-delay` | `0` | both |

#### Design tokens it reads (53)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-gau-word`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `bands` | `el.bands = …;` | `<… bands={…} />` | `<tc-gauge :bands="…">` | `<tc-gauge [bands]="…">` | `<tc-gauge {bands}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-gauge :format="…">` | `<tc-gauge [format]="…">` | `<tc-gauge {format}>` |

*Also attributes: `label`, `description`, `value`, `min`, `max`, `target`, `target-label`, `previous` and 10 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-gauge id="gauge"></tc-gauge>

<script type="module">
  import "@adamstavely/trenchcoat/gauge";

  const el = document.querySelector("#gauge");
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
import "@adamstavely/trenchcoat/gauge";
import type { TcGauge } from "@adamstavely/trenchcoat/gauge";

const props = defineProps<{ initial: TcGauge["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcGauge["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-gauge :value="value" @tc-value-change="onValueChange"></tc-gauge>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Gauge } from "@adamstavely/trenchcoat/angular/gauge";
import type { TcGauge } from "@adamstavely/trenchcoat/gauge";

@Component({
  selector: "app-controlled-gauge",
  imports: [Gauge],
  template: `<tc-gauge [value]="value()" (tc-value-change)="onValueChange($event)"></tc-gauge>`,
})
export class ControlledGauge {
  readonly initial = input.required<TcGauge["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcGauge["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gauge";
  import type { TcGauge } from "@adamstavely/trenchcoat/gauge";

  let { initial }: { initial: TcGauge["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcGauge;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcGauge["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-gauge bind:this={el} {value}></tc-gauge>
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
<tc-gauge :value="value" @tc-value-change="value = $event.detail.value"></tc-gauge>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-gauge [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-gauge>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-gauge bind:this={el} {value}></tc-gauge>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-gauge")` returns a `TcGauge` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGauge } from "@adamstavely/trenchcoat/gauge";`
- **React / Next.js:** Props: `import type { GaugeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Gauge>`. The element class, for refs: `import type { TcGauge } from "@adamstavely/trenchcoat/gauge";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGauge["bands"]` with `import type { TcGauge } from "@adamstavely/trenchcoat/gauge";`
- **Angular:** The directive types the template: `[bands]` takes `TcGauge["bands"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGauge } from "@adamstavely/trenchcoat/gauge";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGauge } from "@adamstavely/trenchcoat/gauge";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `number` | The value – controlled when given |
| `defaultValue` | `number` | The value on mount when `value` isn't controlled |
| `onValueChange` | `(value: number) => void` | The value was moved, when editable |

*Renamed or hidden on the wrapper: `value`, `children`*

## Accessibility

### Keyboard

Only when `editable`, where it's one tab stop.

| Key | What it does |
|---|---|
| ← / ↓ | Lowers the value by `step` |
| → / ↑ | Raises the value by `step` |
| Page Down / Page Up | Lowers or raises it by ten steps |
| Home / End | Goes to `min` or `max` |

Pressing or dragging along the dial, the ticks ring or the bar sets the value too.

### Screen readers

It's a `meter` – a `slider` when editable – named by its label, with `aria-valuemin`, `aria-valuemax` and
`aria-valuenow`, and the value read with its band: “72%, Warning”. The drawing and the big number repeat that, so
they're hidden; the change (“Up 4% from last time”) and the target (“Target 80%”) are plain text after it.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.8 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.6 KB** | **8.8 KB** |
| With Lit – the first component on a page | 48.1 KB | 15.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 22 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of bands replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.7 ms | bands: first render, 24 nodes; update 0.3 ms |
| 1,000 items | 0.9 ms | bands: first render, 24 nodes; update 0.6 ms |

1,000 items of bands: 0.9 ms, 24 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Give each band a word that says what it means for the reader – “In range”, “Too warm” – not just a colour name.
- List bands from `min` upwards; each runs to its `to`, and the last one to `max`.
- Set `unit` – “%”, “°C”, “GB” – or `format` for anything else.
- Name when `previous` was with `previous-label`: “the last reading”, “last month”.

## Do and don't

### Do

- Set `good` when a change has a direction that's welcome, so the change is coloured.
- Use the bar for narrow spaces and lists; the dial where there's room for it to be the focus.
- Leave `ticks` unset unless the count means something (say, one mark per rack); the default keeps the marks evenly
  spaced at every size.
- Show the target when the reading is being held to one.

### Don't

- Don't use a gauge for a value without a meaningful range – a plain number reads better.
- Don't put several gauges in a row for things people need to compare – use a bar chart.
- Don't use colour alone for the band – keep the band's word.
- Don't set so many ticks on a small dial that they run together; the count is capped at 120.

## Related

- [Coverage Ring](coverage-ring.md) – One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Slider Field](slider-field.md) – A synchronized slider and numeric input

## Changelog

- **Sparkline** (`tc-sparkline`), **Heatmap** (`tc-heatmap`) and **Gauge** (`tc-gauge`) – an inline trend, a shaded matrix with legend, selection and table view, and a value against its bands as a dial, half dial or bar (optionally a slider).
