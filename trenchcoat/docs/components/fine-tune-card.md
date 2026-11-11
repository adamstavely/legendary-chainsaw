<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Fine-tune Card

**Workspace & sessions** · New

An inspector where an agent tunes a design and the person takes over – numbers you drag or type, a percentage, a choice and swatches over a live preview, the agent's changes counted in and marked, and a revert

- **Element:** `<tc-fine-tune-card>`
- **Size:** 9.3 KB gzip · 29.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/fine-tune-card";` |
| React / Next.js | `import { FineTuneCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/fine-tune-card";` · tags starting with tc- are custom elements |
| Angular | `import { FineTuneCard } from "@adamstavely/trenchcoat/angular/fine-tune-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/fine-tune-card";` |

## Example

The live example is in the gallery at `#/fine-tune-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An inspector where an agent tunes a design and the person can take over. Sections hold fields – numbers with a unit
such as width, height and radius, a percentage for opacity, a choice of text style and a row of colour swatches – under
a small preview that follows the size, corners, opacity and fill. Adjust asks the agent to tune. When it changes a
field, the number counts to its new value with a brief highlight, and an Agent marker stays on the field until the
person edits it. Revert agent changes puts back everything the agent changed.

### When to use

- An assistant adjusting a card, a chart or a layout, where people should see what it touched and be able to undo it.
- A design tool's properties panel where an agent and a person share the controls.

### When not to use

- Inspecting a real page's elements and styles – use [Element Inspector](element-inspector.md).
- Settings for a model or an agent itself – use [Model Settings](model-settings.md).
- One colour with a full picker – use [Color Picker](color-picker.md); one number on its own – use [Number Field](number-field.md).
- An agent suggesting a change people accept or dismiss before anything moves – use [Smart Recommendation](smart-recommendation.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Adjust** `.ui-ftc__adjust` – asks the agent to tune, in the header
2. **Preview** `.ui-ftc__preview` – the design drawn small, `.ui-ftc__shape`
3. **Section** `.ui-ftc__section` – a titled group of fields
4. **Field** `.ui-ftc__field` – one property
5. **Scrub handle** `.ui-ftc__scrub` – a number's label; drag it or use the arrows
6. **Value** `.ui-ftc__input` – the number, typed, with its `.ui-ftc__unit`
7. **Choice** `.ui-ftc__select` – a short list of options
8. **Swatches** `.ui-ftc__swatches` – the colours, `.ui-ftc__swatch`
9. **Agent marker** `.ui-ftc__agent` – on each field the agent set
10. **Revert** `.ui-ftc__revert` – puts back the agent's changes, with a count

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The fields sit on sunken wells two to a row, and one to a row when the card is narrow. The agent's changes flash an
accent ring and carry an accent Agent pill with a spark – a word, not just a colour.

## Usage

### HTML

```html
<tc-fine-tune-card id="tune" heading="Findings summary"></tc-fine-tune-card>

<script type="module">
  import "@adamstavely/trenchcoat/fine-tune-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#tune");
  el.sections = [{ label: "Layout", fields: [
    { id: "w", label: "W", name: "Width", kind: "number", unit: "px", min: 120, max: 640 },
    { id: "opacity", label: "O", name: "Opacity", kind: "percent" },
  ] }];
  el.values = { w: 320, opacity: 100 };
  el.addEventListener("tc-adjust-request", () => {
    el.adjusting = true;
    // When your agent answers:
    setTimeout(() => {
      el.adjusting = false;
      el.agentChanges = [{ field: "w", to: 360 }];
    }, 800);
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FineTuneCard, type FineTuneAgentChange, type FineTuneValues } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Tune({ agent }: { agent: FineTuneAgentChange[] }) {
  const [values, setValues] = useState<FineTuneValues>({ w: 320, opacity: 100 });
  return (
    <FineTuneCard
      title="Findings summary"
      sections={[{ label: "Layout", fields: [{ id: "w", label: "W", name: "Width", kind: "number", unit: "px" }, { id: "opacity", label: "O", name: "Opacity", kind: "percent" }] }]}
      values={values}
      agentChanges={agent}
      onValuesChange={setValues}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/fine-tune-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";

defineProps<{ sections: TcFineTuneCard["sections"]; values: TcFineTuneCard["values"] }>();
const onValuesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-fine-tune-card :sections="sections" :values="values" @tc-values-change="onValuesChange"></tc-fine-tune-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FineTuneCard } from "@adamstavely/trenchcoat/angular/fine-tune-card";
import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";

@Component({
  selector: "app-fine-tune-card-example",
  imports: [FineTuneCard],
  template: `<tc-fine-tune-card [sections]="sections()" [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-fine-tune-card>`,
})
export class FineTuneCardExample {
  readonly sections = input.required<TcFineTuneCard["sections"]>();
  readonly values = input.required<TcFineTuneCard["values"]>();
  onValuesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fine-tune-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";

  let { sections, values }: { sections: TcFineTuneCard["sections"]; values: TcFineTuneCard["values"] } = $props();
  let el: TcFineTuneCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-fine-tune-card bind:this={el} {sections} {values}></tc-fine-tune-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Fine-tune"` | What's being tuned, such as "Findings summary"; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `sections` | – | `FineTuneSection[]` | `[]` | The fields, in sections |
| `values` | – | `FineTuneValues` | `{}` | Each field's value by its id. Changed by the fields unless a tc-values-change listener calls preventDefault() |
| `agentChanges` | – | `FineTuneAgentChange[]` | `[]` | Changes the agent made; each new list is applied, counted in and marked |
| `adjusting` | `adjusting` | `boolean` | `false` | The agent is working: Adjust says so and waits |
| `preview` | – | `FineTunePreview` | `{ width: "w", height: "h", radius: "radius", opacity: "opacity", fill: "fill", type: "type" }` | Which fields the preview follows, by id; an empty object hides the preview |
| `labels` | – | `Partial<FineTuneLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-values-change` | – | Yes | A field changed, by the person, the agent or a revert ({ values, field, source }: FineTuneValuesChange); cancelable – prevented, `values` stays as it was |
| `tc-adjust-request` | – | No | Adjust was pressed: the page should ask its agent to tune ({ heading }: FineTuneAdjustRequest) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `applyAgentChange(field: string, to: number \| string)` | `void` | Applies one change from the agent: it counts in, flashes and is marked until the person edits the field |
| `applyAgentChanges(changes: FineTuneAgentChange[])` | `void` | Applies several of the agent's changes as one change to `values` |
| `revertAgentChanges()` | `void` | Puts back every value the agent changed |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ftc-fill` | `var(--tc-surface-raised)` | not set – this fallback applies |

#### Design tokens it reads (54)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg-sunken`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-ftc-swatch`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-h`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultFineTuneLabels: FineTuneLabels` | The words used when the page gives none |

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
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-fine-tune-card :sections="…">` | `<tc-fine-tune-card [sections]="…">` | `<tc-fine-tune-card {sections}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-fine-tune-card :values="…">` | `<tc-fine-tune-card [values]="…">` | `<tc-fine-tune-card {values}>` |
| `agentChanges` | `el.agentChanges = …;` | `<… agentChanges={…} />` | `<tc-fine-tune-card :agentChanges="…">` | `<tc-fine-tune-card [agentChanges]="…">` | `<tc-fine-tune-card {agentChanges}>` |
| `preview` | `el.preview = …;` | `<… preview={…} />` | `<tc-fine-tune-card :preview="…">` | `<tc-fine-tune-card [preview]="…">` | `<tc-fine-tune-card {preview}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-fine-tune-card :labels="…">` | `<tc-fine-tune-card [labels]="…">` | `<tc-fine-tune-card {labels}>` |

*Also attributes: `heading`, `description`, `adjusting` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-values-change` | Yes | `el.addEventListener("tc-values-change", (e) => …)` | `onValuesChange={…}` | `@tc-values-change="…"` | `(tc-values-change)="…($event)"` | `el.addEventListener("tc-values-change", …)` |
| `tc-adjust-request` | No | `el.addEventListener("tc-adjust-request", (e) => …)` | `onAdjustRequest={…}` | `@tc-adjust-request="…"` | `(tc-adjust-request)="…($event)"` | `el.addEventListener("tc-adjust-request", …)` |

### Controlled

The element changes `values` itself unless a listener calls `preventDefault()` on `tc-values-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-fine-tune-card id="fine-tune-card"></tc-fine-tune-card>

<script type="module">
  import "@adamstavely/trenchcoat/fine-tune-card";

  const el = document.querySelector("#fine-tune-card");
  el.addEventListener("tc-values-change", (e) => {
    e.preventDefault(); // the element keeps its values…
    if (allowed(e.detail.values)) el.values = e.detail.values; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { FineTuneCard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof FineTuneCard>;
type Props = Omit<Own, "values" | "onValuesChange"> & { initial: NonNullable<Own["values"]> };

// Controlled: passing values makes the wrapper prevent the element's own change; the app sets it
export function ControlledFineTuneCard({ initial, ...props }: Props) {
  const [values, setValues] = useState<Own["values"]>(initial);
  return <FineTuneCard {...props} values={values} onValuesChange={(next) => setValues(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/fine-tune-card";
import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";

const props = defineProps<{ initial: TcFineTuneCard["values"] }>();
const values = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValuesChange = (e: CustomEvent<{ values: TcFineTuneCard["values"] }>) => {
  e.preventDefault();
  values.value = e.detail.values;
};
</script>

<template>
  <tc-fine-tune-card :values="values" @tc-values-change="onValuesChange"></tc-fine-tune-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FineTuneCard } from "@adamstavely/trenchcoat/angular/fine-tune-card";
import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";

@Component({
  selector: "app-controlled-fine-tune-card",
  imports: [FineTuneCard],
  template: `<tc-fine-tune-card [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-fine-tune-card>`,
})
export class ControlledFineTuneCard {
  readonly initial = input.required<TcFineTuneCard["values"]>();
  readonly values = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValuesChange(e: CustomEvent<{ values: TcFineTuneCard["values"] }>) {
    e.preventDefault();
    this.values.set(e.detail.values);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fine-tune-card";
  import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";

  let { initial }: { initial: TcFineTuneCard["values"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let values = $derived(initial);
  let el: TcFineTuneCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      values = (e as CustomEvent<{ values: TcFineTuneCard["values"] }>).detail.values;
    };
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-fine-tune-card bind:this={el} {values}></tc-fine-tune-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-fine-tune-card")` returns a `TcFineTuneCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";`
- **React / Next.js:** Props: `import type { FineTuneCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FineTuneCard>`. The element class, for refs: `import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFineTuneCard["sections"]` with `import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";`
- **Angular:** The directive types the template: `[sections]` takes `TcFineTuneCard["sections"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFineTuneCard } from "@adamstavely/trenchcoat/fine-tune-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | What's being tuned; an empty one draws no header |
| `values` | `FineTuneValues` | Each field's value by id – controlled when given |
| `defaultValues` | `FineTuneValues` | The values to start with when uncontrolled |
| `onValuesChange` | `(values: FineTuneValues, change: FineTuneValuesChange) => void` | A field changed – by the person, the agent or a revert |
| `onAdjustRequest` | `() => void` | Adjust was pressed: ask your agent to tune |

*Renamed or hidden on the wrapper: `heading`, `values`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | On a scrub handle: step the number; Shift steps ×10 |
| Home / End | On a scrub handle: go to the minimum or maximum |
| ↑ / ↓ | In a number's box: step it; Shift steps ×10 |
| Enter | In a number's box: commit what was typed |
| Escape | In a number's box: put back the current value |
| ← / → / ↑ / ↓ | In the swatches: move to the next colour and choose it |
| Enter / Space | Press Adjust or Revert agent changes |

### Screen readers

Each number has a slider (its scrub handle) and a text box, both named with the field's full `name` (“Width”, “Width
(px)”), and the slider reads its value with the unit. The text style is a labelled select, and the swatches are a radio
group named by their field, each swatch named by its colour. The sections are fieldsets with their titles as legends.
The preview repeats what the fields say, so it's hidden. While `adjusting` is set, a hidden status line says so.

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.6 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.0 KB** | **9.3 KB** |
| With Lit – the first component on a page | 49.8 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.3 ms** | the gallery demo's data, 75 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of agentChanges replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | agentChanges: first render, 75 nodes; update 0.4 ms |
| 1,000 items | 4.0 ms | agentChanges: first render, 75 nodes; update 1.1 ms |

What it renders doesn't grow with agentChanges (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each field a short `label` (W, H, R) and a full `name` (Width, Height, Radius).
- Name swatches for what they mean – “Blue tint” – not their hex codes.
- Keep sections to a handful of fields each; split a long list into more sections.

## Do and don't

### Do

- Set `adjusting` while the agent works, and pass its changes as `agentChanges` when it's done.
- Listen to `tc-values-change` and read `source` to tell the person's changes from the agent's.
- Keep `min` and `max` on numbers so scrubbing can't go anywhere silly.

### Don't

- Don't apply the agent's changes by setting `values` directly – they won't be marked or revertible.
- Don't remove the Agent markers yourself; they go when the person edits the field or reverts.
- Don't use it for settings that take effect somewhere people can't see – the preview is the point.

## Related

- [Element Inspector](element-inspector.md) – A page's elements as a tree written like the markup, beside the chosen element's box model and styles; hovering an element fires an event so the page can outline it in a preview.
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
- [Color Picker](color-picker.md) – Pick a colour – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields that convert as you type, an eyedropper where the browser has one, swatches, Copy, and the previous colour one press away
- [Number Field](number-field.md) – A bounded numeric input with native validation
- [Smart Recommendation](smart-recommendation.md) – Suggestion card with a confidence signal, alternatives to switch to and accept with undo
