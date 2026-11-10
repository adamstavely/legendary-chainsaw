<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Clarifying Questions

**AI & chat** · New

The agent asks before it starts – two or three quick questions with choices or a short answer, sent back as one reply

- **Element:** `<tc-clarifying-questions>`
- **Size:** 10.2 KB gzip · 36.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/clarifying-questions";` |
| React / Next.js | `import { ClarifyingQuestions } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/clarifying-questions";` · tags starting with tc- are custom elements |
| Angular | `import { ClarifyingQuestions } from "@adamstavely/trenchcoat/angular/clarifying-questions";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/clarifying-questions";` |

## Example

The live example is in the gallery at `#/clarifying-questions`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent asks before it starts, when a request leaves room for a wrong guess: two or three structured questions –
one choice, several choices or a short answer – answered in place in the thread and sent back as one reply. Every
question offers “You decide”, so people can hand any of them back, and “Skip, you decide” hands back the lot. A few
seconds of answers saves a run that would have gone the wrong way; once sent, the card folds into the answers so the
thread reads as a conversation.

### When to use

- The request is ambiguous in a way that changes the result – length, audience, scope, format.
- The agent can name the likely answers, so people pick rather than type.
- Before a long or costly run, where starting over is expensive.

### When not to use

- A multi-step form people fill in on purpose, with review and validation – use [Stepper Form](stepper-form.md).
- One setting with a few options in a toolbar or panel – use [Segmented Control](segmented-control.md).
- Suggesting what to ask next, not asking for an answer – use [Prompt Starters](prompt-starters.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Question** `.ui-clq__q` – numbered, with an optional hint; the number turns into a check once answered
3. **Answers** `.ui-clq__choices` – chips or, when they have descriptions, cards; “You decide” is dashed with a spark
4. **Short answer** `.ui-clq__text` – a field, with You decide beside it
5. **Send** `.ui-clq__foot` – “1 of 3 answered”, Skip, and Send answers

## Looks

Standard puts the header on the gray tray and the questions on a white card below it, with answers as white chips and the progress and Send
on the tray below. Clean is one white card with the header as its first row: answers are flat gray chips, the radio and check marks are thinner, and
Send sits in the card's last row. In both, the picked answer is tinted with the accent and ringed.

## Usage

### HTML

```html
<tc-clarifying-questions id="ask" intro="I'll draft the deck from the Q3 planning docs once I know these."></tc-clarifying-questions>

<script type="module">
  import "@adamstavely/trenchcoat/clarifying-questions";
  import "@adamstavely/trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.questions = [
    { id: "length", prompt: "How long should the deck be?", kind: "single", options: [{ value: "short", label: "Short" }, { value: "standard", label: "Standard" }] },
    { id: "areas", prompt: "Which areas should it cover?", kind: "multiple", options: [{ value: "revenue", label: "Revenue" }, { value: "hiring", label: "Hiring" }] },
    { id: "avoid", prompt: "Anything to leave out?", kind: "text", optional: true },
  ];
  ask.addEventListener("tc-send", (e) => reply(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ClarifyingQuestions, type ClarifyingAnswers, type ClarifyingQuestion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AskFirst({ questions, reply }: { questions: ClarifyingQuestion[]; reply: (answers: ClarifyingAnswers) => void }) {
  const [answers, setAnswers] = useState<ClarifyingAnswers>({});
  return (
    <ClarifyingQuestions
      intro="I'll start once I know these."
      questions={questions}
      value={answers}
      onChange={setAnswers}
      onSend={(value) => reply(value)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/clarifying-questions";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";

defineProps<{ questions: TcClarifyingQuestions["questions"]; value: TcClarifyingQuestions["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-clarifying-questions :questions="questions" :value="value" @tc-value-change="onValueChange"></tc-clarifying-questions>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ClarifyingQuestions } from "@adamstavely/trenchcoat/angular/clarifying-questions";
import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";

@Component({
  selector: "app-clarifying-questions-example",
  imports: [ClarifyingQuestions],
  template: `<tc-clarifying-questions [questions]="questions()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-clarifying-questions>`,
})
export class ClarifyingQuestionsExample {
  readonly questions = input.required<TcClarifyingQuestions["questions"]>();
  readonly value = input.required<TcClarifyingQuestions["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/clarifying-questions";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";

  let { questions, value }: { questions: TcClarifyingQuestions["questions"]; value: TcClarifyingQuestions["value"] } = $props();
  let el: TcClarifyingQuestions;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-clarifying-questions bind:this={el} {questions} {value}></tc-clarifying-questions>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `questions` | – | `ClarifyingQuestion[]` | `[]` | The questions, in the order they're asked |
| `value` | – | `ClarifyingAnswers` | `{}` | The answers so far, by question id – the value |
| `heading` | `heading` | `string` | `"A few questions before I start"` | Names the questions, as the agent says it |
| `intro` | `intro` | `string \| undefined` | `undefined` | What the agent will do once it knows, in a sentence under the heading |
| `sent` | `sent` | `boolean` | `false` | The answers have been sent: the card shows them as the reply |
| `sendLabel` | `send-label` | `string` | `"Send answers"` | The send button's label |
| `decideLabel` | `decide-label` | `string` | `"You decide"` | The label of the answer that leaves a question to the agent |
| `skipLabel` | `skip-label` | `string` | `"Skip, you decide"` | The label of the button that leaves every question to the agent |
| `skippable` | `skippable` | `boolean` | `true` | Offers the skip button; set it to false when the agent can't go on without answers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An answer changed. Cancelable. Detail: ClarifyingAnswersChange ({ value }) |
| `tc-send` | – | Yes | Send, Enter on the last question, or Skip – every answer in one reply. Cancelable: unless prevented the card shows as sent. Detail: ClarifyingAnswersChange ({ value }) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-clarifying-questions-num` | `20px` | standard, clean |

#### Design tokens it reads (100)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-head-gap`, `--tc-head-icon-size`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `questions` | `el.questions = …;` | `<… questions={…} />` | `<tc-clarifying-questions :questions="…">` | `<tc-clarifying-questions [questions]="…">` | `<tc-clarifying-questions {questions}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-clarifying-questions :value="…">` | `<tc-clarifying-questions [value]="…">` | `<tc-clarifying-questions {value}>` |

*Also attributes: `heading`, `intro`, `sent`, `send-label`, `decide-label`, `skip-label`, `skippable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-clarifying-questions id="clarifying-questions"></tc-clarifying-questions>

<script type="module">
  import "@adamstavely/trenchcoat/clarifying-questions";

  const el = document.querySelector("#clarifying-questions");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ClarifyingQuestions } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ClarifyingQuestions>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledClarifyingQuestions({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ClarifyingQuestions {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/clarifying-questions";
import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";

const props = defineProps<{ initial: TcClarifyingQuestions["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcClarifyingQuestions["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-clarifying-questions :value="value" @tc-value-change="onValueChange"></tc-clarifying-questions>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ClarifyingQuestions } from "@adamstavely/trenchcoat/angular/clarifying-questions";
import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";

@Component({
  selector: "app-controlled-clarifying-questions",
  imports: [ClarifyingQuestions],
  template: `<tc-clarifying-questions [value]="value()" (tc-value-change)="onValueChange($event)"></tc-clarifying-questions>`,
})
export class ControlledClarifyingQuestions {
  readonly initial = input.required<TcClarifyingQuestions["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcClarifyingQuestions["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/clarifying-questions";
  import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";

  let { initial }: { initial: TcClarifyingQuestions["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcClarifyingQuestions;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcClarifyingQuestions["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-clarifying-questions bind:this={el} {value}></tc-clarifying-questions>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-clarifying-questions :value="value" @tc-value-change="value = $event.detail.value"></tc-clarifying-questions>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-clarifying-questions [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-clarifying-questions>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-clarifying-questions bind:this={el} {value}></tc-clarifying-questions>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-clarifying-questions")` returns a `TcClarifyingQuestions` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";`
- **React / Next.js:** Props: `import type { ClarifyingQuestionsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ClarifyingQuestions>`. The element class, for refs: `import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcClarifyingQuestions["questions"]` with `import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";`
- **Angular:** The directive types the template: `[questions]` takes `TcClarifyingQuestions["questions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcClarifyingQuestions } from "@adamstavely/trenchcoat/clarifying-questions";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Names the questions, as the agent says it |
| `value` | `ClarifyingAnswers` | The answers, by question id. Controlled when defined – pass back what onChange reports |
| `defaultValue` | `ClarifyingAnswers` | Starting answers when uncontrolled |
| `onChange` | `(value: ClarifyingAnswers) => void` | An answer changed: every answer so far |
| `sent` | `boolean` | Whether the answers have been sent. Controlled when defined – set it after onSend |
| `defaultSent` | `boolean` | Whether it starts as sent when uncontrolled |
| `onSend` | `(value: ClarifyingAnswers, event: Event) => void` | Send, Enter on the last question, or Skip: every answer in one reply. Call event.preventDefault() to keep the questions open |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between questions (one stop per choice question), the field and the buttons |
| ← → ↑ ↓ | One choice: moves to the next or previous answer and picks it. Several choices: moves without picking |
| Home / End | First or last answer in the question |
| Space | Picks an answer; with several choices, ticks or unticks it |
| Enter | Moves to the next question; on the last one, sends |

### Screen readers

The questions are a `form` named by the heading, and each question is a `group` named by its prompt. One choice is a
`radiogroup` of `radio` buttons (`aria-required` unless optional); several choices are `checkbox` buttons in a
`group`; You decide is the last radio or checkbox, or a toggle button with `aria-pressed` beside a short-answer field.
An answer with a description reads as “Standard, 10–12 slides”. If Send finds a required question unanswered, focus
moves to it, the question is described by “Answer this, or choose You decide” (a field gets `aria-invalid`), and a
status region says “Answer question 2, or choose You decide”. After sending, it says “Answers sent” and focus moves to
the reply, a `group` named “Answers sent” listing each prompt and answer.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.0 KB | 7.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **36.2 KB** | **10.3 KB** |
| With Lit – the first component on a page | 58.6 KB | 17.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 97 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of questions replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 15 ms | questions: first render, 2,654 nodes; update 1.9 ms |
| 1,000 items | 153 ms | questions: first render, 26,354 nodes; update 11 ms |

1,000 items of questions: 153 ms. It renders every item, so a first render passes 50 ms (a long task) at about 330 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Ask two or three questions; more turns the card into a form.
- Write prompts as the agent would ask them: “How long should the deck be?”, not “Length”.
- Keep answer labels to one to three words; put the detail in `description`.
- Use `hint` to say why the answer matters: “I'll give each one its own section.”
- Mark questions people can leave blank as `optional` rather than adding a “None” answer.

## Do and don't

### Do

- Act on “You decide” – the reply carries `{ decide: true }` for each question handed back.
- Read the answers back in the agent's next message, so people see they were heard.
- Turn off `skippable` only when the agent truly can't go on without an answer.

### Don't

- Don't ask what the agent could find in the context it already has.
- Don't make every question required; an optional short answer catches what the choices miss.
- Don't reopen the questions after sending – ask again in a new turn if something changed.

## Related

- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Prompt Starters](prompt-starters.md) – Where to begin, and what to ask next – suggestions for an empty chat and follow-ups after an answer, from the conversation's context

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
