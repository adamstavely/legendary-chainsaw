<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Like Burst

**Motion** · New

A like or save toggle whose icon fills with a spring and a small ring and particle burst when it's pressed on, with a count that rolls by one

- **Element:** `<tc-like-burst>`
- **Size:** 5.7 KB gzip · 17.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/like-burst";` |
| React / Next.js | `import { LikeBurst } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/like-burst";` · tags starting with tc- are custom elements |
| Angular | `import { LikeBurst } from "@adamstavely/trenchcoat/angular/like-burst";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/like-burst";` |

## Example

The live example is in the gallery at `#/motion/like-burst`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A toggle for liking, saving or starring. Pressing it on fills the icon with a spring, and a small ring and eight particles burst from it; pressing it off just empties the icon. An optional count beside it rolls up or down by one. It only bursts when someone presses it, never on first render or when the page sets `pressed` itself. With reduced motion the icon fills without the spring or the burst, and the count changes in place.

### When to use

- A quick, personal reaction: helpful, save, star, follow.
- A toggle whose state is worth a moment of delight.

### When not to use

- Several reactions to pick from – use [Reaction Bar](../components/reaction-bar.md).
- A setting that changes how something works – use [Switch](../components/switch.md).
- Confirming that something was done – use [Success Check](success-check.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="lkb"]` – the visual control
2. **Button** `.ui-lkb__button` – the native button with `aria-pressed`
3. **Spot** `.ui-lkb__spot` – where the icon sits; the default `.ui-lkb__heart` or the page's `slot="icon"`
4. **Burst** `.ui-lkb__burst` – the `.ui-lkb__ring` and eight `.ui-lkb__particle`s
5. **Count** `.ui-lkb__count` – the number, rolling between `.ui-lkb__out` and `.ui-lkb__in`

## Looks

No look of its own. A page can set `--tc-like-burst-color` (the filled icon and ring), `--tc-like-burst-idle` (the empty icon), `--tc-like-burst-size` and `--tc-like-burst-reach` (how far the particles fly).

## Usage

### HTML

```html
<tc-like-burst label="Helpful" count="7"></tc-like-burst>

<script type="module">
  import "@adamstavely/trenchcoat/like-burst";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-like-burst").addEventListener("tc-pressed-change", (e) => console.log(e.detail.pressed));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { LikeBurst } from "@adamstavely/trenchcoat/react";

export function SaveFinding({ saves }: { saves: number }) {
  const [saved, setSaved] = useState(false);
  return <LikeBurst label="Save finding" showLabel pressed={saved} count={saves + (saved ? 1 : 0)} onPressedChange={setSaved} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/like-burst";
import "@adamstavely/trenchcoat/tokens.css";

const onPressedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-like-burst @tc-pressed-change="onPressedChange"></tc-like-burst>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { LikeBurst } from "@adamstavely/trenchcoat/angular/like-burst";

@Component({
  selector: "app-like-burst-example",
  imports: [LikeBurst],
  template: `<tc-like-burst (tc-pressed-change)="onPressedChange($event)"></tc-like-burst>`,
})
export class LikeBurstExample {
  onPressedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/like-burst";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";

  let el: TcLikeBurst;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-pressed-change", on);
    return () => el.removeEventListener("tc-pressed-change", on);
  });
</script>

<tc-like-burst bind:this={el}></tc-like-burst>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `pressed` | `pressed` | `boolean` | `false` | On (liked) or off |
| `label` | `label` | `string` | `"Like"` | The button's name: "Like", "Save finding" |
| `showLabel` | `show-label` | `boolean` | `false` | Shows the label beside the icon; otherwise it's only the name |
| `count` | `count` | `number \| undefined` | `undefined` | A count beside the icon; a press moves it by one |
| `disabled` | `disabled` | `boolean` | `false` | Can't be pressed |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for writing the count |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-pressed-change` | – | Yes | The press turned on or off ({ pressed, count }: LikeBurstPressedChange); cancelable – prevented, it stays as it was |

#### Slots

| Slot | Description |
| --- | --- |
| `icon` | An icon in place of the heart |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-like-burst-color` | `var(--tc-status-danger-solid)` | both |
| `--tc-like-burst-idle` | `var(--tc-text-secondary)` | both |
| `--tc-like-burst-size` | `20px` | both |
| `--tc-like-burst-reach` | `18px` | both |

#### Design tokens it reads (25)

`--tc-chart-1`, `--tc-chart-2`, `--tc-chart-4`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-out`, `--tc-ease-spring`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-size-sm`, `--tc-lkb-from`, `--tc-lkb-to`, `--tc-space-1-5`, `--tc-space-2`, `--tc-status-danger-solid`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-primary`, `--tc-text-secondary`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `pressed`, `label`, `show-label`, `count`, `disabled`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-pressed-change` | Yes | `el.addEventListener("tc-pressed-change", (e) => …)` | `onPressedChange={…}` | `@tc-pressed-change="…"` | `(tc-pressed-change)="…($event)"` | `el.addEventListener("tc-pressed-change", …)` |

### Controlled

The element changes `pressed` itself unless a listener calls `preventDefault()` on `tc-pressed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-like-burst id="like-burst"></tc-like-burst>

<script type="module">
  import "@adamstavely/trenchcoat/like-burst";

  const el = document.querySelector("#like-burst");
  el.addEventListener("tc-pressed-change", (e) => {
    e.preventDefault(); // the element keeps its pressed…
    if (allowed(e.detail.pressed)) el.pressed = e.detail.pressed; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { LikeBurst } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof LikeBurst>;
type Props = Omit<Own, "pressed" | "onPressedChange"> & { initial: NonNullable<Own["pressed"]> };

// Controlled: passing pressed makes the wrapper prevent the element's own change; the app sets it
export function ControlledLikeBurst({ initial, ...props }: Props) {
  const [pressed, setPressed] = useState<Own["pressed"]>(initial);
  return <LikeBurst {...props} pressed={pressed} onPressedChange={(next) => setPressed(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/like-burst";
import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";

const props = defineProps<{ initial: TcLikeBurst["pressed"] }>();
const pressed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPressedChange = (e: CustomEvent<{ pressed: TcLikeBurst["pressed"] }>) => {
  e.preventDefault();
  pressed.value = e.detail.pressed;
};
</script>

<template>
  <tc-like-burst :pressed="pressed" @tc-pressed-change="onPressedChange"></tc-like-burst>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LikeBurst } from "@adamstavely/trenchcoat/angular/like-burst";
import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";

@Component({
  selector: "app-controlled-like-burst",
  imports: [LikeBurst],
  template: `<tc-like-burst [pressed]="pressed()" (tc-pressed-change)="onPressedChange($event)"></tc-like-burst>`,
})
export class ControlledLikeBurst {
  readonly initial = input.required<TcLikeBurst["pressed"]>();
  readonly pressed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPressedChange(e: CustomEvent<{ pressed: TcLikeBurst["pressed"] }>) {
    e.preventDefault();
    this.pressed.set(e.detail.pressed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/like-burst";
  import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";

  let { initial }: { initial: TcLikeBurst["pressed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let pressed = $derived(initial);
  let el: TcLikeBurst;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      pressed = (e as CustomEvent<{ pressed: TcLikeBurst["pressed"] }>).detail.pressed;
    };
    el.addEventListener("tc-pressed-change", on);
    return () => el.removeEventListener("tc-pressed-change", on);
  });
</script>

<tc-like-burst bind:this={el} {pressed}></tc-like-burst>
```

### Slots and children

Put children inside the tag with a `slot` attribute: `slot="icon"`. The element renders into itself (no shadow root) and leaves them where you put them.

- **React:** pass them as children with the same attribute.
- **Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-like-burst")` returns a `TcLikeBurst` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";`
- **React / Next.js:** Props: `import type { LikeBurstProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LikeBurst>`. The element class, for refs: `import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLikeBurst["pressed"]` with `import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";`
- **Angular:** The directive types the template: `[pressed]` takes `TcLikeBurst["pressed"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLikeBurst } from "@adamstavely/trenchcoat/like-burst";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `pressed` | `boolean` | On or off – controlled when given; then pass the matching `count` too |
| `defaultPressed` | `boolean` | Where it starts when the element keeps its own state |
| `onPressedChange` | `(pressed: boolean) => void` | Called with the new state when it's pressed |

*Renamed or hidden on the wrapper: `pressed`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the button |
| Enter or Space | Turns it on or off |

### Screen readers

A toggle button: its name is `label` plus the count ("Save finding 3"), and screen readers say whether it's pressed. The burst says nothing.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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
| **This piece alone** | 10.3 KB | 3.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **17.0 KB** | **5.7 KB** |
| With Lit – the first component on a page | 36.6 KB | 12.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 17 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |

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

- Name it for what it does: "Save finding", "Helpful", "Star".
- Show the label when the icon alone isn't clear.

## Do and don't

### Do

- Change `count` with `pressed` when you control it, so they agree.

### Don't

- Don't use it for actions that can't be undone by pressing again.

## Related

- [Reaction Bar](../components/reaction-bar.md) – Like, comment, repost and share in one pill – icons pop and fill, counts roll in digit by digit
- [Message Actions](../components/message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Success Check](success-check.md) – A small tick that draws itself once, for shared or saved, and then rests
- [Number Ticker](number-ticker.md) – Odometer-style numbers – every digit rolls to its new value and counts in from zero when it scrolls into view; each new value is announced once
