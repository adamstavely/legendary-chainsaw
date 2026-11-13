---
pattern: listbox
status: new
related: skill-library, tool-permissions, code-block, mcp-connection-manager
---

## Overview

One skill, everything about it in one card: who made it and its version (with Update when a newer one is out), when a
model picks it, the tools it may use with what each is allowed to do in words – read-only, writes files, runs commands,
uses the network – its files, and its recent runs.

The switch in the header turns it on or off. Turning on a skill that can write files, run commands or use the network
asks first and lists exactly which. Remove asks too, and names the agents that will stop being able to use it. Picking a
file shows it below in a code block.

## When to use

- The detail page or side panel opened from `skill-library`.
- Reviewing a skill before turning it on – what it can do, what's in it, how it has gone.

## When not to use

- All of a workspace's skills at once – use `skill-library`.
- Allowing or denying tools per agent – use `tool-permissions`.
- Editing a skill's files – this shows them; use your editor or `code-block` with Apply.

## Anatomy

1. **Switch** `.ui-skd__switch` – on or off, named by the visible "Enabled"
2. **Facts** `.ui-skd__facts` – who made it and the version, with `.ui-skd__badge` when an update is out
3. **When it's used** `.ui-skd__triggers` – the phrases that make a model pick it
4. **Tools** `.ui-skd__tool` – each tool with its permission as a mark and a word; risky ones are marked with a triangle
5. **Files** `.ui-skd__files` – the list beside `.ui-skd__viewer`, a code block of the picked file
6. **Recent runs** `.ui-skd__run` – the outcome as a mark and a word, the agent, a note and when
7. **Confirmation** `.ui-skd__confirm` – before turning on a risky skill, and before removing one
8. **Actions** `.ui-skd__actions` – Update, Export and Remove

## Looks

Standard puts the header on the gray tray above a white card; tools are filled chips and the update badge a filled
pill. Clean is one white card with the header as its first row, outlined chips and an outlined badge, and thinner icons.
`--tc-skd-files-w` sets the file list's width and `--tc-skd-mark` the size of the status marks.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the switch, the file list (one tab stop), the code block, then Update, Export and Remove |
| Enter / Space | On the switch, turns the skill off, or on – asking first if it's risky |
| ↑ / ↓ | In the file list, picks the previous or next file |
| Home / End | In the file list, the first or last file |
| Escape | In a confirmation, cancels; focus returns to the switch or Remove |

Opening a confirmation moves focus into it: to Turn on for a risky skill, to Cancel for Remove.

## Screen readers

The host is a region named by the skill. The switch is named "Enabled" and reports on or off; while the risk
confirmation is open it's `aria-expanded`. Each section is labelled by its heading. The files are a listbox, with each
folder a group named by its path. A confirmation is a group named by its question ("Turn on Contract reviewer?") and
described by what it would allow or who would lose it. Outcomes and permissions are words, not just colours. Changes are
announced politely: "Contract reviewer is on.", "Contract reviewer removed."

## Content

- Put the description's trigger phrases in `triggers`, as people would say them.
- Give every tool a `permission`; pick the strongest thing it can do – a tool that reads and writes is "write".
- Pass file contents as text; Markdown shows as written. Big files: pass the first part and say so in the content.
- Pass `usedBy` so Remove can name what stops working.

## Do

- Let people read the files before turning a skill on.
- Keep `runs` to the last few – newest first – with a note when one failed.

## Don't

- Don't skip the confirmation for risky skills by setting `enabled` straight from elsewhere without telling people what
  it can do.
- Don't show secrets in file contents – the viewer shows exactly what you pass.

## Example

```html
<tc-skill-detail id="skill" heading="Contract reviewer" author="Your team" version="1.4.0" available="1.5.0"></tc-skill-detail>

<script type="module">
  import "@adamstavely/trenchcoat/skill-detail";
  import "@adamstavely/trenchcoat/tokens.css";

  const skill = document.querySelector("#skill");
  skill.description = "Checks a supplier contract against the procurement playbook.";
  skill.triggers = ["Asked to review or mark up a contract"];
  skill.tools = [
    { name: "read_file", permission: "read" },
    { name: "clause_check.py", permission: "run" },
  ];
  skill.files = [
    { path: "SKILL.md", content: "# Contract reviewer\n\nRead the contract, then run scripts/clause_check.py." },
    { path: "scripts/clause_check.py", content: "print('ok')" },
  ];
  skill.usedBy = ["Procurement assistant"];
  skill.addEventListener("tc-enabled-change", (e) => console.log("enabled", e.detail.enabled));
</script>
```

```tsx
import { useState } from "react";
import { SkillDetail, type SkillDetailFile, type SkillDetailTool } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Skill({ tools, files, remove }: { tools: SkillDetailTool[]; files: SkillDetailFile[]; remove: () => void }) {
  const [enabled, setEnabled] = useState(false);
  return <SkillDetail title="Contract reviewer" author="Your team" version="1.4.0" tools={tools} files={files} enabled={enabled} onEnabledChange={setEnabled} onRemove={() => remove()} />;
}
```
