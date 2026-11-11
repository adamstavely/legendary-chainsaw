<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Fingerprint Card

**People & profiles** · New

A ten-print card – each finger's print and status in ANSI/NIST positions, captured with its NFIQ quality, poor, not captured, unable to print or bandaged, and a finger's detail

- **Element:** `<tc-fingerprint-card>`
- **Size:** 10.0 KB gzip · 31.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/fingerprint-card";` |
| React / Next.js | `import { FingerprintCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/fingerprint-card";` · tags starting with tc- are custom elements |
| Angular | `import { FingerprintCard } from "@adamstavely/trenchcoat/angular/fingerprint-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/fingerprint-card";` |

## Example

The live example is in the gallery at `#/fingerprint-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A ten-print card: every finger's print and where it stands. Each hand is a row of five tiles, thumb to little finger,
numbered in the ANSI/NIST finger positions – 1 to 5 the right hand, 6 to 10 the left. A tile shows the print, either
the page's image or a stylised whorl, loop or arch the element draws, and its status: captured with its NFIQ quality,
poor quality, not captured, unable to print, or bandaged. Each status has its own mark and words, so none relies on
colour. The header counts the prints on file, a legend counts the fingers that need attention, and a finger's detail –
quality, pattern, when and on what it was captured, and a note – opens below the card.

### When to use

- Reviewing a fingerprint enrolment before it's submitted: an access badge, a background check, a visa application.
- Showing an operator which fingers still need capturing or recapturing, and why.
- A person's profile, where the prints on file are one part of their record.

### When not to use

- Every biometric at once – face, iris, voice and the rest – use [Biometric Status](biometric-status.md).
- Which checks cover which parts – use [Coverage Matrix](coverage-matrix.md).
- Guiding someone through capture step by step – use [Setup Guide](setup-guide.md).
- A gallery of images to browse – use [Image Grid](image-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-fpc__count` – how many of the ten prints are on file, captured or at poor quality
2. **Hand** `.ui-fpc__hand` – the row's caption, “Right hand” or “Left hand”
3. **Finger** `.ui-fpc__tile` – a finger: its position number, the print, its name and status
4. **Print** `.ui-fpc__glyph` – the page's image, or the drawn pattern; dashed when not captured, struck through when it can't be printed, banded when bandaged
5. **Status** `.ui-fpc__status` – the status's mark and name, or for a captured print its NFIQ value and five quality bars
6. **Legend** `.ui-fpc__legend` – each status other than captured that's in use, with how many fingers have it
7. **Detail** `.ui-fpc__detail` – the open finger: its status, quality, pattern, capture date, device and note

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight finger names. Clean is
one white card with the header as its first row. The tiles, prints and detail are the same in both.

## Usage

### HTML

```html
<tc-fingerprint-card id="prints" description="Badge enrolment, rolled prints."></tc-fingerprint-card>

<script type="module">
  import "@adamstavely/trenchcoat/fingerprint-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#prints");
  card.prints = [
    { position: 1, status: "captured", quality: 1, pattern: "whorl" },
    { position: 2, status: "captured", quality: 2, pattern: "loop" },
    { position: 7, status: "poor", quality: 5, note: "Smudged – recapture." },
    { position: 4, status: "bandaged" },
  ];
  card.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected, e.detail.print));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FingerprintCard, type FingerPosition, type FingerPrint } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const prints: FingerPrint[] = [
  { position: 1, status: "captured", quality: 1, pattern: "whorl" },
  { position: 2, status: "captured", quality: 2, pattern: "loop" },
  { position: 7, status: "poor", quality: 5, note: "Smudged – recapture." },
  { position: 4, status: "bandaged" },
];

export function Prints() {
  const [selected, setSelected] = useState<FingerPosition | null>(null);
  return <FingerprintCard description="Badge enrolment, rolled prints." prints={prints} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/fingerprint-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";

defineProps<{ prints: TcFingerprintCard["prints"]; statusLabels: TcFingerprintCard["statusLabels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-fingerprint-card :prints="prints" :statusLabels="statusLabels" @tc-selected-change="onSelectedChange"></tc-fingerprint-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FingerprintCard } from "@adamstavely/trenchcoat/angular/fingerprint-card";
import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";

@Component({
  selector: "app-fingerprint-card-example",
  imports: [FingerprintCard],
  template: `<tc-fingerprint-card [prints]="prints()" [statusLabels]="statusLabels()" (tc-selected-change)="onSelectedChange($event)"></tc-fingerprint-card>`,
})
export class FingerprintCardExample {
  readonly prints = input.required<TcFingerprintCard["prints"]>();
  readonly statusLabels = input.required<TcFingerprintCard["statusLabels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fingerprint-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";

  let { prints, statusLabels }: { prints: TcFingerprintCard["prints"]; statusLabels: TcFingerprintCard["statusLabels"] } = $props();
  let el: TcFingerprintCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-fingerprint-card bind:this={el} {prints} {statusLabels}></tc-fingerprint-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Fingerprints"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `prints` | – | `FingerPrint[]` | `[]` | The prints by finger position; a finger not listed is not captured |
| `order` | `order` | `"right-first" \| "left-first"` | `"right-first"` | Which hand's row comes first |
| `selected` | `selected` | `FingerPosition \| null` | `null` | The finger whose detail is open. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `statusLabels` | – | `Partial<Record<FingerStatus, string>>` | `{}` | The statuses' names, merged over the defaults (Captured, Poor quality, Not captured, Unable to print, Bandaged) |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A finger's detail opened or closed ({ selected, print }: FingerprintSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (73)

`--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultFingerStatusLabels: Record<FingerStatus, string>` | The statuses' names used when the page gives none |

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
| `prints` | `el.prints = …;` | `<… prints={…} />` | `<tc-fingerprint-card :prints="…">` | `<tc-fingerprint-card [prints]="…">` | `<tc-fingerprint-card {prints}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-fingerprint-card :statusLabels="…">` | `<tc-fingerprint-card [statusLabels]="…">` | `<tc-fingerprint-card {statusLabels}>` |

*Also attributes: `heading`, `description`, `order`, `selected`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-fingerprint-card id="fingerprint-card"></tc-fingerprint-card>

<script type="module">
  import "@adamstavely/trenchcoat/fingerprint-card";

  const el = document.querySelector("#fingerprint-card");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/fingerprint-card";
import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";

const props = defineProps<{ initial: TcFingerprintCard["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcFingerprintCard["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-fingerprint-card :selected="selected" @tc-selected-change="onSelectedChange"></tc-fingerprint-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FingerprintCard } from "@adamstavely/trenchcoat/angular/fingerprint-card";
import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";

@Component({
  selector: "app-controlled-fingerprint-card",
  imports: [FingerprintCard],
  template: `<tc-fingerprint-card [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-fingerprint-card>`,
})
export class ControlledFingerprintCard {
  readonly initial = input.required<TcFingerprintCard["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcFingerprintCard["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/fingerprint-card";
  import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";

  let { initial }: { initial: TcFingerprintCard["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcFingerprintCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcFingerprintCard["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-fingerprint-card bind:this={el} {selected}></tc-fingerprint-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-fingerprint-card")` returns a `TcFingerprintCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";`
- **React / Next.js:** Props: `import type { FingerprintCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FingerprintCard>`. The element class, for refs: `import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFingerprintCard["prints"]` with `import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";`
- **Angular:** The directive types the template: `[prints]` takes `TcFingerprintCard["prints"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFingerprintCard } from "@adamstavely/trenchcoat/fingerprint-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `selected` | `FingerPosition \| null` | The finger whose detail is open – controlled when given (null for none) |
| `defaultSelected` | `FingerPosition \| null` | The finger open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: FingerPosition \| null, print?: FingerPrint) => void` | A finger's detail opened or closed; `print` is the opened finger's print |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The card is one tab stop; inside it the arrows move between fingers.

| Key | What it does |
|---|---|
| ← / → | Moves to the next finger in the row |
| ↑ / ↓ | Moves to the same finger on the other hand |
| Home / End | Moves to the row's thumb or little finger |
| Enter / Space | Opens the finger's detail, or closes it if it's open |
| Escape | Closes the open detail |
| Tab | Leaves the grid; with a detail open, the next stop is its Close button |

Close returns focus to the finger.

### Screen readers

The fingers are a `grid` named by the heading and described by “Arrow keys move between fingers; Enter opens a
finger's detail”. Each hand is a row headed “Right hand” or “Left hand”. A finger reads its name, position and status,
“Left index, position 7: Poor quality, NFIQ 5”, is `aria-selected` while its detail is open, and then controls it
(`aria-controls`). Opening is confirmed in a polite status message, “Left index: Poor quality, NFIQ 5”, and closing
with “Detail closed”. The detail is a section headed with the finger's name; its Close button is labelled “Close
detail”. The drawn prints, marks and quality bars are hidden; the words read.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.6 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.5 KB** | **10.0 KB** |
| With Lit – the first component on a page | 51.1 KB | 16.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 276 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of prints replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.9 ms | prints: first render, 276 nodes; update 0.5 ms |
| 1,000 items | 3.0 ms | prints: first render, 276 nodes; update 0.5 ms |

What it renders doesn't grow with prints (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give `quality` as the NFIQ value, 1 (excellent) to 5 (poor); the detail names it “Very good”, “Fair” and so on.
- Use `poor` for a print that's on file but should be recaptured, and say why in `note`.
- Use `unable` for a finger that can't be printed at all, and `bandaged` for one that can't be printed for now.
- Name the capture device as operators know it: “Live-scan kiosk · Lobby 2”.

## Do and don't

### Do

- Leave fingers out of `prints` until they're captured – they show as not captured.
- Pass `image` when you have the print, so reviewers see the real ridges.
- Set `order` to `left-first` when your capture form starts with the left hand.

### Don't

- Don't use the drawn patterns as evidence – they're illustrations; show the image for anything that's checked.
- Don't rename statuses so two read alike – the marks differ, but the words are what people scan.
- Don't open a detail on load unless the page was opened to look at that finger.

## Related

- [Biometric Status](biometric-status.md) – Where someone's biometric enrolment stands – face, fingerprints, iris, voice and more, each with its status, detail and quality meter, the count enrolled and an optional match score
- [Coverage Matrix](coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image

## Changelog

- **`tc-fingerprint-card`:** a ten-print card in ANSI/NIST finger positions. - **Each finger:** a drawn print and its status: captured with NFIQ quality, poor, not captured, unable to print, or bandaged. - **Interaction:** arrow keys move across both hands, and a finger's detail opens below the card.
