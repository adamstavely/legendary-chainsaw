<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Kill Switch

**Trust & calibration** · New

System posture and the emergency stop – what's running, a confirmed Stop that says what it halts, and resume

- **Element:** `<tc-kill-switch>`
- **Size:** 10.0 KB gzip · 35.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/kill-switch";` |
| React / Next.js | `import { KillSwitch } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/kill-switch";` · tags starting with tc- are custom elements |
| Angular | `import { KillSwitch } from "@adamstavely/trenchcoat/angular/kill-switch";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/kill-switch";` |

## Example

The live example is in the gallery at `#/kill-switch`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The emergency stop for a system that runs agents, schedules and queues on its own. It says how things stand – normal,
elevated or stopped – lists what's running, and offers Stop on each item and Stop everything. Stopping always asks
first, in a dialog that names exactly what will halt and takes a reason; confirming adds an active stop that stays on
screen, with who stopped it, when and why, until someone presses Resume. The element halts nothing itself: it tells
the app, which does.

### When to use

- An operations or admin page for agents that act without a person in the loop.
- Incident response, where someone must halt work quickly and others must see that it's halted, and why.
- Pausing one agent or schedule while its policy or prompt is fixed, without touching the rest.

### When not to use

- Approving or denying one action an agent is about to take – use [Approval Card](approval-card.md).
- Setting how much an agent may do on its own – use [Autonomy Dial](autonomy-dial.md).
- Stopping work when it runs over a spending limit – use [Budget Guard](budget-guard.md).
- Checking what the policy would do with an action – use [Policy Simulator](policy-simulator.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a power icon, the title and how things stand, in a sentence
2. **Posture badge** `.ui-ks__posture` – Normal, Elevated or Stopped, at the header's right
3. **Active stop** `.ui-ks__stop-row` – what's halted, by whom, when and why, with Resume
4. **Running item** `.ui-ks__item` – an agent, schedule or queue with its kind and a quiet detail
5. **Stop** `.ui-ks__stop` – halts one item, after confirming
6. **Stop everything** `.ui-ks__stop-all` – halts everything still running, after confirming

## Looks

Standard puts the header on a gray tray above a white card, with the note and Stop everything on the tray below it.
Clean is one white card with the header as its first row and Stop everything in its last row, quieter text and thinner icons. The confirmation dialog is the same in
both.

## Usage

### HTML

```html
<tc-kill-switch id="ks"></tc-kill-switch>

<script type="module">
  import "@adamstavely/trenchcoat/kill-switch";
  import "@adamstavely/trenchcoat/tokens.css";

  const ks = document.querySelector("#ks");
  ks.running = [
    { id: "support", label: "Support agent", kind: "Agent", detail: "14 conversations open" },
    { id: "sync", label: "Nightly CRM sync", kind: "Schedule" },
  ];
  ks.addEventListener("tc-stop", (e) => {
    fetch("/api/stops", { method: "POST", body: JSON.stringify({ target: e.detail.stop.target, reason: e.detail.stop.reason }) });
  });
  ks.addEventListener("tc-resume", (e) => fetch(`/api/stops/${e.detail.stop.id}`, { method: "DELETE" }));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { KillSwitch, type KillRunning, type KillStop } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Operations({ running, halt }: { running: KillRunning[]; halt: (stop: KillStop) => void }) {
  const [stops, setStops] = useState<KillStop[]>([]);
  return <KillSwitch running={running} stops={stops} onStopsChange={setStops} onStop={(stop) => halt(stop)} requireReason />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/kill-switch";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";

defineProps<{ running: TcKillSwitch["running"]; stops: TcKillSwitch["stops"] }>();
const onStop = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-kill-switch :running="running" :stops="stops" @tc-stop="onStop"></tc-kill-switch>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { KillSwitch } from "@adamstavely/trenchcoat/angular/kill-switch";
import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";

@Component({
  selector: "app-kill-switch-example",
  imports: [KillSwitch],
  template: `<tc-kill-switch [running]="running()" [stops]="stops()" (tc-stop)="onStop($event)"></tc-kill-switch>`,
})
export class KillSwitchExample {
  readonly running = input.required<TcKillSwitch["running"]>();
  readonly stops = input.required<TcKillSwitch["stops"]>();
  onStop(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/kill-switch";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";

  let { running, stops }: { running: TcKillSwitch["running"]; stops: TcKillSwitch["stops"] } = $props();
  let el: TcKillSwitch;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-stop", on);
    return () => el.removeEventListener("tc-stop", on);
  });
</script>

<tc-kill-switch bind:this={el} {running} {stops}></tc-kill-switch>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Emergency stop"` | The heading |
| `posture` | `posture` | `KillPosture \| undefined` | `undefined` | The posture; unset follows the stops – a stop on everything is "stopped", any other stop "elevated" |
| `postureNote` | `posture-note` | `string \| undefined` | `undefined` | The line under the heading; unset says what the posture means |
| `running` | – | `KillRunning[]` | `[]` | What a stop can halt |
| `stops` | – | `KillStop[]` | `[]` | The active stops. Changed by the user unless a tc-stop or tc-resume listener calls preventDefault() |
| `postureLabels` | – | `Partial<Record<KillPosture, string>>` | `{}` | The postures' names, merged over the defaults (Normal, Elevated, Stopped) |
| `you` | `you` | `string` | `"You"` | Who a stop made here is by |
| `stopAllLabel` | `stop-all-label` | `string` | `"Stop everything"` | The big button's text |
| `stopLabel` | `stop-label` | `string` | `"Stop"` | One running item's Stop button |
| `resumeLabel` | `resume-label` | `string` | `"Resume"` | An active stop's Resume button |
| `cancelLabel` | `cancel-label` | `string` | `"Cancel"` | The confirmation's Cancel button |
| `stopNote` | `stop-note` | `string` | `"Work in progress halts at its next step. Nothing is undone."` | What a stop does, said in the confirmation and next to Stop everything |
| `reasonLabel` | `reason-label` | `string` | `"Reason"` | The reason field's label in the confirmation |
| `requireReason` | `require-reason` | `boolean` | `false` | The confirmation needs a reason before Stop can be pressed |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-stop` | – | Yes | A stop was confirmed ({ stop, halts, stops }: KillStopEvent – `stops` is the list with it added); cancelable – prevented, `stops` stays as it was |
| `tc-resume` | – | Yes | Resume was pressed on an active stop ({ stop, stops }: KillResumeEvent – `stops` is the list without it); cancelable – prevented, `stops` stays as it was |

#### Design tokens it reads (92)

`--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultKillPostureLabels: Record<KillPosture, string>` | The postures' names used when the page gives none |

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
| `running` | `el.running = …;` | `<… running={…} />` | `<tc-kill-switch :running="…">` | `<tc-kill-switch [running]="…">` | `<tc-kill-switch {running}>` |
| `stops` | `el.stops = …;` | `<… stops={…} />` | `<tc-kill-switch :stops="…">` | `<tc-kill-switch [stops]="…">` | `<tc-kill-switch {stops}>` |
| `postureLabels` | `el.postureLabels = …;` | `<… postureLabels={…} />` | `<tc-kill-switch :postureLabels="…">` | `<tc-kill-switch [postureLabels]="…">` | `<tc-kill-switch {postureLabels}>` |

*Also attributes: `heading`, `posture`, `posture-note`, `you`, `stop-all-label`, `stop-label`, `resume-label`, `cancel-label` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-stop` | Yes | `el.addEventListener("tc-stop", (e) => …)` | `onStop={…}` | `@tc-stop="…"` | `(tc-stop)="…($event)"` | `el.addEventListener("tc-stop", …)` |
| `tc-resume` | Yes | `el.addEventListener("tc-resume", (e) => …)` | `onResume={…}` | `@tc-resume="…"` | `(tc-resume)="…($event)"` | `el.addEventListener("tc-resume", …)` |

### Controlled

`tc-stop`, `tc-resume` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-kill-switch")` returns a `TcKillSwitch` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";`
- **React / Next.js:** Props: `import type { KillSwitchProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof KillSwitch>`. The element class, for refs: `import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcKillSwitch["running"]` with `import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";`
- **Angular:** The directive types the template: `[running]` takes `TcKillSwitch["running"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcKillSwitch } from "@adamstavely/trenchcoat/kill-switch";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `stops` | `KillStop[]` | The active stops – controlled when given |
| `defaultStops` | `KillStop[]` | The active stops on mount when `stops` isn't controlled |
| `onStopsChange` | `(stops: KillStop[]) => void` | The stops changed – a stop was confirmed or one resumed |
| `onStop` | `(stop: KillStop, halts: KillRunning[]) => void` | A stop was confirmed: halt `halts` (or everything, for target "all") |
| `onResume` | `(stop: KillStop) => void` | Resume was pressed on a stop |

*Renamed or hidden on the wrapper: `heading`, `stops`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Resume, each Stop and Stop everything |
| Enter / Space | On Stop or Stop everything, opens the confirmation; on Resume, lifts the stop |

In the confirmation, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the reason field, Cancel and Stop, wrapping inside the dialog |
| Enter / Space | On Stop, confirms; on Cancel, closes |
| Escape | Closes without stopping |

Cancelling returns focus to the button that opened the dialog. After a confirmed stop, that button is gone or
disabled, so focus goes to the new stop's Resume; after Resume, to the next stop's Resume or the item's Stop.

### Screen readers

The posture badge reads “Posture: Elevated”. Running items and active stops are lists in sections headed “Running”
and “Active stops”, each with a count. Stop and Resume buttons are named with their item – “Stop Support agent”,
“Resume Billing agent” – and Stop buttons have `aria-haspopup="dialog"`. Stop everything is `aria-disabled` while
everything is stopped. The confirmation is a modal `alertdialog` named by its question (“Stop everything?”) and
described by what it halts and `stopNote`. A polite status message confirms “Stopped: Support agent” and “Resumed:
Billing agent”.

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
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself | Modals trap focus, close on Escape and sit in the top layer. |
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
| **This component alone** | 26.7 KB | 7.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **35.1 KB** | **10.0 KB** |
| With Lit – the first component on a page | 56.9 KB | 17.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.0 ms** | the gallery demo's data, 71 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of running replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | running: first render, 743 nodes; update 1.0 ms |
| 1,000 items | 49 ms | running: first render, 7,043 nodes; update 4.9 ms |

1,000 items of running: 49 ms, 7,043 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name running items as people know them (“Billing agent”, “Nightly CRM sync”), with what's in flight in `detail`:
  “2 refunds in progress”.
- Say what a stop does in `stopNote`, honestly: whether work halts now or at its next step, and whether anything is
  undone.
- Use `postureNote` for the one fact that explains an elevated posture: “Unusual tool use flagged at 09:40”.
- Give stops a reason people can act on – it's how others know when resuming is safe. Set `require-reason` where
  your incident process needs one.

## Do and don't

### Do

- Halt the real work in your `tc-stop` handler and call `preventDefault()` if that fails, so the stop isn't shown as
  active.
- Keep `stops` in step with your server, so everyone sees the same stops, with `by` and `at` filled in.
- Show the kill switch where the people on call already look, not three menus deep.

### Don't

- Don't hide a stop's reason or who made it – people need both to decide whether to resume.
- Don't resume automatically after a time; a stop stays until a person lifts it.
- Don't use it for routine pauses people make many times a day – that's a setting, not an emergency stop.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Autonomy Dial](autonomy-dial.md) – How much an agent may do on its own – a three-stop dial, and its real actions gliding between “Runs on its own” and “Asks you first”, with a lock for what always asks
- [Policy Simulator](policy-simulator.md) – Try an action against the policy before it's real – allow, needs approval, deny or hard stop, the rule that decided it and why
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
