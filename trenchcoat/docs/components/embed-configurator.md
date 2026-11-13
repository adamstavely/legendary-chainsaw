<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Embed Configurator

**AI configuration** · New

Style a site's chat widget beside a live preview – title, greeting, up to four starter prompts to add, move and remove, an accent with its contrast in words, the corner, the radius, the launcher's words and the domains it may load on, with the install snippet to copy

- **Element:** `<tc-embed-configurator>`
- **Size:** 51.0 KB gzip · 200.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/embed-configurator";` |
| React / Next.js | `import { EmbedConfigurator } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/embed-configurator";` · tags starting with tc- are custom elements |
| Angular | `import { EmbedConfigurator } from "@adamstavely/trenchcoat/angular/embed-configurator";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/embed-configurator";` |

## Example

The live example is in the gallery at `#/embed-configurator`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Style the chat widget a site embeds, beside a live preview of it. The settings are on the left: the title, the
greeting, up to four starter prompts, the accent colour, the corner it sits in, the corner radius, the launcher's
words and the domains it may load on. On the right, the widget itself (`embed-widget`), open, shows each change as
it's made – and answers a test message to say it's a preview. Under both is the install snippet: a script tag whose
data attributes carry the settings, ready to copy.

The accent is checked as you pick it, in words: whether text on it is readable (the widget puts dark or white text on
it, whichever reads better) and whether the launcher stands out on a white page. Domains are checked as host names –
`help.example.org`, `*.example.org` or `localhost`.

### When to use

- The settings page where a team sets up the chat widget for its website.
- Letting people see the widget with their brand before they install it.

### When not to use

- The widget on the site itself – use [Embed Widget](embed-widget.md).
- The settings of an agent's behaviour (its instructions, tools or model) – use [Instruction Editor](instruction-editor.md),
  [Tool Permissions](tool-permissions.md) or [Model Settings](model-settings.md).
- Picking a colour alone – use [Color Picker](color-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading and a line under it
2. **Settings** `.ui-emc__settings` – labelled rows `.ui-emc__row`, a label `.ui-emc__label` beside each control
3. **Starter prompts** `.ui-emc__starters` – a field per prompt `.ui-emc__starter` with Move up, Move down and Remove, and Add a prompt `.ui-emc__add`
4. **Accent** `.ui-emc__accent` – the swatch, its hex and Change, which opens the colour picker `.ui-emc__picker`
5. **Contrast** `.ui-emc__checks` – what the colour means for text and for the launcher, with a mark and words
6. **Radius** `.ui-emc__range` – a slider with the value in px
7. **Preview** `.ui-emc__preview` – the open widget on a sunken stage `.ui-emc__stage`
8. **Install snippet** `.ui-emc__snippet` – the script tag in a code block with Copy

## Looks

Standard puts the header on a gray tray above one white card that holds the settings, the preview and the snippet;
Clean is one white card with the header as its first row. The preview sits on a sunken surface in both, so the widget
reads as something placed on a page. Below 760px the preview goes under the settings, and below 480px the labels go
above their fields. `--tc-emc-label-w` sets the label column (132px).

## Usage

### HTML

```html
<tc-embed-configurator id="widget" heading="Help widget" widget-id="inst-help"></tc-embed-configurator>

<script type="module">
  import "@adamstavely/trenchcoat/embed-configurator";
  import "@adamstavely/trenchcoat/tokens.css";

  const widget = document.querySelector("#widget");
  widget.value = {
    title: "Ask the Institute",
    greeting: "Hi! I can help with visits, data requests and publications.",
    starters: ["When is the reading room open?", "How do I request a dataset?"],
    accent: "#0f766e",
    position: "right",
    radius: 16,
    launcherLabel: "Chat with us",
    domains: ["institute.example.org"],
  };
  widget.addEventListener("tc-value-change", (e) => console.log(e.detail.field, e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EmbedConfigurator, defaultEmbedConfig, type EmbedConfig } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function WidgetSettings({ save }: { save: (value: EmbedConfig) => void }) {
  const [value, setValue] = useState<EmbedConfig>({ ...defaultEmbedConfig, title: "Ask the Institute", accent: "#0f766e" });
  return (
    <EmbedConfigurator
      title="Help widget"
      widgetId="inst-help"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        save(next);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/embed-configurator";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";

defineProps<{ value: TcEmbedConfigurator["value"]; swatches: TcEmbedConfigurator["swatches"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-embed-configurator :value="value" :swatches="swatches" @tc-value-change="onValueChange"></tc-embed-configurator>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EmbedConfigurator } from "@adamstavely/trenchcoat/angular/embed-configurator";
import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";

@Component({
  selector: "app-embed-configurator-example",
  imports: [EmbedConfigurator],
  template: `<tc-embed-configurator [value]="value()" [swatches]="swatches()" (tc-value-change)="onValueChange($event)"></tc-embed-configurator>`,
})
export class EmbedConfiguratorExample {
  readonly value = input.required<TcEmbedConfigurator["value"]>();
  readonly swatches = input.required<TcEmbedConfigurator["swatches"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/embed-configurator";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";

  let { value, swatches }: { value: TcEmbedConfigurator["value"]; swatches: TcEmbedConfigurator["swatches"] } = $props();
  let el: TcEmbedConfigurator;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-embed-configurator bind:this={el} {value} {swatches}></tc-embed-configurator>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Site widget"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `value` | – | `EmbedConfig` | `{ title: "Assistant", greeting: "Hi! How can I help?", starters: [], accent: "#2563eb", position: "right", radius: 16, launcherLabel: "Chat with us", domains: [], }` | The settings |
| `scriptSrc` | `script-src` | `string` | `"https://cdn.example.org/assistant/embed.js"` | The widget's script, for the snippet |
| `widgetId` | `widget-id` | `string` | `"my-widget"` | The widget's id, for the snippet |
| `swatches` | – | `string[]` | `["#2563eb", "#0f766e", "#7c3aed", "#c2410c", "#be123c", "#18181b"]` | Colours offered under the colour picker |
| `labels` | – | `Partial<EmbedConfiguratorLabels>` | `{}` | The configurator's words, merged over defaultEmbedConfiguratorLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A setting changed ({ value, field }: EmbedConfigChange); cancelable – prevented, `value` stays as it was |
| `tc-copy` | – | No | The snippet was copied ({ text }), from its code block |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-emc-label-w` | `132px` | both |
| `--tc-emc-swatch` | `var(--tc-accent)` | both |

#### Design tokens it reads (59)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `checkEmbedDomain(text: string): string \| undefined` | Why a domain can't be used, or nothing when it can: a host name such as help.example.org, *.example.org or localhost |
| `embedSnippet(value: EmbedConfig, { scriptSrc, widgetId }: { scriptSrc: string; widgetId: string }): void` | The install snippet for a configuration |
| `describeEmbedAccent(accent: string): void` | What the accent's contrast means, in words – for the text on it and the launcher on a white page |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-embed-configurator :value="…">` | `<tc-embed-configurator [value]="…">` | `<tc-embed-configurator {value}>` |
| `swatches` | `el.swatches = …;` | `<… swatches={…} />` | `<tc-embed-configurator :swatches="…">` | `<tc-embed-configurator [swatches]="…">` | `<tc-embed-configurator {swatches}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-embed-configurator :labels="…">` | `<tc-embed-configurator [labels]="…">` | `<tc-embed-configurator {labels}>` |

*Also attributes: `heading`, `description`, `script-src`, `widget-id` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopySnippet={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-embed-configurator id="embed-configurator"></tc-embed-configurator>

<script type="module">
  import "@adamstavely/trenchcoat/embed-configurator";

  const el = document.querySelector("#embed-configurator");
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
import "@adamstavely/trenchcoat/embed-configurator";
import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";

const props = defineProps<{ initial: TcEmbedConfigurator["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcEmbedConfigurator["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-embed-configurator :value="value" @tc-value-change="onValueChange"></tc-embed-configurator>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EmbedConfigurator } from "@adamstavely/trenchcoat/angular/embed-configurator";
import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";

@Component({
  selector: "app-controlled-embed-configurator",
  imports: [EmbedConfigurator],
  template: `<tc-embed-configurator [value]="value()" (tc-value-change)="onValueChange($event)"></tc-embed-configurator>`,
})
export class ControlledEmbedConfigurator {
  readonly initial = input.required<TcEmbedConfigurator["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcEmbedConfigurator["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/embed-configurator";
  import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";

  let { initial }: { initial: TcEmbedConfigurator["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcEmbedConfigurator;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcEmbedConfigurator["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-embed-configurator bind:this={el} {value}></tc-embed-configurator>
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
<tc-embed-configurator :value="value" @tc-value-change="value = $event.detail.value"></tc-embed-configurator>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-embed-configurator [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-embed-configurator>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-embed-configurator bind:this={el} {value}></tc-embed-configurator>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-embed-configurator")` returns a `TcEmbedConfigurator` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";`
- **React / Next.js:** Props: `import type { EmbedConfiguratorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EmbedConfigurator>`. The element class, for refs: `import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEmbedConfigurator["value"]` with `import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";`
- **Angular:** The directive types the template: `[value]` takes `TcEmbedConfigurator["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEmbedConfigurator } from "@adamstavely/trenchcoat/embed-configurator";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Site widget" |
| `value` | `EmbedConfig` | The settings – controlled when given |
| `defaultValue` | `EmbedConfig` | The settings on mount when `value` isn't controlled |
| `onValueChange` | `(value: EmbedConfig, field: EmbedConfigField) => void` | A setting changed: the whole next value, and which one |
| `onCopySnippet` | `(text: string) => void` | The install snippet was copied |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the settings, the preview and the snippet's Copy |
| Enter / Space on Move up / Move down | Moves the prompt; focus stays with it |
| Enter / Space on Change | Opens or closes the colour picker under the swatch |
| ← / → on the corner | Picks Right or Left |
| ← / → on the radius | Changes it by 1px |
| Enter or , in the domains | Adds the domain, or says why it can't be added |

### Screen readers

Each setting is a labelled field. The starter prompts are a group named "Starter prompts", and each prompt's field
and buttons say which prompt they belong to ("Move up, Prompt 2"); moving one is announced ("Moved to 1 of 3"). Change
has `aria-expanded` and controls the picker. The contrast lines are text, with their marks hidden. The radius slider
reads its value in px. The preview is the widget, with its own dialog and log, under a "Preview" heading.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | tag-input | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, code-block, inline-diff, color-picker, tag-input | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, code-block, internal/kit, inline-diff, color-picker, segmented-control, embed-widget, tag-input | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | color-picker | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, color-picker, segmented-control, embed-widget, tag-input, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block, color-picker | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff, segmented-control | – |
| conic-gradient() | 69 (Edge 79) | 83 | 12.1 | 12.1 | color-picker | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself, embed-widget | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, color-picker, embed-widget, tag-input, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | code-block, segmented-control, embed-widget | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.8 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 22.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| [color-picker](color-picker.md) · Element it renders | 26.3 KB | – |
| [embed-widget](embed-widget.md) · Element it renders | 18.8 KB | – |
| [tag-input](tag-input.md) · Element it renders | 17.1 KB | – |
| **Added to a page that already has Lit** | **200.0 KB** | **51.0 KB** |
| With Lit – the first component on a page | 222.3 KB | 58.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.2 ms** | the gallery demo's data, 274 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of swatches replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.1 ms | swatches: first render, 274 nodes; update 0.2 ms |
| 1,000 items | 3.1 ms | swatches: first render, 274 nodes; update 0.1 ms |

What it renders doesn't grow with swatches (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (code-block), `setTimeout` (inline-diff), `setTimeout` (color-picker), `setTimeout` (segmented-control).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff), `ResizeObserver` (segmented-control).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep the title short – it's the widget's header on a phone too.
- Starter prompts read best as questions a visitor would ask, three or four at most.
- Add every domain the widget may load on, including staging sites while you test.

## Do and don't

### Do

- Fix the accent when the contrast line warns – visitors read their own messages on it.
- Copy the snippet after the last change; it's rebuilt from the settings each time.
- Control `value` and save it, so the settings survive a reload.

### Don't

- Don't paste URLs into the domains – just the host, such as `help.example.org`.
- Don't use the preview to test real answers; it only says it's a preview.

## Related

- [Embed Widget](embed-widget.md) – The chat a visitor opens on a website – a corner launcher with an unread count, and a panel with the agent's name and reply time, a greeting, starter questions, the conversation with a person taking over, a message field and a privacy line, styled by the site's accent, radius and side
- [Color Picker](color-picker.md) – Pick a colour – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields that convert as you type, an eyedropper where the browser has one, swatches, Copy, and the previous colour one press away
- [Tag Input](tag-input.md) – A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
