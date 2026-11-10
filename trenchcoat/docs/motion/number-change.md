<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Number Change

**Motion** · New

A number that briefly highlights when it changes, tinted by direction with an arrow and a word for screen readers, and never on first render

- **Element:** `<tc-number-change>`
- **Size:** 4.6 KB gzip · 12.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/number-change";` |
| React / Next.js | `import "@adamstavely/trenchcoat/number-change";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/number-change";` · tags starting with tc- are custom elements |
| Angular | `import { NumberChange } from "@adamstavely/trenchcoat/angular/number-change";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/number-change";` |

## Example

The live example is in the gallery at `#/motion/number-change`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A number that briefly highlights when it changes, tinted by direction, with an arrow and a word for screen readers while it does. It never highlights on first render, so nothing flashes because a page loaded.

### When to use

- A live count or total that updates while someone's reading.
- A value someone just changed elsewhere on the page.

### When not to use

- Counting up to a number, digit by digit – use [Number Ticker](number-ticker.md).
- Drawing the eye to something that isn't a number – use [Attention Pulse](attention-pulse.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Number** `.ui-nch-value` – the formatted number
2. **Arrow** `.ui-nch-arrow` – which way it moved, while highlighted

## Looks

No look of its own. A page can set `--tc-number-change-up` and `--tc-number-change-down`.

## Usage

### HTML

```html
<tc-number-change value="128"></tc-number-change>

<script type="module">
  import "@adamstavely/trenchcoat/number-change";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { NumberChange } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Total({ value }: { value: number }) {
  return <NumberChange value={value} format={{ style: "currency", currency: "USD" }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/number-change";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";

defineProps<{ format: TcNumberChange["format"]; labels: TcNumberChange["labels"] }>();
</script>

<template>
  <tc-number-change :format="format" :labels="labels"></tc-number-change>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { NumberChange } from "@adamstavely/trenchcoat/angular/number-change";
import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";

@Component({
  selector: "app-number-change-example",
  imports: [NumberChange],
  template: `<tc-number-change [format]="format()" [labels]="labels()"></tc-number-change>`,
})
export class NumberChangeExample {
  readonly format = input.required<TcNumberChange["format"]>();
  readonly labels = input.required<TcNumberChange["labels"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/number-change";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";

  let { format, labels }: { format: TcNumberChange["format"]; labels: TcNumberChange["labels"] } = $props();
  let el: TcNumberChange;
</script>

<tc-number-change bind:this={el} {format} {labels}></tc-number-change>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `number \| undefined` | `undefined` | The number |
| `format` | – | `Intl.NumberFormatOptions \| undefined` | `undefined` | How it's written: Intl.NumberFormat options |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for writing it |
| `direction` | `direction` | `NumberChangeDirection` | `"auto"` | Which way to show a change: "auto" works it out, "none" doesn't highlight |
| `labels` | – | `Partial<NumberChangeLabels>` | `{}` | Rename the words |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-number-change-up` | `var(--tc-status-success-bg)` | both |
| `--tc-number-change-down` | `var(--tc-status-danger-bg)` | both |

#### Design tokens it reads (8)

`--tc-control-radius-sm`, `--tc-duration-reveal`, `--tc-ease-standard`, `--tc-nch-tint`, `--tc-space-0-5`, `--tc-space-1`, `--tc-status-danger-bg`, `--tc-status-success-bg`

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
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-number-change :format="…">` | `<tc-number-change [format]="…">` | `<tc-number-change {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-number-change :labels="…">` | `<tc-number-change [labels]="…">` | `<tc-number-change {labels}>` |

*Also attributes: `value`, `locale`, `direction` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-number-change")` returns a `TcNumberChange` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";`
- **React / Next.js:** The element class: `import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNumberChange["format"]` with `import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";`
- **Angular:** The directive types the template: `[format]` takes `TcNumberChange["format"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNumberChange } from "@adamstavely/trenchcoat/number-change";`

## Accessibility

### Keyboard

Nothing to operate. It takes no focus.

### Screen readers

The number is plain text. While highlighted, a hidden word says up or down, and the arrow is hidden. It isn't a live region, so wrap it in a `role="status"` where a change must be announced.

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
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-01 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 5.5 KB | 2.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **12.1 KB** | **4.6 KB** |
| With Lit – the first component on a page | 31.7 KB | 10.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.2 ms** | the gallery demo's data, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 3.2 ms | default properties; includes adding its CSS to the document |

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

Use `format` for currency, percentages and units. Up is only a direction, so swap the tints where up is bad news, such as errors.

## Do and don't

### Do

- Use `direction="none"` where any change is routine.

### Don't

- Don't highlight many numbers at once. Nothing stands out then.

## Related

- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
- [Attention Pulse](attention-pulse.md) – Draws the eye once – a soft ring passes around something new a single time, and never on page load
- [Status Morph](status-morph.md) – One state's mark changing into the next with its word – pending, checking, done, failed or warning – with polite announcing on request
- [Usage Meter](../components/usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
