<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# HAL Form

**Inputs & controls** · New

A form the server describes – a HAL-FORMS document drawn as controls, every type and inline or linked options, checked by its rules and sent as its template asks, as JSON, form encoding or a query string

- **Element:** `<tc-hal-form>`
- **Size:** 24.9 KB gzip · 89.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/hal-form";` |
| React / Next.js | `import { HalForm } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/hal-form";` · tags starting with tc- are custom elements |
| Angular | `import { HalForm } from "@adamstavely/trenchcoat/angular/hal-form";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/hal-form";` |

## Example

The live example is in the gallery at `#/hal-form`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A form the server describes. Give it a [HAL-FORMS](https://rwcbook.github.io/hal-forms/) document, or the URL of one, and
it draws the template's properties as controls, checks them by the template's rules, and sends the request the template
asks for. Nothing about the form lives in the page, so an API can add a field, change a rule or move an endpoint without
a release of the app.

### When to use

- An API that already publishes HAL-FORMS templates, such as Spring HATEOAS with `application/prs.hal-forms+json`.
- Actions that differ by resource or by what the person may do, where the server knows which fields apply.
- Admin and back-office screens with many simple forms that would otherwise each be written by hand.

### When not to use

- A long form split into steps – use [Stepper Form](stepper-form.md).
- A form whose layout needs design, not just a column of fields – write it with the app's own controls.
- An API without HAL-FORMS – there's no document to draw.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Fields** `.ui-hal__fields` – the template's properties, in order
2. **Field** `.ui-hal__field` – one property, with its `data-kind`
3. **Required** `.ui-hal__req` – the word beside a required field's prompt
4. **Message** `.ui-hal__error` – what's wrong with the field
5. **Choices** `.ui-hal__group` – a property's options
6. **Foot** `.ui-hal__foot` – Submit and `.ui-hal__outcome`, how it went
7. **Notice** `.ui-hal__message` – shown instead of the form while it loads or when it can't be drawn

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
The controls are the same native inputs as Trenchcoat's other form fields, with `tc-combobox` for lists of choices. A
page can set `--tc-hal-swatch`, the width of a colour field.

## Usage

### HTML

```html
<tc-hal-form id="task" src="/rels/create-task"></tc-hal-form>

<script type="module">
  import "@adamstavely/trenchcoat/hal-form";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#task");
  form.fetcher = (url, init) => fetch(url, { ...init, credentials: "include" });
  form.addEventListener("tc-response", (e) => {
    if (e.detail.ok) location.assign("/tasks");
  });
</script>
```

### React / Next.js

```tsx
import { HalForm, type HalFormsDocument } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const doc: HalFormsDocument = {
  _links: { self: { href: "https://api.example.org/tasks" } },
  _templates: {
    default: {
      title: "New task",
      method: "POST",
      properties: [
        { name: "title", prompt: "Title", required: true },
        { name: "completed", prompt: "Already done", type: "checkbox" },
      ],
    },
  },
};

export function NewTask({ onDone }: { onDone: () => void }) {
  return <HalForm resource={doc} onTcResponse={(e) => e.detail.ok && onDone()} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/hal-form";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";

defineProps<{ resource: TcHalForm["resource"]; values: TcHalForm["values"] }>();
const onValuesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-hal-form :resource="resource" :values="values" @tc-values-change="onValuesChange"></tc-hal-form>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HalForm } from "@adamstavely/trenchcoat/angular/hal-form";
import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";

@Component({
  selector: "app-hal-form-example",
  imports: [HalForm],
  template: `<tc-hal-form [resource]="resource()" [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-hal-form>`,
})
export class HalFormExample {
  readonly resource = input.required<TcHalForm["resource"]>();
  readonly values = input.required<TcHalForm["values"]>();
  onValuesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/hal-form";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";

  let { resource, values }: { resource: TcHalForm["resource"]; values: TcHalForm["values"] } = $props();
  let el: TcHalForm;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-hal-form bind:this={el} {resource} {values}></tc-hal-form>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default the template's title |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `resource` | – | `HalFormsDocument \| null` | `null` | The HAL-FORMS document, when the page already has it; wins over `src` |
| `src` | `src` | `string \| undefined` | `undefined` | Where to fetch the HAL-FORMS document. Also the base for relative URLs, and the target of last resort |
| `templateKey` | `template-key` | `string \| undefined` | `undefined` | Which template to use; by default "default", else the first |
| `values` | – | `HalFormValues` | `{}` | The fields' values over what the template starts with. Changed by the user unless a tc-values-change listener calls preventDefault() |
| `errors` | – | `Record<string, string>` | `{}` | Messages for fields, by name, e.g. from the server's answer; a message goes when its field is edited |
| `variables` | – | `Record<string, unknown>` | `{}` | Values for templated `value`s and `options.link.href`s |
| `fetcher` | – | `HalFormFetcher \| undefined` | `undefined` | Replaces fetch for every request it makes, e.g. to add auth |
| `labels` | – | `Partial<HalFormLabels>` | `{}` | Replaces any of the words: "Submit", the messages… |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-values-change` | – | Yes | A field changed ({ values, name, value }: HalFormValuesChange); cancelable – prevented, the field keeps its value |
| `tc-submit` | – | Yes | The form is valid and about to send ({ method, url, headers, body, values, templateKey }: HalFormSubmit); cancelable – prevented, nothing is sent and the request is yours |
| `tc-response` | – | No | The server answered ({ ok, status, response, values }: HalFormResponse) |
| `tc-error` | – | No | Fetching the form, a field's options or the request failed ({ phase, error, name }: HalFormError) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hal-swatch` | `64px` | both |

#### Design tokens it reads (29)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `pickHalTemplate(doc: HalFormsDocument \| null \| undefined, key?: string): { key: string; template: HalFormsTemplate } \| null` | The template to use: the key asked for, else "default", else the first |
| `expandHalUri(template: string, variables: Record<string, unknown>): string` | Expands the common URI templates (RFC 6570): {var}, {+var}, {?a,b} and {&a,b}; a variable without a value drops out |
| `parseHalChoices(raw: unknown, options: Pick<HalFormsOptions, "promptField" \| "valueField">): { value: string; label: string }[] \| null` | Choices from an array of plain values or objects; anything that isn't an array gives none |
| `parseHalCsv(text: string): { value: string; label: string }[]` | Choices from CSV, a line each: "value", or "prompt,value" |
| `buildHalRequest(template: HalFormsTemplate, url: string, values: Record<string, HalFormWireValue>): HalRequest` | The request a template describes, for values as they're sent |

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
| `resource` | `el.resource = …;` | `<… resource={…} />` | `<tc-hal-form :resource="…">` | `<tc-hal-form [resource]="…">` | `<tc-hal-form {resource}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-hal-form :values="…">` | `<tc-hal-form [values]="…">` | `<tc-hal-form {values}>` |
| `errors` | `el.errors = …;` | `<… errors={…} />` | `<tc-hal-form :errors="…">` | `<tc-hal-form [errors]="…">` | `<tc-hal-form {errors}>` |
| `variables` | `el.variables = …;` | `<… variables={…} />` | `<tc-hal-form :variables="…">` | `<tc-hal-form [variables]="…">` | `<tc-hal-form {variables}>` |
| `fetcher` | `el.fetcher = …;` | `<… fetcher={…} />` | `<tc-hal-form :fetcher="…">` | `<tc-hal-form [fetcher]="…">` | `<tc-hal-form {fetcher}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-hal-form :labels="…">` | `<tc-hal-form [labels]="…">` | `<tc-hal-form {labels}>` |

*Also attributes: `heading`, `description`, `src`, `template-key` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-values-change` | Yes | `el.addEventListener("tc-values-change", (e) => …)` | `ref.current.addEventListener("tc-values-change", …)` | `@tc-values-change="…"` | `(tc-values-change)="…($event)"` | `el.addEventListener("tc-values-change", …)` |
| `tc-submit` | Yes | `el.addEventListener("tc-submit", (e) => …)` | `onTcSubmit={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |
| `tc-response` | No | `el.addEventListener("tc-response", (e) => …)` | `onTcResponse={…}` | `@tc-response="…"` | `(tc-response)="…($event)"` | `el.addEventListener("tc-response", …)` |
| `tc-error` | No | `el.addEventListener("tc-error", (e) => …)` | `onTcError={…}` | `@tc-error="…"` | `(tc-error)="…($event)"` | `el.addEventListener("tc-error", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `values` itself unless a listener calls `preventDefault()` on `tc-values-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-hal-form id="hal-form"></tc-hal-form>

<script type="module">
  import "@adamstavely/trenchcoat/hal-form";

  const el = document.querySelector("#hal-form");
  el.addEventListener("tc-values-change", (e) => {
    e.preventDefault(); // the element keeps its values…
    if (allowed(e.detail.values)) el.values = e.detail.values; // …until the app sets it
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
import "@adamstavely/trenchcoat/hal-form";
import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";

const props = defineProps<{ initial: TcHalForm["values"] }>();
const values = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValuesChange = (e: CustomEvent<{ values: TcHalForm["values"] }>) => {
  e.preventDefault();
  values.value = e.detail.values;
};
</script>

<template>
  <tc-hal-form :values="values" @tc-values-change="onValuesChange"></tc-hal-form>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { HalForm } from "@adamstavely/trenchcoat/angular/hal-form";
import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";

@Component({
  selector: "app-controlled-hal-form",
  imports: [HalForm],
  template: `<tc-hal-form [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-hal-form>`,
})
export class ControlledHalForm {
  readonly initial = input.required<TcHalForm["values"]>();
  readonly values = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValuesChange(e: CustomEvent<{ values: TcHalForm["values"] }>) {
    e.preventDefault();
    this.values.set(e.detail.values);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/hal-form";
  import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";

  let { initial }: { initial: TcHalForm["values"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let values = $derived(initial);
  let el: TcHalForm;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      values = (e as CustomEvent<{ values: TcHalForm["values"] }>).detail.values;
    };
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-hal-form bind:this={el} {values}></tc-hal-form>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-hal-form")` returns a `TcHalForm` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";`
- **React / Next.js:** Props: `import type { HalFormProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HalForm>`. The element class, for refs: `import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHalForm["resource"]` with `import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";`
- **Angular:** The directive types the template: `[resource]` takes `TcHalForm["resource"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHalForm } from "@adamstavely/trenchcoat/hal-form";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default the template's title |
| `values` | `HalFormValues` | The fields' values – controlled when given |
| `defaultValues` | `HalFormValues` | The values on mount, over what the template starts with, when `values` isn't controlled |
| `onValuesChange` | `(values: HalFormValues) => void` | A field changed |

*Renamed or hidden on the wrapper: `heading`, `values`, `children`*

## Accessibility

### Keyboard

The form follows normal tab order, one stop per control.

| Key | What it does |
|---|---|
| Tab | Moves through the fields, then Submit |
| Enter | Submits from a text field; a new line in a text area |
| Space / arrows | Tick a checkbox, move through radios |

After a failed submit, focus goes to the first field with a problem.

### Screen readers

It's a `form` named by the heading. Each control is named by its prompt, says it's required, and is tied to its message
with `aria-invalid` and `aria-describedby`. Radios and checkboxes are a `fieldset` with the prompt as its legend.
`role="status"` announces how many fields need attention and how the request went; a form that won't load is an alert.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | combobox, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | combobox | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, combobox | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, internal/settings | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, combobox, internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | combobox | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | combobox | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | combobox | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.9 KB | 8.7 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [combobox](combobox.md) · Element it renders | 41.5 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **89.8 KB** | **24.9 KB** |
| With Lit – the first component on a page | 112.8 KB | 32.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 9.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (combobox).
- Timers: `setTimeout` (combobox).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (combobox), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown` (combobox).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

How the spec's terms are read:

| In the template | What happens |
|---|---|
| `type` | `text`, `textarea`, `search`, `tel`, `url`, `email`, `password`, `date`, `month`, `week`, `time`, `datetime-local`, `number`, `range`, `color`, `checkbox`, `radio`, `hidden`; anything else is a text box. These are the browser's own inputs, so Firefox and Safari show `month` and `week` as text boxes |
| `options` | `type: "radio"` or `"checkbox"` draws radios or checkboxes; otherwise a searchable list. `inline` wins over `link`; `link` may be JSON or CSV, with `promptField` and `valueField` |
| `maxItems` | Without it, only `type: "checkbox"` allows several (the spec's own example of an untyped list is a single choice) |
| `minItems`, `maxItems`, `required`, `regex`, `minLength`, `maxLength`, `min`, `max`, `step` | Checked when a field is left and on submit; a `regex` that can't be read is ignored |
| `readOnly` | Shown and sent, but can't be changed |
| `templated` | `value` and `options.link.href` expand from `variables`: `{var}`, `{+var}`, `{?a,b}` and `{&a,b}`, not the rest of RFC 6570 |
| `method` | Empty or not a method is a GET |
| `contentType` | `application/x-www-form-urlencoded`, else JSON. GET, HEAD and DELETE put the values in the query string, replacing any already on the URL |
| Where it's sent | `_htarget` in `src`, else `target`, else the `self` link, else `src`. With none of them, the form says it has nowhere to go |

In JSON, a single choice is a string and several are an array; numbers and a lone checkbox are a number and a boolean,
and an empty number is `null`. In form encoding, several choices repeat the name.

## Do and don't

### Do

- Use `fetcher` to add auth, so the form's own requests and its `options.link` requests are all covered.
- Listen for `tc-response` to go on to the next screen, and set `errors` from a refusal that names fields.
- Prevent `tc-submit` when the app has its own way of sending, such as a queue or an optimistic update.

### Don't

- Don't load documents from a server you don't trust: the document chooses where the values are sent, and `fetcher` sends
  your auth there too. Only http(s) URLs are followed.
- Don't rely on these checks alone. They save a round trip; the server still has to validate.

## Related

- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Dialog](dialog.md) – A native modal with interactive content and restored focus

## Changelog

- **HAL Form** (`tc-hal-form`) – give it a HAL-FORMS document (`resource`) or its URL (`src`) and it draws the template as controls: every `type`, `options` inline or from `options.link` (JSON or CSV), `selectedValues`, `minItems` and `maxItems`. It checks `required`, `regex`, lengths, ranges and steps when a field is left and on submit, then sends to `_htarget`, `target`, the `self` link or `src`, as JSON, form encoding or a query string. `fetcher` adds auth, cancelable `tc-submit` hands the request to the app, and `errors` shows the server's messages on fields.
