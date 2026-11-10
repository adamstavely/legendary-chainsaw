<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Verification Queue

**Trust & calibration** · New

Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported

- **Element:** `<tc-verification-queue>`
- **Size:** 18.2 KB gzip · 63.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/verification-queue";` |
| React / Next.js | `import { VerificationQueue } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/verification-queue";` · tags starting with tc- are custom elements |
| Angular | `import { VerificationQueue } from "@adamstavely/trenchcoat/angular/verification-queue";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/verification-queue";` |

## Example

The live example is in the gallery at `#/verification-queue`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every claim worth checking from a session, in one queue, before anything leaves it. Claims arrive from an answer
(`claim-answer`'s “Send to verification”); a person checks each one outside the model and marks it verified
externally, can't verify, incorrect or dismissed, with the source passage it rests on beside it. The export stays
blocked until the claims are reviewed, so nothing the model said goes out unchecked. Single keys mark a claim and
move to the next, and long sessions stay fast – the list renders only the rows on screen.

Checking a claim means something different for each kind of source, so a source type can have verdicts in its own
words: a transcript claim might be “Matches the recording”, “Transcript misheard” or “Dismiss”; an OCR claim “OCR
misread” or “Misrepresents source”. Each verdict counts under one of the four statuses, so the progress, the filters
and the export gate work as before; the claim keeps which verdict it was given. Types without verdicts of their own
keep the four marks.

### When to use

- Before a report, a brief or a decision built with AI help is exported, sent or filed.
- Sessions where people send claims to check as they read, and come back to them together.
- Products that must show that a person reviewed what the model said, claim by claim.

### When not to use

- Approving or rejecting what an agent wants to do – use [Review Center](review-center.md).
- A few quick yes / no decisions – use [Decision Inbox](decision-inbox.md).
- Checking claims inside the answer, where they were made – use [Claim Answer](claim-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Progress** `.ui-vq__progress` – under the heading: how many claims are reviewed, coloured by verdict
2. **Filters** `.ui-vq__filters` – To review, Reviewed or All, with counts
3. **List** `.ui-vq__rows` – the claims, each with its status, origin and source type
4. **Claim** `.ui-vq__row` – one claim; the one you're on is marked
5. **Detail** `.ui-vq__detail` – the claim in full, where it came from and its source passages
6. **Marks** `.ui-vq__marks` – Verified, Can't verify, Incorrect and Dismiss with their keys – or the claim's own source type's verdicts
7. **Export gate** `.ui-vq__foot` – why the export is blocked, or that it's ready, and Export

## Looks

Standard puts the heading and progress on the gray tray, the list and the claim you're on in a white card – the
claim on a light gray well – and the export gate on the tray below. Clean is one white card divided by hairlines,
with the heading in the strong text colour and thinner icons. Both mark statuses with the same shapes: a dashed
ring to review, a check, a question mark, a cross and a dash.

## Usage

### HTML

```html
<tc-verification-queue id="queue" export-label="Export brief"></tc-verification-queue>

<script type="module">
  import "@adamstavely/trenchcoat/verification-queue";
  import "@adamstavely/trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.sources = [{ id: "quote", site: "Freight quote", title: "Carrier quote", quote: "Per-order cost: $6.42 against $6.17." }];
  queue.claims = [
    { id: "c1", text: "The northern hub costs about 4% more per order.", source: "grounded", sources: ["quote"], origin: "Turn 2" },
    { id: "c2", text: "Fuel prices will decide much of the gap.", source: "model", origin: "Turn 3" },
    { id: "c3", text: "The lease starts in February.", source: "ocr", recognition: 0.72, origin: "Turn 4" },
  ];
  queue.verdicts = {
    ocr: [
      { id: "matches", label: "Matches the original", status: "verified" },
      { id: "misread", label: "OCR misread", status: "incorrect" },
      { id: "misrepresents", label: "Misrepresents source", status: "incorrect", key: "m" },
    ],
  };
  queue.addEventListener("tc-review", (e) => save(e.detail.claim.id, e.detail.status, e.detail.verdict?.id));
  queue.addEventListener("tc-export", (e) => exportBrief(e.detail.claims));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { VerificationQueue, type VerificationClaim, type VerificationVerdict } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const verdicts: { transcript: VerificationVerdict[] } = {
  transcript: [
    { id: "matches", label: "Matches the recording", status: "verified" },
    { id: "misheard", label: "Transcript misheard", status: "incorrect" },
    { id: "dismiss", label: "Dismiss", status: "dismissed" },
  ],
};

export function Review({ initial }: { initial: VerificationClaim[] }) {
  const [claims, setClaims] = useState(initial);
  return (
    <VerificationQueue
      title="Claims to check"
      claims={claims}
      onClaimsChange={setClaims}
      verdicts={verdicts}
      onReview={(claim, status, _previous, verdict) => console.log(claim.id, status, verdict?.id)}
      exportLabel="Export brief"
      onExport={({ claims, counts }) => console.log(claims.length, counts.verified)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/verification-queue";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";

defineProps<{ claims: TcVerificationQueue["claims"]; sources: TcVerificationQueue["sources"] }>();
const onClaimsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-verification-queue :claims="claims" :sources="sources" @tc-claims-change="onClaimsChange"></tc-verification-queue>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { VerificationQueue } from "@adamstavely/trenchcoat/angular/verification-queue";
import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";

@Component({
  selector: "app-verification-queue-example",
  imports: [VerificationQueue],
  template: `<tc-verification-queue [claims]="claims()" [sources]="sources()" (tc-claims-change)="onClaimsChange($event)"></tc-verification-queue>`,
})
export class VerificationQueueExample {
  readonly claims = input.required<TcVerificationQueue["claims"]>();
  readonly sources = input.required<TcVerificationQueue["sources"]>();
  onClaimsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/verification-queue";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";

  let { claims, sources }: { claims: TcVerificationQueue["claims"]; sources: TcVerificationQueue["sources"] } = $props();
  let el: TcVerificationQueue;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-claims-change", on);
    return () => el.removeEventListener("tc-claims-change", on);
  });
</script>

<tc-verification-queue bind:this={el} {claims} {sources}></tc-verification-queue>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `claims` | – | `VerificationClaim[]` | `[]` | The claims in the queue, in the order they arrived; each one's `status` says where it stands |
| `sources` | – | `ClaimSource[]` | `[]` | The passages the claims rest on, looked up by id |
| `heading` | `heading` | `string` | `"Verification queue"` | The heading, and the region's name |
| `allowUnreviewed` | `allow-unreviewed` | `number` | `0` | How many claims may be left to review with the export still allowed (default 0: every claim) |
| `exportLabel` | `export-label` | `string` | `"Export"` | The export button |
| `shortcuts` | `shortcuts` | `boolean` | `true` | Single-key marks on the list (V C X D U); false turns them off |
| `maxHeight` | `max-height` | `number` | `320` | The tallest the list grows, in px, before it scrolls |
| `now` | `now` | `number \| undefined` | `undefined` | The moment source freshness is counted to (epoch ms), passed to every validity badge |
| `statusLabels` | – | `Partial<Record<VerificationStatus, string>>` | `{}` | The names of the statuses – in place of To review, Verified externally, Can't verify, Incorrect and Dismissed |
| `actionLabels` | – | `Partial<Record<Exclude<VerificationStatus, "pending">, string>>` | `{}` | The short labels on the toolbar's buttons – in place of Verified, Can't verify, Incorrect and Dismiss |
| `sourceLabels` | – | `Partial<Record<ClaimSourceType, string>>` | `{}` | The names of the source types, as tc-claim-answer's `sourceLabels` |
| `verdicts` | – | `Partial<Record<ClaimSourceType, VerificationVerdict[]>>` | `{}` | Verdicts for particular source types, in their own words – e.g. `{ ocr: [{ id: "confirmed", label: "Confirmed against original", status: "verified" }, { id: "misread", label: "OCR misread", status: "incorrect" }] }`. Types without an entry keep the four marks |
| `filter` | `filter` | `VerificationFilter` | `"open"` | What the list shows: the claims still to review, the reviewed ones, or all |
| `counts` | – | `VerificationCounts` | – | How many claims there are in each status |
| `exportReady` | – | `` | – | The export is allowed: no more than `allowUnreviewed` claims are left to review |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-claims-change` | – | Yes | A claim was marked; detail `{ claims, claim, status }` (VerificationClaimsChange) – the whole list after the change. Cancelable. |
| `tc-review` | – | No | A claim was marked (after tc-claims-change, whether or not that was prevented); detail `{ claim, status, previous }` (VerificationReviewDetail) |
| `tc-filter-change` | – | Yes | A filter button was pressed; detail `{ filter }` (VerificationFilterChange). Cancelable. |
| `tc-export` | – | No | Export was pressed with the gate open; detail `{ claims, counts }` (VerificationExportDetail) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-verification-queue-max` | `320px` | not set – this fallback applies |

#### Design tokens it reads (93)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-source-grounded-bg`, `--tc-source-grounded-fg`, `--tc-source-inferred-bg`, `--tc-source-inferred-fg`, `--tc-source-media-bg`, `--tc-source-media-fg`, `--tc-source-memory-bg`, `--tc-source-memory-fg`, `--tc-source-model-bg`, `--tc-source-model-fg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-verification-queue-bg`, `--tc-verification-queue-fg`, `--tc-verification-queue-src`, `--tc-verification-queue-src-bg`

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
| `claims` | `el.claims = …;` | `<… claims={…} />` | `<tc-verification-queue :claims="…">` | `<tc-verification-queue [claims]="…">` | `<tc-verification-queue {claims}>` |
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-verification-queue :sources="…">` | `<tc-verification-queue [sources]="…">` | `<tc-verification-queue {sources}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-verification-queue :statusLabels="…">` | `<tc-verification-queue [statusLabels]="…">` | `<tc-verification-queue {statusLabels}>` |
| `actionLabels` | `el.actionLabels = …;` | `<… actionLabels={…} />` | `<tc-verification-queue :actionLabels="…">` | `<tc-verification-queue [actionLabels]="…">` | `<tc-verification-queue {actionLabels}>` |
| `sourceLabels` | `el.sourceLabels = …;` | `<… sourceLabels={…} />` | `<tc-verification-queue :sourceLabels="…">` | `<tc-verification-queue [sourceLabels]="…">` | `<tc-verification-queue {sourceLabels}>` |
| `verdicts` | `el.verdicts = …;` | `<… verdicts={…} />` | `<tc-verification-queue :verdicts="…">` | `<tc-verification-queue [verdicts]="…">` | `<tc-verification-queue {verdicts}>` |

*Also attributes: `heading`, `allow-unreviewed`, `export-label`, `shortcuts`, `max-height`, `now`, `filter` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-claims-change` | Yes | `el.addEventListener("tc-claims-change", (e) => …)` | `onClaimsChange={…}` | `@tc-claims-change="…"` | `(tc-claims-change)="…($event)"` | `el.addEventListener("tc-claims-change", …)` |
| `tc-review` | No | `el.addEventListener("tc-review", (e) => …)` | `onReview={…}` | `@tc-review="…"` | `(tc-review)="…($event)"` | `el.addEventListener("tc-review", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

### Controlled

The element changes `claims` and `filter` itself unless a listener calls `preventDefault()` on `tc-claims-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-verification-queue id="verification-queue"></tc-verification-queue>

<script type="module">
  import "@adamstavely/trenchcoat/verification-queue";

  const el = document.querySelector("#verification-queue");
  el.addEventListener("tc-claims-change", (e) => {
    e.preventDefault(); // the element keeps its claims…
    if (allowed(e.detail.claims)) el.claims = e.detail.claims; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { VerificationQueue } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof VerificationQueue>;
type Props = Omit<Own, "claims" | "onClaimsChange"> & { initial: NonNullable<Own["claims"]> };

// Controlled: passing claims makes the wrapper prevent the element's own change; the app sets it
export function ControlledVerificationQueue({ initial, ...props }: Props) {
  const [claims, setClaims] = useState<Own["claims"]>(initial);
  return <VerificationQueue {...props} claims={claims} onClaimsChange={(next) => setClaims(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/verification-queue";
import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";

const props = defineProps<{ initial: TcVerificationQueue["claims"] }>();
const claims = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onClaimsChange = (e: CustomEvent<{ claims: TcVerificationQueue["claims"] }>) => {
  e.preventDefault();
  claims.value = e.detail.claims;
};
</script>

<template>
  <tc-verification-queue :claims="claims" @tc-claims-change="onClaimsChange"></tc-verification-queue>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { VerificationQueue } from "@adamstavely/trenchcoat/angular/verification-queue";
import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";

@Component({
  selector: "app-controlled-verification-queue",
  imports: [VerificationQueue],
  template: `<tc-verification-queue [claims]="claims()" (tc-claims-change)="onClaimsChange($event)"></tc-verification-queue>`,
})
export class ControlledVerificationQueue {
  readonly initial = input.required<TcVerificationQueue["claims"]>();
  readonly claims = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onClaimsChange(e: CustomEvent<{ claims: TcVerificationQueue["claims"] }>) {
    e.preventDefault();
    this.claims.set(e.detail.claims);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/verification-queue";
  import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";

  let { initial }: { initial: TcVerificationQueue["claims"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let claims = $derived(initial);
  let el: TcVerificationQueue;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      claims = (e as CustomEvent<{ claims: TcVerificationQueue["claims"] }>).detail.claims;
    };
    el.addEventListener("tc-claims-change", on);
    return () => el.removeEventListener("tc-claims-change", on);
  });
</script>

<tc-verification-queue bind:this={el} {claims}></tc-verification-queue>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-verification-queue")` returns a `TcVerificationQueue` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";`
- **React / Next.js:** Props: `import type { VerificationQueueProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof VerificationQueue>`. The element class, for refs: `import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcVerificationQueue["claims"]` with `import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";`
- **Angular:** The directive types the template: `[claims]` takes `TcVerificationQueue["claims"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcVerificationQueue } from "@adamstavely/trenchcoat/verification-queue";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `claims` | `VerificationClaim[]` | The claims in the queue with their statuses – controlled when defined; pair it with `onClaimsChange` |
| `defaultClaims` | `VerificationClaim[]` | The claims at first, when `claims` isn't controlled – the element keeps the marks |
| `onClaimsChange` | `(claims: VerificationClaim[]) => void` | Called with the whole list after every mark |
| `onReview` | `(claim: VerificationClaim, status: VerificationStatus, previous: VerificationStatus, verdict?: VerificationVerdict) => void` | Called when a claim is marked, with its new and previous status – and the verdict, when its source type has its own – for apps that save one claim at a time |
| `filter` | `VerificationFilter` | What the list shows – controlled when defined |
| `defaultFilter` | `VerificationFilter` | What the list shows at first (default "open": the claims still to review) |
| `onFilterChange` | `(filter: VerificationFilter) => void` | Called when a filter button is pressed |
| `onExport` | `(detail: VerificationExportDetail) => void` | Called by Export once the gate is open, with every claim and the count per status |

*Renamed or hidden on the wrapper: `claims`, `filter`, `heading`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous claim |
| Home / End | Moves to the first or last claim |
| PageDown / PageUp | Moves a list-height down or up |
| V | Marks the claim verified externally and moves on |
| C | Marks it can't verify and moves on |
| X | Marks it incorrect and moves on |
| D | Marks it dismissed and moves on |
| Verdict keys | With verdicts for the claim's type: a verdict's own `key`, or – for the first verdict of each status – that status's key (V, C, X or D); a key the type has no verdict for does nothing |
| U | Puts it back to review |
| ← / → (marks) | Moves between the four mark buttons; Home and End jump |
| Enter / Space (marks) | Marks the claim, or – on the pressed mark – puts it back to review |

### Screen readers

The host is a region named by the heading (“Verification queue”). The progress is a progressbar (“2 of 5
reviewed”). The list is a listbox named after the filter (“Claims – to review”); each claim is an option with
`aria-selected`, `aria-posinset` and `aria-setsize` (so the count is right while the list is windowed), read as the
claim, its origin, its status and its source type. The filters are toggle buttons (`aria-pressed`) in a group named
“Show”, and the marks a toolbar named “Mark this claim” whose buttons are pressed for the claim's status and carry
`aria-keyshortcuts`; a verdict's button is pressed only for the verdict given, and the claim is read with the
verdict's words (“Misrepresents source”). A polite status says each mark (“Verified externally: … – 3 of 5
reviewed”, or “OCR misread: … – 3 of 5 reviewed”) and why the export
is blocked (“Review 3 more claims before exporting.”). Export stays focusable while blocked (`aria-disabled`) and
is described by the gate's message.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, validity-badge, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, validity-badge, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | validity-badge | – |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | validity-badge | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | validity-badge, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.3 KB | 9.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/source-line` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [validity-badge](validity-badge.md) · Element it renders | 17.8 KB | – |
| **Added to a page that already has Lit** | **63.1 KB** | **18.3 KB** |
| With Lit – the first component on a page | 85.3 KB | 25.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 145 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of claims replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 6.1 ms | claims: first render, 687 nodes; update 1.9 ms |

Windowed: 10,000 items of claims render 687 nodes in 6.1 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (validity-badge), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (validity-badge), `MutationObserver` (validity-badge), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `Date.now()` (validity-badge), `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep claims as they were made, one fact or judgement each; edit them in the answer, not in the queue.
- Use `origin` for where in the session a claim came from (“Turn 4”, “Hub answer”), so reviewers can go back to it.
- Rename the statuses for your process with `statusLabels`, keeping their meaning: verified means checked against
  a source outside the model.
- Write `exportLabel` as what happens: “Export brief”, “Send to legal”.
- Name verdicts by what the reviewer did or found – “Matches the recording”, “OCR misread” – and keep them short;
  three or four per type. Map each to the status it really is: a misread scan is `incorrect`, not `dismissed`.

## Do and don't

### Do

- Attach the source passages (`sources`, with `validity`) so reviewers see what the claim rests on and how fresh it
  is.
- Keep the gate at every claim (`allowUnreviewed` 0) unless your process says otherwise – and say so near the
  button.
- Save each mark as it happens (`tc-review`) so a long session survives a reload – with `verdict`, when there is
  one, so you can route a misread scan differently from a misrepresented source.

### Don't

- Don't enable the export some other way while the gate is closed – the gate is the point.
- Don't count dismissed claims as verified in your export; the detail keeps them apart.
- Don't remove incorrect claims from the queue – the record of what was wrong matters.

## Related

- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Validity Badge](validity-badge.md) – How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
