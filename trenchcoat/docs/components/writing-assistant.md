<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Writing Assistant

**AI & chat**

AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation

- **Element:** `<tc-writing-assistant>`
- **Size:** 12.8 KB gzip · 50.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/writing-assistant";` |
| React / Next.js | `import { WritingAssistant } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/writing-assistant";` · tags starting with tc- are custom elements |
| Angular | `import { WritingAssistant } from "@adamstavely/trenchcoat/angular/writing-assistant";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/writing-assistant";` |

## Example

The live example is in the gallery at `#/writing-assistant`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A compact AI chat card for writing help. It opens on a welcome line with suggestion chips over a soft glow; people pick
a suggestion, type, or dictate – the spoken words appear live in the field, and the finished text waits there to be
sent. Replies stream in word by word. It gives a product a small, friendly place to ask for a draft, a shorter
version or a different tone, without a full chat screen.

### When to use

- A side panel or popover for help with writing – drafting, shortening, changing the tone.
- A focused assistant with a name and a few starting suggestions.
- Where dictation helps – on touch devices, or for people who'd rather speak than type.

### When not to use

- The message box of a full chat screen, with attachments and model choice – use [Chat Composer](chat-composer.md).
- A spoken conversation with the assistant talking back – use [Voice Mode](voice-mode.md).
- Reviewing an email an agent already wrote – use [Email Draft](email-draft.md).
- One long answer with sources, not a conversation – use [AI Answer](ai-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the assistant's name, its tagline and New chat
2. **Welcome** `.ui-wa__welcome` – the greeting and the suggestion chips, before the first message
3. **Suggestion** `.ui-wa__chip` – a starting prompt; picking it sends it
4. **Prompt field** `.ui-wa__field` – grows to four lines, then scrolls
5. **Mic** `.ui-wa__mic` – starts and stops dictation

## Looks

Standard puts the header on a gray tray above a white panel: a large greeting over a strong pink-violet-blue glow, a pill-shaped
field with Send inside it, a round mic beside it, and three dots while a reply is on its way. Clean is a quieter white
card with a hairline under the header; the greeting is smaller, the glow fainter,
the mic and Send sit in the field's row, and a shimmering “Writing…” replaces the dots.

## Usage

### HTML

```html
<tc-writing-assistant id="quill" name="Quill" greeting="What should we write?"></tc-writing-assistant>

<script type="module">
  import "@adamstavely/trenchcoat/writing-assistant";
  import "@adamstavely/trenchcoat/tokens.css";

  const quill = document.querySelector("#quill");
  quill.suggestions = ["Polish my email", "Make it shorter"];
  quill.respond = (message, { signal, history }) =>
    fetch("/api/write", { method: "POST", body: JSON.stringify({ message, history }), signal }).then((r) => r.text());
  quill.addEventListener("tc-messages-change", (e) => console.log(e.detail.messages.length));
</script>
```

### React / Next.js

```tsx
import { WritingAssistant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Quill({ write }: { write: (message: string, signal: AbortSignal) => Promise<string> }) {
  return (
    <WritingAssistant
      name="Quill"
      greeting="What should we write?"
      suggestions={["Polish my email", "Make it shorter"]}
      respond={(message, { signal }) => write(message, signal)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/writing-assistant";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";

defineProps<{ suggestions: TcWritingAssistant["suggestions"]; respond: TcWritingAssistant["respond"] }>();
const onMessagesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-writing-assistant :suggestions="suggestions" :respond="respond" @tc-messages-change="onMessagesChange"></tc-writing-assistant>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WritingAssistant } from "@adamstavely/trenchcoat/angular/writing-assistant";
import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";

@Component({
  selector: "app-writing-assistant-example",
  imports: [WritingAssistant],
  template: `<tc-writing-assistant [suggestions]="suggestions()" [respond]="respond()" (tc-messages-change)="onMessagesChange($event)"></tc-writing-assistant>`,
})
export class WritingAssistantExample {
  readonly suggestions = input.required<TcWritingAssistant["suggestions"]>();
  readonly respond = input.required<TcWritingAssistant["respond"]>();
  onMessagesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/writing-assistant";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";

  let { suggestions, respond }: { suggestions: TcWritingAssistant["suggestions"]; respond: TcWritingAssistant["respond"] } = $props();
  let el: TcWritingAssistant;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-messages-change", on);
    return () => el.removeEventListener("tc-messages-change", on);
  });
</script>

<tc-writing-assistant bind:this={el} {suggestions} {respond}></tc-writing-assistant>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `"Quill"` | The assistant's name, in the header |
| `tagline` | `tagline` | `string` | `"Your writing companion."` | Short line under the name |
| `greeting` | `greeting` | `string` | `"What should we write?"` | Big line on the welcome screen |
| `suggestions` | – | `string[]` | `["Polish my email", "Make it shorter", "Fix the tone", "Draft a reply"]` | Chips on the welcome screen; picking one sends it as a message |
| `placeholder` | `placeholder` | `string` | `"Ask anything…"` | Text in the empty prompt field |
| `respond` | – | `WritingAssistantRespond \| undefined` | `undefined` | Your answer for a message – return text or a promise of text. A rejected promise shows an error and lets the message be sent again. `signal` aborts when the chat is reset or the element is removed. Without it a sample writer answers (and warns once, unless `demo` is set). `history` is the conversation so far, ending with this message |
| `messages` | – | `ChatMessage[]` | `[]` | The conversation. Changed by the element unless a tc-messages-change listener calls preventDefault() |
| `draft` | `draft` | `string` | `""` | Text in the prompt field. Changed by the element unless a tc-draft-change listener calls preventDefault() |
| `speech` | `speech` | `"auto" \| "simulate"` | `"auto"` | "auto" uses real speech recognition when the browser has it and shows an error otherwise (or plays the sample take with `demo`); "simulate" always plays a sample take |
| `demo` | `demo` | `boolean` | `false` | Demo mode: the sample writer answers without a warning, and dictation plays the sample take where the browser has no speech recognition |
| `dictation` | `dictation` | `string` | `"Write a friendly reminder that the report is due on Friday"` | Sample sentence for simulated dictation |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-messages-change` | – | Yes | A message was added or the chat was reset ({ messages }: ChatMessagesChange, the whole conversation); cancelable |
| `tc-draft-change` | – | Yes | The text in the prompt field changed ({ draft }: ChatDraftChange); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-writing-assistant-field-bg` | `light-dark(#ffffff, #2a2a2d)` | standard |
| `--tc-writing-assistant-bubble-bg` | `light-dark(rgba(255, 255, 255, 0.85), rgba(42, 42, 45, 0.85))` | standard |
| `--tc-writing-assistant-glow` | `0.14` | standard, clean |
| `--tc-writing-assistant-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | clean |
| `--tc-writing-assistant-pulse` | `light-dark(rgba(0, 96, 226, 0.22), rgba(77, 141, 255, 0.3))` | clean |

#### Design tokens it reads (69)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-pink-solid`, `--tc-tone-violet-solid`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `suggestions` | `el.suggestions = …;` | `<… suggestions={…} />` | `<tc-writing-assistant :suggestions="…">` | `<tc-writing-assistant [suggestions]="…">` | `<tc-writing-assistant {suggestions}>` |
| `respond` | `el.respond = …;` | `<… respond={…} />` | `<tc-writing-assistant :respond="…">` | `<tc-writing-assistant [respond]="…">` | `<tc-writing-assistant {respond}>` |
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-writing-assistant :messages="…">` | `<tc-writing-assistant [messages]="…">` | `<tc-writing-assistant {messages}>` |

*Also attributes: `name`, `tagline`, `greeting`, `placeholder`, `draft`, `speech`, `demo`, `dictation` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-messages-change` | Yes | `el.addEventListener("tc-messages-change", (e) => …)` | `onMessagesChange={…}` | `@tc-messages-change="…"` | `(tc-messages-change)="…($event)"` | `el.addEventListener("tc-messages-change", …)` |
| `tc-draft-change` | Yes | `el.addEventListener("tc-draft-change", (e) => …)` | `onDraftChange={…}` | `@tc-draft-change="…"` | `(tc-draft-change)="…($event)"` | `el.addEventListener("tc-draft-change", …)` |

### Controlled

The element changes `messages` and `draft` itself unless a listener calls `preventDefault()` on `tc-messages-change` or `tc-draft-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-writing-assistant id="writing-assistant"></tc-writing-assistant>

<script type="module">
  import "@adamstavely/trenchcoat/writing-assistant";

  const el = document.querySelector("#writing-assistant");
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
import { WritingAssistant } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof WritingAssistant>;
type Props = Omit<Own, "messages" | "onMessagesChange"> & { initial: NonNullable<Own["messages"]> };

// Controlled: passing messages makes the wrapper prevent the element's own change; the app sets it
export function ControlledWritingAssistant({ initial, ...props }: Props) {
  const [messages, setMessages] = useState<Own["messages"]>(initial);
  return <WritingAssistant {...props} messages={messages} onMessagesChange={(next) => setMessages(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/writing-assistant";
import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";

const props = defineProps<{ initial: TcWritingAssistant["messages"] }>();
const messages = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMessagesChange = (e: CustomEvent<{ messages: TcWritingAssistant["messages"] }>) => {
  e.preventDefault();
  messages.value = e.detail.messages;
};
</script>

<template>
  <tc-writing-assistant :messages="messages" @tc-messages-change="onMessagesChange"></tc-writing-assistant>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { WritingAssistant } from "@adamstavely/trenchcoat/angular/writing-assistant";
import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";

@Component({
  selector: "app-controlled-writing-assistant",
  imports: [WritingAssistant],
  template: `<tc-writing-assistant [messages]="messages()" (tc-messages-change)="onMessagesChange($event)"></tc-writing-assistant>`,
})
export class ControlledWritingAssistant {
  readonly initial = input.required<TcWritingAssistant["messages"]>();
  readonly messages = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMessagesChange(e: CustomEvent<{ messages: TcWritingAssistant["messages"] }>) {
    e.preventDefault();
    this.messages.set(e.detail.messages);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/writing-assistant";
  import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";

  let { initial }: { initial: TcWritingAssistant["messages"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let messages = $derived(initial);
  let el: TcWritingAssistant;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      messages = (e as CustomEvent<{ messages: TcWritingAssistant["messages"] }>).detail.messages;
    };
    el.addEventListener("tc-messages-change", on);
    return () => el.removeEventListener("tc-messages-change", on);
  });
</script>

<tc-writing-assistant bind:this={el} {messages}></tc-writing-assistant>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-writing-assistant")` returns a `TcWritingAssistant` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";`
- **React / Next.js:** Props: `import type { WritingAssistantProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WritingAssistant>`. The element class, for refs: `import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWritingAssistant["suggestions"]` with `import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";`
- **Angular:** The directive types the template: `[suggestions]` takes `TcWritingAssistant["suggestions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWritingAssistant } from "@adamstavely/trenchcoat/writing-assistant";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `messages` | `ChatMessage[]` | The conversation (controlled) – read it, seed it or restore it; new messages are asked for through `onMessagesChange` |
| `defaultMessages` | `ChatMessage[]` | Starting conversation when `messages` isn't controlled |
| `onMessagesChange` | `(messages: ChatMessage[]) => void` | Called with the whole conversation whenever a message is added or the chat is reset |
| `draft` | `string` | Text in the prompt field (controlled) |
| `defaultDraft` | `string` | Starting text in the prompt field when `draft` isn't controlled |
| `onDraftChange` | `(draft: string) => void` | Called with the field's new text whenever it changes – typing, dictation, or clearing after a send |

*Renamed or hidden on the wrapper: `messages`, `draft`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through New chat (once there are messages), the chips, the field, the mic and Send |
| Enter | In the field, sends the message |
| Shift Enter | In the field, starts a new line |
| Enter / Space | On a chip, sends it; on the mic, starts or stops dictation |

### Screen readers

The field is named “Message”; while dictating it is read-only and its placeholder says “Listening…”. The mic is a
toggle button named “Dictate”, or “Stop dictation” with `aria-pressed="true"` while it listens. A status region says
“Writing…” while a reply is on its way, then the whole reply once, prefixed with the assistant's name (“Quill: Hi
team, …”) – never word by word. Errors are alerts: “Couldn't get a reply. Try again.”, “Microphone access was
blocked.”, “Dictation isn't supported in this browser.” New chat moves focus to the field.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| backdrop-filter | 76 (Edge 79) | 103 | 18 | 18 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 43.1 KB | 10.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **50.8 KB** | **12.9 KB** |
| With Lit – the first component on a page | 73.2 KB | 20.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 33 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of suggestions replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.5 ms | suggestions: first render, 130 nodes; update 0.2 ms |
| 1,000 items | 6.6 ms | suggestions: first render, 1,030 nodes; update 0.8 ms |

1,000 items of suggestions: 6.6 ms, 1,030 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 5 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give the assistant a short `name` and a `tagline` that says what it's for: “Your writing companion.”
- Make the `greeting` a question that invites a task: “What should we write?”
- Write three or four `suggestions` as things people would actually type, starting with a verb: “Polish my email”.
- Use the `placeholder` for an example of a good request: “Ask Quill to write or edit…”.

## Do and don't

### Do

- Pass `respond` and use its `signal` – it aborts when people start a new chat or the card is removed.
- Use `history` in `respond` to keep the context of earlier messages.
- Seed or restore a conversation through `messages`, and save it from `tc-messages-change`.

### Don't

- Don't ship without `respond`: a sample writer stands in and warns in the console.
- Don't send dictated text automatically – the card leaves it in the field so people can check it first.
- Don't use more than four suggestions; they push the field down.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Voice Mode](voice-mode.md) – A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn
- [Email Draft](email-draft.md) – Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups

## Changelog

- writing-assistant: dictation fills the field and no longer sends by itself.
