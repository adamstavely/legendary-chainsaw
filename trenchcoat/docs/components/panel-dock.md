<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Panel Dock

**Workspace & sessions** · New

One side panel beside a chat, with a tab per open item – an artifact, a file, a source or a preview – resized from its edge, folded to a rail of icons, closed with Escape, and a full-width sheet when space is narrow

- **Element:** `<tc-panel-dock>`
- **Size:** 8.6 KB gzip · 27.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/panel-dock";` |
| React / Next.js | `import { PanelDock } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/panel-dock";` · tags starting with tc- are custom elements |
| Angular | `import { PanelDock } from "@adamstavely/trenchcoat/angular/panel-dock";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/panel-dock";` |

## Example

The live example is in the gallery at `#/panel-dock`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One side panel beside a chat, with a tab for each item open in it – an artifact the agent made, a file, a source, a
preview. The page puts each item's content in the element as a child with `slot` set to the item's id; the dock shows
the active one as its tab panel and hides the rest. Drag the panel's edge to resize it, fold it to a rail of icons, or
close it. When the space it docks in is narrower than `breakpoint` (640 px), it becomes a full-width sheet over the page.

### When to use

- A chat that opens things beside it, where people keep two or three open and move between them.
- Any layout with a single resizable side panel that holds more than one thing.

### When not to use

- Everything one run produced, with versions and downloads – use [Artifact Panel](artifact-panel.md), perhaps inside the dock.
- An assistant docked beside a page – use [AI Side Pane](../blocks/ai-side-pane.md).
- Open chats as tabs – use [Session Tabs](session-tabs.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Handle** `.ui-pdk__handle` – the splitter on the edge toward the chat
2. **Head** `.ui-pdk__head` – the tabs and the tools
3. **Tab** `.ui-pdk__tab` – an item's `.ui-pdk__tab-btn` and `.ui-pdk__tab-close`
4. **Tools** `.ui-pdk__tools` – `.ui-pdk__collapse` and `.ui-pdk__close`
5. **Content** `.ui-pdk__content` – the page's child for the active item, made the tab panel
6. **Rail** `.ui-pdk__rail` – collapsed: `.ui-pdk__expand` and a `.ui-pdk__rail-item` per item
7. **Empty** `.ui-pdk__empty` – no items open

## Looks

Standard puts the tabs on the gray tray above a white card holding the content; Clean is one white panel with the tabs
as its first row. `side="left"` docks it on the left, with the handle on its right edge. The element sizes itself from
`width`; give it a height through its container. Component tokens: `--tc-pdk-rail` (the rail's width),
`--tc-pdk-handle` (the splitter's hit area) and `--tc-pdk-tab-max`.

## Usage

### HTML

```html
<tc-panel-dock id="dock" active="draft">
  <article slot="draft">The report draft…</article>
  <div slot="ledger">1,284 rows</div>
</tc-panel-dock>

<script type="module">
  import "@adamstavely/trenchcoat/panel-dock";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#dock");
  el.items = [
    { id: "draft", title: "Q3 report draft", kind: "Artifact" },
    { id: "ledger", title: "ledger-q3.csv", kind: "File" },
  ];
  el.addEventListener("tc-close", (e) => (el.items = el.items.filter((i) => i.id !== e.detail.id)));
  el.addEventListener("tc-width-change", (e) => console.log("Width", e.detail.width));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PanelDock, type PanelDockItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Dock() {
  const [items, setItems] = useState<PanelDockItem[]>([{ id: "draft", title: "Q3 report draft", kind: "Artifact" }]);
  const [width, setWidth] = useState(420);
  return (
    <PanelDock items={items} width={width} onWidthChange={setWidth} onTcClose={(e) => setItems((l) => l.filter((i) => i.id !== e.detail.id))}>
      <article slot="draft">The report draft…</article>
    </PanelDock>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/panel-dock";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";

defineProps<{ items: TcPanelDock["items"]; labels: TcPanelDock["labels"] }>();
const onActiveChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-panel-dock :items="items" :labels="labels" @tc-active-change="onActiveChange"></tc-panel-dock>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PanelDock } from "@adamstavely/trenchcoat/angular/panel-dock";
import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";

@Component({
  selector: "app-panel-dock-example",
  imports: [PanelDock],
  template: `<tc-panel-dock [items]="items()" [labels]="labels()" (tc-active-change)="onActiveChange($event)"></tc-panel-dock>`,
})
export class PanelDockExample {
  readonly items = input.required<TcPanelDock["items"]>();
  readonly labels = input.required<TcPanelDock["labels"]>();
  onActiveChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/panel-dock";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";

  let { items, labels }: { items: TcPanelDock["items"]; labels: TcPanelDock["labels"] } = $props();
  let el: TcPanelDock;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-panel-dock bind:this={el} {items} {labels}></tc-panel-dock>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `PanelDockItem[]` | `[]` | The items open in the panel, in tab order |
| `active` | `active` | `string \| null` | `null` | The shown item's id. Changed by the tabs unless a tc-active-change listener calls preventDefault() |
| `open` | `open` | `boolean` | `true` | Whether the panel shows at all. Closed by its Close button or Escape unless a tc-open-change listener calls preventDefault() |
| `collapsed` | `collapsed` | `boolean` | `false` | Folded to a rail of icons. Changed by Collapse and Expand unless a tc-collapsed-change listener calls preventDefault() |
| `width` | `width` | `number` | `420` | The panel's width, px. Changed by the splitter unless a tc-width-change listener calls preventDefault() |
| `minWidth` | `min-width` | `number` | `280` | The narrowest the splitter goes, px |
| `maxWidth` | `max-width` | `number` | `760` | The widest the splitter goes, px |
| `breakpoint` | `breakpoint` | `number` | `640` | Below this width of its parent, px, the panel becomes a full-width sheet over the page; 0 never |
| `side` | `side` | `PanelDockSide` | `"right"` | Which side of the chat the panel docks on – the splitter is on the other edge |
| `labels` | – | `Partial<PanelDockLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-active-change` | – | Yes | Another item was shown ({ active, item }: PanelDockActiveChange); cancelable – prevented, `active` stays as it was |
| `tc-close` | – | Yes | An item's close button or Delete was pressed ({ id, item }: PanelDockClose); cancelable – the page removes the item |
| `tc-width-change` | – | Yes | The panel was resized – once a drag ends, and on every key step ({ width }: PanelDockWidthChange); cancelable – prevented, `width` stays |
| `tc-open-change` | – | Yes | The panel was closed ({ open }: PanelDockOpenChange); cancelable – prevented, it stays open |
| `tc-collapsed-change` | – | Yes | The panel was folded to a rail or opened out ({ collapsed }: PanelDockCollapsedChange); cancelable – prevented, it stays as it was |

#### Slots

| Slot | Description |
| --- | --- |
| `<item` | id> - Each item's content: a child with `slot` set to the item's id |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pdk-w` | `420px` | both |
| `--tc-pdk-rail` | `48px` | both |
| `--tc-pdk-handle` | `8px` | both |
| `--tc-pdk-tab-max` | `200px` | both |

#### Design tokens it reads (34)

`--tc-accent`, `--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-drawer`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPanelDockLabels: PanelDockLabels` | The words used when the page gives none |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-panel-dock :items="…">` | `<tc-panel-dock [items]="…">` | `<tc-panel-dock {items}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-panel-dock :labels="…">` | `<tc-panel-dock [labels]="…">` | `<tc-panel-dock {labels}>` |

*Also attributes: `active`, `open`, `collapsed`, `width`, `min-width`, `max-width`, `breakpoint`, `side` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-active-change` | Yes | `el.addEventListener("tc-active-change", (e) => …)` | `onActiveChange={…}` | `@tc-active-change="…"` | `(tc-active-change)="…($event)"` | `el.addEventListener("tc-active-change", …)` |
| `tc-close` | Yes | `el.addEventListener("tc-close", (e) => …)` | `onTcClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |
| `tc-width-change` | Yes | `el.addEventListener("tc-width-change", (e) => …)` | `ref.current.addEventListener("tc-width-change", …)` | `@tc-width-change="…"` | `(tc-width-change)="…($event)"` | `el.addEventListener("tc-width-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `active`, `open`, `collapsed` and `width` itself unless a listener calls `preventDefault()` on `tc-active-change`, `tc-open-change`, `tc-collapsed-change` or `tc-width-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-panel-dock id="panel-dock"></tc-panel-dock>

<script type="module">
  import "@adamstavely/trenchcoat/panel-dock";

  const el = document.querySelector("#panel-dock");
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
import { PanelDock } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PanelDock>;
type Props = Omit<Own, "active" | "onActiveChange"> & { initial: NonNullable<Own["active"]> };

// Controlled: passing active makes the wrapper prevent the element's own change; the app sets it
export function ControlledPanelDock({ initial, ...props }: Props) {
  const [active, setActive] = useState<Own["active"]>(initial);
  return <PanelDock {...props} active={active} onActiveChange={(next) => setActive(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/panel-dock";
import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";

const props = defineProps<{ initial: TcPanelDock["active"] }>();
const active = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onActiveChange = (e: CustomEvent<{ active: TcPanelDock["active"] }>) => {
  e.preventDefault();
  active.value = e.detail.active;
};
</script>

<template>
  <tc-panel-dock :active="active" @tc-active-change="onActiveChange"></tc-panel-dock>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PanelDock } from "@adamstavely/trenchcoat/angular/panel-dock";
import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";

@Component({
  selector: "app-controlled-panel-dock",
  imports: [PanelDock],
  template: `<tc-panel-dock [active]="active()" (tc-active-change)="onActiveChange($event)"></tc-panel-dock>`,
})
export class ControlledPanelDock {
  readonly initial = input.required<TcPanelDock["active"]>();
  readonly active = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onActiveChange(e: CustomEvent<{ active: TcPanelDock["active"] }>) {
    e.preventDefault();
    this.active.set(e.detail.active);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/panel-dock";
  import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";

  let { initial }: { initial: TcPanelDock["active"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let active = $derived(initial);
  let el: TcPanelDock;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      active = (e as CustomEvent<{ active: TcPanelDock["active"] }>).detail.active;
    };
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-panel-dock bind:this={el} {active}></tc-panel-dock>
```

### Slots and children

Put children inside the tag with a `slot` attribute: `slot="<item"`. The element renders into itself (no shadow root) and leaves them where you put them.

- **React:** pass them as children with the same attribute.
- **Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-panel-dock")` returns a `TcPanelDock` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";`
- **React / Next.js:** Props: `import type { PanelDockProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PanelDock>`. The element class, for refs: `import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPanelDock["items"]` with `import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";`
- **Angular:** The directive types the template: `[items]` takes `TcPanelDock["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPanelDock } from "@adamstavely/trenchcoat/panel-dock";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `string \| null` | The shown item's id – controlled when given |
| `defaultActive` | `string \| null` | At first, when `active` isn't controlled |
| `onActiveChange` | `(active: string \| null, item?: PanelDockItem) => void` | Another item was shown |
| `open` | `boolean` | Whether the panel shows – controlled when given |
| `defaultOpen` | `boolean` | At first, when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The panel was closed |
| `collapsed` | `boolean` | Folded to a rail – controlled when given |
| `defaultCollapsed` | `boolean` | At first, when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: boolean) => void` | The panel was folded or opened out |
| `width` | `number` | The panel's width, px – controlled when given |
| `defaultWidth` | `number` | At first, when `width` isn't controlled |
| `onWidthChange` | `(width: number) => void` | The panel was resized |

*Renamed or hidden on the wrapper: `active`, `open`, `collapsed`, `width`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| ← / → on the tabs | Move between items |
| Home / End on the tabs | Go to the first or last item |
| Enter / Space | Show the focused item |
| Delete / Backspace | Close the focused item |
| ← / → on the handle | Resize by 16 px (on the right, ← widens) |
| Home / End on the handle | Narrowest / widest |
| Escape anywhere inside | Close the panel; focus goes back to where it came from |

### Screen readers

The panel is a region named "Side panel". The tabs are a `tablist` named "Open items"; each tab reads its title and its
kind ("Q3 report draft, Artifact"), and the content child gets `role="tabpanel"`, labelled by its tab. The handle is a
vertical `separator` with its width as `aria-valuenow` and in words. Collapsed, the rail lists the items as buttons
with `aria-current` on the shown one. The tabs' close buttons are mouse targets, hidden from screen readers – Delete
closes the focused tab. Closing an item is announced.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 21.2 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.9 KB** | **8.6 KB** |
| With Lit – the first component on a page | 49.7 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 53 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of items replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | items: first render, 1,120 nodes; update 1.7 ms |
| 1,000 items | 55 ms | items: first render, 11,020 nodes; update 7.8 ms |

1,000 items of items: 55 ms. It renders every item, so a first render passes 50 ms (a long task) at about 900 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Titles name the thing, not the action: "ledger-q3.csv", "Expense policy §4.2".
- Give `kind` so the tab says what it is, and an `icon` so the rail can be told apart.

## Do and don't

### Do

- Take the item out of `items` on `tc-close`, and its child with it.
- Keep `width` across visits by controlling it.

### Don't

- Don't nest one dock in another.
- Don't put the chat itself in the dock; the dock is beside it.

## Related

- [Artifact Panel](artifact-panel.md) – Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download
- [AI Side Pane](../blocks/ai-side-pane.md) – An assistant docked beside a page with a chat about what's on it – resizable, collapses to a rail, opens with ⌘. and becomes a sheet on narrow screens; model, settings, prompts and page context in the composer (uses `chat-composer`, `ai-answer`, `claim-answer`, `message-actions`, `prompt-starters`, `chat-history`, `reflection-gate`, `button`)
- [Thread Header](thread-header.md) – The bar at the top of a chat thread – the title renamed in place, model and project chips, Share, side-panel toggles and a menu of actions, folding into the menu when narrow
- [Session Tabs](session-tabs.md) – Open chats as tabs above a thread – status as a mark and a word, unread dots, close, drag or Alt+Shift+arrows to reorder, and a menu of the tabs scrolled out of view
