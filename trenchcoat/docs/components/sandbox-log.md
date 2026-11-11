<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Sandbox Log

**Agents** · New

Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs

- **Element:** `<tc-sandbox-log>`
- **Size:** 14.8 KB gzip · 47.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/sandbox-log";` |
| React / Next.js | `import { SandboxLog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/sandbox-log";` · tags starting with tc- are custom elements |
| Angular | `import { SandboxLog } from "@adamstavely/trenchcoat/angular/sandbox-log";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/sandbox-log";` |

## Example

The live example is in the gallery at `#/sandbox-log`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The output of the commands an agent ran in its sandbox, as a terminal shows it. Each step is a block with the
command, its exit code and how long it took; open it for the output in colour, with line numbers. Output streams
in and stays scrolled to the end while you're there, search finds text across every step, and Copy takes a step's
plain text or the whole log. It stays fast with long logs – a step with 50,000 lines renders only the rows near the
view.

### When to use

- Showing what an agent ran to install, build, test or deploy – and why a step failed.
- Live runs, where output arrives line by line and people want to follow along.
- Long logs people need to search and copy from, e.g. to paste a failing test into an issue.

### When not to use

- One tool call with its arguments and result – use [Tool Call Card](tool-call-card.md).
- Code the agent wrote or changed – use [Code Block](code-block.md).
- Watching the agent operate a browser or desktop – use [Live View](live-view.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon, the heading and the environment it ran in
2. **Search** `.ui-sbl__search` – finds text across every step, with a match count and Previous / Next
3. **Copy log** `.ui-sbl__copy-all` – copies every command and its output as plain text
4. **Step** `.ui-sbl__toggle` – the status, the command, its label, exit code and time; opens and closes the output
5. **Copy output** `.ui-sbl__head .ui-sbl__copy` – copies one step's output
6. **Output** `.ui-sbl__step[data-open] .ui-sbl__out` – the output in colour, with line numbers, scrolling past `max-height`
7. **Summary** `.ui-sbl__summary` – the step that's running, or how many ran, failed and how long they took

## Looks

Standard sets the log in a white card on a gray tray, with the summary on the tray below and a check mark for a
step that passed. Clean is one white card with the summary as its last row under a hairline, and filled status
icons. Both colour the output from the theme's tokens, so it follows light and dark.

## Usage

### HTML

```html
<tc-sandbox-log id="log" heading="Sandbox" environment="ubuntu-24.04 · node 22.11"></tc-sandbox-log>

<script type="module">
  import "@adamstavely/trenchcoat/sandbox-log";
  import "@adamstavely/trenchcoat/tokens.css";

  const log = document.querySelector("#log");
  log.steps = [
    { id: "ci", command: "npm ci", label: "Install dependencies", output: "added 812 packages", exitCode: 0, duration: 18400 },
    { id: "test", command: "npm test", label: "Run the test suite", output: "\u001b[31m✗ prorates a mid-cycle upgrade\u001b[0m", exitCode: 1, duration: 9240 },
  ];
  log.addEventListener("tc-copy", (e) => console.log(e.detail.stepId, e.detail.text.length));
</script>
```

### React / Next.js

```tsx
import { SandboxLog, type SandboxLogStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RunOutput({ output, exitCode }: { output: string; exitCode?: number }) {
  const steps: SandboxLogStep[] = [
    { id: "ci", command: "npm ci", label: "Install dependencies", output: "added 812 packages", exitCode: 0, duration: 18400 },
    { id: "test", command: "npm test", label: "Run the test suite", output, exitCode },
  ];
  return <SandboxLog title="Sandbox" environment="ubuntu-24.04 · node 22.11" steps={steps} onOpenChange={(open) => console.log(open)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/sandbox-log";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";

defineProps<{ steps: TcSandboxLog["steps"]; open: TcSandboxLog["open"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-sandbox-log :steps="steps" :open="open" @tc-open-change="onOpenChange"></tc-sandbox-log>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SandboxLog } from "@adamstavely/trenchcoat/angular/sandbox-log";
import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";

@Component({
  selector: "app-sandbox-log-example",
  imports: [SandboxLog],
  template: `<tc-sandbox-log [steps]="steps()" [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-sandbox-log>`,
})
export class SandboxLogExample {
  readonly steps = input.required<TcSandboxLog["steps"]>();
  readonly open = input.required<TcSandboxLog["open"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sandbox-log";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";

  let { steps, open }: { steps: TcSandboxLog["steps"]; open: TcSandboxLog["open"] } = $props();
  let el: TcSandboxLog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-sandbox-log bind:this={el} {steps} {open}></tc-sandbox-log>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Sandbox"` | Names the region, shown at the top |
| `environment` | `environment` | `string` | `""` | Small text next to the heading – the machine, image or working directory |
| `steps` | – | `SandboxLogStep[]` | `[]` | The commands in the order they ran – one collapsible block each, with their output so far |
| `open` | – | `string[] \| undefined` | `undefined` | Ids of the open steps – unset opens the steps that are running or failed |
| `query` | `query` | `string` | `""` | The search text |
| `maxHeight` | `max-height` | `number` | `320` | Height in px at which a step's output scrolls |
| `follow` | `follow` | `boolean` | `true` | Keeps a step's output scrolled to its end, as a terminal does, until the reader scrolls up |
| `lineNumbers` | `line-numbers` | `boolean` | `true` | Shows a line-number gutter |
| `hideSummary` | `hide-summary` | `boolean` | `false` | Hides the summary line under the log |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A step opens or closes ({ open: string[] }); cancelable – prevent it to control `open` |
| `tc-query-change` | – | Yes | The search text changes ({ query: string }); cancelable – prevent it to control `query` |
| `tc-copy` | – | No | A step's output, or the whole log, was copied ({ stepId: string \| null, text: string }) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `linesOf(id: string)` | `readonly SandboxLogLine[]` | The parsed lines of a step (cached; a longer output parses only its new lines) |
| `go(delta: number)` | `void` | Moves to the next (1) or previous (-1) match: opens its step and scrolls it into view |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sandbox-log-code-bg` | `light-dark(#fafafa, #212123)` | both, clean |
| `--tc-sandbox-log-spin` | `800ms` | both |
| `--tc-sandbox-log-cyan` | `var(--tc-tone-teal-fg)` | both |
| `--tc-sandbox-log-cyan-bg` | `var(--tc-tone-teal-bg)` | both |
| `--tc-sandbox-log-hit` | `light-dark(rgba(245, 165, 36, 0.28), rgba(245, 165, 36, 0.3))` | both |
| `--tc-sandbox-log-hit-current` | `light-dark(rgba(245, 165, 36, 0.62), rgba(245, 165, 36, 0.62))` | both |

#### Design tokens it reads (73)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `sandboxLogPlainText(output: string): string` | The output of a step as plain text – what Copy takes |

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-sandbox-log :steps="…">` | `<tc-sandbox-log [steps]="…">` | `<tc-sandbox-log {steps}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-sandbox-log :open="…">` | `<tc-sandbox-log [open]="…">` | `<tc-sandbox-log {open}>` |

*Also attributes: `heading`, `environment`, `query`, `max-height`, `follow`, `line-numbers`, `hide-summary` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `onQueryChange={…}` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` and `query` itself unless a listener calls `preventDefault()` on `tc-open-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-sandbox-log id="sandbox-log"></tc-sandbox-log>

<script type="module">
  import "@adamstavely/trenchcoat/sandbox-log";

  const el = document.querySelector("#sandbox-log");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/sandbox-log";
import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";

const props = defineProps<{ initial: TcSandboxLog["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcSandboxLog["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-sandbox-log :open="open" @tc-open-change="onOpenChange"></tc-sandbox-log>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SandboxLog } from "@adamstavely/trenchcoat/angular/sandbox-log";
import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";

@Component({
  selector: "app-controlled-sandbox-log",
  imports: [SandboxLog],
  template: `<tc-sandbox-log [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-sandbox-log>`,
})
export class ControlledSandboxLog {
  readonly initial = input.required<TcSandboxLog["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcSandboxLog["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/sandbox-log";
  import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";

  let { initial }: { initial: TcSandboxLog["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcSandboxLog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcSandboxLog["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-sandbox-log bind:this={el} {open}></tc-sandbox-log>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-sandbox-log")` returns a `TcSandboxLog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";`
- **React / Next.js:** Props: `import type { SandboxLogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SandboxLog>`. The element class, for refs: `import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSandboxLog["steps"]` with `import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";`
- **Angular:** The directive types the template: `[steps]` takes `TcSandboxLog["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSandboxLog } from "@adamstavely/trenchcoat/sandbox-log";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `steps` | `TcSandboxLog["steps"]` | The commands in the order they ran – one collapsible block each, with their output so far |
| `title` | `string` | Shown at the top; names the region |
| `open` | `string[]` | Ids of the open steps (controlled) – unset opens the running and failed ones |
| `defaultOpen` | `string[]` | Ids of the steps open at first (uncontrolled) – unset opens the running and failed ones |
| `onOpenChange` | `(open: string[]) => void` | Called with the ids of the open steps whenever a step opens or closes |
| `query` | `string` | The search text (controlled) |
| `defaultQuery` | `string` | The search text at first (uncontrolled) |
| `onQueryChange` | `(query: string) => void` | Called with the search text whenever it changes |
| `onCopy` | `(stepId: string \| null, text: string) => void` | After a copy: the step's id (null for the whole log) and the text |

*Renamed or hidden on the wrapper: `open`, `query`, `heading`, `steps`, `onCopy`*

## Accessibility

Follows the WAI-ARIA [Accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On a step: opens or closes its output |
| ↓ / ↑ | On a step: moves to the next or previous step, wrapping at the ends |
| Home / End | On a step: moves to the first or last step |
| Tab | Moves on – into an open step's output, which scrolls with the arrow keys |
| ⌘F / Ctrl+F | While focus is in the steps: moves to the search and selects its text |
| Enter | In the search: goes to the next match, opening its step |
| Shift+Enter | In the search: goes to the previous match |
| Escape | In the search: clears it |

### Screen readers

The log is a region named by its heading (“Sandbox”) unless the page names it. Each step is a button with
`aria-expanded` and `aria-controls` that reads the command, its label, exit code and time; its output is a focusable
region named “Output of npm test”, and a closed step's output is inert. The search is a search landmark with a field
named “Search output” and “Previous match” / “Next match” buttons. Copy buttons are named “Copy output of npm test”
and “Copy the whole log”. A status region says when a running step finishes (“npm test finished”, “npm test failed
with exit code 1”), how many matches a search found (“12 matches”, “No matches”) and “Copied” after a copy.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.6 KB | 10.3 KB |
| Lit · the library every element is built on, the parts it uses | 22.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/ansi` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **47.8 KB** | **14.8 KB** |
| With Lit – the first component on a page | 71.1 KB | 22.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.3 ms** | the gallery demo's data, 177 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of steps replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 5128 ms | steps: first render, 500,036 nodes; update 3328 ms |

Windowed: 10,000 items of steps render 500,036 nodes in 5128 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Show the command exactly as it ran; put the plain-language purpose in `label` – “Run the test suite”.
- Use `environment` for what helps someone reproduce the run: the image, the runtime and the working directory.
- Keep the output as the command printed it, escape codes included – the component colours it and never reads it as HTML.
- Set `status: "queued"` for steps that haven't started, so they don't read as running.

## Do and don't

### Do

- Pass a longer `output` as it streams – only the new lines are parsed and searched again.
- Update `duration` while a step runs for a live time, and set `exitCode` when it ends.
- Leave `open` unset to let the log open running and failed steps on its own.

### Don't

- Don't strip colour codes before passing the output – the colour carries the failures.
- Don't split one command's output across several steps; a step is one command.
- Don't set `follow` to false for live runs – people lose the end of the output.

## Related

- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Live View](live-view.md) – Watch the agent's screen as it works – its clicks and typing drawn on top, a caption for each step, and Pause or Take over at any moment

## Changelog

- `tc-sandbox-log` – sandbox command output: a block per step with command, exit code and time; ANSI colours (16, 256 and true colour) mapped to tokens, never parsed as HTML; incremental parsing while it streams; copy and search; windowed (50,000 lines render under 400 rows).
