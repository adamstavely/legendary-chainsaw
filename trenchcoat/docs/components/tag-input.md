<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tag Input

**Inputs & controls** · New

A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal

- **Element:** `<tc-tag-input>`
- **Size:** 8.5 KB gzip · 26.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tag-input";` |
| React / Next.js | `import { TagInput } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tag-input";` · tags starting with tc- are custom elements |
| Angular | `import { TagInput } from "@adamstavely/trenchcoat/angular/tag-input";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tag-input";` |

## Example

The live example is in the gallery at `#/tag-input`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A field of free-text chips: keywords, labels, email domains, anything people name themselves. Type and press Enter,
a comma or Tab to add what you typed; paste “a, b, c” to add three at once. `suggestions` offers known values in a
list under the field, and `allow-custom="false"` accepts only those. Tags are unique (ignoring case) by default,
`max` caps how many, and `validate` can refuse one with a reason, shown under the field. Chips are removed with ×,
with Backspace in the empty field, or with Delete on a focused chip. It is a form control: each tag is submitted
under `name`, `required` needs at least one, and it resets with the form.

### When to use

- Keywords and labels people make up as they go, with or without a set of usual values.
- A list of short values typed by hand: email domains, file extensions, hostnames.

### When not to use

- Picking from a fixed list of known options with avatars or groups – use [Combobox](combobox.md).
- Mentioning people inside text someone is writing – use [Mention Picker](mention-picker.md).
- One step of a longer guided form – [Stepper Form](stepper-form.md) has its own tags field.
- Choosing from a hierarchy – use [Tree Select](tree-select.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-tgi__label` – names the field; a page `<label for>` works too
2. **Field** `.ui-tgi__field` – the chips and the input together
3. **Chip** `.ui-tgi__chip` – one tag, with × to remove it
4. **Input** `.ui-tgi__input` – where a new tag is typed
5. **Suggestions** `.ui-tgi__pop` – the matching suggestions, the typed text marked
6. **Error** `.ui-tgi__error` – why the last tag was refused

## Looks

Standard sets the field in the gray tray with outlined chips. Clean is a white field with filled chips in a smaller,
medium-weight type. Both grow line by line as chips are added.

## Usage

### HTML

```html
<tc-tag-input label="Keywords" name="keywords" max="8"></tc-tag-input>

<script type="module">
  import "@adamstavely/trenchcoat/tag-input";
  import "@adamstavely/trenchcoat/tokens.css";

  const field = document.querySelector("tc-tag-input");
  field.value = ["Harbours", "Tides"];
  field.suggestions = ["Archives", "Cartography", "Navigation"];
  field.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.added, e.detail.removed));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TagInput } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Keywords() {
  const [value, setValue] = useState(["Harbours", "Tides"]);
  return (
    <TagInput
      label="Keywords"
      value={value}
      onChange={setValue}
      suggestions={["Archives", "Cartography", "Navigation"]}
      validate={(text) => (text.length < 3 ? "Keywords need at least three letters." : undefined)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tag-input";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";

defineProps<{ value: TcTagInput["value"]; suggestions: TcTagInput["suggestions"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tag-input :value="value" :suggestions="suggestions" @tc-value-change="onValueChange"></tc-tag-input>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TagInput } from "@adamstavely/trenchcoat/angular/tag-input";
import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";

@Component({
  selector: "app-tag-input-example",
  imports: [TagInput],
  template: `<tc-tag-input [value]="value()" [suggestions]="suggestions()" (tc-value-change)="onValueChange($event)"></tc-tag-input>`,
})
export class TagInputExample {
  readonly value = input.required<TcTagInput["value"]>();
  readonly suggestions = input.required<TcTagInput["suggestions"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tag-input";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";

  let { value, suggestions }: { value: TcTagInput["value"]; suggestions: TcTagInput["suggestions"] } = $props();
  let el: TcTagInput;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tag-input bind:this={el} {value} {suggestions}></tc-tag-input>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `string[]` | `[]` | The tags. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `suggestions` | – | `string[]` | `[]` | Offered in a list under the field, filtered by what's typed |
| `allowCustom` | `allow-custom` | `boolean` | `true` | Accept tags that aren't in `suggestions`; set allow-custom="false" to allow only suggestions |
| `max` | `max` | `number \| undefined` | `undefined` | The most tags the field holds |
| `unique` | `unique` | `boolean` | `true` | Refuse a tag that's already there (ignoring case); set unique="false" to allow repeats |
| `validate` | – | `TagValidator \| undefined` | `undefined` | Checks a tag before it's added: return the reason it can't be, or nothing |
| `label` | `label` | `string` | `""` | Visible label above the field (or use a page &lt;label for>) |
| `placeholder` | `placeholder` | `string` | `"Add a tag…"` | Text in the empty input |
| `name` | `name` | `string` | `""` | Submitted with the form: one entry per tag |
| `disabled` | `disabled` | `boolean` | `false` | Can't be changed or focused; also disabled inside a disabled &lt;fieldset> |
| `required` | `required` | `boolean` | `false` | At least one tag before the form submits |
| `invalid` | `invalid` | `boolean` | `false` | Shows the field as invalid |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | Tags were added or removed ({ value, added, removed }: TagInputValueChange); cancelable – prevented, `value` stays as it was |
| `tc-invalid-tag` | – | No | A tag was refused ({ text, reason, message }: TagInvalid) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus(options?: FocusOptions)` | `void` | – |

#### Design tokens it reads (51)

`--tc-accent-highlight`, `--tc-border-default`, `--tc-border-strong`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-status-danger-fg`, `--tc-text-disabled`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `splitTags(text: string): void` | Splits pasted or typed text into tags: commas and new lines separate them |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-tag-input :value="…">` | `<tc-tag-input [value]="…">` | `<tc-tag-input {value}>` |
| `suggestions` | `el.suggestions = …;` | `<… suggestions={…} />` | `<tc-tag-input :suggestions="…">` | `<tc-tag-input [suggestions]="…">` | `<tc-tag-input {suggestions}>` |
| `validate` | `el.validate = …;` | `<… validate={…} />` | `<tc-tag-input :validate="…">` | `<tc-tag-input [validate]="…">` | `<tc-tag-input {validate}>` |

*Also attributes: `allow-custom`, `max`, `unique`, `label`, `placeholder`, `name`, `disabled`, `required` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-invalid-tag` | No | `el.addEventListener("tc-invalid-tag", (e) => …)` | `onInvalidTag={…}` | `@tc-invalid-tag="…"` | `(tc-invalid-tag)="…($event)"` | `el.addEventListener("tc-invalid-tag", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tag-input id="tag-input"></tc-tag-input>

<script type="module">
  import "@adamstavely/trenchcoat/tag-input";

  const el = document.querySelector("#tag-input");
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
import { TagInput } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TagInput>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledTagInput({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <TagInput {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/tag-input";
import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";

const props = defineProps<{ initial: TcTagInput["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcTagInput["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-tag-input :value="value" @tc-value-change="onValueChange"></tc-tag-input>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TagInput } from "@adamstavely/trenchcoat/angular/tag-input";
import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";

@Component({
  selector: "app-controlled-tag-input",
  imports: [TagInput],
  template: `<tc-tag-input [value]="value()" (tc-value-change)="onValueChange($event)"></tc-tag-input>`,
})
export class ControlledTagInput {
  readonly initial = input.required<TcTagInput["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcTagInput["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tag-input";
  import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";

  let { initial }: { initial: TcTagInput["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcTagInput;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcTagInput["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tag-input bind:this={el} {value}></tc-tag-input>
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
<tc-tag-input :value="value" @tc-value-change="value = $event.detail.value"></tc-tag-input>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-tag-input [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-tag-input>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-tag-input bind:this={el} {value}></tc-tag-input>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tag-input")` returns a `TcTagInput` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";`
- **React / Next.js:** Props: `import type { TagInputProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TagInput>`. The element class, for refs: `import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTagInput["value"]` with `import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";`
- **Angular:** The directive types the template: `[value]` takes `TcTagInput["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTagInput } from "@adamstavely/trenchcoat/tag-input";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string[]` | The tags – controlled when given |
| `defaultValue` | `string[]` | The tags on mount when `value` isn't controlled |
| `onChange` | `(value: string[], change: TagInputValueChange) => void` | Tags were added or removed |
| `onInvalidTag` | `(invalid: TagInvalid) => void` | A tag was refused: a duplicate, over `max`, not a suggestion, or refused by `validate` |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `onChange`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter | Adds what's typed, or the highlighted suggestion |
| , | Adds what's typed |
| Tab | With text typed: adds it; otherwise moves on |
| ↓ / ↑ | Opens the suggestions; then moves through them |
| Escape | Closes the suggestions; then clears what's typed |
| Backspace (empty input) | The first press marks the last chip, the second removes it |
| ← (at the start of the text) | Moves onto the last chip |
| ← / → (on a chip) | Previous or next chip; → past the last returns to the input |
| Delete / Backspace (on a chip) | Removes it |

### Screen readers

The input is a textbox, or a `combobox` with `aria-controls`, `aria-expanded` and `aria-activedescendant` when there
are suggestions. Chips sit in a list named after the field (“Keywords, added”); each is a button described as
“Press Delete to remove”, and each × is named “Remove Tides”. A polite status confirms adds and removals with the
count (“Added Tides. 3 tags”), and a refused tag's reason is announced and linked to the input with
`aria-describedby`.

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
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.4 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.0 KB** | **8.6 KB** |
| With Lit – the first component on a page | 48.3 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 26 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of suggestions replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.6 ms | suggestions: first render, 26 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | suggestions: first render, 26 nodes; update 0.0 ms |

What it renders doesn't grow with suggestions (tested to 1,000 items).

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

- Label the field with what the tags are, as a plural noun: “Keywords”, “Domains”.
- Write `validate` messages that say what to do: “Keywords need at least three letters.”
- Keep suggestions to the values people reuse; they're filtered as people type.

## Do and don't

### Do

- Pass `suggestions` from values already in use, so the same tag isn't spelled three ways.
- Use `max` when the list feeds something with a limit, and say so in the label or description.

### Don't

- Don't use tags for long text – each chip is cut at about 200px.
- Don't turn off `unique` unless repeats mean something.

## Related

- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Tree Select](tree-select.md) – Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them

## Changelog

- **Tag Input** (`tc-tag-input`) – free-text chips with suggestions, paste, limits, de-duplication and validation; a form control.
