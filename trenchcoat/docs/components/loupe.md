<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Loupe

**Utilities** · New

A design-system inspector over the live page – components outlined with a card of their name, path and links, a breakpoint ruler, flex and grid containers listed – ⌘⇧L to turn it on

- **Element:** `<tc-loupe>`
- **Size:** 13.9 KB gzip · 47.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/loupe";` |
| React / Next.js | `import { Loupe } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/loupe";` · tags starting with tc- are custom elements |
| Angular | `import { Loupe } from "@adamstavely/trenchcoat/angular/loupe";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/loupe";` |

## Example

The live example is in the gallery at `#/loupe`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A design-system inspector laid over the live page, for the people who build it. Turn it on with ⌘⇧L / Ctrl Shift L
(or `active`). Every component on the page gets an outline: the elements marked `data-ds-component` and the
library's own elements. Point at one for a card with its name, where its code lives, its size and look, and links to
its docs, source and design file. A ruler across the top of the window marks each breakpoint and the window's width,
and the panel says which breakpoint applies. With Layouts on, flex and grid containers are outlined and listed with
their direction, gap and alignment.

The page keeps working underneath. The outlines don't take the pointer, the page still scrolls, and everything
follows scrolling, resizing and changes to the page. The panel lists the components and layouts, so a keyboard can
reach every one. Escape turns it off.

### When to use

- In development and review builds, to find out which component is which on a real screen, and where its code and
  docs are.
- Checking a page at each breakpoint, or finding the flex or grid container behind a spacing problem.

### When not to use

- In the product for its users – it's a builder's tool. Leave it out of production builds, or behind a flag.
- To explain a feature to users – use [Tooltip](tooltip.md) or a tour.
- For a list of commands – use [Command Menu](command-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Panel** `.ui-lpe__panel` – the heading with the window's size and breakpoint, and Close
2. **Switches** `.ui-lpe__switches` – Components, Breakpoints and Layouts, each with its count
3. **Breakpoints** `.ui-lpe__bps` – each breakpoint and its range, the current one marked
4. **Components list** `.ui-lpe__list` – every component found; pick one to scroll to it and keep its card up
5. **Outline** `.ui-lpe__outline` – round each component, named when it's the one in focus
6. **Card** `.ui-lpe__card` – the component's name, path, size, look and links
7. **Ruler** `.ui-lpe__ruler` – breakpoints across the top of the window, with the window's width
8. **Layout outline** `.ui-lpe__layout` – round a flex or grid container, with its direction and gap

## Looks

Standard puts the panel's header on a gray tray above a white card; Clean is one white card with the header as its
first row. Floating (the default) the panel sits at the window's bottom right with an overlay shadow, and shows only
while it's on, unless you add `launcher`. With `floating` off, it's a card in the page with an Inspect button.

A page can set `--tc-lpe-outline` (the component outline colour), `--tc-lpe-layout` (layouts), `--tc-lpe-w` (the
panel's width) and `--tc-lpe-ruler-h`. Breakpoints are coloured from the theme's tones, in order.

## Usage

### HTML

```html
<tc-loupe launcher></tc-loupe>
<script type="module">
  document.querySelector("tc-loupe").components = {
    StatCard: { docs: "/docs/stat-card", source: "https://github.com/acme/app/blob/main/src/StatCard.tsx" },
  };
</script>
```

### React / Next.js

```tsx
import { Loupe } from "@adamstavely/trenchcoat/react";

export function DevTools() {
  if (process.env.NODE_ENV === "production") return null;
  return <Loupe launcher components={{ StatCard: { docs: "/docs/stat-card" } }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/loupe";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";

defineProps<{ hotkey: TcLoupe["hotkey"]; root: TcLoupe["root"] }>();
const onActiveChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-loupe :hotkey="hotkey" :root="root" @tc-active-change="onActiveChange"></tc-loupe>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Loupe } from "@adamstavely/trenchcoat/angular/loupe";
import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";

@Component({
  selector: "app-loupe-example",
  imports: [Loupe],
  template: `<tc-loupe [hotkey]="hotkey()" [root]="root()" (tc-active-change)="onActiveChange($event)"></tc-loupe>`,
})
export class LoupeExample {
  readonly hotkey = input.required<TcLoupe["hotkey"]>();
  readonly root = input.required<TcLoupe["root"]>();
  onActiveChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/loupe";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";

  let { hotkey, root }: { hotkey: TcLoupe["hotkey"]; root: TcLoupe["root"] } = $props();
  let el: TcLoupe;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-loupe bind:this={el} {hotkey} {root}></tc-loupe>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Loupe"` | The panel's heading |
| `active` | `active` | `boolean` | `false` | Whether it's on. Changed by the user unless a tc-active-change listener calls preventDefault() |
| `hotkey` | – | `string \| false` | `"mod+shift+l"` | Turns it on and off from anywhere ("mod+shift+l" is ⌘⇧L on Apple keyboards, Ctrl Shift L elsewhere); false turns it off |
| `selector` | `selector` | `string` | `"[data-ds-component], [data-ui]"` | What counts as a component |
| `root` | – | `Element \| null` | `null` | Where to look; the whole page by default |
| `components` | – | `Record<string, LoupeComponentMeta>` | `{}` | Descriptions and links by component name: the data-ds-component value, or the element's name in words |
| `describe` | – | `((element: Element) => LoupeComponentInfo \| null \| undefined) \| undefined` | `undefined` | Describes an element itself; return null to leave it to the defaults |
| `breakpoints` | – | `LoupeBreakpoint[]` | `defaultBreakpoints` | The breakpoints the ruler and the panel show |
| `showComponents` | `show-components` | `boolean` | `true` | Outline components. Switched by the user unless tc-feature-change is prevented |
| `showRuler` | `show-ruler` | `boolean` | `true` | Show the breakpoint ruler. Switched by the user unless tc-feature-change is prevented |
| `showLayouts` | `show-layouts` | `boolean` | `false` | Outline and list flex and grid containers. Switched by the user unless tc-feature-change is prevented |
| `floating` | `floating` | `boolean` | `true` | The panel floats at the window's corner while on; off, it's a card in the page |
| `launcher` | `launcher` | `boolean` | `false` | Floating and off: show a small button that turns it on |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-active-change` | – | Yes | Turned on or off ({ active }: LoupeActiveChange), by the hotkey, Escape, Close or the start button; cancelable – prevented, `active` stays as it was |
| `tc-feature-change` | – | Yes | Components, the ruler or layouts were switched ({ feature, on }: LoupeFeatureChange); cancelable – prevented, the switch stays |
| `tc-select` | – | No | A component was picked in the panel ({ element, info }: LoupeSelect) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-lpe-w` | `340px` | clean |
| `--tc-lpe-outline` | `var(--tc-status-info-solid)` | clean |
| `--tc-lpe-layout` | `var(--tc-tone-pink-solid)` | clean |
| `--tc-lpe-ruler-h` | `28px` | clean |

#### Design tokens it reads (92)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-pill-h`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-info-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-toast`

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
| `hotkey` | `el.hotkey = …;` | `<… hotkey={…} />` | `<tc-loupe :hotkey="…">` | `<tc-loupe [hotkey]="…">` | `<tc-loupe {hotkey}>` |
| `root` | `el.root = …;` | `<… root={…} />` | `<tc-loupe :root="…">` | `<tc-loupe [root]="…">` | `<tc-loupe {root}>` |
| `components` | `el.components = …;` | `<… components={…} />` | `<tc-loupe :components="…">` | `<tc-loupe [components]="…">` | `<tc-loupe {components}>` |
| `describe` | `el.describe = …;` | `<… describe={…} />` | `<tc-loupe :describe="…">` | `<tc-loupe [describe]="…">` | `<tc-loupe {describe}>` |
| `breakpoints` | `el.breakpoints = …;` | `<… breakpoints={…} />` | `<tc-loupe :breakpoints="…">` | `<tc-loupe [breakpoints]="…">` | `<tc-loupe {breakpoints}>` |

*Also attributes: `heading`, `active`, `selector`, `show-components`, `show-ruler`, `show-layouts`, `floating`, `launcher` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-active-change` | Yes | `el.addEventListener("tc-active-change", (e) => …)` | `ref.current.addEventListener("tc-active-change", …)` | `@tc-active-change="…"` | `(tc-active-change)="…($event)"` | `el.addEventListener("tc-active-change", …)` |
| `tc-feature-change` | Yes | `el.addEventListener("tc-feature-change", (e) => …)` | `onFeatureChange={…}` | `@tc-feature-change="…"` | `(tc-feature-change)="…($event)"` | `el.addEventListener("tc-feature-change", …)` |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onComponentSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `active` itself unless a listener calls `preventDefault()` on `tc-active-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-loupe id="loupe"></tc-loupe>

<script type="module">
  import "@adamstavely/trenchcoat/loupe";

  const el = document.querySelector("#loupe");
  el.addEventListener("tc-active-change", (e) => {
    e.preventDefault(); // the element keeps its active…
    if (allowed(e.detail.active)) el.active = e.detail.active; // …until the app sets it
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
import "@adamstavely/trenchcoat/loupe";
import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";

const props = defineProps<{ initial: TcLoupe["active"] }>();
const active = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onActiveChange = (e: CustomEvent<{ active: TcLoupe["active"] }>) => {
  e.preventDefault();
  active.value = e.detail.active;
};
</script>

<template>
  <tc-loupe :active="active" @tc-active-change="onActiveChange"></tc-loupe>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Loupe } from "@adamstavely/trenchcoat/angular/loupe";
import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";

@Component({
  selector: "app-controlled-loupe",
  imports: [Loupe],
  template: `<tc-loupe [active]="active()" (tc-active-change)="onActiveChange($event)"></tc-loupe>`,
})
export class ControlledLoupe {
  readonly initial = input.required<TcLoupe["active"]>();
  readonly active = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onActiveChange(e: CustomEvent<{ active: TcLoupe["active"] }>) {
    e.preventDefault();
    this.active.set(e.detail.active);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/loupe";
  import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";

  let { initial }: { initial: TcLoupe["active"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let active = $derived(initial);
  let el: TcLoupe;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      active = (e as CustomEvent<{ active: TcLoupe["active"] }>).detail.active;
    };
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-loupe bind:this={el} {active}></tc-loupe>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-loupe")` returns a `TcLoupe` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";`
- **React / Next.js:** Props: `import type { LoupeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Loupe>`. The element class, for refs: `import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLoupe["hotkey"]` with `import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";`
- **Angular:** The directive types the template: `[hotkey]` takes `TcLoupe["hotkey"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLoupe } from "@adamstavely/trenchcoat/loupe";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The panel's heading |
| `active` | `boolean` | Whether it's on – controlled when given |
| `defaultActive` | `boolean` | Whether an uncontrolled Loupe starts on |
| `onActiveChange` | `(active: boolean) => void` | Turned on or off (the hotkey, Escape, Close, the start button) |
| `showComponents` | `boolean` | Outline components – controlled when given |
| `defaultShowComponents` | `boolean` | Whether an uncontrolled Loupe starts outlining components (default true) |
| `showRuler` | `boolean` | Show the breakpoint ruler – controlled when given |
| `defaultShowRuler` | `boolean` | Whether an uncontrolled Loupe starts with the ruler (default true) |
| `showLayouts` | `boolean` | Outline and list flex and grid containers – controlled when given |
| `defaultShowLayouts` | `boolean` | Whether an uncontrolled Loupe starts with layouts (default false) |
| `onFeatureChange` | `(detail: LoupeFeatureChange, event: CustomEvent<LoupeFeatureChange>) => void` | Components, the ruler or layouts were switched; `event.preventDefault()` keeps the switch as it was |
| `onComponentSelect` | `(detail: LoupeSelect) => void` | A component was picked in the panel |

*Renamed or hidden on the wrapper: `heading`, `active`, `showComponents`, `showRuler`, `showLayouts`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | Does |
| --- | --- |
| ⌘ ⇧ L / Ctrl Shift L | Turns it on and off, from anywhere (`hotkey`; false turns it off) |
| Escape | Turns it off – unless a dialog or menu on the page has it first, or a picked component's card is up |
| ↑ / ↓ in a list | Previous / next component or layout, scrolled into view |
| Home / End in a list | First / last |
| Enter or Space in the components list | Picks it: its card stays up |

### Screen readers

- The panel is a region named by its heading. On and off, picks and layout counts are announced in a polite status
  line.
- The switches are `switch`es with their state; the lists are `listbox`es whose active option follows the arrow keys.
- The outlines and the ruler are drawn for sighted builders and hidden from assistive tech; the lists carry the same
  information.
- The card is a `note` named after its component, and its links say where they go.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| backdrop-filter | 76 (Edge 79) | 103 | 18 | 18 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |
| Popover API | 114 | 125 | 17 | 18.3 | itself | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 38.2 KB | 10.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/breakpoints` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.7 KB** | **14.0 KB** |
| With Lit – the first component on a page | 67.3 KB | 20.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 26 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of breakpoints replaced |
| First on the page | 2.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.4 ms | breakpoints: first render, 26 nodes; update 0.1 ms |
| 1,000 items | 0.4 ms | breakpoints: first render, 26 nodes; update 0.0 ms |

What it renders doesn't grow with breakpoints (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window scroll`, `window resize`, `window keydown` (internal/controllers – HotkeyController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give components the name your docs use: `data-ds-component="StatCard"`, with `data-ds-path` for where the code
  lives.
- Put the links in `components` by that name (`docs`, `source`, `design`, or `links` for anything else), or
  describe elements yourself with `describe`.
- Match `breakpoints` to the ones your CSS uses, with labels people say ("Medium", not "md").

## Do and don't

### Do

- Ship it in development and preview builds only.
- Scope it with `root` when it should look at part of the page.
- Keep the hotkey unless the app already uses it.

### Don't

- Mark every element as a component – only the system's own pieces, or the outlines stop meaning anything.
- Leave it on while measuring performance: it reads layout as you scroll.
- Rely on it to tell users anything.

## Related

- [Tooltip](tooltip.md) – Keyboard, pointer and touch help text
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Dialog](dialog.md) – A native modal with interactive content and restored focus

## Changelog

- **Loupe** (`tc-loupe`) – remade from cautious-lamp's LoupeTool. ⌘⇧L outlines the page's components (`data-ds-component` and the library's own elements) with a card of name, path, size, look and docs / source / design links; a ruler marks the breakpoints and the window's width; flex and grid containers are outlined and listed. Unlike the original, the page keeps scrolling and working underneath, outlines follow scrolling, resizing and DOM changes (no polling), the overlay sits in the top layer so transformed or contained ancestors can't shift it, and everything is reachable from keyboard lists in the panel. Kept out of generative UI.
