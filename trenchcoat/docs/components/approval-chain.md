<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Approval Chain

**Trust & calibration** · New

Several people signing off in order – who's next and who's overdue in words, with Approve, Decline with a note, and Delegate for the person it's waiting on

- **Element:** `<tc-approval-chain>`
- **Size:** 7.7 KB gzip · 24.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/approval-chain";` |
| React / Next.js | `import { ApprovalChain } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/approval-chain";` · tags starting with tc- are custom elements |
| Angular | `import { ApprovalChain } from "@adamstavely/trenchcoat/angular/approval-chain";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/approval-chain";` |

## Example

The live example is in the gallery at `#/approval-chain`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Several people signing off in order. It says who's next and who's overdue, in words. The person it's waiting on can Approve, Decline with a note, or Delegate. After a decline, the rest show as not reached.

### When to use

- A release, payment or document that needs sign-off from several people in turn.

### When not to use

- An agent asking one person for permission – use [Approval Card](approval-card.md).
- One person deciding one case – use [Case Review](../blocks/case-review.md).
- Steps with no people deciding – use [Status Tracker](status-tracker.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `.ui-apc__list` – the people, in order
2. **Step** `.ui-apc__step` – one person, with `.ui-apc__mark`, `.ui-apc__name` and `.ui-apc__word`
3. **Overdue** `.ui-apc__overdue` – shown in words when the due date's passed
4. **Actions** `.ui-apc__actions` – Approve, Decline and Delegate, for the person it's waiting on
5. **Reason** `.ui-apc__note` – required to decline
6. **Summary** `.ui-apc__summary` – who's next, or how it ended

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-apc-mark`.

## Usage

### HTML

```html
<tc-approval-chain id="chain" actor="Noor Haddad"></tc-approval-chain>

<script type="module">
  import "@adamstavely/trenchcoat/approval-chain";
  import "@adamstavely/trenchcoat/tokens.css";

  const chain = document.querySelector("#chain");
  chain.steps = [{ id: "a", name: "Noor Haddad", status: "current" }];
  chain.addEventListener("tc-steps-change", (e) => console.log(e.detail.change));
</script>
```

### React / Next.js

```tsx
import { ApprovalChain, type ApprovalStep } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const steps: ApprovalStep[] = [{ id: "a", name: "Noor Haddad", status: "current" }];

export function Release() {
  return <ApprovalChain defaultSteps={steps} actor="Noor Haddad" onStepsChange={(next) => console.log(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/approval-chain";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";

defineProps<{ steps: TcApprovalChain["steps"]; delegates: TcApprovalChain["delegates"] }>();
const onStepsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-approval-chain :steps="steps" :delegates="delegates" @tc-steps-change="onStepsChange"></tc-approval-chain>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ApprovalChain } from "@adamstavely/trenchcoat/angular/approval-chain";
import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";

@Component({
  selector: "app-approval-chain-example",
  imports: [ApprovalChain],
  template: `<tc-approval-chain [steps]="steps()" [delegates]="delegates()" (tc-steps-change)="onStepsChange($event)"></tc-approval-chain>`,
})
export class ApprovalChainExample {
  readonly steps = input.required<TcApprovalChain["steps"]>();
  readonly delegates = input.required<TcApprovalChain["delegates"]>();
  onStepsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/approval-chain";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";

  let { steps, delegates }: { steps: TcApprovalChain["steps"]; delegates: TcApprovalChain["delegates"] } = $props();
  let el: TcApprovalChain;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-steps-change", on);
    return () => el.removeEventListener("tc-steps-change", on);
  });
</script>

<tc-approval-chain bind:this={el} {steps} {delegates}></tc-approval-chain>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Approvals"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `steps` | – | `ApprovalStep[]` | `[]` | The sign-offs, in order. Changed by the user unless a tc-steps-change listener calls preventDefault() |
| `actor` | `actor` | `string \| undefined` | `undefined` | Who's looking. They can decide when the current step is waiting on this name |
| `delegates` | – | `string[]` | `[]` | Who a step can be handed to |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for overdue and for when a decision was made, epoch ms. The element doesn't read the clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<ApprovalChainLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-steps-change` | – | Yes | Someone approved, declined or delegated ({ steps, change, step }: ApprovalStepsChange); cancelable – prevented, `steps` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-apc-mark` | `28px` | both |
| `--tc-icon-size-md` | `16px` | not set – this fallback applies |

#### Design tokens it reads (48)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-sm`, `--tc-field-bg`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-approval-chain :steps="…">` | `<tc-approval-chain [steps]="…">` | `<tc-approval-chain {steps}>` |
| `delegates` | `el.delegates = …;` | `<… delegates={…} />` | `<tc-approval-chain :delegates="…">` | `<tc-approval-chain [delegates]="…">` | `<tc-approval-chain {delegates}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-approval-chain :labels="…">` | `<tc-approval-chain [labels]="…">` | `<tc-approval-chain {labels}>` |

*Also attributes: `heading`, `description`, `actor`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-steps-change` | Yes | `el.addEventListener("tc-steps-change", (e) => …)` | `onStepsChange={…}` | `@tc-steps-change="…"` | `(tc-steps-change)="…($event)"` | `el.addEventListener("tc-steps-change", …)` |

### Controlled

The element changes `steps` itself unless a listener calls `preventDefault()` on `tc-steps-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-approval-chain id="approval-chain"></tc-approval-chain>

<script type="module">
  import "@adamstavely/trenchcoat/approval-chain";

  const el = document.querySelector("#approval-chain");
  el.addEventListener("tc-steps-change", (e) => {
    e.preventDefault(); // the element keeps its steps…
    if (allowed(e.detail.steps)) el.steps = e.detail.steps; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ApprovalChain } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ApprovalChain>;
type Props = Omit<Own, "steps" | "onStepsChange"> & { initial: NonNullable<Own["steps"]> };

// Controlled: passing steps makes the wrapper prevent the element's own change; the app sets it
export function ControlledApprovalChain({ initial, ...props }: Props) {
  const [steps, setSteps] = useState<Own["steps"]>(initial);
  return <ApprovalChain {...props} steps={steps} onStepsChange={(next) => setSteps(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/approval-chain";
import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";

const props = defineProps<{ initial: TcApprovalChain["steps"] }>();
const steps = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStepsChange = (e: CustomEvent<{ steps: TcApprovalChain["steps"] }>) => {
  e.preventDefault();
  steps.value = e.detail.steps;
};
</script>

<template>
  <tc-approval-chain :steps="steps" @tc-steps-change="onStepsChange"></tc-approval-chain>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ApprovalChain } from "@adamstavely/trenchcoat/angular/approval-chain";
import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";

@Component({
  selector: "app-controlled-approval-chain",
  imports: [ApprovalChain],
  template: `<tc-approval-chain [steps]="steps()" (tc-steps-change)="onStepsChange($event)"></tc-approval-chain>`,
})
export class ControlledApprovalChain {
  readonly initial = input.required<TcApprovalChain["steps"]>();
  readonly steps = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStepsChange(e: CustomEvent<{ steps: TcApprovalChain["steps"] }>) {
    e.preventDefault();
    this.steps.set(e.detail.steps);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/approval-chain";
  import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";

  let { initial }: { initial: TcApprovalChain["steps"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let steps = $derived(initial);
  let el: TcApprovalChain;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      steps = (e as CustomEvent<{ steps: TcApprovalChain["steps"] }>).detail.steps;
    };
    el.addEventListener("tc-steps-change", on);
    return () => el.removeEventListener("tc-steps-change", on);
  });
</script>

<tc-approval-chain bind:this={el} {steps}></tc-approval-chain>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-approval-chain")` returns a `TcApprovalChain` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";`
- **React / Next.js:** Props: `import type { ApprovalChainProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ApprovalChain>`. The element class, for refs: `import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcApprovalChain["steps"]` with `import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";`
- **Angular:** The directive types the template: `[steps]` takes `TcApprovalChain["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcApprovalChain } from "@adamstavely/trenchcoat/approval-chain";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Approvals" |
| `steps` | `ApprovalStep[]` | The sign-offs, in order – controlled when given |
| `defaultSteps` | `ApprovalStep[]` | The sign-offs on mount when `steps` isn't controlled |
| `onStepsChange` | `(steps: ApprovalStep[], detail: ApprovalStepsChange) => void` | Someone approved, declined or delegated |

*Renamed or hidden on the wrapper: `heading`, `steps`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the current step's actions and fields |
| Enter / Space | Presses a button |

After a decision, focus goes to that person's name.

### Screen readers

The steps are an ordered list named by the heading, and the current one has `aria-current="step"`. Status and overdue are words. A required reason uses `aria-required`, and a missing one is tied to its message. `role="status"` announces each decision and who's next.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.5 KB | 5.3 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.2 KB** | **7.7 KB** |
| With Lit – the first component on a page | 44.9 KB | 14.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 54 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of steps replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 16 ms | steps: first render, 990 nodes; update 3.8 ms |
| 1,000 items | 78 ms | steps: first render, 9,765 nodes; update 31 ms |

1,000 items of steps: 78 ms. It renders every item, so a first render passes 50 ms (a long task) at about 640 items – page or filter longer lists.

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

Give `role`, so people know why someone's in the chain. Set `actor` to the person looking. Overdue needs `now`, because the element doesn't read the clock.

## Do and don't

### Do

- Check on the server that the person deciding may decide.
- Record who decided, and when, on `tc-steps-change`.
- Update `now` as time passes, so overdue stays true.

### Don't

- Don't treat `actor` as security. It only chooses what's shown.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Access Review](../blocks/access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
- [Case Review](../blocks/case-review.md) – One case ready for a person to decide – evidence, a timeline, the assistant's labelled suggestion, and a decision that needs a written reason (uses `fact-sheet`, `entity-timeline`, `agent-face`)
- [Status Tracker](status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
