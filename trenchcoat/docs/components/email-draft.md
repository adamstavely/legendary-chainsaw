<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Email Draft

**AI & chat**

Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo

- **Element:** `<tc-email-draft>`
- **Size:** 14.0 KB gzip · 58.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/email-draft";` |
| React / Next.js | `import { EmailDraft } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/email-draft";` · tags starting with tc- are custom elements |
| Angular | `import { EmailDraft } from "@adamstavely/trenchcoat/angular/email-draft";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/email-draft";` |

## Example

The live example is in the gallery at `#/email-draft`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An email an agent wrote, waiting for a person to check it before it goes out. The record it's about – a reference,
its status, an amount – sits above the email; the email itself has a recipient people can switch, an attachment they
can remove, tone variants (Friendly, Short, Formal) and text they can click to edit. Send and Discard fold the card
into a one-line receipt, with Undo where it can be honoured. People stay in charge of what goes out in their name
without rewriting it from scratch.

### When to use

- Agent-drafted messages about a record – a renewal, an overdue invoice, a support case – that a person sends.
- Where the main choices are who it goes to and how it sounds, with light edits on top.
- Review queues, where each draft is approved or discarded in a few seconds.

### When not to use

- Approving an action that isn't a message – use [Approval Card](approval-card.md).
- Writing a message with the AI from a prompt, in a chat – use [Writing Assistant](writing-assistant.md).
- Reviewing the AI's changes to existing text, word by word – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the record the email is about: its reference, account, status and amount
2. **Recipient** `.ui-ed__recipient` – who it goes to; opens the list of contacts
3. **Attachment** `.ui-ed__file` – the attached file, with × to remove it
4. **Text** `.ui-ed__body` – the email; click it (or the pencil) to edit
5. **Tones** `.ui-ed__tones` – the text variants and the Edit button
6. **Send and Discard** `.ui-ed__buttons` – send the email or throw the draft away

## Looks

Standard puts the record on a gray tray above a white card with the email, and Discard and Send sit in the card next
to the tones; the footer names the agent. Clean has no tray: one white card, the record at its head, then the email,
and a last row with the agent, its state, Discard and Send. Both fold to the same receipt.

## Usage

### HTML

```html
<tc-email-draft id="draft" reference="INV-4471" account="Lumen Health" amount="$12,450" status="6 days overdue"
  agent="Collections agent" attachment="INV-4471.pdf"></tc-email-draft>

<script type="module">
  import "@adamstavely/trenchcoat/email-draft";
  import "@adamstavely/trenchcoat/tokens.css";

  const draft = document.querySelector("#draft");
  draft.contacts = [{ name: "Ava Patel", email: "ava@lumenhealth.com" }];
  draft.tones = [{ id: "short", label: "Short", body: (c) => `Hi ${c.name}, invoice INV-4471 is 6 days overdue. Pay online:` }];
  draft.link = { label: "Pay invoice", href: "https://pay.example.com/INV-4471" };
  draft.onSend = (email) => fetch("/api/send", { method: "POST", body: JSON.stringify(email) });
  draft.addEventListener("tc-discard", () => console.log("discarded"));
</script>
```

### React / Next.js

```tsx
import { EmailDraft, type DraftContact, type DraftEmail } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const contacts: DraftContact[] = [{ name: "Ava Patel", email: "ava@lumenhealth.com" }];

export function OverdueReminder({ send }: { send: (email: DraftEmail) => Promise<void> }) {
  return (
    <EmailDraft
      reference="INV-4471"
      account="Lumen Health"
      amount="$12,450"
      status="6 days overdue"
      agent="Collections agent"
      contacts={contacts}
      attachment="INV-4471.pdf"
      tones={[{ id: "short", label: "Short", body: (c) => `Hi ${c.name}, invoice INV-4471 is 6 days overdue. Pay online:` }]}
      link={{ label: "Pay invoice", href: "https://pay.example.com/INV-4471" }}
      onSend={send}
      onDiscard={() => console.log("discarded")}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/email-draft";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";

defineProps<{ contacts: TcEmailDraft["contacts"]; tones: TcEmailDraft["tones"] }>();
const onRecipientChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-email-draft :contacts="contacts" :tones="tones" @tc-recipient-change="onRecipientChange"></tc-email-draft>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EmailDraft } from "@adamstavely/trenchcoat/angular/email-draft";
import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";

@Component({
  selector: "app-email-draft-example",
  imports: [EmailDraft],
  template: `<tc-email-draft [contacts]="contacts()" [tones]="tones()" (tc-recipient-change)="onRecipientChange($event)"></tc-email-draft>`,
})
export class EmailDraftExample {
  readonly contacts = input.required<TcEmailDraft["contacts"]>();
  readonly tones = input.required<TcEmailDraft["tones"]>();
  onRecipientChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/email-draft";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";

  let { contacts, tones }: { contacts: TcEmailDraft["contacts"]; tones: TcEmailDraft["tones"] } = $props();
  let el: TcEmailDraft;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-recipient-change", on);
    return () => el.removeEventListener("tc-recipient-change", on);
  });
</script>

<tc-email-draft bind:this={el} {contacts} {tones}></tc-email-draft>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `reference` | `reference` | `string` | `"SUB-1182"` | Reference of the record, e.g. a subscription or invoice number |
| `account` | `account` | `string` | `"Northwind Logistics"` | Account or company under the reference |
| `amount` | `amount` | `string` | `"$8,900"` | Amount shown on the right |
| `status` | `status` | `string` | `"Renews in 5 days"` | Status chip next to the reference |
| `agent` | `agent` | `string` | `"Renewal agent"` | Who wrote the draft |
| `contacts` | – | `DraftContact[]` | `[ { name: "Jonas Weber", email: "jonas@northwind.io" }, { name: "Lena Hart", email: "lena@northwind.io" }, { name: "Finance team", email: "billing@northwind.io" }, ]` | The people the email can go to – the recipient list offers them; the first is picked unless `recipient` says otherwise |
| `recipient` | `recipient` | `string \| undefined` | `undefined` | The email of the contact it goes to – unset is the first contact; one not in `contacts` falls back to the first |
| `attachment` | `attachment` | `string \| null` | `"Renewal-quote.pdf"` | The file attached – removing it is remembered for that file only, so a new attachment shows again |
| `tones` | – | `DraftTone[]` | `` [ { id: "friendly", label: "Friendly", body: (c) => `Hi ${first(c)}, a heads-up that your Growth plan renews on October 9 for $8,900 a year. If you'd like to add seats or switch to monthly billing, you can review the quote here:`, }, { id: "short", label: "Short", body: (c) => `Hi ${first(c)}, your Growth plan renews on October 9 ($8,900/year). Quote for changes:`, }, { id: "formal", label: "Formal", body: (c) => `Dear ${c.name}, this is a reminder that your Growth subscription is scheduled to renew on October 9 at $8,900 per year. Should you wish to adjust seats or billing, please review the attached quote:`, }, ] `` | Text variants to switch between – the first one is shown first |
| `tone` | `tone` | `string \| undefined` | `undefined` | The id of the tone shown – unset is the first; one not in `tones` falls back to the first |
| `link` | – | `{ label: string; href: string }` | `{ label: "Review quote", href: "#" }` | Label and target of the link appended to the email |
| `onSend` | – | `((email: DraftEmail) => void \| Promise<unknown>) \| undefined` | `undefined` | Sends the email. Return a promise to keep the card in its sending state until it settles – a rejection brings the draft back with an error. Without it sending is simulated (and warns once, unless `demo` is set) |
| `undoSend` | `undo-send` | `boolean \| undefined` | `undefined` | The receipt offers Undo for a send (tc-undo takes it back) – unset: only when there's no `onSend` |
| `undoDiscard` | `undo-discard` | `boolean \| undefined` | `undefined` | The receipt offers Undo for a discard (tc-undo takes it back) – unset: yes |
| `demo` | `demo` | `boolean` | `false` | Demo mode: sending without onSend is simulated silently. For galleries and prototypes |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-recipient-change` | – | Yes | Another contact is picked ({ email, recipient, contact }: DraftRecipientChange – recipient is the email). Cancelable: prevent it to control `recipient` |
| `tc-tone-change` | – | Yes | Another tone is picked; detail `{ tone: string }`. Cancelable: prevent it to control `tone` |
| `tc-discard` | – | No | The draft is discarded; detail `null` |
| `tc-undo` | – | No | A send or discard is taken back from the receipt; detail `{ action: "send" \| "discard" }` |

#### Design tokens it reads (108)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xl`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `contacts` | `el.contacts = …;` | `<… contacts={…} />` | `<tc-email-draft :contacts="…">` | `<tc-email-draft [contacts]="…">` | `<tc-email-draft {contacts}>` |
| `tones` | `el.tones = …;` | `<… tones={…} />` | `<tc-email-draft :tones="…">` | `<tc-email-draft [tones]="…">` | `<tc-email-draft {tones}>` |
| `link` | `el.link = …;` | `<… link={…} />` | `<tc-email-draft :link="…">` | `<tc-email-draft [link]="…">` | `<tc-email-draft {link}>` |
| `onSend` | `el.onSend = …;` | `<… onSend={…} />` | `<tc-email-draft :onSend="…">` | `<tc-email-draft [onSend]="…">` | `<tc-email-draft {onSend}>` |

*Also attributes: `reference`, `account`, `amount`, `status`, `agent`, `recipient`, `attachment`, `tone` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-recipient-change` | Yes | `el.addEventListener("tc-recipient-change", (e) => …)` | `ref.current.addEventListener("tc-recipient-change", …)` | `@tc-recipient-change="…"` | `(tc-recipient-change)="…($event)"` | `el.addEventListener("tc-recipient-change", …)` |
| `tc-tone-change` | Yes | `el.addEventListener("tc-tone-change", (e) => …)` | `ref.current.addEventListener("tc-tone-change", …)` | `@tc-tone-change="…"` | `(tc-tone-change)="…($event)"` | `el.addEventListener("tc-tone-change", …)` |
| `tc-discard` | No | `el.addEventListener("tc-discard", (e) => …)` | `onDiscard={…}` | `@tc-discard="…"` | `(tc-discard)="…($event)"` | `el.addEventListener("tc-discard", …)` |
| `tc-undo` | No | `el.addEventListener("tc-undo", (e) => …)` | `onUndo={…}` | `@tc-undo="…"` | `(tc-undo)="…($event)"` | `el.addEventListener("tc-undo", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `recipient` and `tone` itself unless a listener calls `preventDefault()` on `tc-recipient-change` or `tc-tone-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-email-draft id="email-draft"></tc-email-draft>

<script type="module">
  import "@adamstavely/trenchcoat/email-draft";

  const el = document.querySelector("#email-draft");
  el.addEventListener("tc-recipient-change", (e) => {
    e.preventDefault(); // the element keeps its recipient…
    if (allowed(e.detail.recipient)) el.recipient = e.detail.recipient; // …until the app sets it
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
import "@adamstavely/trenchcoat/email-draft";
import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";

const props = defineProps<{ initial: TcEmailDraft["recipient"] }>();
const recipient = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRecipientChange = (e: CustomEvent<{ recipient: TcEmailDraft["recipient"] }>) => {
  e.preventDefault();
  recipient.value = e.detail.recipient;
};
</script>

<template>
  <tc-email-draft :recipient="recipient" @tc-recipient-change="onRecipientChange"></tc-email-draft>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EmailDraft } from "@adamstavely/trenchcoat/angular/email-draft";
import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";

@Component({
  selector: "app-controlled-email-draft",
  imports: [EmailDraft],
  template: `<tc-email-draft [recipient]="recipient()" (tc-recipient-change)="onRecipientChange($event)"></tc-email-draft>`,
})
export class ControlledEmailDraft {
  readonly initial = input.required<TcEmailDraft["recipient"]>();
  readonly recipient = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRecipientChange(e: CustomEvent<{ recipient: TcEmailDraft["recipient"] }>) {
    e.preventDefault();
    this.recipient.set(e.detail.recipient);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/email-draft";
  import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";

  let { initial }: { initial: TcEmailDraft["recipient"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let recipient = $derived(initial);
  let el: TcEmailDraft;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      recipient = (e as CustomEvent<{ recipient: TcEmailDraft["recipient"] }>).detail.recipient;
    };
    el.addEventListener("tc-recipient-change", on);
    return () => el.removeEventListener("tc-recipient-change", on);
  });
</script>

<tc-email-draft bind:this={el} {recipient}></tc-email-draft>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-email-draft")` returns a `TcEmailDraft` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";`
- **React / Next.js:** Props: `import type { EmailDraftProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EmailDraft>`. The element class, for refs: `import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEmailDraft["contacts"]` with `import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";`
- **Angular:** The directive types the template: `[contacts]` takes `TcEmailDraft["contacts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEmailDraft } from "@adamstavely/trenchcoat/email-draft";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `recipient` | `string` | The email of the contact it goes to – controlled when defined; one not in `contacts` falls back to the first |
| `defaultRecipient` | `string` | The email of the contact picked at first – defaults to the first contact |
| `onRecipientChange` | `(email: string, contact: DraftContact) => void` | Called with the email and contact the user picked, controlled or not |
| `tone` | `string` | The id of the tone shown – controlled when defined; one not in `tones` falls back to the first |
| `defaultTone` | `string` | The id of the tone shown at first – defaults to the first tone |
| `onToneChange` | `(id: string) => void` | Called with the id of the tone the user picked, controlled or not |
| `onDiscard` | `() => void` | Called when the draft is discarded |
| `onUndo` | `(action: "send" \| "discard") => void` | Takes back a send or a discard that already reached you through onSend / onDiscard. Without it the receipt offers no Undo for those – only for what never left the component |

*Renamed or hidden on the wrapper: `recipient`, `tone`, `undoSend`, `undoDiscard`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the recipient, the attachment, the link, the tones, Edit, Discard and Send |
| ↓ / ↑ | On the recipient, opens the list (↑ starts at the last contact); in the list, moves between contacts |
| Home / End | In the list, jumps to the first or last contact |
| Enter / Space | In the list, picks the contact; elsewhere, presses the button |
| Escape | Closes the list and returns to the recipient; in the text field, stops editing and returns to Edit |
| ⌘ Enter / Ctrl Enter | In the text field, sends the email |

### Screen readers

The recipient is a button with `aria-haspopup="listbox"` and `aria-expanded`, named “to Jonas Weber (jonas@…)”;
the list is a `listbox` named “Recipient” whose options are `aria-selected`, with `aria-activedescendant` following
the arrow keys. The tones are a group named “Tone” of toggle buttons with `aria-pressed`; the pencil is “Edit text”
and the field “Email text”. The remove button is named “Remove Renewal-quote.pdf”. While sending, Send says
“Sending” and stays focused with `aria-disabled`. A status region says the result – “Email sent to Jonas Weber.”,
“Draft discarded.”, “Sending undone – the draft is back.” – and when a tone replaces someone's edits: “Your edits
were replaced by the Short text. Restore my edits brings them back.” A failed send shows an alert: “The email
couldn't be sent. Try again.”

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 49.4 KB | 11.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **58.7 KB** | **14.0 KB** |
| With Lit – the first component on a page | 81.2 KB | 21.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.2 ms** | the gallery demo's data, 47 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of contacts replaced |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.0 ms | contacts: first render, 47 nodes; update 0.2 ms |
| 1,000 items | 2.6 ms | contacts: first render, 47 nodes; update 0.2 ms |

What it renders doesn't grow with contacts (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – SmoothHeightController).
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/controllers – SmoothHeightController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `reference`, `status` and `amount` describe the record, not the email: “INV-4471”, “6 days overdue”, “$12,450”.
- Name `agent` by its job: “Collections agent”.
- Label tones by how they sound – Friendly, Short, Formal – and keep them to three or four.
- Write each tone's `body` as a function of the contact, so switching recipient keeps the greeting right.
- Make the link label the action the reader takes: “Pay invoice”, “Review quote”.

## Do and don't

### Do

- Pass `onSend` and return a promise – the card stays in its sending state until it settles, and a failure brings the
  draft back with an error.
- Pass `onUndo` only if you can really take a send back; otherwise the receipt offers no Undo for it.
- Keep `contacts` to the people who can sensibly receive this email.

### Don't

- Don't leave `onSend` unset in a product – sending is then simulated (with a console warning unless `demo` is set).
- Don't hide the recipient: who it goes to is the first thing people check.
- Don't write tone variants that change the facts; they should only change the voice.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Writing Assistant](writing-assistant.md) – AI chat card with a soft gradient glow, suggestions, streaming replies and live voice dictation
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo

## Changelog

- **Event details:** four change events gained a field named after the property they change. The existing fields stay. The docs' controlled examples read these names, which the events lacked; the new Angular type check caught it. - `tc-artifact-panel`'s `tc-selected-change`: `selected`. - `tc-email-draft`'s `tc-recipient-change`: `recipient`. - `tc-reliance-gauge`'s `tc-review-level-change`: `reviewLevel`. - `tc-transcript-review`'s `tc-translation-mode-change`: `translationMode`.
