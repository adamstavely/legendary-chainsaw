<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Glow Keyboard

**Illustrations**

AI chat input that types itself over a glass keyboard – every key press sends a wave up the gradient floor; after typing each prompt once the scene rests

- **Element:** `<tc-glow-keyboard>`
- **Size:** 12.4 KB gzip · 37.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/glow-keyboard";` |
| React / Next.js | `import { GlowKeyboard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/glow-keyboard";` · tags starting with tc- are custom elements |
| Angular | `import { GlowKeyboard } from "@adamstavely/trenchcoat/angular/glow-keyboard";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/glow-keyboard";` |

## Example

The live example is in the gallery at `#/illustrations/glow-keyboard`, at 320 px, 480 px or full width.

## Overview

A hero scene for an AI product: a chat input floating above a glass keyboard and a moving gradient floor. The input
types its prompts by itself, key by key, with a human rhythm and the odd typo, and sends each one with Enter. Every
key press lights up the drawn key, sends a wave up out of the gradient and a flash through the input's glow. People
can click anywhere on it and type themselves – their keys light up the same way. After each prompt has been typed
once, the scene rests.

### When to use

- The hero of a landing page or a launch post for an AI assistant, where typing is the product.
- An onboarding or empty screen that invites people to write their first prompt – listen for `tc-submit`, which
  fires for the prompts it types itself as well as for people's.

### When not to use

- The real input of a chat – use [Chat Composer](../components/chat-composer.md).
- A gradient glow behind other content – use [Gradient Floor](../motion/gradient-floor.md).
- A voice assistant – use [Voice Orb](voice-orb.md).
- An assistant card people actually work in – use [Writing Assistant](../components/writing-assistant.md).

## Usage

### HTML

```html
<tc-glow-keyboard id="hero" placeholder="Ask AI anything..."></tc-glow-keyboard>

<script type="module">
  import "@adamstavely/trenchcoat/glow-keyboard";
  import "@adamstavely/trenchcoat/tokens.css";

  const scene = document.querySelector("#hero");
  scene.prompts = ["Summarise this week's support tickets", "Draft a reply to Maya"];
  scene.addEventListener("tc-submit", (e) => console.log(e.detail.text));
</script>
```

### React / Next.js

```tsx
import { GlowKeyboard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Hero() {
  return (
    <GlowKeyboard
      prompts={["Summarise this week's support tickets", "Draft a reply to Maya"]}
      onSubmit={(text) => console.log(text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/glow-keyboard";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";

defineProps<{ prompts: TcGlowKeyboard["prompts"] }>();
const onSubmit = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-glow-keyboard :prompts="prompts" @tc-submit="onSubmit"></tc-glow-keyboard>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GlowKeyboard } from "@adamstavely/trenchcoat/angular/glow-keyboard";
import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";

@Component({
  selector: "app-glow-keyboard-example",
  imports: [GlowKeyboard],
  template: `<tc-glow-keyboard [prompts]="prompts()" (tc-submit)="onSubmit($event)"></tc-glow-keyboard>`,
})
export class GlowKeyboardExample {
  readonly prompts = input.required<TcGlowKeyboard["prompts"]>();
  onSubmit(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/glow-keyboard";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";

  let { prompts }: { prompts: TcGlowKeyboard["prompts"] } = $props();
  let el: TcGlowKeyboard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-submit", on);
    return () => el.removeEventListener("tc-submit", on);
  });
</script>

<tc-glow-keyboard bind:this={el} {prompts}></tc-glow-keyboard>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `prompts` | – | `string[]` | `["Find a quiet hike near Zermatt", "Plan a sunrise climb for Saturday", "What should I pack for two days?"]` | Prompts the demo types one after another, once each – each one is sent with Enter |
| `placeholder` | `placeholder` | `string` | `"Ask AI anything..."` | Placeholder in the chat input (also its accessible name) |
| `label` | `label` | `string` | `"AI chat input above a glass keyboard and a moving colour gradient"` | Accessible name of the scene (the host is a group) |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-submit` | – | No | A prompt was sent with Enter, by the demo or by the user. Detail: { text: string } |

#### Design tokens it reads (38)

`--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-in-out`, `--tc-ease-out`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-glow-keyboard-beat`, `--tc-glow-keyboard-bg`, `--tc-glow-keyboard-blink`, `--tc-glow-keyboard-board-bg`, `--tc-glow-keyboard-board-border`, `--tc-glow-keyboard-board-inner`, `--tc-glow-keyboard-board-shadow`, `--tc-glow-keyboard-breathe`, `--tc-glow-keyboard-caret`, `--tc-glow-keyboard-floor-white`, `--tc-glow-keyboard-glow-a`, `--tc-glow-keyboard-glow-b`, `--tc-glow-keyboard-glow-blur`, `--tc-glow-keyboard-input-bg`, `--tc-glow-keyboard-input-border`, `--tc-glow-keyboard-input-inner`, `--tc-glow-keyboard-key-bg`, `--tc-glow-keyboard-key-down-bg`, `--tc-glow-keyboard-key-down-inner`, `--tc-glow-keyboard-key-down-text`, `--tc-glow-keyboard-key-drop`, `--tc-glow-keyboard-key-edge`, `--tc-glow-keyboard-key-inner`, `--tc-glow-keyboard-key-text`, `--tc-glow-keyboard-placeholder`, `--tc-glow-keyboard-ring-white`, `--tc-glow-keyboard-tap`, `--tc-glow-keyboard-text`, `--tc-glow-keyboard-touchid`

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
| `prompts` | `el.prompts = …;` | `<… prompts={…} />` | `<tc-glow-keyboard :prompts="…">` | `<tc-glow-keyboard [prompts]="…">` | `<tc-glow-keyboard {prompts}>` |

*Also attributes: `placeholder`, `label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-submit` | No | `el.addEventListener("tc-submit", (e) => …)` | `ref.current.addEventListener("tc-submit", …)` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-glow-keyboard")` returns a `TcGlowKeyboard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";`
- **React / Next.js:** Props: `import type { GlowKeyboardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GlowKeyboard>`. The element class, for refs: `import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGlowKeyboard["prompts"]` with `import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";`
- **Angular:** The directive types the template: `[prompts]` takes `TcGlowKeyboard["prompts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGlowKeyboard } from "@adamstavely/trenchcoat/glow-keyboard";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onSubmit` | `(text: string) => void` | Called when a prompt is sent with Enter – by the demo or by the user |

*Renamed or hidden on the wrapper: `children`, `look`, `onSubmit`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves focus into the input; the self-typing demo stops for good |
| Any key | Types into the input and lights up the matching key on the drawn keyboard |
| Enter | Sends what was typed (`tc-submit`) and clears the input – not while an IME is composing |

### Screen readers

The element is a group named by `label` (“AI chat input above a glass keyboard and a moving colour gradient” by
default) unless the page names it; the input inside is named by `placeholder`. The keyboard, the floor and the glow
are hidden. Reduced motion keeps the scene still and skips the self-typing; typing still works.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| backdrop-filter (with the -webkit- prefix) | 76 (Edge 17) | 103 | 9 | 9 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 30.2 KB | 10.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **37.0 KB** | **12.4 KB** |
| With Lit – the first component on a page | 57.7 KB | 19.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 117 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of prompts replaced |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.7 ms | prompts: first render, 117 nodes; update 0.3 ms |
| 1,000 items | 2.4 ms | prompts: first render, 117 nodes; update 0.3 ms |

What it renders doesn't grow with prompts (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **53 frames/s** on screen, **0 timer callbacks/s** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 5 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `prompts` as things your users would really ask, short enough to type in a few seconds: “Find a quiet hike
  near Zermatt”.
- Two or three prompts are enough – each is typed once, then the scene rests.
- Make `placeholder` an invitation: “Ask AI anything...”.

## Related

- [Chat Composer](../components/chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Gradient Floor](../motion/gradient-floor.md) – A blurred colour gradient that glows up from the bottom edge – two layers that drift and morph, then settle
- [Voice Orb](voice-orb.md) – The face of a voice assistant – a sphere of dots that breathes, catches sound, collapses into a spinning ring while thinking and ripples when it speaks
- [Writing Assistant](../components/writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation
