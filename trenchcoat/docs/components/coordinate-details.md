<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Coordinate Details

**People & profiles** · New

Coordinates in text, checked and marked – hover, focus or right-click one for the place, decimal and DMS with Copy, mapping links and a map that loads only on request

- **Element:** `<tc-coordinate-details>`
- **Size:** 19.0 KB gzip · 62.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/coordinate-details";` |
| React / Next.js | `import { CoordinateDetails } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/coordinate-details";` · tags starting with tc- are custom elements |
| Angular | `import { CoordinateDetails } from "@adamstavely/trenchcoat/angular/coordinate-details";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/coordinate-details";` |

## Example

The live example is in the gallery at `#/coordinate-details`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Text that mentions places by their coordinates – field notes, an incident log, a chat answer, a shipping report –
with every pair of coordinates found and marked. Hover a position for a moment, focus it or right-click it, and a card
shows what's there: the place's name, kind and address when your app knows them, the coordinates in decimal and in
degrees, minutes and seconds with Copy, "Open in" links to Google Maps, Apple Maps, OpenStreetMap and Bing Maps (or
your own mapping tools), and a map that loads only when someone presses Show map.

It reads decimal pairs ("38.8977, -77.0365"), decimals with hemispheres ("38.8977° N, 77.0365° W",
"N 38.8977 W 77.0365") and degrees-minutes-seconds ("38°53′51.6″N 77°02′11.6″W", with typographic or plain quote
marks). Pairs out of range, prices, scores, version numbers and numbers inside words stay plain text.

### When to use

- Logs, notes and reports where positions are written as numbers and readers want to know what's there without
  copying them into a map.
- Model answers that cite places, so a reader can check a position points where the answer says it does.
- Anywhere people copy coordinates into another system – the card gives both notations to copy.

### When not to use

- A location that's the main content of a card or form – use [Geo Location](geo-location.md).
- Short help text attached to one control – use [Tooltip](tooltip.md).
- Highlighting and commenting on passages of a document – use [Text Annotator](text-annotator.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-crd__text` – the passage, shown as written
2. **Coordinates** `.ui-crd__mark` – a pair found in the text, marked and focusable; lookalikes stay plain
3. **Card** `.ui-crd__pop` – what's at that position, opened by hover, focus or right-click
4. **Place** `.ui-crd__place` – a picture or pin, the name, kind, address, description, elevation and time zone
5. **Notations** `.ui-crd__forms` – decimal and DMS, each with Copy
6. **Open in** `.ui-crd__links` – mapping tools, each opening in a new tab
7. **Map** `.ui-crd__map` – Show map and where it loads from, then the embedded map

## Looks

Standard tints each position with a soft accent fill and a solid underline, and gives the place a tinted pin (or a
raised picture). Clean marks the position with a dotted underline only and frames the pin with a hairline. The card
is the shared floating surface in both looks. Override `--tc-crd-map-h` on the element to change the map's height.

## Usage

### HTML

```html
<tc-coordinate-details id="notes"></tc-coordinate-details>

<script type="module">
  import "@adamstavely/trenchcoat/coordinate-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const notes = document.querySelector("#notes");
  notes.text = "Transect A starts at 50°49′12″N 1°05′24″W; samples were taken at 50.7980, -1.0912.";
  notes.resolve = async (latitude, longitude, signal) => {
    const res = await fetch(`/api/places/reverse?lat=${latitude}&lng=${longitude}`, { signal });
    return res.status === 404 ? null : res.json();
  };
  notes.addEventListener("tc-copy", (e) => console.log("copied", e.detail.notation, e.detail.text));
</script>
```

### React / Next.js

```tsx
import { CoordinateDetails, type CoordinatePlace } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const places: Record<string, CoordinatePlace> = {
  "50.7980,-1.0912": { name: "Sampling point W3", kind: "Water sampling site" },
};

export function FieldNotes() {
  return (
    <CoordinateDetails
      text="Water samples were taken at 50.7980, -1.0912 on the falling tide."
      resolve={(lat, lng) => places[`${lat.toFixed(4)},${lng.toFixed(4)}`] ?? null}
      onCopy={(text) => console.log("copied", text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/coordinate-details";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";

defineProps<{ resolve: TcCoordinateDetails["resolve"]; providers: TcCoordinateDetails["providers"] }>();
const onCoordinateLookup = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-coordinate-details :resolve="resolve" :providers="providers" @tc-coordinate-lookup="onCoordinateLookup"></tc-coordinate-details>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CoordinateDetails } from "@adamstavely/trenchcoat/angular/coordinate-details";
import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";

@Component({
  selector: "app-coordinate-details-example",
  imports: [CoordinateDetails],
  template: `<tc-coordinate-details [resolve]="resolve()" [providers]="providers()" (tc-coordinate-lookup)="onCoordinateLookup($event)"></tc-coordinate-details>`,
})
export class CoordinateDetailsExample {
  readonly resolve = input.required<TcCoordinateDetails["resolve"]>();
  readonly providers = input.required<TcCoordinateDetails["providers"]>();
  onCoordinateLookup(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/coordinate-details";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";

  let { resolve, providers }: { resolve: TcCoordinateDetails["resolve"]; providers: TcCoordinateDetails["providers"] } = $props();
  let el: TcCoordinateDetails;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-coordinate-lookup", on);
    return () => el.removeEventListener("tc-coordinate-lookup", on);
  });
</script>

<tc-coordinate-details bind:this={el} {resolve} {providers}></tc-coordinate-details>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text to find coordinates in: plain text, shown as written (line breaks kept) |
| `resolve` | – | `CoordinateResolver \| undefined` | `undefined` | Supplies a place for a position – a place, null for none, or a promise; used when no tc-coordinate-lookup listener responds |
| `trigger` | `trigger` | `CoordinateTrigger` | `"both"` | What opens a card: "both" (hover, focus and right-click), "hover" (hover and focus) or "contextmenu" (right-click, Menu key, Enter) |
| `hoverDelay` | `hover-delay` | `number` | `300` | How long the pointer rests on a mark before its card opens, ms |
| `precision` | `precision` | `number` | `5` | Decimal places shown in decimal notation |
| `zoom` | `zoom` | `number` | `14` | The zoom for mapping links and the map, 1–19 |
| `providers` | – | `GeoProvider[]` | `defaultGeoProviders` | Mapping tools for "Open in": URL templates with {lat} {lng} {zoom} {label}; empty hides the links |
| `embed` | `embed` | `CoordinateEmbed` | `"click"` | The map: "click" waits behind Show map; "off" shows none |
| `embedSrc` | `embed-src` | `` | `defaultGeoEmbedSrc` | The map's address template – {lat} {lng} {zoom} {bbox} – OpenStreetMap's embed by default |
| `notFoundText` | `not-found-text` | `string` | `"No details for this place"` | What the card says when there are no details for a place |
| `errorText` | `error-text` | `string` | `"Couldn't load the details."` | What the card says when the lookup failed |
| `coordinates` | – | `CoordinateMatch[]` | – | The coordinates found in `text`, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-coordinate-lookup` | – | Yes | A card needs a place's details ({ latitude, longitude, signal, respondWith }: CoordinateLookupDetail); cancelable – call respondWith() with the place (or a promise), or prevent it without responding for "no details" |
| `tc-copy` | – | Yes | Copy was pressed ({ text, notation }: CoordinateCopyDetail); cancelable – prevent it to copy your own way |
| `tc-open` | – | Yes | A mapping link is about to open ({ provider, url, latitude, longitude }: CoordinateOpenDetail); cancelable – prevented, the link doesn't open |
| `tc-open-change` | – | No | A card opened or closed ({ latitude, longitude }: CoordinateOpenChange; nulls when closed) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `clearCache(position?: Coordinate)` | `void` | Forgets cached places – one position's, or all of them – so the next card asks again |
| `openCard(index: unknown)` | `void` | Opens the card for the coordinates at `index` in `coordinates`, pinned open; focus stays where it is |
| `closeCard()` | `void` | Closes the open card, if any |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-crd-map-h` | `160px` | both |

#### Design tokens it reads (41)

`--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-default`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseCoordinate(input: string): Coordinate \| null` | Reads one pair of coordinates written as decimal degrees ("38.8977, -77.0365"), decimals with hemispheres ("38.8977° N, 77.0365° W", "N 38.8977 W 77.0365") or degrees, minutes and seconds ("38°53′51.6″N 77°02′11.6″W"). Hemisphere letters say which number is the latitude; without them the latitude comes first. Gives null for anything else, and for positions out of range. A plain decimal pair needs a comma between its halves and three decimal places on each, so prices, scores and version numbers aren't read as places. |
| `findCoordinates(text: string): CoordinateMatch[]` | Every pair of coordinates in `text` that parseCoordinate() reads, in order. Pairs inside words or longer numbers, out of range, or too vague to be a place (see parseCoordinate) aren't returned. |

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
| `resolve` | `el.resolve = …;` | `<… resolve={…} />` | `<tc-coordinate-details :resolve="…">` | `<tc-coordinate-details [resolve]="…">` | `<tc-coordinate-details {resolve}>` |
| `providers` | `el.providers = …;` | `<… providers={…} />` | `<tc-coordinate-details :providers="…">` | `<tc-coordinate-details [providers]="…">` | `<tc-coordinate-details {providers}>` |

*Also attributes: `text`, `trigger`, `hover-delay`, `precision`, `zoom`, `embed`, `embed-src`, `not-found-text` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-coordinate-lookup` | Yes | `el.addEventListener("tc-coordinate-lookup", (e) => …)` | `onLookup={…}` | `@tc-coordinate-lookup="…"` | `(tc-coordinate-lookup)="…($event)"` | `el.addEventListener("tc-coordinate-lookup", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpenMap={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

`tc-coordinate-lookup`, `tc-copy`, `tc-open` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-coordinate-details")` returns a `TcCoordinateDetails` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";`
- **React / Next.js:** Props: `import type { CoordinateDetailsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CoordinateDetails>`. The element class, for refs: `import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCoordinateDetails["resolve"]` with `import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";`
- **Angular:** The directive types the template: `[resolve]` takes `TcCoordinateDetails["resolve"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCoordinateDetails } from "@adamstavely/trenchcoat/coordinate-details";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onLookup` | `(detail: CoordinateLookupDetail, event: CustomEvent<CoordinateLookupDetail>) => void` | Called when a card needs a place's details; call `detail.respondWith(place \| promise)` to answer, or use `resolve` instead |
| `onCopy` | `(text: string, notation: CoordinateNotation) => boolean \| void` | Called when Copy is pressed; return false to stop the component writing to the clipboard itself |
| `onOpenMap` | `(detail: CoordinateOpenDetail) => boolean \| void` | Called before a mapping link opens; return false to open your own map instead |
| `onOpenChange` | `(position: { latitude: number; longitude: number } \| null) => void` | Called with the position whose card opened, or null when it closed |

*Renamed or hidden on the wrapper: `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a position: opens its card (unless `trigger` is "contextmenu"). On a position with its card open: into the card (Copy, the links, Show map), as if the card followed the text; from the card's last control, on to the next position |
| Shift + Tab | From the card's first control, back to its position |
| Enter / Space | On a position: opens its card and moves focus into it |
| Menu key / Shift + F10 | On a position: opens its card and moves focus into it, in place of the browser's menu |
| Escape | Closes the card; focus goes back to its position |

### Screen readers

Each position is a button whose name is the coordinates as written, described as "Place details. Tab moves into
them" (or "Enter or the Menu key opens them" when only right-click opens cards). It has `aria-haspopup="dialog"` and
`aria-expanded`. The card is a non-modal `dialog`, named by the place's name (or "Place details for 57.04120,
-3.61270" while loading, on an error or when there are no details), and `aria-busy` while loading. The Copy buttons
are "Copy decimal" and "Copy DMS"; each link says it opens in a new tab. A polite status region says:

- the name and kind when the details arrive – "North breakwater, Survey transect A";
- "No details for this place" or "Couldn't load the details.";
- "Copied decimal coordinates".

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | geo-location | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, geo-location | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, geo-location, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, geo-location, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.3 KB | 9.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/selection` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [geo-location](geo-location.md) · Element it renders | 18.8 KB | – |
| **Added to a page that already has Lit** | **62.7 KB** | **19.0 KB** |
| With Lit – the first component on a page | 84.3 KB | 26.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 6 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of providers replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.6 ms | providers: first render, 6 nodes; update 0.2 ms |
| 1,000 items | 1.1 ms | providers: first render, 6 nodes; update 0.2 ms |

What it renders doesn't grow with providers (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController), `setTimeout` (geo-location).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text, shown as written with its line breaks.
- Give the resolver's places a `name` at least – a place without one counts as no details. `elevation` is in metres;
  `timezone` is shown as given, so pass an IANA name or your own wording.
- Pictures can be any image URL, including a `data:` URL. They're decorative; the name says which place it is.
- Rename the empty and error messages with `not-found-text` and `error-text` – keep them short and factual.
- Plain decimal pairs need three decimal places and a comma, so write positions to at least 3 places (about 100 m).

## Do and don't

### Do

- Pass the `signal` on to your geocoder, so a lookup stops when the component leaves the page.
- Return null for positions you know nothing about; throw only when the lookup itself failed, so people get Retry.
- Keep the map behind Show map – it loads from another site, and a hover shouldn't send a reader's position anywhere.
- Use `trigger="contextmenu"` in dense text, such as a log full of positions, where hover cards would get in the way.

### Don't

- Don't mark coordinates yourself in the text – the component checks them, so an out-of-range or mistyped pair isn't
  presented as a place.
- Don't call a slow geocoder for every pair on load; the component asks only when a card opens, and caches the answer.
- Don't use it for a single location field – that's `geo-location`.

## Related

- [Geo Location](geo-location.md) – Coordinates made useful – decimal or degrees-minutes-seconds, Copy, Open in Google Maps, Apple Maps, OpenStreetMap, Bing or your own tools, and an embedded map that loads nothing until Show map
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Text Annotator](text-annotator.md) – Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter
- [Tooltip](tooltip.md) – Keyboard, pointer and touch help text

## Changelog

- **Coordinate Details** (`tc-coordinate-details`) – the geospatial partner to ISBN Details. Coordinates in a passage (decimal, hemisphere-lettered or DMS) are found, range-checked and marked; hovering, focusing or right-clicking one opens a card with the place (from your `resolve` or a `tc-coordinate-lookup` listener), decimal and DMS with Copy, "Open in" mapping links and a map that loads only when asked. `trigger` picks hover, right-click or both.
