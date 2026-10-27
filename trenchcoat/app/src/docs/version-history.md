---
pattern: listbox
status: new
related: configuration-release-control, inline-diff, change-summary, playbook-canvas
---

## Overview

The versions of an agent, a prompt or a workflow on one timeline, newest first. Each version says whether it's a
draft, the active one or deprecated, who made it and when, and what it does differently – changes written as
behaviour (+ added, − removed, ~ changed), not as the settings that moved. A draft says that the active version stays
until it's approved, so nobody wonders what is running now. People compare any two versions, restore an old one as a
new draft, and approve and activate a draft after a confirmation that names what changes. The component changes
nothing on its own: every action is an event the app answers.

## When to use

- An agent, prompt or workflow that people change over time and need to trust: what's live, what's waiting, what
  changed and who changed it.
- Approving a draft before it replaces the version in use.
- Going back to how something behaved before – restore makes a new draft from a past version.

## When not to use

- Moving one version through environments (draft, staging, production) with gates and rollout – use
  `configuration-release-control`.
- Reviewing edits to a piece of text word by word – use `inline-diff`.
- Summing up what one run or one edit changed – use `change-summary`.

## Anatomy

1. **Active version** `.ui-vhist__live` – in the header: which version is live
2. **Compare bar** `.ui-vhist__bar` – how many versions there are, and the Compare toggle
3. **Timeline** `.ui-vhist__rows` – every version, newest first, on a rail
4. **Version** `.ui-vhist__row` – its label, status, time and note; the one shown is highlighted
5. **Detail** `.ui-vhist__detail` – the version you're on, or the two you're comparing
6. **Changes** `.ui-vhist__changes` – what it does differently: + added, − removed, ~ changed
7. **Actions** `.ui-vhist__acts` – Approve and activate, Restore as draft, Compare with the active version

## Looks

Standard puts the header on the gray tray and the timeline and detail in a white card, the detail on a light gray
well; the version label in the detail is the card's strongest line. Clean is one white card divided by hairlines,
with the list count as a small caption, quieter text and thinner icons. Both draw the same rail: a filled dot for
the active version, a ring inside a ring for a draft and a hollow dot for a deprecated one. When the card is narrow
the detail moves under the timeline.

## Keyboard

| Key | What it does |
|---|---|
| ↓ / ↑ | Moves to the next or previous version and shows it |
| Home / End | Moves to the newest or oldest version |
| PageDown / PageUp | Moves a list-height down or up |
| Space / Enter (comparing) | Picks the version you're on, or unpicks it; a third pick replaces the first |
| Escape (comparing) | Leaves compare |
| ← / → (actions) | Moves between the actions; Home and End jump |
| Tab / Shift+Tab (confirmation) | Stays inside the dialog |
| Escape (confirmation) | Cancels and returns focus to Approve and activate |

## Screen readers

The host is a region named by the heading (“Version history”). The timeline is a listbox named “Versions”; each
version is an option with `aria-selected`, `aria-posinset` and `aria-setsize` (so the count stays right while the
list is windowed), read as its label, status, time, note and author (“v1.3 Draft Today · 09:12 Tighter review
before anything is sent, by M. Lindqvist”). While comparing, the listbox is multi-select and named “Versions – pick
two to compare”, and the picked versions are selected. Each change is read with its kind first (“Added: Asks a team
lead to approve…”); the signs are hidden. The actions are a toolbar named after the version (“v1.3 actions”);
Approve and activate has `aria-haspopup="dialog"` and, when `activateBlocked` is set, stays focusable with
`aria-disabled` and is described by the reason. The confirmation is a modal dialog labelled “Activate v1.3?” and
described by what changes. A polite status says what happened: “Compare: pick two versions.”, “v1.0 to v1.3: 5
changes.”, “Couldn't compare v1.2 with v1.3.”, “Restore of v1.1 requested.”, “v1.3 is active. v1.2 is deprecated.”

## Content

- Write each change as what it will do differently, in the present tense: “Asks a team lead to approve when anything
  is urgent”, not “Updated approval_policy”.
- Put numbers that changed in the sentence with the old value: “from a score of 0.90 (was 0.85)”.
- Keep `note` to one line about the version as a whole; the changes carry the detail.
- Give `at` as people should read it (“Today · 09:12”, “May 28”): the component shows it as given.
- When someone can't approve, say who can in `activateBlocked`: “Only a workspace owner can approve drafts.”

## Do

- Keep earlier runs tied to the version that produced them, and say so – the confirmation does.
- Answer a restore by adding the new draft to `versions`; the component shows it.
- Use `resolveCompare` when your own comparison knows more than the change lists, and let it fail – the component
  shows the error and Try again.

## Don't

- Don't activate a draft without the confirmation – the confirmation is the approval.
- Don't list changes as field names or raw diffs; people reviewing behaviour can't act on them.
- Don't delete deprecated versions to tidy the list – the record of what ran matters.

## Example

```html
<tc-version-history id="history" heading="Briefing agent"></tc-version-history>

<script type="module">
  import "trenchcoat/version-history";
  import "trenchcoat/tokens.css";

  const history = document.querySelector("#history");
  history.versions = [
    {
      id: "v13", label: "v1.3", status: "draft", note: "Tighter review", author: "M. Lindqvist", at: "Today · 09:12",
      changes: [{ kind: "added", text: "Asks a team lead to approve when anything is urgent" }],
    },
    { id: "v12", label: "v1.2", status: "active", note: "Groups related items", author: "D. Okafor", at: "May 28" },
  ];
  history.addEventListener("tc-activate", (e) => saveVersions(e.detail.versions));
  history.addEventListener("tc-restore", (e) => createDraftFrom(e.detail.version.id));
</script>
```

```tsx
import { useState } from "react";
import { VersionHistory, type VersionEntry } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AgentVersions({ initial }: { initial: VersionEntry[] }) {
  const [versions, setVersions] = useState(initial);
  return (
    <VersionHistory
      title="Briefing agent"
      versions={versions}
      onVersionsChange={setVersions}
      onRestore={(version) =>
        setVersions((list) => [{ ...version, id: `${version.id}-restored`, label: "Draft", status: "draft", note: `Restored from ${version.label}` }, ...list])
      }
    />
  );
}
```
