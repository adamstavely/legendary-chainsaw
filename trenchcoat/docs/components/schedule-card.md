<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Schedule Card

**Agents** · New

A recurring agent task at a glance – the schedule in words, a live countdown to the next run, the last runs as marks in words with when and how long, and Run now, Pause / Resume and Edit

- **Element:** `<tc-schedule-card>`
- **Size:** 8.4 KB gzip · 25.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/schedule-card";` |
| React / Next.js | `import { ScheduleCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/schedule-card";` · tags starting with tc- are custom elements |
| Angular | `import { ScheduleCard } from "@adamstavely/trenchcoat/angular/schedule-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/schedule-card";` |

## Example

The live example is in the gallery at `#/schedule-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A recurring agent task at a glance. The card shows the task's name, its schedule in words – “Every weekday at 09:00,
Europe/London” – and when it runs next, with a countdown that keeps itself fresh. Under it, the last runs sit in a
strip of marks: succeeded, failed, skipped or running, each with a mark as well as a colour, and a tooltip saying when
it ran, how long it took and any note. Run now, Pause or Resume, and Edit sit in the footer. A paused task says so in
words and shows no countdown.

### When to use

- A routine an agent runs on a schedule – a weekly reconciliation, a nightly digest, a daily check.
- A dashboard or sidebar of an agent's recurring jobs, one card each.
- Showing at a glance whether a schedule has been healthy lately.

### When not to use

- Setting up or editing the schedule – use [Routine Form](routine-form.md).
- Fitting many tasks into a week under usage limits – use [Scheduled Runs](scheduled-runs.md).
- Choosing what starts an agent, event or schedule – use [Trigger Builder](trigger-builder.md).
- Long jobs that are running now – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Next run** `.ui-scd__next` – the next run's date and time, with the countdown
2. **Countdown** `.ui-scd__countdown` – “in 2 h 10 min”, or “Due now”
3. **Paused notice** `.ui-scd__paused` – in place of the next run while the task is paused
4. **Last runs** `.ui-scd__strip` – the last runs as marks, oldest first
5. **Run** `.ui-scd__run` – one run: a mark in its tone, with a tooltip
6. **Tally** `.ui-scd__tally` – how many of the finished runs succeeded
7. **Actions** `.ui-scd__actions` – Run now, Pause or Resume, and Edit

## Looks

Standard is a white card on a gray tray, with the header and schedule on the tray above it. Clean is one white card
with the header as its first row. The marks, tooltip and buttons are the same in both. The run marks' width is the
component token `--tc-scd-mark`.

## Usage

### HTML

```html
<tc-schedule-card id="task" heading="Ledger reconciliation" schedule="Every Monday at 09:00, Europe/London"></tc-schedule-card>

<script type="module">
  import "@adamstavely/trenchcoat/schedule-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#task");
  const week = 7 * 24 * 3600 * 1000;
  card.nextRun = Date.now() + 2 * 3600 * 1000;
  card.runs = [
    { id: "r1", at: Date.now() - 3 * week, status: "succeeded", duration: 125000 },
    { id: "r2", at: Date.now() - 2 * week, status: "failed", duration: 61000, note: "3 invoices didn't match" },
    { id: "r3", at: Date.now() - week, status: "succeeded", duration: 118000 },
  ];
  card.addEventListener("tc-run-now", () => console.log("run now"));
  card.addEventListener("tc-paused-change", (e) => console.log(e.detail.paused));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ScheduleCard, type ScheduleRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reconciliation({ runs, nextRun }: { runs: ScheduleRun[]; nextRun: number }) {
  const [paused, setPaused] = useState(false);
  return (
    <ScheduleCard
      title="Ledger reconciliation"
      schedule="Every Monday at 09:00, Europe/London"
      nextRun={nextRun}
      runs={runs}
      paused={paused}
      onPausedChange={setPaused}
      onRunNow={() => console.log("run now")}
      onRunOpen={(id) => console.log("open", id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/schedule-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";

defineProps<{ nextRun: TcScheduleCard["nextRun"]; runs: TcScheduleCard["runs"] }>();
const onRunNow = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-schedule-card :nextRun="nextRun" :runs="runs" @tc-run-now="onRunNow"></tc-schedule-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ScheduleCard } from "@adamstavely/trenchcoat/angular/schedule-card";
import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";

@Component({
  selector: "app-schedule-card-example",
  imports: [ScheduleCard],
  template: `<tc-schedule-card [nextRun]="nextRun()" [runs]="runs()" (tc-run-now)="onRunNow($event)"></tc-schedule-card>`,
})
export class ScheduleCardExample {
  readonly nextRun = input.required<TcScheduleCard["nextRun"]>();
  readonly runs = input.required<TcScheduleCard["runs"]>();
  onRunNow(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/schedule-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";

  let { nextRun, runs }: { nextRun: TcScheduleCard["nextRun"]; runs: TcScheduleCard["runs"] } = $props();
  let el: TcScheduleCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-run-now", on);
    return () => el.removeEventListener("tc-run-now", on);
  });
</script>

<tc-schedule-card bind:this={el} {nextRun} {runs}></tc-schedule-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Scheduled task"` | The task's name, and the card's heading |
| `schedule` | `schedule` | `string` | `""` | The schedule in words, e.g. "Every weekday at 09:00, Europe/London" |
| `nextRun` | – | `number \| null` | `null` | When it runs next, epoch ms; null when nothing is scheduled |
| `runs` | – | `ScheduleRun[]` | `[]` | The last runs, oldest first |
| `maxRuns` | `max-runs` | `number` | `14` | How many of the last runs the strip shows |
| `paused` | `paused` | `boolean` | `false` | Paused: no countdown, and Resume in place of Pause. Changed by the user unless a tc-paused-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; leave it unset and the element keeps its own clock |
| `hideEdit` | `hide-edit` | `boolean` | `false` | Hides Edit |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and times, e.g. "en-GB"; by default the browser's |
| `labels` | – | `ScheduleCardLabelsInput` | `{}` | The card's words, merged over defaultScheduleCardLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-run-now` | – | No | Run now was pressed (detail: {}) |
| `tc-paused-change` | – | Yes | Pause or Resume was pressed ({ paused }: SchedulePausedChange); cancelable – prevented, `paused` stays as it was |
| `tc-edit` | – | No | Edit was pressed (detail: {}) |
| `tc-run-open` | – | No | A run in the strip was opened ({ id, run }: ScheduleRunOpen) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-scd-mark` | `22px` | both |

#### Design tokens it reads (60)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-scd-tone`, `--tc-scd-tone-bg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `scheduleCountdown(ms: number): void` | "in 2 h 10 min", "in 45 s" – the time left, to the precision that matters |

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
| `nextRun` | `el.nextRun = …;` | `<… nextRun={…} />` | `<tc-schedule-card :nextRun="…">` | `<tc-schedule-card [nextRun]="…">` | `<tc-schedule-card {nextRun}>` |
| `runs` | `el.runs = …;` | `<… runs={…} />` | `<tc-schedule-card :runs="…">` | `<tc-schedule-card [runs]="…">` | `<tc-schedule-card {runs}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-schedule-card :labels="…">` | `<tc-schedule-card [labels]="…">` | `<tc-schedule-card {labels}>` |

*Also attributes: `heading`, `schedule`, `max-runs`, `paused`, `now`, `hide-edit`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-run-now` | No | `el.addEventListener("tc-run-now", (e) => …)` | `onRunNow={…}` | `@tc-run-now="…"` | `(tc-run-now)="…($event)"` | `el.addEventListener("tc-run-now", …)` |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `ref.current.addEventListener("tc-paused-change", …)` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |
| `tc-edit` | No | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |
| `tc-run-open` | No | `el.addEventListener("tc-run-open", (e) => …)` | `onRunOpen={…}` | `@tc-run-open="…"` | `(tc-run-open)="…($event)"` | `el.addEventListener("tc-run-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `paused` itself unless a listener calls `preventDefault()` on `tc-paused-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-schedule-card id="schedule-card"></tc-schedule-card>

<script type="module">
  import "@adamstavely/trenchcoat/schedule-card";

  const el = document.querySelector("#schedule-card");
  el.addEventListener("tc-paused-change", (e) => {
    e.preventDefault(); // the element keeps its paused…
    if (allowed(e.detail.paused)) el.paused = e.detail.paused; // …until the app sets it
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
import "@adamstavely/trenchcoat/schedule-card";
import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";

const props = defineProps<{ initial: TcScheduleCard["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcScheduleCard["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-schedule-card :paused="paused" @tc-paused-change="onPausedChange"></tc-schedule-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ScheduleCard } from "@adamstavely/trenchcoat/angular/schedule-card";
import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";

@Component({
  selector: "app-controlled-schedule-card",
  imports: [ScheduleCard],
  template: `<tc-schedule-card [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-schedule-card>`,
})
export class ControlledScheduleCard {
  readonly initial = input.required<TcScheduleCard["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcScheduleCard["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/schedule-card";
  import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";

  let { initial }: { initial: TcScheduleCard["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcScheduleCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcScheduleCard["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-schedule-card bind:this={el} {paused}></tc-schedule-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-schedule-card")` returns a `TcScheduleCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";`
- **React / Next.js:** Props: `import type { ScheduleCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ScheduleCard>`. The element class, for refs: `import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcScheduleCard["nextRun"]` with `import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";`
- **Angular:** The directive types the template: `[nextRun]` takes `TcScheduleCard["nextRun"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcScheduleCard } from "@adamstavely/trenchcoat/schedule-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The task's name, and the card's heading |
| `paused` | `boolean` | Paused – controlled when given |
| `defaultPaused` | `boolean` | Paused on mount when `paused` isn't controlled |
| `onPausedChange` | `(paused: boolean) => void` | Pause or Resume was pressed |
| `onRunNow` | `() => void` | Run now was pressed |
| `onEdit` | `() => void` | Edit was pressed |
| `onRunOpen` | `(id: string, run: ScheduleRun) => void` | A run in the strip was opened |

*Renamed or hidden on the wrapper: `heading`, `paused`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

The strip of runs is one tab stop; the buttons are tab stops of their own.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next run, showing its tooltip |
| Home / End | Moves to the oldest or newest run |
| Enter / Space | Opens the run (`tc-run-open`) |
| Escape | Hides the tooltip until the next hover or focus |

### Screen readers

Each run is a button whose name says its status, when it ran, how long it took and its note: “Failed, Mon 21 Sep,
09:00, took 2m 06s, 3 invoices didn't match the ledger”. The tooltip repeats that and is hidden from screen readers.
The strip is a list named “Last runs”, with a hidden description of its keys. The next run is a `time` element.
Pausing and resuming are confirmed in a polite status message. Status is never colour alone: each run has a mark –
a tick, a cross, a dash or a dot.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.5 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.4 KB** | **8.4 KB** |
| With Lit – the first component on a page | 47.2 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 139 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of runs replaced |
| First on the page | 8.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.0 ms | runs: first render, 157 nodes; update 0.7 ms |
| 1,000 items | 1.9 ms | runs: first render, 157 nodes; update 0.7 ms |

1,000 items of runs: 1.9 ms, 157 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the schedule the way a person would say it, with the time zone: “Every Monday at 09:00, Europe/London”.
- Keep notes to one short line that explains a failure or a skip: “The ledger export timed out”.
- Show enough runs to see a pattern – the last 10 to 14 – not the whole history.

## Do and don't

### Do

- Pass `now` when the page already keeps a clock, so several cards tick together.
- Explain every failed or skipped run with a note.
- Open the run's details from `tc-run-open`.

### Don't

- Don't use the card to edit the schedule – Edit hands that to `routine-form`.
- Don't show a countdown for a paused task; the card hides it for you.
- Don't rely on the tones to tell runs apart – keep the default marks or give your own words.

## Related

- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Scheduled Runs](scheduled-runs.md) – Agent tasks placed into a week's sessions under usage limits – pinned first, big tasks split into linked parts, small ones filling gaps, and an Unscheduled list
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
