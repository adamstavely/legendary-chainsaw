<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Coverage Matrix

**Trust & calibration** · New

Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail

- **Element:** `<tc-coverage-matrix>`
- **Size:** 9.7 KB gzip · 33.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/coverage-matrix";` |
| React / Next.js | `import { CoverageMatrix } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/coverage-matrix";` · tags starting with tc- are custom elements |
| Angular | `import { CoverageMatrix } from "@adamstavely/trenchcoat/angular/coverage-matrix";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/coverage-matrix";` |

## Example

The live example is in the gallery at `#/coverage-matrix`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Which checks cover which parts, at a glance. Checks – test suites, controls, policies – are the rows, the parts they
protect are the columns, and every cell says covered, partial or gap, or that the check doesn't apply. Each row and
column has a total, the overall share sits beside the heading, and the legend counts every status, so the weakest
spots stand out before anyone reads a number. Pick a cell and its detail opens below the grid: what covers it, what's
missing and the evidence behind it.

### When to use

- Red-team or adversarial test coverage across the surfaces an assistant ships on.
- Controls or policies mapped against systems, for an audit or a security review.
- Any checks-by-parts question where the gaps matter more than the exact values.

### When not to use

- Setting what each agent may do with each tool – use [Tool Permissions](tool-permissions.md).
- Rows of records people sort, filter and edit – use [Data Table](data-table.md).
- Trying one action against the policy – use [Policy Simulator](policy-simulator.md).
- A share of a whole across a few categories – use [Breakdown Chart](breakdown-chart.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Overall** `.ui-cov__overall` – the share covered across every applicable cell
2. **Legend** `.ui-cov__legend` – each status, its mark and how many cells have it
3. **Check** `.ui-cov__check` – a row: what does the covering, with a quiet description
4. **Part** `.ui-cov__part` – a column: what gets covered
5. **Cell** `.ui-cov__cell` – the status as a tinted tile with its mark
6. **Total** `.ui-cov__total` – a row's or column's share covered, with a slim meter
7. **Detail** `.ui-cov__detail` – the open cell: its status, what covers it and the evidence

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight labels. Clean is one
white card with the header as its first row, quieter labels and thinner marks. The tiles, totals and detail are the same in both.

## Usage

### HTML

```html
<tc-coverage-matrix id="cov" heading="Red-team coverage"></tc-coverage-matrix>

<script type="module">
  import "@adamstavely/trenchcoat/coverage-matrix";
  import "@adamstavely/trenchcoat/tokens.css";

  const cov = document.querySelector("#cov");
  cov.checks = [{ id: "injection", label: "Prompt injection" }, { id: "pii", label: "Personal data" }];
  cov.parts = [{ id: "chat", label: "Chat" }, { id: "email", label: "Email agent" }];
  cov.coverage = {
    injection: { chat: "covered", email: { status: "partial", detail: "Attachments aren't tested." } },
    pii: { chat: "covered", email: { status: "gap", evidence: "Open: RT-212" } },
  };
  cov.addEventListener("tc-open-change", (e) => console.log(e.detail.open));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CoverageMatrix, type CoverageCellRef, type CoverageMap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const coverage: CoverageMap = {
  injection: { chat: "covered", email: { status: "partial", detail: "Attachments aren't tested." } },
  pii: { chat: "covered", email: { status: "gap", evidence: "Open: RT-212" } },
};

export function Coverage() {
  const [open, setOpen] = useState<CoverageCellRef | null>(null);
  return (
    <CoverageMatrix
      title="Red-team coverage"
      checks={[{ id: "injection", label: "Prompt injection" }, { id: "pii", label: "Personal data" }]}
      parts={[{ id: "chat", label: "Chat" }, { id: "email", label: "Email agent" }]}
      coverage={coverage}
      open={open}
      onOpenChange={setOpen}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/coverage-matrix";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";

defineProps<{ checks: TcCoverageMatrix["checks"]; parts: TcCoverageMatrix["parts"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-coverage-matrix :checks="checks" :parts="parts" @tc-open-change="onOpenChange"></tc-coverage-matrix>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CoverageMatrix } from "@adamstavely/trenchcoat/angular/coverage-matrix";
import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";

@Component({
  selector: "app-coverage-matrix-example",
  imports: [CoverageMatrix],
  template: `<tc-coverage-matrix [checks]="checks()" [parts]="parts()" (tc-open-change)="onOpenChange($event)"></tc-coverage-matrix>`,
})
export class CoverageMatrixExample {
  readonly checks = input.required<TcCoverageMatrix["checks"]>();
  readonly parts = input.required<TcCoverageMatrix["parts"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/coverage-matrix";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";

  let { checks, parts }: { checks: TcCoverageMatrix["checks"]; parts: TcCoverageMatrix["parts"] } = $props();
  let el: TcCoverageMatrix;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-coverage-matrix bind:this={el} {checks} {parts}></tc-coverage-matrix>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Coverage"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `checks` | – | `CoverageCheck[]` | `[]` | The rows: what does the covering – tests, controls, policies |
| `parts` | – | `CoveragePart[]` | `[]` | The columns: what gets covered – components, systems, models |
| `coverage` | – | `CoverageMap` | `{}` | Each cell's status, with optional detail and evidence |
| `open` | – | `CoverageCellRef \| null` | `null` | The cell whose detail is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `defaultStatus` | `default-status` | `CoverageStatus` | `"gap"` | A cell missing from `coverage` |
| `partialWeight` | `partial-weight` | `number` | `0.5` | How much a partial cell counts towards a total, from 0 to 1 |
| `statusLabels` | – | `Partial<Record<CoverageStatus, string>>` | `{}` | The statuses' names, merged over the defaults (Covered, Partial, Gap, Not applicable) |
| `checkLabel` | `check-label` | `string` | `"Check"` | The heading of the checks column |
| `totalLabel` | `total-label` | `string` | `"Coverage"` | The heading of the totals column and row |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A cell's detail opened or closed ({ open, cell }: CoverageOpenChange); cancelable – prevented, `open` stays as it was |

#### Design tokens it reads (65)

`--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCoverageStatusLabels: Record<CoverageStatus, string>` | The statuses' names used when the page gives none |

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
| `checks` | `el.checks = …;` | `<… checks={…} />` | `<tc-coverage-matrix :checks="…">` | `<tc-coverage-matrix [checks]="…">` | `<tc-coverage-matrix {checks}>` |
| `parts` | `el.parts = …;` | `<… parts={…} />` | `<tc-coverage-matrix :parts="…">` | `<tc-coverage-matrix [parts]="…">` | `<tc-coverage-matrix {parts}>` |
| `coverage` | `el.coverage = …;` | `<… coverage={…} />` | `<tc-coverage-matrix :coverage="…">` | `<tc-coverage-matrix [coverage]="…">` | `<tc-coverage-matrix {coverage}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-coverage-matrix :open="…">` | `<tc-coverage-matrix [open]="…">` | `<tc-coverage-matrix {open}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-coverage-matrix :statusLabels="…">` | `<tc-coverage-matrix [statusLabels]="…">` | `<tc-coverage-matrix {statusLabels}>` |

*Also attributes: `heading`, `description`, `default-status`, `partial-weight`, `check-label`, `total-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-coverage-matrix id="coverage-matrix"></tc-coverage-matrix>

<script type="module">
  import "@adamstavely/trenchcoat/coverage-matrix";

  const el = document.querySelector("#coverage-matrix");
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
import "@adamstavely/trenchcoat/coverage-matrix";
import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";

const props = defineProps<{ initial: TcCoverageMatrix["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcCoverageMatrix["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-coverage-matrix :open="open" @tc-open-change="onOpenChange"></tc-coverage-matrix>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CoverageMatrix } from "@adamstavely/trenchcoat/angular/coverage-matrix";
import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";

@Component({
  selector: "app-controlled-coverage-matrix",
  imports: [CoverageMatrix],
  template: `<tc-coverage-matrix [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-coverage-matrix>`,
})
export class ControlledCoverageMatrix {
  readonly initial = input.required<TcCoverageMatrix["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcCoverageMatrix["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/coverage-matrix";
  import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";

  let { initial }: { initial: TcCoverageMatrix["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcCoverageMatrix;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcCoverageMatrix["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-coverage-matrix bind:this={el} {open}></tc-coverage-matrix>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-coverage-matrix")` returns a `TcCoverageMatrix` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";`
- **React / Next.js:** Props: `import type { CoverageMatrixProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CoverageMatrix>`. The element class, for refs: `import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCoverageMatrix["checks"]` with `import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";`
- **Angular:** The directive types the template: `[checks]` takes `TcCoverageMatrix["checks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCoverageMatrix } from "@adamstavely/trenchcoat/coverage-matrix";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `open` | `CoverageCellRef \| null` | The cell whose detail is open – controlled when given (null for none) |
| `defaultOpen` | `CoverageCellRef \| null` | The cell open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: CoverageCellRef \| null, cell?: CoverageCell) => void` | A cell's detail opened or closed; `cell` is the opened cell |

*Renamed or hidden on the wrapper: `heading`, `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The matrix is one tab stop; inside it the arrows move between cells, totals included.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the next cell in that direction |
| Home / End | Moves to the first or last cell in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell of the matrix |
| Page Up / Page Down | Moves five rows up or down |
| Enter / Space | Opens the cell's detail, or closes it if it's open (totals have none) |
| Escape | Closes the open detail |
| Tab | Leaves the matrix; with a detail open, the next stop is its Close button |

Close returns focus to the cell.

### Screen readers

The matrix is a `grid` named by the heading and described by “Arrow keys move between cells; Enter opens a cell's
detail”. Parts are column headers and checks row headers; the last row and column are headed with `totalLabel`
(“Coverage”). A cell reads its status – “Covered”, “Partial”, “Gap”, “Not applicable” – and “detail shown” while its
detail is open, which it then controls (`aria-controls`). A total reads its share, “50%”. Opening a cell is confirmed in
a polite status message, “Personal data for Email agent: Gap. Nothing tests forwarding.”, and closing it with “Detail
closed”. The detail is a section headed “Personal data for Email agent”; its Close button is labelled “Close detail”.
The legend is a list labelled “Legend”; the marks are hidden, the words read.

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
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.2 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **33.5 KB** | **9.8 KB** |
| With Lit – the first component on a page | 55.3 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 293 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of checks replaced |
| First on the page | 9.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 17 ms | checks: first render, 3,998 nodes; update 2.4 ms |
| 1,000 items | 173 ms | checks: first render, 39,098 nodes; update 14 ms |

1,000 items of checks: 173 ms. It renders every item, so a first render passes 50 ms (a long task) at about 290 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name checks as what they test or enforce: “Prompt injection”, “Personal data”, not suite ids.
- Name parts as people know them: “Email agent”, “Billing”, not service names.
- Write a cell's `detail` as what's covered and what isn't: “Covers web results, not uploaded PDFs.”
- Put counts, dates and ticket numbers in `evidence`: “142 cases · last run 2 h ago”, “Open: RT-212”.
- Use `none` where a check can't apply, rather than leaving it a gap – gaps should mean work to do.

## Do and don't

### Do

- Give a gap a `detail` and an `evidence` line with the ticket that will close it.
- Set `partial-weight` to match how your team counts partial coverage, and say so in `description`.
- Keep to about eight parts so the matrix fits without scrolling sideways.

### Don't

- Don't use the tints for anything but the three statuses – the heatmap only works if colour means one thing.
- Don't open a detail on load unless it's the reason the page was opened, such as a link from a ticket.
- Don't leave cells out of `coverage` to mean “not applicable” – a missing cell is `default-status`, a gap by default.

## Related

- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Policy Simulator](policy-simulator.md) – Try an action against the policy before it's real – allow, needs approval, deny or hard stop, the rule that decided it and why
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
