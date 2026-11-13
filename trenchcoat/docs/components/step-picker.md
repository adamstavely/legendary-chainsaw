<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Step Picker

**AI configuration** · New

What to add next to a workflow – a search over step kinds and tools grouped as Triggers, AI, Tools, Logic, People and Output, led by suggested steps with why and recent ones, inline or as a popover by the button that opened it

- **Element:** `<tc-step-picker>`
- **Size:** 21.2 KB gzip · 72.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/step-picker";` |
| React / Next.js | `import { StepPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/step-picker";` · tags starting with tc- are custom elements |
| Angular | `import { StepPicker } from "@adamstavely/trenchcoat/angular/step-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/step-picker";` |

## Example

The live example is in the gallery at `#/step-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What to add next to a workflow. A search field sits over the step kinds and tools, grouped into Triggers, AI, Tools,
Logic, People and Output, each with its icon and one line on what it does. With nothing typed it leads with
Suggested steps, each saying why ("Usually comes after Match purchase order"), and Recent ones. Typing filters every
group, matching the name, the description, the tool and extra keywords.

Inline, it sits in a panel of its own. As a popover, it floats by the button that opened it – the Add step button of
a `workflow-canvas`, say – and closes once a step is picked.

### When to use

- Adding a step to an agent workflow, from the canvas's Add step or a "+" between steps.
- Choosing an action or tool from a catalogue of a few dozen, where a hint about what fits next helps.

### When not to use

- Searching and running commands across an app – use [Command Menu](command-menu.md).
- Setting up one tool's parameters – use [Tool Configuration](tool-configuration.md).
- Editing a step that's already there – use [Step Inspector](step-inspector.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-stp__search` – the field and its icon
2. **List** `.ui-stp__list` – the steps, in groups
3. **Group** `.ui-stp__group-label` – Suggested, Recent, then each group's name
4. **Step** `.ui-stp__option` – icon, name, what it does (or why it's suggested) and its tool
5. **Tool** `.ui-stp__tool` – the tool or integration it uses
6. **Popover** `.ui-stp__pop` – the floating panel, in popover layout

## Looks

Standard is a white card on a gray tray, with the header on the tray above it; Clean is one white card. As a popover
it keeps its look and floats over the page. Set its width with `--tc-stp-w` and the list's height with `--tc-stp-h`.

## Usage

### HTML

```html
<tc-step-picker id="picker" description="After “Match purchase order”"></tc-step-picker>

<script type="module">
  import "@adamstavely/trenchcoat/step-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#picker");
  picker.suggestions = [{ id: "condition", reason: "Usually comes after Match purchase order" }];
  picker.recent = ["extract"];
  picker.addEventListener("tc-pick", (e) => console.log("add", e.detail.kind, e.detail.item.label));
</script>
```

### React / Next.js

```tsx
import { useRef, useState } from "react";
import { StepPicker } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AddStep({ onAdd }: { onAdd: (kind: string, label: string) => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <button ref={button} type="button" aria-expanded={open} onClick={() => setOpen(true)}>
        Add step
      </button>
      <StepPicker layout="popover" anchor={button.current} open={open} onOpenChange={setOpen} onPick={(kind, item) => onAdd(kind, item.label)} />
    </>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/step-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";

defineProps<{ items: TcStepPicker["items"]; groups: TcStepPicker["groups"] }>();
const onPick = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-step-picker :items="items" :groups="groups" @tc-pick="onPick"></tc-step-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StepPicker } from "@adamstavely/trenchcoat/angular/step-picker";
import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";

@Component({
  selector: "app-step-picker-example",
  imports: [StepPicker],
  template: `<tc-step-picker [items]="items()" [groups]="groups()" (tc-pick)="onPick($event)"></tc-step-picker>`,
})
export class StepPickerExample {
  readonly items = input.required<TcStepPicker["items"]>();
  readonly groups = input.required<TcStepPicker["groups"]>();
  onPick(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/step-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";

  let { items, groups }: { items: TcStepPicker["items"]; groups: TcStepPicker["groups"] } = $props();
  let el: TcStepPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-pick", on);
    return () => el.removeEventListener("tc-pick", on);
  });
</script>

<tc-step-picker bind:this={el} {items} {groups}></tc-step-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Add a step"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `StepPickerItem[]` | `[ { id: "webhook", kind: "trigger", group: "triggers", label: "Webhook", description: "Starts when another system sends a request", keywords: "http api event" }, { id: "schedule", kind: "trigger", group: "triggers", label: "Schedule", description: "Starts at set times, like every weekday at 9", keywords: "cron time recurring" }, { id: "email-received", kind: "trigger", group: "triggers", label: "Email received", description: "Starts when a message arrives in a mailbox", keywords: "inbox mail" }, { id: "classify", kind: "llm", group: "ai", label: "Classify", description: "Sorts the input into categories you name", keywords: "label categorise route" }, { id: "extract", kind: "llm", group: "ai", label: "Extract fields", description: "Pulls named fields out of a document", keywords: "parse invoice ocr" }, { id: "summarise", kind: "llm", group: "ai", label: "Summarise", description: "Writes a short summary of the input", keywords: "summary tldr" }, { id: "http", kind: "tool", group: "tools", label: "HTTP request", description: "Calls any API and returns its response", keywords: "api rest fetch" }, { id: "search-records", kind: "tool", group: "tools", label: "Search records", description: "Finds matching rows in a connected system", tool: "Records", keywords: "lookup find query" }, { id: "update-record", kind: "tool", group: "tools", label: "Update record", description: "Changes fields on a record", tool: "Records", keywords: "write edit" }, { id: "condition", kind: "condition", group: "logic", label: "Condition", description: "Takes one path or another by a rule", keywords: "if branch else" }, { id: "wait", kind: "condition", group: "logic", label: "Wait", description: "Pauses for a time or until something happens", keywords: "delay sleep timer" }, { id: "approval", kind: "approval", group: "people", label: "Approval", description: "Waits for a person to approve or reject", keywords: "review sign off human" }, { id: "ask", kind: "approval", group: "people", label: "Ask a question", description: "Asks a person for missing information", keywords: "human input form" }, { id: "send-email", kind: "output", group: "output", label: "Send email", description: "Sends a message to people you choose", keywords: "mail notify" }, { id: "post-message", kind: "output", group: "output", label: "Post a message", description: "Posts to a team channel", keywords: "notify chat" }, ]` | Every step that can be added |
| `groups` | – | `StepPickerGroup[]` | `[ { id: "triggers", label: "Triggers" }, { id: "ai", label: "AI" }, { id: "tools", label: "Tools" }, { id: "logic", label: "Logic" }, { id: "people", label: "People" }, { id: "output", label: "Output" }, ]` | The groups, in order; an item whose group isn't here is left out |
| `suggestions` | – | `StepSuggestion[]` | `[]` | Steps to suggest when nothing is typed, each with why ("Usually comes after Classify") |
| `recent` | – | `string[]` | `[]` | Ids of recently added steps, newest first – shown when nothing is typed |
| `query` | `query` | `string` | `""` | The search text. Changed by the user unless a tc-query-change listener calls preventDefault() |
| `placeholder` | `placeholder` | `string` | `"Search steps and tools…"` | Placeholder text in the search field |
| `layout` | `layout` | `StepPickerLayout` | `"inline"` | "inline" (the default) or "popover" – floated by `anchor` while `open` |
| `open` | `open` | `boolean` | `false` | In popover layout: whether it's showing. Closed by the user (Escape, outside, a pick) unless prevented |
| `anchor` | – | `HTMLElement \| null` | `null` | In popover layout: the element it floats by, and where focus returns when it closes |
| `kinds` | – | `Record<string, Partial<WorkflowKindInfo>>` | `{}` | Labels and icons for kinds the page adds, merged over the workflow defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-pick` | – | Yes | A step was chosen ({ id, kind, tool, item }: StepPick); cancelable – prevented, a popover stays open |
| `tc-query-change` | – | Yes | The search text changed ({ query }: StepPickerQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-open-change` | – | Yes | The popover opened or closed ({ open }: StepPickerOpenChange); cancelable – prevented, `open` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-stp-w` | `420px` | both |
| `--tc-stp-h` | `360px` | both |
| `--tc-stp-kind` | `var(--tc-icon-muted)` | not set – this fallback applies |

#### Design tokens it reads (55)

`--tc-accent`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-chart-1`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-divider`, `--tc-fill-default`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-pill-font-size`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-shadow-overlay`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-solid`, `--tc-tone-pink-solid`, `--tc-tone-teal-solid`, `--tc-tone-violet-solid`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultStepItems: StepPickerItem[]` | A starting catalogue – replace it with your own steps and tools |

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-step-picker :items="…">` | `<tc-step-picker [items]="…">` | `<tc-step-picker {items}>` |
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-step-picker :groups="…">` | `<tc-step-picker [groups]="…">` | `<tc-step-picker {groups}>` |
| `suggestions` | `el.suggestions = …;` | `<… suggestions={…} />` | `<tc-step-picker :suggestions="…">` | `<tc-step-picker [suggestions]="…">` | `<tc-step-picker {suggestions}>` |
| `recent` | `el.recent = …;` | `<… recent={…} />` | `<tc-step-picker :recent="…">` | `<tc-step-picker [recent]="…">` | `<tc-step-picker {recent}>` |
| `anchor` | `el.anchor = …;` | `<… anchor={…} />` | `<tc-step-picker :anchor="…">` | `<tc-step-picker [anchor]="…">` | `<tc-step-picker {anchor}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-step-picker :kinds="…">` | `<tc-step-picker [kinds]="…">` | `<tc-step-picker {kinds}>` |

*Also attributes: `heading`, `description`, `query`, `placeholder`, `layout`, `open` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-pick` | Yes | `el.addEventListener("tc-pick", (e) => …)` | `onPick={…}` | `@tc-pick="…"` | `(tc-pick)="…($event)"` | `el.addEventListener("tc-pick", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `query` and `open` itself unless a listener calls `preventDefault()` on `tc-query-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-step-picker id="step-picker"></tc-step-picker>

<script type="module">
  import "@adamstavely/trenchcoat/step-picker";

  const el = document.querySelector("#step-picker");
  el.addEventListener("tc-query-change", (e) => {
    e.preventDefault(); // the element keeps its query…
    if (allowed(e.detail.query)) el.query = e.detail.query; // …until the app sets it
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
import "@adamstavely/trenchcoat/step-picker";
import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";

const props = defineProps<{ initial: TcStepPicker["query"] }>();
const query = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onQueryChange = (e: CustomEvent<{ query: TcStepPicker["query"] }>) => {
  e.preventDefault();
  query.value = e.detail.query;
};
</script>

<template>
  <tc-step-picker :query="query" @tc-query-change="onQueryChange"></tc-step-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { StepPicker } from "@adamstavely/trenchcoat/angular/step-picker";
import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";

@Component({
  selector: "app-controlled-step-picker",
  imports: [StepPicker],
  template: `<tc-step-picker [query]="query()" (tc-query-change)="onQueryChange($event)"></tc-step-picker>`,
})
export class ControlledStepPicker {
  readonly initial = input.required<TcStepPicker["query"]>();
  readonly query = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onQueryChange(e: CustomEvent<{ query: TcStepPicker["query"] }>) {
    e.preventDefault();
    this.query.set(e.detail.query);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/step-picker";
  import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";

  let { initial }: { initial: TcStepPicker["query"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let query = $derived(initial);
  let el: TcStepPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      query = (e as CustomEvent<{ query: TcStepPicker["query"] }>).detail.query;
    };
    el.addEventListener("tc-query-change", on);
    return () => el.removeEventListener("tc-query-change", on);
  });
</script>

<tc-step-picker bind:this={el} {query}></tc-step-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-step-picker")` returns a `TcStepPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";`
- **React / Next.js:** Props: `import type { StepPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof StepPicker>`. The element class, for refs: `import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStepPicker["items"]` with `import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";`
- **Angular:** The directive types the template: `[items]` takes `TcStepPicker["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStepPicker } from "@adamstavely/trenchcoat/step-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `query` | `string` | The search text – controlled when given |
| `defaultQuery` | `string` | The search text on mount when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The search text changed |
| `open` | `boolean` | In popover layout: whether it's showing – controlled when given |
| `defaultOpen` | `boolean` | Whether it shows on mount when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The popover opened or closed |
| `anchor` | `HTMLElement \| null` | In popover layout: the element it floats by – a ref's current element |
| `onPick` | `(kind: string, item: StepPickerItem, tool?: string) => void \| boolean` | A step was chosen; return false to keep a popover open |

*Renamed or hidden on the wrapper: `heading`, `query`, `open`, `anchor`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| Typing | Filters the steps |
| ↓ / ↑ | Moves to the next or previous step, wrapping round |
| Home / End | With nothing typed (or with Ctrl), moves to the first or last step |
| Enter | Adds the highlighted step |
| Escape | Clears the search; with nothing typed, closes the popover and returns focus to what opened it |
| Tab | Leaves – a popover closes |

### Screen readers

The field is a combobox controlling a listbox named by the heading; the highlighted step is its active descendant,
so focus stays in the field. Steps are options in named groups, each reading its name and its description or why
it's suggested, then its tool. While typing, a polite status message says how many steps match, and adding a step
confirms it ("Added Condition"). As a popover, the panel is a dialog named by the heading.

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
| Container size queries | 105 | 110 | 16 | 16 | itself, workflow-canvas | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit, workflow-canvas | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself, workflow-canvas | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover, workflow-canvas | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, workflow-canvas, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover, workflow-canvas | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, workflow-canvas, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.7 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [workflow-canvas](workflow-canvas.md) · Element it renders | 39.0 KB | – |
| **Added to a page that already has Lit** | **72.8 KB** | **21.2 KB** |
| With Lit – the first component on a page | 95.0 KB | 28.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 187 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of items replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | items: first render, 857 nodes; update 0.5 ms |
| 1,000 items | 28 ms | items: first render, 7,997 nodes; update 3.8 ms |

1,000 items of items: 28 ms, 7,997 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController), `ResizeObserver` (workflow-canvas).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name steps for what they do: "Extract fields", "Send email", "Ask a question".
- Keep descriptions to one line in plain words: "Waits for a person to approve or reject".
- Give a suggestion a reason only when you have one; leave it out rather than invent one.
- Add `keywords` for the words people search with that aren't in the name: "if", "branch", "cron".

## Do and don't

### Do

- Suggest two or three steps that usually follow the step being added after.
- Keep Recent short – the picker shows the four newest.
- Close the popover and place the step yourself on `tc-pick`.

### Don't

- Don't list every operation of every tool; group them under the tool and let search find them.
- Don't use the picker for settings – it only chooses what to add.

## Related

- [Workflow Canvas](workflow-canvas.md) – An agent workflow as a node graph – step cards with their kind, status in a mark and a word, and curved labelled connectors; pan and zoom, drag steps and connect them from their ports or the keyboard (M moves, C connects, A adds), a flowing connector into the running step, and the same graph as a list
- [Step Inspector](step-inspector.md) – One workflow step's settings – its title and each input with where it comes from, typed in or mapped from an earlier step's output as a chip ("Extract fields › amount"), what's missing in words, Test with sample, and the last run's input and output as JSON
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Tool Configuration](tool-configuration.md) – A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs
