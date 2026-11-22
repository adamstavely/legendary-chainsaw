<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Illustrations](README.md)

# Folder Status

**Illustrations** · New

A folder scene for where a folder stands – empty, shared, syncing, archived, locked or restricted – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own

- **Element:** `<tc-folder-status>`
- **Size:** 6.3 KB gzip · 18.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/folder-status";` |
| React / Next.js | `import "@adamstavely/trenchcoat/folder-status";` · no wrapper: use the tag |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/folder-status";` · tags starting with tc- are custom elements |
| Angular | `import { FolderStatus } from "@adamstavely/trenchcoat/angular/folder-status";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/folder-status";` |

## Example

The live example is in the gallery at `#/illustrations/folder-status`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A folder scene that says where a folder stands, in the soft style of the state illustrations: a pastel folder (its back with the tab and its front flap), one pastel badge with a darker edge and ink, a soft glow beneath, and its words as real text under the drawing. `status` picks it:

| `status` | Scene | Colour | Motion | Default words |
|---|---|---|---|---|
| `empty` | An open folder with nothing in it | Slate | The front flap eases open a few times | Empty folder |
| `shared` | Two small people on the badge | Blue | The badge settles a few times | Shared folder |
| `archived` | A box with an arrow going into it on the badge | Slate | The arrow drops a few times | Archived |
| `locked` | A small padlock badge on the folder's corner | Amber | The lock settles a few times | Locked folder |
| `syncing` | Circular arrows on the badge | Blue | The arrows turn a few times | Syncing |
| `restricted` | A shield on the badge | Red | The badge settles a few times | Restricted folder |

The words follow the status unless `caption` sets its own.

### When to use

- A folder with nothing in it yet (`empty`), beside how to add the first file.
- A folder others can see or edit (`shared`), with who it's shared with.
- A folder kept for the record but out of the way (`archived`), with how long it's kept and how to restore it.
- A folder people can't open right now (`locked`) – a legal hold, a permission – with who to ask.
- A folder that's copying to or from another system (`syncing`), with how far it's got.
- A folder whose contents carry a classification (`restricted`) – who may see it, not whether it's shut – beside the classification in words (see `sensitivity-label-picker`).

### When not to use

- An inbox, queue or upload – use [Tray Status](tray-status.md).
- A single document's place in a workflow – use the document-status illustrations.
- The folder's contents – use [File Tree](../components/file-tree.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

2. **Mark** `.ui-fds-badge` – the round badge, with people, a box, a padlock, turning arrows or a shield in ink (`empty` has none)
3. **Words** `.ui-fds-caption` – where the folder stands; the default follows the status

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or the system setting, and each status has its own badge colour. It has no background of its own, so it takes on whatever it sits on.

## Usage

### HTML

```html
<tc-folder-status status="locked"></tc-folder-status>

<script type="module">
  import "@adamstavely/trenchcoat/folder-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

### React / Next.js

```tsx
import { FolderStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FolderState({ locked }: { locked: boolean }) {
  return <FolderStatus status={locked ? "locked" : "shared"} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/folder-status";
import "@adamstavely/trenchcoat/tokens.css";

</script>

<template>
  <tc-folder-status></tc-folder-status>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component } from "@angular/core";
import { FolderStatus } from "@adamstavely/trenchcoat/angular/folder-status";

@Component({
  selector: "app-folder-status-example",
  imports: [FolderStatus],
  template: `<tc-folder-status></tc-folder-status>`,
})
export class FolderStatusExample {
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/folder-status";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFolderStatus } from "@adamstavely/trenchcoat/folder-status";

  let el: TcFolderStatus;
</script>

<tc-folder-status bind:this={el}></tc-folder-status>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `status` | `status` | `FolderStatusKind` | `"empty"` | Where the folder stands: "empty", "shared", "syncing", "archived", "locked" or "restricted" |
| `caption` | `caption` | `string \| undefined` | `undefined` | The words under the drawing; unset, the status's own words; "" leaves them out |
| `label` | `label` | `string` | `""` | Accessible description, when it should say more than the words |

#### Design tokens it reads (2)

`--tc-ease-standard`, `--tc-font-sans`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `folderStatusWords: Record<FolderStatusKind, string>` | The words for each status, when `caption` isn't set |
| `folderCss(o: { ui: string; name: string; statuses: FolderStatusKind[] }): void` | The CSS for a folder element: `statuses` lists the scenes it can draw. With several, each status's colours and motion apply under its own [status]. `name` names the custom properties (`--tc-<name>-mark` …); `ui` is the class prefix. |

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

*Also attributes: `status`, `caption`, `label` – see the API table.*

### Events

*No `tc-` events of its own: listen for the native ones (`click`, `focus`…) as usual.*

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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-folder-status")` returns a `TcFolderStatus` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFolderStatus } from "@adamstavely/trenchcoat/folder-status";`
- **React / Next.js:** The element class: `import type { TcFolderStatus } from "@adamstavely/trenchcoat/folder-status";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFolderStatus["status"]` with `import type { TcFolderStatus } from "@adamstavely/trenchcoat/folder-status";`
- **Angular:** The directive types the template: `[status]` takes `TcFolderStatus["status"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFolderStatus } from "@adamstavely/trenchcoat/folder-status";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFolderStatus } from "@adamstavely/trenchcoat/folder-status";`

## Accessibility

### Keyboard

Nothing to operate. The illustration takes no focus.

### Screen readers

The host is `role="img"`, named by `label` or else by its words, so where the folder stands is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | internal/kit | Focus rings for keyboard users. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 10.7 KB | 4.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.7 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **18.0 KB** | **6.3 KB** |
| With Lit – the first component on a page | 37.5 KB | 12.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 6 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | re-render with the same data |
| First on the page | 16 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OnScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Say what it means and what to do beside it: "Held for legal review. Ask Noor Haddad for access."

## Do and don't

### Do

- Switch `status` on one element as the folder changes, rather than swapping elements.
- Say who to ask about a locked folder.

### Don't

- Don't rely on it to keep a folder shut – a locked folder is your server's decision; this is a picture and words.
- Don't use it as the only sign that a folder is shared, locked or restricted.
- Don't use `restricted` for a lock, or `locked` for a classification – they mean different things.

## Related

- [Tray Status](tray-status.md) – A tray scene for where things stand – all done, nothing here yet, no matches, drop files to upload, new items (with a count), importing, import complete, imported with errors, export ready, sync complete, paused, upload failed or storage full – each with its own badge, colour, finite motion and words, which follow the status unless `caption` sets its own
- [File Tree](../components/file-tree.md) – A project's files – folders that fold, a filter, an icon per kind of file and a Git status, with search inside files left to the page
- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Legal Hold Manager](../components/legal-hold-manager.md) – Which items are on legal hold, who placed each hold, why and until when – overdue reviews marked, items added, and Release only with a written reason
