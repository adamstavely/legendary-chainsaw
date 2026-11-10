<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Retrieval Settings

**AI configuration** · New

Chunking, top-k, a score threshold, keyword ↔ vector balance, reranking and metadata filters, edited on a picture of the pipeline, with the app's cost and latency

- **Element:** `<tc-retrieval-settings>`
- **Size:** 12.7 KB gzip · 44.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/retrieval-settings";` |
| React / Next.js | `import { RetrievalSettings } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/retrieval-settings";` · tags starting with tc- are custom elements |
| Angular | `import { RetrievalSettings } from "@adamstavely/trenchcoat/angular/retrieval-settings";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/retrieval-settings";` |

## Example

The live example is in the gallery at `#/retrieval-settings`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Sets how a retrieval pipeline finds what the model answers with, on a picture of the pipeline itself. Five stages run
left to right – Query, Retrieve k, Filter, Rerank, n into context – and each shows a live summary of its settings and
the latency the app reports for it. Picking a stage opens its settings underneath: top-k, the keyword ↔ vector balance
and chunking for Retrieve; the score threshold and metadata rules for Filter; the reranking model; how many chunks go
into the prompt. The app's per-query cost and latency sit at the foot. The element only edits a value – the app runs
the retrieval, works out the estimates and re-indexes when chunking changes. With `name` it is a form control.

### When to use

- The settings page of a knowledge base, an assistant or a search feature built on retrieval.
- Tuning retrieval next to its results: pair it with `retrieval-inspector`, which shows what one query brought back
  with these settings – the chunks, their scores against the threshold, and what the answer used.
- Comparing presets (fast, precise, long documents) where the cost of each choice matters.

### When not to use

- Looking at what a single query retrieved – use [Retrieval Inspector](retrieval-inspector.md).
- Managing the sources themselves – files, sites, connectors and their sync – use [Knowledge Source Manager](knowledge-source-manager.md).
- Model parameters such as temperature or output length – use [Model Settings](model-settings.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Pipeline** `.ui-rset__flow` – the stages in order, each a tab with its summary
2. **Stage** `.ui-rset__stage[aria-selected="true"]` – the open stage; its summary updates as you edit
3. **Settings** `.ui-rset__panel` – the open stage's controls
4. **Chunks** `.ui-rset__chunks` – three staggered chunks drawn at the size and overlap set
5. **Estimate** `.ui-rset__estimate` – the app's latency, cost and context size per query

## Looks

Standard is a white card on a gray tray: the pipeline sits in a gray well with raised white stages, and the open stage
is ringed in ink. Clean is one white card with an accent-tinted pipeline, hairline stages ringed in the accent when
open, accent range fills and chunks, quieter labels, and the estimate as the card's last row. Below 480 px the
pipeline runs top to bottom and the settings stack in one column.

## Usage

### HTML

```html
<tc-retrieval-settings id="rag" name="retrieval"></tc-retrieval-settings>

<script type="module">
  import "@adamstavely/trenchcoat/retrieval-settings";
  import "@adamstavely/trenchcoat/tokens.css";

  const rag = document.querySelector("#rag");
  rag.filterFields = [
    { id: "language", label: "Language", type: "choice", options: ["English", "German"] },
    { id: "updated", label: "Updated", type: "date" },
  ];
  rag.rerankModels = [{ id: "small", label: "Cross-encoder · small" }];
  rag.indexed = { chunkSize: 512, chunkOverlap: 64 };
  rag.addEventListener("tc-value-change", (e) => {
    rag.estimate = { latencyMs: 120 + e.detail.value.topK * 2 };
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RetrievalSettings, RETRIEVAL_SETTINGS_DEFAULT, type RetrievalSettingsValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function HelpCentreRetrieval() {
  const [value, setValue] = useState<RetrievalSettingsValue>(RETRIEVAL_SETTINGS_DEFAULT);
  return (
    <RetrievalSettings
      title="Retrieval"
      description="Help centre index"
      value={value}
      onChange={setValue}
      rerankModels={[{ id: "small", label: "Cross-encoder · small" }]}
      estimate={{ latencyMs: 120 + value.topK * 2, contextTokens: value.topN * value.chunkSize }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/retrieval-settings";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";

defineProps<{ value: TcRetrievalSettings["value"]; filterFields: TcRetrievalSettings["filterFields"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-retrieval-settings :value="value" :filterFields="filterFields" @tc-value-change="onValueChange"></tc-retrieval-settings>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RetrievalSettings } from "@adamstavely/trenchcoat/angular/retrieval-settings";
import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";

@Component({
  selector: "app-retrieval-settings-example",
  imports: [RetrievalSettings],
  template: `<tc-retrieval-settings [value]="value()" [filterFields]="filterFields()" (tc-value-change)="onValueChange($event)"></tc-retrieval-settings>`,
})
export class RetrievalSettingsExample {
  readonly value = input.required<TcRetrievalSettings["value"]>();
  readonly filterFields = input.required<TcRetrievalSettings["filterFields"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/retrieval-settings";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";

  let { value, filterFields }: { value: TcRetrievalSettings["value"]; filterFields: TcRetrievalSettings["filterFields"] } = $props();
  let el: TcRetrievalSettings;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-retrieval-settings bind:this={el} {value} {filterFields}></tc-retrieval-settings>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `RetrievalSettingsValue` | `{ chunkSize: 512, chunkOverlap: 64, topK: 40, threshold: 0.3, hybrid: 0.7, rerank: true, rerankModel: "", topN: 8, filters: [] }` | The config. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `filterFields` | – | `RetrievalFilterField[]` | `[]` | The metadata fields filters can test; without any, a filter's field is typed in |
| `rerankModels` | – | `RetrievalRerankModel[]` | `[]` | The reranking models to offer; without any, Rerank is a switch only |
| `indexed` | – | `{ chunkSize: number; chunkOverlap: number } \| undefined` | `undefined` | The chunking the sources are indexed with now – a different size or overlap says the sources will be re-indexed |
| `estimate` | – | `RetrievalEstimate \| undefined` | `undefined` | Per-query cost and latency from the app, shown on the pipeline and at the foot; unset shows none |
| `stage` | `stage` | `RetrievalStage` | `"retrieve"` | The stage whose settings show under the pipeline: "retrieve", "filter", "rerank" or "context" |
| `heading` | `heading` | `string` | `"Retrieval"` | The heading; also names the group |
| `description` | `description` | `string` | `""` | A quieter line under the heading, e.g. which index this is |
| `flat` | `flat` | `boolean` | `false` | Drops the tray and the card, for settings inside another card |
| `name` | `name` | `string` | `""` | Submitted with the form: the config as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the config out of the form; a disabled fieldset does the same |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The config changed ({ value: RetrievalSettingsValue }); cancelable – prevent it to control `value` |
| `tc-stage-change` | – | Yes | A stage of the pipeline was opened for editing ({ stage }: RetrievalStageChange); cancelable |

#### Design tokens it reads (88)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `retrievalSettingsProblem(v: RetrievalSettingsValue): [string, "overlap" \| "context" \| "filters"] \| null` | The first problem with a config, if any: [message, the part it's about] |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-retrieval-settings :value="…">` | `<tc-retrieval-settings [value]="…">` | `<tc-retrieval-settings {value}>` |
| `filterFields` | `el.filterFields = …;` | `<… filterFields={…} />` | `<tc-retrieval-settings :filterFields="…">` | `<tc-retrieval-settings [filterFields]="…">` | `<tc-retrieval-settings {filterFields}>` |
| `rerankModels` | `el.rerankModels = …;` | `<… rerankModels={…} />` | `<tc-retrieval-settings :rerankModels="…">` | `<tc-retrieval-settings [rerankModels]="…">` | `<tc-retrieval-settings {rerankModels}>` |
| `indexed` | `el.indexed = …;` | `<… indexed={…} />` | `<tc-retrieval-settings :indexed="…">` | `<tc-retrieval-settings [indexed]="…">` | `<tc-retrieval-settings {indexed}>` |
| `estimate` | `el.estimate = …;` | `<… estimate={…} />` | `<tc-retrieval-settings :estimate="…">` | `<tc-retrieval-settings [estimate]="…">` | `<tc-retrieval-settings {estimate}>` |

*Also attributes: `stage`, `heading`, `description`, `flat`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-stage-change` | Yes | `el.addEventListener("tc-stage-change", (e) => …)` | `ref.current.addEventListener("tc-stage-change", …)` | `@tc-stage-change="…"` | `(tc-stage-change)="…($event)"` | `el.addEventListener("tc-stage-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `stage` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-stage-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-retrieval-settings id="retrieval-settings"></tc-retrieval-settings>

<script type="module">
  import "@adamstavely/trenchcoat/retrieval-settings";

  const el = document.querySelector("#retrieval-settings");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RetrievalSettings } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RetrievalSettings>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledRetrievalSettings({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <RetrievalSettings {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/retrieval-settings";
import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";

const props = defineProps<{ initial: TcRetrievalSettings["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcRetrievalSettings["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-retrieval-settings :value="value" @tc-value-change="onValueChange"></tc-retrieval-settings>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RetrievalSettings } from "@adamstavely/trenchcoat/angular/retrieval-settings";
import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";

@Component({
  selector: "app-controlled-retrieval-settings",
  imports: [RetrievalSettings],
  template: `<tc-retrieval-settings [value]="value()" (tc-value-change)="onValueChange($event)"></tc-retrieval-settings>`,
})
export class ControlledRetrievalSettings {
  readonly initial = input.required<TcRetrievalSettings["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcRetrievalSettings["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/retrieval-settings";
  import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";

  let { initial }: { initial: TcRetrievalSettings["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcRetrievalSettings;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcRetrievalSettings["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-retrieval-settings bind:this={el} {value}></tc-retrieval-settings>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-retrieval-settings :value="value" @tc-value-change="value = $event.detail.value"></tc-retrieval-settings>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-retrieval-settings [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-retrieval-settings>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-retrieval-settings bind:this={el} {value}></tc-retrieval-settings>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-retrieval-settings")` returns a `TcRetrievalSettings` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";`
- **React / Next.js:** Props: `import type { RetrievalSettingsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RetrievalSettings>`. The element class, for refs: `import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRetrievalSettings["value"]` with `import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";`
- **Angular:** The directive types the template: `[value]` takes `TcRetrievalSettings["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRetrievalSettings } from "@adamstavely/trenchcoat/retrieval-settings";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group |
| `value` | `RetrievalSettingsValue` | The config (controlled) |
| `defaultValue` | `RetrievalSettingsValue` | The config to start with when uncontrolled |
| `onChange` | `(value: RetrievalSettingsValue) => void` | Called with the whole config after every change |
| `stage` | `RetrievalStage` | The stage whose settings show – controlled when given |
| `onStageChange` | `(stage: RetrievalStage) => void` | A stage was opened for editing |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `stage`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the open stage, then moves on through its settings |
| ← / → / ↑ / ↓ | On a stage: moves to the previous or next stage, wrapping (without opening it) |
| Home / End | On a stage: moves to the first or last stage |
| Enter / Space | On a stage: opens its settings |
| ← / → / Home / End / Page Up / Page Down | On the balance or the threshold: changes it |
| Space / Enter | On the rerank switch: turns reranking on or off |

Numbers, selects and the filter values are native controls with their usual keys; a number is applied when it changes
(on Enter or leaving the field). Removing a filter moves focus to the next filter's field, else the one before, else
Add filter; Add filter focuses the new filter's field.

### Screen readers

The host is a group named by the heading. The stages are a `tablist` named “Pipeline”; each `tab` reads its summary –
“Retrieve 40, 70% vector, 84ms” – and the open stage's settings are its `tabpanel`. Query is plain text, not a tab. A
stage with a problem adds “, needs a fix”. The balance is a range named “Keyword ↔ vector” whose value reads “70%
vector”, “Keyword only” or “Even keyword and vector”; the threshold reads “Score at least 0.35”. Each number is named
(“Chunk size”, “Chunks into context”) and, when wrong, invalid and described by the error – “Overlap has to be smaller
than the chunk.”, “Context can't take more chunks than retrieval returns.” Filters are numbered: “Filter 2: field”,
“Remove filter 2”. In a form, the first of these problems makes it invalid.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.9 KB | 10.6 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **44.5 KB** | **12.8 KB** |
| With Lit – the first component on a page | 67.7 KB | 20.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 96 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of filterFields replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.1 ms | filterFields: first render, 96 nodes; update 0.2 ms |
| 1,000 items | 1.1 ms | filterFields: first render, 96 nodes; update 0.2 ms |

What it renders doesn't grow with filterFields (tested to 1,000 items).

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

- Name filter fields as your metadata reads to people: “Collection”, “Updated”, not `source_collection`. Give choice
  fields their options, so the value is a select.
- Name rerank models by what they are to the person tuning – “Cross-encoder · small” – not by an endpoint.
- Keep `estimate.note` to one sentence that says what to change: “Reranking 80 chunks is most of the wait – a k of 40
  halves it.”
- Pass `indexed` so changing chunking warns that sources will be re-indexed before anyone saves.

## Do and don't

### Do

- Recompute `estimate` from the value on every change, so the pipeline and the foot follow the settings.
- Put a `retrieval-inspector` beside it, run against a test question, so people see what their change does.
- Validate on the server too: `retrievalSettingsProblem` is exported for the same checks.

### Don't

- Don't show estimates you haven't measured – leave `estimate` unset rather than guess.
- Don't put embedding models or index-time settings other than chunking here; they belong where sources are managed.
- Don't default to a huge top-k with reranking on – the estimate will say it's slow, but the default should be sane.

## Related

- [Retrieval Inspector](retrieval-inspector.md) – What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it
- [Knowledge Source Manager](knowledge-source-manager.md) – Sources a knowledge base answers from – ingestion state and progress, docs and chunks, sync schedule, stale and duplicate warnings, and a handoff to chunk review
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
