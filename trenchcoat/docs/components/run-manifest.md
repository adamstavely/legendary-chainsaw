<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Run Manifest

**Trust & calibration** · New

What it takes to reproduce a run – model, settings, instruction hash, sources, intent and the verification summary, ready to export

- **Element:** `<tc-run-manifest>`
- **Size:** 9.7 KB gzip · 33.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/run-manifest";` |
| React / Next.js | `import { RunManifest } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/run-manifest";` · tags starting with tc- are custom elements |
| Angular | `import { RunManifest } from "@adamstavely/trenchcoat/angular/run-manifest";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/run-manifest";` |

## Example

The live example is in the gallery at `#/run-manifest`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The record of one AI run – everything someone needs to run it again and to judge what came out of it. It lists the
exact model id, the settings, the instruction's name and hash, the sources and corpus the run drew on, the intent the
session started with, and the verification summary: how many claims were verified, couldn't be verified, were
incorrect, dismissed or still wait for review. Long values stay readable – the hash shows shortened and copies in
full – and the whole record copies as JSON or goes to the app for export. The card reads no clock: the time shows as
the app passes it.

### When to use

- At the end of an analysis or report, so anyone reading it can see how it was produced and rerun it.
- Beside an export or a hand-off, where the receiver needs the model, settings and sources with the result.
- In an audit trail or run history, one manifest per run.

### When not to use

- How full the model's context is right now – use [Context Window](context-window.md).
- Working through the claims one by one – use [Verification Queue](verification-queue.md).
- Tracing each claim back to its sources step by step – use [Lineage Graph](lineage-graph.md).
- Checking that a signed package hasn't changed – use [Attestation Check](attestation-check.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, the run id with its copy button, the time, and the model badge
2. **Hash** `.ui-rmf__hash` – the instruction's hash, shortened, with a copy button for the full value
3. **Sources** `.ui-rmf__sources` – the sources and corpus, the first few with Show all
4. **Intent** `.ui-rmf__intent` – what the session set out to do, in the person's words
5. **Verification** `.ui-rmf__verify-bar` – the reviewed claims by state, with the counts below
6. **Actions** `.ui-rmf__tools` – Copy (the whole record as JSON) and Export

## Looks

Standard sets a white card in the gray tray, with the actions on the tray below; the model badge is set in mono like
context-window's. Clean is one white card with a shadow: the actions sit in its last row under a hairline, the badge
is a plain tag and the icons are finer.

## Usage

### HTML

```html
<tc-run-manifest id="manifest" model="Opus 5.5" timestamp="Oct 24, 14:02 UTC"></tc-run-manifest>

<script type="module">
  import "@adamstavely/trenchcoat/run-manifest";
  import "@adamstavely/trenchcoat/tokens.css";

  const manifest = document.querySelector("#manifest");
  manifest.runId = "run_8f2c41d07a";
  manifest.modelId = "claude-opus-5-5-20261001";
  manifest.settings = [
    { label: "Temperature", value: "0.2" },
    { label: "Seed", value: "118734" },
  ];
  manifest.instructionLabel = "Supplier risk analyst · v4";
  manifest.instructionHash = "sha256:3f9a2c71d0e4b6a85c19f2e7d4a0b3c6e81f5d9a7b2c4e60f1a3d8b5c7e9b81e";
  manifest.sources = [{ id: "contracts", label: "Supplier contracts", detail: "1,204 documents" }];
  manifest.intent = "Which suppliers carry a risk we should act on this quarter?";
  manifest.verification = { verified: 12, unverifiable: 2, pending: 4 };
  manifest.addEventListener("tc-export", (e) => console.log(JSON.stringify(e.detail.manifest)));
</script>
```

### React / Next.js

```tsx
import { RunManifest, type RunManifestRecord } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

function download(record: RunManifestRecord) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${record.runId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RunRecord() {
  return (
    <RunManifest
      runId="run_8f2c41d07a"
      timestamp="Oct 24, 14:02 UTC"
      model="Opus 5.5"
      modelId="claude-opus-5-5-20261001"
      settings={[{ label: "Temperature", value: "0.2" }]}
      instructionHash="sha256:3f9a2c71d0e4b6a85c19f2e7d4a0b3c6e81f5d9a7b2c4e60f1a3d8b5c7e9b81e"
      sources={[{ id: "contracts", label: "Supplier contracts", detail: "1,204 documents" }]}
      intent="Which suppliers carry a risk we should act on this quarter?"
      verification={{ verified: 12, unverifiable: 2, pending: 4 }}
      onExport={download}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/run-manifest";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";

defineProps<{ modelIcon: TcRunManifest["modelIcon"]; settings: TcRunManifest["settings"] }>();
const onCopy = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-run-manifest :modelIcon="modelIcon" :settings="settings" @tc-copy="onCopy"></tc-run-manifest>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RunManifest } from "@adamstavely/trenchcoat/angular/run-manifest";
import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";

@Component({
  selector: "app-run-manifest-example",
  imports: [RunManifest],
  template: `<tc-run-manifest [modelIcon]="modelIcon()" [settings]="settings()" (tc-copy)="onCopy($event)"></tc-run-manifest>`,
})
export class RunManifestExample {
  readonly modelIcon = input.required<TcRunManifest["modelIcon"]>();
  readonly settings = input.required<TcRunManifest["settings"]>();
  onCopy(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/run-manifest";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";

  let { modelIcon, settings }: { modelIcon: TcRunManifest["modelIcon"]; settings: TcRunManifest["settings"] } = $props();
  let el: TcRunManifest;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-copy", on);
    return () => el.removeEventListener("tc-copy", on);
  });
</script>

<tc-run-manifest bind:this={el} {modelIcon} {settings}></tc-run-manifest>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Run manifest"` | The heading, and the region's name |
| `runId` | `run-id` | `string` | `""` | The run's id – shown under the heading, with a copy button |
| `timestamp` | `timestamp` | `string` | `""` | When the run happened, shown as given – e.g. "Oct 24, 14:02 UTC" |
| `model` | `model` | `string` | `""` | The model's display name, shown as a badge in the head |
| `modelId` | `model-id` | `string` | `""` | The model's exact id or version – what reproducing the run needs; shown in full with a copy button |
| `modelIcon` | – | `Element \| undefined` | `undefined` | An icon for the model badge, cloned in (an svg or img) |
| `settings` | – | `RunManifestSetting[]` | `[]` | Sampling and other settings, in order: temperature, top-p, maximum tokens, seed… |
| `instructionLabel` | `instruction-label` | `string` | `""` | The instruction's name or version, e.g. "Analyst v4" |
| `instructionHash` | `instruction-hash` | `string` | `""` | The instruction's hash – shown shortened, copied in full |
| `sources` | – | `RunManifestSource[]` | `[]` | The sources and corpus the run drew on |
| `sourceLimit` | `source-limit` | `number` | `3` | How many sources show before "Show all" |
| `intent` | `intent` | `string` | `""` | The intent the session was started with, in the person's words |
| `verification` | – | `RunVerification` | `{}` | Claims per verification state: verified, unverifiable, incorrect, dismissed, pending |
| `stateLabels` | – | `Partial<Record<RunVerificationState, string>>` | `{}` | Names of the verification states |
| `noun` | `noun` | `string` | `"claims"` | What the verified things are called, plural – "claims" |
| `manifest` | – | `RunManifestRecord` | – | The whole record as data – what Copy writes as JSON and Export hands to the app |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-copy` | – | Yes | A copy button was pressed (detail: { field: "run" \| "model" \| "instruction" \| "manifest", text: string }); cancelable – prevent it to write the clipboard yourself |
| `tc-export` | – | No | Export was pressed (detail: { manifest: RunManifestRecord }) |

#### Design tokens it reads (71)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size-lg`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-badge`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `modelIcon` | `el.modelIcon = …;` | `<… modelIcon={…} />` | `<tc-run-manifest :modelIcon="…">` | `<tc-run-manifest [modelIcon]="…">` | `<tc-run-manifest {modelIcon}>` |
| `settings` | `el.settings = …;` | `<… settings={…} />` | `<tc-run-manifest :settings="…">` | `<tc-run-manifest [settings]="…">` | `<tc-run-manifest {settings}>` |
| `sources` | `el.sources = …;` | `<… sources={…} />` | `<tc-run-manifest :sources="…">` | `<tc-run-manifest [sources]="…">` | `<tc-run-manifest {sources}>` |
| `verification` | `el.verification = …;` | `<… verification={…} />` | `<tc-run-manifest :verification="…">` | `<tc-run-manifest [verification]="…">` | `<tc-run-manifest {verification}>` |
| `stateLabels` | `el.stateLabels = …;` | `<… stateLabels={…} />` | `<tc-run-manifest :stateLabels="…">` | `<tc-run-manifest [stateLabels]="…">` | `<tc-run-manifest {stateLabels}>` |

*Also attributes: `heading`, `run-id`, `timestamp`, `model`, `model-id`, `instruction-label`, `instruction-hash`, `source-limit` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |

### Controlled

`tc-copy` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-run-manifest")` returns a `TcRunManifest` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";`
- **React / Next.js:** Props: `import type { RunManifestProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RunManifest>`. The element class, for refs: `import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRunManifest["modelIcon"]` with `import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";`
- **Angular:** The directive types the template: `[modelIcon]` takes `TcRunManifest["modelIcon"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRunManifest } from "@adamstavely/trenchcoat/run-manifest";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `modelIcon` | `Element` | An icon for the model badge – an Element, cloned in |
| `onCopy` | `(field: RunManifestCopyField, text: string) => void \| false` | A copy button was pressed: which field and the text copied. Return false to copy it yourself instead (this replaces React's clipboard onCopy on this component) |
| `onExport` | `(manifest: RunManifestRecord) => void` | Export was pressed, with the whole record |

*Renamed or hidden on the wrapper: `heading`, `modelIcon`, `onCopy`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the copy buttons, Show all, and then the actions toolbar as one stop |
| ← / → | In the actions toolbar: moves between Copy and Export, wrapping at the ends |
| Home / End | In the actions toolbar: moves to Copy or to Export |
| Enter / Space | Copies, exports, or shows all sources |

### Screen readers

The card is a `region`, named by its heading; the fields are a description list (“Model”, “Settings”,
“Instruction”…). Each copy button names what it copies (“Copy instruction hash”), and a polite live region confirms
it (“Instruction hash copied.”, or “Couldn't copy the instruction hash.”). The shortened hash is read with a “Hash”
prefix. Show all is a disclosure button with `aria-expanded`. The verification bar is a `meter` named “Claims
reviewed”, with a value such as “15 of 20 claims reviewed: 12 verified, 2 can't verify, 1 incorrect, 5 not
reviewed”. The actions are a `toolbar` named “Manifest actions”.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.1 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **33.6 KB** | **9.8 KB** |
| With Lit – the first component on a page | 56.2 KB | 17.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 126 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of sources replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.3 ms | sources: first render, 126 nodes; update 0.2 ms |
| 1,000 items | 1.1 ms | sources: first render, 126 nodes; update 0.1 ms |

What it renders doesn't grow with sources (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give the exact model id in `modelId` (a dated version, not a family name), and the friendly name in `model`.
- Pass the time already formatted, with its time zone: “Oct 24, 14:02 UTC”.
- Name sources as people know them, and use `detail` for what makes them reproducible – a count, a version, when they
  were indexed.
- Keep the intent in the person's own words; don't rewrite it into a summary.
- Rename what's verified with `noun` (“findings”) and the states with `stateLabels`.

## Do and don't

### Do

- Export the record the event hands you – it is the same data the card shows.
- Show the manifest while claims are still under review; the summary updates as they are reviewed.
- Prevent `tc-copy` when the app has its own clipboard handling, and copy `detail.text`.

### Don't

- Don't leave out the hash or the settings to save space – without them the run can't be repeated.
- Don't put secrets in the settings; everything here is copied and exported.
- Don't use it as a log of everything the run did – keep it to what reproducing the run needs.

## Related

- [Context Window](context-window.md) – What fills the model's context, as a field of cells – hover a part to light it up, remove files, and compact the conversation while its cells shimmer and clear
- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Attestation Check](attestation-check.md) – Verify a signed evidence package by its hash or file – signature, chain integrity and what it covers, checked locally

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
