<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Subprocessor List

**Trust & calibration** · New

Every vendor that touches customer data – name, purpose, data categories as chips, location and transfer mechanism, when added, and Active, New (with when it takes effect) or Removed in words; search, data-category and location filters, Export CSV, and Subscribe to changes with the email checked in words

- **Element:** `<tc-subprocessor-list>`
- **Size:** 9.0 KB gzip · 29.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/subprocessor-list";` |
| React / Next.js | `import { SubprocessorList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/subprocessor-list";` · tags starting with tc- are custom elements |
| Angular | `import { SubprocessorList } from "@adamstavely/trenchcoat/angular/subprocessor-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/subprocessor-list";` |

## Example

The live example is in the gallery at `#/subprocessor-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every vendor that touches customer data, as a vendor publishes it for its customers. Each row shows:
- the subprocessor's name and what it does for the service;
- the kinds of customer data it handles, as chips;
- where it processes them, and the transfer mechanism that makes that lawful;
- when it was added;
- whether it's Active, New (with the date it takes effect) or Removed, as a tint, a mark and a word.

Search and the data-category and location filters narrow the list; Export CSV saves what's shown; Subscribe to changes
takes an email address, checked in words before it's sent.

### When to use

- A vendor's public subprocessor page, or the same list inside an admin's compliance settings.
- Telling customers about a new subprocessor before it starts processing their data.
- A procurement review that checks where a vendor's data goes.

### When not to use

- The data-handling rules your organisation sets – use [Data handling policy](data-handling-policy.md).
- A large dataset to sort and edit – use [Data Table](data-table.md).
- Items held for a legal reason – use [Legal Hold Manager](legal-hold-manager.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-sbp__query` – matches names, purposes, locations, transfers and categories
2. **Filters** `.ui-sbp__filter` – data category and location
3. **Export CSV** `.ui-sbp__export` – saves the rows shown
4. **Row** `.ui-sbp__row` – one subprocessor
5. **Data categories** `.ui-sbp__chips` – the kinds of data it handles
6. **Status** `.ui-sbp__pill` – Active, New from a date, or Removed on a date
7. **Subscribe** `.ui-sbp__subscribe` – an email field for change notices
8. **Error** `.ui-sbp__error` – what's wrong with the email, in words

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Under 560px wide, each subprocessor becomes a card, with the column names shown as labels.

## Usage

### HTML

```html
<tc-subprocessor-list id="subs"></tc-subprocessor-list>

<script type="module">
  import "@adamstavely/trenchcoat/subprocessor-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const subs = document.querySelector("#subs");
  subs.subprocessors = [
    { id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting", categories: ["Account data", "Customer content"], location: "Ireland", transfer: "Within the EEA", status: "active" },
    { id: "ls", name: "Lumen Search", purpose: "Retrieval index", categories: ["Customer content"], location: "Ireland", status: "new", effective: Date.UTC(2026, 11, 1) },
  ];
  subs.addEventListener("tc-subscribe", (e) => console.log("subscribe", e.detail.email));
</script>
```

### React / Next.js

```tsx
import { SubprocessorList, type Subprocessor } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const subprocessors: Subprocessor[] = [
  { id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting", categories: ["Customer content"], location: "Ireland", status: "active" },
];

export function Subprocessors() {
  return <SubprocessorList title="Subprocessors" subprocessors={subprocessors} onSubscribe={(email) => console.log(email)} onCategoryChange={(c) => console.log(c)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/subprocessor-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";

defineProps<{ subprocessors: TcSubprocessorList["subprocessors"]; category: TcSubprocessorList["category"] }>();
const onQueryChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-subprocessor-list :subprocessors="subprocessors" :category="category" @tc-query-change="onQueryChange"></tc-subprocessor-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SubprocessorList } from "@adamstavely/trenchcoat/angular/subprocessor-list";
import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";

@Component({
  selector: "app-subprocessor-list-example",
  imports: [SubprocessorList],
  template: `<tc-subprocessor-list [subprocessors]="subprocessors()" [category]="category()" (tc-query-change)="onQueryChange($event)"></tc-subprocessor-list>`,
})
export class SubprocessorListExample {
  readonly subprocessors = input.required<TcSubprocessorList["subprocessors"]>();
  readonly category = input.required<TcSubprocessorList["category"]>();
  onQueryChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/subprocessor-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";

  let { subprocessors, category }: { subprocessors: TcSubprocessorList["subprocessors"]; category: TcSubprocessorList["category"] } = $props();
  let el: TcSubprocessorList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-query-change", on);
    return () => el.removeEventListener("tc-query-change", on);
  });
</script>

<tc-subprocessor-list bind:this={el} {subprocessors} {category}></tc-subprocessor-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Subprocessors"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `subprocessors` | – | `Subprocessor[]` | `[]` | The vendors, in order |
| `query` | `query` | `string` | `""` | The search text. Changed by typing unless a tc-query-change listener calls preventDefault() |
| `category` | – | `string \| null` | `null` | The data category shown, or null for all. Changed by the filter unless a tc-category-change listener calls preventDefault() |
| `location` | – | `string \| null` | `null` | The location shown, or null for all. Changed by the filter unless a tc-location-change listener calls preventDefault() |
| `hideSubscribe` | `hide-subscribe` | `boolean` | `false` | Leaves out Subscribe to changes |
| `filename` | `filename` | `string` | `"subprocessors.csv"` | The name Export CSV saves as |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<SubprocessorListLabels>` | `{}` | The words used, merged over defaultSubprocessorListLabels |
| `shown` | – | `Subprocessor[]` | – | The vendors that pass the search and filters |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-query-change` | – | Yes | The search changed ({ query }: SubprocessorQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-category-change` | – | Yes | The data-category filter changed ({ category }: SubprocessorCategoryChange); cancelable – prevented, `category` stays as it was |
| `tc-location-change` | – | Yes | The location filter changed ({ location }: SubprocessorLocationChange); cancelable – prevented, `location` stays as it was |
| `tc-subscribe` | – | Yes | A valid email was submitted to Subscribe to changes ({ email }: SubprocessorSubscribe); cancelable – prevented, no confirmation is shown |
| `tc-export` | – | Yes | Export CSV was pressed ({ csv, rows, filename }: SubprocessorExport); cancelable – prevented, nothing is downloaded |

#### Design tokens it reads (57)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-quick`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSubprocessorListLabels: object` | The words the element uses; any can be renamed through `labels` |
| `isEmail(s: string): void` | A plain email check: something@something.something, no spaces |
| `subprocessorCsv(rows: Subprocessor[]): void` | The rows as CSV, with a header row, dates as YYYY-MM-DD |

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
| `subprocessors` | `el.subprocessors = …;` | `<… subprocessors={…} />` | `<tc-subprocessor-list :subprocessors="…">` | `<tc-subprocessor-list [subprocessors]="…">` | `<tc-subprocessor-list {subprocessors}>` |
| `category` | `el.category = …;` | `<… category={…} />` | `<tc-subprocessor-list :category="…">` | `<tc-subprocessor-list [category]="…">` | `<tc-subprocessor-list {category}>` |
| `location` | `el.location = …;` | `<… location={…} />` | `<tc-subprocessor-list :location="…">` | `<tc-subprocessor-list [location]="…">` | `<tc-subprocessor-list {location}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-subprocessor-list :labels="…">` | `<tc-subprocessor-list [labels]="…">` | `<tc-subprocessor-list {labels}>` |

*Also attributes: `heading`, `description`, `query`, `hide-subscribe`, `filename`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-category-change` | Yes | `el.addEventListener("tc-category-change", (e) => …)` | `ref.current.addEventListener("tc-category-change", …)` | `@tc-category-change="…"` | `(tc-category-change)="…($event)"` | `el.addEventListener("tc-category-change", …)` |
| `tc-location-change` | Yes | `el.addEventListener("tc-location-change", (e) => …)` | `ref.current.addEventListener("tc-location-change", …)` | `@tc-location-change="…"` | `(tc-location-change)="…($event)"` | `el.addEventListener("tc-location-change", …)` |
| `tc-subscribe` | Yes | `el.addEventListener("tc-subscribe", (e) => …)` | `onSubscribe={…}` | `@tc-subscribe="…"` | `(tc-subscribe)="…($event)"` | `el.addEventListener("tc-subscribe", …)` |
| `tc-export` | Yes | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `query`, `category` and `location` itself unless a listener calls `preventDefault()` on `tc-query-change`, `tc-category-change` or `tc-location-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-subprocessor-list id="subprocessor-list"></tc-subprocessor-list>

<script type="module">
  import "@adamstavely/trenchcoat/subprocessor-list";

  const el = document.querySelector("#subprocessor-list");
  el.addEventListener("tc-query-change", (e) => {
    e.preventDefault(); // the element keeps its query…
    if (allowed(e.detail.query)) el.query = e.detail.query; // …until the app sets it
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
import "@adamstavely/trenchcoat/subprocessor-list";
import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";

const props = defineProps<{ initial: TcSubprocessorList["query"] }>();
const query = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onQueryChange = (e: CustomEvent<{ query: TcSubprocessorList["query"] }>) => {
  e.preventDefault();
  query.value = e.detail.query;
};
</script>

<template>
  <tc-subprocessor-list :query="query" @tc-query-change="onQueryChange"></tc-subprocessor-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SubprocessorList } from "@adamstavely/trenchcoat/angular/subprocessor-list";
import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";

@Component({
  selector: "app-controlled-subprocessor-list",
  imports: [SubprocessorList],
  template: `<tc-subprocessor-list [query]="query()" (tc-query-change)="onQueryChange($event)"></tc-subprocessor-list>`,
})
export class ControlledSubprocessorList {
  readonly initial = input.required<TcSubprocessorList["query"]>();
  readonly query = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onQueryChange(e: CustomEvent<{ query: TcSubprocessorList["query"] }>) {
    e.preventDefault();
    this.query.set(e.detail.query);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/subprocessor-list";
  import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";

  let { initial }: { initial: TcSubprocessorList["query"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let query = $derived(initial);
  let el: TcSubprocessorList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      query = (e as CustomEvent<{ query: TcSubprocessorList["query"] }>).detail.query;
    };
    el.addEventListener("tc-query-change", on);
    return () => el.removeEventListener("tc-query-change", on);
  });
</script>

<tc-subprocessor-list bind:this={el} {query}></tc-subprocessor-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-subprocessor-list")` returns a `TcSubprocessorList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";`
- **React / Next.js:** Props: `import type { SubprocessorListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SubprocessorList>`. The element class, for refs: `import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSubprocessorList["subprocessors"]` with `import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";`
- **Angular:** The directive types the template: `[subprocessors]` takes `TcSubprocessorList["subprocessors"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSubprocessorList } from "@adamstavely/trenchcoat/subprocessor-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `query` | `string` | The search text – controlled when given |
| `defaultQuery` | `string` | The search on mount when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The search changed |
| `category` | `string \| null` | The data category shown, or null for all – controlled when given |
| `defaultCategory` | `string \| null` | The category on mount when `category` isn't controlled |
| `onCategoryChange` | `(category: string \| null) => void` | The data-category filter changed |
| `location` | `string \| null` | The location shown, or null for all – controlled when given |
| `defaultLocation` | `string \| null` | The location on mount when `location` isn't controlled |
| `onLocationChange` | `(location: string \| null) => void` | The location filter changed |
| `onSubscribe` | `(email: string) => boolean \| void` | A valid email was submitted to Subscribe to changes; return false to keep the form showing |
| `onExport` | `(csv: string, rows: Subprocessor[]) => boolean \| void` | Export CSV was pressed; return false to download it yourself |

*Renamed or hidden on the wrapper: `heading`, `query`, `category`, `location`, `children`*

## Accessibility

Follows the WAI-ARIA [Table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/).

### Keyboard

The table isn't interactive; the controls above and below it are ordinary fields and buttons in tab order.

| Key | What it does |
|---|---|
| Tab | Moves through search, the filters, Export CSV and Subscribe |
| Enter | In the email field, subscribes |
| Arrow keys | In a filter, change it |

### Screen readers

The table is named by the heading, with column headers and each subprocessor's name as its row header, so a cell reads
with both. Explicit table roles keep that in the narrow card layout. Statuses read as words ("New from 1 Dec 2026").
Each search or filter change announces how many subprocessors are shown, or that none match. A bad email is
announced, marked `aria-invalid` and described by the error; subscribing is confirmed in a polite status message.

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
| **This component alone** | 21.5 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.1 KB** | **9.0 KB** |
| With Lit – the first component on a page | 51.0 KB | 16.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 185 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of subprocessors replaced |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |
| 100 items | 19 ms | subprocessors: first render, 2,018 nodes; update 5.4 ms |
| 1,000 items | 99 ms | subprocessors: first render, 19,568 nodes; update 33 ms |

1,000 items of subprocessors: 99 ms. It renders every item, so a first render passes 50 ms (a long task) at about 510 items – page or filter longer lists.

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

- Write `purpose` as what the vendor does for the service: "Model inference", not the vendor's tagline.
- Use the same words for `categories` across vendors, so the filter groups them.
- Give `effective` for every new and removed subprocessor.
- Name the transfer mechanism plainly: "Standard Contractual Clauses", "Within the EEA".

## Do and don't

### Do

- List a new subprocessor before it starts, with the date it takes effect.
- Keep removed ones for a while, marked Removed, so customers can see the change.
- Send change notices to everyone who subscribed, from `tc-subscribe`.

### Don't

- Don't leave out vendors that only see metadata; account data counts.
- Don't reorder the list to hide a new vendor.
- Don't use the status tints for anything but where a subprocessor stands.

## Related

- [Trust Center](trust-center.md) – A vendor's security page on one card – certifications and frameworks with their status in words (Certified, In progress, Planned), period and auditor; security documents to view or request, with NDA required noted; the Data Processing Agreement to review and sign, or when and by whom it was signed; and common questions as disclosures
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Legal Hold Manager](legal-hold-manager.md) – Which items are on legal hold, who placed each hold, why and until when – overdue reviews marked, items added, and Release only with a written reason
