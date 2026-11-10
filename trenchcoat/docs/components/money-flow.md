<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Money Flow

**People & profiles** · New

How money moved between entities – people, companies, shells and banks in columns, transfers as bands sized by amount with flag chips, an entity's or a transfer's flows lit with a readout in words, a list of every transfer and a table view

- **Element:** `<tc-money-flow>`
- **Size:** 11.0 KB gzip · 36.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/money-flow";` |
| React / Next.js | `import { MoneyFlow } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/money-flow";` · tags starting with tc- are custom elements |
| Angular | `import { MoneyFlow } from "@adamstavely/trenchcoat/angular/money-flow";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/money-flow";` |

## Example

The live example is in the gallery at `#/money-flow`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How money moved between people, companies and accounts, drawn left to right:
- **Entities** are cards in columns. They take the column you give them, or one worked out from who paid whom: payers
  to the left of the people they paid. Each card shows its kind (person, company, shell entity, bank or unknown) as an
  icon and a word.
- **Transfers** are bands whose width follows the amount, compared with the largest transfer in the same currency.
  Each is labelled with its amount and an optional flag chip, such as "Layering", "Cash-in" or "Courier fee". Flagged
  bands are drawn in the danger ink.
- **Labels** sit in the gap between two columns, never on a card, and labels in one gap are kept apart. When the
  card is too narrow for every column and its labels, the drawing keeps its size and scrolls sideways.

Pointing at or focusing an entity lights the transfers in and out of it and dims the rest. Pointing at a transfer
lights it and its two ends. A readout says what's lit in words: "Halden Freight SARL → Kestrel Holdings · €240,000 ·
15 May · Layering". The transfers are also listed under the drawing, and "Show as table" swaps the drawing for a table
of every transfer.

### When to use

- Tracing funds through an anti-money-laundering, fraud or audit review.
- Showing how a payment was split and passed on, such as a grant through sub-recipients or an invoice through
  intermediaries.
- Any small network of payers and payees where who paid whom matters more than the totals.

### When not to use

- The accounts themselves, with their identifiers and status – use [Account List](account-list.md).
- Where an AI output came from – use [Lineage Graph](lineage-graph.md).
- Totals by category, with no flow between them – use [Breakdown Chart](breakdown-chart.md).
- Thousands of transactions to sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Total** `.ui-mfl__total` – how many transfers and how much moved
2. **Readout** `.ui-mfl__readout` – what's lit, in words
3. **Show as table** `.ui-mfl__toggle` – swaps the drawing for a table
4. **Band** `.ui-mfl__band` – a transfer, as wide as its amount
5. **Label** `.ui-mfl__label` – the transfer's amount and flag on its band
6. **Entity** `.ui-mfl__node` – a card with the name, kind and detail
7. **Transfers** `.ui-mfl__transfers` – every transfer as a row under the drawing
8. **Flag** `.ui-mfl__flag` – why a transfer stands out

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight entity names. Clean is
one white card with the header as its first row. The bands, cards and list are the same in both. Bands use
`--tc-mfl-band` (by default `--tc-chart-1`) and flagged bands `--tc-mfl-flagged`; set either on the element.

## Usage

### HTML

```html
<tc-money-flow id="flow" heading="Money flow" currency="EUR"></tc-money-flow>

<script type="module">
  import "@adamstavely/trenchcoat/money-flow";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  flow.nodes = [
    { id: "op", label: "Halden Freight SARL", kind: "company", detail: "France" },
    { id: "hold", label: "Kestrel Holdings", kind: "shell", detail: "Cyprus" },
    { id: "prop", label: "Alder Estates SL", kind: "company", detail: "Spain" },
  ];
  flow.transfers = [
    { id: "t1", from: "op", to: "hold", amount: 240000, date: Date.parse("2026-05-15T12:00"), flag: "Layering" },
    { id: "t2", from: "hold", to: "prop", amount: 180000, date: Date.parse("2026-05-20T12:00") },
  ];
  flow.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MoneyFlow, type FlowNode, type FlowRef, type FlowTransfer } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const nodes: FlowNode[] = [
  { id: "op", label: "Halden Freight SARL", kind: "company", detail: "France" },
  { id: "hold", label: "Kestrel Holdings", kind: "shell", detail: "Cyprus" },
];
const transfers: FlowTransfer[] = [{ id: "t1", from: "op", to: "hold", amount: 240000, flag: "Layering" }];

export function Flow() {
  const [selected, setSelected] = useState<FlowRef | null>(null);
  return <MoneyFlow title="Money flow" nodes={nodes} transfers={transfers} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/money-flow";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";

defineProps<{ nodes: TcMoneyFlow["nodes"]; transfers: TcMoneyFlow["transfers"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-money-flow :nodes="nodes" :transfers="transfers" @tc-selected-change="onSelectedChange"></tc-money-flow>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MoneyFlow } from "@adamstavely/trenchcoat/angular/money-flow";
import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";

@Component({
  selector: "app-money-flow-example",
  imports: [MoneyFlow],
  template: `<tc-money-flow [nodes]="nodes()" [transfers]="transfers()" (tc-selected-change)="onSelectedChange($event)"></tc-money-flow>`,
})
export class MoneyFlowExample {
  readonly nodes = input.required<TcMoneyFlow["nodes"]>();
  readonly transfers = input.required<TcMoneyFlow["transfers"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/money-flow";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";

  let { nodes, transfers }: { nodes: TcMoneyFlow["nodes"]; transfers: TcMoneyFlow["transfers"] } = $props();
  let el: TcMoneyFlow;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-money-flow bind:this={el} {nodes} {transfers}></tc-money-flow>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Money flow"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `nodes` | – | `FlowNode[]` | `[]` | The entities |
| `transfers` | – | `FlowTransfer[]` | `[]` | The transfers between them |
| `currency` | `currency` | `string` | `"EUR"` | The currency for transfers that don't name their own, e.g. "EUR" |
| `kindLabels` | – | `Partial<Record<FlowNodeKind, string>>` | `{}` | The kinds' names, merged over the defaults (Person, Company, Shell entity, Bank, Unknown) |
| `selected` | – | `FlowRef \| null` | `null` | The selected entity or transfer. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `table` | `table` | `boolean` | `false` | Shows a table of every transfer in place of the drawing |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for amounts and dates, e.g. "fr-FR"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | An entity or a transfer was selected or cleared ({ selected, node, transfer }: FlowSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mfl-band` | `var(--tc-chart-1)` | both |
| `--tc-mfl-flagged` | `var(--tc-status-danger-fg)` | both |

#### Design tokens it reads (59)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultFlowKindLabels: Record<FlowNodeKind, string>` | The kinds' names used when the page gives none |

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-money-flow :nodes="…">` | `<tc-money-flow [nodes]="…">` | `<tc-money-flow {nodes}>` |
| `transfers` | `el.transfers = …;` | `<… transfers={…} />` | `<tc-money-flow :transfers="…">` | `<tc-money-flow [transfers]="…">` | `<tc-money-flow {transfers}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-money-flow :kindLabels="…">` | `<tc-money-flow [kindLabels]="…">` | `<tc-money-flow {kindLabels}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-money-flow :selected="…">` | `<tc-money-flow [selected]="…">` | `<tc-money-flow {selected}>` |

*Also attributes: `heading`, `description`, `currency`, `table`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-money-flow id="money-flow"></tc-money-flow>

<script type="module">
  import "@adamstavely/trenchcoat/money-flow";

  const el = document.querySelector("#money-flow");
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
import "@adamstavely/trenchcoat/money-flow";
import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";

const props = defineProps<{ initial: TcMoneyFlow["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcMoneyFlow["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-money-flow :selected="selected" @tc-selected-change="onSelectedChange"></tc-money-flow>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MoneyFlow } from "@adamstavely/trenchcoat/angular/money-flow";
import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";

@Component({
  selector: "app-controlled-money-flow",
  imports: [MoneyFlow],
  template: `<tc-money-flow [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-money-flow>`,
})
export class ControlledMoneyFlow {
  readonly initial = input.required<TcMoneyFlow["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcMoneyFlow["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/money-flow";
  import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";

  let { initial }: { initial: TcMoneyFlow["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcMoneyFlow;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcMoneyFlow["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-money-flow bind:this={el} {selected}></tc-money-flow>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-money-flow")` returns a `TcMoneyFlow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";`
- **React / Next.js:** Props: `import type { MoneyFlowProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MoneyFlow>`. The element class, for refs: `import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMoneyFlow["nodes"]` with `import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";`
- **Angular:** The directive types the template: `[nodes]` takes `TcMoneyFlow["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMoneyFlow } from "@adamstavely/trenchcoat/money-flow";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `FlowRef \| null` | The selected entity or transfer – controlled when given (null for none) |
| `defaultSelected` | `FlowRef \| null` | The entity or transfer selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: FlowRef \| null, item?: FlowNode \| FlowTransfer) => void` | An entity or a transfer was selected or cleared, with the one selected |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

### Keyboard

The entities are one tab stop and the transfers list is a second.

| Key | What it does |
|---|---|
| ← / → | Moves to the nearest entity in the column before or after |
| ↑ / ↓ | Moves within a column of entities, or between transfers in the list |
| Home / End | Moves to the first or last entity, or transfer |
| Enter / Space | Selects the entity or transfer, or clears it if it's selected |
| Escape | Clears the selection |
| Tab | Moves from the entities to the transfers list, then on |

Focusing an entity or a transfer lights it, just as pointing does.

### Screen readers

The drawing is a group named by the heading and described by “Arrow keys move between entities; Enter selects one
and lights its transfers”. The bands and their labels are hidden; the same facts are in the transfers list and the
table. Each entity is a toggle button (`aria-pressed`) that reads its name, kind and detail, then its flows: “Halden
Freight SARL, Company · France, in €58,000 · out €249,500 · 3 transfers”. Each transfer in the list is a toggle button
that reads “Halden Freight SARL to Kestrel Holdings €240,000 15 May Layering”. Selecting is confirmed in a polite
status message, and clearing with “Selection cleared”. The table has a caption, “Transfers”, and column headers.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
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
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.6 KB | 8.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.1 KB** | **11.0 KB** |
| With Lit – the first component on a page | 58.0 KB | 18.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 161 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of nodes replaced |
| First on the page | 8.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.5 ms | nodes: first render, 1,238 nodes; update 1.3 ms |
| 1,000 items | 57 ms | nodes: first render, 11,588 nodes; update 22 ms |

1,000 items of nodes: 57 ms. It renders every item, so a first render passes 50 ms (a long task) at about 870 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name entities the way investigators know them, and put the country or role in `detail`.
- Keep flags to a word or two that says why the transfer stands out: “Layering”, “Cash-in”, “Structuring”.
- Give each transfer a date; the list and the readout show it.
- Set `column` on entities when the flow has a known order the transfers don't show, such as origin, conduit and
  destination.

## Do and don't

### Do

- Keep the network small – roughly twenty entities and thirty transfers – so the drawing stays readable.
- Give transfers their own `currency` when they're in more than one. Amounts in different currencies are never added
  together: an entity's totals are given per currency ("out $100 + ¥10,000"), and band widths are only comparable
  within a currency.
- Pair a selected entity with its accounts in `account-list`.

### Don't

- Don't use flag chips for every transfer – a flag only means something when most transfers have none.
- Don't draw totals by category here – there's no flow between them.
- Don't rely on the drawing alone in a report; include the table.

## Related

- [Account List](account-list.md) – The financial accounts linked to a person or a company – institution, type, an IBAN-style identifier masked until shown one at a time, a balance or flagged amount and a status each (Monitored, Flagged, Under review, Closed or your own), with your own stats above
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **money-flow:** totals are kept per currency; it keeps re-laying out after being moved in the page (as does chat-composer).
- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
