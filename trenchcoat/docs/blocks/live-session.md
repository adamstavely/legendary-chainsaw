<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Live Session

**Blocks** · New

Work with a team of agents while they work – their conversation with a composer in the middle, the team's plan ticking off beside it, the shared context under it; picking an agent points at its steps and its messages (uses `collaboration-stream`, `meter-row`, `segmented-control`)

- **Element:** `<tc-live-session>`
- **Size:** 34.9 KB gzip · 135.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/live-session";` |
| React / Next.js | `import { LiveSession } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/live-session";` · tags starting with tc- are custom elements |
| Angular | `import { LiveSession } from "@adamstavely/trenchcoat/angular/live-session";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/live-session";` |

## Example

The live example is in the gallery at `#/blocks/live-session`, in both looks; Replay restarts its animations.

## Overview

Work with a team of agents while they work. In the middle, what they say to each other and to you, in the library's
Collaboration Stream with its composer. Beside it, the team's plan ticking off step by step, each step with the agent
it belongs to. Under the plan, how full the shared context is, in the library's Meter Row. Pick an agent at the top
and its steps stand out in the plan while the others go quiet, and the stream shows that agent's messages; picking an
agent's tab in the stream picks it here too. Narrow, the plan goes under the stream.

### When to use

- A workspace where a person works alongside several agents on one job and answers their questions as they come.
- Following one agent's part of the plan without losing the rest of the team.
- Keeping an eye on the shared context while the team talks.

### When not to use

- The conversation on its own – use [Collaboration Stream](../components/collaboration-stream.md).
- One agent's plan – use [Agent Plan](../components/agent-plan.md).
- When each agent was busy over time – use [Agent Lanes](../components/agent-lanes.md).
- What fills the context and why – use [Context Window](../components/context-window.md).

## Anatomy

1. **Intro** `.ui-lses__intro` – the heading and the agent picker
2. **Stream** `.ui-lses__stream` – the Collaboration Stream, with its tabs and composer
3. **Plan** `.ui-lses__plan` – the team's steps, with how many are done
4. **Step** `.ui-lses__step` – a step's mark, title, detail and agent
5. **Context** `.ui-lses__context` – how full the shared context is

## Looks

The block is a page section, not a card. In Standard the plan is a gray tray with its steps on a white card; in Clean
it's one white card. The stream and the meter carry the look the rest of the way. The picked agent's steps take the
accent tint with a bar on the left; the others' titles go muted but stay readable.

## Usage

### HTML

```html
<tc-live-session id="live" context="0.62" context-text="124k of 200k tokens" agent="scheduler"></tc-live-session>

<script type="module">
  import "@adamstavely/trenchcoat/live-session";
  import "@adamstavely/trenchcoat/tokens.css";

  const T = Date.UTC(2026, 10, 14, 9, 0);
  const MIN = 60_000;
  const live = document.querySelector("#live");
  live.participants = [
    { id: "you", name: "You", kind: "person" },
    { id: "planner", name: "Planner", kind: "agent", model: "Sonnet 5.5" },
    { id: "scheduler", name: "Scheduler", kind: "agent", model: "Opus 5.5" },
  ];
  live.messages = [
    { id: "m1", from: "planner", to: "everyone", at: T - 12 * MIN, text: "41 of 212 stops change on 8 December." },
    { id: "m2", from: "scheduler", to: "you", at: T - 6 * MIN, kind: "question", text: "Should the notice publish route 31's earlier last run?" },
  ];
  live.steps = [
    { id: "s1", title: "List the stops that change", agentId: "planner", status: "done" },
    { id: "s2", title: "Route 31's last run", agentId: "scheduler", status: "active", detail: "Waiting for your answer" },
    { id: "s3", title: "Send to the print shop", status: "pending" },
  ];
  live.onSend = (message) => console.log(message.text, message.to);
  live.addEventListener("tc-agent-change", (e) => console.log(e.detail.agent));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { LiveSession, type LiveSessionMessage, type LiveSessionParticipant, type LiveSessionStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const T = Date.UTC(2026, 10, 14, 9, 0);
const MIN = 60_000;

const team: LiveSessionParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "translator", name: "Translator", kind: "agent", model: "Sonnet 5.5" },
];
const messages: LiveSessionMessage[] = [
  { id: "m1", from: "translator", to: "everyone", at: T - 3 * MIN, text: "Spanish is done. Waiting on the route-name glossary." },
];
const steps: LiveSessionStep[] = [
  { id: "s1", title: "Translate into Spanish", agentId: "translator", status: "done" },
  { id: "s2", title: "Translate into Vietnamese", agentId: "translator", status: "failed", detail: "Needs the route-name glossary" },
];

export function Session() {
  const [agent, setAgent] = useState<string | null>(null);
  return (
    <LiveSession
      participants={team}
      messages={messages}
      steps={steps}
      context={0.62}
      contextText="124k of 200k tokens"
      agent={agent}
      onAgentChange={(id) => setAgent(id)}
      onSend={async (message) => console.log(message.text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/live-session";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";

defineProps<{ participants: TcLiveSession["participants"]; messages: TcLiveSession["messages"] }>();
const onAgentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-live-session :participants="participants" :messages="messages" @tc-agent-change="onAgentChange"></tc-live-session>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LiveSession } from "@adamstavely/trenchcoat/angular/live-session";
import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";

@Component({
  selector: "app-live-session-example",
  imports: [LiveSession],
  template: `<tc-live-session [participants]="participants()" [messages]="messages()" (tc-agent-change)="onAgentChange($event)"></tc-live-session>`,
})
export class LiveSessionExample {
  readonly participants = input.required<TcLiveSession["participants"]>();
  readonly messages = input.required<TcLiveSession["messages"]>();
  onAgentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/live-session";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";

  let { participants, messages }: { participants: TcLiveSession["participants"]; messages: TcLiveSession["messages"] } = $props();
  let el: TcLiveSession;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-agent-change", on);
    return () => el.removeEventListener("tc-agent-change", on);
  });
</script>

<tc-live-session bind:this={el} {participants} {messages}></tc-live-session>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Live session"` | The heading |
| `participants` | – | `CollabParticipant[]` | `[]` | You and the agents – the Collaboration Stream's `participants` |
| `messages` | – | `CollabMessage[]` | `[]` | What they said – the Collaboration Stream's `messages` |
| `you` | `you` | `string` | `"you"` | Your participant id |
| `onSend` | – | `((message: CollabSend) => void \| Promise<unknown>) \| undefined` | `undefined` | Runs when you send a message or an answer; it may return a promise – the Collaboration Stream's `onSend` |
| `steps` | – | `LiveSessionStep[]` | `[]` | The team's plan, in order |
| `context` | `context` | `number \| undefined` | `undefined` | How full the shared context is, from 0 to 1; without it, the meter is left out |
| `contextText` | `context-text` | `string` | `""` | The meter's value in words, e.g. "124k of 200k tokens" – a percentage by default |
| `agent` | `agent` | `string \| null` | `null` | The picked agent's id, or null for the whole team. Changed by the user unless a tc-agent-change listener calls preventDefault() |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost in the stream – dollars by default |
| `locale` | `locale` | `string \| undefined` | `undefined` | A locale for the stream's times |
| `timeZone` | `time-zone` | `string \| undefined` | `undefined` | A time zone for the stream's times, e.g. "Europe/Vienna" |
| `labels` | – | `Partial<LiveSessionLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-agent-change` | – | Yes | An agent was picked, or the whole team ({ agent, participant }: LiveSessionAgentChange); cancelable – prevented, `agent` stays as it was |

#### Design tokens it reads (46)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-duration-base`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-head-glyph-stroke`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `participants` | `el.participants = …;` | `<… participants={…} />` | `<tc-live-session :participants="…">` | `<tc-live-session [participants]="…">` | `<tc-live-session {participants}>` |
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-live-session :messages="…">` | `<tc-live-session [messages]="…">` | `<tc-live-session {messages}>` |
| `onSend` | `el.onSend = …;` | `<… onSend={…} />` | `<tc-live-session :onSend="…">` | `<tc-live-session [onSend]="…">` | `<tc-live-session {onSend}>` |
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-live-session :steps="…">` | `<tc-live-session [steps]="…">` | `<tc-live-session {steps}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-live-session :formatCost="…">` | `<tc-live-session [formatCost]="…">` | `<tc-live-session {formatCost}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-live-session :labels="…">` | `<tc-live-session [labels]="…">` | `<tc-live-session {labels}>` |

*Also attributes: `heading`, `you`, `context`, `context-text`, `agent`, `locale`, `time-zone` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-agent-change` | Yes | `el.addEventListener("tc-agent-change", (e) => …)` | `onAgentChange={…}` | `@tc-agent-change="…"` | `(tc-agent-change)="…($event)"` | `el.addEventListener("tc-agent-change", …)` |

### Controlled

The element changes `agent` itself unless a listener calls `preventDefault()` on `tc-agent-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-live-session id="live-session"></tc-live-session>

<script type="module">
  import "@adamstavely/trenchcoat/live-session";

  const el = document.querySelector("#live-session");
  el.addEventListener("tc-agent-change", (e) => {
    e.preventDefault(); // the element keeps its agent…
    if (allowed(e.detail.agent)) el.agent = e.detail.agent; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { LiveSession } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof LiveSession>;
type Props = Omit<Own, "agent" | "onAgentChange"> & { initial: NonNullable<Own["agent"]> };

// Controlled: passing agent makes the wrapper prevent the element's own change; the app sets it
export function ControlledLiveSession({ initial, ...props }: Props) {
  const [agent, setAgent] = useState<Own["agent"]>(initial);
  return <LiveSession {...props} agent={agent} onAgentChange={(next) => setAgent(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/live-session";
import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";

const props = defineProps<{ initial: TcLiveSession["agent"] }>();
const agent = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAgentChange = (e: CustomEvent<{ agent: TcLiveSession["agent"] }>) => {
  e.preventDefault();
  agent.value = e.detail.agent;
};
</script>

<template>
  <tc-live-session :agent="agent" @tc-agent-change="onAgentChange"></tc-live-session>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LiveSession } from "@adamstavely/trenchcoat/angular/live-session";
import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";

@Component({
  selector: "app-controlled-live-session",
  imports: [LiveSession],
  template: `<tc-live-session [agent]="agent()" (tc-agent-change)="onAgentChange($event)"></tc-live-session>`,
})
export class ControlledLiveSession {
  readonly initial = input.required<TcLiveSession["agent"]>();
  readonly agent = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAgentChange(e: CustomEvent<{ agent: TcLiveSession["agent"] }>) {
    e.preventDefault();
    this.agent.set(e.detail.agent);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/live-session";
  import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";

  let { initial }: { initial: TcLiveSession["agent"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let agent = $derived(initial);
  let el: TcLiveSession;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      agent = (e as CustomEvent<{ agent: TcLiveSession["agent"] }>).detail.agent;
    };
    el.addEventListener("tc-agent-change", on);
    return () => el.removeEventListener("tc-agent-change", on);
  });
</script>

<tc-live-session bind:this={el} {agent}></tc-live-session>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-live-session")` returns a `TcLiveSession` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";`
- **React / Next.js:** Props: `import type { LiveSessionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LiveSession>`. The element class, for refs: `import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLiveSession["participants"]` with `import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";`
- **Angular:** The directive types the template: `[participants]` takes `TcLiveSession["participants"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLiveSession } from "@adamstavely/trenchcoat/live-session";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading (default "Live session") |
| `agent` | `string \| null` | The picked agent's id, or null for the whole team. Controlled when defined |
| `defaultAgent` | `string \| null` | The agent at first when uncontrolled – the whole team by default |
| `onAgentChange` | `(agent: string \| null, participant: CollabParticipant \| null) => void` | Called with the picked agent (null for the whole team) |

*Renamed or hidden on the wrapper: `heading`, `agent`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the agent picker, the stream's tabs, log, messages and composer |
| ← / → | In the agent picker or the stream's tabs, picks the previous or next one |
| Enter | In the composer or an answer box: sends. Shift + Enter adds a line |

The stream keeps its own keys – @ to name a participant, Escape to close a file preview.

### Screen readers

The heading is the block's heading. The agent picker is a radio group named “Show agent”, with “Whole team” first. The
plan is a region named “Plan”, with its progress beside the title – “4 of 8 done”; each step reads its title and its
status in a word – “Up next”, “In progress”, “Done”, “Failed” or “Skipped” – and its agent. With an agent picked, a
line above the steps says “Scheduler: 2 steps”. The context is a `meter` named “Shared context” with its value in
words. Marks are hidden. The stream announces its own messages.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, collaboration-stream | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | collaboration-stream, mention-picker, internal/kit, meter-row, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | mention-picker | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | mention-picker, meter-row | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, collaboration-stream, mention-picker, internal/base, meter-row, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | mention-picker, segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | collaboration-stream, mention-picker, segmented-control | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | mention-picker | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, collaboration-stream, mention-picker, internal/card-head, internal/kit, meter-row, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | collaboration-stream, mention-picker, segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 12.8 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [mention-picker](../components/mention-picker.md) · Element it renders | 39.8 KB | – |
| [collaboration-stream](../components/collaboration-stream.md) · Element it renders | 34.1 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [meter-row](../components/meter-row.md) · Element it renders | 6.3 KB | – |
| **Added to a page that already has Lit** | **135.0 KB** | **34.9 KB** |
| With Lit – the first component on a page | 156.9 KB | 42.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | default properties, 67 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (mention-picker), `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- 3 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (mention-picker), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (segmented-control).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each step a short `title` and the `agentId` of the participant it belongs to; leave it out for a step the team
  shares.
- Use a step's `detail` for why it stands still: “Waiting for your answer”.
- Give the context in words with `context-text`: “124k of 200k tokens”. Leave out `context` to leave out the meter.
- Set `you` to your participant id when it isn't “you”.
- Rename the words with `labels`, e.g. `{ team: "Everyone" }`.

## Do and don't

### Do

- Listen for `tc-agent-change` (`onAgentChange` in React) to follow the picked agent elsewhere on the page.
- Return a promise from `onSend` so the composer waits and a failure is shown.
- Ask the person questions as messages with `kind: "question"`, so they get an answer box.

### Don't

- Don't put the plan's steps in the stream as messages – the plan is beside it.
- Don't give every step an agent's name in its title; the chip says whose it is.
- Don't put it in a card – it's a page section.

## Related

- [Collaboration Stream](../components/collaboration-stream.md) – What agents say to each other in a run, as a quiet chat – who to whom on every message, handoffs as slim rows, questions for you with an answer box, files that preview, details with tool calls, filter tabs and an @-composer
- [Agent Plan](../components/agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step
- [Context Window](../components/context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Meter Row](../components/meter-row.md) – How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.
- [Agent Lanes](../components/agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
