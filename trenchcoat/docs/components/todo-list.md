<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# To-do List

**Inputs & controls** · New

A to-do list people keep themselves – add, tick off, edit in place, move with Alt + arrows and remove with Undo, with All / To do / Done tabs, progress and Clear done

- **Element:** `<tc-todo-list>`
- **Size:** 9.1 KB gzip · 30.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/todo-list";` |
| React / Next.js | `import { TodoList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/todo-list";` · tags starting with tc- are custom elements |
| Angular | `import { TodoList } from "@adamstavely/trenchcoat/angular/todo-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/todo-list";` |

## Example

The live example is in the gallery at `#/todo-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A to-do list people keep themselves. Type a to-do in the box at the top and press Enter (or Add). Tick it off when
it's done, click its words to change them, and move it with Alt + ↑ / ↓. Remove it with ×, which leaves "Removed ·
Undo" until the next removal. Tabs show All, To do and Done with their counts. The foot says how many are done, with
a bar, and Clear done takes the finished ones away.

Every change fires one cancelable event, `tc-items-change`, with the list as it will be and what changed. Keep the
list in your own store by handling it, or let the element keep it.

### When to use

- Someone's own list of things to do: prep for an event, follow-ups after a meeting, a personal checklist beside a
  record.
- A short shared list where anyone may add and tick items off.

### When not to use

- A fixed series of setup steps the product sets – use [Progress Tracker](progress-tracker.md) or
  [Setup Guide](setup-guide.md).
- Work moving through stages with owners and dates – use a task board.
- One yes/no choice – use [Checkbox](checkbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-todo__tabs` – All, To do and Done, each with its count
2. **Add** `.ui-todo__add` – the box for a new to-do and Add
3. **Undo** `.ui-todo__removed` – after a removal, until the next one
4. **To-do** `.ui-todo__item` – its round check box, its words (click to edit) and Remove
5. **Foot** `.ui-todo__foot` – how many are done, with a bar, and Clear done

## Looks

Standard sets the header and tabs on a gray tray above a white card; Clean is one white card with the header as its
first row. Done to-dos are struck through in a muted colour, with a green tick that draws itself. With a mouse,
Remove appears when a to-do is hovered or focused; on touch screens it always shows.

## Usage

### HTML

```html
<tc-todo-list heading="Open day prep"></tc-todo-list>
<script type="module">
  const list = document.querySelector("tc-todo-list");
  list.items = JSON.parse(localStorage.getItem("todos") ?? "[]");
  list.addEventListener("tc-items-change", (e) => localStorage.setItem("todos", JSON.stringify(e.detail.items)));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TodoList, type TodoItem } from "@adamstavely/trenchcoat/react";

export function Prep() {
  const [items, setItems] = useState<TodoItem[]>([{ id: "a", text: "Book the hall" }]);
  return <TodoList title="Open day prep" items={items} onItemsChange={setItems} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/todo-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";

defineProps<{ items: TcTodoList["items"]; labels: TcTodoList["labels"] }>();
const onItemsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-todo-list :items="items" :labels="labels" @tc-items-change="onItemsChange"></tc-todo-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TodoList } from "@adamstavely/trenchcoat/angular/todo-list";
import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";

@Component({
  selector: "app-todo-list-example",
  imports: [TodoList],
  template: `<tc-todo-list [items]="items()" [labels]="labels()" (tc-items-change)="onItemsChange($event)"></tc-todo-list>`,
})
export class TodoListExample {
  readonly items = input.required<TcTodoList["items"]>();
  readonly labels = input.required<TcTodoList["labels"]>();
  onItemsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/todo-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";

  let { items, labels }: { items: TcTodoList["items"]; labels: TcTodoList["labels"] } = $props();
  let el: TcTodoList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-todo-list bind:this={el} {items} {labels}></tc-todo-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"To-do"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `TodoItem[]` | `[]` | The to-dos, in order. Changed by the user unless tc-items-change is prevented |
| `filter` | `filter` | `TodoFilter` | `"all"` | The tab shown. Changed by the user unless tc-filter-change is prevented |
| `addTo` | `add-to` | `"end" \| "start"` | `"end"` | Where new to-dos go |
| `maxLength` | `max-length` | `number` | `200` | The longest a to-do may be |
| `readonly` | `readonly` | `boolean` | `false` | Read only: no adding, ticking, editing or removing |
| `labels` | – | `Partial<TodoLabels>` | `{}` | Words to use instead of the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-items-change` | – | Yes | The list changed ({ items, change }: TodoItemsChange) – added, ticked, edited, moved, removed, restored or cleared; cancelable – prevented, `items` stays as it was |
| `tc-filter-change` | – | Yes | The tab changed ({ filter }: TodoFilterChange); cancelable – prevented, `filter` stays as it was |

#### Design tokens it reads (81)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-success-solid`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-todo-list :items="…">` | `<tc-todo-list [items]="…">` | `<tc-todo-list {items}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-todo-list :labels="…">` | `<tc-todo-list [labels]="…">` | `<tc-todo-list {labels}>` |

*Also attributes: `heading`, `description`, `filter`, `add-to`, `max-length`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-items-change` | Yes | `el.addEventListener("tc-items-change", (e) => …)` | `onItemsChange={…}` | `@tc-items-change="…"` | `(tc-items-change)="…($event)"` | `el.addEventListener("tc-items-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `items` and `filter` itself unless a listener calls `preventDefault()` on `tc-items-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-todo-list id="todo-list"></tc-todo-list>

<script type="module">
  import "@adamstavely/trenchcoat/todo-list";

  const el = document.querySelector("#todo-list");
  el.addEventListener("tc-items-change", (e) => {
    e.preventDefault(); // the element keeps its items…
    if (allowed(e.detail.items)) el.items = e.detail.items; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TodoList } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TodoList>;
type Props = Omit<Own, "items" | "onItemsChange"> & { initial: NonNullable<Own["items"]> };

// Controlled: passing items makes the wrapper prevent the element's own change; the app sets it
export function ControlledTodoList({ initial, ...props }: Props) {
  const [items, setItems] = useState<Own["items"]>(initial);
  return <TodoList {...props} items={items} onItemsChange={(next) => setItems(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/todo-list";
import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";

const props = defineProps<{ initial: TcTodoList["items"] }>();
const items = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onItemsChange = (e: CustomEvent<{ items: TcTodoList["items"] }>) => {
  e.preventDefault();
  items.value = e.detail.items;
};
</script>

<template>
  <tc-todo-list :items="items" @tc-items-change="onItemsChange"></tc-todo-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TodoList } from "@adamstavely/trenchcoat/angular/todo-list";
import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";

@Component({
  selector: "app-controlled-todo-list",
  imports: [TodoList],
  template: `<tc-todo-list [items]="items()" (tc-items-change)="onItemsChange($event)"></tc-todo-list>`,
})
export class ControlledTodoList {
  readonly initial = input.required<TcTodoList["items"]>();
  readonly items = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onItemsChange(e: CustomEvent<{ items: TcTodoList["items"] }>) {
    e.preventDefault();
    this.items.set(e.detail.items);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/todo-list";
  import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";

  let { initial }: { initial: TcTodoList["items"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let items = $derived(initial);
  let el: TcTodoList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      items = (e as CustomEvent<{ items: TcTodoList["items"] }>).detail.items;
    };
    el.addEventListener("tc-items-change", on);
    return () => el.removeEventListener("tc-items-change", on);
  });
</script>

<tc-todo-list bind:this={el} {items}></tc-todo-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-todo-list")` returns a `TcTodoList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";`
- **React / Next.js:** Props: `import type { TodoListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TodoList>`. The element class, for refs: `import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTodoList["items"]` with `import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";`
- **Angular:** The directive types the template: `[items]` takes `TcTodoList["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTodoList } from "@adamstavely/trenchcoat/todo-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `items` | `TodoItem[]` | The to-dos – controlled when given: every change reports the next list through onItemsChange |
| `defaultItems` | `TodoItem[]` | The to-dos on mount when `items` isn't controlled |
| `onItemsChange` | `(next: TodoItem[], change: TodoItemsChange["change"]) => void` | The list changed; `next` is the list as it will be, `change` what happened |
| `filter` | `TodoFilter` | The tab shown – controlled when given |
| `defaultFilter` | `TodoFilter` | The tab on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: TodoFilter) => void` | The tab changed |

*Renamed or hidden on the wrapper: `heading`, `items`, `filter`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Enter in the new to-do box | Adds it |
| Space on a to-do's box | Ticks it off, or back |
| Alt + ↑ / ↓ on a to-do's box | Moves it up or down |
| Enter on a to-do's words | Edits them in place |
| Enter / Escape while editing | Keeps / puts back the words; emptied, the to-do is removed |
| ← / → on the tabs | All, To do, Done |

### Screen readers

- The list is a list named by the heading. Each box is a checkbox named by its to-do. The words are a button,
  "Order name badges, edit", and Remove says which to-do it removes.
- The tabs are a `tablist`, and the list is their `tabpanel`.
- Adding, ticking, editing, moving, removing and Undo are announced in a polite status line. After a removal, focus
  goes to Undo.
- The bar is a `progressbar`: "3 of 6 done".

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

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.9 KB | 7.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.3 KB** | **9.1 KB** |
| With Lit – the first component on a page | 52.6 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 109 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.7 ms | items: first render, 1,237 nodes; update 0.7 ms |
| 1,000 items | 59 ms | items: first render, 12,037 nodes; update 7.9 ms |

1,000 items of items: 59 ms. It renders every item, so a first render passes 50 ms (a long task) at about 840 items – page or filter longer lists.

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

- Start each to-do with a verb: "Send the poster files", "Book the hall".
- Keep them to one line; `max-length` (200) stops pasted essays.
- Give every to-do its own id. Any string works ("1.5", "task:1", "a b"); if two share one, the first is kept and
  the others are dropped, so ticking or removing always acts on one to-do.
- Rename the words for your product's voice with `labels` ("Task" instead of "To-do", say).

## Do and don't

### Do

- Save the list where the person will find it again (`tc-items-change` gives you the whole list each time).
- Put new to-dos where people look: the end of the list by default, `add-to="start"` for a stack.

### Don't

- Ask for confirmation before removing – Undo is quicker and safer.
- Use it for steps the product checks off by itself.

## Related

- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Checkbox](checkbox.md) – A form-associated boolean choice
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each

## Changelog

- **To-do List** (`tc-todo-list`) – add a to-do (Enter), tick it off, click its words to edit them, move it with Alt + ↑ / ↓, remove it with Undo; All / To do / Done tabs with counts, a done bar and Clear done. One cancelable `tc-items-change` carries the whole next list and what changed, so a page can keep it in its own store.
