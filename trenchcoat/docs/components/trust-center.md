<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Trust Center

**Trust & calibration** · New

A vendor's security page on one card – certifications and frameworks with their status in words (Certified, In progress, Planned), period and auditor; security documents to view or request, with NDA required noted; the Data Processing Agreement to review and sign, or when and by whom it was signed; and common questions as disclosures

- **Element:** `<tc-trust-center>`
- **Size:** 9.1 KB gzip · 28.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/trust-center";` |
| React / Next.js | `import { TrustCenter } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/trust-center";` · tags starting with tc- are custom elements |
| Angular | `import { TrustCenter } from "@adamstavely/trenchcoat/angular/trust-center";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/trust-center";` |

## Example

The live example is in the gallery at `#/trust-center`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What a vendor shows a customer's security reviewer, on one card:
- **Certifications and frameworks:** each one's name as text, its status in words – Certified, In progress or
  Planned – and the period it covers and who audited it.
- **Security documents:** public ones to view, and the rest behind Request access, with NDA required said in words.
- **The Data Processing Agreement:** Review and sign, or when it was signed and by whom.
- **Common questions:** each a disclosure.

The header says when the trust center was last updated. There are no third-party logos: names are text, and the page
may give a certification its own image.

### When to use

- A vendor's security page, inside the product or on its site, for customers doing due diligence.
- An admin's "Security and compliance" page, where the DPA is signed.
- A procurement workflow that collects a vendor's evidence before approval.

### When not to use

- Your organisation's own data-handling rules – use [Data handling policy](data-handling-policy.md).
- Checking that a signed evidence package is genuine – use [Attestation Check](attestation-check.md).
- Agreeing to terms before using a product – use [Terms Dialog](terms-dialog.md).
- A person's identity or record documents – use [Document List](document-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Certification** `.ui-tcn__cert` – a framework's name, period and auditor
2. **Status** `.ui-tcn__pill` – Certified, In progress or Planned, as a tint, a mark and a word
3. **Document** `.ui-tcn__doc` – a security document with its access
4. **NDA required** `.ui-tcn__nda` – said in words, with a lock
5. **View** `.ui-tcn__view` – opens a public or granted document
6. **Request access** `.ui-tcn__request` – asks for a document; it then says Requested
7. **DPA** `.ui-tcn__dpa` – the agreement's status and Review and sign
8. **Question** `.ui-tcn__faq-q` – opens or closes its answer
9. **Answer** `.ui-tcn__faq-a` – the answer, shown when open

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. Certifications are tinted tiles in both; Review and sign is the one primary button.

## Usage

### HTML

```html
<tc-trust-center id="trust" heading="Trust center"></tc-trust-center>

<script type="module">
  import "@adamstavely/trenchcoat/trust-center";
  import "@adamstavely/trenchcoat/tokens.css";

  const trust = document.querySelector("#trust");
  trust.certifications = [
    { id: "iso", name: "ISO 27001", status: "certified", period: "May 2026 – May 2029", auditor: "Halden Assurance" },
    { id: "iso42", name: "ISO 42001", status: "in-progress", period: "Expected Q2 2027" },
  ];
  trust.documents = [
    { id: "overview", title: "Security overview", access: "public", href: "#overview" },
    { id: "pentest", title: "Penetration test summary", access: "request", nda: true },
  ];
  trust.dpa = { status: "not-signed", version: "v3.1" };
  trust.faqs = [{ id: "train", question: "Is our data used to train models?", answer: "No – never." }];
  trust.addEventListener("tc-request", (e) => console.log("request", e.detail.id));
  trust.addEventListener("tc-dpa-sign", () => console.log("sign the DPA"));
</script>
```

### React / Next.js

```tsx
import { TrustCenter, type TrustCertification, type TrustDocument } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const certifications: TrustCertification[] = [{ id: "iso", name: "ISO 27001", status: "certified", period: "May 2026 – May 2029" }];
const documents: TrustDocument[] = [{ id: "pentest", title: "Penetration test summary", access: "request", nda: true }];

export function Trust() {
  return (
    <TrustCenter
      title="Trust center"
      certifications={certifications}
      documents={documents}
      dpa={{ status: "not-signed", version: "v3.1" }}
      onRequest={(id) => console.log("request", id)}
      onDpaSign={(dpa) => console.log("sign", dpa.version)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/trust-center";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";

defineProps<{ certifications: TcTrustCenter["certifications"]; documents: TcTrustCenter["documents"] }>();
const onRequest = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-trust-center :certifications="certifications" :documents="documents" @tc-request="onRequest"></tc-trust-center>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TrustCenter } from "@adamstavely/trenchcoat/angular/trust-center";
import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";

@Component({
  selector: "app-trust-center-example",
  imports: [TrustCenter],
  template: `<tc-trust-center [certifications]="certifications()" [documents]="documents()" (tc-request)="onRequest($event)"></tc-trust-center>`,
})
export class TrustCenterExample {
  readonly certifications = input.required<TcTrustCenter["certifications"]>();
  readonly documents = input.required<TcTrustCenter["documents"]>();
  onRequest(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trust-center";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";

  let { certifications, documents }: { certifications: TcTrustCenter["certifications"]; documents: TcTrustCenter["documents"] } = $props();
  let el: TcTrustCenter;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-request", on);
    return () => el.removeEventListener("tc-request", on);
  });
</script>

<tc-trust-center bind:this={el} {certifications} {documents}></tc-trust-center>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Trust center"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `certifications` | – | `TrustCertification[]` | `[]` | Certifications and frameworks, in order |
| `documents` | – | `TrustDocument[]` | `[]` | Security documents, in order |
| `dpa` | – | `TrustDpa \| null` | `null` | The Data Processing Agreement; null leaves its card out |
| `faqs` | – | `TrustFaq[]` | `[]` | Common questions and their answers |
| `open` | – | `string[]` | `[]` | The ids of the open questions. Changed by the user unless a tc-open-change listener calls preventDefault() |
| `lastUpdated` | `last-updated` | `number \| undefined` | `undefined` | When the trust center was last updated, as epoch ms – shown in the header |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<TrustCenterLabels>` | `{}` | The words used, merged over defaultTrustCenterLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-request` | – | Yes | Request access was pressed on a document ({ id, document }: TrustRequest); cancelable – prevented, the document isn't marked Requested |
| `tc-document-open` | – | Yes | A public or granted document's View was pressed ({ id, href, document }: TrustDocumentOpen); cancelable – prevented, a link isn't followed |
| `tc-dpa-sign` | – | No | Review and sign was pressed on the DPA ({ dpa }: TrustDpaSign) |
| `tc-open-change` | – | Yes | A question was opened or closed ({ open, id, expanded }: TrustOpenChange); cancelable – prevented, `open` stays as it was |

#### Design tokens it reads (56)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-fg`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultTrustCenterLabels: object` | The words the element uses; any can be renamed through `labels` |

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
| `certifications` | `el.certifications = …;` | `<… certifications={…} />` | `<tc-trust-center :certifications="…">` | `<tc-trust-center [certifications]="…">` | `<tc-trust-center {certifications}>` |
| `documents` | `el.documents = …;` | `<… documents={…} />` | `<tc-trust-center :documents="…">` | `<tc-trust-center [documents]="…">` | `<tc-trust-center {documents}>` |
| `dpa` | `el.dpa = …;` | `<… dpa={…} />` | `<tc-trust-center :dpa="…">` | `<tc-trust-center [dpa]="…">` | `<tc-trust-center {dpa}>` |
| `faqs` | `el.faqs = …;` | `<… faqs={…} />` | `<tc-trust-center :faqs="…">` | `<tc-trust-center [faqs]="…">` | `<tc-trust-center {faqs}>` |
| `open` | `el.open = …;` | `<… open={…} />` | `<tc-trust-center :open="…">` | `<tc-trust-center [open]="…">` | `<tc-trust-center {open}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-trust-center :labels="…">` | `<tc-trust-center [labels]="…">` | `<tc-trust-center {labels}>` |

*Also attributes: `heading`, `description`, `last-updated`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-request` | Yes | `el.addEventListener("tc-request", (e) => …)` | `onRequest={…}` | `@tc-request="…"` | `(tc-request)="…($event)"` | `el.addEventListener("tc-request", …)` |
| `tc-document-open` | Yes | `el.addEventListener("tc-document-open", (e) => …)` | `onDocumentOpen={…}` | `@tc-document-open="…"` | `(tc-document-open)="…($event)"` | `el.addEventListener("tc-document-open", …)` |
| `tc-dpa-sign` | No | `el.addEventListener("tc-dpa-sign", (e) => …)` | `onDpaSign={…}` | `@tc-dpa-sign="…"` | `(tc-dpa-sign)="…($event)"` | `el.addEventListener("tc-dpa-sign", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-trust-center id="trust-center"></tc-trust-center>

<script type="module">
  import "@adamstavely/trenchcoat/trust-center";

  const el = document.querySelector("#trust-center");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
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
import "@adamstavely/trenchcoat/trust-center";
import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";

const props = defineProps<{ initial: TcTrustCenter["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcTrustCenter["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-trust-center :open="open" @tc-open-change="onOpenChange"></tc-trust-center>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TrustCenter } from "@adamstavely/trenchcoat/angular/trust-center";
import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";

@Component({
  selector: "app-controlled-trust-center",
  imports: [TrustCenter],
  template: `<tc-trust-center [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-trust-center>`,
})
export class ControlledTrustCenter {
  readonly initial = input.required<TcTrustCenter["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcTrustCenter["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trust-center";
  import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";

  let { initial }: { initial: TcTrustCenter["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcTrustCenter;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcTrustCenter["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-trust-center bind:this={el} {open}></tc-trust-center>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-trust-center")` returns a `TcTrustCenter` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";`
- **React / Next.js:** Props: `import type { TrustCenterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TrustCenter>`. The element class, for refs: `import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTrustCenter["certifications"]` with `import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";`
- **Angular:** The directive types the template: `[certifications]` takes `TcTrustCenter["certifications"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTrustCenter } from "@adamstavely/trenchcoat/trust-center";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `open` | `string[]` | The ids of the open questions – controlled when given |
| `defaultOpen` | `string[]` | The questions open on mount when `open` isn't controlled |
| `onOpenChange` | `(open: string[]) => void` | A question was opened or closed; `open` is the new list |
| `onRequest` | `(id: string, document: TrustDocument) => boolean \| void` | Request access was pressed; return false to leave the document unmarked |
| `onDocumentOpen` | `(id: string, href: string \| undefined, document: TrustDocument) => boolean \| void` | View was pressed on a public or granted document; return false to stop a link being followed |
| `onDpaSign` | `(dpa: TrustDpa) => void` | Review and sign was pressed on the DPA |

*Renamed or hidden on the wrapper: `heading`, `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The documents' actions are one tab stop, and so are the questions; inside each, the arrows move.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next document's action, or question |
| Home / End | Moves to the first or last |
| Enter / Space | Views or requests a document; opens or closes a question; Review and sign |
| Tab | Moves to the next group: documents, the DPA, the questions |

### Screen readers

Each section is a region named by its heading: Certifications and frameworks, Security documents, Data Processing
Agreement, Common questions. Certification statuses read as words, and the auditor reads as "Auditor Halden
Assurance". View and Request access include the document's title in their names ("Request access Penetration test
summary"). A document that was requested reads "Requested". Questions are buttons with `aria-expanded`, inside
headings, controlling their answers. Requesting access is confirmed in a polite status message.

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

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.8 KB | 6.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.8 KB** | **9.1 KB** |
| With Lit – the first component on a page | 50.7 KB | 16.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 203 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of certifications replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.8 ms | certifications: first render, 1,475 nodes; update 0.8 ms |
| 1,000 items | 49 ms | certifications: first render, 13,400 nodes; update 5.0 ms |

1,000 items of certifications: 49 ms, 13,400 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name certifications the way they're written: "ISO 27001", "SOC 2 Type II".
- Give `period` the dates the certificate covers, or "Expected Q2 2027" for one in progress.
- Mark every document that needs an NDA with `nda`, so nobody requests it and is surprised.
- Keep answers to two or three sentences, and link to the full documents for more.

## Do and don't

### Do

- Say when the trust center was last updated with `lastUpdated`.
- Mark a document `requested` in your data once the request is logged, so it stays marked on the next visit.
- Show the DPA's version, so reviewers know which one they're signing.

### Don't

- Don't draw other companies' logos for certifications; the name as text is enough.
- Don't list a certification as Certified once it has lapsed.
- Don't put confidential documents behind View; use Request access.

## Related

- [Data handling policy](data-handling-policy.md) – Organization data handling as a lifecycle – retention, logs and redaction, memory, training, deletion – led by the effective policy, with locked stages and deletion requests
- [Attestation Check](attestation-check.md) – Verify a signed evidence package by its hash or file – signature, chain integrity and what it covers, checked locally
- [Terms Dialog](terms-dialog.md) – Agreeing to terms in a modal designed for reading – version and date, a jump list, what changed since you last agreed, required and optional consents, and Accept that says why it waits
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
