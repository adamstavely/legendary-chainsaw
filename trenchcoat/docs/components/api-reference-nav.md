<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# API Reference Nav

**Utilities** · New

An API reference's side navigation – endpoints grouped by resource, each a link with its method as a badge in a colour and a word, its name or (with the Paths switch) its path, deprecated ones struck through; a filter by name, path or method, the current page in view, and tree keys with type-ahead

- **Element:** `<tc-api-reference-nav>`
- **Size:** 8.8 KB gzip · 27.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/api-reference-nav";` |
| React / Next.js | `import { ApiReferenceNav } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/api-reference-nav";` · tags starting with tc- are custom elements |
| Angular | `import { ApiReferenceNav } from "@adamstavely/trenchcoat/angular/api-reference-nav";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/api-reference-nav";` |

## Example

The live example is in the gallery at `#/api-reference-nav`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The side navigation of an API reference. Endpoints are grouped by resource – Records, Search, Exports – and each one
is a link with its method as a badge, in a colour and a word (GET, POST, PATCH, DELETE), then its short name. The
Paths switch shows each endpoint's path instead (`/v1/records/{id}`). A field filters by name, path or method: groups
with no match drop out and the rest open, and the count above the list says how many match. The current endpoint is
marked `aria-current="page"` and scrolled into view; deprecated endpoints are struck through and say "Deprecated".
Every plain click fires a cancelable `tc-navigate`, so a router can take it; unless it's prevented the endpoint
becomes `current`.

### When to use

- The left column of an API reference or SDK docs site, with more endpoints than fit in a glance.
- Any reference grouped by resource where the method matters as much as the name.

### When not to use

- An app's main navigation – use [Side Nav](side-nav.md).
- Choosing an item from a tree in a form – use [Tree Select](tree-select.md).
- A single endpoint's request and response – use [Code Block](code-block.md) beside the page's own text.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Paths switch** `.ui-arn__paths` – in the header; shows paths instead of names
2. **Filter** `.ui-arn__filter-input` – filters by name, path or method; every word must match
3. **Count** `.ui-arn__count` – how many endpoints, or how many match the filter
4. **Tree** `.ui-arn__tree` – the groups and their endpoints, scrolling past `--tc-arn-max-h`
5. **Group** `.ui-arn__group` – a resource with a chevron and how many endpoints it holds; opens and closes
6. **Endpoint** `.ui-arn__endpoint` – a link to one endpoint's page
7. **Method** `.ui-arn__method` – the badge: reads in blue, creates in green, changes in amber, deletes in red, others
8. **Deprecated** `.ui-arn__deprecated` – the word after a deprecated endpoint's struck-through name

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first
row, and tints the current endpoint in the accent. `--tc-arn-max-h` on `tc-api-reference-nav` sets how tall the tree
grows before it scrolls (520px by default), and `--tc-arn-method-w` the badges' width.

## Usage

### HTML

```html
<tc-api-reference-nav heading="Records API" description="v1" current="records-get"></tc-api-reference-nav>

<script type="module">
  import "@adamstavely/trenchcoat/api-reference-nav";
  import "@adamstavely/trenchcoat/tokens.css";

  const nav = document.querySelector("tc-api-reference-nav");
  nav.groups = [
    {
      id: "records",
      label: "Records",
      endpoints: [
        { id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "#records-list" },
        { id: "records-get", name: "Get a record", method: "GET", path: "/v1/records/{id}", href: "#records-get" },
        { id: "records-create", name: "Create a record", method: "POST", path: "/v1/records", href: "#records-create" },
      ],
    },
    {
      id: "exports",
      label: "Exports",
      endpoints: [{ id: "exports-csv", name: "Export as CSV", method: "GET", path: "/v1/records.csv", href: "#exports-csv", deprecated: true }],
    },
  ];
  nav.addEventListener("tc-navigate", (e) => console.log(e.detail.id, e.detail.href));
</script>
```

### React / Next.js

```tsx
import { ApiReferenceNav, type ApiNavGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: ApiNavGroup[] = [
  {
    id: "records",
    label: "Records",
    endpoints: [
      { id: "records-list", name: "List records", method: "GET", path: "/v1/records", href: "/api/records-list" },
      { id: "records-create", name: "Create a record", method: "POST", path: "/v1/records", href: "/api/records-create" },
    ],
  },
];

export function ReferenceNav({ current, go }: { current: string; go: (href: string) => void }) {
  return (
    <ApiReferenceNav
      title="Records API"
      groups={groups}
      current={current}
      onNavigate={(_id, href, event) => {
        if (!href) return;
        event.preventDefault();
        go(href);
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/api-reference-nav";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";

defineProps<{ groups: TcApiReferenceNav["groups"]; collapsed: TcApiReferenceNav["collapsed"] }>();
const onNavigate = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-api-reference-nav :groups="groups" :collapsed="collapsed" @tc-navigate="onNavigate"></tc-api-reference-nav>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ApiReferenceNav } from "@adamstavely/trenchcoat/angular/api-reference-nav";
import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";

@Component({
  selector: "app-api-reference-nav-example",
  imports: [ApiReferenceNav],
  template: `<tc-api-reference-nav [groups]="groups()" [collapsed]="collapsed()" (tc-navigate)="onNavigate($event)"></tc-api-reference-nav>`,
})
export class ApiReferenceNavExample {
  readonly groups = input.required<TcApiReferenceNav["groups"]>();
  readonly collapsed = input.required<TcApiReferenceNav["collapsed"]>();
  onNavigate(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/api-reference-nav";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";

  let { groups, collapsed }: { groups: TcApiReferenceNav["groups"]; collapsed: TcApiReferenceNav["collapsed"] } = $props();
  let el: TcApiReferenceNav;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-api-reference-nav bind:this={el} {groups} {collapsed}></tc-api-reference-nav>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"API reference"` | The header's title |
| `description` | `description` | `string` | `""` | A quiet line under the title: the version, the base URL |
| `groups` | – | `ApiNavGroup[]` | `[]` | The resources and their endpoints, in order |
| `current` | `current` | `string \| null` | `null` | The current endpoint's id – aria-current="page". Set by a click unless a tc-navigate listener calls preventDefault() |
| `query` | `query` | `string` | `""` | The filter's text. Changed by typing unless a tc-query-change listener calls preventDefault() |
| `showPaths` | `show-paths` | `boolean` | `false` | Show each endpoint's path instead of its name. Changed by the Paths switch unless a tc-show-paths-change listener calls preventDefault() |
| `collapsed` | – | `string[]` | `[]` | The ids of closed groups. Changed by opening and closing unless a tc-collapsed-change listener calls preventDefault() |
| `hideFilter` | `hide-filter` | `boolean` | `false` | Hide the filter field (for a short reference) |
| `labels` | – | `Partial<ApiNavLabels>` | `{}` | The words, merged over defaultApiNavLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-navigate` | – | Yes | An endpoint was chosen ({ id, href, endpoint, current }: ApiNavNavigate); cancelable – prevented, a link isn't followed and `current` stays |
| `tc-query-change` | – | Yes | The filter changed ({ query }: ApiNavQueryChange); cancelable – prevented, `query` stays |
| `tc-show-paths-change` | – | Yes | The Paths switch was pressed ({ showPaths }: ApiNavShowPathsChange); cancelable – prevented, `showPaths` stays |
| `tc-collapsed-change` | – | Yes | A group was opened or closed ({ collapsed, id, open }: ApiNavCollapsedChange); cancelable – prevented, `collapsed` stays |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-arn-max-h` | `520px` | both |
| `--tc-arn-method-w` | `44px` | both |
| `--tc-arn-icon` | `14px` | both |

#### Design tokens it reads (61)

`--tc-accent-solid`, `--tc-accent-text`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-tracking`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `apiMethodTone(method: string): "read" \| "create" \| "change" \| "delete" \| "other"` | The tone a method's badge takes: reads in blue, creates in green, changes in amber, deletes in red |
| `apiEndpointMatches(endpoint: ApiEndpoint, query: string): void` | Whether an endpoint matches a filter: every word must be in its name, path or method |

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-api-reference-nav :groups="…">` | `<tc-api-reference-nav [groups]="…">` | `<tc-api-reference-nav {groups}>` |
| `collapsed` | `el.collapsed = …;` | `<… collapsed={…} />` | `<tc-api-reference-nav :collapsed="…">` | `<tc-api-reference-nav [collapsed]="…">` | `<tc-api-reference-nav {collapsed}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-api-reference-nav :labels="…">` | `<tc-api-reference-nav [labels]="…">` | `<tc-api-reference-nav {labels}>` |

*Also attributes: `heading`, `description`, `current`, `query`, `show-paths`, `hide-filter` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-navigate` | Yes | `el.addEventListener("tc-navigate", (e) => …)` | `onNavigate={…}` | `@tc-navigate="…"` | `(tc-navigate)="…($event)"` | `el.addEventListener("tc-navigate", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-show-paths-change` | Yes | `el.addEventListener("tc-show-paths-change", (e) => …)` | `ref.current.addEventListener("tc-show-paths-change", …)` | `@tc-show-paths-change="…"` | `(tc-show-paths-change)="…($event)"` | `el.addEventListener("tc-show-paths-change", …)` |
| `tc-collapsed-change` | Yes | `el.addEventListener("tc-collapsed-change", (e) => …)` | `ref.current.addEventListener("tc-collapsed-change", …)` | `@tc-collapsed-change="…"` | `(tc-collapsed-change)="…($event)"` | `el.addEventListener("tc-collapsed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `current`, `query`, `showPaths` and `collapsed` itself unless a listener calls `preventDefault()` on `tc-navigate`, `tc-query-change`, `tc-show-paths-change` or `tc-collapsed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-api-reference-nav id="api-reference-nav"></tc-api-reference-nav>

<script type="module">
  import "@adamstavely/trenchcoat/api-reference-nav";

  const el = document.querySelector("#api-reference-nav");
  el.addEventListener("tc-navigate", (e) => {
    e.preventDefault(); // the element keeps its current…
    if (allowed(e.detail.current)) el.current = e.detail.current; // …until the app sets it
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
import "@adamstavely/trenchcoat/api-reference-nav";
import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";

const props = defineProps<{ initial: TcApiReferenceNav["current"] }>();
const current = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onNavigate = (e: CustomEvent<{ current: TcApiReferenceNav["current"] }>) => {
  e.preventDefault();
  current.value = e.detail.current;
};
</script>

<template>
  <tc-api-reference-nav :current="current" @tc-navigate="onNavigate"></tc-api-reference-nav>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ApiReferenceNav } from "@adamstavely/trenchcoat/angular/api-reference-nav";
import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";

@Component({
  selector: "app-controlled-api-reference-nav",
  imports: [ApiReferenceNav],
  template: `<tc-api-reference-nav [current]="current()" (tc-navigate)="onNavigate($event)"></tc-api-reference-nav>`,
})
export class ControlledApiReferenceNav {
  readonly initial = input.required<TcApiReferenceNav["current"]>();
  readonly current = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onNavigate(e: CustomEvent<{ current: TcApiReferenceNav["current"] }>) {
    e.preventDefault();
    this.current.set(e.detail.current);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/api-reference-nav";
  import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";

  let { initial }: { initial: TcApiReferenceNav["current"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let current = $derived(initial);
  let el: TcApiReferenceNav;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      current = (e as CustomEvent<{ current: TcApiReferenceNav["current"] }>).detail.current;
    };
    el.addEventListener("tc-navigate", on);
    return () => el.removeEventListener("tc-navigate", on);
  });
</script>

<tc-api-reference-nav bind:this={el} {current}></tc-api-reference-nav>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-api-reference-nav")` returns a `TcApiReferenceNav` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";`
- **React / Next.js:** Props: `import type { ApiReferenceNavProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ApiReferenceNav>`. The element class, for refs: `import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcApiReferenceNav["groups"]` with `import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";`
- **Angular:** The directive types the template: `[groups]` takes `TcApiReferenceNav["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcApiReferenceNav } from "@adamstavely/trenchcoat/api-reference-nav";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The header's title |
| `current` | `string \| null` | The current endpoint's id – controlled when given; your router sets it |
| `defaultCurrent` | `string \| null` | The current endpoint at first, when `current` isn't controlled; then a click moves it |
| `onNavigate` | `(id: string, href: string \| undefined, event: CustomEvent<ApiNavNavigate>) => void` | An endpoint was chosen; call `event.preventDefault()` to route a link yourself instead of following it |
| `query` | `string` | The filter's text – controlled when given |
| `defaultQuery` | `string` | The filter's text at first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | Called with the filter's new text |
| `showPaths` | `boolean` | Paths instead of names – controlled when given |
| `defaultShowPaths` | `boolean` | Paths at first, when `showPaths` isn't controlled |
| `onShowPathsChange` | `(showPaths: boolean) => void` | Called when the Paths switch is pressed |
| `collapsed` | `string[]` | The ids of closed groups – controlled when given |
| `defaultCollapsed` | `string[]` | The closed groups at first, when `collapsed` isn't controlled |
| `onCollapsedChange` | `(collapsed: string[]) => void` | Called with the closed groups after one is opened or closed |

*Renamed or hidden on the wrapper: `heading`, `current`, `query`, `showPaths`, `collapsed`*

## Accessibility

Follows the WAI-ARIA [Tree view pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the Paths switch, the filter, then the tree (one stop) |
| ↓ in the filter | Moves into the tree |
| Escape in the filter | Clears it |
| ↓ / ↑ | Next or previous group or endpoint |
| → | Opens a closed group, or moves to its first endpoint |
| ← | Closes an open group, or moves from an endpoint to its group |
| Home / End | First or last item |
| Enter | Follows an endpoint's link, or opens and closes a group |
| A letter | Moves to the next item that starts with it; keep typing for more letters |

### Screen readers

The card is a `nav` landmark named by the heading, holding a `tree` of rows with their level, position and set size.
Groups are level-1 `treeitem`s with `aria-expanded`, named by their label and count ("Records 5 endpoints");
endpoints are level-2 links with the `treeitem` role, named by their method and name ("PATCH Update a record"), with
the path as their description – or the other way round with Paths on. The current endpoint is
`aria-current="page"`. The filter is labelled "Filter endpoints" and described by the count; a filter's result ("3 of
12 endpoints", or "No endpoints match") is announced politely. The Paths switch is a toggle button (`aria-pressed`).

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.9 KB | 6.5 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.6 KB** | **8.8 KB** |
| With Lit – the first component on a page | 47.2 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 96 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of groups replaced |
| First on the page | 28 ms | default properties; includes adding its CSS to the document |
| 100 items | 13 ms | groups: first render, 1,848 nodes; update 2.2 ms |
| 1,000 items | 105 ms | groups: first render, 18,273 nodes; update 11 ms |

1,000 items of groups: 105 ms. It renders every item, so a first render passes 50 ms (a long task) at about 480 items – page or filter longer lists.

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

- Name endpoints as actions in sentence case: "List records", "Get a record", "Place a legal hold".
- Use the resource's plural noun for groups, in the order people meet them: the main resource first.
- Write paths as the API has them, with `{placeholders}` for parameters.
- Mark an endpoint `deprecated` until it's removed, and say in its page what replaces it.

## Do and don't

### Do

- Set `current` from your router, so the highlight follows the URL and the back button.
- Keep a group's endpoints in the order the docs pages run: list, get, create, update, delete.

### Don't

- Don't put guides or tutorials in the tree – link to them above it.
- Don't rely on the badge's colour alone in your own pages; this element always writes the method too.

## Related

- [Side Nav](side-nav.md) – An app's main navigation down the side – brand, places with icons and badges in sections, the current page, real links with a cancelable `tc-navigate` for routing, a footer of the page's own and a fold into an icon-only rail
- [Tree Select](tree-select.md) – Pick one or many from a nested hierarchy: the picked path in the field, a filterable tree with the parents of every match kept, ARIA tree keys, and parent checkboxes that check what's beneath them
- [Copy Page Menu](copy-page-menu.md) – A docs page's Copy page button, for handing the page to a model – copies it as Markdown, with a menu to view the Markdown in a dialog, copy the link, open the page in a chat assistant with a prompt filled in, or download it as a .md file
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
