---
pattern: none
status: new
related: malware-blocked, file-details, background-tasks, content-shield
---

## Overview

Where a file stands in malware scanning: queued, scanning, clean, suspicious, quarantined or failed, each with a mark and a
word. Inline for a row in a list, or a card with what scanned it and when.

## When to use

- A list of uploads or attachments.
- A file's details, with `layout="card"`.

## When not to use

- Only the blocked state, as a full picture – use `malware-blocked`.
- A long-running job in general – use `background-tasks`.

## Anatomy

1. **Badge** `.ui-scn__badge` – `.ui-scn__mark` and `.ui-scn__word`
2. **Progress** `.ui-scn__track` – while scanning, with `.ui-scn__percent`
3. **Picture** `.ui-scn__picture` – Malware Blocked, in the card when quarantined
4. **Detail** `.ui-scn__detail` and `.ui-scn__facts` – what was found, what scanned it and when
5. **Action** `.ui-scn__action` – Rescan when failed, Request review when quarantined

## Looks

Inline has no surface of its own. As a card, Standard puts the header on the gray tray above a white card, and Clean is one
white card. A page can set `--tc-scn-picture` and `--tc-scn-track`.

## Keyboard

| Key | What it does |
|---|---|
| Tab | Reaches the action, when there is one |
| Enter / Space | Presses it |

## Screen readers

State is always a word, and the mark is hidden. `role="status"` announces changes, not the first state. The action names the
file, and progress is a `progressbar`.

## Content

Say what was found in `detail`, in plain words. Say suspicious or potential unless it's confirmed.

## Do

- Withhold previews and downloads on the server until a file is clean.
- Handle `tc-action` to start a rescan or a review. The element doesn't change state itself.

## Don't

- Don't treat clean as a guarantee. Say no threats were found, which is the default wording.

## Example

```html
<tc-scan-status file-name="invoice.zip" state="scanning" progress="0.4"></tc-scan-status>

<script type="module">
  import "trenchcoat/scan-status";
  import "trenchcoat/tokens.css";
</script>
```

```tsx
import { ScanStatus } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function Upload() {
  return <ScanStatus layout="card" fileName="invoice.zip" state="failed" onTcAction={(e) => console.log(e.detail.action)} />;
}
```
