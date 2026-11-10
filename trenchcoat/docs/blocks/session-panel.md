<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Session Panel

**Blocks** · New

The side panel of a working session – tools, where it runs, how full its context is, its connectors, outputs, subagents and background tasks, and the changes it has made (uses `tc-panel-card`, `tc-subagent-list`).

- **Element:** `<tc-session-panel>`
- **Size:** 26.6 KB gzip · 104.8 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/session-panel";` |
| React / Next.js | `import { SessionPanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/session-panel";` · tags starting with tc- are custom elements |
| Angular | `import { SessionPanel } from "@adamstavely/trenchcoat/angular/session-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/session-panel";` |

## Example

The live example is in the gallery at `#/blocks/session-panel`, in both looks; Replay restarts its animations.

## Overview

The side panel of a working session: a rail of tools, where the session runs, how full its context is, its connectors,
outputs, the subagents it started and its background tasks, and the changes it has made. Environment, Subagents and
Changes fold open here; the other sections are rows that tell the page to open their details.

### When to use

- A coding or agent workspace, beside the conversation or the work.
- The right side of `app-shell-workspace`.

### When not to use

- One agent's progress – use [Agent Monitor](../components/agent-monitor.md).
- A list of long-running jobs by itself – use [Background Tasks](../components/background-tasks.md).
- The terms a session was given – use [Session Context Bar](../components/session-context-bar.md).

## Anatomy

1. **Stack** `.ui-ssp__stack` – the sections, in order
2. **Rail** `.ui-ssp__rail` – the tools
3. **Section** `.ui-ssp__section` – Environment, Subagents or Changes, which fold
4. **Row** `.ui-ssp__row` – Context, Connectors, Outputs or Background tasks, which open elsewhere

## Looks

Each section is a `tc-panel-card`, so Standard puts it on the gray tray and Clean makes it one white card. Its contents
are drawn `bare`, so nothing looks doubled.

## Usage

### HTML

```html
<tc-session-panel id="panel" outputs="51" background="4 running" connectors="3 to reconnect" context="0.17"></tc-session-panel>

<script type="module">
  import "@adamstavely/trenchcoat/session-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#panel");
  panel.environment = [{ id: "repo", kind: "repo", label: "institute/sample-tracker" }];
  panel.addEventListener("tc-section-open", (e) => console.log(e.detail.section));
</script>
```

### React / Next.js

```tsx
import { SessionPanel } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Side({ onOpen }: { onOpen: (section: string) => void }) {
  return (
    <SessionPanel
      environment={[{ id: "repo", kind: "repo", label: "institute/sample-tracker" }]}
      context={0.17}
      outputs="51"
      subagents={[{ id: "tests", name: "Write tests for notify()", status: "running", startedAt: Date.now() - 40_000 }]}
      onSubagentChange={(id) => id && onOpen(`subagent:${id}`)}
      changes={[{ id: "a", title: "Alert on freezer gaps", repo: "sample-tracker", number: 214, state: "open" }]}
      onTcSectionOpen={(e) => onOpen(e.detail.section)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/session-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";

defineProps<{ tools: TcSessionPanel["tools"]; moreTools: TcSessionPanel["moreTools"] }>();
const onSectionsChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-session-panel :tools="tools" :moreTools="moreTools" @tc-sections-change="onSectionsChange"></tc-session-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { SessionPanel } from "@adamstavely/trenchcoat/angular/session-panel";
import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";

@Component({
  selector: "app-session-panel-example",
  imports: [SessionPanel],
  template: `<tc-session-panel [tools]="tools()" [moreTools]="moreTools()" (tc-sections-change)="onSectionsChange($event)"></tc-session-panel>`,
})
export class SessionPanelExample {
  readonly tools = input.required<TcSessionPanel["tools"]>();
  readonly moreTools = input.required<TcSessionPanel["moreTools"]>();
  onSectionsChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";

  let { tools, moreTools }: { tools: TcSessionPanel["tools"]; moreTools: TcSessionPanel["moreTools"] } = $props();
  let el: TcSessionPanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-sections-change", on);
    return () => el.removeEventListener("tc-sections-change", on);
  });
</script>

<tc-session-panel bind:this={el} {tools} {moreTools}></tc-session-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `tools` | – | `IconRailItem[]` | `[]` | The tool buttons at the top; without any, the rail is left out |
| `tool` | `tool` | `string \| null` | `null` | The id of the chosen tool. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `moreTools` | – | `IconRailMoreItem[]` | `[]` | The rail's More menu |
| `environment` | – | `EnvironmentItem[]` | `[]` | Where the session runs |
| `toggles` | – | `Record<string, boolean>` | `{}` | The environment rows' switches. Changed by the user unless a tc-toggles-change listener calls preventDefault() |
| `context` | `context` | `number \| undefined` | `undefined` | How full the context is, from 0 to 1; without it, the row is left out |
| `connectors` | `connectors` | `string \| undefined` | `undefined` | The Connectors row's value, such as "14 to reconnect"; without it, the row is left out |
| `outputs` | `outputs` | `string \| undefined` | `undefined` | The Outputs row's value, such as "51"; without it, the row is left out |
| `subagents` | – | `Subagent[]` | `[]` | The subagents the session started; without any, the section is left out |
| `subagent` | `subagent` | `string \| null` | `null` | The id of the chosen subagent. Changed by the user unless a tc-subagent-change listener calls preventDefault() |
| `now` | `now` | `number \| undefined` | `undefined` | The time now for the subagents' clocks, epoch ms; by default the list's own clock, which ticks |
| `changes` | – | `ChangeItem[]` | `[]` | The changes the session has made |
| `changeActions` | – | `ChangeRowAction[]` | `[]` | The menu on each change |
| `changeLimit` | `change-limit` | `number` | `5` | How many changes show before Show more |
| `background` | `background` | `string \| undefined` | `undefined` | The Background tasks row's value, such as "4 running"; without it, the row is left out |
| `sections` | – | `SessionPanelSection[]` | `["environment", "subagents", "changes"]` | The sections folded open. Changed by the user unless a tc-sections-change listener calls preventDefault() |
| `labels` | – | `Partial<SessionPanelLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-sections-change` | – | Yes | A section folded open or shut ({ sections, section, expanded }: SessionPanelSectionsChange); cancelable – prevented, `sections` stays as it was |
| `tc-section-open` | – | No | A row that opens details elsewhere was pressed ({ section }: SessionPanelSectionOpen) |
| `tc-subagent-change` | – | Yes | A subagent was chosen ({ subagent, agent }: SessionPanelSubagentChange); cancelable – prevented, `subagent` stays as it was |

#### Design tokens it reads (5)

`--tc-font-sans`, `--tc-font-size-sm`, `--tc-line-height-normal`, `--tc-space-3`, `--tc-text-primary`

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
| `tools` | `el.tools = …;` | `<… tools={…} />` | `<tc-session-panel :tools="…">` | `<tc-session-panel [tools]="…">` | `<tc-session-panel {tools}>` |
| `moreTools` | `el.moreTools = …;` | `<… moreTools={…} />` | `<tc-session-panel :moreTools="…">` | `<tc-session-panel [moreTools]="…">` | `<tc-session-panel {moreTools}>` |
| `environment` | `el.environment = …;` | `<… environment={…} />` | `<tc-session-panel :environment="…">` | `<tc-session-panel [environment]="…">` | `<tc-session-panel {environment}>` |
| `toggles` | `el.toggles = …;` | `<… toggles={…} />` | `<tc-session-panel :toggles="…">` | `<tc-session-panel [toggles]="…">` | `<tc-session-panel {toggles}>` |
| `subagents` | `el.subagents = …;` | `<… subagents={…} />` | `<tc-session-panel :subagents="…">` | `<tc-session-panel [subagents]="…">` | `<tc-session-panel {subagents}>` |
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-session-panel :changes="…">` | `<tc-session-panel [changes]="…">` | `<tc-session-panel {changes}>` |
| `changeActions` | `el.changeActions = …;` | `<… changeActions={…} />` | `<tc-session-panel :changeActions="…">` | `<tc-session-panel [changeActions]="…">` | `<tc-session-panel {changeActions}>` |
| `sections` | `el.sections = …;` | `<… sections={…} />` | `<tc-session-panel :sections="…">` | `<tc-session-panel [sections]="…">` | `<tc-session-panel {sections}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-session-panel :labels="…">` | `<tc-session-panel [labels]="…">` | `<tc-session-panel {labels}>` |

*Also attributes: `tool`, `context`, `connectors`, `outputs`, `subagent`, `now`, `change-limit`, `background` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-sections-change` | Yes | `el.addEventListener("tc-sections-change", (e) => …)` | `ref.current.addEventListener("tc-sections-change", …)` | `@tc-sections-change="…"` | `(tc-sections-change)="…($event)"` | `el.addEventListener("tc-sections-change", …)` |
| `tc-section-open` | No | `el.addEventListener("tc-section-open", (e) => …)` | `onTcSectionOpen={…}` | `@tc-section-open="…"` | `(tc-section-open)="…($event)"` | `el.addEventListener("tc-section-open", …)` |
| `tc-subagent-change` | Yes | `el.addEventListener("tc-subagent-change", (e) => …)` | `ref.current.addEventListener("tc-subagent-change", …)` | `@tc-subagent-change="…"` | `(tc-subagent-change)="…($event)"` | `el.addEventListener("tc-subagent-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `subagent` and `sections` itself unless a listener calls `preventDefault()` on `tc-subagent-change` or `tc-sections-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-session-panel id="session-panel"></tc-session-panel>

<script type="module">
  import "@adamstavely/trenchcoat/session-panel";

  const el = document.querySelector("#session-panel");
  el.addEventListener("tc-subagent-change", (e) => {
    e.preventDefault(); // the element keeps its subagent…
    if (allowed(e.detail.subagent)) el.subagent = e.detail.subagent; // …until the app sets it
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
import "@adamstavely/trenchcoat/session-panel";
import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";

const props = defineProps<{ initial: TcSessionPanel["subagent"] }>();
const subagent = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSubagentChange = (e: CustomEvent<{ subagent: TcSessionPanel["subagent"] }>) => {
  e.preventDefault();
  subagent.value = e.detail.subagent;
};
</script>

<template>
  <tc-session-panel :subagent="subagent" @tc-subagent-change="onSubagentChange"></tc-session-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { SessionPanel } from "@adamstavely/trenchcoat/angular/session-panel";
import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";

@Component({
  selector: "app-controlled-session-panel",
  imports: [SessionPanel],
  template: `<tc-session-panel [subagent]="subagent()" (tc-subagent-change)="onSubagentChange($event)"></tc-session-panel>`,
})
export class ControlledSessionPanel {
  readonly initial = input.required<TcSessionPanel["subagent"]>();
  readonly subagent = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSubagentChange(e: CustomEvent<{ subagent: TcSessionPanel["subagent"] }>) {
    e.preventDefault();
    this.subagent.set(e.detail.subagent);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/session-panel";
  import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";

  let { initial }: { initial: TcSessionPanel["subagent"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let subagent = $derived(initial);
  let el: TcSessionPanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      subagent = (e as CustomEvent<{ subagent: TcSessionPanel["subagent"] }>).detail.subagent;
    };
    el.addEventListener("tc-subagent-change", on);
    return () => el.removeEventListener("tc-subagent-change", on);
  });
</script>

<tc-session-panel bind:this={el} {subagent}></tc-session-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-session-panel")` returns a `TcSessionPanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";`
- **React / Next.js:** Props: `import type { SessionPanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof SessionPanel>`. The element class, for refs: `import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcSessionPanel["tools"]` with `import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";`
- **Angular:** The directive types the template: `[tools]` takes `TcSessionPanel["tools"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcSessionPanel } from "@adamstavely/trenchcoat/session-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `tool` | `string \| null` | The id of the chosen tool – controlled when given |
| `defaultTool` | `string \| null` | The tool on mount when `tool` isn't controlled |
| `onToolChange` | `(tool: string \| null) => void` | A tool was chosen or cleared |
| `toggles` | `Record<string, boolean>` | The environment rows' switches – controlled when given |
| `defaultToggles` | `Record<string, boolean>` | The switches on mount when `toggles` isn't controlled |
| `onTogglesChange` | `(toggles: Record<string, boolean>) => void` | A switch changed |
| `sections` | `SessionPanelSection[]` | The sections folded open – controlled when given |
| `defaultSections` | `SessionPanelSection[]` | The open sections on mount when `sections` isn't controlled |
| `onSectionsChange` | `(sections: SessionPanelSection[]) => void` | A section folded open or shut |
| `subagent` | `string \| null` | The chosen subagent's id – controlled when given |
| `defaultSubagent` | `string \| null` | The chosen subagent on mount when `subagent` isn't controlled |
| `onSubagentChange` | `(subagent: string \| null, agent: Subagent \| null) => void` | A subagent was chosen |

*Renamed or hidden on the wrapper: `tool`, `toggles`, `sections`, `subagent`, `children`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

The panel follows tab order, one stop per control.

| Key | What it does |
|---|---|
| Tab | Moves between the rail, the sections and what's inside them |
| Arrows, Home, End | Move along the rail |
| Enter / Space | Choose a tool, fold a section, or open a row |

### Screen readers

The rail is a named `toolbar`. Sections are buttons with `aria-expanded`. Context is a `meter` with its value in words.
Each change says its state, not only its colour. Subagents are a `tc-subagent-list`: groups named with their count, each
agent a button that says whether it's running, waiting, finished, failed or stopped, and agents that finish or fail are
announced.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | internal/settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | change-list | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | change-list, check-status, internal/kit, environment-list, internal/settings, icon-rail, meter-row, panel-card, subagent-list | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | environment-list | – |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | internal/settings | – |
| inset | 87 | 66 | 14.1 | 14.1 | internal/popover, meter-row, panel-card | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | icon-rail | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, change-list, check-status, internal/base, environment-list, internal/settings, icon-rail, meter-row, panel-card, subagent-list, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | change-list, check-status, internal/card-head, internal/kit, internal/popover, environment-list, icon-rail, meter-row, panel-card, subagent-list, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-08 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 8.2 KB | 3.2 KB |
| Lit · the library every element is built on, the parts it uses | 22.1 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| [subagent-list](../components/subagent-list.md) · Element it renders | 13.1 KB | – |
| [change-list](../components/change-list.md) · Element it renders | 12.5 KB | – |
| [check-status](../components/check-status.md) · Element it renders | 10.4 KB | – |
| [icon-rail](../components/icon-rail.md) · Element it renders | 8.8 KB | – |
| [environment-list](../components/environment-list.md) · Element it renders | 6.4 KB | – |
| [meter-row](../components/meter-row.md) · Element it renders | 6.3 KB | – |
| [panel-card](../components/panel-card.md) · Element it renders | 6.1 KB | – |
| [switch](../components/switch.md) · Element it renders | 0.7 KB | – |
| **Added to a page that already has Lit** | **104.8 KB** | **26.6 KB** |
| With Lit – the first component on a page | 126.9 KB | 34.0 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.3 ms** | default properties, 1 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 2.0 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setTimeout` (internal/popover – PopoverController), `setInterval, cleared` (subagent-list).
- 1 infinite CSS animation.
- Stops or pauses in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `document pointerdown` (icon-rail), `document visibilitychange` (subagent-list).
- Reads the clock: `Date.now()` (subagent-list).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Give each row's value in a few words, such as "14 to reconnect" or "4 running". Leave out a value to leave out its row.
`subagents` takes the session's sub-agents, newest first; the section's value counts the active ones ("1 active") or,
with none running, all of them. Pass `now` to hold their clocks still.

## Do and don't

### Do

- Listen for `tc-section-open` and open your details, such as `tc-context-map`, `tc-artifact-panel` or `tc-background-tasks`.
- Listen for the contained elements' events here: `tc-selected-change`, `tc-toggles-change`, `tc-action`, `tc-open`.
- Listen for `tc-subagent-change` to open the chosen subagent's transcript – the list's own `tc-selected-change` stops at
  the panel, so it's never mistaken for the rail's.

### Don't

- Don't put it in a narrow space that clips: the rail's tooltips and menu are drawn just outside it.

## Related

- [Panel Card](../components/panel-card.md) – One section of a side panel – a heading, a short value and content that glides open and shut, or a row that opens something else.
- [Icon Rail](../components/icon-rail.md) – A row of icon buttons for a panel – one chosen, a tooltip on each, one tab stop, and an optional More menu.
- [Environment List](../components/environment-list.md) – Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.
- [Subagent List](../components/subagent-list.md) – The sub-agents a session started, grouped Active and Done with counts – each with its own drawn mark, what it's doing now, and a clock that ticks while it runs or how long ago it finished; waiting and failed in words, choose one to open it
- [Change List](../components/change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
