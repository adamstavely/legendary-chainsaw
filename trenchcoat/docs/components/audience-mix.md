<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Audience Mix

**Research & portfolio** · New

Who is reading – a sector mix as bars, an internal-versus-external split and the top places, each with its share, and the row under the pointer or focus named in full

- **Element:** `<tc-audience-mix>`
- **Size:** 7.1 KB gzip · 21.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/audience-mix";` |
| React / Next.js | `import { AudienceMix } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/audience-mix";` · tags starting with tc- are custom elements |
| Angular | `import { AudienceMix } from "@adamstavely/trenchcoat/angular/audience-mix";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/audience-mix";` |

## Example

The live example is in the gallery at `#/audience-mix`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who is reading, in three short groups. The sector mix shows each kind of reader – academic, industry, government,
nonprofit – as a bar with its share. The split shows readers inside and outside the organisation as one bar in two
parts, with both shares in words beneath. The places show the top countries or regions, with "Other" for the rest.
Each group is optional and shows only when it has data. Values are counts or shares in any unit: each group's
percentages come from its own total. A readout under the groups names the row under the pointer or focus in full.

### When to use

- The audience of a paper, a report, a dataset or a page – who reads it and where they are.
- A side panel next to reach figures, or inside `publication-impact` (it embeds this one).
- Any short mix of a few categories where the share matters more than the exact count.

### When not to use

- A share of a whole that people slice and filter – use [Breakdown Chart](breakdown-chart.md).
- Use against a limit – use [Usage Meter](usage-meter.md).
- One paper's whole impact – use [Publication Impact](publication-impact.md), which includes this.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Group** `.ui-audm__group` – a heading and its rows: Sector, Internal vs external, Where
2. **Row** `.ui-audm__row` – a name, a bar and the share
3. **Split** `.ui-audm__split` – one bar in two parts, internal and external
4. **Split key** `.ui-audm__split-key` – both shares in words under the split
5. **Readout** `.ui-audm__readout` – the row under the pointer or focus, named in full

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The bars use `--tc-audm-ink` (by default `--tc-chart-1`); set it on the element to change them. With
`embedded` there is no card or header, for use inside another component.

## Usage

### HTML

```html
<tc-audience-mix id="mix"></tc-audience-mix>

<script type="module">
  import "@adamstavely/trenchcoat/audience-mix";
  import "@adamstavely/trenchcoat/tokens.css";

  const mix = document.querySelector("#mix");
  mix.sectors = [{ label: "Academic", value: 54 }, { label: "Industry", value: 23 }, { label: "Government", value: 14 }];
  mix.split = { internal: 6, external: 94 };
  mix.places = [{ label: "United States", value: 38 }, { label: "Other", value: 62 }];
</script>
```

### React / Next.js

```tsx
import { AudienceMix } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Readers() {
  return (
    <AudienceMix
      sectors={[{ label: "Academic", value: 54 }, { label: "Industry", value: 23 }, { label: "Government", value: 14 }]}
      split={{ internal: 6, external: 94 }}
      places={[{ label: "United States", value: 38 }, { label: "Other", value: 62 }]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/audience-mix";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";

defineProps<{ sectors: TcAudienceMix["sectors"]; split: TcAudienceMix["split"] }>();
</script>

<template>
  <tc-audience-mix :sectors="sectors" :split="split"></tc-audience-mix>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AudienceMix } from "@adamstavely/trenchcoat/angular/audience-mix";
import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";

@Component({
  selector: "app-audience-mix-example",
  imports: [AudienceMix],
  template: `<tc-audience-mix [sectors]="sectors()" [split]="split()"></tc-audience-mix>`,
})
export class AudienceMixExample {
  readonly sectors = input.required<TcAudienceMix["sectors"]>();
  readonly split = input.required<TcAudienceMix["split"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/audience-mix";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";

  let { sectors, split }: { sectors: TcAudienceMix["sectors"]; split: TcAudienceMix["split"] } = $props();
  let el: TcAudienceMix;
</script>

<tc-audience-mix bind:this={el} {sectors} {split}></tc-audience-mix>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Who is reading"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `sectors` | – | `AudienceShare[]` | `[]` | Readers by sector, in the order given |
| `split` | – | `AudienceSplit \| null` | `null` | Readers inside and outside the organisation; null hides the split |
| `places` | – | `AudienceShare[]` | `[]` | Readers by place, largest first as given; put "Other" last yourself |
| `sectorsLabel` | `sectors-label` | `string` | `"Sector"` | The heading of the sectors |
| `splitLabel` | `split-label` | `string` | `"Internal vs external"` | The heading of the internal-versus-external split |
| `placesLabel` | `places-label` | `string` | `"Where"` | The heading of the places |
| `internalLabel` | `internal-label` | `string` | `"Internal"` | The name of the internal share in the split |
| `externalLabel` | `external-label` | `string` | `"External"` | The name of the external share in the split |
| `unit` | `unit` | `string` | `"readers"` | What the shares are of, for the readout: "54% of readers" |
| `embedded` | `embedded` | `boolean` | `false` | No card or header – for use inside another component |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-audm-ink` | `var(--tc-chart-1)` | both |

#### Design tokens it reads (44)

`--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `sectors` | `el.sectors = …;` | `<… sectors={…} />` | `<tc-audience-mix :sectors="…">` | `<tc-audience-mix [sectors]="…">` | `<tc-audience-mix {sectors}>` |
| `split` | `el.split = …;` | `<… split={…} />` | `<tc-audience-mix :split="…">` | `<tc-audience-mix [split]="…">` | `<tc-audience-mix {split}>` |
| `places` | `el.places = …;` | `<… places={…} />` | `<tc-audience-mix :places="…">` | `<tc-audience-mix [places]="…">` | `<tc-audience-mix {places}>` |

*Also attributes: `heading`, `description`, `sectors-label`, `split-label`, `places-label`, `internal-label`, `external-label`, `unit` and 2 more – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-audience-mix")` returns a `TcAudienceMix` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";`
- **React / Next.js:** Props: `import type { AudienceMixProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AudienceMix>`. The element class, for refs: `import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAudienceMix["sectors"]` with `import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";`
- **Angular:** The directive types the template: `[sectors]` takes `TcAudienceMix["sectors"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAudienceMix } from "@adamstavely/trenchcoat/audience-mix";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

The rows are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ (or ← / →) | Moves to the previous or next row, across groups |
| Home / End | Moves to the first or last row |
| Tab | Leaves the groups |

### Screen readers

Each group is a section named by its heading, holding a list. Each row reads its name and share, “Industry, 23%”;
the two parts of the split read the same way, “Internal, 6%”. The bars, the split key and the readout repeat what
the rows say, so they're hidden from screen readers.

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

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.0 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **21.3 KB** | **7.1 KB** |
| With Lit – the first component on a page | 40.9 KB | 13.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 84 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of places replaced |
| First on the page | 8.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.6 ms | places: first render, 554 nodes; update 1.9 ms |
| 1,000 items | 38 ms | places: first render, 5,054 nodes; update 18 ms |

1,000 items of places: 38 ms, 5,054 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name sectors and places as readers would: “Government”, “United Kingdom”, not codes.
- Put "Other" last in `places` yourself, with what's left over.
- Set `unit` to who the shares are of – “readers”, “downloads” – for the readout.

## Do and don't

### Do

- Keep each group to about six rows; fold the rest into "Other".
- Use the same order for sectors everywhere they appear, so they compare at a glance.

### Don't

- Don't mix units in one group – each group's shares come from its own total.
- Don't use it for more than three groups; a page of mixes reads better as a table.

## Related

- [Publication Impact](publication-impact.md) – One paper's impact on one card – venue, topic, grade and authors, downloads, views, citations and attention with a reads sparkline, mentions, who is reading, and peer, reader and sponsor feedback with a sentiment each
- [Breakdown Chart](breakdown-chart.md) – Stacked bar chart with measure, slice and segment pickers, a hover breakdown and a linked table
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **`tc-audience-mix`:** who is reading. - **Breakdowns:** sector mix, internal versus external, and top places.
