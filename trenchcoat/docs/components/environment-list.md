<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Environment List

**Workspace & sessions** · New

Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.

- **Element:** `<tc-environment-list>`
- **Size:** 8.7 KB gzip · 31.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/environment-list";` |
| React / Next.js | `import { EnvironmentList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/environment-list";` · tags starting with tc- are custom elements |
| Angular | `import { EnvironmentList } from "@adamstavely/trenchcoat/angular/environment-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/environment-list";` |

## Example

The live example is in the gallery at `#/environment-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a session runs, as rows: the machine, its folders, the repository and the branch, each with its icon. A row can have
a small action, such as Save, or a switch. Long paths end in an ellipsis, with the whole text in the row's tooltip.

### When to use

- A side panel saying what a tool or an agent is working on, and where.
- A few settings that belong with that, such as remote access.

### When not to use

- A session's declared terms, such as scope and limits – use [Session Context Bar](session-context-bar.md).
- A connected service's full settings – use [Integration Settings](integration-settings.md).
- Changes in progress – use [Change List](change-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-enl__row` – one thing, with its `data-kind`
2. **Icon** `.ui-enl__icon` – the kind's, or the row's own for `custom`
3. **Label** `.ui-enl__label` – its name
4. **Detail** `.ui-enl__detail` – quieter text, cut off at the end
5. **Action** `.ui-enl__action` – a small button
6. **Switch** `.ui-enl__switch` – a `tc-switch`, named by the label

## Looks

Standard puts the header, if any, on the gray tray above a white card; Clean is one white card. `bare` drops the tray and
card, for a place that already has one.

## Usage

### HTML

```html
<tc-environment-list id="env" heading="Environment"></tc-environment-list>

<script type="module">
  import "@adamstavely/trenchcoat/environment-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#env");
  el.items = [
    { id: "repo", kind: "repo", label: "institute/sample-tracker" },
    { id: "remote", kind: "custom", label: "Remote access", toggle: true },
  ];
  el.addEventListener("tc-toggles-change", (e) => console.log(e.detail.toggles));
</script>
```

### React / Next.js

```tsx
import { EnvironmentList, type EnvironmentItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const items: EnvironmentItem[] = [
  { id: "repo", kind: "repo", label: "institute/sample-tracker" },
  { id: "remote", kind: "custom", label: "Remote access", toggle: true },
];

export function Environment() {
  return <EnvironmentList title="Environment" items={items} defaultToggles={{ remote: true }} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/environment-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";

defineProps<{ items: TcEnvironmentList["items"]; toggles: TcEnvironmentList["toggles"] }>();
const onAction = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-environment-list :items="items" :toggles="toggles" @tc-action="onAction"></tc-environment-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { EnvironmentList } from "@adamstavely/trenchcoat/angular/environment-list";
import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";

@Component({
  selector: "app-environment-list-example",
  imports: [EnvironmentList],
  template: `<tc-environment-list [items]="items()" [toggles]="toggles()" (tc-action)="onAction($event)"></tc-environment-list>`,
})
export class EnvironmentListExample {
  readonly items = input.required<TcEnvironmentList["items"]>();
  readonly toggles = input.required<TcEnvironmentList["toggles"]>();
  onAction(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/environment-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";

  let { items, toggles }: { items: TcEnvironmentList["items"]; toggles: TcEnvironmentList["toggles"] } = $props();
  let el: TcEnvironmentList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-action", on);
    return () => el.removeEventListener("tc-action", on);
  });
</script>

<tc-environment-list bind:this={el} {items} {toggles}></tc-environment-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `items` | – | `EnvironmentItem[]` | `[]` | The rows, in order |
| `toggles` | – | `Record<string, boolean>` | `{}` | The switches' values by row id. Changed by the user unless a tc-toggles-change listener calls preventDefault() |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-action` | – | No | A row's action was pressed ({ id, itemId, item }: EnvironmentAction) |
| `tc-toggles-change` | – | Yes | A row's switch was changed ({ toggles, id, value }: EnvironmentTogglesChange); cancelable – prevented, the switch stays as it was |

#### Design tokens it reads (26)

`--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-md`, `--tc-space-1`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `items` | `el.items = …;` | `<… items={…} />` | `<tc-environment-list :items="…">` | `<tc-environment-list [items]="…">` | `<tc-environment-list {items}>` |
| `toggles` | `el.toggles = …;` | `<… toggles={…} />` | `<tc-environment-list :toggles="…">` | `<tc-environment-list [toggles]="…">` | `<tc-environment-list {toggles}>` |

*Also attributes: `heading`, `description`, `bare` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-toggles-change` | Yes | `el.addEventListener("tc-toggles-change", (e) => …)` | `ref.current.addEventListener("tc-toggles-change", …)` | `@tc-toggles-change="…"` | `(tc-toggles-change)="…($event)"` | `el.addEventListener("tc-toggles-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `toggles` itself unless a listener calls `preventDefault()` on `tc-toggles-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-environment-list id="environment-list"></tc-environment-list>

<script type="module">
  import "@adamstavely/trenchcoat/environment-list";

  const el = document.querySelector("#environment-list");
  el.addEventListener("tc-toggles-change", (e) => {
    e.preventDefault(); // the element keeps its toggles…
    if (allowed(e.detail.toggles)) el.toggles = e.detail.toggles; // …until the app sets it
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
import "@adamstavely/trenchcoat/environment-list";
import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";

const props = defineProps<{ initial: TcEnvironmentList["toggles"] }>();
const toggles = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onTogglesChange = (e: CustomEvent<{ toggles: TcEnvironmentList["toggles"] }>) => {
  e.preventDefault();
  toggles.value = e.detail.toggles;
};
</script>

<template>
  <tc-environment-list :toggles="toggles" @tc-toggles-change="onTogglesChange"></tc-environment-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { EnvironmentList } from "@adamstavely/trenchcoat/angular/environment-list";
import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";

@Component({
  selector: "app-controlled-environment-list",
  imports: [EnvironmentList],
  template: `<tc-environment-list [toggles]="toggles()" (tc-toggles-change)="onTogglesChange($event)"></tc-environment-list>`,
})
export class ControlledEnvironmentList {
  readonly initial = input.required<TcEnvironmentList["toggles"]>();
  readonly toggles = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onTogglesChange(e: CustomEvent<{ toggles: TcEnvironmentList["toggles"] }>) {
    e.preventDefault();
    this.toggles.set(e.detail.toggles);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/environment-list";
  import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";

  let { initial }: { initial: TcEnvironmentList["toggles"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let toggles = $derived(initial);
  let el: TcEnvironmentList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      toggles = (e as CustomEvent<{ toggles: TcEnvironmentList["toggles"] }>).detail.toggles;
    };
    el.addEventListener("tc-toggles-change", on);
    return () => el.removeEventListener("tc-toggles-change", on);
  });
</script>

<tc-environment-list bind:this={el} {toggles}></tc-environment-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-environment-list")` returns a `TcEnvironmentList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";`
- **React / Next.js:** Props: `import type { EnvironmentListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof EnvironmentList>`. The element class, for refs: `import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcEnvironmentList["items"]` with `import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";`
- **Angular:** The directive types the template: `[items]` takes `TcEnvironmentList["items"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcEnvironmentList } from "@adamstavely/trenchcoat/environment-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default none |
| `toggles` | `Record<string, boolean>` | The switches' values by row id – controlled when given |
| `defaultToggles` | `Record<string, boolean>` | On mount, when `toggles` isn't controlled |
| `onTogglesChange` | `(toggles: Record<string, boolean>) => void` | A row's switch was changed |

*Renamed or hidden on the wrapper: `heading`, `toggles`, `children`*

## Accessibility

### Keyboard

Most rows are only information, so they aren't tab stops. Actions and switches follow normal tab order.

| Key | What it does |
|---|---|
| Tab | Moves through the actions and switches |
| Enter / Space | Presses an action |
| Space | Flips a switch |

### Screen readers

The rows are a list named by the heading, or "Environment". Icons are hidden, because the label says what the row is. An
action is named with its row, such as "Save Lab workstation", and a switch is named by the row's label.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | internal/settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, internal/settings | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | internal/settings | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 8.6 KB | 3.5 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [switch](switch.md) · Element it renders | 0.7 KB | – |
| **Added to a page that already has Lit** | **31.1 KB** | **8.7 KB** |
| With Lit – the first component on a page | 53.5 KB | 16.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.6 ms** | the gallery demo's data, 52 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of items replaced |
| First on the page | 19 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.3 ms | items: first render, 705 nodes; update 0.7 ms |
| 1,000 items | 35 ms | items: first render, 7,005 nodes; update 3.2 ms |

1,000 items of items: 35 ms, 7,005 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Lead with the name people know: the folder's name as `label`, and its path as `detail`.
- Keep actions to one word.

## Do and don't

### Do

- Use `custom` with `icon` for anything that isn't a machine, folder, repository or branch.
- Prevent `tc-toggles-change` when the page needs to confirm before a switch changes.

### Don't

- Don't show secrets or tokens as `detail`: the text is in the page and its tooltip.
- Don't add many switches here; a settings page holds those better.

## Related

- [Session Context Bar](session-context-bar.md) – The session's declared terms kept in view – intent, knowledge mode, scope, review, posture, limits, deadline and budget
- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
- [Switch](switch.md) – An accessible on/off setting
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
