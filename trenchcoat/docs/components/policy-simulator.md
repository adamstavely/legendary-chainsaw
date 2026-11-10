<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Policy Simulator

**Trust & calibration** · New

Try an action against the policy before it's real – allow, needs approval, deny or hard stop, the rule that decided it and why

- **Element:** `<tc-policy-simulator>`
- **Size:** 11.8 KB gzip · 43.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/policy-simulator";` |
| React / Next.js | `import { PolicySimulator } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/policy-simulator";` · tags starting with tc- are custom elements |
| Angular | `import { PolicySimulator } from "@adamstavely/trenchcoat/angular/policy-simulator";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/policy-simulator";` |

## Example

The live example is in the gallery at `#/policy-simulator`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A place to try an action against the policy before it's real. People describe what an agent would do, pick its rule
class and add any context the rules read – an amount, a recipient, an environment – and Simulate shows what the
policy would decide: allow, needs approval, deny or hard stop. The answer names the rule that decided it and why, and
a trace lists every rule in the order it was checked, so people can see why a rule didn't apply as well as why one
did. Nothing executes: the element hands the inputs to the app's `evaluate()` and only shows what comes back.

### When to use

- Policy authors checking a new or changed rule before it's switched on.
- Admins answering “would the agent be allowed to do this?” without running the agent.
- Explaining a past decision: fill in the action that was blocked and show the rule and the trace.

### When not to use

- Setting which agent may use which tool – use [Tool Permissions](tool-permissions.md).
- Asking a person to approve a real action that's about to happen – use [Approval Card](approval-card.md).
- Showing the timing and cost of a run that has happened – use [Trace Waterfall](trace-waterfall.md).
- An agent asking for access in the middle of a run – use [Permission Request](permission-request.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Examples** `.ui-psim__examples` – ready-made actions that fill the form in one click
2. **Form** `.ui-psim__form` – the action, its rule class and optional context
3. **Dry-run note** `.ui-psim__dry` – a reminder that nothing is executed, beside Simulate
4. **Decision** `.ui-psim__verdict` – allow, needs approval, deny or hard stop, with the reason
5. **Rule** `.ui-psim__rule` – the rule that decided it: name, id and where it lives
6. **Trace** `.ui-psim__trace` – every rule in the order it was checked; the deciding one marked

## Looks

Standard is a white card on a gray tray holding the form, with the result in a second white card below it. Clean is
one white card, with the result under a hairline. Clean's labels and examples are quieter; the decision colours and
the trace are the same in both.

## Usage

### HTML

```html
<tc-policy-simulator id="sim" description="Check what the policy would do before it happens."></tc-policy-simulator>

<script type="module">
  import "@adamstavely/trenchcoat/policy-simulator";
  import "@adamstavely/trenchcoat/tokens.css";

  const sim = document.querySelector("#sim");
  sim.examples = [{ label: "Refund $2,400", action: "Refund invoice INV-2291", ruleClass: "spend", context: "amount: $2,400" }];
  sim.evaluate = (input) => fetch("/api/policy/dry-run", { method: "POST", body: JSON.stringify(input) }).then((r) => r.json());
  sim.addEventListener("tc-result", (e) => console.log(e.detail.result.decision));
</script>
```

### React / Next.js

```tsx
import { PolicySimulator, type PolicySimInput, type PolicySimResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function DryRun({ dryRun }: { dryRun: (input: PolicySimInput) => Promise<PolicySimResult> }) {
  return (
    <PolicySimulator
      description="Check what the policy would do before it happens."
      defaultValue={{ action: "Refund invoice INV-2291", ruleClass: "spend", context: "amount: $2,400" }}
      evaluate={dryRun}
      onResult={(result) => console.log(result.decision, result.rule?.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/policy-simulator";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";

defineProps<{ ruleClasses: TcPolicySimulator["ruleClasses"]; examples: TcPolicySimulator["examples"] }>();
const onInputChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-policy-simulator :ruleClasses="ruleClasses" :examples="examples" @tc-input-change="onInputChange"></tc-policy-simulator>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PolicySimulator } from "@adamstavely/trenchcoat/angular/policy-simulator";
import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";

@Component({
  selector: "app-policy-simulator-example",
  imports: [PolicySimulator],
  template: `<tc-policy-simulator [ruleClasses]="ruleClasses()" [examples]="examples()" (tc-input-change)="onInputChange($event)"></tc-policy-simulator>`,
})
export class PolicySimulatorExample {
  readonly ruleClasses = input.required<TcPolicySimulator["ruleClasses"]>();
  readonly examples = input.required<TcPolicySimulator["examples"]>();
  onInputChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/policy-simulator";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";

  let { ruleClasses, examples }: { ruleClasses: TcPolicySimulator["ruleClasses"]; examples: TcPolicySimulator["examples"] } = $props();
  let el: TcPolicySimulator;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-input-change", on);
    return () => el.removeEventListener("tc-input-change", on);
  });
</script>

<tc-policy-simulator bind:this={el} {ruleClasses} {examples}></tc-policy-simulator>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Policy simulator"` | The heading, and the form's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `action` | `action` | `string` | `""` | The action to try, in words or as a tool call, e.g. "Send the Q3 report to an external address" |
| `ruleClass` | `rule-class` | `string` | `""` | The id of the picked rule class; unset picks the first |
| `context` | `context` | `string` | `""` | Optional context the rules can read, e.g. "amount: 4,800 · recipient: outside the company" |
| `ruleClasses` | – | `PolicyRuleClass[]` | `[ { id: "read", label: "Read", description: "Looks something up; changes nothing" }, { id: "write", label: "Write", description: "Creates or changes records" }, { id: "communicate", label: "Communicate", description: "Sends something to a person or another system" }, { id: "spend", label: "Spend", description: "Moves money or commits to a cost" }, { id: "delete", label: "Delete", description: "Removes something that may not come back" }, ]` | The rule classes to pick from |
| `examples` | – | `PolicySimExample[]` | `[]` | Ready-made actions shown as chips above the form; [] hides them |
| `evaluate` | – | `((input: PolicySimInput) => PolicySimResult \| Promise<PolicySimResult>) \| undefined` | `undefined` | Runs the dry run: return the result, or a promise of it. Nothing in the element executes the action |
| `result` | – | `PolicySimResult \| undefined` | `undefined` | The result shown – set by a run, or by the app (after preventing tc-simulate) |
| `decisionLabels` | – | `Partial<Record<PolicyDecision, string>>` | `{}` | The decisions' names, merged over the defaults (Allow, Needs approval, Deny, Hard stop) |
| `actionLabel` | `action-label` | `string` | `"Action"` | The action field's label |
| `actionPlaceholder` | `action-placeholder` | `string` | `"What should the agent do?"` | The action field's placeholder |
| `classLabel` | `class-label` | `string` | `"Rule class"` | The rule class field's label |
| `contextLabel` | `context-label` | `string` | `"Context"` | The context field's label; the field is optional |
| `contextPlaceholder` | `context-placeholder` | `string` | `"Anything the rules should know – amount, recipient, environment"` | The context field's placeholder |
| `simulateLabel` | `simulate-label` | `string` | `"Simulate"` | The Simulate button's text |
| `requiredLabel` | `required-label` | `string` | `"Describe the action to simulate."` | Shown when Simulate is pressed with no action |
| `errorLabel` | `error-label` | `string` | `"Couldn't run the simulation. Try again."` | Shown when `evaluate` throws or its promise rejects |
| `dryRunLabel` | `dry-run-label` | `string` | `"Dry run – nothing is executed"` | The reminder next to Simulate that nothing runs |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-input-change` | – | Yes | The action, the rule class or the context changed, or an example filled them ({ input, field }: PolicySimInputChange); cancelable – prevented, the fields keep their values |
| `tc-simulate` | – | Yes | Simulate was pressed with a described action ({ input }: PolicySimRun); cancelable – prevented, `evaluate` isn't called and the app sets `result` itself |
| `tc-result` | – | No | `evaluate` returned a result ({ input, result }: PolicySimResultEvent) |

#### Design tokens it reads (94)

`--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPolicyRuleClasses: PolicyRuleClass[]` | The rule classes used when the page gives none |
| `defaultPolicyDecisionLabels: Record<PolicyDecision, string>` | The decisions' names used when the page gives none |

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
| `ruleClasses` | `el.ruleClasses = …;` | `<… ruleClasses={…} />` | `<tc-policy-simulator :ruleClasses="…">` | `<tc-policy-simulator [ruleClasses]="…">` | `<tc-policy-simulator {ruleClasses}>` |
| `examples` | `el.examples = …;` | `<… examples={…} />` | `<tc-policy-simulator :examples="…">` | `<tc-policy-simulator [examples]="…">` | `<tc-policy-simulator {examples}>` |
| `evaluate` | `el.evaluate = …;` | `<… evaluate={…} />` | `<tc-policy-simulator :evaluate="…">` | `<tc-policy-simulator [evaluate]="…">` | `<tc-policy-simulator {evaluate}>` |
| `result` | `el.result = …;` | `<… result={…} />` | `<tc-policy-simulator :result="…">` | `<tc-policy-simulator [result]="…">` | `<tc-policy-simulator {result}>` |
| `decisionLabels` | `el.decisionLabels = …;` | `<… decisionLabels={…} />` | `<tc-policy-simulator :decisionLabels="…">` | `<tc-policy-simulator [decisionLabels]="…">` | `<tc-policy-simulator {decisionLabels}>` |

*Also attributes: `heading`, `description`, `action`, `rule-class`, `context`, `action-label`, `action-placeholder`, `class-label` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-input-change` | Yes | `el.addEventListener("tc-input-change", (e) => …)` | `onChange={…}` | `@tc-input-change="…"` | `(tc-input-change)="…($event)"` | `el.addEventListener("tc-input-change", …)` |
| `tc-simulate` | Yes | `el.addEventListener("tc-simulate", (e) => …)` | `onSimulate={…}` | `@tc-simulate="…"` | `(tc-simulate)="…($event)"` | `el.addEventListener("tc-simulate", …)` |
| `tc-result` | No | `el.addEventListener("tc-result", (e) => …)` | `onResult={…}` | `@tc-result="…"` | `(tc-result)="…($event)"` | `el.addEventListener("tc-result", …)` |

### Controlled

`tc-input-change`, `tc-simulate` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-policy-simulator")` returns a `TcPolicySimulator` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";`
- **React / Next.js:** Props: `import type { PolicySimulatorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PolicySimulator>`. The element class, for refs: `import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPolicySimulator["ruleClasses"]` with `import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";`
- **Angular:** The directive types the template: `[ruleClasses]` takes `TcPolicySimulator["ruleClasses"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPolicySimulator } from "@adamstavely/trenchcoat/policy-simulator";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the form's name |
| `value` | `Partial<PolicySimInput>` | The action, rule class and context – controlled when given |
| `defaultValue` | `Partial<PolicySimInput>` | The inputs on mount when `value` isn't controlled |
| `onChange` | `(input: PolicySimInput, field: PolicySimInputChange["field"]) => void` | A field changed or an example filled the form |
| `evaluate` | `(input: PolicySimInput) => PolicySimResult \| Promise<PolicySimResult>` | Runs the dry run: return the result, or a promise of it |
| `result` | `PolicySimResult` | The result shown – controlled when given; otherwise the last result `evaluate` returned |
| `onSimulate` | `(input: PolicySimInput) => boolean \| void` | Simulate was pressed. Return false to skip `evaluate` and set `result` yourself |
| `onResult` | `(result: PolicySimResult, input: PolicySimInput) => void` | `evaluate` returned a result |

*Renamed or hidden on the wrapper: `heading`, `action`, `ruleClass`, `context`, `result`, `evaluate`, `onChange`, `defaultValue`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the examples, the fields, Simulate and the trace toggle |
| ← / → | In the examples, moves to the previous or next one (one tab stop for all of them) |
| Home / End | In the examples, moves to the first or last one |
| Enter / Space | On an example, fills the form with it; on the trace toggle, shows or hides the trace |
| Enter | In the action field, runs the simulation |
| ⌘ Enter / Ctrl Enter | In the context field, runs the simulation |

### Screen readers

The form is named by the heading, and each field by its visible label; the rule class is described by the class's
own line (“Moves money or commits to a cost”). Simulate with no action marks the action field `aria-invalid` and
describes it with “Describe the action to simulate.”. A polite status message says “Simulating…” while a promise
runs, then the outcome – “Needs approval – Payments over $1,000. $2,400 is over the $1,000 limit…”. The result is a
section headed “Decision: Needs approval”, and `aria-busy` while a new run is on its way. The trace toggle is a
button with `aria-expanded` that controls the list; each step starts with its outcome for screen readers –
“Matched”, “No match”, “Not checked” or “Not reached”. The examples are a `toolbar` labelled “Try”. A failed run
shows an alert with `errorLabel`.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.6 KB | 9.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.1 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **43.0 KB** | **11.9 KB** |
| With Lit – the first component on a page | 63.7 KB | 18.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 132 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of ruleClasses replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.1 ms | ruleClasses: first render, 227 nodes; update 0.1 ms |
| 1,000 items | 7.9 ms | ruleClasses: first render, 1,127 nodes; update 1.0 ms |

1,000 items of ruleClasses: 7.9 ms, 1,127 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the action as the agent would do it, with the object: “Refund invoice INV-2291 in full”, not “refund”.
- Name rule classes by what the action does – Read, Write, Communicate, Spend, Delete – and give each a one-line
  `description`.
- Give the reason in one sentence that says the fact and the consequence: “$2,400 is over the $1,000 limit, so a
  person approves it first.”
- Keep a step's `detail` to a few words: “Only for delete”, “Every recipient is internal”.
- Use `decisionLabels` to match the words your policy already uses, rather than renaming them in the reason.

## Do and don't

### Do

- Return every rule in `trace`, in the order the policy checked them, including those after the deciding one – the
  element marks them as not reached.
- Set `rule.source` to the policy and version, so people know which policy answered.
- Offer three to five `examples` covering each decision, so people can see the policy's edges quickly.

### Don't

- Don't run the action, or anything with side effects, inside `evaluate()` – the element tells people nothing runs.
- Don't leave `rule` unset when a rule decided it; an unset rule reads as “the default applied”.
- Don't hide the trace by default – it's how people find out why the rule they expected didn't fire.

## Related

- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
