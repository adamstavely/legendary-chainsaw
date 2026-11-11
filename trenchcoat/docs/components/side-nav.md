<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Side Nav

**Inputs & controls** · New

An app's main navigation down the side – brand, places with icons and badges in sections, the current page, real links with a cancelable `tc-navigate` for routing, a footer of the page's own and a fold into an icon-only rail

- **Element:** `<tc-side-nav>`
- **Size:** 7.4 KB gzip · 22.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/side-nav";` |
| React / Next.js | `import { SideNav } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/side-nav";` · tags starting with tc- are custom elements |
| Angular | `import { SideNav } from "@adamstavely/trenchcoat/angular/side-nav";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/side-nav";` |

## Example

The live example is in the gallery at `#/side-nav`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An app's main navigation down the side of the page: the product's name and logo at the top, then the places in the
app – each with an icon, and a count or a short word when something waits there – one of them the current page. The
page's own children sit at the bottom: a reminder, an upgrade offer, a setup guide. Items with `href` are real links,
so a middle-click or ⌘/Ctrl-click opens a new tab; every plain click fires a cancelable `tc-navigate`, so a
single-page app's router can take it instead. A linked brand (`brand-href`) fires the same event with the id
`"brand"` and `brand: true`, and doesn't change `current`. `collapsible` adds a button that folds the bar into an
icon-only rail.

### When to use

- The top-level places of an app with more than a handful of them, or with counts to show.
- Apps people stay in for long stretches, where a permanent bar is worth its width.

### When not to use

- The tools at the right end of an app header – use [Header Nav](../blocks/header-nav.md).
- Where the current page sits in a hierarchy – use [Breadcrumbs](breadcrumbs.md).
- A row of views for one panel – use [Icon Rail](icon-rail.md).
- A list of conversations or sessions – use [Session List](session-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Head** `.ui-snav__head` – the brand and the collapse button; `--tc-snav-head-gap` is the space under it
2. **Brand** `.ui-snav__brand` – the logo and the product's name, a link when `brand-href` is set; the name's size
3. **Collapse** `.ui-snav__toggle` – folds the bar into a rail and back
4. **Nav** `.ui-snav__nav` – the navigation landmark, named by `label`
5. **Section** `.ui-snav__section` – a caption over a group of items
6. **Link** `.ui-snav__link` – one place: a link, or a button when it has no `href`
7. **Icon** `.ui-snav__icon` – the item's icon, or its first letter
8. **Badge** `.ui-snav__badge` – a count or a short word after the label

## Looks

Standard is a gray bar, like the page behind a white panel, with the current item on a white pill. Clean is a white
bar with a hairline edge and the current item tinted in the accent. `--tc-snav-width` and `--tc-snav-rail` on
`tc-side-nav` set the width open and as a rail; `--tc-snav-icon` sets the icons' size.

The brand takes its size and the space under it from the page too:

| Property | What it sets | Default |
|---|---|---|
| `--tc-snav-brand-size` | The product name's font size | The bar's own size (`--tc-font-size-md`) |
| `--tc-snav-brand-weight` | The product name's weight | `--tc-font-weight-semibold` |
| `--tc-snav-logo-size` | The logo's width and height | 28px, never more than the rail's inner width (44px by default) |
| `--tc-snav-head-gap` | The space between the brand's row and the first item, open or as a rail | `--tc-space-2`, the space between the bar's other parts |

A 32px logo and an xl name (`--tc-snav-brand-size: var(--tc-font-size-xl)`) fit beside the collapse button at the
default width for a short name like a product's; a longer one is cut off with an ellipsis. Folded into the rail, the
logo stays centred.

## Usage

### HTML

```html
<tc-side-nav brand="Halden Institute" brand-href="/" current="portfolio" collapsible>
  <p>Portfolio review in 6 days</p>
</tc-side-nav>

<script type="module">
  import "@adamstavely/trenchcoat/side-nav";
  import "@adamstavely/trenchcoat/tokens.css";

  const nav = document.querySelector("tc-side-nav");
  nav.items = [
    { id: "home", label: "Overview", href: "/" },
    { id: "portfolio", label: "Portfolio", href: "/portfolio", badge: 12 },
    { id: "team", label: "Team", href: "/team", section: "Institute" },
  ];
  nav.addEventListener("tc-navigate", (e) => console.log(e.detail.id, e.detail.href));
</script>
```

### React / Next.js

```tsx
import { SideNav, type SideNavItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: SideNavItem[] = [
  { id: "home", label: "Overview", href: "/" },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", badge: 12 },
  { id: "team", label: "Team", href: "/team", section: "Institute" },
];

export function AppNav({ current, go }: { current: string; go: (href: string) => void }) {
  return (
    <SideNav
      brand="Halden Institute"
      brandHref="/"
      items={items}
      current={current}
      collapsible
      onNavigate={(_id, href, event) => {
        if (!href) return;
        event.preventDefault();
        go(href);
      }}
    >
      <p>Portfolio review in 6 days</p>
    </SideNav>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/side-nav";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";

defineProps<{ items: TcSideNav["items"]; brandIcon: TcSideNav["brandIcon"] }>();
const onNavigate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-side-nav :items="items" :brandIcon="brandIcon" @tc-navigate="onNavigate"></tc-side-nav>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SideNav } from "@adamstavely/trenchcoat/angular/side-nav";
import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";

@Component({
  selector: "app-side-nav-example",
  imports: [SideNav],
  template: `<tc-side-nav [items]="items()" [brandIcon]="brandIcon()" (tc-navigate)="onNavigate($event)"></tc-side-nav>`,
})
export class SideNavExample {
  readonly items = input.required<TcSideNav["items"]>();
  readonly brandIcon = input.required<TcSideNav["brandIcon"]>();
  onNavigate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/side-nav";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";

  let { items, brandIcon }: { items: TcSideNav["items"]; brandIcon: TcSideNav["brandIcon"] } = $props();
  let el: TcSideNav;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-side-nav bind:this={el} {items} {brandIcon}></tc-side-nav>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `SideNavItem[]` | `[]` | The places, top to bottom |
| `current` | `current` | `string \| null` | `null` | The id of the current page's item – it gets aria-current="page" |
| `brand` | `brand` | `string` | `""` | The product's name at the top |
| `brandHref` | `brand-href` | `string \| undefined` | `undefined` | Where the brand links to; without it the brand is plain text |
| `brandIcon` | – | `Element \| undefined` | `undefined` | The product's logo (an SVG or img element), cloned before its name |
| `label` | `label` | `string` | `"Main"` | The navigation landmark's name |
| `collapsed` | `collapsed` | `boolean` | `false` | Folded into an icon-only rail |
| `collapsible` | `collapsible` | `boolean` | `false` | Adds the button that folds the bar into a rail and back |
| `labels` | – | `Partial<SideNavLabels>` | `{}` | The collapse button's words, merged over defaultSideNavLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-navigate` | – | Yes | An item or the linked brand was clicked ({ id, href, item, brand }: SideNavNavigate); cancelable – prevented, a link isn't followed and `current` stays |
| `tc-collapsed-change` | – | Yes | The collapse button was pressed ({ collapsed }: SideNavCollapsedChange); cancelable – prevented, `collapsed` stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-snav-width` | `248px` | both |
| `--tc-snav-rail` | `60px` | both |
| `--tc-snav-icon` | `18px` | both |
| `--tc-snav-current` | `var(--tc-fill-default)` | standard, clean |
| `--tc-snav-current-shadow` | `none` | standard, clean |
| `--tc-snav-head-gap` | `var(--tc-space-2)` | not set – this fallback applies |
| `--tc-snav-brand-weight` | `var(--tc-font-weight-semibold)` | not set – this fallback applies |
| `--tc-snav-brand-size` | `1em` | not set – this fallback applies |
| `--tc-snav-brand-line-height` | `1.2` | not set – this fallback applies |
| `--tc-snav-logo-size` | `28px` | not set – this fallback applies |
| `--tc-snav-item-gap` | `var(--tc-space-0-5)` | not set – this fallback applies |
| `--tc-snav-item-height` | `var(--tc-control-h-md)` | not set – this fallback applies |

#### Design tokens it reads (44)

`--tc-accent-solid`, `--tc-accent-text`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `SIDE_NAV_BRAND_ID: string` | The id tc-navigate carries for a click on the brand |
| `sideNavGroups(items: SideNavItem[]): void` | Items in groups: a new group starts wherever the section changes |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-side-nav :items="…">` | `<tc-side-nav [items]="…">` | `<tc-side-nav {items}>` |
| `brandIcon` | `el.brandIcon = …;` | `<… brandIcon={…} />` | `<tc-side-nav :brandIcon="…">` | `<tc-side-nav [brandIcon]="…">` | `<tc-side-nav {brandIcon}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-side-nav :labels="…">` | `<tc-side-nav [labels]="…">` | `<tc-side-nav {labels}>` |

*Also attributes: `current`, `brand`, `brand-href`, `label`, `collapsed`, `collapsible` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-navigate` | Yes | `el.addEventListener("tc-navigate", (e) => …)` | `onNavigate={…}` | `@tc-navigate="…"` | `(tc-navigate)="…($event)"` | `el.addEventListener("tc-navigate", …)` |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `collapsed` itself unless a listener calls `preventDefault()` on `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-side-nav id="side-nav"></tc-side-nav>

<script type="module">
  import "@adamstavely/trenchcoat/side-nav";

  const el = document.querySelector("#side-nav");
  el.addEventListener("tc-collapsed-change", (e) => {
    e.preventDefault(); // the element keeps its collapsed…
    if (allowed(e.detail.collapsed)) el.collapsed = e.detail.collapsed; // …until the app sets it
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
import "@adamstavely/trenchcoat/side-nav";
import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";

const props = defineProps<{ initial: TcSideNav["collapsed"] }>();
const collapsed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCollapsedChange = (e: CustomEvent<{ collapsed: TcSideNav["collapsed"] }>) => {
  e.preventDefault();
  collapsed.value = e.detail.collapsed;
};
</script>

<template>
  <tc-side-nav :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-side-nav>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SideNav } from "@adamstavely/trenchcoat/angular/side-nav";
import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";

@Component({
  selector: "app-controlled-side-nav",
  imports: [SideNav],
  template: `<tc-side-nav [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-side-nav>`,
})
export class ControlledSideNav {
  readonly initial = input.required<TcSideNav["collapsed"]>();
  readonly collapsed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCollapsedChange(e: CustomEvent<{ collapsed: TcSideNav["collapsed"] }>) {
    e.preventDefault();
    this.collapsed.set(e.detail.collapsed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/side-nav";
  import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";

  let { initial }: { initial: TcSideNav["collapsed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let collapsed = $derived(initial);
  let el: TcSideNav;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      collapsed = (e as CustomEvent<{ collapsed: TcSideNav["collapsed"] }>).detail.collapsed;
    };
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-side-nav bind:this={el} {collapsed}></tc-side-nav>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-side-nav")` returns a `TcSideNav` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";`
- **React / Next.js:** Props: `import type { SideNavProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SideNav>`. The element class, for refs: `import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSideNav["items"]` with `import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";`
- **Angular:** The directive types the template: `[items]` takes `TcSideNav["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSideNav } from "@adamstavely/trenchcoat/side-nav";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `current` | `string \| null` | The current page's item id – controlled when given; your router sets it |
| `defaultCurrent` | `string \| null` | The current item at first, when `current` isn't controlled; then a click moves it |
| `onNavigate` | `(id: string, href: string \| undefined, event: CustomEvent<SideNavNavigate>) => void` | An item or the linked brand (id "brand", `event.detail.brand`) was clicked; call `event.preventDefault()` to route a link yourself instead of following it |
| `collapsed` | `boolean` | Folded into an icon-only rail – controlled when given |
| `defaultCollapsed` | `boolean` | Folded at first, when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: boolean) => void` | The collapse button was pressed |

*Renamed or hidden on the wrapper: `current`, `collapsed`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the brand, the collapse button, each item, then the page's footer content |
| ↓ / ↑ | Next or previous item |
| Home / End | First or last item |
| Enter | Follows the link, or chooses a button item |
| Enter / Space (on Collapse) | Folds or unfolds the bar |

### Screen readers

A `nav` landmark named by `label` (“Main”) holds a list of links; a group with a section caption is named by it. The
current page is `aria-current="page"`. A badge is part of its item's name (“Portfolio 12”). Disabled items are
`aria-disabled` links that can't be focused. In the rail the labels are still read, and show as tooltips. The
collapse button says whether the bar is open (`aria-expanded`), and folding announces “Navigation collapsed”.

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
| **This component alone** | 15.6 KB | 5.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.7 KB** | **7.4 KB** |
| With Lit – the first component on a page | 42.2 KB | 13.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 81 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of items replaced |
| First on the page | 4.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.7 ms | items: first render, 957 nodes; update 3.4 ms |
| 1,000 items | 37 ms | items: first render, 9,446 nodes; update 23 ms |

1,000 items of items: 37 ms, 9,446 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name each place with a noun people use for it: “Portfolio”, “Reports”, not “Manage portfolio”.
- Keep badges to counts and one short word; a badge that's always there stops being read.
- Put admin and rarely used places in their own section at the end.
- If your router handles `tc-navigate`, check `event.detail.brand` (or the id `"brand"`) for the brand's link home.

## Do and don't

### Do

- Set `current` from your router so the highlight follows the URL, back button included.
- Give every item an icon if any has one, so the rail stays readable.

### Don't

- Don't put actions (“New study”) among the places – put them in the page.
- Don't hide the current page's item in a collapsed section.

## Related

- [Header Nav](../blocks/header-nav.md) – The right end of an app header – notifications bell, app picker and the person's avatar, which opens their account card; one popover at a time, the three as one set of round buttons, and it fits a 320 px header (uses `@adamstavely/trenchcoat/react`: `notifications`, `app-picker`, `profile-menu`)
- [Breadcrumbs](breadcrumbs.md) – Where you are in a hierarchy as a trail of links: the current page last, the middle folding into "…" when it doesn't fit or passes `max`, a cancelable `tc-navigate` for routing, and Copy path
- [Icon Rail](icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.
- [Session List](session-list.md) – sessions in a sidebar, pinned first and grouped by project or status, with status, unread dot, branch, time, Pin and Archive.

## Changelog

- **Side Nav** (`tc-side-nav`): an app's main navigation down the side – the brand at the top, places with icons, badges and section captions, one of them the current page (`aria-current="page"`), and the page's own children at the bottom. Items with `href` are real links; a plain click fires a cancelable `tc-navigate` ({ id, href, item }) for a router, and ⌘/Ctrl- or Shift-clicks are left to the browser. `collapsible` folds it into an icon-only rail (`collapsed`, cancelable `tc-collapsed-change`). React `SideNav`, Angular `SideNav`.
