<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# PR Link

**Workspace & sessions** · New

A pull request named in running text – its state's mark and owner/repo#number · title as a link, with a card of its state, author, lines changed and files on hover or focus; compact for just #number

- **Element:** `<tc-pr-link>`
- **Size:** 10.0 KB gzip · 29.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/pr-link";` |
| React / Next.js | `import "@adamstavely/trenchcoat/pr-link";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/pr-link";` · tags starting with tc- are custom elements |
| Angular | `import { PrLink } from "@adamstavely/trenchcoat/angular/pr-link";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/pr-link";` |

## Example

The live example is in the gallery at `#/pr-link`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A pull request named in running text: its state's mark – open, draft, merged or closed, each in its colour – then
`owner/repo#number · title` as a link that flows with the sentence. Point at it after a short pause, or Tab to it, and
a small card opens below it with the state as a pill, the repository, number and how long ago, the full title, who wrote
it, the lines added and removed, and how many files changed.

It's for a pull request mentioned in passing – a status update, a chat reply, a changelog. For one pull request you'll
act on, with its review, checks and merge button, use [Pull Request](pull-request.md).

### When to use

- A pull request named in a sentence, a message or a summary, where people want its state without leaving the text.
- Short lists of pull requests, with `compact` for just the mark and number.

### When not to use

- Reviewing or merging a pull request – use [Pull Request](pull-request.md).
- A person's name – use [Person Hovercard](person-hovercard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Link** `.ui-prk__link` – the state's mark `.ui-prk__mark`, then the repository, number and title
2. **Card** `.ui-prk__card` – the state pill `.ui-prk__pill`, repository, number and time, then the title
3. **Foot** `.ui-prk__foot` – the author, lines added and removed, and files changed

## Looks

One look. The link takes the size of the text around it; a long title is cut with an ellipsis at `--tc-prk-title-max`
(32ch) and shown whole in the card. The card uses the shared popover surface, `--tc-prk-card-w` wide. The mark and
pill are green for open, gray for a draft, violet for merged and red for closed.

## Usage

### HTML

```html
<p>
  The illustrations landed in
  <tc-pr-link repo="halden/atlas" number="74" pr-title="Add five workflow stage illustrations" state="merged"
    href="https://code.example/halden/atlas/pull/74" author="noor" additions="4080" deletions="42" files="60"></tc-pr-link>.
</p>

<script type="module">
  import "@adamstavely/trenchcoat/pr-link";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { PrLink } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Update() {
  return (
    <p>
      The illustrations landed in{" "}
      <PrLink repo="halden/atlas" number={74} prTitle="Add five workflow stage illustrations" state="merged" href="https://code.example/halden/atlas/pull/74" author="noor" additions={4080} deletions={42} files={60} />.
    </p>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/pr-link";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";

defineProps<{ labels: TcPrLink["labels"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-pr-link :labels="labels" @tc-open-change="onOpenChange"></tc-pr-link>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PrLink } from "@adamstavely/trenchcoat/angular/pr-link";
import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";

@Component({
  selector: "app-pr-link-example",
  imports: [PrLink],
  template: `<tc-pr-link [labels]="labels()" (tc-open-change)="onOpenChange($event)"></tc-pr-link>`,
})
export class PrLinkExample {
  readonly labels = input.required<TcPrLink["labels"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/pr-link";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";

  let { labels }: { labels: TcPrLink["labels"] } = $props();
  let el: TcPrLink;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-pr-link bind:this={el} {labels}></tc-pr-link>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `repo` | `repo` | `string` | `""` | The repository, "owner/name" |
| `number` | `number` | `number \| undefined` | `undefined` | The pull request's number |
| `prTitle` | `pr-title` | `string` | `""` | Its title |
| `state` | `state` | `PrLinkState` | `"open"` | Open, draft, merged or closed |
| `href` | `href` | `string` | `""` | Where the link goes; without one it's text with the card, not a link |
| `author` | `author` | `string` | `""` | Who wrote it |
| `avatar` | `avatar` | `string` | `""` | The author's picture URL; without one the card shows initials |
| `additions` | `additions` | `number \| undefined` | `undefined` | Lines added |
| `deletions` | `deletions` | `number \| undefined` | `undefined` | Lines removed |
| `files` | `files` | `number \| undefined` | `undefined` | Files changed |
| `updatedAt` | `updated-at` | `number \| undefined` | `undefined` | When it last changed state (opened, merged, closed), epoch ms |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock when the card opens |
| `compact` | `compact` | `boolean` | `false` | Just the mark and #number, without the repository and title |
| `newTab` | `new-tab` | `boolean` | `false` | Open the link in a new tab |
| `hoverDelay` | `hover-delay` | `number` | `350` | How long the pointer rests on the link before the card opens, ms |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and times, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<PrLinkLabels>` | `{}` | The words it uses, to translate or reword |
| `trigger` | – | `HTMLElement \| null` | – | The link (or the text, without `href`) the card belongs to |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | No | The card opened or closed ({ open }: PrLinkOpenChange) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `openCard()` | `void` | Opens the card, pinned open |
| `closeCard()` | `void` | Closes the card |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-prk-title-max` | `32ch` | both |
| `--tc-prk-card-w` | `340px` | both |

#### Design tokens it reads (29)

`--tc-accent-text`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-pr-link :labels="…">` | `<tc-pr-link [labels]="…">` | `<tc-pr-link {labels}>` |

*Also attributes: `repo`, `number`, `pr-title`, `state`, `href`, `author`, `avatar`, `additions` and 8 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-pr-link")` returns a `TcPrLink` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";`
- **React / Next.js:** The element class: `import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPrLink["labels"]` with `import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";`
- **Angular:** The directive types the template: `[labels]` takes `TcPrLink["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPrLink } from "@adamstavely/trenchcoat/pr-link";`

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Reaches the link; the card opens while it has focus |
| Enter | Follows the link |
| Escape | Closes the card; focus stays on the link |

### Screen readers

- The link's name is its text and its state: "halden/atlas#74 · Add five workflow stage illustrations, merged".
- The card is a tooltip the link is described by, so the state, time, author, lines changed and files are read after
  the name. Lines are read as words ("4,080 lines added, 42 removed"), not as + and −.
- The marks are hidden; the state is always in words.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.1 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.7 KB** | **10.0 KB** |
| With Lit – the first component on a page | 49.2 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 8.2 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give the title as the pull request has it; let the link cut it and the card show it.
- Set `updated-at` (`updatedAt`) to when it last changed state – opened, merged or closed – so "1 h ago" means something.
- Leave out what you don't know: the card drops the author, lines or files that aren't given.

## Do and don't

### Do

- Use `compact` once the sentence has named the repository.
- Pass `now` when the page has a clock of its own, so every time on the page agrees.

### Don't

- Put a button or a link in the card; it's a description, and focus never goes into it.
- Use it as a pull request's only status in a list people work through – use [Pull Request](pull-request.md).

## Related

- [Pull Request](pull-request.md) – one pull request at a glance: branches, review, checks, whether it can merge, and the button its state calls for.
- [Person Hovercard](person-hovercard.md) – The profile card behind any name – picture, pronouns, title and team, status, local time and time difference, manager, Email, Message, View profile and links – on hover, focus or tap
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Check Status](check-status.md) – The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.

## Changelog

- **PR Link** (`tc-pr-link`): a pull request named in running text – its state's mark and owner/repo#number · title as a link, with a card of its state, repository, time, author, lines added and removed, and files changed on hover or focus; `compact` for just #number. The card is a tooltip the link is described by.
