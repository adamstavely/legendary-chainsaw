<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Quickstart

**AI configuration** · New

A first API request with the key filled in – cURL, Python, TypeScript and Go tabs over four numbered steps (Install, Set your key, Send a request, See the response), the key in an environment variable shown masked until revealed, Copy that warns when it copies the key, and Run it with the response the page passes back

- **Element:** `<tc-quickstart>`
- **Size:** 9.8 KB gzip · 28.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/quickstart";` |
| React / Next.js | `import { Quickstart } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/quickstart";` · tags starting with tc- are custom elements |
| Angular | `import { Quickstart } from "@adamstavely/trenchcoat/angular/quickstart";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/quickstart";` |

## Example

The live example is in the gallery at `#/quickstart`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A first request to an API with the person's key already filled in. Tabs switch between cURL, Python, TypeScript and
Go, and four numbered steps follow: Install, Set your key, Send a request and See the response. The key goes into an
environment variable in step 2, shown masked until Reveal key is pressed; the request in step 3 reads that variable,
so the key never sits in code someone might paste. Each step has Copy, which always copies the real key and says so in
a warning. Run it hands the request to the page, which sends it and passes the response back.

### When to use

- The first page a developer sees after creating an API key.
- A docs page's "try your first call" box, signed in.
- Onboarding for an internal API, where people need one working request before anything else.

### When not to use

- A single code sample with nothing to set up – use [Code Block](code-block.md).
- One endpoint's heading on a reference page – use [Endpoint Bar](endpoint-bar.md).
- Entering or storing a secret – use [Secret Field](secret-field.md).
- A checklist of setup tasks across a product – use [Setup Guide](setup-guide.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-qks__tabs` – the languages
2. **Step** `.ui-qks__step` – one numbered step: Install, Set your key, Send a request, See the response
3. **Code** `.ui-qks__pre` – the step's command or request
4. **Copy** `.ui-qks__copy` – copies the step's text, with the real key
5. **Reveal key** `.ui-qks__reveal` – shows or masks the key
6. **Warning** `.ui-qks__warning` – after copying the key, a reminder to keep it private
7. **Run it** `.ui-qks__run` – sends the request through the page
8. **Response** `.ui-qks__response` – the response the page passed back, with its status

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. Code sits on the sunken surface in the mono font. The step numbers' size is the component token
`--tc-qks-num`; below 400 px the numbers hide and the steps take the full width.

## Usage

### HTML

```html
<tc-quickstart
  id="quickstart"
  heading="Search records"
  base-url="https://records.example.org"
  api-key="sk-test-0000a1b2c3d4e5f60000"
  env-var="RECORDS_API_KEY"
  storage-key="records-quickstart"
></tc-quickstart>

<script type="module">
  import "@adamstavely/trenchcoat/quickstart";
  import "@adamstavely/trenchcoat/tokens.css";

  const quickstart = document.querySelector("#quickstart");
  quickstart.endpoint = { method: "POST", path: "/v1/records/search", body: { query: "travel policy" } };
  quickstart.addEventListener("tc-run", () => {
    setTimeout(() => {
      quickstart.response = JSON.stringify({ results: [], total: 0 }, null, 2);
      quickstart.responseStatus = "200 OK";
      quickstart.running = false;
    }, 500);
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Quickstart, type QuickstartRun } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FirstRequest({ apiKey, send }: { apiKey: string; send: (run: QuickstartRun) => Promise<string> }) {
  const [response, setResponse] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  return (
    <Quickstart
      title="Search records"
      baseUrl="https://records.example.org"
      endpoint={{ method: "POST", path: "/v1/records/search", body: { query: "travel policy" } }}
      apiKey={apiKey}
      envVar="RECORDS_API_KEY"
      storageKey="records-quickstart"
      response={response}
      running={running}
      onRun={(run) => {
        setRunning(true);
        void send(run).then((text) => {
          setResponse(text);
          setRunning(false);
        });
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/quickstart";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";

defineProps<{ endpoint: TcQuickstart["endpoint"]; languages: TcQuickstart["languages"] }>();
const onLanguageChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-quickstart :endpoint="endpoint" :languages="languages" @tc-language-change="onLanguageChange"></tc-quickstart>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { Quickstart } from "@adamstavely/trenchcoat/angular/quickstart";
import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";

@Component({
  selector: "app-quickstart-example",
  imports: [Quickstart],
  template: `<tc-quickstart [endpoint]="endpoint()" [languages]="languages()" (tc-language-change)="onLanguageChange($event)"></tc-quickstart>`,
})
export class QuickstartExample {
  readonly endpoint = input.required<TcQuickstart["endpoint"]>();
  readonly languages = input.required<TcQuickstart["languages"]>();
  onLanguageChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quickstart";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";

  let { endpoint, languages }: { endpoint: TcQuickstart["endpoint"]; languages: TcQuickstart["languages"] } = $props();
  let el: TcQuickstart;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-language-change", on);
    return () => el.removeEventListener("tc-language-change", on);
  });
</script>

<tc-quickstart bind:this={el} {endpoint} {languages}></tc-quickstart>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Quickstart"` | The heading |
| `description` | `description` | `string` | `""` | A line under the heading |
| `baseUrl` | `base-url` | `string` | `"https://api.example.com"` | The API's base URL, e.g. "https://api.example.com" |
| `endpoint` | – | `QuickstartEndpoint` | `{ method: "GET", path: "/v1/status" }` | The request to make: method, path and an optional JSON body |
| `apiKey` | `api-key` | `string` | `""` | The person's API key – shown masked until revealed, and copied whole |
| `envVar` | `env-var` | `string` | `"API_KEY"` | The environment variable the key goes into |
| `language` | `language` | `QuickstartLanguage` | `"curl"` | The language shown. Changed by the tabs unless a tc-language-change listener calls preventDefault() |
| `languages` | – | `QuickstartLanguage[]` | `["curl", "python", "typescript", "go"]` | The languages offered, in order |
| `storageKey` | `storage-key` | `string` | `""` | A localStorage key to remember the chosen language under; none by default |
| `response` | – | `string \| null` | `null` | The response to show in step 4, as text; null before a run |
| `responseStatus` | `response-status` | `string` | `""` | The response's status, e.g. "200 OK" |
| `running` | `running` | `boolean` | `false` | A request is on its way: Run it waits and the response area is busy |
| `hideRun` | `hide-run` | `boolean` | `false` | Hides Run it and step 4 |
| `labels` | – | `QuickstartLabelsInput` | `{}` | The element's words, merged over defaultQuickstartLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-language-change` | – | Yes | A language tab was picked ({ language }: QuickstartLanguageChange); cancelable – prevented, `language` stays as it was |
| `tc-copy` | – | Yes | A step's text was copied ({ step, text, containsKey }: QuickstartCopy); cancelable – prevented, nothing is copied |
| `tc-run` | – | Yes | Run it was pressed ({ language, method, url, body }: QuickstartRun); cancelable – prevented, `running` isn't set |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-qks-num` | `22px` | both |

#### Design tokens it reads (56)

`--tc-accent-solid`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-pill-font-size`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-syntax-text`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `maskKey(key: string): void` | The key with its middle masked: "sk-test-••••••••4f2a" |
| `quickstartSnippet(language: QuickstartLanguage, baseUrl: string, endpoint: QuickstartEndpoint, envVar: unknown): void` | The request in one language, reading the key from the `envVar` environment variable |
| `quickstartInstall(language: QuickstartLanguage): void` | The install step's command in one language |

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
| `endpoint` | `el.endpoint = …;` | `<… endpoint={…} />` | `<tc-quickstart :endpoint="…">` | `<tc-quickstart [endpoint]="…">` | `<tc-quickstart {endpoint}>` |
| `languages` | `el.languages = …;` | `<… languages={…} />` | `<tc-quickstart :languages="…">` | `<tc-quickstart [languages]="…">` | `<tc-quickstart {languages}>` |
| `response` | `el.response = …;` | `<… response={…} />` | `<tc-quickstart :response="…">` | `<tc-quickstart [response]="…">` | `<tc-quickstart {response}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-quickstart :labels="…">` | `<tc-quickstart [labels]="…">` | `<tc-quickstart {labels}>` |

*Also attributes: `heading`, `description`, `base-url`, `api-key`, `env-var`, `language`, `storage-key`, `response-status` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-language-change` | Yes | `el.addEventListener("tc-language-change", (e) => …)` | `ref.current.addEventListener("tc-language-change", …)` | `@tc-language-change="…"` | `(tc-language-change)="…($event)"` | `el.addEventListener("tc-language-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onCopyStep={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-run` | Yes | `el.addEventListener("tc-run", (e) => …)` | `onRun={…}` | `@tc-run="…"` | `(tc-run)="…($event)"` | `el.addEventListener("tc-run", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `language` itself unless a listener calls `preventDefault()` on `tc-language-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-quickstart id="quickstart"></tc-quickstart>

<script type="module">
  import "@adamstavely/trenchcoat/quickstart";

  const el = document.querySelector("#quickstart");
  el.addEventListener("tc-language-change", (e) => {
    e.preventDefault(); // the element keeps its language…
    if (allowed(e.detail.language)) el.language = e.detail.language; // …until the app sets it
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
import "@adamstavely/trenchcoat/quickstart";
import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";

const props = defineProps<{ initial: TcQuickstart["language"] }>();
const language = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLanguageChange = (e: CustomEvent<{ language: TcQuickstart["language"] }>) => {
  e.preventDefault();
  language.value = e.detail.language;
};
</script>

<template>
  <tc-quickstart :language="language" @tc-language-change="onLanguageChange"></tc-quickstart>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { Quickstart } from "@adamstavely/trenchcoat/angular/quickstart";
import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";

@Component({
  selector: "app-controlled-quickstart",
  imports: [Quickstart],
  template: `<tc-quickstart [language]="language()" (tc-language-change)="onLanguageChange($event)"></tc-quickstart>`,
})
export class ControlledQuickstart {
  readonly initial = input.required<TcQuickstart["language"]>();
  readonly language = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLanguageChange(e: CustomEvent<{ language: TcQuickstart["language"] }>) {
    e.preventDefault();
    this.language.set(e.detail.language);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/quickstart";
  import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";

  let { initial }: { initial: TcQuickstart["language"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let language = $derived(initial);
  let el: TcQuickstart;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      language = (e as CustomEvent<{ language: TcQuickstart["language"] }>).detail.language;
    };
    el.addEventListener("tc-language-change", on);
    return () => el.removeEventListener("tc-language-change", on);
  });
</script>

<tc-quickstart bind:this={el} {language}></tc-quickstart>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-quickstart")` returns a `TcQuickstart` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";`
- **React / Next.js:** Props: `import type { QuickstartProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Quickstart>`. The element class, for refs: `import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcQuickstart["endpoint"]` with `import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";`
- **Angular:** The directive types the template: `[endpoint]` takes `TcQuickstart["endpoint"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcQuickstart } from "@adamstavely/trenchcoat/quickstart";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `language` | `QuickstartLanguage` | The language shown – controlled when given |
| `defaultLanguage` | `QuickstartLanguage` | The language on mount, when `language` isn't controlled |
| `onLanguageChange` | `(language: QuickstartLanguage) => void` | Called with the language the user picked |
| `onCopyStep` | `(copy: QuickstartCopy) => boolean \| void` | A step's text was copied; return false to stop the copy |
| `onRun` | `(run: QuickstartRun) => boolean \| void` | Run it was pressed: send the request, then pass `response` and clear `running`; return false to leave `running` off |

*Renamed or hidden on the wrapper: `heading`, `language`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

The tabs are one tab stop; the panel follows the selected tab.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next language, and shows it |
| Home / End | Moves to the first or last language |
| Tab | Moves into the steps: each code block, Copy, Reveal key, Run it |

### Screen readers

The languages are a `tablist` of `tab`s controlling one `tabpanel`. Each step is a list item with a heading that
includes its number: “Step 2: Set your key”. Code blocks are focusable regions named by their step, so they can be
scrolled from the keyboard. Copy's name is its visible word plus the step: “Copy Set your key”. Reveal key is a toggle
button (`aria-pressed`). Copying, sending and the response arriving are announced politely; copying the key announces
the warning.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
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
| **This component alone** | 20.9 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.6 KB** | **9.8 KB** |
| With Lit – the first component on a page | 48.2 KB | 16.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.4 ms** | the gallery demo's data, 80 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of languages replaced |
| First on the page | 15 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.9 ms | languages: first render, 176 nodes; update 0.4 ms |
| 1,000 items | 14 ms | languages: first render, 1,076 nodes; update 2.0 ms |

1,000 items of languages: 14 ms, 1,076 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Use the person's real key, and an environment variable name that matches your docs.
- Pick an endpoint that's safe to call and returns something worth seeing – a search, a status, a list.
- Keep the body small; the snippet is for a first call, not a full integration.

## Do and don't

### Do

- Mask the key by default, and keep Reveal for when people need to check it.
- Remember the chosen language with `storage-key`, so a returning developer sees theirs.
- Show the real response, status included, when Run it succeeds.

### Don't

- Don't paste the key into the request itself – the environment variable keeps it out of code.
- Don't send the request from the element; Run it hands it to the page, which knows how to call your API.
- Don't use a real key in demos or screenshots – use a test placeholder.

## Related

- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Endpoint Bar](endpoint-bar.md) – One API endpoint on one line – the method as a badge in its colour and its word, the base URL or an environment select, the path with each {param} picked out and described on hover and focus, Deprecated and Beta badges, Copy URL and Try it
- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
