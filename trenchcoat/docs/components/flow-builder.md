<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Flow Builder

**AI configuration** · New

An automation built in place as a top-down flow – a + on every line opens a short step menu, If / else forks into named paths that join below, steps renamed, moved and removed with Undo and Redo, and a test run that sends a light down the line into the working step

- **Element:** `<tc-flow-builder>`
- **Size:** 20.9 KB gzip · 79.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/flow-builder";` |
| React / Next.js | `import { FlowBuilder } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/flow-builder";` · tags starting with tc- are custom elements |
| Angular | `import { FlowBuilder } from "@adamstavely/trenchcoat/angular/flow-builder";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/flow-builder";` |

## Example

The live example is in the gallery at `#/flow-builder`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An automation drawn as a top-down flow you build in place. The trigger sits at the top and the steps run down a column
joined by lines. A + on every line opens a short menu of steps to insert there – AI step, Send message, Wait, If / else
and Approval by default, or your own. If / else forks into named paths side by side that join again below, each path a
column of its own with its own + buttons. Steps are renamed in place, moved up and down within their path and removed,
and Undo and Redo walk the edits back and forth. Test run asks the page to run the flow; while it does, a light runs down
the line into the step that's working, and each step shows its status in a mark and a word.

### When to use

- Automation and agent products where people put together what happens after a trigger – onboarding, routing,
  follow-ups.
- A flow that branches on a condition, built and tested in place, in a settings page, a side panel or a dialog.

### When not to use

- A free-form graph where any step connects to any other – use [Workflow Canvas](workflow-canvas.md).
- Reviewing an agent's own plan before it runs – use [Agent Plan](agent-plan.md).
- Choosing from a large catalogue of steps and tools – pair a + with [Step Picker](step-picker.md), or pass your own `options`.
- Setting when an automation starts – use [Trigger Builder](trigger-builder.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trigger** `.ui-flb__step[data-trigger]` – what starts the flow, at the top
2. **Step** `.ui-flb__step` – its kind's icon, the kind, the title (click to rename), a detail line and, in a run, its
3. **Line** `.ui-flb__link` – joins two steps; lit while the step below it is running
4. **Add** `.ui-flb__add` – the + on a line, opening the menu
5. **Menu** `.ui-flb__menu` – the steps that can go in there
6. **Paths** `.ui-flb__branches` – an If / else's paths, side by side
7. **Path name** `.ui-flb__path` – click to rename
8. **Step actions** `.ui-flb__actions` – move up, move down and remove, shown on hover
9. **Undo, Redo and Test run** `.ui-flb__tools`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. Each kind's icon has its own colour – `--tc-flb-trigger`, `--tc-flb-llm`, `--tc-flb-tool`,
`--tc-flb-condition`, `--tc-flb-approval`, `--tc-flb-output` and `--tc-flb-wait` – and `--tc-flb-step-w`,
`--tc-flb-link-h` and `--tc-flb-line` size the cards and the lines. Narrower than 520 px, an If / else's paths stack.

## Usage

### HTML

```html
<tc-flow-builder id="flow" heading="Correction requests"></tc-flow-builder>

<script type="module">
  import "@adamstavely/trenchcoat/flow-builder";
  import "@adamstavely/trenchcoat/tokens.css";

  const flow = document.querySelector("#flow");
  flow.trigger = { title: "Correction form submitted" };
  flow.flow = [
    { id: "classify", kind: "llm", title: "Sort the request" },
    {
      id: "factual",
      kind: "condition",
      title: "Is it a factual error?",
      branches: [
        { id: "yes", label: "Factual error", steps: [{ id: "draft", kind: "llm", title: "Draft a correction" }] },
        { id: "no", label: "Anything else", steps: [{ id: "reply", kind: "output", title: "Send the standard reply" }] },
      ],
    },
    { id: "log", kind: "output", title: "Log it in the corrections sheet" },
  ];
  flow.statuses = { classify: "done", factual: "done", draft: "running" };
  flow.addEventListener("tc-flow-change", (e) => console.log(e.detail.change, e.detail.flow));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FlowBuilder, type FlowStep, type FlowStepStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Corrections() {
  const [flow, setFlow] = useState<FlowStep[]>([{ id: "classify", kind: "llm", title: "Sort the request" }]);
  const [statuses, setStatuses] = useState<Record<string, FlowStepStatus>>({});
  return (
    <FlowBuilder
      title="Correction requests"
      trigger={{ title: "Correction form submitted" }}
      flow={flow}
      onFlowChange={setFlow}
      statuses={statuses}
      onTestRun={() => setStatuses({ classify: "running" })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/flow-builder";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";

defineProps<{ trigger: TcFlowBuilder["trigger"]; flow: TcFlowBuilder["flow"] }>();
const onFlowChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-flow-builder :trigger="trigger" :flow="flow" @tc-flow-change="onFlowChange"></tc-flow-builder>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FlowBuilder } from "@adamstavely/trenchcoat/angular/flow-builder";
import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";

@Component({
  selector: "app-flow-builder-example",
  imports: [FlowBuilder],
  template: `<tc-flow-builder [trigger]="trigger()" [flow]="flow()" (tc-flow-change)="onFlowChange($event)"></tc-flow-builder>`,
})
export class FlowBuilderExample {
  readonly trigger = input.required<TcFlowBuilder["trigger"]>();
  readonly flow = input.required<TcFlowBuilder["flow"]>();
  onFlowChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/flow-builder";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";

  let { trigger, flow }: { trigger: TcFlowBuilder["trigger"]; flow: TcFlowBuilder["flow"] } = $props();
  let el: TcFlowBuilder;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-flow-change", on);
    return () => el.removeEventListener("tc-flow-change", on);
  });
</script>

<tc-flow-builder bind:this={el} {trigger} {flow}></tc-flow-builder>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Flow"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `trigger` | – | `FlowTrigger` | `{ title: "When this happens" }` | What starts the flow, shown at the top |
| `flow` | – | `FlowStep[]` | `[]` | The steps, in order, with If / else paths inside. Changed by the user unless a tc-flow-change listener calls preventDefault() |
| `options` | – | `FlowStepOption[]` | `[ { id: "ai", kind: "llm", label: "AI step", description: "Asks a model to write, sort or pull out" }, { id: "message", kind: "output", label: "Send message", description: "Emails or posts to people you choose" }, { id: "wait", kind: "wait", label: "Wait", description: "Pauses for a time or until something happens" }, { id: "if-else", kind: "condition", label: "If / else", description: "Splits into two paths by a rule", branches: ["If", "Else"] }, { id: "approval", kind: "approval", label: "Approval", description: "Waits for a person to approve" }, ]` | The steps the + menu offers |
| `kinds` | – | `Record<string, Partial<WorkflowKindInfo>>` | `{}` | Labels and icons for kinds, merged over the defaults |
| `statuses` | – | `Record<string, FlowStepStatus>` | `{}` | Each step's state in a test run, by step id – a light runs into the one that's "running" |
| `statusLabels` | – | `Partial<Record<FlowStepStatus, string>>` | `{}` | The status words, merged over the defaults |
| `readonly` | `readonly` | `boolean` | `false` | Leaves out the editing controls: no +, renaming, moving or removing |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-flow-change` | – | Yes | A step was added, removed, moved or renamed, or an edit undone or redone ({ flow, change, id }: FlowChange); cancelable – prevented, `flow` stays as it was |
| `tc-test-run` | – | No | Test run was pressed; the page runs the flow and sets `statuses` as it goes ({ flow }: FlowTestRun) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `addStep(option: FlowStepOption, at: FlowPlace)` | `void` | Inserts a step from an option at the + with key `at` |
| `undo()` | `void` | – |
| `redo()` | `void` | – |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-flb-trigger` | `var(--tc-tone-amber-solid)` | both |
| `--tc-flb-llm` | `var(--tc-tone-violet-solid)` | both |
| `--tc-flb-tool` | `var(--tc-chart-1)` | both |
| `--tc-flb-condition` | `var(--tc-tone-teal-solid)` | both |
| `--tc-flb-approval` | `var(--tc-tone-pink-solid)` | both |
| `--tc-flb-output` | `var(--tc-status-success-solid)` | both |
| `--tc-flb-wait` | `var(--tc-chart-2)` | both |
| `--tc-flb-line` | `1.5px` | both |
| `--tc-flb-step-w` | `260px` | both |
| `--tc-flb-link-h` | `36px` | both |
| `--tc-flb-add` | `22px` | both |
| `--tc-flb-bg` | `var(--tc-surface-raised)` | standard, clean |
| `--tc-flb-kind` | `var(--tc-icon-muted)` | not set – this fallback applies |

#### Design tokens it reads (88)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-solid`, `--tc-tone-pink-solid`, `--tc-tone-teal-solid`, `--tc-tone-violet-solid`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultFlowOptions: FlowStepOption[]` | The + menu's steps – replace with your own |
| `flowPlaceOf(flow: FlowStep[], id: string, list: unknown): { list: string; index: number; steps: FlowStep[] } \| null` | Where a step is: its path's id, its index and the path's steps; null when it isn't in the flow |
| `flowStep(flow: FlowStep[], id: string): FlowStep \| null` | A step, or null |
| `flowCount(flow: FlowStep[]): number` | How many steps, counting every path's |
| `flowMove(flow: FlowStep[], id: string, by: -1 \| 1): void` | Moves a step up (-1) or down (+1) within its own path; the same array at the ends |
| `flowRename(flow: FlowStep[], id: string, title: string): FlowStep[]` | Renames a step or a branch |

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
| `trigger` | `el.trigger = …;` | `<… trigger={…} />` | `<tc-flow-builder :trigger="…">` | `<tc-flow-builder [trigger]="…">` | `<tc-flow-builder {trigger}>` |
| `flow` | `el.flow = …;` | `<… flow={…} />` | `<tc-flow-builder :flow="…">` | `<tc-flow-builder [flow]="…">` | `<tc-flow-builder {flow}>` |
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-flow-builder :options="…">` | `<tc-flow-builder [options]="…">` | `<tc-flow-builder {options}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-flow-builder :kinds="…">` | `<tc-flow-builder [kinds]="…">` | `<tc-flow-builder {kinds}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-flow-builder :statuses="…">` | `<tc-flow-builder [statuses]="…">` | `<tc-flow-builder {statuses}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-flow-builder :statusLabels="…">` | `<tc-flow-builder [statusLabels]="…">` | `<tc-flow-builder {statusLabels}>` |

*Also attributes: `heading`, `description`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-flow-change` | Yes | `el.addEventListener("tc-flow-change", (e) => …)` | `ref.current.addEventListener("tc-flow-change", …)` | `@tc-flow-change="…"` | `(tc-flow-change)="…($event)"` | `el.addEventListener("tc-flow-change", …)` |
| `tc-test-run` | No | `el.addEventListener("tc-test-run", (e) => …)` | `onTestRun={…}` | `@tc-test-run="…"` | `(tc-test-run)="…($event)"` | `el.addEventListener("tc-test-run", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `flow` itself unless a listener calls `preventDefault()` on `tc-flow-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-flow-builder id="flow-builder"></tc-flow-builder>

<script type="module">
  import "@adamstavely/trenchcoat/flow-builder";

  const el = document.querySelector("#flow-builder");
  el.addEventListener("tc-flow-change", (e) => {
    e.preventDefault(); // the element keeps its flow…
    if (allowed(e.detail.flow)) el.flow = e.detail.flow; // …until the app sets it
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
import "@adamstavely/trenchcoat/flow-builder";
import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";

const props = defineProps<{ initial: TcFlowBuilder["flow"] }>();
const flow = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFlowChange = (e: CustomEvent<{ flow: TcFlowBuilder["flow"] }>) => {
  e.preventDefault();
  flow.value = e.detail.flow;
};
</script>

<template>
  <tc-flow-builder :flow="flow" @tc-flow-change="onFlowChange"></tc-flow-builder>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FlowBuilder } from "@adamstavely/trenchcoat/angular/flow-builder";
import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";

@Component({
  selector: "app-controlled-flow-builder",
  imports: [FlowBuilder],
  template: `<tc-flow-builder [flow]="flow()" (tc-flow-change)="onFlowChange($event)"></tc-flow-builder>`,
})
export class ControlledFlowBuilder {
  readonly initial = input.required<TcFlowBuilder["flow"]>();
  readonly flow = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFlowChange(e: CustomEvent<{ flow: TcFlowBuilder["flow"] }>) {
    e.preventDefault();
    this.flow.set(e.detail.flow);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/flow-builder";
  import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";

  let { initial }: { initial: TcFlowBuilder["flow"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let flow = $derived(initial);
  let el: TcFlowBuilder;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      flow = (e as CustomEvent<{ flow: TcFlowBuilder["flow"] }>).detail.flow;
    };
    el.addEventListener("tc-flow-change", on);
    return () => el.removeEventListener("tc-flow-change", on);
  });
</script>

<tc-flow-builder bind:this={el} {flow}></tc-flow-builder>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-flow-builder")` returns a `TcFlowBuilder` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";`
- **React / Next.js:** Props: `import type { FlowBuilderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FlowBuilder>`. The element class, for refs: `import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFlowBuilder["trigger"]` with `import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";`
- **Angular:** The directive types the template: `[trigger]` takes `TcFlowBuilder["trigger"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFlowBuilder } from "@adamstavely/trenchcoat/flow-builder";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `flow` | `FlowStep[]` | The steps – controlled when given |
| `defaultFlow` | `FlowStep[]` | The steps on mount when `flow` isn't controlled |
| `onFlowChange` | `(flow: FlowStep[], change: FlowChange["change"], id: string) => void` | A step was added, removed, moved or renamed, or an edit undone or redone |
| `onTestRun` | `(flow: FlowStep[]) => void` | Test run was pressed: run the flow and pass `statuses` as it goes |

*Renamed or hidden on the wrapper: `heading`, `flow`, `children`*

## Accessibility

### Keyboard

The steps, the path names and the + buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves between steps, path names and + buttons, in reading order |
| Home / End | Goes to the first or the last |
| Enter / Space on a + | Opens the menu; ↑ / ↓ move in it, Enter adds the step, Escape closes it |
| Enter or F2 on a step or path name | Renames it; Enter keeps the new name, Escape leaves it as it was |
| Alt + ↑ / ↓ on a step | Moves it up or down within its path |
| Delete / Backspace on a step | Removes it, with the steps in its paths |
| ⌘Z / Ctrl+Z | Undoes the last edit |
| ⇧⌘Z / Ctrl+Y | Redoes it |

### Screen readers

The flow is a group named by the heading. Each step is a button named by its kind, title and, in a run, its status
(“AI step: Draft a correction, Running”), with a description of its keys. Each + is named by where it adds (“Add a step
after Sort the request”) and opens a `menu` of `menuitem`s. An If / else's paths are a group, and each path's name is
a button (“Path: Factual error”). Adding, removing, moving, renaming, undoing and redoing are confirmed in a polite
status message.

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself, workflow-canvas | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, workflow-canvas | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | workflow-canvas | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, workflow-canvas | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, workflow-canvas, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | workflow-canvas | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, workflow-canvas, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.6 KB | 9.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [workflow-canvas](workflow-canvas.md) · Element it renders | 39.0 KB | – |
| **Added to a page that already has Lit** | **79.2 KB** | **20.9 KB** |
| With Lit – the first component on a page | 101.3 KB | 28.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.9 ms** | the gallery demo's data, 257 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of options replaced |
| First on the page | 26 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.2 ms | options: first render, 257 nodes; update 0.3 ms |
| 1,000 items | 3.7 ms | options: first render, 257 nodes; update 0.4 ms |

What it renders doesn't grow with options (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 4 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (workflow-canvas).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name steps for what they do: “Draft a correction”, not “LLM call 2”.
- Name an If / else for its question (“Is it a factual error?”) and its paths for their answers.
- Pass `statuses` by step id while a test run goes, and clear them when it's done.

## Do and don't

### Do

- Keep the + menu short; offer a fuller `step-picker` from your own menu item when there are many steps.
- Let people undo; it makes removing a step safe.

### Don't

- Don't nest more than two If / elses deep – the paths get too narrow to read.
- Don't run the real automation from Test run without saying so; test with sample data.

## Related

- [Workflow Canvas](workflow-canvas.md) – An agent workflow as a node graph – step cards with their kind, status in a mark and a word, and curved labelled connectors; pan and zoom, drag steps and connect them from their ports or the keyboard (M moves, C connects, A adds), a flowing connector into the running step, and the same graph as a list
- [Step Picker](step-picker.md) – What to add next to a workflow – a search over step kinds and tools grouped as Triggers, AI, Tools, Logic, People and Output, led by suggested steps with why and recent ones, inline or as a popover by the button that opened it
- [Playbook Canvas](playbook-canvas.md) – An agent workflow, phase by phase – triggers, intake, context, analysis and review as steps you add and order, with review gates, versions and a dry run
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
