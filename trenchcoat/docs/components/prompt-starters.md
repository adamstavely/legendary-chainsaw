<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Prompt Starters

**AI & chat** · New

Where to begin, and what to ask next – suggestions for an empty chat and follow-ups after an answer, from the conversation's context

- **Element:** `<tc-prompt-starters>`
- **Size:** 8.7 KB gzip · 26.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/prompt-starters";` |
| React / Next.js | `import { PromptStarters } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/prompt-starters";` · tags starting with tc- are custom elements |
| Angular | `import { PromptStarters } from "@adamstavely/trenchcoat/angular/prompt-starters";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/prompt-starters";` |

## Example

The live example is in the gallery at `#/prompt-starters`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where to begin, and what to ask next. In an empty chat it offers starters in groups – “Analyse”, “Write”, “Find” –
each with an icon and a hint saying where it came from; after an answer it offers a few follow-up questions. A
suggestion either sends at once or fills the composer so people can finish it first, and the list says which. The
suggestions are data your app works out from the conversation's context; `loading` shows placeholders meanwhile.

### When to use

- The empty state of a chat or assistant, so people see what it's good at.
- Follow-up questions under an answer (`variant="follow-ups"`).
- Prompts with a blank to complete (“Draft a follow-up to …”) – set `mode: "fill"` on them.

### When not to use

- A library of saved prompts people browse, search and manage – use [Prompt Library](prompt-library.md).
- Suggestions that appear while typing @ or / in the message – use [Mention Picker](mention-picker.md).
- Questions the agent needs answered before it starts – use [Clarifying Questions](clarifying-questions.md).
- The message box itself – use [Chat Composer](chat-composer.md), and put the starters above it.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon and the heading that names the list: “Start with”, “Ask next”
2. **Group heading** `.ui-pst__group-label` – the kind of task: “Analyse”, “Write”
3. **Suggestion** `.ui-pst__option` – the icon, the label and a lighter hint
4. **Icon tile** `.ui-pst__icon` – the group's icon on its tint (a turn-arrow for follow-ups)
5. **Edit first** `.ui-pst__fill` – the pencil that fills the composer instead of sending
6. **Key hints** `.ui-pst__foot` – ↑ ↓ to move, ↵ and → with what they do

## Looks

Standard sets the list on a white card inside a gray tray, with the heading and the key hints on the tray. Clean is
one white card with hairline shadows, the key hints as its last row, smaller tile radii and thinner icons. Follow-ups
drop the tinted tiles and hints in both, for a compact list under an answer.

## Usage

### HTML

```html
<tc-prompt-starters id="starters" heading="Start with"></tc-prompt-starters>
<tc-chat-composer id="composer"></tc-chat-composer>

<script type="module">
  import "@adamstavely/trenchcoat/prompt-starters";
  import "@adamstavely/trenchcoat/tokens.css";

  const starters = document.querySelector("#starters");
  const composer = document.querySelector("#composer");
  starters.groups = [
    { id: "analyse", label: "Analyse", icon: "chart", tone: "blue", items: [{ id: "risk", text: "Which deals are most at risk?" }] },
    { id: "write", label: "Write", icon: "write", tone: "violet", items: [{ id: "draft", text: "Draft a follow-up to ", mode: "fill" }] },
  ];
  starters.addEventListener("tc-send", (e) => ask(e.detail.text));
  starters.addEventListener("tc-fill", (e) => (composer.value = e.detail.text));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ChatComposer, PromptStarters, type PromptStarter } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const followUps: PromptStarter[] = [
  { id: "q4", text: "Show the same view for Q4" },
  { id: "owners", text: "Who owns each of these deals?" },
];

export function NextQuestions({ ask }: { ask: (text: string) => void }) {
  const [message, setMessage] = useState("");
  return (
    <>
      <PromptStarters variant="follow-ups" title="Ask next" items={followUps} onSend={ask} onFill={setMessage} />
      <ChatComposer value={message} onValueChange={setMessage} onSend={ask} />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/prompt-starters";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";

defineProps<{ groups: TcPromptStarters["groups"]; items: TcPromptStarters["items"] }>();
const onSend = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-prompt-starters :groups="groups" :items="items" @tc-send="onSend"></tc-prompt-starters>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PromptStarters } from "@adamstavely/trenchcoat/angular/prompt-starters";
import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";

@Component({
  selector: "app-prompt-starters-example",
  imports: [PromptStarters],
  template: `<tc-prompt-starters [groups]="groups()" [items]="items()" (tc-send)="onSend($event)"></tc-prompt-starters>`,
})
export class PromptStartersExample {
  readonly groups = input.required<TcPromptStarters["groups"]>();
  readonly items = input.required<TcPromptStarters["items"]>();
  onSend(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/prompt-starters";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";

  let { groups, items }: { groups: TcPromptStarters["groups"]; items: TcPromptStarters["items"] } = $props();
  let el: TcPromptStarters;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-send", on);
    return () => el.removeEventListener("tc-send", on);
  });
</script>

<tc-prompt-starters bind:this={el} {groups} {items}></tc-prompt-starters>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Suggestions"` | The heading above the list, and the list's accessible name |
| `variant` | `variant` | `"starters" \| "follow-ups"` | `"starters"` | "starters" for an empty chat (icon tiles and hints), or "follow-ups" after an answer (compact rows) |
| `groups` | – | `PromptStarterGroup[]` | `[]` | Suggestions in groups, each with a heading and an icon |
| `items` | – | `PromptStarter[]` | `[]` | Suggestions without groups – shown after any groups |
| `mode` | `mode` | `PromptStarterMode` | `"send"` | What choosing a suggestion does unless it says otherwise: "send" it, or "fill" the composer to edit first |
| `loading` | `loading` | `boolean` | `false` | The suggestions are being worked out: placeholder rows instead of the list |
| `hints` | `hints` | `boolean` | `true` | Show the key hints under the list (↵ and →) |
| `sendLabel` | `send-label` | `string` | `"Ask"` | The word for sending in the key hint and the screen-reader text |
| `fillLabel` | `fill-label` | `string` | `"Edit first"` | The word for filling the composer in the key hint and the screen-reader text |
| `emptyText` | `empty-text` | `string` | `""` | Text when there are no suggestions (and not loading); empty hides the element's list entirely |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-send` | – | No | A suggestion was chosen to send as it is ({ text, item, group }) |
| `tc-fill` | – | No | A suggestion was chosen to put in the composer and edit first ({ text, item, group }) |

#### Design tokens it reads (76)

`--tc-avatar-md`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-ring`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-prompt-starters :groups="…">` | `<tc-prompt-starters [groups]="…">` | `<tc-prompt-starters {groups}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-prompt-starters :items="…">` | `<tc-prompt-starters [items]="…">` | `<tc-prompt-starters {items}>` |

*Also attributes: `heading`, `variant`, `mode`, `loading`, `hints`, `send-label`, `fill-label`, `empty-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-send` | No | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-fill` | No | `el.addEventListener("tc-fill", (e) => …)` | `onFill={…}` | `@tc-fill="…"` | `(tc-fill)="…($event)"` | `el.addEventListener("tc-fill", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-prompt-starters")` returns a `TcPromptStarters` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";`
- **React / Next.js:** Props: `import type { PromptStartersProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PromptStarters>`. The element class, for refs: `import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPromptStarters["groups"]` with `import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";`
- **Angular:** The directive types the template: `[groups]` takes `TcPromptStarters["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPromptStarters } from "@adamstavely/trenchcoat/prompt-starters";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading above the list, and the list's accessible name |
| `groups` | `PromptStarterGroup[]` | Suggestions in groups, each with a heading and an icon |
| `items` | `PromptStarter[]` | Suggestions without groups – shown after any groups |
| `onSend` | `(text: string, item: PromptStarter) => void` | Called with the text when a suggestion is chosen to send as it is |
| `onFill` | `(text: string, item: PromptStarter) => void` | Called with the text when a suggestion is chosen to fill the composer – put it there and focus it |

*Renamed or hidden on the wrapper: `heading`, `groups`, `items`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The list is one tab stop, on the suggestion last used.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous suggestion (no wrapping) |
| Home / End | Moves to the first or last suggestion |
| Enter / Space | Uses the suggestion the way it's set to: sends it, or fills the composer |
| → | Fills the composer with the suggestion, to edit before sending |
| A letter | Moves to the next suggestion that starts with the letters typed |

### Screen readers

The list is a `listbox` named by the heading, each group a `group` named by its heading, and each suggestion an
`option` whose name ends with what choosing it does – “Which Q3 deals are most at risk? From the pipeline you opened
today, Ask” or “…, Edit first” (the words come from `sendLabel` and `fillLabel`). The active suggestion is
`aria-selected`. While loading, the list is `aria-busy` and the placeholders are hidden. The key hints and the
pencil are hidden from screen readers; → does the same.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 17.8 KB | 6.2 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **26.2 KB** | **8.7 KB** |
| With Lit – the first component on a page | 46.9 KB | 15.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.2 ms** | the gallery demo's data, 88 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of groups replaced |
| First on the page | 5.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 30 ms | groups: first render, 2,292 nodes; update 2.2 ms |
| 1,000 items | 175 ms | groups: first render, 22,692 nodes; update 17 ms |

1,000 items of groups: 175 ms. It renders every item, so a first render passes 50 ms (a long task) at about 290 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write suggestions as the person would ask them, in their words, not as feature names: “Which deals are most at
  risk?” rather than “Risk analysis”.
- Use `label` for a shorter line when the sent `text` is long, and `hint` to say why it's suggested (“From the
  pipeline you opened today”).
- Name groups by the kind of task, with a verb: “Analyse”, “Write”, “Find”.
- Three to six starters and two or three follow-ups are enough.

## Do and don't

### Do

- Personalise from context: the open document, recent work, the answer just given.
- Put the text in the composer and focus it on `tc-fill`, so people can type straight away.
- Set `mode: "fill"` on prompts that end in a blank.

### Don't

- Don't offer follow-ups that repeat the question just answered.
- Don't send a suggestion that needs details only the person has – fill it instead.
- Don't use the list for actions that aren't prompts, such as “Clear chat”.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
- [Generated UI](generated-ui.md) – A model's answer drawn as real components – tables, charts, metrics, forms and callouts from a spec, checked as it arrives, with plain text for anything unknown

## Changelog

- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
