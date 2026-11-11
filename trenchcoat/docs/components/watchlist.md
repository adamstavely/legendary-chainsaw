<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Watchlist

**People & profiles** · New

The people, accounts or entities a team is watching, most at risk first – avatar, reference, case tag and a risk badge in words, with a count, filters by risk and View all

- **Element:** `<tc-watchlist>`
- **Size:** 7.4 KB gzip · 22.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/watchlist";` |
| React / Next.js | `import { Watchlist } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/watchlist";` · tags starting with tc- are custom elements |
| Angular | `import { Watchlist } from "@adamstavely/trenchcoat/angular/watchlist";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/watchlist";` |

## Example

The live example is in the gallery at `#/watchlist`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The people, accounts or entities a team is keeping an eye on, most at risk first. Each row has an avatar – a picture,
or the name's initials – the name, a reference line such as an account number, a group tag for the case or team it
belongs to, and a risk badge: Critical, Elevated, Guarded or Low, renamable, always in words as well as colour. The
header counts what's shown and can carry a “View all” action. Filter buttons, when turned on, narrow the list by risk,
each with its count. Opening a row tells the page which one.

### When to use

- A short list of accounts, customers or merchants under review, on a dashboard or beside a case.
- Showing who needs attention first, sorted by how much risk each carries.
- A side panel that leads into a full record when a row is opened.

### When not to use

- Live events as they happen – use [Alert Feed](alert-feed.md).
- Many columns to sort, filter and edit – use [Data Table](data-table.md).
- Messages for the person using the app – use [Notifications](notifications.md).
- Work handed to agents – use [Agent Inbox](agent-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-wls__count` – how many rows the current filter holds, beside the heading
2. **View all** `.ui-wls__all` – the header's action, for the full list
3. **Filters** `.ui-wls__filters` – All and each risk with rows, with counts
4. **Row** `.ui-wls__row` – one person, account or entity; opens on Enter or a click
5. **Avatar** `.ui-wls__avatar` – a picture or initials: round for a person, square for an account
6. **Reference** `.ui-wls__ref` – an id or number in mono
7. **Group** `.ui-wls__group` – the case, team or list it belongs to
8. **Risk** `.ui-wls__risk` – the risk in words, in its status colours

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The rows, badges and filters are the same in both.

## Usage

### HTML

```html
<tc-watchlist id="watch" heading="Watchlist" filters></tc-watchlist>

<script type="module">
  import "@adamstavely/trenchcoat/watchlist";
  import "@adamstavely/trenchcoat/tokens.css";

  const watch = document.querySelector("#watch");
  watch.items = [
    { id: "m-4471", name: "Northwind Traders", ref: "MER-4471-K", group: "Case 22-1187", risk: "critical", shape: "square" },
    { id: "c-2210", name: "Ravi Menon", ref: "CUS-2210-V", group: "Chargebacks", risk: "elevated" },
  ];
  watch.addEventListener("tc-open", (e) => console.log(e.detail.id));
  watch.addEventListener("tc-action", () => console.log("view all"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Watchlist, type WatchFilter, type WatchItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: WatchItem[] = [
  { id: "m-4471", name: "Northwind Traders", ref: "MER-4471-K", group: "Case 22-1187", risk: "critical", shape: "square" },
  { id: "c-2210", name: "Ravi Menon", ref: "CUS-2210-V", group: "Chargebacks", risk: "elevated" },
];

export function Watched() {
  const [filter, setFilter] = useState<WatchFilter>("all");
  return <Watchlist title="Watchlist" items={items} filters filter={filter} onFilterChange={setFilter} onOpen={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/watchlist";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";

defineProps<{ items: TcWatchlist["items"]; riskLabels: TcWatchlist["riskLabels"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-watchlist :items="items" :riskLabels="riskLabels" @tc-open="onOpen"></tc-watchlist>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Watchlist } from "@adamstavely/trenchcoat/angular/watchlist";
import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";

@Component({
  selector: "app-watchlist-example",
  imports: [Watchlist],
  template: `<tc-watchlist [items]="items()" [riskLabels]="riskLabels()" (tc-open)="onOpen($event)"></tc-watchlist>`,
})
export class WatchlistExample {
  readonly items = input.required<TcWatchlist["items"]>();
  readonly riskLabels = input.required<TcWatchlist["riskLabels"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/watchlist";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";

  let { items, riskLabels }: { items: TcWatchlist["items"]; riskLabels: TcWatchlist["riskLabels"] } = $props();
  let el: TcWatchlist;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-watchlist bind:this={el} {items} {riskLabels}></tc-watchlist>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Watchlist"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `WatchItem[]` | `[]` | What's watched |
| `sort` | `sort` | `"risk" \| "name" \| "none"` | `"risk"` | "risk": most at risk first, then by name (default) · "name": by name · "none": as given |
| `limit` | `limit` | `number \| undefined` | `undefined` | Shows only the first this many rows; all when unset |
| `filters` | `filters` | `boolean` | `false` | Shows the filter buttons: All and each risk that has rows, with counts |
| `filter` | `filter` | `WatchFilter` | `"all"` | The risk shown. Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `viewAll` | `view-all` | `string` | `"View all"` | The View all action's text in the header; empty for none |
| `riskLabels` | – | `Partial<Record<WatchRisk, string>>` | `{}` | The risks' names, merged over the defaults (Critical, Elevated, Guarded, Low) |
| `empty` | `empty` | `string` | `"Nothing on the watchlist."` | Shown when there's nothing to watch |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A row was opened with Enter or a click ({ id, item }: WatchOpen) |
| `tc-filter-change` | – | Yes | A risk filter was chosen ({ filter }: WatchFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-action` | – | No | The View all action was used ({ action: "view-all" }: WatchAction) |

#### Design tokens it reads (64)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultWatchRiskLabels: Record<WatchRisk, string>` | The risks' names used when the page gives none |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-watchlist :items="…">` | `<tc-watchlist [items]="…">` | `<tc-watchlist {items}>` |
| `riskLabels` | `el.riskLabels = …;` | `<… riskLabels={…} />` | `<tc-watchlist :riskLabels="…">` | `<tc-watchlist [riskLabels]="…">` | `<tc-watchlist {riskLabels}>` |

*Also attributes: `heading`, `description`, `sort`, `limit`, `filters`, `filter`, `view-all`, `empty` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onViewAll={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-watchlist id="watchlist"></tc-watchlist>

<script type="module">
  import "@adamstavely/trenchcoat/watchlist";

  const el = document.querySelector("#watchlist");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
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
import "@adamstavely/trenchcoat/watchlist";
import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";

const props = defineProps<{ initial: TcWatchlist["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcWatchlist["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-watchlist :filter="filter" @tc-filter-change="onFilterChange"></tc-watchlist>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Watchlist } from "@adamstavely/trenchcoat/angular/watchlist";
import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";

@Component({
  selector: "app-controlled-watchlist",
  imports: [Watchlist],
  template: `<tc-watchlist [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-watchlist>`,
})
export class ControlledWatchlist {
  readonly initial = input.required<TcWatchlist["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcWatchlist["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/watchlist";
  import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";

  let { initial }: { initial: TcWatchlist["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcWatchlist;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcWatchlist["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-watchlist bind:this={el} {filter}></tc-watchlist>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-watchlist")` returns a `TcWatchlist` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";`
- **React / Next.js:** Props: `import type { WatchlistProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Watchlist>`. The element class, for refs: `import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWatchlist["items"]` with `import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";`
- **Angular:** The directive types the template: `[items]` takes `TcWatchlist["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWatchlist } from "@adamstavely/trenchcoat/watchlist";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `filter` | `WatchFilter` | The risk shown – controlled when given |
| `defaultFilter` | `WatchFilter` | The risk shown on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: WatchFilter) => void` | A risk filter was chosen |
| `onOpen` | `(id: string, item: WatchItem) => void` | A row was opened with Enter or a click |
| `onViewAll` | `() => void` | The View all action was used |

*Renamed or hidden on the wrapper: `heading`, `filter`, `children`*

## Accessibility

### Keyboard

The rows are one tab stop; inside it the arrows move between rows.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row: fires `tc-open` |
| Tab | Leaves the list; the filters and View all come before it |

### Screen readers

The list is named by the heading and its count, “Watchlist, 7”. Each row is a button that reads its name, reference,
group and risk, “Northwind Traders MER-4471-K Case 22-1187 Risk: Critical”; the avatar is hidden. The filters are a
group labelled “Filter by risk”, each a toggle button that's pressed while its risk is shown, reading its name and
count, “Critical 2”.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.7 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.6 KB** | **7.4 KB** |
| With Lit – the first component on a page | 44.4 KB | 14.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 117 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.5 ms | items: first render, 1,326 nodes; update 1.1 ms |
| 1,000 items | 60 ms | items: first render, 13,026 nodes; update 6.5 ms |

1,000 items of items: 60 ms. It renders every item, so a first render passes 50 ms (a long task) at about 830 items – page or filter longer lists.

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

- Use the name people know: the account's trading name, the customer's full name.
- Put the reference people search by in `ref`: “MER-4471-K”, “CUS-0098-S”.
- Keep `group` to a few words: the case number, the team, the queue.
- Rename the risks with `riskLabels` to match your own scale, and keep them in that order: most to least at risk.

## Do and don't

### Do

- Use `limit` on a dashboard, with View all leading to the full list.
- Turn on `filters` when the list is long enough that people look for one risk at a time.
- Use `shape: "square"` for accounts and organisations, so they don't read as people.

### Don't

- Don't show the risk by colour alone elsewhere on the page – match the badge's words.
- Don't put actions in the rows; open the record and act there.
- Don't keep someone on the list without a reason the team can see in their record.

## Related

- [Alert Feed](alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Notifications](notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo

## Changelog

- **`tc-watchlist`:** what a team is watching, most at risk first. - **Each row:** avatar, reference, case tag, and a risk badge in words. - **List:** filters by risk, a count and View all.
