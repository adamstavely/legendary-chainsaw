<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Header Brand

**Inputs & controls** · New

The product's logo and name at the start of a full-width app header – a link home an app's router can take over, sized from the page, never clipped, with an inverse look for a dark bar

- **Element:** `<tc-header-brand>`
- **Size:** 4.6 KB gzip · 11.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/header-brand";` |
| React / Next.js | `import { HeaderBrand } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/header-brand";` · tags starting with tc- are custom elements |
| Angular | `import { HeaderBrand } from "@adamstavely/trenchcoat/angular/header-brand";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/header-brand";` |

## Example

The live example is in the gallery at `#/header-brand`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The product's logo and name at the start of a full-width app header. With `href` it's a link home that an app's
router can take over; without it, plain text. The name is never cut short, and its line height follows its own size,
so a large name sits whole in the bar.

### When to use

- At the start of a top bar that runs across the whole page, opposite `header-nav`.
- When the logo and name move out of the side navigation and into the header.

### When not to use

- A brand at the top of a side bar – use [Side Nav](side-nav.md)'s `brand`.
- A trail of places that leads to the current page – use [Breadcrumbs](breadcrumbs.md).
- Switching between products – use [App Picker](app-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Brand** `.ui-hb__brand` – the link (or text) holding both parts, with a focus ring on the link
2. **Logo** `.ui-hb__logo` – the `icon`, cloned, in a square box `--tc-hb-logo-size` wide
3. **Name** `.ui-hb__name` – the product's name, at `--tc-hb-name-size`

## Looks

Standard and Clean differ only in their tokens' values: the name's colour, weight and tracking. Size the brand from
the page with `--tc-hb-name-size` (default `--tc-font-size-lg`), `--tc-hb-logo-size` (24px), `--tc-hb-weight`
(semibold) and `--tc-hb-gap` (`--tc-space-2`); `--tc-hb-line-height` (1.1) is relative to the name's size. On a dark
bar, `inverse` draws the brand in the dark theme's colours whatever the page's theme.

## Usage

### HTML

```html
<tc-header-brand id="brand" name="Intellect" href="/"></tc-header-brand>

<script type="module">
  import "@adamstavely/trenchcoat/header-brand";
  import "@adamstavely/trenchcoat/tokens.css";

  const brand = document.querySelector("#brand");
  brand.icon = document.querySelector("#logo-template").content.firstElementChild;
  brand.addEventListener("tc-navigate", (e) => {
    e.preventDefault();
    history.pushState(null, "", e.detail.href);
  });
</script>
```

### React / Next.js

```tsx
import { HeaderBrand } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AppBrand({ go }: { go: (href: string) => void }) {
  return (
    <HeaderBrand
      name="Intellect"
      href="/"
      onNavigate={(href, e) => {
        e.preventDefault();
        go(href);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/header-brand";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";

defineProps<{ icon: TcHeaderBrand["icon"] }>();
const onNavigate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-header-brand :icon="icon" @tc-navigate="onNavigate"></tc-header-brand>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HeaderBrand } from "@adamstavely/trenchcoat/angular/header-brand";
import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";

@Component({
  selector: "app-header-brand-example",
  imports: [HeaderBrand],
  template: `<tc-header-brand [icon]="icon()" (tc-navigate)="onNavigate($event)"></tc-header-brand>`,
})
export class HeaderBrandExample {
  readonly icon = input.required<TcHeaderBrand["icon"]>();
  onNavigate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/header-brand";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";

  let { icon }: { icon: TcHeaderBrand["icon"] } = $props();
  let el: TcHeaderBrand;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-header-brand bind:this={el} {icon}></tc-header-brand>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | The product's name |
| `href` | `href` | `string \| undefined` | `undefined` | Where the brand links to; without it (or when it isn't a safe link) the brand is plain text |
| `icon` | – | `Element \| undefined` | `undefined` | The logo – an SVG or img element, cloned before the name |
| `inverse` | `inverse` | `boolean` | `false` | On a dark header bar: draw the brand in the dark theme's colours whatever the page's theme |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-navigate` | – | Yes | The linked brand was clicked ({ href }: HeaderBrandNavigate); cancelable – prevented, the link isn't followed |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hb-gap` | `var(--tc-space-2)` | not set – this fallback applies |
| `--tc-hb-weight` | `var(--tc-font-weight-semibold)` | not set – this fallback applies |
| `--tc-hb-name-size` | `var(--tc-font-size-lg)` | not set – this fallback applies |
| `--tc-hb-line-height` | `1.1` | not set – this fallback applies |
| `--tc-hb-logo-size` | `24px` | not set – this fallback applies |

#### Design tokens it reads (9)

`--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-weight-semibold`, `--tc-radius-md`, `--tc-space-2`, `--tc-text-primary`, `--tc-tracking-snug`

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
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-header-brand :icon="…">` | `<tc-header-brand [icon]="…">` | `<tc-header-brand {icon}>` |

*Also attributes: `name`, `href`, `inverse` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-navigate` | Yes | `el.addEventListener("tc-navigate", (e) => …)` | `onNavigate={…}` | `@tc-navigate="…"` | `(tc-navigate)="…($event)"` | `el.addEventListener("tc-navigate", …)` |

### Controlled

`tc-navigate` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-header-brand")` returns a `TcHeaderBrand` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";`
- **React / Next.js:** Props: `import type { HeaderBrandProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HeaderBrand>`. The element class, for refs: `import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHeaderBrand["icon"]` with `import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";`
- **Angular:** The directive types the template: `[icon]` takes `TcHeaderBrand["icon"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHeaderBrand } from "@adamstavely/trenchcoat/header-brand";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `icon` | `React.ReactNode \| Element` | The logo – a React node or an element, cloned before the name |
| `onNavigate` | `(href: string, event: CustomEvent<HeaderBrandNavigate>) => void` | The linked brand was clicked; call `event.preventDefault()` to route it yourself instead of following the link |

*Renamed or hidden on the wrapper: `icon`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the brand when it's a link |
| Enter | Follows the link, or hands it to the app through `tc-navigate` |

### Screen readers

A linked brand is a link named by the product's name; the logo is hidden from screen readers, as the name says the
same. Without `href` the name is plain text.

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
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 4.8 KB | 2.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **11.8 KB** | **4.6 KB** |
| With Lit – the first component on a page | 31.4 KB | 11.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 6 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

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

- Use the product's name as people say it: “Intellect”, not a tagline.
- Give the logo as an SVG or img element; it's cloned, so the same element can be passed to several brands.

## Do and don't

### Do

- Link the brand home and route the click with `tc-navigate` in a single-page app.
- Set `inverse` when the header bar is dark in both themes.

### Don't

- Don't put navigation or actions in the brand – they belong in the header's other parts.
- Don't leave out `name` with only a logo; the link would have no name.

## Related

- [Header Nav](../blocks/header-nav.md) – The right end of an app header – notifications bell, app picker and the person's avatar, which opens their account card; one popover at a time, the three as one set of round buttons, and it fits a 320 px header (uses `@adamstavely/trenchcoat/react`: `notifications`, `app-picker`, `profile-menu`)
- [Side Nav](side-nav.md) – An app's main navigation down the side – brand, places with icons and badges in sections, the current page, real links with a cancelable `tc-navigate` for routing, a footer of the page's own and a fold into an icon-only rail
- [Breadcrumbs](breadcrumbs.md) – Where you are in a hierarchy as a trail of links: the current page last, the middle folding into "…" when it doesn't fit or passes `max`, a cancelable `tc-navigate` for routing, and Copy path
- [App Picker](app-picker.md) – The app launcher for a suite header – a grid button that opens your apps as tiles, with pinned and recent apps, search, the current app marked and arrow keys that move in two dimensions

## Changelog

- **Header Brand:** `tc-header-brand` (`@adamstavely/trenchcoat/header-brand`, React `HeaderBrand`, Angular `HeaderBrand` from `@adamstavely/trenchcoat/angular/header-brand`), the product's logo and name at the start of a full-width app header. - `name`; `href` makes it a link (through `safeUrl` – an unsafe link leaves plain text); `icon`, an SVG or img element cloned before the name; `inverse` draws it in the dark theme's colours on a dark bar, as `tc-header-nav inverse` does; and `look`. - A click on the link fires a cancelable `tc-navigate` (`{ href }`): prevented, the link isn't followed, so an app's router can take it. Clicks with a modifier key are left to the browser. - Sized from the page: `--tc-hb-name-size` (default `--tc-font-size-lg`), `--tc-hb-logo-size` (24px), `--tc-hb-weight` (semibold), `--tc-hb-gap` (`--tc-space-2`) and `--tc-hb-line-height` (1.1, relative to the name's size). The name is never truncated or clipped, and the brand is centred vertically, with a focus ring on the link.
