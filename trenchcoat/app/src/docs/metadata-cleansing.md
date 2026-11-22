---
pattern: none
status: new
related: success, failed, in-progress, import-review
---

## Overview

Where a record's metadata cleansing stands, as a document with a tag on its badge – the tag says it's about metadata – and, on the badge's corner, a small mark for the state. `status` picks it:

- `required` (amber) – the metadata needs tidying (missing fields, inconsistent names, duplicates) before the record can move on; specks twinkle beside it twice.
- `in-progress` (blue) – it's being cleansed; three small dots on the corner pulse in turn a few times.
- `failed` (red) – cleansing didn't work; a cross draws itself and the badge gives one small shake.
- `success` (green) – it's clean; a check draws itself.

Its words follow the status – "Metadata cleansing required", "Cleansing metadata", "Metadata cleansing failed", "Metadata cleansed" – unless `caption` sets its own. It's one of the document-status illustrations beside `released`, `success`, `failed` and `in-progress`, drawn the same way so a list of items reads at a glance; the generic Success, Failed and In Progress are for anything else.

## When to use

- A record or a batch held at a metadata cleansing step, and where it stands in that step.
- Beside what to do next – Review fields, Retry, Release.

## When not to use

- A job that isn't about metadata – use `success`, `failed` or `in-progress`.
- Checking an import's rows cell by cell – use `import-review`.

## Anatomy

1. **Page** `.ui-mcl-page` – the document, with its folded corner `.ui-mcl-fold`
2. **Mark** `.ui-mcl-badge` – the round badge, with the tag drawn on it in ink, in the status's colour
3. **Corner mark** `.ui-mcl-chip` – the state: dots, a cross or a check (none for `required`, which has specks beside it)
4. **Words** `.ui-mcl-caption` – where it stands

## Looks

One look. Colours follow the page theme through `light-dark()`, with a `.dark` class, `data-theme`, `data-tc-theme` or
the system setting, and each status has its own badge colour: amber, blue, red or green. It has no background of its own.

## Keyboard

Nothing to operate. The illustration takes no focus.

## Screen readers

The host is `role="img"`, named by `label` or else by its words, so the stage is announced – and the name changes with `status`. With `caption=""` and no `label` it's decorative and skipped, for when the words beside it say the same. The colours are never the only sign: the words and the corner mark say the same thing.

## Content

Say what's wrong or what happened, and what to do, beside it: "38 records are missing a publisher or a date."

## Do

- Move one illustration through the statuses as the record moves, so it reads as the same thing changing.
- Use your own words with `caption` when your product calls the step something else ("Tags tidied").

## Don't

- Don't use it as the only sign of a failure – say what went wrong in words beside it.
- Don't use it for steps that aren't about metadata.

## Example

```html
<tc-metadata-cleansing status="in-progress"></tc-metadata-cleansing>

<script type="module">
  import "@adamstavely/trenchcoat/metadata-cleansing";
  import "@adamstavely/trenchcoat/tokens.css";
</script>
```

```tsx
import { MetadataCleansing } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function CleansingState({ status }: { status: "required" | "in-progress" | "failed" | "success" }) {
  return <MetadataCleansing status={status} />;
}
```
