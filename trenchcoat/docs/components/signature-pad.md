<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Signature Pad

**Inputs & controls** · New

A form field for signing – draw with a mouse, pen or finger in ink that follows speed and pressure, or type the name in a script face; undo and clear, the signer, the date and a statement below, submitted with the form, and exported as SVG or an image

- **Element:** `<tc-signature-pad>`
- **Size:** 9.6 KB gzip · 29.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/signature-pad";` |
| React / Next.js | `import { SignaturePad } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/signature-pad";` · tags starting with tc- are custom elements |
| Angular | `import { SignaturePad } from "@adamstavely/trenchcoat/angular/signature-pad";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/signature-pad";` |

## Example

The live example is in the gallery at `#/signature-pad`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A form field for signing. People draw their signature on a pad with a mouse, pen or finger – the ink thins as the
stroke speeds up and thickens with a pen's pressure – or type their name and see it set in a script face. Undo takes
the last stroke away and Clear empties the pad. Under the pad sit the signer's name, the date and an optional statement
of what signing means. It is a form control: it submits the signature as JSON under `name`, checks `required`, and
clears on a form reset. `toSVG()` and `toDataURL()` export what was signed.

### When to use

- Agreements, consent forms, approvals and hand-overs that need a signature in the person's own hand.
- The last step of a flow that collects an acceptance – a data-access agreement, a delivery receipt, a waiver.
- Anywhere a typed name is acceptable as a signature too, with `allow-typed`.

### When not to use

- Accepting terms with a checkbox and a button – use [Terms Dialog](terms-dialog.md).
- Recording consent to a policy as settings – use [Data handling policy](data-handling-policy.md).
- Verifying who someone is – a drawn signature proves nothing on its own; use [OTP Input](otp-input.md) or your sign-in.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Pad** `.ui-sigp__surface` – where the ink goes; a baseline, an “×” and “Sign here” until something is drawn
2. **Ink** `.ui-sigp__ink` – the strokes, drawn from the stored value; `.ui-sigp__stroke` is one stroke
3. **Toolbar** `.ui-sigp__tools` – Undo, Clear and “Type instead” (`.ui-sigp__mode`)
4. **Typed field** `.ui-sigp__typed` – the name field that replaces the pad in typed mode
5. **Signer and date** `.ui-sigp__meta` – the `signer` line and the date
6. **Statement** `.ui-sigp__statement` – what signing means, from `statement`
7. **Error** `.ui-sigp__error` – `error-message`, while `invalid`

## Looks

Standard puts the header on the gray tray above a white card that holds the pad, the toolbar and the signer line.
Clean is one white card with the header as its first row. In both the pad is a sunken field with a dashed baseline and
the ink is the strongest text colour, so it follows light and dark themes.

Component tokens a page can override on the element: `--tc-sigp-pad-h` (the pad's height, 160 px),
`--tc-sigp-pad-min-h` (its height in narrow containers, 120 px), `--tc-sigp-line-inset` (how far the baseline sits
above the bottom) and `--tc-sigp-script-font` (the font stack for typed signatures).

## Usage

### HTML

```html
<form>
  <tc-signature-pad
    name="signature"
    required
    allow-typed
    heading="Data-access agreement"
    signer="Noor Haddad, Research fellow"
    statement="By signing, you agree to handle the restricted survey data as set out in section 4."
  ></tc-signature-pad>
  <button type="submit">Sign agreement</button>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/signature-pad";
  import "@adamstavely/trenchcoat/tokens.css";

  const pad = document.querySelector("tc-signature-pad");
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    const svg = pad.toSVG();
    fetch("/api/agreements/42/signature", { method: "POST", body: svg });
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SignaturePad, type SignatureValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AgreementSignature() {
  const [signature, setSignature] = useState<SignatureValue | null>(null);
  return (
    <form onSubmit={(e) => { e.preventDefault(); void fetch("/api/agreements/42/signature", { method: "POST", body: JSON.stringify(signature) }); }}>
      <SignaturePad
        name="signature"
        required
        allowTyped
        title="Data-access agreement"
        signer="Noor Haddad, Research fellow"
        statement="By signing, you agree to handle the restricted survey data as set out in section 4."
        value={signature}
        onValueChange={setSignature}
      />
      <button type="submit" disabled={!signature}>Sign agreement</button>
    </form>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/signature-pad";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";

defineProps<{ value: TcSignaturePad["value"]; labels: TcSignaturePad["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-signature-pad :value="value" :labels="labels" @tc-value-change="onValueChange"></tc-signature-pad>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SignaturePad } from "@adamstavely/trenchcoat/angular/signature-pad";
import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";

@Component({
  selector: "app-signature-pad-example",
  imports: [SignaturePad],
  template: `<tc-signature-pad [value]="value()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-signature-pad>`,
})
export class SignaturePadExample {
  readonly value = input.required<TcSignaturePad["value"]>();
  readonly labels = input.required<TcSignaturePad["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/signature-pad";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";

  let { value, labels }: { value: TcSignaturePad["value"]; labels: TcSignaturePad["labels"] } = $props();
  let el: TcSignaturePad;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-signature-pad bind:this={el} {value} {labels}></tc-signature-pad>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Signature"` | The title above the pad |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the title: what is being signed |
| `value` | – | `SignatureValue \| null` | `null` | The signature: drawn strokes or typed text; null when empty |
| `allowTyped` | `allow-typed` | `boolean` | `false` | Shows the “Type instead” toggle to pointer users; keyboard users can always reach it |
| `signer` | `signer` | `string \| undefined` | `undefined` | The signer's name, under the pad – also the suggestion when typing |
| `date` | `date` | `number \| undefined` | `undefined` | The date shown beside the name (epoch ms); by default today |
| `now` | `now` | `number \| undefined` | `undefined` | “Now” for today's date (epoch ms); by default the element's own clock |
| `statement` | `statement` | `string \| undefined` | `undefined` | What signing means, under the name: a short legal statement |
| `required` | `required` | `boolean` | `false` | Blocks an empty form submit |
| `disabled` | `disabled` | `boolean` | `false` | No input, the buttons disabled |
| `readonly` | `readonly` | `boolean` | `false` | Shows the signature with no way to change it: no buttons, no drawing |
| `invalid` | `invalid` | `boolean` | `false` | Marks the field as wrong and shows `error-message` |
| `errorMessage` | `error-message` | `string` | `"Sign to continue."` | The message under the pad while `invalid` |
| `name` | `name` | `string` | `""` | The form field's name; the value is submitted as JSON |
| `labels` | – | `Partial<SignatureLabels>` | `{}` | Words the page can rename (merged over defaultSignatureLabels) |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for the date, e.g. "de"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The signature changed: a stroke ended, undo, clear or typing ({ value }: SignatureValueChange); cancelable – prevented, the value stays as it was |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `undo()` | `void` | Removes the last stroke |
| `clear()` | `void` | Empties the pad (and the typed name) |
| `toSVG()` | `string \| null` | The signature as a standalone SVG document (the ink in the current text colour); null when unsigned |
| `toDataURL(type: unknown, quality?: number)` | `string \| null` | The signature as an image (PNG unless `type` says otherwise), at the screen's pixel density; null when unsigned |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sigp-script-font` | `"Segoe Script", "Bradley Hand", "Snell Roundhand", "Brush Script MT", "Apple Chancery", cursive` | both |
| `--tc-sigp-pad-h` | `var(--tc-sigp-pad-min-h)` | both |
| `--tc-sigp-pad-min-h` | `120px` | both |
| `--tc-sigp-line-inset` | `28%` | both |

#### Design tokens it reads (46)

`--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-lg`, `--tc-duration-base`, `--tc-ease-out`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-font-sans`, `--tc-font-size-3xl`, `--tc-font-size-4xl`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSignatureLabels: object` | The words on the pad and its buttons; a page can rename any of them |
| `strokePath(points: SignaturePoint[], w: number, h: number, base: unknown): string` | A stroke's outline as one filled path: two edges offset by the width at each point, round caps at both ends |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-signature-pad :value="…">` | `<tc-signature-pad [value]="…">` | `<tc-signature-pad {value}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-signature-pad :labels="…">` | `<tc-signature-pad [labels]="…">` | `<tc-signature-pad {labels}>` |

*Also attributes: `heading`, `description`, `allow-typed`, `signer`, `date`, `now`, `statement`, `required` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-signature-pad id="signature-pad"></tc-signature-pad>

<script type="module">
  import "@adamstavely/trenchcoat/signature-pad";

  const el = document.querySelector("#signature-pad");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SignaturePad } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SignaturePad>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledSignaturePad({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <SignaturePad {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/signature-pad";
import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";

const props = defineProps<{ initial: TcSignaturePad["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcSignaturePad["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-signature-pad :value="value" @tc-value-change="onValueChange"></tc-signature-pad>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SignaturePad } from "@adamstavely/trenchcoat/angular/signature-pad";
import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";

@Component({
  selector: "app-controlled-signature-pad",
  imports: [SignaturePad],
  template: `<tc-signature-pad [value]="value()" (tc-value-change)="onValueChange($event)"></tc-signature-pad>`,
})
export class ControlledSignaturePad {
  readonly initial = input.required<TcSignaturePad["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcSignaturePad["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/signature-pad";
  import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";

  let { initial }: { initial: TcSignaturePad["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcSignaturePad;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcSignaturePad["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-signature-pad bind:this={el} {value}></tc-signature-pad>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-signature-pad :value="value" @tc-value-change="value = $event.detail.value"></tc-signature-pad>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-signature-pad [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-signature-pad>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-signature-pad bind:this={el} {value}></tc-signature-pad>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-signature-pad")` returns a `TcSignaturePad` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";`
- **React / Next.js:** Props: `import type { SignaturePadProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SignaturePad>`. The element class, for refs: `import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSignaturePad["value"]` with `import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";`
- **Angular:** The directive types the template: `[value]` takes `TcSignaturePad["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSignaturePad } from "@adamstavely/trenchcoat/signature-pad";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The title above the pad |
| `value` | `SignatureValue \| null` | The signature. Controlled when defined (null for none); otherwise the pad keeps its own, starting at `defaultValue` |
| `defaultValue` | `SignatureValue \| null` | Starting signature when uncontrolled |
| `onValueChange` | `(value: SignatureValue \| null) => void` | Called when a stroke ends, on undo or clear, and as the name is typed |

*Renamed or hidden on the wrapper: `heading`, `value`, `defaultValue`, `onChange`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Undo, Clear and “Type instead” – the toggle is always reachable, even when `allow-typed` hides it from pointer users |
| Enter / Space | Presses the focused button; on “Type instead” the name field appears and takes focus |
| Typing | In typed mode, the name becomes the signature as you type |
| Enter / Space on “Draw instead” | Returns to the pad; the typed signature stays until something is drawn |

Drawing needs a pointer. Typed mode is the keyboard's way to sign, which is why its toggle never leaves the tab order:
without `allow-typed` it is hidden until it has focus, like a skip link.

### Screen readers

The pad is an image named by the heading and its state: “Signature: Not signed yet”, “Signature: Signed”, or
“Signature: Signed: Noor Haddad” for a typed one. The toolbar is a `toolbar` named by the heading, and its buttons are
named by their visible words; “Type instead” is a toggle (`aria-pressed`). The typed field is labelled “Type your full
name”. The error and the statement describe the pad and the field (`aria-describedby`). A polite live region says
“Last stroke removed” after Undo and “Signature cleared” after Clear. The date is read with the word “Date”.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
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

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 21.5 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.0 KB** | **9.6 KB** |
| With Lit – the first component on a page | 49.7 KB | 16.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.9 ms** | the gallery demo's data, 30 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | re-render with the same data |
| First on the page | 18 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Make the heading what is being signed – “Data-access agreement”, “Delivery receipt” – not just “Signature”.
- Put the full name and role in `signer`: “Noor Haddad, Research fellow”.
- Keep `statement` to one or two sentences that say what signing commits the person to, and link the full text nearby.
- Write the error as what to do: “Sign to continue.”

## Do and don't

### Do

- Store the value (or its SVG) with the record it signs, along with who signed and when.
- Turn on `allow-typed` when a typed name is legally acceptable – it is faster on desktop and the only way for some
  people.
- Show a stored signature with `readonly` on the countersigned copy.

### Don't

- Don't treat a drawn signature as proof of identity on its own.
- Don't make the pad smaller than its minimum height – people need room to sign with a finger.
- Don't hide the date when the date matters to the agreement; pass `date` when it isn't today.

## Related

- [Terms Dialog](terms-dialog.md) – Agreeing to terms in a modal designed for reading – version and date, a jump list, what changed since you last agreed, required and optional consents, and Accept that says why it waits
- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [OTP Input](otp-input.md) – The verification code field done right – a gliding focus ring, paste and SMS autofill, a calm shake on errors and a morph into Verified
- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
