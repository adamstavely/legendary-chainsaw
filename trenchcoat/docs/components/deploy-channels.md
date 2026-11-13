<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Deploy Channels

**AI configuration** · New

Where an agent can be reached, one row per channel – live first, status as a mark and a word, the version it serves, last week's messages, and Set up, Configure, Pause or Resume

- **Element:** `<tc-deploy-channels>`
- **Size:** 7.3 KB gzip · 22.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/deploy-channels";` |
| React / Next.js | `import { DeployChannels } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/deploy-channels";` · tags starting with tc- are custom elements |
| Angular | `import { DeployChannels } from "@adamstavely/trenchcoat/angular/deploy-channels";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/deploy-channels";` |

## Example

The live example is in the gallery at `#/deploy-channels`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where an agent can be reached, one row per place: a web widget, the API, team chat, email, text messages or a phone line.
Each row says whether the channel is live, a draft, paused, failing or not set up – with a mark and a word – which version
of the agent it answers with, and how many messages it handled in the last 7 days. Its actions follow its status: Set up,
Configure, Pause or Resume. Live channels come first, then the ones that need attention, so the list reads as a status
board.

### When to use

- An agent's settings page, saying where it's reachable and what's wrong.
- Before publishing a new version, to see which channels still serve the draft.

### When not to use

- Connecting one channel step by step – use [Channel Setup](channel-setup.md).
- A machine, folder or repository a session runs in – use [Environment List](environment-list.md).
- One connected service's settings – use [Integration Settings](integration-settings.md).
- Moving a configuration between environments with approvals – use [Configuration release control](configuration-release-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-dpc__row` – one channel, with its `data-status`
2. **Icon** `.ui-dpc__icon` – the kind's, or the page's own `icon`
3. **Name** `.ui-dpc__name` and **Detail** `.ui-dpc__detail` – what people call it, and where it is
4. **Error** `.ui-dpc__error` – what's wrong, for a failing channel
5. **Status** `.ui-dpc__status` – a mark and a word: Live, Error, Paused, Draft or Not set up
6. **Version** `.ui-dpc__version` – Live version or Draft version
7. **Traffic** `.ui-dpc__traffic` – a small line of the week and the total in words
8. **Actions** `.ui-dpc__actions` – Set up, Configure, Pause or Resume
9. **Summary** `.ui-dpc__summary` – in the header: how many are live, and how many need attention

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Component tokens: `--tc-dpc-spark-w` and `--tc-dpc-spark-h` size the traffic line, `--tc-dpc-mark` the status mark and
`--tc-dpc-icon` the row's icon. Below 640 px a row's version, traffic and actions move under its name.

## Usage

### HTML

```html
<tc-deploy-channels id="channels" heading="Where Policy Q&amp;A answers"></tc-deploy-channels>

<script type="module">
  import "@adamstavely/trenchcoat/deploy-channels";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#channels");
  el.channels = [
    { id: "web", kind: "widget", name: "Intranet widget", status: "live", version: "live", traffic: [182, 204, 197, 221, 176, 64, 51] },
    { id: "chat", kind: "chat", name: "Team chat", status: "draft", version: "draft" },
    { id: "sms", kind: "sms", name: "Text messages", status: "not-set-up" },
  ];
  el.addEventListener("tc-channel-action", (e) => console.log(e.detail.action, e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DeployChannels, type DeployChannel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: DeployChannel[] = [
  { id: "web", kind: "widget", name: "Intranet widget", status: "live", version: "live", traffic: [182, 204, 197, 221, 176, 64, 51] },
  { id: "sms", kind: "sms", name: "Text messages", status: "not-set-up" },
];

export function Channels({ onSetUp }: { onSetUp: (id: string) => void }) {
  const [channels, setChannels] = useState(start);
  return (
    <DeployChannels
      title="Where Policy Q&A answers"
      channels={channels}
      onChannelsChange={setChannels}
      onChannelAction={(d) => {
        if (d.action === "setup") onSetUp(d.id);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/deploy-channels";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";

defineProps<{ channels: TcDeployChannels["channels"]; labels: TcDeployChannels["labels"] }>();
const onChannelAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-deploy-channels :channels="channels" :labels="labels" @tc-channel-action="onChannelAction"></tc-deploy-channels>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DeployChannels } from "@adamstavely/trenchcoat/angular/deploy-channels";
import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";

@Component({
  selector: "app-deploy-channels-example",
  imports: [DeployChannels],
  template: `<tc-deploy-channels [channels]="channels()" [labels]="labels()" (tc-channel-action)="onChannelAction($event)"></tc-deploy-channels>`,
})
export class DeployChannelsExample {
  readonly channels = input.required<TcDeployChannels["channels"]>();
  readonly labels = input.required<TcDeployChannels["labels"]>();
  onChannelAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/deploy-channels";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";

  let { channels, labels }: { channels: TcDeployChannels["channels"]; labels: TcDeployChannels["labels"] } = $props();
  let el: TcDeployChannels;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-channel-action", on);
    return () => el.removeEventListener("tc-channel-action", on);
  });
</script>

<tc-deploy-channels bind:this={el} {channels} {labels}></tc-deploy-channels>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Channels"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `channels` | – | `DeployChannel[]` | `[]` | The channels. Pause and Resume change a row's status here unless a tc-channels-change listener prevents it |
| `labels` | – | `DeployChannelsLabelsInput` | `{}` | Words the component uses, merged over defaultDeployChannelsLabels |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for numbers; unset follows the page |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-channel-action` | – | Yes | A row's action was pressed ({ id, action, channel }: DeployChannelActionDetail); cancelable – prevented, Pause and Resume leave the status as it was |
| `tc-channels-change` | – | Yes | Pause or Resume changed a row's status ({ channels, id }: DeployChannelsChange); cancelable – prevented, `channels` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dpc-spark-w` | `56px` | both |
| `--tc-dpc-spark-h` | `16px` | both |
| `--tc-dpc-mark` | `8px` | both |
| `--tc-dpc-icon` | `18px` | both |

#### Design tokens it reads (58)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `channelActions(status: DeployChannelStatus): DeployChannelAction[]` | The actions a row offers, by status |
| `orderChannels(channels: DeployChannel[]): void` | The channels in the order shown: live first, then errors, paused, drafts and the ones not set up; stable within each |

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
| `channels` | `el.channels = …;` | `<… channels={…} />` | `<tc-deploy-channels :channels="…">` | `<tc-deploy-channels [channels]="…">` | `<tc-deploy-channels {channels}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-deploy-channels :labels="…">` | `<tc-deploy-channels [labels]="…">` | `<tc-deploy-channels {labels}>` |

*Also attributes: `heading`, `description`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-channel-action` | Yes | `el.addEventListener("tc-channel-action", (e) => …)` | `onChannelAction={…}` | `@tc-channel-action="…"` | `(tc-channel-action)="…($event)"` | `el.addEventListener("tc-channel-action", …)` |
| `tc-channels-change` | Yes | `el.addEventListener("tc-channels-change", (e) => …)` | `ref.current.addEventListener("tc-channels-change", …)` | `@tc-channels-change="…"` | `(tc-channels-change)="…($event)"` | `el.addEventListener("tc-channels-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `channels` itself unless a listener calls `preventDefault()` on `tc-channels-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-deploy-channels id="deploy-channels"></tc-deploy-channels>

<script type="module">
  import "@adamstavely/trenchcoat/deploy-channels";

  const el = document.querySelector("#deploy-channels");
  el.addEventListener("tc-channels-change", (e) => {
    e.preventDefault(); // the element keeps its channels…
    if (allowed(e.detail.channels)) el.channels = e.detail.channels; // …until the app sets it
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
import "@adamstavely/trenchcoat/deploy-channels";
import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";

const props = defineProps<{ initial: TcDeployChannels["channels"] }>();
const channels = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onChannelsChange = (e: CustomEvent<{ channels: TcDeployChannels["channels"] }>) => {
  e.preventDefault();
  channels.value = e.detail.channels;
};
</script>

<template>
  <tc-deploy-channels :channels="channels" @tc-channels-change="onChannelsChange"></tc-deploy-channels>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DeployChannels } from "@adamstavely/trenchcoat/angular/deploy-channels";
import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";

@Component({
  selector: "app-controlled-deploy-channels",
  imports: [DeployChannels],
  template: `<tc-deploy-channels [channels]="channels()" (tc-channels-change)="onChannelsChange($event)"></tc-deploy-channels>`,
})
export class ControlledDeployChannels {
  readonly initial = input.required<TcDeployChannels["channels"]>();
  readonly channels = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onChannelsChange(e: CustomEvent<{ channels: TcDeployChannels["channels"] }>) {
    e.preventDefault();
    this.channels.set(e.detail.channels);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/deploy-channels";
  import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";

  let { initial }: { initial: TcDeployChannels["channels"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let channels = $derived(initial);
  let el: TcDeployChannels;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      channels = (e as CustomEvent<{ channels: TcDeployChannels["channels"] }>).detail.channels;
    };
    el.addEventListener("tc-channels-change", on);
    return () => el.removeEventListener("tc-channels-change", on);
  });
</script>

<tc-deploy-channels bind:this={el} {channels}></tc-deploy-channels>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-deploy-channels")` returns a `TcDeployChannels` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";`
- **React / Next.js:** Props: `import type { DeployChannelsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DeployChannels>`. The element class, for refs: `import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDeployChannels["channels"]` with `import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";`
- **Angular:** The directive types the template: `[channels]` takes `TcDeployChannels["channels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDeployChannels } from "@adamstavely/trenchcoat/deploy-channels";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "Channels" by default |
| `channels` | `DeployChannel[]` | The channels – controlled when given |
| `defaultChannels` | `DeployChannel[]` | On mount, when `channels` isn't controlled |
| `onChannelsChange` | `(channels: DeployChannel[]) => void` | Pause or Resume changed a row's status |
| `onChannelAction` | `(detail: DeployChannelActionDetail) => boolean \| void` | A row's action was pressed; return false to stop Pause or Resume changing the status |

*Renamed or hidden on the wrapper: `heading`, `channels`, `children`*

## Accessibility

### Keyboard

The rows are information; only their actions take focus, in reading order.

| Key | What it does |
|---|---|
| Tab | Moves through the actions |
| Enter / Space | Presses an action |

After Pause or Resume, focus stays on the button that took its place.

### Screen readers

The rows are a list named by the heading. Each status is a word, never a colour alone, and the traffic line is hidden
because its total is in words beside it. Every action is named with its channel ("Pause API"), and Pause and Resume are
announced ("API paused") in a polite status region.

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
| **This component alone** | 14.8 KB | 5.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.2 KB** | **7.3 KB** |
| With Lit – the first component on a page | 44.0 KB | 14.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 114 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of channels replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | channels: first render, 1,673 nodes; update 1.3 ms |
| 1,000 items | 100 ms | channels: first render, 16,523 nodes; update 6.3 ms |

1,000 items of channels: 100 ms. It renders every item, so a first render passes 50 ms (a long task) at about 500 items – page or filter longer lists.

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

- Name channels by what people call them ("Intranet widget"), and put the address or room in `detail`.
- Give a failing channel an `error` that says what to do: "Reconnect to keep replying."
- Pass `traffic` as messages per day, oldest first; leave it out for a channel with nothing yet.

## Do and don't

### Do

- Prevent `tc-channel-action` (or `tc-channels-change`) when pausing needs a confirmation first.
- Pass a channel's own `icon` element when the page has a mark for it – no third-party logos are built in.

### Don't

- Don't use the list for settings; Configure should open them elsewhere.
- Don't show a draft as live: set `version` to what the channel actually serves.

## Related

- [Channel Setup](channel-setup.md) – Connect one channel and set when an agent replies there – Connect, Where (a searchable pick of channels or inboxes), When it replies (every message, mentions, direct messages or business hours), Test and Go live, each checked in words before the next
- [Environment List](environment-list.md) – Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Configuration release control](configuration-release-control.md) – A configuration version moving through environments: the pipeline, a gate on evidence and approvals, confirmed promote and rollback
