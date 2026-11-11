<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# OTP Input

**Inputs & controls**

The verification code field done right – a gliding focus ring, paste and SMS autofill, a calm shake on errors and a morph into Verified

- **Element:** `<tc-otp-input>`
- **Size:** 12.5 KB gzip · 47.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/otp-input";` |
| React / Next.js | `import { OtpInput } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/otp-input";` · tags starting with tc- are custom elements |
| Angular | `import { OtpInput } from "@adamstavely/trenchcoat/angular/otp-input";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/otp-input";` |

## Example

The live example is in the gallery at `#/otp-input`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The field for a one-time verification code sent by text message or email. People type, paste or let the phone
autofill the code, and see it as one box per character with a focus ring that glides to the next box. When the last
box is filled the field can check the code itself: it shows that it's verifying, shakes and clears a wrong code for
another try, and folds the boxes into a single “Verified” pill when it's right. A “Resend code” link counts down
below. It is a form control: it submits the code under `name`, checks `required`, and resets with the form.

### When to use

- Two-step sign-in, confirming a phone number or email address, approving a sensitive action.
- Any short code of fixed length – usually 4 to 8 digits, or letters and digits with `numeric="false"`.
- Flows where the code is checked as soon as it's complete, without a separate submit button.

### When not to use

- Passwords, PINs people chose themselves, or codes of unknown length – use a plain text field.
- A multi-step sign-up where the code is one step of several – put this field inside [Stepper Form](stepper-form.md).
- Picking a value from a list – use [Combobox](combobox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Field** `.ui-otp__slots` – the boxes together; one real input lies underneath them
2. **Box** `.ui-otp__sep + .ui-otp__box` – one character of the code; the focus ring glides to the box the next one goes into
3. **Separator** `.ui-otp__sep` – the small dash between groups, with `separator`
4. **Resend** `.ui-otp__resend` – the countdown, then “Resend code”, with `resendable`

## Looks

Standard draws gray boxes that turn white as they fill, with a dark ink ring and a soft halo around the active box,
and an underlined text link for “Resend code”. Clean draws white boxes with the field edge, a thin blue outline that
glides between them, and a tab-style “Resend code” button. Both shake on an error and fold into the same success
pill.

## Usage

### HTML

```html
<h2 id="code-title">Check your phone</h2>
<form>
  <tc-otp-input id="code" name="code" separator labelled-by="code-title" resendable></tc-otp-input>
</form>

<script type="module">
  import "@adamstavely/trenchcoat/otp-input";
  import "@adamstavely/trenchcoat/tokens.css";

  const field = document.querySelector("#code");
  field.onComplete = (code, { signal }) => fetch(`/api/verify?code=${code}`, { signal }).then((r) => {
    if (!r.ok) throw new Error("wrong code");
  });
  field.addEventListener("tc-resend", () => fetch("/api/resend", { method: "POST" }));
</script>
```

### React / Next.js

```tsx
import { OtpInput } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

async function verify(code: string) {
  const res = await fetch("/api/verify", { method: "POST", body: JSON.stringify({ code }) });
  if (!res.ok) throw new Error("wrong code");
}

export function VerifyPhone() {
  return (
    <section>
      <h2 id="verify-title">Check your phone</h2>
      <OtpInput
        name="code"
        separator
        labelledBy="verify-title"
        successLabel="Phone verified"
        onComplete={(code) => verify(code)}
        onResend={() => fetch("/api/resend", { method: "POST" })}
      />
    </section>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/otp-input";
import "@adamstavely/trenchcoat/tokens.css";

const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-otp-input @tc-value-change="onValueChange"></tc-otp-input>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { OtpInput } from "@adamstavely/trenchcoat/angular/otp-input";

@Component({
  selector: "app-otp-input-example",
  imports: [OtpInput],
  template: `<tc-otp-input (tc-value-change)="onValueChange($event)"></tc-otp-input>`,
})
export class OtpInputExample {
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/otp-input";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";

  let el: TcOtpInput;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-otp-input bind:this={el}></tc-otp-input>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `length` | `length` | `number` | `6` | Number of boxes |
| `separator` | `separator` | `boolean \| number` | `false` | A small dash between the boxes – `true` puts it in the middle, a number after that many boxes |
| `numeric` | `numeric` | `boolean` | `true` | Digits only (numeric keyboard on phones); `false` (numeric="false") allows letters too, shown in capitals |
| `value` | `value` | `string` | `""` | The code. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `onComplete` | – | `OtpCompleteHandler \| undefined` | `undefined` | Called once the last box is filled – typed, pasted or autofilled. May return a promise (the check) |
| `status` | `status` | `OtpStatus \| undefined` | `undefined` | The check's state. Unset, it follows the promise `onComplete` returns |
| `errorMessage` | `error-message` | `string \| Element` | `"That code didn't work. Try again."` | Shown below the boxes while the status is "error": text, or an element (cloned) |
| `clearOnError` | `clear-on-error` | `boolean` | `true` | Clears the boxes shortly after an error, ready for the next try (clear-on-error="false" keeps them) |
| `successLabel` | `success-label` | `string` | `"Verified"` | Text in the pill after a successful check |
| `resendable` | `resendable` | `boolean` | `false` | Shows "Resend code" below the boxes once the countdown is over (fires tc-resend) |
| `resendIn` | `resend-in` | `number` | `30` | Seconds until the code can be resent |
| `align` | `align` | `"start" \| "center"` | `"start"` | Center the boxes and the lines below them |
| `disabled` | `disabled` | `boolean` | `false` | Turns the field off: no typing or resending, and the code isn't submitted with the form |
| `name` | `name` | `string` | `""` | Name for form submission – the code is submitted under it |
| `required` | `required` | `boolean` | `false` | A form needs a code before it submits |
| `autoFocus` | `auto-focus` | `boolean` | `false` | Focus the input when the field first renders |
| `label` | `label` | `string` | `"Verification code"` | Accessible name of the field (used when there's no `labelledBy` and no page &lt;label for>) |
| `labelledBy` | `labelled-by` | `string` | `""` | Id of a visible label (a heading or &lt;label>) that names the field – preferred over `label` (WCAG 2.5.3, 3.3.2) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The user changed the code ({ value }: OtpValueChange); cancelable |
| `tc-resend` | – | No | "Resend code" was pressed (shown when `resendable`); detail: null |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `focus(options?: FocusOptions)` | `void` | – |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-otp-input-box-size` | `40px` | standard, clean |
| `--tc-otp-input-gap` | `8px` | standard, clean |

#### Design tokens it reads (55)

`--tc-accent`, `--tc-accent-text`, `--tc-border-default`, `--tc-border-strong`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-shadow`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-raised`, `--tc-shimmer`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-solid`, `--tc-surface-raised`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

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
| `onComplete` | `el.onComplete = …;` | `<… onComplete={…} />` | `<tc-otp-input :onComplete="…">` | `<tc-otp-input [onComplete]="…">` | `<tc-otp-input {onComplete}>` |

*Also attributes: `length`, `separator`, `numeric`, `value`, `status`, `error-message`, `clear-on-error`, `success-label` and 9 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-resend` | No | `el.addEventListener("tc-resend", (e) => …)` | `onResend={…}` | `@tc-resend="…"` | `(tc-resend)="…($event)"` | `el.addEventListener("tc-resend", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-otp-input id="otp-input"></tc-otp-input>

<script type="module">
  import "@adamstavely/trenchcoat/otp-input";

  const el = document.querySelector("#otp-input");
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
import { OtpInput } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof OtpInput>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledOtpInput({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <OtpInput {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/otp-input";
import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";

const props = defineProps<{ initial: TcOtpInput["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcOtpInput["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-otp-input :value="value" @tc-value-change="onValueChange"></tc-otp-input>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { OtpInput } from "@adamstavely/trenchcoat/angular/otp-input";
import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";

@Component({
  selector: "app-controlled-otp-input",
  imports: [OtpInput],
  template: `<tc-otp-input [value]="value()" (tc-value-change)="onValueChange($event)"></tc-otp-input>`,
})
export class ControlledOtpInput {
  readonly initial = input.required<TcOtpInput["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcOtpInput["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/otp-input";
  import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";

  let { initial }: { initial: TcOtpInput["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcOtpInput;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcOtpInput["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-otp-input bind:this={el} {value}></tc-otp-input>
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
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-otp-input :value="value" @tc-value-change="value = $event.detail.value"></tc-otp-input>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-otp-input [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-otp-input>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-otp-input bind:this={el} {value}></tc-otp-input>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-otp-input")` returns a `TcOtpInput` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";`
- **React / Next.js:** Props: `import type { OtpInputProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof OtpInput>`. The element class, for refs: `import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcOtpInput["onComplete"]` with `import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";`
- **Angular:** The directive types the template: `[onComplete]` takes `TcOtpInput["onComplete"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcOtpInput } from "@adamstavely/trenchcoat/otp-input";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | The code. Controlled when defined; otherwise the field keeps its own, starting at `defaultValue` |
| `defaultValue` | `string` | Starting code when uncontrolled |
| `onChange` | `(code: string) => void` | Called with the new code each time the user types, pastes or deletes |
| `errorMessage` | `React.ReactNode` | Shown below the boxes while `status` is "error" |
| `onResend` | `() => void` | Shows "Resend code" below the boxes once the countdown is over |

*Renamed or hidden on the wrapper: `value`, `errorMessage`, `resendable`, `onChange`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| A digit (or letter) | Fills the active box and moves to the next |
| Backspace | Removes the character in the active box, or the one before it when the box is empty |
| ← / → | Moves to the previous or next box (up to the first empty one) |
| Home / ↑ | Moves to the first box |
| End / ↓ | Moves to the first empty box, or the last box when the code is complete |
| Ctrl / ⌘ + V | Pastes a code: a whole code fills every box, a part fills from the active box on |
| Tab | Moves on; with `resendable`, to “Resend code” once the countdown is over |

### Screen readers

The boxes are one real text input with `autocomplete="one-time-code"`, so it's read as a single field: “Verification
code, 6 digits” by default, or the text of `labelledBy` or a page `<label for>` followed by “6 digits”. A wrong code
sets `aria-invalid` and describes the field with the error message. A polite live region says “Verifying code”,
the error message (“That code didn't work. Try again.”), the success label (“Verified”), “A new code is on its way”
after a resend and “You can resend the code now” when the countdown ends.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | itself | Titles break where the line fills up instead of into even lines. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 39.5 KB | 10.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.9 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **47.0 KB** | **12.5 KB** |
| With Lit – the first component on a page | 68.6 KB | 19.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.2 ms** | the gallery demo's data, 28 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | re-render with the same data |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **0 timer callbacks/s** on screen, **0 timer callbacks/s** scrolled away, **0 timer callbacks/s** under reduced motion (measured).
- Animation frames: `requestAnimationFrame`.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name the field with a visible heading or label and point `labelledBy` at it: “Check your phone”, “Enter the code”.
- Say where the code went next to the field: “We sent a 6-digit code to •••• 4821”.
- Write the error as what happened and what to do: “That code didn't work. Try again.” – not “Invalid OTP”.
- Make `successLabel` specific when it can be: “Phone verified”, “Email confirmed”.

## Do and don't

### Do

- Return a promise from `onComplete` and let the field show verifying, error and success on its own.
- Set `length` to the code your service sends, and `separator` for 6- and 8-digit codes so they read in halves.
- Turn on `resendable` and listen for `tc-resend`, with `resendIn` matching your service's rate limit.

### Don't

- Don't add a separate “Verify” button the field makes unnecessary – it checks as soon as the last box is filled.
- Don't move focus into the field on page load unless the code step is the whole page (`auto-focus`).
- Don't turn off `clearOnError` without a reason; people expect to retype a wrong code from the first box.

## Related

- [Stepper Form](stepper-form.md) – A multi-step flow for onboarding and setup – steps that fill and check off, sliding steps, a card that morphs to each step, inline validation and a success state
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Button](button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state

## Changelog

- otp-input, dropzone and stepper-form's tags and choices are form controls (ElementInternals): they submit under `name`, honour `required`, reset and a disabled fieldset, and are named by a page `<label for>`.
