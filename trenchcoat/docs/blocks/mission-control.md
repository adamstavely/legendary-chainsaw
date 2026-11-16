<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Mission Control

**Blocks** · New

The home of an agent product – what happened since you looked as a small chart and a line in words, who runs under whom, and what needs you on the side, with one status filter (All, Running, Waiting, Failed) for all three; narrow, what needs you comes first (uses `agent-tree`, `decision-inbox`, `segmented-control`)

- **Element:** `<tc-mission-control>`
- **Size:** 36.6 KB gzip · 145.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/mission-control";` |
| React / Next.js | `import { MissionControl } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/mission-control";` · tags starting with tc- are custom elements |
| Angular | `import { MissionControl } from "@adamstavely/trenchcoat/angular/mission-control";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/mission-control";` |

## Example

The live example is in the gallery at `#/blocks/mission-control`, in both looks; Replay restarts its animations.

## Overview

The home of an agent product: every agent at a glance. On top, “Since you looked” – a small chart of the period
stacked by done, failed and needs you, with the totals in a line of words. In the middle, who runs under whom, in the
library's Agent Tree. On the side, what needs you, in the library's Decision Inbox. One filter at the top – All,
Running, Waiting, Failed – applies to all three: the tree keeps the agents with that status and the agents above
them, and the events and decisions keep the ones whose `agentId` it kept. Narrow, it stacks with what needs you first.

### When to use

- The landing page of a product where agents run under an orchestrator.
- Catching up after time away: what finished, what failed and what waits on you, in one place.
- Answering the decisions agents are waiting on beside the tree they come from.

### When not to use

- When each agent was busy over time matters more than who started whom – use [Mission Timeline](mission-timeline.md).
- One run's tree on its own, without the period or the decisions – use [Agent Tree](../components/agent-tree.md).
- Only the decisions – use [Decision Inbox](../components/decision-inbox.md).
- Only what happened while you were away – use [Agent Recap](../components/agent-recap.md).

## Anatomy

1. **Intro** `[data-ui="mctl"] > header` – the heading and the status filter
2. **Since you looked** `[data-ui="mctl"] > section` – the title, the line in words, the chart and its legend
3. **Chart** `[data-ui="mctl"] > section > svg` – the period in bins, stacked by done, failed and needs you
4. **Agents** `tc-agent-tree` – who runs under whom, filtered
5. **Needs you** `[data-ui="mctl"] > div > aside` – the Decision Inbox, filtered

## Looks

The block is a page section, not a card. “Since you looked” sits on the gray tray in Standard and on a white card in
Clean; the tree and the inbox carry the look the rest of the way. Clean sets the heading in a lighter weight.

## Usage

### HTML

```html
<tc-mission-control id="mission"></tc-mission-control>

<script type="module">
  import "@adamstavely/trenchcoat/mission-control";
  import "@adamstavely/trenchcoat/tokens.css";

  const T = Date.UTC(2026, 10, 14, 6, 0);
  const MIN = 60_000;
  const mission = document.querySelector("#mission");
  mission.since = T - 60 * MIN;
  mission.now = T;
  mission.root = {
    id: "lead",
    name: "Notice lead",
    task: "Prepare the winter service-change notice",
    status: "running",
    children: [
      { id: "planner", name: "Planner", task: "List the stops that change", status: "done", cost: 0.31 },
      { id: "scheduler", name: "Scheduler", task: "Draft the new timetables", status: "waiting", ask: "Publish route 31's earlier last run?" },
      { id: "translator", name: "Translator", task: "Translate the notice", status: "failed", error: "The glossary file couldn't be read" },
    ],
  };
  mission.events = [
    { at: T - 50 * MIN, kind: "done", agentId: "planner", label: "Stop list ready" },
    { at: T - 30 * MIN, kind: "needs-you", agentId: "scheduler" },
    { at: T - 10 * MIN, kind: "failed", agentId: "translator", label: "Glossary file couldn't be read" },
  ];
  mission.decisions = [
    { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", detail: "23:40 becomes 23:10", primary: "Publish", secondary: "Ask the depot" },
  ];
  mission.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
  mission.addEventListener("tc-decide", (e) => console.log(e.detail));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MissionControl, type MissionAgent, type MissionDecision, type MissionEvent, type MissionFilter } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;

const root: MissionAgent = {
  id: "lead",
  name: "Notice lead",
  task: "Prepare the winter service-change notice",
  status: "running",
  children: [
    { id: "scheduler", name: "Scheduler", task: "Draft the new timetables", status: "waiting", ask: "Publish route 31's earlier last run?" },
    { id: "translator", name: "Translator", task: "Translate the notice", status: "failed", error: "The glossary file couldn't be read" },
  ],
};
const events: MissionEvent[] = [{ at: T - 10 * MIN, kind: "failed", agentId: "translator", label: "Glossary file couldn't be read" }];
const decisions: MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", primary: "Publish", secondary: "Ask the depot" },
];

export function Home() {
  const [filter, setFilter] = useState<MissionFilter>("all");
  return (
    <MissionControl
      root={root}
      events={events}
      decisions={decisions}
      since={T - 60 * MIN}
      now={T}
      filter={filter}
      onFilterChange={setFilter}
      onSelectAgent={(agent) => console.log(agent.id)}
      onDecide={(decision, answer) => console.log(decision.id, answer)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/mission-control";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";

defineProps<{ root: TcMissionControl["root"]; resolver: TcMissionControl["resolver"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-mission-control :root="root" :resolver="resolver" @tc-filter-change="onFilterChange"></tc-mission-control>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MissionControl } from "@adamstavely/trenchcoat/angular/mission-control";
import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";

@Component({
  selector: "app-mission-control-example",
  imports: [MissionControl],
  template: `<tc-mission-control [root]="root()" [resolver]="resolver()" (tc-filter-change)="onFilterChange($event)"></tc-mission-control>`,
})
export class MissionControlExample {
  readonly root = input.required<TcMissionControl["root"]>();
  readonly resolver = input.required<TcMissionControl["resolver"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/mission-control";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";

  let { root, resolver }: { root: TcMissionControl["root"]; resolver: TcMissionControl["resolver"] } = $props();
  let el: TcMissionControl;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-mission-control bind:this={el} {root} {resolver}></tc-mission-control>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `root` | – | `TreeAgent` | `{ id: "", name: "", task: "", status: "queued" }` | The orchestrator, with its sub-agents as `children` – the Agent Tree's `root` |
| `selectable` | `selectable` | `boolean` | `false` | Agent cards are buttons that fire tc-select |
| `resolver` | – | `((agent: TreeAgent, action: AgentTreeResolution) => void \| Promise<unknown>) \| undefined` | `undefined` | Answers from the tree's "needs you" and "failed" windows; it may return a promise – the Agent Tree's `resolver` |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – dollars by default, e.g. "$0.42" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | The status filter changed ({ filter }: MissionFilterChange); cancelable – prevented, `filter` stays as it was |

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `filterAgentTree(root: TreeAgent, filter: MissionFilter): TreeAgent` | The agents of `root` with the filter's status, and every agent above one of them |

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
| `root` | `el.root = …;` | `<… root={…} />` | `<tc-mission-control :root="…">` | `<tc-mission-control [root]="…">` | `<tc-mission-control {root}>` |
| `resolver` | `el.resolver = …;` | `<… resolver={…} />` | `<tc-mission-control :resolver="…">` | `<tc-mission-control [resolver]="…">` | `<tc-mission-control {resolver}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-mission-control :formatCost="…">` | `<tc-mission-control [formatCost]="…">` | `<tc-mission-control {formatCost}>` |

*Also attributes: `selectable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

### Controlled

`tc-filter-change` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-mission-control")` returns a `TcMissionControl` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";`
- **React / Next.js:** Props: `import type { MissionControlProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MissionControl>`. The element class, for refs: `import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMissionControl["root"]` with `import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";`
- **Angular:** The directive types the template: `[root]` takes `TcMissionControl["root"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMissionControl } from "@adamstavely/trenchcoat/mission-control";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading (default "Mission control") |
| `filter` | `MissionFilter` | Which agents show: "all", "running", "waiting" or "failed". Controlled when defined |
| `defaultFilter` | `MissionFilter` | The filter at first when uncontrolled – "all" by default |
| `onFilterChange` | `(filter: MissionFilter) => void` | Called with the new filter |
| `onSelectAgent` | `(agent: TreeAgent) => void` | A click on an agent card – the cards are buttons when given |
| `onResolve` | `TcMissionControl["resolver"]` | An answer from the tree's "needs you" or "failed" window; it may return a promise |
| `onDecide` | `TcMissionControl["decide"]` | A decision on the side was answered; it may return a promise |

*Renamed or hidden on the wrapper: `heading`, `filter`, `resolver`, `decide`, `selectable`, `onSelect`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the filter, the tree's buttons and the decisions' answers |
| ← / → | In the filter, picks the previous or next status |
| Enter / Space | Picks a status, folds a branch, opens “needs you” or “failed” in the tree, or gives an answer |
| Escape | In the tree's window: closes it and returns focus to the button that opened it |

The tree and the inbox keep their own keys.

### Screen readers

The heading is the block's heading. The filter is a radio group named “Show agents”, each status with its count of
agents. “Since you looked” is a region named by its title; the chart is an image named “What happened, over time”
followed by the line in words, and the legend is hidden. What needs you is a complementary region named “Needs you”.
The tree and the inbox announce their own changes.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | agent-tree, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | agent-tree | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | agent-tree, internal/mission, decision-inbox, agent-recap | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | agent-tree, internal/controllers, decision-inbox | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | agent-tree, internal/kit, decision-inbox, segmented-control, agent-recap | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | agent-tree | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | agent-recap | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | agent-tree, segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | agent-tree, internal/base, internal/mission, decision-inbox, segmented-control, agent-recap, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | agent-tree, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers, agent-recap | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, internal/mission, agent-recap, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 3.6 KB | 1.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/mission` · Shared Trenchcoat code | 8.2 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.6 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| [agent-tree](../components/agent-tree.md) · Element it renders | 47.1 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [agent-recap](../components/agent-recap.md) · Element it renders | 21.8 KB | – |
| [decision-inbox](../components/decision-inbox.md) · Element it renders | 16.2 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **145.3 KB** | **36.6 KB** |
| With Lit – the first component on a page | 167.1 KB | 43.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | default properties, 92 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **42 frames/s** on screen, **nothing** scrolled away, **42 frames/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (agent-tree), `requestAnimationFrame, cancelled` (segmented-control), `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- Timers: `setInterval, cleared` (agent-tree), `setTimeout` (agent-tree), `setTimeout` (decision-inbox), `setTimeout` (segmented-control).
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver` (agent-tree), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController), `ResizeObserver` (segmented-control), `IntersectionObserver` (agent-recap).
- Listens on the page: `document visibilitychange` (agent-tree), `document pointerdown` (agent-tree), `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()` (agent-tree), `performance.now()` (agent-tree), `Date.now()` (agent-recap), `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role in the work (“Scheduler”, “Translator”), and put the model in `model`.
- Set `agentId` on each event and decision, so the filter keeps it with its agent. Without one, it shows only under
  All.
- Give each event a short `label` – “Glossary file couldn't be read” – for the moments worth a marker.
- Set `since` to the last time the person looked, and `now` to the end of the period. The block reads no clock of
  its own.
- Rename the words with `labels`, e.g. `{ sinceTitle: "Overnight" }`.

## Do and don't

### Do

- Keep the filter controlled when the page shows it elsewhere: listen for `tc-filter-change` (`onFilterChange` in
  React).
- Return a promise from `decide` (`onDecide`) and `resolver` (`onResolve`) so answers wait and a failure is shown.
- Set `selectable` (`onSelectAgent` in React) when a card opens the agent's log, and listen for `tc-select`.

### Don't

- Don't leave out `agentId` on decisions – a filter for Waiting would hide them all.
- Don't send everything that happened as events; send what the person would want to know.
- Don't put it in a card – it's a page section.

## Related

- [Agent Tree](../components/agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Decision Inbox](../components/decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Agent Recap](../components/agent-recap.md) – What your agents did while you were away, for a home page – a small chart of the period with a bar per 15 or 30 minutes stacked by done, failed and needs you and a marker on each notable event, then Needs you, Failed and Done as columns acted on in place, items gliding out as they're handled, and Clear done
- [Mission Timeline](mission-timeline.md) – The home of an agent product on one clock – what happened since you looked, every agent on its own lane of a live timeline, and what needs you, under one status filter for all three (uses `agent-lanes`, `decision-inbox`, `segmented-control`)
- [Agent Lanes](../components/agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
