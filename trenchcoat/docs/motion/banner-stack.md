<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Banner Stack

**Motion** · New

Notices that pile up instead of pushing the page down – the newest on top, older ones peeking smaller and dimmed behind it, spreading into a list on hover or focus and sliding away when dismissed

- **Element:** `<tc-banner-stack>`
- **Size:** 6.1 KB gzip · 17.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/banner-stack";` |
| React / Next.js | `import { BannerStack } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/banner-stack";` · tags starting with tc- are custom elements |
| Angular | `import { BannerStack } from "@adamstavely/trenchcoat/angular/banner-stack";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/banner-stack";` |

## Example

The live example is in the gallery at `#/motion/banner-stack`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Notices that pile up instead of pushing the page down. The newest sits on top and a few older ones peek out below it, each a little smaller and dimmed. Hovering the stack, or moving focus into it, spreads them into a full list; leaving, or Escape, gathers them again. Dismissing one slides it away and the rest close the gap.

### When to use

- Several system notices that can arrive one after another, such as "Nightly export finished".
- Notices people should be able to look back over without a separate inbox.

### When not to use

- Brief messages that go away on their own – use [Toaster](../components/toaster.md).
- A notification centre with read and unread states – use [Notification Stack](../components/notification-stack.md) or [Notifications](../components/notifications.md).
- A feed people work through – use [Alert Feed](../components/alert-feed.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stack** `[data-ui="bst"]` – the region; its height follows the pile, gathered or spread
2. **Banner** `[data-bst-item]` – your own banners, newest first; the ones behind the front have `data-bst-behind`, and the ones past `limit` have `data-bst-over`
3. **Dismiss** `[data-dismiss]` – any button inside a banner that dismisses it
4. **Status** `.ui-bst__status` – the polite message that reads out a banner that arrives

## Looks

No look of its own. The banners keep theirs; give them a background and a radius so the pile reads as cards. A page can override `--tc-bst-peek` and `--tc-bst-gap` (both `--tc-space-2`), `--tc-bst-shrink` (0.05 per step back) and `--tc-bst-dim`, the tray-coloured veil over the ones behind. It follows `--tc-duration-slow` and `--tc-ease-move`. With reduced motion everything changes at once.

## Usage

### HTML

```html
<tc-banner-stack label="System notices" limit="3">
  <div data-id="export">Nightly export finished <button type="button" data-dismiss>Dismiss</button></div>
  <div data-id="sync">Vendor sync resumed <button type="button" data-dismiss>Dismiss</button></div>
</tc-banner-stack>

<script type="module">
  import "@adamstavely/trenchcoat/banner-stack";
  import "@adamstavely/trenchcoat/tokens.css";
  document.querySelector("tc-banner-stack").addEventListener("tc-dismiss", (e) => console.log("dismissed", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BannerStack } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

type Notice = { id: string; title: string };

export function Notices({ initial }: { initial: Notice[] }) {
  const [notices, setNotices] = useState(initial);
  return (
    <BannerStack label="System notices" onDismiss={(id) => setNotices((n) => n.filter((x) => x.id !== id))}>
      {notices.map((n) => (
        <div key={n.id} data-id={n.id}>
          {n.title}
          <button type="button" data-dismiss>Dismiss</button>
        </div>
      ))}
    </BannerStack>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/banner-stack";
import "@adamstavely/trenchcoat/tokens.css";

const onDismiss = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-banner-stack @tc-dismiss="onDismiss"></tc-banner-stack>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { BannerStack } from "@adamstavely/trenchcoat/angular/banner-stack";

@Component({
  selector: "app-banner-stack-example",
  imports: [BannerStack],
  template: `<tc-banner-stack (tc-dismiss)="onDismiss($event)"></tc-banner-stack>`,
})
export class BannerStackExample {
  onDismiss(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/banner-stack";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";

  let el: TcBannerStack;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-dismiss", on);
    return () => el.removeEventListener("tc-dismiss", on);
  });
</script>

<tc-banner-stack bind:this={el}></tc-banner-stack>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `limit` | `limit` | `number` | `3` | How many banners show while gathered – the newest and the ones peeking behind it |
| `expanded` | `expanded` | `boolean` | `false` | Spread into a full list; hover and focus set it, and a page can too |
| `label` | `label` | `string` | `"Notices"` | The region's name |
| `quiet` | `quiet` | `boolean` | `false` | Don't read out banners that arrive |
| `banners` | – | `HTMLElement[]` | – | The banners still in the stack, newest first: children that aren't leaving, dismissed or a leaving copy |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-dismiss` | – | Yes | A banner is being dismissed ({ id }: BannerStackDismiss); cancelable – prevented, it stays |
| `tc-expanded-change` | – | Yes | The stack is spreading out or gathering ({ expanded }: BannerStackExpandedChange); cancelable – prevented, it stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `dismiss(id: string)` | `void` | Dismisses the banner with this id (its data-id, else its id) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-bst-peek` | `var(--tc-space-2)` | both |
| `--tc-bst-gap` | `var(--tc-space-2)` | both |
| `--tc-bst-shrink` | `0.05` | both |
| `--tc-bst-dim` | `color-mix(in srgb, var(--tc-surface-tray) 55%, transparent)` | both |
| `--tc-bst-front` | `0px` | both |
| `--tc-bst-total` | `0px` | both |
| `--tc-bst-n` | `0` | both |
| `--tc-bst-shown` | `0` | both |

#### Design tokens it reads (15)

`--tc-bst-d`, `--tc-bst-h`, `--tc-bst-i`, `--tc-bst-s`, `--tc-bst-top`, `--tc-bst-x`, `--tc-bst-y`, `--tc-bst-z`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-space-2`, `--tc-space-4`, `--tc-surface-tray`

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

*Also attributes: `limit`, `expanded`, `label`, `quiet` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-dismiss` | Yes | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-banner-stack id="banner-stack"></tc-banner-stack>

<script type="module">
  import "@adamstavely/trenchcoat/banner-stack";

  const el = document.querySelector("#banner-stack");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { BannerStack } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof BannerStack>;
type Props = Omit<Own, "expanded" | "onExpandedChange"> & { initial: NonNullable<Own["expanded"]> };

// Controlled: passing expanded makes the wrapper prevent the element's own change; the app sets it
export function ControlledBannerStack({ initial, ...props }: Props) {
  const [expanded, setExpanded] = useState<Own["expanded"]>(initial);
  return <BannerStack {...props} expanded={expanded} onExpandedChange={(next) => setExpanded(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/banner-stack";
import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";

const props = defineProps<{ initial: TcBannerStack["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcBannerStack["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-banner-stack :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-banner-stack>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BannerStack } from "@adamstavely/trenchcoat/angular/banner-stack";
import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";

@Component({
  selector: "app-controlled-banner-stack",
  imports: [BannerStack],
  template: `<tc-banner-stack [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-banner-stack>`,
})
export class ControlledBannerStack {
  readonly initial = input.required<TcBannerStack["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcBannerStack["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/banner-stack";
  import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";

  let { initial }: { initial: TcBannerStack["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcBannerStack;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcBannerStack["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-banner-stack bind:this={el} {expanded}></tc-banner-stack>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-banner-stack")` returns a `TcBannerStack` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";`
- **React / Next.js:** Props: `import type { BannerStackProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BannerStack>`. The element class, for refs: `import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBannerStack["limit"]` with `import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";`
- **Angular:** The directive types the template: `[limit]` takes `TcBannerStack["limit"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBannerStack } from "@adamstavely/trenchcoat/banner-stack";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `expanded` | `boolean` | Spread into a full list – controlled when given |
| `defaultExpanded` | `boolean` | Start spread out, uncontrolled |
| `onExpandedChange` | `(expanded: boolean) => void` | The stack is spreading out (hover, focus) or gathering (leaving, Escape) |
| `onDismiss` | `(id: string, event: CustomEvent<BannerStackDismiss>) => void` | A banner is being dismissed – remove it from your data; call `event.preventDefault()` to keep it |

*Renamed or hidden on the wrapper: `expanded`*

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| Tab | Moves through the banners' own controls; focus inside spreads the stack |
| Escape | Gathers the stack; it stays gathered until focus or the pointer leaves |
| Enter / Space on Dismiss | Dismisses that banner; focus moves to the next banner's Dismiss |

### Screen readers

The stack is a region named by `label` ("Notices" by default). The banners are read newest first, in the page's order, whether gathered or spread. A banner added after the first render is read out politely; set `quiet` to stop that. Name each Dismiss button with its banner's title, such as "Dismiss Nightly export finished".

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This piece alone** | 10.9 KB | 4.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **17.7 KB** | **6.1 KB** |
| With Lit – the first component on a page | 37.3 KB | 12.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 5.1 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Put the banners in newest first, each with a `data-id`. Keep them short – a title and a line. Listen for `tc-dismiss` and remove the banner from your data; a banner still there afterwards is hidden by the stack itself.

## Do and don't

### Do

- Keep `limit` small (2–4). The peek is a hint that there's more.
- Remove a dismissed banner from your data, so it doesn't come back.

### Don't

- Don't put urgent errors in the stack. They need to stay in view, not under the newest notice.
- Don't add a banner every few seconds. The pile stops meaning anything.

## Related

- [Notification Stack](../components/notification-stack.md) – Notice cards stacked behind each other – dismiss the front one to reveal the next
- [Toaster](../components/toaster.md) – Calm toasts from anywhere – a stack that fans out on hover, promise toasts that morph from spinner to check, swipe to dismiss
- [List Motion](list-motion.md) – Rows that glide when reordered, added or removed, in any framework, instead of jumping
- [Alert Feed](../components/alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements
