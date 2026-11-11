<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Co-Occurrence

**People & profiles** · New

Who keeps turning up alongside a subject – accounts, cards, devices or people ranked by shared events, each with a strength in words and bars, a score, the share of events, a count per source and when last seen, opening onto the shared events themselves

- **Element:** `<tc-co-occurrence>`
- **Size:** 9.6 KB gzip · 32.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/co-occurrence";` |
| React / Next.js | `import { CoOccurrence } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/co-occurrence";` · tags starting with tc- are custom elements |
| Angular | `import { CoOccurrence } from "@adamstavely/trenchcoat/angular/co-occurrence";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/co-occurrence";` |

## Example

The live example is in the gallery at `#/co-occurrence`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who keeps turning up alongside a subject. Accounts, cards, devices or people are ranked by how often they appear in
the same events as the subject – logins, payments, shipments, or whatever sources the page has – over a stated window.
Each row gives a strength in words and bars (Always together, Frequent, Occasional), a score from 0 to 100, the share
of the subject's events they were in ("82% · 14 of 17 events"), a count per source and when they were last seen
together. The header sums it up: strong correlates, shared events and the top correlate. Open a row to see the shared
events themselves, grouped by source.

### When to use

- Fraud and abuse reviews: the accounts, cards and devices that move together with one account.
- Investigating linked records in a compliance case, where repeated co-appearance is the signal.
- Any "who else is always here?" question across several event sources.

### When not to use

- The people linked to someone by a known relationship – use [Person Links](person-links.md).
- Where an output came from, step by step – use [Lineage Graph](lineage-graph.md).
- Plain rows people sort, filter and edit – use [Data Table](data-table.md).
- The exhibits behind a case – use [Evidence List](evidence-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stats** `.ui-coc__stats` – strong correlates, shared events and the top correlate
2. **Sources** `.ui-coc__legend` – the event sources the counts come from
3. **Sort** `.ui-coc__sort` – score, share or most recent
4. **Row** `.ui-coc__row` – initials, name and ID, strength, share, counts per source and the score
5. **Strength** `.ui-coc__strength` – Always together, Frequent or Occasional, in words and bars
6. **Shared events** `.ui-coc__detail` – an open row's events, grouped by source

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and a bold picked sort. Clean is one
white card with the header as its first row. The rows, strengths and shared events are the same in both.

## Usage

### HTML

```html
<tc-co-occurrence id="coc" heading="Seen together with ACC-2291" window="120-day window" events="17"></tc-co-occurrence>

<script type="module">
  import "@adamstavely/trenchcoat/co-occurrence";
  import "@adamstavely/trenchcoat/tokens.css";

  const coc = document.querySelector("#coc");
  coc.sources = [{ id: "login", label: "Logins" }, { id: "pay", label: "Payments" }];
  coc.entities = [
    { id: "dana", name: "Dana Okafor", detail: "ACC-4471-K", score: 92, together: 14, bySource: { login: 9, pay: 14 } },
    { id: "card", name: "Card ending 0092", score: 74, together: 10, bySource: { pay: 11 } },
  ];
  coc.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CoOccurrence, type CoEntity } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const entities: CoEntity[] = [
  { id: "dana", name: "Dana Okafor", detail: "ACC-4471-K", score: 92, together: 14, bySource: { login: 9, pay: 14 } },
  { id: "card", name: "Card ending 0092", score: 74, together: 10, bySource: { pay: 11 } },
];

export function SeenTogether() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <CoOccurrence
      title="Seen together with ACC-2291"
      window="120-day window"
      events={17}
      sources={[{ id: "login", label: "Logins" }, { id: "pay", label: "Payments" }]}
      entities={entities}
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/co-occurrence";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";

defineProps<{ sources: TcCoOccurrence["sources"]; entities: TcCoOccurrence["entities"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-co-occurrence :sources="sources" :entities="entities" @tc-selected-change="onSelectedChange"></tc-co-occurrence>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CoOccurrence } from "@adamstavely/trenchcoat/angular/co-occurrence";
import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";

@Component({
  selector: "app-co-occurrence-example",
  imports: [CoOccurrence],
  template: `<tc-co-occurrence [sources]="sources()" [entities]="entities()" (tc-selected-change)="onSelectedChange($event)"></tc-co-occurrence>`,
})
export class CoOccurrenceExample {
  readonly sources = input.required<TcCoOccurrence["sources"]>();
  readonly entities = input.required<TcCoOccurrence["entities"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/co-occurrence";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";

  let { sources, entities }: { sources: TcCoOccurrence["sources"]; entities: TcCoOccurrence["entities"] } = $props();
  let el: TcCoOccurrence;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-co-occurrence bind:this={el} {sources} {entities}></tc-co-occurrence>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Co-occurrence"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `window` | `window` | `string \| undefined` | `undefined` | The time window the counts cover, shown in the header, e.g. "120-day window" |
| `sources` | – | `CoSource[]` | `[]` | The data sources, in the order their counts are shown |
| `entities` | – | `CoEntity[]` | `[]` | The entities seen together with the subject |
| `events` | `events` | `number` | `0` | How many events the subject had in the window – the share's denominator |
| `eventUnit` | `event-unit` | `string` | `"events"` | What an event is called after a number: "14 of 17 events" |
| `sort` | `sort` | `CoSort` | `"score"` | The order of the rows. Changed by the user unless a tc-sort-change listener calls preventDefault() |
| `selected` | `selected` | `string \| null` | `null` | The open row's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `thresholds` | – | `{ always: number; frequent: number }` | `{ always: 0.75, frequent: 0.4 }` | The lowest shares, from 0 to 1, that count as Always together and Frequent; below Frequent is Occasional |
| `strengthLabels` | – | `Partial<Record<CoStrength, string>>` | `{}` | The strengths' names, merged over the defaults (Always together, Frequent, Occasional) |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A row was opened or closed ({ selected, entity }: CoSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-sort-change` | – | Yes | The sort was changed ({ sort }: CoSortChange); cancelable – prevented, `sort` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-coc-lead` | `32px` | both |

#### Design tokens it reads (90)

`--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCoStrengthLabels: Record<CoStrength, string>` | The strengths' names used when the page gives none |

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
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-co-occurrence :sources="…">` | `<tc-co-occurrence [sources]="…">` | `<tc-co-occurrence {sources}>` |
| `entities` | `el.entities = …;` | `<… entities={…} />` | `<tc-co-occurrence :entities="…">` | `<tc-co-occurrence [entities]="…">` | `<tc-co-occurrence {entities}>` |
| `thresholds` | `el.thresholds = …;` | `<… thresholds={…} />` | `<tc-co-occurrence :thresholds="…">` | `<tc-co-occurrence [thresholds]="…">` | `<tc-co-occurrence {thresholds}>` |
| `strengthLabels` | `el.strengthLabels = …;` | `<… strengthLabels={…} />` | `<tc-co-occurrence :strengthLabels="…">` | `<tc-co-occurrence [strengthLabels]="…">` | `<tc-co-occurrence {strengthLabels}>` |

*Also attributes: `heading`, `description`, `window`, `events`, `event-unit`, `sort`, `selected`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `ref.current.addEventListener("tc-sort-change", …)` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sort` and `selected` itself unless a listener calls `preventDefault()` on `tc-sort-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-co-occurrence id="co-occurrence"></tc-co-occurrence>

<script type="module">
  import "@adamstavely/trenchcoat/co-occurrence";

  const el = document.querySelector("#co-occurrence");
  el.addEventListener("tc-sort-change", (e) => {
    e.preventDefault(); // the element keeps its sort…
    if (allowed(e.detail.sort)) el.sort = e.detail.sort; // …until the app sets it
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
import "@adamstavely/trenchcoat/co-occurrence";
import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";

const props = defineProps<{ initial: TcCoOccurrence["sort"] }>();
const sort = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSortChange = (e: CustomEvent<{ sort: TcCoOccurrence["sort"] }>) => {
  e.preventDefault();
  sort.value = e.detail.sort;
};
</script>

<template>
  <tc-co-occurrence :sort="sort" @tc-sort-change="onSortChange"></tc-co-occurrence>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CoOccurrence } from "@adamstavely/trenchcoat/angular/co-occurrence";
import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";

@Component({
  selector: "app-controlled-co-occurrence",
  imports: [CoOccurrence],
  template: `<tc-co-occurrence [sort]="sort()" (tc-sort-change)="onSortChange($event)"></tc-co-occurrence>`,
})
export class ControlledCoOccurrence {
  readonly initial = input.required<TcCoOccurrence["sort"]>();
  readonly sort = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSortChange(e: CustomEvent<{ sort: TcCoOccurrence["sort"] }>) {
    e.preventDefault();
    this.sort.set(e.detail.sort);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/co-occurrence";
  import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";

  let { initial }: { initial: TcCoOccurrence["sort"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sort = $derived(initial);
  let el: TcCoOccurrence;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sort = (e as CustomEvent<{ sort: TcCoOccurrence["sort"] }>).detail.sort;
    };
    el.addEventListener("tc-sort-change", on);
    return () => el.removeEventListener("tc-sort-change", on);
  });
</script>

<tc-co-occurrence bind:this={el} {sort}></tc-co-occurrence>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-co-occurrence")` returns a `TcCoOccurrence` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";`
- **React / Next.js:** Props: `import type { CoOccurrenceProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CoOccurrence>`. The element class, for refs: `import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCoOccurrence["sources"]` with `import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";`
- **Angular:** The directive types the template: `[sources]` takes `TcCoOccurrence["sources"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCoOccurrence } from "@adamstavely/trenchcoat/co-occurrence";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The open row's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The row open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, entity?: CoEntity) => void` | A row was opened or closed; `entity` is the opened one |
| `sort` | `CoSort` | The order of the rows – controlled when given |
| `defaultSort` | `CoSort` | The order on mount when `sort` isn't controlled |
| `onSortChange` | `(sort: CoSort) => void` | The sort was changed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `sort`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The rows are one tab stop; the sort is another.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row's shared events, or closes them |
| Escape | Closes the open row |
| ← / → (sort) | Picks the previous or next sort |

### Screen readers

The rows are a list named by the heading; each row is a button with `aria-expanded`, reading the name, the ID, the
strength, the score, the share, the counts per source and when last seen – “Dana Okafor, ACC-4471-K, Always together,
score 92, 82%, 14 of 17 events, Logins 9, Payments 14 …”. An open row's events are a region named “Shared events with
Dana Okafor”. The sort is a radio group named “Sort by”. Opening, closing and sorting are confirmed in a polite status
message.

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
| **This component alone** | 25.0 KB | 7.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.7 KB** | **9.6 KB** |
| With Lit – the first component on a page | 54.5 KB | 16.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 234 DOM nodes – to layout, median of 7 |
| Typical update | **1.5 ms** | one item of entities replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 35 ms | entities: first render, 3,312 nodes; update 13 ms |
| 1,000 items | 250 ms | entities: first render, 32,472 nodes; update 134 ms |

1,000 items of entities: 250 ms. It renders every item, so a first render passes 50 ms (a long task) at about 200 items – page or filter longer lists.

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

- Name sources as people know them: “Logins”, “Payments”, “Shipments”, not table names.
- Put an account number or device ID in `detail`, so two people with one name stay apart.
- Say the window in `window` – “120-day window” – so the share has a frame.
- Set `thresholds` to match how your team reads the share, and say so in `description`.

## Do and don't

### Do

- Give the shared events for the top few rows, so the evidence is one click away.
- Keep the list to the entities worth a look – a dozen or so, not everything ever seen.

### Don't

- Don't present co-occurrence as proof of a relationship – it's a reason to look, not a finding.
- Don't use it to profile private individuals outside a lawful, documented review.
- Don't hide the share behind the score alone – people need both to judge.

## Related

- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Evidence List](evidence-list.md) – The exhibits behind a matter – reference, title, type, source with its grade, date, holder and a status in words, each opening onto its chain of custody with every step's hash, copyable, and whether the hashes agree
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
