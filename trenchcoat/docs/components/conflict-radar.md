<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Conflict Radar

**Agents** · New

Which parallel agents touch the same files and where they collide – a grid of files by agents, conflicts first, status in words, and who changed which lines

- **Element:** `<tc-conflict-radar>`
- **Size:** 9.1 KB gzip · 31.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/conflict-radar";` |
| React / Next.js | `import { ConflictRadar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/conflict-radar";` · tags starting with tc- are custom elements |
| Angular | `import { ConflictRadar } from "@adamstavely/trenchcoat/angular/conflict-radar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/conflict-radar";` |

## Example

The live example is in the gallery at `#/conflict-radar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Which agents working in parallel touch the same files, and where they collide. Each row is a file and each column an agent, with conflicts first, and picking a file shows who touched which lines. A conflict can be settled by keeping one agent's way, and with `mergeable` a merge button waits until none are left.

### When to use

- Several agents working on their own branches at once.
- Deciding what to merge first, or which agent to stop.

### When not to use

- Reading a file's changes – use [Inline Diff](inline-diff.md).
- Watching how far many workers have got – use [Fan-out Grid](fan-out-grid.md).
- Two people disagreeing about a verdict – use [Review Conflict](review-conflict.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filters** `.ui-cfr__filters` – All and Conflicts, with how many
2. **Grid** `.ui-cfr__grid` – files by agents
3. **File** `.ui-cfr__file` – the path and `.ui-cfr__status`, in a word and a mark
4. **Cell** `.ui-cfr__cell` – the lines that agent changed
5. **Detail** `.ui-cfr__detail` – who touched what, with `.ui-cfr__resolve`
6. **Legend** `.ui-cfr__legend` – what the cells mean, in words
7. **Ways** `.ui-cfr__ways` – each agent's `.ui-cfr__approach` to keep, with `.ui-cfr__unsettle` to undo
8. **Merge** `.ui-cfr__merge` – with `mergeable`, and `.ui-cfr__left` saying how many conflicts are left

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. On a narrow page the grid scrolls in its own box, with the file column staying put.

## Usage

### HTML

```html
<tc-conflict-radar id="radar"></tc-conflict-radar>

<script type="module">
  import "@adamstavely/trenchcoat/conflict-radar";
  import "@adamstavely/trenchcoat/tokens.css";

  const radar = document.querySelector("#radar");
  radar.agents = [{ id: "a", name: "Schema agent", branch: "schema-v3" }, { id: "b", name: "Import agent" }];
  radar.files = [{ path: "src/schema.ts", edits: [{ agent: "a", lines: [12, 60] }, { agent: "b", lines: [48, 75] }] }];
</script>
```

### React / Next.js

```tsx
import { ConflictRadar, type ConflictAgent, type ConflictFile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents: ConflictAgent[] = [{ id: "a", name: "Schema agent" }, { id: "b", name: "Import agent" }];
const files: ConflictFile[] = [{ path: "src/schema.ts", edits: [{ agent: "a", lines: [12, 60] }, { agent: "b", lines: [48, 75] }] }];

export function Radar() {
  return <ConflictRadar agents={agents} files={files} onResolve={(f) => console.log(f.path)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/conflict-radar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";

defineProps<{ agents: TcConflictRadar["agents"]; files: TcConflictRadar["files"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-conflict-radar :agents="agents" :files="files" @tc-selected-change="onSelectedChange"></tc-conflict-radar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ConflictRadar } from "@adamstavely/trenchcoat/angular/conflict-radar";
import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";

@Component({
  selector: "app-conflict-radar-example",
  imports: [ConflictRadar],
  template: `<tc-conflict-radar [agents]="agents()" [files]="files()" (tc-selected-change)="onSelectedChange($event)"></tc-conflict-radar>`,
})
export class ConflictRadarExample {
  readonly agents = input.required<TcConflictRadar["agents"]>();
  readonly files = input.required<TcConflictRadar["files"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/conflict-radar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";

  let { agents, files }: { agents: TcConflictRadar["agents"]; files: TcConflictRadar["files"] } = $props();
  let el: TcConflictRadar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-conflict-radar bind:this={el} {agents} {files}></tc-conflict-radar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Conflict radar"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `agents` | – | `ConflictAgent[]` | `[]` | The agents, one column each |
| `files` | – | `ConflictFile[]` | `[]` | The files being changed |
| `selected` | `selected` | `string \| null` | `null` | The open file's path. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `filter` | `filter` | `ConflictFilter` | `"all"` | "all" or "conflicts". Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `settled` | – | `ConflictSettled` | `{}` | Which agent's way is kept, by file path. Changed by the user unless a tc-settled-change listener calls preventDefault() |
| `mergeable` | `mergeable` | `boolean` | `false` | Show the merge button, enabled once no conflict is unsettled |
| `mergeLabel` | `merge-label` | `string \| undefined` | `undefined` | The merge button's words; {n} is how many agents. By default "Merge {n} branches" |
| `labels` | – | `Partial<ConflictRadarLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A file was opened or closed ({ selected, file }: ConflictSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-filter-change` | – | Yes | The filter changed ({ filter }: ConflictFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-resolve` | – | No | Resolve was pressed ({ file }: ConflictResolve) |
| `tc-settled-change` | – | Yes | A way was kept or undone ({ settled, file, agent }: ConflictSettledChange); cancelable – prevented, `settled` stays as it was |
| `tc-merge` | – | Yes | Merge was pressed ({ settled }: ConflictMerge); cancelable – prevented, nothing is announced |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cfr-bg` | `var(--tc-surface-on-tray)` | both, standard |

#### Design tokens it reads (48)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `conflictStatus(file: ConflictFile): ConflictStatus` | A file's status: its own, or worked out from who touched which lines |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-conflict-radar :agents="…">` | `<tc-conflict-radar [agents]="…">` | `<tc-conflict-radar {agents}>` |
| `files` | `el.files = …;` | `<… files={…} />` | `<tc-conflict-radar :files="…">` | `<tc-conflict-radar [files]="…">` | `<tc-conflict-radar {files}>` |
| `settled` | `el.settled = …;` | `<… settled={…} />` | `<tc-conflict-radar :settled="…">` | `<tc-conflict-radar [settled]="…">` | `<tc-conflict-radar {settled}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-conflict-radar :labels="…">` | `<tc-conflict-radar [labels]="…">` | `<tc-conflict-radar {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `filter`, `mergeable`, `merge-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-resolve` | No | `el.addEventListener("tc-resolve", (e) => …)` | `onResolve={…}` | `@tc-resolve="…"` | `(tc-resolve)="…($event)"` | `el.addEventListener("tc-resolve", …)` |
| `tc-settled-change` | Yes | `el.addEventListener("tc-settled-change", (e) => …)` | `onSettledChange={…}` | `@tc-settled-change="…"` | `(tc-settled-change)="…($event)"` | `el.addEventListener("tc-settled-change", …)` |
| `tc-merge` | Yes | `el.addEventListener("tc-merge", (e) => …)` | `onTcMerge={…}` | `@tc-merge="…"` | `(tc-merge)="…($event)"` | `el.addEventListener("tc-merge", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected`, `filter` and `settled` itself unless a listener calls `preventDefault()` on `tc-selected-change`, `tc-filter-change` or `tc-settled-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-conflict-radar id="conflict-radar"></tc-conflict-radar>

<script type="module">
  import "@adamstavely/trenchcoat/conflict-radar";

  const el = document.querySelector("#conflict-radar");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ConflictRadar } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ConflictRadar>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledConflictRadar({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <ConflictRadar {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/conflict-radar";
import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";

const props = defineProps<{ initial: TcConflictRadar["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcConflictRadar["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-conflict-radar :selected="selected" @tc-selected-change="onSelectedChange"></tc-conflict-radar>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ConflictRadar } from "@adamstavely/trenchcoat/angular/conflict-radar";
import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";

@Component({
  selector: "app-controlled-conflict-radar",
  imports: [ConflictRadar],
  template: `<tc-conflict-radar [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-conflict-radar>`,
})
export class ControlledConflictRadar {
  readonly initial = input.required<TcConflictRadar["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcConflictRadar["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/conflict-radar";
  import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";

  let { initial }: { initial: TcConflictRadar["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcConflictRadar;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcConflictRadar["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-conflict-radar bind:this={el} {selected}></tc-conflict-radar>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-conflict-radar")` returns a `TcConflictRadar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";`
- **React / Next.js:** Props: `import type { ConflictRadarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ConflictRadar>`. The element class, for refs: `import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConflictRadar["agents"]` with `import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";`
- **Angular:** The directive types the template: `[agents]` takes `TcConflictRadar["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConflictRadar } from "@adamstavely/trenchcoat/conflict-radar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Conflict radar" |
| `selected` | `string \| null` | The open file's path – controlled when given |
| `defaultSelected` | `string \| null` | The open file on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, file: ConflictFile \| null) => void` | A file was opened or closed |
| `filter` | `ConflictFilter` | "all" or "conflicts" – controlled when given |
| `defaultFilter` | `ConflictFilter` | The filter on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: ConflictFilter) => void` | The filter changed |
| `onResolve` | `(file: ConflictFile) => void` | Resolve was pressed |
| `settled` | `ConflictSettled` | Which agent's way is kept, by file path – controlled when given |
| `defaultSettled` | `ConflictSettled` | What's kept on mount when `settled` isn't controlled |
| `onSettledChange` | `(settled: ConflictSettled, detail: ConflictSettledChange) => void` | A way was kept or undone |

*Renamed or hidden on the wrapper: `heading`, `selected`, `filter`, `settled`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between cells |
| Home / End | Go to the row's ends |
| Enter / Space | Opens or closes the file |
| Escape | Closes the file |
| Tab | From the grid to the ways to keep, then the buttons |
| ↑ ↓ ← → in the ways | Move through the ways and keep one |

### Screen readers

It's a `grid` named by the heading, with one tab stop and its keys in a hidden description. Files are row headers, agents column headers, and an empty cell says Not touched. Status is always a word, and `role="status"` says how many conflicts there are. The ways are a `radiogroup` named for the file, Settled and Kept are words with a mark, and a disabled Merge is described by how many are left.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-31 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.0 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.3 KB** | **9.1 KB** |
| With Lit – the first component on a page | 53.7 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 128 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of agents replaced |
| First on the page | 9.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.1 ms | agents: first render, 1,292 nodes; update 0.7 ms |
| 1,000 items | 45 ms | agents: first render, 12,092 nodes; update 5.7 ms |

1,000 items of agents: 45 ms, 12,092 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

Give `lines` wherever you know them, because only crossing line ranges count as a conflict. Without them, two agents on a file is an overlap. A file's own `status` wins, for when your merge tool knows better. Write `approach` as one plain sentence on what the agent's way does, so the choice can be made without reading the diff. Only a conflict can be settled, and a `settled` entry naming an agent that didn't touch the file is ignored.

## Do and don't

### Do

- Keep `branch` short, because it sits in a column header.
- Listen for `tc-resolve` and start your own merge flow.
- Save `settled` on `tc-settled-change`, and run the merge on `tc-merge`. The element only records the choice and asks.

### Don't

- Don't read Clear as safe to merge. Two changes can break each other without touching the same lines.

## Related

- [Fan-out Grid](fan-out-grid.md) – One agent hands a big job to many workers – every task a cell on a live grid that fills in as they get through it, with retries, failures, cost and the time left, and the details of any task on hover
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Parallel Attempts](parallel-attempts.md) – An agent tries the same task several ways at once and the best one wins – every attempt races as a row with its model, approach and live bar, then gets a score; the best is marked and picked, and you can switch to another
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo

## Changelog

- **Conflict Radar** (`tc-conflict-radar`), **Scheduled Runs** (`tc-scheduled-runs`), **Fallback Chain** (`tc-fallback-chain`), **Agent Handoff** (`tc-agent-handoff`), **Agent Findings** (`tc-agent-findings`) and **Agent Monitor** (`tc-agent-monitor`): where parallel agents collide, tasks across a week's sessions, one request finding a model, what's lost between agents, what a group of agents found, and one agent at work.
