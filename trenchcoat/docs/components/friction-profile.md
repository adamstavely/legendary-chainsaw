<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Friction Profile

**Trust & calibration** · New

Switch between standard, elevated and deadline modes and see how each safeguard changes – shortened, deferred or tightened

- **Element:** `<tc-friction-profile>`
- **Size:** 15.3 KB gzip · 63.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/friction-profile";` |
| React / Next.js | `import { FrictionProfile } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/friction-profile";` · tags starting with tc- are custom elements |
| Angular | `import { FrictionProfile } from "@adamstavely/trenchcoat/angular/friction-profile";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/friction-profile";` |

## Example

The live example is in the gallery at `#/friction-profile`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Switch how much friction the product's safeguards add, and see what that means before it happens. A mode switch –
Standard, Elevated and Deadline by default, or the app's own modes – picks a profile; the safeguards below show what
each one does under it: on, shortened, deferred, tightened or off, with what changes in plain words. Picking a mode
only previews it: rows that differ from the mode in force are marked from → to, with a count of what eases and what
tightens, and nothing changes until Apply. Deadline mode asks why and until when, so a quicker way in is always
explained and ends.

### When to use

- Products whose checks should adapt to the stakes or to time pressure: easier to start, stricter to finish.
- Letting a person, rather than an automatic rule, decide when safeguards change, with the reason recorded.
- Showing in advance exactly which checks a mode relaxes and which it hardens.

### When not to use

- Configuring a single gate's rules – use [Gate Config](gate-config.md).
- Showing the session's declared terms while people work – use [Session Context Bar](session-context-bar.md).
- Testing a policy against past cases – use [Policy Simulator](policy-simulator.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, what it applies to, and the mode in force
2. **Mode switch** `.ui-frp__modes` – the modes as a radio group, with a line on what the shown one is for
3. **Diff** `.ui-frp__diff` – while previewing, how many safeguards ease, tighten or stay the same
4. **Safeguard** `.ui-frp__item` – its state under the shown mode, from → to when it changes, and what changes
5. **Reason and end time** `.ui-frp__fields` – what a mode such as Deadline asks before it's applied
6. **Footer** `.ui-frp__foot` – the mode in force with its end time and reason, or Keep and Apply while previewing

## Looks

Standard sets the header on the gray tray above a white card, with the status and actions on the tray below; the
switch is a gray track with a raised white pill. Clean is one white card with a shadow: the switch becomes separate
chips, and the status and actions become the card's last row under a hairline.

## Usage

### HTML

```html
<tc-friction-profile id="profile" scope="This session" mode="standard"></tc-friction-profile>

<script type="module">
  import "@adamstavely/trenchcoat/friction-profile";
  import "@adamstavely/trenchcoat/tokens.css";

  const profile = document.querySelector("#profile");
  profile.safeguards = [
    { id: "intent", label: "Intent check", description: "Two questions before the first answer", modes: { deadline: { state: "shortened", change: "One question instead of two" } } },
    { id: "export", label: "Export review", modes: { elevated: { state: "tightened", change: "A second person signs off" }, deadline: { state: "tightened", change: "Unverified claims block export" } } },
  ];
  profile.addEventListener("tc-mode-change", (e) => console.log(e.detail.mode, e.detail.reason, e.detail.until));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { FrictionProfile } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SessionSafeguards() {
  const [mode, setMode] = useState("standard");
  const [until, setUntil] = useState("");
  return (
    <FrictionProfile
      scope="This session"
      mode={mode}
      until={until}
      safeguards={[
        { id: "intent", label: "Intent check", modes: { deadline: { state: "shortened", change: "One question instead of two" } } },
        { id: "export", label: "Export review", modes: { deadline: { state: "tightened", change: "Unverified claims block export" } } },
      ]}
      onModeChange={(change) => {
        setMode(change.mode);
        setUntil(change.until);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/friction-profile";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";

defineProps<{ modes: TcFrictionProfile["modes"]; safeguards: TcFrictionProfile["safeguards"] }>();
const onModeChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-friction-profile :modes="modes" :safeguards="safeguards" @tc-mode-change="onModeChange"></tc-friction-profile>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FrictionProfile } from "@adamstavely/trenchcoat/angular/friction-profile";
import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";

@Component({
  selector: "app-friction-profile-example",
  imports: [FrictionProfile],
  template: `<tc-friction-profile [modes]="modes()" [safeguards]="safeguards()" (tc-mode-change)="onModeChange($event)"></tc-friction-profile>`,
})
export class FrictionProfileExample {
  readonly modes = input.required<TcFrictionProfile["modes"]>();
  readonly safeguards = input.required<TcFrictionProfile["safeguards"]>();
  onModeChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/friction-profile";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";

  let { modes, safeguards }: { modes: TcFrictionProfile["modes"]; safeguards: TcFrictionProfile["safeguards"] } = $props();
  let el: TcFrictionProfile;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-mode-change", on);
    return () => el.removeEventListener("tc-mode-change", on);
  });
</script>

<tc-friction-profile bind:this={el} {modes} {safeguards}></tc-friction-profile>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Friction profile"` | The heading, and the region's name |
| `scope` | `scope` | `string` | `""` | What it applies to, a quiet line under the heading – e.g. "This session" |
| `modes` | – | `FrictionMode[]` | `[ { id: "standard", label: "Standard", description: "Every safeguard works as usual." }, { id: "elevated", label: "Elevated", description: "Higher stakes: more checks before anything is shared.", tone: "info" }, { id: "deadline", label: "Deadline", description: "Under time pressure: quicker to start, stricter to finish.", needsReason: true, needsEnd: true, tone: "warning" }, ]` | The modes, in switch order – defaults to standard, elevated and deadline |
| `mode` | `mode` | `string` | `"standard"` | The id of the mode in force |
| `reason` | `reason` | `string` | `""` | Why the mode in force was chosen, when it asked |
| `until` | `until` | `string` | `""` | When the mode in force ends, as a datetime-local value ("2026-10-27T17:00"), when it asked |
| `safeguards` | – | `FrictionSafeguard[]` | `[]` | The safeguards and their state in each mode |
| `stateLabels` | – | `Partial<Record<FrictionState, string>>` | `{}` | Names of the states |
| `locale` | `locale` | `string` | `"en-US"` | Locale for the end time |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-mode-change` | – | Yes | Apply was pressed (detail: { mode, previous, reason, until, changes: { id, from, to }[] }); cancelable – prevent it to keep `mode` yourself |

#### Design tokens it reads (84)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-amber-solid`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `FRICTION_MODES: FrictionMode[]` | The three modes used when `modes` isn't set |
| `frictionStateOf(s: FrictionSafeguard, mode: string): FrictionState` | A safeguard's state under a mode |
| `frictionChanges(safeguards: FrictionSafeguard[], from: string, to: string): FrictionChange[]` | The safeguards that differ between two modes |

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
| `modes` | `el.modes = …;` | `<… modes={…} />` | `<tc-friction-profile :modes="…">` | `<tc-friction-profile [modes]="…">` | `<tc-friction-profile {modes}>` |
| `safeguards` | `el.safeguards = …;` | `<… safeguards={…} />` | `<tc-friction-profile :safeguards="…">` | `<tc-friction-profile [safeguards]="…">` | `<tc-friction-profile {safeguards}>` |
| `stateLabels` | `el.stateLabels = …;` | `<… stateLabels={…} />` | `<tc-friction-profile :stateLabels="…">` | `<tc-friction-profile [stateLabels]="…">` | `<tc-friction-profile {stateLabels}>` |

*Also attributes: `heading`, `scope`, `mode`, `reason`, `until`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-mode-change` | Yes | `el.addEventListener("tc-mode-change", (e) => …)` | `onModeChange={…}` | `@tc-mode-change="…"` | `(tc-mode-change)="…($event)"` | `el.addEventListener("tc-mode-change", …)` |

### Controlled

The element changes `mode` itself unless a listener calls `preventDefault()` on `tc-mode-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-friction-profile id="friction-profile"></tc-friction-profile>

<script type="module">
  import "@adamstavely/trenchcoat/friction-profile";

  const el = document.querySelector("#friction-profile");
  el.addEventListener("tc-mode-change", (e) => {
    e.preventDefault(); // the element keeps its mode…
    if (allowed(e.detail.mode)) el.mode = e.detail.mode; // …until the app sets it
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
import "@adamstavely/trenchcoat/friction-profile";
import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";

const props = defineProps<{ initial: TcFrictionProfile["mode"] }>();
const mode = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onModeChange = (e: CustomEvent<{ mode: TcFrictionProfile["mode"] }>) => {
  e.preventDefault();
  mode.value = e.detail.mode;
};
</script>

<template>
  <tc-friction-profile :mode="mode" @tc-mode-change="onModeChange"></tc-friction-profile>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FrictionProfile } from "@adamstavely/trenchcoat/angular/friction-profile";
import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";

@Component({
  selector: "app-controlled-friction-profile",
  imports: [FrictionProfile],
  template: `<tc-friction-profile [mode]="mode()" (tc-mode-change)="onModeChange($event)"></tc-friction-profile>`,
})
export class ControlledFrictionProfile {
  readonly initial = input.required<TcFrictionProfile["mode"]>();
  readonly mode = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onModeChange(e: CustomEvent<{ mode: TcFrictionProfile["mode"] }>) {
    e.preventDefault();
    this.mode.set(e.detail.mode);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/friction-profile";
  import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";

  let { initial }: { initial: TcFrictionProfile["mode"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let mode = $derived(initial);
  let el: TcFrictionProfile;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      mode = (e as CustomEvent<{ mode: TcFrictionProfile["mode"] }>).detail.mode;
    };
    el.addEventListener("tc-mode-change", on);
    return () => el.removeEventListener("tc-mode-change", on);
  });
</script>

<tc-friction-profile bind:this={el} {mode}></tc-friction-profile>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-friction-profile")` returns a `TcFrictionProfile` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";`
- **React / Next.js:** Props: `import type { FrictionProfileProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FrictionProfile>`. The element class, for refs: `import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFrictionProfile["modes"]` with `import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";`
- **Angular:** The directive types the template: `[modes]` takes `TcFrictionProfile["modes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFrictionProfile } from "@adamstavely/trenchcoat/friction-profile";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `mode` | `string` | The id of the mode in force. Controlled when defined: Apply only reports through onModeChange, and you pass the new mode (with `reason` and `until`) back. Otherwise the component applies it, starting from `defaultMode` |
| `defaultMode` | `string` | The mode in force at first, when uncontrolled (default "standard") |
| `onModeChange` | `(change: FrictionModeChange) => void` | Apply was pressed: the new mode, the one before, the reason and end time it asked for, and what changes |

*Renamed or hidden on the wrapper: `heading`, `mode`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the switch's chosen mode, then the reason and end time (when asked), Keep and Apply |
| ← / ↑ | On the switch: previews the previous mode |
| → / ↓ | On the switch: previews the next mode |
| Home / End | On the switch: previews the first or the last mode |
| Escape | Anywhere in the card while previewing: drops the preview and returns to the mode in force |
| Enter / Space | Presses Keep or Apply |

### Screen readers

The card is a `region`, named by its heading. The switch is a `radiogroup` named “Mode”, described by the shown
mode's line. The safeguards are a list named for the shown mode (“Safeguards under Deadline”); a changed row adds
“, On now, Shortened in Deadline” after its label. A polite live region says what picking a mode does (“Previewing
Deadline: 4 safeguards change.”), what Escape or Keep does (“Kept Standard.”) and what Apply did (“Deadline applied.
4 safeguards changed.”). When Apply finds the reason or end time missing, the fields are marked invalid with a
message each (“Say why deadline mode is needed.”) and focus moves to the first.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.0 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **63.2 KB** | **15.4 KB** |
| With Lit – the first component on a page | 84.9 KB | 22.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 65 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of safeguards replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.9 ms | safeguards: first render, 540 nodes; update 0.4 ms |
| 1,000 items | 28 ms | safeguards: first render, 5,040 nodes; update 2.9 ms |

1,000 items of safeguards: 28 ms, 5,040 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name modes for the situation, not the amount of friction: “Deadline”, not “Low friction”.
- Write each `change` as what the person will notice: “One question instead of two”, “A second person signs off”.
- Give a safeguard a `description` for what it does when nothing changes.
- Leave a mode out of a safeguard's `modes` when it stays on – the card shows it as On.

## Do and don't

### Do

- Pair eased entry with stricter exit in a time-pressure mode, so speed doesn't cost checks on what leaves.
- Log the reason and end time from `tc-mode-change` with the session.
- Return to the usual mode when the end time passes – the card reads no clock, so the app does it.

### Don't

- Don't switch modes for the person – the preview is for them to confirm.
- Don't turn off every safeguard in any mode; say what still holds.
- Don't use tightened for a change that only adds a step nobody acts on.

## Related

- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [Session Context Bar](session-context-bar.md) – The session's declared terms kept in view – intent, knowledge mode, scope, review, posture, limits, deadline and budget
- [Reflection Gate](reflection-gate.md) – A moment to think before relying on AI – state the task and what's at stake, say what you believe, restate the answer, or name what you'll verify
- [Policy Simulator](policy-simulator.md) – Try an action against the policy before it's real – allow, needs approval, deny or hard stop, the rule that decided it and why

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
