<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Scheduled Runs

**Agents** · New

Agent tasks placed into a week's sessions under usage limits – pinned first, big tasks split into linked parts, small ones filling gaps, and an Unscheduled list

- **Element:** `<tc-scheduled-runs>`
- **Size:** 16.0 KB gzip · 62.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/scheduled-runs";` |
| React / Next.js | `import { ScheduledRuns } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/scheduled-runs";` · tags starting with tc- are custom elements |
| Angular | `import { ScheduledRuns } from "@adamstavely/trenchcoat/angular/scheduled-runs";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/scheduled-runs";` |

## Example

The live example is in the gallery at `#/scheduled-runs`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Agent tasks placed into a week's sessions under usage limits. Pinned tasks go first, big tasks split across sessions as linked parts, small tasks fill the gaps, and what can't fit waits in a To schedule column. Sessions lay out as a calendar by day and time. In Manual you move tasks by dragging or with a list, and Auto plans them.

### When to use

- Agent work that has to share a limited weekly allowance.
- Showing what will run when, and letting someone move it.

### When not to use

- Setting when one job runs – use [Trigger Builder](trigger-builder.md) or [Routine Form](routine-form.md).
- Work running right now – use [Agent Queue](agent-queue.md).
- Overall spend – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Session** `.ui-sdr__session` – its name, `.ui-sdr__day`, `.ui-sdr__meter` and `.ui-sdr__usage`
2. **Task** `.ui-sdr__task` – its name, cost and `.ui-sdr__part`
3. **Move** `.ui-sdr__move` – which session it's in
4. **To schedule** `.ui-sdr__waiting` – what doesn't fit
5. **Mode** `.ui-sdr__mode` – Auto or Manual, with `.ui-sdr__auto-note` saying why moving is off
6. **Share** `.ui-sdr__share` – how much of the session's limit the task uses, with `.ui-sdr__stats`
7. **Grip** `.ui-sdr__grip` – where a finger drags from
8. **Now** `.ui-sdr__now` – a line in the session happening now
9. **Refusal** `.ui-sdr__refusal` – why a drop wasn't allowed

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. With `layout="calendar"` days are columns and times are rows, and `layout="cards"` lets sessions wrap. Both stack on a narrow page. A calendar with no days or times falls back to cards.

## Usage

### HTML

```html
<tc-scheduled-runs id="runs"></tc-scheduled-runs>

<script type="module">
  import "@adamstavely/trenchcoat/scheduled-runs";
  import "@adamstavely/trenchcoat/tokens.css";

  const runs = document.querySelector("#runs");
  runs.sessions = [{ id: "mon", label: "Morning", day: "Monday", time: "07:00", limit: 100 }];
  runs.tasks = [{ id: "reindex", name: "Reindex the archive", cost: 40 }];
</script>
```

### React / Next.js

```tsx
import { ScheduledRuns, type ScheduledSession, type ScheduledTask } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sessions: ScheduledSession[] = [{ id: "mon", label: "Session 1", limit: 100 }];
const tasks: ScheduledTask[] = [{ id: "reindex", name: "Reindex the archive", cost: 40 }];

export function Runs() {
  return <ScheduledRuns sessions={sessions} tasks={tasks} onPlacementsChange={(p) => console.log(p)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/scheduled-runs";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";

defineProps<{ sessions: TcScheduledRuns["sessions"]; tasks: TcScheduledRuns["tasks"] }>();
const onPlacementsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-scheduled-runs :sessions="sessions" :tasks="tasks" @tc-placements-change="onPlacementsChange"></tc-scheduled-runs>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ScheduledRuns } from "@adamstavely/trenchcoat/angular/scheduled-runs";
import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";

@Component({
  selector: "app-scheduled-runs-example",
  imports: [ScheduledRuns],
  template: `<tc-scheduled-runs [sessions]="sessions()" [tasks]="tasks()" (tc-placements-change)="onPlacementsChange($event)"></tc-scheduled-runs>`,
})
export class ScheduledRunsExample {
  readonly sessions = input.required<TcScheduledRuns["sessions"]>();
  readonly tasks = input.required<TcScheduledRuns["tasks"]>();
  onPlacementsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/scheduled-runs";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";

  let { sessions, tasks }: { sessions: TcScheduledRuns["sessions"]; tasks: TcScheduledRuns["tasks"] } = $props();
  let el: TcScheduledRuns;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-placements-change", on);
    return () => el.removeEventListener("tc-placements-change", on);
  });
</script>

<tc-scheduled-runs bind:this={el} {sessions} {tasks}></tc-scheduled-runs>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Scheduled runs"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `sessions` | – | `ScheduledSession[]` | `[]` | The week's sessions, in order |
| `tasks` | – | `ScheduledTask[]` | `[]` | The tasks to place |
| `placements` | – | `ScheduledPlacement[] \| undefined` | `undefined` | Where each task goes; unset, planRuns() decides. Changed by the user unless a tc-placements-change listener calls preventDefault() |
| `layout` | `layout` | `ScheduledRunsLayout` | `"calendar"` | "calendar" lays sessions out by day and time beside To schedule; "cards" lets them wrap |
| `mode` | `mode` | `ScheduledRunsMode` | `"manual"` | "manual" lets tasks move; "auto" plans them. Changed by the user unless a tc-mode-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The current time, epoch ms, for the Now line. Unset, there's no line |
| `unit` | `unit` | `string` | `"credits"` | What the numbers count |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers |
| `labels` | – | `Partial<ScheduledRunsLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-placements-change` | – | Yes | A task was moved, or Auto redid the plan ({ placements, task }: ScheduledPlacementsChange); cancelable – prevented, `placements` stays as it was |
| `tc-mode-change` | – | Yes | Auto or Manual was picked ({ mode }: ScheduledModeChange); cancelable – prevented, `mode` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sdr-bg` | `var(--tc-surface-on-tray)` | both, standard |
| `--tc-meter-h-sm` | `var(--tc-space-1-5)` | not set – this fallback applies |

#### Design tokens it reads (50)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-menu-bg`, `--tc-menu-shadow`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-radius-full`, `--tc-sdr-column`, `--tc-sdr-columns`, `--tc-sdr-row`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `planRuns(sessions: ScheduledSession[], tasks: ScheduledTask[]): ScheduledPlacement[]` | Places tasks in sessions: pinned first, then by priority and size. Splits what no one session can hold; never overfills |
| `movePlacement(placements: ScheduledPlacement[], placement: ScheduledPlacement, session: string \| null): ScheduledPlacement[]` | Moves one placement to a session (or null); a part joining another part of its task merges with it, and parts renumber |

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
| `sessions` | `el.sessions = …;` | `<… sessions={…} />` | `<tc-scheduled-runs :sessions="…">` | `<tc-scheduled-runs [sessions]="…">` | `<tc-scheduled-runs {sessions}>` |
| `tasks` | `el.tasks = …;` | `<… tasks={…} />` | `<tc-scheduled-runs :tasks="…">` | `<tc-scheduled-runs [tasks]="…">` | `<tc-scheduled-runs {tasks}>` |
| `placements` | `el.placements = …;` | `<… placements={…} />` | `<tc-scheduled-runs :placements="…">` | `<tc-scheduled-runs [placements]="…">` | `<tc-scheduled-runs {placements}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-scheduled-runs :labels="…">` | `<tc-scheduled-runs [labels]="…">` | `<tc-scheduled-runs {labels}>` |

*Also attributes: `heading`, `description`, `layout`, `mode`, `now`, `unit`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-placements-change` | Yes | `el.addEventListener("tc-placements-change", (e) => …)` | `onPlacementsChange={…}` | `@tc-placements-change="…"` | `(tc-placements-change)="…($event)"` | `el.addEventListener("tc-placements-change", …)` |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `ref.current.addEventListener("tc-mode-change", …)` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `placements` and `mode` itself unless a listener calls `preventDefault()` on `tc-placements-change` or `tc-mode-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-scheduled-runs id="scheduled-runs"></tc-scheduled-runs>

<script type="module">
  import "@adamstavely/trenchcoat/scheduled-runs";

  const el = document.querySelector("#scheduled-runs");
  el.addEventListener("tc-placements-change", (e) => {
    e.preventDefault(); // the element keeps its placements…
    if (allowed(e.detail.placements)) el.placements = e.detail.placements; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ScheduledRuns } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ScheduledRuns>;
type Props = Omit<Own, "placements" | "onPlacementsChange"> & { initial: NonNullable<Own["placements"]> };

// Controlled: passing placements makes the wrapper prevent the element's own change; the app sets it
export function ControlledScheduledRuns({ initial, ...props }: Props) {
  const [placements, setPlacements] = useState<Own["placements"]>(initial);
  return <ScheduledRuns {...props} placements={placements} onPlacementsChange={(next) => setPlacements(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/scheduled-runs";
import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";

const props = defineProps<{ initial: TcScheduledRuns["placements"] }>();
const placements = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPlacementsChange = (e: CustomEvent<{ placements: TcScheduledRuns["placements"] }>) => {
  e.preventDefault();
  placements.value = e.detail.placements;
};
</script>

<template>
  <tc-scheduled-runs :placements="placements" @tc-placements-change="onPlacementsChange"></tc-scheduled-runs>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ScheduledRuns } from "@adamstavely/trenchcoat/angular/scheduled-runs";
import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";

@Component({
  selector: "app-controlled-scheduled-runs",
  imports: [ScheduledRuns],
  template: `<tc-scheduled-runs [placements]="placements()" (tc-placements-change)="onPlacementsChange($event)"></tc-scheduled-runs>`,
})
export class ControlledScheduledRuns {
  readonly initial = input.required<TcScheduledRuns["placements"]>();
  readonly placements = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPlacementsChange(e: CustomEvent<{ placements: TcScheduledRuns["placements"] }>) {
    e.preventDefault();
    this.placements.set(e.detail.placements);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/scheduled-runs";
  import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";

  let { initial }: { initial: TcScheduledRuns["placements"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let placements = $derived(initial);
  let el: TcScheduledRuns;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      placements = (e as CustomEvent<{ placements: TcScheduledRuns["placements"] }>).detail.placements;
    };
    el.addEventListener("tc-placements-change", on);
    return () => el.removeEventListener("tc-placements-change", on);
  });
</script>

<tc-scheduled-runs bind:this={el} {placements}></tc-scheduled-runs>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-scheduled-runs")` returns a `TcScheduledRuns` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";`
- **React / Next.js:** Props: `import type { ScheduledRunsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ScheduledRuns>`. The element class, for refs: `import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcScheduledRuns["sessions"]` with `import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";`
- **Angular:** The directive types the template: `[sessions]` takes `TcScheduledRuns["sessions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcScheduledRuns } from "@adamstavely/trenchcoat/scheduled-runs";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Scheduled runs" |
| `placements` | `ScheduledPlacement[]` | Where each task goes – controlled when given |
| `defaultPlacements` | `ScheduledPlacement[]` | Where each task goes on mount when `placements` isn't controlled; by default `planRuns` decides |
| `onPlacementsChange` | `(placements: ScheduledPlacement[], detail: ScheduledPlacementsChange) => void` | A task was moved |
| `mode` | `ScheduledRunsMode` | "auto" or "manual" – controlled when given |
| `defaultMode` | `ScheduledRunsMode` | The mode on mount when `mode` isn't controlled; by default "manual" |
| `onModeChange` | `(mode: ScheduledRunsMode) => void` | Auto or Manual was picked |

*Renamed or hidden on the wrapper: `heading`, `placements`, `mode`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each task's Move to list |
| ↑ ↓ | Choose a session in the list |
| ← → in the mode | Switch between Auto and Manual |
| Escape while dragging | Cancels the drag |

Dragging is a pointer shortcut. Every move can also be made with the list.

### Screen readers

Each session is a section named by its heading, and its meter is `role="progressbar"` with what's used in words. Each list is named for its task and part. `role="status"` announces moves and refused drops, and the same reason shows on screen. The day and time are part of each session's name, the mode is a labelled segmented control, and shares are numbers in words. The Now line says Now.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.4 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 22.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **62.7 KB** | **16.0 KB** |
| With Lit – the first component on a page | 85.8 KB | 23.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.2 ms** | the gallery demo's data, 219 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of tasks replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 26 ms | tasks: first render, 2,301 nodes; update 4.2 ms |
| 1,000 items | 166 ms | tasks: first render, 21,561 nodes; update 63 ms |

1,000 items of tasks: 166 ms. It renders every item, so a first render passes 50 ms (a long task) at about 300 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window selectstart`, `window pointermove`, `window pointerup`, `window pointercancel`, `window keydown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Name tasks by what they do. `planRuns` is exported, so the server can plan the same way, and `movePlacement` applies a move. Moves within the element can't overfill a session, because sessions without room are disabled in the list and refuse a drop. Give `start`, `end` and `now` to show the Now line: the element never reads the clock. Give `icon` as your own element, and avoid third-party logos.

## Do and don't

### Do

- Save on `tc-placements-change`, and call `preventDefault()` if the move is refused. Its `task` is null when Auto redid the plan.
- Use `pinned` only when a task really has to run then, because a pinned task that doesn't fit becomes unscheduled.

### Don't

- Don't treat this as the scheduler. It shows and edits a plan, and your system runs it and enforces the limits.

## Related

- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Agent Queue](agent-queue.md) – The work waiting for your agents, and how fast it moves – jobs drop into a live queue, glide into free worker slots as growing bars and land in Done or Failed, while a depth chart shows the backlog build up when a rate limit pauses the workers and drain when they resume

## Changelog

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`), **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`): where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents, what a group of agents found, and one agent at work.
