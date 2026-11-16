<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Mission Timeline

**Blocks** · New

The home of an agent product on one clock – what happened since you looked, every agent on its own lane of a live timeline, and what needs you, under one status filter for all three (uses `agent-lanes`, `decision-inbox`, `segmented-control`)

- **Element:** `<tc-mission-timeline>`
- **Size:** 34.4 KB gzip · 132.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/mission-timeline";` |
| React / Next.js | `import { MissionTimeline } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/mission-timeline";` · tags starting with tc- are custom elements |
| Angular | `import { MissionTimeline } from "@adamstavely/trenchcoat/angular/mission-timeline";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/mission-timeline";` |

## Example

The live example is in the gallery at `#/blocks/mission-timeline`, in both looks; Replay restarts its animations.

## Overview

The home of an agent product on one clock. The same frame as Mission Control – “Since you looked” on top, what needs
you on the side, one status filter for all three – but the middle is every agent on its own lane of a live timeline,
in the library's Agent Lanes. An agent's status is read from its tasks: running while any task runs, else waiting
while any waits, else failed when its latest task failed, else done. The filter keeps the lanes of the agents with
that status, and the events and decisions whose `agentId` it kept. Narrow, it stacks with what needs you first.

### When to use

- The landing page of a product where several agents work side by side and hand work to each other.
- Seeing who is busy now, who waits on whom, and where a hand-off went.
- Answering the decisions agents are waiting on beside the lanes they come from.

### When not to use

- When who started whom matters more than when – use [Mission Control](mission-control.md).
- The lanes on their own, without the period or the decisions – use [Agent Lanes](../components/agent-lanes.md).
- Only the decisions – use [Decision Inbox](../components/decision-inbox.md).
- Only what happened while you were away – use [Agent Recap](../components/agent-recap.md).

## Anatomy

1. **Intro** `[data-ui="mtl"] > header` – the heading and the status filter
2. **Since you looked** `[data-ui="mtl"] > section` – the title, the line in words, the chart and its legend
3. **Chart** `[data-ui="mtl"] > section > svg` – the period in bins, stacked by done, failed and needs you
4. **Agents** `tc-agent-lanes` – a lane per agent, filtered
5. **Needs you** `[data-ui="mtl"] > div > aside` – the Decision Inbox, filtered

## Looks

The block is a page section, not a card. “Since you looked” sits on the gray tray in Standard and on a white card in
Clean; the lanes and the inbox carry the look the rest of the way. Clean sets the heading in a lighter weight. Lanes
wider than the room scroll inside the block, never the page.

## Usage

### HTML

```html
<tc-mission-timeline id="mission"></tc-mission-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/mission-timeline";
  import "@adamstavely/trenchcoat/tokens.css";

  const T = Date.UTC(2026, 10, 14, 6, 0);
  const MIN = 60_000;
  const mission = document.querySelector("#mission");
  mission.since = T - 30 * MIN;
  mission.now = T;
  mission.agents = [
    { id: "planner", name: "Planner", model: "Sonnet 5.5" },
    { id: "scheduler", name: "Scheduler", model: "Opus 5.5" },
  ];
  mission.tasks = [
    { id: "p1", agentId: "planner", title: "List changed stops", status: "done", start: T - 28 * MIN, end: T - 19 * MIN, handoffTo: "s1" },
    { id: "s1", agentId: "scheduler", title: "Route 31 last run", status: "waiting", start: T - 18 * MIN, ask: "Publish 23:10 instead of 23:40?" },
  ];
  mission.events = [
    { at: T - 19 * MIN, kind: "done", agentId: "planner", label: "Stop list ready" },
    { at: T - 18 * MIN, kind: "needs-you", agentId: "scheduler" },
  ];
  mission.decisions = [
    { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", detail: "23:40 becomes 23:10", primary: "Publish", secondary: "Ask the depot" },
  ];
  mission.onApprove = (task) => console.log("approve", task.id);
  mission.onReject = (task) => console.log("reject", task.id);
  mission.addEventListener("tc-filter-change", (e) => console.log(e.detail.filter));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MissionTimeline, type MissionDecision, type MissionFilter, type MissionLaneAgent, type MissionLaneTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;

const agents: MissionLaneAgent[] = [
  { id: "planner", name: "Planner", model: "Sonnet 5.5" },
  { id: "scheduler", name: "Scheduler", model: "Opus 5.5" },
];
const tasks: MissionLaneTask[] = [
  { id: "p1", agentId: "planner", title: "List changed stops", status: "done", start: T - 28 * MIN, end: T - 19 * MIN, handoffTo: "s1" },
  { id: "s1", agentId: "scheduler", title: "Route 31 last run", status: "waiting", start: T - 18 * MIN, ask: "Publish 23:10 instead of 23:40?" },
];
const decisions: MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish route 31's earlier last run?", primary: "Publish", secondary: "Ask the depot" },
];

export function Home() {
  const [filter, setFilter] = useState<MissionFilter>("all");
  return (
    <MissionTimeline
      agents={agents}
      tasks={tasks}
      decisions={decisions}
      since={T - 30 * MIN}
      now={T}
      filter={filter}
      onFilterChange={setFilter}
      onOpenTask={(task) => console.log(task.id)}
      onDecide={(decision, answer) => console.log(decision.id, answer)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/mission-timeline";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";

defineProps<{ agents: TcMissionTimeline["agents"]; tasks: TcMissionTimeline["tasks"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-mission-timeline :agents="agents" :tasks="tasks" @tc-filter-change="onFilterChange"></tc-mission-timeline>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MissionTimeline } from "@adamstavely/trenchcoat/angular/mission-timeline";
import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";

@Component({
  selector: "app-mission-timeline-example",
  imports: [MissionTimeline],
  template: `<tc-mission-timeline [agents]="agents()" [tasks]="tasks()" (tc-filter-change)="onFilterChange($event)"></tc-mission-timeline>`,
})
export class MissionTimelineExample {
  readonly agents = input.required<TcMissionTimeline["agents"]>();
  readonly tasks = input.required<TcMissionTimeline["tasks"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/mission-timeline";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";

  let { agents, tasks }: { agents: TcMissionTimeline["agents"]; tasks: TcMissionTimeline["tasks"] } = $props();
  let el: TcMissionTimeline;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-mission-timeline bind:this={el} {agents} {tasks}></tc-mission-timeline>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agents` | – | `LaneAgent[]` | `[]` | One lane per agent – Agent Lanes' `agents` |
| `tasks` | – | `LaneTask[]` | `[]` | The agents' tasks – Agent Lanes' `tasks` |
| `span` | `span` | `number \| undefined` | `SPAN` | How much time the timeline shows, in ms – 30 minutes by default, also when set to undefined |
| `rate` | `rate` | `number \| undefined` | `undefined` | How fast the timeline's clock runs against real time, for demos – Agent Lanes' `rate` |
| `onApprove` | – | `LaneTaskHandler \| undefined` | `undefined` | Approve on a waiting task; it may return a promise |
| `onReject` | – | `LaneTaskHandler \| undefined` | `undefined` | Reject on a waiting task; it may return a promise |
| `openable` | `openable` | `boolean` | `false` | A task's details show Open, which fires tc-open |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | The status filter changed ({ filter }: MissionFilterChange); cancelable – prevented, `filter` stays as it was |

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `laneAgentStatuses(agents: LaneAgent[], tasks: LaneTask[]): void` | Each agent's status from its tasks: running, waiting, failed (its latest task) or done |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-mission-timeline :agents="…">` | `<tc-mission-timeline [agents]="…">` | `<tc-mission-timeline {agents}>` |
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-mission-timeline :tasks="…">` | `<tc-mission-timeline [tasks]="…">` | `<tc-mission-timeline {tasks}>` |
| `onApprove` | `el.onApprove = …;` | `<… onApprove={…} />` | `<tc-mission-timeline :onApprove="…">` | `<tc-mission-timeline [onApprove]="…">` | `<tc-mission-timeline {onApprove}>` |
| `onReject` | `el.onReject = …;` | `<… onReject={…} />` | `<tc-mission-timeline :onReject="…">` | `<tc-mission-timeline [onReject]="…">` | `<tc-mission-timeline {onReject}>` |

*Also attributes: `span`, `rate`, `openable` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-mission-timeline")` returns a `TcMissionTimeline` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";`
- **React / Next.js:** Props: `import type { MissionTimelineProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MissionTimeline>`. The element class, for refs: `import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMissionTimeline["agents"]` with `import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";`
- **Angular:** The directive types the template: `[agents]` takes `TcMissionTimeline["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMissionTimeline } from "@adamstavely/trenchcoat/mission-timeline";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading (default "Mission timeline") |
| `filter` | `MissionFilter` | Which agents show: "all", "running", "waiting" or "failed". Controlled when defined |
| `defaultFilter` | `MissionFilter` | The filter at first when uncontrolled – "all" by default |
| `onFilterChange` | `(filter: MissionFilter) => void` | Called with the new filter |
| `onOpenTask` | `(task: LaneTask) => void` | "Open" in a task's details – shown when given |
| `onDecide` | `TcMissionTimeline["decide"]` | A decision on the side was answered; it may return a promise |

*Renamed or hidden on the wrapper: `heading`, `filter`, `decide`, `openable`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the filter, Pause, the task blocks lane by lane and the decisions' answers |
| ← / → | In the filter, picks the previous or next status |
| Enter / Space | Picks a status, opens a task's decision or details, or gives an answer |
| Escape | In a task's decision or details: closes it and returns focus to its block |

The lanes and the inbox keep their own keys. The timeline holds still while the pointer or focus is on it.

### Screen readers

The heading is the block's heading. The filter is a radio group named “Show agents”, each status with its count of
agents. “Since you looked” is a region named by its title; the chart is an image named “What happened, over time”
followed by the line in words, and the legend is hidden. What needs you is a complementary region named “Needs you”.
The lanes and the inbox announce their own changes.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | agent-lanes, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | agent-lanes, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | agent-lanes, agent-recap, internal/mission | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | agent-lanes, internal/kit, agent-recap | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | agent-lanes | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | agent-lanes, agent-recap | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | agent-lanes | – |
| :is() and :where() | 88 | 78 | 14 | 14 | agent-lanes, internal/base, agent-recap, internal/mission, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | agent-lanes, agent-recap | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | agent-lanes | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, agent-recap, internal/mission, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 4.0 KB | 2.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.7 KB | – |
| `internal/mission` · Shared Trenchcoat code | 8.2 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| [agent-lanes](../components/agent-lanes.md) · Element it renders | 34.5 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [agent-recap](../components/agent-recap.md) · Element it renders | 21.7 KB | – |
| [decision-inbox](../components/decision-inbox.md) · Element it renders | 16.2 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **132.5 KB** | **34.4 KB** |
| With Lit – the first component on a page | 154.4 KB | 41.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | default properties, 93 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | re-render with the same data |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **60 frames/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (agent-lanes), `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- Timers: `setTimeout` (agent-lanes).
- 3 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver` (agent-lanes), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (agent-recap).
- Listens on the page: `document visibilitychange` (agent-lanes), `document pointerdown` (agent-lanes).
- Reads the clock: `Date.now()` (agent-lanes), `Date.now()` (agent-recap), `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role in the work (“Scheduler”, “Translator”), and put the model in `model`.
- Keep task titles to a few words – “Draft timetables” – and write `ask` as a question for Approve or Reject.
- Set `agentId` on each event and decision, so the filter keeps it with its agent. Without one, it shows only under
  All.
- Set `since` to the last time the person looked and `now` to the moment shown; `span` sets how much time the lanes
  show, 30 minutes by default.
- Rename the words with `labels`, e.g. `{ agents: "Crew" }`.

## Do and don't

### Do

- Keep the filter controlled when the page shows it elsewhere: listen for `tc-filter-change` (`onFilterChange` in
  React).
- Return a promise from `onApprove`, `onReject` and `decide` (`onDecide` in React) so answers wait and a failure is
  shown.
- Set `openable` (`onOpenTask` in React) when a task can open its log, and listen for `tc-open`.

### Don't

- Don't set a task's `end` while it runs or waits – it reaches `now` on its own.
- Don't leave out `agentId` on decisions – a filter for Waiting would hide them all.
- Don't put it in a card – it's a page section.

## Related

- [Agent Lanes](../components/agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Decision Inbox](../components/decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Agent Recap](../components/agent-recap.md) – What your agents did while you were away, for a home page – a small chart of the period with a bar per 15 or 30 minutes stacked by done, failed and needs you and a marker on each notable event, then Needs you, Failed and Done as columns acted on in place, items gliding out as they're handled, and Clear done
- [Mission Control](mission-control.md) – The home of an agent product – what happened since you looked as a small chart and a line in words, who runs under whom, and what needs you on the side, with one status filter (All, Running, Waiting, Failed) for all three; narrow, what needs you comes first (uses `agent-tree`, `decision-inbox`, `segmented-control`)
- [Agent Tree](../components/agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
