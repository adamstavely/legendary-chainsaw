<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Ghost Completion

**AI & chat** · New

Dimmed AI suggestions after the caret as you write – Tab takes them, Ctrl/⌘ + → takes a word, Escape dismisses, and typing the same letters uses them up; asked from the page after typing pauses, aborted when it resumes

- **Element:** `<tc-ghost-completion>`
- **Size:** 7.0 KB gzip · 19.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/ghost-completion";` |
| React / Next.js | `import { GhostCompletion } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/ghost-completion";` · tags starting with tc- are custom elements |
| Angular | `import { GhostCompletion } from "@adamstavely/trenchcoat/angular/ghost-completion";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/ghost-completion";` |

## Example

The live example is in the gallery at `#/ghost-completion`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A text field that offers the rest of what you're writing as dimmed text after the caret. The page supplies the
suggestion – from a `suggest(text, signal)` function asked a moment after typing stops, or by setting `suggestion`
itself. Tab takes all of it, Ctrl/⌘ + → takes its next word, and Escape dismisses it. Typing the same letters the
suggestion shows uses them up instead of asking again; typing anything else drops it and asks for a new one. The
suggestion only shows while the caret is at the end of the text, and a small "Tab to accept" hint shows with the
first one.

### When to use

- Writing long-form text where the next sentence is often predictable: findings, summaries, replies, descriptions.
- When suggestions should stay out of the way – visible, but never inserted without a key press.
- A field where a model can complete the current sentence from what's already written.

### When not to use

- Rewriting text that's already there, change by change – use [Inline Diff](inline-diff.md).
- A conversation with a model about the text – use [Writing Assistant](writing-assistant.md) or [Chat Composer](chat-composer.md).
- Acting on a selection (bold, link, ask) – use [Selection Toolbar](selection-toolbar.md).
- Picking from a list of matches as you type – use [Combobox](combobox.md) or [Mention Picker](mention-picker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Label** `.ui-ghc__label` – the field's visible label
3. **Field** `.ui-ghc__field` – the textarea and its mirror in one cell
4. **Mirror** `.ui-ghc__mirror` – the same text, hidden, so the suggestion lands right after the caret
5. **Suggestion** `.ui-ghc__ghost` – the dimmed text after what's typed
6. **Hint** `.ui-ghc__hint` – "Tab to accept", shown until the first suggestion is taken or dismissed

## Looks

Standard sets the header on a gray tray and the field in a white card below it. Clean is one white card with the
header as its first row. In both the field uses the library's field tokens, and the suggestion is drawn in
`--tc-ghc-ghost` (default `--tc-text-muted`, a colour that passes contrast, never opacity). Under reduced motion the
suggestion appears without a fade; in forced colours it's drawn in `GrayText`.

## Usage

### HTML

```html
<tc-ghost-completion id="finding" heading="Finding 4" label="Finding" value="Access reviews for the payments vendor were"></tc-ghost-completion>

<script type="module">
  import "@adamstavely/trenchcoat/ghost-completion";
  import "@adamstavely/trenchcoat/tokens.css";

  const field = document.querySelector("#finding");
  field.suggest = (text, signal) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(text.endsWith("were") ? " last completed in March." : ""), 300);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(signal.reason);
      });
    });
  field.addEventListener("tc-accept", (e) => console.log("took", e.detail.text));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { GhostCompletion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Finding({ complete }: { complete: (text: string, signal: AbortSignal) => Promise<string> }) {
  const [text, setText] = useState("Access reviews for the payments vendor were");
  return <GhostCompletion title="Finding 4" label="Finding" value={text} onValueChange={setText} suggest={complete} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/ghost-completion";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";

defineProps<{ suggest: TcGhostCompletion["suggest"]; labels: TcGhostCompletion["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-ghost-completion :suggest="suggest" :labels="labels" @tc-value-change="onValueChange"></tc-ghost-completion>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GhostCompletion } from "@adamstavely/trenchcoat/angular/ghost-completion";
import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";

@Component({
  selector: "app-ghost-completion-example",
  imports: [GhostCompletion],
  template: `<tc-ghost-completion [suggest]="suggest()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-ghost-completion>`,
})
export class GhostCompletionExample {
  readonly suggest = input.required<TcGhostCompletion["suggest"]>();
  readonly labels = input.required<TcGhostCompletion["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ghost-completion";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";

  let { suggest, labels }: { suggest: TcGhostCompletion["suggest"]; labels: TcGhostCompletion["labels"] } = $props();
  let el: TcGhostCompletion;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-ghost-completion bind:this={el} {suggest} {labels}></tc-ghost-completion>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Draft"` | The heading |
| `label` | `label` | `string` | `"Message"` | The field's visible label |
| `value` | `value` | `string` | `""` | The text in the field |
| `placeholder` | `placeholder` | `string` | `""` | Shown while the field is empty and there's no suggestion |
| `rows` | `rows` | `number` | `4` | The field's height in lines |
| `suggestion` | `suggestion` | `string` | `""` | A suggestion the page sets itself: the text to show after what's typed. Typing that matches it uses it up |
| `suggest` | – | `GhostCompletionSuggest \| undefined` | `undefined` | Asked for a suggestion a moment after typing stops; the signal aborts when typing starts again |
| `debounce` | `debounce` | `number` | `300` | How long typing must pause before `suggest` is asked, in ms |
| `disabled` | `disabled` | `boolean` | `false` | No editing and no suggestions |
| `labels` | – | `Partial<GhostCompletionLabels>` | `{}` | Words the page can rename, merged over defaultGhostCompletionLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The text changed by typing or accepting ({ value }: GhostCompletionValueChange); cancelable – prevented, the field keeps its text |
| `tc-accept` | – | No | Some or all of a suggestion was taken ({ text, whole }: GhostCompletionAccept) |
| `tc-dismiss` | – | No | The suggestion was dismissed with Escape ({ text }: GhostCompletionDismiss) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus(options?: FocusOptions)` | `void` | Puts focus in the field |
| `accept(whole: unknown)` | `void` | Takes the suggestion – all of it, or its next word |
| `dismiss()` | `void` | Hides the suggestion until the next one |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-ghc-ghost` | `var(--tc-text-muted)` | both |

#### Design tokens it reads (40)

`--tc-accent`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-ghc-rows`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-badge`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `nextWord(text: string): void` | The next word of a suggestion, with the space before it |

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
| `suggest` | `el.suggest = …;` | `<… suggest={…} />` | `<tc-ghost-completion :suggest="…">` | `<tc-ghost-completion [suggest]="…">` | `<tc-ghost-completion {suggest}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-ghost-completion :labels="…">` | `<tc-ghost-completion [labels]="…">` | `<tc-ghost-completion {labels}>` |

*Also attributes: `heading`, `label`, `value`, `placeholder`, `rows`, `suggestion`, `debounce`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-accept` | No | `el.addEventListener("tc-accept", (e) => …)` | `onAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |
| `tc-dismiss` | No | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-ghost-completion id="ghost-completion"></tc-ghost-completion>

<script type="module">
  import "@adamstavely/trenchcoat/ghost-completion";

  const el = document.querySelector("#ghost-completion");
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
import { GhostCompletion } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof GhostCompletion>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledGhostCompletion({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <GhostCompletion {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/ghost-completion";
import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";

const props = defineProps<{ initial: TcGhostCompletion["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcGhostCompletion["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-ghost-completion :value="value" @tc-value-change="onValueChange"></tc-ghost-completion>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { GhostCompletion } from "@adamstavely/trenchcoat/angular/ghost-completion";
import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";

@Component({
  selector: "app-controlled-ghost-completion",
  imports: [GhostCompletion],
  template: `<tc-ghost-completion [value]="value()" (tc-value-change)="onValueChange($event)"></tc-ghost-completion>`,
})
export class ControlledGhostCompletion {
  readonly initial = input.required<TcGhostCompletion["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcGhostCompletion["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/ghost-completion";
  import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";

  let { initial }: { initial: TcGhostCompletion["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcGhostCompletion;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcGhostCompletion["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-ghost-completion bind:this={el} {value}></tc-ghost-completion>
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

```tsx
const [value, setValue] = useState(…);
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-ghost-completion :value="value" @tc-value-change="value = $event.detail.value"></tc-ghost-completion>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-ghost-completion [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-ghost-completion>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-ghost-completion bind:this={el} {value}></tc-ghost-completion>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-ghost-completion")` returns a `TcGhostCompletion` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";`
- **React / Next.js:** Props: `import type { GhostCompletionProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GhostCompletion>`. The element class, for refs: `import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGhostCompletion["suggest"]` with `import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";`
- **Angular:** The directive types the template: `[suggest]` takes `TcGhostCompletion["suggest"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGhostCompletion } from "@adamstavely/trenchcoat/ghost-completion";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading (default "Draft") |
| `value` | `string` | The text in the field. Controlled when defined |
| `defaultValue` | `string` | The starting text when uncontrolled |
| `onValueChange` | `(value: string) => void` | The text changed by typing or accepting a suggestion |
| `onAccept` | `(text: string, whole: boolean) => void` | Some or all of a suggestion was taken – `whole` when nothing of it is left |
| `onDismiss` | `(text: string) => void` | The suggestion was dismissed with Escape |

*Renamed or hidden on the wrapper: `heading`, `children`, `Draft`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Takes the whole suggestion. With no suggestion showing, moves focus as usual |
| Ctrl + → / ⌘ + → | Takes the suggestion's next word |
| Escape | Dismisses the suggestion until typing asks for another |
| Typing | Matching letters use the suggestion up; other letters drop it |
| Moving the caret | Off the end of the text, the suggestion goes away |

### Screen readers

The textarea is named by its visible label and described by the keys ("Suggestions appear after the cursor as you
type. Tab accepts one…"). A polite status region reads each new suggestion as "Suggestion: …", at most one every two
seconds, so typing isn't drowned out; the drawn mirror is hidden from assistive tech. Tab only takes a suggestion
when one is showing, so keyboard users can still leave the field with Tab otherwise.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-gutter | 94 | 97 | 18.2 | 18.2 | itself | Content can shift sideways when a scrollbar appears. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 12.3 KB | 4.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **19.7 KB** | **7.0 KB** |
| With Lit – the first component on a page | 40.5 KB | 13.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 23 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **0 timer callbacks/s** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Suggest the rest of the current sentence, or one short sentence – not a paragraph.
- Start the suggestion with the space it needs: " last completed in March", so it joins the typed text cleanly.
- Return an empty string when you have nothing useful; nothing shows.
- Rename the hint and the announcements with `labels` for other languages.

## Do and don't

### Do

- Abort your request when the signal aborts – the person has started typing again.
- Keep `debounce` short enough to feel responsive (200–400 ms) and long enough not to ask on every key.
- Use the value change and `tc-accept` to learn what people take.

### Don't

- Don't insert suggestions into the text yourself – the point is that nothing lands without a key press.
- Don't suggest while the caret is in the middle of the text; the field already hides it there.
- Don't use it for short single-line fields where a list of matches is clearer.

## Related

- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Writing Assistant](writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Selection Toolbar](selection-toolbar.md) – The formatting bar that floats over selected text: quick actions, toggles like bold and italic that show what's on, menus for text style, colour and list, and a link – it fires commands for the page's editor to apply.
