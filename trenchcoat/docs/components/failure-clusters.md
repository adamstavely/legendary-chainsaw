<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Failure Clusters

**Agents** · New

Failing chats grouped by topic, biggest first – a size bar, the count and share, the trend in a word and an arrow, the criteria each fails, and a row that opens to a summary, quotes, Open chats, Add to dataset and Mark as known; filtered by criterion, or as bubbles

- **Element:** `<tc-failure-clusters>`
- **Size:** 9.3 KB gzip · 31.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/failure-clusters";` |
| React / Next.js | `import { FailureClusters } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/failure-clusters";` · tags starting with tc- are custom elements |
| Angular | `import { FailureClusters } from "@adamstavely/trenchcoat/angular/failure-clusters";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/failure-clusters";` |

## Example

The live example is in the gallery at `#/failure-clusters`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A production agent's failing chats, grouped by topic, the biggest group first. Each cluster is a row with its rank,
its name, a bar for its size, the number of chats and their share of all failures, its trend over the period in a
word and an arrow – "Up 18%", "Flat", "Down 9%" – and the criteria its chats fail. A row opens to a summary of what
goes wrong, a few quotes from the chats, and three actions: Open chats, Add to dataset (to turn the cluster into eval
cases) and Mark as known. Known clusters drop to the bottom and go quiet, so new problems stay on top. Radio chips
filter the clusters to those failing one criterion, and the header says how many failing chats there are in words.
A Bubbles view shows the clusters as circles sized by count, for a glance at where the failures are.

### When to use

- Triage of an agent's failures after a judge has scored live chats.
- Deciding which failures to fix first, and which to turn into eval cases.
- A weekly quality review, with the period in the description.

### When not to use

- Pass and fail per test case across versions – use [Eval Scorecard](eval-scorecard.md).
- Editing the eval cases themselves – use [Evaluation Dataset Editor](evaluation-dataset-editor.md).
- Rating a single answer – use [Feedback Rubric](feedback-rubric.md).
- Being told when quality drops – use [Quality Alerts](quality-alerts.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filter** `.ui-fcl__filter` – radio chips, one per criterion, and All criteria
2. **Views** `.ui-fcl__views` – List or Bubbles
3. **Row** `.ui-fcl__row` – a cluster: rank, name, bar, count and share, trend and criteria; opens the detail
4. **Bar** `.ui-fcl__bar` – the cluster's size against the biggest
5. **Trend** `.ui-fcl__trend` – an arrow and a word: Up, Down or Flat, with the change
6. **Detail** `.ui-fcl__detail` – the summary, quotes and actions of an open cluster
7. **Quote** `.ui-fcl__quote` – a line from a failing chat
8. **Actions** `.ui-fcl__actions` – Open chats, Add to dataset, Mark as known
9. **Bubble** `.ui-fcl__bubble` – in Bubbles view, a cluster as a circle sized by count

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. A page can resize the bars with `--tc-fcl-bar-h` and the largest bubble with `--tc-fcl-bubble`.

## Usage

### HTML

```html
<tc-failure-clusters id="clusters" heading="Failure clusters" description="Policy desk · last 7 days"></tc-failure-clusters>

<script type="module">
  import "@adamstavely/trenchcoat/failure-clusters";
  import "@adamstavely/trenchcoat/tokens.css";

  const clusters = document.querySelector("#clusters");
  clusters.clusters = [
    { id: "abroad", label: "Expense limits abroad", count: 142, trend: { direction: "up", change: 18 }, criteria: ["Correctness", "Cites policy"],
      summary: "Quotes the domestic limits for overseas trips.", examples: [{ id: "e1", quote: "What's the hotel limit in Lisbon? — 180 a night." }] },
    { id: "leave", label: "Carrying over annual leave", count: 96, trend: { direction: "flat" }, criteria: ["Correctness"] },
  ];
  clusters.addEventListener("tc-add-to-dataset", (e) => console.log("add", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { FailureClusters, type FailureCluster } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const clusters: FailureCluster[] = [
  { id: "abroad", label: "Expense limits abroad", count: 142, trend: { direction: "up", change: 18 }, criteria: ["Correctness", "Cites policy"] },
  { id: "leave", label: "Carrying over annual leave", count: 96, trend: { direction: "flat" }, criteria: ["Correctness"] },
];

export function Failures() {
  return <FailureClusters title="Failure clusters" clusters={clusters} onClusterOpen={(id) => console.log("open", id)} onAddToDataset={(id) => console.log("add", id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/failure-clusters";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";

defineProps<{ clusters: TcFailureClusters["clusters"]; known: TcFailureClusters["known"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-failure-clusters :clusters="clusters" :known="known" @tc-open-change="onOpenChange"></tc-failure-clusters>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FailureClusters } from "@adamstavely/trenchcoat/angular/failure-clusters";
import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";

@Component({
  selector: "app-failure-clusters-example",
  imports: [FailureClusters],
  template: `<tc-failure-clusters [clusters]="clusters()" [known]="known()" (tc-open-change)="onOpenChange($event)"></tc-failure-clusters>`,
})
export class FailureClustersExample {
  readonly clusters = input.required<TcFailureClusters["clusters"]>();
  readonly known = input.required<TcFailureClusters["known"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/failure-clusters";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";

  let { clusters, known }: { clusters: TcFailureClusters["clusters"]; known: TcFailureClusters["known"] } = $props();
  let el: TcFailureClusters;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-failure-clusters bind:this={el} {clusters} {known}></tc-failure-clusters>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Failure clusters"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading – the agent and the period |
| `clusters` | – | `FailureCluster[]` | `[]` | The clusters, in any order – shown biggest first, known ones last |
| `total` | `total` | `number \| undefined` | `undefined` | All failing chats in the period; by default the clusters' counts added up |
| `open` | `open` | `string \| null` | `null` | The open cluster's id. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `known` | – | `string[]` | `[]` | The clusters marked as known (ids). Changed by the user unless a tc-known-change listener calls preventDefault() |
| `criterion` | `criterion` | `string \| null` | `null` | Only clusters failing this criterion; null for all. Changed by the user unless a tc-criterion-change listener calls preventDefault() |
| `view` | `view` | `FailureClustersView` | `"list"` | "list" or "bubbles". Changed by the user unless a tc-view-change listener calls preventDefault() |
| `hideView` | `hide-view` | `boolean` | `false` | Hides the List / Bubbles switch |
| `labels` | – | `Partial<FailureClustersLabels>` | `{}` | The words used, merged over the defaults |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A cluster was opened or closed ({ open }: FailureClusterOpenChange); cancelable – prevented, `open` stays as it was |
| `tc-known-change` | – | Yes | Mark as known or Mark as new ({ known, id, isKnown }: FailureClusterKnownChange); cancelable – prevented, `known` stays as it was |
| `tc-criterion-change` | – | Yes | The criterion filter changed ({ criterion }: FailureClusterCriterionChange); cancelable – prevented, `criterion` stays as it was |
| `tc-view-change` | – | Yes | List or Bubbles was chosen ({ view }: FailureClusterViewChange); cancelable – prevented, `view` stays as it was |
| `tc-cluster-open` | – | No | Open chats was pressed ({ id, cluster }: FailureClusterAction) |
| `tc-add-to-dataset` | – | Yes | Add to dataset was pressed ({ id, cluster }: FailureClusterAction); cancelable – prevented, the cluster isn't marked as added |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-fcl-bar-h` | `6px` | both |
| `--tc-fcl-bubble` | `88px` | both |
| `--tc-fcl-bubble-scale` | `1` | not set – this fallback applies |

#### Design tokens it reads (72)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xs`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `clusterTrendWords(trend: ClusterTrend \| undefined): void` | "Up 12%", "Down 4%", "Flat" |

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
| `clusters` | `el.clusters = …;` | `<… clusters={…} />` | `<tc-failure-clusters :clusters="…">` | `<tc-failure-clusters [clusters]="…">` | `<tc-failure-clusters {clusters}>` |
| `known` | `el.known = …;` | `<… known={…} />` | `<tc-failure-clusters :known="…">` | `<tc-failure-clusters [known]="…">` | `<tc-failure-clusters {known}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-failure-clusters :labels="…">` | `<tc-failure-clusters [labels]="…">` | `<tc-failure-clusters {labels}>` |

*Also attributes: `heading`, `description`, `total`, `open`, `criterion`, `view`, `hide-view`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-known-change` | Yes | `el.addEventListener("tc-known-change", (e) => …)` | `onKnownChange={…}` | `@tc-known-change="…"` | `(tc-known-change)="…($event)"` | `el.addEventListener("tc-known-change", …)` |
| `tc-criterion-change` | Yes | `el.addEventListener("tc-criterion-change", (e) => …)` | `ref.current.addEventListener("tc-criterion-change", …)` | `@tc-criterion-change="…"` | `(tc-criterion-change)="…($event)"` | `el.addEventListener("tc-criterion-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-cluster-open` | No | `el.addEventListener("tc-cluster-open", (e) => …)` | `onClusterOpen={…}` | `@tc-cluster-open="…"` | `(tc-cluster-open)="…($event)"` | `el.addEventListener("tc-cluster-open", …)` |
| `tc-add-to-dataset` | Yes | `el.addEventListener("tc-add-to-dataset", (e) => …)` | `onAddToDataset={…}` | `@tc-add-to-dataset="…"` | `(tc-add-to-dataset)="…($event)"` | `el.addEventListener("tc-add-to-dataset", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open`, `known`, `criterion` and `view` itself unless a listener calls `preventDefault()` on `tc-open-change`, `tc-known-change`, `tc-criterion-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-failure-clusters id="failure-clusters"></tc-failure-clusters>

<script type="module">
  import "@adamstavely/trenchcoat/failure-clusters";

  const el = document.querySelector("#failure-clusters");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/failure-clusters";
import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";

const props = defineProps<{ initial: TcFailureClusters["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcFailureClusters["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-failure-clusters :open="open" @tc-open-change="onOpenChange"></tc-failure-clusters>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FailureClusters } from "@adamstavely/trenchcoat/angular/failure-clusters";
import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";

@Component({
  selector: "app-controlled-failure-clusters",
  imports: [FailureClusters],
  template: `<tc-failure-clusters [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-failure-clusters>`,
})
export class ControlledFailureClusters {
  readonly initial = input.required<TcFailureClusters["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcFailureClusters["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/failure-clusters";
  import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";

  let { initial }: { initial: TcFailureClusters["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcFailureClusters;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcFailureClusters["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-failure-clusters bind:this={el} {open}></tc-failure-clusters>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-failure-clusters")` returns a `TcFailureClusters` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";`
- **React / Next.js:** Props: `import type { FailureClustersProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FailureClusters>`. The element class, for refs: `import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFailureClusters["clusters"]` with `import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";`
- **Angular:** The directive types the template: `[clusters]` takes `TcFailureClusters["clusters"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFailureClusters } from "@adamstavely/trenchcoat/failure-clusters";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `open` | `string \| null` | The open cluster's id – controlled when given (null for none) |
| `defaultOpen` | `string \| null` | The cluster open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: string \| null) => void` | A cluster was opened or closed |
| `known` | `string[]` | The clusters marked as known – controlled when given |
| `defaultKnown` | `string[]` | Known on mount when `known` isn't controlled |
| `onKnownChange` | `(known: string[], id: string, isKnown: boolean) => void` | Mark as known or Mark as new was pressed |
| `criterion` | `string \| null` | The criterion filter – controlled when given (null for all) |
| `defaultCriterion` | `string \| null` | The filter on mount when `criterion` isn't controlled |
| `onCriterionChange` | `(criterion: string \| null) => void` | The criterion filter changed |
| `view` | `FailureClustersView` | "list" or "bubbles" – controlled when given |
| `defaultView` | `FailureClustersView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: FailureClustersView) => void` | List or Bubbles was chosen |
| `onClusterOpen` | `(id: string, cluster: FailureCluster) => void` | Open chats was pressed |
| `onAddToDataset` | `(id: string, cluster: FailureCluster) => boolean \| void` | Add to dataset was pressed; return false to keep the cluster from showing as added |

*Renamed or hidden on the wrapper: `heading`, `open`, `known`, `criterion`, `view`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The rows (or bubbles) are one tab stop; the filter's chips are a radio group.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next cluster |
| Home / End | Moves to the first or last cluster |
| Enter / Space | Opens or closes the cluster |
| Tab | Moves into the open cluster's actions, then on |
| ← / → in the filter | Chooses the previous or next criterion |

### Screen readers

The clusters are an ordered list named by the heading. Each row is a button named by the cluster and described by
its facts in words, "142 chats, 34%, Up 18%, fails Correctness, fails Cites policy", with `aria-expanded` and
`aria-controls` pointing at its detail. The trend never rests on colour: the word says which way it went. The detail
is a region named by the cluster; its actions are described by the cluster's name, so "Add to dataset" is heard with
what it adds. Mark as known is a toggle button. Marking a cluster and adding it to the dataset are confirmed in a
polite status message.

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
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 24.3 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.8 KB** | **9.3 KB** |
| With Lit – the first component on a page | 54.9 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 145 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of clusters replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | clusters: first render, 2,007 nodes; update 4.4 ms |
| 1,000 items | 101 ms | clusters: first render, 19,647 nodes; update 46 ms |

1,000 items of clusters: 101 ms. It renders every item, so a first render passes 50 ms (a long task) at about 500 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name clusters for the topic people asked about, not the failure: "Expense limits abroad", not "Wrong answers".
- Write the summary as what the agent does wrong, in one or two sentences.
- Quote the shortest part of a chat that shows the failure – the question and the wrong answer.
- Keep criterion names the same as the judge's rubric.

## Do and don't

### Do

- Pass `total` when the clusters don't cover every failing chat, so shares stay honest.
- Mark clusters that are already being fixed as known, so new ones stand out.
- Put the agent and period in the description.

### Don't

- Don't show every cluster the clustering found; merge the small ones into "Other".
- Don't rely on the colours of the trend – the words carry it.
- Don't put personal details in quotes; redact names before they reach the page.

## Related

- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Evaluation Dataset Editor](evaluation-dataset-editor.md) – Edit an eval set's cases, checks, tags and splits, compare it with an earlier version, and import or export it as JSON Lines
- [Quality Alerts](quality-alerts.md) – Alert rules that read as sentences – "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats", each slot a labelled field, with an on/off switch, when it last fired, how often it would have fired in the last 30 days, and problems in words
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
