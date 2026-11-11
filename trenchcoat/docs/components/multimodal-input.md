<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Multimodal input

**AI configuration** · New

Attach mixed media with local previews, upload state, format limits, and token estimates.

- **Element:** `<tc-multimodal-input>`
- **Size:** 11.5 KB gzip · 36.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/multimodal-input";` |
| React / Next.js | `import { MultimodalInput } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/multimodal-input";` · tags starting with tc- are custom elements |
| Angular | `import { MultimodalInput } from "@adamstavely/trenchcoat/angular/multimodal-input";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/multimodal-input";` |

## Example

The live example is in the gallery at `#/multimodal-input`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A message box that takes images, recordings, videos and documents along with the text. Files come in through the clip
button, by dropping them anywhere on the box, or by pasting them into the message. Each becomes a tile with a preview –
an image's thumbnail, a recording's or a video's length, a document's page count – its upload progress, and the token
estimate the app supplies; the box adds the estimates up against a budget. Files of a format it doesn't take, or over
the size for their kind, are turned away with the reason. The element uploads nothing: it hands the app the files and
shows what the app reports back.

### When to use

- A chat or prompt box where people attach mixed media for the model to read.
- Anywhere the model's context is limited and people should see what their attachments cost before sending.
- Forms that send a question with evidence – a photo, a recording, an invoice – to an assistant.

### When not to use

- A plain text chat box with a model picker and voice input – use [Chat Composer](chat-composer.md).
- Uploading files to keep, with no message – use [Dropzone](dropzone.md).
- Showing what's already in the model's context – use [Context Tray](context-tray.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Box** `.ui-mmi__box` – the drop target holding the tiles, the message and the tools
2. **Tile** `.ui-mmi__tile` – one attachment: preview, name, state or estimate, Retry and Remove
3. **Turned away** `.ui-mmi__rejected` – the files that weren't attached, and why
4. **Message** `.ui-mmi__message` – the text, growing with what's written
5. **Totals** `.ui-mmi__totals` – the count, the token estimate against the budget, and why Send waits

## Looks

Standard is a white box on a gray tray, with the totals on the tray below it, gray tiles and an ink Send button.
Clean is one white box with hairline-outlined tiles, thinner icons, the totals between the clip and Send, and a smaller
Send. Kind tiles are tinted per kind in both; a failed tile turns red. In a narrow container the tiles stack one per row.

## Usage

### HTML

```html
<tc-multimodal-input id="ask" budget="64000"></tc-multimodal-input>

<script type="module">
  import "@adamstavely/trenchcoat/multimodal-input";
  import "@adamstavely/trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.accept = ["image/png", "image/jpeg", "audio/*", ".pdf"];
  ask.addEventListener("tc-value-change", (e) => {
    if (e.detail.change.type === "add") for (const { attachment, file } of e.detail.change.files) console.log("upload", attachment.id, file);
  });
  ask.addEventListener("tc-send", (e) => console.log(e.detail.text, e.detail.attachments));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MultimodalInput, type MultimodalAttachment } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Ask() {
  const [attachments, setAttachments] = useState<MultimodalAttachment[]>([]);
  return (
    <MultimodalInput
      value={attachments}
      onChange={(next, change) => {
        setAttachments(next);
        if (change.type === "add") change.files.forEach(({ attachment }) => console.log("upload", attachment.name));
      }}
      accept={["image/*", "audio/*", ".pdf"]}
      budget={64000}
      onSend={(text, files) => console.log(text, files.length)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/multimodal-input";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";

defineProps<{ value: TcMultimodalInput["value"]; accept: TcMultimodalInput["accept"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-multimodal-input :value="value" :accept="accept" @tc-value-change="onValueChange"></tc-multimodal-input>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MultimodalInput } from "@adamstavely/trenchcoat/angular/multimodal-input";
import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";

@Component({
  selector: "app-multimodal-input-example",
  imports: [MultimodalInput],
  template: `<tc-multimodal-input [value]="value()" [accept]="accept()" (tc-value-change)="onValueChange($event)"></tc-multimodal-input>`,
})
export class MultimodalInputExample {
  readonly value = input.required<TcMultimodalInput["value"]>();
  readonly accept = input.required<TcMultimodalInput["accept"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/multimodal-input";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";

  let { value, accept }: { value: TcMultimodalInput["value"]; accept: TcMultimodalInput["accept"] } = $props();
  let el: TcMultimodalInput;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-multimodal-input bind:this={el} {value} {accept}></tc-multimodal-input>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `MultimodalAttachment[]` | `[]` | The attachments. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `text` | `text` | `string` | `""` | The message. Changed by the user unless a tc-text-change listener calls preventDefault() |
| `placeholder` | `placeholder` | `string` | `"Write a message, or drop files here"` | The message's placeholder |
| `label` | `label` | `string` | `"Message"` | Names the message box for screen readers |
| `accept` | – | `string[] \| undefined` | `undefined` | What it accepts: extensions (".pdf"), MIME types ("image/png") or families ("audio/*"); unset accepts any file |
| `maxSize` | `max-size` | `` | – | The largest file, in bytes, for any kind without its own limit |
| `limits` | – | `Partial<Record<MultimodalKind, number>>` | `{}` | The largest file per kind, in bytes – { video: 200 * 1024 * 1024 } |
| `maxFiles` | `max-files` | `number` | `10` | How many attachments fit |
| `budget` | `budget` | `number \| undefined` | `undefined` | The token budget for the attachments; over it, Send waits. Unset shows the total alone |
| `sendLabel` | `send-label` | `string` | `"Send"` | The Send button's name |
| `disabled` | `disabled` | `boolean` | `false` | Turns the box off |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The attachments changed ({ value, change }: MultimodalValueChange – change is { type: "add", files } with each new File, { type: "remove", attachment } or { type: "clear" } after a send); cancelable – prevent it to control `value` |
| `tc-text-change` | – | Yes | The message was edited ({ text }: MultimodalTextChange); cancelable – prevent it to control `text` |
| `tc-send` | – | Yes | Send was pressed, or Enter in the message ({ text, attachments }: MultimodalSend); cancelable – prevented, the box keeps its text and attachments |
| `tc-retry` | – | No | Retry was pressed on an attachment that failed ({ attachment, file }: MultimodalRetry – `file` when it was added here) |
| `tc-reject` | – | No | Files were turned away ({ rejections }: MultimodalReject) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `addFiles(files: Iterable<File>)` | `void` | Adds files as if they were dropped: checks each, turns away what doesn't fit, and fires tc-value-change for the rest |

#### Design tokens it reads (79)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-halo`, `--tc-focus-halo-width`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-fill`, `--tc-meter-track`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-color-strong`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `multimodalKind(file: { name: string; type?: string }): MultimodalKind` | What kind of attachment a file is: from its MIME type, else its extension |
| `formatBytes(bytes: number): void` | "840 KB", "2.4 MB" – number and unit joined by a no-break space |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-multimodal-input :value="…">` | `<tc-multimodal-input [value]="…">` | `<tc-multimodal-input {value}>` |
| `accept` | `el.accept = …;` | `<… accept={…} />` | `<tc-multimodal-input :accept="…">` | `<tc-multimodal-input [accept]="…">` | `<tc-multimodal-input {accept}>` |
| `limits` | `el.limits = …;` | `<… limits={…} />` | `<tc-multimodal-input :limits="…">` | `<tc-multimodal-input [limits]="…">` | `<tc-multimodal-input {limits}>` |

*Also attributes: `text`, `placeholder`, `label`, `max-size`, `max-files`, `budget`, `send-label`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-text-change` | Yes | `el.addEventListener("tc-text-change", (e) => …)` | `onTextChange={…}` | `@tc-text-change="…"` | `(tc-text-change)="…($event)"` | `el.addEventListener("tc-text-change", …)` |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |
| `tc-reject` | No | `el.addEventListener("tc-reject", (e) => …)` | `onReject={…}` | `@tc-reject="…"` | `(tc-reject)="…($event)"` | `el.addEventListener("tc-reject", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` and `text` itself unless a listener calls `preventDefault()` on `tc-value-change` or `tc-text-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-multimodal-input id="multimodal-input"></tc-multimodal-input>

<script type="module">
  import "@adamstavely/trenchcoat/multimodal-input";

  const el = document.querySelector("#multimodal-input");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
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
import "@adamstavely/trenchcoat/multimodal-input";
import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";

const props = defineProps<{ initial: TcMultimodalInput["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcMultimodalInput["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-multimodal-input :value="value" @tc-value-change="onValueChange"></tc-multimodal-input>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MultimodalInput } from "@adamstavely/trenchcoat/angular/multimodal-input";
import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";

@Component({
  selector: "app-controlled-multimodal-input",
  imports: [MultimodalInput],
  template: `<tc-multimodal-input [value]="value()" (tc-value-change)="onValueChange($event)"></tc-multimodal-input>`,
})
export class ControlledMultimodalInput {
  readonly initial = input.required<TcMultimodalInput["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcMultimodalInput["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/multimodal-input";
  import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";

  let { initial }: { initial: TcMultimodalInput["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcMultimodalInput;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcMultimodalInput["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-multimodal-input bind:this={el} {value}></tc-multimodal-input>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-multimodal-input :value="value" @tc-value-change="value = $event.detail.value"></tc-multimodal-input>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-multimodal-input [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-multimodal-input>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-multimodal-input bind:this={el} {value}></tc-multimodal-input>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-multimodal-input")` returns a `TcMultimodalInput` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";`
- **React / Next.js:** Props: `import type { MultimodalInputProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MultimodalInput>`. The element class, for refs: `import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMultimodalInput["value"]` with `import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";`
- **Angular:** The directive types the template: `[value]` takes `TcMultimodalInput["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMultimodalInput } from "@adamstavely/trenchcoat/multimodal-input";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `MultimodalAttachment[]` | The attachments – controlled when given |
| `defaultValue` | `MultimodalAttachment[]` | The attachments on mount when `value` isn't controlled |
| `onChange` | `(value: MultimodalAttachment[], change: MultimodalChange) => void` | The attachments changed; `change.files` holds the new File objects to upload |
| `text` | `string` | The message – controlled when given |
| `defaultText` | `string` | The message on mount when `text` isn't controlled |
| `onTextChange` | `(text: string) => void` | The message was edited |
| `onSend` | `(text: string, attachments: MultimodalAttachment[]) => void` | Send was pressed, or Enter in the message; the box then clears unless it's controlled |
| `onRetry` | `(attachment: MultimodalAttachment, file?: File) => void` | Retry was pressed on an attachment that failed; `file` when it was added in this box |
| `onReject` | `(rejections: MultimodalRejection[]) => void` | Files were turned away, with the reasons |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `text`, `onChange`, `addFiles`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the attachments (one stop), the message, Attach files and Send |
| ← / → | In the attachments: moves between the tiles' buttons, wrapping |
| Home / End | In the attachments: the first or last button |
| Delete / Backspace | In the attachments: removes the tile in focus |
| Enter | In the message: sends |
| Shift + Enter | In the message: starts a new line |

Removing a tile moves focus to the next tile's Remove, else the one before, else the message. Dismissing the turned-away
list returns focus to the message. Pasting files into the message attaches them.

### Screen readers

The tiles are a `toolbar` named “Attachments: 5”; each tile is a group named by the file. Remove and Retry are named
“Remove invoice.pdf” and “Retry contract-scan.pdf” and described by the tile's line – “Document, 6 pages. 220 KB · ≈ 3.4k
tokens” or “Document. Didn't upload – the connection dropped”. The message is named by `label` and, while files are
turned away, described by the list of reasons. A status region says what happened: “Attached 3 files”, “IMG_4471.heic
wasn't attached: HEIC files aren't supported – use PNG, JPEG or WEBP”, “Removed note.m4a”, “Sent”. When Send waits, its
tooltip and the totals say why: “Waiting for 2 uploads”, “Retry or remove the file that didn't upload”, “2.1k tokens over
the budget”.

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
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.6 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.6 KB** | **11.5 KB** |
| With Lit – the first component on a page | 59.8 KB | 19.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 14 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of accept replaced |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.7 ms | accept: first render, 14 nodes; update 0.2 ms |
| 1,000 items | 1.2 ms | accept: first render, 14 nodes; update 0.1 ms |

What it renders doesn't grow with accept (tested to 1,000 items).

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

- Pass `accept` as the formats your model really reads; the reasons and the hint are built from it.
- Set `limits` per kind when they differ (videos are larger), or one `maxSize`.
- Write an upload `error` as a short cause – “the connection dropped” – it follows “Didn't upload –”.
- Report `tokens` once you have an estimate; until then the tile says “Estimating tokens”.

## Do and don't

### Do

- Upload from the `add` change: `change.files` holds each new attachment with its File.
- Report progress, failures, `duration`, `pages`, `preview` and `tokens` back through `value`.
- Set `budget` to what the model can take, so people see the cost before Send is blocked.

### Don't

- Don't show a token count you didn't estimate – leave `tokens` unset.
- Don't drop a failed upload silently; keep the tile so Retry is there.
- Don't use it for long transcripts or large datasets – they belong in a source, not a message.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Voice Mode](voice-mode.md) – A spoken conversation with the model – live transcript, listening and speaking states, interrupt, mute and end, with captions for every turn
