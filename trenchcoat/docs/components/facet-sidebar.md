<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Facet Sidebar

**Search** · New

Filters beside search results, with counts – checkbox, radio, range and date facets that fold, the filters in use as removable chips with Clear all, Show more and a search box in long facets

- **Element:** `<tc-facet-sidebar>`
- **Size:** 10.0 KB gzip · 33.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/facet-sidebar";` |
| React / Next.js | `import { FacetSidebar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/facet-sidebar";` · tags starting with tc- are custom elements |
| Angular | `import { FacetSidebar } from "@adamstavely/trenchcoat/angular/facet-sidebar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/facet-sidebar";` |

## Example

The live example is in the gallery at `#/facet-sidebar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The filters beside search results, each saying how many results it would leave. Facets are sections that fold. A
facet can be checkboxes (any of), radios (one of), a range with two thumbs and number fields, or a from–to date. The
filters in use sit on top as chips, each removable, with Clear all. An option no result has is dimmed but can still
be picked. A long facet shows five options and "Show 7 more", and one with more than eight has its own search box.

Every change fires one cancelable `tc-value-change` with the whole value as it will be, so the filters can live in
the URL or a store.

### When to use

- Narrowing a results page: by kind, owner, programme, size or date.
- When the counts help people choose – "Lab notes 64" says where the results are.

### When not to use

- A compact dropdown of filters above a list – use [Filter Menu](filter-menu.md).
- Conditions joined with AND / OR – use [Query Builder](query-builder.md).
- Picking a date range on its own – use [Date Range Picker](date-range-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Chips** `.ui-fct__chips` – the filters in use, each with ×
2. **Facet** `.ui-fct__facet` – its name, how many are on, and the fold
3. **Search** `.ui-fct__search` – inside a facet with more than eight options
4. **Option** `.ui-fct__option` – a checkbox or radio, its label and count
5. **Range** `.ui-fct__range` – a track with two thumbs, and From and To fields
6. **Show more** `.ui-fct__more` – the rest of a long facet

## Looks

Standard puts the header and Clear all on a gray tray above a white card; Clean is one white card. Picked boxes are
filled (ink in Standard, accent in Clean) with a tick that draws itself, and a facet's badge says how many of its
options are on. It's made for a sidebar about 280 px wide.

A page can set `--tc-fct-thumb` (the range thumbs' size).

## Usage

### HTML

```html
<tc-facet-sidebar></tc-facet-sidebar>
<script type="module">
  const sidebar = document.querySelector("tc-facet-sidebar");
  sidebar.facets = [{ id: "kind", label: "Kind", type: "checkbox", options: [{ value: "doc", label: "Documents", count: 128 }] }];
  sidebar.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FacetSidebar, type Facet, type FacetValues } from "@adamstavely/trenchcoat/react";

const FACETS: Facet[] = [{ id: "pages", label: "Length", type: "range", min: 1, max: 200, unit: "pages" }];

export function Filters() {
  const [value, setValue] = useState<FacetValues>({});
  return <FacetSidebar facets={FACETS} value={value} onValueChange={setValue} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/facet-sidebar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";

defineProps<{ facets: TcFacetSidebar["facets"]; value: TcFacetSidebar["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-facet-sidebar :facets="facets" :value="value" @tc-value-change="onValueChange"></tc-facet-sidebar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FacetSidebar } from "@adamstavely/trenchcoat/angular/facet-sidebar";
import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";

@Component({
  selector: "app-facet-sidebar-example",
  imports: [FacetSidebar],
  template: `<tc-facet-sidebar [facets]="facets()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-facet-sidebar>`,
})
export class FacetSidebarExample {
  readonly facets = input.required<TcFacetSidebar["facets"]>();
  readonly value = input.required<TcFacetSidebar["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/facet-sidebar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";

  let { facets, value }: { facets: TcFacetSidebar["facets"]; value: TcFacetSidebar["value"] } = $props();
  let el: TcFacetSidebar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-facet-sidebar bind:this={el} {facets} {value}></tc-facet-sidebar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Filters"` | The heading, and the filters' name |
| `facets` | – | `Facet[]` | `[]` | The facets, in order |
| `value` | – | `FacetValues` | `{}` | The filters in use, by facet id. Changed by the user unless tc-value-change is prevented |
| `collapsed` | – | `string[]` | `[]` | The ids of folded facets. Changed by the user unless tc-collapsed-change is prevented |
| `showCount` | `show-count` | `number` | `5` | How many options a facet shows before "Show n more" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `searchLabel` | `search-label` | `string \| undefined` | `undefined` | Shows a search box above the filters, labelled with this – "Search topics"; unset, there's none |
| `query` | `query` | `string` | `""` | The search box's text. Changed by the user, firing tc-query-change |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A filter changed ({ value, facet }: FacetValueChange); cancelable – prevented, `value` stays as it was |
| `tc-collapsed-change` | – | Yes | A facet was folded or opened ({ collapsed }: FacetCollapsedChange); cancelable – prevented, `collapsed` stays as it was |
| `tc-query-change` | – | No | The search box's text changed ({ query }: FacetQueryChange), on every keystroke and on Clear all |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-fct-thumb` | `var(--tc-space-4)` | clean |

#### Design tokens it reads (68)

`--tc-accent`, `--tc-accent-text`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-knob-bg`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `facetActive(f: Facet, v: FacetValue \| undefined): boolean` | Whether a facet's value narrows anything |

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
| `facets` | `el.facets = …;` | `<… facets={…} />` | `<tc-facet-sidebar :facets="…">` | `<tc-facet-sidebar [facets]="…">` | `<tc-facet-sidebar {facets}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-facet-sidebar :value="…">` | `<tc-facet-sidebar [value]="…">` | `<tc-facet-sidebar {value}>` |
| `collapsed` | `el.collapsed = …;` | `<… collapsed={…} />` | `<tc-facet-sidebar :collapsed="…">` | `<tc-facet-sidebar [collapsed]="…">` | `<tc-facet-sidebar {collapsed}>` |

*Also attributes: `heading`, `show-count`, `locale`, `search-label`, `query` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |
| `tc-query-change` | No | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `collapsed` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-facet-sidebar id="facet-sidebar"></tc-facet-sidebar>

<script type="module">
  import "@adamstavely/trenchcoat/facet-sidebar";

  const el = document.querySelector("#facet-sidebar");
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
import { FacetSidebar } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof FacetSidebar>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledFacetSidebar({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <FacetSidebar {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/facet-sidebar";
import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";

const props = defineProps<{ initial: TcFacetSidebar["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcFacetSidebar["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-facet-sidebar :value="value" @tc-value-change="onValueChange"></tc-facet-sidebar>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FacetSidebar } from "@adamstavely/trenchcoat/angular/facet-sidebar";
import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";

@Component({
  selector: "app-controlled-facet-sidebar",
  imports: [FacetSidebar],
  template: `<tc-facet-sidebar [value]="value()" (tc-value-change)="onValueChange($event)"></tc-facet-sidebar>`,
})
export class ControlledFacetSidebar {
  readonly initial = input.required<TcFacetSidebar["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcFacetSidebar["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/facet-sidebar";
  import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";

  let { initial }: { initial: TcFacetSidebar["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcFacetSidebar;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcFacetSidebar["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-facet-sidebar bind:this={el} {value}></tc-facet-sidebar>
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

```tsx
const [value, setValue] = useState(…);
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-facet-sidebar :value="value" @tc-value-change="value = $event.detail.value"></tc-facet-sidebar>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-facet-sidebar [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-facet-sidebar>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-facet-sidebar bind:this={el} {value}></tc-facet-sidebar>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-facet-sidebar")` returns a `TcFacetSidebar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";`
- **React / Next.js:** Props: `import type { FacetSidebarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FacetSidebar>`. The element class, for refs: `import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFacetSidebar["facets"]` with `import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";`
- **Angular:** The directive types the template: `[facets]` takes `TcFacetSidebar["facets"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFacetSidebar } from "@adamstavely/trenchcoat/facet-sidebar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the filters' name |
| `value` | `FacetValues` | The filters in use – controlled when given |
| `defaultValue` | `FacetValues` | The filters on mount when `value` isn't controlled |
| `onValueChange` | `(value: FacetValues, facet: string) => void` | A filter changed; `facet` is the facet's id ("" for Clear all) |
| `collapsed` | `string[]` | Folded facets – controlled when given |
| `defaultCollapsed` | `string[]` | Folded facets on mount when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: string[]) => void` | A facet was folded or opened |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `collapsed`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | Does |
| --- | --- |
| Enter / Space on a facet's name | Folds or opens it |
| Space on an option | Picks or drops it |
| ↑ / ↓ in radios | Moves the choice |
| ← / → on a range thumb | One step (Shift: ten) |
| Page Up / Page Down | A tenth of the range |
| Home / End on a thumb | To its end |

### Screen readers

- Each facet's name is a button that says whether it's open; its options are a group (or radiogroup) named by it.
- Options are real checkboxes and radios named by their label and count.
- Range thumbs are sliders: "Length, lowest", with the value and its unit ("5 pages").
- Chips are a list; each × says what it removes. Changes are announced in a polite status line, and focus moves to
  the next chip when one goes.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.7 KB | 7.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.0 KB** | **9.7 KB** |
| With Lit – the first component on a page | 52.7 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 208 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of facets replaced |
| First on the page | 8.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | facets: first render, 3,305 nodes; update 4.8 ms |
| 1,000 items | 173 ms | facets: first render, 32,645 nodes; update 34 ms |

1,000 items of facets: 173 ms. It renders every item, so a first render passes 50 ms (a long task) at about 290 items – page or filter longer lists.

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

- Name facets with one noun: "Kind", "Programme", "Updated".
- Order options by count or by meaning, not alphabetically, unless the list is long.
- Give the range a unit people read naturally: "pages", "MB", "%".

## Do and don't

### Do

- Keep the counts up to date with the results, so a choice never leads to nothing without warning.
- Put the most used facets first and fold the rest.

### Don't

- Disable options that have no results – dim them; someone may still want them.
- Use a range for a handful of values – checkboxes are quicker.

## Related

- [Results List](results-list.md) – Search results to read and open – kind, title, a snippet with the query's words marked, source and date, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Query Builder](query-builder.md) – A search query built from conditions – a field, an operator that fits its type and a value per condition, AND / OR per group with one level of nesting, and the query read back in words and as a query string with Copy and Run
- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control

## Changelog

- **Search** - **Results List** (`tc-results-list`) – results with the query's words marked in their snippets, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more. - **Facet Sidebar** (`tc-facet-sidebar`) – checkbox, radio, range and date filters with counts, active filters as chips with Clear all. - **Saved Search Alerts** (`tc-saved-search-alerts`) – saved searches that report new matches, with frequency, channels, pause, Run now and remove with Undo.
