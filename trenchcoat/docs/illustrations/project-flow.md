<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Project Flow

**Illustrations**

Animated scene of a client task branching into subtasks, notes and assigned roles; follows the page theme (light or dark scene); `theme` pins one

- **Element:** `<tc-project-flow>`
- **Size:** 26.2 KB gzip · 94.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/project-flow";` |
| React / Next.js | `import { ProjectFlow } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/project-flow";` · tags starting with tc- are custom elements |
| Angular | `import { ProjectFlow } from "@adamstavely/trenchcoat/angular/project-flow";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/project-flow";` |

## Example

The live example is in the gallery at `#/illustrations/project-flow`, at 320 px, 480 px or full width.

## Overview

An animated illustration of a piece of client work being broken down: a task card (“Task: Web Design”) branches
into its subtasks, the client's notes, the roles assigned to it and the tech stack it uses, and the cards build up
one after another. It shows in one picture how a product turns a request into organised, owned work. The scene
scales to the width of its container and follows the page theme, with a light and a dark version.

### When to use

- A landing page or feature section about project planning, task breakdown or team assignment.
- An empty state or onboarding step that explains what a project workspace will hold.
- Beside copy about turning client requests into tasks.

### When not to use

- Showing tools connecting to one another – use [Integration Flow](integration-flow.md).
- Showing one message branching into several follow-ups – use [Outreach Branches](outreach-branches.md).
- Showing a team of agents working together – use [Agent Team](agent-team.md).
- Showing someone's real project – use [Project Card](../components/project-card.md), which renders your own data; the scene's content is fixed.

## Usage

### HTML

```html
<tc-project-flow id="scene"></tc-project-flow>

<script type="module">
  import "@adamstavely/trenchcoat/project-flow";
  import "@adamstavely/trenchcoat/tokens.css";

  const scene = document.querySelector("#scene");
  scene.label = "A task with subtasks, client notes, assigned roles and its tech stack";
  scene.style.setProperty("--tc-project-flow-fade", "#fafafa");
</script>
```

### React / Next.js

```tsx
import { ProjectFlow } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PlanningHero() {
  return <ProjectFlow label="A task with subtasks, client notes, assigned roles and its tech stack" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/project-flow";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-project-flow></tc-project-flow>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { ProjectFlow } from "@adamstavely/trenchcoat/angular/project-flow";

@Component({
  selector: "app-project-flow-example",
  imports: [ProjectFlow],
  template: `<tc-project-flow></tc-project-flow>`,
})
export class ProjectFlowExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/project-flow";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProjectFlow } from "@adamstavely/trenchcoat/project-flow";

  let el: TcProjectFlow;
</script>

<tc-project-flow bind:this={el}></tc-project-flow>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `theme` | `theme` | `"light" \| "dark" \| undefined` | `undefined` | Light or dark cards; without it the scene follows the page theme |
| `label` | `label` | `string \| undefined` | `undefined` | Describes the scene to assistive tech (role="img"); without it the illustration is decorative and hidden |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-project-flow-bg` | `transparent` | both |
| `--tc-project-flow-fade` | `light-dark(#ffffff, #141414)` | both |
| `--tc-project-flow-dot` | `light-dark(#f2f2f2, #272727)` | both |
| `--tc-project-flow-card` | `light-dark(#ffffff, #1a1a1a)` | both |
| `--tc-project-flow-card-edge` | `light-dark(#efeeee, #202020)` | both |
| `--tc-project-flow-card-border` | `2px` | both |
| `--tc-project-flow-title` | `light-dark(#1b1b1b, #ffffff)` | both |
| `--tc-project-flow-sub` | `light-dark(#737373, rgba(255, 255, 255, 0.6))` | both |
| `--tc-project-flow-pill` | `light-dark(#fdf7e8, #352d19)` | both |
| `--tc-project-flow-pill-edge` | `light-dark(#ffebb9, #352d19)` | both |
| `--tc-project-flow-pill-text` | `light-dark(#8a6510, #eeb629)` | both |
| `--tc-project-flow-pill-weight` | `500` | both |
| `--tc-project-flow-tile` | `light-dark(#ffffff, #292929)` | both |
| `--tc-project-flow-tile-end` | `light-dark(#f8f8f8, #292929)` | both |
| `--tc-project-flow-avatar-purple` | `light-dark(#f0e8fd, #2e2653)` | both |
| `--tc-project-flow-avatar-yellow` | `light-dark(#fdf7e8, #352d19)` | both |
| `--tc-project-flow-avatar-pink` | `light-dark(#fde8e8, #59274b)` | both |
| `--tc-project-flow-client-backdrop` | `light-dark(rgba(189, 189, 189, 0.2), rgba(218, 218, 218, 0.2))` | both |
| `--tc-project-flow-client-glow` | `light-dark(rgba(190, 190, 190, 0.6), rgba(0, 0, 0, 0.6))` | both |
| `--tc-project-flow-line` | `light-dark(#e8e8e8, rgba(255, 255, 255, 0.8))` | both |
| `--tc-project-flow-title-size` | `37.618px` | both |
| `--tc-project-flow-sub-size` | `26.333px` | both |
| `--tc-project-flow-pill-size` | `20.674px` | both |

#### Design tokens it reads (6)

`--tc-font-sans`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-text-primary`, `--tc-tracking-tight`

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

*Also attributes: `theme`, `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-project-flow")` returns a `TcProjectFlow` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProjectFlow } from "@adamstavely/trenchcoat/project-flow";`
- **React / Next.js:** Props: `import type { ProjectFlowProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProjectFlow>`. The element class, for refs: `import type { TcProjectFlow } from "@adamstavely/trenchcoat/project-flow";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProjectFlow["theme"]` with `import type { TcProjectFlow } from "@adamstavely/trenchcoat/project-flow";`
- **Angular:** The directive types the template: `[theme]` takes `TcProjectFlow["theme"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProjectFlow } from "@adamstavely/trenchcoat/project-flow";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProjectFlow } from "@adamstavely/trenchcoat/project-flow";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

*Renamed or hidden on the wrapper: `children`, `look`, `pageScheme`, `settled`*

## Accessibility

### Screen readers

Without `label` the illustration is decorative: the element is `aria-hidden` and screen readers skip it. With
`label` it becomes an image (`role="img"`) named by that text – give it one when the picture carries meaning the
surrounding copy doesn't. With reduced motion the finished scene shows at once; the build-up also waits while the
scene is off screen or the tab is hidden.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| backdrop-filter (with the -webkit- prefix) | 76 (Edge 17) | 103 | 9 | 9 | itself | What's behind a translucent surface isn't blurred; the surface keeps its fill. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 87.2 KB | 23.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **94.3 KB** | **26.5 KB** |
| With Lit – the first component on a page | 115.1 KB | 34.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 213 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `label` as what the picture shows: “A task with subtasks, client notes, assigned roles and its tech stack”.
- Leave `label` off when the heading and text next to it already say the same thing.

## Do and don't

### Do

- Set `--tc-project-flow-fade` to your page's background colour so the scene's edges fade into it.
- Let it follow the page theme; set `theme` only where the scene sits on a surface of the opposite colour.
- Insert a new element to replay the build-up, for example when a carousel slide comes back.

### Don't

- Don't squeeze it into a narrow column – the cards scale with the width and their text gets too small to read.
- Don't present it as a working component; people will try to click the cards.

## Related

- [Integration Flow](integration-flow.md) – Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests
- [Outreach Branches](outreach-branches.md) – Lines branching out to Gmail, Slack and Notion with colored pulses flowing down
- [Agent Team](agent-team.md) – A prompt types itself and branches out into three agents, each with a role and overlapping tool logos – three times, then the team stays
