---
pattern: disclosure
status: new
related: panel-card, icon-rail, environment-list, change-list
---

## Overview

The side panel of a working session: a rail of tools, where the session runs, how full its context is, its connectors,
outputs and background tasks, and the changes it has made. Environment and Changes fold open here; the other sections are
rows that tell the page to open their details.

## When to use

- A coding or agent workspace, beside the conversation or the work.
- The right side of `app-shell-workspace`.

## When not to use

- One agent's progress – use `agent-monitor`.
- A list of long-running jobs by itself – use `background-tasks`.
- The terms a session was given – use `session-context-bar`.

## Anatomy

1. **Stack** `.ui-ssp__stack` – the sections, in order
2. **Rail** `.ui-ssp__rail` – the tools
3. **Section** `.ui-ssp__section` – Environment or Changes, which fold
4. **Row** `.ui-ssp__row` – Context, Connectors, Outputs or Background tasks, which open elsewhere

A section with nothing to show is left out.

## Looks

Each section is a `tc-panel-card`, so Standard puts it on the gray tray and Clean makes it one white card. Its contents
are drawn `bare`, so nothing looks doubled.

## Keyboard

The panel follows tab order, one stop per control.

| Key | What it does |
|---|---|
| Tab | Moves between the rail, the sections and what's inside them |
| Arrows, Home, End | Move along the rail |
| Enter / Space | Choose a tool, fold a section, or open a row |

## Screen readers

The rail is a named `toolbar`. Sections are buttons with `aria-expanded`. Context is a `meter` with its value in words.
Each change says its state, not only its colour.

## Content

Give each row's value in a few words, such as "14 to reconnect" or "4 running". Leave out a value to leave out its row.

## Do

- Listen for `tc-section-open` and open your details, such as `tc-context-map`, `tc-artifact-panel` or `tc-background-tasks`.
- Listen for the contained elements' events here: `tc-selected-change`, `tc-toggles-change`, `tc-action`, `tc-open`.

## Don't

- Don't put it in a narrow space that clips: the rail's tooltips and menu are drawn just outside it.

## Example

```html
<tc-session-panel id="panel" outputs="51" background="4 running" connectors="3 to reconnect" context="0.17"></tc-session-panel>

<script type="module">
  import "trenchcoat/session-panel";
  import "trenchcoat/tokens.css";

  const panel = document.querySelector("#panel");
  panel.environment = [{ id: "repo", kind: "repo", label: "institute/sample-tracker" }];
  panel.addEventListener("tc-section-open", (e) => console.log(e.detail.section));
</script>
```

```tsx
import { SessionPanel } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Side({ onOpen }: { onOpen: (section: string) => void }) {
  return (
    <SessionPanel
      environment={[{ id: "repo", kind: "repo", label: "institute/sample-tracker" }]}
      context={0.17}
      outputs="51"
      changes={[{ id: "a", title: "Alert on freezer gaps", repo: "sample-tracker", number: 214, state: "open" }]}
      onTcSectionOpen={(e) => onOpen(e.detail.section)}
    />
  );
}
```
