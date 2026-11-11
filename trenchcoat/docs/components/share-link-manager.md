<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Share Link Manager

**Trust & calibration** · New

The links that already share something – status in words, expiry, opens and who made them, with Copy, Change expiry and Revoke, which says how many opens it's had

- **Element:** `<tc-share-link-manager>`
- **Size:** 7.5 KB gzip · 22.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/share-link-manager";` |
| React / Next.js | `import { ShareLinkManager } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/share-link-manager";` · tags starting with tc- are custom elements |
| Angular | `import { ShareLinkManager } from "@adamstavely/trenchcoat/angular/share-link-manager";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/share-link-manager";` |

## Example

The live example is in the gallery at `#/share-link-manager`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The links that already share something: who made each, what it allows, when it expires, how many times it's been opened, and whether it's active, expiring soon, expired or revoked. Copy, Change expiry and Revoke act on one link, and revoking asks first.

### When to use

- Showing and managing links to a file or folder.

### When not to use

- Sharing with named people and groups – use [Share Panel](share-panel.md).
- Reviewing everyone's access – use [Access Review](../blocks/access-review.md).
- Secrets such as API keys – use [Secret Field](secret-field.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-slm__row` – one link, with `.ui-slm__name` and `.ui-slm__url`
2. **Status** `.ui-slm__status` – in words
3. **Facts** `.ui-slm__facts` – access, expiry, `.ui-slm__password`, opens and who made it
4. **Actions** `.ui-slm__actions` – `.ui-slm__copy`, `.ui-slm__change` and `.ui-slm__revoke`
5. **Question** `.ui-slm__confirm` – says how many opens it's had before revoking
6. **Create** `.ui-slm__create` – with `creatable`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.

## Usage

### HTML

```html
<tc-share-link-manager id="links" creatable></tc-share-link-manager>

<script type="module">
  import "@adamstavely/trenchcoat/share-link-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const manager = document.querySelector("#links");
  manager.now = Date.now();
  manager.links = [{ id: "a", url: "https://example.org/l/8f2a", createdBy: "Noor Haddad", createdAt: Date.now(), access: "Can view" }];
  manager.addEventListener("tc-links-change", (e) => console.log(e.detail.change));
</script>
```

### React / Next.js

```tsx
import { ShareLinkManager, type ShareLink } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const links: ShareLink[] = [{ id: "a", url: "https://example.org/l/8f2a", createdBy: "Noor Haddad", createdAt: 1793000000000, access: "Can view" }];

export function Links({ now }: { now: number }) {
  return <ShareLinkManager defaultLinks={links} now={now} onLinksChange={(next) => console.log(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/share-link-manager";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";

defineProps<{ links: TcShareLinkManager["links"]; labels: TcShareLinkManager["labels"] }>();
const onLinksChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-share-link-manager :links="links" :labels="labels" @tc-links-change="onLinksChange"></tc-share-link-manager>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ShareLinkManager } from "@adamstavely/trenchcoat/angular/share-link-manager";
import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";

@Component({
  selector: "app-share-link-manager-example",
  imports: [ShareLinkManager],
  template: `<tc-share-link-manager [links]="links()" [labels]="labels()" (tc-links-change)="onLinksChange($event)"></tc-share-link-manager>`,
})
export class ShareLinkManagerExample {
  readonly links = input.required<TcShareLinkManager["links"]>();
  readonly labels = input.required<TcShareLinkManager["labels"]>();
  onLinksChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/share-link-manager";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";

  let { links, labels }: { links: TcShareLinkManager["links"]; labels: TcShareLinkManager["labels"] } = $props();
  let el: TcShareLinkManager;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-links-change", on);
    return () => el.removeEventListener("tc-links-change", on);
  });
</script>

<tc-share-link-manager bind:this={el} {links} {labels}></tc-share-link-manager>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Share links" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading, such as what's being shared |
| `links` | – | `ShareLink[]` | `[]` | The links. Changed by the user unless a tc-links-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for expiry, epoch ms. The element doesn't read the clock |
| `expiringDays` | `expiring-days` | `number` | `7` | How many days before expiry a link counts as expiring soon |
| `creatable` | `creatable` | `boolean` | `false` | Offer Create link |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates |
| `labels` | – | `Partial<ShareLinkManagerLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-links-change` | – | Yes | A link was revoked or its expiry changed ({ links, change, link }: ShareLinksChange); cancelable – prevented, `links` stays as it was |
| `tc-copy` | – | Yes | Copy was pressed ({ link }: ShareLinkCopy); cancelable – prevented, nothing is written to the clipboard |
| `tc-create` | – | No | Create link was pressed (detail: null) |

#### Design tokens it reads (35)

`--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-md`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `shareLinkExpiryFromDate(value: string): void` | A date input's value at the end of that day, local time, in epoch ms |
| `shareLinkStatus(link: Pick<ShareLink, "status" \| "expiresAt">, now: number \| undefined, expiringDays: unknown): ShareLinkStatus` | Where a link stands. Without `now`, only a revoked link is known not to be active |

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
| `links` | `el.links = …;` | `<… links={…} />` | `<tc-share-link-manager :links="…">` | `<tc-share-link-manager [links]="…">` | `<tc-share-link-manager {links}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-share-link-manager :labels="…">` | `<tc-share-link-manager [labels]="…">` | `<tc-share-link-manager {labels}>` |

*Also attributes: `heading`, `description`, `now`, `expiring-days`, `creatable`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-links-change` | Yes | `el.addEventListener("tc-links-change", (e) => …)` | `onLinksChange={…}` | `@tc-links-change="…"` | `(tc-links-change)="…($event)"` | `el.addEventListener("tc-links-change", …)` |
| `tc-copy` | Yes | `el.addEventListener("tc-copy", (e) => …)` | `onTcCopyLink={…}` | `@tc-copy="…"` | `(tc-copy)="…($event)"` | `el.addEventListener("tc-copy", …)` |
| `tc-create` | No | `el.addEventListener("tc-create", (e) => …)` | `onTcCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |

### Controlled

The element changes `links` itself unless a listener calls `preventDefault()` on `tc-links-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-share-link-manager id="share-link-manager"></tc-share-link-manager>

<script type="module">
  import "@adamstavely/trenchcoat/share-link-manager";

  const el = document.querySelector("#share-link-manager");
  el.addEventListener("tc-links-change", (e) => {
    e.preventDefault(); // the element keeps its links…
    if (allowed(e.detail.links)) el.links = e.detail.links; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ShareLinkManager } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ShareLinkManager>;
type Props = Omit<Own, "links" | "onLinksChange"> & { initial: NonNullable<Own["links"]> };

// Controlled: passing links makes the wrapper prevent the element's own change; the app sets it
export function ControlledShareLinkManager({ initial, ...props }: Props) {
  const [links, setLinks] = useState<Own["links"]>(initial);
  return <ShareLinkManager {...props} links={links} onLinksChange={(next) => setLinks(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/share-link-manager";
import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";

const props = defineProps<{ initial: TcShareLinkManager["links"] }>();
const links = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onLinksChange = (e: CustomEvent<{ links: TcShareLinkManager["links"] }>) => {
  e.preventDefault();
  links.value = e.detail.links;
};
</script>

<template>
  <tc-share-link-manager :links="links" @tc-links-change="onLinksChange"></tc-share-link-manager>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ShareLinkManager } from "@adamstavely/trenchcoat/angular/share-link-manager";
import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";

@Component({
  selector: "app-controlled-share-link-manager",
  imports: [ShareLinkManager],
  template: `<tc-share-link-manager [links]="links()" (tc-links-change)="onLinksChange($event)"></tc-share-link-manager>`,
})
export class ControlledShareLinkManager {
  readonly initial = input.required<TcShareLinkManager["links"]>();
  readonly links = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onLinksChange(e: CustomEvent<{ links: TcShareLinkManager["links"] }>) {
    e.preventDefault();
    this.links.set(e.detail.links);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/share-link-manager";
  import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";

  let { initial }: { initial: TcShareLinkManager["links"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let links = $derived(initial);
  let el: TcShareLinkManager;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      links = (e as CustomEvent<{ links: TcShareLinkManager["links"] }>).detail.links;
    };
    el.addEventListener("tc-links-change", on);
    return () => el.removeEventListener("tc-links-change", on);
  });
</script>

<tc-share-link-manager bind:this={el} {links}></tc-share-link-manager>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-share-link-manager")` returns a `TcShareLinkManager` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";`
- **React / Next.js:** Props: `import type { ShareLinkManagerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ShareLinkManager>`. The element class, for refs: `import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcShareLinkManager["links"]` with `import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";`
- **Angular:** The directive types the template: `[links]` takes `TcShareLinkManager["links"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcShareLinkManager } from "@adamstavely/trenchcoat/share-link-manager";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Share links" |
| `links` | `ShareLink[]` | The links – controlled when given |
| `defaultLinks` | `ShareLink[]` | The links on mount when `links` isn't controlled |
| `onLinksChange` | `(links: ShareLink[], detail: ShareLinksChange) => void` | A link was revoked or its expiry changed |

*Renamed or hidden on the wrapper: `heading`, `links`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each link's address and actions |
| Enter / Space | Presses a button |

The question moves focus to Keep, and focus returns to the button that opened it.

### Screen readers

The links are a list named by the heading. Status is in words. Each button's name includes the link it acts on. `role="status"` announces copying, revoking and changing expiry.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.3 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.5 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.4 KB** | **7.5 KB** |
| With Lit – the first component on a page | 44.8 KB | 14.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.0 ms** | the gallery demo's data, 80 DOM nodes – to layout, median of 7 |
| Typical update | **1.0 ms** | one item of links replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 17 ms | links: first render, 1,664 nodes; update 6.4 ms |
| 1,000 items | 137 ms | links: first render, 16,514 nodes; update 56 ms |

1,000 items of links: 137 ms. It renders every item, so a first render passes 50 ms (a long task) at about 360 items – page or filter longer lists.

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

Give `label`, so people recognise a link without reading its address. `password` is only true or false: never send the password. Expiry needs `now`, because the element doesn't read the clock; without it, only revoked links show as not active.

## Do and don't

### Do

- Revoke and enforce expiry on the server when `tc-links-change` arrives.
- Update `now` as time passes.
- Log who copied or revoked what.

### Don't

- Don't rely on the status shown here: the server decides whether a link works.
- Don't put secrets in link addresses that people might paste elsewhere.

## Related

- [Share Panel](share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Access Review](../blocks/access-review.md) – A periodic check of who can see what – keep or remove each one, with anyone flagged first and a written reason for keeping them
- [Audit Trail](../blocks/audit-trail.md) – Who did what and when, for the record – grouped by day, with search, a filter by outcome, details on demand and a safe CSV export
- [File Details](../blocks/file-details.md) – One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)
