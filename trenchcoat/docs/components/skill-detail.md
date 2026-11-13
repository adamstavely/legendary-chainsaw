<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Skill Detail

**AI configuration** · New

One skill in full – who made it and its version with Update, when a model picks it, the tools it may use with what each can do in words (read-only, writes files, runs commands, uses the network), its files to read in a code block, recent runs, and Enable, Export and Remove – asking first before turning on anything risky or removing it

- **Element:** `<tc-skill-detail>`
- **Size:** 29.3 KB gzip · 112.1 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/skill-detail";` |
| React / Next.js | `import { SkillDetail } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/skill-detail";` · tags starting with tc- are custom elements |
| Angular | `import { SkillDetail } from "@adamstavely/trenchcoat/angular/skill-detail";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/skill-detail";` |

## Example

The live example is in the gallery at `#/skill-detail`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One skill, everything about it in one card: who made it and its version (with Update when a newer one is out), when a
model picks it, the tools it may use with what each is allowed to do in words – read-only, writes files, runs commands,
uses the network – its files, and its recent runs.

The switch in the header turns it on or off. Turning on a skill that can write files, run commands or use the network
asks first and lists exactly which. Remove asks too, and names the agents that will stop being able to use it. Picking a
file shows it below in a code block.

### When to use

- The detail page or side panel opened from `skill-library`.
- Reviewing a skill before turning it on – what it can do, what's in it, how it has gone.

### When not to use

- All of a workspace's skills at once – use [Skill Library](skill-library.md).
- Allowing or denying tools per agent – use [Tool Permissions](tool-permissions.md).
- Editing a skill's files – this shows them; use your editor or [Code Block](code-block.md) with Apply.

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Switch** `.ui-skd__switch` – on or off, named by the visible "Enabled"
2. **Facts** `.ui-skd__facts` – who made it and the version, with `.ui-skd__badge` when an update is out
3. **When it's used** `.ui-skd__triggers` – the phrases that make a model pick it
4. **Tools** `.ui-skd__tool` – each tool with its permission as a mark and a word; risky ones are marked with a triangle
5. **Files** `.ui-skd__files` – the list beside `.ui-skd__viewer`, a code block of the picked file
6. **Recent runs** `.ui-skd__run` – the outcome as a mark and a word, the agent, a note and when
7. **Confirmation** `.ui-skd__confirm` – before turning on a risky skill, and before removing one
8. **Actions** `.ui-skd__actions` – Update, Export and Remove

## Looks

Standard puts the header on the gray tray above a white card; tools are filled chips and the update badge a filled
pill. Clean is one white card with the header as its first row, outlined chips and an outlined badge, and thinner icons.
`--tc-skd-files-w` sets the file list's width and `--tc-skd-mark` the size of the status marks.

## Usage

### HTML

```html
<tc-skill-detail id="skill" heading="Contract reviewer" author="Your team" version="1.4.0" available="1.5.0"></tc-skill-detail>

<script type="module">
  import "@adamstavely/trenchcoat/skill-detail";
  import "@adamstavely/trenchcoat/tokens.css";

  const skill = document.querySelector("#skill");
  skill.description = "Checks a supplier contract against the procurement playbook.";
  skill.triggers = ["Asked to review or mark up a contract"];
  skill.tools = [
    { name: "read_file", permission: "read" },
    { name: "clause_check.py", permission: "run" },
  ];
  skill.files = [
    { path: "SKILL.md", content: "# Contract reviewer\n\nRead the contract, then run scripts/clause_check.py." },
    { path: "scripts/clause_check.py", content: "print('ok')" },
  ];
  skill.usedBy = ["Procurement assistant"];
  skill.addEventListener("tc-enabled-change", (e) => console.log("enabled", e.detail.enabled));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { SkillDetail, type SkillDetailFile, type SkillDetailTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Skill({ tools, files, remove }: { tools: SkillDetailTool[]; files: SkillDetailFile[]; remove: () => void }) {
  const [enabled, setEnabled] = useState(false);
  return <SkillDetail title="Contract reviewer" author="Your team" version="1.4.0" tools={tools} files={files} enabled={enabled} onEnabledChange={setEnabled} onRemove={() => remove()} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/skill-detail";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";

defineProps<{ triggers: TcSkillDetail["triggers"]; tools: TcSkillDetail["tools"] }>();
const onEnabledChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-skill-detail :triggers="triggers" :tools="tools" @tc-enabled-change="onEnabledChange"></tc-skill-detail>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SkillDetail } from "@adamstavely/trenchcoat/angular/skill-detail";
import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";

@Component({
  selector: "app-skill-detail-example",
  imports: [SkillDetail],
  template: `<tc-skill-detail [triggers]="triggers()" [tools]="tools()" (tc-enabled-change)="onEnabledChange($event)"></tc-skill-detail>`,
})
export class SkillDetailExample {
  readonly triggers = input.required<TcSkillDetail["triggers"]>();
  readonly tools = input.required<TcSkillDetail["tools"]>();
  onEnabledChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/skill-detail";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";

  let { triggers, tools }: { triggers: TcSkillDetail["triggers"]; tools: TcSkillDetail["tools"] } = $props();
  let el: TcSkillDetail;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-enabled-change", on);
    return () => el.removeEventListener("tc-enabled-change", on);
  });
</script>

<tc-skill-detail bind:this={el} {triggers} {tools}></tc-skill-detail>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `""` | The skill's name, shown as the heading |
| `description` | `description` | `string` | `""` | What it does, under the name |
| `author` | `author` | `string` | `""` | Who made it: "Built-in", "Your team", a plugin's name, "Community" |
| `version` | `version` | `string` | `""` | Its version, e.g. "1.4.0" |
| `available` | `available` | `string` | `""` | A newer version that's available, e.g. "1.5.0"; shows Update |
| `enabled` | `enabled` | `boolean` | `false` | It's on. Changed by the switch unless a tc-enabled-change listener calls preventDefault() |
| `triggers` | – | `string[]` | `[]` | When a model picks it: the phrases from its description |
| `tools` | – | `SkillDetailTool[]` | `[]` | The tools it may use, with what each is allowed to do |
| `files` | – | `SkillDetailFile[]` | `[]` | Its files, paths from the skill's root |
| `file` | `file` | `string \| null` | `null` | The file shown; null shows the first. Changed by picking unless a tc-file-change listener calls preventDefault() |
| `runs` | – | `SkillDetailRun[]` | `[]` | Recent runs, newest first |
| `usedBy` | – | `string[]` | `[]` | The agents that use it – named when removing |
| `noRemove` | `no-remove` | `boolean` | `false` | Hide Remove |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms, for "3 h ago"; without it, runs show their date |
| `locale` | `locale` | `string \| undefined` | `undefined` | For dates and relative times |
| `labels` | – | `Partial<SkillDetailLabels>` | `{}` | Words to rename, merged over defaultSkillDetailLabels; {name}, {version} and {agents} are filled in |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-enabled-change` | – | Yes | The skill was turned on or off ({ enabled }: SkillDetailEnabledChange); cancelable – prevented, `enabled` stays as it was. Turning on a risky skill fires it only after Turn on is pressed |
| `tc-file-change` | – | Yes | Another file was picked ({ file }: SkillDetailFileChange); cancelable – prevented, `file` stays as it was |
| `tc-update` | – | No | Update was pressed ({ version }: SkillDetailUpdate) |
| `tc-export` | – | No | Export was pressed (detail: {}) |
| `tc-remove` | – | Yes | Remove was confirmed ({ name, usedBy }: SkillDetailRemove); cancelable – prevented, nothing is announced |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-skd-files-w` | `200px` | both |
| `--tc-skd-mark` | `8px` | both |

#### Design tokens it reads (72)

`--tc-action-danger-bg`, `--tc-action-danger-fg`, `--tc-action-primary-bg`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-border-default`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-moderate`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-switch-h`, `--tc-switch-knob`, `--tc-switch-knob-bg`, `--tc-switch-off`, `--tc-switch-on`, `--tc-switch-radius`, `--tc-switch-w`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `skillRisks(tools: readonly SkillDetailTool[]): Exclude<SkillPermission, "read">[]` | The risky permissions among a skill's tools, in a fixed order |

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
| `triggers` | `el.triggers = …;` | `<… triggers={…} />` | `<tc-skill-detail :triggers="…">` | `<tc-skill-detail [triggers]="…">` | `<tc-skill-detail {triggers}>` |
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-skill-detail :tools="…">` | `<tc-skill-detail [tools]="…">` | `<tc-skill-detail {tools}>` |
| `files` | `el.files = …;` | `<… files={…} />` | `<tc-skill-detail :files="…">` | `<tc-skill-detail [files]="…">` | `<tc-skill-detail {files}>` |
| `runs` | `el.runs = …;` | `<… runs={…} />` | `<tc-skill-detail :runs="…">` | `<tc-skill-detail [runs]="…">` | `<tc-skill-detail {runs}>` |
| `usedBy` | `el.usedBy = …;` | `<… usedBy={…} />` | `<tc-skill-detail :usedBy="…">` | `<tc-skill-detail [usedBy]="…">` | `<tc-skill-detail {usedBy}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-skill-detail :labels="…">` | `<tc-skill-detail [labels]="…">` | `<tc-skill-detail {labels}>` |

*Also attributes: `heading`, `description`, `author`, `version`, `available`, `enabled`, `file`, `no-remove` and 2 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-enabled-change` | Yes | `el.addEventListener("tc-enabled-change", (e) => …)` | `onEnabledChange={…}` | `@tc-enabled-change="…"` | `(tc-enabled-change)="…($event)"` | `el.addEventListener("tc-enabled-change", …)` |
| `tc-file-change` | Yes | `el.addEventListener("tc-file-change", (e) => …)` | `ref.current.addEventListener("tc-file-change", …)` | `@tc-file-change="…"` | `(tc-file-change)="…($event)"` | `el.addEventListener("tc-file-change", …)` |
| `tc-update` | No | `el.addEventListener("tc-update", (e) => …)` | `onUpdate={…}` | `@tc-update="…"` | `(tc-update)="…($event)"` | `el.addEventListener("tc-update", …)` |
| `tc-export` | No | `el.addEventListener("tc-export", (e) => …)` | `onExport={…}` | `@tc-export="…"` | `(tc-export)="…($event)"` | `el.addEventListener("tc-export", …)` |
| `tc-remove` | Yes | `el.addEventListener("tc-remove", (e) => …)` | `onRemove={…}` | `@tc-remove="…"` | `(tc-remove)="…($event)"` | `el.addEventListener("tc-remove", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `enabled` and `file` itself unless a listener calls `preventDefault()` on `tc-enabled-change` or `tc-file-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-skill-detail id="skill-detail"></tc-skill-detail>

<script type="module">
  import "@adamstavely/trenchcoat/skill-detail";

  const el = document.querySelector("#skill-detail");
  el.addEventListener("tc-enabled-change", (e) => {
    e.preventDefault(); // the element keeps its enabled…
    if (allowed(e.detail.enabled)) el.enabled = e.detail.enabled; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { SkillDetail } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof SkillDetail>;
type Props = Omit<Own, "enabled" | "onEnabledChange"> & { initial: NonNullable<Own["enabled"]> };

// Controlled: passing enabled makes the wrapper prevent the element's own change; the app sets it
export function ControlledSkillDetail({ initial, ...props }: Props) {
  const [enabled, setEnabled] = useState<Own["enabled"]>(initial);
  return <SkillDetail {...props} enabled={enabled} onEnabledChange={(next) => setEnabled(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/skill-detail";
import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";

const props = defineProps<{ initial: TcSkillDetail["enabled"] }>();
const enabled = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onEnabledChange = (e: CustomEvent<{ enabled: TcSkillDetail["enabled"] }>) => {
  e.preventDefault();
  enabled.value = e.detail.enabled;
};
</script>

<template>
  <tc-skill-detail :enabled="enabled" @tc-enabled-change="onEnabledChange"></tc-skill-detail>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SkillDetail } from "@adamstavely/trenchcoat/angular/skill-detail";
import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";

@Component({
  selector: "app-controlled-skill-detail",
  imports: [SkillDetail],
  template: `<tc-skill-detail [enabled]="enabled()" (tc-enabled-change)="onEnabledChange($event)"></tc-skill-detail>`,
})
export class ControlledSkillDetail {
  readonly initial = input.required<TcSkillDetail["enabled"]>();
  readonly enabled = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onEnabledChange(e: CustomEvent<{ enabled: TcSkillDetail["enabled"] }>) {
    e.preventDefault();
    this.enabled.set(e.detail.enabled);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/skill-detail";
  import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";

  let { initial }: { initial: TcSkillDetail["enabled"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let enabled = $derived(initial);
  let el: TcSkillDetail;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      enabled = (e as CustomEvent<{ enabled: TcSkillDetail["enabled"] }>).detail.enabled;
    };
    el.addEventListener("tc-enabled-change", on);
    return () => el.removeEventListener("tc-enabled-change", on);
  });
</script>

<tc-skill-detail bind:this={el} {enabled}></tc-skill-detail>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-skill-detail")` returns a `TcSkillDetail` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";`
- **React / Next.js:** Props: `import type { SkillDetailProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SkillDetail>`. The element class, for refs: `import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSkillDetail["triggers"]` with `import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";`
- **Angular:** The directive types the template: `[triggers]` takes `TcSkillDetail["triggers"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSkillDetail } from "@adamstavely/trenchcoat/skill-detail";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The skill's name, shown as the heading |
| `enabled` | `boolean` | It's on – controlled when given |
| `defaultEnabled` | `boolean` | Whether it's on at mount, when `enabled` isn't controlled |
| `onEnabledChange` | `(enabled: boolean) => void` | Called when it's turned on (after a risky skill's Turn on) or off |
| `file` | `string \| null` | The file shown, or null for the first – controlled when given |
| `defaultFile` | `string \| null` | The file shown at mount, when `file` isn't controlled |
| `onFileChange` | `(file: string) => void` | Called with the path of the file picked |
| `onUpdate` | `(version: string) => void` | Update was pressed: install `version` |
| `onExport` | `() => void` | Export was pressed |
| `onRemove` | `(name: string, usedBy: string[]) => boolean \| void` | Remove was confirmed: remove it; return false to skip the announcement |

*Renamed or hidden on the wrapper: `heading`, `enabled`, `file`, `children`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switch, the file list (one tab stop), the code block, then Update, Export and Remove |
| Enter / Space | On the switch, turns the skill off, or on – asking first if it's risky |
| ↑ / ↓ | In the file list, picks the previous or next file |
| Home / End | In the file list, the first or last file |
| Escape | In a confirmation, cancels; focus returns to the switch or Remove |

Opening a confirmation moves focus into it: to Turn on for a risky skill, to Cancel for Remove.

### Screen readers

The host is a region named by the skill. The switch is named "Enabled" and reports on or off; while the risk
confirmation is open it's `aria-expanded`. Each section is labelled by its heading. The files are a listbox, with each
folder a group named by its path. A confirmation is a group named by its question ("Turn on Contract reviewer?") and
described by what it would allow or who would lose it. Outcomes and permissions are words, not just colours. Changes are
announced politely: "Contract reviewer is on.", "Contract reviewer removed."

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | inline-diff, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, code-block, inline-diff | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | inline-diff, internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, code-block, internal/kit, inline-diff | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | inline-diff | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | code-block | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 27.9 KB | 8.2 KB |
| Lit · the library every element is built on, the parts it uses | 20.0 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.4 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| **Added to a page that already has Lit** | **112.1 KB** | **29.3 KB** |
| With Lit – the first component on a page | 132.8 KB | 36.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **2.1 ms** | the gallery demo's data, 182 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of tools replaced |
| First on the page | 12 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.6 ms | tools: first render, 662 nodes; update 0.4 ms |
| 1,000 items | 26 ms | tools: first render, 5,162 nodes; update 1.8 ms |

1,000 items of tools: 26 ms, 5,162 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout` (code-block), `setTimeout` (inline-diff).
- 2 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Put the description's trigger phrases in `triggers`, as people would say them.
- Give every tool a `permission`; pick the strongest thing it can do – a tool that reads and writes is "write".
- Pass file contents as text; Markdown shows as written. Big files: pass the first part and say so in the content.
- Pass `usedBy` so Remove can name what stops working.

## Do and don't

### Do

- Let people read the files before turning a skill on.
- Keep `runs` to the last few – newest first – with a note when one failed.

### Don't

- Don't skip the confirmation for risky skills by setting `enabled` straight from elsewhere without telling people what
  it can do.
- Don't show secrets in file contents – the viewer shows exactly what you pass.

## Related

- [Skill Library](skill-library.md) – The skills a workspace has added, grouped by who made them – Built-in, your team, each plugin, the community – with a switch each, when it runs and when it was last used, Update when a newer version is out, search and source and on/off filters, and Add skill (Upload, From a URL, Create)
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [MCP connection manager](mcp-connection-manager.md) – MCP servers at a glance – status and what each exposes; add one (transport, auth, test), inspect its tools, resources and prompts, connect, retry and remove
