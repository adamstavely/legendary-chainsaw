<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Preview Card

**Workspace & sessions** · New

A gallery tile – a large preview above a one-line title and a two-line description; a picture or a live component scaled down from its design width, a badge, a horizontal list form and a loading skeleton, the whole card one link

- **Element:** `<tc-preview-card>`
- **Size:** 6.3 KB gzip · 19.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/preview-card";` |
| React / Next.js | `import { PreviewCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/preview-card";` · tags starting with tc- are custom elements |
| Angular | `import { PreviewCard } from "@adamstavely/trenchcoat/angular/preview-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/preview-card";` |

## Example

The live example is in the gallery at `#/preview-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A gallery or index tile: a large preview on top, then a title and a line or two of description below a hairline. The
preview is a picture (`src`), or the page's own children – a live component or page – fitted by `fit`:
- `cover` fills the frame and crops.
- `contain` shows all of it.
- `scale` lays the children out at `preview-width` (1024px by default) and shrinks them to the card, like a thumbnail
  of a live page.

The title is a link (`href`) or a button that fires `tc-open`, and its hit area covers the whole card. `orientation`
"horizontal" puts the preview beside the words for a list, and `loading` shows a placeholder.

### When to use

- An index of components, templates, pages or files, one tile each.
- A gallery where seeing the thing helps people pick it.

### When not to use

- A whole section with counts and examples: use [Collection Card](collection-card.md).
- Working in the page it previews: use [Preview Frame](preview-frame.md).
- A section of a side panel: use [Panel Card](panel-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stage** `.ui-pvc__stage` – the area behind the preview: the tray in Standard, a well in Clean
2. **Frame** `.ui-pvc__frame` – the rounded frame, holding the picture `.ui-pvc__img` or under the live preview
3. **Badge** `.ui-pvc__badge` – the optional tag at the top right
4. **Body** `.ui-pvc__body` – the words: in Standard, a white card on the tray
5. **Title** `.ui-pvc__title` – a heading holding the link `.ui-pvc__link`, on one line
6. **Description** `.ui-pvc__description` – up to two lines

## Looks

Standard sets the preview on a gray tray and the words on a white card below it. Clean is one white card, with the
preview on a sunken well above a hairline. Both lift a little on hover and ring the whole card on focus. A page can set
`--tc-pvc-pad`, the preview's margin, `--tc-pvc-ratio`, the frame's shape (16 / 10 by default), and `--tc-pvc-side`,
the preview's width when horizontal (40%).

## Usage

### HTML

```html
<tc-preview-card heading="Agent Cursors" description="Agents working in a document like teammates" src="/shots/cursors.png" href="/agent-cursors" badge="New"></tc-preview-card>

<script type="module">
  import "@adamstavely/trenchcoat/preview-card";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { PreviewCard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Tile() {
  return <PreviewCard title="Agent Cursors" description="Agents working in a document like teammates" src="/shots/cursors.png" href="/agent-cursors" badge="New" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/preview-card";
import "@adamstavely/trenchcoat/tokens.css";

const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-preview-card @tc-open="onOpen"></tc-preview-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { PreviewCard } from "@adamstavely/trenchcoat/angular/preview-card";

@Component({
  selector: "app-preview-card-example",
  imports: [PreviewCard],
  template: `<tc-preview-card (tc-open)="onOpen($event)"></tc-preview-card>`,
})
export class PreviewCardExample {
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/preview-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPreviewCard } from "@adamstavely/trenchcoat/preview-card";

  let el: TcPreviewCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-preview-card bind:this={el}></tc-preview-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The title, on one line |
| `headingLevel` | `heading-level` | `number` | `3` | The heading's level, 2–6 |
| `description` | `description` | `string` | `""` | A line or two under the title |
| `src` | `src` | `string` | `""` | The preview picture; without it the page's children are the preview |
| `alt` | `alt` | `string` | `""` | What the picture shows; "" when the title says it |
| `fit` | `fit` | `PreviewCardFit` | `"cover"` | How the preview fills its frame: "cover", "contain", or "scale" – laid out at `preview-width` and shrunk to fit |
| `previewWidth` | `preview-width` | `number` | `1024` | The width a scaled preview is laid out at, in pixels |
| `badge` | `badge` | `string` | `""` | A short tag at the preview's top right, such as "New" |
| `href` | `href` | `string` | `""` | Where the card goes; without it the card is a button that fires tc-open |
| `orientation` | `orientation` | `PreviewCardOrientation` | `"vertical"` | "vertical" puts the preview above the words; "horizontal" beside them, for a list |
| `loading` | `loading` | `boolean` | `false` | Shows a placeholder while the card's content loads |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | The card was pressed (detail: { href }); cancelable – prevented, a link isn't followed |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pvc-pad` | `var(--tc-space-4)` | both |
| `--tc-pvc-ratio` | `16 / 10` | both |
| `--tc-pvc-side` | `40%` | both |
| `--tc-pvc-lift` | `calc(var(--tc-space-0-5) * -1)` | both |
| `--tc-pvc-w` | `1024px` | not set – this fallback applies |
| `--tc-pvc-h` | `640px` | not set – this fallback applies |
| `--tc-pvc-k` | `1` | not set – this fallback applies |

#### Design tokens it reads (41)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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

*Also attributes: `heading`, `heading-level`, `description`, `src`, `alt`, `fit`, `preview-width`, `badge` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

### Controlled

`tc-open` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-preview-card")` returns a `TcPreviewCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPreviewCard } from "@adamstavely/trenchcoat/preview-card";`
- **React / Next.js:** Props: `import type { PreviewCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PreviewCard>`. The element class, for refs: `import type { TcPreviewCard } from "@adamstavely/trenchcoat/preview-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPreviewCard["heading"]` with `import type { TcPreviewCard } from "@adamstavely/trenchcoat/preview-card";`
- **Angular:** The directive types the template: `[heading]` takes `TcPreviewCard["heading"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPreviewCard } from "@adamstavely/trenchcoat/preview-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPreviewCard } from "@adamstavely/trenchcoat/preview-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title, on one line |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the title's link, the card's one stop |
| Enter | Opens it (Space too when there's no `href`) |

### Screen readers

The title is a heading (`heading-level`, 3 by default) holding the link, so the card is named by its title. A picture
uses `alt`: leave it empty when the title says it. Live previews are inert and `aria-hidden`, so their controls can't
be reached or read. While `loading`, the card is `aria-busy`.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 12.3 KB | 4.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **19.4 KB** | **6.3 KB** |
| With Lit – the first component on a page | 39.0 KB | 12.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 8 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 6.2 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Use the thing's own name as the title and say what it does in the description, in a short sentence. A badge is one
word – "New", "Beta". For `fit="scale"`, set `preview-width` to the width the content was designed at.

## Do and don't

### Do

- Keep previews of the same kind at the same `fit` and ratio across a grid.
- Prefer a picture to a live preview when the grid is long; live previews cost as much as the real thing.

### Don't

- Don't put controls in a live preview and expect them to work: the preview is inert.
- Don't write a description longer than two lines; the rest is cut off.

## Related

- [Collection Card](collection-card.md) – A card that introduces a whole collection and links into it – up to three previews, the title with its counts, a bold line, a description, the names inside as many as fit in two lines, and Browse →; the whole card is one target and its words stay selectable
- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.

## Changelog

- **Preview Card** (`tc-preview-card`): a gallery tile – a picture or a live component scaled down from its design width, a one-line title and a two-line description, a badge, a horizontal form and a loading skeleton.
