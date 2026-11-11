<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Change List

**Workspace & sessions** · New

Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.

- **Element:** `<tc-change-list>`
- **Size:** 12.5 KB gzip · 42.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/change-list";` |
| React / Next.js | `import { ChangeList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/change-list";` · tags starting with tc- are custom elements |
| Angular | `import { ChangeList } from "@adamstavely/trenchcoat/angular/change-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/change-list";` |

## Example

The live example is in the gallery at `#/change-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Proposed code changes as compact rows: a mark for draft, open, merged or closed, the title, where it is, lines added and
removed, and how its checks went. It works from plain data and doesn't talk to any server, so it suits any code host.

### When to use

- A side panel or dashboard listing the changes a session or a person is working on.
- Showing a few recent changes, with the rest behind Show more.

### When not to use

- Edits to prose, accepted word by word – use [Inline Diff](inline-diff.md).
- A record of who did what – use [Audit Trail](../blocks/audit-trail.md).
- The details of one change's checks – use [Check Status](check-status.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-chl__row` – one change
2. **Mark** `.ui-chl__mark` – the state's shape
3. **Title** `.ui-chl__title` – cut off when there isn't room, whole in its tooltip
4. **Where** `.ui-chl__where` – repository and number
5. **Numbers** `.ui-chl__side` – `.ui-chl__add`, `.ui-chl__del` and a compact `tc-check-status`
6. **More** `.ui-chl__more` – opens `.ui-chl__menu`
7. **Show more** `.ui-chl__toggle` – the rest of the list

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. In a narrow place the numbers drop under the title.

## Usage

### HTML

```html
<tc-change-list id="changes"></tc-change-list>

<script type="module">
  import "@adamstavely/trenchcoat/change-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#changes");
  el.items = [{ id: "1", title: "Add freezer locations", repo: "institute/sample-tracker", number: 214, state: "open", additions: 120, deletions: 30 }];
  el.rowActions = [{ id: "copy", label: "Copy link" }];
  el.addEventListener("tc-open", (e) => console.log(e.detail.item.title));
</script>
```

### React / Next.js

```tsx
import { ChangeList, type ChangeItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: ChangeItem[] = [{ id: "1", title: "Add freezer locations", repo: "institute/sample-tracker", number: 214, state: "open", additions: 120, deletions: 30 }];

export function Changes({ onOpen }: { onOpen: (id: string) => void }) {
  return <ChangeList items={items} rowActions={[{ id: "copy", label: "Copy link" }]} onTcOpen={(e) => onOpen(e.detail.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/change-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";

defineProps<{ items: TcChangeList["items"]; rowActions: TcChangeList["rowActions"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-change-list :items="items" :rowActions="rowActions" @tc-open="onOpen"></tc-change-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChangeList } from "@adamstavely/trenchcoat/angular/change-list";
import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";

@Component({
  selector: "app-change-list-example",
  imports: [ChangeList],
  template: `<tc-change-list [items]="items()" [rowActions]="rowActions()" (tc-open)="onOpen($event)"></tc-change-list>`,
})
export class ChangeListExample {
  readonly items = input.required<TcChangeList["items"]>();
  readonly rowActions = input.required<TcChangeList["rowActions"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/change-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";

  let { items, rowActions }: { items: TcChangeList["items"]; rowActions: TcChangeList["rowActions"] } = $props();
  let el: TcChangeList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-change-list bind:this={el} {items} {rowActions}></tc-change-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Changes"` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `ChangeItem[]` | `[]` | The changes, in order |
| `rowActions` | – | `ChangeRowAction[]` | `[]` | What a row's More menu offers; with none there's no More button |
| `limit` | `limit` | `number` | `5` | How many rows show until Show more; anything that isn't a whole number of at least 1 counts as 5 |
| `expanded` | `expanded` | `boolean` | `false` | Every row is showing. Changed by Show more unless a tc-expanded-change listener calls preventDefault() |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `labels` | – | `Partial<ChangeListLabels>` | `{}` | Rename any of the words, over the defaults |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | A row was pressed ({ id, item }: ChangeOpen) |
| `tc-action` | – | No | One of a row's actions was chosen ({ id, itemId, item }: ChangeAction) |
| `tc-expanded-change` | – | Yes | Show more or Show less was pressed ({ expanded }: ChangeExpandedChange); cancelable – prevented, the list stays as it was |

#### Design tokens it reads (39)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultChangeListLabels: ChangeListLabels` | The words used when the page gives none |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-change-list :items="…">` | `<tc-change-list [items]="…">` | `<tc-change-list {items}>` |
| `rowActions` | `el.rowActions = …;` | `<… rowActions={…} />` | `<tc-change-list :rowActions="…">` | `<tc-change-list [rowActions]="…">` | `<tc-change-list {rowActions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-change-list :labels="…">` | `<tc-change-list [labels]="…">` | `<tc-change-list {labels}>` |

*Also attributes: `heading`, `description`, `limit`, `expanded`, `bare`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-change-list id="change-list"></tc-change-list>

<script type="module">
  import "@adamstavely/trenchcoat/change-list";

  const el = document.querySelector("#change-list");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
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
import "@adamstavely/trenchcoat/change-list";
import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";

const props = defineProps<{ initial: TcChangeList["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcChangeList["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-change-list :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-change-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChangeList } from "@adamstavely/trenchcoat/angular/change-list";
import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";

@Component({
  selector: "app-controlled-change-list",
  imports: [ChangeList],
  template: `<tc-change-list [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-change-list>`,
})
export class ControlledChangeList {
  readonly initial = input.required<TcChangeList["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcChangeList["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/change-list";
  import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";

  let { initial }: { initial: TcChangeList["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcChangeList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcChangeList["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-change-list bind:this={el} {expanded}></tc-change-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-change-list")` returns a `TcChangeList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";`
- **React / Next.js:** Props: `import type { ChangeListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChangeList>`. The element class, for refs: `import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChangeList["items"]` with `import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";`
- **Angular:** The directive types the template: `[items]` takes `TcChangeList["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChangeList } from "@adamstavely/trenchcoat/change-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; an empty one draws no header |
| `expanded` | `boolean` | Every row is showing – controlled when given |
| `defaultExpanded` | `boolean` | On mount, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: boolean) => void` | Show more or Show less was pressed |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between rows, or through an open menu |
| ← / → | Move between a row and its More button |
| Home / End | Go to the first or last row or menu item |
| Enter / Space | Open the change, open the menu or choose an action |
| Escape | Close the menu and return to More |

After Show more, focus goes to the first row it revealed.

### Screen readers

The rows are a list named by the heading. Each row's button reads the state, title, where it is, lines added and removed,
and the checks in words. More is named for its row, says it opens a menu and whether it's open.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, check-status, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, check-status, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, check-status, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.9 KB | 5.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [check-status](check-status.md) · Element it renders | 10.4 KB | – |
| **Added to a page that already has Lit** | **42.4 KB** | **12.5 KB** |
| With Lit – the first component on a page | 64.0 KB | 19.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | the gallery demo's data, 157 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of items replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.6 ms | items: first render, 157 nodes; update 0.8 ms |
| 1,000 items | 2.6 ms | items: first render, 157 nodes; update 0.4 ms |

What it renders doesn't grow with items (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the change's own title; don't add its state to it.
- Leave `additions` and `deletions` out when they aren't known, rather than sending 0.

## Do and don't

### Do

- Listen for `tc-open` to open the change wherever the page likes.
- Use `rowActions` for the few things people do from the list.

### Don't

- Don't put provider-specific logic in the page's labels: `state` covers draft, open, merged and closed.
- Don't set a very low `limit` in a place people scan, since a title may be all they get.

## Related

- [Check Status](check-status.md) – The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.
- [Environment List](environment-list.md) – Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Audit Trail](../blocks/audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
