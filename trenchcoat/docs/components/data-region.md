<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Data Region

**AI configuration** · New

Where a workspace's data lives, item by item in words, and a flow to move it – region cards with latency and what isn't available there, the move's impact, a date, time and time zone, a confirmation by typing the workspace's name, and the migration's steps as they happen

- **Element:** `<tc-data-region>`
- **Size:** 9.5 KB gzip · 31.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/data-region";` |
| React / Next.js | `import { DataRegion } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/data-region";` · tags starting with tc- are custom elements |
| Angular | `import { DataRegion } from "@adamstavely/trenchcoat/angular/data-region";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/data-region";` |

## Example

The live example is in the gallery at `#/data-region`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a workspace's data lives, and a safe way to move it. The top of the card names the region the data is in now and,
item by item, what's stored there and what isn't – "Model processing: outside this region" matters as much as
"Conversations: in this region". Below it, a short flow moves the data. Choose a region from radio cards that give its
latency and what isn't available there yet ("large-1 not yet available in AP – Sydney"). See the impact: the downtime
window, what's re-indexed, and features that won't be there. Schedule a date, time and time zone. Confirm by typing the
workspace's name. Then follow the migration's steps, each with a mark and a word.

### When to use

- An admin page for data residency in an AI product.
- Moving a workspace's data to another region, when the move has downtime or loses features.
- Showing, plainly, which parts of a workspace's data leave the region.

### When not to use

- A person's own settings for training, history and export – use [Data Controls](data-controls.md).
- Retention, logs and deletion rules for a workspace – use [Data handling policy](data-handling-policy.md).
- A long job's progress on its own – use [Status Tracker](status-tracker.md).
- A general multi-step form – use [Stepper Form](stepper-form.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Where it lives** `.ui-drg__current` – the current region, and each item with where it's stored (`.ui-drg__item`)
2. **Steps** `.ui-drg__steps` – Choose, Impact, Schedule, Confirm and Progress; "Step 2 of 5 · Impact" when narrow
3. **Region choice** `.ui-drg__choice` – a radio card with latency, a note and what's unavailable there
4. **Impact** `.ui-drg__impact` – downtime, what's re-indexed and features that won't be there
5. **Schedule** `.ui-drg__schedule` – date, time and time zone
6. **Confirmation** `.ui-drg__summary` – the move in one sentence, and the workspace's name to type
7. **Progress** `.ui-drg__progress` – the migration's steps, each with a mark and a word
8. **Actions** `.ui-drg__actions` – Back, and Next or Start migration

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The step marks' size is the component token `--tc-drg-step`, and the chosen card's ring is `--tc-drg-ring`.

## Usage

### HTML

```html
<tc-data-region id="region" workspace="Halvorsen Research" current="eu-fra"></tc-data-region>

<script type="module">
  import "@adamstavely/trenchcoat/data-region";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#region");
  card.regions = [
    { id: "eu-fra", name: "EU – Frankfurt", latency: "About 20 ms" },
    { id: "eu-dub", name: "EU – Dublin", latency: "About 35 ms" },
    { id: "ap-syd", name: "AP – Sydney", latency: "About 290 ms", unavailable: ["large-1"] },
  ];
  card.stored = [
    { label: "Conversations", inRegion: true },
    { label: "Model processing", inRegion: false, note: "Runs in the EU and US" },
  ];
  card.impact = { downtime: "About 2 hours of read-only time", reindexed: ["Search index"] };
  card.addEventListener("tc-migrate", (e) => console.log("move to", e.detail.region, "at", e.detail.at, e.detail.timeZone));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DataRegion, type DataRegionOption, type DataRegionProgressStep, type DataRegionStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Residency({ regions, progress }: { regions: DataRegionOption[]; progress: DataRegionProgressStep[] }) {
  const [step, setStep] = useState<DataRegionStep>("choose");
  return (
    <DataRegion
      title="Data region"
      workspace="Halvorsen Research"
      current="eu-fra"
      regions={regions}
      stored={[{ label: "Conversations", inRegion: true }]}
      step={step}
      onStepChange={setStep}
      progress={progress}
      onMigrate={(m) => console.log("migrate", m.region, m.at, m.timeZone)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/data-region";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";

defineProps<{ regions: TcDataRegion["regions"]; stored: TcDataRegion["stored"] }>();
const onStepChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-data-region :regions="regions" :stored="stored" @tc-step-change="onStepChange"></tc-data-region>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DataRegion } from "@adamstavely/trenchcoat/angular/data-region";
import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";

@Component({
  selector: "app-data-region-example",
  imports: [DataRegion],
  template: `<tc-data-region [regions]="regions()" [stored]="stored()" (tc-step-change)="onStepChange($event)"></tc-data-region>`,
})
export class DataRegionExample {
  readonly regions = input.required<TcDataRegion["regions"]>();
  readonly stored = input.required<TcDataRegion["stored"]>();
  onStepChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-region";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";

  let { regions, stored }: { regions: TcDataRegion["regions"]; stored: TcDataRegion["stored"] } = $props();
  let el: TcDataRegion;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-step-change", on);
    return () => el.removeEventListener("tc-step-change", on);
  });
</script>

<tc-data-region bind:this={el} {regions} {stored}></tc-data-region>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Data region"` | The heading |
| `description` | `description` | `string` | `""` | One line under the heading |
| `workspace` | `workspace` | `string` | `""` | The workspace's name: shown in the summary, and typed to confirm a move |
| `current` | `current` | `string` | `""` | The id of the region the data lives in now |
| `regions` | – | `DataRegionOption[]` | `[]` | Every region, the current one included |
| `stored` | – | `DataRegionItem[]` | `[]` | What the current region holds, and what it doesn't |
| `step` | `step` | `DataRegionStep` | `"choose"` | The flow's step. Changed by the user unless a tc-step-change listener calls preventDefault() |
| `target` | `target` | `string \| null` | `null` | The region chosen to move to. Changed by the user unless a tc-target-change listener calls preventDefault() |
| `impact` | – | `DataRegionImpact` | `{}` | What the move means, from the page once a region is chosen |
| `timeZones` | – | `string[]` | `["UTC", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Singapore", "Australia/Sydney"]` | The time zones offered for the schedule |
| `progress` | – | `DataRegionProgressStep[]` | `[]` | The migration's steps and where each stands, from the page |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for the date in the summary, e.g. "en-GB"; by default the browser's |
| `labels` | – | `DataRegionLabelsInput` | `{}` | The card's words, merged over defaultDataRegionLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-step-change` | – | Yes | The flow moved to another step ({ step, previous }: DataRegionStepChange); cancelable – prevented, `step` stays as it was |
| `tc-target-change` | – | Yes | A region was picked ({ target }: DataRegionTargetChange); cancelable – prevented, `target` stays as it was |
| `tc-migrate` | – | Yes | Start migration was confirmed ({ region, at, timeZone }: DataRegionMigrate); cancelable – prevented, the flow stays on Confirm |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-drg-step` | `20px` | both |
| `--tc-drg-ring` | `2px` | both |

#### Design tokens it reads (64)

`--tc-accent-solid`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-shimmer`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `regions` | `el.regions = …;` | `<… regions={…} />` | `<tc-data-region :regions="…">` | `<tc-data-region [regions]="…">` | `<tc-data-region {regions}>` |
| `stored` | `el.stored = …;` | `<… stored={…} />` | `<tc-data-region :stored="…">` | `<tc-data-region [stored]="…">` | `<tc-data-region {stored}>` |
| `impact` | `el.impact = …;` | `<… impact={…} />` | `<tc-data-region :impact="…">` | `<tc-data-region [impact]="…">` | `<tc-data-region {impact}>` |
| `timeZones` | `el.timeZones = …;` | `<… timeZones={…} />` | `<tc-data-region :timeZones="…">` | `<tc-data-region [timeZones]="…">` | `<tc-data-region {timeZones}>` |
| `progress` | `el.progress = …;` | `<… progress={…} />` | `<tc-data-region :progress="…">` | `<tc-data-region [progress]="…">` | `<tc-data-region {progress}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-data-region :labels="…">` | `<tc-data-region [labels]="…">` | `<tc-data-region {labels}>` |

*Also attributes: `heading`, `description`, `workspace`, `current`, `step`, `target`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-step-change` | Yes | `el.addEventListener("tc-step-change", (e) => …)` | `ref.current.addEventListener("tc-step-change", …)` | `@tc-step-change="…"` | `(tc-step-change)="…($event)"` | `el.addEventListener("tc-step-change", …)` |
| `tc-target-change` | Yes | `el.addEventListener("tc-target-change", (e) => …)` | `ref.current.addEventListener("tc-target-change", …)` | `@tc-target-change="…"` | `(tc-target-change)="…($event)"` | `el.addEventListener("tc-target-change", …)` |
| `tc-migrate` | Yes | `el.addEventListener("tc-migrate", (e) => …)` | `onMigrate={…}` | `@tc-migrate="…"` | `(tc-migrate)="…($event)"` | `el.addEventListener("tc-migrate", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `step` and `target` itself unless a listener calls `preventDefault()` on `tc-step-change` or `tc-target-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-data-region id="data-region"></tc-data-region>

<script type="module">
  import "@adamstavely/trenchcoat/data-region";

  const el = document.querySelector("#data-region");
  el.addEventListener("tc-step-change", (e) => {
    e.preventDefault(); // the element keeps its step…
    if (allowed(e.detail.step)) el.step = e.detail.step; // …until the app sets it
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
import "@adamstavely/trenchcoat/data-region";
import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";

const props = defineProps<{ initial: TcDataRegion["step"] }>();
const step = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStepChange = (e: CustomEvent<{ step: TcDataRegion["step"] }>) => {
  e.preventDefault();
  step.value = e.detail.step;
};
</script>

<template>
  <tc-data-region :step="step" @tc-step-change="onStepChange"></tc-data-region>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DataRegion } from "@adamstavely/trenchcoat/angular/data-region";
import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";

@Component({
  selector: "app-controlled-data-region",
  imports: [DataRegion],
  template: `<tc-data-region [step]="step()" (tc-step-change)="onStepChange($event)"></tc-data-region>`,
})
export class ControlledDataRegion {
  readonly initial = input.required<TcDataRegion["step"]>();
  readonly step = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStepChange(e: CustomEvent<{ step: TcDataRegion["step"] }>) {
    e.preventDefault();
    this.step.set(e.detail.step);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-region";
  import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";

  let { initial }: { initial: TcDataRegion["step"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let step = $derived(initial);
  let el: TcDataRegion;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      step = (e as CustomEvent<{ step: TcDataRegion["step"] }>).detail.step;
    };
    el.addEventListener("tc-step-change", on);
    return () => el.removeEventListener("tc-step-change", on);
  });
</script>

<tc-data-region bind:this={el} {step}></tc-data-region>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-data-region")` returns a `TcDataRegion` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";`
- **React / Next.js:** Props: `import type { DataRegionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DataRegion>`. The element class, for refs: `import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDataRegion["regions"]` with `import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";`
- **Angular:** The directive types the template: `[regions]` takes `TcDataRegion["regions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDataRegion } from "@adamstavely/trenchcoat/data-region";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `step` | `DataRegionStep` | The flow's step – controlled when given |
| `defaultStep` | `DataRegionStep` | The step on mount, when `step` isn't controlled |
| `onStepChange` | `(step: DataRegionStep) => void` | The flow moved to another step |
| `target` | `string \| null` | The region chosen to move to – controlled when given |
| `defaultTarget` | `string \| null` | The chosen region on mount, when `target` isn't controlled |
| `onTargetChange` | `(target: string \| null) => void` | A region was picked |
| `onMigrate` | `(migrate: DataRegionMigrate) => boolean \| void` | Start migration was confirmed; return false to stay on Confirm |

*Renamed or hidden on the wrapper: `heading`, `step`, `target`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the regions, fields and buttons |
| Arrow keys | Move between regions (native radio buttons) |
| Enter | In the confirmation field, starts the migration |

When the step changes, focus moves to the new step's title. A missing answer moves focus to the field to fix.

### Screen readers

The regions are a group of native radio buttons named "Move the data to"; the current region can't be chosen and says
"Current". What's unavailable in a region is part of its name. A missing answer is said in words, linked to its field
with `aria-describedby` and marked `aria-invalid`. The steps list marks the current one with `aria-current="step"`.
During the move, each new active or failed step is announced once ("Copying data: In progress"). Where an item is
stored is said in words, not only by its mark.

### Every component

- Passes axe (WCAG 2.2 A and AA) in both looks, light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the component uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.2 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **31.6 KB** | **9.5 KB** |
| With Lit – the first component on a page | 51.3 KB | 15.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 104 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of timeZones replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.4 ms | timeZones: first render, 104 nodes; update 0.2 ms |
| 1,000 items | 2.4 ms | timeZones: first render, 104 nodes; update 0.3 ms |

What it renders doesn't grow with timeZones (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name regions the way people know them: "EU – Frankfurt".
- Say what leaves the region, not just what stays: model processing, backups, support access.
- Give the downtime as people will feel it: "About 2 hours of read-only time".
- Use the workspace's real name for the confirmation, so people know which workspace they're moving.

## Do and don't

### Do

- Fill `impact` for the chosen region from your back end before the Impact step.
- Update `progress` as the migration runs; the element announces each new step.
- Keep moves cancelable in your system until Start migration.

### Don't

- Don't let people choose the region the data is already in; the card marks it as current.
- Don't skip the impact step for a move that loses features.
- Don't hide model processing outside the region – list it in `stored` with `inRegion: false`.

## Related

- [Data Controls](data-controls.md) – A person's own data in an AI product – switches for improving the model with their chats, saving chat history and memory, each saying what it means and when it last changed, Export my data with its status, Delete all chats behind a confirmation that names how many go, and Delete account
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [Status Tracker](status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
