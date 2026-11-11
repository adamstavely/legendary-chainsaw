<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Extraction Review

**AI & chat** · New

Fields pulled from a document, each linked to its place on the page – confidence per field, accept, correct or reject, field by field from the keyboard

- **Element:** `<tc-extraction-review>`
- **Size:** 11.9 KB gzip · 41.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/extraction-review";` |
| React / Next.js | `import { ExtractionReview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/extraction-review";` · tags starting with tc- are custom elements |
| Angular | `import { ExtractionReview } from "@adamstavely/trenchcoat/angular/extraction-review";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/extraction-review";` |

## Example

The live example is in the gallery at `#/extraction-review`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Fields a model pulled out of a document – an invoice, a form, a contract – checked by a person before anything uses
them. The page sits next to the fields with a box around each field's place on it, so people check a value against
its source rather than trusting it. Every field shows how confident the extraction was, and the ones below the
threshold are marked Low so they get looked at first. People accept, correct or reject each field, moving field by
field from the keyboard while the page view follows; a correction keeps the extracted value beside the new one.

### When to use

- Checking values extracted from scanned or uploaded documents before they're saved or sent on.
- When an extraction is right most of the time but a wrong value is costly – amounts, dates, account details.
- When people need to see where on the page a value came from to judge it.

### When not to use

- Editing a table of records that don't come from a page – use [Data Table](data-table.md).
- Uploading the document in the first place – use [Dropzone](dropzone.md).
- Approving or rejecting whole items in a queue, not fields within one – use [Review Center](review-center.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Page view** `.ui-xrev__viewport` – the page image in a scrolling well, with a box over every field found on it
2. **Active box** `.ui-xrev__box[data-active]` – the active field's place on the page, with the field's name above it
3. **Field** `.ui-xrev__cell` – the field's name, its value, the confidence and what's been decided
4. **Actions** `.ui-xrev__act` – Accept, Correct and Reject; the pressed one takes its status colour
5. **Progress** `.ui-xrev__foot` – “3 of 10 reviewed · 2 low confidence” and Confirm

## Looks

Standard puts the header on the gray tray above a white card with the page and the fields, and the progress and Confirm on the tray
below. Clean is one white card with hairline dividers, a lighter value weight and thinner icons; the progress is its
last row, and the active field is tinted with the accent rather than gray.

## Usage

### HTML

```html
<tc-extraction-review id="invoice" heading="Invoice INV-2041" source="inv-2041.pdf" confirm-label="Send to accounts"></tc-extraction-review>

<script type="module">
  import "@adamstavely/trenchcoat/extraction-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#invoice");
  review.pages = [{ src: "/scans/inv-2041-1.png", width: 1700, height: 2200 }];
  review.fields = [
    { id: "total", label: "Total", value: "1,339.20", confidence: 0.96, box: { page: 1, x: 1380, y: 1440, width: 190, height: 40 } },
    { id: "due", label: "Due date", value: "11 Nov 2026", confidence: 0.62, box: { page: 1, x: 1380, y: 560, width: 190, height: 36 } },
  ];
  review.addEventListener("tc-confirm", (e) => save(e.detail.fields));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ExtractionReview, type ExtractionField, type ExtractionPage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function InvoiceCheck({ pages, extracted, save }: { pages: ExtractionPage[]; extracted: ExtractionField[]; save: (fields: ExtractionField[]) => void }) {
  const [fields, setFields] = useState(extracted);
  return (
    <ExtractionReview
      title="Invoice INV-2041"
      source="inv-2041.pdf"
      pages={pages}
      fields={fields}
      onFieldsChange={setFields}
      onConfirm={save}
      confirmLabel="Send to accounts"
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/extraction-review";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";

defineProps<{ fields: TcExtractionReview["fields"]; pages: TcExtractionReview["pages"] }>();
const onFieldsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-extraction-review :fields="fields" :pages="pages" @tc-fields-change="onFieldsChange"></tc-extraction-review>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ExtractionReview } from "@adamstavely/trenchcoat/angular/extraction-review";
import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";

@Component({
  selector: "app-extraction-review-example",
  imports: [ExtractionReview],
  template: `<tc-extraction-review [fields]="fields()" [pages]="pages()" (tc-fields-change)="onFieldsChange($event)"></tc-extraction-review>`,
})
export class ExtractionReviewExample {
  readonly fields = input.required<TcExtractionReview["fields"]>();
  readonly pages = input.required<TcExtractionReview["pages"]>();
  onFieldsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/extraction-review";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";

  let { fields, pages }: { fields: TcExtractionReview["fields"]; pages: TcExtractionReview["pages"] } = $props();
  let el: TcExtractionReview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-fields-change", on);
    return () => el.removeEventListener("tc-fields-change", on);
  });
</script>

<tc-extraction-review bind:this={el} {fields} {pages}></tc-extraction-review>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `fields` | – | `ExtractionField[]` | `[]` | The reviewed fields – the value. Each review replaces the list (tc-fields-change) |
| `pages` | – | `ExtractionPage[]` | `[]` | The document's pages, in order: an image URL and its size in pixels per page |
| `heading` | `heading` | `string` | `"Review extracted fields"` | Names the review |
| `source` | `source` | `string \| undefined` | `undefined` | The document the fields came from, e.g. "invoice-2041.pdf" – shown under the heading and in page alt texts |
| `threshold` | `threshold` | `number` | `0.8` | Confidence below this (0–1) marks a field "Low" so people check it first |
| `confirmLabel` | `confirm-label` | `string` | `"Confirm"` | The label of the button that hands the reviewed fields back |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-fields-change` | – | Yes | A field was accepted, corrected, rejected or set back to review. Cancelable. Detail: ExtractionFieldsChange ({ fields, field, action }) |
| `tc-confirm` | – | No | Confirm was pressed with every field reviewed. Detail: ExtractionConfirm ({ fields }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-extraction-review-height` | `420px` | standard, clean |
| `--tc-extraction-review-height-narrow` | `260px` | standard, clean |
| `--tc-extraction-review-well` | `var(--tc-fill-subtle)` | standard, clean |

#### Design tokens it reads (85)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-gray-0`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `fields` | `el.fields = …;` | `<… fields={…} />` | `<tc-extraction-review :fields="…">` | `<tc-extraction-review [fields]="…">` | `<tc-extraction-review {fields}>` |
| `pages` | `el.pages = …;` | `<… pages={…} />` | `<tc-extraction-review :pages="…">` | `<tc-extraction-review [pages]="…">` | `<tc-extraction-review {pages}>` |

*Also attributes: `heading`, `source`, `threshold`, `confirm-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-fields-change` | Yes | `el.addEventListener("tc-fields-change", (e) => …)` | `ref.current.addEventListener("tc-fields-change", …)` | `@tc-fields-change="…"` | `(tc-fields-change)="…($event)"` | `el.addEventListener("tc-fields-change", …)` |
| `tc-confirm` | No | `el.addEventListener("tc-confirm", (e) => …)` | `onConfirm={…}` | `@tc-confirm="…"` | `(tc-confirm)="…($event)"` | `el.addEventListener("tc-confirm", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `fields` itself unless a listener calls `preventDefault()` on `tc-fields-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-extraction-review id="extraction-review"></tc-extraction-review>

<script type="module">
  import "@adamstavely/trenchcoat/extraction-review";

  const el = document.querySelector("#extraction-review");
  el.addEventListener("tc-fields-change", (e) => {
    e.preventDefault(); // the element keeps its fields…
    if (allowed(e.detail.fields)) el.fields = e.detail.fields; // …until the app sets it
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
import "@adamstavely/trenchcoat/extraction-review";
import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";

const props = defineProps<{ initial: TcExtractionReview["fields"] }>();
const fields = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFieldsChange = (e: CustomEvent<{ fields: TcExtractionReview["fields"] }>) => {
  e.preventDefault();
  fields.value = e.detail.fields;
};
</script>

<template>
  <tc-extraction-review :fields="fields" @tc-fields-change="onFieldsChange"></tc-extraction-review>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ExtractionReview } from "@adamstavely/trenchcoat/angular/extraction-review";
import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";

@Component({
  selector: "app-controlled-extraction-review",
  imports: [ExtractionReview],
  template: `<tc-extraction-review [fields]="fields()" (tc-fields-change)="onFieldsChange($event)"></tc-extraction-review>`,
})
export class ControlledExtractionReview {
  readonly initial = input.required<TcExtractionReview["fields"]>();
  readonly fields = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFieldsChange(e: CustomEvent<{ fields: TcExtractionReview["fields"] }>) {
    e.preventDefault();
    this.fields.set(e.detail.fields);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/extraction-review";
  import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";

  let { initial }: { initial: TcExtractionReview["fields"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let fields = $derived(initial);
  let el: TcExtractionReview;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      fields = (e as CustomEvent<{ fields: TcExtractionReview["fields"] }>).detail.fields;
    };
    el.addEventListener("tc-fields-change", on);
    return () => el.removeEventListener("tc-fields-change", on);
  });
</script>

<tc-extraction-review bind:this={el} {fields}></tc-extraction-review>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-extraction-review")` returns a `TcExtractionReview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";`
- **React / Next.js:** Props: `import type { ExtractionReviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ExtractionReview>`. The element class, for refs: `import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcExtractionReview["fields"]` with `import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";`
- **Angular:** The directive types the template: `[fields]` takes `TcExtractionReview["fields"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcExtractionReview } from "@adamstavely/trenchcoat/extraction-review";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Names the review – the heading over the page and the fields |
| `fields` | `ExtractionField[]` | The reviewed fields. Controlled when defined – pass back what onFieldsChange reports |
| `defaultFields` | `ExtractionField[]` | Starting fields when uncontrolled |
| `onFieldsChange` | `(fields: ExtractionField[], field: ExtractionField, action: ExtractionAction) => void` | A field was accepted, corrected, rejected or set back to review: the whole list, the changed field and what was done |
| `onConfirm` | `(fields: ExtractionField[]) => void` | Confirm was pressed with every field reviewed |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next field; the page view follows |
| ← / → | Moves between the field and its Accept, Correct and Reject buttons |
| Home / End | First or last cell in the row; Home from the first cell goes to the first field, End from the last cell to the last field |
| Ctrl Home / Ctrl End | First or last field |
| Page Up / Page Down | Five fields up or down |
| A | Accepts the field and moves to the next field still to review |
| R | Rejects the field and moves to the next field still to review |
| Enter (on the field) or F2 | Corrects the value; Enter saves and moves on, Escape cancels |
| Enter or Space (on a button) | Presses it; a pressed Accept or Reject sets the field back to review |

The page view is its own tab stop, so its scroll can be moved with the arrow keys; Previous page and Next page turn
pages.

### Screen readers

The fields are a `grid` named by the heading, with one `row` per field and a single tab stop. The field cell reads
its name, value, confidence (“62% confidence”) and status (“To review”, “Accepted”, “Corrected”, “Rejected”), and is
described by “A accept, R reject, Enter correct, arrows move between fields”. The buttons name their field (“Accept
Due date”, “Undo accept, Due date”), carry `aria-pressed` and `aria-keyshortcuts`. The correction field is labelled
“Correct Total” and described by “Enter saves, Escape cancels”. A status region says what happened: “Due date
accepted”, “Total corrected to 1,240.00”, “Total back to review”, “All 10 fields reviewed”. The page view is a region
named by “Page 1 of 2”, which is announced when it changes; each page image has alt text. The boxes are hidden from
assistive technology – the grid carries the same information.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.5 KB | 9.2 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **41.3 KB** | **11.9 KB** |
| With Lit – the first component on a page | 64.4 KB | 19.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.6 ms** | the gallery demo's data, 92 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of fields replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 26 ms | fields: first render, 2,444 nodes; update 3.0 ms |
| 1,000 items | 137 ms | fields: first render, 24,044 nodes; update 12 ms |

1,000 items of fields: 137 ms. It renders every item, so a first render passes 50 ms (a long task) at about 360 items – page or filter longer lists.

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

- Name fields the way the document's reader would: “Invoice number”, “Due date” – not schema keys like `inv_no`.
- Show values as they'll be stored, formatted the same way, so a correction is compared like for like.
- Set `source` to the file name, so people know which document they're looking at.
- Mask personal data before it reaches the element – it shows the values it's given.
- Write `confirm-label` as what happens next: “Send to accounts”, “Save to record”.

## Do and don't

### Do

- Pass a box for every field the model can place – a field without one has nothing to check against.
- Set `threshold` from how your model performs; the default, 0.8, marks anything under 80% as Low.
- Keep the extracted value: the element sets `original` on correction, so your audit trail has both.

### Don't

- Don't auto-accept fields above the threshold for people; let them confirm with A – it takes a key press each.
- Don't use page images too small to read – the boxes are only as useful as the text under them.
- Don't hide rejected fields from the list; people may change their mind before confirming.

## Related

- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
