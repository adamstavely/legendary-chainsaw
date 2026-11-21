<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Help Video

**Feedback & onboarding** · New

Point-in-time help – a small film-frame icon to put beside a heading, a field label or a toolbar, with a tooltip naming the video and its length and a check once watched; a click opens one short tutorial in a modal player with captions, chapters and Watch again

- **Element:** `<tc-help-video>`
- **Size:** 10.7 KB gzip · 35.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/help-video";` |
| React / Next.js | `import { HelpVideo } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/help-video";` · tags starting with tc- are custom elements |
| Angular | `import { HelpVideo } from "@adamstavely/trenchcoat/angular/help-video";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/help-video";` |

## Example

The live example is in the gallery at `#/help-video`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Point-in-time help: a small film-frame icon that sits beside a heading, a field label or a toolbar, and opens one short tutorial in a modal player. Sprinkle one wherever a feature is easier to show than to explain. Each carries its own video.

The icon is a single film cell with sprocket holes along its top and bottom and a play mark cut through it, drawn in the text colour and sized to the text around it. Pointing at it shows a tooltip with the video's title and length. Once the video has been watched, a small check sits on the icon's bottom corner. When the video changes, set `updated-on` to the date: a small dot sits on the icon's top-right corner for `new-days` days (14 by default), the tooltip and name say Updated, and the player's header says when. Opening the video clears the dot for that person (`tc-update-seen-change`); pass `update-seen` back to keep it cleared. The player has the title, the video with its captions, Transcript and Download transcript, a short description, chapters to jump to and, at the end, Watch again and Done. Transcript opens the words beside the video as timed lines: the line being said is marked as it plays, and a line jumps the video to it. They're read from the captions file unless the page passes its own `transcript`; Download saves them as a text file, or links `transcript-file` when the page has one, such as a PDF. Escape, Close or a click outside shuts it, and focus goes back to the icon.

### When to use

- A feature, field or screen that's quicker to show than to explain: a workflow, a gesture, a setting with consequences.
- Help that belongs where the question comes up, not on a separate help page.
- Short videos – a minute or two each. One icon, one video.

### When not to use

- A sentence or two of explanation – use [Tooltip](tooltip.md).
- A list of tips or a getting-started checklist – use [Tips Panel](tips-panel.md) or [Setup Guide](setup-guide.md).
- A modal that isn't a video – use [Dialog](dialog.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trigger** `.ui-hvd__trigger` – the button, holding `.ui-hvd__mark` with the film cell `.ui-hvd__icon`, `.ui-hvd__seen` once watched, and `.ui-hvd__new` – the Updated dot – after a recent update
2. **Label** `.ui-hvd__label` – words beside the icon, when `label` is set
3. **Tooltip** `.ui-hvd__tip` – the title and length, on hover and keyboard focus, when there's no label
4. **Player** `.ui-hvd__dialog` – `.ui-hvd__bar` with `.ui-hvd__kicker`, the title and `.ui-hvd__close`; `.ui-hvd__screen` with the video; `.ui-hvd__tools` with `.ui-hvd__show` (Transcript) and `.ui-hvd__download`, and `.ui-hvd__reader` with the `.ui-hvd__cue` lines when shown; `.ui-hvd__info` with the description and `.ui-hvd__chapter` buttons; `.ui-hvd__end` with Watch again and Done once it has played through

## Looks

The icon is the same in Standard and Clean: the text colour, a shade quieter (`--tc-hvd-ink`), turning to the full text colour on hover (`--tc-hvd-ink-hover`). With `label` it becomes a small pill. `size` sets it against the text around it – `sm` 1em for labels and toolbars, `md` 1.25em for section headings, `lg` 1.5em for page titles – and `--tc-hvd-size` takes any length. `--tc-hvd-player` sets the player's widest, and `--tc-hvd-dot` the Updated dot's colour (the accent by default).

## Usage

### HTML

```html
<h2>
  Alert queue
  <tc-help-video
    id="queue-help"
    heading="Triage the alert queue"
    duration="125"
    src="/help/queue.mp4"
    captions="/help/queue.vtt"
    poster="/help/queue.jpg"
    updated-on="2026-11-17"
  ></tc-help-video>
</h2>

<script type="module">
  import "@adamstavely/trenchcoat/help-video";
  import "@adamstavely/trenchcoat/tokens.css";

  const help = document.querySelector("#queue-help");
  help.description = "Sort new alerts by risk and take the ones that are yours.";
  help.chapters = [
    { time: 0, title: "Sort by risk" },
    { time: 48, title: "Take an alert" },
  ];
  help.watched = localStorage.getItem("help:queue") === "watched";
  help.addEventListener("tc-watched-change", () => localStorage.setItem("help:queue", "watched"));
  // The dot clears once this person opens the update; key it by the date so the next update shows again
  help.updateSeen = localStorage.getItem("help:queue:update") === help.updatedOn;
  help.addEventListener("tc-update-seen-change", () => localStorage.setItem("help:queue:update", help.updatedOn));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { HelpVideo } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function QueueHeading({ seen, onSeen }: { seen: boolean; onSeen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <h2>
      Alert queue{" "}
      <HelpVideo
        title="Triage the alert queue"
        duration={125}
        src="/help/queue.mp4"
        captions="/help/queue.vtt"
        open={open}
        onOpenChange={setOpen}
        watched={seen}
        onWatchedChange={onSeen}
      />
    </h2>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/help-video";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";

defineProps<{ chapters: TcHelpVideo["chapters"]; transcript: TcHelpVideo["transcript"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-help-video :chapters="chapters" :transcript="transcript" @tc-open-change="onOpenChange"></tc-help-video>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HelpVideo } from "@adamstavely/trenchcoat/angular/help-video";
import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";

@Component({
  selector: "app-help-video-example",
  imports: [HelpVideo],
  template: `<tc-help-video [chapters]="chapters()" [transcript]="transcript()" (tc-open-change)="onOpenChange($event)"></tc-help-video>`,
})
export class HelpVideoExample {
  readonly chapters = input.required<TcHelpVideo["chapters"]>();
  readonly transcript = input.required<TcHelpVideo["transcript"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/help-video";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";

  let { chapters, transcript }: { chapters: TcHelpVideo["chapters"]; transcript: TcHelpVideo["transcript"] } = $props();
  let el: TcHelpVideo;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-help-video bind:this={el} {chapters} {transcript}></tc-help-video>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The video's title – the tooltip, the player's heading and the icon's accessible name |
| `description` | `description` | `string \| undefined` | `undefined` | A line or two about what it shows, under the player |
| `duration` | `duration` | `number \| undefined` | `undefined` | Its length in seconds, shown in the tooltip and the player |
| `src` | `src` | `string \| undefined` | `undefined` | A video file the browser can play |
| `type` | `type` | `string \| undefined` | `undefined` | The file's type, e.g. "video/mp4", when the URL doesn't say |
| `poster` | `poster` | `string \| undefined` | `undefined` | The player's picture before it plays |
| `captions` | `captions` | `string \| undefined` | `undefined` | A WebVTT captions file for `src` |
| `captionsLang` | `captions-lang` | `string` | `"en"` | The captions' language (default "en") |
| `embed` | `embed` | `string \| undefined` | `undefined` | An embed URL from a video host, played in an iframe instead of `src` |
| `chapters` | – | `HelpVideoChapter[]` | `[]` | Points in the video to jump to (with `src`) |
| `label` | `label` | `string` | `""` | Words beside the icon, e.g. "Watch how"; unset, the icon stands alone with a tooltip |
| `size` | `size` | `HelpVideoSize` | `"md"` | The icon's size against the text around it: "sm" (1em), "md" (1.25em, the default) or "lg" (1.5em) |
| `watched` | `watched` | `boolean` | `false` | Whether it has been watched – a check on the icon. Set when a file plays to its end, unless a tc-watched-change listener calls preventDefault() |
| `open` | `open` | `boolean` | `false` | Whether the player is open. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `autoplay` | `autoplay` | `boolean` | `true` | Start playing a file as soon as the player opens |
| `transcript` | – | `HelpVideoCue[] \| undefined` | `undefined` | The transcript's lines, `{ time, text }`. Unset, it's read from the `captions` file when first shown |
| `transcriptFile` | `transcript-file` | `string \| undefined` | `undefined` | A transcript file to download instead of the text one made from the lines, e.g. a PDF |
| `updatedOn` | `updated-on` | `string \| undefined` | `undefined` | When the video last changed, as a date ("2026-11-12"); for `new-days` days after it, a dot on the icon says so |
| `newDays` | `new-days` | `number` | `14` | How many days after `updated-on` the dot shows (default 14) |
| `updateSeen` | `update-seen` | `boolean` | `false` | Whether this person has seen the update – the dot is cleared. Set when the player opens, unless a tc-update-seen-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The time to measure `new-days` from, in milliseconds; unset, the clock's |
| `labels` | – | `Partial<HelpVideoLabels>` | `{}` | Rename any of the words |
| `player` | – | `HTMLVideoElement \| null` | – | The &lt;video> in the open player, when it plays a file |
| `transcriptCues` | – | `HelpVideoCue[] \| undefined` | – | The transcript's lines: the ones given, or the ones read from the captions file |
| `showsUpdate` | – | `boolean` | – | Whether the Updated dot shows: a recent update this person hasn't opened yet |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | The player was opened or closed ({ open }: HelpVideoOpenChange); cancelable – prevented, `open` stays as it was |
| `tc-watched-change` | – | Yes | The video played to its end ({ watched }: HelpVideoWatchedChange); cancelable – prevented, `watched` stays as it was |
| `tc-update-seen-change` | – | Yes | The player was opened while the Updated dot showed ({ updateSeen }: HelpVideoUpdateSeenChange); cancelable – prevented, the dot stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hvd-size` | `1.25em` | both |
| `--tc-hvd-ink` | `var(--tc-text-secondary)` | both |
| `--tc-hvd-ink-hover` | `var(--tc-text-primary)` | both |
| `--tc-hvd-player` | `calc(var(--tc-space-16) * 12)` | both |
| `--tc-hvd-dot` | `var(--tc-accent)` | both |

#### Design tokens it reads (56)

`--tc-accent`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-gray-200`, `--tc-gray-950`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `parseHelpVideoVtt(vtt: string): HelpVideoCue[]` | A WebVTT file's cues as transcript lines: each cue's start and its words, with tags such as &lt;v Name> and &lt;b> removed and the lines of one cue joined. NOTE, STYLE and REGION blocks are skipped. |
| `helpVideoTranscriptText(heading: string, cues: HelpVideoCue[]): void` | A transcript as plain text: the title, then each line with its time |
| `helpVideoTime(seconds: number): void` | m:ss, or h:mm:ss past an hour, from seconds |

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
| `chapters` | `el.chapters = …;` | `<… chapters={…} />` | `<tc-help-video :chapters="…">` | `<tc-help-video [chapters]="…">` | `<tc-help-video {chapters}>` |
| `transcript` | `el.transcript = …;` | `<… transcript={…} />` | `<tc-help-video :transcript="…">` | `<tc-help-video [transcript]="…">` | `<tc-help-video {transcript}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-help-video :labels="…">` | `<tc-help-video [labels]="…">` | `<tc-help-video {labels}>` |

*Also attributes: `heading`, `description`, `duration`, `src`, `type`, `poster`, `captions`, `captions-lang` and 11 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-watched-change` | Yes | `el.addEventListener("tc-watched-change", (e) => …)` | `ref.current.addEventListener("tc-watched-change", …)` | `@tc-watched-change="…"` | `(tc-watched-change)="…($event)"` | `el.addEventListener("tc-watched-change", …)` |
| `tc-update-seen-change` | Yes | `el.addEventListener("tc-update-seen-change", (e) => …)` | `ref.current.addEventListener("tc-update-seen-change", …)` | `@tc-update-seen-change="…"` | `(tc-update-seen-change)="…($event)"` | `el.addEventListener("tc-update-seen-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `watched`, `open` and `updateSeen` itself unless a listener calls `preventDefault()` on `tc-watched-change`, `tc-open-change` or `tc-update-seen-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-help-video id="help-video"></tc-help-video>

<script type="module">
  import "@adamstavely/trenchcoat/help-video";

  const el = document.querySelector("#help-video");
  el.addEventListener("tc-watched-change", (e) => {
    e.preventDefault(); // the element keeps its watched…
    if (allowed(e.detail.watched)) el.watched = e.detail.watched; // …until the app sets it
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
import "@adamstavely/trenchcoat/help-video";
import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";

const props = defineProps<{ initial: TcHelpVideo["watched"] }>();
const watched = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onWatchedChange = (e: CustomEvent<{ watched: TcHelpVideo["watched"] }>) => {
  e.preventDefault();
  watched.value = e.detail.watched;
};
</script>

<template>
  <tc-help-video :watched="watched" @tc-watched-change="onWatchedChange"></tc-help-video>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { HelpVideo } from "@adamstavely/trenchcoat/angular/help-video";
import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";

@Component({
  selector: "app-controlled-help-video",
  imports: [HelpVideo],
  template: `<tc-help-video [watched]="watched()" (tc-watched-change)="onWatchedChange($event)"></tc-help-video>`,
})
export class ControlledHelpVideo {
  readonly initial = input.required<TcHelpVideo["watched"]>();
  readonly watched = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onWatchedChange(e: CustomEvent<{ watched: TcHelpVideo["watched"] }>) {
    e.preventDefault();
    this.watched.set(e.detail.watched);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/help-video";
  import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";

  let { initial }: { initial: TcHelpVideo["watched"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let watched = $derived(initial);
  let el: TcHelpVideo;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      watched = (e as CustomEvent<{ watched: TcHelpVideo["watched"] }>).detail.watched;
    };
    el.addEventListener("tc-watched-change", on);
    return () => el.removeEventListener("tc-watched-change", on);
  });
</script>

<tc-help-video bind:this={el} {watched}></tc-help-video>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-help-video")` returns a `TcHelpVideo` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";`
- **React / Next.js:** Props: `import type { HelpVideoProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HelpVideo>`. The element class, for refs: `import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHelpVideo["chapters"]` with `import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";`
- **Angular:** The directive types the template: `[chapters]` takes `TcHelpVideo["chapters"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHelpVideo } from "@adamstavely/trenchcoat/help-video";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The video's title – the tooltip, the player's heading and the icon's accessible name |
| `open` | `boolean` | Whether the player is open – controlled when given |
| `defaultOpen` | `boolean` | Open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The player was opened or closed |
| `watched` | `boolean` | Whether it has been watched – controlled when given |
| `defaultWatched` | `boolean` | Watched on mount when `watched` isn't controlled |
| `onWatchedChange` | `(watched: boolean) => void` | The video played to its end |
| `updateSeen` | `boolean` | Whether this person has seen the update, clearing the Updated dot – controlled when given |
| `defaultUpdateSeen` | `boolean` | Update seen on mount when `updateSeen` isn't controlled |
| `onUpdateSeenChange` | `(updateSeen: boolean) => void` | The player was opened while the Updated dot showed |

*Renamed or hidden on the wrapper: `heading`, `open`, `watched`, `updateSeen`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move to the icon; its tooltip shows |
| Enter / Space | Open the player; the video takes focus and starts |
| Tab in the player | Move through the video's controls, Transcript, Download, the transcript's lines, the chapters, Watch again, Done and Close – focus stays in the player |
| Enter on a transcript line | Jump the video to that line |
| Escape | Close the player; focus goes back to the icon |

### Screen readers

The icon is a button named "Watch video:" with the title, its length and whether it was watched, and it says it opens a dialog. With a `label`, the name starts with the label's words. While the Updated dot shows, the name ends with "Updated"; the dot itself is hidden from assistive technology. The player is a modal dialog named after the video and described by its description; the rest of the page is inert while it's open. The current chapter is marked with `aria-current`. Transcript says whether it's expanded and which region it controls; the transcript is a region named Transcript, each line a button with its time and words, and the line being said is marked with `aria-current`. If the captions file can't be read, a status line says so. When the video plays to its end, a polite status line says it was watched. The drawing and the tooltip are hidden from assistive technology, because the button's name already says what they show.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-20 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.6 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.8 KB** | **10.7 KB** |
| With Lit – the first component on a page | 55.4 KB | 17.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 21 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of chapters replaced |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.8 ms | chapters: first render, 21 nodes; update 0.0 ms |
| 1,000 items | 0.8 ms | chapters: first render, 21 nodes; update 0.0 ms |

What it renders doesn't grow with chapters (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **92 timer callbacks/s** on screen, **89 timer callbacks/s** scrolled away, **89 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title the video by the task it teaches: "Set a risk threshold", not "Help" or "Video".
- Keep descriptions to a sentence; they show under the player.
- Give `duration` in seconds, and chapters as `{ time, title }` with `time` in seconds.
- Always pass captions (`captions`, a WebVTT file) for a file you host – they're the transcript too. Embeds from a video host bring their own captions; pass `transcript` lines (or a `transcript-file`) so the transcript is there as well.
- Use `label` sparingly – "Watch how" beside a button that people hesitate over.

## Do and don't

### Do

- Put the icon right after the words it explains, on the same line.
- Store `watched` per person and pass it back, so the checks survive a reload.
- Set `updated-on` only for a change worth re-watching – a new step, a moved button – and store `update-seen` per person and per update, so the dot comes back for the next one.
- Set `watched` yourself for an embed – the element can't see when an iframe's video ends.
- Mark speakers in the captions with `<v Name>` if you like – the transcript drops the tags and keeps the words.

### Don't

- Don't put one beside every heading – save them for the places people actually get stuck.
- Don't put it inside a `<label>`: its words would become part of the field's name. Put it beside the label instead.

## Related

- [Tooltip](tooltip.md) – Keyboard, pointer and touch help text
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Dialog](dialog.md) – A native modal with interactive content and restored focus
