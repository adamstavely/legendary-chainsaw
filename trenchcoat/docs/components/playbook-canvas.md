<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Playbook Canvas

**Trust & calibration** · New

An agent workflow, phase by phase – triggers, intake, context, analysis and review as steps you add and order, with review gates, versions and a dry run

- **Element:** `<tc-playbook-canvas>`
- **Size:** 27.5 KB gzip · 111.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/playbook-canvas";` |
| React / Next.js | `import { PlaybookCanvas } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/playbook-canvas";` · tags starting with tc- are custom elements |
| Angular | `import { PlaybookCanvas } from "@adamstavely/trenchcoat/angular/playbook-canvas";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/playbook-canvas";` |

## Example

The live example is in the gallery at `#/playbook-canvas`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Edits an agent's workflow, phase by phase: what starts a run, what comes in, what the agent looks up, what it works
out and who signs off before anything leaves. People add steps to a phase, reorder them by dragging or from the
keyboard, and set each one up below the board – its title, its type, instructions for the agent and what happens if it
fails. A review step pauses the run for a person and carries its own gate. Saved versions are listed with the current
one marked, and a dry run shows which steps would run, which are skipped and where a gate pauses – before anything
runs for real. It is an editor of phases and steps, not a free-form canvas.

### When to use

- Building or changing the steps an agent runs for a recurring job – refunds, triage, report drafting.
- Putting human review where the team can see and change it, inside the workflow it guards.
- Letting people check a change with a dry run before they save it as a new version.

### When not to use

- Setting up one review gate on its own – use [Gate Config](gate-config.md).
- Going back to a point in a run that already happened – use [Run Checkpoints](run-checkpoints.md).
- Handing tasks to agents – use [Delegate Board](delegate-board.md).
- Setting only when an automation starts – use [Trigger Builder](trigger-builder.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a workflow icon, the name, the version and Edited, the step and gate counts, Versions and Dry run
2. **Phase** `.ui-pb__phase` – a column (or a row, when narrow) with its number, name, line and Add step
3. **Step** `.ui-pb__step` – one step: its grip, type icon, title, type and the dry run's mark
4. **Dry run** `.ui-pb__dry` – the result in one line, or that it's out of date
5. **Settings** `.ui-pb__panel` – the picked step's title, type, instructions and what happens if it fails
6. **Hints** `.ui-pb__hints` – the keys for moving and reordering steps

## Looks

Standard is a white card on a gray tray: each phase sits on a gray well with white step cards, and the keyboard hints
sit in the tray under the card. Clean is one white card: the phases are outlined with a hairline, the step cards are
lighter, and the hints are the card's last row. From about 860 px the phases sit side by side with an arrow from each
to the next; narrower, they stack, joined by a rail. Below 480 px the labels sit above their fields and the hints go.

## Usage

### HTML

```html
<tc-playbook-canvas id="playbook" heading="Refund requests" current-version="v7"></tc-playbook-canvas>

<script type="module">
  import "@adamstavely/trenchcoat/playbook-canvas";
  import "@adamstavely/trenchcoat/tokens.css";

  const playbook = document.querySelector("#playbook");
  playbook.value = {
    steps: [
      { id: "arrives", phase: "trigger", type: "event", title: "A refund request arrives" },
      { id: "decide", phase: "analysis", type: "agent", title: "Decide: full, partial or no refund" },
      { id: "gate", phase: "review", type: "review", title: "Team lead signs off" },
    ],
  };
  playbook.versions = [{ id: "v7", label: "v7", note: "Look up the policy first", meta: "Oct 24 · Maya Chen" }];
  playbook.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
  playbook.addEventListener("tc-dry-run", async (e) => {
    playbook.dryRun = await fetch("/playbooks/dry-run", { method: "POST", body: JSON.stringify(e.detail.value) }).then((r) => r.json());
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PlaybookCanvas, type Playbook, type PlaybookDryRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RefundPlaybook({ initial, dryRunOn }: { initial: Playbook; dryRunOn: (p: Playbook) => Promise<PlaybookDryRun> }) {
  const [value, setValue] = useState<Playbook>(initial);
  const [dryRun, setDryRun] = useState<PlaybookDryRun | null>(null);
  return (
    <PlaybookCanvas
      title="Refund requests"
      value={value}
      onChange={setValue}
      dryRun={dryRun}
      onDryRun={(p) => dryRunOn(p).then(setDryRun)}
      onDryRunClear={() => setDryRun(null)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/playbook-canvas";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";

defineProps<{ value: TcPlaybookCanvas["value"]; phases: TcPlaybookCanvas["phases"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-playbook-canvas :value="value" :phases="phases" @tc-value-change="onValueChange"></tc-playbook-canvas>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PlaybookCanvas } from "@adamstavely/trenchcoat/angular/playbook-canvas";
import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";

@Component({
  selector: "app-playbook-canvas-example",
  imports: [PlaybookCanvas],
  template: `<tc-playbook-canvas [value]="value()" [phases]="phases()" (tc-value-change)="onValueChange($event)"></tc-playbook-canvas>`,
})
export class PlaybookCanvasExample {
  readonly value = input.required<TcPlaybookCanvas["value"]>();
  readonly phases = input.required<TcPlaybookCanvas["phases"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/playbook-canvas";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";

  let { value, phases }: { value: TcPlaybookCanvas["value"]; phases: TcPlaybookCanvas["phases"] } = $props();
  let el: TcPlaybookCanvas;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-playbook-canvas bind:this={el} {value} {phases}></tc-playbook-canvas>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `Playbook` | `{ steps: [] }` | The playbook: its steps, in order within each phase. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `phases` | – | `PlaybookPhase[]` | `[ { id: "trigger", label: "Trigger", description: "What starts a run", defaultType: "event" }, { id: "intake", label: "Intake", description: "What comes in, and how it's checked", defaultType: "tool" }, { id: "context", label: "Context", description: "What the agent looks up first", defaultType: "retrieve" }, { id: "analysis", label: "Analysis", description: "What the agent works out", defaultType: "agent" }, { id: "review", label: "Review", description: "Who signs off before anything leaves", defaultType: "review" }, ]` | The phases, in order – the board's columns |
| `stepTypes` | – | `PlaybookStepType[]` | `[ { id: "event", label: "When an event happens", phases: ["trigger"] }, { id: "schedule", label: "On a schedule", phases: ["trigger"] }, { id: "manual", label: "Started by hand", phases: ["trigger"] }, { id: "agent", label: "Agent task" }, { id: "tool", label: "Tool call" }, { id: "retrieve", label: "Look up sources" }, { id: "review", label: "Human review", review: true }, ]` | The kinds of step people can add |
| `selected` | `selected` | `string \| null` | `null` | The id of the step being set up. Picks apply unless a tc-selected-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Playbook"` | Names the playbook, shown at the top |
| `versions` | – | `PlaybookVersion[]` | `[]` | The saved versions, newest first |
| `currentVersion` | `current-version` | `string` | `""` | The id of the version the board shows |
| `dryRun` | – | `PlaybookDryRun \| null` | `null` | The app's answer to the last tc-dry-run: which steps run, are skipped or pause; null clears it |
| `gateConditions` | – | `GateCondition[] \| undefined` | `undefined` | Conditions offered by review steps' gates; unset: the gate's defaults |
| `gateReviewers` | – | `GateReviewer[] \| undefined` | `undefined` | Reviewers offered by review steps' gates; unset: the gate's defaults |
| `gateViews` | – | `GateView[] \| undefined` | `undefined` | What a reviewer can see, offered by review steps' gates; unset: the gate's defaults |
| `gateActions` | – | `GateActionOption[] \| undefined` | `undefined` | Actions offered by review steps' gates; unset: the gate's defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The playbook changed: a step added, removed, moved or edited ({ value: Playbook }); cancelable – prevent it to control `value` |
| `tc-selected-change` | – | Yes | A step was picked, or the pick cleared ({ selected: string \| null, step?: PlaybookStep }); cancelable |
| `tc-dry-run` | – | No | "Dry run" was pressed ({ value: Playbook }) – answer by setting `dryRun` |
| `tc-dry-run-clear` | – | No | The dry run's result was cleared ({}) |
| `tc-version-open` | – | No | "Open" was pressed on a version that isn't current ({ id: string }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-playbook-canvas-rail` | `var(--tc-border-default)` | both |

#### Design tokens it reads (105)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-playbook-canvas-phases`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-playbook-canvas :value="…">` | `<tc-playbook-canvas [value]="…">` | `<tc-playbook-canvas {value}>` |
| `phases` | `el.phases = …;` | `<… phases={…} />` | `<tc-playbook-canvas :phases="…">` | `<tc-playbook-canvas [phases]="…">` | `<tc-playbook-canvas {phases}>` |
| `stepTypes` | `el.stepTypes = …;` | `<… stepTypes={…} />` | `<tc-playbook-canvas :stepTypes="…">` | `<tc-playbook-canvas [stepTypes]="…">` | `<tc-playbook-canvas {stepTypes}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-playbook-canvas :versions="…">` | `<tc-playbook-canvas [versions]="…">` | `<tc-playbook-canvas {versions}>` |
| `dryRun` | `el.dryRun = …;` | `<… dryRun={…} />` | `<tc-playbook-canvas :dryRun="…">` | `<tc-playbook-canvas [dryRun]="…">` | `<tc-playbook-canvas {dryRun}>` |
| `gateConditions` | `el.gateConditions = …;` | `<… gateConditions={…} />` | `<tc-playbook-canvas :gateConditions="…">` | `<tc-playbook-canvas [gateConditions]="…">` | `<tc-playbook-canvas {gateConditions}>` |
| `gateReviewers` | `el.gateReviewers = …;` | `<… gateReviewers={…} />` | `<tc-playbook-canvas :gateReviewers="…">` | `<tc-playbook-canvas [gateReviewers]="…">` | `<tc-playbook-canvas {gateReviewers}>` |
| `gateViews` | `el.gateViews = …;` | `<… gateViews={…} />` | `<tc-playbook-canvas :gateViews="…">` | `<tc-playbook-canvas [gateViews]="…">` | `<tc-playbook-canvas {gateViews}>` |
| `gateActions` | `el.gateActions = …;` | `<… gateActions={…} />` | `<tc-playbook-canvas :gateActions="…">` | `<tc-playbook-canvas [gateActions]="…">` | `<tc-playbook-canvas {gateActions}>` |

*Also attributes: `selected`, `heading`, `current-version` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-dry-run` | No | `el.addEventListener("tc-dry-run", (e) => …)` | `onDryRun={…}` | `@tc-dry-run="…"` | `(tc-dry-run)="…($event)"` | `el.addEventListener("tc-dry-run", …)` |
| `tc-dry-run-clear` | No | `el.addEventListener("tc-dry-run-clear", (e) => …)` | `onDryRunClear={…}` | `@tc-dry-run-clear="…"` | `(tc-dry-run-clear)="…($event)"` | `el.addEventListener("tc-dry-run-clear", …)` |
| `tc-version-open` | No | `el.addEventListener("tc-version-open", (e) => …)` | `onVersionOpen={…}` | `@tc-version-open="…"` | `(tc-version-open)="…($event)"` | `el.addEventListener("tc-version-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `selected` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-playbook-canvas id="playbook-canvas"></tc-playbook-canvas>

<script type="module">
  import "@adamstavely/trenchcoat/playbook-canvas";

  const el = document.querySelector("#playbook-canvas");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { PlaybookCanvas } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PlaybookCanvas>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledPlaybookCanvas({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <PlaybookCanvas {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/playbook-canvas";
import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";

const props = defineProps<{ initial: TcPlaybookCanvas["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcPlaybookCanvas["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-playbook-canvas :value="value" @tc-value-change="onValueChange"></tc-playbook-canvas>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PlaybookCanvas } from "@adamstavely/trenchcoat/angular/playbook-canvas";
import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";

@Component({
  selector: "app-controlled-playbook-canvas",
  imports: [PlaybookCanvas],
  template: `<tc-playbook-canvas [value]="value()" (tc-value-change)="onValueChange($event)"></tc-playbook-canvas>`,
})
export class ControlledPlaybookCanvas {
  readonly initial = input.required<TcPlaybookCanvas["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcPlaybookCanvas["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/playbook-canvas";
  import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";

  let { initial }: { initial: TcPlaybookCanvas["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcPlaybookCanvas;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcPlaybookCanvas["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-playbook-canvas bind:this={el} {value}></tc-playbook-canvas>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-playbook-canvas :value="value" @tc-value-change="value = $event.detail.value"></tc-playbook-canvas>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-playbook-canvas [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-playbook-canvas>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-playbook-canvas bind:this={el} {value}></tc-playbook-canvas>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-playbook-canvas")` returns a `TcPlaybookCanvas` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";`
- **React / Next.js:** Props: `import type { PlaybookCanvasProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PlaybookCanvas>`. The element class, for refs: `import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPlaybookCanvas["value"]` with `import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";`
- **Angular:** The directive types the template: `[value]` takes `TcPlaybookCanvas["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPlaybookCanvas } from "@adamstavely/trenchcoat/playbook-canvas";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the playbook |
| `stepTypes` | `PlaybookStepTypeNode[]` | The kinds of step people can add; icons may be React nodes |
| `value` | `Playbook` | The playbook (controlled) |
| `defaultValue` | `Playbook` | The playbook to start with when uncontrolled |
| `onChange` | `(value: Playbook) => void` | Called with the whole playbook after every add, remove, move or edit |
| `selected` | `string \| null` | The id of the step being set up (controlled); null for none |
| `defaultSelected` | `string \| null` | The step to start with when uncontrolled |
| `onSelectedChange` | `(selected: string \| null) => void` | Called when a step is picked, or the pick cleared |
| `onDryRun` | `(value: Playbook) => void` | "Dry run" was pressed – answer by setting `dryRun` |
| `onDryRunClear` | `() => void` | The dry run's result was cleared – set `dryRun` to null |
| `onVersionOpen` | `(id: string) => void` | "Open" was pressed on a version that isn't current |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `selected`, `stepTypes`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the steps once, on the step last used; then Add step, the settings and the header buttons |
| ↓ / ↑ | Moves to the next or previous step, across phases, and picks it |
| → / ← | Moves to the first step of the next or previous phase that has steps |
| Home / End | Moves to the first or last step |
| Alt + ↑ / ↓ | Moves the step earlier or later; past the first or last step of a phase it goes into the neighbouring phase |
| Alt + ← / → | Moves the step to the previous or next phase, keeping its place in the list where it can |
| Enter | Picks the step and moves focus to its title in the settings |
| Space | Picks the step |
| Delete / Backspace | Removes the step; focus moves to the next step, else the one before, else Add step |
| Escape | In the settings: back to the step on the board |
| ← / → / Home / End | In the settings' toolbar: between Move earlier, Move later and Remove |

A step moves only into a phase its type is allowed in; trigger types stay in Trigger. Pointer users drag a step by
its card (on touch, by its grip) and a line shows where it will land.

### Screen readers

The host is a region named by the heading. Each phase is a section named by its title, and its steps are a listbox
named by the same title; each step is an option, `aria-selected` when it's the one being set up, with its number read
first (“Step 3: Check the order”) and described by the keyboard hints. The settings are a section named “Step 3 ·
Intake”; Move earlier, Move later and Remove form a toolbar named “Step”, and a move that isn't possible is
`aria-disabled`. A review step's gate is a group named “Lead signs off – review gate”. A status region reports
each change: “Added Agent task to Analysis, step 2 of 2”, “Moved Read the request to Intake, step 2 of 2”,
“Removed Check the order”, “Can't move Request arrives – When an event happens steps only go in Trigger”, and the
dry run's result, “Dry run: 4 of 6 steps run · 1 skipped · pauses at Lead signs off”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | gate-config | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, gate-config | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit, gate-config | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | gate-config | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, gate-config, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself, gate-config | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 48.2 KB | 13.4 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| [gate-config](gate-config.md) · Element it renders | 23.4 KB | – |
| **Added to a page that already has Lit** | **111.8 KB** | **27.6 KB** |
| With Lit – the first component on a page | 134.6 KB | 35.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 425 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of stepTypes replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.1 ms | stepTypes: first render, 477 nodes; update 0.3 ms |
| 1,000 items | 11 ms | stepTypes: first render, 992 nodes; update 3.4 ms |

1,000 items of stepTypes: 11 ms, 992 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title steps as what the agent does, starting with a verb: “Look up the refund policy”, “Draft the reply”.
- Phase labels are short nouns; the line under each says what happens there.
- Name review steps after who decides: “Team lead signs off”.
- Version notes say what changed, not who changed it – the meta line carries the date and the author.

## Do and don't

### Do

- Answer `tc-dry-run` from the server with the same rules the real run uses, and set `dryRun` with one entry per
  step it reached. Steps without an entry show as not reached.
- Save a new version when people are done – the element marks the playbook Edited until `currentVersion` changes.
- Pass `gateConditions`, `gateReviewers`, `gateViews` and `gateActions` so review steps use your product's words.

### Don't

- Don't use it for a branching graph or free placement – it orders steps within phases, nothing more.
- Don't run anything on `tc-dry-run` that sends, pays or writes – it's a rehearsal.
- Don't restrict types to phases without saying why in the type's label; people only learn the rule when a move fails.

## Related

- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [Run Checkpoints](run-checkpoints.md) – A run's restore points on a timeline – what each one captured, what going back discards, and “go back to step 4 and try again”, with earlier attempts kept as branches
- [Delegate Board](delegate-board.md) – Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
