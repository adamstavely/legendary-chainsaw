<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Access Grants

**Agents** · New

The standing access an assistant or agent has, by source – scope in words, Can read / edit / act, who granted it, last use and expiry – with a "changed since you agreed" notice to review, Renew for what's running out, and Revoke behind an inline confirm

- **Element:** `<tc-access-grants>`
- **Size:** 10.9 KB gzip · 34.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/access-grants";` |
| React / Next.js | `import { AccessGrants } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/access-grants";` · tags starting with tc- are custom elements |
| Angular | `import { AccessGrants } from "@adamstavely/trenchcoat/angular/access-grants";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/access-grants";` |

## Example

The live example is in the gallery at `#/access-grants`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The standing access an assistant or agent has been given, in one list to review and revoke. Each grant says where the
access reaches (a source, with the app's own icon), what it may do there in words ("Read cases in Team North"), how
far it goes (Can read, Can edit or Can act), who granted it and when, when it was last used and when it runs out.

A summary line counts what needs a look, such as "6 grants · 1 changed since you agreed · 2 expire this week". Tabs
narrow the list to grants that changed since someone agreed to them, or that expire soon or already have.

- A grant that changed since it was agreed says what changed ("Now also reads attachments"). Review lets people accept
  the change or revoke the grant.
- Revoke asks inline first.
- A grant that's running out reads "Expires in 3 days" and offers Renew.

### When to use

- A settings page that lists what an assistant, agent or integration can reach, with its expiry and a way to revoke.
- Catching access that grew after people agreed to it, before it's used.
- A periodic access review, where people renew what they still need and revoke the rest.

### When not to use

- Asking for one specific right at the moment it's needed – use [Permission Request](permission-request.md).
- Setting which tools each agent may use (allow, ask, deny) – use [Tool Permissions](tool-permissions.md).
- A person's own training, history and memory settings – use [Data Controls](data-controls.md).
- What the assistant remembers – use [Memory Panel](memory-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-acg__summary` – the count of grants, and of those changed, expiring and expired
2. **Tabs** `.ui-acg__tabs` – All, Changed and Expiring (`.ui-acg__tab`), each with its count
3. **Source** `.ui-acg__source` – one group per source, with its icon (`.ui-acg__logo`) and how many grants it holds
4. **Grant** `.ui-acg__row` – one grant
5. **Level** `.ui-acg__level` – Can read, Can edit or Can act, as a word and an icon
6. **Scope** `.ui-acg__scope` – what it may do, in words
7. **Details** `.ui-acg__meta` – who granted it, last use, and the expiry (`.ui-acg__expiry`)
8. **Changed notice** `.ui-acg__drift` – what changed since someone agreed to it, and when
9. **Buttons** `.ui-acg__actions` – Review, Renew and Revoke, as they apply
10. **Panel** `.ui-acg__panel` – under a grant: confirm a revoke, or review a change

## Looks

Standard puts the header on a gray tray above a white card. Clean is one white card with the header as its first row.
Two component tokens can be overridden:
- `--tc-acg-logo` sets the size of the source's icon;
- `--tc-acg-indicator` sets the thickness of the selected tab's underline.

## Usage

### HTML

```html
<tc-access-grants id="grants" heading="What the assistant can reach" description="Fraud review · Team North"></tc-access-grants>

<script type="module">
  import "@adamstavely/trenchcoat/access-grants";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#grants");
  list.grants = [
    { id: "cases", source: "Case files", scope: "Read cases in Team North", level: "read", grantedBy: "Priya Shah",
      grantedAt: Date.parse("2026-09-11"), changed: { since: Date.parse("2026-11-09"), what: "Now also reads attachments." } },
    { id: "ledger", source: "Payments ledger", scope: "Read transactions from the last 24 months", level: "read",
      grantedBy: "Marcus Lee", grantedAt: Date.parse("2026-08-19"), expiresAt: Date.parse("2026-11-15") },
  ];
  list.addEventListener("tc-revoke", (e) => console.log("revoke", e.detail.grant.id));
  list.addEventListener("tc-renew", (e) => console.log("renew", e.detail.grant.id));
  list.addEventListener("tc-drift-review", (e) => console.log(e.detail.grant.id, e.detail.accepted));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AccessGrants, type AccessGrant } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AssistantAccess({ initial }: { initial: AccessGrant[] }) {
  const [grants, setGrants] = useState(initial);
  return (
    <AccessGrants
      title="What the assistant can reach"
      grants={grants}
      onRevoke={(grant) => setGrants((list) => list.filter((g) => g.id !== grant.id))}
      onRenew={(grant) => console.log("renew", grant.id)}
      onDriftReview={(grant, accepted) => console.log(grant.id, accepted)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/access-grants";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";

defineProps<{ grants: TcAccessGrants["grants"]; labels: TcAccessGrants["labels"] }>();
const onFilterChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-access-grants :grants="grants" :labels="labels" @tc-filter-change="onFilterChange"></tc-access-grants>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AccessGrants } from "@adamstavely/trenchcoat/angular/access-grants";
import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";

@Component({
  selector: "app-access-grants-example",
  imports: [AccessGrants],
  template: `<tc-access-grants [grants]="grants()" [labels]="labels()" (tc-filter-change)="onFilterChange($event)"></tc-access-grants>`,
})
export class AccessGrantsExample {
  readonly grants = input.required<TcAccessGrants["grants"]>();
  readonly labels = input.required<TcAccessGrants["labels"]>();
  onFilterChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/access-grants";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";

  let { grants, labels }: { grants: TcAccessGrants["grants"]; labels: TcAccessGrants["labels"] } = $props();
  let el: TcAccessGrants;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-access-grants bind:this={el} {grants} {labels}></tc-access-grants>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Access"` | The heading |
| `description` | `description` | `string` | `""` | One line under the heading – whose access this is |
| `grants` | – | `AccessGrant[]` | `[]` | The grants. Revoking one, or refusing a change, removes it unless the event is prevented |
| `filter` | `filter` | `AccessGrantsFilter` | `"all"` | Which grants show: all, changed since agreed, or expiring soon (and expired) |
| `expiringDays` | `expiring-days` | `number` | `7` | How many days ahead counts as expiring soon |
| `now` | `now` | `number \| undefined` | `undefined` | The time to measure against, epoch ms; by default the element's own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates, e.g. "en-GB"; by default the browser's |
| `labels` | – | `Partial<AccessGrantsLabels>` | `{}` | The words it uses, merged over defaultAccessGrantsLabels |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-filter-change` | – | Yes | A tab was chosen ({ filter }: AccessGrantsFilterChange); cancelable – prevented, the tab stays as it was |
| `tc-revoke` | – | Yes | Revoke was confirmed ({ grant }: AccessGrantRevoke); cancelable – unless prevented, the grant leaves `grants` |
| `tc-renew` | – | No | Renew was pressed on a grant that expires soon or has expired ({ grant }: AccessGrantRenew); set its new `expiresAt` in answer |
| `tc-drift-review` | – | Yes | A changed grant was reviewed ({ grant, accepted }: AccessGrantDriftReview); cancelable – unless prevented, accepting clears `changed` and refusing removes the grant |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-acg-logo` | `20px` | both |
| `--tc-acg-indicator` | `2px` | both |

#### Design tokens it reads (57)

`--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `grants` | `el.grants = …;` | `<… grants={…} />` | `<tc-access-grants :grants="…">` | `<tc-access-grants [grants]="…">` | `<tc-access-grants {grants}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-access-grants :labels="…">` | `<tc-access-grants [labels]="…">` | `<tc-access-grants {labels}>` |

*Also attributes: `heading`, `description`, `filter`, `expiring-days`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-revoke` | Yes | `el.addEventListener("tc-revoke", (e) => …)` | `onRevoke={…}` | `@tc-revoke="…"` | `(tc-revoke)="…($event)"` | `el.addEventListener("tc-revoke", …)` |
| `tc-renew` | No | `el.addEventListener("tc-renew", (e) => …)` | `onRenew={…}` | `@tc-renew="…"` | `(tc-renew)="…($event)"` | `el.addEventListener("tc-renew", …)` |
| `tc-drift-review` | Yes | `el.addEventListener("tc-drift-review", (e) => …)` | `onDriftReview={…}` | `@tc-drift-review="…"` | `(tc-drift-review)="…($event)"` | `el.addEventListener("tc-drift-review", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `filter` itself unless a listener calls `preventDefault()` on `tc-filter-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-access-grants id="access-grants"></tc-access-grants>

<script type="module">
  import "@adamstavely/trenchcoat/access-grants";

  const el = document.querySelector("#access-grants");
  el.addEventListener("tc-filter-change", (e) => {
    e.preventDefault(); // the element keeps its filter…
    if (allowed(e.detail.filter)) el.filter = e.detail.filter; // …until the app sets it
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
import "@adamstavely/trenchcoat/access-grants";
import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";

const props = defineProps<{ initial: TcAccessGrants["filter"] }>();
const filter = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFilterChange = (e: CustomEvent<{ filter: TcAccessGrants["filter"] }>) => {
  e.preventDefault();
  filter.value = e.detail.filter;
};
</script>

<template>
  <tc-access-grants :filter="filter" @tc-filter-change="onFilterChange"></tc-access-grants>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AccessGrants } from "@adamstavely/trenchcoat/angular/access-grants";
import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";

@Component({
  selector: "app-controlled-access-grants",
  imports: [AccessGrants],
  template: `<tc-access-grants [filter]="filter()" (tc-filter-change)="onFilterChange($event)"></tc-access-grants>`,
})
export class ControlledAccessGrants {
  readonly initial = input.required<TcAccessGrants["filter"]>();
  readonly filter = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFilterChange(e: CustomEvent<{ filter: TcAccessGrants["filter"] }>) {
    e.preventDefault();
    this.filter.set(e.detail.filter);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/access-grants";
  import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";

  let { initial }: { initial: TcAccessGrants["filter"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let filter = $derived(initial);
  let el: TcAccessGrants;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      filter = (e as CustomEvent<{ filter: TcAccessGrants["filter"] }>).detail.filter;
    };
    el.addEventListener("tc-filter-change", on);
    return () => el.removeEventListener("tc-filter-change", on);
  });
</script>

<tc-access-grants bind:this={el} {filter}></tc-access-grants>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-access-grants")` returns a `TcAccessGrants` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";`
- **React / Next.js:** Props: `import type { AccessGrantsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AccessGrants>`. The element class, for refs: `import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAccessGrants["grants"]` with `import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";`
- **Angular:** The directive types the template: `[grants]` takes `TcAccessGrants["grants"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAccessGrants } from "@adamstavely/trenchcoat/access-grants";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `grants` | `AccessGrant[]` | The grants. A revoke or a refused change takes the grant out of the list shown, until `grants` changes |
| `filter` | `AccessGrantsFilter` | Which grants show – controlled when given |
| `defaultFilter` | `AccessGrantsFilter` | The tab on mount, when `filter` isn't controlled |
| `onFilterChange` | `(filter: AccessGrantsFilter) => void` | A tab was chosen |
| `onRevoke` | `(grant: AccessGrant) => boolean \| void` | Revoke was confirmed; return false to keep the grant in the list |
| `onRenew` | `(grant: AccessGrant) => void` | Renew was pressed – give the grant a new `expiresAt` |
| `onDriftReview` | `(grant: AccessGrant, accepted: boolean) => boolean \| void` | A changed grant was reviewed: accepted, or refused (which revokes it); return false to leave it as it is |

*Renamed or hidden on the wrapper: `heading`, `grants`, `filter`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves from the tabs to the grants' buttons (one stop) and into an open panel |
| ← / → on the tabs | Moves to the previous or next tab and shows it; Home and End go to the first and last |
| ↑ / ↓ on a button | Moves to the same button in the previous or next grant |
| ← / → on a button | Moves between a grant's buttons |
| Home / End on a button | Moves to the first or last grant |
| Enter / Space | Presses the button |
| Escape in a panel | Closes it and puts focus back on its button |

### Screen readers

The tabs are a `tablist` named by the heading, and they control the list (a `tabpanel`). Each source is a heading with
a list of its grants. Each button is described by the grant's scope, so "Revoke" reads with what it revokes. Review and
Revoke report whether their panel is expanded. The panel is a group named by its question. Revoking or accepting a
change is confirmed in a polite status message. The level and the expiry are said in words, not shown by colour alone.

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
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-23 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.1 KB | 8.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.0 KB** | **10.9 KB** |
| With Lit – the first component on a page | 53.6 KB | 17.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.3 ms** | the gallery demo's data, 158 DOM nodes – to layout, median of 7 |
| Typical update | **0.8 ms** | one item of grants replaced |
| First on the page | 24 ms | default properties; includes adding its CSS to the document |
| 100 items | 20 ms | grants: first render, 1,739 nodes; update 6.6 ms |
| 1,000 items | 104 ms | grants: first render, 16,889 nodes; update 42 ms |

1,000 items of grants: 104 ms. It renders every item, so a first render passes 50 ms (a long task) at about 480 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the scope as an action and a place: "Read cases in Team North", not "cases:read:north".
- Say a change from the person's side: "Now also reads attachments", not "Scope widened".
- Name the source the way people know it, and pass its icon, so a grant is easy to recognise.
- Leave `expiresAt` out for access that lasts until it's revoked. The list says so.

## Do and don't

### Do

- Ask again, with `changed`, when what a grant covers grows, instead of widening it without telling anyone.
- Give access an end date where you can, so it doesn't outlive the need.
- Update `grants` when a revoke or renewal is done, so the list matches what's really allowed.

### Don't

- Don't revoke silently on the server and leave the grant in the list.
- Don't use the level's colour on its own; keep the words.
- Don't list internal permission names; describe what the access lets the agent do.

## Related

- [Permission Request](permission-request.md) – An agent asks for one specific right – who, why and exactly what will happen – and you allow it once, for an hour or always; then it folds into one line with the time left and Revoke
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Data Controls](data-controls.md) – A person's own data in an AI product – switches for improving the model with their chats, saving chat history and memory, each saying what it means and when it last changed, Export my data with its status, Delete all chats behind a confirmation that names how many go, and Delete account
- [Memory Panel](memory-panel.md) – What the assistant remembers about you, grouped and editable – a master switch, category filters, and on every memory edit in place, pause or forget with Undo on the tray
