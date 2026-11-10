<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Bibliography

**Research & portfolio** · New

A reading list set in APA, MLA, Chicago (notes–bibliography), Harvard or IEEE, with live DOIs, tags, search and sort, Copy, and export as BibTeX, RIS or plain text

- **Element:** `<tc-bibliography>`
- **Size:** 12.5 KB gzip · 39.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/bibliography";` |
| React / Next.js | `import { Bibliography } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/bibliography";` · tags starting with tc- are custom elements |
| Angular | `import { Bibliography } from "@adamstavely/trenchcoat/angular/bibliography";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/bibliography";` |

## Example

The live example is in the gallery at `#/bibliography`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A reading list, formatted. Each reference is set in the chosen citation style – APA 7, MLA 9, Chicago
(notes–bibliography), Harvard or IEEE – with a hanging indent (numbered for IEEE). Its DOI or link is live, its tags
show as chips, and it has its own Copy button. The toolbar picks the style and the order (author, newest first,
title) and searches authors, titles, journals, years and tags. It also copies the selected references, and exports
them – or everything shown, when none are ticked – as BibTeX, RIS or plain text.

The formatting covers what reading lists mostly hold: journal articles, books, chapters, reports, web pages and
theses. It follows each style's rules for listing authors ("&", "and", et al.), but not editions, editors or
translators. The formatters are exported too, for a page or a server: `formatReference`,
`formatReferenceTemplate`, `toBibTeX` and `toRIS`.

### When to use

- A project's or team's sources, kept together and copied into documents in the house style.
- Handing references to a reference manager (BibTeX or RIS).

### When not to use

- Where one work is cited, by section – use [Citation Sections](citation-sections.md).
- A badge for one source in running text – use [Citation Badge](citation-badge.md).
- Files people open, not cite – use [Document List](document-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Toolbar** `.ui-bib__toolbar` – select all, search, the style, the order, Copy and Export
2. **Export menu** `.ui-bib__menu` – BibTeX, RIS or plain text
3. **Entry** `.ui-bib__entry` – its checkbox, the formatted reference, its tags and Copy
4. **Reference** `.ui-bib__ref` – the reference with a hanging indent; IEEE's number in its own column
5. **Tags** `.ui-bib__tags` – the reference's tags

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
Titles and journals are in italics where the style sets them so. Selected entries have a soft fill. A page can widen
the hanging indent with `--tc-bib-indent`.

## Usage

### HTML

```html
<tc-bibliography citation-style="harvard" heading="Reading list"></tc-bibliography>
<script type="module">
  document.querySelector("tc-bibliography").references = [
    { id: "a", type: "book", authors: [{ family: "Haddad", given: "Rami" }], title: "Gardening the sea", publisher: "Harbour Lane Press", year: 2019 },
  ];
</script>
```

### React / Next.js

```tsx
import { Bibliography, type Reference } from "@adamstavely/trenchcoat/react";

export function ReadingList({ references }: { references: Reference[] }) {
  return <Bibliography title="Reading list" references={references} defaultCitationStyle="apa" onExport={(d) => console.log(d.format, d.ids)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/bibliography";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";

defineProps<{ references: TcBibliography["references"]; selected: TcBibliography["selected"] }>();
const onCitationStyleChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-bibliography :references="references" :selected="selected" @tc-citation-style-change="onCitationStyleChange"></tc-bibliography>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Bibliography } from "@adamstavely/trenchcoat/angular/bibliography";
import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";

@Component({
  selector: "app-bibliography-example",
  imports: [Bibliography],
  template: `<tc-bibliography [references]="references()" [selected]="selected()" (tc-citation-style-change)="onCitationStyleChange($event)"></tc-bibliography>`,
})
export class BibliographyExample {
  readonly references = input.required<TcBibliography["references"]>();
  readonly selected = input.required<TcBibliography["selected"]>();
  onCitationStyleChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bibliography";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";

  let { references, selected }: { references: TcBibliography["references"]; selected: TcBibliography["selected"] } = $props();
  let el: TcBibliography;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-citation-style-change", on);
    return () => el.removeEventListener("tc-citation-style-change", on);
  });
</script>

<tc-bibliography bind:this={el} {references} {selected}></tc-bibliography>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Bibliography"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `references` | – | `Reference[]` | `[]` | The references, any order |
| `citationStyle` | `citation-style` | `CitationStyle` | `"apa"` | The citation style (not `style`, which every element has for CSS). Changed by the user unless tc-citation-style-change is prevented |
| `selected` | – | `string[]` | `[]` | The ticked references' ids. Changed by the user unless tc-selected-change is prevented |
| `sort` | `sort` | `BibliographySort` | `"author"` | The order. Changed by the user unless tc-sort-change is prevented |
| `filter` | `filter` | `string` | `""` | Shows only references whose authors, title, container, year or tags hold this |
| `filename` | `filename` | `string` | `"bibliography"` | The name exported files are saved under, before the extension |
| `shown` | – | `Reference[]` | – | The references shown: filtered, then sorted |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-citation-style-change` | – | Yes | The citation style changed ({ citationStyle }: BibliographyCitationStyleChange); cancelable – prevented, `citationStyle` stays as it was |
| `tc-selected-change` | – | Yes | References were ticked or unticked ({ selected }: BibliographySelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-sort-change` | – | Yes | The order changed ({ sort }: BibliographySortChange); cancelable – prevented, `sort` stays as it was |
| `tc-copy` | – | Yes | A reference, or the selected ones, were copied ({ text, ids }: BibliographyCopy); cancelable – prevented, nothing is copied |
| `tc-export` | – | Yes | Export was chosen ({ format, text, ids }: BibliographyExport); cancelable – prevented, the page saves it its own way; otherwise the file downloads |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bib-indent` | `var(--tc-space-4)` | clean, both |

#### Design tokens it reads (72)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-space-8`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `formatReference(ref: Reference, style: CitationStyle, n?: number): string` | A reference as plain text in a citation style; `n` numbers it for IEEE |
| `formatReferenceTemplate(ref: Reference, style: CitationStyle, n?: number): TemplateResult` | A reference in a citation style as a template: titles in italics where the style sets them so, DOI / URL as links |
| `toBibTeX(refs: Reference[]): string` | References as BibTeX |
| `toRIS(refs: Reference[]): string` | References as RIS |

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
| `references` | `el.references = …;` | `<… references={…} />` | `<tc-bibliography :references="…">` | `<tc-bibliography [references]="…">` | `<tc-bibliography {references}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-bibliography :selected="…">` | `<tc-bibliography [selected]="…">` | `<tc-bibliography {selected}>` |

*Also attributes: `heading`, `description`, `citation-style`, `sort`, `filter`, `filename` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-citation-style-change` | Yes | `el.addEventListener("tc-citation-style-change", (e) => …)` | `ref.current.addEventListener("tc-citation-style-change", …)` | `@tc-citation-style-change="…"` | `(tc-citation-style-change)="…($event)"` | `el.addEventListener("tc-citation-style-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-sort-change` | Yes | `el.addEventListener("tc-sort-change", (e) => …)` | `ref.current.addEventListener("tc-sort-change", …)` | `@tc-sort-change="…"` | `(tc-sort-change)="…($event)"` | `el.addEventListener("tc-sort-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyReferences={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-export` | Yes | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `citationStyle`, `selected` and `sort` itself unless a listener calls `preventDefault()` on `tc-citation-style-change`, `tc-selected-change` or `tc-sort-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-bibliography id="bibliography"></tc-bibliography>

<script type="module">
  import "@adamstavely/trenchcoat/bibliography";

  const el = document.querySelector("#bibliography");
  el.addEventListener("tc-citation-style-change", (e) => {
    e.preventDefault(); // the element keeps its citationStyle…
    if (allowed(e.detail.citationStyle)) el.citationStyle = e.detail.citationStyle; // …until the app sets it
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
import "@adamstavely/trenchcoat/bibliography";
import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";

const props = defineProps<{ initial: TcBibliography["citationStyle"] }>();
const citationStyle = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCitationStyleChange = (e: CustomEvent<{ citationStyle: TcBibliography["citationStyle"] }>) => {
  e.preventDefault();
  citationStyle.value = e.detail.citationStyle;
};
</script>

<template>
  <tc-bibliography :citationStyle="citationStyle" @tc-citation-style-change="onCitationStyleChange"></tc-bibliography>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Bibliography } from "@adamstavely/trenchcoat/angular/bibliography";
import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";

@Component({
  selector: "app-controlled-bibliography",
  imports: [Bibliography],
  template: `<tc-bibliography [citationStyle]="citationStyle()" (tc-citation-style-change)="onCitationStyleChange($event)"></tc-bibliography>`,
})
export class ControlledBibliography {
  readonly initial = input.required<TcBibliography["citationStyle"]>();
  readonly citationStyle = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCitationStyleChange(e: CustomEvent<{ citationStyle: TcBibliography["citationStyle"] }>) {
    e.preventDefault();
    this.citationStyle.set(e.detail.citationStyle);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/bibliography";
  import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";

  let { initial }: { initial: TcBibliography["citationStyle"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let citationStyle = $derived(initial);
  let el: TcBibliography;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      citationStyle = (e as CustomEvent<{ citationStyle: TcBibliography["citationStyle"] }>).detail.citationStyle;
    };
    el.addEventListener("tc-citation-style-change", on);
    return () => el.removeEventListener("tc-citation-style-change", on);
  });
</script>

<tc-bibliography bind:this={el} {citationStyle}></tc-bibliography>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-bibliography")` returns a `TcBibliography` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";`
- **React / Next.js:** Props: `import type { BibliographyProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Bibliography>`. The element class, for refs: `import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBibliography["references"]` with `import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";`
- **Angular:** The directive types the template: `[references]` takes `TcBibliography["references"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBibliography } from "@adamstavely/trenchcoat/bibliography";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `citationStyle` | `CitationStyle` | The citation style – controlled when given |
| `defaultCitationStyle` | `CitationStyle` | The style on mount when `citationStyle` isn't controlled |
| `onCitationStyleChange` | `(style: CitationStyle) => void` | The style changed |
| `selected` | `string[]` | The ticked references' ids – controlled when given |
| `defaultSelected` | `string[]` | The ticked references on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string[]) => void` | References were ticked or unticked |
| `sort` | `BibliographySort` | The order – controlled when given |
| `defaultSort` | `BibliographySort` | The order on mount when `sort` isn't controlled |
| `onSortChange` | `(sort: BibliographySort) => void` | The order changed |
| `onCopyReferences` | `( detail: BibliographyCopy, event: CustomEvent<BibliographyCopy>, ) => void` | References were copied; `event.preventDefault()` stops the copy |
| `onExport` | `( detail: BibliographyExport, event: CustomEvent<BibliographyExport>, ) => void` | Export was chosen; `event.preventDefault()` to save it your own way |

*Renamed or hidden on the wrapper: `heading`, `citationStyle`, `selected`, `sort`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Space on a checkbox | Ticks or unticks a reference |
| ↓ / ↑ on Export | Opens the menu at its first / last format |
| ↓ / ↑, Home / End in the menu | Moves between formats |
| Enter or Space in the menu | Exports in that format |
| Escape in the menu | Closes it, back to Export |

### Screen readers

- The list is an ordered list named by the heading. Each checkbox is named by its reference's title, and each Copy
  button says which reference it copies.
- The style and order are native selects; Export is a menu button with a `menu`.
- Copying and exporting are announced in a polite status line.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 31.7 KB | 10.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **39.5 KB** | **12.6 KB** |
| With Lit – the first component on a page | 62.0 KB | 19.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 177 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of references replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 10 ms | references: first render, 1,746 nodes; update 1.3 ms |
| 1,000 items | 103 ms | references: first render, 16,919 nodes; update 8.8 ms |

1,000 items of references: 103 ms. It renders every item, so a first render passes 50 ms (a long task) at about 490 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give authors as family and given names; organisations as a family name only.
- Keep titles in the case you want them shown – the styles don't recase them.
- Prefer a DOI to a URL; give `accessed` for web pages.

## Do and don't

### Do

- Let people pick their style – fields differ.
- Keep the list's tags short so they scan.

### Don't

- Rely on it for editions, editors or translations – check those by hand.
- Use the plain-text copy where italics matter: export BibTeX or RIS into a reference manager instead.

## Related

- [Citation Badge](citation-badge.md) – A small badge of how a work is cited – publications, supporting, mentioning and contrasting counts with their marks, labelled or compact, a tooltip saying what each means and an optional link to the details
- [Citation Sections](citation-sections.md) – Where a work is cited – a donut of citing sections (Intro, Methods, Results, Discussion, Other) shaded darkest first, a legend with letter chips and counts, and the section under the pointer or focus with its share
- [Publication Impact](publication-impact.md) – One paper's impact on one card – venue, topic, grade and authors, downloads, views, citations and attention with a reads sparkline, mentions, who is reading, and peer, reader and sponsor feedback with a sentiment each
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row

## Changelog

- **Research & portfolio** - **Roadmap Timeline** (`tc-roadmap-timeline`) – Gantt-style lanes with progress, milestones, Today and dependency arrows, at week, month or quarter scale. - **Prioritisation Matrix** (`tc-prioritisation-matrix`) – value against effort, points dragged or moved with the arrow keys, listed by quadrant. - **Risk Register** (`tc-risk-register`) – a 5 × 5 likelihood × impact grid beside a sortable, rescorable register. - **Bibliography** (`tc-bibliography`) – references in APA, MLA, Chicago, Harvard or IEEE, with Copy and BibTeX / RIS export.
