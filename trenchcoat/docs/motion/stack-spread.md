<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Motion](README.md)

# Stack Spread

**Motion** · New

An overlapping row – reviewers' initials, file chips, tags – that fans apart on hover or focus, each item lifting as the pointer passes, with "+N" past a maximum

- **Element:** `<tc-stack-spread>`
- **Size:** 5.3 KB gzip · 14.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/stack-spread";` |
| React / Next.js | `import "@adamstavely/trenchcoat/stack-spread";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/stack-spread";` · tags starting with tc- are custom elements |
| Angular | `import { StackSpread } from "@adamstavely/trenchcoat/angular/stack-spread";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/stack-spread";` |

## Example

The live example is in the gallery at `#/motion/stack-spread`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An overlapping row that fans apart: the reviewers on a case as initials, a pile of file chips, a few tags. The items overlap, the first on top. Hovering, or moving focus in, spreads them so each one can be seen, and each lifts a little as the pointer passes. Past `max` the rest become a "+N" count.

### When to use

- Showing who's involved in something in little space, such as the reviewers on a case.
- A few attachments or tags in a dense row.

### When not to use

- A list people need to read in full – use [Team Roster](../components/team-roster.md).
- Tags people add and remove – use [Tag Input](../components/tag-input.md).
- Details about one person – use [Person Hovercard](../components/person-hovercard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `[data-ui="sspr"]` – the labelled group
2. **Item** `[data-sspr-item]` – your own items; the ones past `max` have `data-sspr-over` and are hidden
3. **Count** `.ui-sspr__more` – "+N" for the items past `max`

## Looks

No look of its own. The items keep theirs; a ring in the surface colour (`box-shadow: 0 0 0 2px var(--tc-surface-raised)`) separates overlapping avatars. A page can override `--tc-sspr-overlap` (`--tc-space-2-5`), `--tc-sspr-gap` (`--tc-space-1`) and `--tc-sspr-lift` (`--tc-space-0-5`). It follows `--tc-duration-moderate` and `--tc-ease-move`. Spreading moves the items towards the end of the line without moving anything around it, so leave room after it. With reduced motion nothing fans: the items sit apart with a small gap. Right to left, it fans to the left.

## Usage

### HTML

```html
<tc-stack-spread label="Reviewers" max="4">
  <span role="img" aria-label="Ama Owusu">AO</span>
  <span role="img" aria-label="Tomás Reyes">TR</span>
  <span role="img" aria-label="Mei Lin">ML</span>
</tc-stack-spread>

<script type="module">
  import "@adamstavely/trenchcoat/stack-spread";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { StackSpread } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Reviewers({ people }: { people: { id: string; name: string; initials: string }[] }) {
  return (
    <StackSpread label="Reviewers" max={4}>
      {people.map((p) => (
        <span key={p.id} role="img" aria-label={p.name}>{p.initials}</span>
      ))}
    </StackSpread>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/stack-spread";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-stack-spread></tc-stack-spread>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { StackSpread } from "@adamstavely/trenchcoat/angular/stack-spread";

@Component({
  selector: "app-stack-spread-example",
  imports: [StackSpread],
  template: `<tc-stack-spread></tc-stack-spread>`,
})
export class StackSpreadExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stack-spread";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStackSpread } from "@adamstavely/trenchcoat/stack-spread";

  let el: TcStackSpread;
</script>

<tc-stack-spread bind:this={el}></tc-stack-spread>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `max` | `max` | `number` | `5` | How many items show; the rest become a "+N" count |
| `label` | `label` | `string` | `"Items"` | The group's name, such as "Reviewers" |
| `spread` | `spread` | `boolean` | `false` | Keep it spread, whatever the pointer and focus do |
| `items` | – | `HTMLElement[]` | – | The items: every child but the element's own count |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sspr-overlap` | `var(--tc-space-2-5)` | both |
| `--tc-sspr-gap` | `var(--tc-space-1)` | both |
| `--tc-sspr-lift` | `var(--tc-space-0-5)` | both |
| `--tc-sspr-dir` | `1` | both |
| `--tc-sspr-n` | `1` | both |

#### Design tokens it reads (19)

`--tc-control-h-sm`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2-5`, `--tc-sspr-i`, `--tc-sspr-ly`, `--tc-surface-raised`, `--tc-surface-well`, `--tc-text-secondary`

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

*Also attributes: `max`, `label`, `spread` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-stack-spread")` returns a `TcStackSpread` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStackSpread } from "@adamstavely/trenchcoat/stack-spread";`
- **React / Next.js:** The element class: `import type { TcStackSpread } from "@adamstavely/trenchcoat/stack-spread";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStackSpread["max"]` with `import type { TcStackSpread } from "@adamstavely/trenchcoat/stack-spread";`
- **Angular:** The directive types the template: `[max]` takes `TcStackSpread["max"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStackSpread } from "@adamstavely/trenchcoat/stack-spread";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStackSpread } from "@adamstavely/trenchcoat/stack-spread";`

## Accessibility

### Keyboard

| Key | What it does |
| --- | --- |
| Tab | Into the items' own controls, or onto the row when no item takes focus; either fans it |
| Escape | Gathers it; it stays gathered until focus or the pointer leaves |

### Screen readers

The row is a group named by `label` ("Items" by default; name it, such as "Reviewers"). The items keep their own names – give initials an accessible name, such as `role="img"` with the person's name, or screen-reader text inside a button. The count reads as "+2 more". Gathered, the overlapping items aren't pointer targets of their own; the pointer reaches the row, which fans them first.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
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
| **This piece alone** | 7.9 KB | 3.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **14.7 KB** | **5.3 KB** |
| With Lit – the first component on a page | 34.3 KB | 11.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 9.2 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Use items of the same size. Keep `max` to what fits gathered, usually 3–5.

## Do and don't

### Do

- Give every item an accessible name.
- Put the most relevant item first; it sits on top.

### Don't

- Don't use it for long lists. Past a handful, a list reads better.
- Don't hide something people must see in the overflow count.

## Related

- [Team Roster](../components/team-roster.md) – A team directory with everyone's local time – status, role and team, how far ahead or behind you they are, whether they're working, skills – grouped and filtered as a list or a grid, with the team's best hour to meet
- [Person Hovercard](../components/person-hovercard.md) – The profile card behind any name – picture, pronouns, title and team, status, local time and time difference, manager, Email, Message, View profile and links – on hover, focus or tap
- [Tag Input](../components/tag-input.md) – A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal
- [List Motion](list-motion.md) – Rows that glide when reordered, added or removed, in any framework, instead of jumping
