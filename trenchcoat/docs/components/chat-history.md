<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Chat History

**AI & chat** · New

Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats

- **Element:** `<tc-chat-history>`
- **Size:** 16.2 KB gzip · 57.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/chat-history";` |
| React / Next.js | `import { ChatHistory } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/chat-history";` · tags starting with tc- are custom elements |
| Angular | `import { ChatHistory } from "@adamstavely/trenchcoat/angular/chat-history";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/chat-history";` |

## Example

The live example is in the gallery at `#/chat-history`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The list of someone's conversations, for finding one and going back to it. Chats are grouped under Pinned, then the
folders, then Today, Yesterday, Previous 7 days, Previous 30 days and one group per month. People search by title,
pin, rename in place, move a chat to a folder or delete it – with Undo below the list for a few seconds. It stays
smooth with thousands of chats: long lists render only the rows near the viewport.

An earlier session's structured summary – its findings, open questions and next steps – can be loaded into the
current chat as context. Loading is always the person's choice, from the chat's menu, never automatic; the “In
context” section under the list then shows exactly which items are active, grouped by the chat they came from, each
with Remove. The element only reports the change; the app decides what it actually sends with the next message.

### When to use

- The sidebar of a chat or assistant product, listing past conversations.
- Any list of sessions or threads that people revisit by recency and want to organise themselves.
- Carrying what an earlier session established into a new one, where people need to see and trim what the model is
  given.

### When not to use

- Switching between versions of one conversation after an edit – use [Conversation Branches](conversation-branches.md).
- A library of saved prompts to reuse – use [Prompt Library](prompt-library.md).
- Filtering a table or a long list by several facets – use [Filter Menu](filter-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Search** `.ui-chh__search` – filters by title and marks the match
3. **Group** `.ui-chh__head-row` – a date, a folder or Pinned, with its count; folds and opens
4. **Chat** `.ui-chh__item` – one conversation; the open one is highlighted, Pin and More show on hover
5. **In context** `.ui-chh__ctx` – the summary items loaded from earlier chats, each with Remove
6. **Footer** `.ui-chh__foot` – the keyboard hints, or Undo after a delete

## Looks

Standard puts the heading and the keyboard hints on the gray tray, and the search and list on a white card. Clean is
one white card with the header, list and footer inside it, thinner icons and hints written out (“to move”, “to
rename”). Both use the same rows, menu and keys, and the same In context section under the list: each chat's items on a quiet fill with an accent rule.

## Usage

### HTML

```html
<tc-chat-history id="chats" value="c2"></tc-chat-history>

<script type="module">
  import "@adamstavely/trenchcoat/chat-history";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#chats");
  list.folders = [{ id: "work", label: "Work" }];
  list.conversations = [
    { id: "c1", title: "Q3 roadmap", updatedAt: Date.now(), pinned: true },
    { id: "c2", title: "Pricing page copy", updatedAt: Date.now() - 86_400_000, folder: "work" },
    { id: "c3", title: "Trip to Lisbon", updatedAt: "2026-09-02T10:00:00Z" },
  ];
  list.addEventListener("tc-value-change", (e) => console.log("open", e.detail.value));

  // A chat with a structured summary can be loaded as context; the app sends what's in e.detail.context
  list.conversations[0].summary = [
    { id: "s1", kind: "Finding", text: "Launch moves to 12 November" },
    { id: "s2", kind: "Next step", text: "Tell support before the 5th" },
  ];
  list.conversations = [...list.conversations];
  let pendingContext = [];
  list.addEventListener("tc-context-change", (e) => (pendingContext = e.detail.context));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ChatHistory, type ChatContextItem, type ChatConversation } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: ChatConversation[] = [
  {
    id: "c1",
    title: "Q3 roadmap",
    updatedAt: "2026-10-26T09:00:00Z",
    pinned: true,
    summary: [{ id: "s1", kind: "Finding", text: "Launch moves to 12 November" }],
  },
  { id: "c2", title: "Pricing page copy", updatedAt: "2026-10-25T16:30:00Z", folder: "work" },
];

export function Sidebar() {
  const [chats, setChats] = useState(start);
  const [open, setOpen] = useState<string | null>("c2");
  // What the next message carries – the app sends this, nothing else
  const [context, setContext] = useState<ChatContextItem[]>([]);
  return (
    <ChatHistory
      conversations={chats}
      onConversationsChange={setChats}
      folders={[{ id: "work", label: "Work" }]}
      value={open}
      onChange={setOpen}
      onNewChat={() => setOpen(null)}
      context={context}
      onContextChange={setContext}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/chat-history";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";

defineProps<{ conversations: TcChatHistory["conversations"]; folders: TcChatHistory["folders"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-chat-history :conversations="conversations" :folders="folders" @tc-value-change="onValueChange"></tc-chat-history>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChatHistory } from "@adamstavely/trenchcoat/angular/chat-history";
import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";

@Component({
  selector: "app-chat-history-example",
  imports: [ChatHistory],
  template: `<tc-chat-history [conversations]="conversations()" [folders]="folders()" (tc-value-change)="onValueChange($event)"></tc-chat-history>`,
})
export class ChatHistoryExample {
  readonly conversations = input.required<TcChatHistory["conversations"]>();
  readonly folders = input.required<TcChatHistory["folders"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chat-history";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";

  let { conversations, folders }: { conversations: TcChatHistory["conversations"]; folders: TcChatHistory["folders"] } = $props();
  let el: TcChatHistory;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-chat-history bind:this={el} {conversations} {folders}></tc-chat-history>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `conversations` | – | `ChatConversation[]` | `[]` | Every conversation |
| `folders` | – | `ChatFolder[]` | `[]` | Folders, in the order they show; chats name theirs with `folder` |
| `value` | `value` | `string \| null` | `null` | The open chat's id |
| `now` | – | `number \| Date \| undefined` | `undefined` | "Now" for the date groups (epoch ms or a Date). Unset: the time the element was connected |
| `heading` | `heading` | `string` | `"Chats"` | The heading, and the tree's name |
| `maxHeight` | `max-height` | `number` | `420` | Height of the list before it scrolls, in px |
| `undoFor` | `undo-for` | `number` | `6000` | How long Undo stays after a delete, in ms. It waits while the pointer or focus is on it and starts over after; `Infinity` keeps it until the next delete (WCAG 2.2.1) |
| `hints` | `hints` | `boolean` | `true` | Show the keyboard hints (hints="false" hides them) |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for the month names; unset uses the page's |
| `context` | – | `ChatContextItem[]` | `[]` | What's loaded into the current chat as context – summary items from earlier chats. The app decides what's sent |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A chat was opened (click, Enter); detail `{ value: string \| null }`. Cancelable: prevent it to control `value` |
| `tc-conversations-change` | – | Yes | The list changed (renamed, pinned, moved, deleted, restored); detail `{ conversations }`. Cancelable: prevent it to control `conversations` |
| `tc-rename` | – | No | A chat was renamed; detail `{ id, title }` |
| `tc-pin` | – | No | A chat was pinned or unpinned; detail `{ id, pinned }` |
| `tc-move` | – | No | A chat was moved to a folder, or out of one (`folder: null`); detail `{ id, folder }` |
| `tc-delete` | – | No | A chat was deleted (Undo may still bring it back); detail `{ id, conversation }` |
| `tc-restore` | – | No | Undo brought a deleted chat back; detail `{ id, conversation }` |
| `tc-new-chat` | – | No | New chat was pressed; detail: null |
| `tc-context-change` | – | Yes | A chat's summary was loaded as context, or items were removed; detail `{ context, action, chat, items }`: ChatContextChange. Cancelable: prevent it to control `context` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-chat-history-max` | `420px` | not set – this fallback applies |

#### Design tokens it reads (110)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `conversations` | `el.conversations = …;` | `<… conversations={…} />` | `<tc-chat-history :conversations="…">` | `<tc-chat-history [conversations]="…">` | `<tc-chat-history {conversations}>` |
| `folders` | `el.folders = …;` | `<… folders={…} />` | `<tc-chat-history :folders="…">` | `<tc-chat-history [folders]="…">` | `<tc-chat-history {folders}>` |
| `now` | `el.now = …;` | `<… now={…} />` | `<tc-chat-history :now="…">` | `<tc-chat-history [now]="…">` | `<tc-chat-history {now}>` |
| `context` | `el.context = …;` | `<… context={…} />` | `<tc-chat-history :context="…">` | `<tc-chat-history [context]="…">` | `<tc-chat-history {context}>` |

*Also attributes: `value`, `heading`, `max-height`, `undo-for`, `hints`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-conversations-change` | Yes | `el.addEventListener("tc-conversations-change", (e) => …)` | `onConversationsChange={…}` | `@tc-conversations-change="…"` | `(tc-conversations-change)="…($event)"` | `el.addEventListener("tc-conversations-change", …)` |
| `tc-rename` | No | `el.addEventListener("tc-rename", (e) => …)` | `onRename={…}` | `@tc-rename="…"` | `(tc-rename)="…($event)"` | `el.addEventListener("tc-rename", …)` |
| `tc-pin` | No | `el.addEventListener("tc-pin", (e) => …)` | `onPin={…}` | `@tc-pin="…"` | `(tc-pin)="…($event)"` | `el.addEventListener("tc-pin", …)` |
| `tc-move` | No | `el.addEventListener("tc-move", (e) => …)` | `onMove={…}` | `@tc-move="…"` | `(tc-move)="…($event)"` | `el.addEventListener("tc-move", …)` |
| `tc-delete` | No | `el.addEventListener("tc-delete", (e) => …)` | `onDelete={…}` | `@tc-delete="…"` | `(tc-delete)="…($event)"` | `el.addEventListener("tc-delete", …)` |
| `tc-restore` | No | `el.addEventListener("tc-restore", (e) => …)` | `onRestore={…}` | `@tc-restore="…"` | `(tc-restore)="…($event)"` | `el.addEventListener("tc-restore", …)` |
| `tc-new-chat` | No | `el.addEventListener("tc-new-chat", (e) => …)` | `onNewChat={…}` | `@tc-new-chat="…"` | `(tc-new-chat)="…($event)"` | `el.addEventListener("tc-new-chat", …)` |
| `tc-context-change` | Yes | `el.addEventListener("tc-context-change", (e) => …)` | `onContextChange={…}` | `@tc-context-change="…"` | `(tc-context-change)="…($event)"` | `el.addEventListener("tc-context-change", …)` |

### Controlled

The element changes `conversations`, `value` and `context` itself unless a listener calls `preventDefault()` on `tc-conversations-change`, `tc-value-change` or `tc-context-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-chat-history id="chat-history"></tc-chat-history>

<script type="module">
  import "@adamstavely/trenchcoat/chat-history";

  const el = document.querySelector("#chat-history");
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
import { ChatHistory } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ChatHistory>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledChatHistory({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ChatHistory {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/chat-history";
import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";

const props = defineProps<{ initial: TcChatHistory["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcChatHistory["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-chat-history :value="value" @tc-value-change="onValueChange"></tc-chat-history>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChatHistory } from "@adamstavely/trenchcoat/angular/chat-history";
import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";

@Component({
  selector: "app-controlled-chat-history",
  imports: [ChatHistory],
  template: `<tc-chat-history [value]="value()" (tc-value-change)="onValueChange($event)"></tc-chat-history>`,
})
export class ControlledChatHistory {
  readonly initial = input.required<TcChatHistory["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcChatHistory["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chat-history";
  import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";

  let { initial }: { initial: TcChatHistory["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcChatHistory;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcChatHistory["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-chat-history bind:this={el} {value}></tc-chat-history>
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
<tc-chat-history :value="value" @tc-value-change="value = $event.detail.value"></tc-chat-history>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-chat-history [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-chat-history>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-chat-history bind:this={el} {value}></tc-chat-history>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-chat-history")` returns a `TcChatHistory` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";`
- **React / Next.js:** Props: `import type { ChatHistoryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChatHistory>`. The element class, for refs: `import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChatHistory["conversations"]` with `import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";`
- **Angular:** The directive types the template: `[conversations]` takes `TcChatHistory["conversations"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChatHistory } from "@adamstavely/trenchcoat/chat-history";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `conversations` | `ChatConversation[]` | Every conversation. Controlled when defined; otherwise the list keeps them, starting at `defaultConversations` |
| `defaultConversations` | `ChatConversation[]` | The starting list when `conversations` is not controlled |
| `onConversationsChange` | `(conversations: ChatConversation[]) => void` | Called with the whole list after any change (rename, pin, move, delete, Undo) |
| `value` | `string \| null` | The open chat's id. Controlled when defined (null for none) |
| `defaultValue` | `string \| null` | The chat open at first, when `value` is not controlled |
| `onChange` | `(value: string \| null) => void` | Called with the id of the chat that was opened |
| `title` | `string` | The heading above the list, and the tree's name (default "Chats") |
| `onRename` | `(id: string, title: string) => void` | Called when a chat is renamed in place, with its new title |
| `onPin` | `(id: string, pinned: boolean) => void` | Called when a chat is pinned or unpinned |
| `onMove` | `(id: string, folder: string \| null) => void` | Called when a chat is moved to a folder, or out of one (null) |
| `onDelete` | `(id: string, conversation: ChatConversation) => void` | Called when a chat is deleted – Undo may still bring it back (onRestore) |
| `onRestore` | `(id: string, conversation: ChatConversation) => void` | Called when Undo brings a deleted chat back |
| `onNewChat` | `() => void` | Called when New chat is pressed |
| `context` | `ChatContextItem[]` | What's loaded as context now. Controlled when defined; otherwise the list keeps it, starting at `defaultContext` |
| `defaultContext` | `ChatContextItem[]` | The starting context when `context` is not controlled |
| `onContextChange` | `(context: ChatContextItem[], change: ChatContextChange) => void` | Called when a chat's summary is loaded as context or items are removed – send what's in `context` with the next message |

*Renamed or hidden on the wrapper: `conversations`, `value`, `defaultValue`, `heading`, `onChange`, `context`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous row; ↓ in the search field moves to the first chat |
| Home / End | Moves to the first or last row |
| → | On a folded group: opens it; on an open group: moves to its first chat |
| ← | On a chat: moves to its group; on an open group: folds it |
| Enter / Space | Opens the chat, or folds and opens the group |
| F2 | Renames the chat in place – Enter saves, Escape cancels |
| Delete / Backspace | Deletes the chat; Undo appears below the list |
| Shift+F10 / Context menu | Opens the chat's actions: Rename, Pin, Load as context (or Remove from context) for a chat with a summary, Move to a folder, Delete |
| Tab (in context) | Moves through the Remove buttons; removing one moves focus to the next, and the last back to the list |
| ↓ / ↑, Home / End (in the menu) | Moves through the actions |
| Escape / Tab (in the menu) | Closes the menu and goes back to the chat |
| A letter | Jumps to the next row whose title starts with what was typed |
| Escape (in the search field) | Clears the search |

### Screen readers

The list is a tree named by the heading (“Chats”); the search field is a searchbox labelled “Search chats”. Groups
are expandable tree items named with their count (“Today, 4 chats”, or “Today, 1 of 4 chats” while searching), and
chats are tree items named by their title with `aria-selected` on the open one. Each row carries its level,
position and set size, so the count stays right while long lists render only part of the rows. The actions menu
is labelled “Actions for “…””, with the folders as a group of radio items, “Move to folder”. A status region
announces each change: “Pinned “Q3 roadmap””, “Renamed to “…””, “Moved “…” to Work”, “Deleted “…”. Undo is below
the list”, “Restored “…””, and the result of a search (“3 chats match”, “No chats match”).

The In context section is named by its heading (“In context” and the count). Each chat's items are a list named
“From “…””, and every Remove button says what it removes: “Remove “Send the SSO timeline” from context”, or the whole
chat. A chat that's loaded reads “…, loaded as context” in the tree. Loading and removing are announced: “Loaded 3
items from “Summarize the Acme call” as context”, “Removed “…” from context”.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 47.5 KB | 13.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **57.5 KB** | **16.3 KB** |
| With Lit – the first component on a page | 80.2 KB | 23.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 378 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of conversations replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 8.7 ms | conversations: first render, 611 nodes; update 4.7 ms |

Windowed: 10,000 items of conversations render 611 nodes in 8.7 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document pointerdown`, `window resize`, `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `Date.now()`, `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the chat's own title – short and specific, as people would search for it. Generate one from the first
  message rather than showing “New chat” for every row.
- Name folders with nouns people already use: “Work”, “Recipes”, a project name.
- Keep `title` short – it names the tree for screen readers too. “Chats” is the default.
- Keep summary items short and discrete – one finding, question or step each – and give each a `kind` people
  recognise (“Finding”, “Open question”, “Next step”). A free-form paragraph can't be trimmed item by item.
- The empty states are written for you: “No chats yet” and “No chats match “…””.

## Do and don't

### Do

- Pass `now` when the server and the browser may disagree about the date, so the groups match what people expect.
- Keep `hints` on where people are new to the list – the footer teaches F2 and Shift+F10.
- Use the granular events (`tc-rename`, `tc-delete`, `tc-restore` …) to call your API per action.
- Send exactly what's in `context` with the next message, and nothing the person has removed. Prevent
  `tc-context-change` when your app has to check a load first (access, size), then pass `context` back.

### Don't

- Don't delete for good on `tc-delete` alone – wait until Undo has gone, or restore on `tc-restore`.
- Don't set `undo-for` shorter than the default 6 seconds; use `Infinity` where people need more time.
- Don't put conversations from different products or accounts in one list.
- Don't load summaries into context on your own – the point is that people choose, and see, what's active.

## Related

- [Conversation Branches](conversation-branches.md) – Edit a past message and the conversation forks – a 2 / 3 switcher on the edited message, and each branch's replies below it
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control

## Changelog

- `tc-chat-history` – conversations grouped by Pinned, folders, Today … month: search, rename in place (F2), pin, move, delete with undo, a context menu; the WAI-ARIA tree pattern, windowed (10,000 chats render under 120 rows).
