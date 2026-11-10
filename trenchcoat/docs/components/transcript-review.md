<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Transcript Review

**Trust & calibration** · New

Recorded audio or video with a transcript that follows playback – speakers, timestamps, recognition confidence and low-confidence segments to verify

- **Element:** `<tc-transcript-review>`
- **Size:** 18.3 KB gzip · 63.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/transcript-review";` |
| React / Next.js | `import { TranscriptReview } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/transcript-review";` · tags starting with tc- are custom elements |
| Angular | `import { TranscriptReview } from "@adamstavely/trenchcoat/angular/transcript-review";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/transcript-review";` |

## Example

The live example is in the gallery at `#/transcript-review`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A recording – audio or video – with the transcript that follows it. The segment being spoken is highlighted and
kept in view, every segment shows its timestamp and speaker, and segments where speech recognition or translation
was unsure are marked so someone checks them against the recording before relying on them. A machine transcript is
a derivative with its own error rate, not a document; this view keeps the source and the text side by side and
makes the uncertain parts easy to find, search and send to verification.

### When to use

- Reviewing a recorded call, interview, meeting or hearing that was transcribed by speech recognition.
- Machine-translated recordings, where reviewers need the original and the translation together.
- Any workflow where a quote from a recording has to be checked before it's used – "Send to verification" hands the
  segment to your review process.

### When not to use

- A live spoken conversation with the model – use [Voice Mode](voice-mode.md).
- Checking claims a model made in a written answer – use [Claim Answer](claim-answer.md), and collect them in [Verification Queue](verification-queue.md).
- A transcript with no recording to play – use [Verification Queue](verification-queue.md) for the parts to check, or plain text.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Waveform** `.ui-tsr__wave` – the app's peaks with the playhead; underlines mark low-confidence stretches, ticks mark search matches
2. **Controls** `.ui-tsr__controls` – back, play or pause, forward, the time and the playback speed
3. **Tools** `.ui-tsr__tools` – search, and the switch between the original, the translation or both
4. **Speakers** `.ui-tsr__speakers` – a colour chip per speaker, pressed to show or hide their segments
5. **Segments** `.ui-tsr__list` – the transcript; the segment playing is selected and marked, and a low-confidence one carries an amber flag with its score
6. **Low-confidence count** `.ui-tsr__pill` – how many segments fall below the threshold
7. **Segment actions** `.ui-tsr__foot` – the selected segment's time, speaker and confidence, Copy and Send to verification

## Looks

Standard puts the heading on the gray tray, the player, tools and segments in a white card, and the selected
segment's actions on the tray below; played bars are the accent colour. Clean is one white card divided by
hairlines, with thinner icons and the played bars in ink. Both mark uncertainty the same way: an amber flag with the
score, an amber line under that stretch of the waveform, and a dotted underline under uncertain words.

While the recording plays, the playhead moves every frame. Scrolled off-screen, that frame loop pauses (the host
gets `data-offscreen`); the recording keeps playing and the current segment still follows it, and the playhead
catches up as soon as the component is back in view.

## Usage

### HTML

```html
<tc-transcript-review id="call" heading="Customer call" original-label="Spanish" translation-label="English (machine)"></tc-transcript-review>

<script type="module">
  import "@adamstavely/trenchcoat/transcript-review";
  import "@adamstavely/trenchcoat/tokens.css";

  const call = document.querySelector("#call");
  call.src = "/recordings/call-4471.mp3";
  call.peaks = await (await fetch("/recordings/call-4471.peaks.json")).json();
  call.speakers = [
    { id: "s1", name: "Marta (support)" },
    { id: "s2", name: "Luis Ortega" },
  ];
  call.segments = [
    { id: "a", start: 0.4, end: 4.2, speaker: "s1", text: "Buenos días, ¿en qué puedo ayudarle?", translation: "Good morning, how can I help?", confidence: 0.96 },
    { id: "b", start: 4.8, end: 9.6, speaker: "s2", text: "Termina en ochenta y dos.", translation: "It ends in eighty-two.", confidence: 0.58 },
  ];
  call.addEventListener("tc-verify", (e) => sendToReview(e.detail.segment));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TranscriptReview, type TranscriptSegment } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CallReview({ src, peaks, segments }: { src: string; peaks: number[]; segments: TranscriptSegment[] }) {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <TranscriptReview
      title="Customer call"
      src={src}
      peaks={peaks}
      segments={segments}
      threshold={0.7}
      sent={sent}
      onSentChange={setSent}
      onVerify={(segment) => console.log("verify", segment.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/transcript-review";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";

defineProps<{ segments: TcTranscriptReview["segments"]; speakers: TcTranscriptReview["speakers"] }>();
const onSegmentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-transcript-review :segments="segments" :speakers="speakers" @tc-segment-change="onSegmentChange"></tc-transcript-review>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TranscriptReview } from "@adamstavely/trenchcoat/angular/transcript-review";
import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";

@Component({
  selector: "app-transcript-review-example",
  imports: [TranscriptReview],
  template: `<tc-transcript-review [segments]="segments()" [speakers]="speakers()" (tc-segment-change)="onSegmentChange($event)"></tc-transcript-review>`,
})
export class TranscriptReviewExample {
  readonly segments = input.required<TcTranscriptReview["segments"]>();
  readonly speakers = input.required<TcTranscriptReview["speakers"]>();
  onSegmentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/transcript-review";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";

  let { segments, speakers }: { segments: TcTranscriptReview["segments"]; speakers: TcTranscriptReview["speakers"] } = $props();
  let el: TcTranscriptReview;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-segment-change", on);
    return () => el.removeEventListener("tc-segment-change", on);
  });
</script>

<tc-transcript-review bind:this={el} {segments} {speakers}></tc-transcript-review>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `segments` | – | `TranscriptSegment[]` | `[]` | The transcript, in order of `start` |
| `speakers` | – | `TranscriptSpeaker[]` | `[]` | Names, chip text and colours for the speaker ids in `segments`; an id with no entry shows as itself |
| `src` | `src` | `string` | `""` | The recording's URL; the element makes its own &lt;audio> or &lt;video> (see `kind`). Ignored when `media` is set |
| `media` | – | `HTMLMediaElement \| null` | `null` | The app's own &lt;audio> or &lt;video> to drive instead of `src`. A &lt;video> that isn't on the page is shown in the card |
| `kind` | `kind` | `TranscriptMediaKind` | `"audio"` | What `src` is: "audio" (default) or "video", which shows the picture above the waveform |
| `peaks` | – | `number[]` | `[]` | The waveform: loudness peaks from 0 to 1, as many as you have – they're resampled to fit the width |
| `duration` | `duration` | `number \| undefined` | `undefined` | The recording's length in seconds, until the media reports it (default: the last segment's end) |
| `threshold` | `threshold` | `number` | `0.7` | Segments and words with confidence below this (0–1) are marked for checking |
| `heading` | `heading` | `string` | `"Transcript"` | The heading, and the region's name |
| `description` | `description` | `string` | `""` | The quiet line under the heading (default: the length and how many speakers) |
| `translationMode` | `translation-mode` | `TranscriptTranslationMode` | `"original"` | What the transcript shows when segments have translations: the original, the translation, or both side by side |
| `originalLabel` | `original-label` | `string` | `"Original"` | The name of the original language's column and button, e.g. "Spanish" |
| `translationLabel` | `translation-label` | `string` | `"Translation"` | The name of the translation's column and button, e.g. "English (machine)" |
| `hiddenSpeakers` | – | `string[]` | `[]` | Speaker ids whose segments the list leaves out |
| `query` | `query` | `string` | `""` | The search text |
| `sent` | – | `string[]` | `[]` | Ids of segments already sent to verification |
| `verifiable` | `verifiable` | `boolean` | `true` | Shows "Send to verification" on each segment (default true) |
| `verifyLabel` | `verify-label` | `string` | `"Send to verification"` | The verification action's label |
| `skip` | `skip` | `number` | `5` | How far J and L (and the back and forward buttons) jump, in seconds |
| `maxHeight` | `max-height` | `number` | `360` | The tallest the list grows, in px, before it scrolls |
| `totalDuration` | – | `` | – | The recording's length in seconds: `duration`, else what the media reports, else the last segment's end |
| `currentSegment` | – | `TranscriptSegment \| null` | – | The segment being played, if any |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-segment-change` | – | No | The segment being played changed (playback, a seek or a step); detail `{ segment }` (TranscriptSegmentChange) – null in a gap between segments |
| `tc-verify` | – | Yes | "Send to verification" on a segment; detail `{ segment, sent }` (TranscriptVerifyDetail) – `sent` is the list after it. Cancelable: preventDefault() keeps `sent` as it is |
| `tc-copy` | – | Yes | Copy on a segment; detail `{ segment, text }` (TranscriptCopyDetail) – the text with its timestamp and speaker. Cancelable: preventDefault() and copy it yourself |
| `tc-query-change` | – | Yes | The search text changed; detail `{ query }` (TranscriptQueryChange). Cancelable |
| `tc-hidden-speakers-change` | – | Yes | A speaker chip was toggled; detail `{ hiddenSpeakers }` (TranscriptHiddenSpeakersChange). Cancelable |
| `tc-translation-mode-change` | – | Yes | Original, Translation or Side by side was chosen ({ mode, translationMode }: TranscriptTranslationModeChange – the same mode). Cancelable |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `play()` | `void` | Plays the media from where it is |
| `pause()` | `void` | Pauses the media |
| `seek(seconds: number)` | `void` | Moves playback to `seconds` from the start |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-transcript-review-max` | `360px` | not set – this fallback applies |

#### Design tokens it reads (108)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h-sm`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-scrim`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-transcript-review-bg`, `--tc-transcript-review-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `transcriptClock(seconds: number, pad: unknown): void` | A timestamp: 00:42 · 1:04:09 |

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
| `segments` | `el.segments = …;` | `<… segments={…} />` | `<tc-transcript-review :segments="…">` | `<tc-transcript-review [segments]="…">` | `<tc-transcript-review {segments}>` |
| `speakers` | `el.speakers = …;` | `<… speakers={…} />` | `<tc-transcript-review :speakers="…">` | `<tc-transcript-review [speakers]="…">` | `<tc-transcript-review {speakers}>` |
| `media` | `el.media = …;` | `<… media={…} />` | `<tc-transcript-review :media="…">` | `<tc-transcript-review [media]="…">` | `<tc-transcript-review {media}>` |
| `peaks` | `el.peaks = …;` | `<… peaks={…} />` | `<tc-transcript-review :peaks="…">` | `<tc-transcript-review [peaks]="…">` | `<tc-transcript-review {peaks}>` |
| `hiddenSpeakers` | `el.hiddenSpeakers = …;` | `<… hiddenSpeakers={…} />` | `<tc-transcript-review :hiddenSpeakers="…">` | `<tc-transcript-review [hiddenSpeakers]="…">` | `<tc-transcript-review {hiddenSpeakers}>` |
| `sent` | `el.sent = …;` | `<… sent={…} />` | `<tc-transcript-review :sent="…">` | `<tc-transcript-review [sent]="…">` | `<tc-transcript-review {sent}>` |

*Also attributes: `src`, `kind`, `duration`, `threshold`, `heading`, `description`, `translation-mode`, `original-label` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-segment-change` | No | `el.addEventListener("tc-segment-change", (e) => …)` | `onSegmentChange={…}` | `@tc-segment-change="…"` | `(tc-segment-change)="…($event)"` | `el.addEventListener("tc-segment-change", …)` |
| `tc-verify` | Yes | `el.addEventListener("tc-verify", (e) => …)` | `onVerify={…}` | `@tc-verify="…"` | `(tc-verify)="…($event)"` | `el.addEventListener("tc-verify", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopySegment={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `onQueryChange={…}` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-hidden-speakers-change` | Yes | `el.addEventListener("tc-hidden-speakers-change", (e) => …)` | `onHiddenSpeakersChange={…}` | `@tc-hidden-speakers-change="…"` | `(tc-hidden-speakers-change)="…($event)"` | `el.addEventListener("tc-hidden-speakers-change", …)` |
| `tc-translation-mode-change` | Yes | `el.addEventListener("tc-translation-mode-change", (e) => …)` | `onTranslationModeChange={…}` | `@tc-translation-mode-change="…"` | `(tc-translation-mode-change)="…($event)"` | `el.addEventListener("tc-translation-mode-change", …)` |

### Controlled

The element changes `translationMode`, `hiddenSpeakers` and `query` itself unless a listener calls `preventDefault()` on `tc-translation-mode-change`, `tc-hidden-speakers-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-transcript-review id="transcript-review"></tc-transcript-review>

<script type="module">
  import "@adamstavely/trenchcoat/transcript-review";

  const el = document.querySelector("#transcript-review");
  el.addEventListener("tc-translation-mode-change", (e) => {
    e.preventDefault(); // the element keeps its translationMode…
    if (allowed(e.detail.translationMode)) el.translationMode = e.detail.translationMode; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TranscriptReview } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TranscriptReview>;
type Props = Omit<Own, "translationMode" | "onTranslationModeChange"> & { initial: NonNullable<Own["translationMode"]> };

// Controlled: passing translationMode makes the wrapper prevent the element's own change; the app sets it
export function ControlledTranscriptReview({ initial, ...props }: Props) {
  const [translationMode, setTranslationMode] = useState<Own["translationMode"]>(initial);
  return <TranscriptReview {...props} translationMode={translationMode} onTranslationModeChange={(next) => setTranslationMode(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/transcript-review";
import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";

const props = defineProps<{ initial: TcTranscriptReview["translationMode"] }>();
const translationMode = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTranslationModeChange = (e: CustomEvent<{ translationMode: TcTranscriptReview["translationMode"] }>) => {
  e.preventDefault();
  translationMode.value = e.detail.translationMode;
};
</script>

<template>
  <tc-transcript-review :translationMode="translationMode" @tc-translation-mode-change="onTranslationModeChange"></tc-transcript-review>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TranscriptReview } from "@adamstavely/trenchcoat/angular/transcript-review";
import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";

@Component({
  selector: "app-controlled-transcript-review",
  imports: [TranscriptReview],
  template: `<tc-transcript-review [translationMode]="translationMode()" (tc-translation-mode-change)="onTranslationModeChange($event)"></tc-transcript-review>`,
})
export class ControlledTranscriptReview {
  readonly initial = input.required<TcTranscriptReview["translationMode"]>();
  readonly translationMode = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTranslationModeChange(e: CustomEvent<{ translationMode: TcTranscriptReview["translationMode"] }>) {
    e.preventDefault();
    this.translationMode.set(e.detail.translationMode);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/transcript-review";
  import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";

  let { initial }: { initial: TcTranscriptReview["translationMode"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let translationMode = $derived(initial);
  let el: TcTranscriptReview;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      translationMode = (e as CustomEvent<{ translationMode: TcTranscriptReview["translationMode"] }>).detail.translationMode;
    };
    el.addEventListener("tc-translation-mode-change", on);
    return () => el.removeEventListener("tc-translation-mode-change", on);
  });
</script>

<tc-transcript-review bind:this={el} {translationMode}></tc-transcript-review>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-transcript-review")` returns a `TcTranscriptReview` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";`
- **React / Next.js:** Props: `import type { TranscriptReviewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TranscriptReview>`. The element class, for refs: `import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTranscriptReview["segments"]` with `import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";`
- **Angular:** The directive types the template: `[segments]` takes `TcTranscriptReview["segments"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTranscriptReview } from "@adamstavely/trenchcoat/transcript-review";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `query` | `string` | The search text – controlled when defined; pair it with `onQueryChange` |
| `defaultQuery` | `string` | The search text at first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | Called as the search text changes |
| `hiddenSpeakers` | `string[]` | Speaker ids the list leaves out – controlled when defined |
| `defaultHiddenSpeakers` | `string[]` | Speaker ids left out at first, when `hiddenSpeakers` isn't controlled |
| `onHiddenSpeakersChange` | `(hiddenSpeakers: string[]) => void` | Called when a speaker chip is toggled, with the ids now hidden |
| `translationMode` | `TranscriptTranslationMode` | Original, translation or both side by side – controlled when defined |
| `defaultTranslationMode` | `TranscriptTranslationMode` | The view at first, when `translationMode` isn't controlled (default "original") |
| `onTranslationModeChange` | `(mode: TranscriptTranslationMode) => void` | Called when the view is switched |
| `sent` | `string[]` | Ids of segments sent to verification – controlled when defined; pair it with `onSentChange` |
| `defaultSent` | `string[]` | Ids already sent at first, when `sent` isn't controlled |
| `onSentChange` | `(sent: string[]) => void` | Called with every sent id after "Send to verification" |
| `onVerify` | `(segment: TranscriptSegment) => void` | Called when a segment is sent to verification – hand it to your review process here |
| `onCopySegment` | `(segment: TranscriptSegment, text: string) => void` | Called when a segment is copied, with the text that went to the clipboard |
| `onSegmentChange` | `(segment: TranscriptSegment \| null) => void` | Called when the segment being played changes – null in a gap between segments |

*Renamed or hidden on the wrapper: `heading`, `query`, `hiddenSpeakers`, `translationMode`, `sent`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Space (waveform) | Plays or pauses |
| K | Plays or pauses |
| J / L | Goes back or forward by `skip` seconds (5 by default) |
| ← / → | Moves to the previous or next segment; in the list, focus moves with it |
| ↑ / ↓ (segments) | Moves to the previous or next segment |
| Home / End (segments) | Moves to the first or last segment |
| Home / End (waveform) | Moves to the start or end of the recording |
| Enter (segments) | Plays from the segment |
| C (segments) | Copies the segment with its timestamp and speaker |
| V (segments) | Sends the segment to verification |
| Enter / Shift+Enter (search) | Moves to the next or previous match |
| Escape (search) | Clears the search |

J, K, L and the arrow keys work anywhere in the component except the search field. Clicking or dragging on the
waveform seeks; clicking a segment plays from it.

### Screen readers

The host is a region named by the heading. The player is a group named "Player": the waveform is a slider named
"Seek" whose value reads as the time, the length and who is speaking ("0:05 of 0:42, Luis Ortega"); the buttons are
"Back 5 seconds", "Play" or "Pause", "Forward 5 seconds" and "Playback speed 1×", with their keys in
`aria-keyshortcuts`. The search field is described by its match count. The view switch and the speaker chips are
toggle buttons (`aria-pressed`) in groups named "Show" and "Speakers"; a chip reads as the name and how many
segments ("Luis Ortega, 4 segments").

The segments are a listbox named "Segments" whose selection follows playback. Each option has `aria-posinset` and
`aria-setsize` (so the count is right while the list is windowed) and reads as the time, the speaker, the text –
each column prefixed with its language when both are shown – and what needs checking (", low confidence 58%,
translation confidence 62%, 3 uncertain words, sent to verification"). A polite status announces the speaker when it changes during playback
("Now speaking: Andrés (supervisor)"), each search step ("Match 1 of 1, 00:33, Luis Ortega"), copies and sends. A
recording that fails to load is announced as an alert with Try again.

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
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 52.6 KB | 14.8 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **63.8 KB** | **18.4 KB** |
| With Lit – the first component on a page | 86.9 KB | 26.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 361 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of peaks replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 2.4 ms | peaks: first render, 361 nodes; update 0.4 ms |

Windowed: 10,000 items of peaks render 361 nodes in 2.4 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`, `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- Timers: `setTimeout`.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give speakers names people recognise (`speakers`) – a role in brackets helps: "Marta (support)". Chips use the
  initials unless you set `short`.
- Name the columns by language with `originalLabel` and `translationLabel`, and say when a translation is machine
  made: "English (machine)".
- Set `threshold` to where your recogniser's scores stop being trustworthy; pass word confidence (`words`) when you
  have it, so reviewers see which words to listen for.
- Write `verifyLabel` as what happens in your process: "Send to verification", "Flag for review".

## Do and don't

### Do

- Supply `peaks` computed once on the server – the component never decodes audio.
- Save each send as it happens (`tc-verify`) and pass `sent` back, so the marks survive a reload.
- Keep the recording and the transcript from the same source and version; timestamps must line up.

### Don't

- Don't hide low-confidence segments from the list – mark them and let reviewers decide.
- Don't present a machine translation without the original beside it where the wording matters.
- Don't autoplay; let the person start the recording.

## Related

- [Verification Queue](verification-queue.md) – Every claim worth checking from a session in one queue – verified, can't verify, incorrect or dismissed, with its source, before anything is exported
- [Voice Mode](voice-mode.md) – A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn
- [Claim Answer](claim-answer.md) – An answer you can check claim by claim – where each came from (a source, the model's knowledge, an inference), how sure it is, and the strongest case against it

## Changelog

- **Event details:** four change events gained a field named after the property they change. The existing fields stay. The docs' controlled examples read these names, which the events lacked; the new Angular type check caught it. - `tc-artifact-panel`'s `tc-selected-change`: `selected`. - `tc-email-draft`'s `tc-recipient-change`: `recipient`. - `tc-reliance-gauge`'s `tc-review-level-change`: `reviewLevel`. - `tc-transcript-review`'s `tc-translation-mode-change`: `translationMode`.
- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
