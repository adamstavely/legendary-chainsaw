<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Time Details

**People & profiles** · New

Times in text, found and underlined – hover or focus one for “Your local time”: the time in the reader’s own zone, with the weekday and date when the day changes; times without a zone, versions and rooms stay plain

- **Element:** `<tc-time-details>`
- **Size:** 10.8 KB gzip · 29.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/time-details";` |
| React / Next.js | `import { TimeDetails } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/time-details";` · tags starting with tc- are custom elements |
| Angular | `import { TimeDetails } from "@adamstavely/trenchcoat/angular/time-details";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/time-details";` |

## Example

The live example is in the gallery at `#/time-details`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Text that mentions times in someone else's zone – a maintenance notice, a release note, a meeting invite, a model's
answer – with every time that has a zone found and underlined. Hover one for a moment or focus it, and a small
tooltip shows it in the reader's own zone: "Your local time", then "1:00 AM EST", with the weekday and date when the
day changes ("Saturday, 7 November · The day before").

It reads 24-hour and 12-hour times with a zone ("06:00 UTC", "6 PM ET", "9:30am PST", "18:00 CET", "14:00 GMT+1",
"06:00Z"), ISO stamps ("2026-11-08T06:00:00Z", "2026-11-08T11:30+05:30"), an ISO date before a time ("2026-11-08 06:00
UTC") and ranges ("05:30–09:00 UTC", "9–11 am PT"), where the start takes the end's zone. Times without a zone, dates
alone and version numbers stay plain text.

### When to use

- Announcements and notes written for people in several zones: maintenance windows, releases, meetings, deadlines.
- Chat messages and model answers that give times in UTC or a zone the reader may not live in.

### When not to use

- A time that's the main content – show it formatted in the reader's zone to begin with.
- Times you control the markup for – format them in the reader's zone when you render them.
- Picking a time – use [Date Range Picker](date-range-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-tmd__text` – the passage, shown as written
2. **Marks** `.ui-tmd__mark` – a time with a zone found in the text, as a focusable `<time>` with the instant in
3. **Tooltip** `.ui-tmd__pop` – opened by hover or focus
4. **Label** `.ui-tmd__label` – "Your local time"
5. **Time** `.ui-tmd__time` – the time in the reader's zone, with the zone's short name
6. **Date** `.ui-tmd__date` – the weekday and date, when a date was written or the reader's day differs, and
7. **Same zone** `.ui-tmd__same` – "Your time zone too", when the reader is in the zone it was written in

## Looks

Standard underlines each time with an accent-coloured dotted line and tints it on hover. Clean uses a muted dotted
line in the text's colour that darkens on hover. The tooltip is the shared floating surface in both.

## Usage

### HTML

```html
<tc-time-details id="notice" date="2026-11-08"></tc-time-details>

<script type="module">
  import "@adamstavely/trenchcoat/time-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const notice = document.querySelector("#notice");
  notice.text = "The index rebuild starts at 06:00 UTC; search is read-only from 05:30–09:00 UTC.";
  notice.addEventListener("tc-open-change", (e) => console.log("tooltip for", e.detail.open?.text));
</script>
```

### React / Next.js

```tsx
import { TimeDetails } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function MaintenanceNotice() {
  return (
    <TimeDetails
      text="The index rebuild starts at 06:00 UTC. Boston checks the results at 9 am ET."
      date="2026-11-08"
      onOpenChange={(open) => console.log(open ? `showing ${open.text}` : "closed")}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/time-details";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";

defineProps<{ labels: TcTimeDetails["labels"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-time-details :labels="labels" @tc-open-change="onOpenChange"></tc-time-details>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TimeDetails } from "@adamstavely/trenchcoat/angular/time-details";
import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";

@Component({
  selector: "app-time-details-example",
  imports: [TimeDetails],
  template: `<tc-time-details [labels]="labels()" (tc-open-change)="onOpenChange($event)"></tc-time-details>`,
})
export class TimeDetailsExample {
  readonly labels = input.required<TcTimeDetails["labels"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/time-details";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";

  let { labels }: { labels: TcTimeDetails["labels"] } = $props();
  let el: TcTimeDetails;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-time-details bind:this={el} {labels}></tc-time-details>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text to find times in: plain text, shown as written (line breaks kept) |
| `date` | `date` | `string \| undefined` | `undefined` | The day times written without a date fall on, "YYYY-MM-DD"; by default today in the zone each is written in |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms – today is taken from it when `date` isn't given; by default the element's own clock |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | The reader's time zone, an IANA name such as "Europe/Berlin"; by default the browser's |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times and dates, e.g. "en-GB"; by default the browser's |
| `hoverDelay` | `hover-delay` | `number` | `300` | How long the pointer rests on a time before its tooltip opens, ms |
| `labels` | – | `Partial<TimeDetailsLabels>` | `{}` | The words the tooltip uses, merged over the defaults |
| `times` | – | `TimeMatch[]` | – | The times found in `text`, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | No | A tooltip opened or closed ({ open }: TimeOpenChange; null when closed) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `openCard(index: unknown)` | `void` | Opens the tooltip for the time at `index` in `times`, pinned open |
| `closeCard()` | `void` | Closes the open tooltip, if any |

#### Design tokens it reads (18)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-sm`, `--tc-font-weight-strong`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-space-0-5`, `--tc-space-2`, `--tc-space-3`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `timeZoneAbbreviations: Readonly<Record<string, number \| string>>` | The zone names it reads: a fixed offset in minutes, or an IANA zone for names that follow daylight saving. IST, AST and others that name several zones are left out, so they're never converted wrongly. |
| `findTimes(text: string, opts: FindTimesOptions): TimeMatch[]` | Every time with a zone in `text`, in order, with the instant it means. Times without a date fall on `date` ("YYYY-MM-DD"), or on today (from `now`) in the zone they're written in. |

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-time-details :labels="…">` | `<tc-time-details [labels]="…">` | `<tc-time-details {labels}>` |

*Also attributes: `text`, `date`, `now`, `time-zone`, `locale`, `hover-delay` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-time-details")` returns a `TcTimeDetails` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";`
- **React / Next.js:** Props: `import type { TimeDetailsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TimeDetails>`. The element class, for refs: `import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTimeDetails["labels"]` with `import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";`
- **Angular:** The directive types the template: `[labels]` takes `TcTimeDetails["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTimeDetails } from "@adamstavely/trenchcoat/time-details";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onOpenChange` | `(open: TimeMatch \| null) => void` | Called with the time whose tooltip opened, or null when it closed |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a time: opens its tooltip |
| Escape | Closes the tooltip; focus stays on the time |

A click or tap pins the tooltip open; a second one closes it.

### Screen readers

Each time is a `<time>` in the tab order, read as written and described by what the tooltip says – "Your local time:
1:00 AM EST, Saturday, 7 November, the day before" – so the converted time is heard without opening anything. The
tooltip itself repeats those words for sighted readers and is hidden from assistive technology.

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

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 13.3 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/selection` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/inline-details` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.2 KB** | **10.8 KB** |
| With Lit – the first component on a page | 48.8 KB | 17.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 15 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | re-render with the same data |
| First on the page | 2.5 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text, shown as written with its line breaks.
- Write times with a zone, and with a date when the day matters: "2026-11-09 22:00 UTC" can't be misread.
- EST, PDT, CEST and the like are fixed offsets; ET, CT, MT and PT follow daylight saving on the date. IST, AST and
  other names that mean several zones aren't converted – write UTC with an offset instead ("UTC+5:30").
- Reword the tooltip with `labels` (`yours`, `before`, `after`, `same`); `locale` sets the language of times and dates.

## Do and don't

### Do

- Set `date` to the day the text is about, so times near midnight land on the right day.
- Keep the zone written in the text – readers in that zone still need it.

### Don't

- Don't convert the times in the text yourself – the original time and zone are what everyone agreed on.
- Don't use it for times without a zone; there's nothing to convert from.

## Related

- [Entity Details](entity-details.md) – Email addresses, phone numbers, links and @handles in text, found and marked – hover, focus or right-click one for its domain, country or site (with an http warning), Copy, Write email / Call / Open, and what your directory knows about it
- [Coordinate Details](coordinate-details.md) – Coordinates in text, checked and marked – hover, focus or right-click one for the place, decimal and DMS with Copy, mapping links and a map that loads only on request
- [Identifier Details](identifier-details.md) – DOIs, IP addresses, file hashes, CVE ids and tracking numbers in text, found, checked and marked – hover, focus or right-click one for its normalised value with Copy, its range, algorithm, year or carrier, doi.org and NVD links, and what your sources know (severity, owner, status)
- [PR Link](pr-link.md) – A pull request named in running text – its state's mark and owner/repo#number · title as a link, with a card of its state, author, lines changed and files on hover or focus; compact for just #number

## Changelog

- **Time Details** (`tc-time-details`): times in a passage of text, found and underlined – hover or focus one and a tooltip shows it in the reader's own zone (“Your local time · 1:00 AM EST”), with the weekday and date when the day changes (“Saturday, 7 November · The day before”). It reads 24- and 12-hour times with a zone (“06:00 UTC”, “6 PM ET”, “14:00 GMT+1”, “06:00Z”), ISO stamps, an ISO date before a time, and ranges (“05:30–09:00 UTC”); ET, CT, MT and PT follow daylight saving. Times without a date fall on `date` or today; the reader's zone is the browser's, or `time-zone`. Each time is described by its local time for screen readers. Also exported: `findTimes()`.
