<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Delegate Board

**Agents**

Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first

- **Element:** `<tc-delegate-board>`
- **Size:** 13.7 KB gzip · 48.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/delegate-board";` |
| React / Next.js | `import { DelegateBoard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/delegate-board";` · tags starting with tc- are custom elements |
| Angular | `import { DelegateBoard } from "@adamstavely/trenchcoat/angular/delegate-board";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/delegate-board";` |

## Example

The live example is in the gallery at `#/delegate-board`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A board for handing work to agents. New tasks wait on the left under “Unassigned”; the agents sit on the right with
their model, a “Free” or “Busy until 14:32” tag and their queue as small chips, the running task first. Drag a task
onto an agent and the agent previews what it would add (“+12m until 14:44”, and the price when the agent has a
rate); drop it and the card glides into the queue. Queued chips can be dragged to another agent or back to
“Unassigned”. Everything works without a pointer too, and the Auto switch hands every new task to whoever is free
first.

### When to use

- People route work between several agents, and how busy each one is decides where a task should go.
- A router suggests an agent, and a person confirms or overrides it (`suggestion`).
- Showing what each agent has queued, with the running task first, next to the work still waiting.

### When not to use

- One agent's queue on its own, to reorder or cancel – use [Agent Queue](agent-queue.md).
- Following several agents' runs side by side as they work – use [Agent Lanes](agent-lanes.md).
- An overview of the agents themselves, their roles and state – use [Agent Team](../illustrations/agent-team.md).
- Assigning many items at once by column or filter – use [Data Table](data-table.md) with an assignee column.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the heading, a hint about what to do under it, and the Auto switch
2. **Unassigned** `.ui-db__pile` – the tasks waiting for an agent, with their count
3. **Task** `.ui-db__task` – one waiting task: title, tool logos and rough minutes
4. **Agent** `.ui-db__agent` – an agent's mark, name, model and rate, and the number key that picks it
5. **Load** `.ui-db__tag` – Free, Busy until, or the preview of a task on its way
6. **Queue chip** `.ui-db__chip` – a queued task; the first one, with a spinner, is running

## Looks

Standard puts the header on the gray tray above a white card that holds the two columns. Clean is one card with the
header as its first row. Both drag, preview and glide the same way.

## Usage

### HTML

```html
<tc-delegate-board id="board"></tc-delegate-board>

<script type="module">
  import "@adamstavely/trenchcoat/delegate-board";
  import "@adamstavely/trenchcoat/tokens.css";

  const board = document.querySelector("#board");
  board.agents = [
    { id: "research", name: "Research", model: "Claude Opus", current: 18, rate: 0.08 },
    { id: "review", name: "Code Review", model: "Claude Sonnet", rate: 0.04 },
  ];
  board.tasks = [
    { id: "t1", title: "Summarize churn interviews", estimate: 22, agentId: "research" },
    { id: "t2", title: "Draft release notes for 3.2", estimate: 12 },
  ];
  board.addEventListener("tc-assign", (e) => {
    const { taskId, agentId } = e.detail;
    board.tasks = board.tasks.map((t) => (t.id === taskId ? { ...t, agentId } : t));
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DelegateBoard, type DelegateAgent, type DelegateTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents: DelegateAgent[] = [
  { id: "research", name: "Research", model: "Claude Opus", current: 18, rate: 0.08 },
  { id: "review", name: "Code Review", model: "Claude Sonnet", rate: 0.04 },
];

export function Delegate() {
  const [tasks, setTasks] = useState<DelegateTask[]>([
    { id: "t1", title: "Summarize churn interviews", estimate: 22, agentId: "research" },
    { id: "t2", title: "Draft release notes for 3.2", estimate: 12 },
  ]);
  return (
    <DelegateBoard
      agents={agents}
      tasks={tasks}
      onAssign={(taskId, agentId) =>
        setTasks((list) => list.map((t) => (t.id === taskId ? { ...t, agentId } : t)))
      }
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/delegate-board";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";

defineProps<{ agents: TcDelegateBoard["agents"]; tasks: TcDelegateBoard["tasks"] }>();
const onAssign = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-delegate-board :agents="agents" :tasks="tasks" @tc-assign="onAssign"></tc-delegate-board>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DelegateBoard } from "@adamstavely/trenchcoat/angular/delegate-board";
import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";

@Component({
  selector: "app-delegate-board-example",
  imports: [DelegateBoard],
  template: `<tc-delegate-board [agents]="agents()" [tasks]="tasks()" (tc-assign)="onAssign($event)"></tc-delegate-board>`,
})
export class DelegateBoardExample {
  readonly agents = input.required<TcDelegateBoard["agents"]>();
  readonly tasks = input.required<TcDelegateBoard["tasks"]>();
  onAssign(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/delegate-board";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";

  let { agents, tasks }: { agents: TcDelegateBoard["agents"]; tasks: TcDelegateBoard["tasks"] } = $props();
  let el: TcDelegateBoard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-assign", on);
    return () => el.removeEventListener("tc-assign", on);
  });
</script>

<tc-delegate-board bind:this={el} {agents} {tasks}></tc-delegate-board>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agents` | – | `DelegateAgent[]` | `[]` | The agents work can go to, in the order they're listed (number keys 1–9 pick them) |
| `tasks` | – | `DelegateTask[]` | `[]` | Every task – without an `agentId` it waits under "Unassigned"; the first in each agent's queue is the running one |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for the "Busy until" times, in epoch ms – without it the board reads the clock while connected |
| `mode` | `mode` | `DelegateMode` | `"manual"` | Auto hands every unassigned task to the least busy agent on its own; Manual waits for a drag. Changed by the user unless a tc-mode-change listener calls preventDefault() |
| `suggestion` | – | `{ taskId: string; agentId: string } \| null \| undefined` | `undefined` | A suggested hand-off, e.g. from your router: the agent lights up and previews the new time, the task is marked |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats a cost from rate × minutes – defaults to dollars, e.g. "$0.60" |
| `heading` | `heading` | `string` | `"Delegate"` | The heading in the bar |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-assign` | – | No | A task was handed over or unassigned ({ taskId, agentId }: DelegateAssign, agentId null for unassigned) |
| `tc-mode-change` | – | Yes | The Auto switch was flipped ({ mode }: DelegateModeChange); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-delegate-board-target-bg` | `light-dark(rgba(0, 120, 245, 0.045), rgba(91, 154, 255, 0.08))` | standard, clean |

#### Design tokens it reads (87)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-ease-emphasized`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-drag`, `--tc-z-dropdown`

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-delegate-board :agents="…">` | `<tc-delegate-board [agents]="…">` | `<tc-delegate-board {agents}>` |
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-delegate-board :tasks="…">` | `<tc-delegate-board [tasks]="…">` | `<tc-delegate-board {tasks}>` |
| `suggestion` | `el.suggestion = …;` | `<… suggestion={…} />` | `<tc-delegate-board :suggestion="…">` | `<tc-delegate-board [suggestion]="…">` | `<tc-delegate-board {suggestion}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-delegate-board :formatCost="…">` | `<tc-delegate-board [formatCost]="…">` | `<tc-delegate-board {formatCost}>` |

*Also attributes: `now`, `mode`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-assign` | No | `el.addEventListener("tc-assign", (e) => …)` | `onAssign={…}` | `@tc-assign="…"` | `(tc-assign)="…($event)"` | `el.addEventListener("tc-assign", …)` |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `onModeChange={…}` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |

### Controlled

The element changes `mode` itself unless a listener calls `preventDefault()` on `tc-mode-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-delegate-board id="delegate-board"></tc-delegate-board>

<script type="module">
  import "@adamstavely/trenchcoat/delegate-board";

  const el = document.querySelector("#delegate-board");
  el.addEventListener("tc-mode-change", (e) => {
    e.preventDefault(); // the element keeps its mode…
    if (allowed(e.detail.mode)) el.mode = e.detail.mode; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { DelegateBoard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DelegateBoard>;
type Props = Omit<Own, "mode" | "onModeChange"> & { initial: NonNullable<Own["mode"]> };

// Controlled: passing mode makes the wrapper prevent the element's own change; the app sets it
export function ControlledDelegateBoard({ initial, ...props }: Props) {
  const [mode, setMode] = useState<Own["mode"]>(initial);
  return <DelegateBoard {...props} mode={mode} onModeChange={(next) => setMode(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/delegate-board";
import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";

const props = defineProps<{ initial: TcDelegateBoard["mode"] }>();
const mode = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onModeChange = (e: CustomEvent<{ mode: TcDelegateBoard["mode"] }>) => {
  e.preventDefault();
  mode.value = e.detail.mode;
};
</script>

<template>
  <tc-delegate-board :mode="mode" @tc-mode-change="onModeChange"></tc-delegate-board>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DelegateBoard } from "@adamstavely/trenchcoat/angular/delegate-board";
import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";

@Component({
  selector: "app-controlled-delegate-board",
  imports: [DelegateBoard],
  template: `<tc-delegate-board [mode]="mode()" (tc-mode-change)="onModeChange($event)"></tc-delegate-board>`,
})
export class ControlledDelegateBoard {
  readonly initial = input.required<TcDelegateBoard["mode"]>();
  readonly mode = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onModeChange(e: CustomEvent<{ mode: TcDelegateBoard["mode"] }>) {
    e.preventDefault();
    this.mode.set(e.detail.mode);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/delegate-board";
  import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";

  let { initial }: { initial: TcDelegateBoard["mode"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let mode = $derived(initial);
  let el: TcDelegateBoard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      mode = (e as CustomEvent<{ mode: TcDelegateBoard["mode"] }>).detail.mode;
    };
    el.addEventListener("tc-mode-change", on);
    return () => el.removeEventListener("tc-mode-change", on);
  });
</script>

<tc-delegate-board bind:this={el} {mode}></tc-delegate-board>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-delegate-board")` returns a `TcDelegateBoard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";`
- **React / Next.js:** Props: `import type { DelegateBoardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DelegateBoard>`. The element class, for refs: `import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDelegateBoard["agents"]` with `import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";`
- **Angular:** The directive types the template: `[agents]` takes `TcDelegateBoard["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDelegateBoard } from "@adamstavely/trenchcoat/delegate-board";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `agents` | `DelegateAgent[]` | The agents work can go to, in the order they're listed (number keys 1–9 pick them) |
| `tasks` | `DelegateTask[]` | Every task – without an `agentId` it waits under "Unassigned"; the first in each agent's queue is the running one |
| `onAssign` | `(taskId: string, agentId: string \| null) => void` | A drop, a keyboard pick or Auto. The board moves the task at once and keeps it there until `tasks` gives that task another agent – so `tasks` stays the source of truth, whether you handle the move or only listen to it |
| `mode` | `DelegateMode` | Auto hands every unassigned task to the least busy agent on its own; Manual waits for a drag. Controlled when defined |
| `defaultMode` | `DelegateMode` | The mode on mount when `mode` isn't controlled |
| `onModeChange` | `(mode: DelegateMode) => void` | Called with the new mode, controlled or not |
| `title` | `string` | The heading in the bar |

*Renamed or hidden on the wrapper: `agents`, `tasks`, `mode`, `heading`*

## Accessibility

### Keyboard

Tasks and queue chips are buttons; Tab moves between them, the “+N” chips and the Auto switch.

| Key | What it does |
|---|---|
| Enter / Space | On a task or chip: picks it up. While picked up: hands it to the chosen agent |
| ↓ / ↑ | While a task is picked up: chooses the next or previous agent – and “Unassigned” for a queued task – wrapping at the ends |
| Escape | Puts the picked-up task back; on a “+N” chip, hides its tooltip |
| 1 – 9 | Hands the focused task or chip to that agent at once |
| Delete / Backspace | On a queued chip: sends it back to “Unassigned” |

Focus follows a task to its new place after a hand-off.

### Screen readers

“Unassigned” and “Agents” are sections named by their headings, and each agent's queue is a list named “Research's
queue”. Every task and chip is described by the instructions (“Drag onto an agent, or click it and then click an
agent. With the keyboard: Enter picks it up, the arrow keys choose…”); the running chip starts with “Running:”. A
polite status follows each step: “Picked up Draft release notes for 3.2. Choose an agent with the arrow keys and
press Enter, or click an agent.” with the first agent's preview, then each choice (“Code Review: +12 min, until
14:44”), the hand-off (“Draft release notes for 3.2 → Code Review”), “… is unassigned again” or “Put back”. Auto is
a `switch` with `aria-checked`. A “+2” chip is named “+2 more tasks”, has `aria-expanded`, and its tooltip lists the
hidden tasks.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 40.1 KB | 11.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **48.5 KB** | **13.8 KB** |
| With Lit – the first component on a page | 71.2 KB | 21.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 169 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of tasks replaced |
| First on the page | 9.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.0 ms | tasks: first render, 1,601 nodes; update 3.6 ms |
| 1,000 items | 57 ms | tasks: first render, 15,495 nodes; update 38 ms |

1,000 items of tasks: 57 ms. It renders every item, so a first render passes 50 ms (a long task) at about 870 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window keydown`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write task titles as the job, starting with a verb: “Review PR #482”, “Tag 40 new support tickets”.
- Keep estimates rough – the board shows them as “~12 min” – and update `current` as the running task goes.
- Name agents by what they do (“Research”, “Code Review”) and put the model in `model`.
- Set `rate` only when cost matters for the choice; then the board shows the price of each hand-off and what's
  queued in total.

## Do and don't

### Do

- Keep `tasks` the source of truth: update a task's `agentId` from `tc-assign`, and the board follows.
- Pass `now` when the page already has a clock, so every “Busy until” time agrees with it.
- List agents in a stable order – the number keys follow it.

### Don't

- Don't use it for more than nine agents if people rely on the number keys.
- Don't turn Auto on for work that needs a person to choose – it hands tasks out one after another without asking.
- Don't hide estimates; the previews and “Busy until” times are built from them.

## Related

- [Agent Queue](agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Agent Team](../illustrations/agent-team.md) – A prompt types itself and branches out into three agents, each with a role and overlapping tool logos – three times, then the team stays
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
