<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Session Tabs

**Workspace & sessions** · New

Open chats as tabs above a thread – status as a mark and a word, unread dots, close, drag or Alt+Shift+arrows to reorder, and a menu of the tabs scrolled out of view

- **Element:** `<tc-session-tabs>`
- **Size:** 8.7 KB gzip · 28.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/session-tabs";` |
| React / Next.js | `import { SessionTabs } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/session-tabs";` · tags starting with tc- are custom elements |
| Angular | `import { SessionTabs } from "@adamstavely/trenchcoat/angular/session-tabs";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/session-tabs";` |

## Example

The live example is in the gallery at `#/session-tabs`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Open chats as a row of tabs above a chat thread. Each tab has the chat's title, cut off with an ellipsis with the whole
title in its tooltip; a mark for what the chat is doing – running, needs you or failed – with the word for screen
readers; an unread dot; and a close button. A "+" opens a new chat. Drag a tab to move it, or move it from the
keyboard. When the tabs don't fit, they shrink to a minimum width, then scroll sideways with soft edges, and a "more"
button lists the ones out of view.

### When to use

- Several chats open at once that people switch between often, the way they'd use browser tabs.
- A workspace where the status of a background chat (running, needs you) should be seen without opening it.

### When not to use

- Every past chat, searchable and grouped – use [Chat History](chat-history.md).
- Sessions in a sidebar, grouped by project – use [Session List](session-list.md).
- The bar above one thread, with its title and actions – use [Thread Header](thread-header.md).
- Switching between two to six views of one thing – use [Segmented Control](segmented-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-stab__bar` – the strip; fades at an edge that has more tabs past it
2. **Tab list** `.ui-stab__list` – the `tablist`
3. **Tab** `.ui-stab__tab` – one chat: its `.ui-stab__open` button and `.ui-stab__close`
4. **Mark** `.ui-stab__mark` – the status's shape, for running, needs you and failed
5. **Title** `.ui-stab__title` – cut off with an ellipsis
6. **Unread** `.ui-stab__unread` – something new since it was last open
7. **More** `.ui-stab__more` – the count of tabs out of view, opening `.ui-stab__menu`
8. **New** `.ui-stab__new` – the "+" button

## Looks

Standard puts the strip on the gray tray, with the open tab a white card on it. Clean is one white bar; the open tab is
filled, with an accent underline. Component tokens: `--tc-stab-min` and `--tc-stab-max` (a tab's narrowest and widest),
`--tc-stab-fade` (how far the edges fade).

## Usage

### HTML

```html
<tc-session-tabs id="tabs" active="q3"></tc-session-tabs>

<script type="module">
  import "@adamstavely/trenchcoat/session-tabs";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#tabs");
  el.tabs = [
    { id: "q3", title: "Q3 reconciliation" },
    { id: "vendor", title: "Vendor risk summary", status: "running" },
  ];
  el.addEventListener("tc-active-change", (e) => console.log("Open", e.detail.active));
  el.addEventListener("tc-close", (e) => (el.tabs = el.tabs.filter((t) => t.id !== e.detail.id)));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SessionTabs, type SessionTab } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Chats() {
  const [tabs, setTabs] = useState<SessionTab[]>([
    { id: "q3", title: "Q3 reconciliation" },
    { id: "vendor", title: "Vendor risk summary", status: "running" },
  ]);
  const [active, setActive] = useState<string | null>("q3");
  return (
    <SessionTabs
      tabs={tabs}
      active={active}
      onActiveChange={setActive}
      onTcClose={(e) => setTabs((list) => list.filter((t) => t.id !== e.detail.id))}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/session-tabs";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";

defineProps<{ tabs: TcSessionTabs["tabs"]; order: TcSessionTabs["order"] }>();
const onActiveChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-session-tabs :tabs="tabs" :order="order" @tc-active-change="onActiveChange"></tc-session-tabs>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SessionTabs } from "@adamstavely/trenchcoat/angular/session-tabs";
import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";

@Component({
  selector: "app-session-tabs-example",
  imports: [SessionTabs],
  template: `<tc-session-tabs [tabs]="tabs()" [order]="order()" (tc-active-change)="onActiveChange($event)"></tc-session-tabs>`,
})
export class SessionTabsExample {
  readonly tabs = input.required<TcSessionTabs["tabs"]>();
  readonly order = input.required<TcSessionTabs["order"]>();
  onActiveChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-tabs";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";

  let { tabs, order }: { tabs: TcSessionTabs["tabs"]; order: TcSessionTabs["order"] } = $props();
  let el: TcSessionTabs;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-session-tabs bind:this={el} {tabs} {order}></tc-session-tabs>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tabs` | – | `SessionTab[]` | `[]` | The open chats |
| `active` | `active` | `string \| null` | `null` | The open tab's id. Changed by the user unless a tc-active-change listener calls preventDefault() |
| `order` | – | `string[]` | `[]` | The tabs' ids in the order shown; empty follows `tabs`. Changed by moving a tab unless a tc-order-change listener calls preventDefault() |
| `hideCreate` | `hide-create` | `boolean` | `false` | Hides the "+" button |
| `labels` | – | `Partial<SessionTabsLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-active-change` | – | Yes | A tab was opened ({ active, tab }: SessionTabsActiveChange); cancelable – prevented, `active` stays as it was |
| `tc-order-change` | – | Yes | A tab was moved ({ order, id }: SessionTabsOrderChange); cancelable – prevented, `order` stays as it was |
| `tc-close` | – | Yes | A tab's close button or Delete was pressed ({ id, tab }: SessionTabsClose); cancelable – the page removes the tab |
| `tc-new` | – | No | The "+" button was pressed (detail: {}) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-stab-min` | `96px` | both |
| `--tc-stab-max` | `220px` | both |
| `--tc-stab-fade` | `24px` | both |
| `--tc-stab-dot` | `6px` | both |
| `--tc-stab-menu-w` | `240px` | both |

#### Design tokens it reads (47)

`--tc-accent`, `--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-fast`, `--tc-duration-reveal-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-radius`, `--tc-z-drag`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSessionTabsLabels: SessionTabsLabels` | The words used when the page gives none |

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
| `tabs` | `el.tabs = …;` | `<… tabs={…} />` | `<tc-session-tabs :tabs="…">` | `<tc-session-tabs [tabs]="…">` | `<tc-session-tabs {tabs}>` |
| `order` | `el.order = …;` | `<… order={…} />` | `<tc-session-tabs :order="…">` | `<tc-session-tabs [order]="…">` | `<tc-session-tabs {order}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-session-tabs :labels="…">` | `<tc-session-tabs [labels]="…">` | `<tc-session-tabs {labels}>` |

*Also attributes: `active`, `hide-create` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-active-change` | Yes | `el.addEventListener("tc-active-change", (e) => …)` | `onActiveChange={…}` | `@tc-active-change="…"` | `(tc-active-change)="…($event)"` | `el.addEventListener("tc-active-change", …)` |
| `tc-order-change` | Yes | `el.addEventListener("tc-order-change", (e) => …)` | `onOrderChange={…}` | `@tc-order-change="…"` | `(tc-order-change)="…($event)"` | `el.addEventListener("tc-order-change", …)` |
| `tc-close` | Yes | `el.addEventListener("tc-close", (e) => …)` | `onTcClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |
| `tc-new` | No | `el.addEventListener("tc-new", (e) => …)` | `onTcNew={…}` | `@tc-new="…"` | `(tc-new)="…($event)"` | `el.addEventListener("tc-new", …)` |

### Controlled

The element changes `active` and `order` itself unless a listener calls `preventDefault()` on `tc-active-change` or `tc-order-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-session-tabs id="session-tabs"></tc-session-tabs>

<script type="module">
  import "@adamstavely/trenchcoat/session-tabs";

  const el = document.querySelector("#session-tabs");
  el.addEventListener("tc-active-change", (e) => {
    e.preventDefault(); // the element keeps its active…
    if (allowed(e.detail.active)) el.active = e.detail.active; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SessionTabs } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SessionTabs>;
type Props = Omit<Own, "active" | "onActiveChange"> & { initial: NonNullable<Own["active"]> };

// Controlled: passing active makes the wrapper prevent the element's own change; the app sets it
export function ControlledSessionTabs({ initial, ...props }: Props) {
  const [active, setActive] = useState<Own["active"]>(initial);
  return <SessionTabs {...props} active={active} onActiveChange={(next) => setActive(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/session-tabs";
import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";

const props = defineProps<{ initial: TcSessionTabs["active"] }>();
const active = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onActiveChange = (e: CustomEvent<{ active: TcSessionTabs["active"] }>) => {
  e.preventDefault();
  active.value = e.detail.active;
};
</script>

<template>
  <tc-session-tabs :active="active" @tc-active-change="onActiveChange"></tc-session-tabs>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SessionTabs } from "@adamstavely/trenchcoat/angular/session-tabs";
import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";

@Component({
  selector: "app-controlled-session-tabs",
  imports: [SessionTabs],
  template: `<tc-session-tabs [active]="active()" (tc-active-change)="onActiveChange($event)"></tc-session-tabs>`,
})
export class ControlledSessionTabs {
  readonly initial = input.required<TcSessionTabs["active"]>();
  readonly active = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onActiveChange(e: CustomEvent<{ active: TcSessionTabs["active"] }>) {
    e.preventDefault();
    this.active.set(e.detail.active);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-tabs";
  import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";

  let { initial }: { initial: TcSessionTabs["active"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let active = $derived(initial);
  let el: TcSessionTabs;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      active = (e as CustomEvent<{ active: TcSessionTabs["active"] }>).detail.active;
    };
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-session-tabs bind:this={el} {active}></tc-session-tabs>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-session-tabs")` returns a `TcSessionTabs` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";`
- **React / Next.js:** Props: `import type { SessionTabsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SessionTabs>`. The element class, for refs: `import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSessionTabs["tabs"]` with `import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";`
- **Angular:** The directive types the template: `[tabs]` takes `TcSessionTabs["tabs"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSessionTabs } from "@adamstavely/trenchcoat/session-tabs";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `string \| null` | The open tab's id – controlled when given |
| `defaultActive` | `string \| null` | At first, when `active` isn't controlled |
| `onActiveChange` | `(active: string \| null, tab?: SessionTab) => void` | Another tab was opened |
| `order` | `string[]` | The tabs' ids in the order shown – controlled when given |
| `defaultOrder` | `string[]` | At first, when `order` isn't controlled; empty follows `tabs` |
| `onOrderChange` | `(order: string[], id: string) => void` | A tab was moved |

*Renamed or hidden on the wrapper: `active`, `order`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

The tabs are one tab stop.

| Key | What it does |
|---|---|
| ← / → | Move between tabs (wrapping) |
| Home / End | Go to the first or last tab |
| Enter / Space | Open the focused tab |
| Delete / Backspace | Close the focused tab |
| Alt+Shift+← / → | Move the focused tab one place |
| ↑ / ↓ in the more menu | Move between the hidden tabs; Escape closes the menu |

### Screen readers

The tabs are a `tablist` named "Open chats"; each tab says its title, then its status in words ("Needs you") and
"unread", and `aria-selected` marks the open one. A hidden description of the keys is read with each tab. The close
buttons are mouse targets, hidden from screen readers and left out of the tab order: Delete closes the focused tab, and
the key description says so. Moving and
closing are announced through `role="status"` ("Moved Board pack draft to position 2 of 6"). The more button says how
many tabs it holds and opens a `menu`.

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
| CSS masks | 120 | 53 | 15.4 | 15.4 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.2 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.0 KB** | **8.7 KB** |
| With Lit – the first component on a page | 49.8 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 75 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of tabs replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | tabs: first render, 1,005 nodes; update 2.4 ms |
| 1,000 items | 59 ms | tabs: first render, 9,855 nodes; update 9.7 ms |

1,000 items of tabs: 59 ms. It renders every item, so a first render passes 50 ms (a long task) at about 840 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Titles say what the chat is about in a few words: "Vendor risk summary".
- Use `waiting` only when the chat needs the person; it's the status that draws the eye.
- Give `controls` the id of the panel a tab shows, so the tab points at it.

## Do and don't

### Do

- Remove the tab from `tabs` on `tc-close`; the element opens its neighbour if it was the open one.
- Clear `unread` when a tab is opened.

### Don't

- Don't put more than a dozen chats in tabs; past that, use `chat-history`.
- Don't use tabs for things that aren't chats or sessions.

## Related

- [Session List](session-list.md) – sessions in a sidebar, pinned first and grouped by project or status, with status, unread dot, branch, time, Pin and Archive.
- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [Thread Header](thread-header.md) – The bar at the top of a chat thread – the title renamed in place, model and project chips, Share, side-panel toggles and a menu of actions, folding into the menu when narrow
- [Panel Dock](panel-dock.md) – One side panel beside a chat, with a tab per open item – an artifact, a file, a source or a preview – resized from its edge, folded to a rail of icons, closed with Escape, and a full-width sheet when space is narrow
