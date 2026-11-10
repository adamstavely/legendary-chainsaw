<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Handoff

**Agents** · New

The agent hands the task to you mid-run – what it did, why it stopped and what it needs – and takes it back when you're done

- **Element:** `<tc-handoff>`
- **Size:** 11.3 KB gzip · 43.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/handoff";` |
| React / Next.js | `import { Handoff } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/handoff";` · tags starting with tc- are custom elements |
| Angular | `import { Handoff } from "@adamstavely/trenchcoat/angular/handoff";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/handoff";` |

## Example

The live example is in the gallery at `#/handoff`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The moment an agent stops mid-run and hands the task to a person – to sign in, solve something it can't, or make a
call it shouldn't – and takes it back when they're done. The card says who stopped and why, what the agent did so
far and what it needs; “Take over” gives the person control, the needs become a checklist with a note for the
agent, and “Hand back” returns the task with what was done and what's still open. Afterwards it folds into one line,
“Back with Scout · 3 of 3 done”, with “Take over again”.

### When to use

- An agent hits something only a person can do – a one-time code, a CAPTCHA, a payment – and should wait, not fail.
- Handing a person the context they need to finish a step: what's done, what's left, where the agent stopped.
- Returning the person's work and notes to the agent, so it carries on from the right place.

### When not to use

- A yes or no on something the agent wants to do – use [Approval Card](approval-card.md).
- Allowing a tool or a scope before it runs – use [Permission Request](permission-request.md).
- Redirecting a running agent without stopping it – use [Agent Steering](agent-steering.md).
- Watching and taking over the agent's screen – use [Live View](live-view.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – a hand icon and “Handoff”, with the blocker pill at the right
2. **Blocker** `.ui-hand__pill` – why it stopped (“Sign-in required”); “Yours” once you have control
3. **Ask** `.ui-hand__head` – the agent's avatar, “Scout needs you to sign in to TAP Air” and the step and task
4. **Reason** `.ui-hand__why` – the agent's own words on why it stopped
5. **What I did** `.ui-hand__section[data-kind="done"]` – the steps so far, the first few then “2 more”
6. **What I need** `.ui-hand__section[data-kind="needs"]` – numbered while waiting, a checklist once you take over
7. **Main button** `.ui-hand__btn--primary` – “Take over”, then “Hand back to Scout”, with the ⌘↵ hint

## Looks

Standard puts the header on a gray tray, then the white card, then the main button on the tray below it. Clean is one
quiet white card with the header as its first row and the buttons in its last row under a hairline. Both fold to the same one-line result when the task is handed
back, and grow back when someone takes over again.

## Usage

### HTML

```html
<tc-handoff id="handoff" ask="sign in to TAP Air" blocker="Sign-in required" step="Step 4 of 7"></tc-handoff>

<script type="module">
  import "@adamstavely/trenchcoat/handoff";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#handoff");
  card.agent = { name: "Scout", model: "Claude Sonnet" };
  card.reason = "The airline texts a one-time code to the travel account's phone. I can't read it.";
  card.done = [{ id: "hold", label: "Held 6 seats on TP 1351", meta: "€1,284" }];
  card.needs = [{ id: "signin", label: "Sign in with the code sent to •• 42" }];
  card.addEventListener("tc-return", (e) => console.log(e.detail.checked, e.detail.open, e.detail.note));
</script>
```

### React / Next.js

```tsx
import { Handoff, type HandoffItem, type HandoffReturn } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const needs: HandoffItem[] = [{ id: "signin", label: "Sign in with the code sent to •• 42" }];

export function SignInHandoff({ resume }: { resume: (result: HandoffReturn) => void }) {
  return (
    <Handoff
      agent={{ name: "Scout", model: "Claude Sonnet" }}
      ask="sign in to TAP Air"
      blocker="Sign-in required"
      reason="The airline texts a one-time code to the travel account's phone. I can't read it."
      needs={needs}
      onReturn={resume}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/handoff";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";

defineProps<{ agent: TcHandoff["agent"]; done: TcHandoff["done"] }>();
const onStatusChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-handoff :agent="agent" :done="done" @tc-status-change="onStatusChange"></tc-handoff>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Handoff } from "@adamstavely/trenchcoat/angular/handoff";
import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";

@Component({
  selector: "app-handoff-example",
  imports: [Handoff],
  template: `<tc-handoff [agent]="agent()" [done]="done()" (tc-status-change)="onStatusChange($event)"></tc-handoff>`,
})
export class HandoffExample {
  readonly agent = input.required<TcHandoff["agent"]>();
  readonly done = input.required<TcHandoff["done"]>();
  onStatusChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/handoff";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";

  let { agent, done }: { agent: TcHandoff["agent"]; done: TcHandoff["done"] } = $props();
  let el: TcHandoff;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-handoff bind:this={el} {agent} {done}></tc-handoff>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `agent` | – | `HandoffAgent` | `{ name: "" }` | Who hands over |
| `ask` | `ask` | `string` | `""` | What it needs you to do, lower case after "needs you to", e.g. "sign in to Stripe" |
| `task` | `task` | `string \| undefined` | `undefined` | The run it belongs to, e.g. "Book flights to Lisbon" – shown under the heading |
| `step` | `step` | `string \| undefined` | `undefined` | Where in the run, e.g. "Step 4 of 7" |
| `blocker` | `blocker` | `string \| undefined` | `undefined` | Why it stopped, in a pill: "Sign-in required", "Needs a decision" |
| `reason` | `reason` | `string \| undefined` | `undefined` | The agent's own words on why it stopped |
| `done` | – | `HandoffItem[]` | `[]` | What it did so far |
| `needs` | – | `HandoffItem[]` | `[]` | What it needs from you – a checklist once you have control |
| `status` | `status` | `HandoffStatus` | `"waiting"` | Who has control |
| `checked` | – | `string[]` | `[]` | Ids of the needs ticked off |
| `note` | `note` | `string` | `""` | Your note for the agent, passed on when you hand back |
| `doneLimit` | `done-limit` | `number` | `3` | Done steps shown before "N more" |
| `doneTitle` | `done-title` | `string` | `"What I did"` | Heading of the list of what the agent did |
| `needsTitle` | `needs-title` | `string` | `"What I need from you"` | Heading of the list of what the agent needs – the checklist once you have control |
| `noteLabel` | `note-label` | `string` | `"Note for the agent"` | Label of the note field shown while you have control |
| `notePlaceholder` | `note-placeholder` | `string` | `"Anything it should know before it carries on"` | Placeholder of the note field |
| `shortcuts` | `shortcuts` | `boolean` | `true` | Show ⌘↵ hints on the main button (the shortcut works either way). Default true |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-status-change` | – | Yes | Take over, Hand back or Take over again ({ status, previous }: HandoffStatusChange); cancelable |
| `tc-checked-change` | – | Yes | A need was ticked or unticked ({ checked }: HandoffCheckedChange); cancelable |
| `tc-note-change` | – | Yes | The note for the agent changed ({ note }: HandoffNoteChange); cancelable |
| `tc-return` | – | No | Handed back, with what was done and the note ({ checked, open, note }: HandoffReturn) |

#### Design tokens it reads (114)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-weight`, `--tc-avatar-radius-agent`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-lg`, `--tc-control-px-md`, `--tc-control-radius-lg`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-14`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-8`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `agent` | `el.agent = …;` | `<… agent={…} />` | `<tc-handoff :agent="…">` | `<tc-handoff [agent]="…">` | `<tc-handoff {agent}>` |
| `done` | `el.done = …;` | `<… done={…} />` | `<tc-handoff :done="…">` | `<tc-handoff [done]="…">` | `<tc-handoff {done}>` |
| `needs` | `el.needs = …;` | `<… needs={…} />` | `<tc-handoff :needs="…">` | `<tc-handoff [needs]="…">` | `<tc-handoff {needs}>` |
| `checked` | `el.checked = …;` | `<… checked={…} />` | `<tc-handoff :checked="…">` | `<tc-handoff [checked]="…">` | `<tc-handoff {checked}>` |

*Also attributes: `ask`, `task`, `step`, `blocker`, `reason`, `status`, `note`, `done-limit` and 5 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `onStatusChange={…}` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-checked-change` | Yes | `el.addEventListener("tc-checked-change", (e) => …)` | `onCheckedChange={…}` | `@tc-checked-change="…"` | `(tc-checked-change)="…($event)"` | `el.addEventListener("tc-checked-change", …)` |
| `tc-note-change` | Yes | `el.addEventListener("tc-note-change", (e) => …)` | `onNoteChange={…}` | `@tc-note-change="…"` | `(tc-note-change)="…($event)"` | `el.addEventListener("tc-note-change", …)` |
| `tc-return` | No | `el.addEventListener("tc-return", (e) => …)` | `onReturn={…}` | `@tc-return="…"` | `(tc-return)="…($event)"` | `el.addEventListener("tc-return", …)` |

### Controlled

The element changes `status`, `checked` and `note` itself unless a listener calls `preventDefault()` on `tc-status-change`, `tc-checked-change` or `tc-note-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-handoff id="handoff"></tc-handoff>

<script type="module">
  import "@adamstavely/trenchcoat/handoff";

  const el = document.querySelector("#handoff");
  el.addEventListener("tc-status-change", (e) => {
    e.preventDefault(); // the element keeps its status…
    if (allowed(e.detail.status)) el.status = e.detail.status; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { Handoff } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof Handoff>;
type Props = Omit<Own, "status" | "onStatusChange"> & { initial: NonNullable<Own["status"]> };

// Controlled: passing status makes the wrapper prevent the element's own change; the app sets it
export function ControlledHandoff({ initial, ...props }: Props) {
  const [status, setStatus] = useState<Own["status"]>(initial);
  return <Handoff {...props} status={status} onStatusChange={(next) => setStatus(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/handoff";
import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";

const props = defineProps<{ initial: TcHandoff["status"] }>();
const status = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStatusChange = (e: CustomEvent<{ status: TcHandoff["status"] }>) => {
  e.preventDefault();
  status.value = e.detail.status;
};
</script>

<template>
  <tc-handoff :status="status" @tc-status-change="onStatusChange"></tc-handoff>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Handoff } from "@adamstavely/trenchcoat/angular/handoff";
import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";

@Component({
  selector: "app-controlled-handoff",
  imports: [Handoff],
  template: `<tc-handoff [status]="status()" (tc-status-change)="onStatusChange($event)"></tc-handoff>`,
})
export class ControlledHandoff {
  readonly initial = input.required<TcHandoff["status"]>();
  readonly status = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStatusChange(e: CustomEvent<{ status: TcHandoff["status"] }>) {
    e.preventDefault();
    this.status.set(e.detail.status);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/handoff";
  import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";

  let { initial }: { initial: TcHandoff["status"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let status = $derived(initial);
  let el: TcHandoff;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      status = (e as CustomEvent<{ status: TcHandoff["status"] }>).detail.status;
    };
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-handoff bind:this={el} {status}></tc-handoff>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-handoff")` returns a `TcHandoff` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";`
- **React / Next.js:** Props: `import type { HandoffProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Handoff>`. The element class, for refs: `import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHandoff["agent"]` with `import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";`
- **Angular:** The directive types the template: `[agent]` takes `TcHandoff["agent"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHandoff } from "@adamstavely/trenchcoat/handoff";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `agent` | `{ name: string; model?: string; avatar?: React.ReactNode }` | Who hands over: { name, model?, avatar? } |
| `status` | `HandoffStatus` | Who has control – controlled when given |
| `defaultStatus` | `HandoffStatus` | Who has control at first, when `status` isn't set – "waiting" by default |
| `onStatusChange` | `(status: HandoffStatus) => void` | Take over, Hand back, Take over again |
| `checked` | `string[]` | Ids of the needs ticked off – controlled when given |
| `defaultChecked` | `string[]` | The needs ticked off at first, when `checked` isn't set |
| `onCheckedChange` | `(checked: string[]) => void` | Called with the ids of the ticked needs, in the needs' order, whenever one is ticked or unticked |
| `note` | `string` | The note for the agent – controlled when given |
| `defaultNote` | `string` | The note at first, when `note` isn't set |
| `onNoteChange` | `(note: string) => void` | Called with the note as it is typed |
| `onReturn` | `(result: HandoffReturn) => void` | Handed back: what was done, what's still open and the note – the agent should listen to this |

*Renamed or hidden on the wrapper: `agent`, `status`, `checked`, `defaultChecked`, `note`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| ⌘ Enter / Ctrl Enter | Anywhere in the card: takes over while waiting, hands back while you have control |
| Space | On a need: ticks it off or unticks it |
| Tab | Moves through “2 more”, the checklist, the note and the main button |

Taking over moves focus to the first need that's still open; handing back moves it to “Take over again”.

### Screen readers

The component is a group named by its heading – “Scout needs you to sign in to TAP Air”, “You have control · sign in
to TAP Air”, or “Back with Scout · sign in to TAP Air” once returned – and described by the reason. Each list is a
section labelled by its title. A status region announces each change: “You have control. Scout is paused.”,
“Handed back to Scout.” and, when it goes back to waiting, “Scout needs you to sign in to TAP Air.” While you have
control, Hand back is described by “2 still open – Scout will see which” (or “All done”). The main button carries
`aria-keyshortcuts`; “2 more” has `aria-expanded`.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 34.9 KB | 8.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **43.5 KB** | **11.3 KB** |
| With Lit – the first component on a page | 65.9 KB | 18.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 62 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of needs replaced |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.7 ms | needs: first render, 450 nodes; update 0.3 ms |
| 1,000 items | 33 ms | needs: first render, 4,050 nodes; update 2.2 ms |

1,000 items of needs: 33 ms, 4,050 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `ask` lower case, as the end of “Scout needs you to …”: “sign in to TAP Air”, “approve the refund”.
- Keep `blocker` to two or three words: “Sign-in required”, “Needs a decision”.
- Let `reason` be the agent's own words, in the first person, with what it can't or shouldn't do.
- Write `needs` as actions the person can tick off: “Sign in with the code sent to •• 42”.
- Use `meta` for one quiet fact per line – “14 fares”, “€1,284”.

## Do and don't

### Do

- Listen to `tc-return` (`onReturn`) – it carries what was done, what's still open and the note, for the agent to
  pick up.
- Pass the steps in `done` as they happen, so the card already shows the run's progress when it stops.
- Show `step` and `task`, so people who come back later know which run this is.

### Don't

- Don't use it for anything the agent could do itself – each hand-off costs a person's attention.
- Don't list more than three or four needs; a long list means the agent should have stopped sooner.
- Don't hide the shortcut hints in an app that has no other shortcuts – people won't guess ⌘↵.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Agent Steering](agent-steering.md) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away
- [Live View](live-view.md) – Watch the agent's screen as it works – its clicks and typing drawn on top, a caption for each step, and Pause or Take over at any moment

## Changelog

- `tc-handoff` – the agent hands the task to a person: what it did, why it stopped, what it needs; Take over turns the needs into a checklist with a note, Hand back folds it to one line. ⌘/Ctrl+Enter; `tc-status-change`, `tc-checked-change`, `tc-note-change`, `tc-return`.
