<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# API Keys

**Inputs & controls** · New

A workspace's API keys: each key's name, masked value, permissions, who made it, last use and status in words (Active, Expires in 5 days, Expired, Revoked), Create key with name, permissions and expiry and the new secret shown once with Copy, Revoke asked in place, and inactive keys folded away

- **Element:** `<tc-api-keys>`
- **Size:** 11.2 KB gzip · 38.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/api-keys";` |
| React / Next.js | `import { ApiKeys } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/api-keys";` · tags starting with tc- are custom elements |
| Angular | `import { ApiKeys } from "@adamstavely/trenchcoat/angular/api-keys";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/api-keys";` |

## Example

The live example is in the gallery at `#/api-keys`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The API keys of a workspace or an account, for the people who connect other apps to it. Each key shows its name, its value hidden in a box of dots, like a password field, its permissions as chips, who made it and when, when it was last used ("Never used" when it hasn't been), and where it stands – Active, Expires in 5 days, Expired or Revoked – in words as well as colour.

Create key opens a form in place: a name, the permissions (`scopes`) and how long the key lasts (`expiryOptions`: 30 days, 90 days, 1 year or Never by default). Submitting fires `tc-key-create`; the page makes the key on its server and sets `revealed` to `{ id, secret }`. The secret shows once, in a highlighted panel with Copy and "Copy it now – you won't be able to see this key again". Done fires `tc-reveal-dismiss` and the secret is gone from the page.

Revoke asks in place – "Apps using it stop working at once" – and fires `tc-key-revoke` with the keys as they'd be. Revoked and expired keys fold away under "Inactive keys (n)". Keys that expire within `warn-days` (14 by default) say how many days are left, in warning colours.

The element only shows and asks. The server makes, stores and checks keys; the full secret never reaches the element except in `revealed`.

Most services can only show a key's secret once, when it's made, so by default a key stays hidden. A service that can show keys again – publishable or test keys, or keys behind a password check – passes `loadSecret(id)`: each active key then gets two icon buttons inside its box, an eye to show or hide it and Copy, and the secret is fetched only when someone asks for it. A shown key is hidden again after `hide-after` seconds (30 by default; 0 keeps it until Hide). If the secret can't be loaded, a status line says so.

### When to use

- A settings page where developers make and revoke keys for your API.
- An admin review of which keys exist, who made them and which are stale.

### When not to use

- Links that share a document – use [Share Link Manager](share-link-manager.md).
- One secret a person types in, such as a model provider's key – use [Secret Field](secret-field.md) or [Integration Settings](integration-settings.md).
- Where events are sent – use [Webhooks](webhooks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the title, and Create key `.ui-akm__create`
2. **New key** `.ui-akm__reveal` – the secret `.ui-akm__secret`, the warning `.ui-akm__reveal-note`, `.ui-akm__copy` and `.ui-akm__done`
3. **Form** `.ui-akm__form` – the name `.ui-akm__name-input`, permissions `.ui-akm__check`, expiry `.ui-akm__radio`, `.ui-akm__submit`
4. **Key** `.ui-akm__row` – `.ui-akm__name`, `.ui-akm__keybox` (the box, holding `.ui-akm__masked` or the shown `.ui-akm__plain`, and with `loadSecret` the `.ui-akm__show` and `.ui-akm__copy-key` icon buttons), `.ui-akm__status`, `.ui-akm__scopes`, `.ui-akm__facts` and `.ui-akm__revoke`
5. **Confirm** `.ui-akm__confirm` – Keep and Revoke, in place
6. **Inactive keys** `.ui-akm__inactive-toggle` – the folded list of revoked and expired keys

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row. Status uses the status colours with a dot and a word. The new key's panel uses the warning colours, so it stands out until Done.

## Usage

### HTML

```html
<tc-api-keys id="keys" description="Ledgerline · Fraud review workspace"></tc-api-keys>

<script type="module">
  import "@adamstavely/trenchcoat/api-keys";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#keys");
  el.scopes = [
    { id: "cases:read", label: "cases:read", description: "Read cases and their history" },
    { id: "cases:write", label: "cases:write", description: "Open, update and close cases" },
  ];
  el.keys = [{ id: "k1", name: "Case intake bot", prefix: "tc_live_", last4: "07c2", createdAt: Date.now() - 86_400_000, scopes: ["cases:read"] }];
  el.addEventListener("tc-key-create", async (e) => {
    const { key, secret } = await fetch("/api/keys", { method: "POST", body: JSON.stringify(e.detail) }).then((r) => r.json());
    el.keys = [key, ...el.keys];
    el.revealed = { id: key.id, secret };
  });
  el.addEventListener("tc-key-revoke", (e) => fetch(`/api/keys/${e.detail.id}`, { method: "DELETE" }));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ApiKeys, type ApiKey, type ApiKeyReveal } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function KeysSettings({ initial, createKey }: { initial: ApiKey[]; createKey: (name: string, scopes: string[], days: number | null) => Promise<{ key: ApiKey; secret: string }> }) {
  const [keys, setKeys] = useState(initial);
  const [revealed, setRevealed] = useState<ApiKeyReveal | null>(null);
  return (
    <ApiKeys
      keys={keys}
      onKeysChange={setKeys}
      scopes={[{ id: "cases:read", label: "cases:read" }]}
      revealed={revealed}
      onRevealDismiss={() => setRevealed(null)}
      onKeyCreate={async ({ name, scopes, expiresIn }) => {
        const { key, secret } = await createKey(name, scopes, expiresIn);
        setKeys((all) => [key, ...all]);
        setRevealed({ id: key.id, secret });
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/api-keys";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";

defineProps<{ keys: TcApiKeys["keys"]; scopes: TcApiKeys["scopes"] }>();
const onKeyCreate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-api-keys :keys="keys" :scopes="scopes" @tc-key-create="onKeyCreate"></tc-api-keys>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ApiKeys } from "@adamstavely/trenchcoat/angular/api-keys";
import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";

@Component({
  selector: "app-api-keys-example",
  imports: [ApiKeys],
  template: `<tc-api-keys [keys]="keys()" [scopes]="scopes()" (tc-key-create)="onKeyCreate($event)"></tc-api-keys>`,
})
export class ApiKeysExample {
  readonly keys = input.required<TcApiKeys["keys"]>();
  readonly scopes = input.required<TcApiKeys["scopes"]>();
  onKeyCreate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/api-keys";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";

  let { keys, scopes }: { keys: TcApiKeys["keys"]; scopes: TcApiKeys["scopes"] } = $props();
  let el: TcApiKeys;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-key-create", on);
    return () => el.removeEventListener("tc-key-create", on);
  });
</script>

<tc-api-keys bind:this={el} {keys} {scopes}></tc-api-keys>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "API keys" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading, such as what the keys reach |
| `keys` | – | `ApiKey[]` | `[]` | The keys. A revoke changes it unless a tc-key-revoke listener calls preventDefault() |
| `scopes` | – | `ApiKeyScope[]` | `[]` | The permissions a key can have, offered as checkboxes when creating one |
| `expiryOptions` | – | `ApiKeyExpiryOption[]` | `[ { days: 30, label: "30 days" }, { days: 90, label: "90 days" }, { days: 365, label: "1 year" }, { days: null, label: "Never" }, ]` | How long a new key can last; by default 30 days, 90 days, 1 year and Never |
| `defaultExpiry` | – | `number \| null` | `90` | The expiry picked when the form opens, in days or null; by default 90 |
| `revealed` | – | `ApiKeyReveal \| null` | `null` | A new key's secret to show once, set by the page after tc-key-create; cleared by Done unless a tc-reveal-dismiss listener calls preventDefault() |
| `warnDays` | `warn-days` | `number` | `14` | How many days before expiry a key says "Expires in n days" in warning colours |
| `readOnly` | `read-only` | `boolean` | `false` | Hides Create key, for people who may only look |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" in epoch ms; unset, the clock's |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates and relative times |
| `labels` | – | `Partial<ApiKeysLabels>` | `{}` | Rename any of the words |
| `loadSecret` | – | `((id: string) => Promise<string> \| string) \| undefined` | `undefined` | Fetches a key's full secret, for a service that can show keys again (publishable or test keys, or behind a password check). Given, each active key gets Show / Hide and Copy, and the secret is fetched only when asked for. Unset, keys stay masked – the secret shows once, when it's made |
| `hideAfter` | `hide-after` | `number` | `30` | Seconds a shown secret stays before it's masked again; 0 keeps it until Hide (default 30) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-key-create` | – | Yes | Create key was submitted ({ name, scopes, expiresIn }: ApiKeyCreate); cancelable – prevented, the form stays open. The page makes the key and sets `revealed` |
| `tc-key-revoke` | – | Yes | Revoke was confirmed ({ id, keys }: ApiKeyRevoke) with the keys as they'd be; cancelable – prevented, `keys` stays as it was |
| `tc-reveal-dismiss` | – | Yes | Done was pressed on the new key's secret ({ id }: ApiKeyRevealDismiss); cancelable – prevented, the secret stays showing |
| `tc-copy` | – | Yes | Copy was pressed on a key's secret – the new key's, or a key's own with `loadSecret` ({ id }: ApiKeyCopy); cancelable – prevented, nothing is written to the clipboard |

#### Design tokens it reads (69)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `apiKeyStatus(key: Pick<ApiKey, "revokedAt" \| "expiresAt">, now: number, warnDays: unknown): { status: ApiKeyStatus; days?: number }` | Where a key stands at `now`, and – when it's expiring – in how many days |
| `apiKeyRelative(ms: number, now: number, locale?: string): void` | "3 days ago", "in 2 hours", "just now" |

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
| `keys` | `el.keys = …;` | `<… keys={…} />` | `<tc-api-keys :keys="…">` | `<tc-api-keys [keys]="…">` | `<tc-api-keys {keys}>` |
| `scopes` | `el.scopes = …;` | `<… scopes={…} />` | `<tc-api-keys :scopes="…">` | `<tc-api-keys [scopes]="…">` | `<tc-api-keys {scopes}>` |
| `expiryOptions` | `el.expiryOptions = …;` | `<… expiryOptions={…} />` | `<tc-api-keys :expiryOptions="…">` | `<tc-api-keys [expiryOptions]="…">` | `<tc-api-keys {expiryOptions}>` |
| `defaultExpiry` | `el.defaultExpiry = …;` | `<… defaultExpiry={…} />` | `<tc-api-keys :defaultExpiry="…">` | `<tc-api-keys [defaultExpiry]="…">` | `<tc-api-keys {defaultExpiry}>` |
| `revealed` | `el.revealed = …;` | `<… revealed={…} />` | `<tc-api-keys :revealed="…">` | `<tc-api-keys [revealed]="…">` | `<tc-api-keys {revealed}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-api-keys :labels="…">` | `<tc-api-keys [labels]="…">` | `<tc-api-keys {labels}>` |
| `loadSecret` | `el.loadSecret = …;` | `<… loadSecret={…} />` | `<tc-api-keys :loadSecret="…">` | `<tc-api-keys [loadSecret]="…">` | `<tc-api-keys {loadSecret}>` |

*Also attributes: `heading`, `description`, `warn-days`, `read-only`, `now`, `locale`, `hide-after` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-key-create` | Yes | `el.addEventListener("tc-key-create", (e) => …)` | `onKeyCreate={…}` | `@tc-key-create="…"` | `(tc-key-create)="…($event)"` | `el.addEventListener("tc-key-create", …)` |
| `tc-key-revoke` | Yes | `el.addEventListener("tc-key-revoke", (e) => …)` | `onKeysChange={…}` | `@tc-key-revoke="…"` | `(tc-key-revoke)="…($event)"` | `el.addEventListener("tc-key-revoke", …)` |
| `tc-reveal-dismiss` | Yes | `el.addEventListener("tc-reveal-dismiss", (e) => …)` | `onRevealDismiss={…}` | `@tc-reveal-dismiss="…"` | `(tc-reveal-dismiss)="…($event)"` | `el.addEventListener("tc-reveal-dismiss", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopySecret={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

### Controlled

The element changes `keys` and `revealed` itself unless a listener calls `preventDefault()` on `tc-key-revoke` or `tc-reveal-dismiss` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-api-keys id="api-keys"></tc-api-keys>

<script type="module">
  import "@adamstavely/trenchcoat/api-keys";

  const el = document.querySelector("#api-keys");
  el.addEventListener("tc-key-revoke", (e) => {
    e.preventDefault(); // the element keeps its keys…
    if (allowed(e.detail.keys)) el.keys = e.detail.keys; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ApiKeys } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ApiKeys>;
type Props = Omit<Own, "keys" | "onKeysChange"> & { initial: NonNullable<Own["keys"]> };

// Controlled: passing keys makes the wrapper prevent the element's own change; the app sets it
export function ControlledApiKeys({ initial, ...props }: Props) {
  const [keys, setKeys] = useState<Own["keys"]>(initial);
  return <ApiKeys {...props} keys={keys} onKeysChange={(next) => setKeys(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/api-keys";
import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";

const props = defineProps<{ initial: TcApiKeys["keys"] }>();
const keys = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onKeyRevoke = (e: CustomEvent<{ keys: TcApiKeys["keys"] }>) => {
  e.preventDefault();
  keys.value = e.detail.keys;
};
</script>

<template>
  <tc-api-keys :keys="keys" @tc-key-revoke="onKeyRevoke"></tc-api-keys>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ApiKeys } from "@adamstavely/trenchcoat/angular/api-keys";
import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";

@Component({
  selector: "app-controlled-api-keys",
  imports: [ApiKeys],
  template: `<tc-api-keys [keys]="keys()" (tc-key-revoke)="onKeyRevoke($event)"></tc-api-keys>`,
})
export class ControlledApiKeys {
  readonly initial = input.required<TcApiKeys["keys"]>();
  readonly keys = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onKeyRevoke(e: CustomEvent<{ keys: TcApiKeys["keys"] }>) {
    e.preventDefault();
    this.keys.set(e.detail.keys);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/api-keys";
  import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";

  let { initial }: { initial: TcApiKeys["keys"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let keys = $derived(initial);
  let el: TcApiKeys;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      keys = (e as CustomEvent<{ keys: TcApiKeys["keys"] }>).detail.keys;
    };
    el.addEventListener("tc-key-revoke", on);
    return () => el.removeEventListener("tc-key-revoke", on);
  });
</script>

<tc-api-keys bind:this={el} {keys}></tc-api-keys>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-api-keys")` returns a `TcApiKeys` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";`
- **React / Next.js:** Props: `import type { ApiKeysProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ApiKeys>`. The element class, for refs: `import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcApiKeys["keys"]` with `import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";`
- **Angular:** The directive types the template: `[keys]` takes `TcApiKeys["keys"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcApiKeys } from "@adamstavely/trenchcoat/api-keys";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "API keys" |
| `keys` | `ApiKey[]` | The keys – controlled when given |
| `defaultKeys` | `ApiKey[]` | The keys on mount when `keys` isn't controlled |
| `onKeysChange` | `(keys: ApiKey[], detail: ApiKeyRevoke) => void` | A key was revoked: the keys as they are now, and which one |
| `onKeyCreate` | `(detail: ApiKeyCreate, event: CustomEvent<ApiKeyCreate>) => void` | Create key was submitted; make the key and set `revealed`. Call event.preventDefault() to keep the form open |
| `revealed` | `ApiKeyReveal \| null` | A new key's secret to show once – controlled when given |
| `onRevealDismiss` | `(id: string) => void` | Done was pressed on the secret: clear `revealed` |
| `onCopySecret` | `(id: string, event: CustomEvent<ApiKeyCopy>) => void` | Copy was pressed on the secret |

*Renamed or hidden on the wrapper: `heading`, `keys`, `revealed`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move through Create key, the keys' Revoke buttons and Inactive keys |
| Enter / Space | Press the button with focus; Enter in the form creates the key |
| Escape | Close the Create key form |

### Screen readers

The keys are a list labelled by the heading. Each hidden value is read as "Key hidden, ends in a91f" – the dots themselves are hidden from screen readers. With `loadSecret`, the icon buttons are named in words with the key ("Show key, Reporting export", "Copy key, Reporting export"), and the same words show as a tooltip on hover and keyboard focus; Escape hides the tooltip. Status is a word, not only a colour. Revoke buttons are named with the key ("Revoke, Case intake bot"), and the question in place is a group named the same way, with focus moved to Keep. The form's name field says when it's missing, and Inactive keys says whether it's open. Copying and revoking are announced in a polite status line.

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
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 30.2 KB | 8.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **38.2 KB** | **11.2 KB** |
| With Lit – the first component on a page | 60.6 KB | 18.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 139 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of keys replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | keys: first render, 2,419 nodes; update 4.5 ms |
| 1,000 items | 125 ms | keys: first render, 24,019 nodes; update 40 ms |

1,000 items of keys: 125 ms. It renders every item, so a first render passes 50 ms (a long task) at about 400 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name keys for what uses them: "Case intake bot", not "Key 3".
- Give scopes short ids and a sentence each: "cases:write – Open, update and close cases".
- Default to an expiry; offer Never only where your security policy allows it.

## Do and don't

### Do

- Show `revealed` only right after creating the key, and clear it on `tc-reveal-dismiss`.
- Keep `last4` and `prefix` short enough to recognise a key, never enough to use it.
- Record who made each key (`createdBy`), so stale keys have an owner.

### Don't

- Don't put the full secret in `keys` – only `revealed` holds it, once.
- Don't revoke without the in-place question: apps using the key stop at once.

## Related

- [Webhooks](webhooks.md) – Webhook endpoints: address, events, an on/off switch and delivery health in words ("3 of 48 failed in the last 24 hours"), recent deliveries with status, timing, attempt and Retry, Add and Edit in place (https only, events with All events), Send test event, Delete asked in place, and a masked signing secret
- [Share Link Manager](share-link-manager.md) – The links that already share something – status in words, expiry, opens and who made them, with Copy, Change expiry and Revoke, which says how many opens it's had
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Role Editor](role-editor.md) – What each role can do – permissions grouped as Agents, Data, Billing and Admin against roles as a grid of ticks, dependent permissions kept in step with a note saying what else changed, a locked Owner, member counts, custom roles to add, rename and delete, and a summary of unsaved changes with Discard and Save
