<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Summary

**Agents** · New

One agent's profile – status, model, tools, owner, live and draft versions, two weeks of runs as a daily chart that switches to a table, success rate, median run and cost, recent failures with their errors, and Edit, Run test and Pause

- **Element:** `<tc-agent-summary>`
- **Size:** 8.1 KB gzip · 26.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-summary";` |
| React / Next.js | `import { AgentSummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-summary";` · tags starting with tc- are custom elements |
| Angular | `import { AgentSummary } from "@adamstavely/trenchcoat/angular/agent-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-summary";` |

## Example

The live example is in the gallery at `#/agent-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One agent's profile on a card: its status, model, tools, owner, and which version is live against a draft waiting to go out. Below that, two weeks of runs as a small daily chart of succeeded and failed runs, with the success rate, the median run time and the cost, and the recent failures with their errors. Edit, Run test and Pause or Resume sit at the bottom.

### When to use

- The top of an agent's page, opened from `agent-list`.
- A side panel that answers "is this agent healthy, and what broke?" at a glance.

### When not to use

- Every agent at once – use [Agent List](agent-list.md).
- One run as it happens – use [Agent Monitor](agent-monitor.md); one run's calls and costs – use [Trace Waterfall](trace-waterfall.md).
- The history of an agent's versions – use [Version History](version-history.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Facts** `.ui-agsm__facts` – `.ui-agsm__model`, `.ui-agsm__owner`, `.ui-agsm__version`s and the `.ui-agsm__tool` chips
2. **Figures** `.ui-agsm__figures` – `.ui-agsm__rate`, `.ui-agsm__median` and `.ui-agsm__cost`
3. **Chart** `.ui-agsm__chart` – a `.ui-agsm__bar` per day and kind, with `.ui-agsm__caption` holding the key and a summary
4. **Table** `.ui-agsm__table` – the same days as rows, shown by `.ui-agsm__toggle`
5. **Failures** `.ui-agsm__failure-list` – each `.ui-agsm__failure` with its `.ui-agsm__error`
6. **Actions** `.ui-agsm__actions` – Edit, Run test, and Pause or Resume

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agsm-chart-h`, the chart's height, and `--tc-agsm-mark`, the status mark's size.

## Usage

### HTML

```html
<tc-agent-summary id="agent" name="Invoice matcher" status="failing" model="Model M" owner="Finance operations"></tc-agent-summary>

<script type="module">
  import "@adamstavely/trenchcoat/agent-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#agent");
  const day = 86400000;
  const start = Date.UTC(2026, 10, 1);
  card.tools = ["Ledger search", "Purchase orders"];
  card.days = [6, 7, 5, 8, 7, 6, 9].map((runs, i) => ({ date: start + i * day, succeeded: runs - (i % 3 ? 0 : 2), failed: i % 3 ? 0 : 2 }));
  card.failures = [{ id: "f1", at: start + 6 * day, step: "Fetch purchase orders", error: "The export timed out after 30 s." }];
  card.addEventListener("tc-action", (e) => console.log(e.detail.action));
</script>
```

### React / Next.js

```tsx
import { AgentSummary, type AgentSummaryDay, type AgentSummaryFailure } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Agent({ days, failures }: { days: AgentSummaryDay[]; failures: AgentSummaryFailure[] }) {
  return (
    <AgentSummary
      name="Invoice matcher"
      status="live"
      model="Model M"
      tools={["Ledger search", "Purchase orders"]}
      days={days}
      failures={failures}
      onAction={(action) => console.log(action)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";

defineProps<{ tools: TcAgentSummary["tools"]; days: TcAgentSummary["days"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-summary :tools="tools" :days="days" @tc-action="onAction"></tc-agent-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentSummary } from "@adamstavely/trenchcoat/angular/agent-summary";
import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";

@Component({
  selector: "app-agent-summary-example",
  imports: [AgentSummary],
  template: `<tc-agent-summary [tools]="tools()" [days]="days()" (tc-action)="onAction($event)"></tc-agent-summary>`,
})
export class AgentSummaryExample {
  readonly tools = input.required<TcAgentSummary["tools"]>();
  readonly days = input.required<TcAgentSummary["days"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";

  let { tools, days }: { tools: TcAgentSummary["tools"]; days: TcAgentSummary["days"] } = $props();
  let el: TcAgentSummary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-agent-summary bind:this={el} {tools} {days}></tc-agent-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `"Agent"` | The agent's name, the heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the name: what the agent does |
| `status` | `status` | `AgentSummaryStatus` | `"live"` | Where it stands: "live", "draft", "paused" or "failing" |
| `model` | `model` | `string \| undefined` | `undefined` | The model it runs on |
| `tools` | – | `string[]` | `[]` | The tools it may call, as words |
| `owner` | `owner` | `string \| undefined` | `undefined` | Who owns it |
| `liveVersion` | `live-version` | `string \| undefined` | `undefined` | The version that's live, e.g. "v12" |
| `draftVersion` | `draft-version` | `string \| undefined` | `undefined` | A draft version waiting to go live, e.g. "v13" |
| `days` | – | `AgentSummaryDay[]` | `[]` | Runs per day, oldest first – usually the last 14 |
| `medianDuration` | `median-duration` | `number \| undefined` | `undefined` | The median run time, ms |
| `cost` | `cost` | `number \| undefined` | `undefined` | What the period cost |
| `currency` | `currency` | `string` | `"USD"` | The cost's currency, an ISO 4217 code |
| `failures` | – | `AgentSummaryFailure[]` | `[]` | Recent failures, newest first |
| `actions` | `actions` | `boolean` | `true` | Offer Edit, Run test and Pause / Resume; set actions="false" to only show |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates, numbers and money |
| `labels` | – | `Partial<AgentSummaryLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | Yes | Edit, Run test, Pause or Resume was pressed ({ action }: AgentSummaryActionDetail); cancelable – prevented, Pause and Resume leave `status` as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agsm-chart-h` | `var(--tc-space-16)` | both |
| `--tc-agsm-mark` | `var(--tc-space-2)` | both |

#### Design tokens it reads (42)

`--tc-action-secondary-shadow`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-radius-md`, `--tc-fill-default`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-normal`, `--tc-meter-fill`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `agentSummaryTotals(days: AgentSummaryDay[]): void` | Runs, successes and failures over the days, and the success rate (null with no runs) |

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
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-agent-summary :tools="…">` | `<tc-agent-summary [tools]="…">` | `<tc-agent-summary {tools}>` |
| `days` | `el.days = …;` | `<… days={…} />` | `<tc-agent-summary :days="…">` | `<tc-agent-summary [days]="…">` | `<tc-agent-summary {days}>` |
| `failures` | `el.failures = …;` | `<… failures={…} />` | `<tc-agent-summary :failures="…">` | `<tc-agent-summary [failures]="…">` | `<tc-agent-summary {failures}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-summary :labels="…">` | `<tc-agent-summary [labels]="…">` | `<tc-agent-summary {labels}>` |

*Also attributes: `name`, `description`, `status`, `model`, `owner`, `live-version`, `draft-version`, `median-duration` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

### Controlled

`tc-action` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-summary")` returns a `TcAgentSummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";`
- **React / Next.js:** Props: `import type { AgentSummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentSummary>`. The element class, for refs: `import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentSummary["tools"]` with `import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";`
- **Angular:** The directive types the template: `[tools]` takes `TcAgentSummary["tools"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentSummary } from "@adamstavely/trenchcoat/agent-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onAction` | `(action: AgentSummaryAction) => boolean \| void` | Edit, Run test, Pause or Resume was pressed; return false to stop Pause and Resume changing the status |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Show as table, then the actions |
| Enter / Space | Show or hide the table; press an action |

### Screen readers

The chart is drawn for the eye and hidden from screen readers; its caption says the totals in a sentence, and Show as table (a toggle button, `aria-pressed`) reveals the same days as a table with row and column headers. The facts are a description list. Failures are a list with the time in a `time` element. Status is a word beside its mark.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
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
| **This component alone** | 18.8 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.5 KB** | **8.1 KB** |
| With Lit – the first component on a page | 46.1 KB | 14.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 173 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of days replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.3 ms | days: first render, 689 nodes; update 2.5 ms |
| 1,000 items | 37 ms | days: first render, 6,089 nodes; update 27 ms |

1,000 items of days: 37 ms, 6,089 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- `days` are oldest first, usually the last 14, with `succeeded` and `failed` counts each.
- A failure's `error` says what went wrong in a sentence a person can act on; `step` names where.
- `liveVersion` and `draftVersion` are short labels, such as "v12" and "v13".

## Do and don't

### Do

- Listen for `tc-action` to really pause or resume the agent, and prevent it if that fails.
- Keep the tools to the words people use, not internal function names.

### Don't

- Don't rely on Edit or Run test to change anything on the card – they're the page's to act on.

## Related

- [Agent List](agent-list.md) – Every agent in a workspace, with the failing ones lifted into Needs attention and why in words – search, status chips, sort by name, last run, failures or cost, and a row that opens the agent
- [Agent Monitor](agent-monitor.md) – One agent at work as a compact card – its current step with a clock and the cost so far, a strip of steps sized by duration, the finished steps, and Pause and Stop
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
