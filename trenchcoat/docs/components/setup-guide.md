<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Setup Guide

**Feedback & onboarding** · Also in React

Onboarding panel with a progress bar and collapsible task groups that strike through when done

- **Element:** `<tc-setup-guide>`
- **Size:** 9.2 KB gzip · 36.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/setup-guide";` |
| React / Next.js | `import { SetupGuide } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/setup-guide";` · tags starting with tc- are custom elements |
| Angular | `import { SetupGuide } from "@adamstavely/trenchcoat/angular/setup-guide";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/setup-guide";` |

## Example

The live example is in the gallery at `#/setup-guide`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An onboarding checklist for getting a new account ready: a progress bar for all the tasks, and the tasks in groups
that fold open one at a time. Tasks unlock in order – the first open task in a group is the current one, the ones
after it wait – and ticking a task strikes it through. When the last task of a group is ticked, the group folds away
and the next unfinished one opens. People can minimise the guide to its header and come back to it.

### When to use

- First-run setup that takes several sessions: connecting a domain, adding products, inviting a team.
- Tasks that build on each other, where doing them in order matters.
- A panel at the side of a dashboard, alongside the work people are setting up.

### When not to use

- A form people fill in one step at a time, in one sitting – use [Stepper Form](stepper-form.md).
- Showing where a single job or order is in its process – use [Progress Tracker](progress-tracker.md).
- Hints and tips without tasks to finish – use [Tips Panel](tips-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the title, Edit, Minimise and Close
2. **Progress** `.ui-sg__track` – how many of all the tasks are done
3. **Group** `.ui-sg__group-head` – a group's title, which opens and closes it
4. **Task** `.ui-sg__task` – a tick box and the task; struck through when done, waiting when locked

## Looks

Standard puts the header on a gray tray above a white card with a meter-style progress bar across it; the current task's tick box has a visible edge and
a finished group's title has a line drawn through it. Clean is one white card with hairline shadows, a thin blue
progress line with a “4/9” count next to it, an open ring for the current task, a dashed ring for locked ones and a
hairline through finished titles. Groups fold open and closed the same way in both.

## Usage

### HTML

```html
<tc-setup-guide id="guide" heading="Setup guide" closable></tc-setup-guide>

<script type="module">
  import "@adamstavely/trenchcoat/setup-guide";
  import "@adamstavely/trenchcoat/tokens.css";

  const guide = document.querySelector("#guide");
  guide.groups = [
    {
      id: "basics",
      title: "Set up your store",
      tasks: [
        { id: "name", label: "Name your store", done: true },
        { id: "domain", label: "Connect a custom domain" },
      ],
    },
    { id: "products", title: "Add products", tasks: [{ id: "first-product", label: "Add your first product" }] },
  ];
  guide.addEventListener("tc-done-change", (e) => console.log(e.detail.done));
</script>
```

### React / Next.js

```tsx
import { SetupGuide, type SetupGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: SetupGroup[] = [
  {
    id: "basics",
    title: "Set up your store",
    tasks: [
      { id: "name", label: "Name your store", done: true },
      { id: "domain", label: "Connect a custom domain" },
    ],
  },
  { id: "products", title: "Add products", tasks: [{ id: "first-product", label: "Add your first product" }] },
];

export function Onboarding({ onHide }: { onHide: () => void }) {
  return <SetupGuide title="Setup guide" groups={groups} onDoneChange={(done) => console.log(done)} onClose={onHide} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/setup-guide";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";

defineProps<{ groups: TcSetupGuide["groups"]; done: TcSetupGuide["done"] }>();
const onDoneChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-setup-guide :groups="groups" :done="done" @tc-done-change="onDoneChange"></tc-setup-guide>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SetupGuide } from "@adamstavely/trenchcoat/angular/setup-guide";
import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";

@Component({
  selector: "app-setup-guide-example",
  imports: [SetupGuide],
  template: `<tc-setup-guide [groups]="groups()" [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-setup-guide>`,
})
export class SetupGuideExample {
  readonly groups = input.required<TcSetupGuide["groups"]>();
  readonly done = input.required<TcSetupGuide["done"]>();
  onDoneChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/setup-guide";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";

  let { groups, done }: { groups: TcSetupGuide["groups"]; done: TcSetupGuide["done"] } = $props();
  let el: TcSetupGuide;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-setup-guide bind:this={el} {groups} {done}></tc-setup-guide>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Setup guide"` | The heading, and the region's name |
| `groups` | – | `SetupGroup[]` | `[]` | The task groups. Each task's `done` flag is where it starts; when the flags change, the guide follows them |
| `done` | – | `string[] \| undefined` | `undefined` | Ids of the finished tasks; unset follows the tasks' flags. Changed by a tick unless tc-done-change is prevented |
| `openGroup` | – | `string \| null \| undefined` | `undefined` | Id of the unfolded group, null for none; unset unfolds the first unfinished group |
| `minimized` | `minimized` | `boolean` | `false` | The body is collapsed to the header |
| `editable` | `editable` | `boolean` | `false` | Shows an "Edit" link in the header (fires tc-edit) |
| `closable` | `closable` | `boolean` | `false` | Shows a close button in the header (fires tc-close) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-done-change` | – | Yes | A task was ticked or cleared (detail: { done: string[] }, the ids of all finished tasks); cancelable |
| `tc-open-group-change` | – | Yes | A group unfolded or folded, also when a finished group folds away on its own (detail: { openGroup: string \| null }); cancelable |
| `tc-minimized-change` | – | Yes | The body was collapsed or expanded (detail: { minimized: boolean }); cancelable |
| `tc-edit` | – | No | The Edit link was pressed (shown with `editable`); detail: null |
| `tc-close` | – | No | The close button was pressed (shown with `closable`); detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-setup-guide-mark-bg-hover` | `light-dark(#d3d7de, #4a4a50)` | standard |

#### Design tokens it reads (63)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-control`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-setup-guide :groups="…">` | `<tc-setup-guide [groups]="…">` | `<tc-setup-guide {groups}>` |
| `done` | `el.done = …;` | `<… done={…} />` | `<tc-setup-guide :done="…">` | `<tc-setup-guide [done]="…">` | `<tc-setup-guide {done}>` |
| `openGroup` | `el.openGroup = …;` | `<… openGroup={…} />` | `<tc-setup-guide :openGroup="…">` | `<tc-setup-guide [openGroup]="…">` | `<tc-setup-guide {openGroup}>` |

*Also attributes: `heading`, `minimized`, `editable`, `closable` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-done-change` | Yes | `el.addEventListener("tc-done-change", (e) => …)` | `onDoneChange={…}` | `@tc-done-change="…"` | `(tc-done-change)="…($event)"` | `el.addEventListener("tc-done-change", …)` |
| `tc-open-group-change` | Yes | `el.addEventListener("tc-open-group-change", (e) => …)` | `onOpenGroupChange={…}` | `@tc-open-group-change="…"` | `(tc-open-group-change)="…($event)"` | `el.addEventListener("tc-open-group-change", …)` |
| `tc-minimized-change` | Yes | `el.addEventListener("tc-minimized-change", (e) => …)` | `onMinimizedChange={…}` | `@tc-minimized-change="…"` | `(tc-minimized-change)="…($event)"` | `el.addEventListener("tc-minimized-change", …)` |
| `tc-edit` | No | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

### Controlled

The element changes `done`, `openGroup` and `minimized` itself unless a listener calls `preventDefault()` on `tc-done-change`, `tc-open-group-change` or `tc-minimized-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-setup-guide id="setup-guide"></tc-setup-guide>

<script type="module">
  import "@adamstavely/trenchcoat/setup-guide";

  const el = document.querySelector("#setup-guide");
  el.addEventListener("tc-done-change", (e) => {
    e.preventDefault(); // the element keeps its done…
    if (allowed(e.detail.done)) el.done = e.detail.done; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SetupGuide } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SetupGuide>;
type Props = Omit<Own, "done" | "onDoneChange"> & { initial: NonNullable<Own["done"]> };

// Controlled: passing done makes the wrapper prevent the element's own change; the app sets it
export function ControlledSetupGuide({ initial, ...props }: Props) {
  const [done, setDone] = useState<Own["done"]>(initial);
  return <SetupGuide {...props} done={done} onDoneChange={(next) => setDone(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/setup-guide";
import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";

const props = defineProps<{ initial: TcSetupGuide["done"] }>();
const done = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDoneChange = (e: CustomEvent<{ done: TcSetupGuide["done"] }>) => {
  e.preventDefault();
  done.value = e.detail.done;
};
</script>

<template>
  <tc-setup-guide :done="done" @tc-done-change="onDoneChange"></tc-setup-guide>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SetupGuide } from "@adamstavely/trenchcoat/angular/setup-guide";
import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";

@Component({
  selector: "app-controlled-setup-guide",
  imports: [SetupGuide],
  template: `<tc-setup-guide [done]="done()" (tc-done-change)="onDoneChange($event)"></tc-setup-guide>`,
})
export class ControlledSetupGuide {
  readonly initial = input.required<TcSetupGuide["done"]>();
  readonly done = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDoneChange(e: CustomEvent<{ done: TcSetupGuide["done"] }>) {
    e.preventDefault();
    this.done.set(e.detail.done);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/setup-guide";
  import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";

  let { initial }: { initial: TcSetupGuide["done"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let done = $derived(initial);
  let el: TcSetupGuide;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      done = (e as CustomEvent<{ done: TcSetupGuide["done"] }>).detail.done;
    };
    el.addEventListener("tc-done-change", on);
    return () => el.removeEventListener("tc-done-change", on);
  });
</script>

<tc-setup-guide bind:this={el} {done}></tc-setup-guide>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-setup-guide")` returns a `TcSetupGuide` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";`
- **React / Next.js:** Props: `import type { SetupGuideProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SetupGuide>`. The element class, for refs: `import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSetupGuide["groups"]` with `import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";`
- **Angular:** The directive types the template: `[groups]` takes `TcSetupGuide["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSetupGuide } from "@adamstavely/trenchcoat/setup-guide";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `groups` | `SetupGroup[]` | The task groups. Each task's `done` flag is where it starts; when the flags change, the guide follows them |
| `done` | `string[]` | Ids of the finished tasks. Controlled when defined – pair it with `onDoneChange` |
| `defaultDone` | `string[]` | Ids finished on mount when `done` isn't controlled – defaults to the tasks marked `done` |
| `onDoneChange` | `(done: string[]) => void` | Called with the ids of all finished tasks whenever a task is ticked or cleared |
| `onChange` | `(done: string[]) => void` | Called with the ids of all finished tasks, like `onDoneChange` |
| `openGroup` | `string \| null` | Id of the unfolded group, `null` for none. Controlled when defined – pair it with `onOpenGroupChange` |
| `defaultOpenGroup` | `string \| null` | Group unfolded on mount when `openGroup` isn't controlled – defaults to the first unfinished group |
| `onOpenGroupChange` | `(id: string \| null) => void` | Called when a group unfolds or folds – also when a finished group folds away on its own |
| `minimized` | `boolean` | Whether the body is collapsed to the header. Controlled when defined – pair it with `onMinimizedChange` |
| `defaultMinimized` | `boolean` | Whether the body starts collapsed when `minimized` isn't controlled |
| `onMinimizedChange` | `(minimized: boolean) => void` | Called when the body is collapsed or expanded |
| `onEdit` | `() => void` | Shows an "Edit" link in the header |
| `onClose` | `() => void` | Shows a close button in the header |

*Renamed or hidden on the wrapper: `heading`, `groups`, `done`, `openGroup`, `minimized`, `editable`, `closable`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Edit, Minimise, Close, the group headers and the open group's tasks |
| Enter / Space | On a group header: opens or closes it; on a task: ticks or clears it |
| Enter / Space | On Minimise: collapses the guide to its header, or expands it |

Locked tasks are disabled, so Tab skips them. When the last task of a group is ticked, focus moves to that group's
header before the group folds away.

### Screen readers

The host is a region named by the heading. The progress bar is a `progressbar` named “Setup guide progress” with its
percentage. Minimise is named “Minimize setup guide” or “Expand setup guide” and has `aria-expanded`; Close is “Close
setup guide”. Group headers are buttons with `aria-expanded` and `aria-controls`, and a finished group adds “, done” to
its title. Tasks are checkboxes with `aria-checked`; a locked task adds “– finish the task before it first”. Closed
groups and a minimised body are inert.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
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
| **This component alone** | 28.1 KB | 6.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **36.6 KB** | **9.2 KB** |
| With Lit – the first component on a page | 59.1 KB | 16.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.8 ms** | the gallery demo's data, 100 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of groups replaced |
| First on the page | 9.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 26 ms | groups: first render, 2,653 nodes; update 2.3 ms |
| 1,000 items | 135 ms | groups: first render, 26,353 nodes; update 8.3 ms |

1,000 items of groups: 135 ms. It renders every item, so a first render passes 50 ms (a long task) at about 370 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name groups by the outcome: “Set up your store”, “Get ready to launch”.
- Start each task with a verb and keep it to one line: “Connect a custom domain”, “Place a test order”.
- Order tasks the way they depend on each other – only the first unfinished one in a group can be ticked.
- Keep it to three to five groups of two to five tasks.

## Do and don't

### Do

- Mark tasks the product already knows are done with `done: true` – the guide follows the flags when they change.
- Tick tasks for people when they finish them elsewhere in the product, by updating the flags or `done`.
- Offer `closable` once the guide is mostly done, and a way to bring it back.

### Don't

- Don't put tasks in a group that can be done in any order and lock them anyway – split them into groups instead.
- Don't use it for required steps people can't skip; it's a guide, not a gate.
- Don't rely on Edit or Close doing anything on their own: they only fire `tc-edit` and `tc-close`.

## Related

- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state

## Changelog

- setup-guide `onChange` → `onDoneChange` (same arguments)
