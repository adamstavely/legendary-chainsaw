<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Decision Tree

**Agents**

An agent stuck on a decision lays out its options as a tree – the consequences of each branch, the risky ones marked, its own pick highlighted – and you choose a path or write your own

- **Element:** `<tc-decision-tree>`
- **Size:** 17.3 KB gzip · 65.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/decision-tree";` |
| React / Next.js | `import { DecisionTree } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/decision-tree";` · tags starting with tc- are custom elements |
| Angular | `import { DecisionTree } from "@adamstavely/trenchcoat/angular/decision-tree";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/decision-tree";` |

## Example

The live example is in the gallery at `#/decision-tree`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

When an agent is stuck on a decision, it lays out its options as a tree: the question on the left, each option as
a branch, and what each branch leads to beside it. The agent's own pick is marked, consequences it isn't sure about
are highlighted with its note and source, and a branch can lead to one follow-up question. People pick a path with
a click or a number key, or write their own instruction under “Other…”; the picked path draws on to its outcome and
the next decision takes its place.

### When to use

- An agent needs a person to choose between two to four courses of action with different consequences.
- The consequences matter more than the labels – refunds, downtime, what can't be undone.
- Several agents queue decisions for one person to work through, one at a time.

### When not to use

- A yes-or-no approval of one action the agent is about to take – use [Approval Card](approval-card.md).
- Many small decisions with two quick answers each – use [Decision Inbox](decision-inbox.md).
- Granting a tool or a scope access to something – use [Permission Request](permission-request.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a fork icon, the heading, how many decisions wait and where you are
2. **Question** `.ui-dct__root` – who asks, on which model, how risky the call is, and the question
3. **Branch** `.ui-dct__opt` – one option with its number key; the agent's pick is marked
4. **Consequences** `.ui-dct__leaf` – what the branch leads to, one line each
5. **Flagged part** `.ui-dct__flag` – a consequence the agent isn't sure about; its note shows on hover or F
6. **Other…** `.ui-dct__other` – opens a field for your own instruction
7. **Pager** `.ui-dct__pager` – dots, “1 of 3” and Previous / Next

## Looks

Standard sets a white card on a soft gray tray with the header above it, the risk tag under the agent's name and each
branch's consequences in an outlined card. Clean drops the tray – one white card, the header as its first row and the
tree below – puts the risk tag above the question and sets consequences on a gray fill. Both draw the tree top to bottom in containers
narrower than 640 px.

## Usage

### HTML

```html
<tc-decision-tree id="decisions" heading="Waiting on you"></tc-decision-tree>

<script type="module">
  import "@adamstavely/trenchcoat/decision-tree";
  import "@adamstavely/trenchcoat/tokens.css";

  const tree = document.querySelector("#decisions");
  tree.decisions = [
    {
      id: "migration",
      question: "The users table migration will lock writes for ~40s. Run it now?",
      agent: "Deploy agent",
      risk: "medium",
      options: [
        { label: "Run it now", effects: ["Writes paused about 40 seconds"], pick: true },
        { label: "Wait for 02:00 UTC", effects: ["Release ships ~9 hours later"] },
      ],
    },
  ];
  tree.onChoose = (decision, choice) => ("other" in choice ? "Got it – I'll do that." : undefined);
  tree.addEventListener("tc-decision-change", (e) => console.log(e.detail.decision));
</script>
```

### React / Next.js

```tsx
import { DecisionTree, type Decision } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const decisions: Decision[] = [
  {
    id: "migration",
    question: "The users table migration will lock writes for ~40s. Run it now?",
    agent: "Deploy agent",
    risk: "medium",
    options: [
      { label: "Run it now", effects: ["Writes paused about 40 seconds"], pick: true },
      { label: "Wait for 02:00 UTC", effects: ["Release ships ~9 hours later"] },
    ],
  },
];

export function Waiting({ answer }: { answer: (id: string, text: string) => Promise<string> }) {
  return (
    <DecisionTree
      title="Waiting on you"
      decisions={decisions}
      onChoose={(decision, choice) => ("other" in choice ? answer(decision.id, choice.other) : undefined)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/decision-tree";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";

defineProps<{ decisions: TcDecisionTree["decisions"] }>();
const onDecisionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-decision-tree :decisions="decisions" @tc-decision-change="onDecisionChange"></tc-decision-tree>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DecisionTree } from "@adamstavely/trenchcoat/angular/decision-tree";
import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";

@Component({
  selector: "app-decision-tree-example",
  imports: [DecisionTree],
  template: `<tc-decision-tree [decisions]="decisions()" (tc-decision-change)="onDecisionChange($event)"></tc-decision-tree>`,
})
export class DecisionTreeExample {
  readonly decisions = input.required<TcDecisionTree["decisions"]>();
  onDecisionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/decision-tree";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";

  let { decisions }: { decisions: TcDecisionTree["decisions"] } = $props();
  let el: TcDecisionTree;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decision-change", on);
    return () => el.removeEventListener("tc-decision-change", on);
  });
</script>

<tc-decision-tree bind:this={el} {decisions}></tc-decision-tree>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `decisions` | – | `TreeDecision[]` | `[]` | Everything waiting for a call – decided ones leave on their own, new ids join at the end |
| `decision` | `decision` | `string \| undefined` | `undefined` | The id of the decision on show – unset shows the first |
| `onChoose` | – | `((decision: TreeDecision, choice: TreeDecisionChoice) => string \| void \| Promise<string \| void>) \| undefined` | `undefined` | A branch was picked or an instruction written – return the agent's short answer to an instruction (or a promise of it). A promise holds the picked path until it settles; a rejection lets go of the pick and says so |
| `allowOther` | `allow-other` | `boolean` | `true` | Shows the "Other…" branch; allow-other="false" hides it |
| `heading` | `heading` | `string` | `"Decisions"` | The heading in the bar, before how many decisions wait |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decision-change` | – | Yes | The decision on show changes (paging, or the shown one was decided); detail `{ decision: string }`. Cancelable: prevent it to control `decision` |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `choose(i: number)` | `void` | Picks the n-th option – or, after a pick, the n-th option of its follow-up; the index after the last option opens "Other…" |
| `send()` | `void` | Sends the "Other…" field |
| `hover(index: number \| null)` | `void` | Lights up the n-th branch (or, after a pick, the n-th option of its follow-up) as if pointed at – null lets go |
| `setOther(text: string)` | `void` | Fills the "Other…" field |
| `next()` | `void` | Shows the next decision |
| `previous()` | `void` | Shows the previous decision |
| `peek(index: number \| null)` | `void` | Shows the note of the n-th flagged part – null hides it |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-decision-tree-link-pick` | `light-dark(rgba(0, 96, 226, 0.42), rgba(91, 154, 255, 0.5))` | standard, clean |
| `--tc-decision-tree-link-pick-hot` | `light-dark(rgba(0, 96, 226, 0.6), rgba(112, 170, 255, 0.7))` | standard, clean |
| `--tc-decision-tree-option-shadow-picked` | `0 0 0 0.5px light-dark(rgba(0, 96, 226, 0.24), rgba(91, 154, 255, 0.34)), 0 3px 8px -4px light-dark(rgba(0, 96, 226, 0.14), rgba(40, 100, 220, 0.24)), 0 1px 2px 0 light-dark(rgba(0, 60, 140, 0.05), rgba(0, 0, 0, 0.4))` | standard, clean |
| `--tc-decision-tree-option-shadow-picked-hover` | `0 0 0 0.5px light-dark(rgba(0, 96, 226, 0.42), rgba(112, 170, 255, 0.55)), 0 8px 22px -6px light-dark(rgba(0, 96, 226, 0.34), rgba(60, 130, 255, 0.5)), 0 2px 4px -1px light-dark(rgba(0, 96, 226, 0.16), rgba(60, 130, 255, 0.25))` | standard, clean |
| `--tc-decision-tree-link-hot` | `light-dark(rgba(0, 0, 0, 0.38), rgba(255, 255, 255, 0.36))` | standard, clean |
| `--tc-decision-tree-flag-bg` | `light-dark(rgba(255, 166, 0, 0.16), rgba(255, 170, 40, 0.16))` | standard, clean |
| `--tc-decision-tree-flag-edge` | `light-dark(rgba(214, 130, 0, 0.55), rgba(255, 180, 70, 0.55))` | standard, clean |
| `--tc-decision-tree-flag-hot` | `light-dark(rgba(255, 166, 0, 0.28), rgba(255, 170, 40, 0.28))` | standard, clean |
| `--tc-decision-tree-flag-ink` | `light-dark(#8a4600, #ffcf8a)` | standard, clean |
| `--tc-decision-tree-height` | `400px` | both |
| `--tc-decision-tree-typing` | `1100ms` | both |
| `--tc-decision-tree-step-xs` | `calc(var(--tc-duration-slow) / 8)` | both |
| `--tc-decision-tree-step-sm` | `calc(var(--tc-duration-quick) / 2)` | both |
| `--tc-decision-tree-step` | `calc(var(--tc-duration-slow) / 4)` | both |

#### Design tokens it reads (114)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-decision-tree-risk-bg`, `--tc-decision-tree-risk-fg`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-radius`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-shadow-raised-hover`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-12`, `--tc-space-14`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-border`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `decisions` | `el.decisions = …;` | `<… decisions={…} />` | `<tc-decision-tree :decisions="…">` | `<tc-decision-tree [decisions]="…">` | `<tc-decision-tree {decisions}>` |
| `onChoose` | `el.onChoose = …;` | `<… onChoose={…} />` | `<tc-decision-tree :onChoose="…">` | `<tc-decision-tree [onChoose]="…">` | `<tc-decision-tree {onChoose}>` |

*Also attributes: `decision`, `allow-other`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decision-change` | Yes | `el.addEventListener("tc-decision-change", (e) => …)` | `ref.current.addEventListener("tc-decision-change", …)` | `@tc-decision-change="…"` | `(tc-decision-change)="…($event)"` | `el.addEventListener("tc-decision-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `decision` itself unless a listener calls `preventDefault()` on `tc-decision-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-decision-tree id="decision-tree"></tc-decision-tree>

<script type="module">
  import "@adamstavely/trenchcoat/decision-tree";

  const el = document.querySelector("#decision-tree");
  el.addEventListener("tc-decision-change", (e) => {
    e.preventDefault(); // the element keeps its decision…
    if (allowed(e.detail.decision)) el.decision = e.detail.decision; // …until the app sets it
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
import "@adamstavely/trenchcoat/decision-tree";
import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";

const props = defineProps<{ initial: TcDecisionTree["decision"] }>();
const decision = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDecisionChange = (e: CustomEvent<{ decision: TcDecisionTree["decision"] }>) => {
  e.preventDefault();
  decision.value = e.detail.decision;
};
</script>

<template>
  <tc-decision-tree :decision="decision" @tc-decision-change="onDecisionChange"></tc-decision-tree>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DecisionTree } from "@adamstavely/trenchcoat/angular/decision-tree";
import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";

@Component({
  selector: "app-controlled-decision-tree",
  imports: [DecisionTree],
  template: `<tc-decision-tree [decision]="decision()" (tc-decision-change)="onDecisionChange($event)"></tc-decision-tree>`,
})
export class ControlledDecisionTree {
  readonly initial = input.required<TcDecisionTree["decision"]>();
  readonly decision = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDecisionChange(e: CustomEvent<{ decision: TcDecisionTree["decision"] }>) {
    e.preventDefault();
    this.decision.set(e.detail.decision);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/decision-tree";
  import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";

  let { initial }: { initial: TcDecisionTree["decision"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let decision = $derived(initial);
  let el: TcDecisionTree;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      decision = (e as CustomEvent<{ decision: TcDecisionTree["decision"] }>).detail.decision;
    };
    el.addEventListener("tc-decision-change", on);
    return () => el.removeEventListener("tc-decision-change", on);
  });
</script>

<tc-decision-tree bind:this={el} {decision}></tc-decision-tree>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-decision-tree")` returns a `TcDecisionTree` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";`
- **React / Next.js:** Props: `import type { DecisionTreeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DecisionTree>`. The element class, for refs: `import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDecisionTree["decisions"]` with `import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";`
- **Angular:** The directive types the template: `[decisions]` takes `TcDecisionTree["decisions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDecisionTree } from "@adamstavely/trenchcoat/decision-tree";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `decisions` | `Decision[]` | Everything waiting for a call – decided ones leave on their own, new ids join at the end |
| `decision` | `string` | The id of the decision on show. Controlled when defined – pair it with `onDecisionChange` |
| `defaultDecision` | `string` | The decision shown first when `decision` isn't controlled – defaults to the first one |
| `onDecisionChange` | `(id: string) => void` | Called with the id of the decision on show whenever it changes (paging, or the shown one was decided) |
| `onChoose` | `(decision: Decision, choice: DecisionChoice) => string \| void \| Promise<string \| void>` | A branch was picked or an instruction written – return the agent's short answer to an instruction (or a promise of it). A promise holds the picked path until it settles; a rejection lets go of the pick and says so, to try again |
| `title` | `string` | The heading in the bar – "Decisions" by default |
| `ref` | `React.Ref<DecisionTreeHandle>` | The imperative handle (the root element isn't exposed) |

*Renamed or hidden on the wrapper: `ref`, `decisions`, `decision`, `onChoose`, `heading`*

## Accessibility

### Keyboard

The keys work while focus is anywhere in the tree, except in the instruction field.

| Key | What it does |
|---|---|
| 1 – 4 | Picks that branch; the number after the last option opens “Other…”. After a branch with a follow-up, picks the follow-up's option |
| → / J | Shows the next decision |
| ← / K | Shows the previous decision |
| F | Shows the note of the next flagged part; after the last, hides it |
| Escape | Hides the note; with none open, closes “Other…” |
| Enter | In the instruction field: sends it |
| Shift+Enter | In the instruction field: a new line |
| Escape in the field | Closes it and returns focus to “Other…” |

Paging is locked while a pick is on its way.

### Screen readers

The question is a heading; the branches are a group named “How should the agent go on?”, each a button with its
number in `aria-keyshortcuts` and described by its consequences (or its follow-up question). A flagged part carries
its note in the text: “(the agent is unsure: … Source: …)”. A follow-up's options are a group named by its question.
The pager reads “Decision 1 of 3”, with Previous decision and Next decision buttons. A polite live region says what
happened: “Cancel the newer ones – picked. Billing agent goes ahead.”, “Wait for 02:00 UTC – picked. Next: …”,
“Sent to the billing agent: …” and then the agent's answer, and on failure “Couldn't pass “…” to the billing agent
– pick again.” The instruction field is named “Your own instruction for the billing agent – Enter sends, Shift+Enter
for a new line”, and is marked invalid with “Couldn't send – press Enter to try again.” when sending failed.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 56.9 KB | 14.6 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **65.5 KB** | **17.3 KB** |
| With Lit – the first component on a page | 88.8 KB | 24.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.4 ms** | the gallery demo's data, 92 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of decisions replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.3 ms | decisions: first render, 97 nodes; update 0.3 ms |
| 1,000 items | 4.9 ms | decisions: first render, 97 nodes; update 0.7 ms |

1,000 items of decisions: 4.9 ms, 97 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document keydown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Ask the question as the agent would, in one sentence that ends in a question mark.
- Label options with a verb and an object, a few words: “Cancel the newer ones”, “Run it now”.
- Write consequences as outcomes with numbers: “Refunds $147 across 3 accounts”, “Writes paused about 40 seconds”.
- Flag only what the agent can't confirm, and say why in the note – with a source people can check.
- Name the agent by its job: “Billing agent”, not a model or an id. It appears in sentences, lower-cased.

## Do and don't

### Do

- Mark one option as the agent's `pick`, so people see what happens if they agree.
- Set `risk` to `high` or `medium` when the call is hard to undo; low risk shows no tag.
- Return the agent's short reply from `onChoose` for an instruction – or a promise of it – so people see it was understood.

### Don't

- Don't offer more than four options or more than one follow-up level – the tree stops being readable.
- Don't repeat the label in the consequences; say what changes.
- Don't hide the consequences of the agent's pick – it needs them most.

## Related

- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
