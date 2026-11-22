<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Assignee Picker

**Inputs & controls** · New

Assign a case or task to a person, a team or a team's round-robin – a chip that opens a search with Assign to me, each person's open items and a load bar against their capacity, Away and Over capacity in words, and Unassign

- **Element:** `<tc-assignee-picker>`
- **Size:** 11.2 KB gzip · 34.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/assignee-picker";` |
| React / Next.js | `import { AssigneePicker } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/assignee-picker";` · tags starting with tc- are custom elements |
| Angular | `import { AssigneePicker } from "@adamstavely/trenchcoat/angular/assignee-picker";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/assignee-picker";` |

## Example

The live example is in the gallery at `#/assignee-picker`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Who owns a case or a task: a person, a team, or the next person in a team's round-robin. A chip shows the assignee – their initials and name, a team mark, or Unassigned – and opens a search over everyone who can take it.

Assign to me comes first when the page gives `me`. People follow, each with their team, how much they already have ("7 open") and a small load bar against what they can carry (`capacity`); someone away says Away, and anyone over capacity sorts after the rest and says Over capacity – in words, not only colour. Teams come next, with their members and open items, and a team that takes turns offers Round-robin under it ("next in Fraud review"). Unassign is last when someone has it.

`value` is `{ type: "person" | "team" | "round-robin", id }` or null. It's the element's own unless a `tc-value-change` listener prevents it – the page saves the change.

### When to use

- Setting the owner of a case, ticket or task – in a row, a detail header or a side panel.
- Teams that balance work by load, or hand it out in turn.

### When not to use

- Tagging people in text – use [Mention Picker](mention-picker.md).
- Choosing from a list that isn't people – use [Combobox](combobox.md).
- Handing tasks to agents – use [Delegate Board](delegate-board.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Chip** `.ui-asg__trigger` – `.ui-asg__avatar` (initials, a team mark, or an empty ring) and `.ui-asg__current`, with `.ui-asg__chevron`
2. **Popover** `.ui-asg__pop` – `.ui-asg__search` with `.ui-asg__search-input`, and `.ui-asg__list`
3. **Groups** `.ui-asg__group` – Assign to me, People and Teams under `.ui-asg__group-title`, and Unassign
4. **Option** `.ui-asg__option` – `.ui-asg__avatar`, `.ui-asg__name` and `.ui-asg__meta`, then `.ui-asg__load` and `.ui-asg__flag` (Away, Over capacity), and `.ui-asg__check` on the current assignee

## Looks

The chip is a pill: on the gray tray in Standard, white with a hairline in Clean. The list opens on the menu surface in both, in the top layer under the chip – flipped above it when there's no room below – so a table cell or a scrolling card never clips it. `--tc-asg-pop-w` sets the list's width and `--tc-asg-load-w` the load bar's.

## Usage

### HTML

```html
<tc-assignee-picker id="owner" me="noor"></tc-assignee-picker>

<script type="module">
  import "@adamstavely/trenchcoat/assignee-picker";
  import "@adamstavely/trenchcoat/tokens.css";

  const owner = document.querySelector("#owner");
  owner.people = [
    { id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 },
    { id: "tomas", name: "Tomas Lind", team: "Fraud review", open: 11, capacity: 12 },
  ];
  owner.teams = [{ id: "fraud", name: "Fraud review", members: 2, open: 18, roundRobin: true }];
  owner.addEventListener("tc-value-change", (e) => console.log("Assigned", e.detail.value));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AssigneePicker, type AssigneeValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CaseOwner() {
  const [value, setValue] = useState<AssigneeValue | null>({ type: "person", id: "tomas" });
  return (
    <AssigneePicker
      me="noor"
      people={[
        { id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 },
        { id: "tomas", name: "Tomas Lind", team: "Fraud review", open: 11, capacity: 12 },
      ]}
      teams={[{ id: "fraud", name: "Fraud review", members: 2, open: 18, roundRobin: true }]}
      value={value}
      onValueChange={setValue}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/assignee-picker";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";

defineProps<{ people: TcAssigneePicker["people"]; teams: TcAssigneePicker["teams"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-assignee-picker :people="people" :teams="teams" @tc-value-change="onValueChange"></tc-assignee-picker>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AssigneePicker } from "@adamstavely/trenchcoat/angular/assignee-picker";
import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";

@Component({
  selector: "app-assignee-picker-example",
  imports: [AssigneePicker],
  template: `<tc-assignee-picker [people]="people()" [teams]="teams()" (tc-value-change)="onValueChange($event)"></tc-assignee-picker>`,
})
export class AssigneePickerExample {
  readonly people = input.required<TcAssigneePicker["people"]>();
  readonly teams = input.required<TcAssigneePicker["teams"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/assignee-picker";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";

  let { people, teams }: { people: TcAssigneePicker["people"]; teams: TcAssigneePicker["teams"] } = $props();
  let el: TcAssigneePicker;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-assignee-picker bind:this={el} {people} {teams}></tc-assignee-picker>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `people` | – | `AssigneePerson[]` | `[]` | The people who can be assigned |
| `teams` | – | `AssigneeTeam[]` | `[]` | The teams that can be assigned |
| `me` | `me` | `string \| undefined` | `undefined` | The reader's own person id – offers Assign to me |
| `value` | – | `AssigneeValue \| null` | `null` | Who has it: a person, a team or a team's round-robin, or null. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `label` | `label` | `string \| undefined` | `undefined` | The chip's name before the assignee (default "Assignee") |
| `disabled` | `disabled` | `boolean` | `false` | Can't be changed |
| `labels` | – | `Partial<AssigneePickerLabels>` | `{}` | Rename any of the words, over the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An assignee was picked, or Unassign ({ value }: AssigneePickerValueChange); cancelable – prevented, `value` stays as it was |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-asg-avatar` | `var(--tc-space-5)` | both |
| `--tc-asg-pop-w` | `calc(var(--tc-space-16) * 5)` | both |
| `--tc-asg-load-w` | `var(--tc-space-10)` | both |

#### Design tokens it reads (43)

`--tc-accent-text`, `--tc-border-default`, `--tc-border-strong`, `--tc-control-h-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-shadow`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-snug`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-padding`, `--tc-radius-full`, `--tc-radius-sm`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-16`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `assigneeInitials(name: string): void` | "Noor Haddad" → "NH" |

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
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-assignee-picker :people="…">` | `<tc-assignee-picker [people]="…">` | `<tc-assignee-picker {people}>` |
| `teams` | `el.teams = …;` | `<… teams={…} />` | `<tc-assignee-picker :teams="…">` | `<tc-assignee-picker [teams]="…">` | `<tc-assignee-picker {teams}>` |
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-assignee-picker :value="…">` | `<tc-assignee-picker [value]="…">` | `<tc-assignee-picker {value}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-assignee-picker :labels="…">` | `<tc-assignee-picker [labels]="…">` | `<tc-assignee-picker {labels}>` |

*Also attributes: `me`, `label`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-assignee-picker id="assignee-picker"></tc-assignee-picker>

<script type="module">
  import "@adamstavely/trenchcoat/assignee-picker";

  const el = document.querySelector("#assignee-picker");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
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
import "@adamstavely/trenchcoat/assignee-picker";
import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";

const props = defineProps<{ initial: TcAssigneePicker["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcAssigneePicker["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-assignee-picker :value="value" @tc-value-change="onValueChange"></tc-assignee-picker>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AssigneePicker } from "@adamstavely/trenchcoat/angular/assignee-picker";
import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";

@Component({
  selector: "app-controlled-assignee-picker",
  imports: [AssigneePicker],
  template: `<tc-assignee-picker [value]="value()" (tc-value-change)="onValueChange($event)"></tc-assignee-picker>`,
})
export class ControlledAssigneePicker {
  readonly initial = input.required<TcAssigneePicker["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcAssigneePicker["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/assignee-picker";
  import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";

  let { initial }: { initial: TcAssigneePicker["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcAssigneePicker;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcAssigneePicker["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-assignee-picker bind:this={el} {value}></tc-assignee-picker>
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

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-assignee-picker :value="value" @tc-value-change="value = $event.detail.value"></tc-assignee-picker>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-assignee-picker [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-assignee-picker>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-assignee-picker bind:this={el} {value}></tc-assignee-picker>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-assignee-picker")` returns a `TcAssigneePicker` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";`
- **React / Next.js:** Props: `import type { AssigneePickerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AssigneePicker>`. The element class, for refs: `import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAssigneePicker["people"]` with `import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";`
- **Angular:** The directive types the template: `[people]` takes `TcAssigneePicker["people"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAssigneePicker } from "@adamstavely/trenchcoat/assignee-picker";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `AssigneeValue \| null` | Who has it – controlled when given (null for unassigned) |
| `defaultValue` | `AssigneeValue \| null` | The assignee on mount when `value` isn't controlled |
| `onValueChange` | `(value: AssigneeValue \| null) => void` | An assignee was picked, or Unassign |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `children`*

## Accessibility

Follows the WAI-ARIA [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space on the chip | Open the search |
| Type | Filter people and teams |
| ↑ / ↓ | Move through the options |
| Page Up / Page Down | First or last option |
| Enter | Assign the highlighted option |
| Escape | Close and return to the chip |

### Screen readers

The chip is a button named by the label and the assignee – "Assignee: Noor Haddad" – that says it opens a dialog. The search is a combobox that controls a listbox; focus stays in it while ↑ and ↓ move the highlighted option (`aria-activedescendant`). The options are grouped under People and Teams; each is read with its team or members, its open items, Away and Over capacity. The current assignee is the selected option. A change is announced: "Assigned to Tomas Lind".

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
| inset | 87 | 66 | 14.1 | 14.1 | itself, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-22 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 18.2 KB | 6.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 9.1 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.3 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.0 KB** | **11.2 KB** |
| With Lit – the first component on a page | 53.6 KB | 17.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 8 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of people replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.4 ms | people: first render, 8 nodes; update 0.0 ms |
| 1,000 items | 0.4 ms | people: first render, 8 nodes; update 0.1 ms |

What it renders doesn't grow with people (tested to 1,000 items).

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

- Use people's names as they know them; the team is shown under the name.
- Give `open` and `capacity` from the same source the team works from, so the load bar matches the queue.
- Turn on `roundRobin` only for teams that really hand work out in turn.

## Do and don't

### Do

- Give `me`, so the reader can take something in one step.
- Save the change when `tc-value-change` fires, and prevent it if the save fails.

### Don't

- Don't hide people who are away or over capacity – show them, said in words, so a lead can still choose them.
- Don't use it to pick several people – one item, one owner.

## Related

- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Combobox](combobox.md) – Pick one or many from a searchable, grouped list – chips with avatars, highlighted matches, create-on-the-fly and full keyboard support
- [Delegate Board](delegate-board.md) – Hand work to your agents by dragging it onto them – each agent previews its new “busy until” time, or switch to Auto and every new task goes to whoever is free first
- [Saved Views](saved-views.md) – Saved views as tabs above a list or table – counts, shared and default marks, rename in place, duplicate, share, set as default and delete with a confirmation, and Save changes, Save as new view and Reset when the view on screen has been edited
