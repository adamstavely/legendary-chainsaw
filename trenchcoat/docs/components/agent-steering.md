<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Steering

**Agents**

Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away

- **Element:** `<tc-agent-steering>`
- **Size:** 12.9 KB gzip · 48.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-steering";` |
| React / Next.js | `import { AgentSteering } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-steering";` · tags starting with tc- are custom elements |
| Angular | `import { AgentSteering } from "@adamstavely/trenchcoat/angular/agent-steering";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-steering";` |

## Example

The live example is in the gallery at `#/agent-steering`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Steer an agent while it works, without stopping it. The card shows the run – what the agent is doing, which model,
a live clock – and its plan: the done steps, the active one with its own clock, and the steps still to come. Below
it, people type a note: Enter queues it for the next step, and when the agent takes it in, the note glides up into
the plan under the step that used it. When something can't wait, ⌘↵ (Ctrl+Enter) or “Now” on a queued note sends it
to the active step right away.

### When to use

- Long agent runs where people notice something mid-way – a constraint, a correction – and want it used without
  starting over.
- When it should be clear which step picked up which instruction.
- Alongside Pause and Resume, for runs people supervise.

### When not to use

- Reviewing and editing the plan before the run starts – use [Agent Plan](agent-plan.md).
- The agent stopping to hand the task to a person – use [Handoff](handoff.md).
- The agent asking for permission before an action – use [Approval Card](approval-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Plan** `.ui-st__plan` – the steps, done, active and to come; notes the agent took in sit under their step
3. **Active step** `.ui-st__step[data-status="active"]` – the step running now, with a spinner and its own clock
4. **Queue** `.ui-st__queue` – notes waiting for the next step, each with “Now” and ✕
5. **Field** `.ui-st__field` – “Steer the agent…” and the send button
6. **Hint** `.ui-st__hint` – the keys, or why a note didn't go through

## Looks

Standard puts the header on a soft gray tray above a white card with the plan, with the queue and the field on the tray below
it. Clean is one white card with the header as its first row: the queued notes and the field sit inside it, at the bottom. Both glide a taken-in note
from the queue into the plan the same way.

## Usage

### HTML

```html
<tc-agent-steering id="run" heading="Add email verification to users" agent="Opus 5.5" removable></tc-agent-steering>

<script type="module">
  import "@adamstavely/trenchcoat/agent-steering";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.startedAt = Date.now() - 41000;
  run.steps = [
    { id: "s1", title: "Read the users table schema", status: "done", duration: 38000 },
    { id: "s2", title: "Write the migration", status: "active", startedAt: Date.now() - 3000 },
    { id: "s3", title: "Run the test suite", status: "pending" },
  ];
  run.queue = [{ id: "n1", text: "Keep the old column until Friday" }];
  run.onQueue = (text) => (run.queue = [...run.queue, { id: crypto.randomUUID(), text }]);
  run.addEventListener("tc-remove", (e) => (run.queue = run.queue.filter((n) => n.id !== e.detail.id)));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentSteering, type SteerNote, type SteerStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SteerRun({ steps, startedAt }: { steps: SteerStep[]; startedAt: number }) {
  const [queue, setQueue] = useState<SteerNote[]>([]);
  return (
    <AgentSteering
      title="Add email verification to users"
      agent="Opus 5.5"
      startedAt={startedAt}
      steps={steps}
      queue={queue}
      onQueue={(text) => setQueue((q) => [...q, { id: crypto.randomUUID(), text }])}
      onRemove={(id) => setQueue((q) => q.filter((n) => n.id !== id))}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-steering";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";

defineProps<{ steps: TcAgentSteering["steps"]; queue: TcAgentSteering["queue"] }>();
const onDraftChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-steering :steps="steps" :queue="queue" @tc-draft-change="onDraftChange"></tc-agent-steering>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentSteering } from "@adamstavely/trenchcoat/angular/agent-steering";
import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";

@Component({
  selector: "app-agent-steering-example",
  imports: [AgentSteering],
  template: `<tc-agent-steering [steps]="steps()" [queue]="queue()" (tc-draft-change)="onDraftChange($event)"></tc-agent-steering>`,
})
export class AgentSteeringExample {
  readonly steps = input.required<TcAgentSteering["steps"]>();
  readonly queue = input.required<TcAgentSteering["queue"]>();
  onDraftChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-steering";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";

  let { steps, queue }: { steps: TcAgentSteering["steps"]; queue: TcAgentSteering["queue"] } = $props();
  let el: TcAgentSteering;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-draft-change", on);
    return () => el.removeEventListener("tc-draft-change", on);
  });
</script>

<tc-agent-steering bind:this={el} {steps} {queue}></tc-agent-steering>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | What the agent is working on, e.g. "Migrate users table" |
| `agent` | `agent` | `string` | `""` | Name of the agent or model, e.g. "Opus 5.5" |
| `steps` | – | `SteerStep[]` | `[]` | The plan: done steps, the active one and the steps still to come, in order |
| `queue` | – | `SteerNote[]` | `[]` | Notes waiting for the next step, oldest first |
| `status` | `status` | `SteerRunStatus` | `"running"` | Where the run is: "running", "paused" or "done" – done disables the field |
| `startedAt` | – | `number \| Date \| undefined` | `undefined` | When the run started (epoch ms or a Date) – the clock in the header ticks from here |
| `draft` | `draft` | `string` | `""` | The text in the field |
| `placeholder` | `placeholder` | `string` | `"Steer the agent…"` | Placeholder of the field while the run is open |
| `onQueue` | – | `SteerSend \| undefined` | `undefined` | ↵ in the field: queue this note for the next step. May return a promise (see SteerSend) |
| `onInterrupt` | – | `SteerSend \| undefined` | `undefined` | ⌘↵ in the field, or "Now" on a queued note (then with its id): apply it to the active step right away. Unset hides "Now" and the hint |
| `removable` | `removable` | `boolean` | `false` | Shows ✕ on the queued notes (tc-remove) |
| `pausable` | `pausable` | `boolean` | `false` | Shows Pause in the header while running (tc-pause) |
| `resumable` | `resumable` | `boolean` | `false` | Shows Resume in the header while paused (tc-resume) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-draft-change` | – | Yes | The text in the field changed; detail `{ draft: string }`. Cancelable: preventDefault() keeps `draft` as it is (controlled use) |
| `tc-remove` | – | No | ✕ on a queued note; detail `{ id: string }` |
| `tc-pause` | – | No | Pause was pressed; detail: null |
| `tc-resume` | – | No | Resume was pressed; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-steering-accent` | `light-dark(rgba(0, 96, 226, 0.765), #5b9aff)` | standard, clean |
| `--tc-agent-steering-rail` | `light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.16))` | clean |

#### Design tokens it reads (107)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-agent-steering :steps="…">` | `<tc-agent-steering [steps]="…">` | `<tc-agent-steering {steps}>` |
| `queue` | `el.queue = …;` | `<… queue={…} />` | `<tc-agent-steering :queue="…">` | `<tc-agent-steering [queue]="…">` | `<tc-agent-steering {queue}>` |
| `startedAt` | `el.startedAt = …;` | `<… startedAt={…} />` | `<tc-agent-steering :startedAt="…">` | `<tc-agent-steering [startedAt]="…">` | `<tc-agent-steering {startedAt}>` |
| `onQueue` | `el.onQueue = …;` | `<… onQueue={…} />` | `<tc-agent-steering :onQueue="…">` | `<tc-agent-steering [onQueue]="…">` | `<tc-agent-steering {onQueue}>` |
| `onInterrupt` | `el.onInterrupt = …;` | `<… onInterrupt={…} />` | `<tc-agent-steering :onInterrupt="…">` | `<tc-agent-steering [onInterrupt]="…">` | `<tc-agent-steering {onInterrupt}>` |

*Also attributes: `heading`, `agent`, `status`, `draft`, `placeholder`, `removable`, `pausable`, `resumable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-draft-change` | Yes | `el.addEventListener("tc-draft-change", (e) => …)` | `onDraftChange={…}` | `@tc-draft-change="…"` | `(tc-draft-change)="…($event)"` | `el.addEventListener("tc-draft-change", …)` |
| `tc-remove` | No | `el.addEventListener("tc-remove", (e) => …)` | `onRemove={…}` | `@tc-remove="…"` | `(tc-remove)="…($event)"` | `el.addEventListener("tc-remove", …)` |
| `tc-pause` | No | `el.addEventListener("tc-pause", (e) => …)` | `onPause={…}` | `@tc-pause="…"` | `(tc-pause)="…($event)"` | `el.addEventListener("tc-pause", …)` |
| `tc-resume` | No | `el.addEventListener("tc-resume", (e) => …)` | `onResume={…}` | `@tc-resume="…"` | `(tc-resume)="…($event)"` | `el.addEventListener("tc-resume", …)` |

### Controlled

The element changes `draft` itself unless a listener calls `preventDefault()` on `tc-draft-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-steering id="agent-steering"></tc-agent-steering>

<script type="module">
  import "@adamstavely/trenchcoat/agent-steering";

  const el = document.querySelector("#agent-steering");
  el.addEventListener("tc-draft-change", (e) => {
    e.preventDefault(); // the element keeps its draft…
    if (allowed(e.detail.draft)) el.draft = e.detail.draft; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentSteering } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentSteering>;
type Props = Omit<Own, "draft" | "onDraftChange"> & { initial: NonNullable<Own["draft"]> };

// Controlled: passing draft makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentSteering({ initial, ...props }: Props) {
  const [draft, setDraft] = useState<Own["draft"]>(initial);
  return <AgentSteering {...props} draft={draft} onDraftChange={(next) => setDraft(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-steering";
import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";

const props = defineProps<{ initial: TcAgentSteering["draft"] }>();
const draft = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDraftChange = (e: CustomEvent<{ draft: TcAgentSteering["draft"] }>) => {
  e.preventDefault();
  draft.value = e.detail.draft;
};
</script>

<template>
  <tc-agent-steering :draft="draft" @tc-draft-change="onDraftChange"></tc-agent-steering>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentSteering } from "@adamstavely/trenchcoat/angular/agent-steering";
import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";

@Component({
  selector: "app-controlled-agent-steering",
  imports: [AgentSteering],
  template: `<tc-agent-steering [draft]="draft()" (tc-draft-change)="onDraftChange($event)"></tc-agent-steering>`,
})
export class ControlledAgentSteering {
  readonly initial = input.required<TcAgentSteering["draft"]>();
  readonly draft = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDraftChange(e: CustomEvent<{ draft: TcAgentSteering["draft"] }>) {
    e.preventDefault();
    this.draft.set(e.detail.draft);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-steering";
  import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";

  let { initial }: { initial: TcAgentSteering["draft"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let draft = $derived(initial);
  let el: TcAgentSteering;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      draft = (e as CustomEvent<{ draft: TcAgentSteering["draft"] }>).detail.draft;
    };
    el.addEventListener("tc-draft-change", on);
    return () => el.removeEventListener("tc-draft-change", on);
  });
</script>

<tc-agent-steering bind:this={el} {draft}></tc-agent-steering>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-steering")` returns a `TcAgentSteering` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";`
- **React / Next.js:** Props: `import type { AgentSteeringProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentSteering>`. The element class, for refs: `import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentSteering["steps"]` with `import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";`
- **Angular:** The directive types the template: `[steps]` takes `TcAgentSteering["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentSteering } from "@adamstavely/trenchcoat/agent-steering";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | What the agent is working on, e.g. "Migrate users table" |
| `onInterrupt` | `(text: string, queuedId?: string) => void \| Promise<unknown>` | ⌘↵ in the field, or "Now" on a queued note (then with its id): apply it to the active step right away. May return a promise, like onQueue |
| `draft` | `string` | The text in the field. Controlled when defined – pair with onDraftChange; otherwise the component keeps it, starting from `defaultDraft` |
| `defaultDraft` | `string` | The text in the field at first when uncontrolled |
| `onDraftChange` | `(text: string) => void` | Called with the field's new text as it changes |
| `onRemove` | `(id: string) => void` | ✕ on a queued note |
| `onPause` | `() => void` | Called by Pause in the header while the run is running; passing it shows the button |
| `onResume` | `() => void` | Called by Resume in the header while the run is paused; passing it shows the button |

*Renamed or hidden on the wrapper: `heading`, `draft`, `removable`, `pausable`, `resumable`, `onInterrupt`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter | In the field: queues the note for the next step |
| ⌘ Enter / Ctrl Enter | In the field: sends the note to the active step right away (with `onInterrupt` set) |
| Shift Enter | In the field: a new line |
| Escape | In the field: clears what was typed |
| Tab | Moves between Pause / Resume, “Now” and ✕ on each queued note, the field and the send button |

When a queued note goes – applied with “Now” or removed with ✕ – focus moves to the same button on the next note,
then the one before, then the field, instead of the page.

### Screen readers

The plan is a list named “Plan”; each step starts with “Done:”, “In progress:” or “To do:”, and the active one is
`aria-current="step"`. The field is named “Steer the agent” and described by the hint below it. A status region
says what happened to each note: “Queued for the next step: …”, “Interrupting: …”, “Opus 5.5 picked up: …” and
“Couldn't send: …”; a failed send is also an alert, “Couldn't send – try again”. The buttons say what they act on:
“Apply now: “Keep the old column””, “Remove “Keep the old column””, “Pause the run”, “Queue for the next step”.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
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
| **This component alone** | 39.6 KB | 10.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **48.6 KB** | **12.9 KB** |
| With Lit – the first component on a page | 69.2 KB | 19.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 91 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of steps replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.3 ms | steps: first render, 927 nodes; update 0.8 ms |
| 1,000 items | 48 ms | steps: first render, 8,847 nodes; update 15 ms |

1,000 items of steps: 48 ms, 8,847 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **9 timer callbacks/s** on screen, **nothing** scrolled away, **9 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `window resize`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write step titles as what the agent does, in the imperative: “Backfill 1.2M rows in batches of 10k”.
- Give `agent` the name people know – it's said when the agent picks up a note.
- Keep the placeholder an invitation to steer: “Steer the agent…”, “Add an instruction…”.
- Leave `onInterrupt` out when your agent can't take a note mid-step – “Now” and the ⌘↵ hint go with it.

## Do and don't

### Do

- Move a note from `queue` to the step's `notes` (with `picked: "next"`, or `"now"` when interrupting) when the agent
  takes it in – that's what makes it glide.
- Return a promise from `onQueue` / `onInterrupt` and reject it when sending fails; the text comes back to the field.
- Pass `startedAt` on the run and on the active step so the clocks are right from the start.

### Don't

- Don't drop queued notes silently when the run ends – the field says “Notes still in the queue were not used”, so
  leave them in `queue`.
- Don't use it for a run people can't influence; show its progress with `agent-plan` instead.

## Related

- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
