<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Team Invite

**Illustrations**

Connected teammates – a cursor drags a new one into the empty slot, the line turns solid and they go online

- **Element:** `<tc-team-invite>`
- **Size:** 7.4 KB gzip · 22.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/team-invite";` |
| React / Next.js | `import { TeamInvite } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/team-invite";` · tags starting with tc- are custom elements |
| Angular | `import { TeamInvite } from "@adamstavely/trenchcoat/angular/team-invite";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/team-invite";` |

## Example

The live example is in the gallery at `#/illustrations/team-invite`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small scene about bringing someone onto a team: two teammates are connected, an empty dashed slot waits next to
them, and a cursor drags a third teammate into it. The new avatar lands, the dashed line turns solid and their status
dot lights up – then the scene starts over, and after the third time it stays on the finished team. With reduced
motion it shows a still frame of the waiting team. It gives an invite screen or an empty team page a friendly, wordless picture of what happens next.

### When to use

- An empty state for a team, workspace or project with nobody invited yet.
- Next to an invite form or link, to show what inviting does.
- Onboarding steps and marketing pages about collaboration.

### When not to use

- Showing several AI agents working together – use [Agent Team](agent-team.md).
- Showing the tools or companies a product works with – use [Logo Cluster](logo-cluster.md).
- A list of the real people on a team with their roles – show avatars with names, not an illustration.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Teammate** `.ui-ti-node--a` – one of the two avatars already on the team, with its status dot
2. **Empty slot** `.ui-ti-slot` – the dashed circle with a plus, where the new teammate lands
3. **New teammate** `.ui-ti-node--c` – the third avatar, dragged in by the cursor

## Usage

### HTML

```html
<tc-team-invite id="invite" label="Invite teammates to work with you"></tc-team-invite>

<script type="module">
  import "@adamstavely/trenchcoat/team-invite";

  document.querySelector("#invite").avatars = [
    { src: "/avatars/maya.webp" },
    { src: "/avatars/jonas.webp" },
    { src: "/avatars/priya.webp" },
  ];
</script>
```

### React / Next.js

```tsx
import { TeamInvite } from "@adamstavely/trenchcoat/react";

export function EmptyTeam() {
  return (
    <TeamInvite
      label="Invite teammates to work with you"
      avatars={[
        { src: "/avatars/maya.webp", name: "Maya Kim" },
        { src: "/avatars/jonas.webp", name: "Jonas Ortiz" },
        { src: "/avatars/priya.webp", name: "Priya Shah" },
      ]}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/team-invite";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";

defineProps<{ avatars: TcTeamInvite["avatars"] }>();
</script>

<template>
  <tc-team-invite :avatars="avatars"></tc-team-invite>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TeamInvite } from "@adamstavely/trenchcoat/angular/team-invite";
import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";

@Component({
  selector: "app-team-invite-example",
  imports: [TeamInvite],
  template: `<tc-team-invite [avatars]="avatars()"></tc-team-invite>`,
})
export class TeamInviteExample {
  readonly avatars = input.required<TcTeamInvite["avatars"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-invite";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";

  let { avatars }: { avatars: TcTeamInvite["avatars"] } = $props();
  let el: TcTeamInvite;
</script>

<tc-team-invite bind:this={el} {avatars}></tc-team-invite>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `avatars` | – | `TeamInviteAvatar[]` | `[]` | The two teammates that are already connected, then the one being invited |
| `label` | `label` | `string \| undefined` | `undefined` | Describes the scene to assistive tech; defaults to a sentence built from the avatars' names when they have any |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-team-invite-u` | `calc(100cqw / 600)` | both |
| `--tc-team-invite-bubble-ring` | `light-dark(rgba(10, 10, 10, 0.06), rgba(255, 255, 255, 0.08))` | both |
| `--tc-team-invite-face` | `light-dark(#eef0f4, #2e2e33)` | both |
| `--tc-team-invite-line-a` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.14))` | both |
| `--tc-team-invite-line-b` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.14))` | both |
| `--tc-team-invite-dash` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.14))` | both |
| `--tc-team-invite-plus` | `light-dark(#c4c4c4, #5c5c61)` | both |
| `--tc-team-invite-online` | `light-dark(#34c46a, #3fd17a)` | both |
| `--tc-team-invite-dot-ring` | `light-dark(#e2f6e9, #24392c)` | both |
| `--tc-team-invite-dot-edge` | `light-dark(rgba(52, 196, 106, 0.1), rgba(63, 209, 122, 0.12))` | both |
| `--tc-team-invite-cursor` | `#141b34` | both |
| `--tc-team-invite-shadow` | `0 calc(10 * var(--tc-team-invite-u)) calc(24 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.4)), 0 calc(2 * var(--tc-team-invite-u)) calc(5 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3))` | both |
| `--tc-team-invite-lift` | `0 calc(18 * var(--tc-team-invite-u)) calc(34 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.5)), 0 calc(3 * var(--tc-team-invite-u)) calc(8 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.3))` | both |
| `--tc-team-invite-loop` | `4.4s` | both |
| `--tc-team-invite-runs` | `2.7` | both |

#### Design tokens it reads (3)

`--tc-ease-in-out`, `--tc-ease-out`, `--tc-surface-overlay`

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
| `avatars` | `el.avatars = …;` | `<… avatars={…} />` | `<tc-team-invite :avatars="…">` | `<tc-team-invite [avatars]="…">` | `<tc-team-invite {avatars}>` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-team-invite")` returns a `TcTeamInvite` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";`
- **React / Next.js:** Props: `import type { TeamInviteProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TeamInvite>`. The element class, for refs: `import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTeamInvite["avatars"]` with `import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";`
- **Angular:** The directive types the template: `[avatars]` takes `TcTeamInvite["avatars"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTeamInvite } from "@adamstavely/trenchcoat/team-invite";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `avatars` | `[TeamInviteAvatar, TeamInviteAvatar, TeamInviteAvatar]` | The two teammates that are already connected, then the one being invited |

*Renamed or hidden on the wrapper: `children`, `look`, `avatars`*

## Accessibility

### Screen readers

With names on the avatars, or a `label`, the whole scene is one image with a description – “Maya Kim and Jonas Ortiz
are connected; Priya Shah is dragged into the empty slot and joins the team”. Without either it is decorative and
hidden from assistive technology. Nothing in it can be operated.

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 14.6 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.3 KB** | **7.4 KB** |
| With Lit – the first component on a page | 41.8 KB | 13.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 26 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of avatars replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.0 ms | avatars: first render, 26 nodes; update 0.0 ms |
| 1,000 items | 1.0 ms | avatars: first render, 26 nodes; update 0.0 ms |

What it renders doesn't grow with avatars (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

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

- Use square portraits – they are shown in circles; initials on a colour work as well as photos.
- Give `name`s only when they are real people the viewer knows; otherwise leave the scene decorative, or pass a
  `label` that says what it means: “Invite teammates to work with you”.

## Do and don't

### Do

- Use the people the viewer will actually invite, or neutral placeholders – not stock photos of strangers.
- Let it sit beside the invite action, so the picture and the button tell the same story.

### Don't

- Don't use the avatars to stand for specific people the page doesn't name elsewhere.
- Don't rely on the scene to explain inviting – say it in words next to it too.

## Related

- [Agent Team](agent-team.md) – A prompt types itself and branches out into three agents, each with a role and overlapping tool logos – three times, then the team stays
- [Logo Cluster](logo-cluster.md) – Your mark on a white disc in the middle – company logos bounce out of it and settle around it; the ring turns once
- [Project Flow](project-flow.md) – Animated scene of a client task branching into subtasks, notes and assigned roles; follows the page theme (light or dark scene); `theme` pins one
