<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Inline Diff

**AI & chat** · Also in React

AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo

- **Element:** `<tc-inline-diff>`
- **Size:** 12.8 KB gzip · 51.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/inline-diff";` |
| React / Next.js | `import { InlineDiff } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/inline-diff";` · tags starting with tc- are custom elements |
| Angular | `import { InlineDiff } from "@adamstavely/trenchcoat/angular/inline-diff";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/inline-diff";` |

## Example

The live example is in the gallery at `#/inline-diff`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An AI's edits to a piece of prose, shown in place as one paragraph: removed words struck through on red, new words
underlined on green. People accept or reject each change from a small popover or with a key, or take them all at
once, and undo as they go; a toolbar counts what's left and steps to the previous or next change. When nothing is
pending the toolbar says “All changes reviewed” and the final text is reported. It diffs the original and the
suggestion word by word itself – including a suggestion that is still streaming in – or shows changes you computed.

### When to use

- Reviewing a rewrite of prose – shorter, friendlier, corrected – before it replaces the original.
- Letting people keep some of an AI's edits and not others.
- Edits of a paragraph or a few, where reading the changes in context matters.

### When not to use

- Reviewing an assistant's edits to cells or a document's structure, described in words – use [Comment Thread](comment-thread.md).
- An email the agent wrote from scratch, with nothing to compare – use [Email Draft](email-draft.md).
- Changes to code – use [Code Block](code-block.md).
- Asking for a rewrite in the first place – use [Writing Assistant](writing-assistant.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-df__label` – where the suggestion came from, e.g. “Suggested by AI · Make it shorter”
2. **Toolbar** `.ui-df__bar` – the count, Undo, previous and next, Reject all and Accept all
3. **Change** `.ui-df__chg` – removed and added words together; focus or point at it to review it
4. **Added words** `.ui-df__ins` – what the suggestion puts in, underlined on green
5. **Popover** `.ui-df__pop` – Accept and Reject for the change under the pointer or in focus

## Looks

Standard puts the label on a gray tray above the card and the toolbar at the top of the card. Clean is one white
card with hairline shadows: the label opens the card, the toolbar is its last row, and the popover's buttons sit
without a divider. Both mark changes the same way and use the same keys.

## Usage

### HTML

```html
<tc-inline-diff
  id="diff"
  label="Suggested by AI · Make it shorter"
  original="Our team is very excited to announce a brand new dashboard."
  suggested="We're excited to launch a new dashboard."
></tc-inline-diff>

<script type="module">
  import "@adamstavely/trenchcoat/inline-diff";
  import "@adamstavely/trenchcoat/tokens.css";

  const diff = document.querySelector("#diff");
  diff.addEventListener("tc-done", (e) => console.log("final:", e.detail.text));
</script>
```

### React / Next.js

```tsx
import { useRef } from "react";
import { InlineDiff, type InlineDiffHandle } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Rewrite({ original, suggested, onSave }: { original: string; suggested: string; onSave: (text: string) => void }) {
  const diff = useRef<InlineDiffHandle>(null);
  return (
    <>
      <InlineDiff ref={diff} label="Suggested by AI · Make it shorter" original={original} suggested={suggested} onDone={onSave} />
      <button type="button" onClick={() => diff.current?.reset()}>Start over</button>
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/inline-diff";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";

defineProps<{ changes: TcInlineDiff["changes"]; decisions: TcInlineDiff["decisions"] }>();
const onDecisionsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-inline-diff :changes="changes" :decisions="decisions" @tc-decisions-change="onDecisionsChange"></tc-inline-diff>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { InlineDiff } from "@adamstavely/trenchcoat/angular/inline-diff";
import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";

@Component({
  selector: "app-inline-diff-example",
  imports: [InlineDiff],
  template: `<tc-inline-diff [changes]="changes()" [decisions]="decisions()" (tc-decisions-change)="onDecisionsChange($event)"></tc-inline-diff>`,
})
export class InlineDiffExample {
  readonly changes = input.required<TcInlineDiff["changes"]>();
  readonly decisions = input.required<TcInlineDiff["decisions"]>();
  onDecisionsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/inline-diff";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";

  let { changes, decisions }: { changes: TcInlineDiff["changes"]; decisions: TcInlineDiff["decisions"] } = $props();
  let el: TcInlineDiff;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decisions-change", on);
    return () => el.removeEventListener("tc-decisions-change", on);
  });
</script>

<tc-inline-diff bind:this={el} {changes} {decisions}></tc-inline-diff>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `original` | `original` | `string` | `""` | The text as it is now |
| `suggested` | `suggested` | `string` | `""` | The text the AI suggests |
| `changes` | – | `DiffSegment[] \| undefined` | `undefined` | Pre-computed segments instead of original + suggested |
| `decisions` | – | `InlineDiffDecisions` | `{}` | The verdicts so far. Changed by the user unless a tc-decisions-change listener calls preventDefault(); new text resets them (reported as {}) |
| `label` | `label` | `string` | `""` | Small line above the card (Clean: at the top of the card), e.g. "Suggested by AI · Make it shorter" |
| `fill` | `fill` | `boolean` | `false` | Grow to the container's height: the card fills the rest below the label, the toolbar staying in place |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decisions-change` | – | Yes | A decision, undo or reset, or new text starting over ({ decisions: InlineDiffDecisions }); cancelable |
| `tc-text-change` | – | No | Every decision (and undo), with the text so far ({ text: string }) – pending changes keep the original words |
| `tc-done` | – | No | No change is pending any more ({ text: string }, the final text) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `highlight(index: number \| null)` | `void` | Shows the popover on a change (by its index among the changes) without moving focus; null hides it |
| `accept(index: number)` | `void` | – |
| `reject(index: number)` | `void` | – |
| `acceptAll()` | `void` | – |
| `rejectAll()` | `void` | – |
| `undo()` | `void` | Restores the last decision (or the last "all" batch) |
| `reset()` | `void` | Back to every change pending |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-inline-diff-ins-bg-active` | `light-dark(rgba(26, 154, 82, 0.16), rgba(62, 194, 122, 0.22))` | standard, clean |
| `--tc-inline-diff-del-bg-active` | `light-dark(rgba(229, 72, 77, 0.14), rgba(240, 90, 90, 0.22))` | standard, clean |
| `--tc-inline-diff-strike` | `light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7))` | standard, clean |
| `--tc-inline-diff-popover-fill` | `light-dark(rgba(255, 255, 255, 0.14), rgba(0, 0, 0, 0.08))` | standard |
| `--tc-inline-diff-popover-kbd-text` | `light-dark(rgba(255, 255, 255, 0.55), rgba(0, 0, 0, 0.5))` | standard |
| `--tc-inline-diff-primary-kbd-bg` | `var(--tc-kbd-on-inverse-bg)` | clean |
| `--tc-inline-diff-primary-kbd-text` | `light-dark(rgba(255, 255, 255, 0.66), rgba(28, 28, 30, 0.6))` | clean |

#### Design tokens it reads (82)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-icon-muted`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-xs`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `diffWords(original: string, suggested: string, maxCells: number): DiffSegment[]` | Word-level diff of two texts (Myers' shortest edit script over word and whitespace tokens), grouped into equal runs and changes. `maxCells` caps the work – tokens in the part between the common start and end, times the edits needed; past it the middle becomes one replacement. |

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
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-inline-diff :changes="…">` | `<tc-inline-diff [changes]="…">` | `<tc-inline-diff {changes}>` |
| `decisions` | `el.decisions = …;` | `<… decisions={…} />` | `<tc-inline-diff :decisions="…">` | `<tc-inline-diff [decisions]="…">` | `<tc-inline-diff {decisions}>` |

*Also attributes: `original`, `suggested`, `label`, `fill` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decisions-change` | Yes | `el.addEventListener("tc-decisions-change", (e) => …)` | `onDecisionsChange={…}` | `@tc-decisions-change="…"` | `(tc-decisions-change)="…($event)"` | `el.addEventListener("tc-decisions-change", …)` |
| `tc-text-change` | No | `el.addEventListener("tc-text-change", (e) => …)` | `onChange={…}` | `@tc-text-change="…"` | `(tc-text-change)="…($event)"` | `el.addEventListener("tc-text-change", …)` |
| `tc-done` | No | `el.addEventListener("tc-done", (e) => …)` | `onDone={…}` | `@tc-done="…"` | `(tc-done)="…($event)"` | `el.addEventListener("tc-done", …)` |

### Controlled

The element changes `decisions` itself unless a listener calls `preventDefault()` on `tc-decisions-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-inline-diff id="inline-diff"></tc-inline-diff>

<script type="module">
  import "@adamstavely/trenchcoat/inline-diff";

  const el = document.querySelector("#inline-diff");
  el.addEventListener("tc-decisions-change", (e) => {
    e.preventDefault(); // the element keeps its decisions…
    if (allowed(e.detail.decisions)) el.decisions = e.detail.decisions; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { InlineDiff } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof InlineDiff>;
type Props = Omit<Own, "decisions" | "onDecisionsChange"> & { initial: NonNullable<Own["decisions"]> };

// Controlled: passing decisions makes the wrapper prevent the element's own change; the app sets it
export function ControlledInlineDiff({ initial, ...props }: Props) {
  const [decisions, setDecisions] = useState<Own["decisions"]>(initial);
  return <InlineDiff {...props} decisions={decisions} onDecisionsChange={(next) => setDecisions(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/inline-diff";
import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";

const props = defineProps<{ initial: TcInlineDiff["decisions"] }>();
const decisions = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDecisionsChange = (e: CustomEvent<{ decisions: TcInlineDiff["decisions"] }>) => {
  e.preventDefault();
  decisions.value = e.detail.decisions;
};
</script>

<template>
  <tc-inline-diff :decisions="decisions" @tc-decisions-change="onDecisionsChange"></tc-inline-diff>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { InlineDiff } from "@adamstavely/trenchcoat/angular/inline-diff";
import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";

@Component({
  selector: "app-controlled-inline-diff",
  imports: [InlineDiff],
  template: `<tc-inline-diff [decisions]="decisions()" (tc-decisions-change)="onDecisionsChange($event)"></tc-inline-diff>`,
})
export class ControlledInlineDiff {
  readonly initial = input.required<TcInlineDiff["decisions"]>();
  readonly decisions = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDecisionsChange(e: CustomEvent<{ decisions: TcInlineDiff["decisions"] }>) {
    e.preventDefault();
    this.decisions.set(e.detail.decisions);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/inline-diff";
  import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";

  let { initial }: { initial: TcInlineDiff["decisions"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let decisions = $derived(initial);
  let el: TcInlineDiff;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      decisions = (e as CustomEvent<{ decisions: TcInlineDiff["decisions"] }>).detail.decisions;
    };
    el.addEventListener("tc-decisions-change", on);
    return () => el.removeEventListener("tc-decisions-change", on);
  });
</script>

<tc-inline-diff bind:this={el} {decisions}></tc-inline-diff>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-inline-diff")` returns a `TcInlineDiff` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";`
- **React / Next.js:** Props: `import type { InlineDiffProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof InlineDiff>`. The element class, for refs: `import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcInlineDiff["changes"]` with `import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";`
- **Angular:** The directive types the template: `[changes]` takes `TcInlineDiff["changes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcInlineDiff } from "@adamstavely/trenchcoat/inline-diff";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onChange` | `(text: string) => void` | Called on every decision (and undo) with the text so far – pending changes keep the original words |
| `onDone` | `(text: string) => void` | Called once no change is pending, with the final text |
| `decisions` | `InlineDiffDecisions` | The verdicts so far (controlled). New text resets them: an uncontrolled diff starts over, a controlled one reports `{}` through onDecisionsChange |
| `defaultDecisions` | `InlineDiffDecisions` | The verdicts to start with when uncontrolled |
| `onDecisionsChange` | `(decisions: InlineDiffDecisions) => void` | Every decision, undo and reset, with all verdicts so far |
| `ref` | `React.Ref<InlineDiffHandle>` | The imperative handle (the element implements it) |

*Renamed or hidden on the wrapper: `decisions`, `onChange`, `ref`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves from change to pending change, then on to the toolbar |
| Y / Enter / Space | On a change: accepts it and moves focus to the next pending change (to Undo after the last) |
| N / Backspace / Delete | On a change: rejects it and moves focus on the same way |
| Escape | Hides the popover; focus stays on the change. A popover opened by pointing closes from anywhere |
| ‹ / › buttons | Highlight the previous or next pending change and show its popover, without taking focus (focus follows if it was on a change) |

### Screen readers

Each pending change is a button named by its words and described separately: “Suggestion 2 of 7: replace “brand
new” with “new”. Y, Enter or Space accepts, N rejects.” Decided changes leave the tab order, and the words they
dropped are hidden. A polite status region confirms each decision with what's left – “Accepted: Add “keeps”. 5
suggestions left.”, “Rejected: 3 suggestions. All changes reviewed.”, “Undone. 4 suggestions left.” The toolbar's
icon buttons are named “Undo last decision”, “Previous suggestion” and “Next suggestion”; the popover is a group named
“Review suggestion” whose buttons are for the pointer – the keys do the same from the change.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
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
| **This component alone** | 44.5 KB | 10.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **51.3 KB** | **12.8 KB** |
| With Lit – the first component on a page | 70.8 KB | 19.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.1 ms** | the gallery demo's data, 78 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document keydown`, `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use `label` to say who suggested the change and why: “Suggested by AI · Make it shorter”.
- Pass the whole paragraph as `original`, not a fragment – people judge edits by the sentence around them.
- Keep suggestions to edits; when the meaning changes completely, show the new text on its own.

## Do and don't

### Do

- Use `tc-done` (`onDone`) to save the final text once nothing is pending, and `tc-text-change` for a live preview.
- Set `suggested` as the model streams – the diff stays cheap until the text settles, then runs once in full.
- Call `acceptAll()`, `rejectAll()`, `undo()` and `reset()` on the element from your own controls when you need them.

### Don't

- Don't diff long documents in one element – split them into paragraphs, each with its own diff.
- Don't apply the suggestion before people have reviewed it; wait for `tc-done`.
- Don't keep old `decisions` when the text changes – new text starts the review over.

## Related

- [Comment Thread](comment-thread.md) – One comment with replies – an assistant reports what it did, folds open details and answers @mentions
- [Email Draft](email-draft.md) – Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo
- [Writing Assistant](writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it

## Changelog

- inline-diff: `diffWords` uses Myers' O(ND) diff instead of a capped LCS table. Long texts stay word by word (a 3,000-word text with 150 edits gives 150 changes, where anything over ~1,500 words used to become one replacement), and the work grows with the edits, not the length squared. Its third argument is now a work budget (tokens × edits); past it the middle is still one replacement.
