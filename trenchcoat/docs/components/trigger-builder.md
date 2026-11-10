<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Trigger Builder

**Agents** · New

“Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times

- **Element:** `<tc-trigger-builder>`
- **Size:** 40.4 KB gzip · 171.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/trigger-builder";` |
| React / Next.js | `import { TriggerBuilder } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/trigger-builder";` · tags starting with tc- are custom elements |
| Angular | `import { TriggerBuilder } from "@adamstavely/trenchcoat/angular/trigger-builder";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/trigger-builder";` |

## Example

The live example is in the gallery at `#/trigger-builder`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Sets when an automation or an agent runs: when something happens (“a deal changes stage”) or on a schedule (“every
Monday at 9”). People pick an event from a searchable list, or a frequency, days and a time, optionally only between
two dates; then add conditions such as “only if Amount is more than 10,000”, all or any of them. The whole trigger is
read back as one plain sentence, and a schedule lists its next five runs, so people can check it does what they meant
before they save. It is a form control: with `name` it submits the definition as JSON.

### When to use

- Setting up a scheduled report, a recurring agent run or a workflow that reacts to events in another system.
- Anywhere people would otherwise write a cron expression or a rule by hand.
- Forms where the trigger is saved with other settings – it validates and resets with the form.

### When not to use

- Picking a date range to look at data – use [Date Range Picker](date-range-picker.md).
- Filtering a list or a table by conditions – use [Filter Menu](filter-menu.md).
- Picking one event or item from a long list, with nothing else to set – use [Combobox](combobox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **When** `.ui-tgb__kind` – an event happens, or on a schedule
2. **Rows** `.ui-tgb__rows` – the event, or Repeats, On, At and Active, each with its label
3. **Conditions** `.ui-tgb__conds` – All or Any, one row per condition, and Add condition
4. **Sentence** `.ui-tgb__summary` – the trigger as one plain sentence
5. **Next runs** `.ui-tgb__runs` – the upcoming run times, the first one marked
6. **Foot** `.ui-tgb__foot` – the time zone, or “Runs each time the event happens”

## Looks

Standard is a white card on a gray tray, with the time zone on the tray under the card. Clean is one white card with
hairline shadows and the time zone in its last row under a hairline. Both use the same segmented controls, combobox
and date-range picker in the matching look; in a narrow container the labels sit above their controls.

## Usage

### HTML

```html
<form>
  <tc-trigger-builder id="trigger" name="trigger"></tc-trigger-builder>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/trigger-builder";
  import "@adamstavely/trenchcoat/tokens.css";

  const trigger = document.querySelector("#trigger");
  trigger.heading = "Run this automation";
  trigger.events = [
    {
      id: "deal.stage",
      label: "Deal changes stage",
      phrase: "a deal changes stage",
      group: "Deals",
      fields: [{ id: "amount", label: "Amount", type: "number" }],
    },
  ];
  trigger.value = { kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, conditions: [], match: "all" };
  trigger.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TriggerBuilder, type TriggerEvent, type TriggerValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const events: TriggerEvent[] = [
  { id: "deal.stage", label: "Deal changes stage", phrase: "a deal changes stage", group: "Deals", fields: [{ id: "amount", label: "Amount", type: "number" }] },
];

export function AutomationTrigger() {
  const [value, setValue] = useState<TriggerValue>({
    kind: "schedule",
    schedule: { frequency: "weekly", days: [1], time: "09:00" },
    conditions: [],
    match: "all",
  });
  return <TriggerBuilder title="Run this automation" events={events} value={value} onChange={setValue} name="trigger" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/trigger-builder";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";

defineProps<{ value: TcTriggerBuilder["value"]; events: TcTriggerBuilder["events"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-trigger-builder :value="value" :events="events" @tc-value-change="onValueChange"></tc-trigger-builder>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TriggerBuilder } from "@adamstavely/trenchcoat/angular/trigger-builder";
import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";

@Component({
  selector: "app-trigger-builder-example",
  imports: [TriggerBuilder],
  template: `<tc-trigger-builder [value]="value()" [events]="events()" (tc-value-change)="onValueChange($event)"></tc-trigger-builder>`,
})
export class TriggerBuilderExample {
  readonly value = input.required<TcTriggerBuilder["value"]>();
  readonly events = input.required<TcTriggerBuilder["events"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trigger-builder";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";

  let { value, events }: { value: TcTriggerBuilder["value"]; events: TcTriggerBuilder["events"] } = $props();
  let el: TcTriggerBuilder;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-trigger-builder bind:this={el} {value} {events}></tc-trigger-builder>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `TriggerValue` | `{ kind: "schedule", schedule: DEFAULT_SCHEDULE, active: null, conditions: [], match: "all" }` | The trigger definition. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `events` | – | `TriggerEvent[]` | `[]` | The events a trigger can listen for |
| `scheduleFields` | – | `TriggerField[]` | `[]` | What a schedule's conditions can test (none: schedules have no conditions) |
| `heading` | `heading` | `string` | `"Trigger"` | Names the group, shown at the top |
| `now` | `now` | `number \| undefined` | `undefined` | Counts the next runs from here (ms since epoch); unset: when the element connected |
| `runCount` | `run-count` | `number` | `5` | How many next runs to list |
| `timeZone` | `time-zone` | `string` | `""` | Shown under the card – unset: the browser's time zone |
| `name` | `name` | `string` | `""` | Submitted with the form: the definition as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the definition out of the form; a disabled fieldset does the same |
| `nextRuns` | – | `number[]` | – | The upcoming runs of a schedule (empty for an event trigger) |
| `summary` | – | `string` | – | The trigger in one sentence |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The trigger changed ({ value: TriggerValue }); cancelable – prevent it to control `value` |

#### Design tokens it reads (68)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `nextTriggerRuns(schedule: TriggerSchedule, now: number, count: unknown, active?: TriggerActive \| null): number[]` | The next `count` run times (ms) of a schedule after `now`, inside `active` when given |
| `describeTrigger(value: TriggerValue, events: TriggerEvent[], fields?: TriggerField[]): string` | The trigger as one sentence: "Runs every Monday at 9:00 AM, only if Stage is Won." |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-trigger-builder :value="…">` | `<tc-trigger-builder [value]="…">` | `<tc-trigger-builder {value}>` |
| `events` | `el.events = …;` | `<… events={…} />` | `<tc-trigger-builder :events="…">` | `<tc-trigger-builder [events]="…">` | `<tc-trigger-builder {events}>` |
| `scheduleFields` | `el.scheduleFields = …;` | `<… scheduleFields={…} />` | `<tc-trigger-builder :scheduleFields="…">` | `<tc-trigger-builder [scheduleFields]="…">` | `<tc-trigger-builder {scheduleFields}>` |

*Also attributes: `heading`, `now`, `run-count`, `time-zone`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-trigger-builder id="trigger-builder"></tc-trigger-builder>

<script type="module">
  import "@adamstavely/trenchcoat/trigger-builder";

  const el = document.querySelector("#trigger-builder");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TriggerBuilder } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TriggerBuilder>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledTriggerBuilder({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <TriggerBuilder {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/trigger-builder";
import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";

const props = defineProps<{ initial: TcTriggerBuilder["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcTriggerBuilder["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-trigger-builder :value="value" @tc-value-change="onValueChange"></tc-trigger-builder>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TriggerBuilder } from "@adamstavely/trenchcoat/angular/trigger-builder";
import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";

@Component({
  selector: "app-controlled-trigger-builder",
  imports: [TriggerBuilder],
  template: `<tc-trigger-builder [value]="value()" (tc-value-change)="onValueChange($event)"></tc-trigger-builder>`,
})
export class ControlledTriggerBuilder {
  readonly initial = input.required<TcTriggerBuilder["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcTriggerBuilder["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trigger-builder";
  import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";

  let { initial }: { initial: TcTriggerBuilder["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcTriggerBuilder;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcTriggerBuilder["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-trigger-builder bind:this={el} {value}></tc-trigger-builder>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-trigger-builder :value="value" @tc-value-change="value = $event.detail.value"></tc-trigger-builder>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-trigger-builder [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-trigger-builder>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-trigger-builder bind:this={el} {value}></tc-trigger-builder>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-trigger-builder")` returns a `TcTriggerBuilder` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";`
- **React / Next.js:** Props: `import type { TriggerBuilderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TriggerBuilder>`. The element class, for refs: `import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTriggerBuilder["value"]` with `import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";`
- **Angular:** The directive types the template: `[value]` takes `TcTriggerBuilder["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTriggerBuilder } from "@adamstavely/trenchcoat/trigger-builder";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `events` | `TriggerEventNode[]` | The events a trigger can listen for |
| `title` | `string` | Shown at the top; names the group |
| `value` | `TriggerValue` | The trigger definition (controlled) |
| `defaultValue` | `TriggerValue` | The trigger definition to start with when uncontrolled |
| `onChange` | `(value: TriggerValue) => void` | Called with the whole definition after every change |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `events`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the controls row by row, then the conditions and Add condition |
| ← / → / ↑ / ↓ | In When, Repeats, Active and All / Any: picks the previous or next option |
| Home / End | In those same controls: picks the first or last option |
| Space / Enter | On a day: turns it on or off; on Add condition or ×: adds or removes a condition |
| ↓ / ↑, Enter, Escape | In the event field: the combobox's keys – open, move, pick, close |

The time, number and value fields and the condition lists are native inputs and selects with their usual keys; the
dates open the date-range picker. Adding a condition moves focus to its field list. Removing a condition keeps focus
in the list – on the row that takes its place, or for the last row on the × above it, else on Add condition.

### Screen readers

The host is a group named by the heading. When, Repeats, Active and All / Any are radiogroups named by their labels;
the weekdays are a group of toggle buttons with `aria-pressed` and full day names (“Monday”). Every condition control
is named by its place: “Condition 1 field”, “Condition 1 test”, “Condition 1 value”, “Remove condition 1”. The next
runs are a list named “Next runs”. After each change a status region reads the new sentence – “Runs every Monday at
9:00 AM, only if Open deals is more than 0.” – but not on first render. In a form, an event trigger without an event
is invalid (“Pick an event.”), and so is a weekly one without a day (“Pick at least one day.”).

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | combobox, date-range-picker, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself, combobox | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, combobox, date-range-picker | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, date-range-picker, segmented-control | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | date-range-picker | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, combobox, internal/base, date-range-picker, segmented-control, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | combobox, date-range-picker, segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | combobox, date-range-picker, segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | combobox, segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.5 KB | 10.6 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [date-range-picker](date-range-picker.md) · Element it renders | 55.3 KB | – |
| [combobox](combobox.md) · Element it renders | 41.5 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **171.8 KB** | **40.5 KB** |
| With Lit – the first component on a page | 194.4 KB | 48.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 135 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of events replaced |
| First on the page | 22 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.2 ms | events: first render, 135 nodes; update 0.3 ms |
| 1,000 items | 2.4 ms | events: first render, 135 nodes; update 0.3 ms |

What it renders doesn't grow with events (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (combobox), `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (combobox), `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (combobox), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (date-range-picker), `ResizeObserver` (segmented-control), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document pointerdown` (combobox), `document pointerdown` (date-range-picker).
- Reads the clock: `Date.now()`, `new Date()` (date-range-picker).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each event's `label` for the list (“Deal changes stage”) and its `phrase` for the sentence after “when”
  (“a deal changes stage”).
- Use `hint` for where the event comes from (“CRM”, “Stripe”) and `group` to gather related events.
- Name condition fields as people know them – “Amount”, “Stage”, “Priority” – and give `select` fields their options.
- Set `heading` to what the trigger starts: “Run this automation”, “Send the weekly report”.

## Do and don't

### Do

- Give `scheduleFields` only when a scheduled run can check something first; without them a schedule has no conditions.
- Pass `now` when the page knows the time it should count from (server time, a test); otherwise it's when the
  element connected.
- Store the value as it is – `kind`, `event` or `schedule`, `active`, `conditions` and `match` – and run it on the
  server with the same rules; `nextTriggerRuns` and `describeTrigger` are exported to help.

### Don't

- Don't expect `timeZone` to move the run times: it only changes the text under the card. Times are counted in the
  browser's time zone.
- Don't offer events without `fields` if people will want to narrow them – conditions come from the event's fields.
- Don't keep conditions when the kind changes: the builder drops them, because they test the other kind's fields.

## Related

- [Date Range Picker](date-range-picker.md) – Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control
- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges

## Changelog

- `tc-trigger-builder` – an event or a schedule, an active window, conditions with all/any, a plain-language summary and the next run times; form-associated (JSON under `name`, validity, reset). Built from combobox, date-range-picker and segmented-control.
