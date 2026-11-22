---
pattern: none
status: new
related: file-import, page-state
---

## Overview

A tray scene that says where something stands, in the soft style of the state illustrations: a rounded tray with its rim, one pastel badge with a darker edge and ink, a soft glow beneath, and its words as real text under the drawing. `status` picks the scene:

| `status` | Scene | Colour | Motion | Default words |
|---|---|---|---|---|
| `all-done` | An empty tray with a check above it | Green | The check draws itself and the badge settles a few times | You're all caught up |
| `upload-failed` | A file lifted above an open tray, its upload arrow stopping short, with a cross badge | Red | The file rises a little and drops back a few times | Upload failed |
| `empty` | An empty tray, no check | Slate | The tray settles a few times | Nothing here yet |
| `import-complete` | A few pages settled in the tray, with a check | Green | The pages drop in once and the check draws itself | Import complete |
| `export-ready` | A page rising out of the tray, with a download mark | Blue | The page rises a little a few times | Export ready |
| `storage-full` | Pages overflowing the tray's rim, with a "!" | Amber | The top page wobbles a few times | Storage full |
| `drop-to-upload` | An open tray with a dashed page hovering above it and an up arrow | Blue | The dashed page bobs a few times | Drop files to upload |
| `new-items` | A tray with `count` on its badge ("99+" past 99) | Blue | The badge settles a few times | 3 new (follows `count`) |
| `paused` | A tray with a pause mark | Slate | The badge settles twice | Paused |
| `sync-complete` | A tray with circular arrows and a check | Green | The arrows turn once and the check draws itself | Sync complete |

The words follow the status – and for `new-items` the `count` – unless `caption` sets its own. It replaces `<tc-all-done>` and `<tc-upload-failed>`: `status="all-done"` and `status="upload-failed"` draw their scenes exactly as they were.

## When to use

- An inbox, queue or to-do list with nothing waiting (`all-done`) – a finish, not a failure: the person cleared it.
- A list that's never had anything in it yet – a first visit (`empty`), beside how to add the first item.
- An empty dropzone (`drop-to-upload`), with the file picker beside it.
- An import that finished (`import-complete`), with what was imported.
- An export that's ready to download (`export-ready`) – it pairs with Export Dialog's ready state – beside the download link.
- An upload that didn't finish: too large, the wrong type, or the connection dropped (`upload-failed`), beside the reason and a way to try again.
- A workspace or account out of space (`storage-full`), with how to free some or get more.
- New items waiting since the person last looked (`new-items`), with `count` saying how many – the words follow it ("12 new").
- A queue, intake or sync that's been paused on purpose (`paused`), with who paused it and Resume.
- A sync with another system that finished (`sync-complete`), with when it last ran.

## When not to use

- A search or filter with no matches – use `page-state` with `status="nothing-found"`.
- A page or request that couldn't load – use `page-state` with `status="something-wrong"`.
- Where a document stands in a workflow – use the document-status illustrations.

## Anatomy

1. **Tray** `.ui-trs-tray` or `.ui-trs-tile` – the tray, and the pages or file in or above it (`.ui-trs-outline` is the dashed page of `drop-to-upload`)
2. **Mark** `.ui-trs-badge` – the round badge, with a check, a cross, a download or up arrow, a "!", a count (`.ui-trs-count`), a pause mark or turning arrows in ink (`empty` has none)
3. **Words** `.ui-trs-caption` – what's happened; the default follows the status

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or the system setting, and each status has its own badge colour. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by its words, so what's happened is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same.

## Content

Say what happened and what to do next beside it: "Scan_0412.tiff is 48 MB; the limit is 25 MB."

## Do

- Switch `status` on one element as things change, rather than swapping elements.
- Give an upload failure its reason and a way to try again in words.

## Don't

- Don't use `all-done` while things are still loading – show that it's loading instead.
- Don't use it as the only sign of a failure.

## Example

```html
<tc-tray-status status="upload-failed"></tc-tray-status>

<script type="module">
  import "@adamstavely/trenchcoat/tray-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { TrayStatus } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function QueueState({ empty }: { empty: boolean }) {
  return empty ? <TrayStatus status="all-done" /> : null;
}
```
