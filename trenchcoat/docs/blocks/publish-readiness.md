<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Publish Readiness

**Blocks** · New

What must pass before something is released – a summary card that opens a dialog with the checks as a progress tracker, sign-offs to give, and each blocker linked (uses `@adamstavely/trenchcoat/react`: `dialog`, `progress-tracker`, `button`)

- **Element:** `<tc-publish-readiness>`
- **Size:** 21.0 KB gzip · 81.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/publish-readiness";` |
| React / Next.js | `import { PublishReadiness } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/publish-readiness";` · tags starting with tc- are custom elements |
| Angular | `import { PublishReadiness } from "@adamstavely/trenchcoat/angular/publish-readiness";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/publish-readiness";` |

## Example

The live example is in the gallery at `#/blocks/publish-readiness`, in both looks; Replay restarts its animations.

## Overview

What must pass before something is released. A summary card names what's being released and its version, shows one
tick per check coloured by its state, says how many checks have passed and what's still in the way – blockers, or
sign-offs to give – and opens a dialog that walks through every check. In the dialog, the library's Progress Tracker
lists the checks: sign-offs the person gives are ticked by hand, automated checks are read-only rows that pass, fail
or run later. Each failing check lists the blockers behind it, every blocker a link the page opens. Checks that run
later, a note on who approves, and the publish action follow; the action stays off while anything blocks.

### When to use

- Releasing a workflow, prompt, model or document version that has to pass checks first.
- Gathering the sign-offs a release needs in one place.
- Showing why something can't be published yet, and where to fix it.

### When not to use

- Where work stands in a fixed sequence of steps – use [Status Tracker](../components/status-tracker.md).
- A single approve-or-reject decision – use [Approval Card](../components/approval-card.md).
- An onboarding checklist with nothing to release – use [Progress Tracker](../components/progress-tracker.md).

## Anatomy

1. **Card** `.ui-prd__card` – the summary, with the shared header and a status pill
2. **Meter** `.ui-prd__meter` – one tick per check: passed, failed, or still to run
3. **Summary** `.ui-prd__summary` – checks passed and what's in the way
4. **Dialog** `.ui-prd__dialog` – the checks, the status line and what follows
5. **Blockers** `.ui-prd__blockers` – each failing check with its blockers
6. **Blocker link** `.ui-prd__link` – opens the place a blocker points at
7. **Later** `.ui-prd__later` – checks that run during approval
8. **Note** `.ui-prd__note` – who approves and what happens next

## Looks

Standard puts the summary's header on a gray tray above a white card. Clean is one white card with the header as its
first row. The dialog, its tracker and its buttons follow the same look.

## Usage

### HTML

```html
<tc-publish-readiness id="release" subject="Weekly digest" version="v1.3" description="Summarises the week's tickets"></tc-publish-readiness>

<script type="module">
  import "@adamstavely/trenchcoat/publish-readiness";
  import "@adamstavely/trenchcoat/tokens.css";

  const release = document.querySelector("#release");
  release.checks = [
    { id: "spec", label: "Spec is valid", state: "passed" },
    { id: "test", label: "Test run passed", state: "failed", blockers: [{ id: "b1", label: "Step 6 timed out", where: "Run 7f2c" }] },
    { id: "owner", label: "Owner signs off", state: "manual" },
  ];
  release.addEventListener("tc-open-blocker", (e) => console.log(e.detail.blocker.id));
  release.addEventListener("tc-confirmed-change", (e) => console.log(e.detail.confirmed));
  release.addEventListener("tc-publish", () => console.log("publish"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PublishReadiness, type ReadinessCheck } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const checks: ReadinessCheck[] = [
  { id: "spec", label: "Spec is valid", state: "passed" },
  { id: "test", label: "Test run passed", state: "failed", blockers: [{ id: "b1", label: "Step 6 timed out", where: "Run 7f2c" }] },
  { id: "owner", label: "Owner signs off", state: "manual" },
];

export function Release() {
  const [confirmed, setConfirmed] = useState<string[]>([]);
  return (
    <PublishReadiness
      subject="Weekly digest"
      version="v1.3"
      checks={checks}
      confirmed={confirmed}
      onConfirmedChange={setConfirmed}
      onOpenBlocker={(blocker) => console.log(blocker.id)}
      onPublish={() => console.log("publish")}
      note="The workflow's owner approves."
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/publish-readiness";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";

defineProps<{ checks: TcPublishReadiness["checks"]; confirmed: TcPublishReadiness["confirmed"] }>();
const onConfirmedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-publish-readiness :checks="checks" :confirmed="confirmed" @tc-confirmed-change="onConfirmedChange"></tc-publish-readiness>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PublishReadiness } from "@adamstavely/trenchcoat/angular/publish-readiness";
import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";

@Component({
  selector: "app-publish-readiness-example",
  imports: [PublishReadiness],
  template: `<tc-publish-readiness [checks]="checks()" [confirmed]="confirmed()" (tc-confirmed-change)="onConfirmedChange($event)"></tc-publish-readiness>`,
})
export class PublishReadinessExample {
  readonly checks = input.required<TcPublishReadiness["checks"]>();
  readonly confirmed = input.required<TcPublishReadiness["confirmed"]>();
  onConfirmedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/publish-readiness";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";

  let { checks, confirmed }: { checks: TcPublishReadiness["checks"]; confirmed: TcPublishReadiness["confirmed"] } = $props();
  let el: TcPublishReadiness;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-confirmed-change", on);
    return () => el.removeEventListener("tc-confirmed-change", on);
  });
</script>

<tc-publish-readiness bind:this={el} {checks} {confirmed}></tc-publish-readiness>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `subject` | `subject` | `string` | `""` | What is being released, e.g. "Daily briefing" |
| `version` | `version` | `string \| undefined` | `undefined` | Its version, e.g. "v1.3" |
| `checks` | – | `ReadinessCheck[]` | `[]` | The checks, in order |
| `confirmed` | – | `string[]` | `[]` | Ids of the manual checks the person has signed off |
| `open` | `open` | `boolean` | `false` | Whether the dialog is open |
| `heading` | `heading` | `string` | `"Ready to publish?"` | The dialog's heading |
| `description` | `description` | `string \| Element \| undefined` | `undefined` | The line under the summary's title – text, or an element (cloned) |
| `note` | `note` | `string \| Element \| undefined` | `undefined` | Who approves and what happens next – a note above the action: text, or an element (cloned) |
| `publishLabel` | `publish-label` | `string` | `"Submit for approval"` | The action's label |
| `publishDisabled` | `publish-disabled` | `boolean` | `false` | Keep the publish action off even when ready – nothing to publish to yet |
| `plainBlockers` | `plain-blockers` | `boolean` | `false` | Show blockers as plain text instead of links (nothing opens them) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-confirmed-change` | – | Yes | A sign-off was given or withdrawn ({ confirmed }: ReadinessConfirmedChange – every signed-off id); cancelable – prevented, `confirmed` stays |
| `tc-open-change` | – | Yes | The dialog opens or closes ({ open }: ReadinessOpenChange); cancelable – prevented, `open` stays |
| `tc-open-blocker` | – | No | A blocker's link was followed – open the place it points at ({ blocker, check }: ReadinessOpenBlocker) |
| `tc-publish` | – | No | The publish action was pressed, with nothing blocking; detail: null |

#### Design tokens it reads (66)

`--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-base`, `--tc-ease-standard`, `--tc-eyebrow-color`, `--tc-eyebrow-font-size`, `--tc-eyebrow-font-weight`, `--tc-eyebrow-line-height`, `--tc-eyebrow-tracking`, `--tc-eyebrow-transform`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `checks` | `el.checks = …;` | `<… checks={…} />` | `<tc-publish-readiness :checks="…">` | `<tc-publish-readiness [checks]="…">` | `<tc-publish-readiness {checks}>` |
| `confirmed` | `el.confirmed = …;` | `<… confirmed={…} />` | `<tc-publish-readiness :confirmed="…">` | `<tc-publish-readiness [confirmed]="…">` | `<tc-publish-readiness {confirmed}>` |

*Also attributes: `subject`, `version`, `open`, `heading`, `description`, `note`, `publish-label`, `publish-disabled` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-confirmed-change` | Yes | `el.addEventListener("tc-confirmed-change", (e) => …)` | `onConfirmedChange={…}` | `@tc-confirmed-change="…"` | `(tc-confirmed-change)="…($event)"` | `el.addEventListener("tc-confirmed-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-open-blocker` | No | `el.addEventListener("tc-open-blocker", (e) => …)` | `onOpenBlocker={…}` | `@tc-open-blocker="…"` | `(tc-open-blocker)="…($event)"` | `el.addEventListener("tc-open-blocker", …)` |
| `tc-publish` | No | `el.addEventListener("tc-publish", (e) => …)` | `onPublish={…}` | `@tc-publish="…"` | `(tc-publish)="…($event)"` | `el.addEventListener("tc-publish", …)` |

### Controlled

The element changes `confirmed` and `open` itself unless a listener calls `preventDefault()` on `tc-confirmed-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-publish-readiness id="publish-readiness"></tc-publish-readiness>

<script type="module">
  import "@adamstavely/trenchcoat/publish-readiness";

  const el = document.querySelector("#publish-readiness");
  el.addEventListener("tc-confirmed-change", (e) => {
    e.preventDefault(); // the element keeps its confirmed…
    if (allowed(e.detail.confirmed)) el.confirmed = e.detail.confirmed; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { PublishReadiness } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof PublishReadiness>;
type Props = Omit<Own, "confirmed" | "onConfirmedChange"> & { initial: NonNullable<Own["confirmed"]> };

// Controlled: passing confirmed makes the wrapper prevent the element's own change; the app sets it
export function ControlledPublishReadiness({ initial, ...props }: Props) {
  const [confirmed, setConfirmed] = useState<Own["confirmed"]>(initial);
  return <PublishReadiness {...props} confirmed={confirmed} onConfirmedChange={(next) => setConfirmed(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/publish-readiness";
import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";

const props = defineProps<{ initial: TcPublishReadiness["confirmed"] }>();
const confirmed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onConfirmedChange = (e: CustomEvent<{ confirmed: TcPublishReadiness["confirmed"] }>) => {
  e.preventDefault();
  confirmed.value = e.detail.confirmed;
};
</script>

<template>
  <tc-publish-readiness :confirmed="confirmed" @tc-confirmed-change="onConfirmedChange"></tc-publish-readiness>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PublishReadiness } from "@adamstavely/trenchcoat/angular/publish-readiness";
import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";

@Component({
  selector: "app-controlled-publish-readiness",
  imports: [PublishReadiness],
  template: `<tc-publish-readiness [confirmed]="confirmed()" (tc-confirmed-change)="onConfirmedChange($event)"></tc-publish-readiness>`,
})
export class ControlledPublishReadiness {
  readonly initial = input.required<TcPublishReadiness["confirmed"]>();
  readonly confirmed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onConfirmedChange(e: CustomEvent<{ confirmed: TcPublishReadiness["confirmed"] }>) {
    e.preventDefault();
    this.confirmed.set(e.detail.confirmed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/publish-readiness";
  import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";

  let { initial }: { initial: TcPublishReadiness["confirmed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let confirmed = $derived(initial);
  let el: TcPublishReadiness;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      confirmed = (e as CustomEvent<{ confirmed: TcPublishReadiness["confirmed"] }>).detail.confirmed;
    };
    el.addEventListener("tc-confirmed-change", on);
    return () => el.removeEventListener("tc-confirmed-change", on);
  });
</script>

<tc-publish-readiness bind:this={el} {confirmed}></tc-publish-readiness>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-publish-readiness")` returns a `TcPublishReadiness` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";`
- **React / Next.js:** Props: `import type { PublishReadinessProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PublishReadiness>`. The element class, for refs: `import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPublishReadiness["checks"]` with `import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";`
- **Angular:** The directive types the template: `[checks]` takes `TcPublishReadiness["checks"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPublishReadiness } from "@adamstavely/trenchcoat/publish-readiness";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The dialog's heading – "Ready to publish?" by default |
| `description` | `React.ReactNode` | The line under the summary's title |
| `note` | `React.ReactNode` | Who approves and what happens next – a note above the action |
| `confirmed` | `string[]` | Ids of the manual checks the person has signed off (controlled) |
| `defaultConfirmed` | `string[]` | Signed off at first when uncontrolled |
| `onConfirmedChange` | `(ids: string[]) => void` | Called with every change to the signed-off ids |
| `open` | `boolean` | Whether the dialog is open (controlled) |
| `defaultOpen` | `boolean` | The checks dialog is open at first (uncontrolled) |
| `onOpenChange` | `(open: boolean) => void` | The checks dialog opened or closed |
| `onOpenBlocker` | `(blocker: ReadinessBlocker, check: ReadinessCheck) => void` | A blocker's link was followed – open the place it points at. Without it, blockers are plain text |
| `onPublish` | `() => void` | The release action – enabled once nothing blocks and every sign-off is given; without it the action stays off |

*Renamed or hidden on the wrapper: `heading`, `confirmed`, `open`, `description`, `note`, `plainBlockers`, `publishDisabled`, `children`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to Review checks (or Publish…), and through the dialog |
| Enter / Space | Opens the dialog; in it, ticks a sign-off, follows a blocker link or publishes |
| Escape | Closes the dialog and returns focus to the button that opened it |

### Screen readers

The summary is a region named by its title. The meter reads “2 of 5 checks passed”; the pill says the state in words –
Ready, Blocked or Needs sign-off. The dialog is a modal named by its heading and described by its purpose. Read-only
checks say their state in words; giving or withdrawing a sign-off is announced politely (“Signed off: Owner signs
off”). Blocker links read the blocker and where it is.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | progress-tracker, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, progress-tracker | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, button, internal/kit, internal/settings, progress-tracker | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button, dialog | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | dialog, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| inset | 87 | 66 | 14.1 | 14.1 | button, dialog, progress-tracker | – |
| :is() and :where() | 88 | 78 | 14 | 14 | button, internal/base, dialog, internal/settings, progress-tracker, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button | – |

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
| **This piece alone** | 17.5 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [progress-tracker](../components/progress-tracker.md) · Element it renders | 20.9 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| [dialog](../components/dialog.md) · Element it renders | 5.1 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **81.5 KB** | **21.0 KB** |
| With Lit – the first component on a page | 103.8 KB | 28.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | default properties, 57 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (progress-tracker).
- 4 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `ResizeObserver` (button), `MutationObserver` (button), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name checks as what must hold: “Spec is valid”, “Data rules met” – not what was run.
- Give each blocker its place in `where`, so the link says where it goes: “Run 7f2c”, “Step 8”.
- Use `detail` on checks that run later to say when: “run during approval”.
- Say in the note who approves and what changes on approval.

## Do and don't

### Do

- Open the blocker's place on `tc-open-blocker`, then update `checks` when it's fixed.
- Save sign-offs from `tc-confirmed-change`.
- Keep the action's label honest: “Submit for approval” when a person still approves.

### Don't

- Don't let the page publish around the dialog while something blocks.
- Don't make automated checks tickable – only sign-offs are.
- Don't show more than about ten checks; group the rest.

## Related

- [Progress Tracker](../components/progress-tracker.md) – Onboarding checklist with an animated progress bar, ticks that draw themselves and auto play
- [Dialog](../components/dialog.md) – A native modal with interactive content and restored focus
- [Status Tracker](../components/status-tracker.md) – Where work stands in a fixed sequence of steps – gates or stages on a line, each cleared, pending, blocked or not reached in words and marks, the line filling as they clear, the current step marked, a legend, and a step's evidence record on click
- [Approval Card](../components/approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
