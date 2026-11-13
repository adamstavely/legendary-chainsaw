<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Edit Region

**AI & chat** · New

Brush a mask over an image and say what should change – brush, eraser and a box you move from the keyboard, undo and redo, how much is selected, and Generate with the mask as a PNG at the image's size

- **Element:** `<tc-edit-region>`
- **Size:** 11.1 KB gzip · 34.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/edit-region";` |
| React / Next.js | `import { EditRegion } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/edit-region";` · tags starting with tc- are custom elements |
| Angular | `import { EditRegion } from "@adamstavely/trenchcoat/angular/edit-region";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/edit-region";` |

## Example

The live example is in the gallery at `#/edit-region`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Mark the part of an image that should change, then say how. A brush paints a tinted mask over the image, an eraser
takes paint away, and a box tool selects a rectangle – the way to mark without a pointer, since the box moves and
resizes from the keyboard. Undo and Redo step through the mask's history and Clear empties it. A line under the image
says how much is selected. Then an instruction – “Replace the chart with a table” – and Generate, which hands the page
the instruction, the mask as a black-and-white PNG at the image's own size, the mask's bounds and how much it covers.
The page sends that to its image model and sets `busy` while it works.

### When to use

- Inpainting: changing one part of a generated or uploaded image and keeping the rest.
- Fixing a detail in a picture an agent made – a wrong label, a stray object, a chart to redraw.
- Anywhere people need to say “here” about part of an image, and the answer is an edited image.

### When not to use

- Asking a question about part of an image, not changing it – use [Point and Ask](point-and-ask.md).
- Choosing between whole generated images – use [Image Grid](image-grid.md).
- Showing an image while it's generated – use [Image Generation](image-generation.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tools** `.ui-edr__toolset` – Brush, Erase and Box, as one radio group; `.ui-edr__tool` is one tool
2. **Brush size** `.ui-edr__size` – a slider in px, hidden for the box tool
3. **History** `.ui-edr__history` – Undo, Redo and Clear
4. **Image** `.ui-edr__stage` – the image at its own shape, with the mask over it (`.ui-edr__mask`)
5. **Box** `.ui-edr__draft` – the box tool's selection, moved and resized from the keyboard
6. **Status** `.ui-edr__status` – how much of the image is selected
7. **Instruction** `.ui-edr__field` – what should change
8. **Generate** `.ui-edr__generate` – sends the edit; `.ui-edr__hint` says what's missing first

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. In both the mask is the accent colour at a tint, so the picture stays readable under it, and the box tool's
selection is a dashed accent outline. `--tc-edr-tint-opacity` (0.45) sets how strong the tint is.

## Usage

### HTML

```html
<tc-edit-region
  heading="Edit page 4"
  src="/images/report-page-4.png"
  alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
></tc-edit-region>

<script type="module">
  import "@adamstavely/trenchcoat/edit-region";
  import "@adamstavely/trenchcoat/tokens.css";

  const editor = document.querySelector("tc-edit-region");
  editor.addEventListener("tc-edit", async (e) => {
    const { instruction, mask, bounds } = e.detail;
    // The element is busy until the page clears it
    const res = await fetch("/api/images/page-4/edit", { method: "POST", body: JSON.stringify({ instruction, mask, bounds }) });
    if (res.ok) editor.src = (await res.json()).src;
    editor.busy = false;
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EditRegion, type EditRegionEdit } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function EditPage({ src, onEdited }: { src: string; onEdited: (edit: EditRegionEdit) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <EditRegion
      title="Edit page 4"
      src={src}
      alt="Annual report page 4: a bar chart of audits by quarter beside a table of findings"
      busy={busy}
      onEdit={(edit) => {
        setBusy(true);
        void onEdited(edit).finally(() => setBusy(false));
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/edit-region";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";

defineProps<{ mask: TcEditRegion["mask"]; labels: TcEditRegion["labels"] }>();
const onMaskChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-edit-region :mask="mask" :labels="labels" @tc-mask-change="onMaskChange"></tc-edit-region>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EditRegion } from "@adamstavely/trenchcoat/angular/edit-region";
import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";

@Component({
  selector: "app-edit-region-example",
  imports: [EditRegion],
  template: `<tc-edit-region [mask]="mask()" [labels]="labels()" (tc-mask-change)="onMaskChange($event)"></tc-edit-region>`,
})
export class EditRegionExample {
  readonly mask = input.required<TcEditRegion["mask"]>();
  readonly labels = input.required<TcEditRegion["labels"]>();
  onMaskChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/edit-region";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";

  let { mask, labels }: { mask: TcEditRegion["mask"]; labels: TcEditRegion["labels"] } = $props();
  let el: TcEditRegion;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-mask-change", on);
    return () => el.removeEventListener("tc-mask-change", on);
  });
</script>

<tc-edit-region bind:this={el} {mask} {labels}></tc-edit-region>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Edit region"` | The title above the image |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the title |
| `src` | `src` | `string` | `""` | The image to edit |
| `alt` | `alt` | `string` | `""` | What the image shows, for screen readers |
| `mask` | – | `EditRegionOp[]` | `[]` | The mask: brush strokes, erasures and boxes in fractions of the image |
| `tool` | `tool` | `EditRegionTool` | `"brush"` | The tool in use |
| `brushSize` | `brush-size` | `number` | `32` | The brush's width in px on the image as shown |
| `minBrush` | `min-brush` | `number` | `8` | The smallest and largest brush the slider offers, in px |
| `maxBrush` | `max-brush` | `number` | `96` | The largest brush the slider offers, in px |
| `instruction` | `instruction` | `string` | `""` | What should change |
| `busy` | `busy` | `boolean` | `false` | Holds everything while the page generates; Generate turns it on unless tc-edit is prevented |
| `labels` | – | `Partial<EditRegionLabels>` | `{}` | Words the page can rename (merged over defaultEditRegionLabels) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-mask-change` | – | Yes | The mask changed: a stroke or box was added, or undo, redo or clear ({ mask, reason }: EditRegionMaskChange); cancelable – prevented, the mask stays as it was |
| `tc-tool-change` | – | Yes | Another tool was picked ({ tool }: EditRegionToolChange); cancelable – prevented, the tool stays |
| `tc-instruction-change` | – | Yes | The instruction was edited ({ instruction }: EditRegionInstructionChange); cancelable – prevented, the text goes back |
| `tc-edit` | – | Yes | Generate was pressed ({ instruction, mask, bounds, ops, coverage }: EditRegionEdit); cancelable – not prevented, the element turns `busy` until the page clears it |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `undo()` | `void` | Steps the mask back one change |
| `redo()` | `void` | Steps forward again after undo |
| `clear()` | `void` | Empties the mask |
| `toMaskDataURL()` | `string` | The mask as a PNG data URL – white where selected, black elsewhere – at the image's own size (at most 2048 px) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-edr-tint-opacity` | `0.45` | both |

#### Design tokens it reads (58)

`--tc-accent`, `--tc-accent-subtle`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-normal`, `--tc-radius-xs`, `--tc-space-1`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultEditRegionLabels: object` | The words on the element; a page can rename any of them |
| `paintMask(ctx: CanvasRenderingContext2D, ops: readonly EditRegionOp[], w: number, h: number, colour: string): void` | Paints the operations onto a 2-D context of the given size: added paint in `colour`, erasures cut out |
| `measureMask(ops: readonly EditRegionOp[], aspect: number): { coverage: number; bounds: EditRegionBounds \| null }` | How much of the image the mask covers (0–1) and its bounds, measured on a small raster |

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
| `mask` | `el.mask = …;` | `<… mask={…} />` | `<tc-edit-region :mask="…">` | `<tc-edit-region [mask]="…">` | `<tc-edit-region {mask}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-edit-region :labels="…">` | `<tc-edit-region [labels]="…">` | `<tc-edit-region {labels}>` |

*Also attributes: `heading`, `description`, `src`, `alt`, `tool`, `brush-size`, `min-brush`, `max-brush` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-mask-change` | Yes | `el.addEventListener("tc-mask-change", (e) => …)` | `onMaskChange={…}` | `@tc-mask-change="…"` | `(tc-mask-change)="…($event)"` | `el.addEventListener("tc-mask-change", …)` |
| `tc-tool-change` | Yes | `el.addEventListener("tc-tool-change", (e) => …)` | `onToolChange={…}` | `@tc-tool-change="…"` | `(tc-tool-change)="…($event)"` | `el.addEventListener("tc-tool-change", …)` |
| `tc-instruction-change` | Yes | `el.addEventListener("tc-instruction-change", (e) => …)` | `onInstructionChange={…}` | `@tc-instruction-change="…"` | `(tc-instruction-change)="…($event)"` | `el.addEventListener("tc-instruction-change", …)` |
| `tc-edit` | Yes | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |

### Controlled

The element changes `mask`, `tool` and `instruction` itself unless a listener calls `preventDefault()` on `tc-mask-change`, `tc-tool-change` or `tc-instruction-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-edit-region id="edit-region"></tc-edit-region>

<script type="module">
  import "@adamstavely/trenchcoat/edit-region";

  const el = document.querySelector("#edit-region");
  el.addEventListener("tc-mask-change", (e) => {
    e.preventDefault(); // the element keeps its mask…
    if (allowed(e.detail.mask)) el.mask = e.detail.mask; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { EditRegion } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof EditRegion>;
type Props = Omit<Own, "mask" | "onMaskChange"> & { initial: NonNullable<Own["mask"]> };

// Controlled: passing mask makes the wrapper prevent the element's own change; the app sets it
export function ControlledEditRegion({ initial, ...props }: Props) {
  const [mask, setMask] = useState<Own["mask"]>(initial);
  return <EditRegion {...props} mask={mask} onMaskChange={(next) => setMask(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/edit-region";
import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";

const props = defineProps<{ initial: TcEditRegion["mask"] }>();
const mask = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMaskChange = (e: CustomEvent<{ mask: TcEditRegion["mask"] }>) => {
  e.preventDefault();
  mask.value = e.detail.mask;
};
</script>

<template>
  <tc-edit-region :mask="mask" @tc-mask-change="onMaskChange"></tc-edit-region>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EditRegion } from "@adamstavely/trenchcoat/angular/edit-region";
import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";

@Component({
  selector: "app-controlled-edit-region",
  imports: [EditRegion],
  template: `<tc-edit-region [mask]="mask()" (tc-mask-change)="onMaskChange($event)"></tc-edit-region>`,
})
export class ControlledEditRegion {
  readonly initial = input.required<TcEditRegion["mask"]>();
  readonly mask = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMaskChange(e: CustomEvent<{ mask: TcEditRegion["mask"] }>) {
    e.preventDefault();
    this.mask.set(e.detail.mask);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/edit-region";
  import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";

  let { initial }: { initial: TcEditRegion["mask"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let mask = $derived(initial);
  let el: TcEditRegion;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      mask = (e as CustomEvent<{ mask: TcEditRegion["mask"] }>).detail.mask;
    };
    el.addEventListener("tc-mask-change", on);
    return () => el.removeEventListener("tc-mask-change", on);
  });
</script>

<tc-edit-region bind:this={el} {mask}></tc-edit-region>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-edit-region")` returns a `TcEditRegion` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";`
- **React / Next.js:** Props: `import type { EditRegionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EditRegion>`. The element class, for refs: `import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEditRegion["mask"]` with `import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";`
- **Angular:** The directive types the template: `[mask]` takes `TcEditRegion["mask"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEditRegion } from "@adamstavely/trenchcoat/edit-region";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title above the image |
| `mask` | `EditRegionOp[]` | The mask. Controlled when defined; otherwise the element keeps its own, starting at `defaultMask` |
| `defaultMask` | `EditRegionOp[]` | Starting mask when uncontrolled |
| `onMaskChange` | `(mask: EditRegionOp[], reason: EditRegionMaskChange["reason"]) => void` | A stroke or box was added, or undo, redo or clear |
| `tool` | `EditRegionTool` | The tool. Controlled when defined |
| `defaultTool` | `EditRegionTool` | Starting tool when uncontrolled |
| `onToolChange` | `(tool: EditRegionTool) => void` | Another tool was picked |
| `instruction` | `string` | What should change. Controlled when defined |
| `defaultInstruction` | `string` | Starting instruction when uncontrolled |
| `onInstructionChange` | `(instruction: string) => void` | The instruction was edited |
| `onEdit` | `(edit: EditRegionEdit, event: Event) => void` | Generate: the instruction, the mask as a PNG and its bounds. The element turns busy unless you call event.preventDefault() – pass `busy` to own it |

*Renamed or hidden on the wrapper: `heading`, `children`, `reason`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Arrow keys (tools) | Move between Brush, Erase and Box |
| Arrow keys (box) | Move the box |
| Shift + arrow keys (box) | Resize the box |
| Enter (box) | Add the box to the mask |
| Shift + Enter (box) | Take the box away from the mask |
| Ctrl / ⌘ + Z | Undo |
| Shift + Ctrl / ⌘ + Z, Ctrl / ⌘ + Y | Redo |
| Ctrl / ⌘ + Enter (instruction) | Generate |

Brushing needs a pointer – mouse, pen or touch. The box tool does the same job from the keyboard.

### Screen readers

The tools are a radio group named “Tool”. The slider is named “Brush size” and reads its value in px. The box is
announced as “Selection box” with where it sits and how big it is (“30% from the left, 20% from the top, 40% wide, 30%
tall”), and describes its keys. The status line – “About 18% of the image selected” – describes Generate. A polite live
region says “Box added to the mask”, “Undone”, “Mask cleared”, and what's missing when Generate can't run yet. While
`busy` the card is `aria-busy` and Generate reads “Generating…”.

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
| CSS masks | 120 | 53 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This component alone** | 26.5 KB | 8.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.4 KB** | **11.1 KB** |
| With Lit – the first component on a page | 55.0 KB | 17.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.2 ms** | the gallery demo's data, 76 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of mask replaced |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.8 ms | mask: first render, 76 nodes; update 1.7 ms |
| 1,000 items | 12 ms | mask: first render, 76 nodes; update 9.7 ms |

What it renders doesn't grow with mask (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the image's `alt` as what it shows; it's what screen-reader users mark against.
- Keep the placeholder an example of a good instruction: one change, said plainly.
- Name the heading after the image – “Edit page 4” – not the tool.

## Do and don't

### Do

- Send the mask at the image's own size (`tc-edit` does) so the model's edit lines up.
- Set `busy` while the model works and clear it when the new image arrives.
- Keep the mask after an edit so people can adjust it and try again.

### Don't

- Don't make brushing the only way to mark – keep the box tool.
- Don't clear the instruction on Generate; people often tweak and resend it.
- Don't run the edit on every stroke – wait for Generate.

## Related

- [Point and Ask](point-and-ask.md) – Pin or box parts of an image and ask about them – numbered marks you drag, nudge and resize from the keyboard, a question per mark and one over all, and answers streamed back under each
- [Image Generation](image-generation.md) – One image while it's generated – its place in the queue, then the picture taking shape in a frame of the image's own shape as a blurred preview or colour field clears, the step, percentage and time left, the image fading in when it's done or why it failed with Try again, the prompt with Show more, and Cancel, Download, Regenerate and Copy prompt
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Signature Pad](signature-pad.md) – A form field for signing – draw with a mouse, pen or finger in ink that follows speed and pressure, or type the name in a script face; undo and clear, the signer, the date and a statement below, submitted with the form, and exported as SVG or an image
