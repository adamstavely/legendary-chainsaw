<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Output Schema Builder

**AI configuration** · New

Build a structured-output schema as a tree beside a rendered preview of the answer – types visible, problems flagged on their rows – with raw JSON and the JSON Schema as tabs

- **Element:** `<tc-output-schema-builder>`
- **Size:** 39.8 KB gzip · 159.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/output-schema-builder";` |
| React / Next.js | `import { OutputSchemaBuilder } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/output-schema-builder";` · tags starting with tc- are custom elements |
| Angular | `import { OutputSchemaBuilder } from "@adamstavely/trenchcoat/angular/output-schema-builder";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/output-schema-builder";` |

## Example

The live example is in the gallery at `#/output-schema-builder`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Builds the shape a model's structured answer must take, beside a picture of the answer itself. Each field is a row in a
tree – a type glyph, the name, whether it's required, its allowed values and what it means – and objects and lists of
objects open into their own fields. The preview renders a sample answer as a card: every key with its value and its
type, objects nested on a rule, so the team sees what the model will return while they edit. Pointing at a field in
either pane lights it in the other, and the selected field stays lit in both. Raw JSON and the generated JSON Schema
are the preview's other tabs. Problems such as two fields with the same name are a marker and a short note on their
row, and counted in the head, before the schema goes anywhere. It is the authoring side of `structured-output`, which
checks a model's answer against the same schema as it streams in.

### When to use

- Defining a structured output or response format for a prompt, an extraction step or an agent's final answer.
- Defining a tool's parameters, where the same object-with-fields shape applies – inside another card with `flat`.
- Reviewing an existing schema: the tree and the rendered answer read faster than raw JSON.

### When not to use

- Showing a model's answer and whether it matches – use [Structured Output](structured-output.md).
- Showing or editing schema JSON as text – use [Code Block](code-block.md).
- Choosing model parameters such as temperature – use [Model Settings](model-settings.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Status** `.ui-osb__pill` – how many fields, or how many problems, in the head
2. **Toolbar** `.ui-osb__toolbar` – add a field after the selected one or inside it, move it, remove it
3. **Field row** `.ui-osb__row` – the type glyph, name, required mark, allowed values and description
4. **Problem** `.ui-osb__issue` – a marker and a short note at the end of the field's row
5. **Preview** `.ui-osb__preview` – Output, JSON or Schema
6. **Answer** `.ui-osb__out` – the sample answer as a card: each key, its value and its type

## Looks

Standard puts the head on the gray tray above one white card: the tree on white, the preview on a sunken well with the
answer as a raised card, square type glyphs and a gray selected row. Clean is one white card with the head as its
first row: hairlines under the head and between the panes, the answer in a hairline frame, round outlined glyphs, an
accent-tinted selected row, a caption-style “Preview” label and thinner icons. Wide (640 px and up) the tree and the
preview sit side by side; narrower, the preview goes below and the tree's type names, descriptions and key hint give
way – the glyph and the preview still show the type. `flat` drops the tray and the card in either look.

## Usage

### HTML

```html
<tc-output-schema-builder id="schema" name="schema"></tc-output-schema-builder>

<script type="module">
  import "@adamstavely/trenchcoat/output-schema-builder";
  import "@adamstavely/trenchcoat/tokens.css";

  const builder = document.querySelector("#schema");
  builder.heading = "Ticket triage";
  builder.value = [
    { name: "summary", type: "string", required: true, description: "One sentence for the queue" },
    { name: "priority", type: "string", required: true, enum: ["low", "normal", "high"] },
  ];
  builder.preview = "output"; // or "sample" (raw JSON), "schema"
  builder.addEventListener("tc-value-change", (e) => console.log(builder.schema, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { OutputSchemaBuilder, schemaFromFields, type OutputSchemaField } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function TriageSchema() {
  const [fields, setFields] = useState<OutputSchemaField[]>([
    { name: "summary", type: "string", required: true },
    { name: "priority", type: "string", required: true, enum: ["low", "normal", "high"] },
  ]);
  return (
    <>
      <OutputSchemaBuilder title="Ticket triage" value={fields} onChange={setFields} defaultPreview="output" />
      <pre>{JSON.stringify(schemaFromFields(fields))}</pre>
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/output-schema-builder";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";

defineProps<{ value: TcOutputSchemaBuilder["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-output-schema-builder :value="value" @tc-value-change="onValueChange"></tc-output-schema-builder>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { OutputSchemaBuilder } from "@adamstavely/trenchcoat/angular/output-schema-builder";
import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";

@Component({
  selector: "app-output-schema-builder-example",
  imports: [OutputSchemaBuilder],
  template: `<tc-output-schema-builder [value]="value()" (tc-value-change)="onValueChange($event)"></tc-output-schema-builder>`,
})
export class OutputSchemaBuilderExample {
  readonly value = input.required<TcOutputSchemaBuilder["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/output-schema-builder";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";

  let { value }: { value: TcOutputSchemaBuilder["value"] } = $props();
  let el: TcOutputSchemaBuilder;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-output-schema-builder bind:this={el} {value}></tc-output-schema-builder>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `OutputSchemaField[]` | `[]` | The output object's fields, in order. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Output schema"` | The heading – what the output is for |
| `description` | `description` | `string` | `""` | A quieter line under the heading |
| `preview` | `preview` | `OutputSchemaPreview` | `"output"` | What the preview shows: the rendered answer ("output"), its raw JSON ("sample") or the JSON Schema ("schema") |
| `flat` | `flat` | `boolean` | `false` | Drops the tray and the card, for a builder inside another card |
| `name` | `name` | `string` | `""` | Submitted with the form: the generated JSON Schema, as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns editing off and leaves the schema out of the form; a disabled fieldset does the same |
| `schema` | – | `OutputJsonSchema` | – | The JSON Schema the fields generate |
| `sample` | – | `Record<string, unknown>` | – | A sample object of the schema's shape |
| `issues` | – | `OutputSchemaIssue[]` | – | Every problem with the fields, errors and warnings |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The fields changed ({ value: OutputSchemaField[] }); cancelable – prevent it to control `value` |
| `tc-preview-change` | – | Yes | Output, JSON or Schema was picked ({ preview: "output" \| "sample" \| "schema" }); cancelable |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `checkValidity()` | `void` | Whether the fields make a valid schema (no errors; warnings are fine) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-output-schema-builder-key` | `var(--tc-syntax-property)` | both |
| `--tc-output-schema-builder-indent` | `var(--tc-space-5)` | both |
| `--tc-output-schema-builder-guide` | `var(--tc-border-default)` | both |

#### Design tokens it reads (102)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-syntax-keyword`, `--tc-syntax-number`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-type`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `schemaIssues(fields: OutputSchemaField[], parent: number[]): OutputSchemaIssue[]` | Every problem in the tree, depth first: missing or repeated names, empty or repeated allowed values, empty objects |
| `schemaFieldError(fields: OutputSchemaField[]): string` | The first error's message, or "" when the fields make a valid schema |
| `schemaFromFields(fields: OutputSchemaField[]): OutputJsonSchema` | The JSON Schema for an object with these fields: every object closed (additionalProperties: false) |
| `sampleFromFields(fields: OutputSchemaField[]): Record<string, unknown>` | A sample object of this shape: the first allowed value, "text", 1.5, 1, true; one item per list |
| `validateOutputSample(value: unknown, schema: OutputJsonSchema, path: unknown, depth: unknown): string[]` | Checks a value against a schema from schemaFromFields; one message per problem, "$.path: …" |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-output-schema-builder :value="…">` | `<tc-output-schema-builder [value]="…">` | `<tc-output-schema-builder {value}>` |

*Also attributes: `heading`, `description`, `preview`, `flat`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-preview-change` | Yes | `el.addEventListener("tc-preview-change", (e) => …)` | `onPreviewChange={…}` | `@tc-preview-change="…"` | `(tc-preview-change)="…($event)"` | `el.addEventListener("tc-preview-change", …)` |

### Controlled

The element changes `value` and `preview` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-preview-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-output-schema-builder id="output-schema-builder"></tc-output-schema-builder>

<script type="module">
  import "@adamstavely/trenchcoat/output-schema-builder";

  const el = document.querySelector("#output-schema-builder");
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
import { OutputSchemaBuilder } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof OutputSchemaBuilder>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledOutputSchemaBuilder({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <OutputSchemaBuilder {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/output-schema-builder";
import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";

const props = defineProps<{ initial: TcOutputSchemaBuilder["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcOutputSchemaBuilder["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-output-schema-builder :value="value" @tc-value-change="onValueChange"></tc-output-schema-builder>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { OutputSchemaBuilder } from "@adamstavely/trenchcoat/angular/output-schema-builder";
import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";

@Component({
  selector: "app-controlled-output-schema-builder",
  imports: [OutputSchemaBuilder],
  template: `<tc-output-schema-builder [value]="value()" (tc-value-change)="onValueChange($event)"></tc-output-schema-builder>`,
})
export class ControlledOutputSchemaBuilder {
  readonly initial = input.required<TcOutputSchemaBuilder["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcOutputSchemaBuilder["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/output-schema-builder";
  import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";

  let { initial }: { initial: TcOutputSchemaBuilder["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcOutputSchemaBuilder;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcOutputSchemaBuilder["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-output-schema-builder bind:this={el} {value}></tc-output-schema-builder>
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
<tc-output-schema-builder :value="value" @tc-value-change="value = $event.detail.value"></tc-output-schema-builder>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-output-schema-builder [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-output-schema-builder>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-output-schema-builder bind:this={el} {value}></tc-output-schema-builder>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-output-schema-builder")` returns a `TcOutputSchemaBuilder` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";`
- **React / Next.js:** Props: `import type { OutputSchemaBuilderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof OutputSchemaBuilder>`. The element class, for refs: `import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcOutputSchemaBuilder["value"]` with `import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";`
- **Angular:** The directive types the template: `[value]` takes `TcOutputSchemaBuilder["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcOutputSchemaBuilder } from "@adamstavely/trenchcoat/output-schema-builder";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – what the output is for |
| `value` | `OutputSchemaField[]` | The output object's fields (controlled) |
| `defaultValue` | `OutputSchemaField[]` | The fields to start with when uncontrolled |
| `onChange` | `(value: OutputSchemaField[]) => void` | Called with every change to the fields |
| `preview` | `OutputSchemaPreview` | What the preview shows (controlled): the rendered answer ("output"), its raw JSON ("sample") or the JSON Schema ("schema") |
| `defaultPreview` | `OutputSchemaPreview` | What the preview shows first when uncontrolled |
| `onPreviewChange` | `(preview: OutputSchemaPreview) => void` | Called when Output, JSON or Schema is picked |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `preview`, `onChange`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the toolbar, the tree (one stop, on the selected field), the editor when open, the preview's tabs and the JSON's Copy button |
| ↑ / ↓ | In the tree: the previous or next field |
| → | On a folded object: opens it; on an open one: moves to its first field |
| ← | On an open object: folds it; on a nested field: moves to its parent |
| Home / End | In the tree: the first or last field |
| Enter / F2 | Opens the selected field's editor and puts the cursor in its name |
| Alt+↑ / Alt+↓ | Moves the field up or down among its siblings |
| Delete / Backspace | Removes the field; the next field (or its parent) takes focus |
| Enter | In the editor's name: saves it and returns to the tree; in the values box: adds the value |
| Escape | In the editor: closes it and returns to the field's row |
| ← / → / Home / End | In the toolbar: the previous, next, first or last button |

Double-clicking a row opens its editor too. Clicking a key in the answer selects its field in the tree – opening the
objects that hold it – and moves focus there.

### Screen readers

The host is a group named by the heading, and the fields are a `tree` with the same name, described by the key hint.
Each field is a `treeitem` with its level, position and `aria-expanded` for objects; its name reads the field's name,
type, “required” or “optional”, its allowed values and description, and any problem under it. The selected field has
`aria-selected="true"`. A problem adds its full reason to the row's name – “problem: Another field here is already
called “summary”” – while the row shows the short note (“Name used twice”). The toolbar is a `toolbar` named “Fields”; its icon buttons are named “Add a field inside”,
“Move up”, “Move down” and “Remove field”. The editor is a group named “Edit priority”. A status region reads
“Added field_7”, “Moved summary down, 2 of 4” and “Removed seats”. Output, JSON and Schema are a radiogroup named
“Preview”. The answer is a group named “What the model returns, with each value's type”, made of nested lists – each
item reads its key, value and type, with “?” after an optional key.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, code-block, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, code-block, internal/kit, inline-diff, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | code-block, segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 43.7 KB | 12.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.5 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **159.4 KB** | **39.8 KB** |
| With Lit – the first component on a page | 182.3 KB | 47.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.8 ms** | the gallery demo's data, 271 DOM nodes – to layout, median of 7 |
| Typical update | **1.1 ms** | one item of value replaced |
| First on the page | 26 ms | default properties; includes adding its CSS to the document |
| 100 items | 30 ms | value: first render, 3,357 nodes; update 3.8 ms |
| 1,000 items | 163 ms | value: first render, 33,478 nodes; update 21 ms |

1,000 items of value: 163 ms. It renders every item, so a first render passes 50 ms (a long task) at about 310 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (code-block), `setTimeout` (inline-diff), `setTimeout` (segmented-control).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff), `ResizeObserver` (segmented-control), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name fields the way the code that reads them expects them: `snake_case` or `camelCase`, never spaces.
- Write a description for every field the model could misread – it goes into the schema and the model sees it, and
  the answer card shows it in place of a text value: “One sentence a person can read in the queue”.
- Use allowed values for anything a program switches on (a category, a priority) and keep them lower-case; the answer
  shows the first one and how many others there are.
- The heading names what the output is for (“Ticket triage”), not “Schema”.

## Do and don't

### Do

- Keep fields required unless the model can genuinely leave them out – optional fields are often skipped.
- Fix every problem before saving; with `name` in a form, the builder is invalid until you do.
- Store `value` (the fields) and generate the schema with `schemaFromFields` where you need it, so the builder can
  open it again.

### Don't

- Don't nest more than two or three levels; deep schemas are harder for a model to fill in.
- Don't rely on the sample as test data – it's the shape with placeholder values (the description, “text”, 1, true).
- Don't use the builder to validate a model's answer – the app sends the schema to the model and checks the answer,
  for example with `structured-output`.

## Related

- [Structured Output](structured-output.md) – Streaming JSON as a typed tree, checked against its schema as it arrives – missing and invalid fields flagged, copy as JSON or code
- [Tool Configuration](tool-configuration.md) – A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
