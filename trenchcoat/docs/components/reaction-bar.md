<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Reaction Bar

**Inputs & controls**

Like, comment, repost and share in one pill – icons pop and fill, counts roll in digit by digit

- **Element:** `<tc-reaction-bar>`
- **Size:** 6.6 KB gzip · 20.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/reaction-bar";` |
| React / Next.js | `import { ReactionBar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/reaction-bar";` · tags starting with tc- are custom elements |
| Angular | `import { ReactionBar } from "@adamstavely/trenchcoat/angular/reaction-bar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/reaction-bar";` |

## Example

The live example is in the gallery at `#/reaction-bar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Like, comment, repost and share for a post, in one pill. Each action is a toggle: tapping it marks it as taken,
pops its icon and moves its count by one, and the new number rolls in digit by digit. Counts are shortened the way
social apps do it (“1.3K”, “12K”, “1.2M”), so the bar stays compact on busy posts. The bar shows what you pass in
`reactions` and keeps a tap locally until your data for that action changes.

### When to use

- Social and community feeds: posts, updates, shared work that people react to.
- Showing how much engagement something has and letting people add to it in the same place.
- Any subset of the four actions – `actions` hides the ones a surface doesn't support.

### When not to use

- Actions on an AI answer (copy, regenerate, thumbs up and down) – use [Message Actions](message-actions.md).
- Replies and discussion on a piece of work – use [Comment Thread](comment-thread.md).
- A single on/off choice in a form or toolbar – use [Segmented Control](segmented-control.md) or a [Button](button.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Action** `.ui-rb__btn[data-kind="share"]` – one toggle button: like, comment, repost or share
2. **Icon** `.ui-rb__btn[data-kind="comment"] .ui-rb__icon` – fills and pops when the action is taken
3. **Count** `.ui-rb__btn[data-kind="repost"] .ui-rb__count` – the shortened count, gliding to its new width
4. **Digit** `.ui-rb__btn[data-kind="like"] .ui-rb__digit` – each character of the count, rolling in on change

## Looks

Standard is a raised pill on the overlay surface with 22 px icons; a taken action takes its own colour – pink for
like, blue for comment, violet for repost – and its icon fills and gets a heavier line. Clean is a row of quiet
chips with a hairline edge and 16 px icons; a taken action gets a light blue tint and a blue hairline. On touch
screens Clean's chips grow to 36 px high.

## Usage

### HTML

```html
<tc-reaction-bar id="reactions"></tc-reaction-bar>

<script type="module">
  import "@adamstavely/trenchcoat/reaction-bar";
  import "@adamstavely/trenchcoat/tokens.css";

  const bar = document.querySelector("#reactions");
  bar.reactions = { like: { count: 1299 }, comment: { count: 86 }, share: { count: 41, active: true } };
  bar.actions = ["like", "comment", "share"];
  bar.addEventListener("tc-reaction-change", (e) => console.log(e.detail.key, e.detail.state));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ReactionBar, type ReactionKey, type ReactionState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PostReactions() {
  const [reactions, setReactions] = useState<Partial<Record<ReactionKey, ReactionState>>>({
    like: { count: 1299 },
    comment: { count: 86 },
  });
  return (
    <ReactionBar
      actions={["like", "comment"]}
      reactions={reactions}
      onReact={(key, state) => setReactions((r) => ({ ...r, [key]: state }))}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/reaction-bar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";

defineProps<{ reactions: TcReactionBar["reactions"]; actions: TcReactionBar["actions"] }>();
const onReactionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-reaction-bar :reactions="reactions" :actions="actions" @tc-reaction-change="onReactionChange"></tc-reaction-bar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ReactionBar } from "@adamstavely/trenchcoat/angular/reaction-bar";
import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";

@Component({
  selector: "app-reaction-bar-example",
  imports: [ReactionBar],
  template: `<tc-reaction-bar [reactions]="reactions()" [actions]="actions()" (tc-reaction-change)="onReactionChange($event)"></tc-reaction-bar>`,
})
export class ReactionBarExample {
  readonly reactions = input.required<TcReactionBar["reactions"]>();
  readonly actions = input.required<TcReactionBar["actions"]>();
  onReactionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/reaction-bar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";

  let { reactions, actions }: { reactions: TcReactionBar["reactions"]; actions: TcReactionBar["actions"] } = $props();
  let el: TcReactionBar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-reaction-change", on);
    return () => el.removeEventListener("tc-reaction-change", on);
  });
</script>

<tc-reaction-bar bind:this={el} {reactions} {actions}></tc-reaction-bar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `reactions` | – | `Partial<Record<ReactionKey, ReactionState>>` | `{}` | Counts and whether each action is already taken; a tap applies locally until an action's value here changes |
| `actions` | – | `ReactionKey[]` | `["like", "comment", "repost", "share"]` | The actions to show, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-reaction-change` | – | Yes | An action was toggled; detail `{ key: ReactionKey, state: { count, active } }`. Cancelable: preventDefault() keeps the tap from applying. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-reaction-bar-ease` | `cubic-bezier(0.85, 0, 0.15, 1)` | standard, clean |
| `--tc-reaction-bar-h` | `36px` | clean |

#### Design tokens it reads (37)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-default`, `--tc-border-selected`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-reaction-bar-tone`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-status-info-solid`, `--tc-surface-overlay`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-pink-solid`, `--tc-tone-violet-solid`

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
| `reactions` | `el.reactions = …;` | `<… reactions={…} />` | `<tc-reaction-bar :reactions="…">` | `<tc-reaction-bar [reactions]="…">` | `<tc-reaction-bar {reactions}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-reaction-bar :actions="…">` | `<tc-reaction-bar [actions]="…">` | `<tc-reaction-bar {actions}>` |

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-reaction-change` | Yes | `el.addEventListener("tc-reaction-change", (e) => …)` | `onReact={…}` | `@tc-reaction-change="…"` | `(tc-reaction-change)="…($event)"` | `el.addEventListener("tc-reaction-change", …)` |

### Controlled

`tc-reaction-change` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-reaction-bar")` returns a `TcReactionBar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";`
- **React / Next.js:** Props: `import type { ReactionBarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ReactionBar>`. The element class, for refs: `import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcReactionBar["reactions"]` with `import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";`
- **Angular:** The directive types the template: `[reactions]` takes `TcReactionBar["reactions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcReactionBar } from "@adamstavely/trenchcoat/reaction-bar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `reactions` | `Partial<Record<ReactionKey, ReactionState>>` | Counts and whether each action is already taken. The bar follows this prop: a tap changes an action locally until the prop's value for that action changes, which then wins. To own the state, update it from `onReact`. |
| `onReact` | `(key: ReactionKey, state: Required<ReactionState>) => void` | Called after an action was toggled, with its new state |
| `actions` | `ReactionKey[]` | Hide actions you don't need – the list may change after mount |

*Renamed or hidden on the wrapper: `reactions`, `actions`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the next action |
| Enter / Space | Toggles the focused action |

### Screen readers

The bar is a group named “Reactions” (keep your own `aria-label` or `aria-labelledby` if you set one). Each action
is a button with `aria-pressed` for whether it's taken, and its name carries the count as shown: “Like, 1.3K likes”,
“Comment, 1 comment”, or “Share” when the count is zero. The rolling digits are hidden from assistive technology;
counts of 1,000 or more also get a tooltip with the full number (“1,299 likes”).

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 13.4 KB | 4.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **20.1 KB** | **6.6 KB** |
| With Lit – the first component on a page | 42.1 KB | 13.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 37 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of actions replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 23 ms | actions: first render, 925 nodes; update 1.5 ms |
| 1,000 items | 455 ms | actions: first render, 9,250 nodes; update 6.2 ms |

1,000 items of actions: 455 ms. It renders every item, so a first render passes 50 ms (a long task) at about 110 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pass exact counts – the bar shortens them; don't pre-format them as strings.
- Leave a count at 0 rather than inventing one: a zero count shows the icon alone.
- Keep the actions in the default order (like, comment, repost, share) so people find them where they expect.

## Do and don't

### Do

- Mark the person's own reactions with `active: true` so the bar opens in the right state.
- Save each change from `tc-reaction-change` and pass the new counts back – the property then wins over the local tap.
- Show only the actions the surface supports, with `actions`.

### Don't

- Don't use it for more than these four actions – it has no slot for custom ones.
- Don't show it where reactions can't be saved – the tap sticks locally and the count will be wrong on reload.
- Don't override the group's name with something vague – “Reactions” or “Reactions to Jonas's post” both work.

## Related

- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Project Card](project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
