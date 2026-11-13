<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# AI Column Create

**AI configuration** · New

One prompt filled in for every row of a table – the column's name and what it holds (text, number, yes or no, choices, link or JSON), the prompt with the table's columns as {{variables}} inserted from chips and unknown ones called out, the model and web search, Try on 3 rows with the answers shown, and Create column beside the run's estimate

- **Element:** `<tc-ai-column-create>`
- **Size:** 9.1 KB gzip · 30.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-column-create";` |
| React / Next.js | `import { AiColumnCreate } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-column-create";` · tags starting with tc- are custom elements |
| Angular | `import { AiColumnCreate } from "@adamstavely/trenchcoat/angular/ai-column-create";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-column-create";` |

## Example

The live example is in the gallery at `#/ai-column-create`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One prompt, filled in for every row of a table. Name the column and choose what it holds – text, a number, yes or no,
one of a few choices, a link or JSON. Write the prompt with the table's columns as `{{column}}` variables: the chips
under the field insert them at the caret, and a variable the table doesn't have is called out. Pick the model and
whether it may search the web. "Try on 3 rows" asks the page for a preview and shows the three answers; Create column
hands the column back, beside the page's estimate of what the run will take.

### When to use

- Adding an AI column to a table people are enriching.
- Any "run this prompt on every row" setup where trying it on a few rows first saves a costly run.

### When not to use

- Watching the column fill in – use [Enrichment Grid](enrichment-grid.md).
- A system prompt for an agent, with versions – use [Instruction Editor](instruction-editor.md).
- Reusable prompt templates people fill in once – use [Prompt Library](prompt-library.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Name** `.ui-aic__input[data-field="name"]` – the column's name
2. **Holds** `.ui-aic__input[data-field="type"]` – what the column holds
3. **Choices** `.ui-aic__input[data-field="options"]` – for "One of a few choices", separated by commas
4. **Prompt** `.ui-aic__prompt` – with `{{column}}` variables
5. **Columns** `.ui-aic__chips` – chips that insert a variable; one used is tinted, an unknown one is red
6. **Model** `.ui-aic__input[data-field="model"]` and **Search the web** `.ui-aic__switch`
7. **Preview** `.ui-aic__preview` – the three rows and their answers
8. **Problem** `.ui-aic__problem` – what's missing, in words, under its field
9. **Estimate** `.ui-aic__estimate` – what the run will take, from the page
10. **Try on 3 rows** `.ui-aic__try` and **Create column** `.ui-aic__create`

## Looks

Standard puts the header on the gray tray above a white card holding the form, with the estimate and the buttons on the
tray below. Clean is one white card: the header its first row, the buttons its last. Narrower than 460 px, the paired
fields stack.

## Usage

### HTML

```html
<tc-ai-column-create id="column" estimate="2,000 rows · about 3 min · about $1.40"></tc-ai-column-create>

<script type="module">
  import "@adamstavely/trenchcoat/ai-column-create";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#column");
  form.columns = [
    { id: "vendor", label: "Vendor" },
    { id: "website", label: "Website" },
  ];
  form.models = [
    { id: "fast", label: "Fast model" },
    { id: "careful", label: "Careful model" },
  ];
  form.addEventListener("tc-preview", () => {
    setTimeout(() => {
      form.preview = [
        { id: "v1", label: "Northwind Labs", value: "Software" },
        { id: "v2", label: "Cedarfield Supply", value: "Logistics" },
        { id: "v3", label: "Harborstone Print", value: "Printing" },
      ];
    }, 800);
  });
  form.addEventListener("tc-create", (e) => console.log("Create", e.detail.column));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AiColumnCreate, defaultAiColumnValue, type AiColumnPreviewRow, type AiColumnValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NewColumn({ tryRows, create }: { tryRows: (c: AiColumnValue) => Promise<AiColumnPreviewRow[]>; create: (c: AiColumnValue) => void }) {
  const [value, setValue] = useState<AiColumnValue>(defaultAiColumnValue);
  const [preview, setPreview] = useState<AiColumnPreviewRow[] | null>(null);
  return (
    <AiColumnCreate
      columns={[
        { id: "vendor", label: "Vendor" },
        { id: "website", label: "Website" },
      ]}
      models={[{ id: "fast", label: "Fast model" }]}
      value={value}
      onValueChange={setValue}
      preview={preview}
      onPreview={(column) => void tryRows(column).then(setPreview)}
      onCreate={create}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-column-create";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";

defineProps<{ value: TcAiColumnCreate["value"]; columns: TcAiColumnCreate["columns"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-column-create :value="value" :columns="columns" @tc-value-change="onValueChange"></tc-ai-column-create>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiColumnCreate } from "@adamstavely/trenchcoat/angular/ai-column-create";
import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";

@Component({
  selector: "app-ai-column-create-example",
  imports: [AiColumnCreate],
  template: `<tc-ai-column-create [value]="value()" [columns]="columns()" (tc-value-change)="onValueChange($event)"></tc-ai-column-create>`,
})
export class AiColumnCreateExample {
  readonly value = input.required<TcAiColumnCreate["value"]>();
  readonly columns = input.required<TcAiColumnCreate["columns"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-column-create";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";

  let { value, columns }: { value: TcAiColumnCreate["value"]; columns: TcAiColumnCreate["columns"] } = $props();
  let el: TcAiColumnCreate;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-ai-column-create bind:this={el} {value} {columns}></tc-ai-column-create>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"New AI column"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `value` | – | `AiColumnValue` | `{ ...defaultAiColumnValue }` | The column being written. Changed by editing unless a tc-value-change listener calls preventDefault() |
| `columns` | – | `AiColumnSource[]` | `[]` | The table's columns – the prompt's variables |
| `models` | – | `AiColumnModel[]` | `[]` | The models to pick from; the first is the default |
| `preview` | – | `AiColumnPreviewRow[] \| null` | `null` | The preview's rows, from the page after tc-preview (null: none yet) |
| `previewing` | `previewing` | `boolean` | `false` | A preview is running – set by Try unless prevented; clear it when `preview` is in |
| `estimate` | `estimate` | `string \| undefined` | `undefined` | What running the column will take, in words – "2,000 rows · about 3 min · about $1.40" |
| `createLabel` | `create-label` | `string` | `"Create column"` | The label of the button that creates the column |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A field was edited ({ value, field }: AiColumnValueChange); cancelable – prevented, `value` stays as it was |
| `tc-preview` | – | Yes | Try on 3 rows was pressed with a column that can run ({ column }: AiColumnRequest); cancelable – prevented, `previewing` stays off |
| `tc-create` | – | Yes | Create column was pressed with a column that can run ({ column }: AiColumnRequest); cancelable – prevented, nothing is announced |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-aic-track-w` | `32px` | standard, clean |
| `--tc-aic-track-h` | `18px` | standard, clean |
| `--tc-aic-knob` | `14px` | standard, clean |

#### Design tokens it reads (72)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shimmer`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `promptVariables(prompt: string): string[]` | The {{variables}} a prompt uses, in order, each once |
| `aiColumnProblems(value: AiColumnValue, columns: readonly AiColumnSource[]): Partial<Record<AiColumnField, string>>` | What's wrong with the column, by field, in words – empty when it can run |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-ai-column-create :value="…">` | `<tc-ai-column-create [value]="…">` | `<tc-ai-column-create {value}>` |
| `columns` | `el.columns = …;` | `<… columns={…} />` | `<tc-ai-column-create :columns="…">` | `<tc-ai-column-create [columns]="…">` | `<tc-ai-column-create {columns}>` |
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-ai-column-create :models="…">` | `<tc-ai-column-create [models]="…">` | `<tc-ai-column-create {models}>` |
| `preview` | `el.preview = …;` | `<… preview={…} />` | `<tc-ai-column-create :preview="…">` | `<tc-ai-column-create [preview]="…">` | `<tc-ai-column-create {preview}>` |

*Also attributes: `heading`, `description`, `previewing`, `estimate`, `create-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-preview` | Yes | `el.addEventListener("tc-preview", (e) => …)` | `onPreview={…}` | `@tc-preview="…"` | `(tc-preview)="…($event)"` | `el.addEventListener("tc-preview", …)` |
| `tc-create` | Yes | `el.addEventListener("tc-create", (e) => …)` | `onCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ai-column-create id="ai-column-create"></tc-ai-column-create>

<script type="module">
  import "@adamstavely/trenchcoat/ai-column-create";

  const el = document.querySelector("#ai-column-create");
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
import "@adamstavely/trenchcoat/ai-column-create";
import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";

const props = defineProps<{ initial: TcAiColumnCreate["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcAiColumnCreate["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-ai-column-create :value="value" @tc-value-change="onValueChange"></tc-ai-column-create>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AiColumnCreate } from "@adamstavely/trenchcoat/angular/ai-column-create";
import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";

@Component({
  selector: "app-controlled-ai-column-create",
  imports: [AiColumnCreate],
  template: `<tc-ai-column-create [value]="value()" (tc-value-change)="onValueChange($event)"></tc-ai-column-create>`,
})
export class ControlledAiColumnCreate {
  readonly initial = input.required<TcAiColumnCreate["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcAiColumnCreate["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-column-create";
  import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";

  let { initial }: { initial: TcAiColumnCreate["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcAiColumnCreate;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcAiColumnCreate["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-ai-column-create bind:this={el} {value}></tc-ai-column-create>
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
<tc-ai-column-create :value="value" @tc-value-change="value = $event.detail.value"></tc-ai-column-create>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-ai-column-create [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-ai-column-create>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-ai-column-create bind:this={el} {value}></tc-ai-column-create>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-column-create")` returns a `TcAiColumnCreate` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";`
- **React / Next.js:** Props: `import type { AiColumnCreateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AiColumnCreate>`. The element class, for refs: `import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiColumnCreate["value"]` with `import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";`
- **Angular:** The directive types the template: `[value]` takes `TcAiColumnCreate["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiColumnCreate } from "@adamstavely/trenchcoat/ai-column-create";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `value` | `AiColumnValue` | The column being written. Controlled when defined – pass back what onValueChange reports |
| `defaultValue` | `AiColumnValue` | The column to start from, when uncontrolled |
| `onValueChange` | `(value: AiColumnValue, field: AiColumnField) => void` | A field was edited: the whole column and which field |
| `onPreview` | `(column: AiColumnValue) => void \| boolean` | Try on 3 rows was pressed: run the prompt on three rows and pass `preview` back. Return false to stay idle |
| `onCreate` | `(column: AiColumnValue) => void \| boolean` | Create column was pressed with a column that can run. Return false to stop it being announced |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move through the fields, the column chips and the buttons |
| Enter / Space on a chip | Insert `{{column}}` at the caret and go back to the prompt |
| Space on Search the web | Turn web search on or off |

### Screen readers

Every field has a visible label. A field with a problem is `aria-invalid`, with the problem as its description; Try
and Create show every problem, move focus to the first and announce it. The chips are a group named "Insert a column",
each saying its variable and whether the prompt uses it. Search the web is a switch. The preview is a section named
"Preview", `aria-busy` while it runs; its arrival, an insertion and Create are announced through `role="status"`.
While the column can't run, Try and Create are `aria-disabled` with the reasons as their description.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 23.3 KB | 7.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.7 KB** | **9.1 KB** |
| With Lit – the first component on a page | 51.4 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 70 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of columns replaced |
| First on the page | 39 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.2 ms | columns: first render, 555 nodes; update 0.5 ms |
| 1,000 items | 30 ms | columns: first render, 5,055 nodes; update 3.1 ms |

1,000 items of columns: 30 ms, 5,055 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name the column for what it holds: "Headquarters city".
- Ask for a short answer in the prompt – one cell shows one line.
- For a choice column, give the choices the model may pick and an "Other".
- Keep the estimate to rows, time and cost: "2,000 rows · about 3 min · about $1.40".

## Do and don't

### Do

- Run the preview on rows that differ – a well-known vendor and an obscure one.
- Update `estimate` when the model or web search changes the cost.

### Don't

- Don't start the run from Try – it's a preview of three rows.
- Don't let the page create a column the element reports problems for; it checks before firing.

## Related

- [Enrichment Grid](enrichment-grid.md) – A table a model fills in, cell by cell – source columns and sparkle-marked AI columns with their prompt on the header, each cell queued, filling, done with its confidence and source, failed with Retry, or to review; the run counted in words with the time left, Pause / Resume and Retry failed, and only the rows in view drawn
- [Instruction Editor](instruction-editor.md) – System and developer instructions with variable chips, missing and unused warnings, an app-supplied token count, versions and a word diff
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
