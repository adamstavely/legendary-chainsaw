<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Filter Menu

**Inputs & controls** · Also in React

Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control

- **Element:** `<tc-filter-menu>`
- **Size:** 11.9 KB gzip · 44.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/filter-menu";` |
| React / Next.js | `import { FilterMenu } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/filter-menu";` · tags starting with tc- are custom elements |
| Angular | `import { FilterMenu } from "@adamstavely/trenchcoat/angular/filter-menu";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/filter-menu";` |

## Example

The live example is in the gallery at `#/filter-menu`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Grouped filters for narrowing a list or a table. Each facet – status, score, region – is a group that folds open
to its options as checkboxes, with a count of how many are picked; the active filters sit on top as chips people can
remove one by one, or all at once with Clear all. Every part works from the keyboard. It is a form control too: with
`name`, the picked options are submitted with the surrounding form.

### When to use

- Narrowing a list, a table or search results by several facets at once.
- Facets with a handful to a few dozen options each – long groups stay fast, rendering only the rows in view.
- A side panel or popover where people should see every active filter at a glance.

### When not to use

- Picking values for a field from a long, searchable list – use [Combobox](combobox.md).
- Switching between two to five views of the same thing – use [Segmented Control](segmented-control.md).
- Sorting and filtering inside the table's own columns – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a funnel icon, the heading and Clear all
2. **Chip** `.ui-fm__chips > .ui-fm__chip` – an active filter, with × to remove it
3. **Group** `.ui-fm__group-head` – a facet: its name, how many options it has and how many are picked
4. **Option** `.ui-fm__option` – a checkbox for one value of the facet
5. **Keyboard hints** `.ui-fm__hints` – the keys that work here; `hints="false"` hides them

## Looks

Standard sets the menu in a white card on a gray tray, with the header on the tray above it and the keyboard hints below, dark checkboxes and
chips that wrap onto as many lines as they need. Clean is one white card with the header as its first row: chips stay on one line – as many as fit,
then a “+N” button that shows the rest – checkboxes are smaller and blue, and the hints are the card's last row.

## Usage

### HTML

```html
<tc-filter-menu id="filters" heading="Filter leads" name="f"></tc-filter-menu>

<script type="module">
  import "@adamstavely/trenchcoat/filter-menu";
  import "@adamstavely/trenchcoat/tokens.css";

  const menu = document.querySelector("#filters");
  menu.groups = [
    { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
    { id: "score", label: "Lead score", chipPrefix: "Score: ", options: [{ id: "90", label: "90–100" }, { id: "80", label: "80–89" }] },
  ];
  menu.value = { status: ["won"] };
  menu.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FilterMenu, type FilterGroup, type FilterValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: FilterGroup[] = [
  { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
  { id: "score", label: "Lead score", chipPrefix: "Score: ", options: [{ id: "90", label: "90–100" }, { id: "80", label: "80–89" }] },
];

export function LeadFilters() {
  const [value, setValue] = useState<FilterValue>({ status: ["won"] });
  return <FilterMenu title="Filter leads" groups={groups} value={value} onChange={setValue} defaultOpen={["status", "score"]} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/filter-menu";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";

defineProps<{ groups: TcFilterMenu["groups"]; value: TcFilterMenu["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-filter-menu :groups="groups" :value="value" @tc-value-change="onValueChange"></tc-filter-menu>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FilterMenu } from "@adamstavely/trenchcoat/angular/filter-menu";
import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";

@Component({
  selector: "app-filter-menu-example",
  imports: [FilterMenu],
  template: `<tc-filter-menu [groups]="groups()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-filter-menu>`,
})
export class FilterMenuExample {
  readonly groups = input.required<TcFilterMenu["groups"]>();
  readonly value = input.required<TcFilterMenu["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/filter-menu";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";

  let { groups, value }: { groups: TcFilterMenu["groups"]; value: TcFilterMenu["value"] } = $props();
  let el: TcFilterMenu;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-filter-menu bind:this={el} {groups} {value}></tc-filter-menu>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `groups` | – | `FilterGroup[]` | `[]` | The filter groups, in order – each a collapsible list of options that become chips when picked |
| `value` | – | `FilterValue` | `{}` | The picked options, per group id |
| `open` | – | `string[] \| undefined` | `undefined` | Ids of the open groups – unset opens the first group |
| `name` | `name` | `string` | `""` | Name for native form submission: one hidden input per picked option, named `name[groupId]` |
| `disabled` | `disabled` | `boolean` | `false` | Nothing can be picked, removed or cleared, and the hidden inputs are left out of the form |
| `heading` | `heading` | `string` | `"Filters"` | The heading, next to Clear all |
| `hints` | `hints` | `boolean` | `true` | Show the keyboard hints at the bottom (Clean: as the last row of the card); hints="false" hides them |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An option is picked or removed, or all are cleared; detail `{ value: FilterValue }`. Cancelable: prevent it to control `value` |
| `tc-open-change` | – | Yes | A group opens or folds; detail `{ open: string[] }`. Cancelable: prevent it to control `open` |

#### Design tokens it reads (69)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-control`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-8`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-filter-menu :groups="…">` | `<tc-filter-menu [groups]="…">` | `<tc-filter-menu {groups}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-filter-menu :value="…">` | `<tc-filter-menu [value]="…">` | `<tc-filter-menu {value}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-filter-menu :open="…">` | `<tc-filter-menu [open]="…">` | `<tc-filter-menu {open}>` |

*Also attributes: `name`, `disabled`, `heading`, `hints` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-filter-menu id="filter-menu"></tc-filter-menu>

<script type="module">
  import "@adamstavely/trenchcoat/filter-menu";

  const el = document.querySelector("#filter-menu");
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
import "@adamstavely/trenchcoat/filter-menu";
import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";

const props = defineProps<{ initial: TcFilterMenu["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcFilterMenu["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-filter-menu :value="value" @tc-value-change="onValueChange"></tc-filter-menu>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FilterMenu } from "@adamstavely/trenchcoat/angular/filter-menu";
import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";

@Component({
  selector: "app-controlled-filter-menu",
  imports: [FilterMenu],
  template: `<tc-filter-menu [value]="value()" (tc-value-change)="onValueChange($event)"></tc-filter-menu>`,
})
export class ControlledFilterMenu {
  readonly initial = input.required<TcFilterMenu["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcFilterMenu["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/filter-menu";
  import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";

  let { initial }: { initial: TcFilterMenu["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcFilterMenu;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcFilterMenu["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-filter-menu bind:this={el} {value}></tc-filter-menu>
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
<tc-filter-menu :value="value" @tc-value-change="value = $event.detail.value"></tc-filter-menu>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-filter-menu [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-filter-menu>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-filter-menu bind:this={el} {value}></tc-filter-menu>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-filter-menu")` returns a `TcFilterMenu` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";`
- **React / Next.js:** Props: `import type { FilterMenuProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FilterMenu>`. The element class, for refs: `import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFilterMenu["groups"]` with `import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";`
- **Angular:** The directive types the template: `[groups]` takes `TcFilterMenu["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFilterMenu } from "@adamstavely/trenchcoat/filter-menu";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `groups` | `FilterGroup[]` | The filter groups, in order – each a collapsible list of options that become chips when picked |
| `value` | `FilterValue` | The picked options. Controlled when defined; otherwise the menu keeps its own, starting at `defaultValue` |
| `defaultValue` | `FilterValue` | Starting value when uncontrolled |
| `onChange` | `(value: FilterValue) => void` | Called with the new value whenever an option is picked or removed, or all are cleared |
| `open` | `string[]` | Ids of the open groups. Controlled when defined; otherwise starts at `defaultOpen` |
| `defaultOpen` | `string[]` | Groups that start open – by default the first one |
| `onOpenChange` | `(open: string[]) => void` | Called with the ids of the open groups whenever a group opens or folds |
| `title` | `string` | The heading, next to Clear all – "Filters" by default |

*Renamed or hidden on the wrapper: `heading`, `groups`, `value`, `defaultValue`, `open`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Checkbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/).

### Keyboard

Every group head and visible option is in the Tab order; the arrow keys move through them too.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous group head or option |
| Home / End | Moves to the first or the last row – group head or visible option |
| Enter / Space | On a group head: opens or folds the group. On an option: picks or removes it |
| → | Opens the group |
| ← | Folds the group and moves focus to its head |
| Tab | Moves through Clear all, the chips' × buttons, the group heads and options |

When a chip is removed, focus moves to the chip that took its place, so people can remove several in a row.

### Screen readers

Each group head is a button with `aria-expanded` and `aria-controls`; the options are a group named after the facet,
each a `role="checkbox"` button with `aria-checked`, and folded groups are inert. Chip buttons are named “Remove
Qualified” (with the `chipPrefix`: “Remove Score: 90–100”); Clean's “+N” is named “Show 2 more: …” with the hidden
filters, and has `aria-expanded`. After each change a status region says how many filters are on – “3 filters
active”, or “No filters”. `disabled` marks every option `aria-disabled`.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.7 KB | 8.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **44.4 KB** | **11.9 KB** |
| With Lit – the first component on a page | 67.1 KB | 19.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.3 ms** | the gallery demo's data, 142 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of groups replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 1205 ms | groups: first render, 260,038 nodes; update 125 ms |

Windowed: 10,000 items of groups render 260,038 nodes in 1205 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name groups with the facet as a noun: “Status”, “Lead score”, “Region”.
- Keep option labels short and parallel within a group; ranges read best as “80–89”, “Below 60”.
- Use `chipPrefix` where an option means nothing on its own: a chip that says “90–100” needs “Score: ”.
- Change `heading` to say what's being filtered – “Filter leads” – when the menu sits apart from the list.

## Do and don't

### Do

- Open the groups people use most with `open` (or `defaultOpen`); unset, only the first is open.
- Show the result count next to the menu, so people see what a filter did.
- Give `name` when the filters live in a form – each pick submits as `name[groupId]`.

### Don't

- Don't use it for a single yes-or-no filter – a switch or checkbox is enough.
- Don't put more than a few dozen options in a group without search; long lists belong in `combobox`.
- Don't apply filters only on a separate Apply button – the menu reports every change as it happens.

## Related

- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- filter-menu renders only the rows near the viewport in groups over 60 options (tested with 5,000).
