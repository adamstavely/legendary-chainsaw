<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Request Log

**Agents** · New

Every request an app made to a model provider, one line each – time, provider and model, endpoint, status with errors in words ("429 Rate limited"), latency with a bar, tokens in and out, cost and cache hit; status-class and model chips, and a request that opens to its bodies and headers with secrets masked and Copy as cURL

- **Element:** `<tc-request-log>`
- **Size:** 23.8 KB gzip · 83.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/request-log";` |
| React / Next.js | `import { RequestLog } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/request-log";` · tags starting with tc- are custom elements |
| Angular | `import { RequestLog } from "@adamstavely/trenchcoat/angular/request-log";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/request-log";` |

## Example

The live example is in the gallery at `#/request-log`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every request an app made to a model provider, one line each: when, the provider and model, the endpoint, the status
(an error also in words, such as "429 Rate limited"), the latency with a small bar, input and output tokens, the cost
and whether the provider's cache answered. Chips filter by status class – 2xx, 4xx, 5xx and rate limited – and by
model. Choosing a request opens it under the list: its request and response bodies and both header sets, with secrets
masked, and Copy as cURL, whose auth header is redacted too.

### When to use

- The request log of an AI gateway or proxy, where people look for errors, slow calls and rate limits.
- Debugging one agent run's model calls, with their bodies.
- Checking what a cache hit saved, call by call.

### When not to use

- A web page's own network requests – use [Network Log](network-log.md).
- Agent runs rather than single model calls – use [Run Log](run-log.md).
- Where the time went inside one run – use [Trace Waterfall](trace-waterfall.md).
- One response to read – use [JSON Viewer](json-viewer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filters** `.ui-rqlg__filters` – chip groups `.ui-rqlg__chips` for status class and model, each chip `.ui-rqlg__chip` with its count
2. **Header row** `.ui-rqlg__head` – the column names
3. **Request** `.ui-rqlg__row` – time `.ui-rqlg__time`, model `.ui-rqlg__model`, endpoint `.ui-rqlg__endpoint`, status `.ui-rqlg__status` with its words `.ui-rqlg__said`, latency `.ui-rqlg__latency` with its bar `.ui-rqlg__bar`, tokens `.ui-rqlg__tokens`, cost `.ui-rqlg__cost` and cache `.ui-rqlg__cache`
4. **Footer** `.ui-rqlg__foot` – requests, errors, median latency and cost
5. **Details** `.ui-rqlg__detail` – the Request, Response and Headers tabs `.ui-rqlg__tabs`, Copy as cURL `.ui-rqlg__curl`, Close `.ui-rqlg__close`, header lists `.ui-rqlg__pairs`, and a text body `.ui-rqlg__text` or a JSON Viewer `.ui-rqlg__json`
6. **Empty** `.ui-rqlg__empty` – "No requests yet", or "No requests match" when the filters hide everything

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row. Successful codes are green; 4xx and rate-limited ones amber, 5xx and no response red – and every error is also
written in words. Latency bars are scaled to the slowest request shown. Masked values read "[redacted]" in italics. A
page can set `--tc-rqlg-cols` and `--tc-rqlg-cols-narrow`, the column widths, `--tc-rqlg-bar-h`, the latency bar's
height, and `--tc-rqlg-icon`. When the card is narrower than 560 px only time, model, status and latency show.

## Usage

### HTML

```html
<tc-request-log id="requests" base-url="https://api.provider.example"></tc-request-log>

<script type="module">
  import "@adamstavely/trenchcoat/request-log";
  import "@adamstavely/trenchcoat/tokens.css";

  const log = document.querySelector("#requests");
  const t = Date.UTC(2026, 10, 3, 9, 14);
  log.requests = [
    { id: "q1", at: t, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 200, latency: 2840, inputTokens: 8120, outputTokens: 610, cost: 0.0532, cacheHit: true, requestHeaders: { authorization: "Bearer sk-live-7f3a9c" }, requestBody: { model: "large-1" } },
    { id: "q2", at: t + 4000, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 429, latency: 180, responseBody: { error: { type: "rate_limit_error" } } },
  ];
  log.addEventListener("tc-request-open", (e) => console.log("open", e.detail.id));
</script>
```

### React / Next.js

```tsx
import { RequestLog, type ProviderRequest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ModelCalls({ requests }: { requests: ProviderRequest[] }) {
  return <RequestLog requests={requests} baseUrl="https://api.provider.example" defaultClasses={["4xx", "5xx", "rate-limited"]} onRequestOpen={(id) => console.log("open", id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/request-log";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";

defineProps<{ requests: TcRequestLog["requests"]; classes: TcRequestLog["classes"] }>();
const onClassesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-request-log :requests="requests" :classes="classes" @tc-classes-change="onClassesChange"></tc-request-log>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RequestLog } from "@adamstavely/trenchcoat/angular/request-log";
import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";

@Component({
  selector: "app-request-log-example",
  imports: [RequestLog],
  template: `<tc-request-log [requests]="requests()" [classes]="classes()" (tc-classes-change)="onClassesChange($event)"></tc-request-log>`,
})
export class RequestLogExample {
  readonly requests = input.required<TcRequestLog["requests"]>();
  readonly classes = input.required<TcRequestLog["classes"]>();
  onClassesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/request-log";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";

  let { requests, classes }: { requests: TcRequestLog["requests"]; classes: TcRequestLog["classes"] } = $props();
  let el: TcRequestLog;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-classes-change", on);
    return () => el.removeEventListener("tc-classes-change", on);
  });
</script>

<tc-request-log bind:this={el} {requests} {classes}></tc-request-log>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Requests"` | The heading; empty leaves the header out |
| `description` | `description` | `string` | `""` | Small text under the heading |
| `requests` | – | `ProviderRequest[]` | `[]` | The requests, in any order – the list shows the newest first |
| `classes` | – | `RequestStatusClass[]` | `[]` | The status classes that show; empty shows them all |
| `models` | – | `string[]` | `[]` | The models that show; empty shows them all |
| `selected` | `selected` | `string \| null` | `null` | The open request's id |
| `baseUrl` | `base-url` | `string` | `""` | Put before each request's endpoint for Copy as cURL, when it has no `url` |
| `redact` | – | `string[]` | `["authorization", "proxy-authorization", "x-api-key", "api-key", "apikey", "token", "access-token", "secret", "client-secret", "password", "cookie", "set-cookie"]` | Header and body keys to mask, compared without case, - or _ |
| `currency` | `currency` | `string` | `"USD"` | ISO 4217 currency code for costs |
| `locale` | `locale` | `string \| undefined` | `undefined` | Locale for times, numbers and amounts |
| `maxHeight` | `max-height` | `number` | `360` | Height in px at which the list scrolls |
| `labels` | – | `Partial<RequestLogLabels>` | `{}` | Renames the words it uses |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-classes-change` | – | Yes | A status class chip was toggled ({ classes }: RequestLogClassesChange); empty means all; cancelable – prevented, `classes` stays as it was |
| `tc-models-change` | – | Yes | A model chip was toggled ({ models }: RequestLogModelsChange); empty means all; cancelable – prevented, `models` stays as it was |
| `tc-selected-change` | – | Yes | A request was opened or its details closed ({ selected, request }: RequestLogSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-request-open` | – | No | A request was chosen, before tc-selected-change ({ id, request }: RequestLogOpen) |
| `tc-copy` | – | Yes | Copy as cURL was pressed ({ field, text, id }: RequestLogCopy); cancelable – prevent it to write the clipboard yourself |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rqlg-cols` | `5.5rem minmax(7rem, 1.2fr) minmax(6rem, 1fr) 8rem 7rem 7.5rem 4.5rem 3rem` | both |
| `--tc-rqlg-cols-narrow` | `5rem minmax(0, 1fr) 6.5rem 5rem` | both |
| `--tc-rqlg-bar-h` | `4px` | both |
| `--tc-rqlg-icon` | `14px` | both |

#### Design tokens it reads (54)

`--tc-accent-solid`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultRedactKeys: array` | Keys masked by default, in headers and bodies, compared without case, - or _ |
| `statusClass(status: number): RequestStatusClass` | The status class a code belongs to: 429 is its own; no response counts with the 5xx |
| `statusWords(status: number): void` | An error status in words, "" for a success |
| `redact(value: T, keys: string[]): T` | A copy of headers or a body with every key in `keys` masked, however deep |
| `curlCommand(r: ProviderRequest, baseUrl: unknown, keys: string[]): void` | The request as a cURL command, its secrets redacted |

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
| `requests` | `el.requests = …;` | `<… requests={…} />` | `<tc-request-log :requests="…">` | `<tc-request-log [requests]="…">` | `<tc-request-log {requests}>` |
| `classes` | `el.classes = …;` | `<… classes={…} />` | `<tc-request-log :classes="…">` | `<tc-request-log [classes]="…">` | `<tc-request-log {classes}>` |
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-request-log :models="…">` | `<tc-request-log [models]="…">` | `<tc-request-log {models}>` |
| `redact` | `el.redact = …;` | `<… redact={…} />` | `<tc-request-log :redact="…">` | `<tc-request-log [redact]="…">` | `<tc-request-log {redact}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-request-log :labels="…">` | `<tc-request-log [labels]="…">` | `<tc-request-log {labels}>` |

*Also attributes: `heading`, `description`, `selected`, `base-url`, `currency`, `locale`, `max-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-classes-change` | Yes | `el.addEventListener("tc-classes-change", (e) => …)` | `ref.current.addEventListener("tc-classes-change", …)` | `@tc-classes-change="…"` | `(tc-classes-change)="…($event)"` | `el.addEventListener("tc-classes-change", …)` |
| `tc-models-change` | Yes | `el.addEventListener("tc-models-change", (e) => …)` | `ref.current.addEventListener("tc-models-change", …)` | `@tc-models-change="…"` | `(tc-models-change)="…($event)"` | `el.addEventListener("tc-models-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-request-open` | No | `el.addEventListener("tc-request-open", (e) => …)` | `onRequestOpen={…}` | `@tc-request-open="…"` | `(tc-request-open)="…($event)"` | `el.addEventListener("tc-request-open", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyCurl={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `classes`, `models` and `selected` itself unless a listener calls `preventDefault()` on `tc-classes-change`, `tc-models-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-request-log id="request-log"></tc-request-log>

<script type="module">
  import "@adamstavely/trenchcoat/request-log";

  const el = document.querySelector("#request-log");
  el.addEventListener("tc-classes-change", (e) => {
    e.preventDefault(); // the element keeps its classes…
    if (allowed(e.detail.classes)) el.classes = e.detail.classes; // …until the app sets it
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
import "@adamstavely/trenchcoat/request-log";
import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";

const props = defineProps<{ initial: TcRequestLog["classes"] }>();
const classes = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onClassesChange = (e: CustomEvent<{ classes: TcRequestLog["classes"] }>) => {
  e.preventDefault();
  classes.value = e.detail.classes;
};
</script>

<template>
  <tc-request-log :classes="classes" @tc-classes-change="onClassesChange"></tc-request-log>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RequestLog } from "@adamstavely/trenchcoat/angular/request-log";
import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";

@Component({
  selector: "app-controlled-request-log",
  imports: [RequestLog],
  template: `<tc-request-log [classes]="classes()" (tc-classes-change)="onClassesChange($event)"></tc-request-log>`,
})
export class ControlledRequestLog {
  readonly initial = input.required<TcRequestLog["classes"]>();
  readonly classes = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onClassesChange(e: CustomEvent<{ classes: TcRequestLog["classes"] }>) {
    e.preventDefault();
    this.classes.set(e.detail.classes);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/request-log";
  import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";

  let { initial }: { initial: TcRequestLog["classes"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let classes = $derived(initial);
  let el: TcRequestLog;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      classes = (e as CustomEvent<{ classes: TcRequestLog["classes"] }>).detail.classes;
    };
    el.addEventListener("tc-classes-change", on);
    return () => el.removeEventListener("tc-classes-change", on);
  });
</script>

<tc-request-log bind:this={el} {classes}></tc-request-log>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-request-log")` returns a `TcRequestLog` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";`
- **React / Next.js:** Props: `import type { RequestLogProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RequestLog>`. The element class, for refs: `import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRequestLog["requests"]` with `import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";`
- **Angular:** The directive types the template: `[requests]` takes `TcRequestLog["requests"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRequestLog } from "@adamstavely/trenchcoat/request-log";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `classes` | `RequestStatusClass[]` | The status classes that show, empty for all – controlled when given |
| `defaultClasses` | `RequestStatusClass[]` | The classes that show at first, when `classes` isn't controlled |
| `onClassesChange` | `(classes: RequestStatusClass[]) => void` | A status class chip was toggled |
| `models` | `string[]` | The models that show, empty for all – controlled when given |
| `defaultModels` | `string[]` | The models that show at first, when `models` isn't controlled |
| `onModelsChange` | `(models: string[]) => void` | A model chip was toggled |
| `selected` | `string \| null` | The open request's id – controlled when given |
| `defaultSelected` | `string \| null` | The open request at first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, request?: ProviderRequest) => void` | A request was opened or its details closed |
| `onRequestOpen` | `(id: string, request: ProviderRequest) => void` | A request was opened |
| `onCopyCurl` | `(text: string, id: string) => void \| boolean` | Copy as cURL was pressed; return false to write the clipboard yourself |

*Renamed or hidden on the wrapper: `heading`, `classes`, `models`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The chip groups, the list and the details' tabs are a tab stop each.

| Key | What it does |
|---|---|
| ← / → in a chip group | Move between chips |
| Enter / Space on a chip | Shows or hides that class or model |
| ↑ / ↓ | Move between requests |
| Home / End | Go to the newest or oldest request shown |
| Enter / Space | Opens a request's details |
| Esc | Closes the details |
| ← / → in the tabs | Switch between Request, Response and Headers |

### Screen readers

The list is a `grid` named by the heading, with column headers. Each request is a `row` with `aria-selected`; the open
one has `aria-controls` pointing at its details, a region named by its method and endpoint. Latency bars are hidden,
since the time is written. The details' tabs are a `tablist`. The chips are toggle buttons with `aria-pressed` in named
groups. A `role="status"` says when the cURL command is copied.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, json-viewer | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, json-viewer, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | json-viewer | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | json-viewer, internal/modal | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, json-viewer, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | json-viewer | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, json-viewer, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself, json-viewer | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.2 KB | 8.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/modal` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [json-viewer](json-viewer.md) · Element it renders | 47.6 KB | – |
| **Added to a page that already has Lit** | **83.8 KB** | **23.8 KB** |
| With Lit – the first component on a page | 105.1 KB | 30.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.0 ms** | the gallery demo's data, 257 DOM nodes – to layout, median of 7 |
| Typical update | **1.2 ms** | one item of redact replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 3.1 ms | redact: first render, 257 nodes; update 0.9 ms |
| 1,000 items | 3.0 ms | redact: first render, 257 nodes; update 1.0 ms |

What it renders doesn't grow with redact (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame` (json-viewer).
- Timers: `setTimeout`, `setTimeout` (json-viewer).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give `at` in epoch ms and `latency` in ms; the list shows the newest first.
- Use `status: 0` for a request that got no response; it counts with the 5xx.
- Pass parsed objects as bodies for JSON, and strings for anything else.
- Set `baseUrl` once, or `url` per request, so Copy as cURL has a full address.

## Do and don't

### Do

- Add your own secret header and body keys to `redact` (they're compared without case, `-` or `_`).
- Keep the provider's own model names, so they match its bills and dashboards.

### Don't

- Don't rely on masking alone for data people mustn't see; strip it before it reaches the page.
- Don't listen for the JSON Viewer's own events by name without checking the target: its `tc-copy` bubbles through
  the log.

## Related

- [Network Log](network-log.md) – The requests a web page made: status, method, name, size, time and a waterfall, with type chips and a detail of headers and response.
- [Run Log](run-log.md) – Every agent run on one line – status as a mark and a word, agent, trigger, when, duration, steps, tokens, cost and user; status, agent and trigger chips, search and a time range, failed runs that open to their error, and in live mode new runs held behind "Show 3 new runs" instead of shifting the list
- [Trace Waterfall](trace-waterfall.md) – Where the time and money of an agent run go – every LLM call, tool call and sub-agent as a bar on a live timeline, with tokens and cost per step, the slowest call marked and branches that fold into their parent
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
