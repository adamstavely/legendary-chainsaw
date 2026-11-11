<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Search Results

**Workspace & sessions** · New

results of a search across files, grouped by file with the matched text marked, with match case, whole word and regular expression toggles, collapse all, and an optional replace preview.

- **Element:** `<tc-search-results>`
- **Size:** 10.8 KB gzip · 33.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/search-results";` |
| React / Next.js | `import { SearchResults } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/search-results";` · tags starting with tc- are custom elements |
| Angular | `import { SearchResults } from "@adamstavely/trenchcoat/angular/search-results";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/search-results";` |

## Example

The live example is in the gallery at `#/search-results`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a search across files found. A field shows the search and runs it again with Enter, with toggles for match case,
whole word and regular expression. Under a summary such as "42 results in 9 files", each file is a row you can fold, with
its matching lines under it and the matched text marked. With `replaceable`, a second field shows each match as it would
be replaced. Nothing here searches: the page answers `tc-search` and passes back `results` and a `status`.

### When to use

- Searching inside a project's files, such as after File Tree's `tc-search`.
- Find and replace across files, where the page applies the change.
- Any list of matching lines grouped by where they are, such as log files.

### When not to use

- Finding files by name – use [File Tree](file-tree.md) with its filter.
- Searching records or documents for people to read – use [AI Search](ai-search.md) or a results list.
- Showing a whole change to a file – use [Diff Viewer](diff-viewer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Fields** `.ui-srh__fields` – the search, its toggles `.ui-srh__toggle`, and the replace field `.ui-srh__replace`
2. **Summary** `.ui-srh__summary` – how many results in how many files, or that it's searching
3. **File** `.ui-srh__file` – a file's icon, name, folder `.ui-srh__folder` and count `.ui-srh__count`
4. **Match** `.ui-srh__match` – the line number `.ui-srh__line` and the line `.ui-srh__text`
5. **Hit** `.ui-srh__hit` – the matched text; while replacing, `.ui-srh__del` and `.ui-srh__ins`
6. **Actions** `.ui-srh__actions` – the page's buttons, then Collapse all or Expand all
7. **Empty** `.ui-srh__empty` – before a search, no results, or an error

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-srh-line-w`, the width kept for line numbers, and `--tc-srh-toggle`, the size of the three toggles.
When the card is narrower than 300 px, the folder beside a file's name is left out.

## Usage

### HTML

```html
<tc-search-results id="search" query="freezer"></tc-search-results>

<script type="module">
  import "@adamstavely/trenchcoat/search-results";
  import "@adamstavely/trenchcoat/tokens.css";

  const results = document.querySelector("#search");
  results.addEventListener("tc-search", async (e) => {
    results.status = "searching";
    const res = await fetch(`/api/search?q=${encodeURIComponent(e.detail.query)}`);
    results.results = await res.json();
    results.status = "done";
  });
  results.addEventListener("tc-open", (e) => console.log(e.detail.path, e.detail.line));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SearchResults, type SearchResultsFile, type SearchResultsStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Search({ find, open }: { find: (q: string) => Promise<SearchResultsFile[]>; open: (path: string, line: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultsFile[]>([]);
  const [status, setStatus] = useState<SearchResultsStatus>("idle");
  return (
    <SearchResults
      query={query}
      results={results}
      status={status}
      onSearch={async (q) => {
        setQuery(q);
        setStatus("searching");
        setResults(await find(q));
        setStatus("done");
      }}
      onTcOpen={(e) => open(e.detail.path, e.detail.line)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/search-results";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";

defineProps<{ options: TcSearchResults["options"]; results: TcSearchResults["results"] }>();
const onSearch = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-search-results :options="options" :results="results" @tc-search="onSearch"></tc-search-results>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SearchResults } from "@adamstavely/trenchcoat/angular/search-results";
import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";

@Component({
  selector: "app-search-results-example",
  imports: [SearchResults],
  template: `<tc-search-results [options]="options()" [results]="results()" (tc-search)="onSearch($event)"></tc-search-results>`,
})
export class SearchResultsExample {
  readonly options = input.required<TcSearchResults["options"]>();
  readonly results = input.required<TcSearchResults["results"]>();
  onSearch(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/search-results";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";

  let { options, results }: { options: TcSearchResults["options"]; results: TcSearchResults["results"] } = $props();
  let el: TcSearchResults;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-search", on);
    return () => el.removeEventListener("tc-search", on);
  });
</script>

<tc-search-results bind:this={el} {options} {results}></tc-search-results>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Search"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – where it searched |
| `query` | `query` | `string` | `""` | The text that was searched for |
| `options` | – | `SearchResultsOptions` | `{ caseSensitive: false, wholeWord: false, regex: false }` | Match case, whole word and regular expression |
| `results` | – | `SearchResultsFile[]` | `[]` | The files that matched, each with its matching lines |
| `status` | `status` | `SearchResultsStatus` | `"done"` | idle, searching, done or error |
| `error` | `error` | `string` | `""` | What went wrong, with status "error" |
| `truncated` | `truncated` | `boolean` | `false` | The page stopped before finding everything |
| `expanded` | – | `string[] \| null` | `null` | The open files' paths; null opens them all |
| `selected` | – | `SearchResultsSelection \| null` | `null` | The chosen match |
| `replaceable` | `replaceable` | `boolean` | `false` | Shows a replace field, with Replace and Replace all |
| `replacement` | `replacement` | `string` | `""` | The replace field's text |
| `hideField` | `hide-field` | `boolean` | `false` | Leaves out the search field, for a page that has its own |
| `maxHeight` | `max-height` | `number` | `480` | Height in px at which the results scroll |
| `actions` | – | `SearchResultsActionItem[]` | `[]` | Buttons in the header, before Collapse all |
| `labels` | – | `Partial<SearchResultsLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-search` | – | Yes | Enter in the search field ({ query, options }: SearchResultsSearch); cancelable – prevented, `query` stays as it was |
| `tc-options-change` | – | Yes | Match case, whole word or regular expression was toggled ({ options }: SearchResultsOptionsChange); cancelable – prevented, `options` stay as they were |
| `tc-expanded-change` | – | Yes | A file was opened or closed, or all were ({ expanded, path }: SearchResultsExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-selected-change` | – | Yes | Another match was chosen ({ selected, match }: SearchResultsSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-open` | – | No | A match was clicked, or Enter or Space pressed on it ({ path, line, column }: SearchResultsOpen) |
| `tc-replacement-change` | – | Yes | The replace field was typed in ({ replacement }: SearchResultsReplacementChange); cancelable – prevented, `replacement` stays as it was |
| `tc-replace` | – | No | Replace or Replace all was pressed, with `replaceable` ({ query, replacement, options, path, line, column }: SearchResultsReplace); one match carries its path, line and column |
| `tc-action` | – | No | A header button was pressed ({ id }: SearchResultsAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-srh-line-w` | `4ch` | both |
| `--tc-srh-toggle` | `24px` | both |

#### Design tokens it reads (59)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `searchResultsPattern(query: string, options: SearchResultsOptions): RegExp \| null` | The search as a regular expression, or null when it can't be one |

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-search-results :options="…">` | `<tc-search-results [options]="…">` | `<tc-search-results {options}>` |
| `results` | `el.results = …;` | `<… results={…} />` | `<tc-search-results :results="…">` | `<tc-search-results [results]="…">` | `<tc-search-results {results}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-search-results :expanded="…">` | `<tc-search-results [expanded]="…">` | `<tc-search-results {expanded}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-search-results :selected="…">` | `<tc-search-results [selected]="…">` | `<tc-search-results {selected}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-search-results :actions="…">` | `<tc-search-results [actions]="…">` | `<tc-search-results {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-search-results :labels="…">` | `<tc-search-results [labels]="…">` | `<tc-search-results {labels}>` |

*Also attributes: `heading`, `description`, `query`, `status`, `error`, `truncated`, `replaceable`, `replacement` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-search` | Yes | `el.addEventListener("tc-search", (e) => …)` | `ref.current.addEventListener("tc-search", …)` | `@tc-search="…"` | `(tc-search)="…($event)"` | `el.addEventListener("tc-search", …)` |
| `tc-options-change` | Yes | `el.addEventListener("tc-options-change", (e) => …)` | `ref.current.addEventListener("tc-options-change", …)` | `@tc-options-change="…"` | `(tc-options-change)="…($event)"` | `el.addEventListener("tc-options-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-replacement-change` | Yes | `el.addEventListener("tc-replacement-change", (e) => …)` | `ref.current.addEventListener("tc-replacement-change", …)` | `@tc-replacement-change="…"` | `(tc-replacement-change)="…($event)"` | `el.addEventListener("tc-replacement-change", …)` |
| `tc-replace` | No | `el.addEventListener("tc-replace", (e) => …)` | `onTcReplace={…}` | `@tc-replace="…"` | `(tc-replace)="…($event)"` | `el.addEventListener("tc-replace", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `options`, `expanded`, `selected` and `replacement` itself unless a listener calls `preventDefault()` on `tc-options-change`, `tc-expanded-change`, `tc-selected-change` or `tc-replacement-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-search-results id="search-results"></tc-search-results>

<script type="module">
  import "@adamstavely/trenchcoat/search-results";

  const el = document.querySelector("#search-results");
  el.addEventListener("tc-options-change", (e) => {
    e.preventDefault(); // the element keeps its options…
    if (allowed(e.detail.options)) el.options = e.detail.options; // …until the app sets it
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
import "@adamstavely/trenchcoat/search-results";
import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";

const props = defineProps<{ initial: TcSearchResults["options"] }>();
const options = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOptionsChange = (e: CustomEvent<{ options: TcSearchResults["options"] }>) => {
  e.preventDefault();
  options.value = e.detail.options;
};
</script>

<template>
  <tc-search-results :options="options" @tc-options-change="onOptionsChange"></tc-search-results>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SearchResults } from "@adamstavely/trenchcoat/angular/search-results";
import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";

@Component({
  selector: "app-controlled-search-results",
  imports: [SearchResults],
  template: `<tc-search-results [options]="options()" (tc-options-change)="onOptionsChange($event)"></tc-search-results>`,
})
export class ControlledSearchResults {
  readonly initial = input.required<TcSearchResults["options"]>();
  readonly options = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOptionsChange(e: CustomEvent<{ options: TcSearchResults["options"] }>) {
    e.preventDefault();
    this.options.set(e.detail.options);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/search-results";
  import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";

  let { initial }: { initial: TcSearchResults["options"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let options = $derived(initial);
  let el: TcSearchResults;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      options = (e as CustomEvent<{ options: TcSearchResults["options"] }>).detail.options;
    };
    el.addEventListener("tc-options-change", on);
    return () => el.removeEventListener("tc-options-change", on);
  });
</script>

<tc-search-results bind:this={el} {options}></tc-search-results>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-search-results")` returns a `TcSearchResults` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";`
- **React / Next.js:** Props: `import type { SearchResultsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SearchResults>`. The element class, for refs: `import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSearchResults["options"]` with `import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";`
- **Angular:** The directive types the template: `[options]` takes `TcSearchResults["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSearchResults } from "@adamstavely/trenchcoat/search-results";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `query` | `string` | What was searched for – controlled when given |
| `defaultQuery` | `string` | What was searched for at first, when `query` isn't controlled |
| `onSearch` | `(query: string, options: SearchResultsOptions) => void` | Enter was pressed in the search field |
| `onTcSearch` | `(event: CustomEvent<SearchResultsSearch>) => void` | The raw event, for `query` and `options` together |
| `replacement` | `string` | The replace field's text – controlled when given |
| `defaultReplacement` | `string` | The replace field's text at first, when `replacement` isn't controlled |
| `onReplacementChange` | `(replacement: string) => void` | The replace field was typed in |
| `selected` | `SearchResultsSelection \| null` | The chosen match – controlled when given |
| `defaultSelected` | `SearchResultsSelection \| null` | The chosen match at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: SearchResultsSelection \| null, match?: SearchResultsMatch) => void` | Another match was chosen |
| `expanded` | `string[] \| null` | The open files' paths, null for all – controlled when given |
| `defaultExpanded` | `string[] \| null` | The open files at first, when `expanded` isn't controlled (null: all) |
| `onExpandedChange` | `(expanded: string[] \| null) => void` | A file was opened or closed |
| `options` | `SearchResultsOptions` | Match case, whole word and regular expression – controlled when given |
| `defaultOptions` | `SearchResultsOptions` | The toggles at first, when `options` isn't controlled |
| `onOptionsChange` | `(options: SearchResultsOptions) => void` | A toggle changed |

*Renamed or hidden on the wrapper: `heading`, `query`, `replacement`, `selected`, `expanded`, `options`, `children`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

The fields and toggles are normal tab stops; the results are one tab stop.

| Key | What it does |
|---|---|
| Enter in the search field | Searches |
| Esc in the search field | Clears it |
| ↓ in the search field | Moves into the results |
| ↑ / ↓ | Move between files and matches |
| → | Opens a file, then goes to its first match |
| ← | Closes a file, or goes from a match to its file |
| Home / End | Go to the first or last row |
| Enter / Space | Opens a match, or folds a file |

### Screen readers

The results are a `tree` named by the heading. Files are `treeitem`s at level 1 with `aria-expanded`, and their count is
read as "3 results". Matches are at level 2 with `aria-selected`, and their line number is read as "Line 12". The summary
is a `role="status"`, so a finished search is announced; an error is an alert. The toggles are buttons with
`aria-pressed`, named "Match case", "Whole word" and "Regular expression". The tree is `aria-busy` while searching.

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
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
| **This component alone** | 24.6 KB | 8.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **33.7 KB** | **10.8 KB** |
| With Lit – the first component on a page | 55.2 KB | 17.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.6 ms** | the gallery demo's data, 172 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of results replaced |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 5.6 ms | results: first render, 709 nodes; update 1.9 ms |

Windowed: 10,000 items of results render 709 nodes in 5.6 ms – only the rows near the viewport are in the page.

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

- Pass `ranges` as UTF-16 `[start, end)` offsets from the search engine. Regex searches require these ranges for highlighting
  and replacement previews; without them the line is shown as plain text. The element never executes an arbitrary regex
  during rendering. Literal queries can still calculate their own highlights with match-case and whole-word options.
- `searchResultsPattern` constructs a regex for application code; execute untrusted patterns only in a search service or
  isolated worker with execution limits, not on the UI thread.
- Long lines are cut so the first match shows, with "…" where text was left out. Leading indentation is dropped.
- Set `truncated` when the page stopped early, and the summary says how many are shown.
- `selected` is a path, line and column, so it stays put when the same search runs again and tells two matches on one
  line apart. Without a column it's the first match on that line.
- Whole word matches where the query isn't next to a letter, digit or `_`, so `@media` and `fn(` work too.

## Do and don't

### Do

- Set `status` to "searching" while the page works, and "done" when it's finished, even with no results.
- Listen for `tc-open` to show the file at the line. It fires for a match that's already selected too.
- Answer `tc-replace` by changing the files, then search again so the results match.

### Don't

- Don't send every keystroke to a server. The element only asks on Enter.
- Don't show results for a search other than `query`, or the marks won't match what's shown.

## Related

- [File Tree](file-tree.md) – A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page
- [Problem List](problem-list.md) – diagnostics from a build, type check or linter, grouped by file, with a severity filter with counts, a text filter, severity marks that aren't colour alone, and quick fixes.
- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
- [Session Panel](../blocks/session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
