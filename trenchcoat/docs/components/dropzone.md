<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Dropzone

**Inputs & controls**

Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry

- **Element:** `<tc-dropzone>`
- **Size:** 15.0 KB gzip · 55.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/dropzone";` |
| React / Next.js | `import { Dropzone } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/dropzone";` · tags starting with tc- are custom elements |
| Angular | `import { Dropzone } from "@adamstavely/trenchcoat/angular/dropzone";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/dropzone";` |

## Example

The live example is in the gallery at `#/dropzone`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An area to drag files onto, or click to choose them, that then shows every file uploading. Each file gets a row
with a coloured type badge, its size, the time left and its own progress bar; files of the wrong type or over the
size limit say why at once, a failed upload can be retried, and any row can be removed – which cancels its upload.
It is a form control: the added files are submitted under `name`, `required` asks for at least one, and a form
reset brings back the first list.

### When to use

- Uploading documents, images or data files as part of a task or a form.
- Batches of files, where people need to see what is still uploading and what failed.
- Anywhere people already have the files open on their desktop and will drag them in.

### When not to use

- Attaching a file to a chat message – use [Chat Composer](chat-composer.md).
- Showing the files and sources already in an agent's context – use [Context Tray](context-tray.md).
- Browsing and comparing generated images – use [Image Grid](image-grid.md).
- A file that is one step of a longer form – put the dropzone in a [Stepper Form](stepper-form.md) step rather than on its own page.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Drop area** `.ui-dz__area` – the button to drop files onto or click to choose them
2. **Hint** `.ui-dz__hint` – the accepted types and the size limit
3. **Row** `.ui-dz__row` – one file: type badge, name, size and time left
4. **Progress bar** `.ui-dz__bar` – how far that file's upload has got
5. **Remove** `.ui-dz__icon-btn` – removes the file and cancels its upload; failed uploads also get Retry
6. **Summary** `.ui-dz__foot` – “Uploading 2 of 4 · 1.2 of 8.1 MB”, then what was uploaded, and Clear

## Looks

Standard sets the dashed drop area and the rows in a card on the gray tray, with the summary in the tray below.
Clean is one white card with hairline shadows: a dashed drop area, quieter rows with small file icons, and the
summary as the card's last row, with a shimmer on “Uploading …”. Both fan out the little documents while files are
dragged over, and the card glides to its new height as rows come and go.

## Usage

### HTML

```html
<form>
  <tc-dropzone id="files" name="files" required></tc-dropzone>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/dropzone";
  import "@adamstavely/trenchcoat/tokens.css";

  const zone = document.querySelector("#files");
  zone.accept = [".pdf", "image/*"];
  zone.maxSize = 10 * 1024 * 1024;
  zone.onUpload = async (file, onProgress, signal) => {
    const res = await fetch("/upload", { method: "POST", body: file, signal });
    if (!res.ok) throw new Error("Upload failed");
    onProgress(1);
  };
  zone.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Dropzone, type UploadItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

async function upload(file: File, onProgress: (p: number) => void, signal: AbortSignal) {
  const res = await fetch("/upload", { method: "POST", body: file, signal });
  if (!res.ok) throw new Error("Upload failed");
  onProgress(1);
}

export function Attachments() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  return <Dropzone name="files" accept={[".pdf", "image/*"]} maxSize={10 * 1024 * 1024} onUpload={upload} value={files} onChange={setFiles} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/dropzone";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";

defineProps<{ accept: TcDropzone["accept"]; value: TcDropzone["value"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-dropzone :accept="accept" :value="value" @tc-value-change="onValueChange"></tc-dropzone>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Dropzone } from "@adamstavely/trenchcoat/angular/dropzone";
import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";

@Component({
  selector: "app-dropzone-example",
  imports: [Dropzone],
  template: `<tc-dropzone [accept]="accept()" [value]="value()" (tc-value-change)="onValueChange($event)"></tc-dropzone>`,
})
export class DropzoneExample {
  readonly accept = input.required<TcDropzone["accept"]>();
  readonly value = input.required<TcDropzone["value"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/dropzone";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";

  let { accept, value }: { accept: TcDropzone["accept"]; value: TcDropzone["value"] } = $props();
  let el: TcDropzone;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-dropzone bind:this={el} {accept} {value}></tc-dropzone>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `accept` | – | `string[] \| undefined` | `undefined` | Allowed types: extensions (".pdf"), MIME types ("application/pdf") or wildcards ("image/*") – any file when unset |
| `maxSize` | `max-size` | `` | – | Largest file in bytes |
| `onUpload` | – | `DropzoneUpload \| undefined` | `undefined` | Uploads a file; simulated when unset (and warns once, unless `demo` is set) |
| `value` | – | `UploadItem[]` | `[]` | The list of files |
| `name` | `name` | `string` | `""` | Name for form submission: the added files (not the rejected ones) are submitted under it |
| `required` | `required` | `boolean` | `false` | A form needs at least one file that isn't rejected |
| `disabled` | `disabled` | `boolean` | `false` | No files can be added, retried or removed |
| `hint` | `hint` | `string \| undefined` | `undefined` | Text under the title – defaults to the accepted types and size |
| `autoplay` | `autoplay` | `boolean` | `false` | Plays a sample drop on its own – nice for previews |
| `demo` | `demo` | `boolean` | `false` | Demo mode: files dropped without onUpload are simulated silently |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The list of files changed (added, progressed, finished, failed, removed); detail `{ value: UploadItem[] }`. Cancelable. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dropzone-area-bg` | `light-dark(#fafafa, #1d1d20)` | standard |
| `--tc-dropzone-badge-font-size` | `6.5px` | standard, clean |
| `--tc-dropzone-area-border-hover` | `light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.26))` | standard, clean |

#### Design tokens it reads (75)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-3xl`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`

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
| `accept` | `el.accept = …;` | `<… accept={…} />` | `<tc-dropzone :accept="…">` | `<tc-dropzone [accept]="…">` | `<tc-dropzone {accept}>` |
| `onUpload` | `el.onUpload = …;` | `<… onUpload={…} />` | `<tc-dropzone :onUpload="…">` | `<tc-dropzone [onUpload]="…">` | `<tc-dropzone {onUpload}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-dropzone :value="…">` | `<tc-dropzone [value]="…">` | `<tc-dropzone {value}>` |

*Also attributes: `max-size`, `name`, `required`, `disabled`, `hint`, `autoplay`, `demo` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-dropzone id="dropzone"></tc-dropzone>

<script type="module">
  import "@adamstavely/trenchcoat/dropzone";

  const el = document.querySelector("#dropzone");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { Dropzone } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Dropzone>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledDropzone({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <Dropzone {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/dropzone";
import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";

const props = defineProps<{ initial: TcDropzone["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcDropzone["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-dropzone :value="value" @tc-value-change="onValueChange"></tc-dropzone>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Dropzone } from "@adamstavely/trenchcoat/angular/dropzone";
import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";

@Component({
  selector: "app-controlled-dropzone",
  imports: [Dropzone],
  template: `<tc-dropzone [value]="value()" (tc-value-change)="onValueChange($event)"></tc-dropzone>`,
})
export class ControlledDropzone {
  readonly initial = input.required<TcDropzone["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcDropzone["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/dropzone";
  import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";

  let { initial }: { initial: TcDropzone["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcDropzone;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcDropzone["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-dropzone bind:this={el} {value}></tc-dropzone>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-dropzone :value="value" @tc-value-change="value = $event.detail.value"></tc-dropzone>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-dropzone [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-dropzone>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-dropzone bind:this={el} {value}></tc-dropzone>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-dropzone")` returns a `TcDropzone` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";`
- **React / Next.js:** Props: `import type { DropzoneProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Dropzone>`. The element class, for refs: `import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDropzone["accept"]` with `import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";`
- **Angular:** The directive types the template: `[accept]` takes `TcDropzone["accept"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDropzone } from "@adamstavely/trenchcoat/dropzone";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `accept` | `string[]` | Allowed types: extensions (".pdf"), MIME types ("application/pdf") or wildcards ("image/*") – any file when left out |
| `maxSize` | `number` | Largest file in bytes |
| `onUpload` | `DropzoneUpload` | Upload a file and report its progress (0–1); throw to mark it as failed. `signal` aborts when the row is removed or the dropzone unmounts – stop the upload then. Simulated when left out (and warns once, unless `demo` is set) |
| `value` | `UploadItem[]` | The list of files. Controlled when defined – pass back what onChange reports (progress included), preload files that are already uploaded, or clear it with []. Otherwise the dropzone keeps its own list |
| `defaultValue` | `UploadItem[]` | Starting list when uncontrolled |
| `onChange` | `(items: UploadItem[]) => void` | Called whenever the list changes |
| `name` | `string` | Name for native form submission: the added files (not the rejected ones) are submitted under it |
| `required` | `boolean` | A native form needs at least one file that isn't rejected |
| `disabled` | `boolean` | No files can be added, retried or removed |
| `hint` | `string` | Text under the title – defaults to the accepted types and size |
| `autoplay` | `boolean` | Plays a sample drop on its own – nice for previews |
| `demo` | `boolean` | Demo mode: files dropped without onUpload are simulated silently. For galleries and prototypes |

*Renamed or hidden on the wrapper: `.pdf`, `application/pdf`, `image/*`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the drop area, then to each row's Retry and Remove buttons, then Clear |
| Enter / Space | On the drop area: opens the file chooser. On a button: retries, removes or clears |

When a row is removed, focus moves to the next row's Remove button (or the one before, or the drop area).

### Screen readers

The drop area is a button named by its text – “Drop files here or browse” (“Tap to choose files” on touch
screens) followed by the hint, “PDF, PNG, JPG and more · up to 25 MB each”, which also describes it. The rows sit in a list labelled “Uploads”. Each upload is a progress bar named “report.pdf upload”
with its percentage, a finished file has an “Uploaded” image, and the row buttons are named “Retry report.pdf” and
“Remove report.pdf”. A status region announces each outcome: “report.pdf uploaded”, “report.pdf: upload failed”,
or why a file was refused (“video.mov: .mov files aren't supported”, “scan.pdf: Too large – max 25 MB”). With
`required` and no usable file, the form's message is “Add at least one file”.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

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
| **This component alone** | 48.1 KB | 12.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **55.8 KB** | **15.1 KB** |
| With Lit – the first component on a page | 78.6 KB | 22.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 30 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of accept replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.8 ms | accept: first render, 30 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | accept: first render, 30 nodes; update 0.2 ms |

What it renders doesn't grow with accept (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 10 React commits (clean), 10 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **0 timer callbacks/s** on screen, **11 timer callbacks/s** scrolled away, **0 timer callbacks/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- Timers: `setInterval, cleared`, `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `performance.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Leave `hint` unset unless there is more to say – the default lists the accepted types and the limit.
- If you write `hint`, keep it to one line and name the types the way people know them: “PDF or Word, up to 10 MB”.
- In `onUpload`, throw an `Error` whose message says what went wrong in a few words (“Connection lost”) – the row
  shows it and the status region reads it out.

## Do and don't

### Do

- Set `accept` and `max-size` so wrong files are refused before they upload, with the reason on the row.
- Pass `onUpload` and stop the upload when its `signal` aborts – that happens when the row is removed.
- Report progress from `onUpload` as it goes, so the bar and the time left are real.

### Don't

- Don't ship without `onUpload`: the uploads are only simulated (set `demo` for previews and galleries).
- Don't use it for a single small file inside a dense form where a drop area takes too much room.
- Don't clear failed rows on your own – people need to see what failed to retry or remove it.

## Related

- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image
- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state

## Changelog

- dropzone reports progress through `onChange` at most once a second (status changes are still reported at once).
