<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Work Item

**Research & portfolio** · New

One piece of work as a card – status in words, a note, progress, a due date marked when overdue, people, what it delivers, spent against budget, effort and a "Synced · read-only" source, the whole card opening it

- **Element:** `<tc-work-item>`
- **Size:** 7.4 KB gzip · 23.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/work-item";` |
| React / Next.js | `import { WorkItem } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/work-item";` · tags starting with tc- are custom elements |
| Angular | `import { WorkItem } from "@adamstavely/trenchcoat/angular/work-item";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/work-item";` |

## Example

The live example is in the gallery at `#/work-item`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One piece of work as a card, made to sit in a grid with others. It shows:

- **Title and status.** The status is in words and a mark: Active, Blocked, In review, Done or Paused, all renamable.
- **Note and progress.** A one-line note (the blocker or the next step), then progress with its %.
- **Due date, people and outcome.** The due date is marked once it's passed. The people on it are initials, and what
  it delivers is a tag, e.g. “fills 1 gap”.
- **Money and effort.** Spent against budget, with a slim bar and an “over budget” note when it's past. Then the
  effort, e.g. “1.5 FTE”.
- **Source.** For work mirrored from another system, a badge like “Synced · read-only”.

The title is the card's one control, and the whole card is its target. It's a link when `href` is set, otherwise a
button, and either way opening it fires tc-open.

### When to use

- The work against a topic, a goal or a gap, laid out as a grid.
- A summary of work tracked in another system, mirrored read-only.
- Anywhere progress, deadline and spend matter together for each item.

### When not to use

- A whole unit and its teams – use [Org Unit Card](org-unit-card.md).
- A project with its subtasks and a status you change in place – use [Project Card](project-card.md).
- Use against a plan's limit – use [Usage Meter](usage-meter.md).
- Long-running jobs with cancel and retry – use [Background Tasks](background-tasks.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Title** `.ui-wki__title` – the work's name, and the card's link or button
2. **Status** `.ui-wki__status` – Active, Blocked, In review, Done or Paused, in words and a mark
3. **Note** `.ui-wki__note` – one line: the blocker, the next step
4. **Progress** `.ui-wki__progress` – how far along, with its %
5. **Due** `.ui-wki__due` – the due date, “Overdue” once it's passed
6. **People** `.ui-wki__people` – initials of who's on it
7. **Outcome** `.ui-wki__outcome` – what it delivers, as a tag
8. **Money** `.ui-wki__money` – spent against budget, with a slim bar
9. **Source** `.ui-wki__source` – where a mirrored item comes from

## Looks

Both looks are a white card. Standard lifts it with the card shadow and a medium-weight title. Clean uses the quieter
Clean shadow and a lighter title. The content is the same in both.

## Usage

### HTML

```html
<tc-work-item id="work" heading="NeuroBench-E harness" status="active" href="/work/neurobench" effort="1.5 FTE"></tc-work-item>

<script type="module">
  import "@adamstavely/trenchcoat/work-item";
  import "@adamstavely/trenchcoat/tokens.css";

  const work = document.querySelector("#work");
  work.progress = 0.6;
  work.due = Date.parse("2026-08-15T12:00");
  work.people = [{ name: "Jonah Tran" }, { name: "Elena Castellanos" }];
  work.spent = 360000;
  work.budget = 600000;
  work.addEventListener("tc-open", (e) => console.log("open", e.detail.href));
</script>
```

### React / Next.js

```tsx
import { WorkItem } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Harness() {
  return (
    <WorkItem
      title="NeuroBench-E harness"
      status="active"
      note="Energy-normalised benchmark across 7 substrates."
      progress={0.6}
      due={Date.parse("2026-08-15T12:00")}
      people={[{ name: "Jonah Tran" }, { name: "Elena Castellanos" }]}
      outcome="fills 1 gap"
      spent={360000}
      budget={600000}
      effort="1.5 FTE"
      onOpen={(href) => console.log("open", href)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/work-item";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";

defineProps<{ statusLabels: TcWorkItem["statusLabels"]; people: TcWorkItem["people"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-work-item :statusLabels="statusLabels" :people="people" @tc-open="onOpen"></tc-work-item>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { WorkItem } from "@adamstavely/trenchcoat/angular/work-item";
import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";

@Component({
  selector: "app-work-item-example",
  imports: [WorkItem],
  template: `<tc-work-item [statusLabels]="statusLabels()" [people]="people()" (tc-open)="onOpen($event)"></tc-work-item>`,
})
export class WorkItemExample {
  readonly statusLabels = input.required<TcWorkItem["statusLabels"]>();
  readonly people = input.required<TcWorkItem["people"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/work-item";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";

  let { statusLabels, people }: { statusLabels: TcWorkItem["statusLabels"]; people: TcWorkItem["people"] } = $props();
  let el: TcWorkItem;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-work-item bind:this={el} {statusLabels} {people}></tc-work-item>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The work's title, and the card's control |
| `status` | `status` | `WorkStatus` | `"active"` | Where the work stands: active, blocked, review, done or paused – shown in words with a mark |
| `statusLabels` | – | `Partial<Record<WorkStatus, string>>` | `{}` | The statuses' names, merged over the defaults (Active, Blocked, In review, Done, Paused) |
| `note` | `note` | `string \| undefined` | `undefined` | One line under the title: the blocker, the next step |
| `progress` | `progress` | `number \| undefined` | `undefined` | How far along, from 0 to 1; no bar when unset |
| `due` | `due` | `number \| undefined` | `undefined` | When it's due, as epoch ms |
| `now` | `now` | `number \| undefined` | `undefined` | The time to compare `due` with, as epoch ms; today when unset |
| `people` | – | `WorkPerson[]` | `[]` | Who's on it |
| `outcome` | `outcome` | `string \| undefined` | `undefined` | What it delivers, as a tag, e.g. "fills 1 gap" |
| `spent` | `spent` | `number \| undefined` | `undefined` | Money spent so far |
| `budget` | `budget` | `number \| undefined` | `undefined` | The money it has; spent is shown against it |
| `currency` | `currency` | `string` | `"USD"` | The currency of `spent` and `budget`, as an ISO 4217 code |
| `effort` | `effort` | `string \| undefined` | `undefined` | The effort, written as shown, e.g. "1.5 FTE" |
| `source` | `source` | `string \| undefined` | `undefined` | Where the item comes from when it's mirrored, e.g. "Synced · read-only" |
| `href` | `href` | `string \| undefined` | `undefined` | Makes the title a link |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for dates and money, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | The card was opened ({ href }: WorkOpen); cancelable – prevented, a link doesn't follow |

#### Design tokens it reads (59)

`--tc-accent-text`, `--tc-avatar-font-weight`, `--tc-avatar-sm`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-xs`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-raised`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultWorkStatusLabels: Record<WorkStatus, string>` | The statuses' names used when the page gives none |

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
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-work-item :statusLabels="…">` | `<tc-work-item [statusLabels]="…">` | `<tc-work-item {statusLabels}>` |
| `people` | `el.people = …;` | `<… people={…} />` | `<tc-work-item :people="…">` | `<tc-work-item [people]="…">` | `<tc-work-item {people}>` |

*Also attributes: `heading`, `status`, `note`, `progress`, `due`, `now`, `outcome`, `spent` and 6 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

### Controlled

`tc-open` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-work-item")` returns a `TcWorkItem` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";`
- **React / Next.js:** Props: `import type { WorkItemProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof WorkItem>`. The element class, for refs: `import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcWorkItem["statusLabels"]` with `import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";`
- **Angular:** The directive types the template: `[statusLabels]` takes `TcWorkItem["statusLabels"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcWorkItem } from "@adamstavely/trenchcoat/work-item";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The work's title, and the card's control |
| `onOpen` | `(href?: string) => boolean \| void` | The card was opened; return false to stop a link following |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves to the card's title; the whole card shows the focus ring |
| Enter | Opens the card (a link follows unless tc-open is prevented) |
| Space | Opens the card when it's a button |

### Screen readers

The card's title is a level-4 heading containing its link or button, so the card's name is the work's title. The
status reads “Status: Blocked”. Progress is a `progressbar` labelled “Progress” with its value. The due date reads
“Due Aug 15”, or “Overdue · Jun 30” when it's passed. The people are an image named “People: Jonah Tran, Elena
Castellanos”. Money reads “$360K / $600K spent”, or “… · over budget”. The marks and bars are hidden; their meaning
is always in words.

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
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

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
| **This component alone** | 16.3 KB | 5.3 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **23.6 KB** | **7.5 KB** |
| With Lit – the first component on a page | 43.2 KB | 13.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.8 ms** | the gallery demo's data, 40 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of people replaced |
| First on the page | 9.7 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.7 ms | people: first render, 43 nodes; update 0.1 ms |
| 1,000 items | 0.7 ms | people: first render, 43 nodes; update 0.1 ms |

1,000 items of people: 0.7 ms, 43 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the title as the work's name, not its ticket number: “NeuroBench-E harness”.
- Use the note for the one thing people need to know now – the blocker, the next step – in a sentence.
- Keep the outcome short and countable: “fills 1 gap”, “ships v2”.
- Pass `currency` when budgets aren't in dollars; amounts are shortened, “$1.9M”.

## Do and don't

### Do

- Lay cards out in a grid with columns of at least 240 px.
- Pass `now` when the page has its own sense of today, such as a report as of a date.
- Set `source` on items mirrored from another system, so nobody tries to edit them here.

### Don't

- Don't put a second button or link inside the card – the whole card is the title's target.
- Don't use the status colours for anything but status.
- Don't show money on items people can't act on; leave `spent` and `budget` unset instead.

## Related

- [Org Unit Card](org-unit-card.md) – An organisational unit at a glance – code, name, lead, On track / Watch / At risk counts, the page's stats with a spent-of-budget bar, and teams that fold open onto their topics' priority, coverage, open gaps and momentum
- [Project Card](project-card.md) – A two-line project summary that quietly unfolds on hover – a progress ring with one segment per subtask, a people filter and a status picker, all linked by hover
- [Usage Meter](usage-meter.md) – Plan usage and AI credits – a stacked credits meter by category, daily sparkline, limits and a button that speaks up near the limit
- [Background Tasks](background-tasks.md) – Your long-running jobs at a glance – a header indicator with overall progress, and a panel of running, queued, done and failed tasks with cancel, retry and open

## Changelog

- **`tc-work-item`:** one piece of work as a card. - **Status:** in words, with progress and a due date (marked when overdue). - **Resources:** people, what it delivers, spent against budget, and effort.
