<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Thread Header

**Workspace & sessions** · New

The bar at the top of a chat thread – the title renamed in place, model and project chips, Share, side-panel toggles and a menu of actions, folding into the menu when narrow

- **Element:** `<tc-thread-header>`
- **Size:** 7.5 KB gzip · 24.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/thread-header";` |
| React / Next.js | `import { ThreadHeader } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/thread-header";` · tags starting with tc- are custom elements |
| Angular | `import { ThreadHeader } from "@adamstavely/trenchcoat/angular/thread-header";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/thread-header";` |

## Example

The live example is in the gallery at `#/thread-header`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The bar at the top of a chat thread. It holds the thread's title, which people rename in place; the model and the
project as quiet chips; Share; a toggle for each side panel the page offers (sources, an artifact, a preview); and a
menu of the rest – Export, Archive and Delete by default. When the header is narrow, the chips hide and Share and the
toggles fold into the menu.

### When to use

- The top of a chat or agent thread, where the title, sharing and the side panels belong together.
- A thread whose title people should be able to fix without opening a settings page.

### When not to use

- Switching between several open chats – use [Session Tabs](session-tabs.md).
- Choosing who a thread is shared with – put [Share Panel](share-panel.md) behind Share.
- The panel the toggles open – use [Panel Dock](panel-dock.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Title** `.ui-thd__title` – a heading; its `.ui-thd__title-btn` starts renaming, and `.ui-thd__input` is the field
2. **Chips** `.ui-thd__chips` – the model and the project, each a `.ui-thd__chip`
3. **Share** `.ui-thd__share`
4. **Toggles** `.ui-thd__toggles` – one `.ui-thd__toggle` per side panel
5. **More** `.ui-thd__more` – opens `.ui-thd__menu`
6. **Menu item** `.ui-thd__menu-item` – an action; danger ones after a `.ui-thd__sep`

## Looks

Standard is a bar on the gray tray; Clean is one white bar. Under about 32rem of its own width, the chips hide and Share
and the toggles move into the menu, where the toggles are checkable items. Component tokens: `--tc-thd-chip-max` (a
chip's widest) and `--tc-thd-menu-w`.

## Usage

### HTML

```html
<tc-thread-header id="head" heading="Q3 reconciliation" model="Analyst model" project="Annual audit"></tc-thread-header>

<script type="module">
  import "@adamstavely/trenchcoat/thread-header";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#head");
  el.toggles = [{ id: "sources", label: "Sources" }];
  el.addEventListener("tc-title-change", (e) => console.log("Renamed to", e.detail.title));
  el.addEventListener("tc-panels-change", (e) => console.log("Open panels", e.detail.panels));
  el.addEventListener("tc-action", (e) => console.log("Action", e.detail.action));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ThreadHeader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Header() {
  const [title, setTitle] = useState("Q3 reconciliation");
  const [panels, setPanels] = useState<string[]>(["sources"]);
  return (
    <ThreadHeader
      title={title}
      onTitleChange={setTitle}
      model="Analyst model"
      toggles={[{ id: "sources", label: "Sources" }]}
      panels={panels}
      onPanelsChange={setPanels}
      onTcAction={(e) => console.log(e.detail.action)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/thread-header";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";

defineProps<{ toggles: TcThreadHeader["toggles"]; panels: TcThreadHeader["panels"] }>();
const onTitleChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-thread-header :toggles="toggles" :panels="panels" @tc-title-change="onTitleChange"></tc-thread-header>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ThreadHeader } from "@adamstavely/trenchcoat/angular/thread-header";
import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";

@Component({
  selector: "app-thread-header-example",
  imports: [ThreadHeader],
  template: `<tc-thread-header [toggles]="toggles()" [panels]="panels()" (tc-title-change)="onTitleChange($event)"></tc-thread-header>`,
})
export class ThreadHeaderExample {
  readonly toggles = input.required<TcThreadHeader["toggles"]>();
  readonly panels = input.required<TcThreadHeader["panels"]>();
  onTitleChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/thread-header";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";

  let { toggles, panels }: { toggles: TcThreadHeader["toggles"]; panels: TcThreadHeader["panels"] } = $props();
  let el: TcThreadHeader;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-title-change", on);
    return () => el.removeEventListener("tc-title-change", on);
  });
</script>

<tc-thread-header bind:this={el} {toggles} {panels}></tc-thread-header>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The thread's title. Changed by renaming unless a tc-title-change listener calls preventDefault() |
| `level` | `level` | `number` | `2` | The heading level of the title, 1–6 |
| `model` | `model` | `string \| undefined` | `undefined` | The model's name, as a chip |
| `project` | `project` | `string \| undefined` | `undefined` | The project the thread belongs to, as a chip |
| `toggles` | – | `ThreadHeaderToggle[]` | `[]` | A toggle button for each side panel |
| `panels` | – | `string[]` | `[]` | The ids of the open panels. Changed by the toggles unless a tc-panels-change listener calls preventDefault() |
| `actions` | – | `ThreadHeaderAction[]` | `[ { id: "export", label: "Export" }, { id: "archive", label: "Archive" }, { id: "delete", label: "Delete", danger: true }, ]` | The menu's actions |
| `hideShare` | `hide-share` | `boolean` | `false` | Hides Share |
| `noRename` | `no-rename` | `boolean` | `false` | Turns renaming off: the title is plain text |
| `labels` | – | `Partial<ThreadHeaderLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-title-change` | – | Yes | The title was renamed ({ title, heading, previous }: ThreadHeaderTitleChange); cancelable – prevented, `heading` stays as it was |
| `tc-panels-change` | – | Yes | A panel toggle was pressed ({ panels, id, open }: ThreadHeaderPanelsChange); cancelable – prevented, `panels` stays as it was |
| `tc-share` | – | No | Share was pressed (detail: {}) |
| `tc-action` | – | No | A menu action was picked ({ action }: ThreadHeaderActionEvent) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-thd-chip-max` | `160px` | both |
| `--tc-thd-menu-w` | `200px` | both |

#### Design tokens it reads (48)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultThreadHeaderLabels: ThreadHeaderLabels` | The words used when the page gives none |
| `defaultThreadHeaderActions: ThreadHeaderAction[]` | The menu's actions when the page gives none |

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
| `toggles` | `el.toggles = …;` | `<… toggles={…} />` | `<tc-thread-header :toggles="…">` | `<tc-thread-header [toggles]="…">` | `<tc-thread-header {toggles}>` |
| `panels` | `el.panels = …;` | `<… panels={…} />` | `<tc-thread-header :panels="…">` | `<tc-thread-header [panels]="…">` | `<tc-thread-header {panels}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-thread-header :actions="…">` | `<tc-thread-header [actions]="…">` | `<tc-thread-header {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-thread-header :labels="…">` | `<tc-thread-header [labels]="…">` | `<tc-thread-header {labels}>` |

*Also attributes: `heading`, `level`, `model`, `project`, `hide-share`, `no-rename` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-title-change` | Yes | `el.addEventListener("tc-title-change", (e) => …)` | `ref.current.addEventListener("tc-title-change", …)` | `@tc-title-change="…"` | `(tc-title-change)="…($event)"` | `el.addEventListener("tc-title-change", …)` |
| `tc-panels-change` | Yes | `el.addEventListener("tc-panels-change", (e) => …)` | `ref.current.addEventListener("tc-panels-change", …)` | `@tc-panels-change="…"` | `(tc-panels-change)="…($event)"` | `el.addEventListener("tc-panels-change", …)` |
| `tc-share` | No | `el.addEventListener("tc-share", (e) => …)` | `onTcShare={…}` | `@tc-share="…"` | `(tc-share)="…($event)"` | `el.addEventListener("tc-share", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `heading` and `panels` itself unless a listener calls `preventDefault()` on `tc-title-change` or `tc-panels-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-thread-header id="thread-header"></tc-thread-header>

<script type="module">
  import "@adamstavely/trenchcoat/thread-header";

  const el = document.querySelector("#thread-header");
  el.addEventListener("tc-title-change", (e) => {
    e.preventDefault(); // the element keeps its heading…
    if (allowed(e.detail.heading)) el.heading = e.detail.heading; // …until the app sets it
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
import "@adamstavely/trenchcoat/thread-header";
import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";

const props = defineProps<{ initial: TcThreadHeader["heading"] }>();
const heading = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTitleChange = (e: CustomEvent<{ heading: TcThreadHeader["heading"] }>) => {
  e.preventDefault();
  heading.value = e.detail.heading;
};
</script>

<template>
  <tc-thread-header :heading="heading" @tc-title-change="onTitleChange"></tc-thread-header>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ThreadHeader } from "@adamstavely/trenchcoat/angular/thread-header";
import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";

@Component({
  selector: "app-controlled-thread-header",
  imports: [ThreadHeader],
  template: `<tc-thread-header [heading]="heading()" (tc-title-change)="onTitleChange($event)"></tc-thread-header>`,
})
export class ControlledThreadHeader {
  readonly initial = input.required<TcThreadHeader["heading"]>();
  readonly heading = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTitleChange(e: CustomEvent<{ heading: TcThreadHeader["heading"] }>) {
    e.preventDefault();
    this.heading.set(e.detail.heading);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/thread-header";
  import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";

  let { initial }: { initial: TcThreadHeader["heading"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let heading = $derived(initial);
  let el: TcThreadHeader;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      heading = (e as CustomEvent<{ heading: TcThreadHeader["heading"] }>).detail.heading;
    };
    el.addEventListener("tc-title-change", on);
    return () => el.removeEventListener("tc-title-change", on);
  });
</script>

<tc-thread-header bind:this={el} {heading}></tc-thread-header>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-thread-header")` returns a `TcThreadHeader` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";`
- **React / Next.js:** Props: `import type { ThreadHeaderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ThreadHeader>`. The element class, for refs: `import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcThreadHeader["toggles"]` with `import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";`
- **Angular:** The directive types the template: `[toggles]` takes `TcThreadHeader["toggles"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcThreadHeader } from "@adamstavely/trenchcoat/thread-header";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The thread's title – controlled when given |
| `defaultTitle` | `string` | At first, when `title` isn't controlled |
| `onTitleChange` | `(title: string) => void` | The title was renamed |
| `panels` | `string[]` | The ids of the open panels – controlled when given |
| `defaultPanels` | `string[]` | At first, when `panels` isn't controlled |
| `onPanelsChange` | `(panels: string[]) => void` | A panel toggle was pressed |

*Renamed or hidden on the wrapper: `heading`, `panels`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space / F2 on the title | Start renaming |
| Enter in the field | Save the new title |
| Escape in the field | Cancel |
| Enter / Space on a toggle | Show or hide its panel |
| ↑ / ↓, Home / End in the menu | Move between items |
| Escape / Tab in the menu | Close it; focus goes back to More |

### Screen readers

The title is a heading (`level`, 2 by default) holding a button that reads the title and then "Rename"; the field is
named "Chat title". The chips read "Model: …" and "Project: …". The toggles are a group named "Panels", each a pressed
button named by its label. More has `aria-haspopup="menu"` and `aria-expanded`; in the menu the toggles are
`menuitemcheckbox` items. A rename is announced through `role="status"`.

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
| **This component alone** | 17.2 KB | 5.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.0 KB** | **7.5 KB** |
| With Lit – the first component on a page | 44.7 KB | 14.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 44 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of actions replaced |
| First on the page | 9.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.6 ms | actions: first render, 44 nodes; update 0.0 ms |
| 1,000 items | 0.6 ms | actions: first render, 44 nodes; update 0.1 ms |

What it renders doesn't grow with actions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep titles short enough to read in the bar: "Q3 reconciliation", not a sentence.
- Name toggles by what they show ("Sources", "Report draft"), not by an action.
- Put destructive actions last with `danger: true`.

## Do and don't

### Do

- Show and hide the panels from `tc-panels-change`, or control `panels`.
- Save the title from `tc-title-change`; prevent it to reject a name.

### Don't

- Don't add more than three toggles; the bar gets crowded and they fold away early.
- Don't use the menu for navigation.

## Related

- [Session Tabs](session-tabs.md) – Open chats as tabs above a thread – status as a mark and a word, unread dots, close, drag or Alt+Shift+arrows to reorder, and a menu of the tabs scrolled out of view
- [Panel Dock](panel-dock.md) – One side panel beside a chat, with a tab per open item – an artifact, a file, a source or a preview – resized from its edge, folded to a rail of icons, closed with Escape, and a full-width sheet when space is narrow
- [Share Panel](share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
