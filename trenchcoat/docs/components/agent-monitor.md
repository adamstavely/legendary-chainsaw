<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Monitor

**Agents** · New

One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop

- **Element:** `<tc-agent-monitor>`
- **Size:** 8.5 KB gzip · 26.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-monitor";` |
| React / Next.js | `import { AgentMonitor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-monitor";` · tags starting with tc- are custom elements |
| Angular | `import { AgentMonitor } from "@adamstavely/trenchcoat/angular/agent-monitor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-monitor";` |

## Example

The live example is in the gallery at `#/agent-monitor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One agent at work, as a compact card: its current step with a clock and the cost so far, a strip of its steps sized by how long each took, and the finished steps as a list. Picking a step shows its detail.

### When to use

- Keeping an eye on one running agent beside other work.
- Checking at a glance where the time has gone.

### When not to use

- A full breakdown of calls, tokens and costs – use [Trace Waterfall](trace-waterfall.md).
- Watching the agent's screen – use [Live View](live-view.md).
- Many agents at once – use [Agent Inbox](agent-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Now** `.ui-amn__now` – `.ui-amn__current-step`, `.ui-amn__clock` and `.ui-amn__cost`
2. **Strip** `.ui-amn__strip` – a `.ui-amn__segment` per step, sized by how long it took
3. **Detail** `.ui-amn__detail` – the picked step
4. **Finished** `.ui-amn__steps` – each `.ui-amn__step-row` with `.ui-amn__tool`
5. **Actions** `.ui-amn__actions` – Pause or Resume, and Stop

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-amn-strip` and `--tc-amn-segment-min`.

## Usage

### HTML

```html
<tc-agent-monitor id="run" name="Archive reader"></tc-agent-monitor>

<script type="module">
  import "@adamstavely/trenchcoat/agent-monitor";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.startedAt = Date.now() - 60000;
  run.cost = 0.42;
  run.steps = [{ id: "a", label: "Search the archive", startedAt: run.startedAt, status: "running" }];
  run.addEventListener("tc-action", (e) => console.log(e.detail.action));
</script>
```

### React / Next.js

```tsx
import { AgentMonitor, type AgentMonitorStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Run({ startedAt, steps }: { startedAt: number; steps: AgentMonitorStep[] }) {
  return <AgentMonitor name="Archive reader" startedAt={startedAt} steps={steps} cost={0.42} onTcAction={(e) => console.log(e.detail.action)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-monitor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";

defineProps<{ steps: TcAgentMonitor["steps"]; labels: TcAgentMonitor["labels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-monitor :steps="steps" :labels="labels" @tc-selected-change="onSelectedChange"></tc-agent-monitor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentMonitor } from "@adamstavely/trenchcoat/angular/agent-monitor";
import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";

@Component({
  selector: "app-agent-monitor-example",
  imports: [AgentMonitor],
  template: `<tc-agent-monitor [steps]="steps()" [labels]="labels()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-monitor>`,
})
export class AgentMonitorExample {
  readonly steps = input.required<TcAgentMonitor["steps"]>();
  readonly labels = input.required<TcAgentMonitor["labels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-monitor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";

  let { steps, labels }: { steps: TcAgentMonitor["steps"]; labels: TcAgentMonitor["labels"] } = $props();
  let el: TcAgentMonitor;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-monitor bind:this={el} {steps} {labels}></tc-agent-monitor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `"Agent"` | The agent's name |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the name |
| `status` | `status` | `AgentMonitorStatus` | `"running"` | Where the run stands: "running", "paused", "done" or "failed" |
| `currentStep` | `current-step` | `string \| undefined` | `undefined` | What it's doing now; by default the label of the step still running |
| `startedAt` | `started-at` | `number \| undefined` | `undefined` | When the run started, epoch ms |
| `endedAt` | `ended-at` | `number \| undefined` | `undefined` | When it finished or paused, epoch ms; by default when its last step ended |
| `now` | `now` | `number \| undefined` | `undefined` | "Now", epoch ms; unset, the element keeps its own clock |
| `cost` | `cost` | `number \| undefined` | `undefined` | The cost so far |
| `currency` | `currency` | `string` | `"USD"` | The cost's currency, an ISO 4217 code |
| `steps` | – | `AgentMonitorStep[]` | `[]` | The steps, in order |
| `selected` | `selected` | `string \| null` | `null` | The picked step's id, or null. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `actions` | `actions` | `boolean` | `true` | Offer Pause, Resume and Stop; set actions="false" to only watch |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for the cost |
| `labels` | – | `Partial<AgentMonitorLabels>` | `{}` | Rename any of the words |
| `ticking` | – | `` | – | Whether the clock is ticking, for the page and for tests |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A step was picked or closed ({ selected, step }: AgentMonitorSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-action` | – | Yes | Pause, Resume or Stop was pressed ({ action }: AgentMonitorActionDetail); cancelable – prevented, Pause and Resume leave `status` as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-amn-strip` | `var(--tc-space-4)` | both |
| `--tc-amn-segment-min` | `var(--tc-space-2)` | both |

#### Design tokens it reads (33)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-normal`, `--tc-meter-fill`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `agentMonitorClock(ms: number): void` | h:mm:ss past an hour, else m:ss |

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-agent-monitor :steps="…">` | `<tc-agent-monitor [steps]="…">` | `<tc-agent-monitor {steps}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-monitor :labels="…">` | `<tc-agent-monitor [labels]="…">` | `<tc-agent-monitor {labels}>` |

*Also attributes: `name`, `description`, `status`, `current-step`, `started-at`, `ended-at`, `now`, `cost` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-monitor id="agent-monitor"></tc-agent-monitor>

<script type="module">
  import "@adamstavely/trenchcoat/agent-monitor";

  const el = document.querySelector("#agent-monitor");
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
import { AgentMonitor } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentMonitor>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentMonitor({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <AgentMonitor {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-monitor";
import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";

const props = defineProps<{ initial: TcAgentMonitor["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcAgentMonitor["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-agent-monitor :selected="selected" @tc-selected-change="onSelectedChange"></tc-agent-monitor>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentMonitor } from "@adamstavely/trenchcoat/angular/agent-monitor";
import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";

@Component({
  selector: "app-controlled-agent-monitor",
  imports: [AgentMonitor],
  template: `<tc-agent-monitor [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-agent-monitor>`,
})
export class ControlledAgentMonitor {
  readonly initial = input.required<TcAgentMonitor["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcAgentMonitor["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-monitor";
  import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";

  let { initial }: { initial: TcAgentMonitor["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcAgentMonitor;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcAgentMonitor["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-agent-monitor bind:this={el} {selected}></tc-agent-monitor>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-monitor")` returns a `TcAgentMonitor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";`
- **React / Next.js:** Props: `import type { AgentMonitorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentMonitor>`. The element class, for refs: `import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentMonitor["steps"]` with `import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";`
- **Angular:** The directive types the template: `[steps]` takes `TcAgentMonitor["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentMonitor } from "@adamstavely/trenchcoat/agent-monitor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `selected` | `string \| null` | The picked step's id – controlled when given |
| `defaultSelected` | `string \| null` | The picked step on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, step: AgentMonitorStep \| null) => void` | A step was picked or closed |

*Renamed or hidden on the wrapper: `selected`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move through the strip, or through the list |
| Home / End | Go to the first or last step |
| Enter / Space | Pick a step, or un-pick it |
| Escape | Close the detail, and go back to what opened it |

### Screen readers

The strip is a named group with one tab stop, and each segment's name says the step, its status and how long it took. The finished steps are a list with one tab stop. The clock isn't announced, because a live region reading it every second would drown everything else out. Status is in words.

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
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This component alone** | 17.8 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **26.7 KB** | **8.5 KB** |
| With Lit – the first component on a page | 47.4 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 55 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of steps replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.6 ms | steps: first render, 679 nodes; update 0.6 ms |
| 1,000 items | 30 ms | steps: first render, 6,529 nodes; update 4.5 ms |

1,000 items of steps: 30 ms, 6,529 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Tools are words, such as "Archive search". A page may pass `toolIcon`, its own element, but the library draws no third-party logos. `cost` is a number and `currency` an ISO 4217 code.

## Do and don't

### Do

- Set `ended-at` when a run pauses or finishes, so the clock shows the real time after a reload.
- Listen for `tc-action` to really pause or stop the agent. Prevent it if that fails.

### Don't

- Don't rely on Stop to change `status`. Only the page knows how the run ended, so set it there.

## Related

- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Live View](live-view.md) – Watch the agent's screen as it works – its clicks and typing drawn on top, a caption for each step, and Pause or Take over at any moment
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo

## Changelog

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`), **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`): where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents, what a group of agents found, and one agent at work.
