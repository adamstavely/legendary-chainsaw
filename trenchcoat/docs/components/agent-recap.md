<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Recap

**Agents** · New

What your agents did while you were away, for a home page – a small chart of the period with a bar per 15 or 30 minutes stacked by done, failed and needs you and a marker on each notable event, then Needs you, Failed and Done as columns acted on in place, items gliding out as they're handled, and Clear done

- **Element:** `<tc-agent-recap>`
- **Size:** 13.0 KB gzip · 40.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-recap";` |
| React / Next.js | `import { AgentRecap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-recap";` · tags starting with tc- are custom elements |
| Angular | `import { AgentRecap } from "@adamstavely/trenchcoat/angular/agent-recap";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-recap";` |

## Example

The live example is in the gallery at `#/agent-recap`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What your agents did while you were away, for a home page. On top, a small chart of the period: a quiet bar for every
15 or 30 minutes, stacked by what happened – done, failed, needs you – with a marker over each notable event; point at
or focus one to see what it was. Below, a board in three columns – Needs you, Failed, Done – acted on in place: Approve
and Retry send the item gliding out, Open follows its link. The header says when the period began ("Since 6:40 PM
yesterday"), the totals, and offers Clear done.

Its neighbours cover parts of this. Agent Inbox has a recap view, but it's a view of the inbox's own tasks, inside the
inbox. Away Summary is the small catch-up at the top of one chat thread. Digest summarises information for reading,
not work to act on. Agent Recap is the morning page: the whole night at a glance, from events and items the page
passes in.

### When to use

- A home or dashboard page people open first thing, after agents ran overnight or over a weekend.
- The shape of the period matters – when the failures came, whether the work bunched up.
- Some of it needs a decision or a retry, and people should act without opening each item.

### When not to use

- The catch-up for one chat thread, above the conversation – use [Away Summary](away-summary.md).
- Everything your agents are doing right now, as a live board – use [Agent Inbox](agent-inbox.md).
- Long-running jobs with progress, cancel and retry – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Chart** `.ui-arcp__chart` – a bar per bin `.ui-arcp__bin`, stacked by kind, with the start and end times and a legend
3. **Marker** `.ui-arcp__marker` – one per notable event, above the bar it falls in; the caption `.ui-arcp__caption` says what it was
4. **Column** `.ui-arcp__col` – Needs you, Failed or Done, with its count
5. **Item** `.ui-arcp__item` – a mark for its status, what happened, why, the agent and time, and its buttons

## Looks

Standard puts the header on the gray tray, the chart on a white card and the three columns as white cards below it.
Clean is one white card: the chart under the header, then the columns as quiet gray lanes. In both, done bars are a
quiet gray and failed and needs-you bars take their status colours; markers and items pair the colour with a shape –
an exclamation, a cross or a check.

The page can set `--tc-arcp-done`, `--tc-arcp-failed` and `--tc-arcp-needs`, the bars' colours.

## Usage

### HTML

```html
<tc-agent-recap id="recap" heading="Overnight recap"></tc-agent-recap>

<script type="module">
  import "@adamstavely/trenchcoat/agent-recap";
  import "@adamstavely/trenchcoat/tokens.css";

  const recap = document.querySelector("#recap");
  recap.since = lastSeenAt;
  recap.events = activity.map((a) => ({ at: a.at, kind: a.kind, label: a.summary }));
  recap.items = [
    { id: "n1", status: "needs-you", title: "Publish the draft audit summary?", agent: "Report agent" },
    { id: "f1", status: "failed", title: "Tax ID check for 3 suppliers", detail: "The registry timed out" },
    { id: "d1", status: "done", title: "Classified 412 scanned contracts", href: "/contracts" },
  ];
  recap.addEventListener("tc-item-action", (e) => agents.act(e.detail.id, e.detail.action));
</script>
```

### React / Next.js

```tsx
import { AgentRecap, type RecapEvent, type RecapItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function MorningRecap({ since, events, items, act }: { since: number; events: RecapEvent[]; items: RecapItem[]; act: (id: string, action: string) => void }) {
  return <AgentRecap title="Overnight recap" since={since} events={events} items={items} onItemAction={(action, item) => act(item.id, action)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-recap";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";

defineProps<{ events: TcAgentRecap["events"]; items: TcAgentRecap["items"] }>();
const onItemAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-recap :events="events" :items="items" @tc-item-action="onItemAction"></tc-agent-recap>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentRecap } from "@adamstavely/trenchcoat/angular/agent-recap";
import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";

@Component({
  selector: "app-agent-recap-example",
  imports: [AgentRecap],
  template: `<tc-agent-recap [events]="events()" [items]="items()" (tc-item-action)="onItemAction($event)"></tc-agent-recap>`,
})
export class AgentRecapExample {
  readonly events = input.required<TcAgentRecap["events"]>();
  readonly items = input.required<TcAgentRecap["items"]>();
  onItemAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-recap";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";

  let { events, items }: { events: TcAgentRecap["events"]; items: TcAgentRecap["items"] } = $props();
  let el: TcAgentRecap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-item-action", on);
    return () => el.removeEventListener("tc-item-action", on);
  });
</script>

<tc-agent-recap bind:this={el} {events} {items}></tc-agent-recap>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agent recap"` | The heading |
| `since` | `since` | `number \| undefined` | `undefined` | When the period began – when you left – in epoch ms; unset starts at the first event |
| `now` | `now` | `number \| undefined` | `undefined` | When it ends, in epoch ms; unset reads the clock once |
| `events` | – | `RecapEvent[]` | `[]` | Everything that happened, for the chart |
| `items` | – | `RecapItem[]` | `[]` | What's on the board, in any order – grouped by status, newest first |
| `binMinutes` | `bin-minutes` | `number \| undefined` | `undefined` | Minutes per bar; unset is 15 for six hours or less, else 30 (wider when it would pass 64 bars) |
| `still` | `still` | `boolean` | `false` | Draws the chart at once, without the entrance |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for times |
| `labels` | – | `Partial<AgentRecapLabels>` | `{}` | Words the page can change, merged over defaultAgentRecapLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-item-action` | – | Yes | Approve, Retry or Open on an item ({ id, action, item }: RecapItemAction); cancelable – unless prevented an approved or retried item glides out, and Open follows `href` |
| `tc-clear-done` | – | Yes | Clear done ({ ids }: RecapClearDone); cancelable – unless prevented the done items glide out |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `replay()` | `void` | Grows the bars again |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-arcp-done` | `var(--tc-fill-strong)` | standard, clean |
| `--tc-arcp-failed` | `var(--tc-status-danger-solid)` | standard, clean |
| `--tc-arcp-needs` | `var(--tc-status-warning-solid)` | standard, clean |

#### Design tokens it reads (74)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `recapBins(events: RecapEvent[], start: number, end: number, binMinutes?: number): void` | Bins over the period: how many of each kind happened in each |

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
| `events` | `el.events = …;` | `<… events={…} />` | `<tc-agent-recap :events="…">` | `<tc-agent-recap [events]="…">` | `<tc-agent-recap {events}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-agent-recap :items="…">` | `<tc-agent-recap [items]="…">` | `<tc-agent-recap {items}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-recap :labels="…">` | `<tc-agent-recap [labels]="…">` | `<tc-agent-recap {labels}>` |

*Also attributes: `heading`, `since`, `now`, `bin-minutes`, `still`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-item-action` | Yes | `el.addEventListener("tc-item-action", (e) => …)` | `onItemAction={…}` | `@tc-item-action="…"` | `(tc-item-action)="…($event)"` | `el.addEventListener("tc-item-action", …)` |
| `tc-clear-done` | Yes | `el.addEventListener("tc-clear-done", (e) => …)` | `onClearDone={…}` | `@tc-clear-done="…"` | `(tc-clear-done)="…($event)"` | `el.addEventListener("tc-clear-done", …)` |

### Controlled

`tc-item-action`, `tc-clear-done` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-recap")` returns a `TcAgentRecap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";`
- **React / Next.js:** Props: `import type { AgentRecapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentRecap>`. The element class, for refs: `import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentRecap["events"]` with `import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";`
- **Angular:** The directive types the template: `[events]` takes `TcAgentRecap["events"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentRecap } from "@adamstavely/trenchcoat/agent-recap";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `onItemAction` | `(action: RecapItemAction["action"], item: RecapItem, event: Event) => void` | Approve, Retry or Open on an item. Call event.preventDefault() to keep it on the board (and a link from being followed) |
| `onClearDone` | `(ids: string[], event: Event) => void` | Clear done, with the ids it clears. Call event.preventDefault() to keep them |

*Renamed or hidden on the wrapper: `heading`, `action`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves to the chart's markers (one stop), Clear done, and each item's buttons |
| ← → ↑ ↓ | On a marker: the previous or next notable event |
| Home / End | On a marker: the first or last event |
| Enter / Space | Acts on the focused button |

### Screen readers

The recap is a `section` named by its heading. The bars are drawn only (`aria-hidden`); the markers are a `group`
named "What happened, Since 6:40 PM yesterday", each a button that says what happened, its kind and time: "Tax ID check
timed out – Failed, 8:15 PM". Each column is a `section` named by its label and count, holding a list. An item's
buttons include what they act on: "Retry: Tax ID check". When an item glides out and had focus, focus moves to the
board.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 24.3 KB | 8.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **40.0 KB** | **13.0 KB** |
| With Lit – the first component on a page | 62.6 KB | 20.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.6 ms** | the gallery demo's data, 233 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of events replaced |
| First on the page | 40 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.3 ms | events: first render, 233 nodes; update 0.4 ms |
| 1,000 items | 4.1 ms | events: first render, 389 nodes; update 0.8 ms |

1,000 items of events: 4.1 ms, 389 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **48 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (internal/chart/motion – subscribeTick), `requestAnimationFrame` (internal/chart/motion – loop).
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`, `performance.now()` (internal/chart/motion-controller – clock).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pass every event in `events`, even the dull ones – the bars show the shape of the night.
- Give failures and questions a `label`; they get markers by default. Mark a done event `notable` when it matters.
- Write items as what happened: "Tax ID check for 3 suppliers". Put the reason in `detail`.
- Keep the board to what someone might act on today; link out with `href` for the rest.

## Do and don't

### Do

- Remove an item from `items` once its approval or retry is under way – it has already glided out.
- Set `since` to when the person last looked, so the period is theirs.
- Use `bin-minutes` when the period is unusual – a weekend reads better in hours.

### Don't

- Don't put live, running work here – the recap is about what already happened.
- Don't mark every event notable; a marker per event is noise.
- Don't use it inside a chat thread – it's a page, not a message.

## Related

- [Away Summary](away-summary.md) – The "while you were away" card at the top of a chat thread – how long you were gone, then what needs you with its action, what failed with Retry, and what's done folded to a count, Mark all seen, and one quiet line when nothing happened
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Digest](digest.md) – A one-minute digest of a pile of information, arranged around what the reader needs – what matters, what to do (ticked off as you go), what changed and what's safe to ignore, with a reading-time estimate and points that cite their sources
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
