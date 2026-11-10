<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Memory Panel

**AI & chat**

What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray

- **Element:** `<tc-memory-panel>`
- **Size:** 16.6 KB gzip · 73.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/memory-panel";` |
| React / Next.js | `import { MemoryPanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/memory-panel";` · tags starting with tc- are custom elements |
| Angular | `import { MemoryPanel } from "@adamstavely/trenchcoat/angular/memory-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/memory-panel";` |

## Example

The live example is in the gallery at `#/memory-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What an AI assistant remembers about someone, and a calm place to change it. Memories are short facts grouped by
category, each with where it came from and when. People can filter by category or search, edit a memory in place,
pause it so it isn't used in answers, or forget it – with Undo on the tray for a few seconds. A master switch turns
memory off without deleting anything, and “New memory” adds one by hand.

### When to use

- A settings page or side panel where people review and correct what the assistant has learned about them.
- Giving people control over personal data the product keeps – pause, forget and an off switch in one place.
- Up to a few dozen short facts; the list scrolls past `maxHeight`.

### When not to use

- Saved prompts or instructions people reuse – use [Prompt Library](prompt-library.md).
- What sits in the model's context for this conversation – use [Context Window](context-window.md).
- A list of past conversations – use [Chat History](chat-history.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a brain icon and the title, with the count and the “Use memory” switch at the right
2. **Filters** `.ui-mp__chips` – All and one chip per category, with counts; search sits beside them
3. **Memory** `.ui-mp__item` – the fact, where it came from and when, and Paused
4. **Actions** `.ui-mp__acts` – Edit, Pause or Resume, and Forget
5. **New memory** `.ui-mp__add` – unfolds into an editor with a category picker
6. **Tray** `.ui-mp__foot` – the counts or what you point at, then Undo after a forget

## Looks

Standard is a white card on a gray tray: the counts, Undo and the action sit on the tray below the card, chips are
outlined when picked, and the icons are 14px outlines. Clean is one white card with hairline shadows: the tray is
the card's last row, the picked chip is a soft gray fill, and the icons are 16px with thin strokes or solid shapes.
Both fold rows and groups away instead of letting them jump, and in a narrow panel the chips drop their counts and
the switch keeps only its track.

## Usage

### HTML

```html
<tc-memory-panel id="memory" max-height="320" undo-for="8000"></tc-memory-panel>

<script type="module">
  import "@adamstavely/trenchcoat/memory-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#memory");
  panel.categories = ["Work", "Preferences"];
  panel.memories = [
    { id: "w1", category: "Work", text: "Product designer at a fintech startup in Berlin", source: "From chat", date: "Sep 28" },
    { id: "p1", category: "Preferences", text: "Writes in British English", source: "From chat", date: "Sep 2" },
  ];
  panel.onForget = (id) => fetch(`/api/memories/${id}`, { method: "DELETE" });
  panel.addEventListener("tc-memories-change", (e) => console.log(e.detail.memories));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MemoryPanel, type Memory } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Memories({ initial }: { initial: Memory[] }) {
  const [memories, setMemories] = useState(initial);
  const [enabled, setEnabled] = useState(true);
  return (
    <MemoryPanel
      memories={memories}
      onChange={setMemories}
      enabled={enabled}
      onEnabledChange={setEnabled}
      categories={["Work", "Preferences", "Projects"]}
      addedSource="Added by you"
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/memory-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";

defineProps<{ memories: TcMemoryPanel["memories"]; categories: TcMemoryPanel["categories"] }>();
const onMemoriesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-memory-panel :memories="memories" :categories="categories" @tc-memories-change="onMemoriesChange"></tc-memory-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MemoryPanel } from "@adamstavely/trenchcoat/angular/memory-panel";
import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";

@Component({
  selector: "app-memory-panel-example",
  imports: [MemoryPanel],
  template: `<tc-memory-panel [memories]="memories()" [categories]="categories()" (tc-memories-change)="onMemoriesChange($event)"></tc-memory-panel>`,
})
export class MemoryPanelExample {
  readonly memories = input.required<TcMemoryPanel["memories"]>();
  readonly categories = input.required<TcMemoryPanel["categories"]>();
  onMemoriesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/memory-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";

  let { memories, categories }: { memories: TcMemoryPanel["memories"]; categories: TcMemoryPanel["categories"] } = $props();
  let el: TcMemoryPanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-memories-change", on);
    return () => el.removeEventListener("tc-memories-change", on);
  });
</script>

<tc-memory-panel bind:this={el} {memories} {categories}></tc-memory-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `memories` | – | `Memory[]` | `[]` | The memories shown, grouped by their category |
| `enabled` | `enabled` | `boolean` | `true` | The master switch |
| `categories` | – | `string[] \| undefined` | `undefined` | Order of the groups and the choices for new memories – defaults to the categories in the order they appear |
| `heading` | `heading` | `string` | `"Memory"` | The heading, and the group's name |
| `maxHeight` | `max-height` | `number` | `360` | Height of the list before it scrolls, in px |
| `undoFor` | `undo-for` | `number` | `5000` | How long Undo stays on the tray (Clean: in the card's last row), in ms. It waits while the pointer or focus is on the tray and starts over after; `Infinity` keeps it until the next forget (WCAG 2.2.1) |
| `addedSource` | `added-source` | `string` | `"You added"` | Source given to memories added here |
| `actionLabel` | `action-label` | `string` | `""` | A button on the tray that fires tc-action – Undo takes its place for a moment |
| `onAdd` | – | `((memory: Memory) => MemoryCallbackResult) \| undefined` | `undefined` | Called with a memory added here |
| `onEdit` | – | `((id: string, text: string) => MemoryCallbackResult) \| undefined` | `undefined` | Called when a memory's text was edited |
| `onPause` | – | `((id: string, paused: boolean) => MemoryCallbackResult) \| undefined` | `undefined` | Called when a memory was paused or resumed |
| `onForget` | – | `((id: string) => MemoryCallbackResult) \| undefined` | `undefined` | Called when a memory was forgotten |
| `onRestore` | – | `((memory: Memory) => MemoryCallbackResult) \| undefined` | `undefined` | Called when a forgotten memory is brought back with Undo |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-memories-change` | – | Yes | The list changed (added, edited, paused, forgotten, restored or rolled back); detail `{ memories: Memory[] }`. Cancelable: preventDefault() keeps the change out until the app passes the list back. |
| `tc-enabled-change` | – | Yes | The master switch was flipped; detail `{ enabled: boolean }`. Cancelable. |
| `tc-action` | – | No | The action button (`actionLabel`) was pressed; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-memory-panel-well` | `light-dark(#f4f4f5, #222225)` | standard |

#### Design tokens it reads (98)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg-sunken`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-memory-panel-max`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `memories` | `el.memories = …;` | `<… memories={…} />` | `<tc-memory-panel :memories="…">` | `<tc-memory-panel [memories]="…">` | `<tc-memory-panel {memories}>` |
| `categories` | `el.categories = …;` | `<… categories={…} />` | `<tc-memory-panel :categories="…">` | `<tc-memory-panel [categories]="…">` | `<tc-memory-panel {categories}>` |
| `onAdd` | `el.onAdd = …;` | `<… onAdd={…} />` | `<tc-memory-panel :onAdd="…">` | `<tc-memory-panel [onAdd]="…">` | `<tc-memory-panel {onAdd}>` |
| `onEdit` | `el.onEdit = …;` | `<… onEdit={…} />` | `<tc-memory-panel :onEdit="…">` | `<tc-memory-panel [onEdit]="…">` | `<tc-memory-panel {onEdit}>` |
| `onPause` | `el.onPause = …;` | `<… onPause={…} />` | `<tc-memory-panel :onPause="…">` | `<tc-memory-panel [onPause]="…">` | `<tc-memory-panel {onPause}>` |
| `onForget` | `el.onForget = …;` | `<… onForget={…} />` | `<tc-memory-panel :onForget="…">` | `<tc-memory-panel [onForget]="…">` | `<tc-memory-panel {onForget}>` |
| `onRestore` | `el.onRestore = …;` | `<… onRestore={…} />` | `<tc-memory-panel :onRestore="…">` | `<tc-memory-panel [onRestore]="…">` | `<tc-memory-panel {onRestore}>` |

*Also attributes: `enabled`, `heading`, `max-height`, `undo-for`, `added-source`, `action-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-memories-change` | Yes | `el.addEventListener("tc-memories-change", (e) => …)` | `onChange={…}` | `@tc-memories-change="…"` | `(tc-memories-change)="…($event)"` | `el.addEventListener("tc-memories-change", …)` |
| `tc-enabled-change` | Yes | `el.addEventListener("tc-enabled-change", (e) => …)` | `onEnabledChange={…}` | `@tc-enabled-change="…"` | `(tc-enabled-change)="…($event)"` | `el.addEventListener("tc-enabled-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onClick={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

### Controlled

The element changes `memories` and `enabled` itself unless a listener calls `preventDefault()` on `tc-memories-change` or `tc-enabled-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-memory-panel id="memory-panel"></tc-memory-panel>

<script type="module">
  import "@adamstavely/trenchcoat/memory-panel";

  const el = document.querySelector("#memory-panel");
  el.addEventListener("tc-memories-change", (e) => {
    e.preventDefault(); // the element keeps its memories…
    if (allowed(e.detail.memories)) el.memories = e.detail.memories; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { MemoryPanel } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof MemoryPanel>;
type Props = Omit<Own, "memories" | "onChange"> & { initial: NonNullable<Own["memories"]> };

// Controlled: passing memories makes the wrapper prevent the element's own change; the app sets it
export function ControlledMemoryPanel({ initial, ...props }: Props) {
  const [memories, setMemories] = useState<Own["memories"]>(initial);
  return <MemoryPanel {...props} memories={memories} onChange={(next) => setMemories(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/memory-panel";
import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";

const props = defineProps<{ initial: TcMemoryPanel["memories"] }>();
const memories = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMemoriesChange = (e: CustomEvent<{ memories: TcMemoryPanel["memories"] }>) => {
  e.preventDefault();
  memories.value = e.detail.memories;
};
</script>

<template>
  <tc-memory-panel :memories="memories" @tc-memories-change="onMemoriesChange"></tc-memory-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MemoryPanel } from "@adamstavely/trenchcoat/angular/memory-panel";
import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";

@Component({
  selector: "app-controlled-memory-panel",
  imports: [MemoryPanel],
  template: `<tc-memory-panel [memories]="memories()" (tc-memories-change)="onMemoriesChange($event)"></tc-memory-panel>`,
})
export class ControlledMemoryPanel {
  readonly initial = input.required<TcMemoryPanel["memories"]>();
  readonly memories = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMemoriesChange(e: CustomEvent<{ memories: TcMemoryPanel["memories"] }>) {
    e.preventDefault();
    this.memories.set(e.detail.memories);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/memory-panel";
  import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";

  let { initial }: { initial: TcMemoryPanel["memories"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let memories = $derived(initial);
  let el: TcMemoryPanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      memories = (e as CustomEvent<{ memories: TcMemoryPanel["memories"] }>).detail.memories;
    };
    el.addEventListener("tc-memories-change", on);
    return () => el.removeEventListener("tc-memories-change", on);
  });
</script>

<tc-memory-panel bind:this={el} {memories}></tc-memory-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-memory-panel")` returns a `TcMemoryPanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";`
- **React / Next.js:** Props: `import type { MemoryPanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MemoryPanel>`. The element class, for refs: `import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMemoryPanel["memories"]` with `import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";`
- **Angular:** The directive types the template: `[memories]` takes `TcMemoryPanel["memories"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMemoryPanel } from "@adamstavely/trenchcoat/memory-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `memories` | `Memory[]` | The memories (controlled): the panel shows exactly these and asks for changes through onChange. Leave it undefined to let the panel keep the list, starting at `defaultMemories` |
| `defaultMemories` | `Memory[]` | The memories to start with when uncontrolled |
| `onChange` | `(memories: Memory[]) => void` | Called with the full list after any change – in both modes |
| `enabled` | `boolean` | The master switch – controlled when defined |
| `defaultEnabled` | `boolean` | The master switch to start with when uncontrolled |
| `onEnabledChange` | `(enabled: boolean) => void` | Called when the master switch is flipped – in both modes |
| `title` | `string` | The heading, and the group's name |
| `action` | `{ label: string; onClick: () => void }` | A button on the tray, e.g. { label: "Manage", onClick } – Undo takes its place for a moment |

*Renamed or hidden on the wrapper: `memories`, `enabled`, `heading`, `actionLabel`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switch, the chosen category chip, Search, each memory's actions, New memory and the tray |
| ← / → / ↑ / ↓ | In the category chips or the new memory's categories: picks the previous or next one, wrapping round |
| Home / End | In the category chips: picks All or the last category |
| Enter | In an editor: saves the memory (Shift+Enter is a new line) |
| Escape | In an editor: cancels and returns focus to Edit or New memory; in search: clears and closes it |
| Space / Enter | On a button: flips the switch, edits, pauses, forgets, undoes |

Forgetting moves focus to the next memory's Forget (else the previous one, else New memory) before the row folds; Undo
brings focus back to the restored memory.

### Screen readers

The host is a group named by the heading. “Use memory” is a switch with `aria-checked`, and controls the note that
unfolds when it's off. The category chips are a radiogroup named “Category”; the search field and its button are
named “Search memories”, and the button has `aria-expanded`. Each category is a section named by it. The actions are
named with the memory's text – “Edit “Writes in British English””, “Pause …”, “Resume …”, “Forget …” – and a row whose
callback is still running is `aria-busy`. A status region says “Forgot “…”. Undo is on the tray.” after a forget, and
a failure such as “Couldn't pause it. Try again.” The rolling counts are not read out.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 65.3 KB | 14.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **73.7 KB** | **16.8 KB** |
| With Lit – the first component on a page | 95.6 KB | 23.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 248 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of memories replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | memories: first render, 1,996 nodes; update 1.5 ms |
| 1,000 items | 111 ms | memories: first render, 19,096 nodes; update 11 ms |

1,000 items of memories: 111 ms. It renders every item, so a first render passes 50 ms (a long task) at about 450 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`, `new Date()`, `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each memory as one short sentence about the person, without “User” or “You”: “Writes in British English”.
- Make `source` and `date` ready to show: “From chat”, “From settings”, “Oct 12”.
- Use a handful of plain categories – “Work”, “Preferences”, “Projects”, “Personal” – and pass them in `categories`
  in the order people expect.
- Set `addedSource` to how a hand-added memory should read, e.g. “Added by you”.

## Do and don't

### Do

- Return a promise from `onAdd`, `onEdit`, `onPause`, `onForget` and `onRestore` when the change is saved on a server –
  the row waits, and a rejection rolls it back and says so.
- Keep Undo long enough to read: raise `undoFor`, or set it to `Infinity`, for people who need more time.
- Treat the switch as a real setting: when it's off, stop using and saving memories, as its note promises.

### Don't

- Don't delete memories when the switch is turned off – the note says nothing is deleted.
- Don't put long notes or documents in a memory; they wrap and are hard to scan.
- Don't hide the source: people need to know where a memory came from to trust or correct it.

## Related

- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
