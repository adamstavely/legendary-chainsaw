<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Handoff

**Agents** · New

A task passed along a chain of agents – at each handoff how much carried over and, in words, what got lost, with the total in the header

- **Element:** `<tc-agent-handoff>`
- **Size:** 9.1 KB gzip · 31.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-handoff";` |
| React / Next.js | `import { AgentHandoff } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-handoff";` · tags starting with tc- are custom elements |
| Angular | `import { AgentHandoff } from "@adamstavely/trenchcoat/angular/agent-handoff";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-handoff";` |

## Example

The live example is in the gallery at `#/agent-handoff`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A task passed along a chain of agents. The agents are listed in order and, between them, each handoff says how much carried over and, in words, how much got lost. The header totals what was lost, so a dropped caveat or missing file is easy to spot. With `view="pipeline"`, the agents run across the top with a queue of waiting work between each pair.

### When to use

- Pipelines where one agent's output is the next one's input.
- Finding out why a later agent didn't know something.
- Seeing where work is piling up between agents, with the pipeline view.

### When not to use

- An agent handing work to a person – use [Handoff](handoff.md).
- One person handing to another – use [Handoff Brief](handoff-brief.md).
- Who started whom, with costs – use [Agent Tree](agent-tree.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Total** `.ui-agh__total` – how much was lost, in the header
2. **Step** `.ui-agh__step` – an agent, with `.ui-agh__role`, `.ui-agh__summary` and `.ui-agh__status` in words
3. **Handoff** `.ui-agh__link` – how much carried over and `.ui-agh__lost`
4. **Detail** `.ui-agh__detail` – the lists of what carried over and what was lost
6. **Pipeline** `.ui-agh__pipeline` – each `.ui-agh__stage`, with a `.ui-agh__queue` and its `.ui-agh__wire` between them
7. **Queue item** `.ui-agh__item` – a piece of waiting work, with `.ui-agh__warning` when it needs care

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agh-dot`, `--tc-agh-rail` and `--tc-agh-wire`. When narrow, the pipeline stacks in order, without its lines.

## Usage

### HTML

```html
<tc-agent-handoff id="chain"></tc-agent-handoff>

<script type="module">
  import "@adamstavely/trenchcoat/agent-handoff";
  import "@adamstavely/trenchcoat/tokens.css";

  const chain = document.querySelector("#chain");
  chain.steps = [
    { id: "a", agent: "Scout", status: "done" },
    { id: "b", agent: "Writer", status: "running" },
  ];
  chain.handoffs = [{ from: "a", to: "b", carried: ["The papers"], lost: ["The search terms"] }];
</script>
```

### React / Next.js

```tsx
import { AgentHandoff, type AgentHandoffLink, type AgentHandoffStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const steps: AgentHandoffStep[] = [
  { id: "a", agent: "Scout", status: "done" },
  { id: "b", agent: "Writer", status: "running" },
];
const handoffs: AgentHandoffLink[] = [{ from: "a", to: "b", carried: ["The papers"], lost: ["The search terms"] }];

export function Chain() {
  return <AgentHandoff steps={steps} handoffs={handoffs} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-handoff";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";

defineProps<{ steps: TcAgentHandoff["steps"]; handoffs: TcAgentHandoff["handoffs"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-handoff :steps="steps" :handoffs="handoffs" @tc-selected-change="onSelectedChange"></tc-agent-handoff>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentHandoff } from "@adamstavely/trenchcoat/angular/agent-handoff";
import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";

@Component({
  selector: "app-agent-handoff-example",
  imports: [AgentHandoff],
  template: `<tc-agent-handoff [steps]="steps()" [handoffs]="handoffs()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-handoff>`,
})
export class AgentHandoffExample {
  readonly steps = input.required<TcAgentHandoff["steps"]>();
  readonly handoffs = input.required<TcAgentHandoff["handoffs"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-handoff";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";

  let { steps, handoffs }: { steps: TcAgentHandoff["steps"]; handoffs: TcAgentHandoff["handoffs"] } = $props();
  let el: TcAgentHandoff;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-handoff bind:this={el} {steps} {handoffs}></tc-agent-handoff>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agent handoffs"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `steps` | – | `AgentHandoffStep[]` | `[]` | The agents, in the order the task reached them |
| `handoffs` | – | `AgentHandoffLink[]` | `[]` | What passed between them |
| `selected` | `selected` | `string \| null` | `null` | The open handoff's id (see agentHandoffId), or null. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `view` | `view` | `AgentHandoffView` | `"chain"` | How it's drawn: "chain", a list of one task's journey, or "pipeline", agents across the top with queues between them |
| `queues` | – | `AgentHandoffQueue[]` | `[]` | The work waiting between agents, shown in the pipeline view |
| `itemSelected` | `item-selected` | `string \| null` | `null` | The picked queue item's id, or null. Changed by the user unless a tc-item-selected-change listener calls preventDefault() |
| `currency` | `currency` | `string` | `"USD"` | The currency for `cost` |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for costs |
| `labels` | – | `Partial<AgentHandoffLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A handoff was opened or closed ({ selected, handoff }: AgentHandoffSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-item-selected-change` | – | Yes | A queue's item was picked or cleared ({ itemSelected, item }: AgentHandoffItemSelectedChange); cancelable – prevented, `itemSelected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agh-dot` | `var(--tc-space-2-5)` | both |
| `--tc-agh-rail` | `var(--tc-space-4)` | both |
| `--tc-agh-wire` | `var(--tc-space-6)` | both |
| `--tc-agh-line` | `var(--tc-border-strong)` | not set – this fallback applies |

#### Design tokens it reads (41)

`--tc-agh-column`, `--tc-agh-columns`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `agentHandoffId(h: Pick<AgentHandoffLink, "from" \| "to">): void` | A handoff's id: `from` and `to` joined, which is what `selected` holds |

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-agent-handoff :steps="…">` | `<tc-agent-handoff [steps]="…">` | `<tc-agent-handoff {steps}>` |
| `handoffs` | `el.handoffs = …;` | `<… handoffs={…} />` | `<tc-agent-handoff :handoffs="…">` | `<tc-agent-handoff [handoffs]="…">` | `<tc-agent-handoff {handoffs}>` |
| `queues` | `el.queues = …;` | `<… queues={…} />` | `<tc-agent-handoff :queues="…">` | `<tc-agent-handoff [queues]="…">` | `<tc-agent-handoff {queues}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-handoff :labels="…">` | `<tc-agent-handoff [labels]="…">` | `<tc-agent-handoff {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `view`, `item-selected`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-item-selected-change` | Yes | `el.addEventListener("tc-item-selected-change", (e) => …)` | `onItemSelectedChange={…}` | `@tc-item-selected-change="…"` | `(tc-item-selected-change)="…($event)"` | `el.addEventListener("tc-item-selected-change", …)` |

### Controlled

The element changes `selected` and `itemSelected` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-item-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-handoff id="agent-handoff"></tc-agent-handoff>

<script type="module">
  import "@adamstavely/trenchcoat/agent-handoff";

  const el = document.querySelector("#agent-handoff");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentHandoff } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentHandoff>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentHandoff({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <AgentHandoff {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-handoff";
import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";

const props = defineProps<{ initial: TcAgentHandoff["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcAgentHandoff["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-agent-handoff :selected="selected" @tc-selected-change="onSelectedChange"></tc-agent-handoff>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentHandoff } from "@adamstavely/trenchcoat/angular/agent-handoff";
import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";

@Component({
  selector: "app-controlled-agent-handoff",
  imports: [AgentHandoff],
  template: `<tc-agent-handoff [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-handoff>`,
})
export class ControlledAgentHandoff {
  readonly initial = input.required<TcAgentHandoff["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcAgentHandoff["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-handoff";
  import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";

  let { initial }: { initial: TcAgentHandoff["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcAgentHandoff;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcAgentHandoff["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-handoff bind:this={el} {selected}></tc-agent-handoff>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-handoff")` returns a `TcAgentHandoff` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";`
- **React / Next.js:** Props: `import type { AgentHandoffProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentHandoff>`. The element class, for refs: `import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentHandoff["steps"]` with `import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";`
- **Angular:** The directive types the template: `[steps]` takes `TcAgentHandoff["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentHandoff } from "@adamstavely/trenchcoat/agent-handoff";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Agent handoffs" |
| `selected` | `string \| null` | The open handoff's id – controlled when given |
| `defaultSelected` | `string \| null` | The open handoff on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, handoff: AgentHandoffLink \| null) => void` | A handoff was opened or closed |
| `itemSelected` | `string \| null` | The picked queue item's id – controlled when given |
| `defaultItemSelected` | `string \| null` | The picked queue item on mount when `itemSelected` isn't controlled |
| `onItemSelectedChange` | `(itemSelected: string \| null, item: AgentHandoffQueueItem \| null) => void` | A queue's item was picked or cleared |

*Renamed or hidden on the wrapper: `heading`, `selected`, `itemSelected`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between handoffs |
| Home / End | Go to the first or last handoff |
| Enter / Space | Open or close a handoff |
| Escape | Close the open handoff, or clear the picked item from within a queue |
| ← → | In the pipeline, move between queue headers or items |

In the pipeline, the queue headers are one tab stop and the items another. On an item, ↑ ↓ ← → move across all the queues, and Enter or Space picks it. The lines can also be clicked, and the header does the same thing by keyboard.

### Screen readers

The chain is an ordered list named by the heading. The handoffs are one tab stop, and each is a button named for who passed to whom, with `aria-expanded` and `aria-controls`. Status, losses and warnings are always in words. Queue items are buttons with `aria-pressed`. In the pipeline, the agents and queues are read in order in one list, and the lines are hidden.

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.9 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **31.3 KB** | **9.1 KB** |
| With Lit – the first component on a page | 52.0 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | the gallery demo's data, 89 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of steps replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 32 ms | steps: first render, 1,738 nodes; update 3.3 ms |
| 1,000 items | 182 ms | steps: first render, 17,038 nodes; update 18 ms |

1,000 items of steps: 182 ms. It renders every item, so a first render passes 50 ms (a long task) at about 270 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `carried` and `lost` as things a person would recognise, such as "The note that two studies share a sample". The element only shows what you give it, so what counts as lost is for your system to work out. Queues show only in the pipeline view, between agents next to each other in `steps`, and item ids must be unique across all the queues. `icon` is an element from your page, and is decorative.

## Do and don't

### Do

- Report what was dropped, even when it was on purpose.
- Listen for `tc-selected-change` and `tc-item-selected-change` to show more elsewhere on the page.

### Don't

- Don't use `lost` for errors. A failed agent gets `status: "failed"`.
- Don't use `warning` for something that was dropped. That belongs in `lost`.

## Related

- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Handoff Brief](handoff-brief.md) – Work passing from one person to another – summary, open items and commitments, each acknowledged by the receiver, blocked when they lack access
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover

## Changelog

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`), **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`): where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents, what a group of agents found, and one agent at work.
