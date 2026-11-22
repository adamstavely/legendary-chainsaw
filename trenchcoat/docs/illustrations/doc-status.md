<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Doc Status

**Illustrations** · New

Where a document stands, as one illustration whose `status` picks the badge's drawing, colours, motion and words – draft, awaiting review, approved, changes requested, in translation, in quality control, in coordination, pending release, scheduled, released, queued, processing, in progress, success, partly processed, failed, uploading, downloading, malware scan or blocked, preview unavailable, locked, restricted, on legal hold, redacted, password protected, encrypted, shared, awaiting signature, signed, comments waiting, update available, converting to text, archived, in trash, expired, duplicate, metadata cleansing (required, in progress, failed, done), added to Readbook, working offline and sync conflict

- **Element:** `<tc-doc-status>`
- **Size:** 11.5 KB gzip · 41.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/doc-status";` |
| React / Next.js | `import "@adamstavely/trenchcoat/doc-status";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/doc-status";` · tags starting with tc- are custom elements |
| Angular | `import { DocStatus } from "@adamstavely/trenchcoat/angular/doc-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/doc-status";` |

## Example

The live example is in the gallery at `#/illustrations/doc-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a document stands, as one illustration: a soft page tile (or a book, for a reading list), one pastel badge with a darker edge and ink, a soft glow beneath, and the words as real text under it. `status` picks what's drawn on the badge, its colours, its short motion and its words, so one element covers a document's whole life – drafted, in review, scheduled or queued, in work, done or failed, coming and going, checked for malware, locked, restricted, redacted, password protected, encrypted, shared, signed, commented on, converted to text, updated, archived or in the trash, its metadata cleansed, saved to read, or edited offline. Change `status` on the same element as the document moves along and it reads as one thing changing.

The motion is short and finite – a check that draws itself, an arrow that settles, a few pulses – then it rests; it holds still off screen and stays still with reduced motion. The words follow the status unless `caption` sets your own.

It replaces the eleven illustrations that were each one of these – `released`, `pending-release`, `awaiting-review`, `in-translation`, `in-quality-control`, `in-coordination`, `processing`, `uploading`, `downloading`, `malware-blocked` and `preview-unavailable` – which are gone: use this element with their status instead.

| `status` | Colour | On the badge | Use it for |
|---|---|---|---|
| `awaiting-review` | Purple | An hourglass that turns | Waiting for someone to approve it |
| `approved` | Green | A stamp with a check | Reviewed and accepted |
| `changes-requested` | Amber | An arrow turning back | Reviewed and sent back for changes – say what to change |
| `in-translation` | Teal | Two speech bubbles | Being translated |
| `in-quality-control` | Blue | A magnifier with a check | Being checked before release |
| `in-coordination` | Amber | Three linked nodes | Several people or teams agreeing it |
| `pending-release` | Pink | An arrow ready to go up | Approved and waiting for its release |
| `released` | Green | A check with sparks | Out and live |
| `added-to-readbook` | Green | A book with a bookmark and a check | Saved to the reading list |
| `processing` | Teal | A progress ring that turns | A long job with measurable progress |
| `in-progress` | Blue | Three dots that pulse | Work under way, no number to show |
| `success` | Green | A check, a ring that pops out | Finished without a problem |
| `partially-processed` | Amber | A half-filled ring, an amber "!" on the corner | Finished with some errors – say which parts failed and offer Retry |
| `failed` | Red | A cross, one small shake | Didn't work – say why beside it |
| `uploading` | Lime | An arrow rising out of a tray | On its way up |
| `downloading` | Sky blue | An arrow dropping into a tray | On its way to the person |
| `working-offline` | Slate | A cloud with a line drawn through it | Changes are saved on this device and sync when you're back online |
| `locked` | Amber | A padlock | Someone else is editing it, or it's on hold |
| `malware-scan` | Teal | A shield, a scan line down the page | Held until its malware scan finishes |
| `malware-blocked` | Red | A warning shield in front of the file | Flagged and can't be opened |
| `preview-unavailable` | Grey | The contents faded to a dashed outline, a question mark | A file type the viewer can't show – offer Download |
| `metadata-cleansing-required` | Amber | A tag with specks beside it | Metadata needs tidying before it moves on |
| `metadata-cleansing-in-progress` | Blue | A tag, dots pulsing on its corner | Metadata being cleansed |
| `metadata-cleansing-failed` | Red | A tag, a cross on its corner | Cleansing didn't work |
| `metadata-cleansing-success` | Green | A tag, a check on its corner | Metadata is clean |
| `draft` | Slate | A pencil; the page edge dashed | Not finished, not shared yet |
| `scheduled` | Blue | A calendar with a day marked | Set to go out on a date – between pending release and released |
| `queued` | Slate | Three lines lighting in turn | Waiting its turn, not started – unlike in progress |
| `archived` | Slate | An archive box | Kept but out of the way; still findable |
| `in-trash` | Slate | A bin | Deleted but recoverable – put Restore beside it |
| `expired` | Amber | A clock whose hand sweeps once | Past its retention or validity date |
| `duplicate` | Amber | Two pages with "=" | The same as another document – link to it |
| `sync-conflict` | Amber | Two pages, an amber "!" on the corner | This copy and another changed apart – pairs with working offline |
| `restricted` | Red | A classification shield | Only some people may open it |
| `legal-hold` | Purple | A gavel | Kept unchanged for a legal matter – it can't be edited or deleted until the hold is released |
| `redacted` | Slate | Black bars over the page's text, an eye with a line through it | Parts are hidden before it's shared |
| `awaiting-signature` | Purple | A pen nib | Waiting for someone to sign |
| `signed` | Green | A pen nib, a check on the corner | Signed by everyone it needed |
| `shared` | Blue | Two people | Shared with others – say with whom |
| `encrypted` | Slate | A key | Stored encrypted; nothing to do |
| `password-protected` | Amber | A password field over the page, a padlock | Needs a password to open – ask for it beside it; unlike encrypted (nothing to do) or locked (someone else has it) |
| `update-available` | Blue | An arrow up with a dot | A newer version is ready – offer Update |
| `converting` | Teal | The page read under a scan bracket, a text cursor | Being turned into searchable text (OCR) |
| `comment-needed` | Purple | A speech bubble | Comments wait for an answer |

### When to use

- A document, file or record whose state people need to see at a glance – in a list, on its page, in an empty preview.
- One element that moves through its states as the item does.

### When not to use

- An inbox or queue with nothing left in it, or a file that couldn't upload – use [Tray Status](tray-status.md) with `status="all-done"` or `upload-failed`.
- A scan result inline in a list – use [Scan Status](../components/scan-status.md).
- A page that couldn't load – use [Page State](page-state.md) with `status="something-wrong"`.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tile** `.ui-dst-page` – the document, with its folded corner `.ui-dst-fold` (or, for `added-to-readbook`, a book with its spine and bookmark `.ui-dst-ribbon`), and lines of text
3. **Mark** `.ui-dst-badge` – the round badge, with the status drawn on it in ink (for `malware-blocked`, a shield `.ui-dst-shield` in front of the file instead; for `preview-unavailable`, a smaller badge over a dashed outline `.ui-dst-ghost`)
4. **Words** `.ui-dst-caption` – where it stands

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting, and each status has its own badge colour. It has no background of its own, so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-doc-status status="in-quality-control"></tc-doc-status>

<script type="module">
  import "@adamstavely/trenchcoat/doc-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { DocStatus, type DocStatusValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReportState({ status }: { status: DocStatusValue }) {
  return <DocStatus status={status} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/doc-status";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-doc-status></tc-doc-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { DocStatus } from "@adamstavely/trenchcoat/angular/doc-status";

@Component({
  selector: "app-doc-status-example",
  imports: [DocStatus],
  template: `<tc-doc-status></tc-doc-status>`,
})
export class DocStatusExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/doc-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDocStatus } from "@adamstavely/trenchcoat/doc-status";

  let el: TcDocStatus;
</script>

<tc-doc-status bind:this={el}></tc-doc-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `status` | `DocStatus` | `"in-progress"` | Where the document stands; picks the drawing, its colours and its words |

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `DOC_STATUSES: Record<DocStatus, Entry>` | Every status: its words, colours, drawing and motion |
| `docStatusWords: object` | The words for each status, when `caption` isn't set |

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

*Also attributes: `status` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-doc-status")` returns a `TcDocStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDocStatus } from "@adamstavely/trenchcoat/doc-status";`
- **React / Next.js:** The element class: `import type { TcDocStatus } from "@adamstavely/trenchcoat/doc-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDocStatus["status"]` with `import type { TcDocStatus } from "@adamstavely/trenchcoat/doc-status";`
- **Angular:** The directive types the template: `[status]` takes `TcDocStatus["status"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDocStatus } from "@adamstavely/trenchcoat/doc-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDocStatus } from "@adamstavely/trenchcoat/doc-status";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

The host is `role="img"`, named by `label` or else by its words, so where the document stands is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same. Colour is never the only sign: the drawing and the words say it too.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, internal/doc-stage, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | internal/doc-stage | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/doc-stage | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/doc-stage, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/doc-stage, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 29.5 KB | 7.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/doc-stage` · Shared Trenchcoat code | 4.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **41.5 KB** | **11.6 KB** |
| With Lit – the first component on a page | 61.0 KB | 18.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 13 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |

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

Put what happened and what to do next beside it: "The import stopped at row 412 – fix the date column and retry."

## Do and don't

### Do

- Move one element through its statuses as the document moves, rather than swapping illustrations.
- Use `caption` when your product calls a stage something else.

### Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Related

- [Tray Status](tray-status.md) – A tray scene for where things stand – all done, nothing here yet, no matches, drop files to upload, new items (with a count), importing, import complete, imported with errors, export ready, sync complete, paused, upload failed or storage full – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own
- [Page State](page-state.md) – The full-page and empty states as one illustration – nothing found, first use, offline, something wrong, page not found, link expired, no access, access requested, session expired, limit reached, maintenance, coming soon, not available in your region and AI unavailable – each its own small scene with a colour, finite motion and words that follow the status unless `caption` sets its own
- [Folder Status](folder-status.md) – A folder scene for where a folder stands – empty, shared, syncing, archived, locked or restricted – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own
- [Scan Status](../components/scan-status.md) – Where a file stands in malware scanning – queued, scanning, clean, suspicious, quarantined or failed, inline or as a card, with Rescan and Request review
