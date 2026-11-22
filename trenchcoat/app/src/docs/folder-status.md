---
pattern: none
status: new
related: tray-status, file-tree, share-panel, legal-hold-manager
---

## Overview

A folder scene that says where a folder stands, in the soft style of the state illustrations: a pastel folder (its back with the tab and its front flap), one pastel badge with a darker edge and ink, a soft glow beneath, and its words as real text under the drawing. `status` picks it:

| `status` | Scene | Colour | Motion | Default words |
|---|---|---|---|---|
| `empty` | An open folder with nothing in it | Slate | The front flap eases open a few times | Empty folder |
| `shared` | Two small people on the badge | Blue | The badge settles a few times | Shared folder |
| `archived` | A box with an arrow going into it on the badge | Slate | The arrow drops a few times | Archived |
| `locked` | A small padlock badge on the folder's corner | Amber | The lock settles a few times | Locked folder |
| `syncing` | Circular arrows on the badge | Blue | The arrows turn a few times | Syncing |
| `restricted` | A shield on the badge | Red | The badge settles a few times | Restricted folder |

The words follow the status unless `caption` sets its own.

## When to use

- A folder with nothing in it yet (`empty`), beside how to add the first file.
- A folder others can see or edit (`shared`), with who it's shared with.
- A folder kept for the record but out of the way (`archived`), with how long it's kept and how to restore it.
- A folder people can't open right now (`locked`) – a legal hold, a permission – with who to ask.
- A folder that's copying to or from another system (`syncing`), with how far it's got.
- A folder whose contents carry a classification (`restricted`) – who may see it, not whether it's shut – beside the classification in words (see `sensitivity-label-picker`).

## When not to use

- An inbox, queue or upload – use `tray-status`.
- A single document's place in a workflow – use the document-status illustrations.
- The folder's contents – use `file-tree`.

## Anatomy

1. **Folder** `.ui-fds-back` and `.ui-fds-front` – the back with its tab, and the front flap
2. **Mark** `.ui-fds-badge` – the round badge, with people, a box, a padlock, turning arrows or a shield in ink (`empty` has none)
3. **Words** `.ui-fds-caption` – where the folder stands; the default follows the status

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or the system setting, and each status has its own badge colour. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by its words, so where the folder stands is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what it means and what to do beside it: "Held for legal review. Ask Noor Haddad for access."

## Do

- Switch `status` on one element as the folder changes, rather than swapping elements.
- Say who to ask about a locked folder.

## Don't

- Don't rely on it to keep a folder shut – a locked folder is your server's decision; this is a picture and words.
- Don't use it as the only sign that a folder is shared, locked or restricted.
- Don't use `restricted` for a lock, or `locked` for a classification – they mean different things.

## Example

```html
<tc-folder-status status="locked"></tc-folder-status>

<script type="module">
  import "@adamstavely/trenchcoat/folder-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { FolderStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function FolderState({ locked }: { locked: boolean }) {
  return <FolderStatus status={locked ? "locked" : "shared"} />;
}
```
