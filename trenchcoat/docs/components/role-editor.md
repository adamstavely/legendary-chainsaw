<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Role Editor

**Workspace & sessions** · New

What each role can do – permissions grouped as Agents, Data, Billing and Admin against roles as a grid of ticks, dependent permissions kept in step with a note saying what else changed, a locked Owner, member counts, custom roles to add, rename and delete, and a summary of unsaved changes with Discard and Save

- **Element:** `<tc-role-editor>`
- **Size:** 11.5 KB gzip · 39.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/role-editor";` |
| React / Next.js | `import { RoleEditor } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/role-editor";` · tags starting with tc- are custom elements |
| Angular | `import { RoleEditor } from "@adamstavely/trenchcoat/angular/role-editor";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/role-editor";` |

## Example

The live example is in the gallery at `#/role-editor`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

What each role in a workspace can do. Permissions are the rows, grouped as Agents, Data, Billing and Admin; roles are the
columns – Owner, Admin, Builder, Member, Viewer and any custom roles – and each cell is a tick. Some permissions need
others: turning on Deploy agents turns on Edit agents and View agents too, turning off View agents turns off what needs
it, and a note says what else changed. Owner is locked. Custom roles can be added, renamed and deleted, each column says
how many members have the role, and a summary lists what changed since the last save, with Discard and Save.

### When to use

- A workspace's settings, where admins decide what each role may do.
- Adding a role for a group that needs a mix of rights, such as auditors who read data and the audit log.
- Reviewing a batch of role changes together before saving them.

### When not to use

- Which tools each agent may use – use [Tool Permissions](tool-permissions.md).
- One person asking for a right they don't have – use [Access Request](access-request.md).
- Who is in the team and what role each person has – use [Team Roster](team-roster.md).
- Sharing one item with people – use [Share Panel](share-panel.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **New role** `.ui-rle__add` – adds a custom role and starts renaming it
2. **Role** `.ui-rle__role` – a column: name, a lock for Owner, member count, Rename and Delete for custom roles
3. **Group** `.ui-rle__group` – a row heading: Agents, Data, Billing, Admin
4. **Permission** `.ui-rle__perm` – a row: what the role may do, with a quiet description
5. **Cell** `.ui-rle__cell` – a tick box; a dot marks a change since the last save
6. **Note** `.ui-rle__note` – what a change also turned on or off
7. **Confirm** `.ui-rle__confirm` – Delete role, with how many members lose it
8. **Changes** `.ui-rle__summary` – every difference from what was saved
9. **Save** `.ui-rle__answer` – Discard and Save, with the number of changes

## Looks

Standard is a white card on a gray tray, with Discard and Save sitting on the tray below it. Clean is one white card with
the buttons in its last row. The grid works the same in both; the permission column stays put while roles scroll sideways.

## Usage

### HTML

```html
<tc-role-editor id="roles" description="What each role can do."></tc-role-editor>

<script type="module">
  import "@adamstavely/trenchcoat/role-editor";
  import "@adamstavely/trenchcoat/tokens.css";

  const roles = document.querySelector("#roles");
  roles.roles = [
    { id: "owner", name: "Owner", members: 1, locked: true, permissions: ["agents.view", "agents.edit", "agents.deploy", "data.view", "data.export", "billing.view", "billing.manage", "admin.members", "admin.roles", "admin.audit"] },
    { id: "builder", name: "Builder", members: 6, permissions: ["agents.view", "agents.edit", "data.view"] },
    { id: "viewer", name: "Viewer", members: 9, permissions: ["agents.view"] },
  ];
  roles.addEventListener("tc-roles-save", (e) => console.log(e.detail.changes));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { RoleEditor, type Role } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const start: Role[] = [
  { id: "owner", name: "Owner", members: 1, locked: true, permissions: ["agents.view", "agents.edit", "agents.deploy"] },
  { id: "member", name: "Member", members: 24, permissions: ["agents.view"] },
];

export function Roles() {
  const [roles, setRoles] = useState(start);
  const [saved, setSaved] = useState(start);
  return <RoleEditor title="Roles" roles={roles} onRolesChange={setRoles} saved={saved} onRolesSave={setSaved} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/role-editor";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";

defineProps<{ groups: TcRoleEditor["groups"]; roles: TcRoleEditor["roles"] }>();
const onRolesChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-role-editor :groups="groups" :roles="roles" @tc-roles-change="onRolesChange"></tc-role-editor>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { RoleEditor } from "@adamstavely/trenchcoat/angular/role-editor";
import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";

@Component({
  selector: "app-role-editor-example",
  imports: [RoleEditor],
  template: `<tc-role-editor [groups]="groups()" [roles]="roles()" (tc-roles-change)="onRolesChange($event)"></tc-role-editor>`,
})
export class RoleEditorExample {
  readonly groups = input.required<TcRoleEditor["groups"]>();
  readonly roles = input.required<TcRoleEditor["roles"]>();
  onRolesChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/role-editor";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";

  let { groups, roles }: { groups: TcRoleEditor["groups"]; roles: TcRoleEditor["roles"] } = $props();
  let el: TcRoleEditor;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-roles-change", on);
    return () => el.removeEventListener("tc-roles-change", on);
  });
</script>

<tc-role-editor bind:this={el} {groups} {roles}></tc-role-editor>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `heading` | `heading` | `string` | `"Roles"` | The heading, and the grid's name |
| `description` | `description` | `string \| undefined` | `undefined` | One line under the heading |
| `groups` | – | `RolePermissionGroup[]` | `[ { id: "agents", label: "Agents", permissions: [ { id: "agents.view", label: "View agents" }, { id: "agents.edit", label: "Edit agents", description: "Instructions, tools and triggers", requires: ["agents.view"] }, { id: "agents.deploy", label: "Deploy agents", description: "Put a draft live", requires: ["agents.edit"] }, ], }, { id: "data", label: "Data", permissions: [ { id: "data.view", label: "View data", description: "Conversations, runs and sources" }, { id: "data.export", label: "Export data", requires: ["data.view"] }, ], }, { id: "billing", label: "Billing", permissions: [ { id: "billing.view", label: "View billing" }, { id: "billing.manage", label: "Manage billing", description: "Plan, payment and limits", requires: ["billing.view"] }, ], }, { id: "admin", label: "Admin", permissions: [ { id: "admin.members", label: "Manage members" }, { id: "admin.roles", label: "Manage roles" }, { id: "admin.audit", label: "View the audit log" }, ], }, ]` | The rows: permissions, grouped |
| `roles` | – | `Role[]` | `[]` | The columns. Changed by the user unless a tc-roles-change listener calls preventDefault() |
| `saved` | – | `Role[] \| undefined` | `undefined` | What was last saved – the summary lists the differences. Unset: the roles the element first showed |
| `newRoleName` | `new-role-name` | `string` | `"New role"` | The name a new role starts with |
| `changesLimit` | `changes-limit` | `number` | `5` | Changes listed before "N more" |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-roles-change` | – | Yes | A cell, New role, a rename, a delete or Discard changed the roles ({ roles, change }: RolesChange); cancelable – prevented, `roles` stays as it was |
| `tc-roles-save` | – | Yes | Save was pressed ({ roles, changes }: RolesSave); cancelable – unless prevented, `saved` becomes the roles |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `changesOf(roles: Role[])` | `RoleDiff[]` | Every difference from the baseline, roles in column order |

#### Design tokens it reads (92)

`--tc-accent`, `--tc-accent-hover`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-control`, `--tc-border-control-hover`, `--tc-caption-color`, `--tc-caption-font-size`, `--tc-caption-font-weight`, `--tc-caption-line-height`, `--tc-caption-tracking`, `--tc-caption-transform`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-fast`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-h-sm`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-strong`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-hairline`, `--tc-icon-muted`, `--tc-kbd-font-size`, `--tc-kbd-font-weight`, `--tc-kbd-h`, `--tc-kbd-on-inverse-bg`, `--tc-kbd-px`, `--tc-kbd-radius`, `--tc-line-height-none`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-badge`, `--tc-radius-md`, `--tc-radius-xs`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3`, `--tc-space-4`, `--tc-space-6`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-warning-solid`, `--tc-surface-on-tray`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-on-accent`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultRolePermissionGroups: RolePermissionGroup[]` | The permissions used when the page gives none |

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
| `groups` | `el.groups = …;` | `<… groups={…} />` | `<tc-role-editor :groups="…">` | `<tc-role-editor [groups]="…">` | `<tc-role-editor {groups}>` |
| `roles` | `el.roles = …;` | `<… roles={…} />` | `<tc-role-editor :roles="…">` | `<tc-role-editor [roles]="…">` | `<tc-role-editor {roles}>` |
| `saved` | `el.saved = …;` | `<… saved={…} />` | `<tc-role-editor :saved="…">` | `<tc-role-editor [saved]="…">` | `<tc-role-editor {saved}>` |

*Also attributes: `heading`, `description`, `new-role-name`, `changes-limit` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-roles-change` | Yes | `el.addEventListener("tc-roles-change", (e) => …)` | `onRolesChange={…}` | `@tc-roles-change="…"` | `(tc-roles-change)="…($event)"` | `el.addEventListener("tc-roles-change", …)` |
| `tc-roles-save` | Yes | `el.addEventListener("tc-roles-save", (e) => …)` | `onRolesSave={…}` | `@tc-roles-save="…"` | `(tc-roles-save)="…($event)"` | `el.addEventListener("tc-roles-save", …)` |

### Controlled

The element changes `roles` itself unless a listener calls `preventDefault()` on `tc-roles-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-role-editor id="role-editor"></tc-role-editor>

<script type="module">
  import "@adamstavely/trenchcoat/role-editor";

  const el = document.querySelector("#role-editor");
  el.addEventListener("tc-roles-change", (e) => {
    e.preventDefault(); // the element keeps its roles…
    if (allowed(e.detail.roles)) el.roles = e.detail.roles; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { RoleEditor } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof RoleEditor>;
type Props = Omit<Own, "roles" | "onRolesChange"> & { initial: NonNullable<Own["roles"]> };

// Controlled: passing roles makes the wrapper prevent the element's own change; the app sets it
export function ControlledRoleEditor({ initial, ...props }: Props) {
  const [roles, setRoles] = useState<Own["roles"]>(initial);
  return <RoleEditor {...props} roles={roles} onRolesChange={(next) => setRoles(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/role-editor";
import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";

const props = defineProps<{ initial: TcRoleEditor["roles"] }>();
const roles = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onRolesChange = (e: CustomEvent<{ roles: TcRoleEditor["roles"] }>) => {
  e.preventDefault();
  roles.value = e.detail.roles;
};
</script>

<template>
  <tc-role-editor :roles="roles" @tc-roles-change="onRolesChange"></tc-role-editor>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { RoleEditor } from "@adamstavely/trenchcoat/angular/role-editor";
import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";

@Component({
  selector: "app-controlled-role-editor",
  imports: [RoleEditor],
  template: `<tc-role-editor [roles]="roles()" (tc-roles-change)="onRolesChange($event)"></tc-role-editor>`,
})
export class ControlledRoleEditor {
  readonly initial = input.required<TcRoleEditor["roles"]>();
  readonly roles = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onRolesChange(e: CustomEvent<{ roles: TcRoleEditor["roles"] }>) {
    e.preventDefault();
    this.roles.set(e.detail.roles);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/role-editor";
  import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";

  let { initial }: { initial: TcRoleEditor["roles"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let roles = $derived(initial);
  let el: TcRoleEditor;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      roles = (e as CustomEvent<{ roles: TcRoleEditor["roles"] }>).detail.roles;
    };
    el.addEventListener("tc-roles-change", on);
    return () => el.removeEventListener("tc-roles-change", on);
  });
</script>

<tc-role-editor bind:this={el} {roles}></tc-role-editor>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-role-editor")` returns a `TcRoleEditor` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";`
- **React / Next.js:** Props: `import type { RoleEditorProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof RoleEditor>`. The element class, for refs: `import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcRoleEditor["groups"]` with `import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";`
- **Angular:** The directive types the template: `[groups]` takes `TcRoleEditor["groups"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcRoleEditor } from "@adamstavely/trenchcoat/role-editor";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | The heading, and the grid's name |
| `roles` | `Role[]` | The roles – controlled when given |
| `defaultRoles` | `Role[]` | The roles on mount, when `roles` isn't controlled |
| `onRolesChange` | `(roles: Role[], change: RoleEditCause) => void` | Called with the next roles and what changed |
| `saved` | `Role[]` | What was last saved – controlled when given; otherwise the first roles, then whatever Save stores |
| `onRolesSave` | `(roles: Role[], changes: RoleDiff[]) => void \| boolean` | Save was pressed – store the roles; return false to keep the changes listed (a failed save) |

*Renamed or hidden on the wrapper: `heading`, `roles`, `saved`, `children`*

## Accessibility

Follows the WAI-ARIA [Grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/).

### Keyboard

The grid is one tab stop; inside it the arrows move between cells. Rename and Delete are buttons in the column headers.

| Key | What it does |
|---|---|
| ← / → / ↑ / ↓ | Moves to the next cell in that direction |
| Home / End | Moves to the first or last cell in the row |
| ⌘/Ctrl+Home / ⌘/Ctrl+End | Moves to the first or last cell of the grid |
| Space / Enter | Turns the permission on or off for that role |
| Enter (renaming) | Keeps the new name |
| Escape (renaming, deleting) | Keeps the old name; cancels the delete |
| Tab | Leaves the grid |

### Screen readers

The grid is a `grid` named by the heading, with roles as column headers and each permission as a row header that includes
its group ("Agents · Deploy agents"). A cell reads "Allowed" or "Not allowed", and ", changed" when it differs from what
was saved; a locked role's cells are read-only. Each cell is described by "Space turns it on or off". Every change is
confirmed in a polite status message, with what else changed: "Member: Deploy agents on. Deploy agents needs Edit agents
and View agents, so they were turned on too." Rename and Delete are named "Rename Auditors" and "Delete Auditors". The
summary is a section headed "Unsaved changes"; Discard and Save are `aria-disabled` while nothing has changed.

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
| :is() and :where() | 88 | 78 | 14 | 14 | itself, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself | Scrollbars keep the browser's default width. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |

## Performance

*Measured 2026-11-13 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 30.8 KB | 9.0 KB |
| Lit · the library every element is built on, the parts it uses | 20.6 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/util` · Shared Trenchcoat code | 0.1 KB | – |
| **Added to a page that already has Lit** | **39.3 KB** | **11.5 KB** |
| With Lit – the first component on a page | 61.1 KB | 18.7 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **3.3 ms** | the gallery demo's data, 368 DOM nodes – to layout, median of 7 |
| Typical update | **0.5 ms** | one item of roles replaced |
| First on the page | 14 ms | default properties; includes adding its CSS to the document |
| 100 items | 32 ms | roles: first render, 4,742 nodes; update 3.4 ms |
| 1,000 items | 181 ms | roles: first render, 46,442 nodes; update 19 ms |

1,000 items of roles: 181 ms. It renders every item, so a first render passes 50 ms (a long task) at about 280 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- No animation-frame loop.
- No timers.
- Stops or pauses under reduced motion.
- Observers: `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name permissions as actions: "Deploy agents", "Export data", "Manage billing".
- Use `description` for what a permission covers when the name alone is vague: "Instructions, tools and triggers".
- Set `requires` for every permission that makes no sense alone – editing without viewing, exporting without viewing.
- Keep role names short; they're column headings.

## Do and don't

### Do

- Keep `saved` in step with what your server stored, so the summary shows only real changes.
- Handle `tc-roles-save` and store the roles; call `preventDefault()` if the save fails, so the changes stay listed.
- Lock the role that must keep every permission, so nobody locks themselves out.

### Don't

- Don't put more than about eight roles side by side – the grid scrolls sideways and the far columns are easy to miss.
- Don't use it for one person's exceptions; give them a role, or a custom one.
- Don't delete roles without saying who has them – the confirmation does it for you.

## Related

- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Access Request](access-request.md) – Ask for access to one piece of data – the resource with its owner and classification in words, the level, how long, a required justification and the fields needed – then where it stands: pending with who decides, approved with the time left, denied with the reason, or expired
- [Team Roster](team-roster.md) – A team directory with everyone's local time – status, role and team, how far ahead or behind you they are, whether they're working, skills – grouped and filtered as a list or a grid, with the team's best hour to meet
- [Share Panel](share-panel.md) – Share with people and groups at a level for each – every recipient checked for entitlement first, with anyone not authorized flagged, the person sharing told, and left out of the share.
