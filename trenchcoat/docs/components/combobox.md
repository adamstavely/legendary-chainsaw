<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Combobox

**Inputs & controls** · Also in React

Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support

- **Element:** `<tc-combobox>`
- **Size:** 14.8 KB gzip · 51.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/combobox";` |
| React / Next.js | `import { Combobox } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/combobox";` · tags starting with tc- are custom elements |
| Angular | `import { Combobox } from "@adamstavely/trenchcoat/angular/combobox";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/combobox";` |

## Example

The live example is in the gallery at `#/combobox`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A field for picking one or many options from a list that's too long to scan. People type to filter, pick with
the keyboard or the pointer, and see what they picked as chips in the field. Options can carry an avatar, a colour
dot or an icon, sit under group headings, and match on extra keywords – and the combobox can offer to create an
option that doesn't exist yet. It is a form control: it submits its values under `name`, checks `required`, and
resets with the form.

### When to use

- Assigning people, labels, tags or projects, where the list has more than about ten options.
- Picking several values at once and seeing them all in place.
- Lists that grow as people use them – turn on `creatable` to add what's missing.

### When not to use

- Two to five options that all fit on screen – use [Segmented Control](segmented-control.md) (one choice) or checkboxes.
- Running commands or jumping somewhere – use [Command Menu](command-menu.md).
- Narrowing a list or a table by several facets at once – use [Filter Menu](filter-menu.md).
- Mentioning people or files inside text someone is writing – use [Mention Picker](mention-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-cbx__label` – names the field; a page `<label for>` works too
2. **Field** `.ui-cbx__field` – the chips and the text input together
3. **Chip** `.ui-cbx__chip` – one picked option, with × to remove it
4. **Input** `.ui-cbx__input` – where people type to filter
5. **Toggle** `.ui-cbx__toggle` – opens and closes the list
6. **List** `.ui-cbx__pop` – the grouped options, the typed text marked in each

## Looks

Standard sets the field in the gray tray and lets it grow line by line as chips are added. Clean is a white field
with a hairline shadow that stays one line high; chips that don't fit fold into a “+N” count. Both open the same
list, glide to their new height, and use the same keys.

## Usage

### HTML

```html
<label for="assignees">Assignees</label>
<tc-combobox id="assignees" name="assignees"></tc-combobox>

<script type="module">
  import "@adamstavely/trenchcoat/combobox";
  import "@adamstavely/trenchcoat/tokens.css";

  const field = document.querySelector("#assignees");
  field.options = [
    { value: "maya", label: "Maya Chen", hint: "Design lead", avatar: true, group: "Design" },
    { value: "jonas", label: "Jonas Weber", hint: "Frontend", avatar: true, group: "Engineering" },
  ];
  field.value = ["maya"];
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Combobox, type ComboboxOption } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const people: ComboboxOption[] = [
  { value: "maya", label: "Maya Chen", hint: "Design lead", avatar: true, group: "Design" },
  { value: "jonas", label: "Jonas Weber", hint: "Frontend", avatar: true, group: "Engineering" },
];

export function Assignees() {
  const [value, setValue] = useState(["maya"]);
  return <Combobox label="Assignees" options={people} value={value} onChange={setValue} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/combobox";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";

defineProps<{ options: TcCombobox["options"]; value: TcCombobox["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-combobox :options="options" :value="value" @tc-value-change="onValueChange"></tc-combobox>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Combobox } from "@adamstavely/trenchcoat/angular/combobox";
import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";

@Component({
  selector: "app-combobox-example",
  imports: [Combobox],
  template: `<tc-combobox [options]="options()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-combobox>`,
})
export class ComboboxExample {
  readonly options = input.required<TcCombobox["options"]>();
  readonly value = input.required<TcCombobox["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/combobox";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";

  let { options, value }: { options: TcCombobox["options"]; value: TcCombobox["value"] } = $props();
  let el: TcCombobox;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-combobox bind:this={el} {options} {value}></tc-combobox>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `options` | – | `ComboboxOption[]` | `[]` | Every option |
| `value` | – | `string[]` | `[]` | The picked values. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `single` | `single` | `boolean` | `false` | Pick one instead of many |
| `open` | `open` | `boolean` | `false` | Whether the list is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `placeholder` | `placeholder` | `string` | `"Search…"` | Text in the empty input |
| `creatable` | `creatable` | `boolean` | `false` | Offer "Create “…”" when nothing matches the typed text exactly |
| `createOption` | – | `((text: string) => ComboboxOption \| void \| Promise<ComboboxOption \| void>) \| undefined` | `undefined` | Turns typed text into an option – defaults to { value: text, label: text }. May return a promise: the create row shows that it's working, and a rejection shows an error there so it can be tried again |
| `createLabel` | – | `(text: string) => string` | – | Text of the create row |
| `maxVisibleTags` | `max-visible-tags` | `number \| undefined` | `undefined` | Show at most this many chips, the rest as "+3" (Clean always stays one line) |
| `label` | `label` | `string` | `""` | Visible label above the field (or use a page &lt;label for>) |
| `emptyText` | `empty-text` | `string` | `"No results"` | Shown when nothing matches |
| `name` | `name` | `string` | `""` | Submitted with the form: one entry per picked value |
| `disabled` | `disabled` | `boolean` | `false` | Can't be changed or focused; also disabled inside a disabled &lt;fieldset> |
| `required` | `required` | `boolean` | `false` | At least one value must be picked before the form submits |
| `invalid` | `invalid` | `boolean` | `false` | Shows the field as invalid (red edge, aria-invalid on the input) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | `ComboboxValueChange` | Yes | The user picked or removed values ({ value, options }); cancelable |
| `tc-open-change` | `OpenChange` | Yes | The list opens or closes ({ open }); cancelable |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus(options?: FocusOptions)` | `void` | – |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-combobox-chip-initial-size` | `7px` | both, clean |
| `--tc-combobox-chip-border-armed` | `light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3))` | standard, clean |

#### Design tokens it reads (89)

`--tc-accent-highlight`, `--tc-action-ghost-bg-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-sm`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-combobox :options="…">` | `<tc-combobox [options]="…">` | `<tc-combobox {options}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-combobox :value="…">` | `<tc-combobox [value]="…">` | `<tc-combobox {value}>` |
| `createOption` | `el.createOption = …;` | `<… createOption={…} />` | `<tc-combobox :createOption="…">` | `<tc-combobox [createOption]="…">` | `<tc-combobox {createOption}>` |
| `createLabel` | `el.createLabel = …;` | `<… createLabel={…} />` | `<tc-combobox :createLabel="…">` | `<tc-combobox [createLabel]="…">` | `<tc-combobox {createLabel}>` |

*Also attributes: `single`, `open`, `placeholder`, `creatable`, `max-visible-tags`, `label`, `empty-text`, `name` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `value` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-combobox id="combobox"></tc-combobox>

<script type="module">
  import "@adamstavely/trenchcoat/combobox";

  const el = document.querySelector("#combobox");
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
import { Combobox } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Combobox>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledCombobox({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <Combobox {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/combobox";
import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";

const props = defineProps<{ initial: TcCombobox["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcCombobox["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-combobox :value="value" @tc-value-change="onValueChange"></tc-combobox>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Combobox } from "@adamstavely/trenchcoat/angular/combobox";
import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";

@Component({
  selector: "app-controlled-combobox",
  imports: [Combobox],
  template: `<tc-combobox [value]="value()" (tc-value-change)="onValueChange($event)"></tc-combobox>`,
})
export class ControlledCombobox {
  readonly initial = input.required<TcCombobox["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcCombobox["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/combobox";
  import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";

  let { initial }: { initial: TcCombobox["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcCombobox;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcCombobox["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-combobox bind:this={el} {value}></tc-combobox>
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
<tc-combobox :value="value" @tc-value-change="value = $event.detail.value"></tc-combobox>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-combobox [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-combobox>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-combobox bind:this={el} {value}></tc-combobox>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-combobox")` returns a `TcCombobox` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";`
- **React / Next.js:** Props: `import type { ComboboxProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Combobox>`. The element class, for refs: `import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCombobox["options"]` with `import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";`
- **Angular:** The directive types the template: `[options]` takes `TcCombobox["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCombobox } from "@adamstavely/trenchcoat/combobox";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `options` | `ComboboxOptionNode[]` | Every option; icons and avatars may be React nodes |
| `multiple` | `boolean` | Pick many (the default) or one |
| `value` | `string[]` | The picked values (controlled). Leave undefined to let the combobox keep them, starting at `defaultValue` |
| `defaultValue` | `string[]` | The values picked at first when uncontrolled |
| `onChange` | `(value: string[], options: ComboboxOption[]) => void` | Every pick and removal, with the picked options |
| `open` | `boolean` | Whether the list is open (controlled) |
| `defaultOpen` | `boolean` | Whether the list starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | The list opened or closed |

*Renamed or hidden on the wrapper: `value`, `open`, `single`, `onChange`, `options`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Opens the list; then moves to the next or previous option |
| Enter | Picks the active option (or removes it, if it's picked already) |
| Escape | Closes the list; with the list closed, clears what was typed |
| Backspace | In an empty input: the first press marks the last chip, the second removes it |
| Tab | Closes the list and moves on |

### Screen readers

The input is the combobox: `aria-expanded` says whether the list is open, `aria-controls` points at the listbox and
`aria-activedescendant` at the active option, so focus never leaves the input. Picked options are
`aria-selected`. A polite live region confirms each pick and removal with the new count (“Maya Chen selected. 2
selected”), and the first Backspace says which chip it marked (“Bug – press Backspace again to remove”).

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 44.1 KB | 12.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **51.9 KB** | **14.8 KB** |
| With Lit – the first component on a page | 74.6 KB | 22.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 27 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of options replaced |
| First on the page | 9.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.9 ms | options: first render, 27 nodes; update 0.3 ms |
| 1,000 items | 1.3 ms | options: first render, 27 nodes; update 0.3 ms |

What it renders doesn't grow with options (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Label the field with what's being picked, as a noun: “Assignees”, “Labels” – not “Select assignees”.
- Use `hint` for what tells two options apart (a role, an email), not for a description of every option.
- Keep option labels short; put synonyms people might type in `keywords`.
- Write `emptyText` for the list: “No one found” reads better than the default “No results” – the combobox adds
  “for ‘…’” with what was typed.

## Do and don't

### Do

- Group long lists (`group`) so people can find their place.
- Give each person an avatar and each label a colour, so chips are recognisable at a glance.
- Use `single` when exactly one value makes sense – the field then shows one choice and closes after a pick.

### Don't

- Don't use it for fewer than about six options – a visible choice is faster.
- Don't put actions (“Delete project”) in the list next to values.
- Don't hide which options are picked: keep the chips visible, or use Clean's “+N” for the overflow.

## Related

- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- **`trenchcoat/angular`:** a standalone directive for every element, named after it (`tc-combobox` → `Combobox`), plus `TRENCHCOAT` for all of them. Generated from the elements' JSDoc by `scripts/gen-angular.mjs` and built by `ngc` in partial mode for Angular 19 and later. - **No schema:** no `CUSTOM_ELEMENTS_SCHEMA`, and strict templates check every binding. - **Inputs:** typed from the element's properties. Plain boolean and numeric attributes are accepted (`required`, `value="0.6"`). - **Events:** typed, so `$event` is the event's `CustomEvent<…>`. Each handler runs once per event.
- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen, ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
- combobox `invalid`, otp-input `labelledBy`, stepper-form tags `autoComplete`, decision-tree Previous/Next buttons, inline-diff "Undo last decision", agent-plan Move up/down buttons, delegate-board click-to-assign.
