<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Preview Frame

**Workspace & sessions** · New

a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.

- **Element:** `<tc-preview-frame>`
- **Size:** 11.4 KB gzip · 37.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/preview-frame";` |
| React / Next.js | `import { PreviewFrame } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/preview-frame";` · tags starting with tc- are custom elements |
| Angular | `import { PreviewFrame } from "@adamstavely/trenchcoat/angular/preview-frame";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/preview-frame";` |

## Example

The live example is in the gallery at `#/preview-frame`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A browser pane around a page the app supplies: back, forward and reload, an address field, a phone / tablet / desktop
switch, a console count and a button to open the page in a new window, with optional tabs. By default it shows `src` in
a sandboxed iframe. Any children the page puts inside the element are shown instead, such as a mock page, a canvas or a
screenshot, and they stay where the page put them.

Phone and tablet are drawn at 375 and 768 CSS pixels and zoomed down to fit the pane, centred, with the size shown under
them. Loading, error and empty states are the page's to set.

### When to use

- Previewing the app a session is building, beside its terminal and processes.
- Showing one page at several widths without leaving the panel.

### When not to use

- Embedding a third-party site for people to use – a plain `iframe` with its own policy is clearer.
- A list of servers to start and stop – use [Process List](process-list.md).
- Showing an image of a page with no toolbar – use an image.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-pvf__tabs` – open pages, with New tab, when `tabs` is given
2. **Toolbar** `.ui-pvf__bar` – back, forward and reload, the address, the widths, the console and open externally
3. **Address** `.ui-pvf__address` – its icon says secure, local or not secure
4. **Widths** `.ui-pvf__vps` – a radio group of phone, tablet and desktop
5. **Console** `.ui-pvf__console` – error and warning counts, when `consoleCount` is given
6. **Page area** `.ui-pvf__stage` – the iframe `.ui-pvf__frame`, the page's children, or a notice
7. **Loading bar** `.ui-pvf__progress` – runs while `loading`
8. **Notice** `.ui-pvf__notice` – "Couldn't load …" with Retry, or "No preview running" with Start
9. **Size** `.ui-pvf__size` – the width and zoom, at phone and tablet

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-pvf-inset`, the gap around a phone or tablet, and
`--tc-pvf-backdrop`, the colour behind it.

Below about 30rem, as in a side panel, the address takes its own line under the buttons.

## Usage

### HTML

```html
<tc-preview-frame id="preview" src="http://localhost:5173/" viewport="phone"></tc-preview-frame>

<script type="module">
  import "@adamstavely/trenchcoat/preview-frame";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#preview");
  el.consoleCount = { errors: 0, warnings: 2 };
  el.addEventListener("tc-reload", () => {
    el.src = "";
    requestAnimationFrame(() => (el.src = "http://localhost:5173/"));
  });
  el.addEventListener("tc-open-external", (e) => window.open(e.detail.url, "_blank", "noopener"));
</script>
```

### React / Next.js

```tsx
import { PreviewFrame } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Preview({ running, onStart }: { running: boolean; onStart: () => void }) {
  return (
    <PreviewFrame
      src={running ? "http://localhost:5173/" : ""}
      startable
      defaultViewport="tablet"
      onTcStart={onStart}
      onTcOpenExternal={(e) => window.open(e.detail.url, "_blank", "noopener")}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/preview-frame";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";

defineProps<{ consoleCount: TcPreviewFrame["consoleCount"]; tabs: TcPreviewFrame["tabs"] }>();
const onNavigate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-preview-frame :consoleCount="consoleCount" :tabs="tabs" @tc-navigate="onNavigate"></tc-preview-frame>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PreviewFrame } from "@adamstavely/trenchcoat/angular/preview-frame";
import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";

@Component({
  selector: "app-preview-frame-example",
  imports: [PreviewFrame],
  template: `<tc-preview-frame [consoleCount]="consoleCount()" [tabs]="tabs()" (tc-navigate)="onNavigate($event)"></tc-preview-frame>`,
})
export class PreviewFrameExample {
  readonly consoleCount = input.required<TcPreviewFrame["consoleCount"]>();
  readonly tabs = input.required<TcPreviewFrame["tabs"]>();
  onNavigate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/preview-frame";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";

  let { consoleCount, tabs }: { consoleCount: TcPreviewFrame["consoleCount"]; tabs: TcPreviewFrame["tabs"] } = $props();
  let el: TcPreviewFrame;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-preview-frame bind:this={el} {consoleCount} {tabs}></tc-preview-frame>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Preview"` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `src` | `src` | `string` | `""` | The page the iframe loads: http, https or about:blank. Children, when there are any, show instead |
| `url` | `url` | `string` | `""` | The address shown; by default the active tab's url, else `src` |
| `sandbox` | `sandbox` | `string` | `"allow-scripts allow-forms allow-same-origin"` | The iframe's sandbox attribute |
| `viewport` | `viewport` | `PreviewViewport` | `"desktop"` | The width the page is drawn at. Changed by the switch unless a tc-viewport-change listener calls preventDefault() |
| `height` | `height` | `number` | `420` | The page area's height in px |
| `loading` | `loading` | `boolean` | `false` | The page is loading: a bar runs and Reload spins |
| `error` | `error` | `string` | `""` | Why the page couldn't load; set, the error state shows instead of the page |
| `startable` | `startable` | `boolean` | `false` | Shows the Start button in the empty state |
| `canGoBack` | `can-go-back` | `boolean` | `false` | Back can be pressed |
| `canGoForward` | `can-go-forward` | `boolean` | `false` | Forward can be pressed |
| `consoleCount` | – | `PreviewConsole \| undefined` | `undefined` | The console's counts; unset hides the badge |
| `tabs` | – | `PreviewTab[]` | `[]` | Open pages; with none there's no tab row |
| `active` | `active` | `string \| null` | `null` | The active tab's id. Changed by choosing a tab unless a tc-active-change listener calls preventDefault() |
| `noNewTab` | `no-new-tab` | `boolean` | `false` | Hides the New tab button |
| `labels` | – | `Partial<PreviewFrameLabels>` | `{}` | Rename any of the words, over the defaults |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `address` | – | `` | – | The address shown |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-navigate` | – | Yes | Enter was pressed in the address ({ url }: PreviewNavigate); cancelable – prevented, the address and `src` stay as they were |
| `tc-viewport-change` | – | Yes | A width was chosen ({ viewport }: PreviewViewportChange); cancelable – prevented, `viewport` stays as it was |
| `tc-active-change` | – | Yes | A tab was chosen ({ active, tab }: PreviewActiveChange); cancelable – prevented, `active` stays as it was |
| `tc-close` | – | Yes | A tab's close button or Delete was pressed ({ id, tab }: PreviewTabEvent); cancelable – prevented, the tab stays |
| `tc-new-tab` | – | No | New tab was pressed (detail: null) |
| `tc-back` | – | No | Back was pressed (detail: null) |
| `tc-forward` | – | No | Forward was pressed (detail: null) |
| `tc-reload` | – | No | Reload or Retry was pressed (detail: null) |
| `tc-start` | – | No | Start was pressed in the empty state (detail: null) |
| `tc-open-external` | – | No | Open in a new window was pressed ({ url }: PreviewExternal) |
| `tc-console` | – | No | The console count was pressed (detail: null) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pvf-inset` | `var(--tc-space-4)` | both |
| `--tc-pvf-backdrop` | `var(--tc-surface-sunken)` | both |
| `--tc-pvf-w` | `100%` | not set – this fallback applies |
| `--tc-pvf-zoom` | `1` | not set – this fallback applies |

#### Design tokens it reads (62)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-reveal-slow`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pvf-stage-h`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-base`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPreviewFrameLabels: PreviewFrameLabels` | The words used when the page gives none |
| `PREVIEW_WIDTHS: Record<Exclude<PreviewViewport, "desktop">, number>` | The widths phone and tablet are drawn at, in CSS px |
| `normalizePreviewUrl(typed: string): void` | Adds a scheme to a typed address: http for local hosts, https for the rest |
| `previewSecurity(url: string): "secure" \| "local" \| "insecure" \| ""` | The address's kind, for its icon: "secure", "local", "insecure" or "" for anything else |

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
| `consoleCount` | `el.consoleCount = …;` | `<… consoleCount={…} />` | `<tc-preview-frame :consoleCount="…">` | `<tc-preview-frame [consoleCount]="…">` | `<tc-preview-frame {consoleCount}>` |
| `tabs` | `el.tabs = …;` | `<… tabs={…} />` | `<tc-preview-frame :tabs="…">` | `<tc-preview-frame [tabs]="…">` | `<tc-preview-frame {tabs}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-preview-frame :labels="…">` | `<tc-preview-frame [labels]="…">` | `<tc-preview-frame {labels}>` |

*Also attributes: `heading`, `description`, `src`, `url`, `sandbox`, `viewport`, `height`, `loading` and 7 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-navigate` | Yes | `el.addEventListener("tc-navigate", (e) => …)` | `onTcNavigate={…}` | `@tc-navigate="…"` | `(tc-navigate)="…($event)"` | `el.addEventListener("tc-navigate", …)` |
| `tc-viewport-change` | Yes | `el.addEventListener("tc-viewport-change", (e) => …)` | `ref.current.addEventListener("tc-viewport-change", …)` | `@tc-viewport-change="…"` | `(tc-viewport-change)="…($event)"` | `el.addEventListener("tc-viewport-change", …)` |
| `tc-active-change` | Yes | `el.addEventListener("tc-active-change", (e) => …)` | `ref.current.addEventListener("tc-active-change", …)` | `@tc-active-change="…"` | `(tc-active-change)="…($event)"` | `el.addEventListener("tc-active-change", …)` |
| `tc-close` | Yes | `el.addEventListener("tc-close", (e) => …)` | `onTcClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |
| `tc-new-tab` | No | `el.addEventListener("tc-new-tab", (e) => …)` | `onTcNewTab={…}` | `@tc-new-tab="…"` | `(tc-new-tab)="…($event)"` | `el.addEventListener("tc-new-tab", …)` |
| `tc-back` | No | `el.addEventListener("tc-back", (e) => …)` | `onTcBack={…}` | `@tc-back="…"` | `(tc-back)="…($event)"` | `el.addEventListener("tc-back", …)` |
| `tc-forward` | No | `el.addEventListener("tc-forward", (e) => …)` | `onTcForward={…}` | `@tc-forward="…"` | `(tc-forward)="…($event)"` | `el.addEventListener("tc-forward", …)` |
| `tc-reload` | No | `el.addEventListener("tc-reload", (e) => …)` | `onTcReload={…}` | `@tc-reload="…"` | `(tc-reload)="…($event)"` | `el.addEventListener("tc-reload", …)` |
| `tc-start` | No | `el.addEventListener("tc-start", (e) => …)` | `onTcStart={…}` | `@tc-start="…"` | `(tc-start)="…($event)"` | `el.addEventListener("tc-start", …)` |
| `tc-open-external` | No | `el.addEventListener("tc-open-external", (e) => …)` | `onTcOpenExternal={…}` | `@tc-open-external="…"` | `(tc-open-external)="…($event)"` | `el.addEventListener("tc-open-external", …)` |
| `tc-console` | No | `el.addEventListener("tc-console", (e) => …)` | `onTcConsole={…}` | `@tc-console="…"` | `(tc-console)="…($event)"` | `el.addEventListener("tc-console", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `viewport` and `active` itself unless a listener calls `preventDefault()` on `tc-viewport-change` or `tc-active-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-preview-frame id="preview-frame"></tc-preview-frame>

<script type="module">
  import "@adamstavely/trenchcoat/preview-frame";

  const el = document.querySelector("#preview-frame");
  el.addEventListener("tc-viewport-change", (e) => {
    e.preventDefault(); // the element keeps its viewport…
    if (allowed(e.detail.viewport)) el.viewport = e.detail.viewport; // …until the app sets it
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
import "@adamstavely/trenchcoat/preview-frame";
import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";

const props = defineProps<{ initial: TcPreviewFrame["viewport"] }>();
const viewport = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewportChange = (e: CustomEvent<{ viewport: TcPreviewFrame["viewport"] }>) => {
  e.preventDefault();
  viewport.value = e.detail.viewport;
};
</script>

<template>
  <tc-preview-frame :viewport="viewport" @tc-viewport-change="onViewportChange"></tc-preview-frame>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PreviewFrame } from "@adamstavely/trenchcoat/angular/preview-frame";
import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";

@Component({
  selector: "app-controlled-preview-frame",
  imports: [PreviewFrame],
  template: `<tc-preview-frame [viewport]="viewport()" (tc-viewport-change)="onViewportChange($event)"></tc-preview-frame>`,
})
export class ControlledPreviewFrame {
  readonly initial = input.required<TcPreviewFrame["viewport"]>();
  readonly viewport = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewportChange(e: CustomEvent<{ viewport: TcPreviewFrame["viewport"] }>) {
    e.preventDefault();
    this.viewport.set(e.detail.viewport);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/preview-frame";
  import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";

  let { initial }: { initial: TcPreviewFrame["viewport"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let viewport = $derived(initial);
  let el: TcPreviewFrame;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      viewport = (e as CustomEvent<{ viewport: TcPreviewFrame["viewport"] }>).detail.viewport;
    };
    el.addEventListener("tc-viewport-change", on);
    return () => el.removeEventListener("tc-viewport-change", on);
  });
</script>

<tc-preview-frame bind:this={el} {viewport}></tc-preview-frame>
```

### Slots and children

No slots: everything it shows comes from its properties (and, in React, the wrapper's children).

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-preview-frame")` returns a `TcPreviewFrame` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";`
- **React / Next.js:** Props: `import type { PreviewFrameProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PreviewFrame>`. The element class, for refs: `import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPreviewFrame["consoleCount"]` with `import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";`
- **Angular:** The directive types the template: `[consoleCount]` takes `TcPreviewFrame["consoleCount"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPreviewFrame } from "@adamstavely/trenchcoat/preview-frame";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `viewport` | `PreviewViewport` | The width the page is drawn at – controlled when given |
| `defaultViewport` | `PreviewViewport` | The width at first, when `viewport` isn't controlled |
| `onViewportChange` | `(viewport: PreviewViewport) => void` | A width was chosen |
| `active` | `string \| null` | The active tab's id – controlled when given |
| `defaultActive` | `string \| null` | The active tab at first, when `active` isn't controlled |
| `onActiveChange` | `(active: string \| null, tab?: PreviewTab) => void` | A tab was chosen |
| `children` | `React.ReactNode` | Shown instead of the iframe: a mock page, a canvas, a screenshot |

*Renamed or hidden on the wrapper: `heading`, `viewport`, `active`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the toolbar: buttons, address, widths, console, open externally |
| Enter | In the address, goes there |
| Escape | In the address, puts back the current address |
| ← / → | In the widths or the tabs, chooses the previous or next |
| Home / End | In the widths or the tabs, chooses the first or last |
| Delete / Backspace | On a tab, closes it |

The tabs and the widths are one tab stop each.

### Screen readers

Every icon button has its name in screen-reader text: "Back", "Reload", "Phone". The address field is labelled
"Address" and the icon beside it says "Secure", "Local" or "Not secure". The widths are a radio group named "Viewport";
the tabs a tab list named "Pages", whose close buttons are for the pointer only – Delete closes a tab from the
keyboard. The console button reads its counts, such as "2 errors, 1 warning". The iframe is titled by the tab or the
heading. The page area is `aria-busy` while loading, and a load failure is an alert.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 29.9 KB | 9.4 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **37.4 KB** | **11.4 KB** |
| With Lit – the first component on a page | 60.5 KB | 19.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 100 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of tabs replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.5 ms | tabs: first render, 786 nodes; update 0.7 ms |
| 1,000 items | 38 ms | tabs: first render, 7,086 nodes; update 4.5 ms |

1,000 items of tabs: 38 ms, 7,086 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each tab a short `title` people would say: "Freezers", "Samples".
- Set `error` to what went wrong and what to do next: "The dev server stopped answering. Restart it, then retry."
- Keep `src` on the app's own dev server; only http, https and about:blank are loaded.

## Do and don't

### Do

- Listen for `tc-navigate`, `tc-back`, `tc-forward` and `tc-reload` and drive the page, then pass `loading`,
  `canGoBack` and `canGoForward`.
- Pass a narrower `sandbox` when the page doesn't need scripts or forms.
- Prevent `tc-close` and update `tabs` yourself when the page owns the list.

### Don't

- Don't load pages you don't trust with `allow-same-origin` and `allow-scripts` together: the page could reach out of
  the sandbox.
- Don't rely on the frame to report errors from another origin; the browser hides them, so the page sets `error`.

## Related

- [Process List](process-list.md) – dev servers and background jobs with status, port link, uptime, CPU and memory, and last output, with Stop, Start, Restart and View output.
- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
- [Session Panel](../blocks/session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
