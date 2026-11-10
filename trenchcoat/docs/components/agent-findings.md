<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Findings

**Agents** · New

A group of agents checking something – one row per agent with its progress, beside a feed of what they've found, newest first, with severity in words, filters and new findings announced

- **Element:** `<tc-agent-findings>`
- **Size:** 9.8 KB gzip · 32.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-findings";` |
| React / Next.js | `import { AgentFindings } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-findings";` · tags starting with tc- are custom elements |
| Angular | `import { AgentFindings } from "@adamstavely/trenchcoat/angular/agent-findings";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-findings";` |

## Example

The live example is in the gallery at `#/agent-findings`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A group of agents checking something. One row per agent shows its progress in numbers and a bar, beside a feed of what they've found, newest first, each with its severity in words and a mark. New findings glide in and are announced politely. A line above totals the checks and what's been found so far, and `layout="stacked"` puts the agents above the feed.

### When to use

- Several agents reviewing a document, a dataset or a change at once.
- Watching results arrive before the whole check has finished.

### When not to use

- Many workers with no findings to show – use [Fan-out Grid](fan-out-grid.md).
- Claims a person must verify one by one – use [Verification Queue](verification-queue.md).
- Alerts someone must act on – use [Alert Feed](alert-feed.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Agents** `.ui-agf__agents` – each `.ui-agf__agent` with `.ui-agf__status`, `.ui-agf__track` and `.ui-agf__pct`
2. **Filters** `.ui-agf__filters` – by agent and by severity
3. **Feed** `.ui-agf__feed` – each `.ui-agf__finding` with `.ui-agf__severity`
4. **Detail** `.ui-agf__detail` – more about the open finding
5. **Summary** `.ui-agf__summary` – `.ui-agf__checks` across all the agents, and `.ui-agf__totals` by severity

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. When narrow, the agents sit above the feed. With `layout="stacked"` they always do, and findings take one line when there's room. A page can set `--tc-agf-bar`.

## Usage

### HTML

```html
<tc-agent-findings id="check"></tc-agent-findings>

<script type="module">
  import "@adamstavely/trenchcoat/agent-findings";
  import "@adamstavely/trenchcoat/tokens.css";

  const check = document.querySelector("#check");
  check.agents = [{ id: "a", name: "Budget checker", status: "running", progress: 0.6 }];
  check.findings = [{ id: "f", agent: "a", severity: "high", title: "Totals don't match" }];
</script>
```

### React / Next.js

```tsx
import { AgentFindings, type AgentFinding, type AgentFindingsAgent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents: AgentFindingsAgent[] = [{ id: "a", name: "Budget checker", status: "running", progress: 0.6 }];
const findings: AgentFinding[] = [{ id: "f", agent: "a", severity: "high", title: "Totals don't match" }];

export function Check() {
  return <AgentFindings agents={agents} findings={findings} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-findings";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";

defineProps<{ agents: TcAgentFindings["agents"]; findings: TcAgentFindings["findings"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-findings :agents="agents" :findings="findings" @tc-selected-change="onSelectedChange"></tc-agent-findings>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentFindings } from "@adamstavely/trenchcoat/angular/agent-findings";
import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";

@Component({
  selector: "app-agent-findings-example",
  imports: [AgentFindings],
  template: `<tc-agent-findings [agents]="agents()" [findings]="findings()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-findings>`,
})
export class AgentFindingsExample {
  readonly agents = input.required<TcAgentFindings["agents"]>();
  readonly findings = input.required<TcAgentFindings["findings"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-findings";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";

  let { agents, findings }: { agents: TcAgentFindings["agents"]; findings: TcAgentFindings["findings"] } = $props();
  let el: TcAgentFindings;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-findings bind:this={el} {agents} {findings}></tc-agent-findings>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agent findings"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `agents` | – | `AgentFindingsAgent[]` | `[]` | The agents doing the checking |
| `findings` | – | `AgentFinding[]` | `[]` | What they've found, in any order: findings with `at` show newest first |
| `selected` | `selected` | `string \| null` | `null` | The open finding's id, or null. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `agentFilter` | `agent-filter` | `string` | `"all"` | The agent id the feed shows, or "all". Changed by the user unless a tc-agent-filter-change listener calls preventDefault() |
| `severityFilter` | `severity-filter` | `AgentFindingsSeverityFilter` | `"all"` | The severity the feed shows, or "all". Changed by the user unless a tc-severity-filter-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for times |
| `layout` | `layout` | `AgentFindingsLayout` | `"columns"` | How the agents and feed sit: "columns", side by side, or "stacked", agents above the feed |
| `now` | `now` | `number \| undefined` | `undefined` | "Now", epoch ms: when given, findings say how long ago, such as "5 sec. ago". The element doesn't read the clock |
| `labels` | – | `Partial<AgentFindingsLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A finding was opened or closed ({ selected, finding }: AgentFindingsSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-agent-filter-change` | – | Yes | The agent filter changed ({ agentFilter }: AgentFindingsAgentFilterChange); cancelable – prevented, `agentFilter` stays as it was |
| `tc-severity-filter-change` | – | Yes | The severity filter changed ({ severityFilter }: AgentFindingsSeverityFilterChange); cancelable – prevented, `severityFilter` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agf-bar` | `var(--tc-space-1)` | both |

#### Design tokens it reads (41)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-agent-findings :agents="…">` | `<tc-agent-findings [agents]="…">` | `<tc-agent-findings {agents}>` |
| `findings` | `el.findings = …;` | `<… findings={…} />` | `<tc-agent-findings :findings="…">` | `<tc-agent-findings [findings]="…">` | `<tc-agent-findings {findings}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-findings :labels="…">` | `<tc-agent-findings [labels]="…">` | `<tc-agent-findings {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `agent-filter`, `severity-filter`, `locale`, `layout`, `now` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-agent-filter-change` | Yes | `el.addEventListener("tc-agent-filter-change", (e) => …)` | `onTcAgentFilterChange={…}` | `@tc-agent-filter-change="…"` | `(tc-agent-filter-change)="…($event)"` | `el.addEventListener("tc-agent-filter-change", …)` |
| `tc-severity-filter-change` | Yes | `el.addEventListener("tc-severity-filter-change", (e) => …)` | `onTcSeverityFilterChange={…}` | `@tc-severity-filter-change="…"` | `(tc-severity-filter-change)="…($event)"` | `el.addEventListener("tc-severity-filter-change", …)` |

### Controlled

The element changes `selected`, `agentFilter` and `severityFilter` itself unless a listener calls `preventDefault()` on `tc-selected-change`, `tc-agent-filter-change` or `tc-severity-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-findings id="agent-findings"></tc-agent-findings>

<script type="module">
  import "@adamstavely/trenchcoat/agent-findings";

  const el = document.querySelector("#agent-findings");
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
import { AgentFindings } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentFindings>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentFindings({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <AgentFindings {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-findings";
import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";

const props = defineProps<{ initial: TcAgentFindings["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcAgentFindings["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-agent-findings :selected="selected" @tc-selected-change="onSelectedChange"></tc-agent-findings>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentFindings } from "@adamstavely/trenchcoat/angular/agent-findings";
import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";

@Component({
  selector: "app-controlled-agent-findings",
  imports: [AgentFindings],
  template: `<tc-agent-findings [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-findings>`,
})
export class ControlledAgentFindings {
  readonly initial = input.required<TcAgentFindings["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcAgentFindings["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-findings";
  import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";

  let { initial }: { initial: TcAgentFindings["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcAgentFindings;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcAgentFindings["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-findings bind:this={el} {selected}></tc-agent-findings>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-findings")` returns a `TcAgentFindings` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";`
- **React / Next.js:** Props: `import type { AgentFindingsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentFindings>`. The element class, for refs: `import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentFindings["agents"]` with `import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";`
- **Angular:** The directive types the template: `[agents]` takes `TcAgentFindings["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentFindings } from "@adamstavely/trenchcoat/agent-findings";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Agent findings" |
| `selected` | `string \| null` | The open finding's id – controlled when given |
| `defaultSelected` | `string \| null` | The open finding on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, finding: AgentFinding \| null) => void` | A finding was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between findings |
| Home / End | Go to the first or last finding |
| Enter / Space | Open or close a finding |
| Escape | Close the open finding |
| Tab | Moves through the filters, then the feed |

### Screen readers

Each progress bar is a `progressbar` named for its agent. The findings are one tab stop, and each is a button with `aria-expanded`. Severity is a word as well as a shape and a colour. The totals are a list named "Found so far", and each agent's counts include the severity's word for screen readers. `role="status"` announces new findings, several at once as a count, and never the ones there at the start.

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
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-31 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.0 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/list-motion` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **32.0 KB** | **9.8 KB** |
| With Lit – the first component on a page | 55.2 KB | 17.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 136 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of agents replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.9 ms | agents: first render, 2,141 nodes; update 1.4 ms |
| 1,000 items | 88 ms | agents: first render, 20,741 nodes; update 13 ms |

1,000 items of agents: 88 ms. It renders every item, so a first render passes 50 ms (a long task) at about 570 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `title` as what's wrong, in a line, and keep the evidence for `detail`. Use `high` sparingly, so it stays meaningful. Give `checked` and `total` as numbers to get a fraction, a bar and the overall line, or `checked` in words, such as "31 of 50 lines". `location` is a file and line or similar, shown in mono. Each agent counts the two most severe levels: critical and high when anything is critical, otherwise high and medium.

## Do and don't

### Do

- Give `at`, so the newest come first, and `now` to show how long ago. The element doesn't read the clock, so update `now` yourself to keep it fresh.
- Keep ids stable between updates, so only new findings are announced.

### Don't

- Don't treat an empty feed as all clear until every agent is done.
- Don't use `critical` as a stronger `high`. Keep it for what must stop the work.

## Related

- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Alert Feed](alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements
- [Red-team Finding](../blocks/red-team-finding.md) – What an adversarial test broke – a findings list, then the picked one's severity, failed invariants, scenario, evidence and a response timeline with undo (uses `@adamstavely/trenchcoat/react`: `agent-ledger`, `button`)

## Changelog

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`), **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`): where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents, what a group of agents found, and one agent at work.
