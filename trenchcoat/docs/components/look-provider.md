<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Look Provider

**Utilities**

Sets the look, Standard or Clean, for every Trenchcoat element inside it – one wrapper for a whole app, with any element still free to choose its own

- **Element:** `<tc-look-provider>`
- **Size:** 1.4 KB gzip · 2.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/look-provider";` |
| React / Next.js | `import "@adamstavely/trenchcoat/look-provider";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/look-provider";` · tags starting with tc- are custom elements |
| Angular | `import { LookProvider } from "@adamstavely/trenchcoat/angular/look-provider";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/look-provider";` |

## Example

The live example is in the gallery at `#/look-provider`, at 320 px, 480 px or full width.

## Overview

Sets the default look – Standard or Clean – for every Trenchcoat element inside it, so an app picks its look once
instead of on every element. It renders nothing of its own (it's `display: contents`), so wrapping a subtree doesn't
change the layout. An element's own `look` still wins; elements without one take the nearest provider's, and
Standard when there's none. Changing the provider's `look` restyles everything inside at once.

### When to use

- At the root of an app that uses Clean throughout: wrap it once and leave `look` off the elements.
- Around one part of a page that should differ from the rest – a settings panel in Clean inside a Standard app.
  Providers nest; the nearest one wins.
- A Standard / Clean switch, like the gallery's: bind the switch to the provider's `look`.

### When not to use

- One element that differs from its neighbours – set `look` on that element.
- Illustrations and motion pieces – they have one look and ignore the provider.
- Light and dark – that's the theme, set with `color-scheme`, `data-tc-theme` or a `.dark` class, not a look.

## Usage

### HTML

```html
<tc-look-provider look="clean">
  <label for="assignees">Assignees</label>
  <tc-combobox id="assignees"></tc-combobox>
  <tc-button label="Save"></tc-button>
  <tc-button label="Cancel" variant="secondary" look="standard"></tc-button>
</tc-look-provider>

<script type="module">
  import "@adamstavely/trenchcoat/look-provider";
  import "@adamstavely/trenchcoat/combobox";
  import "@adamstavely/trenchcoat/button";
  import "@adamstavely/trenchcoat/tokens.css";

  // Switch every element inside at once (except the one with its own look)
  document.querySelector("tc-look-provider").look = "standard";
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Button, LookProvider, type Look } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function App() {
  const [look, setLook] = useState<Look>("clean");
  return (
    <LookProvider look={look}>
      <Button onClick={() => setLook(look === "clean" ? "standard" : "clean")}>Switch look</Button>
    </LookProvider>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/look-provider";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-look-provider></tc-look-provider>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { LookProvider } from "@adamstavely/trenchcoat/angular/look-provider";

@Component({
  selector: "app-look-provider-example",
  imports: [LookProvider],
  template: `<tc-look-provider></tc-look-provider>`,
})
export class LookProviderExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/look-provider";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLookProvider } from "@adamstavely/trenchcoat/look-provider";

  let el: TcLookProvider;
</script>

<tc-look-provider bind:this={el}></tc-look-provider>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `look` | `look` | `Look \| undefined` | `undefined` | The look every Trenchcoat element inside takes unless it sets its own: "standard" or "clean" |

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `lookContext: object` | The app-wide default look, set with &lt;tc-look-provider look="clean"> (decision L6); an element's own `look` wins |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-look-provider")` returns a `TcLookProvider` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLookProvider } from "@adamstavely/trenchcoat/look-provider";`
- **React / Next.js:** The element class: `import type { TcLookProvider } from "@adamstavely/trenchcoat/look-provider";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLookProvider["look"]` with `import type { TcLookProvider } from "@adamstavely/trenchcoat/look-provider";`
- **Angular:** The directive types the template: `[look]` takes `TcLookProvider["look"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLookProvider } from "@adamstavely/trenchcoat/look-provider";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLookProvider } from "@adamstavely/trenchcoat/look-provider";`

## Accessibility

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
| :is() and :where() | 88 | 78 | 14 | 14 | tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-27 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 2.5 KB | 1.4 KB |
| Lit · the library every element is built on, the parts it uses | 17.4 KB | – |
| **Added to a page that already has Lit** | **2.5 KB** | **1.4 KB** |
| With Lit – the first component on a page | 21.2 KB | 7.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.1 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 0.8 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- No observers.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Related

- [Button](button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen, ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
