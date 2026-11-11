<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Lanes

**Agents**

Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block

- **Element:** `<tc-agent-lanes>`
- **Size:** 13.4 KB gzip · 45.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-lanes";` |
| React / Next.js | `import { AgentLanes } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-lanes";` · tags starting with tc- are custom elements |
| Angular | `import { AgentLanes } from "@adamstavely/trenchcoat/angular/agent-lanes";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-lanes";` |

## Example

The live example is in the gallery at `#/agent-lanes`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A live timeline of a team of agents: one lane per agent, its tasks as blocks along the time they took, and a “now”
line on the right that the window slides towards. It answers “what is every agent doing right now, and who needs
me?” – the running task grows into now and shimmers, a task waiting for a person pulses amber with a “Needs you”
flag, and a click on it opens Approve and Reject in place. Hand-offs between agents are drawn as thin curves, and
any other block opens a short summary of what got done.

### When to use

- Supervising several agents that work in parallel and hand work to each other.
- Approving the steps that need a person without leaving the overview.
- Seeing how long tasks take and where a run is stuck, over the last half hour or so.

### When not to use

- Who calls which tool, as a network – use [Agent Graph](agent-graph.md).
- The spans of a single run, measured to the millisecond – use [Trace Waterfall](trace-waterfall.md).
- One agent's plan, step by step – use [Agent Plan](agent-plan.md).
- One decision that needs full context and a written reason – use [Approval Card](approval-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Agent** `.ui-al__agent` – the lane's avatar, name, model and current state
3. **Block** `.ui-al__block` – one task across the time it took; opens its details or decision
4. **Time scale** `.ui-al__grid` – minutes ago, along the top and down the lanes
5. **Hand-offs** `.ui-al__curves` – curves from the end of one task to the next agent's task
6. **Now** `.ui-al__now > span` – the right edge of the window
7. **Pause** `.ui-al__pause` – holds the timeline still

## Looks

Standard puts the header on the gray tray above a white card with the lanes. Clean is one white card with the
header as its first row. Both slide the same timeline, use the same colours for running, waiting and failed tasks,
and open the same decision and details.

## Usage

### HTML

```html
<tc-agent-lanes id="lanes" heading="Release crew"></tc-agent-lanes>

<script type="module">
  import "@adamstavely/trenchcoat/agent-lanes";
  import "@adamstavely/trenchcoat/tokens.css";

  const lanes = document.querySelector("#lanes");
  const now = Date.now();
  lanes.agents = [
    { id: "code", name: "Coder", model: "Sonnet 5" },
    { id: "ops", name: "Release", model: "Haiku 5" },
  ];
  lanes.tasks = [
    {
      id: "c1",
      agentId: "code",
      title: "Implement theme tokens",
      status: "done",
      start: now - 20 * 60000,
      end: now - 8 * 60000,
      handoffTo: "o1",
    },
    {
      id: "o1",
      agentId: "ops",
      title: "Ship v3.8",
      status: "waiting",
      start: now - 6 * 60000,
      ask: "Deploy v3.8 to production?",
    },
  ];
  lanes.onApprove = (task) => fetch(`/api/tasks/${task.id}/approve`, { method: "POST" });
  lanes.addEventListener("tc-expanded-change", (e) => console.log(e.detail.expanded));
</script>
```

### React / Next.js

```tsx
import { AgentLanes, type LaneAgent, type LaneTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents: LaneAgent[] = [
  { id: "code", name: "Coder", model: "Sonnet 5" },
  { id: "ops", name: "Release", model: "Haiku 5" },
];

export function ReleaseCrew({ tasks, approve }: { tasks: LaneTask[]; approve: (id: string) => Promise<void> }) {
  return <AgentLanes title="Release crew" agents={agents} tasks={tasks} onApprove={(task) => approve(task.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-lanes";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";

defineProps<{ agents: TcAgentLanes["agents"]; tasks: TcAgentLanes["tasks"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-lanes :agents="agents" :tasks="tasks" @tc-expanded-change="onExpandedChange"></tc-agent-lanes>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentLanes } from "@adamstavely/trenchcoat/angular/agent-lanes";
import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";

@Component({
  selector: "app-agent-lanes-example",
  imports: [AgentLanes],
  template: `<tc-agent-lanes [agents]="agents()" [tasks]="tasks()" (tc-expanded-change)="onExpandedChange($event)"></tc-agent-lanes>`,
})
export class AgentLanesExample {
  readonly agents = input.required<TcAgentLanes["agents"]>();
  readonly tasks = input.required<TcAgentLanes["tasks"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-lanes";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";

  let { agents, tasks }: { agents: TcAgentLanes["agents"]; tasks: TcAgentLanes["tasks"] } = $props();
  let el: TcAgentLanes;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-agent-lanes bind:this={el} {agents} {tasks}></tc-agent-lanes>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agents` | – | `LaneAgent[]` | `[]` | The agents, one lane each from top to bottom – name, model and an optional avatar |
| `tasks` | – | `LaneTask[]` | `[]` | The tasks – always the source of truth. After Approve or Reject the block shows the result right away; as soon as you pass that task with a new status, start or end, your version wins |
| `span` | `span` | `` | – | How much time the lanes show, in ms (default 30 minutes) |
| `now` | `now` | `number \| undefined` | `undefined` | A clock you control, in epoch ms. Without it the lanes follow real time |
| `rate` | `rate` | `number \| undefined` | `undefined` | How fast the clock runs, in clock ms per real ms: on from `now` when set (default 0), from real time otherwise (default 1) |
| `onApprove` | – | `LaneTaskHandler \| undefined` | `undefined` | Called on Approve – may return a promise the decision waits for |
| `onReject` | – | `LaneTaskHandler \| undefined` | `undefined` | Called on Reject – may return a promise the decision waits for |
| `openable` | `openable` | `boolean` | `false` | Shows "Open" in a block's details; pressing it fires tc-open |
| `paused` | `paused` | `boolean` | `false` | Whether the timeline is held still. Changed by the Pause button unless a tc-paused-change listener calls preventDefault(). The lanes also hold still while the pointer or focus is on them (WCAG 2.2.2) |
| `expanded` | – | `string \| null` | `null` | The id of the block whose decision or details are open (null: none). Changed by the user unless a tc-expanded-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Agents"` | The title on the summary bar |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | A block's decision or details open or close ({ expanded: string \| null }); cancelable |
| `tc-paused-change` | – | Yes | The Pause button holds or resumes the timeline ({ paused: boolean }); cancelable |
| `tc-open` | – | No | "Open" in a block's details was pressed ({ task: LaneTask }); shown when `openable` is set |

#### Design tokens it reads (100)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-agent-lanes-rail`, `--tc-agent-lanes-row`, `--tc-agent-lanes-run-bg`, `--tc-agent-lanes-run-edge`, `--tc-agent-lanes-run-fg`, `--tc-agent-lanes-tip-soft`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-agent-lanes :agents="…">` | `<tc-agent-lanes [agents]="…">` | `<tc-agent-lanes {agents}>` |
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-agent-lanes :tasks="…">` | `<tc-agent-lanes [tasks]="…">` | `<tc-agent-lanes {tasks}>` |
| `onApprove` | `el.onApprove = …;` | `<… onApprove={…} />` | `<tc-agent-lanes :onApprove="…">` | `<tc-agent-lanes [onApprove]="…">` | `<tc-agent-lanes {onApprove}>` |
| `onReject` | `el.onReject = …;` | `<… onReject={…} />` | `<tc-agent-lanes :onReject="…">` | `<tc-agent-lanes [onReject]="…">` | `<tc-agent-lanes {onReject}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-agent-lanes :expanded="…">` | `<tc-agent-lanes [expanded]="…">` | `<tc-agent-lanes {expanded}>` |

*Also attributes: `span`, `now`, `rate`, `openable`, `paused`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `onPausedChange={…}` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

### Controlled

The element changes `paused` and `expanded` itself unless a listener calls `preventDefault()` on `tc-paused-change` or `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-lanes id="agent-lanes"></tc-agent-lanes>

<script type="module">
  import "@adamstavely/trenchcoat/agent-lanes";

  const el = document.querySelector("#agent-lanes");
  el.addEventListener("tc-paused-change", (e) => {
    e.preventDefault(); // the element keeps its paused…
    if (allowed(e.detail.paused)) el.paused = e.detail.paused; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentLanes } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentLanes>;
type Props = Omit<Own, "paused" | "onPausedChange"> & { initial: NonNullable<Own["paused"]> };

// Controlled: passing paused makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentLanes({ initial, ...props }: Props) {
  const [paused, setPaused] = useState<Own["paused"]>(initial);
  return <AgentLanes {...props} paused={paused} onPausedChange={(next) => setPaused(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-lanes";
import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";

const props = defineProps<{ initial: TcAgentLanes["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcAgentLanes["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-agent-lanes :paused="paused" @tc-paused-change="onPausedChange"></tc-agent-lanes>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentLanes } from "@adamstavely/trenchcoat/angular/agent-lanes";
import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";

@Component({
  selector: "app-controlled-agent-lanes",
  imports: [AgentLanes],
  template: `<tc-agent-lanes [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-agent-lanes>`,
})
export class ControlledAgentLanes {
  readonly initial = input.required<TcAgentLanes["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcAgentLanes["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-lanes";
  import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";

  let { initial }: { initial: TcAgentLanes["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcAgentLanes;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcAgentLanes["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-agent-lanes bind:this={el} {paused}></tc-agent-lanes>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-lanes")` returns a `TcAgentLanes` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";`
- **React / Next.js:** Props: `import type { AgentLanesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentLanes>`. The element class, for refs: `import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentLanes["agents"]` with `import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";`
- **Angular:** The directive types the template: `[agents]` takes `TcAgentLanes["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentLanes } from "@adamstavely/trenchcoat/agent-lanes";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `agents` | `LaneAgent[]` | The agents, one lane each from top to bottom; avatars can be React nodes |
| `tasks` | `LaneTask[]` | The tasks – always the source of truth. After Approve or Reject the block shows the result right away; as soon as you pass that task with a new status, start or end, your version wins |
| `onApprove` | `LaneTaskHandler` | Called on Approve in a waiting task's decision – may return a promise the decision waits for |
| `onReject` | `LaneTaskHandler` | Called on Reject in a waiting task's decision – may return a promise the decision waits for |
| `onOpen` | `(task: LaneTask) => void` | Shows "Open" in a block's tooltip |
| `paused` | `boolean` | Whether the timeline is held still (controlled) |
| `defaultPaused` | `boolean` | Whether the timeline starts held still, when `paused` isn't set |
| `onPausedChange` | `(paused: boolean) => void` | Called when the Pause button is pressed, with the new paused state |
| `expanded` | `string \| null` | The id of the block whose decision or tooltip is open. Controlled when defined (null = none) |
| `defaultExpanded` | `string \| null` | The block open at first, when `expanded` isn't set |
| `onExpandedChange` | `(id: string \| null) => void` | Called with a block's id when its decision or details open, and null when they close |
| `title` | `string` | The title on the summary bar – "Agents" by default |

*Renamed or hidden on the wrapper: `agents`, `tasks`, `heading`, `openable`, `paused`, `expanded`, `onApprove`, `onReject`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Pause, then through the blocks lane by lane; in an open decision, to Reject and Approve |
| Enter / Space | On a block: opens or closes its decision (waiting tasks) or its details; a decision puts focus on Approve |
| Escape | Closes the open decision or details and returns focus to its block |

The timeline holds still while the pointer or focus is on it, so a block never slides away mid-action. A pointer
press outside closes the decision or details.

### Screen readers

Each lane is a list named “Coder's tasks”; each block is a button named with the agent, the task, its state and its
time – “Coder: Implement theme tokens – Done, took 15m” – with `aria-expanded`. A decision is a `dialog` named
“Decide: Ship v3.8”; if the handler fails, an alert says “Didn't go through – try again”. Details are a group named
“Implement theme tokens – details”. A polite live region keeps the count current: “3 running”, or “2 tasks need you”
once anything waits. Pause is a toggle button, “Pause timeline”, with `aria-pressed`, shown only while the clock
moves.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 37.0 KB | 10.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **45.5 KB** | **13.4 KB** |
| With Lit – the first component on a page | 68.1 KB | 20.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 115 DOM nodes – to layout, median of 7 |
| Typical update | **1.4 ms** | one item of tasks replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | tasks: first render, 856 nodes; update 3.9 ms |
| 1,000 items | 51 ms | tasks: first render, 7,876 nodes; update 24 ms |

1,000 items of tasks: 51 ms. It renders every item, so a first render passes 50 ms (a long task) at about 980 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 5 React commits (clean), 5 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **60 frames/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 3 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`, `document pointerdown`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their job (“Planner”, “Reviewer”) and put the model in `model`.
- Title tasks as short actions: “Implement theme tokens”, “Ship v3.8” – they are cut to the block's width.
- Write `ask` as the exact question: “Deploy v3.8 to production and post the release notes in #releases?”.
- Keep `summary` to two or three short lines of what got done: “Added 48 tokens”.

## Do and don't

### Do

- Leave `end` out while a task runs or waits, so its block reaches now.
- Pass the task back with its new status after Approve or Reject – your version replaces the one the lanes show.
- Return a promise from `onApprove` and `onReject` when the decision goes to a server, so a failure is shown.
- Set `span` to the stretch of time that matters – long runs need a wider window.

### Don't

- Don't use more than about six lanes – people can't follow more at once.
- Don't rely on the amber colour alone in your own surrounding UI; the flag and the count already say “Needs you”.
- Don't put a task in `tasks` for an agent that isn't in `agents` – it has no lane to sit in.

## Related

- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row

## Changelog

- agent-lanes says "1 task needs you" (was "1 task need you").
- agent-lanes `rate`: how fast its clock runs, in clock ms per real ms (0 with `now`, 1 without – as before).
