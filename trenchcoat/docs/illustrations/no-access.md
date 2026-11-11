<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# No Access

**Illustrations** · New

A folder held shut by a padlock, for someone who isn't entitled to see what they opened; the lock settles a few times and rests

- **Element:** `<tc-no-access>`
- **Size:** 5.1 KB gzip · 13.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/no-access";` |
| React / Next.js | `import "@adamstavely/trenchcoat/no-access";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/no-access";` · tags starting with tc- are custom elements |
| Angular | `import { NoAccess } from "@adamstavely/trenchcoat/angular/no-access";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/no-access";` |

## Example

The live example is in the gallery at `#/illustrations/no-access`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A folder held shut by a padlock. It tells people they've reached something they aren't entitled to see, which reads clearer and calmer than a bare error.

### When to use

- The page shown when someone opens data they aren't entitled to, above a way to ask for access.
- A file or folder that's listed but restricted.

### When not to use

- The request itself – use [Access Request](../components/access-request.md).
- Nothing to show, with no restriction – use [Nothing Found](nothing-found.md).
- Something that failed – use [Something Wrong](something-wrong.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Folder** `.ui-nac-front` – the pocket the page sits behind
2. **Page** `.ui-nac-page` – what's inside, faint and out of reach
3. **Lock** `.ui-nac-lock` – settles a few times, then rests

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting.

## Usage

### HTML

```html
<tc-no-access></tc-no-access>
<h2>You don't have access to this</h2>

<script type="module">
  import "@adamstavely/trenchcoat/no-access";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { NoAccess } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function State() {
  return (
    <div>
      <NoAccess />
      <h2>You don't have access to this</h2>
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/no-access";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-no-access></tc-no-access>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { NoAccess } from "@adamstavely/trenchcoat/angular/no-access";

@Component({
  selector: "app-no-access-example",
  imports: [NoAccess],
  template: `<tc-no-access></tc-no-access>`,
})
export class NoAccessExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/no-access";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcNoAccess } from "@adamstavely/trenchcoat/no-access";

  let el: TcNoAccess;
</script>

<tc-no-access bind:this={el}></tc-no-access>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `""` | Accessible description – when set, the scene is announced as an image; otherwise it is decorative |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-no-access-back` | `light-dark(#dfe5ee, #33363d)` | both |
| `--tc-no-access-front` | `light-dark(#eef2f7, #26282d)` | both |
| `--tc-no-access-edge` | `light-dark(#d3dae4, rgba(255, 255, 255, 0.1))` | both |
| `--tc-no-access-page` | `light-dark(#ffffff, #3c3f46)` | both |
| `--tc-no-access-line` | `light-dark(#e3e7ed, #50545c)` | both |
| `--tc-no-access-lock` | `light-dark(#5b6472, #c9ced6)` | both |
| `--tc-no-access-key` | `light-dark(#ffffff, #26282d)` | both |
| `--tc-no-access-glow` | `light-dark(rgba(200, 168, 229, 0.28), rgba(200, 168, 229, 0.14))` | both |
| `--tc-no-access-soft` | `12px` | both |
| `--tc-no-access-beat` | `3.2s` | both |

#### Design tokens it reads (1)

`--tc-ease-standard`

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

*Also attributes: `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-no-access")` returns a `TcNoAccess` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcNoAccess } from "@adamstavely/trenchcoat/no-access";`
- **React / Next.js:** The element class: `import type { TcNoAccess } from "@adamstavely/trenchcoat/no-access";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcNoAccess["label"]` with `import type { TcNoAccess } from "@adamstavely/trenchcoat/no-access";`
- **Angular:** The directive types the template: `[label]` takes `TcNoAccess["label"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcNoAccess } from "@adamstavely/trenchcoat/no-access";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcNoAccess } from "@adamstavely/trenchcoat/no-access";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

Decorative by default: the host is `aria-hidden="true"` and is skipped. With `label`, the host becomes `role="img"` named
by the label. The heading beside it usually says enough, so leave `label` off unless the picture adds something.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

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
| **This piece alone** | 6.4 KB | 2.7 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **13.6 KB** | **5.1 KB** |
| With Lit – the first component on a page | 33.2 KB | 11.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 12 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 7.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Pair it with a short heading ("You don't have access to this") and one line on what to do next.

## Do and don't

### Do

- Size its container, not the illustration: it fills the width at a 3 : 2 frame.
- Put a real action next to it, such as Request access.

### Don't

- Don't rely on the picture alone to say what happened. Always add words.

## Related

- [Access Request](../components/access-request.md) – Ask for access to one piece of data – the resource with its owner and classification in words, the level, how long, a required justification and the fields needed – then where it stands: pending with who decides, approved with the time left, denied with the reason, or expired
- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Nothing Found](nothing-found.md) – A magnifying glass passing over blank results, for a search or filter with no matches; it looks across a few times and rests
- [Something Wrong](something-wrong.md) – Two connected tiles with the line between them broken, for a page or request that failed; the gap pulses a few times and rests

## Changelog

- **No Access** (`tc-no-access`), **Nothing Found** (`tc-nothing-found`) and **Something Wrong** (`tc-something-wrong`) – illustrations for the states people reach when a page can't show what they wanted.
