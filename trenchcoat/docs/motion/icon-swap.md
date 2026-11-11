<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Icon Swap

**Motion** · New

One icon turning into the next – copy into a check, play into pause – with a turn, a shrink and a blur, in place, and turning back on its own after a while if asked

- **Element:** `<tc-icon-swap>`
- **Size:** 4.9 KB gzip · 13.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/icon-swap";` |
| React / Next.js | `import { IconSwap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/icon-swap";` · tags starting with tc- are custom elements |
| Angular | `import { IconSwap } from "@adamstavely/trenchcoat/angular/icon-swap";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/icon-swap";` |

## Example

The live example is in the gallery at `#/motion/icon-swap`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One icon turning into the next – copy into a check, play into pause, menu into close. The old icon turns away, shrinks and blurs out as the new one turns in, in the same spot, so nothing around it moves. With `revert-after` it turns back on its own, like a copy button's check that goes back to the copy icon.

### When to use

- A button whose icon shows what just happened, such as copied or saved.
- A toggle whose icon shows its state, such as play and pause or open and closed.

### When not to use

- A status with a word beside it – use [Status Morph](status-morph.md).
- A one-time tick for something finished – use [Success Check](success-check.md).
- Swapping text or larger content – use [Blur Crossfade](blur-crossfade.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Box** `[data-ui="iswp"]` – one cell holding every icon, sized to the largest
2. **Icon** `[data-state]` – your own icons; the one showing has `data-active`, and while they swap the old one has `data-leaving` and the new one `data-enter`

## Looks

No look of its own. The icons keep their colour and size. It follows `--tc-duration-moderate` and `--tc-ease-move`, and a page can override `--tc-iswp-turn` (90deg), `--tc-iswp-shrink` (0.5) and `--tc-iswp-blur` (4px). With reduced motion the icons simply crossfade.

## Usage

### HTML

```html
<button type="button">
  <tc-icon-swap state="copy" revert-after="1600" announce>
    <svg data-state="copy" data-label="Copy" viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="14" height="14" rx="2" /></svg>
    <svg data-state="done" data-label="Link copied" viewBox="0 0 24 24" width="16" height="16"><path d="M20 6 9 17l-5-5" /></svg>
  </tc-icon-swap>
  Copy link
</button>

<script type="module">
  import "@adamstavely/trenchcoat/icon-swap";
  import "@adamstavely/trenchcoat/tokens.css";
  const swap = document.querySelector("tc-icon-swap");
  swap.closest("button").addEventListener("click", () => (swap.state = "done"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { IconSwap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CopyLink({ url }: { url: string }) {
  const [state, setState] = useState("copy");
  return (
    <button type="button" onClick={() => void navigator.clipboard.writeText(url).then(() => setState("done"))}>
      <IconSwap state={state} onStateChange={setState} revertAfter={1600} announce>
        <svg data-state="copy" data-label="Copy" viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="14" height="14" rx="2" /></svg>
        <svg data-state="done" data-label="Link copied" viewBox="0 0 24 24" width="16" height="16"><path d="M20 6 9 17l-5-5" /></svg>
      </IconSwap>
      Copy link
    </button>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/icon-swap";
import "@adamstavely/trenchcoat/tokens.css";

const onStateChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-icon-swap @tc-state-change="onStateChange"></tc-icon-swap>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { IconSwap } from "@adamstavely/trenchcoat/angular/icon-swap";

@Component({
  selector: "app-icon-swap-example",
  imports: [IconSwap],
  template: `<tc-icon-swap (tc-state-change)="onStateChange($event)"></tc-icon-swap>`,
})
export class IconSwapExample {
  onStateChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/icon-swap";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";

  let el: TcIconSwap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-state-change", on);
    return () => el.removeEventListener("tc-state-change", on);
  });
</script>

<tc-icon-swap bind:this={el}></tc-icon-swap>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `state` | `state` | `string \| undefined` | `undefined` | The icon to show: the `data-state` of one of its icons; unset, or unknown, shows the first |
| `rest` | `rest` | `string \| undefined` | `undefined` | The resting state `revert-after` goes back to; by default the first icon's |
| `revertAfter` | `revert-after` | `number` | `0` | Go back to the resting state this many ms after a change away from it; 0 never does |
| `announce` | `announce` | `boolean` | `false` | Read each change's word out politely – the icon's `data-label`, else its state |
| `icons` | – | `IconSwapIcon[]` | – | Its icons: the children with a data-state |
| `current` | – | `string \| undefined` | – | The state showing – `state` when one of the icons has it, else the first icon's |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-state-change` | – | Yes | Going back to the resting state after `revert-after` ({ state }: IconSwapStateChange); cancelable – prevented, the icon stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-iswp-turn` | `90deg` | both |
| `--tc-iswp-shrink` | `0.5` | both |
| `--tc-iswp-blur` | `4px` | both |

#### Design tokens it reads (2)

`--tc-duration-moderate`, `--tc-ease-move`

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

*Also attributes: `state`, `rest`, `revert-after`, `announce` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-state-change` | Yes | `el.addEventListener("tc-state-change", (e) => …)` | `ref.current.addEventListener("tc-state-change", …)` | `@tc-state-change="…"` | `(tc-state-change)="…($event)"` | `el.addEventListener("tc-state-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `state` itself unless a listener calls `preventDefault()` on `tc-state-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-icon-swap id="icon-swap"></tc-icon-swap>

<script type="module">
  import "@adamstavely/trenchcoat/icon-swap";

  const el = document.querySelector("#icon-swap");
  el.addEventListener("tc-state-change", (e) => {
    e.preventDefault(); // the element keeps its state…
    if (allowed(e.detail.state)) el.state = e.detail.state; // …until the app sets it
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
import "@adamstavely/trenchcoat/icon-swap";
import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";

const props = defineProps<{ initial: TcIconSwap["state"] }>();
const state = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStateChange = (e: CustomEvent<{ state: TcIconSwap["state"] }>) => {
  e.preventDefault();
  state.value = e.detail.state;
};
</script>

<template>
  <tc-icon-swap :state="state" @tc-state-change="onStateChange"></tc-icon-swap>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { IconSwap } from "@adamstavely/trenchcoat/angular/icon-swap";
import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";

@Component({
  selector: "app-controlled-icon-swap",
  imports: [IconSwap],
  template: `<tc-icon-swap [state]="state()" (tc-state-change)="onStateChange($event)"></tc-icon-swap>`,
})
export class ControlledIconSwap {
  readonly initial = input.required<TcIconSwap["state"]>();
  readonly state = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStateChange(e: CustomEvent<{ state: TcIconSwap["state"] }>) {
    e.preventDefault();
    this.state.set(e.detail.state);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/icon-swap";
  import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";

  let { initial }: { initial: TcIconSwap["state"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let state = $derived(initial);
  let el: TcIconSwap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      state = (e as CustomEvent<{ state: TcIconSwap["state"] }>).detail.state;
    };
    el.addEventListener("tc-state-change", on);
    return () => el.removeEventListener("tc-state-change", on);
  });
</script>

<tc-icon-swap bind:this={el} {state}></tc-icon-swap>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-icon-swap")` returns a `TcIconSwap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";`
- **React / Next.js:** Props: `import type { IconSwapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IconSwap>`. The element class, for refs: `import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIconSwap["state"]` with `import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";`
- **Angular:** The directive types the template: `[state]` takes `TcIconSwap["state"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIconSwap } from "@adamstavely/trenchcoat/icon-swap";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `state` | `string` | The icon to show, by its data-state – controlled when given |
| `defaultState` | `string` | The state to start in, uncontrolled |
| `onStateChange` | `(state: string) => void` | The element is going back to its resting state after `revertAfter` |

*Renamed or hidden on the wrapper: `state`*

## Accessibility

### Keyboard

Nothing to operate. It takes no focus; the button or toggle around it does.

### Screen readers

The icons are hidden from screen readers – name the control around it in words. A toggle should say its state with `aria-pressed` or `aria-expanded`. With `announce`, each change reads the new icon's `data-label` politely, which suits a result like "Link copied" that has no other words on screen.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 6.5 KB | 2.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **13.2 KB** | **4.9 KB** |
| With Lit – the first component on a page | 32.8 KB | 11.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 7.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Give each icon a `data-state`, and a `data-label` when you use `announce`. Keep the icons the same size so the swap stays in place. The resting state is the first icon's, or `rest`.

## Do and don't

### Do

- Use `revert-after` for a momentary result (1.5–2 seconds), so the control is ready again.
- Name the control in words as well, such as "Copy link".

### Don't

- Don't swap on hover. The movement is for something that happened.
- Don't put more than one meaning in a swap. Copied and failed need words.

## Related

- [Status Morph](status-morph.md) – One state's mark changing into the next with its word – pending, checking, done, failed or warning – with polite announcing on request
- [Success Check](success-check.md) – A small tick that draws itself once, for shared or saved, and then rests
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- [Button](../components/button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state
