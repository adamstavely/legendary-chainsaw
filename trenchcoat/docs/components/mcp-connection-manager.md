<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# MCP connection manager

**AI configuration** · New

MCP servers at a glance – status and what each exposes; add one (transport, auth, test), inspect its tools, resources and prompts, connect, retry and remove

- **Element:** `<tc-mcp-connection-manager>`
- **Size:** 20.4 KB gzip · 83.3 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 120+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/mcp-connection-manager";` |
| React / Next.js | `import { McpConnectionManager } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/mcp-connection-manager";` · tags starting with tc- are custom elements |
| Angular | `import { McpConnectionManager } from "@adamstavely/trenchcoat/angular/mcp-connection-manager";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/mcp-connection-manager";` |

## Example

The live example is in the gallery at `#/mcp-connection-manager`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The MCP servers an app's agents can reach, each on one row that says at a glance whether it's connected and what it
offers: a status, its transport and address, counts of its tools, resources and prompts, and the first few tool names.
Connect, Disconnect, Retry and Cancel sit on the row. Inspect opens the row to list everything the server exposes, in
tabs, and to remove it – which asks first. Add server walks a short form: a name, the transport (stdio, HTTP or SSE),
the URL or command, auth and a credential reference, with Test to try it before it's added.

The element connects to nothing. `tc-connect` and `tc-test` hand your app a server and an `AbortSignal`; your MCP client
does the work and reports back through `connections`.

### When to use

- Settings for an agent workspace where people bring their own MCP servers.
- An admin view of which servers are up, which failed and why, and what each one exposes.
- Onboarding a new server: try it, see what it offers, then keep it.

### When not to use

- Deciding which agents may call which tools – use [Tool Permissions](tool-permissions.md).
- Defining a single tool by hand, with its parameters – use [Tool Configuration](tool-configuration.md).
- Connecting a model provider's endpoint – use [Provider connection](provider-connection.md).
- Connecting a general SaaS integration with its own settings – use [Integration Settings](integration-settings.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Server** `.ui-mcs__server` – one server: status dot, name, transport and address, and its action
2. **At a glance** `.ui-mcs__glance` – counts of tools, resources and prompts, and the first tool names
3. **Inspect** `.ui-mcs__inspect` – opens the row to show everything it exposes
4. **Add server** `.ui-mcs__add` – opens the form to add one
5. **Connected count** `.ui-mcs__pill` – how many of the servers are connected

## Looks

Standard is a white card on the gray tray with Add server and the note on the tray below; the count is a filled pill
and the capability badges are filled. Clean is one white card with Add server in its last row; the count is plain
text, the badges are hairline outlines and the icons are thinner. The remove dialog is the same in both.

## Usage

### HTML

```html
<tc-mcp-connection-manager id="mcp"></tc-mcp-connection-manager>

<script type="module">
  import "@adamstavely/trenchcoat/mcp-connection-manager";
  import "@adamstavely/trenchcoat/tokens.css";

  const mcp = document.querySelector("#mcp");
  mcp.value = [{ id: "gh", name: "GitHub", transport: "http", target: "https://mcp.example.com/gh", auth: "token", credentialRef: "vault/gh" }];
  mcp.credentials = [{ id: "vault/gh", label: "GitHub token", hint: "9f1c" }];
  mcp.connections = {};
  mcp.addEventListener("tc-connect", async (e) => {
    const res = await fetch(`/api/mcp/${e.detail.server.id}/connect`, { method: "POST", signal: e.detail.signal });
    mcp.connections = { ...mcp.connections, [e.detail.server.id]: await res.json() };
  });
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { McpConnectionManager, type McpConnection, type McpServer } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Servers({ start, connect }: { start: McpServer[]; connect: (s: McpServer, signal: AbortSignal) => Promise<McpConnection> }) {
  const [servers, setServers] = useState(start);
  const [connections, setConnections] = useState<Record<string, McpConnection>>({});
  const run = (s: McpServer, signal: AbortSignal) => void connect(s, signal).then((c) => setConnections((all) => ({ ...all, [s.id]: c })), () => {});
  return <McpConnectionManager value={servers} onChange={setServers} connections={connections} onConnect={run} onTest={run} />;
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/mcp-connection-manager";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";

defineProps<{ value: TcMcpConnectionManager["value"]; connections: TcMcpConnectionManager["connections"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-mcp-connection-manager :value="value" :connections="connections" @tc-value-change="onValueChange"></tc-mcp-connection-manager>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { McpConnectionManager } from "@adamstavely/trenchcoat/angular/mcp-connection-manager";
import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";

@Component({
  selector: "app-mcp-connection-manager-example",
  imports: [McpConnectionManager],
  template: `<tc-mcp-connection-manager [value]="value()" [connections]="connections()" (tc-value-change)="onValueChange($event)"></tc-mcp-connection-manager>`,
})
export class McpConnectionManagerExample {
  readonly value = input.required<TcMcpConnectionManager["value"]>();
  readonly connections = input.required<TcMcpConnectionManager["connections"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/mcp-connection-manager";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";

  let { value, connections }: { value: TcMcpConnectionManager["value"]; connections: TcMcpConnectionManager["connections"] } = $props();
  let el: TcMcpConnectionManager;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-mcp-connection-manager bind:this={el} {value} {connections}></tc-mcp-connection-manager>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `value` | – | `McpServer[]` | `[]` | The servers. Changed by the user unless a tc-value-change listener calls preventDefault() |
| `connections` | – | `Record<string, McpConnection>` | `{}` | What the app knows about each server's connection, by server id; a server without one is not connected |
| `transports` | – | `McpTransportOption[]` | `[ { id: "stdio", label: "stdio", kind: "command", description: "A local process the app starts and talks to over stdin and stdout" }, { id: "http", label: "HTTP", kind: "url", description: "Streamable HTTP at a URL – most remote servers" }, { id: "sse", label: "SSE", kind: "url", description: "Server-sent events at a URL – older remote servers" }, ]` | The transports offered when adding a server |
| `authOptions` | – | `McpAuthOption[]` | `[ { id: "none", label: "None" }, { id: "token", label: "Bearer token", credential: true }, { id: "oauth", label: "OAuth", description: "The app signs in when it first connects" }, ]` | The auth options offered when adding a server |
| `credentials` | – | `McpCredential[]` | `[]` | The credential references offered when the auth needs one |
| `statusLabels` | – | `Partial<Record<McpStatus, string>>` | `{}` | The statuses' names, merged over MCP_STATUS_LABELS |
| `heading` | `heading` | `string` | `"MCP servers"` | Names the group, shown at the top |
| `description` | `description` | `string` | `""` | A quieter line under the heading |
| `note` | `note` | `string` | `"Which agents may use each tool is set in tool permissions."` | A quiet line beside Add server; empty hides it |
| `name` | `name` | `string` | `""` | Submitted with the form: the servers as JSON |
| `disabled` | `disabled` | `boolean` | `false` | Turns every control off and leaves the list out of the form; a disabled fieldset does the same |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | A server was added or removed, or a form reset put the list back ({ value, change }: McpValueChange); cancelable – prevent it to control `value` |
| `tc-connect` | – | Yes | Connect or Retry was pressed ({ server, signal, retry }: McpConnectEvent); connect, then update `connections`. Cancelable – prevented, nothing shows as connecting |
| `tc-disconnect` | – | No | Disconnect was pressed ({ server }: McpDisconnectEvent); disconnect, then update `connections` |
| `tc-test` | – | Yes | Test was pressed in the add form ({ server, signal }: McpTestEvent); try it and report on `connections[server.id]`. Cancelable |

#### Methods

| Method | Returns | Description |
| --- | --- | --- |
| `statusOf(id: string)` | `McpStatus` | The status shown for a server: connecting while the app hasn't answered, else what the app says |
| `connect(id: string)` | `void` | Asks the app to connect a server, as Connect does |
| `cancel(id: string)` | `void` | Stops a connect or test in progress: its signal aborts |

#### Design tokens it reads (101)

`--tc-action-danger-bg`, `--tc-action-danger-bg-hover`, `--tc-action-danger-fg`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-bg-hover`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-card-radius`, `--tc-card-shadow`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-md`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-shimmer`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-standard`, `--tc-field-bg`, `--tc-field-font-size`, `--tc-field-h`, `--tc-field-px`, `--tc-field-radius`, `--tc-field-shadow`, `--tc-field-shadow-focus`, `--tc-field-shadow-hover`, `--tc-field-shadow-invalid`, `--tc-fill-default`, `--tc-fill-hover`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring-offset`, `--tc-font-mono`, `--tc-font-sans`, `--tc-font-size-lg`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-font-weight-strong`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-snug`, `--tc-line-height-tight`, `--tc-pill-font-size`, `--tc-pill-font-weight`, `--tc-pill-h`, `--tc-pill-px`, `--tc-pill-radius`, `--tc-radius-lg`, `--tc-radius-md`, `--tc-radius-sm`, `--tc-scrim`, `--tc-shadow-overlay`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-2`, `--tc-space-3`, `--tc-space-4`, `--tc-space-5`, `--tc-space-7`, `--tc-status-danger-bg`, `--tc-status-danger-fg`, `--tc-status-danger-solid`, `--tc-status-info-bg`, `--tc-status-info-fg`, `--tc-status-info-solid`, `--tc-status-success-bg`, `--tc-status-success-fg`, `--tc-status-success-solid`, `--tc-status-warning-bg`, `--tc-status-warning-fg`, `--tc-surface-on-tray`, `--tc-surface-overlay`, `--tc-surface-raised`, `--tc-surface-tray`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-tracking-snug`, `--tc-tray-inset`, `--tc-tray-radius`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `MCP_STATUS_LABELS: Record<McpStatus, string>` | The statuses' names |

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
| `value` | `el.value = …;` | `<… value={…} />` | `<tc-mcp-connection-manager :value="…">` | `<tc-mcp-connection-manager [value]="…">` | `<tc-mcp-connection-manager {value}>` |
| `connections` | `el.connections = …;` | `<… connections={…} />` | `<tc-mcp-connection-manager :connections="…">` | `<tc-mcp-connection-manager [connections]="…">` | `<tc-mcp-connection-manager {connections}>` |
| `transports` | `el.transports = …;` | `<… transports={…} />` | `<tc-mcp-connection-manager :transports="…">` | `<tc-mcp-connection-manager [transports]="…">` | `<tc-mcp-connection-manager {transports}>` |
| `authOptions` | `el.authOptions = …;` | `<… authOptions={…} />` | `<tc-mcp-connection-manager :authOptions="…">` | `<tc-mcp-connection-manager [authOptions]="…">` | `<tc-mcp-connection-manager {authOptions}>` |
| `credentials` | `el.credentials = …;` | `<… credentials={…} />` | `<tc-mcp-connection-manager :credentials="…">` | `<tc-mcp-connection-manager [credentials]="…">` | `<tc-mcp-connection-manager {credentials}>` |
| `statusLabels` | `el.statusLabels = …;` | `<… statusLabels={…} />` | `<tc-mcp-connection-manager :statusLabels="…">` | `<tc-mcp-connection-manager [statusLabels]="…">` | `<tc-mcp-connection-manager {statusLabels}>` |

*Also attributes: `heading`, `description`, `note`, `name`, `disabled` – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-connect` | Yes | `el.addEventListener("tc-connect", (e) => …)` | `onConnect={…}` | `@tc-connect="…"` | `(tc-connect)="…($event)"` | `el.addEventListener("tc-connect", …)` |
| `tc-disconnect` | No | `el.addEventListener("tc-disconnect", (e) => …)` | `onDisconnect={…}` | `@tc-disconnect="…"` | `(tc-disconnect)="…($event)"` | `el.addEventListener("tc-disconnect", …)` |
| `tc-test` | Yes | `el.addEventListener("tc-test", (e) => …)` | `onTest={…}` | `@tc-test="…"` | `(tc-test)="…($event)"` | `el.addEventListener("tc-test", …)` |

### Controlled

The element changes `value` itself unless a listener calls `preventDefault()` on `tc-value-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-mcp-connection-manager id="mcp-connection-manager"></tc-mcp-connection-manager>

<script type="module">
  import "@adamstavely/trenchcoat/mcp-connection-manager";

  const el = document.querySelector("#mcp-connection-manager");
  el.addEventListener("tc-value-change", (e) => {
    e.preventDefault(); // the element keeps its value…
    if (allowed(e.detail.value)) el.value = e.detail.value; // …until the app sets it
  });
  const allowed = (next) => true; // your rule
</script>
```

#### React / Next.js

```tsx
import { useState, type ComponentProps } from "react";
import { McpConnectionManager } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof McpConnectionManager>;
type Props = Omit<Own, "value" | "onChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledMcpConnectionManager({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <McpConnectionManager {...props} value={value} onChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/mcp-connection-manager";
import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";

const props = defineProps<{ initial: TcMcpConnectionManager["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcMcpConnectionManager["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-mcp-connection-manager :value="value" @tc-value-change="onValueChange"></tc-mcp-connection-manager>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { McpConnectionManager } from "@adamstavely/trenchcoat/angular/mcp-connection-manager";
import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";

@Component({
  selector: "app-controlled-mcp-connection-manager",
  imports: [McpConnectionManager],
  template: `<tc-mcp-connection-manager [value]="value()" (tc-value-change)="onValueChange($event)"></tc-mcp-connection-manager>`,
})
export class ControlledMcpConnectionManager {
  readonly initial = input.required<TcMcpConnectionManager["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcMcpConnectionManager["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/mcp-connection-manager";
  import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";

  let { initial }: { initial: TcMcpConnectionManager["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcMcpConnectionManager;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcMcpConnectionManager["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-mcp-connection-manager bind:this={el} {value}></tc-mcp-connection-manager>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes. It takes part in its form: the value is submitted under its name, and reset with the form.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```vue
<tc-mcp-connection-manager :value="value" @tc-value-change="value = $event.detail.value"></tc-mcp-connection-manager>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```html
<tc-mcp-connection-manager [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-mcp-connection-manager>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event: It takes part in its form: the value is submitted under its name, and reset with the form.

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-mcp-connection-manager bind:this={el} {value}></tc-mcp-connection-manager>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-mcp-connection-manager")` returns a `TcMcpConnectionManager` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";`
- **React / Next.js:** Props: `import type { McpConnectionManagerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof McpConnectionManager>`. The element class, for refs: `import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcMcpConnectionManager["value"]` with `import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";`
- **Angular:** The directive types the template: `[value]` takes `TcMcpConnectionManager["value"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcMcpConnectionManager } from "@adamstavely/trenchcoat/mcp-connection-manager";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `title` | `string` | Shown at the top; names the group |
| `value` | `McpServer[]` | The servers (controlled) |
| `defaultValue` | `McpServer[]` | The servers to start with when uncontrolled |
| `onChange` | `(value: McpServer[], change: McpValueChange["change"]) => void` | Called with the whole list after a server is added or removed, and what changed |
| `onConnect` | `(server: McpServer, signal: AbortSignal, retry: boolean) => void` | Connect or Retry was pressed: connect, stop when `signal` aborts, then update `connections` |
| `onDisconnect` | `(server: McpServer) => void` | Disconnect was pressed, or a tested server was never added: disconnect it, then update `connections` |
| `onTest` | `(server: McpServer, signal: AbortSignal) => void` | Test was pressed in the add form: try the server and report on `connections[server.id]` |

*Renamed or hidden on the wrapper: `value`, `defaultValue`, `heading`, `onChange`*

## Accessibility

Follows the WAI-ARIA [Disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

### Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through each row's action and Inspect, then Add server |
| Enter / Space | On Connect, Retry, Disconnect or Cancel, does that; on Inspect, opens or closes the row |
| ← / → | In an open row's tabs, moves between Tools, Resources and Prompts |
| Home / End | In the tabs, the first or last tab |

In the add form:

| Key | What it does |
|---|---|
| ← / → | In Transport, picks stdio, HTTP or SSE |
| Enter | In the URL or command field, tests the server |
| Escape | Closes the form; focus returns to Add server |

In the remove dialog, focus starts on Cancel:

| Key | What it does |
|---|---|
| Tab / Shift+Tab | Moves between Cancel and Remove, wrapping inside the dialog |
| Escape | Closes without removing; focus returns to Remove |

After a server is removed, focus moves to the next server's Inspect, or to Add server.

### Screen readers

The host is a group named by the heading, and the servers are a list labelled by it. The count reads “1 of 3
connected, 1 failed”. Each row's buttons are named with the server – “Connect Database”, “Retry Docs”, “Cancel
connecting to Database”, “Inspect GitHub” (with `aria-expanded`). What a server exposes is read as one sentence, “5
tools, 1 resource and 0 prompts”, followed by “Tools: search_issues…”. Inside, the tabs are a tablist and the list a
tabpanel named “Tools”, “Resources” or “Prompts”. Remove opens a modal `alertdialog` named “Remove GitHub?” and
described by what goes with it. A polite status message says “Connecting to Database…”, “Database connected – 1 tool,
0 resources and 0 prompts.”, “Docs failed to connect. 401 – token rejected”, “Linear added.” and “GitHub removed.”

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
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | itself | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | tokens.css | Tints and washes mixed from the tokens. |
| Container size queries | 105 | 110 | 16 | 16 | itself | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | internal/controllers | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, segmented-control, internal/kit | Focus rings for keyboard users. |
| &lt;dialog> and showModal() | 37 (Edge 79) | 98 | 15.4 | 15.4 | itself | Modals trap focus, close on Escape and sit in the top layer. |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, segmented-control, internal/base, tokens.css | Every rule is keyed on :where() so the page can override it. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | segmented-control | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | segmented-control | Scrollbars keep the browser's default width. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | internal/card-head, internal/kit, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-10-29 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 44.2 KB | 11.8 KB |
| Lit · the library every element is built on, the parts it uses | 21.3 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 2.9 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 1.9 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| **Added to a page that already has Lit** | **83.3 KB** | **20.4 KB** |
| With Lit – the first component on a page | 105.5 KB | 27.8 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **1.1 ms** | the gallery demo's data, 94 DOM nodes – to layout, median of 7 |
| Typical update | **0.2 ms** | one item of value replaced |
| First on the page | 9.1 ms | default properties; includes adding its CSS to the document |
| 100 items | 6.9 ms | value: first render, 1,646 nodes; update 0.8 ms |
| 1,000 items | 64 ms | value: first render, 16,046 nodes; update 6.5 ms |

1,000 items of value: 64 ms. It renders every item, so a first render passes 50 ms (a long task) at about 780 items – page or filter longer lists.

*Render budget (smoke test, the gallery demo over 5 simulated seconds): none recorded – the default of 300 applies. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **nothing** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled` (segmented-control).
- Timers: `setTimeout` (segmented-control).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver` (segmented-control), `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController).
- Doesn't read the clock.

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Name servers as people know them (“GitHub”, “Analytics database”), not by host.
- Pass the failure in your client's words in `connections[id].message` – the row shows it in place of the counts.
- Offer the transports and auth methods your client supports through `transports` and `authOptions`; their
  descriptions say when to pick each.
- Credentials are references with a masked `hint`; the secret stays on your server.
- `note` beside Add server points to where tool access is set; clear it if your product says that elsewhere.

## Do and don't

### Do

- Honour the signal: it aborts when someone cancels, edits a draft under test, removes the server or leaves the page.
- Update `connections` for every answer, failures included – that's what ends Connecting….
- Disconnect in your `tc-value-change` handler when `change.type` is "remove", and when `tc-disconnect` arrives for a
  tested draft that was never added.

### Don't

- Don't start stdio commands from the browser – your app runs them on its own host, after its own checks.
- Don't treat a tool listed here as allowed; access is decided in `tool-permissions`.
- Don't remove a server without the confirmation – its tools disappear from every agent that used them.

## Related

- [Tool Permissions](tool-permissions.md) – Which agent may use which tools – allow, ask or deny per cell, presets for the common setups, and a summary of what you changed
- [Tool Configuration](tool-configuration.md) – A tool as its API reference entry: name as the title, signature and description, a doc table of parameters edited in place, an example call and the JSON Schema, with the approval it needs
- [Integration Settings](integration-settings.md) – Settings card for a connected service – on/off switch, API key, validated site address, time zone and a save bar
- [Provider connection](provider-connection.md) – A model provider connection read as a path – endpoint, credential, deployment – with each hop's health from an app-run test, the last check and the models it reports
