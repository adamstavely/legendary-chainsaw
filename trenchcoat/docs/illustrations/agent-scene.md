<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Agent Scene

**Illustrations** · New

The assistant in a small scene – happy above an empty tray, thinking beside a stack of pages, or asleep beside a sign

- **Element:** `<tc-agent-scene>`
- **Size:** 10.3 KB gzip · 28.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-scene";` |
| React / Next.js | `import "@adamstavely/trenchcoat/agent-scene";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-scene";` · tags starting with tc- are custom elements |
| Angular | `import { AgentScene } from "@adamstavely/trenchcoat/angular/agent-scene";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-scene";` |

## Example

The live example is in the gallery at `#/illustrations/agent-scene`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The assistant in a small scene, for the states a page rests in: happy above an empty tray and waving once when all's
clear, thinking beside a stack of pages when working, and asleep beside a sign when offline. The face is `agent-face`, so
it follows reduced motion and rests when nothing's happening.

### When to use

- An empty inbox or queue, where being done is good news.
- A panel waiting on the assistant, or showing it's unavailable.

### When not to use

- Beside a serious decision or an error – use [Agent Face](../components/agent-face.md) alone, or [Something Wrong](something-wrong.md).
- Search with no results – use [Nothing Found](nothing-found.md).
- Someone without permission – use [No Access](no-access.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Scene** `.ui-ags-art` – the tray, pages or sign
2. **Face** `.ui-ags-face` – the assistant

## Looks

One look. Colours follow the page theme through `light-dark()`. A page can set `size`, the face's size in pixels.

## Usage

### HTML

```html
<tc-agent-scene scene="all-clear"></tc-agent-scene>
<h2>You're all caught up</h2>

<script type="module">
  import "@adamstavely/trenchcoat/agent-scene";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { AgentScene } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Empty() {
  return (
    <div>
      <AgentScene scene="all-clear" />
      <h2>You're all caught up</h2>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-scene";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-agent-scene></tc-agent-scene>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { AgentScene } from "@adamstavely/trenchcoat/angular/agent-scene";

@Component({
  selector: "app-agent-scene-example",
  imports: [AgentScene],
  template: `<tc-agent-scene></tc-agent-scene>`,
})
export class AgentSceneExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-scene";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentScene } from "@adamstavely/trenchcoat/agent-scene";

  let el: TcAgentScene;
</script>

<tc-agent-scene bind:this={el}></tc-agent-scene>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `scene` | `scene` | `AgentScene` | `"all-clear"` | Which scene: "all-clear", "working" or "offline" |
| `name` | `name` | `string` | `"Donovan"` | The assistant's name |
| `label` | `label` | `string` | `""` | Accessible description – when set, the scene is announced as an image; otherwise it is decorative |
| `size` | `size` | `number` | `96` | The face's size in pixels |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-scene-line` | `light-dark(#c3cad4, #5c6068)` | both |
| `--tc-agent-scene-page` | `light-dark(#ffffff, #2a2a2e)` | both |
| `--tc-agent-scene-bar` | `light-dark(#e6e9ee, #44464d)` | both |

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

*Also attributes: `scene`, `name`, `label`, `size` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-scene")` returns a `TcAgentScene` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentScene } from "@adamstavely/trenchcoat/agent-scene";`
- **React / Next.js:** The element class: `import type { TcAgentScene } from "@adamstavely/trenchcoat/agent-scene";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentScene["scene"]` with `import type { TcAgentScene } from "@adamstavely/trenchcoat/agent-scene";`
- **Angular:** The directive types the template: `[scene]` takes `TcAgentScene["scene"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentScene } from "@adamstavely/trenchcoat/agent-scene";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentScene } from "@adamstavely/trenchcoat/agent-scene";`

## Accessibility

### Keyboard

Nothing to operate. It takes no focus.

### Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped, so put the words beside it. With `label`, the host
becomes `role="img"` named by the label.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, src/vendor/agent-face/element/agent-face | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | src/vendor/agent-face/draw/draw-face | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
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
| **This piece alone** | 5.4 KB | 2.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [agent-face](../components/agent-face.md) · Element it renders | 1.7 KB | – |
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
| **Added to a page that already has Lit** | **28.5 KB** | **10.3 KB** |
| With Lit – the first component on a page | 47.9 KB | 16.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 4 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 3.6 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s, 0 timer callbacks/s** on screen, **nothing** scrolled away, **0 timer callbacks/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (src/vendor/agent-face/element/loop – addToLoop), `requestAnimationFrame` (src/vendor/agent-face/element/loop – frame).
- Timers: `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver` (src/vendor/agent-face/element/agent-face – AgentFace), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange` (src/vendor/agent-face/element/agent-face – AgentFace), `window resize` (src/vendor/agent-face/element/agent-face – AgentFace).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Pair it with a short heading ("You're all caught up"). Use `name` to rename the assistant.

## Do and don't

### Do

- Size its container: it fills the width at a 3 : 2 frame.
- Use it for resting states, and sparingly.

### Don't

- Don't use the happy scene near bad news. It's meant for good news only.

## Related

- [Agent Face](../components/agent-face.md) – Donovan's animated face, which shows what the agent is doing – nine states that blend on springs, blinks and glances, a nod or a hop, sharp from 16 to 256 px and resting when it isn't busy
- [Nothing Found](nothing-found.md) – A magnifying glass passing over blank results, for a search or filter with no matches; it looks across a few times and rests
- [Something Wrong](something-wrong.md) – Two connected tiles with the line between them broken, for a page or request that failed; the gap pulses a few times and rests
- [No Access](no-access.md) – A folder held shut by a padlock, for someone who isn't entitled to see what they opened; the lock settles a few times and rests

## Changelog

- **Agent Scene** (`tc-agent-scene`) – the assistant in a small scene for all clear, working and offline.
