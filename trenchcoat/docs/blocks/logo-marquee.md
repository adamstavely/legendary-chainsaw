<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Logo Marquee

**Blocks** · New

The endless “Trusted by” strip – a seamless loop that eases to a stop on hover, scrubs with inertia and lifts the hovered logo to colour, with a Pause / Play button (uses `button`)

- **Element:** `<tc-logo-marquee>`
- **Size:** 11.8 KB gzip · 37.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/logo-marquee";` |
| React / Next.js | `import { LogoMarquee } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/logo-marquee";` · tags starting with tc- are custom elements |
| Angular | `import { LogoMarquee } from "@adamstavely/trenchcoat/angular/logo-marquee";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/logo-marquee";` |

## Example

The live example is in the gallery at `#/blocks/logo-marquee`, in both looks; Replay restarts its animations.

## Overview

The endless “Trusted by” strip for landing pages. Rows of logos loop without a gap or a jump, at a speed in pixels per
second that's the same on any screen. Hovering or keyboard-focusing the strip eases it to a stop; dragging or swiping
scrubs it with inertia. Logos sit muted and monochrome, and the one under the pointer lifts to its brand colour. A
Pause / Play button stops it for good. A second row runs the other way. It only moves while on screen, and with
reduced motion it's a static, wrapping row.

### When to use

- A landing page's row of customer or partner logos.
- Showing more logos than fit across the page without a carousel's controls.

### When not to use

- A handful of logos that fit – put them in a row, or use [Logo Cluster](../illustrations/logo-cluster.md).
- Quotes from customers – use [Testimonial Wall](testimonial-wall.md).
- Browsing items people pick from – use [Cover Flow](../illustrations/cover-flow.md).

## Anatomy

1. **Pause / Play** `.ui-lm__pause` – a button at the right edge, first in the tab order
2. **Row** `.ui-lm__row` – a strip that loops, faded at both ends
3. **Set** `.ui-lm__set` – one copy of the row's logos; the copies after it are decoration
4. **Logo** `.ui-lm__link` – the mark `.ui-lm__mark` and, with `labels`, the name `.ui-lm__name`
5. **Static row** `.ui-lm__wrap` – the wrapping row shown with reduced motion

## Looks

One look: the strip takes the page's background. Component tokens on the element: `--tc-lm-h` (the marks' height,
28 px, 22 px when narrow), `--tc-lm-row-gap`, `--tc-lm-fade` (the edges' fade) and `--tc-lm-dim` (how far the other
logos step back while one is hovered in full colour).

## Usage

### HTML

```html
<tc-logo-marquee id="logos" label="Customers" labels="beside"></tc-logo-marquee>

<script type="module">
  import "@adamstavely/trenchcoat/logo-marquee";
  import "@adamstavely/trenchcoat/tokens.css";

  const svg = (d) => {
    const t = document.createElement("template");
    t.innerHTML = `<svg viewBox="0 0 32 32" fill="currentColor"><path d="${d}"/></svg>`;
    return t.content.firstElementChild;
  };
  document.querySelector("#logos").logos = [
    { name: "Northwind", color: "#2f6bff", svg: svg("M4 26 16 4l12 22h-6l-6-11-6 11z") },
    { name: "Fernway", color: "#10b981", svg: svg("M16 2c8 6 10 16 0 28C6 18 8 8 16 2z") },
  ];
</script>
```

### React / Next.js

```tsx
import { LogoMarquee, type MarqueeLogo } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const logos: MarqueeLogo[] = [
  { name: "Northwind", color: "#2f6bff", svg: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M4 26 16 4l12 22h-6l-6-11-6 11z" /></svg> },
  { name: "Fernway", color: "#10b981", svg: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 2c8 6 10 16 0 28C6 18 8 8 16 2z" /></svg> },
];

export function Customers() {
  return <LogoMarquee logos={logos} label="Customers" labels="beside" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/logo-marquee";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";

defineProps<{ logos: TcLogoMarquee["logos"]; buttonLabels: TcLogoMarquee["buttonLabels"] }>();
const onPausedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-logo-marquee :logos="logos" :buttonLabels="buttonLabels" @tc-paused-change="onPausedChange"></tc-logo-marquee>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LogoMarquee } from "@adamstavely/trenchcoat/angular/logo-marquee";
import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";

@Component({
  selector: "app-logo-marquee-example",
  imports: [LogoMarquee],
  template: `<tc-logo-marquee [logos]="logos()" [buttonLabels]="buttonLabels()" (tc-paused-change)="onPausedChange($event)"></tc-logo-marquee>`,
})
export class LogoMarqueeExample {
  readonly logos = input.required<TcLogoMarquee["logos"]>();
  readonly buttonLabels = input.required<TcLogoMarquee["buttonLabels"]>();
  onPausedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/logo-marquee";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";

  let { logos, buttonLabels }: { logos: TcLogoMarquee["logos"]; buttonLabels: TcLogoMarquee["buttonLabels"] } = $props();
  let el: TcLogoMarquee;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-logo-marquee bind:this={el} {logos} {buttonLabels}></tc-logo-marquee>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `logos` | – | `MarqueeLogo[]` | `[]` | The logos |
| `speed` | `speed` | `number` | `40` | Pixels per second, independent of the strip's width |
| `direction` | `direction` | `"left" \| "right"` | `"left"` | Which way the first row runs; a second row runs the other way |
| `rows` | `rows` | `1 \| 2` | `1` | 1, or 2 for a second row in the opposite direction (the logos are split between the rows) |
| `gap` | `gap` | `number` | `56` | Space between logos in px (smaller on narrow containers) |
| `pauseOnHover` | `pause-on-hover` | `boolean` | `true` | Ease to a stop while the pointer is over the strip or it has keyboard focus |
| `paused` | `paused` | `boolean` | `false` | Stopped for good (the Pause / Play button's state) |
| `pauseButton` | `pause-button` | `boolean` | `true` | Show the Pause / Play button (on by default – moving content needs a way to stop it, WCAG 2.2.2) |
| `grayscale` | `grayscale` | `boolean` | `true` | Muted, colourless logos that lift to full colour on hover |
| `labels` | `labels` | `MarqueeLabels` | `"none"` | Show the brand name under each mark or beside it, like a wordmark |
| `label` | `label` | `string` | `"Logos of companies using the product"` | Accessible name of the strip |
| `buttonLabels` | – | `{ pause: string; play: string }` | `{ pause: "Pause logos", play: "Play logos" }` | The Pause button's name, and the Play button's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-paused-change` | – | Yes | The Pause / Play button was pressed ({ paused }: MarqueePausedChange); cancelable – prevented, `paused` stays as it is (controlled use) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-lm-h` | `28px` | both |
| `--tc-lm-g` | `var(--tc-lm-gap, 56px)` | both |
| `--tc-lm-row-gap` | `20px` | both |
| `--tc-lm-fade` | `min(14%, 120px)` | both |
| `--tc-lm-dim` | `0.75` | both |
| `--tc-lm-touch` | `40px` | both |
| `--tc-lm-gap` | `56px` | not set – this fallback applies |
| `--tc-lm-scale` | `1` | not set – this fallback applies |
| `--tc-lm-brand` | `var(--tc-text-primary)` | not set – this fallback applies |

#### Design tokens it reads (15)

`--tc-duration-moderate`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-radius-md`, `--tc-space-1-5`, `--tc-space-2`, `--tc-text-muted`, `--tc-text-primary`, `--tc-tracking-tight`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `marqueeRows(logos: MarqueeLogo[], rows: 1 \| 2, direction: "left" \| "right"): Row[]` | The logos split into rows: two rows take alternate logos, so each shows different brands |

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
| `logos` | `el.logos = …;` | `<… logos={…} />` | `<tc-logo-marquee :logos="…">` | `<tc-logo-marquee [logos]="…">` | `<tc-logo-marquee {logos}>` |
| `buttonLabels` | `el.buttonLabels = …;` | `<… buttonLabels={…} />` | `<tc-logo-marquee :buttonLabels="…">` | `<tc-logo-marquee [buttonLabels]="…">` | `<tc-logo-marquee {buttonLabels}>` |

*Also attributes: `speed`, `direction`, `rows`, `gap`, `pause-on-hover`, `paused`, `pause-button`, `grayscale` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `onPausedChange={…}` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |

### Controlled

The element changes `paused` itself unless a listener calls `preventDefault()` on `tc-paused-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-logo-marquee id="logo-marquee"></tc-logo-marquee>

<script type="module">
  import "@adamstavely/trenchcoat/logo-marquee";

  const el = document.querySelector("#logo-marquee");
  el.addEventListener("tc-paused-change", (e) => {
    e.preventDefault(); // the element keeps its paused…
    if (allowed(e.detail.paused)) el.paused = e.detail.paused; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { LogoMarquee } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof LogoMarquee>;
type Props = Omit<Own, "paused" | "onPausedChange"> & { initial: NonNullable<Own["paused"]> };

// Controlled: passing paused makes the wrapper prevent the element's own change; the app sets it
export function ControlledLogoMarquee({ initial, ...props }: Props) {
  const [paused, setPaused] = useState<Own["paused"]>(initial);
  return <LogoMarquee {...props} paused={paused} onPausedChange={(next) => setPaused(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/logo-marquee";
import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";

const props = defineProps<{ initial: TcLogoMarquee["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcLogoMarquee["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-logo-marquee :paused="paused" @tc-paused-change="onPausedChange"></tc-logo-marquee>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LogoMarquee } from "@adamstavely/trenchcoat/angular/logo-marquee";
import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";

@Component({
  selector: "app-controlled-logo-marquee",
  imports: [LogoMarquee],
  template: `<tc-logo-marquee [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-logo-marquee>`,
})
export class ControlledLogoMarquee {
  readonly initial = input.required<TcLogoMarquee["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcLogoMarquee["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/logo-marquee";
  import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";

  let { initial }: { initial: TcLogoMarquee["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcLogoMarquee;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcLogoMarquee["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-logo-marquee bind:this={el} {paused}></tc-logo-marquee>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-logo-marquee")` returns a `TcLogoMarquee` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";`
- **React / Next.js:** Props: `import type { LogoMarqueeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LogoMarquee>`. The element class, for refs: `import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLogoMarquee["logos"]` with `import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";`
- **Angular:** The directive types the template: `[logos]` takes `TcLogoMarquee["logos"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLogoMarquee } from "@adamstavely/trenchcoat/logo-marquee";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `logos` | `MarqueeLogo[]` | The logos |
| `paused` | `boolean` | Stopped (controlled) – pass `onPausedChange` with it. Leave undefined to start at `defaultPaused` |
| `defaultPaused` | `boolean` | Stopped at first when uncontrolled |
| `onPausedChange` | `(paused: boolean) => void` | Called when the Pause / Play button is pressed |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Pause / Play, then through the linked logos; focusing the strip stops it |
| Enter / Space | On Pause / Play, stops or starts it |
| Enter | On a logo, follows its link |

A focused logo near an edge is nudged into view.

### Screen readers

The strip is a `region` named by `label`. Only the first set is read and reachable; the copies are `aria-hidden` and
`inert`. Each logo is read by its name, and Pause / Play by what it does.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | button | – |
| :is() and :where() | 88 | 78 | 14 | 14 | button, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, button | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself, internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself, button | – |

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
| **This piece alone** | 16.8 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **37.7 KB** | **11.8 KB** |
| With Lit – the first component on a page | 58.6 KB | 18.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | default properties, 10 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give marks as SVG elements with `fill="currentColor"` so they follow the muted colour; `color` is the brand colour
  they lift to.
- Use `scale` to even out a heavy or round mark next to wordmarks.
- Only link a logo to something about that customer, such as a case study.

## Do and don't

### Do

- Keep the default Pause / Play button – moving content needs a way to stop it (WCAG 2.2.2).
- Use about 8 to 14 logos; two rows for more.

### Don't

- Don't speed it up to show more logos.
- Don't put text other than brand names in it.

## Related

- [Testimonial Wall](testimonial-wall.md) – The landing-page wall of quotes – columns that scroll endlessly in opposite directions, ease to a stop on hover and scrub with inertia, with a Pause / Play button (uses `button`)
- [Logo Cluster](../illustrations/logo-cluster.md) – Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once
- [Cover Flow](../illustrations/cover-flow.md) – Browse covers in 3D – drag, flick or scrub the row, it springs to the nearest cover; images drift in their frames over a soft reflection
- [Button](../components/button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
