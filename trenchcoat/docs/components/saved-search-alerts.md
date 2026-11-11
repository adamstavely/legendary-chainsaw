<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Saved Search Alerts

**Search** · New

Saved searches that tell you about new matches – “12 new since Tue”, how often and where each one checks, pause, Run now, remove with Undo, and Add alert from the current search

- **Element:** `<tc-saved-search-alerts>`
- **Size:** 9.1 KB gzip · 29.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/saved-search-alerts";` |
| React / Next.js | `import { SavedSearchAlerts } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/saved-search-alerts";` · tags starting with tc- are custom elements |
| Angular | `import { SavedSearchAlerts } from "@adamstavely/trenchcoat/angular/saved-search-alerts";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/saved-search-alerts";` |

## Example

The live example is in the gallery at `#/saved-search-alerts`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Saved searches that tell people when something new matches. Each alert shows its name and query, how many new
matches there are ("12 new since Tue" – a button that opens them) and when it last checked. It also shows how often
it checks (Instant, Daily, Weekly or Off) and where it tells people (email, in the app, Slack – a toggle each). Pause
and Resume, Run now and Remove (with Undo) sit at the end. At the foot, Add alert takes a name, a query and how
often; `draft-query` fills the query in from the search someone just ran.

### When to use

- Beside search results, to keep watching a search.
- A settings page listing what someone is subscribed to.

### When not to use

- A search to run again by hand – use [Search History](search-history.md).
- A scheduled task with instructions – use [Routine Form](routine-form.md).
- The messages the alerts send – use [Notifications](notifications.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Alert** `.ui-ssa__alert` – the name, the query and the new matches
2. **New matches** `.ui-ssa__new` – how many, since when; opens them
3. **Controls** `.ui-ssa__controls` – how often, the channels, Pause, Run now and Remove
4. **Undo** `.ui-ssa__removed` – after a removal, until the next one
5. **Add alert** `.ui-ssa__add` – a name, the search and how often

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card. A paused or Off alert's name is
quieter, with a Paused pill. The channels are pressed toggles. Add alert sits on a soft fill at the foot and stacks
in a narrow column.

## Usage

### HTML

```html
<tc-saved-search-alerts draft-query="seagrass carbon"></tc-saved-search-alerts>
<script type="module">
  const alerts = document.querySelector("tc-saved-search-alerts");
  alerts.alerts = [{ id: "a1", name: "Bleaching surveys", query: "coral bleaching survey", frequency: "daily", channels: ["email"], newCount: 12 }];
  alerts.addEventListener("tc-alerts-change", (e) => console.log("save", e.detail.alerts));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SavedSearchAlerts, type SearchAlert } from "@adamstavely/trenchcoat/react";

export function Alerts() {
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  return <SavedSearchAlerts alerts={alerts} onAlertsChange={setAlerts} onOpenMatches={(a) => console.log("open", a.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/saved-search-alerts";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";

defineProps<{ alerts: TcSavedSearchAlerts["alerts"]; channels: TcSavedSearchAlerts["channels"] }>();
const onAlertsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-saved-search-alerts :alerts="alerts" :channels="channels" @tc-alerts-change="onAlertsChange"></tc-saved-search-alerts>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SavedSearchAlerts } from "@adamstavely/trenchcoat/angular/saved-search-alerts";
import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";

@Component({
  selector: "app-saved-search-alerts-example",
  imports: [SavedSearchAlerts],
  template: `<tc-saved-search-alerts [alerts]="alerts()" [channels]="channels()" (tc-alerts-change)="onAlertsChange($event)"></tc-saved-search-alerts>`,
})
export class SavedSearchAlertsExample {
  readonly alerts = input.required<TcSavedSearchAlerts["alerts"]>();
  readonly channels = input.required<TcSavedSearchAlerts["channels"]>();
  onAlertsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/saved-search-alerts";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";

  let { alerts, channels }: { alerts: TcSavedSearchAlerts["alerts"]; channels: TcSavedSearchAlerts["channels"] } = $props();
  let el: TcSavedSearchAlerts;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-alerts-change", on);
    return () => el.removeEventListener("tc-alerts-change", on);
  });
</script>

<tc-saved-search-alerts bind:this={el} {alerts} {channels}></tc-saved-search-alerts>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Search alerts"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `alerts` | – | `SearchAlert[]` | `[]` | The alerts, in order. Changed by the user unless tc-alerts-change is prevented |
| `channels` | – | `AlertChannel[]` | `[ { id: "email", label: "Email" }, { id: "app", label: "In app" }, { id: "slack", label: "Slack" }, ]` | Where alerts can tell people |
| `draftQuery` | `draft-query` | `string` | `""` | A query to fill Add alert with – the search the person just ran |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `readonly` | `readonly` | `boolean` | `false` | Read only: no adding, changing or removing |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-alerts-change` | – | Yes | An alert was added, changed, paused, removed or restored ({ alerts, change }: AlertsChange); cancelable – prevented, `alerts` stays as it was |
| `tc-run` | – | No | Run now was pressed ({ id, alert }: AlertRun) |
| `tc-open` | – | No | The new matches were asked for ({ id, alert }: AlertRun) |

#### Design tokens it reads (78)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `alerts` | `el.alerts = …;` | `<… alerts={…} />` | `<tc-saved-search-alerts :alerts="…">` | `<tc-saved-search-alerts [alerts]="…">` | `<tc-saved-search-alerts {alerts}>` |
| `channels` | `el.channels = …;` | `<… channels={…} />` | `<tc-saved-search-alerts :channels="…">` | `<tc-saved-search-alerts [channels]="…">` | `<tc-saved-search-alerts {channels}>` |

*Also attributes: `heading`, `description`, `draft-query`, `now`, `locale`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-alerts-change` | Yes | `el.addEventListener("tc-alerts-change", (e) => …)` | `onAlertsChange={…}` | `@tc-alerts-change="…"` | `(tc-alerts-change)="…($event)"` | `el.addEventListener("tc-alerts-change", …)` |
| `tc-run` | No | `el.addEventListener("tc-run", (e) => …)` | `onRunAlert={…}` | `@tc-run="…"` | `(tc-run)="…($event)"` | `el.addEventListener("tc-run", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpenMatches={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

### Controlled

The element changes `alerts` itself unless a listener calls `preventDefault()` on `tc-alerts-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-saved-search-alerts id="saved-search-alerts"></tc-saved-search-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/saved-search-alerts";

  const el = document.querySelector("#saved-search-alerts");
  el.addEventListener("tc-alerts-change", (e) => {
    e.preventDefault(); // the element keeps its alerts…
    if (allowed(e.detail.alerts)) el.alerts = e.detail.alerts; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SavedSearchAlerts } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SavedSearchAlerts>;
type Props = Omit<Own, "alerts" | "onAlertsChange"> & { initial: NonNullable<Own["alerts"]> };

// Controlled: passing alerts makes the wrapper prevent the element's own change; the app sets it
export function ControlledSavedSearchAlerts({ initial, ...props }: Props) {
  const [alerts, setAlerts] = useState<Own["alerts"]>(initial);
  return <SavedSearchAlerts {...props} alerts={alerts} onAlertsChange={(next) => setAlerts(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/saved-search-alerts";
import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";

const props = defineProps<{ initial: TcSavedSearchAlerts["alerts"] }>();
const alerts = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAlertsChange = (e: CustomEvent<{ alerts: TcSavedSearchAlerts["alerts"] }>) => {
  e.preventDefault();
  alerts.value = e.detail.alerts;
};
</script>

<template>
  <tc-saved-search-alerts :alerts="alerts" @tc-alerts-change="onAlertsChange"></tc-saved-search-alerts>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SavedSearchAlerts } from "@adamstavely/trenchcoat/angular/saved-search-alerts";
import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";

@Component({
  selector: "app-controlled-saved-search-alerts",
  imports: [SavedSearchAlerts],
  template: `<tc-saved-search-alerts [alerts]="alerts()" (tc-alerts-change)="onAlertsChange($event)"></tc-saved-search-alerts>`,
})
export class ControlledSavedSearchAlerts {
  readonly initial = input.required<TcSavedSearchAlerts["alerts"]>();
  readonly alerts = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAlertsChange(e: CustomEvent<{ alerts: TcSavedSearchAlerts["alerts"] }>) {
    e.preventDefault();
    this.alerts.set(e.detail.alerts);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/saved-search-alerts";
  import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";

  let { initial }: { initial: TcSavedSearchAlerts["alerts"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let alerts = $derived(initial);
  let el: TcSavedSearchAlerts;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      alerts = (e as CustomEvent<{ alerts: TcSavedSearchAlerts["alerts"] }>).detail.alerts;
    };
    el.addEventListener("tc-alerts-change", on);
    return () => el.removeEventListener("tc-alerts-change", on);
  });
</script>

<tc-saved-search-alerts bind:this={el} {alerts}></tc-saved-search-alerts>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-saved-search-alerts")` returns a `TcSavedSearchAlerts` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";`
- **React / Next.js:** Props: `import type { SavedSearchAlertsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SavedSearchAlerts>`. The element class, for refs: `import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSavedSearchAlerts["alerts"]` with `import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";`
- **Angular:** The directive types the template: `[alerts]` takes `TcSavedSearchAlerts["alerts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSavedSearchAlerts } from "@adamstavely/trenchcoat/saved-search-alerts";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `alerts` | `SearchAlert[]` | The alerts – controlled when given: every change reports the next list through onAlertsChange |
| `defaultAlerts` | `SearchAlert[]` | The alerts on mount when `alerts` isn't controlled |
| `onAlertsChange` | `(next: SearchAlert[], change: AlertsChange["change"]) => void` | An alert was added, changed, paused, removed or restored; `next` is the list as it will be |
| `onRunAlert` | `(alert: SearchAlert) => void` | Run now was pressed |
| `onOpenMatches` | `(alert: SearchAlert) => void` | The new matches were asked for |

*Renamed or hidden on the wrapper: `heading`, `alerts`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Through each alert's controls, then Add alert |
| Space / Enter on a channel | Turns it on or off |
| ↑ / ↓ on How often | Changes it |
| Enter in Add alert | Adds the alert |

### Screen readers

- The alerts are a list; each alert's controls are a group named by the alert.
- Channels are pressed buttons. The new-matches button says which alert it opens, and Remove says which alert goes.
- Changes are announced in a polite status line, and focus moves to Undo after a removal.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

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
| **This component alone** | 21.9 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.6 KB** | **9.1 KB** |
| With Lit – the first component on a page | 52.0 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | the gallery demo's data, 162 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of alerts replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 30 ms | alerts: first render, 4,269 nodes; update 6.2 ms |
| 1,000 items | 231 ms | alerts: first render, 42,369 nodes; update 31 ms |

1,000 items of alerts: 231 ms. It renders every item, so a first render passes 50 ms (a long task) at about 220 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name an alert after what it watches ("New bleaching surveys"), not the query's words.
- Default to Daily – Instant is for things that can't wait.

## Do and don't

### Do

- Keep `newCount` honest: reset it when the person has opened the matches.
- Prefill Add alert from the current search with `draft-query`.

### Don't

- Turn on every channel by default.
- Remove alerts without Undo.

## Related

- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each
- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Results List](results-list.md) – Search results to read and open – kind, title, a snippet with the query's words marked, source and date, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more
- [Notifications](notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more

## Changelog

- **Search** - **Results List** (`tc-results-list`) – results with the query's words marked in their snippets, grouped by kind with counts, Relevance / Date, “Did you mean” and Show more. - **Facet Sidebar** (`tc-facet-sidebar`) – checkbox, radio, range and date filters with counts, active filters as chips with Clear all. - **Saved Search Alerts** (`tc-saved-search-alerts`) – saved searches that report new matches, with frequency, channels, pause, Run now and remove with Undo.
