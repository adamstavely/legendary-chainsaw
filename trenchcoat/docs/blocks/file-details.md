<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Blocks](README.md)

# File Details

**Blocks** · New

One file in one place – what it is, the team's flag on it, what's in it, its versions, and who it's shared with after their entitlements are checked (uses `team-flag-picker`, `file-summary`, `version-history`, `share-panel`)

- **Element:** `<tc-file-details>`
- **Size:** 33.4 KB gzip · 123.7 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/file-details";` |
| React / Next.js | `import { FileDetails } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/file-details";` · tags starting with tc- are custom elements |
| Angular | `import { FileDetails } from "@adamstavely/trenchcoat/angular/file-details";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/file-details";` |

## Example

The live example is in the gallery at `#/blocks/file-details`, in both looks; Replay restarts its animations.

## Overview

One file in one place: what it is, the team's flag on it, what's in it, its versions, and who it's shared with after
their entitlements are checked. It composes `tc-team-flag-picker`, `tc-file-summary`, `tc-version-history` and
`tc-share-panel`.

### When to use

- A file's own page, or a large panel opened from a list of files.
- Files that a team reviews, flags and shares under access rules.

### When not to use

- A row in a list – use [Team Flag Picker](../components/team-flag-picker.md) on its own.
- Only reading what's in a file – use [File Summary](../components/file-summary.md).
- Only sharing – use [Share Panel](../components/share-panel.md).

## Anatomy

1. **Header** `.ui-fld__head` – the preview, name and details
2. **Name** `.ui-fld__name` – the file's name, as the page's heading level 2
3. **Actions** `.ui-fld__actions` – the team's flag and Open
4. **Main** `.ui-fld__main` – the summary and versions, each left out when there's nothing to show
5. **Side** `.ui-fld__side` – sharing, beside the rest on a wide page and below it on a narrow one

## Looks

The composed components follow Standard or Clean. A page can set `--tc-fld-preview`.

## Usage

### HTML

```html
<tc-file-details id="file" flag="review"></tc-file-details>

<script type="module">
  import "@adamstavely/trenchcoat/file-details";
  import "@adamstavely/trenchcoat/tokens.css";

  const details = document.querySelector("#file");
  details.file = { name: "Trial 12 results.pdf", size: 2400000, owner: "Noor Haddad" };
  details.flags = [{ id: "review", label: "Needs review", color: "#CA8A04" }];
  details.directory = [{ id: "noor", kind: "person", name: "Noor Haddad" }];
  details.checkEntitlement = async () => ({ status: "allowed" });
  details.addEventListener("tc-flag-change", (e) => console.log(e.detail.flag));
</script>
```

### React / Next.js

```tsx
import { FileDetails } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ResultsFile() {
  return (
    <FileDetails
      file={{ name: "Trial 12 results.pdf", size: 2400000, owner: "Noor Haddad" }}
      flags={[{ id: "review", label: "Needs review", color: "#CA8A04" }]}
      defaultFlag="review"
      directory={[{ id: "noor", kind: "person", name: "Noor Haddad" }]}
      checkEntitlement={async () => ({ status: "allowed" })}
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/file-details";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";

defineProps<{ file: TcFileDetails["file"]; flags: TcFileDetails["flags"] }>();
const onFlagChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-file-details :file="file" :flags="flags" @tc-flag-change="onFlagChange"></tc-file-details>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { FileDetails } from "@adamstavely/trenchcoat/angular/file-details";
import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";

@Component({
  selector: "app-file-details-example",
  imports: [FileDetails],
  template: `<tc-file-details [file]="file()" [flags]="flags()" (tc-flag-change)="onFlagChange($event)"></tc-file-details>`,
})
export class FileDetailsExample {
  readonly file = input.required<TcFileDetails["file"]>();
  readonly flags = input.required<TcFileDetails["flags"]>();
  onFlagChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-details";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";

  let { file, flags }: { file: TcFileDetails["file"]; flags: TcFileDetails["flags"] } = $props();
  let el: TcFileDetails;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-flag-change", on);
    return () => el.removeEventListener("tc-flag-change", on);
  });
</script>

<tc-file-details bind:this={el} {file} {flags}></tc-file-details>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `file` | – | `FileDetailsFile` | `{ name: "Untitled" }` | The file |
| `href` | `href` | `string \| undefined` | `undefined` | Where the file opens; without it, Open only fires tc-open |
| `flags` | – | `TeamFlag[]` | `[]` | The team's flags |
| `flag` | `flag` | `string \| null` | `null` | The id of the file's flag, or null for none. Changed by the user unless a tc-flag-change listener calls preventDefault() |
| `manageFlags` | `manage-flags` | `boolean` | `false` | Offer a link to the team's flags in the picker, for people who may edit them |
| `summaryStatus` | `summary-status` | `FileSummaryStatus` | `"idle"` | Where the summary is: "idle", "summarising", "done" or "error". Without a summary and when "idle", the section is left out |
| `summary` | `summary` | `string` | `""` | The summary; may grow while "summarising" |
| `points` | – | `FileSummaryPoint[]` | `[]` | The summary's key points |
| `entities` | – | `FileSummaryEntity[]` | `[]` | The people, organisations, dates and amounts in the file |
| `versions` | – | `VersionEntry[]` | `[]` | The file's versions, newest first |
| `access` | – | `ShareGrant[]` | `[]` | Who has access now. Updated on Share unless a tc-share listener calls preventDefault() |
| `directory` | – | `ShareRecipient[]` | `[]` | The people and groups to share with |
| `search` | – | `ShareSearch \| undefined` | `undefined` | Looks people and groups up on the server, instead of `directory` |
| `levels` | – | `ShareLevel[] \| undefined` | `undefined` | The levels of access, least first |
| `checkEntitlement` | – | `ShareEntitlementCheck \| undefined` | `undefined` | Asks whether a recipient may see this file at a level. Without it nobody can be added |
| `locale` | `locale` | `string \| undefined` | `undefined` | The locale for sizes and dates |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-flag-change` | – | Yes | The file's flag was picked or cleared ({ flag, value }: FileDetailsFlagChange); cancelable – prevented, `flag` stays as it was |
| `tc-open` | – | No | Open was pressed, when there's no `href` (detail: null) |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-fld-preview` | `88px` | both |

#### Design tokens it reads (17)

`--tc-card-radius`, `--tc-card-shadow`, `--tc-control-radius-md`, `--tc-fill-hover`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-sm`, `--tc-font-weight-medium`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-space-1`, `--tc-space-2`, `--tc-space-4`, `--tc-space-6`, `--tc-surface-raised`, `--tc-text-primary`, `--tc-text-secondary`

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
| `file` | `el.file = …;` | `<… file={…} />` | `<tc-file-details :file="…">` | `<tc-file-details [file]="…">` | `<tc-file-details {file}>` |
| `flags` | `el.flags = …;` | `<… flags={…} />` | `<tc-file-details :flags="…">` | `<tc-file-details [flags]="…">` | `<tc-file-details {flags}>` |
| `points` | `el.points = …;` | `<… points={…} />` | `<tc-file-details :points="…">` | `<tc-file-details [points]="…">` | `<tc-file-details {points}>` |
| `entities` | `el.entities = …;` | `<… entities={…} />` | `<tc-file-details :entities="…">` | `<tc-file-details [entities]="…">` | `<tc-file-details {entities}>` |
| `versions` | `el.versions = …;` | `<… versions={…} />` | `<tc-file-details :versions="…">` | `<tc-file-details [versions]="…">` | `<tc-file-details {versions}>` |
| `access` | `el.access = …;` | `<… access={…} />` | `<tc-file-details :access="…">` | `<tc-file-details [access]="…">` | `<tc-file-details {access}>` |
| `directory` | `el.directory = …;` | `<… directory={…} />` | `<tc-file-details :directory="…">` | `<tc-file-details [directory]="…">` | `<tc-file-details {directory}>` |
| `search` | `el.search = …;` | `<… search={…} />` | `<tc-file-details :search="…">` | `<tc-file-details [search]="…">` | `<tc-file-details {search}>` |
| `levels` | `el.levels = …;` | `<… levels={…} />` | `<tc-file-details :levels="…">` | `<tc-file-details [levels]="…">` | `<tc-file-details {levels}>` |
| `checkEntitlement` | `el.checkEntitlement = …;` | `<… checkEntitlement={…} />` | `<tc-file-details :checkEntitlement="…">` | `<tc-file-details [checkEntitlement]="…">` | `<tc-file-details {checkEntitlement}>` |

*Also attributes: `href`, `flag`, `manage-flags`, `summary-status`, `summary`, `locale` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-flag-change` | Yes | `el.addEventListener("tc-flag-change", (e) => …)` | `ref.current.addEventListener("tc-flag-change", …)` | `@tc-flag-change="…"` | `(tc-flag-change)="…($event)"` | `el.addEventListener("tc-flag-change", …)` |
| `tc-open` | No | `el.addEventListener("tc-open", (e) => …)` | `onTcOpen={…}` | `@tc-open="…"` | `(tc-open)="…($event)"` | `el.addEventListener("tc-open", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `flag` itself unless a listener calls `preventDefault()` on `tc-flag-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-file-details id="file-details"></tc-file-details>

<script type="module">
  import "@adamstavely/trenchcoat/file-details";

  const el = document.querySelector("#file-details");
  el.addEventListener("tc-flag-change", (e) => {
    e.preventDefault(); // the element keeps its flag…
    if (allowed(e.detail.flag)) el.flag = e.detail.flag; // …until the app sets it
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
import "@adamstavely/trenchcoat/file-details";
import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";

const props = defineProps<{ initial: TcFileDetails["flag"] }>();
const flag = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onFlagChange = (e: CustomEvent<{ flag: TcFileDetails["flag"] }>) => {
  e.preventDefault();
  flag.value = e.detail.flag;
};
</script>

<template>
  <tc-file-details :flag="flag" @tc-flag-change="onFlagChange"></tc-file-details>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { FileDetails } from "@adamstavely/trenchcoat/angular/file-details";
import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";

@Component({
  selector: "app-controlled-file-details",
  imports: [FileDetails],
  template: `<tc-file-details [flag]="flag()" (tc-flag-change)="onFlagChange($event)"></tc-file-details>`,
})
export class ControlledFileDetails {
  readonly initial = input.required<TcFileDetails["flag"]>();
  readonly flag = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onFlagChange(e: CustomEvent<{ flag: TcFileDetails["flag"] }>) {
    e.preventDefault();
    this.flag.set(e.detail.flag);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/file-details";
  import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";

  let { initial }: { initial: TcFileDetails["flag"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let flag = $derived(initial);
  let el: TcFileDetails;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      flag = (e as CustomEvent<{ flag: TcFileDetails["flag"] }>).detail.flag;
    };
    el.addEventListener("tc-flag-change", on);
    return () => el.removeEventListener("tc-flag-change", on);
  });
</script>

<tc-file-details bind:this={el} {flag}></tc-file-details>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-file-details")` returns a `TcFileDetails` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";`
- **React / Next.js:** Props: `import type { FileDetailsProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof FileDetails>`. The element class, for refs: `import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcFileDetails["file"]` with `import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";`
- **Angular:** The directive types the template: `[file]` takes `TcFileDetails["file"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcFileDetails } from "@adamstavely/trenchcoat/file-details";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `flag` | `string \| null` | The id of the file's flag, or null for none – controlled when given |
| `defaultFlag` | `string \| null` | The flag on mount when `flag` isn't controlled |
| `onFlagChange` | `(flag: string \| null) => void` | The file's flag was picked or cleared |

*Renamed or hidden on the wrapper: `flag`, `children`*

## Accessibility

### Keyboard

The header's controls come first, then each section in turn. See `team-flag-picker`, `file-summary`, `version-history`
and `share-panel` for what each one does.

### Screen readers

The file's name is a heading, the preview is decorative, and Open names the file. Each section announces what it does
itself, including who isn't authorized in the share panel.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself, file-summary, version-history, share-panel | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | file-summary, internal/kit, team-flag-picker, version-history, share-panel | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | version-history | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | version-history | Modals trap focus, close on Escape and sit in the top layer. |
| aspect-ratio | 88 | 89 | 15 | 15 | itself | – |
| inset | 87 | 66 | 14.1 | 14.1 | file-summary, internal/popover | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, file-summary, internal/base, team-flag-picker, version-history, share-panel, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | internal/util | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | internal/popover | – |
| IntersectionObserver | 51 (Edge 15) | 55 | 12.1 | 12.2 | internal/controllers | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-color | 121 | 64 | 26.2 | 26.2 | version-history | Scrollbars keep the browser's default colours. |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | version-history | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | file-summary, internal/card-head, internal/kit, team-flag-picker, internal/popover, internal/team-flag, version-history, share-panel, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | version-history | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This piece alone** | 8.8 KB | 3.7 KB |
| Lit · the library every element is built on, the parts it uses | 22.0 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 4.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/team-flag` · Shared Trenchcoat code | 0.8 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.6 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| [version-history](../components/version-history.md) · Element it renders | 34.9 KB | – |
| [share-panel](../components/share-panel.md) · Element it renders | 25.3 KB | – |
| [file-summary](../components/file-summary.md) · Element it renders | 24.0 KB | – |
| [team-flag-picker](../components/team-flag-picker.md) · Element it renders | 7.9 KB | – |
| **Added to a page that already has Lit** | **123.7 KB** | **33.4 KB** |
| With Lit – the first component on a page | 146.0 KB | 40.9 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.0 ms** | default properties, 43 DOM nodes – to layout, median of 7 |
| Typical update | **0.1 ms** | re-render with the same data |
| First on the page | 25 ms | default properties; includes adding its CSS to the document |

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (internal/popover – PopoverController), `requestAnimationFrame, cancelled` (internal/controllers – RowWindowController).
- Timers: `setTimeout` (file-summary), `setTimeout` (internal/popover – PopoverController), `setTimeout` (share-panel).
- 4 infinite CSS animations.
- Stops or pauses off screen and under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `IntersectionObserver` (internal/controllers – OffScreenController), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `window scroll` (internal/controllers – RowWindowController), `window resize` (internal/controllers – RowWindowController).
- Reads the clock: `performance.now()` (internal/controllers – RowWindowController).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

Give `size`, `owner` and `modified` where you have them, so people can tell they've got the right file. Open a file's
`preview` only from a source you trust; unsafe URLs are dropped.

## Do and don't

### Do

- Use the same `flags` here as in your file lists.
- Listen for `tc-share` here: it bubbles from the panel, and `preventDefault()` keeps `access` until the server accepts.
- Enforce entitlements on the server. The panel only tells the person sharing what to expect.

### Don't

- Don't nest it inside another card. Each section is already its own card.

## Related

- [Share Panel](../components/share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
- [Team Flag Picker](../components/team-flag-picker.md) – Picks one of a team's flags for a file – a small button with the flag's colour and name, opening a list of flags with what each one means.
- [File Summary](../components/file-summary.md) – What's in a file without opening it – an AI summary that streams in, key points citing their pages or times, the people, organisations, dates and amounts it mentions, and Copy, Regenerate and Open file
- [Version History](../components/version-history.md) – The versions of an agent, prompt or workflow – draft, active or deprecated, who and when, and what changed in behaviour

## Changelog

- **File Details** (`tc-file-details`) – a block with one file's details, the team's flag, a summary, its versions and entitlement-checked sharing.
