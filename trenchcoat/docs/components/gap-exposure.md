<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Gap Exposure

**Research & portfolio** · New

Gaps or risks and whether anyone is working on them – severity in words and a mark, the item and its priority, coverage, owner and what's invested, with the severe uncovered ones called out, grouping by priority or severity and an uncovered-only switch

- **Element:** `<tc-gap-exposure>`
- **Size:** 9.1 KB gzip · 31.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/gap-exposure";` |
| React / Next.js | `import { GapExposure } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/gap-exposure";` · tags starting with tc- are custom elements |
| Angular | `import { GapExposure } from "@adamstavely/trenchcoat/angular/gap-exposure";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/gap-exposure";` |

## Example

The live example is in the gallery at `#/gap-exposure`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The gaps or risks across a portfolio, and whether anyone is working on them. Each row has a severity – Critical,
High, Medium or Low, with a mark and a word as well as a colour – what's missing, the item it belongs to with that
item's priority, its coverage ("No work" or "2 in work"), the owner's initials and what's been invested so far ("$900K
· 1.2 FTE invested"). The header counts what's open, what's uncovered and the exposure: the severe gaps with nothing
in work, which also get a panel of their own at the top so they can't be missed. The list groups by the item's
priority or by severity, and can show only the uncovered gaps.

### When to use

- A portfolio review: which gaps are open, which have work against them and where the money and people go.
- Finding the severe gaps nobody owns yet, before they turn into a problem.
- A risk register where each risk belongs to a project and coverage is the question.

### When not to use

- The items themselves, ranked by priority – use [Priority List](priority-list.md).
- One share of coverage across everything – use [Coverage Ring](coverage-ring.md).
- Which checks cover which parts, as a grid – use [Coverage Matrix](coverage-matrix.md).
- Many columns to sort, filter and edit – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stats** `.ui-gexp__stats` – open, uncovered and exposure counts
2. **Exposure** `.ui-gexp__exposure` – the severe gaps with nothing in work, each opening the gap
3. **Group by** `.ui-gexp__seg` – priority or severity
4. **Uncovered only** `.ui-gexp__toggle` – a switch that hides gaps with work on them
5. **Group header** `.ui-gexp__group-head` – the tier or severity, its count and how many are uncovered
6. **Row** `.ui-gexp__row` – one gap; opens on Enter or a click
7. **Severity** `.ui-gexp__sev` – a mark and a word in its status colour
8. **Coverage** `.ui-gexp__cov` – “No work”, outlined in the warning colour, or how much is in work
9. **Owner** `.ui-gexp__owner` – the owner's initials
10. **Invested** `.ui-gexp__money` – money and people put in so far

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The rows, panel and controls are the same in both. As the element narrows, the investment
column goes first, then each row stacks: severity and coverage on top, the gap below.

## Usage

### HTML

```html
<tc-gap-exposure id="gaps" heading="Gaps & coverage"></tc-gap-exposure>

<script type="module">
  import "@adamstavely/trenchcoat/gap-exposure";
  import "@adamstavely/trenchcoat/tokens.css";

  const gaps = document.querySelector("#gaps");
  gaps.gaps = [
    { id: "g1", text: "No coupled flood–grid failure dataset exists.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 0, owner: "Arjun Mehta" },
    { id: "g2", text: "Cascading-failure model is uncalibrated.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 1, owner: "Arjun Mehta", budget: 700000, fte: 0.8 },
  ];
  gaps.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { GapExposure, type ExposureGap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const gaps: ExposureGap[] = [
  { id: "g1", text: "No coupled flood–grid failure dataset exists.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 0, owner: "Arjun Mehta" },
  { id: "g2", text: "Cascading-failure model is uncalibrated.", severity: "critical", item: "Climate Resilience Modeling", priority: 2, work: 1, owner: "Arjun Mehta", budget: 700000, fte: 0.8 },
];

export function Gaps() {
  return <GapExposure title="Gaps & coverage" gaps={gaps} defaultGroupBy="severity" onOpen={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/gap-exposure";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";

defineProps<{ gaps: TcGapExposure["gaps"]; exposureSeverities: TcGapExposure["exposureSeverities"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-gap-exposure :gaps="gaps" :exposureSeverities="exposureSeverities" @tc-open="onOpen"></tc-gap-exposure>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GapExposure } from "@adamstavely/trenchcoat/angular/gap-exposure";
import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";

@Component({
  selector: "app-gap-exposure-example",
  imports: [GapExposure],
  template: `<tc-gap-exposure [gaps]="gaps()" [exposureSeverities]="exposureSeverities()" (tc-open)="onOpen($event)"></tc-gap-exposure>`,
})
export class GapExposureExample {
  readonly gaps = input.required<TcGapExposure["gaps"]>();
  readonly exposureSeverities = input.required<TcGapExposure["exposureSeverities"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gap-exposure";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";

  let { gaps, exposureSeverities }: { gaps: TcGapExposure["gaps"]; exposureSeverities: TcGapExposure["exposureSeverities"] } = $props();
  let el: TcGapExposure;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-gap-exposure bind:this={el} {gaps} {exposureSeverities}></tc-gap-exposure>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Gaps & coverage"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `gaps` | – | `ExposureGap[]` | `[]` | The gaps, in the order to show them within a group |
| `groupBy` | `group-by` | `GapGroupBy` | `"priority"` | Groups the list by the item's priority or by severity. Changed by the user unless a tc-group-change listener calls preventDefault() |
| `uncoveredOnly` | `uncovered-only` | `boolean` | `false` | Shows only gaps with no work on them. Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `exposureSeverities` | – | `GapSeverity[]` | `["critical", "high"]` | The severities that count as exposure when nothing is in work |
| `severityLabels` | – | `Partial<Record<GapSeverity, string>>` | `{}` | The severities' names, merged over the defaults (Critical, High, Medium, Low) |
| `tiers` | – | `Record<number, string>` | `{}` | The priority tiers' names by number, merged over the defaults (Top priority, High, Medium, Watching) |
| `currency` | `currency` | `string` | `"USD"` | The currency of `budget`, as an ISO code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and money, e.g. "de"; by default the browser's |
| `empty` | `empty` | `string` | `"No gaps to show."` | Shown when nothing matches |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A gap was opened with Enter or a click ({ id, gap }: GapOpen) |
| `tc-group-change` | – | Yes | Grouping by priority or severity was chosen ({ groupBy }: GapGroupChange); cancelable – prevented, `group-by` stays as it was |
| `tc-filter-change` | – | Yes | "Uncovered only" was turned on or off ({ uncoveredOnly }: GapFilterChange); cancelable – prevented, `uncovered-only` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-gexp-cols` | `minmax(0, 1fr) auto` | both |

#### Design tokens it reads (83)

`--tc-avatar-font-weight`, `--tc-avatar-sm`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultGapSeverityLabels: Record<GapSeverity, string>` | The severities' names used when the page gives none |
| `defaultGapTiers: Record<number, string>` | The priority tiers' names used when the page gives none |

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
| `gaps` | `el.gaps = …;` | `<… gaps={…} />` | `<tc-gap-exposure :gaps="…">` | `<tc-gap-exposure [gaps]="…">` | `<tc-gap-exposure {gaps}>` |
| `exposureSeverities` | `el.exposureSeverities = …;` | `<… exposureSeverities={…} />` | `<tc-gap-exposure :exposureSeverities="…">` | `<tc-gap-exposure [exposureSeverities]="…">` | `<tc-gap-exposure {exposureSeverities}>` |
| `severityLabels` | `el.severityLabels = …;` | `<… severityLabels={…} />` | `<tc-gap-exposure :severityLabels="…">` | `<tc-gap-exposure [severityLabels]="…">` | `<tc-gap-exposure {severityLabels}>` |
| `tiers` | `el.tiers = …;` | `<… tiers={…} />` | `<tc-gap-exposure :tiers="…">` | `<tc-gap-exposure [tiers]="…">` | `<tc-gap-exposure {tiers}>` |

*Also attributes: `heading`, `description`, `group-by`, `uncovered-only`, `currency`, `locale`, `empty` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-group-change` | Yes | `el.addEventListener("tc-group-change", (e) => …)` | `ref.current.addEventListener("tc-group-change", …)` | `@tc-group-change="…"` | `(tc-group-change)="…($event)"` | `el.addEventListener("tc-group-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `groupBy` and `uncoveredOnly` itself unless a listener calls `preventDefault()` on `tc-group-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-gap-exposure id="gap-exposure"></tc-gap-exposure>

<script type="module">
  import "@adamstavely/trenchcoat/gap-exposure";

  const el = document.querySelector("#gap-exposure");
  el.addEventListener("tc-group-change", (e) => {
    e.preventDefault(); // the element keeps its groupBy…
    if (allowed(e.detail.groupBy)) el.groupBy = e.detail.groupBy; // …until the app sets it
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
import "@adamstavely/trenchcoat/gap-exposure";
import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";

const props = defineProps<{ initial: TcGapExposure["groupBy"] }>();
const groupBy = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onGroupChange = (e: CustomEvent<{ groupBy: TcGapExposure["groupBy"] }>) => {
  e.preventDefault();
  groupBy.value = e.detail.groupBy;
};
</script>

<template>
  <tc-gap-exposure :groupBy="groupBy" @tc-group-change="onGroupChange"></tc-gap-exposure>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { GapExposure } from "@adamstavely/trenchcoat/angular/gap-exposure";
import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";

@Component({
  selector: "app-controlled-gap-exposure",
  imports: [GapExposure],
  template: `<tc-gap-exposure [groupBy]="groupBy()" (tc-group-change)="onGroupChange($event)"></tc-gap-exposure>`,
})
export class ControlledGapExposure {
  readonly initial = input.required<TcGapExposure["groupBy"]>();
  readonly groupBy = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onGroupChange(e: CustomEvent<{ groupBy: TcGapExposure["groupBy"] }>) {
    e.preventDefault();
    this.groupBy.set(e.detail.groupBy);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gap-exposure";
  import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";

  let { initial }: { initial: TcGapExposure["groupBy"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let groupBy = $derived(initial);
  let el: TcGapExposure;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      groupBy = (e as CustomEvent<{ groupBy: TcGapExposure["groupBy"] }>).detail.groupBy;
    };
    el.addEventListener("tc-group-change", on);
    return () => el.removeEventListener("tc-group-change", on);
  });
</script>

<tc-gap-exposure bind:this={el} {groupBy}></tc-gap-exposure>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-gap-exposure")` returns a `TcGapExposure` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";`
- **React / Next.js:** Props: `import type { GapExposureProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GapExposure>`. The element class, for refs: `import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGapExposure["gaps"]` with `import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";`
- **Angular:** The directive types the template: `[gaps]` takes `TcGapExposure["gaps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGapExposure } from "@adamstavely/trenchcoat/gap-exposure";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `groupBy` | `GapGroupBy` | Groups by the item's priority or by severity – controlled when given |
| `defaultGroupBy` | `GapGroupBy` | The grouping on mount when `groupBy` isn't controlled |
| `onGroupByChange` | `(groupBy: GapGroupBy) => void` | Grouping was changed |
| `uncoveredOnly` | `boolean` | Shows only uncovered gaps – controlled when given |
| `defaultUncoveredOnly` | `boolean` | The filter on mount when `uncoveredOnly` isn't controlled |
| `onUncoveredOnlyChange` | `(uncoveredOnly: boolean) => void` | "Uncovered only" was turned on or off |
| `onOpen` | `(id: string, gap: ExposureGap) => void` | A gap was opened with Enter or a click |

*Renamed or hidden on the wrapper: `heading`, `groupBy`, `uncoveredOnly`, `children`*

## Accessibility

### Keyboard

The exposure panel and the list are each one tab stop; the controls sit between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next gap in the panel or the list, across groups |
| Home / End | Moves to the first or last gap |
| Enter / Space | Opens the gap: fires `tc-open`; on a control, switches it |
| Tab | Moves from the panel to the controls to the list |

### Screen readers

The stats are a description list: “Open 10, Uncovered 4, Exposure 3”. The exposure panel is a region headed
“Exposure critical / high gaps with nothing in work”. Each row is a button that reads the gap in full: “High
Memristor endurance data above 10⁸ cycles is missing. Priority 1: Neuromorphic Computing No work Owner Jonah Tran”.
The marks are hidden; the severity is read as a word. Group by is a group of two toggle buttons; Uncovered only is a
switch. Each group is a region named by its tier or severity.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.8 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.3 KB** | **9.1 KB** |
| With Lit – the first component on a page | 53.1 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.9 ms** | the gallery demo's data, 289 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of gaps replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 20 ms | gaps: first render, 2,413 nodes; update 3.2 ms |
| 1,000 items | 126 ms | gaps: first render, 23,653 nodes; update 17 ms |

1,000 items of gaps: 126 ms. It renders every item, so a first render passes 50 ms (a long task) at about 400 items – page or filter longer lists.

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

- Write the gap as what's missing, in a sentence: “No coupled flood–grid failure dataset exists.”
- Set `work` to the number of pieces of work on the gap; 0 means it's uncovered.
- Give `budget` in `currency` units and `fte` in full-time equivalents; they're written compactly.
- Set `exposureSeverities` to the severities your team won't leave uncovered.

## Do and don't

### Do

- Give every gap an owner, even an uncovered one – it says who decides what happens next.
- Start grouped by priority for planning, and by severity for a risk review.
- Pair it with `priority-list` on a portfolio page, each opening the other's item.

### Don't

- Don't use the severities for anything but how bad the gap is.
- Don't put a gap under exposure by hand; it follows from severity and work.
- Don't hide the exposure panel – it's the reason the component exists.

## Related

- [Priority List](priority-list.md) – A portfolio's topics or projects by priority – a tier badge, owner and team, health in words, momentum as a line with its change, coverage as a bar, what's open and the work in flight, with health filters and groups per priority
- [Coverage Ring](coverage-ring.md) – One share at a glance – a large ring with the percentage and a caption, a title and a line, and a bar from healthiest to needs attention that reads out each segment
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **`tc-gap-exposure`:** gaps or risks, and whether anyone is working on them. - **Exposure:** severe uncovered gaps are called out. - **Investment:** what's been invested in each. - **Grouping:** by priority or severity, with an uncovered-only switch.
