<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Smart Recommendation

**AI & chat**

Suggestion card with a confidence signal, alternatives to switch to and accept with undo

- **Element:** `<tc-smart-recommendation>`
- **Size:** 10.0 KB gzip · 40.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/smart-recommendation";` |
| React / Next.js | `import { SmartRecommendation } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/smart-recommendation";` · tags starting with tc- are custom elements |
| Angular | `import { SmartRecommendation } from "@adamstavely/trenchcoat/angular/smart-recommendation";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/smart-recommendation";` |

## Example

The live example is in the gallery at `#/smart-recommendation`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A card that suggests one course of action and says why, with a signal for how sure the suggestion is. People can
accept it in one click, open the alternatives and switch to one of them instead, or fold the reason away. An
accepted suggestion can be undone, and acceptance can wait on the app – the button stays busy until the change is
made, and says so if it fails.

### When to use

- A product can suggest a setting or a plan with a reason – “sync only the changes”, “use the smaller model”.
- There are a few sensible alternatives, and people should see the recommended one first.
- Accepting changes something real and should be easy to take back.

### When not to use

- An agent asking permission for an action it's about to take – use [Approval Card](approval-card.md).
- Choosing a model from a full list, with no single recommendation – use [Model Picker](model-picker.md).
- Passive advice and how-tos with nothing to accept – use [Tips Panel](tips-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.tc-head` – the icon and heading, with the button that folds the reason away
2. **Reason** `.ui-sr__reason` – one sentence on why
3. **Signal** `.ui-sr__signal` – how sure the suggestion is, from “No signal” to “Strong signal”
4. **Alternatives** `.ui-sr__alt` – a menu of every option, the recommendation first
5. **Accept** `.ui-sr__btn--primary` – accepts the option on show; Undo takes its place

## Looks

Standard sets the head and reason in a white card on a gray tray, with the signal and the buttons on the tray below.
Clean is one white card with hairline shadows: a solid blue sparkle as the mark, the signal and the buttons as the
card's last row under a hairline, and thin icons on Alternatives and Undo.

## Usage

### HTML

```html
<tc-smart-recommendation id="sync" heading="Recommended"></tc-smart-recommendation>

<script type="module">
  import "@adamstavely/trenchcoat/smart-recommendation";
  import "@adamstavely/trenchcoat/tokens.css";

  const card = document.querySelector("#sync");
  card.options = [
    { id: "incremental", label: "Incremental sync", reason: "Only 3% of your rows changed last week.", signal: 3 },
    { id: "nightly", label: "Nightly full sync", reason: "Simpler, but each run reloads every row.", signal: 2 },
  ];
  card.acceptOption = (option) => fetch(`/api/sync/${option.id}`, { method: "POST" });
  card.addEventListener("tc-accepted-change", (e) => console.log(e.detail.accepted));
</script>
```

### React / Next.js

```tsx
import { SmartRecommendation, type Recommendation } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const options: Recommendation[] = [
  { id: "incremental", label: "Incremental sync", reason: "Only 3% of your rows changed last week.", signal: 3 },
  { id: "nightly", label: "Nightly full sync", reason: "Simpler, but each run reloads every row.", signal: 2 },
];

export function SyncAdvice({ apply, revert }: { apply: (id: string) => Promise<void>; revert: (id: string) => Promise<void> }) {
  return <SmartRecommendation title="Recommended" options={options} onAccept={(o) => apply(o.id)} onUndo={(o) => revert(o.id)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/smart-recommendation";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";

defineProps<{ options: TcSmartRecommendation["options"]; accepted: TcSmartRecommendation["accepted"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-smart-recommendation :options="options" :accepted="accepted" @tc-value-change="onValueChange"></tc-smart-recommendation>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SmartRecommendation } from "@adamstavely/trenchcoat/angular/smart-recommendation";
import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";

@Component({
  selector: "app-smart-recommendation-example",
  imports: [SmartRecommendation],
  template: `<tc-smart-recommendation [options]="options()" [accepted]="accepted()" (tc-value-change)="onValueChange($event)"></tc-smart-recommendation>`,
})
export class SmartRecommendationExample {
  readonly options = input.required<TcSmartRecommendation["options"]>();
  readonly accepted = input.required<TcSmartRecommendation["accepted"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/smart-recommendation";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";

  let { options, accepted }: { options: TcSmartRecommendation["options"]; accepted: TcSmartRecommendation["accepted"] } = $props();
  let el: TcSmartRecommendation;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-smart-recommendation bind:this={el} {options} {accepted}></tc-smart-recommendation>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Smart recommendation"` | The heading, and the region's name |
| `options` | – | `Recommendation[]` | `[]` | The first entry is the recommendation, the rest are offered as alternatives. A new set starts over |
| `value` | `value` | `string` | `""` | Id of the option on show; empty shows the recommendation |
| `accepted` | – | `string \| null` | `null` | Id of the accepted option, or null |
| `open` | `open` | `boolean` | `true` | Whether the reason is unfolded |
| `acceptOption` | – | `RecommendationAction \| undefined` | `undefined` | Called to accept an option; a returned promise keeps the button pending, a rejection says so |
| `undoOption` | – | `RecommendationAction \| undefined` | `undefined` | Called to take an acceptance back, like acceptOption |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | An option was picked from the Alternatives menu, or a new set of options went back to the recommendation ({ value: string, reset: boolean }); cancelable |
| `tc-accepted-change` | – | Yes | An option was accepted, or the acceptance taken back ({ accepted: string \| null, reset: boolean }); cancelable |
| `tc-open-change` | – | Yes | The reason was folded or unfolded ({ open: boolean }); cancelable |

#### Design tokens it reads (93)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-active`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-strong`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-slow`, `--tc-ease-decelerate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-dropdown`

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
| `options` | `el.options = …;` | `<… options={…} />` | `<tc-smart-recommendation :options="…">` | `<tc-smart-recommendation [options]="…">` | `<tc-smart-recommendation {options}>` |
| `accepted` | `el.accepted = …;` | `<… accepted={…} />` | `<tc-smart-recommendation :accepted="…">` | `<tc-smart-recommendation [accepted]="…">` | `<tc-smart-recommendation {accepted}>` |
| `acceptOption` | `el.acceptOption = …;` | `<… acceptOption={…} />` | `<tc-smart-recommendation :acceptOption="…">` | `<tc-smart-recommendation [acceptOption]="…">` | `<tc-smart-recommendation {acceptOption}>` |
| `undoOption` | `el.undoOption = …;` | `<… undoOption={…} />` | `<tc-smart-recommendation :undoOption="…">` | `<tc-smart-recommendation [undoOption]="…">` | `<tc-smart-recommendation {undoOption}>` |

*Also attributes: `heading`, `value`, `open` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `ref.current.addEventListener("tc-value-change", …)` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-accepted-change` | Yes | `el.addEventListener("tc-accepted-change", (e) => …)` | `ref.current.addEventListener("tc-accepted-change", …)` | `@tc-accepted-change="…"` | `(tc-accepted-change)="…($event)"` | `el.addEventListener("tc-accepted-change", …)` |
| `tc-open-change` | Yes | `el.addEventListener("tc-open-change", (e) => …)` | `ref.current.addEventListener("tc-open-change", …)` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value`, `accepted` and `open` itself unless a listener calls `preventDefault()` on `tc-value-change`, `tc-accepted-change` or `tc-open-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-smart-recommendation id="smart-recommendation"></tc-smart-recommendation>

<script type="module">
  import "@adamstavely/trenchcoat/smart-recommendation";

  const el = document.querySelector("#smart-recommendation");
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
import "@adamstavely/trenchcoat/smart-recommendation";
import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";

const props = defineProps<{ initial: TcSmartRecommendation["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcSmartRecommendation["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-smart-recommendation :value="value" @tc-value-change="onValueChange"></tc-smart-recommendation>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SmartRecommendation } from "@adamstavely/trenchcoat/angular/smart-recommendation";
import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";

@Component({
  selector: "app-controlled-smart-recommendation",
  imports: [SmartRecommendation],
  template: `<tc-smart-recommendation [value]="value()" (tc-value-change)="onValueChange($event)"></tc-smart-recommendation>`,
})
export class ControlledSmartRecommendation {
  readonly initial = input.required<TcSmartRecommendation["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcSmartRecommendation["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/smart-recommendation";
  import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";

  let { initial }: { initial: TcSmartRecommendation["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcSmartRecommendation;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcSmartRecommendation["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-smart-recommendation bind:this={el} {value}></tc-smart-recommendation>
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
<tc-smart-recommendation :value="value" @tc-value-change="value = $event.detail.value"></tc-smart-recommendation>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-smart-recommendation [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-smart-recommendation>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-smart-recommendation bind:this={el} {value}></tc-smart-recommendation>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-smart-recommendation")` returns a `TcSmartRecommendation` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";`
- **React / Next.js:** Props: `import type { SmartRecommendationProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SmartRecommendation>`. The element class, for refs: `import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSmartRecommendation["options"]` with `import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";`
- **Angular:** The directive types the template: `[options]` takes `TcSmartRecommendation["options"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSmartRecommendation } from "@adamstavely/trenchcoat/smart-recommendation";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name – "Smart recommendation" by default |
| `options` | `Recommendation[]` | First entry is the recommendation, the rest are offered as alternatives. A new set of options starts over (uncontrolled choice and acceptance go back to the recommendation); an empty list shows the card with nothing to accept |
| `value` | `string` | Id of the option on show (controlled when defined) – the recommendation or an alternative |
| `defaultValue` | `string` | The option on show at first when uncontrolled – defaults to the recommendation |
| `onValueChange` | `(id: string) => void` | Called when an alternative (or the recommendation again) is picked from the menu |
| `accepted` | `string \| null` | Id of the accepted option, or null (controlled when defined). onAccept / onUndo report the changes |
| `defaultAccepted` | `string \| null` | The accepted option at first when uncontrolled – null by default |
| `onAccept` | `(option: Recommendation) => void \| Promise<unknown>` | Accepts the option. Return a promise to keep the button pending until it settles: the option counts as accepted once it resolves, and a rejection says so and lets you try again |
| `onUndo` | `(option: Recommendation) => void \| Promise<unknown>` | Takes the acceptance back – may return a promise, like onAccept |
| `open` | `boolean` | Whether the reason is unfolded (controlled when defined) |
| `defaultOpen` | `boolean` | Whether the reason starts unfolded when uncontrolled – true by default |
| `onOpenChange` | `(open: boolean) => void` | Called when the reason is folded or unfolded |

*Renamed or hidden on the wrapper: `heading`, `options`, `value`, `accepted`, `open`, `acceptOption`, `undoOption`, `defaultValue`*

## Accessibility

Follows the WAI-ARIA [Menu button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

### Keyboard

| Key | What it does |
|---|---|
| Enter / Space | On the head: folds or unfolds the reason. On Alternatives: opens or closes the menu |
| ↓ / ↑ on Alternatives | Opens the menu on the option that's on show |
| ↓ / ↑ in the menu | Moves to the next or previous option, wrapping at the ends |
| Home / End | Moves to the first or last option |
| Enter / Space in the menu | Shows that option, closes the menu and unfolds the reason |
| Escape | Closes the menu and returns focus to Alternatives |
| Tab | Closes the menu and moves on |

### Screen readers

The card is a region named by its heading unless the page names it. The head is a button with `aria-expanded`;
a folded reason is inert. The signal is text (“Strong signal”). Alternatives is a menu button
(`aria-haspopup="menu"`, `aria-expanded`); the menu, “Alternatives”, holds `menuitemradio` options read with their
signal (“Nightly full sync, Good signal”), the recommendation tagged “Recommended” and the one on show checked. The
Accept and Undo buttons are `aria-busy` and `aria-disabled` while the app works. After accepting, a status reads
“Incremental sync accepted”; a failure is an alert – “Couldn't accept it. Try again.” or “Couldn't undo. Try again.”

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
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ARIA reflection (element.ariaBusy…) | 81 | 119 | 12.1 | 12.1 | itself | States such as busy and disabled reach screen readers. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 31.5 KB | 7.5 KB |
| Lit · the library every element is built on, the parts it uses | 19.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| **Added to a page that already has Lit** | **40.0 KB** | **10.0 KB** |
| With Lit – the first component on a page | 60.2 KB | 16.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 28 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of options replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.8 ms | options: first render, 28 nodes; update 0.5 ms |
| 1,000 items | 1.8 ms | options: first render, 28 nodes; update 0.5 ms |

What it renders doesn't grow with options (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 1 React commits (clean), 1 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `window pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Keep `label` short – it goes into the button as “Accept incremental sync”, lower-cased.
- Make the reason one sentence with the number that matters: “Only 3% of your 1.2M rows changed last week”.
- In each alternative's reason, say its trade-off honestly – what it costs compared with the recommendation.
- Set `signal` from real evidence; use 0 (“No signal”) rather than guess.

## Do and don't

### Do

- Put the recommendation first in `options`; the rest are offered as alternatives in that order.
- Return a promise from `onAccept` (`acceptOption`) when applying takes a request, so the button waits.
- Pass `onUndo` (`undoOption`) whenever an acceptance can be reversed.

### Don't

- Don't offer more than a handful of alternatives – a long menu means there's no clear recommendation.
- Don't accept on the person's behalf – the card is for a suggestion they act on.
- Don't use the heading for the suggestion itself; the label and reason carry it.

## Related

- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Tips Panel](tips-panel.md) – Grid of short tips with one action each – taken tips turn into a done state
