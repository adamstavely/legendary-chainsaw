<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Breadcrumbs

**Inputs & controls** · New

Where you are in a hierarchy as a trail of links: the current page last, the middle folding into "…" when it doesn't fit or passes `max`, a cancelable `tc-navigate` for routing, and Copy path

- **Element:** `<tc-breadcrumbs>`
- **Size:** 7.5 KB gzip · 21.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/breadcrumbs";` |
| React / Next.js | `import { Breadcrumbs } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/breadcrumbs";` · tags starting with tc- are custom elements |
| Angular | `import { Breadcrumbs } from "@adamstavely/trenchcoat/angular/breadcrumbs";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/breadcrumbs";` |

## Example

The live example is in the gallery at `#/breadcrumbs`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A trail of links from the top of a hierarchy down to the page you're on: Library › Special collections › Maritime
archive › Survey of the north quay. Each step is a link back up; the last is the current page and isn't a link. When
the trail is wider than its space – or longer than `max` – the middle folds into “…”, a button that lists the folded
steps. Every click fires a cancelable `tc-navigate`, so a single-page app can route it itself, and `copy-path` adds a
button that copies the trail as text.

### When to use

- Pages deep in a hierarchy – archives, folders, documentation, product categories – where people move up a level
  or two.
- Search results or detail views that need to say where something lives.

### When not to use

- The app's main sections – use [Header Nav](../blocks/header-nav.md).
- Choosing a place in a hierarchy – use [Tree Select](tree-select.md).
- A list of documents in a folder – use [Document List](document-list.md).
- Jumping anywhere by name – use [Command Menu](command-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Nav** `.ui-crumb__nav` – the navigation landmark, named “Breadcrumb”
2. **Item** `.ui-crumb__item` – one step, with its separator
3. **Link** `.ui-crumb__link` – a link, or a button when the step has no `href`
4. **Current page** `.ui-crumb__current` – the last step, `aria-current="page"`
5. **Separator** `.ui-crumb__sep` – a chevron or a slash
6. **More** `.ui-crumb__more` – “…”, opening the folded steps
7. **Menu** `.ui-crumb__menu` – the folded steps as a list of links
8. **Copy path** `.ui-crumb__copy` – copies the trail as text

## Looks

Standard is secondary text with chevrons and a little room between steps. Clean is a size smaller, muted and
tighter, with the current page in medium weight. Neither is a card. `--tc-crumb-label-max` on `tc-breadcrumbs` sets
how long a label grows before it's cut (it shows in full on hover).

## Usage

### HTML

```html
<tc-breadcrumbs copy-path></tc-breadcrumbs>

<script type="module">
  import "@adamstavely/trenchcoat/breadcrumbs";
  import "@adamstavely/trenchcoat/tokens.css";

  const trail = document.querySelector("tc-breadcrumbs");
  trail.items = [
    { label: "Library", href: "/", icon: "home" },
    { label: "Maritime archive", href: "/maritime" },
    { label: "Survey of the north quay" },
  ];
  trail.addEventListener("tc-navigate", (e) => console.log(e.detail.index));
</script>
```

### React / Next.js

```tsx
import { Breadcrumbs, type BreadcrumbItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const trail: BreadcrumbItem[] = [
  { label: "Library", href: "/", icon: "home" },
  { label: "Maritime archive", href: "/maritime" },
  { label: "Survey of the north quay" },
];

export function Trail({ go }: { go: (href: string) => void }) {
  return (
    <Breadcrumbs
      items={trail}
      onNavigate={(item, _index, event) => {
        if (!item.href) return;
        event.preventDefault();
        go(item.href);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/breadcrumbs";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";

defineProps<{ items: TcBreadcrumbs["items"] }>();
const onNavigate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-breadcrumbs :items="items" @tc-navigate="onNavigate"></tc-breadcrumbs>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Breadcrumbs } from "@adamstavely/trenchcoat/angular/breadcrumbs";
import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";

@Component({
  selector: "app-breadcrumbs-example",
  imports: [Breadcrumbs],
  template: `<tc-breadcrumbs [items]="items()" (tc-navigate)="onNavigate($event)"></tc-breadcrumbs>`,
})
export class BreadcrumbsExample {
  readonly items = input.required<TcBreadcrumbs["items"]>();
  onNavigate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/breadcrumbs";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";

  let { items }: { items: TcBreadcrumbs["items"] } = $props();
  let el: TcBreadcrumbs;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-breadcrumbs bind:this={el} {items}></tc-breadcrumbs>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `BreadcrumbItem[]` | `[]` | The trail, from the top down; the last item is the current page |
| `separator` | `separator` | `"chevron" \| "slash"` | `"chevron"` | Between items: a chevron or a slash |
| `max` | `max` | `number \| undefined` | `undefined` | Show at most this many items (the first, "…" and the last ones), even when more would fit |
| `copyPath` | `copy-path` | `boolean` | `false` | Adds a button that copies the trail as text |
| `pathSeparator` | `path-separator` | `string` | `" / "` | What the copied trail is joined with |
| `label` | `label` | `string` | `"Breadcrumb"` | The navigation landmark's name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-navigate` | – | Yes | An item was clicked ({ item, index }: BreadcrumbNavigate); cancelable – prevented, a link isn't followed |
| `tc-copy` | – | Yes | Copy path was pressed ({ text }: BreadcrumbCopy); cancelable – prevented, nothing is copied |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-crumb-label-max` | `220px` | both |
| `--tc-crumb-gap` | `var(--tc-space-0-5)` | standard, clean |

#### Design tokens it reads (32)

`--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `breadcrumbLayout(count: number, tail: number, max?: number): void` | Which items show: the first, then "…" for `hidden`, then the rest. `tail` is how many of the last fit |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-breadcrumbs :items="…">` | `<tc-breadcrumbs [items]="…">` | `<tc-breadcrumbs {items}>` |

*Also attributes: `separator`, `max`, `copy-path`, `path-separator`, `label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-navigate` | Yes | `el.addEventListener("tc-navigate", (e) => …)` | `onNavigate={…}` | `@tc-navigate="…"` | `(tc-navigate)="…($event)"` | `el.addEventListener("tc-navigate", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyPath={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

### Controlled

`tc-navigate`, `tc-copy` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-breadcrumbs")` returns a `TcBreadcrumbs` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";`
- **React / Next.js:** Props: `import type { BreadcrumbsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Breadcrumbs>`. The element class, for refs: `import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBreadcrumbs["items"]` with `import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";`
- **Angular:** The directive types the template: `[items]` takes `TcBreadcrumbs["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBreadcrumbs } from "@adamstavely/trenchcoat/breadcrumbs";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onNavigate` | `(item: BreadcrumbItem, index: number, event: CustomEvent<BreadcrumbNavigate>) => void` | An item was clicked; call `event.preventDefault()` to route a link yourself instead of following it |
| `onCopyPath` | `(text: string, event: CustomEvent<BreadcrumbCopy>) => void` | Copy path was pressed; call `event.preventDefault()` to copy it your own way |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the links, “…” and Copy path |
| Enter | Follows a link, or opens the folded steps from “…” |
| ↓ (on “…”) | Opens the folded steps and focuses the first |
| ↓ / ↑ (in the menu) | Next or previous folded step |
| Home / End (in the menu) | First or last folded step |
| Escape (in the menu) | Closes it and returns to “…” |

### Screen readers

A `nav` landmark named by `label` (“Breadcrumb”) holds an ordered list, so the number of steps is read. The current
page is `aria-current="page"`. Separators are hidden. “…” is named “Show 3 more” and says whether its list is open
(`aria-expanded`, `aria-controls`). Copying announces “Path copied”.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.8 KB | 5.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **21.9 KB** | **7.6 KB** |
| With Lit – the first component on a page | 41.5 KB | 13.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 95 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 3.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.1 ms | items: first render, 753 nodes; update 0.4 ms |
| 1,000 items | 52 ms | items: first render, 7,053 nodes; update 2.5 ms |

1,000 items of items: 52 ms. It renders every item, so a first render passes 50 ms (a long task) at about 970 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use each page's own title as its label, shortened if it must be – the full text shows on hover.
- Start at the top people recognise (“Library”), not a technical root.
- Leave `href` off steps the app routes itself, and handle `tc-navigate`.

## Do and don't

### Do

- Keep the first step and the current page visible – folding does this for you.
- Use `max` where space is fixed and the trail varies, so it doesn't jump.

### Don't

- Don't make the current page a link to itself.
- Don't use breadcrumbs for the steps of a process – use a stepper.

## Related

- [Header Nav](../blocks/header-nav.md) – The right end of an app header – notifications bell, app picker and the person's avatar, which opens their account card; one popover at a time, the three as one set of round buttons, and it fits a 320 px header (uses `@adamstavely/trenchcoat/react`: `notifications`, `app-picker`, `profile-menu`)
- [Tree Select](tree-select.md) – Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons

## Changelog

- **Breadcrumbs** (`tc-breadcrumbs`) – a trail whose middle folds into "…" when it doesn't fit, with a cancelable `tc-navigate` and Copy path.
