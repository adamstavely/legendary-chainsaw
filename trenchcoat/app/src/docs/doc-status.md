---
pattern: none
status: new
related: tray-status, page-state, folder-status, scan-status
---

## Overview

Where a document stands, as one illustration: a soft page tile (or a book, for a reading list), one pastel badge with a darker edge and ink, a soft glow beneath, and the words as real text under it. `status` picks what's drawn on the badge, its colours, its short motion and its words, so one element covers a document's whole life – drafted, in review, scheduled or queued, in work, done or failed, coming and going, checked for malware, locked, restricted, redacted, password protected, encrypted, shared, signed, commented on, converted to text, updated, archived or in the trash, its metadata cleansed, saved to read, or edited offline. Change `status` on the same element as the document moves along and it reads as one thing changing.

The motion is short and finite – a check that draws itself, an arrow that settles, a few pulses – then it rests; it holds still off screen and stays still with reduced motion. The words follow the status unless `caption` sets your own.

It replaces the eleven illustrations that were each one of these – `released`, `pending-release`, `awaiting-review`, `in-translation`, `in-quality-control`, `in-coordination`, `processing`, `uploading`, `downloading`, `malware-blocked` and `preview-unavailable` – which are gone: use this element with their status instead.

| `status` | Colour | On the badge | Use it for |
|---|---|---|---|
| `awaiting-review` | Purple | An hourglass that turns | Waiting for someone to approve it |
| `approved` | Green | A stamp with a check | Reviewed and accepted |
| `changes-requested` | Amber | An arrow turning back | Reviewed and sent back for changes – say what to change |
| `in-translation` | Teal | Two speech bubbles | Being translated |
| `in-quality-control` | Blue | A magnifier with a check | Being checked before release |
| `in-coordination` | Amber | Three linked nodes | Several people or teams agreeing it |
| `pending-release` | Pink | An arrow ready to go up | Approved and waiting for its release |
| `released` | Green | A check with sparks | Out and live |
| `added-to-readbook` | Green | A book with a bookmark and a check | Saved to the reading list |
| `processing` | Teal | A progress ring that turns | A long job with measurable progress |
| `in-progress` | Blue | Three dots that pulse | Work under way, no number to show |
| `success` | Green | A check, a ring that pops out | Finished without a problem |
| `partially-processed` | Amber | A half-filled ring, an amber "!" on the corner | Finished with some errors – say which parts failed and offer Retry |
| `failed` | Red | A cross, one small shake | Didn't work – say why beside it |
| `uploading` | Lime | An arrow rising out of a tray | On its way up |
| `downloading` | Sky blue | An arrow dropping into a tray | On its way to the person |
| `working-offline` | Slate | A cloud with a line drawn through it | Changes are saved on this device and sync when you're back online |
| `locked` | Amber | A padlock | Someone else is editing it, or it's on hold |
| `malware-scan` | Teal | A shield, a scan line down the page | Held until its malware scan finishes |
| `malware-blocked` | Red | A warning shield in front of the file | Flagged and can't be opened |
| `preview-unavailable` | Grey | The contents faded to a dashed outline, a question mark | A file type the viewer can't show – offer Download |
| `metadata-cleansing-required` | Amber | A tag with specks beside it | Metadata needs tidying before it moves on |
| `metadata-cleansing-in-progress` | Blue | A tag, dots pulsing on its corner | Metadata being cleansed |
| `metadata-cleansing-failed` | Red | A tag, a cross on its corner | Cleansing didn't work |
| `metadata-cleansing-success` | Green | A tag, a check on its corner | Metadata is clean |
| `draft` | Slate | A pencil; the page edge dashed | Not finished, not shared yet |
| `scheduled` | Blue | A calendar with a day marked | Set to go out on a date – between pending release and released |
| `queued` | Slate | Three lines lighting in turn | Waiting its turn, not started – unlike in progress |
| `archived` | Slate | An archive box | Kept but out of the way; still findable |
| `in-trash` | Slate | A bin | Deleted but recoverable – put Restore beside it |
| `expired` | Amber | A clock whose hand sweeps once | Past its retention or validity date |
| `duplicate` | Amber | Two pages with "=" | The same as another document – link to it |
| `sync-conflict` | Amber | Two pages, an amber "!" on the corner | This copy and another changed apart – pairs with working offline |
| `restricted` | Red | A classification shield | Only some people may open it |
| `legal-hold` | Purple | A gavel | Kept unchanged for a legal matter – it can't be edited or deleted until the hold is released |
| `redacted` | Slate | Black bars over the page's text, an eye with a line through it | Parts are hidden before it's shared |
| `awaiting-signature` | Purple | A pen nib | Waiting for someone to sign |
| `signed` | Green | A pen nib, a check on the corner | Signed by everyone it needed |
| `shared` | Blue | Two people | Shared with others – say with whom |
| `encrypted` | Slate | A key | Stored encrypted; nothing to do |
| `password-protected` | Amber | A password field over the page, a padlock | Needs a password to open – ask for it beside it; unlike encrypted (nothing to do) or locked (someone else has it) |
| `update-available` | Blue | An arrow up with a dot | A newer version is ready – offer Update |
| `converting` | Teal | The page read under a scan bracket, a text cursor | Being turned into searchable text (OCR) |
| `comment-needed` | Purple | A speech bubble | Comments wait for an answer |

## When to use

- A document, file or record whose state people need to see at a glance – in a list, on its page, in an empty preview.
- One element that moves through its states as the item does.

## When not to use

- An inbox or queue with nothing left in it, or a file that couldn't upload – use `tray-status` with `status="all-done"` or `upload-failed`.
- A scan result inline in a list – use `scan-status`.
- A page that couldn't load – use `page-state` with `status="something-wrong"`.

## Anatomy

1. **Tile** `.ui-dst-page` – the document, with its folded corner `.ui-dst-fold` (or, for `added-to-readbook`, a book with its spine and bookmark `.ui-dst-ribbon`), and lines of text
2. **Over the page** – for `redacted`, black bars `.ui-dst-bar` over its lines; for `password-protected`, a password field `.ui-dst-field`; for `converting`, a scan bracket `.ui-dst-bracket`
3. **Mark** `.ui-dst-badge` – the round badge, with the status drawn on it in ink (for `malware-blocked`, a shield `.ui-dst-shield` in front of the file instead; for `preview-unavailable`, a smaller badge over a dashed outline `.ui-dst-ghost`)
4. **Words** `.ui-dst-caption` – where it stands

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting, and each status has its own badge colour. It has no background of its own, so it takes on whatever it sits on.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by its words, so where the document stands is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same. Colour is never the only sign: the drawing and the words say it too.

## Content

Put what happened and what to do next beside it: "The import stopped at row 412 – fix the date column and retry."

## Do

- Move one element through its statuses as the document moves, rather than swapping illustrations.
- Use `caption` when your product calls a stage something else.

## Don't

- Don't use it as the only sign of a problem – say what's wrong in words beside it.
- Don't make it bigger than the content it explains.

## Example

```html
<tc-doc-status status="in-quality-control"></tc-doc-status>

<script type="module">
  import "@adamstavely/trenchcoat/doc-status";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { DocStatus, type DocStatusValue } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function ReportState({ status }: { status: DocStatusValue }) {
  return <DocStatus status={status} />;
}
```
