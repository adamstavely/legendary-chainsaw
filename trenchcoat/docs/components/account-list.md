<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Account List

**People & profiles** · New

The financial accounts linked to a person or a company – institution, type, an IBAN-style identifier masked until shown one at a time, a balance or flagged amount and a status each (Monitored, Flagged, Under review, Closed or your own), with your own stats above

- **Element:** `<tc-account-list>`
- **Size:** 8.1 KB gzip · 26.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/account-list";` |
| React / Next.js | `import { AccountList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/account-list";` · tags starting with tc- are custom elements |
| Angular | `import { AccountList } from "@adamstavely/trenchcoat/angular/account-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/account-list";` |

## Example

The live example is in the gallery at `#/account-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The financial accounts linked to a person or a company. Each row shows:
- the institution, and where the account sits;
- what kind of account it is, such as "Business operating" or "Offshore-linked";
- its identifier, IBAN-style, masked to the last four characters until someone shows it;
- an optional amount, such as a balance or the volume flagged on it;
- a status pill: Monitored, Flagged, Under review, Closed, or statuses of your own;
- a View button.

A strip of your own stats can sit above the list, such as "€428K flagged volume", "4 linked accounts" and "2 shell
entities". Showing an identifier is one row at a time and fires a cancelable event, so a page can ask for a reason or
log it first.

### When to use

- The accounts behind an anti-money-laundering, fraud or audit review.
- A customer's or a supplier's accounts in a due-diligence (KYC) file.
- Any short set of accounts where each one's status matters more than its transactions.

### When not to use

- How money moved between entities – use [Money Flow](money-flow.md).
- Identity documents rather than accounts – use [Document List](document-list.md).
- One secret value to show and copy – use [Secret Field](secret-field.md).
- Hundreds of accounts or transactions to sort and filter – use [Data Table](data-table.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-acl__count` – how many accounts are linked
2. **Stats** `.ui-acl__stats` – your own figures above the list
3. **Row** `.ui-acl__row` – one account
4. **Identifier** `.ui-acl__number` – masked to its last four characters until shown
5. **Amount** `.ui-acl__amount` – a balance or flagged volume, with what it is
6. **Note** `.ui-acl__note` – one line on why it's flagged
7. **Status** `.ui-acl__pill` – the status as a tint, a mark and a word
8. **Show identifier** `.ui-acl__reveal` – shows or masks the identifier again
9. **View** `.ui-acl__view` – opens the account

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight institution names.
Clean is one white card with the header as its first row. The stats, pills, masking and buttons are the same in both.

## Usage

### HTML

```html
<tc-account-list id="accounts" heading="Linked accounts"></tc-account-list>

<script type="module">
  import "@adamstavely/trenchcoat/account-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const accounts = document.querySelector("#accounts");
  accounts.stats = [{ id: "volume", label: "Flagged volume", value: "€428K", detail: "last 90 days" }];
  accounts.accounts = [
    { id: "a1", institution: "Banque Rhône", branch: "Lyon", country: "France", type: "Business operating", number: "FR7630006000011234567890189", status: "flagged", amount: { value: 298000, label: "Flagged · 90 days" } },
    { id: "a2", institution: "Limassol Trust", country: "Cyprus", type: "Holding company", status: "closed" },
  ];
  accounts.addEventListener("tc-revealed-change", (e) => console.log("revealed", e.detail.id));
  accounts.addEventListener("tc-open", (e) => console.log("open", e.detail.account.id));
</script>
```

### React / Next.js

```tsx
import { AccountList, type AccountRecord } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const accounts: AccountRecord[] = [
  { id: "a1", institution: "Banque Rhône", country: "France", type: "Business operating", number: "FR7630006000011234567890189", status: "flagged" },
  { id: "a2", institution: "Limassol Trust", country: "Cyprus", type: "Holding company", status: "closed" },
];

export function Accounts() {
  return <AccountList title="Linked accounts" accounts={accounts} onOpen={(a) => console.log(a.id)} onRevealedChange={(ids) => console.log(ids)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/account-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";

defineProps<{ accounts: TcAccountList["accounts"]; stats: TcAccountList["stats"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-account-list :accounts="accounts" :stats="stats" @tc-open="onOpen"></tc-account-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AccountList } from "@adamstavely/trenchcoat/angular/account-list";
import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";

@Component({
  selector: "app-account-list-example",
  imports: [AccountList],
  template: `<tc-account-list [accounts]="accounts()" [stats]="stats()" (tc-open)="onOpen($event)"></tc-account-list>`,
})
export class AccountListExample {
  readonly accounts = input.required<TcAccountList["accounts"]>();
  readonly stats = input.required<TcAccountList["stats"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/account-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";

  let { accounts, stats }: { accounts: TcAccountList["accounts"]; stats: TcAccountList["stats"] } = $props();
  let el: TcAccountList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-account-list bind:this={el} {accounts} {stats}></tc-account-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Linked accounts"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `accounts` | – | `AccountRecord[]` | `[]` | The accounts, in order |
| `stats` | – | `AccountStat[]` | `[]` | Stats shown in a strip above the list: { id, label, value, detail? } |
| `statuses` | – | `Record<string, { label: string; tone: AccountTone }>` | `{}` | Statuses' names and tones, merged over the defaults (monitored, flagged, review, closed, cleared) |
| `masked` | `masked` | `boolean` | `true` | Masks identifiers to their last four characters until revealed; set false to show them in full |
| `revealed` | – | `string[]` | `[]` | The ids whose identifiers are shown. Changed by the user unless a tc-revealed-change listener calls preventDefault() |
| `currency` | `currency` | `string` | `"EUR"` | The currency for amounts that don't name their own, e.g. "EUR" |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for amounts, e.g. "fr-FR"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | No | View was pressed on a row ({ account }: AccountOpen) |
| `tc-revealed-change` | – | Yes | An identifier was shown or masked again ({ revealed, id, shown }: AccountRevealedChange); cancelable – prevented, the identifier stays as it was |

#### Design tokens it reads (60)

`--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultAccountStatuses: Record<string, { label: string; tone: AccountTone }>` | The statuses' names and tones used when the page gives none |

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
| `accounts` | `el.accounts = …;` | `<… accounts={…} />` | `<tc-account-list :accounts="…">` | `<tc-account-list [accounts]="…">` | `<tc-account-list {accounts}>` |
| `stats` | `el.stats = …;` | `<… stats={…} />` | `<tc-account-list :stats="…">` | `<tc-account-list [stats]="…">` | `<tc-account-list {stats}>` |
| `statuses` | `el.statuses = …;` | `<… statuses={…} />` | `<tc-account-list :statuses="…">` | `<tc-account-list [statuses]="…">` | `<tc-account-list {statuses}>` |
| `revealed` | `el.revealed = …;` | `<… revealed={…} />` | `<tc-account-list :revealed="…">` | `<tc-account-list [revealed]="…">` | `<tc-account-list {revealed}>` |

*Also attributes: `heading`, `description`, `masked`, `currency`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-revealed-change` | Yes | `el.addEventListener("tc-revealed-change", (e) => …)` | `ref.current.addEventListener("tc-revealed-change", …)` | `@tc-revealed-change="…"` | `(tc-revealed-change)="…($event)"` | `el.addEventListener("tc-revealed-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `revealed` itself unless a listener calls `preventDefault()` on `tc-revealed-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-account-list id="account-list"></tc-account-list>

<script type="module">
  import "@adamstavely/trenchcoat/account-list";

  const el = document.querySelector("#account-list");
  el.addEventListener("tc-revealed-change", (e) => {
    e.preventDefault(); // the element keeps its revealed…
    if (allowed(e.detail.revealed)) el.revealed = e.detail.revealed; // …until the app sets it
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
import "@adamstavely/trenchcoat/account-list";
import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";

const props = defineProps<{ initial: TcAccountList["revealed"] }>();
const revealed = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRevealedChange = (e: CustomEvent<{ revealed: TcAccountList["revealed"] }>) => {
  e.preventDefault();
  revealed.value = e.detail.revealed;
};
</script>

<template>
  <tc-account-list :revealed="revealed" @tc-revealed-change="onRevealedChange"></tc-account-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AccountList } from "@adamstavely/trenchcoat/angular/account-list";
import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";

@Component({
  selector: "app-controlled-account-list",
  imports: [AccountList],
  template: `<tc-account-list [revealed]="revealed()" (tc-revealed-change)="onRevealedChange($event)"></tc-account-list>`,
})
export class ControlledAccountList {
  readonly initial = input.required<TcAccountList["revealed"]>();
  readonly revealed = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRevealedChange(e: CustomEvent<{ revealed: TcAccountList["revealed"] }>) {
    e.preventDefault();
    this.revealed.set(e.detail.revealed);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/account-list";
  import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";

  let { initial }: { initial: TcAccountList["revealed"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let revealed = $derived(initial);
  let el: TcAccountList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      revealed = (e as CustomEvent<{ revealed: TcAccountList["revealed"] }>).detail.revealed;
    };
    el.addEventListener("tc-revealed-change", on);
    return () => el.removeEventListener("tc-revealed-change", on);
  });
</script>

<tc-account-list bind:this={el} {revealed}></tc-account-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-account-list")` returns a `TcAccountList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";`
- **React / Next.js:** Props: `import type { AccountListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AccountList>`. The element class, for refs: `import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAccountList["accounts"]` with `import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";`
- **Angular:** The directive types the template: `[accounts]` takes `TcAccountList["accounts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAccountList } from "@adamstavely/trenchcoat/account-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `revealed` | `string[]` | The ids whose identifiers are shown – controlled when given |
| `defaultRevealed` | `string[]` | The ids shown on mount when `revealed` isn't controlled |
| `onRevealedChange` | `(revealed: string[]) => void` | An identifier was shown or masked again; `revealed` is the new list |
| `onOpen` | `(account: AccountRecord) => void` | View was pressed on a row |

*Renamed or hidden on the wrapper: `heading`, `revealed`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop; inside the list the arrows move between them.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the same button in the previous or next row |
| ← / → | Moves between a row's Show identifier and View buttons |
| Home / End | Moves to the first or last row |
| Enter / Space | Shows or masks the identifier; opens the account |
| Tab | Leaves the list |

### Screen readers

The list is named by the heading and described by “Up and down arrows move between accounts, left and right between
an account's buttons”. A masked identifier reads “Identifier ending 0189, hidden”, and a shown one reads in full. Show
identifier is a toggle button (`aria-pressed`) labelled with the account, “Show identifier, Banque Rhône, Business
operating”. View is labelled “View Banque Rhône, Business operating”. Status pills read their word; the marks are
hidden. Showing or masking an identifier is confirmed in a polite status message, “Banque Rhône identifier shown”.
The stats are a description list: each value with its label.

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

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.7 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.1 KB** | **8.1 KB** |
| With Lit – the first component on a page | 48.0 KB | 15.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.0 ms** | the gallery demo's data, 161 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of accounts replaced |
| First on the page | 13 ms | default properties; includes adding its CSS to the document |
| 100 items | 25 ms | accounts: first render, 3,233 nodes; update 3.4 ms |
| 1,000 items | 134 ms | accounts: first render, 32,033 nodes; update 17 ms |

1,000 items of accounts: 134 ms. It renders every item, so a first render passes 50 ms (a long task) at about 370 items – page or filter longer lists.

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

- Name institutions the way they trade, and put the branch or city in `branch`.
- Say what the amount is in its `label`: “Flagged · 90 days”, “Balance”, “Cash-in · 90 days”.
- Write a `note` for every flagged account, saying what's wrong: “Three transfers to a newly registered holding
  company”.
- Rename or add statuses with `statuses`: `{ frozen: { label: "Frozen", tone: "danger" } }`.

## Do and don't

### Do

- Keep `masked` on wherever identifiers are personal data, and log reveals from `tc-revealed-change`.
- Give each amount its currency when it differs from the element's `currency`.
- Pair View with the account's transactions or the money flow that involves it.

### Don't

- Don't use tones for anything but the account's standing – red means flagged.
- Don't put the full identifier in `note`; that defeats the masking.
- Don't turn `masked` off just to save a click in a shared or screen-shared view.

## Related

- [Money Flow](money-flow.md) – How money moved between entities – people, companies, shells and banks in columns, transfers as bands sized by amount with flag chips, an entity's or a transfer's flows lit with a readout in words, a list of every transfer and a table view
- [Document List](document-list.md) – Identity and record documents at a glance – type, country, masked numbers shown one at a time, expiry and a status each (Verified, Expired, Flagged, Fraudulent or your own), counted in the header, with View per row
- [Secret Field](secret-field.md) – A masked credential input with an explicit reveal control
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **People & profiles:** - `tc-entity-timeline`: events by month, each with a category and a graded source, filtered by category. - `tc-travel-itinerary`: legs with mode, document, confidence and flags, grouped into journeys. - `tc-place-list`: places with type, status, coordinates and dates. - `tc-account-list`: masked IBAN-style accounts with a status and the page's own stats. - `tc-money-flow`: transfers between entities as bands sized by amount, with flag chips. - Entities' and transfers' flows are lit with a readout, and there's a table view. - `tc-co-occurrence`: entities ranked by the events they share with a subject. - Strength in words and bars, with counts per source. - `tc-evidence-list`: exhibits, each opening onto its chain of custody, with hash agreement. - `tc-asset-list`: grouped assets with masked identifiers and a status. - `tc-contact-channels`: emails, phone numbers, messaging and addresses. - Masked until shown, with role, last use and verification.
