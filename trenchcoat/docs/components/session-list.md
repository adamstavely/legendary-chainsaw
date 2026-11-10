<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Session List

**Workspace & sessions** · New

sessions in a sidebar, pinned first and grouped by project or status, with status, unread dot, branch, time, Pin and Archive.

- **Element:** `<tc-session-list>`
- **Size:** 9.3 KB gzip · 28.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/session-list";` |
| React / Next.js | `import { SessionList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/session-list";` · tags starting with tc- are custom elements |
| Angular | `import { SessionList } from "@adamstavely/trenchcoat/angular/session-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/session-list";` |

## Example

The live example is in the gallery at `#/session-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The sessions in a sidebar. Pinned ones come first, then the rest grouped by project, by status, or not at all; within a
group the newest is first. Each row has its status as a mark and a word, the title, an unread dot, the branch and how
long ago it last changed. Waiting means it needs you, so it's the one in the accent colour; running spins. Each row has
Pin and Archive, and the header has New session.

### When to use

- A sidebar of an assistant's or an agent's sessions, to move between them.
- A list where what needs attention should stand out from what's only running.

### When not to use

- One session's status and controls – use [Session State](session-state.md).
- Agents' tasks waiting for approval, with their steps – use [Agent Inbox](agent-inbox.md).
- Navigation between a panel's tools – use [Icon Rail](icon-rail.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Filter** `.ui-sesl__filter` – matches the title, project, branch and detail
2. **Group** `.ui-sesl__group` – Pinned, a project or a status, with `.ui-sesl__group-head`
3. **Row** `.ui-sesl__row` – one session
4. **Mark** `.ui-sesl__mark` – the status's shape
5. **Title** `.ui-sesl__title` – cut off with an ellipsis; the whole title is in its tooltip
6. **Unread** `.ui-sesl__unread` – something new since it was opened
7. **Meta** `.ui-sesl__meta` – `.ui-sesl__branch`, the detail and the time
8. **Tools** `.ui-sesl__tools` – Pin and Archive, shown on hover, focus and the open row
9. **Empty** `.ui-sesl__empty` – no sessions, or none that match

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card, for a sidebar that already has a surface. `max-height` makes the list scroll.

## Usage

### HTML

```html
<tc-session-list id="sessions" group-by="project"></tc-session-list>

<script type="module">
  import "@adamstavely/trenchcoat/session-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#sessions");
  el.sessions = [
    { id: "s1", title: "Booking calendar", status: "waiting", project: "sample-tracker", branch: "feature/booking-calendar" },
    { id: "s2", title: "Fix CSV export", status: "running", project: "sample-tracker", branch: "fix/sample-export" },
  ];
  el.addEventListener("tc-selected-change", (e) => console.log("Open", e.detail.selected));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SessionList, type SessionItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const sessions: SessionItem[] = [
  { id: "s1", title: "Booking calendar", status: "waiting", project: "sample-tracker" },
  { id: "s2", title: "Fix CSV export", status: "running", project: "sample-tracker" },
];

export function Sessions() {
  const [selected, setSelected] = useState<string | null>("s1");
  return <SessionList sessions={sessions} selected={selected} onSelectedChange={setSelected} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/session-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";

defineProps<{ sessions: TcSessionList["sessions"]; actions: TcSessionList["actions"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-session-list :sessions="sessions" :actions="actions" @tc-selected-change="onSelectedChange"></tc-session-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SessionList } from "@adamstavely/trenchcoat/angular/session-list";
import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";

@Component({
  selector: "app-session-list-example",
  imports: [SessionList],
  template: `<tc-session-list [sessions]="sessions()" [actions]="actions()" (tc-selected-change)="onSelectedChange($event)"></tc-session-list>`,
})
export class SessionListExample {
  readonly sessions = input.required<TcSessionList["sessions"]>();
  readonly actions = input.required<TcSessionList["actions"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";

  let { sessions, actions }: { sessions: TcSessionList["sessions"]; actions: TcSessionList["actions"] } = $props();
  let el: TcSessionList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-session-list bind:this={el} {sessions} {actions}></tc-session-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Sessions"` | The heading; empty draws no header |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `sessions` | – | `SessionItem[]` | `[]` | The sessions, any order; within a group the newest comes first |
| `groupBy` | `group-by` | `SessionGroupBy` | `"project"` | How the unpinned sessions are grouped |
| `selected` | `selected` | `string \| null` | `null` | The open session's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `query` | `query` | `string` | `""` | What the filter holds. Changed by typing unless a tc-query-change listener calls preventDefault() |
| `hideFilter` | `hide-filter` | `boolean` | `false` | Hides the filter |
| `hideCreate` | `hide-create` | `boolean` | `false` | Hides New session |
| `actions` | – | `SessionListActionItem[]` | `[]` | Small buttons in the header |
| `labels` | – | `Partial<SessionListLabels>` | `{}` | Rename any of the words, over the defaults |
| `maxHeight` | `max-height` | `string \| undefined` | `undefined` | The tallest the list grows before it scrolls, a CSS length |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times, e.g. "en-GB"; by default the browser's |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A session was opened ({ selected, session }: SessionSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-query-change` | – | Yes | The filter changed ({ query }: SessionQueryChange); cancelable – prevented, the filter keeps its text |
| `tc-pin` | – | Yes | Pin or Unpin was pressed ({ id, pinned, session }: SessionPin); cancelable |
| `tc-archive` | – | Yes | Archive was pressed ({ id, session }: SessionArchive); cancelable |
| `tc-create` | – | No | New session was pressed (detail: {}) |
| `tc-action` | – | No | A header button was pressed ({ id }: SessionListAction) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-sesl-dot` | `7px` | both |

#### Design tokens it reads (46)

`--tc-accent`, `--tc-accent-text`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-duration-fast`, `--tc-duration-reveal-slow`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-fg`, `--tc-status-info-fg`, `--tc-status-success-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultSessionListLabels: SessionListLabels` | The words used when the page gives none |

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
| `sessions` | `el.sessions = …;` | `<… sessions={…} />` | `<tc-session-list :sessions="…">` | `<tc-session-list [sessions]="…">` | `<tc-session-list {sessions}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-session-list :actions="…">` | `<tc-session-list [actions]="…">` | `<tc-session-list {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-session-list :labels="…">` | `<tc-session-list [labels]="…">` | `<tc-session-list {labels}>` |

*Also attributes: `heading`, `description`, `group-by`, `selected`, `query`, `hide-filter`, `hide-create`, `max-height` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `ref.current.addEventListener("tc-query-change", …)` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-pin` | Yes | `el.addEventListener("tc-pin", (e) => …)` | `onTcPin={…}` | `@tc-pin="…"` | `(tc-pin)="…($event)"` | `el.addEventListener("tc-pin", …)` |
| `tc-archive` | Yes | `el.addEventListener("tc-archive", (e) => …)` | `onTcArchive={…}` | `@tc-archive="…"` | `(tc-archive)="…($event)"` | `el.addEventListener("tc-archive", …)` |
| `tc-create` | No | `el.addEventListener("tc-create", (e) => …)` | `onTcCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` and `query` itself unless a listener calls `preventDefault()` on `tc-selected-change` or `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-session-list id="session-list"></tc-session-list>

<script type="module">
  import "@adamstavely/trenchcoat/session-list";

  const el = document.querySelector("#session-list");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SessionList } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SessionList>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledSessionList({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <SessionList {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/session-list";
import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";

const props = defineProps<{ initial: TcSessionList["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcSessionList["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-session-list :selected="selected" @tc-selected-change="onSelectedChange"></tc-session-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SessionList } from "@adamstavely/trenchcoat/angular/session-list";
import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";

@Component({
  selector: "app-controlled-session-list",
  imports: [SessionList],
  template: `<tc-session-list [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-session-list>`,
})
export class ControlledSessionList {
  readonly initial = input.required<TcSessionList["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcSessionList["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-list";
  import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";

  let { initial }: { initial: TcSessionList["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcSessionList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcSessionList["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-session-list bind:this={el} {selected}></tc-session-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-session-list")` returns a `TcSessionList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";`
- **React / Next.js:** Props: `import type { SessionListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SessionList>`. The element class, for refs: `import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSessionList["sessions"]` with `import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";`
- **Angular:** The directive types the template: `[sessions]` takes `TcSessionList["sessions"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSessionList } from "@adamstavely/trenchcoat/session-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `selected` | `string \| null` | The open session's id – controlled when given |
| `defaultSelected` | `string \| null` | At first, when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, session?: SessionItem) => void` | Another session was opened |
| `query` | `string` | The filter's text – controlled when given |
| `defaultQuery` | `string` | At first, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | The filter's text changed |

*Renamed or hidden on the wrapper: `heading`, `selected`, `query`, `children`*

## Accessibility

### Keyboard

The rows' buttons are one tab stop.

| Key | What it does |
|---|---|
| ↑ / ↓ | Move between sessions, across groups |
| ← / → | Move between a row, its Pin and its Archive |
| Home / End | Go to the first or last session |
| Enter / Space | Open the session, pin it, or archive it |

### Screen readers

Each group is a list named by its heading. A row's button reads the title, then the status in words ("Needs you") and
"unread"; the open session has `aria-current`. Pin is a toggle button, and Pin and Archive name the session they act on.
Pinning and archiving are announced through `role="status"`. The spinner is decoration; the word says it's running.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-06 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.0 KB | 6.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **28.5 KB** | **9.3 KB** |
| With Lit – the first component on a page | 50.8 KB | 16.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 180 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of sessions replaced |
| First on the page | 8.8 ms | default properties; includes adding its CSS to the document |
| 100 items | 9.9 ms | sessions: first render, 2,530 nodes; update 1.8 ms |
| 1,000 items | 97 ms | sessions: first render, 25,030 nodes; update 19 ms |

1,000 items of sessions: 97 ms. It renders every item, so a first render passes 50 ms (a long task) at about 520 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Titles say what the session is for, in a few words: "Fix CSV export of sample batches".
- Keep `detail` to a short phrase about what it's doing now.
- `updated` takes epoch ms or an ISO string; pass `now` for times that don't move.

## Do and don't

### Do

- Update `sessions` after `tc-pin` and `tc-archive`; the list follows the data.
- Clear `unread` when a session is opened.

### Don't

- Don't use `waiting` for anything that doesn't need the person; it's the status that draws the eye.
- Don't put more than a few sessions in Pinned, or it stops meaning anything.

## Related

- [Icon Rail](icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.
- [Session State](session-state.md) – Where a long LLM session stands – a health pill, tiles for the primary goal, open loops, pending artifacts and context pressure with a meter that warns as it fills, and status chips, the tiles optionally opening what they count
- [Agent Inbox](agent-inbox.md) – All your background agent tasks in one calm list – live clocks and status tags, filter tabs with rolling counts, rows that unfold to the last steps with Approve, Reject, Retry or Open, and glide to their new place – or a recap of what changed while you were away, with Undo
- [Panel Card](panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.
