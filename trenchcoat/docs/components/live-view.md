<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Live View

**Agents** · New

Watch the agent's screen as it works – its clicks and typing drawn on top, a caption for each step, and Pause or Take over at any moment

- **Element:** `<tc-live-view>`
- **Size:** 11.7 KB gzip · 36.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/live-view";` |
| React / Next.js | `import { LiveView } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/live-view";` · tags starting with tc- are custom elements |
| Angular | `import { LiveView } from "@adamstavely/trenchcoat/angular/live-view";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/live-view";` |

## Example

The live example is in the gallery at `#/live-view`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Lets people watch an agent's screen while it browses or uses a computer for them. The stream is the app's – an image
per frame, a video or canvas, or anything slotted in – and the element draws what the agent does on top: one pointer
that glides from action to action, a ring where it clicks, the text it types and the keys it presses on a small flag,
and the direction it scrolls. A caption under the screen says which step it's on. In the header, the state reads
Live, Paused or “You're in control”, with Pause and Take over at hand at every moment.

### When to use

- An agent acting in a browser or on a desktop for someone – booking, filling forms, clicking through a site.
- When people need to see what the agent is doing and step in before it does the wrong thing.
- Handing the screen to a person mid-run, with their clicks forwarded to the agent's browser.

### When not to use

- Showing several people's or agents' pointers on a shared canvas – use [Agent Cursors](agent-cursors.md).
- An agent stopping to hand a decision or a task to a person, without a screen – use [Handoff](handoff.md).
- Command-line work in a sandbox – use [Sandbox Log](sandbox-log.md).
- Redirecting an agent with instructions while it runs – use [Agent Steering](agent-steering.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a screen icon and what the agent is doing overall (“Live view” when there's no heading)
2. **State** `.ui-lv__state` – Live, Paused, You're in control, Finished or Connecting, at the header's right
3. **Toolbar** `.ui-lv__tools` – Pause or Resume, and Take over or Hand back
4. **Screen** `.ui-lv__screen` – the stream, in the frame's shape
5. **Pointer** `.ui-lv__ptr` – the agent's pointer, which glides to each action and presses in on a click
6. **Flag** `.ui-lv__flag` – the agent's name, what it types, the keys or the scroll
7. **Caption** `.ui-lv__cap` – “Step 4 of 9” and what the step is

## Looks

Standard sets the header and the caption on a gray tray with the screen on a white card between them; Pause and Take
over are small secondary and primary buttons. Clean has no tray: one white card with the header inside it, the screen
inset with smaller corners, and default-size buttons. In a container under 380px wide both hide the title and show
the buttons as icons only, and the caption stacks under the step number.

## Usage

### HTML

```html
<tc-live-view id="live" frame-width="960" frame-height="600" agent="Operator" step="4" steps="8"></tc-live-view>

<script type="module">
  import "@adamstavely/trenchcoat/live-view";
  import "@adamstavely/trenchcoat/tokens.css";

  const view = document.querySelector("#live");
  view.heading = "Book a table for 4 at Lupa, Friday 7 PM";
  view.src = "/frames/latest.png";
  view.alt = "The reservations page for Lupa Osteria";
  view.actions = [{ id: "a1", kind: "click", x: 210, y: 288, caption: "Picking Friday, October 30" }];
  view.addEventListener("tc-control-change", (e) => console.log(e.detail.control));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { LiveView, type LiveViewAction, type LiveViewControl } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AgentScreen({ frame, actions }: { frame: string; actions: LiveViewAction[] }) {
  const [paused, setPaused] = useState(false);
  const [control, setControl] = useState<LiveViewControl>("agent");
  return (
    <LiveView
      title="Book a table for 4 at Lupa, Friday 7 PM"
      agent="Operator"
      src={frame}
      frameWidth={960}
      frameHeight={600}
      actions={actions}
      step={4}
      steps={8}
      paused={paused}
      onPausedChange={setPaused}
      control={control}
      onControlChange={setControl}
      onScreenClick={(point) => console.log(point.x, point.y)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/live-view";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";

defineProps<{ actions: TcLiveView["actions"]; source: TcLiveView["source"] }>();
const onPausedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-live-view :actions="actions" :source="source" @tc-paused-change="onPausedChange"></tc-live-view>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LiveView } from "@adamstavely/trenchcoat/angular/live-view";
import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";

@Component({
  selector: "app-live-view-example",
  imports: [LiveView],
  template: `<tc-live-view [actions]="actions()" [source]="source()" (tc-paused-change)="onPausedChange($event)"></tc-live-view>`,
})
export class LiveViewExample {
  readonly actions = input.required<TcLiveView["actions"]>();
  readonly source = input.required<TcLiveView["source"]>();
  onPausedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/live-view";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";

  let { actions, source }: { actions: TcLiveView["actions"]; source: TcLiveView["source"] } = $props();
  let el: TcLiveView;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-live-view bind:this={el} {actions} {source}></tc-live-view>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `actions` | – | `LiveViewAction[]` | `[]` | What the agent did, oldest first, in the frame's pixels – the last one is where the pointer is now |
| `src` | `src` | `string \| undefined` | `undefined` | The latest frame as an image URL |
| `alt` | `alt` | `string` | `"The agent's screen"` | The frame's text alternative, for `src` |
| `source` | – | `\| HTMLVideoElement \| HTMLCanvasElement \| HTMLImageElement \| undefined` | `undefined` | A live element to show instead – a &lt;video>, &lt;canvas> or &lt;img> the app keeps drawing into (it is moved here) |
| `frameWidth` | `frame-width` | `\| number \| undefined` | `undefined` | The frame's width in its own pixels – the actions' coordinate space. Unset: the image's, video's or canvas's own. The screen takes the frame's shape and the overlays follow it; give a stream of the same shape (a different one is letterboxed inside the frame, and actions land on the frame, not on the picture) |
| `frameHeight` | `frame-height` | `\| number \| undefined` | `undefined` | The frame's height in its own pixels |
| `heading` | `heading` | `string` | `""` | What the agent is doing overall – e.g. "Booking a table for four" |
| `caption` | `caption` | `string \| undefined` | `undefined` | The step's caption – unset uses the latest action's `caption` |
| `step` | `step` | `number \| undefined` | `undefined` | The step's number, from 1 |
| `steps` | `steps` | `number \| undefined` | `undefined` | How many steps there are, when known |
| `agent` | `agent` | `string` | `""` | The name on the pointer's flag – e.g. "Operator"; unset shows the flag only for typing, keys and scrolls |
| `color` | `color` | `string \| undefined` | `undefined` | The pointer's color – defaults to the accent |
| `paused` | `paused` | `boolean` | `false` | The agent is paused – the screen dims and says so |
| `control` | `control` | `LiveViewControl` | `"agent"` | Who drives the screen; "user" after Take over |
| `ended` | `ended` | `boolean` | `false` | The run is over: Finished, no pointer, no Pause or Take over |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-paused-change` | – | Yes | Pause or Resume was pressed ({ paused }: LiveViewPausedChange); cancelable |
| `tc-control-change` | – | Yes | Take over or Hand back was pressed ({ control }: LiveViewControlChange); cancelable |
| `tc-screen-click` | – | No | While you have control, a click on the screen ({ x, y }: LiveViewScreenClick, frame pixels) |

#### Slots

| Slot | Description |
| --- | --- |
| `screen` | Your own stream (an element with `slot="screen"`) – it fills the screen, under the overlays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-live-view-c` | `var(--tc-accent)` | both |
| `--tc-live-view-outline` | `#ffffff` | both |
| `--tc-live-view-glide` | `var(--tc-duration-slower)` | both |
| `--tc-live-view-blink` | `1100ms` | both |
| `--tc-live-view-wash` | `light-dark(rgba(255, 255, 255, 0.45), rgba(0, 0, 0, 0.45))` | both |
| `--tc-live-view-inset` | `var(--tc-space-2)` | both, clean |
| `--tc-live-view-screen-radius` | `var(--tc-radius-sm)` | both, clean |

#### Design tokens it reads (85)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-radius`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-overlay`, `--tc-shimmer`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-live-view :actions="…">` | `<tc-live-view [actions]="…">` | `<tc-live-view {actions}>` |
| `source` | `el.source = …;` | `<… source={…} />` | `<tc-live-view :source="…">` | `<tc-live-view [source]="…">` | `<tc-live-view {source}>` |

*Also attributes: `src`, `alt`, `frame-width`, `frame-height`, `heading`, `caption`, `step`, `steps` and 5 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `ref.current.addEventListener("tc-paused-change", …)` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |
| `tc-control-change` | Yes | `el.addEventListener("tc-control-change", (e) => …)` | `ref.current.addEventListener("tc-control-change", …)` | `@tc-control-change="…"` | `(tc-control-change)="…($event)"` | `el.addEventListener("tc-control-change", …)` |
| `tc-screen-click` | No | `el.addEventListener("tc-screen-click", (e) => …)` | `onScreenClick={…}` | `@tc-screen-click="…"` | `(tc-screen-click)="…($event)"` | `el.addEventListener("tc-screen-click", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `paused` and `control` itself unless a listener calls `preventDefault()` on `tc-paused-change` or `tc-control-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-live-view id="live-view"></tc-live-view>

<script type="module">
  import "@adamstavely/trenchcoat/live-view";

  const el = document.querySelector("#live-view");
  el.addEventListener("tc-paused-change", (e) => {
    e.preventDefault(); // the element keeps its paused…
    if (allowed(e.detail.paused)) el.paused = e.detail.paused; // …until the app sets it
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
import "@adamstavely/trenchcoat/live-view";
import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";

const props = defineProps<{ initial: TcLiveView["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcLiveView["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-live-view :paused="paused" @tc-paused-change="onPausedChange"></tc-live-view>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LiveView } from "@adamstavely/trenchcoat/angular/live-view";
import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";

@Component({
  selector: "app-controlled-live-view",
  imports: [LiveView],
  template: `<tc-live-view [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-live-view>`,
})
export class ControlledLiveView {
  readonly initial = input.required<TcLiveView["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcLiveView["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/live-view";
  import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";

  let { initial }: { initial: TcLiveView["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcLiveView;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcLiveView["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-live-view bind:this={el} {paused}></tc-live-view>
```

### Slots and children

Put children inside the tag with a `slot` attribute: `slot="screen"`. The element renders into itself (no shadow root) and leaves them where you put them.

- **React:** pass them as children with the same attribute.
- **Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-live-view")` returns a `TcLiveView` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";`
- **React / Next.js:** Props: `import type { LiveViewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LiveView>`. The element class, for refs: `import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLiveView["actions"]` with `import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";`
- **Angular:** The directive types the template: `[actions]` takes `TcLiveView["actions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLiveView } from "@adamstavely/trenchcoat/live-view";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | What the agent is doing overall – the header's title |
| `screen` | `React.ReactNode` | Your own stream – a &lt;video>, &lt;canvas>, &lt;img>, &lt;svg> or any content – drawn under the overlays |
| `paused` | `boolean` | The agent is paused. Controlled when defined; otherwise the component keeps it, starting from `defaultPaused` |
| `defaultPaused` | `boolean` | Whether the agent starts paused, when `paused` isn't controlled |
| `onPausedChange` | `(paused: boolean) => void` | Pause or Resume was pressed |
| `control` | `LiveViewControl` | Who drives the screen. Controlled when defined; otherwise kept by the component, from `defaultControl` |
| `defaultControl` | `LiveViewControl` | Who drives the screen at first, when `control` isn't controlled |
| `onControlChange` | `(control: LiveViewControl) => void` | Take over or Hand back was pressed |
| `onScreenClick` | `(point: LiveViewScreenClick) => void` | While you have control: a click on the screen, in frame pixels – forward it to the agent's browser |

*Renamed or hidden on the wrapper: `heading`, `paused`, `control`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the toolbar (one tab stop) and out of it |
| ← / → / ↑ / ↓ | In the toolbar: moves between Pause and Take over, wrapping round |
| Home / End | In the toolbar: moves to the first or last button |
| Enter / Space | Pauses or resumes; takes over or hands back |

While a person has control, clicks on the screen are reported with `tc-screen-click`; the element doesn't forward
keys, so an app that lets people type into the agent's browser handles that itself.

### Screen readers

The screen is a group with the role description “live view”, named “The agent's screen – Book a table for 4”; an
image frame is described by `alt`. The pointer, the flag, the click ring and the on-screen badge are hidden. The
toolbar is named “Live view”. A polite status region reads each new step – “Step 4 of 9: Picking a date” – and each
change of who drives: “Paused.”, “You're in control. The agent waits until you hand back.”, “The agent is working
again.” and, at the end, “Finished.” followed by the last caption.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.8 KB | 9.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.9 KB** | **11.8 KB** |
| With Lit – the first component on a page | 59.6 KB | 19.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 41 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of actions replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.8 ms | actions: first render, 41 nodes; update 0.0 ms |
| 1,000 items | 0.9 ms | actions: first render, 41 nodes; update 0.0 ms |

What it renders doesn't grow with actions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `heading` as the task in the person's words: “Book a table for 4 at Lupa, Friday 7 PM”.
- Write each action's `caption` as what the step does, in the present: “Picking a date”, “Taking the 7:00 PM table”.
- Set `agent` to the agent's name if more than one could be acting; the flag then always shows it.
- Give `alt` a description of the frame when you pass `src`: “The reservations page for Lupa Osteria”.

## Do and don't

### Do

- Keep `actions` to the last few – the element shows only the latest, and the pointer glides to it.
- Give `frameWidth` and `frameHeight` when the actions' coordinates come from a known viewport; the screen takes that
  shape.
- Stop the agent when `tc-paused-change` or `tc-control-change` says so, and only resume when it changes back.
- Set `ended` when the run finishes, so the toolbar and the pointer go.

### Don't

- Don't send a stream of a different shape from the frame: it's letterboxed, and actions land on the frame, not on the
  picture.
- Don't take control away from someone who pressed Take over without telling them – the state still says it's theirs.
- Don't use it as a recording player; it shows the latest frame and the latest action only.

## Related

- [Agent Cursors](agent-cursors.md) – Agents working in a document like teammates in a multiplayer editor – live pointers with names, suggestions typed letter by letter, images they resize, code they fix and comments beside the page
- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
- [Agent Steering](agent-steering.md) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away

## Changelog

- `tc-live-view` – the agent's screen (frames, a live video or canvas, or your own content) with its pointer, clicks, typing and keys drawn on top, a step caption, and Pause / Take over; your clicks are reported in frame pixels while you have control.
