<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Task Board

**Blocks** · New

Kanban board with drag and drop, quick add, a detail panel, search, label filters and a compact view (uses `button`)

- **Element:** `<tc-task-board>`
- **Size:** 15.9 KB gzip · 57.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/task-board";` |
| React / Next.js | `import { TaskBoard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/task-board";` · tags starting with tc- are custom elements |
| Angular | `import { TaskBoard } from "@adamstavely/trenchcoat/angular/task-board";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/task-board";` |

## Example

The live example is in the gallery at `#/blocks/task-board`, in both looks; Replay restarts its animations.

## Overview

A kanban board for a sprint. A breadcrumb names the board; a bar counts the tasks and holds search, a label filter
and a compact view. Each status is a gray lane of white cards – key, title, assignee, priority, estimate, due date,
subtasks, pull request and labels. Drag cards between lanes and reorder them, add a card at the top of a lane, or open
a card in a panel that slides in from the right to change its status, priority, labels, assignee and title, or delete
it.

### When to use

- Sprint and project boards where work moves through a few fixed statuses.
- Triage views where people sort, label and assign many small items.

### When not to use

- Work an agent is doing, with its own states and approvals – use [Agent Queue](../components/agent-queue.md).
- A checklist of steps toward one goal – use [Progress Tracker](../components/progress-tracker.md).
- Items checked against many criteria – use [Coverage Matrix](../components/coverage-matrix.md).
- Many items with many columns to sort – use [Data Table](../components/data-table.md).

## Anatomy

1. **Breadcrumb** `.ui-tb__crumbs` – where the board sits, the last step the board itself, and a favourite star
2. **Bar** `.ui-tb__bar` – the task count, search, the label filter and the compact toggle
3. **Lane** `.ui-tb__column` – a status: its icon, name, count and an add button, then its cards
4. **Card** `.ui-tb__card` – a task's key, title, assignee and properties; drag it, or open it
5. **Property** `.ui-tb__prop` – a pill: priority, estimate, due date, subtasks, pull request or label
6. **Drop line** `.ui-tb__drop` – where a dragged card will land
7. **Panel** `.ui-tb__panel` – the open card: title, status, priority, labels, assignee and Delete

## Looks

Standard is a white panel with a hairline border; Clean lifts it with the card shadow and rounds the lanes and cards
a little less. Lanes, cards and the panel are the same in both. `--tc-tb-scrim` sets the wash behind the open panel.

## Usage

### HTML

```html
<tc-task-board id="board"></tc-task-board>

<script type="module">
  import "@adamstavely/trenchcoat/task-board";
  import "@adamstavely/trenchcoat/tokens.css";

  const board = document.querySelector("#board");
  board.path = ["Northwind", "Web app", "Sprint 24"];
  board.statuses = [
    { id: "todo", label: "Todo" },
    { id: "done", label: "Done" },
  ];
  board.labels = [{ id: "bug", label: "Bug", color: "#ef4444" }];
  board.people = [{ id: "maya", name: "Maya Kim" }];
  board.tasks = [{ id: "t1", key: "NW-201", title: "Fix the invite flow", status: "todo", priority: 3, labels: ["bug"], created: "Oct 2" }];
  board.addEventListener("tc-tasks-change", (e) => console.log(e.detail.change, e.detail.task));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TaskBoard, type Task } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const statuses = [
  { id: "todo", label: "Todo" },
  { id: "done", label: "Done" },
];

export function Sprint({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  return <TaskBoard tasks={tasks} onTasksChange={setTasks} statuses={statuses} labels={[]} people={[]} path={["Web app", "Sprint 24"]} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/task-board";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";

defineProps<{ tasks: TcTaskBoard["tasks"]; statuses: TcTaskBoard["statuses"] }>();
const onTasksChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-task-board :tasks="tasks" :statuses="statuses" @tc-tasks-change="onTasksChange"></tc-task-board>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TaskBoard } from "@adamstavely/trenchcoat/angular/task-board";
import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";

@Component({
  selector: "app-task-board-example",
  imports: [TaskBoard],
  template: `<tc-task-board [tasks]="tasks()" [statuses]="statuses()" (tc-tasks-change)="onTasksChange($event)"></tc-task-board>`,
})
export class TaskBoardExample {
  readonly tasks = input.required<TcTaskBoard["tasks"]>();
  readonly statuses = input.required<TcTaskBoard["statuses"]>();
  onTasksChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/task-board";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";

  let { tasks, statuses }: { tasks: TcTaskBoard["tasks"]; statuses: TcTaskBoard["statuses"] } = $props();
  let el: TcTaskBoard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-tasks-change", on);
    return () => el.removeEventListener("tc-tasks-change", on);
  });
</script>

<tc-task-board bind:this={el} {tasks} {statuses}></tc-task-board>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tasks` | – | `Task[]` | `[]` | The cards |
| `statuses` | – | `TaskStatus[]` | `[]` | The columns, in order |
| `labels` | – | `TaskLabel[]` | `[]` | The labels a card can carry, with their colours |
| `people` | – | `TaskPerson[]` | `[]` | The people a card can be assigned to |
| `path` | – | `string[]` | `["Northwind", "Launch", "Sprint 12"]` | Breadcrumb above the board; its steps also name the board |
| `compact` | `compact` | `boolean` | `false` | Shows cards without their properties and dates |
| `now` | `now` | `number \| undefined` | `undefined` | The day new cards are created, as epoch ms – today by default |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-tasks-change` | – | Yes | A card was added, edited, moved or deleted ({ tasks, task, change }: TaskBoardTasksChange); cancelable – prevented, `tasks` stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tb-scrim` | `light-dark(rgba(23, 23, 23, 0.08), rgba(0, 0, 0, 0.4))` | both |

#### Design tokens it reads (101)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-3xl`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xl`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-pink-bg`, `--tc-tone-pink-border`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-z-drawer`, `--tc-z-drawer-scrim`, `--tc-z-dropdown`

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
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-task-board :tasks="…">` | `<tc-task-board [tasks]="…">` | `<tc-task-board {tasks}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-task-board :statuses="…">` | `<tc-task-board [statuses]="…">` | `<tc-task-board {statuses}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-task-board :labels="…">` | `<tc-task-board [labels]="…">` | `<tc-task-board {labels}>` |
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-task-board :people="…">` | `<tc-task-board [people]="…">` | `<tc-task-board {people}>` |
| `path` | `el.path = …;` | `<… path={…} />` | `<tc-task-board :path="…">` | `<tc-task-board [path]="…">` | `<tc-task-board {path}>` |

*Also attributes: `compact`, `now` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-tasks-change` | Yes | `el.addEventListener("tc-tasks-change", (e) => …)` | `onTasksChange={…}` | `@tc-tasks-change="…"` | `(tc-tasks-change)="…($event)"` | `el.addEventListener("tc-tasks-change", …)` |

### Controlled

The element changes `tasks` itself unless a listener calls `preventDefault()` on `tc-tasks-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-task-board id="task-board"></tc-task-board>

<script type="module">
  import "@adamstavely/trenchcoat/task-board";

  const el = document.querySelector("#task-board");
  el.addEventListener("tc-tasks-change", (e) => {
    e.preventDefault(); // the element keeps its tasks…
    if (allowed(e.detail.tasks)) el.tasks = e.detail.tasks; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TaskBoard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TaskBoard>;
type Props = Omit<Own, "tasks" | "onTasksChange"> & { initial: NonNullable<Own["tasks"]> };

// Controlled: passing tasks makes the wrapper prevent the element's own change; the app sets it
export function ControlledTaskBoard({ initial, ...props }: Props) {
  const [tasks, setTasks] = useState<Own["tasks"]>(initial);
  return <TaskBoard {...props} tasks={tasks} onTasksChange={(next) => setTasks(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/task-board";
import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";

const props = defineProps<{ initial: TcTaskBoard["tasks"] }>();
const tasks = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTasksChange = (e: CustomEvent<{ tasks: TcTaskBoard["tasks"] }>) => {
  e.preventDefault();
  tasks.value = e.detail.tasks;
};
</script>

<template>
  <tc-task-board :tasks="tasks" @tc-tasks-change="onTasksChange"></tc-task-board>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TaskBoard } from "@adamstavely/trenchcoat/angular/task-board";
import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";

@Component({
  selector: "app-controlled-task-board",
  imports: [TaskBoard],
  template: `<tc-task-board [tasks]="tasks()" (tc-tasks-change)="onTasksChange($event)"></tc-task-board>`,
})
export class ControlledTaskBoard {
  readonly initial = input.required<TcTaskBoard["tasks"]>();
  readonly tasks = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTasksChange(e: CustomEvent<{ tasks: TcTaskBoard["tasks"] }>) {
    e.preventDefault();
    this.tasks.set(e.detail.tasks);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/task-board";
  import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";

  let { initial }: { initial: TcTaskBoard["tasks"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let tasks = $derived(initial);
  let el: TcTaskBoard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      tasks = (e as CustomEvent<{ tasks: TcTaskBoard["tasks"] }>).detail.tasks;
    };
    el.addEventListener("tc-tasks-change", on);
    return () => el.removeEventListener("tc-tasks-change", on);
  });
</script>

<tc-task-board bind:this={el} {tasks}></tc-task-board>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-task-board")` returns a `TcTaskBoard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";`
- **React / Next.js:** Props: `import type { TaskBoardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TaskBoard>`. The element class, for refs: `import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTaskBoard["tasks"]` with `import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";`
- **Angular:** The directive types the template: `[tasks]` takes `TcTaskBoard["tasks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTaskBoard } from "@adamstavely/trenchcoat/task-board";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `tasks` | `Task[]` | The tasks (controlled) – pass `onTasksChange` with it. Leave undefined to start from `defaultTasks` |
| `defaultTasks` | `Task[]` | The tasks to start from when uncontrolled |
| `onTasksChange` | `(tasks: Task[]) => void` | Called with all tasks after every change |
| `statuses` | `TaskStatus[]` | The columns, in order – an icon may be any React node |
| `onChange` | `(tasks: Task[]) => void` | Any change to the tasks (added, edited, moved or deleted) – the same as `onTasksChange`, kept from the block |

*Renamed or hidden on the wrapper: `tasks`, `statuses`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bar's controls, each lane's add button and the cards |
| Enter / Space on a card | Opens it in the panel |
| Escape | Closes the panel; focus returns to the card |
| ↓ / ↑ on the filter | Opens the label menu on its first or last item |
| ↑ / ↓, Home / End in the menu | Moves between labels |
| Escape in the menu | Closes it; focus returns to the filter |
| Enter in a new card's field | Adds the card and focuses it |
| Escape in a new card's field | Cancels; focus returns to the add button |

Dragging is the pointer's way to move a card; the panel's Status choices do the same from the keyboard.

### Screen readers

The board is a region named by its breadcrumb ("Northwind / Web app / Sprint 24"), and the breadcrumb a navigation
landmark with the last step as the current page. The task count is a status message, so searching and filtering
announce "1 task of 11". Each card reads its key and title; priority is in words. The label menu is a menu of
checkbox items; the filter button says how many labels are selected. The panel is a complementary region named "Task
details", inert while closed; its choices are toggle buttons.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, button | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, button, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 36.8 KB | 10.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **57.8 KB** | **15.9 KB** |
| With Lit – the first component on a page | 80.4 KB | 23.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | default properties, 40 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Listens on the page: `window keydown`, `window pointerdown`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep titles short enough for two lines – details belong in your own app's task view.
- Give `dueIn` in whole days: negative is late ("1d late"), 0 is "Today", 1–2 are "soon".
- Status icons are elements – a 14 px SVG ring per status reads well; the React wrapper takes React nodes.

## Do and don't

### Do

- Listen for `tc-tasks-change` and save `tasks`, or control `tasks` and apply the change yourself.
- Give each label a colour with enough contrast as a dot; the name is always shown beside it.

### Don't

- Don't use more than six lanes – the board scrolls sideways beyond that.
- Don't rely on dragging alone in your own instructions – the panel's Status choices move cards too.

## Related

- [Agent Queue](../components/agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume
- [Progress Tracker](../components/progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Coverage Matrix](../components/coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Filter Menu](../components/filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Data Table](../components/data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
