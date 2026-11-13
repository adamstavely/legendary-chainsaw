<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Endpoint Bar

**Utilities** · New

One API endpoint on one line – the method as a badge in its colour and its word, the base URL or an environment select, the path with each {param} picked out and described on hover and focus, Deprecated and Beta badges, Copy URL and Try it

- **Element:** `<tc-endpoint-bar>`
- **Size:** 7.2 KB gzip · 22.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/endpoint-bar";` |
| React / Next.js | `import { EndpointBar } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/endpoint-bar";` · tags starting with tc- are custom elements |
| Angular | `import { EndpointBar } from "@adamstavely/trenchcoat/angular/endpoint-bar";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/endpoint-bar";` |

## Example

The live example is in the gallery at `#/endpoint-bar`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One API endpoint on one line, the way a reference page heads it. The method is a badge in its colour and its word –
GET, POST, PUT, PATCH or DELETE. The base URL comes next, or a small select when there are several environments, then
the path with each `{param}` picked out; pointing at or focusing a parameter shows what it is. Copy URL and Try it sit
at the end. Deprecated and Beta show as badges in words, and a short summary can follow the path.

### When to use

- The top of an endpoint's page in API reference docs.
- A list of endpoints in a developer portal, one bar each.
- An API explorer, where Try it opens a request form.

### When not to use

- A first request with code to copy – use [Quickstart](quickstart.md).
- A full request or response example – use [Code Block](code-block.md) or [JSON Viewer](json-viewer.md).
- An app's own routes, not an API's – use [Route Map](route-map.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Method** `.ui-epb__method` – the HTTP method in its tone and as text
2. **Environment** `.ui-epb__env-select` – which base URL, when there are several
3. **Base URL** `.ui-epb__base` – the base URL in use
4. **Path** `.ui-epb__path` – the path, wrapping when narrow
5. **Parameter** `.ui-epb__param` – one `{param}`, with its description as a tooltip
6. **Badges** `.ui-epb__badge` – Deprecated or Beta
7. **Copy URL** `.ui-epb__copy` – copies the base URL and path
8. **Try it** `.ui-epb__try` – hands the request to the page

## Looks

Standard is a white bar on a gray tray. Clean is one white card. The method's tone is the only colour: GET green, POST
blue, PUT and PATCH amber, DELETE red – always with the method's word. Below 520 px the path wraps and the buttons take
their own line.

## Usage

### HTML

```html
<tc-endpoint-bar id="get-record" method="GET" path="/v1/records/{record_id}" summary="Get a record"></tc-endpoint-bar>

<script type="module">
  import "@adamstavely/trenchcoat/endpoint-bar";
  import "@adamstavely/trenchcoat/tokens.css";

  const bar = document.querySelector("#get-record");
  bar.params = [{ name: "record_id", type: "string", description: "The record's ID, e.g. rec_8f2a" }];
  bar.environments = [
    { id: "prod", label: "Production", baseUrl: "https://records.example.org" },
    { id: "staging", label: "Staging", baseUrl: "https://staging.records.example.org" },
  ];
  bar.addEventListener("tc-try", (e) => console.log(e.detail.method, e.detail.url));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { EndpointBar } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const environments = [
  { id: "prod", label: "Production", baseUrl: "https://records.example.org" },
  { id: "staging", label: "Staging", baseUrl: "https://staging.records.example.org" },
];

export function GetRecord({ openConsole }: { openConsole: (url: string) => void }) {
  const [environment, setEnvironment] = useState("prod");
  return (
    <EndpointBar
      method="GET"
      path="/v1/records/{record_id}"
      params={[{ name: "record_id", type: "string", description: "The record's ID, e.g. rec_8f2a" }]}
      environments={environments}
      environment={environment}
      onEnvironmentChange={setEnvironment}
      summary="Get a record"
      onTry={(request) => openConsole(request.url)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/endpoint-bar";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";

defineProps<{ params: TcEndpointBar["params"]; environments: TcEndpointBar["environments"] }>();
const onEnvironmentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-endpoint-bar :params="params" :environments="environments" @tc-environment-change="onEnvironmentChange"></tc-endpoint-bar>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EndpointBar } from "@adamstavely/trenchcoat/angular/endpoint-bar";
import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";

@Component({
  selector: "app-endpoint-bar-example",
  imports: [EndpointBar],
  template: `<tc-endpoint-bar [params]="params()" [environments]="environments()" (tc-environment-change)="onEnvironmentChange($event)"></tc-endpoint-bar>`,
})
export class EndpointBarExample {
  readonly params = input.required<TcEndpointBar["params"]>();
  readonly environments = input.required<TcEndpointBar["environments"]>();
  onEnvironmentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/endpoint-bar";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";

  let { params, environments }: { params: TcEndpointBar["params"]; environments: TcEndpointBar["environments"] } = $props();
  let el: TcEndpointBar;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-environment-change", on);
    return () => el.removeEventListener("tc-environment-change", on);
  });
</script>

<tc-endpoint-bar bind:this={el} {params} {environments}></tc-endpoint-bar>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `method` | `method` | `EndpointMethod` | `"GET"` | The HTTP method |
| `path` | `path` | `string` | `"/"` | The path, with parameters in braces, e.g. "/v1/records/{record_id}" |
| `params` | – | `EndpointParam[]` | `[]` | The path parameters' descriptions, by name |
| `environments` | – | `EndpointEnvironment[]` | `[]` | The environments to pick between; with one or none, the base URL is plain text |
| `environment` | `environment` | `string` | `""` | The picked environment's id; by default the first. Changed by the select unless a tc-environment-change listener calls preventDefault() |
| `baseUrl` | `base-url` | `string` | `""` | The base URL when there are no environments |
| `summary` | `summary` | `string` | `""` | A short summary after the path, e.g. "Get a record" |
| `deprecated` | `deprecated` | `boolean` | `false` | Marks the endpoint deprecated |
| `beta` | `beta` | `boolean` | `false` | Marks the endpoint beta |
| `hideTry` | `hide-try` | `boolean` | `false` | Hides Try it |
| `labels` | – | `Partial<EndpointBarLabels>` | `{}` | The element's words, merged over defaultEndpointBarLabels |
| `current` | – | `EndpointEnvironment \| null` | – | The environment in use, or null without environments |
| `url` | – | `` | – | The full URL: the base and the path, parameters left in braces |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-environment-change` | – | Yes | An environment was picked ({ environment }: EndpointEnvironmentChange); cancelable – prevented, `environment` stays as it was |
| `tc-copy` | – | Yes | Copy URL was pressed ({ text }: EndpointCopy); cancelable – prevented, nothing is copied |
| `tc-try` | – | Yes | Try it was pressed ({ method, url, environment }: EndpointTry); cancelable |

#### Design tokens it reads (68)

`--tc-accent-highlight`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-standard`, `--tc-epb-tone`, `--tc-epb-tone-bg`, `--tc-field-bg`, `--tc-field-shadow`, `--tc-field-shadow-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `endpointPathParts(path: string): void` | The path cut into text and {param} parts |

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
| `params` | `el.params = …;` | `<… params={…} />` | `<tc-endpoint-bar :params="…">` | `<tc-endpoint-bar [params]="…">` | `<tc-endpoint-bar {params}>` |
| `environments` | `el.environments = …;` | `<… environments={…} />` | `<tc-endpoint-bar :environments="…">` | `<tc-endpoint-bar [environments]="…">` | `<tc-endpoint-bar {environments}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-endpoint-bar :labels="…">` | `<tc-endpoint-bar [labels]="…">` | `<tc-endpoint-bar {labels}>` |

*Also attributes: `method`, `path`, `environment`, `base-url`, `summary`, `deprecated`, `beta`, `hide-try` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-environment-change` | Yes | `el.addEventListener("tc-environment-change", (e) => …)` | `ref.current.addEventListener("tc-environment-change", …)` | `@tc-environment-change="…"` | `(tc-environment-change)="…($event)"` | `el.addEventListener("tc-environment-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyUrl={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-try` | Yes | `el.addEventListener("tc-try", (e) => …)` | `onTry={…}` | `@tc-try="…"` | `(tc-try)="…($event)"` | `el.addEventListener("tc-try", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `environment` itself unless a listener calls `preventDefault()` on `tc-environment-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-endpoint-bar id="endpoint-bar"></tc-endpoint-bar>

<script type="module">
  import "@adamstavely/trenchcoat/endpoint-bar";

  const el = document.querySelector("#endpoint-bar");
  el.addEventListener("tc-environment-change", (e) => {
    e.preventDefault(); // the element keeps its environment…
    if (allowed(e.detail.environment)) el.environment = e.detail.environment; // …until the app sets it
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
import "@adamstavely/trenchcoat/endpoint-bar";
import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";

const props = defineProps<{ initial: TcEndpointBar["environment"] }>();
const environment = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onEnvironmentChange = (e: CustomEvent<{ environment: TcEndpointBar["environment"] }>) => {
  e.preventDefault();
  environment.value = e.detail.environment;
};
</script>

<template>
  <tc-endpoint-bar :environment="environment" @tc-environment-change="onEnvironmentChange"></tc-endpoint-bar>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EndpointBar } from "@adamstavely/trenchcoat/angular/endpoint-bar";
import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";

@Component({
  selector: "app-controlled-endpoint-bar",
  imports: [EndpointBar],
  template: `<tc-endpoint-bar [environment]="environment()" (tc-environment-change)="onEnvironmentChange($event)"></tc-endpoint-bar>`,
})
export class ControlledEndpointBar {
  readonly initial = input.required<TcEndpointBar["environment"]>();
  readonly environment = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onEnvironmentChange(e: CustomEvent<{ environment: TcEndpointBar["environment"] }>) {
    e.preventDefault();
    this.environment.set(e.detail.environment);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/endpoint-bar";
  import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";

  let { initial }: { initial: TcEndpointBar["environment"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let environment = $derived(initial);
  let el: TcEndpointBar;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      environment = (e as CustomEvent<{ environment: TcEndpointBar["environment"] }>).detail.environment;
    };
    el.addEventListener("tc-environment-change", on);
    return () => el.removeEventListener("tc-environment-change", on);
  });
</script>

<tc-endpoint-bar bind:this={el} {environment}></tc-endpoint-bar>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-endpoint-bar")` returns a `TcEndpointBar` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";`
- **React / Next.js:** Props: `import type { EndpointBarProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EndpointBar>`. The element class, for refs: `import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEndpointBar["params"]` with `import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";`
- **Angular:** The directive types the template: `[params]` takes `TcEndpointBar["params"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEndpointBar } from "@adamstavely/trenchcoat/endpoint-bar";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `environment` | `string` | The picked environment's id – controlled when given |
| `defaultEnvironment` | `string` | The environment on mount, when `environment` isn't controlled; by default the first |
| `onEnvironmentChange` | `(environment: string) => void` | Called with the environment the user picked |
| `onCopyUrl` | `(url: string) => boolean \| void` | Copy URL was pressed; return false to stop the copy |
| `onTry` | `(request: EndpointTry) => void` | Try it was pressed |

*Renamed or hidden on the wrapper: `environment`, `children`*

## Accessibility

Follows the WAI-ARIA [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the environment select, each parameter, Copy URL and Try it |
| Escape | On a parameter, hides its tooltip until the next hover or focus |
| Enter / Space | Copies the URL, or tries the request |

### Screen readers

Each parameter is a button named “Path parameter {record_id}” and described by its tooltip, so its type and meaning
are read after the name; the tooltip itself is hidden from screen readers. The environment select is labelled
“Environment”. The method, badges and summary are text. Copying the URL is announced politely with the URL.

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
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

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
| **This component alone** | 15.3 KB | 5.1 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.4 KB** | **7.2 KB** |
| With Lit – the first component on a page | 42.0 KB | 13.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.9 ms** | the gallery demo's data, 30 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | one item of environments replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.3 ms | environments: first render, 128 nodes; update 0.1 ms |
| 1,000 items | 13 ms | environments: first render, 1,028 nodes; update 1.3 ms |

1,000 items of environments: 13 ms, 1,028 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Write the path exactly as the API takes it, with parameters in braces.
- Describe every parameter, with an example value: “The record's ID, e.g. rec_8f2a”.
- Keep the summary to a few words – “Get a record” – and leave the detail to the page.

## Do and don't

### Do

- Mark deprecated endpoints, and say what replaces them on the page.
- Give every environment a plain label – Production, Staging.
- Open a request form or console from Try it.

### Don't

- Don't fill the parameters into the path; the braces show what to replace.
- Don't rely on the method's colour – the word is always there.
- Don't put more than one endpoint in a bar.

## Related

- [Quickstart](quickstart.md) – A first API request with the key filled in – cURL, Python, TypeScript and Go tabs over four numbered steps (Install, Set your key, Send a request, See the response), the key in an environment variable shown masked until revealed, Copy that warns when it copies the key, and Run it with the response the page passes back
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Route Map](route-map.md) – An app's routes as an indented list with :params picked out, a status mark and word, load time and last visit; status chips filter it, and pressing a route opens it.
- [JSON Viewer](json-viewer.md) – A JSON document laid out for review – Document, Tree and Raw views, search across them, flags with notes on fields, Copy and Download – inline or as a dialog
