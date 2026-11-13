---
pattern: list
status: new
related: skill-detail, mcp-connection-manager, tool-permissions, integration-picker
---

## Overview

The skills a workspace has added, grouped by who made them: Built-in first, then your team's own, then each plugin's,
then the community's. Each skill is one row – its name, version, what it does, when a model picks it ("Runs when asked
to review a contract"), when it was last used, and a switch that turns it on or off. When a newer version is out the row
says so and offers Update.

A search, a source filter and an On / Off filter sit above the list. Add skill is a menu – Upload, From a URL, Create –
and the page does the adding. Pressing a skill's name opens it, usually in `skill-detail`.

## When to use

- The skills page of an agent workspace, where people turn skills on and off and see what's there.
- An admin view of which skills are installed, where they came from and which need an update.

## When not to use

- Everything about one skill – its tools, files and runs – use `skill-detail`.
- MCP servers and the tools they expose – use `mcp-connection-manager`.
- Which agents may call which tools – use `tool-permissions`.
- A catalogue of integrations to browse and connect – use the `app-directory` block.

## Anatomy

1. **Search and filters** `.ui-skl__tools` – search, Source and Show
2. **Source group** `.ui-skl__group-block` – one heading per maker, with its count
3. **Skill** `.ui-skl__row` – name, version, description, when it runs and when it was last used
4. **Update available** `.ui-skl__badge` – a newer version is out; `.ui-skl__update` installs it
5. **Switch** `.ui-skl__switch` – on or off, with the word beside it
6. **Add skill** `.ui-skl__add` – a menu of Upload, From a URL and Create

## Looks

Standard puts the header on the gray tray above a white card; the update badge is a filled pill. Clean is one white card
with the header as its first row, a hairline under the filters and an outlined badge. `--tc-skl-menu-w` sets the Add
skill menu's minimum width.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the search, the two filters, then each skill's name, Update and switch |
| Enter / Space | On a name, opens the skill; on a switch, turns it on or off; on Update, asks for the update |
| ↓ / ↑ on Add skill | Opens the menu on its first or last item |
| ↑ / ↓, Home, End | In the menu, moves between Upload, From a URL and Create |
| Escape | Closes the menu; focus returns to Add skill |

## Screen readers

The host is a group named by the heading. Each source is a section with a heading, and its skills are a list labelled by
it. A switch is named by its skill ("Contract reviewer", switch, on). The trigger line starts with hidden text, "When it
runs:", and Update says which skill ("Update to 1.5.0 – Contract reviewer"). Flipping a switch is announced politely:
"Expense policy checker is on."

## Content

- Name skills for the task ("Contract reviewer"), not the file ("contract_reviewer_v2").
- Keep the description to one sentence about the result; put when it runs in `triggers`, starting "Runs when…".
- Pass `group` as people know the maker: "Built-in", "Your team", the plugin's name, "Community". `groups` fixes the
  order when you need one.
- Give `now` so last used reads "2 hr. ago"; without it the date shows.

## Do

- Turn a skill off rather than removing it when someone only wants it out of the way for a while.
- Show `update` only when the newer version is actually installable.
- Open `skill-detail` from `onSkillOpen`, so people can see a skill's tools before turning it on.

## Don't

- Don't turn on a skill that can write files, run commands or use the network without saying so – `skill-detail` asks
  first; if you flip it here, say what it can do in its description.
- Don't hide disabled skills by default; people look for them to turn them back on.

## Example

```html
<tc-skill-library id="skills"></tc-skill-library>

<script type="module">
  import "@adamstavely/trenchcoat/skill-library";
  import "@adamstavely/trenchcoat/tokens.css";

  const skills = document.querySelector("#skills");
  skills.skills = [
    { id: "chart", name: "Chart from spreadsheet", description: "Turns a sheet into a clear chart.", group: "Built-in", version: "3.1.0", enabled: true, triggers: "Runs when asked to chart data" },
    { id: "contract", name: "Contract reviewer", description: "Checks a supplier contract against the playbook.", group: "Your team", version: "1.4.0", update: "1.5.0", enabled: true, triggers: "Runs when asked to review a contract" },
    { id: "expense", name: "Expense policy checker", description: "Flags claim lines that break the policy.", group: "Your team", version: "0.9.2", enabled: false },
  ];
  skills.addEventListener("tc-enabled-change", (e) => console.log(e.detail.id, e.detail.enabled));
  skills.addEventListener("tc-add", (e) => console.log("add from", e.detail.source));
</script>
```

```tsx
import { useState } from "react";
import { SkillLibrary, type LibrarySkill } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function Skills({ start, open }: { start: LibrarySkill[]; open: (id: string) => void }) {
  const [skills, setSkills] = useState(start);
  return <SkillLibrary skills={skills} onSkillsChange={setSkills} now={Date.now()} onSkillOpen={open} onAdd={(source) => console.log(source)} />;
}
```
