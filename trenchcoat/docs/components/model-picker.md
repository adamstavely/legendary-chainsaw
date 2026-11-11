<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Model Picker

**AI & chat**

The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price

- **Element:** `<tc-model-picker>`
- **Size:** 11.8 KB gzip · 46.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/model-picker";` |
| React / Next.js | `import { ModelPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/model-picker";` · tags starting with tc- are custom elements |
| Angular | `import { ModelPicker } from "@adamstavely/trenchcoat/angular/model-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/model-picker";` |

## Example

The live example is in the gallery at `#/model-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The model menu of an AI chat. A small trigger – the model's glyph, its name and a chevron – sits in the composer's
toolbar and opens a menu with one row per model. Each row carries three small bars for Speed, Quality and Cost that
fill when you point at it, and the line at the bottom says what that model costs you: the time to the first token
and the price per million tokens, rolling to new numbers as you move. Extended thinking and Web search are switches
below the list; turning thinking on unfolds an Effort control (Low / Medium / High) and stretches the first-token
time to match.

### When to use

- Letting people choose which model answers, inside a chat composer or a prompt field.
- When the trade-off between speed, quality and cost should be visible at the moment of choosing.
- Pairing the model choice with the two settings people change most: thinking and web search.

### When not to use

- Comparing two models' answers to the same prompt – use [Answer Arena](answer-arena.md).
- A long list of options people search by typing – use [Combobox](combobox.md).
- Two or three plain options that all fit on screen – use [Segmented Control](segmented-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trigger** `.ui-mdp__trigger` – the chosen model's glyph and name; a bulb shows while thinking is on
2. **Menu** `.ui-mdp__pop` – the popover that unfolds from the trigger
3. **Model row** `.ui-mdp__option` – name, one-line description, and a check on the chosen model
4. **Strength bars** `.ui-mdp__bars` – Speed, Quality and Cost from 1 to 5; “Varies” for a router like Auto
5. **Switch** `.ui-mdp__toggle` – Extended thinking or Web search
6. **Effort** `.ui-mdp__segmented` – Low / Medium / High, shown while thinking is on
7. **Cost line** `.ui-mdp__foot` – first-token time and price of the model you point at

## Looks

Standard puts the list and switches on a white card inside a gray tray, with the cost line on the tray below it.
Clean drops the tray: one white popover with hairline shadows and a blue accent, the cost line as its last row, icons
a size larger with thinner lines, and an Effort fill measured to sit under the chosen level. Both open the same menu
and use the same keys.

## Usage

### HTML

```html
<tc-model-picker id="model" value="atlas" side="top"></tc-model-picker>

<script type="module">
  import "@adamstavely/trenchcoat/model-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#model");
  picker.models = [
    { id: "auto", name: "Auto", description: "Picks the right model per message" },
    { id: "atlas", name: "Atlas", description: "Balanced for everyday work", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 15 },
    { id: "atlas-mini", name: "Atlas Mini", description: "Fast answers, lowest cost", speed: 5, quality: 3, cost: 1, latencyMs: 350, pricePerM: 1.25 },
  ];
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ModelPicker, type ModelEffort, type PickerModel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const models: PickerModel[] = [
  { id: "auto", name: "Auto", description: "Picks the right model per message" },
  { id: "atlas", name: "Atlas", description: "Balanced for everyday work", speed: 4, quality: 4, cost: 3, latencyMs: 900, pricePerM: 15 },
];

export function ComposerModel() {
  const [model, setModel] = useState("atlas");
  const [thinking, setThinking] = useState(false);
  const [effort, setEffort] = useState<ModelEffort>("medium");
  return (
    <ModelPicker
      models={models}
      value={model}
      onChange={setModel}
      thinking={thinking}
      onThinkingChange={setThinking}
      effort={effort}
      onEffortChange={setEffort}
      side="top"
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/model-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";

defineProps<{ models: TcModelPicker["models"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-model-picker :models="models" @tc-value-change="onValueChange"></tc-model-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ModelPicker } from "@adamstavely/trenchcoat/angular/model-picker";
import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";

@Component({
  selector: "app-model-picker-example",
  imports: [ModelPicker],
  template: `<tc-model-picker [models]="models()" (tc-value-change)="onValueChange($event)"></tc-model-picker>`,
})
export class ModelPickerExample {
  readonly models = input.required<TcModelPicker["models"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";

  let { models }: { models: TcModelPicker["models"] } = $props();
  let el: TcModelPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-model-picker bind:this={el} {models}></tc-model-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `models` | – | `PickerModel[]` | `[]` | The models to choose from, in menu order – each with its strengths, first-token time and price |
| `value` | `value` | `string` | `""` | Id of the chosen model – unset or unknown shows the first |
| `thinking` | `thinking` | `boolean` | `false` | Extended thinking switch |
| `webSearch` | `web-search` | `boolean` | `false` | Web search switch |
| `effort` | `effort` | `ModelEffort` | `"medium"` | How hard the model thinks – only shown while extended thinking is on |
| `open` | `open` | `boolean` | `false` | Whether the menu is open |
| `align` | `align` | `"start" \| "end"` | `"start"` | Which edge of the trigger the menu lines up with |
| `side` | `side` | `"bottom" \| "top"` | `"bottom"` | Whether the menu opens below or above the trigger – above suits a composer at the bottom of the screen |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A model was picked (`{ value: string }`); cancelable – prevent it to keep `value` (controlled use) |
| `tc-thinking-change` | – | Yes | Extended thinking was switched (`{ thinking: boolean }`); cancelable |
| `tc-web-search-change` | – | Yes | Web search was switched (`{ webSearch: boolean }`); cancelable |
| `tc-effort-change` | – | Yes | The effort changed (`{ effort: ModelEffort }`); cancelable |
| `tc-open-change` | – | Yes | The menu opens or closes (`{ open: boolean }`); cancelable |

#### Design tokens it reads (97)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-avatar-font-weight`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-surface-control`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-model-picker :models="…">` | `<tc-model-picker [models]="…">` | `<tc-model-picker {models}>` |

*Also attributes: `value`, `thinking`, `web-search`, `effort`, `open`, `align`, `side` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-thinking-change` | Yes | `el.addEventListener("tc-thinking-change", (e) => …)` | `onThinkingChange={…}` | `@tc-thinking-change="…"` | `(tc-thinking-change)="…($event)"` | `el.addEventListener("tc-thinking-change", …)` |
| `tc-web-search-change` | Yes | `el.addEventListener("tc-web-search-change", (e) => …)` | `onWebSearchChange={…}` | `@tc-web-search-change="…"` | `(tc-web-search-change)="…($event)"` | `el.addEventListener("tc-web-search-change", …)` |
| `tc-effort-change` | Yes | `el.addEventListener("tc-effort-change", (e) => …)` | `onEffortChange={…}` | `@tc-effort-change="…"` | `(tc-effort-change)="…($event)"` | `el.addEventListener("tc-effort-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `value`, `thinking`, `webSearch`, `effort` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change`, `tc-thinking-change`, `tc-web-search-change`, `tc-effort-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-model-picker id="model-picker"></tc-model-picker>

<script type="module">
  import "@adamstavely/trenchcoat/model-picker";

  const el = document.querySelector("#model-picker");
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
import { ModelPicker } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ModelPicker>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledModelPicker({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ModelPicker {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/model-picker";
import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";

const props = defineProps<{ initial: TcModelPicker["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcModelPicker["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-model-picker :value="value" @tc-value-change="onValueChange"></tc-model-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ModelPicker } from "@adamstavely/trenchcoat/angular/model-picker";
import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";

@Component({
  selector: "app-controlled-model-picker",
  imports: [ModelPicker],
  template: `<tc-model-picker [value]="value()" (tc-value-change)="onValueChange($event)"></tc-model-picker>`,
})
export class ControlledModelPicker {
  readonly initial = input.required<TcModelPicker["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcModelPicker["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-picker";
  import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";

  let { initial }: { initial: TcModelPicker["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcModelPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcModelPicker["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-model-picker bind:this={el} {value}></tc-model-picker>
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
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-model-picker :value="value" @tc-value-change="value = $event.detail.value"></tc-model-picker>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-model-picker [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-model-picker>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-model-picker bind:this={el} {value}></tc-model-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-model-picker")` returns a `TcModelPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";`
- **React / Next.js:** Props: `import type { ModelPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ModelPicker>`. The element class, for refs: `import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcModelPicker["models"]` with `import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";`
- **Angular:** The directive types the template: `[models]` takes `TcModelPicker["models"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcModelPicker } from "@adamstavely/trenchcoat/model-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `models` | `PickerModel[]` | The models to choose from, in menu order; `icon` may be a React node |
| `value` | `string` | Id of the chosen model (controlled when defined) |
| `defaultValue` | `string` | The model chosen at first when uncontrolled – defaults to the first one |
| `onChange` | `(id: string) => void` | Called with the id of the model that was picked |
| `thinking` | `boolean` | Extended thinking switch |
| `defaultThinking` | `boolean` | Extended thinking at first when uncontrolled – off by default |
| `onThinkingChange` | `(on: boolean) => void` | Called when extended thinking is switched on or off |
| `webSearch` | `boolean` | Web search switch |
| `defaultWebSearch` | `boolean` | Web search at first when uncontrolled – off by default |
| `onWebSearchChange` | `(on: boolean) => void` | Called when web search is switched on or off |
| `effort` | `ModelEffort` | How hard the model thinks – only shown while extended thinking is on |
| `defaultEffort` | `ModelEffort` | Effort at first when uncontrolled – "medium" by default |
| `onEffortChange` | `(effort: ModelEffort) => void` | Called with the new effort level |
| `open` | `boolean` | Controlled open state of the menu |
| `defaultOpen` | `boolean` | Whether the menu starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | Called when the menu opens or closes |

*Renamed or hidden on the wrapper: `models`, `value`, `onChange`, `thinking`, `webSearch`, `effort`, `open`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger: opens the menu with focus on the list, or closes it. In the list: picks the active model and closes the menu |
| ↓ / ↑ | On the trigger: opens the menu. In the list: moves to the next or previous model, wrapping round |
| Home / End | In the list: first or last model |
| Tab | Moves from the list to the switches and the Effort control; leaving the menu closes it |
| ← / → or ↑ / ↓ | In Effort: picks the previous or next level |
| Escape | Closes the menu and returns focus to the trigger |

### Screen readers

The trigger names the choice (“Model: Atlas, extended thinking”) with `aria-haspopup="dialog"` and
`aria-expanded`. The menu is a `dialog` named “Model settings” holding a `listbox` named “Model”; the list keeps focus
and `aria-activedescendant` points at the active row. Each option's name adds what the bars and the cost line show
(“Atlas Balanced for everyday work. Speed 4, quality 4, cost 3 of 5, about 0.9s to the first token, $15 per million
tokens”), and the chosen one is `aria-selected`. Extended thinking and Web search are `switch`es; Effort is a
`radiogroup`. A status region confirms a pick: “Atlas selected”.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 38.6 KB | 9.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **46.1 KB** | **11.8 KB** |
| With Lit – the first component on a page | 67.2 KB | 18.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **5.0 ms** | the gallery demo's data, 147 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of models replaced |
| First on the page | 30 ms | default properties; includes adding its CSS to the document |
| 100 items | 22 ms | models: first render, 2,235 nodes; update 3.8 ms |
| 1,000 items | 115 ms | models: first render, 21,810 nodes; update 18 ms |

1,000 items of models: 115 ms. It renders every item, so a first render passes 50 ms (a long task) at about 440 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **21 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`, `requestAnimationFrame, cancelled` (internal/controllers – RollingController).
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`, `window resize`.
- Reads the clock: `performance.now()` (internal/controllers – RollingController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep model names short – they sit in the trigger next to the message.
- Write `description` as what the model is good for, in a few words: “Hardest problems, deep reasoning”.
- Rate strengths relative to the other models in the list, and leave all three out for a router.
- Give `latencyMs` without thinking; the menu multiplies it for the chosen effort.

## Do and don't

### Do

- Put the menu above the trigger (`side="top"`) when the composer sits at the bottom of the screen.
- Use `align="end"` when the trigger sits at the right edge of the toolbar.
- Give each model an `icon` so the trigger is recognisable at a glance.

### Don't

- Don't list more than about six models – the bars stop being comparable.
- Don't put unrelated settings in the menu; it holds the model, thinking and web search only.
- Don't leave strengths out of a real model – a row without bars reads “Varies”, which is meant for a router.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
