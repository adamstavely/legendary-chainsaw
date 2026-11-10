<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Gate Config

**Trust & calibration** · New

When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do

- **Element:** `<tc-gate-config>`
- **Size:** 15.9 KB gzip · 64.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/gate-config";` |
| React / Next.js | `import { GateConfig } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/gate-config";` · tags starting with tc- are custom elements |
| Angular | `import { GateConfig } from "@adamstavely/trenchcoat/angular/gate-config";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/gate-config";` |

## Example

The live example is in the gallery at `#/gate-config`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Sets up a review gate: the point in an agent's workflow where the run stops and a person decides. People switch on
the conditions that pause the run, pick who reviews, choose what the reviewer is shown – the output, the output with
its evidence, or the full trace – tick the actions the reviewer may take, and write down why the gate is there. The
whole gate is read back as one plain sentence, so the team can check it pauses when they meant it to. It is a form
control: with `name` it submits the config as JSON.

### When to use

- Configuring human review in an agent workflow – before money moves, a message goes out or a record changes.
- Settings pages where a team decides how much oversight an automation gets.
- Inside a playbook's review step – `playbook-canvas` embeds one with `flat`.

### When not to use

- Asking a person to allow one specific action right now – use [Permission Request](permission-request.md).
- Testing an action against the policy set without running it – use [Policy Simulator](policy-simulator.md).
- Choosing one option from two to five – use [Segmented Control](segmented-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a pause icon, the gate's name, an optional line under it, and how many conditions pause it
2. **Conditions** `.ui-gc__conds` – one switch per condition that can pause the run
3. **Reviewer** `.ui-gc__select` – who reviews, a native select
4. **What they see** `.ui-gc__view` – a segmented control, with a line describing the picked view
5. **Actions** `.ui-gc__checks` – a checkbox per action the reviewer may take
6. **Sentence** `.ui-gc__summary` – the gate in plain words

## Looks

Standard puts the header on a gray tray above a white card, with filled checkboxes in ink. Clean is one white
card with hairline shadows and the header as its first row, smaller blue checkboxes, separate chips for the views and an accent-tinted
sentence. With `flat` either look drops the tray and the card, for a gate inside another card. In a narrow container
the labels sit above their controls and the pause count is hidden.

## Usage

### HTML

```html
<form>
  <tc-gate-config id="gate" name="gate"></tc-gate-config>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/gate-config";
  import "@adamstavely/trenchcoat/tokens.css";

  const gate = document.querySelector("#gate");
  gate.heading = "Before a refund goes out";
  gate.value = {
    triggers: ["low-confidence", "irreversible"],
    reviewer: "lead",
    view: "evidence",
    actions: ["approve", "send-back", "reject"],
    reason: "Refunds can't be pulled back once they reach the card.",
  };
  gate.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { GateConfig, type GateConfigValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RefundGate() {
  const [value, setValue] = useState<GateConfigValue>({
    triggers: ["low-confidence", "irreversible"],
    reviewer: "lead",
    view: "evidence",
    actions: ["approve", "send-back", "reject"],
    reason: "",
  });
  return <GateConfig title="Before a refund goes out" value={value} onChange={setValue} name="gate" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/gate-config";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";

defineProps<{ value: TcGateConfig["value"]; conditions: TcGateConfig["conditions"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-gate-config :value="value" :conditions="conditions" @tc-value-change="onValueChange"></tc-gate-config>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GateConfig } from "@adamstavely/trenchcoat/angular/gate-config";
import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";

@Component({
  selector: "app-gate-config-example",
  imports: [GateConfig],
  template: `<tc-gate-config [value]="value()" [conditions]="conditions()" (tc-value-change)="onValueChange($event)"></tc-gate-config>`,
})
export class GateConfigExample {
  readonly value = input.required<TcGateConfig["value"]>();
  readonly conditions = input.required<TcGateConfig["conditions"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gate-config";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";

  let { value, conditions }: { value: TcGateConfig["value"]; conditions: TcGateConfig["conditions"] } = $props();
  let el: TcGateConfig;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-gate-config bind:this={el} {value} {conditions}></tc-gate-config>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `GateConfigValue` | `{ triggers: ["low-confidence", "irreversible"], reviewer: "lead", view: "evidence", actions: ["approve", "send-back", "reject"], reason: "" }` | The gate's config. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `conditions` | – | `GateCondition[]` | `[ { id: "low-confidence", label: "Confidence is low", description: "The agent rates its own answer under the threshold" }, { id: "no-source", label: "A claim has no source", description: "Something in the output isn't backed by a retrieved source" }, { id: "irreversible", label: "The next action can't be undone", description: "Sending, paying, deleting or publishing" }, { id: "personal-data", label: "It touches personal data", description: "Names, contact details or records about a person" }, { id: "new-version", label: "The playbook just changed", description: "The first ten runs after a new version" }, ]` | The conditions that can pause a run, each shown as a switch |
| `reviewers` | – | `GateReviewer[]` | `[ { id: "owner", label: "Whoever started the run" }, { id: "lead", label: "A team lead" }, { id: "on-call", label: "The on-call reviewer" }, { id: "named", label: "A named approver" }, ]` | Who can review, offered in the Reviewer select |
| `views` | – | `GateView[]` | `[ { id: "output", label: "Output", phrase: "the output", description: "The result only, as it would go out" }, { id: "evidence", label: "With evidence", phrase: "the output with its evidence", description: "The result, the sources behind it and the agent's confidence" }, { id: "trace", label: "Full trace", phrase: "the full trace", description: "Every step, tool call and source of the run" }, ]` | What a reviewer can be shown, offered as a segmented control – two to four work best |
| `actions` | – | `GateActionOption[]` | `[ { id: "approve", label: "Approve", description: "The run carries on as it is" }, { id: "edit", label: "Edit and approve", description: "Change the output, then carry on" }, { id: "send-back", label: "Send back", description: "The agent tries again with the reviewer's note" }, { id: "escalate", label: "Escalate", description: "Hand the decision to someone more senior" }, { id: "reject", label: "Reject", description: "The run stops here" }, ]` | The actions a reviewer may be allowed, shown as checkboxes |
| `heading` | `heading` | `string` | `"Review gate"` | Names the group, shown at the top |
| `description` | `description` | `string` | `""` | A quieter line under the heading, e.g. which step the gate guards |
| `placeholder` | `placeholder` | `string` | `"Why a person decides here – the reviewer reads this first"` | Placeholder for the note |
| `flat` | `flat` | `boolean` | `false` | Drops the tray and the card, for a gate inside another card |
| `name` | `name` | `string` | `""` | Submitted with the form: the config as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the config out of the form; a disabled fieldset does the same |
| `summary` | – | `string` | – | The config in one sentence |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The config changed ({ value: GateConfigValue }); cancelable – prevent it to control `value` |

#### Design tokens it reads (78)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-control`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `describeGate(value: GateConfigValue, o: { conditions?: GateCondition[]; reviewers?: GateReviewer[]; views?: GateView[]; actions?: GateActionOption[] }): string` | The gate in plain words: "Pauses when confidence is low or a claim has no source, for a team lead to review the output with its evidence. They may approve, send back or reject." |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-gate-config :value="…">` | `<tc-gate-config [value]="…">` | `<tc-gate-config {value}>` |
| `conditions` | `el.conditions = …;` | `<… conditions={…} />` | `<tc-gate-config :conditions="…">` | `<tc-gate-config [conditions]="…">` | `<tc-gate-config {conditions}>` |
| `reviewers` | `el.reviewers = …;` | `<… reviewers={…} />` | `<tc-gate-config :reviewers="…">` | `<tc-gate-config [reviewers]="…">` | `<tc-gate-config {reviewers}>` |
| `views` | `el.views = …;` | `<… views={…} />` | `<tc-gate-config :views="…">` | `<tc-gate-config [views]="…">` | `<tc-gate-config {views}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-gate-config :actions="…">` | `<tc-gate-config [actions]="…">` | `<tc-gate-config {actions}>` |

*Also attributes: `heading`, `description`, `placeholder`, `flat`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-gate-config id="gate-config"></tc-gate-config>

<script type="module">
  import "@adamstavely/trenchcoat/gate-config";

  const el = document.querySelector("#gate-config");
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
import { GateConfig } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof GateConfig>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledGateConfig({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <GateConfig {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/gate-config";
import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";

const props = defineProps<{ initial: TcGateConfig["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcGateConfig["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-gate-config :value="value" @tc-value-change="onValueChange"></tc-gate-config>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { GateConfig } from "@adamstavely/trenchcoat/angular/gate-config";
import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";

@Component({
  selector: "app-controlled-gate-config",
  imports: [GateConfig],
  template: `<tc-gate-config [value]="value()" (tc-value-change)="onValueChange($event)"></tc-gate-config>`,
})
export class ControlledGateConfig {
  readonly initial = input.required<TcGateConfig["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcGateConfig["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/gate-config";
  import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";

  let { initial }: { initial: TcGateConfig["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcGateConfig;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcGateConfig["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-gate-config bind:this={el} {value}></tc-gate-config>
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
<tc-gate-config :value="value" @tc-value-change="value = $event.detail.value"></tc-gate-config>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-gate-config [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-gate-config>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-gate-config bind:this={el} {value}></tc-gate-config>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-gate-config")` returns a `TcGateConfig` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";`
- **React / Next.js:** Props: `import type { GateConfigProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GateConfig>`. The element class, for refs: `import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGateConfig["value"]` with `import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";`
- **Angular:** The directive types the template: `[value]` takes `TcGateConfig["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGateConfig } from "@adamstavely/trenchcoat/gate-config";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group |
| `value` | `GateConfigValue` | The gate's config (controlled) |
| `defaultValue` | `GateConfigValue` | The config to start with when uncontrolled |
| `onChange` | `(value: GateConfigValue) => void` | Called with the whole config after every change |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switches, the reviewer, the views, the action checkboxes and the note, in that order |
| Space / Enter | On a switch: turns the condition on or off; on an action: allows or disallows it |
| ← / → / ↑ / ↓ | In They see: picks the previous or next view |
| Home / End | In They see: picks the first or last view |

The reviewer is a native select and the note a native textarea, with their usual keys. Clicking a condition's text
flips its switch too.

### Screen readers

The host is a group named by the heading. Each condition is a `switch` named by its label and described by the line
under it, with `aria-checked`. The views are a radiogroup named “They see” and described by the picked view's line.
The actions are a group named “They may” of `checkbox` buttons with `aria-checked`; when none is allowed, the group
is described by “Allow at least one action – a reviewer has to be able to answer”. After each change a status region
reads the new sentence – “Pauses when the refund is over $250 or money leaves the account, for a team lead to review
the output with its evidence. They may approve, edit and approve, send back or reject.” – but not on first render. In
a form, a gate without any action is invalid (“Allow at least one action.”).

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
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
| **This component alone** | 25.9 KB | 8.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **64.0 KB** | **16.0 KB** |
| With Lit – the first component on a page | 86.3 KB | 23.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 132 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of conditions replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.1 ms | conditions: first render, 702 nodes; update 0.5 ms |
| 1,000 items | 32 ms | conditions: first render, 6,102 nodes; update 3.2 ms |

1,000 items of conditions: 32 ms, 6,102 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write conditions as things that are true of the run: “Confidence is low”, “The refund is over $250”. They are
  lower-cased into the sentence after “Pauses when”.
- Name reviewers as a role or a person, with an article: “A team lead”, “The on-call reviewer”.
- Give each view a `phrase` for the sentence (“the output with its evidence”) and a `description` of what the
  reviewer actually gets.
- The note is for the reviewer: say what could go wrong if nobody looked – “Refunds can't be pulled back once they
  reach the card.”

## Do and don't

### Do

- Pass your product's own conditions, reviewers, views and actions – the defaults are generic.
- Keep at least one way to finish: approve or edit and approve, and reject. The gate hints when nothing can be
  approved.
- Store the value as it is – `triggers`, `reviewer`, `view`, `actions` and `reason` – and evaluate the triggers on the
  server; `describeGate` is exported for the same sentence elsewhere.

### Don't

- Don't turn on every condition by default: a gate that always pauses teaches reviewers to approve without reading.
- Don't drop the note – a reviewer who knows why the gate exists checks the right thing.
- Don't use more than four views; the segmented control needs the room.

## Related

- [Playbook Canvas](playbook-canvas.md) – An agent workflow, phase by phase – triggers, intake, context, analysis and review as steps you add and order, with review gates, versions and a dry run
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Policy Simulator](policy-simulator.md) – Try an action against the policy before it's real – allow, needs approval, deny or hard stop, the rule that decided it and why
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
