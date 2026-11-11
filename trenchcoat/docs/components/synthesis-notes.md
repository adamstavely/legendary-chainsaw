<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Synthesis Notes

**Trust & calibration** · New

Your own conclusions, assumptions and open questions, kept apart from the model's output and exported with where they came from

- **Element:** `<tc-synthesis-notes>`
- **Size:** 10.4 KB gzip · 34.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/synthesis-notes";` |
| React / Next.js | `import { SynthesisNotes } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/synthesis-notes";` · tags starting with tc- are custom elements |
| Angular | `import { SynthesisNotes } from "@adamstavely/trenchcoat/angular/synthesis-notes";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/synthesis-notes";` |

## Example

The live example is in the gallery at `#/synthesis-notes`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A place for the person's own conclusions, assumptions and things still to verify, written apart from the model's
output and marked as theirs. Each list adds in place; each note edits in place, moves with the keyboard – within its
list or to the list next to it, when an assumption turns into a conclusion – and is removed with Undo. Export hands
your product the notes with their provenance – the session, the author – and a Markdown copy, so the person's
judgement travels with the work instead of being mixed into what the AI said.

### When to use

- Research, review or analysis sessions where the person draws their own conclusions from AI answers.
- Keeping track of what's assumed and what still needs checking before a decision or a hand-off.
- Exporting a record of what a person concluded, separate from the transcript.

### When not to use

- What the assistant remembers about someone across chats – use [Memory Panel](memory-panel.md).
- Collecting the AI's claims to verify one by one – use [Verification Queue](verification-queue.md).
- A pause before relying on one answer – use [Reflection Gate](reflection-gate.md).
- Drafting text with the AI – use [Writing Assistant](writing-assistant.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading, the “Written by you” tag and Export
2. **List** `.ui-syn__section` – one of the lists, with its heading and count
3. **Note** `.ui-syn__item` – the grip, the text, and Edit and Remove on hover or focus
4. **Grip** `.ui-syn__handle` – moves the note from the keyboard
5. **Add** `.ui-syn__add` – opens a field for a new note in that list
6. **Tray line** `.ui-syn__foot` – the session, the author and the count; Undo after a removal

## Looks

Standard sets the header and the provenance line on a gray tray and the lists on a white card inside it. Clean is one
white card with hairline dividers between the lists and the provenance line in its last row. Both show Edit and
Remove only on hover or focus, and always on touch screens.

## Usage

### HTML

```html
<tc-synthesis-notes id="notes" session-id="2291" author="Maya Chen"></tc-synthesis-notes>

<script type="module">
  import "@adamstavely/trenchcoat/synthesis-notes";
  import "@adamstavely/trenchcoat/tokens.css";

  const notes = document.querySelector("#notes");
  notes.notes = [{ id: "n1", kind: "verify", text: "Notice period – 30 or 60 days?" }];
  notes.addEventListener("tc-export", (e) => saveNotes(e.detail.sessionId, e.detail.markdown));
</script>
```

### React / Next.js

```tsx
import { SynthesisNotes, type SynthesisExport, type SynthesisNote } from "@adamstavely/trenchcoat/react";
import { useState } from "react";
import "@adamstavely/trenchcoat/tokens.css";

export function SessionNotes({ sessionId, onExport }: { sessionId: string; onExport: (d: SynthesisExport) => void }) {
  const [notes, setNotes] = useState<SynthesisNote[]>([]);
  return <SynthesisNotes sessionId={sessionId} author="Maya Chen" notes={notes} onChange={setNotes} onExport={onExport} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/synthesis-notes";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";

defineProps<{ notes: TcSynthesisNotes["notes"]; sections: TcSynthesisNotes["sections"] }>();
const onNotesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-synthesis-notes :notes="notes" :sections="sections" @tc-notes-change="onNotesChange"></tc-synthesis-notes>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SynthesisNotes } from "@adamstavely/trenchcoat/angular/synthesis-notes";
import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";

@Component({
  selector: "app-synthesis-notes-example",
  imports: [SynthesisNotes],
  template: `<tc-synthesis-notes [notes]="notes()" [sections]="sections()" (tc-notes-change)="onNotesChange($event)"></tc-synthesis-notes>`,
})
export class SynthesisNotesExample {
  readonly notes = input.required<TcSynthesisNotes["notes"]>();
  readonly sections = input.required<TcSynthesisNotes["sections"]>();
  onNotesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/synthesis-notes";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";

  let { notes, sections }: { notes: TcSynthesisNotes["notes"]; sections: TcSynthesisNotes["sections"] } = $props();
  let el: TcSynthesisNotes;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-notes-change", on);
    return () => el.removeEventListener("tc-notes-change", on);
  });
</script>

<tc-synthesis-notes bind:this={el} {notes} {sections}></tc-synthesis-notes>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `notes` | – | `SynthesisNote[]` | `[]` | The notes, each in the list its `kind` names |
| `sections` | – | `SynthesisSection[]` | `[ { id: "conclusions", label: "Conclusions", addLabel: "Add a conclusion", empty: "No conclusions yet" }, { id: "assumptions", label: "Assumptions", addLabel: "Add an assumption", empty: "No assumptions yet" }, { id: "verify", label: "Still to verify", addLabel: "Add something to verify", empty: "Nothing to verify yet" }, ]` | The lists, in order – by default Conclusions, Assumptions and Still to verify |
| `heading` | `heading` | `string` | `"Your notes"` | The heading, and the group's name |
| `ownLabel` | `own-label` | `string` | `"Written by you"` | The tag that sets the notes apart from the model's output |
| `sessionId` | `session-id` | `string` | `""` | The session the notes belong to – shown on the tray and exported with them |
| `author` | `author` | `string` | `""` | Who wrote the notes – shown on the tray and exported with them |
| `undoFor` | `undo-for` | `number` | `5000` | How long Undo stays after a removal, in ms; it waits while the pointer or focus is on it. `Infinity` keeps it until the next removal |
| `noExport` | `no-export` | `boolean` | `false` | Hides Export |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-notes-change` | – | Yes | A note was added, edited, moved, removed or brought back; detail `{ notes }`: SynthesisNotesChange. Cancelable: preventDefault() keeps the change out until the app passes the list back. |
| `tc-export` | – | No | Export was pressed; detail `{ notes, sections, sessionId, author, heading, markdown }`: SynthesisExport. |

#### Design tokens it reads (76)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-solid`, `--tc-tone-teal-solid`, `--tc-tone-violet-solid`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `synthesisMarkdown(notes: SynthesisNote[], sections: SynthesisSection[], meta: { heading?: string; sessionId?: string; author?: string }): void` | The notes as Markdown: a heading, the provenance line, one list per section (empty ones left out) |

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
| `notes` | `el.notes = …;` | `<… notes={…} />` | `<tc-synthesis-notes :notes="…">` | `<tc-synthesis-notes [notes]="…">` | `<tc-synthesis-notes {notes}>` |
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-synthesis-notes :sections="…">` | `<tc-synthesis-notes [sections]="…">` | `<tc-synthesis-notes {sections}>` |

*Also attributes: `heading`, `own-label`, `session-id`, `author`, `undo-for`, `no-export` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-notes-change` | Yes | `el.addEventListener("tc-notes-change", (e) => …)` | `onChange={…}` | `@tc-notes-change="…"` | `(tc-notes-change)="…($event)"` | `el.addEventListener("tc-notes-change", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

### Controlled

The element changes `notes` itself unless a listener calls `preventDefault()` on `tc-notes-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-synthesis-notes id="synthesis-notes"></tc-synthesis-notes>

<script type="module">
  import "@adamstavely/trenchcoat/synthesis-notes";

  const el = document.querySelector("#synthesis-notes");
  el.addEventListener("tc-notes-change", (e) => {
    e.preventDefault(); // the element keeps its notes…
    if (allowed(e.detail.notes)) el.notes = e.detail.notes; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SynthesisNotes } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SynthesisNotes>;
type Props = Omit<Own, "notes" | "onChange"> & { initial: NonNullable<Own["notes"]> };

// Controlled: passing notes makes the wrapper prevent the element's own change; the app sets it
export function ControlledSynthesisNotes({ initial, ...props }: Props) {
  const [notes, setNotes] = useState<Own["notes"]>(initial);
  return <SynthesisNotes {...props} notes={notes} onChange={(next) => setNotes(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/synthesis-notes";
import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";

const props = defineProps<{ initial: TcSynthesisNotes["notes"] }>();
const notes = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onNotesChange = (e: CustomEvent<{ notes: TcSynthesisNotes["notes"] }>) => {
  e.preventDefault();
  notes.value = e.detail.notes;
};
</script>

<template>
  <tc-synthesis-notes :notes="notes" @tc-notes-change="onNotesChange"></tc-synthesis-notes>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SynthesisNotes } from "@adamstavely/trenchcoat/angular/synthesis-notes";
import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";

@Component({
  selector: "app-controlled-synthesis-notes",
  imports: [SynthesisNotes],
  template: `<tc-synthesis-notes [notes]="notes()" (tc-notes-change)="onNotesChange($event)"></tc-synthesis-notes>`,
})
export class ControlledSynthesisNotes {
  readonly initial = input.required<TcSynthesisNotes["notes"]>();
  readonly notes = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onNotesChange(e: CustomEvent<{ notes: TcSynthesisNotes["notes"] }>) {
    e.preventDefault();
    this.notes.set(e.detail.notes);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/synthesis-notes";
  import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";

  let { initial }: { initial: TcSynthesisNotes["notes"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let notes = $derived(initial);
  let el: TcSynthesisNotes;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      notes = (e as CustomEvent<{ notes: TcSynthesisNotes["notes"] }>).detail.notes;
    };
    el.addEventListener("tc-notes-change", on);
    return () => el.removeEventListener("tc-notes-change", on);
  });
</script>

<tc-synthesis-notes bind:this={el} {notes}></tc-synthesis-notes>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-synthesis-notes")` returns a `TcSynthesisNotes` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";`
- **React / Next.js:** Props: `import type { SynthesisNotesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SynthesisNotes>`. The element class, for refs: `import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSynthesisNotes["notes"]` with `import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";`
- **Angular:** The directive types the template: `[notes]` takes `TcSynthesisNotes["notes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSynthesisNotes } from "@adamstavely/trenchcoat/synthesis-notes";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `notes` | `SynthesisNote[]` | The notes (controlled): the lists show exactly these and ask for changes through onChange. Leave it undefined to let the element keep them, starting at `defaultNotes` |
| `defaultNotes` | `SynthesisNote[]` | The notes to start with when uncontrolled |
| `onChange` | `(notes: SynthesisNote[]) => void` | Called with the whole list after any change, controlled or not |
| `onExport` | `(data: SynthesisExport) => void` | Shows Export and is called with the notes, their provenance and a Markdown copy when it's pressed |
| `title` | `string` | The heading, and the group's name |

*Renamed or hidden on the wrapper: `notes`, `heading`, `noExport`, `onChange`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through Export, each note's grip, Edit and Remove, and each list's Add button |
| ↑ / ↓ | On a grip, moves the note up or down its list |
| ← / → | On a grip, moves the note to the end of the list before or after |
| Home / End | On a grip, moves the note to the top or bottom of its list |
| Delete / Backspace | On a grip, removes the note (Undo appears on the tray) |
| Alt + ↑ / ↓ | On a note's grip, Edit or Remove, moves the note up or down |
| Enter | In an editor, saves the note, or adds it and keeps the field open for the next |
| Shift+Enter | In an editor, starts a new line |
| Escape | In an editor, cancels the edit or closes the new note's field |

### Screen readers

The notes are a `group` named by the heading. Each list is a `section` named by its heading, which reads with its
count (“Assumptions, 1 note”); the notes are an ordered list. A note's grip is a button named “Move “…”” and
described by how to use it (“Up and down arrows move it in its list, left and right to the list before or after,
Delete removes it”); Edit and Remove are named with the note. A polite `status` region says what happened: “Added to
Assumptions”, “Saved”, “Moved to position 2 of 3”, “Moved to Assumptions, position 2 of 2”, “Removed “…”. Undo is on
the tray.”, “Brought back “…”” and “Exported 5 notes”. Focus stays on a moved note's grip; after a removal it moves
to the next note in the list, the one before, or the list's Add button; Undo returns it to the note.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.1 KB | 7.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **34.6 KB** | **10.4 KB** |
| With Lit – the first component on a page | 57.0 KB | 17.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 135 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of notes replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.9 ms | notes: first render, 1,750 nodes; update 0.7 ms |
| 1,000 items | 64 ms | notes: first render, 17,050 nodes; update 9.1 ms |

1,000 items of notes: 64 ms. It renders every item, so a first render passes 50 ms (a long task) at about 780 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write list names as plain nouns – “Conclusions”, “Assumptions”, “Still to verify” – and pass your own `sections`
  where your work has other kinds (“Findings”, “Open questions”).
- Give each list an `addLabel` that reads as an action (“Add an assumption”) and an `empty` line that says nothing is
  there yet, without nagging.
- Keep `ownLabel` short and factual: “Written by you”, “Analyst notes”.
- Set `session-id` and `author` – they're what makes the export traceable.

## Do and don't

### Do

- Keep the notes visibly apart from the model's answers – beside or under them, never mixed in.
- Store the notes with the session, and send the export's provenance along with the Markdown.
- Let people move an assumption to Conclusions once they've checked it – that's the record of their reasoning.

### Don't

- Don't prefill the lists with the model's own claims – the point is what the person concluded.
- Don't change a note's text on the person's behalf; fix spelling only if they ask.
- Don't hide Export behind a menu when the notes are meant to leave with the work.

## Related

- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- [Reflection Gate](reflection-gate.md) – A moment to think before relying on AI – state the task and what's at stake, say what you believe, restate the answer, or name what you'll verify
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Writing Assistant](writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
