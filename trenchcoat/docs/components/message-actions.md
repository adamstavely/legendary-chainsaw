<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Message Actions

**AI & chat**

The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer

- **Element:** `<tc-message-actions>`, `<tc-message-text>`
- **Size:** 14.2 KB gzip · 54.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/message-actions";` |
| React / Next.js | `import { MessageActions, MessageText } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/message-actions";` · tags starting with tc- are custom elements |
| Angular | `import { MessageActions, MessageText } from "@adamstavely/trenchcoat/angular/message-actions";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/message-actions";` |

## Example

The live example is in the gallery at `#/message-actions`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The small bar under an AI chat message: Copy, Regenerate, thumbs up and down, and Read aloud. Each action answers in
place – Copy turns into a check, Regenerate spins and unfolds a “‹ 2 / 3 ›” switcher once there's more than one
version, thumbs down opens a short “What went wrong?” row with reasons, Read aloud becomes a small equalizer while it
plays. The bar stays quiet until the message is hovered or focused, so a long conversation doesn't fill with icons.
`tc-message-text` (React: `MessageText`) crossfades the message itself when the version changes.

### When to use

- Under every assistant message in a chat, or under the latest one.
- When people should be able to retry an answer and move between its versions.
- Collecting quick feedback on answers, with a reason when they're bad.

### When not to use

- Editing a past message and switching between the forks that follow – use [Conversation Branches](conversation-branches.md).
- Social reactions with counts – use [Reaction Bar](reaction-bar.md).
- Writing and sending messages – use [Chat Composer](chat-composer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Copy** `.ui-ma__btn--copy` – copies `text`; the icon turns into a check
2. **Regenerate** `.ui-ma__regen` – spins once, or until a new version arrives
3. **Version switcher** `.ui-ma__versions` – “‹ 2 / 3 ›”, next to Regenerate from the second version on
4. **Bad response** `.ui-ma__btn--down` – thumbs down, beside thumbs up; opens the “What went wrong?” row below
5. **Read aloud** `.ui-ma__btn--speak` – becomes a small equalizer while it plays

## Looks

Standard uses 30 px icon buttons with full-size line icons, and the feedback row is a small card with gray reason
chips. Clean uses ghost icon buttons with thin or solid 16 px glyphs; a pressed action takes the selected-tab look,
the reasons are tab-style buttons and Send is the dark chip. In both, the icons sit a step lighter until the
message is hovered.

## Usage

### HTML

```html
<div data-ui-message>
  <tc-message-text id="answer"></tc-message-text>
  <tc-message-actions id="actions"></tc-message-actions>
</div>

<script type="module">
  import "@adamstavely/trenchcoat/message-actions";
  import "@adamstavely/trenchcoat/tokens.css";

  const versions = ["Wrap the filter in useMemo.", "Memoize the list and debounce the input."];
  const answer = document.querySelector("#answer");
  const actions = document.querySelector("#actions");
  answer.content = versions[1];
  actions.text = versions[1];
  actions.versions = versions;
  actions.onFeedback = (kind, reason) => fetch("/api/feedback", { method: "POST", body: JSON.stringify({ kind, reason }) });
  actions.addEventListener("tc-version-change", (e) => {
    answer.version = e.detail.version;
    answer.content = actions.text = versions[e.detail.version];
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MessageActions, MessageText } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Answer({ versions, onRegenerate }: { versions: string[]; onRegenerate: () => Promise<void> }) {
  const [version, setVersion] = useState(versions.length - 1);
  return (
    <div data-ui-message="">
      <MessageText version={version}>
        <p>{versions[version]}</p>
      </MessageText>
      <MessageActions
        text={versions[version]}
        versions={versions}
        version={version}
        onVersionChange={setVersion}
        onRegenerate={onRegenerate}
      />
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/message-actions";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";

defineProps<{ actions: TcMessageActions["actions"]; versions: TcMessageActions["versions"] }>();
const onVersionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-message-actions :actions="actions" :versions="versions" @tc-version-change="onVersionChange"></tc-message-actions>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MessageActions } from "@adamstavely/trenchcoat/angular/message-actions";
import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";

@Component({
  selector: "app-message-actions-example",
  imports: [MessageActions],
  template: `<tc-message-actions [actions]="actions()" [versions]="versions()" (tc-version-change)="onVersionChange($event)"></tc-message-actions>`,
})
export class MessageActionsExample {
  readonly actions = input.required<TcMessageActions["actions"]>();
  readonly versions = input.required<TcMessageActions["versions"]>();
  onVersionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/message-actions";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";

  let { actions, versions }: { actions: TcMessageActions["actions"]; versions: TcMessageActions["versions"] } = $props();
  let el: TcMessageActions;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-version-change", on);
    return () => el.removeEventListener("tc-version-change", on);
  });
</script>

<tc-message-actions bind:this={el} {actions} {versions}></tc-message-actions>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

### `<tc-message-actions>`

*The action bar under an AI chat message: copy, regenerate with a version switcher, thumbs with a feedback row, and
read aloud.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `text` | `text` | `string \| undefined` | `undefined` | The message text – copied to the clipboard by Copy and used to time Read aloud |
| `actions` | – | `MessageActionKey[]` | `["copy", "regenerate", "feedback", "speak"]` | Which actions to show, in this order |
| `versions` | – | `number \| string[] \| undefined` | `undefined` | All versions of the message, or just how many there are. From 2 on the version switcher shows |
| `version` | `version` | `number \| undefined` | `undefined` | The shown version (0-based); unset, the bar keeps it, starting at `defaultVersion` and jumping to new versions |
| `defaultVersion` | `default-version` | `number \| undefined` | `undefined` | Starting version while `version` is unset – defaults to the newest |
| `onRegenerate` | – | `((options: { signal: AbortSignal }) => void \| Promise<unknown>) \| undefined` | `undefined` | Called when Regenerate is pressed – add a version and the switcher jumps to it. Return a promise to keep the arrow spinning until it settles; a rejection says "Couldn't regenerate". `signal` aborts when the element is removed |
| `regenerating` | `regenerating` | `boolean` | `false` | Keeps the regenerate arrow spinning while a new version is written |
| `onFeedback` | – | `((kind: FeedbackKind \| null, reason?: string) => void \| Promise<unknown>) \| undefined` | `undefined` | Called with "up" or "down" when a thumb is pressed, null when it is taken back, and "down" with a reason when the feedback row is sent. Sending may return a promise: "Thanks!" shows once it resolves, a rejection lets you send again |
| `feedback` | – | `FeedbackKind \| null \| undefined` | `undefined` | The vote: "up", "down" or null for none. Unset, the bar keeps it, starting at `defaultFeedback` |
| `defaultFeedback` | – | `FeedbackKind \| null` | `null` | The vote to start with while `feedback` is unset |
| `reasons` | – | `string[]` | `["Not accurate", "Too long", "Didn't follow instructions", "Other"]` | Quick reasons in the feedback row. "Other" opens a small text field |
| `ownSpeech` | `own-speech` | `boolean` | `false` | Set when you play the audio yourself (listen to tc-speak): the bar then doesn't read `text` with the browser's speech synthesis. Without it (and without `speaking`) the browser reads `text`; where there is none, reading is simulated (and warns once, unless `demo` is set) |
| `speaking` | `speaking` | `boolean \| undefined` | `undefined` | Controlled playing state, e.g. tied to your speech player |
| `speakDuration` | `speak-duration` | `number \| undefined` | `undefined` | How long an uncontrolled read aloud plays when it isn't the browser speaking, in ms – defaults to an estimate from `text` |
| `demo` | `demo` | `boolean` | `false` | Demo mode: Read aloud is simulated silently where it would be simulated. For galleries and prototypes |
| `quiet` | `quiet` | `boolean` | `true` | Lighter icons until the message is hovered (default true; quiet="false" turns it off). Put data-ui-message on the message wrapper |
| `label` | `label` | `string` | `"Message actions"` | Accessible name of the bar |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-version-change` | – | Yes | A version was picked in the switcher; detail `{ version: number }` (0-based). Cancelable: preventDefault() keeps the shown version (controlled use) |
| `tc-copy` | – | No | `text` is on the clipboard (or Copy was pressed without `text`); detail `{ text?: string }` |
| `tc-feedback` | – | No | A thumb was pressed or taken back, or the feedback row was sent; detail `{ feedback: "up" \| "down" \| null, reason?: string }` |
| `tc-speak` | – | No | Read aloud started or stopped; detail `{ playing: boolean }` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-message-actions-quiet` | `var(--tc-text-muted)` | not set – this fallback applies |

#### Design tokens it reads (76)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-radius`

### `<tc-message-text>`

*The message itself, crossfading when `version` changes: the old content fades out underneath while the new one fades
in, and the block eases to its new height.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `version` | `version` | `string \| number` | `0` | Which version is shown – a change crossfades |
| `content` | – | `Element \| string` | `""` | The message: text, or an element (cloned; changes inside it are followed) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-message-actions-quiet` | `var(--tc-text-muted)` | not set – this fallback applies |

#### Design tokens it reads (76)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-radius`

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
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-message-actions :actions="…">` | `<tc-message-actions [actions]="…">` | `<tc-message-actions {actions}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-message-actions :versions="…">` | `<tc-message-actions [versions]="…">` | `<tc-message-actions {versions}>` |
| `onRegenerate` | `el.onRegenerate = …;` | `<… onRegenerate={…} />` | `<tc-message-actions :onRegenerate="…">` | `<tc-message-actions [onRegenerate]="…">` | `<tc-message-actions {onRegenerate}>` |
| `onFeedback` | `el.onFeedback = …;` | `<… onFeedback={…} />` | `<tc-message-actions :onFeedback="…">` | `<tc-message-actions [onFeedback]="…">` | `<tc-message-actions {onFeedback}>` |
| `feedback` | `el.feedback = …;` | `<… feedback={…} />` | `<tc-message-actions :feedback="…">` | `<tc-message-actions [feedback]="…">` | `<tc-message-actions {feedback}>` |
| `defaultFeedback` | `el.defaultFeedback = …;` | `<… defaultFeedback={…} />` | `<tc-message-actions :defaultFeedback="…">` | `<tc-message-actions [defaultFeedback]="…">` | `<tc-message-actions {defaultFeedback}>` |
| `reasons` | `el.reasons = …;` | `<… reasons={…} />` | `<tc-message-actions :reasons="…">` | `<tc-message-actions [reasons]="…">` | `<tc-message-actions {reasons}>` |

*Also attributes: `text`, `version`, `default-version`, `regenerating`, `own-speech`, `speaking`, `speak-duration`, `demo` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-version-change` | Yes | `el.addEventListener("tc-version-change", (e) => …)` | `onVersionChange={…}` | `@tc-version-change="…"` | `(tc-version-change)="…($event)"` | `el.addEventListener("tc-version-change", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-feedback` | No | `el.addEventListener("tc-feedback", (e) => …)` | `ref.current.addEventListener("tc-feedback", …)` | `@tc-feedback="…"` | `(tc-feedback)="…($event)"` | `el.addEventListener("tc-feedback", …)` |
| `tc-speak` | No | `el.addEventListener("tc-speak", (e) => …)` | `onSpeak={…}` | `@tc-speak="…"` | `(tc-speak)="…($event)"` | `el.addEventListener("tc-speak", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `version` itself unless a listener calls `preventDefault()` on `tc-version-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-message-actions id="message-actions"></tc-message-actions>

<script type="module">
  import "@adamstavely/trenchcoat/message-actions";

  const el = document.querySelector("#message-actions");
  el.addEventListener("tc-version-change", (e) => {
    e.preventDefault(); // the element keeps its version…
    if (allowed(e.detail.version)) el.version = e.detail.version; // …until the app sets it
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
import "@adamstavely/trenchcoat/message-actions";
import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";

const props = defineProps<{ initial: TcMessageActions["version"] }>();
const version = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onVersionChange = (e: CustomEvent<{ version: TcMessageActions["version"] }>) => {
  e.preventDefault();
  version.value = e.detail.version;
};
</script>

<template>
  <tc-message-actions :version="version" @tc-version-change="onVersionChange"></tc-message-actions>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MessageActions } from "@adamstavely/trenchcoat/angular/message-actions";
import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";

@Component({
  selector: "app-controlled-message-actions",
  imports: [MessageActions],
  template: `<tc-message-actions [version]="version()" (tc-version-change)="onVersionChange($event)"></tc-message-actions>`,
})
export class ControlledMessageActions {
  readonly initial = input.required<TcMessageActions["version"]>();
  readonly version = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onVersionChange(e: CustomEvent<{ version: TcMessageActions["version"] }>) {
    e.preventDefault();
    this.version.set(e.detail.version);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/message-actions";
  import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";

  let { initial }: { initial: TcMessageActions["version"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let version = $derived(initial);
  let el: TcMessageActions;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      version = (e as CustomEvent<{ version: TcMessageActions["version"] }>).detail.version;
    };
    el.addEventListener("tc-version-change", on);
    return () => el.removeEventListener("tc-version-change", on);
  });
</script>

<tc-message-actions bind:this={el} {version}></tc-message-actions>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-message-actions")` returns a `TcMessageActions` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";`
- **React / Next.js:** Props: `import type { MessageActionsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MessageActions>`. The element class, for refs: `import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMessageActions["actions"]` with `import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";`
- **Angular:** The directive types the template: `[actions]` takes `TcMessageActions["actions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMessageActions } from "@adamstavely/trenchcoat/message-actions";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

#### MessageActions

| Prop | Type | Description |
| --- | --- | --- |
| `onVersionChange` | `(index: number) => void` | Called with the version index picked in the switcher |
| `onCopy` | `(text?: string) => void` | Called once `text` is on the clipboard (or right away when there's no `text`). "Copied" shows only after a successful write |
| `onSpeak` | `(playing: boolean) => void` | Called with true when Read aloud starts and false when it stops – play your audio here. Without it (and without `speaking`) the browser's speech synthesis reads `text` |

*Renamed or hidden on the wrapper: `ownSpeech`*

#### MessageText

| Prop | Type | Description |
| --- | --- | --- |
| `version` | `string \| number` | Which version is shown – a change crossfades to the new children |
| `children` | `React.ReactNode` | The message: text or any React content |

*Renamed or hidden on the wrapper: `content`, `children`, `version`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the actions, the version switcher and the feedback row |
| Enter / Space | Presses the focused action, reason or Send |
| Escape | In the feedback row: closes it and returns focus to Bad response; elsewhere in the bar: hides the tooltip |
| Enter (in the “Other” field) | Sends the feedback |

### Screen readers

The bar is a group named “Message actions” (`label`). The buttons are named for what they do: “Copy message” (then
“Copied”), “Regenerate response” (`aria-busy` while a new version is written), “Good response” and “Bad response”
(toggle buttons with `aria-pressed`; Bad response also has `aria-expanded` for the feedback row), and “Read aloud” or
“Stop reading”. The switcher is a group named “Versions” with “Previous version”, “Version 2 of 3” and “Next
version”. The feedback row is a group named “What went wrong?”, with toggle buttons for the reasons and “Close
feedback”. A polite live region says what happened: “Copied”, “Regenerating”, “Version 3 of 3”, “Marked as bad
response. Tell us what went wrong below”, “Thanks for the feedback”, “Reading aloud”, “Finished reading” – and the
failures, such as “Couldn't copy” or “Couldn't regenerate”.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 46.9 KB | 11.9 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **54.7 KB** | **14.2 KB** |
| With Lit – the first component on a page | 76.6 KB | 21.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.1 ms** | the gallery demo's data, 87 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of actions replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 21 ms | actions: first render, 1,671 nodes; update 1.8 ms |
| 1,000 items | 106 ms | actions: first render, 16,521 nodes; update 6.7 ms |

1,000 items of actions: 106 ms. It renders every item, so a first render passes 50 ms (a long task) at about 470 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep `reasons` to three or four short phrases about the answer, not the person: “Not accurate”, “Too long”.
- Keep “Other” last – it opens a field for people's own words.
- Name the bar for its message when there are several on screen: `label="Actions for answer 3"`.

## Do and don't

### Do

- Put `data-ui-message` on the message's wrapper so the bar lights up when the message is hovered.
- Return a promise from `onRegenerate` and `onFeedback` so the bar can show progress, success and failure.
- Pair the bar with `tc-message-text` so the message crossfades when people switch versions.

### Don't

- Don't show actions you haven't wired up – leave them out of `actions`.
- Don't rely on the simulated Read aloud in production: listen for `tc-speak` (React: `onSpeak`) or let the browser
  read `text`; set `demo` only in galleries and prototypes.
- Don't ask for a reason after every thumbs up – the bar only asks after thumbs down.

## Related

- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups
- [Conversation Branches](conversation-branches.md) – Edit a past message and the conversation forks – a 2 / 3 switcher on the edited message, and each branch's replies below it
- [Reaction Bar](reaction-bar.md) – Like, comment, repost and share in one pill – icons pop and fill, counts roll in digit by digit
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane

## Changelog

- `tc-conversation-branches` – edit a past message to fork the conversation; a 2 / 3 switcher on the edited message, each branch's replies (with `tc-message-actions`) below, and `tc-edit` answered with the new replies or a promise of them.
