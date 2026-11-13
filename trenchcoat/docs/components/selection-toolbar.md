<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Selection Toolbar

**Inputs & controls** · New

The formatting bar that floats over selected text: quick actions, toggles like bold and italic that show what's on, menus for text style, colour and list, and a link – it fires commands for the page's editor to apply.

- **Element:** `<tc-selection-toolbar>`
- **Size:** 14.0 KB gzip · 44.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/selection-toolbar";` |
| React / Next.js | `import { SelectionToolbar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/selection-toolbar";` · tags starting with tc- are custom elements |
| Angular | `import { SelectionToolbar } from "@adamstavely/trenchcoat/angular/selection-toolbar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/selection-toolbar";` |

## Example

The live example is in the gallery at `#/selection-toolbar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The formatting bar that floats over selected text in an editor. It holds quick actions (ask, comment, react), toggles
such as bold and italic that show whether they're on, menus for text style, colour and list type, and a link button.
It doesn't edit anything: every press fires `tc-command`, the page's editor applies it, and the page tells the bar
what's on at the selection (`pressed`) and which option each menu shows (`values`).

With `rewritable`, a wand at the start of the bar rewrites the selected text with an instruction: people type “Make it
shorter” or pick a chip, the page's model writes the new text, and the bar shows it as a word diff to accept, reject
or try again. Accepting fires `tc-rewrite-accept`; the editor puts the text in place.

### When to use

- Formatting in a rich-text editor, where the controls belong next to the text being changed.
- A few quick actions on a selection beside the formatting, such as commenting.
- Rewriting your own selected text with AI – shorter, clearer, more formal – and seeing exactly what changes first.

### When not to use

- Acting on a model's answer – reply quoting it, ask why, request an edit: use [Response Selection](response-selection.md).
- Translating a selection: use [Selection Translate](selection-translate.md).
- Highlighting text and commenting in a margin: use [Text Annotator](text-annotator.md).
- A panel's views or tools: use [Icon Rail](icon-rail.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Bar** `.ui-stb__bar` – the toolbar; it floats while it has an `anchor`
2. **Slot** `.ui-stb__slot` – a control and its tooltip
3. **Control** `.ui-stb__tool` – a button, a toggle, or a menu's button with `.ui-stb__chevron`
4. **Separator** `.ui-stb__sep` – a divider between groups
5. **Tooltip** `.ui-stb__tip` – the label, and a shortcut when given, on hover and focus
6. **Menu** `.ui-stb__menu` – a menu's options, `.ui-stb__option`, with `.ui-stb__swatch` for a colour and `.ui-stb__check` on the chosen one
7. **Rewrite panel** `.ui-stb__rewrite` – with `rewritable`: the instruction field (`.ui-stb__rw-field`), the quick

## Looks

Both looks use the shared menu surface. Standard adds a hairline round the bar and shows a pressed toggle in gray with an
edge; Clean has a rounder bar and shows a pressed toggle in the accent. A page can set `--tc-stb-size`, a control's size,
`--tc-stb-glyph`, its icon's, `--tc-stb-swatch`, a colour swatch's, and `--tc-stb-menu`, a menu's least width.

The rewrite panel opens as a row under the tools, inside the bar, in both looks. Removed words are struck through on a
red tint and added ones underlined on a green tint, so the change reads without colour too.

## Usage

### HTML

```html
<div id="memo" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Memo">Select some of this text.</div>
<tc-selection-toolbar id="bar"></tc-selection-toolbar>

<script type="module">
  import { selectionRect } from "@adamstavely/trenchcoat/selection-toolbar";
  import "@adamstavely/trenchcoat/tokens.css";

  const memo = document.querySelector("#memo");
  const bar = document.querySelector("#bar");
  bar.editor = memo;
  const follow = () => {
    const rect = selectionRect();
    bar.anchor = rect;
    bar.open = !!rect;
    bar.pressed = ["bold", "italic"].filter((id) => document.queryCommandState(id));
  };
  memo.addEventListener("pointerup", follow);
  memo.addEventListener("keydown", (e) => {
    if (e.altKey && e.key === "F10") {
      e.preventDefault();
      bar.focusToolbar();
    }
  });
  bar.addEventListener("tc-command", (e) => {
    if (e.detail.id === "bold" || e.detail.id === "italic") document.execCommand(e.detail.id);
    follow();
  });
  // Rewrite: the page's model writes the text; Accept puts it in place
  bar.rewritable = true;
  bar.rewrite = ({ instruction, text }, signal) =>
    fetch("/api/rewrite", { method: "POST", body: JSON.stringify({ instruction, text }), signal }).then((r) => r.text());
  bar.addEventListener("tc-rewrite-accept", (e) => document.execCommand("insertText", false, e.detail.text));
</script>
```

### React / Next.js

```tsx
import { useRef, useState } from "react";
import { SelectionToolbar, selectionRect } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Memo() {
  const editor = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<ReturnType<typeof selectionRect>>(null);
  const [pressed, setPressed] = useState<string[]>([]);
  const follow = () => {
    const rect = selectionRect();
    setAnchor(rect);
    setPressed(["bold", "italic"].filter((id) => document.queryCommandState(id)));
  };
  return (
    <>
      <div ref={editor} contentEditable role="textbox" aria-multiline="true" aria-label="Memo" onPointerUp={follow} suppressContentEditableWarning>
        Select some of this text.
      </div>
      <SelectionToolbar
        anchor={anchor}
        open={anchor !== null}
        editor={editor.current}
        pressed={pressed}
        onTcCommand={(e) => {
          if (e.detail.id === "bold" || e.detail.id === "italic") document.execCommand(e.detail.id);
          follow();
        }}
        onTcClose={() => setAnchor(null)}
        rewritable
        rewrite={({ instruction, text }, signal) =>
          fetch("/api/rewrite", { method: "POST", body: JSON.stringify({ instruction, text }), signal }).then((r) => r.text())
        }
        onRewriteAccept={(text) => document.execCommand("insertText", false, text)}
      />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/selection-toolbar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";

defineProps<{ items: TcSelectionToolbar["items"]; pressed: TcSelectionToolbar["pressed"] }>();
const onCommand = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-selection-toolbar :items="items" :pressed="pressed" @tc-command="onCommand"></tc-selection-toolbar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SelectionToolbar } from "@adamstavely/trenchcoat/angular/selection-toolbar";
import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";

@Component({
  selector: "app-selection-toolbar-example",
  imports: [SelectionToolbar],
  template: `<tc-selection-toolbar [items]="items()" [pressed]="pressed()" (tc-command)="onCommand($event)"></tc-selection-toolbar>`,
})
export class SelectionToolbarExample {
  readonly items = input.required<TcSelectionToolbar["items"]>();
  readonly pressed = input.required<TcSelectionToolbar["pressed"]>();
  onCommand(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/selection-toolbar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";

  let { items, pressed }: { items: TcSelectionToolbar["items"]; pressed: TcSelectionToolbar["pressed"] } = $props();
  let el: TcSelectionToolbar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-command", on);
    return () => el.removeEventListener("tc-command", on);
  });
</script>

<tc-selection-toolbar bind:this={el} {items} {pressed}></tc-selection-toolbar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `items` | – | `SelectionToolbarItem[]` | `[ { type: "button", id: "ask", label: "Ask about this", icon: I.ask }, { type: "button", id: "comment", label: "Comment", icon: I.comment, keys: "Control+Alt+M Meta+Alt+M" }, { type: "button", id: "react", label: "Add a reaction", icon: I.emoji }, { type: "separator" }, { type: "menu", id: "style", label: "Text style", icon: I.style, options: [ { value: "p", label: "Text" }, { value: "h1", label: "Heading 1" }, { value: "h2", label: "Heading 2" }, { value: "h3", label: "Heading 3" }, { value: "small", label: "Small" }, ], }, { type: "separator" }, { type: "toggle", id: "bold", label: "Bold", icon: I.bold, keys: "Control+B Meta+B" }, { type: "toggle", id: "italic", label: "Italic", icon: I.italic, keys: "Control+I Meta+I" }, { type: "toggle", id: "underline", label: "Underline", icon: I.underline, keys: "Control+U Meta+U" }, { type: "toggle", id: "strike", label: "Strikethrough", icon: I.strike, keys: "Control+Shift+X Meta+Shift+X" }, { type: "toggle", id: "code", label: "Code", icon: I.code, keys: "Control+E Meta+E" }, { type: "menu", id: "color", label: "Text colour", icon: I.color, options: [ { value: "default", label: "Default", color: "var(--tc-text-primary)" }, { value: "gray", label: "Gray", color: "var(--tc-text-muted)" }, { value: "red", label: "Red", color: "var(--tc-status-danger-fg)" }, { value: "orange", label: "Orange", color: "var(--tc-status-warning-fg)" }, { value: "green", label: "Green", color: "var(--tc-status-success-fg)" }, { value: "blue", label: "Blue", color: "var(--tc-accent-text)" }, { value: "purple", label: "Purple", color: "var(--tc-chart-2)" }, ], }, { type: "separator" }, { type: "menu", id: "list", label: "List", icon: I.bullets, options: [ { value: "none", label: "No list", icon: ["M4 6h16", "M4 12h16", "M4 18h10"] }, { value: "bullets", label: "Bulleted list", icon: I.bullets }, { value: "numbers", label: "Numbered list", icon: I.numbers }, { value: "checks", label: "Checklist", icon: I.checks }, ], }, { type: "separator" }, { type: "button", id: "link", label: "Link", icon: I.link, keys: "Control+K Meta+K" }, ]` | The controls, in order; `{ type: "separator" }` draws a divider |
| `pressed` | – | `string[]` | `[]` | The ids of the toggles that are on, for the text that's selected |
| `values` | – | `Record<string, string>` | `{}` | Each menu's chosen option, by the menu's id; a menu without one shows its own icon |
| `anchor` | – | `PopoverRect \| Element \| null` | `null` | What it floats over: a rectangle in viewport pixels (`selectionRect()`) or an element. Without one it sits in the page's flow |
| `open` | `open` | `boolean` | `false` | Whether the floating bar shows; it sets itself false when it closes itself. No effect without an `anchor` |
| `editor` | – | `HTMLElement \| null` | `null` | The editor it formats: a click there doesn't close the bar, and Escape puts focus back in it |
| `labels` | – | `Partial<SelectionToolbarLabels>` | `{}` | Words the page can change |
| `rewritable` | `rewritable` | `boolean` | `false` | Adds Rewrite at the start of the bar: rewrite the selected text with an instruction, shown as a diff to accept or reject |
| `selectedText` | `selected-text` | `string` | `""` | The text a rewrite works on – read from the page's selection when empty |
| `rewrite` | – | `SelectionToolbarRewriter \| string \| null` | `null` | The rewrite's answer: a function the bar calls after tc-rewrite, or the new text the page sets in reply to it |
| `quickRewrites` | – | `SelectionToolbarQuickRewrite[]` | `[ { label: "Shorter", instruction: "Make it shorter" }, { label: "Clearer", instruction: "Make it clearer" }, { label: "More formal", instruction: "Make it more formal" }, { label: "Fix grammar", instruction: "Fix spelling and grammar" }, ]` | The chips under the rewrite field |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-command` | – | No | A control was used: a button ({ id }), a toggle ({ id, value: on }) or a menu option ({ id, value }) (SelectionToolbarCommand) |
| `tc-pressed-change` | – | Yes | A toggle was pressed ({ pressed, id }: SelectionToolbarPressedChange); cancelable – prevented, `pressed` stays as it was |
| `tc-values-change` | – | Yes | A menu option was chosen ({ values, id, value }: SelectionToolbarValuesChange); cancelable – prevented, `values` stays as it was |
| `tc-close` | – | No | The floating bar closed itself – Escape, or a click outside it and the editor ({ reason }: SelectionToolbarClose) |
| `tc-rewrite` | – | Yes | A rewrite was asked for ({ instruction, text }: SelectionToolbarRewrite); cancelable – prevented, nothing is requested and the field stays |
| `tc-rewrite-accept` | – | No | Accept was pressed on a rewrite ({ text, instruction, original }: SelectionToolbarRewriteAccept) – put `text` in place of the selection |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focusToolbar()` | `void` | Moves focus to the bar's current control – for the editor's "go to toolbar" key (Alt + F10 is usual) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-stb-size` | `var(--tc-control-h-sm)` | both |
| `--tc-stb-glyph` | `var(--tc-space-4)` | both |
| `--tc-stb-swatch` | `var(--tc-space-3-5)` | both |
| `--tc-stb-menu` | `calc(var(--tc-space-16) * 2.5)` | both |

#### Design tokens it reads (73)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-inverse`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSelectionToolbarItems: SelectionToolbarItem[]` | The bar in the reference layout: ask, comment and react; text style; bold to code; colour; list type; link |
| `selectionRect(doc: Document): PopoverRect \| null` | The current selection's box in viewport pixels – an `anchor` for the bar – or null when nothing is selected |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-selection-toolbar :items="…">` | `<tc-selection-toolbar [items]="…">` | `<tc-selection-toolbar {items}>` |
| `pressed` | `el.pressed = …;` | `<… pressed={…} />` | `<tc-selection-toolbar :pressed="…">` | `<tc-selection-toolbar [pressed]="…">` | `<tc-selection-toolbar {pressed}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-selection-toolbar :values="…">` | `<tc-selection-toolbar [values]="…">` | `<tc-selection-toolbar {values}>` |
| `anchor` | `el.anchor = …;` | `<… anchor={…} />` | `<tc-selection-toolbar :anchor="…">` | `<tc-selection-toolbar [anchor]="…">` | `<tc-selection-toolbar {anchor}>` |
| `editor` | `el.editor = …;` | `<… editor={…} />` | `<tc-selection-toolbar :editor="…">` | `<tc-selection-toolbar [editor]="…">` | `<tc-selection-toolbar {editor}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-selection-toolbar :labels="…">` | `<tc-selection-toolbar [labels]="…">` | `<tc-selection-toolbar {labels}>` |
| `rewrite` | `el.rewrite = …;` | `<… rewrite={…} />` | `<tc-selection-toolbar :rewrite="…">` | `<tc-selection-toolbar [rewrite]="…">` | `<tc-selection-toolbar {rewrite}>` |
| `quickRewrites` | `el.quickRewrites = …;` | `<… quickRewrites={…} />` | `<tc-selection-toolbar :quickRewrites="…">` | `<tc-selection-toolbar [quickRewrites]="…">` | `<tc-selection-toolbar {quickRewrites}>` |

*Also attributes: `open`, `rewritable`, `selected-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-command` | No | `el.addEventListener("tc-command", (e) => …)` | `onTcCommand={…}` | `@tc-command="…"` | `(tc-command)="…($event)"` | `el.addEventListener("tc-command", …)` |
| `tc-pressed-change` | Yes | `el.addEventListener("tc-pressed-change", (e) => …)` | `ref.current.addEventListener("tc-pressed-change", …)` | `@tc-pressed-change="…"` | `(tc-pressed-change)="…($event)"` | `el.addEventListener("tc-pressed-change", …)` |
| `tc-values-change` | Yes | `el.addEventListener("tc-values-change", (e) => …)` | `ref.current.addEventListener("tc-values-change", …)` | `@tc-values-change="…"` | `(tc-values-change)="…($event)"` | `el.addEventListener("tc-values-change", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onTcClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |
| `tc-rewrite` | Yes | `el.addEventListener("tc-rewrite", (e) => …)` | `onTcRewrite={…}` | `@tc-rewrite="…"` | `(tc-rewrite)="…($event)"` | `el.addEventListener("tc-rewrite", …)` |
| `tc-rewrite-accept` | No | `el.addEventListener("tc-rewrite-accept", (e) => …)` | `onTcRewriteAccept={…}` | `@tc-rewrite-accept="…"` | `(tc-rewrite-accept)="…($event)"` | `el.addEventListener("tc-rewrite-accept", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `pressed` and `values` itself unless a listener calls `preventDefault()` on `tc-pressed-change` or `tc-values-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-selection-toolbar id="selection-toolbar"></tc-selection-toolbar>

<script type="module">
  import "@adamstavely/trenchcoat/selection-toolbar";

  const el = document.querySelector("#selection-toolbar");
  el.addEventListener("tc-pressed-change", (e) => {
    e.preventDefault(); // the element keeps its pressed…
    if (allowed(e.detail.pressed)) el.pressed = e.detail.pressed; // …until the app sets it
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
import "@adamstavely/trenchcoat/selection-toolbar";
import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";

const props = defineProps<{ initial: TcSelectionToolbar["pressed"] }>();
const pressed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPressedChange = (e: CustomEvent<{ pressed: TcSelectionToolbar["pressed"] }>) => {
  e.preventDefault();
  pressed.value = e.detail.pressed;
};
</script>

<template>
  <tc-selection-toolbar :pressed="pressed" @tc-pressed-change="onPressedChange"></tc-selection-toolbar>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SelectionToolbar } from "@adamstavely/trenchcoat/angular/selection-toolbar";
import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";

@Component({
  selector: "app-controlled-selection-toolbar",
  imports: [SelectionToolbar],
  template: `<tc-selection-toolbar [pressed]="pressed()" (tc-pressed-change)="onPressedChange($event)"></tc-selection-toolbar>`,
})
export class ControlledSelectionToolbar {
  readonly initial = input.required<TcSelectionToolbar["pressed"]>();
  readonly pressed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPressedChange(e: CustomEvent<{ pressed: TcSelectionToolbar["pressed"] }>) {
    e.preventDefault();
    this.pressed.set(e.detail.pressed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/selection-toolbar";
  import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";

  let { initial }: { initial: TcSelectionToolbar["pressed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let pressed = $derived(initial);
  let el: TcSelectionToolbar;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      pressed = (e as CustomEvent<{ pressed: TcSelectionToolbar["pressed"] }>).detail.pressed;
    };
    el.addEventListener("tc-pressed-change", on);
    return () => el.removeEventListener("tc-pressed-change", on);
  });
</script>

<tc-selection-toolbar bind:this={el} {pressed}></tc-selection-toolbar>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-selection-toolbar")` returns a `TcSelectionToolbar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";`
- **React / Next.js:** Props: `import type { SelectionToolbarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SelectionToolbar>`. The element class, for refs: `import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSelectionToolbar["items"]` with `import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";`
- **Angular:** The directive types the template: `[items]` takes `TcSelectionToolbar["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSelectionToolbar } from "@adamstavely/trenchcoat/selection-toolbar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `pressed` | `string[]` | The toggles that are on – controlled when given (usually from the editor's state at the selection) |
| `defaultPressed` | `string[]` | The toggles on at first, when `pressed` isn't controlled |
| `onPressedChange` | `(pressed: string[], id: string) => void` | A toggle was pressed |
| `values` | `Record<string, string>` | Each menu's chosen option – controlled when given |
| `defaultValues` | `Record<string, string>` | The menus' options at first, when `values` isn't controlled |
| `onValuesChange` | `(values: Record<string, string>, id: string, value: string) => void` | A menu option was chosen |
| `onRewriteRequest` | `(request: SelectionToolbarRewrite) => void \| boolean` | A rewrite was asked for (with `rewritable`). Return false to stop it – nothing is requested |
| `onRewriteAccept` | `(text: string, detail: SelectionToolbarRewriteAccept) => void` | Accept was pressed on a rewrite: put `text` in place of the selection |

*Renamed or hidden on the wrapper: `pressed`, `values`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

One tab stop for the whole bar. The editor moves focus to it: call `focusToolbar()` from its own key, usually Alt + F10.

| Key | What it does |
|---|---|
| Left / Right | Moves along the bar |
| Home / End | Moves to the first or last control |
| Enter / Space | Uses the control; opens a menu |
| Down / Up on a menu's button | Opens the menu at its chosen (or first) option, or its last |
| Up / Down / Home / End in a menu | Moves through its options |
| Enter / Space in a menu | Chooses the option and closes the menu |
| Escape in a menu | Closes it, back on its button |
| Escape on the bar | Closes the bar and puts focus back in `editor` |
| Enter in the rewrite field | Asks for the rewrite |
| Tab in the rewrite panel | Moves through the field, Rewrite, the chips – then Accept, Reject and Try again |
| Escape in the rewrite panel | Closes it (and drops a rewrite in progress), back on the wand |

A mouse-down on the bar doesn't take focus from the editor, so the selection stays painted while people click.

### Screen readers

It's a `toolbar` named "Format" (`labels.toolbar`), and floats as one. Each control is named by its label; toggles say
whether they're pressed, and `keys` becomes `aria-keyshortcuts`. A menu's button says it opens a `menu`, whether it's open,
and the option it shows ("List: Bulleted list"); its options are `menuitemradio`s that say which is chosen. Dividers are
`separator`s. Tooltips repeat the names, so they're hidden from them.

The wand is “Rewrite with AI”, with `aria-expanded` for its panel – a group of the same name, busy while the text is
written. The field is labelled “How should it be rewritten?”; the chips are a group, “Quick instructions”. The diff is
read with hidden “removed:” and “added:” before each change. A status line says “Rewriting…”, “Rewrite ready: 3
changes. Accept or reject it” (focus moves to Accept) or “Couldn't rewrite the text”.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.4 KB | 9.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **44.5 KB** | **14.0 KB** |
| With Lit – the first component on a page | 65.2 KB | 20.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 0 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of items replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.2 ms | items: first render, 0 nodes; update 0.0 ms |
| 1,000 items | 27 ms | items: first render, 0 nodes; update 0.0 ms |

What it renders doesn't grow with items (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

`items` defaults to `defaultSelectionToolbarItems`; pass your own list in order, with `{ type: "separator" }` between
groups. Every control needs a short `label` – the icon alone may not be clear – and `icon`, SVG path data for a 24×24
stroked icon. Give menu options an `icon` (shown on the menu's button when chosen) or a `color` (a swatch). Set
`pressed` and `values` from the editor's state each time the selection moves, so the bar tells the truth about the text.

Anchor it with `selectionRect()` after a selection is finished (on pointer-up or a Shift key), not on every
`selectionchange` while dragging; set `open` false when the selection collapses. When it closes itself it fires
`tc-close` and sets `open` false – a React page that passes `open` should follow `onTcClose`.

For Rewrite, give `rewrite` an async function `(request, signal) => newText` – the signal aborts on Reject or Escape –
or listen for `tc-rewrite` and set `rewrite` to the new text. Pass `selectedText` when the editor knows the selection
better than the page's selection does; save the selection's range on `tc-rewrite`, because focus moves to the field.
Keep `quickRewrites` to three or four short chips.

## Do and don't

### Do

- Apply every `tc-command` in the editor, then update `pressed` and `values` from what the text now is.
- Keep the groups the editor really has; drop menus it can't apply.
- Give the editor a key to reach the bar (`focusToolbar()`), and say so near the editor.
- Apply an accepted rewrite as one undoable edit in the editor.

### Don't

- Don't open it on a collapsed selection or while the pointer is still dragging.
- Don't rely on colour alone in a colour menu: every option has a name.
- Don't put an action that can't be undone on the bar without a confirmation.
- Don't apply a rewrite before Accept – the diff is there so people check it.

## Related

- [Response Selection](response-selection.md) – Select part of a model's answer and act on it – reply quoting it, ask why, or request an edit that comes back as a diff to accept or reject
- [Selection Translate](selection-translate.md) – Select text and translate it – the translation in a card with the detected language, copy, replace in place and show original
- [Text Annotator](text-annotator.md) – Highlight text in a document in a colour and comment on it – marks in the text, comments in the margin, edit, resolve and filter
- [Icon Rail](icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.

## Changelog

- **Selection Toolbar** (`tc-selection-toolbar`): the formatting bar that floats over selected text – quick actions, toggles that show what's on, menus for text style, colour and list type, and a link. It fires `tc-command` for the page's editor to apply; `selectionRect()` gives it an anchor, and `focusToolbar()` is for the editor's Alt + F10.
