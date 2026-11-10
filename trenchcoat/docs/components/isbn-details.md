<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# ISBN Details

**Inputs & controls** · New

ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages

- **Element:** `<tc-isbn-details>`
- **Size:** 12.5 KB gzip · 37.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/isbn-details";` |
| React / Next.js | `import { IsbnDetails } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/isbn-details";` · tags starting with tc- are custom elements |
| Angular | `import { IsbnDetails } from "@adamstavely/trenchcoat/angular/isbn-details";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/isbn-details";` |

## Example

The live example is in the gallery at `#/isbn-details`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Text that mentions books – a reading list, a syllabus, a chat answer – with every ISBN found and marked. Hover a
number for a moment, or focus it, and a card shows the book: its cover, title, authors, publisher, year and pages,
and the ISBN in both its 10- and 13-digit forms with Copy. Only numbers whose check digit is right are marked, so
phone numbers, order references and other lookalikes stay plain text. The app supplies the book details; the
component asks for them, caches them by ISBN and shows loading, an error with Retry, or "No details for this ISBN".

### When to use

- Reading lists, course outlines or citations where people want to know which book a number is without leaving
  the page.
- Model answers that recommend books, so a reader can check each ISBN points at the book the answer names.
- Any text with ISBNs that people copy into another system – the card gives both forms to copy.

### When not to use

- A short help text attached to one control – use [Tooltip](tooltip.md).
- Highlighting and commenting on passages of a document – use [Text Annotator](text-annotator.md).
- Picking a book as a value in a form – use [Mention Picker](mention-picker.md) with your catalogue as its suggestions.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-isbn__text` – the passage, shown as written
2. **ISBN** `.ui-isbn__mark` – a valid ISBN, marked and focusable; lookalikes stay plain
3. **Card** `.ui-isbn__pop` – the book's details, opened by hover or focus
4. **Cover** `.ui-isbn__cover` – the cover image, or a book icon when there's none
5. **Both forms** `.ui-isbn__ids` – the ISBN-13 and ISBN-10, each with Copy

## Looks

Standard tints each ISBN with a soft accent fill and a solid underline, and gives the cover a raised shadow. Clean
marks the number with a dotted underline only and frames the cover with a hairline. The card is the shared floating
surface in both looks, with the menu radius and shadow of each.

## Usage

### HTML

```html
<tc-isbn-details id="reading"></tc-isbn-details>

<script type="module">
  import "@adamstavely/trenchcoat/isbn-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const reading = document.querySelector("#reading");
  reading.text = "Start with ISBN 978-0-306-40615-7, then the field guide 0-8044-2957-X.";
  reading.resolve = async (isbn13, signal) => {
    const res = await fetch(`/api/books/${isbn13}`, { signal });
    return res.status === 404 ? null : res.json();
  };
  reading.addEventListener("tc-copy", (e) => console.log("copied", e.detail.form, e.detail.text));
</script>
```

### React / Next.js

```tsx
import { IsbnDetails, type IsbnBook } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const books: Record<string, IsbnBook> = {
  "9780306406157": { title: "Quiet Interfaces", authors: ["Ines Okafor"], publisher: "Harbour Lane Books", year: 2021, pages: 312 },
};

export function ReadingList() {
  return <IsbnDetails text="Start with ISBN 978-0-306-40615-7 before the first session." resolve={(isbn13) => books[isbn13] ?? null} onCopy={(text) => console.log("copied", text)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/isbn-details";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";

defineProps<{ resolve: TcIsbnDetails["resolve"] }>();
const onIsbnLookup = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-isbn-details :resolve="resolve" @tc-isbn-lookup="onIsbnLookup"></tc-isbn-details>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { IsbnDetails } from "@adamstavely/trenchcoat/angular/isbn-details";
import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";

@Component({
  selector: "app-isbn-details-example",
  imports: [IsbnDetails],
  template: `<tc-isbn-details [resolve]="resolve()" (tc-isbn-lookup)="onIsbnLookup($event)"></tc-isbn-details>`,
})
export class IsbnDetailsExample {
  readonly resolve = input.required<TcIsbnDetails["resolve"]>();
  onIsbnLookup(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/isbn-details";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";

  let { resolve }: { resolve: TcIsbnDetails["resolve"] } = $props();
  let el: TcIsbnDetails;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-isbn-lookup", on);
    return () => el.removeEventListener("tc-isbn-lookup", on);
  });
</script>

<tc-isbn-details bind:this={el} {resolve}></tc-isbn-details>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text to find ISBNs in: plain text, shown as written (line breaks kept) |
| `resolve` | – | `IsbnResolver \| undefined` | `undefined` | Supplies a book's details for an ISBN-13 – a book, null for none, or a promise; used when no tc-isbn-lookup listener responds |
| `hoverDelay` | `hover-delay` | `number` | `300` | How long the pointer rests on a mark before its card opens, ms |
| `notFoundText` | `not-found-text` | `string` | `"No details for this ISBN"` | What the card says when there are no details for an ISBN |
| `errorText` | `error-text` | `string` | `"Couldn't load the details."` | What the card says when the lookup failed |
| `isbns` | – | `IsbnMatch[]` | – | The valid ISBNs in `text`, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-isbn-lookup` | – | Yes | A card needs a book's details ({ isbn13, isbn10, signal, respondWith }: IsbnLookupDetail); cancelable – call respondWith() with the book (or a promise), or prevent it without responding for "no details" |
| `tc-copy` | – | Yes | Copy was pressed on an ISBN ({ text, form }: IsbnCopyDetail); cancelable – prevent it to copy your own way |
| `tc-open-change` | – | No | A card opened or closed ({ isbn13 }: IsbnOpenChange; null when closed) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `clearCache(isbn13?: string)` | `void` | Forgets cached details – one ISBN-13's, or all of them – so the next card asks again |
| `openCard(index: unknown)` | `void` | Opens the card for the ISBN at `index` in `isbns`, pinned open; focus stays where it is |
| `closeCard()` | `void` | Closes the open card, if any |

#### Design tokens it reads (46)

`--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseIsbn(input: string): IsbnParts` | Reads an ISBN-10 or ISBN-13, written with or without hyphens or spaces and optionally after "ISBN", "ISBN-10" or "ISBN-13", and gives it in both forms. A 979 ISBN-13 has no ISBN-10. Invalid input gives `{ isbn13: "", valid: false }`. |
| `isValidIsbn(input: string): void` | Whether `input` is a valid ISBN-10 or ISBN-13 (check digit included) |
| `findIsbns(text: string): IsbnMatch[]` | Every valid ISBN in `text`, in order: compact or hyphenated (or spaced) as published, with or without an "ISBN" label (the range covers the number only). Numbers that fail the check digit, 13-digit numbers without the 978 / 979 prefix, and numbers inside longer runs of digits aren't returned. |

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
| `resolve` | `el.resolve = …;` | `<… resolve={…} />` | `<tc-isbn-details :resolve="…">` | `<tc-isbn-details [resolve]="…">` | `<tc-isbn-details {resolve}>` |

*Also attributes: `text`, `hover-delay`, `not-found-text`, `error-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-isbn-lookup` | Yes | `el.addEventListener("tc-isbn-lookup", (e) => …)` | `onLookup={…}` | `@tc-isbn-lookup="…"` | `(tc-isbn-lookup)="…($event)"` | `el.addEventListener("tc-isbn-lookup", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

`tc-isbn-lookup`, `tc-copy` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-isbn-details")` returns a `TcIsbnDetails` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";`
- **React / Next.js:** Props: `import type { IsbnDetailsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof IsbnDetails>`. The element class, for refs: `import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcIsbnDetails["resolve"]` with `import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";`
- **Angular:** The directive types the template: `[resolve]` takes `TcIsbnDetails["resolve"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcIsbnDetails } from "@adamstavely/trenchcoat/isbn-details";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onLookup` | `(detail: IsbnLookupDetail, event: CustomEvent<IsbnLookupDetail>) => void` | Called when a card needs a book's details; call `detail.respondWith(book \| promise)` to answer, or use `resolve` instead |
| `onCopy` | `(text: string, form: "isbn13" \| "isbn10") => boolean \| void` | Called when Copy is pressed; return false to stop the component writing to the clipboard itself |
| `onOpenChange` | `(isbn13: string \| null) => void` | Called with the ISBN-13 whose card opened, or null when it closed |

*Renamed or hidden on the wrapper: `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Onto an ISBN: opens its card. On an ISBN with its card open: into the card (its Copy or Retry buttons), as if the card followed the number; from the card's last button, on to the next ISBN (or out of the text after the last one) |
| Shift + Tab | From the card's first button, back to its ISBN |
| Enter / Space | On an ISBN: opens its card and moves focus into it |
| Escape | Closes the card; focus goes back to its ISBN |

### Screen readers

Each ISBN is a button whose name is the number as written, described as "Book details. Tab moves into them". It
has `aria-haspopup="dialog"` and `aria-expanded`. The card is a non-modal `dialog`, named by the book's title (or
"Book details for ISBN 978…" while loading, on an error or when there are no details), and `aria-busy` while
loading. The Copy buttons are "Copy ISBN-13" and "Copy ISBN-10". A polite status region says:

- the title and authors when the details arrive – "Quiet Interfaces, by Ines Okafor, Tomás Reyes";
- "No details for this ISBN" or "Couldn't load the details.";
- "Copied ISBN-13".

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.8 KB | 7.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/selection` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **37.2 KB** | **12.6 KB** |
| With Lit – the first component on a page | 56.7 KB | 18.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 6 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 8.7 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text, shown as written with its line breaks. ISBNs are found in it; there's nothing to mark up.
- Give the resolver's books a `title` at least – a book without one counts as no details. `authors` is a list of
  display names; `year` and `pages` are shown as given.
- Covers can be any image URL, including a `data:` URL. They're decorative (the title says which book it is).
- Rename the empty and error messages with `not-found-text` and `error-text` – keep them short and factual.

## Do and don't

### Do

- Answer from your own catalogue or an API in `resolve`, and pass the `signal` on so a lookup stops when the
  component leaves the page.
- Return null for numbers your catalogue doesn't know; throw only when the lookup itself failed, so people get Retry.
- Use the `tc-isbn-lookup` event where an app-wide handler already owns the book data.

### Don't

- Don't mark numbers yourself in the text – the component validates them, so a mistyped ISBN isn't presented as a
  book.
- Don't call a slow service for every number on load; the component asks only when a card opens, and caches the
  answer.
- Don't put the ISBN's meaning in the cover alone – always return a title.

## Related

- [Text Annotator](text-annotator.md) – Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter
- [Tooltip](tooltip.md) – Keyboard, pointer and touch help text
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip

## Changelog

- **Text selection:** - `tc-text-annotator`: highlight a passage and comment on it; - `tc-response-selection`: select part of a model reply to reply to it or request an edit; - `tc-selection-translate`: translate the selected text; - `tc-isbn-details`: hover an ISBN for its book details.
