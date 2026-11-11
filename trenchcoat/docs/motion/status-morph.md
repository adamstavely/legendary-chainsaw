<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Status Morph

**Motion** · New

One state's mark changing into the next with its word – pending, checking, done, failed or warning – with polite announcing on request

- **Element:** `<tc-status-morph>`
- **Size:** 4.8 KB gzip · 12.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/status-morph";` |
| React / Next.js | `import "@adamstavely/trenchcoat/status-morph";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/status-morph";` · tags starting with tc- are custom elements |
| Angular | `import { StatusMorph } from "@adamstavely/trenchcoat/angular/status-morph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/status-morph";` |

## Example

The live example is in the gallery at `#/motion/status-morph`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One state's mark changing into the next, with its word. The old mark fades and shrinks as the new one grows in, so a change of status is seen without any jump. Nothing loops.

### When to use

- A check or job moving through states, such as checking to done.
- A row whose status changes while someone's reading it.

### When not to use

- A one-time tick for something finished – use [Success Check](success-check.md).
- Swapping whole pieces of content – use [Blur Crossfade](blur-crossfade.md).
- A long list of steps – use [Progress Tracker](../components/progress-tracker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Mark** `.ui-smo-mark` – holds `.ui-smo-icon`, the state's mark
2. **Word** `.ui-smo-word` – the state in words

## Looks

No look of its own. It follows the status tokens, `--tc-duration-moderate` and `--tc-ease-move`, and sizes to the surrounding text.

## Usage

### HTML

```html
<tc-status-morph status="checking" announce></tc-status-morph>

<script type="module">
  import "@adamstavely/trenchcoat/status-morph";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { StatusMorph } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Check({ done }: { done: boolean }) {
  return <StatusMorph status={done ? "done" : "checking"} announce />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/status-morph";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";

defineProps<{ labels: TcStatusMorph["labels"] }>();
</script>

<template>
  <tc-status-morph :labels="labels"></tc-status-morph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StatusMorph } from "@adamstavely/trenchcoat/angular/status-morph";
import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";

@Component({
  selector: "app-status-morph-example",
  imports: [StatusMorph],
  template: `<tc-status-morph [labels]="labels()"></tc-status-morph>`,
})
export class StatusMorphExample {
  readonly labels = input.required<TcStatusMorph["labels"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/status-morph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";

  let { labels }: { labels: TcStatusMorph["labels"] } = $props();
  let el: TcStatusMorph;
</script>

<tc-status-morph bind:this={el} {labels}></tc-status-morph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `status` | `StatusMorphStatus` | `"pending"` | The state: "pending", "checking", "done", "failed" or "warning" |
| `label` | `label` | `string \| undefined` | `undefined` | The word beside the mark, in place of the status's own word |
| `announce` | `announce` | `boolean` | `false` | Read each change out politely |
| `labels` | – | `Partial<StatusMorphLabels>` | `{}` | Rename any of the words |

#### Design tokens it reads (10)

`--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-space-1-5`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-text-primary`, `--tc-text-secondary`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-status-morph :labels="…">` | `<tc-status-morph [labels]="…">` | `<tc-status-morph {labels}>` |

*Also attributes: `status`, `label`, `announce` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-status-morph")` returns a `TcStatusMorph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";`
- **React / Next.js:** The element class: `import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStatusMorph["labels"]` with `import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";`
- **Angular:** The directive types the template: `[labels]` takes `TcStatusMorph["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStatusMorph } from "@adamstavely/trenchcoat/status-morph";`

## Accessibility

### Keyboard

Nothing to operate. It takes no focus.

### Screen readers

The word is plain text and the mark is hidden. Changes aren't announced unless `announce` is set, which adds a `role="status"` message.

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
| **This piece alone** | 6.0 KB | 2.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **12.7 KB** | **4.8 KB** |
| With Lit – the first component on a page | 32.9 KB | 11.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 5 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |

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

Rename words with `labels`, or set `label` for one in context: "Checking access".

## Do and don't

### Do

- Set `announce` when a change matters and people aren't looking at it.

### Don't

- Don't use it for states that change many times a second. The movement stops meaning anything.

## Related

- [Success Check](success-check.md) – A small tick that draws itself once, for shared or saved, and then rests
- [Number Change](number-change.md) – A number that briefly highlights when it changes, tinted by direction with an arrow and a word for screen readers, and never on first render
- [Blur Crossfade](blur-crossfade.md) – Swaps content with a soft blur while the box glides smoothly to the size of what comes next
- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
