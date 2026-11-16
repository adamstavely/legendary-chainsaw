<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Controls

**AI & chat** · New

Every control a running agent needs in one composer – Stop, then Resume from where the answer stopped, Retry or Dismiss; steer it mid-answer or queue what's next as numbered chips; Chat or Act, permissions and how full the context is, folding into More when narrow

- **Element:** `<tc-run-controls>`
- **Size:** 8.9 KB gzip · 30.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-controls";` |
| React / Next.js | `import { RunControls } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-controls";` · tags starting with tc- are custom elements |
| Angular | `import { RunControls } from "@adamstavely/trenchcoat/angular/run-controls";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-controls";` |

## Example

The live example is in the gallery at `#/run-controls`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every control a running agent needs, in one composer. While it answers there's **Stop**, and the field either
**steers** the answer in progress or **queues** what to ask next – queued asks wait above the field as numbered chips
and go out in order. After a stop, or when the connection drops, it says so with how much had arrived, and offers
**Resume** (carry on from where the answer stopped), **Retry** and **Dismiss**. Under the field sit **Chat** or
**Act**, what the agent may do without asking, and how full the context is ("62% of context").

Every button is an event: the app streams, stops and resumes, and owns the state.

### When to use

- Chat and agent products where answers take a while and people want to stop, redirect or line up the next ask.
- Any streamed answer that should survive a stop or a dropped connection and carry on from where it was.

### When not to use

- A plain prompt box with a model picker, attachments and voice – use [Chat Composer](chat-composer.md).
- Steering a multi-step plan, with the note landing in a step – use [Agent Steering](agent-steering.md).
- Actions on an answer that's finished (copy, regenerate, rate) – use [Message Actions](message-actions.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Status** `.ui-runc__status` – "Answering…" with how many are queued, or "Stopped at 1,240 characters" with Resume, Retry and Dismiss
2. **Queue** `.ui-runc__queue` – one `.ui-runc__chip` per queued ask, numbered, each with a remove button `.ui-runc__chip-x`
3. **Field** `.ui-runc__field` – the text to send, steer with or queue
4. **Mode** `.ui-runc__modes` – Chat or Act, a radio group
5. **Permissions** `.ui-runc__select` – Ask before acting, Auto-edit, Full access
6. **More** `.ui-runc__more` – narrow only: mode and permissions in a menu
7. **Context** `.ui-runc__context` – a ring and "62% of context"
8. **Main button** `.ui-runc__round` – Send, or Stop while it answers

## Looks

Standard puts the composer card on the gray tray; Clean is one white card. `heading` adds a card header. Under 440 px
the mode and permissions fold into **More** and the context shows its percentage only.

## Usage

### HTML

```html
<tc-run-controls id="run" state="streaming" context="0.62" partial="1240"></tc-run-controls>

<script type="module">
  import "@adamstavely/trenchcoat/run-controls";
  import "@adamstavely/trenchcoat/tokens.css";

  const run = document.querySelector("#run");
  run.queue = ["Then shorten the budget notes"];
  run.addEventListener("tc-stop", (e) => console.log("stopped at", e.detail.partial));
  run.addEventListener("tc-resume", (e) => console.log("resume from", e.detail.from));
  run.addEventListener("tc-steer", (e) => console.log("steer", e.detail.note));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RunControls, type RunControlsState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Composer({ partial, stream }: { partial: number; stream: { stop: () => void; resume: (from: number) => void; send: (text: string) => void } }) {
  const [state, setState] = useState<RunControlsState>("idle");
  return (
    <RunControls
      state={state}
      onStateChange={setState}
      partial={partial}
      context={0.62}
      onSend={(text) => stream.send(text)}
      onStop={() => stream.stop()}
      onResume={(from) => stream.resume(from)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-controls";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";

defineProps<{ queue: TcRunControls["queue"]; labels: TcRunControls["labels"] }>();
const onSend = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-controls :queue="queue" :labels="labels" @tc-send="onSend"></tc-run-controls>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunControls } from "@adamstavely/trenchcoat/angular/run-controls";
import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";

@Component({
  selector: "app-run-controls-example",
  imports: [RunControls],
  template: `<tc-run-controls [queue]="queue()" [labels]="labels()" (tc-send)="onSend($event)"></tc-run-controls>`,
})
export class RunControlsExample {
  readonly queue = input.required<TcRunControls["queue"]>();
  readonly labels = input.required<TcRunControls["labels"]>();
  onSend(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-controls";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";

  let { queue, labels }: { queue: TcRunControls["queue"]; labels: TcRunControls["labels"] } = $props();
  let el: TcRunControls;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-send", on);
    return () => el.removeEventListener("tc-send", on);
  });
</script>

<tc-run-controls bind:this={el} {queue} {labels}></tc-run-controls>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | A heading for the card; empty (the default) leaves the header out |
| `state` | `state` | `RunControlsState` | `"idle"` | Where the run is. Changed by the controls unless tc-state-change is prevented |
| `mode` | `mode` | `RunControlsMode` | `"chat"` | Chat or Act. Changed by the toggle unless tc-mode-change is prevented |
| `permission` | `permission` | `RunControlsPermission` | `"ask"` | What the agent may do without asking. Changed by the select unless tc-permission-change is prevented |
| `queue` | – | `string[]` | `[]` | The asks waiting to go out, in order. Changed by Queue and the chips unless tc-queue-change is prevented |
| `context` | `context` | `number \| undefined` | `undefined` | How full the context window is, 0–1; unset hides the ring |
| `partial` | `partial` | `number` | `0` | How many characters of the answer have arrived – Resume carries on from here |
| `value` | `value` | `string` | `""` | The text in the field |
| `disabled` | `disabled` | `boolean` | `false` | Everything disabled |
| `labels` | – | `Partial<RunControlsLabels>` | `{}` | The words it uses, merged over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-send` | – | Yes | Send was pressed ({ text }: RunControlsSend); cancelable – prevented, the text stays and the state doesn't change |
| `tc-steer` | – | Yes | A steering note was sent while it answers ({ note }: RunControlsSteer); cancelable – prevented, the note stays |
| `tc-stop` | – | Yes | Stop was pressed ({ partial }: RunControlsStop); cancelable – prevented, the state stays |
| `tc-resume` | – | Yes | Resume was pressed ({ from }: RunControlsResume); cancelable – prevented, the state stays |
| `tc-retry` | – | Yes | Retry was pressed (detail: {}); cancelable – prevented, the state stays |
| `tc-dismiss` | – | Yes | Dismiss was pressed (detail: {}); cancelable – prevented, the state stays |
| `tc-state-change` | – | Yes | The state is about to change ({ state }: RunControlsStateChange); cancelable – prevented, `state` stays as it was |
| `tc-mode-change` | – | Yes | Chat or Act was chosen ({ mode }: RunControlsModeChange); cancelable – prevented, `mode` stays as it was |
| `tc-permission-change` | – | Yes | A permission was chosen ({ permission }: RunControlsPermissionChange); cancelable – prevented, `permission` stays as it was |
| `tc-queue-change` | – | Yes | An ask was queued or removed ({ queue }: RunControlsQueueChange); cancelable – prevented, `queue` stays as it was |

#### Design tokens it reads (70)

`--tc-accent-solid`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-menu-bg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `queue` | `el.queue = …;` | `<… queue={…} />` | `<tc-run-controls :queue="…">` | `<tc-run-controls [queue]="…">` | `<tc-run-controls {queue}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-run-controls :labels="…">` | `<tc-run-controls [labels]="…">` | `<tc-run-controls {labels}>` |

*Also attributes: `heading`, `state`, `mode`, `permission`, `context`, `partial`, `value`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-steer` | Yes | `el.addEventListener("tc-steer", (e) => …)` | `onSteer={…}` | `@tc-steer="…"` | `(tc-steer)="…($event)"` | `el.addEventListener("tc-steer", …)` |
| `tc-stop` | Yes | `el.addEventListener("tc-stop", (e) => …)` | `onStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |
| `tc-resume` | Yes | `el.addEventListener("tc-resume", (e) => …)` | `onResume={…}` | `@tc-resume="…"` | `(tc-resume)="…($event)"` | `el.addEventListener("tc-resume", …)` |
| `tc-retry` | Yes | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-dismiss` | Yes | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |
| `tc-state-change` | Yes | `el.addEventListener("tc-state-change", (e) => …)` | `ref.current.addEventListener("tc-state-change", …)` | `@tc-state-change="…"` | `(tc-state-change)="…($event)"` | `el.addEventListener("tc-state-change", …)` |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `ref.current.addEventListener("tc-mode-change", …)` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |
| `tc-permission-change` | Yes | `el.addEventListener("tc-permission-change", (e) => …)` | `ref.current.addEventListener("tc-permission-change", …)` | `@tc-permission-change="…"` | `(tc-permission-change)="…($event)"` | `el.addEventListener("tc-permission-change", …)` |
| `tc-queue-change` | Yes | `el.addEventListener("tc-queue-change", (e) => …)` | `ref.current.addEventListener("tc-queue-change", …)` | `@tc-queue-change="…"` | `(tc-queue-change)="…($event)"` | `el.addEventListener("tc-queue-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `state`, `mode`, `permission` and `queue` itself unless a listener calls `preventDefault()` on `tc-state-change`, `tc-mode-change`, `tc-permission-change` or `tc-queue-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-run-controls id="run-controls"></tc-run-controls>

<script type="module">
  import "@adamstavely/trenchcoat/run-controls";

  const el = document.querySelector("#run-controls");
  el.addEventListener("tc-state-change", (e) => {
    e.preventDefault(); // the element keeps its state…
    if (allowed(e.detail.state)) el.state = e.detail.state; // …until the app sets it
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
import "@adamstavely/trenchcoat/run-controls";
import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";

const props = defineProps<{ initial: TcRunControls["state"] }>();
const state = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStateChange = (e: CustomEvent<{ state: TcRunControls["state"] }>) => {
  e.preventDefault();
  state.value = e.detail.state;
};
</script>

<template>
  <tc-run-controls :state="state" @tc-state-change="onStateChange"></tc-run-controls>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RunControls } from "@adamstavely/trenchcoat/angular/run-controls";
import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";

@Component({
  selector: "app-controlled-run-controls",
  imports: [RunControls],
  template: `<tc-run-controls [state]="state()" (tc-state-change)="onStateChange($event)"></tc-run-controls>`,
})
export class ControlledRunControls {
  readonly initial = input.required<TcRunControls["state"]>();
  readonly state = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStateChange(e: CustomEvent<{ state: TcRunControls["state"] }>) {
    e.preventDefault();
    this.state.set(e.detail.state);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-controls";
  import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";

  let { initial }: { initial: TcRunControls["state"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let state = $derived(initial);
  let el: TcRunControls;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      state = (e as CustomEvent<{ state: TcRunControls["state"] }>).detail.state;
    };
    el.addEventListener("tc-state-change", on);
    return () => el.removeEventListener("tc-state-change", on);
  });
</script>

<tc-run-controls bind:this={el} {state}></tc-run-controls>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-controls")` returns a `TcRunControls` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";`
- **React / Next.js:** Props: `import type { RunControlsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunControls>`. The element class, for refs: `import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunControls["queue"]` with `import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";`
- **Angular:** The directive types the template: `[queue]` takes `TcRunControls["queue"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunControls } from "@adamstavely/trenchcoat/run-controls";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | A heading for the card; "" (the default) leaves the header out |
| `state` | `RunControlsState` | Where the run is – controlled when given |
| `defaultState` | `RunControlsState` | Where the run is at first, when `state` isn't controlled |
| `onStateChange` | `(state: RunControlsState) => void` | The controls moved the run to another state |
| `mode` | `RunControlsMode` | Chat or Act – controlled when given |
| `defaultMode` | `RunControlsMode` | The mode at first, when `mode` isn't controlled |
| `onModeChange` | `(mode: RunControlsMode) => void` | Chat or Act was chosen |
| `permission` | `RunControlsPermission` | What the agent may do without asking – controlled when given |
| `defaultPermission` | `RunControlsPermission` | The permission at first, when `permission` isn't controlled |
| `onPermissionChange` | `(permission: RunControlsPermission) => void` | A permission was chosen |
| `queue` | `string[]` | The queued asks – controlled when given |
| `defaultQueue` | `string[]` | The queued asks at first, when `queue` isn't controlled |
| `onQueueChange` | `(queue: string[]) => void` | An ask was queued or removed |
| `onSend` | `(text: string) => void \| boolean` | Send was pressed; return false to keep the text and the state |
| `onSteer` | `(note: string) => void \| boolean` | A steering note was sent; return false to keep it in the field |
| `onStop` | `(partial: number) => void` | Stop was pressed, with how much of the answer had arrived |
| `onResume` | `(from: number) => void` | Resume was pressed: carry on from this many characters in |
| `onRetry` | `() => void` | Retry was pressed |
| `onDismiss` | `() => void` | Dismiss was pressed |

*Renamed or hidden on the wrapper: `heading`, `state`, `mode`, `permission`, `queue`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter | Sends; while it answers, steers |
| Shift+Enter | A new line |
| Escape | In the field while it answers: stops it |
| ← / → | Chat or Act, in the mode group |
| Escape | In the More menu: closes it, back to More |

### Screen readers

The field is labelled "Message"; the main button is named Send or Stop. Chat and Act are a radio group named "Mode";
permissions are a select named "Permissions". The context is a meter named "62% of context". Queued asks are an
ordered list named "1 queued", each remove button "Remove Then shorten the budget notes". A polite status region
announces "Answering…", "Stopped at 1,240 characters", "Connection lost at 1,240 characters" and "Done".

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.2 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.6 KB** | **8.9 KB** |
| With Lit – the first component on a page | 53.3 KB | 16.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 37 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of queue replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 10 ms | queue: first render, 730 nodes; update 0.4 ms |
| 1,000 items | 27 ms | queue: first render, 7,030 nodes; update 2.5 ms |

1,000 items of queue: 27 ms, 7,030 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep the placeholders short; the defaults are "Ask anything" and, while it answers, "Steer it, or queue what's next".
- Queued asks show as the person wrote them; they're trimmed, not rewritten.
- Rename the permission levels with `labels` to match your product ("Ask before acting", "Auto-edit", "Full access").

## Do and don't

### Do

- Keep `partial` current, so Resume can carry on from the right place.
- Send queued asks in order, one per finished answer, and remove each from `queue` as it goes out.

### Don't

- Don't clear the answer on Stop – Resume needs it.
- Don't hide Retry after a dropped connection; a resume isn't always possible.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Agent Steering](agent-steering.md) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
