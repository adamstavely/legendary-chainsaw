<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Configuration release control

**AI configuration** · New

A configuration version moving through environments: the pipeline, a gate on evidence and approvals, confirmed promote and rollback

- **Element:** `<tc-configuration-release-control>`
- **Size:** 15.9 KB gzip · 65.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/configuration-release-control";` |
| React / Next.js | `import { ConfigurationReleaseControl } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/configuration-release-control";` · tags starting with tc- are custom elements |
| Angular | `import { ConfigurationReleaseControl } from "@adamstavely/trenchcoat/angular/configuration-release-control";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/configuration-release-control";` |

## Example

The live example is in the gallery at `#/configuration-release-control`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

A configuration version – instructions, model, tools and retrieval together – on its way from draft to production.
The pipeline shows every environment with the version it runs and any rollout in progress, and the gate on the edge
into the next environment says what promotion still needs: an evaluation that meets its threshold and enough
approvals. Below it, what changed, the evidence against the version it would replace, and who has reviewed. Promote
and Roll back both ask first and name exactly what moves. The element deploys nothing: it tells the app, which does
the work and sends back the new state.

Where a release policy runs more than one evaluation, the same gate can carry gate suites – each passing, failing or
conditional – the open findings linked to the candidate, and the waivers that let a conditional suite or a blocking
finding through, with who granted each and when it expires. A waiver the app marks expired counts as unmet.

### When to use

- Releasing a whole AI configuration through environments, where a person signs off on evidence before production.
- A release page that needs promotion and rollback in one place, with the rollback target always visible.
- Showing a staged rollout as it happens, with the stage marked "Requested" until the app reports the move.
- A release gate that also checks regression suites and open findings, where exceptions are granted as waivers that
  expire.

### When not to use

- Reviewing the full diff between two versions – use [Run Compare](run-compare.md), and open it from Compare.
- Showing evaluation results in detail – use [Eval Scorecard](eval-scorecard.md).
- Approving one action an agent is about to take – use [Approval Card](approval-card.md).
- Setting when a run pauses for a person – use [Gate Config](gate-config.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Stage** `.ui-rls__stage` – an environment, the version it runs and any rollout in progress
2. **Gate** `.ui-rls__gate` – on the edge into the target stage: each requirement, met or not
3. **Promote** `.ui-rls__promote` – unavailable until every requirement is met; asks first
4. **Evidence** `.ui-rls__blocks` – what changed, the evaluation against the current version, the approvals
5. **Compare** `.ui-rls__compare` – asks the app to open the full diff
6. **Rollback target** `.ui-rls__rollback` – the stage and version Roll back returns to

## Looks

Standard is a white card on a gray tray: the stages are filled tiles joined by chevrons, the target outlined, and the
gate a raised tile between them with a coloured rule – amber while blocked, green when ready, blue while moving. Clean
is one white card: the stages sit on a quiet track with dots, the gate is a hairline box on it, and the evidence is
three columns between hairlines, with quieter text and thinner icons. Gate suites and open findings follow the same
pattern under the evidence: tiles in Standard, columns between hairlines in Clean. Narrow, the pipeline runs down the card in both.

## Usage

### HTML

```html
<tc-configuration-release-control id="release" candidate="v14" required-approvals="2"></tc-configuration-release-control>

<script type="module">
  import "@adamstavely/trenchcoat/configuration-release-control";
  import "@adamstavely/trenchcoat/tokens.css";

  const release = document.querySelector("#release");
  release.versions = [
    { id: "v13", label: "v13", title: "Policy-grounded answers" },
    { id: "v14", label: "v14", title: "Shorter refund answers" },
  ];
  release.stages = [
    { id: "staging", label: "Staging", version: "v14" },
    { id: "production", label: "Production", version: "v13" },
  ];
  release.evidence = { passRate: 93.8, baseline: 91.2, threshold: 92, cases: 412 };
  release.approvals = [{ id: "p", name: "Priya Shah", state: "approved" }];
  release.rollback = { stage: "production", version: "v13" };
  release.suites = [
    { id: "safety", label: "Safety regression", status: "pass", passed: 48, failed: 0 },
    { id: "retrieval", label: "Retrieval regression", status: "conditional", passed: 5, inconclusive: 1 },
  ];
  release.findings = [{ id: "f21", ref: "F-021", severity: "P1", title: "Order lookup skipped", status: "Acknowledged", blocking: true }];
  release.waivers = [{ id: "w14", label: "W-014", covers: ["retrieval", "f21"], grantedBy: "Dana Lee", expires: "2026-11-07" }];
  release.addEventListener("tc-finding-open", (e) => open(`/findings/${e.detail.finding.id}`));
  release.addEventListener("tc-promote", (e) => {
    fetch("/api/releases", { method: "POST", body: JSON.stringify({ version: e.detail.version.id, stage: e.detail.stage.id }) });
  });
</script>
```

### React / Next.js

```tsx
import { ConfigurationReleaseControl, type ReleaseStage, type ReleaseVersion } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Release({ stages, versions, promote }: { stages: ReleaseStage[]; versions: ReleaseVersion[]; promote: (version: string, stage: string) => Promise<void> }) {
  return (
    <ConfigurationReleaseControl
      stages={stages}
      versions={versions}
      candidate="v14"
      evidence={{ passRate: 93.8, baseline: 91.2, threshold: 92 }}
      approvals={[{ id: "p", name: "Priya Shah", state: "approved" }]}
      rollback={{ stage: "production", version: "v13" }}
      suites={[{ id: "safety", label: "Safety regression", status: "pass", passed: 48, failed: 0 }]}
      findings={[{ id: "f21", ref: "F-021", title: "Order lookup skipped", status: "Open" }]}
      onOpenFinding={(finding) => window.open(`/findings/${finding.id}`)}
      onPromote={(request) => void promote(request.version.id, request.stage.id)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/configuration-release-control";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";

defineProps<{ stages: TcConfigurationReleaseControl["stages"]; versions: TcConfigurationReleaseControl["versions"] }>();
const onPromote = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-configuration-release-control :stages="stages" :versions="versions" @tc-promote="onPromote"></tc-configuration-release-control>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ConfigurationReleaseControl } from "@adamstavely/trenchcoat/angular/configuration-release-control";
import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";

@Component({
  selector: "app-configuration-release-control-example",
  imports: [ConfigurationReleaseControl],
  template: `<tc-configuration-release-control [stages]="stages()" [versions]="versions()" (tc-promote)="onPromote($event)"></tc-configuration-release-control>`,
})
export class ConfigurationReleaseControlExample {
  readonly stages = input.required<TcConfigurationReleaseControl["stages"]>();
  readonly versions = input.required<TcConfigurationReleaseControl["versions"]>();
  onPromote(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/configuration-release-control";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";

  let { stages, versions }: { stages: TcConfigurationReleaseControl["stages"]; versions: TcConfigurationReleaseControl["versions"] } = $props();
  let el: TcConfigurationReleaseControl;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-promote", on);
    return () => el.removeEventListener("tc-promote", on);
  });
</script>

<tc-configuration-release-control bind:this={el} {stages} {versions}></tc-configuration-release-control>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Configuration release"` | The heading |
| `description` | `description` | `string` | `""` | A quieter line under the heading, e.g. which assistant this configures |
| `stages` | – | `ReleaseStage[]` | `[]` | The environments in order, each with the version it runs and any rollout in progress |
| `versions` | – | `ReleaseVersion[]` | `[]` | Every version the stages, the candidate and the rollback target refer to |
| `candidate` | `candidate` | `string` | `""` | The id of the version being promoted |
| `target` | `target` | `string \| undefined` | `undefined` | The id of the stage it's promoted to; unset, the stage after the last one that fully runs it |
| `changes` | – | `ReleaseChange[]` | `[]` | What changed against the version it replaces, by area |
| `evidence` | – | `ReleaseEvidence \| undefined` | `undefined` | The evaluation behind the promotion; unset, promotion waits for one |
| `approvals` | – | `ReleaseApproval[]` | `[]` | Who has reviewed the candidate |
| `requiredApprovals` | `required-approvals` | `number` | `1` | How many approvals Promote needs |
| `rollback` | – | `ReleaseRollback \| undefined` | `undefined` | Where Roll back goes; unset, there's nothing to roll back to |
| `hold` | `hold` | `string` | `""` | A reason that holds every promotion, e.g. "Releases are frozen until Monday" |
| `promoteNote` | `promote-note` | `string` | `"Traffic moves as your release process sets it. You can roll back afterwards."` | Said in the promote confirmation, under the move |
| `rollbackNote` | `rollback-note` | `string` | `"Only this stage changes. Other stages keep the versions they run."` | Said in the rollback confirmation, under the move |
| `cancelLabel` | `cancel-label` | `string` | `"Cancel"` | The confirmation's Cancel button |
| `suites` | – | `ReleaseSuite[]` | `[]` | Gate suites and their results; unset, the gate doesn't ask for any |
| `findings` | – | `ReleaseFinding[]` | `[]` | Open findings linked to the candidate; blocking ones hold promotion unless waived |
| `waivers` | – | `ReleaseWaiver[]` | `[]` | Waivers for conditional suites and blocking findings, with who granted them and when they expire |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-promote` | – | Yes | Promote was confirmed ({ version, stage, from }: ReleasePromoteEvent); cancelable – prevented, the stage isn't marked "Requested" |
| `tc-rollback` | – | Yes | Roll back was confirmed ({ stage, from, to }: ReleaseRollbackEvent); cancelable – prevented, the stage isn't marked "Requested" |
| `tc-compare` | – | Yes | Compare was pressed – open the full diff ({ from, to }: ReleaseCompareEvent); cancelable, with nothing else to stop |
| `tc-finding-open` | – | Yes | A linked finding was pressed – open it ({ finding }: ReleaseFindingOpenEvent); cancelable, with nothing else to stop |

#### Design tokens it reads (117)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-avatar-sm`, `--tc-border-control`, `--tc-border-default`, `--tc-border-selected`, `--tc-border-subtle`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-2xs`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-meter-fill`, `--tc-meter-h`, `--tc-meter-radius`, `--tc-meter-track`, `--tc-pill-font-size`, `--tc-pill-font-size-lg`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-h-lg`, `--tc-pill-px`, `--tc-pill-px-lg`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-5`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-normal`, `--tc-tracking-snug`, `--tc-tracking-tight`, `--tc-tray-inset`, `--tc-tray-radius`

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
| `stages` | `el.stages = …;` | `<… stages={…} />` | `<tc-configuration-release-control :stages="…">` | `<tc-configuration-release-control [stages]="…">` | `<tc-configuration-release-control {stages}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-configuration-release-control :versions="…">` | `<tc-configuration-release-control [versions]="…">` | `<tc-configuration-release-control {versions}>` |
| `changes` | `el.changes = …;` | `<… changes={…} />` | `<tc-configuration-release-control :changes="…">` | `<tc-configuration-release-control [changes]="…">` | `<tc-configuration-release-control {changes}>` |
| `evidence` | `el.evidence = …;` | `<… evidence={…} />` | `<tc-configuration-release-control :evidence="…">` | `<tc-configuration-release-control [evidence]="…">` | `<tc-configuration-release-control {evidence}>` |
| `approvals` | `el.approvals = …;` | `<… approvals={…} />` | `<tc-configuration-release-control :approvals="…">` | `<tc-configuration-release-control [approvals]="…">` | `<tc-configuration-release-control {approvals}>` |
| `rollback` | `el.rollback = …;` | `<… rollback={…} />` | `<tc-configuration-release-control :rollback="…">` | `<tc-configuration-release-control [rollback]="…">` | `<tc-configuration-release-control {rollback}>` |
| `suites` | `el.suites = …;` | `<… suites={…} />` | `<tc-configuration-release-control :suites="…">` | `<tc-configuration-release-control [suites]="…">` | `<tc-configuration-release-control {suites}>` |
| `findings` | `el.findings = …;` | `<… findings={…} />` | `<tc-configuration-release-control :findings="…">` | `<tc-configuration-release-control [findings]="…">` | `<tc-configuration-release-control {findings}>` |
| `waivers` | `el.waivers = …;` | `<… waivers={…} />` | `<tc-configuration-release-control :waivers="…">` | `<tc-configuration-release-control [waivers]="…">` | `<tc-configuration-release-control {waivers}>` |

*Also attributes: `heading`, `description`, `candidate`, `target`, `required-approvals`, `hold`, `promote-note`, `rollback-note` and 1 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-promote` | Yes | `el.addEventListener("tc-promote", (e) => …)` | `onPromote={…}` | `@tc-promote="…"` | `(tc-promote)="…($event)"` | `el.addEventListener("tc-promote", …)` |
| `tc-rollback` | Yes | `el.addEventListener("tc-rollback", (e) => …)` | `onRollback={…}` | `@tc-rollback="…"` | `(tc-rollback)="…($event)"` | `el.addEventListener("tc-rollback", …)` |
| `tc-compare` | Yes | `el.addEventListener("tc-compare", (e) => …)` | `onCompare={…}` | `@tc-compare="…"` | `(tc-compare)="…($event)"` | `el.addEventListener("tc-compare", …)` |
| `tc-finding-open` | Yes | `el.addEventListener("tc-finding-open", (e) => …)` | `onOpenFinding={…}` | `@tc-finding-open="…"` | `(tc-finding-open)="…($event)"` | `el.addEventListener("tc-finding-open", …)` |

### Controlled

`tc-promote`, `tc-rollback`, `tc-compare`, `tc-finding-open` are cancelable: call `preventDefault()` to stop what the element would do next.

### Slots and children

No slots: everything it shows comes from its properties.

### Server rendering

- **HTML:** Server-rendered HTML can contain the tag; it upgrades when the module loads in the browser. Set properties from script after that – there's no server rendering of the element's own content in this version.
- **React / Next.js:** No server rendering in this version. In Next.js, load the component with `dynamic(() => import("./…"), { ssr: false })` from a `"use client"` file, with a placeholder the size of the component so the page doesn't shift (`examples/next`).
- **Vue / Nuxt:** In Nuxt, import the module from a client-only plugin (`plugins/trenchcoat.client.ts`) and wrap the tag in `<ClientOnly>` (`examples/nuxt`).
- **Angular:** Angular SSR imports the directive as it is – every module loads in Node without a DOM. The server sends the tag and its attributes, and the element renders when it upgrades on the client; if hydration reports a mismatch inside it, add `ngSkipHydration` to the component that holds it. To keep its code out of the server bundle, put it in a `@defer` block. (`examples/angular` renders on the client.)
- **Svelte:** In SvelteKit, import the module in `onMount` or behind `browser` from `$app/environment`; the server sends the bare tag. (`examples/svelte` is client-only.)

### TypeScript

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-configuration-release-control")` returns a `TcConfigurationReleaseControl` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";`
- **React / Next.js:** Props: `import type { ConfigurationReleaseControlProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ConfigurationReleaseControl>`. The element class, for refs: `import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcConfigurationReleaseControl["stages"]` with `import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";`
- **Angular:** The directive types the template: `[stages]` takes `TcConfigurationReleaseControl["stages"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcConfigurationReleaseControl } from "@adamstavely/trenchcoat/configuration-release-control";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading |
| `onPromote` | `(request: ReleasePromoteEvent, event: CustomEvent<ReleasePromoteEvent>) => void` | Promote was confirmed: start the move. Call `event.preventDefault()` if it can't start, so the stage isn't marked "Requested" |
| `onRollback` | `(request: ReleaseRollbackEvent, event: CustomEvent<ReleaseRollbackEvent>) => void` | Roll back was confirmed: start it. Call `event.preventDefault()` if it can't start, so the stage isn't marked "Requested" |
| `onCompare` | `(versions: ReleaseCompareEvent) => void` | Compare was pressed: open the full diff between the two versions |
| `onOpenFinding` | `(finding: ReleaseFindingOpenEvent["finding"]) => void` | A linked finding was pressed: open it |

*Renamed or hidden on the wrapper: `heading`, `children`*

## Accessibility

Follows the WAI-ARIA [Dialog (modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through Promote, Compare and Roll back |
| Tab | Also reaches each linked finding, when there are findings |
| Enter / Space | On Promote, opens the confirmation when it's ready (otherwise says what's missing); on Roll back, opens its confirmation; on Compare, asks for the diff; on a finding, asks the app to open it |

In a confirmation, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between Cancel and the confirm button, wrapping inside the dialog |
| Enter / Space | On the confirm button, confirms; on Cancel, closes |
| Escape | Closes without doing anything |

Closing either way returns focus to the button that opened the dialog.

### Screen readers

The pipeline is a list named “Pipeline”; the gate is an item in it named by its heading, “Gate to Production”. Each
requirement reads its state with it – “Evaluation, met: 93.8% · needs 92%”, “Approvals, not met: 1 of 2 approvals”.
Promote is `aria-disabled` until every requirement is met and is described by the gate's line, for example “To
promote: 1 of 2 approvals.”; pressing it then announces “Can't promote yet: 1 of 2 approvals.” A rollout reads “v14 on
25% of traffic”. The evidence blocks are sections named by their headings, with “– met” or “– not met” after
Evaluation and Approvals. Roll back is named in full: “Roll back Production to v12”. The confirmations are modal
`alertdialog`s named by their question (“Promote v14 to Production?”) and described by the move. A polite status
message confirms “Promotion of v14 to Production requested.”

With suites and findings, the gate gains “Suites, met: 2 pass · 1 on a waiver” and “Findings, not met: 1 blocking”,
and the gate's line names what holds it: “To promote: Retrieval's waiver W-014 has expired; 1 blocking finding is
open.” Gate suites and Open findings are sections named by their headings; each suite's result is a visible word
(Pass, Fail, Conditional), and each finding is a button that reads its reference, severity, title and status, and
“Blocks promotion” while it does. A waiver reads “W-014 · expires 2026-11-07 · granted by Dana Lee”, or “expired …”.

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
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself | Modals trap focus, close on Escape and sit in the top layer. |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 58.3 KB | 13.6 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **65.9 KB** | **15.9 KB** |
| With Lit – the first component on a page | 87.7 KB | 23.1 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **4.5 ms** | the gallery demo's data, 154 DOM nodes – to layout, median of 7 |
| Typical update | **0.4 ms** | one item of changes replaced |
| First on the page | 21 ms | default properties; includes adding its CSS to the document |
| 100 items | 10 ms | changes: first render, 610 nodes; update 0.5 ms |
| 1,000 items | 41 ms | changes: first render, 4,885 nodes; update 2.6 ms |

1,000 items of changes: 41 ms, 4,885 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Name versions short (“v14”) and give each a `title` that says what changed for people: “Shorter refund answers”.
- Count changes in units a reviewer understands – edited lines, tools added – and put the detail in `detail`.
- Set `threshold` to the pass rate your release policy needs, and give `baseline` from the same suite, so the
  comparison is fair.
- Use `hold` for a reason that stops every promotion, in a full sentence: “Releases are frozen until Monday.”
- Give suites the names your release policy uses, and pass their counts (`passed`, `failed`, `inconclusive`) so a
  conditional result shows why.
- Give findings and waivers short references (`ref`, `label`) – “F-021”, “W-014” – the ones people search for.
- Pass `expires` as your policy states it (“2026-11-07”); the element shows it as given and never compares it with
  the clock – set `expired` when your server says it has run out.
- Say what promotion and rollback actually do in `promoteNote` and `rollbackNote` – whether traffic moves at once or in
  steps, and what isn't undone.

## Do and don't

### Do

- Enforce the gate on your server too. The element's gate is a guide for people, not access control.
- Answer `tc-promote` and `tc-rollback` with new `stages`; the "Requested" mark stays until the stage changes.
- Call `preventDefault()` on the event when the request can't start, so nothing is marked as requested.
- Keep the rollback target current after every release, so Roll back always names the version it returns to.
- Mark a finding `blocking` only when your policy says it holds a release; open it from `tc-finding-open`.

### Don't

- Don't show a stage as moved before your deployment reports it.
- Don't embed the full diff here; open `run-compare` from Compare.
- Don't lower the threshold to get a release through – change the policy where it lives.
- Don't use a waiver for a failing suite – the gate won't count it. Fix the suite, or change what it tests.

## Related

- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Eval Scorecard](eval-scorecard.md) – Test cases run against prompt or model versions – pass and fail per case, the score across versions, and a failing case opened beside its expected answer
- [Approval Card](approval-card.md) – An agent asks before it acts – risk badge, preview with an optional diff or arguments, Approve and Deny with shortcuts, a pausing countdown, and a smooth morph into a resolved row
- [Gate Config](gate-config.md) – When a person decides – the conditions that pause a run, who reviews, what they see, and what they're allowed to do
