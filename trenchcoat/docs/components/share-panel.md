<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Share Panel

**Inputs & controls** · New

Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.

- **Element:** `<tc-share-panel>`
- **Size:** 13.2 KB gzip · 43.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/share-panel";` |
| React / Next.js | `import { SharePanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/share-panel";` · tags starting with tc- are custom elements |
| Angular | `import { SharePanel } from "@adamstavely/trenchcoat/angular/share-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/share-panel";` |

## Example

The live example is in the gallery at `#/share-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Shares something with people and groups, at a level of access for each, after checking that each one is entitled to see
it. Anyone who isn't is marked on their row, the person sharing is told at the top of the panel, and they're left out of
the share.

### When to use

- Sharing data that some people may not be allowed to see, such as restricted or regulated records.
- Showing who already has access, and changing or removing it.

### When not to use

- Someone asking for access themselves – use [Access Request](access-request.md).
- Allowing an agent to use a tool – use [Permission Request](permission-request.md) or [Tool Permissions](tool-permissions.md).
- Data anyone may see, with no check to run – a plain share link is enough.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-shr__search` – finds people and groups, listed in `.ui-shr__results`
2. **Notice** `.ui-shr__notice` – tells the person sharing who's affected and what will happen
3. **Row** `.ui-shr__row` – a recipient, with `.ui-shr__avatar` and `.ui-shr__name`
4. **Check result** `.ui-shr__status` – checking, not authorized and why, or how many of a group can see it
5. **Level** `.ui-shr__level` – the access this recipient gets
6. **Remove** `.ui-shr__remove` – removes them, with Undo for someone who already has access
7. **Share** `.ui-shr__share` – sends what passed, once every check has finished

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-shr-avatar`.

## Usage

### HTML

```html
<tc-share-panel id="share" resource-name="Trial 12 results"></tc-share-panel>

<script type="module">
  import "@adamstavely/trenchcoat/share-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#share");
  panel.directory = [{ id: "noor", kind: "person", name: "Noor Haddad" }];
  panel.checkEntitlement = async (recipient, level, signal) => {
    const url = `/api/entitlements/${encodeURIComponent(recipient.id)}?level=${encodeURIComponent(level)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error("The check failed");
    return res.json();
  };
  panel.addEventListener("tc-share", (e) => console.log(e.detail.add, e.detail.excluded));
</script>
```

### React / Next.js

```tsx
import { SharePanel, type ShareEntitlementCheck, type ShareRecipient } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const directory: ShareRecipient[] = [{ id: "noor", kind: "person", name: "Noor Haddad" }];
const check: ShareEntitlementCheck = async (recipient, level, signal) => {
  const url = `/api/entitlements/${encodeURIComponent(recipient.id)}?level=${encodeURIComponent(level)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("The check failed");
  return res.json();
};

export function ShareResults() {
  return <SharePanel resourceName="Trial 12 results" directory={directory} checkEntitlement={check} onShare={(d) => console.log(d.add, d.excluded)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/share-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";

defineProps<{ directory: TcSharePanel["directory"]; search: TcSharePanel["search"] }>();
const onShare = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-share-panel :directory="directory" :search="search" @tc-share="onShare"></tc-share-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SharePanel } from "@adamstavely/trenchcoat/angular/share-panel";
import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";

@Component({
  selector: "app-share-panel-example",
  imports: [SharePanel],
  template: `<tc-share-panel [directory]="directory()" [search]="search()" (tc-share)="onShare($event)"></tc-share-panel>`,
})
export class SharePanelExample {
  readonly directory = input.required<TcSharePanel["directory"]>();
  readonly search = input.required<TcSharePanel["search"]>();
  onShare(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/share-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";

  let { directory, search }: { directory: TcSharePanel["directory"]; search: TcSharePanel["search"] } = $props();
  let el: TcSharePanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-share", on);
    return () => el.removeEventListener("tc-share", on);
  });
</script>

<tc-share-panel bind:this={el} {directory} {search}></tc-share-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Share", or "Share {resource-name}" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading, such as the data's classification |
| `resourceName` | `resource-name` | `string` | `""` | What's being shared |
| `directory` | – | `ShareRecipient[]` | `[]` | The people and groups to choose from, filtered as you type. Ignored when `search` is set |
| `search` | – | `ShareSearch \| undefined` | `undefined` | Looks people and groups up on the server |
| `access` | – | `ShareGrant[]` | `[]` | Who has access now. Updated on Share unless a tc-share listener calls preventDefault() |
| `levels` | – | `ShareLevel[]` | `[ { id: "view", label: "Can view" }, { id: "comment", label: "Can comment" }, { id: "edit", label: "Can edit" }, ]` | The levels of access, least first |
| `defaultLevel` | `default-level` | `string` | `""` | The level someone starts at; by default the first |
| `checkEntitlement` | – | `ShareEntitlementCheck \| undefined` | `undefined` | Asks whether a recipient may see the data at a level. Without it nobody can be added |
| `sending` | `sending` | `boolean` | `false` | The page is sending the share: controls are locked |
| `labels` | – | `Partial<SharePanelLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-share` | – | Yes | Share was pressed ({ access, add, change, remove, excluded, partial }: ShareSubmit); cancelable – prevented, `access` stays as it was and the rows stay pending |
| `tc-share-denied` | – | No | A check found someone isn't entitled ({ recipient, level, entitlement }: ShareDenied) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-shr-avatar` | `32px` | both |
| `--tc-icon-size-md` | `16px` | not set – this fallback applies |

#### Design tokens it reads (53)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-reveal`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultShareLevels: ShareLevel[]` | The levels when `levels` isn't set, least access first |

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
| `directory` | `el.directory = …;` | `<… directory={…} />` | `<tc-share-panel :directory="…">` | `<tc-share-panel [directory]="…">` | `<tc-share-panel {directory}>` |
| `search` | `el.search = …;` | `<… search={…} />` | `<tc-share-panel :search="…">` | `<tc-share-panel [search]="…">` | `<tc-share-panel {search}>` |
| `access` | `el.access = …;` | `<… access={…} />` | `<tc-share-panel :access="…">` | `<tc-share-panel [access]="…">` | `<tc-share-panel {access}>` |
| `levels` | `el.levels = …;` | `<… levels={…} />` | `<tc-share-panel :levels="…">` | `<tc-share-panel [levels]="…">` | `<tc-share-panel {levels}>` |
| `checkEntitlement` | `el.checkEntitlement = …;` | `<… checkEntitlement={…} />` | `<tc-share-panel :checkEntitlement="…">` | `<tc-share-panel [checkEntitlement]="…">` | `<tc-share-panel {checkEntitlement}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-share-panel :labels="…">` | `<tc-share-panel [labels]="…">` | `<tc-share-panel {labels}>` |

*Also attributes: `heading`, `description`, `resource-name`, `default-level`, `sending` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-share` | Yes | `el.addEventListener("tc-share", (e) => …)` | `onShare={…}` | `@tc-share="…"` | `(tc-share)="…($event)"` | `el.addEventListener("tc-share", …)` |
| `tc-share-denied` | No | `el.addEventListener("tc-share-denied", (e) => …)` | `onTcShareDenied={…}` | `@tc-share-denied="…"` | `(tc-share-denied)="…($event)"` | `el.addEventListener("tc-share-denied", …)` |

### Controlled

The element changes `access` itself unless a listener calls `preventDefault()` on `tc-share` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-share-panel id="share-panel"></tc-share-panel>

<script type="module">
  import "@adamstavely/trenchcoat/share-panel";

  const el = document.querySelector("#share-panel");
  el.addEventListener("tc-share", (e) => {
    e.preventDefault(); // the element keeps its access…
    if (allowed(e.detail.access)) el.access = e.detail.access; // …until the app sets it
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
import "@adamstavely/trenchcoat/share-panel";
import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";

const props = defineProps<{ initial: TcSharePanel["access"] }>();
const access = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onShare = (e: CustomEvent<{ access: TcSharePanel["access"] }>) => {
  e.preventDefault();
  access.value = e.detail.access;
};
</script>

<template>
  <tc-share-panel :access="access" @tc-share="onShare"></tc-share-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SharePanel } from "@adamstavely/trenchcoat/angular/share-panel";
import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";

@Component({
  selector: "app-controlled-share-panel",
  imports: [SharePanel],
  template: `<tc-share-panel [access]="access()" (tc-share)="onShare($event)"></tc-share-panel>`,
})
export class ControlledSharePanel {
  readonly initial = input.required<TcSharePanel["access"]>();
  readonly access = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onShare(e: CustomEvent<{ access: TcSharePanel["access"] }>) {
    e.preventDefault();
    this.access.set(e.detail.access);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/share-panel";
  import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";

  let { initial }: { initial: TcSharePanel["access"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let access = $derived(initial);
  let el: TcSharePanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      access = (e as CustomEvent<{ access: TcSharePanel["access"] }>).detail.access;
    };
    el.addEventListener("tc-share", on);
    return () => el.removeEventListener("tc-share", on);
  });
</script>

<tc-share-panel bind:this={el} {access}></tc-share-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-share-panel")` returns a `TcSharePanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";`
- **React / Next.js:** Props: `import type { SharePanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SharePanel>`. The element class, for refs: `import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSharePanel["directory"]` with `import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";`
- **Angular:** The directive types the template: `[directory]` takes `TcSharePanel["directory"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSharePanel } from "@adamstavely/trenchcoat/share-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Share", or "Share {resourceName}" |
| `access` | `ShareGrant[]` | Who has access now – controlled when given |
| `defaultAccess` | `ShareGrant[]` | Who has access on mount when `access` isn't controlled |
| `onShare` | `(detail: ShareSubmit) => void` | Share was pressed; `detail` says who was added, changed, removed and left out |

*Renamed or hidden on the wrapper: `heading`, `access`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ ↑ in search | Move through the results |
| Enter in search | Adds the highlighted result |
| Escape in search | Closes the results |
| Tab | Moves through each row's level and Remove, then Share |

### Screen readers

Search is a `combobox` with a `listbox` of results. Each level is named with the recipient and described by that row's
check result. `role="status"` announces who isn't authorized, and how the share went. Results are worded as well as
coloured, with an icon.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.8 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **43.5 KB** | **13.3 KB** |
| With Lit – the first component on a page | 65.8 KB | 20.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 53 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of directory replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.0 ms | directory: first render, 53 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | directory: first render, 53 nodes; update 0.1 ms |

What it renders doesn't grow with directory (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **19 timer callbacks/s** on screen, **nothing** scrolled away, **1 timer callbacks/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

How each answer from `checkEntitlement` is handled:

| Answer | What happens |
|---|---|
| `{ status: "allowed" }` | Included in the share |
| `{ status: "denied", reason }` | Left out; the row and notice say so. A person with existing access stays, and is flagged as no longer authorized |
| `{ status: "partial", allowed, total, reason }` | A group is included, and the row says how many members can see it. `allowed: 0` counts as denied |
| Throws, or anything else | Counts as not authorized until Try again succeeds |

Without `checkEntitlement`, nobody can be added. The check runs again whenever the level changes, because someone may be
entitled to view but not to edit.

A `reason` is shown to the person sharing. Say what's missing, such as "Needs the Restricted data agreement", without
revealing anything the sharer shouldn't learn about that person.

## Do and don't

### Do

- Enforce entitlements on the server when the share arrives, and when the data is read. This panel only tells the person
  sharing what to expect.
- Use `excluded` and `partial` from `tc-share` for your audit trail.
- Honour the `signal` passed to `checkEntitlement`, so abandoned checks stop.
- Set `sending` while the request is on its way, and call `preventDefault()` on `tc-share` to keep `access` until it's
  accepted.

### Don't

- Don't treat a passing check as permission. Entitlements change, and anything in the browser can be altered.
- Don't return `allowed` when your service can't answer. Throw, so the panel fails closed.

## Related

- [Access Request](access-request.md) – Ask for access to one piece of data – the resource with its owner and classification in words, the level, how long, a required justification and the fields needed – then where it stands: pending with who decides, approved with the time left, denied with the reason, or expired
- [Team Flag Editor](team-flag-editor.md) – Where a team decides what its flags mean – each flag's colour, name, meaning and order, with a check on names and a question before removing a flag that's on files.
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed

## Changelog

- **Share Panel** (`tc-share-panel`) – shares with people and groups at a level for each, after checking each one's entitlement. Anyone not authorized is flagged, the person sharing is told, and they're left out; a failed check counts as not authorized.
