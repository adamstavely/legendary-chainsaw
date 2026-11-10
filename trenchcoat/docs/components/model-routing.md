<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Model Routing

**AI configuration** · New

Routing rules as a route with a fallback chain, target health, breakers and residency, and a route test that lights up the path taken

- **Element:** `<tc-model-routing>`
- **Size:** 12.2 KB gzip · 44.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/model-routing";` |
| React / Next.js | `import { ModelRouting } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/model-routing";` · tags starting with tc- are custom elements |
| Angular | `import { ModelRouting } from "@adamstavely/trenchcoat/angular/model-routing";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/model-routing";` |

## Example

The live example is in the gallery at `#/model-routing`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Shows how requests are routed between models as a route: rules in order, each with its conditions and the model it
sends to, then the fallback chain a request takes when no rule matches or a target is unavailable. Each target shows
the health and circuit-breaker state the app reports and the region it runs in; with `residency` set, a target
outside the allowed regions is flagged. Test a route asks the app where a request would go and lights up the path
it took – the rules it passed, the one that matched, the targets it skipped and where it ended up – with the app's
reasons. People reorder rules and fallbacks by dragging or with the keyboard. The component routes nothing itself.

### When to use

- An operations or settings view of a model router, so a team can see and change what goes where.
- Checking a routing change before it ships: test a few typical requests and read the path each one takes.
- Showing where a request will land while a provider is degraded or a breaker is open.

### When not to use

- Picking one model for a conversation – use [Model Picker](model-picker.md).
- Tuning how one model generates – use [Model Settings](model-settings.md).
- Connecting a provider and testing its credentials – use [Provider connection](provider-connection.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a route icon, the title, rule and fallback counts, the allowed regions and overall health
2. **Rule** `.ui-mrt__rule` – a numbered rule: its conditions, then the target it sends to
3. **Rail** `.ui-mrt__rail` – the line through every step that lights up along a tested route
4. **Target** `.ui-mrt__target` – a model with its region, health, breaker state and note
5. **Fallback chain** `.ui-mrt__otherwise` – the targets tried in order when no rule takes the request
6. **Route test** `.ui-mrt__test` – a request to try and the app's explanation of where it went

## Looks

Standard is a white card on a gray tray: rules sit on gray rows with ink number badges and raised target chips.
Clean is one white card with hairline-outlined rules and targets, outlined numbers and caption-style section labels.
In both, a tested route turns the rail and the taken step to the accent, and the steps it never reached go quiet. In
a narrow container a rule's target drops under its conditions and the health pill is hidden.

## Usage

### HTML

```html
<tc-model-routing id="routing"></tc-model-routing>

<script type="module">
  import "@adamstavely/trenchcoat/model-routing";
  import "@adamstavely/trenchcoat/tokens.css";

  const routing = document.querySelector("#routing");
  routing.targets = [
    { id: "long", label: "Atlas Long", region: "EU" },
    { id: "main", label: "Atlas 2", region: "EU" },
  ];
  routing.value = { rules: [{ id: "r1", name: "Long inputs", conditions: ["Input is over 100k tokens"], target: "long" }], fallbacks: ["main"] };
  routing.health = { long: { status: "down", breaker: "open" }, main: { status: "healthy" } };
  routing.addEventListener("tc-route-test", async (e) => {
    routing.testResult = await fetch("/route-test", { method: "POST", body: e.detail.input }).then((r) => r.json());
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ModelRouting, type ModelRoutingValue, type RouteTestResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const targets = [
  { id: "long", label: "Atlas Long", region: "EU" },
  { id: "main", label: "Atlas 2", region: "EU" },
];

export function Routing() {
  const [value, setValue] = useState<ModelRoutingValue>({ rules: [{ id: "r1", name: "Long inputs", conditions: ["Input is over 100k tokens"], target: "long" }], fallbacks: ["main"] });
  const [result, setResult] = useState<RouteTestResult | null>(null);
  return (
    <ModelRouting
      targets={targets}
      value={value}
      onChange={setValue}
      residency={["EU"]}
      testResult={result}
      onTest={(input, routing) =>
        fetch("/route-test", { method: "POST", body: JSON.stringify({ input, routing }) })
          .then((r) => r.json() as Promise<RouteTestResult>)
          .then(setResult)
      }
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/model-routing";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";

defineProps<{ value: TcModelRouting["value"]; targets: TcModelRouting["targets"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-model-routing :value="value" :targets="targets" @tc-value-change="onValueChange"></tc-model-routing>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ModelRouting } from "@adamstavely/trenchcoat/angular/model-routing";
import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";

@Component({
  selector: "app-model-routing-example",
  imports: [ModelRouting],
  template: `<tc-model-routing [value]="value()" [targets]="targets()" (tc-value-change)="onValueChange($event)"></tc-model-routing>`,
})
export class ModelRoutingExample {
  readonly value = input.required<TcModelRouting["value"]>();
  readonly targets = input.required<TcModelRouting["targets"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-routing";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";

  let { value, targets }: { value: TcModelRouting["value"]; targets: TcModelRouting["targets"] } = $props();
  let el: TcModelRouting;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-model-routing bind:this={el} {value} {targets}></tc-model-routing>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Model routing"` | The heading, and the group's name |
| `value` | – | `ModelRoutingValue` | `{ rules: [], fallbacks: [] }` | The rules and the fallback chain. Changed by the user unless tc-value-change is prevented |
| `targets` | – | `RouteTarget[]` | `[]` | Every model or deployment a rule or the chain can name |
| `health` | – | `Record<string, RouteTargetHealth>` | `{}` | Each target's health and breaker, by target id, as the app reports them |
| `residency` | – | `string[]` | `[]` | The regions requests may be sent to; targets elsewhere are flagged. Empty means no constraint |
| `testResult` | – | `RouteTestResult \| null` | `null` | The app's answer to the last route test; setting it ends the pending state |
| `testPlaceholder` | `test-placeholder` | `string` | `"Describe a request, e.g. 140k-token contract from an EU customer"` | Placeholder in the route test's field |
| `readonly` | `readonly` | `boolean` | `false` | Shows the route without reorder handles or remove buttons |
| `path` | – | `{ rules: RoutePathStep[]; fallbacks: RoutePathStep[]; fellBack: boolean } \| null` | – | Where the last test went: each rule's and each fallback's part in it |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The rules or the fallback chain changed ({ value: ModelRoutingValue }); cancelable – prevent it to control `value` |
| `tc-route-test` | – | Yes | Test a route was submitted ({ input, value }: RouteTestRequest); answer by setting `testResult`; cancelable – prevented, nothing shows as pending |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `test(input: unknown)` | `void` | Runs a route test: the app answers by setting `testResult` |

#### Design tokens it reads (99)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-model-routing :value="…">` | `<tc-model-routing [value]="…">` | `<tc-model-routing {value}>` |
| `targets` | `el.targets = …;` | `<… targets={…} />` | `<tc-model-routing :targets="…">` | `<tc-model-routing [targets]="…">` | `<tc-model-routing {targets}>` |
| `health` | `el.health = …;` | `<… health={…} />` | `<tc-model-routing :health="…">` | `<tc-model-routing [health]="…">` | `<tc-model-routing {health}>` |
| `residency` | `el.residency = …;` | `<… residency={…} />` | `<tc-model-routing :residency="…">` | `<tc-model-routing [residency]="…">` | `<tc-model-routing {residency}>` |
| `testResult` | `el.testResult = …;` | `<… testResult={…} />` | `<tc-model-routing :testResult="…">` | `<tc-model-routing [testResult]="…">` | `<tc-model-routing {testResult}>` |

*Also attributes: `heading`, `test-placeholder`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-route-test` | Yes | `el.addEventListener("tc-route-test", (e) => …)` | `onTest={…}` | `@tc-route-test="…"` | `(tc-route-test)="…($event)"` | `el.addEventListener("tc-route-test", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-model-routing id="model-routing"></tc-model-routing>

<script type="module">
  import "@adamstavely/trenchcoat/model-routing";

  const el = document.querySelector("#model-routing");
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
import { ModelRouting } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ModelRouting>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledModelRouting({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ModelRouting {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/model-routing";
import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";

const props = defineProps<{ initial: TcModelRouting["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcModelRouting["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-model-routing :value="value" @tc-value-change="onValueChange"></tc-model-routing>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ModelRouting } from "@adamstavely/trenchcoat/angular/model-routing";
import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";

@Component({
  selector: "app-controlled-model-routing",
  imports: [ModelRouting],
  template: `<tc-model-routing [value]="value()" (tc-value-change)="onValueChange($event)"></tc-model-routing>`,
})
export class ControlledModelRouting {
  readonly initial = input.required<TcModelRouting["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcModelRouting["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/model-routing";
  import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";

  let { initial }: { initial: TcModelRouting["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcModelRouting;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcModelRouting["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-model-routing bind:this={el} {value}></tc-model-routing>
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
<tc-model-routing :value="value" @tc-value-change="value = $event.detail.value"></tc-model-routing>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-model-routing [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-model-routing>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-model-routing bind:this={el} {value}></tc-model-routing>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-model-routing")` returns a `TcModelRouting` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";`
- **React / Next.js:** Props: `import type { ModelRoutingProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ModelRouting>`. The element class, for refs: `import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcModelRouting["value"]` with `import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";`
- **Angular:** The directive types the template: `[value]` takes `TcModelRouting["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcModelRouting } from "@adamstavely/trenchcoat/model-routing";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group |
| `value` | `ModelRoutingValue` | The rules and the fallback chain (controlled) |
| `defaultValue` | `ModelRoutingValue` | The rules and the chain to start with when uncontrolled |
| `onChange` | `(value: ModelRoutingValue) => void` | Called with the whole routing after a reorder, removal or added fallback |
| `onTest` | `(input: string, value: ModelRoutingValue) => void` | Test a route was submitted: work out where `input` goes and pass the answer back as `testResult` |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each rule's handle and Remove, the chain's handles and Removes, Add a fallback, the test field and Test |
| ↑ / ↓ | On a handle: moves that rule or fallback one place earlier or later |
| ← / → | On a fallback's handle: moves it one place earlier or later |
| Home / End | On a handle: moves it to the start or the end |
| Enter | In the test field: runs the test |
| Space / Enter | On Remove or Test: does it |

Focus stays on the handle after a move. Add a fallback is a native select.

### Screen readers

The host is a group named by the heading. The rules and the chain are ordered lists named “Rules, first match wins”
and “Otherwise, try in order”; each rule reads its conditions, then “send to” and the target with its status and
breaker state. A handle is named “Move Long inputs, position 1 of 3” and described by “Arrow keys move it; Home and
End move it to the start or end.” A status region says where an item went – “Long inputs moved to position 2 of 3”
– and what was removed or added. The test result is a polite status region: “Asking where “…” would go…”, then the
verdict – “Long inputs matched, so it goes to Atlas 2.” – and the app's reasons as a numbered list.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.2 KB | 9.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **44.4 KB** | **12.3 KB** |
| With Lit – the first component on a page | 67.1 KB | 19.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 200 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of targets replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.7 ms | targets: first render, 296 nodes; update 0.3 ms |
| 1,000 items | 11 ms | targets: first render, 1,196 nodes; update 1.0 ms |

1,000 items of targets: 11 ms, 1,196 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Write conditions the way the router checks them: “Input is over 100k tokens”, “Plan is Enterprise”.
- Name rules for their purpose – “Long inputs”, “Quick lookups” – so the test verdict reads well.
- Make each health `note` say why: “Opened 3 min ago after 5 timeouts”, not only “Open”.
- Write `reasons` in the order the router decided, one fact per line.

## Do and don't

### Do

- Answer `tc-route-test` from the same router code that serves real requests, so the path shown is the real one.
- Keep `health` live; the breaker state is what people check first during an incident.
- Set `residency` when data must stay in a region, and still enforce it in the router.

### Don't

- Don't compute a route in the page to fill `testResult` – the component shows the app's decision, not its own.
- Don't put more than a handful of targets in the fallback chain; every step adds latency to a failing request.
- Don't hide a target that's down; show its state so people understand why requests went elsewhere.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Model Settings](model-settings.md) – The parameters a model supports, explained, with presets, a value signature, incompatible-setting feedback and what differs from the defaults
- [Provider connection](provider-connection.md) – A model provider connection read as a path – endpoint, credential, deployment – with each hop's health from an app-run test, the last check and the models it reports
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
