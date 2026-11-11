<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Evaluation Dataset Editor

**AI configuration** · New

Edit an eval set's cases, checks, tags and splits, compare it with an earlier version, and import or export it as JSON Lines

- **Element:** `<tc-evaluation-dataset-editor>`
- **Size:** 19.4 KB gzip · 74.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/evaluation-dataset-editor";` |
| React / Next.js | `import { EvaluationDatasetEditor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/evaluation-dataset-editor";` · tags starting with tc- are custom elements |
| Angular | `import { EvaluationDatasetEditor } from "@adamstavely/trenchcoat/angular/evaluation-dataset-editor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/evaluation-dataset-editor";` |

## Example

The live example is in the gallery at `#/evaluation-dataset-editor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Edits the set of test cases an eval runs. Each case is an input, what a good answer looks like – an expected output,
checks such as “contains”, “equals”, “matches schema” or a rubric line, or both – its tags and the split it belongs
to. A bar shows how the cases divide between train, validation and test; the table holds thousands of cases and
filters by split, by text and to what changed since an earlier version. An open case reads as a test case – the
prompt quoted beside the rules it has to pass, such as `output contains "refund"` – and Edit turns it into a form;
what's wrong with a case shows where it's wrong. It pairs with `eval-scorecard`: this is where the set is written, the scorecard is where the
results of running it are read. The component never runs anything – import, export and running the eval belong to
the app.

### When to use

- Curating an evaluation set: adding cases, writing checks, tagging and splitting them.
- Reviewing what changed in a set before a new version is used for a release decision.
- Receiving cases from elsewhere – reviewed conversations, a support export – and putting them in the right split.

### When not to use

- Reading the results of running the set against prompt or model versions – use [Eval Scorecard](eval-scorecard.md).
- Rating one answer so it can become a case – use [Feedback Rubric](feedback-rubric.md).
- Comparing two runs of one task step by step – use [Run Compare](run-compare.md).
- Tabular data that isn't a test set – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the set's name, the case count, problems, Compare, Import, Export and Add case
2. **Split bar** `.ui-eds__splits` – the share of cases in each split, with the change since the compared version
3. **Filters** `.ui-eds__filters` – the split as a radio group with counts, search, Changed and the removed cases
4. **Table** `.ui-eds__grid` – one row per case: its input, what checks it, its tags as chips and its split
5. **Open case** `.ui-eds__read` – the quoted prompt beside the rules it has to pass, with its split and tags; Edit

## Looks

Standard puts the header on a gray tray above a white card, with a square mark tile, a semibold title and the open
row filled gray; the prompt has a gray rule down its side. Clean is one white card with hairline dividers: a rounded
mark, caption-style column heads and labels, round split dots and tag chips, an accent rule beside the prompt, and the
open row and picked split tinted with the accent. Wide, the open case sits beside the table, the table runs as tall
as it and the tags move under each input; the prompt and the rules sit side by side once the case has 480 px, stacked
below that. Under 600 px the table keeps the case (tags under it) and its split, the case sits below and the header's
buttons wrap under the title (icons only under 400 px).

## Usage

### HTML

```html
<tc-evaluation-dataset-editor id="set" name="set"></tc-evaluation-dataset-editor>

<script type="module">
  import "@adamstavely/trenchcoat/evaluation-dataset-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const set = document.querySelector("#set");
  set.heading = "Support replies";
  set.value = {
    cases: [
      { id: "case-1", input: "Where is my order 10400?", expected: "Gives the tracking link", assertions: [{ id: "c1", type: "contains", value: "tracking" }], tags: ["shipping"], split: "train" },
      { id: "case-2", input: "Refund for a broken mug", assertions: [{ id: "c1", type: "rubric", value: "Offers a refund or a replacement" }], tags: ["refunds"], split: "test" },
    ],
  };
  set.addEventListener("tc-export", (e) => console.log(e.detail.jsonl));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EvaluationDatasetEditor, type EvaluationDatasetValue, type EvaluationDatasetVersion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SupportSet({ start, versions }: { start: EvaluationDatasetValue; versions: EvaluationDatasetVersion[] }) {
  const [value, setValue] = useState(start);
  return (
    <EvaluationDatasetEditor
      title="Support replies"
      value={value}
      onChange={setValue}
      versions={versions}
      defaultCompare={versions[versions.length - 1]?.id ?? ""}
      onImport={() => console.log("open a file picker")}
      onExport={(_, jsonl) => console.log(jsonl.length)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/evaluation-dataset-editor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";

defineProps<{ value: TcEvaluationDatasetEditor["value"]; splits: TcEvaluationDatasetEditor["splits"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-evaluation-dataset-editor :value="value" :splits="splits" @tc-value-change="onValueChange"></tc-evaluation-dataset-editor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EvaluationDatasetEditor } from "@adamstavely/trenchcoat/angular/evaluation-dataset-editor";
import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";

@Component({
  selector: "app-evaluation-dataset-editor-example",
  imports: [EvaluationDatasetEditor],
  template: `<tc-evaluation-dataset-editor [value]="value()" [splits]="splits()" (tc-value-change)="onValueChange($event)"></tc-evaluation-dataset-editor>`,
})
export class EvaluationDatasetEditorExample {
  readonly value = input.required<TcEvaluationDatasetEditor["value"]>();
  readonly splits = input.required<TcEvaluationDatasetEditor["splits"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evaluation-dataset-editor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";

  let { value, splits }: { value: TcEvaluationDatasetEditor["value"]; splits: TcEvaluationDatasetEditor["splits"] } = $props();
  let el: TcEvaluationDatasetEditor;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-evaluation-dataset-editor bind:this={el} {value} {splits}></tc-evaluation-dataset-editor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `EvaluationDatasetValue` | `{ cases: [] }` | The set. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `splits` | – | `EvaluationSplit[]` | `[ { id: "train", label: "Train" }, { id: "validation", label: "Validation" }, { id: "test", label: "Test" }, ]` | The splits a case can go in, in order – train, validation and test by default |
| `assertionTypes` | – | `EvaluationAssertionType[]` | `[ { id: "contains", label: "Contains", placeholder: "Text the answer must include", description: "Passes when the answer includes this text" }, { id: "equals", label: "Equals", placeholder: "The exact answer", description: "Passes when the answer is exactly this" }, { id: "schema", label: "Matches schema", placeholder: '{ "type": "object", "required": ["answer"] }', description: "Passes when the answer is JSON that fits this JSON Schema", multiline: true, json: true }, { id: "rubric", label: "Rubric", placeholder: "What a good answer does, for a grader to judge", description: "A grader scores the answer against this criterion", multiline: true }, ]` | The kinds of check a case can have – contains, equals, matches schema and rubric by default |
| `versions` | – | `EvaluationDatasetVersion[]` | `[]` | Earlier snapshots of the set, oldest first, offered in the Compare select |
| `compare` | `compare` | `string` | `""` | The id of the version to compare with, or "" for none. Changed by the user unless tc-compare-change is prevented |
| `open` | – | `string \| null` | `null` | The id of the case open in the editor, or null. Changed by the user unless tc-open-change is prevented |
| `heading` | `heading` | `string` | `"Evaluation set"` | The heading – the set's name |
| `description` | `description` | `string` | `""` | A quieter line beside the heading, e.g. what the set tests |
| `maxHeight` | `max-height` | `number` | `400` | The table's height before it scrolls, in px |
| `name` | `name` | `string` | `""` | Submitted with the form: the set as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the set out of the form; a disabled fieldset does the same |
| `problems` | – | `EvaluationIssue[]` | – | Every problem in the set, in case order |
| `comparison` | – | `EvaluationComparison \| null` | – | What changed since the compared version; null when not comparing |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A case was added, edited, deleted or restored ({ value }: EvaluationDatasetValueChange); cancelable – prevent it to control `value` |
| `tc-open-change` | – | Yes | A case was opened or closed ({ open }: EvaluationDatasetOpenChange – the case id or null); cancelable |
| `tc-compare-change` | – | Yes | A version to compare with was picked ({ compare }: EvaluationDatasetCompareChange – a version id, or "" for none); cancelable |
| `tc-import` | – | No | Import was pressed: the app reads a file and sets `value`; detail: null |
| `tc-export` | – | No | Export was pressed ({ value, jsonl }: EvaluationDatasetExport – the set and the same set as JSON Lines) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-evaluation-dataset-editor-row` | `38px` | both, clean |
| `--tc-evaluation-dataset-editor-side` | `380px` | both |
| `--tc-evaluation-dataset-editor-columns` | `minmax(0, 1fr) 148px 168px 104px` | both |

#### Design tokens it reads (138)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-evaluation-dataset-editor-max`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-syntax-keyword`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-text`, `--tc-syntax-type`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-weight`, `--tc-title-tracking`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-rose-solid`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-teal-solid`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tone-violet-solid`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `evaluationDatasetIssues(value: EvaluationDatasetValue, o: { assertionTypes?: EvaluationAssertionType[]; splits?: EvaluationSplit[] }): EvaluationIssue[]` | Every problem in a set, case by case in order |
| `compareEvaluationDatasets(base: readonly EvaluationCase[], current: readonly EvaluationCase[]): EvaluationComparison` | The cases added, edited (same id, different content) and removed since `base` |
| `evaluationDatasetToJsonl(value: EvaluationDatasetValue): string` | The set as JSON Lines – one case per line |
| `evaluationDatasetFromJsonl(text: string): { value: EvaluationDatasetValue; errors: string[] }` | Reads JSON Lines back into a set; lines that can't be read are skipped and reported with their line number |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-evaluation-dataset-editor :value="…">` | `<tc-evaluation-dataset-editor [value]="…">` | `<tc-evaluation-dataset-editor {value}>` |
| `splits` | `el.splits = …;` | `<… splits={…} />` | `<tc-evaluation-dataset-editor :splits="…">` | `<tc-evaluation-dataset-editor [splits]="…">` | `<tc-evaluation-dataset-editor {splits}>` |
| `assertionTypes` | `el.assertionTypes = …;` | `<… assertionTypes={…} />` | `<tc-evaluation-dataset-editor :assertionTypes="…">` | `<tc-evaluation-dataset-editor [assertionTypes]="…">` | `<tc-evaluation-dataset-editor {assertionTypes}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-evaluation-dataset-editor :versions="…">` | `<tc-evaluation-dataset-editor [versions]="…">` | `<tc-evaluation-dataset-editor {versions}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-evaluation-dataset-editor :open="…">` | `<tc-evaluation-dataset-editor [open]="…">` | `<tc-evaluation-dataset-editor {open}>` |

*Also attributes: `compare`, `heading`, `description`, `max-height`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-compare-change` | Yes | `el.addEventListener("tc-compare-change", (e) => …)` | `onCompareChange={…}` | `@tc-compare-change="…"` | `(tc-compare-change)="…($event)"` | `el.addEventListener("tc-compare-change", …)` |
| `tc-import` | No | `el.addEventListener("tc-import", (e) => …)` | `onImport={…}` | `@tc-import="…"` | `(tc-import)="…($event)"` | `el.addEventListener("tc-import", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value`, `compare` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change`, `tc-compare-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-evaluation-dataset-editor id="evaluation-dataset-editor"></tc-evaluation-dataset-editor>

<script type="module">
  import "@adamstavely/trenchcoat/evaluation-dataset-editor";

  const el = document.querySelector("#evaluation-dataset-editor");
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
import { EvaluationDatasetEditor } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof EvaluationDatasetEditor>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledEvaluationDatasetEditor({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <EvaluationDatasetEditor {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/evaluation-dataset-editor";
import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";

const props = defineProps<{ initial: TcEvaluationDatasetEditor["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcEvaluationDatasetEditor["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-evaluation-dataset-editor :value="value" @tc-value-change="onValueChange"></tc-evaluation-dataset-editor>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EvaluationDatasetEditor } from "@adamstavely/trenchcoat/angular/evaluation-dataset-editor";
import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";

@Component({
  selector: "app-controlled-evaluation-dataset-editor",
  imports: [EvaluationDatasetEditor],
  template: `<tc-evaluation-dataset-editor [value]="value()" (tc-value-change)="onValueChange($event)"></tc-evaluation-dataset-editor>`,
})
export class ControlledEvaluationDatasetEditor {
  readonly initial = input.required<TcEvaluationDatasetEditor["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcEvaluationDatasetEditor["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evaluation-dataset-editor";
  import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";

  let { initial }: { initial: TcEvaluationDatasetEditor["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcEvaluationDatasetEditor;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcEvaluationDatasetEditor["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-evaluation-dataset-editor bind:this={el} {value}></tc-evaluation-dataset-editor>
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
<tc-evaluation-dataset-editor :value="value" @tc-value-change="value = $event.detail.value"></tc-evaluation-dataset-editor>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-evaluation-dataset-editor [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-evaluation-dataset-editor>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-evaluation-dataset-editor bind:this={el} {value}></tc-evaluation-dataset-editor>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-evaluation-dataset-editor")` returns a `TcEvaluationDatasetEditor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";`
- **React / Next.js:** Props: `import type { EvaluationDatasetEditorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EvaluationDatasetEditor>`. The element class, for refs: `import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEvaluationDatasetEditor["value"]` with `import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";`
- **Angular:** The directive types the template: `[value]` takes `TcEvaluationDatasetEditor["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEvaluationDatasetEditor } from "@adamstavely/trenchcoat/evaluation-dataset-editor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – the set's name |
| `value` | `EvaluationDatasetValue` | The set (controlled) |
| `defaultValue` | `EvaluationDatasetValue` | The set to start with when uncontrolled |
| `onChange` | `(value: EvaluationDatasetValue) => void` | Called with the whole set after every edit |
| `compare` | `string` | The id of the version to compare with, "" for none (controlled) |
| `defaultCompare` | `string` | The version to compare with on mount when `compare` isn't controlled |
| `onCompareChange` | `(compare: string) => void` | A version to compare with was picked ("" for none) |
| `open` | `string \| null` | The id of the open case, or null (controlled when given) |
| `onOpenChange` | `(open: string \| null) => void` | A case was opened or closed (its id, or null) |
| `onImport` | `() => void` | Import was pressed – read a file and pass the cases back through `value` |
| `onExport` | `(value: EvaluationDatasetValue, jsonl: string) => void` | Export was pressed, with the set and the same set as JSON Lines |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `open`, `compare`, `onChange`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the header's controls, the split filter, search, the toggles, the table (one stop) and the open case |
| ← / → / ↑ / ↓ | In the split filter: picks the previous or next split. In the table: moves the active cell. In the case's split: picks the previous or next split |
| Home / End | In the table: first or last cell of the row |
| Ctrl+Home / Ctrl+End | In the table: first or last case |
| Page Up / Page Down | In the table: up or down ten cases |
| Enter / Space | In the table: opens the active row's case to read |
| F2 | In the table: opens the active row's case in its form. In the open case: edits it |
| Enter | On the open case's read view: edits it |
| Escape | In the form: saves the field being typed in and goes back to the read view. In the read view or the table: closes the case and returns to the table |
| Enter or , | In the tags field: adds the tag typed |
| Backspace | In an empty tags field: removes the last tag |

Edit and Done switch between the read view and the form; the form's cursor starts in the input, and Done or Escape
returns focus to Edit. The form's fields are native textareas, inputs and selects with their usual keys; an edit is
saved when the field loses focus, or on Done or Escape.

### Screen readers

The host is a group named by the heading. The table is a `grid` named by the heading, with `aria-rowcount` for every
case on show (rows outside the window aren't in the page) and `aria-activedescendant` on the active cell. A row
with a problem starts “Has a problem” or “Has a warning”; a changed row starts with its “New” or “Edited” pill. The
split filter is a `radiogroup` named “Split”, each option read with its count (“Train, 1,681 cases”). The legend
is a list named “Cases by split” – “Train 1,681, 70%, +7 since v3”. The open case is a region named “Case case-r1”; its read
view is a focusable group with the same name, described by “Enter or F2 to edit”, and a broken rule starts with
“Problem:”. In the form, a check with a problem is `aria-invalid` and described by it (“Check 1 isn't valid JSON”). A status region says the
number of cases after a filter, “Case added”, “Case deleted”, “Case restored” and “Compared with v3: 12 new, 4 edited,
3 removed”. In a form, a set with an error is invalid (“Fix 1 problem in the cases first.”).

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 63.9 KB | 16.1 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **74.1 KB** | **19.4 KB** |
| With Lit – the first component on a page | 97.2 KB | 27.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **8.3 ms** | the gallery demo's data, 1,049 DOM nodes – to layout, median of 7 |
| Typical update | **2.4 ms** | one item of assertionTypes replaced |
| First on the page | 26 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 9.5 ms | assertionTypes: first render, 1,049 nodes; update 2.9 ms |

Windowed: 10,000 items of assertionTypes render 1,049 nodes in 9.5 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the set for what it tests – “Support replies”, “Refund policy answers” – and use `description` for its scope.
- Write inputs as the person would type them, typos included; the input is the row's label, so lead with the point.
- Checks read back as rules – “output contains “5–10 business days””, a rubric as its criterion – so write the value
  as the rule's end, not as a sentence about it.
- Prefer one check per behaviour: “contains · 5–10 business days” rather than a rubric that says the same thing.
- Version labels are short (“v3”) with the when or why in `detail` (“Oct 19 · before the refund policy”).
- Splits and check types are data: pass your own (`dev` and `test`, a “regex” check) with plain labels.

## Do and don't

### Do

- Keep the earlier versions the team decides against in `versions`, so a reviewer can see what changed and restore a
  removed case.
- Read the file in `tc-import` with your own picker; `evaluationDatasetFromJsonl` reads JSON Lines and reports bad
  lines by number.
- Run the checks on the server, and show the results in `eval-scorecard`.
- Store `value` as it is – the app owns the ids.

### Don't

- Don't run evals from the client because the set is here – the component has no run action on purpose.
- Don't move a case between test and train to make a number better; the deltas show it.
- Don't put secrets or personal data into inputs; redact before cases reach the set (`conversation-annotation`
  can redact spans first).

## Related

- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
