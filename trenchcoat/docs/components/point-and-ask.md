<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Point and Ask

**AI & chat** · New

Pin or box parts of an image and ask about them – numbered marks you drag, nudge and resize from the keyboard, a question per mark and one over all, and answers streamed back under each

- **Element:** `<tc-point-and-ask>`
- **Size:** 10.0 KB gzip · 32.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/point-and-ask";` |
| React / Next.js | `import { PointAndAsk } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/point-and-ask";` · tags starting with tc- are custom elements |
| Angular | `import { PointAndAsk } from "@adamstavely/trenchcoat/angular/point-and-ask";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/point-and-ask";` |

## Example

The live example is in the gallery at `#/point-and-ask`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Point at part of an image, then ask about it. A click drops a numbered pin and a drag draws a box; each mark gets its
own short question, and one question can cover them all. Ask hands the page every mark with its question, in fractions
of the image, and the page streams answers back – one under each mark, and one for the overall question. Marks can be
dragged, nudged and resized from the keyboard, and “Add pin” and “Add box” drop one in the middle, so the whole task
works without a pointer.

### When to use

- Asking a vision model about specific parts of a picture: a chart, a scanned form, a photo, a screenshot.
- Reviewing an image with an assistant – “what does this figure mean?”, “is this label right?”.
- Any question where “this part” is easier to point at than to describe.

### When not to use

- Changing part of an image – use [Edit Region](edit-region.md).
- Asking about text with citations to sources – use [Cited Answer](cited-answer.md).
- Leaving notes on a design for people, not a model – use [Comment Thread](comment-thread.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Image** `.ui-paq__stage` – the image at its own shape; click or drag on `.ui-paq__surface`
2. **Mark** `.ui-paq__mark` – a numbered pin or a box (`data-kind`), selected with `data-selected`
3. **Add** `.ui-paq__adds` – Add pin, Add box and Clear all
4. **List** `.ui-paq__list` – a row per mark (`.ui-paq__item`): its number button, its question and Remove
5. **Mark answer** `.ui-paq__answer` – the answer under a mark, from `answers`
6. **Question** `.ui-paq__field` – the question over all the marks
7. **Ask** `.ui-paq__ask` – sends it; `.ui-paq__hint` says what's missing first
8. **Answer** `.ui-paq__overall` – the answer to the overall question, from `answer`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Pins are accent discs with their number; boxes are an accent outline with the number on their corner. The list
sits beside the image from 640 px wide and below it when narrower (`--tc-paq-side-min` sets the list's narrowest
width). `--tc-paq-pin` sets a pin's size.

## Usage

### HTML

```html
<tc-point-and-ask
  heading="Ask about page 4"
  src="/images/report-page-4.png"
  alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
></tc-point-and-ask>

<script type="module">
  import "@adamstavely/trenchcoat/point-and-ask";
  import "@adamstavely/trenchcoat/tokens.css";

  const viewer = document.querySelector("tc-point-and-ask");
  viewer.addEventListener("tc-ask", async (e) => {
    const res = await fetch("/api/images/page-4/ask", { method: "POST", body: JSON.stringify(e.detail) });
    const { answers, answer } = await res.json();
    viewer.answers = answers;
    viewer.answer = answer;
    viewer.busy = false;
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PointAndAsk, type PointAsk, type PointMark } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AskAboutPage({ src, ask }: { src: string; ask: (q: PointAsk) => Promise<{ answers: Record<string, string>; answer: string }> }) {
  const [marks, setMarks] = useState<PointMark[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <PointAndAsk
      title="Ask about page 4"
      src={src}
      alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
      marks={marks}
      onMarksChange={setMarks}
      answers={answers}
      answer={answer}
      busy={busy}
      onAsk={(q) => {
        setBusy(true);
        void ask(q).then((r) => {
          setAnswers(r.answers);
          setAnswer(r.answer);
          setBusy(false);
        });
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/point-and-ask";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";

defineProps<{ marks: TcPointAndAsk["marks"]; answers: TcPointAndAsk["answers"] }>();
const onMarksChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-point-and-ask :marks="marks" :answers="answers" @tc-marks-change="onMarksChange"></tc-point-and-ask>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PointAndAsk } from "@adamstavely/trenchcoat/angular/point-and-ask";
import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";

@Component({
  selector: "app-point-and-ask-example",
  imports: [PointAndAsk],
  template: `<tc-point-and-ask [marks]="marks()" [answers]="answers()" (tc-marks-change)="onMarksChange($event)"></tc-point-and-ask>`,
})
export class PointAndAskExample {
  readonly marks = input.required<TcPointAndAsk["marks"]>();
  readonly answers = input.required<TcPointAndAsk["answers"]>();
  onMarksChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/point-and-ask";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";

  let { marks, answers }: { marks: TcPointAndAsk["marks"]; answers: TcPointAndAsk["answers"] } = $props();
  let el: TcPointAndAsk;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-marks-change", on);
    return () => el.removeEventListener("tc-marks-change", on);
  });
</script>

<tc-point-and-ask bind:this={el} {marks} {answers}></tc-point-and-ask>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Ask about the image"` | The title above the image |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the title |
| `src` | `src` | `string` | `""` | The image |
| `alt` | `alt` | `string` | `""` | What the image shows, for screen readers |
| `marks` | – | `PointMark[]` | `[]` | The marks, in order; their numbers follow it |
| `question` | `question` | `string` | `""` | The question over all the marks |
| `answers` | – | `Record<string, string>` | `{}` | Answers by mark id, shown under each mark (update it as the text streams in) |
| `answer` | `answer` | `string` | `""` | The answer to the overall question |
| `busy` | `busy` | `boolean` | `false` | Holds everything while the page answers; Ask turns it on unless tc-ask is prevented |
| `labels` | – | `Partial<PointAndAskLabels>` | `{}` | Words the page can rename (merged over defaultPointAndAskLabels) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-marks-change` | – | Yes | A mark was added, moved, resized, removed or given a question ({ marks, reason, id }: PointMarksChange); cancelable – prevented, the marks stay as they were |
| `tc-question-change` | – | Yes | The overall question was edited ({ question }: PointQuestionChange); cancelable – prevented, the text goes back |
| `tc-ask` | – | Yes | Ask was pressed ({ marks, question }: PointAsk); cancelable – not prevented, the element turns `busy` until the page clears it |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `addMark(kind: "pin" \| "box", at?: Partial<PointMark>)` | `void` | Adds a mark (a pin in the middle, or a box around it, by default) and selects it |
| `removeMark(id: string)` | `void` | Removes a mark |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-paq-pin` | `var(--tc-space-6)` | both |
| `--tc-paq-side-min` | `260px` | both |

#### Design tokens it reads (62)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPointAndAskLabels: object` | The words on the element; a page can rename any of them |

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
| `marks` | `el.marks = …;` | `<… marks={…} />` | `<tc-point-and-ask :marks="…">` | `<tc-point-and-ask [marks]="…">` | `<tc-point-and-ask {marks}>` |
| `answers` | `el.answers = …;` | `<… answers={…} />` | `<tc-point-and-ask :answers="…">` | `<tc-point-and-ask [answers]="…">` | `<tc-point-and-ask {answers}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-point-and-ask :labels="…">` | `<tc-point-and-ask [labels]="…">` | `<tc-point-and-ask {labels}>` |

*Also attributes: `heading`, `description`, `src`, `alt`, `question`, `answer`, `busy` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-marks-change` | Yes | `el.addEventListener("tc-marks-change", (e) => …)` | `onMarksChange={…}` | `@tc-marks-change="…"` | `(tc-marks-change)="…($event)"` | `el.addEventListener("tc-marks-change", …)` |
| `tc-question-change` | Yes | `el.addEventListener("tc-question-change", (e) => …)` | `onQuestionChange={…}` | `@tc-question-change="…"` | `(tc-question-change)="…($event)"` | `el.addEventListener("tc-question-change", …)` |
| `tc-ask` | Yes | `el.addEventListener("tc-ask", (e) => …)` | `onAsk={…}` | `@tc-ask="…"` | `(tc-ask)="…($event)"` | `el.addEventListener("tc-ask", …)` |

### Controlled

The element changes `marks` and `question` itself unless a listener calls `preventDefault()` on `tc-marks-change` or `tc-question-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-point-and-ask id="point-and-ask"></tc-point-and-ask>

<script type="module">
  import "@adamstavely/trenchcoat/point-and-ask";

  const el = document.querySelector("#point-and-ask");
  el.addEventListener("tc-marks-change", (e) => {
    e.preventDefault(); // the element keeps its marks…
    if (allowed(e.detail.marks)) el.marks = e.detail.marks; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { PointAndAsk } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PointAndAsk>;
type Props = Omit<Own, "marks" | "onMarksChange"> & { initial: NonNullable<Own["marks"]> };

// Controlled: passing marks makes the wrapper prevent the element's own change; the app sets it
export function ControlledPointAndAsk({ initial, ...props }: Props) {
  const [marks, setMarks] = useState<Own["marks"]>(initial);
  return <PointAndAsk {...props} marks={marks} onMarksChange={(next) => setMarks(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/point-and-ask";
import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";

const props = defineProps<{ initial: TcPointAndAsk["marks"] }>();
const marks = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMarksChange = (e: CustomEvent<{ marks: TcPointAndAsk["marks"] }>) => {
  e.preventDefault();
  marks.value = e.detail.marks;
};
</script>

<template>
  <tc-point-and-ask :marks="marks" @tc-marks-change="onMarksChange"></tc-point-and-ask>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PointAndAsk } from "@adamstavely/trenchcoat/angular/point-and-ask";
import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";

@Component({
  selector: "app-controlled-point-and-ask",
  imports: [PointAndAsk],
  template: `<tc-point-and-ask [marks]="marks()" (tc-marks-change)="onMarksChange($event)"></tc-point-and-ask>`,
})
export class ControlledPointAndAsk {
  readonly initial = input.required<TcPointAndAsk["marks"]>();
  readonly marks = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMarksChange(e: CustomEvent<{ marks: TcPointAndAsk["marks"] }>) {
    e.preventDefault();
    this.marks.set(e.detail.marks);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/point-and-ask";
  import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";

  let { initial }: { initial: TcPointAndAsk["marks"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let marks = $derived(initial);
  let el: TcPointAndAsk;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      marks = (e as CustomEvent<{ marks: TcPointAndAsk["marks"] }>).detail.marks;
    };
    el.addEventListener("tc-marks-change", on);
    return () => el.removeEventListener("tc-marks-change", on);
  });
</script>

<tc-point-and-ask bind:this={el} {marks}></tc-point-and-ask>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-point-and-ask")` returns a `TcPointAndAsk` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";`
- **React / Next.js:** Props: `import type { PointAndAskProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PointAndAsk>`. The element class, for refs: `import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPointAndAsk["marks"]` with `import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";`
- **Angular:** The directive types the template: `[marks]` takes `TcPointAndAsk["marks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPointAndAsk } from "@adamstavely/trenchcoat/point-and-ask";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title above the image |
| `marks` | `PointMark[]` | The marks. Controlled when defined; otherwise the element keeps its own, starting at `defaultMarks` |
| `defaultMarks` | `PointMark[]` | Starting marks when uncontrolled |
| `onMarksChange` | `(marks: PointMark[], reason: PointMarksChange["reason"]) => void` | A mark was added, moved, resized, removed or given a question |
| `question` | `string` | The question over all the marks. Controlled when defined |
| `defaultQuestion` | `string` | Starting question when uncontrolled |
| `onQuestionChange` | `(question: string) => void` | The overall question was edited |
| `onAsk` | `(ask: PointAsk, event: Event) => void` | Ask: every mark with its question. The element turns busy unless you call event.preventDefault() – pass `busy` to own it |

*Renamed or hidden on the wrapper: `heading`, `children`, `reason`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the selected mark on the image (one tab stop), then Add pin, Add box, the list, the question and Ask |
| Arrow keys (mark) | Move the mark 1 px |
| Shift + arrow keys (mark) | Move it 10 px |
| Alt + arrow keys (box) | Resize the box (Shift for 10 px) |
| Delete / Backspace (mark) | Remove the mark; focus moves to the next one |
| Enter (mark) | Go to the mark's question |
| Enter / Space (number in the list) | Select the mark and focus it on the image |
| Ctrl / ⌘ + Enter (question) | Ask |

### Screen readers

The marks are a group named “Marks on the image”; each is a button named by its kind, number and question (“Pin 1: Why
is Q4 the highest?”) and described by the keys. The list is an ordered list named “Marks”; each question field is
labelled “Ask about this: Pin 1” and each Remove button “Remove Pin 1”. A polite live region says “Pin 3 added”, “Box 2
removed” and “Answers ready” when `busy` turns off. While `busy` the card is `aria-busy` and Ask reads “Asking…”.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.8 KB | 7.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.6 KB** | **10.0 KB** |
| With Lit – the first component on a page | 53.3 KB | 16.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 99 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of marks replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | marks: first render, 2,255 nodes; update 1.4 ms |
| 1,000 items | 107 ms | marks: first render, 22,055 nodes; update 7.7 ms |

1,000 items of marks: 107 ms. It renders every item, so a first render passes 50 ms (a long task) at about 470 items – page or filter longer lists.

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

- Write the image's `alt` as what it shows, so marks have context for screen-reader users.
- Keep mark questions short – the mark says where, the question says what.
- Stream answers as plain text; keep each to a few sentences.

## Do and don't

### Do

- Send coordinates as fractions (`tc-ask` does) and map them to the image's own pixels on the server.
- Clear `busy` when the last answer has arrived, so people can ask again.
- Keep the marks after asking, so follow-up questions point at the same places.

### Don't

- Don't require a mark – a question about the whole image is fine.
- Don't renumber marks behind people's backs; numbers follow the list order.
- Don't put long answers in the overall box when they belong to one mark.

## Related

- [Edit Region](edit-region.md) – Brush a mask over an image and say what should change – brush, eraser and a box you move from the keyboard, undo and redo, how much is selected, and Generate with the mask as a PNG at the image's size
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
