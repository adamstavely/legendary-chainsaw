<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Test Run Panel

**Agents** · New

Try an agent while you edit it – a badge for the draft or live version, the conversation with the tools it called folded into rows, test variables sent with every message, Reset, and Save as test case on each reply

- **Element:** `<tc-test-run-panel>`
- **Size:** 18.3 KB gzip · 73.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/test-run-panel";` |
| React / Next.js | `import { TestRunPanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/test-run-panel";` · tags starting with tc- are custom elements |
| Angular | `import { TestRunPanel } from "@adamstavely/trenchcoat/angular/test-run-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/test-run-panel";` |

## Example

The live example is in the gallery at `#/test-run-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A small panel for trying an agent while you edit it. A badge says which version answers – "Testing draft v14", or
the live one – and the conversation runs in a log: your messages, the agent's replies, and the tools it called
folded into one row each. Test inputs such as the person's region or plan sit in a Variables strip and go with every
message. When a reply is worth keeping, "Save as test case" hands it to the page with the message that asked for it,
so a good or bad answer becomes an eval case in one click. Reset starts the conversation over.

The page does the answering: Send fires `tc-send` with the text and the variables, and the page appends the turns –
yours, then the agent's, streamed – to `turns`.

### When to use

- Beside an agent's instructions, tools or model settings, to try a change before publishing it.
- Comparing the draft with the live version by switching `target`.
- Turning real exchanges into test cases while you're exploring.

### When not to use

- The conversation people have with a published agent – use [Chat Composer](chat-composer.md) and a full chat thread.
- Reading the results of many test cases – use [Eval Scorecard](eval-scorecard.md).
- Grading outputs that already happened – use [Review Queue](review-queue.md).
- One tool call on its own – use [Tool Call Card](tool-call-card.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Badge** `.ui-trp__badge` – which version answers, in the header
2. **Variables** `.ui-trp__vars` – a disclosure with a name and value field per test input; folded, the inputs show as chips
3. **Log** `.ui-trp__log` – the conversation, newest at the bottom
4. **Turn** `.ui-trp__turn` – who said it, the agent's tool calls (`tc-tool-call-card`), the text, and an error when it failed
5. **Save** `.ui-trp__save` – "Save as test case" under a finished reply; "Saved as a test case" afterwards
6. **Composer** `.ui-trp__compose` – the message field, Reset conversation and Send

## Looks

Standard puts the heading, the agent's name and the badge on a gray tray with the panel on a white card inside it.
Clean is one white card with hairline dividers. The draft badge is amber and the live one green, and both say which in
words. The log's height is `--tc-trp-log-h` (320 px), which a page can override on `[data-ui="trp"]`.

## Usage

### HTML

```html
<tc-test-run-panel id="tester" agent="Policy Q&A" version="v14"></tc-test-run-panel>

<script type="module">
  import "@adamstavely/trenchcoat/test-run-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const tester = document.querySelector("#tester");
  tester.variables = [{ key: "region", value: "EU" }];
  tester.turns = [
    { id: "u1", role: "user", text: "Can I claim a taxi from the airport?" },
    { id: "a1", role: "agent", text: "Yes, after 21:00 – section 4.2.", tools: [{ id: "t1", name: "search_policy", status: "success", duration: 640 }] },
  ];
  tester.addEventListener("tc-send", (e) => {
    const n = tester.turns.length;
    tester.turns = [...tester.turns, { id: `u${n}`, role: "user", text: e.detail.text }, { id: `a${n}`, role: "agent", text: "Let me check the policy…" }];
  });
  tester.addEventListener("tc-save-case", (e) => console.log("Save", e.detail.input, e.detail.turn.text));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TestRunPanel, type TestRunTurn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function TryDraft({ ask, saveCase }: { ask: (text: string) => Promise<string>; saveCase: (input: string, output: string) => void }) {
  const [turns, setTurns] = useState<TestRunTurn[]>([]);
  return (
    <TestRunPanel
      agent="Policy Q&A"
      version="v14"
      turns={turns}
      onTurnsChange={setTurns}
      onSend={(text) => {
        const id = String(turns.length);
        setTurns((t) => [...t, { id: `u${id}`, role: "user", text }, { id: `a${id}`, role: "agent", text: "", streaming: true }]);
        void ask(text).then((reply) => setTurns((t) => t.map((x) => (x.id === `a${id}` ? { ...x, text: reply, streaming: false } : x))));
      }}
      onSaveCase={({ input, turn }) => saveCase(input, turn.text)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/test-run-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";

defineProps<{ turns: TcTestRunPanel["turns"]; variables: TcTestRunPanel["variables"] }>();
const onSend = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-test-run-panel :turns="turns" :variables="variables" @tc-send="onSend"></tc-test-run-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TestRunPanel } from "@adamstavely/trenchcoat/angular/test-run-panel";
import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";

@Component({
  selector: "app-test-run-panel-example",
  imports: [TestRunPanel],
  template: `<tc-test-run-panel [turns]="turns()" [variables]="variables()" (tc-send)="onSend($event)"></tc-test-run-panel>`,
})
export class TestRunPanelExample {
  readonly turns = input.required<TcTestRunPanel["turns"]>();
  readonly variables = input.required<TcTestRunPanel["variables"]>();
  onSend(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/test-run-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";

  let { turns, variables }: { turns: TcTestRunPanel["turns"]; variables: TcTestRunPanel["variables"] } = $props();
  let el: TcTestRunPanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-send", on);
    return () => el.removeEventListener("tc-send", on);
  });
</script>

<tc-test-run-panel bind:this={el} {turns} {variables}></tc-test-run-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Test"` | The heading |
| `agent` | `agent` | `string` | `""` | The agent's name, shown under the heading |
| `target` | `target` | `TestRunTarget` | `"draft"` | Which version answers: the draft being edited, or the live one |
| `version` | `version` | `string` | `""` | The version's label – "v14" – shown in the badge |
| `turns` | – | `TestRunTurn[]` | `[]` | The conversation so far, oldest first. The page appends to it |
| `variables` | – | `TestRunVariable[]` | `[]` | Test inputs sent with every message. Changed by the user unless a tc-variables-change listener prevents it |
| `saved` | – | `string[]` | `[]` | Ids of the replies already saved as test cases |
| `streaming` | `streaming` | `boolean` | `false` | The agent is answering: the log is busy and Send waits |
| `hideVariables` | `hide-variables` | `boolean` | `false` | Hides the Variables strip |
| `labels` | – | `Partial<TestRunPanelLabels>` | `{}` | Words the page can rename, merged over defaultTestRunPanelLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-send` | – | Yes | Send was pressed with text ({ text, variables }: TestRunSend); cancelable – prevented, the text stays in the field |
| `tc-turns-change` | – | Yes | Reset cleared the conversation ({ turns }: TestRunTurnsChange); cancelable – prevented, the turns stay |
| `tc-variables-change` | – | Yes | A variable was added, edited or removed ({ variables }: TestRunVariablesChange); cancelable |
| `tc-save-case` | – | Yes | "Save as test case" on a reply ({ turn, input, variables }: TestRunSaveCase); cancelable – prevented, the reply isn't marked saved |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-trp-log-h` | `320px` | both |

#### Design tokens it reads (62)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-slowest`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `turns` | `el.turns = …;` | `<… turns={…} />` | `<tc-test-run-panel :turns="…">` | `<tc-test-run-panel [turns]="…">` | `<tc-test-run-panel {turns}>` |
| `variables` | `el.variables = …;` | `<… variables={…} />` | `<tc-test-run-panel :variables="…">` | `<tc-test-run-panel [variables]="…">` | `<tc-test-run-panel {variables}>` |
| `saved` | `el.saved = …;` | `<… saved={…} />` | `<tc-test-run-panel :saved="…">` | `<tc-test-run-panel [saved]="…">` | `<tc-test-run-panel {saved}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-test-run-panel :labels="…">` | `<tc-test-run-panel [labels]="…">` | `<tc-test-run-panel {labels}>` |

*Also attributes: `heading`, `agent`, `target`, `version`, `streaming`, `hide-variables` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-turns-change` | Yes | `el.addEventListener("tc-turns-change", (e) => …)` | `ref.current.addEventListener("tc-turns-change", …)` | `@tc-turns-change="…"` | `(tc-turns-change)="…($event)"` | `el.addEventListener("tc-turns-change", …)` |
| `tc-variables-change` | Yes | `el.addEventListener("tc-variables-change", (e) => …)` | `ref.current.addEventListener("tc-variables-change", …)` | `@tc-variables-change="…"` | `(tc-variables-change)="…($event)"` | `el.addEventListener("tc-variables-change", …)` |
| `tc-save-case` | Yes | `el.addEventListener("tc-save-case", (e) => …)` | `onSaveCase={…}` | `@tc-save-case="…"` | `(tc-save-case)="…($event)"` | `el.addEventListener("tc-save-case", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `turns` and `variables` itself unless a listener calls `preventDefault()` on `tc-turns-change` or `tc-variables-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-test-run-panel id="test-run-panel"></tc-test-run-panel>

<script type="module">
  import "@adamstavely/trenchcoat/test-run-panel";

  const el = document.querySelector("#test-run-panel");
  el.addEventListener("tc-turns-change", (e) => {
    e.preventDefault(); // the element keeps its turns…
    if (allowed(e.detail.turns)) el.turns = e.detail.turns; // …until the app sets it
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
import "@adamstavely/trenchcoat/test-run-panel";
import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";

const props = defineProps<{ initial: TcTestRunPanel["turns"] }>();
const turns = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTurnsChange = (e: CustomEvent<{ turns: TcTestRunPanel["turns"] }>) => {
  e.preventDefault();
  turns.value = e.detail.turns;
};
</script>

<template>
  <tc-test-run-panel :turns="turns" @tc-turns-change="onTurnsChange"></tc-test-run-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TestRunPanel } from "@adamstavely/trenchcoat/angular/test-run-panel";
import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";

@Component({
  selector: "app-controlled-test-run-panel",
  imports: [TestRunPanel],
  template: `<tc-test-run-panel [turns]="turns()" (tc-turns-change)="onTurnsChange($event)"></tc-test-run-panel>`,
})
export class ControlledTestRunPanel {
  readonly initial = input.required<TcTestRunPanel["turns"]>();
  readonly turns = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTurnsChange(e: CustomEvent<{ turns: TcTestRunPanel["turns"] }>) {
    e.preventDefault();
    this.turns.set(e.detail.turns);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/test-run-panel";
  import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";

  let { initial }: { initial: TcTestRunPanel["turns"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let turns = $derived(initial);
  let el: TcTestRunPanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      turns = (e as CustomEvent<{ turns: TcTestRunPanel["turns"] }>).detail.turns;
    };
    el.addEventListener("tc-turns-change", on);
    return () => el.removeEventListener("tc-turns-change", on);
  });
</script>

<tc-test-run-panel bind:this={el} {turns}></tc-test-run-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-test-run-panel")` returns a `TcTestRunPanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";`
- **React / Next.js:** Props: `import type { TestRunPanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TestRunPanel>`. The element class, for refs: `import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTestRunPanel["turns"]` with `import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";`
- **Angular:** The directive types the template: `[turns]` takes `TcTestRunPanel["turns"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTestRunPanel } from "@adamstavely/trenchcoat/test-run-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – defaults to "Test" |
| `turns` | `TestRunTurn[]` | The conversation. Controlled when defined; otherwise kept by the component from `defaultTurns`, and Reset clears it |
| `defaultTurns` | `TestRunTurn[]` | On mount, when `turns` isn't controlled |
| `onTurnsChange` | `(turns: TestRunTurn[]) => void` | Called when Reset clears the conversation |
| `variables` | `TestRunVariable[]` | Test inputs sent with every message. Controlled when defined |
| `defaultVariables` | `TestRunVariable[]` | On mount, when `variables` isn't controlled |
| `onVariablesChange` | `(variables: TestRunVariable[]) => void` | Called with the next `variables` |
| `onSend` | `(text: string, variables: TestRunVariable[]) => void \| boolean` | Called with the message and the variables when Send is pressed. Return false to keep the text in the field |
| `onSaveCase` | `(saved: TestRunSaveCase) => void \| boolean` | Called when a reply is saved as a test case. Return false to leave it unsaved |

*Renamed or hidden on the wrapper: `heading`, `turns`, `variables`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Variables, the log (it scrolls with the arrow keys), each tool call and Save, the field, Reset and Send |
| Enter | In the field, sends the message |
| Shift + Enter | In the field, starts a new line |
| Enter / Space | Presses the focused button, or opens a tool call |

### Screen readers

The panel is a `group` named by the heading. The conversation is a `log` named "Test conversation", with
`aria-busy` while a reply streams; each turn starts with who said it ("You", "Agent"). When a reply finishes, a status
region says "Agent replied" once – not every streamed word – or that it failed. Send stays focusable while a reply is
on its way, with `aria-disabled` and the description "Waiting for the reply". The Variables button is a disclosure with
`aria-expanded`; each name and value field is labelled ("Name 2", "Value of region"), and each Remove button says
what it removes. Saving and removing are announced.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tool-call-card, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself, tool-call-card | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | tool-call-card, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, tool-call-card, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | tool-call-card | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, tool-call-card, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | tool-call-card | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | tool-call-card | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.7 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| [tool-call-card](tool-call-card.md) · Element it renders | 42.9 KB | – |
| **Added to a page that already has Lit** | **73.7 KB** | **18.3 KB** |
| With Lit – the first component on a page | 96.7 KB | 25.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 126 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of turns replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 20 ms | turns: first render, 3,164 nodes; update 0.8 ms |
| 1,000 items | 190 ms | turns: first render, 31,064 nodes; update 6.3 ms |

1,000 items of turns: 190 ms. It renders every item, so a first render passes 50 ms (a long task) at about 260 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared` (tool-call-card), `setTimeout` (tool-call-card).
- 1 infinite CSS animation.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver` (tool-call-card), `IntersectionObserver` (tool-call-card), `MutationObserver` (tool-call-card), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange` (tool-call-card).
- Reads the clock: `Date.now()` (tool-call-card).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the version the way your editor does – "v14", "Draft 3" – so the badge matches what people see elsewhere.
- Keep variable names short and code-like (`region`, `plan`); the values are what a real request would carry.
- Give each tool call a `summary` – "Travel policy · 3 passages" – so the folded row says what it found.

## Do and don't

### Do

- Append the person's turn as soon as `tc-send` fires, then stream the reply into a second turn with `streaming: true`.
- Set `error` on a reply that failed, so it can't be saved as a test case by mistake.
- Keep `saved` when the page re-renders, so saved replies stay marked.

### Don't

- Don't send test conversations to the live agent's analytics or memory – this panel is for trying things.
- Don't hide which version answers; a test against the wrong version wastes the reviewer's time.
- Don't save a reply without the message that asked for it – the case needs both.

## Related

- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Review Queue](review-queue.md) – Grade real outputs one at a time from the keyboard – the input, output and reference, pass or fail and 1–5 grades per criterion, a note and a suggested verdict, P / F / 1–5 / Enter / J / K / S / U shortcuts with a list on ?, progress with skipped ones counted, and Undo
