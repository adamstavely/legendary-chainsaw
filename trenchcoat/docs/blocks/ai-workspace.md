<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# AI Workspace

**Blocks** · New

Complete assistant app – sidebar, welcome, streaming chat and projects, built on the Chat Composer (uses `chat-composer`, `button`)

- **Element:** `<tc-ai-workspace>`
- **Size:** 101.9 KB gzip · 434.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-workspace";` |
| React / Next.js | `import { AiWorkspace } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-workspace";` · tags starting with tc- are custom elements |
| Angular | `import { AiWorkspace } from "@adamstavely/trenchcoat/angular/ai-workspace";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-workspace";` |

## Example

The live example is in the gallery at `#/blocks/ai-workspace`, in both looks; Replay restarts its animations.

## Overview

A complete assistant app in one element. A sidebar with search, New chat, Projects, pinned items, recent chats and the
signed-in person; a main panel that shows one of three views:
- **Welcome** – a greeting, the Chat Composer, three starter prompts and a short disclaimer.
- **Chat** – the conversation, the answer typing itself in word by word, Copy and Ask again under each answer, an
  error with Try again when the model call fails, and the composer docked at the bottom.
- **Projects** – search, sort and a card per project, with Rename and Pin in each card's menu and a Create project
  dialog.

Set `respond` to your model call; without it the workspace answers with demo text. The sidebar collapses, and on a
narrow container it becomes an overlay that starts closed.

### When to use

- A prototype or internal tool that needs a whole assistant UI quickly.
- A product's “Ask AI” area, where chats are grouped into projects.
- Demos and onboarding for a model or an agent.

### When not to use

- Only the message box – use [Chat Composer](../components/chat-composer.md).
- A list of past conversations inside your own layout – use [Chat History](../components/chat-history.md).
- One answer with sources – use [AI Answer](../components/ai-answer.md).
- Suggested first prompts on their own – use [Prompt Starters](../components/prompt-starters.md).

## Anatomy

1. **Sidebar** `.ui-aw__side` – search, navigation, pinned items, recents and the person
2. **Chat search** `.ui-aw__search` – filters recents and pinned items
3. **Recent chat** `.ui-aw__item` – opens a conversation
4. **Breadcrumb** `.ui-aw__crumb-btn` – the project and chat; switches project
5. **Welcome** `.ui-aw__welcome` – the greeting, composer and starters
6. **Starter** `.ui-aw__starter` – a prompt that starts a chat
7. **Messages** `.ui-aw__messages` – the conversation
8. **Answer** `.ui-aw__msg--ai` – an answer with its orb, Copy and Ask again
9. **Projects** `.ui-aw__projects` – the projects overview
10. **Project card** `.ui-aw__project` – a project with its options menu
11. **Dialog** `.ui-aw__dialog` – Create project

## Looks

Standard sets the sidebar on a sunken frame and the main panel as a white card with a hairline border. Clean uses the
tray colour for the frame, the card shadow on the panel and the Clean composer and buttons. Everything else – the
orb, menus, project cards and dialog – is the same in both.

## Usage

### HTML

```html
<tc-ai-workspace id="ws" user-name="Lena"></tc-ai-workspace>

<script type="module">
  import "@adamstavely/trenchcoat/ai-workspace";
  import "@adamstavely/trenchcoat/tokens.css";

  const ws = document.querySelector("#ws");
  ws.respond = async (message, history) => {
    const res = await fetch("/api/answer", { method: "POST", body: JSON.stringify({ message, history }) });
    if (!res.ok) throw new Error("The model is busy – try again in a minute.");
    return (await res.json()).text;
  };
  ws.addEventListener("tc-conversations-change", (e) => console.log(e.detail.conversations.length));
</script>
```

### React / Next.js

```tsx
import { AiWorkspace, type AiWorkspaceConversation } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Assistant({ saved, save }: { saved: AiWorkspaceConversation[]; save: (next: AiWorkspaceConversation[]) => void }) {
  return (
    <AiWorkspace
      userName="Lena"
      conversations={saved}
      onConversationsChange={save}
      respond={async (message) => `You asked: ${message}`}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-workspace";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";

defineProps<{ pinned: TcAiWorkspace["pinned"]; conversations: TcAiWorkspace["conversations"] }>();
const onConversationsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-workspace :pinned="pinned" :conversations="conversations" @tc-conversations-change="onConversationsChange"></tc-ai-workspace>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiWorkspace } from "@adamstavely/trenchcoat/angular/ai-workspace";
import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";

@Component({
  selector: "app-ai-workspace-example",
  imports: [AiWorkspace],
  template: `<tc-ai-workspace [pinned]="pinned()" [conversations]="conversations()" (tc-conversations-change)="onConversationsChange($event)"></tc-ai-workspace>`,
})
export class AiWorkspaceExample {
  readonly pinned = input.required<TcAiWorkspace["pinned"]>();
  readonly conversations = input.required<TcAiWorkspace["conversations"]>();
  onConversationsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-workspace";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";

  let { pinned, conversations }: { pinned: TcAiWorkspace["pinned"]; conversations: TcAiWorkspace["conversations"] } = $props();
  let el: TcAiWorkspace;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-conversations-change", on);
    return () => el.removeEventListener("tc-conversations-change", on);
  });
</script>

<tc-ai-workspace bind:this={el} {pinned} {conversations}></tc-ai-workspace>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `userName` | `user-name` | `string` | `"Lena"` | The signed-in person's name – the welcome greets them |
| `userAvatar` | `user-avatar` | `string` | `""` | Their avatar's URL; their initial shows without one |
| `workspace` | `workspace` | `string` | `"N"` | The workspace's initial in the top-left tile |
| `pinned` | – | `string[]` | `["Writing assistant", "Data analyst", "Knowledge base"]` | Pinned items listed in the sidebar, above the pinned projects |
| `conversations` | – | `AiWorkspaceConversation[]` | `[ { id: "c1", title: "Summarize interview notes", messages: [ { id: "m1", role: "user", text: "Summarize the notes from this week's customer interviews." }, { id: "m2", role: "assistant", text: "Three themes stood out:\n\n1. People compare plans in a table before they read anything else.\n2. Seat pricing feels fair once the per-seat price is visible.\n3. Two interviewees asked for an annual invoice for their finance team.", }, ], }, { id: "c2", title: "Draft launch email", messages: [ { id: "m3", role: "user", text: "Draft a launch email for the new pricing." }, { id: "m4", role: "assistant", text: "Subject: Pricing is live\n\nHi everyone – our new plans are out today. Existing customers keep their price." }, ], }, { id: "c3", title: "Rewrite onboarding copy", messages: [ { id: "m5", role: "user", text: "Make the onboarding copy shorter." }, { id: "m6", role: "assistant", text: "Here's a tighter version: “Create your first project – it takes a minute.”" }, ], }, { id: "c4", title: "Plan sprint goals", messages: [ { id: "m7", role: "user", text: "Help me plan goals for the next sprint." }, { id: "m8", role: "assistant", text: "Pick one outcome per team and two stretch goals. Want a template?" }, ], }, ]` | The conversations, newest first |
| `projects` | – | `AiWorkspaceProject[]` | `[ { id: "p1", name: "Brand Refresh", description: "Logo, colors and type for the new identity", updatedDaysAgo: 2 }, { id: "p2", name: "Customer Research", description: "Interview notes and survey results", updatedDaysAgo: 5 }, { id: "p3", name: "Pricing Page", description: "Plans, copy and the comparison table", updatedDaysAgo: 7 }, { id: "p4", name: "Mobile App", description: "Navigation patterns and offline mode", updatedDaysAgo: 10 }, { id: "p5", name: "Help Center", description: "Guides, FAQs and release notes", updatedDaysAgo: 12 }, { id: "p6", name: "Q4 Planning", description: "Goals, budgets and the launch calendar", updatedDaysAgo: 14 }, ]` | The projects |
| `respond` | – | `AiWorkspaceRespond \| undefined` | `undefined` | Your model call – resolve with the full answer; a rejection shows an error with Try again. The demo answers without it |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-conversations-change` | – | Yes | The conversations changed – a message sent or answered, a chat deleted (`AiWorkspaceConversationsChange`: `{ conversations }`); cancelable – prevented, `conversations` stays (controlled use) |
| `tc-projects-change` | – | Yes | The projects changed – created, renamed, pinned or unpinned (`AiWorkspaceProjectsChange`: `{ projects }`); cancelable – prevented, `projects` stays (controlled use) |
| `tc-share-chat` | – | No | Share chat was picked in the More menu (`AiWorkspaceShare`: `{ conversation }`) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `send(text: string)` | `void` | Sends a message: a new conversation from the welcome screen, else a reply in the open one |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-aw-side` | `240px` | both |
| `--tc-aw-h` | `640px` | both |
| `--tc-aw-chat-w` | `620px` | both |
| `--tc-aw-page-w` | `640px` | both |

#### Design tokens it reads (111)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-blue-300`, `--tc-blue-600`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-4xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xl`, `--tc-radius-3xl`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-scrim`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-radius`, `--tc-z-drawer`, `--tc-z-dropdown`, `--tc-z-modal`, `--tc-z-modal-scrim`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `aiWorkspaceDemoRespond(message: string): void` | Demo answers – swap for a real model via `respond` |
| `defaultAiWorkspaceConversations: AiWorkspaceConversation[]` | The sample conversations shown when `conversations` isn't set |
| `defaultAiWorkspaceProjects: AiWorkspaceProject[]` | The sample projects shown when `projects` isn't set |

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
| `pinned` | `el.pinned = …;` | `<… pinned={…} />` | `<tc-ai-workspace :pinned="…">` | `<tc-ai-workspace [pinned]="…">` | `<tc-ai-workspace {pinned}>` |
| `conversations` | `el.conversations = …;` | `<… conversations={…} />` | `<tc-ai-workspace :conversations="…">` | `<tc-ai-workspace [conversations]="…">` | `<tc-ai-workspace {conversations}>` |
| `projects` | `el.projects = …;` | `<… projects={…} />` | `<tc-ai-workspace :projects="…">` | `<tc-ai-workspace [projects]="…">` | `<tc-ai-workspace {projects}>` |
| `respond` | `el.respond = …;` | `<… respond={…} />` | `<tc-ai-workspace :respond="…">` | `<tc-ai-workspace [respond]="…">` | `<tc-ai-workspace {respond}>` |

*Also attributes: `user-name`, `user-avatar`, `workspace` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-conversations-change` | Yes | `el.addEventListener("tc-conversations-change", (e) => …)` | `ref.current.addEventListener("tc-conversations-change", …)` | `@tc-conversations-change="…"` | `(tc-conversations-change)="…($event)"` | `el.addEventListener("tc-conversations-change", …)` |
| `tc-projects-change` | Yes | `el.addEventListener("tc-projects-change", (e) => …)` | `ref.current.addEventListener("tc-projects-change", …)` | `@tc-projects-change="…"` | `(tc-projects-change)="…($event)"` | `el.addEventListener("tc-projects-change", …)` |
| `tc-share-chat` | No | `el.addEventListener("tc-share-chat", (e) => …)` | `onShareChat={…}` | `@tc-share-chat="…"` | `(tc-share-chat)="…($event)"` | `el.addEventListener("tc-share-chat", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `conversations` and `projects` itself unless a listener calls `preventDefault()` on `tc-conversations-change` or `tc-projects-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ai-workspace id="ai-workspace"></tc-ai-workspace>

<script type="module">
  import "@adamstavely/trenchcoat/ai-workspace";

  const el = document.querySelector("#ai-workspace");
  el.addEventListener("tc-conversations-change", (e) => {
    e.preventDefault(); // the element keeps its conversations…
    if (allowed(e.detail.conversations)) el.conversations = e.detail.conversations; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

*The wrapper doesn't take this value with a callback of its own – see the props below, or use the element through a ref.*

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/ai-workspace";
import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";

const props = defineProps<{ initial: TcAiWorkspace["conversations"] }>();
const conversations = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onConversationsChange = (e: CustomEvent<{ conversations: TcAiWorkspace["conversations"] }>) => {
  e.preventDefault();
  conversations.value = e.detail.conversations;
};
</script>

<template>
  <tc-ai-workspace :conversations="conversations" @tc-conversations-change="onConversationsChange"></tc-ai-workspace>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AiWorkspace } from "@adamstavely/trenchcoat/angular/ai-workspace";
import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";

@Component({
  selector: "app-controlled-ai-workspace",
  imports: [AiWorkspace],
  template: `<tc-ai-workspace [conversations]="conversations()" (tc-conversations-change)="onConversationsChange($event)"></tc-ai-workspace>`,
})
export class ControlledAiWorkspace {
  readonly initial = input.required<TcAiWorkspace["conversations"]>();
  readonly conversations = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onConversationsChange(e: CustomEvent<{ conversations: TcAiWorkspace["conversations"] }>) {
    e.preventDefault();
    this.conversations.set(e.detail.conversations);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-workspace";
  import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";

  let { initial }: { initial: TcAiWorkspace["conversations"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let conversations = $derived(initial);
  let el: TcAiWorkspace;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      conversations = (e as CustomEvent<{ conversations: TcAiWorkspace["conversations"] }>).detail.conversations;
    };
    el.addEventListener("tc-conversations-change", on);
    return () => el.removeEventListener("tc-conversations-change", on);
  });
</script>

<tc-ai-workspace bind:this={el} {conversations}></tc-ai-workspace>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-workspace")` returns a `TcAiWorkspace` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";`
- **React / Next.js:** Props: `import type { AiWorkspaceProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AiWorkspace>`. The element class, for refs: `import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiWorkspace["pinned"]` with `import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";`
- **Angular:** The directive types the template: `[pinned]` takes `TcAiWorkspace["pinned"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiWorkspace } from "@adamstavely/trenchcoat/ai-workspace";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `conversations` | `AiWorkspaceConversation[]` | The conversations (controlled) – pass `onConversationsChange` with it. Leave undefined to start from `defaultConversations` |
| `defaultConversations` | `AiWorkspaceConversation[]` | The conversations on mount when `conversations` isn't controlled |
| `onConversationsChange` | `(conversations: AiWorkspaceConversation[]) => void` | Called with the whole list after a message is sent or answered, or a chat is deleted |
| `projects` | `AiWorkspaceProject[]` | The projects (controlled) – pass `onProjectsChange` with it. Leave undefined to start from `defaultProjects` |
| `defaultProjects` | `AiWorkspaceProject[]` | The projects on mount when `projects` isn't controlled |
| `onProjectsChange` | `(projects: AiWorkspaceProject[]) => void` | Called with the whole list after a project is created, renamed, pinned or unpinned |
| `onShareChat` | `(conversation: AiWorkspaceConversation \| null) => void` | Share chat was picked in the More menu |

*Renamed or hidden on the wrapper: `conversations`, `projects`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the sidebar, the bar, the view and the composer |
| Enter / Space | Opens a chat, a menu or the dialog; picks a menu item |
| ↑ / ↓ | In a menu, moves between items |
| Home / End | In a menu, moves to the first or last item |
| Esc | Closes a menu or the dialog; focus returns to the button that opened it |
| Tab (in a menu) | Closes it |
| Enter (renaming) | Keeps the new name; Esc drops it. Focus returns to the card's options |
| Tab (in the dialog) | Stays inside it |

When a control goes away – the sidebar toggles, the welcome screen after a starter, a closing menu – focus moves to its
counterpart, never to the page.

### Screen readers

The sidebar is a landmark named “Workspace” and is `inert` while collapsed. Menus use `role="menu"` with
`menuitem` / `menuitemradio`, and their buttons report `aria-haspopup` and `aria-expanded`. The current chat or view is
marked with `aria-current`. One narrow status region announces “Thinking…” and then the whole answer once, so the
typing isn't read word by word; a failed answer is an alert. The dialog is modal and labelled by its title.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | chat-composer, prompt-library, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | model-settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, prompt-library, tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | chat-composer | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself, chat-composer, context-tray, model-picker, model-settings, prompt-library | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, chat-composer, context-tray, internal/controllers, model-picker, prompt-library, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit, chat-composer, context-tray, mention-picker, model-picker, model-settings, segmented-control, prompt-library | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, button, chat-composer, mention-picker | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, button, chat-composer, mention-picker, prompt-library, internal/popover | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | model-picker, segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, button, internal/base, chat-composer, context-tray, mention-picker, model-picker, model-settings, segmented-control, prompt-library, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | prompt-library, internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button, chat-composer, mention-picker, segmented-control, prompt-library, internal/popover | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button, chat-composer, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself, chat-composer, mention-picker, segmented-control | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | mention-picker, internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, chat-composer, mention-picker, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | chat-composer, mention-picker, segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 50.2 KB | 13.6 KB |
| Lit · the library every element is built on, the parts it uses | 22.3 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 4.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| [chat-composer](../components/chat-composer.md) · Element it renders | 137.4 KB | – |
| [prompt-library](../components/prompt-library.md) · Element it renders | 47.7 KB | – |
| [mention-picker](../components/mention-picker.md) · Element it renders | 39.8 KB | – |
| [model-picker](../components/model-picker.md) · Element it renders | 36.3 KB | – |
| [model-settings](../components/model-settings.md) · Element it renders | 30.7 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [context-tray](../components/context-tray.md) · Element it renders | 25.2 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **434.2 KB** | **101.9 KB** |
| With Lit – the first component on a page | 454.9 KB | 108.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | default properties, 265 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | re-render with the same data |
| First on the page | 36 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (chat-composer), `requestAnimationFrame, cancelled` (internal/controllers – RollingController), `requestAnimationFrame, cancelled` (mention-picker), `requestAnimationFrame` (model-picker), `requestAnimationFrame, cancelled` (segmented-control), `requestAnimationFrame, cancelled` (prompt-library), `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setInterval, cleared`, `setTimeout`, `setInterval, cleared` (chat-composer), `setTimeout` (chat-composer), `setTimeout` (context-tray), `setTimeout` (model-picker), `setTimeout` (segmented-control), `setTimeout` (prompt-library), `setTimeout` (internal/popover – PopoverController).
- 5 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (chat-composer), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (mention-picker), `ResizeObserver` (segmented-control), `ResizeObserver` (prompt-library), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `window pointerdown`, `window keydown`, `document pointerdown` (chat-composer), `document pointerdown` (model-picker), `window resize` (model-picker).
- Reads the clock: `Date.now()` (chat-composer), `performance.now()` (internal/controllers – RollingController), `performance.now()` (prompt-library).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Greet the person by first name in `user-name`.
- Keep pinned items and project names short – the sidebar is 240 px wide.
- Write project descriptions as what's inside: “Interview notes and survey results”.
- Return plain text from `respond`; line breaks are kept.

## Do and don't

### Do

- Persist `tc-conversations-change` and `tc-projects-change` and pass the lists back.
- Reject `respond`'s promise with a readable message – it's shown after “No answer –”.
- Give the element a height that suits the page (`--tc-aw-h`, 640 px by default).

### Don't

- Don't stream partial answers into `conversations` – resolve `respond` with the full text and let it type in.
- Don't hide the disclaimer for model output people act on.
- Don't use it inside another app shell with its own sidebar – use `chat-composer` and `chat-history` there.

## Related

- [Chat Composer](../components/chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Chat History](../components/chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [AI Answer](../components/ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Message Actions](../components/message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Prompt Starters](../components/prompt-starters.md) – Where to begin, and what to ask next – suggestions for an empty chat and follow-ups after an answer, from the conversation's context

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
