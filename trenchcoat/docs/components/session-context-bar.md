<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Session Context Bar

**Trust & calibration** · New

The session's declared terms kept in view – intent, knowledge mode, scope, review, posture, limits, deadline and budget

- **Element:** `<tc-session-context-bar>`
- **Size:** 11.7 KB gzip · 36.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/session-context-bar";` |
| React / Next.js | `import { SessionContextBar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/session-context-bar";` · tags starting with tc- are custom elements |
| Angular | `import { SessionContextBar } from "@adamstavely/trenchcoat/angular/session-context-bar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/session-context-bar";` |

## Example

The live example is in the gallery at `#/session-context-bar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A compact strip under the app's header that keeps a session's declared terms in view while the work scrolls
beneath it: what the session is for, where answers may come from, its scope, what needs review, its posture, how far
anything may be released, its deadline and how much of its budget is used. People who set the terms at the start
stop losing sight of them an hour in. Each term is a labelled chip; the ones that don't fit go behind “+N more”.
When a term changes, its chip flashes once and the change is announced, so a tighter posture or a moved deadline
doesn't pass unnoticed.

### When to use

- AI sessions that start with declared terms – an intent, a knowledge mode, a review rule – that should stay visible
  for the whole session.
- Work under a deadline or a budget, where people need the limit in sight.
- Terms that can change during a session and must be noticed when they do.

### When not to use

- Showing what's in the model's context window – use [Context Tray](context-tray.md).
- A budget or quota on its own, in detail – use [Usage Meter](usage-meter.md) or [Budget Guard](budget-guard.md).
- Stopping or pausing what's running – use [Kill Switch](kill-switch.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-scxb__bar` – the strip; a toolbar when anything in it can be operated
2. **Term** `.ui-scxb__chip` – a label and its value; a button when it's editable
3. **Value** `.ui-scxb__value` – shown as given, with a tone dot where it has one
4. **Meter** `.ui-scxb__meter` – how much is used, for a term like a budget
5. **More** `.ui-scxb__more` – “+N more”: the terms that don't fit

## Looks

Standard is a gray tray strip with each term on its own white pill, the label in the caption style. Clean is a white
strip with the terms as plain text between hairlines, regular-weight values and quieter labels, as in a document
header. In both, “+N more” is a quiet button, and its list is a menu card that floats above the page.

## Usage

### HTML

```html
<tc-session-context-bar id="terms" sticky-top="56"></tc-session-context-bar>

<script type="module">
  import "@adamstavely/trenchcoat/session-context-bar";
  import "@adamstavely/trenchcoat/tokens.css";

  const bar = document.querySelector("#terms");
  bar.terms = [
    { id: "intent", value: "Choose a supplier" },
    { id: "knowledge", value: "Sources + model", editable: true },
    { id: "posture", value: "Normal", tone: "success" },
    { id: "deadline", value: "Fri 17:00" },
    { id: "budget", value: "62% of $500", meter: 0.62 },
  ];
  bar.addEventListener("tc-term-edit", (e) => openEditor(e.detail.term, e.detail.anchor));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SessionContextBar, type SessionTerm } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SessionHeader({ initial }: { initial: SessionTerm[] }) {
  const [terms, setTerms] = useState(initial);
  return (
    <SessionContextBar
      terms={terms}
      stickyTop={56}
      onEdit={(term) =>
        setTerms((list) => list.map((t) => (t.id === term.id && t.id === "posture" ? { ...t, value: "Elevated", tone: "warning" } : t)))
      }
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/session-context-bar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";

defineProps<{ terms: TcSessionContextBar["terms"]; termLabels: TcSessionContextBar["termLabels"] }>();
const onTermEdit = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-session-context-bar :terms="terms" :termLabels="termLabels" @tc-term-edit="onTermEdit"></tc-session-context-bar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SessionContextBar } from "@adamstavely/trenchcoat/angular/session-context-bar";
import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";

@Component({
  selector: "app-session-context-bar-example",
  imports: [SessionContextBar],
  template: `<tc-session-context-bar [terms]="terms()" [termLabels]="termLabels()" (tc-term-edit)="onTermEdit($event)"></tc-session-context-bar>`,
})
export class SessionContextBarExample {
  readonly terms = input.required<TcSessionContextBar["terms"]>();
  readonly termLabels = input.required<TcSessionContextBar["termLabels"]>();
  onTermEdit(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-context-bar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";

  let { terms, termLabels }: { terms: TcSessionContextBar["terms"]; termLabels: TcSessionContextBar["termLabels"] } = $props();
  let el: TcSessionContextBar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-term-edit", on);
    return () => el.removeEventListener("tc-term-edit", on);
  });
</script>

<tc-session-context-bar bind:this={el} {terms} {termLabels}></tc-session-context-bar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `terms` | – | `SessionTerm[]` | `[]` | The terms, in the order they show; the ones that don't fit go behind "+N more" |
| `label` | `label` | `string` | `"Session terms"` | The bar's name for screen readers |
| `editable` | `editable` | `boolean` | `false` | Every term is editable unless it says otherwise |
| `locked` | `locked` | `boolean` | `false` | The terms are fixed for the session: a lock shows at the start and nothing is editable |
| `sticky` | `sticky` | `boolean` | `true` | Sticks to the top of the scroller it's in (default true) |
| `stickyTop` | `sticky-top` | `number` | `0` | How far from the top it sticks, in px – the height of a header above it |
| `maxVisible` | `max-visible` | `number \| undefined` | `undefined` | Show at most this many chips, however wide the bar is |
| `termLabels` | – | `Record<string, string>` | `{}` | Labels for term ids – in place of the usual ones (Intent, Knowledge …) or for your own ids |
| `meterWarn` | `meter-warn` | `number` | `0.75` | The meter's tone turns warning from this share used (default 0.75) |
| `meterDanger` | `meter-danger` | `number` | `0.9` | … and danger from this share (default 0.9) |
| `visibleCount` | – | `` | – | How many chips show: what fits, capped by `maxVisible` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-term-edit` | – | No | An editable term's chip was pressed; detail `{ term, anchor }` (SessionTermEditDetail) – open your editor at `anchor` |
| `tc-terms-changed` | – | No | `terms` changed one or more values; detail `{ changes }` (SessionTermChange[]) – after the flash and announcement start |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `labelOf(t: SessionTerm)` | `void` | The label a term shows |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-session-context-bar-top` | `0px` | not set – this fallback applies |

#### Design tokens it reads (58)

`--tc-accent`, `--tc-accent-highlight`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-session-context-bar-tone`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-z-sticky`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `SESSION_TERM_LABELS: Record<string, string>` | The labels of the usual terms, by id |

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
| `terms` | `el.terms = …;` | `<… terms={…} />` | `<tc-session-context-bar :terms="…">` | `<tc-session-context-bar [terms]="…">` | `<tc-session-context-bar {terms}>` |
| `termLabels` | `el.termLabels = …;` | `<… termLabels={…} />` | `<tc-session-context-bar :termLabels="…">` | `<tc-session-context-bar [termLabels]="…">` | `<tc-session-context-bar {termLabels}>` |

*Also attributes: `label`, `editable`, `locked`, `sticky`, `sticky-top`, `max-visible`, `meter-warn`, `meter-danger` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-term-edit` | No | `el.addEventListener("tc-term-edit", (e) => …)` | `onEdit={…}` | `@tc-term-edit="…"` | `(tc-term-edit)="…($event)"` | `el.addEventListener("tc-term-edit", …)` |
| `tc-terms-changed` | No | `el.addEventListener("tc-terms-changed", (e) => …)` | `onTermsChanged={…}` | `@tc-terms-changed="…"` | `(tc-terms-changed)="…($event)"` | `el.addEventListener("tc-terms-changed", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-session-context-bar")` returns a `TcSessionContextBar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";`
- **React / Next.js:** Props: `import type { SessionContextBarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SessionContextBar>`. The element class, for refs: `import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSessionContextBar["terms"]` with `import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";`
- **Angular:** The directive types the template: `[terms]` takes `TcSessionContextBar["terms"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSessionContextBar } from "@adamstavely/trenchcoat/session-context-bar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `terms` | `SessionTerm[]` | The terms, in the order they show; the ones that don't fit go behind "+N more" |
| `onEdit` | `(term: SessionTerm, anchor: HTMLElement) => void` | Called when an editable term's chip is pressed, with the chip to anchor your editor to |
| `onTermsChanged` | `(changes: SessionTermChange[]) => void` | Called after `terms` changes one or more values – the chips have flashed and the change is announced |

*Renamed or hidden on the wrapper: `terms`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the bar once, on the last control used |
| ← / → | Moves between the editable terms and “+N more” |
| Home / End | Moves to the first or last of them |
| Enter / Space | Edits the term (the app opens its editor), or opens and closes “+N more” |
| ↓ (on “+N more”) | Opens the list and moves into it |
| ↑ / ↓ (in the list) | Moves between the editable terms in it; Home and End jump |
| Escape (in the list) | Closes the list and returns to “+N more” |

### Screen readers

The host is a region named by `label` (“Session terms”). Inside it the bar is a toolbar with the same name when a
term is editable or some are hidden, otherwise a group. Each term reads as its label and value (“Intent: Choose a
supplier”); an editable one is a button that adds “, change”. A budget's meter is a `meter` named by its label, with
its value as `aria-valuetext` (“62% of $500”); inside an editable chip the meter is hidden and the value says it.
Hidden terms are out of the accessibility tree; “+N more” is named “4 more terms”, with `aria-expanded` and
`aria-controls` pointing at the list, a group named “More session terms”. A lock, when `locked`, reads “Fixed for
this session”. Changes are announced politely: “Posture: Elevated.”, several at once joined, and “Deadline removed.”

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/popover | – |

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
| **This component alone** | 20.7 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.9 KB** | **11.7 KB** |
| With Lit – the first component on a page | 59.5 KB | 19.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 66 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of terms replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | terms: first render, 1,238 nodes; update 2.8 ms |
| 1,000 items | 83 ms | terms: first render, 12,590 nodes; update 14 ms |

1,000 items of terms: 83 ms. It renders every item, so a first render passes 50 ms (a long task) at about 600 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep values short – two or three words fit the strip; put the longer version in `description`, which the list and
  the tooltip show.
- Write values as the person declared them (“Before sharing”, “Fri 17:00”); the component doesn't format dates or
  numbers.
- Use tones sparingly: `success` for the normal state, `warning` and `danger` when a term has tightened.
- Rename the usual labels with `termLabels`, or give your own ids their own labels.

## Do and don't

### Do

- Put it directly under the app's header and set `sticky-top` to the header's height.
- Make a term editable only when the person may change it mid-session, and open your editor at the event's anchor.
- Send changed terms as a new `terms` list, so the change flashes and is announced.

### Don't

- Don't put actions in the bar that aren't terms – it says what the session is, not what to do.
- Don't change terms every few seconds; each change is announced, and a stream of them is noise.
- Don't use colour alone for a term's state – the value's words carry it.

## Related

- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
- [Kill Switch](kill-switch.md) – System posture and the emergency stop – what's running, a confirmed Stop that says what it halts, and resume

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
