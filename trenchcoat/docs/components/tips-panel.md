<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Tips Panel

**Feedback & onboarding**

Grid of short tips with one action each – taken tips turn into a done state

- **Element:** `<tc-tips-panel>`
- **Size:** 7.2 KB gzip · 23.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tips-panel";` |
| React / Next.js | `import { TipsPanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tips-panel";` · tags starting with tc- are custom elements |
| Angular | `import { TipsPanel } from "@adamstavely/trenchcoat/angular/tips-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tips-panel";` |

## Example

The live example is in the gallery at `#/tips-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A panel of short tips for getting more out of a product, each with exactly one action – “Turn on”, “Try it”, “Import”.
Taking the action turns the tip into a quiet done state (“Enabled”), and the count in the header keeps track: “2/6
done”. It suits the first days with a product or a new feature, when people benefit from a few pointers they can
act on right away and then forget about.

### When to use

- Pointing new people at features they'd otherwise miss, each one a click away.
- A handful of independent suggestions that can be taken in any order.
- A dismissible panel on a home or empty screen – with `closable` (or `onClose`) for a Close button.

### When not to use

- Steps that build on each other towards a finished setup – use [Setup Guide](setup-guide.md).
- Showing progress through a multi-step process – use [Progress Tracker](progress-tracker.md).
- Messages about things that just happened – use [Notification Stack](notification-stack.md).
- One suggestion based on what the person is doing right now – use [Smart Recommendation](smart-recommendation.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading and the done count
2. **Count** `.ui-tp__count` – “2/6 done”
3. **Tip** `.ui-tp__tip` – a title, a short description and its action
4. **Primary action** `.ui-tp__btn--primary` – the dark button, for the one tip that matters most
5. **Footer** `.ui-tp__foot` – the Close button, when the panel can be closed

## Looks

Standard is a gray tray with the header and footer on it and the tips in a white card; tips are bordered tiles that
turn gray when done. Clean drops the tray: one white card with a hairline shadow and a divider under the header,
quieter tip tiles and a green check on done tips. Both lay the tips out in three columns, two below 560px and one
below 380px, and scroll the tips inside the card.

## Usage

### HTML

```html
<tc-tips-panel id="tips" heading="Tips for getting started" closable></tc-tips-panel>

<script type="module">
  import "@adamstavely/trenchcoat/tips-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#tips");
  panel.tips = [
    {
      id: "digest",
      title: "Daily digest",
      description: "Get one calm summary each morning.",
      action: "Turn on",
      doneLabel: "Enabled",
      primary: true,
    },
    {
      id: "import",
      title: "Bring your data",
      description: "Import tasks from Trello, Asana or a CSV file.",
      action: "Import",
      doneLabel: "Imported",
    },
  ];
  panel.addEventListener("tc-tip-action", (e) => console.log(e.detail.id));
  panel.addEventListener("tc-close", () => panel.remove());
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Kbd, TipsPanel, type Tip } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function GettingStarted({ openPalette }: { openPalette: () => void }) {
  const [done, setDone] = useState<string[]>([]);
  const tips: Tip[] = [
    {
      id: "palette",
      title: "Open anything fast",
      description: (
        <>
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to jump anywhere.
        </>
      ),
      action: "Try it",
      doneLabel: "Tried",
      primary: true,
      onAction: openPalette,
    },
    {
      id: "digest",
      title: "Daily digest",
      description: "Get one calm summary each morning.",
      action: "Turn on",
      doneLabel: "Enabled",
    },
  ];
  return <TipsPanel title="Tips for getting started" tips={tips} done={done} onDoneChange={setDone} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tips-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";

defineProps<{ tips: TcTipsPanel["tips"]; done: TcTipsPanel["done"] }>();
const onDoneChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-tips-panel :tips="tips" :done="done" @tc-done-change="onDoneChange"></tc-tips-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TipsPanel } from "@adamstavely/trenchcoat/angular/tips-panel";
import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";

@Component({
  selector: "app-tips-panel-example",
  imports: [TipsPanel],
  template: `<tc-tips-panel [tips]="tips()" [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-tips-panel>`,
})
export class TipsPanelExample {
  readonly tips = input.required<TcTipsPanel["tips"]>();
  readonly done = input.required<TcTipsPanel["done"]>();
  onDoneChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tips-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";

  let { tips, done }: { tips: TcTipsPanel["tips"]; done: TcTipsPanel["done"] } = $props();
  let el: TcTipsPanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-tips-panel bind:this={el} {tips} {done}></tc-tips-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Tips"` | The heading, and the region's name |
| `tips` | – | `TipsPanelTip[]` | `[]` | The tips, in order – each with a title, a short description and one action |
| `done` | – | `string[]` | `[]` | Ids of the tips whose action was taken |
| `closable` | `closable` | `boolean` | `false` | Shows the Close button in the footer |
| `closeLabel` | `close-label` | `string` | `"Close"` | Text of the Close button |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-done-change` | – | Yes | A tip's action was taken; detail `{ done: string[], tip }` is the new list of done ids. Cancelable: preventDefault() keeps `done` as it is (controlled use) |
| `tc-tip-action` | – | No | A tip's action was taken; detail `{ id: string }` |
| `tc-close` | – | No | The Close button was pressed; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tips-panel-max-height` | `420px` | standard, clean |

#### Design tokens it reads (66)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `tips` | `el.tips = …;` | `<… tips={…} />` | `<tc-tips-panel :tips="…">` | `<tc-tips-panel [tips]="…">` | `<tc-tips-panel {tips}>` |
| `done` | `el.done = …;` | `<… done={…} />` | `<tc-tips-panel :done="…">` | `<tc-tips-panel [done]="…">` | `<tc-tips-panel {done}>` |

*Also attributes: `heading`, `closable`, `close-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-done-change` | Yes | `el.addEventListener("tc-done-change", (e) => …)` | `onDoneChange={…}` | `@tc-done-change="…"` | `(tc-done-change)="…($event)"` | `el.addEventListener("tc-done-change", …)` |
| `tc-tip-action` | No | `el.addEventListener("tc-tip-action", (e) => …)` | `onAction={…}` | `@tc-tip-action="…"` | `(tc-tip-action)="…($event)"` | `el.addEventListener("tc-tip-action", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

### Controlled

The element changes `done` itself unless a listener calls `preventDefault()` on `tc-done-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-tips-panel id="tips-panel"></tc-tips-panel>

<script type="module">
  import "@adamstavely/trenchcoat/tips-panel";

  const el = document.querySelector("#tips-panel");
  el.addEventListener("tc-done-change", (e) => {
    e.preventDefault(); // the element keeps its done…
    if (allowed(e.detail.done)) el.done = e.detail.done; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TipsPanel } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TipsPanel>;
type Props = Omit<Own, "done" | "onDoneChange"> & { initial: NonNullable<Own["done"]> };

// Controlled: passing done makes the wrapper prevent the element's own change; the app sets it
export function ControlledTipsPanel({ initial, ...props }: Props) {
  const [done, setDone] = useState<Own["done"]>(initial);
  return <TipsPanel {...props} done={done} onDoneChange={(next) => setDone(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/tips-panel";
import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";

const props = defineProps<{ initial: TcTipsPanel["done"] }>();
const done = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDoneChange = (e: CustomEvent<{ done: TcTipsPanel["done"] }>) => {
  e.preventDefault();
  done.value = e.detail.done;
};
</script>

<template>
  <tc-tips-panel :done="done" @tc-done-change="onDoneChange"></tc-tips-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TipsPanel } from "@adamstavely/trenchcoat/angular/tips-panel";
import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";

@Component({
  selector: "app-controlled-tips-panel",
  imports: [TipsPanel],
  template: `<tc-tips-panel [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-tips-panel>`,
})
export class ControlledTipsPanel {
  readonly initial = input.required<TcTipsPanel["done"]>();
  readonly done = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDoneChange(e: CustomEvent<{ done: TcTipsPanel["done"] }>) {
    e.preventDefault();
    this.done.set(e.detail.done);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tips-panel";
  import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";

  let { initial }: { initial: TcTipsPanel["done"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let done = $derived(initial);
  let el: TcTipsPanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      done = (e as CustomEvent<{ done: TcTipsPanel["done"] }>).detail.done;
    };
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-tips-panel bind:this={el} {done}></tc-tips-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tips-panel")` returns a `TcTipsPanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";`
- **React / Next.js:** Props: `import type { TipsPanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TipsPanel>`. The element class, for refs: `import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTipsPanel["tips"]` with `import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";`
- **Angular:** The directive types the template: `[tips]` takes `TcTipsPanel["tips"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTipsPanel } from "@adamstavely/trenchcoat/tips-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name – "Tips" by default |
| `tips` | `Tip[]` | The tips, in order; descriptions can be React nodes, and `onAction` runs when the tip's action is taken |
| `done` | `string[]` | Ids of the tips whose action was taken. Controlled when defined – pair it with `onDoneChange` |
| `defaultDone` | `string[]` | Ids already done on mount when `done` isn't controlled |
| `onDoneChange` | `(done: string[]) => void` | Called with the new list of done ids whenever a tip's action is taken |
| `onClose` | `() => void` | Shows the Close button in the footer |

*Renamed or hidden on the wrapper: `heading`, `tips`, `done`, `closable`*

## Accessibility

Follows the WAI-ARIA [Landmark regions pattern](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the tips' actions and the Close button |
| Enter / Space | Takes the focused tip's action, or closes the panel |

Taking an action keeps focus in place: it moves onto the tip's done mark, which replaces the button.

### Screen readers

The panel is a `region` named by its heading (unless the page names it). Tip titles and descriptions are plain text;
each action is a button with the action's text. A status region announces each action taken with the new count:
“Daily digest: Enabled. 2 of 6 done.”

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.6 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **23.9 KB** | **7.2 KB** |
| With Lit – the first component on a page | 44.7 KB | 14.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 44 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of tips replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.9 ms | tips: first render, 498 nodes; update 2.5 ms |
| 1,000 items | 61 ms | tips: first render, 4,848 nodes; update 15 ms |

1,000 items of tips: 61 ms. It renders every item, so a first render passes 50 ms (a long task) at about 820 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title each tip with the benefit, not the feature name: “Open anything fast”, “Daily digest”.
- Keep descriptions to one sentence that says what happens; mark keys with `Kbd` – “Press ⌘ K to jump to any
  project”.
- Write actions as short verbs – “Turn on”, “Show QR code” – and `doneLabel` as the resulting state: “Enabled”,
  “Following system”.
- Name the panel for its moment: “Tips for getting started”.

## Do and don't

### Do

- Keep it to three to six tips – a full row or two.
- Mark only one tip `primary`.
- Remember which tips are done (`done`, `onDoneChange`) so they stay done next time.

### Don't

- Don't use tips for actions that can't be undone or need confirming – the tip marks itself done at once.
- Don't put more than one action in a tip's description.
- Don't keep showing the panel once every tip is done – let people close it.

## Related

- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Smart Recommendation](smart-recommendation.md) – Suggestion card with a confidence signal, alternatives to switch to and accept with undo
