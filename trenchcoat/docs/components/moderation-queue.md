<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Moderation Queue

**Trust & calibration** · New

Reported replies judged one at a time – who reported it or which classifier flagged it with its score in a word, the policy it may break, the conversation with the reported reply marked, and Keep, Remove reply, Restrict user or Escalate from buttons or single keys, a note required to remove or restrict, progress, the next waiting item opening, and Undo

- **Element:** `<tc-moderation-queue>`
- **Size:** 8.9 KB gzip · 28.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/moderation-queue";` |
| React / Next.js | `import { ModerationQueue } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/moderation-queue";` · tags starting with tc- are custom elements |
| Angular | `import { ModerationQueue } from "@adamstavely/trenchcoat/angular/moderation-queue";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/moderation-queue";` |

## Example

The live example is in the gallery at `#/moderation-queue`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Reported replies, judged one at a time. Each item says why it's here – a person's report, or an automatic flag with the
classifier's score in a word and a number – the policy it may break, and the conversation around it with the reported
reply marked. There's one decision per item: Keep (no violation), Remove reply, Restrict user or Escalate. Removing and
restricting need a note, so the record says why. After a decision the next waiting item opens, progress reads "Item 2 of
6 · 3 decided", the header counts what's waiting, and Undo takes the last decision back. Every decision has a single-key
shortcut, shown on its button.

### When to use

- A trust and safety or admin queue for replies people reported with Report on a message.
- Reviewing replies an automatic classifier flagged, before anyone acts on them.
- Any queue where each item gets exactly one of a few decisions, quickly, from the keyboard.

### When not to use

- Reporting a reply in the first place – use [Message Actions](message-actions.md) with `reportable`.
- Checking claims against their sources before an export – use [Verification Queue](verification-queue.md).
- Telling someone a policy blocked or changed content – use [Guardrail Notice](guardrail-notice.md).
- Grading answers for quality, not policy – use [Feedback Rubric](feedback-rubric.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Waiting** `.ui-mdq__waiting` – how many items have no decision yet
2. **Progress** `.ui-mdq__progress` – where you are and how many are decided
3. **Reason** `.ui-mdq__reason` – who reported it or which classifier flagged it, the reason and when
4. **Policy** `.ui-mdq__policy` – the policy it may break, with a quoted excerpt
5. **Conversation** `.ui-mdq__turns` – the turns around it, the reported reply marked
6. **Verdict** `.ui-mdq__verdict` – the decision already made, if any
7. **Note** `.ui-mdq__note` – needed to remove or restrict
8. **Decisions** `.ui-mdq__decisions` – Keep, Remove reply, Restrict user, Escalate, each with its key
9. **Navigation** `.ui-mdq__nav` – Previous, Next and Undo

## Looks

Standard is a white card on a gray tray with the header on the tray. Clean is one white card with the header as its first
row. The conversation sits on a quiet panel; the reported reply is outlined in the danger colour and labelled in both.

## Usage

### HTML

```html
<tc-moderation-queue id="queue" description="Policy questions, this week"></tc-moderation-queue>

<script type="module">
  import "@adamstavely/trenchcoat/moderation-queue";
  import "@adamstavely/trenchcoat/tokens.css";

  const queue = document.querySelector("#queue");
  queue.items = [
    {
      id: "r1",
      reason: "Unsafe advice",
      reportedBy: "Tom Becker",
      user: "Jordan Ellis",
      policy: { name: "Financial advice policy" },
      turns: [
        { id: "t1", from: "user", author: "Jordan Ellis", text: "Can I claim my home office on my tax return?" },
        { id: "t2", from: "assistant", text: "Yes – claim the full rent; nobody checks.", reported: true },
      ],
    },
  ];
  queue.addEventListener("tc-decide", (e) => console.log(e.detail.decision, e.detail.note));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ModerationQueue, type ModerationItem, type ModerationVerdict } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reports({ items }: { items: ModerationItem[] }) {
  const [decisions, setDecisions] = useState<Record<string, ModerationVerdict>>({});
  return (
    <ModerationQueue
      title="Reported replies"
      items={items}
      decisions={decisions}
      onDecisionsChange={setDecisions}
      onDecide={(id, decision, note) => void fetch(`/api/reports/${id}`, { method: "POST", body: JSON.stringify({ decision, note }) })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/moderation-queue";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";

defineProps<{ items: TcModerationQueue["items"]; decisions: TcModerationQueue["decisions"] }>();
const onDecide = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-moderation-queue :items="items" :decisions="decisions" @tc-decide="onDecide"></tc-moderation-queue>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ModerationQueue } from "@adamstavely/trenchcoat/angular/moderation-queue";
import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";

@Component({
  selector: "app-moderation-queue-example",
  imports: [ModerationQueue],
  template: `<tc-moderation-queue [items]="items()" [decisions]="decisions()" (tc-decide)="onDecide($event)"></tc-moderation-queue>`,
})
export class ModerationQueueExample {
  readonly items = input.required<TcModerationQueue["items"]>();
  readonly decisions = input.required<TcModerationQueue["decisions"]>();
  onDecide(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/moderation-queue";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";

  let { items, decisions }: { items: TcModerationQueue["items"]; decisions: TcModerationQueue["decisions"] } = $props();
  let el: TcModerationQueue;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decide", on);
    return () => el.removeEventListener("tc-decide", on);
  });
</script>

<tc-moderation-queue bind:this={el} {items} {decisions}></tc-moderation-queue>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Moderation"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `ModerationItem[]` | `[]` | The reported replies, oldest first |
| `index` | `index` | `number` | `0` | The item on screen. Changed by deciding and moving unless a tc-index-change listener calls preventDefault() |
| `decisions` | – | `Record<string, ModerationVerdict>` | `{}` | Every decision so far, by item id. Changed by deciding and Undo unless a tc-decisions-change listener calls preventDefault() |
| `decisionLabels` | – | `Partial<ModerationDecisionLabels>` | `{}` | The buttons' words, merged over defaultModerationDecisionLabels |
| `noShortcuts` | `no-shortcuts` | `boolean` | `false` | Turns off the single-letter keys |
| `locale` | `locale` | `string \| undefined` | `undefined` | For dates |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decide` | – | Yes | A decision was made ({ id, decision, note, item }: ModerationDecide); cancelable – prevented, nothing is recorded |
| `tc-decisions-change` | – | Yes | The decisions changed, by a decision or Undo ({ decisions, id }: ModerationDecisionsChange); cancelable – prevented, `decisions` stays as it was |
| `tc-index-change` | – | Yes | Another item opened ({ index, item }: ModerationIndexChange); cancelable – prevented, `index` stays as it was |
| `tc-undo` | – | Yes | Undo took the last decision back ({ id, decision }: ModerationUndo); cancelable – prevented, the decision stays |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `decide(decision: ModerationDecision)` | `void` | Decides the item on screen; a decision that needs a note and has none asks for it instead |
| `undo()` | `void` | Takes the last decision made here back |

#### Design tokens it reads (84)

`--tc-accent`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-moderation-queue :items="…">` | `<tc-moderation-queue [items]="…">` | `<tc-moderation-queue {items}>` |
| `decisions` | `el.decisions = …;` | `<… decisions={…} />` | `<tc-moderation-queue :decisions="…">` | `<tc-moderation-queue [decisions]="…">` | `<tc-moderation-queue {decisions}>` |
| `decisionLabels` | `el.decisionLabels = …;` | `<… decisionLabels={…} />` | `<tc-moderation-queue :decisionLabels="…">` | `<tc-moderation-queue [decisionLabels]="…">` | `<tc-moderation-queue {decisionLabels}>` |

*Also attributes: `heading`, `description`, `index`, `no-shortcuts`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decide` | Yes | `el.addEventListener("tc-decide", (e) => …)` | `onDecide={…}` | `@tc-decide="…"` | `(tc-decide)="…($event)"` | `el.addEventListener("tc-decide", …)` |
| `tc-decisions-change` | Yes | `el.addEventListener("tc-decisions-change", (e) => …)` | `onDecisionsChange={…}` | `@tc-decisions-change="…"` | `(tc-decisions-change)="…($event)"` | `el.addEventListener("tc-decisions-change", …)` |
| `tc-index-change` | Yes | `el.addEventListener("tc-index-change", (e) => …)` | `onIndexChange={…}` | `@tc-index-change="…"` | `(tc-index-change)="…($event)"` | `el.addEventListener("tc-index-change", …)` |
| `tc-undo` | Yes | `el.addEventListener("tc-undo", (e) => …)` | `onUndo={…}` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |

### Controlled

The element changes `index` and `decisions` itself unless a listener calls `preventDefault()` on `tc-index-change` or `tc-decisions-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-moderation-queue id="moderation-queue"></tc-moderation-queue>

<script type="module">
  import "@adamstavely/trenchcoat/moderation-queue";

  const el = document.querySelector("#moderation-queue");
  el.addEventListener("tc-index-change", (e) => {
    e.preventDefault(); // the element keeps its index…
    if (allowed(e.detail.index)) el.index = e.detail.index; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ModerationQueue } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ModerationQueue>;
type Props = Omit<Own, "index" | "onIndexChange"> & { initial: NonNullable<Own["index"]> };

// Controlled: passing index makes the wrapper prevent the element's own change; the app sets it
export function ControlledModerationQueue({ initial, ...props }: Props) {
  const [index, setIndex] = useState<Own["index"]>(initial);
  return <ModerationQueue {...props} index={index} onIndexChange={(next) => setIndex(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/moderation-queue";
import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";

const props = defineProps<{ initial: TcModerationQueue["index"] }>();
const index = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onIndexChange = (e: CustomEvent<{ index: TcModerationQueue["index"] }>) => {
  e.preventDefault();
  index.value = e.detail.index;
};
</script>

<template>
  <tc-moderation-queue :index="index" @tc-index-change="onIndexChange"></tc-moderation-queue>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ModerationQueue } from "@adamstavely/trenchcoat/angular/moderation-queue";
import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";

@Component({
  selector: "app-controlled-moderation-queue",
  imports: [ModerationQueue],
  template: `<tc-moderation-queue [index]="index()" (tc-index-change)="onIndexChange($event)"></tc-moderation-queue>`,
})
export class ControlledModerationQueue {
  readonly initial = input.required<TcModerationQueue["index"]>();
  readonly index = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onIndexChange(e: CustomEvent<{ index: TcModerationQueue["index"] }>) {
    e.preventDefault();
    this.index.set(e.detail.index);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/moderation-queue";
  import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";

  let { initial }: { initial: TcModerationQueue["index"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let index = $derived(initial);
  let el: TcModerationQueue;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      index = (e as CustomEvent<{ index: TcModerationQueue["index"] }>).detail.index;
    };
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-moderation-queue bind:this={el} {index}></tc-moderation-queue>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-moderation-queue")` returns a `TcModerationQueue` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";`
- **React / Next.js:** Props: `import type { ModerationQueueProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ModerationQueue>`. The element class, for refs: `import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcModerationQueue["items"]` with `import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";`
- **Angular:** The directive types the template: `[items]` takes `TcModerationQueue["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcModerationQueue } from "@adamstavely/trenchcoat/moderation-queue";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `index` | `number` | The item on screen – controlled when given |
| `defaultIndex` | `number` | The item on screen at mount, when `index` isn't controlled |
| `onIndexChange` | `(index: number) => void` | Called with the item that opened |
| `decisions` | `Record<string, ModerationVerdict>` | Every decision so far – controlled when given |
| `defaultDecisions` | `Record<string, ModerationVerdict>` | The decisions on mount, when `decisions` isn't controlled |
| `onDecisionsChange` | `(decisions: Record<string, ModerationVerdict>) => void` | Called with every decision so far, after a decision or Undo |
| `onDecide` | `(id: string, decision: ModerationDecision, note: string, item: ModerationItem) => void \| boolean` | A decision was made; return false to refuse it (nothing is recorded) |
| `onUndo` | `(id: string, decision: ModerationDecision) => void \| boolean` | Undo took a decision back; return false to keep it |

*Renamed or hidden on the wrapper: `heading`, `index`, `decisions`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

The keys work anywhere in the queue except in the note. Buttons work with Tab and Enter as usual.

| Key | What it does |
|---|---|
| K | Keep – no violation |
| R | Remove the reply (asks for a note first if there's none) |
| U | Restrict the user (asks for a note first if there's none) |
| E | Escalate |
| N / P | The next or previous item |
| Z | Undo the last decision |

Set `no-shortcuts` to turn the single keys off.

### Screen readers

Each item is an `article` named by its reason. The conversation is a list named "Conversation", and the reported reply is
labelled "Reported reply" in words. The four decisions are buttons in a group named "Decision", each with
`aria-keyshortcuts` and `aria-pressed` on the decision already made. A missing note is said aloud and the note field is
marked invalid and described by the error. Decisions and moves are confirmed in a polite status message: "Reply removed.
Item 3 of 6: Off-topic", "All 6 decided", "Undone: kept. Item 1 is waiting again".

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

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.2 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.9 KB** | **8.9 KB** |
| With Lit – the first component on a page | 48.4 KB | 15.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 62 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.1 ms | items: first render, 62 nodes; update 0.0 ms |
| 1,000 items | 1.1 ms | items: first render, 62 nodes; update 0.1 ms |

What it renders doesn't grow with items (tested to 1,000 items).

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

- Write `reason` as the report's category, short: "Unsafe advice", "Private data", "Harassment".
- Give the classifier a name people recognise: "Personal data detector".
- Include enough turns for the reply to make sense – usually the question before it.
- Quote the policy's own words in `excerpt`, so the decision is made against the rule, not memory.

## Do and don't

### Do

- Handle `tc-decide` and act on it on your server; call `preventDefault()` if the action fails, so nothing is recorded.
- Keep `decisions` from your server, so a reviewer who comes back sees what's been done.
- Use Escalate for anything that needs a specialist, rather than guessing.

### Don't

- Don't show the reporter's identity to the person reported elsewhere – this view is for moderators.
- Don't put unrelated reviews in the same queue; decisions should mean the same thing for every item.
- Don't remove the note requirement – it's the record of why.

## Related

- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Guardrail Notice](guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review
- [Feedback Rubric](feedback-rubric.md) – Rate an answer the useful way – rubric criteria, what kind of failure it was, and the answer it should have been, ready for training and evals
