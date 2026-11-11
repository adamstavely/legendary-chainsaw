<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Console Panel

**Workspace & sessions** · New

A web page's browser console: level chips with counts, a text filter, repeat badges, sources, and stacks that fold open.

- **Element:** `<tc-console-panel>`
- **Size:** 8.5 KB gzip · 27.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/console-panel";` |
| React / Next.js | `import { ConsolePanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/console-panel";` · tags starting with tc- are custom elements |
| Angular | `import { ConsolePanel } from "@adamstavely/trenchcoat/angular/console-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/console-panel";` |

## Example

The live example is in the gallery at `#/console-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A web page's browser console. Errors, warnings, info, logs and debug lines appear oldest first. Each row has a mark for its
level, the message in monospace, a badge when it repeated, and the file and line it came from. Level chips with counts
and a text filter narrow the list, and Clear empties it. An error or warning with a stack folds open to show the frames.
Nothing here reads a real console: the page passes `entries` and decides what Clear means.

### When to use

- The console of a page shown in a `preview-frame`, beside a session or editor.
- Messages captured from a test run or a user's session replay, where each came from a line of code.
- Any log of levelled, short messages that a reader filters by level.

### When not to use

- Raw command output with colours – use [Terminal](terminal.md).
- Findings from a type check or linter, grouped by file – use [Problem List](problem-list.md).
- The page's requests – use [Network Log](network-log.md).
- Steps an agent took in a sandbox – use [Sandbox Log](sandbox-log.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Toolbar** `.ui-dcon__toolbar` – the level chips `.ui-dcon__chips`, the text filter `.ui-dcon__field` and Clear `.ui-dcon__clear`
2. **Entry** `.ui-dcon__entry` – a level mark `.ui-dcon__mark`, the time `.ui-dcon__time`, the message `.ui-dcon__message` and the source `.ui-dcon__source`
3. **Repeat badge** `.ui-dcon__count` – how many times the message came in a row
4. **Stack frame** `.ui-dcon__frame` – one line of an open stack, under its entry
5. **Summary** `.ui-dcon__summary` – the error and warning counts in the header
6. **Empty** `.ui-dcon__empty` – "No messages", or "No messages match" when the filters hide everything

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Error rows are tinted red with a circled cross and warning rows amber with a triangle; info has a circled i, logs a
chevron and debug a code mark in a quieter colour. A page can set `--tc-dcon-indent`, how far stack frames sit under
their entry, and `--tc-dcon-mark-nudge`, which lines the mark up with the message's first line. When the card is
narrower than 420 px, sources drop under their message, times are left out and the chips show only their marks and
counts.

## Usage

### HTML

```html
<tc-console-panel id="console"></tc-console-panel>

<script type="module">
  import "@adamstavely/trenchcoat/console-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#console");
  panel.entries = [
    { id: "1", level: "warn", message: "'unload' event listeners are deprecated.", source: "session.js:31" },
    { id: "2", level: "error", message: "Cannot read properties of undefined (reading 'deadline')", source: "reviewer-panel.js:142", stack: ["at ReviewerPanel.render (reviewer-panel.js:142:31)"] },
  ];
  panel.addEventListener("tc-clear", () => console.log("cleared"));
</script>
```

### React / Next.js

```tsx
import { ConsolePanel, type ConsoleEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PageConsole({ entries, clear }: { entries: ConsoleEntry[]; clear: () => void }) {
  return <ConsolePanel entries={entries} defaultLevels={["error", "warn"]} onTcClear={(e) => { e.preventDefault(); clear(); }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/console-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";

defineProps<{ entries: TcConsolePanel["entries"]; levels: TcConsolePanel["levels"] }>();
const onLevelsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-console-panel :entries="entries" :levels="levels" @tc-levels-change="onLevelsChange"></tc-console-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ConsolePanel } from "@adamstavely/trenchcoat/angular/console-panel";
import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";

@Component({
  selector: "app-console-panel-example",
  imports: [ConsolePanel],
  template: `<tc-console-panel [entries]="entries()" [levels]="levels()" (tc-levels-change)="onLevelsChange($event)"></tc-console-panel>`,
})
export class ConsolePanelExample {
  readonly entries = input.required<TcConsolePanel["entries"]>();
  readonly levels = input.required<TcConsolePanel["levels"]>();
  onLevelsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/console-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";

  let { entries, levels }: { entries: TcConsolePanel["entries"]; levels: TcConsolePanel["levels"] } = $props();
  let el: TcConsolePanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-levels-change", on);
    return () => el.removeEventListener("tc-levels-change", on);
  });
</script>

<tc-console-panel bind:this={el} {entries} {levels}></tc-console-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Console"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the page or tab it belongs to |
| `entries` | – | `ConsoleEntry[]` | `[]` | The messages, oldest first |
| `levels` | – | `ConsoleLevel[]` | `[...consoleLevels]` | The levels that show |
| `filter` | `filter` | `string` | `""` | The text filter: matches the message and source |
| `expanded` | – | `string[]` | `[]` | The ids of the entries whose stack is open |
| `maxHeight` | `max-height` | `number` | `360` | Height in px at which the list scrolls |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for times |
| `labels` | – | `Partial<ConsolePanelLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-levels-change` | – | Yes | A level chip was toggled ({ levels, level }: ConsoleLevelsChange); cancelable – prevented, `levels` stays as it was |
| `tc-filter-change` | – | Yes | The text filter changed ({ filter }: ConsoleFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-expanded-change` | – | Yes | A stack was opened or closed ({ expanded, id }: ConsoleExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-clear` | – | Yes | Clear was pressed (detail: null); cancelable – prevented, `entries` stay; otherwise the element empties them, and those messages stay hidden if the same list is passed again (new ones show) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dcon-indent` | `var(--tc-space-8)` | both |
| `--tc-dcon-mark-nudge` | `3px` | both |

#### Design tokens it reads (55)

`--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `entries` | `el.entries = …;` | `<… entries={…} />` | `<tc-console-panel :entries="…">` | `<tc-console-panel [entries]="…">` | `<tc-console-panel {entries}>` |
| `levels` | `el.levels = …;` | `<… levels={…} />` | `<tc-console-panel :levels="…">` | `<tc-console-panel [levels]="…">` | `<tc-console-panel {levels}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-console-panel :expanded="…">` | `<tc-console-panel [expanded]="…">` | `<tc-console-panel {expanded}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-console-panel :labels="…">` | `<tc-console-panel [labels]="…">` | `<tc-console-panel {labels}>` |

*Also attributes: `heading`, `description`, `filter`, `max-height`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-levels-change` | Yes | `el.addEventListener("tc-levels-change", (e) => …)` | `ref.current.addEventListener("tc-levels-change", …)` | `@tc-levels-change="…"` | `(tc-levels-change)="…($event)"` | `el.addEventListener("tc-levels-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-clear` | Yes | `el.addEventListener("tc-clear", (e) => …)` | `onTcClear={…}` | `@tc-clear="…"` | `(tc-clear)="…($event)"` | `el.addEventListener("tc-clear", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `levels`, `filter` and `expanded` itself unless a listener calls `preventDefault()` on `tc-levels-change`, `tc-filter-change` or `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-console-panel id="console-panel"></tc-console-panel>

<script type="module">
  import "@adamstavely/trenchcoat/console-panel";

  const el = document.querySelector("#console-panel");
  el.addEventListener("tc-levels-change", (e) => {
    e.preventDefault(); // the element keeps its levels…
    if (allowed(e.detail.levels)) el.levels = e.detail.levels; // …until the app sets it
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
import "@adamstavely/trenchcoat/console-panel";
import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";

const props = defineProps<{ initial: TcConsolePanel["levels"] }>();
const levels = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLevelsChange = (e: CustomEvent<{ levels: TcConsolePanel["levels"] }>) => {
  e.preventDefault();
  levels.value = e.detail.levels;
};
</script>

<template>
  <tc-console-panel :levels="levels" @tc-levels-change="onLevelsChange"></tc-console-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ConsolePanel } from "@adamstavely/trenchcoat/angular/console-panel";
import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";

@Component({
  selector: "app-controlled-console-panel",
  imports: [ConsolePanel],
  template: `<tc-console-panel [levels]="levels()" (tc-levels-change)="onLevelsChange($event)"></tc-console-panel>`,
})
export class ControlledConsolePanel {
  readonly initial = input.required<TcConsolePanel["levels"]>();
  readonly levels = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLevelsChange(e: CustomEvent<{ levels: TcConsolePanel["levels"] }>) {
    e.preventDefault();
    this.levels.set(e.detail.levels);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/console-panel";
  import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";

  let { initial }: { initial: TcConsolePanel["levels"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let levels = $derived(initial);
  let el: TcConsolePanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      levels = (e as CustomEvent<{ levels: TcConsolePanel["levels"] }>).detail.levels;
    };
    el.addEventListener("tc-levels-change", on);
    return () => el.removeEventListener("tc-levels-change", on);
  });
</script>

<tc-console-panel bind:this={el} {levels}></tc-console-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-console-panel")` returns a `TcConsolePanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";`
- **React / Next.js:** Props: `import type { ConsolePanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ConsolePanel>`. The element class, for refs: `import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConsolePanel["entries"]` with `import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";`
- **Angular:** The directive types the template: `[entries]` takes `TcConsolePanel["entries"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConsolePanel } from "@adamstavely/trenchcoat/console-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `levels` | `ConsoleLevel[]` | The levels that show – controlled when given |
| `defaultLevels` | `ConsoleLevel[]` | The levels that show at first, when `levels` isn't controlled |
| `onLevelsChange` | `(levels: ConsoleLevel[]) => void` | A level chip was toggled |
| `filter` | `string` | The text filter – controlled when given |
| `defaultFilter` | `string` | The text filter at first, when `filter` isn't controlled |
| `onFilterChange` | `(filter: string) => void` | The text filter changed |
| `expanded` | `string[]` | The ids of the entries whose stack is open – controlled when given |
| `defaultExpanded` | `string[]` | The open stacks at first, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string[]) => void` | A stack was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `levels`, `filter`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The level chips, the text filter, Clear and the list are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in the chips | Move between level chips |
| Enter / Space on a chip | Shows or hides that level |
| Esc in the text filter | Clears it |
| ↑ / ↓ | Move between messages and open stack frames |
| → | Opens a message's stack, or goes to its first frame |
| ← | Closes a stack, or goes from a frame back to its message |
| Home / End | Go to the first or last row |
| Enter / Space | Opens or closes a message's stack |

### Screen readers

The list is a `tree` named by the heading. Messages are `treeitem`s at level 1, with `aria-expanded` when they have a
stack, and stack frames are at level 2. Each message's level is read as a word before it, for example "Error: Cannot
read properties of undefined", and a repeat badge as "4 times". The level chips are toggle buttons with
`aria-pressed`, in a group named "Levels". A `role="status"` says how many messages are shown.

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

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.7 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.1 KB** | **8.5 KB** |
| With Lit – the first component on a page | 48.6 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 154 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of entries replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | entries: first render, 1,150 nodes; update 1.6 ms |
| 1,000 items | 54 ms | entries: first render, 10,793 nodes; update 7.3 ms |

1,000 items of entries: 54 ms. It renders every item, so a first render passes 50 ms (a long task) at about 920 items – page or filter longer lists.

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

- Pass messages as the console printed them, with `source` as "file:line".
- Give each entry a stable `id`; open stacks are kept by id.
- Fold repeats into one entry with a `count`, as browsers do, rather than passing the same message many times.
- `time` is epoch ms and shows as hours, minutes, seconds and milliseconds in the `locale`.

## Do and don't

### Do

- Keep `entries` in the order they arrived, and append new ones.
- Prevent `tc-clear` when the page clears its own store, then pass the empty list.
- Unprevented, Clear hides the messages that were there, by `id`, even when the same list is passed again – as React does
  on every render – so a cleared console stays clear; messages with new ids show.

### Don't

- Don't pass thousands of lines at once. Every row is drawn, so trim old messages or filter first.
- Don't put HTML in messages. They're shown as text.

## Related

- [Network Log](network-log.md) – The requests a web page made: status, method, name, size, time and a waterfall, with type chips and a detail of headers and response.
- [Preview Frame](preview-frame.md) – a browser pane around a page the app supplies: address, back, forward and reload, phone, tablet and desktop widths zoomed to fit, a console count, tabs, and loading, error and empty states.
- [Problem List](problem-list.md) – diagnostics from a build, type check or linter, grouped by file, with a severity filter with counts, a text filter, severity marks that aren't colour alone, and quick fixes.
- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
