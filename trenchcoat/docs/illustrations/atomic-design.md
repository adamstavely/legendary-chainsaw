<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Atomic Design

**Illustrations** · New

Atomic design one stage at a time – the five stages from abstract to concrete, then atoms, a search-form molecule, a header organism, a wireframe template and the finished page (`stage`)

- **Element:** `<tc-atomic-design>`
- **Size:** 8.2 KB gzip · 24.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/atomic-design";` |
| React / Next.js | `import "@adamstavely/trenchcoat/atomic-design";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/atomic-design";` · tags starting with tc- are custom elements |
| Angular | `import { AtomicDesign } from "@adamstavely/trenchcoat/angular/atomic-design";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/atomic-design";` |

## Example

The live example is in the gallery at `#/illustrations/atomic-design`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Atomic design, one stage at a time. `stage` picks the drawing:
- `overview` – the five stages in a row, atoms to pages, under a line from abstract to concrete.
- `atoms` – a label, an input and a button, each tagged.
- `molecule` – those three joined into a search form, with tags leading to each part.
- `organism` – a site header holding a logo, links and the search form.
- `template` – the page's layout in placeholders.
- `page` – the same layout with its content: pictures, a headline and a video.

The same parts carry from stage to stage, so a talk, a design-system guide or onboarding can step through them.

### When to use

- A design-system site's introduction to how its components build up.
- A guide or talk that walks from small parts to whole pages.

### When not to use

- Showing a real component: put the component itself on the page.
- An empty or error state – use a state illustration such as [First Use](first-use.md) or [Something Wrong](something-wrong.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tiles** `.ui-atd-tile` – the soft tiles and cards each stage is drawn on
2. **Mark** `.ui-atd-mark` – the amber pastel parts: nuclei, the button, the logo
3. **Tags** `.ui-atd-tag` – the names of the parts, with dashed leads `.ui-atd-dash` to them
4. **Placeholders** `.ui-atd-dash` – the template's dashed frames, where content will go
6. **Words** `.ui-atd-caption` – optional words under the drawing, from `caption`

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting. It has no background of its own. Its frame is 4 : 3, like `accessibility-principles`, so the words
fit; each stage's parts rise in one after another when it appears.

## Usage

### HTML

```html
<tc-atomic-design stage="molecule"></tc-atomic-design>

<script type="module">
  import "@adamstavely/trenchcoat/atomic-design";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { AtomicDesign } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Stage() {
  return <AtomicDesign stage="molecule" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/atomic-design";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";

defineProps<{ labels: TcAtomicDesign["labels"] }>();
</script>

<template>
  <tc-atomic-design :labels="labels"></tc-atomic-design>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AtomicDesign } from "@adamstavely/trenchcoat/angular/atomic-design";
import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";

@Component({
  selector: "app-atomic-design-example",
  imports: [AtomicDesign],
  template: `<tc-atomic-design [labels]="labels()"></tc-atomic-design>`,
})
export class AtomicDesignExample {
  readonly labels = input.required<TcAtomicDesign["labels"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/atomic-design";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";

  let { labels }: { labels: TcAtomicDesign["labels"] } = $props();
  let el: TcAtomicDesign;
</script>

<tc-atomic-design bind:this={el} {labels}></tc-atomic-design>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `stage` | `stage` | `AtomicDesignStage` | `"overview"` | Which stage to draw: "overview" (the five stages in a row), "atoms", "molecule", "organism", "template" or "page" |
| `scale` | `scale` | `boolean` | `true` | On the overview, the line from abstract to concrete above the stages |
| `labels` | – | `AtomicDesignLabels` | `{ atoms: "Atoms", molecules: "Molecules", organisms: "Organisms", templates: "Templates", pages: "Pages", abstract: "Abstract", concrete: "Concrete", label: "Label", input: "Input", button: "Button", logo: "Logo", navigation: "Navigation", search: "Search", searchLabel: "Search the archive", placeholder: "Enter a keyword", searchButton: "Search", nav: ["Home", "About", "Research", "Contact"], headline: "Field notes", }` | The words drawn in: stage names, tags and the content drawn into the parts |
| `caption` | `caption` | `string` | `""` | Words under the drawing; "" (the default) leaves them out |
| `label` | `label` | `string` | `""` | Accessible description; by default a sentence for the stage |
| `decorative` | `decorative` | `boolean` | `false` | Leave the drawing out of the accessibility tree, for when the text beside it says the same |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `describe()` | `string` | The sentence the host is named by when `label` is empty |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-atomic-design-tile` | `light-dark(#ffffff, #2a2a2e)` | both |
| `--tc-atomic-design-edge` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.1))` | both |
| `--tc-atomic-design-line` | `light-dark(#e6e9ee, #44464d)` | both |
| `--tc-atomic-design-faint` | `light-dark(#c9ced6, #5f636c)` | both |
| `--tc-atomic-design-mark` | `light-dark(#fbe7cf, #5a4426)` | both |
| `--tc-atomic-design-mark-edge` | `light-dark(#e9b872, #c79a57)` | both |
| `--tc-atomic-design-ink` | `light-dark(#8a5a17, #f3d6a6)` | both |
| `--tc-atomic-design-sky` | `light-dark(#dce8fb, #263a5c)` | both |
| `--tc-atomic-design-hill` | `light-dark(#a6dcdc, #3f7f80)` | both |
| `--tc-atomic-design-hill-far` | `light-dark(#d9f2f2, #1d3c3d)` | both |
| `--tc-atomic-design-glow` | `light-dark(rgba(250, 176, 130, 0.22), rgba(250, 176, 130, 0.1))` | both |
| `--tc-atomic-design-soft` | `12px` | both |
| `--tc-atomic-design-beat` | `3s` | both |

#### Design tokens it reads (12)

`--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-line-height-tight`, `--tc-space-8`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-atomic-design :labels="…">` | `<tc-atomic-design [labels]="…">` | `<tc-atomic-design {labels}>` |

*Also attributes: `stage`, `scale`, `caption`, `label`, `decorative` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-atomic-design")` returns a `TcAtomicDesign` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";`
- **React / Next.js:** The element class: `import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAtomicDesign["labels"]` with `import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";`
- **Angular:** The directive types the template: `[labels]` takes `TcAtomicDesign["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAtomicDesign } from "@adamstavely/trenchcoat/atomic-design";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus. A page that steps through the stages provides its own control,
such as a segmented control.

### Screen readers

The host is `role="img"`, named by a sentence for the stage – "Atoms: a label, an input and a button." – built from
`labels`. `label` replaces the sentence. Set `decorative` when the text beside it already says the same.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-05 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 17.2 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **24.3 KB** | **8.3 KB** |
| With Lit – the first component on a page | 43.9 KB | 14.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 83 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |

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

`labels` holds every word drawn in – the stage names, the tags, and the content in the parts (the search label, the
placeholder, the button, four links and the headline) – so a page can translate them. Keep them short: the links share
the room between the logo and the search form. `defaultAtomicDesignLabels` has the English ones.

## Do and don't

### Do

- Step through the stages in order, so each builds on the last.
- Pair each stage with a sentence on what it adds.

### Don't

- Don't use it below about 320px wide, where the small words get hard to read.
- Don't use it as a component inventory: it's a picture of the idea.

## Related

- [Accessibility Principles](accessibility-principles.md) – Visual, hearing, motor and cognitive needs on pastel tiles, with arrows up from the four principles that serve them – perceivable, operable, understandable and robust – for an accessibility statement or design guide
- [First Use](first-use.md) – An empty workspace with one highlighted spot to start from, with the words Nothing here yet, for a new team or project

## Changelog

- **Atomic Design** (`tc-atomic-design`, `AtomicDesign`): atomic design one stage at a time, picked by `stage` – the five stages from abstract to concrete, then atoms (label, input, button), a molecule (a search form), an organism (a site header), a template (the layout in placeholders) and a page (the layout with its content). The same parts carry from stage to stage; the words come from `labels`, and its name is a sentence for the stage.
