<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Decision Card

**Agents** · New

One question an agent needs answered before it carries on, docked above the composer – how long it has waited, numbered options with one recommended (focused, never picked), 1–9 to pick, Something else, or Approve and Decline with a reason, a queue to step through, and a receipt with Undo

- **Element:** `<tc-decision-card>`
- **Size:** 10.7 KB gzip · 37.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/decision-card";` |
| React / Next.js | `import { DecisionCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/decision-card";` · tags starting with tc- are custom elements |
| Angular | `import { DecisionCard } from "@adamstavely/trenchcoat/angular/decision-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/decision-card";` |

## Example

The live example is in the gallery at `#/decision-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One question an agent can't answer alone, asked in the middle of a run: a card docked just above the chat composer,
naming the agent and how long it has been waiting. The question and a line of context come first, then numbered
options – one of them may be Recommended, which takes the first focus but is never picked for you – or, for a yes / no
step, Approve and Decline. Once sent it folds into a one-line receipt, "You chose: Keep the 2024 file", with Undo for a
few seconds, and the agent carries on.

It sits between its neighbours. Clarifying Questions asks two or three things before a run starts and sends them as
one reply; Approval Card reviews one proposed action with its details and policy; Decision Inbox lists many decisions
to work through. Decision Card is the single question that blocks a run right now, where the person is already
typing.

### When to use

- An agent is stopped mid-run on a choice it shouldn't make alone – which record to keep, which source to trust.
- The likely answers can be named, and the agent has a view on which is best.
- Several agents are waiting at once: pass `queue` and `position` to step through them one at a time.

### When not to use

- Questions before the work starts, answered together – use [Clarifying Questions](clarifying-questions.md).
- An action that needs its details, diff or policy reviewed before it runs – use [Approval Card](approval-card.md).
- A list of everything waiting across agents, worked through in one place – use [Decision Inbox](decision-inbox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Question** `.ui-dcd__question` – what the agent needs to know, with the context `.ui-dcd__context` under it
3. **Options** `.ui-dcd__choices` – numbered rows `.ui-dcd__choice`, the recommended one with a chip `.ui-dcd__chip`, each with an optional detail line
4. **Something else** `.ui-dcd__input` – a short field that opens when its option is picked (`allow-other`)
5. **Buttons** `.ui-dcd__foot` – Later and Send, or Later, Decline and Approve; Decline swaps in a reason field and Back
6. **Receipt** `.ui-dcd__receipt` – after sending: a check, what was decided, the agent, and Undo for `undo-ms`

## Looks

Standard puts the header on the gray tray and the question and options on a white card below it, with the buttons on
the tray. Options are outlined rows. Clean is one white card with the header as its first row: options are flat gray
rows and the buttons sit in the card's last row. In both, the picked option is tinted with the accent and ringed, and
its number fills.

The page can set `--tc-dcd-num`, the size of the option numbers.

## Usage

### HTML

```html
<tc-decision-card id="ask" agent="Records agent" question="Which vendor file should I keep?" allow-other></tc-decision-card>

<script type="module">
  import "@adamstavely/trenchcoat/decision-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.context = "Both files share a tax ID but list different bank details.";
  ask.since = Date.now() - 4 * 60_000;
  ask.options = [
    { id: "newer", label: "Keep V-3184, archive V-2210", detail: "The 2024 file has the signed bank letter", recommended: true },
    { id: "older", label: "Keep V-2210, archive V-3184" },
  ];
  ask.addEventListener("tc-decision", (e) => agent.answer(e.detail));
</script>
```

### React / Next.js

```tsx
import { DecisionCard, type DecisionCardMade, type DecisionCardOption } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AgentQuestion({ options, answer }: { options: DecisionCardOption[]; answer: (decision: DecisionCardMade) => void }) {
  return (
    <DecisionCard
      agent="Records agent"
      question="Which vendor file should I keep?"
      context="Both files share a tax ID but list different bank details."
      options={options}
      allowOther
      onDecision={(decision) => answer(decision)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/decision-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";

defineProps<{ options: TcDecisionCard["options"]; decision: TcDecisionCard["decision"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-decision-card :options="options" :decision="decision" @tc-value-change="onValueChange"></tc-decision-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DecisionCard } from "@adamstavely/trenchcoat/angular/decision-card";
import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";

@Component({
  selector: "app-decision-card-example",
  imports: [DecisionCard],
  template: `<tc-decision-card [options]="options()" [decision]="decision()" (tc-value-change)="onValueChange($event)"></tc-decision-card>`,
})
export class DecisionCardExample {
  readonly options = input.required<TcDecisionCard["options"]>();
  readonly decision = input.required<TcDecisionCard["decision"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/decision-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";

  let { options, decision }: { options: TcDecisionCard["options"]; decision: TcDecisionCard["decision"] } = $props();
  let el: TcDecisionCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-decision-card bind:this={el} {options} {decision}></tc-decision-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agent` | `agent` | `string` | `"Agent"` | Who is asking: the agent's name |
| `avatar` | `avatar` | `string \| undefined` | `undefined` | The agent's picture (an image URL); unset shows its initials |
| `question` | `question` | `string` | `""` | The question, as the agent asks it |
| `context` | `context` | `string \| undefined` | `undefined` | A line or two of context: what the agent found, why it can't go on alone |
| `kind` | `kind` | `DecisionCardKind` | `"choose"` | "choose" (default): numbered options; "approve": Approve and Decline |
| `options` | – | `DecisionCardOption[]` | `[]` | The options for kind="choose", in the agent's order |
| `allowOther` | `allow-other` | `boolean` | `false` | Offers "Something else…" with a short field |
| `value` | `value` | `string \| null` | `null` | The picked option's id ("other" for Something else), or null |
| `otherText` | `other-text` | `string` | `""` | The text of Something else |
| `since` | `since` | `number \| undefined` | `undefined` | When the agent asked, in epoch ms – the header says how long it has waited |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, in epoch ms; unset reads the clock, once a minute |
| `queue` | `queue` | `number` | `1` | How many decisions wait in all; above 1 the header shows "1 of 3" with previous / next |
| `position` | `position` | `number` | `0` | Which of the waiting decisions this is, from 0 |
| `sent` | `sent` | `boolean` | `false` | Sent: the card shows its receipt |
| `decision` | – | `DecisionCardMade \| null` | `null` | What was sent – the receipt reads it |
| `undoMs` | `undo-ms` | `number` | `6000` | How long Undo stays on the receipt, in ms (0 hides it) |
| `labels` | – | `Partial<DecisionCardLabels>` | `{}` | Words the page can change, merged over defaultDecisionCardLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An option was picked ({ value }: DecisionCardValueChange); cancelable – prevented, `value` stays as it was |
| `tc-decision` | – | Yes | Send, Approve or Decline ({ choice, other?, reason? }: DecisionCardMade); cancelable – unless prevented the card folds into its receipt |
| `tc-defer` | – | No | Later or Escape: the person will decide later ({}) |
| `tc-undo` | – | Yes | Undo on the receipt ({ decision }: DecisionCardUndo); cancelable – unless prevented the card opens again |
| `tc-position-change` | – | Yes | Previous or next decision in the queue ({ position }: DecisionCardPositionChange); cancelable – prevented, `position` stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dcd-num` | `20px` | standard, clean |

#### Design tokens it reads (99)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `DECISION_CARD_OTHER: string` | The value of the "Something else…" option, and the choice it sends |
| `waitedFor(ms: number): string` | How long it has waited: just now · 4 min · 2 h 10 min · 3 d |

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-decision-card :options="…">` | `<tc-decision-card [options]="…">` | `<tc-decision-card {options}>` |
| `decision` | `el.decision = …;` | `<… decision={…} />` | `<tc-decision-card :decision="…">` | `<tc-decision-card [decision]="…">` | `<tc-decision-card {decision}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-decision-card :labels="…">` | `<tc-decision-card [labels]="…">` | `<tc-decision-card {labels}>` |

*Also attributes: `agent`, `avatar`, `question`, `context`, `kind`, `allow-other`, `value`, `other-text` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-decision` | Yes | `el.addEventListener("tc-decision", (e) => …)` | `onDecision={…}` | `@tc-decision="…"` | `(tc-decision)="…($event)"` | `el.addEventListener("tc-decision", …)` |
| `tc-defer` | No | `el.addEventListener("tc-defer", (e) => …)` | `onDefer={…}` | `@tc-defer="…"` | `(tc-defer)="…($event)"` | `el.addEventListener("tc-defer", …)` |
| `tc-undo` | Yes | `el.addEventListener("tc-undo", (e) => …)` | `onUndo={…}` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |
| `tc-position-change` | Yes | `el.addEventListener("tc-position-change", (e) => …)` | `onPositionChange={…}` | `@tc-position-change="…"` | `(tc-position-change)="…($event)"` | `el.addEventListener("tc-position-change", …)` |

### Controlled

The element changes `value` and `position` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-position-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-decision-card id="decision-card"></tc-decision-card>

<script type="module">
  import "@adamstavely/trenchcoat/decision-card";

  const el = document.querySelector("#decision-card");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { DecisionCard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DecisionCard>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledDecisionCard({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <DecisionCard {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/decision-card";
import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";

const props = defineProps<{ initial: TcDecisionCard["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcDecisionCard["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-decision-card :value="value" @tc-value-change="onValueChange"></tc-decision-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DecisionCard } from "@adamstavely/trenchcoat/angular/decision-card";
import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";

@Component({
  selector: "app-controlled-decision-card",
  imports: [DecisionCard],
  template: `<tc-decision-card [value]="value()" (tc-value-change)="onValueChange($event)"></tc-decision-card>`,
})
export class ControlledDecisionCard {
  readonly initial = input.required<TcDecisionCard["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcDecisionCard["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/decision-card";
  import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";

  let { initial }: { initial: TcDecisionCard["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcDecisionCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcDecisionCard["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-decision-card bind:this={el} {value}></tc-decision-card>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-decision-card :value="value" @tc-value-change="value = $event.detail.value"></tc-decision-card>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-decision-card [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-decision-card>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-decision-card bind:this={el} {value}></tc-decision-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-decision-card")` returns a `TcDecisionCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";`
- **React / Next.js:** Props: `import type { DecisionCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DecisionCard>`. The element class, for refs: `import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDecisionCard["options"]` with `import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";`
- **Angular:** The directive types the template: `[options]` takes `TcDecisionCard["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDecisionCard } from "@adamstavely/trenchcoat/decision-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string \| null` | The picked option's id ("other" for Something else). Controlled when defined – pass back what onValueChange reports |
| `defaultValue` | `string \| null` | The starting pick when uncontrolled |
| `onValueChange` | `(value: string \| null) => void` | An option was picked |
| `position` | `number` | Which of the waiting decisions shows, from 0. Controlled when defined |
| `defaultPosition` | `number` | The starting position when uncontrolled |
| `onPositionChange` | `(position: number) => void` | Previous or next in the queue |
| `sent` | `boolean` | Whether it shows its receipt. Controlled when defined – set it after onDecision |
| `defaultSent` | `boolean` | Whether it starts sent when uncontrolled |
| `onDecision` | `(decision: DecisionCardMade, event: Event) => void` | Send, Approve or Decline. Call event.preventDefault() to keep the card open |
| `onDefer` | `() => void` | Later or Escape |
| `onUndo` | `(decision: DecisionCardMade, event: Event) => void` | Undo on the receipt. Call event.preventDefault() to keep the receipt |

*Renamed or hidden on the wrapper: `other`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between the options (one stop – the picked one, else the recommended one), the field and the buttons |
| ↑ ↓ ← → | Moves to the next or previous option and picks it |
| Home / End | The first or last option |
| 1 – 9 | Picks that option from anywhere in the card, outside a text field |
| ⌘ / Ctrl + Enter | Sends – or approves; while a decline reason is open, declines |
| Escape | Decides later (`tc-defer`); while a decline reason is open, steps back |

### Screen readers

The card is a `section` named by the agent and the question. The options are a `radiogroup` of `radio` buttons named
by the question and described by the keys; an option reads as "Keep the 2024 file, Recommended, It has the signed
bank letter". Sending with nothing picked says "Pick an option first" in a status region and moves focus to the
options. After sending, the status region reads the receipt ("You chose: Keep the 2024 file"), and focus moves to the
receipt, a `group` named by it. Previous and next in the queue are named "Previous decision" and "Next decision", and
"1 of 3" is announced politely as it changes.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.3 KB | 8.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **37.1 KB** | **10.7 KB** |
| With Lit – the first component on a page | 59.4 KB | 18.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.2 ms** | the gallery demo's data, 61 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of options replaced |
| First on the page | 30 ms | default properties; includes adding its CSS to the document |
| 100 items | 12 ms | options: first render, 806 nodes; update 0.7 ms |
| 1,000 items | 42 ms | options: first render, 7,706 nodes; update 3.4 ms |

1,000 items of options: 42 ms, 7,706 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Ask one question, in the agent's words: "Which copy should I keep?", not "Duplicate resolution".
- Put what the agent found in `context` – the fact that makes the choice hard – in a sentence or two.
- Write options as actions: "Keep V-3184, archive V-2210". Put the cost or consequence in `detail`.
- Recommend at most one option, and only when the agent has a reason – say the reason in its `detail`.
- Keep to two to five options; offer `allow-other` when none may fit.

## Do and don't

### Do

- Act on the receipt's Undo: hold off on irreversible work for `undo-ms`.
- Show the next waiting decision once one is sent, when `queue` is above 1.
- Read the decision back in the agent's next message, so people see it was heard.

### Don't

- Don't pre-pick the recommended option – people should choose it on purpose.
- Don't ask what the agent could look up itself.
- Don't use Decision Card for questions before a run – ask them together with `clarifying-questions`.

## Related

- [Clarifying Questions](clarifying-questions.md) – The agent asks before it starts – two or three quick questions with choices or a short answer, sent back as one reply
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
