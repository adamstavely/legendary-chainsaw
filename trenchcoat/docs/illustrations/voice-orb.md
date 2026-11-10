<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Voice Orb

**Illustrations**

The face of a voice assistant – a sphere of dots that breathes, catches sound, collapses into a spinning ring while thinking and ripples when it speaks

- **Element:** `<tc-voice-orb>`
- **Size:** 9.7 KB gzip · 25.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/voice-orb";` |
| React / Next.js | `import { VoiceOrb } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/voice-orb";` · tags starting with tc- are custom elements |
| Angular | `import { VoiceOrb } from "@adamstavely/trenchcoat/angular/voice-orb";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/voice-orb";` |

## Example

The live example is in the gallery at `#/illustrations/voice-orb`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The face of a voice assistant: a sphere of dots that shows what the assistant is doing. Idle, it turns slowly and
breathes; listening, its dots jump outward with the input level; thinking, it collapses into a fast spinning ring
with a light running round it; speaking, waves travel from pole to pole. States melt into each other, the dots give
way to the pointer, and a short line underneath says the state in words. Feed it `level` from real audio, or leave
it unset and the orb fakes a natural one.

`variant` changes the face. Every one shows the four states and follows `level`, and they rest and stop for reduced motion
in the same way.

| Variant | Idle | Listening and speaking | Thinking |
|---|---|---|---|
| `sphere` | A turning sphere of dots | Dots jump out, or waves travel across | Collapses to a spinning ring |
| `ring` | A still circle that breathes | The line ripples | A light runs around it |
| `wave` | Almost flat lines | The lines swell in the middle | A small packet travels along them |
| `bars` | Five low pills | An equaliser | A bump passes along them |
| `blob` | A soft drop of the accent colour | Its edge moves and it grows | Its light circles inside |
| `orbit` | Beads on three tilted paths | The paths widen and shake | The beads race |

`dots` and the pointer effect apply only to `sphere`.

### When to use

- The centre of a voice conversation, showing whether the assistant is waiting, hearing, working or talking.
- A start button for voice input – set `pressable` (or pass `onPress` in React) and listen for `tc-press`.
- Driven by a microphone or playback meter, through `level` from 0 to 1.

### When not to use

- The whole voice conversation – transcript, mute, interrupt and end – use [Voice Mode](../components/voice-mode.md), which can sit around the
  orb.
- Dictating into a text field of a chat card – use [Writing Assistant](../components/writing-assistant.md).
- A plain “working on it” indicator in text or chat – use [Thinking Loader](../components/thinking-loader.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Sphere** `.ui-vo__canvas` – the dots, drawn on a canvas at `size` pixels square
2. **State line** `.ui-vo__label` – the state in words (“Tap to speak”, “Listening”), with blinking dots while busy

## Usage

### HTML

```html
<tc-voice-orb id="orb" pressable></tc-voice-orb>

<script type="module">
  import "@adamstavely/trenchcoat/voice-orb";
  import "@adamstavely/trenchcoat/tokens.css";

  const orb = document.querySelector("#orb");
  orb.label = { idle: "Ask anything" };
  orb.addEventListener("tc-press", () => {
    orb.state = orb.state === "idle" ? "listening" : "idle";
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { VoiceOrb, type VoiceOrbState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function VoiceButton() {
  const [state, setState] = useState<VoiceOrbState>("idle");
  return <VoiceOrb state={state} size={180} onPress={() => setState((s) => (s === "idle" ? "listening" : "idle"))} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/voice-orb";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";

defineProps<{ label: TcVoiceOrb["label"]; interactive: TcVoiceOrb["interactive"] }>();
const onPress = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-voice-orb :label="label" :interactive="interactive" @tc-press="onPress"></tc-voice-orb>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { VoiceOrb } from "@adamstavely/trenchcoat/angular/voice-orb";
import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";

@Component({
  selector: "app-voice-orb-example",
  imports: [VoiceOrb],
  template: `<tc-voice-orb [label]="label()" [interactive]="interactive()" (tc-press)="onPress($event)"></tc-voice-orb>`,
})
export class VoiceOrbExample {
  readonly label = input.required<TcVoiceOrb["label"]>();
  readonly interactive = input.required<TcVoiceOrb["interactive"]>();
  onPress(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/voice-orb";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";

  let { label, interactive }: { label: TcVoiceOrb["label"]; interactive: TcVoiceOrb["interactive"] } = $props();
  let el: TcVoiceOrb;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-press", on);
    return () => el.removeEventListener("tc-press", on);
  });
</script>

<tc-voice-orb bind:this={el} {label} {interactive}></tc-voice-orb>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `state` | `state` | `VoiceOrbState` | `"idle"` | idle · listening · thinking · speaking |
| `variant` | `variant` | `VoiceOrbVariant` | `"sphere"` | The face: sphere (dots), ring, wave, bars, blob or orbit |
| `level` | `level` | `number \| undefined` | `undefined` | Input or output loudness from 0 to 1 – unset, the orb fakes a natural level |
| `size` | `size` | `number` | `220` | Edge length in px |
| `dots` | `dots` | `number` | `520` | Number of dots in the sphere – more is denser and costs a little more |
| `accent` | `accent` | `string \| undefined` | `undefined` | Colour the moving dots take on – any CSS colour. The resting dots use the text colour |
| `label` | – | `boolean \| Partial<Record<VoiceOrbState, string>>` | `true` | The line under the orb; false hides it, an object replaces single texts |
| `interactive` | – | `boolean` | `true` | The sphere's dots give way to the pointer |
| `pressable` | `pressable` | `boolean` | `false` | Makes the orb a button (a native one inside) that fires tc-press |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-press` | – | No | The orb was pressed (only when `pressable`); detail: undefined |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-voice-orb-accent` | `light-dark(#2f6bff, #6f9bff)` | both |
| `--tc-voice-orb-blink` | `1.2s` | both |

#### Design tokens it reads (16)

`--tc-duration-fast`, `--tc-duration-slow`, `--tc-duration-slowest`, `--tc-ease-emphasized`, `--tc-ease-standard`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-space-0-5`, `--tc-text-muted`, `--tc-text-primary`, `--tc-voice-orb-size`

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
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-voice-orb :label="…">` | `<tc-voice-orb [label]="…">` | `<tc-voice-orb {label}>` |
| `interactive` | `el.interactive = …;` | `<… interactive={…} />` | `<tc-voice-orb :interactive="…">` | `<tc-voice-orb [interactive]="…">` | `<tc-voice-orb {interactive}>` |

*Also attributes: `state`, `variant`, `level`, `size`, `dots`, `accent`, `pressable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-press` | No | `el.addEventListener("tc-press", (e) => …)` | `ref.current.addEventListener("tc-press", …)` | `@tc-press="…"` | `(tc-press)="…($event)"` | `el.addEventListener("tc-press", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-voice-orb")` returns a `TcVoiceOrb` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";`
- **React / Next.js:** Props: `import type { VoiceOrbProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof VoiceOrb>`. The element class, for refs: `import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcVoiceOrb["label"]` with `import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";`
- **Angular:** The directive types the template: `[label]` takes `TcVoiceOrb["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcVoiceOrb } from "@adamstavely/trenchcoat/voice-orb";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onPress` | `() => void` | Makes the orb a button, e.g. to start and stop listening |

*Renamed or hidden on the wrapper: `pressable`*

## Accessibility

### Keyboard

Not pressable, there is nothing to operate. Pressable, the orb is a native button:

| Key | What it does |
|---|---|
| Tab | Moves focus to the orb |
| Enter / Space | Presses it – fires `tc-press` |

### Screen readers

Not pressable, the host is `role="img"` named by the state: “Voice assistant: Listening” (an `aria-label` or
`aria-labelledby` the page sets itself is kept). Pressable, a native `<button>` inside holds the orb; its name is
the state line (“Tap to speak”), or “Voice assistant: Tap to speak” when `label` is `false`, and ARIA attributes set
on the host move to the button. The state line is a polite live region (`aria-live="polite"`) that is re-rendered
with each new state. The canvas is hidden from assistive tech.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | internal/voice-orb-painters | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 14.2 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/voice-orb-painters` · Shared Trenchcoat code | 3.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **25.1 KB** | **9.7 KB** |
| With Lit – the first component on a page | 45.3 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- The default lines are “Tap to speak”, “Listening”, “Thinking” and “Speaking”. Replace single ones with an object
  – `{ idle: "Ask anything" }` – and keep them to one or two words.
- Write the idle line as what to do; write the others as what the assistant is doing.
- Hide the line (`label = false`) only when the same state is shown in words nearby.

## Do and don't

### Do

- Pass a real `level` while listening or speaking, so the dots move with the voice.
- Set `accent` to your brand colour – the moving dots take it on; the resting dots stay in the text colour.
- Use `bars` or `wave` when small: they stay readable at 40 px, where a sphere's dots blur.
- Lower `dots` for small orbs or many on one page – fewer dots draw faster.

### Don't

- Don't use the motion as the only signal of state – keep the line, or show the state elsewhere.
- Don't leave it in `listening` when the microphone is off – switch back to `idle`.
- Don't set `pressable` when nothing happens on a press; an orb that looks like a button should act like one.

## Related

- [Voice Mode](../components/voice-mode.md) – A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn
- [Writing Assistant](../components/writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation
- [Thinking Loader](../components/thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check

## Changelog

- `tc-voice-mode` – a voice conversation: `tc-voice-orb` for the state, live captions that announce finished turns once, and Mute / Captions / Interrupt / End in a toolbar; Esc interrupts. The audio stays the app's.
