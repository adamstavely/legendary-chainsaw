<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Testimonial Wall

**Blocks** · New

The landing-page wall of quotes – columns that scroll endlessly in opposite directions, ease to a stop on hover and scrub with inertia, with a Pause / Play button (uses `button`)

- **Element:** `<tc-testimonial-wall>`
- **Size:** 12.4 KB gzip · 38.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/testimonial-wall";` |
| React / Next.js | `import { TestimonialWall } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/testimonial-wall";` · tags starting with tc- are custom elements |
| Angular | `import { TestimonialWall } from "@adamstavely/trenchcoat/angular/testimonial-wall";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/testimonial-wall";` |

## Example

The live example is in the gallery at `#/blocks/testimonial-wall`, in both looks; Replay restarts its animations.

## Overview

The landing-page wall of quotes. Quotes are dealt into columns – up to three on wide containers, two below 740 px and
one below 480 px, measured on the wall itself – that scroll endlessly, alternating up and down at slightly different
speeds. Hovering or keyboard-focusing a column eases it to a stop; dragging it with the mouse scrubs it; pressing and
holding on touch pauses it to read. A Pause / Play button stops the whole wall for good. It only moves while on screen,
and with reduced motion it's a static grid of every quote.

### When to use

- A landing page's wall of customer quotes, where the volume itself says something.
- Ten or more short quotes of mixed length.

### When not to use

- A row of customer logos – use [Logo Marquee](logo-marquee.md).
- A conversation people take part in – use [Comment Thread](../components/comment-thread.md).
- A few quotes people should read in turn – use [Cover Flow](../illustrations/cover-flow.md).

## Anatomy

1. **Pause / Play** `.ui-twl__pause` – a button at the top right, first in the tab order
2. **Column** `.ui-twl__col` – a loop of cards, faded at the top and bottom
3. **Card** `.ui-twl__card` – one quote
4. **Rating** `.ui-twl__stars` – one to five calm gray stars
5. **Quote** `.ui-twl__quote`
6. **Person** `.ui-twl__who` – the avatar `.ui-twl__avatar` (photo or initials), the name `.ui-twl__name` with a

## Looks

One look: white cards on the page's background. Set the wall's height with `--tc-testimonial-wall-height` (600 px).
Component tokens on the element: `--tc-twl-gap`, `--tc-twl-fade` (the edges' fade), `--tc-twl-dim` (how far the other
cards step back while one is hovered) and the stars' `--tc-twl-star` / `--tc-twl-star-off`.

## Usage

### HTML

```html
<tc-testimonial-wall id="wall" label="Customer testimonials"></tc-testimonial-wall>

<script type="module">
  import "@adamstavely/trenchcoat/testimonial-wall";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#wall").items = [
    { quote: "Fast.", name: "Leo Brandt", role: "Staff Engineer", company: "Northwind", rating: 5 },
    { quote: "Onboarding took ten minutes.", name: "Jonas Ortiz", role: "Founder", company: "Kestrel", rating: 4, verified: true },
  ];
</script>
```

### React / Next.js

```tsx
import { TestimonialWall, type Testimonial } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: Testimonial[] = [
  { quote: "Fast.", name: "Leo Brandt", role: "Staff Engineer", company: "Northwind", rating: 5 },
  { quote: "Onboarding took ten minutes.", name: "Jonas Ortiz", role: "Founder", company: "Kestrel", rating: 4, verified: true },
];

export function Wall() {
  return <TestimonialWall items={items} label="Customer testimonials" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/testimonial-wall";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";

defineProps<{ items: TcTestimonialWall["items"]; buttonLabels: TcTestimonialWall["buttonLabels"] }>();
const onPausedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-testimonial-wall :items="items" :buttonLabels="buttonLabels" @tc-paused-change="onPausedChange"></tc-testimonial-wall>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TestimonialWall } from "@adamstavely/trenchcoat/angular/testimonial-wall";
import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";

@Component({
  selector: "app-testimonial-wall-example",
  imports: [TestimonialWall],
  template: `<tc-testimonial-wall [items]="items()" [buttonLabels]="buttonLabels()" (tc-paused-change)="onPausedChange($event)"></tc-testimonial-wall>`,
})
export class TestimonialWallExample {
  readonly items = input.required<TcTestimonialWall["items"]>();
  readonly buttonLabels = input.required<TcTestimonialWall["buttonLabels"]>();
  onPausedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/testimonial-wall";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";

  let { items, buttonLabels }: { items: TcTestimonialWall["items"]; buttonLabels: TcTestimonialWall["buttonLabels"] } = $props();
  let el: TcTestimonialWall;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-testimonial-wall bind:this={el} {items} {buttonLabels}></tc-testimonial-wall>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `Testimonial[]` | `[]` | The quotes |
| `columns` | `columns` | `1 \| 2 \| 3` | `3` | Most columns on a wide container – narrower containers use fewer (2 below 740 px, 1 below 480 px) |
| `speed` | `speed` | `number` | `28` | Pixels per second of the first column; the others run a little slower and faster |
| `pauseOnHover` | `pause-on-hover` | `boolean` | `true` | Ease a column to a stop while the pointer is over it or a card in it has keyboard focus |
| `paused` | `paused` | `boolean` | `false` | Stopped for good (the Pause / Play button's state) |
| `pauseButton` | `pause-button` | `boolean` | `true` | Show the Pause / Play button (on by default – moving content needs a way to stop it, WCAG 2.2.2) |
| `label` | `label` | `string` | `"What customers say"` | Accessible name of the wall |
| `buttonLabels` | – | `{ pause: string; play: string }` | `{ pause: "Pause testimonials", play: "Play testimonials" }` | The Pause button's name, and the Play button's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-paused-change` | – | Yes | The Pause / Play button was pressed ({ paused }: TestimonialPausedChange); cancelable – prevented, `paused` stays as it is (controlled use) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-twl-star` | `light-dark(#a3a3a8, #7a7a82)` | both |
| `--tc-twl-star-off` | `light-dark(#e2e2e5, #2f2f34)` | both |
| `--tc-twl-avatar-ring` | `light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.06))` | both |
| `--tc-twl-gap` | `16px` | both |
| `--tc-twl-fade` | `96px` | both |
| `--tc-twl-dim` | `0.62` | both |
| `--tc-twl-avatar` | `36px` | both |
| `--tc-twl-card-pad` | `18px 20px` | both |
| `--tc-twl-card-gap` | `14px` | both |
| `--tc-twl-name-gap` | `5px` | both |
| `--tc-twl-id-gap` | `1px` | both |
| `--tc-twl-cols` | `3` | not set – this fallback applies |
| `--tc-testimonial-wall-height` | `600px` | not set – this fallback applies |

#### Design tokens it reads (31)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `testimonialColumns(width: number, max: number): void` | Container width → column count, at most `max`: 3 from 740 px, 2 from 480 px, else 1 |
| `dealTestimonials(items: T[], count: number): T[][]` | The quotes dealt into `count` columns: 1, 2, 3, 1, 2, 3 … so short and long ones mix in every column |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-testimonial-wall :items="…">` | `<tc-testimonial-wall [items]="…">` | `<tc-testimonial-wall {items}>` |
| `buttonLabels` | `el.buttonLabels = …;` | `<… buttonLabels={…} />` | `<tc-testimonial-wall :buttonLabels="…">` | `<tc-testimonial-wall [buttonLabels]="…">` | `<tc-testimonial-wall {buttonLabels}>` |

*Also attributes: `columns`, `speed`, `pause-on-hover`, `paused`, `pause-button`, `label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `onPausedChange={…}` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |

### Controlled

The element changes `paused` itself unless a listener calls `preventDefault()` on `tc-paused-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-testimonial-wall id="testimonial-wall"></tc-testimonial-wall>

<script type="module">
  import "@adamstavely/trenchcoat/testimonial-wall";

  const el = document.querySelector("#testimonial-wall");
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
import { TestimonialWall } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TestimonialWall>;
type Props = Omit<Own, "paused" | "onPausedChange"> & { initial: NonNullable<Own["paused"]> };

// Controlled: passing paused makes the wrapper prevent the element's own change; the app sets it
export function ControlledTestimonialWall({ initial, ...props }: Props) {
  const [paused, setPaused] = useState<Own["paused"]>(initial);
  return <TestimonialWall {...props} paused={paused} onPausedChange={(next) => setPaused(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/testimonial-wall";
import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";

const props = defineProps<{ initial: TcTestimonialWall["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcTestimonialWall["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-testimonial-wall :paused="paused" @tc-paused-change="onPausedChange"></tc-testimonial-wall>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TestimonialWall } from "@adamstavely/trenchcoat/angular/testimonial-wall";
import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";

@Component({
  selector: "app-controlled-testimonial-wall",
  imports: [TestimonialWall],
  template: `<tc-testimonial-wall [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-testimonial-wall>`,
})
export class ControlledTestimonialWall {
  readonly initial = input.required<TcTestimonialWall["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcTestimonialWall["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/testimonial-wall";
  import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";

  let { initial }: { initial: TcTestimonialWall["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcTestimonialWall;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcTestimonialWall["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-testimonial-wall bind:this={el} {paused}></tc-testimonial-wall>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-testimonial-wall")` returns a `TcTestimonialWall` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";`
- **React / Next.js:** Props: `import type { TestimonialWallProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TestimonialWall>`. The element class, for refs: `import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTestimonialWall["items"]` with `import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";`
- **Angular:** The directive types the template: `[items]` takes `TcTestimonialWall["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTestimonialWall } from "@adamstavely/trenchcoat/testimonial-wall";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `paused` | `boolean` | Stopped (controlled) – pass `onPausedChange` with it. Leave undefined to start at `defaultPaused` |
| `defaultPaused` | `boolean` | Stopped at first when uncontrolled |
| `onPausedChange` | `(paused: boolean) => void` | Called when the Pause / Play button is pressed |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Pause / Play, then through the cards; a focused card stops its column and is nudged into view |
| Enter / Space | On Pause / Play, stops or starts the wall |

### Screen readers

The wall is a `region` named by `label`. Each card is a `figure` with the quote in a `blockquote` and the person in its
caption. Only the real set of each column is read and reachable; the copies are `aria-hidden` and `inert`. A rating
reads “Rated 4 out of 5”, the verified mark “Verified customer”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
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
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 17.8 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **38.6 KB** | **12.4 KB** |
| With Lit – the first component on a page | 58.7 KB | 18.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | default properties, 21 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 9.2 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

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

- Mix short and long quotes – the masonry looks more natural.
- Give a role and company where you can; they make a quote credible.
- Only mark people verified when you've checked who they are.

## Do and don't

### Do

- Keep the default Pause / Play button (WCAG 2.2.2).
- Set the height so at least two cards show in each column.

### Don't

- Don't edit quotes beyond trimming them.
- Don't use it for fewer than about six quotes – a static grid reads better.

## Related

- [Logo Marquee](logo-marquee.md) – The endless “Trusted by” strip – a seamless loop that eases to a stop on hover, scrubs with inertia and lifts the hovered logo to colour, with a Pause / Play button (uses `button`)
- [Cover Flow](../illustrations/cover-flow.md) – Browse covers in 3D – drag, flick or scrub the row, it springs to the nearest cover; images drift in their frames over a soft reflection
- [Comment Thread](../components/comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Button](../components/button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
