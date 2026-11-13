<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Schema Fields

**Utilities** · New

The fields of an API's request or response from a JSON Schema – each field's name, type in words ("string · email", "array of Tag"), Required, Optional or Deprecated, allowed values, default and limits, and its meaning with code and links; nested objects folding under their field, Expand all, a filter, and a link to every field

- **Element:** `<tc-schema-fields>`
- **Size:** 9.7 KB gzip · 29.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/schema-fields";` |
| React / Next.js | `import { SchemaFields } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/schema-fields";` · tags starting with tc- are custom elements |
| Angular | `import { SchemaFields } from "@adamstavely/trenchcoat/angular/schema-fields";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/schema-fields";` |

## Example

The live example is in the gallery at `#/schema-fields`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The fields of an API's request or response, for a reference page. Each field shows its name, its type in words
("string · email", "array of Tag"), whether it's required, optional or deprecated, its default, its limits ("1–200
characters", "Pattern: ^REC-\d+$") and what it means. Give it a JSON Schema (`schema`) or the fields themselves
(`fields`). Nested objects, and arrays of objects, fold under their field; every field has an anchor and Copy link; a
filter box appears once there are enough fields to need one.

### When to use

- The parameters, request body or response fields on an API reference page.
- Explaining the shape of a webhook payload, a config file or an export.

### When not to use

- Building or editing a schema – use [Output Schema Builder](output-schema-builder.md).
- Showing a real value rather than its shape – use [JSON Viewer](json-viewer.md).
- One tool's signature with its parameters edited in place – use [Tool Configuration](tool-configuration.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filter** `.ui-scf__search` – narrows the fields by name or description
2. **Expand all** `.ui-scf__all` – opens or closes every nested field
3. **Field** `.ui-scf__row` – one field, with an `id` you can link to
4. **Toggle** `.ui-scf__toggle` – the name of a field with children, opening them
5. **Name** `.ui-scf__name` – the field's name, in monospace
6. **Type** `.ui-scf__type` – the type in words, with its format or item type
7. **Required** `.ui-scf__req` – Required, Optional or Deprecated
8. **Copy link** `.ui-scf__copy` – copies the page's address with the field's anchor
9. **Description** `.ui-scf__desc` – what it means, with `code`, **bold** and links
10. **Values** `.ui-scf__enum` – the only values allowed, as chips
11. **Limits** `.ui-scf__meta` – the default and the limits in words
12. **Children** `.ui-scf__group` – a nested field's fields, indented under it

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`--tc-scf-indent` sets how far each level is indented.

## Usage

### HTML

```html
<tc-schema-fields id="fields" heading="Record"></tc-schema-fields>

<script type="module">
  import "@adamstavely/trenchcoat/schema-fields";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#fields").schema = {
    type: "object",
    required: ["id", "title"],
    properties: {
      id: { type: "string", pattern: "^REC-\\d{6}$", description: "The record's id." },
      title: { type: "string", maxLength: 200, description: "What the record is." },
      classification: { type: "string", enum: ["public", "internal", "restricted"], default: "internal" },
      owner: {
        type: "object",
        description: "Who is accountable for it.",
        properties: { email: { type: "string", format: "email" } },
      },
    },
  };
</script>
```

### React / Next.js

```tsx
import { SchemaFields, type JsonSchema } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const record: JsonSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", description: "The record's id." },
    tags: { type: "array", items: { type: "string" }, maxItems: 20 },
  },
};

export function RecordFields() {
  return <SchemaFields title="Record" schema={record} idPrefix="record" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/schema-fields";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";

defineProps<{ schema: TcSchemaFields["schema"]; fields: TcSchemaFields["fields"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-schema-fields :schema="schema" :fields="fields" @tc-expanded-change="onExpandedChange"></tc-schema-fields>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SchemaFields } from "@adamstavely/trenchcoat/angular/schema-fields";
import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";

@Component({
  selector: "app-schema-fields-example",
  imports: [SchemaFields],
  template: `<tc-schema-fields [schema]="schema()" [fields]="fields()" (tc-expanded-change)="onExpandedChange($event)"></tc-schema-fields>`,
})
export class SchemaFieldsExample {
  readonly schema = input.required<TcSchemaFields["schema"]>();
  readonly fields = input.required<TcSchemaFields["fields"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/schema-fields";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";

  let { schema, fields }: { schema: TcSchemaFields["schema"]; fields: TcSchemaFields["fields"] } = $props();
  let el: TcSchemaFields;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-schema-fields bind:this={el} {schema} {fields}></tc-schema-fields>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Fields"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `schema` | – | `JsonSchema \| undefined` | `undefined` | A JSON Schema for an object; its properties become the fields |
| `fields` | – | `SchemaField[] \| undefined` | `undefined` | The fields themselves; wins over `schema` |
| `expanded` | – | `string[]` | `[]` | The paths of fields whose children are showing ("owner", "owner.address"). Changed by the toggles unless a tc-expanded-change listener calls preventDefault() |
| `query` | `query` | `string` | `""` | The filter text. Changed by typing unless a tc-query-change listener calls preventDefault() |
| `searchThreshold` | `search-threshold` | `number` | `8` | How many fields bring up the filter box; 0 always shows it |
| `idPrefix` | `id-prefix` | `string` | `"field"` | What anchors start with: `<id-prefix>-owner.email` |
| `anchorBase` | `anchor-base` | `string` | `""` | The address Copy link puts before the anchor; the page's own address when empty |
| `labels` | – | `Partial<SchemaFieldsLabels>` | `{}` | Rename any of the words, over the defaults |
| `resolvedFields` | – | `SchemaField[]` | – | The fields drawn: `fields`, else the schema's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | A field's children opened or closed, or Expand all / Collapse all was pressed ({ expanded, path, open }: SchemaFieldsExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-query-change` | – | Yes | The filter changed ({ query }: SchemaFieldsQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-anchor-copy` | – | Yes | Copy link was pressed ({ id, path, url }: SchemaFieldsAnchorCopy); cancelable – prevented, nothing is copied |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-scf-indent` | `var(--tc-space-3)` | both |
| `--tc-scf-depth` | `0` | not set – this fallback applies |

#### Design tokens it reads (42)

`--tc-accent-text`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSchemaFieldsLabels: SchemaFieldsLabels` | The words used when the page gives none |
| `schemaConstraints(s: JsonSchema): string[]` | The limits of a schema node, in words |
| `schemaToFields(schema: JsonSchema \| undefined, root: JsonSchema \| undefined, depth: unknown): SchemaField[]` | A JSON Schema's properties as fields – nested objects and arrays of objects as `fields` |
| `fieldTypeWords(f: SchemaField): void` | A field's type in words: "string · email", "array of Tag", "string or null" |

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
| `schema` | `el.schema = …;` | `<… schema={…} />` | `<tc-schema-fields :schema="…">` | `<tc-schema-fields [schema]="…">` | `<tc-schema-fields {schema}>` |
| `fields` | `el.fields = …;` | `<… fields={…} />` | `<tc-schema-fields :fields="…">` | `<tc-schema-fields [fields]="…">` | `<tc-schema-fields {fields}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-schema-fields :expanded="…">` | `<tc-schema-fields [expanded]="…">` | `<tc-schema-fields {expanded}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-schema-fields :labels="…">` | `<tc-schema-fields [labels]="…">` | `<tc-schema-fields {labels}>` |

*Also attributes: `heading`, `description`, `query`, `search-threshold`, `id-prefix`, `anchor-base` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-anchor-copy` | Yes | `el.addEventListener("tc-anchor-copy", (e) => …)` | `onAnchorCopy={…}` | `@tc-anchor-copy="…"` | `(tc-anchor-copy)="…($event)"` | `el.addEventListener("tc-anchor-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `expanded` and `query` itself unless a listener calls `preventDefault()` on `tc-expanded-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-schema-fields id="schema-fields"></tc-schema-fields>

<script type="module">
  import "@adamstavely/trenchcoat/schema-fields";

  const el = document.querySelector("#schema-fields");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
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
import "@adamstavely/trenchcoat/schema-fields";
import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";

const props = defineProps<{ initial: TcSchemaFields["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcSchemaFields["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-schema-fields :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-schema-fields>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SchemaFields } from "@adamstavely/trenchcoat/angular/schema-fields";
import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";

@Component({
  selector: "app-controlled-schema-fields",
  imports: [SchemaFields],
  template: `<tc-schema-fields [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-schema-fields>`,
})
export class ControlledSchemaFields {
  readonly initial = input.required<TcSchemaFields["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcSchemaFields["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/schema-fields";
  import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";

  let { initial }: { initial: TcSchemaFields["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcSchemaFields;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcSchemaFields["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-schema-fields bind:this={el} {expanded}></tc-schema-fields>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-schema-fields")` returns a `TcSchemaFields` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";`
- **React / Next.js:** Props: `import type { SchemaFieldsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SchemaFields>`. The element class, for refs: `import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSchemaFields["schema"]` with `import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";`
- **Angular:** The directive types the template: `[schema]` takes `TcSchemaFields["schema"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSchemaFields } from "@adamstavely/trenchcoat/schema-fields";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `expanded` | `string[]` | The paths of fields whose children are showing – controlled when given |
| `defaultExpanded` | `string[]` | On mount, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string[], detail: SchemaFieldsExpandedChange) => void` | Called with the open fields' paths when a field opens or closes, or Expand all / Collapse all is pressed |
| `query` | `string` | The filter text – controlled when given |
| `defaultQuery` | `string` | On mount, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | Called with the filter text as it's typed |
| `onAnchorCopy` | `(detail: SchemaFieldsAnchorCopy) => boolean \| void` | Copy link was pressed; return false to copy nothing (the page copies or shares it itself) |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `query`, `children`*

## Accessibility

### Keyboard

The fields' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between fields |
| → | Open a field's children; on an open field, move to its Copy link |
| ← | Back from Copy link; close an open field; or go to the field above it |
| Home / End | Go to the first or last field showing |
| Enter / Space | Open or close the field, or copy its link |

### Screen readers

The fields are a list named by the heading, and each field's children are a list inside it. A toggle says the field's
name, how many fields it holds, and whether it's expanded. Copy link says which field it links to. Filtering announces
how many fields match, and Copy link announces "Link copied" through `role="status"`.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.1 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.1 KB** | **9.7 KB** |
| With Lit – the first component on a page | 49.8 KB | 16.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 212 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of expanded replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.9 ms | expanded: first render, 212 nodes; update 0.2 ms |
| 1,000 items | 2.0 ms | expanded: first render, 212 nodes; update 0.2 ms |

What it renders doesn't grow with expanded (tested to 1,000 items).

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

- Write descriptions as what the field means to the caller, not how it's stored.
- Put limits in the schema (`minLength`, `pattern`, `maximum`), so they're drawn in words.
- Mark fields that are going away `deprecated`, and say in the description what to use instead.

## Do and don't

### Do

- Use `id-prefix` when a page has several field lists, so their anchors don't clash.
- Give `$defs` entries a `title`, so arrays of them read "array of Person".

### Don't

- Don't put long prose in descriptions; link to a guide instead.
- Don't rely on Copy link for sharing outside the page – the anchor is only as stable as the field's name.

## Related

- [Response Examples](response-examples.md) – An endpoint's example responses, one tab per status – the code, its reason and its class as a mark, a colour and a word, what the response means, its headers folded behind a disclosure, and the body pretty-printed with syntax colours and Copy, with a media-type pick when there are several
- [Tool Configuration](tool-configuration.md) – A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs
- [Output Schema Builder](output-schema-builder.md) – Build a structured-output schema as a tree beside a rendered preview of the answer – types visible, problems flagged on their rows – with raw JSON and the JSON Schema as tabs
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
