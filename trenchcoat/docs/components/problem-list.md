<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Problem List

**Workspace & sessions** · New

diagnostics from a build, type check or linter, grouped by file, with a severity filter with counts, a text filter, severity marks that aren't colour alone, and quick fixes.

- **Element:** `<tc-problem-list>`
- **Size:** 9.5 KB gzip · 30.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/problem-list";` |
| React / Next.js | `import { ProblemList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/problem-list";` · tags starting with tc- are custom elements |
| Angular | `import { ProblemList } from "@adamstavely/trenchcoat/angular/problem-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/problem-list";` |

## Example

The live example is in the gallery at `#/problem-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a build, type check or linter found. Problems are grouped by file, worst files first, and each shows a mark for its
severity, the message, where it came from and its line. The header counts errors, warnings and notes; a severity filter
with counts and a text filter narrow the list. A problem with a quick fix has a button for it. Nothing here runs a check:
the page passes `problems` and a `status`, and decides what opening one or applying a fix means.

### When to use

- A Problems view beside an editor, terminal or session.
- The result of a CI job or a local check, where each finding points at a line.
- Validation findings on a set of files, such as a content or data lint.

### When not to use

- Whether checks passed, without their details – use [Check Status](check-status.md).
- A finding that needs evidence and a review, such as a security finding – use [Agent Findings](agent-findings.md).
- Raw tool output – use [Terminal](terminal.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filters** `.ui-prob__filters` – the severity filter `.ui-prob__segs` with counts, and the text filter `.ui-prob__field`
2. **File** `.ui-prob__file` – a file's name, folder `.ui-prob__folder` and count `.ui-prob__count`
3. **Problem** `.ui-prob__problem` – the severity mark `.ui-prob__mark`, the message `.ui-prob__message` and its details `.ui-prob__meta`
4. **Where** `.ui-prob__where` – the line and column
5. **Fix** `.ui-prob__fix` – a quick fix's button
6. **Summary** `.ui-prob__summary` – the counts in the header
7. **Empty** `.ui-prob__empty` – "No problems", with a check

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Errors are red with a circled cross, warnings amber with a triangle, notes blue with a circled i. A page can set
`--tc-prob-indent`, how far problems sit under their file, and `--tc-prob-mark-nudge`, which lines the mark up with the
message's first line. When the card is narrower than 360 px, fix buttons show only their icon and folders are left out.

## Usage

### HTML

```html
<tc-problem-list id="problems"></tc-problem-list>

<script type="module">
  import "@adamstavely/trenchcoat/problem-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#problems");
  list.problems = [
    { path: "src/lib/freezer.ts", line: 3, column: 50, severity: "error", message: "Cannot find name 'Reading'.", source: "ts", code: "TS2304" },
  ];
  list.addEventListener("tc-open", (e) => console.log(e.detail.path, e.detail.line));
</script>
```

### React / Next.js

```tsx
import { ProblemList, type ProblemItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Problems({ problems, open, fix }: { problems: ProblemItem[]; open: (path: string, line: number) => void; fix: (p: ProblemItem) => void }) {
  return <ProblemList problems={problems} defaultFilter="error" onTcOpen={(e) => open(e.detail.path, e.detail.line)} onTcFix={(e) => fix(e.detail.problem)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/problem-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";

defineProps<{ problems: TcProblemList["problems"]; expanded: TcProblemList["expanded"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-problem-list :problems="problems" :expanded="expanded" @tc-selected-change="onSelectedChange"></tc-problem-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProblemList } from "@adamstavely/trenchcoat/angular/problem-list";
import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";

@Component({
  selector: "app-problem-list-example",
  imports: [ProblemList],
  template: `<tc-problem-list [problems]="problems()" [expanded]="expanded()" (tc-selected-change)="onSelectedChange($event)"></tc-problem-list>`,
})
export class ProblemListExample {
  readonly problems = input.required<TcProblemList["problems"]>();
  readonly expanded = input.required<TcProblemList["expanded"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/problem-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";

  let { problems, expanded }: { problems: TcProblemList["problems"]; expanded: TcProblemList["expanded"] } = $props();
  let el: TcProblemList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-problem-list bind:this={el} {problems} {expanded}></tc-problem-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Problems"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – what was checked |
| `problems` | – | `ProblemItem[]` | `[]` | What was found |
| `filter` | `filter` | `ProblemFilter` | `"all"` | Which severities show: all, error, warning or info |
| `query` | `query` | `string` | `""` | The text filter: matches the message, path, source or code |
| `groupBy` | `group-by` | `"file" \| "none"` | `"file"` | "file" groups problems under their file; "none" lists them with their path |
| `expanded` | – | `string[] \| null` | `null` | The open files' paths; null opens them all |
| `selected` | `selected` | `string \| null` | `null` | The chosen problem's key (its id, or `problemKey`; an exact copy's key ends in "#2", "#3"…) |
| `status` | `status` | `ProblemListStatus` | `"done"` | idle, running or done |
| `hideFilter` | `hide-filter` | `boolean` | `false` | Leaves out the severity and text filters |
| `maxHeight` | `max-height` | `number` | `480` | Height in px at which the list scrolls |
| `actions` | – | `ProblemListActionItem[]` | `[]` | Buttons in the header |
| `labels` | – | `Partial<ProblemListLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Another problem was chosen ({ selected, problem }: ProblemSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-filter-change` | – | Yes | The severity filter changed ({ filter }: ProblemFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-query-change` | – | Yes | The text filter changed ({ query }: ProblemQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-expanded-change` | – | Yes | A file was opened or closed ({ expanded, path }: ProblemExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-open` | – | No | A problem was clicked, or Enter or Space pressed on it ({ path, line, column, problem }: ProblemOpen) |
| `tc-fix` | – | No | A problem's fix was pressed ({ problem }: ProblemFix); the page applies it |
| `tc-action` | – | No | A header button was pressed ({ id }: ProblemListAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-prob-indent` | `var(--tc-space-4)` | both |
| `--tc-prob-mark-nudge` | `3px` | both |

#### Design tokens it reads (58)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-prob-level`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `problemKey(p: ProblemItem): void` | A problem's identity: its id, or where it is, what found it and what it says. Exact copies in one list get "#2", "#3"… after it. |

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
| `problems` | `el.problems = …;` | `<… problems={…} />` | `<tc-problem-list :problems="…">` | `<tc-problem-list [problems]="…">` | `<tc-problem-list {problems}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-problem-list :expanded="…">` | `<tc-problem-list [expanded]="…">` | `<tc-problem-list {expanded}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-problem-list :actions="…">` | `<tc-problem-list [actions]="…">` | `<tc-problem-list {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-problem-list :labels="…">` | `<tc-problem-list [labels]="…">` | `<tc-problem-list {labels}>` |

*Also attributes: `heading`, `description`, `filter`, `query`, `group-by`, `selected`, `status`, `hide-filter` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-fix` | No | `el.addEventListener("tc-fix", (e) => …)` | `onTcFix={…}` | `@tc-fix="…"` | `(tc-fix)="…($event)"` | `el.addEventListener("tc-fix", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter`, `query`, `expanded` and `selected` itself unless a listener calls `preventDefault()` on `tc-filter-change`, `tc-query-change`, `tc-expanded-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-problem-list id="problem-list"></tc-problem-list>

<script type="module">
  import "@adamstavely/trenchcoat/problem-list";

  const el = document.querySelector("#problem-list");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
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
import "@adamstavely/trenchcoat/problem-list";
import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";

const props = defineProps<{ initial: TcProblemList["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcProblemList["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-problem-list :filter="filter" @tc-filter-change="onFilterChange"></tc-problem-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ProblemList } from "@adamstavely/trenchcoat/angular/problem-list";
import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";

@Component({
  selector: "app-controlled-problem-list",
  imports: [ProblemList],
  template: `<tc-problem-list [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-problem-list>`,
})
export class ControlledProblemList {
  readonly initial = input.required<TcProblemList["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcProblemList["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/problem-list";
  import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";

  let { initial }: { initial: TcProblemList["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcProblemList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcProblemList["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-problem-list bind:this={el} {filter}></tc-problem-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-problem-list")` returns a `TcProblemList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";`
- **React / Next.js:** Props: `import type { ProblemListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProblemList>`. The element class, for refs: `import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProblemList["problems"]` with `import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";`
- **Angular:** The directive types the template: `[problems]` takes `TcProblemList["problems"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProblemList } from "@adamstavely/trenchcoat/problem-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `selected` | `string \| null` | The chosen problem's key – controlled when given |
| `defaultSelected` | `string \| null` | The chosen problem at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, problem?: ProblemItem) => void` | Another problem was chosen |
| `filter` | `ProblemFilter` | Which severities show – controlled when given |
| `defaultFilter` | `ProblemFilter` | The severity filter at first, when `filter` isn't controlled |
| `onFilterChange` | `(filter: ProblemFilter) => void` | The severity filter changed |
| `query` | `string` | The text filter – controlled when given |
| `defaultQuery` | `string` | The text filter at first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The text filter changed |
| `expanded` | `string[] \| null` | The open files' paths, null for all – controlled when given |
| `defaultExpanded` | `string[] \| null` | The open files at first, when `expanded` isn't controlled (null: all) |
| `onExpandedChange` | `(expanded: string[] \| null) => void` | A file was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `filter`, `query`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The severity filter, the text filter and the list are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in the severity filter | Chooses the next or previous severity |
| Esc in the text filter | Clears it |
| ↑ / ↓ | Move between files and problems |
| → | Opens a file, goes to its first problem, or to a problem's fix |
| ← | Goes back from a fix, closes a file, or goes from a problem to its file |
| Home / End | Go to the first or last row |
| Enter / Space | Opens a problem, folds a file, or applies the fix that has focus |

### Screen readers

The list is a `tree` named by the heading. Files are `treeitem`s at level 1 with `aria-expanded`, and problems are at
level 2 with `aria-selected`. Each problem's severity is read as a word before the message, for example "Error: Cannot
find name 'Reading'.", and its line as "Line 3:50". The severity filter is a `radiogroup`. A `role="status"` says how many
problems are shown, or that a check is running, and the list is `aria-busy` while it runs.

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

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.5 KB | 7.4 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **30.8 KB** | **9.6 KB** |
| With Lit – the first component on a page | 52.3 KB | 16.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 201 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of problems replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.2 ms | problems: first render, 1,857 nodes; update 1.2 ms |
| 1,000 items | 55 ms | problems: first render, 17,607 nodes; update 13 ms |

1,000 items of problems: 55 ms. It renders every item, so a first render passes 50 ms (a long task) at about 900 items – page or filter longer lists.

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

- Write messages as the tool gives them. Put the tool in `source` and its rule or error number in `code`.
- Give each problem an `id` if the same message can appear twice on a line. Otherwise `problemKey` builds one from its
  place, severity, source, code and message, and exact copies get `#2`, `#3`… so each row is still its own.
- A `fix` is the fix's label, such as "Import 'Reading'". The element does nothing else with it: the page applies it on
  `tc-fix`.
- `group-by="none"` lists problems without files, each with its path, for a short list.

## Do and don't

### Do

- Set `status` to "running" while a check runs. The last results stay until new ones arrive.
- Remove or update a problem once its fix is applied, so the list stays true.

### Don't

- Don't use it for thousands of problems at once. Every row is drawn, so filter to a file or a severity first.
- Don't put colour-only meaning in messages. The mark and the word already say how serious a problem is.

## Related

- [Check Status](check-status.md) – The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.
- [Search Results](search-results.md) – results of a search across files, grouped by file with the matched text marked, with match case, whole word and regular expression toggles, collapse all, and an optional replace preview.
- [File Tree](file-tree.md) – A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page
- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
