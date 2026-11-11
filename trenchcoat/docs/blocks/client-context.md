<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Client Context

**Blocks** · New

A client workspace with live numbers and a shared context timeline – switch clients, search, filter and add notes or files (uses `button`, `segmented-control`)

- **Element:** `<tc-client-context>`
- **Size:** 28.4 KB gzip · 113.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/client-context";` |
| React / Next.js | `import { ClientContext } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/client-context";` · tags starting with tc- are custom elements |
| Angular | `import { ClientContext } from "@adamstavely/trenchcoat/angular/client-context";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/client-context";` |

## Example

The live example is in the gallery at `#/blocks/client-context`, in both looks; Replay restarts its animations.

## Overview

One client's workspace for an accounting, advisory or agency team. The header names the client and shows when their
books last synced, with a button to sync now and a switcher to open another client or create one. Four KPI cards sit
under it, each with a sparkline; picking one opens that metric under Financials.

The main card has four sections:
- **Context** – a timeline of notes, files, generated reports and connected apps that the whole team writes into.
  Search it, filter it by kind, write a note, mention a report with “@”, attach files and add it with ⌘ Enter.
- **Reports** – the client's generated reports, each opening to its summary with Mention in context and Regenerate.
- **Financials** – every KPI with last month's value and the change, the picked one marked.
- **Settings** – the Stripe connection and the client's switches.

Context added or removed here is kept per client until the page passes a different context for that client – then
the page's data wins.

### When to use

- A client or account page where the team needs the numbers and the shared notes side by side.
- Advisory and bookkeeping tools that keep goals, decisions and source files with each client.
- Any workspace where people switch between a handful of accounts all day.

### When not to use

- A single chart of one metric – use [KPI Chart](../components/kpi-chart.md).
- A discussion thread on one item – use [Comment Thread](../components/comment-thread.md).
- Files and context attached to an AI conversation – use [Context Tray](../components/context-tray.md).
- A list of past conversations – use [Chat History](../components/chat-history.md).

## Anatomy

1. **Header** `.ui-cx__head` – the client's mark, name and details, Sync now and Switch client
2. **Client menu** `.ui-cx__menu` – the clients, and New client
3. **KPI card** `.ui-cx__kpi` – a metric's value and sparkline; opens it under Financials
4. **Sections** `.ui-cx__seg` – Context, Reports, Financials and Settings
5. **Search** `.ui-cx__search` – filters the timeline
6. **Filter** `.ui-cx__filter-btn` – shows one kind of entry
7. **Note box** `.ui-cx__composer` – a note with mentions and attached files
8. **Timeline entry** `.ui-cx__item` – a note, files, a report or a connected app
9. **Mention** `.ui-cx__mention` – a mentioned report; opens it
10. **Report** `.ui-cx__report` – a report that opens to its summary and actions

## Looks

Standard puts the header on a gray tray, with the KPI cards and the main card as white cards on it. Clean is one
white card: the KPIs are quiet outlined tiles and the sections sit below a hairline. The buttons and the section tabs
are `tc-button` and `tc-segmented-control` in the same look.

## Usage

### HTML

```html
<tc-client-context id="client"></tc-client-context>

<script type="module">
  import "@adamstavely/trenchcoat/client-context";
  import "@adamstavely/trenchcoat/tokens.css";

  const client = document.querySelector("#client");
  client.me = { name: "Sofia Lind" };
  client.addEventListener("tc-add-context", (e) => console.log("add", e.detail.client, e.detail.text, e.detail.files));
  client.addEventListener("tc-client-change", (e) => console.log("client", e.detail.client));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ClientContext, defaultContextClients } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Clients() {
  const [client, setClient] = useState("northwind");
  return (
    <ClientContext
      clients={defaultContextClients}
      client={client}
      onClientChange={setClient}
      me={{ name: "Sofia Lind" }}
      onAddContext={(id, text, files) => console.log(id, text, files.length)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/client-context";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";

defineProps<{ clients: TcClientContext["clients"]; me: TcClientContext["me"] }>();
const onClientChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-client-context :clients="clients" :me="me" @tc-client-change="onClientChange"></tc-client-context>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ClientContext } from "@adamstavely/trenchcoat/angular/client-context";
import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";

@Component({
  selector: "app-client-context-example",
  imports: [ClientContext],
  template: `<tc-client-context [clients]="clients()" [me]="me()" (tc-client-change)="onClientChange($event)"></tc-client-context>`,
})
export class ClientContextExample {
  readonly clients = input.required<TcClientContext["clients"]>();
  readonly me = input.required<TcClientContext["me"]>();
  onClientChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/client-context";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";

  let { clients, me }: { clients: TcClientContext["clients"]; me: TcClientContext["me"] } = $props();
  let el: TcClientContext;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-client-change", on);
    return () => el.removeEventListener("tc-client-change", on);
  });
</script>

<tc-client-context bind:this={el} {clients} {me}></tc-client-context>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `clients` | – | `ContextClient[]` | `[ { id: "northwind", name: "Northwind Logistics", meta: "Northwind Logistics GmbH · EUR · Fiscal year ends Dec 31", mark: { letter: "N", bg: "#1d4ed8", fg: "#ffffff" }, kpis: [ { label: "MRR", value: "€48.2k", previous: "€44.9k", delta: 7.4, points: [31, 33, 32, 35, 36, 35, 38, 40, 41, 44], color: "#2f6bff" }, { label: "Cash", value: "€612k", previous: "€648k", delta: -5.6, points: [44, 43, 43, 41, 40, 41, 38, 37, 36, 35], color: "#0ea5e9" }, { label: "Gross margin", value: "64.1%", previous: "62.8%", delta: 1.3, points: [30, 31, 30, 32, 31, 33, 32, 33, 34, 34], color: "#8b5cf6" }, { label: "Net burn", value: "€36.0k", previous: "€41.5k", delta: -13.3, points: [42, 41, 43, 40, 39, 38, 39, 36, 35, 33], color: "#ec4899" }, ], reports: [ { name: "Monthly P&L", when: "1d ago", summary: "Revenue up 7% on the new Hamburg routes; freight costs flat, so margin improved by 1.3 points." }, { name: "Cash runway", when: "6d ago", summary: "17 months at the current burn. The Q1 fleet lease pushes it to 15 if signed in January." }, { name: "Board pack Q3", when: "2w ago", summary: "Highlights, KPIs and the three decisions for the board: pricing, fleet lease and the Nordics pilot." }, ], context: [ { id: "n1", kind: "note", author: people.lena, when: "today", text: "CFO wants every figure in the @Monthly P&L in EUR, also for the Danish entity – no converted totals." }, { id: "n2", kind: "report", author: people.jonas, when: "1d ago", report: "Monthly P&L" }, { id: "n3", kind: "files", author: people.jonas, when: "2d ago", files: [ { name: "budget-2027.pdf", type: "pdf" }, { name: "fleet-costs-Q3.xlsx", type: "xlsx" }, ], }, { id: "n4", kind: "note", author: people.lena, when: "4d ago", text: "Renewal talks start in November. They'll ask for a lower rate if the Nordics pilot slips – keep the @Cash runway current.", }, { id: "n5", kind: "integration", when: "1w ago", app: "Stripe", connected: true }, ], }, { id: "lumen", name: "Lumen Labs", meta: "Lumen Labs, Inc. · GBP · Fiscal year ends Mar 31", mark: { letter: "L", bg: "#f97316", fg: "#ffffff" }, kpis: [ { label: "ARR", value: "£1.84m", previous: "£1.62m", delta: 13.6, points: [20, 22, 23, 25, 27, 28, 30, 33, 35, 38], color: "#2f6bff" }, { label: "Cash", value: "£980k", previous: "£1.06m", delta: -7.5, points: [46, 45, 43, 42, 41, 40, 38, 37, 36, 35], color: "#0ea5e9" }, { label: "Gross margin", value: "78.0%", previous: "77.2%", delta: 0.8, points: [36, 36, 37, 36, 37, 37, 38, 37, 38, 38], color: "#8b5cf6" }, { label: "Runway", value: "17 mo", previous: "18 mo", delta: -5.6, points: [40, 39, 39, 38, 37, 37, 36, 35, 35, 34], color: "#ec4899" }, ], reports: [{ name: "Runway forecast", when: "today", summary: "Hiring four engineers in Q1 shortens the runway from 19 to 17 months." }], context: [ { id: "l1", kind: "report", author: people.mara, when: "today", report: "Runway forecast" }, { id: "l2", kind: "note", author: people.mara, when: "2d ago", text: "Hiring plan adds four engineers in Q1 – reflect it in the @Runway forecast before the board meeting." }, { id: "l3", kind: "files", author: people.theo, when: "4d ago", files: [{ name: "hiring-plan.doc", type: "doc" }] }, ], }, { id: "halcyon", name: "Halcyon Health", meta: "Halcyon Health Ltd · USD · Fiscal year ends Jun 30", mark: { letter: "H", bg: "#0f766e", fg: "#ffffff" }, kpis: [ { label: "Revenue", value: "$212k", previous: "$198k", delta: 7.1, points: [30, 29, 31, 33, 32, 34, 35, 34, 36, 37], color: "#2f6bff" }, { label: "Cash", value: "$1.21m", previous: "$1.19m", delta: 1.7, points: [38, 38, 39, 38, 39, 40, 39, 40, 41, 41], color: "#0ea5e9" }, { label: "Gross margin", value: "58.3%", previous: "59.0%", delta: -0.7, points: [36, 35, 36, 35, 35, 34, 35, 34, 34, 33], color: "#8b5cf6" }, { label: "Net profit", value: "$18.4k", previous: "$12.0k", delta: 53.3, points: [20, 21, 19, 22, 24, 23, 26, 27, 29, 31], color: "#ec4899" }, ], reports: [{ name: "Clinic margins", when: "3d ago", summary: "Two of nine clinics run below 40% margin; both opened this year." }], context: [ { id: "h1", kind: "note", author: people.theo, when: "yesterday", text: "New clinics need 12 months before they count in the @Clinic margins comparison." }, { id: "h2", kind: "integration", when: "2w ago", app: "Stripe", connected: true }, ], }, ]` | The clients and their context. Context added or removed here is kept per client until you pass a different context for that client – then your data wins |
| `client` | `client` | `string` | `""` | Id of the open client; empty opens the first |
| `me` | – | `ContextPerson` | `{ name: "Sofia Lind", avatar: "/avatars/sofia.jpg" }` | The signed-in person – author of new context |
| `tab` | `tab` | `ContextTab` | `"context"` | The section shown: context, reports, financials or settings |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-client-change` | – | Yes | A client was picked or created (`ClientContextClientChange`: `{ client }`); cancelable – prevented, `client` stays (controlled use) |
| `tc-add-context` | – | Yes | Context was added (`ClientContextAdd`: `{ client, text, files }`); cancelable – prevented, it isn't added here |
| `tc-create-client` | – | Yes | A client was created from the switcher (`ClientContextCreate`: `{ name }`); cancelable – prevented, it isn't created |
| `tc-tab-change` | – | Yes | The section changed (`ClientContextTabChange`: `{ tab }`); cancelable – prevented, `tab` stays |

#### Design tokens it reads (123)

`--tc-accent-highlight`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-control`, `--tc-shadow-sunken`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-font-size`, `--tc-tone-rose-fg`, `--tc-tone-teal-solid`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultContextClients: ContextClient[]` | The sample clients shown when `clients` isn't set |
| `clientContextMatches(e: ContextEntry, query: string): void` | Whether an entry matches the search (author, text, file names, report or app) |
| `clientContextMentionStart(value: string, caret: number): void` | Where the "@" mention being typed starts, or null – an "@" at the start or after a space, up to the caret |

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
| `clients` | `el.clients = …;` | `<… clients={…} />` | `<tc-client-context :clients="…">` | `<tc-client-context [clients]="…">` | `<tc-client-context {clients}>` |
| `me` | `el.me = …;` | `<… me={…} />` | `<tc-client-context :me="…">` | `<tc-client-context [me]="…">` | `<tc-client-context {me}>` |

*Also attributes: `client`, `tab` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-client-change` | Yes | `el.addEventListener("tc-client-change", (e) => …)` | `ref.current.addEventListener("tc-client-change", …)` | `@tc-client-change="…"` | `(tc-client-change)="…($event)"` | `el.addEventListener("tc-client-change", …)` |
| `tc-add-context` | Yes | `el.addEventListener("tc-add-context", (e) => …)` | `onAddContext={…}` | `@tc-add-context="…"` | `(tc-add-context)="…($event)"` | `el.addEventListener("tc-add-context", …)` |
| `tc-create-client` | Yes | `el.addEventListener("tc-create-client", (e) => …)` | `onCreateClient={…}` | `@tc-create-client="…"` | `(tc-create-client)="…($event)"` | `el.addEventListener("tc-create-client", …)` |
| `tc-tab-change` | Yes | `el.addEventListener("tc-tab-change", (e) => …)` | `ref.current.addEventListener("tc-tab-change", …)` | `@tc-tab-change="…"` | `(tc-tab-change)="…($event)"` | `el.addEventListener("tc-tab-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `client` and `tab` itself unless a listener calls `preventDefault()` on `tc-client-change` or `tc-tab-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-client-context id="client-context"></tc-client-context>

<script type="module">
  import "@adamstavely/trenchcoat/client-context";

  const el = document.querySelector("#client-context");
  el.addEventListener("tc-client-change", (e) => {
    e.preventDefault(); // the element keeps its client…
    if (allowed(e.detail.client)) el.client = e.detail.client; // …until the app sets it
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
import "@adamstavely/trenchcoat/client-context";
import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";

const props = defineProps<{ initial: TcClientContext["client"] }>();
const client = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onClientChange = (e: CustomEvent<{ client: TcClientContext["client"] }>) => {
  e.preventDefault();
  client.value = e.detail.client;
};
</script>

<template>
  <tc-client-context :client="client" @tc-client-change="onClientChange"></tc-client-context>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ClientContext } from "@adamstavely/trenchcoat/angular/client-context";
import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";

@Component({
  selector: "app-controlled-client-context",
  imports: [ClientContext],
  template: `<tc-client-context [client]="client()" (tc-client-change)="onClientChange($event)"></tc-client-context>`,
})
export class ControlledClientContext {
  readonly initial = input.required<TcClientContext["client"]>();
  readonly client = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onClientChange(e: CustomEvent<{ client: TcClientContext["client"] }>) {
    e.preventDefault();
    this.client.set(e.detail.client);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/client-context";
  import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";

  let { initial }: { initial: TcClientContext["client"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let client = $derived(initial);
  let el: TcClientContext;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      client = (e as CustomEvent<{ client: TcClientContext["client"] }>).detail.client;
    };
    el.addEventListener("tc-client-change", on);
    return () => el.removeEventListener("tc-client-change", on);
  });
</script>

<tc-client-context bind:this={el} {client}></tc-client-context>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-client-context")` returns a `TcClientContext` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";`
- **React / Next.js:** Props: `import type { ClientContextProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ClientContext>`. The element class, for refs: `import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcClientContext["clients"]` with `import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";`
- **Angular:** The directive types the template: `[clients]` takes `TcClientContext["clients"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcClientContext } from "@adamstavely/trenchcoat/client-context";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `clients` | `ContextClient[]` | The clients and their context. Context added or removed in the block is kept per client until you pass a different context for that client – then your data wins |
| `client` | `string` | Id of the open client (controlled) – pass `onClientChange` with it. Leave undefined to start at `defaultClient` (the first) |
| `defaultClient` | `string` | The client open on mount when `client` isn't controlled – the first by default |
| `onClientChange` | `(id: string) => void` | A client was picked or created |
| `tab` | `ContextTab` | The section shown (controlled) – pass `onTabChange` with it |
| `defaultTab` | `ContextTab` | The section on mount when `tab` isn't controlled |
| `onTabChange` | `(tab: ContextTab) => void` | The section changed |
| `onAddContext` | `(clientId: string, text: string, files: ContextFile[]) => void` | Called when context is added, with the client, the text and any attached files |
| `onCreateClient` | `(name: string) => void` | Called when a client is created from the switcher |

*Renamed or hidden on the wrapper: `client`, `clients`, `tab`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the header, KPI cards, sections, search and the timeline's buttons |
| ↑ / ↓ | In the client or filter menu, moves between items |
| Home / End | In a menu, moves to the first or last item |
| Enter / Space | Opens a menu, picks an item, opens a report or metric |
| Esc | Closes a menu and returns focus to its button; closes the mention suggestions |
| ← / → | Moves between the sections |
| ⌘ Enter / Ctrl Enter | Adds the note |
| Enter / Tab | While mention suggestions show, inserts the first one |

When something under focus goes away – a removed note or file, Clear search, Show everything – focus moves to the
nearest control that stays.

### Screen readers

The sections are tabs that control one tab panel named after the open section. The sync button is named by what it
shows plus what pressing does: “Synced 3m ago, sync now”, and the result (“Synced just now”) is announced in a status
region. The switcher and filter buttons report `aria-expanded`; the current client and filter are marked with
`aria-current` and `aria-pressed`. Mention suggestions are announced: “2 reports to mention – Enter inserts Monthly
P&L”. A collapsed report's body is `inert`, so its buttons aren't reached. Switches in Settings use `role="switch"`.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | button | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, button, internal/base, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 62.2 KB | 16.9 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **113.3 KB** | **28.4 KB** |
| With Lit – the first component on a page | 136.1 KB | 36.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.0 ms** | default properties, 183 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 35 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`, `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout`, `setTimeout` (segmented-control).
- 4 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (segmented-control).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Put the legal name, currency and fiscal year end in `meta`: it's what people check before they trust a number.
- Write `when` as people say it – “today”, “2d ago”.
- Name reports so they read well after “@”: “Monthly P&L”, “Cash runway”.
- Keep notes to goals, requests and decisions; attach the files that back them.

## Do and don't

### Do

- Persist added context from `tc-add-context` and pass the client's new `context` back.
- Pass `me`, so people can remove their own notes.
- Keep the KPI list to four, the same four for every client.

### Don't

- Don't use colour alone to tell kinds apart – each entry has its own icon and words.
- Don't put more than a few hundred entries in one client's timeline; page older ones.
- Don't rely on the demo's sync and regenerate timers – wire them to your own jobs.

## Related

- [KPI Chart](../components/kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Comment Thread](../components/comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Chat History](../components/chat-history.md) – Your conversations, grouped by date – search, pin, folders, rename and delete with undo, smooth with thousands of chats
- [Context Tray](../components/context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Segmented Control](../components/segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
