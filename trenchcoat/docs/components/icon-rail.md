<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Icon Rail

**Workspace & sessions** · New

A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.

- **Element:** `<tc-icon-rail>`
- **Size:** 6.0 KB gzip · 17.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/icon-rail";` |
| React / Next.js | `import { IconRail } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/icon-rail";` · tags starting with tc- are custom elements |
| Angular | `import { IconRail } from "@adamstavely/trenchcoat/angular/icon-rail";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/icon-rail";` |

## Example

The live example is in the gallery at `#/icon-rail`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A row of icon buttons at the top of a panel. One can be chosen, each has a tooltip, and a More menu can hold the rest.

### When to use

- Switching what a side panel shows.
- A few actions that are familiar enough to work as icons.

### When not to use

- Views that need their names always in sight – use tabs with words.
- Search across many commands – use [Command Menu](command-menu.md).
- An account's actions – use [Profile Menu](profile-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Rail** `.ui-irl__rail` – the toolbar
2. **Slot** `.ui-irl__slot` – a button and its tooltip
3. **Button** `.ui-irl__button` – the icon button
4. **Tooltip** `.ui-irl__tip` – the label, on hover and focus
5. **Menu** `.ui-irl__menu` – the More menu's list of `.ui-irl__item`

## Looks

Standard is a white card on the gray tray; Clean is one white card. `bare` drops both. When narrow the row wraps, and the
buttons keep their size. A page can set `--tc-irl-size`, a button's size, and `--tc-irl-glyph`, its icon's.

## Usage

### HTML

```html
<tc-icon-rail id="rail" label="Panel views" selected="details"></tc-icon-rail>

<script type="module">
  import "@adamstavely/trenchcoat/icon-rail";
  import "@adamstavely/trenchcoat/tokens.css";

  const rail = document.querySelector("#rail");
  rail.items = [
    { id: "details", label: "Details", icon: "M8 6h13M8 12h13M8 18h13" },
    { id: "add", label: "Add sample", icon: ["M12 5v14", "M5 12h14"] },
  ];
  rail.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { IconRail } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Views() {
  const [selected, setSelected] = useState<string | null>("details");
  return (
    <IconRail
      label="Panel views"
      selected={selected}
      onSelectedChange={(next) => setSelected(next)}
      items={[{ id: "details", label: "Details", icon: "M8 6h13M8 12h13M8 18h13" }]}
      moreItems={[{ id: "export", label: "Export list" }]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/icon-rail";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";

defineProps<{ items: TcIconRail["items"]; moreItems: TcIconRail["moreItems"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-icon-rail :items="items" :moreItems="moreItems" @tc-selected-change="onSelectedChange"></tc-icon-rail>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IconRail } from "@adamstavely/trenchcoat/angular/icon-rail";
import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";

@Component({
  selector: "app-icon-rail-example",
  imports: [IconRail],
  template: `<tc-icon-rail [items]="items()" [moreItems]="moreItems()" (tc-selected-change)="onSelectedChange($event)"></tc-icon-rail>`,
})
export class IconRailExample {
  readonly items = input.required<TcIconRail["items"]>();
  readonly moreItems = input.required<TcIconRail["moreItems"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/icon-rail";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";

  let { items, moreItems }: { items: TcIconRail["items"]; moreItems: TcIconRail["moreItems"] } = $props();
  let el: TcIconRail;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-icon-rail bind:this={el} {items} {moreItems}></tc-icon-rail>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Names the toolbar |
| `items` | – | `IconRailItem[]` | `[]` | The buttons; give each its own id – of two with the same id, only the first can be chosen or take the tab stop |
| `selected` | `selected` | `string \| null` | `null` | The chosen button's id, or null for none |
| `moreItems` | – | `IconRailMoreItem[]` | `[]` | The items of a final More menu; without them there's no More button |
| `moreLabel` | `more-label` | `string` | `"More"` | Names the More button |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and shadow, for a rail that sits in something else's surface |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A button was chosen or let go ({ selected, item }: IconRailSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-action` | – | No | A More menu item was chosen ({ id }: IconRailAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-irl-size` | `var(--tc-control-h-sm)` | both |
| `--tc-irl-glyph` | `var(--tc-space-4)` | both |
| `--tc-irl-menu` | `var(--tc-space-16)` | both |

#### Design tokens it reads (33)

`--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-line-height-normal`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-4`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-icon-rail :items="…">` | `<tc-icon-rail [items]="…">` | `<tc-icon-rail {items}>` |
| `moreItems` | `el.moreItems = …;` | `<… moreItems={…} />` | `<tc-icon-rail :moreItems="…">` | `<tc-icon-rail [moreItems]="…">` | `<tc-icon-rail {moreItems}>` |

*Also attributes: `label`, `selected`, `more-label`, `bare` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-icon-rail id="icon-rail"></tc-icon-rail>

<script type="module">
  import "@adamstavely/trenchcoat/icon-rail";

  const el = document.querySelector("#icon-rail");
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
import "@adamstavely/trenchcoat/icon-rail";
import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";

const props = defineProps<{ initial: TcIconRail["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcIconRail["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-icon-rail :selected="selected" @tc-selected-change="onSelectedChange"></tc-icon-rail>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { IconRail } from "@adamstavely/trenchcoat/angular/icon-rail";
import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";

@Component({
  selector: "app-controlled-icon-rail",
  imports: [IconRail],
  template: `<tc-icon-rail [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-icon-rail>`,
})
export class ControlledIconRail {
  readonly initial = input.required<TcIconRail["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcIconRail["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/icon-rail";
  import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";

  let { initial }: { initial: TcIconRail["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcIconRail;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcIconRail["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-icon-rail bind:this={el} {selected}></tc-icon-rail>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-icon-rail")` returns a `TcIconRail` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";`
- **React / Next.js:** Props: `import type { IconRailProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IconRail>`. The element class, for refs: `import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIconRail["items"]` with `import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";`
- **Angular:** The directive types the template: `[items]` takes `TcIconRail["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIconRail } from "@adamstavely/trenchcoat/icon-rail";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `selected` | `string \| null` | The chosen button's id – controlled when given |
| `defaultSelected` | `string \| null` | The chosen button at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, item?: IconRailItem) => void` | A button was chosen or let go |

*Renamed or hidden on the wrapper: `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

One tab stop for the whole rail.

| Key | What it does |
|---|---|
| Left / Right | Moves along the rail |
| Home / End | Moves to the first or last button |
| Enter / Space | Chooses the button, or lets it go; opens More |
| Up / Down on More | Opens the menu at its last or first item |
| Up / Down in the menu | Moves through its items |
| Escape | Shuts the menu, back on More |

### Screen readers

It's a `toolbar` named by `label`. Each button is named by its own label and says whether it's pressed. More says it opens
a `menu` and whether it's open. The tooltip repeats the name, so it's hidden from them.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 10.9 KB | 4.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **17.5 KB** | **6.0 KB** |
| With Lit – the first component on a page | 37.1 KB | 12.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 43 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of items replaced |
| First on the page | 1.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.4 ms | items: first render, 708 nodes; update 0.4 ms |
| 1,000 items | 20 ms | items: first render, 7,008 nodes; update 3.4 ms |

1,000 items of items: 20 ms, 7,008 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Give every item a short label, as the icon alone may not be clear. `icon` is SVG path data for a 24×24 stroked icon, or an
array of paths. Use `moreItems` for what's used least.

## Do and don't

### Do

- Keep to the few views people really switch between.
- Prevent `tc-selected-change` when a view can't open yet, and say why.

### Don't

- Don't use unfamiliar icons with no other cue: a tooltip doesn't help on touch.
- Don't put a destructive action in the rail without a confirmation.

## Related

- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Profile Menu](profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress
- [Meter Row](meter-row.md) – How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.
