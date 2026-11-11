<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Menu Morph

**Motion** · New

A button that grows into its menu – the surface stretches out of the button's box, the items rise in turn, and it shrinks back into the button on closing, with the menu button pattern's keys

- **Element:** `<tc-menu-morph>`
- **Size:** 7.0 KB gzip · 19.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/menu-morph";` |
| React / Next.js | `import { MenuMorph } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/menu-morph";` · tags starting with tc- are custom elements |
| Angular | `import { MenuMorph } from "@adamstavely/trenchcoat/angular/menu-morph";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/menu-morph";` |

## Example

The live example is in the gallery at `#/motion/menu-morph`, at 320 px, 480 px or full width.

## Overview

A button that grows into its menu. The menu's surface starts as the button's own box and stretches into the panel,
the items rise one after another, and when the menu closes it shrinks back into the button – so it's clear where the
menu came from and where it went. The button and the menu are yours: mark the button `data-menu-trigger` and the
panel `data-menu`, and the element adds the menu button pattern's roles and keys. The panel opens below the button,
above it when there's no room, and floats in the top layer where the browser has the Popover API. For people who ask
for reduced motion, the menu opens and closes without the morph.

### When to use

- An actions menu on a row, a card or a finding – a handful of commands behind one button.
- A small "more" menu in a toolbar where a plain popover would appear from nowhere.

### When not to use

- Searching or picking from many items – use [Command Menu](../components/command-menu.md).
- Choosing filters that stay applied – use [Filter Menu](../components/filter-menu.md).
- Content that opens in place below a heading – use [Collapse](collapse.md).
- A card that grows into its full detail view – use [Shared Element](shared-element.md).

## Usage

### HTML

```html
<tc-menu-morph>
  <button type="button" data-menu-trigger>Actions</button>
  <div data-menu aria-label="Finding F-214 actions">
    <button type="button" role="menuitem">Assign reviewer</button>
    <button type="button" role="menuitem">Request evidence</button>
    <button type="button" role="menuitem">Export finding</button>
  </div>
</tc-menu-morph>

<script type="module">
  import "@adamstavely/trenchcoat/menu-morph";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("tc-menu-morph").addEventListener("tc-open-change", (e) => console.log("open:", e.detail.open));
</script>
```

### React / Next.js

```tsx
import { MenuMorph } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FindingActions({ onAction }: { onAction: (action: string) => void }) {
  return (
    <MenuMorph onOpenChange={(open) => console.log("open:", open)}>
      <button type="button" data-menu-trigger>Actions</button>
      <div data-menu aria-label="Finding F-214 actions">
        {["Assign reviewer", "Request evidence", "Export finding"].map((a) => (
          <button key={a} type="button" role="menuitem" onClick={() => onAction(a)}>
            {a}
          </button>
        ))}
      </div>
    </MenuMorph>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/menu-morph";
import "@adamstavely/trenchcoat/tokens.css";

const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-menu-morph @tc-open-change="onOpenChange"></tc-menu-morph>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { MenuMorph } from "@adamstavely/trenchcoat/angular/menu-morph";

@Component({
  selector: "app-menu-morph-example",
  imports: [MenuMorph],
  template: `<tc-menu-morph (tc-open-change)="onOpenChange($event)"></tc-menu-morph>`,
})
export class MenuMorphExample {
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/menu-morph";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";

  let el: TcMenuMorph;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-menu-morph bind:this={el}></tc-menu-morph>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the menu is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `align` | `align` | `MenuMorphAlign` | `"start"` | Where the menu lines up with the trigger |
| `side` | `side` | `MenuMorphSide` | `"bottom"` | The side the menu prefers – it flips when there's no room |
| `gap` | `gap` | `number` | `6` | Space between the trigger and the menu, px |
| `duration` | `duration` | `number \| undefined` | `undefined` | Length of the morph in ms; default the --tc-duration-base token |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The menu is opening or closing ({ open }: MenuMorphOpenChange); cancelable – prevented, `open` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `trigger()` | `HTMLElement \| null` | The page's trigger |
| `panel()` | `HTMLElement \| null` | The page's menu panel |
| `toggle(next: unknown, focus: "first" \| "last" \| null)` | `void` | Opens or closes it, as the trigger would |

#### Design tokens it reads (18)

`--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-space-0-5`, `--tc-space-2`, `--tc-space-4`, `--tc-text-disabled`, `--tc-text-primary`, `--tc-z-popover`

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

*Also attributes: `open`, `align`, `side`, `gap`, `duration` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-menu-morph id="menu-morph"></tc-menu-morph>

<script type="module">
  import "@adamstavely/trenchcoat/menu-morph";

  const el = document.querySelector("#menu-morph");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/menu-morph";
import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";

const props = defineProps<{ initial: TcMenuMorph["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcMenuMorph["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-menu-morph :open="open" @tc-open-change="onOpenChange"></tc-menu-morph>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MenuMorph } from "@adamstavely/trenchcoat/angular/menu-morph";
import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";

@Component({
  selector: "app-controlled-menu-morph",
  imports: [MenuMorph],
  template: `<tc-menu-morph [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-menu-morph>`,
})
export class ControlledMenuMorph {
  readonly initial = input.required<TcMenuMorph["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcMenuMorph["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/menu-morph";
  import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";

  let { initial }: { initial: TcMenuMorph["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcMenuMorph;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcMenuMorph["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-menu-morph bind:this={el} {open}></tc-menu-morph>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-menu-morph")` returns a `TcMenuMorph` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";`
- **React / Next.js:** Props: `import type { MenuMorphProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MenuMorph>`. The element class, for refs: `import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMenuMorph["open"]` with `import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";`
- **Angular:** The directive types the template: `[open]` takes `TcMenuMorph["open"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMenuMorph } from "@adamstavely/trenchcoat/menu-morph";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Whether the menu is open – controlled when given |
| `defaultOpen` | `boolean` | Whether it's open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The menu is opening or closing |

*Renamed or hidden on the wrapper: `open`*

## Accessibility

Follows the WAI-ARIA [Menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

### Keyboard

| Key | Does |
|---|---|
| Enter, Space or ↓ on the button | Opens the menu on its first item |
| ↑ on the button | Opens the menu on its last item |
| ↓ / ↑ | Next or previous item, wrapping round |
| Home / End | First or last item |
| A letter | The next item that starts with it |
| Enter or Space on an item | Chooses it and closes the menu (unless the item has `data-keep-open`) |
| Escape | Closes the menu; focus goes back to the button |
| Tab | Closes the menu and moves on |

### Screen readers

The button gets `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the panel gets `role="menu"` and, unless
you give it an `aria-label`, is labelled by the button. Items are `role="menuitem"` (or `menuitemcheckbox` /
`menuitemradio`) – yours to set, since they're your elements. Only the focused item is in the tab order.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | itself | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 11.9 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/popover` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **19.2 KB** | **7.0 KB** |
| With Lit – the first component on a page | 38.8 KB | 13.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 8.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Keep it to a handful of short commands, each a verb: “Assign reviewer”, “Export finding”.
- Give the panel an `aria-label` that names what the commands act on when the button's words don't.
- Listen for `tc-open-change` and call `preventDefault()` to keep it open or shut while something is saving.

### Don't

- Don't put form fields or long text in the panel – a menu holds commands.
- Don't nest another menu inside; open a dialog for anything that needs more choices.

## Related

- [Shared Element](shared-element.md) – A piece of content grows into its detail view, with focus moving along and Escape to close, so people keep their place
- [Collapse](collapse.md) – Content that glides open and shut to its real height, with nothing to measure, and can't be reached while shut
- [Command Menu](../components/command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Filter Menu](../components/filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
