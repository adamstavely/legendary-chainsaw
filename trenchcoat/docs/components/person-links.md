<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Person Links

**People & profiles** · New

The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"

- **Element:** `<tc-person-links>`
- **Size:** 7.9 KB gzip · 24.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/person-links";` |
| React / Next.js | `import { PersonLinks } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/person-links";` · tags starting with tc- are custom elements |
| Angular | `import { PersonLinks } from "@adamstavely/trenchcoat/angular/person-links";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/person-links";` |

## Example

The live example is in the gallery at `#/person-links`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The people linked to a person or an account, one row each. A row shows a picture or initials, the name, the person's
role in the link (“Co-signer”, “Manager”, “Beneficial owner”), an ID or a second line, and how strong the link is –
strong, medium, weak or unknown – written out and drawn as up to three bars, so colour is never the only cue. A row
can carry one extra pill for what matters most, such as “Key link”. The header counts the people and can offer a
“View network” action. Past `max` rows, a “Show all” button reveals the rest. Selecting a row reports it to the page,
which opens that person.

### When to use

- The related parties on a customer, account or case page: directors, owners, guarantors, family, advisers.
- A contact's colleagues and connections in a CRM.
- Anywhere people need to see who is linked to whom, and how strongly, before they open one.

### When not to use

- The whole web of links, several steps out – use a graph such as [Lineage Graph](lineage-graph.md).
- Inviting people to a team – use [Team Invite](../illustrations/team-invite.md).
- Many people with many columns to sort and filter – use [Data Table](data-table.md).
- The header of the person's own page – use [Profile Header](profile-header.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Count** `.ui-plk__count` – how many people are linked, beside the heading
2. **Network** `.ui-plk__network` – the optional header action, e.g. “View network”
3. **Row** `.ui-plk__row` – one linked person; selected rows are highlighted
4. **Avatar** `.ui-plk__avatar` – the picture, or the name's initials
5. **Role** `.ui-plk__role` – how the person is linked, then the second line
6. **Tag** `.ui-plk__tag` – the optional pill for what matters most about the link
7. **Strength** `.ui-plk__strength` – the strength in words, with bars
8. **Show all** `.ui-plk__more` – reveals the people past `max`, or hides them again

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the header
as its first row. The rows, tags and strength are the same in both; a strong link's bars use the accent.

## Usage

### HTML

```html
<tc-person-links id="links" network-label="View network" max="4"></tc-person-links>

<script type="module">
  import "@adamstavely/trenchcoat/person-links";
  import "@adamstavely/trenchcoat/tokens.css";

  const links = document.querySelector("#links");
  links.people = [
    { id: "p1", name: "Dana Whitfield", role: "Director", detail: "CUS-40218", strength: "strong" },
    { id: "p2", name: "Priya Natarajan", role: "Co-signer", detail: "CUS-40377", strength: "medium" },
  ];
  links.addEventListener("tc-selected-change", (e) => console.log(e.detail.selected));
  links.addEventListener("tc-action", () => console.log("network"));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { PersonLinks, type LinkedPerson } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const people: LinkedPerson[] = [
  { id: "p1", name: "Dana Whitfield", role: "Director", detail: "CUS-40218", strength: "strong" },
  { id: "p2", name: "Priya Natarajan", role: "Co-signer", detail: "CUS-40377", strength: "medium" },
];

export function Links() {
  const [selected, setSelected] = useState<string | null>(null);
  return <PersonLinks people={people} max={4} networkLabel="View network" selected={selected} onSelectedChange={setSelected} onNetwork={() => console.log("network")} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/person-links";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";

defineProps<{ people: TcPersonLinks["people"]; strengthLabels: TcPersonLinks["strengthLabels"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-person-links :people="people" :strengthLabels="strengthLabels" @tc-selected-change="onSelectedChange"></tc-person-links>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PersonLinks } from "@adamstavely/trenchcoat/angular/person-links";
import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";

@Component({
  selector: "app-person-links-example",
  imports: [PersonLinks],
  template: `<tc-person-links [people]="people()" [strengthLabels]="strengthLabels()" (tc-selected-change)="onSelectedChange($event)"></tc-person-links>`,
})
export class PersonLinksExample {
  readonly people = input.required<TcPersonLinks["people"]>();
  readonly strengthLabels = input.required<TcPersonLinks["strengthLabels"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/person-links";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";

  let { people, strengthLabels }: { people: TcPersonLinks["people"]; strengthLabels: TcPersonLinks["strengthLabels"] } = $props();
  let el: TcPersonLinks;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-person-links bind:this={el} {people} {strengthLabels}></tc-person-links>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Linked people"` | The heading, and the list's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `people` | – | `LinkedPerson[]` | `[]` | The people, in the order given |
| `selected` | `selected` | `string \| null` | `null` | The selected person's id. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `max` | `max` | `number \| undefined` | `undefined` | How many rows show before "Show all"; unset shows everyone |
| `expanded` | `expanded` | `boolean` | `false` | Shows everyone past `max`; the "Show all" button toggles it |
| `networkLabel` | `network-label` | `string \| undefined` | `undefined` | The header action's label, e.g. "View network"; unset hides it |
| `countLabel` | `count-label` | `string` | `"linked"` | What the count says after the number: "6 linked" |
| `strengthLabels` | – | `Partial<Record<LinkStrength, string>>` | `{}` | The strengths' names, merged over the defaults (Strong, Medium, Weak, Unknown) |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | A row was selected or cleared ({ selected, person }: PersonLinksSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-action` | – | No | The header's network action was used ({ id: "network" }: PersonLinksAction) |

#### Design tokens it reads (77)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-border-default`, `--tc-border-selected`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-lg`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-selected`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-md`, `--tc-space-0-5`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultLinkStrengthLabels: Record<LinkStrength, string>` | The strengths' names used when the page gives none |

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
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-person-links :people="…">` | `<tc-person-links [people]="…">` | `<tc-person-links {people}>` |
| `strengthLabels` | `el.strengthLabels = …;` | `<… strengthLabels={…} />` | `<tc-person-links :strengthLabels="…">` | `<tc-person-links [strengthLabels]="…">` | `<tc-person-links {strengthLabels}>` |

*Also attributes: `heading`, `description`, `selected`, `max`, `expanded`, `network-label`, `count-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onNetwork={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `selected` itself unless a listener calls `preventDefault()` on `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-person-links id="person-links"></tc-person-links>

<script type="module">
  import "@adamstavely/trenchcoat/person-links";

  const el = document.querySelector("#person-links");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
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
import "@adamstavely/trenchcoat/person-links";
import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";

const props = defineProps<{ initial: TcPersonLinks["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcPersonLinks["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-person-links :selected="selected" @tc-selected-change="onSelectedChange"></tc-person-links>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PersonLinks } from "@adamstavely/trenchcoat/angular/person-links";
import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";

@Component({
  selector: "app-controlled-person-links",
  imports: [PersonLinks],
  template: `<tc-person-links [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-person-links>`,
})
export class ControlledPersonLinks {
  readonly initial = input.required<TcPersonLinks["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcPersonLinks["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/person-links";
  import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";

  let { initial }: { initial: TcPersonLinks["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcPersonLinks;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcPersonLinks["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-person-links bind:this={el} {selected}></tc-person-links>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-person-links")` returns a `TcPersonLinks` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";`
- **React / Next.js:** Props: `import type { PersonLinksProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PersonLinks>`. The element class, for refs: `import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPersonLinks["people"]` with `import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";`
- **Angular:** The directive types the template: `[people]` takes `TcPersonLinks["people"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPersonLinks } from "@adamstavely/trenchcoat/person-links";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the list's name |
| `selected` | `string \| null` | The selected person's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The person selected on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, person?: LinkedPerson) => void` | A row was selected or cleared; `person` is the selected person |
| `onNetwork` | `() => void` | The header's network action was used (shown when `networkLabel` is set) |

*Renamed or hidden on the wrapper: `heading`, `selected`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

The list is one tab stop, on the selected person or else the first; inside it the arrows move between people.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next person |
| Home / End | Moves to the first or last person shown |
| Enter / Space | Selects the person, or clears the selection if they're selected |
| Escape | Clears the selection |
| Tab | Leaves the list; the next stops are “Show all” and the header action |

### Screen readers

The list is a `listbox` named by the heading, and each person an `option`: it reads the name, the role and second
line, the tag and the strength – “Priya Natarajan, Co-signer · CUS-40377, Medium link”. The selected person is
`aria-selected`. Selecting is confirmed in a polite status message, “Selected Priya Natarajan”, and clearing with
“Selection cleared”. The “Show all” button is `aria-expanded` and controls the list.

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
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 17.0 KB | 5.5 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **24.9 KB** | **7.9 KB** |
| With Lit – the first component on a page | 46.7 KB | 15.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 76 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of people replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.2 ms | people: first render, 76 nodes; update 0.3 ms |
| 1,000 items | 2.6 ms | people: first render, 76 nodes; update 0.4 ms |

What it renders doesn't grow with people (tested to 1,000 items).

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

- Write the role from the link's point of view: “Co-signer”, “Beneficial owner”, “Former director”.
- Put an ID, a company or a date in `detail`: “CUS-40377”, “via Larkspur Holdings · 62%”, “Resigned 2023”.
- Use `unknown` when nobody has judged the link yet, rather than guessing `weak`.
- Rename the strengths with `strengthLabels` if your team uses other words, such as “Confirmed” and “Suspected”.

## Do and don't

### Do

- Order people by how much they matter to the review, strongest links first.
- Use a tag for the one thing that needs attention, such as a link that's unverified.
- Set `max` to about five on a page with other sections, so the list doesn't push them out of view.

### Don't

- Don't use the tag for the strength – the strength has its own place.
- Don't show people the viewer isn't allowed to open; leave them out of `people`.
- Don't rely on the colours of the avatars – they only tell names apart.

## Related

- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs
- [Lineage Graph](lineage-graph.md) – Where an output came from – run, turns, queries and tools, source chunks, claims and artifacts in columns, every node's record a click away
- [Team Invite](../illustrations/team-invite.md) – Connected teammates – a cursor drags a new one into the empty slot, the line turns solid and they go online
- [Data Table](data-table.md) – Spreadsheet-style table: select cells and ranges, edit in place, copy and paste, undo and sort

## Changelog

- **`tc-person-links`:** the people linked to someone. - **Each person:** role, an ID or second line, and the link's strength in words and bars. - **List:** a count, "View network" and "Show all". Selecting a person fires a cancelable event.
