<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Speed Reader

**AI & chat** · New

Speed reading one word at a time in a fixed frame – the recognition point on a guide mark, longer pauses at sentence ends, 100–1000 words a minute, 1–3 words at a time, a scrubber with the time left, and the sentence around the word when paused

- **Element:** `<tc-speed-reader>`
- **Size:** 9.8 KB gzip · 31.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/speed-reader";` |
| React / Next.js | `import { SpeedReader } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/speed-reader";` · tags starting with tc- are custom elements |
| Angular | `import { SpeedReader } from "@adamstavely/trenchcoat/angular/speed-reader";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/speed-reader";` |

## Example

The live example is in the gallery at `#/speed-reader`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Speed reading by showing a passage one word at a time in the same place (rapid serial visual presentation), so the eye
never has to move along a line. Each word's optimal recognition point – the letter just left of its middle, where the
eye takes a word in fastest – is drawn in the accent colour and in bold, and always sits on the guide marks at the
centre of the frame. Sentence ends, commas and long words stay up a little longer, so the rhythm follows the text.

Pause, and the sentence around the word appears under the frame with the word marked, to recover context. A scrubber
shows and sets the place ("Word 120 of 840") with the time left beside it. The speed runs from 100 to 1000 words a
minute, and it can show one, two or three words at a time.

### When to use

- Reading a short to medium passage quickly: a briefing, an abstract, an email, a summary.
- Reading on a small screen, where the frame needs less room than a column of text.
- Practice tools that train reading speed.

### When not to use

- Text people need to study, compare or skim back and forth in – show it as text.
- Listening rather than reading – use [Text To Speech](text-to-speech.md).
- Condensing a long document – use [File Summary](file-summary.md) or [Digest](digest.md) first, then read the summary.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading, the description and the speed `.ui-spr__pill`
2. **Frame** `.ui-spr__frame` – where the words appear; focus it to use the keys
3. **Guide** `.ui-spr__guide` – two hairlines with a tick at the centre
4. **Word** `.ui-spr__word` – the word or chunk, split around the recognition point `.ui-spr__pivot`
5. **Context** `.ui-spr__context` – while paused, the sentence around the word with it marked `.ui-spr__mark`
6. **Controls** `.ui-spr__bar` – start over, previous sentence and word, Play / Pause `.ui-spr__play`, next word and sentence
7. **Scrubber** `.ui-spr__scrub` – the place in the text and the time left
8. **Settings** `.ui-spr__settings` – the speed and the words at a time

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Below about 480 px the frame and the words get a little smaller and the settings stack. Component
tokens: `--tc-spr-frame-h` for the frame's height and `--tc-spr-guide` for the tick colour.

## Usage

### HTML

```html
<tc-speed-reader id="reader" heading="A short history of lighthouses" wpm="350"></tc-speed-reader>

<script type="module">
  import "@adamstavely/trenchcoat/speed-reader";
  import "@adamstavely/trenchcoat/tokens.css";

  const reader = document.querySelector("#reader");
  reader.text = "For most of history, sailors found their way home by fires lit on headlands. Early towers burned wood.";
  reader.addEventListener("tc-position-change", (e) => localStorage.setItem("reader-at", String(e.detail.position)));
  reader.addEventListener("tc-finish", (e) => console.log(`read ${e.detail.words} words`));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SpeedReader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Briefing({ text }: { text: string }) {
  const [position, setPosition] = useState(0);
  const [wpm, setWpm] = useState(300);
  return <SpeedReader title="Briefing" text={text} wpm={wpm} onWpmChange={setWpm} position={position} onPositionChange={setPosition} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/speed-reader";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";

defineProps<{ scheduler: TcSpeedReader["scheduler"] }>();
const onWpmChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-speed-reader :scheduler="scheduler" @tc-wpm-change="onWpmChange"></tc-speed-reader>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SpeedReader } from "@adamstavely/trenchcoat/angular/speed-reader";
import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";

@Component({
  selector: "app-speed-reader-example",
  imports: [SpeedReader],
  template: `<tc-speed-reader [scheduler]="scheduler()" (tc-wpm-change)="onWpmChange($event)"></tc-speed-reader>`,
})
export class SpeedReaderExample {
  readonly scheduler = input.required<TcSpeedReader["scheduler"]>();
  onWpmChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/speed-reader";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";

  let { scheduler }: { scheduler: TcSpeedReader["scheduler"] } = $props();
  let el: TcSpeedReader;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-wpm-change", on);
    return () => el.removeEventListener("tc-wpm-change", on);
  });
</script>

<tc-speed-reader bind:this={el} {scheduler}></tc-speed-reader>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Speed reader"` | The heading |
| `description` | `description` | `string` | `""` | A quiet line under the heading – the source or what the passage is |
| `text` | `text` | `string` | `""` | The passage: plain text; a blank line starts a new paragraph |
| `wpm` | `wpm` | `number` | `300` | Words a minute, 100–1000. Changed by the element unless a tc-wpm-change listener calls preventDefault() |
| `chunk` | `chunk` | `number` | `1` | Words shown at a time, 1–3. Changed by the element unless a tc-chunk-change listener calls preventDefault() |
| `position` | `position` | `number` | `0` | The first word on screen (0-based). Changed by the element unless a tc-position-change listener calls preventDefault() |
| `scheduler` | – | `SpeedReaderScheduler` | `{ set: (run, ms) => setTimeout(run, ms), clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>), }` | When the next word is due – setTimeout unless given; tests and pages that sync to something else pass their own |
| `playing` | – | `` | – | Whether it's reading |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-wpm-change` | – | Yes | The speed was changed ({ wpm }: SpeedReaderWpmChange); cancelable – prevented, `wpm` stays as it was |
| `tc-chunk-change` | – | Yes | The words at a time were changed ({ chunk }: SpeedReaderChunkChange); cancelable – prevented, `chunk` stays |
| `tc-position-change` | – | Yes | The place moved, by reading on, stepping or the scrubber ({ position }: SpeedReaderPositionChange); cancelable – prevented, `position` stays |
| `tc-finish` | – | No | The last word was shown ({ words }: SpeedReaderFinish) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `play()` | `void` | Starts reading (from the start again when at the end) |
| `pause()` | `void` | Pauses on the current word |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-spr-frame-h` | `112px` | both |
| `--tc-spr-guide` | `var(--tc-border-strong)` | both |

#### Design tokens it reads (82)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-3xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-switch-knob-bg`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `readerWords(text: string): Word[]` | Splits a passage into words, numbering their sentences; a blank line also ends one |
| `recognitionPoint(word: string): void` | The optimal recognition point: the index of the letter to fix the eye on |
| `wordWeight(word: string): void` | How long a word stays up, in words: longer after a sentence end, a comma, or a long word |

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
| `scheduler` | `el.scheduler = …;` | `<… scheduler={…} />` | `<tc-speed-reader :scheduler="…">` | `<tc-speed-reader [scheduler]="…">` | `<tc-speed-reader {scheduler}>` |

*Also attributes: `heading`, `description`, `text`, `wpm`, `chunk`, `position` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-wpm-change` | Yes | `el.addEventListener("tc-wpm-change", (e) => …)` | `onWpmChange={…}` | `@tc-wpm-change="…"` | `(tc-wpm-change)="…($event)"` | `el.addEventListener("tc-wpm-change", …)` |
| `tc-chunk-change` | Yes | `el.addEventListener("tc-chunk-change", (e) => …)` | `onChunkChange={…}` | `@tc-chunk-change="…"` | `(tc-chunk-change)="…($event)"` | `el.addEventListener("tc-chunk-change", …)` |
| `tc-position-change` | Yes | `el.addEventListener("tc-position-change", (e) => …)` | `onPositionChange={…}` | `@tc-position-change="…"` | `(tc-position-change)="…($event)"` | `el.addEventListener("tc-position-change", …)` |
| `tc-finish` | No | `el.addEventListener("tc-finish", (e) => …)` | `onFinish={…}` | `@tc-finish="…"` | `(tc-finish)="…($event)"` | `el.addEventListener("tc-finish", …)` |

### Controlled

The element changes `wpm`, `chunk` and `position` itself unless a listener calls `preventDefault()` on `tc-wpm-change`, `tc-chunk-change` or `tc-position-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-speed-reader id="speed-reader"></tc-speed-reader>

<script type="module">
  import "@adamstavely/trenchcoat/speed-reader";

  const el = document.querySelector("#speed-reader");
  el.addEventListener("tc-wpm-change", (e) => {
    e.preventDefault(); // the element keeps its wpm…
    if (allowed(e.detail.wpm)) el.wpm = e.detail.wpm; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SpeedReader } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SpeedReader>;
type Props = Omit<Own, "wpm" | "onWpmChange"> & { initial: NonNullable<Own["wpm"]> };

// Controlled: passing wpm makes the wrapper prevent the element's own change; the app sets it
export function ControlledSpeedReader({ initial, ...props }: Props) {
  const [wpm, setWpm] = useState<Own["wpm"]>(initial);
  return <SpeedReader {...props} wpm={wpm} onWpmChange={(next) => setWpm(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/speed-reader";
import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";

const props = defineProps<{ initial: TcSpeedReader["wpm"] }>();
const wpm = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onWpmChange = (e: CustomEvent<{ wpm: TcSpeedReader["wpm"] }>) => {
  e.preventDefault();
  wpm.value = e.detail.wpm;
};
</script>

<template>
  <tc-speed-reader :wpm="wpm" @tc-wpm-change="onWpmChange"></tc-speed-reader>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SpeedReader } from "@adamstavely/trenchcoat/angular/speed-reader";
import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";

@Component({
  selector: "app-controlled-speed-reader",
  imports: [SpeedReader],
  template: `<tc-speed-reader [wpm]="wpm()" (tc-wpm-change)="onWpmChange($event)"></tc-speed-reader>`,
})
export class ControlledSpeedReader {
  readonly initial = input.required<TcSpeedReader["wpm"]>();
  readonly wpm = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onWpmChange(e: CustomEvent<{ wpm: TcSpeedReader["wpm"] }>) {
    e.preventDefault();
    this.wpm.set(e.detail.wpm);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/speed-reader";
  import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";

  let { initial }: { initial: TcSpeedReader["wpm"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let wpm = $derived(initial);
  let el: TcSpeedReader;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      wpm = (e as CustomEvent<{ wpm: TcSpeedReader["wpm"] }>).detail.wpm;
    };
    el.addEventListener("tc-wpm-change", on);
    return () => el.removeEventListener("tc-wpm-change", on);
  });
</script>

<tc-speed-reader bind:this={el} {wpm}></tc-speed-reader>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-speed-reader")` returns a `TcSpeedReader` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";`
- **React / Next.js:** Props: `import type { SpeedReaderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SpeedReader>`. The element class, for refs: `import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSpeedReader["scheduler"]` with `import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";`
- **Angular:** The directive types the template: `[scheduler]` takes `TcSpeedReader["scheduler"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSpeedReader } from "@adamstavely/trenchcoat/speed-reader";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "Speed reader" by default |
| `wpm` | `number` | Words a minute, 100–1000 – controlled when given |
| `defaultWpm` | `number` | The speed on mount when `wpm` isn't controlled |
| `onWpmChange` | `(wpm: number) => void` | The speed was changed |
| `chunk` | `number` | Words shown at a time, 1–3 – controlled when given |
| `defaultChunk` | `number` | The words at a time on mount when `chunk` isn't controlled |
| `onChunkChange` | `(chunk: number) => void` | The words at a time were changed |
| `position` | `number` | The first word on screen, 0-based – controlled when given |
| `defaultPosition` | `number` | The place on mount when `position` isn't controlled |
| `onPositionChange` | `(position: number) => void` | The place moved – reading on, stepping or the scrubber |
| `onFinish` | `(words: number) => void` | The last word was shown |

*Renamed or hidden on the wrapper: `heading`, `wpm`, `chunk`, `position`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the frame, the controls (one stop), the scrubber, the speed and the words at a time |
| Space in the frame | Plays or pauses |
| ← / → in the frame | Steps back or forward a word (or a chunk) |
| Shift+← / Shift+→ in the frame | Steps back or forward a sentence |
| Home / End in the frame | Goes to the first or last word |
| ← → in the controls | Move between the buttons |
| ← → on the scrubber or speed | Change it |

### Screen readers

The frame is a group named "Reader" with its keys in `aria-keyshortcuts` and described in words. The word in it is
read whole – the split around the recognition point is hidden. Nothing is announced per word; a polite status says
"Reading at 350 words a minute", "Paused at word 120 of 840" and "Finished". The scrubber is a slider named "Place in
the text" with a value text such as "Word 120 of 840"; the speed's value text is "350 words a minute". The icon
buttons are named "Start over", "Previous sentence", "Previous word", "Next word" and "Next sentence".

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 23.4 KB | 7.4 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **31.7 KB** | **9.8 KB** |
| With Lit – the first component on a page | 52.5 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 69 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | re-render with the same data |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |

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

- Pass plain text; a blank line starts a new paragraph and ends a sentence. Strip markup and footnote markers first.
- Keep passages short – a few hundred words. Comprehension drops on long texts read this way.
- Start new readers around 250–300 words a minute.

## Do and don't

### Do

- Keep `position` in your store to let people leave and come back to the same word.
- Offer the plain text alongside, for anyone who would rather read normally.

### Don't

- Don't start playing on load – let the reader press Play when they're ready.
- Don't use it for text with tables, code or lists – they don't survive being read a word at a time.

## Related

- [Text To Speech](text-to-speech.md) – Reads a passage aloud with the browser's voices – the sentence and the spoken word marked as it goes, click a sentence to read from there, play, pause, skip and stop, and a voice, speed and pitch picker
- [File Summary](file-summary.md) – What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file
- [Digest](digest.md) – A one-minute digest of a pile of information, arranged around what the reader needs – what matters, what to do (ticked off as you go), what changed and what's safe to ignore, with a reading-time estimate and points that cite their sources
- [Selection Translate](selection-translate.md) – Select text and translate it – the translation in a card with the detected language, copy, replace in place and show original

## Changelog

- `tc-speed-reader` – RSVP speed reading at 100–1000 words a minute with the recognition point on a guide mark.
