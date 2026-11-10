<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Inbox

**Agents**

All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo

- **Element:** `<tc-agent-inbox>`
- **Size:** 14.9 KB gzip · 59.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-inbox";` |
| React / Next.js | `import { AgentInbox } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-inbox";` · tags starting with tc- are custom elements |
| Angular | `import { AgentInbox } from "@adamstavely/trenchcoat/angular/agent-inbox";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-inbox";` |

## Example

The live example is in the gallery at `#/agent-inbox`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every background task your agents are working on, in one calm place. Tasks sit in three columns – Needs you,
Running, Done – as cards with a status glyph, the title, a line or two on where it stands, a live clock and how many
tools and sources it used. Click a card and it unfolds in place to show the agent, its last steps and what you can do
now: Approve or Reject when it waits, Retry when it failed, Open when it runs or is done. A card that changes state
shows it where it is first, then glides to its new column, so people can follow what moved.

Give it `since` – when you left – and a third layout joins the switch: **Recap**, “While you were away”. It shows
only what changed since then: the period in words (“Since 6:40 PM · 13h 30m”), a small chart of it with a peak per
task, and the tasks grouped into Needs you, Failed and Done. Recap cards carry their buttons on the card – Approve,
Reject, Retry, and Undo on done tasks marked `undoable` – so the morning's decisions take one click each.

### When to use

- An overview of several long-running agent tasks, where people mostly check in and occasionally decide.
- Tasks that stop to ask for approval and should be handled without leaving the list.
- A home or sidebar view that answers “what needs me, and what's still going?”.
- A morning or return-from-break summary of what agents did unattended (`view="recap"` with `since`).

### When not to use

- A queue people work through one item at a time, in order – use [Agent Queue](agent-queue.md).
- Decisions only, each with its options and context – use [Decision Inbox](decision-inbox.md).
- One action waiting for approval, inside a chat or a run – use [Approval Card](approval-card.md).
- Assigning and handing work between people and agents – use [Delegate Board](delegate-board.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Board / List** `.ui-ai__views` – the layout
3. **Column** `.ui-ai__lane` – Needs you, Running or Done, with its count
4. **Card** `.ui-ai__card-main` – the task's title, description, state, clock and counts; click to unfold
5. **Details** `.ui-ai__fold` – the agent, the last four steps and the card's buttons
6. **Recap** `.ui-ai__recap` – “While you were away”, the period and its counts, the chart `.ui-ai__chart` with a peak

## Looks

Both set white cards in quiet gray columns. Standard shows each card's state as a tinted pill (“Waiting for you ·
4m 12s”) and can put an action button (“New task”) in the header. Clean has no header button, writes the column names in
small capitals and the state as plain text beside its glyph. The recap's chart sits on a white card in Standard and in a
quiet gray panel in Clean. In both, List stacks the columns one after another, and
a container narrower than 620px stacks them whichever layout is picked.

## Usage

### HTML

```html
<tc-agent-inbox id="inbox" heading="Agent tasks" openable></tc-agent-inbox>

<script type="module">
  import "@adamstavely/trenchcoat/agent-inbox";
  import "@adamstavely/trenchcoat/tokens.css";

  const inbox = document.querySelector("#inbox");
  inbox.tasks = [
    { id: "refund", title: "Refund duplicate charge for Acme Corp", agent: "Opus 5.5", status: "waiting", startedAt: Date.now() - 240000 },
    { id: "migrate", title: "Migrate billing tests to Vitest", agent: "Opus 5.5", status: "running", startedAt: Date.now() - 60000, tools: 12 },
  ];
  inbox.onApprove = (task) => fetch(`/api/tasks/${task.id}/approve`, { method: "POST" });
  inbox.addEventListener("tc-open", (e) => console.log(e.detail.id));

  // The morning recap: what changed since 6:40 PM yesterday
  const recap = document.createElement("tc-agent-inbox");
  recap.view = "recap";
  recap.since = Date.parse("2026-11-05T18:40:00");
  recap.tasks = [
    { id: "tags", title: "Tagged new datasets", agent: "Haiku 5", status: "done", finishedAt: Date.parse("2026-11-05T22:30:00"), undoable: true },
  ];
  recap.onUndo = (task) => fetch(`/api/tasks/${task.id}/undo`, { method: "POST" });
  document.body.append(recap);
</script>
```

### React / Next.js

```tsx
import { AgentInbox, type AgentTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tasks: AgentTask[] = [
  { id: "refund", title: "Refund duplicate charge for Acme Corp", agent: "Opus 5.5", status: "waiting", startedAt: Date.now() - 240000 },
  { id: "migrate", title: "Migrate billing tests to Vitest", agent: "Opus 5.5", status: "running", startedAt: Date.now() - 60000, tools: 12 },
];

export function Tasks({ approve }: { approve: (id: string) => Promise<void> }) {
  return <AgentInbox title="Agent tasks" tasks={tasks} onApprove={(task) => approve(task.id)} onOpen={(task) => console.log(task.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-inbox";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";

defineProps<{ tasks: TcAgentInbox["tasks"]; action: TcAgentInbox["action"] }>();
const onViewChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-inbox :tasks="tasks" :action="action" @tc-view-change="onViewChange"></tc-agent-inbox>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentInbox } from "@adamstavely/trenchcoat/angular/agent-inbox";
import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";

@Component({
  selector: "app-agent-inbox-example",
  imports: [AgentInbox],
  template: `<tc-agent-inbox [tasks]="tasks()" [action]="action()" (tc-view-change)="onViewChange($event)"></tc-agent-inbox>`,
})
export class AgentInboxExample {
  readonly tasks = input.required<TcAgentInbox["tasks"]>();
  readonly action = input.required<TcAgentInbox["action"]>();
  onViewChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-inbox";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";

  let { tasks, action }: { tasks: TcAgentInbox["tasks"]; action: TcAgentInbox["action"] } = $props();
  let el: TcAgentInbox;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-agent-inbox bind:this={el} {tasks} {action}></tc-agent-inbox>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tasks` | – | `AgentTask[]` | `[]` | The tasks – always the source of truth. After Approve, Reject or Retry the card shows the result right away; as soon as you pass that task with a new status (or steps, start or elapsed time), your version wins |
| `heading` | `heading` | `string` | `"Agent inbox"` | Heading on the left of the bar |
| `action` | – | `{ label: string; onClick: () => void } \| undefined` | `undefined` | A button in the bar, e.g. { label: "New task", onClick } – Standard look only; the Clean bar has no button |
| `view` | `view` | `AgentInboxView` | `"board"` | The layout: "board", "list" or "recap" (what changed since `since`) |
| `expanded` | – | `string \| null` | `null` | The id of the unfolded card, or null |
| `openable` | `openable` | `boolean` | `false` | Shows an Open button on running and done tasks (fires tc-open) |
| `onApprove` | – | `AgentTaskHandler \| undefined` | `undefined` | Called on Approve; may return a promise |
| `onReject` | – | `AgentTaskHandler \| undefined` | `undefined` | Called on Reject; may return a promise |
| `onRetry` | – | `AgentTaskHandler \| undefined` | `undefined` | Called on Retry; may return a promise |
| `onUndo` | – | `AgentTaskHandler \| undefined` | `undefined` | Called on Undo, after an uncanceled tc-undo; may return a promise |
| `since` | `since` | `number \| undefined` | `undefined` | The start of the recap's period, in epoch ms – when you left. Set, Recap joins the layout switch |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, in epoch ms – the recap's period ends here and the clocks of waiting and running tasks hold at it; unset reads the clock |
| `locale` | `locale` | `string` | `"en-US"` | Locale for the recap's times of day |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-view-change` | – | Yes | The user switched Board / List ({ view }: AgentInboxViewChange); cancelable |
| `tc-expanded-change` | – | Yes | A card was unfolded or folded ({ expanded }: AgentInboxExpandedChange, null = none); cancelable |
| `tc-open` | – | No | Open was pressed on a running or done task; `detail` is the `AgentTask` |
| `tc-undo` | – | Yes | Undo was pressed on an undoable done task in the recap ({ task }: AgentInboxUndo); cancelable – preventDefault() skips `onUndo` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-inbox-curve` | `var(--tc-text-disabled)` | standard, clean |
| `--tc-agent-inbox-area` | `var(--tc-fill-subtle)` | standard, clean |
| `--tc-agent-inbox-lane-bg` | `light-dark(#f4f4f5, #161618)` | clean |

#### Design tokens it reads (97)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-agent-inbox :tasks="…">` | `<tc-agent-inbox [tasks]="…">` | `<tc-agent-inbox {tasks}>` |
| `action` | `el.action = …;` | `<… action={…} />` | `<tc-agent-inbox :action="…">` | `<tc-agent-inbox [action]="…">` | `<tc-agent-inbox {action}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-agent-inbox :expanded="…">` | `<tc-agent-inbox [expanded]="…">` | `<tc-agent-inbox {expanded}>` |
| `onApprove` | `el.onApprove = …;` | `<… onApprove={…} />` | `<tc-agent-inbox :onApprove="…">` | `<tc-agent-inbox [onApprove]="…">` | `<tc-agent-inbox {onApprove}>` |
| `onReject` | `el.onReject = …;` | `<… onReject={…} />` | `<tc-agent-inbox :onReject="…">` | `<tc-agent-inbox [onReject]="…">` | `<tc-agent-inbox {onReject}>` |
| `onRetry` | `el.onRetry = …;` | `<… onRetry={…} />` | `<tc-agent-inbox :onRetry="…">` | `<tc-agent-inbox [onRetry]="…">` | `<tc-agent-inbox {onRetry}>` |
| `onUndo` | `el.onUndo = …;` | `<… onUndo={…} />` | `<tc-agent-inbox :onUndo="…">` | `<tc-agent-inbox [onUndo]="…">` | `<tc-agent-inbox {onUndo}>` |

*Also attributes: `heading`, `view`, `openable`, `since`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `onViewChange={…}` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-undo` | Yes | `el.addEventListener("tc-undo", (e) => …)` | `onTcUndo={…}` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `view` and `expanded` itself unless a listener calls `preventDefault()` on `tc-view-change` or `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-inbox id="agent-inbox"></tc-agent-inbox>

<script type="module">
  import "@adamstavely/trenchcoat/agent-inbox";

  const el = document.querySelector("#agent-inbox");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentInbox } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentInbox>;
type Props = Omit<Own, "view" | "onViewChange"> & { initial: NonNullable<Own["view"]> };

// Controlled: passing view makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentInbox({ initial, ...props }: Props) {
  const [view, setView] = useState<Own["view"]>(initial);
  return <AgentInbox {...props} view={view} onViewChange={(next) => setView(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-inbox";
import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";

const props = defineProps<{ initial: TcAgentInbox["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcAgentInbox["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-agent-inbox :view="view" @tc-view-change="onViewChange"></tc-agent-inbox>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentInbox } from "@adamstavely/trenchcoat/angular/agent-inbox";
import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";

@Component({
  selector: "app-controlled-agent-inbox",
  imports: [AgentInbox],
  template: `<tc-agent-inbox [view]="view()" (tc-view-change)="onViewChange($event)"></tc-agent-inbox>`,
})
export class ControlledAgentInbox {
  readonly initial = input.required<TcAgentInbox["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcAgentInbox["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-inbox";
  import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";

  let { initial }: { initial: TcAgentInbox["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcAgentInbox;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcAgentInbox["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-agent-inbox bind:this={el} {view}></tc-agent-inbox>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-inbox")` returns a `TcAgentInbox` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";`
- **React / Next.js:** Props: `import type { AgentInboxProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentInbox>`. The element class, for refs: `import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentInbox["tasks"]` with `import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";`
- **Angular:** The directive types the template: `[tasks]` takes `TcAgentInbox["tasks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentInbox } from "@adamstavely/trenchcoat/agent-inbox";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `tasks` | `AgentTask[]` | The tasks – always the source of truth; a decision shows at once, and your next version of the task wins |
| `title` | `string` | Heading on the left of the bar |
| `onOpen` | `(task: AgentTask) => void` | Shows an Open button on running and done tasks |
| `view` | `AgentInboxView` | The layout – "board", "list", or "recap" (what changed since `since`). Controlled when defined; otherwise the component keeps it, starting from `defaultView` |
| `defaultView` | `AgentInboxView` | The layout at first when `view` isn't controlled |
| `onViewChange` | `(view: AgentInboxView) => void` | Called with the layout the user picked, controlled or not |
| `expanded` | `string \| null` | The id of the unfolded card. Controlled when defined (null = none); otherwise the component keeps it |
| `defaultExpanded` | `string \| null` | The card unfolded at first when `expanded` isn't controlled |
| `onExpandedChange` | `(id: string \| null) => void` | Called with the id of the card the user unfolded, or null when they folded it |

*Renamed or hidden on the wrapper: `heading`, `view`, `expanded`, `openable`, `tasks`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bar, then each card, and into an unfolded card's buttons |
| Enter / Space | On a card, unfolds or folds it; on a button, presses it |
| Escape | Folds the open card and puts focus back on it |
| ← / → / ↑ / ↓ | In Board / List, switches the layout |
| Home / End | In Board / List, picks the first or last layout |
| ← / → / Home / End | On the recap's chart, moves from peak to peak (one tab stop); focus lights the task's card |
| Enter / Space | On a chart peak, moves focus to its card |

### Screen readers

Each column is a section named “Needs you”, “Running” or “Done”. Each card is a button with `aria-expanded`, and its
details are `inert` while folded. Counts are read in words – “6 sources read”, “4 tool calls”. The layout switch is a
`radiogroup` named “Layout”. A polite live region keeps a running summary: “2 need you, 3 running”. While a decision
is on its way the buttons are `aria-busy` and `aria-disabled`; if it fails, an alert says “Didn't go through – try
again”. After Approve, Reject or Retry, focus moves to the card and stays on it when it moves to another column.

In the recap the chart is a group named in words – “Timeline from 6:40 PM to 8:10 AM: 2 need you, 1 failed, 3 done” –
and each peak is a button named by its task, outcome and time: “Approve travel for the field survey – needs you,
2:16 AM”. The outcome is told by the glyph's shape and the legend's words, never by colour alone. Undo is named with
its task (“Undo Tagged new datasets”); after it, the card says “Undone” and focus goes to the card.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 51.0 KB | 12.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **59.4 KB** | **14.9 KB** |
| With Lit – the first component on a page | 82.0 KB | 22.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 272 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of tasks replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 25 ms | tasks: first render, 4,376 nodes; update 2.7 ms |
| 1,000 items | 239 ms | tasks: first render, 43,256 nodes; update 18 ms |

1,000 items of tasks: 239 ms. It renders every item, so a first render passes 50 ms (a long task) at about 210 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (clean), 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **0 timer callbacks/s** on screen, **nothing** scrolled away, **0 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title tasks as the outcome: “Refund duplicate charge for Acme Corp”, not the ticket number alone.
- Use `description` for where the task stands or what it is waiting for – one or two sentences.
- Write steps in the past tense, short: “Matched duplicate charge”.
- Name the agent or model in `agent`, so people know who did the work.

## Do and don't

### Do

- Return a promise from `onApprove`, `onReject` and `onRetry` – the buttons wait, and a failure leaves the card as it
  was with a message.
- Keep passing the latest tasks: once a task you pass has a new status or new steps, your version wins.
- Pass `startedAt` so the clock shows real time, even across reloads.
- For the recap, pass `finishedAt` on each task – when it finished, failed or stopped to ask – so it lands at the right
  place on the chart, and `undoable` only where `onUndo` can really take it back.
- Listen for `tc-undo` and call `preventDefault()` to ask “Are you sure?” first; `onUndo` then isn't called.

### Don't

- Don't put every agent event in `steps` – the card shows the last four; keep them meaningful.
- Don't use it for tasks that finish in seconds; they'll jump columns before anyone reads them.
- Don't hide failed tasks – they sit in Needs you so someone can retry.
- Don't use the recap for a short absence with one or two tasks – the board says it as well.

## Related

- [Agent Queue](agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Delegate Board](delegate-board.md) – Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first
