<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Trigger List

**AI configuration** · New

Every way an agent starts, one row each – schedule, webhook, event, email or manual in words, when it last fired and how often this week, errors in words, a switch to turn it off, Edit, and Add trigger by kind

- **Element:** `<tc-trigger-list>`
- **Size:** 7.9 KB gzip · 24.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/trigger-list";` |
| React / Next.js | `import { TriggerList } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/trigger-list";` · tags starting with tc- are custom elements |
| Angular | `import { TriggerList } from "@adamstavely/trenchcoat/angular/trigger-list";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/trigger-list";` |

## Example

The live example is in the gallery at `#/trigger-list`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Every way an agent starts, one row each: a schedule, a webhook, an event in another system, an email or a person pressing Run. Each row says what starts it in words, when it last fired and how often this week, and any error in words, with a switch to turn it on or off and Edit. Add trigger opens a menu of kinds; the page builds the new trigger.

### When to use

- An agent's settings, listing what starts it.
- Turning a noisy or failing trigger off without deleting it.

### When not to use

- Building or editing one trigger – use [Trigger Builder](trigger-builder.md).
- One recurring task with its last runs – use [Schedule Card](schedule-card.md).
- Setting up a routine's name, time and instructions – use [Routine Form](routine-form.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Row** `.ui-trl__row` – one trigger
2. **Kind** `.ui-trl__kind` – an icon and a word: Schedule, Webhook, Event, Email or Manual
3. **Summary** `.ui-trl__summary` – what starts it, in words
4. **Facts** `.ui-trl__facts` – when it last fired and how often this week
5. **Error** `.ui-trl__error` – what's going wrong, in words, with a square mark
6. **Switch** `.ui-trl__switch` – on or off, with `.ui-trl__state` saying which
7. **Edit** `.ui-trl__edit`
8. **Add trigger** `.ui-trl__add` – opens `.ui-trl__menu` of `.ui-trl__item` kinds

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A trigger that's off has its summary in secondary text. In a narrow container the kind sits above the summary. `--tc-trl-switch-w`, `--tc-trl-switch-h`, `--tc-trl-knob` and `--tc-trl-kind-w` size the switch and the kind column.

## Usage

### HTML

```html
<tc-trigger-list id="triggers"></tc-trigger-list>

<script type="module">
  import "@adamstavely/trenchcoat/trigger-list";
  import "@adamstavely/trenchcoat/tokens.css";

  const list = document.querySelector("#triggers");
  list.triggers = [
    { id: "daily", kind: "schedule", summary: "Every weekday at 09:00", enabled: true, fires7d: 5 },
    { id: "upload", kind: "event", summary: "When an invoice is uploaded", enabled: false },
  ];
  list.addEventListener("tc-enabled-change", (e) => console.log(e.detail.id, e.detail.enabled));
</script>
```

### React / Next.js

```tsx
import { TriggerList, type AgentTrigger } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const triggers: AgentTrigger[] = [
  { id: "daily", kind: "schedule", summary: "Every weekday at 09:00", enabled: true, fires7d: 5 },
  { id: "upload", kind: "event", summary: "When an invoice is uploaded", enabled: false },
];

export function AgentTriggers({ now }: { now: number }) {
  return <TriggerList defaultTriggers={triggers} now={now} onAdd={(kind) => console.log("add", kind)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/trigger-list";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";

defineProps<{ triggers: TcTriggerList["triggers"]; kinds: TcTriggerList["kinds"] }>();
const onEnabledChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-trigger-list :triggers="triggers" :kinds="kinds" @tc-enabled-change="onEnabledChange"></tc-trigger-list>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TriggerList } from "@adamstavely/trenchcoat/angular/trigger-list";
import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";

@Component({
  selector: "app-trigger-list-example",
  imports: [TriggerList],
  template: `<tc-trigger-list [triggers]="triggers()" [kinds]="kinds()" (tc-enabled-change)="onEnabledChange($event)"></tc-trigger-list>`,
})
export class TriggerListExample {
  readonly triggers = input.required<TcTriggerList["triggers"]>();
  readonly kinds = input.required<TcTriggerList["kinds"]>();
  onEnabledChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trigger-list";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";

  let { triggers, kinds }: { triggers: TcTriggerList["triggers"]; kinds: TcTriggerList["kinds"] } = $props();
  let el: TcTriggerList;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-enabled-change", on);
    return () => el.removeEventListener("tc-enabled-change", on);
  });
</script>

<tc-trigger-list bind:this={el} {triggers} {kinds}></tc-trigger-list>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading; by default "Triggers" |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading, such as the agent's name |
| `triggers` | – | `AgentTrigger[]` | `[]` | The triggers. A flipped switch changes `enabled` unless a tc-enabled-change listener calls preventDefault() |
| `kinds` | – | `TriggerKind[]` | `["schedule", "webhook", "event", "email", "manual"]` | The kinds Add trigger offers; none: no Add trigger |
| `now` | `now` | `number \| undefined` | `undefined` | "Now" for "3 hours ago", epoch ms; without it, last-fired times are dates. The element doesn't read the clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for dates and relative times |
| `labels` | – | `Partial<Omit<TriggerListLabels, "kinds">> & { kinds?: Partial<Record<TriggerKind, string>> }` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-enabled-change` | – | Yes | A switch was flipped ({ id, enabled, trigger, triggers }: TriggerEnabledChange); cancelable – prevented, the trigger keeps its state |
| `tc-edit` | – | No | Edit was pressed ({ id, trigger }: TriggerListEdit) |
| `tc-add` | – | No | A kind was picked from Add trigger ({ kind }: TriggerListAdd) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-trl-switch-w` | `32px` | both |
| `--tc-trl-switch-h` | `18px` | both |
| `--tc-trl-knob` | `14px` | both |
| `--tc-trl-kind-w` | `96px` | both |

#### Design tokens it reads (41)

`--tc-accent`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-radius-full`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `triggerAgo(at: number, now: number, locale?: string): void` | "3 hours ago", "yesterday" – from `at` to `now` |

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
| `triggers` | `el.triggers = …;` | `<… triggers={…} />` | `<tc-trigger-list :triggers="…">` | `<tc-trigger-list [triggers]="…">` | `<tc-trigger-list {triggers}>` |
| `kinds` | `el.kinds = …;` | `<… kinds={…} />` | `<tc-trigger-list :kinds="…">` | `<tc-trigger-list [kinds]="…">` | `<tc-trigger-list {kinds}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-trigger-list :labels="…">` | `<tc-trigger-list [labels]="…">` | `<tc-trigger-list {labels}>` |

*Also attributes: `heading`, `description`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-enabled-change` | Yes | `el.addEventListener("tc-enabled-change", (e) => …)` | `onTriggersChange={…}` | `@tc-enabled-change="…"` | `(tc-enabled-change)="…($event)"` | `el.addEventListener("tc-enabled-change", …)` |
| `tc-edit` | No | `el.addEventListener("tc-edit", (e) => …)` | `onEdit={…}` | `@tc-edit="…"` | `(tc-edit)="…($event)"` | `el.addEventListener("tc-edit", …)` |
| `tc-add` | No | `el.addEventListener("tc-add", (e) => …)` | `onAdd={…}` | `@tc-add="…"` | `(tc-add)="…($event)"` | `el.addEventListener("tc-add", …)` |

### Controlled

The element changes `triggers` itself unless a listener calls `preventDefault()` on `tc-enabled-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-trigger-list id="trigger-list"></tc-trigger-list>

<script type="module">
  import "@adamstavely/trenchcoat/trigger-list";

  const el = document.querySelector("#trigger-list");
  el.addEventListener("tc-enabled-change", (e) => {
    e.preventDefault(); // the element keeps its triggers…
    if (allowed(e.detail.triggers)) el.triggers = e.detail.triggers; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { TriggerList } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof TriggerList>;
type Props = Omit<Own, "triggers" | "onTriggersChange"> & { initial: NonNullable<Own["triggers"]> };

// Controlled: passing triggers makes the wrapper prevent the element's own change; the app sets it
export function ControlledTriggerList({ initial, ...props }: Props) {
  const [triggers, setTriggers] = useState<Own["triggers"]>(initial);
  return <TriggerList {...props} triggers={triggers} onTriggersChange={(next) => setTriggers(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/trigger-list";
import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";

const props = defineProps<{ initial: TcTriggerList["triggers"] }>();
const triggers = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onEnabledChange = (e: CustomEvent<{ triggers: TcTriggerList["triggers"] }>) => {
  e.preventDefault();
  triggers.value = e.detail.triggers;
};
</script>

<template>
  <tc-trigger-list :triggers="triggers" @tc-enabled-change="onEnabledChange"></tc-trigger-list>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TriggerList } from "@adamstavely/trenchcoat/angular/trigger-list";
import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";

@Component({
  selector: "app-controlled-trigger-list",
  imports: [TriggerList],
  template: `<tc-trigger-list [triggers]="triggers()" (tc-enabled-change)="onEnabledChange($event)"></tc-trigger-list>`,
})
export class ControlledTriggerList {
  readonly initial = input.required<TcTriggerList["triggers"]>();
  readonly triggers = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onEnabledChange(e: CustomEvent<{ triggers: TcTriggerList["triggers"] }>) {
    e.preventDefault();
    this.triggers.set(e.detail.triggers);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/trigger-list";
  import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";

  let { initial }: { initial: TcTriggerList["triggers"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let triggers = $derived(initial);
  let el: TcTriggerList;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      triggers = (e as CustomEvent<{ triggers: TcTriggerList["triggers"] }>).detail.triggers;
    };
    el.addEventListener("tc-enabled-change", on);
    return () => el.removeEventListener("tc-enabled-change", on);
  });
</script>

<tc-trigger-list bind:this={el} {triggers}></tc-trigger-list>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-trigger-list")` returns a `TcTriggerList` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";`
- **React / Next.js:** Props: `import type { TriggerListProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TriggerList>`. The element class, for refs: `import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTriggerList["triggers"]` with `import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";`
- **Angular:** The directive types the template: `[triggers]` takes `TcTriggerList["triggers"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTriggerList } from "@adamstavely/trenchcoat/trigger-list";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; by default "Triggers" |
| `triggers` | `AgentTrigger[]` | The triggers – controlled when given |
| `defaultTriggers` | `AgentTrigger[]` | The triggers on mount when `triggers` isn't controlled |
| `onTriggersChange` | `(triggers: AgentTrigger[], detail: TriggerEnabledChange) => void` | A switch was flipped – the whole list after it, and which one |
| `onEdit` | `(id: string, trigger: AgentTrigger) => void` | Edit was pressed |
| `onAdd` | `(kind: TriggerKind) => void` | A kind was picked from Add trigger |

*Renamed or hidden on the wrapper: `heading`, `triggers`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each trigger's switch and Edit, then Add trigger |
| Space | On a switch: turns the trigger on or off |
| Enter / Space | On Edit or Add trigger: presses it |
| ↓ / ↑ | On Add trigger: opens the menu on the first or last kind; in the menu, moves |
| Home / End | In the menu: the first or last kind |
| Escape | Closes the menu, returning focus to Add trigger |

### Screen readers

The triggers are a list named by the heading. Each switch is a native checkbox with `role="switch"`, named "Run on Every weekday at 09:00" and described by its error when there is one. Edit's name includes the summary. Add trigger is a menu button; the kinds are menu items. `role="status"` announces "Turned off: Every weekday at 09:00".

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

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
| **This component alone** | 16.3 KB | 5.7 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.0 KB** | **7.9 KB** |
| With Lit – the first component on a page | 45.8 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.9 ms** | the gallery demo's data, 134 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of triggers replaced |
| First on the page | 23 ms | default properties; includes adding its CSS to the document |
| 100 items | 18 ms | triggers: first render, 1,958 nodes; update 1.7 ms |
| 1,000 items | 116 ms | triggers: first render, 19,238 nodes; update 11 ms |

1,000 items of triggers: 116 ms. It renders every item, so a first render passes 50 ms (a long task) at about 430 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write `summary` as what starts the agent, in plain words: "Every weekday at 09:00", "When an invoice is uploaded to Accounts payable".
- Write `error` as what's wrong and how often: "The last 3 requests had no X-Signature header".
- Pass `now` so last-fired times read "20 minutes ago"; without it they're dates.

## Do and don't

### Do

- Turn the trigger on or off on the server in `tc-enabled-change`, and prevent it if that fails.
- Open `trigger-builder` for Edit and for a kind from Add trigger.

### Don't

- Don't hide a failing trigger – keep it listed with its error so people can fix it or turn it off.
- Don't use the switch to delete a trigger; off keeps its settings.

## Related

- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
- [Schedule Card](schedule-card.md) – A recurring agent task at a glance – the schedule in words, a live countdown to the next run, the last runs as marks in words with when and how long, and Run now, Pause / Resume and Edit
- [Routine Form](routine-form.md) – Set up a routine: name, frequency and start time in a time zone with the next run worked out, first run now or on schedule, email notifications and instructions, with Dismiss and Create routine
- [Secrets Manager](secrets-manager.md) – The secrets agents run on, write-only – missing ones first with the agents that need them, expired and expiring next, Set value or Replace in a password field that's handed to the page and forgotten, Delete that names what will stop working, and new secrets by UPPER_SNAKE name
