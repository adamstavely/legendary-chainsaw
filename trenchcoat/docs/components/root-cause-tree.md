<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Root Cause Tree

**Agents** · New

How an agent finds out why something failed, as a fault tree – hypotheses with their evidence ruled out one by one, OR and AND branches, and the way from the confirmed cause up to the failure lit

- **Element:** `<tc-root-cause-tree>`
- **Size:** 9.5 KB gzip · 30.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/root-cause-tree";` |
| React / Next.js | `import { RootCauseTree } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/root-cause-tree";` · tags starting with tc- are custom elements |
| Angular | `import { RootCauseTree } from "@adamstavely/trenchcoat/angular/root-cause-tree";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/root-cause-tree";` |

## Example

The live example is in the gallery at `#/root-cause-tree`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How an agent finds out why something failed, drawn as a fault tree. The failure sits at the top, and the hypotheses
that could explain it sit underneath, each with the evidence it's checked against: a file, a log, a table. Narrower
hypotheses nest under broader ones, and a branch says how its children combine. OR means any one of them could cause
it; AND means only all of them together. As the agent works, the page updates each hypothesis: not checked, checking,
ruled out or confirmed. Ruled-out branches go quiet. Once a hypothesis is confirmed, the way from it up to the failure
lights up, drawn from the cause upwards. The header sums it up in words: "5 hypotheses · 2 ruled out", then
"Cause found". Open any node for its evidence and what the agent found.

### When to use

- Showing an agent's investigation of a failed run, test, import or deploy while it happens, and its result after.
- Any diagnosis where several suspects are checked against evidence and most are ruled out.
- Letting someone check the agent's reasoning: what it ruled out, on what evidence, and why it settled on the cause.

### When not to use

- Questions the agent puts to a person, with branches for the answers – use [Decision Tree](decision-tree.md).
- Several agents reporting findings as they go, without a tree of suspects – use [Agent Findings](agent-findings.md).
- A chain of linked items across stages – use [Traceability Spine](traceability-spine.md).
- The raw commands and output the agent ran – use [Sandbox Log](sandbox-log.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-rct__summary` – in the header: how many hypotheses, how many ruled out, and the state in words
2. **Tree** `.ui-rct__board` – the drawing, kept at its size and scrolled sideways when the card is narrower
3. **Node** `.ui-rct__node` – the failure or a hypothesis: its status mark and word, title and evidence
4. **Status** `.ui-rct__status` – the mark and the word: Not checked, Checking, Ruled out, Confirmed
5. **Evidence** `.ui-rct__ref` – what the node was checked against, in monospace
6. **Gate** `.ui-rct__gate` – OR or AND where a branch splits
7. **Lines** `.ui-rct__lines` – the links between nodes; a ruled-out branch's are dashed
8. **Lit way up** `.ui-rct__glow` – from the confirmed cause to the failure, drawn link by link
9. **Panel** `.ui-rct__panel` – the open node's status, evidence, finding and how its children combine

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The tree is the same in both. The colour of the lit way up comes from `--tc-rct-path` (the danger
colour by default) and how long each link takes to draw from `--tc-rct-draw`; set either on the element. With reduced
motion the way up appears at once and the Checking mark doesn't turn.

## Usage

### HTML

```html
<tc-root-cause-tree id="why" heading="Why did the import fail?"></tc-root-cause-tree>

<script type="module">
  import "@adamstavely/trenchcoat/root-cause-tree";
  import "@adamstavely/trenchcoat/tokens.css";

  const why = document.querySelector("#why");
  why.failure = { title: "Nightly survey import failed", ref: "import.log", detail: "4 of 12 batches" };
  why.hypotheses = [
    { id: "schema", title: "Survey CSV schema changed", ref: "survey.csv", status: "confirmed", note: "A new column shifted depth." },
    { id: "stations", title: "Station codes are stale", ref: "stations.json", status: "ruled-out", note: "All codes are current." },
    { id: "geocode", title: "Geocoding service timed out", ref: "geocode.log", status: "checking" },
  ];
  why.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.node));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RootCauseTree, type RootCauseHypothesis } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const hypotheses: RootCauseHypothesis[] = [
  { id: "schema", title: "Survey CSV schema changed", ref: "survey.csv", status: "confirmed" },
  { id: "stations", title: "Station codes are stale", ref: "stations.json", status: "ruled-out" },
];

export function Investigation() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <RootCauseTree
      title="Why did the import fail?"
      failure={{ title: "Nightly survey import failed", ref: "import.log" }}
      hypotheses={hypotheses}
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/root-cause-tree";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";

defineProps<{ failure: TcRootCauseTree["failure"]; hypotheses: TcRootCauseTree["hypotheses"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-root-cause-tree :failure="failure" :hypotheses="hypotheses" @tc-selected-change="onSelectedChange"></tc-root-cause-tree>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RootCauseTree } from "@adamstavely/trenchcoat/angular/root-cause-tree";
import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";

@Component({
  selector: "app-root-cause-tree-example",
  imports: [RootCauseTree],
  template: `<tc-root-cause-tree [failure]="failure()" [hypotheses]="hypotheses()" (tc-selected-change)="onSelectedChange($event)"></tc-root-cause-tree>`,
})
export class RootCauseTreeExample {
  readonly failure = input.required<TcRootCauseTree["failure"]>();
  readonly hypotheses = input.required<TcRootCauseTree["hypotheses"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/root-cause-tree";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";

  let { failure, hypotheses }: { failure: TcRootCauseTree["failure"]; hypotheses: TcRootCauseTree["hypotheses"] } = $props();
  let el: TcRootCauseTree;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-root-cause-tree bind:this={el} {failure} {hypotheses}></tc-root-cause-tree>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Root cause"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `failure` | – | `RootCauseFailure \| null` | `null` | What failed – the top of the tree |
| `hypotheses` | – | `RootCauseHypothesis[]` | `[]` | The hypotheses directly under the failure, with narrower ones nested in `children` |
| `gate` | `gate` | `RootCauseGate` | `"or"` | How the top hypotheses combine – "or" by default |
| `selected` | – | `string \| null` | `null` | The node whose evidence is open. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `statusLabels` | – | `Partial<Record<RootCauseStatus, string>>` | `{}` | The status words, merged over defaultRootCauseLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A node was opened or closed ({ selected, node }: RootCauseSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rct-path` | `var(--tc-status-danger-solid)` | both |
| `--tc-rct-draw` | `var(--tc-duration-slow)` | both |
| `--tc-rct-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (64)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `failure` | `el.failure = …;` | `<… failure={…} />` | `<tc-root-cause-tree :failure="…">` | `<tc-root-cause-tree [failure]="…">` | `<tc-root-cause-tree {failure}>` |
| `hypotheses` | `el.hypotheses = …;` | `<… hypotheses={…} />` | `<tc-root-cause-tree :hypotheses="…">` | `<tc-root-cause-tree [hypotheses]="…">` | `<tc-root-cause-tree {hypotheses}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-root-cause-tree :selected="…">` | `<tc-root-cause-tree [selected]="…">` | `<tc-root-cause-tree {selected}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-root-cause-tree :statusLabels="…">` | `<tc-root-cause-tree [statusLabels]="…">` | `<tc-root-cause-tree {statusLabels}>` |

*Also attributes: `heading`, `description`, `gate` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-root-cause-tree id="root-cause-tree"></tc-root-cause-tree>

<script type="module">
  import "@adamstavely/trenchcoat/root-cause-tree";

  const el = document.querySelector("#root-cause-tree");
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
import "@adamstavely/trenchcoat/root-cause-tree";
import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";

const props = defineProps<{ initial: TcRootCauseTree["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcRootCauseTree["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-root-cause-tree :selected="selected" @tc-selected-change="onSelectedChange"></tc-root-cause-tree>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RootCauseTree } from "@adamstavely/trenchcoat/angular/root-cause-tree";
import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";

@Component({
  selector: "app-controlled-root-cause-tree",
  imports: [RootCauseTree],
  template: `<tc-root-cause-tree [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-root-cause-tree>`,
})
export class ControlledRootCauseTree {
  readonly initial = input.required<TcRootCauseTree["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcRootCauseTree["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/root-cause-tree";
  import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";

  let { initial }: { initial: TcRootCauseTree["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcRootCauseTree;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcRootCauseTree["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-root-cause-tree bind:this={el} {selected}></tc-root-cause-tree>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-root-cause-tree")` returns a `TcRootCauseTree` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";`
- **React / Next.js:** Props: `import type { RootCauseTreeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RootCauseTree>`. The element class, for refs: `import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRootCauseTree["failure"]` with `import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";`
- **Angular:** The directive types the template: `[failure]` takes `TcRootCauseTree["failure"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRootCauseTree } from "@adamstavely/trenchcoat/root-cause-tree";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `selected` | `string \| null` | The node whose evidence is open – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The node open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, node: RootCauseHypothesis \| RootCauseFailure \| null) => void` | A node was opened or closed, with the hypothesis (or the failure) it belongs to |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The nodes are one tab stop; inside the tree the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next node in reading order |
| → | Moves to the node's first child |
| ← | Moves to the node's parent |
| Home / End | Moves to the failure, or to the last node |
| Enter / Space | Opens the node's evidence below the tree, or closes it if it's open |
| Escape | Closes the evidence |
| Tab | Leaves the tree; the panel's Close button comes after it |

### Screen readers

The drawing is a tree named by the heading and described by "Arrow keys move through the tree; Enter opens a node's
evidence". Each node is a tree item with its level, its place among its siblings and whether it's open. Its name is
its status word, title and evidence, and for a branch how its children combine: "Only all 2 below together could
cause this". Opening a node is confirmed in a polite status message, "Opened Station codes are stale", and a newly
confirmed cause is announced: "Cause found: Survey CSV schema changed". The marks, lines and gates are hidden; the
words carry them.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.7 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.0 KB** | **9.5 KB** |
| With Lit – the first component on a page | 51.8 KB | 16.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 103 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of hypotheses replaced |
| First on the page | 8.6 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.5 ms | hypotheses: first render, 1,414 nodes; update 1.1 ms |
| 1,000 items | 78 ms | hypotheses: first render, 13,834 nodes; update 6.9 ms |

1,000 items of hypotheses: 78 ms. It renders every item, so a first render passes 50 ms (a long task) at about 640 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write hypotheses as short claims that can be true or false: "Station codes are stale", not "Station codes?".
- Make `ref` the thing the agent checked: a file name, a log, a table.
- Put what the agent found in `note`, in a sentence, for ruled-out and confirmed nodes alike.
- Use `gate: "and"` only when the cause needs all the children together; OR is the default.

## Do and don't

### Do

- Update the hypotheses as the agent works, so people can watch it narrow down.
- Mark the cause and its parent hypothesis confirmed, so the whole way up lights.
- Keep the tree to two or three levels and a handful of hypotheses at each.

### Don't

- Don't remove ruled-out hypotheses; seeing what was excluded is the point.
- Don't put long logs in a note; link to the log with `ref` and summarise it.
- Don't use the tree for steps the agent will take; use a plan for that.

## Related

- [Decision Tree](decision-tree.md) – An agent stuck on a decision lays out its options as a tree – the consequences of each branch, the risky ones marked, its own pick highlighted – and you choose a path or write your own
- [Agent Findings](agent-findings.md) – A group of agents checking something – one row per agent with its progress, beside a feed of what they've found, newest first, with severity in words, filters and new findings announced
- [Traceability Spine](traceability-spine.md) – The chain from open questions to outcomes – a column per stage from questions and gaps to work, papers and who cites them, linked cards joined by lines, and a card's whole path traced on click with the rest dimmed
- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs

## Changelog

- **Root Cause Tree** (`tc-root-cause-tree`): a fault tree of hypotheses an agent checks one by one – each says Not checked, Checking, Ruled out or Confirmed; OR and AND branches; ruled-out branches mute and the way from the confirmed cause up to the failure is drawn link by link. A tree with arrow keys and an evidence panel.
