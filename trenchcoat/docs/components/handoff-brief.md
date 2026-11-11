<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Handoff Brief

**Trust & calibration** · New

Work passing from one person to another – summary, open items and commitments, each acknowledged by the receiver, blocked when they lack access

- **Element:** `<tc-handoff-brief>`
- **Size:** 9.3 KB gzip · 31.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/handoff-brief";` |
| React / Next.js | `import { HandoffBrief } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/handoff-brief";` · tags starting with tc- are custom elements |
| Angular | `import { HandoffBrief } from "@adamstavely/trenchcoat/angular/handoff-brief";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/handoff-brief";` |

## Example

The live example is in the gallery at `#/handoff-brief`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Work passing from one person to another for good – a case, an account, a review. The receiver gets three sections:
a summary of where it stands, the items still unresolved and the commitments already made. They acknowledge each
section separately, so the open items and promises can't be waved through with one click, and a progress line at
the top shows how far they are. If the work refers to material the receiver can't open, the handoff is blocked:
the card leads with exactly what's missing and a Request access button, and Accept stays off until access is
granted.

### When to use

- Reassigning work between people: a colleague going on leave, changing teams or handing over a shift.
- Anywhere a receiver must confirm they've read the open items and commitments before taking over.
- When access to the underlying material has to be checked before the handover completes.

### When not to use

- An agent handing a running task to a person and taking it back – use [Handoff](handoff.md).
- Two reviewers disagreeing about the same item – use [Review Conflict](review-conflict.md).
- Approving a single action – use [Approval Card](approval-card.md).
- A checklist of set-up steps – use [Setup Guide](setup-guide.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **State** `.ui-hob__state` – progress, the block and what's missing, or accepted
2. **Section** `.ui-hob__section` – summary, unresolved items or commitments made
3. **Acknowledge** `.ui-hob__ack` – the receiver's acknowledgement of one section
4. **Missing** `.ui-hob__missing` – the material the receiver can't open
5. **Accept** `.ui-hob__foot` – what's left to do, and Accept handoff

## Looks

Standard puts the header on the gray tray, the state and sections on a white card, and the Accept row back on the
tray. Clean is one white card with the Accept row as its last row under a hairline. Both colour the state – red
when blocked, green once accepted – and number each section, turning the number into a check when it's
acknowledged.

## Usage

### HTML

```html
<tc-handoff-brief id="brief" heading="Q3 supplier review" summary="Two-thirds done; Northwind is the only supplier at risk."></tc-handoff-brief>

<script type="module">
  import "@adamstavely/trenchcoat/handoff-brief";
  import "@adamstavely/trenchcoat/tokens.css";

  const brief = document.querySelector("#brief");
  brief.from = { name: "Ana Ruiz" };
  brief.to = { name: "Sam Patel" };
  brief.unresolved = [{ id: "u1", text: "Confirm Northwind's Q3 capacity", meta: "Due Thu" }];
  brief.commitments = [{ id: "c1", text: "Send the risk summary to Procurement", meta: "Fri" }];
  brief.missing = [{ id: "contract", label: "Northwind supplier contract", where: "Unresolved item 1" }];
  brief.addEventListener("tc-access-request", (e) => console.log("request access to", e.detail.items));
  brief.addEventListener("tc-accept", () => console.log("accepted"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { HandoffBrief, type HandoffBriefAccess, type HandoffBriefSection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReviewHandoff({ missing, onAccepted }: { missing: HandoffBriefAccess[]; onAccepted: () => void }) {
  const [acknowledged, setAcknowledged] = useState<HandoffBriefSection[]>([]);
  return (
    <HandoffBrief
      title="Q3 supplier review"
      from={{ name: "Ana Ruiz" }}
      to={{ name: "Sam Patel" }}
      summary="Two-thirds done; Northwind is the only supplier at risk."
      unresolved={[{ id: "u1", text: "Confirm Northwind's Q3 capacity", meta: "Due Thu" }]}
      commitments={[{ id: "c1", text: "Send the risk summary to Procurement", meta: "Fri" }]}
      missing={missing}
      acknowledged={acknowledged}
      onAcknowledgedChange={setAcknowledged}
      onAccept={onAccepted}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/handoff-brief";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";

defineProps<{ from: TcHandoffBrief["from"]; to: TcHandoffBrief["to"] }>();
const onAcknowledgedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-handoff-brief :from="from" :to="to" @tc-acknowledged-change="onAcknowledgedChange"></tc-handoff-brief>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HandoffBrief } from "@adamstavely/trenchcoat/angular/handoff-brief";
import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";

@Component({
  selector: "app-handoff-brief-example",
  imports: [HandoffBrief],
  template: `<tc-handoff-brief [from]="from()" [to]="to()" (tc-acknowledged-change)="onAcknowledgedChange($event)"></tc-handoff-brief>`,
})
export class HandoffBriefExample {
  readonly from = input.required<TcHandoffBrief["from"]>();
  readonly to = input.required<TcHandoffBrief["to"]>();
  onAcknowledgedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/handoff-brief";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";

  let { from, to }: { from: TcHandoffBrief["from"]; to: TcHandoffBrief["to"] } = $props();
  let el: TcHandoffBrief;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-acknowledged-change", on);
    return () => el.removeEventListener("tc-acknowledged-change", on);
  });
</script>

<tc-handoff-brief bind:this={el} {from} {to}></tc-handoff-brief>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Handoff"` | The heading, and the group's name |
| `from` | – | `HandoffBriefPerson` | `{ name: "" }` | Who hands the work over |
| `to` | – | `HandoffBriefPerson` | `{ name: "" }` | Who receives it – the person looking |
| `at` | `at` | `string` | `""` | When, as the app words it – "Today 16:40" |
| `summary` | `summary` | `string` | `""` | What the work is and where it stands, in a short paragraph |
| `unresolved` | – | `HandoffBriefItem[]` | `[]` | What's still open |
| `commitments` | – | `HandoffBriefItem[]` | `[]` | What the previous owner promised, to whom and by when |
| `acknowledged` | – | `HandoffBriefSection[]` | `[]` | The sections acknowledged so far |
| `missing` | – | `HandoffBriefAccess[]` | `[]` | Material the work refers to that the receiver can't open – any blocks the handoff |
| `accessRequest` | `access-request` | `HandoffBriefRequest \| ""` | `""` | Where the access request stands, when the app owns it; the element sets it when not prevented |
| `requestAccess` | – | `HandoffBriefAccessResolver \| undefined` | `undefined` | Sends the access request and settles when it's sent. Unset, a request counts as sent |
| `accepted` | `accepted` | `boolean` | `false` | The receiver accepted the work |
| `sectionTitles` | – | `Partial<Record<HandoffBriefSection, string>>` | `{}` | Names of the three sections |
| `acceptLabel` | `accept-label` | `string` | `"Accept handoff"` | The accept button's text |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-acknowledged-change` | – | Yes | A section was acknowledged or un-acknowledged ({ acknowledged, section, on }: HandoffBriefAcknowledgedChange); cancelable |
| `tc-access-request` | – | Yes | Request access (or Retry) was pressed ({ items }: HandoffBriefAccessRequest); cancelable – prevented, the app sets `accessRequest` itself |
| `tc-accept` | – | Yes | Accept handoff was pressed ({ acknowledged }: HandoffBriefAccept); cancelable – not prevented, `accepted` becomes true |

#### Design tokens it reads (70)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `from` | `el.from = …;` | `<… from={…} />` | `<tc-handoff-brief :from="…">` | `<tc-handoff-brief [from]="…">` | `<tc-handoff-brief {from}>` |
| `to` | `el.to = …;` | `<… to={…} />` | `<tc-handoff-brief :to="…">` | `<tc-handoff-brief [to]="…">` | `<tc-handoff-brief {to}>` |
| `unresolved` | `el.unresolved = …;` | `<… unresolved={…} />` | `<tc-handoff-brief :unresolved="…">` | `<tc-handoff-brief [unresolved]="…">` | `<tc-handoff-brief {unresolved}>` |
| `commitments` | `el.commitments = …;` | `<… commitments={…} />` | `<tc-handoff-brief :commitments="…">` | `<tc-handoff-brief [commitments]="…">` | `<tc-handoff-brief {commitments}>` |
| `acknowledged` | `el.acknowledged = …;` | `<… acknowledged={…} />` | `<tc-handoff-brief :acknowledged="…">` | `<tc-handoff-brief [acknowledged]="…">` | `<tc-handoff-brief {acknowledged}>` |
| `missing` | `el.missing = …;` | `<… missing={…} />` | `<tc-handoff-brief :missing="…">` | `<tc-handoff-brief [missing]="…">` | `<tc-handoff-brief {missing}>` |
| `requestAccess` | `el.requestAccess = …;` | `<… requestAccess={…} />` | `<tc-handoff-brief :requestAccess="…">` | `<tc-handoff-brief [requestAccess]="…">` | `<tc-handoff-brief {requestAccess}>` |
| `sectionTitles` | `el.sectionTitles = …;` | `<… sectionTitles={…} />` | `<tc-handoff-brief :sectionTitles="…">` | `<tc-handoff-brief [sectionTitles]="…">` | `<tc-handoff-brief {sectionTitles}>` |

*Also attributes: `heading`, `at`, `summary`, `access-request`, `accepted`, `accept-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-acknowledged-change` | Yes | `el.addEventListener("tc-acknowledged-change", (e) => …)` | `onAcknowledgedChange={…}` | `@tc-acknowledged-change="…"` | `(tc-acknowledged-change)="…($event)"` | `el.addEventListener("tc-acknowledged-change", …)` |
| `tc-access-request` | Yes | `el.addEventListener("tc-access-request", (e) => …)` | `onRequestAccess={…}` | `@tc-access-request="…"` | `(tc-access-request)="…($event)"` | `el.addEventListener("tc-access-request", …)` |
| `tc-accept` | Yes | `el.addEventListener("tc-accept", (e) => …)` | `onAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |

### Controlled

The element changes `acknowledged` itself unless a listener calls `preventDefault()` on `tc-acknowledged-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-handoff-brief id="handoff-brief"></tc-handoff-brief>

<script type="module">
  import "@adamstavely/trenchcoat/handoff-brief";

  const el = document.querySelector("#handoff-brief");
  el.addEventListener("tc-acknowledged-change", (e) => {
    e.preventDefault(); // the element keeps its acknowledged…
    if (allowed(e.detail.acknowledged)) el.acknowledged = e.detail.acknowledged; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { HandoffBrief } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof HandoffBrief>;
type Props = Omit<Own, "acknowledged" | "onAcknowledgedChange"> & { initial: NonNullable<Own["acknowledged"]> };

// Controlled: passing acknowledged makes the wrapper prevent the element's own change; the app sets it
export function ControlledHandoffBrief({ initial, ...props }: Props) {
  const [acknowledged, setAcknowledged] = useState<Own["acknowledged"]>(initial);
  return <HandoffBrief {...props} acknowledged={acknowledged} onAcknowledgedChange={(next) => setAcknowledged(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/handoff-brief";
import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";

const props = defineProps<{ initial: TcHandoffBrief["acknowledged"] }>();
const acknowledged = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAcknowledgedChange = (e: CustomEvent<{ acknowledged: TcHandoffBrief["acknowledged"] }>) => {
  e.preventDefault();
  acknowledged.value = e.detail.acknowledged;
};
</script>

<template>
  <tc-handoff-brief :acknowledged="acknowledged" @tc-acknowledged-change="onAcknowledgedChange"></tc-handoff-brief>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { HandoffBrief } from "@adamstavely/trenchcoat/angular/handoff-brief";
import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";

@Component({
  selector: "app-controlled-handoff-brief",
  imports: [HandoffBrief],
  template: `<tc-handoff-brief [acknowledged]="acknowledged()" (tc-acknowledged-change)="onAcknowledgedChange($event)"></tc-handoff-brief>`,
})
export class ControlledHandoffBrief {
  readonly initial = input.required<TcHandoffBrief["acknowledged"]>();
  readonly acknowledged = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAcknowledgedChange(e: CustomEvent<{ acknowledged: TcHandoffBrief["acknowledged"] }>) {
    e.preventDefault();
    this.acknowledged.set(e.detail.acknowledged);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/handoff-brief";
  import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";

  let { initial }: { initial: TcHandoffBrief["acknowledged"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let acknowledged = $derived(initial);
  let el: TcHandoffBrief;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      acknowledged = (e as CustomEvent<{ acknowledged: TcHandoffBrief["acknowledged"] }>).detail.acknowledged;
    };
    el.addEventListener("tc-acknowledged-change", on);
    return () => el.removeEventListener("tc-acknowledged-change", on);
  });
</script>

<tc-handoff-brief bind:this={el} {acknowledged}></tc-handoff-brief>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-handoff-brief")` returns a `TcHandoffBrief` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";`
- **React / Next.js:** Props: `import type { HandoffBriefProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HandoffBrief>`. The element class, for refs: `import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHandoffBrief["from"]` with `import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";`
- **Angular:** The directive types the template: `[from]` takes `TcHandoffBrief["from"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHandoffBrief } from "@adamstavely/trenchcoat/handoff-brief";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the group's name |
| `acknowledged` | `HandoffBriefSection[]` | The sections acknowledged – controlled when given |
| `defaultAcknowledged` | `HandoffBriefSection[]` | The sections acknowledged at first, when `acknowledged` isn't set |
| `onAcknowledgedChange` | `(acknowledged: HandoffBriefSection[]) => void` | Called with the acknowledged sections whenever one is acknowledged or un-acknowledged |
| `onRequestAccess` | `(items: HandoffBriefAccess[], event: CustomEvent<HandoffBriefAccessRequest>) => void` | Called when Request access (or Retry) is pressed; call `event.preventDefault()` to set `accessRequest` yourself |
| `accepted` | `boolean` | Whether the receiver has accepted – controlled when given |
| `defaultAccepted` | `boolean` | Whether it starts accepted, when `accepted` isn't set |
| `onAccept` | `() => void` | Called when the receiver accepts the handoff |

*Renamed or hidden on the wrapper: `heading`, `acknowledged`, `accepted`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Request access (when blocked), each section's Acknowledge, then Accept handoff |
| Enter / Space | Presses the focused button: acknowledges or un-acknowledges a section, requests access, accepts |

Accept handoff is disabled until it can be pressed; the hint beside it says why. After accepting, focus moves to the
“Accepted” line.

### Screen readers

The card is a `group` named by its heading. Each section is a `group` named by its title. Acknowledge is a toggle
button (`aria-pressed`) named with its section – “Acknowledge Unresolved items”, then “Acknowledged Unresolved
items”. The progress is a `progressbar` named “Sections acknowledged”, valued “1 of 3”. When blocked, the missing
material is a list named “What you can't open”. Accept is described by its hint (“Acknowledge 2 more sections to
accept.”, “Blocked until you can open everything it refers to.”). A polite status announces each acknowledgement
(“Summary acknowledged. 1 of 3.”), the access request, “Access granted. Nothing blocks the handoff.” and “Handoff
accepted. The work is yours now.”

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.5 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **31.3 KB** | **9.3 KB** |
| With Lit – the first component on a page | 53.2 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 80 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of unresolved replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.7 ms | unresolved: first render, 501 nodes; update 0.4 ms |
| 1,000 items | 36 ms | unresolved: first render, 4,401 nodes; update 2.2 ms |

1,000 items of unresolved: 36 ms, 4,401 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the summary for someone who wasn't there: where it stands, what's at risk, what's next.
- Phrase unresolved items as things to do (“Confirm Northwind's Q3 capacity”), with `detail` for context.
- Put the deadline or the person a commitment was made to in `meta`.
- Name missing material as the receiver would find it, and say where the brief refers to it in `where`.

## Do and don't

### Do

- Clear `missing` as soon as access is granted, so the block lifts without a reload.
- Record `acknowledged` with the handoff – it shows the receiver saw each section.
- Let the receiver acknowledge while blocked; only Accept waits for access.

### Don't

- Don't collapse the three sections into one “I've read this”.
- Don't let the handoff complete with references the receiver can't open.
- Don't use it for a handoff the sender can take back mid-task – that's `handoff`.

## Related

- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Review Conflict](review-conflict.md) – Two reviewers disagree – both verdicts with who gave them, resolved by a third person with a reason, or kept blind
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
