<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Conversation annotation

**AI configuration** · New

Label and redact spans in a conversation, rate turns, correct answers as a diff, and send the reviewed example to a dataset

- **Element:** `<tc-conversation-annotation>`
- **Size:** 24.9 KB gzip · 96.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/conversation-annotation";` |
| React / Next.js | `import { ConversationAnnotation } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/conversation-annotation";` · tags starting with tc- are custom elements |
| Angular | `import { ConversationAnnotation } from "@adamstavely/trenchcoat/angular/conversation-annotation";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/conversation-annotation";` |

## Example

The live example is in the gallery at `#/conversation-annotation`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Turns a conversation into a reviewed example. Reviewers select a span inside any message and label it from your label
set, redact text that mustn't leave the review, rate each answer and write the answer it should have been – shown as a
word diff against the original. Labels appear as marks in the text with a legend that counts them, and every
annotation is listed beside the transcript with a way back to it – hovering or focusing one lights up its span, and
hovering a mark lights up its entry. "Send to dataset" hands your app the example with redacted text already
blanked out; the component stores nothing and sends nothing itself.

### When to use

- Reviewing production conversations to build evaluation or fine-tuning sets.
- Labelling failure modes – wrong facts, unsupported claims, sensitive data – at the span where they happen.
- Quality review where reviewers rate answers and correct the bad ones in the same pass.

### When not to use

- Scoring one answer against several criteria with failure types – use [Feedback Rubric](feedback-rubric.md).
- Accepting or rejecting an AI's suggested edits to a piece of text – use [Inline Diff](inline-diff.md).
- Editing the cases of a test set directly – use [Evaluation Dataset Editor](evaluation-dataset-editor.md).
- Showing how test cases did across versions – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Legend** `.ui-cva__keys` – a key per label with its shortcut and count, plus Redact
2. **Turn** `.ui-cva__turn` – one message: its role, its rating and its text
3. **Mark** `.ui-cva__mark` – labelled text in the label's colour, followed by the label's name
4. **Redaction** `.ui-cva__redacted` – a bar where redacted text was
5. **Correction** `.ui-cva__fixed` – the corrected answer as a word diff, with Edit and Remove
6. **Annotation list** `.ui-cva__list` – every span, with a jump to it and a remove button
7. **Send** `.ui-cva__send` – hands the reviewed example to your app

## Looks

Standard is a gray tray with the header on the tray and the transcript on a white card; user turns sit on a soft fill,
and the legend keys are filled chips. Clean is one white card: hairline dividers separate the turns, role labels and
the list heading use the caption style, the legend keys are outlined and the selection is a lighter accent tint. Both
draw labels as highlighter fills in the label's tone with a solid edge under them. From 760 px wide the annotation list
sits beside the transcript and stays in view as the page scrolls; narrower, it follows the transcript, and at its
narrowest the rating wraps under the role.

## Usage

### HTML

```html
<tc-conversation-annotation id="review"></tc-conversation-annotation>

<script type="module">
  import "@adamstavely/trenchcoat/conversation-annotation";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.heading = "Ticket 48213";
  review.messages = [
    { id: "m1", role: "user", text: "Can I send my backpack back?" },
    { id: "m2", role: "assistant", text: "Yes, within 60 days of purchase." },
  ];
  review.value = { spans: [], ratings: {}, corrections: {} };
  review.addEventListener("tc-send", (e) => console.log(e.detail.example));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ConversationAnnotation, type AnnotationMessage, type ConversationAnnotationValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const messages: AnnotationMessage[] = [
  { id: "m1", role: "user", text: "Can I send my backpack back?" },
  { id: "m2", role: "assistant", text: "Yes, within 60 days of purchase." },
];

export function Review() {
  const [value, setValue] = useState<ConversationAnnotationValue>({ spans: [], ratings: {}, corrections: {} });
  return <ConversationAnnotation title="Ticket 48213" messages={messages} value={value} onChange={setValue} onSend={(example) => console.log(example)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/conversation-annotation";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";

defineProps<{ messages: TcConversationAnnotation["messages"]; labels: TcConversationAnnotation["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-conversation-annotation :messages="messages" :labels="labels" @tc-value-change="onValueChange"></tc-conversation-annotation>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ConversationAnnotation } from "@adamstavely/trenchcoat/angular/conversation-annotation";
import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";

@Component({
  selector: "app-conversation-annotation-example",
  imports: [ConversationAnnotation],
  template: `<tc-conversation-annotation [messages]="messages()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-conversation-annotation>`,
})
export class ConversationAnnotationExample {
  readonly messages = input.required<TcConversationAnnotation["messages"]>();
  readonly labels = input.required<TcConversationAnnotation["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/conversation-annotation";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";

  let { messages, labels }: { messages: TcConversationAnnotation["messages"]; labels: TcConversationAnnotation["labels"] } = $props();
  let el: TcConversationAnnotation;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-conversation-annotation bind:this={el} {messages} {labels}></tc-conversation-annotation>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Conversation review"` | The heading, and the transcript's accessible name |
| `description` | `description` | `string` | `""` | A quieter line under the heading – where the conversation came from |
| `messages` | – | `AnnotationMessage[]` | `[]` | The conversation, in order |
| `labels` | – | `AnnotationLabel[]` | `[ { id: "incorrect", label: "Incorrect", tone: "rose", description: "States something that isn't true" }, { id: "unsupported", label: "Unsupported", tone: "amber", description: "Not backed by anything it was given" }, { id: "sensitive", label: "Sensitive", tone: "violet", description: "Personal or confidential information" }, { id: "helpful", label: "Helpful", tone: "teal", description: "A good example of what we want" }, ]` | The label set; the first nine get the shortcut keys 1–9 |
| `value` | – | `ConversationAnnotationValue` | `{ spans: [], ratings: {}, corrections: {} }` | Spans, ratings and corrections. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `ratingLevels` | – | `RubricLevel[]` | `[ { value: 1, label: "Poor" }, { value: 2, label: "Okay" }, { value: 3, label: "Good" }, ]` | The rating scale for a turn, lowest first |
| `rateRoles` | – | `string[]` | `["assistant"]` | The roles whose turns can be rated |
| `correctRoles` | – | `string[]` | `["assistant"]` | The roles whose turns can be corrected |
| `roleLabels` | – | `Record<string, string>` | `{ user: "User", assistant: "Assistant", system: "System", tool: "Tool" }` | Display names per role; an unknown role shows as written |
| `sendLabel` | `send-label` | `string` | `"Send to dataset"` | The send button's label |
| `sending` | `sending` | `boolean` | `false` | The app is sending the example: the button shows it's busy |
| `sent` | `sent` | `boolean` | `false` | The app has stored the example: the button reads "Sent to dataset" until the value changes |
| `name` | `name` | `string` | `""` | Submitted with the form: the value as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the value out of the form; a disabled fieldset does the same |
| `example` | – | `AnnotationExport` | – | The export copy tc-send carries: redacted text replaced by █ |
| `staleRedaction` | – | `` | – | A redaction whose message no longer matches it: where it applies isn't known, so nothing is sent |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A span, rating or correction changed ({ value }: ConversationAnnotationValueChange); cancelable – prevent it to control `value` |
| `tc-send` | – | No | "Send to dataset" was pressed ({ value, example }: ConversationAnnotationSend) – `example` has redacted text blanked out |

#### Design tokens it reads (125)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-rose-solid`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-teal-solid`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tone-violet-solid`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `annotationMatchesSource(span: AnnotationSpan, messages: readonly AnnotationMessage[]): void` | The span still points at the same text in its message |
| `prepareAnnotationExport(messages: readonly AnnotationMessage[], value: ConversationAnnotationValue): AnnotationExport` | An export copy: redacted spans become █ in the messages, in every quote that overlaps them and in corrections |

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
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-conversation-annotation :messages="…">` | `<tc-conversation-annotation [messages]="…">` | `<tc-conversation-annotation {messages}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-conversation-annotation :labels="…">` | `<tc-conversation-annotation [labels]="…">` | `<tc-conversation-annotation {labels}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-conversation-annotation :value="…">` | `<tc-conversation-annotation [value]="…">` | `<tc-conversation-annotation {value}>` |
| `ratingLevels` | `el.ratingLevels = …;` | `<… ratingLevels={…} />` | `<tc-conversation-annotation :ratingLevels="…">` | `<tc-conversation-annotation [ratingLevels]="…">` | `<tc-conversation-annotation {ratingLevels}>` |
| `rateRoles` | `el.rateRoles = …;` | `<… rateRoles={…} />` | `<tc-conversation-annotation :rateRoles="…">` | `<tc-conversation-annotation [rateRoles]="…">` | `<tc-conversation-annotation {rateRoles}>` |
| `correctRoles` | `el.correctRoles = …;` | `<… correctRoles={…} />` | `<tc-conversation-annotation :correctRoles="…">` | `<tc-conversation-annotation [correctRoles]="…">` | `<tc-conversation-annotation {correctRoles}>` |
| `roleLabels` | `el.roleLabels = …;` | `<… roleLabels={…} />` | `<tc-conversation-annotation :roleLabels="…">` | `<tc-conversation-annotation [roleLabels]="…">` | `<tc-conversation-annotation {roleLabels}>` |

*Also attributes: `heading`, `description`, `send-label`, `sending`, `sent`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-send` | No | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-conversation-annotation id="conversation-annotation"></tc-conversation-annotation>

<script type="module">
  import "@adamstavely/trenchcoat/conversation-annotation";

  const el = document.querySelector("#conversation-annotation");
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
import { ConversationAnnotation } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ConversationAnnotation>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledConversationAnnotation({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ConversationAnnotation {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/conversation-annotation";
import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";

const props = defineProps<{ initial: TcConversationAnnotation["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcConversationAnnotation["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-conversation-annotation :value="value" @tc-value-change="onValueChange"></tc-conversation-annotation>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ConversationAnnotation } from "@adamstavely/trenchcoat/angular/conversation-annotation";
import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";

@Component({
  selector: "app-controlled-conversation-annotation",
  imports: [ConversationAnnotation],
  template: `<tc-conversation-annotation [value]="value()" (tc-value-change)="onValueChange($event)"></tc-conversation-annotation>`,
})
export class ControlledConversationAnnotation {
  readonly initial = input.required<TcConversationAnnotation["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcConversationAnnotation["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/conversation-annotation";
  import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";

  let { initial }: { initial: TcConversationAnnotation["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcConversationAnnotation;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcConversationAnnotation["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-conversation-annotation bind:this={el} {value}></tc-conversation-annotation>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

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

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-conversation-annotation :value="value" @tc-value-change="value = $event.detail.value"></tc-conversation-annotation>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-conversation-annotation [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-conversation-annotation>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-conversation-annotation bind:this={el} {value}></tc-conversation-annotation>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-conversation-annotation")` returns a `TcConversationAnnotation` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";`
- **React / Next.js:** Props: `import type { ConversationAnnotationProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ConversationAnnotation>`. The element class, for refs: `import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConversationAnnotation["messages"]` with `import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";`
- **Angular:** The directive types the template: `[messages]` takes `TcConversationAnnotation["messages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConversationAnnotation } from "@adamstavely/trenchcoat/conversation-annotation";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Conversation review" |
| `value` | `ConversationAnnotationValue` | Spans, ratings and corrections. Controlled when defined; otherwise the component keeps them, starting from `defaultValue` |
| `defaultValue` | `ConversationAnnotationValue` | The value at first when `value` isn't controlled |
| `onChange` | `(value: ConversationAnnotationValue) => void` | Called with the whole value after every label, redaction, rating or correction, controlled or not |
| `onSend` | `(example: AnnotationExport, value: ConversationAnnotationValue) => void` | Called when "Send to dataset" is pressed, with the value and the export copy whose redacted text is blanked out |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `onChange`, `children`*

## Accessibility

Follows the WAI-ARIA [Feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the legend, the active turn, its rating and correction controls, the annotation list and Send |
| ↑ / ↓, Page Up / Page Down | On a turn: moves to the previous or next turn |
| Home / End | On a turn: moves to the first or last turn |
| ← / → | On a turn: moves the caret to the previous or next word; a selection collapses to its start or end |
| Shift + ← / → | On a turn: extends the selection by a word |
| Shift + Home / End | On a turn: extends the selection to the start or end of the message |
| Ctrl + A / ⌘ + A | On a turn: selects the whole message |
| 1–9 | On a turn: applies that label to the selection |
| R | On a turn: redacts the selection |
| Esc | On a turn: clears the selection; in the correction editor: cancels it |
| ← / → / ↑ / ↓ | In the legend: moves between keys; in a rating: picks the previous or next level |
| Enter / Space | On a legend key: applies it; on a rating level: picks it, or clears it when it's already picked |
| Delete / Backspace | On an annotation in the list: removes it |

Selecting with the mouse works too: the selected text becomes the turn's selection and the turn takes focus, so the
number keys apply straight away. The selection is trimmed of spaces at either end before a label is applied.

### Screen readers

The transcript is a `feed` named by the heading; each turn is an `article` named “Assistant, turn 2 of 4” with
`aria-posinset` and `aria-setsize`. Marked text is a `mark` followed by the label in brackets – “60 days (Incorrect)”;
a redaction reads “Redacted – 25 characters”, and the redacted text isn't in the page. The legend is a `toolbar` named
“Labels” and described by the hint under it (“Select text in a message to label it…”, or the selected text and the keys
to press); keys are `aria-disabled` until there's a selection and carry `aria-keyshortcuts`. A rating is a `radiogroup`
named “Rate assistant turn”. In a correction, removed words read “removed: …” and added ones “added: …”. A polite
status region says what happened: “Selected “within 60 days””, “Labelled Unsupported: “60 days””, “Redacted 25
characters”, “Rated Poor”, “Removed Incorrect”, “Select some text first”. In a form, an annotation whose text has
changed makes the control invalid.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 44.5 KB | 12.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **96.2 KB** | **25.0 KB** |
| With Lit – the first component on a page | 118.3 KB | 32.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 139 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of messages replaced |
| First on the page | 9.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.2 ms | messages: first render, 1,051 nodes; update 1.2 ms |
| 1,000 items | 68 ms | messages: first render, 9,601 nodes; update 8.1 ms |

1,000 items of messages: 68 ms. It renders every item, so a first render passes 50 ms (a long task) at about 730 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (inline-diff).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name labels for what the reviewer found, in a word or two: “Incorrect”, “Unsupported”, “Sensitive”. Give each a
  `description` – it's the key's tooltip.
- Keep the set short. The first nine get the number keys, and four or five fit on one line.
- Use `roleLabels` for your own role names and `author` for who wrote a message; leave out names the dataset shouldn't
  carry.
- Give the levels of `ratingLevels` a word each – “Poor”, “Okay”, “Good” – they're the button text.

## Do and don't

### Do

- Store the value as it is – spans with offsets and quotes, ratings and corrections – and send `example` (or
  `prepareAnnotationExport`) to the dataset, never the raw messages.
- Set `sending` while your app stores the example and `sent` once it has, and clear `sent` when the review changes.
- Pass your own `labels`, `rateRoles` and `correctRoles`; system and tool turns rarely need a rating.

### Don't

- Don't rely on redaction here to remove data from your own systems – it blanks the export copy only.
- Don't change a message's text under existing spans: they're flagged as changed and the form becomes invalid.
- Don't use colour alone for labels in your own views of the data – the component always shows the label's name.

## Related

- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Evaluation Dataset Editor](evaluation-dataset-editor.md) – Edit an eval set's cases, checks, tags and splits, compare it with an earlier version, and import or export it as JSON Lines
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
