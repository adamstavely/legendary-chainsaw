<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Team Flag Editor

**Inputs & controls** · New

Where a team decides what its flags mean – each flag's colour, name, meaning and order, with a check on names and a question before removing a flag that's on files.

- **Element:** `<tc-team-flag-editor>`
- **Size:** 9.1 KB gzip · 29.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/team-flag-editor";` |
| React / Next.js | `import { TeamFlagEditor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/team-flag-editor";` · tags starting with tc- are custom elements |
| Angular | `import { TeamFlagEditor } from "@adamstavely/trenchcoat/angular/team-flag-editor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/team-flag-editor";` |

## Example

The live example is in the gallery at `#/team-flag-editor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Where a team decides what its flags mean: each flag's colour, name and meaning, and the order they're offered in.
People then choose from these flags on a file with `team-flag-picker`.

### When to use

- Team or workspace settings, where someone sets up the markers everyone shares.
- Showing a team what its flags mean, with `readonly`.

### When not to use

- Picking a flag on a file – use [Team Flag Picker](team-flag-picker.md).
- Choosing one colour with full control – use [Color Picker](color-picker.md).
- Free-text labels nobody needs to define – use [Tag Input](tag-input.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `.ui-tfe__list` – the team's flags, in order
2. **Row** `.ui-tfe__row` – one flag
4. **Swatches** `.ui-tfe__swatches` – the colours on offer, with `.ui-tfe__custom` for any other
5. **Actions** `.ui-tfe__actions` – how many files use it, Move up, Move down, Remove
6. **Confirm** `.ui-tfe__confirm` – asked before removing a flag that's on files
7. **Add** `.ui-tfe__add` – starts a new flag

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
A page can set `--tc-tfe-swatch-size`.

## Usage

### HTML

```html
<tc-team-flag-editor id="flags"></tc-team-flag-editor>

<script type="module">
  import "@adamstavely/trenchcoat/team-flag-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const editor = document.querySelector("#flags");
  editor.flags = [{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }];
  editor.usage = { review: 12 };
  editor.addEventListener("tc-flags-change", (e) => console.log(e.detail.change, e.detail.flags));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TeamFlagEditor, type TeamFlag } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FlagSettings() {
  const [flags, setFlags] = useState<TeamFlag[]>([{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }]);
  return <TeamFlagEditor flags={flags} usage={{ review: 12 }} onFlagsChange={(next) => setFlags(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/team-flag-editor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";

defineProps<{ flags: TcTeamFlagEditor["flags"]; usage: TcTeamFlagEditor["usage"] }>();
const onFlagsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-team-flag-editor :flags="flags" :usage="usage" @tc-flags-change="onFlagsChange"></tc-team-flag-editor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TeamFlagEditor } from "@adamstavely/trenchcoat/angular/team-flag-editor";
import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";

@Component({
  selector: "app-team-flag-editor-example",
  imports: [TeamFlagEditor],
  template: `<tc-team-flag-editor [flags]="flags()" [usage]="usage()" (tc-flags-change)="onFlagsChange($event)"></tc-team-flag-editor>`,
})
export class TeamFlagEditorExample {
  readonly flags = input.required<TcTeamFlagEditor["flags"]>();
  readonly usage = input.required<TcTeamFlagEditor["usage"]>();
  onFlagsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-flag-editor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";

  let { flags, usage }: { flags: TcTeamFlagEditor["flags"]; usage: TcTeamFlagEditor["usage"] } = $props();
  let el: TcTeamFlagEditor;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-flags-change", on);
    return () => el.removeEventListener("tc-flags-change", on);
  });
</script>

<tc-team-flag-editor bind:this={el} {flags} {usage}></tc-team-flag-editor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Team flags"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `flags` | – | `TeamFlag[]` | `[]` | The team's flags, in the order they're offered. Changed by the user unless a tc-flags-change listener calls preventDefault() |
| `usage` | – | `Record<string, number>` | `{}` | How many files each flag is on, by id |
| `palette` | – | `string[]` | `["#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0D9488", "#2563EB", "#7C3AED", "#DB2777"]` | The colours offered as swatches |
| `readonly` | `readonly` | `boolean` | `false` | Show the flags and what they mean without letting them change |
| `labels` | – | `Partial<TeamFlagEditorLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-flags-change` | – | Yes | A flag was added, edited, removed or moved ({ flags, change, flag }: TeamFlagsChange); cancelable – prevented, `flags` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tfe-swatch-size` | `24px` | both |

#### Design tokens it reads (51)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tfe-swatch`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultTeamFlagPalette: array` | The swatches when `palette` isn't set: eight hues that stay apart from each other |

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
| `flags` | `el.flags = …;` | `<… flags={…} />` | `<tc-team-flag-editor :flags="…">` | `<tc-team-flag-editor [flags]="…">` | `<tc-team-flag-editor {flags}>` |
| `usage` | `el.usage = …;` | `<… usage={…} />` | `<tc-team-flag-editor :usage="…">` | `<tc-team-flag-editor [usage]="…">` | `<tc-team-flag-editor {usage}>` |
| `palette` | `el.palette = …;` | `<… palette={…} />` | `<tc-team-flag-editor :palette="…">` | `<tc-team-flag-editor [palette]="…">` | `<tc-team-flag-editor {palette}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-team-flag-editor :labels="…">` | `<tc-team-flag-editor [labels]="…">` | `<tc-team-flag-editor {labels}>` |

*Also attributes: `heading`, `description`, `readonly` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-flags-change` | Yes | `el.addEventListener("tc-flags-change", (e) => …)` | `onFlagsChange={…}` | `@tc-flags-change="…"` | `(tc-flags-change)="…($event)"` | `el.addEventListener("tc-flags-change", …)` |

### Controlled

The element changes `flags` itself unless a listener calls `preventDefault()` on `tc-flags-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-team-flag-editor id="team-flag-editor"></tc-team-flag-editor>

<script type="module">
  import "@adamstavely/trenchcoat/team-flag-editor";

  const el = document.querySelector("#team-flag-editor");
  el.addEventListener("tc-flags-change", (e) => {
    e.preventDefault(); // the element keeps its flags…
    if (allowed(e.detail.flags)) el.flags = e.detail.flags; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TeamFlagEditor } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TeamFlagEditor>;
type Props = Omit<Own, "flags" | "onFlagsChange"> & { initial: NonNullable<Own["flags"]> };

// Controlled: passing flags makes the wrapper prevent the element's own change; the app sets it
export function ControlledTeamFlagEditor({ initial, ...props }: Props) {
  const [flags, setFlags] = useState<Own["flags"]>(initial);
  return <TeamFlagEditor {...props} flags={flags} onFlagsChange={(next) => setFlags(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/team-flag-editor";
import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";

const props = defineProps<{ initial: TcTeamFlagEditor["flags"] }>();
const flags = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFlagsChange = (e: CustomEvent<{ flags: TcTeamFlagEditor["flags"] }>) => {
  e.preventDefault();
  flags.value = e.detail.flags;
};
</script>

<template>
  <tc-team-flag-editor :flags="flags" @tc-flags-change="onFlagsChange"></tc-team-flag-editor>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TeamFlagEditor } from "@adamstavely/trenchcoat/angular/team-flag-editor";
import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";

@Component({
  selector: "app-controlled-team-flag-editor",
  imports: [TeamFlagEditor],
  template: `<tc-team-flag-editor [flags]="flags()" (tc-flags-change)="onFlagsChange($event)"></tc-team-flag-editor>`,
})
export class ControlledTeamFlagEditor {
  readonly initial = input.required<TcTeamFlagEditor["flags"]>();
  readonly flags = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFlagsChange(e: CustomEvent<{ flags: TcTeamFlagEditor["flags"] }>) {
    e.preventDefault();
    this.flags.set(e.detail.flags);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-flag-editor";
  import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";

  let { initial }: { initial: TcTeamFlagEditor["flags"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let flags = $derived(initial);
  let el: TcTeamFlagEditor;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      flags = (e as CustomEvent<{ flags: TcTeamFlagEditor["flags"] }>).detail.flags;
    };
    el.addEventListener("tc-flags-change", on);
    return () => el.removeEventListener("tc-flags-change", on);
  });
</script>

<tc-team-flag-editor bind:this={el} {flags}></tc-team-flag-editor>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-team-flag-editor")` returns a `TcTeamFlagEditor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";`
- **React / Next.js:** Props: `import type { TeamFlagEditorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TeamFlagEditor>`. The element class, for refs: `import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTeamFlagEditor["flags"]` with `import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";`
- **Angular:** The directive types the template: `[flags]` takes `TcTeamFlagEditor["flags"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTeamFlagEditor } from "@adamstavely/trenchcoat/team-flag-editor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Team flags" |
| `flags` | `TeamFlag[]` | The team's flags – controlled when given |
| `defaultFlags` | `TeamFlag[]` | The flags on mount when `flags` isn't controlled |
| `onFlagsChange` | `(flags: TeamFlag[], detail: TeamFlagsChange) => void` | A flag was added, edited, removed or moved |

*Renamed or hidden on the wrapper: `heading`, `flags`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the fields, swatches and buttons |
| ← → ↑ ↓ | Move through a flag's colours, choosing as they go |
| Home / End | Choose the first or last colour |
| Enter in Name | Commits the name |

### Screen readers

The flags are a list named by the heading. Each flag's colours are a `radiogroup` with one tab stop, and each button's
name includes the flag it acts on. A refused name is tied to its field with `aria-invalid` and `aria-describedby`.
`role="status"` announces adding, removing and moving.

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
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/team-flag, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-31 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 19.3 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/list-motion` · Shared Trenchcoat code | 1.7 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/team-flag` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **29.1 KB** | **9.1 KB** |
| With Lit – the first component on a page | 52.1 KB | 16.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 118 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of palette replaced |
| First on the page | 8.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.5 ms | palette: first render, 394 nodes; update 0.7 ms |
| 1,000 items | 17 ms | palette: first render, 3,094 nodes; update 5.4 ms |

1,000 items of palette: 17 ms, 3,094 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Write a meaning as when to use the flag: "A second auditor should read this before it's relied on", not "Review". Names
must be unique, because the name is what tells two flags apart for anyone who can't see the colour. Two flags may share
a colour, but the editor points it out.

## Do and don't

### Do

- Pass `usage`, so nobody removes a flag without knowing how many files carry it.
- Save on `tc-flags-change`, and call `preventDefault()` if the save is refused.
- Use `readonly` for people who can't edit the flags.

### Don't

- Don't reuse an id for a different flag. Files store the id, so they'd change meaning without anyone noticing.

## Related

- [Team Flag Picker](team-flag-picker.md) – Picks one of a team's flags for a file – a small button with the flag's colour and name, opening a list of flags with what each one means.
- [Color Picker](color-picker.md) – Pick a colour – a saturation and brightness square, hue and opacity sliders, HEX / RGB / CMYK fields that convert as you type, an eyedropper where the browser has one, swatches, Copy, and the previous colour one press away
- [Tag Input](tag-input.md) – A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal
- [To-do List](todo-list.md) – A to-do list people keep themselves – add, tick off, edit in place, move with Alt + arrows and remove with Undo, with All / To do / Done tabs, progress and Clear done

## Changelog

- **Team Flag Editor** (`tc-team-flag-editor`) – where a team sets each flag's colour, name, meaning and order, and asks first before removing a flag that's on files. `readonly` shows the flags to people who can't change them.
