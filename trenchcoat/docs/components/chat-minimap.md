<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Chat Minimap

**AI & chat** · New

A rail of ticks beside a long chat, one per message you sent, longer for longer ones – the one in view lit, the message on hover or with the arrow keys, a click to jump back to it – following the chat as it scrolls

- **Element:** `<tc-chat-minimap>`
- **Size:** 6.0 KB gzip · 16.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/chat-minimap";` |
| React / Next.js | `import { ChatMinimap } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/chat-minimap";` · tags starting with tc- are custom elements |
| Angular | `import { ChatMinimap } from "@adamstavely/trenchcoat/angular/chat-minimap";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/chat-minimap";` |

## Example

The live example is in the gallery at `#/chat-minimap`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A slim rail beside a long chat with a tick for each message the person sent – longer ticks for longer messages – and
the one in view lit. Pointing at a tick shows the message with where it falls (“3 of 12”); a click scrolls the chat back
to it. It follows the chat's scrolling by itself: give it the element the chat scrolls in (`scrollRoot`) and each
message's element id (`target`, else `id`). With `manual` the page sets `current` and handles the jump.

### When to use

- Long conversations people come back to, where finding an earlier question means a lot of scrolling.
- Beside a transcript or an agent run with many turns, to show where you are in it.

### When not to use

- Moving between saved conversations – use [Chat History](chat-history.md).
- Choosing between alternative replies to one message – use [Conversation Branches](conversation-branches.md).
- Short chats that fit on a screen or two – the rail adds nothing.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Rail** `.ui-cmm__rail` – the ticks, a listbox named by `label`
2. **Mark** `.ui-cmm__mark` – one message, an option; the one in view is selected
3. **Tick** `.ui-cmm__tick` – short, medium or long by the message's length; lit for the one in view
4. **Message** `.ui-cmm__tip` – the message and “3 of 12”, beside the rail on hover or with the keys

## Looks

Both looks are the bare rail, with no card. Ticks are muted; the one in view is longer and the accent colour. A page can set `--tc-cmm-pitch` (the space for each tick, 16 px), the three
lengths `--tc-cmm-sm`, `--tc-cmm-md` and `--tc-cmm-lg`, `--tc-cmm-tick` and `--tc-cmm-here`, and
`--tc-cmm-tip-width`. `tip-side="right"` shows the message on the rail's right, for a rail on the left of the chat.

## Usage

### HTML

```html
<div style="display: flex; gap: 8px">
  <div id="chat" style="height: 480px; overflow-y: auto"><!-- messages, each with an id --></div>
  <tc-chat-minimap id="rail" label="Your questions"></tc-chat-minimap>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/chat-minimap";
  import "@adamstavely/trenchcoat/tokens.css";

  const rail = document.querySelector("#rail");
  rail.scrollRoot = document.querySelector("#chat");
  rail.items = [
    { id: "q1", text: "Summarise the open alerts on the account." },
    { id: "q2", text: "Why was the March 14 transfer flagged?" },
  ];
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ChatMinimap } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function QuestionRail({ chat }: { chat: HTMLElement | null }) {
  const [current, setCurrent] = useState<string | null>(null);
  return (
    <ChatMinimap
      label="Your questions"
      scrollRoot={chat}
      items={[
        { id: "q1", text: "Summarise the open alerts on the account." },
        { id: "q2", text: "Why was the March 14 transfer flagged?" },
      ]}
      current={current}
      onCurrentChange={setCurrent}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/chat-minimap";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";

defineProps<{ items: TcChatMinimap["items"]; scrollRoot: TcChatMinimap["scrollRoot"] }>();
const onJump = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-chat-minimap :items="items" :scrollRoot="scrollRoot" @tc-jump="onJump"></tc-chat-minimap>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChatMinimap } from "@adamstavely/trenchcoat/angular/chat-minimap";
import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";

@Component({
  selector: "app-chat-minimap-example",
  imports: [ChatMinimap],
  template: `<tc-chat-minimap [items]="items()" [scrollRoot]="scrollRoot()" (tc-jump)="onJump($event)"></tc-chat-minimap>`,
})
export class ChatMinimapExample {
  readonly items = input.required<TcChatMinimap["items"]>();
  readonly scrollRoot = input.required<TcChatMinimap["scrollRoot"]>();
  onJump(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chat-minimap";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";

  let { items, scrollRoot }: { items: TcChatMinimap["items"]; scrollRoot: TcChatMinimap["scrollRoot"] } = $props();
  let el: TcChatMinimap;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-jump", on);
    return () => el.removeEventListener("tc-jump", on);
  });
</script>

<tc-chat-minimap bind:this={el} {items} {scrollRoot}></tc-chat-minimap>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `"Your messages"` | What the rail is – its accessible name |
| `items` | – | `ChatMarker[]` | `[]` | The person's messages, oldest first |
| `current` | `current` | `string \| null` | `null` | The id of the message in view. Followed from the scrolling unless `manual`, and set by a jump |
| `scrollRoot` | – | `Element \| null` | `null` | The element the chat scrolls in; by default the page |
| `manual` | `manual` | `boolean` | `false` | Leaves `current` to the page: the rail neither follows the scrolling nor scrolls on a jump |
| `tipSide` | `tip-side` | `"left" \| "right"` | `"left"` | Which side of the rail a message shows on |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-jump` | – | Yes | A tick was chosen ({ id, item }: ChatMinimapJump); cancelable – prevented, the chat doesn't scroll |
| `tc-current-change` | – | Yes | The message in view changed ({ current }: ChatMinimapCurrentChange); cancelable – prevented, `current` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cmm-pitch` | `16px` | both |
| `--tc-cmm-sm` | `14px` | both |
| `--tc-cmm-md` | `20px` | both |
| `--tc-cmm-lg` | `28px` | both |
| `--tc-cmm-thick` | `3px` | both |
| `--tc-cmm-thick-here` | `4px` | both |
| `--tc-cmm-tip-width` | `280px` | both |
| `--tc-cmm-tick` | `var(--tc-text-muted)` | both |
| `--tc-cmm-here` | `var(--tc-accent-solid)` | both |

#### Design tokens it reads (20)

`--tc-accent-solid`, `--tc-card-shadow`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-surface-inverse`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-chat-minimap :items="…">` | `<tc-chat-minimap [items]="…">` | `<tc-chat-minimap {items}>` |
| `scrollRoot` | `el.scrollRoot = …;` | `<… scrollRoot={…} />` | `<tc-chat-minimap :scrollRoot="…">` | `<tc-chat-minimap [scrollRoot]="…">` | `<tc-chat-minimap {scrollRoot}>` |

*Also attributes: `label`, `current`, `manual`, `tip-side` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-jump` | Yes | `el.addEventListener("tc-jump", (e) => …)` | `onTcJump={…}` | `@tc-jump="…"` | `(tc-jump)="…($event)"` | `el.addEventListener("tc-jump", …)` |
| `tc-current-change` | Yes | `el.addEventListener("tc-current-change", (e) => …)` | `ref.current.addEventListener("tc-current-change", …)` | `@tc-current-change="…"` | `(tc-current-change)="…($event)"` | `el.addEventListener("tc-current-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `current` itself unless a listener calls `preventDefault()` on `tc-current-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-chat-minimap id="chat-minimap"></tc-chat-minimap>

<script type="module">
  import "@adamstavely/trenchcoat/chat-minimap";

  const el = document.querySelector("#chat-minimap");
  el.addEventListener("tc-current-change", (e) => {
    e.preventDefault(); // the element keeps its current…
    if (allowed(e.detail.current)) el.current = e.detail.current; // …until the app sets it
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
import "@adamstavely/trenchcoat/chat-minimap";
import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";

const props = defineProps<{ initial: TcChatMinimap["current"] }>();
const current = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCurrentChange = (e: CustomEvent<{ current: TcChatMinimap["current"] }>) => {
  e.preventDefault();
  current.value = e.detail.current;
};
</script>

<template>
  <tc-chat-minimap :current="current" @tc-current-change="onCurrentChange"></tc-chat-minimap>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChatMinimap } from "@adamstavely/trenchcoat/angular/chat-minimap";
import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";

@Component({
  selector: "app-controlled-chat-minimap",
  imports: [ChatMinimap],
  template: `<tc-chat-minimap [current]="current()" (tc-current-change)="onCurrentChange($event)"></tc-chat-minimap>`,
})
export class ControlledChatMinimap {
  readonly initial = input.required<TcChatMinimap["current"]>();
  readonly current = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCurrentChange(e: CustomEvent<{ current: TcChatMinimap["current"] }>) {
    e.preventDefault();
    this.current.set(e.detail.current);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chat-minimap";
  import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";

  let { initial }: { initial: TcChatMinimap["current"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let current = $derived(initial);
  let el: TcChatMinimap;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      current = (e as CustomEvent<{ current: TcChatMinimap["current"] }>).detail.current;
    };
    el.addEventListener("tc-current-change", on);
    return () => el.removeEventListener("tc-current-change", on);
  });
</script>

<tc-chat-minimap bind:this={el} {current}></tc-chat-minimap>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-chat-minimap")` returns a `TcChatMinimap` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";`
- **React / Next.js:** Props: `import type { ChatMinimapProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChatMinimap>`. The element class, for refs: `import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChatMinimap["items"]` with `import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";`
- **Angular:** The directive types the template: `[items]` takes `TcChatMinimap["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChatMinimap } from "@adamstavely/trenchcoat/chat-minimap";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `current` | `string \| null` | The id of the message in view – controlled when given (null for none) |
| `defaultCurrent` | `string \| null` | The message in view on mount when `current` isn't controlled |
| `onCurrentChange` | `(current: string \| null) => void` | The message in view changed – by scrolling or a jump |

*Renamed or hidden on the wrapper: `current`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

One tab stop: the rail.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous message and shows it |
| Home / End | Moves to the first or last message |
| Enter / Space | Jumps the chat to that message |
| Escape | Hides the message shown |

### Screen readers

It's a `listbox` named by `label` (“Your messages”), with the tick moved to as its active option. Each option is read
as the message, where it falls and whether it's in view: “Why was the March 14 transfer flagged?, 3 of 12, in view”.
The ticks and the hover bubble repeat that, so they're hidden.

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
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-30 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 10.2 KB | 4.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **16.8 KB** | **6.0 KB** |
| With Lit – the first component on a page | 36.4 KB | 12.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 73 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of items replaced |
| First on the page | 7.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.9 ms | items: first render, 601 nodes; update 0.4 ms |
| 1,000 items | 21 ms | items: first render, 6,001 nodes; update 3.0 ms |

1,000 items of items: 21 ms, 6,001 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pass only what the person wrote, not the replies – the rail is for finding your own questions.
- Keep each `id` stable as the chat grows, so the one in view stays lit.
- Give each message's element an id the rail can find (`target`), inside the scroller you pass.

## Do and don't

### Do

- Put the rail beside the chat's scroller, centred on it, and pass that scroller as `scrollRoot`.
- Use `manual` when the chat is virtualised and messages aren't all in the page – scroll to them yourself on `tc-jump`.

### Don't

- Don't show it for a chat of a few messages.
- Don't add a tick per reply – the rail gets twice as long and half as useful.

## Related

- [Chat History](chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [Conversation Branches](conversation-branches.md) – Edit a past message and the conversation forks – a 2 / 3 switcher on the edited message, and each branch's replies below it
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer

## Changelog

- **Chat Minimap** (`tc-chat-minimap`) – a slim rail beside a long chat with a tick for each message the person sent, longer for longer messages, and the one in view lit. Pointing at a tick (or moving to it with the arrow keys) shows the message and where it falls; a click or Enter scrolls the chat back to it, holding still while the jump scrolls. It follows the chat's scroller by itself, or the page drives `current` with `manual`; cancelable `tc-jump` and `tc-current-change`.
