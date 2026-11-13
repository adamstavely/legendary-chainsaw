<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Multiplayer Thread

**AI & chat** · New

One chat thread shared by several people and one model – grouped messages with names, joins and leaves, who's here and typing, @-mentions, a switch for whether the model answers every message or only when mentioned, and "Replying to" on its answers

- **Element:** `<tc-multiplayer-thread>`
- **Size:** 21.3 KB gzip · 73.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/multiplayer-thread";` |
| React / Next.js | `import { MultiplayerThread } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/multiplayer-thread";` · tags starting with tc- are custom elements |
| Angular | `import { MultiplayerThread } from "@adamstavely/trenchcoat/angular/multiplayer-thread";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/multiplayer-thread";` |

## Example

The live example is in the gallery at `#/multiplayer-thread`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One chat thread shared by several people and one model. Every message shows who wrote it, and a run of messages from
one person within five minutes groups under one name. Joins and leaves are quiet rows in the conversation. Above it, a
presence strip shows who's here – a small dot on anyone typing – and a switch for when the model answers: only when
someone @-mentions it, or every message. The model's replies say whose message they answer ("Replying to Priya").
Typing @ in the composer offers the model and the other people.

### When to use

- A team working a problem together with a model in one conversation – a review, an incident, a planning session.
- When it matters who asked the model what, and when it should stay quiet.
- Showing who's here and who's typing in a shared AI chat.

### When not to use

- One person talking to a model – use [Chat Composer](chat-composer.md) with [AI Answer](ai-answer.md).
- Agents talking to each other during a run – use [Collaboration Stream](collaboration-stream.md).
- A comment pinned to one spot in a document – use [Comment Thread](comment-thread.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Presence strip** `.ui-mpt__presence` – who's here, how many, and the mode switch
3. **Mode switch** `.ui-mpt__mode` – the model answers when mentioned, or every message
4. **Conversation** `.ui-mpt__log` – messages, joins and leaves, and who's typing
5. **Message** `.ui-mpt__msg` – avatar, name, role, time and text; grouped messages leave the avatar out
6. **Replying to** `.ui-mpt__reply-to` – on the model's messages, whose message it answers
7. **Mention** `.ui-mpt__mention` – an @-mention of a person or the model, marked in the text
8. **Composer** `.ui-mpt__composer` – the field, Send, and a hint about when the model answers

## Looks

Standard puts the header, the presence strip and the composer on a gray tray, with the conversation in a white card
between them. Clean is one white card: header, presence, conversation and composer as rows divided by hairlines, with
smaller avatars. `--tc-mpt-max-height` sets how tall the conversation grows before it scrolls.

## Usage

### HTML

```html
<tc-multiplayer-thread id="review" heading="Vendor review" current-user="ana"></tc-multiplayer-thread>

<script type="module">
  import "@adamstavely/trenchcoat/multiplayer-thread";
  import "@adamstavely/trenchcoat/tokens.css";

  const thread = document.querySelector("#review");
  thread.people = [
    { id: "ana", name: "Ana Ruiz", role: "Lead" },
    { id: "priya", name: "Priya Shah", role: "Analyst" },
  ];
  thread.model = { name: "Assistant" };
  thread.present = ["ana", "priya", "model"];
  thread.items = [{ id: "m1", authorId: "priya", at: Date.now(), text: "@Assistant is a 14-month-old SOC 2 report acceptable?" }];
  thread.addEventListener("tc-send", (e) => {
    thread.items = [...thread.items, { id: String(Date.now()), authorId: "ana", at: Date.now(), text: e.detail.text }];
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MultiplayerThread, type MultiplayerItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Review({ ask }: { ask: (text: string) => Promise<string> }) {
  const [items, setItems] = useState<MultiplayerItem[]>([]);
  const [typing, setTyping] = useState<string[]>([]);
  return (
    <MultiplayerThread
      title="Vendor review"
      people={[
        { id: "ana", name: "Ana Ruiz", role: "Lead" },
        { id: "priya", name: "Priya Shah", role: "Analyst" },
      ]}
      model={{ name: "Assistant" }}
      currentUser="ana"
      present={["ana", "priya", "model"]}
      typing={typing}
      items={items}
      onSend={async (text, _mentions, modelAnswers) => {
        setItems((list) => [...list, { id: crypto.randomUUID(), authorId: "ana", at: Date.now(), text }]);
        if (!modelAnswers) return;
        setTyping(["model"]);
        const answer = await ask(text);
        setTyping([]);
        setItems((list) => [...list, { id: crypto.randomUUID(), authorId: "model", replyTo: "ana", at: Date.now(), text: answer }]);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/multiplayer-thread";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";

defineProps<{ people: TcMultiplayerThread["people"]; model: TcMultiplayerThread["model"] }>();
const onSend = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-multiplayer-thread :people="people" :model="model" @tc-send="onSend"></tc-multiplayer-thread>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MultiplayerThread } from "@adamstavely/trenchcoat/angular/multiplayer-thread";
import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";

@Component({
  selector: "app-multiplayer-thread-example",
  imports: [MultiplayerThread],
  template: `<tc-multiplayer-thread [people]="people()" [model]="model()" (tc-send)="onSend($event)"></tc-multiplayer-thread>`,
})
export class MultiplayerThreadExample {
  readonly people = input.required<TcMultiplayerThread["people"]>();
  readonly model = input.required<TcMultiplayerThread["model"]>();
  onSend(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/multiplayer-thread";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";

  let { people, model }: { people: TcMultiplayerThread["people"]; model: TcMultiplayerThread["model"] } = $props();
  let el: TcMultiplayerThread;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-send", on);
    return () => el.removeEventListener("tc-send", on);
  });
</script>

<tc-multiplayer-thread bind:this={el} {people} {model}></tc-multiplayer-thread>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Thread"` | The heading, and the region's name |
| `people` | – | `MultiplayerPerson[]` | `[]` | Everyone who can be in the thread |
| `model` | – | `MultiplayerModel` | `{ name: "Assistant" }` | The model in the thread |
| `items` | – | `MultiplayerItem[]` | `[]` | Messages, joins and leaves, oldest first – the source of truth |
| `currentUser` | `current-user` | `string` | `""` | The id of the person using this view – their messages are theirs, and they aren't offered as a mention |
| `present` | – | `string[]` | `[]` | Ids of who's here now (MULTIPLAYER_MODEL_ID for the model) |
| `typing` | – | `string[]` | `[]` | Ids of who's typing now; MULTIPLAYER_MODEL_ID while the model is answering |
| `mode` | `mode` | `MultiplayerMode` | `"mentions"` | When the model answers: only when |
| `hideMode` | `hide-mode` | `boolean` | `false` | Hides the mode switch – the page decides when the model answers |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for times |
| `labels` | – | `Partial<MultiplayerThreadLabels>` | `{}` | Words the page can rename, merged over defaultMultiplayerThreadLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-send` | – | Yes | A message was sent ({ text, mentions, modelAnswers }: MultiplayerSend); cancelable – prevented, the text stays in the field |
| `tc-mode-change` | – | Yes | When the model answers changed ({ mode }: MultiplayerModeChange); cancelable – prevented, the mode stays |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus(options?: FocusOptions)` | `void` | Puts focus in the composer |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mpt-max-height` | `380px` | both |
| `--tc-mpt-gutter` | `var(--tc-avatar-sm)` | both, clean |
| `--tc-mpt-dot-step` | `160ms` | both |
| `--tc-mpt-dot` | `5px` | both |
| `--tc-mpt-dot-gap` | `3px` | both |

#### Design tokens it reads (62)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-sm`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-inverse`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `MULTIPLAYER_MODEL_ID: string` | The model's id in `items`, `typing`, `present` and mentions |
| `mentionsIn(text: string, names: { id: string; name: string }[]): void` | The ids a text |

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
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-multiplayer-thread :people="…">` | `<tc-multiplayer-thread [people]="…">` | `<tc-multiplayer-thread {people}>` |
| `model` | `el.model = …;` | `<… model={…} />` | `<tc-multiplayer-thread :model="…">` | `<tc-multiplayer-thread [model]="…">` | `<tc-multiplayer-thread {model}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-multiplayer-thread :items="…">` | `<tc-multiplayer-thread [items]="…">` | `<tc-multiplayer-thread {items}>` |
| `present` | `el.present = …;` | `<… present={…} />` | `<tc-multiplayer-thread :present="…">` | `<tc-multiplayer-thread [present]="…">` | `<tc-multiplayer-thread {present}>` |
| `typing` | `el.typing = …;` | `<… typing={…} />` | `<tc-multiplayer-thread :typing="…">` | `<tc-multiplayer-thread [typing]="…">` | `<tc-multiplayer-thread {typing}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-multiplayer-thread :labels="…">` | `<tc-multiplayer-thread [labels]="…">` | `<tc-multiplayer-thread {labels}>` |

*Also attributes: `heading`, `current-user`, `mode`, `hide-mode`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `onModeChange={…}` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |

### Controlled

The element changes `mode` itself unless a listener calls `preventDefault()` on `tc-mode-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-multiplayer-thread id="multiplayer-thread"></tc-multiplayer-thread>

<script type="module">
  import "@adamstavely/trenchcoat/multiplayer-thread";

  const el = document.querySelector("#multiplayer-thread");
  el.addEventListener("tc-mode-change", (e) => {
    e.preventDefault(); // the element keeps its mode…
    if (allowed(e.detail.mode)) el.mode = e.detail.mode; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { MultiplayerThread } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof MultiplayerThread>;
type Props = Omit<Own, "mode" | "onModeChange"> & { initial: NonNullable<Own["mode"]> };

// Controlled: passing mode makes the wrapper prevent the element's own change; the app sets it
export function ControlledMultiplayerThread({ initial, ...props }: Props) {
  const [mode, setMode] = useState<Own["mode"]>(initial);
  return <MultiplayerThread {...props} mode={mode} onModeChange={(next) => setMode(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/multiplayer-thread";
import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";

const props = defineProps<{ initial: TcMultiplayerThread["mode"] }>();
const mode = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onModeChange = (e: CustomEvent<{ mode: TcMultiplayerThread["mode"] }>) => {
  e.preventDefault();
  mode.value = e.detail.mode;
};
</script>

<template>
  <tc-multiplayer-thread :mode="mode" @tc-mode-change="onModeChange"></tc-multiplayer-thread>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MultiplayerThread } from "@adamstavely/trenchcoat/angular/multiplayer-thread";
import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";

@Component({
  selector: "app-controlled-multiplayer-thread",
  imports: [MultiplayerThread],
  template: `<tc-multiplayer-thread [mode]="mode()" (tc-mode-change)="onModeChange($event)"></tc-multiplayer-thread>`,
})
export class ControlledMultiplayerThread {
  readonly initial = input.required<TcMultiplayerThread["mode"]>();
  readonly mode = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onModeChange(e: CustomEvent<{ mode: TcMultiplayerThread["mode"] }>) {
    e.preventDefault();
    this.mode.set(e.detail.mode);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/multiplayer-thread";
  import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";

  let { initial }: { initial: TcMultiplayerThread["mode"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let mode = $derived(initial);
  let el: TcMultiplayerThread;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      mode = (e as CustomEvent<{ mode: TcMultiplayerThread["mode"] }>).detail.mode;
    };
    el.addEventListener("tc-mode-change", on);
    return () => el.removeEventListener("tc-mode-change", on);
  });
</script>

<tc-multiplayer-thread bind:this={el} {mode}></tc-multiplayer-thread>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-multiplayer-thread")` returns a `TcMultiplayerThread` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";`
- **React / Next.js:** Props: `import type { MultiplayerThreadProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MultiplayerThread>`. The element class, for refs: `import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMultiplayerThread["people"]` with `import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";`
- **Angular:** The directive types the template: `[people]` takes `TcMultiplayerThread["people"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMultiplayerThread } from "@adamstavely/trenchcoat/multiplayer-thread";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name (default "Thread") |
| `people` | `MultiplayerPerson[]` | Everyone who can be in the thread |
| `model` | `MultiplayerModel` | The model in the thread |
| `mode` | `MultiplayerMode` | When the model answers. Controlled when defined |
| `defaultMode` | `MultiplayerMode` | The starting mode when uncontrolled (default "mentions") |
| `onModeChange` | `(mode: MultiplayerMode) => void` | When the model answers changed |
| `onSend` | `(text: string, mentions: string[], modelAnswers: boolean, event: Event) => void` | A message was sent: add it to `items`. Call event.preventDefault() to keep the text in the field |

*Renamed or hidden on the wrapper: `heading`, `children`, `Thread`, `mentions`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the mode switch, the conversation (scrollable with the arrow keys), the field and Send |
| ← → | In the mode switch: changes when the model answers |
| @ | In the field: opens the list of people and the model; ↑ ↓ move, Enter or Tab inserts |
| Enter | Sends the message (Shift + Enter for a new line) |

### Screen readers

The thread is a `region` named by `heading`. The conversation is a `log` named "Messages", so new messages are read
politely as they arrive; it holds a list with one item per message, join or leave. Grouped messages repeat the
author's name in hidden text, so every message says who wrote it. Who's typing is announced in a separate status
region ("Priya is typing…", "Assistant is answering…"); the dots and the faces are hidden. The mode switch is a
fieldset of two radios named "Assistant answers"; the field is described by the hint ("Mention @Assistant to ask it").

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, mention-picker, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, mention-picker | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, mention-picker | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, mention-picker, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | mention-picker | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself, mention-picker | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | mention-picker | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, mention-picker, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | mention-picker | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.3 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [mention-picker](mention-picker.md) · Element it renders | 39.8 KB | – |
| **Added to a page that already has Lit** | **73.3 KB** | **21.3 KB** |
| With Lit – the first component on a page | 95.5 KB | 28.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 115 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of items replaced |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | items: first render, 750 nodes; update 3.2 ms |
| 1,000 items | 102 ms | items: first render, 6,921 nodes; update 21 ms |

1,000 items of items: 102 ms. It renders every item, so a first render passes 50 ms (a long task) at about 490 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (mention-picker).
- No timers.
- 3 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (mention-picker), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give people their full names and, where useful, a role ("Lead", "Reviewer").
- Set `replyTo` on the model's messages so everyone sees whose question it answers.
- Keep `present` and `typing` current from your realtime channel; put `"model"` in `typing` while it's answering.

## Do and don't

### Do

- Use `modelAnswers` from `tc-send` to decide whether to call the model.
- Add sent messages to `items` yourself – the thread shows what you pass.
- Hide the mode switch with `hide-mode` when your app decides when the model answers.

### Don't

- Don't let the model answer every message by default in a busy thread – it drowns out the people.
- Don't put the model's thinking or tool calls in the text; show them with `thinking-state` or `tool-call-card`.

## Related

- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Collaboration Stream](collaboration-stream.md) – What agents say to each other in a run, as a quiet chat – who to whom on every message, handoffs as slim rows, questions for you with an answer box, files that preview, details with tool calls, filter tabs and an @-composer
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
