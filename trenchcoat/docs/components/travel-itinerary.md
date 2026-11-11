<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Travel Itinerary

**People & profiles** · New

Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys

- **Element:** `<tc-travel-itinerary>`
- **Size:** 12.5 KB gzip · 44.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/travel-itinerary";` |
| React / Next.js | `import { TravelItinerary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/travel-itinerary";` · tags starting with tc- are custom elements |
| Angular | `import { TravelItinerary } from "@adamstavely/trenchcoat/angular/travel-itinerary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/travel-itinerary";` |

## Example

The live example is in the gallery at `#/travel-itinerary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Trips as legs, for a travel audit or an expense review. Each leg shows its date, the route as codes – LYS → IST, with
the places' names on hover – the mode with its carrier or road, the document it was booked on, how confident the
record is as a meter and a percentage, and where the record came from with its reliability grade. Flags such as
“No record”, “Cash ticket” or “Identity mismatch” sit on the leg in words with a mark. Grouped, connecting legs
become journeys headed by their whole route and dates.

### When to use

- A travel or expense audit: what was travelled, on what document, and how well each leg is backed up.
- Reconciling bookings, expense claims and card statements leg by leg.
- Any list of journeys where the evidence behind each leg matters.

### When not to use

- Events of every kind in order – use [Entity Timeline](entity-timeline.md).
- Where someone lives or works – use [Place List](place-list.md).
- The documents themselves – use [Document List](document-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Journey** `.ui-trit__journey-head` – grouped legs' whole route, dates and count
2. **Leg** `.ui-trit__leg` – one row, the whole row opening it
3. **Route** `.ui-trit__route` – origin and destination codes, names on hover
4. **Mode** `.ui-trit__mode` – air, rail, road or sea with the carrier
5. **Document** `.ui-trit__doc` – what the leg was booked or crossed on
6. **Confidence** `.ui-trit__conf` – a meter and the %, in warning below `low-confidence`
7. **Source** `.ui-trit__src` – where the record came from and its grade
8. **Flag** `.ui-trit__flag` – a tint, a mark and a word

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row and thinner marks. The rows, meters and flags are the same in both.

## Usage

### HTML

```html
<tc-travel-itinerary id="trips" heading="Travel this quarter" grouped></tc-travel-itinerary>

<script type="module">
  import "@adamstavely/trenchcoat/travel-itinerary";
  import "@adamstavely/trenchcoat/tokens.css";

  const trips = document.querySelector("#trips");
  trips.legs = [
    { id: "l1", date: Date.parse("2026-05-28T09:00"), from: "LYS", to: "IST", mode: "air", carrier: "TK1814", confidence: 0.99, source: { label: "Booking tool", grade: "A1" } },
    { id: "l2", date: Date.parse("2026-05-31T09:00"), from: "IST", to: "DXB", mode: "air", carrier: "EK122", confidence: 0.97, flags: ["cash"] },
  ];
  trips.addEventListener("tc-open", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { TravelItinerary, type TravelLeg } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const legs: TravelLeg[] = [
  { id: "l1", date: Date.parse("2026-05-28T09:00"), from: "LYS", to: "IST", mode: "air", carrier: "TK1814", confidence: 0.99 },
  { id: "l2", date: Date.parse("2026-05-31T09:00"), from: "IST", to: "DXB", mode: "air", carrier: "EK122", flags: ["cash"] },
];

export function Trips() {
  return <TravelItinerary title="Travel this quarter" legs={legs} grouped onOpen={(id) => console.log(id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/travel-itinerary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";

defineProps<{ legs: TcTravelItinerary["legs"]; flags: TcTravelItinerary["flags"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-travel-itinerary :legs="legs" :flags="flags" @tc-open="onOpen"></tc-travel-itinerary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TravelItinerary } from "@adamstavely/trenchcoat/angular/travel-itinerary";
import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";

@Component({
  selector: "app-travel-itinerary-example",
  imports: [TravelItinerary],
  template: `<tc-travel-itinerary [legs]="legs()" [flags]="flags()" (tc-open)="onOpen($event)"></tc-travel-itinerary>`,
})
export class TravelItineraryExample {
  readonly legs = input.required<TcTravelItinerary["legs"]>();
  readonly flags = input.required<TcTravelItinerary["flags"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/travel-itinerary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";

  let { legs, flags }: { legs: TcTravelItinerary["legs"]; flags: TcTravelItinerary["flags"] } = $props();
  let el: TcTravelItinerary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-travel-itinerary bind:this={el} {legs} {flags}></tc-travel-itinerary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Travel"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `legs` | – | `TravelLeg[]` | `[]` | The legs, in any order – the element sorts them by date |
| `flags` | – | `Record<string, { label: string; tone: TravelFlagTone }>` | `{}` | Flags' words and tones, merged over the defaults (no-record, cash, mismatch) |
| `grouped` | `grouped` | `boolean` | `false` | Groups legs into journeys: by their `journey` id, else consecutive legs that connect within `gap-days` |
| `gapDays` | `gap-days` | `number` | `14` | How many days may pass between two connecting legs of one journey, when they have no journey id |
| `order` | `order` | `"oldest" \| "newest"` | `"oldest"` | "oldest" first (the default) or "newest" first |
| `lowConfidence` | `low-confidence` | `number` | `0.75` | Confidence below this reads as low and is drawn in warning; at or above 0.9 it reads as high |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A leg was opened ({ id, leg }: TravelOpen) |

#### Design tokens it reads (60)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultTravelFlags: Record<string, { label: string; tone: TravelFlagTone }>` | The flags' words and tones used when the page gives none |

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
| `legs` | `el.legs = …;` | `<… legs={…} />` | `<tc-travel-itinerary :legs="…">` | `<tc-travel-itinerary [legs]="…">` | `<tc-travel-itinerary {legs}>` |
| `flags` | `el.flags = …;` | `<… flags={…} />` | `<tc-travel-itinerary :flags="…">` | `<tc-travel-itinerary [flags]="…">` | `<tc-travel-itinerary {flags}>` |

*Also attributes: `heading`, `description`, `grouped`, `gap-days`, `order`, `low-confidence`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-travel-itinerary")` returns a `TcTravelItinerary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";`
- **React / Next.js:** Props: `import type { TravelItineraryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TravelItinerary>`. The element class, for refs: `import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTravelItinerary["legs"]` with `import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";`
- **Angular:** The directive types the template: `[legs]` takes `TcTravelItinerary["legs"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTravelItinerary } from "@adamstavely/trenchcoat/travel-itinerary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `onOpen` | `(id: string, leg: TravelLeg) => void` | A leg was opened |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

The legs are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next leg |
| Home / End | Moves to the first or last leg |
| Enter / Space | Opens the leg (tc-open) |
| Tab | Leaves the list |

### Screen readers

Each journey is a section named “Journey 1: LYS to IST to DXB”; the legs are an ordered list. A leg's button reads
“Open Lyon Saint-Exupéry to Istanbul, 28 May 2026”; the row reads the mode, the carrier, the document, the confidence
in words (“99% confidence, high”), the source and grade, and each flag's word. Colour never carries a flag on its own.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, fact-sheet | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, fact-sheet, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, fact-sheet, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, fact-sheet, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.5 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [fact-sheet](fact-sheet.md) · Element it renders | 16.1 KB | – |
| **Added to a page that already has Lit** | **44.6 KB** | **12.5 KB** |
| With Lit – the first component on a page | 66.3 KB | 19.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.2 ms** | the gallery demo's data, 256 DOM nodes – to layout, median of 7 |
| Typical update | **1.3 ms** | one item of legs replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 35 ms | legs: first render, 4,389 nodes; update 11 ms |
| 1,000 items | 216 ms | legs: first render, 43,989 nodes; update 73 ms |

1,000 items of legs: 216 ms. It renders every item, so a first render passes 50 ms (a long task) at about 230 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (fact-sheet).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the codes people know – IATA airports, station or border codes – and give `name` so they read in full.
- Write the document as it identifies the traveller without exposing it: “Passport ••471K”.
- Keep flags to a few words: “Cash ticket”, not “Ticket was paid for in cash”.

## Do and don't

### Do

- Give each leg a source and grade, so reviewers can weigh a mileage claim against a booking.
- Set `grouped` when trips have several legs, so the whole route reads first.
- Set `low-confidence` to the level your audit treats as needing a second look.

### Don't

- Don't show full document numbers – mask them in the data you pass.
- Don't use flags for routine facts; keep them for what needs a look.
- Don't mix trips from different people in one list.

## Related

- [Entity Timeline](entity-timeline.md) – What happened to a person, account or case, in order – events under month headers, each with a category, its source and Admiralty grade tinted by confidence, an optional flag and a detail that opens in place, filtered by category chips with counts
- [Place List](place-list.md) – The places on record – type with an icon, Confirmed / Unverified / Vacated in words, address, coordinates and when each applies, with a place picked for a map
- [Fact Sheet](fact-sheet.md) – What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
