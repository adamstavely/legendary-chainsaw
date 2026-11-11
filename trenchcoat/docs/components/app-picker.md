<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# App Picker

**Inputs & controls** · New

The app launcher for a suite header – a grid button that opens your apps as tiles, with pinned and recent apps, search, the current app marked and arrow keys that move in two dimensions

- **Element:** `<tc-app-picker>`
- **Size:** 16.3 KB gzip · 53.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/app-picker";` |
| React / Next.js | `import { AppPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/app-picker";` · tags starting with tc- are custom elements |
| Angular | `import { AppPicker } from "@adamstavely/trenchcoat/angular/app-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/app-picker";` |

## Example

The live example is in the gallery at `#/app-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The app launcher at the top right of a suite: a grid button that opens the person's apps as tiles, so they can move
between products without going back to a home page. Each tile shows the app's icon and name, says what the app does
when it's pointed at or focused, and is a real link – middle-click and open in a new tab work as people expect. The
app they're in is marked. Pinned apps come first, then the ones used recently, then all apps or the app's own
groups; with many apps a search field filters as you type. The app owns the list and the navigation: a pick is a
cancelable event, so a single-page app can route instead of loading a page.

### When to use

- A suite or platform with several products a person moves between – mail, calendar, docs, an admin console.
- A header that needs a compact way to reach every app the person has access to, with their favourites first.
- A launcher whose list comes from a server, with loading and error states.

### When not to use

- Searching for and running commands, pages and records – use [Command Menu](command-menu.md).
- The signed-in person's account, settings and sign-out – use [Profile Menu](profile-menu.md).
- The person's own running jobs – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Button** `.ui-apk__trigger` – the grid icon that opens the panel
2. **Search** `.ui-apk__search` – filters the apps as you type, when there are many
3. **Section** `.ui-apk__label` – Pinned, Recent, All apps or one of the app's groups
4. **Tile** `.ui-apk__tile:not([aria-current])` – the app's icon and name, a link to the app
5. **Current app** `.ui-apk__tile[aria-current]` – the app the person is in, tinted with a bar under its name
6. **Description** `.ui-apk__hint` – what the pointed-at or focused app does
7. **Footer** `.ui-apk__foot` – Edit pins and the "All apps" or "Manage apps" link

## Looks

Standard draws each icon on a tinted 40 px tile with the name in medium weight, and sets the inline panel's header on
the gray tray above a white card. Clean uses smaller icons with a hairline ring, regular-weight names in a quieter
colour and section labels in small capitals; the inline panel is one white card with the header as its first row.
Opened from the button, both looks use the menu surface and carry no card header.

## Usage

### HTML

```html
<tc-app-picker id="apps" current="mail" pinnable footer-href="/apps" footer-label="All apps"></tc-app-picker>

<script type="module">
  import "@adamstavely/trenchcoat/app-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const apps = document.querySelector("#apps");
  apps.apps = [
    { id: "mail", name: "Mail", href: "/mail", description: "Your inbox and shared mailboxes" },
    { id: "calendar", name: "Calendar", href: "/calendar", description: "Meetings, rooms and time off" },
    { id: "docs", name: "Docs", href: "/docs" },
  ];
  apps.pinned = ["mail"];
  apps.addEventListener("tc-app-select", (e) => {
    e.preventDefault(); // route inside the single-page app instead of loading the page
    console.log("open", e.detail.id);
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AppPicker, type AppPickerApp } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const APPS: AppPickerApp[] = [
  { id: "mail", name: "Mail", href: "/mail", description: "Your inbox and shared mailboxes" },
  { id: "calendar", name: "Calendar", href: "/calendar" },
];

export function Header({ navigate }: { navigate: (href: string) => void }) {
  const [pinned, setPinned] = useState<string[]>(["mail"]);
  return (
    <AppPicker
      apps={APPS}
      current="mail"
      pinnable
      pinned={pinned}
      onPinnedChange={setPinned}
      onSelect={(app) => {
        navigate(app.href ?? "/");
        return false;
      }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/app-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";

defineProps<{ apps: TcAppPicker["apps"]; pinned: TcAppPicker["pinned"] }>();
const onAppSelect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-app-picker :apps="apps" :pinned="pinned" @tc-app-select="onAppSelect"></tc-app-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AppPicker } from "@adamstavely/trenchcoat/angular/app-picker";
import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";

@Component({
  selector: "app-app-picker-example",
  imports: [AppPicker],
  template: `<tc-app-picker [apps]="apps()" [pinned]="pinned()" (tc-app-select)="onAppSelect($event)"></tc-app-picker>`,
})
export class AppPickerExample {
  readonly apps = input.required<TcAppPicker["apps"]>();
  readonly pinned = input.required<TcAppPicker["pinned"]>();
  onAppSelect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/app-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";

  let { apps, pinned }: { apps: TcAppPicker["apps"]; pinned: TcAppPicker["pinned"] } = $props();
  let el: TcAppPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-app-select", on);
    return () => el.removeEventListener("tc-app-select", on);
  });
</script>

<tc-app-picker bind:this={el} {apps} {pinned}></tc-app-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `apps` | – | `AppPickerApp[]` | `[]` | The apps, in the order "All apps" lists them |
| `current` | `current` | `string` | `""` | The id of the app the person is in – its tile is marked |
| `pinned` | – | `string[]` | `[]` | The ids of the pinned apps, in order – listed first, under "Pinned" |
| `recent` | – | `string[]` | `[]` | The ids of recently used apps, most recent first – listed under "Recent" (pinned ones aren't repeated) |
| `pinnable` | `pinnable` | `boolean` | `false` | Adds Edit pins, where each tile toggles its pin |
| `search` | `search` | `AppPickerSearch` | `"auto"` | The search field: "auto" shows it from `search-threshold` apps, "on" always, "off" never |
| `searchThreshold` | `search-threshold` | `number` | `9` | How many apps make "auto" show the search field |
| `columns` | `columns` | `number` | `4` | The most columns of tiles; fewer when there isn't room |
| `layout` | `layout` | `AppPickerLayout` | `"trigger"` | "trigger" (default): the button that opens the panel; "panel": the panel inline, as a card |
| `open` | `open` | `boolean` | `false` | Whether the button's panel is open |
| `label` | `label` | `string` | `"Apps"` | The button's accessible name and the panel's title |
| `footerHref` | `footer-href` | `string` | `""` | A link at the foot of the panel – "All apps" or "Manage apps" – shown when set |
| `footerLabel` | `footer-label` | `string` | `"All apps"` | The footer link's text |
| `footerTarget` | `footer-target` | `string` | `""` | The footer link's target |
| `loading` | `loading` | `boolean` | `false` | The apps are being fetched: skeleton tiles show |
| `error` | `error` | `string` | `""` | Fetching the apps failed: this message shows, with Retry |
| `emptyText` | `empty-text` | `string` | `"No apps yet"` | Shown when there are no apps |
| `labels` | – | `Partial<AppPickerLabels>` | `{}` | Replaces any of the panel's words (Pinned, Recent, Search apps, Edit pins…) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-app-select` | – | Yes | A tile was picked with a plain click or Enter; detail `{ id, app }`. Cancelable: preventDefault() stops the link being followed (route in the app instead) |
| `tc-pin-change` | – | Yes | A pin was toggled while editing pins; detail `{ id, pinned, pins }` (`pins` as they'd be afterwards). Cancelable: preventDefault() and the app updates `pinned` |
| `tc-open-change` | – | Yes | The panel is opening or closing; detail `{ open }`. Cancelable: preventDefault() keeps it as it is |
| `tc-retry` | – | No | Retry was chosen after an error – the app loads the apps again ({}) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hn-trigger-size` | `var(--tc-control-h-md)` | not set – this fallback applies |
| `--tc-hn-icon-size` | `18px` | not set – this fallback applies |
| `--tc-app-picker-tile-w` | `92px` | not set – this fallback applies |

#### Design tokens it reads (104)

`--tc-accent`, `--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-duration-slower`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-item-hover`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-xl`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-16`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `appTone(id: string): AppTone` | A stable colour per id |
| `appMatch(app: AppPickerApp, query: string): number` | How well an app matches a search: 0 none; 4 the name starts with it, 3 a word in the name does, 2 the name has it, 1 a keyword, the group or (from three letters) the description has a word starting with it |

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
| `apps` | `el.apps = …;` | `<… apps={…} />` | `<tc-app-picker :apps="…">` | `<tc-app-picker [apps]="…">` | `<tc-app-picker {apps}>` |
| `pinned` | `el.pinned = …;` | `<… pinned={…} />` | `<tc-app-picker :pinned="…">` | `<tc-app-picker [pinned]="…">` | `<tc-app-picker {pinned}>` |
| `recent` | `el.recent = …;` | `<… recent={…} />` | `<tc-app-picker :recent="…">` | `<tc-app-picker [recent]="…">` | `<tc-app-picker {recent}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-app-picker :labels="…">` | `<tc-app-picker [labels]="…">` | `<tc-app-picker {labels}>` |

*Also attributes: `current`, `pinnable`, `search`, `search-threshold`, `columns`, `layout`, `open`, `label` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-app-select` | Yes | `el.addEventListener("tc-app-select", (e) => …)` | `onSelect={…}` | `@tc-app-select="…"` | `(tc-app-select)="…($event)"` | `el.addEventListener("tc-app-select", …)` |
| `tc-pin-change` | Yes | `el.addEventListener("tc-pin-change", (e) => …)` | `ref.current.addEventListener("tc-pin-change", …)` | `@tc-pin-change="…"` | `(tc-pin-change)="…($event)"` | `el.addEventListener("tc-pin-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `onOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-retry` | No | `el.addEventListener("tc-retry", (e) => …)` | `onRetry={…}` | `@tc-retry="…"` | `(tc-retry)="…($event)"` | `el.addEventListener("tc-retry", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `open` itself unless a listener calls `preventDefault()` on `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-app-picker id="app-picker"></tc-app-picker>

<script type="module">
  import "@adamstavely/trenchcoat/app-picker";

  const el = document.querySelector("#app-picker");
  el.addEventListener("tc-open-change", (e) => {
    e.preventDefault(); // the element keeps its open…
    if (allowed(e.detail.open)) el.open = e.detail.open; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { AppPicker } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof AppPicker>;
type Props = Omit<Own, "open" | "onOpenChange"> & { initial: NonNullable<Own["open"]> };

// Controlled: passing open makes the wrapper prevent the element's own change; the app sets it
export function ControlledAppPicker({ initial, ...props }: Props) {
  const [open, setOpen] = useState<Own["open"]>(initial);
  return <AppPicker {...props} open={open} onOpenChange={(next) => setOpen(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/app-picker";
import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";

const props = defineProps<{ initial: TcAppPicker["open"] }>();
const open = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onOpenChange = (e: CustomEvent<{ open: TcAppPicker["open"] }>) => {
  e.preventDefault();
  open.value = e.detail.open;
};
</script>

<template>
  <tc-app-picker :open="open" @tc-open-change="onOpenChange"></tc-app-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AppPicker } from "@adamstavely/trenchcoat/angular/app-picker";
import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";

@Component({
  selector: "app-controlled-app-picker",
  imports: [AppPicker],
  template: `<tc-app-picker [open]="open()" (tc-open-change)="onOpenChange($event)"></tc-app-picker>`,
})
export class ControlledAppPicker {
  readonly initial = input.required<TcAppPicker["open"]>();
  readonly open = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onOpenChange(e: CustomEvent<{ open: TcAppPicker["open"] }>) {
    e.preventDefault();
    this.open.set(e.detail.open);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/app-picker";
  import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";

  let { initial }: { initial: TcAppPicker["open"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let open = $derived(initial);
  let el: TcAppPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      open = (e as CustomEvent<{ open: TcAppPicker["open"] }>).detail.open;
    };
    el.addEventListener("tc-open-change", on);
    return () => el.removeEventListener("tc-open-change", on);
  });
</script>

<tc-app-picker bind:this={el} {open}></tc-app-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-app-picker")` returns a `TcAppPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";`
- **React / Next.js:** Props: `import type { AppPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AppPicker>`. The element class, for refs: `import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAppPicker["apps"]` with `import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";`
- **Angular:** The directive types the template: `[apps]` takes `TcAppPicker["apps"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAppPicker } from "@adamstavely/trenchcoat/app-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `pinned` | `string[]` | The pinned app ids, in order. Controlled when defined: a pin toggle only reports, and you update the list |
| `defaultPinned` | `string[]` | The pinned app ids when uncontrolled – the component applies pin toggles itself |
| `onPinnedChange` | `(pinned: string[]) => void` | Called with the pinned ids as they are after a pin toggle |
| `onSelect` | `(app: AppPickerApp) => boolean \| void` | An app was picked with a plain click or Enter; return false to stop its link being followed (route yourself) |
| `open` | `boolean` | Whether the panel is open. Controlled when defined |
| `defaultOpen` | `boolean` | Whether the panel starts open when uncontrolled |
| `onOpenChange` | `(open: boolean) => void` | The panel opened or closed |
| `onRetry` | `() => void` | Retry was chosen after `error` – load the apps again |

*Renamed or hidden on the wrapper: `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space / ↓ | On the button: opens the panel – focus goes to the search field, else the current app, else the first app |
| → / ← | The next or previous tile, on to the next or previous row |
| ↓ / ↑ | The tile below or above, keeping the column – across sections; ↑ from the top row returns to the search field |
| Home / End | The first or last tile |
| Enter | Opens the focused app; in the search field, opens the first match. While editing pins, Enter or Space toggles the pin |
| ↓ (in the search field) | Moves into the grid |
| Escape | Clears the search; then closes the panel and returns focus to the button |
| Tab | Leaves the grid (one tab stop) for Edit pins and the footer link |

### Screen readers

The button is named by `label` (“Apps”), with `aria-haspopup="dialog"` and `aria-expanded`. The panel is a non-modal
`dialog` with the same name. Each section is a `grid` named by its heading (“Pinned”, “Recent”, “All apps”) – or
by the panel's name when there's only one – with `row` and `gridcell` children; the section labels are headings.
A tile is a link named by the app's name, described by its `description`; the current app has
`aria-current="true"` and “(current app)” after its name. While editing pins, each tile is a toggle button named
“Pin Mail” with `aria-pressed`. A polite status region says how many apps match a search (“3 apps”, “No apps match
“zz””), “Mail pinned” or “Mail unpinned”, “Loading apps” and the error message.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 36.2 KB | 10.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **53.6 KB** | **16.3 KB** |
| With Lit – the first component on a page | 76.1 KB | 23.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 13 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of pinned replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.7 ms | pinned: first render, 13 nodes; update 0.1 ms |
| 1,000 items | 1.5 ms | pinned: first render, 13 nodes; update 0.2 ms |

What it renders doesn't grow with pinned (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `window resize`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the app's product name as people say it: “Calendar”, “Admin console” – not a slogan. Names wrap to two lines.
- Keep `description` to a short phrase about what the app is for: “Meetings, rooms and time off”.
- Give an app its own icon (`icon`) or logo (`image`) where it has one; initials on a palette colour fill in.
- Add `keywords` for the words people search with that aren't in the name (“email” for Mail).
- Write `error` as what happened and what to do: “Couldn't load your apps. Check your connection and try again.”
- Label the footer link by where it goes: “All apps” for a full catalogue, “Manage apps” for settings.

## Do and don't

### Do

- Keep `pinned` and `recent` in your own state and save them; prevent `tc-pin-change` when the server owns the list.
- Prevent `tc-app-select` to route inside a single-page app; leave it alone to follow the link.
- Set `current` to the app the person is in, so they can see where they are.
- Put the button at the end of the app's header, beside notifications and the avatar.

### Don't

- Don't turn the tiles into buttons that navigate in script – give every app an `href`, so new tabs work.
- Don't list apps the person can't open.
- Don't show the launcher with a single app.

## Related

- [Profile Menu](profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open

## Changelog

- **Header Nav:** the bell, the app picker and the avatar each show their name in a tooltip under them on hover (after a beat) and keyboard focus – the bell's `heading` (“Notifications”), the picker's `label` (“Apps”) and the avatar's `account-label` with the person's name (“Account: Helena Vance”). Hidden while the trigger's popover is open, and with Escape until the next hover or focus; on an `inverse` bar they take the dark theme's tooltip colours. `tc-notifications` and `tc-app-picker` show theirs standalone too.
- **`tc-app-picker`:** the app launcher. - **Sections:** Pinned, Recent and All apps, or your own groups. - **Finding and opening:** search; real links; arrow keys across the grid. - **Pins and states:** an "Edit pins" mode, loading and error states, and an inline panel layout.
