<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Dialog

**Inputs & controls**

A native modal with interactive content and restored focus

- **Element:** `<tc-dialog>`
- **Size:** 8.4 KB gzip · 29.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/dialog";` |
| React / Next.js | `import { Dialog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/dialog";` · tags starting with tc- are custom elements |
| Angular | `import { Dialog } from "@adamstavely/trenchcoat/angular/dialog";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/dialog";` |

## Example

The live example is in the gallery at `#/dialog`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A native modal that asks for one decision or shows one short task, then hands focus back. It holds the person's
attention on a heading, an optional line saying what the dialog is for, the app's content and a footer of actions.
The content and the actions are the app's: the dialog's own control styles stay inside its own parts, so a hosted
`tc-button`, progress tracker or form renders exactly as it does anywhere else.

### When to use

- Confirming a consequential step – applying settings, publishing, deleting – with the action in the footer
  (`actions`) and Close relabelled "Cancel".
- A short review that needs the person's full attention, such as a checklist before a release.
- Showing a single message that must be acknowledged before going on (no `actions`; Close is the primary button).

### When not to use

- A choice from a list of models or options – use [Model Picker](model-picker.md).
- Read-only results people only inspect – show them in the page with the run and output components.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Heading** `.tc-settings-card > header h3` – the dialog's name, also its accessible name
2. **Description** `.tc-settings-card > header p` – optional: one line on what the dialog is for
3. **Body** `.tc-dialog-body` – the app's content (`content`, `text`, or React children)
4. **Close** `.tc-dialog-footer > button` – the built-in button that closes the dialog
5. **Actions** `.tc-dialog-actions` – the app's buttons, after Close

## Looks

Standard and Clean share the same white card on a dimmed page, with a hairline above the footer. The look reaches
the controls inside: a hosted `tc-button` follows its own look, and the built-in Close button uses the look's
secondary or primary recipe.

`size` sets how wide the panel may grow: `sm` (480px), `md` (640px, the default), `lg` (880px) or `xl` (1120px),
never past 90% of the window. `sm` and `md` fit their content up to that width; `lg` and `xl` always take it, for
reports with tables or side-by-side sections. The widths are tokens on `tc-dialog` a page can override:
`--tc-dialog-w-sm`, `--tc-dialog-w-md`, `--tc-dialog-w-lg` and `--tc-dialog-w-xl`.

### Printing

Printed, an open dialog is what prints – a report in an `xl` dialog with a Print button calling `window.print()`, say.
It prints whole, from the top of the first page and across as many pages as it needs: no height limit or scrolling,
no backdrop, shadow or rounded corners. The page behind it is hidden. The heading and description print; the footer
doesn't, since Close and the actions are for the screen – put anything that must be on paper in the body. A page
much longer than the dialog may print blank pages after it. A closed dialog changes nothing about printing.

## Usage

### HTML

```html
<script type="module">
  import "@adamstavely/trenchcoat/dialog";
  import "@adamstavely/trenchcoat/button";
  const dialog = document.querySelector("tc-dialog");
  const apply = Object.assign(document.createElement("tc-button"), { label: "Apply settings", variant: "primary" });
  apply.addEventListener("click", () => (dialog.open = false));
  dialog.actions = apply;
  dialog.addEventListener("tc-open-change", (e) => console.log("open:", e.detail.open));
  document.querySelector("#review").addEventListener("click", () => (dialog.open = true));
</script>
<tc-button id="review" label="Review settings"></tc-button>
<tc-dialog
  label="Apply model settings?"
  description="The new settings apply to every conversation in this workspace."
  close-label="Cancel"
  text="Temperature drops from 0.7 to 0.3."
></tc-dialog>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Button, Dialog } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Review settings" onClick={() => setOpen(true)} />
      <Dialog
        label="Apply model settings?"
        description="The new settings apply to every conversation in this workspace."
        closeLabel="Cancel"
        open={open}
        onOpenChange={setOpen}
        actions={<Button variant="primary" label="Apply settings" onClick={() => setOpen(false)} />}
      >
        <p>Temperature drops from 0.7 to 0.3, and answers cite their sources.</p>
      </Dialog>
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/dialog";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDialog } from "@adamstavely/trenchcoat/dialog";

defineProps<{ content: TcDialog["content"]; actions: TcDialog["actions"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-dialog :content="content" :actions="actions" @tc-open-change="onOpenChange"></tc-dialog>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Dialog } from "@adamstavely/trenchcoat/angular/dialog";
import type { TcDialog } from "@adamstavely/trenchcoat/dialog";

@Component({
  selector: "app-dialog-example",
  imports: [Dialog],
  template: `<tc-dialog [content]="content()" [actions]="actions()" (tc-open-change)="onOpenChange($event)"></tc-dialog>`,
})
export class DialogExample {
  readonly content = input.required<TcDialog["content"]>();
  readonly actions = input.required<TcDialog["actions"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/dialog";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDialog } from "@adamstavely/trenchcoat/dialog";

  let { content, actions }: { content: TcDialog["content"]; actions: TcDialog["actions"] } = $props();
  let el: TcDialog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-dialog bind:this={el} {content} {actions}></tc-dialog>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `size` | `size` | `DialogSize` | `"md"` | How wide the panel may grow: "sm" (480px), "md" (640px, the default), "lg" (880px) or "xl" (1120px), within 90% of the window. lg and xl always take that width. |
| `open` | `open` | `boolean` | `false` | Whether the modal is open. |
| `label` | `label` | `string` | `"Dialog"` | Visible heading and accessible name. |
| `text` | `text` | `string` | `""` | Plain-text content; use content for a renderable template or element. |
| `description` | `description` | `string` | `""` | A line under the heading that says what the dialog is for; it becomes the dialog's accessible description. |
| `content` | – | `unknown` | `undefined` | Body template or DOM node; the element renders it inside the modal. |
| `actions` | – | `unknown` | `undefined` | The app's actions for the footer (a template or DOM node, e.g. tc-buttons); they sit after the Close button. |
| `closeButton` | `close-button` | `DialogCloseButton` | `"auto"` | The built-in Close button: "auto" (primary alone, secondary beside actions), "primary", "secondary" or "hidden". Escape still closes when hidden. |
| `closeLabel` | `close-label` | `string` | `"Close"` | The built-in button's text, e.g. "Cancel" beside a primary action. |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | Proposed open state (detail: { open }); cancelable. |

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
| `content` | `el.content = …;` | `<… content={…} />` | `<tc-dialog :content="…">` | `<tc-dialog [content]="…">` | `<tc-dialog {content}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-dialog :actions="…">` | `<tc-dialog [actions]="…">` | `<tc-dialog {actions}>` |

*Also attributes: `size`, `open`, `label`, `text`, `description`, `close-button`, `close-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-dialog id="dialog"></tc-dialog>

<script type="module">
  import "@adamstavely/trenchcoat/dialog";

  const el = document.querySelector("#dialog");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { Dialog } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Dialog>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledDialog({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <Dialog {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/dialog";
import type { TcDialog } from "@adamstavely/trenchcoat/dialog";

const props = defineProps<{ initial: TcDialog["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcDialog["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-dialog :open="open" @tc-open-change="onOpenChange"></tc-dialog>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Dialog } from "@adamstavely/trenchcoat/angular/dialog";
import type { TcDialog } from "@adamstavely/trenchcoat/dialog";

@Component({
  selector: "app-controlled-dialog",
  imports: [Dialog],
  template: `<tc-dialog [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-dialog>`,
})
export class ControlledDialog {
  readonly initial = input.required<TcDialog["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcDialog["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/dialog";
  import type { TcDialog } from "@adamstavely/trenchcoat/dialog";

  let { initial }: { initial: TcDialog["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcDialog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcDialog["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-dialog bind:this={el} {open}></tc-dialog>
```

### Slots and children

No slots: everything it shows comes from its properties (and, in React, the wrapper's children).

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-dialog")` returns a `TcDialog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDialog } from "@adamstavely/trenchcoat/dialog";`
- **React / Next.js:** Props: `import type { DialogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Dialog>`. The element class, for refs: `import type { TcDialog } from "@adamstavely/trenchcoat/dialog";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDialog["content"]` with `import type { TcDialog } from "@adamstavely/trenchcoat/dialog";`
- **Angular:** The directive types the template: `[content]` takes `TcDialog["content"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDialog } from "@adamstavely/trenchcoat/dialog";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDialog } from "@adamstavely/trenchcoat/dialog";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Whether the modal is open when controlled. |
| `defaultOpen` | `boolean` | Whether an uncontrolled modal starts open. |
| `onOpenChange` | `(open: boolean) => void` | Called when the user requests opening or closing. |
| `children` | `React.ReactNode` | Interactive React content rendered into the native dialog. |
| `actions` | `React.ReactNode` | The app's footer actions (e.g. a primary Button), rendered after the built-in Close button. |

*Renamed or hidden on the wrapper: `open`, `children`, `content`, `actions`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
| --- | --- |
| Tab / Shift+Tab | Moves between the controls in the dialog; focus stays inside while it is open |
| Escape | Asks to close (a cancelable `tc-open-change`), also when Close is hidden |
| Enter / Space | Activates the focused button |

Focus moves into the dialog when it opens and returns to the control that opened it when it closes.

### Screen readers

The native `dialog` is modal, named by the heading through `aria-labelledby`, and described by the description line
through `aria-describedby` when there is one. Close is a button named by `close-label` ("Close" unless set).

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, internal/settings | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 7.3 KB | 3.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.7 KB** | **8.4 KB** |
| With Lit – the first component on a page | 49.3 KB | 14.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 9 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 6.7 ms | default properties; includes adding its CSS to the document |

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

- The heading names the decision as a question or a task: "Apply model settings?", "Ready to publish?".
- The description is one sentence of consequence: "The new settings apply to every conversation in this
  workspace."
- Name the action for what it does – "Apply settings", "Publish" – not "OK". Beside an action, relabel Close
  "Cancel".

## Do and don't

### Do

- Put the app's decision in `actions` and let Close turn secondary (`close-button="auto"`, the default).
- Hide Close (`close-button="hidden"`) only when an action in `actions` also dismisses the dialog; Escape still
  closes.
- Keep values application-owned and control `open` with `tc-open-change` (React: `open` and `onOpenChange`).

### Don't

- Don't put the submit button in the body to get it near the content – use `actions`.
- Don't restyle hosted controls to undo the dialog's styles; nothing from the dialog reaches them.
- Don't stack a second dialog for a follow-up question – change the content instead.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price

## Changelog

- **Shared code:** - `internal/modal.ts`, the `ModalController` that `tc-dialog`, `tc-terms-dialog` and `tc-stories` share; - `cardHead()` gains `picture`, `pictureShape` and `keepAside`.
- **`tc-dialog`** uses the shared `ModalController`. If the browser closes it on its own, focus now goes back to the button that opened it.
