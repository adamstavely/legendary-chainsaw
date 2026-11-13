<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Secrets Manager

**AI configuration** · New

The secrets agents run on, write-only – missing ones first with the agents that need them, expired and expiring next, Set value or Replace in a password field that's handed to the page and forgotten, Delete that names what will stop working, and new secrets by UPPER_SNAKE name

- **Element:** `<tc-secrets-manager>`
- **Size:** 12.1 KB gzip · 45.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/secrets-manager";` |
| React / Next.js | `import { SecretsManager } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/secrets-manager";` · tags starting with tc- are custom elements |
| Angular | `import { SecretsManager } from "@adamstavely/trenchcoat/angular/secrets-manager";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/secrets-manager";` |

## Example

The live example is in the gallery at `#/secrets-manager`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The secrets agents run on – API keys, tokens and passwords – by name and scope. Secrets an agent needs that aren't set come first, under Missing, with the agents that need them; then the saved ones, expired and expiring first, each with when and by whom it was last updated and which agents use it. Values are write-only: Set value or Replace opens a password field, Save hands the value to the page and the element forgets it. Delete asks first and names the agents that will stop working. Add secret takes a new name in UPPER_SNAKE_CASE, a scope and a value.

### When to use

- The secrets page of an agent platform or a workspace's settings.
- Showing what an agent is missing before it can run, with the fix in place.

### When not to use

- One secret in a settings form – use [Secret Field](secret-field.md).
- Connecting a service with an API key and its other settings – use [Integration Settings](integration-settings.md).
- Links that share a file – use [Share Link Manager](share-link-manager.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Groups** `.ui-sec__group` – Missing, then Saved, each with `.ui-sec__group-title` and a count
2. **Row** `.ui-sec__row` – one secret: `.ui-sec__name` and `.ui-sec__scope`
3. **Status** `.ui-sec__status` – a mark and a word: Set, Missing, Expiring soon, Expired
4. **Facts** `.ui-sec__facts` – updated when and by whom, expiry, and `.ui-sec__needed` – which agents use or need it
5. **Actions** `.ui-sec__actions` – `.ui-sec__edit` (Set value or Replace) and `.ui-sec__delete`
6. **Value form** `.ui-sec__form` – a `tc-secret-field` (`.ui-sec__value`), `.ui-sec__cancel` and `.ui-sec__save`
7. **Question** `.ui-sec__confirm` – names the agents that will stop working, with `.ui-sec__keep` and `.ui-sec__confirm-delete`
8. **New secret** `.ui-sec__new` – opened by `.ui-sec__add` with `creatable`: `.ui-sec__new-name`, `.ui-sec__new-scope` and a value

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. Set value on a missing secret, Save and Add are primary buttons. `--tc-sec-ring` sets the width of the hollow and half-filled status marks.

## Usage

### HTML

```html
<tc-secrets-manager id="secrets" creatable></tc-secrets-manager>

<script type="module">
  import "@adamstavely/trenchcoat/secrets-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const manager = document.querySelector("#secrets");
  manager.scopes = ["Workspace", "Invoice matcher"];
  manager.secrets = [
    { name: "LEDGER_API_TOKEN", scope: "Invoice matcher", status: "missing", usedBy: ["Invoice matcher"] },
    { name: "MODEL_API_KEY", scope: "Workspace", status: "set", usedBy: ["Invoice matcher", "Vendor risk"] },
  ];
  manager.addEventListener("tc-secret-set", (e) => console.log("store", e.detail.name));
</script>
```

### React / Next.js

```tsx
import { SecretsManager, type Secret } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const secrets: Secret[] = [
  { name: "LEDGER_API_TOKEN", scope: "Invoice matcher", status: "missing", usedBy: ["Invoice matcher"] },
  { name: "MODEL_API_KEY", scope: "Workspace", status: "set", usedBy: ["Invoice matcher"] },
];

export function Secrets({ save }: { save: (name: string, value: string) => void }) {
  return <SecretsManager defaultSecrets={secrets} creatable onSecretSet={({ name, value }) => save(name, value)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/secrets-manager";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";

defineProps<{ secrets: TcSecretsManager["secrets"]; scopes: TcSecretsManager["scopes"] }>();
const onSecretSet = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-secrets-manager :secrets="secrets" :scopes="scopes" @tc-secret-set="onSecretSet"></tc-secrets-manager>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SecretsManager } from "@adamstavely/trenchcoat/angular/secrets-manager";
import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";

@Component({
  selector: "app-secrets-manager-example",
  imports: [SecretsManager],
  template: `<tc-secrets-manager [secrets]="secrets()" [scopes]="scopes()" (tc-secret-set)="onSecretSet($event)"></tc-secrets-manager>`,
})
export class SecretsManagerExample {
  readonly secrets = input.required<TcSecretsManager["secrets"]>();
  readonly scopes = input.required<TcSecretsManager["scopes"]>();
  onSecretSet(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/secrets-manager";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";

  let { secrets, scopes }: { secrets: TcSecretsManager["secrets"]; scopes: TcSecretsManager["scopes"] } = $props();
  let el: TcSecretsManager;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-secret-set", on);
    return () => el.removeEventListener("tc-secret-set", on);
  });
</script>

<tc-secrets-manager bind:this={el} {secrets} {scopes}></tc-secrets-manager>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Secrets" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading, such as whose secrets these are |
| `secrets` | – | `Secret[]` | `[]` | The secrets – names, scopes and status, never values. Changed by the user unless tc-secrets-change is prevented |
| `scopes` | – | `string[]` | `[]` | The scopes a new secret can have; the first is the default |
| `creatable` | `creatable` | `boolean` | `false` | Offer Add secret |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for an update's date, epoch ms; without it a fresh update says "Updated just now". The element doesn't read the clock |
| `currentUser` | `current-user` | `string \| undefined` | `undefined` | Who's making changes – recorded as `updatedBy` |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<SecretsManagerLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-secret-set` | – | Yes | Save or Add was pressed with a value ({ name, scope, value, isNew }: SecretSet); cancelable – prevented, the secret stays as it was. The element forgets the value right after |
| `tc-secret-delete` | – | Yes | Delete was confirmed ({ name, secret }: SecretDelete); cancelable – prevented, the secret stays |
| `tc-secrets-change` | – | Yes | The list changed after a set, an add or a delete ({ secrets, change, name }: SecretsChange); cancelable – prevented, `secrets` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sec-ring` | `1.5px` | both |

#### Design tokens it reads (50)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `isSecretName(name: string): void` | Whether a name is UPPER_SNAKE_CASE |

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
| `secrets` | `el.secrets = …;` | `<… secrets={…} />` | `<tc-secrets-manager :secrets="…">` | `<tc-secrets-manager [secrets]="…">` | `<tc-secrets-manager {secrets}>` |
| `scopes` | `el.scopes = …;` | `<… scopes={…} />` | `<tc-secrets-manager :scopes="…">` | `<tc-secrets-manager [scopes]="…">` | `<tc-secrets-manager {scopes}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-secrets-manager :labels="…">` | `<tc-secrets-manager [labels]="…">` | `<tc-secrets-manager {labels}>` |

*Also attributes: `heading`, `description`, `creatable`, `now`, `current-user`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-secret-set` | Yes | `el.addEventListener("tc-secret-set", (e) => …)` | `onSecretSet={…}` | `@tc-secret-set="…"` | `(tc-secret-set)="…($event)"` | `el.addEventListener("tc-secret-set", …)` |
| `tc-secret-delete` | Yes | `el.addEventListener("tc-secret-delete", (e) => …)` | `onSecretDelete={…}` | `@tc-secret-delete="…"` | `(tc-secret-delete)="…($event)"` | `el.addEventListener("tc-secret-delete", …)` |
| `tc-secrets-change` | Yes | `el.addEventListener("tc-secrets-change", (e) => …)` | `onSecretsChange={…}` | `@tc-secrets-change="…"` | `(tc-secrets-change)="…($event)"` | `el.addEventListener("tc-secrets-change", …)` |

### Controlled

The element changes `secrets` itself unless a listener calls `preventDefault()` on `tc-secrets-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-secrets-manager id="secrets-manager"></tc-secrets-manager>

<script type="module">
  import "@adamstavely/trenchcoat/secrets-manager";

  const el = document.querySelector("#secrets-manager");
  el.addEventListener("tc-secrets-change", (e) => {
    e.preventDefault(); // the element keeps its secrets…
    if (allowed(e.detail.secrets)) el.secrets = e.detail.secrets; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SecretsManager } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SecretsManager>;
type Props = Omit<Own, "secrets" | "onSecretsChange"> & { initial: NonNullable<Own["secrets"]> };

// Controlled: passing secrets makes the wrapper prevent the element's own change; the app sets it
export function ControlledSecretsManager({ initial, ...props }: Props) {
  const [secrets, setSecrets] = useState<Own["secrets"]>(initial);
  return <SecretsManager {...props} secrets={secrets} onSecretsChange={(next) => setSecrets(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/secrets-manager";
import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";

const props = defineProps<{ initial: TcSecretsManager["secrets"] }>();
const secrets = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSecretsChange = (e: CustomEvent<{ secrets: TcSecretsManager["secrets"] }>) => {
  e.preventDefault();
  secrets.value = e.detail.secrets;
};
</script>

<template>
  <tc-secrets-manager :secrets="secrets" @tc-secrets-change="onSecretsChange"></tc-secrets-manager>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SecretsManager } from "@adamstavely/trenchcoat/angular/secrets-manager";
import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";

@Component({
  selector: "app-controlled-secrets-manager",
  imports: [SecretsManager],
  template: `<tc-secrets-manager [secrets]="secrets()" (tc-secrets-change)="onSecretsChange($event)"></tc-secrets-manager>`,
})
export class ControlledSecretsManager {
  readonly initial = input.required<TcSecretsManager["secrets"]>();
  readonly secrets = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSecretsChange(e: CustomEvent<{ secrets: TcSecretsManager["secrets"] }>) {
    e.preventDefault();
    this.secrets.set(e.detail.secrets);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/secrets-manager";
  import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";

  let { initial }: { initial: TcSecretsManager["secrets"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let secrets = $derived(initial);
  let el: TcSecretsManager;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      secrets = (e as CustomEvent<{ secrets: TcSecretsManager["secrets"] }>).detail.secrets;
    };
    el.addEventListener("tc-secrets-change", on);
    return () => el.removeEventListener("tc-secrets-change", on);
  });
</script>

<tc-secrets-manager bind:this={el} {secrets}></tc-secrets-manager>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-secrets-manager")` returns a `TcSecretsManager` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";`
- **React / Next.js:** Props: `import type { SecretsManagerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SecretsManager>`. The element class, for refs: `import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSecretsManager["secrets"]` with `import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";`
- **Angular:** The directive types the template: `[secrets]` takes `TcSecretsManager["secrets"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSecretsManager } from "@adamstavely/trenchcoat/secrets-manager";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Secrets" |
| `secrets` | `Secret[]` | The secrets – controlled when given |
| `defaultSecrets` | `Secret[]` | The secrets on mount when `secrets` isn't controlled |
| `onSecretsChange` | `(secrets: Secret[], detail: SecretsChange) => void` | The list changed after a set, an add or a delete |
| `onSecretSet` | `(detail: SecretSet) => void \| boolean` | Save or Add with a value: store it. The value isn't kept anywhere else. Return false to refuse it |
| `onSecretDelete` | `(name: string, secret: Secret) => void \| boolean` | Delete was confirmed. Return false to keep the secret |

*Renamed or hidden on the wrapper: `heading`, `secrets`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each secret's actions, and the open form's fields |
| Enter / Space | Presses a button |
| Enter | In a value field: saves |
| Escape | In a value field or the new-secret form: closes it, returning focus to the button that opened it |

Set value and Replace move focus into the value field; Delete moves it to Keep. After a delete, focus goes to the next secret's name.

### Screen readers

Missing and Saved are headings over lists. Status is a word as well as a mark; the marks differ in shape (filled, hollow, half-filled, square), not only colour. Each button's name includes the secret it acts on – "Replace, MODEL_API_KEY". The value field is named "Value of MODEL_API_KEY" and its Show button is a toggle. The new name is described by its hint and, once wrong, by its error, with `aria-invalid`. `role="status"` announces saves, additions and deletions – never a value.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | internal/settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, internal/settings | Focus rings for keyboard users. |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | internal/settings | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 22.0 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [secret-field](secret-field.md) · Element it renders | 1.4 KB | – |
| **Added to a page that already has Lit** | **45.4 KB** | **12.1 KB** |
| With Lit – the first component on a page | 67.6 KB | 19.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 92 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of secrets replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | secrets: first render, 1,441 nodes; update 3.5 ms |
| 1,000 items | 98 ms | secrets: first render, 14,221 nodes; update 26 ms |

1,000 items of secrets: 98 ms. It renders every item, so a first render passes 50 ms (a long task) at about 510 items – page or filter longer lists.

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

- Name secrets in UPPER_SNAKE_CASE for what they unlock: `LEDGER_API_TOKEN`, not `KEY2`.
- Give `usedBy` for every secret, missing ones included, so people know what breaks and what's waiting.
- Use the agent's name for an agent's own secret's `scope`, and "Workspace" for shared ones.

## Do and don't

### Do

- Store the value on the server in `tc-secret-set` and never send it back; the element only ever needs the status.
- Mark a secret `missing` when an agent needs it and it isn't set, so it comes first.
- Pass `now` and `currentUser` so a fresh update shows its date and who made it.

### Don't

- Don't put a value, or part of one, in `name` or the labels – the element can't hide what it's given as text.
- Don't keep the value in page state after `tc-secret-set`; the element has already forgotten it.

## Related

- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Trigger List](trigger-list.md) – Every way an agent starts, one row each – schedule, webhook, event, email or manual in words, when it last fired and how often this week, errors in words, a switch to turn it off, Edit, and Add trigger by kind
- [MCP connection manager](mcp-connection-manager.md) – MCP servers at a glance – status and what each exposes; add one (transport, auth, test), inspect its tools, resources and prompts, connect, retry and remove
