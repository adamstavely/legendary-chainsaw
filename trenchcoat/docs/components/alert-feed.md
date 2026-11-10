<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Alert Feed

**People & profiles** · New

A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements

- **Element:** `<tc-alert-feed>`
- **Size:** 8.7 KB gzip · 28.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/alert-feed";` |
| React / Next.js | `import { AlertFeed } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/alert-feed";` · tags starting with tc- are custom elements |
| Angular | `import { AlertFeed } from "@adamstavely/trenchcoat/angular/alert-feed";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/alert-feed";` |

## Example

The live example is in the gallery at `#/alert-feed`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A live feed of alerts, newest first, for a team watching accounts, payments or systems as things happen. Each alert
has a category tag named by the page, a severity – critical, high, medium or info – shown as an edge, a mark and a
word, a title, a subject line naming who or what it's about, a source tag, and a relative time that stays fresh. Each
alert's actions – Escalate and Acknowledge by default, or the page's own – fire `tc-action`; acknowledging quiets the
alert. The header has a live dot with the number of events today, the number of critical alerts still open, and
Pause feed. While paused, new alerts wait behind a “Show 3 new alerts” button, so the list doesn't move under
someone reading it. New alerts slide in and are announced politely, several at once as a count.

### When to use

- A security, fraud or operations team watching events that need a person to look at them.
- A dashboard panel where the newest, most severe events must stand out and be dealt with in place.
- Any stream where people acknowledge or escalate one item at a time.

### When not to use

- Messages for the person using the app – use [Notifications](notifications.md).
- A short toast that something happened – use [Notification Stack](notification-stack.md).
- People or accounts to keep an eye on, rather than events – use [Watchlist](watchlist.md).
- Work assigned to agents – use [Agent Inbox](agent-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Live** `.ui-afd__live` – a live dot and the number of events today; “Paused” while paused
2. **Critical** `.ui-afd__critical` – how many critical alerts are still open
3. **Pause** `.ui-afd__pause` – Pause feed or Resume feed
4. **Waiting** `.ui-afd__waiting` – while paused, the alerts that arrived, behind a button
5. **Alert** `.ui-afd__alert` – one alert, with its severity edge
6. **Mark** `.ui-afd__mark` – the severity's shape: an octagon, a triangle, a circle or an i
7. **Category** `.ui-afd__category` – the kind of alert, in small caps, with the severity in words beside it
8. **Time** `.ui-afd__time` – how long ago, kept fresh
9. **Actions** `.ui-afd__actions` – the alert's buttons; “Acknowledged” once it's dealt with

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The alerts, marks and actions are the same in both.

## Usage

### HTML

```html
<tc-alert-feed id="feed" heading="Live alerts"></tc-alert-feed>

<script type="module">
  import "@adamstavely/trenchcoat/alert-feed";
  import "@adamstavely/trenchcoat/tokens.css";

  const feed = document.querySelector("#feed");
  feed.items = [
    { id: "a1", category: "Payment", severity: "critical", title: "Card used in two countries within an hour", subject: "Dana Okafor · CUS-0098-S · Geneva", time: Date.parse("2026-10-27T09:41:00") },
    { id: "a2", category: "Sign-in", severity: "info", title: "Password reset from a known device", time: Date.parse("2026-10-27T09:02:00") },
  ];
  feed.addEventListener("tc-action", (e) => console.log(e.detail.action, e.detail.id));
</script>
```

### React / Next.js

```tsx
import { AlertFeed, type AlertItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: AlertItem[] = [
  { id: "a1", category: "Payment", severity: "critical", title: "Card used in two countries within an hour", subject: "Dana Okafor · CUS-0098-S · Geneva", time: Date.parse("2026-10-27T09:41:00") },
];

export function Alerts() {
  return <AlertFeed title="Live alerts" items={items} onAction={(id, action) => console.log(id, action)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/alert-feed";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";

defineProps<{ items: TcAlertFeed["items"]; actions: TcAlertFeed["actions"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-alert-feed :items="items" :actions="actions" @tc-action="onAction"></tc-alert-feed>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AlertFeed } from "@adamstavely/trenchcoat/angular/alert-feed";
import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";

@Component({
  selector: "app-alert-feed-example",
  imports: [AlertFeed],
  template: `<tc-alert-feed [items]="items()" [actions]="actions()" (tc-action)="onAction($event)"></tc-alert-feed>`,
})
export class AlertFeedExample {
  readonly items = input.required<TcAlertFeed["items"]>();
  readonly actions = input.required<TcAlertFeed["actions"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/alert-feed";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";

  let { items, actions }: { items: TcAlertFeed["items"]; actions: TcAlertFeed["actions"] } = $props();
  let el: TcAlertFeed;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-alert-feed bind:this={el} {items} {actions}></tc-alert-feed>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Live alerts"` | The heading, and the feed's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `AlertItem[]` | `[]` | The alerts, in any order – shown newest first |
| `actions` | – | `AlertAction[]` | `[ { id: "escalate", label: "Escalate", tone: "danger" }, { id: "acknowledge", label: "Acknowledge" }, ]` | Every alert's actions, unless it names its own (Escalate and Acknowledge by default) |
| `paused` | `paused` | `boolean` | `false` | Holds new alerts back behind a "Show N new" button. Changed by the user unless a tc-paused-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for the relative times and today's count, epoch ms; unset, the element keeps its own clock |
| `todayCount` | `today-count` | `number \| undefined` | `undefined` | The events counted today, in the header; by default the alerts given since midnight |
| `severityLabels` | – | `Partial<Record<AlertSeverity, string>>` | `{}` | The severities' names, merged over the defaults (Critical, High, Medium, Info) |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times, e.g. "en-GB"; by default the browser's |
| `empty` | `empty` | `string` | `"No alerts. All quiet."` | Shown when there are no alerts |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | Yes | An alert's action was used ({ id, action, item }: AlertActionEvent); cancelable – for "acknowledge", prevented means the alert isn't quieted |
| `tc-paused-change` | – | Yes | Pause feed or Resume was pressed ({ paused }: AlertPausedChange); cancelable – prevented, `paused` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-afd-mark-ink` | `var(--tc-surface-raised)` | both |

#### Design tokens it reads (79)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-afd-sev`, `--tc-afd-sev-fg`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-solid`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultAlertSeverityLabels: Record<AlertSeverity, string>` | The severities' names used when the page gives none |
| `defaultAlertActions: AlertAction[]` | The actions an alert gets when neither it nor the element names any |
| `alertTime(ms: number, now: number, locale?: string): void` | "just now", "4m ago", "3h ago", then the date and time |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-alert-feed :items="…">` | `<tc-alert-feed [items]="…">` | `<tc-alert-feed {items}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-alert-feed :actions="…">` | `<tc-alert-feed [actions]="…">` | `<tc-alert-feed {actions}>` |
| `severityLabels` | `el.severityLabels = …;` | `<… severityLabels={…} />` | `<tc-alert-feed :severityLabels="…">` | `<tc-alert-feed [severityLabels]="…">` | `<tc-alert-feed {severityLabels}>` |

*Also attributes: `heading`, `description`, `paused`, `now`, `today-count`, `locale`, `empty` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-paused-change` | Yes | `el.addEventListener("tc-paused-change", (e) => …)` | `ref.current.addEventListener("tc-paused-change", …)` | `@tc-paused-change="…"` | `(tc-paused-change)="…($event)"` | `el.addEventListener("tc-paused-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `paused` itself unless a listener calls `preventDefault()` on `tc-paused-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-alert-feed id="alert-feed"></tc-alert-feed>

<script type="module">
  import "@adamstavely/trenchcoat/alert-feed";

  const el = document.querySelector("#alert-feed");
  el.addEventListener("tc-paused-change", (e) => {
    e.preventDefault(); // the element keeps its paused…
    if (allowed(e.detail.paused)) el.paused = e.detail.paused; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/alert-feed";
import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";

const props = defineProps<{ initial: TcAlertFeed["paused"] }>();
const paused = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPausedChange = (e: CustomEvent<{ paused: TcAlertFeed["paused"] }>) => {
  e.preventDefault();
  paused.value = e.detail.paused;
};
</script>

<template>
  <tc-alert-feed :paused="paused" @tc-paused-change="onPausedChange"></tc-alert-feed>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AlertFeed } from "@adamstavely/trenchcoat/angular/alert-feed";
import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";

@Component({
  selector: "app-controlled-alert-feed",
  imports: [AlertFeed],
  template: `<tc-alert-feed [paused]="paused()" (tc-paused-change)="onPausedChange($event)"></tc-alert-feed>`,
})
export class ControlledAlertFeed {
  readonly initial = input.required<TcAlertFeed["paused"]>();
  readonly paused = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPausedChange(e: CustomEvent<{ paused: TcAlertFeed["paused"] }>) {
    e.preventDefault();
    this.paused.set(e.detail.paused);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/alert-feed";
  import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";

  let { initial }: { initial: TcAlertFeed["paused"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let paused = $derived(initial);
  let el: TcAlertFeed;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      paused = (e as CustomEvent<{ paused: TcAlertFeed["paused"] }>).detail.paused;
    };
    el.addEventListener("tc-paused-change", on);
    return () => el.removeEventListener("tc-paused-change", on);
  });
</script>

<tc-alert-feed bind:this={el} {paused}></tc-alert-feed>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-alert-feed")` returns a `TcAlertFeed` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";`
- **React / Next.js:** Props: `import type { AlertFeedProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AlertFeed>`. The element class, for refs: `import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAlertFeed["items"]` with `import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";`
- **Angular:** The directive types the template: `[items]` takes `TcAlertFeed["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAlertFeed } from "@adamstavely/trenchcoat/alert-feed";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the feed's name |
| `paused` | `boolean` | Whether new alerts are held back – controlled when given |
| `defaultPaused` | `boolean` | Paused on mount when `paused` isn't controlled |
| `onPausedChange` | `(paused: boolean) => void` | Pause feed or Resume was pressed |
| `onAction` | `(id: string, action: string, item: AlertItem) => boolean \| void` | An alert's action was used; return false to stop the element acting on it (Acknowledge quieting the alert) |

*Renamed or hidden on the wrapper: `heading`, `paused`, `children`*

## Accessibility

### Keyboard

The alerts are one tab stop; inside it the arrows move between alerts.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next alert |
| Home / End | Moves to the first or last alert |
| Tab | Moves on to the focused alert's actions, then leaves the feed |
| Enter / Space on an action | Uses it: fires `tc-action` |

Acknowledging moves the focus back to the alert, since its Acknowledge button goes away.

### Screen readers

The feed is a list named by the heading. Each alert is an article named by its title and described by its severity,
category, subject and state, “Critical · Payment · Dana Okafor · CUS-0098-S · Geneva”; its actions are described by
the title, so “Escalate” is heard with what it escalates. New alerts are announced in a polite status message, “New
critical alert: Card used in two countries within an hour”, or “3 new alerts, 1 critical”; while paused, “2 new alerts
waiting”. Acknowledging is confirmed with “Acknowledged: …”. Pause feed is a toggle button, pressed while paused.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.8 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.3 KB** | **8.7 KB** |
| With Lit – the first component on a page | 50.1 KB | 16.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 96 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.3 ms | items: first render, 1,824 nodes; update 1.1 ms |
| 1,000 items | 106 ms | items: first render, 18,024 nodes; update 7.9 ms |

1,000 items of items: 106 ms. It renders every item, so a first render passes 50 ms (a long task) at about 470 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write titles as what happened, in a few words: “Card used in two countries within an hour”.
- Put who or what, the id and where in `subject`, separated by middle dots.
- Keep categories to one word each, and few of them: “Payment”, “Sign-in”, “Device”.
- Name the rule, team or case the alert came from in `source`.

## Do and don't

### Do

- Keep critical for alerts someone must act on now; most alerts should be medium or info.
- Give `now` when the page already has a clock, so every time on the page agrees.
- Pass `todayCount` when the feed shows only some of today's events.

### Don't

- Don't rely on the colours – the words and marks carry the severity.
- Don't remove acknowledged alerts straight away; let them go quiet, then age out.
- Don't add more than two or three actions to an alert; open the record for the rest.

## Related

- [Watchlist](watchlist.md) – The people, accounts or entities a team is watching, most at risk first – avatar, reference, case tag and a risk badge in words, with a count, filters by risk and View all
- [Notifications](notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo

## Changelog

- **`tc-alert-feed`:** a live feed of alerts. - **Each alert:** a category, severity shown as an edge, a mark and a word, and a relative time that stays fresh. - **Actions:** Escalate and Acknowledge. - **Pausing:** Pause feed holds new alerts back, and arrivals are announced politely.
