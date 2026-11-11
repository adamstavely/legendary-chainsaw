<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Cursors

**Agents**

Agents working in a document like teammates in a multiplayer editor – live pointers with names, suggestions typed letter by letter, images they resize, code they fix and comments beside the page

- **Element:** `<tc-agent-cursors>`
- **Size:** 22.4 KB gzip · 85.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-cursors";` |
| React / Next.js | `import { AgentCursors } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-cursors";` · tags starting with tc- are custom elements |
| Angular | `import { AgentCursors } from "@adamstavely/trenchcoat/angular/agent-cursors";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-cursors";` |

## Example

The live example is in the gallery at `#/agent-cursors`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A document that agents edit alongside each other, shown like a multiplayer editor. Each agent has a named pointer,
so people can see where every agent is and what it is doing – selecting a passage, typing a suggestion, resizing an
image, writing a comment. Changes arrive as suggestions in the agent's colour, for a person to accept or reject,
and the faces in the header show who is in the document and let people follow one agent. The element draws what
you give it: you move the agents by updating `cursors`, `blocks`, `suggestions` and `comments`.

### When to use

- Showing several agents drafting or reviewing one document, where people need to see who changed what.
- Reviewing agent edits as suggestions in context, rather than as a separate list of changes.
- Product tours and empty states that show agents at work in a document.

### When not to use

- Watching one agent drive a browser or a desktop – use [Live View](live-view.md).
- Comparing two versions of a text – use [Inline Diff](inline-diff.md).
- A discussion about a piece of work, without the document itself – use [Comment Thread](comment-thread.md).
- Following what several agents are doing over time, without the shared document – use [Agent Lanes](agent-lanes.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-agc__bar` – the shared card header: a boxed icon and the document's title, with the agents' faces, a count, the total cost and Accept all on its right
2. **Face** `.ui-agc__face` – one agent; press it to follow that agent
3. **Page** `.ui-agc__sheet` – the document, block by block
4. **Pointer** `.ui-agc__flag` – an agent's name flag, with what it is doing; its arrow and caret sit beside it
5. **Suggestion** `.ui-agc__ins` – new text underlined in the agent's colour; removed text is struck through
6. **Comment pin** `.ui-agc__pin-box` – a comment pinned to a block; it opens to read, reply and resolve

## Looks

Standard sets the page on a paper sheet inside the gray tray, with the header above it. Clean has no tray: one
white page with the header inside it, under a hairline, and slightly smaller faces. Pointers, suggestions and
comments behave the same in both.

## Usage

### HTML

```html
<tc-agent-cursors id="brief" heading="Launch brief" can-accept can-reject></tc-agent-cursors>

<script type="module">
  import "@adamstavely/trenchcoat/agent-cursors";
  import "@adamstavely/trenchcoat/tokens.css";

  const doc = document.querySelector("#brief");
  doc.agents = [{ id: "ada", name: "Ada", color: "#7c3aed" }];
  doc.blocks = [
    { id: "t", kind: "title", text: "Orbit 2.0 launch brief" },
    { id: "p1", text: "Orbit 2.0 ships on March 12 with offline sync." },
  ];
  doc.suggestions = [{ id: "s1", agent: "ada", block: "p1", at: 19, remove: 8, insert: "in March", note: "The date isn't confirmed" }];
  doc.cursors = { ada: { block: "p1", at: 19, doing: "Checking the dates" } };
  doc.addEventListener("tc-accept", (e) => console.log("accepted", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentCursors, acceptSuggestion, type DocBlock, type DocSuggestion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const agents = [{ id: "ada", name: "Ada", color: "#7c3aed" }];

export function Brief() {
  const [doc, setDoc] = useState<{ blocks: DocBlock[]; suggestions: DocSuggestion[] }>({
    blocks: [{ id: "p1", text: "Orbit 2.0 ships on March 12 with offline sync." }],
    suggestions: [{ id: "s1", agent: "ada", block: "p1", at: 19, remove: 8, insert: "in March" }],
  });
  return (
    <AgentCursors
      title="Launch brief"
      agents={agents}
      blocks={doc.blocks}
      suggestions={doc.suggestions}
      cursors={{ ada: { block: "p1", at: 19, doing: "Checking the dates" } }}
      onAccept={(s) => setDoc((d) => acceptSuggestion(d.blocks, d.suggestions, s.id))}
      onReject={(s) => setDoc((d) => ({ ...d, suggestions: d.suggestions.filter((x) => x.id !== s.id) }))}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-cursors";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";

defineProps<{ agents: TcAgentCursors["agents"]; blocks: TcAgentCursors["blocks"] }>();
const onFollowingChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-cursors :agents="agents" :blocks="blocks" @tc-following-change="onFollowingChange"></tc-agent-cursors>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentCursors } from "@adamstavely/trenchcoat/angular/agent-cursors";
import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";

@Component({
  selector: "app-agent-cursors-example",
  imports: [AgentCursors],
  template: `<tc-agent-cursors [agents]="agents()" [blocks]="blocks()" (tc-following-change)="onFollowingChange($event)"></tc-agent-cursors>`,
})
export class AgentCursorsExample {
  readonly agents = input.required<TcAgentCursors["agents"]>();
  readonly blocks = input.required<TcAgentCursors["blocks"]>();
  onFollowingChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-cursors";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";

  let { agents, blocks }: { agents: TcAgentCursors["agents"]; blocks: TcAgentCursors["blocks"] } = $props();
  let el: TcAgentCursors;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-following-change", on);
    return () => el.removeEventListener("tc-following-change", on);
  });
</script>

<tc-agent-cursors bind:this={el} {agents} {blocks}></tc-agent-cursors>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agents` | – | `CursorAgent[]` | `[]` | The agents in the document – each one's name, colour, mark and cost; their faces show in the header |
| `blocks` | – | `DocBlock[]` | `[]` | The document, block by block – title, headings, paragraphs, list items, code, images and tables |
| `suggestions` | – | `DocSuggestion[]` | `[]` | Suggested changes, shown inline in the text in the suggesting agent's colour |
| `comments` | – | `DocComment[]` | `[]` | Comment pins on the page |
| `cursors` | – | `Record<string, AgentCursor \| null \| undefined>` | `{}` | Where each agent is – a missing or null entry means the agent has left the document |
| `following` | `following` | `string \| null` | `null` | The agent you follow (the others fade back), or null |
| `height` | `height` | `number \| undefined` | `undefined` | A fixed page height in px – the rest of the document fades out towards the bottom |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats every cost – defaults to dollars, e.g. "$0.42" |
| `tabs` | – | `DocTab[] \| undefined` | `undefined` | Tabs above the page, e.g. the document and a table view of it |
| `tab` | `tab` | `string \| undefined` | `undefined` | The open tab – unset is the first. The page content is yours to switch |
| `heading` | `heading` | `string` | `"Untitled"` | The document's title in the header |
| `canAccept` | `can-accept` | `boolean` | `false` | Shows Accept in a suggestion's window (fires tc-accept) |
| `canReject` | `can-reject` | `boolean` | `false` | Shows Reject in a suggestion's window (fires tc-reject) |
| `canAcceptAll` | `can-accept-all` | `boolean` | `false` | Shows "Accept all" in the header (fires tc-accept-all) |
| `canResolve` | `can-resolve` | `boolean` | `false` | Shows the resolve check in a comment's window (fires tc-resolve) |
| `onReply` | – | `AgentCursorsReply \| undefined` | `undefined` | A reply typed into a comment's window and sent with Enter. May return a promise: the field waits while it runs, and if it rejects the text comes back so it can be sent again |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-following-change` | – | Yes | A face was clicked to follow an agent, or to stop ({ following }: AgentFollowingChange); cancelable |
| `tc-tab-change` | – | Yes | Another tab was picked ({ tab }: AgentTabChange); cancelable |
| `tc-accept` | – | No | A suggestion was accepted; `detail` is the `DocSuggestion` |
| `tc-reject` | – | No | A suggestion was rejected; `detail` is the `DocSuggestion` |
| `tc-accept-all` | – | No | "Accept all" was pressed; detail: null |
| `tc-resolve` | – | No | A comment was resolved; `detail` is the `DocComment` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-cursors-gap` | `16px` | both, clean |
| `--tc-agent-cursors-c` | `light-dark(#1f1f22, #e4e4e7)` | both, clean |
| `--tc-agent-cursors-flag-bg` | `light-dark(#141416, #f4f4f5)` | both, clean |
| `--tc-agent-cursors-flag-fg` | `var(--tc-text-on-inverse)` | both |
| `--tc-agent-cursors-flag-soft` | `light-dark(rgba(255, 255, 255, 0.14), rgba(0, 0, 0, 0.08))` | both |
| `--tc-agent-cursors-flag-muted` | `color-mix(in srgb, var(--tc-agent-cursors-flag-fg) 65%, transparent)` | both |
| `--tc-agent-cursors-edge` | `linear-gradient(90deg, #ff4fa3, #8b6bff 55%, #3b8bff)` | both |
| `--tc-agent-cursors-shimmer` | `light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))` | both, clean |
| `--tc-agent-cursors-shine` | `light-dark(rgba(0, 0, 0, 0.015), rgba(255, 255, 255, 0.1))` | both, clean |
| `--tc-agent-cursors-outline` | `light-dark(#ffffff, #1c1c1f)` | both, clean |
| `--tc-agent-cursors-glide` | `var(--tc-duration-slowest)` | both |
| `--tc-agent-cursors-blink` | `1100ms` | both |
| `--tc-agent-cursors-tint` | `color-mix(in srgb, var(--tc-agent-cursors-c) 16%, var(--tc-surface-raised))` | not set – this fallback applies |
| `--tc-agent-cursors-pin-x` | `0px` | not set – this fallback applies |
| `--tc-agent-cursors-pin-w` | `248px` | not set – this fallback applies |
| `--tc-agent-cursors-h` | `18px` | not set – this fallback applies |
| `--tc-agent-cursors-shift` | `0px` | not set – this fallback applies |

#### Design tokens it reads (126)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-agent-cursors-height`, `--tc-agent-cursors-pill-bg`, `--tc-agent-cursors-pill-fg`, `--tc-agent-cursors-pin`, `--tc-agent-cursors-pin-h`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal-slow`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-seg-thumb-bg`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tracking-normal`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `acceptSuggestion(blocks: DocBlock[], suggestions: DocSuggestion[], id: string): void` | Accepts a suggestion: writes it into the text and moves the other suggestions in that block along |

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
| `agents` | `el.agents = …;` | `<… agents={…} />` | `<tc-agent-cursors :agents="…">` | `<tc-agent-cursors [agents]="…">` | `<tc-agent-cursors {agents}>` |
| `blocks` | `el.blocks = …;` | `<… blocks={…} />` | `<tc-agent-cursors :blocks="…">` | `<tc-agent-cursors [blocks]="…">` | `<tc-agent-cursors {blocks}>` |
| `suggestions` | `el.suggestions = …;` | `<… suggestions={…} />` | `<tc-agent-cursors :suggestions="…">` | `<tc-agent-cursors [suggestions]="…">` | `<tc-agent-cursors {suggestions}>` |
| `comments` | `el.comments = …;` | `<… comments={…} />` | `<tc-agent-cursors :comments="…">` | `<tc-agent-cursors [comments]="…">` | `<tc-agent-cursors {comments}>` |
| `cursors` | `el.cursors = …;` | `<… cursors={…} />` | `<tc-agent-cursors :cursors="…">` | `<tc-agent-cursors [cursors]="…">` | `<tc-agent-cursors {cursors}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-agent-cursors :formatCost="…">` | `<tc-agent-cursors [formatCost]="…">` | `<tc-agent-cursors {formatCost}>` |
| `tabs` | `el.tabs = …;` | `<… tabs={…} />` | `<tc-agent-cursors :tabs="…">` | `<tc-agent-cursors [tabs]="…">` | `<tc-agent-cursors {tabs}>` |
| `onReply` | `el.onReply = …;` | `<… onReply={…} />` | `<tc-agent-cursors :onReply="…">` | `<tc-agent-cursors [onReply]="…">` | `<tc-agent-cursors {onReply}>` |

*Also attributes: `following`, `height`, `tab`, `heading`, `can-accept`, `can-reject`, `can-accept-all`, `can-resolve` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-following-change` | Yes | `el.addEventListener("tc-following-change", (e) => …)` | `ref.current.addEventListener("tc-following-change", …)` | `@tc-following-change="…"` | `(tc-following-change)="…($event)"` | `el.addEventListener("tc-following-change", …)` |
| `tc-tab-change` | Yes | `el.addEventListener("tc-tab-change", (e) => …)` | `ref.current.addEventListener("tc-tab-change", …)` | `@tc-tab-change="…"` | `(tc-tab-change)="…($event)"` | `el.addEventListener("tc-tab-change", …)` |
| `tc-accept` | No | `el.addEventListener("tc-accept", (e) => …)` | `onAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |
| `tc-reject` | No | `el.addEventListener("tc-reject", (e) => …)` | `onReject={…}` | `@tc-reject="…"` | `(tc-reject)="…($event)"` | `el.addEventListener("tc-reject", …)` |
| `tc-accept-all` | No | `el.addEventListener("tc-accept-all", (e) => …)` | `onAcceptAll={…}` | `@tc-accept-all="…"` | `(tc-accept-all)="…($event)"` | `el.addEventListener("tc-accept-all", …)` |
| `tc-resolve` | No | `el.addEventListener("tc-resolve", (e) => …)` | `onResolveComment={…}` | `@tc-resolve="…"` | `(tc-resolve)="…($event)"` | `el.addEventListener("tc-resolve", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `following` and `tab` itself unless a listener calls `preventDefault()` on `tc-following-change` or `tc-tab-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-cursors id="agent-cursors"></tc-agent-cursors>

<script type="module">
  import "@adamstavely/trenchcoat/agent-cursors";

  const el = document.querySelector("#agent-cursors");
  el.addEventListener("tc-following-change", (e) => {
    e.preventDefault(); // the element keeps its following…
    if (allowed(e.detail.following)) el.following = e.detail.following; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-cursors";
import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";

const props = defineProps<{ initial: TcAgentCursors["following"] }>();
const following = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFollowingChange = (e: CustomEvent<{ following: TcAgentCursors["following"] }>) => {
  e.preventDefault();
  following.value = e.detail.following;
};
</script>

<template>
  <tc-agent-cursors :following="following" @tc-following-change="onFollowingChange"></tc-agent-cursors>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentCursors } from "@adamstavely/trenchcoat/angular/agent-cursors";
import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";

@Component({
  selector: "app-controlled-agent-cursors",
  imports: [AgentCursors],
  template: `<tc-agent-cursors [following]="following()" (tc-following-change)="onFollowingChange($event)"></tc-agent-cursors>`,
})
export class ControlledAgentCursors {
  readonly initial = input.required<TcAgentCursors["following"]>();
  readonly following = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFollowingChange(e: CustomEvent<{ following: TcAgentCursors["following"] }>) {
    e.preventDefault();
    this.following.set(e.detail.following);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-cursors";
  import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";

  let { initial }: { initial: TcAgentCursors["following"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let following = $derived(initial);
  let el: TcAgentCursors;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      following = (e as CustomEvent<{ following: TcAgentCursors["following"] }>).detail.following;
    };
    el.addEventListener("tc-following-change", on);
    return () => el.removeEventListener("tc-following-change", on);
  });
</script>

<tc-agent-cursors bind:this={el} {following}></tc-agent-cursors>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-cursors")` returns a `TcAgentCursors` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";`
- **React / Next.js:** Props: `import type { AgentCursorsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentCursors>`. The element class, for refs: `import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentCursors["agents"]` with `import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";`
- **Angular:** The directive types the template: `[agents]` takes `TcAgentCursors["agents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentCursors } from "@adamstavely/trenchcoat/agent-cursors";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `agents` | `CursorAgent[]` | The agents in the document; `avatar` takes a React node |
| `onResolveComment` | `(comment: DocComment) => void` | Resolves a comment – the black check in its window |
| `onAccept` | `(suggestion: DocSuggestion) => void` | Accepts a suggestion – shows Accept in its window; write the change in with `acceptSuggestion` |
| `onReject` | `(suggestion: DocSuggestion) => void` | Rejects a suggestion – shows Reject in its window |
| `onAcceptAll` | `() => void` | Shows "Accept all" in the header; it is disabled while there are no suggestions |
| `following` | `string \| null` | The agent you follow (the others fade back). Controlled when defined (null = nobody) |
| `defaultFollowing` | `string \| null` | The agent followed at first, when `following` is not controlled |
| `onFollowingChange` | `(agent: string \| null) => void` | Called when a face is clicked to follow an agent, or to stop (null) |
| `tab` | `string` | The open tab. Controlled when defined; otherwise the component keeps it, starting from `defaultTab` |
| `defaultTab` | `string` | The tab open at first, when `tab` is not controlled – defaults to the first |
| `onTabChange` | `(tab: string) => void` | Called when another tab is picked |
| `title` | `string` | The document's title in the header (default "Untitled") |

*Renamed or hidden on the wrapper: `agents`, `following`, `tab`, `heading`, `canAccept`, `canReject`, `canAcceptAll`, `canResolve`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the faces, Accept all, the suggestions and the comment pins |
| Enter / Space | On a suggestion: opens its window and moves focus into it. On a face: follows that agent, or stops |
| Escape | Closes the open suggestion window or comment and returns focus to it; elsewhere, hides the faces' tips |
| Tab (in a suggestion's window) | Past the last button, focus goes on from the suggestion in the text; Shift+Tab before the first goes back to it |
| Enter (in a reply field) | Sends the reply |
| ← / → | Moves between the tabs above the page; Home and End go to the first and last |

### Screen readers

The faces are toggle buttons in a group labelled “Agents in this document”, named with what each agent is doing
(“Follow Ada – Checking the numbers”), with `aria-pressed` for the one being followed. Each suggestion is a button
named for its change (“Ada suggests adding: every team”, “Ada suggests removing: …”) that opens a dialog labelled
“Suggestion from Ada”. Comment pins are buttons named with the comment (“Comment from Ada: …”) and say whether they
are open with `aria-expanded`; a closed comment is inert. The pointers and selections are hidden from assistive
technology – a polite live region says instead when a suggestion arrives (“Ada suggests a change: …”) or an agent
starts a comment (“Ada is writing a comment”). Tabs, when set, follow the tabs pattern in a tablist labelled
“Views”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| conic-gradient() | 69 (Edge 79) | 83 | 12.1 | 12.1 | itself | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

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
| **This component alone** | 76.1 KB | 19.5 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **85.0 KB** | **22.4 KB** |
| With Lit – the first component on a page | 108.3 KB | 29.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 82 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of blocks replaced |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.4 ms | blocks: first render, 315 nodes; update 0.4 ms |
| 1,000 items | 25 ms | blocks: first render, 2,565 nodes; update 5.1 ms |

1,000 items of blocks: 25 ms, 2,565 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 50 React commits (clean), 50 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document keydown`.
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name agents the way the product does elsewhere, and keep the names short – they sit on a small flag.
- Write `doing` as a present-tense phrase of two to four words: “Checking the numbers”, “Fixing the code”.
- Give each suggestion a `note` that says why, in one sentence – it is what people read before accepting.
- Give images `alt` text; while `loading`, the image is announced as “Image loading”.

## Do and don't

### Do

- Give each agent its own `color`, so pointers, selections and suggestions can be told apart.
- Turn on Accept and Reject (`can-accept`, `can-reject`) whenever suggestions need a decision.
- Set `height` for long documents – the page fades out towards the bottom instead of growing.

### Don't

- Don't move pointers faster than people can follow – update `cursors` at reading pace.
- Don't write agent changes straight into `blocks` when a person should approve them – send them as `suggestions`.
- Don't use more than about five agents in one document; the faces and flags crowd the page.

## Related

- [Live View](live-view.md) – Watch the agent's screen as it works – its clicks and typing drawn on top, a caption for each step, and Pause or Take over at any moment
- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Agent Lanes](agent-lanes.md) – Where every agent is right now – a live timeline with a lane per agent, tasks growing into “now”, hand-offs drawn between agents and approvals right on the block
