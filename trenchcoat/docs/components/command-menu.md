<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Command Menu

**Inputs & controls**

Search and run anything from one field – tool actions with logos and ⌘1–⌘5, everyday commands with icons

- **Element:** `<tc-command-menu>`
- **Size:** 19.5 KB gzip · 61.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/command-menu";` |
| React / Next.js | `import { CommandMenu } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/command-menu";` · tags starting with tc- are custom elements |
| Angular | `import { CommandMenu } from "@adamstavely/trenchcoat/angular/command-menu";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/command-menu";` |

## Example

The live example is in the gallery at `#/command-menu`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One field that finds and runs anything in the product: type to filter every command, move with the arrow keys and
press Enter. Commands sit in titled groups – actions that use another tool carry its logo, everyday commands a
small icon and their shortcut keys. The first group, Suggestions, runs with ⌘1–⌘5, and as soon as something is typed
the top row offers to ask the assistant about it, so a search never ends in a dead end. ⌘K (Ctrl K off Apple
devices) focuses the field from anywhere on the page.

### When to use

- A global “do anything” entry point – opened with ⌘K or always visible on a home or launcher screen.
- Products with more commands and places than fit in the navigation, where people know the name of what they want.
- Mixing actions in other tools (write an email, create a task) with navigation and settings in one list.

### When not to use

- Picking a value for a form field – use [Combobox](combobox.md).
- Inserting a person, file or command into text someone is writing – use [Mention Picker](mention-picker.md).
- Choosing which service to connect – use [Integration Picker](integration-picker.md).
- Browsing and filling saved prompts – use [Prompt Library](prompt-library.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search** `.ui-cm__search` – the field people type into, with its magnifier
2. **Group label** `.ui-cm__label` – the title above each group
3. **Command** `.ui-cm__item` – one row: the tool's logo or an icon, the label, a hint and its keys
4. **Hint** `.ui-cm__hint` – lighter text after the label: the tool, a person or a channel
5. **State** `.ui-cm__state` – “Searching…” while `loading`, or the empty text when nothing matches
6. **Popover** `.ui-cm__pop` – with `layout="popover"`, the results under the field

## Looks

Standard sets the card on a gray tray and puts the key hints – "↑ ↓ to move, ↵ to run" and the shortcut that opens
the menu – in the tray below it. Clean is one white panel with hairline shadows: group titles in capitals, an
↵ key in the field, the hints as the panel's last row, and a highlight that fades when the pointer leaves the list.
Both filter, run and announce the same way; below 480 px wide the keys and hints are hidden.

### In an app header, over results from a server

For a top bar's ⌘K search, set `layout="popover"`: a compact field, 32 px tall (28 px in Clean) and 280–420 px wide
as its container allows, with the placeholder and a ⌘K (Ctrl K) hint. Focus or typing opens the results in a popover
under it – in the top layer, so the header's `overflow` never clips it. Esc or a click outside closes it and keeps
the text; Enter runs the active row and closes it.

When the results come from your API, set `filter="none"`: the menu shows `groups` exactly as you give them, matches
still highlighted. Fetch on `tc-query-change` (debounced on your side), set `loading` while the request is out – a
quiet “Searching…” row – and `groups` when it's back. `empty-text` is what shows when nothing matches; `{query}` is
replaced with what was typed. `assistant="false"` leaves out the “Ask assistant about …” row, for apps without one.

On a header bar that's dark in both themes, add `inverse`: the field takes the dark theme's colours while the popover
keeps the page's theme, as `tc-header-nav`'s `inverse` does.

```html
<tc-command-menu id="search" layout="popover" filter="none" assistant="false" inverse
  placeholder="Search topics, gaps, papers, people…" empty-text="Nothing matches “{query}”"></tc-command-menu>

<script type="module">
  import "@adamstavely/trenchcoat/command-menu";

  const search = document.querySelector("#search");
  let timer;
  search.addEventListener("tc-query-change", (e) => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      search.loading = true;
      const res = await fetch(`/search?q=${encodeURIComponent(e.detail.query)}`);
      search.groups = await res.json();
      search.loading = false;
    }, 200);
  });
  search.onRun = (id) => location.assign(`/go/${id}`);
</script>
```

## Usage

### HTML

```html
<tc-command-menu id="menu" placeholder="Search or run a command…"></tc-command-menu>

<script type="module">
  import "@adamstavely/trenchcoat/command-menu";
  import "@adamstavely/trenchcoat/tokens.css";

  const menu = document.querySelector("#menu");
  menu.groups = [
    { id: "suggestions", label: "Suggestions", commands: [{ id: "email", label: "Write an email", hint: "Gmail" }] },
    { id: "go", label: "Go to", commands: [{ id: "inbox", label: "Inbox", keys: ["G", "I"] }] },
  ];
  menu.onRun = (id, query) => console.log(id, query);
  menu.addEventListener("tc-close", () => menu.remove());
</script>
```

### React / Next.js

```tsx
import { CommandMenu, type CommandGroup } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const groups: CommandGroup[] = [
  { id: "suggestions", label: "Suggestions", commands: [{ id: "email", label: "Write an email", hint: "Gmail" }] },
  { id: "go", label: "Go to", commands: [{ id: "inbox", label: "Inbox", keys: ["G", "I"] }] },
];

export function Launcher({ onClose }: { onClose: () => void }) {
  return (
    <CommandMenu
      groups={groups}
      placeholder="Search or run a command…"
      onRun={(id, query) => console.log(id, query)}
      onClose={onClose}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/command-menu";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";

defineProps<{ groups: TcCommandMenu["groups"]; hotkey: TcCommandMenu["hotkey"] }>();
const onQueryChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-command-menu :groups="groups" :hotkey="hotkey" @tc-query-change="onQueryChange"></tc-command-menu>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { CommandMenu } from "@adamstavely/trenchcoat/angular/command-menu";
import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";

@Component({
  selector: "app-command-menu-example",
  imports: [CommandMenu],
  template: `<tc-command-menu [groups]="groups()" [hotkey]="hotkey()" (tc-query-change)="onQueryChange($event)"></tc-command-menu>`,
})
export class CommandMenuExample {
  readonly groups = input.required<TcCommandMenu["groups"]>();
  readonly hotkey = input.required<TcCommandMenu["hotkey"]>();
  onQueryChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/command-menu";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";

  let { groups, hotkey }: { groups: TcCommandMenu["groups"]; hotkey: TcCommandMenu["hotkey"] } = $props();
  let el: TcCommandMenu;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-query-change", on);
    return () => el.removeEventListener("tc-query-change", on);
  });
</script>

<tc-command-menu bind:this={el} {groups} {hotkey}></tc-command-menu>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `groups` | – | `CommandMenuGroup[]` | `[ { id: "suggestions", label: "Suggestions", commands: [ lazyMark({ id: "email", label: "Write an email", hint: "Gmail", keywords: "mail send compose" }, "logo", () => svgEl(GMAIL)), lazyMark({ id: "ask", label: "Ask assistant", hint: "Summaries, drafts, answers", keywords: "ai chat question" }, "logo", () => svgEl(SPARK)), lazyMark({ id: "task", label: "Create a task", hint: "ClickUp", keywords: "todo issue" }, "logo", () => svgEl(CLICKUP)), lazyMark({ id: "crm", label: "Add contact to CRM", hint: "HubSpot", keywords: "lead deal company" }, "logo", () => svgEl(HUBSPOT)), lazyMark({ id: "meet", label: "Schedule a meeting", hint: "Google Calendar", keywords: "call invite event" }, "logo", () => svgEl(CALENDAR)), ], }, { id: "share", label: "Share", commands: [ lazyMark({ id: "slack", label: "Post an update", hint: "#team-updates", keywords: "message channel" }, "logo", () => svgEl(SLACK)), lazyMark({ id: "notion", label: "Save as page", hint: "Notion · Meeting notes", keywords: "doc wiki" }, "logo", () => svgEl(NOTION)), ], }, { id: "general", label: "General", commands: [ lazyMark({ id: "new-doc", label: "New document", keys: ["N"] }, "icon", () => glyph(icons.doc)), lazyMark({ id: "invite", label: "Invite teammates", keys: ["I"] }, "icon", () => glyph(icons.person)), lazyMark({ id: "upload", label: "Upload files", keys: ["U"] }, "icon", () => glyph(icons.upload)), lazyMark({ id: "theme", label: "Switch to dark mode", keywords: "theme appearance light", keys: ["⇧", "D"] }, "icon", () => glyph(icons.moon)), ], }, { id: "go", label: "Go to", commands: [ lazyMark({ id: "home", label: "Home", keys: ["G", "H"] }, "icon", () => glyph(icons.home)), lazyMark({ id: "inbox", label: "Inbox", keys: ["G", "I"] }, "icon", () => glyph(icons.inbox)), lazyMark({ id: "reports", label: "Reports", keys: ["G", "R"] }, "icon", () => glyph(icons.chart)), lazyMark({ id: "settings", label: "Settings", keys: ["G", "S"] }, "icon", () => glyph(icons.gear)), lazyMark({ id: "help", label: "Help & feedback", keys: ["?"] }, "icon", () => glyph(icons.help)), ], }, ]` | The commands, in titled groups; a group with the id "suggestions" gets ⌘1–⌘5 |
| `placeholder` | `placeholder` | `string` | `"Type a command or search…"` | Placeholder text in the search field |
| `query` | `query` | `string` | `""` | The search text |
| `onRun` | – | `CommandMenuRun \| undefined` | `undefined` | Runs a command (see CommandMenuRun); may return a promise |
| `hotkey` | – | `string \| false` | `"mod+k"` | Window shortcut that focuses the field: "mod+k" (⌘K on Apple devices, Ctrl K elsewhere), any other combination like "ctrl+shift+p", or false for none. The most recently connected menu takes it |
| `autoFocus` | `autofocus` | `boolean` | `false` | Focus the field when the menu appears |
| `maxRows` | `max-rows` | `number` | `200` | Most rows rendered at once – with more matches the menu shows the first ones and asks to keep typing |
| `layout` | `layout` | `CommandMenuLayout` | `"panel"` | "panel" (the default): the full menu · "popover": a compact field for an app header that opens the results under it |
| `filter` | `filter` | `CommandMenuFilter` | `"local"` | "local" (the default) filters `groups` by the typed text; "none" shows them as given, for results the page fetches |
| `assistant` | `assistant` | `boolean` | `true` | With text typed, offer to ask the assistant about it (the first row); assistant="false" leaves it out |
| `loading` | `loading` | `boolean` | `false` | Results are on their way: shows "Searching…" and says so |
| `emptyText` | `empty-text` | `string` | `"Nothing matches “{query}”"` | What shows when the typed text matches nothing; {query} is replaced with it |
| `label` | `label` | `string` | `"Command"` | The search field's accessible name |
| `inverse` | `inverse` | `boolean` | `false` | In popover layout, on a dark header bar: the field takes the dark theme's colours, the popover keeps the page's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-query-change` | – | Yes | The search text changes; detail `{ query }`. Cancelable: preventDefault() keeps the current text (controlled use) |
| `tc-close` | – | No | Esc in an empty search; detail: null |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-cm-field-w` | `320px` | not set – this fallback applies |

#### Design tokens it reads (79)

`--tc-accent`, `--tc-accent-highlight`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-duration-slowest`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-radius`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-bg`, `--tc-kbd-fg`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-kbd-shadow`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-2xs`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xl`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultCommandGroups: CommandMenuGroup[]` | Sample commands – replace with your own |

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-command-menu :groups="…">` | `<tc-command-menu [groups]="…">` | `<tc-command-menu {groups}>` |
| `onRun` | `el.onRun = …;` | `<… onRun={…} />` | `<tc-command-menu :onRun="…">` | `<tc-command-menu [onRun]="…">` | `<tc-command-menu {onRun}>` |
| `hotkey` | `el.hotkey = …;` | `<… hotkey={…} />` | `<tc-command-menu :hotkey="…">` | `<tc-command-menu [hotkey]="…">` | `<tc-command-menu {hotkey}>` |

*Also attributes: `placeholder`, `query`, `autofocus`, `max-rows`, `layout`, `filter`, `assistant`, `loading` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `onQueryChange={…}` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-close` | No | `el.addEventListener("tc-close", (e) => …)` | `onClose={…}` | `@tc-close="…"` | `(tc-close)="…($event)"` | `el.addEventListener("tc-close", …)` |

### Controlled

The element changes `query` itself unless a listener calls `preventDefault()` on `tc-query-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-command-menu id="command-menu"></tc-command-menu>

<script type="module">
  import "@adamstavely/trenchcoat/command-menu";

  const el = document.querySelector("#command-menu");
  el.addEventListener("tc-query-change", (e) => {
    e.preventDefault(); // the element keeps its query…
    if (allowed(e.detail.query)) el.query = e.detail.query; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { CommandMenu } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof CommandMenu>;
type Props = Omit<Own, "query" | "onQueryChange"> & { initial: NonNullable<Own["query"]> };

// Controlled: passing query makes the wrapper prevent the element's own change; the app sets it
export function ControlledCommandMenu({ initial, ...props }: Props) {
  const [query, setQuery] = useState<Own["query"]>(initial);
  return <CommandMenu {...props} query={query} onQueryChange={(next) => setQuery(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/command-menu";
import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";

const props = defineProps<{ initial: TcCommandMenu["query"] }>();
const query = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onQueryChange = (e: CustomEvent<{ query: TcCommandMenu["query"] }>) => {
  e.preventDefault();
  query.value = e.detail.query;
};
</script>

<template>
  <tc-command-menu :query="query" @tc-query-change="onQueryChange"></tc-command-menu>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { CommandMenu } from "@adamstavely/trenchcoat/angular/command-menu";
import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";

@Component({
  selector: "app-controlled-command-menu",
  imports: [CommandMenu],
  template: `<tc-command-menu [query]="query()" (tc-query-change)="onQueryChange($event)"></tc-command-menu>`,
})
export class ControlledCommandMenu {
  readonly initial = input.required<TcCommandMenu["query"]>();
  readonly query = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onQueryChange(e: CustomEvent<{ query: TcCommandMenu["query"] }>) {
    e.preventDefault();
    this.query.set(e.detail.query);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/command-menu";
  import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";

  let { initial }: { initial: TcCommandMenu["query"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let query = $derived(initial);
  let el: TcCommandMenu;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      query = (e as CustomEvent<{ query: TcCommandMenu["query"] }>).detail.query;
    };
    el.addEventListener("tc-query-change", on);
    return () => el.removeEventListener("tc-query-change", on);
  });
</script>

<tc-command-menu bind:this={el} {query}></tc-command-menu>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-command-menu")` returns a `TcCommandMenu` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";`
- **React / Next.js:** Props: `import type { CommandMenuProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof CommandMenu>`. The element class, for refs: `import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcCommandMenu["groups"]` with `import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";`
- **Angular:** The directive types the template: `[groups]` takes `TcCommandMenu["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcCommandMenu } from "@adamstavely/trenchcoat/command-menu";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `groups` | `CommandGroup[]` | The commands, in titled groups; a group with the id "suggestions" gets ⌘1–⌘5. Defaults to the sample `defaultGroups` |
| `placeholder` | `string` | Placeholder text in the search field |
| `onRun` | `CommandMenuRun` | Called with the command id; for the assistant fallback with "ask" and the typed text. May return a promise |
| `query` | `string` | The search text. Controlled when defined; otherwise the menu keeps its own, starting at `defaultQuery` |
| `defaultQuery` | `string` | The search text to start with when `query` isn't set |
| `onQueryChange` | `(query: string) => void` | Called with the new search text as people type or clear it |
| `hotkey` | `string \| false` | Window shortcut that focuses the field – "mod+k" by default, or false for none |
| `onClose` | `() => void` | Runs on Esc in an empty search |
| `autoFocus` | `boolean` | Focus the field when the menu appears |
| `maxRows` | `number` | Most rows rendered at once (default 200) |

*Renamed or hidden on the wrapper: `suggestions`, `ask`, `mod+k`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous command, wrapping at either end |
| Enter | Runs the active command |
| ⌘1–⌘5 (Ctrl 1–5) | Runs the first to fifth suggestion |
| Escape | Clears the search; with the search empty, fires `tc-close`. In popover layout, closes the results first and keeps the text |
| ⌘K (Ctrl K) | From anywhere on the page: focuses the field and selects its text (change it or turn it off with `hotkey`) |
| Tab | Left to the browser – moves focus on |

### Screen readers

The field is a combobox named “Command” that is always expanded: `aria-controls` points at the listbox “Commands”
and `aria-activedescendant` at the active row, so focus stays in the field. Each group is a `group` named by its
title, each command an `option`, `aria-selected` on the active one; key chips are hidden. A polite status region
says what ran – “Ran “Write an email”” or “Asked the assistant about “…”” – and says it again when the same command
runs twice. While a promise from `onRun` is pending the menu is `aria-busy`; if it rejects, an alert says “Couldn't
run “Write an email”” (or “Couldn't ask the assistant”).

In popover layout the field is a combobox (`aria-autocomplete="list"`) that's expanded only while the popover is open,
and `aria-activedescendant` points at a row only then. `loading` makes the field `aria-busy` and says “Searching…”;
when results arrive the status region says how many (“5 results”), or the empty text.

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 44.5 KB | 14.1 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.5 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **61.1 KB** | **19.5 KB** |
| With Lit – the first component on a page | 83.6 KB | 26.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.4 ms** | the gallery demo's data, 214 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of groups replaced |
| First on the page | 33 ms | default properties; includes adding its CSS to the document |
| 100 items | 15 ms | groups: first render, 1,384 nodes; update 1.6 ms |
| 1,000 items | 9.6 ms | groups: first render, 1,384 nodes; update 1.5 ms |

1,000 items of groups: 9.6 ms, 1,384 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout`, `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `window keydown` (internal/controllers – HotkeyController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Start labels with a verb for actions (“Write an email”, “Create a task”) and use the plain name for places
  (“Inbox”, “Settings”).
- Put the tool, person or channel in `hint` (“Gmail”, “#team-updates”) – it's searchable but lighter.
- Add words people might type to `keywords` (“mail send compose”) rather than lengthening the label.
- Keep group titles to one or two words: “Suggestions”, “Share”, “Go to”.
- Write `placeholder` as an invitation: “Search or run a command…”.

## Do and don't

### Do

- Put the five commands people use most in a group with the id `suggestions` – they get ⌘1–⌘5.
- Return a promise from `onRun` for work that takes time, so the menu shows it running and reports a failure.
- Show each command's own shortcut in `keys` so people learn them.

### Don't

- Don't put more than a few hundred commands in – above `maxRows` (200) the menu shows the first ones and asks
  people to keep typing.
- Don't run destructive commands straight from the list – open a confirmation from `onRun` instead.
- Don't take ⌘K with another listener on the same page; set `hotkey` to something else or `false`.

## Related

- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Integration Picker](integration-picker.md) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled

## Changelog

- Server-side rendering no longer crashes: `command-menu` builds its icons on first use instead of when the module loads. `check:angular` now imports every dist module in Node with no DOM.
