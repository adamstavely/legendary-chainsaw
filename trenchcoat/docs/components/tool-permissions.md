<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tool Permissions

**Agents** · New

Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed

- **Element:** `<tc-tool-permissions>`
- **Size:** 12.1 KB gzip · 45.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tool-permissions";` |
| React / Next.js | `import { ToolPermissions } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tool-permissions";` · tags starting with tc- are custom elements |
| Angular | `import { ToolPermissions } from "@adamstavely/trenchcoat/angular/tool-permissions";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tool-permissions";` |

## Example

The live example is in the gallery at `#/tool-permissions`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The setup screen for what each agent may do with each tool, decided ahead of time instead of one prompt at a time.
Tools and their scopes are the rows (“GitHub · Push to main”), agents are the columns, and every cell is Allow, Ask
or Deny. Presets such as “Read only” and “Ask first” set the whole matrix in one click, risky and destructive
scopes are marked, and a destructive scope never offers Allow. A summary lists every cell that differs from what
was last saved – “Coder · Slack post in channels, Ask → Allow” – with Reset and Save.

### When to use

- An admin or settings page where people decide which agents may read, write or act in connected tools.
- Several agents that share the same tools but need different limits.
- Reviewing and saving a batch of permission changes together, with a clear list of what will change.

### When not to use

- An agent asking for a right in the middle of a run – use [Permission Request](permission-request.md).
- One overall setting for how much an agent does on its own – use [Autonomy Dial](autonomy-dial.md).
- Approving a single action an agent is about to take – use [Approval Card](approval-card.md).
- A general table of values people edit and sort – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Presets** `.ui-tperm__presets` – one-click setups; the one that matches the matrix is checked
2. **Agent** `.ui-tperm__agent` – a column: avatar or initials, name and model
3. **Tool** `.ui-tperm__group` – a row heading with the tool's mark and name
4. **Scope** `.ui-tperm__scope` – a row: what the agent may do, its risk and a quiet description
5. **Cell** `.ui-tperm__cell` – Allow, Ask and Deny as a small segmented control
6. **Changes** `.ui-tperm__summary` – every cell that differs from what was saved
7. **Save** `.ui-tperm__answer` – Reset and Save, with the number of changes

## Looks

Standard is a white card on a gray tray, with Reset and Save sitting on the tray below it. Clean is one white card
with Reset and Save in its last row. The cells, presets and summary work the same in both.

## Usage

### HTML

```html
<tc-tool-permissions id="perms" heading="Tool permissions"></tc-tool-permissions>

<script type="module">
  import "@adamstavely/trenchcoat/tool-permissions";
  import "@adamstavely/trenchcoat/tokens.css";

  const perms = document.querySelector("#perms");
  perms.agents = [{ id: "coder", name: "Coder", model: "Sonnet" }, { id: "ops", name: "Ops", model: "Opus" }];
  perms.tools = [
    {
      id: "github",
      name: "GitHub",
      scopes: [
        { id: "read", label: "Read code" },
        { id: "push", label: "Push to main", risk: "destructive" },
      ],
    },
  ];
  perms.value = { coder: { "github/read": "allow", "github/push": "ask" } };
  perms.addEventListener("tc-save", (e) => fetch("/api/permissions", { method: "PUT", body: JSON.stringify(e.detail.value) }));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ToolPermissions, type ToolPermissionMatrix, type ToolPermissionTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const tools: ToolPermissionTool[] = [
  { id: "github", name: "GitHub", scopes: [{ id: "read", label: "Read code" }, { id: "push", label: "Push to main", risk: "destructive" }] },
];

export function Permissions() {
  const [value, setValue] = useState<ToolPermissionMatrix>({ coder: { "github/read": "allow" } });
  const [saved, setSaved] = useState(value);
  return (
    <ToolPermissions
      title="Tool permissions"
      agents={[{ id: "coder", name: "Coder", model: "Sonnet" }]}
      tools={tools}
      value={value}
      onChange={setValue}
      saved={saved}
      onSave={setSaved}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tool-permissions";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";

defineProps<{ agents: TcToolPermissions["agents"]; tools: TcToolPermissions["tools"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tool-permissions :agents="agents" :tools="tools" @tc-value-change="onValueChange"></tc-tool-permissions>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ToolPermissions } from "@adamstavely/trenchcoat/angular/tool-permissions";
import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";

@Component({
  selector: "app-tool-permissions-example",
  imports: [ToolPermissions],
  template: `<tc-tool-permissions [agents]="agents()" [tools]="tools()" (tc-value-change)="onValueChange($event)"></tc-tool-permissions>`,
})
export class ToolPermissionsExample {
  readonly agents = input.required<TcToolPermissions["agents"]>();
  readonly tools = input.required<TcToolPermissions["tools"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-permissions";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";

  let { agents, tools }: { agents: TcToolPermissions["agents"]; tools: TcToolPermissions["tools"] } = $props();
  let el: TcToolPermissions;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tool-permissions bind:this={el} {agents} {tools}></tc-tool-permissions>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Tool permissions"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `agents` | – | `ToolPermissionAgent[]` | `[]` | The columns |
| `tools` | – | `ToolPermissionTool[]` | `[]` | The rows: each tool's scopes, grouped under the tool |
| `value` | – | `ToolPermissionMatrix` | `{}` | The matrix. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `saved` | – | `ToolPermissionMatrix \| undefined` | `undefined` | What was last saved – the summary lists the differences. Unset: the value the element first showed |
| `defaultLevel` | `default-level` | `ToolPermissionLevel` | `"ask"` | A cell missing from the value |
| `presets` | – | `ToolPermissionPreset[]` | `[ { id: "read-only", label: "Read only", description: "Safe scopes allowed, everything else denied", level: (s) => ((s.risk ?? "safe") === "safe" ? "allow" : "deny") }, { id: "ask-first", label: "Ask first", description: "Safe scopes allowed, the rest ask every time", level: (s) => ((s.risk ?? "safe") === "safe" ? "allow" : "ask") }, { id: "trusted", label: "Trusted", description: "Only destructive scopes ask", level: (s) => (s.risk === "destructive" ? "ask" : "allow") }, { id: "locked", label: "Locked", description: "Every scope asks", level: () => "ask" }, ]` | One-click setups; [] hides the row |
| `changesLimit` | `changes-limit` | `number` | `4` | Changes listed before "N more" |
| `saveLabel` | `save-label` | `string` | `"Save"` | The Save button's text; the number of changes is shown beside it |
| `resetLabel` | `reset-label` | `string` | `"Reset"` | The text of the button that puts back what was last saved |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A cell, a preset or Reset changed the matrix ({ value, changes, cause }: ToolPermissionValueChange); cancelable |
| `tc-save` | – | Yes | Save was pressed ({ value, changes }: ToolPermissionSave); cancelable – unless prevented, `saved` becomes the value |

#### Design tokens it reads (101)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-weight`, `--tc-avatar-radius-agent`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultToolPermissionPresets: ToolPermissionPreset[]` | The presets used when the page gives none: they read each scope's risk |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-tool-permissions :agents="…">` | `<tc-tool-permissions [agents]="…">` | `<tc-tool-permissions {agents}>` |
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-tool-permissions :tools="…">` | `<tc-tool-permissions [tools]="…">` | `<tc-tool-permissions {tools}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-tool-permissions :value="…">` | `<tc-tool-permissions [value]="…">` | `<tc-tool-permissions {value}>` |
| `saved` | `el.saved = …;` | `<… saved={…} />` | `<tc-tool-permissions :saved="…">` | `<tc-tool-permissions [saved]="…">` | `<tc-tool-permissions {saved}>` |
| `presets` | `el.presets = …;` | `<… presets={…} />` | `<tc-tool-permissions :presets="…">` | `<tc-tool-permissions [presets]="…">` | `<tc-tool-permissions {presets}>` |

*Also attributes: `heading`, `description`, `default-level`, `changes-limit`, `save-label`, `reset-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-save` | Yes | `el.addEventListener("tc-save", (e) => …)` | `onSave={…}` | `@tc-save="…"` | `(tc-save)="…($event)"` | `el.addEventListener("tc-save", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tool-permissions id="tool-permissions"></tc-tool-permissions>

<script type="module">
  import "@adamstavely/trenchcoat/tool-permissions";

  const el = document.querySelector("#tool-permissions");
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
import { ToolPermissions } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ToolPermissions>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledToolPermissions({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ToolPermissions {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/tool-permissions";
import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";

const props = defineProps<{ initial: TcToolPermissions["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcToolPermissions["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-tool-permissions :value="value" @tc-value-change="onValueChange"></tc-tool-permissions>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ToolPermissions } from "@adamstavely/trenchcoat/angular/tool-permissions";
import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";

@Component({
  selector: "app-controlled-tool-permissions",
  imports: [ToolPermissions],
  template: `<tc-tool-permissions [value]="value()" (tc-value-change)="onValueChange($event)"></tc-tool-permissions>`,
})
export class ControlledToolPermissions {
  readonly initial = input.required<TcToolPermissions["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcToolPermissions["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tool-permissions";
  import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";

  let { initial }: { initial: TcToolPermissions["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcToolPermissions;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcToolPermissions["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-tool-permissions bind:this={el} {value}></tc-tool-permissions>
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
<tc-tool-permissions :value="value" @tc-value-change="value = $event.detail.value"></tc-tool-permissions>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-tool-permissions [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-tool-permissions>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-tool-permissions bind:this={el} {value}></tc-tool-permissions>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tool-permissions")` returns a `TcToolPermissions` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";`
- **React / Next.js:** Props: `import type { ToolPermissionsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ToolPermissions>`. The element class, for refs: `import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcToolPermissions["agents"]` with `import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";`
- **Angular:** The directive types the template: `[agents]` takes `TcToolPermissions["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcToolPermissions } from "@adamstavely/trenchcoat/tool-permissions";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `agents` | `ToolPermissionAgent[]` | The columns: one per agent, with an optional avatar node and model name |
| `tools` | `ToolPermissionTool[]` | The rows: each tool's scopes, grouped under the tool |
| `value` | `ToolPermissionMatrix` | The matrix – controlled when given |
| `defaultValue` | `ToolPermissionMatrix` | The matrix on mount when `value` isn't controlled – a missing cell is `defaultLevel` |
| `onChange` | `(value: ToolPermissionMatrix, detail: Omit<ToolPermissionValueChange, "value">) => void` | A cell, a preset or Reset changed the matrix; `detail` says which and lists the changes since the last save |
| `saved` | `ToolPermissionMatrix` | What was last saved – controlled when given; otherwise the first value, then whatever Save stores |
| `onSave` | `(value: ToolPermissionMatrix, changes: ToolPermissionChange[]) => void` | Save was pressed – store the value; the summary then starts from it |

*Renamed or hidden on the wrapper: `heading`, `agents`, `tools`, `value`, `saved`, `onChange`, `defaultValue`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The matrix is one tab stop; inside it the arrows move between cells.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the next cell in that direction |
| Home / End | Moves to the first or last cell in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell of the matrix |
| Page Up / Page Down | Moves five rows up or down |
| Space / Enter | Steps the cell to its next choice; with Shift, to the previous one |
| 1 / 2 / 3 | Sets the cell to Allow, Ask or Deny (if the scope offers it) |
| Delete / Backspace | Puts back the cell's saved choice |
| Tab | Leaves the matrix |

In the presets, ← / → / ↑ / ↓ move to the next or previous preset and apply it straight away.

### Screen readers

The matrix is a `grid` named by the heading, with agents as column headers and each scope as a row header that
includes its tool (“GitHub · Push to main”). A cell reads its choice and, if it differs from what was saved,
“changed from” the old one – “Allow, changed from Ask” – and is described by “Space changes it, 1 Allow, 2 Ask, 3
Deny”. Every change is confirmed in a polite status message: “Coder, Slack Post in channels: Allow”, “Ask first
applied”, “Changes undone”, “Saved 2 changes”. Presets are a `radiogroup` labelled “Presets”. The summary is a
section headed “Changes” or “No changes”; Reset and Save are `aria-disabled` while nothing has changed.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.7 KB | 9.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **45.2 KB** | **12.1 KB** |
| With Lit – the first component on a page | 66.9 KB | 19.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.9 ms** | the gallery demo's data, 515 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of presets replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.6 ms | presets: first render, 611 nodes; update 1.2 ms |
| 1,000 items | 15 ms | presets: first render, 1,511 nodes; update 5.1 ms |

1,000 items of presets: 15 ms, 1,511 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name scopes as actions an agent takes: “Read code”, “Open pull requests”, “Issue refunds”.
- Use `description` for the limit or consequence that matters: “Up to $500 per refund”, “Skips review”.
- Mark `risk` honestly – “risky” for anything others see, “destructive” for anything hard to undo.
- Give presets short names and a one-line `description`; it's the preset's tooltip.
- Use `description` on the element to say when changes take effect (“Runs pick this up at their next step”).

## Do and don't

### Do

- Keep `saved` in step with what your server stored, so the summary shows only real changes.
- Handle `tc-save` and store the value; call `preventDefault()` if the save fails, so the changes stay listed.
- Set `levels` on a scope when only some choices make sense, rather than explaining it in the label.

### Don't

- Don't put more than about five agents side by side – the scope column stays put, but the matrix scrolls sideways
  and the cells further right are easy to miss.
- Don't use it to grant one-off permissions mid-run; people expect those inline, at the moment of asking.
- Don't hide the summary – it's how people check what a preset changed before saving.

## Related

- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Autonomy Dial](autonomy-dial.md) – How much an agent may do on its own – a three-stop dial, and its real actions gliding between “Runs on its own” and “Asks you first”, with a lock for what always asks
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- `tc-tool-permissions` – a grid of agents × tool scopes, allow / ask / deny per cell (a destructive scope never offers allow), presets, a Custom state, and a summary of changes against `saved`. WAI-ARIA grid; `tc-value-change` with the cause, `tc-save`.
