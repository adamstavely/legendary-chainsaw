<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Response Selection

**AI & chat** · New

Select part of a model's answer and act on it – reply quoting it, ask why, or request an edit that comes back as a diff to accept or reject

- **Element:** `<tc-response-selection>`
- **Size:** 26.9 KB gzip · 101.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/response-selection";` |
| React / Next.js | `import { ResponseSelection } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/response-selection";` · tags starting with tc- are custom elements |
| Angular | `import { ResponseSelection } from "@adamstavely/trenchcoat/angular/response-selection";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/response-selection";` |

## Example

The live example is in the gallery at `#/response-selection`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Lets people act on part of a model's answer instead of the whole of it. Select a passage with the pointer or the
keyboard and a small toolbar offers Reply, Ask why and Edit. Reply quotes the passage: quotes collect as chips under
the answer until “Reply with 2 quotes” hands them to your composer. Ask why sends a follow-up about that passage.
Edit asks for a rewrite – shorter, simpler, more formal or in the person's own words – and the new wording comes back
inline as a word diff to accept or reject. The component never calls a model: it asks your app through events, and
shows the passage working, the answer, or an error with Retry.

### When to use

- Under an assistant's finished answer, so people can quote exact sentences back, question a claim or fix one
  paragraph without regenerating everything.
- Wherever several passages from one answer might go into the next message.
- When a rewrite of a passage should be reviewed in place before it replaces the original.

### When not to use

- Highlighting and commenting on a document for review – use [Text Annotator](text-annotator.md).
- Reviewing a whole suggested rewrite of a text – use [Inline Diff](inline-diff.md).
- Showing an answer while it streams, with its sources – use [AI Answer](ai-answer.md), and switch to this once the answer is done.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Answer** `.ui-rsel__text` – the model's answer; one tab stop with a caret for selecting by keyboard
2. **Quoted passage** `.ui-rsel__quote` – a passage collected for the reply, marked in blue
3. **Suggested edit** `.ui-rsel__edit` – the rewrite as a word diff, with Accept and Reject after it
4. **Quotes** `.ui-rsel__tray` – the collected quotes as chips, Clear, and Reply with N quotes

## Looks

Neither look draws a card: the answer sits on the surface that holds it, such as a chat bubble. Standard sets the
answer a step larger (14 px), gives the quote chips a raised fill and Reject a secondary button. Clean keeps the
answer at body size, draws the chips as hairline outlines and greys the removed words, with thinner icons.

## Usage

### HTML

```html
<tc-response-selection id="answer"></tc-response-selection>

<script type="module">
  import "@adamstavely/trenchcoat/response-selection";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.text = "Yes – you can work from abroad for up to 30 days a year, as long as you tell your manager first.";
  // `rewrite` is your own call to your model
  answer.addEventListener("tc-edit-request", async (e) => {
    const { start, end, passage, instruction, signal } = e.detail;
    try {
      const replacement = await rewrite(passage, instruction, { signal });
      answer.edit = { start, end, replacement };
    } catch {
      if (!signal.aborted) answer.edit = { start, end, error: "The model is busy" };
    }
  });
  // Your composer takes the quotes
  answer.addEventListener("tc-reply", (e) => console.log(e.detail.quotes.map((q) => q.text)));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ResponseSelection, type ResponseEdit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

declare function rewrite(passage: string, instruction: string, signal: AbortSignal): Promise<string>;

export function Answer({ answer, onQuote }: { answer: string; onQuote: (quotes: string[]) => void }) {
  const [text, setText] = useState(answer);
  const [edit, setEdit] = useState<ResponseEdit | null>(null);
  return (
    <ResponseSelection
      text={text}
      onTextChange={setText}
      edit={edit}
      onEditReject={() => setEdit(null)}
      onEditRequest={({ start, end, passage, instruction, signal }) => {
        setEdit(null);
        rewrite(passage, instruction, signal).then(
          (replacement) => setEdit({ start, end, replacement }),
          () => !signal.aborted && setEdit({ start, end, error: "The model is busy" }),
        );
      }}
      onReply={(quotes) => onQuote(quotes.map((q) => q.text))}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/response-selection";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";

defineProps<{ quotes: TcResponseSelection["quotes"]; edit: TcResponseSelection["edit"] }>();
const onQuote = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-response-selection :quotes="quotes" :edit="edit" @tc-quote="onQuote"></tc-response-selection>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ResponseSelection } from "@adamstavely/trenchcoat/angular/response-selection";
import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";

@Component({
  selector: "app-response-selection-example",
  imports: [ResponseSelection],
  template: `<tc-response-selection [quotes]="quotes()" [edit]="edit()" (tc-quote)="onQuote($event)"></tc-response-selection>`,
})
export class ResponseSelectionExample {
  readonly quotes = input.required<TcResponseSelection["quotes"]>();
  readonly edit = input.required<TcResponseSelection["edit"]>();
  onQuote(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/response-selection";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";

  let { quotes, edit }: { quotes: TcResponseSelection["quotes"]; edit: TcResponseSelection["edit"] } = $props();
  let el: TcResponseSelection;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-quote", on);
    return () => el.removeEventListener("tc-quote", on);
  });
</script>

<tc-response-selection bind:this={el} {quotes} {edit}></tc-response-selection>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The answer: plain text, paragraphs separated by blank lines. Offsets index into it |
| `quotes` | – | `ResponseQuote[]` | `[]` | The passages collected for a reply. Changed by the user unless a tc-quotes-change listener calls preventDefault() |
| `edit` | – | `ResponseEdit \| null` | `null` | The app's answer to an edit request – a replacement or an error for [start, end) – shown inline until accepted or rejected |
| `actions` | – | `ResponseAction[]` | `["reply", "why", "edit"]` | The toolbar's actions, in order |
| `presets` | – | `ResponseEditPreset[]` | `[ { id: "shorter", label: "Shorter", instruction: "Make this shorter" }, { id: "simpler", label: "Simpler", instruction: "Make this simpler" }, { id: "formal", label: "More formal", instruction: "Make this more formal" }, ]` | The edit menu's presets, before "Your own words…" |
| `textLabel` | `text-label` | `string` | `"Answer"` | The text's accessible name |
| `replyLabel` | `reply-label` | `string` | `"Reply with {n}"` | The label of the action that hands the quotes to the app; {n} is the count |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-quote` | – | Yes | Reply was chosen on a passage ({ passage, start, end }: ResponseQuoteDetail); cancelable – prevent it to take the quote yourself, and it isn't collected |
| `tc-quotes-change` | – | Yes | The collected quotes changed – added, removed, cleared or moved by an accepted edit ({ quotes, change }: ResponseQuotesChange); cancelable – prevent it to control `quotes` |
| `tc-reply` | – | Yes | "Reply with N quotes" was pressed ({ quotes }: ResponseReplyDetail); cancelable – not prevented, the quotes are cleared |
| `tc-ask-why` | – | No | Ask why was chosen on a passage ({ passage, start, end }: ResponseAskDetail) |
| `tc-edit-request` | – | Yes | An edit was asked for ({ passage, start, end, instruction, preset, signal }: ResponseEditRequest); cancelable – prevented, nothing waits for an answer. Answer by setting `edit` |
| `tc-edit-reject` | – | Yes | The suggested edit was rejected, or its error dismissed ({ edit }: ResponseEditReject); cancelable – not prevented, `edit` is cleared |
| `tc-text-change` | – | Yes | A suggested edit was accepted ({ text, previous, start, end, replacement }: ResponseTextChange); cancelable – prevent it to control `text` |

#### Design tokens it reads (74)

`--tc-accent`, `--tc-accent-highlight`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-highlight-blue-bg`, `--tc-highlight-blue-fg`, `--tc-line-height-loose`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`

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
| `quotes` | `el.quotes = …;` | `<… quotes={…} />` | `<tc-response-selection :quotes="…">` | `<tc-response-selection [quotes]="…">` | `<tc-response-selection {quotes}>` |
| `edit` | `el.edit = …;` | `<… edit={…} />` | `<tc-response-selection :edit="…">` | `<tc-response-selection [edit]="…">` | `<tc-response-selection {edit}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-response-selection :actions="…">` | `<tc-response-selection [actions]="…">` | `<tc-response-selection {actions}>` |
| `presets` | `el.presets = …;` | `<… presets={…} />` | `<tc-response-selection :presets="…">` | `<tc-response-selection [presets]="…">` | `<tc-response-selection {presets}>` |

*Also attributes: `text`, `text-label`, `reply-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-quote` | Yes | `el.addEventListener("tc-quote", (e) => …)` | `onQuote={…}` | `@tc-quote="…"` | `(tc-quote)="…($event)"` | `el.addEventListener("tc-quote", …)` |
| `tc-quotes-change` | Yes | `el.addEventListener("tc-quotes-change", (e) => …)` | `ref.current.addEventListener("tc-quotes-change", …)` | `@tc-quotes-change="…"` | `(tc-quotes-change)="…($event)"` | `el.addEventListener("tc-quotes-change", …)` |
| `tc-reply` | Yes | `el.addEventListener("tc-reply", (e) => …)` | `onReply={…}` | `@tc-reply="…"` | `(tc-reply)="…($event)"` | `el.addEventListener("tc-reply", …)` |
| `tc-ask-why` | No | `el.addEventListener("tc-ask-why", (e) => …)` | `onAskWhy={…}` | `@tc-ask-why="…"` | `(tc-ask-why)="…($event)"` | `el.addEventListener("tc-ask-why", …)` |
| `tc-edit-request` | Yes | `el.addEventListener("tc-edit-request", (e) => …)` | `onEditRequest={…}` | `@tc-edit-request="…"` | `(tc-edit-request)="…($event)"` | `el.addEventListener("tc-edit-request", …)` |
| `tc-edit-reject` | Yes | `el.addEventListener("tc-edit-reject", (e) => …)` | `onEditReject={…}` | `@tc-edit-reject="…"` | `(tc-edit-reject)="…($event)"` | `el.addEventListener("tc-edit-reject", …)` |
| `tc-text-change` | Yes | `el.addEventListener("tc-text-change", (e) => …)` | `ref.current.addEventListener("tc-text-change", …)` | `@tc-text-change="…"` | `(tc-text-change)="…($event)"` | `el.addEventListener("tc-text-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `text` and `quotes` itself unless a listener calls `preventDefault()` on `tc-text-change` or `tc-quotes-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-response-selection id="response-selection"></tc-response-selection>

<script type="module">
  import "@adamstavely/trenchcoat/response-selection";

  const el = document.querySelector("#response-selection");
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
import "@adamstavely/trenchcoat/response-selection";
import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";

const props = defineProps<{ initial: TcResponseSelection["text"] }>();
const text = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTextChange = (e: CustomEvent<{ text: TcResponseSelection["text"] }>) => {
  e.preventDefault();
  text.value = e.detail.text;
};
</script>

<template>
  <tc-response-selection :text="text" @tc-text-change="onTextChange"></tc-response-selection>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ResponseSelection } from "@adamstavely/trenchcoat/angular/response-selection";
import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";

@Component({
  selector: "app-controlled-response-selection",
  imports: [ResponseSelection],
  template: `<tc-response-selection [text]="text()" (tc-text-change)="onTextChange($event)"></tc-response-selection>`,
})
export class ControlledResponseSelection {
  readonly initial = input.required<TcResponseSelection["text"]>();
  readonly text = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTextChange(e: CustomEvent<{ text: TcResponseSelection["text"] }>) {
    e.preventDefault();
    this.text.set(e.detail.text);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/response-selection";
  import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";

  let { initial }: { initial: TcResponseSelection["text"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let text = $derived(initial);
  let el: TcResponseSelection;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      text = (e as CustomEvent<{ text: TcResponseSelection["text"] }>).detail.text;
    };
    el.addEventListener("tc-text-change", on);
    return () => el.removeEventListener("tc-text-change", on);
  });
</script>

<tc-response-selection bind:this={el} {text}></tc-response-selection>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-response-selection")` returns a `TcResponseSelection` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";`
- **React / Next.js:** Props: `import type { ResponseSelectionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ResponseSelection>`. The element class, for refs: `import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcResponseSelection["quotes"]` with `import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";`
- **Angular:** The directive types the template: `[quotes]` takes `TcResponseSelection["quotes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcResponseSelection } from "@adamstavely/trenchcoat/response-selection";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `text` | `string` | The answer, plain text. Controlled when defined (with `onTextChange`); otherwise the component keeps it, starting at `defaultText` |
| `defaultText` | `string` | The answer when uncontrolled |
| `onTextChange` | `(text: string, change: ResponseTextChange) => void` | Called with the new answer when a suggested edit is accepted, and the range it replaced |
| `quotes` | `ResponseQuote[]` | The quotes collected for a reply. Controlled when defined; otherwise the component keeps them, starting at `defaultQuotes` |
| `defaultQuotes` | `ResponseQuote[]` | The quotes when uncontrolled |
| `onQuotesChange` | `(quotes: ResponseQuote[], change: ResponseQuotesChange["change"]) => void` | Called with the whole new list of quotes and what changed |
| `onQuote` | `(passage: string, start: number, end: number) => boolean \| void` | Called when Reply is chosen on a passage; return false to take the quote yourself, and it isn't collected |
| `onReply` | `(quotes: ResponseQuote[]) => boolean \| void` | Called when "Reply with N quotes" is pressed; return false to keep the quotes collected |
| `onAskWhy` | `(passage: string, start: number, end: number) => void` | Called when Ask why is chosen on a passage |
| `onEditRequest` | `(request: ResponseEditRequest) => boolean \| void` | Called when an edit is asked for: start the work, watch `request.signal`, then set `edit`. Return false to refuse it |
| `edit` | `ResponseEdit \| null` | Your answer to the last edit request – a replacement or an error – shown inline until accepted or rejected |
| `onEditReject` | `(edit: ResponseEdit) => void` | Called when the suggested edit is rejected (or its error dismissed). The component hides that edit until you pass a new one |

*Renamed or hidden on the wrapper: `text`, `quotes`, `edit`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| ← / → | In the answer: moves the caret a character (with a selection, collapses it to that end) |
| Ctrl + ← / → (Alt on a Mac) | Moves the caret a word |
| ↑ / ↓ | Moves the caret a line |
| Home / End (⌘ + ← / → on a Mac) | To the start or end of the line; with Ctrl (⌘ + ↑ / ↓ on a Mac), of the text |
| Shift + any of these | Extends the selection |
| Ctrl / ⌘ + A | Selects the whole answer |
| Tab | With a selection: into the toolbar. Otherwise to Cancel, or to Accept and Reject, when they're showing |
| ← / → / Home / End | In the toolbar or the quote chips: moves between buttons |
| Enter / Space | On Edit: opens the edit menu, focus on its first item |
| ↑ / ↓ / Home / End | In the edit menu: moves between items |
| Enter | In the edit menu: asks for that edit; in “Your own words…”: sends what you typed |
| Escape | Closes the menu (back to Edit), then the toolbar (back to the answer); with a request pending and nothing selected, cancels it |
| Shift + Tab | In the toolbar: back to the answer |

### Screen readers

The answer is a `document` named “Answer”, described by how to select and act on it. The toolbar is a `toolbar`
named “Selection”; Edit has `aria-haspopup="menu"` and `aria-expanded`, and opens a `menu` named “Request an edit”
whose items are `menuitem`s. “Your own words…” is a small dialog with a field named “How should it change?”. A
quoted passage starts with “Quoted:”, a passage being rewritten with “Being rewritten:”, and while it is the answer
is `aria-busy`. In a suggested edit, removed words start with “removed:” and new ones with “added:”; Accept and Reject
are a group named “Suggested edit”. The quote chips are a `toolbar` named “Quoted passages”, each Remove button
named after its quote. A polite status region says what happened:

- “Selected “Yes”. Tab for reply, ask why and edit”;
- “Quoted “30 days a year”. 1 quote ready to reply with”, “Quote removed. 1 quote left”, “Replying with 2 quotes”;
- “Asked why: “…””;
- “Rewriting “…”. Escape cancels”, “Edit request cancelled”;
- “Suggested edit ready. Tab to Accept or Reject”, “Couldn't rewrite: The model is busy. Retry or dismiss”;
- “Edit accepted”, “Edit rejected”.

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
| Container size queries | 105 | 110 | 16 | 16 | inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover, inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover, inline-diff | – |

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
| **This component alone** | 31.2 KB | 9.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/selection` · Shared Trenchcoat code | 10.2 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/selection-toolbar` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **101.3 KB** | **26.9 KB** |
| With Lit – the first component on a page | 123.5 KB | 34.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 5 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of actions replaced |
| First on the page | 7.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.0 ms | actions: first render, 5 nodes; update 0.3 ms |
| 1,000 items | 1.3 ms | actions: first render, 5 nodes; update 0.4 ms |

What it renders doesn't grow with actions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController), `requestAnimationFrame, cancelled` (internal/selection – SelectionController).
- Timers: `setTimeout` (internal/popover – PopoverController), `setTimeout` (inline-diff).
- 3 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is the finished answer as plain text, with paragraphs separated by blank lines. Offsets index into it, so
  don't change it while a request is out except by accepting an edit.
- Keep presets short and verb-free (“Shorter”, “More formal”); their `instruction` is what your app sends to the
  model, so write it as an instruction (“Make this shorter”).
- An error in `edit.error` is shown as written, next to Retry: say what went wrong in a few words (“The model is
  busy”), not a code.
- `replyLabel` takes `{n}` for the count – “Reply with {n}” becomes “Reply with 2 quotes”.

## Do and don't

### Do

- Answer `tc-edit-request` by setting `edit` to `{ start, end, replacement }` from the request; stop the work when
  `signal` aborts.
- Put the quotes from `tc-reply` (or a single `tc-quote`) into your composer as block quotes the person can still
  edit.
- Store `text` from `tc-text-change` so the accepted wording is what the conversation keeps.

### Don't

- Don't call a model from the page that renders this without telling the person – the passage shimmers and says
  “Rewriting…” only while a request is out.
- Don't set `edit` for a range that no longer matches the text – answer the request you were given.
- Don't use it on text people type into; it acts on fixed text.

## Related

- [Text Annotator](text-annotator.md) – Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups

## Changelog

- **Text selection:** - `tc-text-annotator`: highlight a passage and comment on it; - `tc-response-selection`: select part of a model reply to reply to it or request an edit; - `tc-selection-translate`: translate the selected text; - `tc-isbn-details`: hover an ISBN for its book details.
