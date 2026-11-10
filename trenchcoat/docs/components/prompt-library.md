<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Prompt Library

**AI & chat**

Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled

- **Element:** `<tc-prompt-library>`
- **Size:** 13.4 KB gzip · 57.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/prompt-library";` |
| React / Next.js | `import { PromptLibrary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/prompt-library";` · tags starting with tc- are custom elements |
| Angular | `import { PromptLibrary } from "@adamstavely/trenchcoat/angular/prompt-library";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/prompt-library";` |

## Example

The live example is in the gallery at `#/prompt-library`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A shelf of saved prompts that people fill in instead of retyping. Each template is a sentence with `{variables}`;
people type straight into the gaps, watch the finished prompt assemble below, and send it with Use once every
gap is filled. A counter shows how many are filled, the tray estimates the prompt's length in tokens, and Copy
puts the finished prompt on the clipboard. Search narrows the list by title, category or text.

### When to use

- A team's recurring requests – follow-up emails, summaries, release notes – where the wording is settled and only
  the details change.
- Handing people a good prompt without asking them to write one.
- Next to a composer, as the place prompts come from.

### When not to use

- Writing a free-form message – use [Chat Composer](chat-composer.md).
- Inserting a saved snippet or command while typing – use [Mention Picker](mention-picker.md).
- Choosing the model a prompt runs on – use [Model Picker](model-picker.md).
- Running actions or jumping somewhere from a list – use [Command Menu](command-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-pli__search` – narrows the list by title, category or text
2. **List** `.ui-pli__list` – the templates, each with its category tag
3. **Counter** `.ui-pli__count` – one bar per variable and “2 of 4 filled”
4. **Variable** `.ui-pli__token` – a field inside the sentence, sized to what's typed
5. **Preview** `.ui-pli__preview` – the finished prompt, with gaps still shown as `{name}`
6. **Caption** `.ui-pli__caption` – the token estimate, the variable being edited, or what just happened
7. **Use** `.ui-pli__use` – sends the finished prompt; off until every variable is filled

## Looks

Standard puts the header on the gray tray, the list and the template on a white card below it, and the caption, Copy
and Use on the tray under that. Clean drops the tray: one white card whose first row is the header and whose last row
holds the caption, Copy and Use. Both
highlight the part that just changed, roll the token count and pulse Use once when the last variable is filled.

## Usage

### HTML

```html
<tc-prompt-library id="prompts" heading="Prompts" use-label="Use prompt"></tc-prompt-library>

<script type="module">
  import "@adamstavely/trenchcoat/prompt-library";
  import "@adamstavely/trenchcoat/tokens.css";

  const library = document.querySelector("#prompts");
  library.templates = [
    {
      id: "summary",
      title: "Meeting summary",
      category: "Ops",
      body: "Summarize these notes for {audience} in {length} bullet points.",
      variables: {
        audience: { description: "Who reads it", default: "the leadership team" },
        length: { description: "How many bullets" },
      },
    },
  ];
  library.onUse = (prompt) => console.log(prompt);
  library.addEventListener("tc-copy", (e) => console.log("Copied", e.detail.prompt));
</script>
```

### React / Next.js

```tsx
import { PromptLibrary, type PromptTemplate } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const templates: PromptTemplate[] = [
  {
    id: "summary",
    title: "Meeting summary",
    category: "Ops",
    body: "Summarize these notes for {audience} in {length} bullet points.",
    variables: {
      audience: { description: "Who reads it", default: "the leadership team" },
      length: { description: "How many bullets" },
    },
  },
];

export function Prompts({ send }: { send: (prompt: string) => Promise<void> }) {
  return <PromptLibrary title="Prompts" templates={templates} onUse={(prompt) => send(prompt)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/prompt-library";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";

defineProps<{ templates: TcPromptLibrary["templates"]; values: TcPromptLibrary["values"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-prompt-library :templates="templates" :values="values" @tc-value-change="onValueChange"></tc-prompt-library>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PromptLibrary } from "@adamstavely/trenchcoat/angular/prompt-library";
import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";

@Component({
  selector: "app-prompt-library-example",
  imports: [PromptLibrary],
  template: `<tc-prompt-library [templates]="templates()" [values]="values()" (tc-value-change)="onValueChange($event)"></tc-prompt-library>`,
})
export class PromptLibraryExample {
  readonly templates = input.required<TcPromptLibrary["templates"]>();
  readonly values = input.required<TcPromptLibrary["values"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/prompt-library";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";

  let { templates, values }: { templates: TcPromptLibrary["templates"]; values: TcPromptLibrary["values"] } = $props();
  let el: TcPromptLibrary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-prompt-library bind:this={el} {templates} {values}></tc-prompt-library>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `templates` | – | `PromptTemplate[]` | `[]` | The saved templates, in list order – each with a title, an optional category and a body with {variables} |
| `value` | `value` | `string` | `""` | Id of the chosen template – unset or unknown shows the first. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `values` | – | `PromptValues` | `{}` | The variables typed so far, per template; a missing one shows its template default. Changed by the user unless a tc-values-change listener calls preventDefault() |
| `onUse` | – | `PromptUseHandler \| undefined` | `undefined` | Called with the finished prompt when Use is pressed (only once every variable is filled). A promise keeps Use pending until it settles; a rejection says so on the tray and Use can be pressed again |
| `heading` | `heading` | `string` | `"Prompts"` | The heading over the list, and the group's name |
| `useLabel` | `use-label` | `string` | `"Use prompt"` | Label of the use button |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | Another template is chosen ({ value: string }); cancelable |
| `tc-values-change` | – | Yes | A variable was edited ({ values: PromptValues }, every template's values); cancelable |
| `tc-copy` | – | No | The finished prompt is on the clipboard ({ prompt: string }) – not when the clipboard refused it |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-prompt-library-well` | `var(--tc-surface-well)` | standard |
| `--tc-prompt-library-flash` | `light-dark(rgba(0, 96, 226, 0.16), rgba(77, 141, 255, 0.3))` | standard, clean |
| `--tc-prompt-library-pulse` | `light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.25))` | clean |

#### Design tokens it reads (103)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg-sunken`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `templates` | `el.templates = …;` | `<… templates={…} />` | `<tc-prompt-library :templates="…">` | `<tc-prompt-library [templates]="…">` | `<tc-prompt-library {templates}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-prompt-library :values="…">` | `<tc-prompt-library [values]="…">` | `<tc-prompt-library {values}>` |
| `onUse` | `el.onUse = …;` | `<… onUse={…} />` | `<tc-prompt-library :onUse="…">` | `<tc-prompt-library [onUse]="…">` | `<tc-prompt-library {onUse}>` |

*Also attributes: `value`, `heading`, `use-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onSelect={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-values-change` | Yes | `el.addEventListener("tc-values-change", (e) => …)` | `onValuesChange={…}` | `@tc-values-change="…"` | `(tc-values-change)="…($event)"` | `el.addEventListener("tc-values-change", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

### Controlled

The element changes `value` and `values` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-values-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-prompt-library id="prompt-library"></tc-prompt-library>

<script type="module">
  import "@adamstavely/trenchcoat/prompt-library";

  const el = document.querySelector("#prompt-library");
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
import { PromptLibrary } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PromptLibrary>;
type Props = Omit<Own, "value" | "onSelect"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledPromptLibrary({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <PromptLibrary {...props} value={value} onSelect={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/prompt-library";
import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";

const props = defineProps<{ initial: TcPromptLibrary["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcPromptLibrary["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-prompt-library :value="value" @tc-value-change="onValueChange"></tc-prompt-library>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PromptLibrary } from "@adamstavely/trenchcoat/angular/prompt-library";
import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";

@Component({
  selector: "app-controlled-prompt-library",
  imports: [PromptLibrary],
  template: `<tc-prompt-library [value]="value()" (tc-value-change)="onValueChange($event)"></tc-prompt-library>`,
})
export class ControlledPromptLibrary {
  readonly initial = input.required<TcPromptLibrary["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcPromptLibrary["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/prompt-library";
  import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";

  let { initial }: { initial: TcPromptLibrary["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcPromptLibrary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcPromptLibrary["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-prompt-library bind:this={el} {value}></tc-prompt-library>
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
<… value={value} onSelect={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-prompt-library :value="value" @tc-value-change="value = $event.detail.value"></tc-prompt-library>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-prompt-library [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-prompt-library>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-prompt-library bind:this={el} {value}></tc-prompt-library>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-prompt-library")` returns a `TcPromptLibrary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";`
- **React / Next.js:** Props: `import type { PromptLibraryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PromptLibrary>`. The element class, for refs: `import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPromptLibrary["templates"]` with `import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";`
- **Angular:** The directive types the template: `[templates]` takes `TcPromptLibrary["templates"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPromptLibrary } from "@adamstavely/trenchcoat/prompt-library";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | Id of the chosen template (controlled when defined) |
| `defaultValue` | `string` | Id chosen at first when uncontrolled – defaults to the first template |
| `onSelect` | `(id: string) => void` | Called with the template's id when another template is chosen |
| `values` | `PromptValues` | The variables typed so far, per template (controlled when defined) |
| `defaultValues` | `PromptValues` | The variables to start with when uncontrolled |
| `onValuesChange` | `(values: PromptValues) => void` | Every edit to a variable, with the values of every template |
| `onCopy` | `(prompt: string) => void` | Called once the finished prompt is on the clipboard – not when the clipboard refused it |
| `title` | `string` | The heading over the list, and the group's accessible name – "Prompts" by default |

*Renamed or hidden on the wrapper: `value`, `values`, `heading`, `onSelect`, `onCopy`, `defaultValue`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ | In the search field: moves focus to the chosen template (or the first one shown) |
| Escape | In the search field: clears the search |
| ↓ / ↑ | In the list: chooses the next or previous template and focuses it |
| Home / End | In the list: chooses the first or last template |
| Enter / Space | On a template: chooses it |
| Enter | In a variable: moves to the next empty variable; when all are filled, presses Use |
| Tab | Moves between the search field, the list (one stop), the variables, Copy and Use |

### Screen readers

The component is a group named by its heading. The list is a `listbox` named “Templates”, its options
`aria-selected`. Each variable is a text field named after the variable and its description – “date – When the demo
happened, e.g. Tuesday”. The preview is a region named “Preview”. Use stays focusable while it's off: it is
`aria-disabled`, described by “Fill 2 more variables to use”, and pressing it says “Fill 2 more variables to use the
prompt”. A status region announces “All variables filled”, “Prompt copied”, “Couldn't copy the prompt”,
“Sales follow-up used” and “Couldn't use the prompt”; Use is `aria-busy` while an `onUse` promise is pending.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 50.2 KB | 11.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **57.5 KB** | **13.4 KB** |
| With Lit – the first component on a page | 80.0 KB | 20.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 89 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of templates replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.9 ms | templates: first render, 374 nodes; update 0.4 ms |
| 1,000 items | 22 ms | templates: first render, 3,074 nodes; update 5.1 ms |

1,000 items of templates: 22 ms, 3,074 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title templates by the job, as a noun phrase: “Sales follow-up”, “Meeting summary”.
- Name variables with one plain word – `name`, `audience`, `version` – they are the placeholder people see.
- Give every variable a `description` with an example: “When the demo happened, e.g. Tuesday”.
- Set a `default` only where one answer is usual; an empty gap gets more attention than a wrong guess.
- Keep categories few and short – “Sales”, “Ops” – each gets its own colour in the order it first appears.

## Do and don't

### Do

- Write the body as one or two sentences people can read in full; the variables sit inside them.
- Return a promise from `onUse` when sending takes time, so Use shows that it's busy and reports a failure.
- Use `useLabel` for what Use does in your product: “Send”, “Insert”.

### Don't

- Don't put more than about five variables in one template – split it into two.
- Don't use the same variable for two different things; one name fills every place it appears.
- Don't hide Use until the prompt is ready – the component keeps it in place and says what's missing.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
