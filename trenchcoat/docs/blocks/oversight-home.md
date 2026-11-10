<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Oversight Home

**Blocks** · New

A role's home dashboard – the headline that needs doing, the one thing first, KPI charts against last week and the service posture table with a state filter; switch roles at the top (uses `@adamstavely/trenchcoat/react`: `segmented-control`, `kpi-chart`, `data-table`, `button`)

- **Element:** `<tc-oversight-home>`
- **Size:** 33.8 KB gzip · 142.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/oversight-home";` |
| React / Next.js | `import { OversightHome } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/oversight-home";` · tags starting with tc- are custom elements |
| Angular | `import { OversightHome } from "@adamstavely/trenchcoat/angular/oversight-home";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/oversight-home";` |

## Example

The live example is in the gallery at `#/blocks/oversight-home`, in both looks; Replay restarts its animations.

## Overview

The first screen for someone who oversees AI work. Each role gets its own home, and a switch at the top right moves
between them. A home has the day and the role, a headline that says what needs doing and a line on what it covers; the
one thing that needs this person first, in a tinted band with a way in; the library's KPI Chart for each number the role
watches, this week against the last; and the service posture – the library's Data Table, read only, with each
service's state, availability and last event, and a filter by state. Down and limited services sort to the top.

### When to use

- The landing page of a review, governance or operations tool with several roles.
- Giving each role one sentence on what needs doing before the detail.
- Showing the health of the services a role depends on next to its numbers.

### When not to use

- One dashboard for everyone, with no roles – use [Ops Overview](../components/ops-overview.md).
- Service-level targets and breaches – use [SLA Status](../components/sla-status.md).
- A single trend – use [KPI Chart](../components/kpi-chart.md).

## Anatomy

1. **Intro** `.ui-ovh__intro` – the eyebrow, headline and summary, with the role switch
2. **Headline** `.ui-ovh__headline` – what needs doing, as a sentence
3. **Focus** `.ui-ovh__focus` – the one thing first, with its action
4. **KPIs** `.ui-ovh__kpis` – a chart per number, this period against the last
5. **Posture** `.ui-ovh__posture` – the services, their filter and their table

## Looks

The home is a page section, not a card. Its charts and table carry the look – Standard trays with white cards, or
Clean single cards – and Clean sets the headline and section title in a lighter weight. The focus band is the same in
both: the warning tint with a boxed icon.

## Usage

### HTML

```html
<tc-oversight-home id="home" role-id="reviewer"></tc-oversight-home>

<script type="module">
  import "@adamstavely/trenchcoat/oversight-home";
  import "@adamstavely/trenchcoat/tokens.css";

  const home = document.querySelector("#home");
  home.roles = [
    {
      id: "reviewer",
      label: "Reviewer",
      headline: "5 decisions are waiting for you.",
      focus: { label: "5 decisions awaiting review", detail: "2 are past due", action: "Start reviewing" },
      kpis: [{ id: "pending", label: "Awaiting review", value: "5", delta: -28, lowerIsBetter: true, labels: ["Mon", "Tue", "Wed"], values: [9, 8, 5], previous: [7, 9, 9] }],
      services: [{ id: "review", name: "Review queue", state: "normal", availability: "99.95%" }],
    },
  ];
  home.addEventListener("tc-role-change", (e) => console.log(e.detail.roleId));
  home.addEventListener("tc-open-focus", (e) => console.log(e.detail.role.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { OversightHome, type OversightRole } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const roles: OversightRole[] = [
  {
    id: "reviewer",
    label: "Reviewer",
    headline: "5 decisions are waiting for you.",
    focus: { label: "5 decisions awaiting review", action: "Start reviewing" },
    kpis: [{ id: "pending", label: "Awaiting review", value: "5", delta: -28, lowerIsBetter: true, labels: ["Mon", "Tue", "Wed"], values: [9, 8, 5] }],
    services: [{ id: "review", name: "Review queue", state: "normal", availability: "99.95%" }],
  },
  { id: "lead", label: "Team lead", headline: "2 runs are paused for approval.", kpis: [], services: [] },
];

export function Home() {
  const [role, setRole] = useState("reviewer");
  return <OversightHome roles={roles} role={role} onRoleChange={setRole} onOpenFocus={(r) => console.log(r.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/oversight-home";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";

defineProps<{ roles: TcOversightHome["roles"]; stateLabels: TcOversightHome["stateLabels"] }>();
const onRoleChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-oversight-home :roles="roles" :stateLabels="stateLabels" @tc-role-change="onRoleChange"></tc-oversight-home>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { OversightHome } from "@adamstavely/trenchcoat/angular/oversight-home";
import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";

@Component({
  selector: "app-oversight-home-example",
  imports: [OversightHome],
  template: `<tc-oversight-home [roles]="roles()" [stateLabels]="stateLabels()" (tc-role-change)="onRoleChange($event)"></tc-oversight-home>`,
})
export class OversightHomeExample {
  readonly roles = input.required<TcOversightHome["roles"]>();
  readonly stateLabels = input.required<TcOversightHome["stateLabels"]>();
  onRoleChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/oversight-home";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";

  let { roles, stateLabels }: { roles: TcOversightHome["roles"]; stateLabels: TcOversightHome["stateLabels"] } = $props();
  let el: TcOversightHome;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-role-change", on);
    return () => el.removeEventListener("tc-role-change", on);
  });
</script>

<tc-oversight-home bind:this={el} {roles} {stateLabels}></tc-oversight-home>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `roles` | – | `OversightRole[]` | `[]` | The roles, each with its own home |
| `roleId` | `role-id` | `string \| undefined` | `undefined` | Id of the role on show – the first one when unset or unknown |
| `stateLabels` | – | `Partial<Record<ServiceState, string>>` | `{}` | Words for the service states, merged over defaultServiceStateLabels |
| `currentLabel` | `current-label` | `string` | `"This week"` | Name of this period's line in each chart |
| `previousLabel` | `previous-label` | `string` | `"Last week"` | Name of the last period's line in each chart |
| `hideFocusAction` | `hide-focus-action` | `boolean` | `false` | Hide the focus card's action – nothing opens it |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-role-change` | – | Yes | Another role was picked ({ roleId, role }: OversightRoleChange – its id and the role); cancelable – prevented, `roleId` stays |
| `tc-open-focus` | – | No | The focus card's action was pressed ({ role }: OversightOpenFocus – the role on show) |

#### Design tokens it reads (54)

`--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-duration-moderate`, `--tc-ease-out`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-head-glyph-stroke`, `--tc-line-height-display`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-lg`, `--tc-shadow-control`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultServiceStateLabels: Record<ServiceState, string>` | The words for the service states |

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
| `roles` | `el.roles = …;` | `<… roles={…} />` | `<tc-oversight-home :roles="…">` | `<tc-oversight-home [roles]="…">` | `<tc-oversight-home {roles}>` |
| `stateLabels` | `el.stateLabels = …;` | `<… stateLabels={…} />` | `<tc-oversight-home :stateLabels="…">` | `<tc-oversight-home [stateLabels]="…">` | `<tc-oversight-home {stateLabels}>` |

*Also attributes: `role-id`, `current-label`, `previous-label`, `hide-focus-action` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-role-change` | Yes | `el.addEventListener("tc-role-change", (e) => …)` | `onRoleChange={…}` | `@tc-role-change="…"` | `(tc-role-change)="…($event)"` | `el.addEventListener("tc-role-change", …)` |
| `tc-open-focus` | No | `el.addEventListener("tc-open-focus", (e) => …)` | `onOpenFocus={…}` | `@tc-open-focus="…"` | `(tc-open-focus)="…($event)"` | `el.addEventListener("tc-open-focus", …)` |

### Controlled

`tc-role-change` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-oversight-home")` returns a `TcOversightHome` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";`
- **React / Next.js:** Props: `import type { OversightHomeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof OversightHome>`. The element class, for refs: `import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcOversightHome["roles"]` with `import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";`
- **Angular:** The directive types the template: `[roles]` takes `TcOversightHome["roles"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcOversightHome } from "@adamstavely/trenchcoat/oversight-home";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `role` | `string` | Id of the role on show (controlled) |
| `defaultRole` | `string` | The role at first when uncontrolled – the first one by default |
| `onRoleChange` | `(id: string) => void` | Called when another role is picked |
| `onOpenFocus` | `(role: OversightRole) => void` | The focus card's action was pressed; without it the action isn't shown |

*Renamed or hidden on the wrapper: `role`, `roleId`, `hideFocusAction`, `children`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the role switch, the focus action, the charts, the filter and the table |
| ← / → | In the role switch or the filter, picks the previous or next option |
| Enter / Space | Presses the focus action |

The charts and table keep their own keys – reading points, sorting.

### Screen readers

The headline is the page's heading; the focus band and the posture are regions named by their titles. The role switch
is a radio group named “Role”, the filter one named “Filter services by state”, each option with its count. Each state
is a word in the table, never only a colour.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | data-table, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, kpi-chart | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | button, internal/kit, data-table, kpi-chart, segmented-control | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button, data-table | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | button, data-table, kpi-chart | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | button, internal/base, data-table, kpi-chart, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button, internal/controllers, segmented-control | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | data-table, segmented-control | Scrollbars keep the browser's default width. |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | itself | Titles break where the line fills up instead of into even lines. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, kpi-chart, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 12.3 KB | 4.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 4.7 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [data-table](../components/data-table.md) · Element it renders | 49.4 KB | – |
| [segmented-control](../components/segmented-control.md) · Element it renders | 29.8 KB | – |
| [kpi-chart](../components/kpi-chart.md) · Element it renders | 25.3 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **142.7 KB** | **33.8 KB** |
| With Lit – the first component on a page | 164.5 KB | 41.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.2 ms** | default properties, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 1.9 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (data-table), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController), `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController), `ResizeObserver` (segmented-control).
- Listens on the page: `window pointerup` (data-table), `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController), `window keydown` (kpi-chart).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the headline as a sentence about the person's work: “5 decisions are waiting for you.”
- Keep `eyebrow` to the day and the role's area: “Tuesday · 27 October · Review”.
- Give the focus a label, a detail with its urgency, and an action verb: “Start reviewing”.
- Mark numbers where a drop is good news with `lowerIsBetter`, so the change shows the right colour.
- Say in `servicesNote` what this role can and can't see.

## Do and don't

### Do

- Keep three or four KPIs per role; the ones the role acts on.
- Order roles from the most to the least common.
- Open the focus's work on `tc-open-focus`.

### Don't

- Don't show every service to every role – give each role the ones it relies on.
- Don't use the focus band for something that doesn't need doing now.
- Don't put more than one headline sentence.

## Related

- [KPI Chart](../components/kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Data Table](../components/data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Ops Overview](../components/ops-overview.md) – An operations overview in one dense strip – a status line, a health pill and count tiles, each with its change since the last period in words and green or red by which way is good, an optional sparkline and tone, optionally opening what it counts
- [SLA Status](../components/sla-status.md) – How well service levels are met – the share on time, a Met / At risk / Breached split in words and marks, a weekly trend, a bar per type of request with a readout, and a period chooser

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
