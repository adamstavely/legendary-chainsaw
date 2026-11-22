<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Page State

**Illustrations** · New

The full-page and empty states as one illustration – nothing found, first use, offline, something wrong, page not found, link expired, no access, access requested, session expired, limit reached, maintenance, coming soon, not available in your region and AI unavailable – each its own small scene with a colour, finite motion and words that follow the status unless `caption` sets its own

- **Element:** `<tc-page-state>`
- **Size:** 8.7 KB gzip · 31.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/page-state";` |
| React / Next.js | `import "@adamstavely/trenchcoat/page-state";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/page-state";` · tags starting with tc- are custom elements |
| Angular | `import { PageState } from "@adamstavely/trenchcoat/angular/page-state";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/page-state";` |

## Example

The live example is in the gallery at `#/illustrations/page-state`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The full-page and empty states as one illustration: a small scene in the soft style of the state illustrations – a tile, one pastel mark with a darker edge and ink, a soft glow beneath – and its words as real text under it. `status` picks the scene:

| `status` | Scene | Colour | Words | When to use |
|---|---|---|---|---|
| `nothing-found` | A magnifying glass passing over blank results | Slate | – | A search or filter with no matches |
| `first-use` | An empty workspace with one highlighted spot to start from | Blue | Nothing here yet | A new team, project or workspace with nothing in it |
| `offline` | A cloud and a device with the dashed link between them broken | Blue | You're offline | No network, or the server can't be reached for a while |
| `something-wrong` | Two connected tiles with the line between them broken | Amber | – | A page or request that failed |
| `not-found` | A torn page with a question mark | Slate | Page not found | An address that doesn't lead anywhere (404) |
| `link-expired` | Two parted chain links with a clock badge | Amber | This link has expired | A share link or invitation past its date |
| `no-access` | A folder held shut by a padlock | Purple glow | – | Someone signed in who isn't entitled to see it |
| `access-requested` | An envelope with an hourglass | Purple | Access requested | After someone asks for access, until it's decided |
| `session-expired` | A clock with a key | Amber | Session expired | Signed out after a while away; sign in again |
| `limit-reached` | A gauge at the end of its range with a clock | Amber | Usage limit reached | Work stopped until a quota or rate limit resets |
| `maintenance` | A wrench on a tile | Amber | Down for maintenance | Planned downtime, with when it'll be back |
| `coming-soon` | A wrapped box | Blue | Coming soon | A feature that isn't released yet |
| `region-unavailable` | A globe with a slash through it | Slate | Not available in your region | A service that isn't offered where someone is |
| `ai-unavailable` | The assistant's mark – a chat bubble with a sparkle – with a pause badge | Purple | AI is unavailable | The model or an AI feature is down or turned off; say what still works beside it |

Words follow the status unless `caption` sets its own. `nothing-found`, `something-wrong` and `no-access` fill the frame and have no words of their own, so they're decorative unless given `caption` or `label` – put the message beside them. Each scene moves a little a few times and rests.

### When to use

- A whole page or a large panel that can't show what was asked for, and why.
- An empty list or workspace, with the first step beside it.

### When not to use

- Where a single document stands – use [Doc Status](doc-status.md).
- A tray, queue or upload area – use [Tray Status](tray-status.md).
- Sensitive content covered on purpose – use [Content Hidden](content-hidden.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Scene** `.ui-pgs-art` – the status's drawing: tiles `.ui-pgs-tile`, marks `.ui-pgs-badge` and their ink `.ui-pgs-ink`
2. **Glow** `.ui-pgs-glow` – the soft light beneath
3. **Words** `.ui-pgs-caption` – what's happened; the status's own unless `caption` is set

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting, and each status has its own colour – slate, blue, amber or purple. It has no background of its own,
so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-page-state status="offline"></tc-page-state>

<script type="module">
  import "@adamstavely/trenchcoat/page-state";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { PageState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NoResults() {
  return <PageState status="nothing-found" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/page-state";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-page-state></tc-page-state>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { PageState } from "@adamstavely/trenchcoat/angular/page-state";

@Component({
  selector: "app-page-state-example",
  imports: [PageState],
  template: `<tc-page-state></tc-page-state>`,
})
export class PageStateExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/page-state";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPageState } from "@adamstavely/trenchcoat/page-state";

  let el: TcPageState;
</script>

<tc-page-state bind:this={el}></tc-page-state>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `status` | `PageStateKind` | `"nothing-found"` | Which state: "nothing-found", "offline", "something-wrong", "link-expired", "no-access", "limit-reached", "first-use", "not-found", "maintenance", "session-expired", "access-requested", "coming-soon", "region-unavailable" or "ai-unavailable" |
| `caption` | `caption` | `string \| undefined` | `undefined` | The words under the drawing; unset, the status's own; "" leaves them out |
| `label` | `label` | `string` | `""` | Accessible description, when it should say more than the words |
| `words` | – | `string` | – | The words shown and used as the name: `caption`, or the status's own |

#### Design tokens it reads (7)

`--tc-ease-move`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-line-height-tight`, `--tc-text-primary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `pageStateWords: Record<PageStateKind, string>` | The words for each status, when `caption` isn't set; "" – the scene fills the frame and has none of its own |

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

*Also attributes: `status`, `caption`, `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-page-state")` returns a `TcPageState` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPageState } from "@adamstavely/trenchcoat/page-state";`
- **React / Next.js:** The element class: `import type { TcPageState } from "@adamstavely/trenchcoat/page-state";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPageState["status"]` with `import type { TcPageState } from "@adamstavely/trenchcoat/page-state";`
- **Angular:** The directive types the template: `[status]` takes `TcPageState["status"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPageState } from "@adamstavely/trenchcoat/page-state";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPageState } from "@adamstavely/trenchcoat/page-state";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

The host is `role="img"`, named by `label` or else by its words, so the state is announced. With no words – `caption=""`, or one of the three statuses without words of their own – and no `label`, it's decorative and skipped, for when the words beside it say the same.

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

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 23.9 KB | 6.4 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **31.2 KB** | **8.8 KB** |
| With Lit – the first component on a page | 50.7 KB | 15.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 17 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 5.1 ms | default properties; includes adding its CSS to the document |

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

Say what happened and what to do next beside it: "Your changes are saved on this device and will sync when you're back online." Offer one clear action – Retry, Sign in, Request access, Clear filters.

## Do and don't

### Do

- Keep what people were doing on screen when you can, and say what still works.
- Use your own words with `caption` when your product says it differently.

### Don't

- Don't use it as the only explanation – say what's wrong and what to do in words beside it.
- Don't make it bigger than the message; it's there to set the tone, not to fill the page.

## Related

- [Doc Status](doc-status.md) – Where a document stands, as one illustration whose `status` picks the badge's drawing, colours, motion and words – draft, awaiting review, approved, changes requested, in translation, in quality control, in coordination, pending release, scheduled, released, queued, processing, in progress, success, partly processed, failed, uploading, downloading, malware scan or blocked, preview unavailable, locked, restricted, on legal hold, redacted, password protected, encrypted, shared, awaiting signature, signed, comments waiting, update available, converting to text, archived, in trash, expired, duplicate, metadata cleansing (required, in progress, failed, done), added to Readbook, working offline and sync conflict
- [Tray Status](tray-status.md) – A tray scene for where things stand – all done, nothing here yet, no matches, drop files to upload, new items (with a count), importing, import complete, imported with errors, export ready, sync complete, paused, upload failed or storage full – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own
- [Agent Scene](agent-scene.md) – The assistant in a small scene – happy above an empty tray, thinking beside a stack of pages, or asleep beside a sign
- [Content Hidden](content-hidden.md) – A picture pixelated into an obscured grid with a warning sign on it, with the words Sensitive content, to sit on an overlay covering obscene, sexual or graphic content
