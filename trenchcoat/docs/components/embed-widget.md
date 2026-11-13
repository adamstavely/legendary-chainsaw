<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Embed Widget

**AI configuration** · New

The chat a visitor opens on a website – a corner launcher with an unread count, and a panel with the agent's name and reply time, a greeting, starter questions, the conversation with a person taking over, a message field and a privacy line, styled by the site's accent, radius and side

- **Element:** `<tc-embed-widget>`
- **Size:** 9.0 KB gzip · 28.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/embed-widget";` |
| React / Next.js | `import { EmbedWidget } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/embed-widget";` · tags starting with tc- are custom elements |
| Angular | `import { EmbedWidget } from "@adamstavely/trenchcoat/angular/embed-widget";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/embed-widget";` |

## Example

The live example is in the gallery at `#/embed-widget`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The chat a visitor opens on a website. A launcher sits in a corner of the page – with a count when there are
messages they haven't seen – and opens a panel: the agent's name, picture and how fast it replies, a greeting, a few
starter questions, the conversation and a field to write in, with a line on privacy under it. When a person from the
team takes over, a notice says who joined and their messages carry their name.

The page owns the conversation. Sending a message or picking a starter fires `tc-send` with the text; the page
appends the visitor's message, then the reply, to `messages` (set `typing` while it waits). `theme` styles the widget
for the site – the accent, the corner radius, the side, the greeting and the title – and the text on the accent is
dark or light, whichever reads better.

### When to use

- A help or sales assistant embedded on a public website.
- The live preview of such a widget in its settings – see `embed-configurator`.
- A support chat that can hand a visitor over to a person.

### When not to use

- The chat inside your own product, where people are signed in – use [Chat Composer](chat-composer.md) with a message list, or the
  [AI Side Pane](../blocks/ai-side-pane.md) block.
- A shared thread with several people and the model – use [Multiplayer Thread](multiplayer-thread.md).
- Setting up the widget – use [Embed Configurator](embed-configurator.md), which shows this as its preview.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Launcher** `.ui-emw__launcher` – the button in the corner, with its words and an icon
2. **Unread count** `.ui-emw__badge` – messages not yet seen, while the panel is closed
3. **Panel** `.ui-emw__panel` – the non-modal dialog above the launcher
4. **Header** `.ui-emw__head` – the picture `.ui-emw__avatar`, name `.ui-emw__name`, reply time `.ui-emw__sub` and Close `.ui-emw__close`
5. **Conversation** `.ui-emw__log` – the greeting and the messages `.ui-emw__msg`, each a bubble `.ui-emw__bubble`
6. **Handoff notice** `.ui-emw__notice` – "Priya from the data desk joined"
7. **Starters** `.ui-emw__starters` – questions to begin with, until the visitor has written
8. **Message field** `.ui-emw__compose` – the text field `.ui-emw__field` and Send `.ui-emw__send`
9. **Privacy line** `.ui-emw__privacy` – a short note and a link

## Looks

Standard puts the header on a gray tray and the conversation on a white card inside it; Clean is one white card with
a hairline under the header. Both take the site's accent for the launcher, the visitor's bubbles, the picture and
Send. The panel's size can be set with `--tc-emw-w` (360px) and `--tc-emw-h` (520px), and the theme sets
`--tc-emw-accent`, `--tc-emw-on-accent` and `--tc-emw-radius`. `floating` pins it to the window's corner, as on a real
site; without it the widget sits in the page's flow, which suits previews and docs.

## Usage

### HTML

```html
<tc-embed-widget id="help" heading="Ask the Institute" greeting="Hi! I can help with visits, data requests and publications." open></tc-embed-widget>

<script type="module">
  import "@adamstavely/trenchcoat/embed-widget";
  import "@adamstavely/trenchcoat/tokens.css";

  const help = document.querySelector("#help");
  help.theme = { accent: "#0f766e", radius: 16 };
  help.starters = [
    { id: "hours", text: "When is the reading room open?" },
    { id: "data", text: "How do I request a dataset?" },
  ];
  help.addEventListener("tc-send", (e) => {
    help.messages = [...help.messages, { id: String(Date.now()), from: "visitor", text: e.detail.text }];
    help.typing = true;
    setTimeout(() => {
      help.typing = false;
      help.messages = [...help.messages, { id: `${Date.now()}r`, from: "assistant", text: "Thanks – the help desk will reply here." }];
    }, 800);
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EmbedWidget, type EmbedMessage } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function HelpWidget({ ask }: { ask: (text: string) => Promise<string> }) {
  const [messages, setMessages] = useState<EmbedMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const send = async (text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "visitor", text }]);
    setTyping(true);
    const reply = await ask(text);
    setTyping(false);
    setMessages((m) => [...m, { id: crypto.randomUUID(), from: "assistant", text: reply }]);
  };
  return (
    <EmbedWidget
      title="Ask the Institute"
      greeting="Hi! I can help with visits, data requests and publications."
      floating
      theme={{ accent: "#0f766e", radius: 16, position: "right" }}
      messages={messages}
      typing={typing}
      onSend={(text) => void send(text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/embed-widget";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";

defineProps<{ starters: TcEmbedWidget["starters"]; messages: TcEmbedWidget["messages"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-embed-widget :starters="starters" :messages="messages" @tc-open-change="onOpenChange"></tc-embed-widget>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EmbedWidget } from "@adamstavely/trenchcoat/angular/embed-widget";
import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";

@Component({
  selector: "app-embed-widget-example",
  imports: [EmbedWidget],
  template: `<tc-embed-widget [starters]="starters()" [messages]="messages()" (tc-open-change)="onOpenChange($event)"></tc-embed-widget>`,
})
export class EmbedWidgetExample {
  readonly starters = input.required<TcEmbedWidget["starters"]>();
  readonly messages = input.required<TcEmbedWidget["messages"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/embed-widget";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";

  let { starters, messages }: { starters: TcEmbedWidget["starters"]; messages: TcEmbedWidget["messages"] } = $props();
  let el: TcEmbedWidget;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-embed-widget bind:this={el} {starters} {messages}></tc-embed-widget>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Assistant"` | The agent's name in the header (theme.title overrides it) |
| `subtitle` | `subtitle` | `string` | `"Typically replies in a minute"` | The line under the name, e.g. how fast it replies |
| `avatar` | `avatar` | `string \| undefined` | `undefined` | The agent's picture – a URL; initials of the name when there's none |
| `greeting` | `greeting` | `string` | `""` | The first message, from the agent (theme.greeting overrides it) |
| `starters` | – | `EmbedStarter[]` | `[]` | Starter questions, shown until the visitor has written |
| `messages` | – | `EmbedMessage[]` | `[]` | The conversation, oldest first – the page appends the visitor's messages and the replies |
| `typing` | `typing` | `boolean` | `false` | The agent is writing a reply: dots at the end of the conversation |
| `open` | `open` | `boolean` | `false` | The panel is open |
| `unread` | `unread` | `number` | `0` | Messages the visitor hasn't seen, as a count on the launcher while the panel is closed |
| `floating` | `floating` | `boolean` | `false` | Pin the widget to the window's corner, as on a site; otherwise it sits in the page's flow |
| `position` | `position` | `EmbedPosition` | `"right"` | Which corner the launcher sits in (theme.position overrides it) |
| `theme` | – | `EmbedTheme` | `{}` | How the site styles it: accent, radius, side, greeting, title and launcher words |
| `privacy` | `privacy` | `string` | `"AI answers can be wrong. Don't share passwords or payment details."` | The privacy line under the message field; empty hides it |
| `privacyHref` | `privacy-href` | `string \| undefined` | `undefined` | Where the privacy line's link goes; none hides the link |
| `labels` | – | `Partial<EmbedWidgetLabels>` | `{}` | The widget's words, merged over defaultEmbedWidgetLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The launcher, Close or Escape opened or closed the panel ({ open }: EmbedOpenChange); cancelable – prevented, `open` stays as it was |
| `tc-send` | – | Yes | The visitor sent a message or picked a starter ({ text, starter }: EmbedSend); cancelable – prevented, the field keeps the text. The page appends the messages |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-emw-accent` | `var(--tc-accent)` | both |
| `--tc-emw-on-accent` | `var(--tc-text-on-accent)` | both |
| `--tc-emw-radius` | `var(--tc-radius-xl)` | both |
| `--tc-emw-w` | `360px` | both |
| `--tc-emw-h` | `520px` | both |

#### Design tokens it reads (65)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-border-default`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-lg`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-radius-xl`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-success-fg`, `--tc-surface-base`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseEmbedHex(text: string \| null \| undefined): [number, number, number] \| null` | A hex colour ("#abc" or "#aabbcc") as 0–255 channels, or null |
| `embedContrast(a: string, b: string): number \| null` | The WCAG contrast ratio between two hex colours (1–21), or null when either isn't one |
| `EMBED_DARK_TEXT: string` | The near-black and white the widget puts on its accent, for the contrast sums |
| `embedAccentText(accent: string): { text: "light" \| "dark"; ratio: number } \| null` | Which text reads better on the accent – "light" (white) or "dark" – and its contrast ratio |

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
| `starters` | `el.starters = …;` | `<… starters={…} />` | `<tc-embed-widget :starters="…">` | `<tc-embed-widget [starters]="…">` | `<tc-embed-widget {starters}>` |
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-embed-widget :messages="…">` | `<tc-embed-widget [messages]="…">` | `<tc-embed-widget {messages}>` |
| `theme` | `el.theme = …;` | `<… theme={…} />` | `<tc-embed-widget :theme="…">` | `<tc-embed-widget [theme]="…">` | `<tc-embed-widget {theme}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-embed-widget :labels="…">` | `<tc-embed-widget [labels]="…">` | `<tc-embed-widget {labels}>` |

*Also attributes: `heading`, `subtitle`, `avatar`, `greeting`, `typing`, `open`, `unread`, `floating` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-embed-widget id="embed-widget"></tc-embed-widget>

<script type="module">
  import "@adamstavely/trenchcoat/embed-widget";

  const el = document.querySelector("#embed-widget");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/embed-widget";
import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";

const props = defineProps<{ initial: TcEmbedWidget["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcEmbedWidget["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-embed-widget :open="open" @tc-open-change="onOpenChange"></tc-embed-widget>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EmbedWidget } from "@adamstavely/trenchcoat/angular/embed-widget";
import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";

@Component({
  selector: "app-controlled-embed-widget",
  imports: [EmbedWidget],
  template: `<tc-embed-widget [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-embed-widget>`,
})
export class ControlledEmbedWidget {
  readonly initial = input.required<TcEmbedWidget["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcEmbedWidget["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/embed-widget";
  import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";

  let { initial }: { initial: TcEmbedWidget["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcEmbedWidget;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcEmbedWidget["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-embed-widget bind:this={el} {open}></tc-embed-widget>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-embed-widget")` returns a `TcEmbedWidget` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";`
- **React / Next.js:** Props: `import type { EmbedWidgetProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EmbedWidget>`. The element class, for refs: `import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEmbedWidget["starters"]` with `import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";`
- **Angular:** The directive types the template: `[starters]` takes `TcEmbedWidget["starters"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEmbedWidget } from "@adamstavely/trenchcoat/embed-widget";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The agent's name in the header (theme.title overrides it) |
| `open` | `boolean` | The panel is open – controlled when given |
| `defaultOpen` | `boolean` | Open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The panel opened or closed |
| `onSend` | `(text: string, starter: EmbedStarter \| null) => void \| false` | The visitor sent a message or picked a starter – append it and the reply to `messages`; return false to keep the text in the field |

*Renamed or hidden on the wrapper: `heading`, `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the launcher | Opens the panel and moves focus to the message field, or closes it |
| Enter in the field | Sends the message |
| Shift + Enter | Starts a new line |
| Escape | Closes the panel and puts focus back on the launcher |
| Tab | Moves through the header, conversation, starters and field – and on to the page, as the panel isn't modal |

### Screen readers

The launcher is a button with `aria-expanded` and `aria-controls`; its name is its words plus the unread count ("Chat
with us, 2 new messages"). The panel is a `dialog` (`aria-modal="false"`) named by the agent's name. The conversation
is a `log` named "Conversation", so new messages are read as they arrive; each starts with who wrote it ("You:",
"Ask the Institute:", "Priya · Data desk:"). The typing dots are hidden and read as "Ask the Institute is typing". The
starters are a group of buttons, and Send is `aria-disabled` while the field is empty.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.2 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.4 KB** | **9.0 KB** |
| With Lit – the first component on a page | 49.2 KB | 15.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 51 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of messages replaced |
| First on the page | 9.6 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.5 ms | messages: first render, 393 nodes; update 0.2 ms |
| 1,000 items | 16 ms | messages: first render, 3,633 nodes; update 1.6 ms |

1,000 items of messages: 16 ms, 3,633 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the agent for what it helps with – "Ask the Institute", "Help desk" – rather than "Bot".
- Keep the greeting to one or two sentences saying what it can do.
- Write starters as the visitor would ask them; three is enough.
- Say in the privacy line what not to share, and link to the policy.

## Do and don't

### Do

- Pick an accent that reads with text on it – `embed-configurator` checks it for you.
- Set `typing` while the reply is on its way, and clear it when the reply is appended.
- Show the handoff notice when a person joins, and give their messages a name.

### Don't

- Don't open the panel on its own when the page loads – let the visitor choose.
- Don't use `floating` inside a docs page or a card; it pins the widget to the window.
- Don't put links or buttons into message text – keep replies to plain text.

## Related

- [Embed Configurator](embed-configurator.md) – Style a site's chat widget beside a live preview – title, greeting, up to four starter prompts to add, move and remove, an accent with its contrast in words, the corner, the radius, the launcher's words and the domains it may load on, with the install snippet to copy
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Prompt Starters](prompt-starters.md) – Where to begin, and what to ask next – suggestions for an empty chat and follow-ups after an answer, from the conversation's context
- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
