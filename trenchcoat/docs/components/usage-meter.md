<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Usage Meter

**Data & charts** · Also in React

Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

- **Element:** `<tc-usage-meter>`
- **Size:** 14.6 KB gzip · 54.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/usage-meter";` |
| React / Next.js | `import { UsageMeter } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/usage-meter";` · tags starting with tc- are custom elements |
| Angular | `import { UsageMeter } from "@adamstavely/trenchcoat/angular/usage-meter";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/usage-meter";` |

## Example

The live example is in the gallery at `#/usage-meter`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The “Usage” card of a SaaS or AI product: how many of the plan's credits are spent, on what, and what's left before
they reset. One large meter splits the credits into categories (Chat, Search, Image …) with a legend, an optional
sparkline shows usage per day, and thin meters below cover plan limits such as seats and storage. From `warnAt` the
card warns with an amber dot and “Running low”; at 100% it says “Limit reached” and the button changes from
“Upgrade” to “Add credits”. Switching the period rolls every number to its new value while the bars glide.

### When to use

- A billing, plan or account page that shows what's been used this period and when it resets.
- AI products that sell credits and spend them across several features.
- Next to the upgrade or top-up flow, so people see why they need it.

### When not to use

- Spend and token limits of a single live agent run – use [Budget Guard](budget-guard.md).
- How full a model's context window is – use [Context Window](context-window.md).
- An analysis of usage over many dimensions or periods – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Period switch** `.ui-um__switch` – picks the period shown; only there with two or more `periods`
2. **Amount** `.ui-um__amount` – credits used, of the total, with the share beside it
3. **Credits bar** `.ui-um__bar` – the meter, split into one segment per category
4. **Legend** `.ui-um__legend` – each category with its value and share
5. **Per day** `.ui-um__spark` – the daily sparkline; only there with `daily`
6. **Limits** `.ui-um__limits` – thin meters for seats, storage, projects
7. **Button** `.ui-um__action` – “Upgrade”, or “Add credits” near and at the limit

## Looks

Standard sets a white card on the gray tray, with what's left and the button on the tray below it; the categories
are shades of blue, then grays. Clean is one white card with hairline shadows: what's left and the button sit in its
last row, and the categories are tints of the accent blue. Both have the same parts and keys; `layout="wide"` uses the
full width and two columns from 640 px.

## Usage

### HTML

```html
<tc-usage-meter id="usage" plan="Pro plan" total="10000"></tc-usage-meter>

<script type="module">
  import "@adamstavely/trenchcoat/usage-meter";
  import "@adamstavely/trenchcoat/tokens.css";

  const meter = document.querySelector("#usage");
  meter.used = [
    { label: "Chat", value: 4200 },
    { label: "Search", value: 1800 },
    { label: "Image", value: 1300 },
  ];
  meter.limits = [{ label: "Seats", used: 8, total: 10 }, { label: "Storage", used: 3.2, total: 5, unit: "GB" }];
  meter.resetAt = "2026-11-01";
  meter.addEventListener("tc-upgrade", (e) => console.log("Upgrade from", e.detail.state));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { UsageMeter, type UsageItem, type UsagePeriod } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const periods: UsagePeriod[] = [
  { id: "current", label: "This month" },
  { id: "last", label: "Last month" },
];
const usage: Record<string, UsageItem[]> = {
  current: [{ label: "Chat", value: 4200 }, { label: "Search", value: 1800 }],
  last: [{ label: "Chat", value: 5100 }, { label: "Search", value: 2600 }],
};

export function Usage({ onUpgrade }: { onUpgrade: () => void }) {
  const [period, setPeriod] = useState("current");
  return (
    <UsageMeter
      plan="Pro plan"
      total={10000}
      used={usage[period]}
      periods={periods}
      period={period}
      onPeriodChange={setPeriod}
      onUpgrade={onUpgrade}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/usage-meter";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";

defineProps<{ used: TcUsageMeter["used"]; limits: TcUsageMeter["limits"] }>();
const onPeriodChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-usage-meter :used="used" :limits="limits" @tc-period-change="onPeriodChange"></tc-usage-meter>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { UsageMeter } from "@adamstavely/trenchcoat/angular/usage-meter";
import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";

@Component({
  selector: "app-usage-meter-example",
  imports: [UsageMeter],
  template: `<tc-usage-meter [used]="used()" [limits]="limits()" (tc-period-change)="onPeriodChange($event)"></tc-usage-meter>`,
})
export class UsageMeterExample {
  readonly used = input.required<TcUsageMeter["used"]>();
  readonly limits = input.required<TcUsageMeter["limits"]>();
  onPeriodChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/usage-meter";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";

  let { used, limits }: { used: TcUsageMeter["used"]; limits: TcUsageMeter["limits"] } = $props();
  let el: TcUsageMeter;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-period-change", on);
    return () => el.removeEventListener("tc-period-change", on);
  });
</script>

<tc-usage-meter bind:this={el} {used} {limits}></tc-usage-meter>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `layout` | `layout` | `"stacked" \| "wide"` | `"stacked"` | "stacked" (default): one column at most 460px wide · "wide": full width, two columns from 640px |
| `total` | `total` | `number` | `0` | Credits included in the plan |
| `used` | – | `UsageItem[]` | `[]` | What the credits were spent on in the shown period |
| `limits` | – | `UsageLimit[]` | `[]` | Thin meters below, e.g. seats, storage, projects |
| `periods` | – | `UsagePeriod[] \| undefined` | `undefined` | Options of the period switch – no switch when left out |
| `period` | `period` | `string \| undefined` | `undefined` | The chosen period id – unset is the first of `periods` |
| `resetAt` | `reset-at` | `Date \| string \| number \| undefined` | `undefined` | When the credits reset – shown as "Resets in 9 days" |
| `now` | `now` | `number \| undefined` | `undefined` | The current time in epoch ms, for "Resets in …" – unset reads the clock after the element connects |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers and dates |
| `daily` | – | `UsageDay[] \| undefined` | `undefined` | Usage per day for the sparkline under the meter |
| `heading` | `heading` | `string` | `"Usage"` | The heading, and the region's name |
| `plan` | `plan` | `string` | `""` | Plan name next to the reset date, e.g. "Pro plan" |
| `unit` | `unit` | `string` | `"credits"` | Unit of the credits |
| `warnAt` | `warn-at` | `number` | `0.8` | Share from which the meter warns (0–1) |
| `upgradeLabel` | `upgrade-label` | `string` | `"Upgrade"` | Button text while there is room left |
| `topUpLabel` | `top-up-label` | `string` | `"Add credits"` | Button text near and at the limit |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-period-change` | – | Yes | A period is picked in the switch; detail `{ period: string }`. Cancelable: prevent it to control `period` |
| `tc-upgrade` | – | No | The button is pressed; detail `{ state: "ok" \| "warn" \| "limit" }` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-usage-meter-series-1` | `light-dark(rgba(0, 96, 226, 0.765), #4d8dff)` | standard, clean |
| `--tc-usage-meter-series-2` | `light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62))` | standard, clean |
| `--tc-usage-meter-series-3` | `light-dark(rgba(0, 96, 226, 0.3), rgba(77, 141, 255, 0.4))` | standard, clean |
| `--tc-usage-meter-series-4` | `light-dark(rgba(0, 96, 226, 0.16), rgba(77, 141, 255, 0.22))` | standard, clean |
| `--tc-usage-meter-series-5` | `light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16))` | standard, clean |
| `--tc-usage-meter-spark` | `var(--tc-fill-strong)` | standard, clean |

#### Design tokens it reads (107)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-lg`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-usage-meter-tip-x`

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
| `used` | `el.used = …;` | `<… used={…} />` | `<tc-usage-meter :used="…">` | `<tc-usage-meter [used]="…">` | `<tc-usage-meter {used}>` |
| `limits` | `el.limits = …;` | `<… limits={…} />` | `<tc-usage-meter :limits="…">` | `<tc-usage-meter [limits]="…">` | `<tc-usage-meter {limits}>` |
| `periods` | `el.periods = …;` | `<… periods={…} />` | `<tc-usage-meter :periods="…">` | `<tc-usage-meter [periods]="…">` | `<tc-usage-meter {periods}>` |
| `daily` | `el.daily = …;` | `<… daily={…} />` | `<tc-usage-meter :daily="…">` | `<tc-usage-meter [daily]="…">` | `<tc-usage-meter {daily}>` |

*Also attributes: `layout`, `total`, `period`, `reset-at`, `now`, `locale`, `heading`, `plan` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-period-change` | Yes | `el.addEventListener("tc-period-change", (e) => …)` | `ref.current.addEventListener("tc-period-change", …)` | `@tc-period-change="…"` | `(tc-period-change)="…($event)"` | `el.addEventListener("tc-period-change", …)` |
| `tc-upgrade` | No | `el.addEventListener("tc-upgrade", (e) => …)` | `onUpgrade={…}` | `@tc-upgrade="…"` | `(tc-upgrade)="…($event)"` | `el.addEventListener("tc-upgrade", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `period` itself unless a listener calls `preventDefault()` on `tc-period-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-usage-meter id="usage-meter"></tc-usage-meter>

<script type="module">
  import "@adamstavely/trenchcoat/usage-meter";

  const el = document.querySelector("#usage-meter");
  el.addEventListener("tc-period-change", (e) => {
    e.preventDefault(); // the element keeps its period…
    if (allowed(e.detail.period)) el.period = e.detail.period; // …until the app sets it
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
import "@adamstavely/trenchcoat/usage-meter";
import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";

const props = defineProps<{ initial: TcUsageMeter["period"] }>();
const period = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPeriodChange = (e: CustomEvent<{ period: TcUsageMeter["period"] }>) => {
  e.preventDefault();
  period.value = e.detail.period;
};
</script>

<template>
  <tc-usage-meter :period="period" @tc-period-change="onPeriodChange"></tc-usage-meter>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { UsageMeter } from "@adamstavely/trenchcoat/angular/usage-meter";
import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";

@Component({
  selector: "app-controlled-usage-meter",
  imports: [UsageMeter],
  template: `<tc-usage-meter [period]="period()" (tc-period-change)="onPeriodChange($event)"></tc-usage-meter>`,
})
export class ControlledUsageMeter {
  readonly initial = input.required<TcUsageMeter["period"]>();
  readonly period = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPeriodChange(e: CustomEvent<{ period: TcUsageMeter["period"] }>) {
    e.preventDefault();
    this.period.set(e.detail.period);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/usage-meter";
  import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";

  let { initial }: { initial: TcUsageMeter["period"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let period = $derived(initial);
  let el: TcUsageMeter;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      period = (e as CustomEvent<{ period: TcUsageMeter["period"] }>).detail.period;
    };
    el.addEventListener("tc-period-change", on);
    return () => el.removeEventListener("tc-period-change", on);
  });
</script>

<tc-usage-meter bind:this={el} {period}></tc-usage-meter>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-usage-meter")` returns a `TcUsageMeter` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";`
- **React / Next.js:** Props: `import type { UsageMeterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof UsageMeter>`. The element class, for refs: `import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcUsageMeter["used"]` with `import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";`
- **Angular:** The directive types the template: `[used]` takes `TcUsageMeter["used"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcUsageMeter } from "@adamstavely/trenchcoat/usage-meter";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `total` | `number` | Credits included in the plan |
| `used` | `NonNullable<RawUsageMeterProps["used"]>` | What the credits were spent on in the shown period |
| `period` | `string` | The chosen period id. Controlled when defined; otherwise the meter keeps its own, starting at `defaultPeriod` |
| `defaultPeriod` | `string` | First period when uncontrolled – defaults to the first of `periods` |
| `onPeriodChange` | `(id: string) => void` | Called with the new period id – pass the matching `used`, `limits` and `daily` back in |
| `onUpgrade` | `(state: UsageState) => void` | Called by the button, with the current state |
| `title` | `string` | The heading, and the region's name – "Usage" by default |

*Renamed or hidden on the wrapper: `heading`, `period`, `total`, `used`*

## Accessibility

Follows the WAI-ARIA [Meter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the period switch, the credits bar, the per-day sparkline and the button |
| ← / → or ↑ / ↓ | Period switch: picks the previous or next period. Credits bar: moves to the previous or next category and reads it. Sparkline: moves a day back or on |
| Home / End | Credits bar: first or last category. Sparkline: first or last day |
| Escape | Clears the highlighted category or day; also closes a tooltip opened by hover, wherever focus is |
| Enter / Space | On the button: fires `tc-upgrade` |

### Screen readers

The host is a `region` named by the heading. The credits bar is a group (“4,200 of 10,000 credits used – arrow keys
read each category”) holding a `meter` (“Credits used”, value text “4,200 of 10,000 credits”); each arrow press says
the category in a status region (“Chat: 4,200 credits, 52%”). When the state changes the same region says so
(“Usage: running low, 82% of credits used”, “Usage: limit reached, 10,000 of 10,000 credits used”). The period
switch is a `radiogroup` named “Period”. The sparkline is a `slider` (“Usage per day”) whose value text is the day
(“Oct 3: 260 credits”) or the average. Each limit is a `meter` with value text such as “3.2 of 5 GB”, plus “close to
the limit” or “at the limit”; an unlimited one is an image named like “Projects: 14, unlimited”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 47.4 KB | 12.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **54.7 KB** | **14.6 KB** |
| With Lit – the first component on a page | 77.4 KB | 22.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 149 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of daily replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.0 ms | daily: first render, 289 nodes; update 0.3 ms |
| 1,000 items | 21 ms | daily: first render, 2,089 nodes; update 2.3 ms |

1,000 items of daily: 21 ms, 2,089 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 7 React commits (clean), 7 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document keydown`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name categories after the features people use – “Chat”, “Image” – not internal meter names.
- Write `unit` in the plural, lower case: “credits”, “tokens”; it follows every number.
- Keep `plan` to the plan's name (“Pro plan”); the reset line next to it is written for you (“Resets in 9 days”).
- Make `upgradeLabel` and `topUpLabel` say what happens: “Upgrade”, “Add credits”, “Buy more”.

## Do and don't

### Do

- Pass `resetAt` so people know when the credits come back.
- Prevent `tc-period-change` (or pass `period` in React) and swap in the matching `used`, `limits` and `daily`.
- Set `warnAt` to where running out starts to hurt – 0.8 by default.

### Don't

- Don't use more than five categories – the colours repeat after five; group the rest as “Other”.
- Don't hide the button at the limit – that's when people need it most.
- Don't show limits that can't be reached; leave `total` out for an unlimited one instead of a huge number.

## Related

- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- usage-meter: the `--tc-usage-meter-track`, `-fill` and `-action-bg-hover` custom properties are gone; it uses the meter and action tokens.
