<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Ghosted Chat

**Illustrations**

Unanswered chat messages marked as read, with a thumbs-down reply on hover; the red shine sweeps three times

- **Element:** `<tc-ghosted-chat>`
- **Size:** 6.9 KB gzip · 20.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ghosted-chat";` |
| React / Next.js | `import "@adamstavely/trenchcoat/ghosted-chat";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ghosted-chat";` · tags starting with tc- are custom elements |
| Angular | `import { GhostedChat } from "@adamstavely/trenchcoat/angular/ghosted-chat";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ghosted-chat";` |

## Example

The live example is in the gallery at `#/illustrations/ghosted-chat`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small chat scene about being left on read: three outgoing messages – “Hi team!”, a question about recruiting
and a final “Hello?” – arrive one after another under “No new messages”, and the last is marked “Read”. A red shine
sweeps through “Hello?” three times and rests. Hover it and the status texts fade, the messages lift, and a 👎
reply pops in. It gives empty inboxes, unanswered-message states and outreach pages a wry picture instead of a bare
icon.

### When to use

- An empty or quiet inbox, or a list of messages nobody has replied to yet.
- Onboarding or landing sections about follow-ups, outreach or response rates.
- Error or empty states in messaging features, where a light touch fits the tone.

### When not to use

- Showing a real conversation – use [Comment Thread](../components/comment-thread.md) for messages people can read and answer.
- A list of past conversations – use [Chat History](../components/chat-history.md).
- An empty calendar or schedule – use [Empty Calendar](empty-calendar.md).
- Product tone that's serious (support for a failed payment, an outage) – the joke reads as flippant; use plain
  text.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Status** `.ui-gc-status` – “No new messages” above the bubbles
2. **Messages** `.ui-gc-bubbles` – the three outgoing bubbles and the “Read” mark
3. **Last message** `.ui-gc-bubble-last` – “Hello?”, with the red shine and the glow under it
4. **Reply** `.ui-gc-reply` – the 👎 bubble that pops in on hover

## Looks

One look. Colours follow the page theme through `light-dark()`: in dark the bubbles turn charcoal and the glow
under the last one is a little fainter. It works with a `.dark` class, `data-theme`, `data-tc-theme` or the system
setting.

## Usage

### HTML

```html
<div style="width: 320px">
  <tc-ghosted-chat id="ghosted"></tc-ghosted-chat>
</div>
<p>No replies yet – try a follow-up in a few days.</p>

<script type="module">
  import "@adamstavely/trenchcoat/ghosted-chat";
  import "@adamstavely/trenchcoat/tokens.css";

  // Only when the picture means something the text beside it doesn't say
  document.querySelector("#ghosted").label = "Messages left on read";
</script>
```

### React / Next.js

```tsx
import { GhostedChat } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NoReplies() {
  return (
    <div style={{ width: 320 }}>
      <GhostedChat />
      <p>No replies yet – try a follow-up in a few days.</p>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ghosted-chat";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-ghosted-chat></tc-ghosted-chat>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { GhostedChat } from "@adamstavely/trenchcoat/angular/ghosted-chat";

@Component({
  selector: "app-ghosted-chat-example",
  imports: [GhostedChat],
  template: `<tc-ghosted-chat></tc-ghosted-chat>`,
})
export class GhostedChatExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ghosted-chat";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGhostedChat } from "@adamstavely/trenchcoat/ghosted-chat";

  let el: TcGhostedChat;
</script>

<tc-ghosted-chat bind:this={el}></tc-ghosted-chat>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible description – when set, the scene is announced as an image; otherwise it is decorative |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ghosted-chat-bubble-shadow` | `0 2px 6px light-dark(rgba(28, 29, 31, 0.08), rgba(0, 0, 0, 0.35)), 0 1px 2px light-dark(rgba(28, 29, 31, 0.05), rgba(0, 0, 0, 0.4))` | both |
| `--tc-ghosted-chat-reply-shadow` | `0 4px 12px light-dark(rgba(21, 94, 239, 0.22), rgba(0, 0, 0, 0.4)), 0 1px 2px light-dark(rgba(21, 94, 239, 0.18), rgba(0, 0, 0, 0.4))` | both |
| `--tc-ghosted-chat-glow-1` | `light-dark(rgba(255, 160, 171, 0.6), rgba(255, 160, 171, 0.45))` | both |
| `--tc-ghosted-chat-glow-2` | `light-dark(rgba(255, 184, 158, 0.6), rgba(255, 184, 158, 0.45))` | both |
| `--tc-ghosted-chat-glow-3` | `light-dark(rgba(200, 168, 229, 0.6), rgba(200, 168, 229, 0.45))` | both |
| `--tc-ghosted-chat-glow-4` | `light-dark(rgba(168, 181, 255, 0.6), rgba(168, 181, 255, 0.45))` | both |
| `--tc-ghosted-chat-at-status` | `100ms` | both |
| `--tc-ghosted-chat-at-1` | `500ms` | both |
| `--tc-ghosted-chat-at-2` | `1300ms` | both |
| `--tc-ghosted-chat-at-3` | `2300ms` | both |
| `--tc-ghosted-chat-at-read` | `3200ms` | both |
| `--tc-ghosted-chat-shine` | `4.5s` | both |

#### Design tokens it reads (26)

`--tc-border-default`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-out`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-lg-plus`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-surface-overlay`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `label` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ghosted-chat")` returns a `TcGhostedChat` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGhostedChat } from "@adamstavely/trenchcoat/ghosted-chat";`
- **React / Next.js:** The element class: `import type { TcGhostedChat } from "@adamstavely/trenchcoat/ghosted-chat";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGhostedChat["label"]` with `import type { TcGhostedChat } from "@adamstavely/trenchcoat/ghosted-chat";`
- **Angular:** The directive types the template: `[label]` takes `TcGhostedChat["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGhostedChat } from "@adamstavely/trenchcoat/ghosted-chat";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGhostedChat } from "@adamstavely/trenchcoat/ghosted-chat";`

## Accessibility

### Keyboard

Nothing to operate – the scene takes no focus. The hover reply is decoration only.

### Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped, and the scene's text (“Hi team!”, “Read”)
is never read out. With `label`, the host becomes `role="img"` named by the label (“Messages left on read”);
clearing `label` makes it decorative again.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself, internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 13.4 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **20.6 KB** | **6.9 KB** |
| With Lit – the first component on a page | 40.2 KB | 13.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 15 DOM nodes – to layout, median of 7 |
| Typical update | **1.1 ms** | re-render with the same data |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pair it with a heading and one line of text that says what's happening and what to do next (“No replies yet –
  try a follow-up in a few days”).
- Give it a `label` only when the picture carries meaning the text doesn't.

## Do and don't

### Do

- Let it scale: it fills its container's width at a 3 : 2 frame, laid out on a 360 × 240 artboard.
- Place it where it scrolls into view on its own – the messages arrive once a third of it is on screen.

### Don't

- Don't use it to show someone's real messages – the text in the bubbles is fixed.
- Don't put it in a dense panel next to other moving pieces – the shine and the arrival need room.

## Related

- [Empty Calendar](empty-calendar.md) – Stack of calendar cards marked empty, fanning out on hover; the shimmer runs a few cycles and rests
- [Tab Overload](tab-overload.md) – Overlapping browser windows where the highlight follows the hovered tab
- [Team Invite](team-invite.md) – Connected teammates – a cursor drags a new one into the empty slot, the line turns solid and they go online
