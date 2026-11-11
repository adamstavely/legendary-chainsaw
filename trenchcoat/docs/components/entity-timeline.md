<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Entity Timeline

**People & profiles** · New

What happened to a person, account or case, in order – events under month headers, each with a category, its source and Admiralty grade tinted by confidence, an optional flag and a detail that opens in place, filtered by category chips with counts

- **Element:** `<tc-entity-timeline>`
- **Size:** 12.1 KB gzip · 44.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/entity-timeline";` |
| React / Next.js | `import { EntityTimeline } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/entity-timeline";` · tags starting with tc- are custom elements |
| Angular | `import { EntityTimeline } from "@adamstavely/trenchcoat/angular/entity-timeline";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/entity-timeline";` |

## Example

The live example is in the gallery at `#/entity-timeline`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What happened to a person, an account or a case, in order. Each event has its date, a title and one quiet line of
detail, a category tag, and where it came from with a reliability grade – "Payments engine · A1" – tinted by how far
to trust it, as in the fact sheet. A flag such as "Auto-flag" marks events a rule picked out. Events sit under month
headers, newest first by default. Category chips with counts filter the list, and opening an event shows its longer
note and attachments in place.

### When to use

- A case file or review: what happened to an account, a customer or a supplier, and where each fact came from.
- An audit trail where the source of each event matters as much as the event.
- Any record a reviewer reads in order and filters by kind.

### When not to use

- Facts about something, not events – use [Fact Sheet](fact-sheet.md).
- Trips with routes and documents – use [Travel Itinerary](travel-itinerary.md).
- Versions of one document or setting – use [Version History](version-history.md).
- Places rather than events – use [Place List](place-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filters** `.ui-etl__filters` – All, then each category in use with its count
2. **Month** `.ui-etl__month` – the month and year the events under it fall in
3. **Event** `.ui-etl__event` – a dot on the rail, the date, the title and its tags
4. **Category** `.ui-etl__cat` – the event's kind, in its tone
5. **Source** `.ui-etl__src` – where it came from and its grade, tinted and barred by confidence
6. **Flag** `.ui-etl__flag` – a short marker such as "Auto-flag"
7. **Detail** `.ui-etl__more` – the opened event's note and attachments

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight titles. Clean is one
white card with the header as its first row and quieter titles. The rail, tags and detail are the same in both.

## Usage

### HTML

```html
<tc-entity-timeline id="tl" heading="Account timeline"></tc-entity-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/entity-timeline";
  import "@adamstavely/trenchcoat/tokens.css";

  const tl = document.querySelector("#tl");
  tl.categories = [{ id: "payment", label: "Payment", tone: "warning" }, { id: "account", label: "Account", tone: "info" }];
  tl.events = [
    { id: "e1", date: Date.parse("2026-06-04T12:00"), title: "Payment of €48,000 held", category: "payment", source: { label: "Payments engine", grade: "A1" } },
    { id: "e2", date: Date.parse("2026-02-02T12:00"), title: "Account opened", category: "account", source: { label: "Core banking", grade: "A1" } },
  ];
  tl.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EntityTimeline, type TimelineCategory, type TimelineEvent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const categories: TimelineCategory[] = [{ id: "payment", label: "Payment", tone: "warning" }];
const events: TimelineEvent[] = [
  { id: "e1", date: Date.parse("2026-06-04T12:00"), title: "Payment of €48,000 held", category: "payment", source: { label: "Payments engine", grade: "A1" } },
];

export function AccountTimeline() {
  const [open, setOpen] = useState<string | null>(null);
  return <EntityTimeline title="Account timeline" events={events} categories={categories} selected={open} onSelectedChange={setOpen} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/entity-timeline";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";

defineProps<{ events: TcEntityTimeline["events"]; categories: TcEntityTimeline["categories"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-entity-timeline :events="events" :categories="categories" @tc-filter-change="onFilterChange"></tc-entity-timeline>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EntityTimeline } from "@adamstavely/trenchcoat/angular/entity-timeline";
import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";

@Component({
  selector: "app-entity-timeline-example",
  imports: [EntityTimeline],
  template: `<tc-entity-timeline [events]="events()" [categories]="categories()" (tc-filter-change)="onFilterChange($event)"></tc-entity-timeline>`,
})
export class EntityTimelineExample {
  readonly events = input.required<TcEntityTimeline["events"]>();
  readonly categories = input.required<TcEntityTimeline["categories"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/entity-timeline";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";

  let { events, categories }: { events: TcEntityTimeline["events"]; categories: TcEntityTimeline["categories"] } = $props();
  let el: TcEntityTimeline;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-entity-timeline bind:this={el} {events} {categories}></tc-entity-timeline>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Timeline"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `events` | – | `TimelineEvent[]` | `[]` | The events, in any order – the element sorts them |
| `categories` | – | `TimelineCategory[]` | `[]` | The categories events can have, in the order their chips show |
| `order` | `order` | `"newest" \| "oldest"` | `"newest"` | "newest" first (the default) or "oldest" first |
| `filter` | `filter` | `string` | `"all"` | The category shown, or "all". Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `selected` | – | `string \| null` | `null` | The event whose detail is open. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | A category chip was picked ({ filter }: TimelineFilterChange; "all" for every category); cancelable – prevented, `filter` stays as it was |
| `tc-selected-change` | – | Yes | An event's detail opened or closed ({ selected, event }: TimelineSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-etl-tone` | `var(--tc-icon-muted)` | not set – this fallback applies |

#### Design tokens it reads (76)

`--tc-accent-text`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-etl-tone-bg`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `events` | `el.events = …;` | `<… events={…} />` | `<tc-entity-timeline :events="…">` | `<tc-entity-timeline [events]="…">` | `<tc-entity-timeline {events}>` |
| `categories` | `el.categories = …;` | `<… categories={…} />` | `<tc-entity-timeline :categories="…">` | `<tc-entity-timeline [categories]="…">` | `<tc-entity-timeline {categories}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-entity-timeline :selected="…">` | `<tc-entity-timeline [selected]="…">` | `<tc-entity-timeline {selected}>` |

*Also attributes: `heading`, `description`, `order`, `filter`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter` and `selected` itself unless a listener calls `preventDefault()` on `tc-filter-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-entity-timeline id="entity-timeline"></tc-entity-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/entity-timeline";

  const el = document.querySelector("#entity-timeline");
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
import "@adamstavely/trenchcoat/entity-timeline";
import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";

const props = defineProps<{ initial: TcEntityTimeline["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcEntityTimeline["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-entity-timeline :filter="filter" @tc-filter-change="onFilterChange"></tc-entity-timeline>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EntityTimeline } from "@adamstavely/trenchcoat/angular/entity-timeline";
import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";

@Component({
  selector: "app-controlled-entity-timeline",
  imports: [EntityTimeline],
  template: `<tc-entity-timeline [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-entity-timeline>`,
})
export class ControlledEntityTimeline {
  readonly initial = input.required<TcEntityTimeline["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcEntityTimeline["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/entity-timeline";
  import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";

  let { initial }: { initial: TcEntityTimeline["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcEntityTimeline;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcEntityTimeline["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-entity-timeline bind:this={el} {filter}></tc-entity-timeline>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-entity-timeline")` returns a `TcEntityTimeline` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";`
- **React / Next.js:** Props: `import type { EntityTimelineProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EntityTimeline>`. The element class, for refs: `import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEntityTimeline["events"]` with `import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";`
- **Angular:** The directive types the template: `[events]` takes `TcEntityTimeline["events"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEntityTimeline } from "@adamstavely/trenchcoat/entity-timeline";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `filter` | `string` | The category shown, or "all" – controlled when given |
| `defaultFilter` | `string` | The category shown on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: string) => void` | A category chip was picked |
| `selected` | `string \| null` | The event whose detail is open – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The event open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, event?: TimelineEvent) => void` | An event's detail opened or closed; `event` is the opened event |

*Renamed or hidden on the wrapper: `heading`, `filter`, `selected`, `children`*

## Accessibility

### Keyboard

The events are one tab stop; the filter chips are ordinary buttons before them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next event |
| Home / End | Moves to the first or last event |
| Enter / Space | Opens the event's detail, or closes it |
| Escape | Closes the open detail |
| Tab | Moves on to the open detail's links, then out |

### Screen readers

The filters are a group named "Filter by category", each chip a toggle button (`aria-pressed`) reading its label and
count. Events sit in an ordered list under each month heading; each event's button reads its title and full date,
“Payee details changed from a new device, 9 June 2026”, and is `aria-expanded` when it has a detail. The source tag
reads “Source: Payments engine, grade A1 (completely reliable source, confirmed). High confidence.” Filtering is
confirmed in a polite status message, “2 events, Payment”.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, fact-sheet | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, fact-sheet, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, fact-sheet, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, fact-sheet, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.2 KB | 6.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [fact-sheet](fact-sheet.md) · Element it renders | 16.1 KB | – |
| **Added to a page that already has Lit** | **44.6 KB** | **12.1 KB** |
| With Lit – the first component on a page | 66.2 KB | 19.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | the gallery demo's data, 179 DOM nodes – to layout, median of 7 |
| Typical update | **1.3 ms** | one item of events replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | events: first render, 2,140 nodes; update 5.4 ms |
| 1,000 items | 149 ms | events: first render, 20,890 nodes; update 48 ms |

1,000 items of events: 149 ms. It renders every item, so a first render passes 50 ms (a long task) at about 340 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (fact-sheet).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write titles as what happened, past tense: “Payment of €48,000 held”, not “Payment hold”.
- Keep the detail to one line; put the rest in `body`.
- Name sources as people know them – “Payments engine”, “Call centre note” – and grade them on the Admiralty scale.
- Use `flag` for what a rule or a person picked out, in two words or fewer.

## Do and don't

### Do

- Give every event a source when the review depends on how far to trust it.
- Keep categories to five or fewer so the chips stay readable.
- Attach the records an event rests on, as links in its detail.

### Don't

- Don't use the category tones for severity – flags and grades already carry that.
- Don't open an event on load unless the page was opened for it.
- Don't leave out the year in a long timeline – the month headers carry it.

## Related

- [Fact Sheet](fact-sheet.md) – What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly
- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys
- [Place List](place-list.md) – The places on record – type with an icon, Confirmed / Unverified / Vacated in words, address, coordinates and when each applies, with a place picked for a map
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
