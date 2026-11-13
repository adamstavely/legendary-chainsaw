<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Line Items

**AI & chat** · New

Rows a model reads off an invoice, receipt or claim, to fix, total and confirm – rows that stream in, "Check" on the cells it wasn't sure of, every cell edited in place with locale numbers, a subtotal, tax and total that recompute as you type, and a warning when the total doesn't match the document's

- **Element:** `<tc-line-items>`
- **Size:** 10.9 KB gzip · 35.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/line-items";` |
| React / Next.js | `import { LineItems } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/line-items";` · tags starting with tc- are custom elements |
| Angular | `import { LineItems } from "@adamstavely/trenchcoat/angular/line-items";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/line-items";` |

## Example

The live example is in the gallery at `#/line-items`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The rows a model reads off a document – an invoice, a receipt, an expense claim – for a person to fix, total and
confirm. Rows arrive as they stream. A row read with low confidence says "Low confidence", and each cell the model
wasn't sure of says "Check" until someone edits it. Every cell edits in place, and numbers are read the way the locale
writes them. The subtotal, tax and total recompute as you type, in the document's currency. When the document states
its own total, a mismatch is called out in words with the difference. Rows can be added and removed, and Confirm hands
the rows and totals back.

### When to use

- Line items extracted from a document by a model, before they're posted or paid.
- An expense claim or purchase order a person checks row by row.
- Any streamed table of amounts where the total has to match a figure on the source.

### When not to use

- Named fields read off a page (an invoice number, a due date) – use [Extraction Review](extraction-review.md).
- A general spreadsheet with sorting, ranges and paste – use [Data Table](data-table.md).
- A read-only list of documents – use [Document List](document-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Grid** `.ui-lni__grid` – the rows, with a header row of column names
2. **Row** `.ui-lni__row` – one line item
3. **Cell** `.ui-lni__cell` – description, quantity, unit price or amount, edited in place
4. **Check** `.ui-lni__check` – a cell the model wasn't sure of
5. **Low confidence** `.ui-lni__low` – a row read with low confidence
6. **Flag** `.ui-lni__flag` – a warning about the row, in words
7. **Remove** `.ui-lni__remove` – takes the row out
8. **Totals** `.ui-lni__totals` – subtotal, tax and total
9. **Match** `.ui-lni__match` – whether the total matches the document's
10. **Add row** `.ui-lni__add` and **Confirm** `.ui-lni__confirm`

## Looks

Standard puts the header on the gray tray above a white card, with the totals and Confirm on the tray below it. Clean
is one white card: the header its first row, the totals its last. Narrower than 520 px, each row becomes a stacked card
with its cells labelled.

## Usage

### HTML

```html
<tc-line-items id="claim" heading="Expense claim" currency="EUR" stated-total="1365.9"></tc-line-items>

<script type="module">
  import "@adamstavely/trenchcoat/line-items";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#claim");
  el.items = [
    { id: "reg", description: "Conference registration", quantity: 1, unitPrice: 640 },
    { id: "hotel", description: "Hotel, 3 nights", quantity: 3, unitPrice: 148.5, uncertain: ["quantity"] },
    { id: "taxi", description: "Taxi to the venue", amount: 24, confidence: 0.5, flag: "Receipt is hard to read" },
  ];
  el.addEventListener("tc-confirm", (e) => console.log("Confirmed", e.detail.total));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { LineItems, type LineItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Claim({ rows, onPost }: { rows: LineItem[]; onPost: (items: LineItem[], total: number) => void }) {
  const [items, setItems] = useState(rows);
  return (
    <LineItems
      title="Expense claim"
      currency="EUR"
      statedTotal={1365.9}
      items={items}
      onItemsChange={setItems}
      onConfirm={({ items, total }) => onPost(items, total)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/line-items";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";

defineProps<{ items: TcLineItems["items"] }>();
const onItemsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-line-items :items="items" @tc-items-change="onItemsChange"></tc-line-items>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LineItems } from "@adamstavely/trenchcoat/angular/line-items";
import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";

@Component({
  selector: "app-line-items-example",
  imports: [LineItems],
  template: `<tc-line-items [items]="items()" (tc-items-change)="onItemsChange($event)"></tc-line-items>`,
})
export class LineItemsExample {
  readonly items = input.required<TcLineItems["items"]>();
  onItemsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/line-items";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";

  let { items }: { items: TcLineItems["items"] } = $props();
  let el: TcLineItems;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-line-items bind:this={el} {items}></tc-line-items>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Line items"` | The heading |
| `source` | `source` | `string \| undefined` | `undefined` | The document the rows came from – shown under the heading |
| `items` | – | `LineItem[]` | `[]` | The rows |
| `streaming` | `streaming` | `boolean` | `false` | Rows are still arriving: the grid is busy and Confirm waits |
| `currency` | `currency` | `string` | `"USD"` | The ISO 4217 currency of the amounts |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers and amounts, and for reading what's typed |
| `taxRate` | `tax-rate` | `number` | `0` | Tax as a fraction of the subtotal – 0.08 for 8 %; 0 hides the tax row |
| `statedTotal` | `stated-total` | `number \| undefined` | `undefined` | The total the document itself states; a different total is called out |
| `threshold` | `threshold` | `number` | `0.8` | Confidence below this (0–1) marks a row "Low confidence" |
| `confirmLabel` | `confirm-label` | `string` | `"Confirm"` | The label of the button that hands the rows back |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-items-change` | – | Yes | A row was edited, added or removed ({ items, item, action }: LineItemsChange); cancelable – prevented, the rows stay as they were |
| `tc-confirm` | – | Yes | Confirm was pressed ({ items, subtotal, tax, total }: LineItemsConfirm); cancelable – prevented, nothing is announced |

#### Design tokens it reads (78)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `lineAmount(item: LineItem): number` | The row's amount: its own when given, else quantity × unit price |
| `lineTotals(items: readonly LineItem[], taxRate: unknown): LineItemTotals` | Subtotal, tax at `taxRate` (0.08 for 8 %) and total, rounded to cents |
| `parseLocaleNumber(text: string, locale?: string): number` | A number as the locale writes it – "1.234,50" in de-DE, "1,234.50" in en-US – or NaN. Currency signs and spaces are ignored |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-line-items :items="…">` | `<tc-line-items [items]="…">` | `<tc-line-items {items}>` |

*Also attributes: `heading`, `source`, `streaming`, `currency`, `locale`, `tax-rate`, `stated-total`, `threshold` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-items-change` | Yes | `el.addEventListener("tc-items-change", (e) => …)` | `ref.current.addEventListener("tc-items-change", …)` | `@tc-items-change="…"` | `(tc-items-change)="…($event)"` | `el.addEventListener("tc-items-change", …)` |
| `tc-confirm` | Yes | `el.addEventListener("tc-confirm", (e) => …)` | `onConfirm={…}` | `@tc-confirm="…"` | `(tc-confirm)="…($event)"` | `el.addEventListener("tc-confirm", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `items` itself unless a listener calls `preventDefault()` on `tc-items-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-line-items id="line-items"></tc-line-items>

<script type="module">
  import "@adamstavely/trenchcoat/line-items";

  const el = document.querySelector("#line-items");
  el.addEventListener("tc-items-change", (e) => {
    e.preventDefault(); // the element keeps its items…
    if (allowed(e.detail.items)) el.items = e.detail.items; // …until the app sets it
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
import "@adamstavely/trenchcoat/line-items";
import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";

const props = defineProps<{ initial: TcLineItems["items"] }>();
const items = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onItemsChange = (e: CustomEvent<{ items: TcLineItems["items"] }>) => {
  e.preventDefault();
  items.value = e.detail.items;
};
</script>

<template>
  <tc-line-items :items="items" @tc-items-change="onItemsChange"></tc-line-items>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LineItems } from "@adamstavely/trenchcoat/angular/line-items";
import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";

@Component({
  selector: "app-controlled-line-items",
  imports: [LineItems],
  template: `<tc-line-items [items]="items()" (tc-items-change)="onItemsChange($event)"></tc-line-items>`,
})
export class ControlledLineItems {
  readonly initial = input.required<TcLineItems["items"]>();
  readonly items = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onItemsChange(e: CustomEvent<{ items: TcLineItems["items"] }>) {
    e.preventDefault();
    this.items.set(e.detail.items);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/line-items";
  import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";

  let { initial }: { initial: TcLineItems["items"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let items = $derived(initial);
  let el: TcLineItems;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      items = (e as CustomEvent<{ items: TcLineItems["items"] }>).detail.items;
    };
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-line-items bind:this={el} {items}></tc-line-items>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-line-items")` returns a `TcLineItems` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";`
- **React / Next.js:** Props: `import type { LineItemsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LineItems>`. The element class, for refs: `import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLineItems["items"]` with `import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";`
- **Angular:** The directive types the template: `[items]` takes `TcLineItems["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLineItems } from "@adamstavely/trenchcoat/line-items";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `items` | `LineItem[]` | The rows. Controlled when defined – pass back what onItemsChange reports |
| `defaultItems` | `LineItem[]` | Starting rows when uncontrolled |
| `onItemsChange` | `(items: LineItem[], item: LineItem, action: LineItemsAction) => void` | A row was edited, added or removed: the whole list, the row and what was done |
| `onConfirm` | `(detail: LineItemsConfirm) => void \| boolean` | Confirm was pressed: the rows and the totals. Return false to stop the confirmation being announced |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The grid is one tab stop.

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move cell by cell |
| Home / End | The row's first or last cell |
| Ctrl + Home / Ctrl + End | The first or last row |
| Enter / F2 | Edit the cell |
| A character | Start editing with it |
| Enter (editing) | Save |
| Escape (editing) | Cancel |
| Delete | Remove the row |

### Screen readers

The rows are a `grid` named by the heading, with column headers; while rows stream it is `aria-busy`. Each cell reads
its value, "Check" when the model wasn't sure, and the keys through a hidden description. The edit field is named by
its column and row ("Qty, Hotel, 3 nights") and is `aria-invalid` when what's typed isn't a number. Edits, added and
removed rows, the end of streaming ("5 line items read") and a confirmation are announced through `role="status"`.
While rows stream, Confirm is `aria-disabled` with the reason as its description.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.3 KB | 8.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **35.7 KB** | **10.9 KB** |
| With Lit – the first component on a page | 58.0 KB | 18.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 153 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of items replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 21 ms | items: first render, 2,281 nodes; update 6.2 ms |
| 1,000 items | 138 ms | items: first render, 22,441 nodes; update 36 ms |

1,000 items of items: 138 ms. It renders every item, so a first render passes 50 ms (a long task) at about 360 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write descriptions as the document does, shortened: "Hotel, 3 nights", not a product code.
- Use `category` for the bucket a person would file it under.
- Keep `flag` to one line about what to look at: "Receipt is hard to read".
- Pass `statedTotal` whenever the document prints its own total – it's the check people care most about.

## Do and don't

### Do

- Pass `uncertain` for the cells the model guessed at, so people check those first.
- Keep `items` in the page and update it from `tc-items-change` when the server has to agree to each edit.
- Set `currency` and `locale` from the document, not the reader's browser.

### Don't

- Don't use Confirm as approval: the server still has to check who may post the rows.
- Don't hide a mismatch by adjusting a row silently – let the person fix it.

## Related

- [Extraction Review](extraction-review.md) – Fields pulled from a document, each linked to its place on the page – confidence per field, accept, correct or reject, field by field from the keyboard
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Generated UI](generated-ui.md) – A model's answer drawn as real components – tables, charts, metrics, forms and callouts from a spec, checked as it arrives, with plain text for anything unknown
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
