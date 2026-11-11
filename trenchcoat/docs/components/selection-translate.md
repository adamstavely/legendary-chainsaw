<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Selection Translate

**AI & chat** · New

Select text and translate it – the translation in a card with the detected language, copy, replace in place and show original

- **Element:** `<tc-selection-translate>`
- **Size:** 16.2 KB gzip · 51.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/selection-translate";` |
| React / Next.js | `import { SelectionTranslate } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/selection-translate";` · tags starting with tc- are custom elements |
| Angular | `import { SelectionTranslate } from "@adamstavely/trenchcoat/angular/selection-translate";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/selection-translate";` |

## Example

The live example is in the gallery at `#/selection-translate`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Translates part of a text where it stands, so people can read a sentence in another language without leaving the
page. Select a passage and choose Translate: a card under it shows the translation in the chosen language, the
language your app detected, and Copy, Replace in place (when the text is editable) and Show original. The target
language is a property your app can remember. The component never calls a translation service: it asks your app
through an event or a resolver function, shows loading, error and Retry, and keeps each answer for the same text and
language.

### When to use

- Messages, notes, reviews or tickets written in other languages, where people need one sentence at a time.
- Shared text people may edit, where a translated sentence can replace the original.
- Anywhere a full-page translation would lose the context around the passage.

### When not to use

- Acting on a model's answer – quoting, asking why, rewriting – use [Response Selection](response-selection.md).
- Highlighting and commenting on a document – use [Text Annotator](text-annotator.md).
- Copying, rating or acting on a whole message – use [Message Actions](message-actions.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-strn__text` – the text; one tab stop with a caret for selecting by keyboard
2. **Toolbar** `.ui-strn__pop` – Translate, over the selection
3. **Card** `.ui-strn__card` – the translation, the detected language and the target select
4. **Actions** `.ui-strn__acts` – Copy, Replace and Show original

## Looks

Neither look draws a card around the text; both use the shared popover surface for the toolbar and the card. Standard
sets the text and the translation a step larger, with Copy as a secondary button and Replace filled. Clean keeps both
at body size, all its actions as ghost buttons with Replace in the accent colour, and thinner icons.

## Usage

### HTML

```html
<tc-selection-translate id="note" lang="fr" target="en" editable></tc-selection-translate>

<script type="module">
  import "@adamstavely/trenchcoat/selection-translate";
  import "@adamstavely/trenchcoat/tokens.css";

  const note = document.querySelector("#note");
  note.text = "Le salon de Lyon a attiré plus de visiteurs que prévu.";
  // `translateWithYourService` is your own call to your translation service
  note.resolveTranslate = (text, target, signal) => translateWithYourService(text, target, { signal });
  note.addEventListener("tc-target-change", (e) => localStorage.setItem("target", e.detail.target));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SelectionTranslate, type SelectionTranslation } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

declare function translateWithYourService(text: string, target: string, signal: AbortSignal): Promise<SelectionTranslation>;

export function Note({ initial }: { initial: string }) {
  const [text, setText] = useState(initial);
  const [target, setTarget] = useState("en");
  return (
    <SelectionTranslate
      lang="fr"
      text={text}
      onTextChange={setText}
      editable
      target={target}
      onTargetChange={setTarget}
      resolveTranslate={translateWithYourService}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/selection-translate";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";

defineProps<{ languages: TcSelectionTranslate["languages"]; resolveTranslate: TcSelectionTranslate["resolveTranslate"] }>();
const onTranslate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-selection-translate :languages="languages" :resolveTranslate="resolveTranslate" @tc-translate="onTranslate"></tc-selection-translate>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SelectionTranslate } from "@adamstavely/trenchcoat/angular/selection-translate";
import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";

@Component({
  selector: "app-selection-translate-example",
  imports: [SelectionTranslate],
  template: `<tc-selection-translate [languages]="languages()" [resolveTranslate]="resolveTranslate()" (tc-translate)="onTranslate($event)"></tc-selection-translate>`,
})
export class SelectionTranslateExample {
  readonly languages = input.required<TcSelectionTranslate["languages"]>();
  readonly resolveTranslate = input.required<TcSelectionTranslate["resolveTranslate"]>();
  onTranslate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/selection-translate";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";

  let { languages, resolveTranslate }: { languages: TcSelectionTranslate["languages"]; resolveTranslate: TcSelectionTranslate["resolveTranslate"] } = $props();
  let el: TcSelectionTranslate;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-translate", on);
    return () => el.removeEventListener("tc-translate", on);
  });
</script>

<tc-selection-translate bind:this={el} {languages} {resolveTranslate}></tc-selection-translate>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text: plain text, paragraphs separated by blank lines. Offsets index into it |
| `editable` | `editable` | `boolean` | `false` | Replace in place is offered: the text can be changed by the element (tc-text-change) |
| `target` | `target` | `string` | `"en"` | The language to translate into, as a code from `languages`. Changed from the card unless a tc-target-change listener calls preventDefault() |
| `languages` | – | `TranslateLanguage[]` | `[ { code: "en", name: "English" }, { code: "es", name: "Spanish" }, { code: "fr", name: "French" }, { code: "de", name: "German" }, { code: "it", name: "Italian" }, { code: "pt", name: "Portuguese" }, { code: "nl", name: "Dutch" }, { code: "pl", name: "Polish" }, { code: "ja", name: "Japanese" }, { code: "ko", name: "Korean" }, { code: "zh", name: "Chinese" }, { code: "ar", name: "Arabic" }, { code: "hi", name: "Hindi" }, ]` | The languages the card offers |
| `resolveTranslate` | – | `SelectionTranslateResolver \| undefined` | `undefined` | Translates when no tc-translate listener answers: (text, target, signal) => { text, source? } |
| `textLabel` | `text-label` | `string` | `"Text"` | The text's accessible name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-translate` | – | No | A translation is needed ({ text, target, start, end, signal, respondWith }: SelectionTranslateRequest); answer with `detail.respondWith()`, or leave it to `resolveTranslate`; prevented without an answer, the card closes |
| `tc-target-change` | – | Yes | The target language was changed in the card ({ target }: SelectionTranslateTargetChange); cancelable – prevent it to control `target` |
| `tc-copy` | – | Yes | Copy was chosen on a translation ({ text }: SelectionTranslateCopy); cancelable – prevent it to copy your own way |
| `tc-text-change` | – | Yes | Replace was chosen ({ text, previous, start, end, replacement, target }: SelectionTranslateTextChange); cancelable – prevent it to control `text` |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `langName(code: string \| undefined)` | `void` | A language's name: from `languages`, else the browser's name for the code, else as given |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-selection-translate-card-w` | `340px` | both |

#### Design tokens it reads (66)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-highlight-blue-bg`, `--tc-highlight-blue-fg`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-radius-2xs`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

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
| `languages` | `el.languages = …;` | `<… languages={…} />` | `<tc-selection-translate :languages="…">` | `<tc-selection-translate [languages]="…">` | `<tc-selection-translate {languages}>` |
| `resolveTranslate` | `el.resolveTranslate = …;` | `<… resolveTranslate={…} />` | `<tc-selection-translate :resolveTranslate="…">` | `<tc-selection-translate [resolveTranslate]="…">` | `<tc-selection-translate {resolveTranslate}>` |

*Also attributes: `text`, `editable`, `target`, `text-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-translate` | No | `el.addEventListener("tc-translate", (e) => …)` | `onTranslate={…}` | `@tc-translate="…"` | `(tc-translate)="…($event)"` | `el.addEventListener("tc-translate", …)` |
| `tc-target-change` | Yes | `el.addEventListener("tc-target-change", (e) => …)` | `ref.current.addEventListener("tc-target-change", …)` | `@tc-target-change="…"` | `(tc-target-change)="…($event)"` | `el.addEventListener("tc-target-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-text-change` | Yes | `el.addEventListener("tc-text-change", (e) => …)` | `ref.current.addEventListener("tc-text-change", …)` | `@tc-text-change="…"` | `(tc-text-change)="…($event)"` | `el.addEventListener("tc-text-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `text` and `target` itself unless a listener calls `preventDefault()` on `tc-text-change` or `tc-target-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-selection-translate id="selection-translate"></tc-selection-translate>

<script type="module">
  import "@adamstavely/trenchcoat/selection-translate";

  const el = document.querySelector("#selection-translate");
  el.addEventListener("tc-text-change", (e) => {
    e.preventDefault(); // the element keeps its text…
    if (allowed(e.detail.text)) el.text = e.detail.text; // …until the app sets it
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
import "@adamstavely/trenchcoat/selection-translate";
import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";

const props = defineProps<{ initial: TcSelectionTranslate["text"] }>();
const text = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTextChange = (e: CustomEvent<{ text: TcSelectionTranslate["text"] }>) => {
  e.preventDefault();
  text.value = e.detail.text;
};
</script>

<template>
  <tc-selection-translate :text="text" @tc-text-change="onTextChange"></tc-selection-translate>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SelectionTranslate } from "@adamstavely/trenchcoat/angular/selection-translate";
import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";

@Component({
  selector: "app-controlled-selection-translate",
  imports: [SelectionTranslate],
  template: `<tc-selection-translate [text]="text()" (tc-text-change)="onTextChange($event)"></tc-selection-translate>`,
})
export class ControlledSelectionTranslate {
  readonly initial = input.required<TcSelectionTranslate["text"]>();
  readonly text = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTextChange(e: CustomEvent<{ text: TcSelectionTranslate["text"] }>) {
    e.preventDefault();
    this.text.set(e.detail.text);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/selection-translate";
  import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";

  let { initial }: { initial: TcSelectionTranslate["text"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let text = $derived(initial);
  let el: TcSelectionTranslate;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      text = (e as CustomEvent<{ text: TcSelectionTranslate["text"] }>).detail.text;
    };
    el.addEventListener("tc-text-change", on);
    return () => el.removeEventListener("tc-text-change", on);
  });
</script>

<tc-selection-translate bind:this={el} {text}></tc-selection-translate>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-selection-translate")` returns a `TcSelectionTranslate` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";`
- **React / Next.js:** Props: `import type { SelectionTranslateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SelectionTranslate>`. The element class, for refs: `import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSelectionTranslate["languages"]` with `import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";`
- **Angular:** The directive types the template: `[languages]` takes `TcSelectionTranslate["languages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSelectionTranslate } from "@adamstavely/trenchcoat/selection-translate";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `text` | `string` | The text, plain. Controlled when defined (with `onTextChange`); otherwise the component keeps it, starting at `defaultText` |
| `defaultText` | `string` | The text when uncontrolled |
| `onTextChange` | `(text: string, change: SelectionTranslateTextChange) => void` | Called with the new text when Replace puts a translation in place (needs `editable`) |
| `target` | `string` | The target language's code. Controlled when defined; otherwise the component keeps it, starting at `defaultTarget` |
| `defaultTarget` | `string` | The target language when uncontrolled (default "en") |
| `onTargetChange` | `(target: string) => void` | Called when the target language is changed in the card – store it to remember the choice |
| `onTranslate` | `(request: SelectionTranslateRequest) => boolean \| void` | Called for every translation the card needs; answer with `request.respondWith()`, or leave it to `resolveTranslate`. Return false to take it elsewhere (the card closes) |
| `onCopy` | `(text: string) => boolean \| void` | Called when Copy is chosen on a translation; return false to stop the component writing to the clipboard itself |

*Renamed or hidden on the wrapper: `text`, `target`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| ← / → | In the text: moves the caret a character (with a selection, collapses it to that end) |
| Ctrl + ← / → (Alt on a Mac) | Moves the caret a word |
| ↑ / ↓ | Moves the caret a line |
| Home / End (⌘ + ← / → on a Mac) | To the start or end of the line; with Ctrl (⌘ + ↑ / ↓ on a Mac), of the text |
| Shift + any of these | Extends the selection |
| Ctrl / ⌘ + A | Selects all the text |
| Tab | With a selection: to Translate |
| Enter / Space | On Translate: opens the card, focus on its language select |
| Tab / Shift + Tab | In the card: between the select, Copy, Replace, Show original and Close |
| Escape | Closes the card and puts the caret after the passage; closes the toolbar |
| Shift + Tab | On Translate: back to the text |

### Screen readers

The text is a `document` named “Text” (set `text-label`), described by how to select and translate. Set `lang` on the
element for the text's language. The toolbar is a `toolbar` named “Selection”. The card is a non-modal `dialog`
named “Translation” and is `aria-busy` while loading; its select is named “Translate to”, the translation carries the
target's `lang`, and the detected language reads “Detected: French”. Show original is a disclosure button
(`aria-expanded`). While the card is open, the passage starts with “Translating:”. A polite status region says:

- “Selected “Le colis”. Tab to translate”;
- “Translating to English…”;
- “Translated from French to English: The parcel arrived this morning.”;
- “Couldn't translate: Service unavailable. Retry is in the card”;
- “Copied”, “Replaced with the English translation”.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 23.2 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/selection` · Shared Trenchcoat code | 10.2 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/selection-toolbar` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **51.1 KB** | **16.2 KB** |
| With Lit – the first component on a page | 71.7 KB | 22.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 5 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of languages replaced |
| First on the page | 4.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.3 ms | languages: first render, 5 nodes; update 0.2 ms |
| 1,000 items | 0.7 ms | languages: first render, 5 nodes; update 0.2 ms |

What it renders doesn't grow with languages (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController), `requestAnimationFrame, cancelled` (internal/selection – SelectionController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text with paragraphs separated by blank lines; it is shown as written.
- Give `languages` the targets your service supports, with names in the language of your interface.
- Return the detected source as a code (“fr”) and the component names it from `languages` or the browser; a name you
  return (“French”) is shown as given.
- Errors are shown as “Couldn't translate: ” and your message – keep it short and plain (“Service unavailable”).

## Do and don't

### Do

- Answer with `detail.respondWith()` or `resolveTranslate`, and stop work when `signal` aborts.
- Store `target` from `tc-target-change`, so the next card uses the person's choice.
- Set `editable` only where the text belongs to the person and Replace really changes it.

### Don't

- Don't fire network requests on every selection – the component asks only when Translate is chosen, and caches the
  answer.
- Don't translate the passage silently in place; let people see the translation and choose Replace.
- Don't rely on Replace for text people can't edit: without `editable` it isn't offered.

## Related

- [Response Selection](response-selection.md) – Select part of a model's answer and act on it – reply quoting it, ask why, or request an edit that comes back as a diff to accept or reject
- [Text Annotator](text-annotator.md) – Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer

## Changelog

- **Text selection:** - `tc-text-annotator`: highlight a passage and comment on it; - `tc-response-selection`: select part of a model reply to reply to it or request an edit; - `tc-selection-translate`: translate the selected text; - `tc-isbn-details`: hover an ISBN for its book details.
