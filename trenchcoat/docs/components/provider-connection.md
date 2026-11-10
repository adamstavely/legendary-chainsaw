<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Provider connection

**AI configuration** · New

A model provider connection read as a path – endpoint, credential, deployment – with each hop's health from an app-run test, the last check and the models it reports

- **Element:** `<tc-provider-connection>`
- **Size:** 13.2 KB gzip · 49.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/provider-connection";` |
| React / Next.js | `import { ProviderConnection } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/provider-connection";` · tags starting with tc- are custom elements |
| Angular | `import { ProviderConnection } from "@adamstavely/trenchcoat/angular/provider-connection";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/provider-connection";` |

## Example

The live example is in the gallery at `#/provider-connection`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One connection to a model provider, read as a path: your app, the endpoint, the credential, the deployment or model.
Each hop says how it fared in the last test – reachable, accepted, available – so when something fails, the hop that
failed is the one that stands out, with what went wrong and when it was checked under it. The models the endpoint
reports sit below as chips. The fields only open while someone edits, from Edit or by clicking a hop. The credential is
always a reference your server resolves, shown masked (“•••• 4f2a”); the key itself never reaches the page.

The element tests nothing itself. Test connection fires `tc-test` with the config and an `AbortSignal`; your app tries
the connection and sets `check` with what it found.

### When to use

- Setting up, or checking on, the connection an AI feature runs on: provider, endpoint, deployment, key.
- An admin page where people need to see quickly whether the connection works, and why not when it doesn't.
- Rotating a credential or moving to a new deployment, then confirming it still works.

### When not to use

- Choosing which already-configured model a conversation uses – use [Model Picker](model-picker.md).
- Deciding which of several connections handles a request, with fallbacks – use [Model Routing](model-routing.md).
- Connecting a general third-party service with its own settings – use [Integration Settings](integration-settings.md).
- Entering a secret itself – use [Secret Field](secret-field.md), in a flow that stores it server-side.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Path** `.ui-prv__path` – your app → endpoint → credential → deployment
2. **Hop** `.ui-prv__node` – one stop on the path with its health; opens the fields at that stop
3. **Status** `.ui-prv__pill` – Not tested, Testing, Connected or what failed
4. **Health** `.ui-prv__health` – what the last test found, when, how fast, with Edit and Test
5. **Models** `.ui-prv__chips` – the models the endpoint reports; the one in use is marked

## Looks

Standard is a white card on the gray tray; the hops are tinted tiles, the health sits in a tinted band and the status
is a filled pill. Clean is one white card: the hops are hairline outlines, the health is a quiet row under a divider,
the status is a dot and a word, and the icons are thinner. A failed hop is tinted in both.

## Usage

### HTML

```html
<tc-provider-connection id="conn" description="Support assistant"></tc-provider-connection>

<script type="module">
  import "@adamstavely/trenchcoat/provider-connection";
  import "@adamstavely/trenchcoat/tokens.css";

  const conn = document.querySelector("#conn");
  conn.providers = [{ id: "azure", label: "Azure OpenAI", deploymentLabel: "Deployment" }];
  conn.credentials = [{ id: "kv/prod", label: "Production key", hint: "4f2a", expires: "Expires 14 Jan" }];
  conn.value = { provider: "azure", endpoint: "https://northwind.openai.azure.com", deployment: "support", credentialRef: "kv/prod" };
  conn.addEventListener("tc-test", async (e) => {
    const res = await fetch("/api/provider/test", { method: "POST", body: JSON.stringify(e.detail.value), signal: e.detail.signal });
    conn.check = await res.json(); // { status, at, latencyMs, models }
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ProviderConnection, type ProviderConnectionCheck, type ProviderConnectionValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ModelConnection({ start, test }: { start: ProviderConnectionValue; test: (v: ProviderConnectionValue, signal: AbortSignal) => Promise<ProviderConnectionCheck> }) {
  const [value, setValue] = useState(start);
  const [check, setCheck] = useState<ProviderConnectionCheck | null>(null);
  return <ProviderConnection value={value} onChange={setValue} check={check} onTest={(v, signal) => void test(v, signal).then(setCheck, () => {})} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/provider-connection";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";

defineProps<{ value: TcProviderConnection["value"]; providers: TcProviderConnection["providers"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-provider-connection :value="value" :providers="providers" @tc-value-change="onValueChange"></tc-provider-connection>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProviderConnection } from "@adamstavely/trenchcoat/angular/provider-connection";
import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";

@Component({
  selector: "app-provider-connection-example",
  imports: [ProviderConnection],
  template: `<tc-provider-connection [value]="value()" [providers]="providers()" (tc-value-change)="onValueChange($event)"></tc-provider-connection>`,
})
export class ProviderConnectionExample {
  readonly value = input.required<TcProviderConnection["value"]>();
  readonly providers = input.required<TcProviderConnection["providers"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/provider-connection";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";

  let { value, providers }: { value: TcProviderConnection["value"]; providers: TcProviderConnection["providers"] } = $props();
  let el: TcProviderConnection;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-provider-connection bind:this={el} {value} {providers}></tc-provider-connection>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `ProviderConnectionValue` | `{ provider: "", endpoint: "", deployment: "", credentialRef: "" }` | The connection. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `providers` | – | `ProviderConnectionOption[]` | `[]` | The providers to choose from; with none, the Provider row is hidden |
| `credentials` | – | `ProviderConnectionCredential[]` | `[]` | The credential references to choose from; with none, the reference is typed in |
| `check` | – | `ProviderConnectionCheck \| null` | `null` | The app's answer to the last test; setting it ends Testing… |
| `stateLabels` | – | `Partial<Record<ProviderConnectionState, string>>` | `{}` | The states' short names, merged over PROVIDER_CONNECTION_LABELS |
| `heading` | `heading` | `string` | `"Model provider"` | Names the group, shown at the top |
| `description` | `description` | `string` | `""` | A quieter line under the heading |
| `testLabel` | `test-label` | `string` | `"Test connection"` | The test button's text |
| `originLabel` | `origin-label` | `string` | `"Your app"` | The first stop on the path, before the endpoint |
| `name` | `name` | `string` | `""` | Submitted with the form: the connection as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the connection out of the form; a disabled fieldset does the same |
| `health` | – | `ProviderConnectionState` | – | The health shown now |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The connection changed ({ value: ProviderConnectionValue }); cancelable – prevent it to control `value` |
| `tc-test` | – | Yes | Test connection was pressed ({ value, signal }: ProviderConnectionTestEvent); try the connection and set `check`. Cancelable – prevented, nothing shows as testing |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `test()` | `void` | Asks the app to test the connection, as Test connection does |
| `cancel()` | `void` | Stops a test in progress: its signal aborts |

#### Design tokens it reads (108)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `PROVIDER_CONNECTION_LABELS: Record<ProviderConnectionState, string>` | The states' short names, for the pill |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-provider-connection :value="…">` | `<tc-provider-connection [value]="…">` | `<tc-provider-connection {value}>` |
| `providers` | `el.providers = …;` | `<… providers={…} />` | `<tc-provider-connection :providers="…">` | `<tc-provider-connection [providers]="…">` | `<tc-provider-connection {providers}>` |
| `credentials` | `el.credentials = …;` | `<… credentials={…} />` | `<tc-provider-connection :credentials="…">` | `<tc-provider-connection [credentials]="…">` | `<tc-provider-connection {credentials}>` |
| `check` | `el.check = …;` | `<… check={…} />` | `<tc-provider-connection :check="…">` | `<tc-provider-connection [check]="…">` | `<tc-provider-connection {check}>` |
| `stateLabels` | `el.stateLabels = …;` | `<… stateLabels={…} />` | `<tc-provider-connection :stateLabels="…">` | `<tc-provider-connection [stateLabels]="…">` | `<tc-provider-connection {stateLabels}>` |

*Also attributes: `heading`, `description`, `test-label`, `origin-label`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-test` | Yes | `el.addEventListener("tc-test", (e) => …)` | `onTest={…}` | `@tc-test="…"` | `(tc-test)="…($event)"` | `el.addEventListener("tc-test", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-provider-connection id="provider-connection"></tc-provider-connection>

<script type="module">
  import "@adamstavely/trenchcoat/provider-connection";

  const el = document.querySelector("#provider-connection");
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
import { ProviderConnection } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ProviderConnection>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledProviderConnection({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ProviderConnection {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/provider-connection";
import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";

const props = defineProps<{ initial: TcProviderConnection["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcProviderConnection["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-provider-connection :value="value" @tc-value-change="onValueChange"></tc-provider-connection>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ProviderConnection } from "@adamstavely/trenchcoat/angular/provider-connection";
import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";

@Component({
  selector: "app-controlled-provider-connection",
  imports: [ProviderConnection],
  template: `<tc-provider-connection [value]="value()" (tc-value-change)="onValueChange($event)"></tc-provider-connection>`,
})
export class ControlledProviderConnection {
  readonly initial = input.required<TcProviderConnection["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcProviderConnection["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/provider-connection";
  import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";

  let { initial }: { initial: TcProviderConnection["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcProviderConnection;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcProviderConnection["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-provider-connection bind:this={el} {value}></tc-provider-connection>
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
<tc-provider-connection :value="value" @tc-value-change="value = $event.detail.value"></tc-provider-connection>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-provider-connection [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-provider-connection>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-provider-connection bind:this={el} {value}></tc-provider-connection>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-provider-connection")` returns a `TcProviderConnection` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";`
- **React / Next.js:** Props: `import type { ProviderConnectionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProviderConnection>`. The element class, for refs: `import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProviderConnection["value"]` with `import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";`
- **Angular:** The directive types the template: `[value]` takes `TcProviderConnection["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProviderConnection } from "@adamstavely/trenchcoat/provider-connection";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group |
| `value` | `ProviderConnectionValue` | The connection (controlled) |
| `defaultValue` | `ProviderConnectionValue` | The connection to start with when uncontrolled |
| `onChange` | `(value: ProviderConnectionValue) => void` | Called with the whole connection after every change |
| `onTest` | `(value: ProviderConnectionValue, signal: AbortSignal) => void` | Test connection was pressed: try `value`, stop when `signal` aborts, then set `check` |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the hops, Edit, Test connection and, while editing, the fields |
| Enter / Space | On a hop, opens the fields and focuses that hop's field; on Edit or Done, opens or closes the fields; on Test connection, runs the test; on Cancel, stops it |
| Enter | In the endpoint or deployment field, saves the field and runs the test |
| Escape | While testing, cancels the test; while editing (with an endpoint set), closes the fields and returns focus to Edit |

The fields are native controls (select, inputs), so their own keys are the browser's.

### Screen readers

The host is a group named by the heading. The path is an ordered list labelled “Connection path”; each hop is a
button read as, for example, “Edit Credential Production key •••• 4f2a: Refused”, with `aria-expanded` showing whether
the fields are open. The status pill reads “Status: Auth failed”. A polite status message says “Testing the
connection…”, then the result – “Authentication failed. The endpoint turned the credential down…” – or “Test
cancelled.” A pasted key is refused with “That looks like a key. Enter the name of its reference instead…”, which is
also announced. The models are a list headed “Models the endpoint reports”.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 41.8 KB | 11.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.1 KB** | **13.3 KB** |
| With Lit – the first component on a page | 71.4 KB | 20.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 61 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of providers replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.7 ms | providers: first render, 61 nodes; update 0.1 ms |
| 1,000 items | 0.8 ms | providers: first render, 61 nodes; update 0.0 ms |

What it renders doesn't grow with providers (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 4 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the hops as your product does: `providers` sets the provider's name, its endpoint placeholder and whether it
  calls the third hop “Deployment” or “Model”; `originLabel` names the first stop.
- Give credentials a label people recognise (“Production key”) and a masked `hint` of the last characters. Put the
  expiry in `expires` as you'd say it: “Expires 14 Jan”.
- Pass the provider's own words in `check.message` when they help (“401 – the key isn't valid for this resource”);
  otherwise the element says what each state means and what to do next.
- Keep `at` honest: it's when your server checked, not when the page loaded.

## Do and don't

### Do

- Run the test on your server, resolve the credential there, and honour the signal – it aborts when someone cancels,
  edits the connection or leaves.
- Set `check` once you have an answer, even when it's a failure – that ends Testing….
- Report which hop failed precisely: `unreachable`, `auth-failed`, `expired` or `model-unavailable`.

### Don't

- Don't put a raw key in `value` or `credentials` – the element only holds references.
- Don't show Connected from a cached result after the config changed; the element marks such a check stale, and so
  should your server.
- Don't test automatically on every edit – testing spends quota and can lock a key out.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Model Routing](model-routing.md) – Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
