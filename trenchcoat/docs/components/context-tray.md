<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Context Tray

**AI & chat** · New

What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window

- **Element:** `<tc-context-tray>`
- **Size:** 11.1 KB gzip · 36.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/context-tray";` |
| React / Next.js | `import { ContextTray } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/context-tray";` · tags starting with tc- are custom elements |
| Angular | `import { ContextTray } from "@adamstavely/trenchcoat/angular/context-tray";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/context-tray";` |

## Example

The live example is in the gallery at `#/context-tray`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What the model can see in a conversation, as chips: the files, people (@-mentions) and sources attached, each with
how many tokens it takes. A thin meter shows the total against the context window, with one segment per chip, so
people can see what's heavy and make room. They pin what must survive when the conversation is compacted and remove
what's no longer needed – and undo a removal from the tray or with ⌘Z. The tray warns as the window fills up.

### When to use

- Under or beside a chat composer, to show what's attached to the next message or the whole conversation.
- When context is limited and people need to choose what stays – long documents, logs, large sources.
- Agent runs that pull sources in on their own, so people can see and correct what was added.

### When not to use

- Only the total against the window, without the individual items – use [Context Window](context-window.md).
- Adding files, people or sources while typing – use [Mention Picker](mention-picker.md), then show the result here.
- Long-term facts the assistant remembers across conversations – use [Memory Panel](memory-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a paperclip, the title, the number of chips and the total against the window
2. **Meter** `.ui-ctt__meter` – the window, one segment per chip plus the reserved part
3. **Chip** `.ui-ctt__chip` – one file, person or source with its token weight
4. **Pin** `.ui-ctt__pin` – the chip's icon; pins it to keep it through compaction
5. **Remove** `.ui-ctt__remove` – × takes the chip out of context
6. **Caption** `.ui-ctt__foot` – what's free or over, the last removal, and Undo

## Looks

Standard is a white card on a gray tray, with the header in the tray above the card and the caption and Undo below
it. Clean is one white card with a hairline shadow, the header as its first row, quieter chips and thinner icons, and
the caption as its last row. In both, hovering a
chip lights its segment in the meter, and a removed chip folds away.

## Usage

### HTML

```html
<tc-context-tray id="context" limit="200000" reserved="46000"></tc-context-tray>

<script type="module">
  import "@adamstavely/trenchcoat/context-tray";
  import "@adamstavely/trenchcoat/tokens.css";

  const tray = document.querySelector("#context");
  tray.items = [
    { id: "spec", label: "billing-spec.md", kind: "file", tokens: 18600, pinned: true, hint: "docs/billing-spec.md" },
    { id: "priya", label: "@Priya Shah", kind: "mention", tokens: 1200 },
  ];
  tray.addEventListener("tc-items-change", (e) => console.log(e.detail.change.type, e.detail.change.item.label));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ContextTray, type ContextTrayEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Attached() {
  const [items, setItems] = useState<ContextTrayEntry[]>([
    { id: "spec", label: "billing-spec.md", kind: "file", tokens: 18600, pinned: true },
    { id: "stripe", label: "Stripe API reference", kind: "source", tokens: 34800, hint: "stripe.com/docs/api" },
  ]);
  return <ContextTray items={items} limit={200_000} reserved={46_000} onChange={(next) => setItems(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/context-tray";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";

defineProps<{ items: TcContextTray["items"] }>();
const onItemsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-context-tray :items="items" @tc-items-change="onItemsChange"></tc-context-tray>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ContextTray } from "@adamstavely/trenchcoat/angular/context-tray";
import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";

@Component({
  selector: "app-context-tray-example",
  imports: [ContextTray],
  template: `<tc-context-tray [items]="items()" (tc-items-change)="onItemsChange($event)"></tc-context-tray>`,
})
export class ContextTrayExample {
  readonly items = input.required<TcContextTray["items"]>();
  onItemsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/context-tray";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";

  let { items }: { items: TcContextTray["items"] } = $props();
  let el: TcContextTray;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-context-tray bind:this={el} {items}></tc-context-tray>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"In context"` | The heading, and the group's name |
| `items` | – | `ContextTrayItem[]` | `[]` | The chips, in order |
| `limit` | `limit` | `number` | `0` | Size of the context window in tokens (0: no meter, only the total) |
| `reserved` | `reserved` | `number` | `0` | Tokens already in the window besides these items – system prompt, tools, the conversation |
| `warnAt` | `warn-at` | `number` | `0.8` | Share of the limit from which the tray warns (0–1) |
| `undoTimeout` | `undo-timeout` | `number` | `6000` | How long Undo stays after a removal, in ms (0: no undo) |
| `emptyText` | `empty-text` | `string` | `"Nothing in context yet – type @ to add files, people or sources"` | What the tray says with no items |
| `used` | – | `` | – | Tokens in the window: the reserved part plus every item |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-items-change` | – | Yes | `items` is about to change (`ContextTrayItemsChange`: `{ items, change: { type, item } }`, type "remove" \| "restore" \| "pin" \| "unpin"). Cancelable: preventDefault() keeps the current items (controlled use) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `undo()` | `void` | Puts the last removed item back (what Undo and ⌘Z do); false when there's nothing to undo |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-context-tray-file` | `var(--tc-chart-1)` | standard, clean |
| `--tc-context-tray-source` | `var(--tc-chart-3)` | standard, clean |
| `--tc-context-tray-mention` | `var(--tc-chart-2)` | standard, clean |
| `--tc-context-tray-other` | `var(--tc-chart-4)` | standard, clean |
| `--tc-context-tray-reserved` | `var(--tc-chart-neutral)` | standard, clean |

#### Design tokens it reads (75)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-chart-3`, `--tc-chart-4`, `--tc-chart-5`, `--tc-chart-neutral`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-context-tray :items="…">` | `<tc-context-tray [items]="…">` | `<tc-context-tray {items}>` |

*Also attributes: `heading`, `limit`, `reserved`, `warn-at`, `undo-timeout`, `empty-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-items-change` | Yes | `el.addEventListener("tc-items-change", (e) => …)` | `ref.current.addEventListener("tc-items-change", …)` | `@tc-items-change="…"` | `(tc-items-change)="…($event)"` | `el.addEventListener("tc-items-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `items` itself unless a listener calls `preventDefault()` on `tc-items-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-context-tray id="context-tray"></tc-context-tray>

<script type="module">
  import "@adamstavely/trenchcoat/context-tray";

  const el = document.querySelector("#context-tray");
  el.addEventListener("tc-items-change", (e) => {
    e.preventDefault(); // the element keeps its items…
    if (allowed(e.detail.items)) el.items = e.detail.items; // …until the app sets it
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
import "@adamstavely/trenchcoat/context-tray";
import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";

const props = defineProps<{ initial: TcContextTray["items"] }>();
const items = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onItemsChange = (e: CustomEvent<{ items: TcContextTray["items"] }>) => {
  e.preventDefault();
  items.value = e.detail.items;
};
</script>

<template>
  <tc-context-tray :items="items" @tc-items-change="onItemsChange"></tc-context-tray>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ContextTray } from "@adamstavely/trenchcoat/angular/context-tray";
import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";

@Component({
  selector: "app-controlled-context-tray",
  imports: [ContextTray],
  template: `<tc-context-tray [items]="items()" (tc-items-change)="onItemsChange($event)"></tc-context-tray>`,
})
export class ControlledContextTray {
  readonly initial = input.required<TcContextTray["items"]>();
  readonly items = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onItemsChange(e: CustomEvent<{ items: TcContextTray["items"] }>) {
    e.preventDefault();
    this.items.set(e.detail.items);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/context-tray";
  import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";

  let { initial }: { initial: TcContextTray["items"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let items = $derived(initial);
  let el: TcContextTray;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      items = (e as CustomEvent<{ items: TcContextTray["items"] }>).detail.items;
    };
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-context-tray bind:this={el} {items}></tc-context-tray>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-context-tray")` returns a `TcContextTray` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";`
- **React / Next.js:** Props: `import type { ContextTrayProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ContextTray>`. The element class, for refs: `import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcContextTray["items"]` with `import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";`
- **Angular:** The directive types the template: `[items]` takes `TcContextTray["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcContextTray } from "@adamstavely/trenchcoat/context-tray";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the group's name (default "In context") |
| `items` | `ContextTrayEntry[]` | The chips. Controlled when given; otherwise the tray keeps its own, starting at `defaultItems` |
| `defaultItems` | `ContextTrayEntry[]` | The starting chips when `items` isn't given |
| `onChange` | `(items: ContextTrayEntry[], change: ContextTrayChange) => void` | Every remove, undo (restore), pin and unpin, with the items after it |

*Renamed or hidden on the wrapper: `heading`, `onChange`, `In context`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves into the chips (one stop), then on to Undo when it's there |
| → / ← | Moves to the next or previous button – each chip has Pin, then Remove |
| Home / End | Moves to the first or last button |
| Enter / Space | Pins or unpins the chip, or removes it |
| Delete / Backspace | Removes the chip in focus |
| ⌘Z / Ctrl Z | Puts back the last removed chip, while focus is in the tray |

When a chip is removed, focus moves to the same button on the next chip, else the one before, else Undo.

### Screen readers

The tray is a group named by its heading (“In context”). The total is read as “86.1K of 200K tokens used, 43
percent, 4 items”. The chips are a toolbar (“In context: 4 items”); each chip is a group named with its weight
(“billing-spec.md, 18.6K tokens, pinned”) holding a “Pin billing-spec.md” toggle button (`aria-pressed`) and a
“Remove billing-spec.md” button. A status region says what changed: “Removed stripe-webhooks.log. Undo is in the
tray”, “Put back stripe-webhooks.log”, “Pinned schema.prisma”, and “Context window is almost full” or “Context is
over the window” when the level changes. The meter itself is hidden; Undo carries `aria-keyshortcuts`.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 27.7 KB | 8.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.9 KB** | **11.2 KB** |
| With Lit – the first component on a page | 59.6 KB | 18.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 78 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 9.4 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.8 ms | items: first render, 1,423 nodes; update 1.5 ms |
| 1,000 items | 81 ms | items: first render, 14,023 nodes; update 17 ms |

1,000 items of items: 81 ms. It renders every item, so a first render passes 50 ms (a long task) at about 620 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RollingController).
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `performance.now()` (internal/controllers – RollingController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the name people know the item by: the file name, “@Priya Shah”, the page title – with the path or URL in `hint`.
- Set `reserved` to what the system prompt, tools and conversation already take, so the total is honest.
- Write `emptyText` as how to add something: the default is “Nothing in context yet – type @ to add files, people or
  sources”.
- Keep the heading short – it names the group and the toolbar.

## Do and don't

### Do

- Use `kind` (`file`, `mention`, `source`) so each chip gets the right icon and meter colour.
- Pass the real context window as `limit`; without it the tray shows only the total.
- Keep the items in your own state through `tc-items-change` (React: `onChange`) when other parts of the app add them.

### Don't

- Don't round token counts yourself – the tray shortens them (“18.6K”).
- Don't turn off undo (`undoTimeout` 0) – removing a source by accident is easy and costly to redo.
- Don't show it when the model has no context limit people can act on.

## Related

- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray

## Changelog

- `tc-context-tray` – what's in context as chips with token weights, a meter against the window with a reserved share, pin, remove with undo (⌘/Ctrl+Z), and a warning near the limit. Toolbar keyboard; `tc-items-change` (cancelable).
- chat-composer (the Lit element and `trenchcoat/react`): opt-in `mentions` (a `tc-mention-picker` on the message) and `context` / `context-limit` (a `tc-context-tray` above it). Without them it renders as before.
