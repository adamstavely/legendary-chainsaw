---
pattern: none
status: react-twin
related: model-picker, mention-picker, prompt-library, context-tray
---

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

## When to use

- The prompt field at the bottom of an AI chat or assistant.
- When people should choose the model per message, or speak instead of typing.
- When the agent needs app connections, a project or an approval before it can do its best work.
- An assistant docked beside a page, where people choose whether it can see the page – turn on `pageContext` and the
  toolbar, and leave out what the pane doesn't offer with `hide-connect-apps`, `hide-project` and `hide-approval`.
- An agent with skills or slash commands – set `skills` (and `searchSkills` when the catalogue lives on a server), so
  people can find one by name or by what it does, without knowing the list by heart.

## When not to use

- Choosing a model with speed, quality and cost side by side – use `model-picker`, alone or next to a plain field.
- A full spoken conversation with live captions, rather than dictating one message – use `voice-mode`.
- Asking for permission at the moment an agent acts – use `permission-request`.
- Editing generation settings as a page of their own, not from the composer – use `model-settings`.
- Commands that act on the app rather than on the message (open a file, switch a page) – use `command-menu`.

## Anatomy

1. **Message** `.ui-chat-composer__message` – the text area; grows with the text. Beside it: attach, “Request approval”, the mic
2. **Skills** `.ui-chat-composer__skills` – with `skills` set, the / button that opens the skills list
3. **Send** `.ui-chat-composer__send` – sends; next to the mic, which records instead
4. **Connect apps** `.ui-chat-composer__connect` – on the tray (Clean: the last row); then “Select a project”
5. **Model** `.ui-chat-composer__picker` – with `model-switcher="toolbar"`, model-picker's menu in the toolbar row (otherwise a model button in the card)
6. **Settings and prompts** `.ui-chat-composer__tool` – open model-settings and prompt-library in popovers
7. **Page context** `.ui-chat-composer__page` – connects or disconnects what's on the page; the button beside it shows what's attached

Under the row, `disclaimer` adds one quiet line. Once a skill is picked, its token `.ui-chat-composer__token` – a
tint behind “/name” at the start of the message – and its argument hint `.ui-chat-composer__arg` show in the text
area; the list itself is mention-picker's.

Each of “Connect apps”, “Select a project” and “Request approval” can be left out: `hide-connect-apps` offers
“Select a project” straight away, `hide-project` folds the row away once apps are connected, and with both the tray
(Clean: the last row) has no apps row at all.

## Looks

Standard is a white card on a gray tray that holds “Connect apps” / “Select a project” above it; it scales with its
width, and the message shows one line and grows to two. Clean is one white card with hairline shadows and fixed
sizes: the message on top, growing up to four lines, the tools in a row below it, and a quiet last row that connects
apps and then lets you pick a project; its icons are 16 px glyphs with thin lines and solid shapes. In the toolbar
row, Standard tints the connected page context chip in the accent; Clean raises it as a white chip with an accent
eye, and draws the tool icons in a quieter gray with thinner lines. The skills list is mention-picker's, in the same
look: Standard sets it on a gray tray, Clean is one white popover. The token is the same accent tint in both.

## Keyboard

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

## Screen readers

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

## Do

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

## Don't

- Don't ship `demo` – it simulates connecting, approval and dictation silently.
- Don't clear the message yourself after `onSend`; the composer clears it when the send goes through.
- Don't remount the composer to put text in it – control `value` (React: `value` with `onValueChange`); typing keeps
  every keystroke and the caret while your state catches up.
- Don't put more than a handful of models in the list – use `model-picker` when people need to compare them.
- Don't send the page when the chip is off, or leave the chip on after the page has changed without updating its
  title and count.
- Don't put a / trigger in `mentions` next to `skills` – skills take the / key.
- Don't hide the / button unless your product teaches the shortcut somewhere else.

## Example

```html
<tc-chat-composer id="composer" placeholder="Ask anything…"></tc-chat-composer>

<script type="module">
  import "trenchcoat/chat-composer";
  import "trenchcoat/tokens.css";

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

```tsx
import { useState } from "react";
import { ChatComposer, defaultModels, type ChatPageContext, type ChatSkill } from "trenchcoat/react";
import "trenchcoat/tokens.css";

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
