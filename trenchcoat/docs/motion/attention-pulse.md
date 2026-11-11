<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Attention Pulse

**Motion** · New

Draws the eye once – a soft ring passes around something new a single time, and never on page load

- **Element:** `<tc-attention-pulse>`
- **Size:** 4.0 KB gzip · 10.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/attention-pulse";` |
| React / Next.js | `import "@adamstavely/trenchcoat/attention-pulse";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/attention-pulse";` · tags starting with tc- are custom elements |
| Angular | `import { AttentionPulse } from "@adamstavely/trenchcoat/angular/attention-pulse";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/attention-pulse";` |

## Example

The live example is in the gallery at `#/motion/attention-pulse`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Draws the eye once. Wrap what's new, such as a notice, and when `pulse-key` changes a soft ring passes around it a single time. It never loops and never fires on page load.

### When to use

- A notice that has just appeared or changed, such as an entitlement warning.
- A value someone needs to see has updated.

### When not to use

- An ongoing state – show it in words.
- Something on first load, where nothing has changed.
- Announcing to screen readers – use a `role="status"` message.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Host** `[data-ui="atp"]` – wraps the content, and carries the ring

## Looks

No look of its own. A page can set `--tc-attention-pulse-color`, `--tc-attention-pulse-radius` and `--tc-attention-pulse-reach`.

## Usage

### HTML

```html
<tc-attention-pulse pulse-key="1"><p>1 person isn't authorized.</p></tc-attention-pulse>

<script type="module">
  import "@adamstavely/trenchcoat/attention-pulse";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { AttentionPulse } from "@adamstavely/trenchcoat/react";

export function Notice({ id, text }: { id: string; text: string }) {
  return <AttentionPulse pulseKey={id}><p>{text}</p></AttentionPulse>;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/attention-pulse";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-attention-pulse></tc-attention-pulse>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { AttentionPulse } from "@adamstavely/trenchcoat/angular/attention-pulse";

@Component({
  selector: "app-attention-pulse-example",
  imports: [AttentionPulse],
  template: `<tc-attention-pulse></tc-attention-pulse>`,
})
export class AttentionPulseExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/attention-pulse";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAttentionPulse } from "@adamstavely/trenchcoat/attention-pulse";

  let el: TcAttentionPulse;
</script>

<tc-attention-pulse bind:this={el}></tc-attention-pulse>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `pulseKey` | `pulse-key` | `string \| number \| undefined` | `undefined` | Change this to pulse once |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-attention-pulse-color` | `var(--tc-focus-ring)` | both |
| `--tc-attention-pulse-radius` | `var(--tc-control-radius-md)` | both |
| `--tc-attention-pulse-reach` | `var(--tc-space-2)` | both |

#### Design tokens it reads (5)

`--tc-control-radius-md`, `--tc-duration-reveal`, `--tc-ease-move`, `--tc-focus-ring`, `--tc-space-2`

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

*Also attributes: `pulse-key` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-attention-pulse")` returns a `TcAttentionPulse` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAttentionPulse } from "@adamstavely/trenchcoat/attention-pulse";`
- **React / Next.js:** The element class: `import type { TcAttentionPulse } from "@adamstavely/trenchcoat/attention-pulse";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAttentionPulse["pulseKey"]` with `import type { TcAttentionPulse } from "@adamstavely/trenchcoat/attention-pulse";`
- **Angular:** The directive types the template: `[pulseKey]` takes `TcAttentionPulse["pulseKey"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAttentionPulse } from "@adamstavely/trenchcoat/attention-pulse";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAttentionPulse } from "@adamstavely/trenchcoat/attention-pulse";`

## Accessibility

### Keyboard

Nothing to operate. It takes no focus.

### Screen readers

It says nothing, because it's only a visual cue. Announce anything important in words as well.

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 3.8 KB | 1.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **10.5 KB** | **4.0 KB** |
| With Lit – the first component on a page | 30.1 KB | 10.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.0 ms** | re-render with the same data |
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

Set `--tc-attention-pulse-radius` to match what it wraps.

## Do and don't

### Do

- Use it rarely, so it still means something.

### Don't

- Don't pulse on a timer. Flashing and repeated motion is distracting and an accessibility problem.

## Related

- [Success Check](success-check.md) – A small tick that draws itself once, for shared or saved, and then rests
- [Notification Stack](../components/notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Guardrail Notice](../components/guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review
- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.

## Changelog

- **Collapse** (`tc-collapse`), **Success Check** (`tc-success-check`) and **Attention Pulse** (`tc-attention-pulse`) – opening and shutting, a one-time tick, and a one-time ring to draw the eye.
