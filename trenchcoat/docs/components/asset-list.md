<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Asset List

**People & profiles** · New

The assets on record for a person, an account or a company, in groups – each with its kind, name, an identifier masked to its last four characters until shown, a detail line, what it's linked to and a status in words, with Open per row

- **Element:** `<tc-asset-list>`
- **Size:** 8.2 KB gzip · 25.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/asset-list";` |
| React / Next.js | `import { AssetList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/asset-list";` · tags starting with tc- are custom elements |
| Angular | `import { AssetList } from "@adamstavely/trenchcoat/angular/asset-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/asset-list";` |

## Example

The live example is in the gallery at `#/asset-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The assets on record for a person, an account or a company, in the page's own groups – Vehicles, Devices, Property.
Each row shows:
- an icon for its kind – car, motorcycle, phone, laptop, drive or other;
- its name or model;
- an identifier – a plate, an IMEI, a serial – masked to its last four characters until someone shows it;
- a detail line and what it's linked to, such as “Registered to customer”;
- a status pill – Confirmed, Suspected, Seized, In analysis, Retired, or statuses of your own;
- an Open button.

Each group's header counts its assets, and the heading counts them all. Showing an identifier is one row at a time and
fires a cancelable event, so a page can ask for a reason or log it first.

### When to use

- The vehicles and devices behind an account in a fraud or compliance review.
- A company's register of equipment issued to a person, and what's been returned.
- Any short, grouped set of things where each one's identifier and status matter.

### When not to use

- Identity and record documents – use [Document List](document-list.md).
- Ways to reach a person – use [Contact Channels](contact-channels.md).
- Hundreds of assets to sort and filter – use [Data Table](data-table.md).
- A queue of items waiting for someone to check them – use [Verification Queue](verification-queue.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Group** `.ui-asl__group-head` – the group's name and how many assets it has
2. **Row** `.ui-asl__row` – one asset
3. **Kind** `.ui-asl__icon` – an icon for what it is
4. **Identifier** `.ui-asl__id` – the plate, IMEI or serial, masked to its last four characters until shown
5. **Detail** `.ui-asl__detail` – one quiet line: colour and year, condition
6. **Link** `.ui-asl__link` – what it's linked to
7. **Status** `.ui-asl__pill` – the status as a tint, a mark and a word
8. **Show identifier** `.ui-asl__reveal` – shows or masks the identifier again
9. **Open** `.ui-asl__open` – opens the asset

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The pills, masking and buttons are the same in both.

## Usage

### HTML

```html
<tc-asset-list id="assets" heading="Assets"></tc-asset-list>

<script type="module">
  import "@adamstavely/trenchcoat/asset-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const assets = document.querySelector("#assets");
  assets.groups = [
    { id: "vehicles", label: "Vehicles", assets: [{ id: "v1", kind: "car", name: "Audi A6 Avant", identifier: "AB-441-KX", identifierLabel: "Plate", status: "confirmed" }] },
    { id: "devices", label: "Devices", assets: [{ id: "d1", kind: "laptop", name: "MacBook Pro 14", identifier: "C02FK3QXMD6T", identifierLabel: "Serial", status: "seized" }] },
  ];
  assets.addEventListener("tc-revealed-change", (e) => console.log("revealed", e.detail.id));
  assets.addEventListener("tc-open", (e) => console.log("open", e.detail.asset.id));
</script>
```

### React / Next.js

```tsx
import { AssetList, type AssetGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: AssetGroup[] = [
  { id: "vehicles", label: "Vehicles", assets: [{ id: "v1", kind: "car", name: "Audi A6 Avant", identifier: "AB-441-KX", identifierLabel: "Plate", status: "confirmed" }] },
  { id: "devices", label: "Devices", assets: [{ id: "d1", kind: "phone", name: "iPhone 15 Pro", identifier: "356938035643809", identifierLabel: "IMEI", status: "in-analysis" }] },
];

export function Assets() {
  return <AssetList title="Assets" groups={groups} onOpen={(asset, group) => console.log(group, asset.id)} onRevealedChange={(ids) => console.log(ids)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/asset-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";

defineProps<{ groups: TcAssetList["groups"]; statuses: TcAssetList["statuses"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-asset-list :groups="groups" :statuses="statuses" @tc-open="onOpen"></tc-asset-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AssetList } from "@adamstavely/trenchcoat/angular/asset-list";
import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";

@Component({
  selector: "app-asset-list-example",
  imports: [AssetList],
  template: `<tc-asset-list [groups]="groups()" [statuses]="statuses()" (tc-open)="onOpen($event)"></tc-asset-list>`,
})
export class AssetListExample {
  readonly groups = input.required<TcAssetList["groups"]>();
  readonly statuses = input.required<TcAssetList["statuses"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/asset-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";

  let { groups, statuses }: { groups: TcAssetList["groups"]; statuses: TcAssetList["statuses"] } = $props();
  let el: TcAssetList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-asset-list bind:this={el} {groups} {statuses}></tc-asset-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Assets"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `groups` | – | `AssetGroup[]` | `[]` | The groups and their assets, in order; an empty group is left out |
| `statuses` | – | `Record<string, { label: string; tone: AssetTone }>` | `{}` | Statuses' names and tones, merged over the defaults (confirmed, suspected, seized, in-analysis, retired) |
| `masked` | `masked` | `boolean` | `true` | Masks identifiers to their last four characters until revealed; set false to show them in full |
| `revealed` | – | `string[]` | `[]` | The ids whose identifiers are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() |
| `openLabel` | `open-label` | `string` | `"Open"` | The label of each row's open button |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | Open was pressed on a row ({ asset, group }: AssetOpen) |
| `tc-revealed-change` | – | Yes | An identifier was shown or masked again ({ revealed, id, shown }: AssetRevealedChange); cancelable – prevented, it stays as it was |

#### Design tokens it reads (68)

`--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultAssetStatuses: Record<string, { label: string; tone: AssetTone }>` | The statuses' names and tones used when the page gives none |

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-asset-list :groups="…">` | `<tc-asset-list [groups]="…">` | `<tc-asset-list {groups}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-asset-list :statuses="…">` | `<tc-asset-list [statuses]="…">` | `<tc-asset-list {statuses}>` |
| `revealed` | `el.revealed = …;` | `<… revealed={…} />` | `<tc-asset-list :revealed="…">` | `<tc-asset-list [revealed]="…">` | `<tc-asset-list {revealed}>` |

*Also attributes: `heading`, `description`, `masked`, `open-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-revealed-change` | Yes | `el.addEventListener("tc-revealed-change", (e) => …)` | `ref.current.addEventListener("tc-revealed-change", …)` | `@tc-revealed-change="…"` | `(tc-revealed-change)="…($event)"` | `el.addEventListener("tc-revealed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `revealed` itself unless a listener calls `preventDefault()` on `tc-revealed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-asset-list id="asset-list"></tc-asset-list>

<script type="module">
  import "@adamstavely/trenchcoat/asset-list";

  const el = document.querySelector("#asset-list");
  el.addEventListener("tc-revealed-change", (e) => {
    e.preventDefault(); // the element keeps its revealed…
    if (allowed(e.detail.revealed)) el.revealed = e.detail.revealed; // …until the app sets it
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
import "@adamstavely/trenchcoat/asset-list";
import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";

const props = defineProps<{ initial: TcAssetList["revealed"] }>();
const revealed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRevealedChange = (e: CustomEvent<{ revealed: TcAssetList["revealed"] }>) => {
  e.preventDefault();
  revealed.value = e.detail.revealed;
};
</script>

<template>
  <tc-asset-list :revealed="revealed" @tc-revealed-change="onRevealedChange"></tc-asset-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AssetList } from "@adamstavely/trenchcoat/angular/asset-list";
import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";

@Component({
  selector: "app-controlled-asset-list",
  imports: [AssetList],
  template: `<tc-asset-list [revealed]="revealed()" (tc-revealed-change)="onRevealedChange($event)"></tc-asset-list>`,
})
export class ControlledAssetList {
  readonly initial = input.required<TcAssetList["revealed"]>();
  readonly revealed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRevealedChange(e: CustomEvent<{ revealed: TcAssetList["revealed"] }>) {
    e.preventDefault();
    this.revealed.set(e.detail.revealed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/asset-list";
  import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";

  let { initial }: { initial: TcAssetList["revealed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let revealed = $derived(initial);
  let el: TcAssetList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      revealed = (e as CustomEvent<{ revealed: TcAssetList["revealed"] }>).detail.revealed;
    };
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-asset-list bind:this={el} {revealed}></tc-asset-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-asset-list")` returns a `TcAssetList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";`
- **React / Next.js:** Props: `import type { AssetListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AssetList>`. The element class, for refs: `import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAssetList["groups"]` with `import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";`
- **Angular:** The directive types the template: `[groups]` takes `TcAssetList["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAssetList } from "@adamstavely/trenchcoat/asset-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `revealed` | `string[]` | The ids whose identifiers are shown – controlled when given |
| `defaultRevealed` | `string[]` | The ids shown on mount when `revealed` isn't controlled |
| `onRevealedChange` | `(revealed: string[]) => void` | An identifier was shown or masked again; `revealed` is the new list |
| `onOpen` | `(asset: Asset, group: string) => void` | Open was pressed on a row; `group` is its group's id |

*Renamed or hidden on the wrapper: `heading`, `revealed`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop across every group; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row, across groups |
| ← / → | Moves between a row's Show identifier and Open buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the identifier; opens the asset |
| Tab | Leaves the list |

### Screen readers

Each group is a section named by its header, which reads its count, “Vehicles, 2 assets”, and holds a list described
by “Up and down arrows move between assets, left and right between an asset's buttons”. A masked identifier reads its
kind and last characters, “Plate ending 1-KX, hidden”; a shown one reads in full. Show identifier is a toggle button
(`aria-pressed`) labelled with the asset, “Show plate, Audi A6”. Open is labelled “Open Audi A6”. Status pills read
their word; the marks and kind icons are hidden. Showing or masking is confirmed in a polite status message, “Audi A6
plate shown”.

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.3 KB | 6.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.7 KB** | **8.3 KB** |
| With Lit – the first component on a page | 47.5 KB | 15.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 217 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of groups replaced |
| First on the page | 8.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 35 ms | groups: first render, 10,066 nodes; update 4.8 ms |
| 1,000 items | 361 ms | groups: first render, 100,516 nodes; update 33 ms |

1,000 items of groups: 361 ms. It renders every item, so a first render passes 50 ms (a long task) at about 140 items – page or filter longer lists.

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

- Name assets the way people recognise them: make and model, “iPhone 15 Pro”, not an inventory code.
- Set `identifierLabel` to what the identifier is – “Plate”, “IMEI”, “Serial” – so a masked value still makes sense.
- Write `link` as the relationship, not the record id: “Registered to customer”, “Reg. Aurelia Estates SL”.
- Rename or add statuses with `statuses`: `{ lost: { label: "Reported lost", tone: "danger" } }`.

## Do and don't

### Do

- Keep `masked` on wherever identifiers are personal data, and log reveals from `tc-revealed-change`.
- Group by what people look for first – vehicles, then devices – and keep each group short.
- Use Suspected for anything not yet confirmed against a record.

### Don't

- Don't put a full identifier in `detail` or `link`; that defeats the masking.
- Don't use tones for anything but the asset's status.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Related

- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
- [Contact Channels](contact-channels.md) – The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address – each masked until shown, with its role, when it was last used, how far it's verified, Copy and the page's own actions
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
