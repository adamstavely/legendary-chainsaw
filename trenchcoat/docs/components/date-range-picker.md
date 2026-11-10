<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Date Range Picker

**Inputs & controls**

Presets and two calendars with a hover preview, comparison with the previous period or year, full keyboard control

- **Element:** `<tc-date-range-picker>`
- **Size:** 13.9 KB gzip · 64.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/date-range-picker";` |
| React / Next.js | `import { DateRangePicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/date-range-picker";` · tags starting with tc- are custom elements |
| Angular | `import { DateRangePicker } from "@adamstavely/trenchcoat/angular/date-range-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/date-range-picker";` |

## Example

The live example is in the gallery at `#/date-range-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Picks a period for a report or a chart. A trigger shows the applied range (“Sep 9 – Oct 8, 2026”); it opens a panel
with presets on the left – Last 7 days, This month, Year to date – and two months on the right, where people click a
start, see the range follow the pointer, and click an end. It can also compare the range with the period before or
the same days a year back, drawn as a second band and named in the trigger (“vs. Aug 10 – Sep 8, 2026”). Nothing
changes until Apply, so people can explore freely; with `name` the range submits with a form.

### When to use

- Setting the period of a dashboard, a report or an analytics chart.
- Comparing a period with the one before it, or with last year, in the same step.
- Forms that need a start and an end date, where most people want a common preset.

### When not to use

- Filtering a list by several facets, of which the date is only one – use [Filter Menu](filter-menu.md).
- Scheduling something to run at set times – use [Trigger Builder](trigger-builder.md).
- Switching between a few fixed periods (Day, Week, Month) – use [Segmented Control](segmented-control.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trigger** `.ui-drp__trigger` – the applied range, and the comparison when there is one
2. **Presets** `.ui-drp__presets` – quick ranges; “Custom” lights up when none matches
3. **Calendars** `.ui-drp__months` – two months of days, with the range and the comparison band
4. **Month buttons** `.ui-drp__nav` – the previous and next month
5. **Summary** `.ui-drp__summary` – the picked range, its length in days and the Compare control
6. **Buttons** `.ui-drp__buttons` – Cancel and Apply

## Looks

Standard shows the comparison on a second line of the trigger, sets the presets and calendars on a white card inside a
gray tray, and puts the summary and buttons on the tray; a highlight glides between the presets and between the
Compare options. Clean has no tray: a white one-line field, with the comparison beside the range, opens one white
popover. In both, a narrow panel turns the presets into a row of chips and shows one month.

## Usage

### HTML

```html
<p>Report period</p>
<tc-date-range-picker id="period" name="period" week-starts-on="1"></tc-date-range-picker>

<script type="module">
  import "@adamstavely/trenchcoat/date-range-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#period");
  picker.value = { start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) };
  picker.min = new Date(2025, 0, 1);
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value, e.detail.compare));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DateRangePicker, formatRange, type DateRange } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReportPeriod() {
  const [range, setRange] = useState<DateRange>({ start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) });
  const [previous, setPrevious] = useState<DateRange | null>(null);
  return (
    <div>
      <DateRangePicker
        value={range}
        onChange={(next, compare) => {
          setRange(next);
          setPrevious(compare);
        }}
        weekStartsOn={1}
      />
      {previous && <p>Compared with {formatRange(previous)}</p>}
    </div>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/date-range-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";

defineProps<{ value: TcDateRangePicker["value"]; presets: TcDateRangePicker["presets"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-date-range-picker :value="value" :presets="presets" @tc-value-change="onValueChange"></tc-date-range-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DateRangePicker } from "@adamstavely/trenchcoat/angular/date-range-picker";
import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";

@Component({
  selector: "app-date-range-picker-example",
  imports: [DateRangePicker],
  template: `<tc-date-range-picker [value]="value()" [presets]="presets()" (tc-value-change)="onValueChange($event)"></tc-date-range-picker>`,
})
export class DateRangePickerExample {
  readonly value = input.required<TcDateRangePicker["value"]>();
  readonly presets = input.required<TcDateRangePicker["presets"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/date-range-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";

  let { value, presets }: { value: TcDateRangePicker["value"]; presets: TcDateRangePicker["presets"] } = $props();
  let el: TcDateRangePicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-date-range-picker bind:this={el} {value} {presets}></tc-date-range-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `DateRange \| undefined` | `undefined` | The applied range; unset, the last 30 days |
| `presets` | – | `RangePreset[]` | `[ { id: "today", label: "Today", range: (t) => ({ start: t, end: t }) }, { id: "yesterday", label: "Yesterday", range: (t) => ({ start: addDays(t, -1), end: addDays(t, -1) }) }, { id: "7d", label: "Last 7 days", range: (t) => ({ start: addDays(t, -6), end: t }) }, { id: "30d", label: "Last 30 days", range: (t) => ({ start: addDays(t, -29), end: t }) }, { id: "90d", label: "Last 90 days", range: (t) => ({ start: addDays(t, -89), end: t }) }, { id: "month", label: "This month", range: (t) => ({ start: startOfMonth(t), end: t }) }, { id: "last-month", label: "Last month", range: (t) => ({ start: addMonths(t, -1), end: endOfMonth(addMonths(t, -1)) }) }, { id: "quarter", label: "This quarter", range: (t) => ({ start: quarterStart(t), end: t }) }, { id: "ytd", label: "Year to date", range: (t) => ({ start: new Date(t.getFullYear(), 0, 1), end: t }) }, ]` | The quick picks on the left, each building its range from today – defaults to Today through Year to date |
| `compare` | – | `boolean` | `true` | Show the "Compare to" control |
| `compareMode` | `compare-mode` | `CompareMode` | `"previous"` | The applied comparison |
| `open` | `open` | `boolean` | `false` | Whether the panel is open |
| `name` | `name` | `string` | `""` | Name for native form submission: a hidden input with the applied range as "YYYY-MM-DD/YYYY-MM-DD" |
| `disabled` | `disabled` | `boolean` | `false` | The trigger can't be used and the hidden input is left out of the form |
| `weekStartsOn` | `week-starts-on` | `0 \| 1` | `1` | 0 = Sunday, 1 = Monday |
| `max` | – | `Date \| undefined` | `undefined` | Days after this can't be picked – defaults to today |
| `min` | – | `Date \| undefined` | `undefined` | Days before this can't be picked – unset, there is no lower limit |
| `today` | – | `Date \| undefined` | `undefined` | "Today" for the presets – defaults to the real day, read when the element connects |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | Apply; detail `{ value, compare, mode }` – the range, the comparison range (or null) and the compare mode. Cancelable: preventDefault() keeps `value` as it is (controlled use) |
| `tc-compare-change` | – | Yes | Apply with another compare mode; detail `{ mode }`. Cancelable: preventDefault() keeps `compareMode` as it is |
| `tc-open-change` | – | Yes | The panel opens or closes; detail `{ open: boolean }`. Cancelable: preventDefault() keeps `open` as it is |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-date-range-picker-band` | `light-dark(#5796ec, #3364bf)` | standard, clean |
| `--tc-date-range-picker-compare-bg` | `light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1))` | standard, clean |
| `--tc-date-range-picker-compare-border` | `light-dark(rgba(0, 0, 0, 0.32), rgba(255, 255, 255, 0.36))` | standard, clean |
| `--tc-date-range-picker-panel-width` | `min(652px, calc(100vw - 32px))` | not set – this fallback applies |

#### Design tokens it reads (80)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xl`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-6`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `formatDateRange({ start, end }: DateRange): void` | "Sep 9 – Oct 8, 2026", "Dec 20, 2025 – Jan 5, 2026", "Oct 8, 2026" |
| `compareDateRange(range: DateRange, mode: CompareMode): DateRange \| null` | The comparison range for a mode: the period before, or the same days a year back |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-date-range-picker :value="…">` | `<tc-date-range-picker [value]="…">` | `<tc-date-range-picker {value}>` |
| `presets` | `el.presets = …;` | `<… presets={…} />` | `<tc-date-range-picker :presets="…">` | `<tc-date-range-picker [presets]="…">` | `<tc-date-range-picker {presets}>` |
| `compare` | `el.compare = …;` | `<… compare={…} />` | `<tc-date-range-picker :compare="…">` | `<tc-date-range-picker [compare]="…">` | `<tc-date-range-picker {compare}>` |
| `max` | `el.max = …;` | `<… max={…} />` | `<tc-date-range-picker :max="…">` | `<tc-date-range-picker [max]="…">` | `<tc-date-range-picker {max}>` |
| `min` | `el.min = …;` | `<… min={…} />` | `<tc-date-range-picker :min="…">` | `<tc-date-range-picker [min]="…">` | `<tc-date-range-picker {min}>` |
| `today` | `el.today = …;` | `<… today={…} />` | `<tc-date-range-picker :today="…">` | `<tc-date-range-picker [today]="…">` | `<tc-date-range-picker {today}>` |

*Also attributes: `compare-mode`, `open`, `name`, `disabled`, `week-starts-on` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-compare-change` | Yes | `el.addEventListener("tc-compare-change", (e) => …)` | `ref.current.addEventListener("tc-compare-change", …)` | `@tc-compare-change="…"` | `(tc-compare-change)="…($event)"` | `el.addEventListener("tc-compare-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value`, `compare` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change`, `tc-compare-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-date-range-picker id="date-range-picker"></tc-date-range-picker>

<script type="module">
  import "@adamstavely/trenchcoat/date-range-picker";

  const el = document.querySelector("#date-range-picker");
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
import { DateRangePicker } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DateRangePicker>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledDateRangePicker({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <DateRangePicker {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/date-range-picker";
import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";

const props = defineProps<{ initial: TcDateRangePicker["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcDateRangePicker["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-date-range-picker :value="value" @tc-value-change="onValueChange"></tc-date-range-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DateRangePicker } from "@adamstavely/trenchcoat/angular/date-range-picker";
import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";

@Component({
  selector: "app-controlled-date-range-picker",
  imports: [DateRangePicker],
  template: `<tc-date-range-picker [value]="value()" (tc-value-change)="onValueChange($event)"></tc-date-range-picker>`,
})
export class ControlledDateRangePicker {
  readonly initial = input.required<TcDateRangePicker["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcDateRangePicker["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/date-range-picker";
  import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";

  let { initial }: { initial: TcDateRangePicker["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcDateRangePicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcDateRangePicker["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-date-range-picker bind:this={el} {value}></tc-date-range-picker>
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

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-date-range-picker :value="value" @tc-value-change="value = $event.detail.value"></tc-date-range-picker>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-date-range-picker [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-date-range-picker>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-date-range-picker bind:this={el} {value}></tc-date-range-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-date-range-picker")` returns a `TcDateRangePicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";`
- **React / Next.js:** Props: `import type { DateRangePickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DateRangePicker>`. The element class, for refs: `import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDateRangePicker["value"]` with `import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";`
- **Angular:** The directive types the template: `[value]` takes `TcDateRangePicker["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDateRangePicker } from "@adamstavely/trenchcoat/date-range-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `DateRange` | The applied range. Controlled when defined; otherwise the picker keeps its own, starting at `defaultValue` |
| `defaultValue` | `DateRange` | Starting range when uncontrolled – defaults to the last 30 days |
| `onChange` | `(range: DateRange, compare: DateRange \| null, mode: CompareMode) => void` | Called on Apply with the range and the comparison range (if any) |
| `compareMode` | `CompareMode` | The applied comparison. Controlled when defined (changes come through onChange's third argument); otherwise starts at `defaultCompare` |
| `defaultCompare` | `CompareMode` | The comparison applied at first when `compareMode` isn't controlled – defaults to "previous" |
| `open` | `boolean` | Whether the panel is open. Controlled when defined; otherwise starts at `defaultOpen` |
| `defaultOpen` | `boolean` | Open the panel right away – nice for previews |
| `onOpenChange` | `(open: boolean) => void` | Called whenever the panel opens or closes, controlled or not |

*Renamed or hidden on the wrapper: `value`, `open`, `compareMode`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the trigger, opens the panel with focus on a day; on a day, picks it as the start or the end |
| ← / → | Moves to the previous or next day |
| ↑ / ↓ | Moves a week back or forward |
| Page Up / Page Down | Moves a month back or forward, keeping the day where it can |
| Home / End | Moves to the first or last day of the week |
| ← / → / ↑ / ↓ | In Compare, picks the previous or next option, wrapping round |
| Tab | Moves between the presets, the month buttons, the calendar, Compare, Cancel and Apply |
| Escape | Closes the panel and returns to the trigger |

The calendar keeps one tab stop, on the focused day, and the arrow keys stop at `min` and `max`.

### Screen readers

The trigger has `aria-haspopup="dialog"` and `aria-expanded`; the panel is a `dialog` named “Choose a date range”.
Each month is a `grid` named by the month (“October 2026”); days are buttons named in full (“Thursday, October 8,
2026”), today carries `aria-current="date"`, and days in the range are `aria-selected`. The presets are a group of
toggle buttons with `aria-pressed`; Compare is a `radiogroup` named “Compare to”. Status regions say the months on
show (“September 2026 – October 2026”) and the pick: “Start Oct 1, 2026 – pick an end”, then “Oct 1 – Oct 8, 2026,
8 days”.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

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
| **This component alone** | 57.6 KB | 12.1 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **64.3 KB** | **13.9 KB** |
| With Lit – the first component on a page | 84.5 KB | 20.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 216 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of presets replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.4 ms | presets: first render, 307 nodes; update 0.5 ms |
| 1,000 items | 10 ms | presets: first render, 1,207 nodes; update 1.6 ms |

1,000 items of presets: 10 ms, 1,207 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Reads the clock: `new Date()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep preset labels short and relative to today: “Last 7 days”, “This quarter”.
- Offer the presets people use most for this data – the default nine are a starting point, not a rule.
- Label the field around the trigger with what the period is for: “Report period”.

## Do and don't

### Do

- Set `max` (it defaults to today) and `min` to the dates your data covers.
- Set `week-starts-on` to match your users' calendar – 1 for Monday, 0 for Sunday.
- Read `compare` from `tc-value-change` and show both periods in the chart it drives.

### Don't

- Don't apply the range on every click – people expect Apply, and the trigger shows only what's applied.
- Don't hide Compare when your charts can show two periods; turn it off (`compare = false`) only when they can't.
- Don't use it for a single date.

## Related

- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [KPI Chart](kpi-chart.md) – Metric card with a multi-line chart and a tooltip that follows the pointer
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
