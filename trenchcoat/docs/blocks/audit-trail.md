<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Audit Trail

**Blocks** · New

Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export

- **Element:** `<tc-audit-trail>`
- **Size:** 7.1 KB gzip · 20.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/audit-trail";` |
| React / Next.js | `import { AuditTrail } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/audit-trail";` · tags starting with tc- are custom elements |
| Angular | `import { AuditTrail } from "@adamstavely/trenchcoat/angular/audit-trail";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/audit-trail";` |

## Example

The live example is in the gallery at `#/blocks/audit-trail`, in both looks; Replay restarts its animations.

## Overview

Who did what and when, for the record. Events are grouped by day, newest first, each with an outcome in words. Search and
a filter by outcome narrow it, a row with details opens to show them, and the events showing can be exported as CSV.

### When to use

- Showing the history of sensitive data or actions to reviewers and auditors.
- Answering "who shared this, and when?".

### When not to use

- The story of one person or case – use [Entity Timeline](../components/entity-timeline.md).
- What needs attention now – use [Alert Feed](../components/alert-feed.md).
- Deciding who keeps access – use [Access Review](access-review.md).

## Anatomy

1. **Bar** `.ui-aud__bar` – search, the outcome filter and Export
2. **Day** `.ui-aud__day` – one day's events, under `.ui-aud__date`
3. **Event** `.ui-aud__event` – `.ui-aud__time`, who did what in `.ui-aud__line`, and `.ui-aud__outcome`
4. **Details** `.ui-aud__more` – opens `.ui-aud__detail`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Usage

### HTML

```html
<tc-audit-trail id="trail"></tc-audit-trail>

<script type="module">
  import "@adamstavely/trenchcoat/audit-trail";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#trail").events = [{ id: "1", at: Date.UTC(2026, 9, 31), actor: "Noor Haddad", action: "shared", target: "Trial 12" }];
</script>
```

### React / Next.js

```tsx
import { AuditTrail, type AuditEvent } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const events: AuditEvent[] = [{ id: "1", at: Date.UTC(2026, 9, 31), actor: "Noor Haddad", action: "shared", target: "Trial 12" }];

export function Record() {
  return <AuditTrail events={events} timeZone="UTC" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/audit-trail";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";

defineProps<{ events: TcAuditTrail["events"]; labels: TcAuditTrail["labels"] }>();
const onQueryChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-audit-trail :events="events" :labels="labels" @tc-query-change="onQueryChange"></tc-audit-trail>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AuditTrail } from "@adamstavely/trenchcoat/angular/audit-trail";
import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";

@Component({
  selector: "app-audit-trail-example",
  imports: [AuditTrail],
  template: `<tc-audit-trail [events]="events()" [labels]="labels()" (tc-query-change)="onQueryChange($event)"></tc-audit-trail>`,
})
export class AuditTrailExample {
  readonly events = input.required<TcAuditTrail["events"]>();
  readonly labels = input.required<TcAuditTrail["labels"]>();
  onQueryChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/audit-trail";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";

  let { events, labels }: { events: TcAuditTrail["events"]; labels: TcAuditTrail["labels"] } = $props();
  let el: TcAuditTrail;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-query-change", on);
    return () => el.removeEventListener("tc-query-change", on);
  });
</script>

<tc-audit-trail bind:this={el} {events} {labels}></tc-audit-trail>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Audit trail"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `events` | – | `AuditEvent[]` | `[]` | What happened, in any order: they show newest first |
| `query` | `query` | `string` | `""` | The search |
| `outcome` | `outcome` | `AuditOutcomeFilter` | `"all"` | Which outcomes show |
| `exportable` | `exportable` | `boolean` | `true` | Offer Export |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates and times |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | The time zone for dates and times; by default the browser's |
| `labels` | – | `Partial<AuditTrailLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-query-change` | – | No | The search changed ({ query }: AuditQueryChange) |
| `tc-export` | – | Yes | Export was pressed ({ events, csv }: AuditExport); cancelable – without a listener preventing it, the file downloads |

#### Design tokens it reads (34)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `auditCsvCell(value: string): void` | One CSV cell. A leading = + - @ (or tab, return) is a formula to a spreadsheet, so it's kept as text |
| `auditCsv(events: AuditEvent[]): void` | The events as CSV, with times in ISO 8601 |

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
| `events` | `el.events = …;` | `<… events={…} />` | `<tc-audit-trail :events="…">` | `<tc-audit-trail [events]="…">` | `<tc-audit-trail {events}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-audit-trail :labels="…">` | `<tc-audit-trail [labels]="…">` | `<tc-audit-trail {labels}>` |

*Also attributes: `heading`, `description`, `query`, `outcome`, `exportable`, `locale`, `time-zone` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-query-change` | No | `el.addEventListener("tc-query-change", (e) => …)` | `onTcQueryChange={…}` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-export` | Yes | `el.addEventListener("tc-export", (e) => …)` | `onTcExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

### Controlled

`tc-export` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-audit-trail")` returns a `TcAuditTrail` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";`
- **React / Next.js:** Props: `import type { AuditTrailProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AuditTrail>`. The element class, for refs: `import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAuditTrail["events"]` with `import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";`
- **Angular:** The directive types the template: `[events]` takes `TcAuditTrail["events"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAuditTrail } from "@adamstavely/trenchcoat/audit-trail";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Audit trail" |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through search, the filter, Export and each Details button |
| Enter / Space | Opens or closes a row's details |

### Screen readers

Each day is a named section with a heading and a list of events. Outcomes are words, and times are `time` elements.
Details buttons use `aria-expanded` and `aria-controls`, and name the event. `role="status"` announces how many events
match while searching or filtering.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 12.3 KB | 4.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [collapse](../motion/collapse.md) · Element it renders | 0.8 KB | – |
| **Added to a page that already has Lit** | **20.6 KB** | **7.1 KB** |
| With Lit – the first component on a page | 41.3 KB | 13.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | default properties, 23 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

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

Write `action` as a past-tense verb that reads on from the name: "Noor Haddad shared". Failed attempts belong in the
record too, especially denied ones. Set `time-zone` when reviewers need one shared clock, because the default is each
browser's own. Cells a spreadsheet would run as a formula are exported with a leading apostrophe.

## Do and don't

### Do

- Page or limit `events` on the server for long histories. This filters only what it's given.
- Listen for `tc-export` to log who exported, or call `preventDefault()` to export on the server instead.

### Don't

- Don't treat this as the record. It displays events, and can't make them tamper-proof.

## Related

- [Access Review](access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Entity Timeline](../components/entity-timeline.md) – What happened to a person, account or case, in order – events under month headers, each with a category, its source and Admiralty grade tinted by confidence, an optional flag and a detail that opens in place, filtered by category chips with counts
- [Alert Feed](../components/alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements

## Changelog

- **Audit Trail** (`tc-audit-trail`) – a block showing who did what and when, with search, a filter by outcome and a CSV export that keeps spreadsheet formulas from running.
