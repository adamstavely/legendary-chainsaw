<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# File Tree

**Workspace & sessions** · New

A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page

- **Element:** `<tc-file-tree>`
- **Size:** 9.4 KB gzip · 27.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/file-tree";` |
| React / Next.js | `import { FileTree } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/file-tree";` · tags starting with tc- are custom elements |
| Angular | `import { FileTree } from "@adamstavely/trenchcoat/angular/file-tree";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/file-tree";` |

## Example

The live example is in the gallery at `#/file-tree`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A project's files. Folders fold, a filter keeps the matches and the folders they're in, and each file has an icon for its
kind and an optional Git status. It works with any source of files, and long trees stay fast because only the rows near the
view are drawn.

### When to use

- A Files view in a session, editor or review panel.
- Choosing a file from a project, with `tc-open` to show it.

### When not to use

- Choosing a value from a hierarchy in a form – use [Tree Select](tree-select.md).
- What changed in a set of files, with diffs – use [Diff Viewer](diff-viewer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filter** `.ui-ftr__filter` – narrows the tree as you type
2. **Row** `.ui-ftr__row` – one file or folder, with its `data-kind`
3. **Chevron** `.ui-ftr__chevron` – a folder's state
4. **Icon** `.ui-ftr__icon` – a file's kind
5. **Name** `.ui-ftr__name` – what the filter matched is marked with `.ui-ftr__hit`
6. **Status** `.ui-ftr__status` – a letter for its Git status
7. **Actions** `.ui-ftr__actions` – buttons in the header

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A
page can set `--tc-file-tree-indent`, the step for each level.

## Usage

### HTML

```html
<tc-file-tree id="files"></tc-file-tree>

<script type="module">
  import { fileTreeFromPaths } from "@adamstavely/trenchcoat/file-tree";
  import "@adamstavely/trenchcoat/tokens.css";

  const tree = document.querySelector("#files");
  tree.nodes = fileTreeFromPaths(["src/index.ts", "src/a.ts", "README.md"]);
  tree.addEventListener("tc-open", (e) => console.log(e.detail.path));
</script>
```

### React / Next.js

```tsx
import { FileTree, fileTreeFromPaths } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const nodes = fileTreeFromPaths(["src/index.ts", "src/a.ts", "README.md"]);

export function Files({ open }: { open: (path: string) => void }) {
  return <FileTree nodes={nodes} defaultExpanded={["src"]} onTcOpen={(e) => open(e.detail.path)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/file-tree";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";

defineProps<{ nodes: TcFileTree["nodes"]; expanded: TcFileTree["expanded"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-file-tree :nodes="nodes" :expanded="expanded" @tc-selected-change="onSelectedChange"></tc-file-tree>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FileTree } from "@adamstavely/trenchcoat/angular/file-tree";
import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";

@Component({
  selector: "app-file-tree-example",
  imports: [FileTree],
  template: `<tc-file-tree [nodes]="nodes()" [expanded]="expanded()" (tc-selected-change)="onSelectedChange($event)"></tc-file-tree>`,
})
export class FileTreeExample {
  readonly nodes = input.required<TcFileTree["nodes"]>();
  readonly expanded = input.required<TcFileTree["expanded"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-tree";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";

  let { nodes, expanded }: { nodes: TcFileTree["nodes"]; expanded: TcFileTree["expanded"] } = $props();
  let el: TcFileTree;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-file-tree bind:this={el} {nodes} {expanded}></tc-file-tree>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Files"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the project or branch |
| `nodes` | – | `FileTreeNode[]` | `[]` | The top level of the tree; `fileTreeFromPaths` builds it from paths |
| `selected` | `selected` | `string \| null` | `null` | The chosen file's path, or null |
| `expanded` | – | `string[]` | `[]` | The paths of the open folders |
| `query` | `query` | `string` | `""` | The filter's text |
| `sort` | `sort` | `boolean` | `true` | Folders first, then by name with numbers in order; off keeps the order given |
| `hideFilter` | `hide-filter` | `boolean` | `false` | Leaves out the filter |
| `searchable` | `searchable` | `boolean` | `false` | "?" then text and Enter fires tc-search, for searching inside files |
| `maxHeight` | `max-height` | `number` | `480` | Height in px at which the tree scrolls |
| `actions` | – | `FileTreeActionItem[]` | `[]` | Buttons in the header |
| `labels` | – | `Partial<FileTreeLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Another file was chosen ({ selected, node }: FileTreeSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-expanded-change` | – | Yes | A folder opened or closed ({ expanded, path }: FileTreeExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-query-change` | – | Yes | The filter's text changed ({ query }: FileTreeQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-open` | – | No | A file was clicked, or Enter or Space pressed on it ({ path, node }: FileTreeOpen) |
| `tc-load` | – | No | A lazy folder was opened and needs its children ({ path, node }: FileTreeLoad) |
| `tc-search` | – | No | "?" and text then Enter, with `searchable` ({ query }: FileTreeSearch) |
| `tc-action` | – | No | A header button was pressed ({ id }: FileTreeAction) |

#### Design tokens it reads (47)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-file-tree-indent`, `--tc-file-tree-level`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `fileTreeFromPaths(paths: readonly string[]): FileTreeNode[]` | Builds nodes from paths such as "src/a.ts"; a path ending in "/" is an empty folder. Backslashes count as slashes, "." parts are dropped and ".." goes up a folder, so "./lib/a.ts" and "lib\\a.ts" land in the same place |

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
| `nodes` | `el.nodes = …;` | `<… nodes={…} />` | `<tc-file-tree :nodes="…">` | `<tc-file-tree [nodes]="…">` | `<tc-file-tree {nodes}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-file-tree :expanded="…">` | `<tc-file-tree [expanded]="…">` | `<tc-file-tree {expanded}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-file-tree :actions="…">` | `<tc-file-tree [actions]="…">` | `<tc-file-tree {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-file-tree :labels="…">` | `<tc-file-tree [labels]="…">` | `<tc-file-tree {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `query`, `sort`, `hide-filter`, `searchable`, `max-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-load` | No | `el.addEventListener("tc-load", (e) => …)` | `onTcLoad={…}` | `@tc-load="…"` | `(tc-load)="…($event)"` | `el.addEventListener("tc-load", …)` |
| `tc-search` | No | `el.addEventListener("tc-search", (e) => …)` | `onTcSearch={…}` | `@tc-search="…"` | `(tc-search)="…($event)"` | `el.addEventListener("tc-search", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected`, `expanded` and `query` itself unless a listener calls `preventDefault()` on `tc-selected-change`, `tc-expanded-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-file-tree id="file-tree"></tc-file-tree>

<script type="module">
  import "@adamstavely/trenchcoat/file-tree";

  const el = document.querySelector("#file-tree");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/file-tree";
import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";

const props = defineProps<{ initial: TcFileTree["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcFileTree["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-file-tree :selected="selected" @tc-selected-change="onSelectedChange"></tc-file-tree>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FileTree } from "@adamstavely/trenchcoat/angular/file-tree";
import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";

@Component({
  selector: "app-controlled-file-tree",
  imports: [FileTree],
  template: `<tc-file-tree [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-file-tree>`,
})
export class ControlledFileTree {
  readonly initial = input.required<TcFileTree["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcFileTree["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-tree";
  import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";

  let { initial }: { initial: TcFileTree["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcFileTree;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcFileTree["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-file-tree bind:this={el} {selected}></tc-file-tree>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-file-tree")` returns a `TcFileTree` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";`
- **React / Next.js:** Props: `import type { FileTreeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FileTree>`. The element class, for refs: `import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFileTree["nodes"]` with `import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";`
- **Angular:** The directive types the template: `[nodes]` takes `TcFileTree["nodes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFileTree } from "@adamstavely/trenchcoat/file-tree";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `selected` | `string \| null` | The chosen file's path – controlled when given |
| `defaultSelected` | `string \| null` | The chosen file at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, node?: FileTreeNode) => void` | Another file was chosen |
| `expanded` | `string[]` | The open folders' paths – controlled when given |
| `defaultExpanded` | `string[]` | The folders open at first, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string[]) => void` | A folder opened or closed |
| `query` | `string` | The filter's text – controlled when given |
| `defaultQuery` | `string` | The filter's text at first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The filter's text changed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `expanded`, `query`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The tree is one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between rows |
| → | Opens a folder, then goes to its first child |
| ← | Closes a folder, or goes to the parent |
| Home / End | Go to the first or last row |
| Enter / Space | Opens a file, or folds a folder |
| Letters | Jump to the next name that starts with them |
| ↓ in the filter | Moves into the tree |
| Esc in the filter | Clears it |

### Screen readers

It's a `tree` named by the heading, and rows are `treeitem`s with their level, position, `aria-expanded` and `aria-selected`.
A Git status is read as a word. `role="status"` says how many files match the filter.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.1 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **27.2 KB** | **9.4 KB** |
| With Lit – the first component on a page | 48.7 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 123 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of nodes replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 13 ms | nodes: first render, 379 nodes; update 9.6 ms |

Windowed: 10,000 items of nodes render 379 nodes in 13 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `fileTreeFromPaths` builds `nodes` from a flat list such as Git's. A path ending in `/` is an empty folder. Backslashes
  count as slashes, `.` parts are dropped and `..` goes up a folder, so `./lib/a.ts` and `lib\a.ts` are one file.
- Set `lazy` on a folder whose children aren't known, then add `children` when `tc-load` fires.
- While filtering, folders with a match start open, and a folder whose own name matches shows everything in it. Folders
  can still be opened and closed; that's the filter's own view and doesn't change `expanded`.
- `selected` and `expanded` hold paths from the root, so two files can't share one.

## Do and don't

### Do

- Listen for `tc-open` to show a file: it also fires for a file that's already selected.
- Use `searchable` only if the page can search inside files. The tree finds names; `tc-search` is yours to answer.

### Don't

- Don't filter lazy folders and expect their contents to match: only names already loaded are searched.
- Don't add rename, move or delete here. Put those in `actions` or a menu beside it.

## Related

- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
- [Tree Select](tree-select.md) – Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them
- [Session Panel](../blocks/session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
