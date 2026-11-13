<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Response Examples

**Utilities** · New

An endpoint's example responses, one tab per status – the code, its reason and its class as a mark, a colour and a word, what the response means, its headers folded behind a disclosure, and the body pretty-printed with syntax colours and Copy, with a media-type pick when there are several

- **Element:** `<tc-response-examples>`
- **Size:** 26.4 KB gzip · 98.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/response-examples";` |
| React / Next.js | `import { ResponseExamples } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/response-examples";` · tags starting with tc- are custom elements |
| Angular | `import { ResponseExamples } from "@adamstavely/trenchcoat/angular/response-examples";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/response-examples";` |

## Example

The live example is in the gallery at `#/response-examples`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An endpoint's example responses for a reference page, one tab per status: "200 OK", "404 Not found", "429 Too many
requests". Each tab's status class shows as a mark, a colour and a word, so colour is never the only cue. A tab holds
what the response means, its headers (folded) and its body, pretty-printed with syntax colours and Copy. When a status
has bodies in several media types, a select picks one.

### When to use

- The responses section of an API reference page.
- Showing what a webhook, callback or export looks like, status by status.

### When not to use

- The fields of a response, with types and meaning – use [Schema Fields](schema-fields.md) beside it.
- A response someone actually received, to review – use [JSON Viewer](json-viewer.md).
- The requests a page made – use [Network Log](network-log.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-rex__tabs` – one per status
2. **Tab** `.ui-rex__tab` – the status's mark, `.ui-rex__code` and `.ui-rex__reason`
3. **Panel** `.ui-rex__panel` – the chosen status's response
4. **Description** `.ui-rex__desc` – what the response means
6. **Media type** `.ui-rex__select` – which body to show, when there are several
7. **Body** `.ui-rex__body` – a `tc-code-block` with syntax colours and Copy
8. **No body** `.ui-rex__nobody` – said when the status has none, such as 304

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`--tc-rex-indicator` sets the thickness of the chosen tab's underline. The body is a bare `tc-code-block`, so its
`--tc-code-block-*` properties set the syntax colours.

## Usage

### HTML

```html
<tc-response-examples id="responses" heading="GET /records/{id}"></tc-response-examples>

<script type="module">
  import "@adamstavely/trenchcoat/response-examples";
  import "@adamstavely/trenchcoat/tokens.css";

  document.querySelector("#responses").examples = [
    { status: 200, headers: { ETag: '"r4812-v9"' }, body: { id: "REC-004812", title: "Annual audit 2026" } },
    { status: 404, description: "No record has that id.", body: { error: "not_found" } },
    { status: 429, label: "Rate limited", headers: { "Retry-After": "30" }, body: { error: "rate_limited" } },
  ];
</script>
```

### React / Next.js

```tsx
import { ResponseExamples, type ResponseExample } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const examples: ResponseExample[] = [
  { status: 200, body: { id: "REC-004812", title: "Annual audit 2026" } },
  { status: 404, description: "No record has that id.", body: { error: "not_found" } },
];

export function RecordResponses({ status, onStatusChange }: { status: string; onStatusChange: (status: string) => void }) {
  return <ResponseExamples title="GET /records/{id}" examples={examples} status={status} onStatusChange={onStatusChange} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/response-examples";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";

defineProps<{ examples: TcResponseExamples["examples"]; labels: TcResponseExamples["labels"] }>();
const onStatusChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-response-examples :examples="examples" :labels="labels" @tc-status-change="onStatusChange"></tc-response-examples>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ResponseExamples } from "@adamstavely/trenchcoat/angular/response-examples";
import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";

@Component({
  selector: "app-response-examples-example",
  imports: [ResponseExamples],
  template: `<tc-response-examples [examples]="examples()" [labels]="labels()" (tc-status-change)="onStatusChange($event)"></tc-response-examples>`,
})
export class ResponseExamplesExample {
  readonly examples = input.required<TcResponseExamples["examples"]>();
  readonly labels = input.required<TcResponseExamples["labels"]>();
  onStatusChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/response-examples";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";

  let { examples, labels }: { examples: TcResponseExamples["examples"]; labels: TcResponseExamples["labels"] } = $props();
  let el: TcResponseExamples;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-response-examples bind:this={el} {examples} {labels}></tc-response-examples>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Responses"` | The heading – often the endpoint, "GET /records/{id}" |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `examples` | – | `ResponseExample[]` | `[]` | The example responses, one tab each, in the order given |
| `status` | `status` | `string` | `""` | The tab showing, by its status ("200"); the first when empty or unknown. Changed by the tabs unless a tc-status-change listener calls preventDefault() |
| `mediaType` | `media-type` | `string` | `""` | The body's media type; the status's first when empty or not among its bodies. Changed by the select unless a tc-media-type-change listener calls preventDefault() |
| `headersOpen` | `headers-open` | `boolean` | `false` | Shows the headers open |
| `maxHeight` | `max-height` | `number` | `360` | The tallest the body gets before it scrolls, in px; 0 for no limit |
| `labels` | – | `Partial<ResponseExamplesLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-status-change` | – | Yes | Another status's tab was chosen ({ status, example }: ResponseExamplesStatusChange); cancelable – prevented, `status` stays as it was |
| `tc-media-type-change` | – | Yes | Another media type was chosen for the body ({ mediaType, status }: ResponseExamplesMediaTypeChange); cancelable – prevented, `mediaType` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rex-indicator` | `2px` | both |

#### Design tokens it reads (43)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultResponseExamplesLabels: ResponseExamplesLabels` | The words used when the page gives none |
| `responseStatusClass(status: number \| string): ResponseStatusClass` | The status's class from its first digit: 2xx success, 4xx client error… |
| `responseReason(status: number \| string): void` | The standard reason phrase for a code, or "" |
| `responseBodies(ex: ResponseExample): ResponseExampleBody[]` | The bodies of an example, in order |
| `responseBodyText(body: ResponseExampleBody): string` | A body as text: JSON values and JSON text pretty-printed, other text as it is |

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
| `examples` | `el.examples = …;` | `<… examples={…} />` | `<tc-response-examples :examples="…">` | `<tc-response-examples [examples]="…">` | `<tc-response-examples {examples}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-response-examples :labels="…">` | `<tc-response-examples [labels]="…">` | `<tc-response-examples {labels}>` |

*Also attributes: `heading`, `description`, `status`, `media-type`, `headers-open`, `max-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-status-change` | Yes | `el.addEventListener("tc-status-change", (e) => …)` | `ref.current.addEventListener("tc-status-change", …)` | `@tc-status-change="…"` | `(tc-status-change)="…($event)"` | `el.addEventListener("tc-status-change", …)` |
| `tc-media-type-change` | Yes | `el.addEventListener("tc-media-type-change", (e) => …)` | `ref.current.addEventListener("tc-media-type-change", …)` | `@tc-media-type-change="…"` | `(tc-media-type-change)="…($event)"` | `el.addEventListener("tc-media-type-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `status` and `mediaType` itself unless a listener calls `preventDefault()` on `tc-status-change` or `tc-media-type-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-response-examples id="response-examples"></tc-response-examples>

<script type="module">
  import "@adamstavely/trenchcoat/response-examples";

  const el = document.querySelector("#response-examples");
  el.addEventListener("tc-status-change", (e) => {
    e.preventDefault(); // the element keeps its status…
    if (allowed(e.detail.status)) el.status = e.detail.status; // …until the app sets it
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
import "@adamstavely/trenchcoat/response-examples";
import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";

const props = defineProps<{ initial: TcResponseExamples["status"] }>();
const status = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onStatusChange = (e: CustomEvent<{ status: TcResponseExamples["status"] }>) => {
  e.preventDefault();
  status.value = e.detail.status;
};
</script>

<template>
  <tc-response-examples :status="status" @tc-status-change="onStatusChange"></tc-response-examples>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ResponseExamples } from "@adamstavely/trenchcoat/angular/response-examples";
import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";

@Component({
  selector: "app-controlled-response-examples",
  imports: [ResponseExamples],
  template: `<tc-response-examples [status]="status()" (tc-status-change)="onStatusChange($event)"></tc-response-examples>`,
})
export class ControlledResponseExamples {
  readonly initial = input.required<TcResponseExamples["status"]>();
  readonly status = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onStatusChange(e: CustomEvent<{ status: TcResponseExamples["status"] }>) {
    e.preventDefault();
    this.status.set(e.detail.status);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/response-examples";
  import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";

  let { initial }: { initial: TcResponseExamples["status"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let status = $derived(initial);
  let el: TcResponseExamples;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      status = (e as CustomEvent<{ status: TcResponseExamples["status"] }>).detail.status;
    };
    el.addEventListener("tc-status-change", on);
    return () => el.removeEventListener("tc-status-change", on);
  });
</script>

<tc-response-examples bind:this={el} {status}></tc-response-examples>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-response-examples")` returns a `TcResponseExamples` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";`
- **React / Next.js:** Props: `import type { ResponseExamplesProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ResponseExamples>`. The element class, for refs: `import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcResponseExamples["examples"]` with `import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";`
- **Angular:** The directive types the template: `[examples]` takes `TcResponseExamples["examples"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcResponseExamples } from "@adamstavely/trenchcoat/response-examples";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading – often the endpoint, "GET /records/{id}" |
| `status` | `string` | The status whose tab is showing ("200") – controlled when given |
| `defaultStatus` | `string` | On mount, when `status` isn't controlled; the first tab when empty |
| `onStatusChange` | `(status: string) => void` | Called with the status of the tab chosen |
| `mediaType` | `string` | The body's media type – controlled when given |
| `defaultMediaType` | `string` | On mount, when `mediaType` isn't controlled; the status's first when empty |
| `onMediaTypeChange` | `(mediaType: string) => void` | Called with the media type chosen for the body |

*Renamed or hidden on the wrapper: `heading`, `status`, `mediaType`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

The tabs are one tab stop; choosing a tab shows its panel straight away.

| Key | What it does |
|---|---|
| ← / → | Move to the previous or next tab and show it |
| Home / End | Go to the first or last tab |
| Tab | Move into the panel: Headers, the media type, then the body's Copy |

### Screen readers

The tabs follow the WAI-ARIA tabs pattern: a tablist named by the heading, each tab controlling its panel. A tab reads
its code, its reason and its class – "404 Not found, Client error". Headers is a disclosure button with
`aria-expanded`, and the media type select has a visible label.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | code-block, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, code-block, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | code-block | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 15.8 KB | 5.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| **Added to a page that already has Lit** | **98.8 KB** | **26.4 KB** |
| With Lit – the first component on a page | 119.5 KB | 33.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.6 ms** | the gallery demo's data, 219 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of examples replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 10 ms | examples: first render, 1,017 nodes; update 0.9 ms |
| 1,000 items | 47 ms | examples: first render, 8,577 nodes; update 7.1 ms |

1,000 items of examples: 47 ms, 8,577 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (code-block), `setTimeout` (inline-diff).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the standard reason phrase; set `label` only when your API uses another ("Rate limited").
- Describe each response in terms of what the caller should do next.
- Keep bodies realistic and short: one record, not a page of them.

## Do and don't

### Do

- Put the success response first; that's the tab that shows.
- Include the headers a client must read, such as `Retry-After` and `ETag`.

### Don't

- Don't put secrets or real personal data in examples.
- Don't list every status the server could return – show the ones a client should handle.

## Related

- [Schema Fields](schema-fields.md) – The fields of an API's request or response from a JSON Schema – each field's name, type in words ("string · email", "array of Tag"), Required, Optional or Deprecated, allowed values, default and limits, and its meaning with code and links; nested objects folding under their field, Expand all, a filter, and a link to every field
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
- [Network Log](network-log.md) – The requests a web page made: status, method, name, size, time and a waterfall, with type chips and a detail of headers and response.
