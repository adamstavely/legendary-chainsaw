---
pattern: form
status: new
related: dropzone, column-mapper, import-review, data-table
---

## Overview

The first step of importing a spreadsheet: drop the file, and see what was read before anything is imported. CSV and
TSV files are read in the browser – quoted fields, doubled quotes, line breaks inside quotes and Windows line endings
all handled, the delimiter worked out from the first lines. An Excel workbook is the page's to read, through `parse`.
Once read, the card says what it found: the file, its size, how many rows and columns, the delimiter and how the text
was decoded. A preview shows the first rows with each column's type guessed in words – Text, Number, Date, Email or
Empty – and problems are listed in words: rows with a different number of cells, empty columns, a header named twice.
"First row is headers" switches whether the first line holds the names.

## When to use

- Bringing a list kept in a spreadsheet – vendors, contacts, assets – into an app as records.
- Before a column mapping step, so people know the file was read the way they expect.
- When files come from many places and their delimiters, encodings and headers vary.

## When not to use

- Uploading files to keep, not to read – use `dropzone`.
- Matching the file's columns to your fields – that's the next step, `column-mapper`.
- Checking and fixing the rows themselves – use `import-review`.

## Anatomy

1. **Drop area** `.ui-fim__drop` – drop a file or press it to choose one; it says when a file is over it
2. **File** `.ui-fim__file` – the file's name with its size, rows, columns, delimiter and encoding, and Choose another file
3. **Header row** `.ui-fim__check` – “First row is headers”
4. **Problems** `.ui-fim__problems` – each problem in words, or “No problems found”
5. **Preview** `.ui-fim__table` – the first rows, each column with its guessed type under its name
6. **Continue** `.ui-fim__continue` – with how many rows are ready; held while there are none

## Looks

Standard puts the header on the gray tray above a white card, and the summary and Continue on the tray below. Clean is
one white card with hairline dividers and thinner icons; the summary is its last row. `--tc-file-import-preview-h`
sets how tall the preview can grow before it scrolls (320px by default).

## Keyboard

| Key | What it does |
|---|---|
| Tab | Moves through the drop area (or Choose another file), the header-row checkbox, the preview and Continue |
| Enter or Space (on the drop area) | Opens the file picker |
| Space (on the checkbox) | Switches “First row is headers” |
| Arrow keys (on the preview) | Scroll the preview |

## Screen readers

The drop area is a button described by the accepted types (“CSV, TSV or Excel”). A status region says what happened:
“Reading vendors.csv”, then “vendors.csv read: 12 rows, 6 columns, 2 problems”. The problems are a list named by how
many there are. The preview is a scrollable region named by its caption (“First 10 of 412 rows”) holding a real
table: column headers read their name and type (“Contact email, Email”), and each row starts with its line number,
with “different number of cells” added to rows that don't fit. A file that can't be read is announced as an alert.
Continue is `aria-disabled` and described by “No rows to import” until there are rows.

## Content

- Set `heading` and `description` to what the rows will become: “Import vendors” · “Rows become vendor records”.
- Say in your own page copy where the file goes and who sees it; the element only reads it in the browser.
- Keep `preview-rows` small – ten rows is enough to recognise a file.
- Rename the words through `labels` for your product's tone; the defaults are plain.

## Do

- Read Excel through `parse` with the library you already use, and pass back rows of strings.
- Keep the problems visible – a short row is usually a stray comma, and people can fix it at the source.
- Hand `tc-continue`'s columns and rows straight to `column-mapper`.

## Don't

- Don't import on drop; let people see what was read and press Continue.
- Don't hide the header-row switch – exports without headers are common.
- Don't guess types for people silently; show them, as the preview does, so a column read as Text is noticed.

## Example

```html
<tc-file-import id="vendors" heading="Import vendors" description="Rows become vendor records"></tc-file-import>

<script type="module">
  import "@adamstavely/trenchcoat/file-import";
  import "@adamstavely/trenchcoat/tokens.css";

  const el = document.querySelector("#vendors");
  const csv = "Vendor name,Contact email,Country\nKestrel Lab Supplies,orders@kestrel-lab.example,United Kingdom\nHarbour Analytics,accounts@harbour-analytics.example,Netherlands";
  el.file = new File([csv], "vendors.csv", { type: "text/csv" });
  el.addEventListener("tc-parsed", (e) => console.log(e.detail.rows.length, "rows", e.detail.problems));
  el.addEventListener("tc-continue", (e) => console.log("map", e.detail.columns));
</script>
```

```tsx
import { useState } from "react";
import { FileImport, type FileImportResult } from "@adamstavely/trenchcoat/react";
import "@adamstavely/trenchcoat/tokens.css";

export function VendorUpload({ next }: { next: (result: FileImportResult) => void }) {
  const [file, setFile] = useState<File | null>(null);
  return <FileImport title="Import vendors" description="Rows become vendor records" file={file} onFileChange={setFile} onContinue={next} />;
}
```
