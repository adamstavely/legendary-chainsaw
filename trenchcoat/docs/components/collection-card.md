<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Collection Card

**Workspace & sessions** · New

A card that introduces a whole collection and links into it – up to three previews, the title with its counts, a bold line, a description, the names inside as many as fit in two lines, and Browse →; the whole card is one target and its words stay selectable

- **Element:** `<tc-collection-card>`
- **Size:** 6.4 KB gzip · 18.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/collection-card";` |
| React / Next.js | `import { CollectionCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/collection-card";` · tags starting with tc- are custom elements |
| Angular | `import { CollectionCard } from "@adamstavely/trenchcoat/angular/collection-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/collection-card";` |

## Example

The live example is in the gallery at `#/collection-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A card that introduces a whole collection – a section of a library, a catalog or a design system – and links into it.
Up to three previews sit across the top; then come the title with its counts ("273 items · 273 files"), a bold line,
a short description, the names of what's inside and a link. The names show as many as fit in two lines, then "…".
The whole card opens the collection, but a click that ends a text selection doesn't, so its words can be copied.

### When to use

- The front page of a library, catalog or docs site, one card per section.
- A hub that sends people to collections of different sizes, where counts and examples help them choose.

### When not to use

- One item, such as a single component or page: use [Preview Card](preview-card.md).
- A section of a side panel that folds open: use [Panel Card](panel-card.md).
- A piece of work with progress and people: use [Project Card](project-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Card** `.ui-clc__card` – the white card; the whole of it opens the collection
2. **Previews** `.ui-clc__previews` – up to three frames `.ui-clc__thumb`: a picture `.ui-clc__img`, a live element, or a placeholder
3. **Title** `.ui-clc__title` – the collection's name, a heading, with its counts `.ui-clc__meta` at the right
4. **Subtitle** `.ui-clc__subtitle` – the bold line
5. **Description** `.ui-clc__description` – what the collection is for
6. **Items** `.ui-clc__items` – the names inside `.ui-clc__item`, with "…" `.ui-clc__more` for the ones that don't fit
7. **Link** `.ui-clc__action` – "Browse …" with an arrow `.ui-clc__arrow`

## Looks

Standard sets the card on a gray tray; Clean is one white card. Both lift a little on hover and show the focus ring
round the whole card. A page can set `--tc-clc-pad`, the card's padding, and `--tc-clc-thumb-ratio`, the previews'
shape (16 / 10 by default). At 360px wide and under, the title shrinks and the counts wrap under it.

## Usage

### HTML

```html
<tc-collection-card id="card" heading="Components" count="273" files="273" href="/components"
  subtitle="Interactive building blocks for research tools"
  description="Self-contained pieces – agent views, charts, inputs and feedback."></tc-collection-card>

<script type="module">
  import "@adamstavely/trenchcoat/collection-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#card");
  card.items = ["Agent Cursors", "Agent Findings", "Agent Graph", "Approval Card"];
  card.previews = [{ src: "/shots/checklist.png", alt: "A checklist with five steps" }];
</script>
```

### React / Next.js

```tsx
import { CollectionCard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Library() {
  return (
    <CollectionCard
      title="Components"
      count={273}
      files={273}
      href="/components"
      subtitle="Interactive building blocks for research tools"
      description="Self-contained pieces – agent views, charts, inputs and feedback."
      items={["Agent Cursors", "Agent Findings", "Agent Graph", "Approval Card"]}
      previews={[{ src: "/shots/checklist.png", alt: "A checklist with five steps" }]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/collection-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";

defineProps<{ previews: TcCollectionCard["previews"]; items: TcCollectionCard["items"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-collection-card :previews="previews" :items="items" @tc-open="onOpen"></tc-collection-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CollectionCard } from "@adamstavely/trenchcoat/angular/collection-card";
import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";

@Component({
  selector: "app-collection-card-example",
  imports: [CollectionCard],
  template: `<tc-collection-card [previews]="previews()" [items]="items()" (tc-open)="onOpen($event)"></tc-collection-card>`,
})
export class CollectionCardExample {
  readonly previews = input.required<TcCollectionCard["previews"]>();
  readonly items = input.required<TcCollectionCard["items"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/collection-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";

  let { previews, items }: { previews: TcCollectionCard["previews"]; items: TcCollectionCard["items"] } = $props();
  let el: TcCollectionCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-collection-card bind:this={el} {previews} {items}></tc-collection-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The collection's name |
| `headingLevel` | `heading-level` | `number` | `3` | The heading's level, 2–6 |
| `subtitle` | `subtitle` | `string` | `""` | The bold line under the title |
| `description` | `description` | `string` | `""` | A short paragraph on what the collection is for |
| `previews` | – | `CollectionPreview[]` | `[]` | Up to three previews across the top |
| `items` | – | `string[]` | `[]` | The names of what's inside; as many as fit in two lines show |
| `meta` | `meta` | `string` | `""` | The counts at the right of the title, as written; overrides `count` and `files` |
| `count` | `count` | `number \| undefined` | `undefined` | How many items the collection holds |
| `files` | `files` | `number \| undefined` | `undefined` | How many files they come to |
| `href` | `href` | `string` | `""` | Where the link goes; without it the link is a button that fires tc-open |
| `actionLabel` | `action-label` | `string` | `""` | The link's words; by default "Browse" and the heading |
| `labels` | – | `Partial<CollectionCardLabels>` | `{}` | Words the page can change: counts, "and N more", the link |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | The card or its link was pressed (detail: { href }); cancelable – prevented, a link isn't followed |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-clc-pad` | `var(--tc-space-4)` | both |
| `--tc-clc-gap` | `var(--tc-space-2)` | both |
| `--tc-clc-thumb-ratio` | `16 / 10` | both |
| `--tc-clc-lift` | `calc(var(--tc-space-0-5) * -1)` | both |

#### Design tokens it reads (39)

`--tc-accent-text`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-h-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `previews` | `el.previews = …;` | `<… previews={…} />` | `<tc-collection-card :previews="…">` | `<tc-collection-card [previews]="…">` | `<tc-collection-card {previews}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-collection-card :items="…">` | `<tc-collection-card [items]="…">` | `<tc-collection-card {items}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-collection-card :labels="…">` | `<tc-collection-card [labels]="…">` | `<tc-collection-card {labels}>` |

*Also attributes: `heading`, `heading-level`, `subtitle`, `description`, `meta`, `count`, `files`, `href` and 2 more – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-collection-card")` returns a `TcCollectionCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";`
- **React / Next.js:** Props: `import type { CollectionCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CollectionCard>`. The element class, for refs: `import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCollectionCard["previews"]` with `import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";`
- **Angular:** The directive types the template: `[previews]` takes `TcCollectionCard["previews"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCollectionCard } from "@adamstavely/trenchcoat/collection-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The collection's name |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the link, the card's one stop |
| Enter | Opens the collection (Space too when there's no `href`) |

### Screen readers

The title is a heading (`heading-level`, 3 by default). The link is named by its words – "Browse Components" – and
described by the title. The names inside are read in full up to the "…", then "and N more" (`labels.more`). Pictures
use their `alt`; give `alt=""` when the words say the same. Live previews are inert and hidden.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This component alone** | 11.5 KB | 4.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **18.1 KB** | **6.4 KB** |
| With Lit – the first component on a page | 37.7 KB | 12.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 51 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.2 ms | items: first render, 215 nodes; update 0.4 ms |
| 1,000 items | 6.4 ms | items: first render, 2,015 nodes; update 2.3 ms |

1,000 items of items: 6.4 ms, 2,015 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Name the collection with a plural noun ("Components", "Templates"). Keep the bold line to a promise of what's inside
and the description to two or three sentences. List the items people look for first, in the order the collection
shows them. Counts come from `count` and `files`, or write `meta` yourself.

## Do and don't

### Do

- Use the same counts the collection's own page shows.
- Pick previews that show different kinds of thing in the collection.

### Don't

- Don't put buttons of your own on the card: the whole card is one link.
- Don't use more than three previews; the strip takes the first three.

## Related

- [Preview Card](preview-card.md) – A gallery tile – a large preview above a one-line title and a two-line description; a picture or a live component scaled down from its design width, a badge, a horizontal list form and a loading skeleton, the whole card one link
- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.
- [Project Card](project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover

## Changelog

- **Collection Card** (`tc-collection-card`): a card that introduces a collection and links into it – up to three previews, the title with its counts, a bold line, a description, the item names that fit in two lines, and Browse →.
