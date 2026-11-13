<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Test Run Result

**Agents** · New

A test run that shows only what failed – counts in words over a bar, each failure opening to its message, expected against received, the stack trimmed to the project's own frames and a link to the file and line, passed tests folded into one line, and Re-run failed

- **Element:** `<tc-test-run-result>`
- **Size:** 9.2 KB gzip · 28.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/test-run-result";` |
| React / Next.js | `import { TestRunResult } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/test-run-result";` · tags starting with tc- are custom elements |
| Angular | `import { TestRunResult } from "@adamstavely/trenchcoat/angular/test-run-result";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/test-run-result";` |

## Example

The live example is in the gallery at `#/test-run-result`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A test run that shows only what failed. The summary says how it went in words – "3 failed, 212 passed, 4 skipped" –
over a bar of the same shares, with the duration and the command. The failing tests come first, each opening to its
assertion message, expected against received as a small line diff, and the stack trimmed to the project's own frames,
with the file and line as a link. Passed and skipped tests fold into one line each that opens to the list. Re-run failed
asks the page to run them again; while `running`, the counts tick up live.

### When to use

- A tool result after an agent ran a project's tests.
- A CI job's test step, where people only need the failures.
- A run that's still going, with live counts.

### When not to use

- Several checks on a change (lint, build, tests) – use [Check Status](check-status.md).
- The raw output of a command – use [Sandbox Log](sandbox-log.md) or [Terminal](terminal.md).
- The changes that made a test fail – use [Diff Viewer](diff-viewer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-trr__summary` – the counts in words, `.ui-trr__bar` and Re-run failed `.ui-trr__rerun`
2. **Failure** `.ui-trr__fail` – one failed test, its `.ui-trr__toggle` and `.ui-trr__panel`
3. **Message** `.ui-trr__message` – the assertion's message
4. **Diff** `.ui-trr__diff` – expected against received, changed lines marked − and +
5. **Stack** `.ui-trr__stack` – the project's own frames
6. **File** `.ui-trr__file` – the file and line, a link
7. **Fold** `.ui-trr__fold` – "212 passed", opening to `.ui-trr__names`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
Narrower than 480 px, the diff stacks expected above received and Re-run moves under the bar.

## Usage

### HTML

```html
<tc-test-run-result id="run" heading="audit-ledger" command="npx vitest run" duration="12400"></tc-test-run-result>

<script type="module">
  import "@adamstavely/trenchcoat/test-run-result";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#run");
  el.counts = { passed: 212, skipped: 4 };
  el.tests = [
    {
      id: "totals",
      suite: "ledger › totals",
      name: "sums postings in the reporting currency",
      status: "failed",
      message: "expected 1240 to be 1214.5",
      expected: "1214.5",
      received: "1240",
      stack: "AssertionError: expected 1240 to be 1214.5\n    at Object.<anonymous> (src/ledger.test.ts:42:18)",
    },
  ];
  el.addEventListener("tc-rerun", (e) => console.log("Re-run", e.detail.ids));
</script>
```

### React / Next.js

```tsx
import { TestRunResult, type TestCase } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Run({ tests, running, rerun, openFile }: { tests: TestCase[]; running: boolean; rerun: (ids: string[]) => void; openFile: (file: string, line?: number) => void }) {
  return (
    <TestRunResult
      title="audit-ledger"
      command="npx vitest run"
      tests={tests}
      counts={{ passed: 212, skipped: 4 }}
      running={running}
      onRerun={(ids) => void rerun(ids)}
      onOpenFile={(file, line) => openFile(file, line)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/test-run-result";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";

defineProps<{ tests: TcTestRunResult["tests"]; counts: TcTestRunResult["counts"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-test-run-result :tests="tests" :counts="counts" @tc-open-change="onOpenChange"></tc-test-run-result>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TestRunResult } from "@adamstavely/trenchcoat/angular/test-run-result";
import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";

@Component({
  selector: "app-test-run-result-example",
  imports: [TestRunResult],
  template: `<tc-test-run-result [tests]="tests()" [counts]="counts()" (tc-open-change)="onOpenChange($event)"></tc-test-run-result>`,
})
export class TestRunResultExample {
  readonly tests = input.required<TcTestRunResult["tests"]>();
  readonly counts = input.required<TcTestRunResult["counts"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/test-run-result";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";

  let { tests, counts }: { tests: TcTestRunResult["tests"]; counts: TcTestRunResult["counts"] } = $props();
  let el: TcTestRunResult;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-test-run-result bind:this={el} {tests} {counts}></tc-test-run-result>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Test run"` | The heading |
| `command` | `command` | `string \| undefined` | `undefined` | The command that ran the tests – "npx vitest run" |
| `tests` | – | `TestCase[]` | `[]` | The tests: the failures with their details, and any passed or skipped ones to list |
| `counts` | – | `Partial<TestCounts> \| undefined` | `undefined` | Totals, for tests left out of `tests` |
| `total` | `total` | `number \| undefined` | `undefined` | How many tests the run has, so the bar can fill towards it while running |
| `duration` | `duration` | `number \| undefined` | `undefined` | How long the run took, in ms |
| `running` | `running` | `boolean` | `false` | The run is still going: the counts are live and Re-run waits |
| `open` | – | `string[] \| undefined` | `undefined` | The failures that are open, by id. Unset: the first failure |
| `noRerun` | `no-rerun` | `boolean` | `false` | Hides Re-run failed |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | A failure was opened or closed ({ open }: TestOpenChange); cancelable – prevented, it stays as it was |
| `tc-open` | – | No | A failure's file link was pressed ({ id, file, line }: TestOpen) |
| `tc-rerun` | – | Yes | Re-run failed was pressed ({ ids }: TestRerun); cancelable – prevented, nothing is announced |

#### Design tokens it reads (61)

`--tc-accent-text`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `isLibraryFrame(line: string): boolean` | A stack frame from a dependency or the runtime, left out of the trimmed stack |
| `firstUserFrame(stack: string \| undefined): { file: string; line?: number } \| null` | The first frame of the project's own code as { file, line } – "at post (src/ledger.ts:42:7)" |
| `countTests(tests: readonly TestCase[], counts?: Partial<TestCounts>): TestCounts` | Totals from the tests, with `counts` filling in what the tests leave out (the larger of the two wins) |

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
| `tests` | `el.tests = …;` | `<… tests={…} />` | `<tc-test-run-result :tests="…">` | `<tc-test-run-result [tests]="…">` | `<tc-test-run-result {tests}>` |
| `counts` | `el.counts = …;` | `<… counts={…} />` | `<tc-test-run-result :counts="…">` | `<tc-test-run-result [counts]="…">` | `<tc-test-run-result {counts}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-test-run-result :open="…">` | `<tc-test-run-result [open]="…">` | `<tc-test-run-result {open}>` |

*Also attributes: `heading`, `command`, `total`, `duration`, `running`, `no-rerun` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpenFile={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-rerun` | Yes | `el.addEventListener("tc-rerun", (e) => …)` | `onRerun={…}` | `@tc-rerun="…"` | `(tc-rerun)="…($event)"` | `el.addEventListener("tc-rerun", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-test-run-result id="test-run-result"></tc-test-run-result>

<script type="module">
  import "@adamstavely/trenchcoat/test-run-result";

  const el = document.querySelector("#test-run-result");
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
import "@adamstavely/trenchcoat/test-run-result";
import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";

const props = defineProps<{ initial: TcTestRunResult["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcTestRunResult["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-test-run-result :open="open" @tc-open-change="onOpenChange"></tc-test-run-result>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TestRunResult } from "@adamstavely/trenchcoat/angular/test-run-result";
import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";

@Component({
  selector: "app-controlled-test-run-result",
  imports: [TestRunResult],
  template: `<tc-test-run-result [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-test-run-result>`,
})
export class ControlledTestRunResult {
  readonly initial = input.required<TcTestRunResult["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcTestRunResult["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/test-run-result";
  import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";

  let { initial }: { initial: TcTestRunResult["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcTestRunResult;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcTestRunResult["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-test-run-result bind:this={el} {open}></tc-test-run-result>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-test-run-result")` returns a `TcTestRunResult` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";`
- **React / Next.js:** Props: `import type { TestRunResultProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TestRunResult>`. The element class, for refs: `import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTestRunResult["tests"]` with `import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";`
- **Angular:** The directive types the template: `[tests]` takes `TcTestRunResult["tests"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTestRunResult } from "@adamstavely/trenchcoat/test-run-result";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `open` | `string[]` | The failures that are open, by id. Controlled when defined |
| `defaultOpen` | `string[]` | The failures open at first when uncontrolled; left out, the first failure |
| `onOpenChange` | `(open: string[]) => void` | A failure was opened or closed |
| `onOpenFile` | `(file: string, line: number \| undefined, id: string) => void` | A failure's file link was pressed |
| `onRerun` | `(ids: string[]) => void \| boolean` | Re-run failed was pressed. Return false to stop it being announced |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The failures' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ or K / J | Move between failures |
| Home / End | The first or last failure |
| Enter / Space | Open or close the failure |
| Tab | On into an open failure's file link |

### Screen readers

The failures are a list named "Failed tests"; each is a button with `aria-expanded` that reads the test's suite, name
and "failed". The bar is hidden – the summary says the same in words. In the diff, each changed line is read with
"expected:" or "received:" in front. A re-run and the end of a run ("Run finished: 1 failed, 213 passed") are announced
through `role="status"`. While running, Re-run failed is `aria-disabled`.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.5 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **28.9 KB** | **9.2 KB** |
| With Lit – the first component on a page | 51.5 KB | 16.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 133 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of tests replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 8.4 ms | tests: first render, 1,599 nodes; update 1.7 ms |
| 1,000 items | 46 ms | tests: first render, 15,399 nodes; update 8.7 ms |

1,000 items of tests: 46 ms, 15,399 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name tests for the behaviour they check; `suite` carries the file or describe path.
- Pass `expected` and `received` as the runner printed them, one value per line.
- Leave passed tests out of `tests` for a big suite and give `counts` instead.

## Do and don't

### Do

- Run the tests again on `tc-rerun`, set `running`, and update `tests` as results arrive.
- Open the file in the app's editor on `tc-open`.

### Don't

- Don't paste the whole runner output into `message`; that's what `sandbox-log` is for.
- Don't show only the bar: the counts in words are what people read.

## Related

- [Check Status](check-status.md) – The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.
- [Sandbox Log](sandbox-log.md) – Command output from the agent's sandbox – a block per step with the command, exit code and time, streaming text in colour, copy and search, fast with long logs
- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
- [Terminal](terminal.md) – A command line for a panel – output in colour above a prompt with history, Ctrl+C and Ctrl+L; the page runs the commands
