---
pattern: listbox
status: new
related: agent-ledger, evidence-list, coverage-matrix, guardrail-notice
---

## Overview

What an adversarial test broke, and what was done about it. A list of findings sits on the left (on top when narrow)
with each one's code, severity, status, age and area. The picked finding fills the right: its title and summary, the
parts of the system it touched, the invariants it failed, the scenario that found it, the evidence it left, and the
response as an agent ledger – every change made in response, newest first, each with an undo.

## When to use

- Reviewing red-team or evaluation results one finding at a time.
- Showing an incident's response next to what triggered it, so a reviewer can undo a change.

## When not to use

- Only the changes an agent made – use `agent-ledger`.
- Exhibits and their chain of custody – use `evidence-list`.
- Which tests cover which risks – use `coverage-matrix`.
- One policy block shown to a person – use `guardrail-notice`.

## Anatomy

1. **Findings** `.ui-rtf__list` – the list card, with the open count in its header
2. **Finding** `.ui-rtf__option` – code, severity, age, title, status and area
3. **Detail** `.ui-rtf__detail` – the picked finding
4. **Title** `.ui-rtf__title` and **summary** `.ui-rtf__summary`
5. **Affected** `.ui-rtf__chips` – the parts it touched, and Run again
6. **Failed invariants** `.ui-rtf__rules`
7. **Scenario** and **Evidence** `.ui-rtf__pair` – side by side, stacked when narrow
8. **Response timeline** – the `tc-agent-ledger`

## Looks

Standard puts each card's header on a gray tray above a white card. Clean is one white card per section, with the
header as its first row and a medium-weight title. The ledger follows the same look.

## Keyboard

| Key | What it does |
|---|---|
| ↑ / ↓ | Picks the previous or next finding; the detail follows |
| Home / End | Picks the first or last finding |
| Tab | Moves from the list into the detail: Run again, evidence, the ledger's Undo |
| Enter / Space | Presses the focused button |

The list is one tab stop, on the picked finding.

## Screen readers

The list is a `listbox` named by its heading; each finding is an `option`, the picked one `aria-selected`. The detail
is an `article` named by the finding's title, and each section is named by its heading. Severity and status are words,
not only colours; the failed-invariant marks are hidden, the rule ids are read.

## Content

- Give each finding a short `code` people can say (“F-001”).
- Write `opened` the way your team reads ages (“2h ago”); it isn't recalculated.
- Invariants are rule ids or short sentences; put the explanation in `detail`.
- Mark responses that can't be taken back (`reversible: false`), such as a sent notice.

## Do

- Pass `now` when the page has its own clock, so the ledger's ages match.
- Set `open-evidence` and handle `tc-evidence-open` to open the evidence viewer.
- Rename severities and statuses with `severityLabels` / `statusLabels` to match your process.

## Don't

- Don't use it for routine alerts – it's for findings that need a decision.
- Don't hide resolved findings; the open count tells people what's left.

## Example

```html
<tc-red-team-finding id="findings" open-evidence></tc-red-team-finding>

<script type="module">
  import "trenchcoat/red-team-finding";
  import "trenchcoat/tokens.css";

  const el = document.querySelector("#findings");
  el.findings = [
    {
      id: "f1",
      code: "F-001",
      title: "Agent sent an email before its approval step",
      severity: "critical",
      status: "open",
      opened: "2h ago",
      summary: "A delegated agent sent an email without the approval the policy asks for.",
      invariants: [{ id: "i1", rule: "external-write.requires-approval" }],
      scenario: { id: "redteam.tool.approval-bypass-v1", description: "The agent tries an outside write tool." },
      responses: [{ id: "r1", action: "Paused tool", target: "email.send", system: "Tool gateway", at: Date.parse("2026-10-27T09:16") }],
    },
  ];
  el.addEventListener("tc-evidence-open", (e) => console.log(e.detail.evidence.id));
</script>
```

```tsx
import { useState } from "react";
import { RedTeamFinding, type Finding } from "trenchcoat/react";
import "trenchcoat/tokens.css";

const findings: Finding[] = [
  {
    id: "f1",
    code: "F-001",
    title: "Agent sent an email before its approval step",
    severity: "critical",
    status: "open",
    opened: "2h ago",
    summary: "A delegated agent sent an email without the approval the policy asks for.",
    invariants: [{ id: "i1", rule: "external-write.requires-approval" }],
    scenario: { id: "redteam.tool.approval-bypass-v1", description: "The agent tries an outside write tool." },
  },
];

export function Findings() {
  const [picked, setPicked] = useState("f1");
  return <RedTeamFinding findings={findings} finding={picked} onFindingChange={setPicked} onUndo={(ids, f) => console.log(f.id, ids)} />;
}
```
