<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Capability Notice

**Trust & calibration** · New

When a request falls where the AI is only partly proven or not proven – a capped confidence, who was notified, and how far the request is from the usual

- **Element:** `<tc-capability-notice>`
- **Size:** 7.6 KB gzip · 24.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/capability-notice";` |
| React / Next.js | `import { CapabilityNotice } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/capability-notice";` · tags starting with tc- are custom elements |
| Angular | `import { CapabilityNotice } from "@adamstavely/trenchcoat/angular/capability-notice";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/capability-notice";` |

## Example

The live example is in the gallery at `#/capability-notice`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An advisory placed above an answer when the request falls where the AI is only partly proven (amber) or not proven at
all (red). Models answer fluently whether or not they can do a task reliably, so the notice gives the signal the
answer can't: it names the task area, says what to do about the answer, and can say that the confidence shown is
capped (“Confidence capped at Medium”) and that someone was notified. A folded detail shows how far the request is
from the ones the AI usually handles, as a small scale with the usual range shaded. The app decides the level, the cap
and who was told; the notice says so.

### When to use

- Above an answer to a request your evaluation data marks as partly validated or out of scope.
- When the app has capped the confidence an answer may show, so people know why it's lower.
- When a request was escalated to a reviewer, so the person asking knows someone else has seen it.

### When not to use

- A policy blocked, redacted or rewrote content – use [Guardrail Notice](guardrail-notice.md).
- Confidence and sources for each claim in an answer – use [Claim Answer](claim-answer.md).
- How well trust matches performance across many answers – use [Reliance Gauge](reliance-gauge.md).
- A source that has gone out of date – use [Validity Badge](validity-badge.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Icon** `.ui-cpn__icon` – a warning triangle (partly proven) or an octagon (not proven), in the level's tone
2. **Heading** `.ui-cpn__titles` – the level, then what to do about the answer
3. **Task area** `.ui-cpn__area` – the kind of request, by the name people know it by
4. **Facts** `.ui-cpn__facts` – the confidence cap and who was notified
5. **Distance from usual** `.ui-cpn__fold` – the score, and on opening the scale with the usual range and threshold

## Looks

Standard is a band in the level's tone – amber or red tint with a hairline border – with the icon and the chips on
white. Clean is a white card with the tone as a thin rule down its left edge, a tinted icon, lighter type and thinner
icons. It's a notice, not a card, so neither look has a card header.

## Usage

### HTML

```html
<tc-capability-notice id="notice" level="partial" area="Tax calculations outside the UK" cap="Medium"></tc-capability-notice>

<script type="module">
  import "@adamstavely/trenchcoat/capability-notice";
  import "@adamstavely/trenchcoat/tokens.css";

  const notice = document.querySelector("#notice");
  notice.distance = 0.72;
  notice.usual = 0.45;
  notice.addEventListener("tc-open-change", (e) => console.log("detail open:", e.detail.open));
</script>
```

### React / Next.js

```tsx
import { CapabilityNotice } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ValuationNotice({ distance }: { distance: number }) {
  return (
    <CapabilityNotice
      level="unproven"
      area="Valuing private companies"
      cap="Low"
      notified="Team lead"
      distance={distance}
      usual={0.45}
      onOpenChange={(open) => console.log("detail open:", open)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/capability-notice";
import "@adamstavely/trenchcoat/tokens.css";

const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-capability-notice @tc-open-change="onOpenChange"></tc-capability-notice>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { CapabilityNotice } from "@adamstavely/trenchcoat/angular/capability-notice";

@Component({
  selector: "app-capability-notice-example",
  imports: [CapabilityNotice],
  template: `<tc-capability-notice (tc-open-change)="onOpenChange($event)"></tc-capability-notice>`,
})
export class CapabilityNoticeExample {
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/capability-notice";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";

  let el: TcCapabilityNotice;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-capability-notice bind:this={el}></tc-capability-notice>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `level` | `level` | `CapabilityLevel` | `"partial"` | How proven the AI is for this request: "partial" (amber) or "unproven" (red) |
| `area` | `area` | `string` | `""` | The task area the request falls in, by the name people know it by |
| `heading` | `heading` | `string \| undefined` | `undefined` | The heading – what to do about the answer: "Check this answer independently" or "Treat this answer as a starting point" by default |
| `message` | `message` | `string \| undefined` | `undefined` | Why – a sentence on how proven the AI is here; a default sentence per level |
| `cap` | `cap` | `string` | `""` | The highest confidence the answer may show, e.g. "Medium"; set, the notice says "Confidence capped at …" |
| `notified` | `notified` | `string` | `""` | Who was told about the request, e.g. "Supervisor"; set, the notice says "… notified" |
| `distance` | `distance` | `number \| undefined` | `undefined` | How far the request is from the ones the AI usually handles; set, the notice has a folded detail with a scale |
| `usual` | `usual` | `number \| undefined` | `undefined` | The score above which a request counts as unusual – marked on the scale, the usual range shaded below it |
| `scaleMin` | `scale-min` | `number` | `0` | The low end of the scale |
| `scaleMax` | `scale-max` | `number` | `1` | The high end of the scale |
| `digits` | `digits` | `number` | `2` | Decimal places the score is shown with |
| `distanceLabel` | `distance-label` | `string` | `"Distance from usual"` | The name of the score – the toggle's label and the scale's name |
| `distanceNote` | `distance-note` | `string` | `"How far this request is from the ones the AI usually handles. Higher means less familiar."` | A sentence under the scale saying what the score means |
| `open` | `open` | `boolean` | `false` | Whether the distance detail is open |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The distance detail was opened or closed; detail `{ open }`: CapabilityOpenChange. Cancelable. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-capability-notice-fg` | `var(--tc-status-warning-fg)` | both |
| `--tc-capability-notice-bg` | `var(--tc-status-warning-bg)` | both |
| `--tc-capability-notice-border` | `var(--tc-status-warning-border)` | both |
| `--tc-capability-notice-solid` | `var(--tc-status-warning-solid)` | both |

#### Design tokens it reads (66)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-card-radius`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-eyebrow-font-size`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`

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

*Also attributes: `level`, `area`, `heading`, `message`, `cap`, `notified`, `distance`, `usual` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-capability-notice id="capability-notice"></tc-capability-notice>

<script type="module">
  import "@adamstavely/trenchcoat/capability-notice";

  const el = document.querySelector("#capability-notice");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CapabilityNotice } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CapabilityNotice>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledCapabilityNotice({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <CapabilityNotice {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/capability-notice";
import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";

const props = defineProps<{ initial: TcCapabilityNotice["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcCapabilityNotice["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-capability-notice :open="open" @tc-open-change="onOpenChange"></tc-capability-notice>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CapabilityNotice } from "@adamstavely/trenchcoat/angular/capability-notice";
import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";

@Component({
  selector: "app-controlled-capability-notice",
  imports: [CapabilityNotice],
  template: `<tc-capability-notice [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-capability-notice>`,
})
export class ControlledCapabilityNotice {
  readonly initial = input.required<TcCapabilityNotice["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcCapabilityNotice["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/capability-notice";
  import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";

  let { initial }: { initial: TcCapabilityNotice["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcCapabilityNotice;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcCapabilityNotice["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-capability-notice bind:this={el} {open}></tc-capability-notice>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-capability-notice")` returns a `TcCapabilityNotice` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";`
- **React / Next.js:** Props: `import type { CapabilityNoticeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CapabilityNotice>`. The element class, for refs: `import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCapabilityNotice["level"]` with `import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";`
- **Angular:** The directive types the template: `[level]` takes `TcCapabilityNotice["level"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCapabilityNotice } from "@adamstavely/trenchcoat/capability-notice";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – what to do about the answer: "Check this answer independently" or "Treat this answer as a starting point" by default |
| `open` | `boolean` | Whether the distance detail is open. Controlled when defined |
| `defaultOpen` | `boolean` | Whether the detail starts open when uncontrolled – folded by default |
| `onOpenChange` | `(open: boolean) => void` | The distance detail was opened or closed |

*Renamed or hidden on the wrapper: `heading`, `Check this answer independently`, `Treat this answer as a starting point`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Reaches the Distance from usual toggle, the only control |
| Enter / Space | Opens or closes the distance detail |

### Screen readers

The notice has the `note` role, named by its heading (“Check this answer independently”). The level reads before the
heading (“Partly proven”), then “Task area Tax rules outside the UK”, the message, and the chips (“Confidence capped at
Medium”, “Supervisor notified”). The toggle is a disclosure button named “Distance from usual 0.72”, with
`aria-expanded` and `aria-controls`. The scale is a `meter` named “Distance from usual”, its value text “0.72 – above
the usual range, up to 0.45”.

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
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.3 KB | 5.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.9 KB** | **7.6 KB** |
| With Lit – the first component on a page | 45.6 KB | 14.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 36 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |

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

- Name the task area the way people describe their work (“Tax calculations outside the UK”), not a taxonomy code.
- Keep the heading an instruction and the message the reason; override both together.
- Use your product's own confidence words in `cap` – the notice adds “Confidence capped at”.
- Name a role in `notified` (“Supervisor”, “Team lead”) unless people expect a name.

## Do and don't

### Do

- Show it above the answer, so it's read first.
- Set `usual` whenever you show the score – a number without its usual range means little.
- Show red only for areas your evaluations say the AI can't handle, and say who was told.

### Don't

- Don't show it on every answer; a notice that's always there stops being read.
- Don't present the distance score as a probability of being wrong – it says how unfamiliar the request is.
- Don't use it for policy decisions; that's `guardrail-notice`.

## Related

- [Guardrail Notice](guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it
- [Reliance Gauge](reliance-gauge.md) – Whether trust in the AI matches how it performs – a reliance index with its trend, signals against review thresholds, and overtrust and undertrust caught
- [Validity Badge](validity-badge.md) – How fresh a piece of evidence is – a band from high to stale that ages over time, contested and superseded marks, and a margin strip for a document

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
