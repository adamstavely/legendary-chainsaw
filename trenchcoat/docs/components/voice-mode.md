<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Voice Mode

**AI & chat** · New

A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn

- **Element:** `<tc-voice-mode>`
- **Size:** 14.4 KB gzip · 44.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/voice-mode";` |
| React / Next.js | `import { VoiceMode } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/voice-mode";` · tags starting with tc- are custom elements |
| Angular | `import { VoiceMode } from "@adamstavely/trenchcoat/angular/voice-mode";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/voice-mode";` |

## Example

The live example is in the gallery at `#/voice-mode`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The screen for a spoken conversation with the model. The voice orb shows what the assistant is doing – ready,
listening, thinking or speaking – and every turn is captioned as it's spoken, so people can read along, catch what
they missed, or follow without sound. A toolbar holds Mute, Captions, Interrupt and End. The component shows the
conversation; the audio stays with your app, which passes in the state, the turns and the loudness and listens for
the buttons.

Set `orb-variant` to change the orb's face: `sphere`, `ring`, `wave`, `bars`, `blob` or `orbit`.

### When to use

- A hands-free or voice-first conversation with an assistant.
- Anywhere spoken answers need captions for people who can't or don't want to listen.
- Letting people cut the assistant off mid-answer and say something else.

### When not to use

- Typing a message, with dictation as an extra – use [Chat Composer](chat-composer.md).
- Showing that the model is working on a typed request – use [Thinking State](thinking-state.md).
- Dictating into a document – use [Writing Assistant](writing-assistant.md).
- A written answer people read and copy – use [AI Answer](ai-answer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Orb** `.ui-vm__orb` – moves with the conversation: calm when ready, with the voice when listening or speaking
2. **State** `.ui-vm__state` – “Listening”, “Thinking”, “Speaking”, “Ready” or “Muted”
3. **Captions** `.ui-vm__captions` – every turn with who said it; the one still coming in has a caret
4. **Toggles** `.ui-vm__toggles` – Mute and Captions
5. **Interrupt** `.ui-vm__interrupt` – stops the assistant while it thinks or speaks
6. **End** `.ui-vm__end` – ends the conversation

## Looks

Standard is a white card on a gray tray, with the controls on the tray below it and a larger orb. Clean is one white
card with hairline shadows; the controls are its last row and the orb is a little smaller. Both caption the same
way and blink the state dots a few times before they hold still.

## Usage

### HTML

```html
<tc-voice-mode id="voice" name="Atlas" state="listening"></tc-voice-mode>

<script type="module">
  import "@adamstavely/trenchcoat/voice-mode";
  import "@adamstavely/trenchcoat/tokens.css";

  const voice = document.querySelector("#voice");
  voice.turns = [
    { id: "t1", role: "user", text: "What's the weather tomorrow in Lisbon?" },
    { id: "t2", role: "assistant", text: "Sunny, with a high of", partial: true },
  ];
  voice.level = 0.4;
  voice.addEventListener("tc-interrupt", () => console.log("Stop speaking"));
</script>
```

### React / Next.js

```tsx
import { VoiceMode, type VoiceModeState, type VoiceTurn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Conversation({
  state,
  turns,
  stop,
  hangUp,
}: {
  state: VoiceModeState;
  turns: VoiceTurn[];
  stop: () => void;
  hangUp: () => void;
}) {
  return <VoiceMode name="Atlas" state={state} turns={turns} onInterrupt={stop} onEnd={hangUp} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/voice-mode";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";

defineProps<{ turns: TcVoiceMode["turns"]; captions: TcVoiceMode["captions"] }>();
const onMutedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-voice-mode :turns="turns" :captions="captions" @tc-muted-change="onMutedChange"></tc-voice-mode>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { VoiceMode } from "@adamstavely/trenchcoat/angular/voice-mode";
import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";

@Component({
  selector: "app-voice-mode-example",
  imports: [VoiceMode],
  template: `<tc-voice-mode [turns]="turns()" [captions]="captions()" (tc-muted-change)="onMutedChange($event)"></tc-voice-mode>`,
})
export class VoiceModeExample {
  readonly turns = input.required<TcVoiceMode["turns"]>();
  readonly captions = input.required<TcVoiceMode["captions"]>();
  onMutedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/voice-mode";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";

  let { turns, captions }: { turns: TcVoiceMode["turns"]; captions: TcVoiceMode["captions"] } = $props();
  let el: TcVoiceMode;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-muted-change", on);
    return () => el.removeEventListener("tc-muted-change", on);
  });
</script>

<tc-voice-mode bind:this={el} {turns} {captions}></tc-voice-mode>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `state` | `state` | `VoiceModeState` | `"idle"` | What the assistant is doing: idle · listening · thinking · speaking |
| `turns` | – | `VoiceTurn[]` | `[]` | The conversation so far, oldest first. A turn still coming in has `partial` set |
| `level` | `level` | `number \| undefined` | `undefined` | Input or output loudness from 0 to 1, for the orb – unset, the orb fakes a natural level |
| `muted` | `muted` | `boolean` | `false` | The microphone is muted. Changed by the element unless a tc-muted-change listener calls preventDefault() |
| `captions` | – | `boolean` | `true` | The captions are shown. Changed by the element unless a tc-captions-change listener calls preventDefault() |
| `orbVariant` | `orb-variant` | `VoiceOrbVariant` | `"sphere"` | The orb's face: sphere, ring, wave, bars, blob or orbit |
| `heading` | `heading` | `string` | `""` | A title over the orb – unset, there's none |
| `name` | `name` | `string` | `"Assistant"` | The assistant's name on its turns and in what screen readers hear |
| `userName` | `user-name` | `string` | `"You"` | The person's name on their turns |
| `placeholder` | `placeholder` | `string` | `"Start talking – your words show up here."` | Shown while there are no turns yet |
| `labels` | – | `VoiceModeLabels` | `{}` | The line under the orb, per state and while muted |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-muted-change` | – | Yes | Mute was switched (`{ muted: boolean }`); cancelable – prevent it to keep `muted` (controlled use) |
| `tc-captions-change` | – | Yes | Captions were shown or hidden (`{ captions: boolean }`); cancelable |
| `tc-interrupt` | – | No | Interrupt was pressed (or Esc) while the assistant thinks or speaks; detail: null |
| `tc-end` | – | No | End was pressed; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-voice-mode-blink` | `var(--tc-duration-reveal-slow)` | both |
| `--tc-voice-orb-accent` | `var(--tc-accent)` | both |

#### Design tokens it reads (72)

`--tc-accent`, `--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-ease-emphasized`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `turns` | `el.turns = …;` | `<… turns={…} />` | `<tc-voice-mode :turns="…">` | `<tc-voice-mode [turns]="…">` | `<tc-voice-mode {turns}>` |
| `captions` | `el.captions = …;` | `<… captions={…} />` | `<tc-voice-mode :captions="…">` | `<tc-voice-mode [captions]="…">` | `<tc-voice-mode {captions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-voice-mode :labels="…">` | `<tc-voice-mode [labels]="…">` | `<tc-voice-mode {labels}>` |

*Also attributes: `state`, `level`, `muted`, `orb-variant`, `heading`, `name`, `user-name`, `placeholder` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-muted-change` | Yes | `el.addEventListener("tc-muted-change", (e) => …)` | `onMutedChange={…}` | `@tc-muted-change="…"` | `(tc-muted-change)="…($event)"` | `el.addEventListener("tc-muted-change", …)` |
| `tc-captions-change` | Yes | `el.addEventListener("tc-captions-change", (e) => …)` | `onCaptionsChange={…}` | `@tc-captions-change="…"` | `(tc-captions-change)="…($event)"` | `el.addEventListener("tc-captions-change", …)` |
| `tc-interrupt` | No | `el.addEventListener("tc-interrupt", (e) => …)` | `onInterrupt={…}` | `@tc-interrupt="…"` | `(tc-interrupt)="…($event)"` | `el.addEventListener("tc-interrupt", …)` |
| `tc-end` | No | `el.addEventListener("tc-end", (e) => …)` | `onEnd={…}` | `@tc-end="…"` | `(tc-end)="…($event)"` | `el.addEventListener("tc-end", …)` |

### Controlled

The element changes `muted` and `captions` itself unless a listener calls `preventDefault()` on `tc-muted-change` or `tc-captions-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-voice-mode id="voice-mode"></tc-voice-mode>

<script type="module">
  import "@adamstavely/trenchcoat/voice-mode";

  const el = document.querySelector("#voice-mode");
  el.addEventListener("tc-muted-change", (e) => {
    e.preventDefault(); // the element keeps its muted…
    if (allowed(e.detail.muted)) el.muted = e.detail.muted; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { VoiceMode } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof VoiceMode>;
type Props = Omit<Own, "muted" | "onMutedChange"> & { initial: NonNullable<Own["muted"]> };

// Controlled: passing muted makes the wrapper prevent the element's own change; the app sets it
export function ControlledVoiceMode({ initial, ...props }: Props) {
  const [muted, setMuted] = useState<Own["muted"]>(initial);
  return <VoiceMode {...props} muted={muted} onMutedChange={(next) => setMuted(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/voice-mode";
import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";

const props = defineProps<{ initial: TcVoiceMode["muted"] }>();
const muted = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onMutedChange = (e: CustomEvent<{ muted: TcVoiceMode["muted"] }>) => {
  e.preventDefault();
  muted.value = e.detail.muted;
};
</script>

<template>
  <tc-voice-mode :muted="muted" @tc-muted-change="onMutedChange"></tc-voice-mode>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { VoiceMode } from "@adamstavely/trenchcoat/angular/voice-mode";
import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";

@Component({
  selector: "app-controlled-voice-mode",
  imports: [VoiceMode],
  template: `<tc-voice-mode [muted]="muted()" (tc-muted-change)="onMutedChange($event)"></tc-voice-mode>`,
})
export class ControlledVoiceMode {
  readonly initial = input.required<TcVoiceMode["muted"]>();
  readonly muted = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onMutedChange(e: CustomEvent<{ muted: TcVoiceMode["muted"] }>) {
    e.preventDefault();
    this.muted.set(e.detail.muted);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/voice-mode";
  import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";

  let { initial }: { initial: TcVoiceMode["muted"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let muted = $derived(initial);
  let el: TcVoiceMode;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      muted = (e as CustomEvent<{ muted: TcVoiceMode["muted"] }>).detail.muted;
    };
    el.addEventListener("tc-muted-change", on);
    return () => el.removeEventListener("tc-muted-change", on);
  });
</script>

<tc-voice-mode bind:this={el} {muted}></tc-voice-mode>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-voice-mode")` returns a `TcVoiceMode` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";`
- **React / Next.js:** Props: `import type { VoiceModeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof VoiceMode>`. The element class, for refs: `import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcVoiceMode["turns"]` with `import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";`
- **Angular:** The directive types the template: `[turns]` takes `TcVoiceMode["turns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcVoiceMode } from "@adamstavely/trenchcoat/voice-mode";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | A title over the orb |
| `muted` | `boolean` | The microphone is muted (controlled when defined) |
| `defaultMuted` | `boolean` | Whether the microphone starts muted, when `muted` isn't set |
| `onMutedChange` | `(muted: boolean) => void` | Called when Mute is pressed, with the new muted state |
| `captions` | `boolean` | The captions are shown (controlled when defined) |
| `defaultCaptions` | `boolean` | Whether the captions start shown, when `captions` isn't set – true by default |
| `onCaptionsChange` | `(captions: boolean) => void` | Called when Captions is pressed, with whether they are now shown |
| `onInterrupt` | `() => void` | Interrupt was pressed (or Esc) while the assistant thinks or speaks |
| `onEnd` | `() => void` | End was pressed |

*Renamed or hidden on the wrapper: `muted`, `captions`, `title`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the captions (to scroll them) and then into the toolbar – one stop for all four buttons |
| ← / → | In the toolbar: moves to the previous or next button, wrapping round |
| Home / End | In the toolbar: moves to the first or last button |
| Enter / Space | Presses the focused button |
| Escape | Anywhere in the component: interrupts while the assistant thinks or speaks |

### Screen readers

The controls are a `toolbar` named “Voice controls”. Mute and Captions are toggle buttons with `aria-pressed`;
Interrupt carries `aria-keyshortcuts="Escape"` and is `aria-disabled` unless the assistant is thinking or speaking.
The captions are a focusable region named “Captions” – not a live region. Instead, a polite status region reads each
turn once it's finished, with who said it – “Atlas: The forecast for tomorrow is…” – never word by word while it
streams in. The orb is hidden from assistive technology.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | voice-orb, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, voice-orb, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | internal/voice-orb-painters | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, voice-orb, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | voice-orb, internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.3 KB | 6.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/voice-orb-painters` · Shared Trenchcoat code | 3.7 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [voice-orb](../illustrations/voice-orb.md) · Element it renders | 11.8 KB | – |
| **Added to a page that already has Lit** | **44.7 KB** | **14.5 KB** |
| With Lit – the first component on a page | 66.5 KB | 21.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 34 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of turns replaced |
| First on the page | 26 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.7 ms | turns: first render, 328 nodes; update 0.2 ms |
| 1,000 items | 40 ms | turns: first render, 3,028 nodes; update 1.6 ms |

1,000 items of turns: 40 ms, 3,028 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **60 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (voice-orb).
- No timers.
- 2 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `IntersectionObserver` (voice-orb), `MutationObserver` (voice-orb), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Listens on the page: `document visibilitychange` (voice-orb).
- Reads the clock: `performance.now()` (voice-orb).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Set `name` to the assistant's name; it labels its turns and starts what screen readers hear.
- Keep `placeholder` to one line that invites people to speak: “Start talking – your words show up here.”
- Override `labels` only to match your product's voice – one word per state works best.
- Pass turns as they're recognised, with `partial: true` until each is final.

## Do and don't

### Do

- Pass `level` from the real microphone or speech output, so the orb moves with the voice.
- Stop the audio in your `tc-interrupt` handler and set `state` to `listening` – the component only reports the
  press.
- Keep captions on by default; people who turn them off can.

### Don't

- Don't announce partial turns yourself – the component already reads each finished turn once.
- Don't leave `state` on `speaking` after the audio has stopped – Interrupt and Escape stay active.
- Don't use End to mean “pause” – it fires `tc-end` and should close the conversation.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Thinking State](thinking-state.md) – AI working panel with a live timer, searched sources and thinking steps that appear one by one
- [Writing Assistant](writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups

## Changelog

- `tc-voice-mode` – a voice conversation: `tc-voice-orb` for the state, live captions that announce finished turns once, and Mute / Captions / Interrupt / End in a toolbar; Esc interrupts. The audio stays the app's.
