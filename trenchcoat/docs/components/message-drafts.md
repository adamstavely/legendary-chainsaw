<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Message Drafts

**AI & chat** · New

A short text message drafted in two to four tones – edit in place with its length in characters and SMS messages (GSM or Unicode), then Copy, Send or Open in Messages; sending folds it into a receipt

- **Element:** `<tc-message-drafts>`
- **Size:** 8.0 KB gzip · 23.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/message-drafts";` |
| React / Next.js | `import { MessageDrafts } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/message-drafts";` · tags starting with tc- are custom elements |
| Angular | `import { MessageDrafts } from "@adamstavely/trenchcoat/angular/message-drafts";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/message-drafts";` |

## Example

The live example is in the gallery at `#/message-drafts`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A short text message an assistant drafted, in two to four variants – Friendly, Brief, Formal – ready to send. Each
variant has a tab; the message is edited in place, with its length underneath in characters and in SMS messages. Copy
puts it on the clipboard, Send hands it to your app, and Open in Messages (optional) opens the phone's messaging app
with the text filled in. Once sent, the card folds into a receipt with Write another.

The SMS count follows the standard: 160 characters per message in the GSM alphabet (153 each once it's split), 70
once the text needs Unicode – an emoji, a curly quote, most non-Latin scripts (67 each once split).

### When to use

- The result of a "draft a text to…" tool in an assistant.
- Any short message where people pick a tone and send.

### When not to use

- Emails, with subjects, recipients and attachments – use [Email Draft](email-draft.md).
- Writing a message to the assistant itself – use [Chat Composer](chat-composer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-mdr__tabs` – one per variant, named by its tone
2. **Message** `.ui-mdr__text` – the draft, edited in place
3. **Length** `.ui-mdr__meta` – characters and SMS messages, and "(Unicode)" when it needs it
4. **Actions** `.ui-mdr__actions` – Copy, Open in Messages and Send
5. **Receipt** `.ui-mdr__sent` – after Send: who it went to, the message, and Write another

## Looks

Standard sets the header (the recipient and number) on a gray tray above a white card; Clean is one white card with
the header as its first row. The length turns to the warning colour once the message takes more than one SMS. Narrow,
the actions fill the width.

## Usage

### HTML

```html
<tc-message-drafts recipient="Sam Okafor" to="+1 555 0142" open-link></tc-message-drafts>
<script type="module">
  const drafts = document.querySelector("tc-message-drafts");
  drafts.variants = [
    { id: "friendly", tone: "Friendly", text: "Hi Sam! We've moved the audit review to Thursday at 2pm – does that still work?" },
    { id: "brief", tone: "Brief", text: "Audit review moved to Thu 2pm. OK for you?" },
  ];
  drafts.addEventListener("tc-send", (e) => console.log("Send", e.detail.text, "to", e.detail.to));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { MessageDrafts, type MessageVariant } from "@adamstavely/trenchcoat/react";

export function Reschedule({ drafts }: { drafts: MessageVariant[] }) {
  const [selected, setSelected] = useState(drafts[0]?.id);
  return (
    <MessageDrafts
      recipient="Sam Okafor"
      to="+1 555 0142"
      defaultVariants={drafts}
      selected={selected}
      onSelectedChange={setSelected}
      onSend={({ text, to }) => console.log("Send", text, "to", to)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/message-drafts";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";

defineProps<{ variants: TcMessageDrafts["variants"]; labels: TcMessageDrafts["labels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-message-drafts :variants="variants" :labels="labels" @tc-selected-change="onSelectedChange"></tc-message-drafts>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { MessageDrafts } from "@adamstavely/trenchcoat/angular/message-drafts";
import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";

@Component({
  selector: "app-message-drafts-example",
  imports: [MessageDrafts],
  template: `<tc-message-drafts [variants]="variants()" [labels]="labels()" (tc-selected-change)="onSelectedChange($event)"></tc-message-drafts>`,
})
export class MessageDraftsExample {
  readonly variants = input.required<TcMessageDrafts["variants"]>();
  readonly labels = input.required<TcMessageDrafts["labels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/message-drafts";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";

  let { variants, labels }: { variants: TcMessageDrafts["variants"]; labels: TcMessageDrafts["labels"] } = $props();
  let el: TcMessageDrafts;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-message-drafts bind:this={el} {variants} {labels}></tc-message-drafts>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `` | – | The heading |
| `recipient` | `recipient` | `string \| undefined` | `undefined` | Who it's for, by name |
| `to` | `to` | `string \| undefined` | `undefined` | Their number – used in Send's event and the sms: link |
| `variants` | – | `MessageVariant[]` | `[]` | The drafts, two to four; more are left out |
| `selected` | `selected` | `string \| undefined` | `undefined` | The variant shown, by id. Changed by the user unless tc-selected-change is prevented |
| `openLink` | `open-link` | `boolean` | `false` | Shows Open in Messages, an sms: link with the text filled in |
| `status` | `status` | `"draft" \| "sent"` | `"draft"` | Draft or sent – Send moves it to sent; set it back to "draft" to write again |
| `labels` | – | `Partial<MessageDraftsLabels>` | `{}` | Words to use instead of the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | Another variant was picked ({ selected }: MessageSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-variants-change` | – | Yes | A variant's text was edited ({ variants, id }: MessageVariantsChange); cancelable – prevented, `variants` stays as it was |
| `tc-send` | – | Yes | Send was pressed ({ variant, text, to }: MessageSend); cancelable – prevented, the draft stays open |
| `tc-copy-text` | – | Yes | Copy was pressed ({ variant, text }: MessageCopy); cancelable – prevented, nothing is copied here |

#### Design tokens it reads (62)

`--tc-accent-subtle`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-xl`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `smsLength(text: string): SmsLength` | How long a text message is: characters, how many SMS messages it takes, and whether it needs Unicode |
| `smsHref(to: string \| undefined, text: string): void` | An sms: link for `to` with the text filled in |

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
| `variants` | `el.variants = …;` | `<… variants={…} />` | `<tc-message-drafts :variants="…">` | `<tc-message-drafts [variants]="…">` | `<tc-message-drafts {variants}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-message-drafts :labels="…">` | `<tc-message-drafts [labels]="…">` | `<tc-message-drafts {labels}>` |

*Also attributes: `heading`, `recipient`, `to`, `selected`, `open-link`, `status` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-variants-change` | Yes | `el.addEventListener("tc-variants-change", (e) => …)` | `onVariantsChange={…}` | `@tc-variants-change="…"` | `(tc-variants-change)="…($event)"` | `el.addEventListener("tc-variants-change", …)` |
| `tc-send` | Yes | `el.addEventListener("tc-send", (e) => …)` | `onSend={…}` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-copy-text` | Yes | `el.addEventListener("tc-copy-text", (e) => …)` | `onCopyText={…}` | `@tc-copy-text="…"` | `(tc-copy-text)="…($event)"` | `el.addEventListener("tc-copy-text", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `variants` and `selected` itself unless a listener calls `preventDefault()` on `tc-variants-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-message-drafts id="message-drafts"></tc-message-drafts>

<script type="module">
  import "@adamstavely/trenchcoat/message-drafts";

  const el = document.querySelector("#message-drafts");
  el.addEventListener("tc-variants-change", (e) => {
    e.preventDefault(); // the element keeps its variants…
    if (allowed(e.detail.variants)) el.variants = e.detail.variants; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { MessageDrafts } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof MessageDrafts>;
type Props = Omit<Own, "variants" | "onVariantsChange"> & { initial: NonNullable<Own["variants"]> };

// Controlled: passing variants makes the wrapper prevent the element's own change; the app sets it
export function ControlledMessageDrafts({ initial, ...props }: Props) {
  const [variants, setVariants] = useState<Own["variants"]>(initial);
  return <MessageDrafts {...props} variants={variants} onVariantsChange={(next) => setVariants(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/message-drafts";
import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";

const props = defineProps<{ initial: TcMessageDrafts["variants"] }>();
const variants = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onVariantsChange = (e: CustomEvent<{ variants: TcMessageDrafts["variants"] }>) => {
  e.preventDefault();
  variants.value = e.detail.variants;
};
</script>

<template>
  <tc-message-drafts :variants="variants" @tc-variants-change="onVariantsChange"></tc-message-drafts>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { MessageDrafts } from "@adamstavely/trenchcoat/angular/message-drafts";
import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";

@Component({
  selector: "app-controlled-message-drafts",
  imports: [MessageDrafts],
  template: `<tc-message-drafts [variants]="variants()" (tc-variants-change)="onVariantsChange($event)"></tc-message-drafts>`,
})
export class ControlledMessageDrafts {
  readonly initial = input.required<TcMessageDrafts["variants"]>();
  readonly variants = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onVariantsChange(e: CustomEvent<{ variants: TcMessageDrafts["variants"] }>) {
    e.preventDefault();
    this.variants.set(e.detail.variants);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/message-drafts";
  import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";

  let { initial }: { initial: TcMessageDrafts["variants"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let variants = $derived(initial);
  let el: TcMessageDrafts;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      variants = (e as CustomEvent<{ variants: TcMessageDrafts["variants"] }>).detail.variants;
    };
    el.addEventListener("tc-variants-change", on);
    return () => el.removeEventListener("tc-variants-change", on);
  });
</script>

<tc-message-drafts bind:this={el} {variants}></tc-message-drafts>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-message-drafts")` returns a `TcMessageDrafts` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";`
- **React / Next.js:** Props: `import type { MessageDraftsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof MessageDrafts>`. The element class, for refs: `import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMessageDrafts["variants"]` with `import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";`
- **Angular:** The directive types the template: `[variants]` takes `TcMessageDrafts["variants"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMessageDrafts } from "@adamstavely/trenchcoat/message-drafts";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `variants` | `MessageVariant[]` | The drafts – controlled when given: every edit reports the next list through onVariantsChange |
| `defaultVariants` | `MessageVariant[]` | The drafts on mount when `variants` isn't controlled |
| `onVariantsChange` | `(next: MessageVariant[], id: string) => void` | A draft was edited; `next` is the list as it will be |
| `selected` | `string` | The variant shown, by id – controlled when given |
| `defaultSelected` | `string` | The variant on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string) => void` | Another variant was picked |
| `onSend` | `(send: MessageSend) => boolean \| void` | Send was pressed; return false to keep the draft open (to send it yourself, then set `status`) |
| `onCopyText` | `(copy: MessageCopy) => boolean \| void` | Copy was pressed; return false to copy it yourself |

*Renamed or hidden on the wrapper: `heading`, `variants`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | Does |
| --- | --- |
| ← / → / Home / End on the tabs | Picks another variant |
| Tab | From the tabs into the message, then Copy, Open in Messages and Send |

### Screen readers

- The variants are a `tablist`; the message area is their `tabpanel`. The text area is named for its tone ("Brief
  message") and described by its length.
- Copying and sending are announced in a polite status line ("Copied: Brief", "Sent to Sam Okafor"). After sending,
  focus moves to Write another.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | itself | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 16.3 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **23.7 KB** | **8.0 KB** |
| With Lit – the first component on a page | 44.4 KB | 14.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.7 ms** | the gallery demo's data, 35 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of variants replaced |
| First on the page | 8.0 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.8 ms | variants: first render, 36 nodes; update 0.0 ms |
| 1,000 items | 0.7 ms | variants: first render, 36 nodes; update 0.0 ms |

1,000 items of variants: 0.7 ms, 36 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Give each variant a one-word tone people can choose between.
- Keep drafts to one SMS when you can – the length line shows when they aren't.
- Give `to` in international form (+1 555 0142) so the sms: link works on every phone.

## Do and don't

### Do

- Send it yourself in `tc-send` (or `onSend`) and set `status` back to `draft` if it fails.
- Keep `variants` in your store when edits should survive (`tc-variants-change`).

### Don't

- Send without the person pressing Send.
- Offer more than four variants – the extra ones aren't shown.

## Related

- [Email Draft](email-draft.md) – Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Chat Composer](chat-composer.md) – Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane
- [Recipe Card](recipe-card.md) – A recipe ready to cook from – servings that scale every quantity (½, 1⅓), metric or imperial with oven temperatures converted, ingredients to tick off, and numbered steps with the current one marked and timers on the steps that name a time
