<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Pull Request

**Workspace & sessions** · New

one pull request at a glance: branches, review, checks, whether it can merge, and the button its state calls for.

- **Element:** `<tc-pull-request>`
- **Size:** 12.9 KB gzip · 47.6 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/pull-request";` |
| React / Next.js | `import { PullRequest } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/pull-request";` · tags starting with tc- are custom elements |
| Angular | `import { PullRequest } from "@adamstavely/trenchcoat/angular/pull-request";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/pull-request";` |

## Example

The live example is in the gallery at `#/pull-request`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

One pull request at a glance, sized for a session's side panel. It shows the title and number, which branch goes into
which, who opened it and when, lines changed, the review, the checks as a small bar with words, and whether it can merge.
The button at the foot follows the state: Mark ready on a draft, Merge on an open one, nothing once it's merged or
closed. When the branch is behind its base it offers Update branch; with conflicts, Resolve. With no pull request it says
so and offers Create pull request.

Nothing here talks to a server. Every button is an event, and the page changes the data when the work is done.

### When to use

- The pull request for the branch a session or workspace is on.
- A detail panel opened from a row of `change-list`.

### When not to use

- Several pull requests as rows – use [Change List](change-list.md).
- The checks in detail, one row each – use [Check Status](check-status.md).
- The changed lines themselves – use [Diff Viewer](diff-viewer.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Summary** `.ui-prq__summary` – the state, who and when, the title, the branches and the lines changed
2. **State** `.ui-prq__state` – a mark and a word: Draft, Open, Merged or Closed
3. **Title** `.ui-prq__title` – a link when `url` is given
4. **Branches** `.ui-prq__branches` – `head → base`
5. **Review** `.ui-prq__review` – the review as a whole, with who
6. **Checks** `.ui-prq__checks` – a bar in `.ui-prq__bar` and the words; pressing it fires `tc-checks`
7. **Can it merge** `.ui-prq__mergeable` – a mark, the words, and Update branch or Resolve when they apply
8. **Foot** `.ui-prq__foot` – the auto-merge switch, the merge method and `.ui-prq__primary`
9. **Reason** `.ui-prq__reason` – why Merge can't be pressed
10. **Empty** `.ui-prq__empty` – no pull request, and Create pull request

## Looks

Standard puts the header on the gray tray above a white card; Clean is one white card with the header as its first row.
`bare` drops the tray and card, for a place that already has one. On a very narrow card the merge method and Merge stack.

## Usage

### HTML

```html
<tc-pull-request id="pr" number="128" pr-title="Add the booking calendar" state="open" head="feature/booking-calendar" base="main" mergeable="clean"></tc-pull-request>

<script type="module">
  import "@adamstavely/trenchcoat/pull-request";
  import "@adamstavely/trenchcoat/tokens.css";

  const pr = document.querySelector("#pr");
  pr.checks = { passing: 6, failing: 0, pending: 1, skipped: 0 };
  pr.addEventListener("tc-merge", (e) => console.log("Merge", e.detail.method));
</script>
```

### React / Next.js

```tsx
import { PullRequest } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function BranchPullRequest({ onMerge }: { onMerge: (method: string) => void }) {
  return (
    <PullRequest
      number={128}
      prTitle="Add the booking calendar"
      state="open"
      head="feature/booking-calendar"
      base="main"
      mergeable="clean"
      checks={{ passing: 6, failing: 0, pending: 1, skipped: 0 }}
      onTcMerge={(e) => onMerge(e.detail.method)}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/pull-request";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";

defineProps<{ updatedAt: TcPullRequest["updatedAt"]; reviewers: TcPullRequest["reviewers"] }>();
const onOpen = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-pull-request :updatedAt="updatedAt" :reviewers="reviewers" @tc-open="onOpen"></tc-pull-request>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { PullRequest } from "@adamstavely/trenchcoat/angular/pull-request";
import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";

@Component({
  selector: "app-pull-request-example",
  imports: [PullRequest],
  template: `<tc-pull-request [updatedAt]="updatedAt()" [reviewers]="reviewers()" (tc-open)="onOpen($event)"></tc-pull-request>`,
})
export class PullRequestExample {
  readonly updatedAt = input.required<TcPullRequest["updatedAt"]>();
  readonly reviewers = input.required<TcPullRequest["reviewers"]>();
  onOpen(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/pull-request";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";

  let { updatedAt, reviewers }: { updatedAt: TcPullRequest["updatedAt"]; reviewers: TcPullRequest["reviewers"] } = $props();
  let el: TcPullRequest;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-open", on);
    return () => el.removeEventListener("tc-open", on);
  });
</script>

<tc-pull-request bind:this={el} {updatedAt} {reviewers}></tc-pull-request>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Pull request"` | The heading; empty draws no header |
| `number` | `number` | `number \| undefined` | `undefined` | Its number; with neither this nor `prTitle` the empty state shows |
| `prTitle` | `pr-title` | `string` | `""` | Its title |
| `url` | `url` | `string \| undefined` | `undefined` | Where it lives; the title becomes a link to it |
| `state` | `state` | `PullRequestState` | `"open"` | Draft, open, merged or closed |
| `head` | `head` | `string` | `""` | The branch with the changes |
| `base` | `base` | `string` | `""` | The branch it goes into |
| `author` | `author` | `string \| undefined` | `undefined` | Who opened it |
| `updatedAt` | – | `number \| string \| undefined` | `undefined` | When it last changed: epoch ms or an ISO string |
| `additions` | `additions` | `number \| undefined` | `undefined` | Lines added |
| `deletions` | `deletions` | `number \| undefined` | `undefined` | Lines removed |
| `files` | `files` | `number \| undefined` | `undefined` | Files changed |
| `review` | `review` | `PullRequestReview` | `"none"` | The review as a whole |
| `reviewers` | – | `PullRequestReviewer[]` | `[]` | Who reviewed it, or was asked to |
| `checks` | – | `CheckCounts \| undefined` | `undefined` | How its checks went; unset draws no checks row |
| `mergeable` | `mergeable` | `PullRequestMergeable` | `"unknown"` | Whether it can merge into its base |
| `autoMerge` | `auto-merge` | `boolean` | `false` | Merge on its own once the checks pass. Changed by the switch unless a tc-auto-merge-change listener calls preventDefault() |
| `mergeMethod` | `merge-method` | `PullRequestMergeMethod` | `"merge"` | How Merge merges. Changed by the picker unless a tc-merge-method-change listener calls preventDefault() |
| `mergeMethods` | – | `PullRequestMergeMethod[]` | `["merge", "squash", "rebase"]` | The methods offered; with one, there's no picker |
| `busy` | `busy` | `boolean` | `false` | Something is under way: the buttons wait |
| `actions` | – | `PullRequestActionItem[]` | `[]` | Small buttons in the header |
| `labels` | – | `Partial<PullRequestLabels>` | `{}` | Rename any of the words, over the defaults |
| `now` | `now` | `number \| undefined` | `undefined` | The time now, epoch ms; by default the element's own clock |
| `locale` | `locale` | `string \| undefined` | `undefined` | The language for times and numbers, e.g. "en-GB"; by default the browser's |
| `bare` | `bare` | `boolean` | `false` | Drops the tray and card |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-open` | – | Yes | The title was pressed ({ number, url }: PullRequestOpen); cancelable – prevented, a link isn't followed |
| `tc-merge` | – | Yes | Merge was pressed ({ number, method }: PullRequestMerge); cancelable |
| `tc-ready` | – | Yes | Mark ready was pressed ({ number }: PullRequestDetail); cancelable |
| `tc-update-branch` | – | Yes | Update branch was pressed ({ number }: PullRequestDetail); cancelable |
| `tc-resolve` | – | Yes | Resolve was pressed on conflicts ({ number }: PullRequestDetail); cancelable |
| `tc-checks` | – | No | The checks were pressed ({ number }: PullRequestDetail) |
| `tc-create` | – | No | Create pull request was pressed in the empty state ({ number }: PullRequestDetail) |
| `tc-action` | – | No | A header button was pressed ({ id }: PullRequestAction) |
| `tc-auto-merge-change` | – | Yes | The auto-merge switch changed ({ autoMerge, method }: PullRequestAutoMergeChange); cancelable – prevented, the switch stays as it was |
| `tc-merge-method-change` | – | Yes | A merge method was picked ({ mergeMethod }: PullRequestMergeMethodChange); cancelable – prevented, the method stays as it was |

#### Design tokens it reads (54)

`--tc-action-primary-bg`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-field-bg`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-radius-full`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultPullRequestLabels: PullRequestLabels` | The words used when the page gives none |

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
| `updatedAt` | `el.updatedAt = …;` | `<… updatedAt={…} />` | `<tc-pull-request :updatedAt="…">` | `<tc-pull-request [updatedAt]="…">` | `<tc-pull-request {updatedAt}>` |
| `reviewers` | `el.reviewers = …;` | `<… reviewers={…} />` | `<tc-pull-request :reviewers="…">` | `<tc-pull-request [reviewers]="…">` | `<tc-pull-request {reviewers}>` |
| `checks` | `el.checks = …;` | `<… checks={…} />` | `<tc-pull-request :checks="…">` | `<tc-pull-request [checks]="…">` | `<tc-pull-request {checks}>` |
| `mergeMethods` | `el.mergeMethods = …;` | `<… mergeMethods={…} />` | `<tc-pull-request :mergeMethods="…">` | `<tc-pull-request [mergeMethods]="…">` | `<tc-pull-request {mergeMethods}>` |
| `actions` | `el.actions = …;` | `<… actions={…} />` | `<tc-pull-request :actions="…">` | `<tc-pull-request [actions]="…">` | `<tc-pull-request {actions}>` |
| `labels` | `el.labels = …;` | `<… labels={…} />` | `<tc-pull-request :labels="…">` | `<tc-pull-request [labels]="…">` | `<tc-pull-request {labels}>` |

*Also attributes: `heading`, `number`, `pr-title`, `url`, `state`, `head`, `base`, `author` and 11 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-open` | Yes | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |
| `tc-merge` | Yes | `el.addEventListener("tc-merge", (e) => …)` | `onTcMerge={…}` | `@tc-merge="…"` | `(tc-merge)="…($event)"` | `el.addEventListener("tc-merge", …)` |
| `tc-ready` | Yes | `el.addEventListener("tc-ready", (e) => …)` | `onTcReady={…}` | `@tc-ready="…"` | `(tc-ready)="…($event)"` | `el.addEventListener("tc-ready", …)` |
| `tc-update-branch` | Yes | `el.addEventListener("tc-update-branch", (e) => …)` | `onTcUpdateBranch={…}` | `@tc-update-branch="…"` | `(tc-update-branch)="…($event)"` | `el.addEventListener("tc-update-branch", …)` |
| `tc-resolve` | Yes | `el.addEventListener("tc-resolve", (e) => …)` | `onTcResolve={…}` | `@tc-resolve="…"` | `(tc-resolve)="…($event)"` | `el.addEventListener("tc-resolve", …)` |
| `tc-checks` | No | `el.addEventListener("tc-checks", (e) => …)` | `onTcChecks={…}` | `@tc-checks="…"` | `(tc-checks)="…($event)"` | `el.addEventListener("tc-checks", …)` |
| `tc-create` | No | `el.addEventListener("tc-create", (e) => …)` | `onTcCreate={…}` | `@tc-create="…"` | `(tc-create)="…($event)"` | `el.addEventListener("tc-create", …)` |
| `tc-action` | No | `el.addEventListener("tc-action", (e) => …)` | `onTcAction={…}` | `@tc-action="…"` | `(tc-action)="…($event)"` | `el.addEventListener("tc-action", …)` |
| `tc-auto-merge-change` | Yes | `el.addEventListener("tc-auto-merge-change", (e) => …)` | `ref.current.addEventListener("tc-auto-merge-change", …)` | `@tc-auto-merge-change="…"` | `(tc-auto-merge-change)="…($event)"` | `el.addEventListener("tc-auto-merge-change", …)` |
| `tc-merge-method-change` | Yes | `el.addEventListener("tc-merge-method-change", (e) => …)` | `ref.current.addEventListener("tc-merge-method-change", …)` | `@tc-merge-method-change="…"` | `(tc-merge-method-change)="…($event)"` | `el.addEventListener("tc-merge-method-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `autoMerge` and `mergeMethod` itself unless a listener calls `preventDefault()` on `tc-auto-merge-change` or `tc-merge-method-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-pull-request id="pull-request"></tc-pull-request>

<script type="module">
  import "@adamstavely/trenchcoat/pull-request";

  const el = document.querySelector("#pull-request");
  el.addEventListener("tc-auto-merge-change", (e) => {
    e.preventDefault(); // the element keeps its autoMerge…
    if (allowed(e.detail.autoMerge)) el.autoMerge = e.detail.autoMerge; // …until the app sets it
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
import "@adamstavely/trenchcoat/pull-request";
import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";

const props = defineProps<{ initial: TcPullRequest["autoMerge"] }>();
const autoMerge = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onAutoMergeChange = (e: CustomEvent<{ autoMerge: TcPullRequest["autoMerge"] }>) => {
  e.preventDefault();
  autoMerge.value = e.detail.autoMerge;
};
</script>

<template>
  <tc-pull-request :autoMerge="autoMerge" @tc-auto-merge-change="onAutoMergeChange"></tc-pull-request>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { PullRequest } from "@adamstavely/trenchcoat/angular/pull-request";
import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";

@Component({
  selector: "app-controlled-pull-request",
  imports: [PullRequest],
  template: `<tc-pull-request [autoMerge]="autoMerge()" (tc-auto-merge-change)="onAutoMergeChange($event)"></tc-pull-request>`,
})
export class ControlledPullRequest {
  readonly initial = input.required<TcPullRequest["autoMerge"]>();
  readonly autoMerge = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onAutoMergeChange(e: CustomEvent<{ autoMerge: TcPullRequest["autoMerge"] }>) {
    e.preventDefault();
    this.autoMerge.set(e.detail.autoMerge);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/pull-request";
  import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";

  let { initial }: { initial: TcPullRequest["autoMerge"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let autoMerge = $derived(initial);
  let el: TcPullRequest;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      autoMerge = (e as CustomEvent<{ autoMerge: TcPullRequest["autoMerge"] }>).detail.autoMerge;
    };
    el.addEventListener("tc-auto-merge-change", on);
    return () => el.removeEventListener("tc-auto-merge-change", on);
  });
</script>

<tc-pull-request bind:this={el} {autoMerge}></tc-pull-request>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-pull-request")` returns a `TcPullRequest` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";`
- **React / Next.js:** Props: `import type { PullRequestProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof PullRequest>`. The element class, for refs: `import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcPullRequest["updatedAt"]` with `import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";`
- **Angular:** The directive types the template: `[updatedAt]` takes `TcPullRequest["updatedAt"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcPullRequest } from "@adamstavely/trenchcoat/pull-request";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading; "" leaves the header out |
| `autoMerge` | `boolean` | Merge on its own once the checks pass – controlled when given |
| `defaultAutoMerge` | `boolean` | At first, when `autoMerge` isn't controlled |
| `onAutoMergeChange` | `(autoMerge: boolean) => void` | The auto-merge switch changed |
| `mergeMethod` | `PullRequestMergeMethod` | How Merge merges – controlled when given |
| `defaultMergeMethod` | `PullRequestMergeMethod` | At first, when `mergeMethod` isn't controlled |
| `onMergeMethodChange` | `(mergeMethod: PullRequestMergeMethod) => void` | Another merge method was picked |

*Renamed or hidden on the wrapper: `heading`, `autoMerge`, `mergeMethod`, `children`*

## Accessibility

### Keyboard

The controls follow normal tab order.

| Key | What it does |
|---|---|
| Tab | Moves through the title, the checks, Update branch or Resolve, the switch, the method and the main button |
| Enter / Space | Presses the focused button, or flips the switch |
| ↑ / ↓ | Change the merge method |

### Screen readers

The state, review and whether it can merge are words, not just colour. The branches read as "head into base", and the
lines changed as "412 lines added, 57 lines removed". A disabled Merge is described by the reason under it. After Merge,
Mark ready, Update branch or Resolve, `role="status"` says what's under way, unless the event was prevented.

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | internal/settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | internal/settings, tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, internal/kit, internal/settings | Focus rings for keyboard users. |
| Object.hasOwn() | 93 | 92 | 15.4 | 15.4 | itself | – |
| structuredClone() | 98 | 94 | 15.4 | 15.4 | internal/settings | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, internal/settings, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Intl.RelativeTimeFormat | 71 (Edge 79) | 65 | 14 | 14 | itself | – |

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
| **This component alone** | 24.7 KB | 7.7 KB |
| Lit · the library every element is built on, the parts it uses | 19.5 KB | – |
| `internal/settings` · Shared Trenchcoat code | 14.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.2 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 0.1 KB | – |
| [switch](switch.md) · Element it renders | 0.7 KB | – |
| **Added to a page that already has Lit** | **47.6 KB** | **12.9 KB** |
| With Lit – the first component on a page | 68.2 KB | 19.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 68 DOM nodes – to layout, median of 7 |
| Typical update | **0.3 ms** | one item of mergeMethods replaced |
| First on the page | 8.5 ms | default properties; includes adding its CSS to the document |
| 100 items | 1.9 ms | mergeMethods: first render, 165 nodes; update 1.2 ms |
| 1,000 items | 20 ms | mergeMethods: first render, 1,065 nodes; update 11 ms |

1,000 items of mergeMethods: 20 ms, 1,065 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

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

- Use the pull request's own title; the number is added after it.
- Pass `reviewers` with each person's state, so "Approved by m.lindqvist" names someone.
- Leave `checks` unset when the repository has none, rather than passing zeros.
- `updatedAt` takes epoch ms or an ISO string; pass `now` for times that don't move, such as in a screenshot.

## Do and don't

### Do

- Set `busy` while a merge or an update is running, and clear it when the new data arrives.
- Change `state`, `mergeable` and `checks` after the server answers; the element doesn't guess.
- Prevent `tc-open` to open the pull request inside your app instead of following the link.

### Don't

- Don't rely on the disabled Merge for safety: the server still decides what may merge.
- Don't show it for a branch with no remote: there's nothing to merge into yet.

## Related

- [Change List](change-list.md) – Proposed code changes as compact rows – state, title, where it is, lines added and removed, and its checks, with a menu per row and Show more.
- [Check Status](check-status.md) – The automated checks on a change – a summary in words and a row for each, failing first, with Re-run, or just a mark and "5/11" for a list row.
- [Branch Switcher](branch-switcher.md) – the current branch with ahead/behind counts and a filterable list of worktrees, local and remote branches to switch to or create from.
- [Diff Viewer](diff-viewer.md) – The changes to a set of files – totals, a row per file with its status and lines added and removed, opening to a line diff
