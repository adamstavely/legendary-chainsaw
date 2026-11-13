<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Skill Library

**AI configuration** · New

The skills a workspace has added, grouped by who made them – Built-in, your team, each plugin, the community – with a switch each, when it runs and when it was last used, Update when a newer version is out, search and source and on/off filters, and Add skill (Upload, From a URL, Create)

- **Element:** `<tc-skill-library>`
- **Size:** 10.1 KB gzip · 32.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/skill-library";` |
| React / Next.js | `import { SkillLibrary } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/skill-library";` · tags starting with tc- are custom elements |
| Angular | `import { SkillLibrary } from "@adamstavely/trenchcoat/angular/skill-library";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/skill-library";` |

## Example

The live example is in the gallery at `#/skill-library`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The skills a workspace has added, grouped by who made them: Built-in first, then your team's own, then each plugin's,
then the community's. Each skill is one row – its name, version, what it does, when a model picks it ("Runs when asked
to review a contract"), when it was last used, and a switch that turns it on or off. When a newer version is out the row
says so and offers Update.

A search, a source filter and an On / Off filter sit above the list. Add skill is a menu – Upload, From a URL, Create –
and the page does the adding. Pressing a skill's name opens it, usually in `skill-detail`.

### When to use

- The skills page of an agent workspace, where people turn skills on and off and see what's there.
- An admin view of which skills are installed, where they came from and which need an update.

### When not to use

- Everything about one skill – its tools, files and runs – use [Skill Detail](skill-detail.md).
- MCP servers and the tools they expose – use [MCP connection manager](mcp-connection-manager.md).
- Which agents may call which tools – use [Tool Permissions](tool-permissions.md).
- A catalogue of integrations to browse and connect – use the [App Directory](../blocks/app-directory.md) block.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Search and filters** `.ui-skl__tools` – search, Source and Show
2. **Source group** `.ui-skl__group-block` – one heading per maker, with its count
3. **Skill** `.ui-skl__row` – name, version, description, when it runs and when it was last used
4. **Update available** `.ui-skl__badge` – a newer version is out; `.ui-skl__update` installs it
5. **Switch** `.ui-skl__switch` – on or off, with the word beside it
6. **Add skill** `.ui-skl__add` – a menu of Upload, From a URL and Create

## Looks

Standard puts the header on the gray tray above a white card; the update badge is a filled pill. Clean is one white card
with the header as its first row, a hairline under the filters and an outlined badge. `--tc-skl-menu-w` sets the Add
skill menu's minimum width.

## Usage

### HTML

```html
<tc-skill-library id="skills"></tc-skill-library>

<script type="module">
  import "@adamstavely/trenchcoat/skill-library";
  import "@adamstavely/trenchcoat/tokens.css";

  const skills = document.querySelector("#skills");
  skills.skills = [
    { id: "chart", name: "Chart from spreadsheet", description: "Turns a sheet into a clear chart.", group: "Built-in", version: "3.1.0", enabled: true, triggers: "Runs when asked to chart data" },
    { id: "contract", name: "Contract reviewer", description: "Checks a supplier contract against the playbook.", group: "Your team", version: "1.4.0", update: "1.5.0", enabled: true, triggers: "Runs when asked to review a contract" },
    { id: "expense", name: "Expense policy checker", description: "Flags claim lines that break the policy.", group: "Your team", version: "0.9.2", enabled: false },
  ];
  skills.addEventListener("tc-enabled-change", (e) => console.log(e.detail.id, e.detail.enabled));
  skills.addEventListener("tc-add", (e) => console.log("add from", e.detail.source));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SkillLibrary, type LibrarySkill } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Skills({ start, open }: { start: LibrarySkill[]; open: (id: string) => void }) {
  const [skills, setSkills] = useState(start);
  return <SkillLibrary skills={skills} onSkillsChange={setSkills} now={Date.now()} onSkillOpen={open} onAdd={(source) => console.log(source)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/skill-library";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";

defineProps<{ skills: TcSkillLibrary["skills"]; groups: TcSkillLibrary["groups"] }>();
const onEnabledChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-skill-library :skills="skills" :groups="groups" @tc-enabled-change="onEnabledChange"></tc-skill-library>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SkillLibrary } from "@adamstavely/trenchcoat/angular/skill-library";
import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";

@Component({
  selector: "app-skill-library-example",
  imports: [SkillLibrary],
  template: `<tc-skill-library [skills]="skills()" [groups]="groups()" (tc-enabled-change)="onEnabledChange($event)"></tc-skill-library>`,
})
export class SkillLibraryExample {
  readonly skills = input.required<TcSkillLibrary["skills"]>();
  readonly groups = input.required<TcSkillLibrary["groups"]>();
  onEnabledChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/skill-library";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";

  let { skills, groups }: { skills: TcSkillLibrary["skills"]; groups: TcSkillLibrary["groups"] } = $props();
  let el: TcSkillLibrary;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-enabled-change", on);
    return () => el.removeEventListener("tc-enabled-change", on);
  });
</script>

<tc-skill-library bind:this={el} {skills} {groups}></tc-skill-library>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The heading |
| `description` | `description` | `string` | `""` | A quieter line under the heading |
| `skills` | – | `LibrarySkill[]` | `[]` | The skills. Changed by the switches unless a tc-enabled-change or tc-skills-change listener calls preventDefault() |
| `groups` | – | `string[]` | `[]` | The order of the source groups; groups not named sort after Built-in and Your team, Community last |
| `query` | `query` | `string` | `""` | The search text. Changed by typing unless a tc-query-change listener calls preventDefault() |
| `group` | `group` | `string \| null` | `null` | The source shown, or null for all. Changed by the Source select unless a tc-group-change listener calls preventDefault() |
| `show` | `show` | `SkillLibraryShow` | `"all"` | "all", "on" or "off". Changed by the Show select unless a tc-show-change listener calls preventDefault() |
| `hideAdd` | `hide-add` | `boolean` | `false` | Hide Add skill |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms, for "3 h ago"; without it, last used shows as a date |
| `locale` | `locale` | `string \| undefined` | `undefined` | For dates and relative times |
| `labels` | – | `Partial<SkillLibraryLabels>` | `{}` | Words to rename, merged over defaultSkillLibraryLabels; {n}, {on}, {name}, {version} and {when} are filled in |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-enabled-change` | – | Yes | A skill's switch was flipped ({ id, enabled, skill }: SkillEnabledChange); cancelable – prevented, the switch stays as it was |
| `tc-skills-change` | – | Yes | The list changed after a switch ({ skills, id }: SkillLibrarySkillsChange); cancelable – prevented, `skills` stays as it was |
| `tc-query-change` | – | Yes | The search changed ({ query }: SkillLibraryQueryChange); cancelable – prevented, `query` stays as it was |
| `tc-group-change` | – | Yes | Another source was picked ({ group }: SkillLibraryGroupChange); cancelable – prevented, `group` stays as it was |
| `tc-show-change` | – | Yes | All, On or Off was picked ({ show }: SkillLibraryShowChange); cancelable – prevented, `show` stays as it was |
| `tc-update` | – | No | Update was pressed on a skill ({ id, version, skill }: SkillLibraryUpdate) |
| `tc-add` | – | No | Upload, From a URL or Create was picked in Add skill ({ source }: SkillLibraryAdd) |
| `tc-skill-open` | – | No | A skill's name was pressed ({ id, skill }: SkillLibraryOpen) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-skl-menu-w` | `176px` | both |

#### Design tokens it reads (74)

`--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-fill-hover`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-shadow-control`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-6`, `--tc-space-7`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-caps`, `--tc-tray-inset`, `--tc-tray-radius`, `--tc-z-popover`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `skillGroups(skills: readonly LibrarySkill[], order: readonly string[]): string[]` | The groups in display order: Built-in, Your team, plugins as they appear, Community |

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
| `skills` | `el.skills = …;` | `<… skills={…} />` | `<tc-skill-library :skills="…">` | `<tc-skill-library [skills]="…">` | `<tc-skill-library {skills}>` |
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-skill-library :groups="…">` | `<tc-skill-library [groups]="…">` | `<tc-skill-library {groups}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-skill-library :labels="…">` | `<tc-skill-library [labels]="…">` | `<tc-skill-library {labels}>` |

*Also attributes: `heading`, `description`, `query`, `group`, `show`, `hide-add`, `now`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-enabled-change` | Yes | `el.addEventListener("tc-enabled-change", (e) => …)` | `onEnabledChange={…}` | `@tc-enabled-change="…"` | `(tc-enabled-change)="…($event)"` | `el.addEventListener("tc-enabled-change", …)` |
| `tc-skills-change` | Yes | `el.addEventListener("tc-skills-change", (e) => …)` | `onSkillsChange={…}` | `@tc-skills-change="…"` | `(tc-skills-change)="…($event)"` | `el.addEventListener("tc-skills-change", …)` |
| `tc-query-change` | Yes | `el.addEventListener("tc-query-change", (e) => …)` | `onQueryChange={…}` | `@tc-query-change="…"` | `(tc-query-change)="…($event)"` | `el.addEventListener("tc-query-change", …)` |
| `tc-group-change` | Yes | `el.addEventListener("tc-group-change", (e) => …)` | `ref.current.addEventListener("tc-group-change", …)` | `@tc-group-change="…"` | `(tc-group-change)="…($event)"` | `el.addEventListener("tc-group-change", …)` |
| `tc-show-change` | Yes | `el.addEventListener("tc-show-change", (e) => …)` | `onShowChange={…}` | `@tc-show-change="…"` | `(tc-show-change)="…($event)"` | `el.addEventListener("tc-show-change", …)` |
| `tc-update` | No | `el.addEventListener("tc-update", (e) => …)` | `onUpdate={…}` | `@tc-update="…"` | `(tc-update)="…($event)"` | `el.addEventListener("tc-update", …)` |
| `tc-add` | No | `el.addEventListener("tc-add", (e) => …)` | `onAdd={…}` | `@tc-add="…"` | `(tc-add)="…($event)"` | `el.addEventListener("tc-add", …)` |
| `tc-skill-open` | No | `el.addEventListener("tc-skill-open", (e) => …)` | `onSkillOpen={…}` | `@tc-skill-open="…"` | `(tc-skill-open)="…($event)"` | `el.addEventListener("tc-skill-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `skills`, `query`, `group` and `show` itself unless a listener calls `preventDefault()` on `tc-skills-change`, `tc-query-change`, `tc-group-change` or `tc-show-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-skill-library id="skill-library"></tc-skill-library>

<script type="module">
  import "@adamstavely/trenchcoat/skill-library";

  const el = document.querySelector("#skill-library");
  el.addEventListener("tc-skills-change", (e) => {
    e.preventDefault(); // the element keeps its skills…
    if (allowed(e.detail.skills)) el.skills = e.detail.skills; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SkillLibrary } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SkillLibrary>;
type Props = Omit<Own, "skills" | "onSkillsChange"> & { initial: NonNullable<Own["skills"]> };

// Controlled: passing skills makes the wrapper prevent the element's own change; the app sets it
export function ControlledSkillLibrary({ initial, ...props }: Props) {
  const [skills, setSkills] = useState<Own["skills"]>(initial);
  return <SkillLibrary {...props} skills={skills} onSkillsChange={(next) => setSkills(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/skill-library";
import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";

const props = defineProps<{ initial: TcSkillLibrary["skills"] }>();
const skills = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSkillsChange = (e: CustomEvent<{ skills: TcSkillLibrary["skills"] }>) => {
  e.preventDefault();
  skills.value = e.detail.skills;
};
</script>

<template>
  <tc-skill-library :skills="skills" @tc-skills-change="onSkillsChange"></tc-skill-library>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SkillLibrary } from "@adamstavely/trenchcoat/angular/skill-library";
import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";

@Component({
  selector: "app-controlled-skill-library",
  imports: [SkillLibrary],
  template: `<tc-skill-library [skills]="skills()" (tc-skills-change)="onSkillsChange($event)"></tc-skill-library>`,
})
export class ControlledSkillLibrary {
  readonly initial = input.required<TcSkillLibrary["skills"]>();
  readonly skills = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSkillsChange(e: CustomEvent<{ skills: TcSkillLibrary["skills"] }>) {
    e.preventDefault();
    this.skills.set(e.detail.skills);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/skill-library";
  import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";

  let { initial }: { initial: TcSkillLibrary["skills"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let skills = $derived(initial);
  let el: TcSkillLibrary;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      skills = (e as CustomEvent<{ skills: TcSkillLibrary["skills"] }>).detail.skills;
    };
    el.addEventListener("tc-skills-change", on);
    return () => el.removeEventListener("tc-skills-change", on);
  });
</script>

<tc-skill-library bind:this={el} {skills}></tc-skill-library>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-skill-library")` returns a `TcSkillLibrary` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";`
- **React / Next.js:** Props: `import type { SkillLibraryProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SkillLibrary>`. The element class, for refs: `import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSkillLibrary["skills"]` with `import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";`
- **Angular:** The directive types the template: `[skills]` takes `TcSkillLibrary["skills"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSkillLibrary } from "@adamstavely/trenchcoat/skill-library";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "Skills" by default |
| `skills` | `LibrarySkill[]` | The skills – controlled when given |
| `defaultSkills` | `LibrarySkill[]` | The skills on mount, when `skills` isn't controlled |
| `onSkillsChange` | `(skills: LibrarySkill[], id: string) => void` | Called with the whole list after a switch is flipped, and the skill that changed |
| `onEnabledChange` | `(id: string, enabled: boolean, skill: LibrarySkill) => boolean \| void` | A switch was flipped; return false to keep it as it was |
| `query` | `string` | The search text – controlled when given |
| `defaultQuery` | `string` | The search text on mount, when `query` isn't controlled |
| `onQueryChange` | `(query: string) => void` | Called with the search text as it's typed |
| `group` | `string \| null` | The source shown, or null for all – controlled when given |
| `defaultGroup` | `string \| null` | The source on mount, when `group` isn't controlled |
| `onGroupChange` | `(group: string \| null) => void` | Called with the source picked |
| `show` | `SkillLibraryShow` | "all", "on" or "off" – controlled when given |
| `defaultShow` | `SkillLibraryShow` | Which skills show on mount, when `show` isn't controlled |
| `onShowChange` | `(show: SkillLibraryShow) => void` | Called with All, On or Off as it's picked |
| `onUpdate` | `(id: string, version: string, skill: LibrarySkill) => void` | Update was pressed on a skill: install `version` |
| `onAdd` | `(source: SkillLibraryAddSource) => void` | Upload, From a URL or Create was picked in Add skill |
| `onSkillOpen` | `(id: string, skill: LibrarySkill) => void` | A skill's name was pressed: open its detail |

*Renamed or hidden on the wrapper: `heading`, `skills`, `query`, `group`, `show`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the search, the two filters, then each skill's name, Update and switch |
| Enter / Space | On a name, opens the skill; on a switch, turns it on or off; on Update, asks for the update |
| ↓ / ↑ on Add skill | Opens the menu on its first or last item |
| ↑ / ↓, Home, End | In the menu, moves between Upload, From a URL and Create |
| Escape | Closes the menu; focus returns to Add skill |

### Screen readers

The host is a group named by the heading. Each source is a section with a heading, and its skills are a list labelled by
it. A switch is named by its skill ("Contract reviewer", switch, on). The trigger line starts with hidden text, "When it
runs:", and Update says which skill ("Update to 1.5.0 – Contract reviewer"). Flipping a switch is announced politely:
"Expense policy checker is on."

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
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
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
| **This component alone** | 24.0 KB | 7.6 KB |
| Lit · the library every element is built on, the parts it uses | 21.2 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| **Added to a page that already has Lit** | **32.6 KB** | **10.1 KB** |
| With Lit – the first component on a page | 55.0 KB | 17.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.0 ms** | the gallery demo's data, 172 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of skills replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 11 ms | skills: first render, 1,479 nodes; update 2.0 ms |
| 1,000 items | 71 ms | skills: first render, 14,075 nodes; update 11 ms |

1,000 items of skills: 71 ms. It renders every item, so a first render passes 50 ms (a long task) at about 700 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document pointerdown`.
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name skills for the task ("Contract reviewer"), not the file ("contract_reviewer_v2").
- Keep the description to one sentence about the result; put when it runs in `triggers`, starting "Runs when…".
- Pass `group` as people know the maker: "Built-in", "Your team", the plugin's name, "Community". `groups` fixes the
  order when you need one.
- Give `now` so last used reads "2 hr. ago"; without it the date shows.

## Do and don't

### Do

- Turn a skill off rather than removing it when someone only wants it out of the way for a while.
- Show `update` only when the newer version is actually installable.
- Open `skill-detail` from `onSkillOpen`, so people can see a skill's tools before turning it on.

### Don't

- Don't turn on a skill that can write files, run commands or use the network without saying so – `skill-detail` asks
  first; if you flip it here, say what it can do in its description.
- Don't hide disabled skills by default; people look for them to turn them back on.

## Related

- [Skill Detail](skill-detail.md) – One skill in full – who made it and its version with Update, when a model picks it, the tools it may use with what each can do in words (read-only, writes files, runs commands, uses the network), its files to read in a code block, recent runs, and Enable, Export and Remove – asking first before turning on anything risky or removing it
- [MCP connection manager](mcp-connection-manager.md) – MCP servers at a glance – status and what each exposes; add one (transport, auth, test), inspect its tools, resources and prompts, connect, retry and remove
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Integration Picker](integration-picker.md) – Integrations page of a command menu – search, a list of services and the picked one with its connection on two tiles
