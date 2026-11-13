<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Copy Page Menu

**Utilities** · New

A docs page's Copy page button, for handing the page to a model – copies it as Markdown, with a menu to view the Markdown in a dialog, copy the link, open the page in a chat assistant with a prompt filled in, or download it as a .md file

- **Element:** `<tc-copy-page-menu>`
- **Size:** 8.8 KB gzip · 26.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/copy-page-menu";` |
| React / Next.js | `import { CopyPageMenu } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/copy-page-menu";` · tags starting with tc- are custom elements |
| Angular | `import { CopyPageMenu } from "@adamstavely/trenchcoat/angular/copy-page-menu";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/copy-page-menu";` |

## Example

The live example is in the gallery at `#/copy-page-menu`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The Copy page button at the top of a docs page, for handing the page to a model. The button copies the page as
Markdown – from `markdown`, or from the async `getMarkdown()` when the page makes it on demand (its answer is kept).
The arrow beside it opens a menu: Copy as Markdown, View as Markdown (a dialog with the text, to read or copy part
of), Copy link, Open in each chat assistant the page lists, and Download .md. An assistant is opened with "Read
&lt;url&gt; and help me with it" in place of `{prompt}` in its URL template. "Copied" shows on the button and is
announced. Each action fires a cancelable event first, so a page can do it its own way.

### When to use

- Docs, references and guides that people paste into a chat with a model.
- Any long page where a clean Markdown copy is better than selecting the rendered text.

### When not to use

- Copying one snippet of code – [Code Block](code-block.md) has its own Copy.
- Sharing a page with people, with access and expiry – use [Share Link Manager](share-link-manager.md).
- A menu of commands across an app – use [Command Menu](command-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Copy** `.ui-cpm__main` – copies the page as Markdown; says "Copied" for a moment
2. **More** `.ui-cpm__more` – the arrow that opens the menu
3. **Menu** `.ui-cpm__menu` – the ways to share the page
4. **Item** `.ui-cpm__item` – one action, with an icon, its name and a short hint
5. **Dialog** `.ui-cpm__dialog` – View as Markdown: the page's title, the text, Copy and Close
6. **Text** `.ui-cpm__text` – the Markdown, scrollable and focusable

## Looks

One look in both Standard and Clean: a split button like the library's small secondary button, and a menu on the
menu tokens. `--tc-cpm-menu-w` sets the menu's width (264px), and `--tc-cpm-dialog-w` and `--tc-cpm-dialog-h` the
dialog's size.

## Usage

### HTML

```html
<tc-copy-page-menu url="https://docs.example.org/records/list" page-title="List records"></tc-copy-page-menu>

<script type="module">
  import "@adamstavely/trenchcoat/copy-page-menu";
  import "@adamstavely/trenchcoat/tokens.css";

  const menu = document.querySelector("tc-copy-page-menu");
  menu.markdown = "# List records\n\n`GET /v1/records`\n\nReturns the records you can read, newest first.\n";
  menu.assistants = [{ id: "assistant", label: "Institute Assistant", urlTemplate: "https://assistant.example.org/new?q={prompt}" }];
  menu.addEventListener("tc-page-copy", (e) => console.log("copied", e.detail.kind));
</script>
```

### React / Next.js

```tsx
import { CopyPageMenu } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PageHeader({ title, url, source }: { title: string; url: string; source: () => Promise<string> }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h1>{title}</h1>
      <CopyPageMenu
        pageTitle={title}
        url={url}
        getMarkdown={source}
        assistants={[{ id: "assistant", label: "Institute Assistant", urlTemplate: "https://assistant.example.org/new?q={prompt}" }]}
        onPageCopy={(kind) => console.log("copied", kind)}
      />
    </header>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/copy-page-menu";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";

defineProps<{ markdown: TcCopyPageMenu["markdown"]; getMarkdown: TcCopyPageMenu["getMarkdown"] }>();
const onPageCopy = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-copy-page-menu :markdown="markdown" :getMarkdown="getMarkdown" @tc-page-copy="onPageCopy"></tc-copy-page-menu>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CopyPageMenu } from "@adamstavely/trenchcoat/angular/copy-page-menu";
import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";

@Component({
  selector: "app-copy-page-menu-example",
  imports: [CopyPageMenu],
  template: `<tc-copy-page-menu [markdown]="markdown()" [getMarkdown]="getMarkdown()" (tc-page-copy)="onPageCopy($event)"></tc-copy-page-menu>`,
})
export class CopyPageMenuExample {
  readonly markdown = input.required<TcCopyPageMenu["markdown"]>();
  readonly getMarkdown = input.required<TcCopyPageMenu["getMarkdown"]>();
  onPageCopy(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/copy-page-menu";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";

  let { markdown, getMarkdown }: { markdown: TcCopyPageMenu["markdown"]; getMarkdown: TcCopyPageMenu["getMarkdown"] } = $props();
  let el: TcCopyPageMenu;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-page-copy", on);
    return () => el.removeEventListener("tc-page-copy", on);
  });
</script>

<tc-copy-page-menu bind:this={el} {markdown} {getMarkdown}></tc-copy-page-menu>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `markdown` | – | `string` | `""` | The page as Markdown; when it's empty, `getMarkdown` is asked |
| `getMarkdown` | – | `(() => Promise<string> \| string) \| undefined` | `undefined` | Makes the page's Markdown on demand (fetched or rendered when first needed); its answer is kept |
| `url` | `url` | `string` | `""` | The page's address, for Copy link and the assistants' prompt; without it those items aren't offered |
| `pageTitle` | `page-title` | `string` | `""` | The page's title, for the download's file name and the dialog |
| `filename` | `filename` | `string` | `""` | The download's file name; defaults to the title in dashes, then .md |
| `assistants` | – | `CopyPageAssistant[]` | `[]` | Chat assistants to open the page in, in order |
| `hideDownload` | `hide-download` | `boolean` | `false` | Hide Download .md |
| `open` | `open` | `boolean` | `false` | The menu is open. Changed by the arrow button unless a tc-open-change listener calls preventDefault() |
| `labels` | – | `Partial<CopyPageLabels>` | `{}` | The words, merged over defaultCopyPageLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-page-copy` | – | Yes | The page's Markdown or link is about to be copied ({ kind, text }: CopyPageCopy); cancelable – prevented, nothing is written to the clipboard |
| `tc-page-view` | – | Yes | View as Markdown was chosen ({ markdown }: CopyPageView); cancelable – prevented, the dialog doesn't open |
| `tc-assistant-open` | – | Yes | An assistant's link was chosen ({ id, href, prompt }: CopyPageAssistantOpen); cancelable – prevented, the link isn't followed |
| `tc-page-download` | – | Yes | Download .md was chosen ({ filename, markdown }: CopyPageDownload); cancelable – prevented, nothing is saved |
| `tc-open-change` | – | Yes | The menu opened or closed ({ open }: CopyPageOpenChange); cancelable – prevented, `open` stays |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `copyMarkdown()` | `void` | Copy the page as Markdown – the main button, or the first menu item |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cpm-menu-w` | `264px` | both |
| `--tc-cpm-dialog-w` | `720px` | both |
| `--tc-cpm-dialog-h` | `70vh` | both |
| `--tc-cpm-icon` | `15px` | both |

#### Design tokens it reads (53)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-md`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `assistantHref(template: string, prompt: string): string \| null` | The assistant's link: its template with the prompt URL-encoded in place of "{prompt}"; null when it isn't a safe http(s) link |
| `markdownFilename(title: string): void` | A file name for the page: the title in lower-case words joined by dashes, then .md |

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
| `markdown` | `el.markdown = …;` | `<… markdown={…} />` | `<tc-copy-page-menu :markdown="…">` | `<tc-copy-page-menu [markdown]="…">` | `<tc-copy-page-menu {markdown}>` |
| `getMarkdown` | `el.getMarkdown = …;` | `<… getMarkdown={…} />` | `<tc-copy-page-menu :getMarkdown="…">` | `<tc-copy-page-menu [getMarkdown]="…">` | `<tc-copy-page-menu {getMarkdown}>` |
| `assistants` | `el.assistants = …;` | `<… assistants={…} />` | `<tc-copy-page-menu :assistants="…">` | `<tc-copy-page-menu [assistants]="…">` | `<tc-copy-page-menu {assistants}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-copy-page-menu :labels="…">` | `<tc-copy-page-menu [labels]="…">` | `<tc-copy-page-menu {labels}>` |

*Also attributes: `url`, `page-title`, `filename`, `hide-download`, `open` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-page-copy` | Yes | `el.addEventListener("tc-page-copy", (e) => …)` | `onPageCopy={…}` | `@tc-page-copy="…"` | `(tc-page-copy)="…($event)"` | `el.addEventListener("tc-page-copy", …)` |
| `tc-page-view` | Yes | `el.addEventListener("tc-page-view", (e) => …)` | `onPageView={…}` | `@tc-page-view="…"` | `(tc-page-view)="…($event)"` | `el.addEventListener("tc-page-view", …)` |
| `tc-assistant-open` | Yes | `el.addEventListener("tc-assistant-open", (e) => …)` | `onAssistantOpen={…}` | `@tc-assistant-open="…"` | `(tc-assistant-open)="…($event)"` | `el.addEventListener("tc-assistant-open", …)` |
| `tc-page-download` | Yes | `el.addEventListener("tc-page-download", (e) => …)` | `onPageDownload={…}` | `@tc-page-download="…"` | `(tc-page-download)="…($event)"` | `el.addEventListener("tc-page-download", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-copy-page-menu id="copy-page-menu"></tc-copy-page-menu>

<script type="module">
  import "@adamstavely/trenchcoat/copy-page-menu";

  const el = document.querySelector("#copy-page-menu");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/copy-page-menu";
import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";

const props = defineProps<{ initial: TcCopyPageMenu["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcCopyPageMenu["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-copy-page-menu :open="open" @tc-open-change="onOpenChange"></tc-copy-page-menu>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CopyPageMenu } from "@adamstavely/trenchcoat/angular/copy-page-menu";
import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";

@Component({
  selector: "app-controlled-copy-page-menu",
  imports: [CopyPageMenu],
  template: `<tc-copy-page-menu [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-copy-page-menu>`,
})
export class ControlledCopyPageMenu {
  readonly initial = input.required<TcCopyPageMenu["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcCopyPageMenu["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/copy-page-menu";
  import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";

  let { initial }: { initial: TcCopyPageMenu["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcCopyPageMenu;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcCopyPageMenu["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-copy-page-menu bind:this={el} {open}></tc-copy-page-menu>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-copy-page-menu")` returns a `TcCopyPageMenu` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";`
- **React / Next.js:** Props: `import type { CopyPageMenuProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CopyPageMenu>`. The element class, for refs: `import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCopyPageMenu["markdown"]` with `import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";`
- **Angular:** The directive types the template: `[markdown]` takes `TcCopyPageMenu["markdown"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCopyPageMenu } from "@adamstavely/trenchcoat/copy-page-menu";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | The menu is open – controlled when given |
| `defaultOpen` | `boolean` | Open at first, when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | Called when the menu opens or closes |
| `onPageCopy` | `(kind: CopyPageCopy["kind"], text: string) => boolean \| void` | The Markdown or the link is about to be copied; return false to copy it your own way |
| `onPageView` | `(markdown: string) => boolean \| void` | View as Markdown was chosen; return false to show it your own way |
| `onAssistantOpen` | `(id: string, href: string) => boolean \| void` | An assistant's link was chosen; return false to open it your own way |
| `onPageDownload` | `(filename: string, markdown: string) => boolean \| void` | Download .md was chosen; return false to save it your own way |

*Renamed or hidden on the wrapper: `open`*

## Accessibility

Follows the WAI-ARIA [Menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Copy page, then the arrow |
| Enter / Space on Copy page | Copies the page as Markdown |
| Enter / Space / ↓ on the arrow | Opens the menu on its first item |
| ↑ on the arrow | Opens the menu on its last item |
| ↓ / ↑ | Next or previous item, wrapping round |
| Home / End | First or last item |
| A letter | The next item that starts with it |
| Enter | Does the item's action and closes the menu |
| Escape | Closes the menu and returns to the arrow |
| Tab in the menu | Closes it and moves on |
| Escape in the dialog | Closes it and returns focus |

### Screen readers

The arrow is a button with `aria-haspopup="menu"` and `aria-expanded`, named "More ways to share this page"; the menu
is a `menu` of `menuitem`s, each named by its words. Assistants are links that open in a new tab. "Copied" is
announced politely, and so is a failure ("Couldn't copy – open View as Markdown and copy the text there"). The
dialog is modal, named by its title, and its text is a focusable region you can read line by line.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |

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
| **This component alone** | 17.7 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.2 KB** | **8.8 KB** |
| With Lit – the first component on a page | 45.8 KB | 15.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 68 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of assistants replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.0 ms | assistants: first render, 558 nodes; update 0.6 ms |
| 1,000 items | 25 ms | assistants: first render, 5,058 nodes; update 3.5 ms |

1,000 items of assistants: 25 ms, 5,058 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give `markdown` the page as written – headings, tables and code fences – not the rendered HTML turned back into
  text.
- Give `url` the page's canonical address, not one with a session or a tracking query.
- Name assistants as people know them, and point `urlTemplate` at a new chat with the prompt filled in.
- Keep `page-title` short: it names the dialog and the download ("list-records.md").

## Do and don't

### Do

- Use `getMarkdown` when the Markdown is costly to make; it's asked once, on first use.
- Handle `tc-page-copy` yourself if your page needs a clipboard of its own (a desktop shell, say).

### Don't

- Don't add an assistant without a `{prompt}` placeholder – it would open an empty chat.
- Don't put page actions (Edit, Report a problem) in this menu – it's for sharing the page's text.

## Related

- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Share Link Manager](share-link-manager.md) – The links that already share something – status in words, expiry, opens and who made them, with Copy, Change expiry and Revoke, which says how many opens it's had
- [API Reference Nav](api-reference-nav.md) – An API reference's side navigation – endpoints grouped by resource, each a link with its method as a badge in a colour and a word, its name or (with the Paths switch) its path, deprecated ones struck through; a filter by name, path or method, the current page in view, and tree keys with type-ahead
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
