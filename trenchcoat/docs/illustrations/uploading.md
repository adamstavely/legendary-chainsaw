<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Uploading

**Illustrations** · New

A document with an arrow rising out of a tray on it, with the words Uploading, for a file on its way up – the in-progress sibling of Upload Failed

- **Element:** `<tc-uploading>`
- **Size:** 5.1 KB gzip · 13.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/uploading";` |
| React / Next.js | `import "@adamstavely/trenchcoat/uploading";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/uploading";` · tags starting with tc- are custom elements |
| Angular | `import { Uploading } from "@adamstavely/trenchcoat/angular/uploading";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/uploading";` |

## Example

The live example is in the gallery at `#/illustrations/uploading`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A document with a round badge showing an arrow rising out of a tray, for a file on its way up, with the words
Uploading. It's the in-progress sibling of `upload-failed` – the same upward arrow, here making it – and it's drawn like
the workflow stages beside `awaiting-review`, so an upload reads the same way as work moving along. On the badge, the
arrow rises out of the tray a few times, then it rests.

### When to use

- A file or a batch of files going up, where the wait is long enough to need saying: "Your scanned receipts are
  uploading".
- A panel that will show the file once it's up, while it isn't yet.

### When not to use

- The upload didn't finish – use [Upload Failed](upload-failed.md).
- A file coming down to the person – use [Downloading](downloading.md).
- The file is up and being worked on – use [Processing](processing.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Page** `.ui-upl-page` – the document
2. **Mark** `.ui-upl-badge` – the round badge, with the tray and the arrow drawn on it in ink
3. **Words** `.ui-upl-caption` – what's happening; the default is Uploading

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own, so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-uploading></tc-uploading>

<script type="module">
  import "@adamstavely/trenchcoat/uploading";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { Uploading } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return <Uploading />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/uploading";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-uploading></tc-uploading>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { Uploading } from "@adamstavely/trenchcoat/angular/uploading";

@Component({
  selector: "app-uploading-example",
  imports: [Uploading],
  template: `<tc-uploading></tc-uploading>`,
})
export class UploadingExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/uploading";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcUploading } from "@adamstavely/trenchcoat/uploading";

  let el: TcUploading;
</script>

<tc-uploading bind:this={el}></tc-uploading>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `caption` | `caption` | `string` | `"Uploading"` | The words under the drawing; "" leaves them out |
| `label` | `label` | `string` | `""` | Accessible description, when it should say more than `caption` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-uploading-page` | `light-dark(#ffffff, #2a2a2e)` | both |
| `--tc-uploading-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.1))` | both |
| `--tc-uploading-fold` | `light-dark(#eef1f5, #35373d)` | both |
| `--tc-uploading-line` | `light-dark(#e6e9ee, #44464d)` | both |
| `--tc-uploading-mark` | `light-dark(#eaf3d2, #34421a)` | both |
| `--tc-uploading-mark-edge` | `light-dark(#b2cd6a, #9fbf52)` | both |
| `--tc-uploading-ink` | `light-dark(#4e6a10, #e3f1c4)` | both |
| `--tc-uploading-glow` | `light-dark(rgba(160, 200, 80, 0.24), rgba(160, 200, 80, 0.12))` | both |
| `--tc-uploading-soft` | `12px` | both |
| `--tc-uploading-beat` | `3.2s` | both |

#### Design tokens it reads (6)

`--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-text-primary`

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

*Also attributes: `caption`, `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-uploading")` returns a `TcUploading` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcUploading } from "@adamstavely/trenchcoat/uploading";`
- **React / Next.js:** The element class: `import type { TcUploading } from "@adamstavely/trenchcoat/uploading";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcUploading["caption"]` with `import type { TcUploading } from "@adamstavely/trenchcoat/uploading";`
- **Angular:** The directive types the template: `[caption]` takes `TcUploading["caption"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcUploading } from "@adamstavely/trenchcoat/uploading";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcUploading } from "@adamstavely/trenchcoat/uploading";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

The host is `role="img"`, named by `label` or else by `caption`, so what's happening is announced. With `caption=""` and
no `label` it's decorative and skipped, for when the words beside it say the same.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 6.4 KB | 2.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **13.6 KB** | **5.1 KB** |
| With Lit – the first component on a page | 33.2 KB | 11.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 11 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Say what's going up and whether the person can leave: "Keep this page open until it's done", or "You can close this –
we'll finish in the background".

## Do and don't

### Do

- Pair it with real progress when you have it – a bar, a count of files or a percentage beside it.
- Swap it for `upload-failed` with the reason when an upload fails, so the two read as one story.

### Don't

- Don't leave it up after the upload finished or failed; it says something's still happening.
- Don't use it for a short upload inside a field – use a progress bar in the field.

## Related

- [Downloading](downloading.md) – A document with an arrow dropping into a tray on it, with the words Downloading, for a file or an export on its way to the person
- [Upload Failed](upload-failed.md) – A file lifted above an open tray, its upload arrow stopping short, with a red cross badge and the words Upload failed, for a file that's too large, isn't accepted or didn't finish uploading
- [Processing](processing.md) – A document with a progress ring on it, with the word Processing, for a long job that's still running – an export, a scan or a background task
- [Awaiting Review](awaiting-review.md) – A document with an hourglass on it, with the words Awaiting review, for content held until someone approves it
- [Released](released.md) – A document with a check on it and a few sparks around it, with the words Released, for content that's out and live
