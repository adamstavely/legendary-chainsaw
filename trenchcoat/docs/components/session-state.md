<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Session State

**AI & chat** · New

Where a long LLM session stands – a health pill, tiles for the primary goal, open loops, pending artifacts and context pressure with a meter that warns as it fills, and status chips, the tiles optionally opening what they count

- **Element:** `<tc-session-state>`
- **Size:** 7.1 KB gzip · 22.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/session-state";` |
| React / Next.js | `import { SessionState } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/session-state";` · tags starting with tc- are custom elements |
| Angular | `import { SessionState } from "@adamstavely/trenchcoat/angular/session-state";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/session-state";` |

## Example

The live example is in the gallery at `#/session-state`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

“Where are we?” for a long LLM session, in one compact header. A health pill sits beside the title – Healthy,
Drifting, At risk or Stalled – and a row of tiles below gives the primary goal, the open loops, the artifacts still to
come and how full the context is. A row of status chips underneath says the rest in a few words: “Intent stable”,
“No approval blocked”, “2 files in context”, “1 inferred assumption”. Someone coming back to the session after an hour
knows in a glance whether it's on track and what's still open.

### When to use

- At the top of a long chat or agent session, so the person can re-orient after a break.
- When work spans many turns and loose ends pile up: open questions, artifacts promised, assumptions made.
- When the context is filling and the person should know before the model starts forgetting.

### When not to use

- The session's declared terms – intent, scope, limits, budget – use [Session Context Bar](session-context-bar.md).
- What fills the context, part by part – use [Context Map](context-map.md) or [Context Window](context-window.md).
- The agent's steps and their progress – use [Agent Plan](agent-plan.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Health** `.ui-sst__health` – how the session is going, as a tint, a mark and a word
2. **Tiles** `.ui-sst__tiles` – the goal, open loops, pending artifacts and context pressure, or the page's own
3. **Tile** `.ui-sst__tile` – a big figure, what it counts and one line of detail; a button with `actionable`
4. **Meter** `.ui-sst__meter` – a share such as context pressure, warning at 75% and danger at 90%
5. **Chips** `.ui-sst__chips` – short statuses, each in a tone; a chip with `action` is a button

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and the tiles as sunken wells. Clean is
one white card with the header as its first row and the tiles outlined with a hairline. The pill, meters and chips are
the same in both. The tiles sit four across, two by two in a narrower container, then in one column.

## Usage

### HTML

```html
<tc-session-state id="state" description="Where this session stands." health="healthy" goal="Ship the onboarding flow" pressure="0.68" actionable></tc-session-state>

<script type="module">
  import "@adamstavely/trenchcoat/session-state";
  import "@adamstavely/trenchcoat/tokens.css";

  const state = document.querySelector("#state");
  state.loops = ["copy", "empty state", "analytics"];
  state.artifacts = ["demo", "TSX starter"];
  state.chips = [
    { id: "intent", label: "Intent stable", tone: "violet" },
    { id: "files", label: "2 files in context", tone: "teal", action: true },
  ];
  state.addEventListener("tc-action", (e) => console.log(e.detail.id, e.detail.kind));
</script>
```

### React / Next.js

```tsx
import { SessionState } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Where() {
  return (
    <SessionState
      health="healthy"
      goal="Ship the onboarding flow"
      loops={["copy", "empty state", "analytics"]}
      artifacts={["demo", "TSX starter"]}
      pressure={0.68}
      chips={[{ id: "intent", label: "Intent stable", tone: "violet" }]}
      actionable
      onAction={(id) => console.log(id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/session-state";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";

defineProps<{ healthLabels: TcSessionState["healthLabels"]; loops: TcSessionState["loops"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-session-state :healthLabels="healthLabels" :loops="loops" @tc-action="onAction"></tc-session-state>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SessionState } from "@adamstavely/trenchcoat/angular/session-state";
import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";

@Component({
  selector: "app-session-state-example",
  imports: [SessionState],
  template: `<tc-session-state [healthLabels]="healthLabels()" [loops]="loops()" (tc-action)="onAction($event)"></tc-session-state>`,
})
export class SessionStateExample {
  readonly healthLabels = input.required<TcSessionState["healthLabels"]>();
  readonly loops = input.required<TcSessionState["loops"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-state";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";

  let { healthLabels, loops }: { healthLabels: TcSessionState["healthLabels"]; loops: TcSessionState["loops"] } = $props();
  let el: TcSessionState;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-session-state bind:this={el} {healthLabels} {loops}></tc-session-state>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Session state"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `health` | `health` | `SessionHealth \| undefined` | `undefined` | How the session is going: healthy, drifting, at-risk or stalled; unset hides the pill |
| `healthLabels` | – | `Partial<Record<SessionHealth, string>>` | `{}` | The health names, merged over the defaults (Healthy, Drifting, At risk, Stalled) |
| `goal` | `goal` | `string \| undefined` | `undefined` | The primary goal, for the default tiles |
| `loops` | – | `string[]` | `[]` | The open loops' names, for the default tiles |
| `artifacts` | – | `string[]` | `[]` | The artifacts still to come, for the default tiles |
| `pressure` | `pressure` | `number \| undefined` | `undefined` | How full the context is, from 0 to 1, for the default tiles; unset leaves the tile out |
| `tiles` | – | `SessionTile[] \| undefined` | `undefined` | The page's own tiles, in place of the defaults |
| `chips` | – | `SessionChip[]` | `[]` | The status chips under the tiles |
| `warnAt` | `warn-at` | `number` | `0.75` | A meter at or above this share turns warning |
| `dangerAt` | `danger-at` | `number` | `0.9` | A meter at or above this share turns danger |
| `actionable` | `actionable` | `boolean` | `false` | Makes the tiles buttons that fire tc-action |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | No | A tile or chip was pressed ({ id, kind }: SessionAction) |

#### Design tokens it reads (67)

`--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSessionHealthLabels: Record<SessionHealth, string>` | The health names used when the page gives none |

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
| `healthLabels` | `el.healthLabels = …;` | `<… healthLabels={…} />` | `<tc-session-state :healthLabels="…">` | `<tc-session-state [healthLabels]="…">` | `<tc-session-state {healthLabels}>` |
| `loops` | `el.loops = …;` | `<… loops={…} />` | `<tc-session-state :loops="…">` | `<tc-session-state [loops]="…">` | `<tc-session-state {loops}>` |
| `artifacts` | `el.artifacts = …;` | `<… artifacts={…} />` | `<tc-session-state :artifacts="…">` | `<tc-session-state [artifacts]="…">` | `<tc-session-state {artifacts}>` |
| `tiles` | `el.tiles = …;` | `<… tiles={…} />` | `<tc-session-state :tiles="…">` | `<tc-session-state [tiles]="…">` | `<tc-session-state {tiles}>` |
| `chips` | `el.chips = …;` | `<… chips={…} />` | `<tc-session-state :chips="…">` | `<tc-session-state [chips]="…">` | `<tc-session-state {chips}>` |

*Also attributes: `heading`, `description`, `health`, `goal`, `pressure`, `warn-at`, `danger-at`, `actionable` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-session-state")` returns a `TcSessionState` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";`
- **React / Next.js:** Props: `import type { SessionStateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SessionState>`. The element class, for refs: `import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSessionState["healthLabels"]` with `import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";`
- **Angular:** The directive types the template: `[healthLabels]` takes `TcSessionState["healthLabels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSessionState } from "@adamstavely/trenchcoat/session-state";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `onAction` | `(id: string, kind: "tile" \| "chip") => void` | A tile (with `actionable`) or a chip with `action` was pressed |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

With `actionable`, the tiles are one tab stop.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the previous or next tile |
| Home / End | Moves to the first or last tile |
| Enter / Space | Presses the tile – fires tc-action |
| Tab | Moves on to the chips that are buttons, then out |

### Screen readers

The tiles are a list named by the heading. Each tile reads its figure, what it counts and its detail – “3, Open loops,
prototype · naming · integration”. A meter's tile adds its level in words: “68%, Context pressure, comfortable”, “high”
from `warn-at` and “critical” from `danger-at`; the bar itself is hidden. The health pill reads its word, “Healthy”,
and its mark is hidden. The chips are a list labelled “Status”; a chip that's a button reads as one.

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

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.8 KB | 5.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.1 KB** | **7.1 KB** |
| With Lit – the first component on a page | 41.7 KB | 13.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 46 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of chips replaced |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.9 ms | chips: first render, 238 nodes; update 0.4 ms |
| 1,000 items | 16 ms | chips: first render, 2,038 nodes; update 1.6 ms |

1,000 items of chips: 16 ms, 2,038 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Write the goal as the outcome the session is for: “Ship the onboarding flow”, not “Chat about onboarding”.
- Name loops in a word or two each – they're joined with “ · ”.
- Write chips as states, not advice: “2 files in context”, “1 inferred assumption”.
- Use `drifting` when the intent has moved from the goal, `at-risk` when something blocks it, `stalled` when nothing
  has moved for a while.

## Do and don't

### Do

- Make the tiles actionable when there's somewhere to go: the loops list, the artifacts, the context.
- Keep chips to four or five, the ones that change what the person does next.
- Lower `warn-at` for models that degrade early as the context fills.

### Don't

- Don't repeat the session's terms here – that's `session-context-bar`'s job.
- Don't show Healthy when you don't know – leave `health` unset.
- Don't use chip tones for decoration – each tone should mean the same thing everywhere on the page.

## Related

- [Session Context Bar](session-context-bar.md) – The session's declared terms kept in view – intent, knowledge mode, scope, review, posture, limits, deadline and budget
- [Context Map](context-map.md) – What fills an agent's context window, as a living treemap – system prompt, tools, memory, every file, the chat and tool results as tiles that glide as it grows, the free space dashed, and compaction squeezing old turns into a summary
- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Agent Plan](agent-plan.md) – An agent's step-by-step plan to review before it runs – rename, drag to reorder, remove or add steps, then watch each one run with live timers and retry from a failed step

## Changelog

- **`tc-session-state`** (AI & chat): where a long LLM session stands. - **Header:** a health pill. - **Tiles:** primary goal, open loops, pending artifacts, and context pressure with a meter that warns as it fills. - **Chips:** status chips; the tiles can open what they count.
