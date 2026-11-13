<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Agent Create

**Agents** · New

Describe an agent and get a working draft – a request with example chips, Generate, then the draft streamed in to edit: name, instructions, tools as switches, model, triggers, and the model's open questions to answer before Create

- **Element:** `<tc-agent-create>`
- **Size:** 8.2 KB gzip · 28.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/agent-create";` |
| React / Next.js | `import { AgentCreate } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/agent-create";` · tags starting with tc- are custom elements |
| Angular | `import { AgentCreate } from "@adamstavely/trenchcoat/angular/agent-create";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/agent-create";` |

## Example

The live example is in the gallery at `#/agent-create`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Describe an agent in a sentence or two and get a working draft. Generate asks the page's model, which streams the draft back: a name, instructions, the tools it should use, a model and what starts it, with any questions the model has. Every section is editable before Create.

### When to use

- The first step of making an agent, for people who know the job but not how to set up an agent.
- Turning a request ("check expense claims against the policy") into a draft someone then reviews.

### When not to use

- Editing a finished agent's instructions in depth – use [Instruction Editor](instruction-editor.md).
- Fine-grained tool rules per agent – use [Tool Permissions](tool-permissions.md).
- Building one trigger with conditions and a schedule – use [Trigger Builder](trigger-builder.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Describe** `.ui-agcr__describe` – the `.ui-agcr__prompt` field, example `.ui-agcr__chip`s and `.ui-agcr__generate`
2. **Draft** `.ui-agcr__draft` – `.ui-agcr__name`, `.ui-agcr__instructions`, the `.ui-agcr__switch` per tool, `.ui-agcr__model` and the `.ui-agcr__trigger`s
3. **Questions** `.ui-agcr__questions` – each `.ui-agcr__question` with its `.ui-agcr__answer`
4. **Actions** `.ui-agcr__actions` – `.ui-agcr__start-over` and `.ui-agcr__create`

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row. A page can set `--tc-agcr-track-w` and `--tc-agcr-track-h`, the tool switches' size.

## Usage

### HTML

```html
<tc-agent-create id="new-agent"></tc-agent-create>

<script type="module">
  import "@adamstavely/trenchcoat/agent-create";
  import "@adamstavely/trenchcoat/tokens.css";

  const form = document.querySelector("#new-agent");
  form.examples = ["Match supplier invoices to purchase orders", "Answer staff questions from the policy library"];
  form.addEventListener("tc-generate", (e) => {
    e.preventDefault(); // the draft is ready at once here, so it doesn't stream
    form.draft = {
      name: "Invoice matcher",
      instructions: "Match each new invoice to its purchase order: " + e.detail.description,
      tools: [{ id: "ledger", label: "Ledger search", enabled: true }],
      model: "Model M",
      triggers: [{ id: "t1", label: "A new invoice arrives" }],
      questions: [{ id: "q1", question: "What should it do with invoices that have no order?" }],
    };
  });
  form.addEventListener("tc-create", (e) => console.log("Create", e.detail.draft));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { AgentCreate, type AgentDraft } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function NewAgent({ ask, create }: { ask: (description: string) => Promise<AgentDraft>; create: (draft: AgentDraft) => void }) {
  const [draft, setDraft] = useState<AgentDraft | null>(null);
  const [streaming, setStreaming] = useState(false);
  return (
    <AgentCreate
      examples={["Match supplier invoices to purchase orders"]}
      draft={draft}
      onDraftChange={setDraft}
      streaming={streaming}
      onGenerate={(description) => {
        setStreaming(true);
        ask(description).then((d) => {
          setDraft(d);
          setStreaming(false);
        });
        return false;
      }}
      onCreate={create}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/agent-create";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";

defineProps<{ examples: TcAgentCreate["examples"]; draft: TcAgentCreate["draft"] }>();
const onPromptChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-agent-create :examples="examples" :draft="draft" @tc-prompt-change="onPromptChange"></tc-agent-create>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { AgentCreate } from "@adamstavely/trenchcoat/angular/agent-create";
import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";

@Component({
  selector: "app-agent-create-example",
  imports: [AgentCreate],
  template: `<tc-agent-create [examples]="examples()" [draft]="draft()" (tc-prompt-change)="onPromptChange($event)"></tc-agent-create>`,
})
export class AgentCreateExample {
  readonly examples = input.required<TcAgentCreate["examples"]>();
  readonly draft = input.required<TcAgentCreate["draft"]>();
  onPromptChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-create";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";

  let { examples, draft }: { examples: TcAgentCreate["examples"]; draft: TcAgentCreate["draft"] } = $props();
  let el: TcAgentCreate;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-prompt-change", on);
    return () => el.removeEventListener("tc-prompt-change", on);
  });
</script>

<tc-agent-create bind:this={el} {examples} {draft}></tc-agent-create>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"New agent"` | The heading |
| `description` | `description` | `string \| undefined` | `undefined` | A line under the heading |
| `prompt` | `prompt` | `string` | `""` | What the agent should do, in the person's words. Changed by the user unless a tc-prompt-change listener calls preventDefault() |
| `examples` | – | `string[]` | `[]` | Example descriptions, as chips that fill the field |
| `draft` | – | `AgentDraft \| null` | `null` | The draft the page streams back; null before Generate. Changed by edits unless a tc-draft-change listener calls preventDefault() |
| `streaming` | `streaming` | `boolean` | `false` | The draft is still streaming in. Set by Generate; the page clears it when the draft is done |
| `models` | – | `AgentCreateModel[]` | `[]` | The models to choose from; the draft's own model is offered too |
| `labels` | – | `Partial<AgentCreateLabels>` | `{}` | Rename any of the words |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-prompt-change` | – | Yes | The description changed ({ prompt }: AgentCreatePromptChange); cancelable – prevented, `prompt` stays as it was |
| `tc-generate` | – | Yes | Generate was pressed ({ description }: AgentCreateGenerate); cancelable – prevented, `streaming` isn't set |
| `tc-draft-change` | – | Yes | The draft was edited or cleared ({ draft, field }: AgentCreateDraftChange); cancelable – prevented, `draft` stays as it was |
| `tc-create` | – | Yes | Create was pressed with a named, finished draft ({ draft }: AgentCreateCreate); cancelable |
| `tc-reset` | – | Yes | Start over was pressed (detail: {}); cancelable – prevented, nothing is cleared |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-agcr-track-w` | `var(--tc-space-7)` | both |
| `--tc-agcr-track-h` | `var(--tc-space-4)` | both |

#### Design tokens it reads (64)

`--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-bg-sunken`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-h-sm`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-radius-full`, `--tc-shadow-control`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `examples` | `el.examples = …;` | `<… examples={…} />` | `<tc-agent-create :examples="…">` | `<tc-agent-create [examples]="…">` | `<tc-agent-create {examples}>` |
| `draft` | `el.draft = …;` | `<… draft={…} />` | `<tc-agent-create :draft="…">` | `<tc-agent-create [draft]="…">` | `<tc-agent-create {draft}>` |
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-agent-create :models="…">` | `<tc-agent-create [models]="…">` | `<tc-agent-create {models}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-agent-create :labels="…">` | `<tc-agent-create [labels]="…">` | `<tc-agent-create {labels}>` |

*Also attributes: `heading`, `description`, `prompt`, `streaming` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-prompt-change` | Yes | `el.addEventListener("tc-prompt-change", (e) => …)` | `ref.current.addEventListener("tc-prompt-change", …)` | `@tc-prompt-change="…"` | `(tc-prompt-change)="…($event)"` | `el.addEventListener("tc-prompt-change", …)` |
| `tc-generate` | Yes | `el.addEventListener("tc-generate", (e) => …)` | `onGenerate={…}` | `@tc-generate="…"` | `(tc-generate)="…($event)"` | `el.addEventListener("tc-generate", …)` |
| `tc-draft-change` | Yes | `el.addEventListener("tc-draft-change", (e) => …)` | `ref.current.addEventListener("tc-draft-change", …)` | `@tc-draft-change="…"` | `(tc-draft-change)="…($event)"` | `el.addEventListener("tc-draft-change", …)` |
| `tc-create` | Yes | `el.addEventListener("tc-create", (e) => …)` | `onCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |
| `tc-reset` | Yes | `el.addEventListener("tc-reset", (e) => …)` | `onTcReset={…}` | `@tc-reset="…"` | `(tc-reset)="…($event)"` | `el.addEventListener("tc-reset", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `prompt` and `draft` itself unless a listener calls `preventDefault()` on `tc-prompt-change` or `tc-draft-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-agent-create id="agent-create"></tc-agent-create>

<script type="module">
  import "@adamstavely/trenchcoat/agent-create";

  const el = document.querySelector("#agent-create");
  el.addEventListener("tc-prompt-change", (e) => {
    e.preventDefault(); // the element keeps its prompt…
    if (allowed(e.detail.prompt)) el.prompt = e.detail.prompt; // …until the app sets it
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
import "@adamstavely/trenchcoat/agent-create";
import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";

const props = defineProps<{ initial: TcAgentCreate["prompt"] }>();
const prompt = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onPromptChange = (e: CustomEvent<{ prompt: TcAgentCreate["prompt"] }>) => {
  e.preventDefault();
  prompt.value = e.detail.prompt;
};
</script>

<template>
  <tc-agent-create :prompt="prompt" @tc-prompt-change="onPromptChange"></tc-agent-create>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { AgentCreate } from "@adamstavely/trenchcoat/angular/agent-create";
import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";

@Component({
  selector: "app-controlled-agent-create",
  imports: [AgentCreate],
  template: `<tc-agent-create [prompt]="prompt()" (tc-prompt-change)="onPromptChange($event)"></tc-agent-create>`,
})
export class ControlledAgentCreate {
  readonly initial = input.required<TcAgentCreate["prompt"]>();
  readonly prompt = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onPromptChange(e: CustomEvent<{ prompt: TcAgentCreate["prompt"] }>) {
    e.preventDefault();
    this.prompt.set(e.detail.prompt);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/agent-create";
  import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";

  let { initial }: { initial: TcAgentCreate["prompt"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let prompt = $derived(initial);
  let el: TcAgentCreate;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      prompt = (e as CustomEvent<{ prompt: TcAgentCreate["prompt"] }>).detail.prompt;
    };
    el.addEventListener("tc-prompt-change", on);
    return () => el.removeEventListener("tc-prompt-change", on);
  });
</script>

<tc-agent-create bind:this={el} {prompt}></tc-agent-create>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-agent-create")` returns a `TcAgentCreate` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";`
- **React / Next.js:** Props: `import type { AgentCreateProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof AgentCreate>`. The element class, for refs: `import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcAgentCreate["examples"]` with `import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";`
- **Angular:** The directive types the template: `[examples]` takes `TcAgentCreate["examples"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcAgentCreate } from "@adamstavely/trenchcoat/agent-create";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `prompt` | `string` | The description – controlled when given |
| `defaultPrompt` | `string` | The description on mount when `prompt` isn't controlled |
| `onPromptChange` | `(prompt: string) => void` | The description changed |
| `draft` | `AgentDraft \| null` | The draft – controlled when given (null before Generate) |
| `defaultDraft` | `AgentDraft \| null` | The draft on mount when `draft` isn't controlled |
| `onDraftChange` | `(draft: AgentDraft \| null) => void` | The draft was edited or cleared |
| `onGenerate` | `(description: string) => boolean \| void` | Generate was pressed; return false to keep `streaming` off |
| `onCreate` | `(draft: AgentDraft) => void` | Create was pressed with a named, finished draft |

*Renamed or hidden on the wrapper: `heading`, `prompt`, `draft`, `children`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Tab | Through the field, the examples, Generate, then each part of the draft |
| Ctrl / ⌘ + Enter | In the description: Generate |
| Enter / Space | On a tool: switch it on or off |
| Enter | In "Add a trigger": add it |

### Screen readers

Every field has a visible label; the tools are switches (`role="switch"`) with their description linked. While the draft streams in, its section is `aria-busy`. "Writing the draft…" and "Draft ready" are announced once each in a polite status. Generate and Create stay focusable when they can't act yet (`aria-disabled`), with the reason as their description; pressing them moves focus to the field to fix and says what's missing.

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

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 20.8 KB | 6.0 KB |
| Lit · the library every element is built on, the parts it uses | 18.5 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **28.3 KB** | **8.2 KB** |
| With Lit – the first component on a page | 47.9 KB | 14.5 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.2 ms** | the gallery demo's data, 78 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of examples replaced |
| First on the page | 20 ms | default properties; includes adding its CSS to the document |
| 100 items | 2.4 ms | examples: first render, 175 nodes; update 0.2 ms |
| 1,000 items | 9.3 ms | examples: first render, 1,075 nodes; update 0.8 ms |

1,000 items of examples: 9.3 ms, 1,075 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Examples are whole requests a person might type, not keywords.
- The draft's `questions` are what the model couldn't decide on its own; keep them few and answerable in a line.
- Tool labels and descriptions are the page's words for what the agent may do.

## Do and don't

### Do

- Set `streaming` while the draft arrives and clear it when it's done, so Create waits for a whole draft.
- Send the answers to the questions back to the model with the next Generate.

### Don't

- Don't switch on every tool the model suggests – leave risky ones (email, payments) off until someone turns them on.

## Related

- [Agent List](agent-list.md) – Every agent in a workspace, with the failing ones lifted into Needs attention and why in words – search, status chips, sort by name, last run, failures or cost, and a row that opens the agent
- [Instruction Editor](instruction-editor.md) – System and developer instructions with variable chips, missing and unused warnings, an app-supplied token count, versions and a word diff
- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Trigger Builder](trigger-builder.md) – “Run when X happens, or every Monday at 9” – an event or a schedule, conditions, a plain-language summary and the next run times
