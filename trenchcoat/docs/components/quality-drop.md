<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Quality Drop

**Data & charts** · New

One drop in a judge score on live chats – what fell and since when, a small chart round it, the likely cause with how sure in words and failing chats as quotes, the topics it clusters in, and Roll back (after saying what reverts), Investigate or Dismiss as expected

- **Element:** `<tc-quality-drop>`
- **Size:** 8.8 KB gzip · 29.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/quality-drop";` |
| React / Next.js | `import { QualityDrop } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/quality-drop";` · tags starting with tc- are custom elements |
| Angular | `import { QualityDrop } from "@adamstavely/trenchcoat/angular/quality-drop";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/quality-drop";` |

## Example

The live example is in the gallery at `#/quality-drop`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One drop in a judge score on live chats, and the way out of it. The card says what fell – the criterion, from what to
what, since when and over how many chats – with a small chart round the drop. Then the likely cause: the change that
went live nearest the drop, how sure that link is in words, and a few failing chats as short quotes that show it. The
topics the failures cluster in sit beside it. Three actions close it: roll back to the version before (after saying
what that reverts), investigate, or dismiss the drop as expected.

### When to use

- An alert on a production agent's quality, opened from a notification or a quality page.
- The moment someone has to decide whether to roll a change back.
- A post-incident record of a drop and what was done about it.

### When not to use

- Watching scores over time, with every change on the axis – use [Quality Trend](quality-trend.md).
- Comparing two versions on every criterion – use [Change Impact](change-impact.md).
- Choosing among an agent's past versions in general – use [Version History](version-history.md).
- A test set failing before release – use [Eval Scorecard](eval-scorecard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **What fell** `.ui-qdr__headline` – the criterion, from → to; the date and chats under it
2. **Chart** `.ui-qdr__chart` – the daily mean round the drop, where it fell and where the change went live
3. **Cause** `.ui-qdr__cause` – the change, how sure in words, why, and the failing chats as quotes
4. **Where it fails** `.ui-qdr__segments` – the topics with their share of the failing chats
5. **Actions** `.ui-qdr__actions` – Roll back, Investigate, Dismiss as expected
6. **Confirmation** `.ui-qdr__confirm` – what rolling back reverts, before it happens

## Looks

Standard puts the header on a gray tray above a white card; Clean is one white card. The line and the share bars use
`--tc-quality-drop-line` (the danger colour); the chart's height is `--tc-quality-drop-chart-h`. Rolled back or
dismissed, the card folds to the headline and one line, with the state as a pill in the header.

## Usage

### HTML

```html
<tc-quality-drop id="drop" criterion="Correctness" rollback-to="v13"></tc-quality-drop>

<script type="module">
  import "@adamstavely/trenchcoat/quality-drop";
  import "@adamstavely/trenchcoat/tokens.css";

  const at = Date.UTC(2026, 10, 3);
  const drop = document.querySelector("#drop");
  Object.assign(drop, {
    from: 4.4,
    to: 3.8,
    at,
    chats: 1284,
    cause: { change: { label: "Prompt v13 → v14", at }, confidence: "high", reason: "Went live the day scores fell." },
    evidence: [{ id: "chat-4821", quote: "You can claim up to £60 a night for hotels.", note: "The limit is £120 in London" }],
    segments: [{ id: "travel", label: "Travel & expenses", share: 0.46 }],
    reverts: ["The instructions go back to v13"],
  });
  drop.addEventListener("tc-rollback", (e) => console.log("Roll back to", e.detail.version));
</script>
```

### React / Next.js

```tsx
import { QualityDrop, type QualityDropCause } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function DropAlert({ cause, rollback }: { cause: QualityDropCause; rollback: (version: string) => void }) {
  return (
    <QualityDrop
      criterion="Correctness"
      from={4.4}
      to={3.8}
      at={cause.change.at}
      chats={1284}
      cause={cause}
      rollbackTo="v13"
      reverts={["The instructions go back to v13"]}
      onRollback={(version) => rollback(version)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/quality-drop";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";

defineProps<{ series: TcQualityDrop["series"]; cause: TcQualityDrop["cause"] }>();
const onRollback = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-quality-drop :series="series" :cause="cause" @tc-rollback="onRollback"></tc-quality-drop>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { QualityDrop } from "@adamstavely/trenchcoat/angular/quality-drop";
import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";

@Component({
  selector: "app-quality-drop-example",
  imports: [QualityDrop],
  template: `<tc-quality-drop [series]="series()" [cause]="cause()" (tc-rollback)="onRollback($event)"></tc-quality-drop>`,
})
export class QualityDropExample {
  readonly series = input.required<TcQualityDrop["series"]>();
  readonly cause = input.required<TcQualityDrop["cause"]>();
  onRollback(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quality-drop";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";

  let { series, cause }: { series: TcQualityDrop["series"]; cause: TcQualityDrop["cause"] } = $props();
  let el: TcQualityDrop;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-rollback", on);
    return () => el.removeEventListener("tc-rollback", on);
  });
</script>

<tc-quality-drop bind:this={el} {series} {cause}></tc-quality-drop>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Quality drop"` | The heading |
| `criterion` | `criterion` | `string` | `""` | The criterion that fell – "Correctness" |
| `from` | `from` | `number` | `0` | Its mean before the drop |
| `to` | `to` | `number` | `0` | Its mean since |
| `at` | `at` | `number` | `0` | When it fell, as epoch ms |
| `chats` | `chats` | `number` | `0` | How many chats were scored since it fell |
| `series` | – | `QualityDropPoint[]` | `[]` | The daily mean round the drop, for the small chart |
| `cause` | – | `QualityDropCause \| null` | `null` | The likely cause, or null when nothing lines up |
| `evidence` | – | `QualityDropEvidence[]` | `[]` | Failing chats that point to the cause, as short quotes |
| `segments` | – | `QualityDropSegment[]` | `[]` | The topics the failing chats fall in, with their share |
| `rollbackTo` | `rollback-to` | `string` | `""` | The version Roll back returns to – "v13"; empty hides Roll back |
| `reverts` | – | `string[]` | `[]` | What rolling back reverts, a line each – said before it's confirmed |
| `status` | `status` | `QualityDropStatus` | `"open"` | "open", "rolled-back" or "dismissed" |
| `locale` | `locale` | `string` | `"en-US"` | Formats dates and numbers |
| `timeZone` | `time-zone` | `string` | `"UTC"` | The time zone dates are read in |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-rollback` | – | Yes | Roll back was confirmed ({ version }: QualityDropRollback); cancelable – prevented, the card stays open |
| `tc-status-change` | – | Yes | The drop was rolled back, dismissed or reopened ({ status }: QualityDropStatusChange); cancelable – prevented, `status` stays as it was |
| `tc-investigate` | – | No | Investigate was pressed ({ criterion }: QualityDropInvestigate) |
| `tc-chat-open` | – | No | A failing chat's quote was opened ({ id, evidence }: QualityDropChatOpen) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-quality-drop-chart-h` | `72px` | both |
| `--tc-quality-drop-line` | `var(--tc-status-danger-solid)` | both |

#### Design tokens it reads (81)

`--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `series` | `el.series = …;` | `<… series={…} />` | `<tc-quality-drop :series="…">` | `<tc-quality-drop [series]="…">` | `<tc-quality-drop {series}>` |
| `cause` | `el.cause = …;` | `<… cause={…} />` | `<tc-quality-drop :cause="…">` | `<tc-quality-drop [cause]="…">` | `<tc-quality-drop {cause}>` |
| `evidence` | `el.evidence = …;` | `<… evidence={…} />` | `<tc-quality-drop :evidence="…">` | `<tc-quality-drop [evidence]="…">` | `<tc-quality-drop {evidence}>` |
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-quality-drop :segments="…">` | `<tc-quality-drop [segments]="…">` | `<tc-quality-drop {segments}>` |
| `reverts` | `el.reverts = …;` | `<… reverts={…} />` | `<tc-quality-drop :reverts="…">` | `<tc-quality-drop [reverts]="…">` | `<tc-quality-drop {reverts}>` |

*Also attributes: `heading`, `criterion`, `from`, `to`, `at`, `chats`, `rollback-to`, `status` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-rollback` | Yes | `el.addEventListener("tc-rollback", (e) => …)` | `onRollback={…}` | `@tc-rollback="…"` | `(tc-rollback)="…($event)"` | `el.addEventListener("tc-rollback", …)` |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-investigate` | No | `el.addEventListener("tc-investigate", (e) => …)` | `onInvestigate={…}` | `@tc-investigate="…"` | `(tc-investigate)="…($event)"` | `el.addEventListener("tc-investigate", …)` |
| `tc-chat-open` | No | `el.addEventListener("tc-chat-open", (e) => …)` | `onChatOpen={…}` | `@tc-chat-open="…"` | `(tc-chat-open)="…($event)"` | `el.addEventListener("tc-chat-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `status` itself unless a listener calls `preventDefault()` on `tc-status-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-quality-drop id="quality-drop"></tc-quality-drop>

<script type="module">
  import "@adamstavely/trenchcoat/quality-drop";

  const el = document.querySelector("#quality-drop");
  el.addEventListener("tc-status-change", (e) => {
    e.preventDefault(); // the element keeps its status…
    if (allowed(e.detail.status)) el.status = e.detail.status; // …until the app sets it
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
import "@adamstavely/trenchcoat/quality-drop";
import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";

const props = defineProps<{ initial: TcQualityDrop["status"] }>();
const status = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStatusChange = (e: CustomEvent<{ status: TcQualityDrop["status"] }>) => {
  e.preventDefault();
  status.value = e.detail.status;
};
</script>

<template>
  <tc-quality-drop :status="status" @tc-status-change="onStatusChange"></tc-quality-drop>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { QualityDrop } from "@adamstavely/trenchcoat/angular/quality-drop";
import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";

@Component({
  selector: "app-controlled-quality-drop",
  imports: [QualityDrop],
  template: `<tc-quality-drop [status]="status()" (tc-status-change)="onStatusChange($event)"></tc-quality-drop>`,
})
export class ControlledQualityDrop {
  readonly initial = input.required<TcQualityDrop["status"]>();
  readonly status = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStatusChange(e: CustomEvent<{ status: TcQualityDrop["status"] }>) {
    e.preventDefault();
    this.status.set(e.detail.status);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quality-drop";
  import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";

  let { initial }: { initial: TcQualityDrop["status"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let status = $derived(initial);
  let el: TcQualityDrop;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      status = (e as CustomEvent<{ status: TcQualityDrop["status"] }>).detail.status;
    };
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-quality-drop bind:this={el} {status}></tc-quality-drop>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-quality-drop")` returns a `TcQualityDrop` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";`
- **React / Next.js:** Props: `import type { QualityDropProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof QualityDrop>`. The element class, for refs: `import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcQualityDrop["series"]` with `import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";`
- **Angular:** The directive types the template: `[series]` takes `TcQualityDrop["series"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcQualityDrop } from "@adamstavely/trenchcoat/quality-drop";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `status` | `QualityDropStatus` | "open", "rolled-back" or "dismissed". Controlled when defined |
| `defaultStatus` | `QualityDropStatus` | The status at first when `status` isn't controlled |
| `onStatusChange` | `(status: QualityDropStatus) => void` | Called after a rollback, a dismissal or Undo, controlled or not |
| `onRollback` | `(version: string) => boolean \| void` | Called when the rollback is confirmed, with the version to return to; return false to keep the card open |
| `onInvestigate` | `(criterion: string) => void` | Called when Investigate is pressed |
| `onChatOpen` | `(id: string, evidence: QualityDropEvidence) => void` | Called when a failing chat's quote is opened |

*Renamed or hidden on the wrapper: `heading`, `status`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the failing chats' quotes, then the actions |
| Enter / Space | Opens a quote's chat (tc-chat-open), or presses an action |
| Escape | In the rollback confirmation, cancels it and returns to Roll back |

Roll back moves focus to the confirmation's Roll back button; Cancel returns it to Roll back. After a rollback or a
dismissal, focus moves to Undo.

### Screen readers

The cause and the topics are regions named by their captions ("Likely cause", "Where it fails"). The confidence is a
word ("High confidence"), not only a colour. Each quote is a button read with its note and "open chat". The topics read
as "Travel & expenses 46% of failing chats". The confirmation is a group named by its question ("Roll back to v13?").
Rolling back, dismissing and reopening are said in a status region.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.3 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.8 KB** | **8.8 KB** |
| With Lit – the first component on a page | 50.5 KB | 15.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 89 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of series replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.3 ms | series: first render, 89 nodes; update 0.6 ms |
| 1,000 items | 2.6 ms | series: first render, 89 nodes; update 0.8 ms |

What it renders doesn't grow with series (tested to 1,000 items).

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

- Quote the part of the answer that shows the problem, a sentence at most, and say in the note what's wrong.
- Write `reason` as the evidence, not a guess: "Went live the day scores fell; failing answers skip the citation".
- List in `reverts` what changes and what doesn't – people roll back more calmly when they know what stays.

## Do and don't

### Do

- Say how many chats the drop rests on – a fall over 40 chats isn't one over 4,000.
- Set the confidence from the evidence: high when the timing and the failures both point at the change.

### Don't

- Don't roll back without the confirmation – keep `reverts` filled in.
- Don't show a cause when nothing lines up; leave `cause` null and the card says so.
- Don't put several drops in one card – one drop, one decision.

## Related

- [Quality Trend](quality-trend.md) – Judge scores on live chats day by day – a line per criterion with a band from its sample size, the changes pinned on the time axis, a sentence saying what moved since the latest one, a 7 / 30 / 90-day switch, criterion toggles and a table view
- [Change Impact](change-impact.md) – Did a change make the agent better or worse – before against after per judge criterion as a dumbbell, the difference and a verdict in words (Better, likely · No clear change · Worse, likely) from the counts, cost and latency, sample sizes, a summing-up line and a segment switch
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
