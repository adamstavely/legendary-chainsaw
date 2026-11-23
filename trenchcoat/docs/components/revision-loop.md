<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Revision Loop

**Agents** · New

An agent improving its own work against a stated bar – "Round 3 of 5", each round's score against the bar up to the cap, the critic's remaining issues, what each round changed, and an end in words ("Met the bar in round 3", "Stopped at the cap – 2 issues remain") with Stop, Accept as is and Run another round

- **Element:** `<tc-revision-loop>`
- **Size:** 9.5 KB gzip · 30.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/revision-loop";` |
| React / Next.js | `import { RevisionLoop } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/revision-loop";` · tags starting with tc- are custom elements |
| Angular | `import { RevisionLoop } from "@adamstavely/trenchcoat/angular/revision-loop";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/revision-loop";` |

## Example

The live example is in the gallery at `#/revision-loop`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent improving its own work against a stated bar, round by round, with a visible end. The bar and "Round 3 of 5" head it, and a small step chart plots each round's score against the bar's line, with a slot for every round up to the cap so the end is always in view. Beside it, the latest critique is the list of remaining issues. The rounds below open one at a time to show what each changed and what the critic said. When the loop ends, a line says how in words: "Met the bar in round 3", or "Stopped at the cap (5 rounds) – 2 issues remain", with those issues kept beside the result.

### When to use

- An agent that drafts, has its draft scored or critiqued, and revises, such as a report revised against a rubric.
- Any loop a person should be able to see the end of, stop, or accept early.

### When not to use

- Several attempts at once with the best one picked – use [Parallel Attempts](parallel-attempts.md).
- An LLM judge comparing attempts head to head – use [Judge Bracket](judge-bracket.md).
- Test cases scored across prompt or model versions – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-rvl__bar` – what the work must meet, in words
2. **Outcome** `.ui-rvl__outcome` – where the loop stands, with `.ui-rvl__mark`
3. **Chart** `.ui-rvl__plot` – `.ui-rvl__line` and `.ui-rvl__dot` per round, `.ui-rvl__target` for the bar, `.ui-rvl__pending` for a running round, and `.ui-rvl__tick` labels up to the cap
4. **Issues** `.ui-rvl__issues` – the latest critique, each `.ui-rvl__issue`
5. **Rounds** `.ui-rvl__round-list` – each `.ui-rvl__round` with `.ui-rvl__score`, `.ui-rvl__delta` and `.ui-rvl__changed-line`, opening `.ui-rvl__detail`
6. **Actions** `.ui-rvl__actions` – Stop, Accept as is and Run another round; `.ui-rvl__accepted` once accepted

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. When narrow, the chart sits above the issues. A page can set `--tc-rvl-line` for the score line and `--tc-rvl-tick` for the chart's text.

## Usage

### HTML

```html
<tc-revision-loop id="loop" cap="5"></tc-revision-loop>

<script type="module">
  import "@adamstavely/trenchcoat/revision-loop";
  import "@adamstavely/trenchcoat/tokens.css";

  const loop = document.querySelector("#loop");
  loop.bar = { label: "Rubric score ≥ 8/10", target: 8, unit: "/10", max: 10 };
  loop.rounds = [
    { n: 1, status: "done", score: 6.2, critique: ["No summary up front"] },
    { n: 2, status: "running" },
  ];
  loop.addEventListener("tc-stop", () => console.log("stopped"));
</script>
```

### React / Next.js

```tsx
import { RevisionLoop, type RevisionLoopRound } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const rounds: RevisionLoopRound[] = [
  { n: 1, status: "done", score: 6.2, critique: ["No summary up front"] },
  { n: 2, status: "done", score: 8.1, critique: [] },
];

export function Loop() {
  return <RevisionLoop bar={{ label: "Rubric score ≥ 8/10", target: 8, unit: "/10", max: 10 }} cap={5} rounds={rounds} outcome="met" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/revision-loop";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";

defineProps<{ bar: TcRevisionLoop["bar"]; rounds: TcRevisionLoop["rounds"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-revision-loop :bar="bar" :rounds="rounds" @tc-expanded-change="onExpandedChange"></tc-revision-loop>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RevisionLoop } from "@adamstavely/trenchcoat/angular/revision-loop";
import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";

@Component({
  selector: "app-revision-loop-example",
  imports: [RevisionLoop],
  template: `<tc-revision-loop [bar]="bar()" [rounds]="rounds()" (tc-expanded-change)="onExpandedChange($event)"></tc-revision-loop>`,
})
export class RevisionLoopExample {
  readonly bar = input.required<TcRevisionLoop["bar"]>();
  readonly rounds = input.required<TcRevisionLoop["rounds"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/revision-loop";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";

  let { bar, rounds }: { bar: TcRevisionLoop["bar"]; rounds: TcRevisionLoop["rounds"] } = $props();
  let el: TcRevisionLoop;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-revision-loop bind:this={el} {bar} {rounds}></tc-revision-loop>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Revision loop"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading – what's being revised |
| `bar` | – | `RevisionLoopBar` | `{ label: "", target: 0 }` | The bar the work must meet |
| `cap` | `cap` | `number` | `5` | The most rounds it may run |
| `rounds` | – | `RevisionLoopRound[]` | `[]` | The rounds so far, in order; append one as it starts and update it as it ends |
| `outcome` | `outcome` | `RevisionLoopOutcome` | `"running"` | How the loop stands: "running", "met", "capped" or "stopped". Set to "stopped" by Stop and "running" by Run another round, unless their listener calls preventDefault() |
| `expanded` | `expanded` | `number \| null` | `null` | The open round's number, or null. Changed by the user unless a tc-expanded-change listener calls preventDefault() |
| `accepted` | `accepted` | `boolean` | `false` | Whether the result has been accepted; set by Accept unless a tc-accept listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers |
| `labels` | – | `Partial<RevisionLoopLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | A round was opened or closed ({ expanded, round }: RevisionLoopExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-stop` | – | Yes | Stop was pressed while it runs ({ round }: RevisionLoopStop); cancelable – prevented, the outcome stays "running" |
| `tc-accept` | – | Yes | The result was accepted as it is ({ round, score }: RevisionLoopAccept); cancelable – prevented, it isn't marked accepted |
| `tc-extend` | – | Yes | Run another round was pressed at the cap ({ cap }: RevisionLoopExtend); cancelable – prevented, the cap and outcome stay |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rvl-line` | `var(--tc-chart-1)` | both |
| `--tc-rvl-tick` | `10px` | both |

#### Design tokens it reads (44)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `bar` | `el.bar = …;` | `<… bar={…} />` | `<tc-revision-loop :bar="…">` | `<tc-revision-loop [bar]="…">` | `<tc-revision-loop {bar}>` |
| `rounds` | `el.rounds = …;` | `<… rounds={…} />` | `<tc-revision-loop :rounds="…">` | `<tc-revision-loop [rounds]="…">` | `<tc-revision-loop {rounds}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-revision-loop :labels="…">` | `<tc-revision-loop [labels]="…">` | `<tc-revision-loop {labels}>` |

*Also attributes: `heading`, `description`, `cap`, `outcome`, `expanded`, `accepted`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-stop` | Yes | `el.addEventListener("tc-stop", (e) => …)` | `onTcStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |
| `tc-accept` | Yes | `el.addEventListener("tc-accept", (e) => …)` | `onTcAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |
| `tc-extend` | Yes | `el.addEventListener("tc-extend", (e) => …)` | `onTcExtend={…}` | `@tc-extend="…"` | `(tc-extend)="…($event)"` | `el.addEventListener("tc-extend", …)` |

### Controlled

The element changes `expanded` and `accepted` itself unless a listener calls `preventDefault()` on `tc-expanded-change` or `tc-accept` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-revision-loop id="revision-loop"></tc-revision-loop>

<script type="module">
  import "@adamstavely/trenchcoat/revision-loop";

  const el = document.querySelector("#revision-loop");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RevisionLoop } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RevisionLoop>;
type Props = Omit<Own, "expanded" | "onExpandedChange"> & { initial: NonNullable<Own["expanded"]> };

// Controlled: passing expanded makes the wrapper prevent the element's own change; the app sets it
export function ControlledRevisionLoop({ initial, ...props }: Props) {
  const [expanded, setExpanded] = useState<Own["expanded"]>(initial);
  return <RevisionLoop {...props} expanded={expanded} onExpandedChange={(next) => setExpanded(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/revision-loop";
import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";

const props = defineProps<{ initial: TcRevisionLoop["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcRevisionLoop["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-revision-loop :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-revision-loop>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RevisionLoop } from "@adamstavely/trenchcoat/angular/revision-loop";
import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";

@Component({
  selector: "app-controlled-revision-loop",
  imports: [RevisionLoop],
  template: `<tc-revision-loop [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-revision-loop>`,
})
export class ControlledRevisionLoop {
  readonly initial = input.required<TcRevisionLoop["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcRevisionLoop["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/revision-loop";
  import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";

  let { initial }: { initial: TcRevisionLoop["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcRevisionLoop;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcRevisionLoop["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-revision-loop bind:this={el} {expanded}></tc-revision-loop>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-revision-loop")` returns a `TcRevisionLoop` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";`
- **React / Next.js:** Props: `import type { RevisionLoopProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RevisionLoop>`. The element class, for refs: `import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRevisionLoop["bar"]` with `import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";`
- **Angular:** The directive types the template: `[bar]` takes `TcRevisionLoop["bar"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRevisionLoop } from "@adamstavely/trenchcoat/revision-loop";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Revision loop" |
| `expanded` | `number \| null` | The open round's number – controlled when given |
| `defaultExpanded` | `number \| null` | The open round on mount when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: number \| null, round: RevisionLoopRound \| null) => void` | A round was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between finished rounds |
| Home / End | Go to the first or last finished round |
| Enter / Space | Open or close a round |
| Escape | Close the open round |
| Tab | Moves to the rounds, then the actions |

### Screen readers

The chart is an image named with every score and the bar ("Score by round: 5.2/10, 6.6/10. The bar is 8/10."). Each finished round is a button with `aria-expanded`, and its change against the round before is read in words. The outcome is a word and a shape as well as a colour. `role="status"` announces each newly scored round and how the loop ended, and never the rounds there at the start.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-23 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.3 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **30.7 KB** | **9.6 KB** |
| With Lit – the first component on a page | 50.3 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 86 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of rounds replaced |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | rounds: first render, 1,213 nodes; update 2.7 ms |
| 1,000 items | 91 ms | rounds: first render, 11,788 nodes; update 48 ms |

1,000 items of rounds: 91 ms. It renders every item, so a first render passes 50 ms (a long task) at about 550 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `bar.label` the way a person would say it: "Rubric score ≥ 8/10". Give `unit` to show after each score. Keep `changed` to one line about what the round did, and each critique item to one issue. Append a round with `status: "running"` as it starts, then replace it with its score and critique. Set `outcome` when the loop ends: `met` when it reaches the bar, `capped` at the cap.

## Do and don't

### Do

- Set `cap`, so the end is visible from the first round.
- In React, set `outcome` and `cap` yourself in `onTcStop` and `onTcExtend`, since the wrapper passes them again on every render.

### Don't

- Don't hide the remaining issues when the loop is capped. Those are what the person accepts.
- Don't run past the cap without asking. Run another round is the person's choice.

## Related

- [Judge Bracket](judge-bracket.md) – How an LLM judge picks the best of several attempts, as a tournament – matches that fill as verdicts stream in, the winner moving on along its connector and the loser stepping back, any match's two answers with the judge's reason and confidence, and the champion to use
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
