<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Glass Folder

**Illustrations**

Glassy blue folder with documents behind a frosted pocket that tips open on hover

- **Element:** `<tc-glass-folder>`
- **Size:** 5.9 KB gzip · 16.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/glass-folder";` |
| React / Next.js | `import "@adamstavely/trenchcoat/glass-folder";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/glass-folder";` · tags starting with tc- are custom elements |
| Angular | `import { GlassFolder } from "@adamstavely/trenchcoat/angular/glass-folder";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/glass-folder";` |

## Example

The live example is in the gallery at `#/illustrations/glass-folder`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A glassy blue folder with three documents standing behind a frosted front pocket. Hover it and the pocket tips
forward while each document shifts on its own – a small reward that says “your files live here”. It fills empty
states for file and document views and gives upload areas something friendlier than an icon. `open` holds the
hover look on demand, for example while a file is dragged over a drop target.

### When to use

- An empty folder, project or document list, above the text that says what to add.
- Beside an upload area – set `open` while a file is dragged over it, so the folder answers the drag.
- Onboarding or landing sections about files, storage or documents.

### When not to use

- As the upload control itself – use [Dropzone](../components/dropzone.md), and put the folder next to it.
- In a dense list or toolbar where a small icon is enough – the artwork is meant to be seen at card size.
- Showing the files in a folder as a side panel or tab – use [Side Folder](side-folder.md).
- An empty schedule or calendar – use [Empty Calendar](empty-calendar.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Folder back** `.ui-fd-back` – the blue back panel with its tab and soft shadow
2. **Document** `.ui-fd-doc--middle` – one of the three sheets that shift when the folder opens
3. **Pocket** `.ui-fd-front` – the frosted front that tips forward on hover or with `open`

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the paper turns charcoal with light lines,
the folder a deeper blue, and the pocket lets less light through. It works with a `.dark` class, `data-theme`,
`data-tc-theme` or the system setting.

## Usage

### HTML

```html
<div id="upload" style="width: 320px">
  <tc-glass-folder id="folder"></tc-glass-folder>
  <p>No files yet – drop some here.</p>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/glass-folder";
  import "@adamstavely/trenchcoat/tokens.css";

  const folder = document.querySelector("#folder");
  const target = document.querySelector("#upload");
  target.addEventListener("dragenter", () => (folder.open = true));
  target.addEventListener("dragleave", () => (folder.open = false));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { GlassFolder } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function EmptyFiles() {
  const [dragging, setDragging] = useState(false);
  return (
    <div onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} style={{ width: 320 }}>
      <GlassFolder open={dragging} />
      <p>No files yet – drop some here.</p>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/glass-folder";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-glass-folder></tc-glass-folder>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { GlassFolder } from "@adamstavely/trenchcoat/angular/glass-folder";

@Component({
  selector: "app-glass-folder-example",
  imports: [GlassFolder],
  template: `<tc-glass-folder></tc-glass-folder>`,
})
export class GlassFolderExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/glass-folder";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGlassFolder } from "@adamstavely/trenchcoat/glass-folder";

  let el: TcGlassFolder;
</script>

<tc-glass-folder bind:this={el}></tc-glass-folder>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible description – when set, the folder is announced as an image; otherwise it is decorative |
| `open` | `open` | `boolean` | `false` | Show the open state (the hover look: pocket tipped forward, documents shifted) without a pointer over it |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-glass-folder-back` | `light-dark(#5bb7ea, #3d8fc6)` | both |
| `--tc-glass-folder-paper-top` | `light-dark(#ffffff, #34363c)` | both |
| `--tc-glass-folder-paper-bottom` | `light-dark(#eaf2f8, #26292f)` | both |
| `--tc-glass-folder-ink` | `light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.1))` | both |
| `--tc-glass-folder-line` | `light-dark(rgba(0, 0, 0, 0.12), rgba(255, 255, 255, 0.16))` | both |
| `--tc-glass-folder-shadow-1` | `light-dark(rgba(60, 130, 180, 0.28), rgba(0, 0, 0, 0.45))` | both |
| `--tc-glass-folder-shadow-2` | `light-dark(rgba(60, 130, 180, 0.16), rgba(0, 0, 0, 0.3))` | both |
| `--tc-glass-folder-shadow-3` | `light-dark(rgba(60, 130, 180, 0.1), transparent)` | both |
| `--tc-glass-folder-doc-shadow` | `light-dark(rgba(0, 30, 60, 0.18), rgba(0, 0, 0, 0.45))` | both |
| `--tc-glass-folder-pocket-shade` | `light-dark(rgba(0, 40, 75, 0.28), rgba(0, 20, 40, 0.4))` | both |
| `--tc-glass-folder-pocket-top` | `light-dark(rgba(132, 214, 248, 0.45), rgba(100, 190, 235, 0.42))` | both |
| `--tc-glass-folder-pocket-bottom` | `light-dark(rgba(69, 170, 220, 0.45), rgba(45, 130, 190, 0.5))` | both |
| `--tc-glass-folder-pocket-rim` | `light-dark(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.14))` | both |
| `--tc-glass-folder-pocket-lip` | `light-dark(rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.3))` | both |

#### Design tokens it reads (3)

`--tc-duration-slowest`, `--tc-ease-emphasized`, `--tc-font-sans`

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

*Also attributes: `label`, `open` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-glass-folder")` returns a `TcGlassFolder` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGlassFolder } from "@adamstavely/trenchcoat/glass-folder";`
- **React / Next.js:** The element class: `import type { TcGlassFolder } from "@adamstavely/trenchcoat/glass-folder";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGlassFolder["label"]` with `import type { TcGlassFolder } from "@adamstavely/trenchcoat/glass-folder";`
- **Angular:** The directive types the template: `[label]` takes `TcGlassFolder["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGlassFolder } from "@adamstavely/trenchcoat/glass-folder";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGlassFolder } from "@adamstavely/trenchcoat/glass-folder";`

## Accessibility

### Keyboard

Nothing to operate – the folder takes no focus. Hover is decoration only; set `open` from your own drag or focus
handling if the open look should follow something else.

### Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes
`role="img"` named by the label (“Project files”); `label=""` makes it decorative again. Leave it unlabelled when
the text beside it already says what it means.

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| backdrop-filter (with the -webkit- prefix) | 76 (Edge 17) | 103 | 9 | 9 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 10.1 KB | 3.8 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **16.7 KB** | **5.9 KB** |
| With Lit – the first component on a page | 36.3 KB | 12.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 30 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 9.1 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pair it with a short heading and one line of text that says what belongs here and how to add it.
- Give it a `label` only when the folder carries meaning the text doesn't – a name that repeats the heading is
  noise.

## Do and don't

### Do

- Let it scale: it fills its container's width at a 3 : 2 frame, so size the container, not the folder.
- Set `open` while a drag is over the nearby drop target, and clear it when the drag leaves.

### Don't

- Don't make it the only hint that something is droppable – keep a visible text instruction.
- Don't recolour it per page – override the `--tc-glass-folder-*` tokens once, in your theme.

## Related

- [Side Folder](side-folder.md) – Glassy blue folder on its side, documents sliding out to the right as the pocket swings open on hover
- [Dropzone](../components/dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Empty Calendar](empty-calendar.md) – Stack of calendar cards marked empty, fanning out on hover; the shimmer runs a few cycles and rests

## Changelog

- glass-folder has an `open` property: the look its hover gives, on demand.
