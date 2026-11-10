<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Instruction Editor

**AI configuration** · New

System and developer instructions with variable chips, missing and unused warnings, an app-supplied token count, versions and a word diff

- **Element:** `<tc-instruction-editor>`
- **Size:** 27.1 KB gzip · 116.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/instruction-editor";` |
| React / Next.js | `import { InstructionEditor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/instruction-editor";` · tags starting with tc- are custom elements |
| Angular | `import { InstructionEditor } from "@adamstavely/trenchcoat/angular/instruction-editor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/instruction-editor";` |

## Example

The live example is in the gallery at `#/instruction-editor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An editor for the system or developer instructions a model works from. The text sits on a code surface with line
numbers, and every `{{variable}}` shows as a chip in place – red with a wavy underline when the app doesn't define
it. Below it, the variables the text uses and the ones the app defines are listed with how often each is used,
flagged when one is missing or unused, and insert at the caret with a click. A version rail lists saved versions;
picking one shows the changes since then as an inline word diff, with Restore. Save as a new version takes an
optional note. The token count is the app's, never estimated here.

### When to use

- Writing and maintaining the instructions behind an assistant or an agent, with their history.
- A playground beside `model-settings`, where people edit a prompt and compare it with what shipped.
- Reviewing what changed in a prompt before saving a version.

### When not to use

- Reviewing suggested edits to someone else's text, change by change – use [Inline Diff](inline-diff.md).
- Comparing two runs' outputs, steps and costs – use [Run Compare](run-compare.md).
- Promoting a whole configuration through draft, staging and production – use [Configuration release control](configuration-release-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tab bar** `.ui-ied__bar` – Edit and Changes since a version, and System or Developer
2. **Code surface** `.ui-ied__editor` – the text with line numbers and variable chips
3. **Status bar** `.ui-ied__status` – lines, variables and the app's token count against the limit
4. **Variables** `.ui-ied__vars` – each variable, how often it's used, and whether it's missing or unused
5. **Version rail** `.ui-ied__rail` – the working copy with Save, then the saved versions to compare with

## Looks

Standard is a white card on a gray tray: the code surface is a gray well, variables are violet chips, the diff is in
filled red and green, and the active tab has an ink underline. Clean is one white card: the surface is white inside a
hairline frame, variables are accent-tinted, removed words are struck through in gray, added ones underlined, and the
active tab's underline is the accent. Below 640 px of container width the version rail moves under the editor.

## Usage

### HTML

```html
<tc-instruction-editor id="prompt" token-count="412" token-limit="1000"></tc-instruction-editor>

<script type="module">
  import "@adamstavely/trenchcoat/instruction-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const prompt = document.querySelector("#prompt");
  prompt.value = { role: "system", text: "You are the support assistant for {{company}}." };
  prompt.variables = [{ name: "company", description: "The company's trading name" }];
  prompt.versions = [{ id: "v1", label: "v1", value: { role: "system", text: "You help customers." } }];
  prompt.addEventListener("tc-save", (e) => console.log("save", e.detail.version));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { InstructionEditor, type InstructionEditorValue, type InstructionVersion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Prompt() {
  const [value, setValue] = useState<InstructionEditorValue>({ role: "system", text: "You are the support assistant for {{company}}." });
  const [versions, setVersions] = useState<InstructionVersion[]>([]);
  return (
    <InstructionEditor
      title="Reply assistant"
      value={value}
      onChange={setValue}
      variables={[{ name: "company", description: "The company's trading name" }]}
      versions={versions}
      onSave={(_, next) => setVersions(next)}
      tokenCount={412} // from your provider's tokenizer
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/instruction-editor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";

defineProps<{ value: TcInstructionEditor["value"]; roles: TcInstructionEditor["roles"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-instruction-editor :value="value" :roles="roles" @tc-value-change="onValueChange"></tc-instruction-editor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { InstructionEditor } from "@adamstavely/trenchcoat/angular/instruction-editor";
import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";

@Component({
  selector: "app-instruction-editor-example",
  imports: [InstructionEditor],
  template: `<tc-instruction-editor [value]="value()" [roles]="roles()" (tc-value-change)="onValueChange($event)"></tc-instruction-editor>`,
})
export class InstructionEditorExample {
  readonly value = input.required<TcInstructionEditor["value"]>();
  readonly roles = input.required<TcInstructionEditor["roles"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/instruction-editor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";

  let { value, roles }: { value: TcInstructionEditor["value"]; roles: TcInstructionEditor["roles"] } = $props();
  let el: TcInstructionEditor;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-instruction-editor bind:this={el} {value} {roles}></tc-instruction-editor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Instructions"` | The heading, and the group's name |
| `value` | – | `InstructionEditorValue` | `{ role: "system", text: "" }` | The role and the text. Changed by the user unless tc-value-change is prevented |
| `roles` | – | `InstructionRole[]` | `[ { id: "system", label: "System" }, { id: "developer", label: "Developer" }, ]` | Which instructions these can be; fewer than two hides the switch |
| `variables` | – | `InstructionVariable[]` | `[]` | The variables the app fills in; the text is checked against them |
| `versions` | – | `InstructionVersion[]` | `[]` | Saved versions, oldest first. Grows when Save isn't prevented |
| `compareTo` | `compare-to` | `string \| undefined` | `undefined` | The id of the version the text is compared with; unset compares with the latest |
| `tokenCount` | `token-count` | `number \| undefined` | `undefined` | The text's length in tokens, as the app counts it; unset shows no count |
| `tokenLimit` | `token-limit` | `number \| undefined` | `undefined` | The most tokens the instructions should use; past it the count turns red |
| `counting` | `counting` | `boolean` | `false` | The app is counting the tokens for the latest text |
| `placeholder` | `placeholder` | `string` | `"Say who the model is working for, what it should do and what it must not do. Use {{name}} for what the app fills in."` | Placeholder in the empty editor |
| `name` | `name` | `string` | `""` | Submitted with the form: the text |
| `readonly` | `readonly` | `boolean` | `false` | Shows everything but nothing can be changed |
| `variableUses` | – | `InstructionVariableUse[]` | – | Every variable the text uses or the app defines, with its status |
| `comparedVersion` | – | `InstructionVersion \| undefined` | – | The version the text is compared with |
| `dirty` | – | `boolean` | – | The text differs from the latest version (or there is none yet and the text isn't empty) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The text or the role changed, or a version was restored ({ value: InstructionEditorValue }); cancelable – prevent it to control `value` |
| `tc-save` | – | Yes | Save as a new version was pressed ({ version, versions }: InstructionSaveEvent); cancelable – prevented, `versions` stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `insertVariable(name: string)` | `void` | Inserts {{name}} at the caret, or in place of the selection |
| `save()` | `void` | Saves the text as a new version: fires tc-save and, unless it's prevented, adds the version |

#### Design tokens it reads (97)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-syntax-text`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `instructionVariables(text: string): Map<string, number>` | The variables a text uses, by name, with how often |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-instruction-editor :value="…">` | `<tc-instruction-editor [value]="…">` | `<tc-instruction-editor {value}>` |
| `roles` | `el.roles = …;` | `<… roles={…} />` | `<tc-instruction-editor :roles="…">` | `<tc-instruction-editor [roles]="…">` | `<tc-instruction-editor {roles}>` |
| `variables` | `el.variables = …;` | `<… variables={…} />` | `<tc-instruction-editor :variables="…">` | `<tc-instruction-editor [variables]="…">` | `<tc-instruction-editor {variables}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-instruction-editor :versions="…">` | `<tc-instruction-editor [versions]="…">` | `<tc-instruction-editor {versions}>` |

*Also attributes: `heading`, `compare-to`, `token-count`, `token-limit`, `counting`, `placeholder`, `name`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-save` | Yes | `el.addEventListener("tc-save", (e) => …)` | `onSave={…}` | `@tc-save="…"` | `(tc-save)="…($event)"` | `el.addEventListener("tc-save", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-instruction-editor id="instruction-editor"></tc-instruction-editor>

<script type="module">
  import "@adamstavely/trenchcoat/instruction-editor";

  const el = document.querySelector("#instruction-editor");
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
import { InstructionEditor } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof InstructionEditor>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledInstructionEditor({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <InstructionEditor {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/instruction-editor";
import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";

const props = defineProps<{ initial: TcInstructionEditor["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcInstructionEditor["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-instruction-editor :value="value" @tc-value-change="onValueChange"></tc-instruction-editor>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { InstructionEditor } from "@adamstavely/trenchcoat/angular/instruction-editor";
import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";

@Component({
  selector: "app-controlled-instruction-editor",
  imports: [InstructionEditor],
  template: `<tc-instruction-editor [value]="value()" (tc-value-change)="onValueChange($event)"></tc-instruction-editor>`,
})
export class ControlledInstructionEditor {
  readonly initial = input.required<TcInstructionEditor["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcInstructionEditor["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/instruction-editor";
  import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";

  let { initial }: { initial: TcInstructionEditor["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcInstructionEditor;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcInstructionEditor["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-instruction-editor bind:this={el} {value}></tc-instruction-editor>
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
<tc-instruction-editor :value="value" @tc-value-change="value = $event.detail.value"></tc-instruction-editor>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-instruction-editor [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-instruction-editor>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-instruction-editor bind:this={el} {value}></tc-instruction-editor>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-instruction-editor")` returns a `TcInstructionEditor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";`
- **React / Next.js:** Props: `import type { InstructionEditorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof InstructionEditor>`. The element class, for refs: `import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcInstructionEditor["value"]` with `import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";`
- **Angular:** The directive types the template: `[value]` takes `TcInstructionEditor["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcInstructionEditor } from "@adamstavely/trenchcoat/instruction-editor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group and the editor |
| `value` | `InstructionEditorValue` | The role and the text (controlled) |
| `defaultValue` | `InstructionEditorValue` | The role and the text to start with when uncontrolled |
| `onChange` | `(value: InstructionEditorValue) => void` | Called with the role and the text after every edit |
| `versions` | `InstructionVersion[]` | Saved versions, oldest first (controlled) |
| `defaultVersions` | `InstructionVersion[]` | The versions to start with when uncontrolled |
| `onSave` | `(version: InstructionVersion, versions: InstructionVersion[]) => void` | Save as a new version was pressed: `version` is the one to add, `versions` the list with it |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `versions`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the tabs, the role switch, the editor, the variables, the note, Save and the version rail |
| ← / → | On the tabs: the other tab; on the role switch: the other role |
| ↑ / ↓ / ← / → | In the version rail: picks the newer or older version and shows its changes |
| Home / End | On the tabs or in the rail: the first or last one |
| ⌘S / Ctrl+S | In the editor: saves a new version |
| Enter | In the note: saves a new version |
| Space / Enter | On a variable: inserts it at the caret |

The editor is a native textarea, with its usual keys, selection and undo.

### Screen readers

The host is a group named by the heading, and the textarea is named by it too. When the text uses a variable the
app doesn't define, the textarea is `aria-invalid` and described by “Uses variables the app doesn't define: tone”.
The chips on the surface are hidden; the textarea holds the same text. The tabs are a tablist named “View”, the
changes tab named with its counts – “Changes since v3 +15 −14 words”. The diff is a focusable region “Changes since
v3”, with “removed:” and “added:” read before each change. The rail is a radiogroup “Compare with”. Each variable
button reads “Insert {{company}} 1×, Trading name”. A status region announces “Saved as v4”, “Restored v2” and
“Inserted {{company}}”.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control, inline-diff | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-gutter | 94 | 97 | 18.2 | 18.2 | itself | Content can shift sideways when a scrollbar appears. |
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
| **This component alone** | 35.6 KB | 9.9 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **116.3 KB** | **27.2 KB** |
| With Lit – the first component on a page | 139.2 KB | 34.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 171 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of variables replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.1 ms | variables: first render, 747 nodes; update 0.7 ms |
| 1,000 items | 35 ms | variables: first render, 6,147 nodes; update 5.5 ms |

1,000 items of variables: 35 ms, 6,147 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control), `setTimeout` (inline-diff).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name variables in `snake_case` and describe each in a few words: “First name from the customer's profile”.
- Ask for a note on Save that says what changed and why: “Policy source and hand-over”.
- Keep the placeholder as guidance on what instructions need: who the model works for, what to do, what not to do.

## Do and don't

### Do

- Count tokens with the provider's own tokenizer and pass `tokenCount`; set `counting` while it runs.
- Pass `tokenLimit` when the instructions share a context budget, so people see when they run over.
- Keep `versions` on the server and pass them back after `tc-save`, with `by` and `at` filled in.

### Don't

- Don't estimate tokens from characters in production – the count people see should be the one you bill.
- Don't let a missing variable through to a release; the editor flags it, the app should block it.
- Don't put user messages or examples here; this edits the instructions, not the conversation.

## Related

- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Configuration release control](configuration-release-control.md) – A configuration version moving through environments: the pipeline, a gate on evidence and approvals, confirmed promote and rollback
