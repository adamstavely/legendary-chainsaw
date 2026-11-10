<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Collaboration Stream

**Agents** · New

What agents say to each other in a run, as a quiet chat – who to whom on every message, handoffs as slim rows, questions for you with an answer box, files that preview, details with tool calls, filter tabs and an @-composer

- **Element:** `<tc-collaboration-stream>`
- **Size:** 21.9 KB gzip · 77.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/collaboration-stream";` |
| React / Next.js | `import { CollaborationStream } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/collaboration-stream";` · tags starting with tc- are custom elements |
| Angular | `import { CollaborationStream } from "@adamstavely/trenchcoat/angular/collaboration-stream";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/collaboration-stream";` |

## Example

The live example is in the gallery at `#/collaboration-stream`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What the agents in a run say to each other, as a quiet chat. Every message says who it is from and who it is for –
“Researcher → Orchestrator” – with its time. Handoffs and other run events (“Orchestrator started Researcher”) are
slim rows between the messages. A question addressed to you is tagged “Needs you” and carries its own answer box.
Files are chips that open a preview, and every message can unfold a details card with its model, tokens, cost, time
and the tool calls it made. Tabs filter the stream – Everyone, You and one per agent – and a composer at the bottom
writes to everyone or to one participant, with @ to name someone.

### When to use

- Multi-agent runs where the conversation between agents is the thing to follow: who asked whom for what, and what
  came back.
- Runs that sometimes stop to ask a person – the question sits in the stream where it came up, and is answered there.
- Showing a run live: messages stream in, the log follows the newest one, and a “Live” pill sits in the header.

### When not to use

- A task passed along a chain, where what carried over at each step matters – use [Agent Handoff](agent-handoff.md).
- Who started whom, with costs rolled up – use [Agent Tree](agent-tree.md).
- One agent's single tool call in detail – use [Tool Call Card](tool-call-card.md).
- A person chatting with one assistant – use [Chat Composer](chat-composer.md) with your own message list.
- People discussing a document – use [Comment Thread](comment-thread.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the shared card header: icon, heading, an optional line, and “needs you” and Live on the right
2. **Card** `.ui-cls__card` – holds the tabs, the log and the composer
3. **Tabs** `.ui-cls__tabs` – Everyone, You and one per agent, each with a count
4. **Log** `.ui-cls__log` – the messages, scrolling, pinned to the newest one
5. **Message** `.ui-cls__msg` – avatar, who to whom, time, the text, then files, an answer box and details
6. **Event** `.ui-cls__event` – a handoff or run event as a slim row
7. **Tag** `.ui-cls__tag` – “Needs you” on a question for you, “Answered” once it's answered
8. **File chip** `.ui-cls__chip` – opens the file's preview `.ui-cls__preview`
9. **Details** `.ui-cls__more` – unfolds `.ui-cls__details`: model, tokens, cost, time and tool calls with results
10. **Composer** `.ui-cls__composer` – the message box, the To picker and Send
11. **New messages** `.ui-cls__new` – appears when messages arrive while you're scrolled up

## Looks

Standard sets the header on a gray tray above a white card that holds the tabs, the log and the composer. Clean is
one white card with the header as its first row and a hairline under it. Both narrow the same way: under 480 px the
model and cost leave the message header (they stay in Details) and the tabs scroll sideways.

Component token: `--tc-collaboration-stream-log-h` – the log's maximum height (420 px).

## Usage

### HTML

```html
<tc-collaboration-stream id="run" heading="Annual field-survey report"></tc-collaboration-stream>

<script type="module">
  import "@adamstavely/trenchcoat/collaboration-stream";
  import "@adamstavely/trenchcoat/tokens.css";

  const stream = document.querySelector("#run");
  stream.participants = [
    { id: "you", name: "You", kind: "person" },
    { id: "orch", name: "Orchestrator", kind: "agent", model: "Opus 5.5" },
    { id: "res", name: "Researcher", kind: "agent", model: "Sonnet 5.5" },
  ];
  stream.messages = [
    { id: "m1", from: "orch", to: "res", at: Date.UTC(2026, 10, 5, 13, 2), text: "Collect the plot counts since 2016." },
    { id: "q1", from: "res", to: "you", at: Date.UTC(2026, 10, 5, 13, 6), kind: "question", text: "Include Upper Meadow?" },
  ];
  stream.addEventListener("tc-send", (e) => console.log(e.detail.text, e.detail.to));
</script>
```

### React / Next.js

```tsx
import { CollaborationStream, type CollabMessage, type CollabParticipant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const participants: CollabParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "orch", name: "Orchestrator", kind: "agent", model: "Opus 5.5" },
  { id: "res", name: "Researcher", kind: "agent", model: "Sonnet 5.5" },
];
const messages: CollabMessage[] = [
  { id: "m1", from: "orch", to: "res", at: Date.UTC(2026, 10, 5, 13, 2), text: "Collect the plot counts since 2016." },
  { id: "q1", from: "res", to: "you", at: Date.UTC(2026, 10, 5, 13, 6), kind: "question", text: "Include Upper Meadow?" },
];

export function Run() {
  return <CollaborationStream title="Annual field-survey report" participants={participants} messages={messages} onSend={(m) => console.log(m.text, m.to)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/collaboration-stream";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";

defineProps<{ participants: TcCollaborationStream["participants"]; messages: TcCollaborationStream["messages"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-collaboration-stream :participants="participants" :messages="messages" @tc-filter-change="onFilterChange"></tc-collaboration-stream>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CollaborationStream } from "@adamstavely/trenchcoat/angular/collaboration-stream";
import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";

@Component({
  selector: "app-collaboration-stream-example",
  imports: [CollaborationStream],
  template: `<tc-collaboration-stream [participants]="participants()" [messages]="messages()" (tc-filter-change)="onFilterChange($event)"></tc-collaboration-stream>`,
})
export class CollaborationStreamExample {
  readonly participants = input.required<TcCollaborationStream["participants"]>();
  readonly messages = input.required<TcCollaborationStream["messages"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/collaboration-stream";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";

  let { participants, messages }: { participants: TcCollaborationStream["participants"]; messages: TcCollaborationStream["messages"] } = $props();
  let el: TcCollaborationStream;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-collaboration-stream bind:this={el} {participants} {messages}></tc-collaboration-stream>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Collaboration"` | The heading |
| `description` | `description` | `string` | `""` | One line under the heading, e.g. the run's goal |
| `participants` | – | `CollabParticipant[]` | `[]` | Everyone in the run – people and agents |
| `messages` | – | `CollabMessage[]` | `[]` | The messages, oldest first |
| `filter` | `filter` | `CollabFilter` | `"everyone"` | The tab on show: "everyone", "you", or an agent's id. Changed by the tabs unless tc-filter-change is prevented |
| `you` | `you` | `string` | `"you"` | The id of the person reading – their messages read "You", and questions to them get an answer box |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.02" |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for times |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | Time zone for times, e.g. "Europe/Berlin" – defaults to the reader's |
| `onSend` | – | `((message: CollabSend) => void \| Promise<unknown>) \| undefined` | `undefined` | Called with every message sent (as well as tc-send). May return a promise: the box waits, and keeps the text if it rejects |
| `hideComposer` | `hide-composer` | `boolean` | `false` | Hides the composer – a read-only stream |
| `labels` | – | `Partial<CollabLabels>` | `{}` | Words the page can rename, merged over defaultCollabLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | A filter tab was picked ({ filter }: CollabFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-send` | – | Yes | A message or an answer was sent ({ text, to, mentions, replyTo }: CollabSend); cancelable – prevented, the text stays in the box |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-collaboration-stream-log-h` | `420px` | standard, clean |

#### Design tokens it reads (101)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-radius-agent`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-inverse-hover`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `participants` | `el.participants = …;` | `<… participants={…} />` | `<tc-collaboration-stream :participants="…">` | `<tc-collaboration-stream [participants]="…">` | `<tc-collaboration-stream {participants}>` |
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-collaboration-stream :messages="…">` | `<tc-collaboration-stream [messages]="…">` | `<tc-collaboration-stream {messages}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-collaboration-stream :formatCost="…">` | `<tc-collaboration-stream [formatCost]="…">` | `<tc-collaboration-stream {formatCost}>` |
| `onSend` | `el.onSend = …;` | `<… onSend={…} />` | `<tc-collaboration-stream :onSend="…">` | `<tc-collaboration-stream [onSend]="…">` | `<tc-collaboration-stream {onSend}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-collaboration-stream :labels="…">` | `<tc-collaboration-stream [labels]="…">` | `<tc-collaboration-stream {labels}>` |

*Also attributes: `heading`, `description`, `filter`, `you`, `locale`, `time-zone`, `hide-composer` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `ref.current.addEventListener("tc-send", …)` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-collaboration-stream id="collaboration-stream"></tc-collaboration-stream>

<script type="module">
  import "@adamstavely/trenchcoat/collaboration-stream";

  const el = document.querySelector("#collaboration-stream");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CollaborationStream } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CollaborationStream>;
type Props = Omit<Own, "filter" | "onFilterChange"> & { initial: NonNullable<Own["filter"]> };

// Controlled: passing filter makes the wrapper prevent the element's own change; the app sets it
export function ControlledCollaborationStream({ initial, ...props }: Props) {
  const [filter, setFilter] = useState<Own["filter"]>(initial);
  return <CollaborationStream {...props} filter={filter} onFilterChange={(next) => setFilter(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/collaboration-stream";
import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";

const props = defineProps<{ initial: TcCollaborationStream["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcCollaborationStream["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-collaboration-stream :filter="filter" @tc-filter-change="onFilterChange"></tc-collaboration-stream>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CollaborationStream } from "@adamstavely/trenchcoat/angular/collaboration-stream";
import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";

@Component({
  selector: "app-controlled-collaboration-stream",
  imports: [CollaborationStream],
  template: `<tc-collaboration-stream [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-collaboration-stream>`,
})
export class ControlledCollaborationStream {
  readonly initial = input.required<TcCollaborationStream["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcCollaborationStream["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/collaboration-stream";
  import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";

  let { initial }: { initial: TcCollaborationStream["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcCollaborationStream;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcCollaborationStream["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-collaboration-stream bind:this={el} {filter}></tc-collaboration-stream>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-collaboration-stream")` returns a `TcCollaborationStream` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";`
- **React / Next.js:** Props: `import type { CollaborationStreamProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CollaborationStream>`. The element class, for refs: `import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCollaborationStream["participants"]` with `import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";`
- **Angular:** The directive types the template: `[participants]` takes `TcCollaborationStream["participants"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCollaborationStream } from "@adamstavely/trenchcoat/collaboration-stream";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `participants` | `CollabParticipant[]` | Everyone in the run – people and agents |
| `messages` | `CollabMessage[]` | The messages, oldest first |
| `title` | `string` | The heading (default "Collaboration") |
| `filter` | `string` | The tab on show: "everyone", "you", or an agent's id. Controlled when defined; otherwise the component keeps it |
| `defaultFilter` | `string` | The tab at first when `filter` isn't controlled |
| `onFilterChange` | `(filter: string) => void` | Called with the tab the user picked |
| `onSend` | `(message: CollabSend) => void \| Promise<unknown>` | Called with every message or answer sent. May return a promise: the box waits, and keeps the text if it rejects |

*Renamed or hidden on the wrapper: `heading`, `filter`, `participants`, `messages`, `onSend`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the selected tab, the log, then each message's chips, answer box and Details, then the composer |
| ← / → | On the tabs: picks the previous or next filter |
| Home / End | On the tabs: picks the first or last filter |
| Enter | In the composer or an answer box: sends. Shift + Enter adds a line |
| @ | In the composer: opens the participant list – ↑ ↓ move, Enter or Tab picks, Escape closes |
| Escape | In a file preview: closes it and returns focus to its chip |

### Screen readers

The tabs are a `tablist` named “Show messages for”; each tab reads its name and count (“Researcher, 2”) and controls
the log, a `tabpanel` named after the filter (“Messages – Everyone”) that can be focused to scroll. The messages are a
list; each one reads who it's from, “to” and who it's for, and its time. A message still being written is
`aria-busy`, and its text isn't announced as it grows: a polite status says “Writer is writing”, then the finished
message (“Writer to Orchestrator: …”). File chips and Details are disclosure buttons with `aria-expanded` and
`aria-controls`; the preview is a region named after the file. An answer box is named after the asker (“Answer
Writer”). A send whose promise rejects shows an alert, “Didn't go through – try again”. Avatars, arrows and icons are
hidden.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | mention-picker | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | mention-picker | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, mention-picker, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | mention-picker | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself, mention-picker | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | mention-picker | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself, mention-picker | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-07 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.6 KB | 10.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [mention-picker](mention-picker.md) · Element it renders | 29.9 KB | – |
| **Added to a page that already has Lit** | **77.0 KB** | **21.9 KB** |
| With Lit – the first component on a page | 98.7 KB | 28.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 256 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of messages replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | messages: first render, 2,149 nodes; update 1.2 ms |
| 1,000 items | 143 ms | messages: first render, 20,949 nodes; update 8.4 ms |

1,000 items of messages: 143 ms. It renders every item, so a first render passes 50 ms (a long task) at about 350 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (mention-picker).
- No timers.
- 3 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (mention-picker), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents by their role in the run (“Researcher”, “Data checker”); put the model in `model`.
- Keep messages to what one agent asked or told another – the work itself belongs in files and details.
- Write a handoff as what happened: “Orchestrator started Researcher”.
- Write a question so it can be answered in a line: “Should the report cover 2023–2024, or 2016 onwards?”.
- Give tool calls a summary that says what they did: “6 searches – plot counts 2016–2025”.

## Do and don't

### Do

- Add the answer the user sends as a new message, and mark the question `answered`.
- Return a promise from `onSend` so the box waits and a failure keeps the text.
- Set `streaming` while a message is being written, and clear it when it's done.

### Don't

- Don't put every token of a long tool result in the message; use `details.tools[].results`.
- Don't use it for a single assistant's chat with a person.
- Don't hide who a message is for – “to everyone” is a choice, not a default to leave unsaid.

## Related

- [Agent Handoff](agent-handoff.md) – A task passed along a chain of agents – at each handoff how much carried over and, in words, what got lost, with the total in the header
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions

## Changelog

- **Collaboration Stream** (`tc-collaboration-stream`): what agents say to each other in a run – from and to on every message, handoffs as slim rows, questions for you with an answer box, file previews, details with tool calls, filter tabs and an @-composer (`tc-send`).
