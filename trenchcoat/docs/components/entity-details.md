<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Entity Details

**People & profiles** · New

Email addresses, phone numbers, links and @handles in text, found and marked – hover, focus or right-click one for its domain, country or site (with an http warning), Copy, Write email / Call / Open, and what your directory knows about it

- **Element:** `<tc-entity-details>`
- **Size:** 15.1 KB gzip · 43.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/entity-details";` |
| React / Next.js | `import { EntityDetails } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/entity-details";` · tags starting with tc- are custom elements |
| Angular | `import { EntityDetails } from "@adamstavely/trenchcoat/angular/entity-details";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/entity-details";` |

## Example

The live example is in the gallery at `#/entity-details`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Text that mentions people and places to reach – a hand-over note, a ticket, a chat message, a model's answer – with
every email address, phone number, link and @handle found and marked. Hover one for a moment, focus it or right-click
it, and a card shows what it is: an address's mailbox and domain with Write email, a number's country and Call, a
link's site and path with Open (and a warning when it isn't encrypted), a handle's server – each with Copy – and
whatever your app knows about it: a name, a picture, a sentence, more facts and links.

It reads addresses, international numbers ("+44 20 7946 0958", "+14155550142") and national ones with ten or eleven
digits ("(555) 010-4477", "020 7946 0958"), http and https links and bare "www." ones, and handles ("@ops_lead",
"@analyst@social.example.org"). Dates, version numbers, IP addresses, card numbers, long ids and the @ inside an
address stay plain text.

### When to use

- Notes, tickets and messages where readers want to know who an address or number belongs to without leaving the page.
- Model answers that cite links or contacts, so a reader can see where a link really goes before opening it.
- Anywhere people copy contact details into another tool.

### When not to use

- A person's contact details as the main content – use [Contact Channels](contact-channels.md) or [Person Links](person-links.md).
- DOIs, IP addresses, hashes and CVE ids – use [Identifier Details](identifier-details.md).
- Coordinates – use [Coordinate Details](coordinate-details.md); book numbers – use [ISBN Details](isbn-details.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Text** `.ui-ent__text` – the passage, shown as written
2. **Marks** `.ui-ent__mark` – an address, number, link or handle found in the text, focusable; `data-kind` says which
3. **Card** `.ui-ent__pop` – opened by hover, focus or right-click
4. **Kind and value** `.ui-ent__head` – an icon (or the app's picture), what it is, and the value
5. **Facts** `.ui-ent__facts` – what follows from the value itself: domain, country, site and path, security, server
6. **What the app knows** `.ui-ent__more` – a name, a sentence, more fields and links; or loading, an error with
7. **Actions** `.ui-ent__actions` – Copy, and Write email, Call or Open

## Looks

Standard tints each mark with a soft accent fill and a solid underline, and gives the kind a tinted icon. Clean marks
with a dotted underline only and frames the icon with a hairline. The card is the shared floating surface in both.

## Usage

### HTML

```html
<tc-entity-details id="note"></tc-entity-details>

<script type="module">
  import "@adamstavely/trenchcoat/entity-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const note = document.querySelector("#note");
  note.text = "Incident lead: priya.natarajan@example.org (+44 20 7946 0958). Ping @ops_lead.";
  note.resolve = async (kind, value, signal) => {
    const res = await fetch(`/api/directory?kind=${kind}&value=${encodeURIComponent(value)}`, { signal });
    return res.status === 404 ? null : res.json();
  };
  note.addEventListener("tc-copy", (e) => console.log("copied", e.detail.kind, e.detail.text));
</script>
```

### React / Next.js

```tsx
import { EntityDetails, type EntityInfo } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const directory: Record<string, EntityInfo> = {
  "email:priya.natarajan@example.org": { name: "Priya Natarajan", summary: "Security operations lead" },
};

export function HandOver() {
  return (
    <EntityDetails
      text="Incident lead: priya.natarajan@example.org, desk +44 20 7946 0958."
      resolve={(kind, value) => directory[`${kind}:${value}`] ?? null}
      onCopy={(text) => console.log("copied", text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/entity-details";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";

defineProps<{ kinds: TcEntityDetails["kinds"]; resolve: TcEntityDetails["resolve"] }>();
const onEntityLookup = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-entity-details :kinds="kinds" :resolve="resolve" @tc-entity-lookup="onEntityLookup"></tc-entity-details>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EntityDetails } from "@adamstavely/trenchcoat/angular/entity-details";
import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";

@Component({
  selector: "app-entity-details-example",
  imports: [EntityDetails],
  template: `<tc-entity-details [kinds]="kinds()" [resolve]="resolve()" (tc-entity-lookup)="onEntityLookup($event)"></tc-entity-details>`,
})
export class EntityDetailsExample {
  readonly kinds = input.required<TcEntityDetails["kinds"]>();
  readonly resolve = input.required<TcEntityDetails["resolve"]>();
  onEntityLookup(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/entity-details";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";

  let { kinds, resolve }: { kinds: TcEntityDetails["kinds"]; resolve: TcEntityDetails["resolve"] } = $props();
  let el: TcEntityDetails;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-entity-lookup", on);
    return () => el.removeEventListener("tc-entity-lookup", on);
  });
</script>

<tc-entity-details bind:this={el} {kinds} {resolve}></tc-entity-details>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string` | `""` | The text to find contact details in: plain text, shown as written (line breaks kept) |
| `kinds` | – | `EntityKind[]` | `[...entityKinds]` | Which kinds to find: "email", "phone", "url", "handle" |
| `resolve` | – | `EntityResolver \| undefined` | `undefined` | Supplies details for an address, number, link or handle – details, null for none, or a promise; used when no tc-entity-lookup listener responds |
| `trigger` | `trigger` | `EntityTrigger` | `"both"` | What opens a card: "both" (hover, focus and right-click), "hover" (hover and focus) or "contextmenu" (right-click, Menu key, Enter) |
| `hoverDelay` | `hover-delay` | `number` | `300` | How long the pointer rests on a mark before its card opens, ms |
| `kindLabels` | – | `Partial<Record<EntityKind, string>>` | `{}` | What each kind is called on its card, merged over the defaults |
| `notFoundText` | `not-found-text` | `string` | `"Nothing more known."` | What the card says when the app knows nothing more |
| `errorText` | `error-text` | `string` | `"Couldn't load the details."` | What the card says when the lookup failed |
| `entities` | – | `EntityMatch[]` | – | The addresses, numbers, links and handles found in `text`, in order |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-entity-lookup` | – | Yes | A card needs details ({ kind, value, text, signal, respondWith }: EntityLookupDetail); cancelable – call respondWith() with the details (or a promise), or prevent it without responding for "nothing more known" |
| `tc-copy` | – | Yes | Copy was pressed ({ text, kind }: EntityCopyDetail); cancelable – prevent it to copy your own way |
| `tc-open` | – | Yes | A link in the card is about to open ({ kind, value, url }: EntityOpenDetail); cancelable – prevented, the link doesn't open |
| `tc-open-change` | – | No | A card opened or closed ({ open }: EntityOpenChange; null when closed) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `clearCache(entity?: { kind: EntityKind; value: string })` | `void` | Forgets cached details – one entity's, or all of them – so the next card asks again |
| `openCard(index: unknown)` | `void` | Opens the card for the entity at `index` in `entities`, pinned open; focus stays where it is |
| `closeCard()` | `void` | Closes the open card, if any |

#### Design tokens it reads (40)

`--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-border-default`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `entityKinds: readonly EntityKind[]` | Every kind, in the order overlapping matches are settled: a link beats the address inside it |
| `defaultEntityKindLabels: Record<EntityKind, string>` | What each kind is called on its card |
| `findEntities(text: string, kinds: readonly EntityKind[]): EntityMatch[]` | Every email address, phone number, link and |
| `phoneCountry(value: string): string \| undefined` | The country for an international number, from its calling code |

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
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-entity-details :kinds="…">` | `<tc-entity-details [kinds]="…">` | `<tc-entity-details {kinds}>` |
| `resolve` | `el.resolve = …;` | `<… resolve={…} />` | `<tc-entity-details :resolve="…">` | `<tc-entity-details [resolve]="…">` | `<tc-entity-details {resolve}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-entity-details :kindLabels="…">` | `<tc-entity-details [kindLabels]="…">` | `<tc-entity-details {kindLabels}>` |

*Also attributes: `text`, `trigger`, `hover-delay`, `not-found-text`, `error-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-entity-lookup` | Yes | `el.addEventListener("tc-entity-lookup", (e) => …)` | `onLookup={…}` | `@tc-entity-lookup="…"` | `(tc-entity-lookup)="…($event)"` | `el.addEventListener("tc-entity-lookup", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpenLink={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

`tc-entity-lookup`, `tc-copy`, `tc-open` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-entity-details")` returns a `TcEntityDetails` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";`
- **React / Next.js:** Props: `import type { EntityDetailsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EntityDetails>`. The element class, for refs: `import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEntityDetails["kinds"]` with `import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";`
- **Angular:** The directive types the template: `[kinds]` takes `TcEntityDetails["kinds"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEntityDetails } from "@adamstavely/trenchcoat/entity-details";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onLookup` | `(detail: EntityLookupDetail, event: CustomEvent<EntityLookupDetail>) => void` | Called when a card needs details; call `detail.respondWith(details \| promise)` to answer, or use `resolve` instead |
| `onCopy` | `(text: string, kind: EntityKind) => boolean \| void` | Called when Copy is pressed; return false to stop the component writing to the clipboard itself |
| `onOpenLink` | `(detail: EntityOpenDetail) => boolean \| void` | Called before a link in the card opens (Write email, Call, Open, the app's links); return false to handle it yourself |
| `onOpenChange` | `(open: EntityMatch \| null) => void` | Called with what the open card is for, or null when it closed |

*Renamed or hidden on the wrapper: `onCopy`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Onto a mark: opens its card (unless `trigger` is "contextmenu"). On a mark with its card open: into the card; from the card's last control, on to the next mark |
| Shift + Tab | From the card's first control, back to its mark |
| Enter / Space | On a mark: opens its card and moves focus into it |
| Menu key / Shift + F10 | On a mark: opens its card and moves focus into it, in place of the browser's menu |
| Escape | Closes the card; focus goes back to its mark |

### Screen readers

Each mark is a button named by the text as written and described by its kind – "Email address details. Tab moves into
them" – with `aria-haspopup="dialog"` and `aria-expanded`. The card is a non-modal `dialog` named by its kind and value
("Phone number +44 20 7946 0958"), `aria-busy` while loading. Copy and the action are buttons and links named by their
words; links that open a new tab say so. A polite status region announces the name the app returned, "Nothing more
known.", "Couldn't load the details." and "Copied …".

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | internal/inline-details | – |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.8 KB | 9.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/inline-details` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/selection` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **43.7 KB** | **15.1 KB** |
| With Lit – the first component on a page | 63.2 KB | 21.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 14 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of kinds replaced |
| First on the page | 7.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.2 ms | kinds: first render, 14 nodes; update 0.2 ms |
| 1,000 items | 2.0 ms | kinds: first render, 14 nodes; update 0.3 ms |

What it renders doesn't grow with kinds (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `text` is plain text, shown as written with its line breaks.
- Give answers a `name` when you have one – it's announced. `avatar` is decorative; `fields` are short label and value
  pairs; `links` must be http(s), mailto: or tel: (anything else is dropped).
- Rename kinds with `kindLabels` ("Contact" for "Handle") and the messages with `not-found-text` and `error-text`.
- National numbers without a country code can't be placed in a country; write numbers with "+" when you can.

## Do and don't

### Do

- Pass the `signal` on to your lookup, so it stops when the component leaves the page.
- Return null for things you know nothing about; throw only when the lookup itself failed, so people get Retry.
- Use `trigger="contextmenu"` in dense text, such as a log, where hover cards would get in the way.

### Don't

- Don't mark the text yourself – the component checks what it finds, so dates and ids aren't presented as numbers.
- Don't look every address up on load; the component asks only when a card opens, and caches the answer.
- Don't rely on the card to vet links – it shows where a link goes and warns about http, but it doesn't check sites.

## Related

- [Identifier Details](identifier-details.md) – DOIs, IP addresses, file hashes, CVE ids and tracking numbers in text, found, checked and marked – hover, focus or right-click one for its normalised value with Copy, its range, algorithm, year or carrier, doi.org and NVD links, and what your sources know (severity, owner, status)
- [Coordinate Details](coordinate-details.md) – Coordinates in text, checked and marked – hover, focus or right-click one for the place, decimal and DMS with Copy, mapping links and a map that loads only on request
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Contact Channels](contact-channels.md) – The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address – each masked until shown, with its role, when it was last used, how far it's verified, Copy and the page's own actions

## Changelog

- **Entity Details** (`tc-entity-details`) – emails, phone numbers, links and @handles in text are found and marked; hover, focus or right-click opens a card with Copy, Write email / Call / Open and what your `resolve` (or a `tc-entity-lookup` listener) knows. **Identifier Details** (`tc-identifier-details`) does the same for DOIs, IP addresses (private and reserved ranges named), file hashes, CVE ids and tracking numbers.
