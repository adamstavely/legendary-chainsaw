<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Biometric Status

**People & profiles** · New

Where someone's biometric enrolment stands – face, fingerprints, iris, voice and more, each with its status, detail and quality meter, the count enrolled and an optional match score

- **Element:** `<tc-biometric-status>`
- **Size:** 8.0 KB gzip · 25.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/biometric-status";` |
| React / Next.js | `import { BiometricStatus } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/biometric-status";` · tags starting with tc- are custom elements |
| Angular | `import { BiometricStatus } from "@adamstavely/trenchcoat/angular/biometric-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/biometric-status";` |

## Example

The live example is in the gallery at `#/biometric-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where someone's biometric enrolment stands, one row per modality: face, fingerprints, iris, palm, voice, gait,
signature, DNA – whichever the page lists. Each row has the modality's icon and name, a line of detail such as “Both
eyes · captured Feb 2024”, a status and, when known, a quality or confidence meter with its percentage written out.
The six statuses – enrolled, on file, partial, in progress, missing and expired – each have their own mark and words.
The header counts what's enrolled, and an optional match score sits above the list, such as “Photo ID match 97.2%”.
Rows can be selected, so the page can show more about one.

### When to use

- An enrolment screen: what's been captured, what's still in progress and what needs doing again.
- A person's or account's profile, summing up the biometrics on file and how good they are.
- Reviewing an identity check, with the match score at the top.

### When not to use

- Each finger of a ten-print card – use [Fingerprint Card](fingerprint-card.md).
- Steps someone works through to set something up – use [Setup Guide](setup-guide.md).
- Usage against a limit – use [Usage Meter](usage-meter.md).
- Progress through a long-running job – use [Progress Tracker](progress-tracker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-bios__count` – how many modalities are enrolled, counting `enrolledStatuses`
2. **Match** `.ui-bios__match` – the optional score, its label and detail, and a hero meter
3. **Row** `.ui-bios__row` – one modality; selectable
4. **Icon** `.ui-bios__icon` – the modality's icon, from `kind`
5. **Name** `.ui-bios__name` – the modality, with its detail below
6. **Status** `.ui-bios__pill` – the status's mark and name
7. **Quality** `.ui-bios__quality` – a meter and its percentage

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The rows, pills and meters are the same in both. Below 460 px the
meter moves under the name.

## Usage

### HTML

```html
<tc-biometric-status id="bio" heading="Enrolment"></tc-biometric-status>

<script type="module">
  import "@adamstavely/trenchcoat/biometric-status";
  import "@adamstavely/trenchcoat/tokens.css";

  const bio = document.querySelector("#bio");
  bio.modalities = [
    { id: "face", label: "Face", kind: "face", detail: "Front and profile", status: "enrolled", quality: 0.96 },
    { id: "iris", label: "Iris", kind: "iris", detail: "Left eye done", status: "in-progress", quality: 0.5, qualityLabel: "Progress" },
    { id: "voice", label: "Voice", kind: "voice", status: "missing" },
  ];
  bio.match = { label: "Photo ID match", value: 0.972 };
  bio.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BiometricStatus, type BiometricModality } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const modalities: BiometricModality[] = [
  { id: "face", label: "Face", kind: "face", detail: "Front and profile", status: "enrolled", quality: 0.96 },
  { id: "iris", label: "Iris", kind: "iris", detail: "Left eye done", status: "in-progress", quality: 0.5, qualityLabel: "Progress" },
  { id: "voice", label: "Voice", kind: "voice", status: "missing" },
];

export function Enrolment() {
  const [selected, setSelected] = useState<string | null>(null);
  return <BiometricStatus title="Enrolment" modalities={modalities} match={{ label: "Photo ID match", value: 0.972 }} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/biometric-status";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";

defineProps<{ modalities: TcBiometricStatus["modalities"]; match: TcBiometricStatus["match"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-biometric-status :modalities="modalities" :match="match" @tc-selected-change="onSelectedChange"></tc-biometric-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BiometricStatus } from "@adamstavely/trenchcoat/angular/biometric-status";
import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";

@Component({
  selector: "app-biometric-status-example",
  imports: [BiometricStatus],
  template: `<tc-biometric-status [modalities]="modalities()" [match]="match()" (tc-selected-change)="onSelectedChange($event)"></tc-biometric-status>`,
})
export class BiometricStatusExample {
  readonly modalities = input.required<TcBiometricStatus["modalities"]>();
  readonly match = input.required<TcBiometricStatus["match"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/biometric-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";

  let { modalities, match }: { modalities: TcBiometricStatus["modalities"]; match: TcBiometricStatus["match"] } = $props();
  let el: TcBiometricStatus;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-biometric-status bind:this={el} {modalities} {match}></tc-biometric-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Biometrics"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `modalities` | – | `BiometricModality[]` | `[]` | The modalities, a row each, in the order given |
| `match` | – | `BiometricMatch \| null` | `null` | A score shown above the list, e.g. a gallery match |
| `selected` | `selected` | `string \| null` | `null` | The selected row's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `statusLabels` | – | `Partial<Record<BiometricState, string>>` | `{}` | The statuses' names, merged over the defaults (Enrolled, On file, Partial, In progress, Missing, Expired) |
| `enrolledStatuses` | – | `BiometricState[]` | `["enrolled", "on-file"]` | The statuses that count as enrolled in the header |
| `qualityLabel` | `quality-label` | `string` | `"Quality"` | What a row's meter measures when the row doesn't say |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A row was selected or cleared ({ selected, modality }: BiometricSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (62)

`--tc-avatar-md`, `--tc-avatar-radius-agent`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-md`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-h-hero`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultBiometricStatusLabels: Record<BiometricState, string>` | The statuses' names used when the page gives none |

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
| `modalities` | `el.modalities = …;` | `<… modalities={…} />` | `<tc-biometric-status :modalities="…">` | `<tc-biometric-status [modalities]="…">` | `<tc-biometric-status {modalities}>` |
| `match` | `el.match = …;` | `<… match={…} />` | `<tc-biometric-status :match="…">` | `<tc-biometric-status [match]="…">` | `<tc-biometric-status {match}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-biometric-status :statusLabels="…">` | `<tc-biometric-status [statusLabels]="…">` | `<tc-biometric-status {statusLabels}>` |
| `enrolledStatuses` | `el.enrolledStatuses = …;` | `<… enrolledStatuses={…} />` | `<tc-biometric-status :enrolledStatuses="…">` | `<tc-biometric-status [enrolledStatuses]="…">` | `<tc-biometric-status {enrolledStatuses}>` |

*Also attributes: `heading`, `description`, `selected`, `quality-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-biometric-status id="biometric-status"></tc-biometric-status>

<script type="module">
  import "@adamstavely/trenchcoat/biometric-status";

  const el = document.querySelector("#biometric-status");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/biometric-status";
import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";

const props = defineProps<{ initial: TcBiometricStatus["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcBiometricStatus["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-biometric-status :selected="selected" @tc-selected-change="onSelectedChange"></tc-biometric-status>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BiometricStatus } from "@adamstavely/trenchcoat/angular/biometric-status";
import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";

@Component({
  selector: "app-controlled-biometric-status",
  imports: [BiometricStatus],
  template: `<tc-biometric-status [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-biometric-status>`,
})
export class ControlledBiometricStatus {
  readonly initial = input.required<TcBiometricStatus["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcBiometricStatus["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/biometric-status";
  import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";

  let { initial }: { initial: TcBiometricStatus["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcBiometricStatus;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcBiometricStatus["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-biometric-status bind:this={el} {selected}></tc-biometric-status>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-biometric-status")` returns a `TcBiometricStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";`
- **React / Next.js:** Props: `import type { BiometricStatusProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BiometricStatus>`. The element class, for refs: `import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBiometricStatus["modalities"]` with `import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";`
- **Angular:** The directive types the template: `[modalities]` takes `TcBiometricStatus["modalities"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBiometricStatus } from "@adamstavely/trenchcoat/biometric-status";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The selected row's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The row selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, modality?: BiometricModality) => void` | A row was selected or cleared; `modality` is the selected row |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The list is one tab stop; inside it the arrows move between rows.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row |
| Home / End | Moves to the first or last row |
| Enter / Space | Selects the row, or clears it if it's selected |
| Escape | Clears the selected row |
| Tab | Leaves the list |

### Screen readers

The rows are a `listbox` named by the heading; each row is an `option` that reads its name, detail, status and
quality, “Iris, Both eyes · captured today, Enrolled, Quality 92%”, and is `aria-selected` when selected. Selecting
is confirmed in a polite status message, “Selected Iris”, and clearing with “Selection cleared”. The icons, marks and
meters are hidden; the words read.

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
| **This component alone** | 17.7 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **25.0 KB** | **8.1 KB** |
| With Lit – the first component on a page | 46.9 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 181 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of modalities replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.6 ms | modalities: first render, 2,219 nodes; update 0.8 ms |
| 1,000 items | 67 ms | modalities: first render, 21,886 nodes; update 8.0 ms |

1,000 items of modalities: 67 ms. It renders every item, so a first render passes 50 ms (a long task) at about 750 items – page or filter longer lists.

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

- Write `detail` as what was captured and when: “Front and profile · captured today 09:41”.
- Set `qualityLabel` on a row when its meter measures something else: “Confidence”, “Progress”.
- Use `on-file` for a biometric carried over from an earlier enrolment, and `expired` when it's too old to use.
- Rename statuses with `statusLabels` to match your process, such as “Modelling” for in progress.

## Do and don't

### Do

- List the modalities in the order people capture them.
- Leave `quality` out when there's nothing to measure, rather than showing 0%.
- Set `enrolledStatuses` if partial captures count towards enrolment in your process.

### Don't

- Don't use the match score for anything but a comparison result – it's the first number people read.
- Don't list modalities the enrolment never asks for unless their absence matters; mark them missing if it does.
- Don't rely on the pill colours – keep the status names distinct.

## Related

- [Fingerprint Card](fingerprint-card.md) – A ten-print card – each finger's print and status in ANSI/NIST positions, captured with its NFIQ quality, poor, not captured, unable to print or bandaged, and a finger's detail
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play

## Changelog

- **`tc-biometric-status`:** enrolment across face, fingerprints, iris, DNA, voice, gait and more. - **Each record:** a status pill and a quality meter. - **Summary:** the count enrolled, and an optional match score.
