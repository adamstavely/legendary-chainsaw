<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Approval Card

**Agents** · Also in React

An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row

- **Element:** `<tc-approval-card>`
- **Size:** 16.3 KB gzip · 58.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/approval-card";` |
| React / Next.js | `import { ApprovalCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/approval-card";` · tags starting with tc- are custom elements |
| Angular | `import { ApprovalCard } from "@adamstavely/trenchcoat/angular/approval-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/approval-card";` |

## Example

The live example is in the gallery at `#/approval-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent asks before it does something consequential. The card names the action, shows its risk and a preview –
recipients, key-value details, anything that helps someone judge it – and offers Approve and Deny, with ⌘↵ and Esc
as shortcuts. An optional countdown denies the request when time runs out; it pauses while people hover or focus the
card, and Stop turns it off. Once decided, the card folds into a compact row that says what happened and when, so a
run's history stays readable.

For decisions that need more than a glance, four optional properties add the reasoning behind the request: `why`
(“Why you're seeing this” – the rule or threshold that made the agent ask), `consequences` (“If you approve” and “If
you deny”, side by side), `editableDetails` (an “Edit arguments” mode that turns the text details into fields, so
people can fix a recipient or an amount before approving) and `evidence` (chips that open the sources the request
rests on). Left unset, the card looks exactly as it always has.

Two more show exactly what would change: `diff` – a file change as a small unified diff, its path and +/− counts
above the lines – and `args` – the call's arguments as a readable code block with its keys, strings and numbers
coloured. Both sit in the preview and scroll past `--tc-approval-card-code-max`.

### When to use

- An agent is about to send, pay, delete or publish, and a person must say yes first.
- Inside a chat or a run's timeline, where the decision belongs next to what led up to it.
- Requests that shouldn't wait forever – set `expires-in` so an unanswered one is denied.
- High-stakes requests where people need the reason, the consequences or the sources – add `why`, `consequences`
  and `evidence`.
- Actions whose arguments a person may correct rather than deny – set `editable-details`.
- Changes people should read line by line before saying yes – a file edit as `diff`, a command or migration as `args`.

### When not to use

- Granting an agent access to a tool, scope or account – use [Permission Request](permission-request.md).
- Setting in advance what the agent may do without asking – use [Autonomy Dial](autonomy-dial.md).
- Handing a task to a person to do, not just approve – use [Handoff](handoff.md).
- Showing a tool call that has already run – use [Tool Call Card](tool-call-card.md).
- Several requests from one run that hold up its next steps – use [Approval Gates](approval-gates.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Label** `.ui-ap__label` – where the request comes from, e.g. “Step 4 · gmail.send”
3. **Preview** `.ui-ap__preview` – custom content and the key-value details
4. **Always allow** `.ui-ap__always` – approve this action from now on
5. **Countdown** `.ui-ap__timer` – the time left, and Stop
6. **Buttons** `.ui-ap__actions` – Edit, Deny and Approve, with their shortcuts

## Looks

Standard puts the header on a gray tray, above a white card with the preview and “Always allow”, and the countdown
and buttons on the tray below it. In Standard the preview sits in its own gray box. Clean is one white card with the header as its first row: the preview
as plain rows under a hairline, then “Always allow” and the countdown, with Edit, Deny and Approve at the bottom. `actions="tray"` or `actions="card"` moves the buttons
in either look. The diff and the arguments sit in a white box on Standard's gray preview and on a soft fill in
Clean; `--tc-approval-card-code-max` (220px) is the height they scroll past.

## Usage

### HTML

```html
<tc-approval-card id="ask" heading="Send campaign email" risk="high" expires-in="45"></tc-approval-card>

<script type="module">
  import "@adamstavely/trenchcoat/approval-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#ask");
  card.description = "The October product update goes to 2,412 customers.";
  card.details = [
    { label: "Subject", value: "What's new in October" },
    { label: "Scheduled", value: "Today, 14:00" },
  ];
  card.why = "Campaigns to more than 500 contacts need a person.";
  card.consequences = { approve: "The email goes out now and can't be recalled.", deny: "Nothing is sent." };
  card.evidence = [{ label: "Draft v3", detail: "Doc", href: "/drafts/oct" }];
  card.editableDetails = true;
  card.onApprove = ({ always }) => fetch("/api/campaigns/oct/send", { method: "POST", body: JSON.stringify({ always, details: card.details }) });
  card.addEventListener("tc-details-change", (e) => console.log(e.detail.label, e.detail.value));
  card.addEventListener("tc-deny", (e) => console.log(e.detail.reason));
</script>
```

### React / Next.js

```tsx
import { ApprovalCard } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SendCampaign({ send }: { send: (always: boolean) => Promise<void> }) {
  return (
    <ApprovalCard
      title="Send campaign email"
      description="The October product update goes to 2,412 customers."
      risk="high"
      why="Campaigns to more than 500 contacts need a person."
      consequences={{ approve: "The email goes out now and can't be recalled.", deny: "Nothing is sent." }}
      evidence={[{ label: "Draft v3", detail: "Doc", href: "/drafts/oct" }]}
      editableDetails
      details={[
        { label: "Subject", value: "What's new in October" },
        { label: "Scheduled", value: "Today, 14:00", editable: false },
      ]}
      expiresIn={45}
      onApprove={({ always }) => send(always)}
      onDeny={({ reason }) => console.log(reason)}
    />
  );
}

export function MoveEmbargo() {
  return (
    <ApprovalCard
      title="Move the embargo forward a week"
      risk="medium"
      diff={{
        path: "survey-2026/report.config.ts",
        lines: [
          { kind: "context", text: "export const report = {" },
          { kind: "remove", text: '  embargo: "2026-11-20T09:00Z",' },
          { kind: "add", text: '  embargo: "2026-11-13T09:00Z",' },
          { kind: "context", text: "};" },
        ],
      }}
      args={{ branch: "survey-2026", commit: true }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/approval-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";

defineProps<{ description: TcApprovalCard["description"]; icon: TcApprovalCard["icon"] }>();
const onStatusChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-approval-card :description="description" :icon="icon" @tc-status-change="onStatusChange"></tc-approval-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ApprovalCard } from "@adamstavely/trenchcoat/angular/approval-card";
import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";

@Component({
  selector: "app-approval-card-example",
  imports: [ApprovalCard],
  template: `<tc-approval-card [description]="description()" [icon]="icon()" (tc-status-change)="onStatusChange($event)"></tc-approval-card>`,
})
export class ApprovalCardExample {
  readonly description = input.required<TcApprovalCard["description"]>();
  readonly icon = input.required<TcApprovalCard["icon"]>();
  onStatusChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/approval-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";

  let { description, icon }: { description: TcApprovalCard["description"]; icon: TcApprovalCard["icon"] } = $props();
  let el: TcApprovalCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-approval-card bind:this={el} {description} {icon}></tc-approval-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The action, e.g. "Send campaign email" – the group's name |
| `description` | – | `string \| Element \| undefined` | `undefined` | One line of context below the heading: text, or an element (cloned) |
| `risk` | `risk` | `ApprovalRisk \| undefined` | `undefined` | Tinted badge in the header; leave out to hide it |
| `icon` | – | `Element \| undefined` | `undefined` | Icon element in the header tile (cloned) – defaults to a small shield |
| `details` | – | `ApprovalDetail[] \| undefined` | `undefined` | Key-value rows in the preview, e.g. To, Subject, Scheduled |
| `preview` | – | `string \| Element \| undefined` | `undefined` | Anything to show above the details, e.g. a recipient list: text, or an element (cloned) |
| `status` | `status` | `ApprovalStatus` | `"pending"` | The status |
| `onApprove` | – | `((decision: { always: boolean }) => void \| Promise<unknown>) \| undefined` | `undefined` | Called on Approve with the "Always allow" choice. Return a promise to show a spinner and lock the card until it settles; a rejection keeps it pending and shows `errorLabel`, and Approve can be pressed again to retry |
| `errorLabel` | `error-label` | `string` | `"Couldn't approve. Try again."` | Shown under the buttons when an onApprove promise rejects |
| `editable` | `editable` | `boolean` | `false` | Shows an "Edit" button (it fires tc-edit) |
| `expiresIn` | `expires-in` | `number \| undefined` | `undefined` | Seconds until the request expires and is denied with reason "timeout" |
| `allowStopTimer` | `allow-stop-timer` | `boolean` | `true` | Show a "Stop" button next to the countdown that turns the time limit off (WCAG 2.2.1). Default true |
| `stopTimerLabel` | `stop-timer-label` | `string` | `"Stop"` | Its label – the countdown ("Expires in 42 seconds…") describes it |
| `allowAlways` | `allow-always` | `boolean` | `true` | Show the "Always allow this action" checkbox. Default true |
| `alwaysLabel` | `always-label` | `string` | `"Always allow this action"` | The "Always allow" checkbox's label |
| `approveLabel` | `approve-label` | `string` | `"Approve"` | The Approve button's label |
| `denyLabel` | `deny-label` | `string` | `"Deny"` | The Deny button's label |
| `editLabel` | `edit-label` | `string` | `"Edit"` | The Edit button's label (shown with `editable`) |
| `shortcuts` | `shortcuts` | `boolean` | `true` | Show ⌘↵ / Esc hints on the buttons (the shortcuts work either way). Default true |
| `label` | – | `string \| Element \| undefined` | `undefined` | Small label on the gray tray above the card, e.g. "Step 4 · gmail.send": text, or an element (cloned) |
| `actions` | `actions` | `"tray" \| "card" \| undefined` | `undefined` | Where the buttons sit: on the gray tray below the card or inside the white card. Default: "tray" in the Standard look, "card" in the Clean look |
| `why` | `why` | `string \| undefined` | `undefined` | "Why you're seeing this": one line on what made the agent ask, e.g. the rule or threshold it met |
| `whyLabel` | `why-label` | `string` | `"Why you're seeing this"` | The heading of the `why` line |
| `consequences` | – | `ApprovalConsequences \| undefined` | `undefined` | What happens if the person approves, and if they deny – one sentence each |
| `ifApproveLabel` | `if-approve-label` | `string` | `"If you approve"` | The heading of the approve consequence |
| `ifDenyLabel` | `if-deny-label` | `string` | `"If you deny"` | The heading of the deny consequence |
| `editableDetails` | `editable-details` | `boolean` | `false` | Shows "Edit arguments", which turns the text details into fields; each change fires tc-details-change |
| `editDetailsLabel` | `edit-details-label` | `string` | `"Edit arguments"` | The "Edit arguments" button's label |
| `doneDetailsLabel` | `done-details-label` | `string` | `"Done"` | The button's label while editing |
| `evidence` | – | `ApprovalEvidence[] \| undefined` | `undefined` | Sources the request rests on, shown as chips |
| `evidenceLabel` | `evidence-label` | `string` | `"Evidence"` | The heading of the evidence chips |
| `diff` | – | `ApprovalDiff \| undefined` | `undefined` | A file change the action would make, shown as a small unified diff: `{ path, lines: [{ kind, text }] }` |
| `diffLabel` | `diff-label` | `string` | `"Changes"` | The heading of the diff |
| `args` | – | `ApprovalArgs \| undefined` | `undefined` | The call's arguments, shown as a readable code block |
| `argsLabel` | `args-label` | `string` | `"Arguments"` | The heading of the arguments |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-status-change` | – | Yes | The card was approved, denied or expired; detail `{ status }`. Cancelable: preventDefault() keeps the status (controlled use) |
| `tc-deny` | – | No | Denied by the user or by the countdown; detail `{ reason: "user" \| "timeout" }` |
| `tc-expire` | – | No | The countdown ran out (tc-deny fires too); detail: null |
| `tc-edit` | – | No | Edit was pressed (shown with `editable`); detail: null |
| `tc-details-change` | – | Yes | An argument was edited in "Edit arguments" mode; detail `{ details, index, label, value }`. Cancelable: preventDefault() keeps the rows (controlled use) |
| `tc-evidence-select` | – | No | An evidence chip without `href` was pressed; detail `{ evidence, index }` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-approval-card-primary-kbd-fg` | `light-dark(rgba(255, 255, 255, 0.72), rgba(25, 25, 27, 0.6))` | both |
| `--tc-approval-card-spin` | `800ms` | both |
| `--tc-approval-card-code-max` | `220px` | both |

#### Design tokens it reads (109)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-control`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-syntax-keyword`, `--tc-syntax-number`, `--tc-syntax-property`, `--tc-syntax-string`, `--tc-syntax-text`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `description` | `el.description = …;` | `<… description={…} />` | `<tc-approval-card :description="…">` | `<tc-approval-card [description]="…">` | `<tc-approval-card {description}>` |
| `icon` | `el.icon = …;` | `<… icon={…} />` | `<tc-approval-card :icon="…">` | `<tc-approval-card [icon]="…">` | `<tc-approval-card {icon}>` |
| `details` | `el.details = …;` | `<… details={…} />` | `<tc-approval-card :details="…">` | `<tc-approval-card [details]="…">` | `<tc-approval-card {details}>` |
| `preview` | `el.preview = …;` | `<… preview={…} />` | `<tc-approval-card :preview="…">` | `<tc-approval-card [preview]="…">` | `<tc-approval-card {preview}>` |
| `onApprove` | `el.onApprove = …;` | `<… onApprove={…} />` | `<tc-approval-card :onApprove="…">` | `<tc-approval-card [onApprove]="…">` | `<tc-approval-card {onApprove}>` |
| `label` | `el.label = …;` | `<… label={…} />` | `<tc-approval-card :label="…">` | `<tc-approval-card [label]="…">` | `<tc-approval-card {label}>` |
| `consequences` | `el.consequences = …;` | `<… consequences={…} />` | `<tc-approval-card :consequences="…">` | `<tc-approval-card [consequences]="…">` | `<tc-approval-card {consequences}>` |
| `evidence` | `el.evidence = …;` | `<… evidence={…} />` | `<tc-approval-card :evidence="…">` | `<tc-approval-card [evidence]="…">` | `<tc-approval-card {evidence}>` |
| `diff` | `el.diff = …;` | `<… diff={…} />` | `<tc-approval-card :diff="…">` | `<tc-approval-card [diff]="…">` | `<tc-approval-card {diff}>` |
| `args` | `el.args = …;` | `<… args={…} />` | `<tc-approval-card :args="…">` | `<tc-approval-card [args]="…">` | `<tc-approval-card {args}>` |

*Also attributes: `heading`, `risk`, `status`, `error-label`, `editable`, `expires-in`, `allow-stop-timer`, `stop-timer-label` and 17 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-deny` | No | `el.addEventListener("tc-deny", (e) => …)` | `onDeny={…}` | `@tc-deny="…"` | `(tc-deny)="…($event)"` | `el.addEventListener("tc-deny", …)` |
| `tc-expire` | No | `el.addEventListener("tc-expire", (e) => …)` | `onExpire={…}` | `@tc-expire="…"` | `(tc-expire)="…($event)"` | `el.addEventListener("tc-expire", …)` |
| `tc-edit` | No | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |
| `tc-details-change` | Yes | `el.addEventListener("tc-details-change", (e) => …)` | `onDetailsChange={…}` | `@tc-details-change="…"` | `(tc-details-change)="…($event)"` | `el.addEventListener("tc-details-change", …)` |
| `tc-evidence-select` | No | `el.addEventListener("tc-evidence-select", (e) => …)` | `onEvidenceSelect={…}` | `@tc-evidence-select="…"` | `(tc-evidence-select)="…($event)"` | `el.addEventListener("tc-evidence-select", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `details` and `status` itself unless a listener calls `preventDefault()` on `tc-details-change` or `tc-status-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-approval-card id="approval-card"></tc-approval-card>

<script type="module">
  import "@adamstavely/trenchcoat/approval-card";

  const el = document.querySelector("#approval-card");
  el.addEventListener("tc-details-change", (e) => {
    e.preventDefault(); // the element keeps its details…
    if (allowed(e.detail.details)) el.details = e.detail.details; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ApprovalCard } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ApprovalCard>;
type Props = Omit<Own, "details" | "onDetailsChange"> & { initial: NonNullable<Own["details"]> };

// Controlled: passing details makes the wrapper prevent the element's own change; the app sets it
export function ControlledApprovalCard({ initial, ...props }: Props) {
  const [details, setDetails] = useState<Own["details"]>(initial);
  return <ApprovalCard {...props} details={details} onDetailsChange={(next) => setDetails(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/approval-card";
import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";

const props = defineProps<{ initial: TcApprovalCard["details"] }>();
const details = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onDetailsChange = (e: CustomEvent<{ details: TcApprovalCard["details"] }>) => {
  e.preventDefault();
  details.value = e.detail.details;
};
</script>

<template>
  <tc-approval-card :details="details" @tc-details-change="onDetailsChange"></tc-approval-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ApprovalCard } from "@adamstavely/trenchcoat/angular/approval-card";
import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";

@Component({
  selector: "app-controlled-approval-card",
  imports: [ApprovalCard],
  template: `<tc-approval-card [details]="details()" (tc-details-change)="onDetailsChange($event)"></tc-approval-card>`,
})
export class ControlledApprovalCard {
  readonly initial = input.required<TcApprovalCard["details"]>();
  readonly details = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onDetailsChange(e: CustomEvent<{ details: TcApprovalCard["details"] }>) {
    e.preventDefault();
    this.details.set(e.detail.details);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/approval-card";
  import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";

  let { initial }: { initial: TcApprovalCard["details"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let details = $derived(initial);
  let el: TcApprovalCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      details = (e as CustomEvent<{ details: TcApprovalCard["details"] }>).detail.details;
    };
    el.addEventListener("tc-details-change", on);
    return () => el.removeEventListener("tc-details-change", on);
  });
</script>

<tc-approval-card bind:this={el} {details}></tc-approval-card>
```

### Slots and children

No slots: everything it shows comes from its properties (and, in React, the wrapper's children).

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-approval-card")` returns a `TcApprovalCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";`
- **React / Next.js:** Props: `import type { ApprovalCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ApprovalCard>`. The element class, for refs: `import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcApprovalCard["description"]` with `import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";`
- **Angular:** The directive types the template: `[description]` takes `TcApprovalCard["description"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcApprovalCard } from "@adamstavely/trenchcoat/approval-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The action, e.g. "Send campaign email" |
| `description` | `React.ReactNode` | One line of context below the title |
| `icon` | `React.ReactNode` | Icon in the header tile – defaults to a small shield |
| `details` | `ApprovalDetail[]` | Key-value rows in the preview, e.g. To, Subject, Scheduled |
| `preview` | `React.ReactNode` | Anything to show above the details, e.g. a recipient list – children work too |
| `children` | `React.ReactNode` | The preview, when `preview` isn't given |
| `label` | `React.ReactNode` | Small label on the gray tray above the card |
| `status` | `ApprovalStatus` | The status. Controlled when defined – the card then only asks for changes through `onStatusChange` |
| `defaultStatus` | `ApprovalStatus` | Starting status when `status` isn't controlled |
| `onStatusChange` | `(status: ApprovalStatus) => void` | Called with the new status whenever the card is approved, denied or expires (controlled or not) |
| `onDeny` | `(decision: { reason: DenyReason }) => void` | Called when the card is denied, by the user or by the countdown (`reason: "timeout"`) |
| `onEdit` | `() => void` | Shows an "Edit" button |
| `onExpire` | `() => void` | Called when the countdown runs out (onDeny is called too) |
| `onDetailsChange` | `(details: ApprovalDetail[], change: { index: number; label: string; value: string }) => void` | With `editableDetails`, called with the rows after an argument is edited. Given, the rows are controlled – pass them back as `details`; without it the card keeps the edits itself |
| `onEvidenceSelect` | `(evidence: ApprovalEvidence, index: number) => void` | Called when an evidence chip without `href` is pressed |

*Renamed or hidden on the wrapper: `children`, `heading`, `description`, `icon`, `details`, `preview`, `label`, `status`, `editable`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the preview's controls, “Always allow”, Stop, Edit, Deny and Approve |
| ⌘ Enter / Ctrl Enter | Approves, from anywhere in the card |
| Escape | Denies, from anywhere in the card – except inside the preview content or a text field |
| Space | On “Always allow”, ticks or clears it |
| Enter / Space | On “Edit arguments”, turns the text details into fields and focuses the first; on “Done”, turns them back |
| Escape | In an argument field, leaves “Edit arguments” (keeping the edits) and returns focus to its button – it doesn't deny |
| Tab, then arrow keys | The diff and the arguments are each one tab stop; the arrow keys scroll them |

### Screen readers

The card is a `group` named by the action and described by its context line and, while a countdown runs, by “Expires
in 42 seconds unless approved. The timer pauses while the card is hovered or focused.” Deny and Approve carry
`aria-keyshortcuts`. The risk reads as “High risk”. A status region says the decision – “Approved: Send campaign
email”, “Denied: …” or “Expired: …” – and, once only, “20 seconds left to decide: Send campaign email. Stop the timer
to keep it open.” While an approval is on its way the card is `aria-busy`; if it fails, an alert says
`errorLabel`. After a decision focus moves to the resolved row, which then names the group.

With `why`, the card is also described by the reason line. Each argument field is named by its row's label (“To”,
“Amount”), and an edited row says “Edited”. The evidence chips are a list labelled “Evidence”: links when they have an
`href` (opening in a new tab), buttons otherwise.

The diff is a region named “Changes: report.config.ts”; each changed line starts with “Added:” or “Removed:” – the
+ and − are hidden – and the counts read “1 added, 1 removed”. The arguments are a region named “Arguments”.

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
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 49.9 KB | 13.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **58.7 KB** | **16.3 KB** |
| With Lit – the first component on a page | 79.4 KB | 23.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.5 ms** | the gallery demo's data, 59 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of details replaced |
| First on the page | 30 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.1 ms | details: first render, 350 nodes; update 0.6 ms |
| 1,000 items | 24 ms | details: first render, 3,050 nodes; update 1.7 ms |

1,000 items of details: 24 ms, 3,050 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **0 timer callbacks/s** on screen, **0 timer callbacks/s** scrolled away, **0 timer callbacks/s** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`, `setTimeout`.
- 2 infinite CSS animations.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the heading as the action in plain words: “Send campaign email”, not the tool's name.
- Use `description` for the consequence: who is affected and how many.
- Put what someone must check in `details` – To, Subject, Amount, When – not everything the agent knows.
- Match `risk` to the harm if it goes wrong: `high` for what reaches customers or money, or can't be undone.
- Write `why` as the trigger, not the action again: “Refunds over $1,000 need a person – this one is $2,400.”
- Write each consequence as what actually happens next, including what can't be undone: “The email goes to 2,412
  contacts now. It can't be recalled.” – and for deny, what the agent does instead.
- Keep a diff to the lines that change and two or three around them; link to the full file elsewhere.
- Pass the arguments the call will actually run with, not a summary – that is what people are approving.
- Label evidence chips by what they are (“Invoice INV-2291”), with the type or age in `detail`.

## Do and don't

### Do

- Return a promise from `onApprove` – the card shows a spinner, and on failure stays pending with an error so people
  can try again.
- Give people enough time: a countdown under 30 seconds rarely is, and keep Stop available.
- Offer `editable` when the agent's draft can be changed before it runs.
- Use `editable-details` for short values a person might correct – a recipient, an amount, a date – and set
  `editable: false` on rows that must not change.
- Handle `tc-details-change` and run the action with the edited arguments, not the agent's originals.

### Don't

- Don't ask for approval of harmless actions – people learn to click Approve without reading.
- Don't hide the risk badge on high-risk actions to make the card calmer.
- Don't turn off `allow-stop-timer` unless the deadline is real and can't be extended.
- Don't fill `why` and `consequences` with boilerplate on every card – they lose their weight.

## Related

- [Approval Gates](approval-gates.md) – The approval requests of one agent run as a stack of cards – the one to decide now on top with who asks, the diff or arguments and the steps it holds; approve, reject or ask for changes with a note, and it drops into the decided list while the next rises
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Autonomy Dial](autonomy-dial.md) – How much an agent may do on its own – a three-stop dial, and its real actions gliding between “Runs on its own” and “Asks you first”, with a lock for what always asks
- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Tool Call Card](tool-call-card.md) – An agent's tool call in one line – live timer, status and summary, folds open to highlighted arguments and result with copy, retry on errors and a group that sums them up

## Changelog

- `tc-approval-card` gains decision detail: why you're seeing it, what each choice does, editable arguments and evidence chips.
