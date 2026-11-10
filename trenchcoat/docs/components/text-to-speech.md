<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Text To Speech

**AI & chat** · New

Reads a passage aloud with the browser's voices – the sentence and the spoken word marked as it goes, click a sentence to read from there, play, pause, skip and stop, and a voice, speed and pitch picker

- **Element:** `<tc-text-to-speech>`
- **Size:** 10.1 KB gzip · 33.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/text-to-speech";` |
| React / Next.js | `import { TextToSpeech } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/text-to-speech";` · tags starting with tc- are custom elements |
| Angular | `import { TextToSpeech } from "@adamstavely/trenchcoat/angular/text-to-speech";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/text-to-speech";` |

## Example

The live example is in the gallery at `#/text-to-speech`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Reads a passage aloud with the browser's own voices, while the text stays on screen. The sentence being read is
shaded and the word being spoken is marked, so a reader can follow along, look away and find their place again, or
listen without reading. Play, Pause and Resume, Stop, and previous and next sentence sit in a toolbar; under it are the
voice, the speed (0.5–2×) and the pitch. Click any sentence to read from there. A line under the passage says where it
is ("Sentence 3 of 12") and roughly how long is left.

It uses the Web Speech API and speaks one sentence at a time, so skipping and a new speed or voice take effect at
once. Where the browser has no speech synthesis, the passage stays readable and a line says read aloud isn't
available.

### When to use

- Articles, guides, instructions and summaries people may want to listen to – an accessibility aid and a convenience.
- Proofreading by ear: hearing a draft read back with the words marked.
- Language practice, where following the marked word matters.

### When not to use

- A spoken conversation with the model – use [Voice Mode](voice-mode.md).
- A Read aloud button on a chat message – [Message Actions](message-actions.md) has one.
- Reading fast with the eyes rather than the ears – use [Speed Reader](speed-reader.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading, the description and a Reading / Paused pill while it's going
2. **Passage** `.ui-tts__passage` – the text, in paragraphs; it scrolls inside its own height and follows the reading
3. **Sentence** `.ui-tts__sentence` – shaded while it's read; click it to read from there
4. **Word** `.ui-tts__word` – marked while it's spoken, when the voice reports words
5. **Progress** `.ui-tts__progress` – the sentence number and the time left
6. **Controls** `.ui-tts__bar` – previous sentence, Play / Pause / Resume `.ui-tts__play`, next sentence and Stop
7. **Settings** `.ui-tts__settings` – the voice, the speed and the pitch
8. **Unsupported** `.ui-tts__unsupported` – shown instead of reading where the browser can't speak

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Below about 480 px the voice takes its own row above the speed and pitch; below about 320 px each
setting gets its own row. The passage's height is `--tc-tts-passage-h` (260 px by default).

## Usage

### HTML

```html
<tc-text-to-speech id="guide" heading="Harrow Point light" lang="en"></tc-text-to-speech>

<script type="module">
  import "@adamstavely/trenchcoat/text-to-speech";
  import "@adamstavely/trenchcoat/tokens.css";

  const guide = document.querySelector("#guide");
  guide.text = "The Harrow Point light was first lit in 1871. Today it still flashes twice every fifteen seconds.";
  guide.addEventListener("tc-rate-change", (e) => localStorage.setItem("tts-rate", String(e.detail.rate)));
  guide.addEventListener("tc-end", (e) => console.log(e.detail.completed ? "finished" : "stopped"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TextToSpeech } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AudioGuide({ text }: { text: string }) {
  const [rate, setRate] = useState(1);
  return <TextToSpeech title="Audio guide" text={text} lang="en" rate={rate} onRateChange={setRate} onReadEnd={(done) => console.log(done)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/text-to-speech";
import "@adamstavely/trenchcoat/tokens.css";

const onRateChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-text-to-speech @tc-rate-change="onRateChange"></tc-text-to-speech>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { TextToSpeech } from "@adamstavely/trenchcoat/angular/text-to-speech";

@Component({
  selector: "app-text-to-speech-example",
  imports: [TextToSpeech],
  template: `<tc-text-to-speech (tc-rate-change)="onRateChange($event)"></tc-text-to-speech>`,
})
export class TextToSpeechExample {
  onRateChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/text-to-speech";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";

  let el: TcTextToSpeech;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-rate-change", on);
    return () => el.removeEventListener("tc-rate-change", on);
  });
</script>

<tc-text-to-speech bind:this={el}></tc-text-to-speech>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Read aloud"` | The heading |
| `description` | `description` | `string` | `""` | A quiet line under the heading – the source or what the passage is |
| `text` | `text` | `string` | `""` | The passage to read: plain text; a blank line starts a new paragraph |
| `rate` | `rate` | `number` | `1` | Speaking speed from 0.5 to 2 (1 is normal). Changed by the element unless a tc-rate-change listener calls preventDefault() |
| `pitch` | `pitch` | `number` | `1` | Pitch from 0 to 2 (1 is normal). Changed by the element unless a tc-pitch-change listener calls preventDefault() |
| `voice` | `voice` | `string` | `""` | The chosen voice's `voiceURI`, or "" for the browser's default. Changed unless a tc-voice-change listener calls preventDefault() |
| `lang` | `lang` | `string` | `""` | The passage's language (a BCP 47 tag) – picks a default voice and splits sentences; unset, the browser decides. Reflects to the lang attribute, as HTMLElement's own does, so assistive tech and fonts see it |
| `state` | – | `TextToSpeechState` | – | Whether it's reading, paused or idle |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-rate-change` | – | Yes | The speed was changed ({ rate }: TextToSpeechRateChange); cancelable – prevented, `rate` stays as it was |
| `tc-pitch-change` | – | Yes | The pitch was changed ({ pitch }: TextToSpeechPitchChange); cancelable – prevented, `pitch` stays |
| `tc-voice-change` | – | Yes | A voice was picked ({ voice }: TextToSpeechVoiceChange); cancelable – prevented, `voice` stays |
| `tc-start` | – | No | Reading began ({ sentence }: TextToSpeechStart) |
| `tc-end` | – | No | Reading stopped, at the end or by Stop ({ completed, sentence }: TextToSpeechEnd) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `play(from: unknown)` | `void` | Starts reading from a sentence (0-based), or from the current one |
| `pause()` | `void` | Pauses; Resume starts the sentence again |
| `stop()` | `void` | Stops and goes back to the start |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tts-passage-h` | `260px` | both |

#### Design tokens it reads (79)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-control`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-knob-bg`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `splitSentences(text: string, locale?: string): Sentence[]` | Splits a passage into paragraphs (blank lines) and sentences, with each word's place in its sentence |

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

*Also attributes: `heading`, `description`, `text`, `rate`, `pitch`, `voice`, `lang` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-rate-change` | Yes | `el.addEventListener("tc-rate-change", (e) => …)` | `onRateChange={…}` | `@tc-rate-change="…"` | `(tc-rate-change)="…($event)"` | `el.addEventListener("tc-rate-change", …)` |
| `tc-pitch-change` | Yes | `el.addEventListener("tc-pitch-change", (e) => …)` | `onPitchChange={…}` | `@tc-pitch-change="…"` | `(tc-pitch-change)="…($event)"` | `el.addEventListener("tc-pitch-change", …)` |
| `tc-voice-change` | Yes | `el.addEventListener("tc-voice-change", (e) => …)` | `onVoiceChange={…}` | `@tc-voice-change="…"` | `(tc-voice-change)="…($event)"` | `el.addEventListener("tc-voice-change", …)` |
| `tc-start` | No | `el.addEventListener("tc-start", (e) => …)` | `onReadStart={…}` | `@tc-start="…"` | `(tc-start)="…($event)"` | `el.addEventListener("tc-start", …)` |
| `tc-end` | No | `el.addEventListener("tc-end", (e) => …)` | `onReadEnd={…}` | `@tc-end="…"` | `(tc-end)="…($event)"` | `el.addEventListener("tc-end", …)` |

### Controlled

The element changes `rate`, `pitch` and `voice` itself unless a listener calls `preventDefault()` on `tc-rate-change`, `tc-pitch-change` or `tc-voice-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-text-to-speech id="text-to-speech"></tc-text-to-speech>

<script type="module">
  import "@adamstavely/trenchcoat/text-to-speech";

  const el = document.querySelector("#text-to-speech");
  el.addEventListener("tc-rate-change", (e) => {
    e.preventDefault(); // the element keeps its rate…
    if (allowed(e.detail.rate)) el.rate = e.detail.rate; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TextToSpeech } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TextToSpeech>;
type Props = Omit<Own, "rate" | "onRateChange"> & { initial: NonNullable<Own["rate"]> };

// Controlled: passing rate makes the wrapper prevent the element's own change; the app sets it
export function ControlledTextToSpeech({ initial, ...props }: Props) {
  const [rate, setRate] = useState<Own["rate"]>(initial);
  return <TextToSpeech {...props} rate={rate} onRateChange={(next) => setRate(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/text-to-speech";
import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";

const props = defineProps<{ initial: TcTextToSpeech["rate"] }>();
const rate = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRateChange = (e: CustomEvent<{ rate: TcTextToSpeech["rate"] }>) => {
  e.preventDefault();
  rate.value = e.detail.rate;
};
</script>

<template>
  <tc-text-to-speech :rate="rate" @tc-rate-change="onRateChange"></tc-text-to-speech>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TextToSpeech } from "@adamstavely/trenchcoat/angular/text-to-speech";
import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";

@Component({
  selector: "app-controlled-text-to-speech",
  imports: [TextToSpeech],
  template: `<tc-text-to-speech [rate]="rate()" (tc-rate-change)="onRateChange($event)"></tc-text-to-speech>`,
})
export class ControlledTextToSpeech {
  readonly initial = input.required<TcTextToSpeech["rate"]>();
  readonly rate = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRateChange(e: CustomEvent<{ rate: TcTextToSpeech["rate"] }>) {
    e.preventDefault();
    this.rate.set(e.detail.rate);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/text-to-speech";
  import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";

  let { initial }: { initial: TcTextToSpeech["rate"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let rate = $derived(initial);
  let el: TcTextToSpeech;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      rate = (e as CustomEvent<{ rate: TcTextToSpeech["rate"] }>).detail.rate;
    };
    el.addEventListener("tc-rate-change", on);
    return () => el.removeEventListener("tc-rate-change", on);
  });
</script>

<tc-text-to-speech bind:this={el} {rate}></tc-text-to-speech>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-text-to-speech")` returns a `TcTextToSpeech` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";`
- **React / Next.js:** Props: `import type { TextToSpeechProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TextToSpeech>`. The element class, for refs: `import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTextToSpeech["heading"]` with `import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";`
- **Angular:** The directive types the template: `[heading]` takes `TcTextToSpeech["heading"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTextToSpeech } from "@adamstavely/trenchcoat/text-to-speech";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "Read aloud" by default |
| `rate` | `number` | Speaking speed from 0.5 to 2 – controlled when given |
| `defaultRate` | `number` | The speed on mount when `rate` isn't controlled |
| `onRateChange` | `(rate: number) => void` | The speed was changed |
| `pitch` | `number` | Pitch from 0 to 2 – controlled when given |
| `defaultPitch` | `number` | The pitch on mount when `pitch` isn't controlled |
| `onPitchChange` | `(pitch: number) => void` | The pitch was changed |
| `voice` | `string` | The voice's `voiceURI`, "" for the browser's default – controlled when given |
| `defaultVoice` | `string` | The voice on mount when `voice` isn't controlled |
| `onVoiceChange` | `(voice: string) => void` | A voice was picked |
| `onReadStart` | `(sentence: number) => void` | Reading began at a sentence (0-based) |
| `onReadEnd` | `(completed: boolean, sentence: number) => void` | Reading stopped – `completed` when it reached the end |

*Renamed or hidden on the wrapper: `heading`, `onRateChange`, `rate`, `pitch`, `voice`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the passage (one stop), the controls (one stop), then the voice, speed and pitch |
| ← → ↑ ↓ in the passage | Move between sentences |
| Home / End in the passage | Go to the first or last sentence |
| Enter on a sentence | Reads from that sentence |
| Space on a sentence | Reads from it – or pauses and resumes when it's the one being read |
| ← → in the controls | Move between the buttons |
| Enter / Space on a button | Presses it |

### Screen readers

The passage is a group named "Passage"; each sentence is a button whose name is its text, with `aria-current` on the
one being read and a description of Enter and Space. The controls are a toolbar named "Reading controls"; the icon
buttons are named "Previous sentence", "Next sentence" and "Stop". A polite status says "Reading", "Paused",
"Stopped" or "Finished reading" – never each sentence, which the speech already says. The speed has a value text such
as "1.5 times".

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
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.2 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **33.5 KB** | **10.2 KB** |
| With Lit – the first component on a page | 54.2 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.8 ms** | the gallery demo's data, 354 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | re-render with the same data |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |

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

- Pass plain text; a blank line starts a new paragraph. Strip markup, footnote markers and URLs first – they're read
  out literally.
- Set `lang` to the text's language, so a matching voice is picked and sentences are split the right way.
- Spell out what a voice would stumble on: "AD 1871" reads better than "1871 C.E." in most voices.

## Do and don't

### Do

- Keep the speed and voice in your store with tc-rate-change and tc-voice-change, so they follow the person around.
- Put it next to the text it reads, or use it as the text – not as a separate player for something hidden.

### Don't

- Don't start reading on load – sound should start when someone asks for it.
- Don't hide the text: listeners often want to glance back.

## Related

- [Speed Reader](speed-reader.md) – Speed reading one word at a time in a fixed frame – the recognition point on a guide mark, longer pauses at sentence ends, 100–1000 words a minute, 1–3 words at a time, a scrubber with the time left, and the sentence around the word when paused
- [Voice Mode](voice-mode.md) – A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Selection Translate](selection-translate.md) – Select text and translate it – the translation in a card with the detected language, copy, replace in place and show original

## Changelog

- `tc-text-to-speech` – reads a passage aloud with the browser's voices, marking the sentence and word.
