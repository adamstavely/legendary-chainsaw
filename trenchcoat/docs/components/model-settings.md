<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Model Settings

**AI configuration** · New

The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults

- **Element:** `<tc-model-settings>`
- **Size:** 17.3 KB gzip · 71.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/model-settings";` |
| React / Next.js | `import { ModelSettings } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/model-settings";` · tags starting with tc- are custom elements |
| Angular | `import { ModelSettings } from "@adamstavely/trenchcoat/angular/model-settings";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/model-settings";` |

## Example

The live example is in the gallery at `#/model-settings`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Sets how one model generates – temperature, top-p, output length, reasoning effort – for the model the app says is
in use. Only the parameters that model supports are shown, each with a plain line on what it does, so people don't
tune a setting the model ignores. A strip at the top shows every value against its range with the default and the
presets marked, presets set several values at once, and the component says when two settings fight each other or a
value is set that the model will drop. A read-back at the bottom lists what differs from the defaults, with Reset
all. It is a form control: with `name` it submits the supported values as JSON.

### When to use

- A settings page or playground where people tune generation for a configured model.
- Next to `instruction-editor` when people adjust a prompt and its sampling together.
- Anywhere a team needs to see at a glance which settings were moved from the defaults.

### When not to use

- Choosing which model to use – use [Model Picker](model-picker.md).
- Deciding which model each request goes to – use [Model Routing](model-routing.md).
- One option out of two to five, with nothing else around it – use [Segmented Control](segmented-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a sliders icon, the title and the model with its one-line description
2. **Signature** `.ui-mset__profile` – with `signature` set: each value on its range, the default as a tick, presets as letters
3. **Presets** `.ui-mset__presets` – Precise, Balanced, Creative, or Custom once a value moves
4. **Parameter** `.ui-mset__param` – the label, its value, what it does and the control, with Reset when changed
5. **Feedback** `.ui-mset__issues` – conflicting settings and values the model ignores
6. **Changes** `.ui-mset__summary` – what differs from the defaults, with Reset all

## Looks

Standard is a white card on a gray tray: the signature sits in a gray well, values are in filled chips, the slider
fill and the picked preset letter are ink. Clean is one white card with hairline dividers: the signature has a
hairline frame, values are plain text, the slider fill and the picked preset are the accent, and the read-back of
changes is accent-tinted. In a narrow container the signature puts each name above its track.

## Usage

### HTML

```html
<tc-model-settings id="settings" name="generation"></tc-model-settings>

<script type="module">
  import "@adamstavely/trenchcoat/model-settings";
  import "@adamstavely/trenchcoat/tokens.css";

  const settings = document.querySelector("#settings");
  settings.heading = "Reply drafts";
  settings.model = { id: "atlas-2", label: "Atlas 2", description: "General model", supports: ["temperature", "topP", "maxOutputTokens"] };
  settings.value = { temperature: 0.4 };
  settings.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.changed));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ModelSettings, type ModelSettingsModel, type ModelSettingsValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const model: ModelSettingsModel = { id: "atlas-2", label: "Atlas 2", supports: ["temperature", "topP", "maxOutputTokens"] };

export function DraftSettings() {
  const [value, setValue] = useState<ModelSettingsValue>({ temperature: 0.4 });
  return <ModelSettings title="Reply drafts" model={model} value={value} onChange={(next) => setValue(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/model-settings";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";

defineProps<{ model: TcModelSettings["model"]; value: TcModelSettings["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-model-settings :model="model" :value="value" @tc-value-change="onValueChange"></tc-model-settings>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ModelSettings } from "@adamstavely/trenchcoat/angular/model-settings";
import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";

@Component({
  selector: "app-model-settings-example",
  imports: [ModelSettings],
  template: `<tc-model-settings [model]="model()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-model-settings>`,
})
export class ModelSettingsExample {
  readonly model = input.required<TcModelSettings["model"]>();
  readonly value = input.required<TcModelSettings["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-settings";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";

  let { model, value }: { model: TcModelSettings["model"]; value: TcModelSettings["value"] } = $props();
  let el: TcModelSettings;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-model-settings bind:this={el} {model} {value}></tc-model-settings>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Model settings"` | The heading, and the group's name |
| `model` | – | `ModelSettingsModel \| undefined` | `undefined` | The model the settings are for; unset shows every parameter |
| `value` | – | `ModelSettingsValue` | `{}` | The values the person set, by parameter id; missing ones are the defaults. Changed by the user unless tc-value-change is prevented |
| `parameters` | – | `ModelParam[]` | `[ { id: "temperature", label: "Temperature", kind: "range", min: 0, max: 2, step: 0.1, default: 1, ends: ["Focused", "Varied"], description: "How much the wording varies between answers. Lower sticks to the likeliest words; higher tries less likely ones.", }, { id: "topP", label: "Top-p", kind: "range", min: 0, max: 1, step: 0.05, default: 1, description: "Which words are in the running: only the likeliest ones that add up to this share. Lower is more predictable.", }, { id: "maxOutputTokens", label: "Output length", kind: "range", min: 256, max: 16384, step: 256, default: 4096, unit: "tokens", description: "The longest an answer can be. An answer that reaches it stops mid-sentence.", }, { id: "reasoningEffort", label: "Reasoning effort", kind: "choice", default: "medium", options: [ { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, ], description: "How much work the model does before it answers. More is slower and costs more. Only the answer comes back – its working isn't shown or kept.", }, ]` | Every parameter the app knows; only those the model supports are shown |
| `presets` | – | `ModelSettingsPreset[]` | `[ { id: "precise", label: "Precise", description: "Nearly the same answer every time – for extraction, classification and facts", values: { temperature: 0.2, reasoningEffort: "high" } }, { id: "balanced", label: "Balanced", description: "Natural wording with few surprises – a good default for conversation", values: { temperature: 0.7, reasoningEffort: "medium" } }, { id: "creative", label: "Creative", description: "More varied wording and ideas – for drafts and brainstorming", values: { temperature: 1.2, reasoningEffort: "low" } }, ]` | Named sets of values; a preset is picked when the shown values match it |
| `conflicts` | – | `ModelSettingsConflict[]` | `[ { params: ["temperature", "topP"], message: "Temperature and top-p both change how varied answers are. Move one and leave the other at its default." }, ]` | Parameters that shouldn't all move from their defaults at once, with what to say when they do |
| `name` | `name` | `string` | `""` | Submitted with the form: the supported values as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the settings out of the form; a disabled fieldset does the same |
| `signature` | `signature` | `boolean` | `false` | Shows the signature above the controls: every value on its range with the default and presets marked. Off by default – the controls already show each value, so it's for pages that want the at-a-glance picture too |
| `supported` | – | `ModelParam[]` | – | The parameters the model supports, in the order `parameters` lists them |
| `resolved` | – | `ModelSettingsValue` | – | Every supported value, the defaults filled in |
| `changes` | – | `ModelParam[]` | – | The supported parameters whose value differs from the default |
| `preset` | – | `string \| null` | – | The preset the shown values match, or null for custom values |
| `issues` | – | `ModelSettingsIssue[]` | – | What to fix: conflicting changes, then values the model ignores |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A value changed ({ value: ModelSettingsValue, changed: string[] }); cancelable – prevent it to control `value` |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `defaultOf(p: ModelParam)` | `ModelParamValue` | A parameter's default for this model |

#### Design tokens it reads (85)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-switch-knob-bg`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `formatModelParam(p: ModelParam, v: ModelParamValue \| undefined): string` | A parameter's value as text: "0.7", "4,096 tokens", "High" |

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
| `model` | `el.model = …;` | `<… model={…} />` | `<tc-model-settings :model="…">` | `<tc-model-settings [model]="…">` | `<tc-model-settings {model}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-model-settings :value="…">` | `<tc-model-settings [value]="…">` | `<tc-model-settings {value}>` |
| `parameters` | `el.parameters = …;` | `<… parameters={…} />` | `<tc-model-settings :parameters="…">` | `<tc-model-settings [parameters]="…">` | `<tc-model-settings {parameters}>` |
| `presets` | `el.presets = …;` | `<… presets={…} />` | `<tc-model-settings :presets="…">` | `<tc-model-settings [presets]="…">` | `<tc-model-settings {presets}>` |
| `conflicts` | `el.conflicts = …;` | `<… conflicts={…} />` | `<tc-model-settings :conflicts="…">` | `<tc-model-settings [conflicts]="…">` | `<tc-model-settings {conflicts}>` |

*Also attributes: `heading`, `name`, `disabled`, `signature` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-model-settings id="model-settings"></tc-model-settings>

<script type="module">
  import "@adamstavely/trenchcoat/model-settings";

  const el = document.querySelector("#model-settings");
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
import { ModelSettings } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ModelSettings>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledModelSettings({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ModelSettings {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/model-settings";
import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";

const props = defineProps<{ initial: TcModelSettings["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcModelSettings["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-model-settings :value="value" @tc-value-change="onValueChange"></tc-model-settings>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ModelSettings } from "@adamstavely/trenchcoat/angular/model-settings";
import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";

@Component({
  selector: "app-controlled-model-settings",
  imports: [ModelSettings],
  template: `<tc-model-settings [value]="value()" (tc-value-change)="onValueChange($event)"></tc-model-settings>`,
})
export class ControlledModelSettings {
  readonly initial = input.required<TcModelSettings["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcModelSettings["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-settings";
  import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";

  let { initial }: { initial: TcModelSettings["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcModelSettings;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcModelSettings["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-model-settings bind:this={el} {value}></tc-model-settings>
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
<tc-model-settings :value="value" @tc-value-change="value = $event.detail.value"></tc-model-settings>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-model-settings [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-model-settings>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-model-settings bind:this={el} {value}></tc-model-settings>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-model-settings")` returns a `TcModelSettings` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";`
- **React / Next.js:** Props: `import type { ModelSettingsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ModelSettings>`. The element class, for refs: `import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcModelSettings["model"]` with `import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";`
- **Angular:** The directive types the template: `[model]` takes `TcModelSettings["model"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcModelSettings } from "@adamstavely/trenchcoat/model-settings";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group |
| `value` | `ModelSettingsValue` | The values the person set, by parameter id (controlled); missing ones are the model's defaults |
| `defaultValue` | `ModelSettingsValue` | The values to start with when uncontrolled |
| `onChange` | `(value: ModelSettingsValue, changed: string[]) => void` | Called with the next values and the ids that changed |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Slider pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the presets, each parameter's control and Reset, Clear on an ignored value, and Reset all |
| ← / → / ↑ / ↓ | On a slider: the value down or up by one step; on the presets or a choice: the previous or next option |
| Page Up / Page Down | On a slider: a larger step, as the browser sets it |
| Home / End | On a slider: the minimum or maximum; on the presets or a choice: the first or last option |
| Space / Enter | On a Reset, Clear or Reset all button: does it |

The sliders are native range inputs, so their keys are the browser's own.

### Screen readers

The host is a group named by the heading. Each slider is named by its label, described by its line, and reads its
value with its unit through `aria-valuetext` (“4,096 tokens”). The presets and each choice are radiogroups named by
their label. A Reset button is named for what it does – “Reset temperature to 1.0”. The signature strip is hidden
from assistive tech: the controls say the same in words. A status region announces presets applied and resets –
“Precise preset applied”, “Temperature reset to 1.0”, “Every setting is back to its default” – but not every slider
step.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.2 KB | 9.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **71.3 KB** | **17.4 KB** |
| With Lit – the first component on a page | 94.4 KB | 25.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 101 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of parameters replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.6 ms | parameters: first render, 101 nodes; update 0.2 ms |
| 1,000 items | 2.7 ms | parameters: first render, 101 nodes; update 0.3 ms |

What it renders doesn't grow with parameters (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Describe each parameter by its effect on the answer, not its maths: “How much the wording varies between answers”.
- Give the model a one-line `description` that says what kind of model it is – “Reasoning model · works a problem
  through before it answers”.
- Write `ignores` reasons for the app's real behaviour: “Reasoning models choose their own sampling.”
- Keep preset descriptions to what they're for: “for extraction, classification and facts”.

## Do and don't

### Do

- Pass the model's real `supports` list and its own `defaults`, so people see what the provider accepts.
- Add your own `conflicts` for pairs your provider warns about.
- Store only `value` – the settings people changed – and let the defaults fill the rest when you call the model.

### Don't

- Don't offer the model's reasoning or chain of thought as something to configure, show or export – reasoning effort
  sets how much work it does, nothing more.
- Don't show parameters the model ignores to keep a layout tidy; leave them out and let the component say they're
  unavailable.
- Don't add more than three or four presets; they share one row.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Model Routing](model-routing.md) – Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken
- [Instruction Editor](instruction-editor.md) – System and developer instructions with variable chips, missing and unused warnings, an app-supplied token count, versions and a word diff
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- **`tc-model-settings`:** the signature panel above the controls is now opt-in with `signature`. It drew every parameter a second time, so the card read as having two of each setting.
