<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Top Spenders

**Data & charts** · New

Who is behind most of the AI spend, ranked – members, teams, API keys and agents with their share as a bar, the amount, the change on the previous period in words ("Up 42%"), the model they used most and a daily sparkline; kind chips, the long tail folded into "and 38 others – $1,204", and a row that opens

- **Element:** `<tc-top-spenders>`
- **Size:** 7.9 KB gzip · 23.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/top-spenders";` |
| React / Next.js | `import { TopSpenders } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/top-spenders";` · tags starting with tc- are custom elements |
| Angular | `import { TopSpenders } from "@adamstavely/trenchcoat/angular/top-spenders";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/top-spenders";` |

## Example

The live example is in the gallery at `#/top-spenders`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who is behind most of the AI spend, ranked. Each row is a member, a team, an API key or an agent: its rank, its name
and kind with the model it used most, its share of the spend as a bar and a percentage, the amount, the change
against the previous period in words – “Up 42%”, “Down 6%”, “No change” – and a sparkline of its daily spend. Chips
filter by kind, and the header totals the spend shown. Past `limit` rows, the long tail folds into one line: “and 38
others – $1,204”. Opening a row fires `tc-spender-open`, for the page to show where that spend went.

### When to use

- A spend or usage admin page, to see who to talk to first when the bill goes up.
- Comparing the cost of agents, teams or API keys within one period.

### When not to use

- Spend against each budget – use [Budget Burn](budget-burn.md).
- One sudden spike and what caused it – use [Cost Anomaly](cost-anomaly.md).
- Seats paid for against seats used – use [Seat Usage](seat-usage.md).
- One plan's usage against its limit – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Kind chips** `.ui-topsp__chips` – All and each kind present, as toggle buttons
2. **Rank** `.ui-topsp__rank` – the position in the current filter
3. **Who** `.ui-topsp__who` – the name, the kind and the top model
4. **Share** `.ui-topsp__share` – the share of the spend as a bar and a percentage
5. **Money** `.ui-topsp__money` – the amount and the change in words, with an arrow
6. **Sparkline** `.ui-topsp__spark` – daily spend through the period
7. **Tail** `.ui-topsp__tail` – everyone past `limit`, folded into one line

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Share bars use the meter tokens and the sparkline `--tc-chart-1`. A rise reads in
`--tc-status-warning-fg` and a fall in `--tc-status-success-fg`, always with an arrow and the words. Narrow, the
sparkline goes and the share bar moves under the name.

## Usage

### HTML

```html
<tc-top-spenders id="spenders" description="October · against September" limit="5"></tc-top-spenders>

<script type="module">
  import "@adamstavely/trenchcoat/top-spenders";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#spenders");
  list.spenders = [
    { id: "audit", name: "Audit", kind: "team", spend: 4210, change: 0.42, topModel: "large-1", daily: [120, 130, 150, 170, 210] },
    { id: "research", name: "Research", kind: "team", spend: 3080, change: -0.06, topModel: "large-1" },
    { id: "policy", name: "Policy Q&A", kind: "agent", spend: 2310, change: 0.18, topModel: "small-2" },
    { id: "okafor", name: "Sam Okafor", kind: "member", spend: 640, change: 0.25 },
  ];
  list.addEventListener("tc-spender-open", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { TopSpenders, type Spender } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const spenders: Spender[] = [
  { id: "audit", name: "Audit", kind: "team", spend: 4210, change: 0.42, topModel: "large-1" },
  { id: "policy", name: "Policy Q&A", kind: "agent", spend: 2310, change: 0.18, topModel: "small-2" },
];

export function Spenders() {
  return <TopSpenders description="October · against September" spenders={spenders} onSpenderOpen={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/top-spenders";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";

defineProps<{ spenders: TcTopSpenders["spenders"]; kindLabels: TcTopSpenders["kindLabels"] }>();
const onKindChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-top-spenders :spenders="spenders" :kindLabels="kindLabels" @tc-kind-change="onKindChange"></tc-top-spenders>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TopSpenders } from "@adamstavely/trenchcoat/angular/top-spenders";
import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";

@Component({
  selector: "app-top-spenders-example",
  imports: [TopSpenders],
  template: `<tc-top-spenders [spenders]="spenders()" [kindLabels]="kindLabels()" (tc-kind-change)="onKindChange($event)"></tc-top-spenders>`,
})
export class TopSpendersExample {
  readonly spenders = input.required<TcTopSpenders["spenders"]>();
  readonly kindLabels = input.required<TcTopSpenders["kindLabels"]>();
  onKindChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/top-spenders";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";

  let { spenders, kindLabels }: { spenders: TcTopSpenders["spenders"]; kindLabels: TcTopSpenders["kindLabels"] } = $props();
  let el: TcTopSpenders;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-kind-change", on);
    return () => el.removeEventListener("tc-kind-change", on);
  });
</script>

<tc-top-spenders bind:this={el} {spenders} {kindLabels}></tc-top-spenders>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Top spenders"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading, e.g. the period |
| `spenders` | – | `Spender[]` | `[]` | Everyone who spent in the period, in any order – the element ranks them |
| `kind` | `kind` | `SpenderFilter` | `"all"` | Which kind to show. Changed by the chips unless a tc-kind-change listener calls preventDefault() |
| `limit` | `limit` | `number` | `8` | How many rows to show before the rest fold into "and N others" |
| `hideFilter` | `hide-filter` | `boolean` | `false` | Hide the kind chips |
| `currency` | `currency` | `string` | `"USD"` | The spend's currency, an ISO 4217 code |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `kindLabels` | – | `Partial<Record<SpenderKind, { one: string; many: string }>>` | `{}` | The words for each kind, merged over defaultSpenderKindLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-kind-change` | – | Yes | The kind filter was changed ({ kind }: TopSpendersKindChange); cancelable – prevented, `kind` stays as it was |
| `tc-spender-open` | – | No | A row was opened ({ id, spender }: TopSpenderOpen) |

#### Design tokens it reads (51)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSpenderKindLabels: Record<SpenderKind, { one: string; many: string }>` | The words for each kind – rename them through `kindLabels` |
| `spendChangeWords(change: number \| undefined, locale?: string): void` | The change in words: "Up 42%", "Down 10%", "No change"; undefined when there's nothing to compare |

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
| `spenders` | `el.spenders = …;` | `<… spenders={…} />` | `<tc-top-spenders :spenders="…">` | `<tc-top-spenders [spenders]="…">` | `<tc-top-spenders {spenders}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-top-spenders :kindLabels="…">` | `<tc-top-spenders [kindLabels]="…">` | `<tc-top-spenders {kindLabels}>` |

*Also attributes: `heading`, `description`, `kind`, `limit`, `hide-filter`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-kind-change` | Yes | `el.addEventListener("tc-kind-change", (e) => …)` | `ref.current.addEventListener("tc-kind-change", …)` | `@tc-kind-change="…"` | `(tc-kind-change)="…($event)"` | `el.addEventListener("tc-kind-change", …)` |
| `tc-spender-open` | No | `el.addEventListener("tc-spender-open", (e) => …)` | `onSpenderOpen={…}` | `@tc-spender-open="…"` | `(tc-spender-open)="…($event)"` | `el.addEventListener("tc-spender-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `kind` itself unless a listener calls `preventDefault()` on `tc-kind-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-top-spenders id="top-spenders"></tc-top-spenders>

<script type="module">
  import "@adamstavely/trenchcoat/top-spenders";

  const el = document.querySelector("#top-spenders");
  el.addEventListener("tc-kind-change", (e) => {
    e.preventDefault(); // the element keeps its kind…
    if (allowed(e.detail.kind)) el.kind = e.detail.kind; // …until the app sets it
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
import "@adamstavely/trenchcoat/top-spenders";
import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";

const props = defineProps<{ initial: TcTopSpenders["kind"] }>();
const kind = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onKindChange = (e: CustomEvent<{ kind: TcTopSpenders["kind"] }>) => {
  e.preventDefault();
  kind.value = e.detail.kind;
};
</script>

<template>
  <tc-top-spenders :kind="kind" @tc-kind-change="onKindChange"></tc-top-spenders>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TopSpenders } from "@adamstavely/trenchcoat/angular/top-spenders";
import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";

@Component({
  selector: "app-controlled-top-spenders",
  imports: [TopSpenders],
  template: `<tc-top-spenders [kind]="kind()" (tc-kind-change)="onKindChange($event)"></tc-top-spenders>`,
})
export class ControlledTopSpenders {
  readonly initial = input.required<TcTopSpenders["kind"]>();
  readonly kind = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onKindChange(e: CustomEvent<{ kind: TcTopSpenders["kind"] }>) {
    e.preventDefault();
    this.kind.set(e.detail.kind);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/top-spenders";
  import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";

  let { initial }: { initial: TcTopSpenders["kind"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let kind = $derived(initial);
  let el: TcTopSpenders;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      kind = (e as CustomEvent<{ kind: TcTopSpenders["kind"] }>).detail.kind;
    };
    el.addEventListener("tc-kind-change", on);
    return () => el.removeEventListener("tc-kind-change", on);
  });
</script>

<tc-top-spenders bind:this={el} {kind}></tc-top-spenders>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-top-spenders")` returns a `TcTopSpenders` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";`
- **React / Next.js:** Props: `import type { TopSpendersProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TopSpenders>`. The element class, for refs: `import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTopSpenders["spenders"]` with `import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";`
- **Angular:** The directive types the template: `[spenders]` takes `TcTopSpenders["spenders"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTopSpenders } from "@adamstavely/trenchcoat/top-spenders";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `kind` | `SpenderFilter` | The kind filter – controlled when given |
| `defaultKind` | `SpenderFilter` | The kind filter on mount, when `kind` isn't controlled |
| `onKindChange` | `(kind: SpenderFilter) => void` | The kind filter was changed |
| `onSpenderOpen` | `(id: string, spender: Spender) => void` | A row was opened |

*Renamed or hidden on the wrapper: `heading`, `kind`, `children`*

## Accessibility

### Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Opens the row |
| Tab | Moves between the chips and the rows |

### Screen readers

The rows are an ordered list of buttons, named by the heading. Each button reads the whole row: “1. Audit, Team;
$4,210, 37% of the spend; Up 42% on the previous period; mostly large-1”. The drawn parts are hidden. The chips are a
group labelled “Show” of toggle buttons (`aria-pressed`), and a change is confirmed politely: “Showing agents, 3”.

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
| **This component alone** | 16.4 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **23.8 KB** | **7.9 KB** |
| With Lit – the first component on a page | 45.7 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 140 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of spenders replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.8 ms | spenders: first render, 140 nodes; update 0.9 ms |
| 1,000 items | 3.2 ms | spenders: first render, 140 nodes; update 1.8 ms |

What it renders doesn't grow with spenders (tested to 1,000 items).

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

- Give every spender for the period; the element ranks them and works out each share from the ones shown by the
  current filter.
- `change` is a fraction against the previous period: 0.42 for up 42%. Leave it out for a spender that's new.
- Name API keys by what they're for (“ledger-sync key”), never by the key itself.

## Do and don't

### Do

- Set `limit` to what fits the page; the tail line keeps the total honest.
- Put the period in `description` – “October · against September”.

### Don't

- Don't mix currencies – `currency` applies to every row.
- Don't read a rise as misuse by itself; open the row and look at where it went.

## Related

- [Seat Usage](seat-usage.md) – Seats paid for against seats used – "112 of 150 seats used · 34 idle", one bar of active, idle and unassigned seats with their cost, a breakdown by plan or team, and idle members with when each was last active, to tick and reclaim after a confirmation that says who loses access
- [Cost Anomaly](cost-anomaly.md) – One spend spike and what caused it – how far over expected and when, daily spend with the normal range as a band and the spike marked (or as a table), what drove the extra cost with each one's share, the costliest runs as evidence, and Set a limit, Investigate and Mark as expected with Undo
- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
