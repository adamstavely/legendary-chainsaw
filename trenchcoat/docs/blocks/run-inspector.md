<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Run Inspector

**Blocks** · New

One multi-agent run on one screen – its status, duration, cost, tokens, calls and errors on top, who started whom as agent cards with each agent's calls as small bars, and a call opened right under its row with its error first (uses `tool-call-card`)

- **Element:** `<tc-run-inspector>`
- **Size:** 17.9 KB gzip · 69.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-inspector";` |
| React / Next.js | `import { RunInspector } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-inspector";` · tags starting with tc- are custom elements |
| Angular | `import { RunInspector } from "@adamstavely/trenchcoat/angular/run-inspector";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-inspector";` |

## Example

The live example is in the gallery at `#/blocks/run-inspector`, in both looks; Replay restarts its animations.

## Overview

One multi-agent run on one screen. On top, the run's numbers: its status in a mark and a word, how long it took, what
it cost, the tokens, the calls and the errors. Below, who started whom as a tree of agent cards, each with its own
calls – LLM and tool calls – as rows with a small bar on the agent's own time span. A click on a call opens it right
under its row in the library's Tool Call Card, its error first when it failed. Each card shows its first `call-limit`
calls and “Show N more”. The data is a Trace Waterfall span tree: agents and sub-agents are cards, their `llm` and
`tool` children are calls.

### When to use

- Looking into one run after it finished, or while it runs: what each agent did and which call went wrong.
- Debugging a failed run, starting from the error count and the red card.
- Showing a run's cost and tokens next to the calls that spent them.

### When not to use

- Where the time of a run went, on one shared axis – use [Trace Waterfall](../components/trace-waterfall.md).
- Who started whom, without the calls – use [Agent Tree](../components/agent-tree.md).
- A single call on its own – use [Tool Call Card](../components/tool-call-card.md).
- What happened across many runs while you were away – use [Agent Recap](../components/agent-recap.md).

## Anatomy

1. **Numbers** `.ui-rins__top` – the header and the run's status, duration, cost, tokens, calls and errors
2. **Agent** `.ui-rins__card` – an agent or sub-agent: its name, its role and model, its status, its own cost and time
3. **Call** `.ui-rins__call` – an LLM or tool call: its kind, name, a bar on the agent's time span and how long it took
4. **Detail** `.ui-rins__detail` – the open call, in a Tool Call Card
5. **More** `.ui-rins__more` – “Show N more” or “Show fewer”

## Looks

Standard sets the numbers on a gray tray, each one on a white tile, and the agent cards white on the page. Clean puts
the numbers on one white card with sunken tiles. A failed agent's card has a red hairline in both. Sub-agents step in
under a line; narrow, they step in less and each call's bar moves under its name.

## Usage

### HTML

```html
<tc-run-inspector id="run" call-limit="4"></tc-run-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/run-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const S = 1000;
  const run = document.querySelector("#run");
  run.root = {
    id: "run",
    name: "Winter service-change notice",
    kind: "agent",
    status: "failed",
    model: "Opus 5.5",
    start: 0,
    end: 140 * S,
    children: [
      { id: "l1", name: "Plan the notice", kind: "llm", status: "done", start: 0, end: 9 * S, tokensIn: 4200, tokensOut: 910, cost: 0.11 },
      {
        id: "translator",
        name: "Translator",
        kind: "subagent",
        status: "failed",
        detail: "Translate the notice into Spanish",
        start: 84 * S,
        end: 140 * S,
        children: [
          { id: "t1", name: "read_file", kind: "tool", status: "failed", detail: "route-names-glossary.csv", start: 86 * S, end: 88 * S, error: "Permission denied" },
          { id: "t2", name: "Translate to Spanish", kind: "llm", status: "done", start: 89 * S, end: 120 * S, tokensIn: 5200, tokensOut: 5600, cost: 0.09 },
        ],
      },
    ],
  };
  run.selected = "t1";
  run.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RunInspector, type InspectorSpan } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const S = 1000;
const run: InspectorSpan = {
  id: "run",
  name: "Winter service-change notice",
  kind: "agent",
  status: "done",
  start: 0,
  end: 70 * S,
  children: [
    {
      id: "planner",
      name: "Planner",
      kind: "subagent",
      status: "done",
      detail: "List every stop that changes",
      start: 10 * S,
      end: 70 * S,
      children: [
        { id: "p1", name: "timetable_lookup", kind: "tool", status: "done", detail: "routes 4, 12, 31", start: 12 * S, end: 30 * S, output: "212 stops, 41 changed" },
        { id: "p2", name: "Summarise changes", kind: "llm", status: "done", start: 31 * S, end: 52 * S, tokensIn: 9800, tokensOut: 1400, cost: 0.06 },
      ],
    },
  ],
};

export function Run() {
  const [selected, setSelected] = useState<string | null>(null);
  return <RunInspector root={run} selected={selected} onSelectedChange={(id) => setSelected(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-inspector";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";

defineProps<{ root: TcRunInspector["root"]; formatCost: TcRunInspector["formatCost"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-inspector :root="root" :formatCost="formatCost" @tc-selected-change="onSelectedChange"></tc-run-inspector>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunInspector } from "@adamstavely/trenchcoat/angular/run-inspector";
import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";

@Component({
  selector: "app-run-inspector-example",
  imports: [RunInspector],
  template: `<tc-run-inspector [root]="root()" [formatCost]="formatCost()" (tc-selected-change)="onSelectedChange($event)"></tc-run-inspector>`,
})
export class RunInspectorExample {
  readonly root = input.required<TcRunInspector["root"]>();
  readonly formatCost = input.required<TcRunInspector["formatCost"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-inspector";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";

  let { root, formatCost }: { root: TcRunInspector["root"]; formatCost: TcRunInspector["formatCost"] } = $props();
  let el: TcRunInspector;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-run-inspector bind:this={el} {root} {formatCost}></tc-run-inspector>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Run inspector"` | The heading |
| `root` | – | `TraceSpan` | `{ id: "run", name: "Run", kind: "agent", status: "done", start: 0, end: 0 }` | The run as a span tree: agents and sub-agents are cards, their llm and tool children are calls |
| `elapsed` | `elapsed` | `number \| undefined` | `undefined` | For a live run, ms since it started – running spans reach it. The block reads no clock of its own |
| `selected` | `selected` | `string \| null` | `null` | Id of the open call. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `callLimit` | `call-limit` | `number` | `6` | How many calls each card shows before "Show N more" |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – dollars by default, e.g. "$0.42" |
| `labels` | – | `Partial<RunInspectorLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A call was opened or closed ({ selected, span }: RunInspectorSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rins-indent` | `var(--tc-space-2)` | both |

#### Design tokens it reads (54)

`--tc-accent-text`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-h-sm`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-head-glyph-stroke`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `runNumbers(root: TraceSpan, elapsed?: number): void` | The run's numbers, from every span |

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
| `root` | `el.root = …;` | `<… root={…} />` | `<tc-run-inspector :root="…">` | `<tc-run-inspector [root]="…">` | `<tc-run-inspector {root}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-run-inspector :formatCost="…">` | `<tc-run-inspector [formatCost]="…">` | `<tc-run-inspector {formatCost}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-run-inspector :labels="…">` | `<tc-run-inspector [labels]="…">` | `<tc-run-inspector {labels}>` |

*Also attributes: `heading`, `elapsed`, `selected`, `call-limit` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-run-inspector id="run-inspector"></tc-run-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/run-inspector";

  const el = document.querySelector("#run-inspector");
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
import { RunInspector } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RunInspector>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledRunInspector({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <RunInspector {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/run-inspector";
import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";

const props = defineProps<{ initial: TcRunInspector["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcRunInspector["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-run-inspector :selected="selected" @tc-selected-change="onSelectedChange"></tc-run-inspector>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunInspector } from "@adamstavely/trenchcoat/angular/run-inspector";
import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";

@Component({
  selector: "app-controlled-run-inspector",
  imports: [RunInspector],
  template: `<tc-run-inspector [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-run-inspector>`,
})
export class ControlledRunInspector {
  readonly initial = input.required<TcRunInspector["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcRunInspector["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-inspector";
  import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";

  let { initial }: { initial: TcRunInspector["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcRunInspector;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcRunInspector["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-run-inspector bind:this={el} {selected}></tc-run-inspector>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-inspector")` returns a `TcRunInspector` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";`
- **React / Next.js:** Props: `import type { RunInspectorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunInspector>`. The element class, for refs: `import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunInspector["root"]` with `import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";`
- **Angular:** The directive types the template: `[root]` takes `TcRunInspector["root"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunInspector } from "@adamstavely/trenchcoat/run-inspector";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading (default "Run inspector") |
| `selected` | `string \| null` | Id of the open call, or null. Controlled when defined |
| `defaultSelected` | `string \| null` | The open call at first when uncontrolled |
| `onSelectedChange` | `(selected: string \| null, span: TraceSpan \| null) => void` | Called with the call that opened (or null when it closed) |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to each card's calls – one stop per card – and to its “Show N more” |
| ↑ / ↓ | Moves to the previous or next call of the card |
| Home / End | Moves to the card's first or last call |
| Enter / Space | Opens or closes the focused call |
| Escape | Closes the open call and returns focus to its row |

### Screen readers

The block is a region named by its heading. The numbers are a description list named “Run numbers”. The agents are
nested lists, the whole tree named “Agents in this run”; each agent is an article named by its name, and its calls a
list named “Calls: Translator”. Each call is a button with `aria-expanded` and `aria-controls` that reads its kind,
name, detail and time, and its status in a word when it's running or failed. Bars and marks are hidden; every status
is a word, never only a colour.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tool-call-card, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, tool-call-card | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | tool-call-card, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, tool-call-card, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | tool-call-card | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, tool-call-card, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | tool-call-card | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | tool-call-card | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 17.4 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| [tool-call-card](../components/tool-call-card.md) · Element it renders | 42.9 KB | – |
| **Added to a page that already has Lit** | **69.8 KB** | **17.9 KB** |
| With Lit – the first component on a page | 92.2 KB | 25.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | default properties, 45 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared` (tool-call-card), `setTimeout` (tool-call-card).
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver` (tool-call-card), `IntersectionObserver` (tool-call-card), `MutationObserver` (tool-call-card), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange` (tool-call-card).
- Reads the clock: `Date.now()` (tool-call-card).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role in the run (“Planner”, “Translator”), and put the model in `model`.
- Write an agent's `detail` as what it was asked: “Translate the notice into Spanish and Vietnamese”.
- Give a call's `detail` a few words – the file, the query, the target: “route-names-glossary.csv”.
- Write `error` as what went wrong and why: “Permission denied: the file is in a folder the agent can't read”.
- Give `start` and `end` in ms from the start of the run. For a live run, leave out `end` on what still runs and pass
  `elapsed`.
- Rename the words with `labels`, e.g. `{ more: "{count} more calls" }`.

## Do and don't

### Do

- Open the failed call at first with `selected`, so the reader starts at the error.
- Listen for `tc-selected-change` (`onSelectedChange` in React) to show the call elsewhere or keep it in the URL.
- Set `formatCost` when costs aren't in dollars.

### Don't

- Don't put sub-agents' calls under the lead – each call belongs to the agent that made it.
- Don't raise `call-limit` to show every call of a long run; “Show N more” is there for that.

## Related

- [Trace Waterfall](../components/trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Agent Tree](../components/agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Tool Call Card](../components/tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Agent Recap](../components/agent-recap.md) – What your agents did while you were away, for a home page – a small chart of the period with a bar per 15 or 30 minutes stacked by done, failed and needs you and a marker on each notable event, then Needs you, Failed and Done as columns acted on in place, items gliding out as they're handled, and Clear done
