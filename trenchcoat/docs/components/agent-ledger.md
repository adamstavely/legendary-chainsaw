<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Ledger

**Agents**

Everything an agent changed in your systems, each change with an undo – before and after per row, and pointing at Undo shows what builds on it: what would be undone too, and what can't be taken back

- **Element:** `<tc-agent-ledger>`
- **Size:** 10.7 KB gzip · 40.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-ledger";` |
| React / Next.js | `import { AgentLedger } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-ledger";` · tags starting with tc- are custom elements |
| Angular | `import { AgentLedger } from "@adamstavely/trenchcoat/angular/agent-ledger";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-ledger";` |

## Example

The live example is in the gallery at `#/agent-ledger`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Everything an agent changed in your systems, newest first, each change with an Undo. Every row says what was done
and to what, in which system, and shows the value before and after (“$29 → $34”). Pointing at Undo lights up
everything that builds on that change – “Also undone” where it can be reversed, “Can't undo” where it can't, like a
sent email or a payout – so people see the full reach of an undo before they press it. Undone rows are struck
through, their dependents a beat after each other, and Redo brings them back.

### When to use

- After or during an agent run that writes to other systems – prices, records, pages, messages.
- Wherever people need to trust an agent with real changes because they can take them back.
- When changes depend on each other and undoing one should take its dependents along.

### When not to use

- Restoring a whole run to an earlier step and trying again – use [Run Checkpoints](run-checkpoints.md).
- Asking before the agent acts, rather than undoing after – use [Approval Card](approval-card.md).
- Showing how metrics moved since last time – use [Change Summary](change-summary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Row** `.ui-alg__row` – one change; new ones slide in at the top as the agent works
3. **Logo** `.ui-alg__icon` – the system's logo, or its first letter
4. **Change** `.ui-alg__change` – before → after, or one line of detail
5. **Undo** `.ui-alg__act` – appears in place of the time on hover or focus; Redo on an undone row

## Looks

Standard sets a soft gray tray with the agent and the count above a white card of rows, and Undo / Redo as raised
pills. Clean drops the tray for one quiet white card with the header as its first row: smaller logo tiles, medium weights, 0.5 px
dividers, and Undo / Redo as flat text buttons. Both preview the same chain and use the same keys.

## Usage

### HTML

```html
<tc-agent-ledger id="ledger" agent="Launch agent"></tc-agent-ledger>

<script type="module">
  import "@adamstavely/trenchcoat/agent-ledger";
  import "@adamstavely/trenchcoat/tokens.css";

  const ledger = document.querySelector("#ledger");
  const now = Date.now();
  ledger.entries = [
    { id: "price", action: "Changed price", target: "Pro plan", system: "Stripe", at: now - 120000, change: ["$29", "$34"] },
    { id: "page", action: "Updated pricing page", system: "Webflow", at: now - 60000, change: ["$29", "$34"], dependsOn: ["price"] },
    { id: "mail", action: "Sent email", target: "Price update", system: "Mailchimp", at: now - 30000, reversible: false, dependsOn: ["price"] },
  ];
  ledger.onUndo = (ids) => fetch("/api/undo", { method: "POST", body: JSON.stringify(ids) });
  ledger.addEventListener("tc-undo", (e) => console.log("Undone", e.detail.ids));
</script>
```

### React / Next.js

```tsx
import { AgentLedger, type LedgerEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function LaunchLedger({ entries }: { entries: LedgerEntry[] }) {
  return (
    <AgentLedger
      title="Ledger"
      agent="Launch agent"
      entries={entries}
      onUndo={(ids) => fetch("/api/undo", { method: "POST", body: JSON.stringify(ids) })}
      onRedo={(ids) => fetch("/api/redo", { method: "POST", body: JSON.stringify(ids) })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-ledger";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";

defineProps<{ entries: TcAgentLedger["entries"]; undone: TcAgentLedger["undone"] }>();
const onUndoneChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-ledger :entries="entries" :undone="undone" @tc-undone-change="onUndoneChange"></tc-agent-ledger>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentLedger } from "@adamstavely/trenchcoat/angular/agent-ledger";
import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";

@Component({
  selector: "app-agent-ledger-example",
  imports: [AgentLedger],
  template: `<tc-agent-ledger [entries]="entries()" [undone]="undone()" (tc-undone-change)="onUndoneChange($event)"></tc-agent-ledger>`,
})
export class AgentLedgerExample {
  readonly entries = input.required<TcAgentLedger["entries"]>();
  readonly undone = input.required<TcAgentLedger["undone"]>();
  onUndoneChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-ledger";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";

  let { entries, undone }: { entries: TcAgentLedger["entries"]; undone: TcAgentLedger["undone"] } = $props();
  let el: TcAgentLedger;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-undone-change", on);
    return () => el.removeEventListener("tc-undone-change", on);
  });
</script>

<tc-agent-ledger bind:this={el} {entries} {undone}></tc-agent-ledger>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Ledger"` | The heading, and the list's name |
| `agent` | `agent` | `string` | `""` | Who made the changes – e.g. "Launch agent" |
| `entries` | – | `LedgerEntry[]` | `[]` | The changes the agent made, in any order – the ledger lists them newest first |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for "2m ago", in epoch ms – unset, the element keeps its own clock |
| `undone` | – | `string[]` | `[]` | Ids of undone changes |
| `pointAt` | `point-at` | `string \| null` | `null` | Lights up a change and what builds on it, as if its Undo were pointed at – e.g. for a walkthrough |
| `onUndo` | – | `LedgerAction \| undefined` | `undefined` | Called with the ids an Undo takes back; a returned promise holds the rows until it settles, a rejection reverts them |
| `onRedo` | – | `LedgerAction \| undefined` | `undefined` | Called with the ids a Redo brings back; a returned promise holds the rows until it settles, a rejection reverts them |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-undone-change` | – | Yes | The undone ids changed (`{ undone: string[] }`, the whole new list); cancelable – prevent it to keep `undone` as it is (controlled use) |
| `tc-undo` | – | No | A change was undone (`{ ids: string[] }`: the change and its reversible dependents) |
| `tc-redo` | – | No | A change was redone (`{ ids: string[] }`: the change, what went with it and the undone changes it builds on) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-ledger-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-agent-ledger-panel-bg` | `var(--tc-surface-on-tray)` | standard |
| `--tc-agent-ledger-card-bg` | `var(--tc-surface-control)` | standard, clean |
| `--tc-agent-ledger-also-bg` | `light-dark(rgba(0, 96, 226, 0.045), rgba(91, 154, 255, 0.07))` | standard, clean |
| `--tc-agent-ledger-also-chip-bg` | `light-dark(rgba(0, 96, 226, 0.09), rgba(91, 154, 255, 0.16))` | standard, clean |
| `--tc-agent-ledger-kept-bg` | `light-dark(#ff9c0014, rgba(255, 160, 40, 0.09))` | standard, clean |
| `--tc-agent-ledger-row` | `56px` | standard, clean |

#### Design tokens it reads (70)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `entries` | `el.entries = …;` | `<… entries={…} />` | `<tc-agent-ledger :entries="…">` | `<tc-agent-ledger [entries]="…">` | `<tc-agent-ledger {entries}>` |
| `undone` | `el.undone = …;` | `<… undone={…} />` | `<tc-agent-ledger :undone="…">` | `<tc-agent-ledger [undone]="…">` | `<tc-agent-ledger {undone}>` |
| `onUndo` | `el.onUndo = …;` | `<… onUndo={…} />` | `<tc-agent-ledger :onUndo="…">` | `<tc-agent-ledger [onUndo]="…">` | `<tc-agent-ledger {onUndo}>` |
| `onRedo` | `el.onRedo = …;` | `<… onRedo={…} />` | `<tc-agent-ledger :onRedo="…">` | `<tc-agent-ledger [onRedo]="…">` | `<tc-agent-ledger {onRedo}>` |

*Also attributes: `heading`, `agent`, `now`, `point-at` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-undone-change` | Yes | `el.addEventListener("tc-undone-change", (e) => …)` | `onUndoneChange={…}` | `@tc-undone-change="…"` | `(tc-undone-change)="…($event)"` | `el.addEventListener("tc-undone-change", …)` |
| `tc-undo` | No | `el.addEventListener("tc-undo", (e) => …)` | `ref.current.addEventListener("tc-undo", …)` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |
| `tc-redo` | No | `el.addEventListener("tc-redo", (e) => …)` | `ref.current.addEventListener("tc-redo", …)` | `@tc-redo="…"` | `(tc-redo)="…($event)"` | `el.addEventListener("tc-redo", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `undone` itself unless a listener calls `preventDefault()` on `tc-undone-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-ledger id="agent-ledger"></tc-agent-ledger>

<script type="module">
  import "@adamstavely/trenchcoat/agent-ledger";

  const el = document.querySelector("#agent-ledger");
  el.addEventListener("tc-undone-change", (e) => {
    e.preventDefault(); // the element keeps its undone…
    if (allowed(e.detail.undone)) el.undone = e.detail.undone; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AgentLedger } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AgentLedger>;
type Props = Omit<Own, "undone" | "onUndoneChange"> & { initial: NonNullable<Own["undone"]> };

// Controlled: passing undone makes the wrapper prevent the element's own change; the app sets it
export function ControlledAgentLedger({ initial, ...props }: Props) {
  const [undone, setUndone] = useState<Own["undone"]>(initial);
  return <AgentLedger {...props} undone={undone} onUndoneChange={(next) => setUndone(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/agent-ledger";
import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";

const props = defineProps<{ initial: TcAgentLedger["undone"] }>();
const undone = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onUndoneChange = (e: CustomEvent<{ undone: TcAgentLedger["undone"] }>) => {
  e.preventDefault();
  undone.value = e.detail.undone;
};
</script>

<template>
  <tc-agent-ledger :undone="undone" @tc-undone-change="onUndoneChange"></tc-agent-ledger>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentLedger } from "@adamstavely/trenchcoat/angular/agent-ledger";
import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";

@Component({
  selector: "app-controlled-agent-ledger",
  imports: [AgentLedger],
  template: `<tc-agent-ledger [undone]="undone()" (tc-undone-change)="onUndoneChange($event)"></tc-agent-ledger>`,
})
export class ControlledAgentLedger {
  readonly initial = input.required<TcAgentLedger["undone"]>();
  readonly undone = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onUndoneChange(e: CustomEvent<{ undone: TcAgentLedger["undone"] }>) {
    e.preventDefault();
    this.undone.set(e.detail.undone);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-ledger";
  import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";

  let { initial }: { initial: TcAgentLedger["undone"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let undone = $derived(initial);
  let el: TcAgentLedger;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      undone = (e as CustomEvent<{ undone: TcAgentLedger["undone"] }>).detail.undone;
    };
    el.addEventListener("tc-undone-change", on);
    return () => el.removeEventListener("tc-undone-change", on);
  });
</script>

<tc-agent-ledger bind:this={el} {undone}></tc-agent-ledger>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-ledger")` returns a `TcAgentLedger` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";`
- **React / Next.js:** Props: `import type { AgentLedgerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentLedger>`. The element class, for refs: `import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentLedger["entries"]` with `import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";`
- **Angular:** The directive types the template: `[entries]` takes `TcAgentLedger["entries"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentLedger } from "@adamstavely/trenchcoat/agent-ledger";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `entries` | `LedgerEntry[]` | The changes the agent made, in any order – listed newest first; `icon` may be a React node |
| `now` | `number` | The clock for "2m ago", in epoch ms – defaults to an internal clock |
| `undone` | `string[]` | Ids of undone changes. Controlled when defined; otherwise the component keeps them, starting from `defaultUndone` |
| `defaultUndone` | `string[]` | Ids undone at first when uncontrolled |
| `onUndoneChange` | `(ids: string[]) => void` | Every change to the undone ids, as the whole new list |
| `onUndo` | `(ids: string[]) => void \| Promise<unknown>` | Undo sends the change and its reversible dependents, Redo the same set back – plus any undone changes that set builds on. Either may return a promise: the rows show the result at once and wait; if it rejects they go back and the bar says so |
| `onRedo` | `(ids: string[]) => void \| Promise<unknown>` | Called with the ids a Redo brings back; a returned promise holds the rows until it settles, a rejection reverts them |
| `pointAt` | `string \| null` | Lights up a change and what builds on it, as if its Undo were pointed at – e.g. for a walkthrough |
| `title` | `string` | The heading, and the list's name – "Ledger" by default |

*Renamed or hidden on the wrapper: `heading`, `entries`, `undone`, `now`, `pointAt`, `onUndo`, `onRedo`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the Undo and Redo buttons; focusing an Undo lights up what builds on it, as pointing does |
| Enter / Space | Undoes the change and its reversible dependents, or redoes it |

If a focused button goes away because its change was removed, focus moves to the next row's button instead of the
page.

### Screen readers

The rows are an ordered list named by the heading. Each button says what it acts on and how far it reaches (“Undo:
Changed price Pro plan – and 2 that build on it”, “Redo: Changed price Pro plan”); the arrow between before and after
is read as “to”. A status region says what happened: “Undone: Changed price Pro plan, and 2 changes with it. 1 can't
be undone” or “Redone: …”. A row waiting for your `onUndo` / `onRedo` promise is `aria-busy`, and a rejection is an
alert: “Couldn't undo – try again”.

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
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This component alone** | 31.8 KB | 8.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **40.7 KB** | **10.7 KB** |
| With Lit – the first component on a page | 63.3 KB | 18.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 59 DOM nodes – to layout, median of 7 |
| Typical update | **0.9 ms** | one item of entries replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 24 ms | entries: first render, 2,166 nodes; update 4.3 ms |
| 1,000 items | 118 ms | entries: first render, 21,516 nodes; update 26 ms |

1,000 items of entries: 118 ms. It renders every item, so a first render passes 50 ms (a long task) at about 420 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 7 React commits (clean), 7 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `action` as a past-tense verb phrase – “Changed price”, “Sent email” – and `target` as the thing it touched.
- Keep `change` values short enough to compare at a glance: “$29” → “$34”, “Draft” → “Published”.
- Mark anything that can't be taken back with `reversible: false`, so it never offers an Undo it can't keep.
- Name the agent the way people know it: “Launch agent”, not an internal id.

## Do and don't

### Do

- List what each change builds on in `dependsOn`, so an Undo takes its dependents along.
- Return a promise from `onUndo` / `onRedo` and reject it when the system refuses – the rows go back and say so.
- Use `pointAt` to light up a chain in a walkthrough or help article.

### Don't

- Don't hide irreversible changes from the ledger – show them, without an Undo.
- Don't show changes that weren't made yet; the ledger is a record, not a plan.
- Don't undo in the background without the ledger – people should see what went with it.

## Related

- [Run Checkpoints](run-checkpoints.md) – A run's restore points on a timeline – what each one captured, what going back discards, and “go back to step 4 and try again”, with earlier attempts kept as branches
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
