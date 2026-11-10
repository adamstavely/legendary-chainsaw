<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Org Chart

**People & profiles** · New

Who reports to whom – people's cards joined by reporting lines, branches that fold, search that opens the way to matches, a picked person's manager and reports, pan and zoom, and an outline when narrow

- **Element:** `<tc-org-chart>`
- **Size:** 11.4 KB gzip · 39.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/org-chart";` |
| React / Next.js | `import { OrgChart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/org-chart";` · tags starting with tc- are custom elements |
| Angular | `import { OrgChart } from "@adamstavely/trenchcoat/angular/org-chart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/org-chart";` |

## Example

The live example is in the gallery at `#/org-chart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who reports to whom. Cards for people – a picture or initials, the name, title and team – joined by reporting lines,
top-down. Each manager's "6 reports" button folds their branch away or opens it again, and only open branches are
drawn, so a large organisation stays light. People without a manager start trees of their own, side by side.

Search by name, title or team: matches are marked, the branches above them open, the count shows, and Enter goes to
the next one. Pick a person and a strip under the chart shows their manager, them and their reports, each a button
that moves there. The drawing scrolls inside the card – drag empty space to pan, and zoom with − / + / Fit. In a
narrow container, or with `layout="list"`, it becomes an indented outline.

### When to use

- Showing a team, a department or a whole organisation's reporting lines.
- Helping people find who someone works for, or who works for them.

### When not to use

- One unit's summary with its head and numbers – use [Org Unit Card](org-unit-card.md).
- A person's own page – use [Profile Header](profile-header.md).
- Agents starting sub-agents – use [Agent Tree](agent-tree.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-org__search` – find a person, title or team, with the match count
2. **Zoom** `.ui-org__zoom` – zoom out, the scale, zoom in, Fit
3. **Card** `.ui-org__card` – picture or initials, name, title, team, and away or vacant
4. **Reports** `.ui-org__fold` – how many report to them; folds or opens the branch
5. **Lines** `.ui-org__group` – from a manager to a bar over their reports
6. **Strip** `.ui-org__strip` – the picked person's manager, them, and their reports

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
People's cards are raised; a vacant role is a dashed outline with a plus where the picture would be; the picked person
is tinted; search matches get an amber ring. A page can set `--tc-org-card-w` (196px), `--tc-org-gap` (the space a
reporting line crosses), `--tc-org-line` (its colour) and `--tc-org-view-h` (how tall the drawing grows before it
scrolls).

## Usage

### HTML

```html
<tc-org-chart heading="Research"></tc-org-chart>
<script type="module">
  const chart = document.querySelector("tc-org-chart");
  chart.people = [
    { id: "res", name: "Tomás Reyes", title: "Head of Research" },
    { id: "r1", name: "Hana Sato", title: "Principal scientist", manager: "res" },
    { id: "r2", name: "Open role", title: "Postdoctoral fellow", manager: "r1", status: "vacant" },
  ];
  chart.addEventListener("tc-selected-change", (e) => console.log("picked", e.detail.person?.name));
</script>
```

### React / Next.js

```tsx
import { OrgChart, type OrgChartPerson } from "@adamstavely/trenchcoat/react";

export function Team({ people }: { people: OrgChartPerson[] }) {
  return <OrgChart title="Research" people={people} defaultSelected="r1" onSelectedChange={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/org-chart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";

defineProps<{ people: TcOrgChart["people"]; expanded: TcOrgChart["expanded"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-org-chart :people="people" :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-org-chart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { OrgChart } from "@adamstavely/trenchcoat/angular/org-chart";
import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";

@Component({
  selector: "app-org-chart-example",
  imports: [OrgChart],
  template: `<tc-org-chart [people]="people()" [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-org-chart>`,
})
export class OrgChartExample {
  readonly people = input.required<TcOrgChart["people"]>();
  readonly expanded = input.required<TcOrgChart["expanded"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/org-chart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";

  let { people, expanded }: { people: TcOrgChart["people"]; expanded: TcOrgChart["expanded"] } = $props();
  let el: TcOrgChart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-org-chart bind:this={el} {people} {expanded}></tc-org-chart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Organisation"` | The heading, and the chart's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `people` | – | `OrgChartPerson[]` | `[]` | Everyone, in the order their manager lists them; `manager` joins them up |
| `expanded` | – | `string[] \| null` | `null` | The people whose reports are shown; null shows the top of each tree and one level under it. Changed by the user unless tc-expanded-change is prevented |
| `selected` | `selected` | `string \| null` | `null` | The person picked. Changed by the user unless tc-selected-change is prevented |
| `filter` | `filter` | `string` | `""` | What the search box holds. Changed by the user unless tc-filter-change is prevented |
| `layout` | `layout` | `OrgChartLayout` | `"auto"` | "tree" draws cards top-down, "list" an indented outline; "auto" is the tree, the outline when narrow |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | A branch was opened or folded ({ expanded, id, open }: OrgChartExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-selected-change` | – | Yes | A person was picked ({ selected, person }: OrgChartSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-filter-change` | – | Yes | The search changed ({ filter }: OrgChartFilterChange); cancelable – prevented, `filter` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-org-card-w` | `196px` | clean |
| `--tc-org-gap` | `var(--tc-space-6)` | clean |
| `--tc-org-line` | `var(--tc-border-strong)` | clean |
| `--tc-org-view-h` | `460px` | clean |

#### Design tokens it reads (82)

`--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-8`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-org-chart :people="…">` | `<tc-org-chart [people]="…">` | `<tc-org-chart {people}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-org-chart :expanded="…">` | `<tc-org-chart [expanded]="…">` | `<tc-org-chart {expanded}>` |

*Also attributes: `heading`, `description`, `selected`, `filter`, `layout` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `expanded`, `selected` and `filter` itself unless a listener calls `preventDefault()` on `tc-expanded-change`, `tc-selected-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-org-chart id="org-chart"></tc-org-chart>

<script type="module">
  import "@adamstavely/trenchcoat/org-chart";

  const el = document.querySelector("#org-chart");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
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
import "@adamstavely/trenchcoat/org-chart";
import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";

const props = defineProps<{ initial: TcOrgChart["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcOrgChart["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-org-chart :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-org-chart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { OrgChart } from "@adamstavely/trenchcoat/angular/org-chart";
import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";

@Component({
  selector: "app-controlled-org-chart",
  imports: [OrgChart],
  template: `<tc-org-chart [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-org-chart>`,
})
export class ControlledOrgChart {
  readonly initial = input.required<TcOrgChart["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcOrgChart["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/org-chart";
  import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";

  let { initial }: { initial: TcOrgChart["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcOrgChart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcOrgChart["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-org-chart bind:this={el} {expanded}></tc-org-chart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-org-chart")` returns a `TcOrgChart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";`
- **React / Next.js:** Props: `import type { OrgChartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof OrgChart>`. The element class, for refs: `import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcOrgChart["people"]` with `import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";`
- **Angular:** The directive types the template: `[people]` takes `TcOrgChart["people"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcOrgChart } from "@adamstavely/trenchcoat/org-chart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the chart's name |
| `expanded` | `string[] \| null` | The people whose reports are shown – controlled when given; null shows the top of each tree and one level |
| `defaultExpanded` | `string[] \| null` | `expanded` on mount when it isn't controlled |
| `onExpandedChange` | `(next: string[], change: { id: string; open: boolean }) => void` | A branch was opened or folded; `next` is the list as it will be |
| `selected` | `string \| null` | The person picked – controlled when given |
| `defaultSelected` | `string \| null` | The person picked on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, person: OrgChartPerson \| null) => void` | A person was picked |
| `filter` | `string` | The search – controlled when given |
| `defaultFilter` | `string` | The search on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: string) => void` | The search changed |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `selected`, `filter`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

| Key | Does |
| --- | --- |
| ↓ / ↑ | Next / previous person shown |
| → | Opens a folded branch, or moves to the first report |
| ← | Folds an open branch, or moves to the manager |
| Home / End | First / last person shown |
| * | Opens every sibling's branch |
| Enter or Space | Picks the person |
| Enter / Shift + Enter in the search | Next / previous match |
| Escape in the search | Clears it |

### Screen readers

- The chart is a `tree` named by the heading. Each person is a `treeitem` with their level, place among siblings,
  open or folded state and whether they're picked. Each is named by name and title, plus "vacant" or "away".
- One person is in the tab order at a time; the reports buttons are for the pointer, as → and ← do the same.
- The search's count is the field's description. Opening, folding, picking, matches and zoom are announced in a
  polite status line.
- The strip is a group named after the picked person, and its people are buttons.

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
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 31.3 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **39.1 KB** | **11.4 KB** |
| With Lit – the first component on a page | 59.8 KB | 18.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 126 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of people replaced |
| First on the page | 9.6 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.1 ms | people: first render, 267 nodes; update 0.2 ms |
| 1,000 items | 8.3 ms | people: first render, 1,451 nodes; update 1.4 ms |

1,000 items of people: 8.3 ms, 1,451 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- List people in the order their manager would; reports are drawn in that order.
- Keep titles short ("Head of Data", not "Head of the Data and Analytics Function").
- Name vacant roles for the role ("Postdoctoral fellow"), with `status: "vacant"`.

## Do and don't

### Do

- Open the branches people came for with `expanded`, and pick the person with `selected`, when you link to the chart
  from someone's profile.
- Let the outline take over on phones – it reads better than a pinched tree.

### Don't

- Put the whole company open at once – start folded and let search open the way.
- Use colour alone for status – away and vacant also say so in words.

## Related

- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Org Unit Card](org-unit-card.md) – An organisational unit at a glance – code, name, lead, On track / Watch / At risk counts, the page's stats with a spent-of-budget bar, and teams that fold open onto their topics' priority, coverage, open gaps and momentum
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line

## Changelog

- **People & profiles** - **Org Chart** (`tc-org-chart`) – reporting lines that fold, search that opens the way, pan and zoom, an outline when narrow. - **Person Hovercard** (`tc-person-hovercard`) – the profile card behind any name, with status and local time. - **Team Roster** (`tc-team-roster`) – a directory with everyone's local time and the team's best hour to meet. - **Relationship Graph** (`tc-relationship-graph`) – people and organisations around one of them, re-centring on click, with a keyboard list of every connection.
