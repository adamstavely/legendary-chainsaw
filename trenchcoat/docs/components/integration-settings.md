<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Integration Settings

**Inputs & controls**

Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar

- **Element:** `<tc-integration-settings>`
- **Size:** 13.8 KB gzip · 53.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/integration-settings";` |
| React / Next.js | `import { IntegrationSettings } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/integration-settings";` · tags starting with tc- are custom elements |
| Angular | `import { IntegrationSettings } from "@adamstavely/trenchcoat/angular/integration-settings";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/integration-settings";` |

## Example

The live example is in the gallery at `#/integration-settings`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The settings card for one connected service. Its header shows the service's logo, name and status, with a switch
that pauses or resumes the sync straight away. Below it are the service's settings: an API key people generate,
reveal and copy, the site address with validation as they type, and a searchable time zone picker. Edits collect in
a save bar – “Unsaved changes”, with Discard and Save – so nothing is half-saved. Generating, switching and saving
can all be asynchronous; failures say so in place and keep what people entered.

### When to use

- The page or panel people reach after connecting a service, to configure it.
- Services whose setup is a key, an address and a few options, saved together.
- Pausing a sync without disconnecting it – the switch keeps the settings.

### When not to use

- Browsing and connecting services in the first place – use [Integration Picker](integration-picker.md).
- Choosing from a long list of values in a form field of your own – use [Combobox](combobox.md).
- A first-time setup that walks through several steps in order – use [Stepper Form](stepper-form.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the service's logo in the icon box, its name and status line, and the count and switch at the right
2. **Switch** `.ui-is__switch` – pauses or resumes the sync, and saves at once
3. **API key** `.ui-is__generate` – generates a key; then the key with Show, Copy and Regenerate
4. **Site address** `.ui-is__field` – the domain after a fixed https://, checked as it's typed
5. **Time zone** `.ui-is__zone-btn` – opens a searchable list of zones

## Looks

Standard sets the settings in a white card under the header on the gray tray, with a spinner while a key is
generated. Clean is one white card: the header with the switch on top, the settings in hairline-separated sections
with their labels, finer icons, a magnifier in the time zone search, and “Generating…” shimmering instead of a
spinner. In both, switching off folds the settings away.

## Usage

### HTML

```html
<tc-integration-settings id="shopify" name="Shopify" meta="Connected Mar 14 · syncing orders every 5 min"></tc-integration-settings>

<script type="module">
  import "@adamstavely/trenchcoat/integration-settings";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#shopify");
  card.values = { enabled: true, siteUrl: "northwind-goods.com", timeZone: "(GMT −05:00) New York", apiKey: null };
  card.generateKey = ({ signal }) => fetch("/api/keys", { method: "POST", signal }).then((r) => r.text());
  card.saveValues = (values, { signal }) => fetch("/api/shopify", { method: "PUT", body: JSON.stringify(values), signal }).then(() => {});
  card.addEventListener("tc-values-change", (e) => console.log("Saved", e.detail.values));
</script>
```

### React / Next.js

```tsx
import { IntegrationSettings, type IntegrationValues } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ShopifySettings({ saved }: { saved: IntegrationValues }) {
  return (
    <IntegrationSettings
      name="Shopify"
      logo={<img src="/logos/shopify.svg" alt="" width={24} height={24} />}
      meta="Connected Mar 14 · syncing orders every 5 min"
      defaultValues={saved}
      onGenerateKey={({ signal }) => fetch("/api/keys", { method: "POST", signal }).then((r) => r.text())}
      onSave={async (values, { signal }) => {
        await fetch("/api/shopify", { method: "PUT", body: JSON.stringify(values), signal });
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/integration-settings";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";

defineProps<{ logo: TcIntegrationSettings["logo"]; values: TcIntegrationSettings["values"] }>();
const onValuesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-integration-settings :logo="logo" :values="values" @tc-values-change="onValuesChange"></tc-integration-settings>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IntegrationSettings } from "@adamstavely/trenchcoat/angular/integration-settings";
import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";

@Component({
  selector: "app-integration-settings-example",
  imports: [IntegrationSettings],
  template: `<tc-integration-settings [logo]="logo()" [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-integration-settings>`,
})
export class IntegrationSettingsExample {
  readonly logo = input.required<TcIntegrationSettings["logo"]>();
  readonly values = input.required<TcIntegrationSettings["values"]>();
  onValuesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/integration-settings";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";

  let { logo, values }: { logo: TcIntegrationSettings["logo"]; values: TcIntegrationSettings["values"] } = $props();
  let el: TcIntegrationSettings;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-integration-settings bind:this={el} {logo} {values}></tc-integration-settings>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | The service's name, e.g. "Shopify" |
| `logo` | – | `Element \| undefined` | `undefined` | The service's logo (cloned) |
| `count` | `count` | `number \| undefined` | `undefined` | Small number next to the name, e.g. synced orders |
| `meta` | `meta` | `string \| undefined` | `undefined` | Line under the name, e.g. when it was connected |
| `values` | – | `Partial<IntegrationValues>` | `{}` | The saved values. Edits collect in the save bar; fields that weren't edited follow new values right away |
| `siteHint` | `site-hint` | `string` | `"Your store's primary domain, without https://"` | Helper text under the address field |
| `timeZones` | – | `string[]` | `[ "(GMT −08:00) Los Angeles", "(GMT −05:00) New York", "(GMT −03:00) São Paulo", "(GMT +00:00) London", "(GMT +01:00) Berlin", "(GMT +01:00) Amsterdam", "(GMT +01:00) Warsaw", "(GMT +02:00) Athens", "(GMT +04:00) Dubai", "(GMT +05:30) Mumbai", "(GMT +08:00) Singapore", "(GMT +09:00) Tokyo", "(GMT +10:00) Sydney", ]` | The time zones the picker offers, as labels like "(GMT +01:00) Berlin" – the first is the default |
| `generateKey` | – | `IntegrationKeyGenerator \| undefined` | `undefined` | Creates a key; without it a random `sk_demo_…` key is made up (and warns once, unless `demo` is set) |
| `saveValues` | – | `IntegrationSaver \| undefined` | `undefined` | Called with all values when Save is pressed |
| `toggleEnabled` | – | `IntegrationToggler \| undefined` | `undefined` | Called when the switch flips |
| `demo` | `demo` | `boolean` | `false` | Demo mode: keys are made up silently when generateKey is missing |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-values-change` | – | Yes | The saved values changed: after a save, or when the switch flipped ({ values: IntegrationValues }); cancelable |

#### Design tokens it reads (117)

`--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-halo-width`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `logo` | `el.logo = …;` | `<… logo={…} />` | `<tc-integration-settings :logo="…">` | `<tc-integration-settings [logo]="…">` | `<tc-integration-settings {logo}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-integration-settings :values="…">` | `<tc-integration-settings [values]="…">` | `<tc-integration-settings {values}>` |
| `timeZones` | `el.timeZones = …;` | `<… timeZones={…} />` | `<tc-integration-settings :timeZones="…">` | `<tc-integration-settings [timeZones]="…">` | `<tc-integration-settings {timeZones}>` |
| `generateKey` | `el.generateKey = …;` | `<… generateKey={…} />` | `<tc-integration-settings :generateKey="…">` | `<tc-integration-settings [generateKey]="…">` | `<tc-integration-settings {generateKey}>` |
| `saveValues` | `el.saveValues = …;` | `<… saveValues={…} />` | `<tc-integration-settings :saveValues="…">` | `<tc-integration-settings [saveValues]="…">` | `<tc-integration-settings {saveValues}>` |
| `toggleEnabled` | `el.toggleEnabled = …;` | `<… toggleEnabled={…} />` | `<tc-integration-settings :toggleEnabled="…">` | `<tc-integration-settings [toggleEnabled]="…">` | `<tc-integration-settings {toggleEnabled}>` |

*Also attributes: `name`, `count`, `meta`, `site-hint`, `demo` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-values-change` | Yes | `el.addEventListener("tc-values-change", (e) => …)` | `onValuesChange={…}` | `@tc-values-change="…"` | `(tc-values-change)="…($event)"` | `el.addEventListener("tc-values-change", …)` |

### Controlled

The element changes `values` itself unless a listener calls `preventDefault()` on `tc-values-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-integration-settings id="integration-settings"></tc-integration-settings>

<script type="module">
  import "@adamstavely/trenchcoat/integration-settings";

  const el = document.querySelector("#integration-settings");
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
import "@adamstavely/trenchcoat/integration-settings";
import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";

const props = defineProps<{ initial: TcIntegrationSettings["values"] }>();
const values = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValuesChange = (e: CustomEvent<{ values: TcIntegrationSettings["values"] }>) => {
  e.preventDefault();
  values.value = e.detail.values;
};
</script>

<template>
  <tc-integration-settings :values="values" @tc-values-change="onValuesChange"></tc-integration-settings>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { IntegrationSettings } from "@adamstavely/trenchcoat/angular/integration-settings";
import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";

@Component({
  selector: "app-controlled-integration-settings",
  imports: [IntegrationSettings],
  template: `<tc-integration-settings [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-integration-settings>`,
})
export class ControlledIntegrationSettings {
  readonly initial = input.required<TcIntegrationSettings["values"]>();
  readonly values = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValuesChange(e: CustomEvent<{ values: TcIntegrationSettings["values"] }>) {
    e.preventDefault();
    this.values.set(e.detail.values);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/integration-settings";
  import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";

  let { initial }: { initial: TcIntegrationSettings["values"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let values = $derived(initial);
  let el: TcIntegrationSettings;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      values = (e as CustomEvent<{ values: TcIntegrationSettings["values"] }>).detail.values;
    };
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-integration-settings bind:this={el} {values}></tc-integration-settings>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-integration-settings")` returns a `TcIntegrationSettings` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";`
- **React / Next.js:** Props: `import type { IntegrationSettingsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IntegrationSettings>`. The element class, for refs: `import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIntegrationSettings["logo"]` with `import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";`
- **Angular:** The directive types the template: `[logo]` takes `TcIntegrationSettings["logo"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIntegrationSettings } from "@adamstavely/trenchcoat/integration-settings";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The service's name, e.g. "Shopify" |
| `logo` | `React.ReactNode` | The service's logo, shown beside its name |
| `count` | `number` | Small number next to the name, e.g. synced orders |
| `meta` | `string` | Line under the name, e.g. when it was connected |
| `values` | `Partial<IntegrationValues>` | The saved values. Controlled when defined: the card shows them, edits collect in the save bar, and saved changes (Save, the switch) are reported through onValuesChange. Fields that weren't edited follow new values right away |
| `defaultValues` | `Partial<IntegrationValues>` | Saved values when uncontrolled. Read again when they change (e.g. once they've loaded) – fields that weren't edited follow |
| `onValuesChange` | `(values: IntegrationValues) => void` | Called with all values whenever the saved values change: after a save, or when the switch flips |
| `siteHint` | `string` | Helper text under the address field |
| `timeZones` | `string[]` | The time zones the picker offers, as labels like "(GMT +01:00) Berlin" – the first is the default |
| `onGenerateKey` | `(options: { signal: AbortSignal }) => string \| Promise<string>` | Creates a key – return it, or a promise of it; a rejection shows an error and keeps the old key. Without it a random `sk_demo_…` key is made up (and warns once, unless `demo` is set) |
| `onSave` | `(values: IntegrationValues, options: { signal: AbortSignal }) => void \| Promise<void>` | Called with all values when Save is pressed. A rejection keeps the changes unsaved and shows an error. The signal aborts when the card unmounts |
| `demo` | `boolean` | Demo mode: keys are made up silently when onGenerateKey is missing. For galleries and prototypes |
| `onToggle` | `(enabled: boolean, options: { signal: AbortSignal }) => void \| Promise<unknown>` | Called when the switch flips. May return a promise: the switch shows that it's working and flips when it resolves; a rejection leaves it as it was and shows an error |

*Renamed or hidden on the wrapper: `generateKey`, `saveValues`, `toggleEnabled`, `Shopify`, `(GMT +01:00) Berlin`*

## Accessibility

Follows the WAI-ARIA [Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switch, the key buttons, the address, the time zone and the save bar |
| Enter / Space | Presses the focused button, or flips the switch |
| ↓ / ↑ | On the time zone button, opens the list; in its search, moves through the zones |
| Ctrl+Home / Ctrl+End | In the time zone search, moves to the first or last zone |
| Enter | In the time zone search, picks the active zone and closes the list |
| Escape | In the time zone search, closes the list and returns focus to the button |

Focus never drops to the page: Generate and Regenerate hand focus to each other, and a closing save bar hands it to
the address field.

### Screen readers

The card is a `region` named “Shopify settings”. The switch is a `switch` named “Shopify sync” with `aria-checked`,
and `aria-busy` while an `onToggle` promise runs. The address field is labelled “Site address”, described by its
hint, and `aria-invalid` once it's left with something that isn't a domain; the hint is a polite live region that
then says “That doesn't look like a domain – try something like yourstore.com”. The time zone button has
`aria-haspopup="listbox"`; its search is a `combobox` named “Search time zones” over a listbox of options. A polite
status confirms actions – “New key generated. Copy it now – it is shown in full only once.”, “Key copied to the
clipboard.”, “Changes saved.”, “Changes discarded.” – and failures are alerts, such as “Couldn't save – try again.”

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
| ARIA reflection (element.ariaBusy…) | 81 | 119 | 12.1 | 12.1 | itself | States such as busy and disabled reach screen readers. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 45.3 KB | 11.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **53.8 KB** | **13.8 KB** |
| With Lit – the first component on a page | 76.1 KB | 21.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 47 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of timeZones replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.2 ms | timeZones: first render, 47 nodes; update 0.4 ms |
| 1,000 items | 2.3 ms | timeZones: first render, 47 nodes; update 0.6 ms |

What it renders doesn't grow with timeZones (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use `meta` for what the connection is doing: “Connected Mar 14 · syncing orders every 5 min”. Paused, it reads
  “Paused – no data is synced”.
- Set `siteHint` for your service – the default, “Your store's primary domain, without https://”, is written for a
  shop.
- Use `count` for one number people care about, such as synced orders – not a status.
- List time zones as “(GMT +01:00) Berlin” so search works by city and by offset.

## Do and don't

### Do

- Pass `onGenerateKey` (or `generateKey`) that creates a real key – without it, a `sk_demo_…` key is made up and a
  warning is logged.
- Return promises from `onSave` and `onToggle`, so failures show and nothing flips that didn't happen.
- Load saved values into `defaultValues` when they arrive – fields people haven't edited follow them.

### Don't

- Don't pass a stored secret key into `values.apiKey` unless people may see it – the card masks it, but Show
  reveals the whole key.
- Don't put unrelated account settings in this card; it's for one service.
- Don't set `demo` outside galleries and prototypes.

## Related

- [Integration Picker](integration-picker.md) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
