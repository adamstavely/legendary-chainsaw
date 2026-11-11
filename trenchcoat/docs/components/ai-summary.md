<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# AI Summary

**AI & chat** · New

The gist of a thread, meeting or set of documents – a TL;DR, a summary that streams in, key points citing their sources as numbered chips, open questions, a note when the sources have moved on, and feedback, Sources, Copy and Regenerate

- **Element:** `<tc-ai-summary>`
- **Size:** 15.1 KB gzip · 53.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ai-summary";` |
| React / Next.js | `import { AiSummary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ai-summary";` · tags starting with tc- are custom elements |
| Angular | `import { AiSummary } from "@adamstavely/trenchcoat/angular/ai-summary";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ai-summary";` |

## Example

The live example is in the gallery at `#/ai-summary`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The gist of a set of sources – a thread, a meeting, some documents, a ticket's history – written by AI. The header says
what was summarised (“#launch-q3 · 4 messages · 2 documents · 1 meeting”) and marks the summary as AI-generated, with
the model and how long ago it was written. The body leads with a one-line TL;DR, then the summary, key points citing
their sources as numbered chips, and the questions the sources leave open. The footer asks whether it helped and offers
Sources, Copy and Regenerate. Short and Detailed switch the summary's length.

A numbered chip shows its source's name on hover or focus, and opens the source. When the sources move on – `stale`
is set, or a source is dated after `generatedAt` – a quiet banner says “3 new messages since this summary” with Update.

The page drives it with `status`: "idle" offers Summarise, "summarising" shows a shimmer until the first words arrive
and a caret while the text grows, "done" shows everything, and "error" shows what went wrong with Retry. Stream by
setting `tldr`, `summary`, `points` and `questions` as they arrive.

Follow-up questions: set `ask` to the question box's placeholder (“Ask Donovan a follow-up…”) and a field shows under
the summary, above the footer. Enter sends (Shift+Enter starts a new line) and fires a cancelable `tc-ask` with the
trimmed question; the box clears unless the event is prevented. The page answers through `messages`, oldest first:
questions show as bubbles at the right, answers as text under the summary's icon, with optional cited `points` whose
chips work as the summary's do. An answer with `status: "thinking"` shimmers, and the box is disabled until it's done.

`icon` puts an app's own mark – a persona's logo, an `<svg>` or `<img>` – in place of the sparkle, in the header and
beside each answer. `badge` renames the “AI-generated” badge, for a summary written by rules rather than a model; an
empty string hides it.

### When to use

- Catching up on a long thread, channel or ticket without reading every message.
- After a meeting, alongside its notes and the documents it discussed.
- Any “what happened while I was away” view where each claim should lead back to where it came from.

### When not to use

- One file – use [File Summary](file-summary.md), which knows pages, timestamps and file types.
- An answer to a question someone asked – use [AI Answer](ai-answer.md) or [Cited Answer](cited-answer.md).
- Conclusions a person wrote themselves, kept apart from the model's – use [Synthesis Notes](synthesis-notes.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the title, what was summarised by kind, and the AI-generated tag `.ui-aism__ai-tag` with the model and how long ago
2. **Length** `.ui-aism__len` – Short or Detailed
3. **Freshness** `.ui-aism__stale` – how many new items there are since the summary, with Update
4. **TL;DR** `.ui-aism__tldr` – the one-line gist
5. **Summary** `.ui-aism__summary` – the paragraphs, with a caret while they stream in; a shimmer `.ui-aism__skeleton` before the first words
6. **Key points** `.ui-aism__points` – each point with numbered source chips `.ui-aism__cite` and their tooltip `.ui-aism__tip`
7. **Footer** `.ui-aism__foot` – Was this helpful?, Sources, Copy and Regenerate
8. **Follow-up** `.ui-aism__chat` – the conversation under a quiet divider: question bubbles `.ui-aism__bubble` and answers `.ui-aism__answer`
9. **Question box** `.ui-aism__ask` – a field that grows to four lines, with Send `.ui-aism__send`
10. **Sources** `.ui-aism__sources` – every source, numbered as the chips cite it, with its kind and when
11. **Error** `.ui-aism__error` – what went wrong, with Retry

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and a stronger selected length. Clean
is one white card with the header as its first row, roomier summary lines and thinner icons. In both, the sparkle
icon and the AI-generated tag are violet, so a summary is never mistaken for something a person wrote.

## Usage

### HTML

```html
<tc-ai-summary id="sum" heading="Thread summary" subject="#launch-q3" model="Claude Sonnet"></tc-ai-summary>

<script type="module">
  import "@adamstavely/trenchcoat/ai-summary";
  import "@adamstavely/trenchcoat/tokens.css";

  const sum = document.querySelector("#sum");
  sum.sources = [
    { id: "m1", label: "Priya in #launch-q3", kind: "message" },
    { id: "t1", label: "BILL-482 – proration bug", kind: "ticket", href: "/tickets/482" },
  ];
  sum.addEventListener("tc-summarise", async () => {
    sum.status = "summarising";
    const result = await fetch("/api/summarise?channel=launch-q3").then((r) => r.json());
    sum.tldr = result.tldr;
    sum.summary = result.summary;
    sum.points = [{ id: "bug", text: "A billing bug blocks launch.", sources: ["t1"] }];
    sum.generatedAt = Date.now();
    sum.status = "done";
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AiSummary, type AiSummarySource, type AiSummaryStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sources: AiSummarySource[] = [
  { id: "m1", label: "Priya in #launch-q3", kind: "message" },
  { id: "t1", label: "BILL-482 – proration bug", kind: "ticket", href: "/tickets/482" },
];

export function ThreadSummary() {
  const [status, setStatus] = useState<AiSummaryStatus>("idle");
  const [summary, setSummary] = useState("");
  const [at, setAt] = useState<number | undefined>(undefined);
  const summarise = async () => {
    setStatus("summarising");
    const result = await fetch("/api/summarise?channel=launch-q3").then((r) => r.json());
    setSummary(result.summary);
    setAt(Date.now());
    setStatus("done");
  };
  return (
    <AiSummary
      title="Thread summary"
      subject="#launch-q3"
      model="Claude Sonnet"
      sources={sources}
      status={status}
      summary={summary}
      generatedAt={at}
      points={[{ id: "bug", text: "A billing bug blocks launch.", sources: ["t1"] }]}
      onSummarise={summarise}
      onRetry={summarise}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ai-summary";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";

defineProps<{ sources: TcAiSummary["sources"]; points: TcAiSummary["points"] }>();
const onSummarise = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ai-summary :sources="sources" :points="points" @tc-summarise="onSummarise"></tc-ai-summary>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AiSummary } from "@adamstavely/trenchcoat/angular/ai-summary";
import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";

@Component({
  selector: "app-ai-summary-example",
  imports: [AiSummary],
  template: `<tc-ai-summary [sources]="sources()" [points]="points()" (tc-summarise)="onSummarise($event)"></tc-ai-summary>`,
})
export class AiSummaryExample {
  readonly sources = input.required<TcAiSummary["sources"]>();
  readonly points = input.required<TcAiSummary["points"]>();
  onSummarise(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-summary";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";

  let { sources, points }: { sources: TcAiSummary["sources"]; points: TcAiSummary["points"] } = $props();
  let el: TcAiSummary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-summarise", on);
    return () => el.removeEventListener("tc-summarise", on);
  });
</script>

<tc-ai-summary bind:this={el} {sources} {points}></tc-ai-summary>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Summary"` | The heading |
| `subject` | `subject` | `string \| undefined` | `undefined` | What was summarised, named before the counts: "#launch-q3" |
| `sources` | – | `AiSummarySource[]` | `[]` | The sources summarised, in citation order – a point's chip shows its source's number in this list |
| `status` | `status` | `AiSummaryStatus` | `"idle"` | Where the summary is: "idle", "summarising", "done" or "error" |
| `tldr` | `tldr` | `string` | `""` | The one-line gist, shown first and emphasised |
| `summary` | `summary` | `string` | `""` | The summary; may grow while "summarising". Blank lines split paragraphs |
| `points` | – | `AiSummaryPoint[]` | `[]` | The key points, each with the sources it comes from |
| `questions` | – | `string[]` | `[]` | What the sources leave open |
| `length` | `length` | `AiSummaryLength` | `"short"` | Short or detailed. Changed by the user unless a tc-length-change listener calls preventDefault() |
| `model` | `model` | `string \| undefined` | `undefined` | The model that wrote it, e.g. "Claude Sonnet" |
| `generatedAt` | `generated-at` | `number \| undefined` | `undefined` | When it was generated, epoch ms |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for the relative time and freshness, epoch ms; unset, the element keeps its own clock |
| `stale` | – | `boolean \| number` | `false` | The sources have moved on since the summary: true, or how many new items there are. Sources dated after `generatedAt` count too |
| `staleLabel` | `stale-label` | `string \| undefined` | `undefined` | The banner's words in place of "3 new messages since this summary" |
| `feedback` | – | `AiSummaryFeedbackValue` | `null` | Whether it helped: "up", "down" or null. Changed by the user unless a tc-feedback listener calls preventDefault() |
| `sourcesOpen` | `sources-open` | `boolean` | `false` | The list of sources under the footer is open |
| `error` | `error` | `string \| undefined` | `undefined` | What went wrong, shown with "error" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and numbers, e.g. "en-GB"; by default the browser's |
| `icon` | – | `Element \| undefined` | `undefined` | An icon element in place of the header's sparkle – a persona's logo, an &lt;svg> or &lt;img> (cloned). Answers carry a small copy |
| `badge` | `badge` | `string \| undefined` | `undefined` | The words of the "AI-generated" badge; an empty string hides it |
| `ask` | `ask` | `string \| undefined` | `undefined` | The follow-up question box's placeholder, e.g. "Ask Donovan a follow-up…"; set, the box shows under the summary |
| `messages` | – | `AiSummaryMessage[]` | `[]` | The follow-up conversation, oldest first: questions ("user") and answers ("assistant") |
| `disclaimer` | `disclaimer` | `string` | `""` | One quiet line under the ask box, above the footer – "AI can make mistakes. Check important info." – unset, none |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-summarise` | – | No | Summarise was pressed while `status` is "idle" – start summarising; detail: null |
| `tc-retry` | – | No | Regenerate, Retry after an error, or Update when stale ({ reason: "regenerate" \| "error" \| "stale" }: AiSummaryRetry) |
| `tc-length-change` | – | Yes | Short or Detailed was picked ({ length }: AiSummaryLengthChange); cancelable – prevented, `length` stays as it was |
| `tc-cite-open` | – | Yes | A citation chip was used ({ sourceId, pointId }: AiSummaryCiteOpen); cancelable – prevented, a link to the source doesn't open |
| `tc-feedback` | – | Yes | Helpful or not helpful was pressed, or pressed again to take it back ({ value }: AiSummaryFeedback); cancelable – prevented, `feedback` stays as it was |
| `tc-copy` | – | No | The summary is on the clipboard ({ text }) |
| `tc-ask` | – | Yes | A follow-up question was sent with Enter or Send ({ question }: AiSummaryAsk), trimmed; cancelable – prevented, the question stays in the box |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-aism-send-bg` | `var(--tc-action-primary-bg)` | not set – this fallback applies |
| `--tc-aism-send-fg` | `var(--tc-action-primary-fg)` | not set – this fallback applies |
| `--tc-aism-send-bg-hover` | `var(--tc-action-primary-bg-hover)` | not set – this fallback applies |
| `--tc-aism-send-bg-active` | `var(--tc-action-primary-bg-active)` | not set – this fallback applies |

#### Design tokens it reads (110)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-head-glyph`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-overlay`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `aiSummaryAgo(ms: number, now: number, locale?: string): void` | "just now", "5 min ago", "3 h ago", else the date |

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
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-ai-summary :sources="…">` | `<tc-ai-summary [sources]="…">` | `<tc-ai-summary {sources}>` |
| `points` | `el.points = …;` | `<… points={…} />` | `<tc-ai-summary :points="…">` | `<tc-ai-summary [points]="…">` | `<tc-ai-summary {points}>` |
| `questions` | `el.questions = …;` | `<… questions={…} />` | `<tc-ai-summary :questions="…">` | `<tc-ai-summary [questions]="…">` | `<tc-ai-summary {questions}>` |
| `stale` | `el.stale = …;` | `<… stale={…} />` | `<tc-ai-summary :stale="…">` | `<tc-ai-summary [stale]="…">` | `<tc-ai-summary {stale}>` |
| `feedback` | `el.feedback = …;` | `<… feedback={…} />` | `<tc-ai-summary :feedback="…">` | `<tc-ai-summary [feedback]="…">` | `<tc-ai-summary {feedback}>` |
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-ai-summary :icon="…">` | `<tc-ai-summary [icon]="…">` | `<tc-ai-summary {icon}>` |
| `messages` | `el.messages = …;` | `<… messages={…} />` | `<tc-ai-summary :messages="…">` | `<tc-ai-summary [messages]="…">` | `<tc-ai-summary {messages}>` |

*Also attributes: `heading`, `subject`, `status`, `tldr`, `summary`, `length`, `model`, `generated-at` and 8 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-summarise` | No | `el.addEventListener("tc-summarise", (e) => …)` | `onSummarise={…}` | `@tc-summarise="…"` | `(tc-summarise)="…($event)"` | `el.addEventListener("tc-summarise", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-length-change` | Yes | `el.addEventListener("tc-length-change", (e) => …)` | `ref.current.addEventListener("tc-length-change", …)` | `@tc-length-change="…"` | `(tc-length-change)="…($event)"` | `el.addEventListener("tc-length-change", …)` |
| `tc-cite-open` | Yes | `el.addEventListener("tc-cite-open", (e) => …)` | `onCiteOpen={…}` | `@tc-cite-open="…"` | `(tc-cite-open)="…($event)"` | `el.addEventListener("tc-cite-open", …)` |
| `tc-feedback` | Yes | `el.addEventListener("tc-feedback", (e) => …)` | `ref.current.addEventListener("tc-feedback", …)` | `@tc-feedback="…"` | `(tc-feedback)="…($event)"` | `el.addEventListener("tc-feedback", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-ask` | Yes | `el.addEventListener("tc-ask", (e) => …)` | `onAsk={…}` | `@tc-ask="…"` | `(tc-ask)="…($event)"` | `el.addEventListener("tc-ask", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `length` and `feedback` itself unless a listener calls `preventDefault()` on `tc-length-change` or `tc-feedback` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ai-summary id="ai-summary"></tc-ai-summary>

<script type="module">
  import "@adamstavely/trenchcoat/ai-summary";

  const el = document.querySelector("#ai-summary");
  el.addEventListener("tc-length-change", (e) => {
    e.preventDefault(); // the element keeps its length…
    if (allowed(e.detail.length)) el.length = e.detail.length; // …until the app sets it
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
import "@adamstavely/trenchcoat/ai-summary";
import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";

const props = defineProps<{ initial: TcAiSummary["length"] }>();
const length = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLengthChange = (e: CustomEvent<{ length: TcAiSummary["length"] }>) => {
  e.preventDefault();
  length.value = e.detail.length;
};
</script>

<template>
  <tc-ai-summary :length="length" @tc-length-change="onLengthChange"></tc-ai-summary>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AiSummary } from "@adamstavely/trenchcoat/angular/ai-summary";
import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";

@Component({
  selector: "app-controlled-ai-summary",
  imports: [AiSummary],
  template: `<tc-ai-summary [length]="length()" (tc-length-change)="onLengthChange($event)"></tc-ai-summary>`,
})
export class ControlledAiSummary {
  readonly initial = input.required<TcAiSummary["length"]>();
  readonly length = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLengthChange(e: CustomEvent<{ length: TcAiSummary["length"] }>) {
    e.preventDefault();
    this.length.set(e.detail.length);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ai-summary";
  import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";

  let { initial }: { initial: TcAiSummary["length"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let length = $derived(initial);
  let el: TcAiSummary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      length = (e as CustomEvent<{ length: TcAiSummary["length"] }>).detail.length;
    };
    el.addEventListener("tc-length-change", on);
    return () => el.removeEventListener("tc-length-change", on);
  });
</script>

<tc-ai-summary bind:this={el} {length}></tc-ai-summary>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ai-summary")` returns a `TcAiSummary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";`
- **React / Next.js:** Props: `import type { AiSummaryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AiSummary>`. The element class, for refs: `import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAiSummary["sources"]` with `import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";`
- **Angular:** The directive types the template: `[sources]` takes `TcAiSummary["sources"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAiSummary } from "@adamstavely/trenchcoat/ai-summary";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading ("Summary" by default) |
| `length` | `AiSummaryLength` | Short or detailed – controlled when given |
| `defaultLength` | `AiSummaryLength` | The length on mount when `length` isn't controlled |
| `onLengthChange` | `(length: AiSummaryLength) => void` | Short or Detailed was picked – summarise again |
| `feedback` | `AiSummaryFeedbackValue` | Whether it helped – controlled when given ("up", "down" or null) |
| `defaultFeedback` | `AiSummaryFeedbackValue` | The feedback on mount when `feedback` isn't controlled |
| `onFeedbackChange` | `(value: AiSummaryFeedbackValue) => void` | Helpful or not helpful was pressed, or taken back (null) |
| `onSummarise` | `() => void` | Summarise was pressed – start summarising |
| `onRetry` | `(reason: AiSummaryRetry["reason"]) => void` | Regenerate, Retry after an error, or Update when the sources have moved on |
| `onCiteOpen` | `(cite: AiSummaryCiteOpen) => boolean \| void` | A citation chip was used; return false to keep a link to the source from opening |
| `onCopy` | `(text: string) => void` | Called with the copied text once the summary is on the clipboard |
| `onAsk` | `(question: string) => boolean \| void` | A follow-up question was sent (trimmed); return false to keep it in the box |

*Renamed or hidden on the wrapper: `heading`, `length`, `feedback`, `onCopy`, `children`*

## Accessibility

### Keyboard

Every control is a stop in reading order: Short / Detailed (one stop), Update, Summarise or Retry, each source chip,
then helpful and not helpful, Sources, Copy and Regenerate, and each source's link once the list is open.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls; a source chip shows its source's name while focused |
| ← / → / ↑ / ↓ | In Short / Detailed, picks the other length |
| Home / End | In Short / Detailed, picks Short or Detailed |
| Enter / Space | Uses the focused control: opens a source, gives feedback, opens the sources, copies, regenerates |
| Escape | On a source chip, hides its tooltip |
| Enter | In the question box, sends the question |
| Shift+Enter | In the question box, starts a new line |

While summarising, feedback, Copy and Regenerate are disabled; if focus was on a control that goes away, it moves to
Short / Detailed. Picking a length while summarising fires tc-length-change, so the page can start again.

### Screen readers

The title is the card's heading. Short / Detailed is a `radiogroup` labelled “Summary length”. While the summary
streams it is `aria-busy`, and the status is announced politely: “Summarising #launch-q3”, “Summary of #launch-q3
ready”, or “Couldn't summarise #launch-q3: …”. An error is also an `alert`. A source chip shows “2” and reads “Source 2:
Marco in #launch-q3”; its visual tooltip repeats the name, so it's hidden from screen readers. Helpful and Not helpful
are toggle buttons (`aria-pressed`) in a group labelled “Was this helpful?”, confirmed with “Marked as helpful”. Sources
is a disclosure (`aria-expanded`) over a list labelled “Sources”. Copy confirms with “Summary copied”. The follow-up
conversation is a list under a “Follow-up” heading; questions read “You asked: …”, an answer being written reads
“Thinking…” and is `aria-busy`, and each answer is announced politely once written. The question box is labelled by
its placeholder.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 43.5 KB | 12.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **53.0 KB** | **15.1 KB** |
| With Lit – the first component on a page | 75.4 KB | 22.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 114 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of sources replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.0 ms | sources: first render, 114 nodes; update 0.4 ms |
| 1,000 items | 3.3 ms | sources: first render, 114 nodes; update 0.5 ms |

What it renders doesn't grow with sources (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the TL;DR as the one thing to know, with the decision or the date in it: “Launch is set for 12 November if the billing bug is fixed by Friday.”
- Keep the short summary to two or three sentences, and the detailed one to two short paragraphs.
- Write key points as findings, and cite every one; a point without a source can't be checked.
- Put what nobody has decided yet in `questions`, as questions.
- Name sources as people would find them: “Marco in #launch-q3”, “BILL-482 – proration rounding bug”.

## Do and don't

### Do

- Set `generatedAt` and `model`, so people can judge how fresh and how trustworthy the summary is.
- Pass new sources with their `at`, or set `stale`, so people know when the summary is behind.
- Summarise again on `tc-retry` and `tc-length-change`, setting `status` back to "summarising".
- On `tc-ask`, add the question and a `"thinking"` answer to `messages` at once, then fill the answer in.
- Set `badge` to say how the summary was made when a model didn't write it.

### Don't

- Don't refresh a summary silently as messages arrive – show that it's behind and let people Update.
- Don't cite a source that isn't in `sources`; its chip won't show.
- Don't leave `status` at "summarising" after a failure – set "error" so Retry appears.

## Related

- [File Summary](file-summary.md) – What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Cited Answer](cited-answer.md) – An AI answer wired to its sources – point at a citation to light up its sentence and source, click to unfold the quoted passage with the matching words marked
- [Synthesis Notes](synthesis-notes.md) – Your own conclusions, assumptions and open questions, kept apart from the model's output and exported with where they came from

## Changelog

- **`tc-ai-summary`** (AI & chat): the gist of a thread, meeting or set of documents. - **Summary:** a TL;DR, then a summary that streams in. - **Sources:** key points cite their sources as numbered chips with previews, plus open questions. - **Freshness:** a note when the sources have moved on, with Update. - **Controls:** Short / Detailed, feedback, a Sources list, Copy and Regenerate.
