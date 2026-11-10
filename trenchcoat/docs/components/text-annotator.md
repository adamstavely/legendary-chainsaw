<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Text Annotator

**Inputs & controls** · New

Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter

- **Element:** `<tc-text-annotator>`
- **Size:** 20.9 KB gzip · 69.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/text-annotator";` |
| React / Next.js | `import { TextAnnotator } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/text-annotator";` · tags starting with tc- are custom elements |
| Angular | `import { TextAnnotator } from "@adamstavely/trenchcoat/angular/text-annotator";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/text-annotator";` |

## Example

The live example is in the gallery at `#/text-annotator`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A document people can mark up together. Select a passage with the pointer or the keyboard and a small toolbar offers
a highlight colour, Comment and Copy. Highlights stay in the text as coloured marks; comments sit in a margin rail
beside the passage they're about, and move under the text when the component is narrow. Each note can be edited,
resolved or removed, and the rail can be narrowed to one colour, one person or the open notes only. The app owns the
annotations: every change is a cancelable event.

### When to use

- Reviewing a draft, a brief, a contract or a post-mortem, where comments belong to exact sentences.
- Letting readers keep their own highlights in long text, in a colour code they choose.
- Showing a document someone else has annotated, read-only, with the notes beside the passages.

### When not to use

- Labelling turns of a conversation for a dataset (redaction, ratings, corrections) – use [Conversation annotation](conversation-annotation.md).
- A discussion about a whole item rather than a passage – use [Comment Thread](comment-thread.md), or [Comments Panel](comments-panel.md) for many threads.
- Proposing a rewrite to accept or reject – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-tan__text` – the document; one tab stop with a caret for selecting by keyboard
2. **Highlight** `.ui-tan__mark` – a passage marked in a colour; resolved ones are a dotted underline
3. **Filters** `.ui-tan__filterbar` – show one colour, one person or the open notes only
4. **Rail** `.ui-tan__rail` – the notes, each beside its highlight (under the text when narrow)
5. **Note** `.ui-tan__note` – who and when, the comment, and Edit, Resolve and Remove

## Looks

Standard puts the header on the gray tray and the document on a white card; each note is a small raised card with a
coloured edge. Clean is one white card with the header as its first row, notes as quiet rows that tint on hover, and
thinner icons. Both use the highlight colour tokens (`--tc-highlight-*`); Clean's fills
are a step lighter in the light theme.

## Usage

### HTML

```html
<tc-text-annotator id="review" heading="Post-mortem review" author="Jo Park"></tc-text-annotator>

<script type="module">
  import "@adamstavely/trenchcoat/text-annotator";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.text = "Why the welcome emails stopped\n\nFor nine days in March, new customers didn't get their welcome email.";
  review.value = [{ id: "n1", start: 32, end: 54, color: "yellow", author: "Maya Chen", comment: "Exact dates?" }];
  review.timestamp = () => new Date().toISOString();
  review.addEventListener("tc-value-change", (e) => console.log(e.detail.change.type, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TextAnnotator, type TextAnnotation } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const text = "Why the welcome emails stopped\n\nFor nine days in March, new customers didn't get their welcome email.";

export function Review() {
  const [notes, setNotes] = useState<TextAnnotation[]>([{ id: "n1", start: 32, end: 54, color: "yellow", author: "Maya Chen", comment: "Exact dates?" }]);
  return <TextAnnotator title="Post-mortem review" text={text} author="Jo Park" value={notes} onChange={setNotes} timestamp={() => new Date().toISOString()} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/text-annotator";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";

defineProps<{ value: TcTextAnnotator["value"]; colors: TcTextAnnotator["colors"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-text-annotator :value="value" :colors="colors" @tc-value-change="onValueChange"></tc-text-annotator>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TextAnnotator } from "@adamstavely/trenchcoat/angular/text-annotator";
import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";

@Component({
  selector: "app-text-annotator-example",
  imports: [TextAnnotator],
  template: `<tc-text-annotator [value]="value()" [colors]="colors()" (tc-value-change)="onValueChange($event)"></tc-text-annotator>`,
})
export class TextAnnotatorExample {
  readonly value = input.required<TcTextAnnotator["value"]>();
  readonly colors = input.required<TcTextAnnotator["colors"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/text-annotator";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";

  let { value, colors }: { value: TcTextAnnotator["value"]; colors: TcTextAnnotator["colors"] } = $props();
  let el: TcTextAnnotator;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-text-annotator bind:this={el} {value} {colors}></tc-text-annotator>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Annotations"` | The heading, and the component's name |
| `description` | `description` | `string` | `""` | A quieter line under the heading – the document's name or where it came from |
| `text` | `text` | `string` | `""` | The document: plain text, paragraphs separated by blank lines. Offsets index into it |
| `value` | – | `TextAnnotation[]` | `[]` | The annotations. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `author` | `author` | `string` | `""` | Who is annotating: the author of new annotations |
| `colors` | – | `HighlightColor[]` | `["yellow", "green", "blue", "pink", "purple"]` | The colours the toolbar offers, in order (1–5 pick them from the keyboard) |
| `colorNames` | – | `Record<HighlightColor, string>` | `{ yellow: "Yellow", green: "Green", blue: "Blue", pink: "Pink", purple: "Purple" }` | The colours' names, as people read and hear them |
| `filter` | – | `TextAnnotatorFilter` | `{ colors: [], authors: [], resolved: true }` | What the rail and the marks show; changed from the filter bar (tc-filter-change) |
| `readonly` | `readonly` | `boolean` | `false` | Read and copy only: no new highlights, comments or changes |
| `timestamp` | – | `(() => string \| number) \| undefined` | `undefined` | Stamps a new annotation's `at` (epoch ms or ISO) – the element itself reads no clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale times are written in (default: the browser's) |
| `textLabel` | `text-label` | `string` | `"Document text"` | The text's accessible name |
| `emptyText` | `empty-text` | `string` | `"Select text to highlight it or add a comment."` | Shown in the rail before there are any annotations |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An annotation was added, edited, resolved, reopened, removed or restored ({ value, change }: TextAnnotatorValueChange); cancelable – prevent it to control `value` |
| `tc-copy` | – | Yes | Copy was chosen on a selection ({ text, start, end }: TextAnnotatorCopy); cancelable – prevent it to copy your own way |
| `tc-filter-change` | – | No | The colour, author or resolved filter changed ({ filter }: TextAnnotatorFilterChange) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-text-annotator-rail` | `248px` | both |
| `--tc-text-annotator-measure` | `68ch` | both |
| `--tc-text-annotator-panel-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (97)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-highlight-blue-bg`, `--tc-highlight-blue-fg`, `--tc-highlight-green-bg`, `--tc-highlight-green-fg`, `--tc-highlight-pink-bg`, `--tc-highlight-pink-fg`, `--tc-highlight-purple-bg`, `--tc-highlight-purple-fg`, `--tc-highlight-yellow-bg`, `--tc-highlight-yellow-fg`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-text-annotator :value="…">` | `<tc-text-annotator [value]="…">` | `<tc-text-annotator {value}>` |
| `colors` | `el.colors = …;` | `<… colors={…} />` | `<tc-text-annotator :colors="…">` | `<tc-text-annotator [colors]="…">` | `<tc-text-annotator {colors}>` |
| `colorNames` | `el.colorNames = …;` | `<… colorNames={…} />` | `<tc-text-annotator :colorNames="…">` | `<tc-text-annotator [colorNames]="…">` | `<tc-text-annotator {colorNames}>` |
| `filter` | `el.filter = …;` | `<… filter={…} />` | `<tc-text-annotator :filter="…">` | `<tc-text-annotator [filter]="…">` | `<tc-text-annotator {filter}>` |
| `timestamp` | `el.timestamp = …;` | `<… timestamp={…} />` | `<tc-text-annotator :timestamp="…">` | `<tc-text-annotator [timestamp]="…">` | `<tc-text-annotator {timestamp}>` |

*Also attributes: `heading`, `description`, `text`, `author`, `readonly`, `locale`, `text-label`, `empty-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-filter-change` | No | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-text-annotator id="text-annotator"></tc-text-annotator>

<script type="module">
  import "@adamstavely/trenchcoat/text-annotator";

  const el = document.querySelector("#text-annotator");
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
import "@adamstavely/trenchcoat/text-annotator";
import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";

const props = defineProps<{ initial: TcTextAnnotator["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcTextAnnotator["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-text-annotator :value="value" @tc-value-change="onValueChange"></tc-text-annotator>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TextAnnotator } from "@adamstavely/trenchcoat/angular/text-annotator";
import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";

@Component({
  selector: "app-controlled-text-annotator",
  imports: [TextAnnotator],
  template: `<tc-text-annotator [value]="value()" (tc-value-change)="onValueChange($event)"></tc-text-annotator>`,
})
export class ControlledTextAnnotator {
  readonly initial = input.required<TcTextAnnotator["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcTextAnnotator["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/text-annotator";
  import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";

  let { initial }: { initial: TcTextAnnotator["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcTextAnnotator;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcTextAnnotator["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-text-annotator bind:this={el} {value}></tc-text-annotator>
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
<tc-text-annotator :value="value" @tc-value-change="value = $event.detail.value"></tc-text-annotator>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-text-annotator [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-text-annotator>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-text-annotator bind:this={el} {value}></tc-text-annotator>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-text-annotator")` returns a `TcTextAnnotator` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";`
- **React / Next.js:** Props: `import type { TextAnnotatorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TextAnnotator>`. The element class, for refs: `import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTextAnnotator["value"]` with `import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";`
- **Angular:** The directive types the template: `[value]` takes `TcTextAnnotator["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTextAnnotator } from "@adamstavely/trenchcoat/text-annotator";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the component's name |
| `value` | `TextAnnotation[]` | The annotations. Controlled when defined; otherwise the component keeps them, starting at `defaultValue` |
| `defaultValue` | `TextAnnotation[]` | The annotations when uncontrolled |
| `onChange` | `(value: TextAnnotation[], type: TextAnnotatorChangeType, annotation: TextAnnotation) => void` | Called with the whole new list, what kind of change it was and the annotation it touched |
| `filter` | `TextAnnotatorFilter` | What the rail and the marks show. Controlled when defined |
| `defaultFilter` | `TextAnnotatorFilter` | The filter when uncontrolled |
| `onFilterChange` | `(filter: TextAnnotatorFilter) => void` | Called when the filter changes |
| `onCopy` | `(text: string, start: number, end: number) => boolean \| void` | Called when Copy is chosen; return false to stop the component writing to the clipboard itself |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `filter`, `onChange`, `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| ← / → | In the text: moves the caret a character (with a selection, collapses it to that end) |
| Ctrl + ← / → (Alt on a Mac) | Moves the caret a word |
| ↑ / ↓ | Moves the caret a line |
| Home / End (⌘ + ← / → on a Mac) | To the start or end of the line; with Ctrl (⌘ + ↑ / ↓ on a Mac), of the text |
| Shift + any of these | Extends the selection |
| Ctrl / ⌘ + A | Selects all the text |
| Tab | With a selection: into the toolbar |
| 1–5 | With a selection: highlights it in that colour |
| Enter | With the caret in a highlight, or on a highlight: opens its comment to write or edit |
| Delete / Backspace | With the caret in a highlight, or on a highlight: removes it |
| ← → ↑ ↓ / Home / End | On a highlight: the previous or next highlight, the first or last |
| Escape | Closes the toolbar or collapses the selection; on a highlight, back to the text; in a note, back to its highlight; in the editor, cancels |
| ← / → / Home / End | In the toolbar or the filters: moves between buttons |
| Ctrl / ⌘ + Enter | In the editor: saves |
| Ctrl / ⌘ + Z | Restores the highlight just removed |

### Screen readers

The component is a region named by its heading. The text is a `document` named “Document text”, described by how to
select and act on it. The highlights are one tab stop. Each one starts with its colour and comment count – “Yellow
highlight, 1 comment:” – read before its text, and points at its comment with `aria-describedby`. The toolbar is a
`toolbar` named “Selection”; its swatches are “Highlight yellow” and so on. The editor's colours are a `radiogroup`.
A polite status region says what happened:

- “Selected “The export”. Tab for highlight, comment and copy”;
- “Highlighted pink: “Large files””;
- “Green highlight, no comments. Enter opens the comment, Delete removes it” when the caret enters one;
- “Yellow highlight removed. Press Ctrl+Z or Undo to restore it”;
- “Showing 1 of 3 annotations”, “Copied”, “Comment discarded”.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 40.9 KB | 11.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/selection` · Shared Trenchcoat code | 10.2 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/selection-toolbar` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **69.2 KB** | **21.0 KB** |
| With Lit – the first component on a page | 91.5 KB | 28.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 131 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of colors replaced |
| First on the page | 9.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.5 ms | colors: first render, 359 nodes; update 0.3 ms |
| 1,000 items | 11 ms | colors: first render, 2,519 nodes; update 1.7 ms |

1,000 items of colors: 11 ms, 2,519 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`, `requestAnimationFrame, cancelled` (internal/selection – SelectionController), `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text with paragraphs separated by blank lines; it is shown as written. Offsets index into it, so
  keep it stable while annotations point at it.
- Give `author` the person's display name – it's on every note they add and in the author filter.
- Pass `timestamp` to stamp new notes; the component reads no clock. Times are written in `locale`.
- Rename the colours with `colorNames` if your product gives them meanings (“Question”, “Decision”) – they're what
  people hear.

## Do and don't

### Do

- Store the whole value from `tc-value-change` and pass it back; `change.type` says what happened, for an activity
  log.
- Use `readonly` to show someone else's annotations: people can still select and copy.
- Offer fewer colours with `colors` when each one means something.

### Don't

- Don't change `text` under existing annotations without moving their offsets – they'd mark the wrong words.
- Don't put the comment's meaning in the colour alone; the colour is a cue, the comment says why.
- Don't use it for text people edit – it annotates fixed text.

## Related

- [Conversation annotation](conversation-annotation.md) – Label and redact spans in a conversation, rate turns, correct answers as a diff, and send the reviewed example to a dataset
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Comments Panel](comments-panel.md) – Comment feed with filters, runnable /edit commands, resolve and a composer
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo

## Changelog

- **Text selection:** - `tc-text-annotator`: highlight a passage and comment on it; - `tc-response-selection`: select part of a model reply to reply to it or request an edit; - `tc-selection-translate`: translate the selected text; - `tc-isbn-details`: hover an ISBN for its book details.
