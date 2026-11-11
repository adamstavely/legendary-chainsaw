<!-- Generated from the Trenchcoat gallery by npm run export:docs-md – edit the gallery's sources, not this file. -->

[← Components](README.md)

# Chat Composer

**AI & chat** · Also in React

Prompt composer with model picker, voice input, app connections and approval request; an optional toolbar row switches the model, opens model settings and the prompt library, connects or disconnects the page context, and adds a disclaimer line – folding to fit a side pane

- **Element:** `<tc-chat-composer>`
- **Size:** 82.7 KB gzip · 356.9 KB min, on a page that has Lit · [Performance](#performance)
- **Works in:** Chrome / Edge 123+, Firefox 121+, Safari 17.5+ · [Browser support](#browser-support)

|  | Install and import |
| --- | --- |
| Install | `npm install @adamstavely/trenchcoat` [from GitHub Packages](../foundations/getting-started.md), then `import "@adamstavely/trenchcoat/tokens.css"` once |
| HTML | `import "@adamstavely/trenchcoat/chat-composer";` |
| React / Next.js | `import { ChatComposer } from "@adamstavely/trenchcoat/react";` · in a client component in Next.js |
| Vue / Nuxt | `import "@adamstavely/trenchcoat/chat-composer";` · tags starting with tc- are custom elements |
| Angular | `import { ChatComposer } from "@adamstavely/trenchcoat/angular/chat-composer";` · standalone directives, no schema |
| Svelte | `import "@adamstavely/trenchcoat/chat-composer";` |

## Example

The live example is in the gallery at `#/chat-composer`, at 320 px, 480 px or full width, with “Show anatomy” to number its parts.

## Overview

The message box of an AI chat. People type or dictate a message, pick which model answers, attach files and send –
and, around the box, connect their apps, pick a project and request wider access for the agent. Voice input shows
the words as they're heard, in gray behind what's confirmed, with a live audio trace and Discard / Use recording. A
send that returns a promise keeps the message until it goes through, and brings it back with an error if it doesn't.
On request it also hosts the / and @ picker and a tray of what's in context, and a toolbar row under the box:
switch the model, open its settings or the prompt library, connect or disconnect what's on the page – so people
always know whether the model can see it – and a one-line disclaimer. The row folds to icons, then into a “More”
menu, to fit a 320 px side pane. With `skills` set, people start a message with a skill: typing / at the start (or
pressing the / button) lists them, recent ones first, then by source; a pick puts “/translate” at the start of the
message with what to type next greyed after it, and the skill and its arguments ride on the send.

### When to use

- The prompt field at the bottom of an AI chat or assistant.
- When people should choose the model per message, or speak instead of typing.
- When the agent needs app connections, a project or an approval before it can do its best work.
- An assistant docked beside a page, where people choose whether it can see the page – turn on `pageContext` and the
  toolbar, and leave out what the pane doesn't offer with `hide-connect-apps`, `hide-project` and `hide-approval`.
- An agent with skills or slash commands – set `skills` (and `searchSkills` when the catalogue lives on a server), so
  people can find one by name or by what it does, without knowing the list by heart.

### When not to use

- Choosing a model with speed, quality and cost side by side – use [Model Picker](model-picker.md), alone or next to a plain field.
- A full spoken conversation with live captions, rather than dictating one message – use [Voice Mode](voice-mode.md).
- Asking for permission at the moment an agent acts – use [Permission Request](permission-request.md).
- Editing generation settings as a page of their own, not from the composer – use [Model Settings](model-settings.md).
- Commands that act on the app rather than on the message (open a file, switch a page) – use [Command Menu](command-menu.md).

## Anatomy

*Turn on “Show anatomy” on the example to see each part numbered on the live component.*

1. **Message** `.ui-chat-composer__message` – the text area; grows with the text. Beside it: attach, “Request approval”, the mic
2. **Skills** `.ui-chat-composer__skills` – with `skills` set, the / button that opens the skills list
3. **Send** `.ui-chat-composer__send` – sends; next to the mic, which records instead
4. **Connect apps** `.ui-chat-composer__connect` – on the tray (Clean: the last row); then “Select a project”
5. **Model** `.ui-chat-composer__picker` – with `model-switcher="toolbar"`, model-picker's menu in the toolbar row (otherwise a model button in the card)
6. **Settings and prompts** `.ui-chat-composer__tool` – open model-settings and prompt-library in popovers
7. **Page context** `.ui-chat-composer__page` – connects or disconnects what's on the page; the button beside it shows what's attached

## Looks

Standard is a white card on a gray tray that holds “Connect apps” / “Select a project” above it; it scales with its
width, and the message shows one line and grows to two. Clean is one white card with hairline shadows and fixed
sizes: the message on top, growing up to four lines, the tools in a row below it, and a quiet last row that connects
apps and then lets you pick a project; its icons are 16 px glyphs with thin lines and solid shapes. In the toolbar
row, Standard tints the connected page context chip in the accent; Clean raises it as a white chip with an accent
eye, and draws the tool icons in a quieter gray with thinner lines. The skills list is mention-picker's, in the same
look: Standard sets it on a gray tray, Clean is one white popover. The token is the same accent tint in both.

## Usage

### HTML

```html
<tc-chat-composer id="composer" placeholder="Ask anything…"></tc-chat-composer>

<script type="module">
  import "@adamstavely/trenchcoat/chat-composer";
  import "@adamstavely/trenchcoat/tokens.css";

  const composer = document.querySelector("#composer");
  composer.onSend = (message, { model }) => fetch("/api/chat", { method: "POST", body: JSON.stringify({ message, model }) });
  composer.onConnectApps = () => fetch("/api/connect", { method: "POST" });
  composer.onRequestApproval = () => fetch("/api/approve", { method: "POST" });
  // This product has no projects: "Connect apps" folds away once it's done
  composer.hideProject = true;
  composer.addEventListener("tc-attach", () => document.querySelector("#file").click());

  // The toolbar row: model, settings, prompts, page context – and the disclaimer under it
  composer.modelSwitcher = "toolbar";
  composer.settings = { temperature: 0.7 };
  composer.prompts = [{ id: "sum", title: "Summarise", body: "Summarise this page in {count} bullets." }];
  composer.pageContext = { title: "Q3 report", connected: true, count: 4 };
  composer.disclaimer = "AI can make mistakes. Check important info.";
  composer.addEventListener("tc-page-context-change", (e) => console.log("page context", e.detail.change));

  // Skills: / at the start of the message; the picked skill and its arguments ride on tc-send
  composer.skills = [
    { id: "translate", name: "translate", description: "Translate the answer", source: "Built-in", argumentHint: "<language>" },
    { id: "brief", name: "exec-brief", description: "A one-page brief in the team's format", source: "Your team" },
  ];
  composer.recentSkills = ["brief"];
  composer.addEventListener("tc-send", (e) => e.detail.skill && console.log("run", e.detail.skill.id, "with", e.detail.args));
</script>
```

### React / Next.js

```tsx
import { useState } from "react";
import { ChatComposer, defaultModels, type ChatPageContext, type ChatSkill } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

const skills: ChatSkill[] = [
  { id: "translate", name: "translate", description: "Translate the answer", source: "Built-in", argumentHint: "<language>" },
  { id: "brief", name: "exec-brief", description: "A one-page brief in the team's format", source: "Your team" },
];

export function Composer({ send, pickFiles }: { send: (text: string, model: string, withPage: boolean, skill?: string) => Promise<void>; pickFiles: () => void }) {
  const [draft, setDraft] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [model, setModel] = useState("claude");
  const [settings, setSettings] = useState<Record<string, number | string>>({ temperature: 0.7 });
  const [page, setPage] = useState<ChatPageContext>({ title: "Q3 report", connected: true, count: 4 });
  return (
    <ChatComposer
      placeholder="Ask anything…"
      value={draft}
      onValueChange={setDraft}
      models={defaultModels}
      model={model}
      onModelChange={(m) => setModel(m.id)}
      modelSwitcher="toolbar"
      settings={settings}
      onSettingsChange={setSettings}
      prompts={[{ id: "sum", title: "Summarise", body: "Summarise this page in {count} bullets." }]}
      onPromptPick={(pick) => console.log("prompt", pick.template.id)}
      pageContext={page}
      onPageContextChange={setPage}
      disclaimer="AI can make mistakes. Check important info."
      skills={skills}
      recentSkills={recent}
      onSkillChange={(skill, reason) => skill && reason === "pick" && setRecent((r) => [skill.id, ...r.filter((id) => id !== skill.id)])}
      onSend={(text, { model, skill, args }) => send(skill ? args : text, model, page.connected, skill?.id)}
      onAttach={pickFiles}
      onConnectApps={() => fetch("/api/connect", { method: "POST" })}
      onRequestApproval={() => fetch("/api/approve", { method: "POST" })}
      hideProject
    />
  );
}
```

### Vue / Nuxt

```vue
<script setup lang="ts">
import "@adamstavely/trenchcoat/chat-composer";
import "@adamstavely/trenchcoat/tokens.css";
import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";

defineProps<{ models: TcChatComposer["models"]; mentions: TcChatComposer["mentions"] }>();
const onValueChange = (e: CustomEvent) => console.log(e.detail);
</script>

<template>
  <tc-chat-composer :models="models" :mentions="mentions" @tc-value-change="onValueChange"></tc-chat-composer>
</template>
```

*Generated from the element's API and compiled in `examples/vue` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Angular

```ts
import { Component, input } from "@angular/core";
import { ChatComposer } from "@adamstavely/trenchcoat/angular/chat-composer";
import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";

@Component({
  selector: "app-chat-composer-example",
  imports: [ChatComposer],
  template: `<tc-chat-composer [models]="models()" [mentions]="mentions()" (tc-value-change)="onValueChange($event)"></tc-chat-composer>`,
})
export class ChatComposerExample {
  readonly models = input.required<TcChatComposer["models"]>();
  readonly mentions = input.required<TcChatComposer["mentions"]>();
  onValueChange(e: CustomEvent) {
    console.log(e.detail);
  }
}
```

*Generated from the element's API and compiled in `examples/angular` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chat-composer";
  import "@adamstavely/trenchcoat/tokens.css";
  import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";

  let { models, mentions }: { models: TcChatComposer["models"]; mentions: TcChatComposer["mentions"] } = $props();
  let el: TcChatComposer;
  // Event names with dashes are listened to on the element
  $effect(() => {
    const on = (e: Event) => console.log((e as CustomEvent).detail);
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-chat-composer bind:this={el} {models} {mentions}></tc-chat-composer>
```

*Generated from the element's API and compiled in `examples/svelte` by `npm run check:snippets`. The Frameworks section below covers events, control, slots, server rendering and types.*

## API

#### Properties and attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `hideConnectApps` | `hide-connect-apps` | `boolean` | `false` | Leave out "Connect apps"; "Select a project" (unless hidden too) is offered straight away |
| `hideProject` | `hide-project` | `boolean` | `false` | Leave out "Select a project"; once apps are connected the row folds away |
| `hideApproval` | `hide-approval` | `boolean` | `false` | Leave out "Request approval" |
| `placeholder` | `placeholder` | `string` | `"Start by typing..."` | Placeholder of the message field |
| `value` | `value` | `string` | `""` | The message |
| `models` | – | `ChatModel[]` | `[ { id: "auto", name: "Auto", description: "Picks the best model for each task" }, { id: "claude", name: "Claude", description: "Thoughtful writing and code" }, { id: "chatgpt", name: "ChatGPT", description: "Quick answers for everyday tasks" }, ]` | Models in the picker; the first one is selected by default. An empty list disables the picker |
| `model` | `model` | `string` | `""` | Id of the selected model – unset, or one that's no longer in the list, selects the first |
| `loadMs` | `load-ms` | `number` | `1300` | How long "Connect apps" and "Request approval" load at least, in ms |
| `dictation` | `dictation` | `string` | `"Draft a short update for the team about this week's progress"` | Sample transcript that appears word by word while recording when there's no onDictate |
| `demo` | `demo` | `boolean` | `false` | Demo mode: connecting apps, requesting approval and dictation are simulated silently where their handlers are missing |
| `onDictate` | – | `((session: ChatDictationSession) => void \| Promise<unknown>) \| undefined` | `undefined` | Live speech-to-text for the mic, called when recording starts. Push the transcript so far with `onTranscript` (and the input level, 0–1, with `onLevel` for the trace); stop listening when `signal` aborts – on Discard, Use recording or removal. A rejection ends the recording with an error. Without it a sample transcript plays |
| `onSend` | – | `((message: string, details: ChatSendDetails) => void \| Promise<unknown>) \| undefined` | `undefined` | Sends the message. Return a promise to keep the message (and a pending send button) until it settles: it is cleared when it resolves and kept, with an error, when it rejects. `details` has the model, and the skill and its arguments when the message starts with one |
| `onConnectApps` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Connects the user's apps; "Connect apps" keeps loading until a returned promise settles. Without it connecting is simulated |
| `onRequestApproval` | – | `(() => void \| Promise<unknown>) \| undefined` | `undefined` | Requests unrestricted access – resolves, rejects and is simulated like onConnectApps |
| `mentions` | – | `MentionPickerTrigger[] \| undefined` | `undefined` | Opt-in: the / and @ picker on the message (tc-mention-picker). Its tc-pick bubbles from the composer |
| `skills` | – | `ChatSkill[] \| undefined` | `undefined` | Opt-in: the skills (slash commands) a message can start with – / at the start of a line opens them |
| `recentSkills` | – | `string[] \| undefined` | `undefined` | Ids of the skills used last, most recent first – listed first before anything is typed. Unset, the composer remembers the picks made in it |
| `searchSkills` | – | `ChatSkillSearch \| undefined` | `undefined` | Finds skills on the app's side in place of the built-in filter over `skills` (see ChatSkillSearch) |
| `skill` | `skill` | `string` | `""` | Id of the message's skill ("" for none). Setting it puts that skill's token at the start of the message |
| `hideSkillsButton` | `hide-skills-button` | `boolean` | `false` | Leave out the "/" button that opens the skills list |
| `skillsPlaceholder` | `skills-placeholder` | `string` | `""` | The empty message's placeholder while skills are on – default: the placeholder plus "/ for skills" |
| `context` | – | `ContextTrayItem[] \| undefined` | `undefined` | Opt-in: what's in context, as chips above the composer (tc-context-tray). Changes come as tc-items-change; the composer keeps the new list unless a listener prevents it |
| `contextLimit` | `context-limit` | `number` | `0` | The context window the tray measures against, in tokens |
| `modelSwitcher` | `model-switcher` | `"card" \| "toolbar"` | `"card"` | Where the model switch is: in the card (the default), or in the toolbar row as tc-model-picker's menu |
| `settings` | – | `ModelSettingsValue \| undefined` | `undefined` | Opt-in: the model settings (by parameter id), edited in a popover from the toolbar. Changes come as tc-settings-change |
| `settingsModel` | – | `ModelSettingsModel \| undefined` | `undefined` | The model the settings are for – only the parameters it supports are shown; unset shows them all |
| `prompts` | – | `PromptTemplate[] \| undefined` | `undefined` | Opt-in: saved prompts, in a popover from the toolbar. A used prompt goes in at the caret (tc-prompt-pick) |
| `pageContext` | – | `ChatPageContext \| undefined` | `undefined` | Opt-in: what's on the page, as a chip in the toolbar that connects or disconnects it (tc-page-context-change) |
| `disclaimer` | `disclaimer` | `string` | `""` | One quiet line under the composer, e.g. "AI can make mistakes. Check important info." – it also describes the message field |
| `pickedSkill` | – | `ChatSkill \| null` | – | The message's skill, from its id – a skill the composer hasn't seen is named by its id |
| `look` | `look` | `Look \| undefined` | `undefined` | Visual style: "standard" or "clean"; unset follows &lt;tc-look-provider>, else "standard" |

#### Events

| Event | Detail | Cancelable | Description |
| --- | --- | --- | --- |
| `tc-value-change` | – | Yes | The message changed (`{ value: string }`) – typing, dictation, clearing after a send; cancelable – prevent it to keep `value` (controlled use) |
| `tc-model-change` | – | Yes | A model was picked in the menu (`{ model: string; choice: ChatModel }`); cancelable |
| `tc-send` | – | No | A message was sent (`ChatSend`: `{ message, model, skill, args }` – `skill` is the picked skill's `{ id, name }` or null, `args` the text after its token); `onSend` may return a promise to keep it until it settles |
| `tc-skill-change` | – | Yes | The message's skill changed (`ChatSkillChange`: `{ skill, previous, reason }`); cancelable when it was picked, replaced or removed – prevent it to keep the message as it is |
| `tc-attach` | – | No | The plus button was pressed – open your own file or folder picker here; detail: null |
| `tc-connect-apps` | – | No | "Connect apps" was pressed; `onConnectApps` may return a promise it waits for; detail: null |
| `tc-request-approval` | – | No | "Request approval" was pressed; `onRequestApproval` may return a promise it waits for; detail: null |
| `tc-select-project` | – | No | "Select a project" was pressed; detail: null |
| `tc-settings-change` | – | Yes | The model settings changed in the settings popover (`ChatSettingsChange`: `{ value, changed }`); cancelable – prevent it to control `settings` |
| `tc-prompt-pick` | – | Yes | A prompt was picked in the prompt library (`ChatPromptPick`: `{ prompt, template, values }`); cancelable – prevent it to place the prompt yourself |
| `tc-page-context-change` | – | Yes | The page context chip was toggled, or an attached item removed (`ChatPageContextChange`: `{ pageContext, change }`); cancelable – prevent it to control `pageContext` |

#### Component tokens

*Custom properties on the element – set them on the element or an ancestor to adjust it.*

| Custom property | Value | Look |
| --- | --- | --- |
| `--tc-chat-composer-shimmer` | `light-dark(rgba(255, 255, 255, 0.82), #ffffff)` | standard, clean |
| `--tc-chat-composer-alert` | `var(--tc-status-danger-fg)` | standard |
| `--tc-chat-composer-alert-bg` | `var(--tc-status-danger-bg)` | standard |
| `--tc-chat-composer-load` | `650ms` | standard, clean |
| `--tc-chat-composer-swap` | `620ms` | standard |
| `--tc-chat-composer-ease-swap` | `cubic-bezier(0.72, 0, 0.1, 1)` | standard |
| `--tc-chat-composer-span` | `1900` | not set – this fallback applies |
| `--tc-chat-composer-grow` | `0` | not set – this fallback applies |
| `--tc-chat-composer-lines` | `1` | not set – this fallback applies |

#### Design tokens it reads (97)

`--tc-accent`, `--tc-accent-subtle`, `--tc-accent-text`, `--tc-action-ghost-bg-hover`, `--tc-action-ghost-fg`, `--tc-action-primary-bg`, `--tc-action-primary-fg`, `--tc-action-primary-shadow`, `--tc-action-secondary-bg`, `--tc-action-secondary-fg`, `--tc-action-secondary-shadow`, `--tc-action-secondary-shadow-hover`, `--tc-border-default`, `--tc-border-strong`, `--tc-card-radius`, `--tc-chat-composer-card-h`, `--tc-chat-composer-frame`, `--tc-chat-composer-inset`, `--tc-control-font-size`, `--tc-control-font-weight`, `--tc-control-h-md`, `--tc-control-h-sm`, `--tc-control-px-sm`, `--tc-control-radius-md`, `--tc-control-radius-sm`, `--tc-divider`, `--tc-duration-base`, `--tc-duration-fast`, `--tc-duration-instant`, `--tc-duration-moderate`, `--tc-duration-quick`, `--tc-duration-slow`, `--tc-duration-slower`, `--tc-duration-slowest`, `--tc-ease-decelerate`, `--tc-ease-emphasized`, `--tc-ease-in`, `--tc-ease-in-out`, `--tc-ease-move`, `--tc-ease-spring`, `--tc-ease-standard`, `--tc-fill-default`, `--tc-fill-subtle`, `--tc-focus-outline`, `--tc-focus-ring`, `--tc-focus-ring-offset`, `--tc-focus-ring-width`, `--tc-font-sans`, `--tc-font-size-md`, `--tc-font-size-sm`, `--tc-font-size-xs`, `--tc-font-weight-medium`, `--tc-font-weight-regular`, `--tc-hairline`, `--tc-icon-muted`, `--tc-line-height-normal`, `--tc-line-height-tight`, `--tc-menu-bg`, `--tc-menu-item-font-size`, `--tc-menu-item-h`, `--tc-menu-item-hover`, `--tc-menu-item-px`, `--tc-menu-item-radius`, `--tc-menu-item-selected-fg`, `--tc-menu-padding`, `--tc-menu-radius`, `--tc-menu-shadow`, `--tc-radius-full`, `--tc-radius-lg`, `--tc-radius-sm`, `--tc-radius-xs`, `--tc-shadow-control`, `--tc-shadow-raised`, `--tc-space-0-5`, `--tc-space-1`, `--tc-space-1-5`, `--tc-space-12`, `--tc-space-2`, `--tc-space-2-5`, `--tc-space-3-5`, `--tc-space-4`, `--tc-space-8`, `--tc-status-danger-bg`, `--tc-status-danger-border`, `--tc-status-danger-fg`, `--tc-status-info-border`, `--tc-surface-control`, `--tc-surface-raised`, `--tc-surface-sunken`, `--tc-text-disabled`, `--tc-text-muted`, `--tc-text-placeholder`, `--tc-text-primary`, `--tc-text-secondary`, `--tc-text-strong`, `--tc-tray-radius`, `--tc-z-dropdown`

#### Functions

*Exported from the module next to the element.*

| Function | Description |
| --- | --- |
| `defaultChatModels: ChatModel[]` | The models the composer offers when none are given |

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
| `models` | `el.models = …;` | `<… models={…} />` | `<tc-chat-composer :models="…">` | `<tc-chat-composer [models]="…">` | `<tc-chat-composer {models}>` |
| `onDictate` | `el.onDictate = …;` | `<… onDictate={…} />` | `<tc-chat-composer :onDictate="…">` | `<tc-chat-composer [onDictate]="…">` | `<tc-chat-composer {onDictate}>` |
| `onSend` | `el.onSend = …;` | `<… onSend={…} />` | `<tc-chat-composer :onSend="…">` | `<tc-chat-composer [onSend]="…">` | `<tc-chat-composer {onSend}>` |
| `onConnectApps` | `el.onConnectApps = …;` | `<… onConnectApps={…} />` | `<tc-chat-composer :onConnectApps="…">` | `<tc-chat-composer [onConnectApps]="…">` | `<tc-chat-composer {onConnectApps}>` |
| `onRequestApproval` | `el.onRequestApproval = …;` | `<… onRequestApproval={…} />` | `<tc-chat-composer :onRequestApproval="…">` | `<tc-chat-composer [onRequestApproval]="…">` | `<tc-chat-composer {onRequestApproval}>` |
| `mentions` | `el.mentions = …;` | `<… mentions={…} />` | `<tc-chat-composer :mentions="…">` | `<tc-chat-composer [mentions]="…">` | `<tc-chat-composer {mentions}>` |
| `skills` | `el.skills = …;` | `<… skills={…} />` | `<tc-chat-composer :skills="…">` | `<tc-chat-composer [skills]="…">` | `<tc-chat-composer {skills}>` |
| `recentSkills` | `el.recentSkills = …;` | `<… recentSkills={…} />` | `<tc-chat-composer :recentSkills="…">` | `<tc-chat-composer [recentSkills]="…">` | `<tc-chat-composer {recentSkills}>` |
| `searchSkills` | `el.searchSkills = …;` | `<… searchSkills={…} />` | `<tc-chat-composer :searchSkills="…">` | `<tc-chat-composer [searchSkills]="…">` | `<tc-chat-composer {searchSkills}>` |
| `context` | `el.context = …;` | `<… context={…} />` | `<tc-chat-composer :context="…">` | `<tc-chat-composer [context]="…">` | `<tc-chat-composer {context}>` |
| `settings` | `el.settings = …;` | `<… settings={…} />` | `<tc-chat-composer :settings="…">` | `<tc-chat-composer [settings]="…">` | `<tc-chat-composer {settings}>` |
| `settingsModel` | `el.settingsModel = …;` | `<… settingsModel={…} />` | `<tc-chat-composer :settingsModel="…">` | `<tc-chat-composer [settingsModel]="…">` | `<tc-chat-composer {settingsModel}>` |
| `prompts` | `el.prompts = …;` | `<… prompts={…} />` | `<tc-chat-composer :prompts="…">` | `<tc-chat-composer [prompts]="…">` | `<tc-chat-composer {prompts}>` |
| `pageContext` | `el.pageContext = …;` | `<… pageContext={…} />` | `<tc-chat-composer :pageContext="…">` | `<tc-chat-composer [pageContext]="…">` | `<tc-chat-composer {pageContext}>` |

*Also attributes: `hide-connect-apps`, `hide-project`, `hide-approval`, `placeholder`, `value`, `model`, `load-ms`, `dictation` and 7 more – see the API table.*

### Events

| Event | Cancelable | HTML | React / Next.js | Vue / Nuxt | Angular | Svelte |
| --- | --- | --- | --- | --- | --- | --- |
| `tc-value-change` | Yes | `el.addEventListener("tc-value-change", (e) => …)` | `onValueChange={…}` | `@tc-value-change="…"` | `(tc-value-change)="…($event)"` | `el.addEventListener("tc-value-change", …)` |
| `tc-model-change` | Yes | `el.addEventListener("tc-model-change", (e) => …)` | `onModelChange={…}` | `@tc-model-change="…"` | `(tc-model-change)="…($event)"` | `el.addEventListener("tc-model-change", …)` |
| `tc-send` | No | `el.addEventListener("tc-send", (e) => …)` | `ref.current.addEventListener("tc-send", …)` | `@tc-send="…"` | `(tc-send)="…($event)"` | `el.addEventListener("tc-send", …)` |
| `tc-skill-change` | Yes | `el.addEventListener("tc-skill-change", (e) => …)` | `ref.current.addEventListener("tc-skill-change", …)` | `@tc-skill-change="…"` | `(tc-skill-change)="…($event)"` | `el.addEventListener("tc-skill-change", …)` |
| `tc-attach` | No | `el.addEventListener("tc-attach", (e) => …)` | `onAttach={…}` | `@tc-attach="…"` | `(tc-attach)="…($event)"` | `el.addEventListener("tc-attach", …)` |
| `tc-connect-apps` | No | `el.addEventListener("tc-connect-apps", (e) => …)` | `ref.current.addEventListener("tc-connect-apps", …)` | `@tc-connect-apps="…"` | `(tc-connect-apps)="…($event)"` | `el.addEventListener("tc-connect-apps", …)` |
| `tc-request-approval` | No | `el.addEventListener("tc-request-approval", (e) => …)` | `ref.current.addEventListener("tc-request-approval", …)` | `@tc-request-approval="…"` | `(tc-request-approval)="…($event)"` | `el.addEventListener("tc-request-approval", …)` |
| `tc-select-project` | No | `el.addEventListener("tc-select-project", (e) => …)` | `onSelectProject={…}` | `@tc-select-project="…"` | `(tc-select-project)="…($event)"` | `el.addEventListener("tc-select-project", …)` |
| `tc-settings-change` | Yes | `el.addEventListener("tc-settings-change", (e) => …)` | `ref.current.addEventListener("tc-settings-change", …)` | `@tc-settings-change="…"` | `(tc-settings-change)="…($event)"` | `el.addEventListener("tc-settings-change", …)` |
| `tc-prompt-pick` | Yes | `el.addEventListener("tc-prompt-pick", (e) => …)` | `onPromptPick={…}` | `@tc-prompt-pick="…"` | `(tc-prompt-pick)="…($event)"` | `el.addEventListener("tc-prompt-pick", …)` |
| `tc-page-context-change` | Yes | `el.addEventListener("tc-page-context-change", (e) => …)` | `ref.current.addEventListener("tc-page-context-change", …)` | `@tc-page-context-change="…"` | `(tc-page-context-change)="…($event)"` | `el.addEventListener("tc-page-context-change", …)` |

*React: events without a prop are listened to on the element through a ref.*

### Controlled

The element changes `value`, `model`, `skill`, `settings` and `pageContext` itself unless a listener calls `preventDefault()` on `tc-value-change`, `tc-model-change`, `tc-skill-change`, `tc-settings-change` or `tc-page-context-change` – then the app decides and sets it. In React, the wrapper does that for you when you pass the value.

#### HTML

```html
<tc-chat-composer id="chat-composer"></tc-chat-composer>

<script type="module">
  import "@adamstavely/trenchcoat/chat-composer";

  const el = document.querySelector("#chat-composer");
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
import { ChatComposer } from "@adamstavely/trenchcoat/react";

type Own = ComponentProps<typeof ChatComposer>;
type Props = Omit<Own, "value" | "onValueChange"> & { initial: NonNullable<Own["value"]> };

// Controlled: passing value makes the wrapper prevent the element's own change; the app sets it
export function ControlledChatComposer({ initial, ...props }: Props) {
  const [value, setValue] = useState<Own["value"]>(initial);
  return <ChatComposer {...props} value={value} onValueChange={(next) => setValue(next)} />;
}
```

#### Vue / Nuxt

```vue
<script setup lang="ts">
import { shallowRef } from "vue";
import "@adamstavely/trenchcoat/chat-composer";
import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";

const props = defineProps<{ initial: TcChatComposer["value"] }>();
const value = shallowRef(props.initial);
// Controlled: the element proposes, the app decides
const onValueChange = (e: CustomEvent<{ value: TcChatComposer["value"] }>) => {
  e.preventDefault();
  value.value = e.detail.value;
};
</script>

<template>
  <tc-chat-composer :value="value" @tc-value-change="onValueChange"></tc-chat-composer>
</template>
```

#### Angular

```ts
import { Component, input, linkedSignal } from "@angular/core";
import { ChatComposer } from "@adamstavely/trenchcoat/angular/chat-composer";
import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";

@Component({
  selector: "app-controlled-chat-composer",
  imports: [ChatComposer],
  template: `<tc-chat-composer [value]="value()" (tc-value-change)="onValueChange($event)"></tc-chat-composer>`,
})
export class ControlledChatComposer {
  readonly initial = input.required<TcChatComposer["value"]>();
  readonly value = linkedSignal(() => this.initial());
  // Controlled: the element proposes, the app decides
  onValueChange(e: CustomEvent<{ value: TcChatComposer["value"] }>) {
    e.preventDefault();
    this.value.set(e.detail.value);
  }
}
```

#### Svelte

```svelte
<script lang="ts">
  import "@adamstavely/trenchcoat/chat-composer";
  import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";

  let { initial }: { initial: TcChatComposer["value"] } = $props();
  // A derived the handler can overwrite: it follows initial, and holds the app's value between changes
  let value = $derived(initial);
  let el: TcChatComposer;
  // Controlled: the element proposes, the app decides
  $effect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      value = (e as CustomEvent<{ value: TcChatComposer["value"] }>).detail.value;
    };
    el.addEventListener("tc-value-change", on);
    return () => el.removeEventListener("tc-value-change", on);
  });
</script>

<tc-chat-composer bind:this={el} {value}></tc-chat-composer>
```

### Two-way binding

#### HTML

Listen for the change and keep your copy; set the property when your copy changes.

```html
el.addEventListener("tc-value-change", (e) => (state.value = e.detail.value));
el.value = state.value;
```

#### React / Next.js

Pass the value and its callback. Leave the value out to let the element keep it, starting at the `default…` prop.

```tsx
const [value, setValue] = useState(…);
<… value={value} onValueChange={setValue} />
```

#### Vue / Nuxt

`v-model` doesn't apply: on an element it listens for `input` and reads `value`, while Trenchcoat reports changes with `tc-value-change`. Bind the value and take it back from the event:

```vue
<tc-chat-composer :value="value" @tc-value-change="value = $event.detail.value"></tc-chat-composer>
```

#### Angular

With Angular forms, an element that holds a `value` takes `[(ngModel)]`, `[formControl]` or `formControlName` through its accessor in `@adamstavely/trenchcoat/angular/forms`. Without forms, bind the value and take it back from the event:

```html
<tc-chat-composer [value]="value()" (tc-value-change)="value.set($any($event).detail.value)"></tc-chat-composer>
```

#### Svelte

`bind:value` doesn't apply to a custom element's events. Pass the value and take it back from the event:

```svelte
$effect(() => {
  const on = (e) => (value = e.detail.value);
  el.addEventListener("tc-value-change", on);
  return () => el.removeEventListener("tc-value-change", on);
});
<tc-chat-composer bind:this={el} {value}></tc-chat-composer>
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

- **HTML:** With TypeScript or `// @ts-check`, `document.querySelector("tc-chat-composer")` returns a `TcChatComposer` (the module adds the tag to `HTMLElementTagNameMap`). The class: `import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";`
- **React / Next.js:** Props: `import type { ChatComposerProps } from "@adamstavely/trenchcoat/react";` – or `ComponentProps<typeof ChatComposer>`. The element class, for refs: `import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";`
- **Vue / Nuxt:** Add `import type {} from "@adamstavely/trenchcoat/vue";` to a `.d.ts` file: `vue-tsc` then checks the tag's props and `@tc-…` events in templates. A property's type: `TcChatComposer["models"]` with `import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";`
- **Angular:** The directive types the template: `[models]` takes `TcChatComposer["models"]`, and `$event` is the event's `CustomEvent<…>`, so a misspelt input or a wrong type fails the build. For the element itself, `#ref` with `exportAs` gives the directive and its `element`. `import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";`
- **Svelte:** Add `import type {} from "@adamstavely/trenchcoat/svelte";` to a `.d.ts` file: `svelte-check` then knows the tag's props. Type `bind:this` with `import type { TcChatComposer } from "@adamstavely/trenchcoat/chat-composer";`

### React props

*The wrapper takes every element property above under the same name, plus these. Values with a `default…` twin are controlled when given and kept by the element otherwise.*

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | The message (controlled). Leave undefined to let the composer keep it, starting at `defaultValue` |
| `defaultValue` | `string` | The message to start with when uncontrolled |
| `onValueChange` | `(value: string) => void` | Every change to the message – typing, dictation, clearing after a send |
| `models` | `ChatModel[]` | Models in the picker; the first one is selected by default. An empty list disables the picker |
| `model` | `string` | Id of the selected model (controlled). Leave undefined to let the composer keep it |
| `defaultModel` | `string` | Id of the model selected at first when uncontrolled – defaults to the first model |
| `onModelChange` | `(model: ChatModel) => void` | Reports the model picked in the menu – with `model` set, also the only way the selection changes |
| `onAttach` | `() => void` | The plus button only reports the click – open your own file or folder picker here |
| `onSelectProject` | `() => void` | "Select a project" was pressed – open your own project picker here |
| `context` | `ContextTrayItem[]` | Opt-in: what's in context, as chips above the composer (controlled). Leave undefined to let it keep the list, starting at `defaultContext` – or leave both unset for no tray |
| `defaultContext` | `ContextTrayItem[]` | The context chips to start with when uncontrolled |
| `onContextChange` | `(items: ContextTrayItem[], change: ContextTrayChange) => void` | Every change to the context chips: removed, restored, pinned |
| `onMentionPick` | `(pick: MentionPickerPick, event: Event) => void` | A row picked in the / and @ picker (set `mentions` to turn it on); call event.preventDefault() to keep the text |
| `settings` | `ModelSettingsValue` | Opt-in: the model settings, edited in a popover from the toolbar (controlled). Leave undefined to let the composer keep them, starting at `defaultSettings` – or leave both unset for no settings button |
| `defaultSettings` | `ModelSettingsValue` | The model settings to start with when uncontrolled |
| `onSettingsChange` | `(settings: ModelSettingsValue, changed: string[]) => void` | Every change in the settings popover: the next settings and the parameter ids that changed |
| `onPromptPick` | `(pick: ChatPromptPick, event: Event) => void` | A prompt used in the prompt library (set `prompts` to turn it on); call event.preventDefault() to place it yourself |
| `pageContext` | `ChatPageContext` | Opt-in: what's on the page, as a chip that connects or disconnects it (controlled). Leave undefined to let the composer keep it, starting at `defaultPageContext` – or leave both unset for no chip |
| `defaultPageContext` | `ChatPageContext` | The page context to start with when uncontrolled |
| `onPageContextChange` | `(pageContext: ChatPageContext, change: ChatPageContextChange["change"]) => void` | The chip was toggled or an attached item removed: the next page context and what changed |
| `onSend` | `(message: string, details: ChatSendDetails) => void \| Promise<unknown>` | Sends the message – `details` has the model, and the skill and its arguments when the message starts with one. Return a promise to keep the message until it settles |
| `skills` | `ChatSkill[]` | Opt-in: the skills (slash commands) a message can start with – / at the start of a line opens them |
| `searchSkills` | `ChatSkillSearch` | Finds skills on the app's side in place of the built-in filter over `skills` |
| `skill` | `string` | Id of the message's skill (controlled; "" for none). Leave undefined to let the composer keep it |
| `defaultSkill` | `string` | Id of the skill to start with when uncontrolled |
| `onSkillChange` | `(skill: ChatSkill \| null, reason: ChatSkillChangeReason) => void` | The message's skill changed: the skill now (null: none) and why – picked, replaced, removed, edited away or sent |

*Renamed or hidden on the wrapper: `value`, `models`, `model`, `context`, `settings`, `pageContext`, `skills`, `searchSkills`, `skill`, `onSend`*

## Accessibility

### Keyboard

| Key | What it does |
|---|---|
| Enter | In the message: sends it |
| Shift Enter | In the message: a new line |
| ↓ / ↑ | On the model button: opens the list of models. In the list: the next or previous model |
| Home / End | In the list: the first or last model |
| Enter / Space | On the model button: opens or closes the list, focus in the list. In the list: picks the active model and closes it, focus back on the model button |
| Escape | Closes the list of models; while recording, discards the recording. In a toolbar popover: closes it, focus back on the button that opened it |
| Tab | In the list: closes it and moves on from the model button. The toolbar row is one Tab stop |
| ← / → | In the toolbar row: the previous or next tool, wrapping at the ends |
| Home / End | In the toolbar row: the first or last tool |
| Enter / Space | On a toolbar button: opens its popover (focus moves into it), or toggles the page context |
| ↓ / ↑ | In the “More” menu: the next or previous entry. Home / End: the first or last |
| / | With `skills` set, at the start of a line: opens the skills list. Before a skill's token: a / takes its place and the list offers to replace it; Escape puts the token back |
| ↓ / ↑, Enter / Tab, Escape | In the skills list: move, pick, close – the message keeps focus (`mention-picker`) |
| Backspace | Right after a skill's token (or the space after it): removes the token whole |
| Delete | Before a skill's token: removes it whole |

A key typed inside the token lands after it. With `mentions` set, typing @ (or another trigger) opens the same
picker, which has its own keys (`mention-picker`). The toolbar's model switch, settings and prompt library keep
their own keys inside their popovers (`model-picker`, `model-settings`, `prompt-library`).

### Screen readers

The composer is a section named “Message composer”; the text area is named “Message”. Icon buttons are named for
what they do: “Add attachment”, “Voice input”, “Send message”, “Discard recording” and “Use recording” – which is
described by what was heard so far (“Heard so far: …”). The model button has `aria-haspopup="listbox"` and
`aria-expanded`; the list is a `listbox` named “Select a model” with `aria-activedescendant` and the chosen option
`aria-selected`. A polite live region follows along: “Recording. Press Escape to discard.”, “Recording added to your
message.”, “Sending…”, “Message sent.”, “Claude selected.”, “Connecting apps…”, “Apps connected. Select a
project.”, “Unrestricted access granted.” Failures are alerts: “Your message wasn't sent. Try again.”, “Your apps
couldn't be connected. Try again.”, “Approval wasn't granted. Try again.”

The toolbar row is a `toolbar` named “Message options”. The model switch is model-picker's trigger, named “Model:
Claude”; “Model settings” and “Prompts” have `aria-haspopup="dialog"` and `aria-expanded`, and their popovers are
dialogs named “Model settings” and “Prompts”. The page context chip says its state in its name – “Page context on:
Q3 report, 4 items” or “Page context: Q3 report, off” – and is described by what pressing it does (“The model can see
this page. Press to disconnect it.”); turning it on or off is announced: “Page context on: Q3 report.”, “Page
context off.” The button beside it is “Show what's attached from the page (4)” and opens a dialog named “Attached from
Q3 report”. When the row is folded, the icon buttons keep these names; “More” has `aria-haspopup="menu"` and opens a
`menu` of `menuitem`s. A used prompt is announced (“Summarise added to your message.”). The disclaimer describes the
message field (`aria-describedby`), so it's read with it.

With skills, the text area stays focused and is the combobox: mention-picker gives it `aria-autocomplete="list"`,
`aria-controls` and `aria-activedescendant` on a listbox named “Skills”, and says the count politely (“9 skills”,
“No skills match”, and “… Picking one replaces /translate” when there's one already). The token is text in the
message, so it's read as typed (“/translate French”); while a message starts with a skill, the text area is also
described by “Skill /translate: Translate the answer into another language. Type language.” – the last sentence
until something is typed after it. Picks are said in the live region: “/translate added. Then type language.”,
“/review-pr replaces /translate.”, “/translate removed.” The / button is named “Use a skill”; the mirror that draws
the token's tint is hidden from screen readers.

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
| light-dark() | 123 | 120 | 17.5 | 17.5 | itself, prompt-library, tokens.css | Every colour token is a light / dark pair; without it no colour token resolves. |
| Form association (ElementInternals) | 77 (Edge 79) | 98 | 16.4 | 16.4 | model-settings | The element's value is submitted with its form, and it takes part in form validation and reset. |
| color-mix() | 111 | 113 | 16.2 | 16.2 | prompt-library, tokens.css | Tints and washes mixed from the tokens. |
| Container query units (cqi, cqw…) | 105 | 110 | 16 | 16 | itself | Sizes relative to the component's own width. |
| Container size queries | 105 | 110 | 16 | 16 | itself, context-tray, model-picker, model-settings, prompt-library | Components adapt to the width they're given, not the window's. |
| inert | 102 | 112 | 15.5 | 15.5 | itself, context-tray, internal/controllers, model-picker, prompt-library, internal/popover | Closed and leaving parts are out of the tab order and hidden from screen readers. |
| :focus-visible | 86 | 85 | 15.4 | 15.4 | itself, context-tray, internal/kit, model-picker, model-settings, segmented-control, prompt-library | Focus rings for keyboard users. |
| :has() | 105 | 121 | 15.4 | 15.4 | itself, mention-picker | Layout and state that depend on what's inside a part (an icon present, a focused field). |
| inset | 87 | 66 | 14.1 | 14.1 | itself, mention-picker, prompt-library, internal/popover | – |
| translate, scale and rotate properties | 104 | 72 | 14.1 | 14.1 | model-picker, segmented-control | – |
| :is() and :where() | 88 | 78 | 14 | 14 | itself, context-tray, internal/base, mention-picker, model-picker, model-settings, segmented-control, prompt-library, tokens.css | Every rule is keyed on :where() so the page can override it. |
| Async Clipboard (writeText) | 66 (Edge 79) | 63 | 13.1 | 13.4 | prompt-library | Copy buttons. |
| ResizeObserver | 64 (Edge 79) | 69 | 13.1 | 13.4 | itself, mention-picker, segmented-control, prompt-library, internal/popover | – |
| CSS masks (with the -webkit- prefix) | Any (Edge 79) | 53 | 4 | 3.2 | itself, segmented-control | – |

### Progressive

*Used where the browser has them; without them it still works, with the difference described.*

| Feature | Chrome / Edge | Firefox | Safari | iOS | Used in | Without it |
| --- | --- | --- | --- | --- | --- | --- |
| scrollbar-width | 121 | 64 | 18.2 | 18.2 | itself, mention-picker, segmented-control | Scrollbars keep the browser's default width. |
| Popover API | 114 | 125 | 17 | 18.3 | mention-picker, internal/popover | Lists open fixed to the window instead of in the top layer, so a clipping ancestor or a modal can cover them. |
| @property | 85 | 128 | 16.4 | 16.4 | segmented-control | The registered custom properties don't interpolate, so the transitions and spins they drive jump to their end state. |
| adoptedStyleSheets | 73 (Edge 79) | 101 | 16.4 | 16.4 | internal/styles | Each element type's CSS goes into one &lt;style> element in &lt;head> instead – it looks and works the same. |
| forced-colors media query | 89 (Edge 79) | 89 | 16 | 16 | itself, internal/card-head, internal/kit, internal/popover, tokens.css | In a forced-colours mode the browser's own adjustments apply, without the components' fixes. |
| overscroll-behavior: contain | 63 (Edge 18) | 59 | 16 | 16 | itself, mention-picker, segmented-control | Scrolling past the end of a list carries on scrolling the page. |

## Performance

*Measured 2026-11-11 in headless Chromium 156.0.8078.4 on Apple M4 Pro by `npm run measure:perf`. [What the numbers mean](../foundations/performance.md)*

### Bundle

| Part | Minified | Gzip |
| --- | --- | --- |
| **This component alone** | 134.1 KB | 30.9 KB |
| Lit · the library every element is built on, the parts it uses | 22.2 KB | – |
| `internal/popover` · Shared Trenchcoat code | 8.6 KB | – |
| `internal/controllers` · Shared Trenchcoat code | 3.8 KB | – |
| `internal/card-head` · Shared Trenchcoat code | 3.0 KB | – |
| `internal/base` · Shared Trenchcoat code | 1.8 KB | – |
| `internal/kit` · Shared Trenchcoat code | 1.3 KB | – |
| `internal/util` · Shared Trenchcoat code | 1.1 KB | – |
| `internal/look` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/styles` · Shared Trenchcoat code | 0.4 KB | – |
| `internal/safe-url` · Shared Trenchcoat code | 0.3 KB | – |
| `internal/safe-media` · Shared Trenchcoat code | 0.1 KB | – |
| `internal/format` · Shared Trenchcoat code | 0.1 KB | – |
| [prompt-library](prompt-library.md) · Element it renders | 47.7 KB | – |
| [model-picker](model-picker.md) · Element it renders | 36.3 KB | – |
| [model-settings](model-settings.md) · Element it renders | 30.7 KB | – |
| [mention-picker](mention-picker.md) · Element it renders | 29.9 KB | – |
| [segmented-control](segmented-control.md) · Element it renders | 29.8 KB | – |
| [context-tray](context-tray.md) · Element it renders | 25.2 KB | – |
| `src/internal/reduced-motion.ts` · Dependency | 0.1 KB | – |
| `src/internal/ease.ts` · Dependency | 0.0 KB | – |
| **Added to a page that already has Lit** | **356.9 KB** | **82.7 KB** |
| With Lit – the first component on a page | 378.3 KB | 89.4 KB |

*Shared code counts once per page: a second component that uses the same `internal/*` modules or renders the same elements adds only its own code. Shared rows show their share of the minified bundle; gzip only exists for whole files.*

### Rendering

| Measure | Time | Details |
| --- | --- | --- |
| First render | **6.2 ms** | the gallery demo's data, 304 DOM nodes – to layout, median of 7 |
| Typical update | **0.6 ms** | one item of skills replaced |
| First on the page | 17 ms | default properties; includes adding its CSS to the document |
| 100 items | 5.3 ms | skills: first render, 304 nodes; update 0.3 ms |
| 1,000 items | 5.2 ms | skills: first render, 304 nodes; update 0.3 ms |

What it renders doesn't grow with skills (tested to 1,000 items).

*Render budget (smoke test, the gallery demo over 5 simulated seconds): 2 React commits (clean), 2 React commits (standard), with 30 % headroom. It counts re-renders, so it catches a component that renders on every frame.*

### Runtime

- At rest with the demo's data: **21 frames/s** on screen, **nothing** scrolled away, **nothing** under reduced motion (measured).
- Animation frames: `requestAnimationFrame, cancelled`, `requestAnimationFrame, cancelled` (internal/controllers – RollingController), `requestAnimationFrame, cancelled` (mention-picker), `requestAnimationFrame` (model-picker), `requestAnimationFrame, cancelled` (segmented-control), `requestAnimationFrame, cancelled` (prompt-library), `requestAnimationFrame, cancelled` (internal/popover – PopoverController).
- Timers: `setInterval, cleared`, `setTimeout`, `setTimeout` (context-tray), `setTimeout` (model-picker), `setTimeout` (segmented-control), `setTimeout` (prompt-library), `setTimeout` (internal/popover – PopoverController).
- 1 infinite CSS animation.
- Stops or pauses under reduced motion.
- Observers: `ResizeObserver`, `MutationObserver` (internal/base – TcElement), `MutationObserver` (internal/controllers – AriaForwardController), `MutationObserver` (internal/controllers – FocusRescueController), `ResizeObserver` (mention-picker), `ResizeObserver` (segmented-control), `ResizeObserver` (prompt-library), `ResizeObserver` (internal/popover – PopoverController).
- Listens on the page: `document pointerdown`, `document pointerdown` (model-picker), `window resize` (model-picker).
- Reads the clock: `performance.now()` (internal/controllers – RollingController), `performance.now()` (prompt-library).

*Found in its source and the shared code it uses (gen-docs); “measured” rows come from `measure:perf`.*

## Content

- Write the placeholder as an invitation in the product's voice: “Ask anything…”, “Ask anything, or press the mic to
  dictate…”.
- Keep model descriptions to one line about what each is good for: “Thoughtful writing and code”.
- Leave the built-in labels – “Connect apps”, “Request approval” – unless your product calls them something else.
  If your product has no app connections, projects or approvals, hide them rather than leaving buttons that do nothing.
- Give the page context a short title people recognise from the page itself: “Q3 report”, “Acme renewal”, not a URL
  or an id. Pass `count` when the app attaches items, or `tokens` when it sends the page as text.
- Keep the disclaimer to one sentence or two short ones: “AI can make mistakes. Check important info.”
- Name skills with the verb people would type, lower case, hyphens for spaces: “translate”, “review-pr”. Give each a
  one-line description of what it does to the message, and a `source` people recognise: “Built-in”, “Your team”, a
  plugin's name.
- Write `argumentHint` as the thing to type in angle brackets: “<language>”, “<pr number>”. Leave it out when the
  skill takes nothing.

## Do and don't

### Do

- Return a promise from `onSend` so a failed send keeps the message and says so.
- Wire `onDictate` to your speech-to-text and push `onTranscript` and `onLevel` as the words come in.
- Pass `onConnectApps` and `onRequestApproval` – without them (and without `demo`) the composer only simulates them
  and warns once in the console.
- Decide what's sent from `pageContext.connected` in your own send handler – the chip only says what the model can see.
- Put the model switch in the toolbar (`model-switcher="toolbar"`) when you also turn on settings – the two belong
  together.
- Pass `recentSkills` from what the person used last, across sessions; the composer only remembers picks while it's
  on the page.
- Read `skill` and `args` from `onSend`'s details (or tc-send) to run the skill; `message` still has the whole text.

### Don't

- Don't ship `demo` – it simulates connecting, approval and dictation silently.
- Don't clear the message yourself after `onSend`; the composer clears it when the send goes through.
- Don't remount the composer to put text in it – control `value` (React: `value` with `onValueChange`); typing keeps
  every keystroke and the caret while your state catches up.
- Don't put more than a handful of models in the list – use `model-picker` when people need to compare them.
- Don't send the page when the chip is off, or leave the chip on after the page has changed without updating its
  title and count.
- Don't put a / trigger in `mentions` next to `skills` – skills take the / key.
- Don't hide the / button unless your product teaches the shortcut somewhere else.

## Related

- [Model Picker](model-picker.md) – The model menu of an AI chat – point at a model and its speed, quality and cost bars fill, switch on extended thinking and its effort unfolds, while the tray rolls the first-token time and price
- [Mention Picker](mention-picker.md) – The / and @ picker inside a composer – grouped results, arrow keys and Enter, and the pick lands as a chip
- [Prompt Library](prompt-library.md) – Saved prompt templates with variables – type straight into the sentence, watch the finished prompt assemble below, and use it once every variable is filled
- [Context Tray](context-tray.md) – What the model can see, as chips – files, @-mentions and sources, each with its token weight; pin or remove them and watch the total against the window

## Changelog

- **Skills in `tc-chat-composer`:** `skills`, `recentSkills`, `searchSkills`, `skill`. - **Typeahead:** typing `/` at the start of a message opens a ranked typeahead, grouped by source, with recent skills first. - **Token:** a pick adds a tinted `/skill` token with its argument hint. - **Events:** `tc-send` gains `skill` and `args`, and there is a new `tc-skill-change`. - **Toolbar:** an optional "/" button.
- **`tc-chat-composer` toolbar:** - model picker, settings and prompt library; - page context you can connect and disconnect; - a disclaimer line under the input; - `hide*` props for each piece.
- chat-composer (the Lit element and `trenchcoat/react`): opt-in `mentions` (a `tc-mention-picker` on the message) and `context` / `context-limit` (a `tc-context-tray` above it). Without them it renders as before.
