<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Image Generation

**AI & chat** · New

One image while it's generated – its place in the queue, then the picture taking shape in a frame of the image's own shape as a blurred preview or colour field clears, the step, percentage and time left, the image fading in when it's done or why it failed with Try again, the prompt with Show more, and Cancel, Download, Regenerate and Copy prompt

- **Element:** `<tc-image-generation>`
- **Size:** 11.1 KB gzip · 34.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/image-generation";` |
| React / Next.js | `import { ImageGeneration } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/image-generation";` · tags starting with tc- are custom elements |
| Angular | `import { ImageGeneration } from "@adamstavely/trenchcoat/angular/image-generation";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/image-generation";` |

## Example

The live example is in the gallery at `#/image-generation`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One image while it's being made. Queued, the card says the image's place in line; generating, the picture resolves
in a frame that already has the image's shape – an intermediate `preview` from the model, blurred less as the
progress rises, or a soft field in the chart colours whose grain clears – over a bar with the step ("Step 18 of 30"),
the percentage and the time left. When it's done the image cross-fades in. A failed job says why, with Try again; a
cancelled one offers Start again. Under the frame are the prompt (two lines, with Show more for a long one), the model
and the size, and the actions for the state: Cancel while it works; Download, Regenerate and Copy prompt once it's done.

Image Grid shows several finished variations side by side and keeps only a shimmer and a bar on a tile that is still
generating. Image Generation is the single image's own wait: the queue, the steps, the picture taking shape and the
time left. Use it for the one image a person asked for, and Image Grid when they get variations to choose from.

### When to use

- A single generated image – a cover, an illustration, a diagram – that takes seconds or minutes to make.
- When the model reports its progress (steps, a percentage, intermediate previews) and people should see it.
- When people may want to cancel a long job, or try a failed one again.

### When not to use

- Several variations to compare and pick from – use [Image Grid](image-grid.md).
- A short wait with nothing to show but that it's working – use [Pixel Loader](pixel-loader.md) or [Thinking Loader](thinking-loader.md).
- Many background jobs at once, of any kind – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – an image icon, the heading and where the job is: "Queued · 2nd in line", "Generating · Step 18 of 30 · 60%", "Ready"
2. **Frame** `.ui-igen__frame` – the image's shape from the start, set by `aspect-ratio`
3. **Field** `.ui-igen__field` – the `preview` blurred by what's left (`.ui-igen__preview`), or a colour field (`.ui-igen__blobs`), with a grain that clears (`.ui-igen__grain`)
4. **State** `.ui-igen__state` – the phase and percentage in a pill, the step and time left; or why it failed, or that it was cancelled, with Try again or Start again
5. **Bar** `.ui-igen__bar` – the progress along the frame's bottom edge; it sweeps when the progress isn't known
6. **Image** `.ui-igen__img` – the finished image, faded in
7. **Prompt** `.ui-igen__prompt` – the prompt, two lines with `.ui-igen__more` (Show more) when it's long; the model and size as `.ui-igen__chip`
8. **Actions** `.ui-igen__foot` – the time left, Cancel; or Download, Regenerate and Copy prompt

## Looks

Standard puts the header on the gray tray, the frame and the prompt on a white card, and the actions on the tray below
it. Clean is one white card whose first row is the header and whose last row holds the actions, with an accent bar.
Both stop at 440 px wide. A page can set `--tc-image-generation-blur` (how blurred the picture starts, 26 px),
`--tc-image-generation-grain` (how strong the grain starts, 0.42), `--tc-image-generation-cycle` (one drift of the colour
field, 9 s), `--tc-image-generation-bar` and `--tc-image-generation-glyph`.

## Usage

### HTML

```html
<tc-image-generation
  id="cover"
  heading="Report cover"
  aspect-ratio="2:3"
  model="Studio model"
  size="1024 × 1536"
  prompt="A calm, editorial cover for an annual audit report: ledger bars under a magnifying glass, teal and amber"
  status="generating"
  steps="30"
></tc-image-generation>

<script type="module">
  import "@adamstavely/trenchcoat/image-generation";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#cover");
  job.on("step", ({ step, preview }) => Object.assign(card, { step, preview }));
  job.on("done", ({ url }) => Object.assign(card, { status: "done", src: url, alt: "Teal cover with ledger bars under a magnifying glass" }));
  card.addEventListener("tc-cancel", () => job.cancel());
  card.addEventListener("tc-retry", () => job.start());
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ImageGeneration, type ImageGenerationStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Cover({ prompt, start, stop }: { prompt: string; start: () => void; stop: () => void }) {
  const [status, setStatus] = useState<ImageGenerationStatus>("queued");
  const [step, setStep] = useState(0);
  return (
    <ImageGeneration
      title="Report cover"
      prompt={prompt}
      aspectRatio="2:3"
      status={status}
      step={step}
      steps={30}
      onCancel={() => {
        stop();
        setStatus("cancelled");
      }}
      onRetry={() => {
        setStep(0);
        setStatus("queued");
        start();
      }}
      onRegenerate={start}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/image-generation";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";

defineProps<{ labels: TcImageGeneration["labels"] }>();
const onCancel = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-image-generation :labels="labels" @tc-cancel="onCancel"></tc-image-generation>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ImageGeneration } from "@adamstavely/trenchcoat/angular/image-generation";
import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";

@Component({
  selector: "app-image-generation-example",
  imports: [ImageGeneration],
  template: `<tc-image-generation [labels]="labels()" (tc-cancel)="onCancel($event)"></tc-image-generation>`,
})
export class ImageGenerationExample {
  readonly labels = input.required<TcImageGeneration["labels"]>();
  onCancel(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/image-generation";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";

  let { labels }: { labels: TcImageGeneration["labels"] } = $props();
  let el: TcImageGeneration;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-cancel", on);
    return () => el.removeEventListener("tc-cancel", on);
  });
</script>

<tc-image-generation bind:this={el} {labels}></tc-image-generation>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Image"` | Names the card – what the image is for |
| `status` | `status` | `ImageGenerationStatus` | `"generating"` | Where the job is: "queued", "generating", "done", "failed" or "cancelled" |
| `position` | `position` | `number \| undefined` | `undefined` | The image's place in the queue while queued – 1 is next |
| `progress` | `progress` | `number \| undefined` | `undefined` | How far along it is, 0 to 1, while generating; left out, the bar sweeps |
| `step` | `step` | `number \| undefined` | `undefined` | The step the model is on, while generating |
| `steps` | `steps` | `number \| undefined` | `undefined` | How many steps the job takes |
| `eta` | `eta` | `number \| undefined` | `undefined` | Seconds left, when the model estimates it |
| `phase` | `phase` | `string` | `"Generating"` | What it's doing while generating, in a word – "Generating", "Refining", "Upscaling" |
| `src` | `src` | `string \| undefined` | `undefined` | The finished image's URL – a data: URL works too. Shown when done |
| `alt` | `alt` | `string` | `""` | What the finished image shows, for people who can't see it |
| `preview` | `preview` | `string \| undefined` | `undefined` | An intermediate image the model sent, shown blurred while generating – the blur falls as the progress rises |
| `error` | `error` | `string \| undefined` | `undefined` | Why it failed, in a few words |
| `prompt` | `prompt` | `string` | `""` | The prompt the image comes from |
| `model` | `model` | `string \| undefined` | `undefined` | The model's name, shown as a chip under the prompt |
| `size` | `size` | `string \| undefined` | `undefined` | The image's size, shown as a chip – "1024 × 1536" |
| `aspectRatio` | `aspect-ratio` | `string` | `"1:1"` | The frame's shape, so nothing jumps when the image arrives: "1:1", "16:9", "3:4" … |
| `filename` | `filename` | `string \| undefined` | `undefined` | File name for Download – from the heading by default |
| `expanded` | `expanded` | `boolean` | `false` | Whether a long prompt shows in full |
| `labels` | – | `Partial<ImageGenerationLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-cancel` | – | Yes | Cancel while queued or generating. Cancelable: unless prevented, the card shows as cancelled ({ status }: ImageGenerationCancel) |
| `tc-retry` | – | No | Try again on a failed image; the app starts the job again ({ prompt }: ImageGenerationRequest) |
| `tc-regenerate` | – | No | Regenerate on a done image, or Start again after a cancel; the app starts a new job ({ prompt }: ImageGenerationRequest) |
| `tc-download` | – | Yes | Download on a done image. Cancelable: unless prevented, the image is saved ({ src, filename }: ImageGenerationDownload) |
| `tc-copy-prompt` | – | Yes | Copy prompt. Cancelable: unless prevented, the prompt is copied ({ prompt }: ImageGenerationRequest) |
| `tc-expanded-change` | – | Yes | Show more or Show less on a long prompt. Cancelable – prevented, `expanded` stays as it was ({ expanded }: ImageGenerationExpandedChange) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-image-generation-blur` | `26px` | both |
| `--tc-image-generation-glyph` | `16px` | both |
| `--tc-image-generation-bar` | `2px` | both, clean |
| `--tc-image-generation-grain` | `0.42` | both |
| `--tc-image-generation-cycle` | `9s` | both |
| `--tc-igen-ratio` | `1 / 1` | not set – this fallback applies |
| `--tc-igen-left` | `1` | not set – this fallback applies |

#### Design tokens it reads (69)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-chart-2`, `--tc-chart-3`, `--tc-chart-5`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-in-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultImageGenerationLabels: ImageGenerationLabels` | The words used when the page gives none |
| `parseAspectRatio(value: string \| undefined): string` | "16:9", "16/9", "1.5" → a CSS aspect-ratio; square when it can't be read |
| `formatEta(seconds: number): string` | Seconds left in words: "about 12 s left", "about 2 min left", "a moment left" |

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
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-image-generation :labels="…">` | `<tc-image-generation [labels]="…">` | `<tc-image-generation {labels}>` |

*Also attributes: `heading`, `status`, `position`, `progress`, `step`, `steps`, `eta`, `phase` and 10 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-cancel` | Yes | `el.addEventListener("tc-cancel", (e) => …)` | `onCancel={…}` | `@tc-cancel="…"` | `(tc-cancel)="…($event)"` | `el.addEventListener("tc-cancel", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-regenerate` | No | `el.addEventListener("tc-regenerate", (e) => …)` | `onRegenerate={…}` | `@tc-regenerate="…"` | `(tc-regenerate)="…($event)"` | `el.addEventListener("tc-regenerate", …)` |
| `tc-download` | Yes | `el.addEventListener("tc-download", (e) => …)` | `onDownload={…}` | `@tc-download="…"` | `(tc-download)="…($event)"` | `el.addEventListener("tc-download", …)` |
| `tc-copy-prompt` | Yes | `el.addEventListener("tc-copy-prompt", (e) => …)` | `onCopyPrompt={…}` | `@tc-copy-prompt="…"` | `(tc-copy-prompt)="…($event)"` | `el.addEventListener("tc-copy-prompt", …)` |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `onExpandedChange={…}` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-image-generation id="image-generation"></tc-image-generation>

<script type="module">
  import "@adamstavely/trenchcoat/image-generation";

  const el = document.querySelector("#image-generation");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ImageGeneration } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ImageGeneration>;
type Props = Omit<Own, "expanded" | "onExpandedChange"> & { initial: NonNullable<Own["expanded"]> };

// Controlled: passing expanded makes the wrapper prevent the element's own change; the app sets it
export function ControlledImageGeneration({ initial, ...props }: Props) {
  const [expanded, setExpanded] = useState<Own["expanded"]>(initial);
  return <ImageGeneration {...props} expanded={expanded} onExpandedChange={(next) => setExpanded(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/image-generation";
import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";

const props = defineProps<{ initial: TcImageGeneration["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcImageGeneration["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-image-generation :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-image-generation>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ImageGeneration } from "@adamstavely/trenchcoat/angular/image-generation";
import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";

@Component({
  selector: "app-controlled-image-generation",
  imports: [ImageGeneration],
  template: `<tc-image-generation [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-image-generation>`,
})
export class ControlledImageGeneration {
  readonly initial = input.required<TcImageGeneration["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcImageGeneration["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/image-generation";
  import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";

  let { initial }: { initial: TcImageGeneration["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcImageGeneration;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcImageGeneration["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-image-generation bind:this={el} {expanded}></tc-image-generation>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-image-generation")` returns a `TcImageGeneration` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";`
- **React / Next.js:** Props: `import type { ImageGenerationProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ImageGeneration>`. The element class, for refs: `import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcImageGeneration["labels"]` with `import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";`
- **Angular:** The directive types the template: `[labels]` takes `TcImageGeneration["labels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcImageGeneration } from "@adamstavely/trenchcoat/image-generation";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Names the card – what the image is for |
| `expanded` | `boolean` | Whether a long prompt shows in full. Controlled when defined |
| `defaultExpanded` | `boolean` | Whether a long prompt starts in full when uncontrolled |
| `onExpandedChange` | `(expanded: boolean) => void` | Show more or Show less on a long prompt |
| `onCancel` | `(status: ImageGenerationStatus, event: Event) => void` | Cancel while queued or generating – stop the job. Call event.preventDefault() to keep the card as it is until your status arrives |
| `onRetry` | `(prompt: string) => void` | Try again on a failed image – start the job again |
| `onRegenerate` | `(prompt: string) => void` | Regenerate on a done image, or Start again after a cancel – start a new job |
| `onDownload` | `(src: string, filename: string, event: Event) => void` | Download on a done image; it's saved unless you call event.preventDefault() |
| `onCopyPrompt` | `(prompt: string, event: Event) => void` | Copy prompt; it's copied unless you call event.preventDefault() |

*Renamed or hidden on the wrapper: `heading`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between Show more and the buttons for the state |
| Enter / Space | Presses the focused button – Cancel, Try again, Start again, Download, Regenerate, Copy prompt, Show more |

### Screen readers

The card is a `group` named by its heading. While it generates, the bar is a `progressbar` named by the heading and
the phase ("Report cover: Generating"), with its value when the progress is known and a value text with the step and
time left ("Step 18 of 30, 60%, about 3 s left"). A status region says each change of state once – "Queued · 2nd in
line", "Generating", "Ready: Teal cover with ledger bars under a magnifying glass" (the finished image's alt text, said
once), "Couldn't generate the image: The model timed out", "Cancelled" – and the progress every quarter (25%, 50%,
75%), never every tick. The frame's field and grain are hidden from screen readers; the finished image has its `alt`.
Show more is a disclosure button (`aria-expanded`, `aria-controls` the prompt).

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.4 KB | 8.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.9 KB** | **11.1 KB** |
| With Lit – the first component on a page | 55.9 KB | 18.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 49 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 33 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 4 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the card for what the image is for: "Report cover", "Slide 4 illustration" – not "Image generation".
- Give `alt` before the image is done, describing what it will show once you know it; it's what people hear when it
  arrives.
- Keep `phase` to one word – "Generating", "Refining", "Upscaling".
- Keep `error` short and specific: "The model timed out", "The prompt was declined" – not a stack trace.
- Show `model` and `size` when people choose them, so they can tell two jobs apart.

## Do and don't

### Do

- Set `aspect-ratio` to the image's real shape, so nothing moves when it arrives.
- Pass `step` and `steps`, or `progress`, as the model reports them; pass `eta` only when it's an estimate you trust.
- Pass the model's intermediate `preview` when it sends one – the picture taking shape is the reason to use this card.
- Answer `tc-cancel`, `tc-retry` and `tc-regenerate` by stopping or starting the job, and update `status` as it moves.

### Don't

- Don't fake a progress you don't have – leave `progress` out and the bar sweeps.
- Don't announce every step yourself; the card already says each quarter.
- Don't use it for the whole set of variations – the grid compares them; this card waits for one.

## Related

- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Pixel Loader](pixel-loader.md) – A small working row – a 5 × 5 grid of dots lit in a wave, a snake, a twinkle or an orbit, a shimmering label and the time since the work started, settling into a check or a cross when it ends
- [Thinking Loader](thinking-loader.md) – A small working pill for AI replies – an eight-ray spinner and a shimmering label that rolls through phases and settles on a check
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open
