<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Query Builder

**Search** · New

A search query built from conditions – a field, an operator that fits its type and a value per condition, AND / OR per group with one level of nesting, and the query read back in words and as a query string with Copy and Run

- **Element:** `<tc-query-builder>`
- **Size:** 10.1 KB gzip · 33.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/query-builder";` |
| React / Next.js | `import { QueryBuilder } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/query-builder";` · tags starting with tc- are custom elements |
| Angular | `import { QueryBuilder } from "@adamstavely/trenchcoat/angular/query-builder";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/query-builder";` |

## Example

The live example is in the gallery at `#/query-builder`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A search query built from conditions instead of typed syntax. Each condition picks a field from the page's list, an
operator that fits the field's type – text, number, date or a list of options – and a value. Conditions sit in a group
joined by AND or OR, and the top group can hold nested groups for the “this AND (that OR the other)” cases. Below the
conditions the query is read back twice: in words, so anyone can check it says what they meant, and as a query string
in mono, with Copy and Run. A condition without a value is left out of both until it has one.

### When to use

- Advanced search over files, records or entities where people need AND, OR and brackets.
- Saved views and alerts that are defined by conditions.
- Teaching the query syntax: the read-back shows the string each change produces.

### When not to use

- A few quick filters on a list – use [Filter Menu](filter-menu.md).
- Free-text or natural-language search – use [AI Search](ai-search.md).
- Re-running earlier searches – use [Search History](search-history.md).
- Filtering inside a table – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Group** `.ui-qb__group` – conditions joined by its AND / OR switch; nested groups are indented
2. **Join** `.ui-qb__join` – the AND / OR switch, with “all of these” or “any of these” beside it
3. **Condition** `.ui-qb__cond` – the joining word, then field, operator, value and remove
4. **Value** `.ui-qb__value` – text, a number, a date, two of them for between, or option chips for “is any of”
5. **Add** `.ui-qb__adds` – Condition, and Group in the top group
6. **Read-back** `.ui-qb__read` – the query in words, then the query string with Copy and Run

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The fields, switches and read-back are the same in both. Each condition sits on one line; below about
600 px the joining words go (the group's switch still says AND or OR), and below about 460 px the value takes its own
line. The width of the joining words is `--tc-qb-conj`.

## Usage

### HTML

```html
<tc-query-builder id="qb" heading="Find files"></tc-query-builder>

<script type="module">
  import "@adamstavely/trenchcoat/query-builder";
  import "@adamstavely/trenchcoat/tokens.css";

  const qb = document.querySelector("#qb");
  qb.fields = [
    { id: "type", label: "Type", type: "enum", options: [{ value: "document", label: "Document" }, { value: "image", label: "Image" }] },
    { id: "owner", label: "Owner", type: "text" },
    { id: "updated", label: "Updated", type: "date" },
  ];
  qb.addEventListener("tc-submit", (e) => console.log(e.detail.query));
</script>
```

### React / Next.js

```tsx
import { QueryBuilder, type QueryField } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const fields: QueryField[] = [
  { id: "type", label: "Type", type: "enum", options: [{ value: "document", label: "Document" }, { value: "image", label: "Image" }] },
  { id: "owner", label: "Owner", type: "text" },
  { id: "updated", label: "Updated", type: "date" },
];

export function FindFiles() {
  return <QueryBuilder title="Find files" fields={fields} onRun={(_value, query) => console.log(query)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/query-builder";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";

defineProps<{ fields: TcQueryBuilder["fields"]; value: TcQueryBuilder["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-query-builder :fields="fields" :value="value" @tc-value-change="onValueChange"></tc-query-builder>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { QueryBuilder } from "@adamstavely/trenchcoat/angular/query-builder";
import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";

@Component({
  selector: "app-query-builder-example",
  imports: [QueryBuilder],
  template: `<tc-query-builder [fields]="fields()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-query-builder>`,
})
export class QueryBuilderExample {
  readonly fields = input.required<TcQueryBuilder["fields"]>();
  readonly value = input.required<TcQueryBuilder["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/query-builder";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";

  let { fields, value }: { fields: TcQueryBuilder["fields"]; value: TcQueryBuilder["value"] } = $props();
  let el: TcQueryBuilder;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-query-builder bind:this={el} {fields} {value}></tc-query-builder>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Query builder"` | The heading, and the builder's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `fields` | – | `QueryField[]` | `[]` | The fields a condition can test |
| `value` | – | `QueryGroup` | – | The query: the top group and everything in it. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `operatorLabels` | – | `Partial<Record<QueryOperator, string>>` | `{}` | The operators' names, merged over the defaults |
| `runLabel` | `run-label` | `string` | `"Run query"` | The Run button's text; empty hides it |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers in the read-back, e.g. "en-GB"; by default the browser's |
| `query` | – | `` | – | The query string, as Run sends it |
| `summary` | – | `` | – | The query in words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The query changed ({ value }: QueryValueChange); cancelable – prevented, `value` stays as it was |
| `tc-submit` | – | No | Run was pressed ({ value, query }: QuerySubmit) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-qb-conj` | `var(--tc-space-10)` | standard, clean |

#### Design tokens it reads (80)

`--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-h-lg`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-sunken`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `queryOperators: Record<QueryFieldType, QueryOperator[]>` | The operators each type offers, in order, and their names |
| `emptyQuery(): QueryGroup` | An empty top group, the starting value |

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
| `fields` | `el.fields = …;` | `<… fields={…} />` | `<tc-query-builder :fields="…">` | `<tc-query-builder [fields]="…">` | `<tc-query-builder {fields}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-query-builder :value="…">` | `<tc-query-builder [value]="…">` | `<tc-query-builder {value}>` |
| `operatorLabels` | `el.operatorLabels = …;` | `<… operatorLabels={…} />` | `<tc-query-builder :operatorLabels="…">` | `<tc-query-builder [operatorLabels]="…">` | `<tc-query-builder {operatorLabels}>` |

*Also attributes: `heading`, `description`, `run-label`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-submit` | No | `el.addEventListener("tc-submit", (e) => …)` | `onRun={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-query-builder id="query-builder"></tc-query-builder>

<script type="module">
  import "@adamstavely/trenchcoat/query-builder";

  const el = document.querySelector("#query-builder");
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
import "@adamstavely/trenchcoat/query-builder";
import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";

const props = defineProps<{ initial: TcQueryBuilder["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcQueryBuilder["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-query-builder :value="value" @tc-value-change="onValueChange"></tc-query-builder>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { QueryBuilder } from "@adamstavely/trenchcoat/angular/query-builder";
import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";

@Component({
  selector: "app-controlled-query-builder",
  imports: [QueryBuilder],
  template: `<tc-query-builder [value]="value()" (tc-value-change)="onValueChange($event)"></tc-query-builder>`,
})
export class ControlledQueryBuilder {
  readonly initial = input.required<TcQueryBuilder["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcQueryBuilder["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/query-builder";
  import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";

  let { initial }: { initial: TcQueryBuilder["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcQueryBuilder;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcQueryBuilder["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-query-builder bind:this={el} {value}></tc-query-builder>
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
<tc-query-builder :value="value" @tc-value-change="value = $event.detail.value"></tc-query-builder>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-query-builder [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-query-builder>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-query-builder bind:this={el} {value}></tc-query-builder>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-query-builder")` returns a `TcQueryBuilder` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";`
- **React / Next.js:** Props: `import type { QueryBuilderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof QueryBuilder>`. The element class, for refs: `import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcQueryBuilder["fields"]` with `import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";`
- **Angular:** The directive types the template: `[fields]` takes `TcQueryBuilder["fields"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcQueryBuilder } from "@adamstavely/trenchcoat/query-builder";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the builder's name |
| `value` | `QueryGroup` | The query tree – controlled when given |
| `defaultValue` | `QueryGroup` | The query on mount when `value` isn't controlled |
| `onValueChange` | `(value: QueryGroup) => void` | The query changed |
| `onRun` | `(value: QueryGroup, query: string) => void` | Run was pressed, with the query string |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `children`*

## Accessibility

### Keyboard

Every control is a native select, input, radio or button, so the browser's own keys work: Tab moves between controls,
the arrows change a select or the AND / OR switch, and Space or Enter presses a button. Enter in a value applies it.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls, condition by condition |
| ← / → | Switches AND / OR on a focused join |
| Enter | Applies a typed value; presses a focused button |
| Space | Toggles a focused option chip |

Adding a condition focuses its field. Removing one moves focus to its group's Add button.

### Screen readers

The builder is a group named by the heading. Each group is a group named “Conditions, joined by AND”, or “Group 1,
joined by OR”. Every control is named by its place – “Field, condition 2”, “Operator, condition 2”, “Value, condition
2”, “From” and “To” for between – and option chips are toggle buttons in a group. The join is a fieldset of two radios.
Remove buttons say what they remove: “Remove condition 2”, “Remove group 1”. Adding and removing are confirmed in a
polite status message, as is Copy. The query string is labelled “Query string”.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.7 KB | 7.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **33.6 KB** | **10.1 KB** |
| With Lit – the first component on a page | 56.0 KB | 17.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.4 ms** | the gallery demo's data, 153 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of fields replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.7 ms | fields: first render, 435 nodes; update 0.9 ms |
| 1,000 items | 30 ms | fields: first render, 3,135 nodes; update 3.0 ms |

1,000 items of fields: 30 ms, 3,135 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name fields as people know them – “Owner”, “Updated” – and set `key` to the name the query syntax uses.
- Give enum fields every option; they're how “is any of” offers chips.
- Keep the Run label a verb: “Run query”, “Search”.

## Do and don't

### Do

- Start from a useful query with `value` – an empty builder is hard to read.
- Show results next to the builder, so each change can be checked.

### Don't

- Don't nest deeper than one level – the builder allows one, and more is hard to read back.
- Don't hide the read-back – it's how people confirm the query means what they think.

## Related

- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each
- [AI Search](ai-search.md) – One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **query-builder** only says "Copied" when the copy worked, and escapes backslashes and query syntax in values.
- **Search:** - `tc-query-builder`: conditions in AND / OR groups. - Read back in words and as a query string. - `tc-search-history`: recent and saved searches. - Run again, save, and remove with Undo. - `tc-ai-search`: one search box with an AI mode. - Suggestions, example prompts, a "search within file contents" option, scope chips and ⌘K.
