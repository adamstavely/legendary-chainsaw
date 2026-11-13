<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Receipt

**Agents** · New

What one agent run cost, set out like a receipt – run id with Copy, when, duration and status in words, line-item tables for models (calls, input, output and cached tokens), tools, web lookups and retries, the subtotal, cache savings and total, the costliest step with its share, and Open trace and Download CSV

- **Element:** `<tc-run-receipt>`
- **Size:** 8.6 KB gzip · 26.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-receipt";` |
| React / Next.js | `import { RunReceipt } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-receipt";` · tags starting with tc- are custom elements |
| Angular | `import { RunReceipt } from "@adamstavely/trenchcoat/angular/run-receipt";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-receipt";` |

## Example

The live example is in the gallery at `#/run-receipt`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What one agent run cost and where the money went, set out like a receipt. The header names the agent and the run –
its id with a copy button – when it ran, how long it took and how it ended, in words. Line items follow: each model
with its calls and input, output and cached tokens, each tool with its calls, then web lookups and retries. Below
them come the subtotal, the cache savings taken off it and the total, then the costliest step with its share of the
total. Open trace and Download CSV close the receipt; the CSV is built in the browser from the same lines.

### When to use

- The cost panel beside a finished run, in an agent's run history or a run's detail page.
- Answering "why did this run cost so much?" before opening the full trace.
- A record to download and attach to an expense or a budget review.

### When not to use

- Where the time went, step by step – use [Trace Waterfall](trace-waterfall.md).
- Spend across many runs or over a period – use [Budget Burn](budget-burn.md).
- What it takes to reproduce a run – use [Run Manifest](run-manifest.md).
- Every run on one line – use [Run Log](run-log.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Facts** `.ui-rrc__meta` – the run id `.ui-rrc__id` with Copy `.ui-rrc__copy`, when, duration and status `.ui-rrc__status`
2. **Line items** `.ui-rrc__lines` – tables of models `.ui-rrc__models`, tools and other lines, each row `.ui-rrc__line`
3. **Totals** `.ui-rrc__totals` – subtotal, cache savings `.ui-rrc__sum--savings` and total `.ui-rrc__sum--total`
4. **Costliest step** `.ui-rrc__costliest` – its name, cost and share of the total
5. **Actions** `.ui-rrc__actions` – Open trace `.ui-rrc__trace` and Download CSV `.ui-rrc__download`
6. **Empty** `.ui-rrc__empty` – "Nothing was charged for this run" when there are no lines

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Dashed rules divide the facts, the lines and the totals, like a printed receipt. The status has a mark and a word
as well as its colour: a check for Succeeded, a cross for Failed, a slash for Cancelled and a dot for Still running.
Cache savings are green and written as a negative amount. The header's right side repeats the total. A page can set
`--tc-rrc-rule`, the dashed rule, and `--tc-rrc-icon`, the size of the small icons. When the card is narrower than
420 px the cached-tokens column is left out and the two actions share the row.

## Usage

### HTML

```html
<tc-run-receipt id="receipt" agent="Invoice matcher"></tc-run-receipt>

<script type="module">
  import "@adamstavely/trenchcoat/run-receipt";
  import "@adamstavely/trenchcoat/tokens.css";

  const receipt = document.querySelector("#receipt");
  receipt.runId = "run_8f2c41d0";
  receipt.at = Date.UTC(2026, 10, 3, 9, 14);
  receipt.duration = 48600;
  receipt.models = [
    { model: "large-1", calls: 6, inputTokens: 48200, outputTokens: 3140, cachedTokens: 31600, cost: 0.3124, cacheSavings: 0.0853 },
    { model: "small-2", calls: 14, inputTokens: 22900, outputTokens: 1820, cost: 0.0211 },
  ];
  receipt.tools = [{ tool: "ledger.lookup", calls: 9, cost: 0.0045 }];
  receipt.steps = [{ name: "Match purchase order lines", cost: 0.2268 }];
  receipt.addEventListener("tc-trace-open", (e) => console.log("open trace", e.detail.runId));
</script>
```

### React / Next.js

```tsx
import { RunReceipt, type RunReceiptModel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunCost({ runId, models }: { runId: string; models: RunReceiptModel[] }) {
  return <RunReceipt agent="Invoice matcher" runId={runId} models={models} onTraceOpen={(id) => console.log("open trace", id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-receipt";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";

defineProps<{ models: TcRunReceipt["models"]; tools: TcRunReceipt["tools"] }>();
const onCopy = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-receipt :models="models" :tools="tools" @tc-copy="onCopy"></tc-run-receipt>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunReceipt } from "@adamstavely/trenchcoat/angular/run-receipt";
import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";

@Component({
  selector: "app-run-receipt-example",
  imports: [RunReceipt],
  template: `<tc-run-receipt [models]="models()" [tools]="tools()" (tc-copy)="onCopy($event)"></tc-run-receipt>`,
})
export class RunReceiptExample {
  readonly models = input.required<TcRunReceipt["models"]>();
  readonly tools = input.required<TcRunReceipt["tools"]>();
  onCopy(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-receipt";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";

  let { models, tools }: { models: TcRunReceipt["models"]; tools: TcRunReceipt["tools"] } = $props();
  let el: TcRunReceipt;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-copy", on);
    return () => el.removeEventListener("tc-copy", on);
  });
</script>

<tc-run-receipt bind:this={el} {models} {tools}></tc-run-receipt>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Run receipt"` | The heading; empty leaves the header out |
| `agent` | `agent` | `string` | `""` | The agent that ran – shown under the heading |
| `runId` | `run-id` | `string` | `""` | The run's id – shown with a copy button, and in the CSV |
| `at` | `at` | `number \| null` | `null` | When the run started, epoch ms |
| `duration` | `duration` | `number \| null` | `null` | How long it ran, in ms |
| `status` | `status` | `RunReceiptStatus` | `"succeeded"` | How it ended |
| `models` | – | `RunReceiptModel[]` | `[]` | A line per model: calls, tokens and cost |
| `tools` | – | `RunReceiptTool[]` | `[]` | A line per tool: calls and cost |
| `lookups` | – | `RunReceiptCount \| null` | `null` | Web lookups: how many and what they cost; null leaves the line out |
| `retries` | – | `RunReceiptCount \| null` | `null` | Retries: how many and what they cost; null leaves the line out |
| `steps` | – | `RunReceiptStep[]` | `[]` | The run's steps with their cost – the costliest is called out |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency code for every amount |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for dates, numbers and amounts |
| `hideTrace` | `hide-trace` | `boolean` | `false` | Hides Open trace |
| `labels` | – | `Partial<RunReceiptLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-copy` | – | Yes | The run ID's copy button was pressed ({ field, text }: RunReceiptCopy); cancelable – prevent it to write the clipboard yourself |
| `tc-trace-open` | – | No | Open trace was pressed ({ runId }: RunReceiptTraceOpen) |
| `tc-download` | – | Yes | Download CSV was pressed ({ csv, filename }: RunReceiptDownload); cancelable – prevented, the page saves the file itself |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rrc-rule` | `var(--tc-hairline) dashed var(--tc-border-default)` | both |
| `--tc-rrc-icon` | `14px` | both |

#### Design tokens it reads (40)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `receiptTotals(r: { models?: RunReceiptModel[]; tools?: RunReceiptTool[]; lookups?: RunReceiptCount \| null; retries?: RunReceiptCount \| null }): RunReceiptTotals` | The subtotal of every line, the cache savings and what's left |
| `receiptCsv(r: { runId?: string; agent?: string; models?: RunReceiptModel[]; tools?: RunReceiptTool[]; lookups?: RunReceiptCount \| null; retries?: RunReceiptCount \| null }): void` | The receipt as CSV: one row per line item, then the totals |

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
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-run-receipt :models="…">` | `<tc-run-receipt [models]="…">` | `<tc-run-receipt {models}>` |
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-run-receipt :tools="…">` | `<tc-run-receipt [tools]="…">` | `<tc-run-receipt {tools}>` |
| `lookups` | `el.lookups = …;` | `<… lookups={…} />` | `<tc-run-receipt :lookups="…">` | `<tc-run-receipt [lookups]="…">` | `<tc-run-receipt {lookups}>` |
| `retries` | `el.retries = …;` | `<… retries={…} />` | `<tc-run-receipt :retries="…">` | `<tc-run-receipt [retries]="…">` | `<tc-run-receipt {retries}>` |
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-run-receipt :steps="…">` | `<tc-run-receipt [steps]="…">` | `<tc-run-receipt {steps}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-run-receipt :labels="…">` | `<tc-run-receipt [labels]="…">` | `<tc-run-receipt {labels}>` |

*Also attributes: `heading`, `agent`, `run-id`, `at`, `duration`, `status`, `currency`, `locale` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyRunId={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-trace-open` | No | `el.addEventListener("tc-trace-open", (e) => …)` | `onTraceOpen={…}` | `@tc-trace-open="…"` | `(tc-trace-open)="…($event)"` | `el.addEventListener("tc-trace-open", …)` |
| `tc-download` | Yes | `el.addEventListener("tc-download", (e) => …)` | `onDownload={…}` | `@tc-download="…"` | `(tc-download)="…($event)"` | `el.addEventListener("tc-download", …)` |

### Controlled

`tc-copy`, `tc-download` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-receipt")` returns a `TcRunReceipt` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";`
- **React / Next.js:** Props: `import type { RunReceiptProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunReceipt>`. The element class, for refs: `import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunReceipt["models"]` with `import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";`
- **Angular:** The directive types the template: `[models]` takes `TcRunReceipt["models"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunReceipt } from "@adamstavely/trenchcoat/run-receipt";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `onCopyRunId` | `(text: string) => void \| boolean` | The run ID's copy button was pressed; return false to write the clipboard yourself |
| `onTraceOpen` | `(runId: string) => void` | Open trace was pressed |
| `onDownload` | `(csv: string, filename: string) => void \| boolean` | Download CSV was pressed; return false to save the file yourself |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Copy, Open trace and Download CSV |
| Enter / Space | Presses the focused button |

### Screen readers

The line items are real tables with captions (Models, Tools, Other), column headers and row headers, so each amount is
read with its item and column. The facts and the totals are description lists. The status mark is hidden; the word is
read. Copy's name is "Copy run ID", and a `role="status"` says "Run ID copied." or that copying failed.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

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
| **This component alone** | 19.0 KB | 6.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.7 KB** | **8.6 KB** |
| With Lit – the first component on a page | 46.3 KB | 15.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 115 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of steps replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.2 ms | steps: first render, 115 nodes; update 0.8 ms |
| 1,000 items | 2.2 ms | steps: first render, 115 nodes; update 0.7 ms |

What it renders doesn't grow with steps (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give a model's `cost` before cache savings, and what caching saved in `cacheSavings`; the receipt takes the savings
  off the subtotal.
- Pass `steps` with each step's cost to call out the costliest one; leave it empty to leave the callout out.
- Amounts below a cent keep four decimals so they don't read as zero.
- Set `currency` to the currency your amounts are in; the receipt doesn't convert.

## Do and don't

### Do

- Keep model names as the provider writes them, so they match the trace and the invoice.
- Use `lookups` and `retries` only when they cost something; null leaves the line out.

### Don't

- Don't put secrets or personal data in the run id or the agent name – both are shown and copied.
- Don't use it as a live meter while a run is going; show `status: "running"` only to say the receipt isn't final.

## Related

- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Run Manifest](run-manifest.md) – What it takes to reproduce a run – model, settings, instruction hash, sources, intent and the verification summary, ready to export
- [Budget Burn](budget-burn.md) – How fast each budget is being spent – spent against budget, the burn as a bar with a pace marker and Ahead, On or Behind pace in words, people and team, totals in the header and a sort by budget or burn
- [Run Log](run-log.md) – Every agent run on one line – status as a mark and a word, agent, trigger, when, duration, steps, tokens, cost and user; status, agent and trigger chips, search and a time range, failed runs that open to their error, and in live mode new runs held behind "Show 3 new runs" instead of shifting the list
