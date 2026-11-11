<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Branch Switcher

**Workspace & sessions** · New

the current branch with ahead/behind counts and a filterable list of worktrees, local and remote branches to switch to or create from.

- **Element:** `<tc-branch-switcher>`
- **Size:** 12.0 KB gzip · 36.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/branch-switcher";` |
| React / Next.js | `import { BranchSwitcher } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/branch-switcher";` · tags starting with tc- are custom elements |
| Angular | `import { BranchSwitcher } from "@adamstavely/trenchcoat/angular/branch-switcher";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/branch-switcher";` |

## Example

The live example is in the gallery at `#/branch-switcher`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Which branch or worktree a session works on, and a way to pick or make another. The trigger shows the current branch and
how far it is ahead of and behind its base (↑2 ↓5). It opens a list with a filter, in sections for worktrees, local and
remote branches. Each row has the name, ahead and behind, when it last changed, and a dot when it has uncommitted work.
Typing a name that isn't there offers to create it from the base. Sync beside the trigger asks the page to pull and push.

### When to use

- Choosing the branch or worktree for a session, an editor or a preview.
- A panel that should show the whole list at once – with `inline`.

### When not to use

- Picking from a list that isn't branches – use [Combobox](combobox.md).
- Showing the branch as one line among the machine and folders – use [Environment List](environment-list.md).
- The pull request for the branch – use [Pull Request](pull-request.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trigger** `.ui-brsw__trigger` – the current branch, `.ui-brsw__counts` and a chevron
2. **Sync** `.ui-brsw__sync` – asks the page to pull and push
3. **Popup** `.ui-brsw__pop` – the list, below the trigger
4. **Filter** `.ui-brsw__filter` – finds a branch, or names a new one
5. **Section** `.ui-brsw__group` – Worktrees, Local or Remote, with `.ui-brsw__group-head`
6. **Row** `.ui-brsw__option` – the name, `.ui-brsw__meta`, the counts and a check on the current one
7. **Dirty dot** `.ui-brsw__dirty` – uncommitted changes
8. **Create** `.ui-brsw__create` – the row that makes a new branch from the base

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card. A page can set `--tc-brsw-list-h`, the list's height before it scrolls, and
`--tc-brsw-pop-w`, the popup's width.

## Usage

### HTML

```html
<tc-branch-switcher id="branch" current="feature/booking-calendar" base="main"></tc-branch-switcher>

<script type="module">
  import "@adamstavely/trenchcoat/branch-switcher";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#branch");
  el.branches = [
    { name: "main", kind: "local" },
    { name: "feature/booking-calendar", kind: "local", ahead: 2, behind: 5 },
  ];
  el.addEventListener("tc-create", (e) => console.log("Create", e.detail.name, "from", e.detail.from));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { BranchSwitcher, type BranchItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const branches: BranchItem[] = [
  { name: "main", kind: "local" },
  { name: "feature/booking-calendar", kind: "local", ahead: 2, behind: 5 },
];

export function Branch() {
  const [current, setCurrent] = useState("main");
  return <BranchSwitcher branches={branches} current={current} onCurrentChange={setCurrent} base="main" />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/branch-switcher";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";

defineProps<{ branches: TcBranchSwitcher["branches"]; labels: TcBranchSwitcher["labels"] }>();
const onCurrentChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-branch-switcher :branches="branches" :labels="labels" @tc-current-change="onCurrentChange"></tc-branch-switcher>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { BranchSwitcher } from "@adamstavely/trenchcoat/angular/branch-switcher";
import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";

@Component({
  selector: "app-branch-switcher-example",
  imports: [BranchSwitcher],
  template: `<tc-branch-switcher [branches]="branches()" [labels]="labels()" (tc-current-change)="onCurrentChange($event)"></tc-branch-switcher>`,
})
export class BranchSwitcherExample {
  readonly branches = input.required<TcBranchSwitcher["branches"]>();
  readonly labels = input.required<TcBranchSwitcher["labels"]>();
  onCurrentChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/branch-switcher";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";

  let { branches, labels }: { branches: TcBranchSwitcher["branches"]; labels: TcBranchSwitcher["labels"] } = $props();
  let el: TcBranchSwitcher;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-current-change", on);
    return () => el.removeEventListener("tc-current-change", on);
  });
</script>

<tc-branch-switcher bind:this={el} {branches} {labels}></tc-branch-switcher>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Branch"` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `branches` | – | `BranchItem[]` | `[]` | Every branch and worktree |
| `current` | `current` | `string` | `""` | The branch in use. Changed by picking one unless a tc-current-change listener calls preventDefault() |
| `base` | `base` | `string` | `"main"` | The branch that ahead and behind count against, and new branches start from |
| `query` | `query` | `string` | `""` | What the filter holds. Changed by typing unless a tc-query-change listener calls preventDefault() |
| `open` | `open` | `boolean` | `false` | The list is open. Changed by the trigger, Escape and picking unless a tc-open-change listener prevents opening |
| `inline` | `inline` | `boolean` | `false` | Draws the list in place, without the trigger |
| `busy` | `busy` | `boolean` | `false` | Something is under way: picking and Sync wait |
| `syncable` | `syncable` | `boolean` | `true` | Offers Sync beside the trigger |
| `labels` | – | `Partial<BranchSwitcherLabels>` | `{}` | Rename any of the words, over the defaults |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times, e.g. "en-GB"; by default the browser's |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-current-change` | – | Yes | A branch was picked ({ current, branch }: BranchCurrentChange); cancelable – prevented, `current` stays as it was |
| `tc-query-change` | – | Yes | The filter changed ({ query }: BranchQueryChange); cancelable – prevented, the filter keeps its text |
| `tc-open-change` | – | Yes | The list opened or closed ({ open }: BranchOpenChange); cancelable when opening – prevented, it stays shut |
| `tc-create` | – | No | Create branch was picked ({ name, from }: BranchCreate) |
| `tc-sync` | – | No | Sync was pressed ({ branch, ahead, behind }: BranchSync) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-brsw-list-h` | `18rem` | both |
| `--tc-brsw-pop-w` | `20rem` | both |
| `--tc-brsw-dot` | `6px` | both |

#### Design tokens it reads (42)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-field-bg`, `--tc-field-h`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-radius-full`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultBranchSwitcherLabels: BranchSwitcherLabels` | The words used when the page gives none. `create` takes {name} and {base}; `ahead` and `behind` take {count}; `aheadOf` joins them to the base as {counts} and {base} |
| `toBranchName(text: string): void` | A typed name as a branch name git accepts (`git check-ref-format --branch`): spaces become dashes, and what git refuses is dropped |

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
| `branches` | `el.branches = …;` | `<… branches={…} />` | `<tc-branch-switcher :branches="…">` | `<tc-branch-switcher [branches]="…">` | `<tc-branch-switcher {branches}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-branch-switcher :labels="…">` | `<tc-branch-switcher [labels]="…">` | `<tc-branch-switcher {labels}>` |

*Also attributes: `heading`, `description`, `current`, `base`, `query`, `open`, `inline`, `busy` and 4 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-current-change` | Yes | `el.addEventListener("tc-current-change", (e) => …)` | `onCurrentChange={…}` | `@tc-current-change="…"` | `(tc-current-change)="…($event)"` | `el.addEventListener("tc-current-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |
| `tc-create` | No | `el.addEventListener("tc-create", (e) => …)` | `onTcCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |
| `tc-sync` | No | `el.addEventListener("tc-sync", (e) => …)` | `onTcSync={…}` | `@tc-sync="…"` | `(tc-sync)="…($event)"` | `el.addEventListener("tc-sync", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `current`, `query` and `open` itself unless a listener calls `preventDefault()` on `tc-current-change`, `tc-query-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-branch-switcher id="branch-switcher"></tc-branch-switcher>

<script type="module">
  import "@adamstavely/trenchcoat/branch-switcher";

  const el = document.querySelector("#branch-switcher");
  el.addEventListener("tc-current-change", (e) => {
    e.preventDefault(); // the element keeps its current…
    if (allowed(e.detail.current)) el.current = e.detail.current; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { BranchSwitcher } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof BranchSwitcher>;
type Props = Omit<Own, "current" | "onCurrentChange"> & { initial: NonNullable<Own["current"]> };

// Controlled: passing current makes the wrapper prevent the element's own change; the app sets it
export function ControlledBranchSwitcher({ initial, ...props }: Props) {
  const [current, setCurrent] = useState<Own["current"]>(initial);
  return <BranchSwitcher {...props} current={current} onCurrentChange={(next) => setCurrent(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/branch-switcher";
import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";

const props = defineProps<{ initial: TcBranchSwitcher["current"] }>();
const current = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onCurrentChange = (e: CustomEvent<{ current: TcBranchSwitcher["current"] }>) => {
  e.preventDefault();
  current.value = e.detail.current;
};
</script>

<template>
  <tc-branch-switcher :current="current" @tc-current-change="onCurrentChange"></tc-branch-switcher>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { BranchSwitcher } from "@adamstavely/trenchcoat/angular/branch-switcher";
import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";

@Component({
  selector: "app-controlled-branch-switcher",
  imports: [BranchSwitcher],
  template: `<tc-branch-switcher [current]="current()" (tc-current-change)="onCurrentChange($event)"></tc-branch-switcher>`,
})
export class ControlledBranchSwitcher {
  readonly initial = input.required<TcBranchSwitcher["current"]>();
  readonly current = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onCurrentChange(e: CustomEvent<{ current: TcBranchSwitcher["current"] }>) {
    e.preventDefault();
    this.current.set(e.detail.current);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/branch-switcher";
  import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";

  let { initial }: { initial: TcBranchSwitcher["current"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let current = $derived(initial);
  let el: TcBranchSwitcher;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      current = (e as CustomEvent<{ current: TcBranchSwitcher["current"] }>).detail.current;
    };
    el.addEventListener("tc-current-change", on);
    return () => el.removeEventListener("tc-current-change", on);
  });
</script>

<tc-branch-switcher bind:this={el} {current}></tc-branch-switcher>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-branch-switcher")` returns a `TcBranchSwitcher` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";`
- **React / Next.js:** Props: `import type { BranchSwitcherProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof BranchSwitcher>`. The element class, for refs: `import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcBranchSwitcher["branches"]` with `import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";`
- **Angular:** The directive types the template: `[branches]` takes `TcBranchSwitcher["branches"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcBranchSwitcher } from "@adamstavely/trenchcoat/branch-switcher";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `current` | `string` | The branch in use – controlled when given |
| `defaultCurrent` | `string` | At first, when `current` isn't controlled |
| `onCurrentChange` | `(current: string, branch?: BranchItem) => void` | Another branch was picked |
| `query` | `string` | The filter's text – controlled when given |
| `defaultQuery` | `string` | At first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The filter's text changed |
| `open` | `boolean` | The list is open – controlled when given |
| `defaultOpen` | `boolean` | At first, when `open` isn't controlled |
| `onOpenChange` | `(open: boolean) => void` | The list opened or closed |

*Renamed or hidden on the wrapper: `heading`, `current`, `query`, `open`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the trigger | Opens the list, with focus in the filter |
| ↑ / ↓ | Move through the rows, across sections |
| Enter | Picks the row, or creates the branch |
| Escape | Closes the list and returns focus to the trigger; inline, it clears the filter |
| Tab | Leaves the list |

### Screen readers

The trigger names the branch, then "2 ahead, 5 behind of main" and "uncommitted changes" when they apply, and says it
opens a dialog. The filter is a combobox that controls a listbox; the active row is its `aria-activedescendant`. Rows are
grouped by section, and the current branch is the selected option. Picking or creating is announced through
`role="status"`.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.4 KB | 7.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.5 KB** | **12.0 KB** |
| With Lit – the first component on a page | 57.2 KB | 18.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.7 ms** | the gallery demo's data, 22 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of branches replaced |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.6 ms | branches: first render, 22 nodes; update 0.2 ms |
| 1,000 items | 2.5 ms | branches: first render, 22 nodes; update 1.0 ms |

What it renders doesn't grow with branches (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setInterval, cleared`, `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Pass `ahead` and `behind` against the same `base` the element is given.
- Give worktrees their `path`, so two worktrees on similar branches can be told apart.
- Remote branches keep their remote's prefix (`origin/main`); creating a branch named after one isn't offered. A local
  `feature/login` doesn't stop "Create login".
- A typed name is cleaned into one git accepts (`toBranchName`): spaces become dashes, and `..`, `~`, `//`, a leading dot
  in a part and a trailing `.lock` are dropped.

## Do and don't

### Do

- Add the new branch to `branches` after `tc-create`, and set `current` to it.
- Set `busy` while switching or syncing.

### Don't

- Don't switch the branch on `tc-current-change` while there are uncommitted changes without asking first; prevent the
  event and ask.
- Don't rely on the name clean-up for safety; the server still checks the name.

## Related

- [Pull Request](pull-request.md) – one pull request at a glance: branches, review, checks, whether it can merge, and the button its state calls for.
- [Environment List](environment-list.md) – Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
