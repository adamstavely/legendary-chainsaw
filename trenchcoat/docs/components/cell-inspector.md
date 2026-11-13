<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Cell Inspector

**Data & charts** · New

Why one AI-filled cell says what it says – the value with its confidence in a word and a percentage, the model and when, the column's prompt with the row's values marked, the reasoning folded away, sources with their site and quoted passage, tokens and cost, and earlier values with who set them; Accept, Edit value, Re-run this cell and Mark as wrong

- **Element:** `<tc-cell-inspector>`
- **Size:** 10.6 KB gzip · 36.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/cell-inspector";` |
| React / Next.js | `import { CellInspector } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/cell-inspector";` · tags starting with tc- are custom elements |
| Angular | `import { CellInspector } from "@adamstavely/trenchcoat/angular/cell-inspector";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/cell-inspector";` |

## Example

The live example is in the gallery at `#/cell-inspector`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Why one AI-filled cell says what it says. When a model fills a column of a table row by row, any one cell can be
questioned: the inspector shows its value with how sure the model was – in a word and a percentage – and which model
filled it when; the column's prompt with this row's values filled in and marked, so you can see exactly what was
asked; the model's reasoning summary, folded away; the sources it used, each with its site and the passage it quoted;
the tokens and cost of this cell; and the cell's earlier values with who or what set each. From there it can be
accepted, edited in place, run again, or marked as wrong with a reason.

It's built to sit in a side panel beside the table: Escape, with nothing open inside it, asks the page to close it.

### When to use

- Beside a table filled by AI columns, when someone opens one cell to check it.
- When reviewers need to see the prompt and the sources behind a value before they accept or correct it.

### When not to use

- Every chunk retrieval returned for one query – use [Retrieval Inspector](retrieval-inspector.md).
- An answer in a chat with its citations – use [Cited Answer](cited-answer.md).
- The table itself – use [Data Table](data-table.md).
- The versions of a prompt or an agent – use [Version History](version-history.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Value** `.ui-cin__value-block` – the value, the confidence `.ui-cin__confidence` and who filled it when `.ui-cin__meta`
3. **Actions** `.ui-cin__actions` – Accept, Edit value, Re-run this cell and Mark as wrong
4. **Form** `.ui-cin__form` – editing the value, or saying what's wrong with it
5. **Prompt** `.ui-cin__prompt` – the column's prompt with the row's values marked `.ui-cin__var`
6. **Reasoning** `.ui-cin__reasoning` – the model's reasoning summary, behind a disclosure
7. **Sources** `.ui-cin__sources` – a card per source with its title, site and quoted passage
8. **Usage** `.ui-cin__usage` – tokens in, tokens out and cost for this cell
9. **History** `.ui-cin__history` – earlier values, newest first, with who or what set them

## Looks

Standard sets the header on the gray tray above a white card. Clean is one white card with a shadow, the header its
first row and a slightly smaller value. The status pill and the confidence mark change shape as well as colour.

## Usage

### HTML

```html
<tc-cell-inspector
  id="cell"
  heading="Risk tier"
  description="Northwind Analytics · row 214"
  value="Medium"
  model="Analyst model"
  confidence="0.72"
  prompt="Rate {{vendor}}'s risk tier. It handles {{data}} and is based in {{country}}."
  closable
></tc-cell-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/cell-inspector";
  import "@adamstavely/trenchcoat/tokens.css";

  const cell = document.querySelector("#cell");
  cell.variables = { vendor: "Northwind Analytics", data: "work emails", country: "Ireland" };
  cell.sources = [{ id: "s1", title: "Security and compliance", url: "https://example.org/security", snippet: "A current SOC 2 Type II report." }];
  cell.addEventListener("tc-flag", (e) => console.log("wrong because:", e.detail.reason));
  cell.addEventListener("tc-close", () => cell.remove());
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CellInspector, type CellStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RiskTierCell({ rerun, close }: { rerun: () => void; close: () => void }) {
  const [value, setValue] = useState("Medium");
  const [status, setStatus] = useState<CellStatus>("new");
  return (
    <CellInspector
      title="Risk tier"
      description="Northwind Analytics · row 214"
      value={value}
      onValueChange={setValue}
      status={status}
      onStatusChange={setStatus}
      prompt="Rate {{vendor}}'s risk tier."
      variables={{ vendor: "Northwind Analytics" }}
      model="Analyst model"
      confidence={0.72}
      onRerun={() => rerun()}
      onClose={close}
      closable
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/cell-inspector";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";

defineProps<{ variables: TcCellInspector["variables"]; sources: TcCellInspector["sources"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-cell-inspector :variables="variables" :sources="sources" @tc-value-change="onValueChange"></tc-cell-inspector>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CellInspector } from "@adamstavely/trenchcoat/angular/cell-inspector";
import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";

@Component({
  selector: "app-cell-inspector-example",
  imports: [CellInspector],
  template: `<tc-cell-inspector [variables]="variables()" [sources]="sources()" (tc-value-change)="onValueChange($event)"></tc-cell-inspector>`,
})
export class CellInspectorExample {
  readonly variables = input.required<TcCellInspector["variables"]>();
  readonly sources = input.required<TcCellInspector["sources"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cell-inspector";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";

  let { variables, sources }: { variables: TcCellInspector["variables"]; sources: TcCellInspector["sources"] } = $props();
  let el: TcCellInspector;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-cell-inspector bind:this={el} {variables} {sources}></tc-cell-inspector>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Cell"` | The heading – the column's name – and the region's name |
| `description` | `description` | `string` | `""` | A quiet line under the heading – which row: "Northwind Analytics · row 214" |
| `value` | `value` | `string` | `""` | The cell's value. Changed by Edit value unless a tc-value-change listener calls preventDefault() |
| `status` | `status` | `CellStatus` | `"new"` | Where the cell stands. Changed by the actions unless a tc-status-change listener calls preventDefault() |
| `prompt` | `prompt` | `string` | `""` | The column's prompt, with {{variable}} where the row's values go |
| `variables` | – | `Record<string, string>` | `{}` | This row's values, by variable name |
| `model` | `model` | `string` | `""` | The model that filled the cell |
| `at` | `at` | `number \| null` | `null` | When it was filled, epoch ms |
| `now` | `now` | `number \| null` | `null` | The time now, epoch ms – turns times into "3 min ago"; unset shows dates |
| `reasoning` | `reasoning` | `string` | `""` | The model's reasoning summary, folded away until opened |
| `sources` | – | `CellSource[]` | `[]` | The sources the model used |
| `confidence` | `confidence` | `number \| null` | `null` | How sure the model was, 0–1; unset hides it |
| `tokensIn` | `tokens-in` | `number \| null` | `null` | Input tokens this cell used |
| `tokensOut` | `tokens-out` | `number \| null` | `null` | Output tokens this cell used |
| `cost` | `cost` | `number \| null` | `null` | What this cell cost, in `currency` |
| `history` | – | `CellHistoryEntry[]` | `[]` | Earlier values, newest first |
| `closable` | `closable` | `boolean` | `false` | Show a close button – the panel's own; Escape fires tc-close either way |
| `statusLabels` | – | `Partial<Record<CellStatus, string>>` | `{}` | Words for each status |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency of the cost |
| `locale` | `locale` | `string` | `"en-US"` | Locale for numbers, money and dates |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The value was edited and saved ({ value, previous }: CellValueChange); cancelable – prevented, `value` stays as it was |
| `tc-status-change` | – | Yes | Accept, an edit, Re-run or Mark as wrong moved the cell on ({ status, previous }: CellStatusChange); cancelable – prevented, `status` stays as it was |
| `tc-accept` | – | Yes | Accept was pressed ({ value }: CellAccept); cancelable – prevented, nothing changes |
| `tc-rerun` | – | Yes | Re-run this cell was pressed ({ value }: CellRerun); cancelable – prevented, nothing changes |
| `tc-flag` | – | Yes | Marked as wrong, with the reason ({ reason, value }: CellFlag); cancelable – prevented, nothing changes |
| `tc-close` | – | No | Escape with nothing open inside, or the close button (detail: {}) |

#### Design tokens it reads (83)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `cellConfidenceWord(c: number): void` | "High", "Medium" or "Low" for a confidence from 0 to 1 |

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
| `variables` | `el.variables = …;` | `<… variables={…} />` | `<tc-cell-inspector :variables="…">` | `<tc-cell-inspector [variables]="…">` | `<tc-cell-inspector {variables}>` |
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-cell-inspector :sources="…">` | `<tc-cell-inspector [sources]="…">` | `<tc-cell-inspector {sources}>` |
| `history` | `el.history = …;` | `<… history={…} />` | `<tc-cell-inspector :history="…">` | `<tc-cell-inspector [history]="…">` | `<tc-cell-inspector {history}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-cell-inspector :statusLabels="…">` | `<tc-cell-inspector [statusLabels]="…">` | `<tc-cell-inspector {statusLabels}>` |

*Also attributes: `heading`, `description`, `value`, `status`, `prompt`, `model`, `at`, `now` and 8 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-accept` | Yes | `el.addEventListener("tc-accept", (e) => …)` | `onAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |
| `tc-rerun` | Yes | `el.addEventListener("tc-rerun", (e) => …)` | `onRerun={…}` | `@tc-rerun="…"` | `(tc-rerun)="…($event)"` | `el.addEventListener("tc-rerun", …)` |
| `tc-flag` | Yes | `el.addEventListener("tc-flag", (e) => …)` | `onFlag={…}` | `@tc-flag="…"` | `(tc-flag)="…($event)"` | `el.addEventListener("tc-flag", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `status` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-status-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-cell-inspector id="cell-inspector"></tc-cell-inspector>

<script type="module">
  import "@adamstavely/trenchcoat/cell-inspector";

  const el = document.querySelector("#cell-inspector");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
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
import "@adamstavely/trenchcoat/cell-inspector";
import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";

const props = defineProps<{ initial: TcCellInspector["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcCellInspector["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-cell-inspector :value="value" @tc-value-change="onValueChange"></tc-cell-inspector>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CellInspector } from "@adamstavely/trenchcoat/angular/cell-inspector";
import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";

@Component({
  selector: "app-controlled-cell-inspector",
  imports: [CellInspector],
  template: `<tc-cell-inspector [value]="value()" (tc-value-change)="onValueChange($event)"></tc-cell-inspector>`,
})
export class ControlledCellInspector {
  readonly initial = input.required<TcCellInspector["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcCellInspector["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/cell-inspector";
  import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";

  let { initial }: { initial: TcCellInspector["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcCellInspector;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcCellInspector["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-cell-inspector bind:this={el} {value}></tc-cell-inspector>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-cell-inspector :value="value" @tc-value-change="value = $event.detail.value"></tc-cell-inspector>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-cell-inspector [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-cell-inspector>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-cell-inspector bind:this={el} {value}></tc-cell-inspector>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-cell-inspector")` returns a `TcCellInspector` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";`
- **React / Next.js:** Props: `import type { CellInspectorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CellInspector>`. The element class, for refs: `import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCellInspector["variables"]` with `import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";`
- **Angular:** The directive types the template: `[variables]` takes `TcCellInspector["variables"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCellInspector } from "@adamstavely/trenchcoat/cell-inspector";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – the column's name – and the region's name |
| `value` | `string` | The cell's value – controlled when given |
| `defaultValue` | `string` | Initial value when uncontrolled |
| `onValueChange` | `(value: string) => void` | The value was edited and saved |
| `status` | `CellStatus` | Where the cell stands – controlled when given |
| `defaultStatus` | `CellStatus` | Initial status when uncontrolled |
| `onStatusChange` | `(status: CellStatus) => void` | Called with the next `status` |
| `onAccept` | `(value: string) => void \| boolean` | Accept was pressed. Return false to stop it |
| `onRerun` | `(value: string) => void \| boolean` | Re-run this cell was pressed – run it, then pass the new value and status back. Return false to stop it |
| `onFlag` | `(reason: string, value: string) => void \| boolean` | Marked as wrong, with the reason. Return false to stop it |
| `onClose` | `() => void` | Escape, or the close button – close the panel |

*Renamed or hidden on the wrapper: `heading`, `value`, `status`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the actions, the reasoning toggle, source links and Close |
| Enter / Space | Presses the focused action |
| Enter (editing) | Saves the new value; Shift+Enter starts a new line |
| Escape | Cancels editing or marking as wrong; with nothing open, asks the page to close the panel |

After saving, cancelling or marking, focus goes back to the action that opened the form.

### Screen readers

The inspector is a `region` named by the column's name. Value, prompt, sources and history are sections with their
own headings. The confidence is said in words (“Medium confidence · 72%”), and a prompt variable with no value in this
row says so. The reasoning toggle is a disclosure (`aria-expanded`, `aria-controls`); Edit value and Mark as wrong
report whether their form is open. While the cell runs again its value is `aria-busy` and the actions are
`aria-disabled`. Accepting, saving, re-running and marking are said once in a polite live region.

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
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 29.2 KB | 8.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.9 KB** | **10.6 KB** |
| With Lit – the first component on a page | 57.6 KB | 17.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 93 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of sources replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.4 ms | sources: first render, 730 nodes; update 0.5 ms |
| 1,000 items | 36 ms | sources: first render, 6,580 nodes; update 2.9 ms |

1,000 items of sources: 36 ms, 6,580 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Use the column's name as the heading and the row's name as the line under it, so the panel says which cell it is.
- Pass the prompt exactly as the model got it, with `{{variable}}` where the row's values go.
- Keep the reasoning to a short summary – a few lines on why, not the model's full trace.
- Quote the passage each source gave, not the whole page.

## Do and don't

### Do

- Pass the new value and set `status` back to "new" when a re-run comes back.
- Keep earlier values in `history`, with a note on why each changed.
- Use a marked-as-wrong reason to improve the column's prompt.

### Don't

- Don't hide the prompt – it's the first thing a reviewer needs to judge the value.
- Don't show sources the model didn't use.
- Don't use it for a value a person typed – there's nothing to inspect.

## Related

- [Retrieval Inspector](retrieval-inspector.md) – What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour
