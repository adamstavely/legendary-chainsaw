<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Mention Picker

**AI & chat** · New

The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip

- **Element:** `<tc-mention-picker>`
- **Size:** 13.0 KB gzip · 40.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/mention-picker";` |
| React / Next.js | `import { MentionPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/mention-picker";` · tags starting with tc- are custom elements |
| Angular | `import { MentionPicker } from "@adamstavely/trenchcoat/angular/mention-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/mention-picker";` |

## Example

The live example is in the gallery at `#/mention-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The @ and / picker inside a message box. When someone types a trigger character, a list opens under it with the
people, files, sources or commands that match what they type next, in groups. Arrow keys and Enter – or a click – put
the pick in place of what was typed: as a token such as “@Maya Chen” in a textarea or input, or as a chip in a
contenteditable field. It attaches to a field your app already owns, so the composer keeps its own markup, focus and
Enter-to-send. Typing ranks the matches – a label's start, then a word's start, then the hint and description – and
marks the part that matched; before anything is typed, recently used items can come first. chat-composer builds its
skills (slash commands) on it.

### When to use

- Mentioning people, files or sources in a message to a person or an agent.
- Slash commands at the start of a line (`atLineStart`), next to @-mentions in the same box – with `showChar`, a
  `description` per command and `recent` ones first.
- Suggestions that come from a server as people type – pass `search` and it shows a loading state and drops stale
  answers.

### When not to use

- A field whose whole value is the pick, such as assignees or labels – use [Combobox](combobox.md).
- Running commands or jumping somewhere from anywhere in the app – use [Command Menu](command-menu.md).
- Showing what's already attached to the conversation, with its token weight – use [Context Tray](context-tray.md).
- A complete chat input with attachments and a send button – use [Chat Composer](chat-composer.md), and attach the picker to it.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `.ui-mnp__pop` – the popover under the trigger character, or above it when there's more room there
2. **Group heading** `.ui-mnp__label` – names a group of results: “Files”, “People”
3. **Row** `.ui-mnp__option` – one result, with its icon or avatar, the label and a lighter hint; with a `description`, a second line under them
4. **Highlight** `.ui-mnp__pill` – the fill that glides to the active row
5. **Key hints** `.ui-mnp__foot` – ↑ ↓ to move, ↵ to insert, Esc to close

## Looks

Standard sets the list on a white card inside a gray tray, with the key hints on the tray below it. Clean is one
white popover with hairline shadows and the key hints as its last row (“esc” in lower case). Both glide the same
highlight between rows and place the list the same way. A trigger's `note` sits over the list, under a hairline, in
both.

## Usage

### HTML

```html
<textarea id="message" aria-label="Message"></textarea>
<tc-mention-picker id="mentions" for="message"></tc-mention-picker>

<script type="module">
  import "@adamstavely/trenchcoat/mention-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#mentions");
  const people = [{ id: "maya", label: "Maya Chen", hint: "Design", avatar: true }];
  const commands = [
    { id: "sum", label: "summarize", description: "Sum up the thread", token: "/summarize" },
    { id: "tests", label: "tests", description: "Write tests for a file", token: "/tests", keywords: "spec" },
  ];
  picker.triggers = [
    { char: "@", label: "People", groups: [{ id: "people", label: "People", items: people }] },
    { char: "/", atLineStart: true, label: "Commands", showChar: true, recent: ["tests"], noun: ["command", "commands"], groups: [{ id: "cmd", label: "Commands", items: commands }] },
  ];
  picker.addEventListener("tc-pick", (e) => console.log(e.detail.token));
</script>
```

### React / Next.js

```tsx
import { useRef } from "react";
import { MentionPicker, type MentionTrigger } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const triggers: MentionTrigger[] = [
  {
    char: "@",
    label: "People and files",
    groups: [
      { id: "people", label: "People", items: [{ id: "maya", label: "Maya Chen", hint: "Design", avatar: true }] },
      { id: "files", label: "Files", items: [{ id: "spec", label: "billing-spec.md", hint: "docs/billing" }] },
    ],
  },
];

export function Message() {
  const field = useRef<HTMLTextAreaElement>(null);
  return (
    <>
      <textarea ref={field} aria-label="Message" />
      <MentionPicker target={field} triggers={triggers} onPick={(pick) => console.log(pick.token)} />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/mention-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";

defineProps<{ target: TcMentionPicker["target"]; triggers: TcMentionPicker["triggers"] }>();
const onPick = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-mention-picker :target="target" :triggers="triggers" @tc-pick="onPick"></tc-mention-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MentionPicker } from "@adamstavely/trenchcoat/angular/mention-picker";
import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";

@Component({
  selector: "app-mention-picker-example",
  imports: [MentionPicker],
  template: `<tc-mention-picker [target]="target()" [triggers]="triggers()" (tc-pick)="onPick($event)"></tc-mention-picker>`,
})
export class MentionPickerExample {
  readonly target = input.required<TcMentionPicker["target"]>();
  readonly triggers = input.required<TcMentionPicker["triggers"]>();
  onPick(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/mention-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";

  let { target, triggers }: { target: TcMentionPicker["target"]; triggers: TcMentionPicker["triggers"] } = $props();
  let el: TcMentionPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-pick", on);
    return () => el.removeEventListener("tc-pick", on);
  });
</script>

<tc-mention-picker bind:this={el} {target} {triggers}></tc-mention-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `htmlFor` | `for` | `string` | `""` | The id of the field to attach to (in the same document) |
| `target` | – | `HTMLElement \| null` | `null` | The field to attach to – wins over `for` |
| `triggers` | – | `MentionPickerTrigger[]` | `[]` | The trigger characters and what each one offers |
| `search` | – | `MentionPickerSearch \| undefined` | `undefined` | Finds suggestions in place of the built-in filter (see MentionPickerSearch) |
| `renderChip` | – | `MentionPickerRenderChip \| undefined` | `undefined` | Builds the chip for a contenteditable field (see MentionPickerRenderChip) |
| `maxResults` | `max-results` | `number` | `50` | Most rows shown at once |
| `placement` | `placement` | `"auto" \| "above" \| "below"` | `"auto"` | "auto" opens below the trigger, or above it when there's more room there |
| `emptyText` | `empty-text` | `string` | `"No matches"` | What the list says when nothing matches |
| `disabled` | `disabled` | `boolean` | `false` | Never opens |
| `open` | – | `` | – | Whether the list is open |
| `attached` | – | `HTMLElement \| null` | – | The field it is attached to |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-pick` | – | Yes | A row was picked (`MentionPickerPick`: `{ item, trigger, query, token }`). Cancelable: preventDefault() leaves the field as it is – the app inserts the mention itself |
| `tc-open-change` | – | No | The list opened or closed (`{ open, trigger, query }`) |
| `tc-query-change` | – | No | The text after the trigger changed while open (`{ query, trigger }`) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `close()` | `void` | Closes the list (it opens again when the next trigger is typed) |
| `sync()` | `void` | Reads the field again after a script changed its text or caret – opening the list on a trigger there, even one that Esc closed |

#### Design tokens it reads (73)

`--tc-accent`, `--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-sm`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-fg`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `target` | `el.target = …;` | `<… target={…} />` | `<tc-mention-picker :target="…">` | `<tc-mention-picker [target]="…">` | `<tc-mention-picker {target}>` |
| `triggers` | `el.triggers = …;` | `<… triggers={…} />` | `<tc-mention-picker :triggers="…">` | `<tc-mention-picker [triggers]="…">` | `<tc-mention-picker {triggers}>` |
| `search` | `el.search = …;` | `<… search={…} />` | `<tc-mention-picker :search="…">` | `<tc-mention-picker [search]="…">` | `<tc-mention-picker {search}>` |
| `renderChip` | `el.renderChip = …;` | `<… renderChip={…} />` | `<tc-mention-picker :renderChip="…">` | `<tc-mention-picker [renderChip]="…">` | `<tc-mention-picker {renderChip}>` |

*Also attributes: `for`, `max-results`, `placement`, `empty-text`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-pick` | Yes | `el.addEventListener("tc-pick", (e) => …)` | `onPick={…}` | `@tc-pick="…"` | `(tc-pick)="…($event)"` | `el.addEventListener("tc-pick", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-query-change` | No | `el.addEventListener("tc-query-change", (e) => …)` | `onQueryChange={…}` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |

### Controlled

`tc-pick` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-mention-picker")` returns a `TcMentionPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";`
- **React / Next.js:** Props: `import type { MentionPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MentionPicker>`. The element class, for refs: `import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMentionPicker["target"]` with `import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";`
- **Angular:** The directive types the template: `[target]` takes `TcMentionPicker["target"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMentionPicker } from "@adamstavely/trenchcoat/mention-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `target` | `HTMLElement \| React.RefObject<HTMLElement \| null> \| null` | The field to attach to: an element or a ref to one (a &lt;textarea>, an &lt;input> or a contenteditable element) |
| `htmlFor` | `string` | …or its id |
| `triggers` | `MentionTrigger[]` | The trigger characters and what each one offers – icons may be React nodes |
| `onPick` | `(pick: MentionPickerPick, event: Event) => void` | Called with the pick. The picker then puts a token (textarea, input) or a chip (contenteditable) in place of the typed query – call `event.preventDefault()` to insert it yourself instead |
| `onOpenChange` | `(open: boolean, trigger: string \| null) => void` | Called when the list opens or closes, with the trigger character it opened for (null when closed) |
| `onQueryChange` | `(query: string, trigger: string) => void` | Called when the text typed after the trigger changes while the list is open |

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

The field keeps focus throughout; the picker takes these keys only while its list is open.

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous row, wrapping at the ends |
| Enter | Inserts the active row (the first row unless another is active). After a failed search, tries it again. With nothing to insert, closes the list and lets the key through – a composer's Enter-to-send still works |
| Tab | Inserts the active row, like Enter; with nothing to insert, closes the list and moves on |
| Escape | Closes the list; it stays closed until another trigger character is typed |

Moving the caret out of the query, or pressing outside the field and the list, also closes it.

### Screen readers

The field is the combobox and keeps focus: an `<input>` or a contenteditable element gets `role="combobox"` and
`aria-expanded`; a `<textarea>` keeps its textbox role, as HTML requires. Both get `aria-autocomplete="list"`,
`aria-controls` pointing at the listbox, and `aria-activedescendant` pointing at the active row, which is
`aria-selected`. The listbox is named by the trigger's `label` (“People, files and sources”), or “Suggestions”, and
each group by its heading. A polite status says how many results there are (“4 suggestions”, or in the trigger's
`noun`: “4 commands”), followed by its `note` when it has one; the empty text (“No matches”), “Couldn't load
suggestions” when a search fails, and the pick (“Inserted @Maya Chen”). An option's name is its text: the label, the
hint, the description and – in one ranked list (`rankAcrossGroups`) – its group's tag. The key hints and the note on screen are hidden from screen
readers – the status says the note. The picker gives back the field's own attributes when it detaches.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | itself | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 32.3 KB | 10.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **40.5 KB** | **13.0 KB** |
| With Lit – the first component on a page | 62.5 KB | 20.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 16 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of triggers replaced |
| First on the page | 5.2 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.9 ms | triggers: first render, 16 nodes; update 0.1 ms |
| 1,000 items | 0.9 ms | triggers: first render, 16 nodes; update 0.1 ms |

What it renders doesn't grow with triggers (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name each trigger's list in `label` by what it holds: “People and files”, “Commands”.
- Use the hint for what tells two rows apart – a role, a path, what a command does – not a description of every row.
- Write command labels as the word people type (“summarize”), and set `token` to what lands in the field
  (“/summarize”).
- Write `emptyText` for the list: “No one found” reads better than “No matches” for people – the picker adds
  “for ‘…’” with what was typed. A trigger's `emptyHint` says what to try instead: “Try another word, or press Esc to
  type it as text”.
- Keep a `description` to one line on what the item does; it's cut with an ellipsis, and it's matched too.

## Do and don't

### Do

- Group results by kind (Files, People, Sources), so people know what they're picking.
- Put synonyms people might type in `keywords` – a word's start there ranks with a word's start in the label.
- Pass `recent` with the ids people picked last, so the common ones are one ↵ away.
- Call `preventDefault()` on `tc-pick` when your editor inserts mentions its own way, and insert the token yourself.

### Don't

- Don't use a trigger character people type at the start of words for other reasons – “#” in a field where people
  write “#2” opens the list every time. (Inside a word, as in `ana@example.com`, a trigger is ignored.)
- Don't add actions (“Invite someone”) as rows next to results.
- Don't move focus into the list – it is designed to leave focus in the field.

## Related

- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window

## Changelog

- **`tc-mention-picker`:** item descriptions, recents, ranking across groups, word-match highlighting and per-trigger search. It stays backwards-compatible.
- `tc-mention-picker` – the / and @ picker for a textarea, input or contenteditable: grouped, scored results, the field keeps focus (aria-activedescendant), ↵ / Tab insert a token or a chip, and the composer's Enter-to-send never sees that ↵. `search` may be async.
- chat-composer (the Lit element and `trenchcoat/react`): opt-in `mentions` (a `tc-mention-picker` on the message) and `context` / `context-limit` (a `tc-context-tray` above it). Without them it renders as before.
