<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Agent Gallery

**Blocks** · New

Slim gradient panels with one open product screen in the middle – pick a panel and it glides open (uses `button`)

- **Element:** `<tc-agent-gallery>`
- **Size:** 15.0 KB gzip · 51.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-gallery";` |
| React / Next.js | `import { AgentGallery } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-gallery";` · tags starting with tc- are custom elements |
| Angular | `import { AgentGallery } from "@adamstavely/trenchcoat/angular/agent-gallery";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-gallery";` |

## Example

The live example is in the gallery at `#/blocks/agent-gallery`, in both looks; Replay restarts its animations.

## Overview

A showcase of agents as slim vertical panels side by side, each with the same soft gradient artwork in its own
colours. The panel in the middle is open and shows a product screen – the agent's workspace with its numbers and
context feed. Pick a side panel, an arrow button or an arrow key and that agent glides open in the middle while the
current one folds into a slim panel at the side; the caption below names the open agent. The list repeats either
side, so the gallery goes round without an end.

### When to use

- A landing or onboarding page that introduces a set of agents, templates or playbooks.
- A product tour where each item has its own screen to show.

### When not to use

- Managing running agents – use [Agent Lanes](../components/agent-lanes.md).
- Asking a person to approve an agent's action – use [Approval Card](../components/approval-card.md).
- A list of projects or items to open – use [Project Card](../components/project-card.md).
- A set of images to browse and compare – use [Image Grid](../components/image-grid.md).

## Anatomy

1. **Head** `.ui-ag__head` – the heading and the line under it
2. **Track** `.ui-ag__track` – the panels, three copies in a row, sliding so the open one is in the middle
3. **Panel** `.ui-ag__panel` – the gradient artwork (`.ui-ag__art`); a side panel's button (`.ui-ag__pick`) shows its name
4. **Screen** `.ui-ag__screen` – the open agent's workspace
5. **Caption** `.ui-ag__caption` – the open agent's name and description
6. **Arrows** `.ui-ag__arrows` – Previous and Next

## Looks

One look in both Standard and Clean, as the block it came from. Each agent's `colors` – strong, then soft – paint its
artwork and screen marks. `--tc-agent-gallery-height`, `--tc-agent-gallery-side`, `--tc-agent-gallery-gap` and
`--tc-agent-gallery-open` size the track and panels; `--tc-agent-gallery-move` is the glide's length.

## Usage

### HTML

```html
<tc-agent-gallery id="agents" heading="Agents that run your playbook"></tc-agent-gallery>

<script type="module">
  import "@adamstavely/trenchcoat/agent-gallery";
  import "@adamstavely/trenchcoat/tokens.css";

  const gallery = document.querySelector("#agents");
  gallery.addEventListener("tc-index-change", (e) => console.log(e.detail.item.name));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentGallery } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Showcase() {
  const [index, setIndex] = useState(3);
  return <AgentGallery title="Agents that run your playbook" index={index} onIndexChange={setIndex} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-gallery";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";

defineProps<{ items: TcAgentGallery["items"] }>();
const onIndexChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-gallery :items="items" @tc-index-change="onIndexChange"></tc-agent-gallery>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentGallery } from "@adamstavely/trenchcoat/angular/agent-gallery";
import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";

@Component({
  selector: "app-agent-gallery-example",
  imports: [AgentGallery],
  template: `<tc-agent-gallery [items]="items()" (tc-index-change)="onIndexChange($event)"></tc-agent-gallery>`,
})
export class AgentGalleryExample {
  readonly items = input.required<TcAgentGallery["items"]>();
  onIndexChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-gallery";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";

  let { items }: { items: TcAgentGallery["items"] } = $props();
  let el: TcAgentGallery;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-agent-gallery bind:this={el} {items}></tc-agent-gallery>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Agents that run your playbook"` | The heading, and the carousel's name |
| `subtitle` | `subtitle` | `string` | `"Give each agent its steps, tools and limits – then let it work inside the tools your team already uses."` | The line under the heading |
| `items` | – | `GalleryItem[]` | `[ { id: "triage", name: "Support triage", description: "Sorts new tickets by urgency and routes them to the right team.", colors: ["#8b5cf6", "#e9d5ff"], trigger: "Ticket created", steps: ["Read the ticket and detect the product area.", "Set priority from customer plan and sentiment.", "Assign the team and post a summary in the thread."], skills: ["Classify ticket", "Summarize thread"], guardrail: "Cannot close tickets", }, { id: "enrich", name: "Lead enrichment", description: "Fills in company data for every new lead before sales picks it up.", colors: ["#2f6bff", "#c7d7ff"], trigger: "Lead added", steps: ["Look up the company by email domain.", "Add size, industry and location to the record.", "Score the lead and notify the owner above 80."], skills: ["Find company", "Score lead"], guardrail: "Cannot change lead owner", }, { id: "recap", name: "Meeting recap", description: "Turns call transcripts into notes, decisions and next steps.", colors: ["#ec4899", "#fbcfe8"], trigger: "Call ended", steps: ["Pull the transcript from the recording.", "Write a short recap with decisions and owners.", "Create follow-up tasks and share the notes."], skills: ["Write recap", "Create tasks"], guardrail: "Cannot email external guests", }, { id: "churn", name: "Churn watch", description: "Spots accounts that go quiet and suggests a save play.", colors: ["#f97316", "#fed7aa"], trigger: "Usage drops 30%", steps: ["Compare weekly usage against the last quarter.", "Check open tickets and recent NPS answers.", "Draft a check-in for the account manager."], skills: ["Read usage", "Draft check-in"], guardrail: "Cannot offer discounts", }, { id: "onboard", name: "Onboarding coach", description: "Guides new customers through setup and nudges when they get stuck.", colors: ["#14b8a6", "#ccfbf1"], trigger: "Workspace created", steps: ["Send a welcome note with the first three steps.", "Watch for steps that stay open for two days.", "Offer a short call when setup stalls."], skills: ["Send nudge", "Book call"], guardrail: "Cannot change billing", }, { id: "review", name: "Content review", description: "Checks drafts for tone, claims and brand terms before they ship.", colors: ["#6366f1", "#e0e7ff"], trigger: "Draft submitted", steps: ["Check tone against the brand guide.", "Flag claims that need a source.", "Suggest fixes inline and tag the author."], skills: ["Check tone", "Flag claims"], guardrail: "Cannot publish", }, { id: "release", name: "Release notes", description: "Writes customer-facing notes from merged pull requests.", colors: ["#d946ef", "#f5d0fe"], trigger: "Release tagged", steps: ["Collect merged pull requests since the last tag.", "Group them into features, fixes and changes.", "Draft notes in plain language for review."], skills: ["Group changes", "Write notes"], guardrail: "Cannot post without review", }, ]` | The agents |
| `index` | `index` | `number \| undefined` | `undefined` | The open agent's index – unset, the middle one. The gallery glides there the short way round |
| `activeIndex` | – | `` | – | The open agent's index |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-index-change` | – | Yes | Another agent was picked – a panel, an arrow button or an arrow key (`{ index, item }`: GalleryIndexChange); cancelable – prevented, `index` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ag-space-36px` | `36px` | both |
| `--tc-ag-space-22px` | `22px` | both |
| `--tc-ag-space-7px` | `7px` | both |
| `--tc-ag-space-5px` | `5px` | both |
| `--tc-ag-space-560px` | `560px` | both |
| `--tc-ag-space-400px` | `400px` | both |
| `--tc-ag-space-1px` | `1px` | both |
| `--tc-ag-space-3px` | `3px` | both |
| `--tc-ag-space-9px` | `9px` | both |
| `--tc-ag-space-26px` | `26px` | both |
| `--tc-ag-fs-7_5px` | `7.5px` | both |
| `--tc-ag-fs-9px` | `9px` | both |
| `--tc-ag-fs-10_5px` | `10.5px` | both |
| `--tc-ag-fs-8_5px` | `8.5px` | both |
| `--tc-ag-track--0_025em` | `-0.025em` | both |
| `--tc-agent-gallery-base-top` | `light-dark(#f4f4f6, #232326)` | both |
| `--tc-agent-gallery-base-bottom` | `light-dark(#e9e9ee, #1a1a1c)` | both |
| `--tc-agent-gallery-shine` | `light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.08))` | both |
| `--tc-agent-gallery-screen-shadow` | `0 0 0 1px light-dark(#ececec, #2a2a2e), 0 20px 50px -20px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.5))` | both |
| `--tc-agent-gallery-move` | `620ms` | both |
| `--tc-agent-gallery-height` | `400px` | both |
| `--tc-agent-gallery-side` | `56px` | both |
| `--tc-agent-gallery-gap` | `10px` | both |
| `--tc-agent-gallery-open` | `calc(100cqw - 2 * (var(--tc-agent-gallery-side) + var(--tc-agent-gallery-gap)) - 24px)` | both |

#### Design tokens it reads (56)

`--tc-action-secondary-shadow`, `--tc-avatar-font-weight`, `--tc-border-default`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-snug`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-3xl`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`, `--tc-tracking-tight`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultGalleryItems: GalleryItem[]` | The default agents: seven made-up playbooks |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-agent-gallery :items="…">` | `<tc-agent-gallery [items]="…">` | `<tc-agent-gallery {items}>` |

*Also attributes: `heading`, `subtitle`, `index` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-index-change` | Yes | `el.addEventListener("tc-index-change", (e) => …)` | `ref.current.addEventListener("tc-index-change", …)` | `@tc-index-change="…"` | `(tc-index-change)="…($event)"` | `el.addEventListener("tc-index-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `index` itself unless a listener calls `preventDefault()` on `tc-index-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-gallery id="agent-gallery"></tc-agent-gallery>

<script type="module">
  import "@adamstavely/trenchcoat/agent-gallery";

  const el = document.querySelector("#agent-gallery");
  el.addEventListener("tc-index-change", (e) => {
    e.preventDefault(); // the element keeps its index…
    if (allowed(e.detail.index)) el.index = e.detail.index; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-gallery";
import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";

const props = defineProps<{ initial: TcAgentGallery["index"] }>();
const index = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onIndexChange = (e: CustomEvent<{ index: TcAgentGallery["index"] }>) => {
  e.preventDefault();
  index.value = e.detail.index;
};
</script>

<template>
  <tc-agent-gallery :index="index" @tc-index-change="onIndexChange"></tc-agent-gallery>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentGallery } from "@adamstavely/trenchcoat/angular/agent-gallery";
import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";

@Component({
  selector: "app-controlled-agent-gallery",
  imports: [AgentGallery],
  template: `<tc-agent-gallery [index]="index()" (tc-index-change)="onIndexChange($event)"></tc-agent-gallery>`,
})
export class ControlledAgentGallery {
  readonly initial = input.required<TcAgentGallery["index"]>();
  readonly index = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onIndexChange(e: CustomEvent<{ index: TcAgentGallery["index"] }>) {
    e.preventDefault();
    this.index.set(e.detail.index);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-gallery";
  import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";

  let { initial }: { initial: TcAgentGallery["index"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let index = $derived(initial);
  let el: TcAgentGallery;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      index = (e as CustomEvent<{ index: TcAgentGallery["index"] }>).detail.index;
    };
    el.addEventListener("tc-index-change", on);
    return () => el.removeEventListener("tc-index-change", on);
  });
</script>

<tc-agent-gallery bind:this={el} {index}></tc-agent-gallery>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-gallery")` returns a `TcAgentGallery` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";`
- **React / Next.js:** Props: `import type { AgentGalleryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentGallery>`. The element class, for refs: `import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentGallery["items"]` with `import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";`
- **Angular:** The directive types the template: `[items]` takes `TcAgentGallery["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentGallery } from "@adamstavely/trenchcoat/agent-gallery";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the carousel's name |
| `index` | `number` | The open agent (controlled) – the gallery glides there the short way round |
| `defaultIndex` | `number` | The agent open at first, when `index` isn't set – by default the middle one |
| `onIndexChange` | `(index: number) => void` | Called with the agent a visitor picks (a panel, an arrow button or an arrow key) |

*Renamed or hidden on the wrapper: `heading`, `index`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the side panels' buttons, then the arrow buttons |
| Enter / Space | On a side panel: opens that agent |
| ← / → | With focus on the panels: opens the previous or next agent |

When a picked panel's button goes away as it opens, focus moves into the open screen; after the quiet jump back into
the middle copy, focus moves to the same agent's button in view – never to the page.

### Screen readers

The element is a region with the role description "carousel", named by the heading. Each side panel's button is
named "Show <agent>". The open screen is a group named "<agent> workspace"; screens of folded panels and far copies
are hidden and inert. The caption is a polite live region that stays in place, so each newly opened agent is read.
The arrows are named "Previous agent" and "Next agent".

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, button, tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, button | – |
| :is() and :where() | 88 | 78 | 14 | 14 | button, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 30.7 KB | 9.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **51.1 KB** | **15.1 KB** |
| With Lit – the first component on a page | 72.9 KB | 22.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **5.0 ms** | default properties, 865 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents for what they do: "Support triage", "Meeting recap".
- Keep the description to one sentence – it's the caption under the gallery.
- Pick two colours of one hue for each agent – the strong one first.

## Do and don't

### Do

- Show five to nine agents, so a few side panels are always in view.
- Control `index` when the page has its own navigation to the same agents.

### Don't

- Don't use it for agents people operate – it's a showcase, the screens are pictures.
- Don't give two neighbouring agents the same colours.

## Related

- [Agent Lanes](../components/agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
- [Approval Card](../components/approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Project Card](../components/project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- [Image Grid](../components/image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
