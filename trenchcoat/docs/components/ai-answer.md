<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# AI Answer

**AI & chat**

Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups

- **Element:** `<tc-ai-answer>`
- **Size:** 16.7 KB gzip · 68.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-answer";` |
| React / Next.js | `import { AIAnswer } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-answer";` · tags starting with tc- are custom elements |
| Angular | `import { AiAnswer } from "@adamstavely/trenchcoat/angular/ai-answer";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-answer";` |

## Example

The live example is in the gallery at `#/ai-answer`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An assistant's answer to one question, with the sources it drew on. The source cards pop in first while the
assistant “reads”, then the answer streams in word by word with citation chips in the text. Pointing at a chip
previews its source and lights up the matching card above it, and pointing at a card lights up its chips. When the
answer is finished, people can copy it with its sources, regenerate it, rate it – a thumbs down asks why – and pick a
follow-up question. The answer is plain text: blank lines make paragraphs, a paragraph whose every line starts with “- ” is a
list, `**bold**` is bold and `[1]` or `[1,3]` cite sources.

### When to use

- Answers from a knowledge base, search or company documents, where people need to see and check the sources.
- One question and its answer as a unit – a help panel, a search results page, an “Ask” box.
- Streaming answers from your model: pass the text as it grows and set `streaming` until it's complete.

### When not to use

- When people need to check each sentence against the exact passage it came from – use [Cited Answer](cited-answer.md).
- Comparing two models' answers to the same prompt – use [Answer Arena](answer-arena.md).
- Messages in a running conversation, where each reply needs only copy, regenerate and feedback – use
  [Message Actions](message-actions.md) under the message.
- Showing the steps and searches while the model is still thinking – use [Thinking State](thinking-state.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Sources** `.ui-ans__sources` – numbered cards, each with its site, logo and title
3. **Label** `.ui-ans__label` – the assistant's mark and what it's doing: reading, writing, or done
4. **Answer** `.ui-ans__answer` – the streamed text, with paragraphs, lists and bold
5. **Citation** `.ui-ans__cite` – a chip naming its source; it previews the source and lights up its card
6. **Footer** `.ui-ans__foot` – Stop while writing; then Copy, Regenerate, Good answer, Bad answer and the status.

## Looks

Standard sets the question on a gray tray, the answer on a white card below it and the footer on the tray, and its assistant is
a small blue cloud whose eyes scan the sources and follow the text. Clean has no tray: one white card holds
everything, the question as its first row and the footer as its last, and the assistant is a blue sparkle; its icons are smaller and thinner. Both
stream, cite and preview the same way.

## Usage

### HTML

```html
<tc-ai-answer id="answer" question="Can I work from abroad for a few weeks?"></tc-ai-answer>

<script type="module">
  import "@adamstavely/trenchcoat/ai-answer";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.sources = [
    {
      title: "Remote work policy (2026)",
      name: "Notion",
      href: "https://www.notion.so",
      snippet: "Up to 30 working days a year.",
    },
  ];
  answer.followUps = ["How do I request manager approval?"];
  answer.answer = "Yes – for **up to 30 working days a year**, with your manager's approval [1].";
  answer.addEventListener("tc-follow-up", (e) => console.log(e.detail.question));
</script>
```

### React / Next.js

```tsx
import { AIAnswer, type AnswerSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: AnswerSource[] = [
  {
    title: "Remote work policy (2026)",
    name: "Notion",
    href: "https://www.notion.so",
    snippet: "Up to 30 working days a year.",
  },
];

export function Answer({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <AIAnswer
      question="Can I work from abroad for a few weeks?"
      sources={sources}
      answer={text}
      streaming={streaming}
      followUps={["How do I request manager approval?"]}
      onFeedback={(value, reason) => console.log(value, reason)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-answer";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";

defineProps<{ sources: TcAiAnswer["sources"]; animated: TcAiAnswer["animated"] }>();
const onFeedbackChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-answer :sources="sources" :animated="animated" @tc-feedback-change="onFeedbackChange"></tc-ai-answer>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiAnswer } from "@adamstavely/trenchcoat/angular/ai-answer";
import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";

@Component({
  selector: "app-ai-answer-example",
  imports: [AiAnswer],
  template: `<tc-ai-answer [sources]="sources()" [animated]="animated()" (tc-feedback-change)="onFeedbackChange($event)"></tc-ai-answer>`,
})
export class AiAnswerExample {
  readonly sources = input.required<TcAiAnswer["sources"]>();
  readonly animated = input.required<TcAiAnswer["animated"]>();
  onFeedbackChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-answer";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";

  let { sources, animated }: { sources: TcAiAnswer["sources"]; animated: TcAiAnswer["animated"] } = $props();
  let el: TcAiAnswer;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-feedback-change", on);
    return () => el.removeEventListener("tc-feedback-change", on);
  });
</script>

<tc-ai-answer bind:this={el} {sources} {animated}></tc-ai-answer>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `question` | `question` | `string` | `""` | The question above the answer |
| `sources` | – | `AnswerSource[]` | `[]` | The sources the answer cites, numbered from 1 in the order given – [1] in the answer is the first |
| `answer` | `answer` | `string` | `""` | The answer text – may grow while `streaming` is set |
| `streaming` | `streaming` | `boolean` | `false` | More text is still coming from your model, keep the cursor going |
| `animated` | – | `boolean` | `true` | Stream the text in; false shows it at once |
| `speed` | `speed` | `number` | `38` | Words per second while streaming in |
| `followUps` | – | `string[]` | `[]` | Follow-up questions offered under the finished answer |
| `feedback` | – | `AnswerFeedback \| null` | `null` | The verdict shown (null: none) |
| `feedbackReasons` | – | `array` | `["Not accurate", "Wrong source", "Too long", "Out of date"]` | Reasons offered after a thumbs down |
| `hideActions` | `hide-actions` | `boolean` | `false` | Leave out the built-in actions under a finished answer (copy, regenerate, thumbs and the status beside them) – for an app that puts its own row there, such as `tc-message-actions`. Stop still shows while the answer is written |
| `onRegenerate` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Regenerate: may return a promise – a rejection shows in the last row, and Regenerate can be tried again |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-feedback-change` | – | Yes | The verdict changes (a thumb, a reason, clearing it, a new answer starting over); detail `{ feedback: AnswerFeedback \| null }`. Cancelable: preventDefault() keeps `feedback` as it is (controlled use) |
| `tc-feedback` | – | No | A thumb up, or a thumbs down once its reason is picked; detail `{ value: "up" \| "down", reason?: string }` |
| `tc-follow-up` | – | No | A follow-up question was picked; detail `{ question: string }` |
| `tc-stop` | – | No | Stop was pressed while writing; detail: null |
| `tc-copy` | – | No | The answer is on the clipboard; detail `{ text: string }` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ai-answer-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | standard, clean |
| `--tc-ai-answer-source-ring-lit` | `light-dark(#cfcfd3, #4a4a50)` | standard |

#### Design tokens it reads (105)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-ai-answer-mark-edge`, `--tc-ai-answer-mark-eye-shade`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-inverse`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-ai-answer :sources="…">` | `<tc-ai-answer [sources]="…">` | `<tc-ai-answer {sources}>` |
| `animated` | `el.animated = …;` | `<… animated={…} />` | `<tc-ai-answer :animated="…">` | `<tc-ai-answer [animated]="…">` | `<tc-ai-answer {animated}>` |
| `followUps` | `el.followUps = …;` | `<… followUps={…} />` | `<tc-ai-answer :followUps="…">` | `<tc-ai-answer [followUps]="…">` | `<tc-ai-answer {followUps}>` |
| `feedback` | `el.feedback = …;` | `<… feedback={…} />` | `<tc-ai-answer :feedback="…">` | `<tc-ai-answer [feedback]="…">` | `<tc-ai-answer {feedback}>` |
| `feedbackReasons` | `el.feedbackReasons = …;` | `<… feedbackReasons={…} />` | `<tc-ai-answer :feedbackReasons="…">` | `<tc-ai-answer [feedbackReasons]="…">` | `<tc-ai-answer {feedbackReasons}>` |
| `onRegenerate` | `el.onRegenerate = …;` | `<… onRegenerate={…} />` | `<tc-ai-answer :onRegenerate="…">` | `<tc-ai-answer [onRegenerate]="…">` | `<tc-ai-answer {onRegenerate}>` |

*Also attributes: `question`, `answer`, `streaming`, `speed`, `hide-actions` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-feedback-change` | Yes | `el.addEventListener("tc-feedback-change", (e) => …)` | `onFeedbackChange={…}` | `@tc-feedback-change="…"` | `(tc-feedback-change)="…($event)"` | `el.addEventListener("tc-feedback-change", …)` |
| `tc-feedback` | No | `el.addEventListener("tc-feedback", (e) => …)` | `onFeedback={…}` | `@tc-feedback="…"` | `(tc-feedback)="…($event)"` | `el.addEventListener("tc-feedback", …)` |
| `tc-follow-up` | No | `el.addEventListener("tc-follow-up", (e) => …)` | `onFollowUp={…}` | `@tc-follow-up="…"` | `(tc-follow-up)="…($event)"` | `el.addEventListener("tc-follow-up", …)` |
| `tc-stop` | No | `el.addEventListener("tc-stop", (e) => …)` | `onStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

### Controlled

The element changes `feedback` itself unless a listener calls `preventDefault()` on `tc-feedback-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ai-answer id="ai-answer"></tc-ai-answer>

<script type="module">
  import "@adamstavely/trenchcoat/ai-answer";

  const el = document.querySelector("#ai-answer");
  el.addEventListener("tc-feedback-change", (e) => {
    e.preventDefault(); // the element keeps its feedback…
    if (allowed(e.detail.feedback)) el.feedback = e.detail.feedback; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AIAnswer } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AIAnswer>;
type Props = Omit<Own, "feedback" | "onFeedbackChange"> & { initial: NonNullable<Own["feedback"]> };

// Controlled: passing feedback makes the wrapper prevent the element's own change; the app sets it
export function ControlledAiAnswer({ initial, ...props }: Props) {
  const [feedback, setFeedback] = useState<Own["feedback"]>(initial);
  return <AIAnswer {...props} feedback={feedback} onFeedbackChange={(next) => setFeedback(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/ai-answer";
import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";

const props = defineProps<{ initial: TcAiAnswer["feedback"] }>();
const feedback = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFeedbackChange = (e: CustomEvent<{ feedback: TcAiAnswer["feedback"] }>) => {
  e.preventDefault();
  feedback.value = e.detail.feedback;
};
</script>

<template>
  <tc-ai-answer :feedback="feedback" @tc-feedback-change="onFeedbackChange"></tc-ai-answer>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AiAnswer } from "@adamstavely/trenchcoat/angular/ai-answer";
import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";

@Component({
  selector: "app-controlled-ai-answer",
  imports: [AiAnswer],
  template: `<tc-ai-answer [feedback]="feedback()" (tc-feedback-change)="onFeedbackChange($event)"></tc-ai-answer>`,
})
export class ControlledAiAnswer {
  readonly initial = input.required<TcAiAnswer["feedback"]>();
  readonly feedback = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFeedbackChange(e: CustomEvent<{ feedback: TcAiAnswer["feedback"] }>) {
    e.preventDefault();
    this.feedback.set(e.detail.feedback);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-answer";
  import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";

  let { initial }: { initial: TcAiAnswer["feedback"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let feedback = $derived(initial);
  let el: TcAiAnswer;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      feedback = (e as CustomEvent<{ feedback: TcAiAnswer["feedback"] }>).detail.feedback;
    };
    el.addEventListener("tc-feedback-change", on);
    return () => el.removeEventListener("tc-feedback-change", on);
  });
</script>

<tc-ai-answer bind:this={el} {feedback}></tc-ai-answer>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-answer")` returns a `TcAiAnswer` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";`
- **React / Next.js:** Props: `import type { AIAnswerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AIAnswer>`. The element class, for refs: `import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiAnswer["sources"]` with `import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";`
- **Angular:** The directive types the template: `[sources]` takes `TcAiAnswer["sources"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiAnswer } from "@adamstavely/trenchcoat/ai-answer";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `sources` | `AnswerSource[]` | The sources the answer cites, numbered from 1 in the order given – [1] in the answer is the first |
| `animate` | `boolean` | Stream the text in; false shows it at once |
| `answer` | `string` | The answer text – may grow while `streaming` is true |
| `onFollowUp` | `(question: string) => void` | Called with the follow-up question that was picked |
| `onStop` | `() => void` | Stop was pressed while the answer was being written |
| `onFeedback` | `(value: "up" \| "down", reason?: string) => void` | A thumb up, or a thumbs down once its reason is picked |
| `feedback` | `AnswerFeedback \| null` | The verdict shown – controlled when defined (null: none) |
| `defaultFeedback` | `AnswerFeedback \| null` | The verdict on mount when `feedback` isn't controlled |
| `onFeedbackChange` | `(feedback: AnswerFeedback \| null) => void` | Every change of the verdict, including clearing it and a new answer starting over |
| `onCopy` | `(text: string) => void` | Called with the copied text once the answer is on the clipboard |

*Renamed or hidden on the wrapper: `sources`, `feedback`, `animated`, `onCopy`*

## Accessibility

### Keyboard

Everything is a link or a button; Tab moves through the source cards, the citation chips, Stop or the actions, the
reasons and the follow-up questions.

| Key | What it does |
|---|---|
| Tab | Moves to the next card, chip or button; focusing a citation chip opens its preview |
| Enter / Space | On a citation chip: opens or closes the preview. On a button: presses it |
| Escape | Closes the source preview, wherever focus is |

### Screen readers

The question is a heading, and the sources a list named “Sources”. The label says what's happening (“Reading 3
sources”, “Writing”, “Answer”), and the answer is `aria-busy` until it's finished. Each citation chip reads its
source's name and title (“Notion – Remote work policy (2026)”); while its preview is open the chip is described by
it. Good answer and Bad answer are toggle buttons with `aria-pressed`, and Copy answer becomes “Copied”. A polite
status says how the answer ended and what happened next: “Answered in 3.2s”, “Stopped”, “Copied”, “What went wrong?”,
“Thanks for the feedback”. A failed regenerate is an alert (“Couldn't regenerate: …”).

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 58.9 KB | 13.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **68.2 KB** | **16.7 KB** |
| With Lit – the first component on a page | 89.3 KB | 23.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.3 ms** | the gallery demo's data, 102 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of feedbackReasons replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.9 ms | feedbackReasons: first render, 198 nodes; update 0.5 ms |
| 1,000 items | 14 ms | feedbackReasons: first render, 1,098 nodes; update 1.6 ms |

1,000 items of feedbackReasons: 14 ms, 1,098 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 28 React commits (clean), 25 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **1 frames/s, 0 timer callbacks/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 8 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document keydown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Put the person's question in `question`, as they asked it.
- Lead with the answer itself, then the details – the first sentence should stand on its own.
- Cite where a claim comes from, right after the claim; keep `[1]` out of the middle of a phrase.
- Leave a blank line before and after a list – a list item directly under a sentence is read as part of that
  paragraph.
- Give each source a short `name` people recognise (“Notion”, “Slack”) – it's the text on the chip – and a `snippet`
  with the passage the answer relies on.
- Offer follow-ups as full questions people would ask next, not topics.

## Do and don't

### Do

- Set `onRegenerate` and return a promise, so a failure shows in the footer and Regenerate can be tried again.
- Use `feedbackReasons` to ask about the problems you can act on.
- Pass `animate={false}` (React) or `animated = false` for answers loaded from history.
- In a conversation that puts `message-actions` under every reply, set `hide-actions` (React: `hideActions`) so the
  answer doesn't show a second row of the same actions.

### Don't

- Don't cite numbers that have no source – `[4]` with three sources is left out of the text.
- Don't put links in the answer text; it's plain text, and sources belong in the cards.
- Don't hide the sources to save space – the answer is only as trustworthy as what people can check.

## Related

- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Thinking State](thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
