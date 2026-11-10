<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Stories

**Feedback & onboarding** · New

Avatars for people and accounts with a gradient ring for something new – open one for a "what changed" brief: a bento grid of metric, status, note, list, image and link tiles

- **Element:** `<tc-stories>`
- **Size:** 14.2 KB gzip · 49.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/stories";` |
| React / Next.js | `import { Stories } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/stories";` · tags starting with tc- are custom elements |
| Angular | `import { Stories } from "@adamstavely/trenchcoat/angular/stories";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/stories";` |

## Example

The live example is in the gallery at `#/stories`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A row of avatars for the people and accounts someone follows – a teammate, a customer workspace, a project – and a
short brief of what changed for each since they last looked. A gradient ring around an avatar says there's something
new; a quiet gray ring says it's all been seen. Opening one shows a modal brief: who or what it is, how many updates
are new and since when, an optional one-sentence summary, and a bento grid of tiles, each designed for what it holds –
a number that moved, a status change, a note, a list of new things, a picture, a link to act on. The app owns what's
been seen, so the rings stay right across devices and sessions.

### When to use

- Catching up on several people or accounts at once: what moved for each customer workspace, what each teammate
  shipped, how each project is doing since Monday.
- A home or overview page where "what's new, and for whom" is the first question.
- Digests where each update is a fact – a metric, a status, a member added – rather than a message to reply to.

### When not to use

- Updates people must act on or can't miss – use [Notifications](notifications.md).
- One list of changes to a single document or record – use [Change Summary](change-summary.md).
- A single metric with its history – use [KPI Chart](kpi-chart.md).
- One modal with free content and a Close button – use [Dialog](dialog.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-sty__row` – the avatars, scrolling sideways, as one toolbar
2. **Add tile** `.ui-sty__add` – an optional first tile, for posting an update
3. **Ring** `.ui-sty__ring` – the `--tc-story-ring` gradient while something is new, a thin gray ring once seen; round for a person, square for an account
4. **Name** `.ui-sty__label` – the person's or account's name, quieter once everything is seen
5. **Brief** `.ui-sty__panel` – the modal: the avatar, the name and the count line, the summary, the tiles and the foot
6. **Tile** `.ui-sty__tile` – one update with its heading; new ones first, marked New
7. **Foot** `.ui-sty__nav` – Previous and Next with the neighbours' names, and where you are

## Looks

Standard puts the header, the summary and the foot on the gray tray, and each new tile is a white card on it; a seen
tile loses its card and keeps a hairline. Clean is one white surface: tiles are framed by a hairline (fainter once
seen), a hairline sits over the foot, the type is lighter and the icons thinner. The row's ring is 3 px in Standard and
thinner in Clean, with smaller, muted names.

## Usage

### HTML

```html
<tc-stories id="updates" replyable></tc-stories>

<script type="module">
  import "@adamstavely/trenchcoat/stories";
  import "@adamstavely/trenchcoat/tokens.css";

  const updates = document.querySelector("#updates");
  updates.entries = [
    {
      id: "northwind",
      name: "Northwind workspace",
      kind: "account",
      since: "Mon 16:20",
      summary: "Northwind moved to the Business plan and added seven members.",
      updates: [
        { id: "nw-plan", kind: "status", title: "Plan", from: "Team", to: "Business", toTone: "success" },
        { id: "nw-seats", kind: "metric", title: "Seats in use", value: "42 of 50", delta: 7, neutral: true },
        { id: "nw-members", kind: "list", title: "New members", items: ["Priya Shah", "Tom Ellis"], total: 7 },
        { id: "nw-report", kind: "link", title: "Usage report", label: "Open report", href: "/reports/northwind" },
      ],
    },
  ];
  updates.seen = new Set(await (await fetch("/api/updates/seen")).json());
  updates.addEventListener("tc-seen-change", (e) => {
    fetch("/api/updates/seen", { method: "POST", body: JSON.stringify(e.detail.updates.map((u) => u.id)) });
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Stories, type StoryEntry, type StorySeen } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function WhatChanged({ entries, markSeen }: { entries: StoryEntry[]; markSeen: (ids: string[]) => void }) {
  const [seen, setSeen] = useState<StorySeen>(new Set());
  return (
    <Stories
      entries={entries}
      seen={seen}
      onSeenChange={(next, updates) => {
        setSeen(next);
        markSeen(updates.map((u) => u.id));
      }}
      onAction={(update, entry) => console.log(`${update.label} for ${entry.name}`)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/stories";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStories } from "@adamstavely/trenchcoat/stories";

defineProps<{ entries: TcStories["entries"]; seen: TcStories["seen"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-stories :entries="entries" :seen="seen" @tc-open-change="onOpenChange"></tc-stories>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Stories } from "@adamstavely/trenchcoat/angular/stories";
import type { TcStories } from "@adamstavely/trenchcoat/stories";

@Component({
  selector: "app-stories-example",
  imports: [Stories],
  template: `<tc-stories [entries]="entries()" [seen]="seen()" (tc-open-change)="onOpenChange($event)"></tc-stories>`,
})
export class StoriesExample {
  readonly entries = input.required<TcStories["entries"]>();
  readonly seen = input.required<TcStories["seen"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stories";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStories } from "@adamstavely/trenchcoat/stories";

  let { entries, seen }: { entries: TcStories["entries"]; seen: TcStories["seen"] } = $props();
  let el: TcStories;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-stories bind:this={el} {entries} {seen}></tc-stories>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `entries` | – | `StoryEntry[]` | `[]` | The people and accounts, in the order the row shows them; entries with no updates are left out |
| `seen` | – | `StorySeen` | `new Set<string>()` | The update ids that have been seen, as a Set or a record of id → true; the app owns it |
| `open` | – | `StoryOpen` | `null` | The id of the entry whose brief is open, or null when it's closed |
| `addable` | `addable` | `boolean` | `false` | Show the "add" tile first in the row |
| `addLabel` | `add-label` | `string` | `"Add update"` | The "add" tile's text |
| `addAvatar` | `add-avatar` | `string` | `""` | An image for the "add" tile (the person's own avatar); without one it shows a plus |
| `replyable` | `replyable` | `boolean` | `false` | Show a reply field at the foot of the brief; sending fires tc-reply |
| `label` | `label` | `string` | `"Updates"` | The row's accessible name |
| `newLabel` | `new-label` | `string` | `"new"` | Said after a name when there's something new ("Maya Chen, 2 new") |
| `seenLabel` | `seen-label` | `string` | `"seen"` | Said after a name when everything's been seen ("Maya Chen, seen") |
| `markerLabel` | `marker-label` | `string` | `"New"` | The marker on a tile that's new since the last look |
| `describeCount` | – | `(fresh: number, total: number) => string` | – | The header's count line, from the number of new updates and of all of them; `since` follows it after " · " |
| `generatedLabel` | `generated-label` | `string` | `"AI summary"` | The mark on a summary the app says was generated |
| `betterLabel` | `better-label` | `string` | `"better"` | Said after a metric's change when it's the good direction |
| `worseLabel` | `worse-label` | `string` | `"worse"` | Said after a metric's change when it's the bad direction |
| `toLabel` | `to-label` | `string` | `"to"` | Said between a status move's two states ("Draft to In review") |
| `moreLabel` | `more-label` | `string` | `"more"` | After the count of a list's hidden items ("+3 more") |
| `emptyLabel` | `empty-label` | `string` | `"Nothing new yet."` | Shown when there are no entries and no "add" tile |
| `replyLabel` | `reply-label` | `string` | `"Reply to"` | The reply field's placeholder and name, before the entry's name ("Reply to Maya Chen") |
| `sendLabel` | `send-label` | `string` | `"Send"` | The send button's name |
| `closeLabel` | `close-label` | `string` | `"Close"` | The close button's name |
| `previousLabel` | `previous-label` | `string` | `"Previous"` | The word over the previous entry's name |
| `nextLabel` | `next-label` | `string` | `"Next"` | The word over the next entry's name |
| `people` | – | `StoryEntry[]` | – | The same list as `entries`, by its earlier name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A brief is opening, moving to another entry or closing ({ open }: StoryOpenChangeEvent – the entry id, or null); cancelable – prevented, `open` stays as it was |
| `tc-seen-change` | – | Yes | A brief was opened on unseen updates, once per opening ({ seen, entry, updates }: StorySeenChangeEvent – `seen` with every one of them added, in the same shape); cancelable – prevented, `seen` stays as it was |
| `tc-action` | – | Yes | A link or action tile was activated ({ entry, update }: StoryActionEvent); cancelable – prevented, a link doesn't navigate |
| `tc-reply` | – | No | A reply was sent from the brief ({ text, entry }: StoryReplyEvent) |
| `tc-add` | – | No | The "add" tile was activated; detail: undefined |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-story-size` | `var(--tc-space-14)` | both |
| `--tc-story-ring-width` | `calc(var(--tc-space-0-5) + var(--tc-hairline))` | both |
| `--tc-story-account-radius` | `var(--tc-radius-2xl)` | both |
| `--tc-story-ring` | `conic-gradient(from 210deg, var(--tc-tone-amber-solid), var(--tc-tone-rose-solid), var(--tc-tone-pink-solid), var(--tc-tone-violet-solid), var(--tc-tone-amber-solid))` | not set – this fallback applies |
| `--tc-story-ring-seen` | `var(--tc-border-strong)` | not set – this fallback applies |
| `--tc-story-gap` | `var(--tc-surface-base)` | not set – this fallback applies |
| `--tc-story-brief-width` | `760px` | not set – this fallback applies |

#### Design tokens it reads (122)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-neutral`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-14`, `--tc-space-16`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-base`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-pink-solid`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-rose-solid`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tone-violet-solid`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `entries` | `el.entries = …;` | `<… entries={…} />` | `<tc-stories :entries="…">` | `<tc-stories [entries]="…">` | `<tc-stories {entries}>` |
| `seen` | `el.seen = …;` | `<… seen={…} />` | `<tc-stories :seen="…">` | `<tc-stories [seen]="…">` | `<tc-stories {seen}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-stories :open="…">` | `<tc-stories [open]="…">` | `<tc-stories {open}>` |
| `describeCount` | `el.describeCount = …;` | `<… describeCount={…} />` | `<tc-stories :describeCount="…">` | `<tc-stories [describeCount]="…">` | `<tc-stories {describeCount}>` |
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-stories :people="…">` | `<tc-stories [people]="…">` | `<tc-stories {people}>` |

*Also attributes: `addable`, `add-label`, `add-avatar`, `replyable`, `label`, `new-label`, `seen-label`, `marker-label` and 11 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-seen-change` | Yes | `el.addEventListener("tc-seen-change", (e) => …)` | `onSeenChange={…}` | `@tc-seen-change="…"` | `(tc-seen-change)="…($event)"` | `el.addEventListener("tc-seen-change", …)` |
| `tc-action` | Yes | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-reply` | No | `el.addEventListener("tc-reply", (e) => …)` | `onReply={…}` | `@tc-reply="…"` | `(tc-reply)="…($event)"` | `el.addEventListener("tc-reply", …)` |
| `tc-add` | No | `el.addEventListener("tc-add", (e) => …)` | `onAdd={…}` | `@tc-add="…"` | `(tc-add)="…($event)"` | `el.addEventListener("tc-add", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `seen` and `open` itself unless a listener calls `preventDefault()` on `tc-seen-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-stories id="stories"></tc-stories>

<script type="module">
  import "@adamstavely/trenchcoat/stories";

  const el = document.querySelector("#stories");
  el.addEventListener("tc-seen-change", (e) => {
    e.preventDefault(); // the element keeps its seen…
    if (allowed(e.detail.seen)) el.seen = e.detail.seen; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { Stories } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Stories>;
type Props = Omit<Own, "seen" | "onSeenChange"> & { initial: NonNullable<Own["seen"]> };

// Controlled: passing seen makes the wrapper prevent the element's own change; the app sets it
export function ControlledStories({ initial, ...props }: Props) {
  const [seen, setSeen] = useState<Own["seen"]>(initial);
  return <Stories {...props} seen={seen} onSeenChange={(next) => setSeen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/stories";
import type { TcStories } from "@adamstavely/trenchcoat/stories";

const props = defineProps<{ initial: TcStories["seen"] }>();
const seen = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSeenChange = (e: CustomEvent<{ seen: TcStories["seen"] }>) => {
  e.preventDefault();
  seen.value = e.detail.seen;
};
</script>

<template>
  <tc-stories :seen="seen" @tc-seen-change="onSeenChange"></tc-stories>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Stories } from "@adamstavely/trenchcoat/angular/stories";
import type { TcStories } from "@adamstavely/trenchcoat/stories";

@Component({
  selector: "app-controlled-stories",
  imports: [Stories],
  template: `<tc-stories [seen]="seen()" (tc-seen-change)="onSeenChange($event)"></tc-stories>`,
})
export class ControlledStories {
  readonly initial = input.required<TcStories["seen"]>();
  readonly seen = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSeenChange(e: CustomEvent<{ seen: TcStories["seen"] }>) {
    e.preventDefault();
    this.seen.set(e.detail.seen);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stories";
  import type { TcStories } from "@adamstavely/trenchcoat/stories";

  let { initial }: { initial: TcStories["seen"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let seen = $derived(initial);
  let el: TcStories;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      seen = (e as CustomEvent<{ seen: TcStories["seen"] }>).detail.seen;
    };
    el.addEventListener("tc-seen-change", on);
    return () => el.removeEventListener("tc-seen-change", on);
  });
</script>

<tc-stories bind:this={el} {seen}></tc-stories>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-stories")` returns a `TcStories` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStories } from "@adamstavely/trenchcoat/stories";`
- **React / Next.js:** Props: `import type { StoriesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Stories>`. The element class, for refs: `import type { TcStories } from "@adamstavely/trenchcoat/stories";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStories["entries"]` with `import type { TcStories } from "@adamstavely/trenchcoat/stories";`
- **Angular:** The directive types the template: `[entries]` takes `TcStories["entries"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStories } from "@adamstavely/trenchcoat/stories";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStories } from "@adamstavely/trenchcoat/stories";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `entries` | `StoryEntry[]` | The people and accounts, in the order the row shows them |
| `people` | `StoryEntry[]` | The same list as `entries`, by its earlier name |
| `seen` | `StorySeen` | The update ids that have been seen – controlled when given |
| `defaultSeen` | `StorySeen` | The seen update ids on mount when `seen` isn't controlled |
| `onSeenChange` | `(seen: StorySeen, updates: StoryUpdate[], entry: StoryEntry) => void` | A brief was opened on unseen updates: `seen` is the set (or record) with all of them added |
| `open` | `StoryOpen` | The id of the entry whose brief is open, or null when closed – controlled when given |
| `defaultOpen` | `StoryOpen` | The entry open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: StoryOpen) => void` | The brief is opening, moving to another entry, or closing (null) |
| `onAction` | `(update: StoryLinkUpdate, entry: StoryEntry, event: Event) => void` | A link or action tile was activated; call `event.preventDefault()` to stop a link navigating |
| `onAdd` | `() => void` | Shows the "add" tile first in the row; called when it's activated |
| `onReply` | `(text: string, entry: StoryEntry) => void` | Shows a reply field at the brief's foot; called with the text when a reply is sent |

*Renamed or hidden on the wrapper: `seen`, `open`, `addable`, `replyable`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

The row is one tab stop:

| Key | What it does |
|---|---|
| Tab | Moves to the row, on the avatar used last, and on out of it |
| ← / → | Moves to the previous or next avatar, wrapping at the ends |
| Home / End | Moves to the first or last avatar |
| Enter / Space | Opens that entry's brief, or activates the add tile |

In the brief, focus starts on its content (not a tab stop), so ↑ ↓ and Page Up / Page Down scroll it:

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next entry; nothing past either end. Inside the reply field the arrows move the caret instead |
| Tab / Shift+Tab | Moves through Close, the tiles' links and actions, the reply field and Send, then Previous and Next; the page behind is inert |
| Enter / Space | Activates the focused link or button; Enter in the reply field sends |
| Escape | Closes the brief |

Tiles aren't tab stops unless they hold a link or an action. Closing returns focus to the avatar of the entry last
viewed, which may not be the one that was opened. Nothing moves on its own.

### Screen readers

The row is a toolbar named “Updates”. Each avatar is a button named with the entry and its state – “Maya Chen, 4 new”
or “Leo Park, seen” – with `aria-haspopup="dialog"`; the add tile is named by its text, “Add update”. The brief is a
modal dialog named by the entry's name, a level-2 heading, with the count line under it: “4 updates since you last
looked · Tue 09:41”. The tiles are a list; each tile has a level-3 heading, and a new one says “New” after it. A
metric's change is read with its sense – “+1.2 pts, better” or “+14.5%, worse” – and a status move as “Draft to In
review”. A generated summary is marked “AI summary”. Moving to another entry says its name and count line in a polite
status message. Previous and Next are read with the neighbour's name, “Next Northwind workspace”; at an end the button
stays, marked unavailable. Pictures take their `alt`; sparklines are hidden.

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
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| conic-gradient() | 69 (Edge 79) | 83 | 12.1 | 12.1 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 39.2 KB | 11.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **49.3 KB** | **14.3 KB** |
| With Lit – the first component on a page | 71.0 KB | 21.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 39 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of entries replaced |
| First on the page | 7.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.6 ms | entries: first render, 39 nodes; update 0.0 ms |
| 1,000 items | 0.5 ms | entries: first render, 39 nodes; update 0.1 ms |

What it renders doesn't grow with entries (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title each update with what changed, not with what happened to it: “Trial-to-paid conversion”, “Plan”, “New
  members”.
- Format values as your product writes them (“$1,240”, “182 ms”); give a metric's change as a number with `deltaUnit`
  and say which way is good with `lowerIsBetter` or `neutral`.
- Keep the summary to one sentence that says why the updates matter together. Set `summaryGenerated` when a model
  wrote it, so it's marked.
- Pass `since` and `at` already formatted (“Tue 09:41”, “2h”); the element shows them as given.
- Give every image an `alt` that says what it shows, and a caption only when it adds something the picture doesn't.

## Do and don't

### Do

- Store `seen` on your server and pass it back, so the rings agree on every device; one `tc-seen-change` per opening
  carries every update it marked.
- Use size hints sparingly: `wide` for a note or a picture, `tall` for a list. The grid fills the gaps around them.
- Use a link tile for the one next step (“Open report”, “Review”) – it's the tile people can act on.
- Use `kind: "account"` for workspaces, projects and customers, so they read as square marks beside round faces.

### Don't

- Don't put anything people must act on only in a brief – it's for catching up, and it's marked seen when opened.
- Don't fill a brief with every event; five to eight updates that matter read better than twenty.
- Don't use colour alone for good or bad – set `lowerIsBetter` so the change is also read with its sense.

## Related

- [Notifications](notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Dialog](dialog.md) – A native modal with interactive content and restored focus

## Changelog

- **Shared code:** - `internal/modal.ts`, the `ModalController` that `tc-dialog`, `tc-terms-dialog` and `tc-stories` share; - `cardHead()` gains `picture`, `pictureShape` and `keepAside`.
- **`tc-stories`:** opens a "what changed" brief instead of a story player. - **The row stays:** the gradient ring still means something new. - **The brief:** a light modal with an optional summary, then a bento of update tiles (metric, status move, note, list, image, link), new ones first. Previous and Next move between entries. - **Entries:** `entries`, which can be people or accounts; `people` still works. - **Removed:** the timers, video and swipe.
- **Feedback and onboarding:** - `tc-stories`: a gradient ring for new updates that opens a modal viewer; - `tc-background-tasks`.
