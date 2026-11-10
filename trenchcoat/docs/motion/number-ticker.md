<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Number Ticker

**Motion**

Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once

- **Element:** `<tc-number-ticker>`
- **Size:** 5.6 KB gzip · 14.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/number-ticker";` |
| React / Next.js | `import { NumberTicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/number-ticker";` · tags starting with tc- are custom elements |
| Angular | `import { NumberTicker } from "@adamstavely/trenchcoat/angular/number-ticker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/number-ticker";` |

## Example

The live example is in the gallery at `#/motion/number-ticker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A number that changes like an odometer. Every digit rolls to its new value – up when the number grows, down when it
shrinks – so people see a figure move rather than jump, and can tell at a glance whether it went up or down. The
first time it scrolls into view it counts in from zero. Formatting comes from `Intl.NumberFormat`, so currency
signs, separators and percent signs stay where they are and only the digits move.

### When to use

- Headline figures on a dashboard or landing page: revenue, users, a conversion rate.
- A live number that updates every few seconds, where the change itself is worth noticing.
- Counters people have just affected – a total after they add an item.

### When not to use

- A number inside a chart with its own axis and trend – use [KPI Chart](../components/kpi-chart.md).
- Usage against a limit, where the bar matters more than the digits – use [Usage Meter](../components/usage-meter.md).
- Text that should arrive with motion, not a number – use [Text Reveal](text-reveal.md).
- Numbers in tables and forms that people read and compare row by row – plain text is faster to read.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Digit column** `.ui-nt__col` – one digit, rolling through 0–9
2. **Separator** `.ui-nt__static` – a currency sign, comma, point or percent sign that stays still

## Usage

### HTML

```html
<p>Revenue <tc-number-ticker id="revenue" value="128450" locale="en-US"></tc-number-ticker></p>

<script type="module">
  import "@adamstavely/trenchcoat/number-ticker";
  import "@adamstavely/trenchcoat/tokens.css";

  const ticker = document.querySelector("#revenue");
  ticker.format = { style: "currency", currency: "USD", maximumFractionDigits: 0 };
  setTimeout(() => (ticker.value = 131200), 3000);
</script>
```

### React / Next.js

```tsx
import { NumberTicker } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Revenue({ amount }: { amount: number }) {
  return (
    <p>
      Revenue{" "}
      <NumberTicker value={amount} locale="en-US" format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }} />
    </p>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/number-ticker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";

defineProps<{ format: TcNumberTicker["format"] }>();
</script>

<template>
  <tc-number-ticker :format="format"></tc-number-ticker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { NumberTicker } from "@adamstavely/trenchcoat/angular/number-ticker";
import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";

@Component({
  selector: "app-number-ticker-example",
  imports: [NumberTicker],
  template: `<tc-number-ticker [format]="format()"></tc-number-ticker>`,
})
export class NumberTickerExample {
  readonly format = input.required<TcNumberTicker["format"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/number-ticker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";

  let { format }: { format: TcNumberTicker["format"] } = $props();
  let el: TcNumberTicker;
</script>

<tc-number-ticker bind:this={el} {format}></tc-number-ticker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `number` | `0` | The number to show |
| `format` | – | `Intl.NumberFormatOptions \| undefined` | `undefined` | Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" } |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for formatting, e.g. "en-US" – defaults to the browser's |
| `duration` | `duration` | `number` | `900` | Length of a roll in ms |
| `delay` | `delay` | `number` | `0` | Wait before the first count-in, in ms |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-number-ticker-lh` | `1.15em` | both |

#### Design tokens it reads (2)

`--tc-duration-slower`, `--tc-ease-out`

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
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-number-ticker :format="…">` | `<tc-number-ticker [format]="…">` | `<tc-number-ticker {format}>` |

*Also attributes: `value`, `locale`, `duration`, `delay` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-number-ticker")` returns a `TcNumberTicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";`
- **React / Next.js:** Props: `import type { NumberTickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof NumberTicker>`. The element class, for refs: `import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNumberTicker["format"]` with `import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";`
- **Angular:** The directive types the template: `[format]` takes `TcNumberTicker["format"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNumberTicker } from "@adamstavely/trenchcoat/number-ticker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `number` | The number to show |
| `format` | `Intl.NumberFormatOptions` | Intl.NumberFormat options, e.g. { style: "currency", currency: "USD" } |
| `locale` | `string` | Locale for formatting, e.g. "en-US" – defaults to the browser's |
| `duration` | `number` | Length of a roll in ms |
| `delay` | `number` | Wait before the first count-in, in ms |
| `className` | `string` | Class names for the root element |
| `ref` | `React.Ref<TcNumberTicker>` | The root element |

*Renamed or hidden on the wrapper: `currency`, `USD`, `en-US`*

## Accessibility

### Screen readers

The rolling columns are hidden; screen readers read one visually hidden copy of the formatted number (“$128,450”).
The element is a polite live region, so each new value is announced once, after it changes – not digit by digit.
For numbers that change on their own every few seconds, set `aria-live="off"` on the element so they don't
interrupt, and give people a way to pause the updates.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 7.9 KB | 3.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.5 KB** | **5.6 KB** |
| With Lit – the first component on a page | 36.3 KB | 12.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 82 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 4.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **43 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Set `locale` explicitly when the format matters – without it the browser's own locale decides separators.
- Put the label (“Revenue”) next to the number, outside the element; it shows the number only.
- Round with `format` (`maximumFractionDigits`) rather than passing pre-rounded strings – `value` is a number.

## Do and don't

### Do

- Use `delay` to stagger several tickers that come into view together.
- Keep `duration` around the default 900 ms; much longer and people wait for the number to settle.
- Give tabular figures room: the element turns on `tabular-nums`, so columns don't shift as digits change.

### Don't

- Don't animate every number on a page – motion loses meaning when everything moves.
- Don't use it for numbers that change many times a second; the rolls never settle.

## Related

- [Text Reveal](text-reveal.md) – Text that arrives word by word or letter by letter – each piece rises out of a soft blur as it scrolls into view
- [KPI Chart](../components/kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Usage Meter](../components/usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
