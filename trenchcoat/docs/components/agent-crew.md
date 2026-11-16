<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Crew

**Agents** · New

A lead agent and its sub-agents as one live tree of cards, every agent on screen – what each does now, its context in words and a bar, its tools and the last thing it was handed; handoffs run as a light along the connectors and light up the card they reach, a click opens the agent to steer, pause or resume it, and tabs switch between projects

- **Element:** `<tc-agent-crew>`
- **Size:** 10.9 KB gzip · 36.2 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-crew";` |
| React / Next.js | `import { AgentCrew } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-crew";` · tags starting with tc- are custom elements |
| Angular | `import { AgentCrew } from "@adamstavely/trenchcoat/angular/agent-crew";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-crew";` |

## Example

The live example is in the gallery at `#/agent-crew`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A lead agent and its sub-agents as one live tree of cards, where every agent stays on screen – working or resting.
Each card says who the agent is and its job, what it does right now (or that it's resting), how full its context
window is in words and a bar, the tools it works with, and the last thing it was handed and by whom.

When one agent hands work to another, a light runs along the connector between them and the card it reaches lights
up for a moment; the handoff is announced too. Choosing a card opens its detail under the tree – task, model, usage
and every tool – with a note to steer it and Pause or Resume. Pass several projects and a row of tabs switches
between their crews.

### When to use

- A multi-agent run where every agent should stay in view – who works right now, who rests, who hands what to whom.
- A dashboard or side panel that shows, per agent, what it's doing, how full its context is and what it was handed.
- Watching several projects' crews from one place and stepping in where an agent needs you.

### When not to use

- Agents that come and go, with cost and time per card and folding branches – use [Agent Tree](agent-tree.md).
- Several independent orchestrators side by side – use [Agent Fleet](agent-fleet.md).
- What the agents actually say to each other – use [Collaboration Stream](collaboration-stream.md).
- A short list of a session's helpers in a narrow panel – use [Subagent List](subagent-list.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Header** `.ui-crew__count` – the heading with how many agents are working
2. **Project tabs** `.ui-crew__tabs` – one `.ui-crew__tab` per project, when there are several
3. **Tree** `.ui-crew__tree` – the lead `.ui-crew__lead` over its sub-agents `.ui-crew__level`, helpers hanging in `.ui-crew__below`
4. **Connectors** `.ui-crew__link` – rounded lines from each agent to its sub-agents; `.ui-crew__light` runs along one on a handoff
5. **Card** `.ui-crew__node` – one agent; `data-status` says what it's doing, `data-lit` while a handoff reaches it
6. **Name** `.ui-crew__open` – the button that opens the detail, with `.ui-crew__role` under it
7. **Status** `.ui-crew__status` – a mark and a word: Working, Resting, Needs you, Paused, Failed, Done
8. **Doing** `.ui-crew__doing` – what it does right now, or Resting
9. **Context** `.ui-crew__context` – "62% of context" and a bar, amber from 75%, red from 90%
10. **Tools** `.ui-crew__tool` – up to three chips and "+N"
11. **Last handed** `.ui-crew__handed` – the newest work handed to it, and from whom
12. **Detail** `.ui-crew__detail` – task, model, usage and tools, the steering field `.ui-crew__input`, Pause or Resume

## Looks

Standard puts the header on the gray tray above a white card holding the tree; Clean is one white card with the
header as its first row. Wide, the lead sits over its sub-agents side by side and the tree scrolls sideways if it
doesn't fit; under 440 px every level becomes an indented list. `--tc-crew-card-w`, `--tc-crew-indent` and
`--tc-crew-link` size the cards and colour the connectors.

## Usage

### HTML

```html
<tc-agent-crew id="crew" heading="Grant crew"></tc-agent-crew>

<script type="module">
  import "@adamstavely/trenchcoat/agent-crew";
  import "@adamstavely/trenchcoat/tokens.css";

  const crew = document.querySelector("#crew");
  crew.projects = [
    {
      id: "grant",
      name: "Library grant",
      lead: {
        id: "lead", name: "Lead", role: "Plans and assembles", status: "working", doing: "Merging the needs statement", context: 0.48, tools: ["Docs"],
        children: [
          { id: "research", name: "Researcher", role: "Finds the evidence", status: "working", doing: "Reading the census tables", context: 0.81, tools: ["Web search", "Sheets"] },
          { id: "budget", name: "Budget", role: "Costs the project", status: "waiting", doing: "Needs the opening hours", context: 0.34, tools: ["Sheets"] },
          { id: "editor", name: "Editor", role: "Writes it up", status: "resting", context: 0.07, tools: ["Docs"] },
        ],
      },
      handoffs: [{ id: "h1", from: "lead", to: "research", what: "Questions about local need" }],
    },
  ];
  crew.addEventListener("tc-steer", (e) => console.log(e.detail.agent.name, e.detail.note));
</script>
```

### React / Next.js

```tsx
import { AgentCrew, type CrewProject } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Crew({ projects, steer }: { projects: CrewProject[]; steer: (agentId: string, note: string) => void }) {
  return <AgentCrew title="Crew" projects={projects} onSteer={(agent, note) => steer(agent.id, note)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-crew";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";

defineProps<{ projects: TcAgentCrew["projects"]; formatCost: TcAgentCrew["formatCost"] }>();
const onProjectChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-crew :projects="projects" :formatCost="formatCost" @tc-project-change="onProjectChange"></tc-agent-crew>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentCrew } from "@adamstavely/trenchcoat/angular/agent-crew";
import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";

@Component({
  selector: "app-agent-crew-example",
  imports: [AgentCrew],
  template: `<tc-agent-crew [projects]="projects()" [formatCost]="formatCost()" (tc-project-change)="onProjectChange($event)"></tc-agent-crew>`,
})
export class AgentCrewExample {
  readonly projects = input.required<TcAgentCrew["projects"]>();
  readonly formatCost = input.required<TcAgentCrew["formatCost"]>();
  onProjectChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-crew";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";

  let { projects, formatCost }: { projects: TcAgentCrew["projects"]; formatCost: TcAgentCrew["formatCost"] } = $props();
  let el: TcAgentCrew;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-project-change", on);
    return () => el.removeEventListener("tc-project-change", on);
  });
</script>

<tc-agent-crew bind:this={el} {projects} {formatCost}></tc-agent-crew>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Crew"` | The heading; empty leaves the header out |
| `projects` | – | `CrewProject[]` | `[]` | One crew per project; with more than one, tabs switch between them |
| `project` | `project` | `string \| null` | `null` | The shown project's id – the first when unset. Changed by the tabs unless tc-project-change is prevented |
| `opened` | `opened` | `string \| null` | `null` | The agent whose detail is open, or null. Changed by the cards unless tc-opened-change is prevented |
| `formatCost` | – | `(amount: number) => string` | `dollars` | Formats costs in the detail – defaults to dollars, "$0.42" |
| `labels` | – | `Partial<AgentCrewLabels>` | `{}` | The words it uses, merged over the defaults |
| `current` | – | `CrewProject \| undefined` | – | The project shown |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-project-change` | – | Yes | A project tab was chosen ({ project, item }: AgentCrewProjectChange); cancelable – prevented, `project` stays as it was |
| `tc-opened-change` | – | Yes | An agent's detail was opened or closed ({ opened, agent }: AgentCrewOpenedChange); cancelable – prevented, `opened` stays as it was |
| `tc-steer` | – | Yes | A note to steer an agent was sent ({ agent, note }: AgentCrewSteer); cancelable – prevented, the note stays in the field |
| `tc-pause` | – | No | Pause was pressed for an agent ({ agent }: AgentCrewAgentEvent) |
| `tc-resume` | – | No | Resume was pressed for an agent ({ agent }: AgentCrewAgentEvent) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-crew-card-w` | `214px` | standard, clean |
| `--tc-crew-indent` | `var(--tc-space-7)` | standard, clean |
| `--tc-crew-link` | `var(--tc-accent-solid)` | standard, clean |

#### Design tokens it reads (78)

`--tc-accent-solid`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-card-shadow-hover`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-crew-fill`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-shimmer`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-badge`, `--tc-radius-full`, `--tc-shadow-raised-hover`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-10`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `projects` | `el.projects = …;` | `<… projects={…} />` | `<tc-agent-crew :projects="…">` | `<tc-agent-crew [projects]="…">` | `<tc-agent-crew {projects}>` |
| `formatCost` | `el.formatCost = …;` | `<… formatCost={…} />` | `<tc-agent-crew :formatCost="…">` | `<tc-agent-crew [formatCost]="…">` | `<tc-agent-crew {formatCost}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-crew :labels="…">` | `<tc-agent-crew [labels]="…">` | `<tc-agent-crew {labels}>` |

*Also attributes: `heading`, `project`, `opened` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-project-change` | Yes | `el.addEventListener("tc-project-change", (e) => …)` | `ref.current.addEventListener("tc-project-change", …)` | `@tc-project-change="…"` | `(tc-project-change)="…($event)"` | `el.addEventListener("tc-project-change", …)` |
| `tc-opened-change` | Yes | `el.addEventListener("tc-opened-change", (e) => …)` | `ref.current.addEventListener("tc-opened-change", …)` | `@tc-opened-change="…"` | `(tc-opened-change)="…($event)"` | `el.addEventListener("tc-opened-change", …)` |
| `tc-steer` | Yes | `el.addEventListener("tc-steer", (e) => …)` | `onSteer={…}` | `@tc-steer="…"` | `(tc-steer)="…($event)"` | `el.addEventListener("tc-steer", …)` |
| `tc-pause` | No | `el.addEventListener("tc-pause", (e) => …)` | `onPauseAgent={…}` | `@tc-pause="…"` | `(tc-pause)="…($event)"` | `el.addEventListener("tc-pause", …)` |
| `tc-resume` | No | `el.addEventListener("tc-resume", (e) => …)` | `onResumeAgent={…}` | `@tc-resume="…"` | `(tc-resume)="…($event)"` | `el.addEventListener("tc-resume", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `project` and `opened` itself unless a listener calls `preventDefault()` on `tc-project-change` or `tc-opened-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-crew id="agent-crew"></tc-agent-crew>

<script type="module">
  import "@adamstavely/trenchcoat/agent-crew";

  const el = document.querySelector("#agent-crew");
  el.addEventListener("tc-project-change", (e) => {
    e.preventDefault(); // the element keeps its project…
    if (allowed(e.detail.project)) el.project = e.detail.project; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-crew";
import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";

const props = defineProps<{ initial: TcAgentCrew["project"] }>();
const project = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onProjectChange = (e: CustomEvent<{ project: TcAgentCrew["project"] }>) => {
  e.preventDefault();
  project.value = e.detail.project;
};
</script>

<template>
  <tc-agent-crew :project="project" @tc-project-change="onProjectChange"></tc-agent-crew>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentCrew } from "@adamstavely/trenchcoat/angular/agent-crew";
import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";

@Component({
  selector: "app-controlled-agent-crew",
  imports: [AgentCrew],
  template: `<tc-agent-crew [project]="project()" (tc-project-change)="onProjectChange($event)"></tc-agent-crew>`,
})
export class ControlledAgentCrew {
  readonly initial = input.required<TcAgentCrew["project"]>();
  readonly project = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onProjectChange(e: CustomEvent<{ project: TcAgentCrew["project"] }>) {
    e.preventDefault();
    this.project.set(e.detail.project);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-crew";
  import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";

  let { initial }: { initial: TcAgentCrew["project"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let project = $derived(initial);
  let el: TcAgentCrew;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      project = (e as CustomEvent<{ project: TcAgentCrew["project"] }>).detail.project;
    };
    el.addEventListener("tc-project-change", on);
    return () => el.removeEventListener("tc-project-change", on);
  });
</script>

<tc-agent-crew bind:this={el} {project}></tc-agent-crew>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-crew")` returns a `TcAgentCrew` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";`
- **React / Next.js:** Props: `import type { AgentCrewProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentCrew>`. The element class, for refs: `import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentCrew["projects"]` with `import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";`
- **Angular:** The directive types the template: `[projects]` takes `TcAgentCrew["projects"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentCrew } from "@adamstavely/trenchcoat/agent-crew";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out (default "Crew") |
| `project` | `string \| null` | The shown project's id – controlled when given |
| `defaultProject` | `string \| null` | The project shown at first, when `project` isn't controlled |
| `onProjectChange` | `(project: string \| null, item?: CrewProject) => void` | A project tab was chosen |
| `opened` | `string \| null` | The agent whose detail is open – controlled when given |
| `defaultOpened` | `string \| null` | The agent open at first, when `opened` isn't controlled |
| `onOpenedChange` | `(opened: string \| null, agent: CrewAgent \| null) => void` | An agent's detail was opened or closed |
| `onSteer` | `(agent: CrewAgent, note: string) => void \| boolean` | A note to steer an agent; return false to keep the note in the field |
| `onPauseAgent` | `(agent: CrewAgent) => void` | Pause was pressed for an agent |
| `onResumeAgent` | `(agent: CrewAgent) => void` | Resume was pressed for an agent |

*Renamed or hidden on the wrapper: `heading`, `project`, `opened`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Into the crew, onto the open agent (or the lead), then the detail |
| ↑ / ↓ / ← / → | The previous or next agent, in reading order |
| Home / End | The lead, or the last agent |
| Enter / Space | Opens or closes the agent's detail |
| Escape | In the detail: closes it, back to the card |
| ← / → on the tabs | The previous or next project |

### Screen readers

Each agent's name is a button named by its name and status ("Budget, Needs you"), with `aria-expanded` and
`aria-controls` pointing at the detail. The sub-agents are a list named after the lead; tools are a list named
"Researcher: Tools". The context bar is a meter named "Researcher: 81% of context". Connectors and the light are
decorative. A polite status region announces every handoff ("Lead handed Budget: Opening hours, 2026"). The project
switcher is a tablist.

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
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-16 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 28.8 KB | 8.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.4 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **36.2 KB** | **10.9 KB** |
| With Lit – the first component on a page | 58.9 KB | 18.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.8 ms** | the gallery demo's data, 156 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of projects replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.9 ms | projects: first render, 254 nodes; update 0.2 ms |
| 1,000 items | 12 ms | projects: first render, 1,154 nodes; update 1.2 ms |

1,000 items of projects: 12 ms, 1,154 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`.
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Names are short and roles say the job: "Researcher – Finds the evidence".
- `doing` is a short present-tense line: "Reading the 2025 census tables". For an agent that needs you, say what for.
- A handoff's `what` names the work, not the act: "Census figures to recheck".
- Reword everything with `labels`, including `context` ("{percent}% of context") and `handoff`.

## Do and don't

### Do

- Keep resting agents on screen – that they're idle is part of the picture.
- Add handoffs as they happen, so the light shows the work moving.

### Don't

- Don't use it for dozens of agents – group them, or use `agent-tree` with folding.
- Don't colour cards by status yourself; the mark and the word already say it.

## Related

- [Agent Tree](agent-tree.md) – Who started whom – an orchestrator and its sub-agents as a live tree, with status, cost and time on every card, costs rolling up each branch, and branches that fold to one line
- [Agent Fleet](agent-fleet.md) – Several top-level agents side by side – each card sums up its sub-agents in words, with status, cost and time, and a click opens its tree beside it while the last one folds back into its card
- [Subagent List](subagent-list.md) – The sub-agents a session started, grouped Active and Done with counts – each with its own drawn mark, what it's doing now, and a clock that ticks while it runs or how long ago it finished; waiting and failed in words, choose one to open it
- [Agent Steering](agent-steering.md) – Steer an agent while it works – queue a note for the next step and watch it glide into the plan when the agent picks it up, or interrupt right away
- [Collaboration Stream](collaboration-stream.md) – What agents say to each other in a run, as a quiet chat – who to whom on every message, handoffs as slim rows, questions for you with an answer box, files that preview, details with tool calls, filter tabs and an @-composer
