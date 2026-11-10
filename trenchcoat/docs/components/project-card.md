<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Project Card

**Data & charts**

A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover

- **Element:** `<tc-project-card>`
- **Size:** 11.4 KB gzip · 43.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/project-card";` |
| React / Next.js | `import { ProjectCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/project-card";` · tags starting with tc- are custom elements |
| Angular | `import { ProjectCard } from "@adamstavely/trenchcoat/angular/project-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/project-card";` |

## Example

The live example is in the gallery at `#/project-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A project in two lines – its name, a progress ring, the status and the due date – that unfolds when people point at
it or open it. The ring is cut into one segment per subtask, so progress reads as “3 of 6” at a glance. Open, it lists
the subtasks to tick off, lets people change the status in place, and filters the list to one person's subtasks
when their avatar is hovered or pressed. A line under the card always says what's under the pointer: who a subtask
is assigned to, how far a person has got, or how many are left.

### When to use

- A board or dashboard of projects, where each needs to stay small until someone looks closer.
- Projects with a handful of subtasks (three to about ten) and a few people on them.
- Changing a project's status or ticking a subtask without opening the project page.

### When not to use

- An onboarding checklist for one person – use [Progress Tracker](progress-tracker.md) or [Setup Guide](setup-guide.md).
- An A/B test or other experiment – use [Experiment Card](experiment-card.md).
- Work being done by agents – use [Agent Inbox](agent-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Progress ring** `.ui-pc__progress` – one segment per subtask, the done count in the middle
2. **Status** `.ui-pc__status` – the current status; opens the picker
3. **People** `.ui-pc__people` – avatars that filter the subtasks to one person's
4. **Subtasks** `.ui-pc__tasks` – each one a row to tick off, with its assignee's avatar
5. **Tray** `.ui-pc__foot` – what's under the pointer, and the action button

## Looks

Standard sets the white card on a gray tray, with the line and the action as a text link on the tray below. Clean
keeps everything in one white card – the line becomes its last row, the action a dark button – with blue ticks and
colour dots instead of icons in the status picker. Both open on hover, tick from the rows or the ring and filter by
person the same way.

## Usage

### HTML

```html
<tc-project-card id="project" heading="Onboarding revamp" due="Nov 14" status="progress" action-label="Open project"></tc-project-card>

<script type="module">
  import "@adamstavely/trenchcoat/project-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#project");
  card.members = [{ name: "Maya Chen" }, { name: "Jonas Weber" }];
  card.tasks = [
    { id: "t1", label: "Design empty states", done: true, assignee: "Maya Chen" },
    { id: "t2", label: "Build progress tracker", assignee: "Jonas Weber" },
  ];
  card.addEventListener("tc-tasks-change", (e) => console.log(e.detail.tasks));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ProjectCard, type ProjectTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const members = [{ name: "Maya Chen" }, { name: "Jonas Weber" }];

export function Onboarding({ initial }: { initial: ProjectTask[] }) {
  const [tasks, setTasks] = useState(initial);
  const [status, setStatus] = useState("progress");
  return (
    <ProjectCard
      title="Onboarding revamp"
      tasks={tasks}
      onTasksChange={setTasks}
      status={status}
      onStatusChange={setStatus}
      due="Nov 14"
      members={members}
      action={{ label: "Open project", onClick: () => console.log("open") }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/project-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";

defineProps<{ tasks: TcProjectCard["tasks"]; statuses: TcProjectCard["statuses"] }>();
const onTasksChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-project-card :tasks="tasks" :statuses="statuses" @tc-tasks-change="onTasksChange"></tc-project-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProjectCard } from "@adamstavely/trenchcoat/angular/project-card";
import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";

@Component({
  selector: "app-project-card-example",
  imports: [ProjectCard],
  template: `<tc-project-card [tasks]="tasks()" [statuses]="statuses()" (tc-tasks-change)="onTasksChange($event)"></tc-project-card>`,
})
export class ProjectCardExample {
  readonly tasks = input.required<TcProjectCard["tasks"]>();
  readonly statuses = input.required<TcProjectCard["statuses"]>();
  onTasksChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/project-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";

  let { tasks, statuses }: { tasks: TcProjectCard["tasks"]; statuses: TcProjectCard["statuses"] } = $props();
  let el: TcProjectCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-tasks-change", on);
    return () => el.removeEventListener("tc-tasks-change", on);
  });
</script>

<tc-project-card bind:this={el} {tasks} {statuses}></tc-project-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The project's name |
| `tasks` | – | `ProjectTask[]` | `[]` | Subtasks – one ring segment and one row each |
| `statuses` | – | `ProjectOption[]` | `[ { id: "todo", label: "To do", tone: "violet" }, { id: "progress", label: "In progress", tone: "amber" }, { id: "review", label: "In review", tone: "blue" }, { id: "done", label: "Done", tone: "green" }, ]` | Options of the status picker |
| `status` | `status` | `string \| undefined` | `undefined` | The chosen status id – unset is the first option |
| `due` | `due` | `string` | `""` | Ready-to-show due date, e.g. "Oct 24" |
| `members` | – | `ProjectMember[]` | `[]` | The people on the project – avatars in the head that filter the subtasks to theirs |
| `actionLabel` | `action-label` | `string` | `""` | A button on the tray of the open card (Clean: in its last row); it fires tc-action |
| `hint` | – | `string \| Element \| undefined` | `undefined` | Replaces the line on the tray while nothing is hovered: text, or an element (cloned) |
| `trigger` | `trigger` | `"hover" \| "click"` | `"hover"` | "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click |
| `open` | `open` | `boolean` | `false` | Whether the card is unfolded, showing the subtasks, the people filter and the tray |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-tasks-change` | – | Yes | A subtask was ticked or unticked; detail `{ tasks: ProjectTask[] }`. Cancelable. |
| `tc-status-change` | – | Yes | Another status was chosen; detail `{ status: string }`. Cancelable. |
| `tc-open-change` | – | Yes | The card opens or closes; detail `{ open: boolean }`. Cancelable. |
| `tc-action` | – | No | The action button (`actionLabel`) was pressed; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-project-card-track` | `light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))` | clean |
| `--tc-project-card-track-hover` | `light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.26))` | clean |

#### Design tokens it reads (100)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-sm`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-project-card-avatar-bg`, `--tc-project-card-avatar-fg`, `--tc-project-card-hue`, `--tc-project-card-tag-bg`, `--tc-project-card-tag-fg`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-surface-inverse`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-project-card :tasks="…">` | `<tc-project-card [tasks]="…">` | `<tc-project-card {tasks}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-project-card :statuses="…">` | `<tc-project-card [statuses]="…">` | `<tc-project-card {statuses}>` |
| `members` | `el.members = …;` | `<… members={…} />` | `<tc-project-card :members="…">` | `<tc-project-card [members]="…">` | `<tc-project-card {members}>` |
| `hint` | `el.hint = …;` | `<… hint={…} />` | `<tc-project-card :hint="…">` | `<tc-project-card [hint]="…">` | `<tc-project-card {hint}>` |

*Also attributes: `heading`, `status`, `due`, `action-label`, `trigger`, `open` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-tasks-change` | Yes | `el.addEventListener("tc-tasks-change", (e) => …)` | `onTasksChange={…}` | `@tc-tasks-change="…"` | `(tc-tasks-change)="…($event)"` | `el.addEventListener("tc-tasks-change", …)` |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onClick={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `tasks`, `status` and `open` itself unless a listener calls `preventDefault()` on `tc-tasks-change`, `tc-status-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-project-card id="project-card"></tc-project-card>

<script type="module">
  import "@adamstavely/trenchcoat/project-card";

  const el = document.querySelector("#project-card");
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
import { ProjectCard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ProjectCard>;
type Props = Omit<Own, "tasks" | "onTasksChange"> & { initial: NonNullable<Own["tasks"]> };

// Controlled: passing tasks makes the wrapper prevent the element's own change; the app sets it
export function ControlledProjectCard({ initial, ...props }: Props) {
  const [tasks, setTasks] = useState<Own["tasks"]>(initial);
  return <ProjectCard {...props} tasks={tasks} onTasksChange={(next) => setTasks(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/project-card";
import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";

const props = defineProps<{ initial: TcProjectCard["tasks"] }>();
const tasks = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTasksChange = (e: CustomEvent<{ tasks: TcProjectCard["tasks"] }>) => {
  e.preventDefault();
  tasks.value = e.detail.tasks;
};
</script>

<template>
  <tc-project-card :tasks="tasks" @tc-tasks-change="onTasksChange"></tc-project-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ProjectCard } from "@adamstavely/trenchcoat/angular/project-card";
import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";

@Component({
  selector: "app-controlled-project-card",
  imports: [ProjectCard],
  template: `<tc-project-card [tasks]="tasks()" (tc-tasks-change)="onTasksChange($event)"></tc-project-card>`,
})
export class ControlledProjectCard {
  readonly initial = input.required<TcProjectCard["tasks"]>();
  readonly tasks = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTasksChange(e: CustomEvent<{ tasks: TcProjectCard["tasks"] }>) {
    e.preventDefault();
    this.tasks.set(e.detail.tasks);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/project-card";
  import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";

  let { initial }: { initial: TcProjectCard["tasks"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let tasks = $derived(initial);
  let el: TcProjectCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      tasks = (e as CustomEvent<{ tasks: TcProjectCard["tasks"] }>).detail.tasks;
    };
    el.addEventListener("tc-tasks-change", on);
    return () => el.removeEventListener("tc-tasks-change", on);
  });
</script>

<tc-project-card bind:this={el} {tasks}></tc-project-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-project-card")` returns a `TcProjectCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";`
- **React / Next.js:** Props: `import type { ProjectCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProjectCard>`. The element class, for refs: `import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProjectCard["tasks"]` with `import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";`
- **Angular:** The directive types the template: `[tasks]` takes `TcProjectCard["tasks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProjectCard } from "@adamstavely/trenchcoat/project-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The project's name |
| `tasks` | `ProjectTask[]` | Subtasks – one ring segment and one row each (controlled): ticks are only reported through `onTasksChange`, so pass the new list back. Use `defaultTasks` to let the card keep the ticks itself |
| `defaultTasks` | `ProjectTask[]` | Starting subtasks when `tasks` isn't controlled |
| `onTasksChange` | `(tasks: ProjectTask[]) => void` | Called with the full list after a subtask was ticked or unticked |
| `statuses` | `ProjectOption[]` | Options of the status picker |
| `status` | `string` | The chosen status id (controlled) |
| `defaultStatus` | `string` | Starting status id when `status` isn't controlled – defaults to the first option |
| `onStatusChange` | `(id: string) => void` | Called with the id of the status picked |
| `action` | `{ label: string; onClick: () => void }` | A button on the tray of the open card (Clean: in its last row), e.g. { label: "Open", onClick } |
| `hint` | `React.ReactNode` | Replaces the line on the tray (Clean: in the last row) while nothing is hovered |
| `open` | `boolean` | Controlled open state |
| `defaultOpen` | `boolean` | Whether the card starts unfolded when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | Called when the card opens or closes |

*Renamed or hidden on the wrapper: `heading`, `tasks`, `statuses`, `status`, `open`, `hint`, `actionLabel`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the head: opens or closes the card. On a subtask: ticks or unticks it. On a person: keeps the list filtered to them, or stops |
| Enter / Space | On the status: opens or closes the status picker |
| ← → ↑ ↓ | In the status picker: picks the previous or next status, wrapping |
| Home / End | In the status picker: picks the first or last status |
| Escape | Closes the status picker onto the status; then closes the card onto the head |
| Tab | Moves through the head, and with the card open, the status, people, subtasks and action |

### Screen readers

The head is a button with `aria-expanded` that reads the whole summary: “Onboarding revamp: 3 of 6 done, In
progress, due Nov 14”. The status is a button with `aria-expanded`; the picker is a radio group named “Status” with
one tab stop. Subtasks are checkboxes with `aria-checked`. Each person is a toggle button with `aria-pressed`, named
“Only Maya Chen's subtasks”. The ring and avatars are hidden, and the line under the card isn't a live region – it
repeats what's on screen. While closed, everything but the head is inert.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 35.7 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **43.8 KB** | **11.5 KB** |
| With Lit – the first component on a page | 64.8 KB | 18.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 109 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of tasks replaced |
| First on the page | 9.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.6 ms | tasks: first render, 955 nodes; update 0.8 ms |
| 1,000 items | 37 ms | tasks: first render, 9,055 nodes; update 6.0 ms |

1,000 items of tasks: 37 ms, 9,055 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the project as people know it: “Onboarding revamp”.
- Write subtasks as short actions: “Design empty states”, not “Empty states design work”.
- Give `due` ready to read – “Nov 14” – the card adds “Due”.
- Keep statuses to four or five, each with a tone that matches its meaning: green for done, red for blocked.
- Label the action with where it goes: “Open project”.

## Do and don't

### Do

- Set an `assignee` on each subtask that matches a member's `name`, so the people filter and avatars work.
- Pass the list from `tc-tasks-change` back, and move the status to Done when every subtask is ticked if that's
  your rule – the card doesn't do it for you.
- Use `trigger="click"` where cards sit close together and hovering would open them by accident.

### Don't

- Don't give a project more than about ten subtasks – the ring segments get too thin to point at.
- Don't put long descriptions in subtask labels; they're cut to one line.
- Don't use the action for something destructive – it's one press on a card that opens on hover.

## Related

- [Experiment Card](experiment-card.md) – An A/B test in two lines that quietly unfolds on hover – variants linked to a tiny chart, a metric switch with rolling numbers, and a winner you pick with a click
- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
