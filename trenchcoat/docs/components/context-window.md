<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Context Window

**Agents**

What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear

- **Element:** `<tc-context-window>`
- **Size:** 13.8 KB gzip · 55.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/context-window";` |
| React / Next.js | `import { ContextWindow } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/context-window";` · tags starting with tc- are custom elements |
| Angular | `import { ContextWindow } from "@adamstavely/trenchcoat/angular/context-window";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/context-window";` |

## Example

The live example is in the gallery at `#/context-window`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What fills an AI model's context right now, and what someone can do about it. The window is a field of small cells,
each a slice of the token limit, coloured by what sits in it – the system prompt, tools, files, the conversation,
memory – with the empty cells as the room that's left. People can open a part to remove single files or tools, and
compact the conversation: its cells shimmer while it works, then most of them clear. The percentage turns amber as
the window nears its limit, and the caption says how much is left.

### When to use

- A chat or agent screen where long sessions run out of context and people need to see why.
- Letting people free room themselves – dropping a large file, a tool they don't need, or compacting the history.
- A settings or debug panel that explains what a model is being sent.

### When not to use

- Showing each attachment as a chip in the composer, with its weight – use [Context Tray](context-tray.md).
- Explaining what a compaction kept and dropped – use [Compact Breakdown](compact-breakdown.md).
- Usage against a plan or a billing limit – use [Usage Meter](usage-meter.md).
- A map of which sources an answer drew on – use [Context Map](context-map.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a gauge icon, the title and the model tag
2. **Figure** `.ui-cw__figure` – tokens used, “of 200K tokens” and the percentage
3. **Field** `.ui-cw__field` – the cells, coloured by part, empty for the room left
4. **Parts** `.ui-cw__parts` – one row per part, with its swatch, Compact and size
5. **Caption** `.ui-cw__caption` – what's left, what was saved, or the hovered part's share
6. **Action** `.ui-cw__action` – an optional button such as “New chat”

## Looks

Standard is a white card on a gray tray: the header sits on the tray above the card, the caption and the action below it, the percentage
is a pill, and the icons are 12px. Clean is one white card with hairline shadows: the header is its first row, the
caption and the action its last row, the percentage is a tag, the icons are 16px with finer strokes, and “Compacting…” shimmers. In a narrow
container both lay the field out with two thirds as many columns.

## Usage

### HTML

```html
<tc-context-window id="ctx" limit="200000" model="Opus 5.5" action-label="New chat"></tc-context-window>

<script type="module">
  import "@adamstavely/trenchcoat/context-window";
  import "@adamstavely/trenchcoat/tokens.css";

  const ctx = document.querySelector("#ctx");
  ctx.parts = [
    { id: "system", label: "System prompt", tokens: 4200, locked: true },
    { id: "files", label: "Files", items: [{ id: "spec", label: "billing-spec.md", tokens: 18600 }] },
    { id: "chat", label: "Conversation", tokens: 24000, compact: 0.25 },
  ];
  ctx.onCompact = async (partId, { signal }) => {
    await fetch(`/api/compact/${partId}`, { method: "POST", signal });
  };
  ctx.addEventListener("tc-remove-item", (e) => console.log(e.detail.partId, e.detail.itemId));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ContextWindow, type ContextPart } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Context() {
  const [parts, setParts] = useState<ContextPart[]>([
    { id: "system", label: "System prompt", tokens: 4200, locked: true },
    { id: "files", label: "Files", items: [{ id: "spec", label: "billing-spec.md", tokens: 18600 }] },
    { id: "chat", label: "Conversation", tokens: 24000, compact: 0.25 },
  ]);
  return (
    <ContextWindow
      model="Opus 5.5"
      limit={200_000}
      parts={parts}
      onRemoveItem={(partId, itemId) =>
        setParts((ps) => ps.map((p) => (p.id === partId && p.items ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p)))
      }
      action={{ label: "New chat", onClick: () => console.log("New chat") }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/context-window";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";

defineProps<{ parts: TcContextWindow["parts"]; modelIcon: TcContextWindow["modelIcon"] }>();
const onRemoveItem = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-context-window :parts="parts" :modelIcon="modelIcon" @tc-remove-item="onRemoveItem"></tc-context-window>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ContextWindow } from "@adamstavely/trenchcoat/angular/context-window";
import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";

@Component({
  selector: "app-context-window-example",
  imports: [ContextWindow],
  template: `<tc-context-window [parts]="parts()" [modelIcon]="modelIcon()" (tc-remove-item)="onRemoveItem($event)"></tc-context-window>`,
})
export class ContextWindowExample {
  readonly parts = input.required<TcContextWindow["parts"]>();
  readonly modelIcon = input.required<TcContextWindow["modelIcon"]>();
  onRemoveItem(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/context-window";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";

  let { parts, modelIcon }: { parts: TcContextWindow["parts"]; modelIcon: TcContextWindow["modelIcon"] } = $props();
  let el: TcContextWindow;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-remove-item", on);
    return () => el.removeEventListener("tc-remove-item", on);
  });
</script>

<tc-context-window bind:this={el} {parts} {modelIcon}></tc-context-window>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Context window"` | The heading, and the group's name |
| `parts` | – | `ContextPart[]` | `[]` | What fills the window, in order – each part takes the next run of cells |
| `limit` | `limit` | `number` | `0` | Size of the context window in tokens |
| `model` | `model` | `string` | `""` | Small tag in the head, e.g. the model name |
| `modelIcon` | – | `Element \| undefined` | `undefined` | Logo in front of the model name, an element that's cloned, sized to 12px |
| `actionLabel` | `action-label` | `string` | `""` | Label of a button on the tray (Clean: in the card's last row), e.g. "New chat" – it fires tc-action |
| `warnAt` | `warn-at` | `number` | `0.8` | Share of the limit from which the card warns (0–1) |
| `cells` | `cells` | `number` | `216` | Number of cells and how many sit in one row |
| `columns` | `columns` | `number` | `36` | How many cells sit in one row (two thirds of it, at least 8, in a narrow container) |
| `onCompact` | – | `ContextCompactAction \| undefined` | `undefined` | Called when Compact is pressed; the cells shimmer until the returned promise settles, and a rejection says so and leaves Compact to press again. The signal aborts when the element is removed. Once it settles the part shows its `compact` share at once, until `parts` brings a new size for it |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-remove-item` | – | No | An item was removed (`{ partId: string; itemId: string }`); it stays hidden until `parts` brings a different list of items for that part |
| `tc-compact` | – | No | Compact was pressed (`{ partId: string }`); `onCompact` may return a promise the cells wait for |
| `tc-action` | – | No | The tray's action button was pressed (`{ label: string }`) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-context-window-series-1` | `light-dark(rgba(0, 96, 226, 0.765), #4d8dff)` | standard, clean |
| `--tc-context-window-series-2` | `light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.7))` | standard, clean |
| `--tc-context-window-series-3` | `light-dark(rgba(0, 96, 226, 0.26), rgba(77, 141, 255, 0.46))` | standard, clean |
| `--tc-context-window-series-4` | `light-dark(rgba(91, 91, 214, 0.8), #7b7bec)` | standard, clean |
| `--tc-context-window-series-5` | `light-dark(rgba(26, 154, 82, 0.72), #3ec27a)` | standard, clean |
| `--tc-context-window-series-6` | `light-dark(rgba(232, 162, 12, 0.8), #f0b43a)` | standard, clean |

#### Design tokens it reads (88)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-context-window-color`, `--tc-context-window-cols`, `--tc-context-window-cols-narrow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `parts` | `el.parts = …;` | `<… parts={…} />` | `<tc-context-window :parts="…">` | `<tc-context-window [parts]="…">` | `<tc-context-window {parts}>` |
| `modelIcon` | `el.modelIcon = …;` | `<… modelIcon={…} />` | `<tc-context-window :modelIcon="…">` | `<tc-context-window [modelIcon]="…">` | `<tc-context-window {modelIcon}>` |
| `onCompact` | `el.onCompact = …;` | `<… onCompact={…} />` | `<tc-context-window :onCompact="…">` | `<tc-context-window [onCompact]="…">` | `<tc-context-window {onCompact}>` |

*Also attributes: `heading`, `limit`, `model`, `action-label`, `warn-at`, `cells`, `columns` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-remove-item` | No | `el.addEventListener("tc-remove-item", (e) => …)` | `onRemoveItem={…}` | `@tc-remove-item="…"` | `(tc-remove-item)="…($event)"` | `el.addEventListener("tc-remove-item", …)` |
| `tc-compact` | No | `el.addEventListener("tc-compact", (e) => …)` | `ref.current.addEventListener("tc-compact", …)` | `@tc-compact="…"` | `(tc-compact)="…($event)"` | `el.addEventListener("tc-compact", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onClick={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-context-window")` returns a `TcContextWindow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";`
- **React / Next.js:** Props: `import type { ContextWindowProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ContextWindow>`. The element class, for refs: `import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcContextWindow["parts"]` with `import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";`
- **Angular:** The directive types the template: `[parts]` takes `TcContextWindow["parts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcContextWindow } from "@adamstavely/trenchcoat/context-window";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `parts` | `ContextPart[]` | What fills the window, in order – each part takes the next run of cells |
| `limit` | `number` | Size of the context window in tokens |
| `title` | `string` | The heading, and the group's name |
| `modelIcon` | `React.ReactNode` | Logo in front of the model name – any node, sized to 12px |
| `onRemoveItem` | `(partId: string, itemId: string) => void` | Called when an item is removed. The card hides the item at once and keeps it hidden until `parts` brings a different list of items for that part – so `parts` stays the source of truth, whether you handle the removal or only listen to it |
| `action` | `{ label: string; onClick: () => void }` | A button on the tray (Clean: in the card's last row), e.g. { label: "New chat", onClick } |

*Renamed or hidden on the wrapper: `heading`, `modelIcon`, `actionLabel`, `limit`, `parts`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the part buttons, Compact, each open part's × buttons and the action |
| Enter / Space | Opens or closes a part's items; presses Compact, × or the action |

Focusing a part's button or Compact lights that part's cells, as hovering does. When an item is removed, focus moves
to the next item's ×, else the previous one, else the part's button; when Compact folds away, focus moves on to the
next control in the card.

### Screen readers

The host is a group named by the heading. The figure is read as one sentence – “84.4K of 200.0K tokens used, 42
percent”; the field, the rolling numbers and the hover caption are hidden. Parts with items are buttons with
`aria-expanded` and `aria-controls`; closed item lists are inert. Compact is named “Compact Conversation”, then
“Conversation is compacted”, and is `aria-disabled` while another compaction runs. A status region announces results
and warnings: “Compacting Conversation…”, “Saved 18K tokens”, “Couldn't compact Conversation – try again”, “Removed
billing-spec.md”, “Context window is almost full” and “Context window is full”.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
| Safari (macOS) | **17.5** | light-dark() |
| Safari (iOS, iPadOS) | **17.5** | light-dark() |

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 46.4 KB | 11.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **55.4 KB** | **13.9 KB** |
| With Lit – the first component on a page | 78.1 KB | 21.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 359 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of parts replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | parts: first render, 2,468 nodes; update 2.3 ms |
| 1,000 items | 102 ms | parts: first render, 22,448 nodes; update 17 ms |

1,000 items of parts: 102 ms. It renders every item, so a first render passes 50 ms (a long task) at about 490 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (clean), 3 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 5 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name parts by what people recognise: “System prompt”, “Tools”, “Files”, “Conversation”, “Memory”.
- Label items by the file or tool name people attached – “billing-spec.md”, “GitHub”.
- Keep `model` to the model's short name, e.g. “Opus 5.5”.
- Make the action a next step in two words or fewer: “New chat”.

## Do and don't

### Do

- Mark the system prompt `locked`, so it can't be removed or compacted.
- Give `compact` only to parts that can be summarised, usually the conversation; set the number to the share that
  stays if you know it.
- Return a promise from `onCompact` and reject it on failure – the cells shimmer until it settles and the caption says
  when it failed.
- Update `parts` when an item is removed or a compaction finishes; the card keeps its own change only until you do.

### Don't

- Don't use `color` to make two parts look the same – people match rows to cells by colour.
- Don't set `warnAt` so high the warning comes too late to act on; 0.8 leaves room.
- Don't use it as a live meter that moves every keystroke – the numbers roll and the cells redraw.

## Related

- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Compact Breakdown](compact-breakdown.md) – A total split into its parts in one small card – numbers roll, the bar glides and the ranked rows trade places when the period changes
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Context Map](context-map.md) – What fills an agent's context window, as a living treemap – system prompt, tools, memory, every file, the chat and tool results as tiles that glide as it grows, the free space dashed, and compaction squeezing old turns into a summary

## Changelog

- context-window: Clean's "Compacting…" shine runs 3 times and rests, like every other shimmer (it ran endlessly).
