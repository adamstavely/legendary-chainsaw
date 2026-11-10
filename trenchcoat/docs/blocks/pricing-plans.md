<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Pricing Plans

**Blocks** · New

Pricing section with a monthly / yearly switch, three plan cards and collapsible details (uses `segmented-control` and `button`)

- **Element:** `<tc-pricing-plans>`
- **Size:** 20.3 KB gzip · 75.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/pricing-plans";` |
| React / Next.js | `import { PricingPlans } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/pricing-plans";` · tags starting with tc- are custom elements |
| Angular | `import { PricingPlans } from "@adamstavely/trenchcoat/angular/pricing-plans";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/pricing-plans";` |

## Example

The live example is in the gallery at `#/blocks/pricing-plans`, in both looks; Replay restarts its animations.

## Overview

A pricing section for a landing or upgrade page: a heading, a Monthly / Yearly switch and a card per plan. Each card
shows the plan's name and price per month, its limits, a call to action and collapsible details – the integrations it
syncs and what's included. Switching the period rolls the prices' digits; the details open and close for every card
together, so the rows stay aligned. Three cards sit side by side on wide containers and stack below 860 px.

### When to use

- Comparing two to four plans that share the same limits and features.
- An upgrade page where the billing period changes the price.

### When not to use

- Showing what an account will be charged and when – use [Billing Schedule](../components/billing-schedule.md).
- How much of a plan has been used – use [Usage Meter](../components/usage-meter.md).
- A single choice between two options anywhere else – use [Segmented Control](../components/segmented-control.md).

## Anatomy

1. **Heading** `.ui-pp__title` and **subtitle** `.ui-pp__subtitle`
2. **Billing switch** `.ui-pp__switch` – the library's segmented control
3. **Card** `.ui-pp__card` – one per plan; a soft accent ring when it has a badge
4. **Badge** `.ui-pp__badge` – e.g. “Popular”
5. **Price** `.ui-pp__amount` – with rolling digits `.ui-pp__digit` after a switch
6. **Limits** `.ui-pp__limits` – icon, label and value rows
7. **Call to action** `.ui-pp__cta` – a primary button
8. **Details toggle** `.ui-pp__toggle` – Show / Hide details
9. **Details** `.ui-pp__details` – the integrations `.ui-pp__apps` and the features `.ui-pp__features`

## Looks

The section sits on the sunken surface with white cards in both looks; the switch and the buttons follow the look
(Clean's are smaller and flatter). Component tokens on the element: `--tc-pp-max` (the plans' width, 1152 px),
`--tc-pp-pad-top` / `--tc-pp-pad-bottom` and the featured card's `--tc-pp-featured-border` / `--tc-pp-featured-glow`.

## Usage

### HTML

```html
<tc-pricing-plans id="pricing" billing="monthly"></tc-pricing-plans>

<script type="module">
  import "@adamstavely/trenchcoat/pricing-plans";
  import "@adamstavely/trenchcoat/tokens.css";

  const pricing = document.querySelector("#pricing");
  pricing.addEventListener("tc-plan-select", (e) => console.log(e.detail.plan.id, e.detail.billing));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PricingPlans, VisitorsIcon, type PricingBilling, type PricingPlan } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const plans: PricingPlan[] = [
  {
    id: "team",
    name: "Team",
    price: { monthly: 49, yearly: 39 },
    limits: [{ icon: <VisitorsIcon />, label: "Monthly visitors", value: "50k" }],
    sync: "Hourly",
    pick: 3,
    features: [{ label: "API access", included: true }],
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<PricingBilling>("yearly");
  return <PricingPlans plans={plans} billing={billing} onBillingChange={setBilling} onPlanSelect={(plan, period) => console.log(plan.id, period)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/pricing-plans";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";

defineProps<{ plans: TcPricingPlans["plans"] }>();
const onBillingChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-pricing-plans :plans="plans" @tc-billing-change="onBillingChange"></tc-pricing-plans>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PricingPlans } from "@adamstavely/trenchcoat/angular/pricing-plans";
import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";

@Component({
  selector: "app-pricing-plans-example",
  imports: [PricingPlans],
  template: `<tc-pricing-plans [plans]="plans()" (tc-billing-change)="onBillingChange($event)"></tc-pricing-plans>`,
})
export class PricingPlansExample {
  readonly plans = input.required<TcPricingPlans["plans"]>();
  onBillingChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/pricing-plans";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";

  let { plans }: { plans: TcPricingPlans["plans"] } = $props();
  let el: TcPricingPlans;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-billing-change", on);
    return () => el.removeEventListener("tc-billing-change", on);
  });
</script>

<tc-pricing-plans bind:this={el} {plans}></tc-pricing-plans>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Choose your plan"` | The heading – "Choose your plan" by default |
| `subtitle` | `subtitle` | `string` | `"Find the right plan for your team. Start with a 14-day free trial."` | The line under the heading |
| `plans` | – | `PricingPlan[] \| undefined` | `undefined` | The plans; unset shows three example plans |
| `billing` | `billing` | `PricingBilling` | `"yearly"` | The billing period shown |
| `details` | `details` | `boolean` | `true` | Whether every card's details are open |
| `currency` | `currency` | `string` | `"$"` | Put before the amount – "$" by default |
| `billingLabel` | `billing-label` | `string` | `"Billing period"` | The billing switch's accessible name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-billing-change` | – | Yes | The billing period was switched ({ billing }: PricingBillingChange); cancelable – prevented, `billing` stays as it is (controlled use) |
| `tc-details-change` | – | Yes | Show / Hide details was pressed ({ details }: PricingDetailsChange); cancelable – prevented, `details` stays as it is |
| `tc-plan-select` | – | No | A plan's call to action was pressed ({ plan, billing }: PricingPlanSelect) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pp-featured-border` | `light-dark(rgba(47, 107, 255, 0.28), rgba(107, 149, 255, 0.42))` | both |
| `--tc-pp-featured-glow` | `light-dark(rgba(47, 107, 255, 0.06), rgba(47, 107, 255, 0.14))` | both |
| `--tc-pp-tile-filled-ring` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1))` | both |
| `--tc-pp-pad-top` | `48px` | both |
| `--tc-pp-pad-bottom` | `56px` | both |
| `--tc-pp-max` | `1152px` | both |
| `--tc-pp-tile` | `28px` | both |

#### Design tokens it reads (55)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-fill-default`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-lg`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`, `--tc-tracking-tight`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `pricingDefaultPlans(): PricingPlan[]` | The plans shown when `plans` is unset: Starter, Growth (Popular) and Scale |

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
| `plans` | `el.plans = …;` | `<… plans={…} />` | `<tc-pricing-plans :plans="…">` | `<tc-pricing-plans [plans]="…">` | `<tc-pricing-plans {plans}>` |

*Also attributes: `heading`, `subtitle`, `billing`, `details`, `currency`, `billing-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-billing-change` | Yes | `el.addEventListener("tc-billing-change", (e) => …)` | `onBillingChange={…}` | `@tc-billing-change="…"` | `(tc-billing-change)="…($event)"` | `el.addEventListener("tc-billing-change", …)` |
| `tc-details-change` | Yes | `el.addEventListener("tc-details-change", (e) => …)` | `onDetailsChange={…}` | `@tc-details-change="…"` | `(tc-details-change)="…($event)"` | `el.addEventListener("tc-details-change", …)` |
| `tc-plan-select` | No | `el.addEventListener("tc-plan-select", (e) => …)` | `onSelect={…}` | `@tc-plan-select="…"` | `(tc-plan-select)="…($event)"` | `el.addEventListener("tc-plan-select", …)` |

### Controlled

The element changes `billing` and `details` itself unless a listener calls `preventDefault()` on `tc-billing-change` or `tc-details-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-pricing-plans id="pricing-plans"></tc-pricing-plans>

<script type="module">
  import "@adamstavely/trenchcoat/pricing-plans";

  const el = document.querySelector("#pricing-plans");
  el.addEventListener("tc-billing-change", (e) => {
    e.preventDefault(); // the element keeps its billing…
    if (allowed(e.detail.billing)) el.billing = e.detail.billing; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { PricingPlans } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PricingPlans>;
type Props = Omit<Own, "billing" | "onBillingChange"> & { initial: NonNullable<Own["billing"]> };

// Controlled: passing billing makes the wrapper prevent the element's own change; the app sets it
export function ControlledPricingPlans({ initial, ...props }: Props) {
  const [billing, setBilling] = useState<Own["billing"]>(initial);
  return <PricingPlans {...props} billing={billing} onBillingChange={(next) => setBilling(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/pricing-plans";
import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";

const props = defineProps<{ initial: TcPricingPlans["billing"] }>();
const billing = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onBillingChange = (e: CustomEvent<{ billing: TcPricingPlans["billing"] }>) => {
  e.preventDefault();
  billing.value = e.detail.billing;
};
</script>

<template>
  <tc-pricing-plans :billing="billing" @tc-billing-change="onBillingChange"></tc-pricing-plans>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PricingPlans } from "@adamstavely/trenchcoat/angular/pricing-plans";
import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";

@Component({
  selector: "app-controlled-pricing-plans",
  imports: [PricingPlans],
  template: `<tc-pricing-plans [billing]="billing()" (tc-billing-change)="onBillingChange($event)"></tc-pricing-plans>`,
})
export class ControlledPricingPlans {
  readonly initial = input.required<TcPricingPlans["billing"]>();
  readonly billing = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onBillingChange(e: CustomEvent<{ billing: TcPricingPlans["billing"] }>) {
    e.preventDefault();
    this.billing.set(e.detail.billing);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/pricing-plans";
  import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";

  let { initial }: { initial: TcPricingPlans["billing"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let billing = $derived(initial);
  let el: TcPricingPlans;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      billing = (e as CustomEvent<{ billing: TcPricingPlans["billing"] }>).detail.billing;
    };
    el.addEventListener("tc-billing-change", on);
    return () => el.removeEventListener("tc-billing-change", on);
  });
</script>

<tc-pricing-plans bind:this={el} {billing}></tc-pricing-plans>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-pricing-plans")` returns a `TcPricingPlans` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";`
- **React / Next.js:** Props: `import type { PricingPlansProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PricingPlans>`. The element class, for refs: `import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPricingPlans["plans"]` with `import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";`
- **Angular:** The directive types the template: `[plans]` takes `TcPricingPlans["plans"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPricingPlans } from "@adamstavely/trenchcoat/pricing-plans";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – "Choose your plan" by default |
| `plans` | `PricingPlan[]` | The plans; unset shows three example plans |
| `billing` | `PricingBilling` | The billing period (controlled) – pass `onBillingChange` with it. Leave undefined to start at `defaultBilling` |
| `defaultBilling` | `PricingBilling` | The period shown first when uncontrolled – "yearly" by default |
| `onBillingChange` | `(billing: PricingBilling) => void` | The period was switched |
| `details` | `boolean` | Whether the details are open (controlled) |
| `defaultDetails` | `boolean` | Whether the details start open when uncontrolled – true by default |
| `onDetailsChange` | `(details: boolean) => void` | Show / Hide details was pressed |
| `onPlanSelect` | `(plan: PricingPlan, billing: PricingBilling) => void` | A plan's call to action was pressed (after the plan's own `onSelect`) |

*Renamed or hidden on the wrapper: `heading`, `children`, `Choose your plan`, `yearly`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the billing switch, then through each card's call to action and details toggle |
| ← / → | In the switch, picks Monthly or Yearly |
| Enter / Space | Presses the focused button |

### Screen readers

The switch is a `radiogroup` named “Billing period” (rename it with `billing-label`). A rolling price is read once, as
text (“$29”); the rolling digits are hidden. The details toggle reports `aria-expanded` and controls its region, which
is `inert` while closed. Included and missing features are marked with “(included)” and “(not included)”, and each
integration tile has its name as text.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | button, internal/kit, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | button | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | button, internal/base, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 25.1 KB | 9.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **75.6 KB** | **20.5 KB** |
| With Lit – the first component on a page | 97.8 KB | 27.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | default properties, 434 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | re-render with the same data |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |

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

- Prices are per month in both periods; a yearly price is the monthly cost when billed yearly.
- Keep limit labels the same across plans so the rows line up.
- Use a badge on at most one plan.
- `cta` defaults to “Start free trial” – say what happens next.

## Do and don't

### Do

- Handle `tc-plan-select` to start checkout with the plan and period.
- Default to the period most people should choose.

### Don't

- Don't put more than four plans in one section.
- Don't hide a plan's most important limit in the details.

## Related

- [Segmented Control](../components/segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Button](../components/button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state
- [Billing Schedule](../components/billing-schedule.md) – Build a billing phase – start date, duration, products with repeats and timing, discount, minimum and live totals
- [Usage Meter](../components/usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
