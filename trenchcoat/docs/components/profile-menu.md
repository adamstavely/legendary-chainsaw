<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Profile Menu

**Inputs & controls**

Account card with the signed-in user, menu actions and profile setup progress

- **Element:** `<tc-profile-menu>`
- **Size:** 8.1 KB gzip · 28.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/profile-menu";` |
| React / Next.js | `import { ProfileMenu } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/profile-menu";` · tags starting with tc- are custom elements |
| Angular | `import { ProfileMenu } from "@adamstavely/trenchcoat/angular/profile-menu";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/profile-menu";` |

## Example

The live example is in the gallery at `#/profile-menu`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The account card people open from their avatar: who is signed in, the account actions – Settings, Docs, Apps,
Logout, or your own – and, if you want, how far they've got with setting up their profile, with a shortcut to the
next step. It puts the few things people look for in an account menu in one predictable place, and nudges them to
finish setup without a separate checklist. The card is the content; open it from your own avatar button or popover.

An action with `checked` is an on/off switch – “Dark mode”, say – with a small switch at the end of its row. Picking
it fires `tc-item-select` with `checked` as it should become; the card doesn't flip it itself, so set the item's
`checked` to that, as you set every other property. `profileMenuIcon("moon")` and `"sun"` (or `MoonIcon` and
`SunIcon` in React) show which way it's set.

### When to use

- The account menu behind the avatar in an app's header or sidebar.
- Account-level actions: settings, language, help and docs, switching apps, signing out.
- Prompting people to finish an onboarding checklist from a place they visit often.

### When not to use

- Searching for and running commands across the app – use [Command Menu](command-menu.md).
- A full onboarding checklist with descriptions for each step – use [Setup Guide](setup-guide.md).
- Showing plan usage and limits – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **User** `.ui-pm__user` – the avatar, name and email of the signed-in person
2. **Actions** `.ui-pm__items` – the account actions, one button each
3. **Badge** `.ui-pm__badge` – a small pill on an action, such as “New”
4. **Switch** `.ui-pm__switch` – the on/off switch at the end of an action with `checked`
5. **Setup** `.ui-pm__setup` – profile setup progress, with `setup`
6. **Next step** `.ui-pm__next` – a shortcut to the next open setup step

## Looks

Standard sets the white menu card on a gray tray, like the chat composer, and puts the setup progress in the tray
below the card. Clean has no tray: one white menu card with a hairline shadow, smaller rows and thinner icons, and
the setup progress as its last row under a hairline.

## Usage

### HTML

```html
<tc-profile-menu id="account" name="Maya Rodriguez" email="maya@northwind.studio"></tc-profile-menu>

<script type="module">
  import { profileMenuIcon } from "@adamstavely/trenchcoat/profile-menu";
  import "@adamstavely/trenchcoat/tokens.css";

  const menu = document.querySelector("#account");
  menu.items = [
    { id: "settings", label: "Settings", icon: profileMenuIcon("settings") },
    { id: "logout", label: "Log out", icon: profileMenuIcon("logout") },
  ];
  menu.setup = { done: 2, total: 5, next: "Verify your email" };
  menu.addEventListener("tc-item-select", (e) => console.log(e.detail.id));
</script>
```

### React / Next.js

```tsx
import { ProfileMenu, SettingsIcon, LogoutIcon, type ProfileMenuItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: ProfileMenuItem[] = [
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  { id: "logout", label: "Log out", icon: <LogoutIcon /> },
];

export function AccountCard({ onPick }: { onPick: (id: string) => void }) {
  return (
    <ProfileMenu
      name="Maya Rodriguez"
      email="maya@northwind.studio"
      items={items.map((item) => ({ ...item, onSelect: () => onPick(item.id) }))}
      setup={{ done: 2, total: 5, next: "Verify your email" }}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/profile-menu";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";

defineProps<{ avatar: TcProfileMenu["avatar"]; items: TcProfileMenu["items"] }>();
const onItemSelect = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-profile-menu :avatar="avatar" :items="items" @tc-item-select="onItemSelect"></tc-profile-menu>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ProfileMenu } from "@adamstavely/trenchcoat/angular/profile-menu";
import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";

@Component({
  selector: "app-profile-menu-example",
  imports: [ProfileMenu],
  template: `<tc-profile-menu [avatar]="avatar()" [items]="items()" (tc-item-select)="onItemSelect($event)"></tc-profile-menu>`,
})
export class ProfileMenuExample {
  readonly avatar = input.required<TcProfileMenu["avatar"]>();
  readonly items = input.required<TcProfileMenu["items"]>();
  onItemSelect(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/profile-menu";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";

  let { avatar, items }: { avatar: TcProfileMenu["avatar"]; items: TcProfileMenu["items"] } = $props();
  let el: TcProfileMenu;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-item-select", on);
    return () => el.removeEventListener("tc-item-select", on);
  });
</script>

<tc-profile-menu bind:this={el} {avatar} {items}></tc-profile-menu>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `name` | `string` | `""` | The signed-in person's name, at the top of the card |
| `email` | `email` | `string` | `""` | The signed-in person's email address, under the name |
| `avatar` | – | `Element \| undefined` | `undefined` | Replaces the default avatar (cloned) |
| `items` | – | `ProfileMenuItem[] \| undefined` | `undefined` | The actions; unset shows Settings, Docs, Apps and Logout |
| `setup` | – | `ProfileSetup \| undefined` | `undefined` | Profile setup progress under the actions – leave unset to hide |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-item-select` | – | No | An action was picked; detail `{ id: string, checked?: boolean }` – `checked` is a switch item's new state. |
| `tc-setup-continue` | – | No | The setup's next step was picked; detail `{ next: string }`. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-profile-menu-icon-stroke` | `1.1` | standard, clean |

#### Design tokens it reads (82)

`--tc-accent`, `--tc-border-default`, `--tc-card-radius`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-reveal-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-4-5`, `--tc-subtitle-color`, `--tc-subtitle-font-size`, `--tc-subtitle-line-height`, `--tc-surface-on-tray`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `profileMenuIcon(name: ProfileMenuIconName): Element` | One of the menu's icons as an element, to put in `items` |
| `profileMenuDefaultItems(): ProfileMenuItem[]` | The actions when `items` is unset |

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
| `avatar` | `el.avatar = …;` | `<… avatar={…} />` | `<tc-profile-menu :avatar="…">` | `<tc-profile-menu [avatar]="…">` | `<tc-profile-menu {avatar}>` |
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-profile-menu :items="…">` | `<tc-profile-menu [items]="…">` | `<tc-profile-menu {items}>` |
| `setup` | `el.setup = …;` | `<… setup={…} />` | `<tc-profile-menu :setup="…">` | `<tc-profile-menu [setup]="…">` | `<tc-profile-menu {setup}>` |

*Also attributes: `name`, `email` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-item-select` | No | `el.addEventListener("tc-item-select", (e) => …)` | `onTcItemSelect={…}` | `@tc-item-select="…"` | `(tc-item-select)="…($event)"` | `el.addEventListener("tc-item-select", …)` |
| `tc-setup-continue` | No | `el.addEventListener("tc-setup-continue", (e) => …)` | `onTcSetupContinue={…}` | `@tc-setup-continue="…"` | `(tc-setup-continue)="…($event)"` | `el.addEventListener("tc-setup-continue", …)` |

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-profile-menu")` returns a `TcProfileMenu` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";`
- **React / Next.js:** Props: `import type { ProfileMenuProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ProfileMenu>`. The element class, for refs: `import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcProfileMenu["avatar"]` with `import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";`
- **Angular:** The directive types the template: `[avatar]` takes `TcProfileMenu["avatar"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcProfileMenu } from "@adamstavely/trenchcoat/profile-menu";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `name` | `string` | The signed-in person's name, at the top of the card |
| `email` | `string` | The signed-in person's email address, under the name |
| `avatar` | `React.ReactNode` | Replaces the default avatar |
| `items` | `ProfileMenuItem[]` | The actions; unset shows Settings, Docs, Apps and Logout |
| `setup` | `ProfileSetup` | Profile setup progress under the actions – leave empty to hide |

*Renamed or hidden on the wrapper: `avatar`, `items`, `setup`, `name`, `email`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the actions, then to the setup's next step |
| ↓ / ↑ | Moves to the next or previous action, wrapping around |
| Home / End | Moves to the first or last action |
| Enter / Space | Picks the focused action or the next step; on a switch, turns it on or off |

### Screen readers

The actions are plain buttons in a group named “Account” – it's always visible, so it isn't an ARIA menu. An action
with `checked` is a button with `role="switch"` and `aria-checked`, so it reads “Dark mode, switch, off”; its drawn
switch is hidden. The setup
bar is a `progressbar` named “Profile setup” with its value as text (“2 of 5 steps done”), and the next step button
reads “Next: Verify your email”. The default avatar is hidden; give your own avatar a text alternative only if it
adds something the name doesn't.

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 22.0 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.6 KB** | **8.2 KB** |
| With Lit – the first component on a page | 51.1 KB | 15.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 58 DOM nodes – to layout, median of 7 |
| Typical update | **1.2 ms** | one item of items replaced |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |
| 100 items | 7.1 ms | items: first render, 668 nodes; update 2.9 ms |
| 1,000 items | 31 ms | items: first render, 6,518 nodes; update 16 ms |

1,000 items of items: 31 ms, 6,518 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen and under reduced motion.
- Observers: `IntersectionObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the person's full name and the email they sign in with – long ones are cut off with a tooltip.
- Write action labels as one or two words: “Settings”, “Language”, “Log out”.
- Keep setup steps as short tasks starting with a verb: “Verify your email”, “Invite a teammate”.
- Use a badge for something new or needing attention, not as decoration on every row.
- Name a switch for what's on when it's on: “Dark mode”, not “Toggle theme”.

## Do and don't

### Do

- Put sign-out last, so it's easy to find and hard to hit by accident.
- Pass your own `items` with the icons the module exports (`SettingsIcon`, `LogoutIcon` …) so they match the look.
- Hide `setup` once every step is done – the bar stays at 100 % otherwise.

### Don't

- Don't put more than six or seven actions in it; move the rest into Settings.
- Don't use it for navigation between the app's main sections.
- Don't put destructive account actions (delete account) here without a confirmation step behind them.

## Related

- [Setup Guide](setup-guide.md) – Onboarding panel with a progress bar and collapsible task groups that strike through when done
- [Command Menu](command-menu.md) – Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **`tc-profile-menu`:** Standard rounds a photo avatar, as Clean does.
