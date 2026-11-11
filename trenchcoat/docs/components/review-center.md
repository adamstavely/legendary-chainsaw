<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Review Center

**Agents**

A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in

- **Element:** `<tc-review-center>`
- **Size:** 25.0 KB gzip · 111.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/review-center";` |
| React / Next.js | `import { ReviewCenter } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/review-center";` · tags starting with tc- are custom elements |
| Angular | `import { ReviewCenter } from "@adamstavely/trenchcoat/angular/review-center";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/review-center";` |

## Example

The live example is in the gallery at `#/review-center`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A focused workspace for approving what your agents want to do, one item at a time. The queue on the left is sorted by
risk, then by how long each item has waited; the item you're on shows who proposes it and why, the proposal itself –
fields, a reply, a contract clause, a code diff or a plan – and marks the spans the agent isn't sure about, with its
note and source. Approve, Edit, Reject (with a quick reason) and Skip each have a single key, so a reviewer can work
through dozens of items without the mouse. A decision closes its row with a check or a cross, the next item rises in,
and the last decision can be undone.

### When to use

- A person reviews many agent proposals in a row: refunds, outgoing emails, contract edits, code changes, plans.
- Items carry different risk, and the riskiest or oldest should be handled first.
- Reviewers need to see where the agent is unsure before they approve.

### When not to use

- A single approval inside a chat or a run – use [Approval Card](approval-card.md).
- An inbox of decisions with more context per item and no single-key flow – use [Decision Inbox](decision-inbox.md).
- Messages and updates from agents rather than proposals to approve – use [Agent Inbox](agent-inbox.md).
- Asking for access to a tool or scope at run time – use [Permission Request](permission-request.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading, progress (“12 of 20 reviewed”), the oldest wait and the Undo chip
2. **Filters** `.ui-rvc__filters` – All, High risk and Unsure, with counts
3. **Queue** `.ui-rvc__list` – the waiting items, current one marked
4. **Proposal** `.ui-rvc__proposal` – the fields, text, diff or plan to decide on
5. **Unsure span** `.ui-rvc__flag` – a part the agent isn't sure about; its note shows on hover or focus
6. **Actions** `.ui-rvc__actions` – Approve, Edit, Reject and Skip, each with its key

## Looks

Standard is a white card on a soft gray tray, with the header and progress on the tray above it. Clean is one quiet
white card with hairline dividers. Both mark unsure spans with an amber highlight, turn a
waiting time amber as it nears `sla` and red past it, and put the queue above the item when the element is narrower than about 650 px.

## Usage

### HTML

```html
<tc-review-center id="review" reviewed="11"></tc-review-center>

<script type="module">
  import "@adamstavely/trenchcoat/review-center";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.items = [
    {
      id: "refund-4821",
      title: "Refund order #4821 for Maya Chen",
      agent: "Support agent",
      type: "Refund",
      risk: "medium",
      confidence: 0.64,
      createdAt: Date.now() - 12 * 60_000,
      reasoning: "The parcel was lost in transit; policy allows a full refund.",
      fields: [{ label: "Amount", value: [{ text: "€148.00", note: "Includes shipping – policy may exclude it" }] }],
    },
  ];
  review.onDecide = (item, result) => fetch(`/api/review/${item.id}`, { method: "POST", body: JSON.stringify(result) });
  review.addEventListener("tc-undo", (e) => console.log("Undone", e.detail.item.id));
</script>
```

### React / Next.js

```tsx
import { ReviewCenter, type ReviewItem, type ReviewResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

async function decide(item: ReviewItem, result: ReviewResult) {
  const res = await fetch(`/api/review/${item.id}`, { method: "POST", body: JSON.stringify(result) });
  if (!res.ok) throw new Error("The server didn't save it");
}

export function Approvals({ items }: { items: ReviewItem[] }) {
  return <ReviewCenter items={items} reviewed={11} sla={45 * 60_000} onDecide={decide} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/review-center";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";

defineProps<{ items: TcReviewCenter["items"]; reasons: TcReviewCenter["reasons"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-review-center :items="items" :reasons="reasons" @tc-filter-change="onFilterChange"></tc-review-center>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ReviewCenter } from "@adamstavely/trenchcoat/angular/review-center";
import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";

@Component({
  selector: "app-review-center-example",
  imports: [ReviewCenter],
  template: `<tc-review-center [items]="items()" [reasons]="reasons()" (tc-filter-change)="onFilterChange($event)"></tc-review-center>`,
})
export class ReviewCenterExample {
  readonly items = input.required<TcReviewCenter["items"]>();
  readonly reasons = input.required<TcReviewCenter["reasons"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/review-center";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";

  let { items, reasons }: { items: TcReviewCenter["items"]; reasons: TcReviewCenter["reasons"] } = $props();
  let el: TcReviewCenter;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-review-center bind:this={el} {items} {reasons}></tc-review-center>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `ReviewItem[]` | `[]` | Everything waiting for review – decided items hide themselves, new ids slide in |
| `onDecide` | – | `ReviewDecide \| undefined` | `undefined` | Decides an item; may return a promise (see ReviewDecide) |
| `reviewed` | `reviewed` | `number` | `0` | How many were reviewed before (e.g. today) – the header counts on from here |
| `total` | `total` | `number \| undefined` | `undefined` | The total for the header – defaults to reviewed + waiting |
| `sla` | `sla` | `` | – | How long an item may wait, in ms – the waiting time turns amber at 75% and red past it (default 30 min) |
| `now` | `now` | `number \| undefined` | `undefined` | The clock (epoch ms) – defaults to the real one, read after connecting |
| `lowConfidence` | `low-confidence` | `number` | `0.7` | Below this confidence an item counts as unsure (default 0.7) |
| `reasons` | – | `string[]` | `["Wrong info", "Tone", "Not allowed", "Other"]` | The quick reasons for a rejection, picked with 1–4 |
| `order` | `order` | `"risk" \| "oldest" \| "given"` | `"risk"` | "risk" (default): high risk first, then oldest · "oldest" · "given": as passed |
| `filter` | `filter` | `ReviewFilter` | `"all"` | Which items the queue shows: "all", "high" (high risk only) or "unsure" (below `lowConfidence`). Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Review center"` | The heading |
| `undoTimeout` | – | `number \| false` | `6000` | How long the Undo chip stays after a decision, in ms – false keeps it until the next decision |
| `shortcuts` | `shortcuts` | `boolean` | `true` | The single-key shortcuts while focus is inside – false turns them off; Esc and ⌘/Ctrl combinations keep working |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | The filter changes; detail `{ filter }`. Cancelable: preventDefault() keeps the current one |
| `tc-undo` | – | No | A decision was taken back; detail `{ item, result }` – put the item back if you dropped it |
| `tc-skip` | – | No | An item was skipped; detail `{ item }` |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `approve()` | `void` | – |
| `reject(reason?: string)` | `void` | Opens the reason picker, or rejects right away with a reason |
| `edit(focus: unknown)` | `void` | Edits the current item in place |
| `setDraft(text: string, field?: string)` | `void` | Replaces the draft of the body (or of a field, by its label) while editing |
| `save()` | `void` | Approves with the edits |
| `cancel()` | `void` | – |
| `skip()` | `void` | – |
| `next()` | `void` | – |
| `previous()` | `void` | – |
| `undo()` | `void` | – |
| `peek(index: number \| null)` | `void` | Shows the note of the n-th flagged span of the current item – null hides it |
| `select(id: string)` | `void` | – |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-review-center-tok-kw` | `light-dark(color(display-p3 0.843 0.298 0.507), color(display-p3 0.98 0.52 0.68))` | standard, clean |
| `--tc-review-center-tok-str` | `light-dark(color(display-p3 0.38 0.647 0.378), color(display-p3 0.56 0.82 0.54))` | standard, clean |
| `--tc-review-center-tok-type` | `light-dark(color(display-p3 0.247 0.556 0.969), color(display-p3 0.48 0.7 1))` | standard, clean |
| `--tc-review-center-tok-fn` | `light-dark(color(display-p3 0.587 0.29 0.667), color(display-p3 0.78 0.56 0.88))` | standard, clean |
| `--tc-review-center-progress-edge` | `light-dark(rgba(0, 96, 226, 0.32), rgba(91, 154, 255, 0.42))` | standard, clean |
| `--tc-review-center-progress-mark` | `light-dark(rgba(0, 96, 226, 0.7), rgba(112, 170, 255, 0.85))` | standard, clean |
| `--tc-review-center-queue-bg` | `light-dark(#fafafa, #1f1f22)` | standard |
| `--tc-review-center-code-dim` | `light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.42))` | standard, clean |
| `--tc-review-center-diff-add-bg` | `light-dark(rgba(0, 160, 80, 0.06), rgba(60, 220, 130, 0.07))` | standard, clean |
| `--tc-review-center-diff-del-bg` | `light-dark(rgba(215, 36, 0, 0.05), rgba(255, 90, 70, 0.07))` | standard, clean |
| `--tc-review-center-ins-bg` | `light-dark(rgba(0, 164, 51, 0.13), rgba(60, 220, 130, 0.18))` | standard, clean |
| `--tc-review-center-high-edge` | `light-dark(rgba(215, 36, 0, 0.34), rgba(255, 90, 70, 0.4))` | standard, clean |
| `--tc-review-center-mid-edge` | `light-dark(rgba(204, 110, 0, 0.4), rgba(255, 150, 60, 0.42))` | standard, clean |
| `--tc-review-center-low-edge` | `light-dark(rgba(0, 140, 50, 0.3), rgba(60, 220, 130, 0.36))` | standard, clean |
| `--tc-review-center-flag-bg` | `light-dark(rgba(255, 166, 0, 0.16), rgba(255, 170, 40, 0.16))` | standard, clean |
| `--tc-review-center-flag-edge` | `light-dark(rgba(214, 130, 0, 0.55), rgba(255, 180, 70, 0.55))` | standard, clean |
| `--tc-review-center-flag-hot` | `light-dark(rgba(255, 166, 0, 0.28), rgba(255, 170, 40, 0.28))` | standard, clean |
| `--tc-review-center-flag-ink` | `light-dark(#8a4600, #ffcf8a)` | standard, clean |
| `--tc-review-center-height` | `552px` | standard, clean |
| `--tc-review-center-queue` | `296px` | standard, clean |
| `--tc-review-center-row` | `max(56px, 3.5rem)` | standard, clean |
| `--tc-review-center-arrive` | `2600ms` | standard, clean |
| `--tc-review-center-glow` | `1100ms` | standard, clean |
| `--tc-review-center-tone-bg` | `var(--tc-fill-subtle)` | not set – this fallback applies |
| `--tc-review-center-tone-edge` | `var(--tc-border-default)` | not set – this fallback applies |
| `--tc-review-center-tone-fg` | `var(--tc-text-primary)` | not set – this fallback applies |

#### Design tokens it reads (134)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg-sunken`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-radius`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-review-center :items="…">` | `<tc-review-center [items]="…">` | `<tc-review-center {items}>` |
| `onDecide` | `el.onDecide = …;` | `<… onDecide={…} />` | `<tc-review-center :onDecide="…">` | `<tc-review-center [onDecide]="…">` | `<tc-review-center {onDecide}>` |
| `reasons` | `el.reasons = …;` | `<… reasons={…} />` | `<tc-review-center :reasons="…">` | `<tc-review-center [reasons]="…">` | `<tc-review-center {reasons}>` |
| `undoTimeout` | `el.undoTimeout = …;` | `<… undoTimeout={…} />` | `<tc-review-center :undoTimeout="…">` | `<tc-review-center [undoTimeout]="…">` | `<tc-review-center {undoTimeout}>` |

*Also attributes: `reviewed`, `total`, `sla`, `now`, `low-confidence`, `order`, `filter`, `heading` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-undo` | No | `el.addEventListener("tc-undo", (e) => …)` | `onUndo={…}` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |
| `tc-skip` | No | `el.addEventListener("tc-skip", (e) => …)` | `onSkip={…}` | `@tc-skip="…"` | `(tc-skip)="…($event)"` | `el.addEventListener("tc-skip", …)` |

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-review-center id="review-center"></tc-review-center>

<script type="module">
  import "@adamstavely/trenchcoat/review-center";

  const el = document.querySelector("#review-center");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ReviewCenter } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ReviewCenter>;
type Props = Omit<Own, "filter" | "onFilterChange"> & { initial: NonNullable<Own["filter"]> };

// Controlled: passing filter makes the wrapper prevent the element's own change; the app sets it
export function ControlledReviewCenter({ initial, ...props }: Props) {
  const [filter, setFilter] = useState<Own["filter"]>(initial);
  return <ReviewCenter {...props} filter={filter} onFilterChange={(next) => setFilter(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/review-center";
import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";

const props = defineProps<{ initial: TcReviewCenter["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcReviewCenter["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-review-center :filter="filter" @tc-filter-change="onFilterChange"></tc-review-center>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ReviewCenter } from "@adamstavely/trenchcoat/angular/review-center";
import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";

@Component({
  selector: "app-controlled-review-center",
  imports: [ReviewCenter],
  template: `<tc-review-center [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-review-center>`,
})
export class ControlledReviewCenter {
  readonly initial = input.required<TcReviewCenter["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcReviewCenter["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/review-center";
  import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";

  let { initial }: { initial: TcReviewCenter["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcReviewCenter;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcReviewCenter["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-review-center bind:this={el} {filter}></tc-review-center>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-review-center")` returns a `TcReviewCenter` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";`
- **React / Next.js:** Props: `import type { ReviewCenterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ReviewCenter>`. The element class, for refs: `import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcReviewCenter["items"]` with `import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";`
- **Angular:** The directive types the template: `[items]` takes `TcReviewCenter["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcReviewCenter } from "@adamstavely/trenchcoat/review-center";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `items` | `ReviewItem[]` | Everything waiting for review – decided items hide themselves, new ids slide in |
| `onDecide` | `(item: ReviewItem, result: ReviewResult) => void \| Promise<unknown>` | May return a promise – while it runs the decision shows as saving; a rejection puts the item back with the error |
| `onUndo` | `(item: ReviewItem, result: ReviewResult) => void` | A decision was taken back – put the item back if you dropped it from `items` |
| `onSkip` | `(item: ReviewItem) => void` | An item was skipped – it stays in the queue, marked “skipped”, and the next one opens |
| `filter` | `ReviewFilter` | Which items the queue shows (controlled): "all", "high" or "unsure" |
| `defaultFilter` | `ReviewFilter` | The filter to start with when `filter` isn't given |
| `onFilterChange` | `(filter: ReviewFilter) => void` | Called with the filter the user picked |
| `title` | `string` | The heading (default "Review center") |
| `ref` | `React.Ref<ReviewCenterHandle>` | The imperative handle (the element itself) |

*Renamed or hidden on the wrapper: `heading`, `all`, `high`, `unsure`, `Review center`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| A | Approves the current item |
| E | Edits the proposal in place |
| ⌘ / Ctrl + Enter | While editing: approves with the edits |
| R | Asks why it's rejected; then 1–4 picks a reason and rejects |
| S | Skips the item – it stays in the queue, marked “skipped” |
| J / ↓ | Moves to the next item in the queue |
| K / ↑ | Moves to the previous item |
| F | Shows the note of the next unsure span, in turn |
| Z / U / ⌘Z / Ctrl Z | Undoes the last decision |
| Escape | Cancels editing or rejecting; otherwise closes an open note |
| Tab | Moves through the filters, the current queue row, the proposal and the buttons |

The single keys work while focus is anywhere inside and isn't in a text field; `shortcuts="false"` turns them off,
and Escape and the ⌘ / Ctrl combinations keep working. Every button carries its key in `aria-keyshortcuts`.

### Screen readers

The queue is a list named “Queue”; each row is a button that reads the title, how long it has waited (and whether
it's near or past the limit), the type, the risk and the confidence, with `aria-current` on the item you're on. The
filters are toggle buttons in a group named “Filter the queue”. The proposal is a section named after its type
(“Proposal: Refund”). Each unsure span is focusable and described as “The agent is unsure about this part – press F
or focus it for the agent's note”, and by the note itself while it's open. The reject reasons are a group named
“Why reject it?”. A polite live region confirms each step: “Approved: Refund order #4821 for Maya Chen. 12 of 20
reviewed.”, “Skipped: …”, “Undone – … is back in the queue.”, and “Couldn't approve …: <error>. It is back in the
queue.” when saving fails.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | itself | Titles break where the line fills up instead of into even lines. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 102.5 KB | 22.0 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **111.8 KB** | **25.0 KB** |
| With Lit – the first component on a page | 135.0 KB | 32.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.6 ms** | the gallery demo's data, 165 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of items replaced |
| First on the page | 27 ms | default properties; includes adding its CSS to the document |
| 100 items | 17 ms | items: first render, 1,629 nodes; update 2.7 ms |
| 1,000 items | 131 ms | items: first render, 15,354 nodes; update 20 ms |

1,000 items of items: 131 ms. It renders every item, so a first render passes 50 ms (a long task) at about 380 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document keydown`, `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`, `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each `title` as the action, with its object: “Refund order #4821 for Maya Chen”, “Reply to Jun Park”.
- Keep `reasoning` to one or two sentences the reviewer can check against the proposal.
- Flag only what the agent is genuinely unsure about, with a `note` that says why and a `source` to check.
- Keep `reasons` short and few – they're picked with 1–4: “Wrong info”, “Tone”, “Not allowed”, “Other”.

## Do and don't

### Do

- Return a promise from `onDecide` – the decision shows as saving, and a failure puts the item back with the error.
- Set `sla` to how long items may wait in your process, so overdue ones stand out.
- Pass `reviewed` and `total` so the progress counts the whole session, not only what's on screen.

### Don't

- Don't drop a decided item from `items` before `onDecide` settles – Undo and retry need it.
- Don't use it for low-stakes items that could run without review; approving by habit defeats the purpose.
- Don't turn off the shortcuts for keyboard users without a reason – they make long queues manageable.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
