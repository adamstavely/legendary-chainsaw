<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Route Map

**Workspace & sessions** · New

An app's routes as an indented list with :params picked out, a status mark and word, load time and last visit; status chips filter it, and pressing a route opens it.

- **Element:** `<tc-route-map>`
- **Size:** 7.8 KB gzip · 22.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/route-map";` |
| React / Next.js | `import { RouteMap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/route-map";` · tags starting with tc- are custom elements |
| Angular | `import { RouteMap } from "@adamstavely/trenchcoat/angular/route-map";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/route-map";` |

## Example

The live example is in the gallery at `#/route-map`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An app's pages as an indented list that follows the paths: each route with its path in mono (with `:params` picked
out), a status mark and word, how long it took to load and when it was last visited. Pressing a route chooses it and
fires `tc-open`, so the page can show it in a `preview-frame`. Status chips with counts filter the list; the routes
above a match stay, quieter, so the shape holds.

### When to use

- Beside a preview while building a site, to jump between pages and see which are broken or slow.
- A smoke-test summary after a deploy: every route, with what happened when it was visited.

### When not to use

- A project's source files – use [File Tree](file-tree.md).
- One page's loading measures in detail – use [Web Vitals](web-vitals.md).
- The servers behind the routes – use [Process List](process-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Chips** `.ui-rmap__chips` – a toggle per status, with its count
2. **Row** `.ui-rmap__row` – a route, indented by level, with its `data-status`
3. **Path** `.ui-rmap__path` – the parent's part quieter (`.ui-rmap__lead`), each **param** `.ui-rmap__param` picked out
4. **Name** `.ui-rmap__name` – the route's name for people
5. **Status** `.ui-rmap__status` – a mark and a word
6. **Load time** `.ui-rmap__load` – "610 ms", "2.4 s"
7. **Last visited** `.ui-rmap__visited` – "3 min. ago", or a dash for never

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-rmap-indent`, the step per level. Below about 30rem the names and the last-visited column hide.

## Usage

### HTML

```html
<tc-route-map id="routes" description="staging.halden.example"></tc-route-map>

<script type="module">
  import "@adamstavely/trenchcoat/route-map";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#routes");
  el.routes = [
    { id: "home", path: "/", status: "ok", loadMs: 420 },
    { id: "grants", path: "/grants", status: "ok", children: [{ id: "grant", path: "/grants/:id", status: "slow", loadMs: 2380 }] },
  ];
  el.addEventListener("tc-open", (e) => console.log("preview", e.detail.route.path));
</script>
```

### React / Next.js

```tsx
import { RouteMap, type RouteItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const routes: RouteItem[] = [
  { id: "home", path: "/", status: "ok", loadMs: 420 },
  { id: "apply", path: "/grants/:id/apply", status: "error" },
];

export function Routes({ onOpen }: { onOpen: (path: string) => void }) {
  return <RouteMap routes={routes} defaultSelected="home" onTcOpen={(e) => onOpen(e.detail.route.path)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/route-map";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";

defineProps<{ routes: TcRouteMap["routes"]; statuses: TcRouteMap["statuses"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-route-map :routes="routes" :statuses="statuses" @tc-selected-change="onSelectedChange"></tc-route-map>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RouteMap } from "@adamstavely/trenchcoat/angular/route-map";
import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";

@Component({
  selector: "app-route-map-example",
  imports: [RouteMap],
  template: `<tc-route-map [routes]="routes()" [statuses]="statuses()" (tc-selected-change)="onSelectedChange($event)"></tc-route-map>`,
})
export class RouteMapExample {
  readonly routes = input.required<TcRouteMap["routes"]>();
  readonly statuses = input.required<TcRouteMap["statuses"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/route-map";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";

  let { routes, statuses }: { routes: TcRouteMap["routes"]; statuses: TcRouteMap["statuses"] } = $props();
  let el: TcRouteMap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-route-map bind:this={el} {routes} {statuses}></tc-route-map>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Routes"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the site or environment |
| `routes` | – | `RouteItem[]` | `[]` | The routes; children are indented under their parent |
| `selected` | `selected` | `string \| null` | `null` | The chosen route's id, or null |
| `statuses` | – | `RouteStatus[]` | `[]` | The statuses shown; empty shows every route |
| `now` | `now` | `number \| undefined` | `undefined` | The time "last visited" counts to, in epoch ms; unset, the element keeps its own clock |
| `maxHeight` | `max-height` | `number` | `0` | Height in px at which the list scrolls; 0 for no limit |
| `labels` | – | `Partial<RouteMapLabels>` | `{}` | Renames the words it uses |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and times, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A route was pressed ({ selected, route }: RouteSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-statuses-change` | – | Yes | A status chip was toggled ({ statuses }: RouteStatusesChange); cancelable – prevented, `statuses` stays as it was |
| `tc-open` | – | Yes | A route was clicked, or Enter or Space pressed on it ({ id, route }: RouteOpen); cancelable – prevented, nothing is announced |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rmap-indent` | `var(--tc-space-4)` | both |

#### Design tokens it reads (40)

`--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-rmap-level`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-syntax-keyword`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `routes` | `el.routes = …;` | `<… routes={…} />` | `<tc-route-map :routes="…">` | `<tc-route-map [routes]="…">` | `<tc-route-map {routes}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-route-map :statuses="…">` | `<tc-route-map [statuses]="…">` | `<tc-route-map {statuses}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-route-map :labels="…">` | `<tc-route-map [labels]="…">` | `<tc-route-map {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `now`, `max-height`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-statuses-change` | Yes | `el.addEventListener("tc-statuses-change", (e) => …)` | `ref.current.addEventListener("tc-statuses-change", …)` | `@tc-statuses-change="…"` | `(tc-statuses-change)="…($event)"` | `el.addEventListener("tc-statuses-change", …)` |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `statuses` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-statuses-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-route-map id="route-map"></tc-route-map>

<script type="module">
  import "@adamstavely/trenchcoat/route-map";

  const el = document.querySelector("#route-map");
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
import "@adamstavely/trenchcoat/route-map";
import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";

const props = defineProps<{ initial: TcRouteMap["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcRouteMap["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-route-map :selected="selected" @tc-selected-change="onSelectedChange"></tc-route-map>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RouteMap } from "@adamstavely/trenchcoat/angular/route-map";
import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";

@Component({
  selector: "app-controlled-route-map",
  imports: [RouteMap],
  template: `<tc-route-map [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-route-map>`,
})
export class ControlledRouteMap {
  readonly initial = input.required<TcRouteMap["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcRouteMap["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/route-map";
  import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";

  let { initial }: { initial: TcRouteMap["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcRouteMap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcRouteMap["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-route-map bind:this={el} {selected}></tc-route-map>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-route-map")` returns a `TcRouteMap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";`
- **React / Next.js:** Props: `import type { RouteMapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RouteMap>`. The element class, for refs: `import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRouteMap["routes"]` with `import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";`
- **Angular:** The directive types the template: `[routes]` takes `TcRouteMap["routes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRouteMap } from "@adamstavely/trenchcoat/route-map";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `selected` | `string \| null` | The chosen route's id – controlled when given |
| `defaultSelected` | `string \| null` | The chosen route at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, route: RouteItem \| null) => void` | A route was pressed |
| `statuses` | `RouteStatus[]` | The statuses shown – controlled when given; empty shows every route |
| `defaultStatuses` | `RouteStatus[]` | The statuses shown at first, when `statuses` isn't controlled |
| `onStatusesChange` | `(statuses: RouteStatus[]) => void` | A status chip was toggled |

*Renamed or hidden on the wrapper: `heading`, `selected`, `statuses`, `children`*

## Accessibility

### Keyboard

The rows are one tab stop; the chips are buttons in the tab order before them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the route above or below |
| Home / End | Moves to the first or last route |
| Enter / Space | Chooses and opens the route |

### Screen readers

The routes are a list named by the heading and described by a hidden note of the keys; each is a button that reads the
full path, the name, the status word, the load time and the last visit ("Never" when it hasn't been). The chosen route
has `aria-current="true"`. The chips are toggle buttons (`aria-pressed`) in a group named "Filter by status". Opening a
route is announced through a polite status.

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
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

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
| **This component alone** | 15.4 KB | 5.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.9 KB** | **7.8 KB** |
| With Lit – the first component on a page | 43.6 KB | 14.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.1 ms** | the gallery demo's data, 143 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of routes replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | routes: first render, 2,543 nodes; update 4.1 ms |
| 1,000 items | 110 ms | routes: first render, 25,043 nodes; update 24 ms |

1,000 items of routes: 110 ms. It renders every item, so a first render passes 50 ms (a long task) at about 460 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write paths as the router does, with `:params`; a child's path includes its parent's.
- Pass `loadMs` and `lastVisited` from the last real visit; leave them out for routes never visited.
- Pass `now` to keep the times still, as in a screenshot.
- A `status` it doesn't know counts as not visited.

## Do and don't

### Do

- Open the route in a `preview-frame` on `tc-open`.
- Mark a route "slow" from your own threshold, and say what it is in `description`.

### Don't

- Don't list every generated page (each grant, each reviewer); list the route pattern once.
- Don't rely on colour alone – keep the status words.

## Related

- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [Web Vitals](web-vitals.md) – A tile per measure (LCP, INP, CLS, FCP, TTFB or the page's own) with its value, a Good / Needs improvement / Poor word, a three-zone track and earlier readings, plus an optional Mobile / Desktop switch.
- [File Tree](file-tree.md) – A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page
- [Process List](process-list.md) – dev servers and background jobs with status, port link, uptime, CPU and memory, and last output, with Stop, Start, Restart and View output.
