<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Billing Schedule

**Data & charts**

Build a billing phase – start date, duration, products with repeats and timing, discount, minimum and live totals

- **Element:** `<tc-billing-schedule>`
- **Size:** 13.7 KB gzip · 57.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/billing-schedule";` |
| React / Next.js | `import { BillingSchedule } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/billing-schedule";` · tags starting with tc- are custom elements |
| Angular | `import { BillingSchedule } from "@adamstavely/trenchcoat/angular/billing-schedule";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/billing-schedule";` |

## Example

The live example is in the gallery at `#/billing-schedule`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A form for one phase of a billing plan – what a customer pays, how often, from when. People name the phase, pick a
start date and a duration, add products from your catalog, and set for each how often it repeats, its price and
whether it's billed in advance or in arrears. A discount and a minimum commitment can be added once each. The phase's
dates and two totals – the first invoice and what the whole phase is worth – update as they go, and a note says when
the minimum applies. It is a form field: with `name`, the schedule is submitted as JSON.

### When to use

- Setting up a contract or a subscription phase by hand: a ramp-up, a pilot, a renewal term.
- Sales or finance tools where people need to see the first invoice and the phase total before they commit.
- Quoting from a fixed catalog of products with standard prices that can be adjusted per deal.

### When not to use

- Picking only a period of time – use [Date Range Picker](date-range-picker.md).
- A longer set-up where billing is one step among several – use [Stepper Form](stepper-form.md), and put the schedule in its step.
- Watching spend against a limit while something runs – use [Budget Guard](budget-guard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Phase summary** `.ui-bs__summary` – the editable phase name, the start date and where the phase ends
3. **Dates** `.ui-bs__fields` – the start date and the duration menu
4. **Line** `.ui-bs__row[data-line]` – a product with its repeat, price and billing timing; or the discount or minimum
5. **Add buttons** `.ui-bs__actions` – Add product (from the catalog), Add discount, Add minimum
6. **Totals** `.ui-bs__totals` – the first invoice and the phase total

## Looks

Standard sets the header and the totals on the gray tray around a white card that holds the form. Clean is one white
card with hairline shadows: the header is its first row with the phase summary under it, and the totals are its last row, each
with its own label.

## Usage

### HTML

```html
<form>
  <tc-billing-schedule id="schedule" name="schedule" heading="Billing schedule"></tc-billing-schedule>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/billing-schedule";
  import "@adamstavely/trenchcoat/tokens.css";

  const schedule = document.querySelector("#schedule");
  schedule.catalog = [
    { name: "Implementation fee", repeat: "once", price: 7500 },
    { name: "Analytics platform", repeat: "monthly", price: 2400 },
  ];
  schedule.start = "2026-11-01";
  schedule.duration = "6m";
  schedule.addEventListener("tc-schedule-change", (e) => console.log(e.detail.lines));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BillingSchedule, type CatalogItem, type ScheduleLine } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const catalog: CatalogItem[] = [
  { name: "Implementation fee", repeat: "once", price: 7500 },
  { name: "Analytics platform", repeat: "monthly", price: 2400 },
];

export function Schedule() {
  const [lines, setLines] = useState<ScheduleLine[]>([
    { id: "l1", kind: "product", name: "Implementation fee", repeat: "once", price: 7500, timing: "advance" },
  ]);
  return <BillingSchedule title="Billing schedule" catalog={catalog} lines={lines} onLinesChange={setLines} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/billing-schedule";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";

defineProps<{ catalog: TcBillingSchedule["catalog"]; lines: TcBillingSchedule["lines"] }>();
const onPhaseChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-billing-schedule :catalog="catalog" :lines="lines" @tc-phase-change="onPhaseChange"></tc-billing-schedule>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BillingSchedule } from "@adamstavely/trenchcoat/angular/billing-schedule";
import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";

@Component({
  selector: "app-billing-schedule-example",
  imports: [BillingSchedule],
  template: `<tc-billing-schedule [catalog]="catalog()" [lines]="lines()" (tc-phase-change)="onPhaseChange($event)"></tc-billing-schedule>`,
})
export class BillingScheduleExample {
  readonly catalog = input.required<TcBillingSchedule["catalog"]>();
  readonly lines = input.required<TcBillingSchedule["lines"]>();
  onPhaseChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/billing-schedule";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";

  let { catalog, lines }: { catalog: TcBillingSchedule["catalog"]; lines: TcBillingSchedule["lines"] } = $props();
  let el: TcBillingSchedule;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-phase-change", on);
    return () => el.removeEventListener("tc-phase-change", on);
  });
</script>

<tc-billing-schedule bind:this={el} {catalog} {lines}></tc-billing-schedule>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Create a billing schedule"` | The heading |
| `phase` | `phase` | `string` | `"Build-out phase"` | Phase name |
| `currency` | `currency` | `string` | `"$"` | Currency symbol shown with prices |
| `catalog` | – | `BillingCatalogItem[]` | `[ { name: "Set-up fee", repeat: "once", price: 4999 }, { name: "Platform licence", repeat: "monthly", price: 1200 }, { name: "Premium support", repeat: "monthly", price: 350 }, { name: "Extra seats (10)", repeat: "monthly", price: 240 }, { name: "Onboarding workshop", repeat: "once", price: 1500 }, ]` | Products offered under "Add product" |
| `lines` | – | `BillingScheduleLine[]` | `[{ id: "seed-1", kind: "product", name: "Set-up fee", repeat: "once", price: 4999, timing: "advance" }]` | Schedule lines |
| `start` | `start` | `string` | `"2026-01-01"` | Start date, yyyy-mm-dd |
| `duration` | `duration` | `BillingDuration` | `"milestone"` | Phase length |
| `name` | `name` | `string \| undefined` | `undefined` | Form field name: a hidden input carries the schedule as JSON for native form submission |
| `disabled` | `disabled` | `boolean` | `false` | Disables every field and button |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-phase-change` | – | Yes | The phase name changes; detail `{ phase }`. Cancelable (controlled use) |
| `tc-start-change` | – | Yes | The start date changes; detail `{ start }`. Cancelable |
| `tc-duration-change` | – | Yes | The duration changes; detail `{ duration }`. Cancelable |
| `tc-lines-change` | – | Yes | The lines change; detail `{ lines }`. Cancelable |
| `tc-schedule-change` | – | No | After every change the user makes (not on connect); detail: the whole schedule (BillingScheduleValue) |

#### Design tokens it reads (91)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `catalog` | `el.catalog = …;` | `<… catalog={…} />` | `<tc-billing-schedule :catalog="…">` | `<tc-billing-schedule [catalog]="…">` | `<tc-billing-schedule {catalog}>` |
| `lines` | `el.lines = …;` | `<… lines={…} />` | `<tc-billing-schedule :lines="…">` | `<tc-billing-schedule [lines]="…">` | `<tc-billing-schedule {lines}>` |

*Also attributes: `heading`, `phase`, `currency`, `start`, `duration`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-phase-change` | Yes | `el.addEventListener("tc-phase-change", (e) => …)` | `onPhaseChange={…}` | `@tc-phase-change="…"` | `(tc-phase-change)="…($event)"` | `el.addEventListener("tc-phase-change", …)` |
| `tc-start-change` | Yes | `el.addEventListener("tc-start-change", (e) => …)` | `onStartChange={…}` | `@tc-start-change="…"` | `(tc-start-change)="…($event)"` | `el.addEventListener("tc-start-change", …)` |
| `tc-duration-change` | Yes | `el.addEventListener("tc-duration-change", (e) => …)` | `onDurationChange={…}` | `@tc-duration-change="…"` | `(tc-duration-change)="…($event)"` | `el.addEventListener("tc-duration-change", …)` |
| `tc-lines-change` | Yes | `el.addEventListener("tc-lines-change", (e) => …)` | `onLinesChange={…}` | `@tc-lines-change="…"` | `(tc-lines-change)="…($event)"` | `el.addEventListener("tc-lines-change", …)` |
| `tc-schedule-change` | No | `el.addEventListener("tc-schedule-change", (e) => …)` | `ref.current.addEventListener("tc-schedule-change", …)` | `@tc-schedule-change="…"` | `(tc-schedule-change)="…($event)"` | `el.addEventListener("tc-schedule-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `phase`, `lines`, `start` and `duration` itself unless a listener calls `preventDefault()` on `tc-phase-change`, `tc-lines-change`, `tc-start-change` or `tc-duration-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-billing-schedule id="billing-schedule"></tc-billing-schedule>

<script type="module">
  import "@adamstavely/trenchcoat/billing-schedule";

  const el = document.querySelector("#billing-schedule");
  el.addEventListener("tc-phase-change", (e) => {
    e.preventDefault(); // the element keeps its phase…
    if (allowed(e.detail.phase)) el.phase = e.detail.phase; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { BillingSchedule } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof BillingSchedule>;
type Props = Omit<Own, "phase" | "onPhaseChange"> & { initial: NonNullable<Own["phase"]> };

// Controlled: passing phase makes the wrapper prevent the element's own change; the app sets it
export function ControlledBillingSchedule({ initial, ...props }: Props) {
  const [phase, setPhase] = useState<Own["phase"]>(initial);
  return <BillingSchedule {...props} phase={phase} onPhaseChange={(next) => setPhase(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/billing-schedule";
import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";

const props = defineProps<{ initial: TcBillingSchedule["phase"] }>();
const phase = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPhaseChange = (e: CustomEvent<{ phase: TcBillingSchedule["phase"] }>) => {
  e.preventDefault();
  phase.value = e.detail.phase;
};
</script>

<template>
  <tc-billing-schedule :phase="phase" @tc-phase-change="onPhaseChange"></tc-billing-schedule>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BillingSchedule } from "@adamstavely/trenchcoat/angular/billing-schedule";
import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";

@Component({
  selector: "app-controlled-billing-schedule",
  imports: [BillingSchedule],
  template: `<tc-billing-schedule [phase]="phase()" (tc-phase-change)="onPhaseChange($event)"></tc-billing-schedule>`,
})
export class ControlledBillingSchedule {
  readonly initial = input.required<TcBillingSchedule["phase"]>();
  readonly phase = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPhaseChange(e: CustomEvent<{ phase: TcBillingSchedule["phase"] }>) {
    e.preventDefault();
    this.phase.set(e.detail.phase);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/billing-schedule";
  import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";

  let { initial }: { initial: TcBillingSchedule["phase"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let phase = $derived(initial);
  let el: TcBillingSchedule;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      phase = (e as CustomEvent<{ phase: TcBillingSchedule["phase"] }>).detail.phase;
    };
    el.addEventListener("tc-phase-change", on);
    return () => el.removeEventListener("tc-phase-change", on);
  });
</script>

<tc-billing-schedule bind:this={el} {phase}></tc-billing-schedule>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-billing-schedule")` returns a `TcBillingSchedule` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";`
- **React / Next.js:** Props: `import type { BillingScheduleProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BillingSchedule>`. The element class, for refs: `import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBillingSchedule["catalog"]` with `import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";`
- **Angular:** The directive types the template: `[catalog]` takes `TcBillingSchedule["catalog"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBillingSchedule } from "@adamstavely/trenchcoat/billing-schedule";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `phase` | `string` | Phase name (controlled). Leave undefined and use `defaultPhase` to let the component keep it |
| `defaultPhase` | `string` | Phase name on mount when `phase` isn't controlled |
| `onPhaseChange` | `(phase: string) => void` | Called with the new phase name as it's typed |
| `lines` | `ScheduleLine[]` | Schedule lines (controlled) |
| `defaultLines` | `ScheduleLine[]` | Lines on mount when `lines` isn't controlled |
| `onLinesChange` | `(lines: ScheduleLine[]) => void` | Called with every line after a product, discount or minimum is added, edited or removed |
| `start` | `string` | Start date, yyyy-mm-dd (controlled) |
| `defaultStart` | `string` | Start date on mount when `start` isn't controlled |
| `onStartChange` | `(start: string) => void` | Called with the new start date, yyyy-mm-dd |
| `duration` | `Duration` | Phase length (controlled) |
| `defaultDuration` | `Duration` | Phase length on mount when `duration` isn't controlled |
| `onDurationChange` | `(duration: Duration) => void` | Called with the new phase length |
| `onChange` | `(schedule: Schedule) => void` | Called with the full schedule after every change the user makes (not on mount) |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the phase name, the dates, each line's fields and Remove, and the add buttons |
| ↓ / ↑ | On Duration or Add product: opens the list on its first or last item. In the list: moves to the next or previous item, wrapping |
| Home / End | In an open list: moves to the first or last item |
| Enter / Space | On Duration or Add product: opens or closes the list. On an item: picks it and returns focus to the button |
| Escape | Closes the open list and returns focus to its button |
| Enter | In a price, percent or amount field: commits the number |

Repeats and billing timing are native selects. When a line is removed, focus moves to the next line's Remove, the one
before, or Add product.

### Screen readers

The lines are a `table` named “Billing lines”, with Name, Repeats and Price column headers. Each field is named after
its line: “Platform licence repeats”, “Platform licence price”, “Platform licence billed”, “Discount percent”,
“Minimum commitment”, and each Remove button “Remove Platform licence”. Duration opens a `listbox` with the current
length `aria-selected`; Add product opens a `menu`. A number field that can't take what was typed is `aria-invalid`
and described by its message (“Not a number – kept the previous value”, “Capped at 100%”). The totals are a status
region, so the first invoice and the phase total are read out after each change.

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
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 48.9 KB | 11.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **57.7 KB** | **13.8 KB** |
| With Lit – the first component on a page | 80.2 KB | 21.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 143 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of catalog replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.0 ms | catalog: first render, 143 nodes; update 0.4 ms |
| 1,000 items | 2.6 ms | catalog: first render, 143 nodes; update 0.8 ms |

What it renders doesn't grow with catalog (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name phases by what they're for: “Pilot”, “Phase 1 · Ramp-up” – not “Phase A”.
- Give catalog products the name that appears on the invoice, with a count in brackets where it matters
  (“Extra seats (10)”).
- Keep the heading to what the person is doing: “Billing schedule”, “Create a billing schedule”.

## Do and don't

### Do

- Pass your own `catalog` with your real products and list prices.
- Set `currency` to the symbol customers will see on the invoice.
- Use `name` inside a form, or listen to `tc-schedule-change` and save the whole schedule.

### Don't

- Don't rely on it for tax, proration or invoicing rules – the totals are an estimate for the phase, worked out from
  the prices, repeats, discount and minimum.
- Don't put the same product in the catalog twice at different prices; adjust the price on the line instead.

## Related

- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
