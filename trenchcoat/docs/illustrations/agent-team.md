<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Agent Team

**Illustrations**

A prompt types itself and branches out into three agents, each with a role and overlapping tool logos – three times, then the team stays

- **Element:** `<tc-agent-team>`
- **Size:** 12.7 KB gzip · 35.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-team";` |
| React / Next.js | `import { AgentTeam } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-team";` · tags starting with tc- are custom elements |
| Angular | `import { AgentTeam } from "@adamstavely/trenchcoat/angular/agent-team";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-team";` |

## Example

The live example is in the gallery at `#/illustrations/agent-team`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A short scene for “one prompt sets up a team of agents”. A prompt types itself into a pill and is sent; dashed lines
branch out from it to three agents, who pop in one after another with a portrait, a role and up to two tool logos.
The scene plays three times and then rests on the finished team. It plays only while it is on screen and the tab is
visible, and starts over when it comes back; with reduced motion it shows the finished team straight away.

### When to use

- A landing page or onboarding step that explains multi-agent setup in one picture.
- The empty state of a screen where people create an agent team.

### When not to use

- Showing a real team's live work – use [Agent Lanes](../components/agent-lanes.md) or [Agent Graph](../components/agent-graph.md).
- Inviting people (not agents) to a workspace – use [Team Invite](team-invite.md).
- Showing one message fanning out to several channels – use [Outreach Branches](outreach-branches.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Prompt** `.ui-at-prompt` – the pill the prompt types itself into, with the send button
2. **Lines** `.ui-at-lines` – the dashed branches from the prompt to each agent
3. **Agent** `.ui-at-agent` – a portrait with an online dot
4. **Role** `.ui-at-role` – the agent's role and its tool logos

## Usage

### HTML

```html
<tc-agent-team id="team"></tc-agent-team>

<script type="module">
  import "@adamstavely/trenchcoat/agent-team";
  import "@adamstavely/trenchcoat/tokens.css";

  const team = document.querySelector("#team");
  team.prompt = "Build a team to work my inbound pipeline";
  team.members = [
    { role: "Researcher", avatar: "/avatars/researcher.webp", tools: ["linkedin"] },
    { role: "SDR", avatar: "/avatars/sdr.webp", tools: ["gmail", "hubspot"] },
    { role: "Ops", avatar: "/avatars/ops.webp", tools: ["slack", "salesforce"] },
  ];
</script>
```

### React / Next.js

```tsx
import { AgentTeam } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function TeamHero() {
  return (
    <div style={{ width: 520 }}>
      <AgentTeam
        prompt="Build a team to work my inbound pipeline"
        members={[
          { role: "Researcher", avatar: "/avatars/researcher.webp", tools: ["linkedin"] },
          { role: "SDR", avatar: "/avatars/sdr.webp", tools: ["gmail", "hubspot"] },
          { role: "Ops", avatar: "/avatars/ops.webp", tools: ["slack", "salesforce"] },
        ]}
      />
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-team";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";

defineProps<{ members: TcAgentTeam["members"] }>();
</script>

<template>
  <tc-agent-team :members="members"></tc-agent-team>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentTeam } from "@adamstavely/trenchcoat/angular/agent-team";
import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";

@Component({
  selector: "app-agent-team-example",
  imports: [AgentTeam],
  template: `<tc-agent-team [members]="members()"></tc-agent-team>`,
})
export class AgentTeamExample {
  readonly members = input.required<TcAgentTeam["members"]>();
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-team";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";

  let { members }: { members: TcAgentTeam["members"] } = $props();
  let el: TcAgentTeam;
</script>

<tc-agent-team bind:this={el} {members}></tc-agent-team>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `prompt` | `prompt` | `string` | `"Build a team to work my inbound pipeline"` | Text that types itself into the prompt |
| `members` | – | `AgentTeamMember[]` | `[]` | Exactly three agents, left to right |
| `label` | `label` | `string \| undefined` | `undefined` | Accessible description of the scene – defaults to one built from the prompt and the roles |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agent-team-u` | `calc(100cqw / 600)` | both |
| `--tc-agent-team-ring` | `light-dark(rgba(10, 10, 10, 0.06), rgba(255, 255, 255, 0.08))` | both |
| `--tc-agent-team-accent` | `#2f6bff` | both |
| `--tc-agent-team-caret` | `light-dark(#171717, #ededed)` | both |
| `--tc-agent-team-halo-from` | `light-dark(rgba(221, 6, 116, 0.18), rgba(244, 114, 182, 0.16))` | both |
| `--tc-agent-team-halo-to` | `light-dark(rgba(94, 62, 224, 0.18), rgba(167, 139, 250, 0.16))` | both |
| `--tc-agent-team-dash` | `light-dark(#e4e7ec, rgba(255, 255, 255, 0.14))` | both |
| `--tc-agent-team-face` | `light-dark(#eef0f4, #2e2e33)` | both |
| `--tc-agent-team-online` | `light-dark(#34c46a, #3fd17a)` | both |
| `--tc-agent-team-dot-ring` | `light-dark(#e2f6e9, #24392c)` | both |
| `--tc-agent-team-dot-edge` | `light-dark(rgba(52, 196, 106, 0.1), rgba(63, 209, 122, 0.12))` | both |
| `--tc-agent-team-tool-ring` | `light-dark(#e5e5e5, rgba(255, 255, 255, 0.12))` | both |
| `--tc-agent-team-tool` | `light-dark(var(--tc-surface-overlay, light-dark(#ffffff, #232326)), #f4f4f5)` | both |
| `--tc-agent-team-tool-shadow` | `rgba(0, 0, 0, 0.08)` | both |
| `--tc-agent-team-stagger` | `160ms` | both |
| `--tc-agent-team-shadow` | `0 calc(10 * var(--tc-agent-team-u)) calc(24 * var(--tc-agent-team-u)) light-dark(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.4)), 0 calc(2 * var(--tc-agent-team-u)) calc(5 * var(--tc-agent-team-u)) light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3))` | both |

#### Design tokens it reads (16)

`--tc-duration-base`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-font-sans`, `--tc-font-weight-medium`, `--tc-radius-full`, `--tc-surface-overlay`, `--tc-text-primary`, `--tc-tracking-snug`

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
| `members` | `el.members = …;` | `<… members={…} />` | `<tc-agent-team :members="…">` | `<tc-agent-team [members]="…">` | `<tc-agent-team {members}>` |

*Also attributes: `prompt`, `label` – see the API table.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-team")` returns a `TcAgentTeam` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";`
- **React / Next.js:** Props: `import type { AgentTeamProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentTeam>`. The element class, for refs: `import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentTeam["members"]` with `import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";`
- **Angular:** The directive types the template: `[members]` takes `TcAgentTeam["members"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentTeam } from "@adamstavely/trenchcoat/agent-team";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `members` | `[AgentTeamMember, AgentTeamMember, AgentTeamMember]` | Exactly three agents, left to right |

*Renamed or hidden on the wrapper: `children`, `look`, `members`*

## Accessibility

### Keyboard

There is nothing to operate: the scene takes no focus and handles no keys.

### Screen readers

The host is an image (`role="img"`). Its name is `label` when set; otherwise it's built from the prompt and the roles
– “A prompt – “Build a team to work my inbound pipeline” – builds a team of three agents: Researcher, SDR, Ops”. The
typing and the agents themselves are hidden, so the name is read once and the animation adds nothing to it.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
- Forced colours (Windows High Contrast): controls keep a system-colour border, selection is Highlight, focus shows an outline.
- Reduced motion: animations stop or shorten under `prefers-reduced-motion`.
- Not yet tested with a screen reader by a person (VoiceOver, NVDA).

## Browser support

| Browser | Works fully from | Set by |
| --- | --- | --- |
| Chrome / Edge | **123** | light-dark() |
| Firefox | **121** | :has() |
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
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
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
| **This piece alone** | 28.0 KB | 10.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.6 KB** | **12.7 KB** |
| With Lit – the first component on a page | 56.9 KB | 19.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 74 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of members replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 24 ms | members: first render, 1,846 nodes; update 1.0 ms |
| 1,000 items | 157 ms | members: first render, 18,346 nodes; update 5.6 ms |

1,000 items of members: 157 ms. It renders every item, so a first render passes 50 ms (a long task) at about 320 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **31 timer callbacks/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Do and don't

### Do

- Give exactly three `members`, left to right; the React wrapper's type asks for three.
- Use square portraits – they are cropped to a circle.
- Keep the prompt to one short line; it doesn't wrap.

### Don't

- Don't give an agent more than two `tools`: only the first two are drawn.
- Don't rely on the animation to say anything the text around it doesn't – most people see it once.

## Related

- [Outreach Branches](outreach-branches.md) – Lines branching out to Gmail, Slack and Notion with colored pulses flowing down
- [Team Invite](team-invite.md) – Connected teammates – a cursor drags a new one into the empty slot, the line turns solid and they go online
- [Integration Flow](integration-flow.md) – Integration pills rotating along a dashed arc, each beaming its data into a central analysis hub – once round the integrations, then it rests
