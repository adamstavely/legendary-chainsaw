<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Quality Alerts

**AI configuration** · New

Alert rules that read as sentences – "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats", each slot a labelled field, with an on/off switch, when it last fired, how often it would have fired in the last 30 days, and problems in words

- **Element:** `<tc-quality-alerts>`
- **Size:** 8.9 KB gzip · 27.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/quality-alerts";` |
| React / Next.js | `import { QualityAlerts } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/quality-alerts";` · tags starting with tc- are custom elements |
| Angular | `import { QualityAlerts } from "@adamstavely/trenchcoat/angular/quality-alerts";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/quality-alerts";` |

## Example

The live example is in the gallery at `#/quality-alerts`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Alert rules for a production agent's quality, each written as a sentence with the choices in it: "Alert
[#ops-quality] when [Correctness] [drops below] [3.5] over [24 hours] on at least [50] chats". Every slot is a native
select or number field with its own label, so a rule reads like what it does and still works with a keyboard and a
screen reader. Each rule has an On switch, when it last fired, and how often it would have fired in the last 30 days –
the page works that out and passes it as `preview`, so people can tune a rule before it wakes anyone. Add rule and
Remove change the list. A value that can't work – a threshold outside the metric's scale, fewer than one chat – is
said in words under the sentence, and isn't kept.

### When to use

- Setting up who hears about an agent's quality dropping, and when.
- Tuning how noisy alerts are, with the 30-day preview.
- Any rule simple enough to say in one sentence: a metric, a comparison, a level, a window and a minimum.

### When not to use

- Showing the alerts that fired – use [Alert Feed](alert-feed.md).
- Starting an agent on an event or a schedule – use [Trigger Builder](trigger-builder.md).
- Deciding how much traffic the judge scores – use [Judge Sampling](judge-sampling.md).
- Rules with several conditions joined by and/or – use a query builder.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Rule** `.ui-qal__rule` – one rule, a fieldset
2. **Sentence** `.ui-qal__sentence` – the rule's words with its slots in place
3. **Select** `.ui-qal__select` – a slot with choices: channel, metric, comparison, window
4. **Number** `.ui-qal__number` – a slot for a number: the threshold and the minimum chats
5. **Problem** `.ui-qal__problem` – what can't work, in words
6. **Facts** `.ui-qal__facts` – when it last fired and the 30-day preview
7. **Switch** `.ui-qal__switch` – turns the rule on or off
8. **Remove** `.ui-qal__remove` – removes the rule
9. **Add** `.ui-qal__add` – adds a rule with sensible defaults

## Looks

Standard is a white card on a gray tray, with the header on the tray. Clean is one white card with the header as its
first row. The number fields' width is `--tc-qal-number-w`.

## Usage

### HTML

```html
<tc-quality-alerts id="alerts" heading="Quality alerts"></tc-quality-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/quality-alerts";
  import "@adamstavely/trenchcoat/tokens.css";

  const alerts = document.querySelector("#alerts");
  alerts.channels = [{ id: "ops", label: "#ops-quality" }, { id: "policy", label: "#policy-team" }];
  alerts.metrics = [{ id: "correctness", label: "Correctness", min: 1, max: 5 }];
  alerts.windows = [{ id: "24h", label: "24 hours" }, { id: "7d", label: "7 days" }];
  alerts.rules = [{ id: "r1", channel: "ops", metric: "correctness", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true, preview: 4 }];
  alerts.addEventListener("tc-rules-change", (e) => console.log(e.detail.change, e.detail.rules));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { QualityAlerts, type QualityAlertRule } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const channels = [{ id: "ops", label: "#ops-quality" }];
const metrics = [{ id: "correctness", label: "Correctness", min: 1, max: 5 }];
const windows = [{ id: "24h", label: "24 hours" }];

export function Alerts() {
  const [rules, setRules] = useState<QualityAlertRule[]>([
    { id: "r1", channel: "ops", metric: "correctness", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true },
  ]);
  return <QualityAlerts title="Quality alerts" channels={channels} metrics={metrics} windows={windows} rules={rules} onRulesChange={(next) => setRules(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/quality-alerts";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";

defineProps<{ rules: TcQualityAlerts["rules"]; channels: TcQualityAlerts["channels"] }>();
const onRulesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-quality-alerts :rules="rules" :channels="channels" @tc-rules-change="onRulesChange"></tc-quality-alerts>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { QualityAlerts } from "@adamstavely/trenchcoat/angular/quality-alerts";
import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";

@Component({
  selector: "app-quality-alerts-example",
  imports: [QualityAlerts],
  template: `<tc-quality-alerts [rules]="rules()" [channels]="channels()" (tc-rules-change)="onRulesChange($event)"></tc-quality-alerts>`,
})
export class QualityAlertsExample {
  readonly rules = input.required<TcQualityAlerts["rules"]>();
  readonly channels = input.required<TcQualityAlerts["channels"]>();
  onRulesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quality-alerts";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";

  let { rules, channels }: { rules: TcQualityAlerts["rules"]; channels: TcQualityAlerts["channels"] } = $props();
  let el: TcQualityAlerts;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-rules-change", on);
    return () => el.removeEventListener("tc-rules-change", on);
  });
</script>

<tc-quality-alerts bind:this={el} {rules} {channels}></tc-quality-alerts>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Quality alerts"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `rules` | – | `QualityAlertRule[]` | `[]` | The rules. Changed by the user unless a tc-rules-change listener calls preventDefault() |
| `channels` | – | `QualityAlertOption[]` | `[]` | Where alerts can go |
| `metrics` | – | `QualityAlertMetric[]` | `[]` | What can be watched, with each metric's scale |
| `windows` | – | `QualityAlertOption[]` | `[]` | The windows a rule can look over, e.g. { id: "24h", label: "24 hours" } |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for when rules last fired, epoch ms; unset, dates are shown instead |
| `labels` | – | `Partial<QualityAlertsLabels>` | `{}` | The words used, merged over the defaults |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for numbers and dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-rules-change` | – | Yes | A rule was edited, added, removed or switched ({ rules, id, change }: QualityAlertsChange); cancelable – prevented, `rules` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-qal-number-w` | `7ch` | both |

#### Design tokens it reads (67)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `qualityAlertProblem(rule: QualityAlertRule, metric: QualityAlertMetric \| undefined, labels: Pick<QualityAlertsLabels, "chats">): void` | What's wrong with a rule, in words; "" when it can work |
| `qualityAlertSentence(rule: QualityAlertRule, options: { channels: QualityAlertOption[]; metrics: QualityAlertMetric[]; windows: QualityAlertOption[]; labels?: QualityAlertsLabels; locale?: string }): void` | The rule as a sentence: "Alert #ops-quality when Correctness drops below 3.5 over 24 hours on at least 50 chats" |

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
| `rules` | `el.rules = …;` | `<… rules={…} />` | `<tc-quality-alerts :rules="…">` | `<tc-quality-alerts [rules]="…">` | `<tc-quality-alerts {rules}>` |
| `channels` | `el.channels = …;` | `<… channels={…} />` | `<tc-quality-alerts :channels="…">` | `<tc-quality-alerts [channels]="…">` | `<tc-quality-alerts {channels}>` |
| `metrics` | `el.metrics = …;` | `<… metrics={…} />` | `<tc-quality-alerts :metrics="…">` | `<tc-quality-alerts [metrics]="…">` | `<tc-quality-alerts {metrics}>` |
| `windows` | `el.windows = …;` | `<… windows={…} />` | `<tc-quality-alerts :windows="…">` | `<tc-quality-alerts [windows]="…">` | `<tc-quality-alerts {windows}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-quality-alerts :labels="…">` | `<tc-quality-alerts [labels]="…">` | `<tc-quality-alerts {labels}>` |

*Also attributes: `heading`, `description`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-rules-change` | Yes | `el.addEventListener("tc-rules-change", (e) => …)` | `onRulesChange={…}` | `@tc-rules-change="…"` | `(tc-rules-change)="…($event)"` | `el.addEventListener("tc-rules-change", …)` |

### Controlled

The element changes `rules` itself unless a listener calls `preventDefault()` on `tc-rules-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-quality-alerts id="quality-alerts"></tc-quality-alerts>

<script type="module">
  import "@adamstavely/trenchcoat/quality-alerts";

  const el = document.querySelector("#quality-alerts");
  el.addEventListener("tc-rules-change", (e) => {
    e.preventDefault(); // the element keeps its rules…
    if (allowed(e.detail.rules)) el.rules = e.detail.rules; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { QualityAlerts } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof QualityAlerts>;
type Props = Omit<Own, "rules" | "onRulesChange"> & { initial: NonNullable<Own["rules"]> };

// Controlled: passing rules makes the wrapper prevent the element's own change; the app sets it
export function ControlledQualityAlerts({ initial, ...props }: Props) {
  const [rules, setRules] = useState<Own["rules"]>(initial);
  return <QualityAlerts {...props} rules={rules} onRulesChange={(next) => setRules(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/quality-alerts";
import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";

const props = defineProps<{ initial: TcQualityAlerts["rules"] }>();
const rules = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRulesChange = (e: CustomEvent<{ rules: TcQualityAlerts["rules"] }>) => {
  e.preventDefault();
  rules.value = e.detail.rules;
};
</script>

<template>
  <tc-quality-alerts :rules="rules" @tc-rules-change="onRulesChange"></tc-quality-alerts>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { QualityAlerts } from "@adamstavely/trenchcoat/angular/quality-alerts";
import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";

@Component({
  selector: "app-controlled-quality-alerts",
  imports: [QualityAlerts],
  template: `<tc-quality-alerts [rules]="rules()" (tc-rules-change)="onRulesChange($event)"></tc-quality-alerts>`,
})
export class ControlledQualityAlerts {
  readonly initial = input.required<TcQualityAlerts["rules"]>();
  readonly rules = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRulesChange(e: CustomEvent<{ rules: TcQualityAlerts["rules"] }>) {
    e.preventDefault();
    this.rules.set(e.detail.rules);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quality-alerts";
  import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";

  let { initial }: { initial: TcQualityAlerts["rules"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let rules = $derived(initial);
  let el: TcQualityAlerts;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      rules = (e as CustomEvent<{ rules: TcQualityAlerts["rules"] }>).detail.rules;
    };
    el.addEventListener("tc-rules-change", on);
    return () => el.removeEventListener("tc-rules-change", on);
  });
</script>

<tc-quality-alerts bind:this={el} {rules}></tc-quality-alerts>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-quality-alerts")` returns a `TcQualityAlerts` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";`
- **React / Next.js:** Props: `import type { QualityAlertsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof QualityAlerts>`. The element class, for refs: `import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcQualityAlerts["rules"]` with `import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";`
- **Angular:** The directive types the template: `[rules]` takes `TcQualityAlerts["rules"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcQualityAlerts } from "@adamstavely/trenchcoat/quality-alerts";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `rules` | `QualityAlertRule[]` | The rules – controlled when given |
| `defaultRules` | `QualityAlertRule[]` | The rules on mount when `rules` isn't controlled |
| `onRulesChange` | `(rules: QualityAlertRule[], id: string, change: QualityAlertsChange["change"]) => void` | A rule was edited, added, removed or switched – with the whole list, the rule's id and what happened |

*Renamed or hidden on the wrapper: `heading`, `rules`, `children`*

## Accessibility

### Keyboard

Every slot is a native field, in reading order.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves through the slots, the switch and Remove, rule by rule |
| ↑ / ↓ in a select | Changes the choice |
| ↑ / ↓ in a number | Steps the number |
| Enter / Space on the switch | Turns the rule on or off |

Adding a rule moves the focus to its first slot; removing one moves it to the next rule, or to Add rule.

### Screen readers

Each rule is a fieldset, "Rule 1", described by the whole sentence and its facts, so "Alert #ops-quality when
Correctness drops below 3.5 over 24 hours on at least 50 chats" is heard on entering it. Each slot has its own label –
Channel, Metric, Comparison, Threshold, Window, Minimum chats. A slot that can't be kept is marked invalid and
described by the problem in words. The switch is a `switch` named On and described by the sentence; Remove says which
rule. Adding, removing and switching rules are confirmed in a polite status message.

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

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.3 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.9 KB** | **8.9 KB** |
| With Lit – the first component on a page | 50.3 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 207 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of metrics replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.8 ms | metrics: first render, 495 nodes; update 0.5 ms |
| 1,000 items | 21 ms | metrics: first render, 3,195 nodes; update 2.8 ms |

1,000 items of metrics: 21 ms, 3,195 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name channels the way people know them: "#ops-quality", an email address.
- Give each metric its scale (`min`, `max`), so thresholds are checked.
- Name windows in plain words: "24 hours", "7 days".
- Send a fresh `preview` whenever a rule changes; it's cleared on every edit until then.

## Do and don't

### Do

- Set a minimum number of chats, so a quiet hour doesn't fire an alert.
- Use "falls by more than" for metrics that drift, "drops below" for hard floors.
- Pass `now` when the page has a clock, for "Last fired 3h ago".

### Don't

- Don't make every rule go to the same channel; route by who can act.
- Don't hide the preview – it's what makes a rule worth trusting.
- Don't use this for alerts that aren't about quality; the words are tuned for it.

## Related

- [Alert Feed](alert-feed.md) – A live feed of alerts, newest first – category, severity as an edge, mark and word, a fresh relative time, Escalate and Acknowledge on each, Pause feed with new alerts held back, and polite announcements
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Failure Clusters](failure-clusters.md) – Failing chats grouped by topic, biggest first – a size bar, the count and share, the trend in a word and an arrow, the criteria each fails, and a row that opens to a summary, quotes, Open chats, Add to dataset and Mark as known; filtered by criterion, or as bubbles
- [Judge Sampling](judge-sampling.md) – How much of an agent's traffic an LLM judge reads, and what it costs – a stepped rate per segment, rules that always include a chat, the judge model, and live estimates of chats judged a day, the monthly cost and what the sample can see, with a budget cap that warns
