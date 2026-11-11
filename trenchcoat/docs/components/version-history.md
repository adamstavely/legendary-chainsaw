<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Version History

**Trust & calibration** · New

The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour

- **Element:** `<tc-version-history>`
- **Size:** 13.4 KB gzip · 47.4 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/version-history";` |
| React / Next.js | `import { VersionHistory } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/version-history";` · tags starting with tc- are custom elements |
| Angular | `import { VersionHistory } from "@adamstavely/trenchcoat/angular/version-history";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/version-history";` |

## Example

The live example is in the gallery at `#/version-history`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The versions of an agent, a prompt or a workflow on one timeline, newest first. Each version says whether it's a
draft, the active one or deprecated, who made it and when, and what it does differently – changes written as
behaviour (+ added, − removed, ~ changed), not as the settings that moved. A draft says that the active version stays
until it's approved, so nobody wonders what is running now. People compare any two versions, restore an old one as a
new draft, and approve and activate a draft after a confirmation that names what changes. The component changes
nothing on its own: every action is an event the app answers.

### When to use

- An agent, prompt or workflow that people change over time and need to trust: what's live, what's waiting, what
  changed and who changed it.
- Approving a draft before it replaces the version in use.
- Going back to how something behaved before – restore makes a new draft from a past version.

### When not to use

- Moving one version through environments (draft, staging, production) with gates and rollout – use
  [Configuration release control](configuration-release-control.md).
- Reviewing edits to a piece of text word by word – use [Inline Diff](inline-diff.md).
- Summing up what one run or one edit changed – use [Change Summary](change-summary.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Active version** `.ui-vhist__live` – in the header: which version is live
2. **Compare bar** `.ui-vhist__bar` – how many versions there are, and the Compare toggle
3. **Timeline** `.ui-vhist__rows` – every version, newest first, on a rail
4. **Version** `.ui-vhist__row` – its label, status, time and note; the one shown is highlighted
5. **Detail** `.ui-vhist__detail` – the version you're on, or the two you're comparing
6. **Changes** `.ui-vhist__changes` – what it does differently: + added, − removed, ~ changed
7. **Actions** `.ui-vhist__acts` – Approve and activate, Restore as draft, Compare with the active version

## Looks

Standard puts the header on the gray tray and the timeline and detail in a white card, the detail on a light gray
well; the version label in the detail is the card's strongest line. Clean is one white card divided by hairlines,
with the list count as a small caption, quieter text and thinner icons. Both draw the same rail: a filled dot for
the active version, a ring inside a ring for a draft and a hollow dot for a deprecated one. When the card is narrow
the detail moves under the timeline.

## Usage

### HTML

```html
<tc-version-history id="history" heading="Briefing agent"></tc-version-history>

<script type="module">
  import "@adamstavely/trenchcoat/version-history";
  import "@adamstavely/trenchcoat/tokens.css";

  const history = document.querySelector("#history");
  history.versions = [
    {
      id: "v13", label: "v1.3", status: "draft", note: "Tighter review", author: "M. Lindqvist", at: "Today · 09:12",
      changes: [{ kind: "added", text: "Asks a team lead to approve when anything is urgent" }],
    },
    { id: "v12", label: "v1.2", status: "active", note: "Groups related items", author: "D. Okafor", at: "May 28" },
  ];
  history.addEventListener("tc-activate", (e) => saveVersions(e.detail.versions));
  history.addEventListener("tc-restore", (e) => createDraftFrom(e.detail.version.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { VersionHistory, type VersionEntry } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function AgentVersions({ initial }: { initial: VersionEntry[] }) {
  const [versions, setVersions] = useState(initial);
  return (
    <VersionHistory
      title="Briefing agent"
      versions={versions}
      onVersionsChange={setVersions}
      onRestore={(version) =>
        setVersions((list) => [{ ...version, id: `${version.id}-restored`, label: "Draft", status: "draft", note: `Restored from ${version.label}` }, ...list])
      }
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/version-history";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";

defineProps<{ versions: TcVersionHistory["versions"]; resolveCompare: TcVersionHistory["resolveCompare"] }>();
const onSelectChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-version-history :versions="versions" :resolveCompare="resolveCompare" @tc-select-change="onSelectChange"></tc-version-history>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { VersionHistory } from "@adamstavely/trenchcoat/angular/version-history";
import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";

@Component({
  selector: "app-version-history-example",
  imports: [VersionHistory],
  template: `<tc-version-history [versions]="versions()" [resolveCompare]="resolveCompare()" (tc-select-change)="onSelectChange($event)"></tc-version-history>`,
})
export class VersionHistoryExample {
  readonly versions = input.required<TcVersionHistory["versions"]>();
  readonly resolveCompare = input.required<TcVersionHistory["resolveCompare"]>();
  onSelectChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/version-history";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";

  let { versions, resolveCompare }: { versions: TcVersionHistory["versions"]; resolveCompare: TcVersionHistory["resolveCompare"] } = $props();
  let el: TcVersionHistory;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-select-change", on);
    return () => el.removeEventListener("tc-select-change", on);
  });
</script>

<tc-version-history bind:this={el} {versions} {resolveCompare}></tc-version-history>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `versions` | – | `VersionEntry[]` | `[]` | The versions, newest first |
| `heading` | `heading` | `string` | `"Version history"` | The heading, and the region's name |
| `description` | `description` | `string` | `"What each version does differently"` | The quiet line under the heading |
| `selected` | `selected` | `string \| null` | `null` | The version whose detail shows; unset follows the draft, else the active version, else the newest |
| `resolveCompare` | – | `VersionCompareResolver \| undefined` | `undefined` | Answers a comparison with the changes between two versions; unset, the element gathers them from the versions in between |
| `activateBlocked` | `activate-blocked` | `string` | `""` | Why the draft can't be activated by this person; set, Approve and activate stays unavailable and says so |
| `canRestore` | `can-restore` | `boolean` | `true` | Restore is offered on past versions (default true) |
| `maxHeight` | `max-height` | `number` | `360` | The tallest the timeline grows, in px, before it scrolls |
| `statusLabels` | – | `Partial<Record<VersionStatus, string>>` | `{}` | The names of the statuses – in place of Draft, Active and Deprecated |
| `changeLabels` | – | `Partial<Record<VersionChangeKind, string>>` | `{}` | What screen readers hear before each change – in place of Added, Removed and Changed |
| `activateLabel` | `activate-label` | `string` | `"Approve and activate"` | The approve button and the confirmation's action |
| `restoreLabel` | `restore-label` | `string` | `"Restore as draft"` | The restore button |
| `compareLabel` | `compare-label` | `string` | `"Compare"` | The compare toggle |
| `cancelLabel` | `cancel-label` | `string` | `"Cancel"` | The confirmation's cancel button |
| `activeVersion` | – | `` | – | The version in use, if any |
| `current` | – | `` | – | The version the detail shows |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-select-change` | – | Yes | The version shown in the detail changed; detail `{ id, version }` (VersionSelectDetail). Cancelable – prevented, `selected` stays. |
| `tc-compare` | – | Yes | Two versions were picked to compare; detail `{ from, to, changes }` (VersionCompareDetail). Cancelable – prevented, the app shows the comparison itself. |
| `tc-restore` | – | Yes | Restore was pressed on a past version; detail `{ version }` (VersionRestoreDetail). Cancelable – not prevented, the version shows "Restore requested" until `versions` changes. |
| `tc-activate` | – | Yes | A draft's activation was confirmed; detail `{ version, previous, versions }` (VersionActivateDetail). Cancelable – not prevented, `versions` becomes the list after the change. |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-version-history-max` | `360px` | not set – this fallback applies |

#### Design tokens it reads (98)

`--tc-accent`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-4`, `--tc-space-5`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-surface-well`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-title-color`, `--tc-title-font-size`, `--tc-title-font-weight`, `--tc-title-line-height`, `--tc-title-tracking`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-version-history-bg`, `--tc-version-history-fg`

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
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-version-history :versions="…">` | `<tc-version-history [versions]="…">` | `<tc-version-history {versions}>` |
| `resolveCompare` | `el.resolveCompare = …;` | `<… resolveCompare={…} />` | `<tc-version-history :resolveCompare="…">` | `<tc-version-history [resolveCompare]="…">` | `<tc-version-history {resolveCompare}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-version-history :statusLabels="…">` | `<tc-version-history [statusLabels]="…">` | `<tc-version-history {statusLabels}>` |
| `changeLabels` | `el.changeLabels = …;` | `<… changeLabels={…} />` | `<tc-version-history :changeLabels="…">` | `<tc-version-history [changeLabels]="…">` | `<tc-version-history {changeLabels}>` |

*Also attributes: `heading`, `description`, `selected`, `activate-blocked`, `can-restore`, `max-height`, `activate-label`, `restore-label` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-select-change` | Yes | `el.addEventListener("tc-select-change", (e) => …)` | `ref.current.addEventListener("tc-select-change", …)` | `@tc-select-change="…"` | `(tc-select-change)="…($event)"` | `el.addEventListener("tc-select-change", …)` |
| `tc-compare` | Yes | `el.addEventListener("tc-compare", (e) => …)` | `onCompare={…}` | `@tc-compare="…"` | `(tc-compare)="…($event)"` | `el.addEventListener("tc-compare", …)` |
| `tc-restore` | Yes | `el.addEventListener("tc-restore", (e) => …)` | `onRestore={…}` | `@tc-restore="…"` | `(tc-restore)="…($event)"` | `el.addEventListener("tc-restore", …)` |
| `tc-activate` | Yes | `el.addEventListener("tc-activate", (e) => …)` | `onActivate={…}` | `@tc-activate="…"` | `(tc-activate)="…($event)"` | `el.addEventListener("tc-activate", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

`tc-select-change`, `tc-compare`, `tc-restore`, `tc-activate` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-version-history")` returns a `TcVersionHistory` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";`
- **React / Next.js:** Props: `import type { VersionHistoryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof VersionHistory>`. The element class, for refs: `import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcVersionHistory["versions"]` with `import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";`
- **Angular:** The directive types the template: `[versions]` takes `TcVersionHistory["versions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcVersionHistory } from "@adamstavely/trenchcoat/version-history";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `versions` | `VersionEntry[]` | The versions, newest first – controlled when defined; pair it with `onVersionsChange` |
| `defaultVersions` | `VersionEntry[]` | The versions at first, when `versions` isn't controlled – the element applies activations itself |
| `onVersionsChange` | `(versions: VersionEntry[]) => void` | Called with the whole list after a draft is activated |
| `selected` | `string \| null` | The version whose detail shows – controlled when defined |
| `defaultSelected` | `string \| null` | The version shown at first (default: the draft, else the active version, else the newest) |
| `onSelectedChange` | `(id: string) => void` | Called when another version is selected |
| `onCompare` | `(detail: VersionCompareDetail, event: CustomEvent<VersionCompareDetail>) => void` | Called when two versions are picked to compare; call `event.preventDefault()` to show the comparison yourself |
| `onRestore` | `(version: VersionEntry, event: CustomEvent<VersionRestoreDetail>) => void` | Called when Restore is pressed – add the new draft to `versions` to answer it; `event.preventDefault()` declines |
| `onActivate` | `(detail: VersionActivateDetail) => void` | Called when a draft's activation is confirmed, with the draft, the version it replaces and the list after |

*Renamed or hidden on the wrapper: `versions`, `selected`, `heading`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous version and shows it |
| Home / End | Moves to the newest or oldest version |
| PageDown / PageUp | Moves a list-height down or up |
| Space / Enter (comparing) | Picks the version you're on, or unpicks it; a third pick replaces the first |
| Escape (comparing) | Leaves compare |
| ← / → (actions) | Moves between the actions; Home and End jump |
| Tab / Shift+Tab (confirmation) | Stays inside the dialog |
| Escape (confirmation) | Cancels and returns focus to Approve and activate |

### Screen readers

The host is a region named by the heading (“Version history”). The timeline is a listbox named “Versions”; each
version is an option with `aria-selected`, `aria-posinset` and `aria-setsize` (so the count stays right while the
list is windowed), read as its label, status, time, note and author (“v1.3 Draft Today · 09:12 Tighter review
before anything is sent, by M. Lindqvist”). While comparing, the listbox is multi-select and named “Versions – pick
two to compare”, and the picked versions are selected. Each change is read with its kind first (“Added: Asks a team
lead to approve…”); the signs are hidden. The actions are a toolbar named after the version (“v1.3 actions”);
Approve and activate has `aria-haspopup="dialog"` and, when `activateBlocked` is set, stays focusable with
`aria-disabled` and is described by the reason. The confirmation is a modal dialog labelled “Activate v1.3?” and
described by what changes. A polite status says what happened: “Compare: pick two versions.”, “v1.0 to v1.3: 5
changes.”, “Couldn't compare v1.2 with v1.3.”, “Restore of v1.1 requested.”, “v1.3 is active. v1.2 is deprecated.”

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
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | itself | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 37.3 KB | 10.4 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.8 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **47.4 KB** | **13.4 KB** |
| With Lit – the first component on a page | 69.9 KB | 20.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 104 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of versions replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 10,000 items | 10 ms | versions: first render, 590 nodes; update 1.5 ms |

Windowed: 10,000 items of versions render 590 nodes in 10 ms – only the rows near the viewport are in the page.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- No timers.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write each change as what it will do differently, in the present tense: “Asks a team lead to approve when anything
  is urgent”, not “Updated approval_policy”.
- Put numbers that changed in the sentence with the old value: “from a score of 0.90 (was 0.85)”.
- Keep `note` to one line about the version as a whole; the changes carry the detail.
- Give `at` as people should read it (“Today · 09:12”, “May 28”): the component shows it as given.
- When someone can't approve, say who can in `activateBlocked`: “Only a workspace owner can approve drafts.”

## Do and don't

### Do

- Keep earlier runs tied to the version that produced them, and say so – the confirmation does.
- Answer a restore by adding the new draft to `versions`; the component shows it.
- Use `resolveCompare` when your own comparison knows more than the change lists, and let it fail – the component
  shows the error and Try again.

### Don't

- Don't activate a draft without the confirmation – the confirmation is the approval.
- Don't list changes as field names or raw diffs; people reviewing behaviour can't act on them.
- Don't delete deprecated versions to tidy the list – the record of what ran matters.

## Related

- [Configuration release control](configuration-release-control.md) – A configuration version moving through environments: the pipeline, a gate on evidence and approvals, confirmed promote and rollback
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Change Summary](change-summary.md) – What moved since last time – one metric per row with a colored trend
- [Playbook Canvas](playbook-canvas.md) – An agent workflow, phase by phase – triggers, intake, context, analysis and review as steps you add and order, with review gates, versions and a dry run

## Changelog

- **Trust & calibration**, from THEMIS and built domain-neutral: - `tc-agreement-tracker`, `tc-confidence-brief`, `tc-capability-notice`, `tc-transcript-review`, `tc-version-history`, `tc-session-context-bar`, `tc-evidence-coverage`, `tc-review-conflict`; - `tc-handoff-brief`, `tc-engagement-quality`, `tc-knowledge-promotion`, `tc-friction-profile`, `tc-reasoning-flags`.
