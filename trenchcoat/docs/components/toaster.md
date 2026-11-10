<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Toaster

**Feedback & onboarding**

Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss

- **Element:** `<tc-toaster>`
- **Size:** 13.1 KB gzip · 43.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/toaster";` |
| React / Next.js | `import { Toaster } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/toaster";` · tags starting with tc- are custom elements |
| Angular | `import { Toaster } from "@adamstavely/trenchcoat/angular/toaster";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/toaster";` |

## Example

The live example is in the gallery at `#/toaster`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Short, calm confirmations that something happened – “Invoice sent”, “Conversation archived” – shown in a corner of
the page and gone after a few seconds. Put one `<tc-toaster>` near the root and call `toast()` from anywhere: plain,
success, error, info and loading toasts, toasts with an action such as Undo, and promise toasts whose spinner turns
into a check or a cross when the work finishes. Toasts stack with the newest in front; hovering or focusing the stack
fans it out into a list, and people can swipe a toast away or press Esc. Timers pause while someone is reading.

### When to use

- Confirming an action people took, when the result isn't visible where they are.
- Offering a short-lived undo after something reversible (“Archived · Undo”).
- Following background work that takes a few seconds – a deploy, an upload – with `toast.promise`.

### When not to use

- Notifications people need to come back to or act on later – use [Notification Stack](notification-stack.md).
- Anything people must not miss or must decide before work goes on – a toast can time out or be dismissed unread.
  Use [Approval Card](approval-card.md) or [Decision Inbox](decision-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stack** `.ui-ts__list` – the toasts in their corner, newest in front, two more peeking behind it
2. **Toast** `.ui-ts__toast` – one message, with its status icon; a timed one has a 1px line that runs down
3. **Text** `.ui-ts__text` – the title, and the description under it
4. **Action** `.ui-ts__action` – one button, such as Undo
5. **Close** `.ui-ts__close` – the × that shows on hover and focus (always on touch screens)

## Looks

Standard draws 18 px status icons, a muted description and a smaller action button. Clean uses 16 px icons, an info
icon in the accent colour, a darker description and a full-height action button. Both stack, fan out, swipe and
time out the same way.

## Usage

### HTML

```html
<tc-toaster position="bottom-right"></tc-toaster>

<script type="module">
  import { toast } from "@adamstavely/trenchcoat/toaster";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("tc-toaster").duration = 5000;
  toast.success("Invoice sent", { description: "INV-2041 · $1,280.00 to Northwind Ltd." });
  toast("Conversation archived", {
    action: { label: "Undo", onClick: () => toast.success("Conversation restored") },
    onDismiss: (id) => console.log("closed", id),
  });
</script>
```

### React / Next.js

```tsx
import { Toaster, toast } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

function deploy() {
  return new Promise<string>((resolve) => setTimeout(() => resolve("v2.14.0"), 2000));
}

export function App() {
  return (
    <>
      <button
        type="button"
        onClick={() =>
          toast.promise(deploy, {
            loading: "Deploying to production…",
            success: (version) => `Deployed ${version}`,
            error: "Deploy failed",
          })
        }
      >
        Deploy
      </button>
      <Toaster position="bottom-right" />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/toaster";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcToaster } from "@adamstavely/trenchcoat/toaster";

defineProps<{ hotkey: TcToaster["hotkey"] }>();
</script>

<template>
  <tc-toaster :hotkey="hotkey"></tc-toaster>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Toaster } from "@adamstavely/trenchcoat/angular/toaster";
import type { TcToaster } from "@adamstavely/trenchcoat/toaster";

@Component({
  selector: "app-toaster-example",
  imports: [Toaster],
  template: `<tc-toaster [hotkey]="hotkey()"></tc-toaster>`,
})
export class ToasterExample {
  readonly hotkey = input.required<TcToaster["hotkey"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/toaster";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcToaster } from "@adamstavely/trenchcoat/toaster";

  let { hotkey }: { hotkey: TcToaster["hotkey"] } = $props();
  let el: TcToaster;
</script>

<tc-toaster bind:this={el} {hotkey}></tc-toaster>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `position` | `position` | `ToastPosition` | `"bottom-right"` | Corner (or edge center) the stack sits in |
| `inline` | `inline` | `boolean` | `false` | Positions the stack inside the nearest positioned ancestor instead of the viewport – for previews and panels |
| `stack` | `stack` | `string \| undefined` | `undefined` | Only shows toasts sent with { toaster: name } – for a second, separate stack |
| `duration` | `duration` | `number` | `4000` | Default time on screen in ms |
| `actionDuration` | `actionDuration` | `` | `Infinity` | Default time on screen for toasts with an action. Infinity (the default) keeps them until they're dismissed (WCAG 2.2.1) |
| `visibleToasts` | `visibleToasts` | `number` | `3` | How many toasts are visible at once; older ones wait behind |
| `expand` | `expand` | `boolean` | `false` | Always show the stack fanned out |
| `offset` | `offset` | `number \| undefined` | `undefined` | Distance from the edges in px |
| `gap` | `gap` | `number` | `10` | Space between toasts when fanned out, in px |
| `hotkey` | – | `string \| false \| null` | `"F8"` | Key that moves focus to the newest toast (KeyboardEvent.key or .code) – false (or null) turns it off |
| `hairline` | `hairline` | `boolean` | `true` | A 1px line along the bottom of a toast that runs down with its timer |
| `closeButton` | `closeButton` | `boolean` | `true` | Show a close button on hover and focus (always on touch screens) |
| `label` | `label` | `string` | `"Notifications"` | Name of the region for screen readers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-toaster-width` | `356px` | standard, clean |
| `--tc-toaster-offset` | `24px` | standard, clean |

#### Design tokens it reads (50)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-z-toast`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `resetToasts(): void` | Empties the store at once – no exit animation, no onDismiss – and cancels pending exits. Meant for tests (e.g. in afterEach), since the store lives at module level and would otherwise carry toasts between them |
| `toast: object` | toast("Saved"), toast.success(…), toast.error(…), toast.info(…), toast.loading(…), toast.promise(…), toast.dismiss(id?) |

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
| `hotkey` | `el.hotkey = …;` | `<… hotkey={…} />` | `<tc-toaster :hotkey="…">` | `<tc-toaster [hotkey]="…">` | `<tc-toaster {hotkey}>` |

*Also attributes: `position`, `inline`, `stack`, `duration`, `actionDuration`, `visibleToasts`, `expand`, `offset` and 4 more – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-toaster")` returns a `TcToaster` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcToaster } from "@adamstavely/trenchcoat/toaster";`
- **React / Next.js:** Props: `import type { ToasterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Toaster>`. The element class, for refs: `import type { TcToaster } from "@adamstavely/trenchcoat/toaster";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcToaster["hotkey"]` with `import type { TcToaster } from "@adamstavely/trenchcoat/toaster";`
- **Angular:** The directive types the template: `[hotkey]` takes `TcToaster["hotkey"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcToaster } from "@adamstavely/trenchcoat/toaster";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcToaster } from "@adamstavely/trenchcoat/toaster";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string` | Only shows toasts sent with { toaster: id } – for a second, separate stack. Not the element's DOM id |

*Renamed or hidden on the wrapper: `stack`, `id`*

## Accessibility

Follows the WAI-ARIA [Landmark regions pattern](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/).

### Keyboard

| Key | What it does |
|---|---|
| F8 | Moves focus to the newest toast (set `hotkey` to change the key, or `false` to turn it off) |
| Tab / Shift+Tab | Moves between toasts and their action and close buttons; the stack fans out while keyboard focus is in it |
| Escape | Dismisses the focused toast, or the newest one; focus moves to the next toast, or back to where it was before F8 |
| Enter / Space | Presses the focused action or close button |

### Screen readers

The toaster is a `region` named by `label` and its hotkey (“Notifications (F8)”). New and changed toasts are read
out from live regions: errors through an alert, everything else through a polite status, with the title and
description in one message. A promise toast is read again when it
settles. The close button is “Dismiss notification”. When a toast with focus closes – by its timer, an action or
Esc – focus goes to the next toast, to where it was before the hotkey, or to the region, never to the page body.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.2 KB | 10.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **43.2 KB** | **13.2 KB** |
| With Lit – the first component on a page | 65.9 KB | 20.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 33 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 2.8 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 4 React commits (clean), 4 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`, `document pointerdown`, `window keydown` (internal/controllers – HotkeyController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Lead with what happened, in the past tense: “Invoice sent”, “File uploaded” – not “Success!”.
- Put the detail people may want – which invoice, how much – in the description, on one line if you can.
- Say what went wrong in an error and, if you can, what to do: “report-q3.pdf is larger than 25 MB.”
- Keep action labels to one verb: “Undo”, “View”, “Retry”.

## Do and don't

### Do

- Use one toaster per page; add a second stack (`stack`, or `id` in React) only for a separate area such as a panel.
- Pass an `id` to update a toast in place instead of stacking a second one.
- Let toasts with an action stay until dismissed – the default – so people have time to use it (WCAG 2.2.1).

### Don't

- Don't show a toast for every small change that's already visible on screen.
- Don't put more than one action in a toast, or links people must follow.
- Don't use `toast.loading` without updating or dismissing it – it has no timer.
- Don't report an error in a form with a toast – show it next to the field, where people fix it.

## Related

- [Notification Stack](notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away

## Changelog

- toaster: toasts with an action don't auto-dismiss (`actionDuration`, default Infinity).
- toaster: when several toasters share the hotkey, the newest one with a toast takes it; Ctrl/⌘ + the key no longer triggers it.
