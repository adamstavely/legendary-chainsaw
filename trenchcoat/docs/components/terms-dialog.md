<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Terms Dialog

**Feedback & onboarding** · New

Agreeing to terms in a modal designed for reading – version and date, a jump list, what changed since you last agreed, required and optional consents, and Accept that says why it waits

- **Element:** `<tc-terms-dialog>`
- **Size:** 13.9 KB gzip · 50.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/terms-dialog";` |
| React / Next.js | `import { TermsDialog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/terms-dialog";` · tags starting with tc- are custom elements |
| Angular | `import { TermsDialog } from "@adamstavely/trenchcoat/angular/terms-dialog";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/terms-dialog";` |

## Example

The live example is in the gallery at `#/terms-dialog`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A modal for agreeing to terms – terms of service, a privacy policy, an AI acceptable use policy. It opens on the
text, laid out for reading: the version and the date it takes effect in the header, numbered sections with a jump
list beside them (a Contents button above them when narrow), and the consents and Accept at the foot. When someone
agreed to an earlier version, a short "What's changed" comes first, each change linked to its section, and the changed
sections are marked Updated. Accept waits until every required box is checked – and, if you ask, until the text has
been read to the end – and says why it's waiting. The app owns the text and the record: the dialog hands over the
version and the consents and stores nothing.

### When to use

- The first time someone agrees to your terms, at sign-up or before a feature that needs its own terms.
- Asking people to agree again after the terms change, with what changed up front.
- A must-accept gate (`blocking`): nothing else in the product works until the person agrees.
- Collecting an optional consent at the same moment, such as product updates, beside the required one.

### When not to use

- A short confirmation of one action ("Delete this project?") – use [Dialog](dialog.md).
- Consent spread over several steps of setup, with other questions in between – use [Stepper Form](stepper-form.md).
- Showing the history of a policy's versions and what each changed – use [Version History](version-history.md).
- A checklist of things to do before going live – use [Setup Guide](setup-guide.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the title, version and date, Updated when agreeing again, Print, Download and Close
2. **Jump list** `.ui-tdlg__toc` – the sections, the one being read marked; a Contents button when narrow
3. **What's changed** `.ui-tdlg__changes` – when agreeing again: each change, linked to its section
4. **Text** `.ui-tdlg__doc` – the sections, with a hairline above that fills as the reader goes
5. **Consents** `.ui-tdlg__consents` – the boxes to check, required ones marked
6. **Reason** `.ui-tdlg__why` – why Accept is waiting, beside it
7. **Actions** `.ui-tdlg__acts` – Not now (or Decline) and Accept

## Looks

Standard puts the header and the consents on the gray tray, with the text on a white card between them and the jump
list on a light well; the section being read is a small raised chip. Clean is one white surface divided by hairlines:
the jump list marks the current section with a thin accent rule, What's changed is set off by a rule instead of a
tinted box, headings are lighter and the icons thinner. Both narrow to the same single column: the jump list folds
into a Contents button over the text, and the actions stack full width.

## Usage

### HTML

```html
<tc-terms-dialog id="terms" heading="Terms of Service" version="4.0" effective-date="1 November 2026"
  require-scroll downloadable></tc-terms-dialog>

<script type="module">
  import "@adamstavely/trenchcoat/terms-dialog";
  import "@adamstavely/trenchcoat/tokens.css";

  const terms = document.querySelector("#terms");
  terms.sections = [
    { id: "account", heading: "Your account", body: "You need an account to use the service.\n\n- You must be 16 or older." },
    { id: "content", heading: "Your content", body: "What you create stays yours." },
  ];
  terms.consents = [
    { id: "terms", label: "I agree to the Terms of Service", required: true },
    { id: "updates", label: "Send me product updates" },
  ];
  terms.recordAcceptance = (detail, signal) =>
    fetch("/api/acceptances", { method: "POST", body: JSON.stringify(detail), signal }).then((r) => {
      if (!r.ok) throw new Error(r.statusText);
    });
  terms.addEventListener("tc-download", () => window.open("/legal/terms-4.0.pdf"));
  terms.open = true;
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TermsDialog, type TermsAcceptDetail, type TermsDialogSection } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sections: TermsDialogSection[] = [
  { id: "review", heading: "Allowed with human review", changed: true, body: <p>Some uses need a person to check the output first.</p> },
  { id: "data", heading: "Personal data in prompts", body: "Only include personal data you're allowed to process." },
];

export function PolicyGate({ save }: { save: (detail: TermsAcceptDetail) => Promise<void> }) {
  const [open, setOpen] = useState(true);
  return (
    <TermsDialog
      open={open}
      onOpenChange={setOpen}
      heading="AI acceptable use policy"
      version="3.0"
      effectiveDate="1 December 2026"
      previousVersion="2.1"
      changes={[{ text: "Messages to more than 100 people need review first.", section: "review" }]}
      sections={sections}
      consents={[{ id: "policy", label: "I agree to the AI acceptable use policy", required: true }]}
      blocking
      canDecline={false}
      recordAcceptance={(detail) => save(detail)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/terms-dialog";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";

defineProps<{ changes: TcTermsDialog["changes"]; sections: TcTermsDialog["sections"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-terms-dialog :changes="changes" :sections="sections" @tc-open-change="onOpenChange"></tc-terms-dialog>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TermsDialog } from "@adamstavely/trenchcoat/angular/terms-dialog";
import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";

@Component({
  selector: "app-terms-dialog-example",
  imports: [TermsDialog],
  template: `<tc-terms-dialog [changes]="changes()" [sections]="sections()" (tc-open-change)="onOpenChange($event)"></tc-terms-dialog>`,
})
export class TermsDialogExample {
  readonly changes = input.required<TcTermsDialog["changes"]>();
  readonly sections = input.required<TcTermsDialog["sections"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/terms-dialog";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";

  let { changes, sections }: { changes: TcTermsDialog["changes"]; sections: TcTermsDialog["sections"] } = $props();
  let el: TcTermsDialog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-terms-dialog bind:this={el} {changes} {sections}></tc-terms-dialog>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `open` | `open` | `boolean` | `false` | Whether the modal is open |
| `heading` | `heading` | `string` | `"Terms of Service"` | The title, and the dialog's accessible name |
| `version` | `version` | `string` | `""` | The version being agreed to, e.g. "4.0"; it travels on tc-accept |
| `effectiveDate` | `effective-date` | `string` | `""` | When this version takes effect or was last updated, shown as given: "1 November 2026" |
| `dateLabel` | `date-label` | `string` | `"Effective"` | The word before the date – "Effective", or "Last updated" |
| `previousVersion` | `previous-version` | `string` | `""` | The version the reader agreed to before; set, the dialog asks them to agree again and says what changed |
| `previousDate` | `previous-date` | `string` | `""` | When the reader agreed to `previousVersion`, shown as given |
| `changes` | – | `TermsChange[]` | `[]` | What changed since `previousVersion`, a sentence each, shown above the text |
| `sections` | – | `TermsSection[]` | `[]` | The text, as sections with headings; the jump list is made from them |
| `content` | – | `unknown` | `undefined` | The text as one template or DOM node, when it isn't in `sections`; its h2 and h3 headings make the jump list |
| `consents` | – | `TermsConsent[]` | `[]` | The boxes to check – each required or optional |
| `checked` | – | `TermsConsents` | `{}` | Which consents are checked, by id |
| `requireScroll` | `require-scroll` | `boolean` | `false` | Accept also waits until the text has been scrolled to the end |
| `blocking` | `blocking` | `boolean` | `false` | A must-accept flow: no close button, and Escape doesn't close |
| `canDecline` | `can-decline` | `boolean` | `true` | Decline is offered (default true) |
| `printable` | `printable` | `boolean` | `false` | Shows Print, which fires tc-print |
| `downloadable` | `downloadable` | `boolean` | `false` | Shows Download, which fires tc-download |
| `pending` | `pending` | `boolean` | `false` | The app is recording the acceptance: Accept shows `pendingLabel` and nothing else can be pressed |
| `error` | `error` | `string` | `""` | The app couldn't record the acceptance: this message shows with Try again |
| `recordAcceptance` | – | `TermsRecorder \| undefined` | `undefined` | Records the acceptance after tc-accept; while it runs Accept shows Saving…, it closes the dialog when it resolves |
| `describeBlocked` | – | `((blocked: TermsBlocked) => string) \| undefined` | `undefined` | Says why Accept is held, in place of the built-in sentences |
| `acceptLabel` | `accept-label` | `string` | `"Accept"` | The accept button |
| `declineLabel` | `decline-label` | `string` | `"Not now"` | The decline button – "Not now", or "Decline" |
| `pendingLabel` | `pending-label` | `string` | `"Saving…"` | Accept while the acceptance is recorded |
| `errorLabel` | `error-label` | `string` | `"Couldn't record your acceptance. Your choices are kept."` | The error when `recordAcceptance` fails |
| `retryLabel` | `retry-label` | `string` | `"Try again"` | The retry button |
| `contentsLabel` | `contents-label` | `string` | `"Contents"` | The jump list's name |
| `changesLabel` | `changes-label` | `string` | `"What's changed"` | The heading over what changed |
| `closeLabel` | `close-label` | `string` | `"Close"` | The close button's name |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | Asks to open or close; detail `{ open }`. Cancelable – prevented, `open` stays. |
| `tc-accept` | – | Yes | Accept was pressed with every requirement met; detail `{ version, consents }` (TermsAcceptDetail). Cancelable – prevented, the dialog stays open and nothing is recorded. |
| `tc-decline` | – | Yes | Decline was pressed; detail `{ version }` (TermsDeclineDetail). Cancelable – not prevented, the dialog closes. |
| `tc-consent-change` | – | Yes | A consent was checked or unchecked; detail `{ id, checked, consents }` (TermsConsentChangeDetail). Cancelable – prevented, `checked` stays. |
| `tc-print` | – | No | Print was pressed; detail `{ version }`. The app prints. |
| `tc-download` | – | No | Download was pressed; detail `{ version }`. The app provides the file. |

#### Design tokens it reads (101)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-scrim`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `describeBlocked({ unread, missing }: TermsBlocked): string` | The default reason Accept is held, in a sentence |

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
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-terms-dialog :changes="…">` | `<tc-terms-dialog [changes]="…">` | `<tc-terms-dialog {changes}>` |
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-terms-dialog :sections="…">` | `<tc-terms-dialog [sections]="…">` | `<tc-terms-dialog {sections}>` |
| `content` | `el.content = …;` | `<… content={…} />` | `<tc-terms-dialog :content="…">` | `<tc-terms-dialog [content]="…">` | `<tc-terms-dialog {content}>` |
| `consents` | `el.consents = …;` | `<… consents={…} />` | `<tc-terms-dialog :consents="…">` | `<tc-terms-dialog [consents]="…">` | `<tc-terms-dialog {consents}>` |
| `checked` | `el.checked = …;` | `<… checked={…} />` | `<tc-terms-dialog :checked="…">` | `<tc-terms-dialog [checked]="…">` | `<tc-terms-dialog {checked}>` |
| `recordAcceptance` | `el.recordAcceptance = …;` | `<… recordAcceptance={…} />` | `<tc-terms-dialog :recordAcceptance="…">` | `<tc-terms-dialog [recordAcceptance]="…">` | `<tc-terms-dialog {recordAcceptance}>` |
| `describeBlocked` | `el.describeBlocked = …;` | `<… describeBlocked={…} />` | `<tc-terms-dialog :describeBlocked="…">` | `<tc-terms-dialog [describeBlocked]="…">` | `<tc-terms-dialog {describeBlocked}>` |

*Also attributes: `open`, `heading`, `version`, `effective-date`, `date-label`, `previous-version`, `previous-date`, `require-scroll` and 14 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-accept` | Yes | `el.addEventListener("tc-accept", (e) => …)` | `onAccept={…}` | `@tc-accept="…"` | `(tc-accept)="…($event)"` | `el.addEventListener("tc-accept", …)` |
| `tc-decline` | Yes | `el.addEventListener("tc-decline", (e) => …)` | `onDecline={…}` | `@tc-decline="…"` | `(tc-decline)="…($event)"` | `el.addEventListener("tc-decline", …)` |
| `tc-consent-change` | Yes | `el.addEventListener("tc-consent-change", (e) => …)` | `onCheckedChange={…}` | `@tc-consent-change="…"` | `(tc-consent-change)="…($event)"` | `el.addEventListener("tc-consent-change", …)` |
| `tc-print` | No | `el.addEventListener("tc-print", (e) => …)` | `onPrint={…}` | `@tc-print="…"` | `(tc-print)="…($event)"` | `el.addEventListener("tc-print", …)` |
| `tc-download` | No | `el.addEventListener("tc-download", (e) => …)` | `onDownload={…}` | `@tc-download="…"` | `(tc-download)="…($event)"` | `el.addEventListener("tc-download", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-terms-dialog id="terms-dialog"></tc-terms-dialog>

<script type="module">
  import "@adamstavely/trenchcoat/terms-dialog";

  const el = document.querySelector("#terms-dialog");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TermsDialog } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TermsDialog>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledTermsDialog({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <TermsDialog {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/terms-dialog";
import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";

const props = defineProps<{ initial: TcTermsDialog["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcTermsDialog["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-terms-dialog :open="open" @tc-open-change="onOpenChange"></tc-terms-dialog>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TermsDialog } from "@adamstavely/trenchcoat/angular/terms-dialog";
import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";

@Component({
  selector: "app-controlled-terms-dialog",
  imports: [TermsDialog],
  template: `<tc-terms-dialog [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-terms-dialog>`,
})
export class ControlledTermsDialog {
  readonly initial = input.required<TcTermsDialog["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcTermsDialog["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/terms-dialog";
  import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";

  let { initial }: { initial: TcTermsDialog["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcTermsDialog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcTermsDialog["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-terms-dialog bind:this={el} {open}></tc-terms-dialog>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-terms-dialog")` returns a `TcTermsDialog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";`
- **React / Next.js:** Props: `import type { TermsDialogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TermsDialog>`. The element class, for refs: `import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTermsDialog["changes"]` with `import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";`
- **Angular:** The directive types the template: `[changes]` takes `TcTermsDialog["changes"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTermsDialog } from "@adamstavely/trenchcoat/terms-dialog";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Whether the modal is open – controlled when defined; pair it with `onOpenChange` |
| `defaultOpen` | `boolean` | Whether an uncontrolled modal starts open |
| `onOpenChange` | `(open: boolean) => void` | Called when the dialog asks to open or close (Escape, the close button, Accept, Decline) |
| `checked` | `TermsConsents` | Which consents are checked, by id – controlled when defined |
| `defaultChecked` | `TermsConsents` | Which consents start checked, when `checked` isn't controlled |
| `onCheckedChange` | `(consents: TermsConsents) => void` | Called with every consent after one is checked or unchecked |
| `sections` | `TermsDialogSection[]` | The text as sections; a body can be text, a DOM node or React content |
| `children` | `React.ReactNode` | The text as React content, when it isn't in `sections`; its h2 and h3 headings make the jump list |
| `onAccept` | `(detail: TermsAcceptDetail, event: CustomEvent<TermsAcceptDetail>) => void` | Called when Accept is pressed with every requirement met; `event.preventDefault()` keeps the dialog open and records nothing |
| `onDecline` | `(detail: TermsDeclineDetail, event: CustomEvent<TermsDeclineDetail>) => void` | Called when Decline is pressed; `event.preventDefault()` keeps the dialog open |
| `onPrint` | `(detail: TermsFileDetail) => void` | Called when Print is pressed (shown with `printable`) |
| `onDownload` | `(detail: TermsFileDetail) => void` | Called when Download is pressed (shown with `downloadable`) |

*Renamed or hidden on the wrapper: `open`, `checked`, `defaultChecked`, `sections`, `content`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between the controls; the page behind is inert, so focus stays in the dialog |
| ↑ ↓ PageUp PageDown Space Home End | Scroll the text – it has focus when the dialog opens |
| Enter (jump list) | Moves to that section and puts focus on its heading |
| Enter / Space (Contents, narrow) | Opens or closes the jump list |
| Escape (jump list open, narrow) | Closes the jump list and returns to the Contents button |
| Space (consent) | Checks or unchecks it |
| Enter / Space (Accept, waiting) | Accepts nothing; moves focus to the first unchecked required box, or to the text when it hasn't been read to the end |
| Escape | Asks to close (a cancelable `tc-open-change`) – not when `blocking`, and not while the acceptance is saving |

Focus goes back to what opened the dialog when it closes.

### Screen readers

The native `dialog` is modal and named by the heading ("Terms of Service"). The text is a focusable region named
"Terms of Service text"; each section is a region named by its heading ("2. Your account Updated"). The jump list is
a navigation landmark named "Contents"; the section being read has `aria-current="location"` and changed ones end in
"(updated)". The Contents button has `aria-expanded` and `aria-controls`. The consents are a group named "Your
agreement"; required boxes are `required`, and one that held Accept back is `aria-invalid` after Accept is pressed.
While Accept waits it stays focusable with `aria-disabled="true"` and is described by the reason ("Read to the end and
check “I agree to the Terms of Service” to accept."). A polite status says what happened: the reason again when
Accept is pressed too early, "You can accept now.", "You've reached the end. You can accept now." and "Saving…". A
failure is an alert ("Couldn't record your acceptance. Your choices are kept.") with Try again, which takes focus.
While saving, the dialog is `aria-busy`.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 40.8 KB | 11.2 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **50.1 KB** | **13.9 KB** |
| With Lit – the first component on a page | 72.4 KB | 21.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | the gallery demo's data, 156 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of sections replaced |
| First on the page | 5.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.4 ms | sections: first render, 1,147 nodes; update 1.1 ms |
| 1,000 items | 23 ms | sections: first render, 10,820 nodes; update 5.8 ms |

1,000 items of sections: 23 ms, 10,820 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`.
- No timers.
- 2 infinite CSS animations.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Title the dialog with the document's name – "Terms of Service", "AI acceptable use policy" – not "Please read".
- Give `version` and `effectiveDate` as people should read them ("4.0", "1 November 2026"); use `dateLabel="Last
  updated"` when that's the date you have.
- Write each change as one plain sentence of what it means for the reader – "Messages sent to more than 100 people
  now need a person to review them first" – and link it to its section with `section`.
- Keep section headings short – they are the jump list. Put the detail in the body.
- Label consents in the first person: "I agree to the Terms of Service". Make only the agreement itself required;
  marketing consents are optional.
- Use "Not now" when people can come back later, and "Decline" when declining has a consequence the text explains.

## Do and don't

### Do

- Record what tc-accept carries – the version and every consent, checked or not – with the time on your server.
- Use `recordAcceptance` (or `pending` and `error`) so a failed save is visible and can be retried; the dialog keeps
  the boxes as they were.
- Use `requireScroll` only where the law or your policy needs proof of reading, and keep such texts short.
- Offer Download or Print for long terms, and serve the same version that was shown.

### Don't

- Don't pre-check required boxes – agreement has to be the person's own action.
- Don't bundle optional consents into the required one.
- Don't use `blocking` for terms people can reasonably postpone; it stops them doing anything else.
- Don't show a different text in the dialog from the one you store against the version.

## Related

- [Dialog](dialog.md) – A native modal with interactive content and restored focus
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Version History](version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour

## Changelog

- **Header Nav:** the account card's defaults add **Terms and Conditions** (`id: "terms"`) before Sign out. Picking it fires `tc-account-select` with `id: "terms"`; open a read-only `tc-terms-dialog` on it (no consents, `canDecline` false, `accept-label="Close"`), as the gallery now does.
- **`tc-terms-dialog`:** terms to agree to. - **Changed terms:** re-acceptance opens with a "What's changed" summary, and changed sections are marked. - **Reading:** a jump list that folds into a Contents button. - **Accepting:** required and optional consents; Accept can wait for the end of the text, and says why it's waiting. - **Other actions:** Decline, print and download, plus a blocking mode. - **Saving:** app-driven saving with error and retry.
- **Shared code:** - `internal/modal.ts`, the `ModalController` that `tc-dialog`, `tc-terms-dialog` and `tc-stories` share; - `cardHead()` gains `picture`, `pictureShape` and `keepAside`.
