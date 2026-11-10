<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Person Hovercard

**People & profiles** · New

The profile card behind any name – picture, pronouns, title and team, status, local time and time difference, manager, Email, Message, View profile and links – on hover, focus or tap

- **Element:** `<tc-person-hovercard>`
- **Size:** 11.8 KB gzip · 35.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/person-hovercard";` |
| React / Next.js | `import { PersonHovercard } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/person-hovercard";` · tags starting with tc- are custom elements |
| Angular | `import { PersonHovercard } from "@adamstavely/trenchcoat/angular/person-hovercard";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/person-hovercard";` |

## Example

The live example is in the gallery at `#/person-hovercard`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The profile card behind any name. Wrap a name, an avatar or a link to a person, then point at it, focus it or tap it.
A card opens beside it with:

- their picture or initials, name and pronouns, title and team;
- whether they're available, busy, away or offline, as a dot and the word;
- their local time and how far ahead or behind you they are;
- where they are and who they report to;
- Email, Message and View profile, and their links.

The card stays while the pointer is over it, and Escape closes it and returns focus to the name.

Give it the `person`, or a `person-id` that it looks up with `resolve(id, signal)` or the cancelable
`tc-person-lookup` event. Answers are cached by id, and a failed lookup offers Retry. The element never calls a
network itself.

### When to use

- Names in comments, activity feeds, documents and tables, where people want to know who someone is without leaving
  the page.
- Avatars in a list of assignees or reviewers.

### When not to use

- The top of a person's own page – use [Profile Header](profile-header.md).
- A person's ways to get in touch, listed in full – use [Person Links](person-links.md).
- Text that only needs a short explanation – use [Tooltip](tooltip.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Trigger** `.ui-phc__hit` – the page's own link or button, or a button the element lays over plain text
2. **Card** `.ui-phc__pop` – in the top layer, beside the name, flipped and kept inside the window
3. **Head** `.ui-phc__head` – picture or initials, name, pronouns, title and team
4. **Status** `.ui-phc__status` – a dot and the word, with their own note
5. **Details** `.ui-phc__row` – local time, location and manager
6. **Actions** `.ui-phc__actions` – Email, Message and View profile
7. **Links** `.ui-phc__links` – their other pages

## Looks

Standard is a raised card with an overlay shadow; Clean is flatter, with a hairline. Status dots are green
(available), red (busy), amber (away) and an empty ring (offline), each with its word. While a lookup runs, the card
shows the shapes of what's coming.

## Usage

### HTML

```html
<p>Ask <tc-person-hovercard person-id="mira"><a href="/people/mira">Mira Lindqvist</a></tc-person-hovercard>.</p>
<script type="module">
  const card = document.querySelector("tc-person-hovercard");
  card.resolve = (id, signal) => fetch(`/api/people/${id}`, { signal }).then((r) => r.json());
  card.addEventListener("tc-open", (e) => (location.href = `/people/${e.detail.person.id}`));
</script>
```

### React / Next.js

```tsx
import { PersonHovercard, type HovercardPerson } from "@adamstavely/trenchcoat/react";

export function Name({ person }: { person: HovercardPerson }) {
  return (
    <PersonHovercard person={person} onViewProfile={(p) => console.log("open", p.id)}>
      <a href={`/people/${person.id}`}>{person.name}</a>
    </PersonHovercard>
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/person-hovercard";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";

defineProps<{ person: TcPersonHovercard["person"]; resolve: TcPersonHovercard["resolve"] }>();
const onPersonLookup = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-person-hovercard :person="person" :resolve="resolve" @tc-person-lookup="onPersonLookup"></tc-person-hovercard>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PersonHovercard } from "@adamstavely/trenchcoat/angular/person-hovercard";
import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";

@Component({
  selector: "app-person-hovercard-example",
  imports: [PersonHovercard],
  template: `<tc-person-hovercard [person]="person()" [resolve]="resolve()" (tc-person-lookup)="onPersonLookup($event)"></tc-person-hovercard>`,
})
export class PersonHovercardExample {
  readonly person = input.required<TcPersonHovercard["person"]>();
  readonly resolve = input.required<TcPersonHovercard["resolve"]>();
  onPersonLookup(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/person-hovercard";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";

  let { person, resolve }: { person: TcPersonHovercard["person"]; resolve: TcPersonHovercard["resolve"] } = $props();
  let el: TcPersonHovercard;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-person-lookup", on);
    return () => el.removeEventListener("tc-person-lookup", on);
  });
</script>

<tc-person-hovercard bind:this={el} {person} {resolve}></tc-person-hovercard>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `person` | – | `HovercardPerson \| undefined` | `undefined` | The person; when it's not given, `person-id` is looked up |
| `personId` | `person-id` | `string \| undefined` | `undefined` | The id to look up with `resolve` or tc-person-lookup when `person` isn't given |
| `resolve` | – | `HovercardResolver \| undefined` | `undefined` | Supplies details for `person-id` |
| `hoverDelay` | `hover-delay` | `number` | `350` | How long the pointer rests on the name before the card opens, ms |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms, for local times; by default the element's own clock when the card opens |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times, e.g. "en-GB"; by default the browser's |
| `actions` | – | `HovercardAction[]` | `["email", "message", "profile"]` | Which actions the card offers |
| `notFoundText` | `not-found-text` | `string` | `"No profile for this person"` | What the card says when there are no details |
| `errorText` | `error-text` | `string` | `"Couldn't load the profile."` | What the card says when the lookup failed |
| `trigger` | – | `HTMLElement \| null` | – | The element that opens the card: the first link or button inside, or the element's own |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-person-lookup` | – | Yes | The card needs a person's details ({ id, signal, respondWith }: HovercardLookupDetail); cancelable – prevented without an answer, there are no details |
| `tc-action` | – | No | Message was pressed ({ id: "message", person }: HovercardActionDetail) |
| `tc-open` | – | No | View profile was pressed ({ person }: HovercardOpenDetail) |
| `tc-open-change` | – | No | The card opened or closed ({ open }: HovercardOpenChange) |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `openCard()` | `void` | Opens the card, pinned open; focus stays where it is |
| `closeCard()` | `void` | Closes the card |
| `clearCache(id?: string)` | `void` | Forgets cached details – one id's, or all – so the next card asks again |

#### Design tokens it reads (65)

`--tc-accent-text`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-shimmer`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-snug`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `personZoneOffset(timeZone: string, ms: number): number \| null` | A time zone's offset from UTC at `ms`, in minutes; null for a zone the browser doesn't know |
| `personZoneDifference(timeZone: string, ms: number): string \| null` | How far a zone is from the viewer's: "same time as you", "2 h ahead", "5½ h behind" |

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
| `person` | `el.person = …;` | `<… person={…} />` | `<tc-person-hovercard :person="…">` | `<tc-person-hovercard [person]="…">` | `<tc-person-hovercard {person}>` |
| `resolve` | `el.resolve = …;` | `<… resolve={…} />` | `<tc-person-hovercard :resolve="…">` | `<tc-person-hovercard [resolve]="…">` | `<tc-person-hovercard {resolve}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-person-hovercard :actions="…">` | `<tc-person-hovercard [actions]="…">` | `<tc-person-hovercard {actions}>` |

*Also attributes: `person-id`, `hover-delay`, `now`, `locale`, `not-found-text`, `error-text` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-person-lookup` | Yes | `el.addEventListener("tc-person-lookup", (e) => …)` | `onPersonLookup={…}` | `@tc-person-lookup="…"` | `(tc-person-lookup)="…($event)"` | `el.addEventListener("tc-person-lookup", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onMessage={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onViewProfile={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-open-change` | No | `el.addEventListener("tc-open-change", (e) => …)` | `onCardOpenChange={…}` | `@tc-open-change="…"` | `(tc-open-change)="…($event)"` | `el.addEventListener("tc-open-change", …)` |

### Controlled

`tc-person-lookup` is cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-person-hovercard")` returns a `TcPersonHovercard` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";`
- **React / Next.js:** Props: `import type { PersonHovercardProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PersonHovercard>`. The element class, for refs: `import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPersonHovercard["person"]` with `import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";`
- **Angular:** The directive types the template: `[person]` takes `TcPersonHovercard["person"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPersonHovercard } from "@adamstavely/trenchcoat/person-hovercard";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `onPersonLookup` | `(detail: HovercardLookupDetail, event: CustomEvent<HovercardLookupDetail>) => void` | The card needs a person's details; answer with `detail.respondWith(person)` |
| `onMessage` | `(person: HovercardPerson) => void` | Message was pressed |
| `onViewProfile` | `(person: HovercardPerson) => void` | View profile was pressed |
| `onCardOpenChange` | `(open: boolean) => void` | The card opened or closed |

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | Does |
| --- | --- |
| Tab to the name | Opens the card |
| Tab from the name | Moves into the open card |
| Shift + Tab from the card's first control | Back to the name |
| Enter or Space on plain text | Opens the card and moves into it |
| Escape | Closes the card; focus goes back to the name |

### Screen readers

- The trigger says it opens a dialog (`aria-haspopup`) and whether it's open (`aria-expanded`). Over plain text, the
  element's own button is named by that text.
- The card is a non-modal dialog named by the person's name; while loading it's busy, and its result is announced
  in a polite status line.
- Status is said in words, never by the dot alone; local time reads "4:12 PM local · 1 h ahead".

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

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.5 KB | 7.2 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.2 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **35.8 KB** | **11.9 KB** |
| With Lit – the first component on a page | 55.4 KB | 18.2 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.2 ms** | the gallery demo's data, 2 DOM nodes – to layout, median of 7 |
| Typical update | **0.0 ms** | one item of actions replaced |
| First on the page | 5.4 ms | default properties; includes adding its CSS to the document |
| 100 items | 0.2 ms | actions: first render, 2 nodes; update 0.0 ms |
| 1,000 items | 0.2 ms | actions: first render, 2 nodes; update 0.1 ms |

What it renders doesn't grow with actions (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `ResizeObserver` (internal/popover – PopoverController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give `timezone` as an IANA name ("Europe/Stockholm"), not an offset, so daylight saving is right.
- Keep the status note short ("In a review until 4").
- Use links for pages people will want next: their team page, their publications.

## Do and don't

### Do

- Wrap the name where it already is – a link to their profile stays a link.
- Cache people across the page with one `resolve`; the card asks once per id.

### Don't

- Put actions in the card that change things without a second look – it closes when the pointer wanders.
- Open it on page load – it's for when someone asks.

## Related

- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [ISBN Details](isbn-details.md) – ISBN numbers in text, validated and marked – hover or focus one for the book's cover, title, authors, publisher, year and pages
- [Org Chart](org-chart.md) – Who reports to whom – people's cards joined by reporting lines, branches that fold, search that opens the way to matches, a picked person's manager and reports, pan and zoom, and an outline when narrow

## Changelog

- **People & profiles** - **Org Chart** (`tc-org-chart`) – reporting lines that fold, search that opens the way, pan and zoom, an outline when narrow. - **Person Hovercard** (`tc-person-hovercard`) – the profile card behind any name, with status and local time. - **Team Roster** (`tc-team-roster`) – a directory with everyone's local time and the team's best hour to meet. - **Relationship Graph** (`tc-relationship-graph`) – people and organisations around one of them, re-centring on click, with a keyboard list of every connection.
