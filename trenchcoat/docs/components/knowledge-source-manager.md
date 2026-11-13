<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Knowledge Source Manager

**AI configuration** · New

Sources a knowledge base answers from – ingestion state and progress, docs and chunks, sync schedule, stale and duplicate warnings, and a handoff to chunk review

- **Element:** `<tc-knowledge-source-manager>`
- **Size:** 17.6 KB gzip · 62.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/knowledge-source-manager";` |
| React / Next.js | `import { KnowledgeSourceManager } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/knowledge-source-manager";` · tags starting with tc- are custom elements |
| Angular | `import { KnowledgeSourceManager } from "@adamstavely/trenchcoat/angular/knowledge-source-manager";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/knowledge-source-manager";` |

## Example

The live example is in the gallery at `#/knowledge-source-manager`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Lists the sources a knowledge base answers from – files, sites and connectors – and where each one stands: queued,
indexing with its progress, ready, paused, or failed with the reason. Every row shows its documents and chunks, when it
last synced and how often it syncs, and a Stale or Duplicate flag when the app raises one. Picking a source opens it
beside the list with its warnings explained, its sync schedule, and Review chunks, Resync, Pause and Remove; Remove
asks first and says what leaves the index. It stays fast with thousands of sources. The element ingests nothing –
Add, Resync, Pause and Review chunks are events, and the app reports progress back through `sources`.

With `add-inline`, Add source opens an **Add sources** panel at the top of the card instead of firing `tc-add`. It has
three ways in:

- **Files:** a drop area and Choose files, limited by `accept` and `max-file-size`.
- **Links:** one or many, on lines or with spaces between them. Each is checked, and links already waiting or already
  a source are dropped. You choose how far to crawl: this page only, or the section of the site under it.
- **Paste text:** pasted text with a title.

Everything waiting shows as a row with its type and size, and can be taken off again. Add fires `tc-sources-add` with
the files, links, crawl depth and texts. Unless that's prevented, the new sources join the list as queued through
`tc-sources-change` (`type: "add"`), until the app passes the real ones.

### When to use

- The sources page of an assistant, a help-centre search or any product built on retrieval.
- Anywhere people need to see why answers are missing something: a failed import, a stale site, two copies of the
  same documents.
- As the first step of a knowledge workflow, handing off to chunk review and to `retrieval-settings`.
- Letting people add files, links and notes in place, with `add-inline`, when the app has no picker of its own.

### When not to use

- Uploading files and watching each upload's progress – use [Dropzone](dropzone.md), then add the uploads as a source. The Add
  sources panel hands files over without uploading them.
- Tuning how sources are searched – use [Retrieval Settings](retrieval-settings.md).
- Seeing which chunks one answer used – use [Retrieval Inspector](retrieval-inspector.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a book icon, the title, how many sources and chunks there are, and Add source
2. **Filter** `.ui-ksm__show` – All, or Needs attention with its count
3. **Source** `.ui-ksm__row` – name and flags, counts and sync (or the failure), and the state
4. **State** `.ui-ksm__state` – an icon and a label; a ring that fills while indexing
5. **Open source** `.ui-ksm__detail` – facts, warnings, the schedule and the actions
6. **Add sources** `.ui-ksm__adder` – with `add-inline`: the drop area `.ui-ksm__drop`, links `.ui-ksm__links` with

## Looks

Standard is a gray tray holding the header and Add source, with the list on a white card; kinds sit on tinted tiles
and states are tinted pills. Clean is one white card with hairline dividers: outlined kind tiles, states as a coloured
icon and plain label, thinner icons. Wide, the open source sits beside the list; narrow, below it, and in a narrow
container the state shows as its icon alone.

## Usage

### HTML

```html
<tc-knowledge-source-manager id="ksm"></tc-knowledge-source-manager>

<script type="module">
  import "@adamstavely/trenchcoat/knowledge-source-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const ksm = document.querySelector("#ksm");
  ksm.now = Date.now();
  ksm.sources = [
    { id: "help", name: "Help centre", kind: "site", state: "ready", docs: 1204, chunks: 18310, lastSync: Date.now() - 7200000, schedule: "daily" },
    { id: "docs", name: "Product docs", kind: "connector", state: "indexing", progress: 0.4 },
  ];
  ksm.addEventListener("tc-resync", (e) => console.log("sync", e.detail.source.id));
  ksm.addEventListener("tc-review-chunks", (e) => console.log("review", e.detail.source.id));
  // Add source opens the built-in panel: files, links and pasted text
  ksm.addInline = true;
  ksm.accept = ".pdf,.docx,.md";
  ksm.addEventListener("tc-sources-add", (e) => console.log("ingest", e.detail.files, e.detail.urls, e.detail.depth, e.detail.texts));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { KnowledgeSourceManager, type KnowledgeSource } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Sources({ initial }: { initial: KnowledgeSource[] }) {
  const [sources, setSources] = useState(initial);
  return (
    <KnowledgeSourceManager
      sources={sources}
      onSourcesChange={setSources}
      accept=".pdf,.docx,.md"
      onSourcesAdd={({ files, urls, depth, texts }) => console.log("ingest", files, urls, depth, texts)}
      onResync={(s) => setSources((list) => list.map((x) => (x.id === s.id ? { ...x, state: "queued" } : x)))}
      onReviewChunks={(s) => console.log("review", s.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/knowledge-source-manager";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";

defineProps<{ sources: TcKnowledgeSourceManager["sources"]; schedules: TcKnowledgeSourceManager["schedules"] }>();
const onSourcesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-knowledge-source-manager :sources="sources" :schedules="schedules" @tc-sources-change="onSourcesChange"></tc-knowledge-source-manager>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { KnowledgeSourceManager } from "@adamstavely/trenchcoat/angular/knowledge-source-manager";
import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";

@Component({
  selector: "app-knowledge-source-manager-example",
  imports: [KnowledgeSourceManager],
  template: `<tc-knowledge-source-manager [sources]="sources()" [schedules]="schedules()" (tc-sources-change)="onSourcesChange($event)"></tc-knowledge-source-manager>`,
})
export class KnowledgeSourceManagerExample {
  readonly sources = input.required<TcKnowledgeSourceManager["sources"]>();
  readonly schedules = input.required<TcKnowledgeSourceManager["schedules"]>();
  onSourcesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/knowledge-source-manager";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";

  let { sources, schedules }: { sources: TcKnowledgeSourceManager["sources"]; schedules: TcKnowledgeSourceManager["schedules"] } = $props();
  let el: TcKnowledgeSourceManager;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-sources-change", on);
    return () => el.removeEventListener("tc-sources-change", on);
  });
</script>

<tc-knowledge-source-manager bind:this={el} {sources} {schedules}></tc-knowledge-source-manager>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Knowledge sources"` | The heading |
| `sources` | – | `KnowledgeSource[]` | `[]` | The sources. Changed by the user (remove, schedule) unless a tc-sources-change listener calls preventDefault() |
| `schedules` | – | `KnowledgeSchedule[]` | `[ { id: "manual", label: "Manually" }, { id: "hourly", label: "Every hour" }, { id: "daily", label: "Daily" }, { id: "weekly", label: "Weekly" }, ]` | The sync schedules a source can be set to |
| `selected` | `selected` | `string \| null` | `null` | The id of the open source, or null |
| `show` | `show` | `KnowledgeShow` | `"all"` | Which sources show: "all", or "attention" – the failed, stale and duplicate ones |
| `now` | `now` | `number \| undefined` | `undefined` | The moment last syncs are counted to, in epoch ms; unset shows their dates |
| `addLabel` | `add-label` | `string` | `"Add source"` | The Add source button's text |
| `noAdd` | `no-add` | `boolean` | `false` | Hides Add source, for a read-only view |
| `noReview` | `no-review` | `boolean` | `false` | Hides Review chunks, when the app has no chunk review |
| `maxHeight` | `max-height` | `number` | `420` | The list's height before it scrolls, in px |
| `addInline` | `add-inline` | `boolean` | `false` | Add source opens the Add sources panel – files, links and pasted text – instead of firing tc-add |
| `accept` | `accept` | `string` | `""` | The files the panel's picker and drop area take, as an input's `accept`: ".pdf,.docx,text/*" |
| `maxFileSize` | `max-file-size` | `number \| undefined` | `undefined` | The largest file the panel takes, in bytes; larger ones are turned away with a reason |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-sources-change` | – | Yes | A source was removed, its schedule changed, or sources were added from the Add sources panel ({ sources, change: { type, source, added } }: KnowledgeSourcesChange); cancelable – prevent it to control `sources` |
| `tc-selected-change` | – | Yes | A source was picked or the open one closed ({ selected, source }: KnowledgeSelectedChange); cancelable |
| `tc-show-change` | – | Yes | All or Needs attention was picked ({ show }: KnowledgeShowChange); cancelable |
| `tc-add` | – | No | Add source was pressed – open your own picker; detail: null |
| `tc-resync` | – | No | Resync (or Retry, for a failed source) was pressed ({ source }: KnowledgeSourceEvent) |
| `tc-pause` | – | No | Pause or Resume was pressed ({ source, paused }: KnowledgePauseEvent – `paused` is what was asked for) |
| `tc-review-chunks` | – | No | Review chunks was pressed – open your chunk review for the source ({ source }: KnowledgeSourceEvent) |
| `tc-sources-add` | – | Yes | With `addInline`, Add was pressed in the Add sources panel ({ files, urls, depth, texts }: KnowledgeSourcesAdd); cancelable – prevented, the panel closes without listing them as queued sources |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-knowledge-source-manager-row` | `60px` | both |
| `--tc-knowledge-source-manager-side` | `340px` | both |

#### Design tokens it reads (107)

`--tc-accent`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `knowledgeUrl(typed: string): string \| null` | A link as typed, made whole: a scheme added when it has none; null when it isn't an http(s) address |

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
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-knowledge-source-manager :sources="…">` | `<tc-knowledge-source-manager [sources]="…">` | `<tc-knowledge-source-manager {sources}>` |
| `schedules` | `el.schedules = …;` | `<… schedules={…} />` | `<tc-knowledge-source-manager :schedules="…">` | `<tc-knowledge-source-manager [schedules]="…">` | `<tc-knowledge-source-manager {schedules}>` |

*Also attributes: `heading`, `selected`, `show`, `now`, `add-label`, `no-add`, `no-review`, `max-height` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-sources-change` | Yes | `el.addEventListener("tc-sources-change", (e) => …)` | `onChange={…}` | `@tc-sources-change="…"` | `(tc-sources-change)="…($event)"` | `el.addEventListener("tc-sources-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-show-change` | Yes | `el.addEventListener("tc-show-change", (e) => …)` | `ref.current.addEventListener("tc-show-change", …)` | `@tc-show-change="…"` | `(tc-show-change)="…($event)"` | `el.addEventListener("tc-show-change", …)` |
| `tc-add` | No | `el.addEventListener("tc-add", (e) => …)` | `onAdd={…}` | `@tc-add="…"` | `(tc-add)="…($event)"` | `el.addEventListener("tc-add", …)` |
| `tc-resync` | No | `el.addEventListener("tc-resync", (e) => …)` | `onResync={…}` | `@tc-resync="…"` | `(tc-resync)="…($event)"` | `el.addEventListener("tc-resync", …)` |
| `tc-pause` | No | `el.addEventListener("tc-pause", (e) => …)` | `onPauseChange={…}` | `@tc-pause="…"` | `(tc-pause)="…($event)"` | `el.addEventListener("tc-pause", …)` |
| `tc-review-chunks` | No | `el.addEventListener("tc-review-chunks", (e) => …)` | `onReviewChunks={…}` | `@tc-review-chunks="…"` | `(tc-review-chunks)="…($event)"` | `el.addEventListener("tc-review-chunks", …)` |
| `tc-sources-add` | Yes | `el.addEventListener("tc-sources-add", (e) => …)` | `onSourcesAdd={…}` | `@tc-sources-add="…"` | `(tc-sources-add)="…($event)"` | `el.addEventListener("tc-sources-add", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `sources`, `selected` and `show` itself unless a listener calls `preventDefault()` on `tc-sources-change`, `tc-selected-change` or `tc-show-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-knowledge-source-manager id="knowledge-source-manager"></tc-knowledge-source-manager>

<script type="module">
  import "@adamstavely/trenchcoat/knowledge-source-manager";

  const el = document.querySelector("#knowledge-source-manager");
  el.addEventListener("tc-sources-change", (e) => {
    e.preventDefault(); // the element keeps its sources…
    if (allowed(e.detail.sources)) el.sources = e.detail.sources; // …until the app sets it
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
import "@adamstavely/trenchcoat/knowledge-source-manager";
import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";

const props = defineProps<{ initial: TcKnowledgeSourceManager["sources"] }>();
const sources = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSourcesChange = (e: CustomEvent<{ sources: TcKnowledgeSourceManager["sources"] }>) => {
  e.preventDefault();
  sources.value = e.detail.sources;
};
</script>

<template>
  <tc-knowledge-source-manager :sources="sources" @tc-sources-change="onSourcesChange"></tc-knowledge-source-manager>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { KnowledgeSourceManager } from "@adamstavely/trenchcoat/angular/knowledge-source-manager";
import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";

@Component({
  selector: "app-controlled-knowledge-source-manager",
  imports: [KnowledgeSourceManager],
  template: `<tc-knowledge-source-manager [sources]="sources()" (tc-sources-change)="onSourcesChange($event)"></tc-knowledge-source-manager>`,
})
export class ControlledKnowledgeSourceManager {
  readonly initial = input.required<TcKnowledgeSourceManager["sources"]>();
  readonly sources = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSourcesChange(e: CustomEvent<{ sources: TcKnowledgeSourceManager["sources"] }>) {
    e.preventDefault();
    this.sources.set(e.detail.sources);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/knowledge-source-manager";
  import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";

  let { initial }: { initial: TcKnowledgeSourceManager["sources"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let sources = $derived(initial);
  let el: TcKnowledgeSourceManager;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      sources = (e as CustomEvent<{ sources: TcKnowledgeSourceManager["sources"] }>).detail.sources;
    };
    el.addEventListener("tc-sources-change", on);
    return () => el.removeEventListener("tc-sources-change", on);
  });
</script>

<tc-knowledge-source-manager bind:this={el} {sources}></tc-knowledge-source-manager>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-knowledge-source-manager")` returns a `TcKnowledgeSourceManager` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";`
- **React / Next.js:** Props: `import type { KnowledgeSourceManagerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof KnowledgeSourceManager>`. The element class, for refs: `import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcKnowledgeSourceManager["sources"]` with `import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";`
- **Angular:** The directive types the template: `[sources]` takes `TcKnowledgeSourceManager["sources"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcKnowledgeSourceManager } from "@adamstavely/trenchcoat/knowledge-source-manager";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `sources` | `KnowledgeSource[]` | The sources – controlled when given |
| `defaultSources` | `KnowledgeSource[]` | The sources on mount when `sources` isn't controlled |
| `onSourcesChange` | `(sources: KnowledgeSource[], change: KnowledgeSourcesChange["change"]) => void` | The sources changed: one was removed, its schedule changed, or new ones were added as queued from the panel |
| `selected` | `string \| null` | The open source's id – controlled when given (null for none) |
| `onSelectedChange` | `(selected: string \| null) => void` | A source was picked or the open one closed |
| `show` | `KnowledgeShow` | Which sources show – controlled when given |
| `onShowChange` | `(show: KnowledgeShow) => void` | All or Needs attention was picked |
| `onAdd` | `() => void` | Add source was pressed – open your picker; without it (or onSourcesAdd) there's no Add source button |
| `onSourcesAdd` | `(add: KnowledgeSourcesAdd) => boolean \| void` | Given, Add source opens the built-in Add sources panel – files, links and pasted text – and this is called with what to add. Start ingesting them; return false to stop them being listed as queued (you'll pass the real ones) |
| `onResync` | `(source: KnowledgeSource) => void` | Resync or Retry was pressed |
| `onPauseChange` | `(source: KnowledgeSource, paused: boolean) => void` | Pause or Resume was pressed; `paused` is what was asked for |
| `onReviewChunks` | `(source: KnowledgeSource) => void` | Review chunks was pressed – open your chunk review; without it there's no Review chunks button |

*Renamed or hidden on the wrapper: `heading`, `sources`, `selected`, `show`, `noAdd`, `noReview`, `addInline`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Add source, the filter, the list, then the open source's controls |
| ↑ / ↓ | In the list: moves to the previous or next source and opens it |
| Home / End | In the list: the first or last source |
| Page Up / Page Down | In the list: eight sources up or down |
| Delete / Backspace | In the list: asks to remove the source in focus (focus goes to Cancel) |
| Escape | In the list or the open source: closes it; while confirming a removal, cancels and returns to Remove |
| ← / → / ↑ / ↓ | In the filter: switches between All and Needs attention |
| Enter / Space | On Add source with `add-inline`: opens or closes the Add sources panel, focusing Choose files |
| ⌘ Enter / Ctrl Enter | In the links field: adds the links to the waiting list |
| Escape | Anywhere in the Add sources panel: closes it, dropping what's waiting, and returns to Add source |

The crawl choice is a pair of native radio buttons, moved with the arrow keys. Taking an item off the waiting list moves
focus to the next one's Remove.

After a removal the next source opens and focus returns to the list; when the last source goes, focus moves to Add
source.

### Screen readers

The list is a `listbox` named by the heading, with `aria-activedescendant` on the active `option`; options carry
`aria-posinset` and `aria-setsize`, so a windowed list still reads “1,204 of 2,000”. Each option reads its name, its
flags, its state and its line – “Product docs, Indexing 42%. 860 docs · 9.4k chunks · Synced 1 day ago · Every hour”.
The open source is a section named by the source; indexing shows a `progressbar` named “Indexing Product docs”. The
removal question is a group named by its sentence – “Remove Pricing PDFs? Its 240 chunks leave the index and answers
stop citing it.” A status region says when a source finishes or fails (“Product docs is ready”, “Pricing PDFs failed:
…”), when one is removed, and how many sources the filter shows.

With `add-inline`, Add source says whether the panel is expanded. The panel is a section named “Add sources”. Choose
files is described by the drop area's line, which gives the allowed types and size. The links field is labelled
“Links”; when some entries aren't links it's `aria-invalid` and described by which ones. The crawl choice is a group
named “Crawl”, and Paste text says whether it's expanded. The waiting list is a list named “To add”. Each row reads its
name, type and size (“Q3-ledger.pdf, PDF · 1.2 MB”), and its Remove button is named “Remove Q3-ledger.pdf”. The status
region says what joined the list, what was turned away and why (“Scan.tiff isn't a type this takes”), what was
already there, and “Adding 3 sources” once added. Add is `aria-disabled` while nothing is waiting, and pressing it then
says what to do first.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 52.6 KB | 14.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **62.8 KB** | **17.6 KB** |
| With Lit – the first component on a page | 85.9 KB | 25.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 160 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of sources replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 5.9 ms | sources: first render, 820 nodes; update 1.9 ms |

Windowed: 10,000 items of sources render 820 nodes in 5.9 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name sources as people know them – “Help centre”, “Pricing PDFs” – and put the path or URL in `location`.
- Write `error` as what went wrong and what fixes it: “3 of 14 files are scanned images with no text. Upload text
  versions or turn on OCR.”
- Pass `stale` as the reason when you have one (“12 pages changed since”); `true` gets a generic line.
- Point `duplicateOf` at the other source's id, so the warning names it.
- Set `accept` to what the indexer really reads, so the drop area turns the rest away with a reason before Add.

## Do and don't

### Do

- Send `now`, so last syncs read “2h ago” rather than a date.
- Move sources through queued → indexing → ready yourself and pass `progress`; the element only shows it.
- Wire `onReviewChunks` to your chunk editor, so a stale or duplicate source can be checked before it's removed.
- Start ingesting on `tc-sources-add`, then replace the queued placeholders with your own sources and ids.

### Don't

- Don't remove a source without the confirmation – chunks leave the index and answers change.
- Don't mark sources stale on a timer alone; say what changed.
- Don't use it as an upload queue – a source is something that syncs, not a one-off file transfer.
- Don't crawl a whole site when people chose this page only – `depth` is their decision about what's answered from.

## Related

- [Retrieval Settings](retrieval-settings.md) – Chunking, top-k, a score threshold, keyword ↔ vector balance, reranking and metadata filters, edited on a picture of the pipeline, with the app's cost and latency
- [Retrieval Inspector](retrieval-inspector.md) – What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it
- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Kill Switch](kill-switch.md) – System posture and the emergency stop – what's running, a confirmed Stop that says what it halts, and resume
