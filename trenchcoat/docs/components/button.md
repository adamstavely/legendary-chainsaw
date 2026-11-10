<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Button

**Inputs & controls** · Also in React

Primary, secondary, ghost and destructive buttons with icons, sizes and a shimmering loading state

- **Element:** `<tc-button>`
- **Size:** 7.2 KB gzip · 22.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/button";` |
| React / Next.js | `import { Button } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/button";` · tags starting with tc- are custom elements |
| Angular | `import { Button } from "@adamstavely/trenchcoat/angular/button";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/button";` |

## Example

The live example is in the gallery at `#/button`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The control people press to do something: save, create, copy, delete. It comes in four variants that rank actions
by weight – primary, secondary, ghost and destructive – in three sizes, with an icon before or after the label or
an icon on its own. While the work runs, `loading` dims the label under a moving shine, blocks further clicks and
tells screen readers it's busy, and when the label changes the button glides to its new width instead of jumping.
Inside it is a native `<button>`, so keyboard activation, `disabled` and form submission behave as the browser's
own.

### When to use

- The main action of a page, dialog or card (“Save”, “Create project”) – one `primary` per area.
- Supporting actions next to it – `secondary`, or `ghost` for the quietest ones in toolbars and card headers.
- Removing or revoking something – `destructive`, ideally behind a confirmation.
- Work that takes a moment after the press – set `loading` until it finishes, and change the label if it helps
  (“Save” → “Saving…”).

### When not to use

- Switching between two to five views or modes that stay visible – use [Segmented Control](segmented-control.md).
- A row of small actions on a chat message (copy, retry, rate) – use [Message Actions](message-actions.md).
- Opening an account or settings menu from an avatar – use [Profile Menu](profile-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Button** `tc-button` – the chip; a native `<button>` inside takes focus, clicks and form submission across it
2. **Icon** `[slot="icon"]` – optional, before the label; `icon-right` puts one after it
3. **Label** `.ui-button__label` – the text, and the button's accessible name

## Looks

Standard is the heavier of the two: a 28 · 32 · 40 px scale, a secondary button that's white with the card ring,
and a large size with bigger text and icons. Clean is smaller (24 · 28 · 32 px) with hairline shadows on secondary,
muted icons on secondary and ghost that darken on hover, and a quieter red fill for destructive. Primary is the
same flat ink chip in both.

## Usage

### HTML

```html
<tc-button id="save" label="Save" type="submit"></tc-button>
<tc-button variant="ghost" label="Close" hide-label>
  <svg slot="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" /></svg>
</tc-button>

<script type="module">
  import "@adamstavely/trenchcoat/button";
  import "@adamstavely/trenchcoat/tokens.css";

  const save = document.querySelector("#save");
  save.variant = "primary";
  save.addEventListener("click", async () => {
    save.loading = true;
    save.label = "Saving…";
    await fetch("/api/save", { method: "POST" });
    save.loading = false;
    save.label = "Save";
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { Button } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function SaveButton() {
  const [saving, setSaving] = useState(false);
  return (
    <Button
      variant="primary"
      loading={saving}
      onClick={() => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
      }}
    >
      {saving ? "Saving…" : "Save"}
    </Button>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/button";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-button></tc-button>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { Button } from "@adamstavely/trenchcoat/angular/button";

@Component({
  selector: "app-button-example",
  imports: [Button],
  template: `<tc-button></tc-button>`,
})
export class ButtonExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/button";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcButton } from "@adamstavely/trenchcoat/button";

  let el: TcButton;
</script>

<tc-button bind:this={el}></tc-button>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `variant` | `variant` | `"primary" \| "secondary" \| "ghost" \| "destructive"` | `"primary"` | primary: dark and filled · secondary: white with an outline (Clean: a hairline shadow) · ghost: text only · destructive: red, for deleting |
| `size` | `size` | `"sm" \| "md" \| "lg"` | `"md"` | Height and padding: sm, md or lg (Standard 28 · 32 · 40 px, Clean 24 · 28 · 32 px) |
| `label` | `label` | `string` | `""` | The button's text (and its accessible name) |
| `hideLabel` | `hide-label` | `boolean` | `false` | Icon only: the label isn't shown, but stays the button's name |
| `loading` | `loading` | `boolean` | `false` | Shows a shimmer over the label, blocks clicks and adds "loading" to the accessible name |
| `disabled` | `disabled` | `boolean` | `false` | Dims the button and disables the native button inside it, so it can't be focused or clicked |
| `type` | `type` | `"button" \| "submit" \| "reset"` | `"button"` | The inner native button's type: "button" does nothing in a form, "submit" submits it, "reset" resets it |
| `name` | `name` | `string` | `""` | Submitted with the form when this is its submit button |
| `value` | `value` | `string` | `""` | Submitted as `name`'s value when this button submits its form |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Slots

| Slot | Description |
| --- | --- |
| `icon` | An icon before the label |
| `icon-right` | An icon after the label |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-button-h` | `var(--tc-control-h-md)` | both |
| `--tc-button-px` | `var(--tc-control-px-md)` | both |
| `--tc-button-radius` | `var(--tc-control-radius-md)` | both |
| `--tc-button-fs` | `var(--tc-control-font-size)` | both |
| `--tc-button-gap` | `var(--tc-space-1-5)` | both |
| `--tc-button-icon` | `16px` | both |
| `--tc-button-load` | `1040ms` | both |
| `--tc-button-icon-inset` | `2px` | not set – this fallback applies |

#### Design tokens it reads (45)

`--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-button-fg`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-lg`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-lg`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-reveal-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-sm`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-text-primary`, `--tc-tracking-snug`

## Frameworks

*The site shows these one framework at a time, behind tabs; here they're all written out. [Set-up for each framework](../foundations/frameworks.md)*

### Set-up

- **HTML:** Import the module once – it registers the tag – and load `@adamstavely/trenchcoat/tokens.css`. Nothing else to set up.
- **React / Next.js:** The wrappers in `@adamstavely/trenchcoat/react` take React props and callbacks. In Next.js (App Router) they render on the client only: use them from a `"use client"` file.
- **Vue / Nuxt:** Tell the template compiler that `tc-` tags are custom elements: `compilerOptions.isCustomElement` in the Vue plugin, or `vue.compilerOptions` in `nuxt.config.ts`.
- **Angular:** Import the element's directive from its own entry point, `@adamstavely/trenchcoat/angular/<name>` (it loads that element only, so a lazy route keeps it), into the component's `imports` – no `CUSTOM_ELEMENTS_SCHEMA`. The directive registers the tag, and strict templates check every binding and event.
- **Svelte:** Import the module in the component's script. Svelte sets a property when the element has one, so lists and objects pass as they are.

### Data properties

*Everything it takes is a string, number or boolean, so attributes work too.*

*Also attributes: `variant`, `size`, `label`, `hide-label`, `loading`, `disabled`, `type`, `name` and 1 more – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

### Controlled

Nothing to control: it keeps no value the user changes.

### Slots and children

Put children inside the tag with a `slot` attribute: `slot="icon"`, `slot="icon-right"`. The element renders into itself (no shadow root) and leaves them where you put them.

- **React:** pass them as children with the same attribute.
- **Vue / Nuxt:** it's the HTML attribute, not Vue's `<template #name>`.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-button")` returns a `TcButton` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcButton } from "@adamstavely/trenchcoat/button";`
- **React / Next.js:** Props: `import type { ButtonProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof Button>`. The element class, for refs: `import type { TcButton } from "@adamstavely/trenchcoat/button";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcButton["variant"]` with `import type { TcButton } from "@adamstavely/trenchcoat/button";`
- **Angular:** The directive types the template: `[variant]` takes `TcButton["variant"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcButton } from "@adamstavely/trenchcoat/button";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcButton } from "@adamstavely/trenchcoat/button";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `React.ReactNode` | The label – a string (or set `label`) |
| `label` | `string` | The button's text and accessible name; wins over string children |
| `icon` | `React.ReactNode` | Icon before the label |
| `iconRight` | `React.ReactNode` | Icon after the label |

*Renamed or hidden on the wrapper: `children`, `label`*

## Accessibility

Follows the WAI-ARIA [Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves focus to the button (a disabled button is skipped) |
| Enter / Space | Presses it – nothing happens while it's `loading` |

### Screen readers

The inner native `<button>` is what's announced, named by `label` – with `hide-label` the label stays in the
accessibility tree, visually hidden, so an icon-only button still has a name. While `loading`, the button is
`aria-busy` and `aria-disabled`, and its name gains “, loading” (“Save, loading”). ARIA attributes set on
`<tc-button>` itself – `aria-label`, `aria-expanded`, `aria-controls` and the like – move to the inner button.
Icons in the React wrapper are `aria-hidden`.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 14.7 KB | 4.9 KB |
| Lit · the library every element is built on, the parts it uses | 18.9 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **22.5 KB** | **7.2 KB** |
| With Lit – the first component on a page | 42.6 KB | 13.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 9.3 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- 3 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Start with a verb that says what happens: “Save changes”, “Invite people”, “Delete project” – not “OK” or
  “Submit”.
- Keep it to one to three words; the context around the button carries the rest.
- Use sentence case, and no full stop.
- A loading label should say the same thing in progress: “Saving…”, “Deleting…”.
- An icon-only button still needs a `label` – it's the name screen readers and tooltips use.

## Do and don't

### Do

- Use one primary button per area and let secondary and ghost carry the rest.
- Set `type="submit"` on the button that submits a form, with `name` and `value` if the server needs to know which
  one was pressed.
- Keep a loading label close to the resting one – “Save” → “Saving…” glides a few pixels; a long sentence makes the
  button lurch.

### Don't

- Don't use `destructive` for anything that can't remove or revoke something.
- Don't use a button to navigate to another page – use a link.
- Don't disable a submit button to signal invalid fields; let people press it and show what's wrong.
- Don't put the label in children of `<tc-button>` – set `label`; the React wrapper turns string children into it.

## Related

- [Segmented Control](segmented-control.md) – Switch between two to six options – a raised pill or underline that glides, stretches a little and can be dragged across, with icons, counts and badges
- [Message Actions](message-actions.md) – The quiet bar under an AI message – copy turns into a check, regenerate spins and unfolds a version switcher, thumbs pop and ask why, read aloud becomes a tiny equalizer
- [Profile Menu](profile-menu.md) – Account card with the signed-in user, menu actions and profile setup progress

## Changelog

- Lit 3 web components: `tc-button`, `tc-combobox` and `tc-data-table` (the pilot), `tc-look-provider` for an app-wide default look, the shared controllers (row window, focus rescue, smooth height, off-screen, on-screen, ARIA forwarding, hotkeys, rolling numbers). Pixel-identical to the React components in both looks and themes.
