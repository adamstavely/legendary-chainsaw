<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Data Controls

**AI configuration** · New

A person's own data in an AI product – switches for improving the model with their chats, saving chat history and memory, each saying what it means and when it last changed, Export my data with its status, Delete all chats behind a confirmation that names how many go, and Delete account

- **Element:** `<tc-data-controls>`
- **Size:** 9.0 KB gzip · 27.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/data-controls";` |
| React / Next.js | `import { DataControls } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/data-controls";` · tags starting with tc- are custom elements |
| Angular | `import { DataControls } from "@adamstavely/trenchcoat/angular/data-controls";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/data-controls";` |

## Example

The live example is in the gallery at `#/data-controls`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A person's own data in an AI product, in one card. Three switches say what they do in words and when each was last
changed: whether their chats help improve the model, whether chat history is saved, and whether the assistant keeps
memories, with a link to manage them. Turning history off says plainly that new chats are deleted after 30 days.
Below the switches, Export my data asks for a copy of everything and then says a link will be emailed; Delete all chats
opens a confirmation that names how many chats go and that it can't be undone; and Delete account sits at the end.

### When to use

- The privacy or data section of a person's settings in an AI product.
- Giving people a clear, reversible say over training, history and memory.
- A self-serve export and delete, so people don't need to write to support.

### When not to use

- Workspace-wide rules for retention, logs and training – use [Data handling policy](data-handling-policy.md).
- Seeing and editing what the assistant remembers – use [Memory Panel](memory-panel.md), and link to it with `memoryHref`.
- Where a workspace's data is stored – use [Data Region](data-region.md).
- Agreeing to terms – use [Terms Dialog](terms-dialog.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Switch row** `.ui-dcl__row` – one setting: its name, what it means now and when it last changed
2. **Switch** `.ui-dcl__switch` – a button with `role="switch"`
3. **Meaning** `.ui-dcl__means` – what the setting does in its current state
4. **History note** `.ui-dcl__note` – shown while chat history is off
5. **Export** `.ui-dcl__export` – Export my data, with its status (`.ui-dcl__status`) beside it
6. **Delete all chats** `.ui-dcl__delete` – opens the confirmation (`.ui-dcl__dialog`)
7. **Delete account** `.ui-dcl__danger-link` – a link, or a button that fires `tc-delete-account`

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The confirmation is the same modal dialog in both; its width is the component token `--tc-dcl-dialog-w`.

## Usage

### HTML

```html
<tc-data-controls id="data" heading="Your data" chat-count="342" memory-href="/settings/memory"></tc-data-controls>

<script type="module">
  import "@adamstavely/trenchcoat/data-controls";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#data");
  card.value = { training: false, history: true, memory: true };
  card.changed = { training: Date.parse("2026-09-03") };
  card.addEventListener("tc-value-change", (e) => console.log(e.detail.field, e.detail.value));
  card.addEventListener("tc-export", () => console.log("export requested"));
  card.addEventListener("tc-delete-chats", (e) => console.log("delete", e.detail.count, "chats"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DataControls, type DataControlsValue, type DataExportStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PrivacySettings({ chats }: { chats: number }) {
  const [value, setValue] = useState<DataControlsValue>({ training: false, history: true, memory: true });
  const [exportStatus, setExportStatus] = useState<DataExportStatus>("idle");
  return (
    <DataControls
      title="Your data"
      value={value}
      onValueChange={(next) => setValue(next)}
      chatCount={chats}
      memoryHref="/settings/memory"
      exportStatus={exportStatus}
      onExport={() => setExportStatus("requested")}
      onDeleteChats={(count) => console.log("delete", count)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/data-controls";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";

defineProps<{ value: TcDataControls["value"]; changed: TcDataControls["changed"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-data-controls :value="value" :changed="changed" @tc-value-change="onValueChange"></tc-data-controls>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DataControls } from "@adamstavely/trenchcoat/angular/data-controls";
import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";

@Component({
  selector: "app-data-controls-example",
  imports: [DataControls],
  template: `<tc-data-controls [value]="value()" [changed]="changed()" (tc-value-change)="onValueChange($event)"></tc-data-controls>`,
})
export class DataControlsExample {
  readonly value = input.required<TcDataControls["value"]>();
  readonly changed = input.required<TcDataControls["changed"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-controls";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";

  let { value, changed }: { value: TcDataControls["value"]; changed: TcDataControls["changed"] } = $props();
  let el: TcDataControls;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-data-controls bind:this={el} {value} {changed}></tc-data-controls>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Data controls"` | The heading |
| `description` | `description` | `string` | `""` | One line under the heading |
| `value` | – | `DataControlsValue` | `{ training: false, history: true, memory: true }` | The switches. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `changed` | – | `Partial<Record<DataControlsField, number>>` | `{}` | When each switch was last changed, epoch ms – the page records the change and passes it back |
| `chatCount` | `chat-count` | `number` | `0` | How many chats Delete all chats removes |
| `memoryHref` | `memory-href` | `string` | `""` | Where memories are managed; leave it unset and Manage memory isn't shown |
| `deleteAccountHref` | `delete-account-href` | `string` | `""` | Where deleting the account starts; unset, Delete account fires tc-delete-account |
| `exportStatus` | `export-status` | `DataExportStatus` | `"idle"` | Where the export stands: idle, requested (a link will be emailed), ready or failed. Set to requested by Export my data unless prevented |
| `exportHref` | `export-href` | `string` | `""` | The finished export's link, shown when `exportStatus` is ready |
| `hideDeleteAccount` | `hide-delete-account` | `boolean` | `false` | Hides Delete account |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<DataControlsLabels>` | `{}` | The card's words, merged over defaultDataControlsLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A switch was flipped ({ value, field }: DataControlsValueChange); cancelable – prevented, the switch stays as it was |
| `tc-export` | – | Yes | Export my data was pressed (detail: {}); cancelable – prevented, the status doesn't change |
| `tc-delete-chats` | – | Yes | Delete chats was confirmed ({ count }: DataControlsDeleteChats); cancelable – prevented, the dialog stays open |
| `tc-delete-account` | – | No | Delete account was pressed, when there's no `deleteAccountHref` (detail: {}) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dcl-dialog-w` | `400px` | both |

#### Design tokens it reads (62)

`--tc-accent-text`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-scrim`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-data-controls :value="…">` | `<tc-data-controls [value]="…">` | `<tc-data-controls {value}>` |
| `changed` | `el.changed = …;` | `<… changed={…} />` | `<tc-data-controls :changed="…">` | `<tc-data-controls [changed]="…">` | `<tc-data-controls {changed}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-data-controls :labels="…">` | `<tc-data-controls [labels]="…">` | `<tc-data-controls {labels}>` |

*Also attributes: `heading`, `description`, `chat-count`, `memory-href`, `delete-account-href`, `export-status`, `export-href`, `hide-delete-account` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-export` | Yes | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |
| `tc-delete-chats` | Yes | `el.addEventListener("tc-delete-chats", (e) => …)` | `onDeleteChats={…}` | `@tc-delete-chats="…"` | `(tc-delete-chats)="…($event)"` | `el.addEventListener("tc-delete-chats", …)` |
| `tc-delete-account` | No | `el.addEventListener("tc-delete-account", (e) => …)` | `onDeleteAccount={…}` | `@tc-delete-account="…"` | `(tc-delete-account)="…($event)"` | `el.addEventListener("tc-delete-account", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-data-controls id="data-controls"></tc-data-controls>

<script type="module">
  import "@adamstavely/trenchcoat/data-controls";

  const el = document.querySelector("#data-controls");
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
import "@adamstavely/trenchcoat/data-controls";
import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";

const props = defineProps<{ initial: TcDataControls["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcDataControls["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-data-controls :value="value" @tc-value-change="onValueChange"></tc-data-controls>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DataControls } from "@adamstavely/trenchcoat/angular/data-controls";
import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";

@Component({
  selector: "app-controlled-data-controls",
  imports: [DataControls],
  template: `<tc-data-controls [value]="value()" (tc-value-change)="onValueChange($event)"></tc-data-controls>`,
})
export class ControlledDataControls {
  readonly initial = input.required<TcDataControls["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcDataControls["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-controls";
  import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";

  let { initial }: { initial: TcDataControls["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcDataControls;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcDataControls["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-data-controls bind:this={el} {value}></tc-data-controls>
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
<tc-data-controls :value="value" @tc-value-change="value = $event.detail.value"></tc-data-controls>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-data-controls [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-data-controls>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-data-controls bind:this={el} {value}></tc-data-controls>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-data-controls")` returns a `TcDataControls` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";`
- **React / Next.js:** Props: `import type { DataControlsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DataControls>`. The element class, for refs: `import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDataControls["value"]` with `import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";`
- **Angular:** The directive types the template: `[value]` takes `TcDataControls["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDataControls } from "@adamstavely/trenchcoat/data-controls";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `value` | `DataControlsValue` | The switches – controlled when given |
| `defaultValue` | `DataControlsValue` | The switches on mount, when `value` isn't controlled |
| `onValueChange` | `(value: DataControlsValue, field: DataControlsField) => void` | A switch was flipped: the whole value and the field that changed |
| `onExport` | `() => boolean \| void` | Export my data was pressed; return false to keep the status as it is |
| `onDeleteChats` | `(count: number) => boolean \| void` | Delete chats was confirmed; return false to keep the dialog open |
| `onDeleteAccount` | `() => void` | Delete account was pressed, when there's no `deleteAccountHref` |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the switches, links and buttons |
| Space / Enter | Flips a switch, or presses a button |
| Escape | Closes the confirmation without deleting anything |

In the confirmation, focus starts on Cancel, and Tab stays inside the dialog until it closes.

### Screen readers

Each switch is named by its setting ("Save chat history") and described by what it means right now, so turning it
on or off reads the new meaning. Changes, the export request and deleting chats are confirmed in a polite status
message. The confirmation is a modal dialog named by its question ("Delete all 342 chats?") and described by
"This can't be undone". When it closes, focus returns to Delete all chats.

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
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 18.4 KB | 6.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.8 KB** | **9.0 KB** |
| With Lit – the first component on a page | 47.4 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 72 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |

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

- Say what a setting does, not what it is: "Your chats aren't used to train models", not "Training: off".
- Name consequences before they happen: how many chats a delete removes, and that it can't be undone.
- Keep the 30-day note accurate to your product's retention; rename it with `labels.historyOff`.

## Do and don't

### Do

- Record when a setting changes and pass it back in `changed`, so people can see their last decision.
- Send the export link by email and set `exportStatus` to `ready` (with `exportHref`) when it's done.
- Link Manage memory to the place memories are actually edited.

### Don't

- Don't turn a switch back on for people – let them decide.
- Don't skip the confirmation for Delete all chats.
- Don't hide Delete account if people can delete their account; use `hide-delete-account` only when they can't.

## Related

- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [Data Region](data-region.md) – Where a workspace's data lives, item by item in words, and a flow to move it – region cards with latency and what isn't available there, the move's impact, a date, time and time zone, a confirmation by typing the workspace's name, and the migration's steps as they happen
- [Terms Dialog](terms-dialog.md) – Agreeing to terms in a modal designed for reading – version and date, a jump list, what changed since you last agreed, required and optional consents, and Accept that says why it waits
