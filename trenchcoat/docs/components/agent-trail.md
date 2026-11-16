<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Trail

**Agents** · New

The steps an agent works through as one quiet trail – the task and "3/5" on top, done steps with a check and their time, the current one with what it's doing and its sub-steps under a live timer, a waiting step on a dashed ring with Needs your OK, Approve and Decline, and a light running down to where it is

- **Element:** `<tc-agent-trail>`
- **Size:** 7.5 KB gzip · 23.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-trail";` |
| React / Next.js | `import { AgentTrail } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-trail";` · tags starting with tc- are custom elements |
| Angular | `import { AgentTrail } from "@adamstavely/trenchcoat/angular/agent-trail";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-trail";` |

## Example

The live example is in the gallery at `#/agent-trail`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The steps an agent works through, as one quiet trail for a chat answer or a side panel. The header has the task and how far it is ("3/5"). Done steps carry a check and how long they took. The step it's on says what it's doing and branches into its sub-steps, the one under way with a live timer. A step that needs a person waits behind a dashed ring with "Needs your OK" and Approve and Decline. What's still to come is quiet.

### When to use

- Showing where an agent is in a task while it runs: what's done, what it's doing now and what comes next.
- A chat answer, a side panel or a task card that should show the agent's steps without a full trace.
- Plans with a step that needs approval, such as merging, sending or paying, so people see the stop coming.

### When not to use

- Reviewing or editing a plan before it runs – use [Agent Plan](agent-plan.md).
- The timing and cost of every call in a run – use [Trace Waterfall](trace-waterfall.md).
- The decision itself, with its context and diff – use [Approval Card](approval-card.md) or [Decision Card](decision-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Trail** `.ui-atr__trail` – a `.ui-atr__step` per step, each with `.ui-atr__mark` and `.ui-atr__line` on its rail
3. **Light** `.ui-atr__light` – runs down the line of the step it's on
4. **Sub-steps** `.ui-atr__subs` – a `.ui-atr__sub` each, with `.ui-atr__timer` on the one under way
5. **Decision** `.ui-atr__decide` – Approve and Decline on a waiting step

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-atr-mark`, `--tc-atr-sub-mark` and `--tc-atr-light` (how long the light takes down the trail).

## Usage

### HTML

```html
<tc-agent-trail id="trail" heading="Fix the date parser"></tc-agent-trail>

<script type="module">
  import "@adamstavely/trenchcoat/agent-trail";
  import "@adamstavely/trenchcoat/tokens.css";

  const trail = document.querySelector("#trail");
  const started = Date.now() - 90000;
  trail.steps = [
    { id: "repro", title: "Reproduce the bug", status: "done", started, ended: started + 40000 },
    {
      id: "fix",
      title: "Write the fix",
      status: "running",
      started: started + 40000,
      detail: "Handling the hour the clocks skip",
      substeps: [
        { id: "a", title: "Patch parseLocal()", status: "done", started: started + 40000, ended: started + 70000 },
        { id: "b", title: "Add tests", status: "running", started: started + 70000 },
      ],
    },
    { id: "pr", title: "Open the pull request", status: "pending" },
  ];
  trail.addEventListener("tc-decision", (e) => console.log(e.detail.decision, e.detail.step.id));
</script>
```

### React / Next.js

```tsx
import { AgentTrail, type AgentTrailStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Trail({ steps, onDecide }: { steps: AgentTrailStep[]; onDecide: (id: string, approve: boolean) => void }) {
  return (
    <AgentTrail
      title="Fix the date parser"
      steps={steps}
      onTcDecision={(e) => {
        e.preventDefault();
        onDecide(e.detail.step.id, e.detail.decision === "approve");
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-trail";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";

defineProps<{ steps: TcAgentTrail["steps"]; labels: TcAgentTrail["labels"] }>();
const onDecision = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-trail :steps="steps" :labels="labels" @tc-decision="onDecision"></tc-agent-trail>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentTrail } from "@adamstavely/trenchcoat/angular/agent-trail";
import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";

@Component({
  selector: "app-agent-trail-example",
  imports: [AgentTrail],
  template: `<tc-agent-trail [steps]="steps()" [labels]="labels()" (tc-decision)="onDecision($event)"></tc-agent-trail>`,
})
export class AgentTrailExample {
  readonly steps = input.required<TcAgentTrail["steps"]>();
  readonly labels = input.required<TcAgentTrail["labels"]>();
  onDecision(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-trail";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";

  let { steps, labels }: { steps: TcAgentTrail["steps"]; labels: TcAgentTrail["labels"] } = $props();
  let el: TcAgentTrail;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decision", on);
    return () => el.removeEventListener("tc-decision", on);
  });
</script>

<tc-agent-trail bind:this={el} {steps} {labels}></tc-agent-trail>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Task"` | The task, as the header's title |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the task |
| `steps` | – | `AgentTrailStep[]` | `[]` | The steps, in order |
| `now` | `now` | `number \| undefined` | `undefined` | "Now", epoch ms; unset, the element keeps its own clock |
| `collapsed` | `collapsed` | `boolean` | `false` | Folded to the header. Changed by the user unless a tc-collapsed-change listener calls preventDefault() |
| `labels` | – | `Partial<AgentTrailLabels>` | `{}` | Rename any of the words |
| `current` | – | `AgentTrailStep \| undefined` | – | The step it's on: the first running or waiting one, else the first not done |
| `ticking` | – | `` | – | Whether the timer is ticking, for the page and for tests |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decision` | – | Yes | Approve or Decline was pressed on a waiting step ({ decision, step }: AgentTrailDecisionDetail); cancelable – prevented, the step stays as it was |
| `tc-collapsed-change` | – | Yes | The trail was folded or opened ({ collapsed }: AgentTrailCollapsedChange); cancelable – prevented, `collapsed` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-atr-mark` | `var(--tc-space-4)` | both |
| `--tc-atr-sub-mark` | `var(--tc-space-2-5)` | both |
| `--tc-atr-light` | `calc(var(--tc-duration-slow) * 4)` | both |

#### Design tokens it reads (31)

`--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-slow`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `agentTrailClock(ms: number): void` | m:ss, or h:mm:ss past an hour |

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-agent-trail :steps="…">` | `<tc-agent-trail [steps]="…">` | `<tc-agent-trail {steps}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-trail :labels="…">` | `<tc-agent-trail [labels]="…">` | `<tc-agent-trail {labels}>` |

*Also attributes: `heading`, `description`, `now`, `collapsed` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decision` | Yes | `el.addEventListener("tc-decision", (e) => …)` | `onTcDecision={…}` | `@tc-decision="…"` | `(tc-decision)="…($event)"` | `el.addEventListener("tc-decision", …)` |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `collapsed` itself unless a listener calls `preventDefault()` on `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-trail id="agent-trail"></tc-agent-trail>

<script type="module">
  import "@adamstavely/trenchcoat/agent-trail";

  const el = document.querySelector("#agent-trail");
  el.addEventListener("tc-collapsed-change", (e) => {
    e.preventDefault(); // the element keeps its collapsed…
    if (allowed(e.detail.collapsed)) el.collapsed = e.detail.collapsed; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-trail";
import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";

const props = defineProps<{ initial: TcAgentTrail["collapsed"] }>();
const collapsed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCollapsedChange = (e: CustomEvent<{ collapsed: TcAgentTrail["collapsed"] }>) => {
  e.preventDefault();
  collapsed.value = e.detail.collapsed;
};
</script>

<template>
  <tc-agent-trail :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-agent-trail>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentTrail } from "@adamstavely/trenchcoat/angular/agent-trail";
import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";

@Component({
  selector: "app-controlled-agent-trail",
  imports: [AgentTrail],
  template: `<tc-agent-trail [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-agent-trail>`,
})
export class ControlledAgentTrail {
  readonly initial = input.required<TcAgentTrail["collapsed"]>();
  readonly collapsed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCollapsedChange(e: CustomEvent<{ collapsed: TcAgentTrail["collapsed"] }>) {
    e.preventDefault();
    this.collapsed.set(e.detail.collapsed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-trail";
  import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";

  let { initial }: { initial: TcAgentTrail["collapsed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let collapsed = $derived(initial);
  let el: TcAgentTrail;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      collapsed = (e as CustomEvent<{ collapsed: TcAgentTrail["collapsed"] }>).detail.collapsed;
    };
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-agent-trail bind:this={el} {collapsed}></tc-agent-trail>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-trail")` returns a `TcAgentTrail` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";`
- **React / Next.js:** Props: `import type { AgentTrailProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentTrail>`. The element class, for refs: `import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentTrail["steps"]` with `import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";`
- **Angular:** The directive types the template: `[steps]` takes `TcAgentTrail["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentTrail } from "@adamstavely/trenchcoat/agent-trail";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The task, as the header's title |
| `collapsed` | `boolean` | Folded to the header – controlled when given |
| `defaultCollapsed` | `boolean` | Folded on mount when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: boolean) => void` | The trail was folded or opened |

*Renamed or hidden on the wrapper: `heading`, `collapsed`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move to Hide steps, then to Approve and Decline on a waiting step |
| Enter / Space | Fold or open the trail, or approve or decline |

### Screen readers

The trail is an ordered list named after the task, and each step's status is in words, also for done and upcoming steps where the word isn't shown. Hide steps reports whether the trail is open (`aria-expanded`). Approve and Decline name the step they act on. When the step it's on changes, a polite status line says so. The timer isn't announced, because a live region reading it every second would drown everything else out. The light and the marks are decorative.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.3 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **23.3 KB** | **7.5 KB** |
| With Lit – the first component on a page | 43.0 KB | 13.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 87 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of steps replaced |
| First on the page | 8.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.1 ms | steps: first render, 1,398 nodes; update 0.5 ms |
| 1,000 items | 53 ms | steps: first render, 13,818 nodes; update 4.9 ms |

1,000 items of steps: 53 ms. It renders every item, so a first render passes 50 ms (a long task) at about 940 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name steps as actions: "Find the cause", "Open the pull request".
- Keep `detail` to one line: what it's doing now, or why it waits.
- Times are epoch ms. Pass `now` for a fixed clock; otherwise the element keeps its own.

## Do and don't

### Do

- Listen for `tc-decision` to really approve or decline the step. Prevent it when the decision didn't go through.
- Update `steps` as the agent moves on; the trail follows.

### Don't

- Don't put a long plan with dozens of steps in it – group them into a few steps with sub-steps.
- Don't rely on the step's own change after Approve in React: `steps` comes from your state, so update it there.

## Related

- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Agent Monitor](agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Decision Card](decision-card.md) – One question an agent needs answered before it carries on, docked above the composer – how long it has waited, numbered options with one recommended (focused, never picked), 1–9 to pick, Something else, or Approve and Decline with a reason, a queue to step through, and a receipt with Undo
