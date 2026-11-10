<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Redaction Review

**Trust & calibration** · New

Checking what's been redacted before a document's shared – solid bars with reasons, reveal one at a time, approve or reject, and Share once none are left

- **Element:** `<tc-redaction-review>`
- **Size:** 7.1 KB gzip · 21.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/redaction-review";` |
| React / Next.js | `import { RedactionReview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/redaction-review";` · tags starting with tc- are custom elements |
| Angular | `import { RedactionReview } from "@adamstavely/trenchcoat/angular/redaction-review";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/redaction-review";` |

## Example

The live example is in the gallery at `#/redaction-review`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Checking what's been redacted before a document's shared. Each span shows as a solid bar with its reason. A reviewer can reveal one at a time, approve or reject it, and share once nothing's left to review.

### When to use

- A person checking suggested redactions before a document leaves the team.

### When not to use

- Labelling a conversation – use [Conversation annotation](conversation-annotation.md).
- Hiding content from people who didn't choose to see it – use [Content Hidden](../illustrations/content-hidden.md).
- As the redaction itself. See Don't.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Document** `.ui-rdq__doc` – the text, with `.ui-rdq__page` where the page changes
2. **Span** `.ui-rdq__span` – a `.ui-rdq__bar` and its `.ui-rdq__reason`, or `.ui-rdq__text` while revealed
3. **Detail** `.ui-rdq__detail` – `.ui-rdq__reveal`, `.ui-rdq__approve` and `.ui-rdq__reject` for the picked span
4. **Left** `.ui-rdq__left` – how many are left to review
5. **Share** `.ui-rdq__share` – waits until none are, beside `.ui-rdq__approve-all`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A bar to review has stripes, so it isn't told apart by colour alone.

## Usage

### HTML

```html
<tc-redaction-review id="review"></tc-redaction-review>

<script type="module">
  import "@adamstavely/trenchcoat/redaction-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.blocks = [{ id: "p1", text: "Reach them on 555-0142." }];
  review.redactions = [{ id: "r1", block: "p1", start: 14, end: 22, reason: "Phone number", status: "proposed" }];
  review.addEventListener("tc-share", (e) => console.log(e.detail.redactions));
</script>
```

### React / Next.js

```tsx
import { RedactionReview, type Redaction, type RedactionBlock } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const blocks: RedactionBlock[] = [{ id: "p1", text: "Reach them on 555-0142." }];
const redactions: Redaction[] = [{ id: "r1", block: "p1", start: 14, end: 22, reason: "Phone number", status: "proposed" }];

export function Review() {
  return <RedactionReview blocks={blocks} defaultRedactions={redactions} onTcShare={(e) => console.log(e.detail.redactions)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/redaction-review";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";

defineProps<{ blocks: TcRedactionReview["blocks"]; redactions: TcRedactionReview["redactions"] }>();
const onRedactionsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-redaction-review :blocks="blocks" :redactions="redactions" @tc-redactions-change="onRedactionsChange"></tc-redaction-review>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RedactionReview } from "@adamstavely/trenchcoat/angular/redaction-review";
import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";

@Component({
  selector: "app-redaction-review-example",
  imports: [RedactionReview],
  template: `<tc-redaction-review [blocks]="blocks()" [redactions]="redactions()" (tc-redactions-change)="onRedactionsChange($event)"></tc-redaction-review>`,
})
export class RedactionReviewExample {
  readonly blocks = input.required<TcRedactionReview["blocks"]>();
  readonly redactions = input.required<TcRedactionReview["redactions"]>();
  onRedactionsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/redaction-review";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";

  let { blocks, redactions }: { blocks: TcRedactionReview["blocks"]; redactions: TcRedactionReview["redactions"] } = $props();
  let el: TcRedactionReview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-redactions-change", on);
    return () => el.removeEventListener("tc-redactions-change", on);
  });
</script>

<tc-redaction-review bind:this={el} {blocks} {redactions}></tc-redaction-review>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Redaction review" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `blocks` | – | `RedactionBlock[]` | `[]` | The document's text, in order |
| `redactions` | – | `Redaction[]` | `[]` | What's redacted. Changed by the user unless a tc-redactions-change listener calls preventDefault() |
| `labels` | – | `Partial<RedactionReviewLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-redactions-change` | – | Yes | A redaction was approved or rejected, or all were approved ({ redactions, redaction }: RedactionsChange); cancelable – prevented, `redactions` stays as it was |
| `tc-share` | – | Yes | Share was pressed ({ redactions }: RedactionShare); cancelable |

#### Design tokens it reads (41)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-2xs`, `--tc-rdq-length`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `blocks` | `el.blocks = …;` | `<… blocks={…} />` | `<tc-redaction-review :blocks="…">` | `<tc-redaction-review [blocks]="…">` | `<tc-redaction-review {blocks}>` |
| `redactions` | `el.redactions = …;` | `<… redactions={…} />` | `<tc-redaction-review :redactions="…">` | `<tc-redaction-review [redactions]="…">` | `<tc-redaction-review {redactions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-redaction-review :labels="…">` | `<tc-redaction-review [labels]="…">` | `<tc-redaction-review {labels}>` |

*Also attributes: `heading`, `description` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-redactions-change` | Yes | `el.addEventListener("tc-redactions-change", (e) => …)` | `onRedactionsChange={…}` | `@tc-redactions-change="…"` | `(tc-redactions-change)="…($event)"` | `el.addEventListener("tc-redactions-change", …)` |
| `tc-share` | Yes | `el.addEventListener("tc-share", (e) => …)` | `onTcShare={…}` | `@tc-share="…"` | `(tc-share)="…($event)"` | `el.addEventListener("tc-share", …)` |

### Controlled

The element changes `redactions` itself unless a listener calls `preventDefault()` on `tc-redactions-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-redaction-review id="redaction-review"></tc-redaction-review>

<script type="module">
  import "@adamstavely/trenchcoat/redaction-review";

  const el = document.querySelector("#redaction-review");
  el.addEventListener("tc-redactions-change", (e) => {
    e.preventDefault(); // the element keeps its redactions…
    if (allowed(e.detail.redactions)) el.redactions = e.detail.redactions; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RedactionReview } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RedactionReview>;
type Props = Omit<Own, "redactions" | "onRedactionsChange"> & { initial: NonNullable<Own["redactions"]> };

// Controlled: passing redactions makes the wrapper prevent the element's own change; the app sets it
export function ControlledRedactionReview({ initial, ...props }: Props) {
  const [redactions, setRedactions] = useState<Own["redactions"]>(initial);
  return <RedactionReview {...props} redactions={redactions} onRedactionsChange={(next) => setRedactions(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/redaction-review";
import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";

const props = defineProps<{ initial: TcRedactionReview["redactions"] }>();
const redactions = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRedactionsChange = (e: CustomEvent<{ redactions: TcRedactionReview["redactions"] }>) => {
  e.preventDefault();
  redactions.value = e.detail.redactions;
};
</script>

<template>
  <tc-redaction-review :redactions="redactions" @tc-redactions-change="onRedactionsChange"></tc-redaction-review>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RedactionReview } from "@adamstavely/trenchcoat/angular/redaction-review";
import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";

@Component({
  selector: "app-controlled-redaction-review",
  imports: [RedactionReview],
  template: `<tc-redaction-review [redactions]="redactions()" (tc-redactions-change)="onRedactionsChange($event)"></tc-redaction-review>`,
})
export class ControlledRedactionReview {
  readonly initial = input.required<TcRedactionReview["redactions"]>();
  readonly redactions = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRedactionsChange(e: CustomEvent<{ redactions: TcRedactionReview["redactions"] }>) {
    e.preventDefault();
    this.redactions.set(e.detail.redactions);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/redaction-review";
  import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";

  let { initial }: { initial: TcRedactionReview["redactions"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let redactions = $derived(initial);
  let el: TcRedactionReview;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      redactions = (e as CustomEvent<{ redactions: TcRedactionReview["redactions"] }>).detail.redactions;
    };
    el.addEventListener("tc-redactions-change", on);
    return () => el.removeEventListener("tc-redactions-change", on);
  });
</script>

<tc-redaction-review bind:this={el} {redactions}></tc-redaction-review>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-redaction-review")` returns a `TcRedactionReview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";`
- **React / Next.js:** Props: `import type { RedactionReviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RedactionReview>`. The element class, for refs: `import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRedactionReview["blocks"]` with `import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";`
- **Angular:** The directive types the template: `[blocks]` takes `TcRedactionReview["blocks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRedactionReview } from "@adamstavely/trenchcoat/redaction-review";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Redaction review" |
| `redactions` | `Redaction[]` | What's redacted – controlled when given |
| `defaultRedactions` | `Redaction[]` | What's redacted on mount when `redactions` isn't controlled |
| `onRedactionsChange` | `(redactions: Redaction[], detail: RedactionsChange) => void` | A redaction was approved or rejected, or all were approved |

*Renamed or hidden on the wrapper: `heading`, `redactions`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ← → ↑ ↓ | Move between spans |
| Home / End | Go to the first or last span |
| Tab | Moves on to the picked span's buttons, then Share |

The spans are one tab stop. After a decision, focus goes to the next span left to review.

### Screen readers

Each span is a button named "Redacted", its reason and its status, and the picked one uses `aria-pressed`. Hidden text isn't in the page's markup, so it isn't read out. `role="status"` announces each decision.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-01 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.1 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **21.4 KB** | **7.1 KB** |
| With Lit – the first component on a page | 42.1 KB | 13.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 52 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of redactions replaced |
| First on the page | 8.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.9 ms | redactions: first render, 532 nodes; update 0.4 ms |
| 1,000 items | 20 ms | redactions: first render, 5,032 nodes; update 3.1 ms |

1,000 items of redactions: 20 ms, 5,032 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `reason` as what the text is: "Phone number". Only one span can be revealed at a time, and moving on hides it again. A redaction pointing at a block that isn't there blocks Share and says so.

## Do and don't

### Do

- Produce the redacted copy on the server, from the approved list, on `tc-share`.
- Limit who can use this, because a reviewer can read what's hidden.
- Keep a record of who approved what.

### Don't

- **Don't share the original with bars drawn on it.** Bars don't remove text: anything sent to a browser can be read, so the server must produce the redacted copy.
- Don't send `blocks` to anyone who isn't allowed to see the unredacted text.

## Related

- [Conversation annotation](conversation-annotation.md) – Label and redact spans in a conversation, rate turns, correct answers as a diff, and send the reviewed example to a dataset
- [Share Panel](share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Approval Chain](approval-chain.md) – Several people signing off in order – who's next and who's overdue in words, with Approve, Decline with a note, and Delegate for the person it's waiting on
- [Content Hidden](../illustrations/content-hidden.md) – A photo pixelated to a person's outline with a warning sign on it, with the words Sensitive content, to sit on an overlay covering obscene, sexual or graphic content
