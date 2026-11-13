<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Conversation Branches

**AI & chat** · New

Edit a past message and the conversation forks – a 2 / 3 switcher on the edited message, and each branch's replies below it

- **Element:** `<tc-conversation-branches>`
- **Size:** 21.5 KB gzip · 87.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/conversation-branches";` |
| React / Next.js | `import { ConversationBranches } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/conversation-branches";` · tags starting with tc- are custom elements |
| Angular | `import { ConversationBranches } from "@adamstavely/trenchcoat/angular/conversation-branches";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/conversation-branches";` |

## Example

The live example is in the gallery at `#/conversation-branches`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A chat thread where editing a past message forks the conversation instead of overwriting it. People edit one of
their own messages in place and send it; the new version becomes a branch next to the old one, and the replies
below follow the branch they're looking at. Every message with siblings carries a “‹ 2 / 3 ›” switcher, so going
back to an earlier answer is one click. The app answers each new branch with its replies, and “Writing a reply…”
shows until they arrive.

### When to use

- AI chats where people refine a request and want to compare the answers each version got.
- Any thread where an earlier answer shouldn't be lost when someone tries a different question.
- Showing regenerated replies as versions of one message, together with the user's edits.

### When not to use

- Only the controls under one reply – copy, feedback, regenerate – use [Message Actions](message-actions.md).
- Two models answering the same prompt side by side – use [Answer Arena](answer-arena.md).
- The list of a person's conversations – use [Chat History](chat-history.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Your message** `.ui-cvb__bubble` – one of your messages; Edit opens it in place
2. **Edit** `.ui-cvb__edit` – shows on hover or focus; turns the message into a field with Cancel and Send
3. **Switcher** `.ui-cvb__versions` – “‹ 2 / 3 ›” on every message with siblings
4. **Reply** `.ui-cvb__text` – the assistant's answer on the branch shown
5. **Reply actions** `.ui-cvb__actions` – the message-actions bar under each reply
6. **Caption** `.ui-cvb__caption` – how many messages and branches, and where you are

## Looks

Standard sets the thread on a white card in the gray tray, with the caption on the tray below it. Clean is one white
card with the caption as its last row, and draws the edit and arrow icons as 16 px glyphs. Both switch branches
and edit the same way.

## Usage

### HTML

```html
<tc-conversation-branches id="thread" label="Release note"></tc-conversation-branches>

<script type="module">
  import "@adamstavely/trenchcoat/conversation-branches";
  import "@adamstavely/trenchcoat/tokens.css";

  const thread = document.querySelector("#thread");
  thread.messages = [
    { id: "u1", role: "user", text: "Write the release note for v2.4." },
    { id: "a1", role: "assistant", parentId: "u1", text: "v2.4 makes search up to 3× faster…" },
  ];
  thread.addEventListener("tc-edit", (e) => {
    const reply = fetch("/api/reply", { method: "POST", body: e.detail.text }).then((r) => r.json());
    e.detail.respondWith(reply.then((r) => [{ id: r.id, role: "assistant", text: r.text }]));
  });
</script>
```

### React / Next.js

```tsx
import { ConversationBranches, type BranchMessage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: BranchMessage[] = [
  { id: "u1", role: "user", text: "Write the release note for v2.4." },
  { id: "a1", role: "assistant", parentId: "u1", text: "v2.4 makes search up to 3× faster…" },
];

export function Thread({ ask }: { ask: (text: string) => Promise<string> }) {
  return (
    <ConversationBranches
      defaultMessages={start}
      onEdit={({ message, text }) => ask(text).then((reply) => [{ id: `${message.id}-reply`, role: "assistant" as const, text: reply }])}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/conversation-branches";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";

defineProps<{ messages: TcConversationBranches["messages"]; selected: TcConversationBranches["selected"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-conversation-branches :messages="messages" :selected="selected" @tc-selected-change="onSelectedChange"></tc-conversation-branches>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ConversationBranches } from "@adamstavely/trenchcoat/angular/conversation-branches";
import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";

@Component({
  selector: "app-conversation-branches-example",
  imports: [ConversationBranches],
  template: `<tc-conversation-branches [messages]="messages()" [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-conversation-branches>`,
})
export class ConversationBranchesExample {
  readonly messages = input.required<TcConversationBranches["messages"]>();
  readonly selected = input.required<TcConversationBranches["selected"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/conversation-branches";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";

  let { messages, selected }: { messages: TcConversationBranches["messages"]; selected: TcConversationBranches["selected"] } = $props();
  let el: TcConversationBranches;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-conversation-branches bind:this={el} {messages} {selected}></tc-conversation-branches>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `messages` | – | `BranchMessage[]` | `[]` | Every message of every branch, in the order they were written; each names its parent |
| `selected` | – | `BranchSelection` | `{}` | The picked child per parent id ("" for the first messages); a parent without an entry shows its newest child |
| `editable` | `editable` | `boolean` | `true` | Your messages can be edited (default true; editable="false" turns it off) |
| `replyActions` | – | `MessageActionKey[]` | `["copy", "feedback"]` | The actions under each reply (message-actions' keys); an empty list hides the bar |
| `renderContent` | – | `((message: BranchMessage) => Node \| string) \| undefined` | `undefined` | Draws a message's content – a Node or a string. Default: the text, a paragraph per blank line |
| `label` | `label` | `string` | `"Conversation"` | Accessible name of the conversation |
| `userName` | `user-name` | `string` | `"You"` | Who "you" are, for screen readers |
| `assistantName` | `assistant-name` | `string` | `"Assistant"` | Who answers, for screen readers |
| `caption` | `caption` | `string \| undefined` | `undefined` | The caption line (Standard: on the tray, Clean: the card's last row); unset, it sums up the branches |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A branch was picked in a switcher, or a new branch was made; detail `{ selected, messageId, index, count }`. Cancelable: prevent it to control `selected` |
| `tc-messages-change` | – | Yes | Messages were added (a new branch, its replies); detail `{ messages: BranchMessage[] }`. Cancelable: prevent it to control `messages` |
| `tc-edit` | – | Yes | Send was pressed on an edited message; detail `{ messageId, text, message, respondWith }`. Cancelable: prevent it to drop the edit. Call `respondWith(replies \| promise)` to answer the new branch |

#### Design tokens it reads (66)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-radius-2xl`, `--tc-radius-lg`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-conversation-branches :messages="…">` | `<tc-conversation-branches [messages]="…">` | `<tc-conversation-branches {messages}>` |
| `selected` | `el.selected = …;` | `<… selected={…} />` | `<tc-conversation-branches :selected="…">` | `<tc-conversation-branches [selected]="…">` | `<tc-conversation-branches {selected}>` |
| `replyActions` | `el.replyActions = …;` | `<… replyActions={…} />` | `<tc-conversation-branches :replyActions="…">` | `<tc-conversation-branches [replyActions]="…">` | `<tc-conversation-branches {replyActions}>` |
| `renderContent` | `el.renderContent = …;` | `<… renderContent={…} />` | `<tc-conversation-branches :renderContent="…">` | `<tc-conversation-branches [renderContent]="…">` | `<tc-conversation-branches {renderContent}>` |

*Also attributes: `editable`, `label`, `user-name`, `assistant-name`, `caption` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-messages-change` | Yes | `el.addEventListener("tc-messages-change", (e) => …)` | `onMessagesChange={…}` | `@tc-messages-change="…"` | `(tc-messages-change)="…($event)"` | `el.addEventListener("tc-messages-change", …)` |
| `tc-edit` | Yes | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |

### Controlled

The element changes `messages` and `selected` itself unless a listener calls `preventDefault()` on `tc-messages-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-conversation-branches id="conversation-branches"></tc-conversation-branches>

<script type="module">
  import "@adamstavely/trenchcoat/conversation-branches";

  const el = document.querySelector("#conversation-branches");
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
import { ConversationBranches } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ConversationBranches>;
type Props = Omit<Own, "messages" | "onMessagesChange"> & { initial: NonNullable<Own["messages"]> };

// Controlled: passing messages makes the wrapper prevent the element's own change; the app sets it
export function ControlledConversationBranches({ initial, ...props }: Props) {
  const [messages, setMessages] = useState<Own["messages"]>(initial);
  return <ConversationBranches {...props} messages={messages} onMessagesChange={(next) => setMessages(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/conversation-branches";
import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";

const props = defineProps<{ initial: TcConversationBranches["messages"] }>();
const messages = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMessagesChange = (e: CustomEvent<{ messages: TcConversationBranches["messages"] }>) => {
  e.preventDefault();
  messages.value = e.detail.messages;
};
</script>

<template>
  <tc-conversation-branches :messages="messages" @tc-messages-change="onMessagesChange"></tc-conversation-branches>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ConversationBranches } from "@adamstavely/trenchcoat/angular/conversation-branches";
import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";

@Component({
  selector: "app-controlled-conversation-branches",
  imports: [ConversationBranches],
  template: `<tc-conversation-branches [messages]="messages()" (tc-messages-change)="onMessagesChange($event)"></tc-conversation-branches>`,
})
export class ControlledConversationBranches {
  readonly initial = input.required<TcConversationBranches["messages"]>();
  readonly messages = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMessagesChange(e: CustomEvent<{ messages: TcConversationBranches["messages"] }>) {
    e.preventDefault();
    this.messages.set(e.detail.messages);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/conversation-branches";
  import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";

  let { initial }: { initial: TcConversationBranches["messages"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let messages = $derived(initial);
  let el: TcConversationBranches;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      messages = (e as CustomEvent<{ messages: TcConversationBranches["messages"] }>).detail.messages;
    };
    el.addEventListener("tc-messages-change", on);
    return () => el.removeEventListener("tc-messages-change", on);
  });
</script>

<tc-conversation-branches bind:this={el} {messages}></tc-conversation-branches>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-conversation-branches")` returns a `TcConversationBranches` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";`
- **React / Next.js:** Props: `import type { ConversationBranchesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ConversationBranches>`. The element class, for refs: `import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConversationBranches["messages"]` with `import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";`
- **Angular:** The directive types the template: `[messages]` takes `TcConversationBranches["messages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConversationBranches } from "@adamstavely/trenchcoat/conversation-branches";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `messages` | `BranchMessage[]` | Every message of every branch. Controlled when defined; otherwise the element keeps them, starting at `defaultMessages` |
| `defaultMessages` | `BranchMessage[]` | The messages at first when uncontrolled |
| `onMessagesChange` | `(messages: BranchMessage[]) => void` | Called with the whole list when messages are added (a new branch, its replies) |
| `selected` | `BranchSelection` | The picked child per parent id ("" for the first messages). Controlled when defined |
| `defaultSelected` | `BranchSelection` | The picked branches at first when uncontrolled – unset shows the newest child at every fork |
| `onSelectedChange` | `(selected: BranchSelection, change: { messageId: string; index: number; count: number }) => void` | Called when a branch is picked, or a new branch was made |
| `onEdit` | `(edit: ConversationEdit) => BranchMessage[] \| Promise<BranchMessage[]> \| void \| false` | Called when an edited message is sent. Return the new branch's replies (or a promise of them) to answer it; return false to drop the edit |

*Renamed or hidden on the wrapper: `messages`, `selected`, `onChange`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between Edit, the switcher's arrows and each reply's actions |
| ← / → | On a switcher: the previous or next branch |
| Enter / Space | Presses the focused button – Edit opens the field with focus in it |
| Enter | In the field: sends the edit as a new branch |
| Shift Enter | In the field: a new line |
| Escape | In the field: cancels and returns focus to Edit |

When an arrow turns disabled at the first or last branch, focus moves to the other arrow.

### Screen readers

The host is a `region` named by `label` (“Conversation”). Each message is an `article` named “You” or “Assistant”
(`userName`, `assistantName`). A switcher is a group named “Edits of this message” or “Versions of this reply”; its
count reads “Branch 2 of 3” and its arrows are “Previous branch” and “Next branch”. The edit field is named “Edit your
message” and described by the note under it (“Sending starts branch 3 – the reply below stays in branch 2”). A polite
live region says what changed: “Branch 2 of 3 – 3 messages below”, “Branch 3 of 3 – your edit was sent”, “Reply
ready” and “Couldn't write a reply”.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, message-actions | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | message-actions, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, message-actions, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, message-actions, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | message-actions | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | message-actions | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | message-actions, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.9 KB | 7.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [message-actions](message-actions.md) · Element it renders | 52.6 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **87.2 KB** | **21.5 KB** |
| With Lit – the first component on a page | 108.9 KB | 28.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 140 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of messages replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.7 ms | messages: first render, 24 nodes; update 0.0 ms |
| 1,000 items | 0.4 ms | messages: first render, 24 nodes; update 0.2 ms |

1,000 items of messages: 0.4 ms, 24 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (message-actions).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (message-actions), `MutationObserver` (message-actions), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Leave `caption` unset unless you need your own words – the default sums up the thread (“4 messages · branch 2 of
  3”) and suggests editing when there are no forks yet.
- Keep `label` to what the conversation is: “Conversation”, or its title.
- When a reply fails, the thread says “Couldn't write a reply. Edit the message to try again.” – there is nothing
  else to write.

## Do and don't

### Do

- Answer `tc-edit` with `respondWith(promise)` (or return the promise from `onEdit`) so “Writing a reply…” shows
  while the reply is on its way.
- Keep every branch in `messages`; the element picks the path to show from `selected`.
- Pass `renderContent` when replies hold Markdown or code, so they render as they do elsewhere in your chat.

### Don't

- Don't delete the old branch when a new one is made – being able to go back is the point.
- Don't set `editable="false"` where people expect to refine their prompts – without Edit, branches only come
  from your data.
- Don't change `selected` behind people's backs – they lose their place in the thread.

## Related

- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Answer Arena](answer-arena.md) – Two models answer the same prompt side by side, streaming together – then A is better, B is better or a tie, with a reason
- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats

## Changelog

- `tc-conversation-branches` – edit a past message to fork the conversation; a 2 / 3 switcher on the edited message, each branch's replies (with `tc-message-actions`) below, and `tc-edit` answered with the new replies or a promise of them.
