<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Saved Views

**Inputs & controls** · New

Saved views as tabs above a list or table – counts, shared and default marks, rename in place, duplicate, share, set as default and delete with a confirmation, and Save changes, Save as new view and Reset when the view on screen has been edited

- **Element:** `<tc-saved-views>`
- **Size:** 13.1 KB gzip · 44.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/saved-views";` |
| React / Next.js | `import { SavedViews } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/saved-views";` · tags starting with tc- are custom elements |
| Angular | `import { SavedViews } from "@adamstavely/trenchcoat/angular/saved-views";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/saved-views";` |

## Example

The live example is in the gallery at `#/saved-views`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The tabs above a list or table, each a saved set of filters, sort and columns – "My open cases", "High risk this week", "Waiting on customer". Each tab shows how many items it holds, a mark when it's shared with the team, and a pin on the default view – the one that opens first.

View options – the ⋯ button beside the tabs, or the chevron on a tab – renames a view in place, duplicates it, shares it with the team or stops sharing, sets it as the default, and deletes it after asking in place. When the filters on screen no longer match the open view, the page sets `dirty`: the tab says Edited, and a bar below offers Save changes, Save as new view (named in place) and Reset. "+ New view" asks for a name in place too.

The page owns the views. Every action is a request – `tc-view-save`, `tc-view-create`, `tc-view-reset`, `tc-view-rename`, `tc-view-duplicate`, `tc-view-share`, `tc-view-default`, `tc-view-delete` – and the page changes `views` in answer. Which view is open is the element's own (`active`), unless a `tc-active-change` listener prevents it.

When the tabs don't fit, they scroll sideways with soft edges, the open one kept in view, and More views lists the ones out of sight. The menus open in the top layer under their tab or button, flipped above when there's no room, so a scrolling card never clips them.

### When to use

- A list or table people filter the same few ways every day, and want to come back to.
- Views that a team shares – a queue everyone works from.
- Pairing with `filter-menu` for the filters themselves, and `data-table` for the rows.

### When not to use

- Fixed sections that aren't saved filters – use [Segmented Control](segmented-control.md).
- Open documents or chats – use [Session Tabs](session-tabs.md).
- One-off filtering that nobody saves – use [Filter Menu](filter-menu.md) on its own.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Tabs** `.ui-svw__list` – the tablist; each `.ui-svw__tab` holds `.ui-svw__open` (the tab) with `.ui-svw__name`, `.ui-svw__count`, a `.ui-svw__mark` for shared and default, `.ui-svw__edited` when the open view has changed, and `.ui-svw__chevron`
2. **Tools** `.ui-svw__tools` – `.ui-svw__options` (View options for the open view), `.ui-svw__more` when tabs are out of view, and `.ui-svw__new`
3. **Menu** `.ui-svw__menu` – `.ui-svw__item` actions, or `.ui-svw__confirm` to confirm a delete
4. **Edited bar** `.ui-svw__dirty` – `.ui-svw__dirty-note` and Reset, Save as new view and `.ui-svw__save`, or `.ui-svw__naming` while a name is given
5. **Rename** `.ui-svw__rename` – the name field that takes a tab's place while it's renamed

## Looks

Standard: the strip sits on the gray tray and the open view is a white card on it. Clean: one white bar, the open view filled with an accent underline. `--tc-svw-min` and `--tc-svw-max` bound a tab's width, `--tc-svw-menu-w` sets the menu's.

## Usage

### HTML

```html
<tc-saved-views id="views" active="mine" controls="case-list"></tc-saved-views>
<div id="case-list">…</div>

<script type="module">
  import "@adamstavely/trenchcoat/saved-views";
  import "@adamstavely/trenchcoat/tokens.css";

  const views = document.querySelector("#views");
  views.views = [
    { id: "mine", name: "My open cases", count: 14, isDefault: true },
    { id: "high", name: "High risk this week", count: 6, shared: true },
    { id: "all", name: "All cases", count: 212 },
  ];
  views.addEventListener("tc-view-rename", (e) => {
    views.views = views.views.map((v) => (v.id === e.detail.id ? { ...v, name: e.detail.name } : v));
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SavedViews, type SavedView } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CaseViews({ edited, onSave }: { edited: boolean; onSave: (id: string) => void }) {
  const [views, setViews] = useState<SavedView[]>([
    { id: "mine", name: "My open cases", count: 14, isDefault: true },
    { id: "high", name: "High risk this week", count: 6, shared: true },
  ]);
  const [active, setActive] = useState<string | null>("mine");
  return (
    <SavedViews
      views={views}
      active={active}
      onActiveChange={setActive}
      dirty={edited}
      onViewSave={onSave}
      onViewRename={({ id, name }) => setViews((all) => all.map((v) => (v.id === id ? { ...v, name } : v)))}
      onViewDelete={(id) => setViews((all) => all.filter((v) => v.id !== id))}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/saved-views";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";

defineProps<{ views: TcSavedViews["views"]; labels: TcSavedViews["labels"] }>();
const onActiveChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-saved-views :views="views" :labels="labels" @tc-active-change="onActiveChange"></tc-saved-views>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SavedViews } from "@adamstavely/trenchcoat/angular/saved-views";
import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";

@Component({
  selector: "app-saved-views-example",
  imports: [SavedViews],
  template: `<tc-saved-views [views]="views()" [labels]="labels()" (tc-active-change)="onActiveChange($event)"></tc-saved-views>`,
})
export class SavedViewsExample {
  readonly views = input.required<TcSavedViews["views"]>();
  readonly labels = input.required<TcSavedViews["labels"]>();
  onActiveChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/saved-views";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";

  let { views, labels }: { views: TcSavedViews["views"]; labels: TcSavedViews["labels"] } = $props();
  let el: TcSavedViews;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-saved-views bind:this={el} {views} {labels}></tc-saved-views>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `views` | – | `SavedView[]` | `[]` | The saved views, in the order shown |
| `active` | `active` | `string \| null` | `null` | The open view's id. Changed by the user unless a tc-active-change listener calls preventDefault() |
| `dirty` | `dirty` | `boolean` | `false` | The filters on screen differ from the open view – shows Edited and the Save changes bar |
| `controls` | `controls` | `string \| undefined` | `undefined` | The id of the list or table the views filter, for aria-controls |
| `hideCreate` | `hide-create` | `boolean` | `false` | Hides "+ New view" |
| `labels` | – | `Partial<SavedViewsLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-active-change` | – | Yes | A view was opened ({ active, view }: SavedViewsActiveChange); cancelable – prevented, `active` stays as it was |
| `tc-view-save` | – | Yes | Save changes was pressed for the open view ({ id }: SavedViewId); cancelable |
| `tc-view-create` | – | Yes | A name was given for a new view, from the filters on screen or blank ({ name, basis }: SavedViewCreate); cancelable – prevented, the name field stays |
| `tc-view-reset` | – | Yes | Reset was pressed: go back to the open view as saved ({ id }: SavedViewId); cancelable |
| `tc-view-rename` | – | Yes | A view was renamed in place ({ id, name }: SavedViewRename); cancelable – prevented, the name field stays |
| `tc-view-duplicate` | – | Yes | Duplicate was picked ({ id }: SavedViewId); cancelable |
| `tc-view-share` | – | Yes | Share with team or Stop sharing was picked ({ id, shared }: SavedViewShare); cancelable |
| `tc-view-default` | – | Yes | Set as default was picked ({ id }: SavedViewId); cancelable |
| `tc-view-delete` | – | Yes | Delete was confirmed ({ id }: SavedViewId); cancelable |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-svw-min` | `88px` | both |
| `--tc-svw-max` | `240px` | both |
| `--tc-svw-fade` | `24px` | both |
| `--tc-svw-dot` | `6px` | both |
| `--tc-svw-menu-w` | `220px` | both |

#### Design tokens it reads (54)

`--tc-accent`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-snug`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-radius`

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
| `views` | `el.views = …;` | `<… views={…} />` | `<tc-saved-views :views="…">` | `<tc-saved-views [views]="…">` | `<tc-saved-views {views}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-saved-views :labels="…">` | `<tc-saved-views [labels]="…">` | `<tc-saved-views {labels}>` |

*Also attributes: `active`, `dirty`, `controls`, `hide-create` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-active-change` | Yes | `el.addEventListener("tc-active-change", (e) => …)` | `ref.current.addEventListener("tc-active-change", …)` | `@tc-active-change="…"` | `(tc-active-change)="…($event)"` | `el.addEventListener("tc-active-change", …)` |
| `tc-view-save` | Yes | `el.addEventListener("tc-view-save", (e) => …)` | `onViewSave={…}` | `@tc-view-save="…"` | `(tc-view-save)="…($event)"` | `el.addEventListener("tc-view-save", …)` |
| `tc-view-create` | Yes | `el.addEventListener("tc-view-create", (e) => …)` | `onViewCreate={…}` | `@tc-view-create="…"` | `(tc-view-create)="…($event)"` | `el.addEventListener("tc-view-create", …)` |
| `tc-view-reset` | Yes | `el.addEventListener("tc-view-reset", (e) => …)` | `onViewReset={…}` | `@tc-view-reset="…"` | `(tc-view-reset)="…($event)"` | `el.addEventListener("tc-view-reset", …)` |
| `tc-view-rename` | Yes | `el.addEventListener("tc-view-rename", (e) => …)` | `onViewRename={…}` | `@tc-view-rename="…"` | `(tc-view-rename)="…($event)"` | `el.addEventListener("tc-view-rename", …)` |
| `tc-view-duplicate` | Yes | `el.addEventListener("tc-view-duplicate", (e) => …)` | `onViewDuplicate={…}` | `@tc-view-duplicate="…"` | `(tc-view-duplicate)="…($event)"` | `el.addEventListener("tc-view-duplicate", …)` |
| `tc-view-share` | Yes | `el.addEventListener("tc-view-share", (e) => …)` | `onViewShare={…}` | `@tc-view-share="…"` | `(tc-view-share)="…($event)"` | `el.addEventListener("tc-view-share", …)` |
| `tc-view-default` | Yes | `el.addEventListener("tc-view-default", (e) => …)` | `onViewDefault={…}` | `@tc-view-default="…"` | `(tc-view-default)="…($event)"` | `el.addEventListener("tc-view-default", …)` |
| `tc-view-delete` | Yes | `el.addEventListener("tc-view-delete", (e) => …)` | `onViewDelete={…}` | `@tc-view-delete="…"` | `(tc-view-delete)="…($event)"` | `el.addEventListener("tc-view-delete", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `active` itself unless a listener calls `preventDefault()` on `tc-active-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-saved-views id="saved-views"></tc-saved-views>

<script type="module">
  import "@adamstavely/trenchcoat/saved-views";

  const el = document.querySelector("#saved-views");
  el.addEventListener("tc-active-change", (e) => {
    e.preventDefault(); // the element keeps its active…
    if (allowed(e.detail.active)) el.active = e.detail.active; // …until the app sets it
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
import "@adamstavely/trenchcoat/saved-views";
import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";

const props = defineProps<{ initial: TcSavedViews["active"] }>();
const active = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onActiveChange = (e: CustomEvent<{ active: TcSavedViews["active"] }>) => {
  e.preventDefault();
  active.value = e.detail.active;
};
</script>

<template>
  <tc-saved-views :active="active" @tc-active-change="onActiveChange"></tc-saved-views>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SavedViews } from "@adamstavely/trenchcoat/angular/saved-views";
import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";

@Component({
  selector: "app-controlled-saved-views",
  imports: [SavedViews],
  template: `<tc-saved-views [active]="active()" (tc-active-change)="onActiveChange($event)"></tc-saved-views>`,
})
export class ControlledSavedViews {
  readonly initial = input.required<TcSavedViews["active"]>();
  readonly active = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onActiveChange(e: CustomEvent<{ active: TcSavedViews["active"] }>) {
    e.preventDefault();
    this.active.set(e.detail.active);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/saved-views";
  import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";

  let { initial }: { initial: TcSavedViews["active"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let active = $derived(initial);
  let el: TcSavedViews;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      active = (e as CustomEvent<{ active: TcSavedViews["active"] }>).detail.active;
    };
    el.addEventListener("tc-active-change", on);
    return () => el.removeEventListener("tc-active-change", on);
  });
</script>

<tc-saved-views bind:this={el} {active}></tc-saved-views>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-saved-views")` returns a `TcSavedViews` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";`
- **React / Next.js:** Props: `import type { SavedViewsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SavedViews>`. The element class, for refs: `import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSavedViews["views"]` with `import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";`
- **Angular:** The directive types the template: `[views]` takes `TcSavedViews["views"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSavedViews } from "@adamstavely/trenchcoat/saved-views";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `active` | `string \| null` | The open view's id – controlled when given |
| `defaultActive` | `string \| null` | The view open on mount when `active` isn't controlled |
| `onActiveChange` | `(active: string \| null) => void` | A view was opened |
| `onViewSave` | `(id: string) => void` | Save changes – save the filters on screen into this view |
| `onViewCreate` | `(detail: SavedViewCreate) => void` | A new view was named, from the filters on screen ("current") or blank |
| `onViewReset` | `(id: string) => void` | Reset – go back to the open view as saved |
| `onViewRename` | `(detail: SavedViewRename) => void` | A view was renamed |
| `onViewDuplicate` | `(id: string) => void` | Duplicate was picked |
| `onViewShare` | `(detail: SavedViewShare) => void` | Share with team or Stop sharing was picked |
| `onViewDefault` | `(id: string) => void` | Set as default was picked |
| `onViewDelete` | `(id: string) => void` | Delete was confirmed |

*Renamed or hidden on the wrapper: `active`, `children`*

## Accessibility

Follows the WAI-ARIA [Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Move to the views (one tab stop), then View options, More views and New view |
| ← / → | Move between views |
| Home / End | First or last view |
| Enter / Space | Open the focused view |
| ↑ / ↓ in a menu | Move through its items; Escape closes it and returns to its button |
| Enter / Escape while renaming | Save the name, or keep the old one |

### Screen readers

The views are a tablist named "Saved views"; each tab is named by its view, then its count, whose it is, shared with the team, default view and edited, as they apply. With `controls`, each tab says which list it controls. View options is a menu button named "Options for" the open view; Delete opens a small dialog that asks before anything goes. The Edited bar is a group named "This view has unsaved changes". A rename and a delete are announced.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| CSS masks | 120 | 53 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.6 KB | 8.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/popover` · Shared Trenchcoat code | 9.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **44.4 KB** | **13.2 KB** |
| With Lit – the first component on a page | 66.2 KB | 20.3 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.6 ms** | the gallery demo's data, 65 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of views replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.8 ms | views: first render, 1,222 nodes; update 1.9 ms |
| 1,000 items | 55 ms | views: first render, 12,022 nodes; update 11 ms |

1,000 items of views: 55 ms. It renders every item, so a first render passes 50 ms (a long task) at about 910 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name views by what they hold, from the reader's side: "My open cases", not "Filter 3".
- Keep names short – about 24 characters – so several tabs fit.
- Give `count` when it's cheap to know; leave it out rather than show a stale number.

## Do and don't

### Do

- Set `dirty` from the page whenever the filters, sort or columns on screen differ from the open view.
- Keep one default view.
- Save the view the person last had open, so they come back to it.

### Don't

- Don't delete a shared view without saying it goes for everyone – the confirmation says so when it's shared.
- Don't let the tabs grow into dozens – that's a library of reports, not a set of views.

## Related

- [Filter Menu](filter-menu.md) – Grouped filters with removable chips, collapsible checkbox groups, Clear all and full keyboard control
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort
- [Session Tabs](session-tabs.md) – Open chats as tabs above a thread – status as a mark and a word, unread dots, close, drag or Alt+Shift+arrows to reorder, and a menu of the tabs scrolled out of view
- [Bulk Action Bar](bulk-action-bar.md) – What can be done to everything selected – how many, the page's actions, Select all and Clear, a question before danger, and Undo for a few seconds afterwards
- [Assignee Picker](assignee-picker.md) – Assign a case or task to a person, a team or a team's round-robin – a chip that opens a search with Assign to me, each person's open items and a load bar against their capacity, Away and Over capacity in words, and Unassign
