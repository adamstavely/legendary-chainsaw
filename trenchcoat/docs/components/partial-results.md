<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Partial Results

**Agents** · New

A bulk run that partly finished – "34 of 40 finished · 6 didn't" over a bar split into finished, failed and skipped, the unfinished grouped by reason with Retry, Retry failed, Continue with what finished and Download the list, or a one-line notice

- **Element:** `<tc-partial-results>`
- **Size:** 8.7 KB gzip · 27.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/partial-results";` |
| React / Next.js | `import { PartialResults } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/partial-results";` · tags starting with tc- are custom elements |
| Angular | `import { PartialResults } from "@adamstavely/trenchcoat/angular/partial-results";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/partial-results";` |

## Example

The live example is in the gallery at `#/partial-results`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A bulk run that partly finished, because partial results beat a failure. A headline says it in words – "34 of 40 finished · 6 didn't" – over a bar split into finished, failed and skipped. Below it the unfinished items are grouped by reason, biggest group first, each item with its own reason and a Retry. At the foot are Retry failed, Continue with what finished, and Download the list. `variant="notice"` is one line and a Retry, for the top of a results list.

### When to use

- A batch over many items where some finished and some didn't: summaries, imports, extractions, checks.
- Letting someone carry on with what worked while they deal with the rest.

### When not to use

- A run that's still going – use [Fan-out Grid](fan-out-grid.md) or [Agent Findings](agent-findings.md).
- What a run will cost before it starts – use [Run Estimate](run-estimate.md).
- A one-line message that something failed – use [Toaster](toaster.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Headline** `.ui-ptr__headline` – how many finished and how many didn't
2. **Bar** `.ui-ptr__bar` – a `.ui-ptr__seg` per status, with `.ui-ptr__legend` keys
3. **Groups** `.ui-ptr__group-list` – each `.ui-ptr__group-toggle` names a `.ui-ptr__reason` and its count
4. **Items** `.ui-ptr__items` – each `.ui-ptr__item` with `.ui-ptr__label`, `.ui-ptr__status`, `.ui-ptr__detail` and `.ui-ptr__retry`
5. **Actions** `.ui-ptr__actions` – Download the list, Continue, and Retry failed
6. **Notice** `.ui-ptr__notice` – the one-line variant

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. The notice is a tinted line in either look. When narrow, each item's Retry sits under it and the actions share the width. A page can set `--tc-ptr-bar` for the bar's height.

## Usage

### HTML

```html
<tc-partial-results id="run" total="40" done="34"></tc-partial-results>

<script type="module">
  import "@adamstavely/trenchcoat/partial-results";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.items = [{ id: "a", label: "statements.pdf", status: "failed", reason: "Couldn't open the file" }];
  run.addEventListener("tc-retry", (e) => console.log(e.detail.ids));
</script>
```

### React / Next.js

```tsx
import { PartialResults, type PartialResultItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: PartialResultItem[] = [{ id: "a", label: "statements.pdf", status: "failed", reason: "Couldn't open the file" }];

export function Run() {
  return <PartialResults total={40} done={34} items={items} onTcRetry={(e) => console.log(e.detail.ids)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/partial-results";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";

defineProps<{ items: TcPartialResults["items"]; collapsed: TcPartialResults["collapsed"] }>();
const onCollapsedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-partial-results :items="items" :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-partial-results>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PartialResults } from "@adamstavely/trenchcoat/angular/partial-results";
import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";

@Component({
  selector: "app-partial-results-example",
  imports: [PartialResults],
  template: `<tc-partial-results [items]="items()" [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-partial-results>`,
})
export class PartialResultsExample {
  readonly items = input.required<TcPartialResults["items"]>();
  readonly collapsed = input.required<TcPartialResults["collapsed"]>();
  onCollapsedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/partial-results";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";

  let { items, collapsed }: { items: TcPartialResults["items"]; collapsed: TcPartialResults["collapsed"] } = $props();
  let el: TcPartialResults;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-partial-results bind:this={el} {items} {collapsed}></tc-partial-results>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Partial results"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading – what the run was |
| `items` | – | `PartialResultItem[]` | `[]` | The items: every one, or only the unfinished ones with `done` and `total` |
| `total` | `total` | `number \| undefined` | `undefined` | How many there were in all; by default the items' count |
| `done` | `done` | `number \| undefined` | `undefined` | How many finished; by default the items marked done |
| `variant` | `variant` | `PartialResultsVariant` | `"card"` | "card", the whole picture, or "notice", one line and a Retry |
| `collapsed` | – | `string[]` | `[]` | The reasons whose groups are closed. Changed by the user unless a tc-collapsed-change listener calls preventDefault() |
| `retrying` | – | `string[]` | `[]` | Ids being retried; set by Retry unless its listener calls preventDefault(), and cleared for an item when the page replaces it |
| `hideContinue` | `hide-continue` | `boolean` | `false` | Hide Continue, for a run with nothing to continue to |
| `hideDownload` | `hide-download` | `boolean` | `false` | Hide Download the list |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers |
| `labels` | – | `Partial<PartialResultsLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-collapsed-change` | – | Yes | A reason group was opened or closed ({ collapsed }: PartialResultsCollapsedChange); cancelable – prevented, `collapsed` stays as it was |
| `tc-retry` | – | Yes | Retry was pressed, for one item or every failed one ({ ids, items }: PartialResultsRetry); cancelable – prevented, they aren't marked retrying |
| `tc-continue` | – | No | Continue with what finished was pressed ({ done }: PartialResultsContinue) |
| `tc-export` | – | Yes | Download the list was pressed ({ items, csv }: PartialResultsExport); cancelable – prevented, nothing is saved |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ptr-bar` | `var(--tc-space-2)` | both |

#### Design tokens it reads (47)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-slowest`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-meter-track`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-partial-results :items="…">` | `<tc-partial-results [items]="…">` | `<tc-partial-results {items}>` |
| `collapsed` | `el.collapsed = …;` | `<… collapsed={…} />` | `<tc-partial-results :collapsed="…">` | `<tc-partial-results [collapsed]="…">` | `<tc-partial-results {collapsed}>` |
| `retrying` | `el.retrying = …;` | `<… retrying={…} />` | `<tc-partial-results :retrying="…">` | `<tc-partial-results [retrying]="…">` | `<tc-partial-results {retrying}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-partial-results :labels="…">` | `<tc-partial-results [labels]="…">` | `<tc-partial-results {labels}>` |

*Also attributes: `heading`, `description`, `total`, `done`, `variant`, `hide-continue`, `hide-download`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |
| `tc-retry` | Yes | `el.addEventListener("tc-retry", (e) => …)` | `onTcRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-continue` | No | `el.addEventListener("tc-continue", (e) => …)` | `onTcContinue={…}` | `@tc-continue="…"` | `(tc-continue)="…($event)"` | `el.addEventListener("tc-continue", …)` |
| `tc-export` | Yes | `el.addEventListener("tc-export", (e) => …)` | `onTcExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `collapsed` itself unless a listener calls `preventDefault()` on `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-partial-results id="partial-results"></tc-partial-results>

<script type="module">
  import "@adamstavely/trenchcoat/partial-results";

  const el = document.querySelector("#partial-results");
  el.addEventListener("tc-collapsed-change", (e) => {
    e.preventDefault(); // the element keeps its collapsed…
    if (allowed(e.detail.collapsed)) el.collapsed = e.detail.collapsed; // …until the app sets it
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
import "@adamstavely/trenchcoat/partial-results";
import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";

const props = defineProps<{ initial: TcPartialResults["collapsed"] }>();
const collapsed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCollapsedChange = (e: CustomEvent<{ collapsed: TcPartialResults["collapsed"] }>) => {
  e.preventDefault();
  collapsed.value = e.detail.collapsed;
};
</script>

<template>
  <tc-partial-results :collapsed="collapsed" @tc-collapsed-change="onCollapsedChange"></tc-partial-results>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PartialResults } from "@adamstavely/trenchcoat/angular/partial-results";
import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";

@Component({
  selector: "app-controlled-partial-results",
  imports: [PartialResults],
  template: `<tc-partial-results [collapsed]="collapsed()" (tc-collapsed-change)="onCollapsedChange($event)"></tc-partial-results>`,
})
export class ControlledPartialResults {
  readonly initial = input.required<TcPartialResults["collapsed"]>();
  readonly collapsed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCollapsedChange(e: CustomEvent<{ collapsed: TcPartialResults["collapsed"] }>) {
    e.preventDefault();
    this.collapsed.set(e.detail.collapsed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/partial-results";
  import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";

  let { initial }: { initial: TcPartialResults["collapsed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let collapsed = $derived(initial);
  let el: TcPartialResults;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      collapsed = (e as CustomEvent<{ collapsed: TcPartialResults["collapsed"] }>).detail.collapsed;
    };
    el.addEventListener("tc-collapsed-change", on);
    return () => el.removeEventListener("tc-collapsed-change", on);
  });
</script>

<tc-partial-results bind:this={el} {collapsed}></tc-partial-results>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-partial-results")` returns a `TcPartialResults` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";`
- **React / Next.js:** Props: `import type { PartialResultsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PartialResults>`. The element class, for refs: `import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPartialResults["items"]` with `import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";`
- **Angular:** The directive types the template: `[items]` takes `TcPartialResults["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPartialResults } from "@adamstavely/trenchcoat/partial-results";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Partial results" |
| `collapsed` | `string[]` | The reasons whose groups are closed – controlled when given |
| `defaultCollapsed` | `string[]` | The closed groups on mount when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: string[]) => void` | A group was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `collapsed`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ | Move between reason groups |
| Home / End | Go to the first or last group |
| Enter / Space | Open or close a group |
| Tab | Moves through the groups, each open group's Retry buttons, then the actions |

### Screen readers

The bar is an image named with every count in words ("34 finished, 5 failed, 1 skipped"); its legend repeats it visually and is hidden from screen readers. Each group is a button with `aria-expanded`. Each item's Retry is named with the item ("Retry Case 2041 – bank statements.pdf"). Status is a word and a shape as well as a colour. `role="status"` announces what's being retried.

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

## Performance

*Measured 2026-11-23 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.0 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **27.4 KB** | **8.7 KB** |
| With Lit – the first component on a page | 48.1 KB | 15.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of items replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.3 ms | items: first render, 7 nodes; update 0.5 ms |
| 1,000 items | 2.2 ms | items: first render, 7 nodes; update 0.9 ms |

What it renders doesn't grow with items (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `reason` as what went wrong, in a few plain words – "Couldn't open the file", "Timed out" – since items are grouped by it, so reuse the same words for the same cause. Put the specifics in `detail`. Give every item, or `done` and `total` as numbers with only the unfinished ones in `items`. Anything `total` counts that isn't listed shows as skipped.

## Do and don't

### Do

- Say how many finished first. That's what can be used now.
- Replace an item when its retry ends, finished or failed again, so it stops showing as retrying.

### Don't

- Don't treat a partial run as a failure and throw away what finished.
- Don't retry skipped items with Retry failed. They were left out on purpose.

## Related

- [Agent Findings](agent-findings.md) – A group of agents checking something – one row per agent with its progress, beside a feed of what they've found, newest first, with severity in words, filters and new findings announced
- [Run Estimate](run-estimate.md) – What a bulk AI run will cost before it starts – the cost as a low–high range, cells, tokens, web lookups and time in words and figures, a table of where the money goes, the budget left with a warning when the run could go over it, Run on 50 rows first, a spend cap, and Start
- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Toaster](toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
