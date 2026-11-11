<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Element Inspector

**Workspace & sessions** · New

A page's elements as a tree written like the markup, beside the chosen element's box model and styles; hovering an element fires an event so the page can outline it in a preview.

- **Element:** `<tc-element-inspector>`
- **Size:** 8.0 KB gzip · 24.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/element-inspector";` |
| React / Next.js | `import { ElementInspector } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/element-inspector";` · tags starting with tc- are custom elements |
| Angular | `import { ElementInspector } from "@adamstavely/trenchcoat/angular/element-inspector";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/element-inspector";` |

## Example

The live example is in the gallery at `#/element-inspector`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A page's elements as a tree, written the way the markup reads – `<form id="apply" class="form wide">` – beside the
chosen element's box model and styles. The page passes the tree and, for the chosen element, its details; nothing here
reads a real page. Hovering or focusing an element fires `tc-highlight`, so the page can outline it in a
`preview-frame`. Wide, the tree and the details sit side by side; narrow, the details go under the tree.

### When to use

- Beside a preview of the page being built, to show which element is which and why it's the size it is.
- Explaining a layout bug: the box model shows the margin, border and padding at a glance.

### When not to use

- A project's files – use [File Tree](file-tree.md).
- Raw data such as an API response – use [JSON Viewer](json-viewer.md).
- Problems the build or a linter found – use [Problem List](problem-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tree** `.ui-elin__tree` – the elements, one row each; folded elements end in `…</tag>`
2. **Row** `.ui-elin__row` – an element: the fold chevron and its opening tag
3. **Tag** `.ui-elin__tag`, **attribute** `.ui-elin__attr` and **value** `.ui-elin__value` – coloured like code
4. **Text** `.ui-elin__text` – a short text inside the element
5. **Details** `.ui-elin__details` – the chosen element's tag, box model and styles
6. **Box model** `.ui-elin__box` – margin, border, padding and content, nested, with a number per side
7. **Styles** `.ui-elin__styles` – property, value and where it comes from

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The box model's layers use the amber, warning, teal and info tints. A page can set `--tc-elin-indent`, the step per
level of the tree.

## Usage

### HTML

```html
<tc-element-inspector id="dom" description="staging.halden.example/grants/218/apply"></tc-element-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/element-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#dom");
  el.nodes = [{ id: "form", tag: "form", attrs: { id: "apply", class: "form" }, children: [{ id: "submit", tag: "button", text: "Submit" }] }];
  el.expanded = ["form"];
  el.addEventListener("tc-selected-change", (e) => {
    el.details = { box: { width: 182, height: 36, padding: [8, 16, 8, 16] }, styles: [{ property: "display", value: "inline-flex" }] };
  });
  el.addEventListener("tc-highlight", (e) => console.log("outline", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ElementInspector, type InspectorDetails, type InspectorNode } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Inspector({ nodes, detailsFor }: { nodes: InspectorNode[]; detailsFor: (id: string) => InspectorDetails }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <ElementInspector nodes={nodes} selected={selected} onSelectedChange={setSelected} details={selected ? detailsFor(selected) : null} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/element-inspector";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";

defineProps<{ nodes: TcElementInspector["nodes"]; expanded: TcElementInspector["expanded"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-element-inspector :nodes="nodes" :expanded="expanded" @tc-selected-change="onSelectedChange"></tc-element-inspector>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ElementInspector } from "@adamstavely/trenchcoat/angular/element-inspector";
import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";

@Component({
  selector: "app-element-inspector-example",
  imports: [ElementInspector],
  template: `<tc-element-inspector [nodes]="nodes()" [expanded]="expanded()" (tc-selected-change)="onSelectedChange($event)"></tc-element-inspector>`,
})
export class ElementInspectorExample {
  readonly nodes = input.required<TcElementInspector["nodes"]>();
  readonly expanded = input.required<TcElementInspector["expanded"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/element-inspector";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";

  let { nodes, expanded }: { nodes: TcElementInspector["nodes"]; expanded: TcElementInspector["expanded"] } = $props();
  let el: TcElementInspector;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-element-inspector bind:this={el} {nodes} {expanded}></tc-element-inspector>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Elements"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the page's address |
| `nodes` | – | `InspectorNode[]` | `[]` | The top of the tree, usually one &lt;html> or &lt;body> node |
| `selected` | `selected` | `string \| null` | `null` | The chosen element's id, or null |
| `expanded` | – | `string[]` | `[]` | The ids of the open elements |
| `details` | – | `InspectorDetails \| null` | `null` | The chosen element's box model and styles, from the page |
| `maxHeight` | `max-height` | `number` | `420` | Height in px at which the tree and the details scroll |
| `labels` | – | `Partial<InspectorLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Another element was chosen ({ selected, node }: InspectorSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-expanded-change` | – | Yes | An element was opened or closed ({ expanded, id }: InspectorExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-highlight` | – | No | The pointer or focus moved onto an element, or left the tree ({ id, node }: InspectorHighlight) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-elin-indent` | `var(--tc-space-3-5)` | both |

#### Design tokens it reads (52)

`--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-elin-level`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-info-bg`, `--tc-status-warning-bg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-tag`, `--tc-syntax-text`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-teal-bg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-element-inspector :nodes="…">` | `<tc-element-inspector [nodes]="…">` | `<tc-element-inspector {nodes}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-element-inspector :expanded="…">` | `<tc-element-inspector [expanded]="…">` | `<tc-element-inspector {expanded}>` |
| `details` | `el.details = …;` | `<… details={…} />` | `<tc-element-inspector :details="…">` | `<tc-element-inspector [details]="…">` | `<tc-element-inspector {details}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-element-inspector :labels="…">` | `<tc-element-inspector [labels]="…">` | `<tc-element-inspector {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `max-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-highlight` | No | `el.addEventListener("tc-highlight", (e) => …)` | `onTcHighlight={…}` | `@tc-highlight="…"` | `(tc-highlight)="…($event)"` | `el.addEventListener("tc-highlight", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `expanded` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-element-inspector id="element-inspector"></tc-element-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/element-inspector";

  const el = document.querySelector("#element-inspector");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/element-inspector";
import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";

const props = defineProps<{ initial: TcElementInspector["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcElementInspector["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-element-inspector :selected="selected" @tc-selected-change="onSelectedChange"></tc-element-inspector>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ElementInspector } from "@adamstavely/trenchcoat/angular/element-inspector";
import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";

@Component({
  selector: "app-controlled-element-inspector",
  imports: [ElementInspector],
  template: `<tc-element-inspector [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-element-inspector>`,
})
export class ControlledElementInspector {
  readonly initial = input.required<TcElementInspector["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcElementInspector["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/element-inspector";
  import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";

  let { initial }: { initial: TcElementInspector["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcElementInspector;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcElementInspector["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-element-inspector bind:this={el} {selected}></tc-element-inspector>
```

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-element-inspector")` returns a `TcElementInspector` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";`
- **React / Next.js:** Props: `import type { ElementInspectorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ElementInspector>`. The element class, for refs: `import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcElementInspector["nodes"]` with `import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";`
- **Angular:** The directive types the template: `[nodes]` takes `TcElementInspector["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcElementInspector } from "@adamstavely/trenchcoat/element-inspector";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `selected` | `string \| null` | The chosen element's id – controlled when given |
| `defaultSelected` | `string \| null` | The chosen element at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, node: InspectorNode \| null) => void` | Another element was chosen |
| `expanded` | `string[]` | The open elements' ids – controlled when given |
| `defaultExpanded` | `string[]` | The elements open at first, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string[]) => void` | An element was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The tree is one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the element above or below |
| → | Opens a closed element, or moves to its first child |
| ← | Closes an open element, or moves to its parent |
| Home / End | Moves to the first or last element |
| Enter / Space | Chooses the element |

### Screen readers

The tree is a `tree` of `treeitem`s with their level, position, open state and `aria-selected`; it's named "Elements"
and described by a hidden note of the keys. The details are a region named "Details", with a heading per section. The
box-model drawing is hidden from screen readers; a sentence under it reads the content size and each layer's four sides.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.8 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.2 KB** | **8.0 KB** |
| With Lit – the first component on a page | 44.9 KB | 14.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 230 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of expanded replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.1 ms | expanded: first render, 230 nodes; update 0.7 ms |
| 1,000 items | 2.5 ms | expanded: first render, 230 nodes; update 0.3 ms |

What it renders doesn't grow with expanded (tested to 1,000 items).

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

- Give each node a stable `id` – the one `selected`, `expanded` and the events hold.
- Keep `text` to a few words: it's a hint, not the element's content.
- Pass `details` for the chosen element only, and swap them when `tc-selected-change` fires. Until they change, the new
  element's heading shows with "Loading details" rather than the last element's box and styles.

## Do and don't

### Do

- Outline the element from `tc-highlight` in the preview beside it, and clear the outline when `id` is null.
- Show the styles that matter for the question at hand, with their `source`.

### Don't

- Don't pass a whole document at once: open the branches people need, and pass more as they open.
- Don't put real visitors' form entries in `text` or attribute values.

## Related

- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [File Tree](file-tree.md) – A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
- [Problem List](problem-list.md) – diagnostics from a build, type check or linter, grouped by file, with a severity filter with counts, a text filter, severity marks that aren't colour alone, and quick fixes.
