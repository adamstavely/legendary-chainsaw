<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Comments Panel

**AI & chat**

Comment feed with filters, runnable /edit commands, resolve and a composer

- **Element:** `<tc-comments-panel>`
- **Size:** 13.6 KB gzip · 52.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/comments-panel";` |
| React / Next.js | `import { CommentsPanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/comments-panel";` · tags starting with tc- are custom elements |
| Angular | `import { CommentsPanel } from "@adamstavely/trenchcoat/angular/comments-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/comments-panel";` |

## Example

The live example is in the gallery at `#/comments-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A side panel of comments on a document or a design, where some comments are instructions an assistant can carry out.
A comment that starts with `/edit` gets a Run edit button; once it has run it says “Edit applied” and can be undone.
People filter the feed to questions or edits, sort it, resolve comments as they're dealt with, and add new ones from
the composer at the bottom. Times read “4min ago” and stay current while the panel is on screen.

### When to use

- Review on a page or a draft, where reviewers leave notes and some of them ask for changes.
- Letting people turn a comment into an edit the assistant makes, and take it back.
- A feed of a few to a few dozen comments that one panel can hold.

### When not to use

- A conversation of replies under one comment anchored to a spot – use [Comment Thread](comment-thread.md).
- Reviewing a set of proposed changes, accepting and rejecting them – use [Review Center](review-center.md).
- Showing exactly what an edit changes in the text – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Filters** `.ui-cp__tabs` – All, Questions and Edits, with the number of edits to run
3. **Sort** `.ui-cp__sort` – a menu with Newest first and Oldest first
4. **Comment** `.ui-cp__item` – avatar, name, time, Resolve and the text
5. **Run edit** `.ui-cp__actions` – Run edit, or “Edit applied” with Undo
6. **Composer** `.ui-cp__composer` – your avatar, the field and Send

## Looks

Standard puts the heading and the composer on a gray tray with the feed on a white card between them; the filters are
a segmented track with a raised thumb and Run edit looks like a secondary button. Clean is one white card with
hairline shadows: the filters are separate buttons, the composer is the card's last row under a hairline, Run edit is
the white button with a hairline shadow and a play glyph, and “Running…” shimmers. In both, Resolve shows on hover
(always on touch screens) and a resolved comment is struck through.

## Usage

### HTML

```html
<tc-comments-panel id="comments" closable></tc-comments-panel>

<script type="module">
  import "@adamstavely/trenchcoat/comments-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#comments");
  panel.currentUser = { name: "Jordan Lee" };
  panel.comments = [
    { id: "c1", author: { name: "Maya Chen" }, createdAt: Date.now() - 3_600_000, text: "Should the headline mention the free trial?" },
    { id: "c2", author: { name: "Sam Ortiz" }, createdAt: Date.now() - 600_000, text: "/edit Shorten the intro to two sentences" },
  ];
  panel.onRunEdit = (comment) => fetch(`/api/edits/${comment.id}`, { method: "POST" }).then(() => undefined);
  panel.onUndoEdit = (comment) => fetch(`/api/edits/${comment.id}`, { method: "DELETE" }).then(() => undefined);
  panel.addEventListener("tc-resolved-change", (e) => console.log(e.detail.resolved));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CommentsPanel, type PanelComment } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Review({ initial }: { initial: PanelComment[] }) {
  const [comments, setComments] = useState(initial);
  return (
    <CommentsPanel
      title="Comments"
      comments={comments}
      currentUser={{ name: "Jordan Lee" }}
      onCommentsChange={setComments}
      onRunEdit={async (comment) => {
        await fetch(`/api/edits/${comment.id}`, { method: "POST" });
      }}
      onUndoEdit={async (comment) => {
        await fetch(`/api/edits/${comment.id}`, { method: "DELETE" });
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/comments-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";

defineProps<{ comments: TcCommentsPanel["comments"]; currentUser: TcCommentsPanel["currentUser"] }>();
const onCommentsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-comments-panel :comments="comments" :currentUser="currentUser" @tc-comments-change="onCommentsChange"></tc-comments-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CommentsPanel } from "@adamstavely/trenchcoat/angular/comments-panel";
import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";

@Component({
  selector: "app-comments-panel-example",
  imports: [CommentsPanel],
  template: `<tc-comments-panel [comments]="comments()" [currentUser]="currentUser()" (tc-comments-change)="onCommentsChange($event)"></tc-comments-panel>`,
})
export class CommentsPanelExample {
  readonly comments = input.required<TcCommentsPanel["comments"]>();
  readonly currentUser = input.required<TcCommentsPanel["currentUser"]>();
  onCommentsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/comments-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";

  let { comments, currentUser }: { comments: TcCommentsPanel["comments"]; currentUser: TcCommentsPanel["currentUser"] } = $props();
  let el: TcCommentsPanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-comments-change", on);
    return () => el.removeEventListener("tc-comments-change", on);
  });
</script>

<tc-comments-panel bind:this={el} {comments} {currentUser}></tc-comments-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Comments"` | The heading, and the region's name |
| `comments` | – | `PanelComment[]` | `[]` | The feed, keyed by id – comments added here show first until they appear in it |
| `currentUser` | – | `CommentAuthor` | `{ name: "You" }` | Who writes new comments |
| `onRunEdit` | – | `((comment: PanelComment) => Promise<void> \| void) \| undefined` | `undefined` | Runs an /edit command – resolve when done, reject to show that it failed. Without it the edit is simulated: marked as applied after a beat (and warns once, unless `demo` is set) |
| `onUndoEdit` | – | `((comment: PanelComment) => Promise<void> \| void) \| undefined` | `undefined` | Reverts an edit that onRunEdit applied – resolve when done, reject to keep it applied with an error. Without it an applied edit offers no Undo, since the panel can't take it back on its own |
| `onAdd` | – | `((comment: PanelComment) => Promise<unknown> \| void) \| undefined` | `undefined` | A new comment – may return a promise: pending while it runs, a rejection takes the comment out again |
| `demo` | `demo` | `boolean` | `false` | Demo mode: edits are simulated silently when onRunEdit is missing. For galleries and prototypes |
| `resolved` | – | `string[]` | `[]` | Ids of resolved comments |
| `filter` | `filter` | `CommentsFilter` | `"all"` | The filter tab |
| `closable` | `closable` | `boolean` | `false` | Shows a close button in the header, which fires tc-close |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-comments-change` | – | Yes | A comment was added here, or taken out again when onAdd failed; detail `{ comments: PanelComment[] }` is the whole feed. Cancelable: preventDefault() keeps an added comment out until the app passes it back. |
| `tc-resolved-change` | – | Yes | A comment was resolved or reopened; detail `{ resolved: string[] }`. Cancelable. |
| `tc-filter-change` | – | Yes | Another filter was picked; detail `{ filter: CommentsFilter }`. Cancelable. |
| `tc-close` | – | No | The close button was pressed (shown with `closable`); detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-comments-panel-initials-bg` | `light-dark(#eef3ff, rgba(47, 107, 255, 0.16))` | standard |
| `--tc-comments-panel-avatar-ring` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08))` | standard |
| `--tc-comments-panel-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | clean |
| `--tc-comments-panel-max-height` | `360px` | not set – this fallback applies |

#### Design tokens it reads (103)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `comments` | `el.comments = …;` | `<… comments={…} />` | `<tc-comments-panel :comments="…">` | `<tc-comments-panel [comments]="…">` | `<tc-comments-panel {comments}>` |
| `currentUser` | `el.currentUser = …;` | `<… currentUser={…} />` | `<tc-comments-panel :currentUser="…">` | `<tc-comments-panel [currentUser]="…">` | `<tc-comments-panel {currentUser}>` |
| `onRunEdit` | `el.onRunEdit = …;` | `<… onRunEdit={…} />` | `<tc-comments-panel :onRunEdit="…">` | `<tc-comments-panel [onRunEdit]="…">` | `<tc-comments-panel {onRunEdit}>` |
| `onUndoEdit` | `el.onUndoEdit = …;` | `<… onUndoEdit={…} />` | `<tc-comments-panel :onUndoEdit="…">` | `<tc-comments-panel [onUndoEdit]="…">` | `<tc-comments-panel {onUndoEdit}>` |
| `onAdd` | `el.onAdd = …;` | `<… onAdd={…} />` | `<tc-comments-panel :onAdd="…">` | `<tc-comments-panel [onAdd]="…">` | `<tc-comments-panel {onAdd}>` |
| `resolved` | `el.resolved = …;` | `<… resolved={…} />` | `<tc-comments-panel :resolved="…">` | `<tc-comments-panel [resolved]="…">` | `<tc-comments-panel {resolved}>` |

*Also attributes: `heading`, `demo`, `filter`, `closable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-comments-change` | Yes | `el.addEventListener("tc-comments-change", (e) => …)` | `onCommentsChange={…}` | `@tc-comments-change="…"` | `(tc-comments-change)="…($event)"` | `el.addEventListener("tc-comments-change", …)` |
| `tc-resolved-change` | Yes | `el.addEventListener("tc-resolved-change", (e) => …)` | `onResolvedChange={…}` | `@tc-resolved-change="…"` | `(tc-resolved-change)="…($event)"` | `el.addEventListener("tc-resolved-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

### Controlled

The element changes `comments`, `resolved` and `filter` itself unless a listener calls `preventDefault()` on `tc-comments-change`, `tc-resolved-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-comments-panel id="comments-panel"></tc-comments-panel>

<script type="module">
  import "@adamstavely/trenchcoat/comments-panel";

  const el = document.querySelector("#comments-panel");
  el.addEventListener("tc-comments-change", (e) => {
    e.preventDefault(); // the element keeps its comments…
    if (allowed(e.detail.comments)) el.comments = e.detail.comments; // …until the app sets it
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
import "@adamstavely/trenchcoat/comments-panel";
import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";

const props = defineProps<{ initial: TcCommentsPanel["comments"] }>();
const comments = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCommentsChange = (e: CustomEvent<{ comments: TcCommentsPanel["comments"] }>) => {
  e.preventDefault();
  comments.value = e.detail.comments;
};
</script>

<template>
  <tc-comments-panel :comments="comments" @tc-comments-change="onCommentsChange"></tc-comments-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CommentsPanel } from "@adamstavely/trenchcoat/angular/comments-panel";
import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";

@Component({
  selector: "app-controlled-comments-panel",
  imports: [CommentsPanel],
  template: `<tc-comments-panel [comments]="comments()" (tc-comments-change)="onCommentsChange($event)"></tc-comments-panel>`,
})
export class ControlledCommentsPanel {
  readonly initial = input.required<TcCommentsPanel["comments"]>();
  readonly comments = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCommentsChange(e: CustomEvent<{ comments: TcCommentsPanel["comments"] }>) {
    e.preventDefault();
    this.comments.set(e.detail.comments);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/comments-panel";
  import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";

  let { initial }: { initial: TcCommentsPanel["comments"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let comments = $derived(initial);
  let el: TcCommentsPanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      comments = (e as CustomEvent<{ comments: TcCommentsPanel["comments"] }>).detail.comments;
    };
    el.addEventListener("tc-comments-change", on);
    return () => el.removeEventListener("tc-comments-change", on);
  });
</script>

<tc-comments-panel bind:this={el} {comments}></tc-comments-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-comments-panel")` returns a `TcCommentsPanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";`
- **React / Next.js:** Props: `import type { CommentsPanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CommentsPanel>`. The element class, for refs: `import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCommentsPanel["comments"]` with `import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";`
- **Angular:** The directive types the template: `[comments]` takes `TcCommentsPanel["comments"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCommentsPanel } from "@adamstavely/trenchcoat/comments-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `onCommentsChange` | `(comments: PanelComment[]) => void` | The whole feed after a comment was added here (or taken out again when onAdd failed) |
| `resolved` | `string[]` | Ids of resolved comments – controlled when defined |
| `defaultResolved` | `string[]` | Resolved ids to start with when uncontrolled |
| `onResolvedChange` | `(resolved: string[]) => void` | Called with every resolved id after a comment is resolved or reopened |
| `filter` | `CommentsFilter` | The filter tab – controlled when defined |
| `defaultFilter` | `CommentsFilter` | The filter tab to start with when uncontrolled |
| `onFilterChange` | `(filter: CommentsFilter) => void` | Called when another filter is picked |
| `onClose` | `() => void` | Shows a close button in the header |

*Renamed or hidden on the wrapper: `heading`, `resolved`, `filter`, `closable`*

## Accessibility

Follows the WAI-ARIA [Menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through close, the filters, Sort, each comment's Resolve and Run edit or Undo, and the composer |
| Enter / Space | Presses the focused button: picks a filter, resolves or reopens, runs or undoes an edit |
| ↓ / ↑ | On Sort: opens the menu on the first or last option; in the menu, moves between options, wrapping round |
| Home / End | In the sort menu: moves to the first or last option |
| Escape | In the sort menu: closes it and returns focus to Sort |
| Tab | In the sort menu: closes it and moves on |
| Enter | In the composer: sends the comment (not while an IME composition is open) |

Run edit keeps focus while it runs and hands it to Undo; Undo hands it back to Run edit. Without Undo, focus moves to
the comment's Resolve. After sending, focus returns to the field.

### Screen readers

The host is a region named by the heading. The filters are a group named “Filter comments” of toggle buttons with
`aria-pressed`; Edits reads its badge as “Edits, 2 to run”. Sort is a menu button (“Sort comments”, `aria-haspopup`,
`aria-expanded`) whose options are `menuitemradio` with `aria-checked`. Resolve is a toggle named “Resolve comment”
or “Reopen comment”. Times are `<time>` elements with the full date. A comment still being saved is `aria-busy`. The
feed itself isn't live; a status region says “Comment added.”, “Edit applied.” and “Edit undone.”, and failures are
alerts: “The edit couldn't be applied.”, “The edit couldn't be undone.”, “The comment couldn't be added.”

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/controllers | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 43.1 KB | 10.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **52.4 KB** | **13.7 KB** |
| With Lit – the first component on a page | 74.3 KB | 20.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 85 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of comments replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.6 ms | comments: first render, 1,054 nodes; update 0.9 ms |
| 1,000 items | 60 ms | comments: first render, 10,234 nodes; update 7.0 ms |

1,000 items of comments: 60 ms. It renders every item, so a first render passes 50 ms (a long task) at about 830 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`, `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- Timers: `setInterval, cleared`, `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Listens on the page: `document visibilitychange`, `window pointerdown`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep the heading to what's being commented on, or “Comments”.
- Start an instruction with `/edit` and say the change plainly: “/edit Shorten the intro paragraph to two sentences”.
- End questions with a question mark – that is how the Questions filter finds them.
- Use real names for authors; without an avatar the panel shows their initials.

## Do and don't

### Do

- Pass `onRunEdit` and `onUndoEdit` together; without `onUndoEdit` an applied edit offers no Undo, because the panel
  can't take it back on its own.
- Reject the promise from `onRunEdit`, `onUndoEdit` or `onAdd` when the work fails – the panel says so and lets people
  try again.
- Add the comment to `comments` when `tc-comments-change` reports it; the panel matches it by id and doesn't double it.

### Don't

- Don't ship without `onRunEdit`: the panel then only simulates edits, and warns once in the console unless `demo` is
  set.
- Don't delete resolved comments from the feed – resolving keeps them, struck through, so the history stays.
- Don't use `/edit` comments for things the assistant can't do; Run edit promises an action.

## Related

- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
