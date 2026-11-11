<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Meter Row

**Workspace & sessions** · New

How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.

- **Element:** `<tc-meter-row>`
- **Size:** 5.5 KB gzip · 15.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/meter-row";` |
| React / Next.js | `import "@adamstavely/trenchcoat/meter-row";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/meter-row";` · tags starting with tc- are custom elements |
| Angular | `import { MeterRow } from "@adamstavely/trenchcoat/angular/meter-row";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/meter-row";` |

## Example

The live example is in the gallery at `#/meter-row`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How full something is, on one line: a label, a percentage and a tiny bar. Past a threshold the tone changes, with a mark
and a word as well as the colour.

### When to use

- A single figure in a side panel or settings list, such as storage used.
- A summary that opens the details, with `interactive`.
- Beside a `panel-card`'s value, with `compact`.

### When not to use

- Plan usage split by category – use [Usage Meter](usage-meter.md).
- What fills a model's context – use [Context Window](context-window.md) or [Context Map](context-map.md).
- A wait for something to finish – use [Progress Bar](../motion/progress-bar.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-mrw__row` – the line, with its `data-tone`
2. **Name** `.ui-mrw__name` – the label
3. **Meter** `.ui-mrw__meter` – the figure and bar
4. **Mark** `.ui-mrw__mark` – shown when getting full
5. **Value** `.ui-mrw__value` – the percentage, or `valueText`
6. **Bar** `.ui-mrw__bar` – the track, holding `.ui-mrw__fill`
7. **Button** `.ui-mrw__open` – covers the row when `interactive`

## Looks

Standard is a white card on the gray tray; Clean is one white card. `bare` and `compact` drop both. A page can set
`--tc-mrw-bar`, the bar's width, and `--tc-mrw-bar-h`, its height.

## Usage

### HTML

```html
<tc-meter-row id="storage" label="Sample storage" value="0.17" interactive></tc-meter-row>

<script type="module">
  import "@adamstavely/trenchcoat/meter-row";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#storage").addEventListener("tc-open", () => {
    console.log("open the details");
  });
</script>
```

### React / Next.js

```tsx
import { MeterRow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Storage({ onOpen }: { onOpen: () => void }) {
  return <MeterRow label="Sample storage" value={812} max={1000} valueText="812 of 1,000" interactive onTcOpen={onOpen} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/meter-row";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";

defineProps<{ labels: TcMeterRow["labels"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-meter-row :labels="labels" @tc-open="onOpen"></tc-meter-row>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MeterRow } from "@adamstavely/trenchcoat/angular/meter-row";
import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";

@Component({
  selector: "app-meter-row-example",
  imports: [MeterRow],
  template: `<tc-meter-row [labels]="labels()" (tc-open)="onOpen($event)"></tc-meter-row>`,
})
export class MeterRowExample {
  readonly labels = input.required<TcMeterRow["labels"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/meter-row";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";

  let { labels }: { labels: TcMeterRow["labels"] } = $props();
  let el: TcMeterRow;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-meter-row bind:this={el} {labels}></tc-meter-row>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | What's being measured; it names the meter, even when `compact` hides it |
| `value` | `value` | `number` | `0` | How much is used, from 0 to `max` |
| `max` | `max` | `number` | `1` | What full is |
| `valueText` | `value-text` | `string` | `""` | Text to show in place of the percentage, such as "812 of 1,000" |
| `warnAt` | `warn-at` | `number` | `0.8` | The fraction of `max` where it starts to warn |
| `dangerAt` | `danger-at` | `number` | `0.95` | The fraction of `max` where it turns to danger |
| `interactive` | `interactive` | `boolean` | `false` | Makes the row a button that fires tc-open |
| `compact` | `compact` | `boolean` | `false` | Hides the label from sight, leaving the percentage and bar |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and shadow, for a row that sits in something else's surface |
| `labels` | – | `Partial<MeterRowLabels>` | `{}` | Rename the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | The row was pressed, when `interactive` (detail: null) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mrw-bar` | `var(--tc-space-10)` | both |
| `--tc-mrw-bar-h` | `var(--tc-space-1)` | both |
| `--tc-mrw-glyph` | `var(--tc-space-3-5)` | both |

#### Design tokens it reads (31)

`--tc-accent-solid`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-base`, `--tc-ease-move`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-mrw-fill`, `--tc-radius-full`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-meter-row :labels="…">` | `<tc-meter-row [labels]="…">` | `<tc-meter-row {labels}>` |

*Also attributes: `label`, `value`, `max`, `value-text`, `warn-at`, `danger-at`, `interactive`, `compact` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `ref.current.addEventListener("tc-open", …)` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-meter-row")` returns a `TcMeterRow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";`
- **React / Next.js:** The element class: `import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMeterRow["labels"]` with `import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";`
- **Angular:** The directive types the template: `[labels]` takes `TcMeterRow["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMeterRow } from "@adamstavely/trenchcoat/meter-row";`

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the row, when `interactive` |
| Enter / Space | Fires `tc-open` |

### Screen readers

It's a `meter` named by the label, even when `compact` hides it, with its value as text. Past a threshold the word is part
of that text. When `interactive`, the button is named by the label, beside the meter.

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
| **This component alone** | 8.5 KB | 3.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.3 KB** | **5.5 KB** |
| With Lit – the first component on a page | 35.9 KB | 12.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

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

Name what's measured, not the unit: "Sample storage". Use `valueText` when a count says more than a percentage. Values
outside 0 to `max` are held to the ends, and anything that isn't a number counts as 0. Rename the words with `labels`.

## Do and don't

### Do

- Set `warnAt` and `dangerAt` to where someone should act.
- Use `compact` only where the surrounding row already says what's measured.

### Don't

- Don't use it to show progress through a task: a meter measures an amount.
- Don't leave `label` empty: it's the meter's name.

## Related

- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
