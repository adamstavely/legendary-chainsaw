<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Search History

**Search** · New

Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each

- **Element:** `<tc-search-history>`
- **Size:** 9.7 KB gzip · 29.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/search-history";` |
| React / Next.js | `import { SearchHistory } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/search-history";` · tags starting with tc- are custom elements |
| Angular | `import { SearchHistory } from "@adamstavely/trenchcoat/angular/search-history";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/search-history";` |

## Example

The live example is in the gallery at `#/search-history`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The searches someone ran and the ones they kept. Two tabs, Recent and Saved, show their counts; a filter box narrows
either one by query or scope. Searches are grouped by day – Today, Yesterday, then the date – and each shows an icon
for how it ran (a sparkle for AI mode, a funnel for the builder), its query, and one quiet line with its scopes
(“Files”, “AI mode”), how many results it found and when it ran. Each search can be run again,
starred to keep it, or removed – which leaves “Removed · Undo” at the top until the next removal. With `schedulable`,
saved searches also offer Schedule, for a page that runs them as routines.

### When to use

- Beside a search box, so people can get back to what they looked for.
- A saved-searches page for queries people run every week.
- Case or research work where retracing earlier searches matters.

### When not to use

- Typing a new search – use [AI Search](ai-search.md).
- Building a query from conditions – use [Query Builder](query-builder.md).
- Past conversations with an assistant – use [Chat History](chat-history.md).
- Reusable prompts – use [Prompt Library](prompt-library.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-shis__tabs` – Recent and Saved, each with its count
2. **Filter** `.ui-shis__filter` – narrows the open tab by query or scope
3. **Removed** `.ui-shis__removed` – the last removal, with Undo
4. **Day** `.ui-shis__day-name` – Today, Yesterday, then the date
5. **Search** `.ui-shis__run` – the query, its scopes, results and time; runs it again
6. **Schedule** `.ui-shis__schedule` – on saved searches, with `schedulable`: asks the page to run it as a routine
7. **Star** `.ui-shis__star` – saves or unsaves the search
8. **Remove** `.ui-shis__remove` – takes the search out of the history

## Looks

Standard is a white card on a gray tray, with the header and tabs on the tray above it. Clean is one white card with
the header as its first row. The rows and actions are the same in both. With a mouse, a
row's actions appear when it's hovered or focused, and a saved search keeps its star; on touch screens they always show. The filter is a quiet field – a soft
fill, with the field's ring only when it has focus.

## Usage

### HTML

```html
<tc-search-history id="history"></tc-search-history>

<script type="module">
  import "@adamstavely/trenchcoat/search-history";
  import "@adamstavely/trenchcoat/tokens.css";

  const history = document.querySelector("#history");
  history.searches = [
    { id: "s1", query: "invoice 7741", scopes: ["Files"], results: 12, at: Date.now() - 5 * 60_000 },
    { id: "s2", query: "Who approved the Q3 budget?", scopes: ["AI mode"], results: 1, at: Date.now() - 3_600_000, saved: true },
  ];
  history.addEventListener("tc-select", (e) => console.log("run again", e.detail.search.query));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SearchHistory, type SearchHistoryEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function History({ initial }: { initial: SearchHistoryEntry[] }) {
  const [searches, setSearches] = useState(initial);
  return (
    <SearchHistory
      searches={searches}
      onSearchesChange={setSearches}
      onRunAgain={(s) => console.log(s.query)}
      schedulable
      onSchedule={(s) => console.log("schedule", s.query)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/search-history";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";

defineProps<{ searches: TcSearchHistory["searches"] }>();
const onSelect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-search-history :searches="searches" @tc-select="onSelect"></tc-search-history>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SearchHistory } from "@adamstavely/trenchcoat/angular/search-history";
import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";

@Component({
  selector: "app-search-history-example",
  imports: [SearchHistory],
  template: `<tc-search-history [searches]="searches()" (tc-select)="onSelect($event)"></tc-search-history>`,
})
export class SearchHistoryExample {
  readonly searches = input.required<TcSearchHistory["searches"]>();
  onSelect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/search-history";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";

  let { searches }: { searches: TcSearchHistory["searches"] } = $props();
  let el: TcSearchHistory;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-select", on);
    return () => el.removeEventListener("tc-select", on);
  });
</script>

<tc-search-history bind:this={el} {searches}></tc-search-history>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Search history"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `searches` | – | `SearchHistoryEntry[]` | `[]` | The searches, any order; shown newest first. Saving and removing change it unless their events are prevented |
| `tab` | `tab` | `SearchHistoryTab` | `"recent"` | The tab shown. Changed by the user unless a tc-tab-change listener calls preventDefault() |
| `filter` | `filter` | `string` | `""` | What the filter box holds |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times and numbers, e.g. "en-GB"; by default the browser's |
| `schedulable` | `schedulable` | `boolean` | `false` | Whether saved searches offer Schedule, to run them as routines (tc-schedule) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-select` | – | No | A search was picked to run again ({ id, search }: SearchHistorySelect) |
| `tc-saved-change` | – | Yes | A search was saved or unsaved ({ id, saved, searches }: SearchHistorySavedChange); cancelable – prevented, `searches` stays as it was |
| `tc-remove` | – | Yes | A search was removed ({ id, search, searches }: SearchHistoryRemove); cancelable – prevented, it stays until the page takes it out of `searches` |
| `tc-restore` | – | Yes | A removed search was put back with Undo ({ id, search, searches }: SearchHistoryRemove); cancelable – prevented, it comes back when the page puts it in `searches` |
| `tc-tab-change` | – | Yes | The tab changed ({ tab }: SearchHistoryTabChange); cancelable – prevented, `tab` stays as it was |
| `tc-schedule` | – | Yes | Schedule was pressed on a saved search, with `schedulable` ({ id, search }: SearchHistorySchedule) – open your routine form here; cancelable – prevented, nothing is announced |

#### Design tokens it reads (62)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-radius-md`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `searches` | `el.searches = …;` | `<… searches={…} />` | `<tc-search-history :searches="…">` | `<tc-search-history [searches]="…">` | `<tc-search-history {searches}>` |

*Also attributes: `heading`, `description`, `tab`, `filter`, `now`, `locale`, `schedulable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-select` | No | `el.addEventListener("tc-select", (e) => …)` | `onRunAgain={…}` | `@tc-select="…"` | `(tc-select)="…($event)"` | `el.addEventListener("tc-select", …)` |
| `tc-saved-change` | Yes | `el.addEventListener("tc-saved-change", (e) => …)` | `ref.current.addEventListener("tc-saved-change", …)` | `@tc-saved-change="…"` | `(tc-saved-change)="…($event)"` | `el.addEventListener("tc-saved-change", …)` |
| `tc-remove` | Yes | `el.addEventListener("tc-remove", (e) => …)` | `ref.current.addEventListener("tc-remove", …)` | `@tc-remove="…"` | `(tc-remove)="…($event)"` | `el.addEventListener("tc-remove", …)` |
| `tc-restore` | Yes | `el.addEventListener("tc-restore", (e) => …)` | `ref.current.addEventListener("tc-restore", …)` | `@tc-restore="…"` | `(tc-restore)="…($event)"` | `el.addEventListener("tc-restore", …)` |
| `tc-tab-change` | Yes | `el.addEventListener("tc-tab-change", (e) => …)` | `ref.current.addEventListener("tc-tab-change", …)` | `@tc-tab-change="…"` | `(tc-tab-change)="…($event)"` | `el.addEventListener("tc-tab-change", …)` |
| `tc-schedule` | Yes | `el.addEventListener("tc-schedule", (e) => …)` | `onSchedule={…}` | `@tc-schedule="…"` | `(tc-schedule)="…($event)"` | `el.addEventListener("tc-schedule", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `tab` itself unless a listener calls `preventDefault()` on `tc-tab-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-search-history id="search-history"></tc-search-history>

<script type="module">
  import "@adamstavely/trenchcoat/search-history";

  const el = document.querySelector("#search-history");
  el.addEventListener("tc-tab-change", (e) => {
    e.preventDefault(); // the element keeps its tab…
    if (allowed(e.detail.tab)) el.tab = e.detail.tab; // …until the app sets it
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
import "@adamstavely/trenchcoat/search-history";
import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";

const props = defineProps<{ initial: TcSearchHistory["tab"] }>();
const tab = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTabChange = (e: CustomEvent<{ tab: TcSearchHistory["tab"] }>) => {
  e.preventDefault();
  tab.value = e.detail.tab;
};
</script>

<template>
  <tc-search-history :tab="tab" @tc-tab-change="onTabChange"></tc-search-history>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SearchHistory } from "@adamstavely/trenchcoat/angular/search-history";
import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";

@Component({
  selector: "app-controlled-search-history",
  imports: [SearchHistory],
  template: `<tc-search-history [tab]="tab()" (tc-tab-change)="onTabChange($event)"></tc-search-history>`,
})
export class ControlledSearchHistory {
  readonly initial = input.required<TcSearchHistory["tab"]>();
  readonly tab = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTabChange(e: CustomEvent<{ tab: TcSearchHistory["tab"] }>) {
    e.preventDefault();
    this.tab.set(e.detail.tab);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/search-history";
  import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";

  let { initial }: { initial: TcSearchHistory["tab"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let tab = $derived(initial);
  let el: TcSearchHistory;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      tab = (e as CustomEvent<{ tab: TcSearchHistory["tab"] }>).detail.tab;
    };
    el.addEventListener("tc-tab-change", on);
    return () => el.removeEventListener("tc-tab-change", on);
  });
</script>

<tc-search-history bind:this={el} {tab}></tc-search-history>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-search-history")` returns a `TcSearchHistory` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";`
- **React / Next.js:** Props: `import type { SearchHistoryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SearchHistory>`. The element class, for refs: `import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSearchHistory["searches"]` with `import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";`
- **Angular:** The directive types the template: `[searches]` takes `TcSearchHistory["searches"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSearchHistory } from "@adamstavely/trenchcoat/search-history";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `searches` | `SearchHistoryEntry[]` | The searches – controlled when given: saving, removing and Undo report the next list through onSearchesChange |
| `defaultSearches` | `SearchHistoryEntry[]` | The searches on mount when `searches` isn't controlled |
| `onSearchesChange` | `(next: SearchHistoryEntry[]) => void` | A search was saved, unsaved, removed or put back; `next` is the list as it will be |
| `tab` | `SearchHistoryTab` | The tab shown – controlled when given |
| `defaultTab` | `SearchHistoryTab` | The tab on mount when `tab` isn't controlled |
| `onTabChange` | `(tab: SearchHistoryTab) => void` | The tab changed |
| `onRunAgain` | `(search: SearchHistoryEntry) => void` | A search was picked to run again |
| `onSchedule` | `(search: SearchHistoryEntry) => void` | Schedule was pressed on a saved search (with `schedulable`) – open your routine form |

*Renamed or hidden on the wrapper: `heading`, `searches`, `tab`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

The tabs are one tab stop and the searches' buttons another.

| Key | What it does |
|---|---|
| ← / → on the tabs | Switches between Recent and Saved |
| ↑ / ↓ | Moves to the same action on the previous or next search (from Schedule to a search without one: its Star) |
| ← / → in the list | Moves between a search's Run, Schedule, Star and Remove |
| Home / End | Moves to the first or last search |
| Enter / Space | Runs, stars or removes, as focused |
| Tab | Leaves the list |

Removing a search moves focus to Undo; Undo returns it to the search.

### Screen readers

The tabs are a `tablist` labelled “Searches”, and the list a `tabpanel`. Days are sections named by the day. A search's
button reads its query, scopes, results and time, then “run again”. The star is a toggle button, “Save “invoice 7741””,
pressed when saved; Schedule and Remove say which search they act on. Saving, removing, scheduling and Undo are
confirmed in a polite status message.

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
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.2 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.8 KB** | **9.7 KB** |
| With Lit – the first component on a page | 51.7 KB | 16.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.0 ms** | the gallery demo's data, 196 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of searches replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 17 ms | searches: first render, 2,297 nodes; update 6.6 ms |
| 1,000 items | 136 ms | searches: first render, 22,612 nodes; update 37 ms |

1,000 items of searches: 136 ms. It renders every item, so a first render passes 50 ms (a long task) at about 370 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep queries as typed; for builder queries pass the read-back in words.
- Name scopes in a word or two: “Files”, “AI mode”, “Contents”.
- Pass `results` when you have it – zero results is useful to see.

## Do and don't

### Do

- Keep `searches` in your store and pass the next list from the events, so stars and removals persist.
- Use the page's clock for `now` when times must match other parts of the page.
- With `schedulable`, open a `routine-form` from tc-schedule, its name and instructions filled in from the search.

### Don't

- Don't remove searches without Undo – the element's own Undo only works if the removal is kept until the next one.
- Don't list hundreds of searches – trim the history to recent weeks.

## Related

- [AI Search](ai-search.md) – One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K
- [Query Builder](query-builder.md) – A search query built from conditions – a field, an operator that fits its type and a value per condition, AND / OR per group with one level of nesting, and the query read back in words and as a query string with Copy and Run
- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled

## Changelog

- **search-history** reads the clock on every tick, so times stay right after sleep.
- **Search:** - `tc-query-builder`: conditions in AND / OR groups. - Read back in words and as a query string. - `tc-search-history`: recent and saved searches. - Run again, save, and remove with Undo. - `tc-ai-search`: one search box with an AI mode. - Suggestions, example prompts, a "search within file contents" option, scope chips and ⌘K.
