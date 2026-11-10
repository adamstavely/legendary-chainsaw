<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Guardrail Notice

**AI & chat** · New

When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review

- **Element:** `<tc-guardrail-notice>`
- **Size:** 9.1 KB gzip · 32.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/guardrail-notice";` |
| React / Next.js | `import { GuardrailNotice } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/guardrail-notice";` · tags starting with tc- are custom elements |
| Angular | `import { GuardrailNotice } from "@adamstavely/trenchcoat/angular/guardrail-notice";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/guardrail-notice";` |

## Example

The live example is in the gallery at `#/guardrail-notice`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Tells people, where it happened, that a policy blocked, redacted or rewrote something – a message they sent, a reply
the model wrote, a draft on its way out. It names the policy, says why in a sentence, and on request shows what
changed: the original next to what went out instead, with personal data already masked by the app. Request review
lets people ask for a person to look at the decision again, so a guardrail that got it wrong has a way back.

### When to use

- A model's reply or a person's message was stopped or changed by a content, privacy or security policy.
- Personal data was taken out of something before it was shown, stored or sent.
- A whole view is affected – sharing turned off for a draft, a workspace under a policy – as a `layout="banner"`.

### When not to use

- Asking before an agent does something consequential – use [Approval Card](approval-card.md).
- An agent asking for a right it doesn't have yet – use [Permission Request](permission-request.md).
- Showing an edit a person can accept or reject – use [Inline Diff](inline-diff.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Icon** `.ui-grn__icon` – blocked, redacted or rewritten, in the action's tone
2. **Heading and policy** `.ui-grn__titles` – “Redacted by policy” and the policy's name, a link when it has a page
3. **Reason** `.ui-grn__reason` – why the policy acted, in a sentence
4. **What changed** `.ui-grn__changes` – the original and what went out, side by side, with removed, added and masked runs marked
5. **Actions** `.ui-grn__actions` – Show what changed, and Request review (then “Review requested”)

## Looks

Standard sets the notice on a white card in the gray tray with the buttons on the tray below it; as a banner it is
one band in the action's tone. Clean is one white card with a thin rule in the action's tone down its left edge,
lighter type and thinner icons; inline, its buttons sit in its last row.

## Usage

### HTML

```html
<tc-guardrail-notice id="notice" action="redacted" policy="Personal data" reason="The reply quoted a customer's card number."></tc-guardrail-notice>

<script type="module">
  import "@adamstavely/trenchcoat/guardrail-notice";
  import "@adamstavely/trenchcoat/tokens.css";

  const notice = document.querySelector("#notice");
  notice.original = [{ text: "Refunded to the card ending " }, { text: "•••• 4821", mark: "masked" }];
  notice.revised = [{ text: "Refunded to the " }, { text: "card on file", mark: "added" }];
  notice.addEventListener("tc-review-request", (e) => openReview(e.detail.policy));
</script>
```

### React / Next.js

```tsx
import { GuardrailNotice, type GuardrailSegment } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function RedactedReply({ original, revised, review }: { original: GuardrailSegment[]; revised: GuardrailSegment[]; review: (policy: string) => void }) {
  return (
    <GuardrailNotice
      action="redacted"
      policy="Personal data"
      reason="The reply quoted a customer's card number."
      original={original}
      revised={revised}
      onRequestReview={(detail) => review(detail.policy)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/guardrail-notice";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";

defineProps<{ original: TcGuardrailNotice["original"]; revised: TcGuardrailNotice["revised"] }>();
const onOpenChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-guardrail-notice :original="original" :revised="revised" @tc-open-change="onOpenChange"></tc-guardrail-notice>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { GuardrailNotice } from "@adamstavely/trenchcoat/angular/guardrail-notice";
import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";

@Component({
  selector: "app-guardrail-notice-example",
  imports: [GuardrailNotice],
  template: `<tc-guardrail-notice [original]="original()" [revised]="revised()" (tc-open-change)="onOpenChange($event)"></tc-guardrail-notice>`,
})
export class GuardrailNoticeExample {
  readonly original = input.required<TcGuardrailNotice["original"]>();
  readonly revised = input.required<TcGuardrailNotice["revised"]>();
  onOpenChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/guardrail-notice";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";

  let { original, revised }: { original: TcGuardrailNotice["original"]; revised: TcGuardrailNotice["revised"] } = $props();
  let el: TcGuardrailNotice;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-guardrail-notice bind:this={el} {original} {revised}></tc-guardrail-notice>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `action` | `action` | `GuardrailAction` | `"blocked"` | What the policy did: blocked the content, redacted parts of it or rewrote it – sets the icon, tone and wording |
| `layout` | `layout` | `GuardrailLayout` | `"inline"` | Where it sits: "inline" in a thread, where the content would have been, or "banner" across the top of a view |
| `heading` | `heading` | `string \| undefined` | `undefined` | The heading – "Blocked by policy", "Redacted by policy" or "Rewritten by policy" by default |
| `policy` | `policy` | `string` | `""` | The policy that acted, by the name people know it by, e.g. "Personal data" |
| `policyHref` | `policy-href` | `string \| undefined` | `undefined` | A link to the policy itself; the policy name becomes the link |
| `reason` | `reason` | `string \| undefined` | `undefined` | Why the policy acted, in a sentence |
| `original` | – | `GuardrailText \| undefined` | `undefined` | The content as it was, with personal data already masked by the app – text, or segments |
| `revised` | – | `GuardrailText \| undefined` | `undefined` | The content as it went out – text, or segments; leave it out when nothing went out |
| `originalLabel` | `original-label` | `string` | `"Original"` | The label over the original |
| `revisedLabel` | `revised-label` | `string \| undefined` | `undefined` | The label over what went out – "Shown instead", "After redaction" or "Rewritten" by default |
| `open` | `open` | `boolean` | `false` | Whether the before / after is showing |
| `reviewable` | `reviewable` | `boolean` | `true` | Offers Request review; set it to false where there is no one to review |
| `requested` | `requested` | `boolean` | `false` | A review has been requested: the button shows "Review requested" and is off |
| `reviewLabel` | `review-label` | `string` | `"Request review"` | The label of the review button |
| `requestedLabel` | `requested-label` | `string` | `"Review requested"` | What the button says once a review is requested |
| `dismissible` | `dismissible` | `boolean` | `false` | Shows a close button that fires tc-dismiss |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open-change` | – | Yes | "Show what changed" opened or closed the before / after. Cancelable. Detail: GuardrailOpenChange ({ open }) |
| `tc-review-request` | – | Yes | Request review was pressed. Cancelable: unless prevented, the button turns into "Review requested". Detail: GuardrailReviewRequest ({ action, policy }) |
| `tc-dismiss` | – | No | The close button of a dismissible notice was pressed; remove the notice in answer; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-guardrail-notice-icon` | `24px` | both, clean |
| `--tc-guardrail-notice-fg` | `var(--tc-status-danger-fg)` | both |
| `--tc-guardrail-notice-bg` | `var(--tc-status-danger-bg)` | both |
| `--tc-guardrail-notice-border` | `var(--tc-status-danger-border)` | both |

#### Design tokens it reads (87)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-border`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-border`, `--tc-status-warning-fg`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tracking-caps`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `original` | `el.original = …;` | `<… original={…} />` | `<tc-guardrail-notice :original="…">` | `<tc-guardrail-notice [original]="…">` | `<tc-guardrail-notice {original}>` |
| `revised` | `el.revised = …;` | `<… revised={…} />` | `<tc-guardrail-notice :revised="…">` | `<tc-guardrail-notice [revised]="…">` | `<tc-guardrail-notice {revised}>` |

*Also attributes: `action`, `layout`, `heading`, `policy`, `policy-href`, `reason`, `original-label`, `revised-label` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-review-request` | Yes | `el.addEventListener("tc-review-request", (e) => …)` | `onRequestReview={…}` | `@tc-review-request="…"` | `(tc-review-request)="…($event)"` | `el.addEventListener("tc-review-request", …)` |
| `tc-dismiss` | No | `el.addEventListener("tc-dismiss", (e) => …)` | `onDismiss={…}` | `@tc-dismiss="…"` | `(tc-dismiss)="…($event)"` | `el.addEventListener("tc-dismiss", …)` |

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-guardrail-notice id="guardrail-notice"></tc-guardrail-notice>

<script type="module">
  import "@adamstavely/trenchcoat/guardrail-notice";

  const el = document.querySelector("#guardrail-notice");
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
import { GuardrailNotice } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof GuardrailNotice>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledGuardrailNotice({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <GuardrailNotice {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/guardrail-notice";
import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";

const props = defineProps<{ initial: TcGuardrailNotice["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcGuardrailNotice["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-guardrail-notice :open="open" @tc-open-change="onOpenChange"></tc-guardrail-notice>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { GuardrailNotice } from "@adamstavely/trenchcoat/angular/guardrail-notice";
import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";

@Component({
  selector: "app-controlled-guardrail-notice",
  imports: [GuardrailNotice],
  template: `<tc-guardrail-notice [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-guardrail-notice>`,
})
export class ControlledGuardrailNotice {
  readonly initial = input.required<TcGuardrailNotice["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcGuardrailNotice["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/guardrail-notice";
  import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";

  let { initial }: { initial: TcGuardrailNotice["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcGuardrailNotice;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcGuardrailNotice["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-guardrail-notice bind:this={el} {open}></tc-guardrail-notice>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-guardrail-notice")` returns a `TcGuardrailNotice` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";`
- **React / Next.js:** Props: `import type { GuardrailNoticeProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof GuardrailNotice>`. The element class, for refs: `import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcGuardrailNotice["original"]` with `import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";`
- **Angular:** The directive types the template: `[original]` takes `TcGuardrailNotice["original"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcGuardrailNotice } from "@adamstavely/trenchcoat/guardrail-notice";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – "Blocked by policy", "Redacted by policy" or "Rewritten by policy" by default |
| `open` | `boolean` | Whether the before / after is showing. Controlled when defined |
| `defaultOpen` | `boolean` | Whether it shows at first when uncontrolled – closed by default |
| `onOpenChange` | `(open: boolean) => void` | "Show what changed" opened or closed the before / after |
| `onRequestReview` | `(detail: GuardrailReviewRequest, event: Event) => void` | Request review was pressed; call event.preventDefault() to keep the button as it is (set `requested` yourself) |
| `onDismiss` | `() => void` | Shows a close button; called when it's pressed – remove the notice in answer |

*Renamed or hidden on the wrapper: `heading`, `dismissible`, `Blocked by policy`, `Redacted by policy`, `Rewritten by policy`, `Show what changed`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab / Shift Tab | Moves between the policy link, Dismiss, Show what changed and Request review – each a native link or button |
| Enter / Space | On Show what changed: opens or closes the original and what went out |
| Enter / Space | On Request review: asks for a review; focus stays on “Review requested” |
| Enter / Space | On Dismiss: fires `tc-dismiss` |

### Screen readers

The notice is a `group` (inline) or a `region` (banner) named by its heading, “Redacted by policy”. The policy reads
as “Policy: Personal data”. Show what changed is a disclosure button with `aria-expanded` and `aria-controls`. In the
before and after, removed text is a `del` read with “Removed: ”, added text an `ins` with “Added: ”, and masked text
is read with “Masked: ” before what the app gave (“Masked: •••• 4821”). After Request review, a status region says
“Review requested. The Personal data decision will be looked at again.” The close button is named “Dismiss”.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: pretty | 117 | No | 26 | 26 | itself | Paragraphs may end on a single short word. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 24.1 KB | 6.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **32.0 KB** | **9.2 KB** |
| With Lit – the first component on a page | 51.6 KB | 15.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.6 ms** | the gallery demo's data, 35 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of original replaced |
| First on the page | 8.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.9 ms | original: first render, 99 nodes; update 0.1 ms |
| 1,000 items | 1.9 ms | original: first render, 699 nodes; update 0.3 ms |

1,000 items of original: 1.9 ms, 699 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the policy the way people in your product know it: “Personal data”, “External sharing” – not a rule ID.
- Write `reason` about the content, not the person: “The reply quoted a card number”, not “You shared a card number”.
- Mask personal data before it reaches the element; it shows exactly what it's given. Mark masked runs with
  `mark: "masked"` so they read as withheld, not as text.
- Leave `revised` out when nothing went out; the notice says “Nothing”.
- Keep the headings as they are unless your product has its own word: “Blocked by policy” says who acted.

## Do and don't

### Do

- Put an inline notice where the content would have been, so the thread still reads in order.
- Answer `tc-review-request` by opening a review; set `reviewable` to false where no one can review.
- Link the policy with `policy-href` when it has a page people can read.

### Don't

- Don't show unmasked personal data in the original to explain the redaction – that undoes it.
- Don't stack several banners; one banner for the view, inline notices for each piece of content.
- Don't use the notice for errors that aren't policy decisions – a timeout isn't a guardrail.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo

## Changelog

- **`trenchcoat lint`:** `="false"` on a boolean that's on by default (`sort` and `list` on `tc-segmented-bar`, `reviewable` on `tc-guardrail-notice`) is no longer a `boolean-attribute` error: those read "false" as off.
- **Quality, retrieval, safety, structured output and conversation:** `tc-eval-scorecard`, `tc-feedback-rubric`, `tc-retrieval-inspector`, `tc-extraction-review`, `tc-guardrail-notice`, `tc-clarifying-questions`, `tc-structured-output`, `tc-generated-ui` and `tc-prompt-starters`.
