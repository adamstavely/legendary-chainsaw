<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Away Summary

**Agents** · New

The "while you were away" card at the top of a chat thread – how long you were gone, then what needs you with its action, what failed with Retry, and what's done folded to a count, Mark all seen, and one quiet line when nothing happened

- **Element:** `<tc-away-summary>`
- **Size:** 8.1 KB gzip · 25.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/away-summary";` |
| React / Next.js | `import { AwaySummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/away-summary";` · tags starting with tc- are custom elements |
| Angular | `import { AwaySummary } from "@adamstavely/trenchcoat/angular/away-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/away-summary";` |

## Example

The live example is in the gallery at `#/away-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The "while you were away" card at the top of a chat thread, right where the person left off. One line says how long
they were gone and since when; then three short groups – Needs you, each with its action; Failed, each with Retry;
and Done, folded to a count that opens. When nothing happened it's a single quiet line, and Mark all seen folds it to
"You're all caught up". It stays a few rows tall, so the thread isn't pushed far down.

Its neighbours do more. Agent Recap is the full overnight picture for a home page – a chart of the period and a board
acted on in place; Agent Inbox has a recap view inside the inbox; Digest summarises a pile of information for reading.
Away Summary is the small catch-up for one thread.

### When to use

- A chat thread where agents kept working after the person left, and they come back to it.
- Some of what happened needs the person: a decision, a failed step to retry.
- The catch-up should fit above the conversation, not replace it.

### When not to use

- A home page that recaps every agent's night, with a chart – use [Agent Recap](agent-recap.md).
- Everything your agents are working on, as a board – use [Agent Inbox](agent-inbox.md).
- A summary of documents or messages to read – use [Digest](digest.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Group** `.ui-aws__group` – Needs you, Failed or Done, with its label and count `.ui-aws__label`
3. **Item** `.ui-aws__item` – a mark for its status, what happened, a quiet line with the detail, agent and time, and its action
4. **Done** `.ui-aws__toggle` – the done items folded to a count, opening into the list
5. **Line** `.ui-aws__line` – nothing new, or caught up after Mark all seen

## Looks

Standard puts the header on the gray tray and the groups on a white card below it. Clean is one white card with the
header as its first row and flatter buttons. In both, the status marks pair a colour with a shape: an exclamation for
Needs you, a cross for Failed and a check for Done.

## Usage

### HTML

```html
<tc-away-summary id="away"></tc-away-summary>

<script type="module">
  import "@adamstavely/trenchcoat/away-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const away = document.querySelector("#away");
  away.since = Date.now() - 3 * 3600_000;
  away.items = [
    { id: "n1", status: "needs-you", title: "Two vendor files for Northwind Paper", action: "Decide" },
    { id: "f1", status: "failed", title: "Tax ID check for 3 suppliers", detail: "The registry timed out" },
    { id: "d1", status: "done", title: "Classified 412 scanned contracts", href: "/contracts" },
  ];
  away.addEventListener("tc-item-action", (e) => agents.act(e.detail.id, e.detail.action));
</script>
```

### React / Next.js

```tsx
import { AwaySummary, type AwayItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ThreadCatchUp({ leftAt, items, act }: { leftAt: number; items: AwayItem[]; act: (id: string, action: string) => void }) {
  return <AwaySummary since={leftAt} items={items} onItemAction={(action, item) => act(item.id, action)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/away-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";

defineProps<{ items: TcAwaySummary["items"]; labels: TcAwaySummary["labels"] }>();
const onItemAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-away-summary :items="items" :labels="labels" @tc-item-action="onItemAction"></tc-away-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AwaySummary } from "@adamstavely/trenchcoat/angular/away-summary";
import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";

@Component({
  selector: "app-away-summary-example",
  imports: [AwaySummary],
  template: `<tc-away-summary [items]="items()" [labels]="labels()" (tc-item-action)="onItemAction($event)"></tc-away-summary>`,
})
export class AwaySummaryExample {
  readonly items = input.required<TcAwaySummary["items"]>();
  readonly labels = input.required<TcAwaySummary["labels"]>();
  onItemAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/away-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";

  let { items, labels }: { items: TcAwaySummary["items"]; labels: TcAwaySummary["labels"] } = $props();
  let el: TcAwaySummary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-item-action", on);
    return () => el.removeEventListener("tc-item-action", on);
  });
</script>

<tc-away-summary bind:this={el} {items} {labels}></tc-away-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"While you were away"` | The heading |
| `since` | `since` | `number \| undefined` | `undefined` | When the person left, in epoch ms |
| `now` | `now` | `number \| undefined` | `undefined` | When they came back, in epoch ms; unset reads the clock once |
| `items` | – | `AwayItem[]` | `[]` | What happened, in any order – grouped by status, newest first within a group |
| `expanded` | `expanded` | `boolean` | `false` | The Done group is open |
| `seen` | `seen` | `boolean` | `false` | Mark all seen was pressed: the card folds to one line |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for times of day |
| `labels` | – | `Partial<AwaySummaryLabels>` | `{}` | Words the page can change, merged over defaultAwaySummaryLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-item-action` | – | Yes | An item's button ({ id, action, item }: AwayItemAction); cancelable – on an item with `href`, prevented keeps the link from being followed |
| `tc-expanded-change` | – | Yes | The Done group opens or closes ({ expanded }: AwayExpandedChange); cancelable – prevented, it stays |
| `tc-seen` | – | Yes | Mark all seen ({ ids }: AwaySeen); cancelable – unless prevented the card folds to "You're all caught up" |

#### Design tokens it reads (61)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `awayFor(ms: number): string` | How long someone was gone: 45 min · 3 h 12 min · 2 d 4 h |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-away-summary :items="…">` | `<tc-away-summary [items]="…">` | `<tc-away-summary {items}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-away-summary :labels="…">` | `<tc-away-summary [labels]="…">` | `<tc-away-summary {labels}>` |

*Also attributes: `heading`, `since`, `now`, `expanded`, `seen`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-item-action` | Yes | `el.addEventListener("tc-item-action", (e) => …)` | `onItemAction={…}` | `@tc-item-action="…"` | `(tc-item-action)="…($event)"` | `el.addEventListener("tc-item-action", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-seen` | Yes | `el.addEventListener("tc-seen", (e) => …)` | `onSeen={…}` | `@tc-seen="…"` | `(tc-seen)="…($event)"` | `el.addEventListener("tc-seen", …)` |

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-away-summary id="away-summary"></tc-away-summary>

<script type="module">
  import "@adamstavely/trenchcoat/away-summary";

  const el = document.querySelector("#away-summary");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AwaySummary } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AwaySummary>;
type Props = Omit<Own, "expanded" | "onExpandedChange"> & { initial: NonNullable<Own["expanded"]> };

// Controlled: passing expanded makes the wrapper prevent the element's own change; the app sets it
export function ControlledAwaySummary({ initial, ...props }: Props) {
  const [expanded, setExpanded] = useState<Own["expanded"]>(initial);
  return <AwaySummary {...props} expanded={expanded} onExpandedChange={(next) => setExpanded(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/away-summary";
import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";

const props = defineProps<{ initial: TcAwaySummary["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcAwaySummary["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-away-summary :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-away-summary>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AwaySummary } from "@adamstavely/trenchcoat/angular/away-summary";
import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";

@Component({
  selector: "app-controlled-away-summary",
  imports: [AwaySummary],
  template: `<tc-away-summary [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-away-summary>`,
})
export class ControlledAwaySummary {
  readonly initial = input.required<TcAwaySummary["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcAwaySummary["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/away-summary";
  import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";

  let { initial }: { initial: TcAwaySummary["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcAwaySummary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcAwaySummary["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-away-summary bind:this={el} {expanded}></tc-away-summary>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-away-summary")` returns a `TcAwaySummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";`
- **React / Next.js:** Props: `import type { AwaySummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AwaySummary>`. The element class, for refs: `import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAwaySummary["items"]` with `import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";`
- **Angular:** The directive types the template: `[items]` takes `TcAwaySummary["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAwaySummary } from "@adamstavely/trenchcoat/away-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `expanded` | `boolean` | Whether the Done group is open. Controlled when defined |
| `defaultExpanded` | `boolean` | Whether it starts open when uncontrolled |
| `onExpandedChange` | `(expanded: boolean) => void` | The Done group opened or closed |
| `seen` | `boolean` | Whether it shows as seen. Controlled when defined – set it after onSeen |
| `defaultSeen` | `boolean` | Whether it starts seen when uncontrolled |
| `onSeen` | `(ids: string[], event: Event) => void` | Mark all seen, with the ids it showed. Call event.preventDefault() to keep the card |
| `onItemAction` | `(action: string, item: AwayItem, event: Event) => void` | An item's button: "review" (or its own action), "retry" or "open". Call event.preventDefault() to keep a link from being followed |

*Renamed or hidden on the wrapper: `heading`, `review`, `retry`, `open`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between Mark all seen, each item's action and the Done toggle |
| Enter / Space | Acts on the focused button; on the Done toggle, opens or closes the list |

### Screen readers

The card is a `section` named by its heading. Each group is a `section` named by its label and count ("Needs you 2"),
holding a list. An item's button includes what it acts on: "Retry: Tax ID check". The Done toggle is a button with
`aria-expanded` that controls its list. After Mark all seen, a status region says "You're all caught up" and focus
moves to the line that replaced the card.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 16.5 KB | 5.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **25.2 KB** | **8.1 KB** |
| With Lit – the first component on a page | 47.0 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 90 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of items replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.0 ms | items: first render, 970 nodes; update 1.1 ms |
| 1,000 items | 42 ms | items: first render, 9,370 nodes; update 6.1 ms |

1,000 items of items: 42 ms, 9,370 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each item as what happened, in a few words: "Tax ID check for 3 suppliers", not "Task 4182".
- Put why or what came of it in `detail`: "The registry timed out".
- Name the action for what it does when Review is too vague: `action: "Decide"`.
- Keep Needs you and Failed short – three or four items each. More belongs in `agent-recap` or `agent-inbox`.

## Do and don't

### Do

- Show it only when the person was away long enough to miss something.
- Move an item between groups as it's handled – a retried check moves to Done.
- Let Mark all seen clear the card for good in that thread.

### Don't

- Don't list every done item open – the count is the point.
- Don't repeat the thread's own messages; summarise what happened outside it.
- Don't use it as a notification centre for the whole app.

## Related

- [Agent Recap](agent-recap.md) – What your agents did while you were away, for a home page – a small chart of the period with a bar per 15 or 30 minutes stacked by done, failed and needs you and a marker on each notable event, then Needs you, Failed and Done as columns acted on in place, items gliding out as they're handled, and Clear done
- [Digest](digest.md) – A one-minute digest of a pile of information, arranged around what the reader needs – what matters, what to do (ticked off as you go), what changed and what's safe to ignore, with a reading-time estimate and points that cite their sources
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Decision Card](decision-card.md) – One question an agent needs answered before it carries on, docked above the composer – how long it has waited, numbered options with one recommended (focused, never picked), 1–9 to pick, Something else, or Approve and Decline with a reason, a queue to step through, and a receipt with Undo
