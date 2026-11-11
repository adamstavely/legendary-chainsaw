<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Code Block

**AI & chat** · New

Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it

- **Element:** `<tc-code-block>`
- **Size:** 22.8 KB gzip · 84.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/code-block";` |
| React / Next.js | `import { CodeBlock } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/code-block";` · tags starting with tc- are custom elements |
| Angular | `import { CodeBlock } from "@adamstavely/trenchcoat/angular/code-block";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/code-block";` |

## Example

The live example is in the gallery at `#/code-block`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Code an assistant writes, shown as it streams in, coloured with the theme's tokens. A head names the file and the
language and holds the actions: Copy, Apply when the page can apply the code, and Diff when the file as it is now
is known – Diff shows exactly which lines the code would add and remove before anyone applies it. While the code
is still arriving a caret blinks at the end, the head says “Writing”, and Diff and Apply wait until it settles.
Long code can be capped to a height; the body then scrolls and follows the end unless the reader scrolls up.

### When to use

- Code in an AI answer or chat, especially while it streams.
- A suggested change to a real file, where people should see the diff before they press Apply.
- Commands and snippets people will copy – set `language="bash"` and turn off `lineNumbers`.

### When not to use

- Changes to prose rather than code, accepted word by word – use [Inline Diff](inline-diff.md).
- Output of commands an agent ran, with exit codes and timings – use [Sandbox Log](sandbox-log.md).
- Browsing several files and versions an agent produced – use [Artifact Panel](artifact-panel.md).
- A whole answer with sources, of which code is one part – use [AI Answer](ai-answer.md) and put the code block inside it.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **File** `.ui-cblk__title` – the file name (its folder is cut first when space is short) and the language
2. **Actions** `.ui-cblk__tools` – Diff with its +/− counts, Copy and Apply
3. **Code** `.ui-cblk__scroll` – the coloured lines, with line numbers in a gutter
4. **Line number** `.ui-cblk__no` – the gutter, two columns (old and new) in the diff

## Looks

Standard sets the head on the gray tray and the code on a white card below it. Clean is one white card with a
hairline head row above the code. `bare` drops the tray and card in both, for a code block inside another
component's card – the diff counts then move into the head.

## Usage

### HTML

```html
<tc-code-block id="fix" filename="src/auth/session.ts" language="ts" applyable max-height="340"></tc-code-block>

<script type="module">
  import "@adamstavely/trenchcoat/code-block";
  import "@adamstavely/trenchcoat/tokens.css";

  const block = document.querySelector("#fix");
  block.current = await fetch("/api/files/src/auth/session.ts").then((r) => r.text());
  block.code = 'import { db } from "../db";\n\nexport const TTL_MS = 60 * 60 * 1000;\n';
  block.addEventListener("tc-apply", async (e) => {
    await fetch(`/api/files/${e.detail.filename}`, { method: "PUT", body: e.detail.code });
    block.applied = true;
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { CodeBlock } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SuggestedFix({ code, current, streaming }: { code: string; current: string; streaming: boolean }) {
  const [applied, setApplied] = useState(false);
  return (
    <CodeBlock
      filename="src/auth/session.ts"
      language="ts"
      code={code}
      current={current}
      streaming={streaming}
      applied={applied}
      maxHeight={340}
      onApply={() => setApplied(true)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/code-block";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";

defineProps<{ current: TcCodeBlock["current"] }>();
const onCopy = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-code-block :current="current" @tc-copy="onCopy"></tc-code-block>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CodeBlock } from "@adamstavely/trenchcoat/angular/code-block";
import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";

@Component({
  selector: "app-code-block-example",
  imports: [CodeBlock],
  template: `<tc-code-block [current]="current()" (tc-copy)="onCopy($event)"></tc-code-block>`,
})
export class CodeBlockExample {
  readonly current = input.required<TcCodeBlock["current"]>();
  onCopy(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/code-block";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";

  let { current }: { current: TcCodeBlock["current"] } = $props();
  let el: TcCodeBlock;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-copy", on);
    return () => el.removeEventListener("tc-copy", on);
  });
</script>

<tc-code-block bind:this={el} {current}></tc-code-block>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `code` | `code` | `string` | `""` | The code; it may grow every frame while streaming |
| `language` | `language` | `string` | `""` | Language for the colours: ts, tsx, js, jsx, py, json, html, xml, css, sh/bash, or plain |
| `filename` | `filename` | `string` | `""` | File name shown in the head, e.g. "src/auth/session.ts" |
| `current` | – | `string \| undefined` | `undefined` | The file as it is now. When given, a Diff button shows the changes the code would make |
| `view` | `view` | `CodeBlockView` | `"code"` | "code" or "diff". Changed by the user unless a tc-view-change listener calls preventDefault() |
| `streaming` | `streaming` | `boolean` | `false` | The code is still coming in: a caret blinks at the end, Diff and Apply wait |
| `applyable` | `applyable` | `boolean` | `false` | Show the Apply button (fires tc-apply) |
| `applied` | `applied` | `boolean` | `false` | The code has been applied: Apply turns into a disabled "Applied" |
| `applyLabel` | `apply-label` | `string` | `"Apply"` | Apply button text |
| `appliedLabel` | `applied-label` | `string` | `"Applied"` | Applied state text |
| `lineNumbers` | `line-numbers` | `boolean` | `true` | Line numbers in a gutter |
| `wrap` | `wrap` | `boolean` | `false` | Wrap long lines instead of scrolling sideways |
| `maxHeight` | `max-height` | `number` | `0` | Cap the body's height in px (0: grow with the code); a capped body scrolls and follows the end while streaming |
| `bare` | `bare` | `boolean` | `false` | No tray or card around it – for use inside another component's card |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-copy` | – | No | The code was copied to the clipboard ({ text: string }) |
| `tc-apply` | – | No | Apply was pressed ({ code: string, filename: string, language: string }) |
| `tc-view-change` | – | Yes | Code or Diff was picked ({ view: "code" \| "diff" }); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-code-block-keyword` | `var(--tc-syntax-keyword)` | both |
| `--tc-code-block-string` | `var(--tc-syntax-string)` | both |
| `--tc-code-block-number` | `var(--tc-syntax-number)` | both |
| `--tc-code-block-comment` | `var(--tc-syntax-comment)` | both |
| `--tc-code-block-function` | `var(--tc-syntax-function)` | both |
| `--tc-code-block-type` | `var(--tc-syntax-type)` | both |
| `--tc-code-block-property` | `var(--tc-syntax-property)` | both |
| `--tc-code-block-tag` | `var(--tc-syntax-tag)` | both |
| `--tc-code-block-punctuation` | `var(--tc-syntax-punctuation)` | both |
| `--tc-code-block-text` | `var(--tc-syntax-text)` | both |
| `--tc-code-block-digits` | `2` | not set – this fallback applies |

#### Design tokens it reads (72)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-syntax-comment`, `--tc-syntax-function`, `--tc-syntax-keyword`, `--tc-syntax-number`, `--tc-syntax-property`, `--tc-syntax-punctuation`, `--tc-syntax-string`, `--tc-syntax-tag`, `--tc-syntax-text`, `--tc-syntax-type`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `codeBlockLanguageLabel(language: string): void` | The language's display name: "ts" → "TypeScript"; unknown ones as given, empty → "Text" |
| `codeBlockTokens(code: string, language: unknown): CodeBlockToken[][]` | The code as lines of coloured tokens – what the element renders, for tests and other renderers |
| `codeBlockDiff(before: string, after: string): CodeBlockDiffLine[]` | A line diff of two texts: inline-diff's Myers diff (diffWords) run over one token per distinct line, read back as rows. Within a change, the removed lines come first, then the added ones. |

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
| `current` | `el.current = …;` | `<… current={…} />` | `<tc-code-block :current="…">` | `<tc-code-block [current]="…">` | `<tc-code-block {current}>` |

*Also attributes: `code`, `language`, `filename`, `view`, `streaming`, `applyable`, `applied`, `apply-label` and 5 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-apply` | No | `el.addEventListener("tc-apply", (e) => …)` | `onApply={…}` | `@tc-apply="…"` | `(tc-apply)="…($event)"` | `el.addEventListener("tc-apply", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `onViewChange={…}` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |

### Controlled

The element changes `view` itself unless a listener calls `preventDefault()` on `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-code-block id="code-block"></tc-code-block>

<script type="module">
  import "@adamstavely/trenchcoat/code-block";

  const el = document.querySelector("#code-block");
  el.addEventListener("tc-view-change", (e) => {
    e.preventDefault(); // the element keeps its view…
    if (allowed(e.detail.view)) el.view = e.detail.view; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CodeBlock } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CodeBlock>;
type Props = Omit<Own, "view" | "onViewChange"> & { initial: NonNullable<Own["view"]> };

// Controlled: passing view makes the wrapper prevent the element's own change; the app sets it
export function ControlledCodeBlock({ initial, ...props }: Props) {
  const [view, setView] = useState<Own["view"]>(initial);
  return <CodeBlock {...props} view={view} onViewChange={(next) => setView(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/code-block";
import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";

const props = defineProps<{ initial: TcCodeBlock["view"] }>();
const view = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onViewChange = (e: CustomEvent<{ view: TcCodeBlock["view"] }>) => {
  e.preventDefault();
  view.value = e.detail.view;
};
</script>

<template>
  <tc-code-block :view="view" @tc-view-change="onViewChange"></tc-code-block>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CodeBlock } from "@adamstavely/trenchcoat/angular/code-block";
import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";

@Component({
  selector: "app-controlled-code-block",
  imports: [CodeBlock],
  template: `<tc-code-block [view]="view()" (tc-view-change)="onViewChange($event)"></tc-code-block>`,
})
export class ControlledCodeBlock {
  readonly initial = input.required<TcCodeBlock["view"]>();
  readonly view = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onViewChange(e: CustomEvent<{ view: TcCodeBlock["view"] }>) {
    e.preventDefault();
    this.view.set(e.detail.view);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/code-block";
  import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";

  let { initial }: { initial: TcCodeBlock["view"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let view = $derived(initial);
  let el: TcCodeBlock;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      view = (e as CustomEvent<{ view: TcCodeBlock["view"] }>).detail.view;
    };
    el.addEventListener("tc-view-change", on);
    return () => el.removeEventListener("tc-view-change", on);
  });
</script>

<tc-code-block bind:this={el} {view}></tc-code-block>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-code-block")` returns a `TcCodeBlock` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";`
- **React / Next.js:** Props: `import type { CodeBlockProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CodeBlock>`. The element class, for refs: `import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCodeBlock["current"]` with `import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";`
- **Angular:** The directive types the template: `[current]` takes `TcCodeBlock["current"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCodeBlock } from "@adamstavely/trenchcoat/code-block";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `view` | `CodeBlockView` | "code" or "diff" (controlled) – Diff shows the changes against `current` |
| `defaultView` | `CodeBlockView` | The view to start with when uncontrolled |
| `onViewChange` | `(view: CodeBlockView) => void` | Called with "code" or "diff" when the Diff button is toggled |
| `onCopy` | `(text: string) => void` | Called with the code after Copy put it on the clipboard |
| `onApply` | `(apply: CodeBlockApply) => void` | Shows the Apply button; called with the code, the file name and the language |

*Renamed or hidden on the wrapper: `view`, `applyable`, `onCopy`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

The actions are one tab stop; the arrows move between them.

| Key | What it does |
|---|---|
| Tab | Moves to the actions (the last one used), then to the code |
| → / ↓ | Moves to the next action |
| ← / ↑ | Moves to the previous action |
| Home / End | Moves to the first or last action |
| Enter / Space | Presses the action: toggles Diff, copies, or applies |

Disabled actions – Diff and Apply while streaming, Apply once applied – are skipped. The code area takes focus, so
the browser's own arrow keys scroll long lines and tall code.

### Screen readers

The actions are a `toolbar` named “Code actions”; Diff is a toggle button with `aria-pressed`, and Copy is named
“Copy code”. The code is a focusable `region` named by the file (“src/auth/session.ts”, or “TypeScript code” with
no file name), and “Changes to src/auth/session.ts” in the diff; it's `aria-busy` while streaming. In the diff,
each changed line starts with a hidden “Added:” or “Removed:”, and line numbers and +/− signs are hidden. A polite
status says “Copied”, or “Couldn't copy” if the clipboard refused.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.9 KB | 11.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| **Added to a page that already has Lit** | **84.6 KB** | **22.8 KB** |
| With Lit – the first component on a page | 105.4 KB | 29.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 50 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`, `setTimeout` (inline-diff).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give the file's path from the project root as `filename` (“src/auth/session.ts”) – the folder is cut first when
  there's no room, so the file's own name stays readable.
- Set `language` so the colours are right; unknown languages show as plain text with their name as given.
- Keep `applyLabel` a verb that says where the code goes, if “Apply” isn't clear: “Apply to file”, “Insert”.

## Do and don't

### Do

- Pass `current` whenever the code changes an existing file – the diff is how people check it.
- Set `applied` once your page has applied the code; Apply turns into a disabled “Applied”.
- Cap tall blocks with `maxHeight` inside chat, so one answer doesn't push the conversation away.

### Don't

- Don't set `streaming` off before the last chunk has arrived – Diff and Apply would act on half the code.
- Don't use it for code people are meant to edit – it's for reading, copying and applying.
- Don't turn off line numbers for code people will discuss line by line.

## Related

- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
- [Artifact Panel](artifact-panel.md) – Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download
- [AI Answer](ai-answer.md) – Streamed answer with source cards, citation chips that preview their source, copy, regenerate, feedback and follow-ups

## Changelog

- `tc-code-block` – a streaming code block: a small tokenizer per language (TS/JS, Python, JSON, HTML, CSS, shell) re-highlighting only changed lines, Copy, Apply, and a line diff against `current` with folded unchanged runs. Toolbar keyboard; `tc-view-change`, `tc-copy`, `tc-apply`.
- `tc-artifact-panel` – what a run produced: a list, a preview per kind (Markdown text, code through `tc-code-block`, images, tables from CSV), versions with a diff against the one before, and download (a Blob by default, cancelable).
