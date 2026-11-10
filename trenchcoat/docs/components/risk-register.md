<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Risk Register

**Research & portfolio** · New

A 5 × 5 likelihood × impact heat grid with counts and moves since the last review, beside a sortable register whose risks open with their mitigation and can be rescored

- **Element:** `<tc-risk-register>`
- **Size:** 11.4 KB gzip · 39.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/risk-register";` |
| React / Next.js | `import { RiskRegister } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/risk-register";` · tags starting with tc- are custom elements |
| Angular | `import { RiskRegister } from "@adamstavely/trenchcoat/angular/risk-register";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/risk-register";` |

## Example

The live example is in the gallery at `#/risk-register`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A programme's risks in two views at once. On the left is a 5 × 5 heat grid, likelihood across and impact up. Each
cell is shaded by its band (low, medium, high or critical), and the band is named as well as coloured. Each cell
shows how many risks sit in it, and a risk that has moved since the last review leaves a dashed arrow from its old
cell. On the right is the register: every risk with its score (likelihood × impact), owner, status and trend,
sortable by any of them. Pick a cell to show only its risks. Open a risk for its mitigation and two 1–5 pickers to
rescore it.

### When to use

- A project, programme or portfolio keeps a risk register and reviews it regularly.
- People need to see where the serious risks sit at a glance, and what's being done about each.

### When not to use

- Coverage of checks against parts, with gaps – use [Coverage Matrix](coverage-matrix.md).
- Where exposure is unaddressed across a portfolio – use [Gap Exposure](gap-exposure.md).
- A ranked list of things to do – use [Priority List](priority-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Legend** `.ui-rrg__legend` – how many risks are in each band, in the header
2. **Grid** `.ui-rrg__grid` – 5 × 5 cells, each shaded by band with its count
3. **Moves** `.ui-rrg__moves` – dashed arrows from where risks sat at the last review
4. **Filter** `.ui-rrg__chip` – the cell the register is showing, with a button to show all
5. **Register** `.ui-rrg__table` – score, risk, owner, status and trend, sortable
6. **Detail** `.ui-rrg__detail` – the mitigation and the likelihood and impact pickers

## Looks

Standard sets the header and legend on a gray tray above a white card; Clean is one white card with the header as
its first row. Bands use the theme's status and tone fills. A page can recolour them with `--tc-rrg-low`,
`--tc-rrg-medium`, `--tc-rrg-high` and `--tc-rrg-critical`, and resize the cells with `--tc-rrg-cell` (44px). Narrow,
the grid sits above the register; narrower still, the register's rows become cards.

## Usage

### HTML

```html
<tc-risk-register heading="Field risks"></tc-risk-register>
<script type="module">
  const reg = document.querySelector("tc-risk-register");
  reg.risks = [{ id: "storm", title: "Storm season damages nursery frames", likelihood: 4, impact: 4, owner: "M. Okafor" }];
  reg.addEventListener("tc-risks-change", (e) => console.log("save", e.detail.risks));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RiskRegister, type Risk } from "@adamstavely/trenchcoat/react";

export function FieldRisks() {
  const [risks, setRisks] = useState<Risk[]>([{ id: "storm", title: "Storm season damages nursery frames", likelihood: 4, impact: 4 }]);
  return <RiskRegister title="Field risks" risks={risks} onRisksChange={setRisks} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/risk-register";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";

defineProps<{ risks: TcRiskRegister["risks"]; cell: TcRiskRegister["cell"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-risk-register :risks="risks" :cell="cell" @tc-selected-change="onSelectedChange"></tc-risk-register>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RiskRegister } from "@adamstavely/trenchcoat/angular/risk-register";
import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";

@Component({
  selector: "app-risk-register-example",
  imports: [RiskRegister],
  template: `<tc-risk-register [risks]="risks()" [cell]="cell()" (tc-selected-change)="onSelectedChange($event)"></tc-risk-register>`,
})
export class RiskRegisterExample {
  readonly risks = input.required<TcRiskRegister["risks"]>();
  readonly cell = input.required<TcRiskRegister["cell"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/risk-register";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";

  let { risks, cell }: { risks: TcRiskRegister["risks"]; cell: TcRiskRegister["cell"] } = $props();
  let el: TcRiskRegister;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-risk-register bind:this={el} {risks} {cell}></tc-risk-register>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Risk register"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `risks` | – | `Risk[]` | `[]` | The risks. Rescoring changes them unless tc-risks-change is prevented |
| `selected` | `selected` | `string \| null` | `null` | The risk whose detail is open. Changed by the user unless tc-selected-change is prevented |
| `cell` | – | `RiskCell \| null` | `null` | The grid cell the register is filtered to, or null for all. Changed by the user unless tc-cell-change is prevented |
| `sort` | `sort` | `RiskSortKey` | `"score"` | The register's order. Changed by the user unless tc-sort-change is prevented |
| `sortDir` | `sort-dir` | `RiskSortDir` | `"desc"` | Which way the register is sorted |
| `labels` | – | `Partial<RiskLabels>` | `{}` | The words for the five likelihood and impact levels |
| `readonly` | `readonly` | `boolean` | `false` | Read only: risks can be opened but not rescored |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A risk was opened or closed ({ selected, risk }: RiskSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-cell-change` | – | Yes | The grid's filter changed ({ cell }: RiskCellChange); cancelable – prevented, `cell` stays as it was |
| `tc-sort-change` | – | Yes | The register's order changed ({ sort, sortDir }: RiskSortChange); cancelable – prevented, the order stays |
| `tc-risks-change` | – | Yes | A risk was rescored ({ risks, change }: RiskRisksChange); cancelable – prevented, `risks` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rrg-cell` | `38px` | clean, both |
| `--tc-rrg-low` | `var(--tc-status-success-bg)` | clean |
| `--tc-rrg-medium` | `var(--tc-tone-amber-bg)` | clean |
| `--tc-rrg-high` | `var(--tc-status-warning-bg)` | clean |
| `--tc-rrg-critical` | `var(--tc-status-danger-bg)` | clean |

#### Design tokens it reads (72)

`--tc-action-ghost-bg-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `riskBand(score: number): RiskBand` | A score's band: 1–4 low, 5–9 medium, 10–16 high, 20–25 critical |

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
| `risks` | `el.risks = …;` | `<… risks={…} />` | `<tc-risk-register :risks="…">` | `<tc-risk-register [risks]="…">` | `<tc-risk-register {risks}>` |
| `cell` | `el.cell = …;` | `<… cell={…} />` | `<tc-risk-register :cell="…">` | `<tc-risk-register [cell]="…">` | `<tc-risk-register {cell}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-risk-register :labels="…">` | `<tc-risk-register [labels]="…">` | `<tc-risk-register {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `sort`, `sort-dir`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-cell-change` | Yes | `el.addEventListener("tc-cell-change", (e) => …)` | `ref.current.addEventListener("tc-cell-change", …)` | `@tc-cell-change="…"` | `(tc-cell-change)="…($event)"` | `el.addEventListener("tc-cell-change", …)` |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `onSortChange={…}` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |
| `tc-risks-change` | Yes | `el.addEventListener("tc-risks-change", (e) => …)` | `onRisksChange={…}` | `@tc-risks-change="…"` | `(tc-risks-change)="…($event)"` | `el.addEventListener("tc-risks-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `risks`, `selected`, `cell` and `sort` itself unless a listener calls `preventDefault()` on `tc-risks-change`, `tc-selected-change`, `tc-cell-change` or `tc-sort-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-risk-register id="risk-register"></tc-risk-register>

<script type="module">
  import "@adamstavely/trenchcoat/risk-register";

  const el = document.querySelector("#risk-register");
  el.addEventListener("tc-risks-change", (e) => {
    e.preventDefault(); // the element keeps its risks…
    if (allowed(e.detail.risks)) el.risks = e.detail.risks; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RiskRegister } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RiskRegister>;
type Props = Omit<Own, "risks" | "onRisksChange"> & { initial: NonNullable<Own["risks"]> };

// Controlled: passing risks makes the wrapper prevent the element's own change; the app sets it
export function ControlledRiskRegister({ initial, ...props }: Props) {
  const [risks, setRisks] = useState<Own["risks"]>(initial);
  return <RiskRegister {...props} risks={risks} onRisksChange={(next) => setRisks(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/risk-register";
import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";

const props = defineProps<{ initial: TcRiskRegister["risks"] }>();
const risks = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRisksChange = (e: CustomEvent<{ risks: TcRiskRegister["risks"] }>) => {
  e.preventDefault();
  risks.value = e.detail.risks;
};
</script>

<template>
  <tc-risk-register :risks="risks" @tc-risks-change="onRisksChange"></tc-risk-register>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RiskRegister } from "@adamstavely/trenchcoat/angular/risk-register";
import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";

@Component({
  selector: "app-controlled-risk-register",
  imports: [RiskRegister],
  template: `<tc-risk-register [risks]="risks()" (tc-risks-change)="onRisksChange($event)"></tc-risk-register>`,
})
export class ControlledRiskRegister {
  readonly initial = input.required<TcRiskRegister["risks"]>();
  readonly risks = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRisksChange(e: CustomEvent<{ risks: TcRiskRegister["risks"] }>) {
    e.preventDefault();
    this.risks.set(e.detail.risks);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/risk-register";
  import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";

  let { initial }: { initial: TcRiskRegister["risks"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let risks = $derived(initial);
  let el: TcRiskRegister;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      risks = (e as CustomEvent<{ risks: TcRiskRegister["risks"] }>).detail.risks;
    };
    el.addEventListener("tc-risks-change", on);
    return () => el.removeEventListener("tc-risks-change", on);
  });
</script>

<tc-risk-register bind:this={el} {risks}></tc-risk-register>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-risk-register")` returns a `TcRiskRegister` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";`
- **React / Next.js:** Props: `import type { RiskRegisterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RiskRegister>`. The element class, for refs: `import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRiskRegister["risks"]` with `import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";`
- **Angular:** The directive types the template: `[risks]` takes `TcRiskRegister["risks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRiskRegister } from "@adamstavely/trenchcoat/risk-register";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `risks` | `Risk[]` | The risks – controlled when given: rescoring reports the next list through onRisksChange |
| `defaultRisks` | `Risk[]` | The risks on mount when `risks` isn't controlled |
| `onRisksChange` | `(next: Risk[], change: RiskRisksChange["change"]) => void` | A risk was rescored; `next` is the list as it will be |
| `selected` | `string \| null` | The risk whose detail is open – controlled when given |
| `defaultSelected` | `string \| null` | The risk open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, risk?: Risk) => void` | A risk was opened or closed |
| `cell` | `RiskCell \| null` | The grid cell the register is filtered to – controlled when given |
| `defaultCell` | `RiskCell \| null` | The filter on mount when `cell` isn't controlled |
| `onCellChange` | `(cell: RiskCell \| null) => void` | The filter changed |
| `sort` | `RiskSortKey` | The register's order – controlled when given |
| `sortDir` | `RiskSortDir` | Which way – controlled with `sort` |
| `onSortChange` | `(sort: RiskSortKey, sortDir: RiskSortDir) => void` | The order changed |

*Renamed or hidden on the wrapper: `heading`, `risks`, `selected`, `cell`, `sort`, `sortDir`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | Does |
| --- | --- |
| ← → ↑ ↓ in the grid | Move between cells |
| Home / End | The row's first / last cell |
| ⌘ / Ctrl + Home / End | Top-left / bottom-right cell |
| Enter or Space on a cell | Shows only its risks; again shows all |
| Escape in the grid | Shows all risks |
| Enter on a risk | Opens or closes its detail |
| ← / → in a picker | A lower / higher level |

### Screen readers

- The grid is a `grid` named by the heading. Each cell says its levels in words, its count and its band ("Likelihood 2
  Unlikely, impact 4 Major: 2 risks, Medium"), and the filtered cell is selected.
- The register is a table whose sortable columns carry `aria-sort`. A risk's title is a button with `aria-expanded`
  pointing at its detail.
- Trends are arrows with words ("Getting worse"). The pickers are radio groups named "Likelihood" and "Impact", each
  option with its number and word.
- Filtering and rescoring are announced in a polite status line.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 30.8 KB | 9.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **39.1 KB** | **11.5 KB** |
| With Lit – the first component on a page | 61.5 KB | 18.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 298 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of risks replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.2 ms | risks: first render, 1,745 nodes; update 0.8 ms |
| 1,000 items | 83 ms | risks: first render, 16,045 nodes; update 9.0 ms |

1,000 items of risks: 83 ms. It renders every item, so a first render passes 50 ms (a long task) at about 600 items – page or filter longer lists.

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

- Write a risk as what might happen: "Storm season damages nursery frames", not "Storms".
- Put the mitigation in one or two sentences of what's actually being done.
- Set `previous` after each review, so the grid shows what moved.
- Rename the levels with `labels` to match your organisation's scale.

## Do and don't

### Do

- Keep owners on every open risk.
- Store the list where the team reviews it (`tc-risks-change` gives you the whole list).

### Don't

- Use colour alone to rank risks – the bands are named for a reason; keep them visible.
- Leave closed risks on the grid for ever – archive them after a review or two.

## Related

- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Gap Exposure](gap-exposure.md) – Gaps or risks and whether anyone is working on them – severity in words and a mark, the item and its priority, coverage, owner and what's invested, with the severe uncovered ones called out, grouping by priority or severity and an uncovered-only switch
- [Status Tracker](status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
- [Priority List](priority-list.md) – A portfolio's topics or projects by priority – a tier badge, owner and team, health in words, momentum as a line with its change, coverage as a bar, what's open and the work in flight, with health filters and groups per priority

## Changelog

- **Research & portfolio** - **Roadmap Timeline** (`tc-roadmap-timeline`) – Gantt-style lanes with progress, milestones, Today and dependency arrows, at week, month or quarter scale. - **Prioritisation Matrix** (`tc-prioritisation-matrix`) – value against effort, points dragged or moved with the arrow keys, listed by quadrant. - **Risk Register** (`tc-risk-register`) – a 5 × 5 likelihood × impact grid beside a sortable, rescorable register. - **Bibliography** (`tc-bibliography`) – references in APA, MLA, Chicago, Harvard or IEEE, with Copy and BibTeX / RIS export.
