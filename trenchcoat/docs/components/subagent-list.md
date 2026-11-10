<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Subagent List

**Agents** · New

The sub-agents a session started, grouped Active and Done with counts – each with its own drawn mark, what it's doing now, and a clock that ticks while it runs or how long ago it finished; waiting and failed in words, choose one to open it

- **Element:** `<tc-subagent-list>`
- **Size:** 7.9 KB gzip · 22.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/subagent-list";` |
| React / Next.js | `import { SubagentList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/subagent-list";` · tags starting with tc- are custom elements |
| Angular | `import { SubagentList } from "@adamstavely/trenchcoat/angular/subagent-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/subagent-list";` |

## Example

The live example is in the gallery at `#/subagent-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The sub-agents a working session has started, in a narrow panel. They sit in two groups – **Active** (running, or
waiting for something) and **Done** (finished, failed or stopped) – each with its count. A row is the agent's mark,
its name, what it's doing now, and a time: a clock that ticks while it's active ("1m 26s"), and how long ago it ended
once it's done ("just now", "1h ago"). Waiting, failed and stopped agents say so in words beside what they're doing.

Each agent gets its own mark, drawn from its id – a flower, a star, rings or leaves in one of six tones – so the same
agent is easy to find again, here and wherever else the page draws it with `subagentMark()`. Choosing a row selects it,
for the page to show that agent's transcript or output.

### When to use

- A side panel or tab beside a session that starts helpers: reviews, searches, test runs.
- Anywhere people need to see at a glance which helpers are still going and which have finished.

### When not to use

- Who started whom, with cost per branch – use [Agent Tree](agent-tree.md).
- Several orchestrators side by side – use [Agent Fleet](agent-fleet.md).
- A person's background tasks across sessions, with Approve and Retry – use [Agent Inbox](agent-inbox.md).
- One agent's steps in detail – use [Agent Monitor](agent-monitor.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-sba__count` – the heading with the number active
2. **Card** `.ui-sba__card` – holds the groups
3. **Group label** `.ui-sba__label` – "Active · 1", "Done · 7"
4. **Row** `.ui-sba__row` – one agent, a button; `data-status` says where it is
5. **Mark** `.ui-sba__mark` – the agent's flower, star, rings or leaves; turns slowly while it runs
6. **Name** `.ui-sba__name` – what it was asked to do
7. **Activity** `.ui-sba__activity` – what it's doing now, after `.ui-sba__tag` (Waiting, Failed, Stopped)
8. **Time** `.ui-sba__time` – the clock, or how long ago it ended
9. **Empty** `.ui-sba__empty` – "No subagents yet"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. `bare` drops both. Done agents' marks are quieter than active ones; the chosen row is tinted.

## Usage

### HTML

```html
<tc-subagent-list id="helpers"></tc-subagent-list>

<script type="module">
  import "@adamstavely/trenchcoat/subagent-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#helpers");
  list.agents = [
    { id: "a11y", name: "Review a11y current", status: "waiting", activity: "awaiting command message", startedAt: Date.now() - 86_000 },
    { id: "forms", name: "Review forms current", status: "done", endedAt: Date.now() - 20_000 },
  ];
  list.addEventListener("tc-selected-change", (e) => console.log("open", e.detail.agent.name));
</script>
```

### React / Next.js

```tsx
import { SubagentList, type Subagent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Helpers({ agents, onOpen }: { agents: Subagent[]; onOpen: (id: string) => void }) {
  return <SubagentList agents={agents} onSelectedChange={(id) => id && onOpen(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/subagent-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";

defineProps<{ agents: TcSubagentList["agents"]; labels: TcSubagentList["labels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-subagent-list :agents="agents" :labels="labels" @tc-selected-change="onSelectedChange"></tc-subagent-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SubagentList } from "@adamstavely/trenchcoat/angular/subagent-list";
import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";

@Component({
  selector: "app-subagent-list-example",
  imports: [SubagentList],
  template: `<tc-subagent-list [agents]="agents()" [labels]="labels()" (tc-selected-change)="onSelectedChange($event)"></tc-subagent-list>`,
})
export class SubagentListExample {
  readonly agents = input.required<TcSubagentList["agents"]>();
  readonly labels = input.required<TcSubagentList["labels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/subagent-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";

  let { agents, labels }: { agents: TcSubagentList["agents"]; labels: TcSubagentList["labels"] } = $props();
  let el: TcSubagentList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-subagent-list bind:this={el} {agents} {labels}></tc-subagent-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Subagents"` | The heading; empty leaves the header out |
| `agents` | – | `Subagent[]` | `[]` | The sub-agents, in the order to show them within each group – newest first reads best |
| `selected` | `selected` | `string \| null` | `null` | The id of the chosen agent. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock, which ticks |
| `bare` | `bare` | `boolean` | `false` | Drop the tray and card, for a place that already has one |
| `labels` | – | `Partial<SubagentListLabels>` | `{}` | The words it uses, merged over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A row was chosen ({ selected, agent }: SubagentSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (46)

`--tc-accent-solid`, `--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-strong`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-sba-fill`, `--tc-sba-line`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-rose-fg`, `--tc-tone-rose-solid`, `--tc-tone-teal-fg`, `--tc-tone-teal-solid`, `--tc-tone-violet-fg`, `--tc-tone-violet-solid`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `subagentClock(ms: number): void` | An active agent's clock: "12s", "1m 26s", "1h 4m" |
| `subagentTones: ["amber", "pink", "teal", "violet", "rose", "accent"]` | The tones a mark can take, and the shapes |
| `subagentMark(seed: string): { tone: SubagentTone; shape: SubagentShape; parts: number }` | The tone, shape and number of parts of the mark drawn from `seed` |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-subagent-list :agents="…">` | `<tc-subagent-list [agents]="…">` | `<tc-subagent-list {agents}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-subagent-list :labels="…">` | `<tc-subagent-list [labels]="…">` | `<tc-subagent-list {labels}>` |

*Also attributes: `heading`, `selected`, `now`, `bare` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-subagent-list id="subagent-list"></tc-subagent-list>

<script type="module">
  import "@adamstavely/trenchcoat/subagent-list";

  const el = document.querySelector("#subagent-list");
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
import "@adamstavely/trenchcoat/subagent-list";
import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";

const props = defineProps<{ initial: TcSubagentList["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcSubagentList["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-subagent-list :selected="selected" @tc-selected-change="onSelectedChange"></tc-subagent-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SubagentList } from "@adamstavely/trenchcoat/angular/subagent-list";
import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";

@Component({
  selector: "app-controlled-subagent-list",
  imports: [SubagentList],
  template: `<tc-subagent-list [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-subagent-list>`,
})
export class ControlledSubagentList {
  readonly initial = input.required<TcSubagentList["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcSubagentList["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/subagent-list";
  import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";

  let { initial }: { initial: TcSubagentList["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcSubagentList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcSubagentList["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-subagent-list bind:this={el} {selected}></tc-subagent-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-subagent-list")` returns a `TcSubagentList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";`
- **React / Next.js:** Props: `import type { SubagentListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SubagentList>`. The element class, for refs: `import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSubagentList["agents"]` with `import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";`
- **Angular:** The directive types the template: `[agents]` takes `TcSubagentList["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSubagentList } from "@adamstavely/trenchcoat/subagent-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out (default "Subagents") |
| `selected` | `string \| null` | The chosen agent's id – controlled when given |
| `defaultSelected` | `string \| null` | The chosen agent at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, agent: Subagent \| null) => void` | An agent was chosen |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Into the list, onto the chosen row (or the first) |
| ↑ / ↓ | The row above or below, across both groups |
| Home / End | The first or last row |
| Enter / Space | Chooses the row |

### Screen readers

Each group is a list named by its label and count ("Active, 1"). Each row is a button named by the agent's name, its
state in words ("Running", "Waiting", "Finished", "Failed", "Stopped"), what it's doing and its time; the chosen row has
`aria-current="true"`. The marks are decorative. A polite status region announces agents that finish, fail, stop or
start waiting ("Review forms current: Finished").

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.5 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.8 KB** | **7.9 KB** |
| With Lit – the first component on a page | 44.6 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 141 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of agents replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.6 ms | agents: first render, 1,332 nodes; update 1.2 ms |
| 1,000 items | 71 ms | agents: first render, 13,332 nodes; update 7.6 ms |

1,000 items of agents: 71 ms. It renders every item, so a first render passes 50 ms (a long task) at about 710 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Names are short and say what was asked: "Review forms current", "Check citations in chapter 3".
- `activity` is a few lower-case words about now: "awaiting command message", "reading 14 of 40 sources". For a failed
  or stopped agent, say why.
- Give an agent a `mark` seed when the same helper runs in many sessions and should look the same in each.
- Reword everything with `labels`, including `ago` ("{time} ago") and `activeCount` ("{count} active").

## Do and don't

### Do

- Keep agents in the list after they finish, so people can open what they did.
- Pass `endedAt` for done agents; without it, they show no time.

### Don't

- Don't colour rows by status yourself – the words and the group already say it.
- Don't re-render every second to move the clocks; the list paints them in place.

## Related

- [Session Panel](../blocks/session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Agent Fleet](agent-fleet.md) – Several top-level agents side by side – each card sums up its sub-agents in words, with status, cost and time, and a click opens its tree beside it while the last one folds back into its card
- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.

## Changelog

- **Subagent List** (`tc-subagent-list`): the sub-agents a session has started, grouped Active (running or waiting) and Done (finished, failed or stopped) with counts. Each row is the agent's own mark – a flower, star, rings or leaves in one of six tones, drawn from its id – its name, what it's doing now, and a time: a clock that ticks while it's active ("1m 26s") or how long ago it ended ("just now", "1h ago"). Waiting, failed and stopped say so in words; rows are one tab stop with the arrow keys; choosing one fires a cancelable `tc-selected-change`; agents that finish, fail or start waiting are announced. Also exported: `subagentMark()` and `subagentClock()`.
