<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Stepper Form

**Inputs & controls**

A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state

- **Element:** `<tc-stepper-form>`, `<tc-stepper-field>`, `<tc-stepper-input>`, `<tc-stepper-tags>`, `<tc-stepper-choices>`, `<tc-stepper-review>`, `<tc-stepper-success>`
- **Size:** 19.7 KB gzip · 88.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/stepper-form";` |
| React / Next.js | `import { StepperForm, StepperField, StepperInput, StepperTags, StepperChoices } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/stepper-form";` · tags starting with tc- are custom elements |
| Angular | `import { StepperForm, StepperField, StepperInput, StepperTags, StepperChoices, StepperReview, StepperSuccess } from "@adamstavely/trenchcoat/angular/stepper-form";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/stepper-form";` |

## Example

The live example is in the gallery at `#/stepper-form`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A multi-step flow – onboarding, setup or checkout – in one card. Numbered steps run along the top and swap their
number for a check once done; each step slides in from the side people are heading and the card glides to its
height. Continue checks the step: fields with a problem shake once and say what's wrong, and focus goes to the first
one. Back keeps everything entered, finished steps can be jumped back to, and the last step runs `onComplete` –
showing “Creating…”, an error that can be retried, then a short success state. On narrow screens the steps collapse
to “Step 2 of 4 · Team”.

### When to use

- Setting something up that needs a handful of decisions in order: a workspace, a project, an integration.
- Forms long enough to be tiring on one screen, that split into steps people understand.
- Flows that end in a review of what was entered and one final action.

### When not to use

- A checklist of tasks people do in any order, across the product – use [Progress Tracker](progress-tracker.md) or [Setup Guide](setup-guide.md).
- Switching between views, not moving through steps – use [Segmented Control](segmented-control.md).
- A single verification code – use [OTP Input](otp-input.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Steps** `.ui-sf__head` – the numbered steps, or “Step 2 of 4 · Team” when narrow
2. **Heading** `.ui-sf__heading` – the open step's heading and its line of description
3. **Field** `.ui-sf__field` – a label, the control and the hint or message under it
4. **Footer** `.ui-sf__foot` – Back and Continue (Finish on the last step)

## Looks

Standard puts the steps on a gray tray above a white card, numbered “1.”, “2.” and so on, with Back and Continue at
the bottom of the card. Clean is one white card with hairline shadows: a thin progress bar per step along its top
with a small capitalised label under it, and Back and Continue in a last row under a hairline. Both slide, shake and
check off steps the same way, and the footer stays in view while a long step scrolls.

Choice cards share one row while each is at least `--tc-sf-choice-min` (168px) wide; with more cards than fit they
wrap onto more rows, and on a phone they stack as full-width rows. `tc-stepper-input` takes a `<textarea>` as well as
an `<input>`: it gets the same field border, focus ring and invalid state, starts at its `rows` and resizes
vertically.

## Usage

### HTML

```html
<tc-stepper-form id="setup" submit-label="Create workspace"></tc-stepper-form>

<script type="module">
  import { html } from "lit";
  import "@adamstavely/trenchcoat/stepper-form";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#setup");
  form.values = { workspace: "" };
  form.steps = [
    {
      id: "workspace",
      title: "Workspace",
      heading: "Name your workspace",
      validate: (v) => ({ workspace: v.workspace.trim() ? undefined : "Give your workspace a name" }),
      render: ({ values, setValues }) => html`
        <tc-stepper-field name="workspace" label="Workspace name">
          <tc-stepper-input><input .value=${values.workspace} @input=${(e) => setValues({ workspace: e.target.value })} /></tc-stepper-input>
        </tc-stepper-field>`,
    },
    { id: "review", title: "Review", render: ({ values }) => html`<tc-stepper-review .rows=${[{ label: "Workspace", value: values.workspace }]}></tc-stepper-review>` },
  ];
  form.onComplete = async (values) => console.log("create", values);
  form.addEventListener("tc-step-change", (e) => console.log("step", e.detail.step));
</script>
```

### React / Next.js

```tsx
import { StepperForm, StepperField, StepperInput, StepperReview, type Step } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

type Values = { workspace: string };

const steps: Step<Values>[] = [
  {
    id: "workspace",
    title: "Workspace",
    heading: "Name your workspace",
    validate: (v) => ({ workspace: v.workspace.trim() ? undefined : "Give your workspace a name" }),
    render: ({ values, setValues }) => (
      <StepperField name="workspace" label="Workspace name">
        <StepperInput value={values.workspace} onChange={(e) => setValues({ workspace: e.target.value })} />
      </StepperField>
    ),
  },
  { id: "review", title: "Review", render: ({ values }) => <StepperReview rows={[{ label: "Workspace", value: values.workspace }]} /> },
];

export function CreateWorkspace() {
  return (
    <StepperForm<Values>
      steps={steps}
      defaultValues={{ workspace: "" }}
      submitLabel="Create workspace"
      onComplete={async (values) => console.log("create", values)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/stepper-form";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";

defineProps<{ steps: TcStepperForm["steps"]; values: TcStepperForm["values"] }>();
const onValuesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-stepper-form :steps="steps" :values="values" @tc-values-change="onValuesChange"></tc-stepper-form>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { StepperForm } from "@adamstavely/trenchcoat/angular/stepper-form";
import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";

@Component({
  selector: "app-stepper-form-example",
  imports: [StepperForm],
  template: `<tc-stepper-form [steps]="steps()" [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-stepper-form>`,
})
export class StepperFormExample {
  readonly steps = input.required<TcStepperForm["steps"]>();
  readonly values = input.required<TcStepperForm["values"]>();
  onValuesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stepper-form";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";

  let { steps, values }: { steps: TcStepperForm["steps"]; values: TcStepperForm["values"] } = $props();
  let el: TcStepperForm;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-stepper-form bind:this={el} {steps} {values}></tc-stepper-form>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

### `<tc-stepper-form>`

*A multi-step flow: numbered steps, sliding panes, checks on Continue and a success state.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `steps` | – | `StepperFormStep[]` | `[]` | The steps in order: id, title, content and the check Continue runs |
| `values` | – | `Values` | `{}` | The values of every step |
| `step` | `step` | `number` | `0` | The open step's index |
| `onComplete` | – | `StepperComplete \| undefined` | `undefined` | Runs with all values on the last step; return a promise to show "Creating…" until it settles (throw to show an error that can be retried). The signal aborts when the form is removed mid-way |
| `submitLabel` | `submit-label` | `string` | `"Finish"` | Label of the last button |
| `submittingLabel` | `submitting-label` | `string` | `"Creating…"` | Label while onComplete runs |
| `success` | – | `((values: Values, reset: () => void) => unknown) \| null \| undefined` | `undefined` | What shows once onComplete is done: a render function, unset for a short "All set", or null to leave the pane empty for the app |
| `panes` | – | `StepperPane[]` | – | The panes shown: the current one, and one sliding out |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-values-change` | – | Yes | A step changed the values; detail `{ values }`. Cancelable. |
| `tc-step-change` | – | Yes | Another step opens; detail `{ step: number }`. Cancelable. |
| `tc-panes-change` | – | No | The panes shown or the current step's errors changed (for apps that render the step content themselves); detail `{ panes: StepperPane[] }`. |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `setValues(patch: Partial<Values>)` | `void` | Merges a patch into the values |
| `goTo(id: string)` | `void` | Jumps to a step by id – forward jumps need the current step to pass first |
| `next()` | `void` | Same as pressing Continue |
| `reset()` | `void` | Back to the start: the first values and step, nothing checked, not done |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-stepper-form-halo` | `light-dark(rgba(23, 23, 23, 0.08), rgba(255, 255, 255, 0.08))` | standard |

#### Design tokens it reads (125)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

### `<tc-stepper-field>`

*A label, the control and an inline message that folds in – the control shakes when Continue finds a problem.
Put the control (a tc-stepper-input, tc-stepper-tags …) inside; it stays where you put it, between the label and
the messages.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | Matches the key in the step's validate result |
| `label` | `label` | `string` | `""` | The field's label, tied to its control |
| `hint` | `hint` | `string \| Element \| undefined` | `undefined` | A hint under the control: text, or an element (cloned) |
| `optional` | `optional` | `boolean` | `false` | Shows “Optional” after the label |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Design tokens it reads (126)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-halo`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

### `<tc-stepper-input>`

*A text field wired to its tc-stepper-field – label, message and aria come from there. Put a native &lt;input> or
&lt;textarea> inside (a textarea starts at its `rows` and resizes vertically); every attribute you give it stays yours.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `prefixText` | `prefix` | `string` | `""` | Fixed text before the value, e.g. "acme.com/" |
| `describedby` | `describedby` | `string` | `""` | More ids that describe the input, after the field's message or hint |
| `controlId` | `control-id` | `string` | `""` | The input's id when it isn't in a field |
| `controlInvalid` | `control-invalid` | `boolean` | `false` | Marks the input invalid on its own (the field's verdict wins) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Design tokens it reads (126)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-halo`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

### `<tc-stepper-tags>`

*Entries as chips – add with Enter, comma or by pasting a list, remove with × or Backspace. Defaults to email checks.
Form-associated: the entries are submitted comma-separated under `name`.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `string[]` | `[]` | The entries added so far |
| `placeholder` | `placeholder` | `string` | `"name@company.com"` | Placeholder while there are no entries – then it reads “Add another” |
| `validate` | – | `(entry: string, list: string[]) => string \| null` | `emailCheck` | Returns a message when an entry can't be added |
| `max` | `max` | `number \| undefined` | `undefined` | Largest number of entries |
| `name` | `name` | `string` | `""` | Name for form submission: the entries, comma-separated |
| `disabled` | `disabled` | `boolean` | `false` | Turns off typing and removing entries |
| `required` | `required` | `boolean` | `false` | Marks the field as required for assistive tech – checking it is up to the step's validate |
| `autocomplete` | `autocomplete` | `string` | `"off"` | The input's autocomplete – "off" by default, since the entries are usually other people's addresses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | Entries were added or removed; detail `{ value: string[] }`. Cancelable. |

#### Design tokens it reads (126)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-halo`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

### `<tc-stepper-choices>`

*Selectable cards – a ring glides to the chosen one. One Tab stop: the chosen card, or the first enabled one when
none is chosen. Arrow keys move and pick (skipping disabled cards), Space picks, Enter picks and continues. Form-associated: the
chosen value is submitted under `name`.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | `value` | `string` | `""` | The chosen option's value; empty when none is chosen |
| `options` | – | `StepperChoice[]` | `[]` | The cards to choose from |
| `label` | `label` | `string` | `""` | Name of the group for screen readers |
| `name` | `name` | `string` | `""` | Name for form submission |
| `disabled` | `disabled` | `boolean` | `false` | Turns off choosing |
| `required` | `required` | `boolean` | `false` | Marks the group as required for assistive tech – checking it is up to the step's validate |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | Another card was chosen; detail `{ value: string }`. Cancelable. |

#### Design tokens it reads (126)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-halo`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

### `<tc-stepper-review>`

*A summary of what was entered, each row with an Edit link back to its step.*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `rows` | – | `StepperReviewRow[]` | `[]` | The rows: a label, the value entered and the step that sets it |
| `editable` | `editable` | `boolean` | `false` | Shows the Edit links |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-edit` | – | No | An Edit link was pressed; detail `{ step: string }` – pass it to the step context's goTo. |

#### Design tokens it reads (126)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-halo`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

### `<tc-stepper-success>`

*The success state: a check pops in, a heading and a short line; anything you put inside follows them (actions).*

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The success heading, e.g. “All set” |
| `description` | `description` | `string \| Element \| undefined` | `undefined` | Text, or an element (cloned) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Design tokens it reads (126)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-sf-choice-min`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-stepper-form-halo`, `--tc-stepper-form-n`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-stepper-form :steps="…">` | `<tc-stepper-form [steps]="…">` | `<tc-stepper-form {steps}>` |
| `values` | `el.values = …;` | `<… values={…} />` | `<tc-stepper-form :values="…">` | `<tc-stepper-form [values]="…">` | `<tc-stepper-form {values}>` |
| `onComplete` | `el.onComplete = …;` | `<… onComplete={…} />` | `<tc-stepper-form :onComplete="…">` | `<tc-stepper-form [onComplete]="…">` | `<tc-stepper-form {onComplete}>` |
| `success` | `el.success = …;` | `<… success={…} />` | `<tc-stepper-form :success="…">` | `<tc-stepper-form [success]="…">` | `<tc-stepper-form {success}>` |

*Also attributes: `step`, `submit-label`, `submitting-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-values-change` | Yes | `el.addEventListener("tc-values-change", (e) => …)` | `onValuesChange={…}` | `@tc-values-change="…"` | `(tc-values-change)="…($event)"` | `el.addEventListener("tc-values-change", …)` |
| `tc-step-change` | Yes | `el.addEventListener("tc-step-change", (e) => …)` | `onStepChange={…}` | `@tc-step-change="…"` | `(tc-step-change)="…($event)"` | `el.addEventListener("tc-step-change", …)` |
| `tc-panes-change` | No | `el.addEventListener("tc-panes-change", (e) => …)` | `ref.current.addEventListener("tc-panes-change", …)` | `@tc-panes-change="…"` | `(tc-panes-change)="…($event)"` | `el.addEventListener("tc-panes-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `values` and `step` itself unless a listener calls `preventDefault()` on `tc-values-change` or `tc-step-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-stepper-form id="stepper-form"></tc-stepper-form>

<script type="module">
  import "@adamstavely/trenchcoat/stepper-form";

  const el = document.querySelector("#stepper-form");
  el.addEventListener("tc-values-change", (e) => {
    e.preventDefault(); // the element keeps its values…
    if (allowed(e.detail.values)) el.values = e.detail.values; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { StepperForm } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof StepperForm>;
type Props = Omit<Own, "values" | "onValuesChange"> & { initial: NonNullable<Own["values"]> };

// Controlled: passing values makes the wrapper prevent the element's own change; the app sets it
export function ControlledStepperForm({ initial, ...props }: Props) {
  const [values, setValues] = useState<Own["values"]>(initial);
  return <StepperForm {...props} values={values} onValuesChange={(next) => setValues(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/stepper-form";
import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";

const props = defineProps<{ initial: TcStepperForm["values"] }>();
const values = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValuesChange = (e: CustomEvent<{ values: TcStepperForm["values"] }>) => {
  e.preventDefault();
  values.value = e.detail.values;
};
</script>

<template>
  <tc-stepper-form :values="values" @tc-values-change="onValuesChange"></tc-stepper-form>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { StepperForm } from "@adamstavely/trenchcoat/angular/stepper-form";
import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";

@Component({
  selector: "app-controlled-stepper-form",
  imports: [StepperForm],
  template: `<tc-stepper-form [values]="values()" (tc-values-change)="onValuesChange($event)"></tc-stepper-form>`,
})
export class ControlledStepperForm {
  readonly initial = input.required<TcStepperForm["values"]>();
  readonly values = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValuesChange(e: CustomEvent<{ values: TcStepperForm["values"] }>) {
    e.preventDefault();
    this.values.set(e.detail.values);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/stepper-form";
  import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";

  let { initial }: { initial: TcStepperForm["values"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let values = $derived(initial);
  let el: TcStepperForm;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      values = (e as CustomEvent<{ values: TcStepperForm["values"] }>).detail.values;
    };
    el.addEventListener("tc-values-change", on);
    return () => el.removeEventListener("tc-values-change", on);
  });
</script>

<tc-stepper-form bind:this={el} {values}></tc-stepper-form>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-stepper-form")` returns a `TcStepperForm` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";`
- **React / Next.js:** Props: `import type { StepperFormProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof StepperForm>`. The element class, for refs: `import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcStepperForm["steps"]` with `import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";`
- **Angular:** The directive types the template: `[steps]` takes `TcStepperForm["steps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcStepperForm } from "@adamstavely/trenchcoat/stepper-form";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

#### StepperForm

| Prop | Type | Description |
| --- | --- | --- |
| `steps` | `Step<V>[]` | The steps in order: id, title, the content to render and the check Continue runs |
| `values` | `V` | The values of every step. Controlled when defined – pair it with `onValuesChange` |
| `defaultValues` | `V` | Starting values when `values` isn't controlled |
| `initialValues` | `V` | Starting values when `values` isn't controlled – the old name of `defaultValues` |
| `onValuesChange` | `(values: V) => void` | Called with all values whenever a step changes them |
| `onComplete` | `(values: V, options: { signal: AbortSignal }) => void \| Promise<void>` | Called with all values on the last step; return a promise to show "Creating…" until it settles (throw to show an error that can be retried). The signal aborts when the form unmounts mid-way. |
| `step` | `number` | Controlled step index – pair it with onStepChange |
| `defaultStep` | `number` | Index of the first step shown when `step` isn't controlled |
| `initialStep` | `number` | Index of the first step shown when `step` isn't controlled – the old name of `defaultStep` |
| `onStepChange` | `(step: number) => void` | Called with the index of the step that opens |
| `submitLabel` | `string` | Label of the last button |
| `submittingLabel` | `string` | Label while onComplete runs |
| `success` | `(values: V, reset: () => void) => React.ReactNode` | What shows once onComplete is done – defaults to a short "All set" |
| `ref` | `React.Ref<TcStepperForm>` | The element, for `next()`, `goTo()` and `reset()` |

*Renamed or hidden on the wrapper: `Creating…`, `All set`*

#### StepperField

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | Matches the key in the step's validate result |
| `label` | `string` | The field's label, tied to its control |
| `hint` | `React.ReactNode` | A hint under the control, replaced by the message while there is one |
| `optional` | `boolean` | Shows “Optional” after the label |
| `children` | `React.ReactNode` | The control: a StepperInput, StepperTags or StepperChoices |

#### StepperInput

| Prop | Type | Description |
| --- | --- | --- |
| `prefix` | `string` | Fixed text before the value, e.g. "acme.com/" |
| `className` | `string` | Goes to the wrapper (which draws the field), not the &lt;input> |
| `ref` | `React.Ref<HTMLInputElement>` | The native &lt;input> |

*Renamed or hidden on the wrapper: `prefix`*

#### StepperTags

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string[]` | The entries added so far |
| `onChange` | `(next: string[]) => void` | Called with the new list when entries are added or removed |
| `placeholder` | `string` | Placeholder while there are no entries – then it reads “Add another” |
| `validate` | `(entry: string, list: string[]) => string \| null` | Returns a message when an entry can't be added |
| `max` | `number` | Largest number of entries |
| `name` | `string` | Submits the entries with a native form, comma-separated |
| `disabled` | `boolean` | Turns off typing and removing entries |
| `required` | `boolean` | Marks the field as required for assistive tech – checking it is up to the step's validate |
| `autoComplete` | `string` | The input's autocomplete – "off" by default, since the entries are usually other people's addresses |

#### StepperChoices

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | The chosen option's value; empty when none is chosen |
| `onChange` | `(value: string) => void` | Called with the value of the card chosen |
| `options` | `StepperChoice[]` | The cards to choose from |
| `label` | `string` | Name of the group for screen readers |
| `name` | `string` | Submits the chosen value with a native form |
| `disabled` | `boolean` | Turns off choosing |
| `required` | `boolean` | Marks the group as required for assistive tech – checking it is up to the step's validate |

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter | In a field: Continue (or Finish on the last step) |
| Enter / , / ; | In an email list: adds what was typed as a chip; with nothing typed, Enter continues |
| Backspace | In an empty email list: removes the last chip |
| Tab | Into a set of choice cards: lands on the chosen card, or on the first enabled card when none is chosen – one stop for the group |
| ← → ↑ ↓ | In a set of choice cards: chooses the previous or next card, wrapping and skipping disabled cards |
| Space | On a choice card: chooses it |
| Enter | On a choice card: chooses it, then Continue |
| Tab | Moves through the steps people can jump back to, the step's fields, Back and Continue |

### Screen readers

The steps are an ordered list named “Progress”; the open one is `aria-current="step"` and the others say “(done)”
where they're finished. The form is named by the open step's heading, and focus moves to the new step's first field
(or its heading). Each field's label is tied to its control; a problem sets `aria-invalid` and describes the control
with the message, otherwise the hint describes it. Continue is `aria-disabled` while the step has problems but stays
pressable, so pressing it shows them. One polite status region says each move – “Step 2 of 4: Team” – the first
problem after a failed Continue, “All done” at the end, and an `onComplete` error, which also shows as an alert next
to the button. Email chips are a list named “Added” with “Remove ana@acme.com” buttons; choice cards are a radio
group named by `label`.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | itself | Titles break where the line fills up instead of into even lines. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 80.4 KB | 17.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **88.2 KB** | **19.7 KB** |
| With Lit – the first component on a page | 110.7 KB | 27.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | the gallery demo's data, 46 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of steps replaced |
| First on the page | 29 ms | default properties; includes adding its CSS to the document |
| 100 items | 14 ms | steps: first render, 622 nodes; update 1.1 ms |
| 1,000 items | 54 ms | steps: first render, 6,022 nodes; update 4.9 ms |

1,000 items of steps: 54 ms. It renders every item, so a first render passes 50 ms (a long task) at about 930 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep step titles to one word or two – “Workspace”, “Team”, “Plan”, “Review” – and use `heading` for the full
  question: “Name your workspace”.
- Write messages as what to do, not what's wrong: “Give it a name of at least 2 characters”.
- Use the hint for what helps before typing (“You can change this later in settings.”); the message replaces it while
  there's a problem.
- Name the last button after what it does (`submitLabel`: “Create workspace”) and `submittingLabel` after the work:
  “Creating…”.
- Mark fields people can skip `optional` rather than marking the required ones.

## Do and don't

### Do

- Keep the flow to three to six steps, and end with a review (`tc-stepper-review`) when the result is hard to undo.
- Throw from `onComplete` with a message people can act on – it's shown as is, with Finish to try again.
- Use the building blocks (`tc-stepper-field`, `tc-stepper-input`, `tc-stepper-tags`, `tc-stepper-choices`) so labels,
  messages and focus are wired for you.

### Don't

- Don't check fields as people type – the step is checked on Continue, so nobody is told off mid-word.
- Don't put unrelated questions in one step to save a step.
- Don't lose what was entered when people go back – keep it all in `values`.

## Related

- [Progress Tracker](progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [OTP Input](otp-input.md) – The verification code field done right – a gliding focus ring, paste and SMS autofill, a calm shake on errors and a morph into Verified

## Changelog

- **Stepper Form:** `tc-stepper-choices` with no option chosen – an empty `value`, or one that matches no option – made every card `tabindex="-1"`, so the group couldn't be reached with Tab (WCAG 2.1.1). Following the ARIA radio group pattern, the first enabled card now takes the Tab stop when none is chosen; the chosen card still does otherwise. Space picks it, Enter picks it and continues, and the arrow keys move and pick from there, skipping disabled cards. A `StepperChoice` can be `disabled`; with the group disabled, or every card disabled, nothing is focusable.
- **stepper-form error contrast:** its error messages were 3.9:1; they now use the danger text colour.
- stepper-form `initialValues` → `defaultValues`; `initialStep` → `defaultStep`
