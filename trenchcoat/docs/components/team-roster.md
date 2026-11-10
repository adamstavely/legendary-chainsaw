<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Team Roster

**People & profiles** · New

A team directory with everyone's local time – status, role and team, how far ahead or behind you they are, whether they're working, skills – grouped and filtered as a list or a grid, with the team's best hour to meet

- **Element:** `<tc-team-roster>`
- **Size:** 11.8 KB gzip · 38.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/team-roster";` |
| React / Next.js | `import { TeamRoster } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/team-roster";` · tags starting with tc- are custom elements |
| Angular | `import { TeamRoster } from "@adamstavely/trenchcoat/angular/team-roster";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/team-roster";` |

## Example

The live example is in the gallery at `#/team-roster`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A team directory that knows what time it is for everyone. Each member shows:

- their picture or initials, with a status dot (Available, Busy, Away or Offline, said in words too);
- their name, role and team;
- their local time and how far ahead or behind you they are ("4:12 PM · 6 h ahead");
- whether they're in their working hours, and their skills.

A strip across the top shows the 24 hours of your day, darker where more of the team is working, and names the best
hour to meet: "Best time to meet: 15:00–16:00 your time".

Members can be grouped by team, role or time zone, filtered by name, role, team or skill, and shown as a list or a
grid. Each has Email, which opens a `mailto:` link, and Message, which fires `tc-action`.

### When to use

- A distributed team's page, so people can see who's around and when to reach them.
- Picking a time to meet across time zones.
- A project's people, with what each of them does.

### When not to use

- One person's page – use [Profile Header](profile-header.md).
- Booking a slot in people's calendars – use [Multi Calendar](multi-calendar.md).
- How to contact one person – use [Contact Channels](contact-channels.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Overlap** `.ui-ros__overlap` – your day's 24 hours, shaded by how many are working, with the best time to meet
2. **Controls** `.ui-ros__controls` – the filter, Group by, and List / Grid
3. **Group** `.ui-ros__section` – a team, role or time zone, with its count
4. **Member** `.ui-ros__member` – avatar and status, name, role, team and skills
5. **Local time** `.ui-ros__when` – their time, ahead or behind, in or outside working hours
6. **Actions** `.ui-ros__actions` – Email and Message

## Looks

Standard sets the header on a gray tray above a white card; Clean is one white card with the header as its first row.
The list is rows divided by hairlines; the grid is cards with a hairline round each. Avatars without a picture take a
tone from the name, so the same person always looks the same.

## Usage

### HTML

```html
<tc-team-roster heading="Reef resilience project"></tc-team-roster>
<script type="module">
  const roster = document.querySelector("tc-team-roster");
  roster.members = [
    { id: "ines", name: "Ines Okafor", role: "Principal investigator", team: "Coordination", timezone: "Europe/London", status: "available" },
    { id: "jun", name: "Jun Watanabe", role: "Statistician", team: "Data", timezone: "Asia/Tokyo", status: "offline" },
  ];
  roster.addEventListener("tc-action", (e) => console.log("message", e.detail.member.name));
</script>
```

### React / Next.js

```tsx
import { TeamRoster, type RosterMember } from "@adamstavely/trenchcoat/react";

export function Team({ members }: { members: RosterMember[] }) {
  return <TeamRoster title="Reef resilience project" members={members} defaultGroupBy="timezone" onMessage={(m) => console.log("message", m.name)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/team-roster";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";

defineProps<{ members: TcTeamRoster["members"] }>();
const onGroupChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-team-roster :members="members" @tc-group-change="onGroupChange"></tc-team-roster>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { TeamRoster } from "@adamstavely/trenchcoat/angular/team-roster";
import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";

@Component({
  selector: "app-team-roster-example",
  imports: [TeamRoster],
  template: `<tc-team-roster [members]="members()" (tc-group-change)="onGroupChange($event)"></tc-team-roster>`,
})
export class TeamRosterExample {
  readonly members = input.required<TcTeamRoster["members"]>();
  onGroupChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-roster";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";

  let { members }: { members: TcTeamRoster["members"] } = $props();
  let el: TcTeamRoster;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-group-change", on);
    return () => el.removeEventListener("tc-group-change", on);
  });
</script>

<tc-team-roster bind:this={el} {members}></tc-team-roster>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Team"` | The heading, and the roster's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `members` | – | `RosterMember[]` | `[]` | The members, in order |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock, read every minute |
| `viewerTimezone` | `viewer-timezone` | `string \| undefined` | `undefined` | "Your time": the viewer's IANA time zone; by default the browser's |
| `groupBy` | `group-by` | `RosterGroup` | `"team"` | How members are grouped. Changed by the user unless a tc-group-change listener calls preventDefault() |
| `filter` | `filter` | `string` | `""` | What the filter box holds. Changed by the user unless tc-filter-change is prevented |
| `view` | `view` | `RosterView` | `"list"` | A list or a grid of cards. Changed by the user unless tc-view-change is prevented |
| `selected` | `selected` | `string \| null` | `null` | The selected member's id. Changed by the user unless tc-selected-change is prevented |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times, e.g. "en-GB"; by default the browser's |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-group-change` | – | Yes | The grouping changed ({ groupBy }: RosterGroupChange); cancelable – prevented, `groupBy` stays as it was |
| `tc-filter-change` | – | Yes | The filter text changed ({ filter }: RosterFilterChange); cancelable – prevented, `filter` stays as it was |
| `tc-view-change` | – | Yes | List or grid ({ view }: RosterViewChange); cancelable – prevented, `view` stays as it was |
| `tc-selected-change` | – | Yes | A member was selected, or unselected ({ selected, member }: RosterSelectedChange); cancelable – prevented, `selected` stays as it was |
| `tc-action` | – | No | Message was pressed on a member ({ action: "message", member }: RosterAction) |

#### Design tokens it reads (85)

`--tc-action-ghost-bg-hover`, `--tc-avatar-font-size`, `--tc-avatar-font-weight`, `--tc-border-default`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-menu-item-hover`, `--tc-menu-item-radius`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-2xs`, `--tc-radius-full`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-space-7`, `--tc-space-8`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-amber-bg`, `--tc-tone-amber-fg`, `--tc-tone-pink-bg`, `--tc-tone-pink-fg`, `--tc-tone-rose-bg`, `--tc-tone-rose-fg`, `--tc-tone-teal-bg`, `--tc-tone-teal-fg`, `--tc-tone-violet-bg`, `--tc-tone-violet-fg`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `zoneOffset(timeZone: string, at: number): number \| null` | A time zone's offset from UTC at an instant, in minutes (Lisbon in summer: 60); null for a zone the browser doesn't know |
| `relativeOffset(minutes: number): void` | "+6 h ahead", "2.5 h behind", "same time" – how a zone's clock compares with the viewer's |

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
| `members` | `el.members = …;` | `<… members={…} />` | `<tc-team-roster :members="…">` | `<tc-team-roster [members]="…">` | `<tc-team-roster {members}>` |

*Also attributes: `heading`, `description`, `now`, `viewer-timezone`, `group-by`, `filter`, `view`, `selected` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-group-change` | Yes | `el.addEventListener("tc-group-change", (e) => …)` | `ref.current.addEventListener("tc-group-change", …)` | `@tc-group-change="…"` | `(tc-group-change)="…($event)"` | `el.addEventListener("tc-group-change", …)` |
| `tc-filter-change` | Yes | `el.addEventListener("tc-filter-change", (e) => …)` | `ref.current.addEventListener("tc-filter-change", …)` | `@tc-filter-change="…"` | `(tc-filter-change)="…($event)"` | `el.addEventListener("tc-filter-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `ref.current.addEventListener("tc-view-change", …)` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `ref.current.addEventListener("tc-selected-change", …)` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onMessage={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `groupBy`, `filter`, `view` and `selected` itself unless a listener calls `preventDefault()` on `tc-group-change`, `tc-filter-change`, `tc-view-change` or `tc-selected-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-team-roster id="team-roster"></tc-team-roster>

<script type="module">
  import "@adamstavely/trenchcoat/team-roster";

  const el = document.querySelector("#team-roster");
  el.addEventListener("tc-group-change", (e) => {
    e.preventDefault(); // the element keeps its groupBy…
    if (allowed(e.detail.groupBy)) el.groupBy = e.detail.groupBy; // …until the app sets it
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
import "@adamstavely/trenchcoat/team-roster";
import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";

const props = defineProps<{ initial: TcTeamRoster["groupBy"] }>();
const groupBy = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onGroupChange = (e: CustomEvent<{ groupBy: TcTeamRoster["groupBy"] }>) => {
  e.preventDefault();
  groupBy.value = e.detail.groupBy;
};
</script>

<template>
  <tc-team-roster :groupBy="groupBy" @tc-group-change="onGroupChange"></tc-team-roster>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { TeamRoster } from "@adamstavely/trenchcoat/angular/team-roster";
import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";

@Component({
  selector: "app-controlled-team-roster",
  imports: [TeamRoster],
  template: `<tc-team-roster [groupBy]="groupBy()" (tc-group-change)="onGroupChange($event)"></tc-team-roster>`,
})
export class ControlledTeamRoster {
  readonly initial = input.required<TcTeamRoster["groupBy"]>();
  readonly groupBy = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onGroupChange(e: CustomEvent<{ groupBy: TcTeamRoster["groupBy"] }>) {
    e.preventDefault();
    this.groupBy.set(e.detail.groupBy);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/team-roster";
  import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";

  let { initial }: { initial: TcTeamRoster["groupBy"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let groupBy = $derived(initial);
  let el: TcTeamRoster;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      groupBy = (e as CustomEvent<{ groupBy: TcTeamRoster["groupBy"] }>).detail.groupBy;
    };
    el.addEventListener("tc-group-change", on);
    return () => el.removeEventListener("tc-group-change", on);
  });
</script>

<tc-team-roster bind:this={el} {groupBy}></tc-team-roster>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-team-roster")` returns a `TcTeamRoster` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";`
- **React / Next.js:** Props: `import type { TeamRosterProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof TeamRoster>`. The element class, for refs: `import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcTeamRoster["members"]` with `import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";`
- **Angular:** The directive types the template: `[members]` takes `TcTeamRoster["members"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcTeamRoster } from "@adamstavely/trenchcoat/team-roster";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the roster's name |
| `groupBy` | `RosterGroup` | How members are grouped – controlled when given |
| `defaultGroupBy` | `RosterGroup` | The grouping on mount when `groupBy` isn't controlled |
| `onGroupByChange` | `(groupBy: RosterGroup) => void` | The grouping changed |
| `filter` | `string` | The filter text – controlled when given |
| `defaultFilter` | `string` | The filter on mount when `filter` isn't controlled |
| `onFilterChange` | `(filter: string) => void` | The filter changed |
| `view` | `RosterView` | List or grid – controlled when given |
| `defaultView` | `RosterView` | The view on mount when `view` isn't controlled |
| `onViewChange` | `(view: RosterView) => void` | The view changed |
| `selected` | `string \| null` | The selected member's id – controlled when given (null for none) |
| `defaultSelected` | `string \| null` | The selection on mount when `selected` isn't controlled |
| `onSelectedChange` | `(selected: string \| null, member: RosterMember \| null) => void` | A member was selected, or unselected |
| `onMessage` | `(member: RosterMember) => void` | Message was pressed on a member |

*Renamed or hidden on the wrapper: `heading`, `groupBy`, `filter`, `view`, `selected`, `children`*

## Accessibility

### Keyboard

| Key | Does |
| --- | --- |
| ↑ / ↓ | The member above / below (in the grid, a row of cards up or down) |
| ← / → | A member's previous / next button – the name, Email, Message – and on to the next member |
| Home / End | The first / last member |
| Enter or Space on a name | Selects the member, or unselects |
| ← / → on List / Grid | Switches the view |

### Screen readers

- Each group is a list named after the group and its count. The members' buttons are one tab stop, and the keys are
  described.
- The name button says the status ("Kofi Mensah, Available") and whether it's pressed (selected).
- Email and Message say whose they are.
- The overlap strip is an image whose name is the best time and how many are working then.
- Filtering announces how many members match.

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
| color-mix() | 111 | 113 | 16.2 | 16.2 | itself, tokens.css | Tints and washes mixed from the tokens. |
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

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 31.0 KB | 9.6 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **38.8 KB** | **11.9 KB** |
| With Lit – the first component on a page | 59.5 KB | 18.6 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.9 ms** | the gallery demo's data, 361 DOM nodes – to layout, median of 7 |
| Typical update | **3.0 ms** | one item of members replaced |
| First on the page | 11 ms | default properties; includes adding its CSS to the document |
| 100 items | 22 ms | members: first render, 3,025 nodes; update 12 ms |
| 1,000 items | 217 ms | members: first render, 29,325 nodes; update 104 ms |

1,000 items of members: 217 ms. It renders every item, so a first render passes 50 ms (a long task) at about 230 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared`.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Reads the clock: `Date.now()`.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give everyone an IANA time zone ("America/Sao_Paulo"), not an abbreviation: daylight saving follows by itself.
- Set `workingHours` for anyone whose day isn't 09:00–17:30.
- Keep roles short and skills to two or three each.

## Do and don't

### Do

- Pass `now` when you render on a server, or for screenshots and tests.
- Let people message from the roster (`tc-action`) into your own chat.

### Don't

- Show a status you don't keep up to date – leave `status` out instead.
- Put personal phone numbers here; link to [Contact Channels](contact-channels.md).

## Related

- [Profile Header](profile-header.md) – The top of a person's or an account's page – picture or initials, name, status and tags, other names as chips, a line of key facts, the page's actions and a row of section tabs
- [Person Links](person-links.md) – The people linked to a person or an account – role, an ID or second line, and how strong each link is in words and bars, with a count, a "View network" action and "Show all"
- [Contact Channels](contact-channels.md) – The ways to reach a person or an account, grouped as Email, Phone, Messaging and Address – each masked until shown, with its role, when it was last used, how far it's verified, Copy and the page's own actions
- [Multi Calendar](multi-calendar.md) – A calendar of calendars: many people's Google, Outlook, Exchange and iCal calendars in one Day, Week, Month, Agenda or People view, with show/hide per calendar, conflicts across a person's calendars, and create, edit, drag-to-move and delete on writable ones

## Changelog

- **People & profiles** - **Org Chart** (`tc-org-chart`) – reporting lines that fold, search that opens the way, pan and zoom, an outline when narrow. - **Person Hovercard** (`tc-person-hovercard`) – the profile card behind any name, with status and local time. - **Team Roster** (`tc-team-roster`) – a directory with everyone's local time and the team's best hour to meet. - **Relationship Graph** (`tc-relationship-graph`) – people and organisations around one of them, re-centring on click, with a keyboard list of every connection.
