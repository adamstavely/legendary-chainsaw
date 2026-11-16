<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Sequence

**Agents** · New

One agent run as a sequence diagram – a lifeline for you, every agent and every tool, calls as solid arrows, replies dashed and failures in words, work bars on the lifelines, labelled frames round parallel and retried messages; new messages draw themselves across in a live run, and a click opens a message's or participant's details

- **Element:** `<tc-agent-sequence>`
- **Size:** 10.2 KB gzip · 34.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-sequence";` |
| React / Next.js | `import { AgentSequence } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-sequence";` · tags starting with tc- are custom elements |
| Angular | `import { AgentSequence } from "@adamstavely/trenchcoat/angular/agent-sequence";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-sequence";` |

## Example

The live example is in the gallery at `#/agent-sequence`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One agent run as a sequence diagram. You, every agent and every tool get a column – a lifeline – and each message is
an arrow from one lifeline to another, in the order it was sent: calls are solid, replies dashed, and a failure is in
the danger tone with the word "Failed" on its tag. A bar on a lifeline shows a participant at work, from the call it
got to the answer it sent; while it hasn't answered, the bar runs to the bottom and its head says "Working". Labelled
frames gather messages that ran in parallel and messages that were retried. In a live run every new message draws
itself across with a light at its tip, and the diagram follows the newest one unless the reader has scrolled up.
Picking a message or a participant opens a details card under the diagram.

### When to use

- Showing who talked to whom in one agent run – you, the agents and the tools they called, message by message.
- Debugging a multi-agent run: which call waited on which reply, what ran in parallel, where a retry happened and
  what failed.
- A live view of a run as it happens.

### When not to use

- How long each step took on a time axis – use [Trace Waterfall](trace-waterfall.md).
- Many agents over a long stretch of time, lane by lane – use [Agent Lanes](agent-lanes.md).
- What agents actually said, as a conversation – use [Collaboration Stream](collaboration-stream.md).
- The structure of a crew rather than its messages – use [Agent Tree](agent-tree.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Heads** `.ui-aseq__heads` – a button per participant `.ui-aseq__head` with its mark `.ui-aseq__avatar`, name `.ui-aseq__name` and role or "Working" `.ui-aseq__role`
2. **Lifelines** `.ui-aseq__lanes` – a dashed line per participant `.ui-aseq__lane`, with work bars `.ui-aseq__active`
3. **Frames** `.ui-aseq__frame` – a parallel or retried group, with its tag `.ui-aseq__frame-tag`
4. **Messages** `.ui-aseq__msgs` – a button per message `.ui-aseq__msg`, its arrow `.ui-aseq__arrow` with the line `.ui-aseq__line` and its tag `.ui-aseq__label`
5. **Details** `.ui-aseq__detail` – the picked message's or participant's card, with Close `.ui-aseq__close`
6. **Empty** `.ui-aseq__empty` – "No messages yet"

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. A call's line and tag are in the primary ink, a reply's are dashed and muted, and a failure's are in the danger
tone with a cross and the word "Failed", so colour is never the only cue. Agents have an accent-tinted mark, tools a
gray one and you a round one. Parallel frames have a solid edge; retry frames a dashed amber one. A page can set
`--tc-aseq-col` (a column's least width), `--tc-aseq-row` (a message's height), `--tc-aseq-max-h` (the height
before the diagram scrolls) and the inks `--tc-aseq-call`, `--tc-aseq-reply` and `--tc-aseq-error`. When the card
is narrower than its columns need, the diagram scrolls sideways, and the heads stay on top while it scrolls down.

## Usage

### HTML

```html
<tc-agent-sequence id="sequence" subtitle="Q3 water-quality report"></tc-agent-sequence>

<script type="module">
  import "@adamstavely/trenchcoat/agent-sequence";
  import "@adamstavely/trenchcoat/tokens.css";

  const sequence = document.querySelector("#sequence");
  sequence.participants = [
    { id: "you", name: "You", kind: "user" },
    { id: "planner", name: "Planner", kind: "agent", detail: "large-1" },
    { id: "researcher", name: "Researcher", kind: "agent" },
    { id: "pdf", name: "PDF reader", kind: "tool" },
  ];
  sequence.groups = [{ id: "retry", kind: "retry", label: "2nd try" }];
  sequence.messages = [
    { id: "m1", from: "you", to: "planner", kind: "call", label: "Draft the Q3 report" },
    { id: "m2", from: "planner", to: "researcher", kind: "call", label: "Gather the data" },
    { id: "m3", from: "researcher", to: "pdf", kind: "call", label: "read lab-results.pdf" },
    { id: "m4", from: "pdf", to: "researcher", kind: "error", label: "page 4 unreadable" },
    { id: "m5", from: "researcher", to: "pdf", kind: "call", label: "read with OCR", group: "retry" },
    { id: "m6", from: "pdf", to: "researcher", kind: "reply", label: "42 rows", group: "retry" },
    { id: "m7", from: "researcher", to: "planner", kind: "reply", label: "Data and sources" },
  ];
  sequence.addEventListener("tc-open-change", (e) => console.log(e.detail.openId));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentSequence, type SequenceMessage, type SequenceParticipant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunSequence({ participants, messages, live }: { participants: SequenceParticipant[]; messages: SequenceMessage[]; live: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <AgentSequence participants={participants} messages={messages} live={live} openId={openId} onOpenChange={setOpenId} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-sequence";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";

defineProps<{ participants: TcAgentSequence["participants"]; messages: TcAgentSequence["messages"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-sequence :participants="participants" :messages="messages" @tc-open-change="onOpenChange"></tc-agent-sequence>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentSequence } from "@adamstavely/trenchcoat/angular/agent-sequence";
import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";

@Component({
  selector: "app-agent-sequence-example",
  imports: [AgentSequence],
  template: `<tc-agent-sequence [participants]="participants()" [messages]="messages()" (tc-open-change)="onOpenChange($event)"></tc-agent-sequence>`,
})
export class AgentSequenceExample {
  readonly participants = input.required<TcAgentSequence["participants"]>();
  readonly messages = input.required<TcAgentSequence["messages"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-sequence";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";

  let { participants, messages }: { participants: TcAgentSequence["participants"]; messages: TcAgentSequence["messages"] } = $props();
  let el: TcAgentSequence;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-agent-sequence bind:this={el} {participants} {messages}></tc-agent-sequence>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agent sequence"` | The heading; empty leaves the header out |
| `subtitle` | `subtitle` | `string` | `""` | A line under the heading – the run or the task |
| `participants` | – | `SequenceParticipant[]` | `[]` | The lifelines, left to right: you, the agents and the tools |
| `messages` | – | `SequenceMessage[]` | `[]` | The messages, in the order they were sent |
| `groups` | – | `SequenceGroup[]` | `[]` | Frames around messages that ran in parallel or were retried |
| `openId` | `open-id` | `string \| null` | `null` | Id of the message or participant whose details are open |
| `live` | `live` | `boolean` | `false` | A live run: new messages draw themselves across and the diagram follows the newest |
| `labels` | – | `Partial<AgentSequenceLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A message's or a participant's details opened or closed ({ openId, message, participant }: AgentSequenceOpenChange); cancelable – prevented, `openId` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-aseq-col` | `9rem` | both |
| `--tc-aseq-row` | `44px` | both |
| `--tc-aseq-max-h` | `30rem` | both |
| `--tc-aseq-bar-w` | `8px` | both |
| `--tc-aseq-nest` | `4px` | both |
| `--tc-aseq-line-y` | `30px` | both |
| `--tc-aseq-head` | `4px` | both |
| `--tc-aseq-call` | `var(--tc-text-primary)` | both |
| `--tc-aseq-reply` | `var(--tc-text-muted)` | both |
| `--tc-aseq-error` | `var(--tc-status-danger-fg)` | both |
| `--tc-aseq-lifeline` | `var(--tc-border-default)` | both |
| `--tc-aseq-activation` | `light-dark(color-mix(in oklab, var(--tc-accent) 22%, var(--tc-surface-raised)), color-mix(in oklab, var(--tc-accent) 38%, var(--tc-surface-raised)))` | both |

#### Design tokens it reads (64)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-aseq-cols`, `--tc-aseq-depth`, `--tc-aseq-from`, `--tc-aseq-ink`, `--tc-aseq-left`, `--tc-aseq-n`, `--tc-aseq-rows`, `--tc-aseq-span`, `--tc-aseq-span-cols`, `--tc-aseq-surface`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-lg`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-slow`, `--tc-ease-out`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `sequenceActivations(messages: SequenceMessage[]): SequenceActivation[]` | The bars on the lifelines: one per call, from the call's row to the row of the answer it got |

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
| `participants` | `el.participants = …;` | `<… participants={…} />` | `<tc-agent-sequence :participants="…">` | `<tc-agent-sequence [participants]="…">` | `<tc-agent-sequence {participants}>` |
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-agent-sequence :messages="…">` | `<tc-agent-sequence [messages]="…">` | `<tc-agent-sequence {messages}>` |
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-agent-sequence :groups="…">` | `<tc-agent-sequence [groups]="…">` | `<tc-agent-sequence {groups}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-sequence :labels="…">` | `<tc-agent-sequence [labels]="…">` | `<tc-agent-sequence {labels}>` |

*Also attributes: `heading`, `subtitle`, `open-id`, `live` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-open-change` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-sequence")` returns a `TcAgentSequence` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";`
- **React / Next.js:** Props: `import type { AgentSequenceProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentSequence>`. The element class, for refs: `import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentSequence["participants"]` with `import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";`
- **Angular:** The directive types the template: `[participants]` takes `TcAgentSequence["participants"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentSequence } from "@adamstavely/trenchcoat/agent-sequence";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `participants` | `SequenceParticipant[]` | The lifelines, left to right: you, the agents and the tools |
| `openId` | `string \| null` | Controlled id of the message or participant whose details are open |
| `defaultOpenId` | `string \| null` | The open id on mount when `openId` isn't controlled |
| `onOpenChange` | `(openId: string \| null, item?: SequenceMessage \| SequenceParticipant) => void` | Called when details open (with the message or participant) or close (null) |

*Renamed or hidden on the wrapper: `heading`, `participants`, `openId`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the participants and the messages – one stop each |
| ← / → | Moves between participants, or between messages |
| ↑ / ↓ | Moves between messages |
| Home / End | Goes to the first or last |
| Enter / Space | Opens or closes the details |
| Escape | Closes the details and returns to what opened them |

### Screen readers

The participants are a toolbar of buttons; the messages are an ordered list of buttons, each named by its tag and then,
in screen-reader-only words, who sent it to whom, its kind and its frame ("Gather Q3 sampling data, Planner to
Researcher, Call"). Each button says whether its details are expanded and points to the details region. The arrows,
lifelines, bars and frames are drawn and hidden. A live run says each new message in a `role="status"` region.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.2 KB | 7.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.9 KB** | **10.2 KB** |
| With Lit – the first component on a page | 55.6 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 213 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of messages replaced |
| First on the page | 8.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.0 ms | messages: first render, 782 nodes; update 0.6 ms |
| 1,000 items | 37 ms | messages: first render, 6,782 nodes; update 6.4 ms |

1,000 items of messages: 37 ms, 6,782 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give participants short names – they share a column's width with their mark.
- Keep a message's `label` to a few words; put the full text in `input` or `output` for the details.
- Ids must be unique across messages and participants, since `openId` can be either.
- Use `group` for messages that ran together or were retried, and name the frame in `groups`.

## Do and don't

### Do

- Pass `start` and `end` (ms from the start of the run) so the details can say when a message was sent and how long
  its answer took.
- Set `live` while the run is going, and turn it off when it ends.

### Don't

- Don't use it for runs with hundreds of messages – group them first, or use `trace-waterfall`.
- Don't put secrets in labels or previews – the details show them as they are.

## Related

- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Collaboration Stream](collaboration-stream.md) – What agents say to each other in a run, as a quiet chat – who to whom on every message, handoffs as slim rows, questions for you with an answer box, files that preview, details with tool calls, filter tabs and an @-composer
- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
