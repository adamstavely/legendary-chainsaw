<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tree Select

**Inputs & controls** · New

Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them

- **Element:** `<tc-tree-select>`
- **Size:** 10.5 KB gzip · 34.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tree-select";` |
| React / Next.js | `import { TreeSelect } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tree-select";` · tags starting with tc- are custom elements |
| Angular | `import { TreeSelect } from "@adamstavely/trenchcoat/angular/tree-select";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tree-select";` |

## Example

The live example is in the gallery at `#/tree-select`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A field for picking from a hierarchy: subject categories, folders, org units, regions. Closed, it shows the picked
option's whole path – “Sciences › Physics › Optics” – so people know which Optics they chose. Open, it shows the
tree: branches fold and unfold, typing filters it while keeping the parents of every match, and with `multiple`
every row has a checkbox, where checking a parent checks everything beneath it. It is a form control: it submits its
value under `name`, checks `required`, and resets with the form.

### When to use

- The options form a hierarchy, and where an option sits matters for picking it (two “General” folders in
  different places).
- Picking several branches and leaves at once, such as the subjects a reading list covers.
- Long hierarchies people search more than they browse.

### When not to use

- A flat list – use [Combobox](combobox.md).
- Narrowing a list or a table by several facets – use [Filter Menu](filter-menu.md).
- Showing where someone is in a hierarchy, not choosing from it – use [Breadcrumbs](breadcrumbs.md).
- Free-text labels people make up as they go – use [Tag Input](tag-input.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-tsel__label` – names the field; a page `<label for>` works too
2. **Field** `.ui-tsel__field` – the picked path, or chips and “+N more” with `multiple`
3. **Clear** `.ui-tsel__clear` – × to clear what's picked
4. **Popover** `.ui-tsel__pop` – the filter and the tree, the width of the field
5. **Filter** `.ui-tsel__filter` – type to narrow the tree
6. **Tree item** `.ui-tsel__item` – one option: its twisty, its checkbox with `multiple`, its label and description
7. **Footer** `.ui-tsel__foot` – with `multiple`, the count and Clear

## Looks

Standard sets the field in the gray tray and the tree on a white card inside a tray. Clean is a white field and one
white popover. Both indent each level by `--tc-tsel-indent`, which a page can override on `tc-tree-select`; below
380px the indent tightens and descriptions hide.

## Usage

### HTML

```html
<tc-tree-select label="Subject" name="subject"></tc-tree-select>

<script type="module">
  import "@adamstavely/trenchcoat/tree-select";
  import "@adamstavely/trenchcoat/tokens.css";

  const field = document.querySelector("tc-tree-select");
  field.options = [
    { id: "sciences", label: "Sciences", children: [{ id: "optics", label: "Optics" }, { id: "botany", label: "Botany" }] },
    { id: "maps", label: "Maps & atlases" },
  ];
  field.value = "optics";
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TreeSelect, type TreeOption, type TreeSelectValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const subjects: TreeOption[] = [
  { id: "sciences", label: "Sciences", children: [{ id: "optics", label: "Optics" }, { id: "botany", label: "Botany" }] },
  { id: "maps", label: "Maps & atlases" },
];

export function Subjects() {
  const [value, setValue] = useState<TreeSelectValue>(["optics"]);
  return <TreeSelect label="Covers" multiple options={subjects} value={value} onChange={setValue} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tree-select";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";

defineProps<{ options: TcTreeSelect["options"]; value: TcTreeSelect["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tree-select :options="options" :value="value" @tc-value-change="onValueChange"></tc-tree-select>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TreeSelect } from "@adamstavely/trenchcoat/angular/tree-select";
import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";

@Component({
  selector: "app-tree-select-example",
  imports: [TreeSelect],
  template: `<tc-tree-select [options]="options()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-tree-select>`,
})
export class TreeSelectExample {
  readonly options = input.required<TcTreeSelect["options"]>();
  readonly value = input.required<TcTreeSelect["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tree-select";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";

  let { options, value }: { options: TcTreeSelect["options"]; value: TcTreeSelect["value"] } = $props();
  let el: TcTreeSelect;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tree-select bind:this={el} {options} {value}></tc-tree-select>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | – | `TreeOption[]` | `[]` | The hierarchy |
| `value` | – | `TreeSelectValue` | `null` | The picked id (or ids, with `multiple`); null for nothing. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `multiple` | `multiple` | `boolean` | `false` | Pick many: every row gets a checkbox |
| `cascade` | `cascade` | `boolean` | `true` | With `multiple`, checking a parent checks everything enabled beneath it; set cascade="false" to check rows on their own |
| `open` | `open` | `boolean` | `false` | Whether the tree is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `label` | `label` | `string` | `""` | Visible label above the field (or use a page &lt;label for>) |
| `placeholder` | `placeholder` | `string` | `"Choose…"` | Shown in the empty field |
| `filterPlaceholder` | `filter-placeholder` | `string` | `"Filter…"` | The filter box's placeholder |
| `emptyText` | `empty-text` | `string` | `"No matches"` | Shown when nothing matches the filter |
| `maxChips` | `max-chips` | `number` | `3` | With `multiple`, show at most this many chips in the field, the rest as "+N more" |
| `name` | `name` | `string` | `""` | Submitted with the form: the id, or one entry per id with `multiple` |
| `disabled` | `disabled` | `boolean` | `false` | Can't be changed or focused; also disabled inside a disabled &lt;fieldset> |
| `required` | `required` | `boolean` | `false` | Something must be picked before the form submits |
| `invalid` | `invalid` | `boolean` | `false` | Shows the field as invalid |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An option was picked, checked or cleared ({ value, options }: TreeSelectValueChange); cancelable – prevented, `value` stays as it was |
| `tc-open-change` | – | Yes | The tree opens or closes ({ open }: TreeSelectOpenChange); cancelable – prevented, it stays as it is |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus(options?: FocusOptions)` | `void` | – |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tsel-indent` | `var(--tc-space-3)` | both |

#### Design tokens it reads (66)

`--tc-accent-highlight`, `--tc-accent-solid`, `--tc-accent-text`, `--tc-border-control`, `--tc-border-default`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `flattenTree(options: TreeOption[]): TreeNode[]` | Every option as a node with its parent and depth, in tree order |
| `treePath(options: TreeOption[], id: string): string[]` | The labels from the root down to `id`, or [] when it isn't in the tree |

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-tree-select :options="…">` | `<tc-tree-select [options]="…">` | `<tc-tree-select {options}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-tree-select :value="…">` | `<tc-tree-select [value]="…">` | `<tc-tree-select {value}>` |

*Also attributes: `multiple`, `cascade`, `open`, `label`, `placeholder`, `filter-placeholder`, `empty-text`, `max-chips` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tree-select id="tree-select"></tc-tree-select>

<script type="module">
  import "@adamstavely/trenchcoat/tree-select";

  const el = document.querySelector("#tree-select");
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
import "@adamstavely/trenchcoat/tree-select";
import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";

const props = defineProps<{ initial: TcTreeSelect["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcTreeSelect["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-tree-select :value="value" @tc-value-change="onValueChange"></tc-tree-select>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TreeSelect } from "@adamstavely/trenchcoat/angular/tree-select";
import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";

@Component({
  selector: "app-controlled-tree-select",
  imports: [TreeSelect],
  template: `<tc-tree-select [value]="value()" (tc-value-change)="onValueChange($event)"></tc-tree-select>`,
})
export class ControlledTreeSelect {
  readonly initial = input.required<TcTreeSelect["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcTreeSelect["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tree-select";
  import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";

  let { initial }: { initial: TcTreeSelect["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcTreeSelect;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcTreeSelect["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tree-select bind:this={el} {value}></tc-tree-select>
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

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-tree-select :value="value" @tc-value-change="value = $event.detail.value"></tc-tree-select>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-tree-select [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-tree-select>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-tree-select bind:this={el} {value}></tc-tree-select>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tree-select")` returns a `TcTreeSelect` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";`
- **React / Next.js:** Props: `import type { TreeSelectProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TreeSelect>`. The element class, for refs: `import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTreeSelect["options"]` with `import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";`
- **Angular:** The directive types the template: `[options]` takes `TcTreeSelect["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTreeSelect } from "@adamstavely/trenchcoat/tree-select";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `TreeSelectValue` | The picked id (or ids with `multiple`), null for nothing – controlled when given |
| `defaultValue` | `TreeSelectValue` | The value on mount when `value` isn't controlled |
| `onChange` | `(value: TreeSelectValue, options: TreeOption[]) => void` | Every pick, check and clear, with the picked options |
| `open` | `boolean` | Whether the tree is open – controlled when given |
| `defaultOpen` | `boolean` | Whether the tree starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | The tree opened or closed |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `open`, `onChange`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ / Enter / Space (field) | Opens the tree and focuses the picked option, or the first |
| ↓ / ↑ | Next or previous visible option; ↑ from the first goes to the filter |
| → | Unfolds a branch; on an unfolded branch, moves to its first child |
| ← | Folds a branch; otherwise moves to the parent |
| Home / End | First or last visible option |
| * | Unfolds every branch beside the focused one |
| Enter / Space | Picks the option (closes the tree), or with `multiple` checks or unchecks it |
| Any letter | Types into the filter |
| Escape | In the filter: clears it, then closes; in the tree: closes and returns to the field |
| Delete / Backspace (field) | Clears the value |

### Screen readers

The field is a select-only `combobox` with `aria-haspopup="tree"`, named by its label and the picked path. The
popover holds a `tree` whose items carry `aria-level`, `aria-setsize`, `aria-posinset` and, on branches,
`aria-expanded`. One item is focusable at a time. A single pick is `aria-selected`; with `multiple` the tree is
`aria-multiselectable` and each item `aria-checked` – “mixed” for a parent with some children checked. A polite
status confirms picks (“Sciences, Physics selected”, “Optics checked. 3 selected”).

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.0 KB | 8.7 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.6 KB** | **10.6 KB** |
| With Lit – the first component on a page | 57.7 KB | 18.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 18 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of options replaced |
| First on the page | 7.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.4 ms | options: first render, 18 nodes; update 0.2 ms |
| 1,000 items | 1.1 ms | options: first render, 18 nodes; update 0.4 ms |

What it renders doesn't grow with options (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label the field with what's chosen, as a noun: “Subject”, “Folder”.
- Keep labels short and unique among their siblings; use `description` for what tells similar options apart.
- Mark options people can see but not pick as `disabled`, rather than leaving them out, so the tree reads the same
  for everyone.

## Do and don't

### Do

- Use `multiple` with `cascade` when picking a parent means “all of it”.
- Give ids that stay the same when labels change, so stored values keep working.

### Don't

- Don't nest deeper than about four levels – people lose their place.
- Don't use it for a handful of options that would fit as radio buttons.

## Related

- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Breadcrumbs](breadcrumbs.md) – Where you are in a hierarchy as a trail of links: the current page last, the middle folding into "…" when it doesn't fit or passes `max`, a cancelable `tc-navigate` for routing, and Copy path
- [Tag Input](tag-input.md) – A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal

## Changelog

- **Tree Select** (`tc-tree-select`) – one or many from a nested hierarchy, with filtering that keeps parents, ARIA tree keys and cascading parent checkboxes; a form control.
