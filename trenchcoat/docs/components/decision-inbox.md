<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Decision Inbox

**Agents**

Open decisions with two quick answers each – answered ones confirm and fold away

- **Element:** `<tc-decision-inbox>`
- **Size:** 8.1 KB gzip · 26.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/decision-inbox";` |
| React / Next.js | `import { DecisionInbox } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/decision-inbox";` · tags starting with tc- are custom elements |
| Angular | `import { DecisionInbox } from "@adamstavely/trenchcoat/angular/decision-inbox";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/decision-inbox";` |

## Example

The live example is in the gallery at `#/decision-inbox`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A short list of open questions waiting on one person, each with two answers they can give in a click: “Merge” or
“Hold”, “Refund” or “Ask for more”. An answered row confirms what was chosen for about a second, then folds away,
and the heading counts down (“3 need your input”) until it says “All caught up”. It suits the small decisions
agents and teammates leave behind, where opening each one in a page of its own would cost more than the decision.
Saving can be asynchronous: return a promise from `decide` and the row waits for it, and offers both answers again
if it fails.

### When to use

- A handful of yes-or-no-style decisions from agents or automations, each answerable from its title and one line of
  context.
- A side panel or home card that collects what's blocked on the person looking at it.
- Lower-priority decisions that can start folded to one line (`collapsed`) and open when the ones above are done.

### When not to use

- One action an agent wants to take, with a preview and a risk level to weigh – use [Approval Card](approval-card.md).
- Background agent tasks with status, steps and more than two outcomes – use [Agent Inbox](agent-inbox.md).
- An agent asking for a right it doesn't have yet (once, for an hour, always) – use [Permission Request](permission-request.md).
- Suggestions people can take or leave, with no decision owed – use [Tips Panel](tips-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – an inbox icon and how many decisions need input, or “All caught up”
2. **Decision** `.ui-di__item` – the title, its context and two answers
3. **Context** `.ui-di__detail` – one line under the title
4. **Answers** `.ui-di__actions` – the dark primary and the light secondary button
5. **Folded decision** `.ui-di__title--folded` – a muted one-line title that opens when clicked

## Looks

Standard sets the decisions in a white card inside a gray tray, with the header and its count above them in the tray.
Clean is a single white card whose first row is the header, with a solid glyph for the tick. Both fold answered rows
the same way.

## Usage

### HTML

```html
<tc-decision-inbox id="inbox"></tc-decision-inbox>

<script type="module">
  import "@adamstavely/trenchcoat/decision-inbox";
  import "@adamstavely/trenchcoat/tokens.css";

  const inbox = document.querySelector("#inbox");
  inbox.decisions = [
    { id: "d1", title: "Merge the pricing page redesign?", detail: "All checks passed · 2 approvals", primary: "Merge", secondary: "Hold" },
    { id: "d2", title: "Refund order #48213 ($129.00)?", detail: "Arrived damaged – photos attached", primary: "Refund", secondary: "Ask for more" },
  ];
  inbox.decide = (decision, answer) => fetch(`/api/decisions/${decision.id}`, { method: "POST", body: answer });
  inbox.addEventListener("tc-decide", (e) => console.log(e.detail.decision.id, e.detail.answer));
</script>
```

### React / Next.js

```tsx
import { DecisionInbox, type InboxDecision } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const decisions: InboxDecision[] = [
  { id: "d1", title: "Merge the pricing page redesign?", detail: "All checks passed · 2 approvals", primary: "Merge", secondary: "Hold" },
  { id: "d2", title: "Rotate the staging database password", primary: "Rotate", secondary: "Next week", collapsed: true },
];

export function Decisions() {
  return (
    <DecisionInbox
      decisions={decisions}
      onDecide={(decision, answer) => fetch(`/api/decisions/${decision.id}`, { method: "POST", body: answer })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/decision-inbox";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";

defineProps<{ decisions: TcDecisionInbox["decisions"]; answers: TcDecisionInbox["answers"] }>();
const onAnswersChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-decision-inbox :decisions="decisions" :answers="answers" @tc-answers-change="onAnswersChange"></tc-decision-inbox>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DecisionInbox } from "@adamstavely/trenchcoat/angular/decision-inbox";
import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";

@Component({
  selector: "app-decision-inbox-example",
  imports: [DecisionInbox],
  template: `<tc-decision-inbox [decisions]="decisions()" [answers]="answers()" (tc-answers-change)="onAnswersChange($event)"></tc-decision-inbox>`,
})
export class DecisionInboxExample {
  readonly decisions = input.required<TcDecisionInbox["decisions"]>();
  readonly answers = input.required<TcDecisionInbox["answers"]>();
  onAnswersChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/decision-inbox";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";

  let { decisions, answers }: { decisions: TcDecisionInbox["decisions"]; answers: TcDecisionInbox["answers"] } = $props();
  let el: TcDecisionInbox;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-answers-change", on);
    return () => el.removeEventListener("tc-answers-change", on);
  });
</script>

<tc-decision-inbox bind:this={el} {decisions} {answers}></tc-decision-inbox>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Decisions"` | The inbox's name, in the header; the line under it says how many need input |
| `decisions` | – | `InboxDecision[]` | `[]` | The decisions to show – new ones join as they're passed, answered ones fold away |
| `answers` | – | `Record<string, DecisionAnswer>` | `{}` | The answers given so far, by decision id. Answers present on first render start folded away. Changed by the user unless a tc-answers-change listener calls preventDefault() |
| `decide` | – | `((decision: InboxDecision, answer: DecisionAnswer) => void \| Promise<unknown>) \| undefined` | `undefined` | Called with the decision and the chosen answer. Return a promise to hold the row until it settles |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-answers-change` | – | Yes | An answer was given ({ answers }: DecisionAnswersChange, every answer by decision id); cancelable |
| `tc-decide` | – | No | A decision was answered ({ decision, answer }), after `decide` settled |

#### Design tokens it reads (60)

`--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `decisions` | `el.decisions = …;` | `<… decisions={…} />` | `<tc-decision-inbox :decisions="…">` | `<tc-decision-inbox [decisions]="…">` | `<tc-decision-inbox {decisions}>` |
| `answers` | `el.answers = …;` | `<… answers={…} />` | `<tc-decision-inbox :answers="…">` | `<tc-decision-inbox [answers]="…">` | `<tc-decision-inbox {answers}>` |
| `decide` | `el.decide = …;` | `<… decide={…} />` | `<tc-decision-inbox :decide="…">` | `<tc-decision-inbox [decide]="…">` | `<tc-decision-inbox {decide}>` |

*Also attributes: `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-answers-change` | Yes | `el.addEventListener("tc-answers-change", (e) => …)` | `onAnswersChange={…}` | `@tc-answers-change="…"` | `(tc-answers-change)="…($event)"` | `el.addEventListener("tc-answers-change", …)` |
| `tc-decide` | No | `el.addEventListener("tc-decide", (e) => …)` | `ref.current.addEventListener("tc-decide", …)` | `@tc-decide="…"` | `(tc-decide)="…($event)"` | `el.addEventListener("tc-decide", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `answers` itself unless a listener calls `preventDefault()` on `tc-answers-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-decision-inbox id="decision-inbox"></tc-decision-inbox>

<script type="module">
  import "@adamstavely/trenchcoat/decision-inbox";

  const el = document.querySelector("#decision-inbox");
  el.addEventListener("tc-answers-change", (e) => {
    e.preventDefault(); // the element keeps its answers…
    if (allowed(e.detail.answers)) el.answers = e.detail.answers; // …until the app sets it
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
import "@adamstavely/trenchcoat/decision-inbox";
import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";

const props = defineProps<{ initial: TcDecisionInbox["answers"] }>();
const answers = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAnswersChange = (e: CustomEvent<{ answers: TcDecisionInbox["answers"] }>) => {
  e.preventDefault();
  answers.value = e.detail.answers;
};
</script>

<template>
  <tc-decision-inbox :answers="answers" @tc-answers-change="onAnswersChange"></tc-decision-inbox>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DecisionInbox } from "@adamstavely/trenchcoat/angular/decision-inbox";
import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";

@Component({
  selector: "app-controlled-decision-inbox",
  imports: [DecisionInbox],
  template: `<tc-decision-inbox [answers]="answers()" (tc-answers-change)="onAnswersChange($event)"></tc-decision-inbox>`,
})
export class ControlledDecisionInbox {
  readonly initial = input.required<TcDecisionInbox["answers"]>();
  readonly answers = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAnswersChange(e: CustomEvent<{ answers: TcDecisionInbox["answers"] }>) {
    e.preventDefault();
    this.answers.set(e.detail.answers);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/decision-inbox";
  import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";

  let { initial }: { initial: TcDecisionInbox["answers"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let answers = $derived(initial);
  let el: TcDecisionInbox;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      answers = (e as CustomEvent<{ answers: TcDecisionInbox["answers"] }>).detail.answers;
    };
    el.addEventListener("tc-answers-change", on);
    return () => el.removeEventListener("tc-answers-change", on);
  });
</script>

<tc-decision-inbox bind:this={el} {answers}></tc-decision-inbox>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-decision-inbox")` returns a `TcDecisionInbox` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";`
- **React / Next.js:** Props: `import type { DecisionInboxProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DecisionInbox>`. The element class, for refs: `import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDecisionInbox["decisions"]` with `import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";`
- **Angular:** The directive types the template: `[decisions]` takes `TcDecisionInbox["decisions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDecisionInbox } from "@adamstavely/trenchcoat/decision-inbox";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The inbox's name, in the header (default "Decisions") |
| `answers` | `Record<string, DecisionAnswer>` | The answers given so far, by decision id. Controlled when defined – pair it with `onAnswersChange` |
| `defaultAnswers` | `Record<string, DecisionAnswer>` | Answers already given on mount when `answers` isn't controlled – those rows start folded away |
| `onAnswersChange` | `(answers: Record<string, DecisionAnswer>) => void` | Called with every answer, controlled or not |
| `onDecide` | `(decision: InboxDecision, answer: DecisionAnswer) => void \| Promise<unknown>` | Called with the decision and the chosen answer. Return a promise to hold the row until it settles: it answers on success, and on a rejection says so and offers both buttons again |

*Renamed or hidden on the wrapper: `title`, `heading`, `answers`, `decide`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the answer buttons and folded titles |
| Enter / Space | Gives the focused answer, or opens a folded decision |

When a row changes, focus never drops to the page: after an answer it moves to the confirmation (“✓ Merge”), then
to the next open decision's first button as the row folds away; opening a folded decision moves to its first
answer.

### Screen readers

The count is a polite live region, so each answer is followed by the new count – “2 need your input”, “1 needs your
input”, “All caught up”. A folded title is a button with `aria-expanded="false"` that controls the decision's body;
folded and answered rows are `inert`, so they're skipped. While a `decide` promise is pending, the row is
`aria-busy` and both buttons are `aria-disabled`. If it rejects, an alert says “Couldn't save that – try again.”
When nothing is left, the card says “Nothing waiting on you – new decisions show up here.”

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.5 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **26.9 KB** | **8.1 KB** |
| With Lit – the first component on a page | 48.7 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 52 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of decisions replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | decisions: first render, 1,012 nodes; update 1.2 ms |
| 1,000 items | 65 ms | decisions: first render, 10,012 nodes; update 5.0 ms |

1,000 items of decisions: 65 ms. It renders every item, so a first render passes 50 ms (a long task) at about 770 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the title as the question, ending in a question mark: “Refund order #48213 ($129.00)?”.
- Put the one fact that decides it in `detail`: checks, amounts, who asked – one line.
- Label answers with verbs that say what happens: “Merge” / “Hold”, “Send” / “Edit first” – not “Yes” / “No”.
- Make `primary` the answer most people give; it's the dark button.

## Do and don't

### Do

- Return a promise from `decide` when the answer has to be saved, so a failure doesn't fold the row away.
- Keep the list short – a few decisions at once; fold the rest with `collapsed`.
- Add new decisions to `decisions` as they arrive; answered ones keep folding away on their own.

### Don't

- Don't use it for destructive actions that need a second look – a single click answers.
- Don't put more than two answers in a decision – there's room for exactly two.
- Don't remove an answered decision from `decisions` before it has folded – it disappears without the confirmation.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state

## Changelog

- decision-inbox has a `heading` (React `title`), default "Decisions"; the count moved to the line under it.
