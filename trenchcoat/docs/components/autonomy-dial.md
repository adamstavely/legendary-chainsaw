<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Autonomy Dial

**Agents**

How much an agent may do on its own – a three-stop dial, and its real actions gliding between “Runs on its own” and “Asks you first”, with a lock for what always asks

- **Element:** `<tc-autonomy-dial>`
- **Size:** 9.3 KB gzip · 31.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/autonomy-dial";` |
| React / Next.js | `import { AutonomyDial } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/autonomy-dial";` · tags starting with tc- are custom elements |
| Angular | `import { AutonomyDial } from "@adamstavely/trenchcoat/angular/autonomy-dial";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/autonomy-dial";` |

## Example

The live example is in the gallery at `#/autonomy-dial`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Sets how much an agent may do on its own, and shows what that means in its real actions. Three levels – Always ask,
If risky, Full auto – sit above two groups, “Runs on its own” and “Asks you first”; pick a level and the actions
glide from one group to the other while the counts roll. Risky and destructive actions carry a small tag, and the
lock on any action keeps it in “Asks you first” whatever the dial says. People see the consequence of a setting
before they live with it.

### When to use

- The autonomy setting of one agent, in its settings page or set-up flow.
- Where the actions differ in risk – reading versus sending versus deleting – and people need to see which ones
  will run unattended.
- Letting people make one action an exception (“always ask before refunds”) without dropping the whole level.

### When not to use

- Allow, ask or deny per tool and scope for several agents at once – use [Tool Permissions](tool-permissions.md).
- Asking for one permission at the moment the agent needs it – use [Permission Request](permission-request.md).
- Approving one action an agent is about to take – use [Approval Card](approval-card.md).
- A plain choice between a few options with no actions to show – use [Segmented Control](segmented-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Levels** `.ui-ad__segmented` – Always ask, If risky, Full auto
3. **Group** `.ui-ad__group` – “Runs on its own” or “Asks you first”, with a rolling count
4. **Action** `.ui-ad__row` – an icon, the label, a risk tag and what it touches
5. **Lock** `.ui-ad__pin` – keeps the action in “Asks you first”, whatever the level

## Looks

Standard puts the header on a gray tray above a white card with the levels, with a pill that glides under the chosen
level, and lays the two groups on the tray below. Clean is one white card, the header its first row and the groups inside it; the levels are
three equal buttons and the chosen one is raised with a border. Actions glide between the groups the same way in
both.

## Usage

### HTML

```html
<tc-autonomy-dial id="dial" heading="Support agent" level="1"></tc-autonomy-dial>

<script type="module">
  import "@adamstavely/trenchcoat/autonomy-dial";
  import "@adamstavely/trenchcoat/tokens.css";

  const dial = document.querySelector("#dial");
  dial.actions = [
    { id: "read", label: "Read tickets", detail: "Zendesk · all queues", risk: "safe" },
    { id: "send", label: "Send replies", detail: "Gmail · to customers", risk: "risky" },
    { id: "delete", label: "Delete spam tickets", detail: "Zendesk · permanently", risk: "destructive" },
  ];
  dial.pinned = ["delete"];
  dial.addEventListener("tc-level-change", (e) => console.log(e.detail.level));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AutonomyDial, type AgentAction, type AutonomyLevel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const actions: AgentAction[] = [
  { id: "read", label: "Read tickets", detail: "Zendesk · all queues", risk: "safe" },
  { id: "send", label: "Send replies", detail: "Gmail · to customers", risk: "risky" },
  { id: "delete", label: "Delete spam tickets", detail: "Zendesk · permanently", risk: "destructive" },
];

export function SupportAgentSettings() {
  const [level, setLevel] = useState<AutonomyLevel>(1);
  return <AutonomyDial title="Support agent" actions={actions} level={level} onLevelChange={setLevel} defaultPinned={["delete"]} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/autonomy-dial";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";

defineProps<{ actions: TcAutonomyDial["actions"]; pinned: TcAutonomyDial["pinned"] }>();
const onLevelChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-autonomy-dial :actions="actions" :pinned="pinned" @tc-level-change="onLevelChange"></tc-autonomy-dial>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AutonomyDial } from "@adamstavely/trenchcoat/angular/autonomy-dial";
import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";

@Component({
  selector: "app-autonomy-dial-example",
  imports: [AutonomyDial],
  template: `<tc-autonomy-dial [actions]="actions()" [pinned]="pinned()" (tc-level-change)="onLevelChange($event)"></tc-autonomy-dial>`,
})
export class AutonomyDialExample {
  readonly actions = input.required<TcAutonomyDial["actions"]>();
  readonly pinned = input.required<TcAutonomyDial["pinned"]>();
  onLevelChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/autonomy-dial";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";

  let { actions, pinned }: { actions: TcAutonomyDial["actions"]; pinned: TcAutonomyDial["pinned"] } = $props();
  let el: TcAutonomyDial;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-level-change", on);
    return () => el.removeEventListener("tc-level-change", on);
  });
</script>

<tc-autonomy-dial bind:this={el} {actions} {pinned}></tc-autonomy-dial>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `actions` | – | `AgentAction[]` | `[]` | The agent's actions; each sorts into "Runs on its own" or "Asks you first" by its risk, the level and the pins |
| `level` | `level` | `AutonomyLevel` | `1` | 0 Ask every time · 1 Ask before risky actions · 2 Full auto |
| `pinned` | – | `string[]` | `[]` | Ids of actions that always ask, whatever the level |
| `heading` | `heading` | `string` | `"Agent permissions"` | Heading, e.g. the agent's name |
| `subtitle` | `subtitle` | `string` | `"What it may do without asking you"` | Line under the heading |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-level-change` | – | Yes | The user picked a level ({ level: AutonomyLevel }); cancelable |
| `tc-pinned-change` | – | Yes | The user locked or unlocked an action ({ pinned: string[] }); cancelable |

#### Design tokens it reads (69)

`--tc-action-ghost-bg-hover`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `asksFirst(action: Pick<AgentAction, "id" \| "risk">, level: AutonomyLevel, pinned: string[]): void` | Does the agent have to ask before this action? |

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
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-autonomy-dial :actions="…">` | `<tc-autonomy-dial [actions]="…">` | `<tc-autonomy-dial {actions}>` |
| `pinned` | `el.pinned = …;` | `<… pinned={…} />` | `<tc-autonomy-dial :pinned="…">` | `<tc-autonomy-dial [pinned]="…">` | `<tc-autonomy-dial {pinned}>` |

*Also attributes: `level`, `heading`, `subtitle` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-level-change` | Yes | `el.addEventListener("tc-level-change", (e) => …)` | `ref.current.addEventListener("tc-level-change", …)` | `@tc-level-change="…"` | `(tc-level-change)="…($event)"` | `el.addEventListener("tc-level-change", …)` |
| `tc-pinned-change` | Yes | `el.addEventListener("tc-pinned-change", (e) => …)` | `ref.current.addEventListener("tc-pinned-change", …)` | `@tc-pinned-change="…"` | `(tc-pinned-change)="…($event)"` | `el.addEventListener("tc-pinned-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `level` and `pinned` itself unless a listener calls `preventDefault()` on `tc-level-change` or `tc-pinned-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-autonomy-dial id="autonomy-dial"></tc-autonomy-dial>

<script type="module">
  import "@adamstavely/trenchcoat/autonomy-dial";

  const el = document.querySelector("#autonomy-dial");
  el.addEventListener("tc-level-change", (e) => {
    e.preventDefault(); // the element keeps its level…
    if (allowed(e.detail.level)) el.level = e.detail.level; // …until the app sets it
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
import "@adamstavely/trenchcoat/autonomy-dial";
import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";

const props = defineProps<{ initial: TcAutonomyDial["level"] }>();
const level = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLevelChange = (e: CustomEvent<{ level: TcAutonomyDial["level"] }>) => {
  e.preventDefault();
  level.value = e.detail.level;
};
</script>

<template>
  <tc-autonomy-dial :level="level" @tc-level-change="onLevelChange"></tc-autonomy-dial>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AutonomyDial } from "@adamstavely/trenchcoat/angular/autonomy-dial";
import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";

@Component({
  selector: "app-controlled-autonomy-dial",
  imports: [AutonomyDial],
  template: `<tc-autonomy-dial [level]="level()" (tc-level-change)="onLevelChange($event)"></tc-autonomy-dial>`,
})
export class ControlledAutonomyDial {
  readonly initial = input.required<TcAutonomyDial["level"]>();
  readonly level = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLevelChange(e: CustomEvent<{ level: TcAutonomyDial["level"] }>) {
    e.preventDefault();
    this.level.set(e.detail.level);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/autonomy-dial";
  import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";

  let { initial }: { initial: TcAutonomyDial["level"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let level = $derived(initial);
  let el: TcAutonomyDial;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      level = (e as CustomEvent<{ level: TcAutonomyDial["level"] }>).detail.level;
    };
    el.addEventListener("tc-level-change", on);
    return () => el.removeEventListener("tc-level-change", on);
  });
</script>

<tc-autonomy-dial bind:this={el} {level}></tc-autonomy-dial>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-autonomy-dial")` returns a `TcAutonomyDial` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";`
- **React / Next.js:** Props: `import type { AutonomyDialProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AutonomyDial>`. The element class, for refs: `import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAutonomyDial["actions"]` with `import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";`
- **Angular:** The directive types the template: `[actions]` takes `TcAutonomyDial["actions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAutonomyDial } from "@adamstavely/trenchcoat/autonomy-dial";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `actions` | `AgentAction[]` | The agent's actions; each sorts into "Runs on its own" or "Asks you first" – `icon` takes a React node |
| `level` | `AutonomyLevel` | 0 Ask every time · 1 Ask before risky actions · 2 Full auto. Controlled when defined |
| `defaultLevel` | `AutonomyLevel` | Starting level when `level` isn't controlled |
| `onLevelChange` | `(level: AutonomyLevel) => void` | Called with the new level on every change, controlled or not |
| `pinned` | `string[]` | Ids of actions that always ask, whatever the level. Controlled when defined |
| `defaultPinned` | `string[]` | Starting pins when `pinned` isn't controlled |
| `onPinnedChange` | `(pinned: string[]) => void` | Called with the new list of pinned ids on every change, controlled or not |
| `title` | `string` | Heading, e.g. the agent's name |

*Renamed or hidden on the wrapper: `actions`, `level`, `pinned`, `heading`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the chosen level, then to each action's lock |
| → / ↓ | Picks the next level (stops at Full auto) |
| ← / ↑ | Picks the previous level (stops at Always ask) |
| Enter / Space | On a level, picks it; on a lock, locks or unlocks the action |

### Screen readers

The levels are a `radiogroup` named “Autonomy”, each level a `radio` with `aria-checked`; the group is described by
the chosen level's hint (“Safe actions run, risky ones wait for you”). Each group is a section named by its
heading. Each lock is a toggle button named “Always ask before: Send replies” with `aria-pressed`. A polite live
region sums up every change: “If risky: 3 on its own, 4 ask first”. When an action moves to the other group, focus
stays on its lock.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 23.0 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 20.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **31.4 KB** | **9.3 KB** |
| With Lit – the first component on a page | 53.3 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | the gallery demo's data, 145 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of actions replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | actions: first render, 1,680 nodes; update 3.2 ms |
| 1,000 items | 76 ms | actions: first render, 16,599 nodes; update 16 ms |

1,000 items of actions: 76 ms. It renders every item, so a first render passes 50 ms (a long task) at about 660 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 3 React commits (clean), 4 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `heading` is the agent's name (“Support agent”); `subtitle` says where the setting applies.
- Label actions as verbs on objects: “Send replies”, “Issue refund” – not system names.
- Use `detail` for what the action touches and its limits: “Stripe · up to $200”.
- Mark risk honestly: `risky` for what reaches people or money, `destructive` for what can't be undone.

## Do and don't

### Do

- List every action the agent can take, so the groups show the whole picture.
- Lock destructive actions by default (`pinned`) and let people unlock them.
- Save the level and pins from `tc-level-change` and `tc-pinned-change`; call `preventDefault()` to keep control.

### Don't

- Don't hide destructive actions to make Full auto look safer.
- Don't add a fourth level – the three stops and the locks cover the exceptions.
- Don't write `detail` as a sentence; it is cut to one line.

## Related

- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
