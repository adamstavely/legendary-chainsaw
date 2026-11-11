<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Claim Answer

**Trust & calibration** · New

An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it

- **Element:** `<tc-claim-answer>`
- **Size:** 17.6 KB gzip · 63.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/claim-answer";` |
| React / Next.js | `import { ClaimAnswer } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/claim-answer";` · tags starting with tc- are custom elements |
| Angular | `import { ClaimAnswer } from "@adamstavely/trenchcoat/angular/claim-answer";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/claim-answer";` |

## Example

The live example is in the gallery at `#/claim-answer`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An AI answer you can check claim by claim. Each claim says where it came from – a source the model retrieved, the
model's own knowledge, or an inference from other claims – how sure the model is, and, where it applies, why it
can't be sure: the world hasn't settled it, the evidence is thin, or it's beyond what the model can know. Under the
answer waits the strongest case against it. People can see at a glance which parts rest on evidence and which on
the model's say-so, and send the claims that matter to a verification queue before they rely on them.

Beyond the three text types, a claim can come from a medium – a machine transcript, a video, a recording, an image or
text read off a scan (OCR), shown with how well it was read (“OCR 72%”) – or from memory: an earlier session, the
team's shared knowledge or another agent's finding. The app sets a confidence ceiling for any type, so a transcript
claim never looks surer than transcripts deserve, and can tag the question the answer replies to – factual,
analytical, predictive or opinion – so people know how much uncertainty to expect before they read.

### When to use

- Answers people will act on or pass on – a recommendation, a briefing, a finding – where some claims are sourced
  and some aren't.
- Products that ask people to verify what the model says before it leaves the room (pair it with
  `verification-queue`).
- Answers to questions with a real other side, where the counter-position should travel with the answer.

### When not to use

- Every sentence comes from a retrieved source and you only need to show which – use [Cited Answer](cited-answer.md).
- Chat replies that are conversation, not claims – use [AI Answer](ai-answer.md).
- Reviewing claims collected across a session – use [Verification Queue](verification-queue.md).
- Showing only how fresh a source is – use [Validity Badge](validity-badge.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Question type** `.ui-cla__qtype` – the kind of question the answer replies to, when the app sets it
2. **Key** `.ui-cla__keys` – the source types with their counts; pressing one picks out its claims
3. **Claim** `.ui-cla__claim` – one claim, underlined in its source type's colour and line style
4. **Uncertainty mark** `.ui-cla__unc` – a small “?” after a claim the model can't be sure of
5. **Claim detail** `.ui-cla__detail` – the source type (and how well a medium was read), the confidence – capped where a ceiling applies – the uncertainty, the passages behind it and Send to verification
6. **Counter-position** `.ui-cla__counter` – the strongest case against the answer, folded
7. **Caption** `.ui-cla__caption` – how many claims rest on a source or a medium, or what the pointer is on

## Looks

Standard sets the answer on a white card in a gray tray, with the caption on the tray and the open claim on a light
gray well. Clean is one white card: the caption is its last row under a hairline, the open claim is a raised card of
its own and the key's buttons are smaller. Both use the same underlines – solid for sourced, dashed for model
knowledge, dotted for inferred, double for the media types and wavy for the memory types – so the families read
without colour, and the label names each type.

## Usage

### HTML

```html
<tc-claim-answer id="answer"></tc-claim-answer>

<script type="module">
  import "@adamstavely/trenchcoat/claim-answer";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.sources = [
    { id: "quote", site: "Freight quote", title: "Carrier quote", quote: "Per-order cost: $6.42 against $6.17.", validity: { observed: "2026-05-17", contested: true } },
  ];
  answer.claims = [
    { id: "c1", text: "The northern hub costs about 4% more per order.", source: "grounded", confidence: 0.86, sources: ["quote"] },
    { id: "c2", text: " Fuel prices will decide much of the gap.", source: "model", confidence: 0.35, uncertainty: "unsettled" },
    { id: "c3", text: " The lease starts in February.", source: "ocr", confidence: 0.9, recognition: 0.72 },
  ];
  answer.confidenceCeilings = { transcript: 0.8, ocr: 0.85, session: 0.7 };
  answer.questionType = "analytical";
  answer.counter = "The quote is five months old and disputed.";
  answer.addEventListener("tc-verify", (e) => console.log(e.detail.claim, e.detail.sources));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ClaimAnswer, type AnswerClaim, type ClaimSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: ClaimSource[] = [{ id: "quote", site: "Freight quote", title: "Carrier quote", validity: { observed: "2026-05-17" } }];
const claims: AnswerClaim[] = [
  { id: "c1", text: "The northern hub costs about 4% more per order.", source: "grounded", confidence: 0.86, sources: ["quote"] },
  { id: "c2", text: " Fuel prices will decide much of the gap.", source: "model", confidence: 0.35, uncertainty: "unsettled" },
  { id: "c3", text: " Last time, fit-out ran six weeks late.", source: "session", confidence: 0.8 },
];

export function Answer() {
  const [queued, setQueued] = useState<string[]>([]);
  return (
    <ClaimAnswer
      claims={claims}
      sources={sources}
      counter="The quote is five months old and disputed."
      questionType="predictive"
      confidenceCeilings={{ transcript: 0.8, session: 0.7 }}
      queued={queued}
      onQueuedChange={setQueued}
      onVerify={(claim) => console.log("verify", claim.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/claim-answer";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";

defineProps<{ claims: TcClaimAnswer["claims"]; sources: TcClaimAnswer["sources"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-claim-answer :claims="claims" :sources="sources" @tc-open-change="onOpenChange"></tc-claim-answer>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ClaimAnswer } from "@adamstavely/trenchcoat/angular/claim-answer";
import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";

@Component({
  selector: "app-claim-answer-example",
  imports: [ClaimAnswer],
  template: `<tc-claim-answer [claims]="claims()" [sources]="sources()" (tc-open-change)="onOpenChange($event)"></tc-claim-answer>`,
})
export class ClaimAnswerExample {
  readonly claims = input.required<TcClaimAnswer["claims"]>();
  readonly sources = input.required<TcClaimAnswer["sources"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/claim-answer";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";

  let { claims, sources }: { claims: TcClaimAnswer["claims"]; sources: TcClaimAnswer["sources"] } = $props();
  let el: TcClaimAnswer;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-claim-answer bind:this={el} {claims} {sources}></tc-claim-answer>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `claims` | – | `AnswerClaim[]` | `[]` | The answer as claims, in order – each with its source type, confidence and sources; items without `source` are plain text |
| `sources` | – | `ClaimSource[]` | `[]` | The passages the claims rest on, looked up by id |
| `counter` | `counter` | `string` | `""` | The strongest case against the answer – shown folded under it; empty hides it |
| `open` | – | `string \| null` | `null` | Id of the claim whose detail is open (null: none) |
| `queued` | – | `string[]` | `[]` | Ids of the claims already sent to verification – their button says so |
| `now` | `now` | `number \| undefined` | `undefined` | The moment source freshness is counted to (epoch ms), passed to every validity badge; unset, each badge uses when it connected |
| `confidenceBands` | – | `{ high: number; medium: number }` | `{ high: 0.8, medium: 0.5 }` | Confidence at or above `high` reads High, at or above `medium` Medium, else Low |
| `sourceLabels` | – | `Partial<Record<ClaimSourceType, string>>` | `{}` | The names of the source types – your own vocabulary in place of Sourced, Model knowledge and Inferred |
| `sourceNotes` | – | `Partial<Record<ClaimSourceType, string>>` | `{}` | What each source type means, in the open claim |
| `uncertaintyLabels` | – | `Partial<Record<ClaimUncertainty, string>>` | `{}` | The names of the uncertainty kinds – in place of Not settled, Thin evidence and Beyond the model |
| `uncertaintyNotes` | – | `Partial<Record<ClaimUncertainty, string>>` | `{}` | What each uncertainty kind means, in the open claim (a claim's own `note` follows it) |
| `confidenceLabels` | – | `Partial<Record<Confidence, string>>` | `{}` | The words for the confidence levels – in place of High, Medium and Low |
| `confidenceCeilings` | – | `Partial<Record<ClaimSourceType, number>>` | `{}` | The highest confidence shown for each source type, 0–1 – a transcript claim might go no higher than 0.7, whatever the model says. Unset types aren't capped |
| `questionType` | `question-type` | `ClaimQuestionType \| undefined` | `undefined` | The kind of question the answer replies to, shown as a tag in the head; unset shows none |
| `questionTypeLabels` | – | `Partial<Record<ClaimQuestionType, string>>` | `{}` | The names of the question types – in place of Factual, Analytical, Predictive and Opinion |
| `questionTypeNotes` | – | `Partial<Record<ClaimQuestionType, string>>` | `{}` | What each question type means for the answer, in the tag's tooltip and for screen readers |
| `counterLabel` | `counter-label` | `string` | `"Strongest case against"` | The counter-position's toggle |
| `verifyLabel` | `verify-label` | `string` | `"Send to verification"` | The button that sends a claim to verification |
| `queuedLabel` | `queued-label` | `string` | `"In verification queue"` | What that button says once the claim is queued |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The open claim changes; detail `{ open: string \| null }` (ClaimOpenChange). Cancelable. |
| `tc-queued-change` | – | Yes | "Send to verification" was pressed; detail `{ queued, claim }` (ClaimQueuedChange) – the ids in the queue after it. Cancelable. |
| `tc-verify` | – | No | A claim was sent to verification (after tc-queued-change, whether or not that was prevented); detail `{ claim, sources }` (ClaimVerifyDetail) |

#### Design tokens it reads (90)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-claim-answer-bg`, `--tc-claim-answer-fg`, `--tc-claim-answer-line`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-source-grounded-bg`, `--tc-source-grounded-fg`, `--tc-source-inferred-bg`, `--tc-source-inferred-fg`, `--tc-source-media-bg`, `--tc-source-media-fg`, `--tc-source-memory-bg`, `--tc-source-memory-fg`, `--tc-source-model-bg`, `--tc-source-model-fg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `claims` | `el.claims = …;` | `<… claims={…} />` | `<tc-claim-answer :claims="…">` | `<tc-claim-answer [claims]="…">` | `<tc-claim-answer {claims}>` |
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-claim-answer :sources="…">` | `<tc-claim-answer [sources]="…">` | `<tc-claim-answer {sources}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-claim-answer :open="…">` | `<tc-claim-answer [open]="…">` | `<tc-claim-answer {open}>` |
| `queued` | `el.queued = …;` | `<… queued={…} />` | `<tc-claim-answer :queued="…">` | `<tc-claim-answer [queued]="…">` | `<tc-claim-answer {queued}>` |
| `confidenceBands` | `el.confidenceBands = …;` | `<… confidenceBands={…} />` | `<tc-claim-answer :confidenceBands="…">` | `<tc-claim-answer [confidenceBands]="…">` | `<tc-claim-answer {confidenceBands}>` |
| `sourceLabels` | `el.sourceLabels = …;` | `<… sourceLabels={…} />` | `<tc-claim-answer :sourceLabels="…">` | `<tc-claim-answer [sourceLabels]="…">` | `<tc-claim-answer {sourceLabels}>` |
| `sourceNotes` | `el.sourceNotes = …;` | `<… sourceNotes={…} />` | `<tc-claim-answer :sourceNotes="…">` | `<tc-claim-answer [sourceNotes]="…">` | `<tc-claim-answer {sourceNotes}>` |
| `uncertaintyLabels` | `el.uncertaintyLabels = …;` | `<… uncertaintyLabels={…} />` | `<tc-claim-answer :uncertaintyLabels="…">` | `<tc-claim-answer [uncertaintyLabels]="…">` | `<tc-claim-answer {uncertaintyLabels}>` |
| `uncertaintyNotes` | `el.uncertaintyNotes = …;` | `<… uncertaintyNotes={…} />` | `<tc-claim-answer :uncertaintyNotes="…">` | `<tc-claim-answer [uncertaintyNotes]="…">` | `<tc-claim-answer {uncertaintyNotes}>` |
| `confidenceLabels` | `el.confidenceLabels = …;` | `<… confidenceLabels={…} />` | `<tc-claim-answer :confidenceLabels="…">` | `<tc-claim-answer [confidenceLabels]="…">` | `<tc-claim-answer {confidenceLabels}>` |
| `confidenceCeilings` | `el.confidenceCeilings = …;` | `<… confidenceCeilings={…} />` | `<tc-claim-answer :confidenceCeilings="…">` | `<tc-claim-answer [confidenceCeilings]="…">` | `<tc-claim-answer {confidenceCeilings}>` |
| `questionTypeLabels` | `el.questionTypeLabels = …;` | `<… questionTypeLabels={…} />` | `<tc-claim-answer :questionTypeLabels="…">` | `<tc-claim-answer [questionTypeLabels]="…">` | `<tc-claim-answer {questionTypeLabels}>` |
| `questionTypeNotes` | `el.questionTypeNotes = …;` | `<… questionTypeNotes={…} />` | `<tc-claim-answer :questionTypeNotes="…">` | `<tc-claim-answer [questionTypeNotes]="…">` | `<tc-claim-answer {questionTypeNotes}>` |

*Also attributes: `counter`, `now`, `question-type`, `counter-label`, `verify-label`, `queued-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-queued-change` | Yes | `el.addEventListener("tc-queued-change", (e) => …)` | `onQueuedChange={…}` | `@tc-queued-change="…"` | `(tc-queued-change)="…($event)"` | `el.addEventListener("tc-queued-change", …)` |
| `tc-verify` | No | `el.addEventListener("tc-verify", (e) => …)` | `onVerify={…}` | `@tc-verify="…"` | `(tc-verify)="…($event)"` | `el.addEventListener("tc-verify", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` and `queued` itself unless a listener calls `preventDefault()` on `tc-open-change` or `tc-queued-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-claim-answer id="claim-answer"></tc-claim-answer>

<script type="module">
  import "@adamstavely/trenchcoat/claim-answer";

  const el = document.querySelector("#claim-answer");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/claim-answer";
import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";

const props = defineProps<{ initial: TcClaimAnswer["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcClaimAnswer["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-claim-answer :open="open" @tc-open-change="onOpenChange"></tc-claim-answer>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ClaimAnswer } from "@adamstavely/trenchcoat/angular/claim-answer";
import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";

@Component({
  selector: "app-controlled-claim-answer",
  imports: [ClaimAnswer],
  template: `<tc-claim-answer [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-claim-answer>`,
})
export class ControlledClaimAnswer {
  readonly initial = input.required<TcClaimAnswer["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcClaimAnswer["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/claim-answer";
  import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";

  let { initial }: { initial: TcClaimAnswer["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcClaimAnswer;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcClaimAnswer["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-claim-answer bind:this={el} {open}></tc-claim-answer>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-claim-answer")` returns a `TcClaimAnswer` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";`
- **React / Next.js:** Props: `import type { ClaimAnswerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ClaimAnswer>`. The element class, for refs: `import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcClaimAnswer["claims"]` with `import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";`
- **Angular:** The directive types the template: `[claims]` takes `TcClaimAnswer["claims"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcClaimAnswer } from "@adamstavely/trenchcoat/claim-answer";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `string \| null` | Id of the claim whose detail is open – controlled when defined (null: none) |
| `defaultOpen` | `string \| null` | Id of the claim open at first (uncontrolled) |
| `onOpenChange` | `(open: string \| null) => void` | Called when the open claim changes (null: closed) |
| `queued` | `string[]` | Ids of the claims already sent to verification – controlled when defined |
| `defaultQueued` | `string[]` | Ids already sent when `queued` isn't controlled |
| `onQueuedChange` | `(queued: string[]) => void` | Called with the queued ids after a claim is sent |
| `onVerify` | `(claim: AnswerClaim, sources: ClaimSource[]) => void` | Called when a claim is sent to verification, with the sources it rests on – add it to your verification queue |

*Renamed or hidden on the wrapper: `open`, `queued`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the key's buttons, then to the claims – one stop, on the last claim used – then the open claim and the counter-position |
| → / ↓ | Moves to the next claim |
| ← / ↑ | Moves to the previous claim |
| Home / End | Moves to the first or last claim |
| Enter / Space | Opens the claim's detail, or closes it |
| Escape | Closes the open claim and returns focus to it |

### Screen readers

The host is a group named “Answer, claim by claim” unless the page names it. Each claim is a button that reads its
words, then its type, confidence and uncertainty (“Faster delivery usually lifts repeat purchases, Model knowledge,
62% confidence, Thin evidence”), with `aria-expanded` and `aria-controls` pointing at the detail, a region named
“Claim: …”. A media claim adds how well it was read (“OCR 72%”), and a capped confidence says so (“72% confidence
(capped)”). The confidence is a meter (“62%, medium”, or “80%, high, capped”), and the detail explains a cap: “Capped
at 80% – the model said 88%, but transcript claims are shown no higher.” The question tag reads “Question type:
Predictive”, then what that means. The key's buttons are toggle buttons (`aria-pressed`) in a
group named “Source types”. A polite status says “Sent to verification: …” and “Showing model knowledge claims”.
Each source's freshness badge says, for example, “Aging source, observed 5 months ago, contested”.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, validity-badge, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, validity-badge, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | validity-badge | – |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | validity-badge | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | validity-badge, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.3 KB | 10.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/source-line` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [validity-badge](validity-badge.md) · Element it renders | 17.8 KB | – |
| **Added to a page that already has Lit** | **63.0 KB** | **17.6 KB** |
| With Lit – the first component on a page | 83.8 KB | 24.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 101 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of claims replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.1 ms | claims: first render, 338 nodes; update 0.6 ms |
| 1,000 items | 27 ms | claims: first render, 2,705 nodes; update 6.0 ms |

1,000 items of claims: 27 ms, 2,705 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (validity-badge).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (validity-badge), `MutationObserver` (validity-badge), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()` (validity-badge).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Split the answer at claims a person could check on their own – one fact, figure or judgement each. Leave the
  words between them (“so”, “and”) as plain text.
- Mark a claim `grounded` only when a retrieved passage states it; a conclusion drawn from two sources is
  `inferred`.
- Use `note` for one short sentence on why a claim is uncertain or how it was inferred: “Studies disagree on how
  much.”
- Write the counter-position as the best argument against the answer, not a disclaimer: name what could be wrong
  and why.
- Rename the source types for your field with `sourceLabels`; keep the kinds. Mark a claim read from a recording, an
  image or a scan with its media type, not `grounded`, so people check the original.
- Use a memory type for what the model remembers rather than retrieves now; its note says it may be out of date.
- Set `questionType` from your own classifier; leave it unset when you don't classify questions.

## Do and don't

### Do

- Give every claim a confidence the model actually produced, and set `confidenceBands` to where your evaluation
  shows the levels change.
- Attach a source's `validity` so an old or disputed passage shows it next to the claim it supports – and set
  `changed` on it when the source has changed since the answer used it.
- Set `confidenceCeilings` from your evaluation of each type, and pass `recognition` for media claims, so a shaky
  transcript or a poor scan can't look certain.
- Handle `tc-verify` and add the claim to your verification queue.

### Don't

- Don't mark connecting text as a claim – it dilutes the ones that matter.
- Don't hide the counter-position for answers people will act on.
- Don't use colour alone to tell types apart in your own additions – keep the underline styles.
- Don't use a ceiling to hide a confidence you don't trust – the detail says what the model said.

## Related

- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Validity Badge](validity-badge.md) – How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
