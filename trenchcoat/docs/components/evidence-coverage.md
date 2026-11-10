<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Evidence Coverage

**Trust & calibration** · New

What an answer could and couldn't see – each source category current, stale or missing, with a request for coverage

- **Element:** `<tc-evidence-coverage>`
- **Size:** 8.5 KB gzip · 26.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/evidence-coverage";` |
| React / Next.js | `import { EvidenceCoverage } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/evidence-coverage";` · tags starting with tc- are custom elements |
| Angular | `import { EvidenceCoverage } from "@adamstavely/trenchcoat/angular/evidence-coverage";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/evidence-coverage";` |

## Example

The live example is in the gallery at `#/evidence-coverage`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What an answer could and couldn't see. Each source category the answer draws on gets a row – current, stale (with
its age, as your product words it) or not covered at all – and a summary line says plainly what was missing:
“Couldn't see Field reports. Supplier filings (14 months) is out of date.” A stale or missing category carries
Request coverage, so the reader can ask for the gap to be filled instead of quietly trusting a partial answer. It
works as a card beside an answer or as one quiet line under it that folds out into the rows. The app sends the
request; the component shows it pending, sent, or failed with Retry.

### When to use

- Under or beside an AI answer whose quality depends on which sources it could reach.
- In a report or brief, to say which inputs were out of date when it was written.
- Where people can ask for data to be collected, connected or refreshed.

### When not to use

- How much of a document came from sources versus synthesis – use [Provenance Summary](provenance-summary.md).
- The freshness of one cited source – use [Validity Badge](validity-badge.md).
- Coverage of many topics against many sources, as a grid – use [Coverage Matrix](coverage-matrix.md).
- Marking up the claims of an answer one by one – use [Claim Answer](claim-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-evc__summary` – what the answer couldn't see, in a sentence
2. **Count** `.ui-evc__pill` – how many categories are current
3. **Source row** `.ui-evc__row` – a category, its status glyph and its detail
4. **Status** `.ui-evc__state` – Current, Stale with its age, or No coverage
5. **Request coverage** `.ui-evc__act` – the request, or where it stands

## Looks

Standard puts the header and count on the gray tray above a white card holding the summary and rows. Clean is one
white card with the header as its first row and slightly thinner glyphs. The inline shape has no card in either
look: a summary line with a Sources button, and a sunken panel for the rows.

## Usage

### HTML

```html
<tc-evidence-coverage id="coverage" scope="For the answer on Northwind Freight"></tc-evidence-coverage>

<script type="module">
  import "@adamstavely/trenchcoat/evidence-coverage";
  import "@adamstavely/trenchcoat/tokens.css";

  const coverage = document.querySelector("#coverage");
  coverage.sources = [
    { id: "sales", label: "Sales and orders", status: "current" },
    { id: "filings", label: "Supplier filings", status: "stale", age: "14 months" },
    { id: "field", label: "Field reports", status: "none" },
  ];
  coverage.requestCoverage = (source, signal) => fetch(`/api/coverage/${source.id}`, { method: "POST", signal });
  coverage.addEventListener("tc-coverage-request", (e) => console.log("requested", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { EvidenceCoverage, type CoverageSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: CoverageSource[] = [
  { id: "sales", label: "Sales and orders", status: "current" },
  { id: "filings", label: "Supplier filings", status: "stale", age: "14 months" },
  { id: "field", label: "Field reports", status: "none" },
];

export function AnswerCoverage({ request }: { request: (id: string, signal: AbortSignal) => Promise<void> }) {
  return <EvidenceCoverage inline sources={sources} requestCoverage={(source, signal) => request(source.id, signal)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/evidence-coverage";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";

defineProps<{ sources: TcEvidenceCoverage["sources"]; statusLabels: TcEvidenceCoverage["statusLabels"] }>();
const onCoverageRequest = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-evidence-coverage :sources="sources" :statusLabels="statusLabels" @tc-coverage-request="onCoverageRequest"></tc-evidence-coverage>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EvidenceCoverage } from "@adamstavely/trenchcoat/angular/evidence-coverage";
import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";

@Component({
  selector: "app-evidence-coverage-example",
  imports: [EvidenceCoverage],
  template: `<tc-evidence-coverage [sources]="sources()" [statusLabels]="statusLabels()" (tc-coverage-request)="onCoverageRequest($event)"></tc-evidence-coverage>`,
})
export class EvidenceCoverageExample {
  readonly sources = input.required<TcEvidenceCoverage["sources"]>();
  readonly statusLabels = input.required<TcEvidenceCoverage["statusLabels"]>();
  onCoverageRequest(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evidence-coverage";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";

  let { sources, statusLabels }: { sources: TcEvidenceCoverage["sources"]; statusLabels: TcEvidenceCoverage["statusLabels"] } = $props();
  let el: TcEvidenceCoverage;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-coverage-request", on);
    return () => el.removeEventListener("tc-coverage-request", on);
  });
</script>

<tc-evidence-coverage bind:this={el} {sources} {statusLabels}></tc-evidence-coverage>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Evidence coverage"` | The heading, and the region's name |
| `scope` | `scope` | `string` | `""` | A quiet line under the heading – what the coverage is of, e.g. "For this answer" |
| `sources` | – | `CoverageSource[]` | `[]` | The source categories, in the order to show them |
| `statusLabels` | – | `Partial<Record<EvidenceCoverageStatus, string>>` | `{}` | The words for each status |
| `summary` | `summary` | `string` | `""` | The summary line; unset, it's written from the sources ("Couldn't see …") |
| `requestLabel` | `request-label` | `string` | `"Request coverage"` | The request button's text |
| `requestable` | `requestable` | `boolean` | `true` | Offer Request coverage on stale and missing sources. Default true |
| `requestCoverage` | – | `CoverageRequestResolver \| undefined` | `undefined` | Sends a request and settles when it's sent – the element shows Requesting…, Requested or Retry. Unset, a request counts as sent |
| `inline` | `inline` | `boolean` | `false` | A quiet line under an answer instead of a card |
| `open` | `open` | `boolean` | `false` | Inline: whether the rows are folded out |
| `locale` | `locale` | `string` | `"en-US"` | Locale for joining names into a sentence |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-coverage-request` | – | Yes | Request coverage (or Retry) was pressed ({ id, source }: CoverageRequestDetail); cancelable – prevented, the app sets the source's `request` itself |
| `tc-open-change` | – | Yes | The inline disclosure opened or closed ({ open }: EvidenceCoverageOpenChange); cancelable |

#### Design tokens it reads (53)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-evidence-coverage :sources="…">` | `<tc-evidence-coverage [sources]="…">` | `<tc-evidence-coverage {sources}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-evidence-coverage :statusLabels="…">` | `<tc-evidence-coverage [statusLabels]="…">` | `<tc-evidence-coverage {statusLabels}>` |
| `requestCoverage` | `el.requestCoverage = …;` | `<… requestCoverage={…} />` | `<tc-evidence-coverage :requestCoverage="…">` | `<tc-evidence-coverage [requestCoverage]="…">` | `<tc-evidence-coverage {requestCoverage}>` |

*Also attributes: `heading`, `scope`, `summary`, `request-label`, `requestable`, `inline`, `open`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-coverage-request` | Yes | `el.addEventListener("tc-coverage-request", (e) => …)` | `onRequestCoverage={…}` | `@tc-coverage-request="…"` | `(tc-coverage-request)="…($event)"` | `el.addEventListener("tc-coverage-request", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-evidence-coverage id="evidence-coverage"></tc-evidence-coverage>

<script type="module">
  import "@adamstavely/trenchcoat/evidence-coverage";

  const el = document.querySelector("#evidence-coverage");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { EvidenceCoverage } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof EvidenceCoverage>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledEvidenceCoverage({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <EvidenceCoverage {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/evidence-coverage";
import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";

const props = defineProps<{ initial: TcEvidenceCoverage["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcEvidenceCoverage["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-evidence-coverage :open="open" @tc-open-change="onOpenChange"></tc-evidence-coverage>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EvidenceCoverage } from "@adamstavely/trenchcoat/angular/evidence-coverage";
import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";

@Component({
  selector: "app-controlled-evidence-coverage",
  imports: [EvidenceCoverage],
  template: `<tc-evidence-coverage [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-evidence-coverage>`,
})
export class ControlledEvidenceCoverage {
  readonly initial = input.required<TcEvidenceCoverage["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcEvidenceCoverage["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evidence-coverage";
  import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";

  let { initial }: { initial: TcEvidenceCoverage["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcEvidenceCoverage;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcEvidenceCoverage["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-evidence-coverage bind:this={el} {open}></tc-evidence-coverage>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-evidence-coverage")` returns a `TcEvidenceCoverage` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";`
- **React / Next.js:** Props: `import type { EvidenceCoverageProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EvidenceCoverage>`. The element class, for refs: `import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEvidenceCoverage["sources"]` with `import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";`
- **Angular:** The directive types the template: `[sources]` takes `TcEvidenceCoverage["sources"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEvidenceCoverage } from "@adamstavely/trenchcoat/evidence-coverage";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `onRequestCoverage` | `(source: CoverageSource, event: CustomEvent<CoverageRequestDetail>) => void` | Called when Request coverage (or Retry) is pressed; call `event.preventDefault()` to track the request yourself through each source's `request` |
| `open` | `boolean` | Inline: whether the rows are folded out – controlled when given |
| `defaultOpen` | `boolean` | Inline: whether the rows start folded out, when `open` isn't set |
| `onOpenChange` | `(open: boolean) => void` | Inline: called when the disclosure opens or closes |

*Renamed or hidden on the wrapper: `heading`, `open`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the next Request coverage or Retry button (and, inline, the Sources button) |
| Enter / Space | Presses the focused button: sends the request, retries it, or folds the rows in or out |

After a request, focus stays on the row – on its “Requested” or “Requesting…” note – rather than dropping to the page.

### Screen readers

The card is a `region` named by its heading; inline, it's named by the summary line. The rows are a list named
“Source categories”, and each status is spoken as text (“Stale · 14 months”, “No coverage”), never colour alone.
Request buttons are named for their row (“Request coverage for Field reports”), Retry likewise (“Retry the request
for Field reports”). The inline Sources button has `aria-expanded` and `aria-controls`. A polite status announces
“Requesting coverage for Field reports…”, “Coverage requested for Field reports.” and “Couldn't request coverage
for Field reports.”

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

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.7 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **26.4 KB** | **8.5 KB** |
| With Lit – the first component on a page | 48.2 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 73 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of sources replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.0 ms | sources: first render, 1,129 nodes; update 0.5 ms |
| 1,000 items | 52 ms | sources: first render, 11,029 nodes; update 5.8 ms |

1,000 items of sources: 52 ms. It renders every item, so a first render passes 50 ms (a long task) at about 960 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name categories the way readers think of them – “Field reports”, “Sales and orders” – not system names.
- Give `age` as you'd say it: “14 months”, “3 days”. It's shown as given.
- Use `detail` for the fact behind the status: when it was last synced, why there's nothing.
- If your product has its own words for the statuses, set `statusLabels`; keep them to one or two words.

## Do and don't

### Do

- Put it where the answer is read, not on a separate admin page.
- Pass a `requestCoverage` resolver so people see the request go through or fail.
- Update `sources` when new data arrives – the summary and count follow.

### Don't

- Don't show it only when coverage is perfect or only when it's poor – the point is that it's always there.
- Don't hide stale sources to make the count look better.
- Don't use “No coverage” for a source that was searched and had nothing relevant – that's coverage.

## Related

- [Provenance Summary](provenance-summary.md) – What a document is made of – how much came from sources, from AI and from its authors, section by section
- [Validity Badge](validity-badge.md) – How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
- `tc-evidence-coverage`'s types are `EvidenceCoverageStatus` and `EvidenceCoverageOpenChange`, so they don't clash with coverage-matrix's.
