<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Document List

**People & profiles** · New

Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row

- **Element:** `<tc-document-list>`
- **Size:** 7.8 KB gzip · 24.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/document-list";` |
| React / Next.js | `import { DocumentList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/document-list";` · tags starting with tc- are custom elements |
| Angular | `import { DocumentList } from "@adamstavely/trenchcoat/angular/document-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/document-list";` |

## Example

The live example is in the gallery at `#/document-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The identity and record documents on file for a person or an account. Each row shows:
- the document's type and issuing country;
- its number, masked to the last four characters until someone shows it;
- your reference for it, and when it expires;
- a status pill – Active, Verified, Expired, Flagged, Fraudulent, or statuses of your own;
- a View button.

The header counts the documents in each status, so a flagged or fraudulent one stands out at once. Showing a number is
one row at a time and fires a cancelable event, so a page can ask for a reason or log it first.

### When to use

- The documents behind a customer due-diligence (KYC) or onboarding review.
- An employee's right-to-work, licence or certification records.
- Any short set of documents where each one's status matters more than its contents.

### When not to use

- A queue of items waiting for someone to check them – use [Verification Queue](verification-queue.md).
- Checking a signed evidence package – use [Attestation Check](attestation-check.md).
- One secret value to show and copy – use [Secret Field](secret-field.md).
- Hundreds of documents to sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Counts** `.ui-dlst__counts` – how many documents are in each status
2. **Row** `.ui-dlst__row` – one document
3. **Number** `.ui-dlst__number` – masked to its last four characters until shown
4. **Reference** `.ui-dlst__ref` – your own id for the record
5. **Expiry** `.ui-dlst__expiry` – when it expires, or expired
6. **Note** `.ui-dlst__note` – one line on why it's flagged or fraudulent
7. **Status** `.ui-dlst__pill` – the status as a tint, a mark and a word
8. **Show number** `.ui-dlst__reveal` – shows or masks the number again
9. **View** `.ui-dlst__view` – opens the document

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight document types. Clean
is one white card with the header as its first row. The pills, masking and buttons are the same in both.

## Usage

### HTML

```html
<tc-document-list id="docs" heading="Identity documents"></tc-document-list>

<script type="module">
  import "@adamstavely/trenchcoat/document-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const docs = document.querySelector("#docs");
  docs.documents = [
    { id: "d1", type: "Passport", country: "Spain", number: "PAE481207", reference: "DOC-2270", expires: Date.UTC(2031, 2, 14), status: "verified" },
    { id: "d2", type: "Driving licence", country: "Spain", number: "V-4471208-R", status: "flagged", note: "Expiry doesn't match the issuer's record" },
  ];
  docs.addEventListener("tc-revealed-change", (e) => console.log("revealed", e.detail.id));
  docs.addEventListener("tc-open", (e) => console.log("open", e.detail.document.id));
</script>
```

### React / Next.js

```tsx
import { DocumentList, type DocumentRecord } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const documents: DocumentRecord[] = [
  { id: "d1", type: "Passport", country: "Spain", number: "PAE481207", reference: "DOC-2270", status: "verified" },
  { id: "d2", type: "Utility bill", country: "Spain", status: "fraudulent", note: "Template matches a known forgery kit" },
];

export function Documents() {
  return <DocumentList title="Identity documents" documents={documents} onOpen={(d) => console.log(d.id)} onRevealedChange={(ids) => console.log(ids)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/document-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";

defineProps<{ documents: TcDocumentList["documents"]; statuses: TcDocumentList["statuses"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-document-list :documents="documents" :statuses="statuses" @tc-open="onOpen"></tc-document-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DocumentList } from "@adamstavely/trenchcoat/angular/document-list";
import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";

@Component({
  selector: "app-document-list-example",
  imports: [DocumentList],
  template: `<tc-document-list [documents]="documents()" [statuses]="statuses()" (tc-open)="onOpen($event)"></tc-document-list>`,
})
export class DocumentListExample {
  readonly documents = input.required<TcDocumentList["documents"]>();
  readonly statuses = input.required<TcDocumentList["statuses"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/document-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";

  let { documents, statuses }: { documents: TcDocumentList["documents"]; statuses: TcDocumentList["statuses"] } = $props();
  let el: TcDocumentList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-document-list bind:this={el} {documents} {statuses}></tc-document-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Documents"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `documents` | – | `DocumentRecord[]` | `[]` | The documents, in order |
| `statuses` | – | `Record<string, { label: string; tone: DocumentTone }>` | `{}` | Statuses' names and tones, merged over the defaults (verified, active, expired, flagged, fraudulent) |
| `masked` | `masked` | `boolean` | `true` | Masks numbers to their last four characters until revealed; set false to show them in full |
| `revealed` | – | `string[]` | `[]` | The ids whose numbers are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for expiry dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | View was pressed on a row ({ document }: DocumentOpen) |
| `tc-revealed-change` | – | Yes | A number was shown or masked again ({ revealed, id, shown }: DocumentRevealedChange); cancelable – prevented, the number stays as it was |

#### Design tokens it reads (58)

`--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultDocumentStatuses: Record<string, { label: string; tone: DocumentTone }>` | The statuses' names and tones used when the page gives none |

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
| `documents` | `el.documents = …;` | `<… documents={…} />` | `<tc-document-list :documents="…">` | `<tc-document-list [documents]="…">` | `<tc-document-list {documents}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-document-list :statuses="…">` | `<tc-document-list [statuses]="…">` | `<tc-document-list {statuses}>` |
| `revealed` | `el.revealed = …;` | `<… revealed={…} />` | `<tc-document-list :revealed="…">` | `<tc-document-list [revealed]="…">` | `<tc-document-list {revealed}>` |

*Also attributes: `heading`, `description`, `masked`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-revealed-change` | Yes | `el.addEventListener("tc-revealed-change", (e) => …)` | `ref.current.addEventListener("tc-revealed-change", …)` | `@tc-revealed-change="…"` | `(tc-revealed-change)="…($event)"` | `el.addEventListener("tc-revealed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `revealed` itself unless a listener calls `preventDefault()` on `tc-revealed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-document-list id="document-list"></tc-document-list>

<script type="module">
  import "@adamstavely/trenchcoat/document-list";

  const el = document.querySelector("#document-list");
  el.addEventListener("tc-revealed-change", (e) => {
    e.preventDefault(); // the element keeps its revealed…
    if (allowed(e.detail.revealed)) el.revealed = e.detail.revealed; // …until the app sets it
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
import "@adamstavely/trenchcoat/document-list";
import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";

const props = defineProps<{ initial: TcDocumentList["revealed"] }>();
const revealed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRevealedChange = (e: CustomEvent<{ revealed: TcDocumentList["revealed"] }>) => {
  e.preventDefault();
  revealed.value = e.detail.revealed;
};
</script>

<template>
  <tc-document-list :revealed="revealed" @tc-revealed-change="onRevealedChange"></tc-document-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DocumentList } from "@adamstavely/trenchcoat/angular/document-list";
import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";

@Component({
  selector: "app-controlled-document-list",
  imports: [DocumentList],
  template: `<tc-document-list [revealed]="revealed()" (tc-revealed-change)="onRevealedChange($event)"></tc-document-list>`,
})
export class ControlledDocumentList {
  readonly initial = input.required<TcDocumentList["revealed"]>();
  readonly revealed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRevealedChange(e: CustomEvent<{ revealed: TcDocumentList["revealed"] }>) {
    e.preventDefault();
    this.revealed.set(e.detail.revealed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/document-list";
  import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";

  let { initial }: { initial: TcDocumentList["revealed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let revealed = $derived(initial);
  let el: TcDocumentList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      revealed = (e as CustomEvent<{ revealed: TcDocumentList["revealed"] }>).detail.revealed;
    };
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-document-list bind:this={el} {revealed}></tc-document-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-document-list")` returns a `TcDocumentList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";`
- **React / Next.js:** Props: `import type { DocumentListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DocumentList>`. The element class, for refs: `import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDocumentList["documents"]` with `import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";`
- **Angular:** The directive types the template: `[documents]` takes `TcDocumentList["documents"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDocumentList } from "@adamstavely/trenchcoat/document-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `revealed` | `string[]` | The ids whose numbers are shown – controlled when given |
| `defaultRevealed` | `string[]` | The ids shown on mount when `revealed` isn't controlled |
| `onRevealedChange` | `(revealed: string[]) => void` | A number was shown or masked again; `revealed` is the new list |
| `onOpen` | `(document: DocumentRecord) => void` | View was pressed on a row |

*Renamed or hidden on the wrapper: `heading`, `revealed`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row |
| ← / → | Moves between a row's Show number and View buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the number; opens the document |
| Tab | Leaves the list |

### Screen readers

The list is named by the heading and described by “Up and down arrows move between documents, left and right between
a document's buttons”. A masked number reads “Number ending 471K, hidden”, and a shown one reads in full. Show number
is a toggle button (`aria-pressed`) labelled with the document, “Show number, Passport, Spain”. View is labelled
“View Passport, Spain”. Status pills read their word; the marks are hidden. Showing or masking a number is confirmed in
a polite status message, “Passport number shown”. The counts are a list labelled “Documents by status”.

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.8 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.3 KB** | **7.9 KB** |
| With Lit – the first component on a page | 46.2 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.4 ms** | the gallery demo's data, 187 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of documents replaced |
| First on the page | 8.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | documents: first render, 3,246 nodes; update 3.4 ms |
| 1,000 items | 140 ms | documents: first render, 32,226 nodes; update 26 ms |

1,000 items of documents: 140 ms. It renders every item, so a first render passes 50 ms (a long task) at about 360 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name types the way the issuer does: “Passport”, “National ID”, “Residence permit”.
- Give `reference` your system's id, so people can find the record elsewhere.
- Write a `note` for every flagged or fraudulent document, saying what's wrong: “Expiry date doesn't match the
  issuer's record”.
- Rename or add statuses with `statuses`: `{ pending: { label: "Pending check", tone: "warning" } }`.

## Do and don't

### Do

- Keep `masked` on wherever numbers are personal data, and log reveals from `tc-revealed-change`.
- Order documents the way reviewers check them: primary ID first.
- Pair View with a viewer that shows the scan and its checks.

### Don't

- Don't use tones for anything but how the document stands – green means verified, red means fraudulent.
- Don't put the full number in `reference` or `note`; that defeats the masking.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Related

- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Attestation Check](attestation-check.md) – Verify a signed evidence package by its hash or file – signature, chain integrity and what it covers, checked locally
- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **`tc-document-list`:** identity and record documents. - **Each document:** type, country, a masked number shown one at a time, expiry, and a status pill (Verified, Active, Expired, Flagged, Fraudulent, or your own). - **List:** counts in the header, and View per row.
