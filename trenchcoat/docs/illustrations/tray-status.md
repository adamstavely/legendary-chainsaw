<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Tray Status

**Illustrations** · New

A tray scene for where things stand – all done, nothing here yet, no matches, drop files to upload, new items (with a count), importing, import complete, imported with errors, export ready, sync complete, paused, upload failed or storage full – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own

- **Element:** `<tc-tray-status>`
- **Size:** 7.6 KB gzip · 28.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/tray-status";` |
| React / Next.js | `import "@adamstavely/trenchcoat/tray-status";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/tray-status";` · tags starting with tc- are custom elements |
| Angular | `import { TrayStatus } from "@adamstavely/trenchcoat/angular/tray-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/tray-status";` |

## Example

The live example is in the gallery at `#/illustrations/tray-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A tray scene that says where something stands, in the soft style of the state illustrations: a rounded tray with its rim, one pastel badge with a darker edge and ink, a soft glow beneath, and its words as real text under the drawing. `status` picks the scene:

| `status` | Scene | Colour | Motion | Default words |
|---|---|---|---|---|
| `all-done` | An empty tray with a check above it | Green | The check draws itself and the badge settles a few times | You're all caught up |
| `upload-failed` | A file lifted above an open tray, its upload arrow stopping short, with a cross badge | Red | The file rises a little and drops back a few times | Upload failed |
| `empty` | An empty tray, no check | Slate | The tray settles a few times | Nothing here yet |
| `import-complete` | A few pages settled in the tray, with a check | Green | The pages drop in once and the check draws itself | Import complete |
| `export-ready` | A page rising out of the tray, with a download mark | Blue | The page rises a little a few times | Export ready |
| `storage-full` | Pages overflowing the tray's rim, with a "!" | Amber | The top page wobbles a few times | Storage full |
| `drop-to-upload` | An open tray with a dashed page hovering above it and an up arrow | Blue | The dashed page bobs a few times | Drop files to upload |
| `new-items` | A tray with `count` on its badge ("99+" past 99) | Blue | The badge settles a few times | 3 new (follows `count`) |
| `paused` | A tray with a pause mark | Slate | The badge settles twice | Paused |
| `sync-complete` | A tray with circular arrows and a check | Green | The arrows turn once and the check draws itself | Sync complete |
| `importing` | Pages falling into the tray one after another, a progress ring on the badge | Blue | The pages fall in and the ring turns, a few times | Importing |
| `import-errors` | Pages in the tray with a "!" | Amber | The pages drop in once | Imported with errors |
| `no-matches` | An empty tray with a funnel on the badge | Slate | The badge settles a few times | No matches |

The words follow the status – and for `new-items` the `count` – unless `caption` sets its own. It replaces `<tc-all-done>` and `<tc-upload-failed>`: `status="all-done"` and `status="upload-failed"` draw their scenes exactly as they were.

### When to use

- An inbox, queue or to-do list with nothing waiting (`all-done`) – a finish, not a failure: the person cleared it.
- A list that's never had anything in it yet – a first visit (`empty`), beside how to add the first item.
- An empty dropzone (`drop-to-upload`), with the file picker beside it.
- An import that finished (`import-complete`), with what was imported.
- An export that's ready to download (`export-ready`) – it pairs with Export Dialog's ready state – beside the download link.
- An upload that didn't finish: too large, the wrong type, or the connection dropped (`upload-failed`), beside the reason and a way to try again.
- A workspace or account out of space (`storage-full`), with how to free some or get more.
- New items waiting since the person last looked (`new-items`), with `count` saying how many – the words follow it ("12 new").
- A queue, intake or sync that's been paused on purpose (`paused`), with who paused it and Resume.
- A sync with another system that finished (`sync-complete`), with when it last ran.
- An import that's running (`importing`) – the in-progress partner of `import-complete` – with how far it's got.
- An import that finished but left rows to fix (`import-errors`), leading into `import-review`.
- Filters that hide everything (`no-matches`), with a way to clear them – unlike `empty`, where nothing exists yet.

### When not to use

- A search or filter with no matches – use [Page State](page-state.md) with `status="nothing-found"`.
- A page or request that couldn't load – use [Page State](page-state.md) with `status="something-wrong"`.
- Where a document stands in a workflow – use the document-status illustrations.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Mark** `.ui-trs-badge` – the round badge, with a check, a cross, a download or up arrow, a "!", a count (`.ui-trs-count`), a pause mark, turning arrows, a progress ring or a funnel in ink (`empty` has none)
3. **Words** `.ui-trs-caption` – what's happened; the default follows the status

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or the system setting, and each status has its own badge colour. It has no background of its own, so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-tray-status status="upload-failed"></tc-tray-status>

<script type="module">
  import "@adamstavely/trenchcoat/tray-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { TrayStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function QueueState({ empty }: { empty: boolean }) {
  return empty ? <TrayStatus status="all-done" /> : null;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/tray-status";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-tray-status></tc-tray-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { TrayStatus } from "@adamstavely/trenchcoat/angular/tray-status";

@Component({
  selector: "app-tray-status-example",
  imports: [TrayStatus],
  template: `<tc-tray-status></tc-tray-status>`,
})
export class TrayStatusExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/tray-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTrayStatus } from "@adamstavely/trenchcoat/tray-status";

  let el: TcTrayStatus;
</script>

<tc-tray-status bind:this={el}></tc-tray-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `status` | `TrayStatusKind` | `"all-done"` | The scene: "all-done", "empty", "drop-to-upload", "new-items", "import-complete", "export-ready", "sync-complete", "paused", "importing", "import-errors", "no-matches", "upload-failed" or "storage-full" |
| `count` | `count` | `number` | `3` | How many new items "new-items" shows, in its badge and its words (default 3) |
| `caption` | `caption` | `string \| undefined` | `undefined` | The words under the drawing; unset, the status's own words; "" leaves them out |
| `label` | `label` | `string` | `""` | Accessible description, when it should say more than the words |

#### Design tokens it reads (4)

`--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `trayStatusWords: Record<TrayStatusKind, string>` | The words for each status, when `caption` isn't set |
| `trayCount(n: number): void` | A count as the badge shows it: 1 to 99, then "99+" |
| `trayCss(o: { ui: string; name: string; statuses: TrayStatusKind[] }): void` | The CSS for a tray element: `statuses` lists the scenes it can draw. With one, its colours and motion apply outright; with several, each status's colours and motion apply under its own [status]. `name` names the custom properties (`--tc-<name>-mark` …); `ui` is the class prefix. |

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `status`, `count`, `caption`, `label` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-tray-status")` returns a `TcTrayStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTrayStatus } from "@adamstavely/trenchcoat/tray-status";`
- **React / Next.js:** The element class: `import type { TcTrayStatus } from "@adamstavely/trenchcoat/tray-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTrayStatus["status"]` with `import type { TcTrayStatus } from "@adamstavely/trenchcoat/tray-status";`
- **Angular:** The directive types the template: `[status]` takes `TcTrayStatus["status"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTrayStatus } from "@adamstavely/trenchcoat/tray-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTrayStatus } from "@adamstavely/trenchcoat/tray-status";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

The host is `role="img"`, named by `label` or else by its words, so what's happened is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 21.7 KB | 5.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **28.9 KB** | **7.6 KB** |
| With Lit – the first component on a page | 48.5 KB | 14.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 8 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Say what happened and what to do next beside it: "Scan_0412.tiff is 48 MB; the limit is 25 MB."

## Do and don't

### Do

- Switch `status` on one element as things change, rather than swapping elements.
- Give an upload failure its reason and a way to try again in words.

### Don't

- Don't use `all-done` while things are still loading – show that it's loading instead.
- Don't use it as the only sign of a failure.

## Related

- [File Import](../components/file-import.md) – Drop a spreadsheet and see what was read – the rows and columns found, the delimiter and encoding, a "First row is headers" switch, the first rows with each column's type in words, problems in words (rows of the wrong length, empty columns, a header named twice), and Continue; CSV and TSV read in the browser, Excel through the page
- [Page State](page-state.md) – The full-page and empty states as one illustration – nothing found, first use, offline, something wrong, page not found, link expired, no access, access requested, session expired, limit reached, maintenance, coming soon, not available in your region and AI unavailable – each its own small scene with a colour, finite motion and words that follow the status unless `caption` sets its own
