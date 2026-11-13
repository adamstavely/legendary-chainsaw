<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# AI Side Pane

**Blocks** · New

An assistant docked beside a page with a chat about what's on it – resizable, collapses to a rail, opens with ⌘. and becomes a sheet on narrow screens; model, settings, prompts and page context in the composer (uses `chat-composer`, `ai-answer`, `claim-answer`, `message-actions`, `prompt-starters`, `chat-history`, `reflection-gate`, `button`)

- **Element:** `<tc-ai-side-pane>`
- **Size:** 163.1 KB gzip · 687.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-side-pane";` |
| React / Next.js | `import { AiSidePane } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-side-pane";` · tags starting with tc- are custom elements |
| Angular | `import { AiSidePane } from "@adamstavely/trenchcoat/angular/ai-side-pane";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-side-pane";` |

## Example

The live example is in the gallery at `#/blocks/ai-side-pane`, in both looks; Replay restarts its animations.

## Overview

An assistant docked beside a page, holding a conversation about what's on it. The element's children are the page;
the pane sits beside them with a header (title, the open conversation, New chat, History, Collapse, Close), the
conversation and the chat composer with its toolbar – model, settings, prompts and the page-context chip. Answers are
`ai-answer`, or `claim-answer` when they come as claims, each with one row of message actions; answers the app marks
high-stakes get a `reflection-gate`. Before the first message, `prompt-starters` offer suggestions from the page.
Drag the pane's edge to resize it, collapse it to a narrow rail, or close it to a floating "Ask AI" button; below its
breakpoint it becomes a sheet over the page.

### When to use

- An assistant that works on what the person is looking at: a report, a document, a record, a dashboard.
- Products where the assistant should stay beside the work instead of replacing it.

### When not to use

- A whole assistant app with its own sidebar and projects – use the [Chat Composer](../components/chat-composer.md) in a full-page layout.
- A single answer on a page, with no conversation – use [AI Answer](../components/ai-answer.md) or [Claim Answer](../components/claim-answer.md).
- A list of past chats on its own – use [Chat History](../components/chat-history.md).

## Anatomy

2. **Edge** `.ui-sp__handle` – drag it or use the arrow keys to resize the pane
3. **Pane** `.ui-sp__pane` – the header, the conversation and the composer; a sheet below the breakpoint
4. **Message** `.ui-sp__msg` – the person's bubble, or an answer with its actions, gate or error
5. **History** `.ui-sp__history` – past conversations, in place of the conversation
6. **Composer** `.ui-sp__composer` – the chat composer with its toolbar and the disclaimer
7. **Rail** `.ui-sp__rail` – the collapsed pane: Expand and New chat
8. **Launcher** `.ui-sp__launcher` – "Ask AI" while the pane is closed

## Looks

Standard puts the header on the gray tray with the conversation and composer on a white card, and a hairline between
page and pane. Clean is one white surface: the header is its first row, with a hairline from the page. Every part
inside – answers, gate, history, composer – takes the same look.

## Usage

### HTML

```html
<tc-ai-side-pane id="assistant" heading="Assistant" style="height: 640px">
  <article>… the report …</article>
</tc-ai-side-pane>

<script type="module">
  import "@adamstavely/trenchcoat/ai-side-pane";
  import "@adamstavely/trenchcoat/tokens.css";

  const pane = document.querySelector("#assistant");
  pane.pageContext = { title: "Q3 report", connected: true, count: 4 };
  pane.messages = [];
  pane.addEventListener("tc-send", (e) => {
    pane.messages = [...pane.messages, { id: crypto.randomUUID(), role: "user", text: e.detail.message }];
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AiSidePane, type SidePaneMessage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Report() {
  const [messages, setMessages] = useState<SidePaneMessage[]>([]);
  return (
    <AiSidePane
      title="Assistant"
      messages={messages}
      onSend={(text) => setMessages((list) => [...list, { id: String(list.length), role: "user", text }])}
    >
      <article>The report</article>
    </AiSidePane>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-side-pane";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";

defineProps<{ messages: TcAiSidePane["messages"]; starters: TcAiSidePane["starters"] }>();
const onSend = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-side-pane :messages="messages" :starters="starters" @tc-send="onSend"></tc-ai-side-pane>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiSidePane } from "@adamstavely/trenchcoat/angular/ai-side-pane";
import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";

@Component({
  selector: "app-ai-side-pane-example",
  imports: [AiSidePane],
  template: `<tc-ai-side-pane [messages]="messages()" [starters]="starters()" (tc-send)="onSend($event)"></tc-ai-side-pane>`,
})
export class AiSidePaneExample {
  readonly messages = input.required<TcAiSidePane["messages"]>();
  readonly starters = input.required<TcAiSidePane["starters"]>();
  onSend(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-side-pane";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";

  let { messages, starters }: { messages: TcAiSidePane["messages"]; starters: TcAiSidePane["starters"] } = $props();
  let el: TcAiSidePane;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-send", on);
    return () => el.removeEventListener("tc-send", on);
  });
</script>

<tc-ai-side-pane bind:this={el} {messages} {starters}></tc-ai-side-pane>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Assistant"` | The pane's title, its landmark's and dialog's name |
| `messages` | – | `SidePaneMessage[]` | `[]` | The conversation, oldest first. The app owns it |
| `reflectionSkippable` | `reflection-skippable` | `boolean` | `false` | Lets people skip the reflection gate |
| `starters` | – | `PromptStarter[]` | `[]` | Suggestions before the first message – derive them from what's on the page |
| `startersTitle` | `starters-title` | `string \| undefined` | `undefined` | The heading over the suggestions – unset reads "From &lt;page>" or "Suggestions" |
| `conversations` | – | `ChatConversation[] \| undefined` | `undefined` | Past conversations for the History panel – unset hides History |
| `conversation` | – | `string \| null` | `null` | The open conversation's id |
| `pageContext` | – | `ChatPageContext \| undefined` | `undefined` | What's on the page – the composer's page-context chip; unset shows no chip |
| `disclaimer` | `disclaimer` | `string` | `"AI can make mistakes. Check important info."` | The line under the composer; "" hides it |
| `placeholder` | `placeholder` | `string` | `"Ask about this page…"` | The composer's placeholder |
| `models` | – | `ChatModel[] \| undefined` | `undefined` | The models in the toolbar's menu – the composer's defaults when unset |
| `model` | `model` | `string` | `""` | The picked model's id – the first model when empty |
| `settings` | – | `ModelSettingsValue \| undefined` | `undefined` | The model settings in the toolbar's settings popover |
| `settingsModel` | – | `ModelSettingsModel \| undefined` | `undefined` | Which settings the model supports – the settings button shows only with it |
| `prompts` | – | `PromptTemplate[] \| undefined` | `undefined` | Templates for the toolbar's prompt library – the prompts button shows only with them |
| `selectProject` | `select-project` | `boolean` | `false` | Shows "Select a project" in the composer's menu (it fires tc-select-project) |
| `onConnectApps` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Shows "Connect apps"; may return a promise the composer waits for |
| `onRequestApproval` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Shows "Request approval"; may return a promise the composer waits for |
| `onDictate` | – | `HTMLElementTagNameMap["tc-chat-composer"]["onDictate"]` | `undefined` | Dictation – see the chat composer |
| `demo` | `demo` | `boolean` | `false` | The composer's demo mode: dictation and approval are simulated |
| `onSend` | – | `((message: string, details: { model: string; pageContext?: ChatPageContext }) => void \| Promise<unknown>) \| undefined` | `undefined` | Called with each sent message; return a promise to keep the text in the composer until it settles |
| `onRegenerate` | – | `((id: string) => void \| Promise<unknown>) \| undefined` | `undefined` | Called by Regenerate and Try again; return a promise to show the regenerating state until it settles |
| `open` | `open` | `boolean` | `true` | Open |
| `collapsed` | `collapsed` | `boolean` | `false` | Collapsed to the rail |
| `width` | `width` | `number` | `400` | The docked width in px |
| `defaultWidth` | `default-width` | `number` | `400` | The width Enter and a double-click on the edge go back to, in px |
| `minWidth` | `min-width` | `number` | `320` | The narrowest the pane can be dragged, in px |
| `maxWidth` | `max-width` | `number` | `640` | The widest the pane can be dragged, in px |
| `shortcut` | `shortcut` | `string` | `"mod+."` | Opens the pane (or moves focus into it; pressed inside, closes it). "mod" is ⌘ on a Mac and Ctrl elsewhere; "" turns it off |
| `breakpoint` | `breakpoint` | `number` | `720` | Below this width of the element, in px, the pane is an overlay sheet instead of docked |
| `side` | `side` | `"left" \| "right"` | `"right"` | Which side it docks on |
| `launcher` | `launcher` | `boolean` | `true` | A floating "Ask AI" button while the pane is closed – false if your page has its own |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-send` | – | No | A message was sent – append it and the answer to `messages` ({ message, model, pageContext }: SidePaneSend); `onSend` may return a promise to keep the text in the composer until it settles |
| `tc-stop` | – | No | Stop was pressed while an answer was streaming ({ id }: SidePaneMessageRef) |
| `tc-regenerate` | – | No | Regenerate, or Try again after an error ({ id }: SidePaneMessageRef); `onRegenerate` may return a promise |
| `tc-feedback` | – | No | A thumb up or down on an answer, or cleared ({ id, value, reason }: SidePaneFeedback) |
| `tc-verify` | – | No | A claim was sent to verification ({ id, claim, sources }: SidePaneVerify) |
| `tc-reflect` | – | Yes | The reflection gate on a high-stakes answer was submitted, or skipped with `submission: null` ({ id, submission }: SidePaneReflect); cancelable – prevented, the gate stays open |
| `tc-new-chat` | – | No | New chat was pressed – start an empty conversation; detail: null |
| `tc-conversation-change` | – | Yes | A conversation was picked in History – load its messages ({ conversation }: SidePaneConversationChange); cancelable – prevented, `conversation` stays (History still closes) |
| `tc-conversations-change` | – | Yes | History's list changed: a rename, pin, move or delete ({ conversations }: SidePaneConversationsChange); cancelable – prevented, `conversations` stays |
| `tc-model-change` | – | Yes | A model was picked in the toolbar ({ model, choice }: SidePaneModelChange); cancelable – prevented, `model` stays |
| `tc-settings-change` | – | Yes | The model settings changed ({ settings, changed }: SidePaneSettingsChange); cancelable – prevented, `settings` stays |
| `tc-page-context-change` | – | Yes | The page-context chip was toggled, or an attached item removed ({ pageContext, change }: SidePanePageContextChange); cancelable – prevented, `pageContext` stays |
| `tc-open-change` | – | Yes | The pane was opened or closed ({ open }: SidePaneOpenChange); cancelable – prevented, `open` stays |
| `tc-collapsed-change` | – | Yes | The pane was collapsed to the rail or expanded ({ collapsed }: SidePaneCollapsedChange); cancelable – prevented, `collapsed` stays |
| `tc-width-change` | – | Yes | The pane was resized – once a drag ends, and on every arrow-key step ({ width }: SidePaneWidthChange); cancelable – prevented, `width` stays |

#### Slots

| Slot | Description |
| --- | --- |
| `(default)` | The host page – the pane docks beside it |

#### Design tokens it reads (63)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-emphasized`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-xs`, `--tc-hairline`, `--tc-head-glyph`, `--tc-head-icon-bg`, `--tc-head-icon-fg`, `--tc-head-icon-radius`, `--tc-head-icon-shadow`, `--tc-head-icon-size`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xl`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-border`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-z-drawer`, `--tc-z-drawer-scrim`, `--tc-z-sticky`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseShortcut(s: string \| null \| undefined): PaneShortcut \| null` | "mod+.", "mod+shift+k", "alt+a", "mod++" – mod is ⌘ on a Mac and Ctrl elsewhere |
| `describeShortcut(s: PaneShortcut \| null, mac: boolean): void` | How the shortcut reads, and its aria-keyshortcuts value |

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
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-ai-side-pane :messages="…">` | `<tc-ai-side-pane [messages]="…">` | `<tc-ai-side-pane {messages}>` |
| `starters` | `el.starters = …;` | `<… starters={…} />` | `<tc-ai-side-pane :starters="…">` | `<tc-ai-side-pane [starters]="…">` | `<tc-ai-side-pane {starters}>` |
| `conversations` | `el.conversations = …;` | `<… conversations={…} />` | `<tc-ai-side-pane :conversations="…">` | `<tc-ai-side-pane [conversations]="…">` | `<tc-ai-side-pane {conversations}>` |
| `conversation` | `el.conversation = …;` | `<… conversation={…} />` | `<tc-ai-side-pane :conversation="…">` | `<tc-ai-side-pane [conversation]="…">` | `<tc-ai-side-pane {conversation}>` |
| `pageContext` | `el.pageContext = …;` | `<… pageContext={…} />` | `<tc-ai-side-pane :pageContext="…">` | `<tc-ai-side-pane [pageContext]="…">` | `<tc-ai-side-pane {pageContext}>` |
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-ai-side-pane :models="…">` | `<tc-ai-side-pane [models]="…">` | `<tc-ai-side-pane {models}>` |
| `settings` | `el.settings = …;` | `<… settings={…} />` | `<tc-ai-side-pane :settings="…">` | `<tc-ai-side-pane [settings]="…">` | `<tc-ai-side-pane {settings}>` |
| `settingsModel` | `el.settingsModel = …;` | `<… settingsModel={…} />` | `<tc-ai-side-pane :settingsModel="…">` | `<tc-ai-side-pane [settingsModel]="…">` | `<tc-ai-side-pane {settingsModel}>` |
| `prompts` | `el.prompts = …;` | `<… prompts={…} />` | `<tc-ai-side-pane :prompts="…">` | `<tc-ai-side-pane [prompts]="…">` | `<tc-ai-side-pane {prompts}>` |
| `onConnectApps` | `el.onConnectApps = …;` | `<… onConnectApps={…} />` | `<tc-ai-side-pane :onConnectApps="…">` | `<tc-ai-side-pane [onConnectApps]="…">` | `<tc-ai-side-pane {onConnectApps}>` |
| `onRequestApproval` | `el.onRequestApproval = …;` | `<… onRequestApproval={…} />` | `<tc-ai-side-pane :onRequestApproval="…">` | `<tc-ai-side-pane [onRequestApproval]="…">` | `<tc-ai-side-pane {onRequestApproval}>` |
| `onDictate` | `el.onDictate = …;` | `<… onDictate={…} />` | `<tc-ai-side-pane :onDictate="…">` | `<tc-ai-side-pane [onDictate]="…">` | `<tc-ai-side-pane {onDictate}>` |
| `onSend` | `el.onSend = …;` | `<… onSend={…} />` | `<tc-ai-side-pane :onSend="…">` | `<tc-ai-side-pane [onSend]="…">` | `<tc-ai-side-pane {onSend}>` |
| `onRegenerate` | `el.onRegenerate = …;` | `<… onRegenerate={…} />` | `<tc-ai-side-pane :onRegenerate="…">` | `<tc-ai-side-pane [onRegenerate]="…">` | `<tc-ai-side-pane {onRegenerate}>` |

*Also attributes: `heading`, `reflection-skippable`, `starters-title`, `disclaimer`, `placeholder`, `model`, `select-project`, `demo` and 10 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-send` | No | `el.addEventListener("tc-send", (e) => …)` | `ref.current.addEventListener("tc-send", …)` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-stop` | No | `el.addEventListener("tc-stop", (e) => …)` | `onStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |
| `tc-regenerate` | No | `el.addEventListener("tc-regenerate", (e) => …)` | `ref.current.addEventListener("tc-regenerate", …)` | `@tc-regenerate="…"` | `(tc-regenerate)="…($event)"` | `el.addEventListener("tc-regenerate", …)` |
| `tc-feedback` | No | `el.addEventListener("tc-feedback", (e) => …)` | `onFeedback={…}` | `@tc-feedback="…"` | `(tc-feedback)="…($event)"` | `el.addEventListener("tc-feedback", …)` |
| `tc-verify` | No | `el.addEventListener("tc-verify", (e) => …)` | `onVerify={…}` | `@tc-verify="…"` | `(tc-verify)="…($event)"` | `el.addEventListener("tc-verify", …)` |
| `tc-reflect` | Yes | `el.addEventListener("tc-reflect", (e) => …)` | `onReflect={…}` | `@tc-reflect="…"` | `(tc-reflect)="…($event)"` | `el.addEventListener("tc-reflect", …)` |
| `tc-new-chat` | No | `el.addEventListener("tc-new-chat", (e) => …)` | `onNewChat={…}` | `@tc-new-chat="…"` | `(tc-new-chat)="…($event)"` | `el.addEventListener("tc-new-chat", …)` |
| `tc-conversation-change` | Yes | `el.addEventListener("tc-conversation-change", (e) => …)` | `onConversationChange={…}` | `@tc-conversation-change="…"` | `(tc-conversation-change)="…($event)"` | `el.addEventListener("tc-conversation-change", …)` |
| `tc-conversations-change` | Yes | `el.addEventListener("tc-conversations-change", (e) => …)` | `onConversationsChange={…}` | `@tc-conversations-change="…"` | `(tc-conversations-change)="…($event)"` | `el.addEventListener("tc-conversations-change", …)` |
| `tc-model-change` | Yes | `el.addEventListener("tc-model-change", (e) => …)` | `onModelChange={…}` | `@tc-model-change="…"` | `(tc-model-change)="…($event)"` | `el.addEventListener("tc-model-change", …)` |
| `tc-settings-change` | Yes | `el.addEventListener("tc-settings-change", (e) => …)` | `ref.current.addEventListener("tc-settings-change", …)` | `@tc-settings-change="…"` | `(tc-settings-change)="…($event)"` | `el.addEventListener("tc-settings-change", …)` |
| `tc-page-context-change` | Yes | `el.addEventListener("tc-page-context-change", (e) => …)` | `ref.current.addEventListener("tc-page-context-change", …)` | `@tc-page-context-change="…"` | `(tc-page-context-change)="…($event)"` | `el.addEventListener("tc-page-context-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `onCollapsedChange={…}` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |
| `tc-width-change` | Yes | `el.addEventListener("tc-width-change", (e) => …)` | `onWidthChange={…}` | `@tc-width-change="…"` | `(tc-width-change)="…($event)"` | `el.addEventListener("tc-width-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `conversations`, `conversation`, `pageContext`, `model`, `settings`, `open`, `collapsed` and `width` itself unless a listener calls `preventDefault()` on `tc-conversations-change`, `tc-conversation-change`, `tc-page-context-change`, `tc-model-change`, `tc-settings-change`, `tc-open-change`, `tc-collapsed-change` or `tc-width-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ai-side-pane id="ai-side-pane"></tc-ai-side-pane>

<script type="module">
  import "@adamstavely/trenchcoat/ai-side-pane";

  const el = document.querySelector("#ai-side-pane");
  el.addEventListener("tc-conversations-change", (e) => {
    e.preventDefault(); // the element keeps its conversations…
    if (allowed(e.detail.conversations)) el.conversations = e.detail.conversations; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AiSidePane } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AiSidePane>;
type Props = Omit<Own, "conversations" | "onConversationsChange"> & { initial: NonNullable<Own["conversations"]> };

// Controlled: passing conversations makes the wrapper prevent the element's own change; the app sets it
export function ControlledAiSidePane({ initial, ...props }: Props) {
  const [conversations, setConversations] = useState<Own["conversations"]>(initial);
  return <AiSidePane {...props} conversations={conversations} onConversationsChange={(next) => setConversations(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/ai-side-pane";
import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";

const props = defineProps<{ initial: TcAiSidePane["conversations"] }>();
const conversations = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onConversationsChange = (e: CustomEvent<{ conversations: TcAiSidePane["conversations"] }>) => {
  e.preventDefault();
  conversations.value = e.detail.conversations;
};
</script>

<template>
  <tc-ai-side-pane :conversations="conversations" @tc-conversations-change="onConversationsChange"></tc-ai-side-pane>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AiSidePane } from "@adamstavely/trenchcoat/angular/ai-side-pane";
import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";

@Component({
  selector: "app-controlled-ai-side-pane",
  imports: [AiSidePane],
  template: `<tc-ai-side-pane [conversations]="conversations()" (tc-conversations-change)="onConversationsChange($event)"></tc-ai-side-pane>`,
})
export class ControlledAiSidePane {
  readonly initial = input.required<TcAiSidePane["conversations"]>();
  readonly conversations = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onConversationsChange(e: CustomEvent<{ conversations: TcAiSidePane["conversations"] }>) {
    e.preventDefault();
    this.conversations.set(e.detail.conversations);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-side-pane";
  import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";

  let { initial }: { initial: TcAiSidePane["conversations"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let conversations = $derived(initial);
  let el: TcAiSidePane;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      conversations = (e as CustomEvent<{ conversations: TcAiSidePane["conversations"] }>).detail.conversations;
    };
    el.addEventListener("tc-conversations-change", on);
    return () => el.removeEventListener("tc-conversations-change", on);
  });
</script>

<tc-ai-side-pane bind:this={el} {conversations}></tc-ai-side-pane>
```

### Slots and children

Put children inside the tag with a `slot` attribute: `no slot attribute`. The element renders into itself (no shadow root) and leaves them where you put them.

- **React:** pass them as children with the same attribute.
- **Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-side-pane")` returns a `TcAiSidePane` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";`
- **React / Next.js:** Props: `import type { AiSidePaneProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AiSidePane>`. The element class, for refs: `import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiSidePane["messages"]` with `import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";`
- **Angular:** The directive types the template: `[messages]` takes `TcAiSidePane["messages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiSidePane } from "@adamstavely/trenchcoat/ai-side-pane";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | The host page – the pane docks beside it |
| `title` | `string` | The pane's title, its landmark's and dialog's name |
| `messages` | `SidePaneMessage[]` | The conversation, oldest first. The app owns it |
| `onSend` | `(text: string, details: { model: string; pageContext?: ChatPageContext }) => void \| Promise<unknown>` | Send a message: append it (and the answer) to `messages`. Return a promise to keep the text in the composer until it settles. `pageContext` is set only while the page is connected – send it with the message |
| `onStop` | `(messageId: string) => void` | Stop was pressed while an answer was streaming |
| `onRegenerate` | `(messageId: string) => void \| Promise<unknown>` | Regenerate, or Try again after an error |
| `onFeedback` | `(messageId: string, value: FeedbackKind \| null, reason?: string) => void` | A thumb up or down on an answer (null: cleared) |
| `onVerify` | `(messageId: string, claim: AnswerClaim, sources: ClaimSource[]) => void` | A claim was sent to verification |
| `onReflect` | `(messageId: string, submission: ReflectionGateSubmission \| null) => boolean \| void` | The reflection gate on a high-stakes answer was submitted (return false to keep it open) or, with `reflectionSkippable`, skipped (null) |
| `starters` | `PromptStarter[]` | Suggestions before the first message – icons may be built-in names or React nodes |
| `onNewChat` | `() => void` | New chat was pressed – start an empty conversation |
| `conversations` | `ChatConversation[]` | Past conversations for the History panel – leave undefined to hide History |
| `onConversationsChange` | `(conversations: ChatConversation[]) => void` | Called with the whole list after a rename, pin, move or delete in History |
| `conversation` | `string \| null` | The open conversation's id |
| `onConversationChange` | `(id: string \| null) => void` | A conversation was picked in History – load its messages |
| `models` | `ChatModel[]` | The models in the toolbar's menu – `Logo` is a React component |
| `model` | `string` | The picked model (controlled) |
| `defaultModel` | `string` | The model picked at first (uncontrolled) |
| `onModelChange` | `(model: ChatModel) => void` | Called with the model picked in the toolbar |
| `settings` | `ModelSettingsValue` | The model settings (controlled) |
| `defaultSettings` | `ModelSettingsValue` | The model settings at first (uncontrolled) |
| `onSettingsChange` | `(settings: ModelSettingsValue, changed: string[]) => void` | The model settings changed, with the names of the settings that did |
| `settingsModel` | `ModelSettingsModel` | Which settings the model supports |
| `prompts` | `PromptTemplate[]` | Templates for the prompt library |
| `onPromptPick` | `(pick: ChatPromptPick, event: Event) => void` | A prompt was picked in the library |
| `onAttach` | `() => void` | The plus button was pressed – open your own file picker |
| `onSelectProject` | `() => void` | Shows "Select a project" and is called when it's pressed |
| `pageContext` | `ChatPageContext` | What's on the page (controlled) – shown as the composer's page-context chip. Leave undefined to let the pane keep it, starting at `defaultPageContext` – or leave both unset for no chip |
| `defaultPageContext` | `ChatPageContext` | The page-context chip at first (uncontrolled) |
| `onPageContextChange` | `(pageContext: ChatPageContext, change: "connect" \| "disconnect" \| "items") => void` | The chip was toggled, or an attached item removed |
| `open` | `boolean` | Open (controlled) – leave undefined to start at `defaultOpen` |
| `defaultOpen` | `boolean` | Open at first (uncontrolled) |
| `onOpenChange` | `(open: boolean) => void` | The pane opened or closed |
| `collapsed` | `boolean` | Collapsed to the rail (controlled) – leave undefined to start at `defaultCollapsed` |
| `defaultCollapsed` | `boolean` | Collapsed to the rail at first (uncontrolled) |
| `onCollapsedChange` | `(collapsed: boolean) => void` | The pane collapsed to the rail or expanded |
| `width` | `number` | The docked width in px (controlled) – pass it with `onWidthChange` to remember it |
| `defaultWidth` | `number` | The width to start at, and the one Enter or a double-click on the edge goes back to |
| `onWidthChange` | `(width: number) => void` | Reported once a drag ends, and on every arrow-key step |
| `shortcut` | `string \| null` | Opens the pane – "mod+.", "mod+shift+k", "alt+a"; null turns it off |

*Renamed or hidden on the wrapper: `heading`, `title`, `messages`, `starters`, `conversations`, `conversation`, `pageContext`, `models`, `model`, `settings`, `open`, `collapsed`, `width`, `defaultWidth`, `shortcut`, `selectProject`, `onSend`, `onRegenerate`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| ⌘. / Ctrl+. | Opens the pane and focuses the composer; pressed inside it, closes it (`shortcut` changes it) |
| ← / → on the edge | Widens or narrows the pane by 16 px (Shift: 64 px) |
| Home / End on the edge | The narrowest or widest width |
| Enter on the edge | Back to `defaultWidth` |
| Escape | Closes History; as a sheet, closes the pane |
| Tab | As a sheet, stays inside the pane (it wraps) |

Focus moves into the composer when the pane opens and goes back to where it was (or the launcher) when it closes.
Collapsing focuses Expand; History's search takes focus and gives it back to History.

### Screen readers

Docked, the pane is a complementary landmark named by its title; as a sheet it is a modal dialog, and the page behind
it is inert. The edge is a vertical separator whose value is the width ("400 pixels wide"). Each message is an article
named "You" or "Assistant"; what was attached reads "Sent with Q3 report". A failed answer is an alert with Try again.
The launcher and Close name the shortcut through `aria-keyshortcuts`.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | ai-answer, chat-composer, prompt-library, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | model-settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, prompt-library, tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | chat-composer | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself, ai-answer, chat-composer, context-tray, model-picker, model-settings, prompt-library, chat-history, claim-answer, message-actions, prompt-starters, reflection-gate | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, ai-answer, internal/controllers, chat-composer, context-tray, model-picker, prompt-library, internal/popover, claim-answer, message-actions | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, ai-answer, internal/kit, button, chat-composer, context-tray, mention-picker, model-picker, model-settings, segmented-control, prompt-library, chat-history, claim-answer, validity-badge, message-actions, prompt-starters, reflection-gate | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | ai-answer, button, chat-composer, mention-picker | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, ai-answer, button, chat-composer, mention-picker, prompt-library, internal/popover, claim-answer, reflection-gate | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | model-picker, segmented-control, claim-answer | – |
| :is() and :where() | 88 | 78 | 14 | 14 | ai-answer, internal/base, button, chat-composer, context-tray, mention-picker, model-picker, model-settings, segmented-control, prompt-library, chat-history, claim-answer, validity-badge, message-actions, prompt-starters, reflection-gate, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | validity-badge | – |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | ai-answer, prompt-library, message-actions | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, ai-answer, button, chat-composer, mention-picker, segmented-control, prompt-library, internal/popover, validity-badge, message-actions | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | ai-answer, button, chat-composer, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | reflection-gate | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | chat-history | Scrollbars keep the browser's default colours. |
| text-wrap: pretty | 117 | No | 26 | 26 | reflection-gate | Paragraphs may end on a single short word. |
| scrollbar-gutter | 94 | 97 | 18.2 | 18.2 | itself | Content can shift sideways when a scrollbar appears. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | ai-answer, chat-composer, mention-picker, segmented-control, chat-history | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | mention-picker, internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, ai-answer, internal/card-head, internal/kit, chat-composer, mention-picker, internal/popover, validity-badge, message-actions, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself, chat-composer, mention-picker, segmented-control, chat-history | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 36.2 KB | 11.2 KB |
| Lit · the library every element is built on, the parts it uses | 22.3 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 6.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.2 KB | – |
| `internal/source-line` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| [chat-composer](../components/chat-composer.md) · Element it renders | 137.4 KB | – |
| [ai-answer](../components/ai-answer.md) · Element it renders | 63.1 KB | – |
| [message-actions](../components/message-actions.md) · Element it renders | 52.6 KB | – |
| [prompt-library](../components/prompt-library.md) · Element it renders | 47.7 KB | – |
| [chat-history](../components/chat-history.md) · Element it renders | 45.1 KB | – |
| [mention-picker](../components/mention-picker.md) · Element it renders | 39.8 KB | – |
| [model-picker](../components/model-picker.md) · Element it renders | 36.3 KB | – |
| [reflection-gate](../components/reflection-gate.md) · Element it renders | 34.2 KB | – |
| [claim-answer](../components/claim-answer.md) · Element it renders | 34.0 KB | – |
| [model-settings](../components/model-settings.md) · Element it renders | 30.7 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.9 KB | – |
| [context-tray](../components/context-tray.md) · Element it renders | 25.2 KB | – |
| [validity-badge](../components/validity-badge.md) · Element it renders | 17.9 KB | – |
| [prompt-starters](../components/prompt-starters.md) · Element it renders | 15.5 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **687.1 KB** | **163.1 KB** |
| With Lit – the first component on a page | 705.9 KB | 169.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | default properties, 198 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 48 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`, `requestAnimationFrame, cancelled` (ai-answer), `requestAnimationFrame, cancelled` (chat-composer), `requestAnimationFrame, cancelled` (internal/controllers – RollingController), `requestAnimationFrame, cancelled` (mention-picker), `requestAnimationFrame` (model-picker), `requestAnimationFrame, cancelled` (segmented-control), `requestAnimationFrame, cancelled` (prompt-library), `requestAnimationFrame, cancelled` (internal/popover – PopoverController), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (validity-badge).
- Timers: `setInterval, cleared` (ai-answer), `setTimeout` (ai-answer), `setInterval, cleared` (chat-composer), `setTimeout` (chat-composer), `setTimeout` (context-tray), `setTimeout` (model-picker), `setTimeout` (segmented-control), `setTimeout` (prompt-library), `setTimeout` (internal/popover – PopoverController), `setTimeout` (chat-history), `setTimeout` (message-actions), `setTimeout` (prompt-starters).
- 15 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `ResizeObserver` (ai-answer), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController), `ResizeObserver` (button), `MutationObserver` (button), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (chat-composer), `ResizeObserver` (mention-picker), `ResizeObserver` (segmented-control), `ResizeObserver` (prompt-library), `ResizeObserver` (internal/popover – PopoverController), `ResizeObserver` (validity-badge), `MutationObserver` (validity-badge), `ResizeObserver` (message-actions), `MutationObserver` (message-actions).
- Listens on the page: `window keydown`, `document keydown` (ai-answer), `document visibilitychange` (internal/controllers – OnScreenController), `document pointerdown` (chat-composer), `document pointerdown` (model-picker), `window resize` (model-picker), `document pointerdown` (chat-history), `window resize` (chat-history), `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `Date.now()` (ai-answer), `performance.now()` (ai-answer), `Date.now()` (chat-composer), `performance.now()` (internal/controllers – RollingController), `performance.now()` (prompt-library), `Date.now()` (chat-history), `performance.now()` (internal/controllers – RowWindowController), `Date.now()` (validity-badge).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the pane for what it is in your product – "Assistant", "Copilot", "Ask Finance".
- Give `pageContext` a short title ("Q3 report") and its sections as items, so people see what the assistant reads.
- Derive `starters` from what's on the page; keep them short and specific.
- Mark answers that lead to decisions with `reflect` – "checkpoint" for claims, "prior" to ask for an expectation first.

## Do and don't

### Do

- Append to `messages` on tc-send and grow the answer's `text` while `streaming` is set.
- Remember `width`, `open` and `collapsed` per person by listening to their change events.

### Don't

- Don't put a second assistant launcher on the page – set `launcher` to false if you have your own.
- Don't hide the disclaimer without a better one of your own.

## Related

- [Chat Composer](../components/chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [AI Answer](../components/ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Claim Answer](../components/claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Chat History](../components/chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [Prompt Starters](../components/prompt-starters.md) – Where to begin, and what to ask next – suggestions for an empty chat and follow-ups after an answer, from the conversation's context
- [Reflection Gate](../components/reflection-gate.md) – A moment to think before relying on AI – state the task and what's at stake, say what you believe, restate the answer, or name what you'll verify
- [Message Actions](../components/message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
