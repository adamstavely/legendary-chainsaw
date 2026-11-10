<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Face

**AI & chat** · New

Donovan's animated face, which shows what the agent is doing – nine states that blend on springs, blinks and glances, a nod or a hop, sharp from 16 to 256 px and resting when it isn't busy

- **Element:** `<tc-agent-face>`
- **Size:** 9.2 KB gzip · 25.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-face";` |
| React / Next.js | `import { AgentFace } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-face";` · tags starting with tc- are custom elements |
| Angular | `import { AgentFace } from "@adamstavely/trenchcoat/angular/agent-face";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-face";` |

## Example

The live example is in the gallery at `#/agent-face`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Donovan's face. It shows what the agent is doing, in nine states, and moves between them on springs. Each state holds
for a moment, so an agent that changes its mind quickly doesn't make the face flicker.

### When to use

- Beside the agent's name, in a chat composer or at the top of an answer, where a live sign of what it's doing helps.
- Anywhere Donovan speaks as a character, from a 16 px mark to a 256 px greeting.

### When not to use

- A voice conversation, where the sound level is the point – use [Voice Orb](../illustrations/voice-orb.md).
- Explaining what the agent is working on in words – use [Thinking State](thinking-state.md).
- As the only sign of an error or a wait. Say what's happening in text as well.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Face** `.ui-afc__face` – the `<agent-face>` element, which holds the canvas

## Looks

There's no Standard or Clean, because the face has no card. It has one gradient and floating white hands with a thin black outline, which read on light and dark surfaces. At 26 px and below there are no hands.
Motion overhangs the box without moving the layout, so leave some room around it, and don't clip a parent to its size.

## Usage

### HTML

```html
<tc-agent-face id="donovan" state="thinking" size="64"></tc-agent-face>

<script type="module">
  import "@adamstavely/trenchcoat/agent-face";
  import "@adamstavely/trenchcoat/tokens.css";

  const face = document.querySelector("#donovan");
  face.state = "speaking";
  face.playGesture("nod");
</script>
```

### React / Next.js

```tsx
import { AgentFace } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Status({ busy }: { busy: boolean }) {
  return <AgentFace state={busy ? "thinking" : "idle"} size={26} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-face";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";

defineProps<{ labels: TcAgentFace["labels"] }>();
</script>

<template>
  <tc-agent-face :labels="labels"></tc-agent-face>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentFace } from "@adamstavely/trenchcoat/angular/agent-face";
import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";

@Component({
  selector: "app-agent-face-example",
  imports: [AgentFace],
  template: `<tc-agent-face [labels]="labels()"></tc-agent-face>`,
})
export class AgentFaceExample {
  readonly labels = input.required<TcAgentFace["labels"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-face";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";

  let { labels }: { labels: TcAgentFace["labels"] } = $props();
  let el: TcAgentFace;
</script>

<tc-agent-face bind:this={el} {labels}></tc-agent-face>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `state` | `state` | `AgentFaceState` | `"idle"` | idle · listening · thinking · speaking · happy · confused · sleeping · error · surprised |
| `size` | `size` | `number` | `64` | Width and height in px, 16 to 256 |
| `name` | `name` | `string` | `"Donovan"` | Who the screen-reader label names |
| `label` | `label` | `string \| undefined` | `undefined` | Replaces the screen-reader label in every state |
| `labels` | – | `Partial<Record<AgentFaceState, string>>` | `{}` | Screen-reader labels per state, for translation |
| `announce` | `announce` | `boolean` | `false` | Also tells screen readers when the state changes |
| `motion` | `motion` | `AgentFaceMotion \| undefined` | `undefined` | full or reduced; unset, it follows the system setting |
| `restAfter` | `rest-after` | `number \| undefined` | `undefined` | How long, in ms, before the small movements fade out when Donovan isn't busy |
| `seed` | `seed` | `number \| undefined` | `undefined` | Makes the small movements repeatable |
| `amplitude` | `amplitude` | `number \| null` | `null` | How loud the agent is, 0 to 1, to drive the mouth while speaking; unset, it makes up speech |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `playGesture(gesture: AgentFaceGesture)` | `boolean` | Plays wave, nod, hop or spin once. Returns false when reduced motion rules it out |

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-face :labels="…">` | `<tc-agent-face [labels]="…">` | `<tc-agent-face {labels}>` |

*Also attributes: `state`, `size`, `name`, `label`, `announce`, `motion`, `rest-after`, `seed` and 1 more – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-face")` returns a `TcAgentFace` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";`
- **React / Next.js:** Props: `import type { AgentFaceProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentFace>`. The element class, for refs: `import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentFace["labels"]` with `import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";`
- **Angular:** The directive types the template: `[labels]` takes `TcAgentFace["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentFace } from "@adamstavely/trenchcoat/agent-face";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

## Accessibility

### Keyboard

The face takes no input, so it has no tab stop.

### Screen readers

The canvas is an image named for the state, such as "Donovan is thinking". Set `labels` to translate, `name` to change
who it names, or `label` for one name in every state. Changes stay silent unless you set `announce`, which adds a polite
`role="status"`. Leave it off where the chat already announces the same thing.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | src/vendor/agent-face/element/agent-face | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | src/vendor/agent-face/draw/draw-face | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | src/vendor/agent-face/element/agent-face | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-31 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 3.9 KB | 1.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/vendor/agent-face/element/agent-face.ts` · Dependency | 4.9 KB | – |
| `src/vendor/agent-face/engine/engine.ts` · Dependency | 4.6 KB | – |
| `src/vendor/agent-face/draw/draw-face.ts` · Dependency | 2.6 KB | – |
| `src/vendor/agent-face/engine/states.ts` · Dependency | 1.0 KB | – |
| `src/vendor/agent-face/draw/spear-tip.mjs` · Dependency | 0.6 KB | – |
| `src/vendor/agent-face/engine/spring.ts` · Dependency | 0.4 KB | – |
| `src/vendor/agent-face/element/loop.ts` · Dependency | 0.3 KB | – |
| `src/vendor/agent-face/engine/random.ts` · Dependency | 0.2 KB | – |
| `src/vendor/agent-face/element/index.ts` · Dependency | 0.1 KB | – |
| `src/vendor/agent-face/element/no-dom.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.1 KB** | **9.2 KB** |
| With Lit – the first component on a page | 44.7 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 6.3 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (src/vendor/agent-face/element/loop – addToLoop), `requestAnimationFrame` (src/vendor/agent-face/element/loop – frame).
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver` (src/vendor/agent-face/element/agent-face – AgentFace), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange` (src/vendor/agent-face/element/agent-face – AgentFace), `window resize` (src/vendor/agent-face/element/agent-face – AgentFace).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

| State | Use it when |
|---|---|
| `idle` | Ready, with nothing going on |
| `listening` | The person is typing or talking |
| `thinking` | Working towards an answer |
| `speaking` | Writing or saying the answer; `amplitude` can follow real audio |
| `happy` | Something finished well. Keep it brief |
| `confused` | It needs clarification |
| `sleeping` | Paused or away |
| `error` | Something failed |
| `surprised` | Something unexpected turned up |

## Do and don't

### Do

- Reuse one `state` across every face that stands for the same agent.
- Use `playGesture` for moments: a wave hello, or a nod when a task finishes.
- Keep `happy` and `hop` away from serious results, such as a declined payment or a fraud decision.

### Don't

- Don't rely on the face alone at 16 or 26 px, where most states are hard to tell apart.
- Don't use it for a person, or for an agent other than Donovan without changing `name`.

## Related

- [Voice Orb](../illustrations/voice-orb.md) – The face of a voice assistant – a sphere of dots that breathes, catches sound, collapses into a spinning ring while thinking and ripples when it speaks
- [Thinking Loader](thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- [Thinking State](thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- [Session State](session-state.md) – Where a long LLM session stands – a health pill, tiles for the primary goal, open loops, pending artifacts and context pressure with a meter that warns as it fills, and status chips, the tiles optionally opening what they count

## Changelog

- **Fixed:** `tc-agent-face` drew nothing from the built package, because the build dropped the vendored face.
- **Agent Face** (`tc-agent-face`) – Donovan's animated face: idle, listening, thinking, speaking, happy, confused, sleeping, error and surprised, blending on springs, with floating white hands, blinks, glances and `playGesture` for a wave, nod, hop or spin. It wraps `<agent-face>` from `agent-face/`, stops drawing when off screen, and rests when it isn't busy.
