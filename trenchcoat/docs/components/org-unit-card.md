<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Org Unit Card

**Research & portfolio** · New

An organisational unit at a glance – code, name, lead, On track / Watch / At risk counts, the page's stats with a spent-of-budget bar, and teams that fold open onto their topics' priority, coverage, open gaps and momentum

- **Element:** `<tc-org-unit-card>`
- **Size:** 9.5 KB gzip · 34.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/org-unit-card";` |
| React / Next.js | `import { OrgUnitCard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/org-unit-card";` · tags starting with tc- are custom elements |
| Angular | `import { OrgUnitCard } from "@adamstavely/trenchcoat/angular/org-unit-card";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/org-unit-card";` |

## Example

The live example is in the gallery at `#/org-unit-card`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

An organisational unit at a glance: a centre, a department or a division. The header shows a short code badge, the
unit's name and one line about it, with the page's actions at the right. Below it:

- **Lead and health.** Who leads the unit, and how much of its work is On track, on Watch or At risk, in words and
  marks.
- **Stats.** A strip of the page's own figures. Each stat has a label, a value and a quiet line, and the budget can
  show a spent-of-allocated bar.
- **Teams.** The unit's sub-units as rows that fold open. A row shows the team's lead, people, health, coverage, open
  gaps and effort, then any figures of the page's own (`figures`: a value, a quiet word under it and a tone). Opening
  it lists the team's items: topics or programmes, each with a priority, a tag, what's in work, coverage, what's open
  and its momentum.

### When to use

- A directorate or portfolio page that compares centres side by side.
- The top of a department's page, before its detailed work.
- Any unit whose figures roll up from teams that people want to drill into.

### When not to use

- One piece of work – use [Work Item](work-item.md).
- The people linked to someone – use [Person Links](person-links.md).
- The top of a person's or an account's page – use [Profile Header](profile-header.md).
- Use against a limit or a plan – use [Usage Meter](usage-meter.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Code** `.ui-orgu__code` – the unit's short code in the header's badge
2. **Actions** `.ui-orgu__action` – the page's buttons, at the header's right
3. **Lead** `.ui-orgu__lead` – who leads the unit, with their role
4. **Health** `.ui-orgu__healths` – how many items are On track, on Watch and At risk
5. **Stat** `.ui-orgu__stat` – a label, a value, an optional bar and a quiet line
6. **Team** `.ui-orgu__team-row` – a sub-unit: lead, people, health, coverage, gaps, effort and its own figures; opens
7. **Item** `.ui-orgu__item` – a team's topic: priority, tag, what's in work, coverage, what's open and momentum

## Looks

Standard is a white card on a gray tray, with the header on the tray above it. Clean is one white card with the
header as its first row. The stats, health and team rows are the same in both.

## Usage

### HTML

```html
<tc-org-unit-card id="unit" code="CIS" heading="Intelligent Systems"></tc-org-unit-card>

<script type="module">
  import "@adamstavely/trenchcoat/org-unit-card";
  import "@adamstavely/trenchcoat/tokens.css";

  const unit = document.querySelector("#unit");
  unit.lead = { name: "Marcus Okonkwo", title: "Principal Investigator" };
  unit.health = { "on-track": 2, watch: 1, "at-risk": 1 };
  unit.stats = [
    { id: "coverage", label: "Coverage", value: "66%", sub: "gap coverage" },
    { id: "budget", label: "Budget", value: "$9.2M", sub: "$5.1M spent", meter: 0.55 },
  ];
  unit.teams = [
    {
      id: "cognitive",
      name: "Cognitive Systems",
      people: 3,
      coverage: 0.61,
      items: [{ id: "neuro", label: "Neuromorphic Computing", priority: 1, coverage: 0.42, open: 4, momentum: -0.08 }],
    },
  ];
  unit.addEventListener("tc-expanded-change", (e) => console.log(e.detail.expanded));
  unit.addEventListener("tc-open", (e) => console.log(e.detail.item.label));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { OrgUnitCard, type OrgTeam } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const teams: OrgTeam[] = [
  {
    id: "cognitive",
    name: "Cognitive Systems",
    people: 3,
    coverage: 0.61,
    items: [{ id: "neuro", label: "Neuromorphic Computing", priority: 1, coverage: 0.42, open: 4, momentum: -0.08 }],
  },
];

export function Centre() {
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <OrgUnitCard
      code="CIS"
      title="Intelligent Systems"
      lead={{ name: "Marcus Okonkwo", title: "Principal Investigator" }}
      health={{ "on-track": 2, watch: 1, "at-risk": 1 }}
      stats={[{ id: "budget", label: "Budget", value: "$9.2M", sub: "$5.1M spent", meter: 0.55 }]}
      teams={teams}
      expanded={expanded}
      onExpandedChange={setExpanded}
      onOpen={(team, item) => console.log(team, item.label)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/org-unit-card";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";

defineProps<{ lead: TcOrgUnitCard["lead"]; stats: TcOrgUnitCard["stats"] }>();
const onExpandedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-org-unit-card :lead="lead" :stats="stats" @tc-expanded-change="onExpandedChange"></tc-org-unit-card>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { OrgUnitCard } from "@adamstavely/trenchcoat/angular/org-unit-card";
import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";

@Component({
  selector: "app-org-unit-card-example",
  imports: [OrgUnitCard],
  template: `<tc-org-unit-card [lead]="lead()" [stats]="stats()" (tc-expanded-change)="onExpandedChange($event)"></tc-org-unit-card>`,
})
export class OrgUnitCardExample {
  readonly lead = input.required<TcOrgUnitCard["lead"]>();
  readonly stats = input.required<TcOrgUnitCard["stats"]>();
  onExpandedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/org-unit-card";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";

  let { lead, stats }: { lead: TcOrgUnitCard["lead"]; stats: TcOrgUnitCard["stats"] } = $props();
  let el: TcOrgUnitCard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-org-unit-card bind:this={el} {lead} {stats}></tc-org-unit-card>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The unit's name, and the card's heading |
| `code` | `code` | `string \| undefined` | `undefined` | A short code shown as the header's badge, e.g. "CIS"; initials of the name otherwise |
| `description` | `description` | `string \| undefined` | `undefined` | One line about the unit |
| `lead` | – | `OrgPerson \| null` | `null` | Who leads the unit |
| `leadLabel` | `lead-label` | `string` | `"Lead"` | The lead's role in the unit, the caption over their name |
| `stats` | – | `OrgStat[]` | `[]` | The page's stats, in order |
| `health` | – | `OrgHealthCounts \| null` | `null` | The unit's health: how many items are on track, on watch and at risk |
| `healthLabels` | – | `Partial<Record<OrgHealth, string>>` | `{}` | The health states' names, merged over the defaults (On track, Watch, At risk) |
| `teams` | – | `OrgTeam[]` | `[]` | The sub-units |
| `teamsLabel` | `teams-label` | `string` | `"Teams"` | The sub-units' caption |
| `itemsLabel` | `items-label` | `string` | `"Topics"` | What a team's items are, for their list's name, e.g. "Topics" |
| `expanded` | – | `string[]` | `[]` | The open teams' ids. Changed by the user unless a tc-expanded-change listener calls preventDefault() |
| `actions` | – | `OrgAction[]` | `[]` | Buttons in the header |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-expanded-change` | – | Yes | A team was opened or closed ({ expanded, id, open }: OrgExpandedChange); cancelable – prevented, `expanded` stays as it was |
| `tc-action` | – | No | A header action was used ({ id }: OrgActionEvent) |
| `tc-open` | – | No | An item was opened with Enter or a click ({ team, item }: OrgOpen) |

#### Design tokens it reads (89)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-avatar-md`, `--tc-avatar-sm`, `--tc-border-strong`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-inverse`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-inverse`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultOrgHealthLabels: Record<OrgHealth, string>` | The health states' names used when the page gives none |

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
| `lead` | `el.lead = …;` | `<… lead={…} />` | `<tc-org-unit-card :lead="…">` | `<tc-org-unit-card [lead]="…">` | `<tc-org-unit-card {lead}>` |
| `stats` | `el.stats = …;` | `<… stats={…} />` | `<tc-org-unit-card :stats="…">` | `<tc-org-unit-card [stats]="…">` | `<tc-org-unit-card {stats}>` |
| `health` | `el.health = …;` | `<… health={…} />` | `<tc-org-unit-card :health="…">` | `<tc-org-unit-card [health]="…">` | `<tc-org-unit-card {health}>` |
| `healthLabels` | `el.healthLabels = …;` | `<… healthLabels={…} />` | `<tc-org-unit-card :healthLabels="…">` | `<tc-org-unit-card [healthLabels]="…">` | `<tc-org-unit-card {healthLabels}>` |
| `teams` | `el.teams = …;` | `<… teams={…} />` | `<tc-org-unit-card :teams="…">` | `<tc-org-unit-card [teams]="…">` | `<tc-org-unit-card {teams}>` |
| `expanded` | `el.expanded = …;` | `<… expanded={…} />` | `<tc-org-unit-card :expanded="…">` | `<tc-org-unit-card [expanded]="…">` | `<tc-org-unit-card {expanded}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-org-unit-card :actions="…">` | `<tc-org-unit-card [actions]="…">` | `<tc-org-unit-card {actions}>` |

*Also attributes: `heading`, `code`, `description`, `lead-label`, `teams-label`, `items-label` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-expanded-change` | Yes | `el.addEventListener("tc-expanded-change", (e) => …)` | `ref.current.addEventListener("tc-expanded-change", …)` | `@tc-expanded-change="…"` | `(tc-expanded-change)="…($event)"` | `el.addEventListener("tc-expanded-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `expanded` itself unless a listener calls `preventDefault()` on `tc-expanded-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-org-unit-card id="org-unit-card"></tc-org-unit-card>

<script type="module">
  import "@adamstavely/trenchcoat/org-unit-card";

  const el = document.querySelector("#org-unit-card");
  el.addEventListener("tc-expanded-change", (e) => {
    e.preventDefault(); // the element keeps its expanded…
    if (allowed(e.detail.expanded)) el.expanded = e.detail.expanded; // …until the app sets it
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
import "@adamstavely/trenchcoat/org-unit-card";
import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";

const props = defineProps<{ initial: TcOrgUnitCard["expanded"] }>();
const expanded = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onExpandedChange = (e: CustomEvent<{ expanded: TcOrgUnitCard["expanded"] }>) => {
  e.preventDefault();
  expanded.value = e.detail.expanded;
};
</script>

<template>
  <tc-org-unit-card :expanded="expanded" @tc-expanded-change="onExpandedChange"></tc-org-unit-card>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { OrgUnitCard } from "@adamstavely/trenchcoat/angular/org-unit-card";
import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";

@Component({
  selector: "app-controlled-org-unit-card",
  imports: [OrgUnitCard],
  template: `<tc-org-unit-card [expanded]="expanded()" (tc-expanded-change)="onExpandedChange($event)"></tc-org-unit-card>`,
})
export class ControlledOrgUnitCard {
  readonly initial = input.required<TcOrgUnitCard["expanded"]>();
  readonly expanded = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onExpandedChange(e: CustomEvent<{ expanded: TcOrgUnitCard["expanded"] }>) {
    e.preventDefault();
    this.expanded.set(e.detail.expanded);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/org-unit-card";
  import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";

  let { initial }: { initial: TcOrgUnitCard["expanded"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let expanded = $derived(initial);
  let el: TcOrgUnitCard;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      expanded = (e as CustomEvent<{ expanded: TcOrgUnitCard["expanded"] }>).detail.expanded;
    };
    el.addEventListener("tc-expanded-change", on);
    return () => el.removeEventListener("tc-expanded-change", on);
  });
</script>

<tc-org-unit-card bind:this={el} {expanded}></tc-org-unit-card>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-org-unit-card")` returns a `TcOrgUnitCard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";`
- **React / Next.js:** Props: `import type { OrgUnitCardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof OrgUnitCard>`. The element class, for refs: `import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcOrgUnitCard["lead"]` with `import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";`
- **Angular:** The directive types the template: `[lead]` takes `TcOrgUnitCard["lead"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcOrgUnitCard } from "@adamstavely/trenchcoat/org-unit-card";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The unit's name, and the card's heading |
| `expanded` | `string[]` | The open teams' ids – controlled when given |
| `defaultExpanded` | `string[]` | The teams open on mount when `expanded` isn't controlled |
| `onExpandedChange` | `(expanded: string[]) => void` | A team was opened or closed |
| `onAction` | `(id: string) => void` | A header action was used |
| `onOpen` | `(team: string, item: OrgItem) => void` | An item was opened with Enter or a click |

*Renamed or hidden on the wrapper: `heading`, `expanded`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The team rows and any open team's items are one tab stop; the header's actions are their own stops.

| Key | What it does |
|---|---|
| ↑ / ↓ | Moves to the previous or next row – teams and the items of open teams |
| Home / End | Moves to the first or last row |
| → | Opens a closed team; on an open team, moves to its first item |
| ← | Closes an open team; on an item, moves back to its team |
| Enter / Space | Opens or closes a team; opens an item (tc-open) |
| Tab | Leaves the rows |

### Screen readers

The card's heading is the unit's name. The lead and stats are a definition list: each stat reads its label then its
value, and a bar adds its share in words, “$9.2M (55%)”. The health strip is labelled “Health” and reads “2 On track,
1 Watch, 1 At risk”. Teams are a list under a “Teams” heading; each team is a button with `aria-expanded` that
controls its list of items, named “Cognitive Systems: Topics”. A team's health reads in words. Each item reads its
priority, its name and health, “Priority 1, Neuromorphic Computing, At risk”, then its coverage, what's open and its
momentum, “Down 8%”. The marks, arrows and bars are hidden; their meaning is always in words.

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

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 26.4 KB | 7.3 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **34.2 KB** | **9.5 KB** |
| With Lit – the first component on a page | 56.0 KB | 16.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.7 ms** | the gallery demo's data, 184 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of stats replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.9 ms | stats: first render, 605 nodes; update 0.6 ms |
| 1,000 items | 32 ms | stats: first render, 4,655 nodes; update 2.8 ms |

1,000 items of stats: 32 ms, 4,655 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Use a code people already know for the unit, two to four capitals: “CIS”, “R&D”.
- Keep stats to about six, each a figure people compare between units.
- Put the denominator in the sub-line: “$5.1M spent” under “$9.2M”, “13 in work” under “4”.
- Give momentum as a fraction of the period's change: -0.08 shows “▼ 8%”.

## Do and don't

### Do

- Open the team the page is about, or none – let people choose.
- Use the same stats in the same order on every card of a page, so the eye can compare.
- Rename the health states when your organisation has its own words for them.

### Don't

- Don't use colour alone for health – the counts always come with their words.
- Don't nest teams inside items; this card is two levels deep by design.
- Don't put more than two actions in the header; move the rest to the page.

## Related

- [Work Item](work-item.md) – One piece of work as a card – status in words, a note, progress, a due date marked when overdue, people, what it delivers, spent against budget, effort and a "Synced · read-only" source, the whole card opening it
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit

## Changelog

- **`tc-org-unit-card`:** an organisational unit at a glance. - **Header:** its lead and health counts. - **Stats:** the page's own stats, with a spent-of-budget bar. - **Teams:** each folds open onto its topics.
