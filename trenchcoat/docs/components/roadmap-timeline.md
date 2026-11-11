<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Roadmap Timeline

**Research & portfolio** · New

Workstreams on a calendar, Gantt style – lanes, bars with progress and status, milestones, a Today line and dependency arrows (red when dates clash), at week, month or quarter scale, with details for the work you select

- **Element:** `<tc-roadmap-timeline>`
- **Size:** 12.0 KB gzip · 40.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/roadmap-timeline";` |
| React / Next.js | `import { RoadmapTimeline } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/roadmap-timeline";` · tags starting with tc- are custom elements |
| Angular | `import { RoadmapTimeline } from "@adamstavely/trenchcoat/angular/roadmap-timeline";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/roadmap-timeline";` |

## Example

The live example is in the gallery at `#/roadmap-timeline`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Workstreams on a calendar, Gantt style. Each workstream is a lane, and its name and owner stay put on the left while
the chart scrolls. Each piece of work is a bar from its first day to its last, filled as far as it has got. Its status
shows as a mark and a word as well as a colour: Planned, Active, Done, At risk or Blocked. Milestones are diamonds on
their day, and a Today line runs down the chart. Elbow arrows run from each piece of work to the ones that wait for
it. An arrow turns red and dashed when the follower is planned to start before what it waits for ends.

Switch between Weeks, Months and Quarters in the header. The drawing keeps its size and scrolls sideways inside the
card. Select a piece of work to see its details under the chart: dates, length in days, status, progress, what it
waits for and what waits for it.

### When to use

- A plan across several teams or streams over weeks to quarters, where order and dependencies matter.
- Reviewing a portfolio's timing: what's late, what's blocked, what a slip would push back.

### When not to use

- One process moving through fixed steps – use [Status Tracker](status-tracker.md).
- Agents' work as it happens, minute by minute – use [Agent Lanes](agent-lanes.md).
- One task's details – use [Work Item](work-item.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Scale** `.ui-rdm__scale` – Weeks, Months, Quarters, in the header
2. **Lane** `.ui-rdm__lane` – the workstream and its owner, pinned on the left
3. **Axis** `.ui-rdm__axis` – months or quarters above, weeks or months below
4. **Bar** `.ui-rdm__item` – a piece of work: its status mark and name, filled to its progress
5. **Milestone** `.ui-rdm__diamond` – a single day that matters
6. **Dependency** `.ui-rdm__dep` – an arrow from what's waited for to what waits; red and dashed when the dates clash
7. **Today** `.ui-rdm__today` – today's line, labelled in the axis
8. **Details** `.ui-rdm__detail` – the selected piece of work's dates, length, progress and links
9. **Legend** `.ui-rdm__legend` – the statuses in use, with their marks

## Looks

Standard sets the header and scale on a gray tray above a white card; Clean is one white card with the header as its
first row. Statuses use the status tones: Active is info, Done is success, At risk is warning and Blocked is danger,
while Planned is neutral. Each bar also carries its status mark, and narrow bars keep the mark when the name won't fit.

A page can set `--tc-rdm-lane-w` (the lane column, 168px), `--tc-rdm-row` (a lane's height) and `--tc-rdm-bar-h`.

## Usage

### HTML

```html
<tc-roadmap-timeline heading="2027 roadmap" today="2027-04-07"></tc-roadmap-timeline>
<script type="module">
  const chart = document.querySelector("tc-roadmap-timeline");
  chart.lanes = [{ id: "data", label: "Open data portal", owner: "Data team" }];
  chart.items = [
    { id: "schema", lane: "data", label: "Dataset schema", start: "2027-01-18", end: "2027-03-12", status: "done" },
    { id: "launch", lane: "data", label: "Public launch", start: "2027-06-15", milestone: true, dependsOn: ["schema"] },
  ];
  chart.addEventListener("tc-selected-change", (e) => console.log(e.detail.item));
</script>
```

### React / Next.js

```tsx
import { RoadmapTimeline } from "@adamstavely/trenchcoat/react";

export function Plan() {
  return (
    <RoadmapTimeline
      title="2027 roadmap"
      today="2027-04-07"
      lanes={[{ id: "data", label: "Open data portal" }]}
      items={[{ id: "schema", lane: "data", label: "Dataset schema", start: "2027-01-18", end: "2027-03-12", status: "done" }]}
      onSelectedChange={(id) => console.log(id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/roadmap-timeline";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";

defineProps<{ lanes: TcRoadmapTimeline["lanes"]; items: TcRoadmapTimeline["items"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-roadmap-timeline :lanes="lanes" :items="items" @tc-selected-change="onSelectedChange"></tc-roadmap-timeline>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RoadmapTimeline } from "@adamstavely/trenchcoat/angular/roadmap-timeline";
import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";

@Component({
  selector: "app-roadmap-timeline-example",
  imports: [RoadmapTimeline],
  template: `<tc-roadmap-timeline [lanes]="lanes()" [items]="items()" (tc-selected-change)="onSelectedChange($event)"></tc-roadmap-timeline>`,
})
export class RoadmapTimelineExample {
  readonly lanes = input.required<TcRoadmapTimeline["lanes"]>();
  readonly items = input.required<TcRoadmapTimeline["items"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/roadmap-timeline";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";

  let { lanes, items }: { lanes: TcRoadmapTimeline["lanes"]; items: TcRoadmapTimeline["items"] } = $props();
  let el: TcRoadmapTimeline;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-roadmap-timeline bind:this={el} {lanes} {items}></tc-roadmap-timeline>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Roadmap"` | The heading, and the chart's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `lanes` | – | `RoadmapLane[]` | `[]` | The workstreams, top to bottom |
| `items` | – | `RoadmapItem[]` | `[]` | The pieces of work |
| `range` | – | `RoadmapRange \| undefined` | `undefined` | The window shown; by default the work's own span, padded to whole months |
| `scale` | `scale` | `RoadmapScale` | `"month"` | Weeks, months or quarters. Changed by the user unless a tc-scale-change listener calls preventDefault() |
| `today` | `today` | `string \| undefined` | `undefined` | Today, "YYYY-MM-DD"; by default the element's own clock |
| `selected` | `selected` | `string \| null` | `null` | The selected piece of work's id. Changed by the user unless tc-selected-change is prevented |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `statusLabels` | – | `Partial<RoadmapStatusLabels>` | `{}` | Words for the statuses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A piece of work was selected, or the selection cleared ({ selected, item }: RoadmapSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-scale-change` | – | Yes | The scale was switched ({ scale }: RoadmapScaleChange); cancelable – prevented, `scale` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rdm-lane-w` | `112px` | both |

#### Design tokens it reads (88)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-rdm-bar-h`, `--tc-rdm-head-h`, `--tc-rdm-row`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-border`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `dayNumber(iso: string \| undefined): number` | A calendar day as a day number (UTC days since 1970), or NaN |

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
| `lanes` | `el.lanes = …;` | `<… lanes={…} />` | `<tc-roadmap-timeline :lanes="…">` | `<tc-roadmap-timeline [lanes]="…">` | `<tc-roadmap-timeline {lanes}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-roadmap-timeline :items="…">` | `<tc-roadmap-timeline [items]="…">` | `<tc-roadmap-timeline {items}>` |
| `range` | `el.range = …;` | `<… range={…} />` | `<tc-roadmap-timeline :range="…">` | `<tc-roadmap-timeline [range]="…">` | `<tc-roadmap-timeline {range}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-roadmap-timeline :statusLabels="…">` | `<tc-roadmap-timeline [statusLabels]="…">` | `<tc-roadmap-timeline {statusLabels}>` |

*Also attributes: `heading`, `description`, `scale`, `today`, `selected`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-scale-change` | Yes | `el.addEventListener("tc-scale-change", (e) => …)` | `ref.current.addEventListener("tc-scale-change", …)` | `@tc-scale-change="…"` | `(tc-scale-change)="…($event)"` | `el.addEventListener("tc-scale-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `scale` and `selected` itself unless a listener calls `preventDefault()` on `tc-scale-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-roadmap-timeline id="roadmap-timeline"></tc-roadmap-timeline>

<script type="module">
  import "@adamstavely/trenchcoat/roadmap-timeline";

  const el = document.querySelector("#roadmap-timeline");
  el.addEventListener("tc-scale-change", (e) => {
    e.preventDefault(); // the element keeps its scale…
    if (allowed(e.detail.scale)) el.scale = e.detail.scale; // …until the app sets it
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
import "@adamstavely/trenchcoat/roadmap-timeline";
import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";

const props = defineProps<{ initial: TcRoadmapTimeline["scale"] }>();
const scale = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onScaleChange = (e: CustomEvent<{ scale: TcRoadmapTimeline["scale"] }>) => {
  e.preventDefault();
  scale.value = e.detail.scale;
};
</script>

<template>
  <tc-roadmap-timeline :scale="scale" @tc-scale-change="onScaleChange"></tc-roadmap-timeline>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RoadmapTimeline } from "@adamstavely/trenchcoat/angular/roadmap-timeline";
import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";

@Component({
  selector: "app-controlled-roadmap-timeline",
  imports: [RoadmapTimeline],
  template: `<tc-roadmap-timeline [scale]="scale()" (tc-scale-change)="onScaleChange($event)"></tc-roadmap-timeline>`,
})
export class ControlledRoadmapTimeline {
  readonly initial = input.required<TcRoadmapTimeline["scale"]>();
  readonly scale = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onScaleChange(e: CustomEvent<{ scale: TcRoadmapTimeline["scale"] }>) {
    e.preventDefault();
    this.scale.set(e.detail.scale);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/roadmap-timeline";
  import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";

  let { initial }: { initial: TcRoadmapTimeline["scale"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let scale = $derived(initial);
  let el: TcRoadmapTimeline;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      scale = (e as CustomEvent<{ scale: TcRoadmapTimeline["scale"] }>).detail.scale;
    };
    el.addEventListener("tc-scale-change", on);
    return () => el.removeEventListener("tc-scale-change", on);
  });
</script>

<tc-roadmap-timeline bind:this={el} {scale}></tc-roadmap-timeline>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-roadmap-timeline")` returns a `TcRoadmapTimeline` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";`
- **React / Next.js:** Props: `import type { RoadmapTimelineProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RoadmapTimeline>`. The element class, for refs: `import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRoadmapTimeline["lanes"]` with `import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";`
- **Angular:** The directive types the template: `[lanes]` takes `TcRoadmapTimeline["lanes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRoadmapTimeline } from "@adamstavely/trenchcoat/roadmap-timeline";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the chart's name |
| `selected` | `string \| null` | The selected piece of work's id – controlled when given |
| `defaultSelected` | `string \| null` | The selection on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, item: RoadmapItem \| null) => void` | A piece of work was selected, or the selection cleared |
| `scale` | `RoadmapScale` | Weeks, months or quarters – controlled when given |
| `defaultScale` | `RoadmapScale` | The scale on mount when `scale` isn't controlled |
| `onScaleChange` | `(scale: RoadmapScale) => void` | The scale was switched |

*Renamed or hidden on the wrapper: `heading`, `selected`, `scale`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Into the chart: one stop, on the selected piece of work or the first |
| ← / → | Previous / next piece of work in the lane |
| ↑ / ↓ | The nearest piece of work in the lane above / below |
| Home / End | A lane's first / last piece of work (with Ctrl, the chart's) |
| Enter or Space | Selects it (again to clear) and shows the details |
| Escape | Clears the selection |

### Screen readers

- The chart is a `grid`. Each lane is a `row` with its name as the `rowheader`, and each piece of work is a `gridcell`
  in date order. A grid suits this better than a list because both directions mean something: along a lane is time,
  across lanes is the plan.
- Each cell is named in full, for example "Ingest pipeline, 8 Mar to 21 May 2027, At risk, 30% done". The selected
  one is `aria-selected`.
- The arrows and the Today line are drawn for sight. The details panel says the same in words ("Waits for", "Blocks",
  and a warning when dates clash).
- Selection and scale changes are announced in a polite status line.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.5 KB | 9.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **40.9 KB** | **12.0 KB** |
| With Lit – the first component on a page | 62.7 KB | 19.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.8 ms** | the gallery demo's data, 273 DOM nodes – to layout, median of 7 |
| Typical update | **2.8 ms** | one item of items replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 25 ms | items: first render, 1,019 nodes; update 19 ms |
| 1,000 items | 661 ms | items: first render, 8,333 nodes; update 638 ms |

1,000 items of items: 661 ms. It renders every item, so a first render passes 50 ms (a long task) at about 80 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `new Date()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name pieces of work as outcomes ("Ingest pipeline"), and keep them short – the name rides on the bar.
- Give dates as calendar days, `YYYY-MM-DD`. A milestone needs only `start`.
- Set `progress` for work under way; Done counts as full without it.
- Pass `today` in stories, tests and reports so the line doesn't move.

## Do and don't

### Do

- Use dependencies for real hand-offs, not for "after".
- Use At risk early and Blocked when something stops the work – both are worth a look.

### Don't

- Put more than a dozen lanes in one chart – split it by programme.
- Draw daily tasks at Quarter scale; use Weeks.

## Related

- [Status Tracker](status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Work Item](work-item.md) – One piece of work as a card – status in words, a note, progress, a due date marked when overdue, people, what it delivers, spent against budget, effort and a "Synced · read-only" source, the whole card opening it
- [Activity Calendar](activity-calendar.md) – A year of activity at a glance – a square per day in a column per week, shaded by how much happened, with month and weekday names, the total, and any day's value on hover or focus

## Changelog

- **Research & portfolio** - **Roadmap Timeline** (`tc-roadmap-timeline`) – Gantt-style lanes with progress, milestones, Today and dependency arrows, at week, month or quarter scale. - **Prioritisation Matrix** (`tc-prioritisation-matrix`) – value against effort, points dragged or moved with the arrow keys, listed by quadrant. - **Risk Register** (`tc-risk-register`) – a 5 × 5 likelihood × impact grid beside a sortable, rescorable register. - **Bibliography** (`tc-bibliography`) – references in APA, MLA, Chicago, Harvard or IEEE, with Copy and BibTeX / RIS export.
