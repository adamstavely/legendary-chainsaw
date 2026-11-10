<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Header Nav

**Blocks** · New

The right end of an app header – notifications bell, app picker and the person's avatar, which opens their account card; one popover at a time, the three as one set of round buttons, and it fits a 320 px header (uses `@adamstavely/trenchcoat/react`: `notifications`, `app-picker`, `profile-menu`)

- **Element:** `<tc-header-nav>`
- **Size:** 15.0 KB gzip · 51.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/header-nav";` |
| React / Next.js | `import { HeaderNav } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/header-nav";` · tags starting with tc- are custom elements |
| Angular | `import { HeaderNav } from "@adamstavely/trenchcoat/angular/header-nav";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/header-nav";` |

## Example

The live example is in the gallery at `#/blocks/header-nav`, in both looks; Replay restarts its animations.

## Overview

The right end of an app header: the notifications bell, the app picker and the signed-in person's avatar, in that
order, with a hairline before the avatar. The bell and the picker are your own `tc-notifications` and `tc-app-picker`,
put inside the element as children – leave one out and it isn't shown. The avatar is a round button with the person's
photo, or their initials on a tone, and an optional presence dot. It opens their account card, a `tc-profile-menu`, in
a popover under it. Only one of the three popovers is open at a time: opening one closes the others.

### When to use

- The top right of an app or suite header, where people expect their account, alerts and other apps.
- Any header that shows more than one of those three, so they share one shape and one open-at-a-time rule.

### When not to use

- Only the alerts – use [Notifications](../components/notifications.md).
- Only the app launcher – use [App Picker](../components/app-picker.md).
- An account card shown inline on a page, not from a header – use [Profile Menu](../components/profile-menu.md).
- A single action in a header – use [Button](../components/button.md).

## Anatomy

3. **Hairline** `.ui-hn__sep` – between them and the avatar; only when one of them is there
4. **Avatar** `.ui-hn__me` – the round button that opens the account card
5. **Face** `.ui-hn__face` – the photo, or the initials on a tone
6. **Presence** `.ui-hn__dot` – online, away, busy or offline, on the avatar's bottom corner
7. **Account card** `.ui-hn__pop` – the popover holding the `tc-profile-menu`

## Looks

Standard and Clean differ only in the pieces: the triggers are 32 px round buttons in Standard and 28 px in Clean, the
account card is Standard's gray tray card or Clean's white menu card, and Clean draws initials in a medium weight. Set
`look` on the element and the bell and picker inside it follow.

For a taller bar, size the pieces from the page on `tc-header-nav`, and the bell and the picker inside it follow:
`--tc-hn-trigger-size` (the three round buttons; the control height by default), `--tc-hn-icon-size` (the bell and
the waffle; 18px), `--tc-hn-face-size` (the avatar's photo or initials; the small control height) and
`--tc-hn-initials-size` (the initials' text; the xs font size). The account card's own avatar keeps its size.

### On a dark header bar

A header bar that's dark in both themes – a brand navy, say – needs light triggers even when the page is light. Set
`inverse`: the bell, the picker's button, the avatar and the hairline take the dark theme's colours, hover fills and
focus ring, whatever the page's theme, while the account card, the notifications panel and the app picker keep the
page's light or dark theme. Set `--tc-hn-ring` to the bar's colour so the unread badge and the presence dot are
ringed in it. Don't put `data-tc-theme="dark"` on the bar for this: the popovers live inside it and would turn dark
too.

```html
<header style="background: #081d35">
  <tc-header-nav inverse style="--tc-hn-ring: #081d35">
    <tc-notifications></tc-notifications>
    <tc-app-picker></tc-app-picker>
  </tc-header-nav>
</header>
```

## Usage

### HTML

```html
<tc-header-nav id="nav">
  <tc-notifications id="bell"></tc-notifications>
  <tc-app-picker id="apps" current="mail"></tc-app-picker>
</tc-header-nav>

<script type="module">
  import "@adamstavely/trenchcoat/header-nav";
  import "@adamstavely/trenchcoat/notifications";
  import "@adamstavely/trenchcoat/app-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const nav = document.querySelector("#nav");
  nav.user = { name: "Ada Lovelace", email: "ada@example.com", presence: "online" };
  document.querySelector("#bell").items = [{ id: "n1", title: "Production deploy finished", time: Date.parse("2026-10-27T09:00") }];
  document.querySelector("#apps").apps = [{ id: "mail", name: "Mail", href: "/mail" }, { id: "docs", name: "Docs", href: "/docs" }];
  nav.addEventListener("tc-account-select", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { HeaderNav, type HeaderNavPanel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Header() {
  const [open, setOpen] = useState<HeaderNavPanel | null>(null);
  return (
    <HeaderNav
      user={{ name: "Ada Lovelace", email: "ada@example.com", presence: "online" }}
      notifications={{ items: [{ id: "n1", title: "Production deploy finished", time: Date.parse("2026-10-27T09:00") }] }}
      apps={{ apps: [{ id: "mail", name: "Mail", href: "/mail" }], current: "mail" }}
      open={open}
      onOpenChange={setOpen}
      onAccountSelect={(id) => console.log(id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/header-nav";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";

defineProps<{ user: TcHeaderNav["user"]; accountItems: TcHeaderNav["accountItems"] }>();
const onPanelChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-header-nav :user="user" :accountItems="accountItems" @tc-panel-change="onPanelChange"></tc-header-nav>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { HeaderNav } from "@adamstavely/trenchcoat/angular/header-nav";
import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";

@Component({
  selector: "app-header-nav-example",
  imports: [HeaderNav],
  template: `<tc-header-nav [user]="user()" [accountItems]="accountItems()" (tc-panel-change)="onPanelChange($event)"></tc-header-nav>`,
})
export class HeaderNavExample {
  readonly user = input.required<TcHeaderNav["user"]>();
  readonly accountItems = input.required<TcHeaderNav["accountItems"]>();
  onPanelChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/header-nav";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";

  let { user, accountItems }: { user: TcHeaderNav["user"]; accountItems: TcHeaderNav["accountItems"] } = $props();
  let el: TcHeaderNav;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-panel-change", on);
    return () => el.removeEventListener("tc-panel-change", on);
  });
</script>

<tc-header-nav bind:this={el} {user} {accountItems}></tc-header-nav>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `user` | – | `HeaderNavUser` | `{ name: "", email: "" }` | The signed-in person |
| `accountItems` | – | `ProfileMenuItem[] \| undefined` | `undefined` | The account card's actions; unset shows Settings, Language, Docs, Terms and Conditions and Sign out |
| `setup` | – | `ProfileSetup \| undefined` | `undefined` | Profile setup progress in the account card – unset hides it |
| `accountLabel` | `account-label` | `string` | `"Account"` | The account popover's name, and the start of the avatar's ("Account") |
| `panel` | `panel` | `HeaderNavPanel \| null` | `null` | The open popover, or null for none |
| `separator` | `separator` | `boolean` | `true` | The hairline before the avatar (default true; separator="false" hides it) |
| `inverse` | `inverse` | `boolean` | `false` | On a dark bar: the triggers take the dark theme's colours whatever the page's theme; the popovers keep it. Set `--tc-hn-ring` to the bar's colour |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-panel-change` | – | Yes | A popover is opening or closing ({ panel }: HeaderNavPanelChange, null when none); cancelable – prevented, `panel` stays as it is (controlled use) |
| `tc-account-select` | – | Yes | An account action was picked ({ id, checked? }: HeaderNavAccountSelect); cancelable – prevented, the card stays open. A switch item (`checked` set) keeps the card open either way, with `checked` its new state |
| `tc-setup-continue` | – | Yes | The setup's next step was picked in the account card ({ next }: HeaderNavSetupContinue); cancelable – prevented, the card stays open |

#### Slots

| Slot | Description |
| --- | --- |
| `(default)` | The page's &lt;tc-notifications> and &lt;tc-app-picker>, in that order |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-hn-ring` | `var(--tc-surface-raised)` | both |
| `--tc-hn-dot` | `8px` | both |
| `--tc-hn-trigger-size` | `var(--tc-control-h-md)` | not set – this fallback applies |
| `--tc-hn-face-size` | `var(--tc-control-h-sm)` | not set – this fallback applies |
| `--tc-hn-initials-size` | `var(--tc-font-size-xs)` | not set – this fallback applies |
| `--tc-hn-from` | `translateY(-4px)` | not set – this fallback applies |

#### Design tokens it reads (54)

`--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-border-default`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-slower`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-tight`, `--tc-menu-radius`, `--tc-radius-full`, `--tc-shadow-overlay`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-5`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-raised`, `--tc-text-primary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tooltip-bg`, `--tc-tooltip-fg`, `--tc-tooltip-font-size`, `--tc-tooltip-px`, `--tc-tooltip-py`, `--tc-tooltip-radius`, `--tc-tray-radius`, `--tc-z-dropdown`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `headerNavInitials(name: string): void` | One or two initials from a name: "Ada Lovelace" → "AL" |
| `headerNavTone(name: string): HeaderNavTone` | The tone a name gets when the user has none – the same every time |
| `headerNavDefaultItems(): ProfileMenuItem[]` | The account card's actions when `accountItems` is unset: Settings, Language, Docs, Terms and Conditions and Sign out |

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
| `user` | `el.user = …;` | `<… user={…} />` | `<tc-header-nav :user="…">` | `<tc-header-nav [user]="…">` | `<tc-header-nav {user}>` |
| `accountItems` | `el.accountItems = …;` | `<… accountItems={…} />` | `<tc-header-nav :accountItems="…">` | `<tc-header-nav [accountItems]="…">` | `<tc-header-nav {accountItems}>` |
| `setup` | `el.setup = …;` | `<… setup={…} />` | `<tc-header-nav :setup="…">` | `<tc-header-nav [setup]="…">` | `<tc-header-nav {setup}>` |

*Also attributes: `account-label`, `panel`, `separator`, `inverse` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-panel-change` | Yes | `el.addEventListener("tc-panel-change", (e) => …)` | `ref.current.addEventListener("tc-panel-change", …)` | `@tc-panel-change="…"` | `(tc-panel-change)="…($event)"` | `el.addEventListener("tc-panel-change", …)` |
| `tc-account-select` | Yes | `el.addEventListener("tc-account-select", (e) => …)` | `onAccountSelect={…}` | `@tc-account-select="…"` | `(tc-account-select)="…($event)"` | `el.addEventListener("tc-account-select", …)` |
| `tc-setup-continue` | Yes | `el.addEventListener("tc-setup-continue", (e) => …)` | `onSetupContinue={…}` | `@tc-setup-continue="…"` | `(tc-setup-continue)="…($event)"` | `el.addEventListener("tc-setup-continue", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `panel` itself unless a listener calls `preventDefault()` on `tc-panel-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-header-nav id="header-nav"></tc-header-nav>

<script type="module">
  import "@adamstavely/trenchcoat/header-nav";

  const el = document.querySelector("#header-nav");
  el.addEventListener("tc-panel-change", (e) => {
    e.preventDefault(); // the element keeps its panel…
    if (allowed(e.detail.panel)) el.panel = e.detail.panel; // …until the app sets it
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
import "@adamstavely/trenchcoat/header-nav";
import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";

const props = defineProps<{ initial: TcHeaderNav["panel"] }>();
const panel = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPanelChange = (e: CustomEvent<{ panel: TcHeaderNav["panel"] }>) => {
  e.preventDefault();
  panel.value = e.detail.panel;
};
</script>

<template>
  <tc-header-nav :panel="panel" @tc-panel-change="onPanelChange"></tc-header-nav>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { HeaderNav } from "@adamstavely/trenchcoat/angular/header-nav";
import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";

@Component({
  selector: "app-controlled-header-nav",
  imports: [HeaderNav],
  template: `<tc-header-nav [panel]="panel()" (tc-panel-change)="onPanelChange($event)"></tc-header-nav>`,
})
export class ControlledHeaderNav {
  readonly initial = input.required<TcHeaderNav["panel"]>();
  readonly panel = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPanelChange(e: CustomEvent<{ panel: TcHeaderNav["panel"] }>) {
    e.preventDefault();
    this.panel.set(e.detail.panel);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/header-nav";
  import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";

  let { initial }: { initial: TcHeaderNav["panel"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let panel = $derived(initial);
  let el: TcHeaderNav;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      panel = (e as CustomEvent<{ panel: TcHeaderNav["panel"] }>).detail.panel;
    };
    el.addEventListener("tc-panel-change", on);
    return () => el.removeEventListener("tc-panel-change", on);
  });
</script>

<tc-header-nav bind:this={el} {panel}></tc-header-nav>
```

### Slots and children

Put children inside the tag with a `slot` attribute: `no slot attribute`. The element renders into itself (no shadow root) and leaves them where you put them.

- **React:** pass them as children with the same attribute.
- **Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-header-nav")` returns a `TcHeaderNav` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";`
- **React / Next.js:** Props: `import type { HeaderNavProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof HeaderNav>`. The element class, for refs: `import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcHeaderNav["user"]` with `import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";`
- **Angular:** The directive types the template: `[user]` takes `TcHeaderNav["user"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcHeaderNav } from "@adamstavely/trenchcoat/header-nav";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `notifications` | `Omit<NotificationsProps, "open" \| "defaultOpen" \| "inline">` | The bell: &lt;Notifications> props – the app's items and handlers. Unset hides the bell |
| `apps` | `Omit<AppPickerProps, "open" \| "defaultOpen" \| "layout">` | The app picker: &lt;AppPicker> props – the app's apps, pins and handlers. Unset hides the picker |
| `accountItems` | `ProfileMenuItem[]` | The account card's actions; unset shows Settings, Language, Docs, Terms and Conditions and Sign out. Icons may be React nodes |
| `onAccountSelect` | `(id: string, checked?: boolean) => void` | An account action was picked (the popover closes and focus returns to the avatar); for a switch item, `checked` is its new state and the popover stays open |
| `setup` | `ProfileSetup` | Profile setup progress in the account card – unset hides it |
| `onSetupContinue` | `(next: string) => void` | The setup's next step was picked |
| `open` | `HeaderNavPanel \| null` | The open popover (controlled), null for none |
| `defaultOpen` | `HeaderNavPanel \| null` | The popover open at first when uncontrolled |
| `onOpenChange` | `(open: HeaderNavPanel \| null) => void` | A popover opened (its name) or closed (null) |

*Renamed or hidden on the wrapper: `panel`, `children`, `open`, `defaultOpen`, `inline`, `open`, `defaultOpen`, `layout`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the bell, the picker and the avatar, then into the open card |
| Enter / Space | Opens or closes the popover of the focused trigger |
| Escape | Closes the account card and puts focus back on the avatar |
| Enter / Space on an action | Picks it; the card closes and focus goes back to the avatar |

Hovering a trigger (after a beat) or focusing it from the keyboard shows its name in a tooltip under it –
“Notifications”, “Apps”, “Account: Ada Lovelace” – except while its popover is open. Escape hides the tooltip until
the next hover or focus. On an `inverse` bar the tooltips take the dark theme's tooltip colours, light on the dark bar.

Opening the card moves focus to its first action. Clicking outside, or moving focus anywhere else, closes it where
focus is.

### Screen readers

The avatar is a button named “Account: Ada Lovelace”, with `aria-haspopup="dialog"` and `aria-expanded`; its presence
is its description (“Online”). The card is a non-modal dialog named “Account” that the avatar controls while it's
open. The face, the presence dot and the tooltips are hidden from screen readers – the button's name and description say
it all; each tooltip repeats its trigger's name (the bell's `heading`, the picker's `label`, and `account-label` with
the person's name).

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | profile-menu | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, profile-menu, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | profile-menu | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | profile-menu | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, profile-menu, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | profile-menu | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 16.1 KB | 5.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/trigger-tip` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [profile-menu](../components/profile-menu.md) · Element it renders | 19.6 KB | – |
| **Added to a page that already has Lit** | **51.3 KB** | **15.0 KB** |
| With Lit – the first component on a page | 73.7 KB | 22.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | default properties, 3 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver`, `IntersectionObserver` (profile-menu), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- `user.name` is the full name: the initials, the avatar's name and the card's heading come from it.
- Give `user.avatar` a photo URL, or leave it out for initials. A photo that fails to load falls back to initials.
- The default actions are Settings, Language, Docs, Terms and Conditions and Sign out. Terms and Conditions fires
  `tc-account-select` with `id: "terms"`: open a read-only `tc-terms-dialog` on it – no `consents`, `canDecline`
  false and `accept-label="Close"` – as the gallery does.
- `accountItems` replaces the defaults; keep the list short and put Sign out last.
- An account item with `checked` is a switch, such as “Dark mode”. Picking it fires `tc-account-select` with `checked`
  as its new state and leaves the card open; set the item's `checked` to it.
- Rename “Account” with `account-label` in other languages.

## Do and don't

### Do

- Put the element at the end of the header, after search and other actions.
- Handle `tc-account-select` to route each action; prevent it to keep the card open.
- Control `panel` when something else on the page should close the popovers.

### Don't

- Don't put other children in it – only `tc-notifications` and `tc-app-picker` take part in the one-open rule.
- Don't use a photo of anything but the person.
- Don't show presence unless it's kept up to date.

## Related

- [Notifications](../components/notifications.md) – The notification center – a bell with an unread badge that opens a panel of notifications grouped by day, with tabs, read state, inline actions, Mark all as read and Load more
- [App Picker](../components/app-picker.md) – The app launcher for a suite header – a grid button that opens your apps as tiles, with pinned and recent apps, search, the current app marked and arrow keys that move in two dimensions
- [Profile Menu](../components/profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress
- [Button](../components/button.md) – Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state

## Changelog

- **Header Nav:** four sizes the page can set on `tc-header-nav`, and the bell and the app picker inside it follow: `--tc-hn-trigger-size` (the three round buttons; the control height by default), `--tc-hn-icon-size` (the bell and the waffle; 18px), `--tc-hn-face-size` (the avatar; the small control height) and `--tc-hn-initials-size` (the initials' text; the xs font size). A taller app bar can scale them up together without restyling the elements. The account card's own avatar keeps its size.
- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
