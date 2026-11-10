<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Bulk Action Bar

**Inputs & controls** · New

What can be done to everything selected – how many, the page's actions, Select all and Clear, a question before danger, and Undo for a few seconds afterwards

- **Element:** `<tc-bulk-action-bar>`
- **Size:** 6.0 KB gzip · 17.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/bulk-action-bar";` |
| React / Next.js | `import "@adamstavely/trenchcoat/bulk-action-bar";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/bulk-action-bar";` · tags starting with tc- are custom elements |
| Angular | `import { BulkActionBar } from "@adamstavely/trenchcoat/angular/bulk-action-bar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/bulk-action-bar";` |

## Example

The live example is in the gallery at `#/bulk-action-bar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What can be done to everything selected. It appears when `count` is above zero, says how many, and offers the page's actions with Select all and Clear. A danger action can ask first, naming how many, and Undo stays for a few seconds after an action.

### When to use

- A list or table where people select several items and act on them together.
- Flagging, sharing or removing many files at once.

### When not to use

- Actions on one item – put them on its row.
- A general app toolbar that doesn't depend on a selection.
- Selecting the items themselves – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-bab__bar` – the toolbar
2. **Count** `.ui-bab__count` – how many are selected
3. **Action** `.ui-bab__action` – one of the page's actions
5. **Question** `.ui-bab__question` – asked before a danger action with `confirm`
6. **Undo** `.ui-bab__undo` – on offer after an action, with `.ui-bab__left` for the time left

## Looks

The same in Standard and Clean, drawn from the shared button tokens. `sticky` keeps it at the bottom of the scrolling area.

## Usage

### HTML

```html
<tc-bulk-action-bar id="bar" count="3" total="40"></tc-bulk-action-bar>

<script type="module">
  import "@adamstavely/trenchcoat/bulk-action-bar";
  import "@adamstavely/trenchcoat/tokens.css";

  const bar = document.querySelector("#bar");
  bar.actions = [{ id: "flag", label: "Flag" }, { id: "remove", label: "Remove", danger: true, confirm: true }];
  bar.addEventListener("tc-action", (e) => console.log(e.detail.action.id, e.detail.count));
</script>
```

### React / Next.js

```tsx
import { BulkActionBar, type BulkAction } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const actions: BulkAction[] = [{ id: "flag", label: "Flag" }];

export function Selected({ count, onClear }: { count: number; onClear: () => void }) {
  return <BulkActionBar count={count} total={40} actions={actions} onTcClear={onClear} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/bulk-action-bar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";

defineProps<{ actions: TcBulkActionBar["actions"]; labels: TcBulkActionBar["labels"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-bulk-action-bar :actions="actions" :labels="labels" @tc-action="onAction"></tc-bulk-action-bar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BulkActionBar } from "@adamstavely/trenchcoat/angular/bulk-action-bar";
import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";

@Component({
  selector: "app-bulk-action-bar-example",
  imports: [BulkActionBar],
  template: `<tc-bulk-action-bar [actions]="actions()" [labels]="labels()" (tc-action)="onAction($event)"></tc-bulk-action-bar>`,
})
export class BulkActionBarExample {
  readonly actions = input.required<TcBulkActionBar["actions"]>();
  readonly labels = input.required<TcBulkActionBar["labels"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bulk-action-bar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";

  let { actions, labels }: { actions: TcBulkActionBar["actions"]; labels: TcBulkActionBar["labels"] } = $props();
  let el: TcBulkActionBar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-bulk-action-bar bind:this={el} {actions} {labels}></tc-bulk-action-bar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `count` | `count` | `number` | `0` | How many are selected. At zero the bar isn't shown, unless Undo is on offer |
| `total` | `total` | `number \| undefined` | `undefined` | How many there are in all; offers Select all while count is below it |
| `actions` | – | `BulkAction[]` | `[]` | What can be done to them |
| `undoSeconds` | `undo-seconds` | `number` | `8` | How long Undo stays, in seconds |
| `sticky` | `sticky` | `boolean` | `false` | Stay at the bottom of the scrolling area |
| `labels` | – | `Partial<BulkActionBarLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | Yes | An action was chosen and confirmed ({ action, count }: BulkActionDetail); cancelable – prevented, no Undo is offered |
| `tc-select-all` | – | No | Select all was pressed (detail: null) |
| `tc-clear` | – | No | Clear was pressed (detail: null) |
| `tc-undo` | – | Yes | Undo was pressed ({ action }: BulkUndoDetail); cancelable – prevented, Undo stays on offer |

#### Design tokens it reads (25)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-text-primary`, `--tc-text-secondary`

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
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-bulk-action-bar :actions="…">` | `<tc-bulk-action-bar [actions]="…">` | `<tc-bulk-action-bar {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-bulk-action-bar :labels="…">` | `<tc-bulk-action-bar [labels]="…">` | `<tc-bulk-action-bar {labels}>` |

*Also attributes: `count`, `total`, `undo-seconds`, `sticky` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `ref.current.addEventListener("tc-action", …)` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-select-all` | No | `el.addEventListener("tc-select-all", (e) => …)` | `ref.current.addEventListener("tc-select-all", …)` | `@tc-select-all="…"` | `(tc-select-all)="…($event)"` | `el.addEventListener("tc-select-all", …)` |
| `tc-clear` | No | `el.addEventListener("tc-clear", (e) => …)` | `ref.current.addEventListener("tc-clear", …)` | `@tc-clear="…"` | `(tc-clear)="…($event)"` | `el.addEventListener("tc-clear", …)` |
| `tc-undo` | Yes | `el.addEventListener("tc-undo", (e) => …)` | `ref.current.addEventListener("tc-undo", …)` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-action`, `tc-undo` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-bulk-action-bar")` returns a `TcBulkActionBar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";`
- **React / Next.js:** The element class: `import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBulkActionBar["actions"]` with `import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";`
- **Angular:** The directive types the template: `[actions]` takes `TcBulkActionBar["actions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBulkActionBar } from "@adamstavely/trenchcoat/bulk-action-bar";`

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between the bar's buttons |
| Home / End | Go to the first or last button |
| Enter / Space | Press a button |
| Escape | Backs out of a question |

It's one tab stop. After an action, focus goes to Undo.

### Screen readers

It's a `toolbar` with a name. `role="status"` announces the count as it changes, what an action did, and when it's been undone. A question names how many it will affect.

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
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This component alone** | 10.4 KB | 4.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **17.5 KB** | **6.1 KB** |
| With Lit – the first component on a page | 37.1 KB | 12.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 10 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of actions replaced |
| First on the page | 1.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.4 ms | actions: first render, 107 nodes; update 0.2 ms |
| 1,000 items | 17 ms | actions: first render, 1,007 nodes; update 7.3 ms |

1,000 items of actions: 17 ms, 1,007 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Name actions with a plain verb. Say `confirm` on anything hard to undo. Set `undoable: false` on an action you can't reverse, and don't offer Undo for it.

## Do and don't

### Do

- Keep the selection in the page, and pass `count` and `total`.
- Do the work on `tc-action`, and reverse it on `tc-undo`.
- Delay a destructive change on the server until Undo has passed, if you can.

### Don't

- Don't promise Undo for an action your server can't reverse.

## Related

- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Access Review](../blocks/access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
- [Team Flag Picker](team-flag-picker.md) – Picks one of a team's flags for a file – a small button with the flag's colour and name, opening a list of flags with what each one means.
- [Toaster](toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
