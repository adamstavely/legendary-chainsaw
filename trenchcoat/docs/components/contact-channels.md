<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Contact Channels

**People & profiles** · New

The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address – each masked until shown, with its role, when it was last used, how far it's verified, Copy and the page's own actions

- **Element:** `<tc-contact-channels>`
- **Size:** 8.9 KB gzip · 26.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/contact-channels";` |
| React / Next.js | `import { ContactChannels } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/contact-channels";` · tags starting with tc- are custom elements |
| Angular | `import { ContactChannels } from "@adamstavely/trenchcoat/angular/contact-channels";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/contact-channels";` |

## Example

The live example is in the gallery at `#/contact-channels`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address. Each row shows:
- the value, masked until someone shows it – an email keeps its first letter and domain, a phone number its last two
  digits, an address its town;
- its role – Primary, Work, Backup, Linked to alias – and, for messaging, the service;
- when it was last used;
- how far it's verified – Verified, Unverified, Bounced, Dormant, Flagged, or states of your own.

A shown value can be copied, and the page can add its own actions to every row, such as Message or Call. The heading
counts how many are verified. Showing a value is one row at a time and fires a cancelable event, so a page can ask
for a reason or log it first.

### When to use

- A customer's or member's contact details on a support, account or onboarding page.
- Checking which ways to reach someone still work before sending something important.
- Any record where contact details are personal data and shouldn't sit on screen in full.

### When not to use

- Identity and record documents – use [Document List](document-list.md).
- Vehicles, devices and other assets – use [Asset List](asset-list.md).
- One secret value, such as an API key – use [Secret Field](secret-field.md).
- The top of a person's page, with their name and key facts – use [Profile Header](profile-header.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Group** `.ui-cch__group-head` – the kind of contact point, with its icon
2. **Row** `.ui-cch__row` – one contact point
3. **Value** `.ui-cch__value` – the address, number, handle or postal address, masked until shown
4. **Role** `.ui-cch__role` – what it's for
5. **Last used** `.ui-cch__used` – when it was last used
6. **Note** `.ui-cch__note` – one line on why it bounced or is flagged
7. **State** `.ui-cch__pill` – the verification state as a tint, a mark and a word
8. **Show** `.ui-cch__reveal` – shows or masks the value again
9. **Copy** `.ui-cch__copy` – copies a shown value
10. **Actions** `.ui-cch__action` – the page's own actions

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight roles. Clean is one
white card with the header as its first row. The masking, pills and buttons are the same in both.

## Usage

### HTML

```html
<tc-contact-channels id="contact" heading="Contact points"></tc-contact-channels>

<script type="module">
  import "@adamstavely/trenchcoat/contact-channels";
  import "@adamstavely/trenchcoat/tokens.css";

  const contact = document.querySelector("#contact");
  contact.channels = [
    { id: "e1", kind: "email", value: "elena.ruiz@example.com", role: "Primary", state: "verified" },
    { id: "p1", kind: "phone", value: "+34 612 448 107", role: "Primary", state: "verified" },
  ];
  contact.actions = [{ id: "message", label: "Message" }];
  contact.addEventListener("tc-action", (e) => console.log(e.detail.action, e.detail.channel.id));
</script>
```

### React / Next.js

```tsx
import { ContactChannels, type ContactChannel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const channels: ContactChannel[] = [
  { id: "e1", kind: "email", value: "elena.ruiz@example.com", role: "Primary", state: "verified" },
  { id: "e2", kind: "email", value: "e.ruiz@work.example", role: "Work", state: "bounced", note: "Bounced twice in May" },
];

export function Contact() {
  return <ContactChannels title="Contact points" channels={channels} onCopy={(channel) => console.log("copied", channel.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/contact-channels";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";

defineProps<{ channels: TcContactChannels["channels"]; states: TcContactChannels["states"] }>();
const onRevealedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-contact-channels :channels="channels" :states="states" @tc-revealed-change="onRevealedChange"></tc-contact-channels>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ContactChannels } from "@adamstavely/trenchcoat/angular/contact-channels";
import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";

@Component({
  selector: "app-contact-channels-example",
  imports: [ContactChannels],
  template: `<tc-contact-channels [channels]="channels()" [states]="states()" (tc-revealed-change)="onRevealedChange($event)"></tc-contact-channels>`,
})
export class ContactChannelsExample {
  readonly channels = input.required<TcContactChannels["channels"]>();
  readonly states = input.required<TcContactChannels["states"]>();
  onRevealedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/contact-channels";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";

  let { channels, states }: { channels: TcContactChannels["channels"]; states: TcContactChannels["states"] } = $props();
  let el: TcContactChannels;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-contact-channels bind:this={el} {channels} {states}></tc-contact-channels>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Contact"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `channels` | – | `ContactChannel[]` | `[]` | The contact points, in order; they're grouped by kind |
| `states` | – | `Record<string, { label: string; tone: ContactTone }>` | `{}` | Verification states' names and tones, merged over the defaults (verified, unverified, bounced, dormant, flagged) |
| `kindLabels` | – | `Partial<Record<ContactKind, string>>` | `{}` | The groups' names, merged over the defaults (Email, Phone, Messaging, Address) |
| `actions` | – | `ContactAction[]` | `[]` | Actions added to every row after Copy, e.g. [{ id: "message", label: "Message" }] |
| `masked` | `masked` | `boolean` | `true` | Masks values until revealed; set false to show them in full |
| `revealed` | – | `string[]` | `[]` | The ids whose values are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-revealed-change` | – | Yes | A value was shown or masked again ({ revealed, id, shown }: ContactRevealedChange); cancelable – prevented, it stays as it was |
| `tc-copy` | – | Yes | Copy was pressed ({ channel, text }: ContactCopy); cancelable – prevented, nothing is copied |
| `tc-action` | – | No | One of the page's actions was pressed ({ action, channel }: ContactActionEvent) |

#### Design tokens it reads (63)

`--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultContactStates: Record<string, { label: string; tone: ContactTone }>` | The verification states' names and tones used when the page gives none |
| `defaultContactKindLabels: Record<ContactKind, string>` | The groups' names used when the page gives none |
| `maskContact(kind: ContactKind, value: string): void` | A value masked by kind: an email keeps its first letter and domain, a phone number its last two digits, an address its last part (the town), a handle its first letter |

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
| `channels` | `el.channels = …;` | `<… channels={…} />` | `<tc-contact-channels :channels="…">` | `<tc-contact-channels [channels]="…">` | `<tc-contact-channels {channels}>` |
| `states` | `el.states = …;` | `<… states={…} />` | `<tc-contact-channels :states="…">` | `<tc-contact-channels [states]="…">` | `<tc-contact-channels {states}>` |
| `kindLabels` | `el.kindLabels = …;` | `<… kindLabels={…} />` | `<tc-contact-channels :kindLabels="…">` | `<tc-contact-channels [kindLabels]="…">` | `<tc-contact-channels {kindLabels}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-contact-channels :actions="…">` | `<tc-contact-channels [actions]="…">` | `<tc-contact-channels {actions}>` |
| `revealed` | `el.revealed = …;` | `<… revealed={…} />` | `<tc-contact-channels :revealed="…">` | `<tc-contact-channels [revealed]="…">` | `<tc-contact-channels {revealed}>` |

*Also attributes: `heading`, `description`, `masked`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-revealed-change` | Yes | `el.addEventListener("tc-revealed-change", (e) => …)` | `ref.current.addEventListener("tc-revealed-change", …)` | `@tc-revealed-change="…"` | `(tc-revealed-change)="…($event)"` | `el.addEventListener("tc-revealed-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopy={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `revealed` itself unless a listener calls `preventDefault()` on `tc-revealed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-contact-channels id="contact-channels"></tc-contact-channels>

<script type="module">
  import "@adamstavely/trenchcoat/contact-channels";

  const el = document.querySelector("#contact-channels");
  el.addEventListener("tc-revealed-change", (e) => {
    e.preventDefault(); // the element keeps its revealed…
    if (allowed(e.detail.revealed)) el.revealed = e.detail.revealed; // …until the app sets it
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
import "@adamstavely/trenchcoat/contact-channels";
import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";

const props = defineProps<{ initial: TcContactChannels["revealed"] }>();
const revealed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRevealedChange = (e: CustomEvent<{ revealed: TcContactChannels["revealed"] }>) => {
  e.preventDefault();
  revealed.value = e.detail.revealed;
};
</script>

<template>
  <tc-contact-channels :revealed="revealed" @tc-revealed-change="onRevealedChange"></tc-contact-channels>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ContactChannels } from "@adamstavely/trenchcoat/angular/contact-channels";
import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";

@Component({
  selector: "app-controlled-contact-channels",
  imports: [ContactChannels],
  template: `<tc-contact-channels [revealed]="revealed()" (tc-revealed-change)="onRevealedChange($event)"></tc-contact-channels>`,
})
export class ControlledContactChannels {
  readonly initial = input.required<TcContactChannels["revealed"]>();
  readonly revealed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRevealedChange(e: CustomEvent<{ revealed: TcContactChannels["revealed"] }>) {
    e.preventDefault();
    this.revealed.set(e.detail.revealed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/contact-channels";
  import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";

  let { initial }: { initial: TcContactChannels["revealed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let revealed = $derived(initial);
  let el: TcContactChannels;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      revealed = (e as CustomEvent<{ revealed: TcContactChannels["revealed"] }>).detail.revealed;
    };
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-contact-channels bind:this={el} {revealed}></tc-contact-channels>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-contact-channels")` returns a `TcContactChannels` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";`
- **React / Next.js:** Props: `import type { ContactChannelsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ContactChannels>`. The element class, for refs: `import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcContactChannels["channels"]` with `import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";`
- **Angular:** The directive types the template: `[channels]` takes `TcContactChannels["channels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcContactChannels } from "@adamstavely/trenchcoat/contact-channels";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `revealed` | `string[]` | The ids whose values are shown – controlled when given |
| `defaultRevealed` | `string[]` | The ids shown on mount when `revealed` isn't controlled |
| `onRevealedChange` | `(revealed: string[]) => void` | A value was shown or masked again; `revealed` is the new list |
| `onCopy` | `(channel: ContactChannel, text: string) => boolean \| void` | Copy was pressed; return false to stop the copy |
| `onAction` | `(action: string, channel: ContactChannel) => void` | One of the page's actions was pressed |

*Renamed or hidden on the wrapper: `heading`, `revealed`, `onCopy`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop across every group; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row, across groups |
| ← / → | Moves between a row's Show, Copy and action buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the value, copies it, or runs the action |
| Tab | Leaves the list |

### Screen readers

Each group is a section named by its kind, holding a list described by “Up and down arrows move between contact
points, left and right between a contact point's buttons”. A masked value reads what's left of it, “at example.com,
hidden”, “ending 07, hidden”, “in Madrid, hidden”; a shown one reads in full. Show is a toggle button (`aria-pressed`)
labelled with the kind and role, “Show Email, Primary”. Copy is labelled “Copy Email, Primary”, then “Copied …” for a
moment. The page's actions are labelled with the row, “Message, Phone, Primary”. Showing, masking and copying are
confirmed in a polite status message.

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
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | internal/util | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |

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
| **This component alone** | 19.2 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.8 KB** | **8.9 KB** |
| With Lit – the first component on a page | 48.6 KB | 16.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.2 ms** | the gallery demo's data, 158 DOM nodes – to layout, median of 7 |
| Typical update | **0.7 ms** | one item of channels replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 24 ms | channels: first render, 1,943 nodes; update 4.2 ms |
| 1,000 items | 105 ms | channels: first render, 19,043 nodes; update 21 ms |

1,000 items of channels: 105 ms. It renders every item, so a first render passes 50 ms (a long task) at about 480 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give every contact point a `role`, so two emails can be told apart while masked.
- Write a `note` for every bounced or flagged contact point, saying what happened: “Bounced twice in May”.
- Keep page actions to one or two short verbs: Message, Call.
- Rename or add states with `states`, and groups with `kindLabels`.

## Do and don't

### Do

- Keep `masked` on wherever contact details are personal data, and log reveals from `tc-revealed-change`.
- Use `tc-copy` to log copies, or call `preventDefault()` to stop them for people without access.
- Show Dormant and Bounced contact points rather than hiding them, so nobody relies on them by mistake.

### Don't

- Don't put the full value in `note` or `role`; that defeats the masking.
- Don't use the verification tones for anything but how far a contact point is verified.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Related

- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
- [Asset List](asset-list.md) – The assets on record for a person, an account or a company, in groups – each with its kind, name, an identifier masked to its last four characters until shown, a detail line, what it's linked to and a status in words, with Open per row
- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
