<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Process List

**Workspace & sessions** · New

dev servers and background jobs with status, port link, uptime, CPU and memory, and last output, with Stop, Start, Restart and View output.

- **Element:** `<tc-process-list>`
- **Size:** 11.0 KB gzip · 32.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/process-list";` |
| React / Next.js | `import { ProcessList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/process-list";` · tags starting with tc- are custom elements |
| Angular | `import { ProcessList } from "@adamstavely/trenchcoat/angular/process-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/process-list";` |

## Example

The live example is in the gallery at `#/process-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The dev servers and background jobs of a session, as rows: a status mark and word, the name, the command, the port as a
link, how long it has been up, optional CPU and memory meters, and the last line it printed. Each row has Stop or Start,
Restart and View output. A crashed row stands out and says its exit code. Nothing here runs anything: the page passes
plain data, listens for the actions and passes the new statuses.

### When to use

- A side panel listing what a session or an agent has started: dev servers, watchers, workers.
- Anywhere people need to stop, restart or open a long-running process at a glance.

### When not to use

- A process's full output – use [Terminal](terminal.md) or [Sandbox Log](sandbox-log.md), opened from View output.
- One-off tasks that finish, with progress – use [Background Tasks](background-tasks.md).
- Jobs that run on a schedule – use [Scheduled Runs](scheduled-runs.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-rproc__row` – one process, with its `data-status`
2. **Main** `.ui-rproc__main` – the pressable part: name, status, uptime, command and last line; it selects the row
3. **Status** `.ui-rproc__status` – a mark and a word, with the exit code for a crash
4. **Uptime** `.ui-rproc__up` – how long a live process has been running
5. **Command** `.ui-rproc__cmd` – what started it, in mono
6. **Last line** `.ui-rproc__last` – the last thing it printed, escape codes dropped
7. **Port** `.ui-rproc__port` – `localhost:5173`, which fires `tc-open`. A `url` that isn't a safe link is ignored, so a
8. **Meters** `.ui-rproc__meters` – CPU and memory, when given
9. **Buttons** `.ui-rproc__act` – Stop or Start, Restart and View output
10. **Count** `.ui-rproc__count` – how many are running, beside Stop all in the header

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-rproc-meter`, the CPU meter's width.

Below about 34rem the meters hide and the buttons show only their icons; below about 26rem the command hides too and
the buttons move under the name.

## Usage

### HTML

```html
<tc-process-list id="procs" description="~/institute/sample-tracker"></tc-process-list>

<script type="module">
  import "@adamstavely/trenchcoat/process-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#procs");
  el.processes = [
    { id: "web", name: "web", command: "vite --port 5173", status: "running", port: 5173, started: Date.now() - 60000 },
    { id: "docs", name: "docs", status: "crashed", exitCode: 1, lastLine: "Cannot find module" },
  ];
  el.addEventListener("tc-stop", (e) => console.log("stop", e.detail.id));
  el.addEventListener("tc-open", (e) => window.open(e.detail.url, "_blank", "noopener"));
</script>
```

### React / Next.js

```tsx
import { ProcessList, type ProcessItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const processes: ProcessItem[] = [
  { id: "web", name: "web", command: "vite --port 5173", status: "running", port: 5173 },
  { id: "api", name: "api", command: "node server.mjs", status: "stopped" },
];

export function Processes({ onStop }: { onStop: (id: string) => void }) {
  return <ProcessList processes={processes} defaultSelected="web" onTcStop={(e) => onStop(e.detail.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/process-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";

defineProps<{ processes: TcProcessList["processes"]; actions: TcProcessList["actions"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-process-list :processes="processes" :actions="actions" @tc-selected-change="onSelectedChange"></tc-process-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProcessList } from "@adamstavely/trenchcoat/angular/process-list";
import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";

@Component({
  selector: "app-process-list-example",
  imports: [ProcessList],
  template: `<tc-process-list [processes]="processes()" [actions]="actions()" (tc-selected-change)="onSelectedChange($event)"></tc-process-list>`,
})
export class ProcessListExample {
  readonly processes = input.required<TcProcessList["processes"]>();
  readonly actions = input.required<TcProcessList["actions"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/process-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";

  let { processes, actions }: { processes: TcProcessList["processes"]; actions: TcProcessList["actions"] } = $props();
  let el: TcProcessList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-process-list bind:this={el} {processes} {actions}></tc-process-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Processes"` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `processes` | – | `ProcessItem[]` | `[]` | The processes, in order |
| `selected` | `selected` | `string \| null` | `null` | The selected row's id. Changed by pressing a row unless a tc-selected-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The time uptime is counted to, in epoch ms; unset, the element keeps its own clock |
| `actions` | – | `ProcessListAction[]` | `[]` | Buttons in the header, beside Stop all |
| `labels` | – | `Partial<ProcessListLabels>` | `{}` | Rename any of the words, over the defaults |
| `maxHeight` | `max-height` | `number` | `0` | The list's tallest height in px before it scrolls; 0 for no limit |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A row was pressed ({ selected, process }: ProcessSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-open` | – | No | A port link was pressed ({ id, process, url }: ProcessOpen) |
| `tc-stop` | – | Yes | Stop was pressed ({ id, process }: ProcessEvent); cancelable |
| `tc-start` | – | Yes | Start was pressed ({ id, process }: ProcessEvent); cancelable |
| `tc-restart` | – | Yes | Restart was pressed ({ id, process }: ProcessEvent); cancelable |
| `tc-logs` | – | No | View output was pressed ({ id, process }: ProcessEvent) |
| `tc-stop-all` | – | Yes | Stop all was pressed (detail: null); cancelable |
| `tc-create` | – | No | Start a command was pressed in the empty list (detail: null) |
| `tc-action` | – | No | A header action was pressed ({ id }: ProcessListActionEvent) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rproc-meter` | `var(--tc-space-10)` | both |

#### Design tokens it reads (51)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-reveal-slow`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultProcessListLabels: ProcessListLabels` | The words used when the page gives none |
| `formatUptime(ms: number): void` | "12s", "4m", "2h 5m", "3d 4h" |

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
| `processes` | `el.processes = …;` | `<… processes={…} />` | `<tc-process-list :processes="…">` | `<tc-process-list [processes]="…">` | `<tc-process-list {processes}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-process-list :actions="…">` | `<tc-process-list [actions]="…">` | `<tc-process-list {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-process-list :labels="…">` | `<tc-process-list [labels]="…">` | `<tc-process-list {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `now`, `max-height`, `bare`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-stop` | Yes | `el.addEventListener("tc-stop", (e) => …)` | `onTcStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |
| `tc-start` | Yes | `el.addEventListener("tc-start", (e) => …)` | `onTcStart={…}` | `@tc-start="…"` | `(tc-start)="…($event)"` | `el.addEventListener("tc-start", …)` |
| `tc-restart` | Yes | `el.addEventListener("tc-restart", (e) => …)` | `onTcRestart={…}` | `@tc-restart="…"` | `(tc-restart)="…($event)"` | `el.addEventListener("tc-restart", …)` |
| `tc-logs` | No | `el.addEventListener("tc-logs", (e) => …)` | `onTcLogs={…}` | `@tc-logs="…"` | `(tc-logs)="…($event)"` | `el.addEventListener("tc-logs", …)` |
| `tc-stop-all` | Yes | `el.addEventListener("tc-stop-all", (e) => …)` | `onTcStopAll={…}` | `@tc-stop-all="…"` | `(tc-stop-all)="…($event)"` | `el.addEventListener("tc-stop-all", …)` |
| `tc-create` | No | `el.addEventListener("tc-create", (e) => …)` | `onTcCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-process-list id="process-list"></tc-process-list>

<script type="module">
  import "@adamstavely/trenchcoat/process-list";

  const el = document.querySelector("#process-list");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/process-list";
import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";

const props = defineProps<{ initial: TcProcessList["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcProcessList["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-process-list :selected="selected" @tc-selected-change="onSelectedChange"></tc-process-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ProcessList } from "@adamstavely/trenchcoat/angular/process-list";
import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";

@Component({
  selector: "app-controlled-process-list",
  imports: [ProcessList],
  template: `<tc-process-list [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-process-list>`,
})
export class ControlledProcessList {
  readonly initial = input.required<TcProcessList["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcProcessList["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/process-list";
  import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";

  let { initial }: { initial: TcProcessList["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcProcessList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcProcessList["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-process-list bind:this={el} {selected}></tc-process-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-process-list")` returns a `TcProcessList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";`
- **React / Next.js:** Props: `import type { ProcessListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProcessList>`. The element class, for refs: `import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProcessList["processes"]` with `import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";`
- **Angular:** The directive types the template: `[processes]` takes `TcProcessList["processes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProcessList } from "@adamstavely/trenchcoat/process-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `selected` | `string \| null` | The selected row's id – controlled when given |
| `defaultSelected` | `string \| null` | The selected row at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, process: ProcessItem \| null) => void` | A row was pressed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the row above or below, at the same button |
| ← / → | Moves between a row's buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Presses the button: selects the row, opens the port or acts |

### Screen readers

The rows are a list named by the heading. The selected row's main button has `aria-current="true"`. Each status is a
word as well as a colour and a mark. Buttons are named with their process, such as "Stop web", even when only their
icons show. Stop, Start, Restart and Stop all are announced through a polite status.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.5 KB | 7.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/ansi` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **32.9 KB** | **11.1 KB** |
| With Lit – the first component on a page | 55.5 KB | 18.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 153 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of processes replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | processes: first render, 3,441 nodes; update 3.3 ms |
| 1,000 items | 152 ms | processes: first render, 34,266 nodes; update 24 ms |

1,000 items of processes: 152 ms. It renders every item, so a first render passes 50 ms (a long task) at about 330 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name processes the way people talk about them: "web", "api", "tests".
- Give `command` as typed, and keep `lastLine` to one line.
- Pass `started` and let the element count the uptime; pass `now` to keep it still, as in a screenshot.

## Do and don't

### Do

- Change `status` as the process changes: "starting" right after Start or Restart, then "running".
- Pass `exitCode` with "crashed" and "exited", so people can tell a crash from a clean exit.
- Open the port in a `preview-frame` beside the list.

### Don't

- Don't show secrets from a command line; the command is in the page and its tooltip.
- Don't rely on the element's own clock for many rows on a busy page: pass `now` from one clock instead.

## Related

- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
