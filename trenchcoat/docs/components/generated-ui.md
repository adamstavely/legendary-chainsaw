<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Generated UI

**AI & chat** · New

A model's answer drawn as real components – tables, charts, metrics, forms and callouts from a spec, checked as it arrives, with plain text for anything unknown

- **Element:** `<tc-generated-ui>`
- **Size:** 2421.4 KB gzip · 9712.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/generated-ui";` |
| React / Next.js | `import { GeneratedUi } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/generated-ui";` · tags starting with tc- are custom elements |
| Angular | `import { GeneratedUi } from "@adamstavely/trenchcoat/angular/generated-ui";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/generated-ui";` |

## Example

The live example is in the gallery at `#/generated-ui`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A model's answer drawn as real components instead of a wall of text. The model writes a small JSON spec – text,
metric tiles, tables, charts, forms and callouts, grouped and nested – and the element draws each block with the
library's own parts: `tc-data-table`, `tc-kpi-chart`, metric tiles with change-summary's trend marks, stepper-form's
fields. Every block is checked first; anything unknown or malformed falls back to its text, so one bad block never
breaks the answer. The spec can stream in as text: each block appears once it's complete. Nothing in the spec is
ever rendered as HTML, and every button and form comes back to the app as one event, `tc-action`.

### When to use

- An assistant that answers with numbers, comparisons or follow-up questions people should act on, not only read.
- Small forms the model needs filled in to continue – an address, a choice between options, a date.
- Answers where the app wants to keep the model to a known set of components rather than free-form markup.

### When not to use

- Showing the raw structured output and whether it matches its schema – use [Structured Output](structured-output.md).
- A screen your team designs and builds – compose [Data Table](data-table.md), [KPI Chart](kpi-chart.md) and the rest directly.
- Several questions the agent asks before it starts, answered as one reply – use [Clarifying Questions](clarifying-questions.md).
- A multi-step form – use [Stepper Form](stepper-form.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Metric** `.ui-gui__metric` – a label, the value and a change with its trend mark
2. **Chart** `.ui-gui__chart` – a `tc-kpi-chart`, lines coloured with the chart tokens
3. **Table** `.ui-gui__table` – a read-only `tc-data-table`
4. **Text fallback** `.ui-gui__fallback` – a block that couldn't be drawn, shown as its text
5. **Callout** `.ui-gui__callout` – a tinted note with its tone's icon, nested blocks and action buttons
6. **Form** `.ui-gui__form` – stepper-form's fields with a submit button

## Looks

Standard sets metric tiles on the gray tray colour and the form on a gray tray around a white card, as stepper-form
does. Clean draws tiles and the form as white cards with hairline shadows, uses medium rather than semibold
headings and quieter body text. Tables and charts follow the look through their own elements.

## Usage

### HTML

```html
<tc-generated-ui id="answer"></tc-generated-ui>

<script type="module">
  import "@adamstavely/trenchcoat/generated-ui";
  import "@adamstavely/trenchcoat/tokens.css";

  const answer = document.querySelector("#answer");
  answer.spec = {
    blocks: [
      { type: "metric", label: "Sign-ups", value: "4,812", change: "Up 38%", tone: "good" },
      { type: "callout", tone: "warning", title: "Paid search is over budget", actions: [{ id: "cap", label: "Cap spend" }] },
    ],
  };
  answer.addEventListener("tc-action", (e) => console.log(e.detail.kind, e.detail.action, e.detail.values));
</script>
```

### React / Next.js

```tsx
import { GeneratedUi, type GeneratedUiActionDetail } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Answer({ text, streaming }: { text: string; streaming: boolean }) {
  const onAction = (a: GeneratedUiActionDetail) => {
    if (a.kind === "submit" && a.action === "schedule-report") console.log(a.values);
  };
  return <GeneratedUi spec={text} streaming={streaming} onAction={onAction} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/generated-ui";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";

defineProps<{ spec: TcGeneratedUi["spec"]; allowedOrigins: TcGeneratedUi["allowedOrigins"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-generated-ui :spec="spec" :allowedOrigins="allowedOrigins" @tc-action="onAction"></tc-generated-ui>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GeneratedUi } from "@adamstavely/trenchcoat/angular/generated-ui";
import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";

@Component({
  selector: "app-generated-ui-example",
  imports: [GeneratedUi],
  template: `<tc-generated-ui [spec]="spec()" [allowedOrigins]="allowedOrigins()" (tc-action)="onAction($event)"></tc-generated-ui>`,
})
export class GeneratedUiExample {
  readonly spec = input.required<TcGeneratedUi["spec"]>();
  readonly allowedOrigins = input.required<TcGeneratedUi["allowedOrigins"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/generated-ui";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";

  let { spec, allowedOrigins }: { spec: TcGeneratedUi["spec"]; allowedOrigins: TcGeneratedUi["allowedOrigins"] } = $props();
  let el: TcGeneratedUi;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-generated-ui bind:this={el} {spec} {allowedOrigins}></tc-generated-ui>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `spec` | – | `GeneratedUiSpec \| string \| null \| undefined` | `undefined` | The spec: { blocks }, a list of blocks or one block – or the model's JSON text, which may still be arriving |
| `streaming` | `streaming` | `boolean` | `false` | The spec text is still arriving: blocks show as they close, the one being written is a placeholder |
| `showIssues` | `show-issues` | `boolean` | `false` | Show why a block fell back to text, under it – for development and evaluation, not for end users |
| `allowedOrigins` | – | `readonly string[] \| undefined` | `undefined` | Origins that images in placed components may load from ("https://cdn.example.com"); unset, any http(s) origin |
| `headingLevel` | `heading-level` | `number` | `3` | The heading level of text headings, group and form titles (2–6); the tables' own titles stay h3 |
| `issues` | – | `GeneratedUiIssue[]` | – | What fell back to text, and why, and the props of a component that were left out – by JSON Pointer path |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | No | A form was submitted or an action pressed ({ kind: "submit" \| "action", action, block, values? }) |
| `tc-spec-check` | – | No | The spec settled (not streaming) and what fell back to text, or a component's props it left out, changed ({ issues }) |
| `tc-component-event` | – | Yes | A component the model placed fired one of its events ({ block, tag, event, detail }: GeneratedUiComponentEvent); cancelable when the component's event is – preventing it prevents that |

#### Design tokens it reads (5)

`--tc-font-sans`, `--tc-font-size-md`, `--tc-line-height-normal`, `--tc-space-3`, `--tc-text-primary`

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
| `spec` | `el.spec = …;` | `<… spec={…} />` | `<tc-generated-ui :spec="…">` | `<tc-generated-ui [spec]="…">` | `<tc-generated-ui {spec}>` |
| `allowedOrigins` | `el.allowedOrigins = …;` | `<… allowedOrigins={…} />` | `<tc-generated-ui :allowedOrigins="…">` | `<tc-generated-ui [allowedOrigins]="…">` | `<tc-generated-ui {allowedOrigins}>` |

*Also attributes: `streaming`, `show-issues`, `heading-level` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-spec-check` | No | `el.addEventListener("tc-spec-check", (e) => …)` | `onSpecCheck={…}` | `@tc-spec-check="…"` | `(tc-spec-check)="…($event)"` | `el.addEventListener("tc-spec-check", …)` |
| `tc-component-event` | Yes | `el.addEventListener("tc-component-event", (e) => …)` | `onComponentEvent={…}` | `@tc-component-event="…"` | `(tc-component-event)="…($event)"` | `el.addEventListener("tc-component-event", …)` |

### Controlled

`tc-component-event` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-generated-ui")` returns a `TcGeneratedUi` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";`
- **React / Next.js:** Props: `import type { GeneratedUiProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GeneratedUi>`. The element class, for refs: `import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGeneratedUi["spec"]` with `import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";`
- **Angular:** The directive types the template: `[spec]` takes `TcGeneratedUi["spec"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGeneratedUi } from "@adamstavely/trenchcoat/generated-ui";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onAction` | `(action: GeneratedUiActionDetail) => void` | Called when a form is submitted (with its values) or an action button is pressed |
| `onSpecCheck` | `(issues: GeneratedUiSpecCheck["issues"]) => void` | Called once the spec settles with the blocks that fell back to text, and why |
| `onComponentEvent` | `(event: GeneratedUiComponentEvent) => boolean \| void` | Called when a component the model placed fires one of its events; return false to prevent it (when it can be) |

## Accessibility

### Keyboard

The element adds no keys of its own: Tab moves through its buttons, form fields and the table and chart, which keep
their own keyboard (the table's grid, the chart's ← → and the choice cards' arrow keys).

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the actions, fields, table and chart |
| Enter in a text field | Submits the form |
| Enter / Space on a button | Presses the action, or submits the form |

When a submit finds problems, focus moves to the first field with one.

### Screen readers

Text headings, group and form titles are `role="heading"` with `aria-level` from `headingLevel` (3 by default); the
form is named by its title, and a group with a title is a named `section`. Every field is labelled by its
stepper-form label; a field with a problem is `aria-invalid` and described by its message (“Fill this in”, “That
doesn't look like an email address”). A polite status says “2 fields need attention” after a failed submit. Metric
changes are said in words as well as colour (“Good change: Up 38%”), and a callout starts with its tone (“Warning:
…”). While the spec streams, the blocks are `aria-busy` and the placeholder is hidden from screen readers.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | data-table, stepper-form, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | stepper-form | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | structured-output, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, kpi-chart, stepper-form, structured-output | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, stepper-form | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, data-table, internal/kit, kpi-chart, stepper-form, structured-output | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | data-table, stepper-form | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself, src/generative/validate | – |
| inset | 87 | 66 | 14.1 | 14.1 | data-table, kpi-chart, stepper-form, structured-output | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, data-table, internal/base, kpi-chart, stepper-form, structured-output, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/controllers, stepper-form | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself, stepper-form | Paragraphs may end on a single short word. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | data-table, stepper-form | Scrollbars keep the browser's default width. |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | stepper-form | Titles break where the line fills up instead of into even lines. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, kpi-chart, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | stepper-form, structured-output | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.3 KB | 10.6 KB |
| Lit · the library every element is built on, the parts it uses | 26.4 KB | – |
| `internal/chart/element` · Shared Trenchcoat code | 18.7 KB | – |
| `internal/chart/spec` · Shared Trenchcoat code | 16.7 KB | – |
| `internal/chart/xy` · Shared Trenchcoat code | 15.5 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.4 KB | – |
| `internal/selection` · Shared Trenchcoat code | 10.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 8.8 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.4 KB | – |
| `internal/chart/pie` · Shared Trenchcoat code | 6.4 KB | – |
| `internal/chart/motion` · Shared Trenchcoat code | 5.1 KB | – |
| `internal/chart/force` · Shared Trenchcoat code | 4.5 KB | – |
| `internal/chart/brush` · Shared Trenchcoat code | 4.3 KB | – |
| `internal/chart/stats` · Shared Trenchcoat code | 3.5 KB | – |
| `internal/chart/parse` · Shared Trenchcoat code | 3.3 KB | – |
| `internal/chart/scale` · Shared Trenchcoat code | 3.2 KB | – |
| `internal/chart/geometry` · Shared Trenchcoat code | 3.2 KB | – |
| `internal/chart/sankey` · Shared Trenchcoat code | 3.1 KB | – |
| `internal/ansi` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/calendar-layout` · Shared Trenchcoat code | 2.6 KB | – |
| `internal/chart/series` · Shared Trenchcoat code | 2.5 KB | – |
| `internal/chart/format` · Shared Trenchcoat code | 2.4 KB | – |
| `internal/chart/loaders` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/chart/text` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/chart/hierarchy` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/chart/axis` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/chart/motion-controller` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/list-motion` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/selection-toolbar` · Shared Trenchcoat code | 1.4 KB | – |
| `internal/layered-graph` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/inline-details` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/stack` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/chart/bins` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/accessor` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/chart/chord` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/breakpoints` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/chart/hexbin` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/team-flag` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/chart/canvas` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/chart/highlight` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/source-line` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/chart/lazy` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/activity-scale` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/chart/i18n` · Shared Trenchcoat code | 0.1 KB | – |
| [chat-composer](chat-composer.md) · Element it renders | 132.2 KB | – |
| [review-center](review-center.md) · Element it renders | 100.6 KB | – |
| [agent-queue](agent-queue.md) · Element it renders | 88.7 KB | – |
| [project-flow](../illustrations/project-flow.md) · Element it renders | 85.1 KB | – |
| [multi-calendar](multi-calendar.md) · Element it renders | 80.4 KB | – |
| [agent-graph](agent-graph.md) · Element it renders | 78.9 KB | – |
| [stepper-form](stepper-form.md) · Element it renders | 78.6 KB | – |
| [region-dach](../illustrations/region-dach.md) · Element it renders | 69.8 KB | – |
| [memory-panel](memory-panel.md) · Element it renders | 63.4 KB | – |
| [evaluation-dataset-editor](evaluation-dataset-editor.md) · Element it renders | 61.9 KB | – |
| [client-context](../blocks/client-context.md) · Element it renders | 60.3 KB | – |
| [agent-plan](agent-plan.md) · Element it renders | 59.8 KB | – |
| [context-map](context-map.md) · Element it renders | 58.7 KB | – |
| [ai-answer](ai-answer.md) · Element it renders | 56.7 KB | – |
| [configuration-release-control](configuration-release-control.md) · Element it renders | 56.5 KB | – |
| [date-range-picker](date-range-picker.md) · Element it renders | 55.9 KB | – |
| [trace-waterfall](trace-waterfall.md) · Element it renders | 55.8 KB | – |
| [decision-tree](decision-tree.md) · Element it renders | 54.7 KB | – |
| [app-directory](../blocks/app-directory.md) · Element it renders | 53.2 KB | – |
| [integration-flow](../illustrations/integration-flow.md) · Element it renders | 51.9 KB | – |
| [tool-configuration](tool-configuration.md) · Element it renders | 50.9 KB | – |
| [data-table](data-table.md) · Element it renders | 50.7 KB | – |
| [transcript-review](transcript-review.md) · Element it renders | 50.6 KB | – |
| [integration-picker](integration-picker.md) · Element it renders | 49.3 KB | – |
| [agent-inbox](agent-inbox.md) · Element it renders | 48.9 KB | – |
| [json-viewer](json-viewer.md) · Element it renders | 48.2 KB | – |
| [ai-workspace](../blocks/ai-workspace.md) · Element it renders | 48.1 KB | – |
| [approval-card](approval-card.md) · Element it renders | 48.1 KB | – |
| [prompt-library](prompt-library.md) · Element it renders | 48.0 KB | – |
| [agent-tree](agent-tree.md) · Element it renders | 47.4 KB | – |
| [email-draft](email-draft.md) · Element it renders | 47.4 KB | – |
| [cited-answer](cited-answer.md) · Element it renders | 46.9 KB | – |
| [billing-schedule](billing-schedule.md) · Element it renders | 46.7 KB | – |
| [playbook-canvas](playbook-canvas.md) · Element it renders | 46.0 KB | – |
| [world-map](../illustrations/world-map.md) · Element it renders | 46.0 KB | – |
| [chat-history](chat-history.md) · Element it renders | 45.3 KB | – |
| [usage-meter](usage-meter.md) · Element it renders | 45.3 KB | – |
| [message-actions](message-actions.md) · Element it renders | 44.8 KB | – |
| [permission-request](permission-request.md) · Element it renders | 44.8 KB | – |
| [context-window](context-window.md) · Element it renders | 44.4 KB | – |
| [data-handling-policy](data-handling-policy.md) · Element it renders | 43.8 KB | – |
| [reliance-gauge](reliance-gauge.md) · Element it renders | 43.5 KB | – |
| [image-grid](image-grid.md) · Element it renders | 43.5 KB | – |
| [tool-call-card](tool-call-card.md) · Element it renders | 43.3 KB | – |
| [integration-settings](integration-settings.md) · Element it renders | 43.3 KB | – |
| [run-checkpoints](run-checkpoints.md) · Element it renders | 42.9 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.6 KB | – |
| [conversation-annotation](conversation-annotation.md) · Element it renders | 42.5 KB | – |
| [mcp-connection-manager](mcp-connection-manager.md) · Element it renders | 42.2 KB | – |
| [combobox](combobox.md) · Element it renders | 42.0 KB | – |
| [output-schema-builder](output-schema-builder.md) · Element it renders | 41.5 KB | – |
| [writing-assistant](writing-assistant.md) · Element it renders | 41.1 KB | – |
| [comments-panel](comments-panel.md) · Element it renders | 41.1 KB | – |
| [ai-summary](ai-summary.md) · Element it renders | 40.3 KB | – |
| [provider-connection](provider-connection.md) · Element it renders | 39.9 KB | – |
| [text-annotator](text-annotator.md) · Element it renders | 38.8 KB | – |
| [experiment-card](experiment-card.md) · Element it renders | 38.7 KB | – |
| [lineage-graph](lineage-graph.md) · Element it renders | 38.0 KB | – |
| [delegate-board](delegate-board.md) · Element it renders | 37.9 KB | – |
| [breakdown-chart](breakdown-chart.md) · Element it renders | 37.8 KB | – |
| [agent-steering](agent-steering.md) · Element it renders | 37.6 KB | – |
| [model-picker](model-picker.md) · Element it renders | 36.5 KB | – |
| [plan-vs-actual](plan-vs-actual.md) · Element it renders | 36.4 KB | – |
| [version-history](version-history.md) · Element it renders | 35.3 KB | – |
| [agent-lanes](agent-lanes.md) · Element it renders | 34.8 KB | – |
| [retrieval-settings](retrieval-settings.md) · Element it renders | 34.8 KB | – |
| [task-board](../blocks/task-board.md) · Element it renders | 34.8 KB | – |
| [tool-permissions](tool-permissions.md) · Element it renders | 34.6 KB | – |
| [collaboration-stream](collaboration-stream.md) · Element it renders | 34.5 KB | – |
| [reflection-gate](reflection-gate.md) · Element it renders | 34.5 KB | – |
| [claim-answer](claim-answer.md) · Element it renders | 34.3 KB | – |
| [model-routing](model-routing.md) · Element it renders | 34.1 KB | – |
| [ai-side-pane](../blocks/ai-side-pane.md) · Element it renders | 34.1 KB | – |
| [knowledge-source-manager](knowledge-source-manager.md) · Element it renders | 33.7 KB | – |
| [project-card](project-card.md) · Element it renders | 33.6 KB | – |
| [instruction-editor](instruction-editor.md) · Element it renders | 33.5 KB | – |
| [eval-scorecard](eval-scorecard.md) · Element it renders | 33.1 KB | – |
| [metrics-dashboard](../blocks/metrics-dashboard.md) · Element it renders | 33.0 KB | – |
| [code-block](code-block.md) · Element it renders | 33.0 KB | – |
| [handoff](handoff.md) · Element it renders | 32.9 KB | – |
| [trigger-builder](trigger-builder.md) · Element it renders | 32.5 KB | – |
| [sandbox-log](sandbox-log.md) · Element it renders | 32.4 KB | – |
| [structured-output](structured-output.md) · Element it renders | 32.4 KB | – |
| [kpi-board](../blocks/kpi-board.md) · Element it renders | 32.1 KB | – |
| [thinking-state](thinking-state.md) · Element it renders | 32.1 KB | – |
| [policy-simulator](policy-simulator.md) · Element it renders | 31.7 KB | – |
| [filter-menu](filter-menu.md) · Element it renders | 31.4 KB | – |
| [verification-queue](verification-queue.md) · Element it renders | 31.2 KB | – |
| [model-settings](model-settings.md) · Element it renders | 31.1 KB | – |
| [artifact-panel](artifact-panel.md) · Element it renders | 31.1 KB | – |
| [approval-gates](approval-gates.md) · Element it renders | 31.0 KB | – |
| [roadmap-timeline](roadmap-timeline.md) · Element it renders | 30.5 KB | – |
| [extraction-review](extraction-review.md) · Element it renders | 30.3 KB | – |
| [heatmap](heatmap.md) · Element it renders | 30.2 KB | – |
| [mention-picker](mention-picker.md) · Element it renders | 30.2 KB | – |
| [fan-out-grid](fan-out-grid.md) · Element it renders | 30.0 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 30.0 KB | – |
| [retrieval-inspector](retrieval-inspector.md) · Element it renders | 30.0 KB | – |
| [bibliography](bibliography.md) · Element it renders | 29.7 KB | – |
| [agent-ledger](agent-ledger.md) · Element it renders | 29.6 KB | – |
| [tool-access-map](tool-access-map.md) · Element it renders | 29.5 KB | – |
| [smart-recommendation](smart-recommendation.md) · Element it renders | 29.4 KB | – |
| [org-chart](org-chart.md) · Element it renders | 29.3 KB | – |
| [response-selection](response-selection.md) · Element it renders | 29.0 KB | – |
| [team-roster](team-roster.md) · Element it renders | 29.0 KB | – |
| [risk-register](risk-register.md) · Element it renders | 28.7 KB | – |
| [agent-gallery](../blocks/agent-gallery.md) · Element it renders | 28.7 KB | – |
| [access-request](access-request.md) · Element it renders | 28.5 KB | – |
| [comment-thread](comment-thread.md) · Element it renders | 28.4 KB | – |
| [priority-list](priority-list.md) · Element it renders | 28.2 KB | – |
| [attestation-check](attestation-check.md) · Element it renders | 28.1 KB | – |
| [preview-frame](preview-frame.md) · Element it renders | 28.0 KB | – |
| [parallel-attempts](parallel-attempts.md) · Element it renders | 27.2 KB | – |
| [budget-guard](budget-guard.md) · Element it renders | 27.1 KB | – |
| [color-picker](color-picker.md) · Element it renders | 26.7 KB | – |
| [identifier-details](identifier-details.md) · Element it renders | 26.6 KB | – |
| [compact-breakdown](compact-breakdown.md) · Element it renders | 26.6 KB | – |
| [money-flow](money-flow.md) · Element it renders | 26.6 KB | – |
| [run-compare](run-compare.md) · Element it renders | 26.5 KB | – |
| [tree-select](tree-select.md) · Element it renders | 26.0 KB | – |
| [setup-guide](setup-guide.md) · Element it renders | 25.9 KB | – |
| [clarifying-questions](clarifying-questions.md) · Element it renders | 25.8 KB | – |
| [agent-team](../illustrations/agent-team.md) · Element it renders | 25.8 KB | – |
| [share-panel](share-panel.md) · Element it renders | 25.7 KB | – |
| [kpi-chart](kpi-chart.md) · Element it renders | 25.6 KB | – |
| [context-tray](context-tray.md) · Element it renders | 25.4 KB | – |
| [invoice-credit](../blocks/invoice-credit.md) · Element it renders | 25.3 KB | – |
| [relationship-graph](relationship-graph.md) · Element it renders | 25.1 KB | – |
| [knowledge-promotion](knowledge-promotion.md) · Element it renders | 25.0 KB | – |
| [kill-switch](kill-switch.md) · Element it renders | 24.7 KB | – |
| [file-summary](file-summary.md) · Element it renders | 24.4 KB | – |
| [org-unit-card](org-unit-card.md) · Element it renders | 24.4 KB | – |
| [coordinate-details](coordinate-details.md) · Element it renders | 24.2 KB | – |
| [feedback-rubric](feedback-rubric.md) · Element it renders | 24.2 KB | – |
| [integration-grid](../illustrations/integration-grid.md) · Element it renders | 24.1 KB | – |
| [synthesis-notes](synthesis-notes.md) · Element it renders | 24.1 KB | – |
| [conversation-branches](conversation-branches.md) · Element it renders | 23.9 KB | – |
| [gate-config](gate-config.md) · Element it renders | 23.9 KB | – |
| [query-builder](query-builder.md) · Element it renders | 23.7 KB | – |
| [entity-details](entity-details.md) · Element it renders | 23.7 KB | – |
| [engagement-quality](engagement-quality.md) · Element it renders | 23.4 KB | – |
| [text-to-speech](text-to-speech.md) · Element it renders | 23.3 KB | – |
| [run-manifest](run-manifest.md) · Element it renders | 23.1 KB | – |
| [coverage-matrix](coverage-matrix.md) · Element it renders | 23.1 KB | – |
| [friction-profile](friction-profile.md) · Element it renders | 23.0 KB | – |
| [pricing-plans](../blocks/pricing-plans.md) · Element it renders | 23.0 KB | – |
| [review-conflict](review-conflict.md) · Element it renders | 23.0 KB | – |
| [co-occurrence](co-occurrence.md) · Element it renders | 23.0 KB | – |
| [evidence-list](evidence-list.md) · Element it renders | 22.9 KB | – |
| [pull-request](pull-request.md) · Element it renders | 22.8 KB | – |
| [status-tracker](status-tracker.md) · Element it renders | 22.7 KB | – |
| [facet-sidebar](facet-sidebar.md) · Element it renders | 22.6 KB | – |
| [correction-propagation](correction-propagation.md) · Element it renders | 22.6 KB | – |
| [search-results](search-results.md) · Element it renders | 22.6 KB | – |
| [scheduled-runs](scheduled-runs.md) · Element it renders | 22.3 KB | – |
| [guardrail-notice](guardrail-notice.md) · Element it renders | 22.2 KB | – |
| [conflict-radar](conflict-radar.md) · Element it renders | 22.0 KB | – |
| [gap-exposure](gap-exposure.md) · Element it renders | 21.8 KB | – |
| [cover-flow](../illustrations/cover-flow.md) · Element it renders | 21.6 KB | – |
| [publication-impact](publication-impact.md) · Element it renders | 21.6 KB | – |
| [problem-list](problem-list.md) · Element it renders | 21.5 KB | – |
| [speed-reader](speed-reader.md) · Element it renders | 21.4 KB | – |
| [progress-tracker](progress-tracker.md) · Element it renders | 21.1 KB | – |
| [answer-arena](answer-arena.md) · Element it renders | 21.0 KB | – |
| [todo-list](todo-list.md) · Element it renders | 21.0 KB | – |
| [agent-handoff](agent-handoff.md) · Element it renders | 20.8 KB | – |
| [autonomy-dial](autonomy-dial.md) · Element it renders | 20.8 KB | – |
| [root-cause-tree](root-cause-tree.md) · Element it renders | 20.7 KB | – |
| [routine-form](routine-form.md) · Element it renders | 20.6 KB | – |
| [handoff-brief](handoff-brief.md) · Element it renders | 20.5 KB | – |
| [fingerprint-card](fingerprint-card.md) · Element it renders | 20.5 KB | – |
| [search-history](search-history.md) · Element it renders | 20.3 KB | – |
| [agreement-tracker](agreement-tracker.md) · Element it renders | 20.2 KB | – |
| [traceability-spine](traceability-spine.md) · Element it renders | 20.2 KB | – |
| [score-summary](score-summary.md) · Element it renders | 20.0 KB | – |
| [gauge](gauge.md) · Element it renders | 20.0 KB | – |
| [saved-search-alerts](saved-search-alerts.md) · Element it renders | 20.0 KB | – |
| [profile-menu](profile-menu.md) · Element it renders | 19.8 KB | – |
| [agent-findings](agent-findings.md) · Element it renders | 19.7 KB | – |
| [agent-fleet](agent-fleet.md) · Element it renders | 19.7 KB | – |
| [confidence-brief](confidence-brief.md) · Element it renders | 19.4 KB | – |
| [geo-location](geo-location.md) · Element it renders | 19.3 KB | – |
| [process-list](process-list.md) · Element it renders | 19.3 KB | – |
| [network-log](network-log.md) · Element it renders | 19.1 KB | – |
| [prioritisation-matrix](prioritisation-matrix.md) · Element it renders | 18.8 KB | – |
| [alert-feed](alert-feed.md) · Element it renders | 18.7 KB | – |
| [isbn-details](isbn-details.md) · Element it renders | 18.7 KB | – |
| [travel-itinerary](travel-itinerary.md) · Element it renders | 18.5 KB | – |
| [session-context-bar](session-context-bar.md) · Element it renders | 18.5 KB | – |
| [person-hovercard](person-hovercard.md) · Element it renders | 18.5 KB | – |
| [score-survey](score-survey.md) · Element it renders | 18.4 KB | – |
| [branch-switcher](branch-switcher.md) · Element it renders | 18.3 KB | – |
| [disagreement-banner](disagreement-banner.md) · Element it renders | 18.3 KB | – |
| [validity-badge](validity-badge.md) · Element it renders | 18.3 KB | – |
| [results-list](results-list.md) · Element it renders | 18.2 KB | – |
| [session-list](session-list.md) · Element it renders | 18.0 KB | – |
| [entity-timeline](entity-timeline.md) · Element it renders | 17.9 KB | – |
| [profile-header](profile-header.md) · Element it renders | 17.9 KB | – |
| [breakpoint-overlay](breakpoint-overlay.md) · Element it renders | 17.8 KB | – |
| [console-panel](console-panel.md) · Element it renders | 17.6 KB | – |
| [red-team-finding](../blocks/red-team-finding.md) · Element it renders | 17.6 KB | – |
| [message-status](message-status.md) · Element it renders | 17.5 KB | – |
| [tag-input](tag-input.md) · Element it renders | 17.4 KB | – |
| [team-flag-editor](team-flag-editor.md) · Element it renders | 17.1 KB | – |
| [contact-channels](contact-channels.md) · Element it renders | 17.1 KB | – |
| [provenance-summary](provenance-summary.md) · Element it renders | 17.0 KB | – |
| [activity-calendar](activity-calendar.md) · Element it renders | 17.0 KB | – |
| [account-list](account-list.md) · Element it renders | 16.6 KB | – |
| [notification-stack](notification-stack.md) · Element it renders | 16.6 KB | – |
| [model-wheel](../illustrations/model-wheel.md) · Element it renders | 16.5 KB | – |
| [decision-inbox](decision-inbox.md) · Element it renders | 16.4 KB | – |
| [capability-notice](capability-notice.md) · Element it renders | 16.4 KB | – |
| [fact-sheet](fact-sheet.md) · Element it renders | 16.3 KB | – |
| [asset-list](asset-list.md) · Element it renders | 16.3 KB | – |
| [file-tree](file-tree.md) · Element it renders | 16.0 KB | – |
| [activity-clock](activity-clock.md) · Element it renders | 15.9 KB | – |
| [outreach-branches](../illustrations/outreach-branches.md) · Element it renders | 15.9 KB | – |
| [capacity-bars](capacity-bars.md) · Element it renders | 15.8 KB | – |
| [budget-burn](budget-burn.md) · Element it renders | 15.8 KB | – |
| [testimonial-wall](../blocks/testimonial-wall.md) · Element it renders | 15.8 KB | – |
| [biometric-status](biometric-status.md) · Element it renders | 15.7 KB | – |
| [select](select.md) · Element it renders | 15.7 KB | – |
| [prompt-starters](prompt-starters.md) · Element it renders | 15.7 KB | – |
| [agent-monitor](agent-monitor.md) · Element it renders | 15.7 KB | – |
| [evidence-coverage](evidence-coverage.md) · Element it renders | 15.7 KB | – |
| [selection-toolbar](selection-toolbar.md) · Element it renders | 15.7 KB | – |
| [candlestick-chart](candlestick-chart.md) · Element it renders | 15.6 KB | – |
| [publish-readiness](../blocks/publish-readiness.md) · Element it renders | 15.5 KB | – |
| [atomic-design](../illustrations/atomic-design.md) · Element it renders | 15.3 KB | – |
| [investment-balance](investment-balance.md) · Element it renders | 15.2 KB | – |
| [reasoning-flags](reasoning-flags.md) · Element it renders | 15.1 KB | – |
| [person-links](person-links.md) · Element it renders | 14.9 KB | – |
| [legal-hold-manager](legal-hold-manager.md) · Element it renders | 14.8 KB | – |
| [document-list](document-list.md) · Element it renders | 14.8 KB | – |
| [element-inspector](element-inspector.md) · Element it renders | 14.7 KB | – |
| [logo-marquee](../blocks/logo-marquee.md) · Element it renders | 14.7 KB | – |
| [sla-status](sla-status.md) · Element it renders | 14.7 KB | – |
| [lead-sourcing](../illustrations/lead-sourcing.md) · Element it renders | 14.5 KB | – |
| [sparkline](sparkline.md) · Element it renders | 14.5 KB | – |
| [radar-chart](radar-chart.md) · Element it renders | 14.4 KB | – |
| [work-item](work-item.md) · Element it renders | 14.3 KB | – |
| [approval-chain](approval-chain.md) · Element it renders | 14.3 KB | – |
| [header-nav](../blocks/header-nav.md) · Element it renders | 13.9 KB | – |
| [inspect-frame](../illustrations/inspect-frame.md) · Element it renders | 13.7 KB | – |
| [side-nav](side-nav.md) · Element it renders | 13.6 KB | – |
| [case-review](../blocks/case-review.md) · Element it renders | 13.5 KB | – |
| [subagent-list](subagent-list.md) · Element it renders | 13.5 KB | – |
| [day-rhythm](day-rhythm.md) · Element it renders | 13.5 KB | – |
| [route-map](route-map.md) · Element it renders | 13.5 KB | – |
| [tips-panel](tips-panel.md) · Element it renders | 13.4 KB | – |
| [terminal](terminal.md) · Element it renders | 13.4 KB | – |
| [access-review](../blocks/access-review.md) · Element it renders | 13.2 KB | – |
| [network-graph](network-graph.md) · Element it renders | 13.1 KB | – |
| [session-state](session-state.md) · Element it renders | 12.9 KB | – |
| [change-list](change-list.md) · Element it renders | 12.8 KB | – |
| [breadcrumbs](breadcrumbs.md) · Element it renders | 12.7 KB | – |
| [small-multiples](small-multiples.md) · Element it renders | 12.7 KB | – |
| [place-list](place-list.md) · Element it renders | 12.6 KB | – |
| [watchlist](watchlist.md) · Element it renders | 12.6 KB | – |
| [button](button.md) · Element it renders | 12.5 KB | – |
| [team-invite](../illustrations/team-invite.md) · Element it renders | 12.5 KB | – |
| [fallback-chain](fallback-chain.md) · Element it renders | 12.4 KB | – |
| [share-link-manager](share-link-manager.md) · Element it renders | 12.1 KB | – |
| [pr-link](pr-link.md) · Element it renders | 12.1 KB | – |
| [digest](digest.md) · Element it renders | 12.1 KB | – |
| [redaction-review](redaction-review.md) · Element it renders | 12.0 KB | – |
| [audience-mix](audience-mix.md) · Element it renders | 12.0 KB | – |
| [ops-overview](ops-overview.md) · Element it renders | 11.4 KB | – |
| [ghosted-chat](../illustrations/ghosted-chat.md) · Element it renders | 11.3 KB | – |
| [reaction-bar](reaction-bar.md) · Element it renders | 11.3 KB | – |
| [time-details](time-details.md) · Element it renders | 11.3 KB | – |
| [sensitivity-label-picker](sensitivity-label-picker.md) · Element it renders | 11.1 KB | – |
| [web-vitals](web-vitals.md) · Element it renders | 11.1 KB | – |
| [diff-viewer](diff-viewer.md) · Element it renders | 11.0 KB | – |
| [calendar-heatmap](calendar-heatmap.md) · Element it renders | 10.7 KB | – |
| [check-status](check-status.md) · Element it renders | 10.7 KB | – |
| [bubble-chart](bubble-chart.md) · Element it renders | 10.6 KB | – |
| [coverage-ring](coverage-ring.md) · Element it renders | 10.6 KB | – |
| [citation-badge](citation-badge.md) · Element it renders | 10.6 KB | – |
| [combo-chart](combo-chart.md) · Element it renders | 10.6 KB | – |
| [preview-card](preview-card.md) · Element it renders | 10.4 KB | – |
| [citation-sections](citation-sections.md) · Element it renders | 10.4 KB | – |
| [audit-trail](../blocks/audit-trail.md) · Element it renders | 10.2 KB | – |
| [oversight-home](../blocks/oversight-home.md) · Element it renders | 10.2 KB | – |
| [change-summary](change-summary.md) · Element it renders | 9.6 KB | – |
| [venn-diagram](venn-diagram.md) · Element it renders | 9.6 KB | – |
| [collection-card](collection-card.md) · Element it renders | 9.6 KB | – |
| [uncertainty-mix](../blocks/uncertainty-mix.md) · Element it renders | 9.4 KB | – |
| [grade-distribution](grade-distribution.md) · Element it renders | 9.1 KB | – |
| [icon-rail](icon-rail.md) · Element it renders | 8.9 KB | – |
| [bulk-action-bar](bulk-action-bar.md) · Element it renders | 8.4 KB | – |
| [accessibility-principles](../illustrations/accessibility-principles.md) · Element it renders | 8.3 KB | – |
| [hexbin-chart](hexbin-chart.md) · Element it renders | 8.3 KB | – |
| [chat-minimap](chat-minimap.md) · Element it renders | 8.3 KB | – |
| [scan-status](scan-status.md) · Element it renders | 8.3 KB | – |
| [team-flag-picker](team-flag-picker.md) · Element it renders | 8.1 KB | – |
| [enrichment-orbit](../illustrations/enrichment-orbit.md) · Element it renders | 8.0 KB | – |
| [histogram](histogram.md) · Element it renders | 7.8 KB | – |
| [parallel-chart](parallel-chart.md) · Element it renders | 7.7 KB | – |
| [bar-chart](bar-chart.md) · Element it renders | 7.7 KB | – |
| [empty-calendar](../illustrations/empty-calendar.md) · Element it renders | 7.5 KB | – |
| [tab-overload](../illustrations/tab-overload.md) · Element it renders | 7.3 KB | – |
| [box-plot](box-plot.md) · Element it renders | 7.3 KB | – |
| [year-list](year-list.md) · Element it renders | 7.3 KB | – |
| [waffle-chart](waffle-chart.md) · Element it renders | 7.3 KB | – |
| [beeswarm-chart](beeswarm-chart.md) · Element it renders | 7.2 KB | – |
| [file-details](../blocks/file-details.md) · Element it renders | 6.8 KB | – |
| [waterfall-chart](waterfall-chart.md) · Element it renders | 6.7 KB | – |
| [sunburst-chart](sunburst-chart.md) · Element it renders | 6.7 KB | – |
| [meter-row](meter-row.md) · Element it renders | 6.5 KB | – |
| [environment-list](environment-list.md) · Element it renders | 6.5 KB | – |
| [dumbbell-chart](dumbbell-chart.md) · Element it renders | 6.5 KB | – |
| [bullet-chart](bullet-chart.md) · Element it renders | 6.5 KB | – |
| [rose-chart](rose-chart.md) · Element it renders | 6.5 KB | – |
| [sankey-chart](sankey-chart.md) · Element it renders | 6.4 KB | – |
| [soup-cans](../illustrations/soup-cans.md) · Element it renders | 6.3 KB | – |
| [session-panel](../blocks/session-panel.md) · Element it renders | 6.3 KB | – |
| [slope-chart](slope-chart.md) · Element it renders | 6.3 KB | – |
| [panel-card](panel-card.md) · Element it renders | 6.2 KB | – |
| [stream-graph](stream-graph.md) · Element it renders | 6.1 KB | – |
| [ridgeline-chart](ridgeline-chart.md) · Element it renders | 6.1 KB | – |
| [chord-chart](chord-chart.md) · Element it renders | 6.1 KB | – |
| [pareto-chart](pareto-chart.md) · Element it renders | 5.9 KB | – |
| [bump-chart](bump-chart.md) · Element it renders | 5.8 KB | – |
| [lollipop-chart](lollipop-chart.md) · Element it renders | 5.4 KB | – |
| [evidence-gallery](../blocks/evidence-gallery.md) · Element it renders | 5.3 KB | – |
| [treemap](treemap.md) · Element it renders | 5.3 KB | – |
| [dialog](dialog.md) · Element it renders | 5.3 KB | – |
| [in-translation](../illustrations/in-translation.md) · Element it renders | 5.0 KB | – |
| [funnel-chart](funnel-chart.md) · Element it renders | 4.9 KB | – |
| [content-shield](content-shield.md) · Element it renders | 4.9 KB | – |
| [in-coordination](../illustrations/in-coordination.md) · Element it renders | 4.9 KB | – |
| [something-wrong](../illustrations/something-wrong.md) · Element it renders | 4.7 KB | – |
| [segmented-bar](segmented-bar.md) · Element it renders | 4.7 KB | – |
| [in-quality-control](../illustrations/in-quality-control.md) · Element it renders | 4.6 KB | – |
| [content-hidden](../illustrations/content-hidden.md) · Element it renders | 4.6 KB | – |
| [marimekko-chart](marimekko-chart.md) · Element it renders | 4.6 KB | – |
| [awaiting-review](../illustrations/awaiting-review.md) · Element it renders | 4.5 KB | – |
| [preview-unavailable](../illustrations/preview-unavailable.md) · Element it renders | 4.5 KB | – |
| [upload-failed](../illustrations/upload-failed.md) · Element it renders | 4.5 KB | – |
| [released](../illustrations/released.md) · Element it renders | 4.5 KB | – |
| [limit-reached](../illustrations/limit-reached.md) · Element it renders | 4.5 KB | – |
| [malware-blocked](../illustrations/malware-blocked.md) · Element it renders | 4.5 KB | – |
| [pending-release](../illustrations/pending-release.md) · Element it renders | 4.4 KB | – |
| [footnotes](footnotes.md) · Element it renders | 4.4 KB | – |
| [processing](../illustrations/processing.md) · Element it renders | 4.3 KB | – |
| [no-access](../illustrations/no-access.md) · Element it renders | 4.3 KB | – |
| [drag-lift](../motion/drag-lift.md) · Element it renders | 4.2 KB | – |
| [radial-bar-chart](radial-bar-chart.md) · Element it renders | 4.1 KB | – |
| [all-done](../illustrations/all-done.md) · Element it renders | 4.1 KB | – |
| [link-expired](../illustrations/link-expired.md) · Element it renders | 4.1 KB | – |
| [offline](../illustrations/offline.md) · Element it renders | 4.0 KB | – |
| [status-morph](../motion/status-morph.md) · Element it renders | 4.0 KB | – |
| [nothing-found](../illustrations/nothing-found.md) · Element it renders | 3.9 KB | – |
| [first-use](../illustrations/first-use.md) · Element it renders | 3.7 KB | – |
| [number-change](../motion/number-change.md) · Element it renders | 3.5 KB | – |
| [agent-scene](../illustrations/agent-scene.md) · Element it renders | 3.4 KB | – |
| [shared-element](../motion/shared-element.md) · Element it renders | 3.0 KB | – |
| [progress-bar](../motion/progress-bar.md) · Element it renders | 2.8 KB | – |
| [header-brand](header-brand.md) · Element it renders | 2.8 KB | – |
| [chart](chart.md) · Element it renders | 2.6 KB | – |
| [success-check](../motion/success-check.md) · Element it renders | 2.1 KB | – |
| [slider-field](slider-field.md) · Element it renders | 2.0 KB | – |
| [staggered-reveal](../motion/staggered-reveal.md) · Element it renders | 1.9 KB | – |
| [agent-face](agent-face.md) · Element it renders | 1.9 KB | – |
| [attention-pulse](../motion/attention-pulse.md) · Element it renders | 1.8 KB | – |
| [number-field](number-field.md) · Element it renders | 1.7 KB | – |
| [donut-chart](donut-chart.md) · Element it renders | 1.5 KB | – |
| [list-motion](../motion/list-motion.md) · Element it renders | 1.4 KB | – |
| [radio-group](radio-group.md) · Element it renders | 1.2 KB | – |
| [collapse](../motion/collapse.md) · Element it renders | 0.9 KB | – |
| [area-chart](area-chart.md) · Element it renders | 0.8 KB | – |
| [checkbox](checkbox.md) · Element it renders | 0.8 KB | – |
| [line-chart](line-chart.md) · Element it renders | 0.8 KB | – |
| [switch](switch.md) · Element it renders | 0.8 KB | – |
| [pie-chart](pie-chart.md) · Element it renders | 0.7 KB | – |
| `src/generative/registry.ts` · Dependency | 60.5 KB | – |
| `src/generative/schemas/tc-ai-side-pane.json` · Dependency | 14.2 KB | – |
| `src/generative/schemas/tc-verification-queue.json` · Dependency | 9.2 KB | – |
| `src/generative/schemas/tc-claim-answer.json` · Dependency | 8.8 KB | – |
| `src/generative/schemas/tc-configuration-release-control.json` · Dependency | 6.3 KB | – |
| `src/generative/schemas/tc-session-panel.json` · Dependency | 5.9 KB | – |
| `src/generative/schemas/tc-multi-calendar.json` · Dependency | 5.8 KB | – |
| `src/generative/schemas/tc-line-chart.json` · Dependency | 5.7 KB | – |
| `src/generative/schemas/tc-area-chart.json` · Dependency | 5.7 KB | – |
| `src/generative/schemas/tc-playbook-canvas.json` · Dependency | 5.6 KB | – |
| `src/generative/schemas/tc-reliance-gauge.json` · Dependency | 5.6 KB | – |
| `src/generative/validate.ts` · Dependency | 5.6 KB | – |
| `src/generative/schemas/tc-hexbin-chart.json` · Dependency | 5.5 KB | – |
| `src/generative/schemas/tc-case-review.json` · Dependency | 5.5 KB | – |
| `src/generative/schemas/tc-priority-list.json` · Dependency | 5.3 KB | – |
| `src/generative/schemas/tc-combo-chart.json` · Dependency | 5.3 KB | – |
| `src/generative/schemas/tc-file-details.json` · Dependency | 5.3 KB | – |
| `src/generative/schemas/tc-bubble-chart.json` · Dependency | 5.2 KB | – |
| `src/generative/schemas/tc-network-graph.json` · Dependency | 5.1 KB | – |
| `src/generative/schemas/tc-org-unit-card.json` · Dependency | 5.0 KB | – |
| `src/generative/schemas/tc-validity-badge.json` · Dependency | 5.0 KB | – |
| `src/vendor/agent-face/element/agent-face.ts` · Dependency | 5.0 KB | – |
| `src/generative/schemas/tc-review-center.json` · Dependency | 4.8 KB | – |
| `src/generative/schemas/tc-candlestick-chart.json` · Dependency | 4.8 KB | – |
| `src/generative/schemas/tc-parallel-chart.json` · Dependency | 4.7 KB | – |
| `src/vendor/agent-face/engine/engine.ts` · Dependency | 4.7 KB | – |
| `src/generative/schemas/tc-data-handling-policy.json` · Dependency | 4.6 KB | – |
| `src/generative/schemas/tc-approval-card.json` · Dependency | 4.6 KB | – |
| `src/generative/schemas/tc-retrieval-inspector.json` · Dependency | 4.5 KB | – |
| `src/generative/schemas/tc-donut-chart.json` · Dependency | 4.5 KB | – |
| `src/generative/schemas/tc-pull-request.json` · Dependency | 4.4 KB | – |
| `src/generative/schemas/tc-publication-impact.json` · Dependency | 4.4 KB | – |
| `src/generative/schemas/tc-red-team-finding.json` · Dependency | 4.4 KB | – |
| `src/generative/schemas/tc-histogram.json` · Dependency | 4.4 KB | – |
| `src/generative/schemas/tc-stream-graph.json` · Dependency | 4.3 KB | – |
| `src/generative/schemas/tc-ai-summary.json` · Dependency | 4.3 KB | – |
| `src/generative/schemas/tc-bar-chart.json` · Dependency | 4.3 KB | – |
| `src/generative/schemas/tc-mcp-connection-manager.json` · Dependency | 4.3 KB | – |
| `src/generative/schemas/tc-transcript-review.json` · Dependency | 4.2 KB | – |
| `src/generative/schemas/tc-waterfall-chart.json` · Dependency | 4.2 KB | – |
| `src/generative/schemas/tc-policy-simulator.json` · Dependency | 4.2 KB | – |
| `src/generative/schemas/tc-reflection-gate.json` · Dependency | 4.1 KB | – |
| `src/generative/schemas/tc-agent-queue.json` · Dependency | 4.1 KB | – |
| `src/generative/schemas/tc-treemap.json` · Dependency | 4.1 KB | – |
| `src/generative/schemas/tc-collaboration-stream.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-slope-chart.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-box-plot.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-run-checkpoints.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-conversation-annotation.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-dumbbell-chart.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-pareto-chart.json` · Dependency | 4.0 KB | – |
| `src/generative/schemas/tc-waffle-chart.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-sunburst-chart.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-rose-chart.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-ridgeline-chart.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-tool-access-map.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-evaluation-dataset-editor.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-bullet-chart.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-segmented-bar.json` · Dependency | 3.9 KB | – |
| `src/generative/schemas/tc-pie-chart.json` · Dependency | 3.8 KB | – |
| `src/generative/schemas/tc-beeswarm-chart.json` · Dependency | 3.8 KB | – |
| `src/generative/schemas/tc-scheduled-runs.json` · Dependency | 3.8 KB | – |
| `src/generative/schemas/tc-provider-connection.json` · Dependency | 3.8 KB | – |
| `src/generative/schemas/tc-calendar-heatmap.json` · Dependency | 3.8 KB | – |
| `src/generative/schemas/tc-venn-diagram.json` · Dependency | 3.8 KB | – |
| `src/generative/schemas/tc-approval-gates.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-funnel-chart.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-agent-handoff.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-model-settings.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-routine-form.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-chord-chart.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-sankey-chart.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-retrieval-settings.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-lollipop-chart.json` · Dependency | 3.7 KB | – |
| `src/generative/schemas/tc-profile-header.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-kpi-board.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-bump-chart.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-radial-bar-chart.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-selection-toolbar.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-access-request.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-trigger-builder.json` · Dependency | 3.6 KB | – |
| `src/generative/schemas/tc-marimekko-chart.json` · Dependency | 3.5 KB | – |
| `src/generative/schemas/tc-oversight-home.json` · Dependency | 3.5 KB | – |
| `src/generative/schemas/tc-search-results.json` · Dependency | 3.5 KB | – |
| `src/generative/schemas/tc-agent-findings.json` · Dependency | 3.5 KB | – |
| `src/generative/schemas/tc-evidence-list.json` · Dependency | 3.4 KB | – |
| `src/generative/schemas/tc-lineage-graph.json` · Dependency | 3.4 KB | – |
| `src/generative/schemas/tc-client-context.json` · Dependency | 3.4 KB | – |
| `src/generative/schemas/tc-permission-request.json` · Dependency | 3.4 KB | – |
| `src/generative/schemas/tc-small-multiples.json` · Dependency | 3.3 KB | – |
| `src/generative/schemas/tc-app-directory.json` · Dependency | 3.2 KB | – |
| `src/generative/schemas/tc-prompt-starters.json` · Dependency | 3.2 KB | – |
| `src/generative/schemas/tc-co-occurrence.json` · Dependency | 3.2 KB | – |
| `src/generative/schemas/tc-query-builder.json` · Dependency | 3.2 KB | – |
| `src/generative/schemas/tc-agent-graph.json` · Dependency | 3.2 KB | – |
| `src/generative/schemas/tc-structured-output.json` · Dependency | 3.1 KB | – |
| `src/generative/schemas/tc-model-routing.json` · Dependency | 3.1 KB | – |
| `src/generative/schemas/tc-engagement-quality.json` · Dependency | 3.1 KB | – |
| `src/generative/schemas/tc-travel-itinerary.json` · Dependency | 3.1 KB | – |
| `src/generative/schemas/tc-session-list.json` · Dependency | 3.1 KB | – |
| `src/generative/schemas/tc-account-list.json` · Dependency | 3.1 KB | – |
| `src/generative/schemas/tc-status-tracker.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-conflict-radar.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-version-history.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-tool-permissions.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-image-grid.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-knowledge-source-manager.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-network-log.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-trace-waterfall.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-agent-inbox.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-problem-list.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-usage-meter.json` · Dependency | 3.0 KB | – |
| `src/generative/schemas/tc-decision-tree.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-preview-frame.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-handoff-brief.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-gate-config.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-file-summary.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-eval-scorecard.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-confidence-brief.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-chat-history.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-instruction-editor.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-contact-channels.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-knowledge-promotion.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-agent-lanes.json` · Dependency | 2.9 KB | – |
| `src/generative/schemas/tc-color-picker.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-alert-feed.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-session-state.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-share-panel.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-process-list.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-json-viewer.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-artifact-panel.json` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-results-list.json` · Dependency | 2.8 KB | – |
| `src/vendor/agent-face/draw/draw-face.ts` · Dependency | 2.8 KB | – |
| `src/generative/schemas/tc-extraction-review.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-money-flow.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-kpi-chart.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-fact-sheet.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-entity-timeline.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-gauge.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-fingerprint-card.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-gap-exposure.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-text-annotator.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-kill-switch.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-coverage-matrix.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-clarifying-questions.json` · Dependency | 2.7 KB | – |
| `src/generative/schemas/tc-session-context-bar.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-branch-switcher.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-biometric-status.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-friction-profile.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-access-review.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-share-link-manager.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-run-manifest.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-heatmap.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-tool-configuration.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-place-list.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-guardrail-notice.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-roadmap-timeline.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-agent-monitor.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-risk-register.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-element-inspector.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-feedback-rubric.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-message-actions.json` · Dependency | 2.6 KB | – |
| `src/generative/schemas/tc-legal-hold-manager.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-geo-location.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-asset-list.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-experiment-card.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-file-tree.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-breakdown-chart.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-fan-out-grid.json` · Dependency | 2.5 KB | – |
| `src/generative/schemas/tc-delegate-board.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-agent-steering.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-approval-chain.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-context-map.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-review-conflict.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-data-table.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-logo-marquee.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-bibliography.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-change-list.json` · Dependency | 2.4 KB | – |
| `src/generative/schemas/tc-team-roster.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-person-links.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-pricing-plans.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-digest.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-watchlist.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-correction-propagation.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-agent-tree.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-document-list.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-evidence-coverage.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-sparkline.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-project-card.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-handoff.json` · Dependency | 2.3 KB | – |
| `src/generative/schemas/tc-root-cause-tree.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-combobox.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-traceability-spine.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-subagent-list.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-output-schema-builder.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-ops-overview.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-score-summary.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-task-board.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-email-draft.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-work-item.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-tree-select.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-publish-readiness.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-cited-answer.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-uncertainty-mix.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-header-nav.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-radar-chart.json` · Dependency | 2.2 KB | – |
| `src/generative/schemas/tc-thinking-state.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-redaction-review.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-diff-viewer.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-budget-burn.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-sandbox-log.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-route-map.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-message-status.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-console-panel.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-facet-sidebar.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-progress-tracker.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-billing-schedule.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-integration-picker.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-run-compare.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-web-vitals.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-segmented-control.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-agreement-tracker.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-person-hovercard.json` · Dependency | 2.1 KB | – |
| `src/generative/schemas/tc-response-selection.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-context-window.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-ai-answer.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-citation-badge.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-testimonial-wall.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-prompt-library.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-capability-notice.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-collection-card.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-relationship-graph.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-plan-vs-actual.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-saved-search-alerts.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-capacity-bars.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-atomic-design.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-score-survey.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-synthesis-notes.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-pr-link.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-investment-balance.json` · Dependency | 2.0 KB | – |
| `src/generative/schemas/tc-audit-trail.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-budget-guard.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-team-flag-editor.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-agent-ledger.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-audience-mix.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-activity-calendar.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-day-rhythm.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-select.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-comment-thread.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-parallel-attempts.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-org-chart.json` · Dependency | 1.9 KB | – |
| `src/generative/schemas/tc-sla-status.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-activity-clock.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-invoice-credit.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-memory-panel.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-reasoning-flags.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-conversation-branches.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-model-picker.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-side-nav.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-evidence-gallery.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-attestation-check.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-coverage-ring.json` · Dependency | 1.8 KB | – |
| `src/generative/schemas/tc-agent-plan.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-agent-fleet.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-writing-assistant.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-search-history.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-cover-flow.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-fallback-chain.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-code-block.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-provenance-summary.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-comments-panel.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-check-status.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-breakpoint-overlay.json` · Dependency | 1.7 KB | – |
| `src/generative/schemas/tc-answer-arena.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-filter-menu.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-coordinate-details.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-tool-call-card.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-ai-workspace.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-agent-face.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-disagreement-banner.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-team-flag-picker.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-inline-diff.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-citation-sections.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-environment-list.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-identifier-details.json` · Dependency | 1.6 KB | – |
| `src/generative/schemas/tc-todo-list.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-context-tray.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-bulk-action-bar.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-preview-card.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-button.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-number-change.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-setup-guide.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-compact-breakdown.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-icon-rail.json` · Dependency | 1.5 KB | – |
| `src/generative/schemas/tc-date-range-picker.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-sensitivity-label-picker.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-terminal.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-entity-details.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-decision-inbox.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-inspect-frame.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-breadcrumbs.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-tag-input.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-text-to-speech.json` · Dependency | 1.4 KB | – |
| `src/generative/schemas/tc-agent-gallery.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-chat-minimap.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-integration-grid.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-year-list.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-prioritisation-matrix.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-tips-panel.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-chart.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-scan-status.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-meter-row.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-time-details.json` · Dependency | 1.3 KB | – |
| `src/generative/schemas/tc-accessibility-principles.json` · Dependency | 1.2 KB | – |
| `src/generative/schemas/tc-smart-recommendation.json` · Dependency | 1.2 KB | – |
| `src/generative/schemas/tc-autonomy-dial.json` · Dependency | 1.2 KB | – |
| `src/generative/schemas/tc-integration-settings.json` · Dependency | 1.2 KB | – |
| `src/generative/schemas/tc-grade-distribution.json` · Dependency | 1.2 KB | – |
| `src/generative/schemas/tc-stepper-form.json` · Dependency | 1.2 KB | – |
| `src/generative/schemas/tc-agent-team.json` · Dependency | 1.1 KB | – |
| `src/generative/schemas/tc-integration-flow.json` · Dependency | 1.1 KB | – |
| `src/generative/schemas/tc-radio-group.json` · Dependency | 1.1 KB | – |
| `src/generative/schemas/tc-speed-reader.json` · Dependency | 1.1 KB | – |
| `src/generative/schemas/tc-footnotes.json` · Dependency | 1.1 KB | – |
| `src/generative/schemas/tc-change-summary.json` · Dependency | 1.1 KB | – |
| `src/vendor/agent-face/engine/states.ts` · Dependency | 1.1 KB | – |
| `src/generative/schemas/tc-metrics-dashboard.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-model-wheel.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-content-shield.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-notification-stack.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-number-field.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-slider-field.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-reaction-bar.json` · Dependency | 1.0 KB | – |
| `src/generative/schemas/tc-team-invite.json` · Dependency | 0.9 KB | – |
| `src/generative/schemas/tc-status-morph.json` · Dependency | 0.8 KB | – |
| `src/generative/schemas/tc-tool-call-group.json` · Dependency | 0.8 KB | – |
| `src/generative/schemas/tc-panel-card.json` · Dependency | 0.8 KB | – |
| `src/generative/schemas/tc-checkbox.json` · Dependency | 0.8 KB | – |
| `src/generative/schemas/tc-switch.json` · Dependency | 0.8 KB | – |
| `src/generative/schemas/tc-isbn-details.json` · Dependency | 0.7 KB | – |
| `src/generative/schemas/tc-agent-scene.json` · Dependency | 0.7 KB | – |
| `src/vendor/agent-face/draw/spear-tip.mjs` · Dependency | 0.7 KB | – |
| `src/generative/schemas/tc-header-brand.json` · Dependency | 0.6 KB | – |
| `src/generative/schemas/tc-lead-sourcing.json` · Dependency | 0.6 KB | – |
| `src/generative/schemas/tc-project-flow.json` · Dependency | 0.6 KB | – |
| `src/generative/schemas/tc-staggered-reveal.json` · Dependency | 0.6 KB | – |
| `src/generative/schemas/tc-progress-bar.json` · Dependency | 0.6 KB | – |
| `src/generative/schemas/tc-preview-unavailable.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-upload-failed.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-limit-reached.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-content-hidden.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-in-quality-control.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-malware-blocked.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-soup-cans.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-in-coordination.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-enrichment-orbit.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-first-use.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-world-map.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-offline.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-pending-release.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-list-motion.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-link-expired.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-in-translation.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-awaiting-review.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-region-dach.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-released.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-outreach-branches.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-all-done.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-processing.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-success-check.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-nothing-found.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-something-wrong.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-tab-overload.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-no-access.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-empty-calendar.json` · Dependency | 0.5 KB | – |
| `src/generative/schemas/tc-ghosted-chat.json` · Dependency | 0.4 KB | – |
| `src/generative/schemas/tc-shared-element.json` · Dependency | 0.4 KB | – |
| `src/generative/schemas/tc-attention-pulse.json` · Dependency | 0.4 KB | – |
| `src/vendor/agent-face/engine/spring.ts` · Dependency | 0.4 KB | – |
| `src/generative/schemas/tc-drag-lift.json` · Dependency | 0.4 KB | – |
| `src/generative/schemas/tc-collapse.json` · Dependency | 0.3 KB | – |
| `src/vendor/agent-face/element/loop.ts` · Dependency | 0.3 KB | – |
| `src/vendor/agent-face/engine/random.ts` · Dependency | 0.2 KB | – |
| `src/vendor/agent-face/element/index.ts` · Dependency | 0.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/vendor/agent-face/element/no-dom.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| `src/vendor/agent-face/engine/index.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **9712.2 KB** | **2421.4 KB** |
| With Lit – the first component on a page | 9653.1 KB | 2400.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 9 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 6.4 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (data-table), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController), `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- Timers: `setTimeout` (stepper-form), `setTimeout` (structured-output).
- 5 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController), `ResizeObserver` (stepper-form), `IntersectionObserver` (internal/controllers – OffScreenController).
- Listens on the page: `window pointerup` (data-table), `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController), `window keydown` (kpi-chart).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

The format to prompt the model with:

| Block | Fields |
|---|---|
| `text` | `text`, `style`: "body", "heading" or "muted" – blank lines split paragraphs |
| `metric` | `label`, `value`, `change`, `tone`: "good", "bad" or "neutral", `direction`: "up" or "down" |
| `table` | `title`, `columns`: `{ key, label, type }` with type "text", "number", "tag" or "link", `rows`: objects by key |
| `chart` | `title`, `value`, `delta`, `labels`, `series`: `{ label, values }` with one number per label, `footer` |
| `form` | `id`, `title`, `submitLabel`, `fields`: `{ name, label, kind, required, placeholder, hint, value, options, min, max }` |
| `callout` | `tone`: "info", "success", "warning" or "danger", `title`, `text`, `children`, `actions` |
| `group` | `title`, `layout`: "column", "row" or "grid", `children`, `actions` |
| `component` | `tag`: any tag in `@adamstavely/trenchcoat/generative`'s catalogue, `props`: the component's properties as JSON |

A spec is `{ blocks: [...] }`, a list of blocks, or one block. Field kinds are "text", "email", "number", "url",
"date", "textarea", "select" (a native select) and "choice" (stepper-form's cards). Actions are `{ id, label,
primary }`. Blocks nest inside callouts and groups up to six levels.

- Ask the model for the fewest blocks that answer the question.
- Keep `text` short and specific; let metrics and tables carry the numbers.
- Write action labels as what happens (“Cap daily spend”), and give each a stable `id` your app handles.
- Title forms by what they do (“Send this as a weekly report”) and their submit button with the verb.
- For a `component` block, put `catalogPrompt()` from `@adamstavely/trenchcoat/generative` in the system prompt – a line per
  component, or only the few your assistant needs. The props are checked against the component's schema before
  anything is set: what doesn't fit is left out and listed in `tc-spec-check`, and links must be http(s), mailto, tel
  or relative. Set `allowedOrigins` to hold the components' images to your own origins. See Foundations → Generative
  UI.

## Do and don't

### Do

- Handle `tc-action` in one place: switch on `kind` and `action`, and read `values` for forms.
- Listen to `tc-spec-check` (`onSpecCheck`) in development and evaluations to see what the model got wrong; turn
  on `showIssues` to see it in place.
- Handle a placed component's events from `tc-component-event` (`onComponentEvent`): it says which block, which tag
  and which event, and preventing it prevents the component's own (for the cancelable ones).
- Pass the model's text straight to `spec` with `streaming` while it arrives.

### Don't

- Don't put HTML or Markdown in the spec expecting it to render – every string is shown as text.
- Don't rely on a block type the format doesn't list; it shows as plain text.
- Don't use a generated form for anything sensitive, such as passwords or payment details.

## Related

- [Structured Output](structured-output.md) – Streaming JSON as a typed tree, checked against its schema as it arrives – missing and invalid fields flagged, copy as JSON or code
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state

## Changelog

- **`allowedOrigins`:** a new option on `checkProps`, `checkComponent`, `mountComponent` and `tc-generated-ui` keeps images and other resources that load by themselves to the origins you list. Colour fields must be real colours (no `url()`).
- **`tc-generated-ui`:** a `component` block, `{ type: "component", tag, props }`, places any catalogued component. - **Checks:** props are checked against the schema before they're set; what doesn't fit is left out and listed in `tc-spec-check`. - **Events:** the component's events come back as `tc-component-event`, also exposed as React's `onComponentEvent`; preventing it prevents the component's own. - **Guardrails:** links must be http(s), mailto or relative; lists are capped at 200 items, strings at 4,000 characters, nesting at 8 levels and props at 200 KB.
- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
