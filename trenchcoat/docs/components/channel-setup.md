<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Channel Setup

**AI configuration** · New

Connect one channel and set when an agent replies there – Connect, Where (a searchable pick of channels or inboxes), When it replies (every message, mentions, direct messages or business hours), Test and Go live, each checked in words before the next

- **Element:** `<tc-channel-setup>`
- **Size:** 10.4 KB gzip · 35.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/channel-setup";` |
| React / Next.js | `import { ChannelSetup } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/channel-setup";` · tags starting with tc- are custom elements |
| Angular | `import { ChannelSetup } from "@adamstavely/trenchcoat/angular/channel-setup";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/channel-setup";` |

## Example

The live example is in the gallery at `#/channel-setup`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Connect one channel and set when an agent replies there, in five short steps: **Connect** an account (the page handles
the authorization), pick **Where** it replies from a searchable list, choose **When it replies** – every message, when
mentioned, only in direct messages, or during business hours with a time range and a time zone – send a **Test**
message, then **Go live** from a summary. Next checks each step and says what's missing in words; Back keeps
everything, and earlier steps stay one click away in the step list.

### When to use

- Adding an agent to one channel – team chat, an inbox, a phone number – from its deployment settings.
- Any short connect-pick-test-launch flow where the page owns the authorization and the test.

### When not to use

- Seeing every channel an agent is in – use [Deploy Channels](deploy-channels.md).
- A general multi-step form with your own steps – use [Stepper Form](stepper-form.md).
- Settings for a service that's already connected – use [Integration Settings](integration-settings.md).
- Deciding what starts an agent, rather than where it replies – use [Trigger Builder](trigger-builder.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Step list** `.ui-chs__steps` – the five steps, done ones with a check and a button back
2. **Step of** `.ui-chs__step-of` – "Step 2 of 5 · Where", in place of the list when narrow
3. **Panel** `.ui-chs__panel` – the current step, under its **Heading** `.ui-chs__heading`
4. **Connected** `.ui-chs__connected` – "Connected as …" once the page sets `account`
5. **Targets** `.ui-chs__targets` – checkboxes for the places to reply in, under a search field
6. **Replies** `.ui-chs__radios` – when it replies, each with a line of explanation; **Hours** `.ui-chs__hours` for business hours
7. **Test** `.ui-chs__test` and **Result** `.ui-chs__result-card` – the message, Send test and what came back
8. **Summary** `.ui-chs__summary` – what goes live
9. **Error** `.ui-chs__error` – what stops the step, in words
10. **Footer** `.ui-chs__footer` – Back, and Next or Go live
11. **Done** `.ui-chs__done` – "Policy Q&A is live in Team chat"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Component tokens: `--tc-chs-mark` sizes the step marks and `--tc-chs-glyph` the small icons. Below 480 px the step list
becomes "Step 2 of 5 · Where" and the hours stack.

## Usage

### HTML

```html
<tc-channel-setup id="setup" heading="Put Policy Q&amp;A in team chat" channel="Team chat" agent="Policy Q&amp;A"></tc-channel-setup>

<script type="module">
  import "@adamstavely/trenchcoat/channel-setup";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#setup");
  el.targets = [
    { id: "policy", label: "#policy-questions", detail: "214 members" },
    { id: "starters", label: "#new-starters", detail: "38 members" },
  ];
  el.addEventListener("tc-connect", () => setTimeout(() => (el.account = "Research Institute workspace"), 500));
  el.addEventListener("tc-test", () => setTimeout(() => (el.testResult = { ok: true, reply: "Hi! Ask me about travel or expenses." }), 500));
  el.addEventListener("tc-go-live", (e) => console.log("live", e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ChannelSetup, type ChannelSetupStep, type ChannelTestResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const targets = [
  { id: "policy", label: "#policy-questions", detail: "214 members" },
  { id: "starters", label: "#new-starters", detail: "38 members" },
];

export function TeamChatSetup({ authorize, sendTest }: { authorize: () => Promise<string>; sendTest: (message: string) => Promise<ChannelTestResult> }) {
  const [step, setStep] = useState<ChannelSetupStep>("connect");
  const [account, setAccount] = useState("");
  const [result, setResult] = useState<ChannelTestResult | null>(null);
  return (
    <ChannelSetup
      title="Put Policy Q&A in team chat"
      channel="Team chat"
      agent="Policy Q&A"
      targets={targets}
      step={step}
      onStepChange={setStep}
      account={account}
      testResult={result}
      onConnect={() => void authorize().then(setAccount)}
      onTest={(message) => void sendTest(message).then(setResult)}
      onGoLive={(value) => console.log("live", value)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/channel-setup";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";

defineProps<{ value: TcChannelSetup["value"]; targets: TcChannelSetup["targets"] }>();
const onConnect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-channel-setup :value="value" :targets="targets" @tc-connect="onConnect"></tc-channel-setup>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChannelSetup } from "@adamstavely/trenchcoat/angular/channel-setup";
import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";

@Component({
  selector: "app-channel-setup-example",
  imports: [ChannelSetup],
  template: `<tc-channel-setup [value]="value()" [targets]="targets()" (tc-connect)="onConnect($event)"></tc-channel-setup>`,
})
export class ChannelSetupExample {
  readonly value = input.required<TcChannelSetup["value"]>();
  readonly targets = input.required<TcChannelSetup["targets"]>();
  onConnect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/channel-setup";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";

  let { value, targets }: { value: TcChannelSetup["value"]; targets: TcChannelSetup["targets"] } = $props();
  let el: TcChannelSetup;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-connect", on);
    return () => el.removeEventListener("tc-connect", on);
  });
</script>

<tc-channel-setup bind:this={el} {value} {targets}></tc-channel-setup>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Set up a channel"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `channel` | `channel` | `string` | `"this channel"` | The channel's name, used in the words: "Team chat" |
| `agent` | `agent` | `string` | `"The agent"` | The agent's name, used in the words: "Policy Q&A" |
| `step` | `step` | `ChannelSetupStep` | `"connect"` | The current step. Changed by Next, Back and the step list unless a tc-step-change listener prevents it |
| `value` | – | `ChannelSetupValue` | – | The settings. Changed by the user unless a tc-value-change listener prevents it |
| `account` | `account` | `string` | `""` | The connected account's name; empty while not connected |
| `connecting` | `connecting` | `boolean` | `false` | The page is authorizing: Connect waits |
| `targets` | – | `ChannelTarget[]` | `[]` | The places to pick in Where |
| `timeZones` | – | `string[]` | `["UTC", "Europe/London", "Europe/Lisbon", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles", "Asia/Singapore", "Australia/Sydney"]` | The time zones offered for business hours |
| `testMessage` | `test-message` | `string` | `"Hello! Can you tell me what you help with?"` | The message Send test sends; editable in the Test step |
| `testing` | `testing` | `boolean` | `false` | A test is on its way: Send test waits |
| `testResult` | – | `ChannelTestResult \| null` | `null` | The page's result for the last test; null before one |
| `live` | `live` | `boolean` | `false` | The channel is live: the setup shows its done state |
| `labels` | – | `ChannelSetupLabelsInput` | `{}` | Words the component uses, merged over defaultChannelSetupLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-connect` | – | No | Connect was pressed; the page authorizes, then sets `account` ({ step }: { step: "connect" }) |
| `tc-step-change` | – | Yes | The step is changing ({ step, previous }: ChannelStepChange); cancelable – prevented, the step stays |
| `tc-value-change` | – | Yes | The settings changed ({ value }: ChannelValueChange); cancelable – prevented, `value` stays as it was |
| `tc-test` | – | Yes | Send test was pressed ({ message, value }: ChannelTest); cancelable – not prevented, `testing` turns on until the page sets `testResult` |
| `tc-go-live` | – | Yes | Go live was pressed ({ value, account }: ChannelGoLive); cancelable – not prevented, the setup shows it's live |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-chs-mark` | `22px` | both |
| `--tc-chs-glyph` | `14px` | both |

#### Design tokens it reads (65)

`--tc-accent`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-sunken`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `channelStepProblem(step: ChannelSetupStep, ctx: { account: string; value: ChannelSetupValue; testResult: ChannelTestResult \| null }): "" \| keyof ChannelSetupLabels["errors"]` | What stops a step: the key of its error in labels.errors, or "" when it's fine |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-channel-setup :value="…">` | `<tc-channel-setup [value]="…">` | `<tc-channel-setup {value}>` |
| `targets` | `el.targets = …;` | `<… targets={…} />` | `<tc-channel-setup :targets="…">` | `<tc-channel-setup [targets]="…">` | `<tc-channel-setup {targets}>` |
| `timeZones` | `el.timeZones = …;` | `<… timeZones={…} />` | `<tc-channel-setup :timeZones="…">` | `<tc-channel-setup [timeZones]="…">` | `<tc-channel-setup {timeZones}>` |
| `testResult` | `el.testResult = …;` | `<… testResult={…} />` | `<tc-channel-setup :testResult="…">` | `<tc-channel-setup [testResult]="…">` | `<tc-channel-setup {testResult}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-channel-setup :labels="…">` | `<tc-channel-setup [labels]="…">` | `<tc-channel-setup {labels}>` |

*Also attributes: `heading`, `description`, `channel`, `agent`, `step`, `account`, `connecting`, `test-message` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-connect` | No | `el.addEventListener("tc-connect", (e) => …)` | `onConnect={…}` | `@tc-connect="…"` | `(tc-connect)="…($event)"` | `el.addEventListener("tc-connect", …)` |
| `tc-step-change` | Yes | `el.addEventListener("tc-step-change", (e) => …)` | `ref.current.addEventListener("tc-step-change", …)` | `@tc-step-change="…"` | `(tc-step-change)="…($event)"` | `el.addEventListener("tc-step-change", …)` |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-test` | Yes | `el.addEventListener("tc-test", (e) => …)` | `onTest={…}` | `@tc-test="…"` | `(tc-test)="…($event)"` | `el.addEventListener("tc-test", …)` |
| `tc-go-live` | Yes | `el.addEventListener("tc-go-live", (e) => …)` | `onGoLive={…}` | `@tc-go-live="…"` | `(tc-go-live)="…($event)"` | `el.addEventListener("tc-go-live", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `step` and `value` itself unless a listener calls `preventDefault()` on `tc-step-change` or `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-channel-setup id="channel-setup"></tc-channel-setup>

<script type="module">
  import "@adamstavely/trenchcoat/channel-setup";

  const el = document.querySelector("#channel-setup");
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
import "@adamstavely/trenchcoat/channel-setup";
import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";

const props = defineProps<{ initial: TcChannelSetup["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcChannelSetup["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-channel-setup :value="value" @tc-value-change="onValueChange"></tc-channel-setup>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChannelSetup } from "@adamstavely/trenchcoat/angular/channel-setup";
import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";

@Component({
  selector: "app-controlled-channel-setup",
  imports: [ChannelSetup],
  template: `<tc-channel-setup [value]="value()" (tc-value-change)="onValueChange($event)"></tc-channel-setup>`,
})
export class ControlledChannelSetup {
  readonly initial = input.required<TcChannelSetup["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcChannelSetup["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/channel-setup";
  import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";

  let { initial }: { initial: TcChannelSetup["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcChannelSetup;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcChannelSetup["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-channel-setup bind:this={el} {value}></tc-channel-setup>
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
<tc-channel-setup :value="value" @tc-value-change="value = $event.detail.value"></tc-channel-setup>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-channel-setup [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-channel-setup>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-channel-setup bind:this={el} {value}></tc-channel-setup>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-channel-setup")` returns a `TcChannelSetup` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";`
- **React / Next.js:** Props: `import type { ChannelSetupProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChannelSetup>`. The element class, for refs: `import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChannelSetup["value"]` with `import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";`
- **Angular:** The directive types the template: `[value]` takes `TcChannelSetup["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChannelSetup } from "@adamstavely/trenchcoat/channel-setup";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "Set up a channel" by default |
| `step` | `ChannelSetupStep` | The current step – controlled when given |
| `defaultStep` | `ChannelSetupStep` | On mount, when `step` isn't controlled |
| `onStepChange` | `(step: ChannelSetupStep) => void` | Called with the next step – Next, Back or a step in the list |
| `value` | `ChannelSetupValue` | The settings – controlled when given |
| `defaultValue` | `ChannelSetupValue` | On mount, when `value` isn't controlled |
| `onValueChange` | `(value: ChannelSetupValue) => void` | Called with the next settings as they're edited |
| `onConnect` | `() => void` | Connect was pressed: authorize, then pass `account` |
| `onTest` | `(message: string, value: ChannelSetupValue) => boolean \| void` | Send test was pressed: send it, then pass `testResult`. Return false to stop the button waiting |
| `onGoLive` | `(value: ChannelSetupValue, account: string) => boolean \| void` | Go live was pressed. Return false to stay on the summary |

*Renamed or hidden on the wrapper: `heading`, `step`, `value`, `defaultValue`, `children`*

## Accessibility

### Keyboard

Everything is a native control in tab order.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the step list, the step's controls, Back and Next |
| Space | Ticks a place in Where; picks a reply mode |
| Arrow keys | Move between the reply modes |
| Enter / Space | Presses Connect, Send test, Back, Next or Go live; a done step in the list goes back to it |

When the step changes, focus moves to the new step's heading. When Next finds a problem, focus moves to the control to
fix.

### Screen readers

The step list is a navigation landmark ("Setup steps"); the current step has `aria-current="step"` and done steps say
"done". Each step is a section named by its heading. The places and the reply modes are fieldsets, each mode described by
its line of explanation. An error is linked to its controls with `aria-describedby` and announced, as are Sending… and
going live. The test's result is in a status region.

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
| **This component alone** | 27.5 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.0 KB** | **10.4 KB** |
| With Lit – the first component on a page | 57.3 KB | 17.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of timeZones replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.9 ms | timeZones: first render, 69 nodes; update 0.1 ms |
| 1,000 items | 0.5 ms | timeZones: first render, 69 nodes; update 0.1 ms |

What it renders doesn't grow with timeZones (tested to 1,000 items).

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

- Name `channel` and `agent` as people know them: they appear in the words ("Policy Q&A is live in Team chat").
- Give each target a `detail` that helps choosing: member counts, private or not.
- A failed `testResult` should say what to fix in `message`.

## Do and don't

### Do

- Set `account` once authorization succeeds, and `testResult` when the test comes back – the buttons wait until then.
- Control `step` and `value` when the page saves progress as people go.

### Don't

- Don't skip the test: Next won't pass it without a test that got a reply.
- Don't put secrets in `account`; it's shown as written.

## Related

- [Deploy Channels](deploy-channels.md) – Where an agent can be reached, one row per channel – live first, status as a mark and a word, the version it serves, last week's messages, and Set up, Configure, Pause or Resume
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
