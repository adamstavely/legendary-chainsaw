<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Validity Badge

**Trust & calibration** · New

How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document

- **Element:** `<tc-validity-badge>`
- **Size:** 8.9 KB gzip · 26.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/validity-badge";` |
| React / Next.js | `import { ValidityBadge } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/validity-badge";` · tags starting with tc- are custom elements |
| Angular | `import { ValidityBadge } from "@adamstavely/trenchcoat/angular/validity-badge";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/validity-badge";` |

## Example

The live example is in the gallery at `#/validity-badge`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

How fresh a piece of evidence is, as one of four bands – high, good, aging, stale – worked out from when it was
observed and how fast that kind of evidence decays. An exchange rate is stale within a month; a handbook stays
good for years. Evidence can also be contested (something else disputes it) or superseded (something newer
replaces it), whatever its age – and it can have changed since someone used it: the app knows what was relied on
and what is there now, and the badge says “Changed since used” with a sentence on what to do. As a badge it sits
next to a source; as a strip it runs down the margin of a
document, one bar per paragraph, so people can see which parts rest on old evidence before they rely on them.

### When to use

- Next to a source, a retrieved passage or a dataset whose age changes how far it can be trusted.
- Down the margin of a report or brief built from evidence of different ages (`mode="strip"`).
- Wherever newer evidence can replace or dispute older evidence and people need to see that it has.

### When not to use

- The time something happened, with no judgement about freshness – write the date, or use [Chat History](chat-history.md)'s date
  groups.
- Whether a claim is backed by a source at all – use [Claim Answer](claim-answer.md).
- A metric's movement over a period – use [Change Summary](change-summary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Mark** `.ui-vb__mark` – four signal bars in a tinted square, as many filled as the band is fresh
2. **Band** `.ui-vb__band` – the band in words
3. **Age** `.ui-vb__age` – how long ago the evidence was observed
4. **Flag** `.ui-vb__flag` – Contested, Superseded or Changed since used (in blue, with a dot on the mark), when it applies
5. **Strip** `.ui-vb__strip` – the margin strip, one bar per paragraph
6. **Bar** `.ui-vb__seg` – one paragraph's band; dashed when aging, dotted when stale

## Looks

Standard draws the mark as a 20px square with small rounded corners and the band in the primary text colour, like
`change-summary`'s trend marks. Clean makes the mark a little smaller and rounder, draws thinner bars and sets the
band in the secondary text colour, so a row of badges stays quiet. In the strip, Standard's bars are 4px wide and
Clean's 3px; both widen on hover and focus.

## Usage

### HTML

```html
<tc-validity-badge id="price" profile="fast" contested></tc-validity-badge>
<tc-validity-badge id="rates" changed subject-label="source"></tc-validity-badge>

<div style="display: flex; gap: 8px">
  <tc-validity-badge id="margin" mode="strip" for="report" selector="p"></tc-validity-badge>
  <article id="report">
    <p>Shipping costs rose 4% this quarter.</p>
    <p>Two suppliers still quote last year's prices.</p>
  </article>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/validity-badge";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#price").observed = "2026-09-30";
  document.querySelector("#rates").observed = "2026-10-12";
  const margin = document.querySelector("#margin");
  margin.items = [
    { observed: "2026-10-19", label: "Shipping costs" },
    { observed: "2026-05-17", contested: true, label: "Supplier prices" },
  ];
  margin.addEventListener("tc-locate", (e) => e.detail.target?.scrollIntoView({ block: "center" }));
</script>
```

### React / Next.js

```tsx
import { ValidityBadge, type ValidityInfo } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const paragraphs: ValidityInfo[] = [
  { observed: "2026-10-19", label: "Shipping costs" },
  { observed: "2026-05-17", contested: true, label: "Supplier prices" },
];

export function SourceRow({ observed, editedSinceCited }: { observed: string; editedSinceCited: boolean }) {
  return <ValidityBadge observed={observed} profile="standard" changed={editedSinceCited} />;
}

export function Margin() {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <ValidityBadge mode="strip" htmlFor="report" selector="p" items={paragraphs} onLocate={(d) => d.target?.scrollIntoView()} />
      <article id="report">
        <p>Shipping costs rose 4% this quarter.</p>
        <p>Two suppliers still quote last year's prices.</p>
      </article>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/validity-badge";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";

defineProps<{ bandLabels: TcValidityBadge["bandLabels"]; items: TcValidityBadge["items"] }>();
const onLocate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-validity-badge :bandLabels="bandLabels" :items="items" @tc-locate="onLocate"></tc-validity-badge>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ValidityBadge } from "@adamstavely/trenchcoat/angular/validity-badge";
import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";

@Component({
  selector: "app-validity-badge-example",
  imports: [ValidityBadge],
  template: `<tc-validity-badge [bandLabels]="bandLabels()" [items]="items()" (tc-locate)="onLocate($event)"></tc-validity-badge>`,
})
export class ValidityBadgeExample {
  readonly bandLabels = input.required<TcValidityBadge["bandLabels"]>();
  readonly items = input.required<TcValidityBadge["items"]>();
  onLocate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/validity-badge";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";

  let { bandLabels, items }: { bandLabels: TcValidityBadge["bandLabels"]; items: TcValidityBadge["items"] } = $props();
  let el: TcValidityBadge;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-locate", on);
    return () => el.removeEventListener("tc-locate", on);
  });
</script>

<tc-validity-badge bind:this={el} {bandLabels} {items}></tc-validity-badge>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `mode` | `mode` | `"badge" \| "strip"` | `"badge"` | "badge" – the mark and the band in words; "strip" – one bar per paragraph down a document's margin |
| `observed` | `observed` | `ValidityTime \| undefined` | `undefined` | When the evidence was observed or published: epoch ms, an ISO date string or a Date |
| `profile` | `profile` | `ValidityProfileName \| ValidityProfile` | `"standard"` | How fast it decays: "fast", "standard", "slow", "lasting", or your own band boundaries in days |
| `band` | `band` | `ValidityBand \| undefined` | `undefined` | The band, set outright – `observed` and the profile are then ignored |
| `contested` | `contested` | `boolean` | `false` | Other evidence disputes it: a dashed ring round the mark and the word "Contested" |
| `superseded` | `superseded` | `boolean` | `false` | Something newer replaces it: the mark turns gray and the badge says "Superseded" first |
| `changed` | `changed` | `boolean` | `false` | The source has changed since it was used (the app compares what was relied on with what is there now): a blue dot on the mark and the words "Changed since used" |
| `now` | `now` | `number \| undefined` | `undefined` | The moment the age is counted to, in epoch ms – defaults to when the element connected |
| `compact` | `compact` | `boolean` | `false` | Badge: only the mark, with its words in a tooltip and for screen readers |
| `hideAge` | `hide-age` | `boolean` | `false` | Badge: leave out the age ("8 mo. ago") |
| `bandLabels` | – | `Partial<Record<ValidityBand, string>>` | `{}` | The words for the bands – your own vocabulary in place of High, Good, Aging and Stale |
| `contestedLabel` | `contested-label` | `string` | `"Contested"` | The word for a contested piece of evidence |
| `supersededLabel` | `superseded-label` | `string` | `"Superseded"` | The word for a superseded piece of evidence |
| `changedLabel` | `changed-label` | `string` | `"Changed since used"` | The words for a source that has changed since it was used |
| `changedNote` | `changed-note` | `string` | `"It has changed since you used it – check it still says what you relied on."` | What a changed source means and what to do – said after the band, and in the tooltip; empty leaves it out |
| `subjectLabel` | `subject-label` | `string` | `"evidence"` | What screen readers call the evidence: "Aging evidence, observed 8 months ago" |
| `items` | – | `ValidityInfo[]` | `[]` | Strip: one entry per paragraph, in document order |
| `for` | `for` | `string` | `""` | Strip: the id of the document whose paragraphs the bars line up with; unset stacks the bars on their own |
| `selector` | `selector` | `string` | `":scope > *"` | Strip: which children of the `for` document count as paragraphs (a selector, default every child element) |
| `stripLabel` | `strip-label` | `string` | `"Evidence freshness"` | Strip: the name of the list of bars |
| `paragraphLabel` | `paragraph-label` | `string` | `"Paragraph"` | Strip: what an item without a `label` is called, before its number |
| `currentBand` | – | `ValidityBand` | – | The band as shown: `band`, else worked out from `observed`, the profile and `now` |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-locate` | – | No | Strip: a segment was clicked, or Enter / Space was pressed on it; detail `{ index, item, target }` (ValidityLocateDetail) – the paragraph it stands for, when `for` names a document |

#### Design tokens it reads (41)

`--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-surface-raised`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-radius`, `--tc-validity-aging-bg`, `--tc-validity-aging-fg`, `--tc-validity-badge-bg`, `--tc-validity-badge-fg`, `--tc-validity-good-bg`, `--tc-validity-good-fg`, `--tc-validity-high-bg`, `--tc-validity-high-fg`, `--tc-validity-stale-bg`, `--tc-validity-stale-fg`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `validityTime(t: ValidityTime \| undefined): number` | A moment as epoch ms; NaN when it can't be read |
| `validityBand(observed: number, now: number, profile: ValidityProfileName \| ValidityProfile): ValidityBand` | The band of evidence observed at `observed`, as of `now` (both epoch ms), under a decay profile |
| `validityAge(ms: number, style: "short" \| "long", locale?: string): void` | An age as words in the page's language: short ("8 mo. ago") for the badge, long ("8 months ago") for screen readers |

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
| `bandLabels` | `el.bandLabels = …;` | `<… bandLabels={…} />` | `<tc-validity-badge :bandLabels="…">` | `<tc-validity-badge [bandLabels]="…">` | `<tc-validity-badge {bandLabels}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-validity-badge :items="…">` | `<tc-validity-badge [items]="…">` | `<tc-validity-badge {items}>` |

*Also attributes: `mode`, `observed`, `profile`, `band`, `contested`, `superseded`, `changed`, `now` and 11 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-locate` | No | `el.addEventListener("tc-locate", (e) => …)` | `onLocate={…}` | `@tc-locate="…"` | `(tc-locate)="…($event)"` | `el.addEventListener("tc-locate", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-validity-badge")` returns a `TcValidityBadge` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";`
- **React / Next.js:** Props: `import type { ValidityBadgeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ValidityBadge>`. The element class, for refs: `import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcValidityBadge["bandLabels"]` with `import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";`
- **Angular:** The directive types the template: `[bandLabels]` takes `TcValidityBadge["bandLabels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcValidityBadge } from "@adamstavely/trenchcoat/validity-badge";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `htmlFor` | `string` | Strip: the id of the document whose paragraphs the bars line up with (the element's `for`) |
| `onLocate` | `(detail: ValidityLocateDetail) => void` | Strip: called when a bar is clicked or activated from the keyboard, with the paragraph it stands for |

*Renamed or hidden on the wrapper: `for`*

## Accessibility

### Keyboard

The badge takes no focus and handles no keys. The strip is one tab stop:

| Key | What it does |
|---|---|
| ↓ / → | Moves to the next bar and shows its tooltip |
| ↑ / ← | Moves to the previous bar and shows its tooltip |
| Home / End | Moves to the first or last bar |
| Enter / Space | Fires `tc-locate` for the bar's paragraph |
| Escape | Hides the tooltip |

### Screen readers

The badge's visible words are hidden and said as one sentence instead – “Aging evidence, observed 5 months ago,
contested” – which is also the host's `title`. A changed source adds its words and a second sentence: “High source,
observed 12 days ago, changed since used. It has changed since you used it – check it still says what you relied
on.” (`changed-label` and `changed-note` change them). `subject-label` changes “evidence” to your own word (“source”). In
`compact` mode only the mark shows, with the same sentence. The strip is a list named “Evidence freshness”
(`strip-label`); each bar is a button named after its paragraph and its band: “Supplier prices: Aging evidence,
observed 5 months ago, contested”. The tooltip repeats this for sighted people and is hidden from screen readers.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.1 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.8 KB** | **9.0 KB** |
| With Lit – the first component on a page | 47.5 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 11 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pick the profile by how fast the kind of evidence goes out of date, not by how important it is: “fast” for
  prices, status and news; “standard” for surveys and reports; “slow” for reference works; “lasting” for evidence
  that doesn't age.
- Give each strip item a short `label` that names the paragraph (“Supplier prices”) – it beats “Paragraph 3”.
- Use `bandLabels` for your organisation's own words, and keep them to one word each.
- Contested and superseded say why in your product, not in the badge: put “Contested by the August invoice” next
  to it.
- Set `changed` only when you have compared what was used with what is there now; write `changedNote` as what to
  do (“Check the figures still match”), not as an alarm.

## Do and don't

### Do

- Set `now` when people look at evidence as of another day – a past review, a look ahead.
- Use the same profile for the same kind of evidence across the product, so bands mean the same thing.
- Line the strip up with the document (`for` and `selector`) and handle `tc-locate` to scroll to and mark the
  paragraph.
- Clear `changed` once the person has looked at the new version – it marks something to act on, not history.

### Don't

- Don't read the band as truth: a fresh source can be wrong. Pair the badge with where a claim came from.
- Don't use only the colour to tell people a source is stale – keep the band word unless space really is short, and
  then use `compact`, which keeps the words in a tooltip.
- Don't put a strip next to a document whose paragraphs don't match its items one to one.

## Related

- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Retrieval Inspector](retrieval-inspector.md) – What the model was given to answer with – every retrieved chunk with its score, source, freshness, and whether the answer used it
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
