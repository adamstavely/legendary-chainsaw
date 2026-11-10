<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Legal Hold Manager

**Trust & calibration** · New

Which items are on legal hold, who placed each hold, why and until when – overdue reviews marked, items added, and Release only with a written reason

- **Element:** `<tc-legal-hold-manager>`
- **Size:** 7.8 KB gzip · 24.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/legal-hold-manager";` |
| React / Next.js | `import { LegalHoldManager } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/legal-hold-manager";` · tags starting with tc- are custom elements |
| Angular | `import { LegalHoldManager } from "@adamstavely/trenchcoat/angular/legal-hold-manager";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/legal-hold-manager";` |

## Example

The live example is in the gallery at `#/legal-hold-manager`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Which items are on legal hold, who placed each hold, why and until when. Holds past their review date are marked. Releasing
one needs a written reason, and says how many items it frees.

### When to use

- Legal, compliance or records teams managing what must be preserved.
- Showing people why a file can't be changed, with `readonly`.

### When not to use

- A quick marker on a file – use [Team Flag Picker](team-flag-picker.md).
- Who may see something – use [Access Review](../blocks/access-review.md).
- The history of what happened – use [Audit Trail](../blocks/audit-trail.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `.ui-lhm__list` – active holds first, overdue ones at the top
2. **Row** `.ui-lhm__row-button` – `.ui-lhm__name`, `.ui-lhm__status` and `.ui-lhm__overdue`
3. **Detail** `.ui-lhm__detail` – `.ui-lhm__facts` and `.ui-lhm__items`
4. **Add** `.ui-lhm__add` – adds an item
5. **Release** `.ui-lhm__release` – opens `.ui-lhm__confirm`, with a required `.ui-lhm__note`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Usage

### HTML

```html
<tc-legal-hold-manager id="holds"></tc-legal-hold-manager>

<script type="module">
  import "@adamstavely/trenchcoat/legal-hold-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const manager = document.querySelector("#holds");
  manager.now = Date.now();
  manager.holds = [{ id: "a", name: "Supply dispute", placedBy: "Noor Haddad", placedAt: Date.UTC(2026, 2, 9), reason: "Counsel asked us to keep it.", status: "active", items: [] }];
  manager.addEventListener("tc-holds-change", (e) => console.log(e.detail.change, e.detail.hold));
</script>
```

### React / Next.js

```tsx
import { LegalHoldManager, type LegalHold } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const holds: LegalHold[] = [{ id: "a", name: "Supply dispute", placedBy: "Noor Haddad", placedAt: Date.UTC(2026, 2, 9), reason: "Counsel asked us to keep it.", status: "active", items: [] }];

export function Holds() {
  return <LegalHoldManager defaultHolds={holds} onHoldsChange={(next) => console.log(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/legal-hold-manager";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";

defineProps<{ holds: TcLegalHoldManager["holds"]; labels: TcLegalHoldManager["labels"] }>();
const onHoldsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-legal-hold-manager :holds="holds" :labels="labels" @tc-holds-change="onHoldsChange"></tc-legal-hold-manager>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { LegalHoldManager } from "@adamstavely/trenchcoat/angular/legal-hold-manager";
import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";

@Component({
  selector: "app-legal-hold-manager-example",
  imports: [LegalHoldManager],
  template: `<tc-legal-hold-manager [holds]="holds()" [labels]="labels()" (tc-holds-change)="onHoldsChange($event)"></tc-legal-hold-manager>`,
})
export class LegalHoldManagerExample {
  readonly holds = input.required<TcLegalHoldManager["holds"]>();
  readonly labels = input.required<TcLegalHoldManager["labels"]>();
  onHoldsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/legal-hold-manager";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";

  let { holds, labels }: { holds: TcLegalHoldManager["holds"]; labels: TcLegalHoldManager["labels"] } = $props();
  let el: TcLegalHoldManager;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-holds-change", on);
    return () => el.removeEventListener("tc-holds-change", on);
  });
</script>

<tc-legal-hold-manager bind:this={el} {holds} {labels}></tc-legal-hold-manager>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Legal holds"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `holds` | – | `LegalHold[]` | `[]` | The holds. Changed by the user unless a tc-holds-change listener calls preventDefault() |
| `selected` | `selected` | `string \| null` | `null` | The id of the open hold. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The current time, epoch ms; without it nothing's marked overdue |
| `readonly` | `readonly` | `boolean` | `false` | Show the holds without letting them change |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<LegalHoldManagerLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-holds-change` | – | Yes | An item was added or a hold released ({ holds, change, hold, item, reason }: LegalHoldsChange); cancelable – prevented, `holds` stays as it was |
| `tc-selected-change` | – | Yes | A hold was opened or closed ({ selected, hold }: LegalHoldSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (42)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-radius-md`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `holds` | `el.holds = …;` | `<… holds={…} />` | `<tc-legal-hold-manager :holds="…">` | `<tc-legal-hold-manager [holds]="…">` | `<tc-legal-hold-manager {holds}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-legal-hold-manager :labels="…">` | `<tc-legal-hold-manager [labels]="…">` | `<tc-legal-hold-manager {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `now`, `readonly`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-holds-change` | Yes | `el.addEventListener("tc-holds-change", (e) => …)` | `onHoldsChange={…}` | `@tc-holds-change="…"` | `(tc-holds-change)="…($event)"` | `el.addEventListener("tc-holds-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `holds` and `selected` itself unless a listener calls `preventDefault()` on `tc-holds-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-legal-hold-manager id="legal-hold-manager"></tc-legal-hold-manager>

<script type="module">
  import "@adamstavely/trenchcoat/legal-hold-manager";

  const el = document.querySelector("#legal-hold-manager");
  el.addEventListener("tc-holds-change", (e) => {
    e.preventDefault(); // the element keeps its holds…
    if (allowed(e.detail.holds)) el.holds = e.detail.holds; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { LegalHoldManager } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof LegalHoldManager>;
type Props = Omit<Own, "holds" | "onHoldsChange"> & { initial: NonNullable<Own["holds"]> };

// Controlled: passing holds makes the wrapper prevent the element's own change; the app sets it
export function ControlledLegalHoldManager({ initial, ...props }: Props) {
  const [holds, setHolds] = useState<Own["holds"]>(initial);
  return <LegalHoldManager {...props} holds={holds} onHoldsChange={(next) => setHolds(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/legal-hold-manager";
import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";

const props = defineProps<{ initial: TcLegalHoldManager["holds"] }>();
const holds = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onHoldsChange = (e: CustomEvent<{ holds: TcLegalHoldManager["holds"] }>) => {
  e.preventDefault();
  holds.value = e.detail.holds;
};
</script>

<template>
  <tc-legal-hold-manager :holds="holds" @tc-holds-change="onHoldsChange"></tc-legal-hold-manager>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { LegalHoldManager } from "@adamstavely/trenchcoat/angular/legal-hold-manager";
import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";

@Component({
  selector: "app-controlled-legal-hold-manager",
  imports: [LegalHoldManager],
  template: `<tc-legal-hold-manager [holds]="holds()" (tc-holds-change)="onHoldsChange($event)"></tc-legal-hold-manager>`,
})
export class ControlledLegalHoldManager {
  readonly initial = input.required<TcLegalHoldManager["holds"]>();
  readonly holds = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onHoldsChange(e: CustomEvent<{ holds: TcLegalHoldManager["holds"] }>) {
    e.preventDefault();
    this.holds.set(e.detail.holds);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/legal-hold-manager";
  import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";

  let { initial }: { initial: TcLegalHoldManager["holds"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let holds = $derived(initial);
  let el: TcLegalHoldManager;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      holds = (e as CustomEvent<{ holds: TcLegalHoldManager["holds"] }>).detail.holds;
    };
    el.addEventListener("tc-holds-change", on);
    return () => el.removeEventListener("tc-holds-change", on);
  });
</script>

<tc-legal-hold-manager bind:this={el} {holds}></tc-legal-hold-manager>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-legal-hold-manager")` returns a `TcLegalHoldManager` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";`
- **React / Next.js:** Props: `import type { LegalHoldManagerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof LegalHoldManager>`. The element class, for refs: `import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcLegalHoldManager["holds"]` with `import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";`
- **Angular:** The directive types the template: `[holds]` takes `TcLegalHoldManager["holds"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcLegalHoldManager } from "@adamstavely/trenchcoat/legal-hold-manager";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Legal holds" |
| `holds` | `LegalHold[]` | The holds – controlled when given |
| `defaultHolds` | `LegalHold[]` | The holds on mount when `holds` isn't controlled |
| `onHoldsChange` | `(holds: LegalHold[], detail: LegalHoldsChange) => void` | An item was added or a hold released |
| `selected` | `string \| null` | The open hold – controlled when given |
| `defaultSelected` | `string \| null` | The open hold on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null) => void` | A hold was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `holds`, `selected`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ↑ ↓ Home End | Move between holds |
| Enter / Space | Opens or closes a hold |
| Tab | Moves through the open hold's controls |
| Enter in Add an item | Adds it |

### Screen readers

The holds are a list named by the heading, with one tab stop. Rows use `aria-expanded` and `aria-controls`. Status and
overdue are words. A required reason uses `aria-required` and `aria-invalid`, and `role="status"` announces adding and
releasing.

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

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-01 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.8 KB | 5.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.3 KB** | **7.8 KB** |
| With Lit – the first component on a page | 46.7 KB | 15.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 67 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of holds replaced |
| First on the page | 8.4 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.3 ms | holds: first render, 682 nodes; update 0.5 ms |
| 1,000 items | 23 ms | holds: first render, 6,382 nodes; update 3.1 ms |

1,000 items of holds: 23 ms, 6,382 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

Write `reason` so someone can tell in a year why it exists. Pass `now`: without it, nothing can be marked overdue.

## Do and don't

### Do

- Enforce holds on the server, so held items really can't be changed or deleted.
- Record `reason` from `tc-holds-change` in your audit trail.
- Call `preventDefault()` if the save is refused.

### Don't

- Don't treat this as enforcement, or as legal advice. It records decisions; your systems must act on them.

## Related

- [Team Flag Editor](team-flag-editor.md) – Where a team decides what its flags mean – each flag's colour, name, meaning and order, with a check on names and a question before removing a flag that's on files.
- [Audit Trail](../blocks/audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
- [Access Review](../blocks/access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
- [File Details](../blocks/file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
