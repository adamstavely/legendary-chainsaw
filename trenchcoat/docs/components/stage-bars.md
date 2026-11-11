<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Stage Bars

**Charts** · New

A funnel as a list – a rounded pill per stage sized to its share of the first, the count and share beside it, a headline that follows the pointer with the change chip, stat tiles, an optional period switch that re-grows the pills, and a table view

- **Element:** `<tc-stage-bars>`
- **Size:** 12.1 KB gzip · 38.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/stage-bars";` |
| React / Next.js | `import { StageBars } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/stage-bars";` · tags starting with tc- are custom elements |
| Angular | `import { StageBars } from "@adamstavely/trenchcoat/angular/stage-bars";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/stage-bars";` |

## Example

The live example is in the gallery at `#/stage-bars`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A funnel written as a list: how many cases, people or items reached each stage of a process, one row per stage. Each
row has the stage's name, a rounded pill on a track as long as its share of the first stage, the count, and that
share. The headline is the first stage's count with its change against the period before; pointing at a stage (or
moving to it with the keys) brings its pill forward, quiets the others and rolls the headline to that stage's count.
Stat tiles under the list repeat each stage's count for a quick read.

With `ranges`, a period switch in the header swaps in each period's stages and change, and the pills grow in again.
The pills grow in when the card first comes on screen.

### When to use

- A process with ordered stages where the counts and the share still left at each stage matter more than the shape.
- A dashboard card that needs the funnel and its numbers in one compact, readable block.
- Comparing the same pipeline over a few periods (7 days, 30 days).

### When not to use

- Where the drop from step to step is the story – use [Funnel Chart](funnel-chart.md), which shows each step's rate.
- Parts of one total – use [Compact Breakdown](compact-breakdown.md).
- Categories with no order between them – use [Bar Chart](bar-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, heading and description, the period switch and the Table button
2. **Period switch** `.ui-stgb__range` – one radio per range
3. **Headline** `.ui-stgb__big` – the shown stage's count, with the change chip `.ui-stgb__delta` beside the first stage's
4. **Row** `.ui-stgb__row` – a stage: its name `.ui-stgb__name`, its track `.ui-stgb__track` and pill `.ui-stgb__pill`, its count `.ui-stgb__value` and share `.ui-stgb__share`
5. **Icon** `.ui-stgb__icon` – the stage's own icon at the pill's left end, when given
6. **Tiles** `.ui-stgb__tiles` – a tile per stage with its name and count
7. **Table** `.ui-stgb__table` – the table view: stage, count and share of first

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Pills take the chart colours in order (`--tc-chart-1` to `--tc-chart-6`) unless a stage gives its own `color`;
`mono` draws them all in one ink, `--tc-stgb-mono`. The track is `--tc-stgb-track` and the pill height
`--tc-stgb-pill-h`. When a stage is in front, the others' pills fade towards the track by colour, not by opacity, so
their names and counts keep their contrast. `still` (or the system's reduced-motion setting) draws everything at once.

## Usage

### HTML

```html
<tc-stage-bars heading="Case pipeline" description="Cases at each review step" delta="2.4"></tc-stage-bars>

<script type="module">
  import "@adamstavely/trenchcoat/stage-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  const bars = document.querySelector("tc-stage-bars");
  bars.stages = [
    { label: "Flagged", value: 1180 },
    { label: "Triaged", value: 790 },
    { label: "Investigated", value: 460 },
    { label: "Closed", value: 40 },
  ];
  bars.addEventListener("tc-stage-change", (e) => console.log(e.detail.stage, e.detail.item?.label));
</script>
```

### React / Next.js

```tsx
import { StageBars } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
import { useState } from "react";

const stages = (values: number[]) => ["Flagged", "Triaged", "Investigated", "Closed"].map((label, i) => ({ label, value: values[i] }));
const ranges = [
  { id: "7d", label: "7 days", delta: 2.4, stages: stages([1180, 790, 460, 40]) },
  { id: "30d", label: "30 days", delta: -3.1, stages: stages([4920, 3410, 2120, 210]) },
];

export function CasePipeline() {
  const [range, setRange] = useState("7d");
  return <StageBars title="Case pipeline" ranges={ranges} range={range} onRangeChange={setRange} onStageChange={(stage, item) => console.log(stage, item?.label)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/stage-bars";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";

defineProps<{ stages: TcStageBars["stages"]; ranges: TcStageBars["ranges"] }>();
const onRangeChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-stage-bars :stages="stages" :ranges="ranges" @tc-range-change="onRangeChange"></tc-stage-bars>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StageBars } from "@adamstavely/trenchcoat/angular/stage-bars";
import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";

@Component({
  selector: "app-stage-bars-example",
  imports: [StageBars],
  template: `<tc-stage-bars [stages]="stages()" [ranges]="ranges()" (tc-range-change)="onRangeChange($event)"></tc-stage-bars>`,
})
export class StageBarsExample {
  readonly stages = input.required<TcStageBars["stages"]>();
  readonly ranges = input.required<TcStageBars["ranges"]>();
  onRangeChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stage-bars";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";

  let { stages, ranges }: { stages: TcStageBars["stages"]; ranges: TcStageBars["ranges"] } = $props();
  let el: TcStageBars;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-stage-bars bind:this={el} {stages} {ranges}></tc-stage-bars>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Stages"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `stages` | – | `StageBarsStage[]` | `[]` | The stages, top of the funnel first – used when there are no `ranges` |
| `ranges` | – | `StageBarsRange[] \| undefined` | `undefined` | Periods, each with its own stages and change – adds a switch to the header |
| `range` | `range` | `string \| undefined` | `undefined` | The chosen range's id; unset is the first |
| `delta` | `delta` | `number \| undefined` | `undefined` | Change in the first stage against the period before, in percent – a range's own `delta` wins |
| `stage` | `stage` | `number \| null` | `null` | The picked stage's index, or null for none – it stays emphasised while nothing else is pointed at |
| `mono` | `mono` | `boolean` | `false` | Draws every pill in one ink instead of a colour per stage |
| `showIcons` | `show-icons` | `boolean` | `true` | Draws the stages' icons at the pills' left ends; show-icons="false" hides them |
| `format` | – | `(value: number) => string` | – | Formats every count |
| `view` | `view` | `StageBarsView` | `"chart"` | The list or the table |
| `still` | `still` | `boolean` | `false` | Draws everything where it ends, with no entrance |
| `labels` | – | `Partial<StageBarsLabels>` | `{}` | Words the page can rename, merged over `defaultStageBarsLabels` |
| `shownStages` | – | `StageBarsStage[]` | – | The stages shown: the chosen range's, else `stages` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-range-change` | – | Yes | A period was picked ({ range }: StageBarsRangeChange); cancelable – prevented, `range` stays as it was |
| `tc-stage-change` | – | Yes | A stage was picked with a click, Enter or Space, or let go ({ stage, item }: StageBarsStageChange); cancelable – prevented, `stage` stays as it was |
| `tc-view-change` | – | Yes | The Table button was pressed ({ view }: StageBarsViewChange); cancelable – prevented, `view` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Plays the entrance again |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-stgb-mono` | `var(--tc-text-muted)` | both |
| `--tc-stgb-track` | `var(--tc-fill-subtle)` | both |
| `--tc-stgb-pill-h` | `14px` | both |
| `--tc-stgb-surface` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (68)

`--tc-border-default`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stgb-ink`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `stages` | `el.stages = …;` | `<… stages={…} />` | `<tc-stage-bars :stages="…">` | `<tc-stage-bars [stages]="…">` | `<tc-stage-bars {stages}>` |
| `ranges` | `el.ranges = …;` | `<… ranges={…} />` | `<tc-stage-bars :ranges="…">` | `<tc-stage-bars [ranges]="…">` | `<tc-stage-bars {ranges}>` |
| `format` | `el.format = …;` | `<… format={…} />` | `<tc-stage-bars :format="…">` | `<tc-stage-bars [format]="…">` | `<tc-stage-bars {format}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-stage-bars :labels="…">` | `<tc-stage-bars [labels]="…">` | `<tc-stage-bars {labels}>` |

*Also attributes: `heading`, `description`, `range`, `delta`, `stage`, `mono`, `show-icons`, `view` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-range-change` | Yes | `el.addEventListener("tc-range-change", (e) => …)` | `ref.current.addEventListener("tc-range-change", …)` | `@tc-range-change="…"` | `(tc-range-change)="…($event)"` | `el.addEventListener("tc-range-change", …)` |
| `tc-stage-change` | Yes | `el.addEventListener("tc-stage-change", (e) => …)` | `ref.current.addEventListener("tc-stage-change", …)` | `@tc-stage-change="…"` | `(tc-stage-change)="…($event)"` | `el.addEventListener("tc-stage-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `range`, `stage` and `view` itself unless a listener calls `preventDefault()` on `tc-range-change`, `tc-stage-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-stage-bars id="stage-bars"></tc-stage-bars>

<script type="module">
  import "@adamstavely/trenchcoat/stage-bars";

  const el = document.querySelector("#stage-bars");
  el.addEventListener("tc-range-change", (e) => {
    e.preventDefault(); // the element keeps its range…
    if (allowed(e.detail.range)) el.range = e.detail.range; // …until the app sets it
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
import "@adamstavely/trenchcoat/stage-bars";
import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";

const props = defineProps<{ initial: TcStageBars["range"] }>();
const range = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRangeChange = (e: CustomEvent<{ range: TcStageBars["range"] }>) => {
  e.preventDefault();
  range.value = e.detail.range;
};
</script>

<template>
  <tc-stage-bars :range="range" @tc-range-change="onRangeChange"></tc-stage-bars>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { StageBars } from "@adamstavely/trenchcoat/angular/stage-bars";
import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";

@Component({
  selector: "app-controlled-stage-bars",
  imports: [StageBars],
  template: `<tc-stage-bars [range]="range()" (tc-range-change)="onRangeChange($event)"></tc-stage-bars>`,
})
export class ControlledStageBars {
  readonly initial = input.required<TcStageBars["range"]>();
  readonly range = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRangeChange(e: CustomEvent<{ range: TcStageBars["range"] }>) {
    e.preventDefault();
    this.range.set(e.detail.range);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stage-bars";
  import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";

  let { initial }: { initial: TcStageBars["range"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let range = $derived(initial);
  let el: TcStageBars;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      range = (e as CustomEvent<{ range: TcStageBars["range"] }>).detail.range;
    };
    el.addEventListener("tc-range-change", on);
    return () => el.removeEventListener("tc-range-change", on);
  });
</script>

<tc-stage-bars bind:this={el} {range}></tc-stage-bars>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-stage-bars")` returns a `TcStageBars` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";`
- **React / Next.js:** Props: `import type { StageBarsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof StageBars>`. The element class, for refs: `import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStageBars["stages"]` with `import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";`
- **Angular:** The directive types the template: `[stages]` takes `TcStageBars["stages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStageBars } from "@adamstavely/trenchcoat/stage-bars";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `range` | `string` | The chosen range's id – controlled when given |
| `defaultRange` | `string` | The range on mount when `range` isn't controlled – by default the first |
| `onRangeChange` | `(range: string) => void` | A period was picked |
| `stage` | `number \| null` | The picked stage's index, or null – controlled when given |
| `defaultStage` | `number \| null` | The picked stage on mount when `stage` isn't controlled |
| `onStageChange` | `(stage: number \| null, item: StageBarsStage \| null) => void` | A stage was picked or let go |
| `view` | `StageBarsView` | The list or the table – controlled when given |
| `defaultView` | `StageBarsView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: StageBarsView) => void` | The Table button was pressed |

*Renamed or hidden on the wrapper: `heading`, `range`, `stage`, `view`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the list – one tab stop; the period switch and the Table button are tab stops of their own |
| Arrow keys | Move to the next or previous stage, bringing it forward and rolling the headline to it |
| Home / End | The first or last stage |
| Enter / Space | Picks the stage (fires `tc-stage-change`), or lets it go when it's already picked |
| Escape | Lets go of the picked stage |
| Arrow keys in the switch | Choose the previous or next period |

### Screen readers

- The rows are a listbox named by the heading; each option reads as its name, count and share ("Triaged, 790, 67% of
  first stage") and says whether it's selected.
- The headline says whose count it shows; the change chip reads "up 2.4%" or "down 3.1%".
- Picking a stage is announced politely ("Selected Investigated").
- The pills and the tiles repeat the text, so they're hidden; the Table button shows the same numbers as a table.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 23.4 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **38.5 KB** | **12.1 KB** |
| With Lit – the first component on a page | 61.2 KB | 19.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 114 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of ranges replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.9 ms | ranges: first render, 212 nodes; update 0.9 ms |
| 1,000 items | 16 ms | ranges: first render, 1,112 nodes; update 1.9 ms |

1,000 items of ranges: 16 ms, 1,112 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **79 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop), `requestAnimationFrame, cancelled` (internal/controllers – RollingController).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()` (internal/chart/motion-controller – clock), `performance.now()` (internal/controllers – RollingController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name stages with short states or past-tense verbs: "Flagged", "Triaged", "Closed".
- Keep to three to eight stages – the tiles wrap three to a row.
- Give icons only when every stage has one; they're drawn small, as a mark of the stage, not a picture.
- Range labels are short spans: "7 days", "30 days", "Quarter".

## Do and don't

### Do

- Put the stages top of the funnel first – shares are measured against the first.
- Pass a `delta` (or each range's own) so the headline says which way the first stage moved.

### Don't

- Use it for stages that can grow from one to the next – the pills read as narrowing.
- Rely on the pill colours to tell stages apart – the names do that; colour only groups a row with its tile.

## Related

- [Funnel Chart](funnel-chart.md) – How many are left at each step of a process as centred bars narrowing down the page, joined by curved necks, each step's rate against the one before or the first, the biggest drop emphasised, and a table view
- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- [Bar Chart](bar-chart.md) – Values by category as bars – grouped, stacked or stacked to 100%, upright or lying down – the highest one emphasised, values at the bars' ends, bars that grow in and glide when the data changes, and a table view
- [Capacity Bars](capacity-bars.md) – How loaded each person is – their allocation split by what they work on, against their capacity on one shared scale, each piece named with its amount, anyone over capacity marked and counted
- [Week Bars](week-bars.md) – A week of daily totals as rounded bars against a dashed goal line – days that reach it in the accent, the week's total counting up with the average per day, a week switcher the bars glide between, today marked, and a table view
