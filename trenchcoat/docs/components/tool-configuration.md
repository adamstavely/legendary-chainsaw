<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tool Configuration

**AI configuration** · New

A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs

- **Element:** `<tc-tool-configuration>`
- **Size:** 34.4 KB gzip · 135.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tool-configuration";` |
| React / Next.js | `import { ToolConfiguration } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tool-configuration";` · tags starting with tc- are custom elements |
| Angular | `import { ToolConfiguration } from "@adamstavely/trenchcoat/angular/tool-configuration";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tool-configuration";` |

## Example

The live example is in the gallery at `#/tool-configuration`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Define a tool an agent can call, laid out as its API reference entry. The tool's name is the title and the approval a
call needs – nothing, a person's approval each time, or whatever tool permissions say – is a compact picker beside
it. The lead block is the signature – `search_orders(query: string, status?: string)` – and the description the model
reads to decide when to call it. The parameters are a doc table – name, type, required, what goes in it and the values
allowed – and each row opens in place to edit. An Example call shows the arguments the model would send, as JSON; 640
px and wider it sits beside the reference. The JSON Schema the parameters produce opens on request, and a strip at the
foot lists what's wrong (which makes the definition invalid) and what would make it better.

The approval here is the tool's own default. Who may call it is set in `tool-permissions`, and review rules for a run
in `gate-config`; the app enforces all three. The example is generated from the parameters unless the app supplies one
through `example`; the element never calls the tool.

### When to use

- Letting people add their own tools to an agent – an internal API, a lookup, an action.
- Reviewing a tool before it ships, where the description and parameters decide how well the model uses it.
- Any place the model's view of a tool should be readable by the person who owns it.

### When not to use

- Deciding which agents may use which tools – use [Tool Permissions](tool-permissions.md).
- Setting when a run pauses for a person – use [Gate Config](gate-config.md).
- Defining the shape of a model's answer rather than a tool's input – use [Output Schema Builder](output-schema-builder.md).
- Tools that come from an MCP server – use [MCP connection manager](mcp-connection-manager.md); the server defines them.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Approval** `.ui-tdef__approval` – what a call needs before it runs, in the head beside the tool's name
2. **Signature** `.ui-tdef__code` – the tool as the model sees it; click a part to edit it
3. **Edit** `.ui-tdef__edit-head` – opens the name and description in place
4. **Parameter row** `.ui-tdef__param` – one parameter in the doc table; its Edit button opens the row's cells as fields
5. **Example call** `.ui-tdef__example` – the arguments the model would send; pointing at a row lights its line
6. **JSON Schema** `.ui-tdef__schema-toggle` – opens the schema the parameters produce
7. **Checks** `.ui-tdef__summary` – problems to fix and suggestions, each a link to its field

## Looks

Standard puts the head on the gray tray above a white card: the table's column headers sit on a tinted band, a row
being edited is tinted with an accent edge, and the example is a sunken well. Clean is one white card with the head as
its first row: hairlines under the head, between rows and beside the example, caption-style column headers, an
outlined approval picker and thinner icons. Below 500 px of reference width the table stacks each row – name, type
and Edit on one line, the description under them – and below 640 px the example moves under the table.

## Usage

### HTML

```html
<tc-tool-configuration id="tool" name="tool"></tc-tool-configuration>

<script type="module">
  import "@adamstavely/trenchcoat/tool-configuration";
  import "@adamstavely/trenchcoat/tokens.css";

  const tool = document.querySelector("#tool");
  tool.value = {
    name: "search_orders",
    description: "Find a customer's orders by email or order number.",
    parameters: [{ name: "query", type: "string", required: true, description: "An email or order number" }],
    approval: "auto",
  };
  tool.example = { query: "dana@example.com" };
  tool.addEventListener("tc-value-change", (e) => console.log(e.detail.value, tool.signature));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ToolConfiguration, toolExampleCall, toolInputSchema, type ToolConfigurationValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ToolEditor({ start, lastCall, save }: { start: ToolConfigurationValue; lastCall?: Record<string, unknown>; save: (v: ToolConfigurationValue, schema: Record<string, unknown>) => void }) {
  const [value, setValue] = useState(start);
  return (
    <ToolConfiguration
      description="Support agent · Orders"
      value={value}
      example={lastCall ?? toolExampleCall(value)}
      onChange={(v) => {
        setValue(v);
        save(v, toolInputSchema(v));
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tool-configuration";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";

defineProps<{ value: TcToolConfiguration["value"]; approvals: TcToolConfiguration["approvals"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tool-configuration :value="value" :approvals="approvals" @tc-value-change="onValueChange"></tc-tool-configuration>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ToolConfiguration } from "@adamstavely/trenchcoat/angular/tool-configuration";
import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";

@Component({
  selector: "app-tool-configuration-example",
  imports: [ToolConfiguration],
  template: `<tc-tool-configuration [value]="value()" [approvals]="approvals()" (tc-value-change)="onValueChange($event)"></tc-tool-configuration>`,
})
export class ToolConfigurationExample {
  readonly value = input.required<TcToolConfiguration["value"]>();
  readonly approvals = input.required<TcToolConfiguration["approvals"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-configuration";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";

  let { value, approvals }: { value: TcToolConfiguration["value"]; approvals: TcToolConfiguration["approvals"] } = $props();
  let el: TcToolConfiguration;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tool-configuration bind:this={el} {value} {approvals}></tc-tool-configuration>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `ToolConfigurationValue` | `{ name: "", description: "", parameters: [], approval: "inherit" }` | The definition. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `approvals` | – | `ToolApprovalOption[]` | `[ { id: "inherit", label: "Follows tool permissions", description: "Each agent's access is set where tool permissions are managed" }, { id: "ask", label: "Ask every time", description: "A person approves each call before it runs" }, { id: "auto", label: "Runs on its own", description: "For tools that only read – lookups and searches" }, ]` | The approvals offered in the head's picker; empty hides it |
| `types` | – | `{ id: ToolParameterType; label: string }[]` | `[ { id: "string", label: "Text" }, { id: "number", label: "Number" }, { id: "integer", label: "Integer" }, { id: "boolean", label: "Yes / no" }, { id: "array", label: "List" }, { id: "object", label: "Object" }, ]` | The parameter types offered, with their labels |
| `example` | – | `Record<string, unknown> \| undefined` | `undefined` | The arguments Example call shows; unset, they're made from the parameters (toolExampleCall) |
| `heading` | `heading` | `string` | `"New tool"` | The title while the tool has no name; the tool's name replaces it |
| `description` | `description` | `string` | `""` | A quieter line under the title |
| `showSchema` | `show-schema` | `boolean` | `true` | Shows the JSON Schema disclosure |
| `showExample` | `show-example` | `boolean` | `true` | Shows the Example call panel |
| `name` | `name` | `string` | `""` | Submitted with the form: the definition as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the definition out of the form; a disabled fieldset does the same |
| `issues` | – | `ToolIssue[]` | – | What's wrong or missing, as the strip lists it |
| `schema` | – | `Record<string, unknown>` | – | The JSON Schema the parameters produce |
| `exampleCall` | – | `Record<string, unknown>` | – | The arguments Example call shows: `example`, or ones made from the parameters |
| `signature` | – | `string` | – | The tool as the model sees it: name(param: type, optional?: type) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The definition changed ({ value: ToolConfigurationValue }); cancelable – prevent it to control `value` |

#### Design tokens it reads (102)

`--tc-accent`, `--tc-accent-highlight`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-syntax-function`, `--tc-syntax-keyword`, `--tc-syntax-number`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-text`, `--tc-syntax-type`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `toolInputSchema(value: ToolConfigurationValue): Record<string, unknown>` | The JSON Schema for a tool's input: an object with one property per parameter |
| `toolExampleCall(value: ToolConfigurationValue): Record<string, unknown>` | Arguments a call could carry: the first allowed value, else a placeholder of the right type ("&lt;name>", 1, 1.5, true, [], {}) |
| `validateTool(value: ToolConfigurationValue): ToolIssue[]` | What's wrong with a definition (errors) and what would make it better (warnings) |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-tool-configuration :value="…">` | `<tc-tool-configuration [value]="…">` | `<tc-tool-configuration {value}>` |
| `approvals` | `el.approvals = …;` | `<… approvals={…} />` | `<tc-tool-configuration :approvals="…">` | `<tc-tool-configuration [approvals]="…">` | `<tc-tool-configuration {approvals}>` |
| `types` | `el.types = …;` | `<… types={…} />` | `<tc-tool-configuration :types="…">` | `<tc-tool-configuration [types]="…">` | `<tc-tool-configuration {types}>` |
| `example` | `el.example = …;` | `<… example={…} />` | `<tc-tool-configuration :example="…">` | `<tc-tool-configuration [example]="…">` | `<tc-tool-configuration {example}>` |

*Also attributes: `heading`, `description`, `show-schema`, `show-example`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tool-configuration id="tool-configuration"></tc-tool-configuration>

<script type="module">
  import "@adamstavely/trenchcoat/tool-configuration";

  const el = document.querySelector("#tool-configuration");
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
import { ToolConfiguration } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ToolConfiguration>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledToolConfiguration({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ToolConfiguration {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/tool-configuration";
import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";

const props = defineProps<{ initial: TcToolConfiguration["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcToolConfiguration["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-tool-configuration :value="value" @tc-value-change="onValueChange"></tc-tool-configuration>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ToolConfiguration } from "@adamstavely/trenchcoat/angular/tool-configuration";
import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";

@Component({
  selector: "app-controlled-tool-configuration",
  imports: [ToolConfiguration],
  template: `<tc-tool-configuration [value]="value()" (tc-value-change)="onValueChange($event)"></tc-tool-configuration>`,
})
export class ControlledToolConfiguration {
  readonly initial = input.required<TcToolConfiguration["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcToolConfiguration["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-configuration";
  import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";

  let { initial }: { initial: TcToolConfiguration["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcToolConfiguration;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcToolConfiguration["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tool-configuration bind:this={el} {value}></tc-tool-configuration>
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
<tc-tool-configuration :value="value" @tc-value-change="value = $event.detail.value"></tc-tool-configuration>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-tool-configuration [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-tool-configuration>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-tool-configuration bind:this={el} {value}></tc-tool-configuration>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tool-configuration")` returns a `TcToolConfiguration` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";`
- **React / Next.js:** Props: `import type { ToolConfigurationProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ToolConfiguration>`. The element class, for refs: `import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcToolConfiguration["value"]` with `import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";`
- **Angular:** The directive types the template: `[value]` takes `TcToolConfiguration["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcToolConfiguration } from "@adamstavely/trenchcoat/tool-configuration";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title while the tool has no name – the tool's name replaces it |
| `value` | `ToolConfigurationValue` | The definition (controlled) |
| `defaultValue` | `ToolConfigurationValue` | The definition to start with when uncontrolled |
| `onChange` | `(value: ToolConfigurationValue) => void` | Called with the whole definition after every change |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Table pattern](https://www.w3.org/WAI/ARIA/apg/patterns/table/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the approval picker, Edit, Add parameter, each row's Edit button (or its fields, when open), JSON Schema and the strip's links |
| ↑ / ↓ | In the approval picker, picks the previous or next approval |
| Enter / Space | On an Edit button, opens that part in place and focuses its first field; on Done, closes it; on a strip link, opens and focuses the field it's about |
| Escape | In an open row or the open name and description, closes it and returns focus to its Edit button |
| Alt+↑ / Alt+↓ | Anywhere in a parameter row, moves it up or down; focus stays with it |
| Enter or , | In Allowed, adds what's typed as a value |
| Backspace | In an empty Allowed field, removes the last value |

Adding a parameter opens its row and focuses its name. Removing one moves focus to the next row's Edit button, or to
Add parameter.

### Screen readers

The host is a group named by its title – the tool's name. The approval picker is a select named “Before it runs”,
described by the chosen approval's line. The signature is read whole: “Signature: search_orders(query: string,
status?: "open" | "shipped")”. The parameters are a `table` named “Parameters” with Name, Type, Description and Edit
column headers; each row is named “Parameter 2 of 3: status”, its name cell reads “required” or “optional”, and its
Edit button is “Edit status”. In an open row, the fields are named Name, Required, Type, “What status is for” and
Allowed. Example call is a section with that heading; its JSON is read as one line. The strip is a section headed, for
example, “2 problems to fix · 1 suggestion”; each link starts “Problem:” or “Suggestion:”. A polite status message says
“Parameter 4 added.”, “page moved to position 3 of 4.”, “limit removed.” and “Allowed: refunded.”

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, code-block, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, code-block, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | code-block | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 52.7 KB | 13.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| **Added to a page that already has Lit** | **135.8 KB** | **34.4 KB** |
| With Lit – the first component on a page | 158.9 KB | 42.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.3 ms** | the gallery demo's data, 184 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of types replaced |
| First on the page | 34 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.7 ms | types: first render, 184 nodes; update 0.3 ms |
| 1,000 items | 3.0 ms | types: first render, 184 nodes; update 0.3 ms |

What it renders doesn't grow with types (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (code-block), `setTimeout` (inline-diff).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name tools and parameters the way an API would – `search_orders`, `placed_after` – letters, digits, `_` and `-`.
  The name is the card's title, so `heading` only shows while a new tool has none (“New tool”).
- Write the description for the model: what the tool does and when to use it, in a sentence or two.
- Describe every parameter, with an example where the format matters: “An email or order number (#10423)”.
- Use allowed values whenever the set is closed – the model can't guess “shipped” from “sent”.
- Pass `example` when you have a real call to show (from a log or a test); the generated one uses the first allowed
  value and placeholders such as `"<query>"`.
- Rename the approval choices through `approvals` to match your product's policy words, and keep the labels short –
  the picker sits beside the title.

## Do and don't

### Do

- Treat the summary's problems as blocking: the form is invalid until they're fixed.
- Store the definition and generate the provider's own tool format from it on your server – `toolInputSchema()` gives
  the input schema.
- Default tools that change something to “Ask every time”.

### Don't

- Don't use the approval here instead of `tool-permissions` – it's the tool's default, not who may call it.
- Don't put secrets or endpoints in the description; the model reads it.
- Don't make every parameter required – optional ones let the model leave out what it doesn't know.

## Related

- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [Output Schema Builder](output-schema-builder.md) – Build a structured-output schema as a tree beside a rendered preview of the answer – types visible, problems flagged on their rows – with raw JSON and the JSON Schema as tabs
- [MCP connection manager](mcp-connection-manager.md) – MCP servers at a glance – status and what each exposes; add one (transport, auth, test), inspect its tools, resources and prompts, connect, retry and remove
