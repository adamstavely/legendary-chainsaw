<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Team Flag Picker

**Inputs & controls** · New

Picks one of a team's flags for a file – a small button with the flag's colour and name, opening a list of flags with what each one means.

- **Element:** `<tc-team-flag-picker>`
- **Size:** 9.0 KB gzip · 26.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/team-flag-picker";` |
| React / Next.js | `import { TeamFlagPicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/team-flag-picker";` · tags starting with tc- are custom elements |
| Angular | `import { TeamFlagPicker } from "@adamstavely/trenchcoat/angular/team-flag-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/team-flag-picker";` |

## Example

The live example is in the gallery at `#/team-flag-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Picks one of a team's flags for a file. A small button shows the flag's colour and name, and opens a list of the team's
flags with what each one means, so people choose by meaning and not by remembering what orange stands for. The team
defines the flags in `team-flag-editor`.

### When to use

- A file, document or record that carries one shared, team-defined marker.
- A table or list of files, with one picker in each row.

### When not to use

- Several free-text labels on one item – use [Tag Input](tag-input.md).
- Defining the flags – use [Team Flag Editor](team-flag-editor.md).
- A long list of values to search – use [Combobox](combobox.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Button** `.ui-tfp__trigger` – the flag's colour and name
2. **Popover** `.ui-tfp__pop` – what opens from it
3. **List** `.ui-tfp__list` – No flag, then the team's flags
4. **Option** `.ui-tfp__option` – a flag's name and `.ui-tfp__meaning`, with `.ui-tfp__check` on the current one
5. **Manage** `.ui-tfp__manage` – the link to the team's flags, with `manageable`

## Looks

The same control in Standard and Clean, drawn from the shared secondary-button and menu tokens. A page can set
`--tc-tfp-list-width`.

## Usage

### HTML

```html
<tc-team-flag-picker id="flag" file-name="Q3 audit.pdf" value="review"></tc-team-flag-picker>

<script type="module">
  import "@adamstavely/trenchcoat/team-flag-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const picker = document.querySelector("#flag");
  picker.flags = [{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }];
  picker.addEventListener("tc-value-change", (e) => console.log(e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { TeamFlagPicker, type TeamFlag } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const flags: TeamFlag[] = [{ id: "review", label: "Needs review", meaning: "A second auditor should read this.", color: "#CA8A04" }];

export function FileFlag() {
  const [value, setValue] = useState<string | null>("review");
  return <TeamFlagPicker flags={flags} value={value} fileName="Q3 audit.pdf" onValueChange={(next) => setValue(next)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/team-flag-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";

defineProps<{ flags: TcTeamFlagPicker["flags"]; labels: TcTeamFlagPicker["labels"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-team-flag-picker :flags="flags" :labels="labels" @tc-value-change="onValueChange"></tc-team-flag-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TeamFlagPicker } from "@adamstavely/trenchcoat/angular/team-flag-picker";
import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";

@Component({
  selector: "app-team-flag-picker-example",
  imports: [TeamFlagPicker],
  template: `<tc-team-flag-picker [flags]="flags()" [labels]="labels()" (tc-value-change)="onValueChange($event)"></tc-team-flag-picker>`,
})
export class TeamFlagPickerExample {
  readonly flags = input.required<TcTeamFlagPicker["flags"]>();
  readonly labels = input.required<TcTeamFlagPicker["labels"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-flag-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";

  let { flags, labels }: { flags: TcTeamFlagPicker["flags"]; labels: TcTeamFlagPicker["labels"] } = $props();
  let el: TcTeamFlagPicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-team-flag-picker bind:this={el} {flags} {labels}></tc-team-flag-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `flags` | – | `TeamFlag[]` | `[]` | The team's flags, in the order they're offered |
| `value` | `value` | `string \| null` | `null` | The id of the file's flag, or null for none. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `fileName` | `file-name` | `string` | `""` | The file's name, so the control says which file it's for |
| `manageable` | `manageable` | `boolean` | `false` | Show a link to the team's flags at the foot of the list, for people who may edit them |
| `disabled` | `disabled` | `boolean` | `false` | Show the flag without letting it change |
| `labels` | – | `Partial<TeamFlagPickerLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A flag was picked or cleared ({ value, flag }: TeamFlagValueChange); cancelable – prevented, `value` stays as it was |
| `tc-manage` | – | No | Manage team flags was pressed (detail: null) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-tfp-list-width` | `300px` | both |
| `--tc-icon-size-md` | `16px` | not set – this fallback applies |

#### Design tokens it reads (26)

`--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-4`, `--tc-text-primary`, `--tc-text-secondary`

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
| `flags` | `el.flags = …;` | `<… flags={…} />` | `<tc-team-flag-picker :flags="…">` | `<tc-team-flag-picker [flags]="…">` | `<tc-team-flag-picker {flags}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-team-flag-picker :labels="…">` | `<tc-team-flag-picker [labels]="…">` | `<tc-team-flag-picker {labels}>` |

*Also attributes: `value`, `file-name`, `manageable`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-manage` | No | `el.addEventListener("tc-manage", (e) => …)` | `onTcManage={…}` | `@tc-manage="…"` | `(tc-manage)="…($event)"` | `el.addEventListener("tc-manage", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-team-flag-picker id="team-flag-picker"></tc-team-flag-picker>

<script type="module">
  import "@adamstavely/trenchcoat/team-flag-picker";

  const el = document.querySelector("#team-flag-picker");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TeamFlagPicker } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TeamFlagPicker>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledTeamFlagPicker({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <TeamFlagPicker {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/team-flag-picker";
import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";

const props = defineProps<{ initial: TcTeamFlagPicker["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcTeamFlagPicker["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-team-flag-picker :value="value" @tc-value-change="onValueChange"></tc-team-flag-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TeamFlagPicker } from "@adamstavely/trenchcoat/angular/team-flag-picker";
import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";

@Component({
  selector: "app-controlled-team-flag-picker",
  imports: [TeamFlagPicker],
  template: `<tc-team-flag-picker [value]="value()" (tc-value-change)="onValueChange($event)"></tc-team-flag-picker>`,
})
export class ControlledTeamFlagPicker {
  readonly initial = input.required<TcTeamFlagPicker["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcTeamFlagPicker["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-flag-picker";
  import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";

  let { initial }: { initial: TcTeamFlagPicker["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcTeamFlagPicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcTeamFlagPicker["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-team-flag-picker bind:this={el} {value}></tc-team-flag-picker>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-team-flag-picker :value="value" @tc-value-change="value = $event.detail.value"></tc-team-flag-picker>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-team-flag-picker [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-team-flag-picker>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-team-flag-picker bind:this={el} {value}></tc-team-flag-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-team-flag-picker")` returns a `TcTeamFlagPicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";`
- **React / Next.js:** Props: `import type { TeamFlagPickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TeamFlagPicker>`. The element class, for refs: `import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTeamFlagPicker["flags"]` with `import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";`
- **Angular:** The directive types the template: `[flags]` takes `TcTeamFlagPicker["flags"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTeamFlagPicker } from "@adamstavely/trenchcoat/team-flag-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string \| null` | The id of the file's flag, or null for none – controlled when given |
| `defaultValue` | `string \| null` | The flag on mount when `value` isn't controlled |
| `onValueChange` | `(value: string \| null, flag: TeamFlag \| null) => void` | A flag was picked or cleared |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the button | Opens the list, on the current flag |
| ↑ ↓ | Move through the list |
| Home / End | Go to the first or last option |
| Enter / Space on an option | Picks it and closes the list |
| Escape | Closes the list and returns to the button |

### Screen readers

The button names the flag and the file, and says it opens a dialog holding a `listbox` named for that file. Each option
is an `option` with `aria-selected`. Colour is decorative: the name always says which flag it is, and `role="status"`
announces a pick.

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
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, internal/team-flag, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 10.2 KB | 4.0 KB |
| Lit · the library every element is built on, the parts it uses | 19.6 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/team-flag` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **26.2 KB** | **9.0 KB** |
| With Lit – the first component on a page | 46.9 KB | 15.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.5 ms** | the gallery demo's data, 7 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of flags replaced |
| First on the page | 8.9 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.7 ms | flags: first render, 7 nodes; update 0.2 ms |
| 1,000 items | 0.5 ms | flags: first render, 7 nodes; update 0.2 ms |

What it renders doesn't grow with flags (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Pass the same `flags` to every picker on a page. A file whose flag has been removed shows "Removed flag" with an empty
flag, and keeps its value until someone picks again, so your data isn't changed without anyone choosing to.

## Do and don't

### Do

- Give `file-name`, so a row of pickers can be told apart by ear.
- Set `manageable` only for people who may edit the team's flags, and open the editor on `tc-manage`.

### Don't

- Don't use colour alone to show a flag elsewhere on the page. Show its name too.

## Related

- [Team Flag Editor](team-flag-editor.md) – Where a team decides what its flags mean – each flag's colour, name, meaning and order, with a check on names and a question before removing a flag that's on files.
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Tag Input](tag-input.md) – A field of free-text chips: add with Enter, a comma or Tab, or paste several at once, with suggestions, a limit, no duplicates, your own validation with the reason shown, and keyboard removal
- [File Summary](file-summary.md) – What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file

## Changelog

- **Team Flag Picker** (`tc-team-flag-picker`) – picks one of those flags for a file, with what each one means in the list, and says when a file's flag has since been removed.
