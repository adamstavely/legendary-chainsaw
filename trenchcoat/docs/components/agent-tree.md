<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Tree

**Agents**

Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line

- **Element:** `<tc-agent-tree>`
- **Size:** 15.5 KB gzip · 58.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-tree";` |
| React / Next.js | `import { AgentTree } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-tree";` · tags starting with tc- are custom elements |
| Angular | `import { AgentTree } from "@adamstavely/trenchcoat/angular/agent-tree";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-tree";` |

## Example

The live example is in the gallery at `#/agent-tree`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who started whom in a run of agents. An orchestrator splits a job and hands parts to sub-agents, which may start
their own; the tree shows each one as a card – name, model, status, what it was asked, its tools, its cost and how
long it has taken – joined by connectors to the agent that started it. A branch's cost includes everything below
it, and any branch folds to “+3”. The header sums up the run and opens a window to answer agents that need you or
retry ones that failed, without hunting for them in the tree.

### When to use

- Multi-agent runs where it matters who delegated what – for cost, for blame when something fails, or to see what
  a branch is still waiting on.
- Watching a run live: new agents grow in, cards glide when the tree changes and running times tick.
- Answering approvals and retrying failures across a whole run from one place.

### When not to use

- Agents calling tools and each other as a network rather than a hierarchy – use [Agent Graph](agent-graph.md).
- When each agent was busy over time – use [Agent Lanes](agent-lanes.md).
- Where the time and money of one run went, call by call – use [Trace Waterfall](trace-waterfall.md).
- Many identical workers on one job – use [Fan-out Grid](fan-out-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-agt__bar` – the shared card header: a boxed icon, the run’s name and, on the right, its summary
2. **Summary** `.ui-agt__sum` – agents, how many are running, “needs you”, “failed” and the total cost
3. **Agent** `.ui-agt__node` – one agent's card
4. **Status** `.ui-agt__status` – Queued, Running, Needs you, Done, Failed or Stopped
5. **Cost and time** `.ui-agt__cost` – the branch's cost and how long the agent took
6. **Fold** `.ui-agt__fold` – how many sub-agents an agent started; folds the branch to “+3”

## Looks

Standard sets each card's name, status and task on white, inside a gray tray that carries the cost, the time and
the fold button. Clean is one white card per agent with a hairline shadow, the cost and fold in its last row. Both
draw the same connectors and lay the first level side by side when the tree is at least 560 px wide, indenting every
level when it's narrower.

## Usage

### HTML

```html
<tc-agent-tree id="run" heading="Annual billing run" selectable></tc-agent-tree>

<script type="module">
  import "@adamstavely/trenchcoat/agent-tree";
  import "@adamstavely/trenchcoat/tokens.css";

  const tree = document.querySelector("#run");
  tree.root = {
    id: "root", name: "Orchestrator", model: "Opus 5.5", task: "Ship annual billing", status: "running", cost: 0.12,
    children: [
      { id: "api", name: "Backend", task: "Add annual prices", status: "done", cost: 0.31 },
      { id: "prices", name: "Stripe setup", task: "Create prices", status: "waiting", ask: "Create 3 live prices in Stripe?" },
    ],
  };
  tree.resolver = (agent, action) => console.log(agent.id, action);
  tree.addEventListener("tc-select", (e) => console.log(e.detail.agent.id));
</script>
```

### React / Next.js

```tsx
import { AgentTree, type TreeAgent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const root: TreeAgent = {
  id: "root",
  name: "Orchestrator",
  model: "Opus 5.5",
  task: "Ship annual billing",
  status: "running",
  cost: 0.12,
  children: [
    { id: "api", name: "Backend", task: "Add annual prices", status: "done", cost: 0.31 },
    { id: "prices", name: "Stripe setup", task: "Create prices", status: "waiting", ask: "Create 3 live prices in Stripe?" },
  ],
};

export function Run() {
  return (
    <AgentTree
      title="Annual billing run"
      root={root}
      onResolve={(agent, action) => console.log(agent.id, action)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-tree";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";

defineProps<{ root: TcAgentTree["root"]; collapsed: TcAgentTree["collapsed"] }>();
const onCollapsedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-tree :root="root" :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-agent-tree>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentTree } from "@adamstavely/trenchcoat/angular/agent-tree";
import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";

@Component({
  selector: "app-agent-tree-example",
  imports: [AgentTree],
  template: `<tc-agent-tree [root]="root()" [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-agent-tree>`,
})
export class AgentTreeExample {
  readonly root = input.required<TcAgentTree["root"]>();
  readonly collapsed = input.required<TcAgentTree["collapsed"]>();
  onCollapsedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-tree";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";

  let { root, collapsed }: { root: TcAgentTree["root"]; collapsed: TcAgentTree["collapsed"] } = $props();
  let el: TcAgentTree;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-agent-tree bind:this={el} {root} {collapsed}></tc-agent-tree>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agents"` | The heading, and the tree list's name |
| `root` | – | `TreeAgent` | `{ id: "", name: "", task: "", status: "queued" }` | The orchestrator, with its sub-agents nested in `children` – the whole run as one tree |
| `collapsed` | – | `string[]` | `[]` | Ids of folded branches. Changed by the fold buttons unless tc-collapsed-change is prevented |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for running times, in epoch ms – unset uses an internal clock |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.42" |
| `resolver` | – | `((agent: TreeAgent, action: AgentTreeResolution) => void \| Promise<unknown>) \| undefined` | `undefined` | Called with each answer (as well as tc-resolve). May return a promise: the answer's buttons wait, and if it rejects the window stays open and says so |
| `selectable` | `selectable` | `boolean` | `false` | The agents' names are buttons that fire tc-select (the whole card stays clickable for a pointer) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-collapsed-change` | – | Yes | A branch was folded or unfolded (detail: { collapsed: string[] }); cancelable |
| `tc-select` | – | No | A card was clicked, or its name pressed (detail: { agent: TreeAgent }); shown as a button with `selectable` |
| `tc-resolve` | – | No | An answer from the "needs you" or "failed" window (detail: { agent: TreeAgent, action: "approve" \| "reject" \| "retry" \| "dismiss" }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-tree-link` | `light-dark(#82bcff, #4f8fdb)` | standard, clean |
| `--tc-agent-tree-link-muted` | `var(--tc-border-strong)` | standard, clean |
| `--tc-agent-tree-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-agent-tree-card-bg` | `var(--tc-surface-on-tray)` | standard |
| `--tc-agent-tree-dot-bg` | `var(--tc-surface-base)` | standard |
| `--tc-agent-tree-fold-hover-bg` | `light-dark(#e4e4e4, #2a2a2e)` | standard |
| `--tc-agent-tree-shine` | `light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.35))` | standard, clean |
| `--tc-agent-tree-card-w` | `216px` | standard, clean |
| `--tc-agent-tree-indent` | `32px` | standard, clean |
| `--tc-agent-tree-depth` | `0` | not set – this fallback applies |

#### Design tokens it reads (87)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-md`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-base`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `root` | `el.root = …;` | `<… root={…} />` | `<tc-agent-tree :root="…">` | `<tc-agent-tree [root]="…">` | `<tc-agent-tree {root}>` |
| `collapsed` | `el.collapsed = …;` | `<… collapsed={…} />` | `<tc-agent-tree :collapsed="…">` | `<tc-agent-tree [collapsed]="…">` | `<tc-agent-tree {collapsed}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-agent-tree :formatCost="…">` | `<tc-agent-tree [formatCost]="…">` | `<tc-agent-tree {formatCost}>` |
| `resolver` | `el.resolver = …;` | `<… resolver={…} />` | `<tc-agent-tree :resolver="…">` | `<tc-agent-tree [resolver]="…">` | `<tc-agent-tree {resolver}>` |

*Also attributes: `heading`, `now`, `selectable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `onCollapsedChange={…}` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onSelect={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |
| `tc-resolve` | No | `el.addEventListener("tc-resolve", (e) => …)` | `ref.current.addEventListener("tc-resolve", …)` | `@tc-resolve="…"` | `(tc-resolve)="…($event)"` | `el.addEventListener("tc-resolve", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `collapsed` itself unless a listener calls `preventDefault()` on `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-tree id="agent-tree"></tc-agent-tree>

<script type="module">
  import "@adamstavely/trenchcoat/agent-tree";

  const el = document.querySelector("#agent-tree");
  el.addEventListener("tc-collapsed-change", (e) => {
    e.preventDefault(); // the element keeps its collapsed…
    if (allowed(e.detail.collapsed)) el.collapsed = e.detail.collapsed; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentTree } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentTree>;
type Props = Omit<Own, "collapsed" | "onCollapsedChange"> & { initial: NonNullable<Own["collapsed"]> };

// Controlled: passing collapsed makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentTree({ initial, ...props }: Props) {
  const [collapsed, setCollapsed] = useState<Own["collapsed"]>(initial);
  return <AgentTree {...props} collapsed={collapsed} onCollapsedChange={(next) => setCollapsed(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-tree";
import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";

const props = defineProps<{ initial: TcAgentTree["collapsed"] }>();
const collapsed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCollapsedChange = (e: CustomEvent<{ collapsed: TcAgentTree["collapsed"] }>) => {
  e.preventDefault();
  collapsed.value = e.detail.collapsed;
};
</script>

<template>
  <tc-agent-tree :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-agent-tree>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentTree } from "@adamstavely/trenchcoat/angular/agent-tree";
import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";

@Component({
  selector: "app-controlled-agent-tree",
  imports: [AgentTree],
  template: `<tc-agent-tree [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-agent-tree>`,
})
export class ControlledAgentTree {
  readonly initial = input.required<TcAgentTree["collapsed"]>();
  readonly collapsed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCollapsedChange(e: CustomEvent<{ collapsed: TcAgentTree["collapsed"] }>) {
    e.preventDefault();
    this.collapsed.set(e.detail.collapsed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-tree";
  import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";

  let { initial }: { initial: TcAgentTree["collapsed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let collapsed = $derived(initial);
  let el: TcAgentTree;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      collapsed = (e as CustomEvent<{ collapsed: TcAgentTree["collapsed"] }>).detail.collapsed;
    };
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-agent-tree bind:this={el} {collapsed}></tc-agent-tree>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-tree")` returns a `TcAgentTree` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";`
- **React / Next.js:** Props: `import type { AgentTreeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentTree>`. The element class, for refs: `import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentTree["root"]` with `import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";`
- **Angular:** The directive types the template: `[root]` takes `TcAgentTree["root"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentTree } from "@adamstavely/trenchcoat/agent-tree";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `root` | `TreeAgent` | The orchestrator, with its sub-agents nested in `children` – the whole run as one tree |
| `collapsed` | `string[]` | Ids of folded branches. Controlled when defined; otherwise the component keeps them, starting from `defaultCollapsed` |
| `defaultCollapsed` | `string[]` | Ids of the branches folded at first when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: string[]) => void` | Called with every folded branch's id after a branch is folded or unfolded |
| `onResolve` | `(agent: TreeAgent, action: AgentTreeResolution) => void \| Promise<unknown>` | An answer from the "needs you" or "failed" window: approve or reject a waiting agent, retry or dismiss a failed one. May return a promise: the answer's buttons wait, and if it rejects the window stays open and says so |
| `onSelect` | `(agent: TreeAgent) => void` | A click on a card – e.g. to open its log |
| `title` | `string` | The heading, and the tree list's name (default "Agents") |

*Renamed or hidden on the wrapper: `root`, `heading`, `collapsed`, `resolver`, `selectable`, `onSelect`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the “needs you” and “failed” buttons, the agents' names (with `selectable`) and the fold buttons |
| Enter / Space | On a fold button: folds or unfolds the branch. On a name: fires `tc-select`. On “needs you” or “failed”: opens or closes its window, with the first answer focused |
| Escape | In the window: closes it and returns focus to the button that opened it |

### Screen readers

The tree is a set of nested lists: the whole tree named by `heading`, and each agent's sub-agents a list named
“Started by Backend”. Fold buttons have `aria-expanded` and say what they hold – “3 sub-agents of Backend”, or “+5
sub-agents of Backend” when folded. “Needs you” and “failed” are buttons with `aria-haspopup="dialog"` and
`aria-expanded`; the window is a dialog named “Agents that need you” or “Agents that failed”, with Reject and
Approve, or Dismiss and Retry, for each agent. The visible summary isn't live; a polite status region says only what
needs attention – “1 agent needs you, 1 failed”, or “No agent running”. An answer whose promise rejects shows an alert,
“Didn't go through – try again”. Connectors, avatars and tool marks are hidden.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 49.6 KB | 12.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **58.5 KB** | **15.5 KB** |
| With Lit – the first component on a page | 81.0 KB | 22.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 48 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 32 React commits (clean), 32 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **42 frames/s** on screen, **nothing** scrolled away, **42 frames/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setInterval, cleared`, `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange`, `document pointerdown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`, `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role in the run (“Backend”, “Spec writer”), not by a model or an id – the model goes in
  `model`.
- Write `task` as the instruction the agent was given: “Add annual prices and proration”.
- Write `ask` as a question someone can answer with Approve or Reject: “Create 3 live prices in Stripe?”.
- Write `error` as what went wrong and why: “Couldn't fetch the brand voice guide (403)”.

## Do and don't

### Do

- Set `started` and `ended` so the cards show how long each agent took; pass `now` to drive the clock yourself.
- Return a promise from `resolver` (`onResolve` in React) so the buttons wait and a failure is shown.
- Set `selectable` (`onSelect` in React) when a card can open the agent's log.

### Don't

- Don't flatten the run into one level – the tree is there to show who started whom.
- Don't put the result of an agent's work in `task`; keep the card to what it was asked.
- Don't use it for a single agent's plan – use `agent-plan`.

## Related

- [Agent Graph](agent-graph.md) – Agents and the tools they call as a living network – a pulse along the link for every call and its answer, busy links growing thicker, agents that breathe while they work and turn amber when they need you
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover

## Changelog

- **Agent Fleet** (`tc-agent-fleet`): several top-level agents as cards summing up their sub-agents; opening one shows its `tc-agent-tree` beside it (below it when narrow).
