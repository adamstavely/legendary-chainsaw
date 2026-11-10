<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Diff Viewer

**Workspace & sessions** · New

The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff

- **Element:** `<tc-diff-viewer>`
- **Size:** 25.7 KB gzip · 95.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/diff-viewer";` |
| React / Next.js | `import { DiffViewer } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/diff-viewer";` · tags starting with tc- are custom elements |
| Angular | `import { DiffViewer } from "@adamstavely/trenchcoat/angular/diff-viewer";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/diff-viewer";` |

## Example

The live example is in the gallery at `#/diff-viewer`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The changes to a set of files. The top gives the totals, and each file is a row with its status and the lines added and
removed, opening to a line diff with long unchanged runs folded. Give it each file's text before and after; any source
works, and it doesn't need to know about Git.

### When to use

- A Changes view in a session or review panel: everything a branch, run or agent changed.
- Showing what a set of edits would do before someone accepts them.

### When not to use

- A list of pull requests – use [Change List](change-list.md).
- One block of code against its current file – use [Code Block](code-block.md).
- Edits to prose, word by word – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Totals** `.ui-dfv__totals` – files, lines added and removed
2. **Expand all** `.ui-dfv__all` – opens or closes every file
3. **File** `.ui-dfv__file` – one changed file
4. **Row** `.ui-dfv__toggle` – opens the file's diff
5. **Status** `.ui-dfv__status` – Added, Modified, Deleted or Renamed; hidden when narrow
6. **Counts** `.ui-dfv__counts` – lines added and removed
7. **Diff** `.ui-dfv__body` – a `tc-code-block` in its diff view

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Usage

### HTML

```html
<tc-diff-viewer id="changes"></tc-diff-viewer>

<script type="module">
  import "@adamstavely/trenchcoat/diff-viewer";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#changes").files = [
    { path: "src/limit.ts", before: "export const LIMIT = 1;\n", after: "export const LIMIT = 2;\n" },
    { path: "src/new.ts", after: "export {};\n" },
  ];
</script>
```

### React / Next.js

```tsx
import { DiffViewer, type DiffFile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const files: DiffFile[] = [
  { path: "src/limit.ts", before: "export const LIMIT = 1;\n", after: "export const LIMIT = 2;\n" },
  { path: "src/new.ts", after: "export {};\n" },
];

export function Changes() {
  return <DiffViewer files={files} description="Compared with main" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/diff-viewer";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";

defineProps<{ files: TcDiffViewer["files"]; expanded: TcDiffViewer["expanded"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-diff-viewer :files="files" :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-diff-viewer>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DiffViewer } from "@adamstavely/trenchcoat/angular/diff-viewer";
import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";

@Component({
  selector: "app-diff-viewer-example",
  imports: [DiffViewer],
  template: `<tc-diff-viewer [files]="files()" [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-diff-viewer>`,
})
export class DiffViewerExample {
  readonly files = input.required<TcDiffViewer["files"]>();
  readonly expanded = input.required<TcDiffViewer["expanded"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/diff-viewer";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";

  let { files, expanded }: { files: TcDiffViewer["files"]; expanded: TcDiffViewer["expanded"] } = $props();
  let el: TcDiffViewer;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-diff-viewer bind:this={el} {files} {expanded}></tc-diff-viewer>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Changes"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the branch, or what it's compared with |
| `files` | – | `DiffFile[]` | `[]` | The changed files, in the order to show them |
| `expanded` | – | `string[] \| undefined` | `undefined` | The paths of the open files; unset opens the first `autoExpand` |
| `autoExpand` | `auto-expand` | `number` | `3` | How many files start open when `expanded` is unset |
| `maxHeight` | `max-height` | `number` | `360` | Height in px at which one file's diff scrolls; 0 lets it grow |
| `wrap` | `wrap` | `boolean` | `false` | Wrap long lines instead of scrolling sideways |
| `labels` | – | `Partial<DiffViewerLabels>` | `{}` | Renames the status words and buttons |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | A file was opened or closed, or all of them ({ expanded, path }: DiffViewerExpandedChange); cancelable – prevented, `expanded` stays as it was |

#### Design tokens it reads (33)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `diffFileStatus(file: DiffFile): DiffFileStatus` | The status a file's texts and paths say it has |
| `diffFileCounts(file: DiffFile): { additions: number; deletions: number }` | Lines added and removed in a file: a line-level Myers diff, counted rather than drawn, so a scattered change to a long file counts only the lines that changed |

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
| `files` | `el.files = …;` | `<… files={…} />` | `<tc-diff-viewer :files="…">` | `<tc-diff-viewer [files]="…">` | `<tc-diff-viewer {files}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-diff-viewer :expanded="…">` | `<tc-diff-viewer [expanded]="…">` | `<tc-diff-viewer {expanded}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-diff-viewer :labels="…">` | `<tc-diff-viewer [labels]="…">` | `<tc-diff-viewer {labels}>` |

*Also attributes: `heading`, `description`, `auto-expand`, `max-height`, `wrap` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-diff-viewer id="diff-viewer"></tc-diff-viewer>

<script type="module">
  import "@adamstavely/trenchcoat/diff-viewer";

  const el = document.querySelector("#diff-viewer");
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
import "@adamstavely/trenchcoat/diff-viewer";
import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";

const props = defineProps<{ initial: TcDiffViewer["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcDiffViewer["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-diff-viewer :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-diff-viewer>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DiffViewer } from "@adamstavely/trenchcoat/angular/diff-viewer";
import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";

@Component({
  selector: "app-controlled-diff-viewer",
  imports: [DiffViewer],
  template: `<tc-diff-viewer [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-diff-viewer>`,
})
export class ControlledDiffViewer {
  readonly initial = input.required<TcDiffViewer["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcDiffViewer["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/diff-viewer";
  import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";

  let { initial }: { initial: TcDiffViewer["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcDiffViewer;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcDiffViewer["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-diff-viewer bind:this={el} {expanded}></tc-diff-viewer>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-diff-viewer")` returns a `TcDiffViewer` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";`
- **React / Next.js:** Props: `import type { DiffViewerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DiffViewer>`. The element class, for refs: `import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDiffViewer["files"]` with `import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";`
- **Angular:** The directive types the template: `[files]` takes `TcDiffViewer["files"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDiffViewer } from "@adamstavely/trenchcoat/diff-viewer";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `expanded` | `string[]` | The paths of the open files – controlled when given |
| `defaultExpanded` | `string[]` | The paths open at first, when `expanded` isn't controlled; unset opens the first `autoExpand` |
| `onExpandedChange` | `(expanded: string[]) => void` | A file was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).

### Keyboard

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between file rows |
| Home / End | Go to the first or last row |
| Enter / Space | Open or close the file |
| Tab | Moves on to the file's diff, which scrolls with the arrow keys |

### Screen readers

Rows are buttons with `aria-expanded`, in a list named by the heading. Each names its path, status and counts. Every diff
is a region named after its changes, with added and removed lines marked as Code Block marks them. `role="status"` says
when a file opens or closes.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, code-block, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, code-block, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | code-block | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 13.1 KB | 5.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| **Added to a page that already has Lit** | **95.9 KB** | **25.8 KB** |
| With Lit – the first component on a page | 118.4 KB | 33.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 233 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of files replaced |
| First on the page | 8.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 26 ms | files: first render, 5,345 nodes; update 2.2 ms |
| 1,000 items | 237 ms | files: first render, 53,270 nodes; update 19 ms |

1,000 items of files: 237 ms. It renders every item, so a first render passes 50 ms (a long task) at about 210 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (code-block), `setTimeout` (inline-diff).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Leave `before` out for a new file and `after` out for a deleted one, and the status follows.
- Set `previousPath` for a rename, and `binary` for a file with no text to compare.

## Do and don't

### Do

- Keep `autoExpand` small on a large change: only open files draw a diff.
- List files in an order that helps, such as the most important first.

### Don't

- Don't use it to apply or reject changes. It only shows them; put those actions beside it.

## Related

- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Session Panel](../blocks/session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
