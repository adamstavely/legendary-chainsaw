<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Panel Card

**Workspace & sessions** · New

One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.

- **Element:** `<tc-panel-card>`
- **Size:** 5.4 KB gzip · 15.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/panel-card";` |
| React / Next.js | `import { PanelCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/panel-card";` · tags starting with tc- are custom elements |
| Angular | `import { PanelCard } from "@adamstavely/trenchcoat/angular/panel-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/panel-card";` |

## Example

The live example is in the gallery at `#/panel-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One section of a side panel: a heading, a short value at the right and the page's own content, which folds away. As a
link it has no content, and the whole row opens something else, such as a details view.

### When to use

- Side panels and inspectors made of several small sections.
- A summary row, such as "51 outputs", that opens the full view.

### When not to use

- A full-width page section – use the page's own headings.
- Motion alone, with your own button – use [Collapse](../motion/collapse.md).
- A long list of filters – use [Filter Menu](filter-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Heading** `.ui-pnc__head` – holds the row's button
2. **Button** `.ui-pnc__button` – the whole row
3. **Title** `.ui-pnc__title` – the section's name
4. **Chevron** `.ui-pnc__chevron` – points right when shut, down when open
5. **Value** `.ui-pnc__value` – the short text at the right
6. **Card** `.ui-pnc__card` – the white surface behind the content in Standard

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and shadow. A page can set `--tc-pnc-pad`, the space around the content.

## Usage

### HTML

```html
<tc-panel-card id="reports" heading="Reports" value="51" expanded>
  <p>Weekly sample counts</p>
</tc-panel-card>

<script type="module">
  import "@adamstavely/trenchcoat/panel-card";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#reports").addEventListener("tc-expanded-change", (e) => {
    console.log(e.detail.expanded);
  });
</script>
```

### React / Next.js

```tsx
import { PanelCard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reports({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <PanelCard title="Freezers" defaultExpanded>
        <p>North wing, rack 4</p>
      </PanelCard>
      <PanelCard title="Reports" value="51" mode="link" onTcOpen={onOpen} />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/panel-card";
import "@adamstavely/trenchcoat/tokens.css";

const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-panel-card @tc-expanded-change="onExpandedChange"></tc-panel-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { PanelCard } from "@adamstavely/trenchcoat/angular/panel-card";

@Component({
  selector: "app-panel-card-example",
  imports: [PanelCard],
  template: `<tc-panel-card (tc-expanded-change)="onExpandedChange($event)"></tc-panel-card>`,
})
export class PanelCardExample {
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/panel-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";

  let el: TcPanelCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-panel-card bind:this={el}></tc-panel-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The section's name |
| `value` | `value` | `string` | `""` | Short text at the right, such as a count |
| `mode` | `mode` | `PanelCardMode` | `"fold"` | "fold" opens and shuts the content; "link" makes the whole row a button that fires tc-open |
| `expanded` | `expanded` | `boolean` | `false` | Whether the content shows, in "fold" mode |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and shadow, for a card that sits in something else's surface |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | The section was opened or shut ({ expanded }: PanelCardExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-open` | – | No | The row was pressed in "link" mode (detail: null) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-pnc-pad` | `var(--tc-space-3)` | both |
| `--tc-pnc-glyph` | `var(--tc-space-3-5)` | both |

#### Design tokens it reads (24)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-duration-base`, `--tc-ease-move`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-tray-inset`, `--tc-tray-radius`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `heading`, `value`, `mode`, `expanded`, `bare` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-panel-card id="panel-card"></tc-panel-card>

<script type="module">
  import "@adamstavely/trenchcoat/panel-card";

  const el = document.querySelector("#panel-card");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
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
import "@adamstavely/trenchcoat/panel-card";
import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";

const props = defineProps<{ initial: TcPanelCard["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcPanelCard["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-panel-card :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-panel-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PanelCard } from "@adamstavely/trenchcoat/angular/panel-card";
import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";

@Component({
  selector: "app-controlled-panel-card",
  imports: [PanelCard],
  template: `<tc-panel-card [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-panel-card>`,
})
export class ControlledPanelCard {
  readonly initial = input.required<TcPanelCard["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcPanelCard["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/panel-card";
  import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";

  let { initial }: { initial: TcPanelCard["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcPanelCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcPanelCard["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-panel-card bind:this={el} {expanded}></tc-panel-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-panel-card")` returns a `TcPanelCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";`
- **React / Next.js:** Props: `import type { PanelCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PanelCard>`. The element class, for refs: `import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPanelCard["heading"]` with `import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";`
- **Angular:** The directive types the template: `[heading]` takes `TcPanelCard["heading"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPanelCard } from "@adamstavely/trenchcoat/panel-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The section's name |
| `expanded` | `boolean` | Whether the content shows – controlled when given |
| `defaultExpanded` | `boolean` | Whether the content shows at first, when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: boolean) => void` | The section was opened or shut |

*Renamed or hidden on the wrapper: `heading`, `expanded`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the row, then into the open content and any aside |
| Enter / Space | Opens or shuts the section, or opens the link |

### Screen readers

The row is a button inside a heading. In `fold` mode it says whether it's expanded and controls the card. Shut content
isn't drawn, so it's neither read nor reached.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 8.2 KB | 3.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **15.1 KB** | **5.4 KB** |
| With Lit – the first component on a page | 34.6 KB | 11.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |

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

Keep the heading to a word or two, and the value to a count or a short state, such as "14 to reconnect". A child with
`slot="aside"` sits beside the value, such as a compact `meter-row`. For the smoothest glide, the card's height is
animated, so content of any size works.

## Do and don't

### Do

- Use `link` when pressing the row goes somewhere else.
- Listen for `tc-expanded-change` to remember which sections are open.

### Don't

- Don't put a control inside the heading or value: use the aside, which sits outside the button.
- Don't rely on the value's colour or position alone to report a problem: say it in words.

## Related

- [Icon Rail](icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.
- [Meter Row](meter-row.md) – How full something is on one line – a label, a percentage and a tiny bar, with a mark and a word when it's getting full; can open the details or sit compact beside a value.
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
- [Artifact Panel](artifact-panel.md) – Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download
