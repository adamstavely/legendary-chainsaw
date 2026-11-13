<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Recipe Card

**AI & chat** · New

A recipe ready to cook from – servings that scale every quantity (½, 1⅓), metric or imperial with oven temperatures converted, ingredients to tick off, and numbered steps with the current one marked and timers on the steps that name a time

- **Element:** `<tc-recipe-card>`
- **Size:** 10.0 KB gzip · 33.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/recipe-card";` |
| React / Next.js | `import { RecipeCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/recipe-card";` · tags starting with tc- are custom elements |
| Angular | `import { RecipeCard } from "@adamstavely/trenchcoat/angular/recipe-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/recipe-card";` |

## Example

The live example is in the gallery at `#/recipe-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A recipe an assistant wrote, laid out to cook from. The header has the recipe's name, a line about it and the prep
and cook times. Under it, a servings stepper scales every quantity, and Metric / Imperial converts weights, volumes
and the oven temperatures in the steps. The ingredients are a checklist to tick off while shopping or measuring; the
method is a numbered list with the current step marked. A step that names a time ("Simmer for 15 minutes") gets a
timer with a live countdown, which is announced when it's done.

Quantities are shown as cooks write them – ½, 1⅓, 250 g – and read as words: "1 and 1/3".

### When to use

- The result of a recipe or meal-planning tool in an assistant.
- Any set of steps with quantities to scale and timers to run.

### When not to use

- A plain list of things to do – use [To-do List](todo-list.md).
- Free-form structured data from a model – use [Structured Output](structured-output.md).
- A draft for someone to review and send – use [Email Draft](email-draft.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Times** `.ui-rcpe__times` – prep and cook time, beside the heading
2. **Servings** `.ui-rcpe__servings` – the stepper; quantities scale to it
3. **Units** `.ui-rcpe__units` – Metric or Imperial
4. **Ingredient** `.ui-rcpe__ingredient` – a check box, the scaled quantity, the name and a note
5. **Step** `.ui-rcpe__step` – its number (pick it to make it current) and its words
6. **Timer** `.ui-rcpe__timer` – Start, Pause or Resume, the countdown and Reset

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first
row. Wide, the ingredients sit beside the method; narrow, above it. The current step has a tinted background with an
accent edge and a filled number. Ticked ingredients are struck through in a muted colour.

## Usage

### HTML

```html
<tc-recipe-card heading="Squash and chickpea curry" prep-minutes="15" cook-minutes="40" base-servings="4"></tc-recipe-card>
<script type="module">
  const card = document.querySelector("tc-recipe-card");
  card.ingredients = [
    { quantity: 500, unit: "g", name: "butternut squash", note: "in 2 cm cubes" },
    { quantity: 400, unit: "ml", name: "coconut milk" },
    { name: "salt and pepper" },
  ];
  card.steps = ["Roast the squash at 200°C for 25 minutes.", "Simmer everything for 15 minutes, then season."];
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RecipeCard, type RecipeUnits } from "@adamstavely/trenchcoat/react";

export function Lunch() {
  const [units, setUnits] = useState<RecipeUnits>("metric");
  return (
    <RecipeCard
      title="Squash and chickpea curry"
      baseServings={4}
      defaultServings={6}
      units={units}
      onUnitsChange={setUnits}
      ingredients={[{ quantity: 400, unit: "ml", name: "coconut milk" }]}
      steps={["Simmer for 15 minutes."]}
      onTimerDone={(step) => console.log(`Step ${step + 1} is done`)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/recipe-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";

defineProps<{ ingredients: TcRecipeCard["ingredients"]; steps: TcRecipeCard["steps"] }>();
const onServingsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-recipe-card :ingredients="ingredients" :steps="steps" @tc-servings-change="onServingsChange"></tc-recipe-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RecipeCard } from "@adamstavely/trenchcoat/angular/recipe-card";
import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";

@Component({
  selector: "app-recipe-card-example",
  imports: [RecipeCard],
  template: `<tc-recipe-card [ingredients]="ingredients()" [steps]="steps()" (tc-servings-change)="onServingsChange($event)"></tc-recipe-card>`,
})
export class RecipeCardExample {
  readonly ingredients = input.required<TcRecipeCard["ingredients"]>();
  readonly steps = input.required<TcRecipeCard["steps"]>();
  onServingsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/recipe-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";

  let { ingredients, steps }: { ingredients: TcRecipeCard["ingredients"]; steps: TcRecipeCard["steps"] } = $props();
  let el: TcRecipeCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-servings-change", on);
    return () => el.removeEventListener("tc-servings-change", on);
  });
</script>

<tc-recipe-card bind:this={el} {ingredients} {steps}></tc-recipe-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Recipe"` | The recipe's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line about it, under the name |
| `prepMinutes` | `prep-minutes` | `number \| undefined` | `undefined` | Preparation time in minutes |
| `cookMinutes` | `cook-minutes` | `number \| undefined` | `undefined` | Cooking time in minutes |
| `baseServings` | `base-servings` | `number` | `4` | How many the quantities in `ingredients` serve |
| `servings` | `servings` | `number \| undefined` | `undefined` | How many to cook for – quantities scale to it. Changed by the user unless tc-servings-change is prevented |
| `minServings` | `min-servings` | `number` | `1` | The fewest servings the stepper allows |
| `maxServings` | `max-servings` | `number` | `24` | The most servings the stepper allows |
| `units` | `units` | `RecipeUnits` | `"metric"` | Metric or imperial. Changed by the user unless tc-units-change is prevented |
| `ingredients` | – | `RecipeIngredient[]` | `[]` | The ingredients, with quantities for `baseServings` |
| `steps` | – | `RecipeStep[]` | `[]` | The method, in order. A step that names a time gets a timer |
| `step` | `step` | `number` | `0` | The current step's index. Changed by the user unless tc-step-change is prevented |
| `checked` | – | `string[]` | `[]` | Ingredient ids ticked off |
| `tickMs` | `tick-ms` | `number` | `1000` | How long one second of a timer lasts, in ms – 1000; shorter for tests and demos |
| `labels` | – | `Partial<RecipeLabels>` | `{}` | Words to use instead of the defaults |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-servings-change` | – | Yes | The servings changed ({ servings }: RecipeServingsChange); cancelable – prevented, `servings` stays as it was |
| `tc-units-change` | – | Yes | Metric or imperial changed ({ units }: RecipeUnitsChange); cancelable – prevented, `units` stays as it was |
| `tc-step-change` | – | Yes | The current step changed ({ step }: RecipeStepChange, its index); cancelable – prevented, `step` stays as it was |
| `tc-timer-done` | – | No | A step's timer reached zero ({ step, text }: RecipeTimerDone) |

#### Design tokens it reads (68)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-action-ghost-bg-hover`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-control`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `formatQuantity(n: number): { text: string; spoken: string }` | A quantity as cooks write it – "1⅓", "½" – and as words for screen readers: "1 and 1/3" |
| `convertQuantity(quantity: number, unit: RecipeUnit \| undefined, units: RecipeUnits): [number, RecipeUnit \| undefined]` | A quantity converted to `units`; units that don't convert stay as they are |
| `stepTimer(step: RecipeStep): number \| null` | The timer a step names, in seconds: "Simmer for 20 minutes" → 1200; a range takes its lower end |

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
| `ingredients` | `el.ingredients = …;` | `<… ingredients={…} />` | `<tc-recipe-card :ingredients="…">` | `<tc-recipe-card [ingredients]="…">` | `<tc-recipe-card {ingredients}>` |
| `steps` | `el.steps = …;` | `<… steps={…} />` | `<tc-recipe-card :steps="…">` | `<tc-recipe-card [steps]="…">` | `<tc-recipe-card {steps}>` |
| `checked` | `el.checked = …;` | `<… checked={…} />` | `<tc-recipe-card :checked="…">` | `<tc-recipe-card [checked]="…">` | `<tc-recipe-card {checked}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-recipe-card :labels="…">` | `<tc-recipe-card [labels]="…">` | `<tc-recipe-card {labels}>` |

*Also attributes: `heading`, `description`, `prep-minutes`, `cook-minutes`, `base-servings`, `servings`, `min-servings`, `max-servings` and 3 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-servings-change` | Yes | `el.addEventListener("tc-servings-change", (e) => …)` | `ref.current.addEventListener("tc-servings-change", …)` | `@tc-servings-change="…"` | `(tc-servings-change)="…($event)"` | `el.addEventListener("tc-servings-change", …)` |
| `tc-units-change` | Yes | `el.addEventListener("tc-units-change", (e) => …)` | `ref.current.addEventListener("tc-units-change", …)` | `@tc-units-change="…"` | `(tc-units-change)="…($event)"` | `el.addEventListener("tc-units-change", …)` |
| `tc-step-change` | Yes | `el.addEventListener("tc-step-change", (e) => …)` | `ref.current.addEventListener("tc-step-change", …)` | `@tc-step-change="…"` | `(tc-step-change)="…($event)"` | `el.addEventListener("tc-step-change", …)` |
| `tc-timer-done` | No | `el.addEventListener("tc-timer-done", (e) => …)` | `onTimerDone={…}` | `@tc-timer-done="…"` | `(tc-timer-done)="…($event)"` | `el.addEventListener("tc-timer-done", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `servings`, `units` and `step` itself unless a listener calls `preventDefault()` on `tc-servings-change`, `tc-units-change` or `tc-step-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-recipe-card id="recipe-card"></tc-recipe-card>

<script type="module">
  import "@adamstavely/trenchcoat/recipe-card";

  const el = document.querySelector("#recipe-card");
  el.addEventListener("tc-servings-change", (e) => {
    e.preventDefault(); // the element keeps its servings…
    if (allowed(e.detail.servings)) el.servings = e.detail.servings; // …until the app sets it
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
import "@adamstavely/trenchcoat/recipe-card";
import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";

const props = defineProps<{ initial: TcRecipeCard["servings"] }>();
const servings = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onServingsChange = (e: CustomEvent<{ servings: TcRecipeCard["servings"] }>) => {
  e.preventDefault();
  servings.value = e.detail.servings;
};
</script>

<template>
  <tc-recipe-card :servings="servings" @tc-servings-change="onServingsChange"></tc-recipe-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RecipeCard } from "@adamstavely/trenchcoat/angular/recipe-card";
import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";

@Component({
  selector: "app-controlled-recipe-card",
  imports: [RecipeCard],
  template: `<tc-recipe-card [servings]="servings()" (tc-servings-change)="onServingsChange($event)"></tc-recipe-card>`,
})
export class ControlledRecipeCard {
  readonly initial = input.required<TcRecipeCard["servings"]>();
  readonly servings = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onServingsChange(e: CustomEvent<{ servings: TcRecipeCard["servings"] }>) {
    e.preventDefault();
    this.servings.set(e.detail.servings);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/recipe-card";
  import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";

  let { initial }: { initial: TcRecipeCard["servings"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let servings = $derived(initial);
  let el: TcRecipeCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      servings = (e as CustomEvent<{ servings: TcRecipeCard["servings"] }>).detail.servings;
    };
    el.addEventListener("tc-servings-change", on);
    return () => el.removeEventListener("tc-servings-change", on);
  });
</script>

<tc-recipe-card bind:this={el} {servings}></tc-recipe-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-recipe-card")` returns a `TcRecipeCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";`
- **React / Next.js:** Props: `import type { RecipeCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RecipeCard>`. The element class, for refs: `import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRecipeCard["ingredients"]` with `import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";`
- **Angular:** The directive types the template: `[ingredients]` takes `TcRecipeCard["ingredients"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRecipeCard } from "@adamstavely/trenchcoat/recipe-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The recipe's name |
| `servings` | `number` | How many to cook for – controlled when given |
| `defaultServings` | `number` | The servings on mount when `servings` isn't controlled; defaults to `baseServings` |
| `onServingsChange` | `(servings: number) => void` | The servings changed |
| `units` | `RecipeUnits` | Metric or imperial – controlled when given |
| `defaultUnits` | `RecipeUnits` | The units on mount when `units` isn't controlled |
| `onUnitsChange` | `(units: RecipeUnits) => void` | The units changed |
| `step` | `number` | The current step's index – controlled when given |
| `defaultStep` | `number` | The step on mount when `step` isn't controlled |
| `onStepChange` | `(step: number) => void` | The current step changed |
| `onTimerDone` | `(step: number, text: string) => void` | A step's timer reached zero |

*Renamed or hidden on the wrapper: `heading`, `servings`, `units`, `step`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| Tab | Moves through the stepper, the units, the ingredients, the steps' numbers and timers |
| Space on an ingredient | Ticks it off, or back |
| ← / → on the units | Metric or Imperial |
| Enter / Space on a step's number | Makes it the current step |
| Enter / Space on a timer | Starts, pauses or resumes it |

### Screen readers

- The servings stepper is a group named "Servings"; its buttons say "Fewer servings" and "More servings", and the new
  count is announced.
- Each quantity is read in words ("1 and 1/3 cups"), not as a fraction glyph.
- The current step carries `aria-current="step"`; each number is a toggle button, "Step 2".
- A running countdown is a `timer` (not read aloud each second). Starting, pausing, resetting and finishing a timer
  are announced in a polite status line: "Timer done: step 4, Simmer for 15 minutes".

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
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 25.6 KB | 7.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **33.1 KB** | **10.0 KB** |
| With Lit – the first component on a page | 55.5 KB | 17.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.5 ms** | the gallery demo's data, 214 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of ingredients replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.0 ms | ingredients: first render, 1,132 nodes; update 0.6 ms |
| 1,000 items | 43 ms | ingredients: first render, 10,312 nodes; update 5.6 ms |

1,000 items of ingredients: 43 ms, 10,312 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give quantities for `base-servings` and let the stepper do the maths; leave `quantity` out for "to taste".
- Use the units the card converts – g, kg, ml, l, oz, lb, fl oz, cup – for weights and volumes; tsp, tbsp and counts
  stay as they are.
- Write times into the steps in words ("for 15 minutes", "25–30 minutes") and temperatures as "200°C"; give a step's
  `timer` in seconds when its words name no time or another one.
- One action per step, starting with a verb.

## Do and don't

### Do

- Start on the servings the person asked for (`servings`) and keep the recipe's own in `base-servings`.
- Keep `units` with the person's other preferences.

### Don't

- Round quantities yourself – the card rounds for the units shown.
- Put several timed actions in one step; each step gets one timer.

## Related

- [Email Draft](email-draft.md) – Agent-written email for review – switch recipient and tone, edit inline, remove the attachment, send or discard with undo
- [To-do List](todo-list.md) – A to-do list people keep themselves – add, tick off, edit in place, move with Alt + arrows and remove with Undo, with All / To do / Done tabs, progress and Clear done
- [Travel Itinerary](travel-itinerary.md) – Trips as legs for a travel or expense audit – route codes, mode and carrier, the document used, confidence as a meter and %, source and grade, flags such as No record or Cash ticket in words, and connecting legs grouped into journeys
- [Structured Output](structured-output.md) – Streaming JSON as a typed tree, checked against its schema as it arrives – missing and invalid fields flagged, copy as JSON or code
