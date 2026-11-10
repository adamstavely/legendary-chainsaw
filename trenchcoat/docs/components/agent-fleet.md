<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Fleet

**Agents** · New

Several top-level agents side by side – each card sums up its sub-agents in words, with status, cost and time, and a click opens its tree beside it while the last one folds back into its card

- **Element:** `<tc-agent-fleet>`
- **Size:** 20.3 KB gzip · 78.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-fleet";` |
| React / Next.js | `import { AgentFleet } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-fleet";` · tags starting with tc- are custom elements |
| Angular | `import { AgentFleet } from "@adamstavely/trenchcoat/angular/agent-fleet";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-fleet";` |

## Example

The live example is in the gallery at `#/agent-fleet`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Several top-level agents side by side, each with the sub-agents it started. Every agent is a card that sums up its
branch in words – “2/4 running”, “1 failed”, “All 3 done”, “1 needs you” – with its status, what the whole branch cost
and how long it has run. The header sums up the fleet: agents and sub-agents, how many are running, how many need you,
and the total cost. Click a card and its tree opens beside the cards, which line up in a column; the card that was
open folds back. A branch where someone waits for you has an Answer button that opens straight to it.

### When to use

- Several independent agents running at once – a team's leads, or one agent per project – where you want the state
  of each at a glance and the detail of one at a time.
- Finding the branch that needs you or failed, without opening every run.

### When not to use

- One run with one orchestrator – use [Agent Tree](agent-tree.md) on its own.
- Background tasks to triage by state, not by who started what – use [Agent Inbox](agent-inbox.md).
- When each agent was busy over time – use [Agent Lanes](agent-lanes.md).
- One agent at work, step by step – use [Agent Monitor](agent-monitor.md).
- Many identical workers on one job – use [Fan-out Grid](fan-out-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the shared card header, with the fleet's sums `.ui-flt__sum` on the right
2. **Cards** `.ui-flt__cards` – one card `.ui-flt__card` per top-level agent
3. **Status** `.ui-flt__status` – the agent's own state: Queued, Running, Needs you, Done, Failed or Stopped
4. **Task** `.ui-flt__task` – what the agent was asked, in up to two lines
5. **Branch** `.ui-flt__branch` – its sub-agents in words, the most pressing first
6. **Answer** `.ui-flt__answer` – on a branch where someone waits for you
7. **Cost and time** `.ui-flt__cost` – the whole branch's cost, and how long the agent has run
8. **Tree** `.ui-flt__panel` – the open agent's `tc-agent-tree`, with a Close button `.ui-flt__close`

## Looks

Standard sets the header and the cards on a gray tray, each card white; the open tree sits on its own white card.
Clean is one white card with the agents as small raised cards inside it, and the tree drawn straight on the card. In
both, a container at least 640 px wide opens the tree to the right of a column of cards; a narrower one opens it under
its card.

Component tokens: `--tc-agent-fleet-card-min` – a card's smallest width in the grid (220 px);
`--tc-agent-fleet-column` – the column of cards beside an open tree (260 px Standard, 250 px Clean).

## Usage

### HTML

```html
<tc-agent-fleet id="fleet" heading="Report season"></tc-agent-fleet>

<script type="module">
  import "@adamstavely/trenchcoat/agent-fleet";
  import "@adamstavely/trenchcoat/tokens.css";

  const fleet = document.querySelector("#fleet");
  fleet.agents = [
    { id: "report", name: "Report lead", model: "Opus 5.5", task: "Prepare the annual report", status: "running", cost: 0.42,
      children: [{ id: "chk", name: "Data checker", task: "Check year ranges", status: "waiting", ask: "Include 2016–2022?" }] },
    { id: "archive", name: "Archive curator", task: "File last season's sheets", status: "done", cost: 0.34 },
  ];
  fleet.resolver = (agent, action) => console.log(agent.id, action);
  fleet.addEventListener("tc-open-change", (e) => console.log(e.detail.open));
</script>
```

### React / Next.js

```tsx
import { AgentFleet, type FleetAgent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents: FleetAgent[] = [
  {
    id: "report",
    name: "Report lead",
    model: "Opus 5.5",
    task: "Prepare the annual report",
    status: "running",
    cost: 0.42,
    children: [{ id: "chk", name: "Data checker", task: "Check year ranges", status: "waiting", ask: "Include 2016–2022?" }],
  },
  { id: "archive", name: "Archive curator", task: "File last season's sheets", status: "done", cost: 0.34 },
];

export function Season() {
  return <AgentFleet title="Report season" agents={agents} onResolve={(agent, action) => console.log(agent.id, action)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-fleet";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";

defineProps<{ agents: TcAgentFleet["agents"]; open: TcAgentFleet["open"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-fleet :agents="agents" :open="open" @tc-open-change="onOpenChange"></tc-agent-fleet>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentFleet } from "@adamstavely/trenchcoat/angular/agent-fleet";
import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";

@Component({
  selector: "app-agent-fleet-example",
  imports: [AgentFleet],
  template: `<tc-agent-fleet [agents]="agents()" [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-agent-fleet>`,
})
export class AgentFleetExample {
  readonly agents = input.required<TcAgentFleet["agents"]>();
  readonly open = input.required<TcAgentFleet["open"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-fleet";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";

  let { agents, open }: { agents: TcAgentFleet["agents"]; open: TcAgentFleet["open"] } = $props();
  let el: TcAgentFleet;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-agent-fleet bind:this={el} {agents} {open}></tc-agent-fleet>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Fleet"` | The heading |
| `agents` | – | `FleetAgent[]` | `[]` | The top-level agents, each with its sub-agents nested in `children` |
| `open` | – | `string \| null` | `null` | The id of the agent whose tree is open, or null. Changed by the cards unless tc-open-change is prevented |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for running times, in epoch ms – unset uses an internal clock |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.42" |
| `resolver` | – | `((agent: TreeAgent, action: AgentTreeResolution) => void \| Promise<unknown>) \| undefined` | `undefined` | Passed to the open tree: called with each answer from its "needs you" or "failed" window; may return a promise |
| `onAnswer` | – | `((answer: AgentFleetAnswer) => void) \| undefined` | `undefined` | Called when Answer is pressed (as well as tc-answer) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A card was opened or closed ({ open }: AgentFleetOpenChange, null = none); cancelable – prevented, `open` stays as it was |
| `tc-answer` | – | Yes | Answer was pressed on a card ({ agent, waiting }: AgentFleetAnswer); cancelable – prevented, the card's tree doesn't open |
| `tc-resolve` | – | No | An answer from an open tree's "needs you" or "failed" window, bubbled from tc-agent-tree (detail: { agent: TreeAgent, action: "approve" \| "reject" \| "retry" \| "dismiss" }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-fleet-card-min` | `220px` | standard, clean |
| `--tc-agent-fleet-column` | `250px` | standard, clean |

#### Design tokens it reads (67)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-avatar-md`, `--tc-avatar-radius-agent`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `fleetBranchSummary(agent: FleetAgent): void` | The branch in words, the most pressing first: someone waiting, then failures, then what runs, then done |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-agent-fleet :agents="…">` | `<tc-agent-fleet [agents]="…">` | `<tc-agent-fleet {agents}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-agent-fleet :open="…">` | `<tc-agent-fleet [open]="…">` | `<tc-agent-fleet {open}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-agent-fleet :formatCost="…">` | `<tc-agent-fleet [formatCost]="…">` | `<tc-agent-fleet {formatCost}>` |
| `resolver` | `el.resolver = …;` | `<… resolver={…} />` | `<tc-agent-fleet :resolver="…">` | `<tc-agent-fleet [resolver]="…">` | `<tc-agent-fleet {resolver}>` |
| `onAnswer` | `el.onAnswer = …;` | `<… onAnswer={…} />` | `<tc-agent-fleet :onAnswer="…">` | `<tc-agent-fleet [onAnswer]="…">` | `<tc-agent-fleet {onAnswer}>` |

*Also attributes: `heading`, `now` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-answer` | Yes | `el.addEventListener("tc-answer", (e) => …)` | `ref.current.addEventListener("tc-answer", …)` | `@tc-answer="…"` | `(tc-answer)="…($event)"` | `el.addEventListener("tc-answer", …)` |
| `tc-resolve` | No | `el.addEventListener("tc-resolve", (e) => …)` | `ref.current.addEventListener("tc-resolve", …)` | `@tc-resolve="…"` | `(tc-resolve)="…($event)"` | `el.addEventListener("tc-resolve", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-fleet id="agent-fleet"></tc-agent-fleet>

<script type="module">
  import "@adamstavely/trenchcoat/agent-fleet";

  const el = document.querySelector("#agent-fleet");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-fleet";
import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";

const props = defineProps<{ initial: TcAgentFleet["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcAgentFleet["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-agent-fleet :open="open" @tc-open-change="onOpenChange"></tc-agent-fleet>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentFleet } from "@adamstavely/trenchcoat/angular/agent-fleet";
import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";

@Component({
  selector: "app-controlled-agent-fleet",
  imports: [AgentFleet],
  template: `<tc-agent-fleet [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-agent-fleet>`,
})
export class ControlledAgentFleet {
  readonly initial = input.required<TcAgentFleet["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcAgentFleet["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-fleet";
  import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";

  let { initial }: { initial: TcAgentFleet["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcAgentFleet;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcAgentFleet["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-agent-fleet bind:this={el} {open}></tc-agent-fleet>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-fleet")` returns a `TcAgentFleet` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";`
- **React / Next.js:** Props: `import type { AgentFleetProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentFleet>`. The element class, for refs: `import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentFleet["agents"]` with `import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";`
- **Angular:** The directive types the template: `[agents]` takes `TcAgentFleet["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentFleet } from "@adamstavely/trenchcoat/agent-fleet";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `agents` | `FleetAgent[]` | The top-level agents, each with its sub-agents nested in `children` |
| `title` | `string` | The heading (default "Fleet") |
| `open` | `string \| null` | The id of the agent whose tree is open, or null. Controlled when defined; otherwise the component keeps it |
| `defaultOpen` | `string \| null` | The agent open at first when `open` isn't controlled |
| `onOpenChange` | `(open: string \| null) => void` | Called with the id of the agent the user opened, or null when they closed it |
| `onAnswer` | `(answer: AgentFleetAnswer) => void` | Called when Answer is pressed on a card – the card's tree opens unless `open` is controlled |
| `onResolve` | `(agent: FleetAgent, action: AgentTreeResolution) => void \| Promise<unknown>` | An answer from an open tree's "needs you" or "failed" window. May return a promise: the buttons wait |

*Renamed or hidden on the wrapper: `heading`, `agents`, `open`, `resolver`, `onAnswer`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the cards (one stop), each Answer button, then into the open tree |
| ↑ / ↓ / ← / → | Moves between the cards |
| Home / End | Moves to the first or last card |
| Enter / Space | Opens or closes the card's tree |
| Escape | Closes the open tree and returns focus to its card |

### Screen readers

The cards are a list named by the heading. Each card's button reads the agent's name, status and branch – “Report
lead, Running, 1 needs you, 4 sub-agents” – with `aria-expanded`, and controls the tree while it's open. The tree is a
region named “Report lead and its sub-agents”; `tc-agent-tree` describes the rest. Answer reads “Answer for Report
lead”. A polite status says what needs attention: “1 agent needs you, 1 failed”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | agent-tree, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | agent-tree | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | agent-tree | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | agent-tree, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, agent-tree, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | agent-tree | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | agent-tree | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, agent-tree, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, agent-tree | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.0 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| [agent-tree](agent-tree.md) · Element it renders | 47.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **78.5 KB** | **20.3 KB** |
| With Lit – the first component on a page | 101.0 KB | 27.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 230 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of agents replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | agents: first render, 2,174 nodes; update 1.2 ms |
| 1,000 items | 124 ms | agents: first render, 20,399 nodes; update 9.1 ms |

1,000 items of agents: 124 ms. It renders every item, so a first render passes 50 ms (a long task) at about 400 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **57 frames/s, 4 timer callbacks/s** on screen, **nothing** scrolled away, **56 frames/s, 4 timer callbacks/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (agent-tree).
- Timers: `setInterval, cleared`, `setInterval, cleared` (agent-tree), `setTimeout` (agent-tree).
- 2 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `ResizeObserver` (agent-tree), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (agent-tree), `document pointerdown` (agent-tree), `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`, `Date.now()` (agent-tree), `performance.now()` (agent-tree).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role (“Report lead”, “Data lead”), and put the model in `model`.
- Write `task` as the instruction the agent was given.
- Give sub-agents `ask` and `error` – the open tree shows them in its “needs you” and “failed” windows.

## Do and don't

### Do

- Set `started` and `ended` so the cards show how long each agent ran; pass `now` to drive the clock yourself.
- Pass `resolver` (`onResolve` in React) so answers from the open tree reach your back end.

### Don't

- Don't nest one fleet's agents inside another agent – a fleet is the top level.
- Don't use it for a single run; the extra column only adds a click.

## Related

- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Agent Monitor](agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover

## Changelog

- **Agent Fleet** (`tc-agent-fleet`): several top-level agents as cards summing up their sub-agents; opening one shows its `tc-agent-tree` beside it (below it when narrow).
