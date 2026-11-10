<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Permission Request

**Agents**

An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke

- **Element:** `<tc-permission-request>`
- **Size:** 14.0 KB gzip · 55.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/permission-request";` |
| React / Next.js | `import { PermissionRequest } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/permission-request";` · tags starting with tc- are custom elements |
| Angular | `import { PermissionRequest } from "@adamstavely/trenchcoat/angular/permission-request";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/permission-request";` |

## Example

The live example is in the gallery at `#/permission-request`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An agent asks for one specific right before it acts: who is asking, what for (“Coder wants to push to main”), where,
why in the agent's own words, and exactly what will happen – the files, recipients or amounts. The person picks how
long the right holds – just once, for a while or always – and allows or denies it. The card then folds into one line
that says what was decided; a timed right shows the time left and a bar that drains until it expires, with Revoke to
take it back early. Destructive actions can never be allowed for always.

For the moment when waiting for the usual approval would do more harm, an emergency scope can be offered. Picking
it asks why it can't wait – required – and how urgent it is, from windows the app supplies. The request goes to the
app as a cancelable event carrying the justification; once granted, the card becomes a banner that says emergency
access is active with the time left as the app reports it, and when the app says it has ended, when the review is due.

### When to use

- An agent needs a right it doesn't have yet – pushing to a branch, sending email, spending money, deleting data.
- The person should see the concrete effect before saying yes, and decide how long the yes lasts.
- Inline in a run or a chat, where the request sits next to what the agent was doing.
- Emergency access, where the normal approval can't happen in time and the use must be justified, time-boxed and
  reviewed afterwards – list `"emergency"` in `scopes`.

### When not to use

- Reviewing a finished piece of work or a plan before it goes ahead – use [Approval Card](approval-card.md).
- Setting up in advance which agent may use which tools – use [Tool Permissions](tool-permissions.md).
- The agent is stuck and needs a person to take over – use [Handoff](handoff.md).
- Asking to spend past a limit on a running job – use [Budget Guard](budget-guard.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a key icon and “Permission”, with the risk pill at the right
2. **Request** `.ui-pr__head` – the agent's avatar, “who wants to do what” and the target
3. **Reason** `.ui-pr__why` – why the agent needs it, in its own words
4. **Preview** `.ui-pr__preview` – what will happen, with a count and “N more”
5. **How long** `.ui-pr__scopes` – just once, for a while or always
6. **Answer** `.ui-pr__buttons` – Deny and Allow, with their keys

## Looks

Standard puts the header on a gray tray and the request on a white card below it, with the answer on the tray under that; the scope picker is a
segmented track with the chosen option raised in white, and the buttons are large. Clean is one quiet white card
with the header as its first row, smaller and lighter: the title is in the secondary colour with the names in strong text, the scopes are separate
chips and the buttons are medium. Both fold to the same one-line result, with a thin draining bar for a timed right. Emergency access sits in a white card on the tray in Standard and a hairline box in Clean; once granted, the result turns into a banner on the warning tone in both.

## Usage

### HTML

```html
<tc-permission-request id="push" action="push to main" target="acme/web" risk="risky" duration="60"></tc-permission-request>

<script type="module">
  import "@adamstavely/trenchcoat/permission-request";
  import "@adamstavely/trenchcoat/tokens.css";

  const request = document.querySelector("#push");
  request.agent = { name: "Coder", model: "Claude Sonnet" };
  request.reason = "The checkout fix passed all 214 tests on the branch.";
  request.previewTitle = "2 files will change";
  request.preview = [
    { id: "1", label: "src/checkout/payment.ts", meta: "+48 −12" },
    { id: "2", label: "src/checkout/payment.test.ts", meta: "+96" },
  ];
  request.addEventListener("tc-decision-change", (e) => console.log(e.detail.decision));

  // Emergency access: offer it, hear the request, report the time left
  request.scopes = ["once", "timed", "emergency"];
  request.reviewDue = "within 5 working days";
  request.addEventListener("tc-emergency-request", (e) => {
    fetch("/api/break-glass", { method: "POST", body: JSON.stringify({ why: e.detail.justification, urgency: e.detail.urgency?.id }) });
  });
</script>
```

### React / Next.js

```tsx
import { PermissionRequest, type PermissionDecision, type PermissionEmergencyRequest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function PushRequest({
  onDecide,
  onEmergency,
  timeLeft,
}: {
  onDecide: (d: PermissionDecision | null) => void;
  onEmergency: (r: PermissionEmergencyRequest) => void;
  /** As the server reports it, e.g. "42 min" – empty until access is granted */
  timeLeft: string;
}) {
  return (
    <PermissionRequest
      agent={{ name: "Coder", model: "Claude Sonnet" }}
      action="push to main"
      target="acme/web"
      risk="risky"
      reason="The checkout fix passed all 214 tests on the branch."
      previewTitle="2 files will change"
      preview={[
        { id: "1", label: "src/checkout/payment.ts", meta: "+48 −12" },
        { id: "2", label: "src/checkout/payment.test.ts", meta: "+96" },
      ]}
      scopes={["once", "timed", "emergency"]}
      defaultScope="timed"
      duration={60}
      onDecisionChange={onDecide}
      onEmergencyRequest={onEmergency}
      emergencyRemaining={timeLeft}
      reviewDue="within 5 working days"
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/permission-request";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";

defineProps<{ agent: TcPermissionRequest["agent"]; toolIcon: TcPermissionRequest["toolIcon"] }>();
const onDecisionChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-permission-request :agent="agent" :toolIcon="toolIcon" @tc-decision-change="onDecisionChange"></tc-permission-request>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PermissionRequest } from "@adamstavely/trenchcoat/angular/permission-request";
import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";

@Component({
  selector: "app-permission-request-example",
  imports: [PermissionRequest],
  template: `<tc-permission-request [agent]="agent()" [toolIcon]="toolIcon()" (tc-decision-change)="onDecisionChange($event)"></tc-permission-request>`,
})
export class PermissionRequestExample {
  readonly agent = input.required<TcPermissionRequest["agent"]>();
  readonly toolIcon = input.required<TcPermissionRequest["toolIcon"]>();
  onDecisionChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/permission-request";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";

  let { agent, toolIcon }: { agent: TcPermissionRequest["agent"]; toolIcon: TcPermissionRequest["toolIcon"] } = $props();
  let el: TcPermissionRequest;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-decision-change", on);
    return () => el.removeEventListener("tc-decision-change", on);
  });
</script>

<tc-permission-request bind:this={el} {agent} {toolIcon}></tc-permission-request>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agent` | – | `PermissionAgent` | `{ name: "" }` | Who asks |
| `action` | `action` | `string` | `""` | What it wants to do, lower case after "wants to", e.g. "push to main" |
| `target` | `target` | `string \| undefined` | `undefined` | Where, e.g. "acme/web" – shown with the tool's mark |
| `toolIcon` | – | `Element \| undefined` | `undefined` | The tool's mark next to the target (cloned) |
| `risk` | `risk` | `PermissionRisk` | `"risky"` | How much harm the action can do: safe shows no pill, risky a warning, destructive a danger pill and no "always" |
| `reason` | `reason` | `string \| undefined` | `undefined` | The agent's own words on why it needs this |
| `preview` | – | `PermissionPreviewItem[]` | `[]` | What will happen if you allow it – files, recipients, amounts |
| `previewTitle` | `preview-title` | `string` | `"What will happen"` | The heading over the preview list, e.g. "5 files will change" |
| `previewLimit` | `preview-limit` | `number` | `3` | Rows shown before "N more" |
| `scopes` | – | `PermissionScope[]` | `["once", "timed", "always"]` | The choices offered; "always" is never offered for destructive actions, "emergency" only when listed here |
| `scope` | `scope` | `PermissionScope` | `"once"` | How long an Allow holds |
| `duration` | `duration` | `number` | `60` | Minutes a timed right holds |
| `decision` | – | `PermissionDecision \| null` | `null` | The decision – null while it waits |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for the countdown, epoch ms – unset uses an internal clock |
| `urgencies` | – | `PermissionUrgency[]` | `[ { id: "standard", label: "Standard", window: "30 min" }, { id: "urgent", label: "Urgent", window: "15 min" }, { id: "critical", label: "Critical", window: "5 min" }, ]` | Emergency access: the urgency windows to pick from, as data |
| `emergencyNote` | `emergency-note` | `string` | `"Emergency access is logged, time-limited and reviewed afterwards."` | Emergency access: what it means, said above the justification |
| `emergencyRemaining` | `emergency-remaining` | `string` | `""` | Emergency access: the time left as the app reports it, e.g. "3 h 12 min" – shown in the banner, never computed here |
| `emergencyEnded` | `emergency-ended` | `boolean` | `false` | Emergency access: the app says it has ended – the banner turns into the review-due note |
| `reviewDue` | `review-due` | `string` | `""` | Emergency access: when the review afterwards is due, as text, e.g. "by Fri 31 Oct" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-decision-change` | – | Yes | Allow, Deny or Revoke ({ decision: PermissionDecision \| null }); cancelable |
| `tc-scope-change` | – | Yes | The user picked how long ({ scope: PermissionScope }); cancelable |
| `tc-expire` | – | No | A timed right ran out, once per decision ({ decision: PermissionDecision }) |
| `tc-emergency-request` | – | Yes | Emergency access was asked for, with a justification ({ justification, urgency, decision }: PermissionEmergencyRequest); cancelable – prevented, nothing is granted |

#### Design tokens it reads (129)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-weight`, `--tc-avatar-radius-agent`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-lg`, `--tc-control-px-md`, `--tc-control-radius-lg`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `agent` | `el.agent = …;` | `<… agent={…} />` | `<tc-permission-request :agent="…">` | `<tc-permission-request [agent]="…">` | `<tc-permission-request {agent}>` |
| `toolIcon` | `el.toolIcon = …;` | `<… toolIcon={…} />` | `<tc-permission-request :toolIcon="…">` | `<tc-permission-request [toolIcon]="…">` | `<tc-permission-request {toolIcon}>` |
| `preview` | `el.preview = …;` | `<… preview={…} />` | `<tc-permission-request :preview="…">` | `<tc-permission-request [preview]="…">` | `<tc-permission-request {preview}>` |
| `scopes` | `el.scopes = …;` | `<… scopes={…} />` | `<tc-permission-request :scopes="…">` | `<tc-permission-request [scopes]="…">` | `<tc-permission-request {scopes}>` |
| `decision` | `el.decision = …;` | `<… decision={…} />` | `<tc-permission-request :decision="…">` | `<tc-permission-request [decision]="…">` | `<tc-permission-request {decision}>` |
| `urgencies` | `el.urgencies = …;` | `<… urgencies={…} />` | `<tc-permission-request :urgencies="…">` | `<tc-permission-request [urgencies]="…">` | `<tc-permission-request {urgencies}>` |

*Also attributes: `action`, `target`, `risk`, `reason`, `preview-title`, `preview-limit`, `scope`, `duration` and 5 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-decision-change` | Yes | `el.addEventListener("tc-decision-change", (e) => …)` | `ref.current.addEventListener("tc-decision-change", …)` | `@tc-decision-change="…"` | `(tc-decision-change)="…($event)"` | `el.addEventListener("tc-decision-change", …)` |
| `tc-scope-change` | Yes | `el.addEventListener("tc-scope-change", (e) => …)` | `ref.current.addEventListener("tc-scope-change", …)` | `@tc-scope-change="…"` | `(tc-scope-change)="…($event)"` | `el.addEventListener("tc-scope-change", …)` |
| `tc-expire` | No | `el.addEventListener("tc-expire", (e) => …)` | `onExpire={…}` | `@tc-expire="…"` | `(tc-expire)="…($event)"` | `el.addEventListener("tc-expire", …)` |
| `tc-emergency-request` | Yes | `el.addEventListener("tc-emergency-request", (e) => …)` | `onEmergencyRequest={…}` | `@tc-emergency-request="…"` | `(tc-emergency-request)="…($event)"` | `el.addEventListener("tc-emergency-request", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `scope` and `decision` itself unless a listener calls `preventDefault()` on `tc-scope-change` or `tc-decision-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-permission-request id="permission-request"></tc-permission-request>

<script type="module">
  import "@adamstavely/trenchcoat/permission-request";

  const el = document.querySelector("#permission-request");
  el.addEventListener("tc-scope-change", (e) => {
    e.preventDefault(); // the element keeps its scope…
    if (allowed(e.detail.scope)) el.scope = e.detail.scope; // …until the app sets it
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
import "@adamstavely/trenchcoat/permission-request";
import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";

const props = defineProps<{ initial: TcPermissionRequest["scope"] }>();
const scope = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onScopeChange = (e: CustomEvent<{ scope: TcPermissionRequest["scope"] }>) => {
  e.preventDefault();
  scope.value = e.detail.scope;
};
</script>

<template>
  <tc-permission-request :scope="scope" @tc-scope-change="onScopeChange"></tc-permission-request>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PermissionRequest } from "@adamstavely/trenchcoat/angular/permission-request";
import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";

@Component({
  selector: "app-controlled-permission-request",
  imports: [PermissionRequest],
  template: `<tc-permission-request [scope]="scope()" (tc-scope-change)="onScopeChange($event)"></tc-permission-request>`,
})
export class ControlledPermissionRequest {
  readonly initial = input.required<TcPermissionRequest["scope"]>();
  readonly scope = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onScopeChange(e: CustomEvent<{ scope: TcPermissionRequest["scope"] }>) {
    e.preventDefault();
    this.scope.set(e.detail.scope);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/permission-request";
  import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";

  let { initial }: { initial: TcPermissionRequest["scope"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let scope = $derived(initial);
  let el: TcPermissionRequest;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      scope = (e as CustomEvent<{ scope: TcPermissionRequest["scope"] }>).detail.scope;
    };
    el.addEventListener("tc-scope-change", on);
    return () => el.removeEventListener("tc-scope-change", on);
  });
</script>

<tc-permission-request bind:this={el} {scope}></tc-permission-request>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-permission-request")` returns a `TcPermissionRequest` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";`
- **React / Next.js:** Props: `import type { PermissionRequestProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PermissionRequest>`. The element class, for refs: `import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPermissionRequest["agent"]` with `import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";`
- **Angular:** The directive types the template: `[agent]` takes `TcPermissionRequest["agent"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPermissionRequest } from "@adamstavely/trenchcoat/permission-request";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `agent` | `{ name: string; model?: string; avatar?: React.ReactNode }` | Who asks: { name, model?, avatar? } |
| `toolIcon` | `React.ReactNode` | The tool's mark next to the target |
| `preview` | `PermissionPreviewItem[]` | What will happen if you allow it – files, recipients, amounts |
| `scope` | `PermissionScope` | Controlled choice of how long |
| `defaultScope` | `PermissionScope` | The starting choice of how long, when `scope` isn't controlled |
| `onScopeChange` | `(scope: PermissionScope) => void` | The user picked how long |
| `decision` | `PermissionDecision \| null` | Controlled decision – null while it waits |
| `defaultDecision` | `PermissionDecision \| null` | The starting decision, when `decision` isn't controlled |
| `onDecisionChange` | `(decision: PermissionDecision \| null) => void` | Allow, Deny, Revoke (null) – the agent should listen to this |
| `onExpire` | `(decision: PermissionDecision) => void` | Fires once when a timed right runs out (the decision stays, shown as "Access expired") |
| `onEmergencyRequest` | `(request: PermissionEmergencyRequest) => boolean \| void` | Emergency access was asked for, with its justification and urgency; return false to refuse it, so nothing is granted |

*Renamed or hidden on the wrapper: `agent`, `toolIcon`, `preview`, `scope`, `decision`*

## Accessibility

Follows the WAI-ARIA [Radio group pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between “N more”, the chosen scope, Deny and Allow |
| ← / → | In the scopes: picks the previous or next one, wrapping round |
| Enter | Allows, when focus is in the card but not on a button; on a button, presses it |
| Escape | Denies, from anywhere in the card while it waits |
| Space / Enter | On a button: Deny, Allow, Revoke, Change or “N more” |
| ← / → / ↑ / ↓ | In the urgency windows (emergency access): picks the previous or next one, wrapping round |
| Enter (in the justification) | Starts a new line; it never sends the request |

After a decision, focus moves to the result's button (Revoke, Change, End now or Ask again); after Revoke it moves
back to Allow. Requesting emergency access without a justification moves focus to the justification field.

### Screen readers

While it waits, the card is a group named by the request (“Coder wants to push to main”) and described by the reason.
The preview is a section labelled by its heading. The scopes are a radiogroup named “How long”, each option a radio
with `aria-checked`; “N more” has `aria-expanded`. A status region says each outcome once – “Allowed for 1 hour:
Coder may push to main”, “Denied: Coder may not push to main”, “Access expired: Coder may not push to main” – and
the countdown's minutes are not announced. The risk is a visible word (“Risky”, “Destructive”) as well as a colour.

Emergency access is a group named by its note. The justification is a labelled, `aria-required` text area (“Why
can't this wait?”); asked for without one, it becomes `aria-invalid` and is described by “Say why it can't wait to
ask for emergency access”. The urgency windows are a radiogroup named “How urgent”. Granted, the status region says
“Emergency access active: Ops agent may restore the orders database”, and once ended, “Emergency access ended: … .
Review due by Fri 31 Oct”. The time left is on screen, not announced, as with the timed countdown.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| field-sizing | 123 | 152 | 26.2 | 26.2 | itself | Text fields grow with their text. Without it they keep their minimum height and scroll. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 46.7 KB | 11.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **55.1 KB** | **14.1 KB** |
| With Lit – the first component on a page | 77.8 KB | 21.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 68 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of preview replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.1 ms | preview: first render, 68 nodes; update 0.1 ms |
| 1,000 items | 1.0 ms | preview: first render, 68 nodes; update 0.3 ms |

What it renders doesn't grow with preview (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 21 React commits (clean), 21 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setInterval, cleared`.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver`, `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document visibilitychange`.
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `action` in lower case so it reads after “wants to”: “push to main”, “send 3 emails”, “refund $240.00”.
- Let `reason` be the agent's own explanation in one or two sentences – what it found and why this step helps.
- Make preview rows concrete: file paths with “+48 −12”, recipients, amounts. Title the list with the count:
  “5 files will change”.
- Use `target` for where it happens (“acme/web”); without it, the agent's model shows there.
- For emergency access, name the urgency windows in your own policy's words through `urgencies` (`{ id, label,
  window }` – “Urgent”, “15 min”), and say what emergency access means where you work in `emergencyNote`.
- Pass `emergencyRemaining` as your server reports it (“3 h 12 min”), and `reviewDue` as a phrase that reads after
  “Review due”: “by Fri 31 Oct”, “within 5 working days”.

## Do and don't

### Do

- Set `risk` honestly: `destructive` for anything that can't be undone – it removes “always” and turns Allow red.
- Listen to `tc-decision-change` and only let the agent act once it says allow; listen to `tc-expire` to stop it
  when a timed right runs out.
- Pass `now` when the page owns the clock (server time, a test, a replay); otherwise the element keeps its own.
- Listen to `tc-emergency-request` to log the justification, notify whoever must know and start the clock on your
  server; call `preventDefault()` to refuse it. Set `emergencyEnded` when your server ends the access.

### Don't

- Don't ask for several rights in one card – one request, one card.
- Don't leave the preview empty for a risky or destructive action; people need to see what changes.
- Don't offer `always` for anything that spends money or sends messages on someone's behalf.
- Don't offer the emergency scope by default – only where a real break-glass policy stands behind it, with a review.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Handoff](handoff.md) – The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done
- [Budget Guard](budget-guard.md) – Spend and token limits for a live run – progress against the cap, a warning as it nears it, a hard stop at it, and raising the cap right from the warning
