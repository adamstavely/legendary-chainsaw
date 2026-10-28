---
pattern: form
status: new
related: permission-request, approval-card, data-handling-policy, tool-permissions
---

## Overview

A person asks for access to one piece of data. The resource comes first: its name, what kind of thing it is (dataset,
table, file, report or field), who owns or looks after it, its classification in words, and what the person already
has.

Then the form:
- the access level – View, Download or Edit, or your own;
- how long – 7, 30 or 90 days, an end date, or permanent when you allow it;
- a required justification with a character counter;
- an optional ticket or reference;
- the fields needed, when you list them.

Sending fires a cancelable `tc-request`. After that the card shows where the request stands, each state in words with
an icon:
- **Pending:** who decides, when it was sent, and Cancel request.
- **Approved:** the level, when access ends and the time left.
- **Denied:** the reason, and Request again.
- **Expired:** when it ended, and Request again.

`status` is yours to own: set it from your approval workflow.

## When to use

- Self-service access to datasets, tables, files or reports in a data catalogue.
- Asking for more than you have – Download where you can only View.
- Showing someone where their request stands, in the same place they asked.

## When not to use

- The approver's side, deciding on a request – use `approval-card`.
- An agent asking a person for a right – use `permission-request`.
- Setting rules for how data may be used – use `data-handling-policy`.
- Granting many tools at once – use `tool-permissions`.

## Anatomy

1. **Resource** `.ui-dar__resource` – the data asked for: its type icon, name, type, classification, owner, steward and current access
2. **Classification** `.ui-dar__class` – the sensitivity in words, with a lock
3. **Level** `.ui-dar__levels` – the access levels, each with a line on what it allows
4. **Duration** `.ui-dar__chips` – how long, and the end date field when End date is picked
5. **Fields** `.ui-dar__fields` – the fields or columns needed, when `fields` is given
6. **Justification** `.ui-dar__why` – why the person needs it, with a counter
7. **Reference** `.ui-dar__input` – an optional ticket or reference
8. **Status** `.ui-dar__status` – where the request stands, in words with an icon and its action

## Looks

Standard is a white card on a gray tray, with the header on the tray above it and medium-weight names. Clean is one
white card with the header as its first row. The form and the status lines are the same in both.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves between the level, the duration, each field and the buttons |
| ← / → or ↑ / ↓ | In the level or the duration, moves to and picks the previous or next choice |
| Home / End | In the level or the duration, picks the first or last choice |
| Space | Ticks or clears a field |
| Enter | In a text field, sends the request |

## Screen readers

The card is a group named by the heading. The classification is read as "Classification: Internal". The level and
the duration are `radiogroup`s. The justification is required, and is described by its counter and, after a failed
send, by its error. The end date and the fields work the same way. A failed send moves focus to the first field with a
problem. Sending, cancelling and the status line are announced politely: "Request sent", "Request cancelled".

## Content

- Name the resource as the catalogue does, and give it one line of description.
- Describe each level by what it allows ("Export a copy"), not by its permission name.
- Keep `minJustification` low enough to be fair – 20 characters is a sentence.
- Give a denial reason that says what to do instead.

## Do

- Set `status` from your workflow, so the card matches what the approver sees.
- Pass `approvers`, so the person knows who is deciding.
- Offer Permanent (`allow-permanent`) only where your policy allows it.

## Don't

- Don't use colour alone for the classification – keep its word.
- Don't ask for a reference you don't use; set `reference-label=""` to hide it.
- Don't list hundreds of fields; group them, or ask in the justification instead.

## Example

```html
<tc-access-request id="ask"></tc-access-request>

<script type="module">
  import "trenchcoat/access-request";
  import "trenchcoat/tokens.css";

  const ask = document.querySelector("#ask");
  ask.resource = { name: "Field station sensor readings 2024", type: "dataset", owner: "Field Data team", classification: "internal", current: "No access" };
  ask.approvers = ["Dr Ines Okafor"];
  ask.addEventListener("tc-request", (e) => console.log(e.detail.level, e.detail.until, e.detail.justification));
</script>
```

```tsx
import { useState } from "react";
import { AccessRequest, type AccessStatus } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function AskForData() {
  const [status, setStatus] = useState<AccessStatus>("draft");
  return (
    <AccessRequest
      resource={{ name: "Field station sensor readings 2024", type: "dataset", owner: "Field Data team", classification: "internal" }}
      approvers={["Dr Ines Okafor"]}
      status={status}
      onStatusChange={setStatus}
      onRequest={(request) => console.log("Send to the workflow", request)}
    />
  );
}
```
