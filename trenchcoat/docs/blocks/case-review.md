<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Case Review

**Blocks** · New

One case ready for a person to decide – evidence, a timeline, the assistant's labelled suggestion, and a decision that needs a written reason (uses `fact-sheet`, `entity-timeline`, `agent-face`)

- **Element:** `<tc-case-review>`
- **Size:** 21.0 KB gzip · 74.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/case-review";` |
| React / Next.js | `import { CaseReview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/case-review";` · tags starting with tc- are custom elements |
| Angular | `import { CaseReview } from "@adamstavely/trenchcoat/angular/case-review";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/case-review";` |

## Example

The live example is in the gallery at `#/blocks/case-review`, in both looks; Replay restarts its animations.

## Overview

One case, ready for a person to decide: the evidence, what happened in order, the assistant's read, and the decision. The
assistant only suggests. Its suggestion is labelled, nothing is chosen for you, and deciding needs a written reason.

### When to use

- Fraud, risk and compliance cases that a person must decide and answer for.
- Any review where an AI's view should inform a decision without making it.

### When not to use

- Many small decisions in a row – use [Review Center](../components/review-center.md).
- An agent asking for permission – use [Approval Card](../components/approval-card.md).
- Evidence with no decision to make – use [Fact Sheet](../components/fact-sheet.md) or [Entity Timeline](../components/entity-timeline.md).

## Anatomy

1. **Head** `.ui-csr__head` – `.ui-csr__name`, `.ui-csr__subject` and `.ui-csr__severity`, in words
2. **Evidence** `.ui-csr__main` – the facts and the timeline
3. **Read** `.ui-csr__read` – the assistant's summary and `.ui-csr__suggests`, with `.ui-csr__advisory` saying the decision is yours
4. **Options** `.ui-csr__options` – the outcomes, with `.ui-csr__tag` on the suggested one
5. **Reason** `.ui-csr__note` – required
6. **Record** `.ui-csr__record` – records the decision, or says what's missing

## Looks

The composed components follow Standard or Clean. On a narrow page, the read and decision come before the evidence.

## Usage

### HTML

```html
<tc-case-review id="case" heading="Case 4812" severity="high"></tc-case-review>

<script type="module">
  import "@adamstavely/trenchcoat/case-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#case");
  review.read = { summary: "Two payments of the same amount.", suggestion: "escalate" };
  review.addEventListener("tc-decision-change", (e) => console.log(e.detail.decision));
</script>
```

### React / Next.js

```tsx
import { CaseReview, type CaseRead } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const read: CaseRead = { summary: "Two payments of the same amount.", suggestion: "escalate" };

export function Case() {
  return <CaseReview title="Case 4812" severity="high" read={read} onDecisionChange={(d) => console.log(d)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/case-review";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";

defineProps<{ read: TcCaseReview["read"]; facts: TcCaseReview["facts"] }>();
const onDecisionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-case-review :read="read" :facts="facts" @tc-decision-change="onDecisionChange"></tc-case-review>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CaseReview } from "@adamstavely/trenchcoat/angular/case-review";
import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";

@Component({
  selector: "app-case-review-example",
  imports: [CaseReview],
  template: `<tc-case-review [read]="read()" [facts]="facts()" (tc-decision-change)="onDecisionChange($event)"></tc-case-review>`,
})
export class CaseReviewExample {
  readonly read = input.required<TcCaseReview["read"]>();
  readonly facts = input.required<TcCaseReview["facts"]>();
  onDecisionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/case-review";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";

  let { read, facts }: { read: TcCaseReview["read"]; facts: TcCaseReview["facts"] } = $props();
  let el: TcCaseReview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decision-change", on);
    return () => el.removeEventListener("tc-decision-change", on);
  });
</script>

<tc-case-review bind:this={el} {read} {facts}></tc-case-review>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Case"` | The case's title |
| `subject` | `subject` | `string \| undefined` | `undefined` | Who or what it's about |
| `severity` | `severity` | `CaseSeverity \| undefined` | `undefined` | How serious it is, always shown in words |
| `read` | – | `CaseRead \| undefined` | `undefined` | The assistant's read of the case |
| `assistantName` | `assistant-name` | `string` | `"Assistant"` | The assistant's name |
| `assistantFace` | `assistant-face` | `boolean` | `false` | Show the assistant's animated face |
| `facts` | – | `FactSection[]` | `[]` | The evidence |
| `events` | – | `TimelineEvent[]` | `[]` | What happened |
| `categories` | – | `TimelineCategory[]` | `[]` | The timeline's categories |
| `options` | – | `CaseOption[]` | `[ { id: "approve", label: "Approve", description: "Nothing further is needed" }, { id: "decline", label: "Decline", description: "Stop this and record why" }, { id: "escalate", label: "Escalate", description: "Send it to a senior reviewer" }, ]` | The outcomes to choose from |
| `decision` | – | `CaseDecision \| null` | `null` | The decision on record. Changed by the user unless a tc-decision-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<CaseReviewLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decision-change` | – | Yes | A decision was recorded ({ decision, option, followedSuggestion }: CaseDecisionChange); cancelable – prevented, `decision` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-icon-size-md` | `16px` | not set – this fallback applies |

#### Design tokens it reads (48)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCaseOptions: CaseOption[]` | The outcomes when `options` isn't set |

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
| `read` | `el.read = …;` | `<… read={…} />` | `<tc-case-review :read="…">` | `<tc-case-review [read]="…">` | `<tc-case-review {read}>` |
| `facts` | `el.facts = …;` | `<… facts={…} />` | `<tc-case-review :facts="…">` | `<tc-case-review [facts]="…">` | `<tc-case-review {facts}>` |
| `events` | `el.events = …;` | `<… events={…} />` | `<tc-case-review :events="…">` | `<tc-case-review [events]="…">` | `<tc-case-review {events}>` |
| `categories` | `el.categories = …;` | `<… categories={…} />` | `<tc-case-review :categories="…">` | `<tc-case-review [categories]="…">` | `<tc-case-review {categories}>` |
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-case-review :options="…">` | `<tc-case-review [options]="…">` | `<tc-case-review {options}>` |
| `decision` | `el.decision = …;` | `<… decision={…} />` | `<tc-case-review :decision="…">` | `<tc-case-review [decision]="…">` | `<tc-case-review {decision}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-case-review :labels="…">` | `<tc-case-review [labels]="…">` | `<tc-case-review {labels}>` |

*Also attributes: `heading`, `subject`, `severity`, `assistant-name`, `assistant-face`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decision-change` | Yes | `el.addEventListener("tc-decision-change", (e) => …)` | `onDecisionChange={…}` | `@tc-decision-change="…"` | `(tc-decision-change)="…($event)"` | `el.addEventListener("tc-decision-change", …)` |

### Controlled

The element changes `decision` itself unless a listener calls `preventDefault()` on `tc-decision-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-case-review id="case-review"></tc-case-review>

<script type="module">
  import "@adamstavely/trenchcoat/case-review";

  const el = document.querySelector("#case-review");
  el.addEventListener("tc-decision-change", (e) => {
    e.preventDefault(); // the element keeps its decision…
    if (allowed(e.detail.decision)) el.decision = e.detail.decision; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CaseReview } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CaseReview>;
type Props = Omit<Own, "decision" | "onDecisionChange"> & { initial: NonNullable<Own["decision"]> };

// Controlled: passing decision makes the wrapper prevent the element's own change; the app sets it
export function ControlledCaseReview({ initial, ...props }: Props) {
  const [decision, setDecision] = useState<Own["decision"]>(initial);
  return <CaseReview {...props} decision={decision} onDecisionChange={(next) => setDecision(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/case-review";
import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";

const props = defineProps<{ initial: TcCaseReview["decision"] }>();
const decision = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDecisionChange = (e: CustomEvent<{ decision: TcCaseReview["decision"] }>) => {
  e.preventDefault();
  decision.value = e.detail.decision;
};
</script>

<template>
  <tc-case-review :decision="decision" @tc-decision-change="onDecisionChange"></tc-case-review>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CaseReview } from "@adamstavely/trenchcoat/angular/case-review";
import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";

@Component({
  selector: "app-controlled-case-review",
  imports: [CaseReview],
  template: `<tc-case-review [decision]="decision()" (tc-decision-change)="onDecisionChange($event)"></tc-case-review>`,
})
export class ControlledCaseReview {
  readonly initial = input.required<TcCaseReview["decision"]>();
  readonly decision = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDecisionChange(e: CustomEvent<{ decision: TcCaseReview["decision"] }>) {
    e.preventDefault();
    this.decision.set(e.detail.decision);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/case-review";
  import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";

  let { initial }: { initial: TcCaseReview["decision"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let decision = $derived(initial);
  let el: TcCaseReview;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      decision = (e as CustomEvent<{ decision: TcCaseReview["decision"] }>).detail.decision;
    };
    el.addEventListener("tc-decision-change", on);
    return () => el.removeEventListener("tc-decision-change", on);
  });
</script>

<tc-case-review bind:this={el} {decision}></tc-case-review>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-case-review")` returns a `TcCaseReview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";`
- **React / Next.js:** Props: `import type { CaseReviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CaseReview>`. The element class, for refs: `import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCaseReview["read"]` with `import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";`
- **Angular:** The directive types the template: `[read]` takes `TcCaseReview["read"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCaseReview } from "@adamstavely/trenchcoat/case-review";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The case's title |
| `decision` | `CaseDecision \| null` | The decision on record – controlled when given |
| `defaultDecision` | `CaseDecision \| null` | The decision on mount when `decision` isn't controlled |
| `onDecisionChange` | `(decision: CaseDecision \| null, detail: CaseDecisionChange) => void` | A decision was recorded |

*Renamed or hidden on the wrapper: `heading`, `decision`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the evidence, the outcomes, the reason, then Record decision |
| ↑ ↓ | Move through the outcomes |

If something's missing, focus goes to it. After recording, focus goes to Change.

### Screen readers

The outcomes are a `radiogroup` named by the panel's heading, the reason is `aria-required`, and a missing one is tied to
its message. Severity and the suggestion are words. `role="status"` announces the recorded decision.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, entity-timeline, fact-sheet | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, entity-timeline, fact-sheet | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | src/vendor/agent-face/element/agent-face | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | src/vendor/agent-face/draw/draw-face | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, entity-timeline, fact-sheet, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | src/vendor/agent-face/element/agent-face | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, entity-timeline, fact-sheet, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 15.5 KB | 5.2 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [entity-timeline](../components/entity-timeline.md) · Element it renders | 17.7 KB | – |
| [fact-sheet](../components/fact-sheet.md) · Element it renders | 16.1 KB | – |
| [agent-face](../components/agent-face.md) · Element it renders | 1.7 KB | – |
| `src/vendor/agent-face/element/agent-face.ts` · Dependency | 4.9 KB | – |
| `src/vendor/agent-face/engine/engine.ts` · Dependency | 4.6 KB | – |
| `src/vendor/agent-face/draw/draw-face.ts` · Dependency | 2.6 KB | – |
| `src/vendor/agent-face/engine/states.ts` · Dependency | 1.0 KB | – |
| `src/vendor/agent-face/draw/spear-tip.mjs` · Dependency | 0.6 KB | – |
| `src/vendor/agent-face/engine/spring.ts` · Dependency | 0.4 KB | – |
| `src/vendor/agent-face/element/loop.ts` · Dependency | 0.3 KB | – |
| `src/vendor/agent-face/engine/random.ts` · Dependency | 0.2 KB | – |
| `src/vendor/agent-face/element/index.ts` · Dependency | 0.1 KB | – |
| `src/vendor/agent-face/element/no-dom.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **74.6 KB** | **21.0 KB** |
| With Lit – the first component on a page | 96.5 KB | 28.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | default properties, 28 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (src/vendor/agent-face/element/loop – addToLoop), `requestAnimationFrame` (src/vendor/agent-face/element/loop – frame).
- Timers: `setTimeout` (fact-sheet).
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver` (src/vendor/agent-face/element/agent-face – AgentFace), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document visibilitychange` (src/vendor/agent-face/element/agent-face – AgentFace), `window resize` (src/vendor/agent-face/element/agent-face – AgentFace).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write `summary` as what the assistant found, not what to do, and give `confidence` in words. Keep `points` to what a
reviewer can check in the evidence.

## Do and don't

### Do

- Store `followedSuggestion` from `tc-decision-change`, so you can see how often people agree with the assistant.
- Show the evidence behind each point, so the suggestion can be checked.
- Record decisions on the server, with who made them.

### Don't

- Don't preselect the suggested outcome, or act on it without a person.

## Related

- [File Details](file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
- [Fact Sheet](../components/fact-sheet.md) – What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly
- [Entity Timeline](../components/entity-timeline.md) – What happened to a person, account or case, in order – events under month headers, each with a category, its source and Admiralty grade tinted by confidence, an optional flag and a detail that opens in place, filtered by category chips with counts
- [Agent Face](../components/agent-face.md) – Donovan's animated face, which shows what the agent is doing – nine states that blend on springs, blinks and glances, a nod or a hop, sharp from 16 to 256 px and resting when it isn't busy

## Changelog

- **Case Review** (`tc-case-review`) – a block for one case: evidence, a timeline, the assistant's labelled suggestion, and a decision that needs a written reason. Nothing is chosen for you.
