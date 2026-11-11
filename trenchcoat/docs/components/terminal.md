<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Terminal

**Workspace & sessions** · New

A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands

- **Element:** `<tc-terminal>`
- **Size:** 9.7 KB gzip · 27.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/terminal";` |
| React / Next.js | `import { Terminal } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/terminal";` · tags starting with tc- are custom elements |
| Angular | `import { Terminal } from "@adamstavely/trenchcoat/angular/terminal";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/terminal";` |

## Example

The live example is in the gallery at `#/terminal`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A command line for a panel: output in colour above a prompt. Pressing Enter fires `tc-command`, and the page runs the
command and passes a longer `output`, so any shell, sandbox or socket can sit behind it. It keeps a history, follows the
end of the output until the reader scrolls up, and stays fast with long output.

### When to use

- A terminal view in a session or workspace panel, such as behind an Icon Rail button.
- Letting someone run commands in a sandbox the page already has a connection to.

### When not to use

- Reading what an agent already ran, step by step – use [Sandbox Log](sandbox-log.md).
- Full-screen programs such as vim or top. This is line-based and doesn't move the cursor; use a terminal emulator such as xterm.js.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Output** `.ui-trm__out` – what's been printed, in colour
2. **Line** `.ui-trm__line` – one row of output
3. **Prompt** `.ui-trm__prompt` – the sign, the command and Stop
4. **Input** `.ui-trm__input` – where the command is typed
5. **Stop** `.ui-trm__stop` – shown while a command runs
6. **Tools** `.ui-trm__tools` – Copy and Clear

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A
page can set `--tc-terminal-bg`, the background of the output.

## Usage

### HTML

```html
<tc-terminal id="term" prompt="~/project $"></tc-terminal>

<script type="module">
  import "@adamstavely/trenchcoat/terminal";
  import "@adamstavely/trenchcoat/tokens.css";

  const term = document.querySelector("#term");
  term.addEventListener("tc-command", (e) => {
    term.output += `$ ${e.detail.command}\nDone\n`;
  });
  term.addEventListener("tc-clear", () => {
    term.output = "";
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Terminal } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Console({ run }: { run: (command: string) => Promise<string> }) {
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  return (
    <Terminal
      output={output}
      running={running}
      onTcCommand={async (e) => {
        setOutput((o) => `${o}$ ${e.detail.command}\n`);
        setRunning(true);
        const printed = await run(e.detail.command);
        setOutput((o) => o + printed);
        setRunning(false);
      }}
      onTcClear={() => setOutput("")}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/terminal";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";

defineProps<{ history: TcTerminal["history"] }>();
const onCommand = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-terminal :history="history" @tc-command="onCommand"></tc-terminal>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Terminal } from "@adamstavely/trenchcoat/angular/terminal";
import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";

@Component({
  selector: "app-terminal-example",
  imports: [Terminal],
  template: `<tc-terminal [history]="history()" (tc-command)="onCommand($event)"></tc-terminal>`,
})
export class TerminalExample {
  readonly history = input.required<TcTerminal["history"]>();
  onCommand(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/terminal";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";

  let { history }: { history: TcTerminal["history"] } = $props();
  let el: TcTerminal;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-command", on);
    return () => el.removeEventListener("tc-command", on);
  });
</script>

<tc-terminal bind:this={el} {history}></tc-terminal>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Terminal"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading – the machine or working directory |
| `output` | `output` | `string` | `""` | Everything printed so far, with ANSI escape codes; pass a longer string as it streams |
| `prompt` | `prompt` | `string` | `"$"` | What stands before the command |
| `value` | `value` | `string` | `""` | The text in the prompt. Changed by typing unless a tc-value-change listener calls preventDefault() |
| `history` | – | `string[]` | `[]` | Earlier commands, oldest first, for ↑ and ↓; commands entered here are added to it |
| `running` | `running` | `boolean` | `false` | A command is running: Enter waits, and Stop and Ctrl+C fire tc-interrupt |
| `disabled` | `disabled` | `boolean` | `false` | The prompt can't be used: for a closed session, or output to read only |
| `masked` | `masked` | `boolean` | `false` | Hides what's typed, for a password prompt, and keeps it out of the history |
| `height` | `height` | `number` | `280` | Height of the output in px |
| `inputLabel` | `input-label` | `string` | `"Command"` | Names the prompt for screen readers |
| `stopLabel` | `stop-label` | `string` | `"Stop"` | Names the Stop button |
| `text` | – | `` | – | The output's lines as plain text |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-command` | – | Yes | Enter was pressed on a command ({ command }: TerminalCommand); cancelable – prevented, the command stays in the prompt |
| `tc-value-change` | – | Yes | The text in the prompt changed ({ value }: TerminalValueChange); cancelable – prevented, `value` stays as it was |
| `tc-interrupt` | – | No | Ctrl+C or Stop while a command runs (detail: null) |
| `tc-clear` | – | No | Ctrl+L or Clear was pressed (detail: null); the page empties `output` |
| `tc-copy` | – | No | The output was copied ({ text }: TerminalCopy) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus()` | `void` | Puts the cursor in the prompt |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-terminal-bg` | `light-dark(#fafafa, #212123)` | both, clean |
| `--tc-terminal-cyan` | `var(--tc-tone-teal-fg)` | both |
| `--tc-terminal-cyan-bg` | `var(--tc-tone-teal-bg)` | both |
| `--tc-terminal-pulse` | `1200ms` | both |

#### Design tokens it reads (50)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-color`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-strong`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `history` | `el.history = …;` | `<… history={…} />` | `<tc-terminal :history="…">` | `<tc-terminal [history]="…">` | `<tc-terminal {history}>` |

*Also attributes: `heading`, `description`, `output`, `prompt`, `value`, `running`, `disabled`, `masked` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-command` | Yes | `el.addEventListener("tc-command", (e) => …)` | `onTcCommand={…}` | `@tc-command="…"` | `(tc-command)="…($event)"` | `el.addEventListener("tc-command", …)` |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-interrupt` | No | `el.addEventListener("tc-interrupt", (e) => …)` | `onTcInterrupt={…}` | `@tc-interrupt="…"` | `(tc-interrupt)="…($event)"` | `el.addEventListener("tc-interrupt", …)` |
| `tc-clear` | No | `el.addEventListener("tc-clear", (e) => …)` | `onTcClear={…}` | `@tc-clear="…"` | `(tc-clear)="…($event)"` | `el.addEventListener("tc-clear", …)` |
| `tc-copy` | No | `el.addEventListener("tc-copy", (e) => …)` | `onTcCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-terminal id="terminal"></tc-terminal>

<script type="module">
  import "@adamstavely/trenchcoat/terminal";

  const el = document.querySelector("#terminal");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
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
import "@adamstavely/trenchcoat/terminal";
import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";

const props = defineProps<{ initial: TcTerminal["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcTerminal["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-terminal :value="value" @tc-value-change="onValueChange"></tc-terminal>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Terminal } from "@adamstavely/trenchcoat/angular/terminal";
import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";

@Component({
  selector: "app-controlled-terminal",
  imports: [Terminal],
  template: `<tc-terminal [value]="value()" (tc-value-change)="onValueChange($event)"></tc-terminal>`,
})
export class ControlledTerminal {
  readonly initial = input.required<TcTerminal["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcTerminal["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/terminal";
  import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";

  let { initial }: { initial: TcTerminal["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcTerminal;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcTerminal["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-terminal bind:this={el} {value}></tc-terminal>
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

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-terminal :value="value" @tc-value-change="value = $event.detail.value"></tc-terminal>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-terminal [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-terminal>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-terminal bind:this={el} {value}></tc-terminal>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-terminal")` returns a `TcTerminal` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";`
- **React / Next.js:** Props: `import type { TerminalProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Terminal>`. The element class, for refs: `import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTerminal["history"]` with `import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";`
- **Angular:** The directive types the template: `[history]` takes `TcTerminal["history"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTerminal } from "@adamstavely/trenchcoat/terminal";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `value` | `string` | The text in the prompt – controlled when given |
| `defaultValue` | `string` | The text in the prompt at first, when `value` isn't controlled |
| `onValueChange` | `(value: string) => void` | The text in the prompt changed |

*Renamed or hidden on the wrapper: `heading`, `value`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter | Fires `tc-command` with what's typed |
| ↑ / ↓ | Move through the history |
| Ctrl+C | Fires `tc-interrupt` while running; otherwise empties the prompt. With text selected, it copies |
| Ctrl+L | Fires `tc-clear` |
| Tab | Leaves the terminal, so keyboard users aren't trapped; it doesn't complete commands |

### Screen readers

The output is a `log`, so new lines are announced politely, and can be focused and scrolled with the keyboard. The input is
named by `input-label`. `role="status"` says when a command starts and finishes.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Array.prototype.at() | 92 | 90 | 15.4 | 15.4 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.5 KB | 5.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/ansi` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **27.8 KB** | **9.7 KB** |
| With Lit – the first component on a page | 49.3 KB | 16.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 36 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of history replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 1.0 ms | history: first render, 36 nodes; update 0.1 ms |

Windowed: 10,000 items of history render 36 nodes in 1.0 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Echo the command into `output` yourself, in whatever form your shell does; the terminal only shows what it's given.
- Set `masked` while a program asks for a password. What's typed is hidden and stays out of the history.
  Only the app sets it: generated UI can't, so a model can't put up a password prompt.

## Do and don't

### Do

- Set `running` while a command runs, so Enter waits and Stop shows.
- Append to `output` rather than replacing it. Only new lines are parsed.

### Don't

- Don't connect it to a shell with more access than the person should have. It sends what's typed, and the server decides what's allowed.
- Don't rely on it to hide secrets that a program prints. Output is shown as it arrives.

## Related

- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
- [Icon Rail](icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.
- [Session Panel](../blocks/session-panel.md) – The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
