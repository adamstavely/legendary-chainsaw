<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Approval Gates

**Agents** · New

The approval requests of one agent run as a stack of cards – the one to decide now on top with who asks, the diff or arguments and the steps it holds; approve, reject or ask for changes with a note, and it drops into the decided list while the next rises

- **Element:** `<tc-approval-gates>`
- **Size:** 23.6 KB gzip · 89.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/approval-gates";` |
| React / Next.js | `import { ApprovalGates } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/approval-gates";` · tags starting with tc- are custom elements |
| Angular | `import { ApprovalGates } from "@adamstavely/trenchcoat/angular/approval-gates";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/approval-gates";` |

## Example

The live example is in the gallery at `#/approval-gates`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The approval requests of one agent run, as a stack of cards. The request to decide now is on top: who asks, what
kind of request it is, what exactly would change – a file change as a diff, or a call's arguments – and the steps of
the run it holds back. The other open requests peek out behind it, and a line says which one you're on (“1 of 2”).

Approve, Reject or Ask for changes – with a note – and the card drops into the Decided list below while the next one
rises. A strip above it says where things stand in words: “Waiting on you 2 · Decided 1/3 · Paused – 3 steps wait on
2 gates”. Decided rows fold open to show what was decided, the note, and the diff or arguments.

### When to use

- An agent run pauses at several points that need a person, and some of them hold up the steps after them.
- People should decide one request at a time, in order, with the next one waiting in view.
- Requests whose exact change matters – a file edit, a command's arguments, a message's recipients.

### When not to use

- A single request on its own, in a chat or a timeline – use [Approval Card](approval-card.md).
- Quick yes/no questions from several agents, not tied to one run – use [Decision Inbox](decision-inbox.md).
- Setting up which actions need a person in the first place – use [Gate Config](gate-config.md).
- A risk-sorted queue across many runs, with flagged spans to review – use [Review Center](review-center.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Strip** `.ui-apg__stats` – waiting, decided out of all, and what the run is doing, in words
3. **Stack** `.ui-apg__stack` – the top request, with the open ones behind it `.ui-apg__peek`
4. **Request** `.ui-apg__gate` – who asks and when, the title, the reason, the diff or arguments, “Full context”, and
5. **Note** `.ui-apg__note` – what should change, before Ask for changes is sent
6. **Buttons** `.ui-apg__actions` – Ask for changes, Reject and Approve
7. **Decided** `.ui-apg__decided` – a row per decision `.ui-apg__row`, folding open to `.ui-apg__detail`

## Looks

Standard puts the header on a gray tray above a white card holding the strip, the stack and the decided list. Clean
is one white card with the header as its first row. In both, the top request is a raised card with a hairline, and
up to two cards peek out under it.

Component tokens on `[data-ui="apg"]`: `--tc-approval-gates-peek` (6px) – how far each card behind peeks out;
`--tc-approval-gates-mark` (22px) – the round mark of a decided row; `--tc-approval-gates-spin` – the spinner's
turn. The diff and the arguments use tc-approval-card's styles and its `--tc-approval-card-code-max`.

## Usage

### HTML

```html
<tc-approval-gates id="gates" run="Publish the 2026 field-survey report"></tc-approval-gates>

<script type="module">
  import "@adamstavely/trenchcoat/approval-gates";
  import "@adamstavely/trenchcoat/tokens.css";

  const gates = document.querySelector("#gates");
  gates.now = Date.UTC(2026, 10, 6, 14, 10);
  gates.gates = [
    {
      id: "embargo",
      title: "Move the embargo forward a week",
      agent: "Writer",
      kind: "File change",
      status: "open",
      holds: ["Build the report site", "Publish to the archive"],
      diff: {
        path: "survey-2026/report.config.ts",
        lines: [
          { kind: "remove", text: '  embargo: "2026-11-20T09:00Z",' },
          { kind: "add", text: '  embargo: "2026-11-13T09:00Z",' },
        ],
      },
    },
    { id: "migration", title: "Run the station ID migration", agent: "Analyst", kind: "Command", status: "open", args: { rows: 48210, dry_run: false } },
  ];
  gates.onDecide = ({ gate, decision, note }) => fetch(`/api/gates/${gate.id}`, { method: "POST", body: JSON.stringify({ decision, note }) });
  gates.addEventListener("tc-gates-change", (e) => console.log(e.detail.decision, e.detail.gate.title));
</script>
```

### React / Next.js

```tsx
import { ApprovalGates, type ApprovalGate } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";
import { useState } from "react";

export function RunApprovals({ initial, send }: { initial: ApprovalGate[]; send: (id: string, decision: string, note: string) => Promise<void> }) {
  const [gates, setGates] = useState(initial);
  return (
    <ApprovalGates
      run="Publish the 2026 field-survey report"
      gates={gates}
      onGatesChange={(next) => setGates(next)}
      onDecide={({ gate, decision, note }) => send(gate.id, decision, note)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/approval-gates";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";

defineProps<{ gates: TcApprovalGates["gates"]; labels: TcApprovalGates["labels"] }>();
const onDecide = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-approval-gates :gates="gates" :labels="labels" @tc-decide="onDecide"></tc-approval-gates>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ApprovalGates } from "@adamstavely/trenchcoat/angular/approval-gates";
import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";

@Component({
  selector: "app-approval-gates-example",
  imports: [ApprovalGates],
  template: `<tc-approval-gates [gates]="gates()" [labels]="labels()" (tc-decide)="onDecide($event)"></tc-approval-gates>`,
})
export class ApprovalGatesExample {
  readonly gates = input.required<TcApprovalGates["gates"]>();
  readonly labels = input.required<TcApprovalGates["labels"]>();
  onDecide(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/approval-gates";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";

  let { gates, labels }: { gates: TcApprovalGates["gates"]; labels: TcApprovalGates["labels"] } = $props();
  let el: TcApprovalGates;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decide", on);
    return () => el.removeEventListener("tc-decide", on);
  });
</script>

<tc-approval-gates bind:this={el} {gates} {labels}></tc-approval-gates>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Approvals"` | The heading |
| `run` | `run` | `string` | `""` | The run the requests come from, shown under the heading |
| `gates` | – | `ApprovalGate[]` | `[]` | The requests, in the order they should be decided |
| `onDecide` | – | `((decision: GateDecide) => void \| Promise<unknown>) \| undefined` | `undefined` | Called with each decision before it's applied. Return a promise to show a spinner until it settles; a rejection keeps the request open and says so |
| `expanded` | `expanded` | `string \| null` | `null` | The decided row folded open, by gate id |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for "6m ago", in epoch ms – unset shows the time of day instead |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for the time of day |
| `labels` | – | `Partial<ApprovalGatesLabels>` | `{}` | Words the page can rename, merged over defaultApprovalGatesLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decide` | – | Yes | Approve, Reject or Send (Ask for changes) was pressed ({ gate, decision, note }: GateDecide); cancelable – prevented, nothing is decided and onDecide isn't called |
| `tc-gates-change` | – | Yes | A decision went through ({ gates, gate, decision, note }: GatesChange); cancelable – prevented, `gates` stays as it was (controlled use) |
| `tc-expanded-change` | – | Yes | A decided row was folded open or shut ({ expanded }: GatesExpandedChange); cancelable – prevented, `expanded` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-approval-gates-peek` | `6px` | both |
| `--tc-approval-gates-spin` | `800ms` | both |
| `--tc-approval-gates-mark` | `22px` | both |
| `--tc-apg-peeks` | `0` | not set – this fallback applies |

#### Design tokens it reads (93)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `gates` | `el.gates = …;` | `<… gates={…} />` | `<tc-approval-gates :gates="…">` | `<tc-approval-gates [gates]="…">` | `<tc-approval-gates {gates}>` |
| `onDecide` | `el.onDecide = …;` | `<… onDecide={…} />` | `<tc-approval-gates :onDecide="…">` | `<tc-approval-gates [onDecide]="…">` | `<tc-approval-gates {onDecide}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-approval-gates :labels="…">` | `<tc-approval-gates [labels]="…">` | `<tc-approval-gates {labels}>` |

*Also attributes: `heading`, `run`, `expanded`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decide` | Yes | `el.addEventListener("tc-decide", (e) => …)` | `ref.current.addEventListener("tc-decide", …)` | `@tc-decide="…"` | `(tc-decide)="…($event)"` | `el.addEventListener("tc-decide", …)` |
| `tc-gates-change` | Yes | `el.addEventListener("tc-gates-change", (e) => …)` | `onGatesChange={…}` | `@tc-gates-change="…"` | `(tc-gates-change)="…($event)"` | `el.addEventListener("tc-gates-change", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `gates` and `expanded` itself unless a listener calls `preventDefault()` on `tc-gates-change` or `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-approval-gates id="approval-gates"></tc-approval-gates>

<script type="module">
  import "@adamstavely/trenchcoat/approval-gates";

  const el = document.querySelector("#approval-gates");
  el.addEventListener("tc-gates-change", (e) => {
    e.preventDefault(); // the element keeps its gates…
    if (allowed(e.detail.gates)) el.gates = e.detail.gates; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ApprovalGates } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ApprovalGates>;
type Props = Omit<Own, "gates" | "onGatesChange"> & { initial: NonNullable<Own["gates"]> };

// Controlled: passing gates makes the wrapper prevent the element's own change; the app sets it
export function ControlledApprovalGates({ initial, ...props }: Props) {
  const [gates, setGates] = useState<Own["gates"]>(initial);
  return <ApprovalGates {...props} gates={gates} onGatesChange={(next) => setGates(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/approval-gates";
import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";

const props = defineProps<{ initial: TcApprovalGates["gates"] }>();
const gates = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onGatesChange = (e: CustomEvent<{ gates: TcApprovalGates["gates"] }>) => {
  e.preventDefault();
  gates.value = e.detail.gates;
};
</script>

<template>
  <tc-approval-gates :gates="gates" @tc-gates-change="onGatesChange"></tc-approval-gates>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ApprovalGates } from "@adamstavely/trenchcoat/angular/approval-gates";
import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";

@Component({
  selector: "app-controlled-approval-gates",
  imports: [ApprovalGates],
  template: `<tc-approval-gates [gates]="gates()" (tc-gates-change)="onGatesChange($event)"></tc-approval-gates>`,
})
export class ControlledApprovalGates {
  readonly initial = input.required<TcApprovalGates["gates"]>();
  readonly gates = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onGatesChange(e: CustomEvent<{ gates: TcApprovalGates["gates"] }>) {
    e.preventDefault();
    this.gates.set(e.detail.gates);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/approval-gates";
  import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";

  let { initial }: { initial: TcApprovalGates["gates"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let gates = $derived(initial);
  let el: TcApprovalGates;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      gates = (e as CustomEvent<{ gates: TcApprovalGates["gates"] }>).detail.gates;
    };
    el.addEventListener("tc-gates-change", on);
    return () => el.removeEventListener("tc-gates-change", on);
  });
</script>

<tc-approval-gates bind:this={el} {gates}></tc-approval-gates>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-approval-gates")` returns a `TcApprovalGates` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";`
- **React / Next.js:** Props: `import type { ApprovalGatesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ApprovalGates>`. The element class, for refs: `import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcApprovalGates["gates"]` with `import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";`
- **Angular:** The directive types the template: `[gates]` takes `TcApprovalGates["gates"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcApprovalGates } from "@adamstavely/trenchcoat/approval-gates";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – "Approvals" by default |
| `gates` | `ApprovalGate[]` | The requests, in the order they should be decided. Controlled when defined; decisions come back through `onGatesChange` |
| `defaultGates` | `ApprovalGate[]` | The requests at first, when `gates` isn't controlled |
| `onGatesChange` | `(gates: ApprovalGate[], change: { gate: ApprovalGate; decision: GatesChange["decision"]; note: string }) => void` | Called with every request after a decision went through, and the decision itself |
| `expanded` | `string \| null` | The decided row folded open, by gate id. Controlled when defined |
| `defaultExpanded` | `string \| null` | The row folded open at first, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string \| null) => void` | Called when a decided row is folded open (its id) or shut (null) |

*Renamed or hidden on the wrapper: `heading`, `gates`, `expanded`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the top request's controls – the diff or arguments, Full context, Ask for changes, Reject, Approve – then to the Decided list |
| Enter / Space | On a button, presses it; on a decided row, folds it open or shut |
| ⌘ Enter / Ctrl Enter | In the note, sends Ask for changes |
| Escape | In the note, closes it and returns focus to Ask for changes |
| ↓ / ↑ | In the Decided list, moves to the next or previous row |
| Home / End | In the Decided list, moves to the first or last row |

After a decision, focus moves to the next request's card – not onto its Approve, so a second Enter can't approve it
by accident – or to the decided row when nothing else waits.

### Screen readers

The card is a `group` named by the heading. The top request is a `group` named by its title and described by its
reason; its diff and arguments are regions named “Changes: <path>” and “Arguments”, and changed lines start with
“Added:” or “Removed:”. Full context and the decided rows are disclosure buttons (`aria-expanded`, `aria-controls`).
The Decided list is a list named “Decided”. A status region says each decision and what comes next: “Approved: Move
the embargo forward a week. Next: Run the station ID migration.” While a decision is on its way the request is
`aria-busy`; if it fails, an alert says so and the request stays open.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | approval-card, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, approval-card | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | approval-card, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, approval-card, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, approval-card | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, approval-card, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | approval-card | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, approval-card, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | approval-card | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.2 KB | 9.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [approval-card](approval-card.md) · Element it renders | 47.5 KB | – |
| **Added to a page that already has Lit** | **89.7 KB** | **23.6 KB** |
| With Lit – the first component on a page | 111.9 KB | 30.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 126 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of gates replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.6 ms | gates: first render, 510 nodes; update 0.7 ms |
| 1,000 items | 25 ms | gates: first render, 4,110 nodes; update 3.0 ms |

1,000 items of gates: 25 ms, 4,110 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared` (approval-card), `setTimeout` (approval-card).
- 4 infinite CSS animations.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `ResizeObserver` (approval-card), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange` (approval-card).
- Reads the clock: `Date.now()` (approval-card).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each title as the action in plain words – “Email 1,284 newsletter subscribers”, not the tool's name.
- Use `reason` for the consequence: who or what it changes, and when.
- List in `holds` the run's steps that wait on the request, by their names in the run.
- Put what led up to it in `context.before` and the files or systems it changes in `context.touches`.
- Mark `blocking` only on requests that stop the whole run, so the word keeps its weight.
- Order `gates` the way they should be decided; the first open one is on top.

## Do and don't

### Do

- Return a promise from `onDecide` – the button shows a spinner, and on failure the request stays open with an error.
- Pass `now` when the page has a clock, so times read “6m ago”; without it they show the time of day.
- Keep the decided gates in `gates`, so people can see what they already let through.

### Don't

- Don't use it for one request – the strip and the stack only make sense with several.
- Don't put more than one file in a request's diff – split it into requests, or show the change elsewhere.
- Don't reorder `gates` while someone is deciding – the request under their pointer would change.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Decision Inbox](decision-inbox.md) – Open decisions with two quick answers each – answered ones confirm and fold away
- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [Review Center](review-center.md) – A focused workspace for what your agents want to do – the queue sorted by risk, one item at a time with the shaky spans marked, Approve, Edit, Reject and Skip on single keys, a stamp as each one leaves and the next one rising in

## Changelog

- **Approval Gates** (`tc-approval-gates`): an agent run's approval requests as a stack – the one to decide on top with its diff or arguments and the steps it holds; decisions (`tc-decide`) drop it into the Decided list.
