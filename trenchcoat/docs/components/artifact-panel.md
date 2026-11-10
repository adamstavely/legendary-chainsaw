<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Artifact Panel

**Agents** · New

Everything a run produced in one place – files, code, documents and images with a preview for each, versions you can diff, and download

- **Element:** `<tc-artifact-panel>`
- **Size:** 30.1 KB gzip · 117.5 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/artifact-panel";` |
| React / Next.js | `import { ArtifactPanel } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/artifact-panel";` · tags starting with tc- are custom elements |
| Angular | `import { ArtifactPanel } from "@adamstavely/trenchcoat/angular/artifact-panel";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/artifact-panel";` |

## Example

The live example is in the gallery at `#/artifact-panel`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

Everything an agent run produced, in one place: documents, code, images and tables, listed on the left with a preview
of the one picked. Each artifact keeps its versions, so people can step back through them and turn on Compare to see
what changed since the version before – words for documents, lines for code, rows for tables, before and after for
images. Download saves the version shown. An artifact the run is still writing says “Writing” in the list and streams
into its preview.

### When to use

- Beside a chat or an agent run that produces files people will keep: reports, scripts, charts, exports.
- When the same file goes through several drafts and people want to see what each draft changed.
- Collecting outputs of different types – text, code, images, tables – behind one list.

### When not to use

- A single piece of code with Copy and Apply – use [Code Block](code-block.md).
- Showing the changes in one text, without a list or versions – use [Inline Diff](inline-diff.md).
- Comparing two whole runs side by side – use [Run Compare](run-compare.md).
- A grid of generated images to pick from – use [Image Grid](image-grid.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **List** `.ui-artp__list` – everything the run produced, with type, size and version count
2. **Artifact** `.ui-artp__option:nth-child(3)` – one file in the list; “Writing” while the run produces it
3. **Title bar** `.ui-artp__bar` – the file's name and the version's note; version chips and Compare sit below it
4. **Download** `.ui-artp__bar .ui-artp__btn` – saves the version shown
5. **Preview** `.ui-artp__preview` – the document, code, image or table
6. **Caption** `.ui-artp__foot` – how many files and versions, or what's being written

## Looks

Standard sets a white card on the gray tray, with the list on a gray column and the picked file raised on it; the
caption (“3 files · 6 versions”) sits on the tray below. Clean is one white card with hairline rows, the picked file
on a light fill, and the caption as the card's last row. On a narrow card both put the list above the preview.

## Usage

### HTML

```html
<tc-artifact-panel id="outputs"></tc-artifact-panel>

<script type="module">
  import "@adamstavely/trenchcoat/artifact-panel";
  import "@adamstavely/trenchcoat/tokens.css";

  const panel = document.querySelector("#outputs");
  panel.artifacts = [
    {
      id: "report",
      name: "churn-report.md",
      kind: "text",
      versions: [
        { id: "r1", note: "First draft", content: "# Q3 churn\n\nChurn rose to 4.1%." },
        { id: "r2", note: "Added the cause", content: "# Q3 churn\n\nChurn rose to 4.1%, mostly on Starter." },
      ],
    },
    { id: "plot", name: "plot.py", kind: "code", language: "py", versions: [{ id: "p1", content: "import pandas as pd\n" }] },
  ];
  panel.addEventListener("tc-download", (e) => console.log("Saving", e.detail.artifact.name));
</script>
```

### React / Next.js

```tsx
import { ArtifactPanel, type Artifact } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const artifacts: Artifact[] = [
  {
    id: "report",
    name: "churn-report.md",
    kind: "text",
    size: "2.1 KB",
    versions: [
      { id: "r1", time: "14 min ago", note: "First draft", content: "# Q3 churn\n\nChurn rose to 4.1%." },
      { id: "r2", time: "2 min ago", note: "Added the cause", content: "# Q3 churn\n\nChurn rose to 4.1%, mostly on Starter." },
    ],
  },
];

export function RunOutputs() {
  return <ArtifactPanel artifacts={artifacts} defaultView="diff" onDownload={(artifact) => console.log(artifact.name)} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/artifact-panel";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";

defineProps<{ artifacts: TcArtifactPanel["artifacts"] }>();
const onSelectedChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-artifact-panel :artifacts="artifacts" @tc-selected-change="onSelectedChange"></tc-artifact-panel>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ArtifactPanel } from "@adamstavely/trenchcoat/angular/artifact-panel";
import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";

@Component({
  selector: "app-artifact-panel-example",
  imports: [ArtifactPanel],
  template: `<tc-artifact-panel [artifacts]="artifacts()" (tc-selected-change)="onSelectedChange($event)"></tc-artifact-panel>`,
})
export class ArtifactPanelExample {
  readonly artifacts = input.required<TcArtifactPanel["artifacts"]>();
  onSelectedChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/artifact-panel";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";

  let { artifacts }: { artifacts: TcArtifactPanel["artifacts"] } = $props();
  let el: TcArtifactPanel;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-artifact-panel bind:this={el} {artifacts}></tc-artifact-panel>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `artifacts` | – | `Artifact[]` | `[]` | What the run produced |
| `selected` | `selected` | `string` | `""` | The id of the artifact shown; empty shows the first. Changed by the user unless a tc-selected-change listener calls preventDefault() |
| `version` | `version` | `string` | `""` | The id of the version shown; empty shows the latest. Changed by the user unless a tc-version-change listener calls preventDefault() |
| `view` | `view` | `ArtifactPanelView` | `"preview"` | "preview", or "diff" to compare the version with the one before. Changed by the user unless a tc-view-change listener calls preventDefault() |
| `heading` | `heading` | `string` | `"Artifacts"` | The heading, and the region's name |
| `emptyLabel` | `empty-label` | `string` | `"Nothing produced yet"` | Shown when there is nothing yet |
| `previewHeight` | `preview-height` | `number` | `360` | The preview's height cap in px; longer content scrolls |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-selected-change` | – | Yes | An artifact was picked in the list ({ id, selected }: ArtifactSelectedChange – both the artifact's id); cancelable |
| `tc-version-change` | – | Yes | A version was picked, or picking another artifact went back to its latest ({ artifact: string, version: string }); cancelable |
| `tc-view-change` | – | Yes | Compare was turned on or off ({ view: "preview" \| "diff" }); cancelable |
| `tc-download` | – | Yes | Download was pressed ({ artifact: Artifact, version: ArtifactVersion }); cancelable – unless prevented, the element saves the file |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-artifact-panel-preview-h` | `360px` | not set – this fallback applies |

#### Design tokens it reads (84)

`--tc-accent`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-border-subtle`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-sm`, `--tc-duration-fast`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-lg-plus`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xl`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-semibold`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-loose`, `--tc-line-height-normal`, `--tc-line-height-relaxed`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-radius-badge`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-seg-pad`, `--tc-seg-thumb-bg`, `--tc-seg-thumb-shadow`, `--tc-seg-track-bg`, `--tc-seg-track-radius`, `--tc-shadow-raised`, `--tc-shadow-sunken`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-4-5`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tone-pink-fg`, `--tc-tone-violet-fg`, `--tc-tracking-normal`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `artifactTableToCsv(t: ArtifactTable): void` | A table as CSV text, with a header row |
| `artifactTableFromCsv(text: string): ArtifactTable` | CSV text (first row: the columns) as a table |
| `saveArtifact(artifact: Artifact, version: ArtifactVersion): void` | Saves a version as a file: a Blob for text, code and tables, the image's own URL for images |

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
| `artifacts` | `el.artifacts = …;` | `<… artifacts={…} />` | `<tc-artifact-panel :artifacts="…">` | `<tc-artifact-panel [artifacts]="…">` | `<tc-artifact-panel {artifacts}>` |

*Also attributes: `selected`, `version`, `view`, `heading`, `empty-label`, `preview-height` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-selected-change` | Yes | `el.addEventListener("tc-selected-change", (e) => …)` | `onSelectedChange={…}` | `@tc-selected-change="…"` | `(tc-selected-change)="…($event)"` | `el.addEventListener("tc-selected-change", …)` |
| `tc-version-change` | Yes | `el.addEventListener("tc-version-change", (e) => …)` | `onVersionChange={…}` | `@tc-version-change="…"` | `(tc-version-change)="…($event)"` | `el.addEventListener("tc-version-change", …)` |
| `tc-view-change` | Yes | `el.addEventListener("tc-view-change", (e) => …)` | `onViewChange={…}` | `@tc-view-change="…"` | `(tc-view-change)="…($event)"` | `el.addEventListener("tc-view-change", …)` |
| `tc-download` | Yes | `el.addEventListener("tc-download", (e) => …)` | `onDownload={…}` | `@tc-download="…"` | `(tc-download)="…($event)"` | `el.addEventListener("tc-download", …)` |

### Controlled

The element changes `selected`, `version` and `view` itself unless a listener calls `preventDefault()` on `tc-selected-change`, `tc-version-change` or `tc-view-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-artifact-panel id="artifact-panel"></tc-artifact-panel>

<script type="module">
  import "@adamstavely/trenchcoat/artifact-panel";

  const el = document.querySelector("#artifact-panel");
  el.addEventListener("tc-selected-change", (e) => {
    e.preventDefault(); // the element keeps its selected…
    if (allowed(e.detail.selected)) el.selected = e.detail.selected; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { ArtifactPanel } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ArtifactPanel>;
type Props = Omit<Own, "selected" | "onSelectedChange"> & { initial: NonNullable<Own["selected"]> };

// Controlled: passing selected makes the wrapper prevent the element's own change; the app sets it
export function ControlledArtifactPanel({ initial, ...props }: Props) {
  const [selected, setSelected] = useState<Own["selected"]>(initial);
  return <ArtifactPanel {...props} selected={selected} onSelectedChange={(next) => setSelected(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/artifact-panel";
import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";

const props = defineProps<{ initial: TcArtifactPanel["selected"] }>();
const selected = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onSelectedChange = (e: CustomEvent<{ selected: TcArtifactPanel["selected"] }>) => {
  e.preventDefault();
  selected.value = e.detail.selected;
};
</script>

<template>
  <tc-artifact-panel :selected="selected" @tc-selected-change="onSelectedChange"></tc-artifact-panel>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ArtifactPanel } from "@adamstavely/trenchcoat/angular/artifact-panel";
import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";

@Component({
  selector: "app-controlled-artifact-panel",
  imports: [ArtifactPanel],
  template: `<tc-artifact-panel [selected]="selected()" (tc-selected-change)="onSelectedChange($event)"></tc-artifact-panel>`,
})
export class ControlledArtifactPanel {
  readonly initial = input.required<TcArtifactPanel["selected"]>();
  readonly selected = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onSelectedChange(e: CustomEvent<{ selected: TcArtifactPanel["selected"] }>) {
    e.preventDefault();
    this.selected.set(e.detail.selected);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/artifact-panel";
  import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";

  let { initial }: { initial: TcArtifactPanel["selected"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let selected = $derived(initial);
  let el: TcArtifactPanel;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      selected = (e as CustomEvent<{ selected: TcArtifactPanel["selected"] }>).detail.selected;
    };
    el.addEventListener("tc-selected-change", on);
    return () => el.removeEventListener("tc-selected-change", on);
  });
</script>

<tc-artifact-panel bind:this={el} {selected}></tc-artifact-panel>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-artifact-panel")` returns a `TcArtifactPanel` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";`
- **React / Next.js:** Props: `import type { ArtifactPanelProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ArtifactPanel>`. The element class, for refs: `import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcArtifactPanel["artifacts"]` with `import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";`
- **Angular:** The directive types the template: `[artifacts]` takes `TcArtifactPanel["artifacts"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcArtifactPanel } from "@adamstavely/trenchcoat/artifact-panel";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the region's name |
| `selected` | `string` | The id of the artifact shown (controlled); empty shows the first |
| `defaultSelected` | `string` | The artifact shown first when `selected` isn't given |
| `onSelectedChange` | `(id: string) => void` | Called with the artifact's id when the user picks one in the list |
| `version` | `string` | The id of the version shown (controlled); empty shows the latest |
| `defaultVersion` | `string` | The version shown first when `version` isn't given; empty shows the latest |
| `onVersionChange` | `(version: string, artifactId: string) => void` | A version was picked; picking another artifact goes back to its latest ("") |
| `view` | `ArtifactPanelView` | "preview", or "diff" to compare with the version before (controlled) |
| `defaultView` | `ArtifactPanelView` | The view to start in when `view` isn't given |
| `onViewChange` | `(view: ArtifactPanelView) => void` | Called when the user turns Compare on ("diff") or off ("preview") |
| `onDownload` | `(artifact: Artifact, version: ArtifactVersion, event: Event) => void` | Download was pressed. The panel saves the file itself unless you call event.preventDefault() |

*Renamed or hidden on the wrapper: `heading`, `selected`, `version`, `view`*

## Accessibility

Follows the WAI-ARIA [Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the list, Download, the versions, Compare and the preview |
| ↓ / ↑ | In the list: picks the next or previous file |
| Home / End | In the list: the first or last file; in the versions: the first or latest version |
| A letter | In the list: jumps to the next file whose name starts with what was typed |
| → / ← (or ↓ / ↑) | In the versions: picks the next or previous version, wrapping around |
| Enter / Space | Presses Download or Compare |

Selection follows focus in the list and in the versions. The document and table previews are focusable so they
can be scrolled with the arrow keys.

### Screen readers

The panel is a region named by its heading (“Artifacts”). The list is a listbox named “Files”; each option reads
its name and then its type, size and number of versions, and whether it's selected. The versions
are a radio group named “Versions”, each read with its time and note (“v3, 2 min ago, Tightened the intro,
latest”). Compare is a toggle button (`aria-pressed`). In a comparison, removed and added text is introduced as
“Removed:” and “Added:”, and table rows as “Added row:” or “Removed row:”. Download is named “Download
churn-report.md”, and a status region says “Downloading churn-report.md”. A document still being written is
`aria-busy`.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, code-block, internal/base, inline-diff, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | code-block | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | inline-diff | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself, code-block | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-04 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 33.4 KB | 9.9 KB |
| Lit · the library every element is built on, the parts it uses | 21.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.6 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| [inline-diff](inline-diff.md) · Element it renders | 42.3 KB | – |
| [code-block](code-block.md) · Element it renders | 32.3 KB | – |
| **Added to a page that already has Lit** | **117.5 KB** | **30.2 KB** |
| With Lit – the first component on a page | 139.9 KB | 37.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.3 ms** | the gallery demo's data, 99 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of artifacts replaced |
| First on the page | 8.3 ms | default properties; includes adding its CSS to the document |
| 100 items | 4.6 ms | artifacts: first render, 963 nodes; update 0.5 ms |
| 1,000 items | 38 ms | artifacts: first render, 9,063 nodes; update 3.8 ms |

1,000 items of artifacts: 38 ms, 9,063 nodes. It renders every item – past a few thousand, page through them or use a windowed list.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- Timers: `setTimeout`, `setTimeout` (code-block), `setTimeout` (inline-diff).
- 4 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (inline-diff), `MutationObserver` (internal/controllers – FocusRescueController).
- Listens on the page: `document keydown` (inline-diff), `document pointerdown` (inline-diff).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Use the real file name with its extension in `name` – it's what people recognise, and the download's name.
- Write each version's `note` as what changed, in a few words: “Tightened the intro”, “Added Q2 comparison”.
- Give images an `alt` that says what the picture shows, not the file name.
- Keep `time` relative and short: “2 min ago”.

## Do and don't

### Do

- Mark an artifact `status: "writing"` while the run produces it, and add versions as they arrive.
- Set `language` on code so it gets the right colours and label.
- Listen for `tc-download` (React: `onDownload`) and call `preventDefault()` to serve the file from your own storage.

### Don't

- Don't put unrelated uploads in it – it's for what the run produced.
- Don't create a new artifact for each draft of the same file; add a version instead, so Compare works.
- Don't set `previewHeight` so tall that the versions and the preview don't fit on screen together.

## Related

- [Code Block](code-block.md) – Code that streams in with syntax colours from the theme – Copy, Apply, and a diff against the current file before you apply it
- [Inline Diff](inline-diff.md) – AI edits to prose shown inline – struck and added words you accept or reject one by one, with keys, a popover and undo
- [Run Compare](run-compare.md) – Two runs or two prompt versions side by side – outputs, steps, cost and time, with every difference highlighted
- [Image Grid](image-grid.md) – Generated images as a grid of variations – upscale, regenerate one tile, compare two, download, and alt text for every image

## Changelog

- **Event details:** four change events gained a field named after the property they change. The existing fields stay. The docs' controlled examples read these names, which the events lacked; the new Angular type check caught it. - `tc-artifact-panel`'s `tc-selected-change`: `selected`. - `tc-email-draft`'s `tc-recipient-change`: `recipient`. - `tc-reliance-gauge`'s `tc-review-level-change`: `reviewLevel`. - `tc-transcript-review`'s `tc-translation-mode-change`: `translationMode`.
- `tc-artifact-panel` – what a run produced: a list, a preview per kind (Markdown text, code through `tc-code-block`, images, tables from CSV), versions with a diff against the one before, and download (a Blob by default, cancelable).
