<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Model Access

**AI configuration** · New

Which models a workspace may use – grouped by provider with capabilities, price tier and where data is kept, a switch to allow or block each and Require approval, a warning in words when a blocked model is still used by agents, the default model picked from the allowed ones, a rule that blocks new models until an admin allows them, and who changed it last

- **Element:** `<tc-model-access>`
- **Size:** 8.2 KB gzip · 26.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/model-access";` |
| React / Next.js | `import { ModelAccess } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/model-access";` · tags starting with tc- are custom elements |
| Angular | `import { ModelAccess } from "@adamstavely/trenchcoat/angular/model-access";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/model-access";` |

## Example

The live example is in the gallery at `#/model-access`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The admin page for which models a workspace may use. Models are grouped by provider, and each shows what it can do
(vision, tools, long context), a price tier and where its data is kept. Each has a switch that allows or blocks it and a
Require approval checkbox for models people may use only with an admin's sign-off. Below the list, the default model is
picked from the allowed ones, and a rule decides what happens to models a provider adds later – blocked until an admin
allows them, or allowed straight away. When a blocked model is still used by agents, it says so in words: "Policy Q&A
uses large-1 – blocking it will stop that agent". The footer says who changed the policy last.

### When to use

- A workspace or organisation settings page where admins decide which models people and agents may use.
- Keeping costly or out-of-region models off by default, with new ones blocked until reviewed.
- Showing the effect of blocking a model on the agents that depend on it, before anyone saves.

### When not to use

- Picking a model for one chat or one request – use [Model Picker](model-picker.md).
- Deciding which model a request goes to, with fallbacks and health – use [Model Routing](model-routing.md).
- Deciding what each agent may do with its tools – use [Tool Permissions](tool-permissions.md).
- Retention, logging and training rules for the data itself – use [Data handling policy](data-handling-policy.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Provider** `.ui-mac__provider` – the group heading
2. **Model** `.ui-mac__model` – a row: name, New, description, capabilities, price tier and residency
3. **Warning** `.ui-mac__warn` – the agents that stop if the model stays blocked
4. **Require approval** `.ui-mac__approval` – a checkbox, off while the model is blocked
5. **Switch** `.ui-mac__switch` – allowed or blocked, with the word beside it
6. **Policy** `.ui-mac__policy` – the default model and the rule for new models
7. **Footer** `.ui-mac__footer` – who changed the policy last, and when

## Looks

Standard is a white card on a gray tray with the header on the tray. Clean is one white card with the header as its first
row. The policy sits on a quiet band at the bottom of the card in both.

## Usage

### HTML

```html
<tc-model-access id="access" description="Which models this workspace may use."></tc-model-access>

<script type="module">
  import "@adamstavely/trenchcoat/model-access";
  import "@adamstavely/trenchcoat/tokens.css";

  const access = document.querySelector("#access");
  access.models = [
    { id: "large-1", name: "large-1", provider: "Provider A", capabilities: ["tools", "long-context"], tier: "high", residency: "EU", usedBy: ["Policy Q&A"] },
    { id: "small-2", name: "small-2", provider: "Provider A", capabilities: ["tools"], tier: "low", residency: "EU" },
    { id: "vision-1", name: "vision-1", provider: "Provider B", capabilities: ["vision"], tier: "medium", residency: "US", isNew: true },
  ];
  access.access = { models: { "large-1": { allowed: true }, "small-2": { allowed: true } }, defaultModel: "small-2", blockNew: true };
  access.addEventListener("tc-access-change", (e) => console.log(e.detail.change));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ModelAccess, type ModelAccessModel, type ModelAccessValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const models: ModelAccessModel[] = [
  { id: "large-1", name: "large-1", provider: "Provider A", capabilities: ["tools", "long-context"], tier: "high", usedBy: ["Policy Q&A"] },
  { id: "small-2", name: "small-2", provider: "Provider A", capabilities: ["tools"], tier: "low" },
];

export function WorkspaceModels() {
  const [access, setAccess] = useState<ModelAccessValue>({ models: {}, defaultModel: "small-2" });
  return <ModelAccess title="Model access" models={models} access={access} onAccessChange={setAccess} changedBy={{ name: "Priya Shah" }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/model-access";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";

defineProps<{ models: TcModelAccess["models"]; access: TcModelAccess["access"] }>();
const onAccessChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-model-access :models="models" :access="access" @tc-access-change="onAccessChange"></tc-model-access>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ModelAccess } from "@adamstavely/trenchcoat/angular/model-access";
import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";

@Component({
  selector: "app-model-access-example",
  imports: [ModelAccess],
  template: `<tc-model-access [models]="models()" [access]="access()" (tc-access-change)="onAccessChange($event)"></tc-model-access>`,
})
export class ModelAccessExample {
  readonly models = input.required<TcModelAccess["models"]>();
  readonly access = input.required<TcModelAccess["access"]>();
  onAccessChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-access";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";

  let { models, access }: { models: TcModelAccess["models"]; access: TcModelAccess["access"] } = $props();
  let el: TcModelAccess;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-access-change", on);
    return () => el.removeEventListener("tc-access-change", on);
  });
</script>

<tc-model-access bind:this={el} {models} {access}></tc-model-access>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Model access"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `models` | – | `ModelAccessModel[]` | `[]` | The models, listed under their provider in the order given |
| `access` | – | `ModelAccessValue` | `{ models: {} }` | The policy. Changed by the controls unless a tc-access-change listener calls preventDefault() |
| `changedBy` | – | `ModelAccessEditor \| undefined` | `undefined` | Who changed the policy last, shown in the footer |
| `labels` | – | `Partial<ModelAccessLabels>` | `{}` | The words, merged over defaultModelAccessLabels |
| `locale` | `locale` | `string \| undefined` | `undefined` | For the footer's date |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-access-change` | – | Yes | A switch, a checkbox, the default or the new-model rule changed ({ access, change }: ModelAccessChange); cancelable – prevented, `access` stays as it was |

#### Design tokens it reads (70)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `modelAllowed(model: ModelAccessModel, access: ModelAccessValue): void` | Whether a model may be used under a policy |

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
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-model-access :models="…">` | `<tc-model-access [models]="…">` | `<tc-model-access {models}>` |
| `access` | `el.access = …;` | `<… access={…} />` | `<tc-model-access :access="…">` | `<tc-model-access [access]="…">` | `<tc-model-access {access}>` |
| `changedBy` | `el.changedBy = …;` | `<… changedBy={…} />` | `<tc-model-access :changedBy="…">` | `<tc-model-access [changedBy]="…">` | `<tc-model-access {changedBy}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-model-access :labels="…">` | `<tc-model-access [labels]="…">` | `<tc-model-access {labels}>` |

*Also attributes: `heading`, `description`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-access-change` | Yes | `el.addEventListener("tc-access-change", (e) => …)` | `onAccessChange={…}` | `@tc-access-change="…"` | `(tc-access-change)="…($event)"` | `el.addEventListener("tc-access-change", …)` |

### Controlled

The element changes `access` itself unless a listener calls `preventDefault()` on `tc-access-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-model-access id="model-access"></tc-model-access>

<script type="module">
  import "@adamstavely/trenchcoat/model-access";

  const el = document.querySelector("#model-access");
  el.addEventListener("tc-access-change", (e) => {
    e.preventDefault(); // the element keeps its access…
    if (allowed(e.detail.access)) el.access = e.detail.access; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ModelAccess } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ModelAccess>;
type Props = Omit<Own, "access" | "onAccessChange"> & { initial: NonNullable<Own["access"]> };

// Controlled: passing access makes the wrapper prevent the element's own change; the app sets it
export function ControlledModelAccess({ initial, ...props }: Props) {
  const [access, setAccess] = useState<Own["access"]>(initial);
  return <ModelAccess {...props} access={access} onAccessChange={(next) => setAccess(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/model-access";
import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";

const props = defineProps<{ initial: TcModelAccess["access"] }>();
const access = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAccessChange = (e: CustomEvent<{ access: TcModelAccess["access"] }>) => {
  e.preventDefault();
  access.value = e.detail.access;
};
</script>

<template>
  <tc-model-access :access="access" @tc-access-change="onAccessChange"></tc-model-access>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ModelAccess } from "@adamstavely/trenchcoat/angular/model-access";
import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";

@Component({
  selector: "app-controlled-model-access",
  imports: [ModelAccess],
  template: `<tc-model-access [access]="access()" (tc-access-change)="onAccessChange($event)"></tc-model-access>`,
})
export class ControlledModelAccess {
  readonly initial = input.required<TcModelAccess["access"]>();
  readonly access = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAccessChange(e: CustomEvent<{ access: TcModelAccess["access"] }>) {
    e.preventDefault();
    this.access.set(e.detail.access);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-access";
  import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";

  let { initial }: { initial: TcModelAccess["access"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let access = $derived(initial);
  let el: TcModelAccess;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      access = (e as CustomEvent<{ access: TcModelAccess["access"] }>).detail.access;
    };
    el.addEventListener("tc-access-change", on);
    return () => el.removeEventListener("tc-access-change", on);
  });
</script>

<tc-model-access bind:this={el} {access}></tc-model-access>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-model-access")` returns a `TcModelAccess` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";`
- **React / Next.js:** Props: `import type { ModelAccessProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ModelAccess>`. The element class, for refs: `import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcModelAccess["models"]` with `import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";`
- **Angular:** The directive types the template: `[models]` takes `TcModelAccess["models"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcModelAccess } from "@adamstavely/trenchcoat/model-access";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `access` | `ModelAccessValue` | The policy – controlled when given |
| `defaultAccess` | `ModelAccessValue` | The policy on mount, when `access` isn't controlled |
| `onAccessChange` | `(access: ModelAccessValue, change: ModelAccessChangeCause) => void` | Called with the next policy and what changed |

*Renamed or hidden on the wrapper: `heading`, `access`, `children`*

## Accessibility

### Keyboard

Every control is a native button, checkbox or select, in reading order.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between switches, checkboxes, the default model and the rule |
| Space / Enter | Flips the focused switch; Space ticks the focused checkbox |
| ↑ / ↓ | In the default model, picks the previous or next allowed model |

### Screen readers

Each provider is a section named by its heading, and its models are a list. A model's switch is a `switch` named
"large-1 allowed" and read as on or off; when blocking it would stop agents, the warning is its description. Require
approval is a checkbox named "Require approval for large-1", disabled while the model is blocked. The price tier is read in
words ("High cost"). The default model is a labelled select, marked invalid with a description when the current default
is blocked. Every change is confirmed in a polite status message: "large-1 blocked. Policy Q&A uses large-1 – blocking it
will stop that agent".

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
| **This component alone** | 19.2 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.8 KB** | **8.2 KB** |
| With Lit – the first component on a page | 46.4 KB | 14.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 131 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of models replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | models: first render, 2,339 nodes; update 1.4 ms |
| 1,000 items | 83 ms | models: first render, 23,039 nodes; update 8.3 ms |

1,000 items of models: 83 ms. It renders every item, so a first render passes 50 ms (a long task) at about 600 items – page or filter longer lists.

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

- Use the provider's or your gateway's model names, as people will see them elsewhere in the product.
- Keep `description` to one short phrase about what the model is good at.
- Give `residency` as regions people recognise: "EU", "US", "UK".
- Fill in `usedBy` from your agents' settings, so the warning is accurate.

## Do and don't

### Do

- Handle `tc-access-change` and store the policy; call `preventDefault()` when the change isn't allowed (a model a
  contract requires).
- Set `changedBy` from your audit trail.
- Mark models that arrived since the last review `isNew`, so admins can see what's waiting.

### Don't

- Don't let the default model be a blocked one – the select asks for another, and your server should refuse it too.
- Don't use the switch as an on/off for one person's chats; this is the workspace's policy.
- Don't hide blocked models – admins need to see them to allow them again.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Model Routing](model-routing.md) – Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
