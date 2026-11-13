<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Comment Thread

**AI & chat**

One comment with replies – an assistant reports what it did, folds open details and answers @mentions

- **Element:** `<tc-comment-thread>`
- **Size:** 11.9 KB gzip · 40.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/comment-thread";` |
| React / Next.js | `import { CommentThread } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/comment-thread";` · tags starting with tc- are custom elements |
| Angular | `import { CommentThread } from "@adamstavely/trenchcoat/angular/comment-thread";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/comment-thread";` |

## Example

The live example is in the gallery at `#/comment-thread`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One comment and its replies, pinned to a part of a document – with an assistant that can take part. People reply
from the field at the bottom; when the app hands back an answer, the assistant shows “Thinking…” and then posts it,
with a short status line (“Edited 3 cells in Pricing”) that folds open to list exactly what it changed. If the answer
fails, the thread says so and offers Try again. Times read as “12min ago” and keep up with the clock.

### When to use

- A comment anchored to a cell, paragraph or design element, where an assistant can be asked to act on it.
- Showing what an assistant changed in reply to a request, with the details one click away.
- A short exchange – a handful of replies – about one thing.

### When not to use

- Every comment on a document, with filters and resolve – use [Comments Panel](comments-panel.md).
- A conversation with the assistant that isn't about one spot – use [Chat Composer](chat-composer.md) and [AI Answer](ai-answer.md).
- Reviewing the assistant's edits word by word – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Message** `.ui-ct__msg` – avatar, name, time and text
3. **Status line** `.ui-ct__status-btn` – what the assistant did; folds open its details
4. **Reply field** `.ui-ct__composer` – the input and the send button; left out with `readonly`

## Looks

Standard is a gray tray: the header and the reply field sit on the tray and the messages in a white card between
them, with 24 px avatars. Clean is one white panel with hairline rules, 20 px avatars, thinner icons and a
shimmering “Thinking…”. Both fold details the same way and keep the card's height while the
conversation scrolls.

## Usage

### HTML

```html
<tc-comment-thread id="thread" heading="Pricing table" closable></tc-comment-thread>

<script type="module">
  import "@adamstavely/trenchcoat/comment-thread";
  import "@adamstavely/trenchcoat/tokens.css";

  const thread = document.querySelector("#thread");
  const assistant = { name: "Assistant", assistant: true };
  thread.currentUser = { name: "Jordan Lee" };
  thread.assistant = assistant;
  thread.messages = [
    { id: "m1", author: { name: "Maya Chen" }, createdAt: Date.now() - 600000, text: "@Assistant can you fix the totals?" },
  ];
  thread.onReply = async (text) => ({
    id: crypto.randomUUID(), author: assistant, createdAt: Date.now(),
    text: "Done – the totals are fixed.", status: "Edited 3 cells", details: ["Team: $288 → $259.20"],
  });
  thread.addEventListener("tc-messages-change", (e) => (thread.messages = e.detail.messages));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CommentThread, AssistantMark, type ThreadAuthor, type ThreadMessage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const assistant: ThreadAuthor = { name: "Assistant", assistant: true, avatar: <AssistantMark /> };
const you: ThreadAuthor = { name: "Jordan Lee" };

export function PricingComment({ initial }: { initial: ThreadMessage[] }) {
  const [messages, setMessages] = useState(initial);
  return (
    <CommentThread
      title="Pricing table"
      messages={messages}
      currentUser={you}
      assistant={assistant}
      onMessagesChange={setMessages}
      onReply={async () => ({
        id: crypto.randomUUID(),
        author: assistant,
        createdAt: Date.now(),
        text: "Done – the totals are fixed.",
        status: "Edited 3 cells",
        details: ["Team: $288 → $259.20"],
      })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/comment-thread";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";

defineProps<{ messages: TcCommentThread["messages"]; currentUser: TcCommentThread["currentUser"] }>();
const onMessagesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-comment-thread :messages="messages" :currentUser="currentUser" @tc-messages-change="onMessagesChange"></tc-comment-thread>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CommentThread } from "@adamstavely/trenchcoat/angular/comment-thread";
import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";

@Component({
  selector: "app-comment-thread-example",
  imports: [CommentThread],
  template: `<tc-comment-thread [messages]="messages()" [currentUser]="currentUser()" (tc-messages-change)="onMessagesChange($event)"></tc-comment-thread>`,
})
export class CommentThreadExample {
  readonly messages = input.required<TcCommentThread["messages"]>();
  readonly currentUser = input.required<TcCommentThread["currentUser"]>();
  onMessagesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/comment-thread";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";

  let { messages, currentUser }: { messages: TcCommentThread["messages"]; currentUser: TcCommentThread["currentUser"] } = $props();
  let el: TcCommentThread;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-messages-change", on);
    return () => el.removeEventListener("tc-messages-change", on);
  });
</script>

<tc-comment-thread bind:this={el} {messages} {currentUser}></tc-comment-thread>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Comment"` | The heading, and the region's name |
| `messages` | – | `ThreadMessage[]` | `[]` | The comment and its replies, oldest first – the source of truth, followed by id |
| `currentUser` | – | `ThreadAuthor` | `{ name: "You" }` | Who is replying here: the author of replies posted from the field |
| `assistant` | – | `ThreadAuthor \| undefined` | `undefined` | The assistant that answers – used for the thinking state |
| `onReply` | – | `((text: string) => ThreadReplyResult) \| undefined` | `undefined` | Called with every new reply. Return a message (or a promise of one) to let the assistant answer; return nothing to just post the reply. |
| `closable` | `closable` | `boolean` | `false` | Shows a close button, which fires tc-close |
| `readonly` | `readonly` | `boolean` | `false` | Hides the reply field: for people who may read the thread but not reply |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-messages-change` | – | Yes | A reply was posted here or the assistant answered; detail `{ messages: ThreadMessage[] }` is the whole thread. Cancelable: preventDefault() keeps the new message out until the app passes it back. |
| `tc-close` | – | No | The close button was pressed (shown with `closable`); detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-comment-thread-avatar-ring` | `light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1))` | both, clean |
| `--tc-comment-thread-step` | `60ms` | both |
| `--tc-comment-thread-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | clean |
| `--tc-comment-thread-min-height` | `0px` | not set – this fallback applies |
| `--tc-comment-thread-max-height` | `340px` | not set – this fallback applies |

#### Design tokens it reads (75)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-sm`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-comment-thread-d`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-badge`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-comment-thread :messages="…">` | `<tc-comment-thread [messages]="…">` | `<tc-comment-thread {messages}>` |
| `currentUser` | `el.currentUser = …;` | `<… currentUser={…} />` | `<tc-comment-thread :currentUser="…">` | `<tc-comment-thread [currentUser]="…">` | `<tc-comment-thread {currentUser}>` |
| `assistant` | `el.assistant = …;` | `<… assistant={…} />` | `<tc-comment-thread :assistant="…">` | `<tc-comment-thread [assistant]="…">` | `<tc-comment-thread {assistant}>` |
| `onReply` | `el.onReply = …;` | `<… onReply={…} />` | `<tc-comment-thread :onReply="…">` | `<tc-comment-thread [onReply]="…">` | `<tc-comment-thread {onReply}>` |

*Also attributes: `heading`, `closable`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-messages-change` | Yes | `el.addEventListener("tc-messages-change", (e) => …)` | `onMessagesChange={…}` | `@tc-messages-change="…"` | `(tc-messages-change)="…($event)"` | `el.addEventListener("tc-messages-change", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

### Controlled

The element changes `messages` itself unless a listener calls `preventDefault()` on `tc-messages-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-comment-thread id="comment-thread"></tc-comment-thread>

<script type="module">
  import "@adamstavely/trenchcoat/comment-thread";

  const el = document.querySelector("#comment-thread");
  el.addEventListener("tc-messages-change", (e) => {
    e.preventDefault(); // the element keeps its messages…
    if (allowed(e.detail.messages)) el.messages = e.detail.messages; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CommentThread } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CommentThread>;
type Props = Omit<Own, "messages" | "onMessagesChange"> & { initial: NonNullable<Own["messages"]> };

// Controlled: passing messages makes the wrapper prevent the element's own change; the app sets it
export function ControlledCommentThread({ initial, ...props }: Props) {
  const [messages, setMessages] = useState<Own["messages"]>(initial);
  return <CommentThread {...props} messages={messages} onMessagesChange={(next) => setMessages(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/comment-thread";
import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";

const props = defineProps<{ initial: TcCommentThread["messages"] }>();
const messages = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMessagesChange = (e: CustomEvent<{ messages: TcCommentThread["messages"] }>) => {
  e.preventDefault();
  messages.value = e.detail.messages;
};
</script>

<template>
  <tc-comment-thread :messages="messages" @tc-messages-change="onMessagesChange"></tc-comment-thread>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CommentThread } from "@adamstavely/trenchcoat/angular/comment-thread";
import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";

@Component({
  selector: "app-controlled-comment-thread",
  imports: [CommentThread],
  template: `<tc-comment-thread [messages]="messages()" (tc-messages-change)="onMessagesChange($event)"></tc-comment-thread>`,
})
export class ControlledCommentThread {
  readonly initial = input.required<TcCommentThread["messages"]>();
  readonly messages = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMessagesChange(e: CustomEvent<{ messages: TcCommentThread["messages"] }>) {
    e.preventDefault();
    this.messages.set(e.detail.messages);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/comment-thread";
  import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";

  let { initial }: { initial: TcCommentThread["messages"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let messages = $derived(initial);
  let el: TcCommentThread;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      messages = (e as CustomEvent<{ messages: TcCommentThread["messages"] }>).detail.messages;
    };
    el.addEventListener("tc-messages-change", on);
    return () => el.removeEventListener("tc-messages-change", on);
  });
</script>

<tc-comment-thread bind:this={el} {messages}></tc-comment-thread>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-comment-thread")` returns a `TcCommentThread` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";`
- **React / Next.js:** Props: `import type { CommentThreadProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CommentThread>`. The element class, for refs: `import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCommentThread["messages"]` with `import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";`
- **Angular:** The directive types the template: `[messages]` takes `TcCommentThread["messages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCommentThread } from "@adamstavely/trenchcoat/comment-thread";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name (default "Comment") |
| `messages` | `ThreadMessage[]` | The comment and its replies, oldest first – the source of truth, followed by id |
| `currentUser` | `ThreadAuthor` | Who is replying here: the author of replies posted from the field |
| `assistant` | `ThreadAuthor` | The assistant that answers – used for the thinking state |
| `onReply` | `(text: string) => ThreadMessage \| Promise<ThreadMessage \| void> \| void` | Called with every new reply. Return a message (or a promise of one) to let the assistant answer; return nothing to just post the reply. |
| `onMessagesChange` | `(messages: ThreadMessage[]) => void` | The whole thread after a reply was posted here, or the assistant answered – store it and pass it back |
| `onClose` | `() => void` | Shows a close button and runs when it's pressed |

*Renamed or hidden on the wrapper: `heading`, `messages`, `currentUser`, `assistant`, `onReply`, `closable`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter | In the reply field: sends the reply (not while an IME is composing or the assistant is thinking) |
| Enter / Space | On a status line: folds its details open or closed |
| Tab | Moves through the message list (scrollable with the arrow keys), status lines, the reply field, Send and Close |

### Screen readers

The thread is a `region` named by `heading` (unless the page names it); the messages sit in a focusable region
“Messages”. Status lines are buttons with `aria-expanded`, disabled when there are no details. The input is named
“Reply”, the buttons “Send reply” and “Close comment”; avatars are hidden. While the assistant works, its placeholder
message is named “Assistant is thinking”. The conversation itself isn't live: a polite status region reads each new
message from someone else once, as the name, the text and the status line (“Assistant: Done – I updated the
discount… Edited 3 cells in Pricing”), and a failure as
“Assistant couldn't answer.” (or “Couldn't post the reply.” with no assistant).

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
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 30.8 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **40.2 KB** | **11.9 KB** |
| With Lit – the first component on a page | 60.8 KB | 18.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 59 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of messages replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 15 ms | messages: first render, 1,281 nodes; update 2.5 ms |
| 1,000 items | 117 ms | messages: first render, 12,681 nodes; update 18 ms |

1,000 items of messages: 117 ms. It renders every item, so a first render passes 50 ms (a long task) at about 430 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Make `heading` the thing commented on: “Pricing table”, not “Comment”.
- Write the assistant's `status` as a past-tense count of what changed: “Edited 3 cells in Pricing”.
- Make each detail one change, before → after: “Starter: $96 → $86.40 / yr”.
- Keep the assistant's reply to a sentence or two; the details carry the rest.
- A reply starting with `/edit` shows the command as a chip – use it for instructions to the assistant.

## Do and don't

### Do

- Set `assistant` so the field invites people to ask it (“Reply, or ask @Assistant…”) and the thinking state shows.
- Return a promise from `onReply` and reject it when the assistant fails, so people get Try again.
- Store the list from `tc-messages-change` and pass it back – ids keep replies from doubling.
- Set `readonly` for people who may read the thread but not reply – the reply field goes away.

### Don't

- Don't let a thread run to dozens of replies – move the discussion to `comments-panel` or a chat.
- Don't put long logs in `details`; link to them instead.
- Don't use relative times you work out yourself – pass `createdAt` and let the thread keep them current.

## Related

- [Comments Panel](comments-panel.md) – Comment feed with filters, runnable /edit commands, resolve and a composer
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
