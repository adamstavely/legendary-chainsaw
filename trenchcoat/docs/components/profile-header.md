<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Profile Header

**People & profiles** · New

The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs

- **Element:** `<tc-profile-header>`
- **Size:** 8.2 KB gzip · 27.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/profile-header";` |
| React / Next.js | `import { ProfileHeader } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/profile-header";` · tags starting with tc- are custom elements |
| Angular | `import { ProfileHeader } from "@adamstavely/trenchcoat/angular/profile-header";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/profile-header";` |

## Example

The live example is in the gallery at `#/profile-header`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The top of a person's or an account's page. It shows a picture or initials, the name, a status pill and any tags,
the other names the person or account goes by, and a line of short facts such as a role, a place, when they were last
seen or a linked case. The page's actions sit at the right, with an optional overflow button for the rest. A row of
tabs underneath can switch between the sections of the page. Narrow, the actions drop under the name and the tabs
scroll sideways.

### When to use

- The header of a customer, contact, employee, patient or case-subject page.
- An account, company or workspace page – set `kind="account"` for a square avatar.
- Any record page whose sections are tabs below the header.

### When not to use

- The signed-in user's own menu in an app bar – use [Profile Menu](profile-menu.md).
- A project's summary in a grid of cards – use [Project Card](project-card.md).
- What changed for a person since you last looked – use [Stories](stories.md).
- The people linked to this one – put [Person Links](person-links.md) under the header.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Avatar** `.ui-phd__avatar` – the picture, or the name's initials; round for a person, square for an account
2. **Name** `.ui-phd__name` – the page's heading, level 2 by default
3. **Pills** `.ui-phd__pill` – the status, with a dot, then any tags
4. **Other names** `.ui-phd__aliases` – “Also known as” and a chip for each name
5. **Facts** `.ui-phd__meta` – short facts in one line, separated by dots; a fact can carry a coloured dot
6. **Actions** `.ui-phd__actions` – the page's buttons, and the overflow button
7. **Tabs** `.ui-phd__tabs` – the page's sections, with optional counts

## Looks

Standard is a white card on a gray tray, with the selected tab underlined in ink. Clean is one white card, and the
selected tab is underlined in the accent. The avatar, pills, chips and actions are the same in both.

## Usage

### HTML

```html
<tc-profile-header id="header" name="Dana Whitfield" more></tc-profile-header>

<script type="module">
  import "@adamstavely/trenchcoat/profile-header";
  import "@adamstavely/trenchcoat/tokens.css";

  const header = document.querySelector("#header");
  header.status = { label: "Enhanced review", tone: "warning" };
  header.aliases = ["D. Ross"];
  header.meta = ["Retail customer", "Leeds, UK", { label: "Case KYC-2291", tone: "warning" }];
  header.actions = [{ id: "flag", label: "Flag for review", icon: "flag", variant: "primary" }];
  header.tabs = [{ id: "overview", label: "Overview" }, { id: "documents", label: "Documents", count: 9 }];
  header.addEventListener("tc-action", (e) => console.log(e.detail.id));
  header.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ProfileHeader } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CustomerHeader() {
  const [tab, setTab] = useState("overview");
  return (
    <ProfileHeader
      name="Dana Whitfield"
      status={{ label: "Enhanced review", tone: "warning" }}
      meta={["Retail customer", "Leeds, UK"]}
      actions={[{ id: "flag", label: "Flag for review", icon: "flag", variant: "primary" }]}
      tabs={[{ id: "overview", label: "Overview" }, { id: "documents", label: "Documents", count: 9 }]}
      selected={tab}
      onSelectedChange={setTab}
      onAction={(id) => console.log(id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/profile-header";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";

defineProps<{ status: TcProfileHeader["status"]; tags: TcProfileHeader["tags"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-profile-header :status="status" :tags="tags" @tc-action="onAction"></tc-profile-header>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProfileHeader } from "@adamstavely/trenchcoat/angular/profile-header";
import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";

@Component({
  selector: "app-profile-header-example",
  imports: [ProfileHeader],
  template: `<tc-profile-header [status]="status()" [tags]="tags()" (tc-action)="onAction($event)"></tc-profile-header>`,
})
export class ProfileHeaderExample {
  readonly status = input.required<TcProfileHeader["status"]>();
  readonly tags = input.required<TcProfileHeader["tags"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/profile-header";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";

  let { status, tags }: { status: TcProfileHeader["status"]; tags: TcProfileHeader["tags"] } = $props();
  let el: TcProfileHeader;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-profile-header bind:this={el} {status} {tags}></tc-profile-header>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | The person's or the account's name: the page's heading |
| `level` | `level` | `1 \| 2` | `2` | The heading's level – 1 when the header tops the page, 2 (the default) inside a layout that has its own h1 |
| `picture` | `picture` | `string \| undefined` | `undefined` | A picture URL; without one the avatar shows the name's initials |
| `kind` | `kind` | `"person" \| "account"` | `"person"` | "person" draws a round avatar, "account" (a company, a team, a workspace) a rounded square |
| `status` | – | `ProfilePill \| undefined` | `undefined` | The status beside the name, e.g. { label: "Under review", tone: "warning" } |
| `tags` | – | `ProfilePill[]` | `[]` | More pills after the status, e.g. a priority |
| `aliases` | – | `string[]` | `[]` | Other names the person or account goes by, as chips |
| `aliasLabel` | `alias-label` | `string` | `"Also known as"` | The label before the other names |
| `meta` | – | `ProfileMeta[]` | `[]` | Short facts in one line, separated by dots: a role, a place, when last seen, a linked case |
| `actions` | – | `ProfileAction[]` | `[]` | The page's actions, at the right |
| `more` | `more` | `boolean` | `false` | Shows an overflow button after the actions, which fires tc-action "more" |
| `moreLabel` | `more-label` | `string` | `"More actions"` | The overflow button's name |
| `tabs` | – | `ProfileTab[]` | `[]` | Tabs for the sections below; none hides the row |
| `selected` | `selected` | `string \| undefined` | `undefined` | The selected tab's id; the first tab when unset. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `tabsLabel` | `tabs-label` | `string` | `"Sections"` | The tab row's name for screen readers |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | No | An action button, or the overflow button, was used ({ id }: ProfileActionEvent; "more" for the overflow button) |
| `tc-selected-change` | – | Yes | A tab was chosen ({ selected }: ProfileSelectedChange); cancelable – prevented, `selected` stays as it was |

#### Design tokens it reads (95)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-loose`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `status` | `el.status = …;` | `<… status={…} />` | `<tc-profile-header :status="…">` | `<tc-profile-header [status]="…">` | `<tc-profile-header {status}>` |
| `tags` | `el.tags = …;` | `<… tags={…} />` | `<tc-profile-header :tags="…">` | `<tc-profile-header [tags]="…">` | `<tc-profile-header {tags}>` |
| `aliases` | `el.aliases = …;` | `<… aliases={…} />` | `<tc-profile-header :aliases="…">` | `<tc-profile-header [aliases]="…">` | `<tc-profile-header {aliases}>` |
| `meta` | `el.meta = …;` | `<… meta={…} />` | `<tc-profile-header :meta="…">` | `<tc-profile-header [meta]="…">` | `<tc-profile-header {meta}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-profile-header :actions="…">` | `<tc-profile-header [actions]="…">` | `<tc-profile-header {actions}>` |
| `tabs` | `el.tabs = …;` | `<… tabs={…} />` | `<tc-profile-header :tabs="…">` | `<tc-profile-header [tabs]="…">` | `<tc-profile-header {tabs}>` |

*Also attributes: `name`, `level`, `picture`, `kind`, `alias-label`, `more`, `more-label`, `selected` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-profile-header id="profile-header"></tc-profile-header>

<script type="module">
  import "@adamstavely/trenchcoat/profile-header";

  const el = document.querySelector("#profile-header");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/profile-header";
import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";

const props = defineProps<{ initial: TcProfileHeader["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcProfileHeader["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-profile-header :selected="selected" @tc-selected-change="onSelectedChange"></tc-profile-header>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ProfileHeader } from "@adamstavely/trenchcoat/angular/profile-header";
import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";

@Component({
  selector: "app-controlled-profile-header",
  imports: [ProfileHeader],
  template: `<tc-profile-header [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-profile-header>`,
})
export class ControlledProfileHeader {
  readonly initial = input.required<TcProfileHeader["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcProfileHeader["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/profile-header";
  import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";

  let { initial }: { initial: TcProfileHeader["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcProfileHeader;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcProfileHeader["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-profile-header bind:this={el} {selected}></tc-profile-header>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-profile-header")` returns a `TcProfileHeader` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";`
- **React / Next.js:** Props: `import type { ProfileHeaderProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProfileHeader>`. The element class, for refs: `import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProfileHeader["status"]` with `import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";`
- **Angular:** The directive types the template: `[status]` takes `TcProfileHeader["status"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProfileHeader } from "@adamstavely/trenchcoat/profile-header";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `selected` | `string` | The selected tab's id – controlled when given |
| `defaultSelected` | `string` | The tab selected on mount when `selected` isn't controlled; the first tab when unset |
| `onSelectedChange` | `(selected: string) => void` | A tab was chosen |
| `onAction` | `(id: string) => void` | An action button, or the overflow button ("more"), was used |

*Renamed or hidden on the wrapper: `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

The actions are ordinary buttons in the tab order. The tabs are one tab stop, on the selected tab.

| Key | What it does |
|---|---|
| ← / → | Moves to the previous or next tab, wrapping at the ends |
| Home / End | Moves to the first or last tab |
| Enter / Space | Selects the focused tab |
| Tab | Leaves the tabs; the tab stop goes back to the selected tab |

Tabs are selected by Enter, Space or a click, not by moving between them, so a page whose sections load slowly isn't
asked for each one on the way.

### Screen readers

The name is a heading, level 2 by default; set `level="1"` when the header tops the page. The avatar is decorative.
The pills, other names and facts are read as text; the other names are a list labelled “Also known as”. An action
reads its label, and the overflow button reads “More actions”. The tabs are a `tablist` labelled “Sections”: each tab
reads its label and count, and the selected tab is `aria-selected`. Give a tab `controls`, the id of its panel, for
`aria-controls`, and label the panel with the tab's id: `tc-phd-1-tab-overview` for the first header's overview tab.

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
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.0 KB | 6.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **27.1 KB** | **8.3 KB** |
| With Lit – the first component on a page | 48.8 KB | 15.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 52 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of tabs replaced |
| First on the page | 2.6 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.4 ms | tabs: first render, 190 nodes; update 0.4 ms |
| 1,000 items | 15 ms | tabs: first render, 1,540 nodes; update 2.1 ms |

1,000 items of tabs: 15 ms, 1,540 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Use the name people will search for; put other spellings and former names in `aliases`.
- Keep the status to one or two words: “Active”, “Under review”, “Closed”.
- Keep facts short and in a fixed order across pages: role, place, since when, then links.
- Make one action primary at most – the thing most people come to the page to do.

## Do and don't

### Do

- Put rarely used actions behind the overflow button with `more`, and open your own menu on `tc-action` “more”.
- Show counts on tabs whose sections hold lists, so people can see what's there before opening them.
- Use a tone on a fact only when it matters right now, such as an open case.

### Don't

- Don't add more than about four pills – past that, none of them stands out.
- Don't use colour alone for the status – the label always says it.
- Don't put the page's search or filters in the header – they belong to the section below.

## Related

- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Profile Menu](profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress
- [Project Card](project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- [Stories](stories.md) – Avatars for people and accounts with a gradient ring for something new – open one for a "what changed" brief: a bento grid of metric, status, note, list, image and link tiles

## Changelog

- **`tc-profile-header`:** the top of a person's or an account's page. - **Identity:** picture or initials, name, a status and tags. - **Details:** other names as chips, and a line of key facts. - **Actions and tabs:** the page's actions with an overflow button, and a row of section tabs (WAI-ARIA tabs).
