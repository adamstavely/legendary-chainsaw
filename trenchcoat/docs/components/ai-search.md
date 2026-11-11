<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# AI Search

**Search** · New

One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K

- **Element:** `<tc-ai-search>`
- **Size:** 10.1 KB gzip · 36.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-search";` |
| React / Next.js | `import { AiSearch } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-search";` · tags starting with tc- are custom elements |
| Angular | `import { AiSearch } from "@adamstavely/trenchcoat/angular/ai-search";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-search";` |

## Example

The live example is in the gallery at `#/ai-search`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One search box with two modes. In search mode it's a single-line field with suggestions – recent searches first, then
suggested ones – filtered as the person types, with what they typed picked out and an optional hint after each (“12
results”, “Yesterday”). Switch on AI mode and the field becomes a prompt a few lines tall, with
example prompts to start from. Under the field sit the AI mode switch and “Search within file contents”. Scopes the page
sets show as removable chips inside the field, a Clear button empties it, and ⌘K / Ctrl K focuses it from anywhere.
Every submit says what to search for, in which mode, whether to look inside files, and within which scopes.

### When to use

- The main search of an app that can answer questions as well as find things.
- Search inside a workspace, case or project, with the scope shown as chips.
- Anywhere people switch between keyword search and asking in plain language.

### When not to use

- Commands and navigation – use [Command Menu](command-menu.md).
- A conversation with an assistant – use [Chat Composer](chat-composer.md).
- Building a structured query – use [Query Builder](query-builder.md).
- Showing earlier searches – use [Search History](search-history.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Card** `.ui-aisr__box` – the search card; its ring shows where focus is
2. **Field** `.ui-aisr__field` – the search icon (a sparkle in AI mode), scopes, the input or prompt, then keys, Clear and
3. **Scopes** `.ui-aisr__scopes` – where the search looks, each chip removable
4. **Suggestions** `.ui-aisr__pop` – recent and suggested searches below the card, in search mode, with the keys to move,
5. **Examples** `.ui-aisr__examples` – prompts to start from, inside the card in AI mode
6. **Switches** `.ui-aisr__opts` – AI mode and Search within file contents, with the keys that send on the right

## Looks

Standard is a white search card on a gray tray, with the switches on the tray below it; its suggestions are a menu card
on a tray too. Clean is one white card with the switches as its last row, below a divider, and one menu for the
suggestions. Focus rings the whole card rather than the input. The keys hint on the right of the switches and the ⌘K
chips go when the search is narrower than about 460 px.

## Usage

### HTML

```html
<tc-ai-search id="search"></tc-ai-search>

<script type="module">
  import "@adamstavely/trenchcoat/ai-search";
  import "@adamstavely/trenchcoat/tokens.css";

  const search = document.querySelector("#search");
  search.suggestions = [{ label: "invoice 7741", kind: "recent" }, { label: "Board minutes 2026", kind: "suggested" }];
  search.examples = ["Who signed off the Q3 budget?"];
  search.addEventListener("tc-submit", (e) => console.log(e.detail.mode, e.detail.query));
</script>
```

### React / Next.js

```tsx
import { AiSearch } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Search() {
  return (
    <AiSearch
      suggestions={[{ label: "invoice 7741", kind: "recent" }, { label: "Board minutes 2026", kind: "suggested" }]}
      examples={["Who signed off the Q3 budget?"]}
      defaultScopes={[{ id: "case", label: "Case 22-1187" }]}
      onSearch={({ query, mode }) => console.log(mode, query)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-search";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";

defineProps<{ suggestions: TcAiSearch["suggestions"]; examples: TcAiSearch["examples"] }>();
const onSubmit = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-search :suggestions="suggestions" :examples="examples" @tc-submit="onSubmit"></tc-ai-search>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiSearch } from "@adamstavely/trenchcoat/angular/ai-search";
import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";

@Component({
  selector: "app-ai-search-example",
  imports: [AiSearch],
  template: `<tc-ai-search [suggestions]="suggestions()" [examples]="examples()" (tc-submit)="onSubmit($event)"></tc-ai-search>`,
})
export class AiSearchExample {
  readonly suggestions = input.required<TcAiSearch["suggestions"]>();
  readonly examples = input.required<TcAiSearch["examples"]>();
  onSubmit(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-search";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";

  let { suggestions, examples }: { suggestions: TcAiSearch["suggestions"]; examples: TcAiSearch["examples"] } = $props();
  let el: TcAiSearch;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-submit", on);
    return () => el.removeEventListener("tc-submit", on);
  });
</script>

<tc-ai-search bind:this={el} {suggestions} {examples}></tc-ai-search>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `"Search"` | The field's name for assistive tech |
| `mode` | `mode` | `AiSearchMode` | `"search"` | Search or AI mode. Changed by the user unless a tc-mode-change listener calls preventDefault() |
| `contents` | `contents` | `boolean` | `false` | Whether to search inside files as well as their names. Changed by the user unless tc-contents-change is prevented |
| `value` | `value` | `string` | `""` | The text in the field |
| `placeholder` | `placeholder` | `string` | `"Search files, people and topics"` | The hint in search mode |
| `aiPlaceholder` | `ai-placeholder` | `string` | `"Ask a question about your files"` | The hint in AI mode |
| `suggestions` | – | `AiSearchSuggestion[]` | `[]` | Recent and suggested searches, shown in search mode and filtered by what's typed |
| `examples` | – | `string[]` | `[]` | Prompts to start from in AI mode |
| `scopes` | – | `AiSearchScope[]` | `[]` | Where the search looks, as chips inside the field; removable |
| `aiLabel` | `ai-label` | `string` | `"AI mode"` | The AI mode switch's label |
| `contentsLabel` | `contents-label` | `string` | `"Search within file contents"` | The contents switch's label |
| `hotkey` | – | `string \| false` | `"mod+k"` | Focuses the field from anywhere ("mod+k" is ⌘K on Apple keyboards, Ctrl K elsewhere); false turns it off |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-submit` | – | No | A search or a question was sent ({ query, mode, contents, scopes }: AiSearchSubmit) |
| `tc-mode-change` | – | Yes | AI mode was switched ({ mode }: AiSearchModeChange); cancelable – prevented, `mode` stays as it was |
| `tc-contents-change` | – | Yes | "Search within file contents" was switched ({ contents }: AiSearchContentsChange); cancelable – prevented, `contents` stays as it was |
| `tc-query-change` | – | Yes | The text changed ({ query }: AiSearchQueryChange); cancelable – prevented, `value` stays as it was |
| `tc-scope-remove` | – | Yes | A scope chip was removed ({ id }: AiSearchScopeRemove); cancelable – prevented, `scopes` stays as it was |

#### Design tokens it reads (102)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-font-size`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-halo`, `--tc-focus-halo-width`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `suggestions` | `el.suggestions = …;` | `<… suggestions={…} />` | `<tc-ai-search :suggestions="…">` | `<tc-ai-search [suggestions]="…">` | `<tc-ai-search {suggestions}>` |
| `examples` | `el.examples = …;` | `<… examples={…} />` | `<tc-ai-search :examples="…">` | `<tc-ai-search [examples]="…">` | `<tc-ai-search {examples}>` |
| `scopes` | `el.scopes = …;` | `<… scopes={…} />` | `<tc-ai-search :scopes="…">` | `<tc-ai-search [scopes]="…">` | `<tc-ai-search {scopes}>` |
| `hotkey` | `el.hotkey = …;` | `<… hotkey={…} />` | `<tc-ai-search :hotkey="…">` | `<tc-ai-search [hotkey]="…">` | `<tc-ai-search {hotkey}>` |

*Also attributes: `label`, `mode`, `contents`, `value`, `placeholder`, `ai-placeholder`, `ai-label`, `contents-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-submit` | No | `el.addEventListener("tc-submit", (e) => …)` | `onSearch={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `ref.current.addEventListener("tc-mode-change", …)` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |
| `tc-contents-change` | Yes | `el.addEventListener("tc-contents-change", (e) => …)` | `ref.current.addEventListener("tc-contents-change", …)` | `@tc-contents-change="…"` | `(tc-contents-change)="…($event)"` | `el.addEventListener("tc-contents-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-scope-remove` | Yes | `el.addEventListener("tc-scope-remove", (e) => …)` | `ref.current.addEventListener("tc-scope-remove", …)` | `@tc-scope-remove="…"` | `(tc-scope-remove)="…($event)"` | `el.addEventListener("tc-scope-remove", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `mode` and `contents` itself unless a listener calls `preventDefault()` on `tc-mode-change` or `tc-contents-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ai-search id="ai-search"></tc-ai-search>

<script type="module">
  import "@adamstavely/trenchcoat/ai-search";

  const el = document.querySelector("#ai-search");
  el.addEventListener("tc-mode-change", (e) => {
    e.preventDefault(); // the element keeps its mode…
    if (allowed(e.detail.mode)) el.mode = e.detail.mode; // …until the app sets it
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
import "@adamstavely/trenchcoat/ai-search";
import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";

const props = defineProps<{ initial: TcAiSearch["mode"] }>();
const mode = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onModeChange = (e: CustomEvent<{ mode: TcAiSearch["mode"] }>) => {
  e.preventDefault();
  mode.value = e.detail.mode;
};
</script>

<template>
  <tc-ai-search :mode="mode" @tc-mode-change="onModeChange"></tc-ai-search>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AiSearch } from "@adamstavely/trenchcoat/angular/ai-search";
import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";

@Component({
  selector: "app-controlled-ai-search",
  imports: [AiSearch],
  template: `<tc-ai-search [mode]="mode()" (tc-mode-change)="onModeChange($event)"></tc-ai-search>`,
})
export class ControlledAiSearch {
  readonly initial = input.required<TcAiSearch["mode"]>();
  readonly mode = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onModeChange(e: CustomEvent<{ mode: TcAiSearch["mode"] }>) {
    e.preventDefault();
    this.mode.set(e.detail.mode);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-search";
  import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";

  let { initial }: { initial: TcAiSearch["mode"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let mode = $derived(initial);
  let el: TcAiSearch;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      mode = (e as CustomEvent<{ mode: TcAiSearch["mode"] }>).detail.mode;
    };
    el.addEventListener("tc-mode-change", on);
    return () => el.removeEventListener("tc-mode-change", on);
  });
</script>

<tc-ai-search bind:this={el} {mode}></tc-ai-search>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-search")` returns a `TcAiSearch` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";`
- **React / Next.js:** Props: `import type { AiSearchProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AiSearch>`. The element class, for refs: `import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiSearch["suggestions"]` with `import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";`
- **Angular:** The directive types the template: `[suggestions]` takes `TcAiSearch["suggestions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiSearch } from "@adamstavely/trenchcoat/ai-search";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `mode` | `AiSearchMode` | Search or AI mode – controlled when given |
| `defaultMode` | `AiSearchMode` | The mode on mount when `mode` isn't controlled |
| `onModeChange` | `(mode: AiSearchMode) => void` | AI mode was switched |
| `contents` | `boolean` | Search within file contents – controlled when given |
| `defaultContents` | `boolean` | The switch on mount when `contents` isn't controlled |
| `onContentsChange` | `(contents: boolean) => void` | "Search within file contents" was switched |
| `value` | `string` | The text in the field – controlled when given: the field changes only when the parent passes a new value, so the page can clear it after a search |
| `defaultValue` | `string` | The text in the field on mount when `value` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The text changed |
| `onSearch` | `(detail: AiSearchSubmit) => void` | A search or a question was sent |
| `scopes` | `AiSearchScope[]` | Where the search looks, as removable chips – controlled when given |
| `defaultScopes` | `AiSearchScope[]` | The scopes on mount when `scopes` isn't controlled |
| `onScopesChange` | `(next: AiSearchScope[]) => void` | A scope chip was removed; `next` is the list without it |

*Renamed or hidden on the wrapper: `mode`, `contents`, `value`, `defaultValue`, `scopes`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| ⌘K / Ctrl K | Focuses the field from anywhere – change it or turn it off with `hotkey` |
| ↓ / ↑ | Opens the suggestions and moves through them, wrapping at the ends (search mode) |
| Enter | Searches for the picked suggestion or what's typed; in AI mode, asks |
| Shift+Enter | Starts a new line (AI mode) |
| Escape | Closes the suggestions, then clears the field |
| Tab | Moves on to Clear, Send, the switch and the checkbox |

### Screen readers

In search mode the field is a `combobox` named by `label` (“Search”), with `aria-expanded`, `aria-controls` and
`aria-activedescendant` pointing into the suggestions `listbox`. In AI mode it's a text area named “Search, AI mode”.
The AI mode switch is a `switch`; the contents control a checkbox with its label. Scope chips' buttons say “Remove
Files”. Searching, asking, switching mode and removing a scope are confirmed in a polite status message.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.2 KB | 7.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.3 KB** | **10.1 KB** |
| With Lit – the first component on a page | 57.0 KB | 16.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 29 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of suggestions replaced |
| First on the page | 30 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.0 ms | suggestions: first render, 29 nodes; update 0.2 ms |
| 1,000 items | 1.8 ms | suggestions: first render, 29 nodes; update 0.3 ms |

What it renders doesn't grow with suggestions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window keydown` (internal/controllers – HotkeyController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write suggestions as people would type them; keep each to one line.
- Write example prompts as whole questions or requests, under about ten words.
- Name scopes by what they are: “Case 22-1187”, “Files”.

## Do and don't

### Do

- Fill `suggestions` from the person's own history first.
- Keep the AI mode choice per person, so the box opens the way they last used it.

### Don't

- Don't submit on every keystroke – suggestions are for picking; tc-submit is for searching.
- Don't turn the hotkey off just because another element uses ⌘K – pick one owner for it per page.

## Related

- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each
- [Query Builder](query-builder.md) – A search query built from conditions – a field, an operator that fits its type and a value per condition, AND / OR per group with one level of nesting, and the query read back in words and as a query string with Copy and Run
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane

## Changelog

- **Search:** - `tc-query-builder`: conditions in AND / OR groups. - Read back in words and as a query string. - `tc-search-history`: recent and saved searches. - Run again, save, and remove with Undo. - `tc-ai-search`: one search box with an AI mode. - Suggestions, example prompts, a "search within file contents" option, scope chips and ⌘K.
