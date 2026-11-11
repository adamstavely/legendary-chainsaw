<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Attestation Check

**Trust & calibration** · New

Verify a signed evidence package by its hash or file – signature, chain integrity and what it covers, checked locally

- **Element:** `<tc-attestation-check>`
- **Size:** 10.9 KB gzip · 38.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/attestation-check";` |
| React / Next.js | `import { AttestationCheck } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/attestation-check";` · tags starting with tc- are custom elements |
| Angular | `import { AttestationCheck } from "@adamstavely/trenchcoat/angular/attestation-check";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/attestation-check";` |

## Example

The live example is in the gallery at `#/attestation-check`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Verify a signed evidence package before you rely on it. Paste the package's hash, or drop the package file, and the
app's `verify` function checks it in the page: the signature, the integrity of its hash chain, and whether it covers
what it claims to. The result is a plain verdict – valid, or invalid with the checks that failed and why. The file
never leaves the page: the element hands it to `verify` and nothing else.

### When to use

- Letting someone who received a released package confirm it hasn't been changed since it was signed.
- Checking an evidence bundle before it's attached to a decision, a filing or a review.
- Anywhere a hash or file must be verified without uploading it.

### When not to use

- Uploading files to keep or process – use [Dropzone](dropzone.md).
- Showing what a run used and produced – use [Run Manifest](run-manifest.md).
- Tracing where an output came from – use [Lineage Graph](lineage-graph.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Drop area** `.ui-atc__area` – drop a package file or browse for one; says where it's checked
3. **Hash** `.ui-atc__hash` – paste a hash and Verify
4. **Verdict** `.ui-atc__verdict` – valid or invalid, and the package's name
5. **Checks** `.ui-atc__checks` – signature, chain integrity and coverage, each passed, failed or not checked
6. **Foot** `.ui-atc__foot` – “Checked locally” and Check another

## Looks

Standard puts the header on a gray tray above the card, with a dashed, recessed drop area; the verdict is a tinted panel with a bold
title. Clean is one white card with the header as its first row, a hairline-dashed drop area, thinner icons and medium weights.
Both colour the verdict green or red and mark each check with a tick, a cross or a dash.

## Usage

### HTML

```html
<tc-attestation-check id="check"></tc-attestation-check>

<script type="module">
  import "@adamstavely/trenchcoat/attestation-check";
  import "@adamstavely/trenchcoat/tokens.css";

  const check = document.querySelector("#check");
  check.verify = async (input) => {
    const bytes = typeof input === "string" ? null : await input.arrayBuffer();
    const ok = bytes !== null && bytes.byteLength > 0;
    return { valid: ok, signature: { ok, detail: ok ? "Signature matches the release key" : "No signature found" } };
  };
  check.addEventListener("tc-result-change", (e) => console.log(e.detail.result?.valid));
</script>
```

### React / Next.js

```tsx
import { AttestationCheck, type AttestationResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

async function verify(input: string | File): Promise<AttestationResult> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : await input.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { valid: false, hash: `sha256:${hex}`, signature: { ok: false, detail: "No signature found" } };
}

export function VerifyPackage() {
  return <AttestationCheck verify={verify} accept={[".evidence"]} onResultChange={(r) => console.log(r?.valid)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/attestation-check";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";

defineProps<{ verify: TcAttestationCheck["verify"]; result: TcAttestationCheck["result"] }>();
const onVerify = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-attestation-check :verify="verify" :result="result" @tc-verify="onVerify"></tc-attestation-check>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AttestationCheck } from "@adamstavely/trenchcoat/angular/attestation-check";
import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";

@Component({
  selector: "app-attestation-check-example",
  imports: [AttestationCheck],
  template: `<tc-attestation-check [verify]="verify()" [result]="result()" (tc-verify)="onVerify($event)"></tc-attestation-check>`,
})
export class AttestationCheckExample {
  readonly verify = input.required<TcAttestationCheck["verify"]>();
  readonly result = input.required<TcAttestationCheck["result"]>();
  onVerify(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/attestation-check";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";

  let { verify, result }: { verify: TcAttestationCheck["verify"]; result: TcAttestationCheck["result"] } = $props();
  let el: TcAttestationCheck;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-verify", on);
    return () => el.removeEventListener("tc-verify", on);
  });
</script>

<tc-attestation-check bind:this={el} {verify} {result}></tc-attestation-check>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Verify an evidence package"` | The heading, and the component's name |
| `verify` | – | `AttestationVerify \| undefined` | `undefined` | Checks a pasted hash (a string) or a dropped file (a File) in the page and returns the result, or a promise of it. Throw to say it couldn't check. The element never sends the file anywhere |
| `result` | – | `AttestationResult \| null` | `null` | The result on show (null = none). Set by a finished check unless a tc-result-change listener calls preventDefault() |
| `hashPattern` | – | `RegExp` | `/^(?:sha(?:256\|384\|512):)?[0-9a-f]{40,128}$/i` | What a pasted hash must look like before it's checked – hex, 40 to 128 characters, optionally "sha256:" first |
| `accept` | – | `string[] \| undefined` | `undefined` | File types the file picker offers – e.g. [".json", ".zip"]; unset offers any file |
| `hint` | `hint` | `string` | `"Checked in this browser – the file isn't uploaded"` | The line under the drop area – where the check happens |
| `placeholder` | `placeholder` | `string` | `"sha256:9f2c41ab07e3…"` | Placeholder of the hash field |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-verify` | – | No | A check started ({ input }: AttestationVerifyStart – the pasted hash or the File) |
| `tc-result-change` | – | Yes | A check finished, or "Check another" cleared the result ({ result, input }: AttestationResultChange); cancelable – prevent it to keep `result` as it is (controlled use) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-attestation-check-tray-bg` | `var(--tc-surface-tray)` | standard |
| `--tc-attestation-check-panel-bg` | `var(--tc-surface-raised)` | standard, clean |
| `--tc-attestation-check-area-bg` | `var(--tc-surface-raised)` | standard, clean |

#### Design tokens it reads (105)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control-hover`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-h`, `--tc-pill-px`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xl`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `verify` | `el.verify = …;` | `<… verify={…} />` | `<tc-attestation-check :verify="…">` | `<tc-attestation-check [verify]="…">` | `<tc-attestation-check {verify}>` |
| `result` | `el.result = …;` | `<… result={…} />` | `<tc-attestation-check :result="…">` | `<tc-attestation-check [result]="…">` | `<tc-attestation-check {result}>` |
| `hashPattern` | `el.hashPattern = …;` | `<… hashPattern={…} />` | `<tc-attestation-check :hashPattern="…">` | `<tc-attestation-check [hashPattern]="…">` | `<tc-attestation-check {hashPattern}>` |
| `accept` | `el.accept = …;` | `<… accept={…} />` | `<tc-attestation-check :accept="…">` | `<tc-attestation-check [accept]="…">` | `<tc-attestation-check {accept}>` |

*Also attributes: `heading`, `hint`, `placeholder` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-verify` | No | `el.addEventListener("tc-verify", (e) => …)` | `onVerifyStart={…}` | `@tc-verify="…"` | `(tc-verify)="…($event)"` | `el.addEventListener("tc-verify", …)` |
| `tc-result-change` | Yes | `el.addEventListener("tc-result-change", (e) => …)` | `ref.current.addEventListener("tc-result-change", …)` | `@tc-result-change="…"` | `(tc-result-change)="…($event)"` | `el.addEventListener("tc-result-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `result` itself unless a listener calls `preventDefault()` on `tc-result-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-attestation-check id="attestation-check"></tc-attestation-check>

<script type="module">
  import "@adamstavely/trenchcoat/attestation-check";

  const el = document.querySelector("#attestation-check");
  el.addEventListener("tc-result-change", (e) => {
    e.preventDefault(); // the element keeps its result…
    if (allowed(e.detail.result)) el.result = e.detail.result; // …until the app sets it
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
import "@adamstavely/trenchcoat/attestation-check";
import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";

const props = defineProps<{ initial: TcAttestationCheck["result"] }>();
const result = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onResultChange = (e: CustomEvent<{ result: TcAttestationCheck["result"] }>) => {
  e.preventDefault();
  result.value = e.detail.result;
};
</script>

<template>
  <tc-attestation-check :result="result" @tc-result-change="onResultChange"></tc-attestation-check>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AttestationCheck } from "@adamstavely/trenchcoat/angular/attestation-check";
import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";

@Component({
  selector: "app-controlled-attestation-check",
  imports: [AttestationCheck],
  template: `<tc-attestation-check [result]="result()" (tc-result-change)="onResultChange($event)"></tc-attestation-check>`,
})
export class ControlledAttestationCheck {
  readonly initial = input.required<TcAttestationCheck["result"]>();
  readonly result = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onResultChange(e: CustomEvent<{ result: TcAttestationCheck["result"] }>) {
    e.preventDefault();
    this.result.set(e.detail.result);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/attestation-check";
  import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";

  let { initial }: { initial: TcAttestationCheck["result"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let result = $derived(initial);
  let el: TcAttestationCheck;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      result = (e as CustomEvent<{ result: TcAttestationCheck["result"] }>).detail.result;
    };
    el.addEventListener("tc-result-change", on);
    return () => el.removeEventListener("tc-result-change", on);
  });
</script>

<tc-attestation-check bind:this={el} {result}></tc-attestation-check>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-attestation-check")` returns a `TcAttestationCheck` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";`
- **React / Next.js:** Props: `import type { AttestationCheckProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AttestationCheck>`. The element class, for refs: `import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAttestationCheck["verify"]` with `import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";`
- **Angular:** The directive types the template: `[verify]` takes `TcAttestationCheck["verify"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAttestationCheck } from "@adamstavely/trenchcoat/attestation-check";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the component's name |
| `result` | `AttestationResult \| null` | The result on show. Controlled when defined (null = none); otherwise the component keeps it |
| `defaultResult` | `AttestationResult \| null` | The result on show when uncontrolled |
| `onResultChange` | `(result: AttestationResult \| null, input?: AttestationInput) => void` | Called when a check finishes (with its result and what was checked), or with null when "Check another" clears it |
| `onVerifyStart` | `(input: AttestationInput) => void` | Called when a check starts, with the pasted hash or the File |

*Renamed or hidden on the wrapper: `heading`, `result`*

## Accessibility

### Keyboard

Every control is native: a button for the drop area, a labelled text field and a submit button.

| Key | What it does |
|---|---|
| Tab / Shift + Tab | Moves between the drop area, the hash field, Verify and, once there's a result, Copy hash and Check another |
| Enter / Space on the drop area | Opens the file picker |
| Enter in the hash field | Verifies the hash (the field is checked first) |

When a check finishes, focus moves to the verdict; Check another returns it to the drop area.

### Screen readers

The component is a region named by its heading. The drop area is a button, “Drop a package file or browse”, described
by the hint, “Checked in this browser – the file isn't uploaded”. The hash field is labelled “Package hash”; an
invalid entry sets `aria-invalid` and is described by the error. While checking, the panel is `aria-busy`. A polite
status says “Checking the hash…”, then “Valid: the package is intact and signed.” or “Invalid: chain integrity, coverage
failed.”. The checks are a list, “Checks”, each item reading like “Chain integrity: failed, Link 17 doesn't match”.
A verify that throws shows an alert, “Couldn't check this package.”, with Try again.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

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
| **This component alone** | 30.1 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| **Added to a page that already has Lit** | **38.7 KB** | **10.9 KB** |
| With Lit – the first component on a page | 58.3 KB | 17.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 30 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of accept replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.3 ms | accept: first render, 30 nodes; update 0.2 ms |
| 1,000 items | 1.2 ms | accept: first render, 30 nodes; update 0.2 ms |

What it renders doesn't grow with accept (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each check's `detail` as what was found: “42 of 42 links intact”, “Link 17 doesn't match link 16”.
- Give `reasons` in plain words for an invalid package – what changed or what's missing, not error codes.
- List what a package covers in `coverage.items`, briefly: “Run manifest”, “14 source chunks”.
- Keep the `hint` about where the check happens; people need to know the file stays with them.

## Do and don't

### Do

- Do the whole check inside `verify`, in the page – hash the file with `crypto.subtle` and check the signature locally.
- Leave a check unset when you didn't run it, so it reads “Not checked” instead of passing silently.
- Throw from `verify` with a clear message when you can't check at all (a missing key), rather than returning invalid.

### Don't

- Don't upload the file in `verify`; the hint promises it isn't.
- Don't return `valid: true` when any check failed.
- Don't loosen `hashPattern` to accept anything – a clear error beats a confusing “not found”.

## Related

- [Dropzone](dropzone.md) – Drag files in and watch them upload – fanning documents, colored type badges, progress with time left, errors with retry
- [Run Manifest](run-manifest.md) – What it takes to reproduce a run – model, settings, instruction hash, sources, intent and the verification summary, ready to export
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Correction Propagation](correction-propagation.md) – How far a correction reaches – every artifact and released package that cites the corrected claim, each sent for review, nothing rewritten behind your back

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - claims and their reliability: `tc-claim-answer`, `tc-verification-queue`, `tc-reflection-gate`, `tc-reliance-gauge`, `tc-disagreement-banner`, `tc-synthesis-notes`; - where outputs came from: `tc-lineage-graph`, `tc-validity-badge`, `tc-provenance-summary`, `tc-correction-propagation`, `tc-attestation-check`, `tc-run-manifest`; - policy and control: `tc-policy-simulator`, `tc-gate-config`, `tc-coverage-matrix`, `tc-kill-switch`, `tc-playbook-canvas`.
