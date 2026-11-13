<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Running Now

**Agents** · New

A live status of agents' background tasks for a header or sidebar – one quiet pill, "3 running · 2 need you", opening a panel of tasks under Needs you, Running and Recently done, each with a filling ring, its agent, elapsed time and Review, Stop or Open

- **Element:** `<tc-running-now>`
- **Size:** 13.0 KB gzip · 41.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/running-now";` |
| React / Next.js | `import { RunningNow } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/running-now";` · tags starting with tc- are custom elements |
| Angular | `import { RunningNow } from "@adamstavely/trenchcoat/angular/running-now";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/running-now";` |

## Example

The live example is in the gallery at `#/running-now`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A live status of the agents' background work for a header or a sidebar. Closed, it's one quiet pill: a small ring
with how far the running tasks are, and "3 running · 2 need you" – the "need you" part in the attention tone, and left
out when nothing waits on the person. When the last task finishes it says "All done" for a moment, then "Nothing
running". Opened, a panel lists the tasks under Needs you, Running and Recently done, each with a ring that fills as it
goes (or turns while the agent can't tell), the task, the agent, how long it has been going, and one action: Review
for a task that needs the person, Stop for a running one, Open for a finished one.

It's about the agents, and above all about which of them is waiting on the person. Background Tasks is for the
person's own jobs – exports, uploads, reindexes – with Cancel, Retry and Clear finished.

With `notifiable`, each task that's running or needing the person gets a bell: “Notify me when Export Q3 revenue finishes”. Pressed, the
element fires `tc-notify` once the page moves that task to done or failed, so the page can send the notice, and the
usual announcement says it finished. `notify` holds the watched tasks. Give `notifyChannels` – “In app”, “Email”,
“Push” – and the bell opens a short list of checkboxes under the task instead; `notifyVia` keeps each task's channels.

### When to use

- An app where agents work in the background and sometimes stop to ask for a decision or an approval.
- A header or sidebar slot that should say, at a glance, whether anything needs the person.
- Getting from "2 need you" to the task that needs them in two clicks.
- People who start long work and want to step away until it's done (`notifiable`).

### When not to use

- The person's own exports, uploads and imports – use [Background Tasks](background-tasks.md).
- A full list of the decisions and questions agents have raised – use [Agent Inbox](agent-inbox.md).
- One agent's steps, cost and controls in detail – use [Agent Monitor](agent-monitor.md).
- Messages about things that already happened – use [Notification Stack](notification-stack.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Pill** `.ui-rnw__pill` – the button: a ring and "3 running · 2 need you"
2. **Ring** `.ui-rnw__ring` – how far the running tasks are, filling or turning
3. **Needs you** `.ui-rnw__need` – the count of tasks waiting on the person, in the attention tone
4. **Group** `.ui-rnw__label` – Needs you, Running or Recently done, with its count
5. **Task** `.ui-rnw__row` – the ring, the task's title, and the agent, progress and elapsed time
6. **Action** `.ui-rnw__act` – Review, Stop or Open
7. **Bell** `.ui-rnw__bell` – notify me when this task finishes (`notifiable`); highlighted while it's on
8. **Channels** `.ui-rnw__channels` – how to be told, with `notifyChannels`

## Looks

Standard is a filled pill with ink rings; Clean is a hairline pill on white, with thinner rings and regular-weight task
titles. The panel uses the menu surface in both, with a plain title row. A page can set `--tc-rnw-ring` for the pill's
ring size.

## Usage

### HTML

```html
<tc-running-now id="agents"></tc-running-now>

<script type="module">
  import "@adamstavely/trenchcoat/running-now";
  import "@adamstavely/trenchcoat/tokens.css";

  const agents = document.querySelector("#agents");
  agents.tasks = [
    { id: "v1", title: "Check vendor records", agent: "Records agent", status: "running", progress: 0.4, started: Date.now() - 360000 },
    { id: "d1", title: "Draft the audit report", agent: "Report agent", status: "needs-you", started: Date.now() - 840000 },
  ];
  agents.addEventListener("tc-task-action", (e) => console.log(e.detail.action, e.detail.id));
</script>
```

### React / Next.js

```tsx
import { RunningNow, type RunningTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function HeaderStatus({ tasks }: { tasks: RunningTask[] }) {
  return (
    <RunningNow
      tasks={tasks}
      onTaskAction={(action, task) => {
        console.log(action, task.id);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/running-now";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";

defineProps<{ tasks: TcRunningNow["tasks"]; labels: TcRunningNow["labels"] }>();
const onTaskAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-running-now :tasks="tasks" :labels="labels" @tc-task-action="onTaskAction"></tc-running-now>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunningNow } from "@adamstavely/trenchcoat/angular/running-now";
import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";

@Component({
  selector: "app-running-now-example",
  imports: [RunningNow],
  template: `<tc-running-now [tasks]="tasks()" [labels]="labels()" (tc-task-action)="onTaskAction($event)"></tc-running-now>`,
})
export class RunningNowExample {
  readonly tasks = input.required<TcRunningNow["tasks"]>();
  readonly labels = input.required<TcRunningNow["labels"]>();
  onTaskAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/running-now";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";

  let { tasks, labels }: { tasks: TcRunningNow["tasks"]; labels: TcRunningNow["labels"] } = $props();
  let el: TcRunningNow;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-task-action", on);
    return () => el.removeEventListener("tc-task-action", on);
  });
</script>

<tc-running-now bind:this={el} {tasks} {labels}></tc-running-now>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tasks` | – | `RunningTask[]` | `[]` | The tasks, in any order – the panel groups them and keeps their order within a group |
| `heading` | `heading` | `string` | `"Running now"` | The panel's title, and the start of the pill's description |
| `open` | `open` | `boolean` | `false` | Whether the panel is open |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; leave it unset and the element keeps its own clock while the panel is open |
| `labels` | – | `Partial<RunningNowLabels>` | `{}` | Words the page can rename, merged over defaultRunningNowLabels |
| `notifiable` | `notifiable` | `boolean` | `false` | Offer "notify me when it's done" on the tasks still going |
| `notify` | – | `string[]` | `[]` | The tasks the person will be told about when they finish |
| `notifyChannels` | – | `string[]` | `[]` | Ways to be told – "In app", "Email", "Push"; given, the bell opens a choice of them |
| `notifyVia` | – | `Record<string, string[]>` | `{}` | The channels chosen for each watched task, with `notifyChannels` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-task-action` | – | Yes | Review, Stop or Open was chosen on a task ({ id, action, task }: RunningTaskAction); cancelable – prevented, the panel stays open |
| `tc-open-change` | – | Yes | The panel is opening or closing ({ open }: RunningNowOpenChange); cancelable – prevented, it stays as it is |
| `tc-notify-change` | – | Yes | The bell or a channel was switched on a task ({ notify, id, on, channels, notifyVia }: RunningNowNotifyChange); cancelable – prevented, nothing changes |
| `tc-notify` | – | No | A watched task finished ({ id, status, task, channels }: RunningNowNotify) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rnw-ring` | `16px` | both |

#### Design tokens it reads (73)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-raised`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `runningTime(ms: number): string` | An elapsed time: 45s · 2m 05s · 1h 05m |

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
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-running-now :tasks="…">` | `<tc-running-now [tasks]="…">` | `<tc-running-now {tasks}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-running-now :labels="…">` | `<tc-running-now [labels]="…">` | `<tc-running-now {labels}>` |
| `notify` | `el.notify = …;` | `<… notify={…} />` | `<tc-running-now :notify="…">` | `<tc-running-now [notify]="…">` | `<tc-running-now {notify}>` |
| `notifyChannels` | `el.notifyChannels = …;` | `<… notifyChannels={…} />` | `<tc-running-now :notifyChannels="…">` | `<tc-running-now [notifyChannels]="…">` | `<tc-running-now {notifyChannels}>` |
| `notifyVia` | `el.notifyVia = …;` | `<… notifyVia={…} />` | `<tc-running-now :notifyVia="…">` | `<tc-running-now [notifyVia]="…">` | `<tc-running-now {notifyVia}>` |

*Also attributes: `heading`, `open`, `now`, `notifiable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-task-action` | Yes | `el.addEventListener("tc-task-action", (e) => …)` | `onTaskAction={…}` | `@tc-task-action="…"` | `(tc-task-action)="…($event)"` | `el.addEventListener("tc-task-action", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-notify-change` | Yes | `el.addEventListener("tc-notify-change", (e) => …)` | `ref.current.addEventListener("tc-notify-change", …)` | `@tc-notify-change="…"` | `(tc-notify-change)="…($event)"` | `el.addEventListener("tc-notify-change", …)` |
| `tc-notify` | No | `el.addEventListener("tc-notify", (e) => …)` | `onNotify={…}` | `@tc-notify="…"` | `(tc-notify)="…($event)"` | `el.addEventListener("tc-notify", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` and `notify` itself unless a listener calls `preventDefault()` on `tc-open-change` or `tc-notify-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-running-now id="running-now"></tc-running-now>

<script type="module">
  import "@adamstavely/trenchcoat/running-now";

  const el = document.querySelector("#running-now");
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
import { RunningNow } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RunningNow>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledRunningNow({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <RunningNow {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/running-now";
import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";

const props = defineProps<{ initial: TcRunningNow["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcRunningNow["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-running-now :open="open" @tc-open-change="onOpenChange"></tc-running-now>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunningNow } from "@adamstavely/trenchcoat/angular/running-now";
import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";

@Component({
  selector: "app-controlled-running-now",
  imports: [RunningNow],
  template: `<tc-running-now [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-running-now>`,
})
export class ControlledRunningNow {
  readonly initial = input.required<TcRunningNow["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcRunningNow["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/running-now";
  import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";

  let { initial }: { initial: TcRunningNow["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcRunningNow;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcRunningNow["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-running-now bind:this={el} {open}></tc-running-now>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-running-now")` returns a `TcRunningNow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";`
- **React / Next.js:** Props: `import type { RunningNowProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunningNow>`. The element class, for refs: `import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunningNow["tasks"]` with `import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";`
- **Angular:** The directive types the template: `[tasks]` takes `TcRunningNow["tasks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunningNow } from "@adamstavely/trenchcoat/running-now";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The panel's title – "Running now" by default |
| `open` | `boolean` | Whether the panel is open. Controlled when defined |
| `defaultOpen` | `boolean` | Whether the panel starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | The panel opened or closed |
| `notify` | `string[]` | The watched tasks (with `notifiable`). Controlled when defined |
| `defaultNotify` | `string[]` | The watched tasks when uncontrolled |
| `notifyVia` | `Record<string, string[]>` | The channels chosen per watched task (with `notifyChannels`). Controlled when defined |
| `defaultNotifyVia` | `Record<string, string[]>` | The channels per task when uncontrolled |
| `onNotifyChange` | `(notify: string[], change: RunningNowNotifyChange) => void` | The bell or a channel was switched – the watched tasks as they are now, and the change |
| `onNotify` | `(task: RunningTask, status: "done" \| "failed", channels?: string[]) => void` | A watched task finished |
| `onTaskAction` | `(action: RunningNowAction, task: RunningTask) => boolean \| void` | Review, Stop or Open was chosen on a task; return false to keep the panel open |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the pill: opens or closes the panel; focus goes to the first task |
| ↓ / ↑ | In the list: the next or previous task |
| Home / End | In the list: the first or last task |
| Tab | From a task to its action (the list is one tab stop) |
| Enter / Space | On a bell: watches the task or stops watching it – or, with channels, opens or closes its list |
| Escape | In a channel list: closes it and returns focus to its bell (the panel stays open) |
| Escape | Closes the panel and returns focus to the pill |

### Screen readers

The pill is a button with `aria-haspopup="dialog"` and `aria-expanded`, named by its words ("2 running, 1 needs you")
and described by the panel's title. The panel is a non-modal `dialog` named by its title; each group is a `group` named
by its label, such as "Needs you 1". A task is named by its title and described by its line – "Records agent · 42% ·
6m 00s". Actions are named with the task: "Review Draft the audit report". A polite status line says a task that
needs the person or finished – "Check vendor records needs you. Classify contracts done" – once the changes have held
for a moment; progress ticks are never announced.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
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
| **This component alone** | 24.6 KB | 8.0 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **41.3 KB** | **13.0 KB** |
| With Lit – the first component on a page | 64.4 KB | 20.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 11 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of tasks replaced |
| First on the page | 8.6 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.4 ms | tasks: first render, 11 nodes; update 0.1 ms |
| 1,000 items | 0.9 ms | tasks: first render, 11 nodes; update 0.1 ms |

What it renders doesn't grow with tasks (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setInterval, cleared`, `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title a task with what the agent is doing to what: "Check vendor records", "Draft the audit report".
- Name the agent in `agent` when there are several, so people know who's asking.
- Set `needs-you` only when the agent can't go on without the person – a decision, an approval, missing access.
- Give `started` (and `ended` once it's done) so the elapsed time is right; pass `now` if your app keeps the clock.
- Leave `progress` out when the agent can't tell; the ring turns instead of pretending.
- Word channels as people know them – “In app”, “Email”, “Push” – and offer only the ones that work for them.

## Do and don't

### Do

- Put it where people look for status – at the end of the app's header, or at the top of a sidebar.
- Take Review straight to the decision the agent needs; prevent the event to keep the panel open instead.
- Drop finished tasks from the list after a while; "Recently done" is for the last few.
- Send the notice when `tc-notify` fires, on the channels in its detail; the element doesn't send anything.

### Don't

- Don't mark every running task as needing the person – the attention tone stops meaning anything.
- Don't use it for the person's own uploads and exports.
- Don't announce progress yourself as well; the element announces what matters.

## Related

- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Agent Monitor](agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop
- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
