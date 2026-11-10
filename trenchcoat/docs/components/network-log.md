<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Network Log

**Workspace & sessions** · New

The requests a web page made: status, method, name, size, time and a waterfall, with type chips and a detail of headers and response.

- **Element:** `<tc-network-log>`
- **Size:** 21.9 KB gzip · 78.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/network-log";` |
| React / Next.js | `import { NetworkLog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/network-log";` · tags starting with tc- are custom elements |
| Angular | `import { NetworkLog } from "@adamstavely/trenchcoat/angular/network-log";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/network-log";` |

## Example

The live example is in the gallery at `#/network-log`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The requests a web page made. Each row shows its status, method, name, type, size and time, and a waterfall bar placed by
when it started and how long it took. Type chips narrow the list. Choosing a request opens its details under the list:
Headers, with the URL, method, status and both header sets, and Response, with an object body in a JSON Viewer or a text
body as it came. A footer counts the requests, their size and when the last one finished. Nothing here watches a real
network: the page passes `requests`.

### When to use

- The network tab of a page shown in a `preview-frame`, beside a session or editor.
- Requests captured from a test run or a recorded session, to see what failed and why.
- Any set of HTTP calls where timing and status matter more than their order on a list.

### When not to use

- One API response to read – use [JSON Viewer](json-viewer.md).
- The page's console messages – use [Console Panel](console-panel.md).
- A general table of records – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Type chips** `.ui-netl__chips` – All, then one chip per type with its count
2. **Header row** `.ui-netl__head` – the column names
3. **Request** `.ui-netl__row` – status `.ui-netl__status`, method `.ui-netl__method`, name `.ui-netl__name`, type `.ui-netl__type`, size `.ui-netl__size` and time `.ui-netl__time`
4. **Waterfall** `.ui-netl__fall` – the request's bar `.ui-netl__bar` across the whole load
5. **Footer** `.ui-netl__foot` – requests, total size and finish time
6. **Details** `.ui-netl__detail` – the Headers and Response tabs `.ui-netl__tabs`, Close `.ui-netl__close`, header lists `.ui-netl__pairs`, and a text body `.ui-netl__text` or a JSON Viewer `.ui-netl__json`
7. **Empty** `.ui-netl__empty` – "No requests", or "No requests match" when the chips hide everything

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Statuses are green for 2xx, gray for 3xx and red for 4xx, 5xx and failed requests, whose name and bar turn red too; the
code or the word "failed" is always written. A page can set `--tc-netl-cols` and `--tc-netl-cols-narrow`, the column
widths, and `--tc-netl-bar-h`, the waterfall's height. When the card is narrower than 480 px, the type, size and
waterfall columns are left out, and in the details each header's name sits above its value.

## Usage

### HTML

```html
<tc-network-log id="network"></tc-network-log>

<script type="module">
  import "@adamstavely/trenchcoat/network-log";
  import "@adamstavely/trenchcoat/tokens.css";

  const log = document.querySelector("#network");
  log.requests = [
    { id: "1", method: "GET", url: "https://staging.halden.example/api/grants", status: 200, type: "fetch", size: 9310, start: 470, duration: 168, body: { total: 24 } },
    { id: "2", method: "GET", url: "https://staging.halden.example/static/img/halden-logo.svg", status: 404, type: "image", size: 412, start: 450, duration: 38 },
  ];
  log.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { NetworkLog, type NetworkRequest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PageNetwork({ requests }: { requests: NetworkRequest[] }) {
  return <NetworkLog requests={requests} defaultTypes={["fetch"]} onSelectedChange={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/network-log";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";

defineProps<{ requests: TcNetworkLog["requests"]; types: TcNetworkLog["types"] }>();
const onTypesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-network-log :requests="requests" :types="types" @tc-types-change="onTypesChange"></tc-network-log>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { NetworkLog } from "@adamstavely/trenchcoat/angular/network-log";
import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";

@Component({
  selector: "app-network-log-example",
  imports: [NetworkLog],
  template: `<tc-network-log [requests]="requests()" [types]="types()" (tc-types-change)="onTypesChange($event)"></tc-network-log>`,
})
export class NetworkLogExample {
  readonly requests = input.required<TcNetworkLog["requests"]>();
  readonly types = input.required<TcNetworkLog["types"]>();
  onTypesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/network-log";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";

  let { requests, types }: { requests: TcNetworkLog["requests"]; types: TcNetworkLog["types"] } = $props();
  let el: TcNetworkLog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-types-change", on);
    return () => el.removeEventListener("tc-types-change", on);
  });
</script>

<tc-network-log bind:this={el} {requests} {types}></tc-network-log>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Network"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the page they belong to |
| `requests` | – | `NetworkRequest[]` | `[]` | The requests, in the order they started |
| `types` | – | `NetworkType[]` | `[]` | The types that show; empty shows them all |
| `selected` | `selected` | `string \| null` | `null` | The open request's id |
| `maxHeight` | `max-height` | `number` | `320` | Height in px at which the list scrolls |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for sizes and times |
| `labels` | – | `Partial<NetworkLogLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-types-change` | – | Yes | A type chip was toggled ({ types }: NetworkTypesChange); empty means all; cancelable – prevented, `types` stays as it was |
| `tc-selected-change` | – | Yes | A request was opened or its details closed ({ selected, request }: NetworkSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-netl-cols` | `3.5rem 4rem minmax(0, 1fr) 3.5rem 4.5rem 4.5rem 22%` | both |
| `--tc-netl-cols-narrow` | `3.5rem 3.5rem minmax(0, 1fr) 4.5rem` | both |
| `--tc-netl-bar-h` | `8px` | both |

#### Design tokens it reads (52)

`--tc-accent-solid`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `requestName(url: string): void` | The last part of a URL's path, or its host for "/" |

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
| `requests` | `el.requests = …;` | `<… requests={…} />` | `<tc-network-log :requests="…">` | `<tc-network-log [requests]="…">` | `<tc-network-log {requests}>` |
| `types` | `el.types = …;` | `<… types={…} />` | `<tc-network-log :types="…">` | `<tc-network-log [types]="…">` | `<tc-network-log {types}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-network-log :labels="…">` | `<tc-network-log [labels]="…">` | `<tc-network-log {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `max-height`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-types-change` | Yes | `el.addEventListener("tc-types-change", (e) => …)` | `ref.current.addEventListener("tc-types-change", …)` | `@tc-types-change="…"` | `(tc-types-change)="…($event)"` | `el.addEventListener("tc-types-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `types` and `selected` itself unless a listener calls `preventDefault()` on `tc-types-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-network-log id="network-log"></tc-network-log>

<script type="module">
  import "@adamstavely/trenchcoat/network-log";

  const el = document.querySelector("#network-log");
  el.addEventListener("tc-types-change", (e) => {
    e.preventDefault(); // the element keeps its types…
    if (allowed(e.detail.types)) el.types = e.detail.types; // …until the app sets it
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
import "@adamstavely/trenchcoat/network-log";
import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";

const props = defineProps<{ initial: TcNetworkLog["types"] }>();
const types = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTypesChange = (e: CustomEvent<{ types: TcNetworkLog["types"] }>) => {
  e.preventDefault();
  types.value = e.detail.types;
};
</script>

<template>
  <tc-network-log :types="types" @tc-types-change="onTypesChange"></tc-network-log>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { NetworkLog } from "@adamstavely/trenchcoat/angular/network-log";
import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";

@Component({
  selector: "app-controlled-network-log",
  imports: [NetworkLog],
  template: `<tc-network-log [types]="types()" (tc-types-change)="onTypesChange($event)"></tc-network-log>`,
})
export class ControlledNetworkLog {
  readonly initial = input.required<TcNetworkLog["types"]>();
  readonly types = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTypesChange(e: CustomEvent<{ types: TcNetworkLog["types"] }>) {
    e.preventDefault();
    this.types.set(e.detail.types);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/network-log";
  import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";

  let { initial }: { initial: TcNetworkLog["types"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let types = $derived(initial);
  let el: TcNetworkLog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      types = (e as CustomEvent<{ types: TcNetworkLog["types"] }>).detail.types;
    };
    el.addEventListener("tc-types-change", on);
    return () => el.removeEventListener("tc-types-change", on);
  });
</script>

<tc-network-log bind:this={el} {types}></tc-network-log>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-network-log")` returns a `TcNetworkLog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";`
- **React / Next.js:** Props: `import type { NetworkLogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof NetworkLog>`. The element class, for refs: `import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNetworkLog["requests"]` with `import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";`
- **Angular:** The directive types the template: `[requests]` takes `TcNetworkLog["requests"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNetworkLog } from "@adamstavely/trenchcoat/network-log";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `types` | `NetworkType[]` | The types that show, empty for all – controlled when given |
| `defaultTypes` | `NetworkType[]` | The types that show at first, when `types` isn't controlled |
| `onTypesChange` | `(types: NetworkType[]) => void` | A type chip was toggled |
| `selected` | `string \| null` | The open request's id – controlled when given |
| `defaultSelected` | `string \| null` | The open request at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, request?: NetworkRequest) => void` | A request was opened or its details closed |

*Renamed or hidden on the wrapper: `heading`, `types`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The type chips, the list and the details' tabs are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in the chips | Move between type chips |
| Enter / Space on a chip | Shows or hides that type; All shows every type |
| ↑ / ↓ | Move between requests |
| Home / End | Go to the first or last request |
| Enter / Space | Opens a request's details |
| Esc | Closes the details |
| ← / → in the tabs | Switch between Headers and Response |

### Screen readers

The list is a `grid` named by the heading, with column headers. Each request is a `row` with `aria-selected`, and the
open one has `aria-controls` pointing at its details, a region named after the request. The details' tabs are a
`tablist`. The type chips are toggle buttons with `aria-pressed`, in a group named "Request types". The waterfall bars
are hidden from screen readers, since the time column says the same. A `role="status"` says how many requests are shown.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, json-viewer | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, json-viewer, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | json-viewer | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | json-viewer, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, json-viewer, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | json-viewer | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, json-viewer, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself, json-viewer | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.1 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [json-viewer](json-viewer.md) · Element it renders | 47.6 KB | – |
| **Added to a page that already has Lit** | **78.6 KB** | **22.0 KB** |
| With Lit – the first component on a page | 100.0 KB | 28.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 176 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of requests replaced |
| First on the page | 9.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.2 ms | requests: first render, 1,188 nodes; update 2.3 ms |
| 1,000 items | 55 ms | requests: first render, 11,088 nodes; update 21 ms |

1,000 items of requests: 55 ms. It renders every item, so a first render passes 50 ms (a long task) at about 910 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (json-viewer).
- Timers: `setTimeout` (json-viewer).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give `start` in ms from the page's start and `duration` in ms; the waterfall spans from 0 to the last request's end.
- Use `status: 0` for a request that failed or never answered.
- Pass a parsed object as `body` for JSON responses, and a string for anything else.
- Give each request a stable `id`; the selection is kept by id.

## Do and don't

### Do

- Keep requests in the order they started.
- Leave `size` out when it isn't known; the cell shows a dash.

### Don't

- Don't pass request bodies with secrets or personal data the reader shouldn't see. Everything in `body` and the headers
  is shown.
- Don't listen for the JSON Viewer's own events here by name without checking the target: its `tc-copy`,
  `tc-download` and `tc-filter-change` bubble through the log.

## Related

- [Console Panel](console-panel.md) – A web page's browser console: level chips with counts, a text filter, repeat badges, sources, and stacks that fold open.
- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
