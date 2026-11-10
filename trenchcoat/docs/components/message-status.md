<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Message Status

**AI & chat** · New

The quiet row under a sent message – a read receipt from sending to delivered to read (or Not sent with Retry), a relative time that keeps itself fresh, and Copy, Send again, Branch into a new chat and Edit

- **Element:** `<tc-message-status>`
- **Size:** 8.5 KB gzip · 26.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/message-status";` |
| React / Next.js | `import { MessageStatus } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/message-status";` · tags starting with tc- are custom elements |
| Angular | `import { MessageStatus } from "@adamstavely/trenchcoat/angular/message-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/message-status";` |

## Example

The live example is in the gallery at `#/message-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The quiet row under a message the person sent. It says where the message is – a clock while it's sending, one tick once
sent, two once delivered, two in the accent once read, and a red alert with Not sent when it failed – and when it was
sent, as a relative time that keeps itself fresh. After a dot come the controls: Copy, Send again and Branch into a new
chat, and Edit if the page asks for it. Like `message-actions`, the controls wait until the message is hovered or
focused; the receipt and time always show, and a failed message keeps its Retry button in view.

### When to use

- Under the person's own messages in a chat with an assistant or with other people.
- Where people need to know a message got through, and to resend or fork the conversation from it.

### When not to use

- Under an assistant's answer – copy, regenerate, feedback and read aloud: use [Message Actions](message-actions.md).
- A list of messages or alerts with read state: use [Notifications](notifications.md).
- Replies and resolution on a comment: use [Comment Thread](comment-thread.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-mst__row` – the whole line, at the end for one's own message (`align="start"` for the other side)
2. **Receipt** `.ui-mst__receipt` – the mark `.ui-mst__mark`; for sending and failed also the word `.ui-mst__word`
3. **Time** `.ui-mst__time` – the relative time in a `<time datetime>`, the full date in its tooltip
4. **Dot** `.ui-mst__dot` – between the time and the controls
5. **Controls** `.ui-mst__bar` – the toolbar of `.ui-mst__btn` icon buttons, each with a tooltip `.ui-mst__tip`

## Looks

Standard draws the icons at a heavier stroke on small buttons with the dark tooltip. Clean uses a thinner stroke,
bigger hit targets and the white popover tooltip. A page can set `--tc-mst-btn`, the buttons' size. Read uses
`--tc-accent-text`, failed `--tc-status-danger-fg`.

## Usage

### HTML

```html
<div data-ui-message>
  <p class="bubble">Can you chart last spring's tide readings?</p>
  <tc-message-status id="status" receipt="read" text="Can you chart last spring's tide readings?"></tc-message-status>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/message-status";
  import "@adamstavely/trenchcoat/tokens.css";

  const status = document.querySelector("#status");
  status.time = new Date();
  status.addEventListener("tc-retry", () => {
    status.receipt = "sending";
  });
  status.addEventListener("tc-branch", () => console.log("Start a new chat from here"));
</script>
```

### React / Next.js

```tsx
import { MessageStatus, type MessageReceipt } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Sent({ text, sentAt, receipt, resend }: { text: string; sentAt: number; receipt: MessageReceipt; resend: () => Promise<void> }) {
  return (
    <div data-ui-message="">
      <p>{text}</p>
      <MessageStatus receipt={receipt} time={sentAt} text={text} onRetry={resend} onBranch={() => console.log("branch")} />
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/message-status";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";

defineProps<{ time: TcMessageStatus["time"]; actions: TcMessageStatus["actions"] }>();
const onCopy = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-message-status :time="time" :actions="actions" @tc-copy="onCopy"></tc-message-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MessageStatus } from "@adamstavely/trenchcoat/angular/message-status";
import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";

@Component({
  selector: "app-message-status-example",
  imports: [MessageStatus],
  template: `<tc-message-status [time]="time()" [actions]="actions()" (tc-copy)="onCopy($event)"></tc-message-status>`,
})
export class MessageStatusExample {
  readonly time = input.required<TcMessageStatus["time"]>();
  readonly actions = input.required<TcMessageStatus["actions"]>();
  onCopy(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/message-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";

  let { time, actions }: { time: TcMessageStatus["time"]; actions: TcMessageStatus["actions"] } = $props();
  let el: TcMessageStatus;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-copy", on);
    return () => el.removeEventListener("tc-copy", on);
  });
</script>

<tc-message-status bind:this={el} {time} {actions}></tc-message-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `receipt` | `receipt` | `MessageReceipt` | `"sent"` | Where the message is: "sending", "sent", "delivered", "read" or "failed" |
| `time` | – | `Date \| string \| number \| undefined` | `undefined` | When it was sent – a Date, an ISO string or epoch ms. Unset, no time shows |
| `now` | `now` | `number \| undefined` | `undefined` | The current time in epoch ms, for tests and stories; unset, the row keeps its own clock |
| `text` | `text` | `string \| undefined` | `undefined` | The message text – what Copy puts on the clipboard |
| `actions` | – | `MessageStatusAction[]` | `["copy", "retry", "branch"]` | Which controls to show, in this order. Retry shows anyway while the message has failed |
| `onRetry` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Called after tc-retry when it isn't prevented. Return a promise to keep the arrow spinning until it settles |
| `align` | `align` | `"start" \| "end"` | `"end"` | "end" for the person's own message (the default), "start" to line up on the left |
| `quiet` | `quiet` | `boolean` | `true` | Controls stay hidden until the message is hovered or focused (default true; quiet="false" shows them always). Put data-ui-message on the message wrapper |
| `labels` | – | `Partial<MessageStatusLabels>` | `{}` | Every word the row shows or says, merged over the defaults |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates older than yesterday |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-copy` | – | No | `text` is on the clipboard (or Copy was pressed without `text`); detail `{ text?: string }` |
| `tc-retry` | – | Yes | Send again or Retry was pressed; detail `{ receipt }`. Cancelable: preventDefault() skips `onRetry` |
| `tc-branch` | – | Yes | Branch into a new chat was pressed; detail `{}`. Cancelable |
| `tc-edit` | – | Yes | Edit was pressed; detail `{}`. Cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-mst-btn` | `36px` | standard, clean, both |
| `--tc-mst-radius` | `var(--tc-control-radius-md)` | standard, clean |
| `--tc-mst-hover` | `var(--tc-fill-subtle)` | standard, clean |
| `--tc-mst-stroke` | `1.3` | standard, clean |
| `--tc-mst-quiet-color` | `var(--tc-icon-muted)` | standard, clean |

#### Design tokens it reads (38)

`--tc-accent-text`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-tight`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-overlay`, `--tc-text-muted`, `--tc-text-primary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `relativeMessageTime(at: number, now: number, labels: MessageStatusLabels, locale?: string): void` | "Just now", "2 min ago", "3 hr ago", "Yesterday" or a short date |

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
| `time` | `el.time = …;` | `<… time={…} />` | `<tc-message-status :time="…">` | `<tc-message-status [time]="…">` | `<tc-message-status {time}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-message-status :actions="…">` | `<tc-message-status [actions]="…">` | `<tc-message-status {actions}>` |
| `onRetry` | `el.onRetry = …;` | `<… onRetry={…} />` | `<tc-message-status :onRetry="…">` | `<tc-message-status [onRetry]="…">` | `<tc-message-status {onRetry}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-message-status :labels="…">` | `<tc-message-status [labels]="…">` | `<tc-message-status {labels}>` |

*Also attributes: `receipt`, `now`, `text`, `align`, `quiet`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopyText={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-retry` | Yes | `el.addEventListener("tc-retry", (e) => …)` | `onTcRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-branch` | Yes | `el.addEventListener("tc-branch", (e) => …)` | `onBranch={…}` | `@tc-branch="…"` | `(tc-branch)="…($event)"` | `el.addEventListener("tc-branch", …)` |
| `tc-edit` | Yes | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |

### Controlled

`tc-retry`, `tc-branch`, `tc-edit` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-message-status")` returns a `TcMessageStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";`
- **React / Next.js:** Props: `import type { MessageStatusProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MessageStatus>`. The element class, for refs: `import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMessageStatus["time"]` with `import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";`
- **Angular:** The directive types the template: `[time]` takes `TcMessageStatus["time"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMessageStatus } from "@adamstavely/trenchcoat/message-status";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onCopyText` | `(text?: string) => void` | Called once `text` is on the clipboard (or right away when there's no `text`) |
| `onBranch` | `() => void` | Called when Branch into a new chat is pressed |
| `onEdit` | `() => void` | Called when Edit is pressed |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

The controls are one tab stop.

| Key | What it does |
|---|---|
| Tab | Moves into the controls, on the last one used |
| Left / Right | Moves between the controls (wrapping) |
| Home / End | Moves to the first or last control |
| Enter / Space | Uses the control |
| Escape | Hides the tooltip without moving focus |

### Screen readers

The receipt is read as a word – Sending…, Sent, Delivered, Read or Not sent – and a change of receipt is announced
politely, as are Copied, Sending again… and Couldn't send. The time is a `<time>` element read as shown. The controls
are a `toolbar` named Message controls, each button named by its tooltip; a failed message's Retry is named by its
visible word. Below 220px the time steps out of sight but is still read.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.4 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.0 KB** | **8.5 KB** |
| With Lit – the first component on a page | 46.2 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 34 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of actions replaced |
| First on the page | 9.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.5 ms | actions: first render, 34 nodes; update 0.2 ms |
| 1,000 items | 0.7 ms | actions: first render, 34 nodes; update 0.0 ms |

What it renders doesn't grow with actions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Pass `time` as a Date, ISO string or epoch ms; it shows as Just now, 2 min ago, 3 hr ago, Yesterday or a short date.
Pass `text` so Copy has something to copy. Keep `receipt` in step with the server: sending until it's acknowledged,
failed with a way to retry. `labels` renames every word, including the time phrases, and `locale` sets the date format.

## Do and don't

### Do

- Set `receipt` to failed when a send fails, and give `onRetry` a promise so the arrow spins until it settles.
- Wrap the message and this row in `data-ui-message`, so hovering the bubble shows the controls.
- Show Read only when the other side has really read it.

### Don't

- Don't use read receipts where people haven't agreed to share them.
- Don't add controls that act on someone else's message here: this row is for the person's own.

## Related

- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Notifications](notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions

## Changelog

- **Message Status** (`tc-message-status`): the quiet row under a sent message – a read receipt (sending, sent, delivered, read, or Not sent with Retry), a relative time that keeps itself fresh, and Copy, Send again, Branch into a new chat and Edit, with cancelable `tc-retry`, `tc-branch` and `tc-edit`.
