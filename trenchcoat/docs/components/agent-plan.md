<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Plan

**Agents** · Also in React

An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step

- **Element:** `<tc-agent-plan>`
- **Size:** 15.8 KB gzip · 70.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-plan";` |
| React / Next.js | `import { AgentPlan } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-plan";` · tags starting with tc- are custom elements |
| Angular | `import { AgentPlan } from "@adamstavely/trenchcoat/angular/agent-plan";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-plan";` |

## Example

The live example is in the gallery at `#/agent-plan`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent proposes a step-by-step plan; a person adjusts it, then watches it run. In review, steps can be renamed,
removed, reordered by dragging or from the keyboard, and new ones added at the end. Once running, the current step
shows a spinner and a live timer, done steps draw a check and show how long they took, a failed step can offer “Retry
from here”, and a thin line on the left fills as the plan moves along. People get a say before the agent acts, and a
clear view of where it is afterwards. The phase is always the app's: the plan never moves itself from review to
running or done.

### When to use

- Before an agent starts a multi-step task, so people can correct the approach while it's still cheap.
- Showing the progress of a run that follows a known list of steps.
- Letting people retry from the step that failed instead of starting over.

### When not to use

- Comparing what was planned with what actually happened, after the run – use [Plan vs Actual](plan-vs-actual.md).
- Going back to an earlier point of a run and trying again from there – use [Run Checkpoints](run-checkpoints.md).
- Approving a single action, not a whole plan – use [Approval Card](approval-card.md).
- Timing every call and sub-step of a run in detail – use [Trace Waterfall](trace-waterfall.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Step** `.ui-pl__step` – a number or status mark, the title, a detail line and the tool
3. **Grip** `.ui-pl__grip` – drag to reorder; shows on hover or focus, in review only
4. **Step buttons** `.ui-pl__aside` – move up, move down and remove on hover or focus in review; the timer or duration while running
5. **Add step** `.ui-pl__add` – a field that adds a step at the end
6. **Footer** `.ui-pl__foot` – Cancel and Run plan in review; the run's status and elapsed time afterwards

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and the footer – the hint, Cancel and
Run plan, later the run's status – on the tray below it. Clean keeps everything in one white card, the header as its
first row and the footer as its last with a secondary Cancel; a running status line shimmers, and the done and failed
marks sit in round badges.

## Usage

### HTML

```html
<tc-agent-plan id="plan" heading="Find out why customers churned" estimate="~2 min" status="draft" cancellable></tc-agent-plan>

<script type="module">
  import "@adamstavely/trenchcoat/agent-plan";
  import "@adamstavely/trenchcoat/tokens.css";

  const plan = document.querySelector("#plan");
  plan.steps = [
    { id: "pull", title: "Pull churned accounts", tool: "stripe.query" },
    { id: "read", title: "Read their last support tickets", tool: "zendesk.search" },
    { id: "sum", title: "Summarise the reasons" },
  ];
  plan.addEventListener("tc-run", (e) => {
    plan.status = "running";
    console.log(e.detail.steps.map((s) => s.id));
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentPlan, type AgentPlanStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const draft: AgentPlanStep[] = [
  { id: "pull", title: "Pull churned accounts", tool: "stripe.query" },
  { id: "read", title: "Read their last support tickets", tool: "zendesk.search" },
  { id: "sum", title: "Summarise the reasons" },
];

export function ChurnPlan({ start }: { start: (steps: AgentPlanStep[]) => Promise<void> }) {
  const [steps, setSteps] = useState(draft);
  const [status, setStatus] = useState<"draft" | "running" | "done">("draft");
  return (
    <AgentPlan
      title="Find out why customers churned"
      estimate="~2 min"
      steps={steps}
      status={status}
      onChange={setSteps}
      onRun={async (final) => {
        await start(final);
        setStatus("running");
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-plan";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";

defineProps<{ steps: TcAgentPlan["steps"]; runner: TcAgentPlan["runner"] }>();
const onStepsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-plan :steps="steps" :runner="runner" @tc-steps-change="onStepsChange"></tc-agent-plan>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentPlan } from "@adamstavely/trenchcoat/angular/agent-plan";
import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";

@Component({
  selector: "app-agent-plan-example",
  imports: [AgentPlan],
  template: `<tc-agent-plan [steps]="steps()" [runner]="runner()" (tc-steps-change)="onStepsChange($event)"></tc-agent-plan>`,
})
export class AgentPlanExample {
  readonly steps = input.required<TcAgentPlan["steps"]>();
  readonly runner = input.required<TcAgentPlan["runner"]>();
  onStepsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-plan";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";

  let { steps, runner }: { steps: TcAgentPlan["steps"]; runner: TcAgentPlan["runner"] } = $props();
  let el: TcAgentPlan;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-steps-change", on);
    return () => el.removeEventListener("tc-steps-change", on);
  });
</script>

<tc-agent-plan bind:this={el} {steps} {runner}></tc-agent-plan>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `steps` | – | `AgentPlanStep[]` | `[]` | The steps. Edits apply unless a tc-steps-change listener calls preventDefault() |
| `status` | `status` | `AgentPlanStatus` | `"draft"` | "draft" = review and edit, "running" = executing, "done" = finished – always set by the app |
| `heading` | `heading` | `string` | `""` | The goal of the plan, shown as the heading |
| `estimate` | `estimate` | `string` | `""` | Estimated run time shown in review, e.g. "~2 min" |
| `cancellable` | `cancellable` | `boolean` | `false` | Shows a "Cancel" button next to "Run plan" (fires tc-cancel) |
| `retryable` | `retryable` | `boolean` | `false` | Shows "Retry from here" on failed steps (fires tc-retry) |
| `rerunnable` | `rerunnable` | `boolean` | `false` | Shows "Run again" once the plan is done (fires tc-run) |
| `runner` | – | `((steps: AgentPlanStep[]) => void \| Promise<unknown>) \| undefined` | `undefined` | Called on run (as well as tc-run). May return a promise: the button waits, and if it rejects the plan stays in review and says so |
| `retrier` | – | `((stepId: string) => void \| Promise<unknown>) \| undefined` | `undefined` | Called on retry (as well as tc-retry). May return a promise: the button waits, and says so if it rejects |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-steps-change` | – | Yes | An edit in review: rename, remove, reorder, add (detail: { steps: AgentPlanStep[] }); cancelable |
| `tc-run` | – | No | "Run plan" or "Run again" pressed (detail: { steps: AgentPlanStep[] }, in their final order) |
| `tc-retry` | – | No | "Retry from here" pressed on a failed step (detail: { stepId: string }) |
| `tc-cancel` | – | No | "Cancel" pressed (shown with `cancellable`); detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-plan-raise-bg` | `light-dark(#ffffff, #1f1f22)` | standard |
| `--tc-agent-plan-rail` | `light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))` | standard, clean |
| `--tc-agent-plan-lift` | `0 1px 2px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.7))` | standard |
| `--tc-agent-plan-inset` | `30px` | standard, clean |
| `--tc-agent-plan-shine` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | clean |
| `--tc-agent-plan-accent` | `var(--tc-accent-solid)` | clean |
| `--tc-agent-plan-edit-glow` | `light-dark(rgba(0, 96, 226, 0.1), rgba(77, 141, 255, 0.14))` | clean |

#### Design tokens it reads (82)

`--tc-accent-solid`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-3xl`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-agent-plan :steps="…">` | `<tc-agent-plan [steps]="…">` | `<tc-agent-plan {steps}>` |
| `runner` | `el.runner = …;` | `<… runner={…} />` | `<tc-agent-plan :runner="…">` | `<tc-agent-plan [runner]="…">` | `<tc-agent-plan {runner}>` |
| `retrier` | `el.retrier = …;` | `<… retrier={…} />` | `<tc-agent-plan :retrier="…">` | `<tc-agent-plan [retrier]="…">` | `<tc-agent-plan {retrier}>` |

*Also attributes: `status`, `heading`, `estimate`, `cancellable`, `retryable`, `rerunnable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-steps-change` | Yes | `el.addEventListener("tc-steps-change", (e) => …)` | `onChange={…}` | `@tc-steps-change="…"` | `(tc-steps-change)="…($event)"` | `el.addEventListener("tc-steps-change", …)` |
| `tc-run` | No | `el.addEventListener("tc-run", (e) => …)` | `ref.current.addEventListener("tc-run", …)` | `@tc-run="…"` | `(tc-run)="…($event)"` | `el.addEventListener("tc-run", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `ref.current.addEventListener("tc-retry", …)` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-cancel` | No | `el.addEventListener("tc-cancel", (e) => …)` | `onCancel={…}` | `@tc-cancel="…"` | `(tc-cancel)="…($event)"` | `el.addEventListener("tc-cancel", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `steps` itself unless a listener calls `preventDefault()` on `tc-steps-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-plan id="agent-plan"></tc-agent-plan>

<script type="module">
  import "@adamstavely/trenchcoat/agent-plan";

  const el = document.querySelector("#agent-plan");
  el.addEventListener("tc-steps-change", (e) => {
    e.preventDefault(); // the element keeps its steps…
    if (allowed(e.detail.steps)) el.steps = e.detail.steps; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentPlan } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentPlan>;
type Props = Omit<Own, "steps" | "onChange"> & { initial: NonNullable<Own["steps"]> };

// Controlled: passing steps makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentPlan({ initial, ...props }: Props) {
  const [steps, setSteps] = useState<Own["steps"]>(initial);
  return <AgentPlan {...props} steps={steps} onChange={(next) => setSteps(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-plan";
import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";

const props = defineProps<{ initial: TcAgentPlan["steps"] }>();
const steps = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStepsChange = (e: CustomEvent<{ steps: TcAgentPlan["steps"] }>) => {
  e.preventDefault();
  steps.value = e.detail.steps;
};
</script>

<template>
  <tc-agent-plan :steps="steps" @tc-steps-change="onStepsChange"></tc-agent-plan>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentPlan } from "@adamstavely/trenchcoat/angular/agent-plan";
import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";

@Component({
  selector: "app-controlled-agent-plan",
  imports: [AgentPlan],
  template: `<tc-agent-plan [steps]="steps()" (tc-steps-change)="onStepsChange($event)"></tc-agent-plan>`,
})
export class ControlledAgentPlan {
  readonly initial = input.required<TcAgentPlan["steps"]>();
  readonly steps = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStepsChange(e: CustomEvent<{ steps: TcAgentPlan["steps"] }>) {
    e.preventDefault();
    this.steps.set(e.detail.steps);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-plan";
  import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";

  let { initial }: { initial: TcAgentPlan["steps"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let steps = $derived(initial);
  let el: TcAgentPlan;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      steps = (e as CustomEvent<{ steps: TcAgentPlan["steps"] }>).detail.steps;
    };
    el.addEventListener("tc-steps-change", on);
    return () => el.removeEventListener("tc-steps-change", on);
  });
</script>

<tc-agent-plan bind:this={el} {steps}></tc-agent-plan>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-plan")` returns a `TcAgentPlan` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";`
- **React / Next.js:** Props: `import type { AgentPlanProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentPlan>`. The element class, for refs: `import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentPlan["steps"]` with `import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";`
- **Angular:** The directive types the template: `[steps]` takes `TcAgentPlan["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentPlan } from "@adamstavely/trenchcoat/agent-plan";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `steps` | `PlanStep[]` | The steps. Controlled when defined – pair with onChange; otherwise the component keeps them, starting from `defaultSteps`. Edits are reported to onChange either way |
| `defaultSteps` | `PlanStep[]` | Initial steps when uncontrolled |
| `onChange` | `(steps: PlanStep[]) => void` | Every edit during review: rename, remove, reorder, add |
| `onRun` | `(steps: PlanStep[]) => void \| Promise<unknown>` | "Run plan" pressed – gets the steps in their final order. May return a promise: the button waits while it runs, and if it rejects the plan stays in review and says so |
| `onCancel` | `() => void` | Shows a "Cancel" button next to "Run plan" |
| `onRetry` | `(stepId: string) => void \| Promise<unknown>` | Shows "Retry from here" on failed steps. May return a promise: the button waits, and says so if it rejects |
| `title` | `string` | The goal of the plan, shown as the heading |
| `estimate` | `string` | Estimated run time shown in review, e.g. "~2 min" |

*Renamed or hidden on the wrapper: `steps`, `heading`, `estimate`, `cancellable`, `retryable`, `rerunnable`, `runner`, `retrier`, `onChange`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each step in turn, its buttons, the Add step field and the footer |
| ↑ / ↓ | On a step in review, moves to the previous or next step; ↓ from the last goes to Add step |
| Alt ↑ / Alt ↓ | Moves the step up or down |
| Enter / F2 | Renames the step |
| Delete / Backspace | Removes the step |
| Enter | In the rename field, saves; in Add step, adds the step |
| Escape | In the rename field, cancels; in Add step, clears it |
| ↑ | In an empty Add step field, goes back to the last step |

### Screen readers

The steps are an ordered list named “Plan: Find out why customers churned”. In review, each step is focusable and
described by “Press Enter to rename, Alt plus arrow keys to move, Delete to remove.”; the buttons are named with the
step (“Move step 2 up: Pull churned accounts”, “Remove step 3: …”) and the rename field “Rename step 2”. Once running,
each step says its status (“, In progress”, “, Done”), the current one is `aria-current="step"`, and done steps read
“took 2.2s”. A polite live region confirms every edit (“Moved “Pull churned accounts” to position 1 of 5”, “Removed
…”, “Added … as step 6”) and the run: “Running plan”, “Step 2 done: …”, “Step 4 failed: … ”, “Plan done in 14s”.
After Run plan, focus moves to the run's status line.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

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
| **This component alone** | 61.9 KB | 13.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **70.9 KB** | **15.9 KB** |
| With Lit – the first component on a page | 92.8 KB | 23.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 169 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of steps replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | steps: first render, 2,829 nodes; update 1.6 ms |
| 1,000 items | 121 ms | steps: first render, 28,029 nodes; update 17 ms |

1,000 items of steps: 121 ms. It renders every item, so a first render passes 50 ms (a long task) at about 410 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setInterval, cleared`, `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Make the heading the goal, as the person would say it: “Find out why customers churned last quarter”.
- Write step titles as actions: “Pull churned accounts from Stripe”.
- Use `detail` for what the step looks at or produces, and `tool` for the tool's real name (`search_web`).
- Write `error` for a failed step as what went wrong and why: “search_web timed out after 30s”.
- Give an `estimate` people can plan around: “~2 min”.

## Do and don't

### Do

- Keep the plan short – five to eight steps – and merge steps people wouldn't tell apart.
- Return a promise from `runner` (or `onRun`) – the button waits, and a failure keeps the plan in review with a
  message.
- Set each step's `status` as the run moves; the timers and durations follow on their own.

### Don't

- Don't expect Run plan to switch the plan to running – set `status` yourself once the run has really started.
- Don't set `retryable` unless retrying from that step really works.
- Don't let the agent rewrite steps people edited without telling them.

## Related

- [Plan vs Actual](plan-vs-actual.md) – An agent's plan against what really happens – every step's bar grows over its dashed planned ghost, overruns turn amber, the steps after it slide right, and the expected finish moves away from the planned one
- [Run Checkpoints](run-checkpoints.md) – A run's restore points on a timeline – what each one captured, what going back discards, and “go back to step 4 and try again”, with earlier attempts kept as branches
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
