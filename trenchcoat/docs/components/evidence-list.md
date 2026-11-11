<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Evidence List

**People & profiles** · New

The exhibits behind a matter – reference, title, type, source with its grade, date, holder and a status in words, each opening onto its chain of custody with every step's hash, copyable, and whether the hashes agree

- **Element:** `<tc-evidence-list>`
- **Size:** 10.1 KB gzip · 32.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/evidence-list";` |
| React / Next.js | `import { EvidenceList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/evidence-list";` · tags starting with tc- are custom elements |
| Angular | `import { EvidenceList } from "@adamstavely/trenchcoat/angular/evidence-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/evidence-list";` |

## Example

The live example is in the gallery at `#/evidence-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The exhibits linked to a matter, and the trail behind each one. Every exhibit has its reference ("E-101"), title,
type with an icon, where it came from with an Admiralty grade tag (tinted and barred by confidence, as in
`fact-sheet`), its date, who holds it and a status in words with a mark – Sealed, In analysis, Decryption pending,
Transcribed, Released, or the page's own. The header counts them and says when they were last synced, and a note can
say where the originals live. Open an exhibit to see its chain of custody: every hand it passed through, in order,
with the hash recorded at each step – copyable – and a line saying whether the hashes agree.

### When to use

- Legal, compliance and audit matters where the exhibits and their handling must be shown.
- Internal investigations that link to an evidence or records system.
- Any list of items whose provenance and integrity matter as much as their content.

### When not to use

- Identity or record documents with their numbers and expiry – use [Document List](document-list.md).
- Facts with their sources and grades – use [Fact Sheet](fact-sheet.md).
- Versions of one document over time – use [Version History](version-history.md).
- Who appears together across events – use [Co-Occurrence](co-occurrence.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-evl__count` – how many exhibits are linked, and when they were last synced
2. **Note** `.ui-evl__note` – where the originals are kept
3. **Exhibit** `.ui-evl__row` – type icon, reference, title, type, source tag, date, holder and status
4. **Source tag** `.ui-evl__tag` – the source and its grade, tinted and barred by confidence
5. **Status** `.ui-evl__status` – a mark and a word
6. **Chain of custody** `.ui-evl__custody` – every step with when, who, what, where and the hash
7. **Integrity** `.ui-evl__integrity` – whether the hashes agree

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The rows, tags and custody trail are the same in both.

## Usage

### HTML

```html
<tc-evidence-list id="evl" note="Exhibits are kept in the evidence system; these are linked references."></tc-evidence-list>

<script type="module">
  import "@adamstavely/trenchcoat/evidence-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const evl = document.querySelector("#evl");
  evl.exhibits = [
    {
      id: "e101",
      ref: "E-101",
      title: "Signed supply agreement",
      type: "document",
      source: { label: "Client", grade: "A1" },
      status: "sealed",
      custody: [{ at: Date.parse("2026-05-03T09:00"), actor: "M. Tan (paralegal)", action: "Collected", hash: "sha256:9f2c…" }],
    },
  ];
  evl.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EvidenceList, type Exhibit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const exhibits: Exhibit[] = [
  { id: "e101", ref: "E-101", title: "Signed supply agreement", type: "document", source: { label: "Client", grade: "A1" }, status: "sealed" },
  { id: "e112", ref: "E-112", title: "Recorded call, 14 min", type: "audio", status: "transcribed" },
];

export function Exhibits() {
  const [selected, setSelected] = useState<string | null>(null);
  return <EvidenceList title="Linked evidence" exhibits={exhibits} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/evidence-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";

defineProps<{ exhibits: TcEvidenceList["exhibits"]; statuses: TcEvidenceList["statuses"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-evidence-list :exhibits="exhibits" :statuses="statuses" @tc-selected-change="onSelectedChange"></tc-evidence-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EvidenceList } from "@adamstavely/trenchcoat/angular/evidence-list";
import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";

@Component({
  selector: "app-evidence-list-example",
  imports: [EvidenceList],
  template: `<tc-evidence-list [exhibits]="exhibits()" [statuses]="statuses()" (tc-selected-change)="onSelectedChange($event)"></tc-evidence-list>`,
})
export class EvidenceListExample {
  readonly exhibits = input.required<TcEvidenceList["exhibits"]>();
  readonly statuses = input.required<TcEvidenceList["statuses"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evidence-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";

  let { exhibits, statuses }: { exhibits: TcEvidenceList["exhibits"]; statuses: TcEvidenceList["statuses"] } = $props();
  let el: TcEvidenceList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-evidence-list bind:this={el} {exhibits} {statuses}></tc-evidence-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Linked evidence"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `exhibits` | – | `Exhibit[]` | `[]` | The exhibits, in the order given |
| `statuses` | – | `Record<string, ExhibitStatusDef>` | `{}` | The statuses, merged over the defaults (sealed, analysis, pending, transcribed, released) |
| `synced` | `synced` | `number \| undefined` | `undefined` | When the list was last synced, epoch ms – shown in the header |
| `note` | `note` | `string \| undefined` | `undefined` | A quiet line above the list, e.g. where the originals are kept |
| `selected` | `selected` | `string \| null` | `null` | The open exhibit's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | An exhibit was opened or closed ({ selected, exhibit }: EvidenceSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-copy` | – | Yes | A hash's Copy was pressed ({ exhibit, hash }: EvidenceCopy); cancelable – prevented, the element doesn't copy |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-evl-lead` | `32px` | both |

#### Design tokens it reads (74)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultExhibitStatuses: Record<string, ExhibitStatusDef>` | The statuses used when the page gives none |

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
| `exhibits` | `el.exhibits = …;` | `<… exhibits={…} />` | `<tc-evidence-list :exhibits="…">` | `<tc-evidence-list [exhibits]="…">` | `<tc-evidence-list {exhibits}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-evidence-list :statuses="…">` | `<tc-evidence-list [statuses]="…">` | `<tc-evidence-list {statuses}>` |

*Also attributes: `heading`, `description`, `synced`, `note`, `selected`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyHash={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-evidence-list id="evidence-list"></tc-evidence-list>

<script type="module">
  import "@adamstavely/trenchcoat/evidence-list";

  const el = document.querySelector("#evidence-list");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/evidence-list";
import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";

const props = defineProps<{ initial: TcEvidenceList["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcEvidenceList["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-evidence-list :selected="selected" @tc-selected-change="onSelectedChange"></tc-evidence-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EvidenceList } from "@adamstavely/trenchcoat/angular/evidence-list";
import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";

@Component({
  selector: "app-controlled-evidence-list",
  imports: [EvidenceList],
  template: `<tc-evidence-list [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-evidence-list>`,
})
export class ControlledEvidenceList {
  readonly initial = input.required<TcEvidenceList["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcEvidenceList["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/evidence-list";
  import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";

  let { initial }: { initial: TcEvidenceList["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcEvidenceList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcEvidenceList["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-evidence-list bind:this={el} {selected}></tc-evidence-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-evidence-list")` returns a `TcEvidenceList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";`
- **React / Next.js:** Props: `import type { EvidenceListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EvidenceList>`. The element class, for refs: `import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEvidenceList["exhibits"]` with `import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";`
- **Angular:** The directive types the template: `[exhibits]` takes `TcEvidenceList["exhibits"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEvidenceList } from "@adamstavely/trenchcoat/evidence-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The open exhibit's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The exhibit open on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, exhibit?: Exhibit) => void` | An exhibit was opened or closed; `exhibit` is the opened one |
| `onCopyHash` | `(exhibit: string, hash: string) => boolean \| void` | A hash's Copy was pressed; return false to copy it yourself instead |

*Renamed or hidden on the wrapper: `heading`, `selected`, `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The exhibits are one tab stop; inside an open custody trail, Tab reaches each Copy button.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next exhibit |
| Home / End | Moves to the first or last exhibit |
| Enter / Space | Opens the exhibit's chain of custody, or closes it |
| Escape | Closes the open trail and returns focus to its exhibit |

### Screen readers

The exhibits are a list named by the heading; each is a button with `aria-expanded`, reading its reference, title,
type, source with its grade and confidence, date, status and holder – “E-101, Signed supply agreement, Document, source
Client, grade A1, high confidence, 3 May 2026, Sealed, Evidence room B”. An open trail is a region named “Chain of
custody for E-101”, its steps an ordered list. Each Copy button is named for its step – “Copy the hash from step 2”.
Opening, closing and copying are confirmed in a polite status message.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.9 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **32.9 KB** | **10.1 KB** |
| With Lit – the first component on a page | 54.7 KB | 17.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.6 ms** | the gallery demo's data, 236 DOM nodes – to layout, median of 7 |
| Typical update | **1.3 ms** | one item of exhibits replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 28 ms | exhibits: first render, 3,043 nodes; update 7.4 ms |
| 1,000 items | 153 ms | exhibits: first render, 29,893 nodes; update 54 ms |

1,000 items of exhibits: 153 ms. It renders every item, so a first render passes 50 ms (a long task) at about 330 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the reference people say out loud as `ref` – “E-101” – and a plain title.
- Write each custody `action` as a past-tense verb: “Collected”, “Sealed”, “Transferred”, “Returned”.
- Name the `actor` with their role: “M. Tan (paralegal)”.
- Grade sources with the Admiralty scale, so the tags read the same as in `fact-sheet`.

## Do and don't

### Do

- Record a hash at every step that touches the exhibit, so integrity can be checked end to end.
- Set `synced` and `note` when the list mirrors another system.

### Don't

- Don't use the status tints for anything but the exhibit's state.
- Don't drop custody steps to keep the trail short – the gaps are what people look for.

## Related

- [Fact Sheet](fact-sheet.md) – What's known and how far to trust it – facts in sections, each value tagged with its source and an Admiralty grade, tinted and marked by confidence, with conflicting readings side by side and unknowns said plainly
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
- [Co-Occurrence](co-occurrence.md) – Who keeps turning up alongside a subject – accounts, cards, devices or people ranked by shared events, each with a strength in words and bars, a score, the share of events, a count per source and when last seen, opening onto the shared events themselves
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour

## Changelog

- **evidence-list:** hashes are compared as digests (case, spaces, prefix spelling); different algorithms read "Hashes not compared", not a mismatch.
- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
