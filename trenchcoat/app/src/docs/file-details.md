---
pattern: none
status: new
related: share-panel, team-flag-picker, file-summary, version-history
---

## Overview

One file in one place: what it is, the team's flag on it, what's in it, its versions, and who it's shared with after
their entitlements are checked. It composes `tc-team-flag-picker`, `tc-file-summary`, `tc-version-history` and
`tc-share-panel`.

## When to use

- A file's own page, or a large panel opened from a list of files.
- Files that a team reviews, flags and shares under access rules.

## When not to use

- A row in a list – use `team-flag-picker` on its own.
- Only reading what's in a file – use `file-summary`.
- Only sharing – use `share-panel`.

## Anatomy

1. **Header** `.ui-fld__head` – the preview, name and details
2. **Name** `.ui-fld__name` – the file's name, as the page's heading level 2
3. **Actions** `.ui-fld__actions` – the team's flag and Open
4. **Main** `.ui-fld__main` – the summary and versions, each left out when there's nothing to show
5. **Side** `.ui-fld__side` – sharing, beside the rest on a wide page and below it on a narrow one

## Looks

The composed components follow Standard or Clean. A page can set `--tc-fld-preview`.

## Keyboard

The header's controls come first, then each section in turn. See `team-flag-picker`, `file-summary`, `version-history`
and `share-panel` for what each one does.

## Screen readers

The file's name is a heading, the preview is decorative, and Open names the file. Each section announces what it does
itself, including who isn't authorized in the share panel.

## Content

Give `size`, `owner` and `modified` where you have them, so people can tell they've got the right file. Open a file's
`preview` only from a source you trust; unsafe URLs are dropped.

## Do

- Use the same `flags` here as in your file lists.
- Listen for `tc-share` here: it bubbles from the panel, and `preventDefault()` keeps `access` until the server accepts.
- Enforce entitlements on the server. The panel only tells the person sharing what to expect.

## Don't

- Don't nest it inside another card. Each section is already its own card.

## Example

```html
<tc-file-details id="file" flag="review"></tc-file-details>

<script type="module">
  import "trenchcoat/file-details";
  import "trenchcoat/tokens.css";

  const details = document.querySelector("#file");
  details.file = { name: "Trial 12 results.pdf", size: 2400000, owner: "Noor Haddad" };
  details.flags = [{ id: "review", label: "Needs review", color: "#CA8A04" }];
  details.directory = [{ id: "noor", kind: "person", name: "Noor Haddad" }];
  details.checkEntitlement = async () => ({ status: "allowed" });
  details.addEventListener("tc-flag-change", (e) => console.log(e.detail.flag));
</script>
```

```tsx
import { FileDetails } from "trenchcoat/react";
import "trenchcoat/tokens.css";

export function ResultsFile() {
  return (
    <FileDetails
      file={{ name: "Trial 12 results.pdf", size: 2400000, owner: "Noor Haddad" }}
      flags={[{ id: "review", label: "Needs review", color: "#CA8A04" }]}
      defaultFlag="review"
      directory={[{ id: "noor", kind: "person", name: "Noor Haddad" }]}
      checkEntitlement={async () => ({ status: "allowed" })}
    />
  );
}
```
