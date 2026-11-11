<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Checkpoints

**Agents** · New

A run's restore points on a timeline – what each one captured, what going back discards, and “go back to step 4 and try again”, with earlier attempts kept as branches

- **Element:** `<tc-run-checkpoints>`
- **Size:** 14.5 KB gzip · 53.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-checkpoints";` |
| React / Next.js | `import { RunCheckpoints } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-checkpoints";` · tags starting with tc- are custom elements |
| Angular | `import { RunCheckpoints } from "@adamstavely/trenchcoat/angular/run-checkpoints";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-checkpoints";` |

## Example

The live example is in the gallery at `#/run-checkpoints`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent run's restore points on a timeline – “go back to step 4 and try again”. The agent saves a checkpoint
before each step; pick one and the card shows what it captured (the conversation, memory, the workspace) and what
going back discards: that step and every later one, the files they changed and what they spent. A note for the
agent goes along with the restore, so the retry can go differently. People see the cost of rewinding before they
commit to it.

Going back doesn't have to erase anything: pass the new attempt in `branches` and the run branches out of the
checkpoint it went back to, like git for agents. A small drawing of the attempts appears – the newest one solid, each
attempt the run left faded and labelled “Earlier attempt” – and picking an attempt lists its steps, so what an
earlier try did stays inspectable, and you can go back to one of its checkpoints too.

### When to use

- Long agent runs where a wrong turn halfway through shouldn't mean starting over.
- Letting people retry a failed step with a different instruction (“use the staging database instead”).
- Making the cost of going back visible – discarded steps, file changes, tokens and money.
- Keeping earlier attempts around to compare against or return to (`branches`).

### When not to use

- Reviewing and editing an agent's plan before it runs – use [Agent Plan](agent-plan.md).
- Comparing two finished runs side by side – use [Run Compare](run-compare.md).
- Forking a chat by editing an earlier message – use [Conversation Branches](conversation-branches.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the run's goal, how many checkpoints, and the run's status
2. **Timeline** `.ui-rcp__strip` – the run as a line, a dot per checkpoint; what going back discards is hatched
3. **Step** `.ui-rcp__row` – one checkpoint: its number, the step, a detail, the tool and when it was taken
4. **Details** `.ui-rcp__panel` – what the picked checkpoint captured and what going back discards
5. **Note** `.ui-rcp__note` – an optional instruction for the retry
6. **Foot** `.ui-rcp__foot` – where the run starts again and “Go back to step N”
7. **Attempts** `.ui-rcp__attempts` – with `branches`: a lane per attempt, its name and “Current attempt” or “Earlier

## Looks

Standard sets the timeline, steps and details in a white card on a gray tray, with the foot and the Go back button
on the tray below. Clean is one white card: the foot is its last row under a hairline, and the details' captions
are small capitals. Both mark the picked step with an accent bar and hatch what going back discards. Earlier attempts are drawn in a
quieter colour with a dashed fork – colour, not transparency, so their names stay readable. The attempts drawing keeps
its size in a narrow card and scrolls sideways.

## Usage

### HTML

```html
<tc-run-checkpoints id="run" heading="Move billing from MySQL to Postgres" status="running"></tc-run-checkpoints>

<script type="module">
  import "@adamstavely/trenchcoat/run-checkpoints";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.elapsed = 70000;
  run.checkpoints = [
    { id: "s1", title: "Read the billing schema", tool: "read_files", at: 0, tokens: 4200 },
    { id: "s2", title: "Run the test suite", tool: "run_tests", at: 41000, status: "failed", files: ["test_invoice.py"], tokens: 7300, cost: 0.04 },
  ];
  run.addEventListener("tc-restore", (e) => {
    // The run branches out of the checkpoint it went back to
    run.branches = [...run.branches, { id: `try${run.branches.length + 2}`, from: e.detail.checkpointId, checkpoints: [] }];
  });
  run.addEventListener("tc-branch-change", (e) => console.log("showing", e.detail.branch));
</script>
```

### React / Next.js

```tsx
import { RunCheckpoints, type RunCheckpoint } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const checkpoints: RunCheckpoint[] = [
  { id: "s1", title: "Read the billing schema", tool: "read_files", at: 0, tokens: 4200 },
  { id: "s2", title: "Run the test suite", tool: "run_tests", at: 41000, status: "failed", files: ["test_invoice.py"], tokens: 7300, cost: 0.04 },
];

export function Rewind({ restore }: { restore: (id: string, note: string) => Promise<void> }) {
  return (
    <RunCheckpoints
      title="Move billing from MySQL to Postgres"
      checkpoints={checkpoints}
      status="running"
      elapsed={70_000}
      onRestore={(id, note) => restore(id, note)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-checkpoints";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";

defineProps<{ checkpoints: TcRunCheckpoints["checkpoints"]; branches: TcRunCheckpoints["branches"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-checkpoints :checkpoints="checkpoints" :branches="branches" @tc-selected-change="onSelectedChange"></tc-run-checkpoints>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunCheckpoints } from "@adamstavely/trenchcoat/angular/run-checkpoints";
import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";

@Component({
  selector: "app-run-checkpoints-example",
  imports: [RunCheckpoints],
  template: `<tc-run-checkpoints [checkpoints]="checkpoints()" [branches]="branches()" (tc-selected-change)="onSelectedChange($event)"></tc-run-checkpoints>`,
})
export class RunCheckpointsExample {
  readonly checkpoints = input.required<TcRunCheckpoints["checkpoints"]>();
  readonly branches = input.required<TcRunCheckpoints["branches"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-checkpoints";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";

  let { checkpoints, branches }: { checkpoints: TcRunCheckpoints["checkpoints"]; branches: TcRunCheckpoints["branches"] } = $props();
  let el: TcRunCheckpoints;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-run-checkpoints bind:this={el} {checkpoints} {branches}></tc-run-checkpoints>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `checkpoints` | – | `RunCheckpoint[]` | `[]` | The checkpoints, oldest first – one before each step of the run |
| `status` | `status` | `RunCheckpointsStatus` | `"done"` | The run: "running" (a live run), "paused", "done", "failed" – always set by the app |
| `heading` | `heading` | `string` | `""` | The run's goal, shown as the heading |
| `branches` | – | `RunCheckpointBranch[]` | `[]` | Later attempts at the run, oldest first – each branches out of the checkpoint it went back to; the last one is the live attempt |
| `branch` | `branch` | `string \| null` | `null` | The attempt on show: a branch's id, "original" for the first attempt, or null for the newest. Changes apply unless a tc-branch-change listener calls preventDefault() |
| `selected` | `selected` | `string \| null` | `null` | The picked checkpoint's id. Picks apply unless a tc-selected-change listener calls preventDefault() |
| `elapsed` | `elapsed` | `number \| undefined` | `undefined` | How long the run has gone on, in ms – the strip's length (defaults to the last checkpoint) |
| `placeholder` | `placeholder` | `string` | `"What should it do differently? (optional)"` | Placeholder of the note that goes along with the restore |
| `currency` | `currency` | `string` | `"USD"` | Currency of `cost`, an ISO 4217 code |
| `locale` | `locale` | `string` | `"en-US"` | Locale for money |
| `restorer` | – | `((checkpointId: string, instruction: string) => void \| Promise<unknown>) \| undefined` | `undefined` | Called on restore (as well as tc-restore). May return a promise: the button waits, and says so if it rejects |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A step is picked or the pick is cleared (detail: { selected: string \| null, checkpoint?: RunCheckpoint }); cancelable |
| `tc-restore` | – | No | "Go back to step N" pressed (detail: { checkpointId: string, instruction: string, discarded: string[] }) |
| `tc-branch-change` | – | Yes | Another attempt was picked (detail: { branch: string \| null }); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-run-checkpoints-accent` | `var(--tc-accent-solid)` | standard, clean |
| `--tc-run-checkpoints-on-accent` | `var(--tc-text-on-accent)` | standard, clean |
| `--tc-run-checkpoints-drop` | `light-dark(rgba(196, 50, 50, 0.26), rgba(255, 110, 110, 0.3))` | standard, clean |
| `--tc-run-checkpoints-inset` | `var(--tc-space-2-5)` | standard, clean |
| `--tc-run-checkpoints-marker` | `20px` | standard, clean |
| `--tc-run-checkpoints-lane` | `36px` | standard, clean |
| `--tc-run-checkpoints-earlier` | `var(--tc-border-strong)` | standard, clean |

#### Design tokens it reads (106)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-run-checkpoints-cut`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `FIRST_ATTEMPT: string` | The first attempt's id in `branch` |

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
| `checkpoints` | `el.checkpoints = …;` | `<… checkpoints={…} />` | `<tc-run-checkpoints :checkpoints="…">` | `<tc-run-checkpoints [checkpoints]="…">` | `<tc-run-checkpoints {checkpoints}>` |
| `branches` | `el.branches = …;` | `<… branches={…} />` | `<tc-run-checkpoints :branches="…">` | `<tc-run-checkpoints [branches]="…">` | `<tc-run-checkpoints {branches}>` |
| `restorer` | `el.restorer = …;` | `<… restorer={…} />` | `<tc-run-checkpoints :restorer="…">` | `<tc-run-checkpoints [restorer]="…">` | `<tc-run-checkpoints {restorer}>` |

*Also attributes: `status`, `heading`, `branch`, `selected`, `elapsed`, `placeholder`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-restore` | No | `el.addEventListener("tc-restore", (e) => …)` | `ref.current.addEventListener("tc-restore", …)` | `@tc-restore="…"` | `(tc-restore)="…($event)"` | `el.addEventListener("tc-restore", …)` |
| `tc-branch-change` | Yes | `el.addEventListener("tc-branch-change", (e) => …)` | `ref.current.addEventListener("tc-branch-change", …)` | `@tc-branch-change="…"` | `(tc-branch-change)="…($event)"` | `el.addEventListener("tc-branch-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `branch` and `selected` itself unless a listener calls `preventDefault()` on `tc-branch-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-run-checkpoints id="run-checkpoints"></tc-run-checkpoints>

<script type="module">
  import "@adamstavely/trenchcoat/run-checkpoints";

  const el = document.querySelector("#run-checkpoints");
  el.addEventListener("tc-branch-change", (e) => {
    e.preventDefault(); // the element keeps its branch…
    if (allowed(e.detail.branch)) el.branch = e.detail.branch; // …until the app sets it
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
import "@adamstavely/trenchcoat/run-checkpoints";
import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";

const props = defineProps<{ initial: TcRunCheckpoints["branch"] }>();
const branch = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onBranchChange = (e: CustomEvent<{ branch: TcRunCheckpoints["branch"] }>) => {
  e.preventDefault();
  branch.value = e.detail.branch;
};
</script>

<template>
  <tc-run-checkpoints :branch="branch" @tc-branch-change="onBranchChange"></tc-run-checkpoints>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunCheckpoints } from "@adamstavely/trenchcoat/angular/run-checkpoints";
import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";

@Component({
  selector: "app-controlled-run-checkpoints",
  imports: [RunCheckpoints],
  template: `<tc-run-checkpoints [branch]="branch()" (tc-branch-change)="onBranchChange($event)"></tc-run-checkpoints>`,
})
export class ControlledRunCheckpoints {
  readonly initial = input.required<TcRunCheckpoints["branch"]>();
  readonly branch = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onBranchChange(e: CustomEvent<{ branch: TcRunCheckpoints["branch"] }>) {
    e.preventDefault();
    this.branch.set(e.detail.branch);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-checkpoints";
  import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";

  let { initial }: { initial: TcRunCheckpoints["branch"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let branch = $derived(initial);
  let el: TcRunCheckpoints;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      branch = (e as CustomEvent<{ branch: TcRunCheckpoints["branch"] }>).detail.branch;
    };
    el.addEventListener("tc-branch-change", on);
    return () => el.removeEventListener("tc-branch-change", on);
  });
</script>

<tc-run-checkpoints bind:this={el} {branch}></tc-run-checkpoints>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-checkpoints")` returns a `TcRunCheckpoints` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";`
- **React / Next.js:** Props: `import type { RunCheckpointsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunCheckpoints>`. The element class, for refs: `import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunCheckpoints["checkpoints"]` with `import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";`
- **Angular:** The directive types the template: `[checkpoints]` takes `TcRunCheckpoints["checkpoints"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunCheckpoints } from "@adamstavely/trenchcoat/run-checkpoints";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `checkpoints` | `RunCheckpoint[]` | The checkpoints, oldest first – one before each step of the run |
| `title` | `string` | The run's goal, shown as the heading |
| `selected` | `string \| null` | The picked checkpoint's id. Controlled when defined (null = nothing picked); otherwise the component keeps it, starting at `defaultSelected` |
| `defaultSelected` | `string \| null` | First pick when uncontrolled |
| `onSelectedChange` | `(id: string \| null, checkpoint?: RunCheckpoint) => void` | Called with the picked checkpoint's id, or null when the pick is cleared |
| `onRestore` | `(checkpointId: string, instruction: string, discarded: string[]) => void \| Promise<unknown>` | "Go back to step N" pressed: the checkpoint, the note for the agent ("" when none) and the ids of the steps it discards. May return a promise – the button waits, and says so if it rejects |
| `branch` | `string \| null` | The attempt on show: a branch's id, "original" for the first attempt, null for the newest. Controlled when defined; otherwise the component keeps it, starting at `defaultBranch` |
| `defaultBranch` | `string \| null` | The attempt on show at first when uncontrolled |
| `onBranchChange` | `(branch: string \| null) => void` | Called with the attempt the user picked |

*Renamed or hidden on the wrapper: `checkpoints`, `heading`, `selected`, `restorer`, `branch`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the list – to the picked step, else the newest one that can be restored – and on to the details |
| ↓ / ↑ | Moves to the next or previous step and picks it (a step without a snapshot takes focus but isn't picked) |
| Home / End | Moves to the first or last step and picks it |
| Space | Picks the focused step |
| Enter | Picks the focused step and moves to the note |
| Escape | On a step: clears the pick. In the note: returns to the picked step, the pick stays |
| Enter in the note | Goes back to the picked step |
| ↑ / ↓ / ← / → | In Attempts (one tab stop), moves to the previous or next attempt and shows it |
| Home / End | In Attempts, shows the first or the newest attempt |

### Screen readers

The card is a region named by the run's goal. The steps are a listbox, “Restore points”, whose options read “Step 4:
Run the test suite, Failed, at 41 seconds”, with “no snapshot – can't go back here” and “discarded by going back”
added where they apply; the picked step is `aria-selected`, one without a snapshot is `aria-disabled` and the running
one is `aria-current="step"`. The status pill reads “Live run”. The details are two sections headed “Captured before
step 4” and “Going back discards”; the note is named “Note for the agent when it runs step 4 again”, and the button
is `aria-busy` while a restore is on its way. A polite live region says “Step 4 picked. Going back discards 3 steps
and 1 file change.”, then “Went back to step 4 with your note.”; a failed restore shows an alert, “Couldn't go back
– try again”.

With branches, the attempts are a `radiogroup` named “Attempts”; each is a radio named by its label and “Current
attempt” or “Earlier attempt”, followed by “4 steps, live, went back to 0:41 of First attempt”. The header's count
adds “2 attempts”. While an earlier attempt is on show a line says so in words, and switching announces “Showing an
earlier attempt, First attempt: 6 steps.”

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
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This component alone** | 45.0 KB | 11.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **53.8 KB** | **14.5 KB** |
| With Lit – the first component on a page | 76.5 KB | 22.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.9 ms** | the gallery demo's data, 164 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of checkpoints replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 21 ms | checkpoints: first render, 1,491 nodes; update 1.5 ms |
| 1,000 items | 122 ms | checkpoints: first render, 14,241 nodes; update 6.7 ms |

1,000 items of checkpoints: 122 ms. It renders every item, so a first render passes 50 ms (a long task) at about 410 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title each checkpoint with the step that starts there, as a verb phrase: “Run the test suite”.
- Use `detail` for the outcome people would look for (“3 failed: invoice totals off by a cent”), one line.
- List what was captured in people's words (“Conversation – 14 messages”); without `captured`, the workspace is described for you.
- Write a `placeholder` that invites a concrete change: the default is “What should it do differently? (optional)”.

## Do and don't

### Do

- Mark the running step `status: "active"` and a failed one `"failed"`, so the timeline shows where it went wrong.
- Give each step its `files`, `tokens` and `cost`, so people can weigh what going back throws away.
- Return a promise from `restorer` (`onRestore`) when rewinding takes time – the button waits and reports a failure.
- When a restore starts a new attempt, append it to `branches` with `from` set to the checkpoint it went back to and
  keep `checkpoints` as the first attempt – the element follows the new attempt even if an earlier one was on show.
- Let `at` keep counting from the start of the run in every attempt, so the drawing reads left to right in time.

### Don't

- Don't offer a checkpoint the run can't return to – set `restorable: false` and it says “No snapshot”.
- Don't keep `status` running after the run stops; the component reads no clock, so `elapsed` and `status` are yours to update.
- Don't use it for undo inside a document – it's for runs.
- Don't rewrite an earlier attempt's checkpoints after it's been left – it's a record of what that try did.

## Related

- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Conversation Branches](conversation-branches.md) – Edit a past message and the conversation forks – a 2 / 3 switcher on the edited message, and each branch's replies below it

## Changelog

- `tc-run-checkpoints` – a run's restore points as a list and a timeline: what each point captured, what going back discards (steps, file changes, tokens, cost), a note for the retry, and `restorer` that may return a promise. Listbox keyboard; `tc-selected-change`, `tc-restore`.
