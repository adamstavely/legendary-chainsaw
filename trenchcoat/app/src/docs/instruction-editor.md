---
pattern: tabs
status: new
related: inline-diff, model-settings, run-compare, configuration-release-control
---

## Overview

An editor for the system or developer instructions a model works from. The text sits on a code surface with line
numbers, and every `{{variable}}` shows as a chip in place – red with a wavy underline when the app doesn't define
it. Below it, the variables the text uses and the ones the app defines are listed with how often each is used,
flagged when one is missing or unused, and insert at the caret with a click. A version rail lists saved versions;
picking one shows the changes since then as an inline word diff, with Restore. Save as a new version takes an
optional note. The token count is the app's, never estimated here.

## When to use

- Writing and maintaining the instructions behind an assistant or an agent, with their history.
- A playground beside `model-settings`, where people edit a prompt and compare it with what shipped.
- Reviewing what changed in a prompt before saving a version.

## When not to use

- Reviewing suggested edits to someone else's text, change by change – use `inline-diff`.
- Comparing two runs' outputs, steps and costs – use `run-compare`.
- Promoting a whole configuration through draft, staging and production – use `configuration-release-control`.

## Anatomy

1. **Tab bar** `.ui-ied__bar` – Edit and Changes since a version, and System or Developer
2. **Code surface** `.ui-ied__editor` – the text with line numbers and variable chips
3. **Status bar** `.ui-ied__status` – lines, variables and the app's token count against the limit
4. **Variables** `.ui-ied__vars` – each variable, how often it's used, and whether it's missing or unused
5. **Version rail** `.ui-ied__rail` – the working copy with Save, then the saved versions to compare with

## Looks

Standard is a white card on a gray tray: the code surface is a gray well, variables are violet chips, the diff is in
filled red and green, and the active tab has an ink underline. Clean is one white card: the surface is white inside a
hairline frame, variables are accent-tinted, removed words are struck through in gray, added ones underlined, and the
active tab's underline is the accent. Below 640 px of container width the version rail moves under the editor.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the tabs, the role switch, the editor, the variables, the note, Save and the version rail |
| ← / → | On the tabs: the other tab; on the role switch: the other role |
| ↑ / ↓ / ← / → | In the version rail: picks the newer or older version and shows its changes |
| Home / End | On the tabs or in the rail: the first or last one |
| ⌘S / Ctrl+S | In the editor: saves a new version |
| Enter | In the note: saves a new version |
| Space / Enter | On a variable: inserts it at the caret |

The editor is a native textarea, with its usual keys, selection and undo.

## Screen readers

The host is a group named by the heading, and the textarea is named by it too. When the text uses a variable the
app doesn't define, the textarea is `aria-invalid` and described by “Uses variables the app doesn't define: tone”.
The chips on the surface are hidden; the textarea holds the same text. The tabs are a tablist named “View”, the
changes tab named with its counts – “Changes since v3 +15 −14 words”. The diff is a focusable region “Changes since
v3”, with “removed:” and “added:” read before each change. The rail is a radiogroup “Compare with”. Each variable
button reads “Insert {{company}} 1×, Trading name”. A status region announces “Saved as v4”, “Restored v2” and
“Inserted {{company}}”.

## Content

- Name variables in `snake_case` and describe each in a few words: “First name from the customer's profile”.
- Ask for a note on Save that says what changed and why: “Policy source and hand-over”.
- Keep the placeholder as guidance on what instructions need: who the model works for, what to do, what not to do.

## Do

- Count tokens with the provider's own tokenizer and pass `tokenCount`; set `counting` while it runs.
- Pass `tokenLimit` when the instructions share a context budget, so people see when they run over.
- Keep `versions` on the server and pass them back after `tc-save`, with `by` and `at` filled in.

## Don't

- Don't estimate tokens from characters in production – the count people see should be the one you bill.
- Don't let a missing variable through to a release; the editor flags it, the app should block it.
- Don't put user messages or examples here; this edits the instructions, not the conversation.

## Example

```html
<tc-instruction-editor id="prompt" token-count="412" token-limit="1000"></tc-instruction-editor>

<script type="module">
  import "trenchcoat/instruction-editor";
  import "trenchcoat/tokens.css";

  const prompt = document.querySelector("#prompt");
  prompt.value = { role: "system", text: "You are the support assistant for {{company}}." };
  prompt.variables = [{ name: "company", description: "The company's trading name" }];
  prompt.versions = [{ id: "v1", label: "v1", value: { role: "system", text: "You help customers." } }];
  prompt.addEventListener("tc-save", (e) => console.log("save", e.detail.version));
</script>
```

```tsx
import { useState } from "react";
import { InstructionEditor, type InstructionEditorValue, type InstructionVersion } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Prompt() {
  const [value, setValue] = useState<InstructionEditorValue>({ role: "system", text: "You are the support assistant for {{company}}." });
  const [versions, setVersions] = useState<InstructionVersion[]>([]);
  return (
    <InstructionEditor
      title="Reply assistant"
      value={value}
      onChange={setValue}
      variables={[{ name: "company", description: "The company's trading name" }]}
      versions={versions}
      onSave={(_, next) => setVersions(next)}
      tokenCount={412} // from your provider's tokenizer
    />
  );
}
```
