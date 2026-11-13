<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Seat Usage

**Data & charts** · New

Seats paid for against seats used – "112 of 150 seats used · 34 idle", one bar of active, idle and unassigned seats with their cost, a breakdown by plan or team, and idle members with when each was last active, to tick and reclaim after a confirmation that says who loses access

- **Element:** `<tc-seat-usage>`
- **Size:** 8.7 KB gzip · 28.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/seat-usage";` |
| React / Next.js | `import { SeatUsage } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/seat-usage";` · tags starting with tc- are custom elements |
| Angular | `import { SeatUsage } from "@adamstavely/trenchcoat/angular/seat-usage";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/seat-usage";` |

## Example

The live example is in the gallery at `#/seat-usage`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Seats paid for against seats used. A headline – “112 of 150 seats used · 38 idle” – sits over one bar split into
active seats (used in the last 30 days), idle seats (given to someone who hasn't used them) and unassigned seats, with a
legend in words and numbers and, with `seat-price`, what the idle and unassigned seats cost a month. Under it, the same
split per plan or team as a table, then the idle members with when each was last active. Tick several and use
Reclaim, or a row's own Reclaim seat; a confirmation says who loses access and what it saves, and confirming fires
`tc-reclaim` for the page to act on.

### When to use

- A billing or admin page, before a renewal, to find seats no one is using.
- Licence reviews by plan or by team.

### When not to use

- Who is spending the most – use [Top Spenders](top-spenders.md).
- One plan's usage against its limit – use [Usage Meter](usage-meter.md).
- A directory of the team – use [Team Roster](team-roster.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Headline** `.ui-seat__headline` – seats used of seats paid, idle and unassigned
2. **Bar** `.ui-seat__bar` – active, idle (striped) and unassigned, as shares of the seats paid for
3. **Legend** `.ui-seat__legend` – each part in words and numbers
4. **Cost** `.ui-seat__cost` – what idle and unassigned seats cost per period
5. **Breakdown** `.ui-seat__table` – paid, active and idle per plan or team
6. **Idle members** `.ui-seat__idle` – checkboxes, last active and Reclaim seat
7. **Confirmation** `.ui-seat__confirm` – who loses access, with Cancel and Reclaim

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Active seats fill with `--tc-meter-fill`; idle seats are striped in the warning colours, so they
differ by pattern as well as colour; unassigned seats are the empty track. Narrow, the last-active time drops under the
name and the table's bars go.

## Usage

### HTML

```html
<tc-seat-usage id="seats" seat-price="30" description="Business plan · renews 1 March"></tc-seat-usage>

<script type="module">
  import "@adamstavely/trenchcoat/seat-usage";
  import "@adamstavely/trenchcoat/tokens.css";

  const seats = document.querySelector("#seats");
  seats.groups = [
    { id: "audit", label: "Audit", paid: 60, assigned: 60, active: 49 },
    { id: "research", label: "Research", paid: 55, assigned: 52, active: 41 },
  ];
  seats.idle = [
    { id: "u1", name: "Ines Lindqvist", detail: "Analyst", group: "Audit", lastActive: Date.UTC(2026, 8, 26) },
    { id: "u2", name: "Omar Haddad", detail: "Field researcher", group: "Research" },
  ];
  seats.addEventListener("tc-reclaim", (e) => {
    seats.idle = seats.idle.filter((m) => !e.detail.ids.includes(m.id));
  });
</script>
```

### React / Next.js

```tsx
import { SeatUsage, type IdleMember, type SeatGroup } from "@adamstavely/trenchcoat/react";
import { useState } from "react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: SeatGroup[] = [{ id: "audit", label: "Audit", paid: 60, assigned: 60, active: 49 }];
const start: IdleMember[] = [{ id: "u1", name: "Ines Lindqvist", group: "Audit" }];

export function Seats() {
  const [idle, setIdle] = useState(start);
  return <SeatUsage groups={groups} idle={idle} seatPrice={30} onReclaim={(ids) => setIdle((list) => list.filter((m) => !ids.includes(m.id)))} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/seat-usage";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";

defineProps<{ groups: TcSeatUsage["groups"]; idle: TcSeatUsage["idle"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-seat-usage :groups="groups" :idle="idle" @tc-selected-change="onSelectedChange"></tc-seat-usage>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SeatUsage } from "@adamstavely/trenchcoat/angular/seat-usage";
import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";

@Component({
  selector: "app-seat-usage-example",
  imports: [SeatUsage],
  template: `<tc-seat-usage [groups]="groups()" [idle]="idle()" (tc-selected-change)="onSelectedChange($event)"></tc-seat-usage>`,
})
export class SeatUsageExample {
  readonly groups = input.required<TcSeatUsage["groups"]>();
  readonly idle = input.required<TcSeatUsage["idle"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/seat-usage";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";

  let { groups, idle }: { groups: TcSeatUsage["groups"]; idle: TcSeatUsage["idle"] } = $props();
  let el: TcSeatUsage;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-seat-usage bind:this={el} {groups} {idle}></tc-seat-usage>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Seats"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading, e.g. the plan and renewal date |
| `paid` | `paid` | `number \| undefined` | `undefined` | Seats paid for; by default the groups' sum |
| `assigned` | `assigned` | `number \| undefined` | `undefined` | Seats given to someone; by default the groups' sum |
| `active` | `active` | `number \| undefined` | `undefined` | Assigned seats used in the last 30 days; by default the groups' sum |
| `groups` | – | `SeatGroup[]` | `[]` | The split per plan or team; leave empty to hide the breakdown |
| `groupLabel` | `group-label` | `string` | `"Team"` | What the breakdown's first column is called: "Plan" or "Team" |
| `idle` | – | `IdleMember[]` | `[]` | Members holding a seat they haven't used in the last 30 days |
| `selected` | – | `string[]` | `[]` | Ticked idle members' ids. Changed by the checkboxes unless a tc-selected-change listener calls preventDefault() |
| `seatPrice` | `seat-price` | `number \| undefined` | `undefined` | What one seat costs per `period`, in `currency`; unset hides the cost line |
| `period` | `period` | `string` | `"a month"` | The period `seat-price` is for, in words: "a month", "a year" |
| `currency` | `currency` | `string` | `"USD"` | The price's currency, an ISO 4217 code |
| `now` | `now` | `number \| undefined` | `undefined` | The time for "47 days ago", epoch ms; unset shows dates instead |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | The time zone for dates, e.g. "Europe/London"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Idle members were ticked or unticked ({ selected }: SeatSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-reclaim` | – | Yes | Reclaiming was confirmed ({ ids, members }: SeatReclaim); cancelable – prevented, the confirmation stays open |

#### Design tokens it reads (50)

`--tc-accent-solid`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `seatTotals(groups: SeatGroup[], given: Partial<Pick<SeatTotals, "paid" \| "assigned" \| "active">>): SeatTotals` | Paid, assigned, active, idle (assigned but not active) and unassigned seats, from the totals or the groups |

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-seat-usage :groups="…">` | `<tc-seat-usage [groups]="…">` | `<tc-seat-usage {groups}>` |
| `idle` | `el.idle = …;` | `<… idle={…} />` | `<tc-seat-usage :idle="…">` | `<tc-seat-usage [idle]="…">` | `<tc-seat-usage {idle}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-seat-usage :selected="…">` | `<tc-seat-usage [selected]="…">` | `<tc-seat-usage {selected}>` |

*Also attributes: `heading`, `description`, `paid`, `assigned`, `active`, `group-label`, `seat-price`, `period` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-reclaim` | Yes | `el.addEventListener("tc-reclaim", (e) => …)` | `onReclaim={…}` | `@tc-reclaim="…"` | `(tc-reclaim)="…($event)"` | `el.addEventListener("tc-reclaim", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-seat-usage id="seat-usage"></tc-seat-usage>

<script type="module">
  import "@adamstavely/trenchcoat/seat-usage";

  const el = document.querySelector("#seat-usage");
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
import "@adamstavely/trenchcoat/seat-usage";
import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";

const props = defineProps<{ initial: TcSeatUsage["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcSeatUsage["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-seat-usage :selected="selected" @tc-selected-change="onSelectedChange"></tc-seat-usage>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SeatUsage } from "@adamstavely/trenchcoat/angular/seat-usage";
import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";

@Component({
  selector: "app-controlled-seat-usage",
  imports: [SeatUsage],
  template: `<tc-seat-usage [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-seat-usage>`,
})
export class ControlledSeatUsage {
  readonly initial = input.required<TcSeatUsage["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcSeatUsage["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/seat-usage";
  import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";

  let { initial }: { initial: TcSeatUsage["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcSeatUsage;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcSeatUsage["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-seat-usage bind:this={el} {selected}></tc-seat-usage>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-seat-usage")` returns a `TcSeatUsage` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";`
- **React / Next.js:** Props: `import type { SeatUsageProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SeatUsage>`. The element class, for refs: `import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSeatUsage["groups"]` with `import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";`
- **Angular:** The directive types the template: `[groups]` takes `TcSeatUsage["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSeatUsage } from "@adamstavely/trenchcoat/seat-usage";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string[]` | Ticked idle members' ids – controlled when given |
| `defaultSelected` | `string[]` | Ticked idle members' ids on mount, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string[]) => void` | Idle members were ticked or unticked |
| `onReclaim` | `(ids: string[], members: IdleMember[]) => boolean \| void` | Reclaiming was confirmed; return false to keep the confirmation open |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Select all, Reclaim, each member's checkbox and Reclaim seat |
| Space | Ticks or unticks a checkbox |
| Enter / Space | On Reclaim, opens the confirmation with focus on Cancel |
| Escape | Closes the confirmation and returns focus to the button that opened it |

### Screen readers

The headline, legend and cost are text; the bars are hidden, since the words carry the same numbers. The breakdown is a
table with a caption, “Seats by team”. Each idle member is a labelled checkbox, and Reclaim seat adds “from Ines
Lindqvist” for screen readers. Reclaim stays focusable with `aria-disabled` until something is ticked. The
confirmation is a group named by its own sentence, and a reclaim is confirmed politely: “Reclaimed 3 seats”.

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

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.0 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.7 KB** | **8.7 KB** |
| With Lit – the first component on a page | 51.1 KB | 16.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 119 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of idle replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.1 ms | idle: first render, 974 nodes; update 1.2 ms |
| 1,000 items | 39 ms | idle: first render, 9,074 nodes; update 10 ms |

1,000 items of idle: 39 ms, 9,074 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Give `groups` and leave the totals to add up, or set `paid`, `assigned` and `active` yourself.
- `idle` can be everyone with an idle seat, or the longest idle first.
- Pass `now` for “Last active 47 days ago”; without it, the element shows the date.

## Do and don't

### Do

- Remove reclaimed members from `idle` once your back end has taken their seats.
- Say the plan and renewal date in `description`.

### Don't

- Don't reclaim without the confirmation: `tc-reclaim` fires only after it.
- Don't call a seat idle on less than 30 days' data.

## Related

- [Top Spenders](top-spenders.md) – Who is behind most of the AI spend, ranked – members, teams, API keys and agents with their share as a bar, the amount, the change on the previous period in words ("Up 42%"), the model they used most and a daily sparkline; kind chips, the long tail folded into "and 38 others – $1,204", and a row that opens
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Team Roster](team-roster.md) – A team directory with everyone's local time – status, role and team, how far ahead or behind you they are, whether they're working, skills – grouped and filtered as a list or a grid, with the team's best hour to meet
- [Cost Anomaly](cost-anomaly.md) – One spend spike and what caused it – how far over expected and when, daily spend with the normal range as a band and the spike marked (or as a table), what drove the extra cost with each one's share, the costliest runs as evidence, and Set a limit, Investigate and Mark as expected with Undo
