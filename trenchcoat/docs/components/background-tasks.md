<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Background Tasks

**Feedback & onboarding** · New

Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open

- **Element:** `<tc-background-tasks>`
- **Size:** 16.4 KB gzip · 53.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/background-tasks";` |
| React / Next.js | `import { BackgroundTasks } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/background-tasks";` · tags starting with tc- are custom elements |
| Angular | `import { BackgroundTasks } from "@adamstavely/trenchcoat/angular/background-tasks";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/background-tasks";` |

## Example

The live example is in the gallery at `#/background-tasks`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The person's own long-running jobs – an export, an upload, an agent run, a reindex – at a glance, while they carry
on with something else. An icon button in the app's header shows how many are active and a ring with their overall
progress; once nothing is running it turns to a check when everything finished, or an alert when something failed,
until the person opens it. It opens a panel that lists the tasks under Running, Queued, Done and Failed, each with
its progress, the time left and elapsed as the app reports them, and Cancel, Retry or Open. The app owns the tasks:
every action is a cancelable event.

With `notifiable`, each task that's running or queued gets a bell: “Notify me when Export Q3 revenue finishes”. Pressed, the
element fires `tc-notify` once the app moves that task to done or failed, so the app can send the notice, and the
usual announcement says it finished. `notify` holds the watched tasks. Give `notifyChannels` – “In app”, “Email”,
“Push” – and the bell opens a short list of checkboxes under the task instead; `notifyVia` keeps each task's channels.

### When to use

- Exports, uploads, imports and reindexes that take more than a few seconds and shouldn't block the page.
- Agent runs the person started and wants to come back to when they're done.
- Anywhere people need to find a finished file again, or retry what failed, without a notification for every job.
- People who start long work and want to step away until it's done (`notifiable`).

### When not to use

- Watching a pool of agent workers and their throughput – use [Agent Queue](agent-queue.md).
- A one-off message that something happened – use [Toaster](toaster.md); a stack of notices to read – use [Notification Stack](notification-stack.md).
- Steps the person ticks off themselves – use [Progress Tracker](progress-tracker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Indicator** `.ui-bgt__trigger` – the header button: a ring with the overall progress, a check or an alert
2. **Badge** `.ui-bgt__badge` – how many tasks are running or queued
3. **Section** `.ui-bgt__label` – Running, Queued, Done or Failed, with its count
4. **Task** `.ui-bgt__row` – the kind's icon, the label and detail, and the status line
5. **Progress** `.ui-bgt__bar` – how far a running task is, or a sliding bar while it's working
6. **Actions** `.ui-bgt__acts` – Cancel, Retry or Open
7. **Clear finished** `.ui-bgt__clear` – removes the done and failed tasks
8. **Bell** `.ui-bgt__bell` – notify me when this task finishes (`notifiable`); highlighted while it's on
9. **Channels** `.ui-bgt__channels` – how to be told, with `notifyChannels`

## Looks

Standard sets the panel's header on the gray tray, the list on a white card and Clear finished on the tray below it;
its progress ring and bars are ink. Clean is one white card with the header as its first row, section labels as
small capitals, quieter task labels, accent-coloured bars and thinner icons. Opened from the indicator, both looks
use the menu surface with a plain title row, since a popover carries no card header.

## Usage

### HTML

```html
<tc-background-tasks id="jobs"></tc-background-tasks>

<script type="module">
  import "@adamstavely/trenchcoat/background-tasks";
  import "@adamstavely/trenchcoat/tokens.css";

  const jobs = document.querySelector("#jobs");
  jobs.tasks = [
    { id: "e1", label: "Export Q3 revenue", kind: "export", status: "running", progress: 0.4, remaining: 65000 },
    { id: "u1", label: "Upload brand-assets.zip", kind: "upload", status: "failed", error: "Connection lost" },
  ];
  jobs.addEventListener("tc-task-retry", (e) => {
    e.preventDefault(); // the app restarts the upload and updates the list
    console.log("retry", e.detail.task.id);
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BackgroundTasks, type BackgroundTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Header() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([
    { id: "e1", label: "Export Q3 revenue", kind: "export", status: "done", elapsed: 42000, result: { label: "q3-revenue.csv", href: "/files/q3-revenue.csv" } },
  ]);
  return <BackgroundTasks tasks={tasks} onTasksChange={(next) => setTasks(next)} onOpen={(task) => console.log("open", task.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/background-tasks";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";

defineProps<{ tasks: TcBackgroundTasks["tasks"]; announce: TcBackgroundTasks["announce"] }>();
const onTaskCancel = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-background-tasks :tasks="tasks" :announce="announce" @tc-task-cancel="onTaskCancel"></tc-background-tasks>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BackgroundTasks } from "@adamstavely/trenchcoat/angular/background-tasks";
import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";

@Component({
  selector: "app-background-tasks-example",
  imports: [BackgroundTasks],
  template: `<tc-background-tasks [tasks]="tasks()" [announce]="announce()" (tc-task-cancel)="onTaskCancel($event)"></tc-background-tasks>`,
})
export class BackgroundTasksExample {
  readonly tasks = input.required<TcBackgroundTasks["tasks"]>();
  readonly announce = input.required<TcBackgroundTasks["announce"]>();
  onTaskCancel(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/background-tasks";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";

  let { tasks, announce }: { tasks: TcBackgroundTasks["tasks"]; announce: TcBackgroundTasks["announce"] } = $props();
  let el: TcBackgroundTasks;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-task-cancel", on);
    return () => el.removeEventListener("tc-task-cancel", on);
  });
</script>

<tc-background-tasks bind:this={el} {tasks} {announce}></tc-background-tasks>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tasks` | – | `BackgroundTask[]` | `[]` | The tasks, in any order – the panel groups them by status and keeps their order within a group |
| `layout` | `layout` | `BackgroundTasksLayout` | `"indicator"` | "indicator" (default): the header button that opens the panel; "panel": the panel inline, as a card |
| `open` | `open` | `boolean` | `false` | Whether the indicator's panel is open |
| `heading` | `heading` | `string` | `"Background tasks"` | The panel's title, and the start of the indicator's name |
| `emptyText` | `empty-text` | `string` | `"Nothing running in the background"` | Shown in the panel when there are no tasks |
| `announce` | – | `((task: BackgroundTask) => string) \| undefined` | `undefined` | What's announced when a task finishes or fails; default “&lt;label> ready” and “&lt;label> failed” |
| `notifiable` | `notifiable` | `boolean` | `false` | Offer "notify me when it's done" on running and queued tasks |
| `notify` | – | `string[]` | `[]` | The tasks the person will be told about when they finish |
| `notifyChannels` | – | `string[]` | `[]` | Ways to be told – "In app", "Email", "Push"; given, the bell opens a choice of them |
| `notifyVia` | – | `Record<string, string[]>` | `{}` | The channels chosen for each watched task, with `notifyChannels` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-task-cancel` | – | Yes | Cancel was chosen; detail `{ task, tasks }` (`tasks` without it). Cancelable: preventDefault() and the app cancels it |
| `tc-task-retry` | – | Yes | Retry was chosen on a failed task; detail `{ task, tasks }` (`tasks` with it queued again). Cancelable: preventDefault() and the app retries it |
| `tc-task-open` | – | Yes | Open was chosen on a done task; detail `{ task, tasks }`. Cancelable: preventDefault() stops a `result.href` link being followed |
| `tc-clear-finished` | – | Yes | Clear finished was chosen; detail `{ cleared, tasks }` (`tasks` without the done and failed ones). Cancelable: preventDefault() and the app clears them |
| `tc-open-change` | – | Yes | The panel is opening or closing; detail `{ open }`. Cancelable: preventDefault() keeps it as it is |
| `tc-notify-change` | – | Yes | The bell or a channel was switched on a task ({ notify, id, on, channels, notifyVia }: BackgroundTasksNotifyChange); cancelable – prevented, nothing changes |
| `tc-notify` | – | No | A watched task finished ({ id, status, task, channels }: BackgroundTasksNotify) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-background-tasks-max-height` | `none` | not set – this fallback applies |

#### Design tokens it reads (89)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `taskTime(ms: number): string` | A time as the app reported it: 45s · 2m 05s · 1h 05m |

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
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-background-tasks :tasks="…">` | `<tc-background-tasks [tasks]="…">` | `<tc-background-tasks {tasks}>` |
| `announce` | `el.announce = …;` | `<… announce={…} />` | `<tc-background-tasks :announce="…">` | `<tc-background-tasks [announce]="…">` | `<tc-background-tasks {announce}>` |
| `notify` | `el.notify = …;` | `<… notify={…} />` | `<tc-background-tasks :notify="…">` | `<tc-background-tasks [notify]="…">` | `<tc-background-tasks {notify}>` |
| `notifyChannels` | `el.notifyChannels = …;` | `<… notifyChannels={…} />` | `<tc-background-tasks :notifyChannels="…">` | `<tc-background-tasks [notifyChannels]="…">` | `<tc-background-tasks {notifyChannels}>` |
| `notifyVia` | `el.notifyVia = …;` | `<… notifyVia={…} />` | `<tc-background-tasks :notifyVia="…">` | `<tc-background-tasks [notifyVia]="…">` | `<tc-background-tasks {notifyVia}>` |

*Also attributes: `layout`, `open`, `heading`, `empty-text`, `notifiable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-task-cancel` | Yes | `el.addEventListener("tc-task-cancel", (e) => …)` | `onCancel={…}` | `@tc-task-cancel="…"` | `(tc-task-cancel)="…($event)"` | `el.addEventListener("tc-task-cancel", …)` |
| `tc-task-retry` | Yes | `el.addEventListener("tc-task-retry", (e) => …)` | `onRetry={…}` | `@tc-task-retry="…"` | `(tc-task-retry)="…($event)"` | `el.addEventListener("tc-task-retry", …)` |
| `tc-task-open` | Yes | `el.addEventListener("tc-task-open", (e) => …)` | `onOpen={…}` | `@tc-task-open="…"` | `(tc-task-open)="…($event)"` | `el.addEventListener("tc-task-open", …)` |
| `tc-clear-finished` | Yes | `el.addEventListener("tc-clear-finished", (e) => …)` | `onClearFinished={…}` | `@tc-clear-finished="…"` | `(tc-clear-finished)="…($event)"` | `el.addEventListener("tc-clear-finished", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-notify-change` | Yes | `el.addEventListener("tc-notify-change", (e) => …)` | `ref.current.addEventListener("tc-notify-change", …)` | `@tc-notify-change="…"` | `(tc-notify-change)="…($event)"` | `el.addEventListener("tc-notify-change", …)` |
| `tc-notify` | No | `el.addEventListener("tc-notify", (e) => …)` | `onNotify={…}` | `@tc-notify="…"` | `(tc-notify)="…($event)"` | `el.addEventListener("tc-notify", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` and `notify` itself unless a listener calls `preventDefault()` on `tc-open-change` or `tc-notify-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-background-tasks id="background-tasks"></tc-background-tasks>

<script type="module">
  import "@adamstavely/trenchcoat/background-tasks";

  const el = document.querySelector("#background-tasks");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { BackgroundTasks } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof BackgroundTasks>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledBackgroundTasks({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <BackgroundTasks {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/background-tasks";
import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";

const props = defineProps<{ initial: TcBackgroundTasks["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcBackgroundTasks["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-background-tasks :open="open" @tc-open-change="onOpenChange"></tc-background-tasks>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BackgroundTasks } from "@adamstavely/trenchcoat/angular/background-tasks";
import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";

@Component({
  selector: "app-controlled-background-tasks",
  imports: [BackgroundTasks],
  template: `<tc-background-tasks [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-background-tasks>`,
})
export class ControlledBackgroundTasks {
  readonly initial = input.required<TcBackgroundTasks["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcBackgroundTasks["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/background-tasks";
  import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";

  let { initial }: { initial: TcBackgroundTasks["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcBackgroundTasks;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcBackgroundTasks["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-background-tasks bind:this={el} {open}></tc-background-tasks>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-background-tasks")` returns a `TcBackgroundTasks` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";`
- **React / Next.js:** Props: `import type { BackgroundTasksProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BackgroundTasks>`. The element class, for refs: `import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBackgroundTasks["tasks"]` with `import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";`
- **Angular:** The directive types the template: `[tasks]` takes `TcBackgroundTasks["tasks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBackgroundTasks } from "@adamstavely/trenchcoat/background-tasks";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The panel's title, and the start of the indicator's name – "Background tasks" by default |
| `tasks` | `BackgroundTask[]` | The tasks. Controlled when defined: Cancel, Retry and Clear finished only report, and you update the list |
| `defaultTasks` | `BackgroundTask[]` | The tasks when uncontrolled – the component applies Cancel, Retry and Clear finished itself |
| `onTasksChange` | `(tasks: BackgroundTask[], change: BackgroundTasksChange) => void` | Called with the list as it is after Cancel, Retry or Clear finished, and what happened |
| `onCancel` | `(task: BackgroundTask) => void` | Cancel was chosen on a running or queued task |
| `onRetry` | `(task: BackgroundTask) => void` | Retry was chosen on a failed task |
| `onOpen` | `(task: BackgroundTask) => boolean \| void` | Open was chosen on a done task; return false to stop a `result.href` link being followed |
| `onClearFinished` | `(cleared: BackgroundTask[]) => void` | Clear finished was chosen, with the done and failed tasks it removes |
| `open` | `boolean` | Whether the indicator's panel is open. Controlled when defined |
| `defaultOpen` | `boolean` | Whether the panel starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | The panel opened or closed |
| `notify` | `string[]` | The watched tasks (with `notifiable`). Controlled when defined |
| `defaultNotify` | `string[]` | The watched tasks when uncontrolled |
| `notifyVia` | `Record<string, string[]>` | The channels chosen per watched task (with `notifyChannels`). Controlled when defined |
| `defaultNotifyVia` | `Record<string, string[]>` | The channels per task when uncontrolled |
| `onNotifyChange` | `(notify: string[], change: BackgroundTasksNotifyChange) => void` | The bell or a channel was switched – the watched tasks as they are now, and the change |
| `onNotify` | `(task: BackgroundTask, status: "done" \| "failed", channels?: string[]) => void` | A watched task finished |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the indicator: opens or closes the panel; focus goes to the first task |
| ↓ / ↑ | In the list: the next or previous task |
| Home / End | In the list: the first or last task |
| Tab | From a task to its actions, then Clear finished (the list is one tab stop) |
| Enter / Space | On a bell: watches the task or stops watching it – or, with channels, opens or closes its list |
| Escape | In a channel list: closes it and returns focus to its bell (the panel stays open) |
| Escape | Closes the panel and returns focus to the indicator |

### Screen readers

The indicator is a button with `aria-haspopup="dialog"` and `aria-expanded`, named with the counts: “Background tasks,
3 active (2 running, 1 queued), 1 failed”. The panel is a non-modal `dialog` named by its title. Each section is a
`group` named by its label, such as “Running 2”. A task is named by its label and described by its detail and its
status line – “40% · 1m 05s left · 12s elapsed”, “Waiting to start”, “Done · took 42s”, or the error. A running
task's bar is a `progressbar` named by the label, with its percentage, or “Working” when the app doesn't know it. The
actions are named with the task: “Cancel Export Q3 revenue”, “Retry Upload assets”, “Open invoices.zip”. A polite
status region says “Export Q3 revenue ready” or “Upload assets failed” when a task finishes or fails – never each
progress tick – and “… cancelled”, “… queued again” and “Cleared 2 finished tasks” after an action.

A bell is a toggle button (`aria-pressed`) named “Notify me when <task> finishes”; with channels it's a disclosure
(`aria-expanded`) whose name adds the chosen channels, and the list is a `fieldset` of checkboxes named “Tell me about
<task> by”. Switching it is announced – “You'll be told when … finishes”, “No longer watching …”.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.9 KB | 10.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **53.2 KB** | **16.4 KB** |
| With Lit – the first component on a page | 76.3 KB | 23.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 10 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of tasks replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 8.2 ms | tasks: first render, 10 nodes; update 6.3 ms |

Windowed: 10,000 items of tasks render 10 nodes in 8.2 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label a task with what it does to what, in a few words: “Export Q3 revenue”, “Upload brand-assets.zip”.
- Put the size, the count or the source in `detail`: “CSV · 48,210 rows”.
- Give `remaining` and `elapsed` only when you have them; the component reads no clock, and a missing time is
  better than a guessed one. Leave `progress` out when you can't measure it – the task shows “Working…”.
- Write `error` as what happened, not a code: “Connection lost at 62%”.
- Give a done task a `result` with the file's name, so Open says what it opens.
- Use `announce` to word the announcements your own way (“Your export is ready”).
- Word channels as people know them – “In app”, “Email”, “Push” – and offer only the ones that work for them.

## Do and don't

### Do

- Keep the tasks in your own state and pass them back after each action; prevent the event when the action really
  happens on your server.
- Mark jobs that can't be stopped with `cancelable: false` and ones that can't be repeated with `retryable: false`.
- Put the indicator where people look for status – at the end of the app's header.
- Send the notice when `tc-notify` fires, on the channels in its detail; the element doesn't send anything.

### Don't

- Don't push a notification for every progress step as well – the ring and the panel already show it.
- Don't list other people's jobs or system work here; it's the person's own tasks.
- Don't remove a failed task on your own: leave it until the person retries or clears it.

## Related

- [Agent Queue](agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Toaster](toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss

## Changelog

- **Feedback and onboarding:** - `tc-stories`: a gradient ring for new updates that opens a modal viewer; - `tc-background-tasks`.
