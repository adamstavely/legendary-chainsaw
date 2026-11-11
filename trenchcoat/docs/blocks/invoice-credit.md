<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Invoice & Credit Note

**Blocks** · New

An invoice and its credit note stacked like paper – switch between them, pick lines to credit, adjust amounts and issue (uses `button`, `segmented-control`)

- **Element:** `<tc-invoice-credit>`
- **Size:** 19.3 KB gzip · 78.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/invoice-credit";` |
| React / Next.js | `import { InvoiceCredit } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/invoice-credit";` · tags starting with tc- are custom elements |
| Angular | `import { InvoiceCredit } from "@adamstavely/trenchcoat/angular/invoice-credit";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/invoice-credit";` |

## Example

The live example is in the gallery at `#/blocks/invoice-credit`, in both looks; Replay restarts its animations.

## Overview

An invoice and its credit note, stacked like sheets of paper. The invoice shows the amount due, the parties, the
terms, its lines (grouped where a line has a `group`) and its totals. The credit note shows the same terms with a
link back to the invoice, then the lines to credit in a tray: tick which lines count and adjust each amount, and the
subtotal, tax and adjustment update as you type. Switch between the sheets with the tabs, or press "Credit invoice"
to bring the credit note forward; then issue it. `onIssue` can return a promise – the button shows Issuing… until it
settles, and a rejection keeps the note editable with the error.

### When to use

- A billing screen where an invoice can be credited in full or in part.
- Reviewing a refund before it's issued.

### When not to use

- A plan's upcoming charges – use [Billing Schedule](../components/billing-schedule.md).
- Many invoices to sort and filter – use [Data Table](../components/data-table.md).
- Spend against a budget – use [Budget Burn](../components/budget-burn.md).
- Just switching between two views – use [Segmented Control](../components/segmented-control.md).

## Anatomy

1. **Switch** `.ui-iv__bar` – the Invoice / Credit note tabs, PDF and Credit invoice
2. **Sheet** `.ui-iv__sheet` – a document; the one behind (`[data-behind]`) peeks out above
3. **Head** `.ui-iv__head` – the amount (`.ui-iv__big`), the due date or credited total, and the seller's mark
4. **Terms** `.ui-iv__terms` – numbers, dates and the billing period
5. **Lines** `.ui-iv__table` – the invoice's lines, grouped
6. **Lines to credit** `.ui-iv__tray` – a checkbox (`.ui-iv__check`) and an amount (`.ui-iv__amount`) per line
7. **Totals** `.ui-iv__totals` – subtotal, tax and the total or adjustment
8. **Issue** `.ui-iv__issue` – the Issue / Edit button and any error

## Looks

One look in both Standard and Clean, as the block it came from: a gray tray whose cards are the two sheets, with the
lines to credit in a tray and card of their own. `--tc-iv-figure-size` sets the display amount.

## Usage

### HTML

```html
<tc-invoice-credit id="doc" invoice-no="INV-2041" currency="€" currency-code="EUR"></tc-invoice-credit>

<script type="module">
  import "@adamstavely/trenchcoat/invoice-credit";
  import "@adamstavely/trenchcoat/tokens.css";

  const doc = document.querySelector("#doc");
  doc.lines = [
    { id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 },
    { id: "seats", name: "Extra seats", qty: 12, rate: 40, tax: 0.2 },
  ];
  doc.onIssue = (credits, total) => fetch("/api/credit-notes", { method: "POST", body: JSON.stringify({ credits, total }) });
  doc.addEventListener("tc-issue", (e) => console.log(e.detail.total));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { InvoiceCredit, type InvoiceView } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Invoice() {
  const [view, setView] = useState<InvoiceView>("invoice");
  return (
    <InvoiceCredit
      view={view}
      onViewChange={setView}
      lines={[{ id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 }]}
      onIssue={(credits, total) => fetch("/api/credit-notes", { method: "POST", body: JSON.stringify({ credits, total }) })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/invoice-credit";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";

defineProps<{ seller: TcInvoiceCredit["seller"]; buyer: TcInvoiceCredit["buyer"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-invoice-credit :seller="seller" :buyer="buyer" @tc-view-change="onViewChange"></tc-invoice-credit>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { InvoiceCredit } from "@adamstavely/trenchcoat/angular/invoice-credit";
import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";

@Component({
  selector: "app-invoice-credit-example",
  imports: [InvoiceCredit],
  template: `<tc-invoice-credit [seller]="seller()" [buyer]="buyer()" (tc-view-change)="onViewChange($event)"></tc-invoice-credit>`,
})
export class InvoiceCreditExample {
  readonly seller = input.required<TcInvoiceCredit["seller"]>();
  readonly buyer = input.required<TcInvoiceCredit["buyer"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/invoice-credit";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";

  let { seller, buyer }: { seller: TcInvoiceCredit["seller"]; buyer: TcInvoiceCredit["buyer"] } = $props();
  let el: TcInvoiceCredit;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-invoice-credit bind:this={el} {seller} {buyer}></tc-invoice-credit>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `seller` | – | `DocParty` | `{ name: "Lumen Labs, Inc.", lines: ["48 Harbour Street", "Bristol", "BS1 4RN", "United Kingdom"] }` | Who sends the invoice |
| `buyer` | – | `DocParty` | `{ name: "Northwind Logistics GmbH", lines: ["Speicherstraße 12", "Hamburg", "20457", "Germany"] }` | Who pays it |
| `invoiceNo` | `invoice-no` | `string` | `"INV-2041"` | The invoice's number |
| `creditNo` | `credit-no` | `string` | `"CN-0117"` | The credit note's number |
| `invoiceDate` | `invoice-date` | `string` | `"1 Oct 2026"` | The date of the invoice (and of issue for the credit note), as written |
| `dueDate` | `due-date` | `string` | `"31 Oct 2026"` | When the invoice is due, as written |
| `period` | `period` | `string` | `"1 Sep – 30 Sep 2026"` | The billing period, as written |
| `lines` | – | `InvoiceLine[]` | `[ { id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 }, { id: "seats", name: "Extra seats", qty: 12, rate: 40, tax: 0.2 }, { id: "api", name: "API calls (per 1k)", qty: 18420, rate: 0.42, tax: 0.2, group: "Metered usage" }, ]` | The invoice's lines – lines with a `group` are listed under it |
| `currency` | `currency` | `string` | `"$"` | The currency sign before amounts |
| `currencyCode` | `currency-code` | `string` | `"USD"` | The currency code after the amount applied to the invoice |
| `payHref` | `pay-href` | `string` | `""` | Where "Pay online" goes; unset, the link only fires tc-pay |
| `view` | `view` | `InvoiceView` | `"invoice"` | The sheet in front |
| `onIssue` | – | `InvoiceIssueHandler \| undefined` | `undefined` | Issues the credit note, with the credited amount per line (before tax). Return a promise to show Issuing… until it settles; a rejection keeps the note editable and shows its message so it can be issued again |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The other sheet was brought forward (`{ view }`: InvoiceViewChange); cancelable – prevented, `view` stays as it was |
| `tc-issue` | – | No | The credit note was issued (`{ credits, total }`: InvoiceIssue) – after `onIssue`'s promise resolves, when it returns one |
| `tc-pdf` | – | No | The PDF button was pressed; detail: null |
| `tc-pay` | – | Yes | "Pay online" was pressed (detail: null); cancelable – prevented, the link doesn't open |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-iv-figure-size` | `2.5rem` | both |
| `--tc-iv-figure-size-narrow` | `1.875rem` | both |
| `--tc-iv-space-44px` | `44px` | both |
| `--tc-iv-space-36px` | `36px` | both |
| `--tc-iv-space-9px` | `9px` | both |
| `--tc-iv-space-7px` | `7px` | both |
| `--tc-iv-space-22px` | `22px` | both |
| `--tc-iv-track--0_035em` | `-0.035em` | both |

#### Design tokens it reads (64)

`--tc-accent`, `--tc-accent-text`, `--tc-border-control`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-relaxed`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultInvoiceLines: InvoiceLine[]` | The default lines: a plan, seats and metered API calls |

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
| `seller` | `el.seller = …;` | `<… seller={…} />` | `<tc-invoice-credit :seller="…">` | `<tc-invoice-credit [seller]="…">` | `<tc-invoice-credit {seller}>` |
| `buyer` | `el.buyer = …;` | `<… buyer={…} />` | `<tc-invoice-credit :buyer="…">` | `<tc-invoice-credit [buyer]="…">` | `<tc-invoice-credit {buyer}>` |
| `lines` | `el.lines = …;` | `<… lines={…} />` | `<tc-invoice-credit :lines="…">` | `<tc-invoice-credit [lines]="…">` | `<tc-invoice-credit {lines}>` |
| `onIssue` | `el.onIssue = …;` | `<… onIssue={…} />` | `<tc-invoice-credit :onIssue="…">` | `<tc-invoice-credit [onIssue]="…">` | `<tc-invoice-credit {onIssue}>` |

*Also attributes: `invoice-no`, `credit-no`, `invoice-date`, `due-date`, `period`, `currency`, `currency-code`, `pay-href` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-issue` | No | `el.addEventListener("tc-issue", (e) => …)` | `onTcIssue={…}` | `@tc-issue="…"` | `(tc-issue)="…($event)"` | `el.addEventListener("tc-issue", …)` |
| `tc-pdf` | No | `el.addEventListener("tc-pdf", (e) => …)` | `onTcPdf={…}` | `@tc-pdf="…"` | `(tc-pdf)="…($event)"` | `el.addEventListener("tc-pdf", …)` |
| `tc-pay` | Yes | `el.addEventListener("tc-pay", (e) => …)` | `onTcPay={…}` | `@tc-pay="…"` | `(tc-pay)="…($event)"` | `el.addEventListener("tc-pay", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-invoice-credit id="invoice-credit"></tc-invoice-credit>

<script type="module">
  import "@adamstavely/trenchcoat/invoice-credit";

  const el = document.querySelector("#invoice-credit");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
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
import "@adamstavely/trenchcoat/invoice-credit";
import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";

const props = defineProps<{ initial: TcInvoiceCredit["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcInvoiceCredit["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-invoice-credit :view="view" @tc-view-change="onViewChange"></tc-invoice-credit>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { InvoiceCredit } from "@adamstavely/trenchcoat/angular/invoice-credit";
import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";

@Component({
  selector: "app-controlled-invoice-credit",
  imports: [InvoiceCredit],
  template: `<tc-invoice-credit [view]="view()" (tc-view-change)="onViewChange($event)"></tc-invoice-credit>`,
})
export class ControlledInvoiceCredit {
  readonly initial = input.required<TcInvoiceCredit["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcInvoiceCredit["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/invoice-credit";
  import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";

  let { initial }: { initial: TcInvoiceCredit["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcInvoiceCredit;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcInvoiceCredit["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-invoice-credit bind:this={el} {view}></tc-invoice-credit>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-invoice-credit")` returns a `TcInvoiceCredit` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";`
- **React / Next.js:** Props: `import type { InvoiceCreditProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof InvoiceCredit>`. The element class, for refs: `import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcInvoiceCredit["seller"]` with `import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";`
- **Angular:** The directive types the template: `[seller]` takes `TcInvoiceCredit["seller"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcInvoiceCredit } from "@adamstavely/trenchcoat/invoice-credit";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `view` | `InvoiceView` | The sheet in front (controlled) |
| `defaultView` | `InvoiceView` | The sheet in front at first, when `view` isn't set – the invoice by default |
| `onViewChange` | `(view: InvoiceView) => void` | Called with the sheet brought forward |

*Renamed or hidden on the wrapper: `view`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the tabs, the buttons, the related invoice link, each line's checkbox and amount, and Issue |
| ← / → | On the tabs: switches sheet |
| Space | Ticks or unticks a line |
| Enter | In an amount: commits it |

When a control on a sheet sends it behind – Credit invoice, the related invoice link – focus moves to the sheet that
came forward. Issue and Edit are one button, so focus stays on it.

### Screen readers

The switch is a tab list whose tabs control the sheets; each sheet is a tab panel named "Invoice" or "Credit note",
and the one behind is hidden and inert. Each line's checkbox is named "Credit <line>" and each amount "Credit amount
for <line>". A status region, there from the start, announces "Issued"; an error is an alert.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | button | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, button, internal/base, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button, segmented-control | – |
| conic-gradient() | 69 (Edge 79) | 83 | 12.1 | 12.1 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself, button, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 27.2 KB | 8.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **78.2 KB** | **19.3 KB** |
| With Lit – the first component on a page | 100.3 KB | 26.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | default properties, 185 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | re-render with the same data |
| First on the page | 29 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (segmented-control).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write dates and periods the way your invoices print them – they're shown as given.
- Name lines as they appear on the invoice, so the credit note matches line for line.
- Reject `onIssue` with a message people can act on: "The ledger is locked until month end."

## Do and don't

### Do

- Return a promise from `onIssue` for the real request.
- Control `view` when another part of the page opens the credit note.

### Don't

- Don't use it for invoices with hundreds of lines – the credit tray lists every line.
- Don't change the lines while a note is being issued.

## Related

- [Billing Schedule](../components/billing-schedule.md) – Build a billing phase – start date, duration, products with repeats and timing, discount, minimum and live totals
- [Data Table](../components/data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Segmented Control](../components/segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Budget Burn](../components/budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
