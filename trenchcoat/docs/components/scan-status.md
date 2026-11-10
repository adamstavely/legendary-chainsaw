<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Scan Status

**Trust & calibration** · New

Where a file stands in malware scanning – queued, scanning, clean, suspicious, quarantined or failed, inline or as a card, with Rescan and Request review

- **Element:** `<tc-scan-status>`
- **Size:** 7.8 KB gzip · 22.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/scan-status";` |
| React / Next.js | `import "@adamstavely/trenchcoat/scan-status";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/scan-status";` · tags starting with tc- are custom elements |
| Angular | `import { ScanStatus } from "@adamstavely/trenchcoat/angular/scan-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/scan-status";` |

## Example

The live example is in the gallery at `#/scan-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a file stands in malware scanning: queued, scanning, clean, suspicious, quarantined or failed, each with a mark and a
word. Inline for a row in a list, or a card with what scanned it and when.

### When to use

- A list of uploads or attachments.
- A file's details, with `layout="card"`.

### When not to use

- Only the blocked state, as a full picture – use [Malware Blocked](../illustrations/malware-blocked.md).
- A long-running job in general – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Badge** `.ui-scn__badge` – `.ui-scn__mark` and `.ui-scn__word`
2. **Progress** `.ui-scn__track` – while scanning, with `.ui-scn__percent`
3. **Picture** `.ui-scn__picture` – Malware Blocked, in the card when quarantined
5. **Action** `.ui-scn__action` – Rescan when failed, Request review when quarantined

## Looks

Inline has no surface of its own. As a card, Standard puts the header on the gray tray above a white card, and Clean is one
white card. A page can set `--tc-scn-picture` and `--tc-scn-track`.

## Usage

### HTML

```html
<tc-scan-status file-name="invoice.zip" state="scanning" progress="0.4"></tc-scan-status>

<script type="module">
  import "@adamstavely/trenchcoat/scan-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { ScanStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Upload() {
  return <ScanStatus layout="card" fileName="invoice.zip" state="failed" onTcAction={(e) => console.log(e.detail.action)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/scan-status";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";

defineProps<{ labels: TcScanStatus["labels"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-scan-status :labels="labels" @tc-action="onAction"></tc-scan-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ScanStatus } from "@adamstavely/trenchcoat/angular/scan-status";
import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";

@Component({
  selector: "app-scan-status-example",
  imports: [ScanStatus],
  template: `<tc-scan-status [labels]="labels()" (tc-action)="onAction($event)"></tc-scan-status>`,
})
export class ScanStatusExample {
  readonly labels = input.required<TcScanStatus["labels"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/scan-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";

  let { labels }: { labels: TcScanStatus["labels"] } = $props();
  let el: TcScanStatus;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-scan-status bind:this={el} {labels}></tc-scan-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `state` | `state` | `ScanState` | `"queued"` | Where the scan stands: queued, scanning, clean, suspicious, quarantined or failed |
| `fileName` | `file-name` | `string` | `""` | The file's name |
| `engine` | `engine` | `string \| undefined` | `undefined` | What scanned it |
| `scannedAt` | `scanned-at` | `number \| undefined` | `undefined` | When it was scanned, epoch ms |
| `detail` | `detail` | `string \| undefined` | `undefined` | More about it: what was found, or why it failed |
| `progress` | `progress` | `number \| undefined` | `undefined` | How far the scan is, 0 to 1 |
| `layout` | `layout` | `ScanLayout` | `"inline"` | "inline", for a row, or "card" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<ScanStatusLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | Yes | Rescan or Request review was pressed ({ action, state }: ScanActionDetail); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-scn-picture` | `220px` | both |
| `--tc-scn-track` | `72px` | both |
| `--tc-icon-size-md` | `16px` | not set – this fallback applies |

#### Design tokens it reads (24)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-reveal`, `--tc-fill-hover`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-scan-status :labels="…">` | `<tc-scan-status [labels]="…">` | `<tc-scan-status {labels}>` |

*Also attributes: `state`, `file-name`, `engine`, `scanned-at`, `detail`, `progress`, `layout`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `ref.current.addEventListener("tc-action", …)` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-action` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-scan-status")` returns a `TcScanStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";`
- **React / Next.js:** The element class: `import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcScanStatus["labels"]` with `import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";`
- **Angular:** The directive types the template: `[labels]` takes `TcScanStatus["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcScanStatus } from "@adamstavely/trenchcoat/scan-status";`

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the action, when there is one |
| Enter / Space | Presses it |

### Screen readers

State is always a word, and the mark is hidden. `role="status"` announces changes, not the first state. The action names the
file, and progress is a `progressbar`.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | malware-blocked, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | malware-blocked | – |
| inset | 87 | 66 | 14.1 | 14.1 | malware-blocked | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, malware-blocked, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-05 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 10.3 KB | 4.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| [malware-blocked](../illustrations/malware-blocked.md) · Element it renders | 4.3 KB | – |
| **Added to a page that already has Lit** | **22.7 KB** | **7.8 KB** |
| With Lit – the first component on a page | 42.2 KB | 14.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.2 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 9.8 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Say what was found in `detail`, in plain words. Say suspicious or potential unless it's confirmed.

## Do and don't

### Do

- Withhold previews and downloads on the server until a file is clean.
- Handle `tc-action` to start a rescan or a review. The element doesn't change state itself.

### Don't

- Don't treat clean as a guarantee. Say no threats were found, which is the default wording.

## Related

- [Malware Blocked](../illustrations/malware-blocked.md) – A file behind a warning shield with a bug on it, with the words Potential malware, for a file that can't be shown
- [File Details](../blocks/file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Content Shield](content-shield.md) – Keeps content unloaded until someone chooses to see it – a picture, the reason and Show, with the content cloned in only on reveal and removed again on Hide
