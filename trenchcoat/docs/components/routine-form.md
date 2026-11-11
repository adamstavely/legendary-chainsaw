<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Routine Form

**Search** · New

Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine

- **Element:** `<tc-routine-form>`
- **Size:** 16.1 KB gzip · 61.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/routine-form";` |
| React / Next.js | `import { RoutineForm } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/routine-form";` · tags starting with tc- are custom elements |
| Angular | `import { RoutineForm } from "@adamstavely/trenchcoat/angular/routine-form";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/routine-form";` |

## Example

The live example is in the gallery at `#/routine-form`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The form that sets up a routine: a saved search or prompt that runs on a schedule and reports back. It asks for a name;
how often it runs – hourly, daily, on weekdays, weekly on a day or monthly on a date – and at what time, in the page's
time zone; whether the first run waits for the schedule or goes right away; when to send an email; and the instructions
each run follows. Under the start time it shows the time zone and works out the next run (“Next run: Thu, Oct 29, 1:45
PM”). Dismiss and Create routine sit at the foot – Save routine when editing one that exists.

### When to use

- Turning a saved search or a research question into something that runs every week.
- Editing a routine's schedule, notifications and instructions in one place.
- Anywhere a person sets up recurring work for an assistant and needs to see when it next runs.

### When not to use

- Automations that start on an event, or that need conditions – use [Trigger Builder](trigger-builder.md).
- Picking from searches someone already ran – use [Search History](search-history.md), whose Schedule action can open this form.
- Approval rules for an agent – use [Gate Config](gate-config.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the clock icon, the heading, and the description with the Routines link `.ui-rtn__link`
2. **Row** `.ui-rtn__row` – a label on the left `.ui-rtn__label`, the control on the right `.ui-rtn__control`
3. **Select** `.ui-rtn__select` – frequency, the day, the email setting: a native select drawn as a field
4. **Start time** `.ui-rtn__start` – the day of the week or month beside the time, or the minute for hourly routines
5. **Next run** `.ui-rtn__next` – the next run in the routine's time zone, under the time zone `.ui-rtn__hint`
6. **First run** `.ui-rtn__seg` – At scheduled time or Right away
7. **Instructions** `.ui-rtn__instructions` – what each run does
8. **Error** `.ui-rtn__error` – under a required field that's empty
9. **Foot** `.ui-rtn__foot` – Dismiss `.ui-rtn__dismiss` and the main button `.ui-rtn__submit`

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Below about 520 px the labels move above their controls; below about 340 px the day and the time stack
and the two buttons share the foot. The label column's width is `--tc-rtn-label-w`.

## Usage

### HTML

```html
<tc-routine-form id="routine" time-zone="America/Los_Angeles" routines-href="/routines"></tc-routine-form>

<script type="module">
  import "@adamstavely/trenchcoat/routine-form";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#routine");
  form.value = { ...form.value, name: "Coral bleaching study updates", weekday: 4, time: "13:45" };
  form.addEventListener("tc-submit", (e) => console.log("create", e.detail.value, new Date(e.detail.nextRun)));
  form.addEventListener("tc-dismiss", () => form.remove());
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RoutineForm, emptyRoutine, type RoutineDraft } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NewRoutine({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState<RoutineDraft>({ ...emptyRoutine(), name: "Coral bleaching study updates" });
  return (
    <RoutineForm
      value={value}
      onValueChange={setValue}
      timeZone="America/Los_Angeles"
      onCreate={(draft, nextRun) => console.log("create", draft, nextRun)}
      onDismiss={onClose}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/routine-form";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";

defineProps<{ value: TcRoutineForm["value"]; labels: TcRoutineForm["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-routine-form :value="value" :labels="labels" @tc-value-change="onValueChange"></tc-routine-form>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RoutineForm } from "@adamstavely/trenchcoat/angular/routine-form";
import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";

@Component({
  selector: "app-routine-form-example",
  imports: [RoutineForm],
  template: `<tc-routine-form [value]="value()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-routine-form>`,
})
export class RoutineFormExample {
  readonly value = input.required<TcRoutineForm["value"]>();
  readonly labels = input.required<TcRoutineForm["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/routine-form";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";

  let { value, labels }: { value: TcRoutineForm["value"]; labels: TcRoutineForm["labels"] } = $props();
  let el: TcRoutineForm;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-routine-form bind:this={el} {value} {labels}></tc-routine-form>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Create a routine", or "Edit routine" in edit mode |
| `description` | `description` | `string \| undefined` | `undefined` | The line under the heading, before the Routines link; by default the labels' description |
| `value` | – | `RoutineDraft` | – | The form's contents. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `mode` | `mode` | `"create" \| "edit"` | `"create"` | "create" for a new routine, "edit" for one that exists – it names the heading and the main button |
| `routinesHref` | `routines-href` | `string \| undefined` | `undefined` | Where the Routines link in the description goes; without it, the link is a button that fires tc-open-routines |
| `timeZone` | `time-zone` | `string` | `""` | The routine's time zone, an IANA name such as "America/Los_Angeles"; by default the browser's |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms, for the next run; by default the element's own clock |
| `busy` | `busy` | `boolean` | `false` | While the page saves the routine: the buttons wait and the main one says "Creating…" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for days and times, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<RoutineLabels>` | `{}` | The form's words, merged over defaultRoutineLabels |
| `nextRun` | – | `number \| null` | – | The next scheduled run, epoch ms |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A field changed ({ value }: RoutineValueChange); cancelable – prevented, `value` stays as it was |
| `tc-submit` | – | Yes | Create routine (Save routine when editing) was pressed with the name and instructions filled in ({ value, nextRun }: RoutineSubmit); cancelable – prevented, nothing is announced |
| `tc-dismiss` | – | No | Dismiss was pressed ({ value }: RoutineDismiss) |
| `tc-open-routines` | – | Yes | The Routines link in the description was used ({ href }: RoutineOpenRoutines); cancelable – prevented, the link doesn't open |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rtn-label-w` | `148px` | standard, clean |

#### Design tokens it reads (56)

`--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-quick`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `emptyRoutine(): RoutineDraft` | A new routine: weekly on Monday at 9:00, the first run on schedule, an email when a run finds something |
| `nextRoutineRuns(schedule: RoutineSchedule, now: number, count: unknown, timeZone?: string): number[]` | The next `count` runs (epoch ms) of a schedule after `now`, with the time read in `timeZone` (an IANA name, e.g. "America/Los_Angeles"; the browser's by default). Empty when the time can't be read. |
| `nextRoutineRun(schedule: RoutineSchedule, now: number, timeZone?: string): number \| null` | The next run (epoch ms) of a schedule after `now`, in `timeZone`; null when it can't be worked out |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-routine-form :value="…">` | `<tc-routine-form [value]="…">` | `<tc-routine-form {value}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-routine-form :labels="…">` | `<tc-routine-form [labels]="…">` | `<tc-routine-form {labels}>` |

*Also attributes: `heading`, `description`, `mode`, `routines-href`, `time-zone`, `now`, `busy`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-submit` | Yes | `el.addEventListener("tc-submit", (e) => …)` | `onCreate={…}` | `@tc-submit="…"` | `(tc-submit)="…($event)"` | `el.addEventListener("tc-submit", …)` |
| `tc-dismiss` | No | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |
| `tc-open-routines` | Yes | `el.addEventListener("tc-open-routines", (e) => …)` | `onOpenRoutines={…}` | `@tc-open-routines="…"` | `(tc-open-routines)="…($event)"` | `el.addEventListener("tc-open-routines", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-routine-form id="routine-form"></tc-routine-form>

<script type="module">
  import "@adamstavely/trenchcoat/routine-form";

  const el = document.querySelector("#routine-form");
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
import "@adamstavely/trenchcoat/routine-form";
import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";

const props = defineProps<{ initial: TcRoutineForm["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcRoutineForm["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-routine-form :value="value" @tc-value-change="onValueChange"></tc-routine-form>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RoutineForm } from "@adamstavely/trenchcoat/angular/routine-form";
import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";

@Component({
  selector: "app-controlled-routine-form",
  imports: [RoutineForm],
  template: `<tc-routine-form [value]="value()" (tc-value-change)="onValueChange($event)"></tc-routine-form>`,
})
export class ControlledRoutineForm {
  readonly initial = input.required<TcRoutineForm["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcRoutineForm["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/routine-form";
  import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";

  let { initial }: { initial: TcRoutineForm["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcRoutineForm;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcRoutineForm["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-routine-form bind:this={el} {value}></tc-routine-form>
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
<tc-routine-form :value="value" @tc-value-change="value = $event.detail.value"></tc-routine-form>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-routine-form [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-routine-form>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-routine-form bind:this={el} {value}></tc-routine-form>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-routine-form")` returns a `TcRoutineForm` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";`
- **React / Next.js:** Props: `import type { RoutineFormProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RoutineForm>`. The element class, for refs: `import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRoutineForm["value"]` with `import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";`
- **Angular:** The directive types the template: `[value]` takes `TcRoutineForm["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRoutineForm } from "@adamstavely/trenchcoat/routine-form";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Create a routine", or "Edit routine" in edit mode |
| `value` | `RoutineDraft` | The form's contents – controlled when given |
| `defaultValue` | `RoutineDraft` | The contents on mount when `value` isn't controlled; by default an empty weekly routine |
| `onValueChange` | `(next: RoutineDraft) => void` | A field changed; `next` is the whole draft |
| `onCreate` | `(value: RoutineDraft, nextRun: number \| null) => void \| false` | Create routine (or Save routine) was pressed with the form filled in; return false to skip the announcement |
| `onDismiss` | `(value: RoutineDraft) => void` | Dismiss was pressed |
| `onOpenRoutines` | `(href: string \| null) => void \| false` | The Routines link was used; return false to keep its link from opening |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `children`*

## Accessibility

### Keyboard

Every control is a native input, select or button, and First run is a `segmented-control`, so the browser's own keys
work.

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the fields, then Dismiss and Create routine |
| ↑ / ↓ on a select | Changes it |
| ← / → on First run | Switches between At scheduled time and Right away |
| Enter in a text field | Creates the routine, as the main button does |

### Screen readers

The form is named by its heading, and each field by its label; the day and time are a group named “Start time”. The
next run is a polite live region, so changing the schedule reads the new time. A required field that's empty is marked
invalid and described by its error. Pressing Create with fields missing announces how many and what they need, and
moves focus to the first. Creating says “Routine created” with the next run.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.5 KB | 7.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **61.1 KB** | **16.1 KB** |
| With Lit – the first component on a page | 83.4 KB | 23.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.4 ms** | the gallery demo's data, 84 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | re-render with the same data |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setInterval, cleared`, `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the routine for what it watches: “Coral bleaching study updates”, not “Weekly routine”.
- Write instructions as a brief for each run: what to look for, what counts as new, how to report it, and what to say
  when nothing is.
- Set `timeZone` to the person's own zone, so the time they pick is the time it runs.

## Do and don't

### Do

- Keep `value` in your store and save it from tc-submit; set `busy` while the save is under way.
- Start from the search: fill the name and instructions from the saved search that opened the form.
- Use `nextRoutineRun()` on the server to schedule the same time the form shows.

### Don't

- Don't hide the time zone – a routine that runs at the wrong hour is worse than none.
- Don't rename the main button to something vague like “OK” – say what happens.

## Related

- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Search History](search-history.md) – Recent and saved searches – tabs with counts, a filter, searches grouped by day with scope chips, result counts and times, and Run again, a save star and Remove with Undo on each
- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
- [AI Search](ai-search.md) – One search box with an AI mode – recent and suggested searches as you type, a multi-line prompt with example prompts in AI mode, Search within file contents, removable scope chips, Clear and ⌘K

## Changelog

- **Routine Form** (`tc-routine-form`): set up a scheduled routine – name, frequency, start time in a time zone with the next run worked out (DST-safe, `nextRoutineRun()` exported), first run now or on schedule, email notifications and instructions, with validation and Create / Save.
