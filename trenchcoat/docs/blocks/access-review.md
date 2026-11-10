<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Access Review

**Blocks** · New

A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them

- **Element:** `<tc-access-review>`
- **Size:** 8.0 KB gzip · 24.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/access-review";` |
| React / Next.js | `import { AccessReview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/access-review";` · tags starting with tc- are custom elements |
| Angular | `import { AccessReview } from "@adamstavely/trenchcoat/angular/access-review";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/access-review";` |

## Example

The live example is in the gallery at `#/blocks/access-review`, in both looks; Replay restarts its animations.

## Overview

A periodic check of who can see what. Each row is one person or group's access to one thing, with anyone no longer
authorized or who couldn't be checked first. The reviewer keeps or removes each one, and keeping someone flagged needs a
written reason.

### When to use

- A quarterly or annual access review, or one a regulator or policy requires.
- Reviewing who can reach one sensitive dataset.

### When not to use

- Changing who can see one file now – use [Share Panel](../components/share-panel.md).
- Asking for access – use [Access Request](../components/access-request.md).
- Looking at what already happened – use [Audit Trail](audit-trail.md).

## Anatomy

1. **Filters** `.ui-acr__filters` – All, Flagged and Not decided, with how many
2. **Keep all** `.ui-acr__keep-all` – settles the routine rows at once
3. **Row** `.ui-acr__row` – who, what they can reach, when they last used it, and `.ui-acr__status`
4. **Choices** `.ui-acr__choices` – Keep and Remove
5. **Reason** `.ui-acr__note` – required when keeping someone flagged
6. **Submit** `.ui-acr__submit` – waits until everything's decided

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-acr-avatar`.

## Usage

### HTML

```html
<tc-access-review id="review" heading="Q4 access review"></tc-access-review>

<script type="module">
  import "@adamstavely/trenchcoat/access-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const review = document.querySelector("#review");
  review.items = [{ id: "a", name: "Noor Haddad", resource: "Trial 12", level: "Can edit", status: "authorized" }];
  review.addEventListener("tc-review-submit", (e) => console.log(e.detail.keep, e.detail.remove));
</script>
```

### React / Next.js

```tsx
import { AccessReview, type AccessReviewItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: AccessReviewItem[] = [{ id: "a", name: "Noor Haddad", resource: "Trial 12", level: "Can edit", status: "authorized" }];

export function Review() {
  return <AccessReview title="Q4 access review" items={items} onTcReviewSubmit={(e) => console.log(e.detail.remove)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/access-review";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";

defineProps<{ items: TcAccessReview["items"]; decisions: TcAccessReview["decisions"] }>();
const onDecisionsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-access-review :items="items" :decisions="decisions" @tc-decisions-change="onDecisionsChange"></tc-access-review>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AccessReview } from "@adamstavely/trenchcoat/angular/access-review";
import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";

@Component({
  selector: "app-access-review-example",
  imports: [AccessReview],
  template: `<tc-access-review [items]="items()" [decisions]="decisions()" (tc-decisions-change)="onDecisionsChange($event)"></tc-access-review>`,
})
export class AccessReviewExample {
  readonly items = input.required<TcAccessReview["items"]>();
  readonly decisions = input.required<TcAccessReview["decisions"]>();
  onDecisionsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/access-review";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";

  let { items, decisions }: { items: TcAccessReview["items"]; decisions: TcAccessReview["decisions"] } = $props();
  let el: TcAccessReview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decisions-change", on);
    return () => el.removeEventListener("tc-decisions-change", on);
  });
</script>

<tc-access-review bind:this={el} {items} {decisions}></tc-access-review>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Access review"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading, such as what's in scope and when it's due |
| `items` | – | `AccessReviewItem[]` | `[]` | Each person or group's access to one thing |
| `decisions` | – | `AccessReviewDecisions` | `{}` | The decisions so far, by item id. Changed by the user unless a tc-decisions-change listener calls preventDefault() |
| `filter` | `filter` | `AccessReviewFilter` | `"all"` | Which rows show: "all", "flagged" or "open". Changed by the user unless a tc-filter-change listener calls preventDefault() |
| `sending` | `sending` | `boolean` | `false` | The page is sending the review: controls are locked |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<AccessReviewLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decisions-change` | – | Yes | A decision changed ({ decisions, item }: AccessReviewDecisionsChange); cancelable – prevented, `decisions` stays as it was |
| `tc-filter-change` | – | Yes | The filter changed ({ filter }: { filter: AccessReviewFilter }); cancelable – prevented, `filter` stays as it was |
| `tc-review-submit` | – | Yes | Submit was pressed ({ decisions, keep, remove }: AccessReviewSubmit); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-acr-avatar` | `32px` | both |

#### Design tokens it reads (53)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-access-review :items="…">` | `<tc-access-review [items]="…">` | `<tc-access-review {items}>` |
| `decisions` | `el.decisions = …;` | `<… decisions={…} />` | `<tc-access-review :decisions="…">` | `<tc-access-review [decisions]="…">` | `<tc-access-review {decisions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-access-review :labels="…">` | `<tc-access-review [labels]="…">` | `<tc-access-review {labels}>` |

*Also attributes: `heading`, `description`, `filter`, `sending`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decisions-change` | Yes | `el.addEventListener("tc-decisions-change", (e) => …)` | `ref.current.addEventListener("tc-decisions-change", …)` | `@tc-decisions-change="…"` | `(tc-decisions-change)="…($event)"` | `el.addEventListener("tc-decisions-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `onTcFilterChange={…}` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-review-submit` | Yes | `el.addEventListener("tc-review-submit", (e) => …)` | `onTcReviewSubmit={…}` | `@tc-review-submit="…"` | `(tc-review-submit)="…($event)"` | `el.addEventListener("tc-review-submit", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `decisions` and `filter` itself unless a listener calls `preventDefault()` on `tc-decisions-change` or `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-access-review id="access-review"></tc-access-review>

<script type="module">
  import "@adamstavely/trenchcoat/access-review";

  const el = document.querySelector("#access-review");
  el.addEventListener("tc-decisions-change", (e) => {
    e.preventDefault(); // the element keeps its decisions…
    if (allowed(e.detail.decisions)) el.decisions = e.detail.decisions; // …until the app sets it
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
import "@adamstavely/trenchcoat/access-review";
import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";

const props = defineProps<{ initial: TcAccessReview["decisions"] }>();
const decisions = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDecisionsChange = (e: CustomEvent<{ decisions: TcAccessReview["decisions"] }>) => {
  e.preventDefault();
  decisions.value = e.detail.decisions;
};
</script>

<template>
  <tc-access-review :decisions="decisions" @tc-decisions-change="onDecisionsChange"></tc-access-review>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AccessReview } from "@adamstavely/trenchcoat/angular/access-review";
import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";

@Component({
  selector: "app-controlled-access-review",
  imports: [AccessReview],
  template: `<tc-access-review [decisions]="decisions()" (tc-decisions-change)="onDecisionsChange($event)"></tc-access-review>`,
})
export class ControlledAccessReview {
  readonly initial = input.required<TcAccessReview["decisions"]>();
  readonly decisions = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDecisionsChange(e: CustomEvent<{ decisions: TcAccessReview["decisions"] }>) {
    e.preventDefault();
    this.decisions.set(e.detail.decisions);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/access-review";
  import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";

  let { initial }: { initial: TcAccessReview["decisions"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let decisions = $derived(initial);
  let el: TcAccessReview;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      decisions = (e as CustomEvent<{ decisions: TcAccessReview["decisions"] }>).detail.decisions;
    };
    el.addEventListener("tc-decisions-change", on);
    return () => el.removeEventListener("tc-decisions-change", on);
  });
</script>

<tc-access-review bind:this={el} {decisions}></tc-access-review>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-access-review")` returns a `TcAccessReview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";`
- **React / Next.js:** Props: `import type { AccessReviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AccessReview>`. The element class, for refs: `import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAccessReview["items"]` with `import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";`
- **Angular:** The directive types the template: `[items]` takes `TcAccessReview["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAccessReview } from "@adamstavely/trenchcoat/access-review";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Access review" |
| `decisions` | `AccessReviewDecisions` | The decisions so far – controlled when given |
| `defaultDecisions` | `AccessReviewDecisions` | The decisions on mount when `decisions` isn't controlled |
| `onDecisionsChange` | `(decisions: AccessReviewDecisions) => void` | A decision changed |

*Renamed or hidden on the wrapper: `heading`, `decisions`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the filters, each row's choices and reason, then Submit |
| Enter / Space | Presses a filter or choice |

### Screen readers

The rows are a list named by the heading. Each pair of choices is a group named for the person and what they can reach,
and uses `aria-pressed`. A required reason is marked with `aria-required` and `aria-invalid`. Status is in words.
Keep all authorized never settles a flagged row, and `role="status"` announces when the review is submitted.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

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

*Measured 2026-10-31 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 15.4 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/list-motion` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.6 KB** | **8.0 KB** |
| With Lit – the first component on a page | 47.0 KB | 15.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | default properties, 25 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Give `reason` in terms the reviewer can act on: "The Restricted data agreement ended in August". Give `lastUsed`, because
access nobody uses is usually safe to remove. Reasons are visible to the reviewer, so leave out anything they shouldn't
learn.

## Do and don't

### Do

- Save decisions as they change with `tc-decisions-change`, so a long review isn't lost.
- Apply removals and keep the record on the server when `tc-review-submit` arrives.

### Don't

- Don't treat this as enforcement. Access only changes when your server acts on the decisions.

## Related

- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Audit Trail](audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
- [Access Request](../components/access-request.md) – Ask for access to one piece of data – the resource with its owner and classification in words, the level, how long, a required justification and the fields needed – then where it stands: pending with who decides, approved with the time left, denied with the reason, or expired
- [Oversight Home](oversight-home.md) – A role's home dashboard – the headline that needs doing, the one thing first, KPI charts against last week and the service posture table with a state filter; switch roles at the top (uses `@adamstavely/trenchcoat/react`: `segmented-control`, `kpi-chart`, `data-table`, `button`)

## Changelog

- **Access Review** (`tc-access-review`) – a block for periodic reviews of who can see what: keep or remove each one, with a written reason for keeping anyone flagged.
