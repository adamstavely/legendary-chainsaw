<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Data handling policy

**AI configuration** · New

Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests

- **Element:** `<tc-data-handling-policy>`
- **Size:** 20.4 KB gzip · 83.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/data-handling-policy";` |
| React / Next.js | `import { DataHandlingPolicy } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/data-handling-policy";` · tags starting with tc- are custom elements |
| Angular | `import { DataHandlingPolicy } from "@adamstavely/trenchcoat/angular/data-handling-policy";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/data-handling-policy";` |

## Example

The live example is in the gallery at `#/data-handling-policy`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What happens to an organization's data, as a lifecycle: how long conversations are kept, what goes into logs and what
is redacted from them, whether memory lasts beyond a conversation, whether data is used for training, and when it is
deleted. Each stage leads with the policy the app reports as in effect, says when a choice hasn't been applied yet, and
shows a lock where the setting comes from higher up. Pressing a stage opens its controls in place. Deletion requests
sit underneath with their status.

These settings don't enforce anything. The element records what someone chose and shows what the app says is in
effect; retention, redaction, training use and deletion happen in your application and your providers, or not at all.

### When to use

- A workspace or organization settings page for conversation data, logs, memory and training use.
- Anywhere people need to see the policy actually in effect next to what they chose – after a change, while it rolls
  out, or when a parent organization overrides it.
- Letting admins ask for data to be deleted and follow the request to completion.

### When not to use

- Viewing or editing individual memories – use [Memory Panel](memory-panel.md).
- Deciding what an agent's tools may reach – use [Tool Permissions](tool-permissions.md).
- Halting agents in an incident – use [Kill Switch](kill-switch.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Lifecycle** `.ui-dhp__flow` – the stages in order, from conversation to deletion
2. **In effect** `.ui-dhp__stage-what` – what happens to the data at a stage, as the app reports it
3. **Lock** `.ui-dhp__stage-lock` – the stage is set higher up and can't be changed here
4. **Deletion requests** `.ui-dhp__deletions` – each request and its status
5. **Request deletion** `.ui-dhp__request` – asks for a deletion, after confirming

## Looks

Standard is a white card on a gray tray, the stages filled tiles joined by chevrons, and the open stage outlined with
its controls in an outlined panel below. Clean is one white card, the stages columns between hairlines, the open one
tinted with an accent rule and its controls in the card itself, with quieter type and thinner icons. Narrow, the
lifecycle runs down the card in both.

## Usage

### HTML

```html
<tc-data-handling-policy id="policy" name="policy"></tc-data-handling-policy>

<script type="module">
  import "@adamstavely/trenchcoat/data-handling-policy";
  import "@adamstavely/trenchcoat/tokens.css";

  const policy = document.querySelector("#policy");
  policy.value = { retention: "30d", memory: "conversation", logging: "metadata", redact: ["personal"], training: false };
  policy.effective = { retention: "90d", memory: "conversation", logging: "metadata", redact: ["personal"], training: false };
  policy.locks = [{ field: "training", by: "Northwind IT" }];
  policy.addEventListener("tc-value-change", (e) => {
    fetch("/api/data-policy", { method: "PUT", body: JSON.stringify(e.detail.value) });
  });
  policy.addEventListener("tc-deletion-request", (e) => {
    fetch("/api/deletions", { method: "POST", body: JSON.stringify({ scope: e.detail.scope.id }) });
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { DataHandlingPolicy, type DataHandlingPolicyValue, type DataPolicyDeletion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function DataSettings({ applied, deletions, save }: { applied: DataHandlingPolicyValue; deletions: DataPolicyDeletion[]; save: (value: DataHandlingPolicyValue) => void }) {
  const [value, setValue] = useState(applied);
  return (
    <DataHandlingPolicy
      value={value}
      effective={applied}
      locks={[{ field: "training", by: "Northwind IT" }]}
      deletions={deletions}
      onChange={(next) => {
        setValue(next);
        save(next);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/data-handling-policy";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";

defineProps<{ value: TcDataHandlingPolicy["value"]; effective: TcDataHandlingPolicy["effective"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-data-handling-policy :value="value" :effective="effective" @tc-value-change="onValueChange"></tc-data-handling-policy>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { DataHandlingPolicy } from "@adamstavely/trenchcoat/angular/data-handling-policy";
import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";

@Component({
  selector: "app-data-handling-policy-example",
  imports: [DataHandlingPolicy],
  template: `<tc-data-handling-policy [value]="value()" [effective]="effective()" (tc-value-change)="onValueChange($event)"></tc-data-handling-policy>`,
})
export class DataHandlingPolicyExample {
  readonly value = input.required<TcDataHandlingPolicy["value"]>();
  readonly effective = input.required<TcDataHandlingPolicy["effective"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-handling-policy";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";

  let { value, effective }: { value: TcDataHandlingPolicy["value"]; effective: TcDataHandlingPolicy["effective"] } = $props();
  let el: TcDataHandlingPolicy;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-data-handling-policy bind:this={el} {value} {effective}></tc-data-handling-policy>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `DataHandlingPolicyValue` | `{ retention: "30d", memory: "conversation", logging: "metadata", redact: ["personal", "financial", "credentials"], training: false }` | The chosen policy. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `effective` | – | `Partial<DataHandlingPolicyValue> \| undefined` | `undefined` | The policy the app reports as applied; a missing field reads "Not reported" |
| `locks` | – | `DataPolicyLock[]` | `[]` | Settings fixed higher up; they can't be edited here and say who set them |
| `retentionOptions` | – | `DataPolicyOption[]` | `[ { id: "7d", label: "7 days" }, { id: "30d", label: "30 days" }, { id: "90d", label: "90 days" }, { id: "1y", label: "1 year" }, { id: "forever", label: "Until deleted" }, ]` | How long conversations can be kept |
| `memoryOptions` | – | `DataPolicyOption[]` | `[ { id: "off", label: "Off", description: "Nothing is remembered between messages beyond the conversation itself." }, { id: "conversation", label: "This conversation", description: "Remembered facts are forgotten when the conversation ends." }, { id: "persistent", label: "Across conversations", description: "Remembered facts are kept until someone deletes them." }, ]` | How memory can persist |
| `loggingOptions` | – | `DataPolicyOption[]` | `[ { id: "off", label: "Off", description: "Nothing is logged." }, { id: "metadata", label: "Metadata", description: "Timing, model and token counts – no message content." }, { id: "content", label: "Full content", description: "Messages and responses, with the categories below redacted." }, ]` | How much can be logged |
| `categories` | – | `DataPolicyCategory[]` | `[ { id: "personal", label: "Personal details", description: "Names, email addresses, phone numbers" }, { id: "financial", label: "Payment details", description: "Card and bank account numbers" }, { id: "credentials", label: "Credentials", description: "Passwords, keys and tokens" }, { id: "health", label: "Health information", description: "Conditions, treatments, records" }, ]` | The kinds of data that can be redacted from logs |
| `deletionScopes` | – | `DataPolicyOption[]` | `[ { id: "conversations", label: "Conversations", description: "Every conversation and its attachments." }, { id: "memory", label: "Memory", description: "Everything remembered across conversations." }, { id: "logs", label: "Logs", description: "Logged messages and metadata." }, ]` | What a deletion request can cover; empty hides Request deletion |
| `deletions` | – | `DataPolicyDeletion[]` | `[]` | Deletion requests and their status, as the app reports them |
| `labels` | – | `Partial<Record<DataPolicyField, string>>` | `{}` | The stages' and settings' names, merged over the defaults (Conversations, Logs, Memory, Training, Redact from logs) |
| `heading` | `heading` | `string` | `"Data handling"` | The heading |
| `description` | `description` | `string` | `""` | A quieter line under the heading, e.g. which workspace this is |
| `deletedLabel` | `deleted-label` | `string` | `"Deleted"` | The last stage's name |
| `trainingLabel` | `training-label` | `string` | `"Allow conversations to be used to train models"` | The training switch's label |
| `organization` | `organization` | `string` | `"your organization"` | Who a lock without `by` was set by |
| `deletionNote` | `deletion-note` | `string` | `"Deletion can't be undone. It can take a while; the request's status shows here."` | Said in the deletion dialog, under the scope |
| `name` | `name` | `string` | `""` | Submitted with the form: the policy as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the policy out of the form; a disabled fieldset does the same |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A setting changed, or a form reset put them all back with field null ({ value, field }: DataPolicyChange); cancelable – prevent it to control `value` |
| `tc-deletion-request` | – | Yes | A deletion was confirmed ({ scope }: DataPolicyDeletionEvent); cancelable – prevented, no pending request is shown |

#### Design tokens it reads (112)

`--tc-accent`, `--tc-accent-subtle`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-scrim`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-data-handling-policy :value="…">` | `<tc-data-handling-policy [value]="…">` | `<tc-data-handling-policy {value}>` |
| `effective` | `el.effective = …;` | `<… effective={…} />` | `<tc-data-handling-policy :effective="…">` | `<tc-data-handling-policy [effective]="…">` | `<tc-data-handling-policy {effective}>` |
| `locks` | `el.locks = …;` | `<… locks={…} />` | `<tc-data-handling-policy :locks="…">` | `<tc-data-handling-policy [locks]="…">` | `<tc-data-handling-policy {locks}>` |
| `retentionOptions` | `el.retentionOptions = …;` | `<… retentionOptions={…} />` | `<tc-data-handling-policy :retentionOptions="…">` | `<tc-data-handling-policy [retentionOptions]="…">` | `<tc-data-handling-policy {retentionOptions}>` |
| `memoryOptions` | `el.memoryOptions = …;` | `<… memoryOptions={…} />` | `<tc-data-handling-policy :memoryOptions="…">` | `<tc-data-handling-policy [memoryOptions]="…">` | `<tc-data-handling-policy {memoryOptions}>` |
| `loggingOptions` | `el.loggingOptions = …;` | `<… loggingOptions={…} />` | `<tc-data-handling-policy :loggingOptions="…">` | `<tc-data-handling-policy [loggingOptions]="…">` | `<tc-data-handling-policy {loggingOptions}>` |
| `categories` | `el.categories = …;` | `<… categories={…} />` | `<tc-data-handling-policy :categories="…">` | `<tc-data-handling-policy [categories]="…">` | `<tc-data-handling-policy {categories}>` |
| `deletionScopes` | `el.deletionScopes = …;` | `<… deletionScopes={…} />` | `<tc-data-handling-policy :deletionScopes="…">` | `<tc-data-handling-policy [deletionScopes]="…">` | `<tc-data-handling-policy {deletionScopes}>` |
| `deletions` | `el.deletions = …;` | `<… deletions={…} />` | `<tc-data-handling-policy :deletions="…">` | `<tc-data-handling-policy [deletions]="…">` | `<tc-data-handling-policy {deletions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-data-handling-policy :labels="…">` | `<tc-data-handling-policy [labels]="…">` | `<tc-data-handling-policy {labels}>` |

*Also attributes: `heading`, `description`, `deleted-label`, `training-label`, `organization`, `deletion-note`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-deletion-request` | Yes | `el.addEventListener("tc-deletion-request", (e) => …)` | `onDeletionRequest={…}` | `@tc-deletion-request="…"` | `(tc-deletion-request)="…($event)"` | `el.addEventListener("tc-deletion-request", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-data-handling-policy id="data-handling-policy"></tc-data-handling-policy>

<script type="module">
  import "@adamstavely/trenchcoat/data-handling-policy";

  const el = document.querySelector("#data-handling-policy");
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
import { DataHandlingPolicy } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof DataHandlingPolicy>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledDataHandlingPolicy({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <DataHandlingPolicy {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/data-handling-policy";
import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";

const props = defineProps<{ initial: TcDataHandlingPolicy["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcDataHandlingPolicy["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-data-handling-policy :value="value" @tc-value-change="onValueChange"></tc-data-handling-policy>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { DataHandlingPolicy } from "@adamstavely/trenchcoat/angular/data-handling-policy";
import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";

@Component({
  selector: "app-controlled-data-handling-policy",
  imports: [DataHandlingPolicy],
  template: `<tc-data-handling-policy [value]="value()" (tc-value-change)="onValueChange($event)"></tc-data-handling-policy>`,
})
export class ControlledDataHandlingPolicy {
  readonly initial = input.required<TcDataHandlingPolicy["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcDataHandlingPolicy["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/data-handling-policy";
  import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";

  let { initial }: { initial: TcDataHandlingPolicy["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcDataHandlingPolicy;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcDataHandlingPolicy["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-data-handling-policy bind:this={el} {value}></tc-data-handling-policy>
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
<tc-data-handling-policy :value="value" @tc-value-change="value = $event.detail.value"></tc-data-handling-policy>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-data-handling-policy [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-data-handling-policy>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-data-handling-policy bind:this={el} {value}></tc-data-handling-policy>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-data-handling-policy")` returns a `TcDataHandlingPolicy` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";`
- **React / Next.js:** Props: `import type { DataHandlingPolicyProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof DataHandlingPolicy>`. The element class, for refs: `import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcDataHandlingPolicy["value"]` with `import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";`
- **Angular:** The directive types the template: `[value]` takes `TcDataHandlingPolicy["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcDataHandlingPolicy } from "@adamstavely/trenchcoat/data-handling-policy";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `value` | `DataHandlingPolicyValue` | The chosen policy (controlled) |
| `defaultValue` | `DataHandlingPolicyValue` | The policy to start with when uncontrolled |
| `onChange` | `(value: DataHandlingPolicyValue, field: DataPolicyField \| null) => void` | Called with the whole policy and the setting that changed (null for a form reset), after every change |
| `onDeletionRequest` | `(scope: DataPolicyOption, event: CustomEvent<DataPolicyDeletionEvent>) => void` | A deletion was confirmed: send the request. Call `event.preventDefault()` if it can't be sent, so no pending request shows |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the stages, then the open stage's Done and controls, then Request deletion |
| Enter / Space | On a stage, opens its controls under the lifecycle and moves focus to them (or closes them if open); on a checkbox or switch, turns it on or off |
| Arrow keys, Home, End | In a segmented choice, move to and pick an option |
| Escape | In an open stage's controls, closes them and returns focus to the stage |

In the deletion dialog, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between what to delete, Cancel and Delete, wrapping inside the dialog |
| Escape | Closes without asking for anything |

Done and Cancel return focus to the button that opened them.

### Screen readers

The element is a group named by its heading. The lifecycle is a list named “Data lifecycle”; each stage you can edit
is a button with `aria-expanded` and `aria-controls` pointing at the controls. It reads its name and what's in
effect – “Logs”, “Full content”, “4 kinds redacted” – then “Changing to 30 days” or “Not reported” when they apply,
and “Set by Northwind IT” when it's locked. The open controls are a region named by the stage. Each segmented choice is a radio
group named by its label; redaction categories are checkboxes and training a switch, described by their lock. Every
setting says “In effect: 90 days – not yet your choice” or similar. The deletion dialog is a modal `alertdialog`
named “Request deletion?”. A polite status message confirms “Deletion of conversations requested.”

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself | Modals trap focus, close on Escape and sit in the top layer. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 45.6 KB | 12.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **83.9 KB** | **20.4 KB** |
| With Lit – the first component on a page | 105.6 KB | 27.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 104 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of retentionOptions replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.6 ms | retentionOptions: first render, 104 nodes; update 0.2 ms |
| 1,000 items | 1.2 ms | retentionOptions: first render, 104 nodes; update 0.2 ms |

What it renders doesn't grow with retentionOptions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name options as people say them: “30 days”, “Across conversations”, “Full content”. Retention options that start
  with a number read “Kept 30 days” on the stage.
- Give `unavailable` options the reason, in a sentence: “Your organization keeps conversations for at most 90 days.”
- Say who set a lock in `by` (“Northwind IT”) and why in `note`; without `by` it reads “Set by your organization”.
- Report `effective` from what your platform applied, not from what was saved. A field you can't report stays out,
  and the stage says “Not reported”.
- Give deletion requests a `detail` with who asked and when.

## Do and don't

### Do

- Apply the policy on your server and providers, then update `effective` – that's what the stages lead with.
- Enforce locks on your server too; a lock here only stops the controls.
- Answer `tc-deletion-request` by listing the request in `deletions`; the pending row stays until the list changes.

### Don't

- Don't tell people data is deleted, unlogged or excluded from training because a setting here says so.
- Don't hide a locked setting – show it, with who set it.
- Don't report a deletion as completed before it is.

## Related

- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Kill Switch](kill-switch.md) – System posture and the emergency stop – what's running, a confirmed Stop that says what it halts, and resume
