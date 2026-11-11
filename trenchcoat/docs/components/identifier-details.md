<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Identifier Details

**People & profiles** · New

DOIs, IP addresses, file hashes, CVE ids and tracking numbers in text, found, checked and marked – hover, focus or right-click one for its normalised value with Copy, its range, algorithm, year or carrier, doi.org and NVD links, and what your sources know (severity, owner, status)

- **Element:** `<tc-identifier-details>`
- **Size:** 15.9 KB gzip · 46.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/identifier-details";` |
| React / Next.js | `import { IdentifierDetails } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/identifier-details";` · tags starting with tc- are custom elements |
| Angular | `import { IdentifierDetails } from "@adamstavely/trenchcoat/angular/identifier-details";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/identifier-details";` |

## Example

The live example is in the gallery at `#/identifier-details`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Text full of technical identifiers – an incident write-up, a scan report, an analyst's notes, a model's answer – with
every DOI, IP address, file hash, CVE id and parcel tracking number found and marked. Hover one for a moment, focus it
or right-click it, and a card says what it is, gives the value normalised with Copy, and lists what follows from the
value itself: a DOI's prefix and its doi.org link, an address's version and range (private, loopback, reserved for
documentation…) and how many addresses a prefix covers, a hash's likely algorithm, a CVE's year with links to NVD and
CVE.org, a parcel's carrier. Below that is whatever your app knows: a title, a CVE's severity as a chip with its word
and score, an address's owner and network, a parcel's status, more fields and links.

It reads DOIs ("10.5555/example.2026.0142", also after "doi:" or inside a doi.org link), IPv4 and IPv6 addresses with
an optional /prefix (IPv6 shown in its shortest form), MD5, SHA-1, SHA-256 and SHA-512 hashes, CVE ids in either case,
UPS "1Z…" numbers, and other tracking numbers when a carrier is named just before them ("FedEx tracking #
449044304137821"). Version numbers, times, code like `std::vector`, octets past 255, hex of other lengths or in mixed
case, and digit runs with no carrier stay plain.

### When to use

- Incident reports, scan output and notes where readers want to know what an id is before they go and look it up.
- Model answers that cite CVEs, papers or addresses, so a reader can check them in place.
- Anywhere people copy identifiers into another tool – the card gives the normalised value.

### When not to use

- A single identifier that's the subject of the screen – a finding's detail card – use [Red-team Finding](../blocks/red-team-finding.md) or your own
  layout.
- Contact details – use [Entity Details](entity-details.md); positions – [Coordinate Details](coordinate-details.md); book numbers – [ISBN Details](isbn-details.md).
- Code listings – use [Code Block](code-block.md); the component marks identifiers in prose, not in code.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-idd__text` – the passage, shown as written
2. **Marks** `.ui-idd__mark` – an identifier found in the text, focusable, set in the monospace face; `data-kind` says which
3. **Card** `.ui-idd__pop` – opened by hover, focus or right-click
4. **Kind and value** `.ui-idd__head` – an icon, what it is, the normalised value and Copy
5. **Facts** `.ui-idd__facts` – what follows from the value itself
6. **What the app knows** `.ui-idd__more` – chips (severity, status), a title, a sentence and fields; or loading, an
7. **Links** `.ui-idd__links` – doi.org, NVD and CVE.org, then the app's links, each opening in a new tab

## Looks

Standard tints each mark with a soft accent fill and a solid underline, and gives the kind a tinted icon. Clean marks
with a dotted underline only and frames the icon with a hairline. Severity chips use the status tones – danger for
critical and high, warning for medium, info for low – and always carry the word. The card is the shared floating
surface in both looks.

## Usage

### HTML

```html
<tc-identifier-details id="report"></tc-identifier-details>

<script type="module">
  import "@adamstavely/trenchcoat/identifier-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const report = document.querySelector("#report");
  report.text = "Exploited CVE-2026-0001 from 192.0.2.44; write-up at doi:10.5555/example.2026.0142.";
  report.resolve = async (kind, value, signal) => {
    const res = await fetch(`/api/intel/${kind}/${encodeURIComponent(value)}`, { signal });
    return res.status === 404 ? null : res.json();
  };
</script>
```

### React / Next.js

```tsx
import { IdentifierDetails, type IdentifierInfo } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const intel: Record<string, IdentifierInfo> = {
  "cve:CVE-2026-0001": { title: "Heap overflow in badge reader firmware", severity: "critical", score: 9.8 },
};

export function IncidentNotes() {
  return (
    <IdentifierDetails
      text="The attacker exploited CVE-2026-0001 from 192.0.2.44."
      resolve={(kind, value) => intel[`${kind}:${value}`] ?? null}
      onCopy={(text) => console.log("copied", text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/identifier-details";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";

defineProps<{ kinds: TcIdentifierDetails["kinds"]; resolve: TcIdentifierDetails["resolve"] }>();
const onIdentifierLookup = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-identifier-details :kinds="kinds" :resolve="resolve" @tc-identifier-lookup="onIdentifierLookup"></tc-identifier-details>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IdentifierDetails } from "@adamstavely/trenchcoat/angular/identifier-details";
import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";

@Component({
  selector: "app-identifier-details-example",
  imports: [IdentifierDetails],
  template: `<tc-identifier-details [kinds]="kinds()" [resolve]="resolve()" (tc-identifier-lookup)="onIdentifierLookup($event)"></tc-identifier-details>`,
})
export class IdentifierDetailsExample {
  readonly kinds = input.required<TcIdentifierDetails["kinds"]>();
  readonly resolve = input.required<TcIdentifierDetails["resolve"]>();
  onIdentifierLookup(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/identifier-details";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";

  let { kinds, resolve }: { kinds: TcIdentifierDetails["kinds"]; resolve: TcIdentifierDetails["resolve"] } = $props();
  let el: TcIdentifierDetails;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-identifier-lookup", on);
    return () => el.removeEventListener("tc-identifier-lookup", on);
  });
</script>

<tc-identifier-details bind:this={el} {kinds} {resolve}></tc-identifier-details>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text to find identifiers in: plain text, shown as written (line breaks kept) |
| `kinds` | – | `IdentifierKind[]` | `[...identifierKinds]` | Which kinds to find: "doi", "ip", "hash", "cve", "tracking" |
| `resolve` | – | `IdentifierResolver \| undefined` | `undefined` | Supplies details for an identifier – details, null for none, or a promise; used when no tc-identifier-lookup listener responds |
| `trigger` | `trigger` | `IdentifierTrigger` | `"both"` | What opens a card: "both" (hover, focus and right-click), "hover" (hover and focus) or "contextmenu" (right-click, Menu key, Enter) |
| `hoverDelay` | `hover-delay` | `number` | `300` | How long the pointer rests on a mark before its card opens, ms |
| `kindLabels` | – | `Partial<Record<IdentifierKind, string>>` | `{}` | What each kind is called on its card, merged over the defaults |
| `notFoundText` | `not-found-text` | `string` | `"Nothing more known."` | What the card says when the app knows nothing more |
| `errorText` | `error-text` | `string` | `"Couldn't load the details."` | What the card says when the lookup failed |
| `identifiers` | – | `IdentifierMatch[]` | – | The identifiers found in `text`, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-identifier-lookup` | – | Yes | A card needs details ({ kind, value, text, carrier, signal, respondWith }: IdentifierLookupDetail); cancelable – call respondWith() with the details (or a promise), or prevent it without responding for "nothing more known" |
| `tc-copy` | – | Yes | Copy was pressed ({ text, kind }: IdentifierCopyDetail); cancelable – prevent it to copy your own way |
| `tc-open` | – | Yes | A link in the card is about to open ({ kind, value, url }: IdentifierOpenDetail); cancelable – prevented, the link doesn't open |
| `tc-open-change` | – | No | A card opened or closed ({ open }: IdentifierOpenChange; null when closed) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `clearCache(identifier?: { kind: IdentifierKind; value: string })` | `void` | Forgets cached details – one identifier's, or all of them – so the next card asks again |
| `openCard(index: unknown)` | `void` | Opens the card for the identifier at `index` in `identifiers`, pinned open; focus stays where it is |
| `closeCard()` | `void` | Closes the open card, if any |

#### Design tokens it reads (46)

`--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `identifierKinds: readonly IdentifierKind[]` | Every kind, in the order overlapping matches are settled |
| `defaultIdentifierKindLabels: Record<IdentifierKind, string>` | What each kind is called on its card |
| `ipRange(value: string): IpRange \| null` | The range an IP address (with or without a /prefix) falls in, or null when it isn't one |
| `findIdentifiers(text: string, kinds: readonly IdentifierKind[]): IdentifierMatch[]` | Every DOI, IP address, file hash, CVE id and tracking number in `text`, in order. `kinds` limits which are looked for. Where two overlap, the earlier kind in `identifierKinds` wins. |

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
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-identifier-details :kinds="…">` | `<tc-identifier-details [kinds]="…">` | `<tc-identifier-details {kinds}>` |
| `resolve` | `el.resolve = …;` | `<… resolve={…} />` | `<tc-identifier-details :resolve="…">` | `<tc-identifier-details [resolve]="…">` | `<tc-identifier-details {resolve}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-identifier-details :kindLabels="…">` | `<tc-identifier-details [kindLabels]="…">` | `<tc-identifier-details {kindLabels}>` |

*Also attributes: `text`, `trigger`, `hover-delay`, `not-found-text`, `error-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-identifier-lookup` | Yes | `el.addEventListener("tc-identifier-lookup", (e) => …)` | `onLookup={…}` | `@tc-identifier-lookup="…"` | `(tc-identifier-lookup)="…($event)"` | `el.addEventListener("tc-identifier-lookup", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpenLink={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

`tc-identifier-lookup`, `tc-copy`, `tc-open` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-identifier-details")` returns a `TcIdentifierDetails` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";`
- **React / Next.js:** Props: `import type { IdentifierDetailsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IdentifierDetails>`. The element class, for refs: `import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIdentifierDetails["kinds"]` with `import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";`
- **Angular:** The directive types the template: `[kinds]` takes `TcIdentifierDetails["kinds"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIdentifierDetails } from "@adamstavely/trenchcoat/identifier-details";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onLookup` | `(detail: IdentifierLookupDetail, event: CustomEvent<IdentifierLookupDetail>) => void` | Called when a card needs details; call `detail.respondWith(details \| promise)` to answer, or use `resolve` instead |
| `onCopy` | `(text: string, kind: IdentifierKind) => boolean \| void` | Called when Copy is pressed; return false to stop the component writing to the clipboard itself |
| `onOpenLink` | `(detail: IdentifierOpenDetail) => boolean \| void` | Called before a link in the card opens (doi.org, NVD, CVE.org, the app's links); return false to handle it yourself |
| `onOpenChange` | `(open: IdentifierMatch \| null) => void` | Called with what the open card is for, or null when it closed |

*Renamed or hidden on the wrapper: `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a mark: opens its card (unless `trigger` is "contextmenu"). On a mark with its card open: into the card; from the card's last control, on to the next mark |
| Shift + Tab | From the card's first control, back to its mark |
| Enter / Space | On a mark: opens its card and moves focus into it |
| Menu key / Shift + F10 | On a mark: opens its card and moves focus into it, in place of the browser's menu |
| Escape | Closes the card; focus goes back to its mark |

### Screen readers

Each mark is a button named by the identifier as written and described by its kind – "CVE details. Tab moves into
them" – with `aria-haspopup="dialog"` and `aria-expanded`. The card is a non-modal `dialog` named by its kind and value
("IP address 2001:db8::7"), `aria-busy` while loading. Copy is a button named "Copy"; the severity chip reads
"Critical 9.8 severity"; links that open a new tab say so. A polite status region announces the title, severity and
status the app returned, "Nothing more known.", "Couldn't load the details." and "Copied …".

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | internal/inline-details | – |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.7 KB | 10.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/inline-details` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/selection` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **46.5 KB** | **15.9 KB** |
| With Lit – the first component on a page | 66.1 KB | 22.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 14 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of kinds replaced |
| First on the page | 5.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.9 ms | kinds: first render, 14 nodes; update 0.1 ms |
| 1,000 items | 2.1 ms | kinds: first render, 14 nodes; update 0.4 ms |

What it renders doesn't grow with kinds (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text, shown as written with its line breaks.
- `severity` is one of critical, high, medium, low and none; `score` is the CVSS base score. `status` is a few words.
- `links` must be http(s), mailto: or tel: – anything else is dropped.
- Rename kinds with `kindLabels` and the messages with `not-found-text` and `error-text`.
- A hash's algorithm is a guess from its length; say so in your own fields if you know better.

## Do and don't

### Do

- Pass the `signal` on to your lookup, so it stops when the component leaves the page.
- Return null for identifiers you know nothing about; throw only when the lookup failed, so people get Retry.
- Name the carrier before tracking numbers in text you write, so they're recognised.

### Don't

- Don't mark the text yourself – the component checks ranges and shapes, so a version number isn't presented as an
  address.
- Don't look every identifier up on load; the component asks only when a card opens, and caches the answer.
- Don't put live indicators of compromise in links people might click without thinking – the card opens what you give it.

## Related

- [Entity Details](entity-details.md) – Email addresses, phone numbers, links and @handles in text, found and marked – hover, focus or right-click one for its domain, country or site (with an http warning), Copy, Write email / Call / Open, and what your directory knows about it
- [Coordinate Details](coordinate-details.md) – Coordinates in text, checked and marked – hover, focus or right-click one for the place, decimal and DMS with Copy, mapping links and a map that loads only on request
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Red-team Finding](../blocks/red-team-finding.md) – What an adversarial test broke – a findings list, then the picked one's severity, failed invariants, scenario, evidence and a response timeline with undo (uses `@adamstavely/trenchcoat/react`: `agent-ledger`, `button`)

## Changelog

- **Entity Details** (`tc-entity-details`) – emails, phone numbers, links and @handles in text are found and marked; hover, focus or right-click opens a card with Copy, Write email / Call / Open and what your `resolve` (or a `tc-entity-lookup` listener) knows. **Identifier Details** (`tc-identifier-details`) does the same for DOIs, IP addresses (private and reserved ranges named), file hashes, CVE ids and tracking numbers.
