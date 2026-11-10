<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# Red-team Finding

**Blocks** · New

What an adversarial test broke – a findings list, then the picked one's severity, failed invariants, scenario, evidence and a response timeline with undo (uses `@adamstavely/trenchcoat/react`: `agent-ledger`, `button`)

- **Element:** `<tc-red-team-finding>`
- **Size:** 18.3 KB gzip · 72.0 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/red-team-finding";` |
| React / Next.js | `import { RedTeamFinding } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/red-team-finding";` · tags starting with tc- are custom elements |
| Angular | `import { RedTeamFinding } from "@adamstavely/trenchcoat/angular/red-team-finding";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/red-team-finding";` |

## Example

The live example is in the gallery at `#/blocks/red-team-finding`, in both looks; Replay restarts its animations.

## Overview

What an adversarial test broke, and what was done about it. A list of findings sits on the left (on top when narrow)
with each one's code, severity, status, age and area. The picked finding fills the right: its title and summary, the
parts of the system it touched, the invariants it failed, the scenario that found it, the evidence it left, and the
response as an agent ledger – every change made in response, newest first, each with an undo.

### When to use

- Reviewing red-team or evaluation results one finding at a time.
- Showing an incident's response next to what triggered it, so a reviewer can undo a change.

### When not to use

- Only the changes an agent made – use [Agent Ledger](../components/agent-ledger.md).
- Exhibits and their chain of custody – use [Evidence List](../components/evidence-list.md).
- Which tests cover which risks – use [Coverage Matrix](../components/coverage-matrix.md).
- One policy block shown to a person – use [Guardrail Notice](../components/guardrail-notice.md).

## Anatomy

1. **Findings** `.ui-rtf__list` – the list card, with the open count in its header
2. **Finding** `.ui-rtf__option` – code, severity, age, title, status and area
3. **Detail** `.ui-rtf__detail` – the picked finding
4. **Title** `.ui-rtf__title` and **summary** `.ui-rtf__summary`
5. **Affected** `.ui-rtf__chips` – the parts it touched, and Run again
6. **Failed invariants** `.ui-rtf__rules`
7. **Scenario** and **Evidence** `.ui-rtf__pair` – side by side, stacked when narrow

## Looks

Standard puts each card's header on a gray tray above a white card. Clean is one white card per section, with the
header as its first row and a medium-weight title. The ledger follows the same look.

## Usage

### HTML

```html
<tc-red-team-finding id="findings" open-evidence></tc-red-team-finding>

<script type="module">
  import "@adamstavely/trenchcoat/red-team-finding";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#findings");
  el.findings = [
    {
      id: "f1",
      code: "F-001",
      title: "Agent sent an email before its approval step",
      severity: "critical",
      status: "open",
      opened: "2h ago",
      summary: "A delegated agent sent an email without the approval the policy asks for.",
      invariants: [{ id: "i1", rule: "external-write.requires-approval" }],
      scenario: { id: "redteam.tool.approval-bypass-v1", description: "The agent tries an outside write tool." },
      responses: [{ id: "r1", action: "Paused tool", target: "email.send", system: "Tool gateway", at: Date.parse("2026-10-27T09:16") }],
    },
  ];
  el.addEventListener("tc-evidence-open", (e) => console.log(e.detail.evidence.id));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RedTeamFinding, type Finding } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const findings: Finding[] = [
  {
    id: "f1",
    code: "F-001",
    title: "Agent sent an email before its approval step",
    severity: "critical",
    status: "open",
    opened: "2h ago",
    summary: "A delegated agent sent an email without the approval the policy asks for.",
    invariants: [{ id: "i1", rule: "external-write.requires-approval" }],
    scenario: { id: "redteam.tool.approval-bypass-v1", description: "The agent tries an outside write tool." },
  },
];

export function Findings() {
  const [picked, setPicked] = useState("f1");
  return <RedTeamFinding findings={findings} finding={picked} onFindingChange={setPicked} onUndo={(ids, f) => console.log(f.id, ids)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/red-team-finding";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";

defineProps<{ findings: TcRedTeamFinding["findings"]; severityLabels: TcRedTeamFinding["severityLabels"] }>();
const onFindingChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-red-team-finding :findings="findings" :severityLabels="severityLabels" @tc-finding-change="onFindingChange"></tc-red-team-finding>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RedTeamFinding } from "@adamstavely/trenchcoat/angular/red-team-finding";
import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";

@Component({
  selector: "app-red-team-finding-example",
  imports: [RedTeamFinding],
  template: `<tc-red-team-finding [findings]="findings()" [severityLabels]="severityLabels()" (tc-finding-change)="onFindingChange($event)"></tc-red-team-finding>`,
})
export class RedTeamFindingExample {
  readonly findings = input.required<TcRedTeamFinding["findings"]>();
  readonly severityLabels = input.required<TcRedTeamFinding["severityLabels"]>();
  onFindingChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/red-team-finding";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";

  let { findings, severityLabels }: { findings: TcRedTeamFinding["findings"]; severityLabels: TcRedTeamFinding["severityLabels"] } = $props();
  let el: TcRedTeamFinding;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-finding-change", on);
    return () => el.removeEventListener("tc-finding-change", on);
  });
</script>

<tc-red-team-finding bind:this={el} {findings} {severityLabels}></tc-red-team-finding>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `findings` | – | `Finding[]` | `[]` | The findings, in list order |
| `finding` | `finding` | `string \| undefined` | `undefined` | Id of the finding on show – the first one when unset or unknown |
| `now` | `now` | `number \| undefined` | `undefined` | The clock for the ledger's "2m ago", in epoch ms – the ledger's own clock when unset |
| `responder` | `responder` | `string` | `"Response"` | Who made the responses, shown in the ledger's header – e.g. "Response agent" |
| `onUndo` | – | `FindingLedgerAction \| undefined` | `undefined` | Undo in the response ledger, with the finding; may return a promise (see tc-agent-ledger) |
| `onRedo` | – | `FindingLedgerAction \| undefined` | `undefined` | Redo in the response ledger, with the finding; may return a promise |
| `openEvidence` | `open-evidence` | `boolean` | `false` | Evidence rows are buttons that fire tc-evidence-open; otherwise they're plain text |
| `rerun` | `rerun` | `boolean` | `false` | Shows "Run again" in the detail, which fires tc-rerun |
| `severityLabels` | – | `Partial<Record<FindingSeverity, string>> \| undefined` | `undefined` | Words for the severities – merged over the plain-English defaults |
| `statusLabels` | – | `Partial<Record<FindingStatus, string>> \| undefined` | `undefined` | Words for the statuses – merged over the plain-English defaults |
| `heading` | `heading` | `string` | `"Findings"` | The list's heading – "Findings" by default |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-finding-change` | – | Yes | A finding was picked in the list ({ finding }: FindingChange, its id); cancelable – prevented, `finding` stays as it is (controlled use) |
| `tc-evidence-open` | – | No | An evidence row was opened, with `open-evidence` on ({ evidence, finding }: FindingEvidenceOpen) |
| `tc-rerun` | – | No | "Run again" was pressed, with `rerun` on ({ finding }: FindingRerun) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-rtf-list-min` | `240px` | both |
| `--tc-rtf-list-max` | `320px` | both |

#### Design tokens it reads (64)

`--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-h-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-ease-out`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-selected`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xl`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-display-sm`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `findings` | `el.findings = …;` | `<… findings={…} />` | `<tc-red-team-finding :findings="…">` | `<tc-red-team-finding [findings]="…">` | `<tc-red-team-finding {findings}>` |
| `onUndo` | `el.onUndo = …;` | `<… onUndo={…} />` | `<tc-red-team-finding :onUndo="…">` | `<tc-red-team-finding [onUndo]="…">` | `<tc-red-team-finding {onUndo}>` |
| `onRedo` | `el.onRedo = …;` | `<… onRedo={…} />` | `<tc-red-team-finding :onRedo="…">` | `<tc-red-team-finding [onRedo]="…">` | `<tc-red-team-finding {onRedo}>` |
| `severityLabels` | `el.severityLabels = …;` | `<… severityLabels={…} />` | `<tc-red-team-finding :severityLabels="…">` | `<tc-red-team-finding [severityLabels]="…">` | `<tc-red-team-finding {severityLabels}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-red-team-finding :statusLabels="…">` | `<tc-red-team-finding [statusLabels]="…">` | `<tc-red-team-finding {statusLabels}>` |

*Also attributes: `finding`, `now`, `responder`, `open-evidence`, `rerun`, `heading` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-finding-change` | Yes | `el.addEventListener("tc-finding-change", (e) => …)` | `onFindingChange={…}` | `@tc-finding-change="…"` | `(tc-finding-change)="…($event)"` | `el.addEventListener("tc-finding-change", …)` |
| `tc-evidence-open` | No | `el.addEventListener("tc-evidence-open", (e) => …)` | `onOpenEvidence={…}` | `@tc-evidence-open="…"` | `(tc-evidence-open)="…($event)"` | `el.addEventListener("tc-evidence-open", …)` |
| `tc-rerun` | No | `el.addEventListener("tc-rerun", (e) => …)` | `onRerun={…}` | `@tc-rerun="…"` | `(tc-rerun)="…($event)"` | `el.addEventListener("tc-rerun", …)` |

### Controlled

The element changes `finding` itself unless a listener calls `preventDefault()` on `tc-finding-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-red-team-finding id="red-team-finding"></tc-red-team-finding>

<script type="module">
  import "@adamstavely/trenchcoat/red-team-finding";

  const el = document.querySelector("#red-team-finding");
  el.addEventListener("tc-finding-change", (e) => {
    e.preventDefault(); // the element keeps its finding…
    if (allowed(e.detail.finding)) el.finding = e.detail.finding; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RedTeamFinding } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RedTeamFinding>;
type Props = Omit<Own, "finding" | "onFindingChange"> & { initial: NonNullable<Own["finding"]> };

// Controlled: passing finding makes the wrapper prevent the element's own change; the app sets it
export function ControlledRedTeamFinding({ initial, ...props }: Props) {
  const [finding, setFinding] = useState<Own["finding"]>(initial);
  return <RedTeamFinding {...props} finding={finding} onFindingChange={(next) => setFinding(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/red-team-finding";
import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";

const props = defineProps<{ initial: TcRedTeamFinding["finding"] }>();
const finding = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFindingChange = (e: CustomEvent<{ finding: TcRedTeamFinding["finding"] }>) => {
  e.preventDefault();
  finding.value = e.detail.finding;
};
</script>

<template>
  <tc-red-team-finding :finding="finding" @tc-finding-change="onFindingChange"></tc-red-team-finding>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RedTeamFinding } from "@adamstavely/trenchcoat/angular/red-team-finding";
import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";

@Component({
  selector: "app-controlled-red-team-finding",
  imports: [RedTeamFinding],
  template: `<tc-red-team-finding [finding]="finding()" (tc-finding-change)="onFindingChange($event)"></tc-red-team-finding>`,
})
export class ControlledRedTeamFinding {
  readonly initial = input.required<TcRedTeamFinding["finding"]>();
  readonly finding = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFindingChange(e: CustomEvent<{ finding: TcRedTeamFinding["finding"] }>) {
    e.preventDefault();
    this.finding.set(e.detail.finding);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/red-team-finding";
  import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";

  let { initial }: { initial: TcRedTeamFinding["finding"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let finding = $derived(initial);
  let el: TcRedTeamFinding;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      finding = (e as CustomEvent<{ finding: TcRedTeamFinding["finding"] }>).detail.finding;
    };
    el.addEventListener("tc-finding-change", on);
    return () => el.removeEventListener("tc-finding-change", on);
  });
</script>

<tc-red-team-finding bind:this={el} {finding}></tc-red-team-finding>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-red-team-finding")` returns a `TcRedTeamFinding` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";`
- **React / Next.js:** Props: `import type { RedTeamFindingProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RedTeamFinding>`. The element class, for refs: `import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRedTeamFinding["findings"]` with `import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";`
- **Angular:** The directive types the template: `[findings]` takes `TcRedTeamFinding["findings"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRedTeamFinding } from "@adamstavely/trenchcoat/red-team-finding";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `findings` | `Finding[]` | The findings in the list, newest first |
| `finding` | `string` | Id of the finding on show (controlled) |
| `defaultFinding` | `string` | The finding on show at first – the first one by default |
| `onFindingChange` | `(id: string) => void` | Called with the id of the finding picked in the list |
| `onUndo` | `(ids: string[], finding: Finding) => void \| Promise<unknown>` | Undo in the ledger; may return a promise (see AgentLedger) |
| `onRedo` | `(ids: string[], finding: Finding) => void \| Promise<unknown>` | Redo in the ledger; may return a promise |
| `onOpenEvidence` | `(evidence: FindingEvidence, finding: Finding) => void` | An evidence row was opened; without it the rows are plain text |
| `onRerun` | `(finding: Finding) => void` | Shows "Run again" in the detail |
| `title` | `string` | The list's heading – "Findings" by default |

*Renamed or hidden on the wrapper: `heading`, `openEvidence`, `rerun`, `children`, `Run again`, `Findings`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| ↑ / ↓ | Picks the previous or next finding; the detail follows |
| Home / End | Picks the first or last finding |
| Tab | Moves from the list into the detail: Run again, evidence, the ledger's Undo |
| Enter / Space | Presses the focused button |

The list is one tab stop, on the picked finding.

### Screen readers

The list is a `listbox` named by its heading; each finding is an `option`, the picked one `aria-selected`. The detail
is an `article` named by the finding's title, and each section is named by its heading. Severity and status are words,
not only colours; the failed-invariant marks are hidden, the rule ids are read.

### Every piece

- Passes axe (WCAG 2.2 A and AA) light and dark, in Chromium, Firefox and WebKit.
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

*Tested in Chromium 156, Firefox 157 and WebKit 27.2 – the engines behind Chrome and Edge, Firefox, and Safari – where every element's tests and axe checks run (Playwright 1.64.0). The versions come from the platform features the piece uses, from MDN's browser-compat-data; [how they're worked out](../foundations/browser-support.md).*

### Features it needs

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Why |
| --- | --- | --- | --- | --- | --- | --- |
| light-dark() | 123 | 120 | 17.5 | 17.5 | agent-ledger, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | button, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, agent-ledger | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, agent-ledger, internal/kit, button | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | button | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | button | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, agent-ledger, internal/base, button, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | button | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | button | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| text-wrap: balance | 114 | 121 | 17.5 | 17.5 | itself | Titles break where the line fills up instead of into even lines. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-10-28 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 19.6 KB | 6.2 KB |
| Lit · the library every element is built on, the parts it uses | 21.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [agent-ledger](../components/agent-ledger.md) · Element it renders | 29.4 KB | – |
| [button](../components/button.md) · Element it renders | 12.4 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| **Added to a page that already has Lit** | **72.0 KB** | **18.4 KB** |
| With Lit – the first component on a page | 94.3 KB | 25.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **0.4 ms** | default properties, 13 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 10 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setInterval, cleared` (agent-ledger).
- 3 infinite CSS animations.
- Stops or pauses off screen, in a hidden tab and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OnScreenController), `ResizeObserver` (button), `MutationObserver` (button), `IntersectionObserver` (internal/controllers – OffScreenController).
- Listens on the page: `document visibilitychange` (internal/controllers – OnScreenController).
- Reads the clock: `Date.now()` (agent-ledger).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Give each finding a short `code` people can say (“F-001”).
- Write `opened` the way your team reads ages (“2h ago”); it isn't recalculated.
- Invariants are rule ids or short sentences; put the explanation in `detail`.
- Mark responses that can't be taken back (`reversible: false`), such as a sent notice.

## Do and don't

### Do

- Pass `now` when the page has its own clock, so the ledger's ages match.
- Set `open-evidence` and handle `tc-evidence-open` to open the evidence viewer.
- Rename severities and statuses with `severityLabels` / `statusLabels` to match your process.

### Don't

- Don't use it for routine alerts – it's for findings that need a decision.
- Don't hide resolved findings; the open count tells people what's left.

## Related

- [Agent Ledger](../components/agent-ledger.md) – Everything an agent changed in your systems, each change with an undo – before and after per row, and pointing at Undo shows what builds on it: what would be undone too, and what can't be taken back
- [Evidence List](../components/evidence-list.md) – The exhibits behind a matter – reference, title, type, source with its grade, date, holder and a status in words, each opening onto its chain of custody with every step's hash, copyable, and whether the hashes agree
- [Coverage Matrix](../components/coverage-matrix.md) – Which checks cover which parts – covered, partial and gaps across a grid, with totals and each cell's detail
- [Guardrail Notice](../components/guardrail-notice.md) – When a policy blocks, redacts or rewrites content – which policy, why, what changed with personal data masked, and a way to ask for review

## Changelog

- All 18 blocks are now elements – `tc-agent-gallery`, `tc-ai-side-pane`, `tc-ai-workspace`, `tc-app-directory`, `tc-client-context`, `tc-evidence-gallery`, `tc-header-nav`, `tc-invoice-credit`, `tc-kpi-board`, `tc-logo-marquee`, `tc-metrics-dashboard`, `tc-oversight-home`, `tc-pricing-plans`, `tc-publish-readiness`, `tc-red-team-finding`, `tc-task-board`, `tc-testimonial-wall`, `tc-uncertainty-mix` – so Angular (`trenchcoat/angular`), Vue, Svelte, plain HTML and generative UI get them like any component, with docs pages.
