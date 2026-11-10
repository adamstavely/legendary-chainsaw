<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Notification Stack

**Feedback & onboarding**

Notice cards stacked behind each other – dismiss the front one to reveal the next

- **Element:** `<tc-notification-stack>`
- **Size:** 8.0 KB gzip · 26.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/notification-stack";` |
| React / Next.js | `import { NotificationStack } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/notification-stack";` · tags starting with tc- are custom elements |
| Angular | `import { NotificationStack } from "@adamstavely/trenchcoat/angular/notification-stack";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/notification-stack";` |

## Example

The live example is in the gallery at `#/notification-stack`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Notices stacked behind each other, like a small pile of cards. Only the front one can be read; the edges of the
next two peek out below it, so people see there's more without being shown everything at once. Dismissing the front
card slides it away and the next one moves up. Each notice can carry a badge, a short text, one action and quiet
line art in its corner.

### When to use

- A few announcements that should be read one at a time – maintenance, a new feature, a billing change.
- A corner of a dashboard or a sidebar where notices wait until people get to them.
- Notices that stay until they're dismissed, rather than timing out.

### When not to use

- Brief confirmations of something the person just did (“Saved”) – use [Toaster](toaster.md).
- Advice and how-tos people can browse – use [Tips Panel](tips-panel.md).
- Onboarding steps with progress – use [Setup Guide](setup-guide.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Front card** `.ui-ns__card[data-depth="0"]` – the notice people can read and act on
2. **Badge** `.ui-ns__card[data-depth="0"] .ui-ns__badge` – a small label, e.g. “Notice”
3. **Dismiss** `.ui-ns__card[data-depth="0"] .ui-ns__close` – slides the card away and brings up the next
4. **Title** `.ui-ns__card[data-depth="0"] .ui-ns__title` – the notice in a few words
5. **Action** `.ui-ns__card[data-depth="0"] .ui-ns__btn` – one link or button
6. **Card behind** `.ui-ns__card[data-depth="1"]` – the next notice, peeking out below

## Looks

Standard gives each card a soft border, an outlined badge and a slightly larger title. Clean draws one white card per
notice with hairline shadows, a filled gray badge, thinner icons and an accent dot in the line art. Both stack up to
three cards and slide the front one away the same way.

## Usage

### HTML

```html
<tc-notification-stack id="notices"></tc-notification-stack>

<script type="module">
  import "@adamstavely/trenchcoat/notification-stack";
  import "@adamstavely/trenchcoat/tokens.css";

  const stack = document.querySelector("#notices");
  stack.notices = [
    {
      id: "maintenance",
      badge: "Notice",
      title: "Scheduled maintenance on Sunday",
      text: "The dashboard will be read-only from 02:00 to 03:30 UTC.",
      action: { label: "View status page", href: "https://status.example.com", external: true },
      pattern: "orbit",
    },
    { id: "seats", badge: "Billing", title: "Your seats renew on 1 November", text: "12 seats at the annual rate.", pattern: "rays" },
  ];
  stack.addEventListener("tc-dismiss", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { NotificationStack, type Notice } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const notices: Notice[] = [
  {
    id: "maintenance",
    badge: "Notice",
    title: "Scheduled maintenance on Sunday",
    text: "The dashboard will be read-only from 02:00 to 03:30 UTC.",
    action: { label: "View status page", href: "https://status.example.com", external: true },
  },
  { id: "seats", badge: "Billing", title: "Your seats renew on 1 November", text: "12 seats at the annual rate.", pattern: "rays" },
];

export function Announcements({ markRead }: { markRead: (id: string) => void }) {
  return <NotificationStack notices={notices} onDismiss={(n) => markRead(n.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/notification-stack";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";

defineProps<{ notices: TcNotificationStack["notices"] }>();
const onDismiss = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-notification-stack :notices="notices" @tc-dismiss="onDismiss"></tc-notification-stack>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { NotificationStack } from "@adamstavely/trenchcoat/angular/notification-stack";
import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";

@Component({
  selector: "app-notification-stack-example",
  imports: [NotificationStack],
  template: `<tc-notification-stack [notices]="notices()" (tc-dismiss)="onDismiss($event)"></tc-notification-stack>`,
})
export class NotificationStackExample {
  readonly notices = input.required<TcNotificationStack["notices"]>();
  onDismiss(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/notification-stack";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";

  let { notices }: { notices: TcNotificationStack["notices"] } = $props();
  let el: TcNotificationStack;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-dismiss", on);
    return () => el.removeEventListener("tc-dismiss", on);
  });
</script>

<tc-notification-stack bind:this={el} {notices}></tc-notification-stack>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `notices` | – | `Notice[]` | `[]` | The notices to show, front first |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-dismiss` | – | No | A notice was dismissed; `detail` is the `Notice` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-notification-stack-art-stroke` | `light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.07))` | standard, clean |
| `--tc-notification-stack-art-dot` | `light-dark(#d4d4d4, rgba(255, 255, 255, 0.22))` | standard |
| `--tc-notification-stack-art-fill` | `light-dark(#f5f5f5, rgba(255, 255, 255, 0.04))` | standard |

#### Design tokens it reads (60)

`--tc-accent`, `--tc-accent-subtle`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eyebrow-tracking`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`

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
| `notices` | `el.notices = …;` | `<… notices={…} />` | `<tc-notification-stack :notices="…">` | `<tc-notification-stack [notices]="…">` | `<tc-notification-stack {notices}>` |

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-dismiss` | No | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-notification-stack")` returns a `TcNotificationStack` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";`
- **React / Next.js:** Props: `import type { NotificationStackProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof NotificationStack>`. The element class, for refs: `import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNotificationStack["notices"]` with `import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";`
- **Angular:** The directive types the template: `[notices]` takes `TcNotificationStack["notices"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNotificationStack } from "@adamstavely/trenchcoat/notification-stack";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `notices` | `Notice[]` | The notices to show, front first |
| `onDismiss` | `(notice: Notice) => void` | Called after a notice was dismissed |

*Renamed or hidden on the wrapper: `notices`*

## Accessibility

### Keyboard

There are no keys of its own: Tab reaches the front card's Dismiss button and its action, and Enter or Space
activates them. The cards behind are inert until they come to the front. After a dismissal, focus moves to the next
card's Dismiss button, so people can work through the stack from the keyboard.

### Screen readers

The stack is a region named “Notifications” unless the page names it. The front card is an article named by its
title and its place – “Scheduled maintenance on Sunday, 1 of 4” – with the title as a heading; the cards behind are
hidden from screen readers until they come to the front. The dismiss button is named “Dismiss Scheduled maintenance
on Sunday”. A status line says what happened: “Dismissed Scheduled maintenance on Sunday. 3 more notices.”, and
“No more notices.” after the last.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.8 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **26.7 KB** | **8.1 KB** |
| With Lit – the first component on a page | 48.5 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 81 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of notices replaced |
| First on the page | 1.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.9 ms | notices: first render, 2,001 nodes; update 1.3 ms |
| 1,000 items | 100 ms | notices: first render, 20,001 nodes; update 17 ms |

1,000 items of notices: 100 ms. It renders every item, so a first render passes 50 ms (a long task) at about 500 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the title as the news, in a few words: “Scheduled maintenance on Sunday”.
- Keep the text to one or two sentences that say what changes for the reader and when.
- Name the action by where it goes: “View status page”, “Manage seats” – not “Learn more”.
- Use the badge for the kind of notice (“Billing”, “Security”), one word.

## Do and don't

### Do

- Put the most important notice first – `notices` is front first.
- Set `external: true` on actions that open another site; they open in a new tab with an arrow.
- Remove a notice from `notices` once it no longer applies; one that comes back shows again.

### Don't

- Don't stack urgent errors here – they'd wait behind other notices.
- Don't put more than one action on a notice.
- Don't use it for a feed people scroll – only the front card can be read.

## Related

- [Toaster](toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
