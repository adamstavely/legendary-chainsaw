<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Access Request

**Trust & calibration** · New

Ask for access to one piece of data – the resource with its owner and classification in words, the level, how long, a required justification and the fields needed – then where it stands: pending with who decides, approved with the time left, denied with the reason, or expired

- **Element:** `<tc-access-request>`
- **Size:** 11.5 KB gzip · 39.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/access-request";` |
| React / Next.js | `import { AccessRequest } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/access-request";` · tags starting with tc- are custom elements |
| Angular | `import { AccessRequest } from "@adamstavely/trenchcoat/angular/access-request";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/access-request";` |

## Example

The live example is in the gallery at `#/access-request`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A person asks for access to one piece of data. The resource comes first: its name, what kind of thing it is (dataset,
table, file, report or field), who owns or looks after it, its classification in words, and what the person already
has.

Then the form:
- the access level – View, Download or Edit, or your own;
- how long – 7, 30 or 90 days, an end date, or permanent when you allow it;
- a required justification with a character counter;
- an optional ticket or reference;
- the fields needed, when you list them.

Sending fires a cancelable `tc-request`. After that the card shows where the request stands, each state in words with
an icon:
- **Pending:** who decides, when it was sent, and Cancel request.
- **Approved:** the level, when access ends and the time left.
- **Denied:** the reason, and Request again.
- **Expired:** when it ended, and Request again.

`status` is yours to own: set it from your approval workflow.

### When to use

- Self-service access to datasets, tables, files or reports in a data catalogue.
- Asking for more than you have – Download where you can only View.
- Showing someone where their request stands, in the same place they asked.

### When not to use

- The approver's side, deciding on a request – use [Approval Card](approval-card.md).
- An agent asking a person for a right – use [Permission Request](permission-request.md).
- Setting rules for how data may be used – use [Data handling policy](data-handling-policy.md).
- Granting many tools at once – use [Tool Permissions](tool-permissions.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Resource** `.ui-dar__resource` – the data asked for: its type icon, name, type, classification, owner, steward and current access
2. **Classification** `.ui-dar__class` – the sensitivity in words, with a lock
3. **Level** `.ui-dar__levels` – the access levels, each with a line on what it allows
4. **Duration** `.ui-dar__chips` – how long, and the end date field when End date is picked
5. **Fields** `.ui-dar__fields` – the fields or columns needed, when `fields` is given
6. **Justification** `.ui-dar__why` – why the person needs it, with a counter
7. **Reference** `.ui-dar__input` – an optional ticket or reference
8. **Status** `.ui-dar__status` – where the request stands, in words with an icon and its action

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The form and the status lines are the same in both.

## Usage

### HTML

```html
<tc-access-request id="ask"></tc-access-request>

<script type="module">
  import "@adamstavely/trenchcoat/access-request";
  import "@adamstavely/trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.resource = { name: "Field station sensor readings 2024", type: "dataset", owner: "Field Data team", classification: "internal", current: "No access" };
  ask.approvers = ["Dr Ines Okafor"];
  ask.addEventListener("tc-request", (e) => console.log(e.detail.level, e.detail.until, e.detail.justification));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AccessRequest, type AccessStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AskForData() {
  const [status, setStatus] = useState<AccessStatus>("draft");
  return (
    <AccessRequest
      resource={{ name: "Field station sensor readings 2024", type: "dataset", owner: "Field Data team", classification: "internal" }}
      approvers={["Dr Ines Okafor"]}
      status={status}
      onStatusChange={setStatus}
      onRequest={(request) => console.log("Send to the workflow", request)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/access-request";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";

defineProps<{ resource: TcAccessRequest["resource"]; classifications: TcAccessRequest["classifications"] }>();
const onRequest = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-access-request :resource="resource" :classifications="classifications" @tc-request="onRequest"></tc-access-request>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AccessRequest } from "@adamstavely/trenchcoat/angular/access-request";
import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";

@Component({
  selector: "app-access-request-example",
  imports: [AccessRequest],
  template: `<tc-access-request [resource]="resource()" [classifications]="classifications()" (tc-request)="onRequest($event)"></tc-access-request>`,
})
export class AccessRequestExample {
  readonly resource = input.required<TcAccessRequest["resource"]>();
  readonly classifications = input.required<TcAccessRequest["classifications"]>();
  onRequest(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/access-request";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";

  let { resource, classifications }: { resource: TcAccessRequest["resource"]; classifications: TcAccessRequest["classifications"] } = $props();
  let el: TcAccessRequest;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-request", on);
    return () => el.removeEventListener("tc-request", on);
  });
</script>

<tc-access-request bind:this={el} {resource} {classifications}></tc-access-request>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Request access"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `resource` | – | `AccessResource \| undefined` | `undefined` | The data being asked for |
| `classifications` | – | `Record<string, { label: string; tone: AccessTone }>` | `{}` | Classifications' names and tones, merged over the defaults (public, internal, confidential, restricted) |
| `levels` | – | `AccessLevel[]` | `[ { id: "view", label: "View", description: "See it and query it here" }, { id: "download", label: "Download", description: "Export a copy" }, { id: "edit", label: "Edit", description: "Change and add records" }, ]` | The access levels to choose from |
| `level` | `level` | `string \| undefined` | `undefined` | The picked level's id; by default the first level. Changed by the user unless tc-level-change is prevented |
| `durations` | – | `AccessDuration[]` | `[ { id: "7d", label: "7 days", days: 7 }, { id: "30d", label: "30 days", days: 30 }, { id: "90d", label: "90 days", days: 90 }, ]` | The fixed durations to choose from; an end date is always offered, permanent only with `allow-permanent` |
| `duration` | `duration` | `AccessDurationId \| undefined` | `undefined` | The picked duration: a duration's id, "custom" or "permanent"; by default the second duration (30 days). Changed by the user unless tc-duration-change is prevented |
| `allowPermanent` | `allow-permanent` | `boolean` | `false` | Offers Permanent as a duration |
| `minJustification` | `min-justification` | `number` | `20` | The fewest characters a justification may have |
| `maxJustification` | `max-justification` | `number` | `1000` | The most characters a justification may have |
| `fields` | – | `string[]` | `[]` | The fields or columns that may be asked for; empty hides the choice |
| `referenceLabel` | `reference-label` | `string` | `"Ticket or reference"` | The optional reference field's label; empty hides it |
| `status` | `status` | `AccessStatus` | `"draft"` | Where the request stands. Changed by the element unless a tc-status-change listener calls preventDefault() |
| `approvers` | – | `string[]` | `[]` | Who decides, shown while pending |
| `submittedAt` | `submitted-at` | `number \| undefined` | `undefined` | When the request was sent, epoch ms; set by the element when it sends one |
| `expiresAt` | `expires-at` | `number \| undefined` | `undefined` | When granted access ends, epoch ms; unset while approved means permanent |
| `reason` | `reason` | `string \| undefined` | `undefined` | Why the request was denied |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for "time left", epoch ms – unset uses an internal clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-request` | – | Yes | The form was sent ({ level, duration, until, justification, reference, fields }: AccessRequestDetail); cancelable – prevented, the form stays as it is |
| `tc-status-change` | – | Yes | The status is about to change: pending after a request, draft after Cancel or Request again ({ status }: AccessStatusChange); cancelable – prevented, `status` stays as it was |
| `tc-level-change` | – | Yes | A level was picked ({ level }: AccessLevelChange); cancelable – prevented, `level` stays as it was |
| `tc-duration-change` | – | Yes | A duration was picked ({ duration }: AccessDurationChange); cancelable – prevented, `duration` stays as it was |
| `tc-cancel` | – | Yes | Cancel request was used on a pending request ({ status }: AccessCancel); cancelable – prevented, the request stays pending |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-dar-status-icon` | `18px` | both |

#### Design tokens it reads (86)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-dar-tone`, `--tc-dar-tone-bg`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-quick`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultAccessLevels: AccessLevel[]` | The levels offered when the page gives none |
| `defaultAccessDurations: AccessDuration[]` | The fixed durations offered when the page gives none; an end date and permanent are added by the element |
| `defaultAccessClassifications: Record<string, { label: string; tone: AccessTone }>` | The classifications' names and tones used when the page gives none |

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
| `resource` | `el.resource = …;` | `<… resource={…} />` | `<tc-access-request :resource="…">` | `<tc-access-request [resource]="…">` | `<tc-access-request {resource}>` |
| `classifications` | `el.classifications = …;` | `<… classifications={…} />` | `<tc-access-request :classifications="…">` | `<tc-access-request [classifications]="…">` | `<tc-access-request {classifications}>` |
| `levels` | `el.levels = …;` | `<… levels={…} />` | `<tc-access-request :levels="…">` | `<tc-access-request [levels]="…">` | `<tc-access-request {levels}>` |
| `durations` | `el.durations = …;` | `<… durations={…} />` | `<tc-access-request :durations="…">` | `<tc-access-request [durations]="…">` | `<tc-access-request {durations}>` |
| `fields` | `el.fields = …;` | `<… fields={…} />` | `<tc-access-request :fields="…">` | `<tc-access-request [fields]="…">` | `<tc-access-request {fields}>` |
| `approvers` | `el.approvers = …;` | `<… approvers={…} />` | `<tc-access-request :approvers="…">` | `<tc-access-request [approvers]="…">` | `<tc-access-request {approvers}>` |

*Also attributes: `heading`, `description`, `level`, `duration`, `allow-permanent`, `min-justification`, `max-justification`, `reference-label` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-request` | Yes | `el.addEventListener("tc-request", (e) => …)` | `onRequest={…}` | `@tc-request="…"` | `(tc-request)="…($event)"` | `el.addEventListener("tc-request", …)` |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-level-change` | Yes | `el.addEventListener("tc-level-change", (e) => …)` | `ref.current.addEventListener("tc-level-change", …)` | `@tc-level-change="…"` | `(tc-level-change)="…($event)"` | `el.addEventListener("tc-level-change", …)` |
| `tc-duration-change` | Yes | `el.addEventListener("tc-duration-change", (e) => …)` | `ref.current.addEventListener("tc-duration-change", …)` | `@tc-duration-change="…"` | `(tc-duration-change)="…($event)"` | `el.addEventListener("tc-duration-change", …)` |
| `tc-cancel` | Yes | `el.addEventListener("tc-cancel", (e) => …)` | `onCancelRequest={…}` | `@tc-cancel="…"` | `(tc-cancel)="…($event)"` | `el.addEventListener("tc-cancel", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `level`, `duration` and `status` itself unless a listener calls `preventDefault()` on `tc-level-change`, `tc-duration-change` or `tc-status-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-access-request id="access-request"></tc-access-request>

<script type="module">
  import "@adamstavely/trenchcoat/access-request";

  const el = document.querySelector("#access-request");
  el.addEventListener("tc-level-change", (e) => {
    e.preventDefault(); // the element keeps its level…
    if (allowed(e.detail.level)) el.level = e.detail.level; // …until the app sets it
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
import "@adamstavely/trenchcoat/access-request";
import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";

const props = defineProps<{ initial: TcAccessRequest["level"] }>();
const level = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLevelChange = (e: CustomEvent<{ level: TcAccessRequest["level"] }>) => {
  e.preventDefault();
  level.value = e.detail.level;
};
</script>

<template>
  <tc-access-request :level="level" @tc-level-change="onLevelChange"></tc-access-request>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AccessRequest } from "@adamstavely/trenchcoat/angular/access-request";
import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";

@Component({
  selector: "app-controlled-access-request",
  imports: [AccessRequest],
  template: `<tc-access-request [level]="level()" (tc-level-change)="onLevelChange($event)"></tc-access-request>`,
})
export class ControlledAccessRequest {
  readonly initial = input.required<TcAccessRequest["level"]>();
  readonly level = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLevelChange(e: CustomEvent<{ level: TcAccessRequest["level"] }>) {
    e.preventDefault();
    this.level.set(e.detail.level);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/access-request";
  import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";

  let { initial }: { initial: TcAccessRequest["level"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let level = $derived(initial);
  let el: TcAccessRequest;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      level = (e as CustomEvent<{ level: TcAccessRequest["level"] }>).detail.level;
    };
    el.addEventListener("tc-level-change", on);
    return () => el.removeEventListener("tc-level-change", on);
  });
</script>

<tc-access-request bind:this={el} {level}></tc-access-request>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-access-request")` returns a `TcAccessRequest` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";`
- **React / Next.js:** Props: `import type { AccessRequestProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AccessRequest>`. The element class, for refs: `import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAccessRequest["resource"]` with `import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";`
- **Angular:** The directive types the template: `[resource]` takes `TcAccessRequest["resource"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAccessRequest } from "@adamstavely/trenchcoat/access-request";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `status` | `AccessStatus` | Where the request stands – controlled when given |
| `defaultStatus` | `AccessStatus` | The status on mount when `status` isn't controlled |
| `onStatusChange` | `(status: AccessStatus) => void` | The status changed: pending after a request, draft after Cancel or Request again |
| `level` | `string` | The picked level – controlled when given |
| `defaultLevel` | `string` | The level on mount when `level` isn't controlled |
| `onLevelChange` | `(level: string) => void` | A level was picked |
| `duration` | `AccessDurationId` | The picked duration – controlled when given |
| `defaultDuration` | `AccessDurationId` | The duration on mount when `duration` isn't controlled |
| `onAccessDurationChange` | `(duration: AccessDurationId) => void` | A duration was picked |
| `onRequest` | `(request: AccessRequestDetail) => boolean \| void` | The form was sent; return false to keep the form as it is (e.g. the request failed) |
| `onCancelRequest` | `() => boolean \| void` | Cancel request was used; return false to keep the request pending |

*Renamed or hidden on the wrapper: `heading`, `status`, `level`, `duration`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the level, the duration, each field and the buttons |
| ← / → or ↑ / ↓ | In the level or the duration, moves to and picks the previous or next choice |
| Home / End | In the level or the duration, picks the first or last choice |
| Space | Ticks or clears a field |
| Enter | In a text field, sends the request |

### Screen readers

The card is a group named by the heading. The classification is read as "Classification: Internal". The level and
the duration are `radiogroup`s. The justification is required, and is described by its counter and, after a failed
send, by its error. The end date and the fields work the same way. A failed send moves focus to the first field with a
problem. Sending, cancelling and the status line are announced politely: "Request sent", "Request cancelled".

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 30.4 KB | 8.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **39.1 KB** | **11.5 KB** |
| With Lit – the first component on a page | 58.7 KB | 17.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.5 ms** | the gallery demo's data, 81 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of fields replaced |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.1 ms | fields: first render, 363 nodes; update 0.6 ms |
| 1,000 items | 21 ms | fields: first render, 3,063 nodes; update 2.1 ms |

1,000 items of fields: 21 ms, 3,063 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the resource as the catalogue does, and give it one line of description.
- Describe each level by what it allows ("Export a copy"), not by its permission name.
- Keep `minJustification` low enough to be fair – 20 characters is a sentence.
- Give a denial reason that says what to do instead.

## Do and don't

### Do

- Set `status` from your workflow, so the card matches what the approver sees.
- Pass `approvers`, so the person knows who is deciding.
- Offer Permanent (`allow-permanent`) only where your policy allows it.

### Don't

- Don't use colour alone for the classification – keep its word.
- Don't ask for a reference you don't use; set `reference-label=""` to hide it.
- Don't list hundreds of fields; group them, or ask in the justification instead.

## Related

- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed

## Changelog

- `tc-access-request` – ask for access to one piece of data: level, duration, justification, fields; then pending, approved, denied or expired.
